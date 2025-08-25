const express = require("express");
const axios = require("axios");
const router = express.Router();
const googleRouter = require("../login/googleLogin");
const kakaoRouter = require("../login/kakaoLogin");

// Google 로그인 라우터
router.use("/google", googleRouter);

// Kakao 로그인 라우터
router.use("/kakao", kakaoRouter);

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: 로그인 상태 확인
 *     description: 현재 세션의 로그인 상태를 확인합니다
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 세션 상태 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLoggedIn:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   nullable: true
 */
router.get("/check", (req, res) => {
  const user = req.session.user;
  res.json({
    isLoggedIn: !!user,
    user: user || null,
  });
});

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: 로그아웃
 *     description: 현재 세션을 종료하고 로그아웃을 수행합니다
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Logout successful"
 *       500:
 *         description: 로그아웃 실패
 */
router.get("/logout", async (req, res) => {
  try {
    const accessToken = req.session.token;

    // 카카오 로그아웃 요청 (선택 사항)
    if (accessToken) {
      await axios.post(
        "https://kapi.kakao.com/v1/user/logout",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }

    // 세션 제거 및 쿠키 삭제
    req.session.destroy((err) => {
      if (err) {
        console.error("세션 삭제 실패:", err);
        return res.status(500).send("로그아웃 실패");
      }

      res.clearCookie("user_sid");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");

      console.log("로그아웃 성공");
      res.status(200).send("Logout successful");
    });
  } catch (error) {
    console.error("로그아웃 처리 실패:", error.message || error);
    res.status(500).send("Failed to log out.");
  }
});

module.exports = router;
