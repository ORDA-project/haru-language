const express = require("express");
const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
const { detectText } = require("../services/ocrService");
const generateExamples = require("../services/exampleService");
const { deleteExample } = require("../services/exampleService");
const { getExamplesByUserId } = require("../services/historyService");
const { User } = require("../models");

const router = express.Router();

// uploads 디렉토리 확인 및 생성
const uploadsDir = path.join(__dirname, "..", "uploads");
const exampleImagesDir = path.join(__dirname, "..", "uploads", "examples");
const chatImagesDir = path.join(__dirname, "..", "uploads", "chat");
(async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error("uploads 디렉토리 생성 실패:", error.message);
    }
  }
  // 예문 이미지 저장 디렉토리 생성
  try {
    await fs.access(exampleImagesDir);
  } catch {
    try {
      await fs.mkdir(exampleImagesDir, { recursive: true });
    } catch (error) {
      console.error("exampleImages 디렉토리 생성 실패:", error.message);
    }
  }
  // 채팅 이미지 저장 디렉토리 생성
  try {
    await fs.access(chatImagesDir);
  } catch {
    try {
      await fs.mkdir(chatImagesDir, { recursive: true });
    } catch (error) {
      console.error("chatImages 디렉토리 생성 실패:", error.message);
    }
  }
})();

const upload = multer({
  dest: uploadsDir,
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

// 이미지를 영구 저장하고 URL 반환 (예문용)
const saveImagePermanently = async (tempFilePath, userId, exampleId) => {
  try {
    const fileExt = path.extname(tempFilePath);
    const fileName = `example_${userId}_${exampleId}_${Date.now()}${fileExt}`;
    const permanentPath = path.join(exampleImagesDir, fileName);
    
    // 임시 파일을 영구 저장소로 이동
    await fs.copyFile(tempFilePath, permanentPath);
    
    // URL 생성 (프로덕션에서는 실제 도메인 사용)
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/examples/${fileName}`;
    
    return imageUrl;
  } catch (error) {
    console.error("이미지 영구 저장 실패:", error.message);
    throw error;
  }
};

// 채팅 메시지용 이미지를 영구 저장하고 URL 반환
const saveChatImagePermanently = async (tempFilePath, userId) => {
  try {
    const fileExt = path.extname(tempFilePath);
    const fileName = `chat_${userId}_${Date.now()}${fileExt}`;
    const permanentPath = path.join(chatImagesDir, fileName);
    
    // 임시 파일을 영구 저장소로 이동
    await fs.copyFile(tempFilePath, permanentPath);
    
    // URL 생성 (프로덕션에서는 실제 도메인 사용)
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/chat/${fileName}`;
    
    return imageUrl;
  } catch (error) {
    console.error("채팅 이미지 영구 저장 실패:", error.message);
    throw error;
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

    // 텍스트 파라미터 받기 (선택적, AI 대화에서 이미지와 함께 텍스트를 보낼 때 사용)
    const additionalText = req.body.text || req.body.additionalText || "";
    // isChat 플래그 받기 (AI 대화에서 호출할 때는 true, 예문 생성 페이지에서 호출할 때는 false 또는 없음)
    const isChat = req.body.isChat === "true" || req.body.isChat === true;

    const extractedText = await detectText(filePath);

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({ message: "이미지에서 텍스트를 추출할 수 없습니다." });
    }

    // 추가 텍스트가 있으면 OCR 텍스트와 결합
    const combinedText = additionalText.trim() 
      ? `${extractedText}\n\n사용자 질문: ${additionalText.trim()}`
      : extractedText;

    // AI 대화에서 호출한 경우 DB에 저장하지 않음 (채팅 메시지로만 저장)
    // 예문 생성 페이지에서 호출한 경우 DB에 저장함
    const saveToDb = !isChat;

    // 먼저 예문 생성 (이미지 URL은 나중에 추가)
    const gptResponse = await generateExamples(combinedText, userId, null, saveToDb);
    
    // 이미지를 영구 저장하고 URL 생성
    let savedImageUrl = null;
    
    if (isChat) {
      // 채팅 메시지인 경우: 채팅 이미지 디렉토리에 저장
      try {
        savedImageUrl = await saveChatImagePermanently(filePath, userId);
      } catch (imageError) {
        console.error("채팅 이미지 저장 중 오류:", imageError.message);
        // 이미지 저장 실패해도 계속 진행
      }
    } else if (saveToDb && gptResponse?.generatedExample && userId) {
      // 예문 생성인 경우: 예문 이미지 디렉토리에 저장하고 DB 업데이트
      try {
        // 가장 최근에 생성된 예문 찾기 (같은 userId, 같은 extractedSentence)
        const Example = require("../models/Example");
        const recentExample = await Example.findOne({
          where: {
            user_id: userId,
            extracted_sentence: gptResponse.generatedExample.extractedSentence
          },
          order: [['created_at', 'DESC']]
        });
        
        if (recentExample) {
          // 이미지를 영구 저장하고 URL 생성
          savedImageUrl = await saveImagePermanently(filePath, userId, recentExample.id);
          
          // 예문에 이미지 URL 업데이트
          const currentImages = recentExample.images || [];
          await recentExample.update({
            images: [...currentImages, savedImageUrl]
          });
        }
      } catch (imageError) {
        console.error("이미지 저장 중 오류 (예문은 저장됨):", imageError.message);
        // 이미지 저장 실패해도 예문은 이미 저장되었으므로 계속 진행
      }
    }

    // 응답 검증 (generateExamples에서 이미 검증했지만 이중 체크)
    if (!gptResponse?.generatedExample?.examples || gptResponse.generatedExample.examples.length === 0) {
      return res.status(500).json({
        message: "예문 생성에 실패했습니다. 다시 시도해주세요.",
      });
    }

    res.status(200).json({
      extractedText,
      generatedExample: gptResponse,
      imageUrl: savedImageUrl, // 채팅 메시지에서 사용할 이미지 URL 반환
    });
  } catch (error) {
    // 에러 로그 출력 (서버 로그에만 기록)
    console.error("예문 생성 에러 상세:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      userId: req.user?.userId,
      hasFile: !!req.file,
      filePath: filePath,
      fileSize: req.file?.size,
      fileMimetype: req.file?.mimetype,
    });

    // 특정 에러 타입에 따라 적절한 상태 코드 반환
    let statusCode = 500;
    let errorMessage = "예문 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

    // OCR 관련 에러
    if (error.message?.includes("OCR") || error.message?.includes("텍스트를 추출")) {
      statusCode = 400;
      errorMessage = "이미지에서 텍스트를 추출할 수 없습니다. 더 선명한 이미지를 사용해주세요.";
    }
    // GPT 관련 에러
    else if (error.message?.includes("GPT") || error.message?.includes("예문 생성")) {
      statusCode = 500;
      errorMessage = "예문 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
    }
    // 인증 관련 에러
    else if (error.message?.includes("로그인") || error.message?.includes("인증")) {
      statusCode = 401;
      errorMessage = "로그인이 필요합니다.";
    }
    // 파일 관련 에러
    else if (error.message?.includes("파일") || error.message?.includes("이미지")) {
      statusCode = 400;
      errorMessage = "이미지 파일 처리 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.";
    }

    res.status(statusCode).json({
      message: errorMessage,
    });
  } finally {
    // 이미 영구 저장되었으면 임시 파일 삭제
    await cleanupFile(filePath);
  }
});

