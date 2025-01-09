const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

const corsConfig = require("./config/corsConfig"); // CORS 설정 가져오기
const socialLoginRoutes = require("./routes/socialLoginRoute"); // 소셜 로그인 라우트
const homeRoutes = require("./routes/homeRoute"); // 홈화면 라우트
const exampleRoutes = require("./routes/exampleRoute"); // 예문생성 라우트
const questionRoutes = require("./routes/questionRoute");
const ttsRoutes = require("./routes/ttsRoute");
const recommandRoutes = require("./routes/recommandRoute");
<<<<<<< HEAD
const songLyricRoutes = require('./routes/songLyricRoute');
const songYoutubeRoutes = require("./routes/songYoutubeRoute");
=======
const quizRoutes = require("./routes/quizRoute");
>>>>>>> 34411ed6af519c783687e85648d797ef857038bc


const { sequelize } = require("./models"); // Sequelize 인스턴스 가져오기

const app = express();
const port = process.env.PORT || 8000;


// JSON 본문 파싱을 위한 미들웨어 추가
app.use(express.json());

// CORS 활성화
app.use(cors(corsConfig));

<<<<<<< HEAD
app.use(cors({
  origin: 'http://localhost:3000', // 프런트엔드 도메인
  credentials: true,  // 쿠키를 사용하려면 이 옵션도 활성화
}));
=======
app.use(
  cors({
    origin: "http://localhost:8000", // 프런트엔드 도메인
    credentials: true, // 쿠키를 사용하려면 이 옵션도 활성화
  })
);
>>>>>>> 34411ed6af519c783687e85648d797ef857038bc

// 세션 설정
app.use(
  session({
    key: "user_sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore({ // MySQL 기반 세션 저장소 설정
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      clearExpired: true, // 만료된 세션 자동 삭제
      checkExpirationInterval: 1000 * 60 * 10, // 10분마다 만료된 세션 삭제
      expiration: 1000 * 60 * 10, // 세션 만료 시간: 10분
    }),
    cookie: {
      maxAge: 1000 * 60 * 10, // 쿠키 만료 시간: 10분
      httpOnly: true,
      secure: false, // HTTPS를 사용할 경우 true로 설정
      domain: "localhost", // 쿠키 도메인 설정
    },
  })
);
// 세션 체크 미들웨어
app.use((req, res, next) => {
  console.log("세션 상태 확인:", req.session.user);
  if (req.session.user || req.path === "/" || req.path.startsWith("/auth")) {
    // 세션이 존재하거나 소개 페이지("/")는 통과
    next();
  } else {
    // 세션이 없으면 소개 페이지로 리다이렉트
    res.redirect("http://localhost:3000");
  }
});

// 소셜 로그인 라우트 등록
app.use("/auth", socialLoginRoutes);

// 홈화면 라우트 등록
app.use("/home", homeRoutes); 

// 노래 가사 라우트 등록
app.use('/songLyric', songLyricRoutes);

// 유튜브 노래 검색 라우트 등록
app.use("/songYoutube", songYoutubeRoutes);

// 예문 생성 라우트 등록
app.use("/example", exampleRoutes);

// 질문 생성 라우트 등록
app.use("/question", questionRoutes);

//추천-명언, 노래
app.use("/recommand", recommandRoutes);

app.use("/quiz", quizRoutes);

// TTS 라우트 등록
app.use("/api", ttsRoutes);

// 상태 확인용 홈 라우트 (아마 이게 소개페이지가 될 것 같음)
app.get("/", (req, res) => {
  res.status(200).send("Backend server is running.");
});

// Sequelize 동기화
(async () => {
  try {
    await sequelize.sync({ force: false }); // 기존 데이터 유지 (force: true 사용 시 데이터 초기화됨)
    console.log("모든 테이블이 성공적으로 동기화되었습니다!");

    // 서버 실행
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("테이블 동기화 실패:", error);
    process.exit(1); // 동기화 실패 시 서버 종료
  }
})();

//set GOOGLE_APPLICATION_CREDENTIALS=./config/google-cloud-key.json
//$env:GOOGLE_APPLICATION_CREDENTIALS="./config/google-cloud-key.json"
