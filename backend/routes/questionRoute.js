const express = require("express");
const { getAnswer, deleteQuestion } = require("../services/questionService");
const { getQuestionsAndAnswersByUserId } = require("../services/historyService");
const { User } = require("../models");
const { logError } = require("../middleware/errorHandler");

const router = express.Router();

router.post("/", async (req, res) => {
  // JWT 기반 인증 사용
  const user = req.user;
  const { question } = req.body;

  if (!user?.userId || !question) {
    return res.status(400).json({ message: "로그인과 질문이 필요합니다." });
  }

  try {
    const result = await getAnswer(question, user.userId);
    return res.json({ answer: result.answer });
  } catch (error) {
    logError(error, { endpoint: "POST /question" });
    return res.status(500).json({ message: "답변 생성 중 오류가 발생했습니다." });
  }
});

// JWT 기반 인증: 현재 로그인한 사용자의 질문 조회
router.get("/", async (req, res) => {
  try {
    // JWT에서 사용자 정보 가져오기
    const user = req.user;
    
    if (!user || !user.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const data = await getQuestionsAndAnswersByUserId(user.userId);
    return res.status(200).json({
      message: data?.length ? "질문과 답변 조회 성공" : "해당 사용자의 기록이 없습니다.",
      data: data || [],
    });
  } catch (error) {
    logError(error, { endpoint: "GET /question" });
    return res.status(500).json({
      message: "질문과 답변 조회 중 오류가 발생했습니다.",
    });
  }
});

// 하위 호환성: userId 파라미터로 조회 (deprecated - JWT 사용 권장)
router.get("/:userId", async (req, res) => {
  try {
    // JWT 기반 인증이 있으면 우선 사용
    if (req.user && req.user.userId) {
      const data = await getQuestionsAndAnswersByUserId(req.user.userId);
      return res.status(200).json({
        message: data?.length ? "질문과 답변 조회 성공" : "해당 사용자의 기록이 없습니다.",
        data: data || [],
      });
    }

    // Fallback: social_id로 조회 (하위 호환성)
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
    logError(error, { endpoint: "GET /question/:userId" });
    return res.status(500).json({
      message: "질문과 답변 조회 중 오류가 발생했습니다.",
    });
  }
});

// 질문 기록 삭제
router.delete("/:questionId", async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const questionId = parseInt(req.params.questionId, 10);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return res.status(400).json({ message: "유효하지 않은 questionId입니다." });
    }

    const result = await deleteQuestion(user.userId, questionId);
    return res.status(200).json(result);
  } catch (error) {
    logError(error, { endpoint: "DELETE /question/:questionId" });
    
    if (error.message?.includes("NOT_FOUND")) {
      return res.status(404).json({ message: error.message.replace("NOT_FOUND: ", "") });
    }
    if (error.message?.includes("BAD_REQUEST")) {
      return res.status(400).json({ message: error.message.replace("BAD_REQUEST: ", "") });
    }
    
    return res.status(500).json({
      message: "질문 삭제 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;

