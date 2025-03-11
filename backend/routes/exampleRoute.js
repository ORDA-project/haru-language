const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { detectText } = require("../services/ocrService");
const { generateExamples } = require("../services/exampleService");
const { getExamplesByUserId } = require("../services/historyService");
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

// OCR → GPT 예문 생성 API
router.post("/", upload.single("image"), async (req, res) => {
  console.log("File uploaded:", req.file);
  const filePath = req.file.path;
  const { userId } = req.session.user;

  if (!userId) {
    return res.status(400).json({ message: "userId는 필수입니다." });
  }

  try {
    // Step 1: OCR 처리
    const extractedText = await detectText(filePath);

    // Step 2: GPT API로 예문 생성
    const gptResponse = await generateExamples(extractedText, userId);

    // 업로드된 파일 삭제
    fs.unlinkSync(filePath);

    res.send({
      extractedText, // OCR 결과
      generatedExample: gptResponse, // GPT 응답 결과
    });
  } catch (error) {
    console.error("Error generating examples:", error);

    // 파일 삭제
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).send({ message: "Error generating examples", error });
  }
});

// 사용자 ID로 예문 조회 API
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const examples = await getExamplesByUserId(userId);

    if (!examples.length) {
      return res.status(404).json({ message: "해당 유저의 예문이 없습니다." });
    }

    res.status(200).json({
      message: "예문 조회 성공",
      data: examples,
    });
  } catch (error) {
    console.error("예문 조회 API 오류:", error.message);
    res.status(500).json({
      message: "예문 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

module.exports = router;
