const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");

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

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Authorization code is missing.");
  }

  try {
    const tokenBody = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const tokenRes = await axios.post(GOOGLE_TOKEN_URL, tokenBody.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id, name, email } = userRes.data;

    const [user, created] = await User.findOrCreate({
      where: { social_id: id, social_provider: "google" },
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

    req.session.user = {
      userId: user.id,
      social_id: user.social_id,
      social_provider: user.social_provider,
      name: user.name,
      email: user.email,
      visitCount: visit_count,
      mostVisitedDays: (mostVisitedDays || []).join(", "),
    };
    req.session.songData = await getRandomSong(req);

    const redirectBase = getRedirectBase(req);
    delete req.session.loginOrigin;

    res.redirect(`${redirectBase}/home?loginSuccess=true&userName=${encodeURIComponent(user.name)}`);
  } catch (error) {
    console.error("Google 인증 오류:", error.response?.data || error.message);
    const redirectBase = getRedirectBase(req);
    delete req.session.loginOrigin;
    res.redirect(
      `${redirectBase}/home?loginError=true&errorMessage=${encodeURIComponent("Google 로그인에 실패했습니다.")}`
    );
  }
});

module.exports = router;
