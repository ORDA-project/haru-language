require("dotenv").config();

const express = require("express");
const cors = require("cors");
const corsConfig = require("./config/corsConfig"); 
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MySQLStore = require("express-mysql-session")(session);
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const PROD = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 8000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
const LOG_LEVEL = process.env.LOG_LEVEL || (PROD ? "warn" : "debug");

const LEVELS = ["debug", "info", "warn", "error"];
const allow = (lvl) => LEVELS.indexOf(lvl) >= LEVELS.indexOf(LOG_LEVEL);
const log = {
  debug: (...a) => allow("debug") && console.debug(...a),
  info:  (...a) => allow("info")  && console.info(...a),
  warn:  (...a) => allow("warn")  && console.warn(...a),
  error: (...a) => console.error(...a),
};

const { sequelize } = require("./models");

// Railway/Render DATABASE_URL 파싱(있으면 사용)
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

// 프록시 뒤(HTTPS)에서 secure 쿠키 허용
app.set("trust proxy", 1);

// 본문/쿠키 파서
app.use(express.json());
app.use(cookieParser());

// 화이트리스트 기반 CORS + 프리플라이트 허용
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

// 세션(쿠키는 prod에서 SameSite=None; Secure)
app.use(session({
  key: "user_sid",
  secret: process.env.SESSION_SECRET || "change-me",
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore({
    ...sessionConn,
    clearExpired: true,
    checkExpirationInterval: 1000 * 60 * 60 * 24, // 24시간마다 만료된 세션 정리
    expiration: 1000 * 60 * 60 * 24 * 7, // 7일 = 1000ms * 60초 * 60분 * 24시간 * 7일
  }),
  proxy: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7일 = 1000ms * 60초 * 60분 * 24시간 * 7일
    httpOnly: true,
    secure: PROD,
    sameSite: PROD ? "none" : "lax",
  },
}));

// 인증 필요 없는 경로 허용
app.use((req, res, next) => {
  if (
    req.session.user ||
    req.path === "/" ||
    req.path.startsWith("/auth") ||
    req.path.startsWith("/health")
  ) return next();
  return res.status(401).json({ error: "Unauthorized" });
});

// 헬스체크
app.get("/healthz", (_req, res) => res.status(200).send("OK"));
app.get("/health", (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "dev" }));
app.get("/health/db", async (_req, res) => {
  try { await sequelize.query("SELECT 1"); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 라우팅
const routes = require("./routes");
app.use("/", routes);
app.get("/", (_req, res) => res.status(200).send("백엔드 서버가 실행 중입니다."));

// 서버 시작(dev는 sync, prod는 마이그레이션으로 관리: Start 명령에서 실행)
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
