const express = require("express");
const {
  saveChatMessage,
  saveChatMessages,
  getChatMessagesByDate,
  getRecentChatMessages,
  deleteChatMessage,
  deleteChatMessages,
} = require("../services/chatMessageService");
const { logError } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * 채팅 메시지 저장 (단일)
 */
router.post("/", async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { type, content, examples, imageUrl, questionId } = req.body;

    if (!type || !content) {
      return res.status(400).json({ message: "메시지 타입과 내용은 필수입니다." });
    }

    const result = await saveChatMessage(user.userId, {
      type,
      content,
      examples,
      imageUrl,
      questionId,
    });

    return res.status(201).json(result);
  } catch (error) {
    logError(error, { endpoint: "POST /chat-message" });
    return res.status(500).json({ message: error.message || "채팅 메시지 저장 중 오류가 발생했습니다." });
  }
});

/**
 * 채팅 메시지 일괄 저장
 */
router.post("/batch", async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "메시지 배열이 필요합니다." });
    }

    const result = await saveChatMessages(user.userId, messages);
    return res.status(201).json(result);
  } catch (error) {
    logError(error, { endpoint: "POST /chat-message/batch" });
    return res.status(500).json({ message: error.message || "채팅 메시지 저장 중 오류가 발생했습니다." });
  }
});

/**
 * 최근 채팅 메시지 조회 (오늘 날짜 기준)
 */
router.get("/", async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    // 채팅 데이터는 사용자별 실시간 데이터이므로 캐시/ETag로 304가 나가면
    // 프론트가 "데이터 없음"으로 오판하여 초기 인사 메시지를 중복 생성할 수 있음
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    const messages = await getRecentChatMessages(user.userId);
    return res.status(200).json(messages);
  } catch (error) {
    logError(error, { endpoint: "GET /chat-message" });
    return res.status(500).json({ message: error.message || "채팅 메시지 조회 중 오류가 발생했습니다." });
  }
});

/**
 * 날짜별 채팅 메시지 조회
 */
router.get("/date/:date", async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    const { date } = req.params;
    // date는 YYYY-MM-DD 형식

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "올바른 날짜 형식이 필요합니다. (YYYY-MM-DD)" });
    }

    const messages = await getChatMessagesByDate(user.userId, date);
    return res.status(200).json(messages);
  } catch (error) {
    logError(error, { endpoint: "GET /chat-message/date/:date" });
    return res.status(500).json({ message: error.message || "채팅 메시지 조회 중 오류가 발생했습니다." });
  }
});

/**
 * 채팅 메시지 삭제 (단일)
 */
router.delete("/:messageId", async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const messageId = parseInt(req.params.messageId, 10);
    if (!Number.isInteger(messageId) || messageId <= 0) {
      return res.status(400).json({ message: "유효하지 않은 메시지 ID입니다." });
    }

    const result = await deleteChatMessage(user.userId, messageId);
    return res.status(200).json(result);
  } catch (error) {
    logError(error, { endpoint: "DELETE /chat-message/:messageId" });
    
    if (error.message?.includes("NOT_FOUND")) {
      return res.status(404).json({ message: error.message.replace("NOT_FOUND: ", "") });
    }
    
    return res.status(500).json({ message: error.message || "채팅 메시지 삭제 중 오류가 발생했습니다." });
  }
});

/**
 * 채팅 메시지 일괄 삭제
 */
router.delete("/batch", async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "메시지 ID 배열이 필요합니다." });
    }

    const result = await deleteChatMessages(user.userId, messageIds);
    return res.status(200).json(result);
  } catch (error) {
    logError(error, { endpoint: "DELETE /chat-message/batch" });
    return res.status(500).json({ message: error.message || "채팅 메시지 삭제 중 오류가 발생했습니다." });
  }
});

module.exports = router;

