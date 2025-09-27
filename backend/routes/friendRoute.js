const express = require("express");
const router = express.Router();
const friendService = require("../services/friendService");
const { User } = require("../models");
const { getUserIdBySocialId, getSocialIdFromSession } = require("../utils/userUtils");

/**
 * @openapi
 * /friends/invite:
 *   post:
 *     summary: Create a friend invitation link (uses social_id)
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
 *                 example: "test123"
 *                 description: User's social_id
 *     responses:
 *       200:
 *         description: Invitation link created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inviteLink:
 *                   type: string
 *                   example: "http://localhost:3000/invite?token=abc123"
 *       400:
 *         description: inviterId missing
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// 친구 초대 링크 생성
router.post("/invite", async (req, res) => {
  try {
    const { inviterId } = req.body; // social_id
    if (!inviterId) {
      return res.status(400).json({ message: "inviterId가 필요합니다" });
    }

    // social_id를 실제 DB id로 변환
    const actualInviterId = await getUserIdBySocialId(inviterId);
    if (!actualInviterId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const inviteLink = await friendService.createInvitation({ inviterId: actualInviterId });
    if (!inviteLink) {
      return res.status(500).json({ message: "초대 링크 생성 중 오류 발생" });
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
 *     summary: Respond to a friend invitation (accept/decline) - uses social_id
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
 *                 example: "abc123def456"
 *               response:
 *                 type: string
 *                 enum: [accept, decline]
 *                 example: "accept"
 *               inviteeId:
 *                 type: string
 *                 example: "test123"
 *                 description: Invitee's social_id
 *     responses:
 *       200:
 *         description: Friend response processed
 *       400:
 *         description: Missing fields
 *       404:
 *         description: Invalid invitation or user not found
 *       409:
 *         description: Already friends
 *       500:
 *         description: Server error
 */
// 친구 초대 응답 (수락/거절)
router.post("/respond", async (req, res) => {
  try {
    const { token, response, inviteeId } = req.body; // inviteeId는 social_id
    if (!token || !response || !inviteeId) {
      return res.status(400).json({ message: "token, response, inviteeId가 필요합니다" });
    }

    // social_id를 실제 DB id로 변환
    const actualInviteeId = await getUserIdBySocialId(inviteeId);
    if (!actualInviteeId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const result = await friendService.respondToInvitation({
      token,
      response,
      inviteeId: actualInviteeId
    });

    return res.status(200).json({
      message: response === "accept" ? "친구 추가 완료" : "초대가 거절되었습니다"
    });

  } catch (error) {
    if (error.message.includes("NOT_FOUND")) {
      return res.status(404).json({ message: "유효하지 않은 초대입니다" });
    }
    if (error.message.includes("이미 친구")) {
      return res.status(409).json({ message: "이미 친구입니다" });
    }
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

/**
 * @openapi
 * /friends/list/{userId}:
 *   get:
 *     summary: Get a user's friend list (uses social_id)
 *     tags:
 *       - Friend
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: "test123"
 *         description: User's social_id
 *     responses:
 *       200:
 *         description: List of friends
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
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "홍길동"
 *       400:
 *         description: userId missing
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// 친구 목록 조회
router.get("/list/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // social_id
    if (!userId) {
      return res.status(400).json({ message: "userId가 필요합니다" });
    }

    // social_id를 실제 DB id로 변환
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const friends = await friendService.getFriends(actualUserId);
    const formatted = (friends || [])
      .map(f => ({
        id: f.FriendDetails?.id ?? null,
        name: f.FriendDetails?.name ?? null,
      }))
      .filter(x => x.id !== null);
    return res.status(200).json({ friends: formatted });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /friends/remove:
 *   delete:
 *     summary: Remove a friend (uses social_id)
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
 *                 example: "test123"
 *                 description: User's social_id
 *               friendId:
 *                 type: string
 *                 example: "google_456"
 *                 description: Friend's social_id
 *     responses:
 *       200:
 *         description: Friend removed successfully
 *       400:
 *         description: Missing fields
 *       404:
 *         description: User not found or not friends
 *       500:
 *         description: Server error
 */
// 친구 삭제
router.delete("/remove", async (req, res) => {
  try {
    const { userId, friendId } = req.body; // 둘다 social_id
    if (!userId || !friendId) {
      return res.status(400).json({ message: "userId와 friendId가 필요합니다" });
    }

    // social_id들을 실제 DB id로 변환
    const actualUserId = await getUserIdBySocialId(userId);
    const actualFriendId = await getUserIdBySocialId(friendId);

    if (!actualUserId || !actualFriendId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const result = await friendService.removeFriend({
      userId: actualUserId,
      friendId: actualFriendId
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
 *     summary: Send a "poke" notification to a friend (uses social_id)
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
 *                 example: "test123"
 *                 description: Sender's social_id
 *               receiverId:
 *                 type: string
 *                 example: "google_456"
 *                 description: Receiver's social_id
 *     responses:
 *       200:
 *         description: Notification sent
 *       400:
 *         description: Missing fields
 *       403:
 *         description: Not friends
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// 친구에게 콕 찌르기 (푸시 전송)
router.post("/notifications/send", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body; // 둘다 social_id
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId와 receiverId가 필요합니다" });
    }

    // social_id들을 실제 DB id로 변환
    const actualSenderId = await getUserIdBySocialId(senderId);
    const actualReceiverId = await getUserIdBySocialId(receiverId);

    if (!actualSenderId || !actualReceiverId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const result = await friendService.sendNotification({
      senderId: actualSenderId,
      receiverId: actualReceiverId
    });

    res.status(200).json({ message: result.message });
  } catch (error) {
    if (error.message.includes("친구가 아닙니다")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "푸시 전송 중 오류 발생" });
  }
});

/**
 * @openapi
 * /friends/notifications/unread/{userId}:
 *   get:
 *     summary: Get unread notifications for a user (uses social_id)
 *     tags:
 *       - Friend
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: "test123"
 *         description: User's social_id
 *     responses:
 *       200:
 *         description: Unread notifications retrieved successfully (empty array if no notifications)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "푸시 조회 성공"
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       message:
 *                         type: string
 *                         example: "홍길동님이 당신을 콕 찔렀습니다!"
 *                       senderName:
 *                         type: string
 *                         example: "홍길동"
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// 읽지 않은 푸시 조회 - 수정된 버전
router.get("/notifications/unread/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // social_id

    // social_id를 실제 DB id로 변환
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const notifications = await friendService.getUnreadNotifications(actualUserId);

    // 푸시가 없어도 200 반환 (빈 배열)
    res.status(200).json({
      message: "읽지 않은 푸시가 없습니다",
      notifications: (notifications || []).map(n => ({
        id: n.id,
        message: n.message,
        senderName: n.NotificationSender?.name || "익명"
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @openapi
 * /friends/notifications/read:
 *   post:
 *     summary: Delete read notifications for a user (uses social_id)
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
 *                 example: "test123"
 *                 description: User's social_id
 *     responses:
 *       200:
 *         description: Notifications deleted successfully
 *       400:
 *         description: Missing userId
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// 읽음 처리된 푸시 삭제 - 수정된 버전
router.post("/notifications/read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId가 필요합니다" });
    }

    // social_id를 실제 DB id로 변환
    const actualUserId = await getUserIdBySocialId(userId);
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