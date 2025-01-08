const express = require("express");
const cors = require("cors");
require("dotenv").config();

const corsConfig = require("./config/corsConfig"); // CORS 설정 가져오기
const exampleRoutes = require("./routes/exampleRoute"); // 예문생성 라우트
const questionRoutes = require("./routes/questionRoute");
const ttsRoutes = require("./routes/ttsRoute");
const recommandRoutes = require("./routes/recommandRoute");

const { sequelize } = require("./models"); // Sequelize 인스턴스 가져오기

const app = express();
const port = 3000;

// JSON 본문 파싱을 위한 미들웨어 추가
app.use(express.json());

// CORS 활성화
app.use(cors(corsConfig));

// 업로드 라우트 등록
app.use("/example", exampleRoutes);
app.use("/question", questionRoutes);
app.use("/recommand", recommandRoutes);

app.use("/api", ttsRoutes);


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


//set GOOGLE_APPLICATION_CREDENTIALS=.\config\google-cloud-key.json
//$env:GOOGLE_APPLICATION_CREDENTIALS=".\config\google-cloud-key.json"