const express = require("express");
const axios = require("axios");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");
const { generateToken } = require("../utils/jwt");
const { validateOAuthCode } = require("../middleware/validation");

require("dotenv").config();
const router = express.Router();

// 보안: 환경 변수 검증
const { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI } = process.env;

if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
  console.error("카카오 로그인 설정 오류: KAKAO_REST_API_KEY 또는 KAKAO_REDIRECT_URI가 설정되지 않았습니다.");
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
  // 보안: 환경 변수 검증
  if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
    return res.status(500).json({
      success: false,
      error: "카카오 로그인 설정이 완료되지 않았습니다.",
    });
  }

  // 모바일 브라우저 호환성: Referer, Origin, 또는 query parameter에서 origin 확인
  const referer = req.get("Referer") || req.headers.origin;
  const originFromQuery = req.query.origin || req.query.redirect_uri;
  
  let originUrl = null;
  
  // 1. Query parameter 우선 확인 (모바일에서 더 안정적)
  if (originFromQuery) {
    try {
      originUrl = new URL(originFromQuery);
      req.session.loginOrigin = `${originUrl.protocol}//${originUrl.host}`;
    } catch (error) {
      console.warn("Invalid origin from query for Kakao login:", error.message);
    }
  }
  
  // 2. Referer 또는 Origin 헤더 확인
  if (!req.session.loginOrigin && referer) {
    try {
      const refererUrl = new URL(referer);
      req.session.loginOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    } catch (error) {
      console.warn("Invalid referer for Kakao login:", error.message);
    }
  }

  const authURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}`;
  res.redirect(authURL);
});

router.get("/callback", validateOAuthCode, async (req, res) => {
  const { code } = req.query;

  // OAuth 콜백에서는 Referer가 Kakao이므로, 환경 변수에서 프론트엔드 URL 가져오기
  const redirectBase = process.env.CLIENT_URL || getRedirectBase(req);
  
  // AJAX 요청 여부를 여러 방법으로 확인
  const isAjaxRequest = 
    req.get("X-Requested-With") === "XMLHttpRequest" ||
    req.get("Accept")?.includes("application/json") ||
    req.query.format === "json";

  try {
    // 보안: 환경 변수 검증
    if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
      throw new Error("카카오 로그인 설정이 완료되지 않았습니다.");
    }

    // 카카오 OAuth 토큰 요청: POST body에 form data로 전송
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
        timeout: 10000, // 10초 타임아웃
      }
    );

    // 보안: 응답 검증
    if (!tokenRes.data || !tokenRes.data.access_token) {
      throw new Error("카카오 토큰 응답이 올바르지 않습니다.");
    }

    const kakaoAccessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
      timeout: 10000, // 10초 타임아웃
    });

    // 보안: 응답 검증
    if (!userRes.data || !userRes.data.id) {
      throw new Error("카카오 사용자 정보 응답이 올바르지 않습니다.");
    }

    const kakaoId = String(userRes.data.id); // 보안: 문자열로 변환하여 타입 안정성 확보
    const nickname = userRes.data.properties?.nickname || `User_${kakaoId}`;
    const email = userRes.data.kakao_account?.email || null;
    
    // 보안: 입력 검증
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
    const songData = await getRandomSong(req);

    // JWT 토큰 생성
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

    // 보안: URL에 사용자 정보 노출 방지 - 세션에 저장하고 리다이렉트
    req.session.loginSuccess = true;
    req.session.tempUserName = user.name; // 임시로 세션에 저장 (리다이렉트 후 즉시 삭제)

    // AJAX 요청이면 항상 JSON 반환 (JWT 토큰 포함)
    if (isAjaxRequest) {
      return res.json({
        success: true,
        token: accessToken,
        redirectUrl: `${redirectBase}/home`, // 보안: URL에 사용자 정보 제거
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

    // 브라우저 직접 요청인 경우: 토큰을 쿠키에 저장하고 리다이렉트
    // 주의: 프론트엔드는 AJAX로 로그인하고 localStorage를 사용하므로 쿠키는 백업용
    // sameSite: "none"은 secure: true와 HTTPS가 필요 (프로덕션)
    // 시크릿 모드에서도 작동하도록 설정
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // 프로덕션에서만 secure: true (HTTPS 필요)
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    });

    // 보안: URL에 사용자 정보 제거
    res.redirect(`${redirectBase}/home`);
  } catch (error) {
    // 보안: 민감한 정보는 로그에만 기록하고 사용자에게는 일반적인 메시지 전달
    const { logError } = require("../middleware/errorHandler");
    
    // 카카오 API 오류 상세 정보 로깅 (디버깅용)
    const errorDetails = error.response?.data;
    logError(error, {
      provider: "kakao",
      status: error.response?.status,
      errorCode: errorDetails?.error,
      errorDescription: errorDetails?.error_description,
    });
    
    delete req.session.loginOrigin;

    // 사용자에게는 일반적인 오류 메시지만 전달
    let userFriendlyMessage = "카카오 로그인에 실패했습니다. 다시 시도해주세요.";
    
    // 특정 오류에 대한 친화적인 메시지
    if (errorDetails?.error === "invalid_grant") {
      userFriendlyMessage = "인증 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해주세요.";
    } else if (errorDetails?.error === "invalid_client") {
      userFriendlyMessage = "카카오 로그인 설정에 문제가 있습니다. 관리자에게 문의해주세요.";
    }

    // 보안: URL에 오류 메시지 노출 방지 - 세션에 저장
    req.session.loginError = true;
    req.session.tempErrorMessage = userFriendlyMessage;

    // 오류 발생 시에도 AJAX 요청이면 JSON 반환
    if (isAjaxRequest) {
      return res.status(400).json({
        success: false,
        redirectUrl: `${redirectBase}/home`, // 보안: URL에 오류 정보 제거
        error: userFriendlyMessage,
      });
    }

    // 보안: URL에 오류 정보 제거
    res.redirect(`${redirectBase}/home`);
  }
});

module.exports = router;
