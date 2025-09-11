const { Friend, Invitation, Notification, User } = require("../models");
const { Op } = require("sequelize");
const crypto = require("crypto");

const friendService = {
  // 친구 초대 생성
  createInvitation: async ({ inviterId }) => {
    if (!inviterId) throw new Error("BAD_REQUEST: inviterId는 필수입니다.");

    const token = crypto.randomBytes(16).toString("hex");
    await Invitation.create({ inviter_id: inviterId, token });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return `${frontendUrl}/invite?token=${token}`;
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
      include: [{
        model: User,
        as: "FriendDetails",
        attributes: ["id", "name"],
        required: true,
      }],
    });

    return friends;
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

    await Notification.create({
      user_id: receiverId,
      sender_id: senderId,
      message: `${sender.name}님이 당신을 콕 찔렀습니다!`,
      is_read: false,
    });

    return { message: "콕 찌르기 성공" };
  },

  // 읽지 않은 알림 조회 후 읽음 처리
  getUnreadNotifications: async (userId) => {
    if (!userId) throw new Error("BAD_REQUEST: userId가 필요합니다.");

    const notifications = await Notification.findAll({
      where: { user_id: userId, is_read: false },
      attributes: ["id", "message"],
    });

    await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });

    return notifications;
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
