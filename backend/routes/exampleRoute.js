const express = require("express");
const multer = require("multer");
const { detectText } = require("../services/visionService");
const { generateExamples } = require("../services/gptService");
const { readTextWithTTS } = require("../services/ttsService");
const fs = require("fs");
require("dotenv").config({ path: "../.env" });

const router = express.Router();

// Multer 설정 (파일 업로드)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// 업로드 및 Vision API 호출 라우트
router.post("/", upload.single("image"), async (req, res) => {
  console.log("File uploaded:", req.file); // 업로드된 파일 정보 확인
  const filePath = req.file.path;

  try {
    // Step 1: OCR 처리
    const extractedText = await detectText(filePath);

    // Step 2: GPT API로 예문 생성
    const gptResponse = await generateExamples(extractedText);

    // Step 3: TTS로 음성 데이터 생성
    const gptResponseText = JSON.stringify(gptResponse, null, 2); // JSON 객체를 문자열로 변환
    const audioContent = await readTextWithTTS(gptResponseText);

    // 업로드된 파일 삭제
    fs.unlinkSync(filePath);

    // MP3 데이터를 클라이언트로 반환
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'inline; filename="tts.mp3"',
    });
    res.send(audioContent);

  } catch (error) {
    console.error("Error detecting text:", error);

    // 파일 삭제
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).send({ message: "Error detecting text", error });
  }
});

module.exports = router;
