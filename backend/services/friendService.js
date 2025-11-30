const { Friend, Invitation, Notification, User, Question, WritingRecord } = require("../models");
const { Op } = require("sequelize");
const crypto = require("crypto");

const FRIEND_LIMIT = Number(process.env.FRIEND_LIMIT || 5);

const ensureFriendLimit = async (userId) => {
  const friendCount = await Friend.count({ where: { user_id: userId } });
  if (friendCount >= FRIEND_LIMIT) {
    const error = new Error("FRIEND_LIMIT_REACHED");
    error.code = "FRIEND_LIMIT_REACHED";
    throw error;
  }
};

const friendService = {
  // 친구 초대 생성
  createInvitation: async ({ inviterId }) => {
    if (!inviterId) throw new Error("BAD_REQUEST: inviterId는 필수입니다.");

    await ensureFriendLimit(inviterId);

    const token = crypto.randomBytes(16).toString("hex");
    await Invitation.create({ inviter_id: inviterId, token });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    return `${clientUrl}/invite?token=${token}`;
  },

  // 초대 응답 처리 (수락/거절)
  respondToInvitation: async ({ token, response, inviteeId }) => {
    const invitation = await Invitation.findOne({ where: { token } });
    if (!invitation) throw new Error("NOT_FOUND: 유효하지 않은 초대입니다.");

    // status 체크 제거 - 여러 명이 사용할 수 있도록
    // if (invitation.status !== "pending") {
    //   throw new Error("BAD_REQUEST: 이미 응답된 초대입니다.");
    // }

    if (response === "accept") {
      // 이미 친구인지 확인
      const existingFriend = await Friend.findOne({
        where: {
          [Op.or]: [
            { user_id: invitation.inviter_id, friend_id: inviteeId },
            { user_id: inviteeId, friend_id: invitation.inviter_id },
          ],
        },
      });

      if (existingFriend) {
        throw new Error("BAD_REQUEST: 이미 친구입니다.");
      }

      // 친구 관계 생성
      await Friend.bulkCreate([
        { user_id: invitation.inviter_id, friend_id: inviteeId },
        { user_id: inviteeId, friend_id: invitation.inviter_id },
      ]);
    }
  },

  // 친구 목록 조회
  getFriends: async (userId) => {
    if (!userId) throw new Error("BAD_REQUEST: userId가 필요합니다.");

    const friends = await Friend.findAll({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: "FriendDetails",
          attributes: ["id", "name", "social_id", "goal", "gender"],
          required: true,
        },
      ],
    });

    // 각 친구의 학습 횟수와 작문 횟수 계산
    const friendsWithStats = await Promise.all(
      friends.map(async (friend) => {
        const friendId = friend.FriendDetails?.id;
        if (!friendId) return friend;

        // 학습 횟수 (Question 테이블의 레코드 수)
        const learningCount = await Question.count({
          where: { user_id: friendId },
        });

        // 작문 횟수 (WritingRecord 테이블의 레코드 수)
        const writingCount = await WritingRecord.count({
          where: { user_id: friendId },
        });

        // 통계 정보를 friend 객체에 추가
        friend.FriendDetails.stats = {
          learningCount,
          writingCount,
        };

        return friend;
      })
    );

    return friendsWithStats;
  },

  // 친구 삭제
  removeFriend: async ({ userId, friendId }) => {
    if (!userId || !friendId) {
      throw new Error("BAD_REQUEST: userId와 friendId는 필수입니다.");
    }

    const deleted = await Friend.destroy({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId },
        ],
      },
    });

    if (deleted === 0) {
      throw new Error("NOT_FOUND: 친구 관계가 존재하지 않습니다.");
    }

    return { message: "친구 삭제 완료" };
  },

  // 친구에게 "콕 찌르기" 알림 보내기
  sendNotification: async ({ senderId, receiverId }) => {
    if (!senderId || !receiverId) {
      throw new Error("BAD_REQUEST: senderId와 receiverId는 필수입니다.");
    }

    const sender = await User.findOne({ where: { id: senderId }, attributes: ["name"] });
    if (!sender) throw new Error("NOT_FOUND: 발신자 정보가 없습니다.");

    const isFriend = await Friend.findOne({
      where: {
        [Op.or]: [
          { user_id: senderId, friend_id: receiverId },
          { user_id: receiverId, friend_id: senderId },
        ],
      },
    });

    if (!isFriend) throw new Error("FORBIDDEN: 이 사용자는 친구가 아닙니다.");

    // XSS 방지: HTML 특수문자 이스케이프
    const safeName = (sender.name || "친구")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

    await Notification.create({
      user_id: receiverId,
      sender_id: senderId,
      message: `${safeName}님이 당신을 콕 찔렀습니다!`,
      is_read: false,
    });

    return { message: "콕 찌르기 성공" };
  },

  // 읽지 않은 알림 조회 (읽음 처리 안 함 - 프론트엔드에서 표시 후 읽음 처리)
  getUnreadNotifications: async (userId) => {
    if (!userId) throw new Error("BAD_REQUEST: userId가 필요합니다.");

    const notifications = await Notification.findAll({
      where: { user_id: userId, is_read: false },
      attributes: ["id", "message", "created_at"], // Notification 모델은 field: 'created_at'으로 매핑되어 있지만 일관성을 위해 직접 사용
      include: [
        {
          model: User,
          as: "NotificationSender",
          attributes: ["name"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]], // 최신 알림부터
    });

    return notifications;
  },

  // 알림 읽음 처리 (알림을 확인한 후 명시적으로 읽음 처리)
  markNotificationsAsRead: async (userId, notificationIds) => {
    if (!userId) throw new Error("BAD_REQUEST: userId가 필요합니다.");
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new Error("BAD_REQUEST: notificationIds 배열이 필요합니다.");
    }

    // 보안: 배열 크기 제한 (DoS 방지)
    if (notificationIds.length > 100) {
      throw new Error("BAD_REQUEST: 한 번에 최대 100개의 알림만 읽음 처리할 수 있습니다.");
    }

    // 보안: 각 ID가 유효한 정수인지 검증
    const validIds = notificationIds
      .filter((id) => typeof id === "number" && Number.isInteger(id) && id > 0 && id < Number.MAX_SAFE_INTEGER)
      .map((id) => Number(id));

    if (validIds.length === 0) {
      throw new Error("BAD_REQUEST: 유효한 알림 ID가 없습니다.");
    }

    // 보안: 사용자가 소유한 알림만 읽음 처리 (권한 검증)
    const updated = await Notification.update(
      { is_read: true },
      {
        where: {
          id: { [Op.in]: validIds },
          user_id: userId, // 반드시 현재 사용자의 알림만 처리
          is_read: false, // 읽지 않은 알림만 읽음 처리
        },
      }
    );

    return {
      message: `${updated[0]}개의 알림이 읽음 처리되었습니다.`,
      count: updated[0],
    };
  },

  // 읽음 처리된 알림 삭제
  deleteReadNotifications: async (userId) => {
    if (!userId) throw new Error("BAD_REQUEST: user_id가 필요합니다.");

    const deletedCount = await Notification.destroy({
      where: { user_id: userId, is_read: true },
    });

    if (deletedCount === 0) {
      return { message: "삭제할 알림이 없습니다." };
    }

    return { message: "알림이 성공적으로 삭제되었습니다." };
  },
};

module.exports = friendService;
