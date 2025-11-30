const express = require("express");
const multer = require("multer");
const fs = require("fs").promises;
const { detectText } = require("../services/ocrService");
const generateExamples = require("../services/exampleService");
const { getExamplesByUserId } = require("../services/historyService");
const { User } = require("../models");

require("dotenv").config({ path: "../.env" });

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

const cleanupFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
    if (process.env.NODE_ENV !== "production") {
      console.log(`Successfully deleted temp file: ${filePath}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Failed to delete temp file: ${filePath}`, error.message);
    }
  }
};

/**
 * @openapi
 * /example:
 *   post:
 *     summary: Generate examples from uploaded image using OCR and GPT
 *     description: 업로드된 이미지에서 텍스트를 추출한 뒤 사용자 맞춤 예문을 생성합니다.
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
 *                 description: 최대 5MB 이미지 파일
 *     responses:
 *       200:
 *         description: 예문 생성 성공
 *       400:
 *         description: 로그인 필요 혹은 잘못된 파일
 *       500:
 *         description: 서버 오류
 */
router.post("/", upload.single("image"), async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "이미지 파일이 필요합니다." });
    }

    filePath = req.file.path;

    // JWT 인증 사용자 우선, 세션 사용자 백업
    const authenticatedUser = req.user || req.session?.user;
    const userId = authenticatedUser?.userId;

    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const extractedText = await detectText(filePath);

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({ message: "이미지에서 텍스트를 추출할 수 없습니다." });
    }

    const gptResponse = await generateExamples(extractedText, userId);

    // 응답 검증 (generateExamples에서 이미 검증했지만 이중 체크)
    if (!gptResponse?.generatedExample?.examples || gptResponse.generatedExample.examples.length === 0) {
      return res.status(500).json({
        message: "예문 생성에 실패했습니다. 다시 시도해주세요.",
      });
    }

    res.status(200).json({
      extractedText,
      generatedExample: gptResponse,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error generating examples:", error.message);
    }

    let errorMessage = "예문 생성 중 오류가 발생했습니다.";

    if (error.message?.includes("OCR")) {
      errorMessage = "이미지 텍스트 인식에 실패했습니다.";
    } else if (error.message?.includes("GPT") || error.message?.includes("API") || error.message?.includes("GPT 응답")) {
      errorMessage = "예문 생성 서비스에 일시적인 문제가 있습니다.";
    }

    res.status(500).json({
      message: errorMessage,
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  } finally {
    await cleanupFile(filePath);
  }
});

const requireAuthenticatedUser = (req, res) => {
  const user = req.user;
  if (!user?.userId) {
    res.status(401).json({ message: "로그인이 필요합니다." });
    return null;
  }
  return user;
};

const sendExamplesResponse = async (res, userId) => {
  const examples = await getExamplesByUserId(userId);
  const safeExamples = examples || [];

  res.status(200).json({
    message: safeExamples.length ? "예문 조회 성공" : "해당 사용자의 예문이 없습니다.",
    data: safeExamples,
    count: safeExamples.length,
  });
};

// JWT 인증된 사용자 예문 조회 (신규)
router.get("/", async (req, res) => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    await sendExamplesResponse(res, user.userId);
  } catch (error) {
    console.error("예문 조회 API 오류:", error.message);
    res.status(500).json({
      message: "예문 조회 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// 별도 history 경로 제공 (프론트엔드 호환용)
router.get("/history", async (req, res) => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    await sendExamplesResponse(res, user.userId);
  } catch (error) {
    console.error("예문 조회 API 오류:", error.message);
    res.status(500).json({
      message: "예문 조회 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @openapi
 * /example/{userId}:
 *   get:
 *     summary: Get examples by user ID (social_id)
 *     description: 소셜 ID를 실제 사용자로 매핑한 뒤 저장된 예문을 반환합니다.
 *     tags:
 *       - Example
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자의 social_id
 *     responses:
 *       200:
 *         description: 예문 조회 성공
 *       400:
 *         description: 잘못된 사용자 ID
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId?.trim()) {
      return res.status(400).json({ message: "사용자 ID가 필요합니다." });
    }

    const user = await User.findOne({ where: { social_id: userId } });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const examples = await getExamplesByUserId(user.id);
    const safeExamples = examples || [];

    res.status(200).json({
      message: safeExamples.length > 0 ? "예문 조회 성공" : "해당 사용자의 예문이 없습니다.",
      data: safeExamples,
      count: safeExamples.length,
    });
  } catch (error) {
    console.error("예문 조회 API 오류:", error.message);
    res.status(500).json({
      message: "예문 조회 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "파일 크기는 5MB 이하여야 합니다." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
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

