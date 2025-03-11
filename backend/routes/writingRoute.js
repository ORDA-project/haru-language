const express = require("express");
const { correctWriting, translateWriting } = require("../services/writingService");
const { WritingRecord, WritingQuestion } = require("../models");

const router = express.Router();

// 문장 첨삭 API 
router.post("/correct", async (req, res) => {
  try {
    const { text, userId, writingQuestionId } = req.body;

    if (!text || !userId) {
      return res.status(400).json({ message: "text와 userId는 필수입니다." });
    }

    const result = await correctWriting(text, userId, writingQuestionId || null);

    res.status(200).json({
      message: "첨삭 완료",
      data: result,
    });
  } catch (error) {
    console.error("Error correcting writing:", error.message);
    res.status(500).json({
      message: "문장 첨삭 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

 // 한국어 → 영어 번역 API 
router.post("/translate", async (req, res) => {
  try {
    const { text, userId, writingQuestionId } = req.body;

    if (!text || !userId || !writingQuestionId) {
      return res.status(400).json({ message: "text, userId, writingQuestionId는 필수입니다." });
    }

    const result = await translateWriting(text, userId, writingQuestionId);

    res.status(200).json({
      message: "번역 완료",
      data: result,
    });
  } catch (error) {
    console.error("Error translating writing:", error.message);
    res.status(500).json({
      message: "번역 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 사용자의 모든 Writing 기록 조회 
router.get("/records/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const records = await WritingRecord.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });

    if (!records.length) {
      return res.status(404).json({ message: "해당 사용자의 Writing 기록이 없습니다." });
    }

    res.status(200).json({
      message: "사용자의 Writing 기록 조회 성공",
      data: records,
    });
  } catch (error) {
    console.error("Error fetching user writing records:", error.message);
    res.status(500).json({
      message: "Writing 기록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 특정 Writing 질문에 대한 사용자의 기록 조회
router.get("/records/:userId/:writingQuestionId", async (req, res) => {
  try {
    const { userId, writingQuestionId } = req.params;

    const records = await WritingRecord.findAll({
      where: { user_id: userId, writing_question_id: writingQuestionId },
      order: [["createdAt", "DESC"]],
    });

    if (!records.length) {
      return res.status(404).json({ message: "해당 Writing 질문에 대한 사용자의 기록이 없습니다." });
    }

    res.status(200).json({
      message: "특정 Writing 질문에 대한 사용자의 기록 조회 성공",
      data: records,
    });
  } catch (error) {
    console.error("Error fetching writing records for question:", error.message);
    res.status(500).json({
      message: "Writing 질문에 대한 기록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 특정 WritingQuestion 반환 API
router.get("/question/:writingQuestionId", async (req, res) => {
  try {
    const { writingQuestionId } = req.params;

    const question = await WritingQuestion.findOne({ where: { id: writingQuestionId } });

    if (!question) {
      return res.status(404).json({ message: "해당 ID에 대한 Writing 질문이 없습니다." });
    }

    res.status(200).json({
      message: "Writing 질문 조회 성공",
      data: {
        id: question.id,
        englishQuestion: question.question_text,
        koreanQuestion: question.korean_text,
      },
    });
  } catch (error) {
    console.error("Error fetching writing question:", error.message);
    res.status(500).json({
      message: "Writing 질문 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 전체 WritingQuestion 목록 조회 API
router.get("/questions", async (req, res) => {
  try {
    const questions = await WritingQuestion.findAll({
      order: [["createdAt", "ASC"]],
    });

    if (!questions.length) {
      return res.status(404).json({ message: "등록된 Writing 질문이 없습니다." });
    }

    res.status(200).json({
      message: "Writing 질문 전체 조회 성공",
      data: questions.map(q => ({
        id: q.id,
        englishQuestion: q.question_text,
        koreanQuestion: q.korean_text,
      })),
    });
  } catch (error) {
    console.error("Error fetching all writing questions:", error.message);
    res.status(500).json({
      message: "Writing 질문 전체 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

module.exports = router;
