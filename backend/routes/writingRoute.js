const express = require("express");
const {
  correctWriting,
  translateWriting,
  translateEnglishToKorean,
} = require("../services/writingService");
const { WritingRecord, WritingQuestion, WritingExample } = require("../models");
const { getUserIdBySocialId } = require("../utils/userUtils");
const { logError } = require("../middleware/errorHandler");

const router = express.Router();

router.post("/correct", async (req, res) => {
  try {
    const { text, writingQuestionId } = req.body;
    
    // JWT 기반 인증 사용
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    if (!text) {
      return res.status(400).json({ message: "text는 필수입니다." });
    }

    const result = await correctWriting(text, user.userId, writingQuestionId || null);
    return res.status(200).json({ message: "첨삭 완료", data: result });
  } catch (error) {
    logError(error, { endpoint: "POST /writing/correct" });
    return res.status(500).json({
      message: "문장 첨삭 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

router.post("/translate", async (req, res) => {
  try {
    const { text, writingQuestionId } = req.body;
    
    // JWT 기반 인증 사용
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    if (!text || !writingQuestionId) {
      return res
        .status(400)
        .json({ message: "text와 writingQuestionId는 필수입니다." });
    }

    const result = await translateWriting(text, user.userId, writingQuestionId);
    return res.status(200).json({ message: "번역 완료", data: result });
  } catch (error) {
    logError(error, { endpoint: "POST /writing/translate" });
    return res.status(500).json({
      message: "번역 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

router.post("/translate-english", async (req, res) => {
  try {
    const { text, writingQuestionId } = req.body;
    
    // JWT 기반 인증 사용
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    if (!text || !writingQuestionId) {
      return res
        .status(400)
        .json({ message: "text와 writingQuestionId는 필수입니다." });
    }

    const result = await translateEnglishToKorean(
      text,
      user.userId,
      writingQuestionId
    );
    return res
      .status(200)
      .json({ message: "영어→한국어 번역 완료", data: result });
  } catch (error) {
    logError(error, { endpoint: "POST /writing/translate-english" });
    return res.status(500).json({
      message: "영어→한국어 번역 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// JWT 기반 인증: 현재 로그인한 사용자의 Writing 기록 조회
router.get("/records", async (req, res) => {
  try {
    // JWT 기반 인증 사용
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const records = await WritingRecord.findAll({
      where: { user_id: user.userId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "사용자의 Writing 기록 조회 성공",
      data: records || [],
    });
  } catch (error) {
    logError(error, { endpoint: "GET /writing/records" });
    return res.status(500).json({
      message: "Writing 기록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// JWT 기반 인증: 특정 Writing 질문에 대한 현재 로그인한 사용자의 기록 조회
router.get("/records/question/:writingQuestionId", async (req, res) => {
  try {
    // JWT 기반 인증 사용
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const records = await WritingRecord.findAll({
      where: {
        user_id: user.userId,
        writing_question_id: req.params.writingQuestionId,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "특정 Writing 질문에 대한 사용자의 기록 조회 성공",
      data: records || [],
    });
  } catch (error) {
    logError(error, { endpoint: "GET /writing/records/question/:writingQuestionId" });
    return res.status(500).json({
      message: "Writing 질문에 대한 기록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 하위 호환성: userId 파라미터로 조회 (deprecated - JWT 사용 권장)
router.get("/records/:userId", async (req, res) => {
  try {
    // JWT 기반 인증이 있으면 우선 사용
    if (req.user && req.user.userId) {
      const records = await WritingRecord.findAll({
        where: { user_id: req.user.userId },
        order: [["createdAt", "DESC"]],
      });
      return res.status(200).json({
        message: "사용자의 Writing 기록 조회 성공",
        data: records || [],
      });
    }

    // Fallback: social_id로 조회 (하위 호환성)
    const actualUserId = await getUserIdBySocialId(req.params.userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const records = await WritingRecord.findAll({
      where: { user_id: actualUserId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "사용자의 Writing 기록 조회 성공",
      data: records || [],
    });
  } catch (error) {
    logError(error, { endpoint: "GET /writing/records/:userId" });
    return res.status(500).json({
      message: "Writing 기록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 하위 호환성: userId 파라미터로 조회 (deprecated - JWT 사용 권장)
router.get("/records/:userId/:writingQuestionId", async (req, res) => {
  try {
    // JWT 기반 인증이 있으면 우선 사용
    if (req.user && req.user.userId) {
      const records = await WritingRecord.findAll({
        where: {
          user_id: req.user.userId,
          writing_question_id: req.params.writingQuestionId,
        },
        order: [["createdAt", "DESC"]],
      });
      return res.status(200).json({
        message: "특정 Writing 질문에 대한 사용자의 기록 조회 성공",
        data: records || [],
      });
    }

    // Fallback: social_id로 조회 (하위 호환성)
    const actualUserId = await getUserIdBySocialId(req.params.userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const records = await WritingRecord.findAll({
      where: {
        user_id: actualUserId,
        writing_question_id: req.params.writingQuestionId,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "특정 Writing 질문에 대한 사용자의 기록 조회 성공",
      data: records || [],
    });
  } catch (error) {
    logError(error, { endpoint: "GET /writing/records/:userId/:writingQuestionId" });
    return res.status(500).json({
      message: "Writing 질문에 대한 기록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

router.get("/question/:writingQuestionId", async (req, res) => {
  try {
    const { writingQuestionId } = req.params;
    const question = await WritingQuestion.findOne({ where: { id: writingQuestionId } });
    const example = await WritingExample.findOne({
      where: { writing_question_id: writingQuestionId },
    });

    if (!question) {
      return res
        .status(404)
        .json({ message: "해당 ID에 대한 Writing 질문이 없습니다." });
    }

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
    console.error("Error fetching writing question:", error.message);
    return res.status(500).json({
      message: "Writing 질문 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

router.get("/questions", async (_req, res) => {
  try {
    const questions = await WritingQuestion.findAll({
      include: [{ model: WritingExample, as: "examples", required: false }],
      order: [["createdAt", "ASC"]],
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
    });
  } catch (error) {
    console.error("Error fetching all writing questions:", error.message);
    return res.status(500).json({
      message: "Writing 질문 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

module.exports = router;

