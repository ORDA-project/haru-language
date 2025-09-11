const express = require("express");
const { correctWriting, translateWriting } = require("../services/writingService");
const { WritingRecord, WritingQuestion, WritingExample, User } = require("../models");
const { getUserIdBySocialId } = require("../utils/userUtils");
const router = express.Router();

/**
 * @openapi
 * /writing/correct:
 *   post:
 *     summary: Correct a user's writing (grammar feedback) - uses social_id
 *     tags:
 *       - Writing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "He go to school every day."
 *               userId:
 *                 type: string
 *                 example: "test123"
 *                 description: User's social_id
 *               writingQuestionId:
 *                 type: string
 *                 example: "1"
 *     responses:
 *       200:
 *         description: Writing corrected successfully
 *       400:
 *         description: text or userId missing
 *       404:
 *         description: User not found
 *       500:
 *         description: Error correcting writing
 */
// 문장 첨삭 API 
router.post("/correct", async (req, res) => {
  try {
    const { text, userId, writingQuestionId } = req.body;

    if (!text || !userId) {
      return res.status(400).json({ message: "text와 userId는 필수입니다." });
    }

    // social_id를 실제 DB id로 변환
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const result = await correctWriting(text, actualUserId, writingQuestionId || null);

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
 * @openapi
 * /writing/translate:
 *   post:
 *     summary: Translate Korean writing into English - uses social_id
 *     tags:
 *       - Writing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "나는 매일 학교에 간다."
 *               userId:
 *                 type: string
 *                 example: "test123"
 *                 description: User's social_id
 *               writingQuestionId:
 *                 type: string
 *                 example: "1"
 *     responses:
 *       200:
 *         description: Writing translated successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Error translating writing
 */
// 한국어 → 영어 번역 API 
router.post("/translate", async (req, res) => {
  try {
    const { text, userId, writingQuestionId } = req.body;

    if (!text || !userId || !writingQuestionId) {
      return res.status(400).json({ message: "text, userId, writingQuestionId는 필수입니다." });
    }

    // social_id를 실제 DB id로 변환
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const result = await translateWriting(text, actualUserId, writingQuestionId);

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
 * @openapi
 * /writing/records/{userId}:
 *   get:
 *     summary: Get all writing records for a user - uses social_id
 *     tags:
 *       - Writing
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
 *         description: List of writing records
 *       404:
 *         description: No records found or user not found
 *       500:
 *         description: Server error
 */
// 사용자의 모든 Writing 기록 조회 
router.get("/records/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // social_id

    // social_id를 실제 DB id로 변환
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const records = await WritingRecord.findAll({
      where: { user_id: actualUserId }, // 실제 DB id 사용
      order: [["createdAt", "DESC"]],
    });

    const safeRecords = records || [];

    if (!safeRecords.length) {
      return res.status(200).json({ 
        message: "해당 사용자의 Writing 기록이 없습니다.",
        data: []  // 빈 배열 반환
      });
    }

    res.status(200).json({
      message: "사용자의 Writing 기록 조회 성공",
      data: safeRecords,
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
 * @openapi
 * /writing/records/{userId}/{writingQuestionId}:
 *   get:
 *     summary: Get writing records for a specific question - uses social_id
 *     tags:
 *       - Writing
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: "test123"
 *         description: User's social_id
 *       - in: path
 *         name: writingQuestionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *     responses:
 *       200:
 *         description: Records found
 *       404:
 *         description: No records for this question or user not found
 *       500:
 *         description: Server error
 */
// 특정 Writing 질문에 대한 사용자의 기록 조회
router.get("/records/:userId/:writingQuestionId", async (req, res) => {
  try {
    const { userId, writingQuestionId } = req.params;

    // social_id를 실제 DB id로 변환
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const records = await WritingRecord.findAll({
      where: { user_id: actualUserId, writing_question_id: writingQuestionId }, // 실제 DB id 사용
      order: [["createdAt", "DESC"]],
    });

    const safeRecords = records || [];

    if (!safeRecords.length) {
      return res.status(200).json({  
        message: "해당 Writing 질문에 대한 사용자의 기록이 없습니다.",
        data: []  // 빈 배열 반환
      });
    }

    res.status(200).json({
      message: "특정 Writing 질문에 대한 사용자의 기록 조회 성공",
      data: safeRecords,
    });
  } catch (error) {
    console.error("Error fetching writing records for question:", error.message);
    res.status(500).json({
      message: "Writing 질문에 대한 기록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

/**
 * @openapi
 * /writing/question/{writingQuestionId}:
 *   get:
 *     summary: Get a specific writing question by ID
 *     tags:
 *       - Writing
 *     parameters:
 *       - in: path
 *         name: writingQuestionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *     responses:
 *       200:
 *         description: Writing question found
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /writing/questions:
 *   get:
 *     summary: Get all writing questions
 *     tags:
 *       - Writing
 *     responses:
 *       200:
 *         description: List of writing questions (empty array if no questions)
 *       500:
 *         description: Server error
 */
// 전체 WritingQuestion 목록 조회 API
router.get("/questions", async (req, res) => {
  try {
    const questions = await WritingQuestion.findAll({
      order: [["createdAt", "ASC"]],
    });

    // 빈 배열이어도 200 반환
    res.status(200).json({
      message: "Writing 질문 조회 성공",
      data: questions.map(q => ({
        id: q.id,
        englishQuestion: q.question_text,
        koreanQuestion: q.korean_text,
      })),
    });
  } catch (error) {
    console.error("Error fetching all writing questions:", error.message);
    res.status(500).json({
      message: "Writing 질문 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

module.exports = router;