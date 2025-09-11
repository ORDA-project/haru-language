const express = require("express");
const router = express.Router();
const friendService = require("../services/friendService");
const { User } = require("../models");
const { getUserIdBySocialId } = require("../utils/userUtils");


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
// 移쒓뎄 珥덈? 留곹겕 ?앹꽦
router.post("/invite", async (req, res) => {
  try {
    const { inviterId } = req.body; // social_id
    if (!inviterId) {
      return res.status(400).json({ message: "inviterId媛 ?꾩슂?⑸땲??" });
    }

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualInviterId = await getUserIdBySocialId(inviterId);
    if (!actualInviterId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const inviteLink = await friendService.createInvitation({ inviterId: actualInviterId });
    if (!inviteLink) {
      return res.status(500).json({ message: "珥덈? 留곹겕 ?앹꽦 以??ㅻ쪟 諛쒖깮" });
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
// 移쒓뎄 珥덈? ?묐떟 (?섎씫/嫄곗젅)
router.post("/respond", async (req, res) => {
  try {
    const { token, response, inviteeId } = req.body; // inviteeId??social_id
    if (!token || !response || !inviteeId) {
      return res.status(400).json({ message: "token, response, inviteeId媛 ?꾩슂?⑸땲??" });
    }

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualInviteeId = await getUserIdBySocialId(inviteeId);
    if (!actualInviteeId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const result = await friendService.respondToInvitation({
      token,
      response,
      inviteeId: actualInviteeId
    });

    return res.status(200).json({
      message: response === "accept" ? "移쒓뎄 異붽? ?꾨즺" : "珥덈?媛 嫄곗젅?섏뿀?듬땲??"
    });

  } catch (error) {
    if (error.message.includes("NOT_FOUND")) {
      return res.status(404).json({ message: "?좏슚?섏? ?딆? 珥덈??낅땲??" });
    }
    if (error.message.includes("?대? 移쒓뎄")) {
      return res.status(409).json({ message: "?대? 移쒓뎄?낅땲??" });
    }
    res.status(500).json({ message: "?쒕쾭 ?ㅻ쪟 諛쒖깮" });
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
 *                         example: "?띻만??
 *       400:
 *         description: userId missing
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// 移쒓뎄 紐⑸줉 議고쉶
router.get("/list/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // social_id
    if (!userId) {
      return res.status(400).json({ message: "userId媛 ?꾩슂?⑸땲??" });
    }

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
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
// 移쒓뎄 ??젣
router.delete("/remove", async (req, res) => {
  try {
    const { userId, friendId } = req.body; // ????social_id
    if (!userId || !friendId) {
      return res.status(400).json({ message: "userId? friendId媛 ?꾩슂?⑸땲??" });
    }

    // social_id?ㅼ쓣 ?ㅼ젣 DB id濡?蹂??
    const actualUserId = await getUserIdBySocialId(userId);
    const actualFriendId = await getUserIdBySocialId(friendId);

    if (!actualUserId || !actualFriendId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
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
// 移쒓뎄?먭쾶 肄?李뚮Ⅴ湲?(?뚮┝ ?꾩넚)
router.post("/notifications/send", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body; // ????social_id
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId? receiverId媛 ?꾩슂?⑸땲??" });
    }

    // social_id?ㅼ쓣 ?ㅼ젣 DB id濡?蹂??
    const actualSenderId = await getUserIdBySocialId(senderId);
    const actualReceiverId = await getUserIdBySocialId(receiverId);

    if (!actualSenderId || !actualReceiverId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const result = await friendService.sendNotification({
      senderId: actualSenderId,
      receiverId: actualReceiverId
    });

    res.status(200).json({ message: result.message });
  } catch (error) {
    if (error.message.includes("移쒓뎄媛 ?꾨떃?덈떎")) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "?뚮┝ ?꾩넚 以??ㅻ쪟 諛쒖깮" });
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
 *                   example: "?뚮┝ 議고쉶 ?깃났"
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
 *                         example: "?띻만?숇떂???뱀떊??李붾??듬땲??"
 *                       senderName:
 *                         type: string
 *                         example: "?띻만??
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// ?쎌? ?딆? ?뚮┝ 議고쉶 - ?섏젙??踰꾩쟾
router.get("/notifications/unread/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // social_id

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const notifications = await friendService.getUnreadNotifications(actualUserId);

    // ?뚮┝???놁뼱??200 諛섑솚 (鍮?諛곗뿴)
    res.status(200).json({
      message: "?쎌? ?딆? ?뚮┝???놁뒿?덈떎",
      notifications: (notifications || []).map(n => ({
        id: n.id,
        message: n.message,
        senderName: n.NotificationSender?.name || "?듬챸"
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
// ?쎌쓬 泥섎━???뚮┝ ??젣 - ?섏젙??踰꾩쟾
router.post("/notifications/read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId媛 ?꾩슂?⑸땲??" });
    }

    // social_id瑜??ㅼ젣 DB id濡?蹂??
    const actualUserId = await getUserIdBySocialId(userId);
    if (!actualUserId) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    const result = await friendService.deleteReadNotifications(actualUserId);
    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: "?쒕쾭 ?ㅻ쪟 諛쒖깮" });
  }
});

module.exports = router;
