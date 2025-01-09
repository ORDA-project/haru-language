const express = require("express");
const { generateQuiz } = require("../services/gptService");

const router = express.Router();

router.post("/", async (req, res) => {
  const userId = req.session.user.userId;
  
  if (!userId) {
    return res.status(400).json({ message: "userId는는 필수입니다." });
  }

  try {
    const quiz = await generateQuiz(userId); // 사용자 ID 전달
    //console.log(quiz);

    res.status(200).json(quiz);
  } catch (error) {
    console.error(error.message);
  }
});

module.exports = router;
