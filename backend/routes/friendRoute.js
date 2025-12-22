const express = require("express");
const router = express.Router();
const friendService = require("../services/friendService");
const { getUserIdBySocialId } = require("../utils/userUtils");

const FRIEND_LIMIT = Number(process.env.FRIEND_LIMIT || 5);

// 유틸리티 함수들
const sanitizeIdentifier = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
};

const toInternalId = async (identifier) => {
  if (!identifier) return null;
  const directId = sanitizeIdentifier(identifier);
  if (directId !== null) return directId;
  if (typeof identifier === "string" && identifier.trim()) {
    return getUserIdBySocialId(identifier.trim());
  }
  return null;
};

const getSessionUserId = async (req) => {
  const authUser = req.user;
  if (authUser?.userId) return authUser.userId;
  if (authUser?.social_id) return getUserIdBySocialId(authUser.social_id);
  
  const sessionUser = req.session?.user;
  if (sessionUser?.userId) return sessionUser.userId;
  if (sessionUser?.social_id) return getUserIdBySocialId(sessionUser.social_id);
  
  return null;
};

// 공통 에러 핸들러
const handleError = (error, res) => {
  if (error.message?.includes("NOT_FOUND")) {
    return res.status(404).json({ message: error.message.replace("NOT_FOUND: ", "") });
  }
  if (error.message?.includes("BAD_REQUEST")) {
    return res.status(400).json({ message: error.message.replace("BAD_REQUEST: ", "") });
  }
  if (error.message?.includes("FORBIDDEN")) {
    return res.status(403).json({ message: error.message.replace("FORBIDDEN: ", "") });
  }
  if (error.code === "FRIEND_LIMIT_REACHED") {
    return res.status(409).json({ message: `친구는 최대 ${FRIEND_LIMIT}명까지 등록할 수 있습니다.` });
  }
  return res.status(500).json({ message: "서버 오류가 발생했습니다." });
};

const formatFriendList = (friends) =>
  (friends || [])
    .map((friend) => ({
      id: friend.FriendDetails?.id ?? null,
      socialId: friend.FriendDetails?.social_id ?? null,
      name: friend.FriendDetails?.name ?? "친구",
      goal: friend.FriendDetails?.goal ?? null,
      gender: friend.FriendDetails?.gender ?? null,
      stats: friend.FriendDetails?.stats ?? null,
    }))
    .filter((friend) => friend.id !== null);

/**
 * @openapi
 * /friends/invite:
 *   post:
 *     summary: 친구 초대 링크 생성
 *     description: 세션에 있는 사용자 정보를 기반으로 초대 링크를 생성합니다.
 *     tags:
 *       - Friend
 *     responses:
 *       201:
 *         description: 초대 링크 생성 성공
 *       401:
 *         description: 인증되지 않은 요청
 *       409:
 *         description: 친구 인원 한도를 초과함
 *       500:
 *         description: 서버 오류
 */
router.post("/invite", async (req, res) => {
  try {
    const inviterId = await getSessionUserId(req);
    if (!inviterId) return res.status(401).json({ message: "로그인이 필요합니다." });

    const inviteLink = await friendService.createInvitation({ inviterId });
    return res.status(201).json({ inviteLink, limit: FRIEND_LIMIT });
  } catch (error) {
    return handleError(error, res);
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
 *                 description: 초대 토큰
 *               response:
 *                 type: string
 *                 enum: [accept, decline]
 *               inviteeId:
 *                 type: string
 *                 description: (선택) 세션이 없을 때 사용할 social_id
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

    // 보안: 입력값 검증
    if (!token || typeof token !== "string" || token.length > 200) {
      return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
    }
    if (!response || (response !== "accept" && response !== "decline")) {
      return res.status(400).json({ message: "response는 'accept' 또는 'decline'이어야 합니다." });
    }

    const sessionInviteeId = await getSessionUserId(req);
    const actualInviteeId = sessionInviteeId || (await toInternalId(inviteeId));
    if (!actualInviteeId) return res.status(401).json({ message: "로그인이 필요합니다." });

    await friendService.respondToInvitation({
      token: token.trim(),
      response,
      inviteeId: actualInviteeId,
    });

    return res.status(200).json({
      message: response === "accept" ? "친구 추가 완료" : "초대가 거절되었습니다.",
    });
  } catch (error) {
    if (error.message?.includes("이미 친구")) {
      return res.status(409).json({ message: "이미 친구입니다." });
    }
    return handleError(error, res);
  }
});

/**
 * @openapi
 * /friends:
 *   get:
 *     summary: 로그인한 사용자의 친구 목록 조회
 *     tags:
 *       - Friend
 *     responses:
 *       200:
 *         description: 친구 목록 조회 성공
 *       401:
 *         description: 인증되지 않은 요청
 */
