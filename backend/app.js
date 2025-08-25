const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

const corsConfig = require("./config/corsConfig");
const { swaggerUi, specs } = require("./config/swagger");
const routes = require("./routes");
const { sequelize } = require("./models");

const app = express();
const PORT = process.env.PORT || 8000;

// JSON 요청 파싱, 쿠키 파싱, CORS 설정
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsConfig));

// MySQL 기반 세션 저장소 설정
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 1000 * 60 * 60,
  expiration: 1000 * 60 * 60,
});

// 세션 설정
app.use(
  session({
    key: "user_sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 10,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// 로그인 상태 확인 (미인증 사용자는 프론트엔드로 리디렉트)
app.use((req, res, next) => {
  if (
    req.session.user ||
    req.path === "/" ||
    req.path.startsWith("/auth") ||
    req.path.startsWith("/api-docs")
  ) {
    return next();
  }

  // 리퍼러에서 origin 정보를 가져와서 적절한 프론트엔드 URL로 리디렉트
  const referer = req.get("Referer") || req.headers.origin;
  let redirectUrl = "https://orda-project.github.io/haru-language" || "http://localhost:3000";

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const origin = `${refererUrl.protocol}//${refererUrl.host}`;

      // 허용된 도메인인지 확인
      const allowedOrigins = [
        "http://localhost:3000",
        "https://orda-project.github.io/haru-language",
      ];

      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        redirectUrl = origin;
      }
    } catch (err) {
      console.warn("Invalid referer URL:", referer);
    }
  }

  res.redirect(redirectUrl);
});

// Swagger 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// 라우터 연결
app.use("/", routes);

// 상태 확인용 라우트
app.get("/", (req, res) => {
  res.status(200).send("백엔드 서버가 실행 중입니다.");
});

// DB 동기화 후 서버 시작
(async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("모든 테이블이 성공적으로 동기화되었습니다.");

    app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("테이블 동기화 실패:", error);
    process.exit(1);
  }
})();
