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
const { authenticateToken, optionalAuthenticate, extractToken } = require("../utils/jwt");
const { User, UserActivity } = require("../models");

router.get("/check", optionalAuthenticate, async (req, res) => {
  const user = req.user;
  const token = extractToken(req);
  
  if (!user || !user.userId) {
    return res.json({
      isLoggedIn: false,
      user: null,
      token: token || null,
    });
  }

  try {
    const dbUser = await User.findByPk(user.userId);
    if (!dbUser) {
      return res.json({
        isLoggedIn: false,
        user: null,
        token: token || null,
      });
    }

    const activity = await UserActivity.findOne({
      where: { user_id: user.userId },
      order: [["created_at", "DESC"]],
    });
    const mostVisitedData = await UserActivity.getMostVisitedDays(user.userId);

    res.json({
      isLoggedIn: true,
      user: {
        userId: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        social_id: dbUser.social_id,
        social_provider: dbUser.social_provider,
        visitCount: activity?.visit_count || 0,
        mostVisitedDays: (mostVisitedData?.mostVisitedDays || []).join(", ") || null,
      },
      token: token || null,
    });
  } catch (error) {
    const { logError } = require("../middleware/errorHandler");
    logError(error, { endpoint: "/auth/check" });
    
    res.json({
      isLoggedIn: !!user,
      user: user ? {
        userId: user.userId,
        name: user.name || null,
        email: user.email || null,
        social_id: user.social_id,
        social_provider: user.social_provider,
        visitCount: 0,
        mostVisitedDays: null,
      } : null,
      token: token || null,
    });
  }
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