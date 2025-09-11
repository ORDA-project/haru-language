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
// 臾몄옣 泥⑥궘 API 
router.post("/correct", async (req, res) => {
  try {
    const { text, userId, writingQuestionId } = req.body;

    if (!text || !userId) {
      return res.status(400).json({ message: "text? userId???꾩닔?낅땲??" });
    }

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const result = await correctWriting(text, actualUserId, writingQuestionId || null);

    res.status(200).json({
      message: "泥⑥궘 ?꾨즺",
      data: result,
    });
  } catch (error) {
    console.error("Error correcting writing:", error.message);
    res.status(500).json({
      message: "臾몄옣 泥⑥궘 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
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
 *                 example: "?섎뒗 留ㅼ씪 ?숆탳??媛꾨떎."
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
// ?쒓뎅?????곸뼱 踰덉뿭 API 
router.post("/translate", async (req, res) => {
  try {
    const { text, userId, writingQuestionId } = req.body;

    if (!text || !userId || !writingQuestionId) {
      return res.status(400).json({ message: "text, userId, writingQuestionId???꾩닔?낅땲??" });
    }

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const result = await translateWriting(text, actualUserId, writingQuestionId);

    res.status(200).json({
      message: "踰덉뿭 ?꾨즺",
      data: result,
    });
  } catch (error) {
    console.error("Error translating writing:", error.message);
    res.status(500).json({
      message: "踰덉뿭 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
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
// ?ъ슜?먯쓽 紐⑤뱺 Writing 湲곕줉 議고쉶 
router.get("/records/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // social_id

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const records = await WritingRecord.findAll({
      where: { user_id: actualUserId }, // ?ㅼ젣 DB id ?ъ슜
      order: [["createdAt", "DESC"]],
    });

    const safeRecords = records || [];

    if (!safeRecords.length) {
      return res.status(200).json({ 
        message: "?대떦 ?ъ슜?먯쓽 Writing 湲곕줉???놁뒿?덈떎.",
        data: []  // 鍮?諛곗뿴 諛섑솚
      });
    }

    res.status(200).json({
      message: "?ъ슜?먯쓽 Writing 湲곕줉 議고쉶 ?깃났",
      data: safeRecords,
    });
  } catch (error) {
    console.error("Error fetching user writing records:", error.message);
    res.status(500).json({
      message: "Writing 湲곕줉 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
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
// ?뱀젙 Writing 吏덈Ц??????ъ슜?먯쓽 湲곕줉 議고쉶
router.get("/records/:userId/:writingQuestionId", async (req, res) => {
  try {
    const { userId, writingQuestionId } = req.params;

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const records = await WritingRecord.findAll({
      where: { user_id: actualUserId, writing_question_id: writingQuestionId }, // ?ㅼ젣 DB id ?ъ슜
      order: [["createdAt", "DESC"]],
    });

    const safeRecords = records || [];

    if (!safeRecords.length) {
      return res.status(200).json({  
        message: "?대떦 Writing 吏덈Ц??????ъ슜?먯쓽 湲곕줉???놁뒿?덈떎.",
        data: []  // 鍮?諛곗뿴 諛섑솚
      });
    }

    res.status(200).json({
      message: "?뱀젙 Writing 吏덈Ц??????ъ슜?먯쓽 湲곕줉 議고쉶 ?깃났",
      data: safeRecords,
    });
  } catch (error) {
    console.error("Error fetching writing records for question:", error.message);
    res.status(500).json({
      message: "Writing 吏덈Ц?????湲곕줉 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
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
// ?뱀젙 WritingQuestion 諛섑솚 API
router.get("/question/:writingQuestionId", async (req, res) => {
  try {
    const { writingQuestionId } = req.params;

    const question = await WritingQuestion.findOne({ where: { id: writingQuestionId } });

    if (!question) {
      return res.status(404).json({ message: "?대떦 ID?????Writing 吏덈Ц???놁뒿?덈떎." });
    }

    res.status(200).json({
      message: "Writing 吏덈Ц 議고쉶 ?깃났",
      data: {
        id: question.id,
        englishQuestion: question.question_text,
        koreanQuestion: question.korean_text,
      },
    });
  } catch (error) {
    console.error("Error fetching writing question:", error.message);
    res.status(500).json({
      message: "Writing 吏덈Ц 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
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
// ?꾩껜 WritingQuestion 紐⑸줉 議고쉶 API
router.get("/questions", async (req, res) => {
  try {
    const questions = await WritingQuestion.findAll({
      order: [["createdAt", "ASC"]],
    });

    // 鍮?諛곗뿴?댁뼱??200 諛섑솚
    res.status(200).json({
      message: "Writing 吏덈Ц 議고쉶 ?깃났",
      data: questions.map(q => ({
        id: q.id,
        englishQuestion: q.question_text,
        koreanQuestion: q.korean_text,
      })),
    });
  } catch (error) {
    console.error("Error fetching all writing questions:", error.message);
    res.status(500).json({
      message: "Writing 吏덈Ц 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
      error: error.message,
    });
  }
});

module.exports = router;
