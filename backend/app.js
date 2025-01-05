const express = require("express");
const cors = require("cors");
require("dotenv").config();

const corsConfig = require("./config/corsConfig"); // CORS 설정 가져오기
const exampleRoutes = require("./routes/exampleRoute"); // 예문생성 라우트
const ttsRoutes = require("./routes/ttsRoute");

const app = express();
const port = 3000;

// JSON 본문 파싱을 위한 미들웨어 추가
app.use(express.json());

// CORS 활성화
app.use(cors(corsConfig));

// 업로드 라우트 등록
app.use("/example", exampleRoutes);
app.use("/api", ttsRoutes);

// 서버 실행
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

//set GOOGLE_APPLICATION_CREDENTIALS=.\config\google-cloud-key.json
//$env:GOOGLE_APPLICATION_CREDENTIALS=".\config\google-cloud-key.json"