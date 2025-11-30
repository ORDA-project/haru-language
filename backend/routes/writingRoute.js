const express = require("express");
const {
  correctWriting,
  translateWriting,
  translateEnglishToKorean,
  getWritingRecords,
} = require("../services/writingService");
const { WritingQuestion, WritingExample } = require("../models");
const { getUserIdBySocialId } = require("../utils/userUtils");
const { logError } = require("../middleware/errorHandler");

const router = express.Router();

// 유틸리티 함수: 세션/JWT에서 userId 가져오기
const getSessionUserId = async (req) => {
  const authUser = req.user;
  if (authUser?.userId) return authUser.userId;
  if (authUser?.social_id) return getUserIdBySocialId(authUser.social_id);
  
  const sessionUser = req.session?.user;
  if (sessionUser?.userId) return sessionUser.userId;
  if (sessionUser?.social_id) return getUserIdBySocialId(sessionUser.social_id);
  
  return null;
};

// 공통 에러 핸들러
const handleError = (error, res, endpoint = "") => {
  if (error.message?.includes("NOT_FOUND")) {
    return res.status(404).json({ message: error.message.replace("NOT_FOUND: ", "") });
  }
  if (error.message?.includes("BAD_REQUEST")) {
    return res.status(400).json({ message: error.message.replace("BAD_REQUEST: ", "") });
  }
  if (error.message?.includes("FORBIDDEN")) {
    return res.status(403).json({ message: error.message.replace("FORBIDDEN: ", "") });
  }
  logError(error, { endpoint });
  return res.status(500).json({
    message: "서버 오류가 발생했습니다.",
    ...(process.env.NODE_ENV !== "production" && { error: error.message }),
  });
};

router.post("/correct", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { text, writingQuestionId } = req.body;
    const result = await correctWriting(text, userId, writingQuestionId || null);
    return res.status(200).json({ message: "첨삭 완료", data: result });
  } catch (error) {
    return handleError(error, res, "POST /writing/correct");
  }
});

router.post("/translate", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { text, writingQuestionId } = req.body;
    const result = await translateWriting(text, userId, writingQuestionId);
    return res.status(200).json({ message: "번역 완료", data: result });
  } catch (error) {
    return handleError(error, res, "POST /writing/translate");
  }
});

router.post("/translate-english", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { text, writingQuestionId } = req.body;
    const result = await translateEnglishToKorean(text, userId, writingQuestionId);
    return res.status(200).json({ message: "영어→한국어 번역 완료", data: result });
  } catch (error) {
    return handleError(error, res, "POST /writing/translate-english");
  }
});

// 현재 로그인한 사용자의 Writing 기록 조회
router.get("/records", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const records = await getWritingRecords(userId);
    return res.status(200).json({
      message: records.length > 0 ? "기록 조회 성공" : "기록이 없습니다.",
      data: records,
      count: records.length,
    });
  } catch (error) {
    return handleError(error, res, "GET /writing/records");
  }
});

// 특정 Writing 질문에 대한 현재 로그인한 사용자의 기록 조회
router.get("/records/question/:writingQuestionId", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const writingQuestionId = parseInt(req.params.writingQuestionId, 10);
    if (!Number.isInteger(writingQuestionId) || writingQuestionId <= 0) {
      return res.status(400).json({ message: "유효하지 않은 writingQuestionId입니다." });
    }

    const records = await getWritingRecords(userId, writingQuestionId);
    return res.status(200).json({
      message: records.length > 0 ? "기록 조회 성공" : "해당 질문에 대한 기록이 없습니다.",
      data: records,
      count: records.length,
    });
  } catch (error) {
    return handleError(error, res, "GET /writing/records/question/:writingQuestionId");
  }
});

router.get("/question/:writingQuestionId", async (req, res) => {
  try {
    const writingQuestionId = parseInt(req.params.writingQuestionId, 10);
    if (!Number.isInteger(writingQuestionId) || writingQuestionId <= 0) {
      return res.status(400).json({ message: "유효하지 않은 writingQuestionId입니다." });
    }

    const question = await WritingQuestion.findOne({ where: { id: writingQuestionId } });
    if (!question) {
      return res.status(404).json({ message: "해당 ID에 대한 Writing 질문이 없습니다." });
    }

    const example = await WritingExample.findOne({
      where: { writing_question_id: writingQuestionId },
    });

    return res.status(200).json({
      message: "Writing 질문 조회 성공",
      data: {
        id: question.id,
        englishQuestion: question.question_text,
        koreanQuestion: question.korean_text,
        example: example
          ? { korean: example.example, english: example.translation }
          : null,
      },
    });
  } catch (error) {
    return handleError(error, res, "GET /writing/question/:writingQuestionId");
  }
});

router.get("/questions", async (_req, res) => {
  try {
    const questions = await WritingQuestion.findAll({
      include: [{ model: WritingExample, as: "examples", required: false }],
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      message: "Writing 질문 조회 성공",
      data: (questions || []).map((q) => ({
        id: q.id,
        englishQuestion: q.question_text,
        koreanQuestion: q.korean_text,
        example:
          q.examples && q.examples.length > 0
            ? { korean: q.examples[0].example, english: q.examples[0].translation }
            : null,
      })),
      count: questions.length,
    });
  } catch (error) {
    return handleError(error, res, "GET /writing/questions");
  }
});

module.exports = router;

