const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

const corsConfig = require("./config/corsConfig");
const socialLoginRoutes = require("./routes/socialLoginRoute");
const homeRoutes = require("./routes/homeRoute");
const exampleRoutes = require("./routes/exampleRoute");
const questionRoutes = require("./routes/questionRoute");
const ttsRoutes = require("./routes/ttsRoute");
const recommandRoutes = require("./routes/recommandRoute");
const songLyricRoutes = require('./routes/songLyricRoute');
const songYoutubeRoutes = require("./routes/songYoutubeRoute");
const quizRoutes = require("./routes/quizRoute");


const { sequelize } = require("./models");

const app = express();
const port = process.env.PORT || 8000;

// JSON 본문 파싱
app.use(express.json());

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
      checkExpirationInterval: 1000 * 60 * 1440, //하루루
      expiration: 1000 * 60 * 1440,
    }),
    cookie: {
      maxAge: 1000 * 60 * 1440,
      httpOnly: true,
      secure: false,
    },
  })
);

// 세션 체크 미들웨어
app.use((req, res, next) => {
  console.log("세션 상태 확인:", req.session.user);
  if (req.session.user || req.path === "/" || req.path.startsWith("/auth")) {
    next();
  } else {
    res.redirect("http://localhost:3000");
  }
});

// 라우트 설정
app.use("/auth", socialLoginRoutes);
app.use("/home", homeRoutes);
app.use('/songLyric', songLyricRoutes);
app.use("/songYoutube", songYoutubeRoutes);
app.use("/example", exampleRoutes);
app.use("/question", questionRoutes);
app.use("/recommand", recommandRoutes);
app.use("/quiz", quizRoutes);
app.use("/api", ttsRoutes);

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