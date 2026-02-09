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
const { authenticateToken, optionalAuthenticate, extractToken, generateRefreshToken, getRefreshTokenExpiry } = require("../utils/jwt");
const { User, UserActivity, RefreshToken } = require("../models");

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

// 리프레시 토큰으로 액세스 토큰 갱신
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", async (req, res) => {
  try {
    // 리프레시 토큰 추출 (쿠키 또는 요청 본문)
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "리프레시 토큰이 필요합니다.",
      });
    }

    // 데이터베이스에서 리프레시 토큰 조회
    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken },
      include: [{ model: User }],
    });

    if (!tokenRecord) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "유효하지 않은 리프레시 토큰입니다.",
      });
    }

    // 만료 확인
    const now = new Date();
    if (new Date(tokenRecord.expires_at) < now) {
      // 만료된 토큰 삭제
      await tokenRecord.destroy();
      return res.status(401).json({
        error: "Unauthorized",
        message: "리프레시 토큰이 만료되었습니다.",
      });
    }

    const user = tokenRecord.User;
    if (!user) {
      await tokenRecord.destroy();
      return res.status(401).json({
        error: "Unauthorized",
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 사용자 활동 정보 조회
    const activity = await UserActivity.findOne({
      where: { user_id: user.id },
      order: [["created_at", "DESC"]],
    });
    const mostVisitedData = await UserActivity.getMostVisitedDays(user.id);

    // 새로운 액세스 토큰 생성
    const { generateToken } = require("../utils/jwt");
    const tokenPayload = {
      userId: user.id,
      social_id: user.social_id,
      social_provider: user.social_provider,
      name: user.name,
      email: user.email,
      visitCount: activity?.visit_count || 0,
      mostVisitedDays: (mostVisitedData?.mostVisitedDays || []).join(", "),
    };

    const newAccessToken = generateToken(tokenPayload);

    // 액세스 토큰을 쿠키에도 설정
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60, // 1시간
    });

    res.json({
      success: true,
      token: newAccessToken,
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        socialId: user.social_id,
        socialProvider: user.social_provider,
        visitCount: activity?.visit_count || 0,
        mostVisitedDays: (mostVisitedData?.mostVisitedDays || []).join(", "),
      },
    });
  } catch (error) {
    const { logError } = require("../middleware/errorHandler");
    logError(error, { endpoint: "/auth/refresh" });
    
    res.status(500).json({
      error: "Internal Server Error",
      message: "토큰 갱신 중 오류가 발생했습니다.",
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
router.get("/logout", async (req, res) => {
  try {
    // 리프레시 토큰 삭제
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await RefreshToken.destroy({
        where: { token: refreshToken },
      });
    }

    // JWT 토큰 쿠키 삭제
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
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