const express = require("express");
const { getAnswer } = require("../services/questionService");
const { getQuestionsAndAnswersByUserId } = require("../services/historyService");
const { User } = require("../models");

const router = express.Router();

router.post("/", async (req, res) => {
  const sessionUser = req.session.user;
  const { question } = req.body;

  if (!sessionUser?.userId || !question) {
    return res.status(400).json({ message: "로그인과 질문이 필요합니다." });
  }

  try {
    const result = await getAnswer(question, sessionUser.userId);
    return res.json({ answer: result.answer });
  } catch (error) {
    console.error("Error generating answer:", error);
    return res.status(500).json({ message: "답변 생성 중 오류가 발생했습니다." });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ where: { social_id: req.params.userId } });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const data = await getQuestionsAndAnswersByUserId(user.id);
    return res.status(200).json({
      message: data?.length ? "질문과 답변 조회 성공" : "해당 사용자의 기록이 없습니다.",
      data: data || [],
    });
  } catch (error) {
    console.error("질문과 답변 조회 API 오류:", error.message);
    return res.status(500).json({
      message: "질문과 답변 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

module.exports = router;

