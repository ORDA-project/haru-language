require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MySQLStore = require("express-mysql-session")(session);
const swaggerUi = require("swagger-ui-express");
const basicAuth = require("express-basic-auth");
const dns = require("dns");

const corsConfig = require("./config/corsConfig");
const { swaggerSpec } = require("./config/swagger");
const routes = require("./routes");
const { sequelize } = require("./models");

dns.setDefaultResultOrder("ipv4first");

const PROD = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 8000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const LOG_LEVEL = process.env.LOG_LEVEL || (PROD ? "warn" : "debug");

const LEVELS = ["debug", "info", "warn", "error"];
const allow = (lvl) => LEVELS.indexOf(lvl) >= LEVELS.indexOf(LOG_LEVEL);
const log = {
  debug: (...args) => allow("debug") && console.debug(...args),
  info: (...args) => allow("info") && console.info(...args),
  warn: (...args) => allow("warn") && console.warn(...args),
  error: (...args) => console.error(...args),
};

const app = express();
app.set("trust proxy", 1);

const requestsPerWindow = Number(process.env.RATE_LIMIT_MAX || 120);

const requestLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  limit: requestsPerWindow,
  max: requestsPerWindow,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      error: "Too many requests",
      timestamp: new Date().toISOString(),
    }),
});

const REQUEST_LIMIT = process.env.REQUEST_LIMIT || "10mb";

const parseDatabaseUrl = (urlStr) => {
  try {
    const url = new URL(urlStr);
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false },
    };
  } catch {
    return null;
  }
};

const resolveSessionConnection = () => {
  if (process.env.DATABASE_URL) {
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
    if (parsed) {
      return parsed;
    }
  }

  if (!process.env.DB_HOST || !process.env.DB_NAME) {
    return null;
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: PROD ? { rejectUnauthorized: false } : undefined,
  };
};

const sessionConnection = resolveSessionConnection();
let sessionStore;

if (sessionConnection) {
  sessionStore = new MySQLStore({
    ...sessionConnection,
    clearExpired: true,
    checkExpirationInterval: 1000 * 60 * 60, // 1시간
    expiration: 1000 * 60 * 60 * 24 * 7, // 7일
  });
} else {
  log.warn("세션 저장소를 초기화하지 못했습니다. MemoryStore를 사용합니다.");
}

const sessionSecret = process.env.SESSION_SECRET || (!PROD && "dev-secret-key-change-in-production");

if (!sessionSecret) {
  throw new Error("SESSION_SECRET 환경 변수를 설정해야 합니다.");
}

const sessionConfig = {
  name: "user_sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: PROD,
    sameSite: PROD ? "none" : "lax",
  },
};

if (sessionStore) {
  sessionConfig.store = sessionStore;
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(hpp());
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(express.json({ limit: REQUEST_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_LIMIT }));
app.use(cookieParser());
app.use(session(sessionConfig));

if (!PROD) {
  app.use((req, _res, next) => {
    log.debug(`[REQUEST] ${req.method} ${req.originalUrl}`);
    next();
  });
}

const limitedPaths = ["/auth", "/home", "/userDetails", "/friends", "/example", "/question", "/writing", "/api"];
app.use(limitedPaths, requestLimiter);

const { authenticateToken } = require("./utils/jwt");

const bypassPaths = [
  "/",
  "/auth",
  "/health",
  "/healthz",
  "/health/db",
  "/swagger-test-login",
  "/api-docs",
  "/api/tts",
];

// JWT 인증 미들웨어 적용
app.use((req, res, next) => {
  // 경로 매칭: 정확히 일치하거나, 경로가 prefix로 시작하고 다음 문자가 '/'이거나 끝인 경우
  const shouldBypass = bypassPaths.some((path) => {
    if (req.path === path) {
      return true;
    }
    // 루트 경로('/')는 정확히 일치하는 경우만 bypass
    if (path === "/") {
      return false;
    }
    // 다른 경로는 prefix로 시작하는 경우 bypass
    return req.path.startsWith(path + "/") || req.path.startsWith(path + "?");
  });

  // GET /writing/questions는 인증 없이 접근 가능 (공개 API)
  if (req.method === "GET" && req.path === "/writing/questions") {
    return next();
  }

  if (shouldBypass) {
    return next();
  }

  // JWT 인증 미들웨어 사용
  authenticateToken(req, res, next);
});

if (process.env.SWAGGER_ENABLED !== "false") {
  const swaggerAuthMiddleware = PROD
    ? basicAuth({
        users: {
          [process.env.SWAGGER_USER || "admin"]: process.env.SWAGGER_PASS || "change-this-password",
        },
        challenge: true,
        realm: "Soksok Language Docs",
      })
    : (_req, _res, next) => next();

  app.use(
    "/api-docs",
    swaggerAuthMiddleware,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        withCredentials: true,
        persistAuthorization: true,
      },
      customSiteTitle: "Soksok Language API Docs",
    })
  );

  log.info(`Swagger UI available at: ${SERVER_URL}/api-docs`);
}

app.get("/healthz", (_req, res) => res.status(200).send("OK"));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    await sequelize.query("SELECT 1 as health_check");
    res.json({
      ok: true,
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Database health check failed:", error.message);
    res.status(500).json({
      ok: false,
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/", routes);

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "백엔드 서버가 실행 중입니다.",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

const { logError, getUserFriendlyMessage, getStatusCode } = require("./middleware/errorHandler");

app.use((err, req, res, next) => {
  // 보안: 안전한 에러 로깅
  logError(err, {
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
  });

  if (res.headersSent) {
    return next(err);
  }

  // 보안: 프로덕션에서는 상세한 에러 정보를 노출하지 않음
  const statusCode = getStatusCode(err);
  const errorResponse = {
    error: getUserFriendlyMessage(err, "An error occurred"),
    timestamp: new Date().toISOString(),
    ...(PROD ? {} : { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    log.info("Database connection established successfully");

    await sequelize.sync({ force: false });
    log.info("Database synchronized successfully");

    app.listen(PORT, () => {
      if (PROD) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Server ready");
        }
      } else {
        log.info(`서버가 실행 중입니다: ${SERVER_URL}`);
        log.info(`헬스체크: ${SERVER_URL}/health`);
      }
    });
  } catch (error) {
    log.error("서버 시작 실패:", error);
    process.exit(1);
  }
};

startServer();

const gracefulShutdown = async (signal) => {
  log.info(`${signal} received, shutting down gracefully`);
  try {
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    log.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));