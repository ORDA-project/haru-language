const express = require("express");
const router = express.Router();
const friendService = require("../services/friendService");
const { getUserIdBySocialId } = require("../utils/userUtils");

const toInternalId = async (socialId) => {
  if (!socialId?.trim()) {
    return null;
  }
  return getUserIdBySocialId(socialId);
};

/**
 * @openapi
 * /friends/invite:
 *   post:
 *     summary: Create a friend invitation link
 *     description: social_id를 사용해 초대 링크를 생성합니다.
 *     tags:
 *       - Friend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviterId:
 *                 type: string
 *                 description: 초대자의 social_id
 *     responses:
 *       200:
 *         description: 초대 링크 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/invite", async (req, res) => {
  try {
    const { inviterId } = req.body;
    if (!inviterId) {
      return res.status(400).json({ message: "inviterId가 필요합니다." });
    }

    const actualInviterId = await toInternalId(inviterId);
    if (!actualInviterId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const inviteLink = await friendService.createInvitation({ inviterId: actualInviterId });
    if (!inviteLink) {
      return res.status(500).json({ message: "초대 링크 생성 중 오류가 발생했습니다." });
    }

    res.status(200).json({ inviteLink });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /friends/respond:
 *   post:
 *     summary: Respond to a friend invitation
 *     tags:
 *       - Friend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               response:
 *                 type: string
 *                 enum: [accept, decline]
 *               inviteeId:
 *                 type: string
 *                 description: social_id of invitee
 *     responses:
 *       200:
 *         description: 응답 처리 성공
 *       400:
 *         description: 필수 항목 누락
 *       404:
 *         description: 초대 또는 사용자를 찾을 수 없음
 *       409:
 *         description: 이미 친구 상태
 *       500:
 *         description: 서버 오류
 */
router.post("/respond", async (req, res) => {
  try {
    const { token, response, inviteeId } = req.body;
    if (!token || !response || !inviteeId) {
      return res.status(400).json({ message: "token, response, inviteeId가 필요합니다." });
    }

    const actualInviteeId = await toInternalId(inviteeId);
    if (!actualInviteeId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    await friendService.respondToInvitation({
      token,
      response,
      inviteeId: actualInviteeId,
    });

    res.status(200).json({
      message: response === "accept" ? "친구 추가 완료" : "초대가 거절되었습니다.",
    });
  } catch (error) {
    if (error.message?.includes("NOT_FOUND")) {
      return res.status(404).json({ message: "유효하지 않은 초대입니다." });
    }
    if (error.message?.includes("이미 친구")) {
      return res.status(409).json({ message: "이미 친구입니다." });
    }
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

/**
 * @openapi
 * /friends/list/{userId}:
 *   get:
 *     summary: Get friend list by social_id
 *     tags:
 *       - Friend
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: social_id
 *     responses:
 *       200:
 *         description: 친구 목록 조회 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/list/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "userId가 필요합니다." });
    }

    const actualUserId = await toInternalId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const friends = await friendService.getFriends(actualUserId);
    const formatted = (friends || [])
      .map((friend) => ({
        id: friend.FriendDetails?.id ?? null,
        name: friend.FriendDetails?.name ?? null,
      }))
      .filter((friend) => friend.id !== null);

    res.status(200).json({ friends: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /friends/remove:
 *   delete:
 *     summary: Remove a friend
 *     tags:
 *       - Friend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               friendId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 친구 삭제 성공
 *       400:
 *         description: 필수 항목 누락
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.delete("/remove", async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
      return res.status(400).json({ message: "userId와 friendId가 필요합니다." });
    }

    const actualUserId = await toInternalId(userId);
    const actualFriendId = await toInternalId(friendId);

    if (!actualUserId || !actualFriendId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const result = await friendService.removeFriend({
      userId: actualUserId,
      friendId: actualFriendId,
    });

    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /friends/notifications/send:
 *   post:
 *     summary: Send a notification (poke) to a friend
 *     tags:
 *       - Friend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: string
 *               receiverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 알림 전송 성공
 *       400:
 *         description: 필수 항목 누락
 *       403:
 *         description: 친구가 아님
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/notifications/send", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId와 receiverId가 필요합니다." });
    }

    const actualSenderId = await toInternalId(senderId);
    const actualReceiverId = await toInternalId(receiverId);

    if (!actualSenderId || !actualReceiverId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const result = await friendService.sendNotification({
      senderId: actualSenderId,
      receiverId: actualReceiverId,
    });

    res.status(200).json({ message: result.message });
  } catch (error) {
    if (error.message?.includes("친구가 아닙니다")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "푸시 전송 중 오류가 발생했습니다." });
  }
});

/**
 * @openapi
 * /friends/notifications/unread/{userId}:
 *   get:
 *     summary: Get unread notifications
 *     tags:
 *       - Friend
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: social_id
 *     responses:
 *       200:
 *         description: 읽지 않은 알림 조회 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/notifications/unread/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const actualUserId = await toInternalId(userId);

    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const notifications = await friendService.getUnreadNotifications(actualUserId);
    res.status(200).json({
      message: notifications?.length ? "푸시 조회 성공" : "읽지 않은 푸시가 없습니다.",
      notifications: (notifications || []).map((notification) => ({
        id: notification.id,
        message: notification.message,
        senderName: notification.NotificationSender?.name || "익명",
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /friends/notifications/read:
 *   post:
 *     summary: Delete read notifications
 *     tags:
 *       - Friend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: social_id
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/notifications/read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId가 필요합니다." });
    }

    const actualUserId = await toInternalId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const result = await friendService.deleteReadNotifications(actualUserId);
    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;

