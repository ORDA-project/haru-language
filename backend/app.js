require("dotenv").config();

// 필수 환경변수 검증 
const requiredEnvVars = ['YOUTUBE_API_KEY', 'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
requiredEnvVars.forEach(key => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});
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
  } catch { return null; }
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

app.use(express.json());
app.use(cookieParser());

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

app.use(session({
  key: "user_sid",
  secret: process.env.SESSION_SECRET || "dev-secret-key",
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore({
    ...sessionConn,
    clearExpired: true,
    checkExpirationInterval: 1000 * 60 * 60 * 24,
    expiration: 1000 * 60 * 60 * 24 * 7,
  }),
  proxy: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: PROD,
    sameSite: PROD ? "none" : "lax",
  },
}));

// 인증 미들웨어
app.use((req, res, next) => {
  if (!PROD) {
    console.log(`Request: ${req.method} ${req.path}`);
  }

  const bypassPaths = [
    "/",
    "/auth",
    "/health",
    // 개발환경에서만 추가 경로
    ...(PROD ? [] : ["/api-docs", "/swagger-test-login"])
  ];

  const shouldBypass = bypassPaths.some(path => req.path.startsWith(path));

  if (shouldBypass || req.session.user) {
    if (!PROD) {
      console.log(`Access allowed for: ${req.path}`);
    }
    return next();
  }

  if (!PROD) {
    console.log(`Access denied for: ${req.path}`);
  }
  return res.status(401).json({ error: "Unauthorized" });
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
    },
    apis: ["./routes/*.js"],
  };

  const swaggerSpec = swaggerJsdoc(options);

  // 운영환경에서는 Basic Auth 보호
  const maybeAuth = PROD
    ? basicAuth({
        users: { [process.env.SWAGGER_USER || "admin"]: process.env.SWAGGER_PASS || "password" },
        challenge: true,
      })
    : (req, res, next) => next();

  app.use(
    "/api-docs",
    maybeAuth,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        withCredentials: true
      }
    })
  );
}

// 헬스체크
app.get("/healthz", (_req, res) => res.status(200).send("OK"));
app.get("/health", (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "dev" }));
app.get("/health/db", async (_req, res) => {
  try { 
    await sequelize.query("SELECT 1"); 
    res.json({ ok: true }); 
  } catch (e) { 
    res.status(500).json({ ok: false, error: e.message }); 
  }
});

// 라우팅
const routes = require("./routes");
app.use("/", routes);
app.get("/", (_req, res) => res.status(200).send("백엔드 서버가 실행 중입니다."));

// 서버 시작
(async () => {
  try {
    if (!PROD) {
      await sequelize.sync({ force: false });
      log.info("[DEV] sequelize.sync 완료");
    }
    app.listen(PORT, () => {
      if (PROD) console.log("ready");
      else log.info(`서버 실행 중: ${SERVER_URL}`);
    });
  } catch (err) {
    log.error("서버 시작 실패:", err);
    process.exit(1);
  }
})();