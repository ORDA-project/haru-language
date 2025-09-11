const express = require("express");
const multer = require("multer");
const fs = require("fs").promises;
const { detectText } = require("../services/ocrService");
const generateExamples = require("../services/exampleService");
const { getExamplesByUserId } = require("../services/historyService");
const { User } = require("../models");
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

// 파일 삭제 헬퍼 함수
const cleanupFile = async (filePath) => {
  if (!filePath) return;
  
  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted temp file: ${filePath}`);
  } catch (err) {
    console.error(`Critical: Failed to delete temp file: ${filePath}`, err);
    // 필요시 여기서 알림 시스템이나 로그 수집 시스템 연동
  }
};

/**
 * @openapi
 * /example:
 *   post:
 *     summary: Generate examples from uploaded image using OCR and GPT
 *     tags:
 *       - Example
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to process
 *     responses:
 *       200:
 *         description: Examples generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 extractedText:
 *                   type: string
 *                   example: "Hello world"
 *                 generatedExample:
 *                   type: object
 *                   description: GPT-generated examples
 *       400:
 *         description: User not logged in or invalid file
 *       500:
 *         description: Error processing image or generating examples
 */
router.post("/", upload.single("image"), async (req, res) => {
  let filePath = null;
  
  try {
    // 파일 업로드 검증
    if (!req.file) {
      return res.status(400).json({ message: "이미지 파일이 필요합니다." });
    }
    
    filePath = req.file.path;
    console.log("File uploaded:", req.file);
    
    // 사용자 세션 검증
    const sessionUser = req.session.user;
    if (!sessionUser?.userId) {
      await cleanupFile(filePath);
      return res.status(400).json({ message: "로그인이 필요합니다" });
    }

    // Step 1: OCR 처리
    const extractedText = await detectText(filePath);
    
    // 추출된 텍스트 검증
    if (!extractedText || extractedText.trim().length === 0) {
      await cleanupFile(filePath);
      return res.status(400).json({ 
        message: "이미지에서 텍스트를 추출할 수 없습니다." 
      });
    }

    // Step 2: GPT API로 예문 생성 (세션의 userId를 직접 사용)
    const gptResponse = await generateExamples(extractedText, sessionUser.userId);

    // 성공적으로 처리 완료 후 파일 삭제
    await cleanupFile(filePath);

    res.status(200).json({
      extractedText,
      generatedExample: gptResponse,
    });
    
  } catch (error) {
    console.error("Error generating examples:", error);
    
    // 에러 발생 시 파일 정리
    await cleanupFile(filePath);
    
    // 구체적인 에러 메시지 제공
    let errorMessage = "예문 생성 중 오류가 발생했습니다.";
    
    if (error.message.includes("OCR")) {
      errorMessage = "이미지 텍스트 인식에 실패했습니다.";
    } else if (error.message.includes("GPT") || error.message.includes("API")) {
      errorMessage = "예문 생성 서비스에 일시적인 문제가 있습니다.";
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

/**
 * @openapi
 * /example/{userId}:
 *   get:
 *     summary: Get examples by user ID (uses social_id)
 *     tags:
 *       - Example
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: "test123"
 *         description: User's social_id
 *     responses:
 *       200:
 *         description: Examples retrieved successfully
 *       404:
 *         description: No examples found for this user
 *       500:
 *         description: Server error
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;  // social_id가 들어옴
    
    // 입력 검증
    if (!userId || userId.trim().length === 0) {
      return res.status(400).json({ message: "사용자 ID가 필요합니다." });
    }

    // social_id로 실제 user 찾기
    const user = await User.findOne({ where: { social_id: userId } });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 실제 DB id로 예문 조회
    const examples = await getExamplesByUserId(user.id);

    // examples가 null이거나 undefined일 수 있으므로 안전하게 처리
    const safeExamples = examples || [];

    // 성공 응답 (빈 배열이어도 200 반환)
    res.status(200).json({
      message: safeExamples.length > 0 ? "예문 조회 성공" : "해당 사용자의 예문이 없습니다.",
      data: safeExamples,
      count: safeExamples.length
    });
    
  } catch (error) {
    console.error("예문 조회 API 오류:", error.message);
    
    res.status(500).json({
      message: "예문 조회 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 에러 핸들러 미들웨어 (multer 에러 처리)
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: "파일 크기는 5MB 이하여야 합니다." });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: "예상치 못한 파일 필드입니다." });
    }
  }
  
  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({ message: "이미지 파일만 업로드 가능합니다." });
  }
  
  console.error("Multer error:", error);
  res.status(500).json({ message: "파일 업로드 중 오류가 발생했습니다." });
});

module.exports = router;