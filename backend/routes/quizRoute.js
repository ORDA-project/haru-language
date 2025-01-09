const express = require("express");
const { generateQuiz } = require("../services/gptService");

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("세션 데이터:", req.session.user);
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "로그인이 필요합니다.",
        });
    } 

  try {
    const { userId } = req.session.user;
    console.log(userId);

    if (!userId) {
      return res.status(400).json({ message: "userId는는 필수입니다." });
    }
    const quiz = await generateQuiz(userId); // 사용자 ID 전달
    console.log(quiz);

    res.status(200).json(quiz);
  } catch (error) {
    console.error(error.message);
  }
});

module.exports = router;
