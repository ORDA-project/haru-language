const express = require("express");
const multer = require("multer");
const { detectText } = require("../services/visionService");
const { generateExamples } = require("../services/gptService");
const { getExamplesByUserId } = require("../services/historyService");
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
  const { userId } = req.session.user;

  console.log(req.session.user);

  console.log(userId);

  if (!userId) {
    // userId가 없을 경우 에러 반환
    return res.status(400).json({ message: "userId는 필수입니다." });
  }

  try {
    // Step 1: OCR 처리
    const extractedText = await detectText(filePath);

    // Step 2: GPT API로 예문 생성
    const gptResponse = await generateExamples(extractedText, userId);



    // 업로드된 파일 삭제
    fs.unlinkSync(filePath);

    // 최종 결과 반환
    res.send({
      extractedText, // 추출된 텍스트 반환
      generatedExample: gptResponse,
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

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const examples = await getExamplesByUserId(userId);

    if (!examples.length) {
      return res.status(404).json({ message: '해당 유저의 예문이 없습니다.' });
    }

    res.status(200).json({
      message: '예문 조회 성공',
      data: examples,
    });
  } catch (error) {
    console.error('예문 조회 API 오류:', error.message);
    res.status(500).json({
      message: '예문 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

module.exports = router;