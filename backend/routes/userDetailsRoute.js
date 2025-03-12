const express = require("express");
const router = express.Router();
const userDetailsService = require("../services/userDetailsService");

// 사용자 정보 조회
router.get("/info", async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.userId : null;
        const userInfo = await userDetailsService.getUserInfo(userId);
        res.json(userInfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 최초 사용자 정보 저장
router.post("/", async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.userId : null;
        const result = await userDetailsService.createUserInfo(userId, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 사용자 정보 수정
router.put("/", async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.userId : null;
        const result = await userDetailsService.updateUserInfo(userId, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
