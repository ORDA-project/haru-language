const express = require("express");
const { correctWriting, translateWriting } = require("../services/writingService");
const { WritingRecord, WritingQuestion } = require("../models");

const router = express.Router();

/**
 * @swagger
 * /writing/correct:
 *   post:
 *     summary: 문장 첨삭 기능
 *     description: 입력된 영어 문장을 GPT를 통해 문법 및 어법 첨삭합니다
 *     tags: [Writing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - userId
 *             properties:
 *               text:
 *                 type: string
 *                 description: 첨삭할 영어 문장
 *                 example: "I am go to school yesterday."
 *               userId:
 *                 type: integer
 *                 description: 사용자 ID
 *                 example: 1
 *               writingQuestionId:
 *                 type: integer
 *                 description: 작문 질문 ID (선택사항)
 *                 example: 1
 *     responses:
 *       200:
 *         description: 첨삭 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "첨삭 완료"
 *                 data:
 *                   type: object
 *                   description: 첨삭 결과 데이터
 *       400:
 *         description: text와 userId가 필수임
 *       500:
 *         description: 문장 첨삭 중 오류 발생
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
 * @swagger
 * /writing/translate:
 *   post:
 *     summary: 한국어에서 영어로 번역
 *     description: 한국어 문장을 영어로 번역하고 작문 기록에 저장합니다
 *     tags: [Writing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - userId
 *               - writingQuestionId
 *             properties:
 *               text:
 *                 type: string
 *                 description: 번역할 한국어 문장
 *                 example: "나는 어제 학교에 갔다."
 *               userId:
 *                 type: integer
 *                 description: 사용자 ID
 *                 example: 1
 *               writingQuestionId:
 *                 type: integer
 *                 description: 작문 질문 ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: 번역 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "번역 완료"
 *                 data:
 *                   type: object
 *                   description: 번역 결과 데이터
 *       400:
 *         description: 필수 파라미터 누락
 *       500:
 *         description: 번역 중 오류 발생
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
 * @swagger
 * /writing/records/{userId}:
 *   get:
 *     summary: 사용자의 모든 작문 기록 조회
 *     description: 특정 사용자의 모든 작문 기록을 조회합니다
 *     tags: [Writing]
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
 *         description: 작문 기록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "사용자의 Writing 기록 조회 성공"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: 작문 기록 데이터
 *       404:
 *         description: 해당 사용자의 작문 기록이 없음
 *       500:
 *         description: 작문 기록 조회 중 오류 발생
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
 * @swagger
 * /writing/records/{userId}/{writingQuestionId}:
 *   get:
 *     summary: 특정 작문 질문에 대한 사용자 기록 조회
 *     description: 특정 사용자의 특정 작문 질문에 대한 기록을 조회합니다
 *     tags: [Writing]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *         example: 1
 *       - in: path
 *         name: writingQuestionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 작문 질문 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 특정 질문에 대한 기록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "특정 Writing 질문에 대한 사용자의 기록 조회 성공"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: 작문 기록 데이터
 *       404:
 *         description: 해당 질문에 대한 사용자의 기록이 없음
 *       500:
 *         description: 작문 기록 조회 중 오류 발생
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

/**
 * @swagger
 * /writing/question/{writingQuestionId}:
 *   get:
 *     summary: 특정 작문 질문 조회
 *     description: ID로 특정 작문 질문을 조회합니다
 *     tags: [Writing]
 *     parameters:
 *       - in: path
 *         name: writingQuestionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 작문 질문 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 작문 질문 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Writing 질문 조회 성공"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     englishQuestion:
 *                       type: string
 *                       example: "Write about your favorite hobby"
 *                     koreanQuestion:
 *                       type: string
 *                       example: "당신의 취미에 대해 써보세요"
 *       404:
 *         description: 해당 ID의 작문 질문이 없음
 *       500:
 *         description: 작문 질문 조회 중 오류 발생
 */
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
 * @swagger
 * /writing/questions:
 *   get:
 *     summary: 전체 작문 질문 목록 조회
 *     description: 등록된 모든 작문 질문을 조회합니다
 *     tags: [Writing]
 *     responses:
 *       200:
 *         description: 작문 질문 전체 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Writing 질문 전체 조회 성공"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       englishQuestion:
 *                         type: string
 *                         example: "Write about your favorite hobby"
 *                       koreanQuestion:
 *                         type: string
 *                         example: "당신의 취미에 대해 써보세요"
 *       404:
 *         description: 등록된 작문 질문이 없음
 *       500:
 *         description: 작문 질문 조회 중 오류 발생
 */
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
