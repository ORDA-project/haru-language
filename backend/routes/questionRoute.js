const express = require("express");
const { getAnswer } = require("../services/gptService");
const { getQuestionsAndAnswersByUserId } = require("../services/historyService");
require("dotenv").config({ path: "../.env" });

const router = express.Router();


router.post("/", async (req, res) => {
  const { userId, question } = req.body;

  if (!userId || !question) {
    return res.status(400).json({ message: 'userId와 question은 필수입니다.' });
  }


  try {
    const result = await getAnswer(question, userId);

    res.send({
      answer: result,
    });

  } catch (error) {
    console.error("Error generating answer:", error);
    res.status(500).send({ message: "Error generating answer", error });
  }
});

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const questionsAndAnswers = await getQuestionsAndAnswersByUserId(userId);

    if (!questionsAndAnswers.length) {
      return res.status(404).json({ message: '해당 유저의 질문과 답변이 없습니다.' });
    }

    res.status(200).json({
      message: '질문과 답변 조회 성공',
      data: questionsAndAnswers,
    });
  } catch (error) {
    console.error('질문과 답변 조회 API 오류:', error.message);
    res.status(500).json({ message: '질문과 답변 조회 중 오류가 발생했습니다.', error: error.message });
  }
});


module.exports = router;