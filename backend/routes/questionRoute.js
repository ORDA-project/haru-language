const express = require("express");
const { getAnswer } = require("../services/questionService");
const {
  getQuestionsAndAnswersByUserId,
} = require("../services/historyService");
require("dotenv").config({ path: "../.env" });

const router = express.Router();

/**
 * @swagger
 * /question:
 *   post:
 *     summary: 질문에 대한 GPT 답변 생성
 *     description: 사용자의 질문을 GPT API로 전송하여 답변을 생성합니다
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: 사용자의 질문
 *                 example: "영어 문법에서 현재 완료 시제에 대해 설명해주세요."
 *     responses:
 *       200:
 *         description: 답변 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: GPT가 생성한 답변
 *                   example: "현재 완료 시제는 have/has + 과거분사 형태로 사용됩니다..."
 *       400:
 *         description: userId와 question이 필수임
 *       500:
 *         description: 답변 생성 중 오류 발생
 */
router.post("/", async (req, res) => {
  const { userId } = req.session.user;
  const { question } = req.body;

  if (!userId || !question) {
    return res.status(400).json({ message: "userId와 question은 필수입니다." });
  }

  try {
    const result = await getAnswer(question, userId);
    // result.answer는 이미 문자열이므로 그대로 전송
    res.send({ answer: result.answer });
  } catch (error) {
    console.error("Error generating answer:", error);
    res.status(500).send({ message: "Error generating answer", error });
  }
});

/**
 * @swagger
 * /question/{userId}:
 *   get:
 *     summary: 사용자별 질문과 답변 조회
 *     description: 특정 사용자 ID로 저장된 질문과 답변 목록을 조회합니다
 *     tags: [Questions]
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
 *         description: 질문과 답변 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "질문과 답변 조회 성공"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: 질문과 답변 데이터
 *       404:
 *         description: 해당 유저의 질문과 답변이 없음
 *       500:
 *         description: 질문과 답변 조회 중 오류 발생
 */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const questionsAndAnswers = await getQuestionsAndAnswersByUserId(userId);

    if (!questionsAndAnswers.length) {
      return res
        .status(404)
        .json({ message: "해당 유저의 질문과 답변이 없습니다." });
    }

    res.status(200).json({
      message: "질문과 답변 조회 성공",
      data: questionsAndAnswers,
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
