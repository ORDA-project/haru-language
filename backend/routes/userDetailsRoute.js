const express = require("express");
const router = express.Router();
const userDetailsService = require("../services/userDetailsService");

// 세션에서 userId 추출하는 유틸 함수
const getUserIdFromSession = (req) => req.session?.user?.userId || null;

/**
 * @swagger
 * /userDetails/info:
 *   get:
 *     summary: 사용자 정보 조회
 *     description: 세션에서 사용자 ID를 추출하여 사용자 상세 정보를 조회합니다
 *     tags: [User Details]
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: 사용자 상세 정보
 *       500:
 *         description: 서버 오류
 */
router.get("/info", async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);
        const userInfo = await userDetailsService.getUserInfo(userId);
        res.json(userInfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /userDetails:
 *   post:
 *     summary: 사용자 정보 생성
 *     description: 새로운 사용자 상세 정보를 생성합니다
 *     tags: [User Details]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: 사용자 상세 정보 데이터
 *     responses:
 *       200:
 *         description: 사용자 정보 생성 성공
 *       500:
 *         description: 서버 오류
 */
router.post("/", async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);
        const result = await userDetailsService.createUserInfo(userId, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /userDetails:
 *   put:
 *     summary: 사용자 정보 수정
 *     description: 기존 사용자 상세 정보를 수정합니다
 *     tags: [User Details]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: 수정할 사용자 상세 정보 데이터
 *     responses:
 *       200:
 *         description: 사용자 정보 수정 성공
 *       500:
 *         description: 서버 오류
 */
router.put("/", async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);
        const result = await userDetailsService.updateUserInfo(userId, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
