const express = require("express");
const {
  saveChatMessage,
  saveChatMessages,
  getChatMessagesByDate,
  getRecentChatMessages,
  createInitialGreeting,
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
 * 조회만 수행, 사이드 이펙트 없음
 */
router.get("/", async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    // 캐시 방지 헤더 설정
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
 * 초기 인사말 생성 (한 번만 생성)
 * 이미 존재하면 기존 메시지 반환
 */
router.post("/initialize", async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    // 먼저 기존 메시지 확인
    const existingMessages = await getRecentChatMessages(user.userId);
    
    // 이미 메시지가 있으면 첫 번째 메시지 반환 (생성하지 않음)
    if (existingMessages.length > 0) {
      return res.status(200).json(existingMessages[0]);
    }

    // 메시지가 없으면 초기 인사말 생성 (트랜잭션 + Lock으로 중복 방지)
    const initialMessage = await createInitialGreeting(user.userId);
    
    if (!initialMessage) {
      // 생성 실패 시 다시 조회 (다른 요청에서 이미 생성했을 수 있음)
      const messages = await getRecentChatMessages(user.userId);
      if (messages.length > 0) {
        return res.status(200).json(messages[0]);
      }
      return res.status(200).json({ message: "이미 초기 메시지가 존재합니다." });
    }

    return res.status(201).json(initialMessage);
  } catch (error) {
    logError(error, { endpoint: "POST /chat-message/initialize" });
    return res.status(500).json({ message: error.message || "초기 인사말 생성 중 오류가 발생했습니다." });
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
