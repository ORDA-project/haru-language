const express = require("express");
const { getAnswer } = require("../services/questionService");
const {
  getQuestionsAndAnswersByUserId,
} = require("../services/historyService");
const { User } = require("../models");
require("dotenv").config({ path: "../.env" });

const router = express.Router();

/**
 * @openapi
 * /question:
 *   post:
 *     summary: Generate GPT-based answer for a given question
 *     tags:
 *       - Question
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 example: "What is the capital of France?"
 *     responses:
 *       200:
 *         description: GPT-generated answer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   example: "The capital of France is Paris."
 *       400:
 *         description: Missing question or user not logged in
 *       500:
 *         description: Error generating answer
 */

// 吏덈Ц -> GPT ?듬? ?앹꽦 API
router.post("/", async (req, res) => {
  const sessionUser = req.session.user;  
  const { question } = req.body;

  if (!sessionUser?.userId || !question) {
    return res.status(400).json({ message: "濡쒓렇?멸낵 吏덈Ц???꾩슂?⑸땲??" });
  }

  try {
    // ?몄뀡??userId瑜?吏곸젒 ?ъ슜 (?대? DB??primary key)
    const result = await getAnswer(question, sessionUser.userId); 
    res.send({ answer: result.answer });
  } catch (error) {
    console.error("Error generating answer:", error);
    res.status(500).send({ message: "Error generating answer", error });
  }
});

/**
 * @openapi
 * /question/{userId}:
 *   get:
 *     summary: Get questions and answers by user ID (uses social_id)
 *     tags:
 *       - Question
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
 *         description: Questions and answers retrieved successfully
 *       404:
 *         description: No questions found for this user
 *       500:
 *         description: Server error
 */
// ?ъ슜??ID濡?吏덈Ц怨??듬? 議고쉶 API
router.get("/:userId", async (req, res) => {
  const { userId } = req.params; // social_id

  try {
    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const user = await User.findOne({ where: { social_id: userId } });
    if (!user) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    // ?ㅼ젣 DB id濡?議고쉶
    const questionsAndAnswers = await getQuestionsAndAnswersByUserId(user.id);

    // ?덉쟾?섍쾶 泥섎━
    const safeData = questionsAndAnswers || [];

    if (!safeData.length) {
      return res.status(200).json({ 
        message: "?대떦 ?좎???吏덈Ц怨??듬????놁뒿?덈떎.",
        data: []  // 鍮?諛곗뿴 諛섑솚
      });
    }

    res.status(200).json({
      message: "吏덈Ц怨??듬? 議고쉶 ?깃났",
      data: safeData,
    });
  } catch (error) {
    console.error("吏덈Ц怨??듬? 議고쉶 API ?ㅻ쪟:", error.message);
    res.status(500).json({
      message: "吏덈Ц怨??듬? 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
      error: error.message,
    });
  }
});

module.exports = router;
