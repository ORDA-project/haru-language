const express = require("express");
const router = express.Router();
const friendService = require("../services/friendService");

// 친구 초대 링크 생성
router.post("/invite", async (req, res) => {
  try {
    const { inviterId } = req.body;
    if (!inviterId) {
      return res.status(400).json({ message: "inviterId가 필요합니다." });
    }

    const inviteLink = await friendService.createInvitation({ inviterId });
    if (!inviteLink) {
      return res.status(500).json({ message: "초대 링크 생성 중 오류 발생" });
    }
    res.status(200).json({ inviteLink });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 친구 초대 응답 (수락/거절)
router.post("/respond", async (req, res) => {
  try {
    const { token, response, inviteeId } = req.body;
    if (!token || !response || !inviteeId) {
      return res.status(400).json({ message: "token, response, inviteeId가 필요합니다." });
    }

    const result = await friendService.respondToInvitation({ token, response, inviteeId });
    if (result === "invalid") {
      return res.status(404).json({ message: "유효하지 않은 초대입니다." });
    }
    if (result === "already_friends") {
      return res.status(409).json({ message: "이미 친구입니다." });
    }
    if (result === "error") {
      return res.status(500).json({ message: "친구 추가 중 오류가 발생했습니다." });
    }

    return res.status(200).json({ message: response === "accept" ? "친구 추가 완료" : "초대가 거절되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// 친구 목록 조회
router.get("/list/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "userId가 필요합니다." });
    }

    const friends = await friendService.getFriends(userId);
    if (!friends || friends.length === 0) {
      return res.status(404).json({ message: "친구 목록이 존재하지 않습니다." });
    }

    const formatted = friends.map(f => ({
      id: f.FriendDetails.id,
      name: f.FriendDetails.name
    }));

    res.status(200).json({ friends: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 친구 삭제
router.delete("/remove", async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
      return res.status(400).json({ message: "userId와 friendId가 필요합니다." });
    }

    const result = await friendService.removeFriend({ userId, friendId });
    if (result.error) {
      return res.status(500).json({ message: result.error });
    }

    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 친구에게 콕 찌르기 (알림 전송)
router.post("/notifications/send", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId와 receiverId가 필요합니다." });
    }

    const result = await friendService.sendNotification({ senderId, receiverId });
    if (result.error === "이 사용자는 친구가 아닙니다.") {
      return res.status(403).json({ message: result.error });
    }
    if (result.error) {
      return res.status(500).json({ message: result.error });
    }

    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: "알림 전송 중 오류 발생" });
  }
});

// 읽지 않은 알림 조회 후 읽음 처리
router.get("/notifications/unread/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await friendService.getUnreadNotifications(userId);

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "읽지 않은 알림이 없습니다." });
    }

    res.status(200).json({
      message: "읽지 않은 알림 조회 성공",
      notifications: notifications.map(n => ({
        id: n.id,
        message: n.message,
        sender_name: n.NotificationSender?.name || "익명"
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 읽음 처리된 알림 삭제
router.post("/notifications/read", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id가 필요합니다." });
    }

    const result = await friendService.deleteReadNotifications(user_id);
    if (result.error) {
      return res.status(500).json({ message: result.error });
    }

    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