// 예문에 추가 이미지 추가 API
router.post("/:exampleId/image", upload.single("image"), async (req, res) => {
  let filePath;
  
  try {
    const exampleId = parseInt(req.params.exampleId);
    if (!exampleId || isNaN(exampleId)) {
      return res.status(400).json({ message: "올바른 예문 ID가 필요합니다." });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: "이미지 파일이 필요합니다." });
    }
    
    filePath = req.file.path;
    
    const authenticatedUser = req.user || req.session?.user;
    const userId = authenticatedUser?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    const Example = require("../models/Example");
    const example = await Example.findOne({
      where: {
        id: exampleId,
        user_id: userId // 본인의 예문만 수정 가능
      }
    });
    
    if (!example) {
      return res.status(404).json({ message: "예문을 찾을 수 없습니다." });
    }
    
    // 이미지를 영구 저장하고 URL 생성
    const savedImageUrl = await saveImagePermanently(filePath, userId, exampleId);
    
    // 예문에 이미지 URL 추가
    const currentImages = example.images || [];
    await example.update({
      images: [...currentImages, savedImageUrl]
    });
    
    res.status(200).json({
      message: "이미지가 추가되었습니다.",
      imageUrl: savedImageUrl,
      images: [...currentImages, savedImageUrl]
    });
  } catch (error) {
    console.error("추가 이미지 저장 오류:", error.message);
    res.status(500).json({
      message: "이미지 추가 중 오류가 발생했습니다.",
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

// 예문 기록 삭제
router.delete("/:exampleId", async (req, res) => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;

    const exampleId = parseInt(req.params.exampleId, 10);
    if (!Number.isInteger(exampleId) || exampleId <= 0) {
      return res.status(400).json({ message: "유효하지 않은 exampleId입니다." });
    }

    const result = await deleteExample(user.userId, exampleId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("예문 삭제 API 오류:", error.message);
    
    if (error.message?.includes("NOT_FOUND")) {
      return res.status(404).json({ message: error.message.replace("NOT_FOUND: ", "") });
    }
    if (error.message?.includes("BAD_REQUEST")) {
      return res.status(400).json({ message: error.message.replace("BAD_REQUEST: ", "") });
    }
    
    return res.status(500).json({
      message: "예문 삭제 중 오류가 발생했습니다.",
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

