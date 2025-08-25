const express = require("express");
const router = express.Router();
const friendService = require("../services/friendService");

/**
 * @swagger
 * /friends/invite:
 *   post:
 *     summary: 친구 초대 링크 생성
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviterId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: 초대 링크 생성 성공
 *       400:
 *         description: inviterId가 필요함
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /friends/respond:
 *   post:
 *     summary: 친구 초대 응답
 *     description: 친구 초대를 수락하거나 거절합니다
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "invite_token_123"
 *               response:
 *                 type: string
 *                 enum: [accept, reject]
 *                 example: "accept"
 *               inviteeId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: 응답 처리 성공
 *       400:
 *         description: 필수 파라미터 누락
 *       404:
 *         description: 유효하지 않은 초대
 *       409:
 *         description: 이미 친구 관계
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /friends/list/{userId}:
 *   get:
 *     summary: 친구 목록 조회
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 친구 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       400:
 *         description: userId가 필요함
 *       404:
 *         description: 친구 목록이 존재하지 않음
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /friends/remove:
 *   delete:
 *     summary: 친구 삭제
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               friendId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: 친구 삭제 성공
 *       400:
 *         description: userId와 friendId가 필요함
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /friends/notifications/send:
 *   post:
 *     summary: 친구에게 알림 전송
 *     description: 친구에게 콕 찌르기 알림을 전송합니다
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: integer
 *                 example: 1
 *               receiverId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: 알림 전송 성공
 *       400:
 *         description: senderId와 receiverId가 필요함
 *       403:
 *         description: 친구가 아닌 사용자
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /friends/notifications/unread/{userId}:
 *   get:
 *     summary: 읽지 않은 알림 조회
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 읽지 않은 알림 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       sender_name:
 *                         type: string
 *       404:
 *         description: 읽지 않은 알림이 없음
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /friends/notifications/read:
 *   post:
 *     summary: 읽은 알림 삭제
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: 읽은 알림 삭제 성공
 *       400:
 *         description: user_id가 필요함
 *       500:
 *         description: 서버 오류
 */
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
