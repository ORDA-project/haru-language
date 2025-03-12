const { Friend, Invitation, Notification, User } = require("../models");
const { Op } = require("sequelize");
const crypto = require("crypto");

const friendService = {
  // 친구 초대 생성
  createInvitation: async ({ inviterId }) => {
    const token = crypto.randomBytes(16).toString("hex");

    try {
      await Invitation.create({ inviter_id: inviterId, token });
    } catch (error) {
      console.error("초대 생성 오류:", error);
      return null;
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return `${frontendUrl}/invite?token=${token}`;
  },

  // 초대 응답 처리 (수락/거절)
  respondToInvitation: async ({ token, response, inviteeId }) => {
    const invitation = await Invitation.findOne({ where: { token } });
    if (!invitation) {
      console.log("유효하지 않은 초대");
      return null;
    }


    if (invitation.status !== "pending") {
      console.log("이미 사용된 초대");
      return null;
    }

    invitation.status = response === "accept" ? "accepted" : "rejected";
    await invitation.save();

    if (response === "accept") {
      if (!invitation.inviter_id || !inviteeId) {
        console.log("초대자 또는 초대 받은 사용자의 ID가 존재하지 않음");
        return null;
      }

      // 이미 친구인지 확인
      const existingFriend = await Friend.findOne({
        where: {
          [Op.or]: [
            { user_id: invitation.inviter_id, friend_id: inviteeId },
            { user_id: inviteeId, friend_id: invitation.inviter_id }
          ]
        }
      });

      if (existingFriend) {
        console.log("이미 친구");
        return null;
      }

      try {
        await Friend.create({ user_id: invitation.inviter_id, friend_id: inviteeId });
        await Friend.create({ user_id: inviteeId, friend_id: invitation.inviter_id });
        console.log("친구 추가 완료");
      } catch (error) {
        console.error("친구 추가 중 오류 발생:", error);
      }
    }

    return null;
  },

  // 친구 목록 조회
  getFriends: async (userId) => {
    return await Friend.findAll({
      where: { user_id: userId },
      include: [{
        model: User,
        as: "FriendDetails",
        attributes: ["id", "name"]
      }]
    });
  },

  // 친구 삭제
  removeFriend: async ({ userId, friendId }) => {
    try {
      await Friend.destroy({
        where: {
          [Op.or]: [
            { user_id: userId, friend_id: friendId },
            { user_id: friendId, friend_id: userId }
          ]
        }
      });

      return { message: "친구가 삭제되었습니다." };
    } catch (error) {
      console.error("친구 삭제 오류:", error);
      return { error: "친구 삭제 중 오류 발생" };
    }
  },

  // 친구에게 "콕 찌르기" 알림 보내기
  sendNotification: async ({ senderId, receiverId }) => {
    try {

      if (!senderId || !receiverId) {
        return { error: "잘못된 요청입니다." };
      }

      // 발신자 정보 가져오기 (이름 표시)
      const sender = await User.findOne({ where: { id: senderId }, attributes: ["name"] });
      if (!sender) {
        return { error: "발신자 정보가 없습니다." };
      }

      // 친구 관계 확인
      const isFriend = await Friend.findOne({
        where: {
          [Op.or]: [
            { user_id: senderId, friend_id: receiverId },
            { user_id: receiverId, friend_id: senderId }
          ]
        }
      });

      if (!isFriend) {
        return { error: "이 사용자는 친구가 아닙니다." };
      }

      // 알림 저장
      const message = `${sender.name}님이 당신을 찔렀습니다!`;

      await Notification.create({
        user_id: receiverId,
        message: message,
        is_read: false
      });

      return { message: "콕 찌르기 성공" };
    } catch (error) {
      console.error("콕 찌르기 오류 발생:", error);
      return { error: "알림 전송 중 오류 발생" };
    }
  },

  // 읽지 않은 알림 조회 후 읽음 처리
  getUnreadNotifications: async (userId) => {
    try {
      // 읽지 않은 알림 조회
      const notifications = await Notification.findAll({
        where: { user_id: userId, is_read: false },
        include: [{
          model: User,
          as: "NotificationSender",
          attributes: ["name"]
        }],
        attributes: ["id", "message"]
      });

      // 조회한 알림을 읽음 처리
      await Notification.update(
        { is_read: true },
        { where: { user_id: userId, is_read: false } }
      );

      return notifications;
    } catch (error) {
      console.error("읽지 않은 알림 조회 오류:", error);
      return [];
    }
  },

  // 읽음 처리된 알림 삭제
  deleteReadNotifications: async (userId) => {
    try {
      const deletedCount = await Notification.destroy({
        where: { user_id: userId, is_read: true } // ✅ 읽음 상태인 알림만 삭제
      });
      if (deletedCount === 0) {
        return { message: "삭제할 알림이 없습니다." };
      }
      return { message: "알림이 성공적으로 삭제되었습니다." };
    } catch (error) {
      return { error: "알림 삭제 중 오류 발생" };
    }
  }
}

module.exports = friendService;
