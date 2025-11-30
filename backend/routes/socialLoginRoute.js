const express = require("express");
const router = express.Router();
const googleRouter = require("../login/googleLogin");
const kakaoRouter = require("../login/kakaoLogin");


// Google 로그인 라우터
/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: Google OAuth login (redirect)
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
router.use("/google", googleRouter);

// Kakao 로그인 라우터
/**
 * @openapi
 * /auth/kakao:
 *   get:
 *     summary: Kakao OAuth login (redirect)
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirects to Kakao login
 */
router.use("/kakao", kakaoRouter);

// JWT 토큰 상태 확인
/**
 * @openapi
 * /auth/check:
 *   get:
 *     summary: Check JWT token status
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns login state and user info
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
 *                   example:
 *                     userId: 123
 *                     name: "홍길동"
 */
const { authenticateToken, optionalAuthenticate } = require("../utils/jwt");

router.get("/check", optionalAuthenticate, (req, res) => {
  const user = req.user;
  res.json({
    isLoggedIn: !!user,
    user: user || null,
  });
});

// 로그아웃 라우터
/**
 * @openapi
 * /auth/logout:
 *   get:
 *     summary: Logout user and clear token
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.get("/logout", (req, res) => {
  try {
    // JWT 토큰 쿠키 삭제
    res.clearCookie("accessToken");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");

    console.log("로그아웃 성공");
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("로그아웃 처리 실패:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Failed to log out.",
    });
  }
});

module.exports = router;