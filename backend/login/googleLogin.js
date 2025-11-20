const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");
const { generateToken } = require("../utils/jwt");
const { validateOAuthCode } = require("../middleware/validation");

require("dotenv").config();
const router = express.Router();

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const loadGoogleCredentials = () => {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  if (credentialsPath && fs.existsSync(credentialsPath)) {
    const raw = fs.readFileSync(credentialsPath, "utf8");
    const googleConfig = JSON.parse(raw).web;
    return {
      clientId: googleConfig.client_id,
      clientSecret: googleConfig.client_secret,
      redirectUri: googleConfig.redirect_uris?.[0],
    };
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    };
  }

  throw new Error(
    "Google 인증 정보가 없습니다. GOOGLE_CREDENTIALS_PATH 파일 또는 GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI 환경변수가 필요합니다."
  );
};

let GOOGLE_CLIENT_ID;
let GOOGLE_CLIENT_SECRET;
let GOOGLE_REDIRECT_URI;

try {
  const creds = loadGoogleCredentials();
  GOOGLE_CLIENT_ID = creds.clientId;
  GOOGLE_CLIENT_SECRET = creds.clientSecret;
  GOOGLE_REDIRECT_URI = creds.redirectUri;
} catch (error) {
  console.error("Google 인증 설정 실패:", error.message);
  process.exit(1);
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
  const referer = req.get("Referer") || req.headers.origin;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      req.session.loginOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    } catch (error) {
      console.warn("Invalid referer for Google login:", error.message);
    }
  }

  const query = new URLSearchParams({
    response_type: "code",
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${query.toString()}`);
});

router.get("/callback", validateOAuthCode, async (req, res) => {
  const { code } = req.query;

  const redirectBase = getRedirectBase(req);
  
  // 실무 패턴: AJAX 요청 여부를 여러 방법으로 확인
  const isAjaxRequest = 
    req.get("X-Requested-With") === "XMLHttpRequest" ||
    req.get("Accept")?.includes("application/json") ||
    req.query.format === "json";

  try {
    // 보안: 환경 변수 검증
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      throw new Error("구글 로그인 설정이 완료되지 않았습니다.");
    }

    const tokenBody = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const tokenRes = await axios.post(GOOGLE_TOKEN_URL, tokenBody.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000, // 10초 타임아웃
    });

    // 보안: 응답 검증
    if (!tokenRes.data || !tokenRes.data.access_token) {
      throw new Error("구글 토큰 응답이 올바르지 않습니다.");
    }

    const googleAccessToken = tokenRes.data.access_token;

    const userRes = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
      timeout: 10000, // 10초 타임아웃
    });

    // 보안: 응답 검증
    if (!userRes.data || !userRes.data.id) {
      throw new Error("구글 사용자 정보 응답이 올바르지 않습니다.");
    }

    const { id, name, email } = userRes.data;
    
    // 보안: 입력 검증
    const googleId = String(id);
    if (!googleId || googleId.length > 100) {
      throw new Error("유효하지 않은 구글 사용자 ID입니다.");
    }

    const [user, created] = await User.findOrCreate({
      where: { social_id: googleId, social_provider: "google" },
      defaults: { name, email },
    });

    if (!created) {
      user.name = name;
      user.email = email;
      await user.save();
    }

    const activity = await UserActivity.updateVisit(user.id);
    const { visit_count } = activity;
    const { mostVisitedDays } = await UserActivity.getMostVisitedDays(user.id);

    // JWT 토큰 생성
    const tokenPayload = {
      userId: user.id,
      social_id: user.social_id,
      social_provider: user.social_provider,
      name: user.name,
      email: user.email,
      visitCount: visit_count,
      mostVisitedDays: (mostVisitedDays || []).join(", "),
    };

    const accessToken = generateToken(tokenPayload);

    delete req.session.loginOrigin;

    // 보안: URL에 사용자 정보 노출 방지 - 세션에 저장하고 리다이렉트
    req.session.loginSuccess = true;
    req.session.tempUserName = user.name; // 임시로 세션에 저장 (리다이렉트 후 즉시 삭제)

    // 실무 패턴: AJAX 요청이면 항상 JSON 반환 (JWT 토큰 포함)
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
          visitCount: visit_count,
          mostVisitedDays: (mostVisitedDays || []).join(", "),
        },
      });
    }

    // 브라우저 직접 요청인 경우: 토큰을 쿠키에 저장하고 리다이렉트
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    });

    // 보안: URL에 사용자 정보 제거
    res.redirect(`${redirectBase}/home`);
  } catch (error) {
    // 보안: 민감한 정보는 로그에만 기록하고 사용자에게는 일반적인 메시지 전달
    const { logError } = require("../middleware/errorHandler");
    logError(error, {
      provider: "google",
      status: error.response?.status,
    });
    
    delete req.session.loginOrigin;

    // 사용자에게는 일반적인 오류 메시지만 전달
    let userFriendlyMessage = "Google 로그인에 실패했습니다. 다시 시도해주세요.";
    
    // 특정 오류에 대한 친화적인 메시지
    const errorDetails = error.response?.data;
    if (errorDetails?.error === "invalid_grant") {
      userFriendlyMessage = "인증 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해주세요.";
    } else if (errorDetails?.error === "invalid_client") {
      userFriendlyMessage = "Google 로그인 설정에 문제가 있습니다. 관리자에게 문의해주세요.";
    }

    // 보안: URL에 오류 메시지 노출 방지 - 세션에 저장
    req.session.loginError = true;
    req.session.tempErrorMessage = userFriendlyMessage;

    // 실무 패턴: 오류 발생 시에도 AJAX 요청이면 JSON 반환
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
