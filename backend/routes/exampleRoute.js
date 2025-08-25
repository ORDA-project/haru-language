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

/**
 * @swagger
 * /example:
 *   post:
 *     summary: 이미지에서 텍스트 추출 후 예문 생성
 *     description: 업로드된 이미지에서 OCR을 통해 텍스트를 추출하고 GPT를 사용하여 예문을 생성합니다
 *     tags: [Examples]
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
 *                 description: 텍스트 추출할 이미지 파일 (최대 5MB)
 *     responses:
 *       200:
 *         description: 예문 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 extractedText:
 *                   type: string
 *                   description: OCR로 추출된 텍스트
 *                   example: "Hello world"
 *                 generatedExample:
 *                   type: object
 *                   description: GPT로 생성된 예문 데이터
 *       400:
 *         description: userId가 필수임 또는 잘못된 파일 형식
 *       500:
 *         description: 예문 생성 중 오류 발생
 */
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

/**
 * @swagger
 * /example/{userId}:
 *   get:
 *     summary: 사용자별 예문 조회
 *     description: 특정 사용자 ID로 저장된 예문 목록을 조회합니다
 *     tags: [Examples]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 예문 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "예문 조회 성공"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: 예문 데이터
 *       404:
 *         description: 해당 유저의 예문이 없음
 *       500:
 *         description: 예문 조회 중 오류 발생
 */
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
