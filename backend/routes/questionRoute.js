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

// 질문 -> GPT 답변 생성 API
router.post("/", async (req, res) => {
  const sessionUser = req.session.user;  
  const { question } = req.body;

  if (!sessionUser?.userId || !question) {
    return res.status(400).json({ message: "로그인과 질문이 필요합니다" });
  }

  try {
    // 세션의 userId를 직접 사용 (이미 DB의 primary key)
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
// 사용자 ID로 질문과 답변 조회 API
router.get("/:userId", async (req, res) => {
  const { userId } = req.params; // social_id

  try {
    // social_id를 실제 DB id로 변환
    const user = await User.findOne({ where: { social_id: userId } });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 실제 DB id로 조회
    const questionsAndAnswers = await getQuestionsAndAnswersByUserId(user.id);

    // 안전하게 처리
    const safeData = questionsAndAnswers || [];

    if (!safeData.length) {
      return res.status(200).json({ 
        message: "해당 사용자의 질문과 답변이 없습니다.",
        data: []  // 빈 배열 반환
      });
    }

    res.status(200).json({
      message: "질문과 답변 조회 성공",
      data: safeData,
    });
  } catch (error) {
    console.error("질문과 답변 조회 API 오류:", error.message);
    res.status(500).json({
      message: "질문과 답변 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

module.exports = router;