require("dotenv").config();

const express = require("express");
const cors = require("cors");
const corsConfig = require("./config/corsConfig");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MySQLStore = require("express-mysql-session")(session);
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const basicAuth = require("express-basic-auth");

const PROD = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 8000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
const LOG_LEVEL = process.env.LOG_LEVEL || (PROD ? "warn" : "debug");

const LEVELS = ["debug", "info", "warn", "error"];
const allow = (lvl) => LEVELS.indexOf(lvl) >= LEVELS.indexOf(LOG_LEVEL);
const log = {
  debug: (...a) => allow("debug") && console.debug(...a),
  info: (...a) => allow("info") && console.info(...a),
  warn: (...a) => allow("warn") && console.warn(...a),
  error: (...a) => console.error(...a),
};

const { sequelize } = require("./models");

// Railway/Render DATABASE_URL 파싱
function parseDatabaseUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false },
    };
  } catch { 
    return null; 
  }
}

const urlCfg = process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : null;
const sessionConn = urlCfg || {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
};

const app = express();

app.set("trust proxy", 1);

// 미들웨어 설정
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

// 세션 설정
app.use(session({
  key: "user_sid",
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore({
    ...sessionConn,
    clearExpired: true,
    checkExpirationInterval: 1000 * 60 * 60 * 24, // 24시간마다 정리
    expiration: 1000 * 60 * 60 * 24 * 7, // 7일 후 만료
  }),
  proxy: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    httpOnly: true,
    secure: PROD,
    sameSite: PROD ? "none" : "lax",
  },
}));

// 인증 미들웨어 개선
app.use((req, res, next) => {
  if (!PROD) {
    log.debug(`Request: ${req.method} ${req.path}`);
  }

  const bypassPaths = [
    "/",
    "/auth",
    "/health",
    "/healthz",
    // 개발환경에서만 추가 경로
    ...(PROD ? [] : ["/api-docs", "/swagger-test-login"])
  ];

  const shouldBypass = bypassPaths.some(path => req.path.startsWith(path));

  if (shouldBypass || req.session.user) {
    if (!PROD && req.session.user) {
      log.debug(`Authenticated user: ${req.session.user.name} (${req.session.user.social_id})`);
    }
    return next();
  }

  log.warn(`Unauthorized access attempt: ${req.method} ${req.path}`);
  return res.status(401).json({ 
    error: "Unauthorized", 
    message: "로그인이 필요합니다." 
  });
});

// Swagger UI 설정
if (process.env.SWAGGER_ENABLED !== "false") {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Haru Language API",
        version: "1.0.0",
        description: "API documentation for Haru Language backend",
      },
      servers: [{ url: SERVER_URL }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "user_sid"
          }
        }
      },
      security: [{ cookieAuth: [] }]
    },
    apis: ["./routes/*.js"],
  };

  const swaggerSpec = swaggerJsdoc(options);

  // 운영환경에서는 Basic Auth 보호
  const maybeAuth = PROD
    ? basicAuth({
        users: { 
          [process.env.SWAGGER_USER || "admin"]: process.env.SWAGGER_PASS || "change-this-password" 
        },
        challenge: true,
        realm: "Swagger Documentation"
      })
    : (req, res, next) => next();

  app.use(
    "/api-docs",
    maybeAuth,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        withCredentials: true,
        persistAuthorization: true
      },
      customSiteTitle: "Haru Language API Docs"
    })
  );

  log.info(`Swagger UI available at: ${SERVER_URL}/api-docs`);
}

// 헬스체크 엔드포인트
app.get("/healthz", (_req, res) => res.status(200).send("OK"));

app.get("/health", (_req, res) => {
  res.json({ 
    ok: true, 
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/health/db", async (_req, res) => {
  try { 
    await sequelize.query("SELECT 1 as health_check"); 
    res.json({ 
      ok: true, 
      database: "connected",
      timestamp: new Date().toISOString()
    }); 
  } catch (e) { 
    log.error("Database health check failed:", e.message);
    res.status(500).json({ 
      ok: false, 
      database: "disconnected", 
      error: e.message,
      timestamp: new Date().toISOString()
    }); 
  }
});

// 라우팅
const routes = require("./routes");
app.use("/", routes);

// 루트 경로
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "백엔드 서버가 실행 중입니다.",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  log.error("Unhandled error:", err);
  
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    error: PROD ? "Internal Server Error" : err.message,
    ...(PROD ? {} : { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
(async () => {
  try {
    // 개발환경에서만 DB 동기화
    if (!PROD) {
      await sequelize.sync({ force: false });
      log.info("Database synchronized successfully");
    }
    
    // DB 연결 테스트
    await sequelize.authenticate();
    log.info("Database connection established successfully");
    
    app.listen(PORT, () => {
      if (PROD) {
        console.log("ready"); // 배포 환경에서 간단한 로그
      } else {
        log.info(`서버가 실행 중입니다: ${SERVER_URL}`);
        log.info(`Swagger 문서: ${SERVER_URL}/api-docs`);
        log.info(`헬스체크: ${SERVER_URL}/health`);
      }
    });
  } catch (err) {
    log.error("서버 시작 실패:", err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down gracefully');
  try {
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    log.error('Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  log.info('SIGINT received, shutting down gracefully');
  try {
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    log.error('Error during shutdown:', err);
    process.exit(1);
  }
});