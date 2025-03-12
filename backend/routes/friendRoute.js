const express = require("express");
const router = express.Router();
const friendService = require("../services/friendService");

// 친구 초대 링크 생성
router.post("/invite", async (req, res) => {
    try {
        const inviteLink = await friendService.createInvitation(req.body);
        res.json({ inviteLink });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 친구 초대 응답 (수락/거절)
router.post("/respond", async (req, res) => {
    try {
        await friendService.respondToInvitation(req.body);
        res.status(200).json({ message: "친구 추가 완료" });
    } catch (error) {
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

// 친구 목록 조회
router.get("/list/:userId", async (req, res) => {
    try {
        const friends = await friendService.getFriends(req.params.userId);
        res.json(friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 친구 삭제
router.delete("/remove", async (req, res) => {
    try {
        await friendService.removeFriend(req.body);
        res.status(200).json({ message: "친구 삭제 완료" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 친구에게 콕 찌르기 (알림 전송)
router.post("/notifications/send", async (req, res) => {
    try {
        const result = await friendService.sendNotification(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "알림 전송 중 오류 발생" });
    }
});

// 로그인 시 읽지 않은 알림 조회 후 읽음 처리 
router.get("/notifications/unread/:userId", async (req, res) => {
    try {
        const notifications = await friendService.getUnreadNotifications(req.params.userId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 읽음 처리된 알림 삭제
router.post("/notifications/read", async (req, res) => {
    try {
        if (!req.body.user_id) {
            return res.status(400).json({ message: "user_id가 필요합니다." });
        }

        const result = await friendService.deleteReadNotifications(req.body.user_id);
        res.json(result);
    } catch (error) {
        console.error("알림 삭제 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});


module.exports = router;
