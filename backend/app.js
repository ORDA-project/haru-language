const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const cookieParser = require("cookie-parser");
require("dotenv").config();

const corsConfig = require("./config/corsConfig");
const socialLoginRoutes = require("./routes/socialLoginRoute");
const homeRoutes = require("./routes/homeRoute");
const ttsRoutes = require("./routes/ttsRoute");
const songLyricRoutes = require('./routes/songLyricRoute');
const songYoutubeRoutes = require("./routes/songYoutubeRoute");
const userdetailsRoutes = require("./routes/userdetailsRoute");

const exampleRoutes = require("./routes/exampleRoute");
const questionRoutes = require("./routes/questionRoute");
const writingRoutes = require("./routes/writingRoute");

const { sequelize } = require("./models");

const app = express();
const port = process.env.PORT || 8000;

// JSON 본문 파싱
app.use(express.json());

app.use(cookieParser());

// CORS 활성화
app.use(cors(corsConfig));

app.use(
  cors({
    origin: "http://localhost:3000", // 프런트엔드 도메인
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 허용할 HTTP 메서드
    credentials: true, // 쿠키를 사용하려면 이 옵션도 활성화
  })
);

// 세션 설정
app.use(
  session({
    key: "user_sid",
    secret: process.env.SESSION_SECRET || "default_secret", // 기본값 추가
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      clearExpired: true,
      checkExpirationInterval: 1000 * 60 * 10, // 10분마다 만료된 세션 정리
      expiration: 1000 * 60 * 10, // 10분 후 자동 로그아웃
    }),
    cookie: {
      maxAge: 1000 * 60 * 10,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  })
);

// 세션 체크 미들웨어
app.use((req, res, next) => {
  console.log("세션 상태 확인:", req.session.user);
  console.log("쿠키 상태 확인:", req.cookies);
  if (req.session.user || req.path === "/" || req.path.startsWith("/auth")) {
    next();
  } else {
    res.redirect("http://localhost:3000");
  }
});

// 라우트 설정
app.use("/auth", socialLoginRoutes);
app.use("/home", homeRoutes);
app.use("/userdetails", userdetailsRoutes);
app.use('/songLyric', songLyricRoutes);
app.use("/songYoutube", songYoutubeRoutes);
app.use("/api", ttsRoutes);

app.use("/example", exampleRoutes);
app.use("/question", questionRoutes);
app.use("/writing", writingRoutes);

// 상태 확인용 홈 라우트
app.get("/", (req, res) => {
  res.status(200).send("Backend server is running.");
});

// Sequelize 동기화 및 서버 실행
(async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("모든 테이블이 성공적으로 동기화되었습니다!");
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("테이블 동기화 실패:", error);
    process.exit(1);
  }
})();