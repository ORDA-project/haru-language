const express = require("express");
const axios = require("axios");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");
const { generateToken } = require("../utils/jwt");
const { validateOAuthCode } = require("../middleware/validation");

require("dotenv").config();
const router = express.Router();

const { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI } = process.env;

if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("카카오 로그인 환경 변수가 설정되지 않았습니다.");
  }
}

const getRedirectBase = (req) => {
  const fallback = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000";

  if (process.env.NODE_ENV !== "production") {
    return fallback;
  }

  if (req.session.loginOrigin) {
    return req.session.loginOrigin;
  }

  return fallback;
};

router.get("/", (req, res) => {
  if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
    return res.status(500).json({
      success: false,
      error: "카카오 로그인 설정이 완료되지 않았습니다.",
    });
  }

  const referer = req.get("Referer") || req.headers.origin;
  const originFromQuery = req.query.origin || req.query.redirect_uri;
  
  if (originFromQuery) {
    try {
      const originUrl = new URL(originFromQuery);
      req.session.loginOrigin = `${originUrl.protocol}//${originUrl.host}`;
    } catch (error) {
      // Invalid origin, fallback to default
    }
  }
  
  if (!req.session.loginOrigin && referer) {
    try {
      const refererUrl = new URL(referer);
      req.session.loginOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    } catch (error) {
      // Invalid referer, fallback to default
    }
  }

  const authURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}`;
  res.redirect(authURL);
});

router.get("/callback", validateOAuthCode, async (req, res) => {
  const { code } = req.query;
  const redirectBase = process.env.CLIENT_URL || getRedirectBase(req);
  
  const isAjaxRequest = 
    req.query.format === "json" ||
    req.get("X-Requested-With") === "XMLHttpRequest" ||
    req.get("Accept")?.includes("application/json");

  try {
    // 보안: 환경 변수 검증
    if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
      throw new Error("카카오 로그인 설정이 완료되지 않았습니다.");
    }

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      code,
    });

    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      tokenBody.toString(),
      {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );

    // 보안: 응답 검증
    if (!tokenRes.data || !tokenRes.data.access_token) {
      throw new Error("카카오 토큰 응답이 올바르지 않습니다.");
    }

    const kakaoAccessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
      timeout: 10000,
    });

    // 보안: 응답 검증
    if (!userRes.data || !userRes.data.id) {
      throw new Error("카카오 사용자 정보 응답이 올바르지 않습니다.");
    }

    const kakaoId = String(userRes.data.id);
    const nickname = userRes.data.properties?.nickname || `User_${kakaoId}`;
    const email = userRes.data.kakao_account?.email || null;
    
    if (!kakaoId || kakaoId.length > 100) {
      throw new Error("유효하지 않은 카카오 사용자 ID입니다.");
    }

    const [user] = await User.findOrCreate({
      where: { social_id: kakaoId, social_provider: "kakao" },
      defaults: { name: nickname, email },
    });

    if (!user.email && email) {
      user.email = email;
      await user.save();
    }

    const activity = await UserActivity.updateVisit(user.id);
    const mostVisited = await UserActivity.getMostVisitedDays(user.id);

    const tokenPayload = {
      userId: user.id,
      social_id: user.social_id,
      social_provider: user.social_provider,
      name: user.name,
      email: user.email,
      visitCount: activity.visit_count,
      mostVisitedDays: (mostVisited?.mostVisitedDays || []).join(", "),
    };

    const accessToken = generateToken(tokenPayload);

    delete req.session.loginOrigin;
    req.session.loginSuccess = true;
    req.session.tempUserName = user.name;

    if (isAjaxRequest) {
      return res.json({
        success: true,
        token: accessToken,
        redirectUrl: `${redirectBase}/home`,
        user: {
          userId: user.id,
          name: user.name,
          email: user.email,
          socialId: user.social_id,
          socialProvider: user.social_provider,
          visitCount: activity.visit_count,
          mostVisitedDays: (mostVisited?.mostVisitedDays || []).join(", "),
        },
      });
    }

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    try {
      const redirectUrl = new URL(`${redirectBase}/auth/kakao/callback`);
      redirectUrl.searchParams.set("token", accessToken);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(`${redirectBase}/auth/kakao/callback?token=${encodeURIComponent(accessToken)}`);
    }
  } catch (error) {
    const { logError } = require("../middleware/errorHandler");
    const errorDetails = error.response?.data;
    logError(error, {
      provider: "kakao",
      status: error.response?.status,
      errorCode: errorDetails?.error,
      errorDescription: errorDetails?.error_description,
    });
    
    delete req.session.loginOrigin;

    let userFriendlyMessage = "카카오 로그인에 실패했습니다. 다시 시도해주세요.";
    if (errorDetails?.error === "invalid_grant") {
      userFriendlyMessage = "인증 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해주세요.";
    } else if (errorDetails?.error === "invalid_client") {
      userFriendlyMessage = "카카오 로그인 설정에 문제가 있습니다. 관리자에게 문의해주세요.";
    }

    req.session.loginError = true;
    req.session.tempErrorMessage = userFriendlyMessage;

    if (isAjaxRequest) {
      return res.status(400).json({
        success: false,
        redirectUrl: `${redirectBase}/home`,
        error: userFriendlyMessage,
      });
    }

    res.redirect(`${redirectBase}/home`);
  }
});

module.exports = router;