router.get("/", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

    const friends = await friendService.getFriends(userId);
    const formatted = formatFriendList(friends);

    return res.status(200).json({
      friends: formatted,
      count: formatted.length,
      limit: FRIEND_LIMIT,
    });
  } catch (error) {
    return handleError(error, res);
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
    const actualUserId = await toInternalId(req.params.userId);
    if (!actualUserId) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const friends = await friendService.getFriends(actualUserId);
    return res.status(200).json({ friends: formatFriendList(friends) });
  } catch (error) {
    return handleError(error, res);
  }
});

/**
 * @openapi
 * /friends/remove:
 *   delete:
 *     summary: 친구 삭제
 *     tags:
 *       - Friend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: integer
 *               friendSocialId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 친구 삭제 성공
 *       401:
 *         description: 인증되지 않은 요청
 *       500:
 *         description: 서버 오류
 */
router.delete("/remove", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

    const { friendId, friendSocialId } = req.body || {};
    const actualFriendId = friendId || (await toInternalId(friendSocialId));
    if (!actualFriendId) return res.status(400).json({ message: "friendId가 필요합니다." });

    const result = await friendService.removeFriend({ userId, friendId: actualFriendId });
    return res.status(200).json({ message: result.message });
  } catch (error) {
    return handleError(error, res);
  }
});

/**
 * @openapi
 * /friends/notifications/send:
 *   post:
 *     summary: 친구에게 알림 전송
 *     tags:
 *       - Friend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: integer
 *               receiverSocialId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 알림 전송 성공
 *       401:
 *         description: 인증되지 않은 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/notifications/send", async (req, res) => {
  try {
    const senderId = await getSessionUserId(req);
    if (!senderId) return res.status(401).json({ message: "로그인이 필요합니다." });

    const { receiverId, receiverSocialId } = req.body || {};
    const actualReceiverId = receiverId || (await toInternalId(receiverSocialId));
    if (!actualReceiverId) return res.status(400).json({ message: "receiverId가 필요합니다." });

    const result = await friendService.sendNotification({ senderId, receiverId: actualReceiverId });
    return res.status(200).json({ message: result.message });
  } catch (error) {
    return handleError(error, res);
  }
});

/**
 * @openapi
 * /friends/notifications/unread:
 *   get:
 *     summary: 읽지 않은 친구 알림 조회
 *     description: 읽지 않은 알림을 조회합니다. 읽음 처리는 별도 API로 처리합니다.
 *     tags:
 *       - Friend
 *     responses:
 *       200:
 *         description: 읽지 않은 알림 조회 성공
 *       401:
 *         description: 인증되지 않은 요청
 *       500:
 *         description: 서버 오류
 */
router.get("/notifications/unread", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

    const notifications = await friendService.getUnreadNotifications(userId);
    return res.status(200).json({
      message: notifications?.length ? "읽지 않은 알림 조회 성공" : "읽지 않은 알림이 없습니다.",
      notifications: (notifications || []).map((notification) => ({
        id: notification.id,
        message: notification.message,
        senderName: notification.NotificationSender?.name || "익명",
        createdAt: notification.createdAt,
      })),
    });
  } catch (error) {
    return handleError(error, res);
  }
});

/**
 * @openapi
 * /friends/notifications/read:
 *   post:
 *     summary: 알림 읽음 처리
 *     description: 조회한 알림들을 읽음 처리합니다. 알림 ID 배열을 받아 처리합니다.
 *     tags:
 *       - Friend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 읽음 처리할 알림 ID 배열
 *     responses:
 *       200:
 *         description: 읽음 처리 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증되지 않은 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/notifications/read", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

    const { notificationIds } = req.body;
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ message: "notificationIds 배열이 필요합니다." });
    }

    const result = await friendService.markNotificationsAsRead(userId, notificationIds);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
});

/**
 * @openapi
 * /friends/notifications/read-list:
 *   get:
 *     summary: 읽은 알림 조회 (알림 기록)
 *     description: 읽음 처리된 알림 기록을 조회합니다.
 *     tags:
 *       - Friend
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 조회할 알림 개수 (최대 100)
 *     responses:
 *       200:
 *         description: 알림 기록 조회 성공
 *       401:
 *         description: 인증되지 않은 요청
 *       500:
 *         description: 서버 오류
 */
router.get("/notifications/read-list", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

    const limit = parseInt(req.query.limit) || 50;
    const notifications = await friendService.getReadNotifications(userId, limit);
    return res.status(200).json({
      message: "알림 기록 조회 성공",
      notifications: (notifications || []).map((notification) => ({
        id: notification.id,
        message: notification.message,
        senderName: notification.NotificationSender?.name || "익명",
        createdAt: notification.createdAt,
      })),
    });
  } catch (error) {
    return handleError(error, res);
  }
});

/**
 * @openapi
 * /friends/notifications/delete:
 *   post:
 *     summary: 읽은 알림 삭제
 *     description: 읽음 처리된 알림을 삭제합니다.
 *     tags:
 *       - Friend
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       401:
 *         description: 인증되지 않은 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/notifications/delete", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });

    const result = await friendService.deleteReadNotifications(userId);
    return res.status(200).json({ message: result.message });
  } catch (error) {
    return handleError(error, res);
  }
});

module.exports = router;

