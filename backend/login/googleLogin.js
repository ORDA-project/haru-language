const express = require("express");
const axios = require("axios");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");

require("dotenv").config();
const router = express.Router();

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// 환경변수 정리
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, CLIENT_URL } = process.env;
const FRONT_HOME =
  process.env.NODE_ENV === "production"
    ? `${CLIENT_URL}/home`         
    : "http://localhost:3000/home";

// 로그인 시작(구글 동의화면으로 이동)
router.get("/", (req, res) => {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  res.redirect(`${GOOGLE_AUTH_URL}?${p.toString()}`);
});

// 콜백
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Authorization code is missing.");

  try {
    // 토큰 교환 (폼 바디 전송)
    const body = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });
    const tokenRes = await axios.post(GOOGLE_TOKEN_URL, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const accessToken = tokenRes.data.access_token;

    // 사용자 정보
    const userRes = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { id, name, email } = userRes.data;

    // 유저 upsert
    const [user, created] = await User.findOrCreate({
      where: { social_id: id, social_provider: "google" },
      defaults: { name, email },
    });
    if (!created) {
      user.name = name;
      user.email = email;
      await user.save();
    }

    // 방문 기록
    const activity = await UserActivity.updateVisit(user.id);
    const { visit_count } = activity;
    const { mostVisitedDays } = await UserActivity.getMostVisitedDays(user.id);

    // 세션
    req.session.user = {
      userId: user.id,
      social_id: user.social_id,     // 추가 필요
      social_provider: user.social_provider,  // 추가 필요
      name: user.name,
      email: user.email,
      visitCount: visit_count,
      mostVisitedDays: (mostVisitedDays || []).join(", "),
    };
    req.session.songData = await getRandomSong(req);

    // 프론트로
    res.redirect(FRONT_HOME);

  } catch (err) {
    console.error("Google 인증 오류:", err.response?.data || err.message);
    res.status(500).send("Google Authentication Failed");
  }
});

module.exports = router;