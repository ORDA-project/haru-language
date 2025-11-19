const express = require("express");
const axios = require("axios");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");

require("dotenv").config();
const router = express.Router();

const { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI } = process.env;

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
      console.warn("Invalid referer for Kakao login:", error.message);
    }
  }

  const authURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}`;
  res.redirect(authURL);
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Authorization code is missing.");
  }

  try {
    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: KAKAO_REST_API_KEY,
          redirect_uri: KAKAO_REDIRECT_URI,
          code,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoId = userRes.data.id;
    const nickname = userRes.data.properties?.nickname || `User_${kakaoId}`;

    const [user] = await User.findOrCreate({
      where: { social_id: kakaoId, social_provider: "kakao" },
      defaults: { name: nickname },
    });

    const activity = await UserActivity.updateVisit(user.id);
    const mostVisited = await UserActivity.getMostVisitedDays(user.id);
    const songData = await getRandomSong(req);

    req.session.user = {
      userId: user.id,
      social_id: user.social_id,
      social_provider: user.social_provider,
      name: user.name,
      visitCount: activity.visit_count,
      mostVisitedDays: (mostVisited?.mostVisitedDays || []).join(", "),
    };
    req.session.songData = songData;

    const redirectBase = getRedirectBase(req);
    delete req.session.loginOrigin;

    res.redirect(`${redirectBase}/home?loginSuccess=true&userName=${encodeURIComponent(user.name)}`);
  } catch (error) {
    console.error("카카오 로그인 실패:", error.message);
    const redirectBase = getRedirectBase(req);
    delete req.session.loginOrigin;
    res.redirect(
      `${redirectBase}/home?loginError=true&errorMessage=${encodeURIComponent("카카오 로그인에 실패했습니다.")}`
    );
  }
});

module.exports = router;
