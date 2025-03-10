const express = require("express");
const { correctWriting, translateWriting } = require("../services/writingService");
const { WritingRecord } = require("../models");

const router = express.Router();

/**
 * ✏️ [1] 문장 첨삭 API (POST /writing-question/correct)
 * - 사용자의 영어 문장을 분석하여 문법적으로 올바르게 수정하고 피드백 제공
 */
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

/**
 * 🌎 [2] 한국어 → 영어 번역 API (POST /writing-question/translate)
 * - 사용자의 한국어 문장을 영어로 번역하고 설명 제공
 */
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

/**
 * 📜 [3] 사용자의 모든 Writing 기록 조회 (GET /writing-question/records/:userId)
 * - 사용자가 첨삭/번역한 모든 기록을 반환
 */
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

/**
 * 📜 [4] 특정 Writing 질문에 대한 사용자의 기록 조회 (GET /writing-question/records/:userId/:writingQuestionId)
 * - 특정 Writing 질문에 대한 사용자의 첨삭/번역 기록을 반환
 */
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

module.exports = router;
