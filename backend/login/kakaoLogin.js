const express = require("express");
const axios = require("axios");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");

require("dotenv").config();
const router = express.Router();

// 환경변수 정리
const { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI } = process.env;

// 1. 카카오 로그인 페이지로 리다이렉트
router.get("/", (req, res) => {
    // 리퍼러에서 origin 정보를 가져와서 세션에 저장
    const referer = req.get('Referer') || req.headers.origin;
    if (referer) {
        const refererUrl = new URL(referer);
        const origin = `${refererUrl.protocol}//${refererUrl.host}`;
        req.session.loginOrigin = origin;
        console.log('Kakao login origin saved:', origin);
    }
    
    const authURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}`;
    res.redirect(authURL);
});

// 2. 카카오 OAuth 콜백
router.get("/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Authorization code is missing.");

    try {
        // 액세스 토큰 요청
        const tokenRes = await axios.post("https://kauth.kakao.com/oauth/token", null, {
            params: {
                grant_type: "authorization_code",
                client_id: KAKAO_REST_API_KEY,
                redirect_uri: KAKAO_REDIRECT_URI,
                code,
            },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const accessToken = tokenRes.data.access_token;

        // 사용자 정보 요청
        const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const kakaoId = userRes.data.id;
        const nickname = userRes.data.properties?.nickname || `User_${kakaoId}`;

        // 사용자 DB 등록 or 업데이트
        const [user] = await User.findOrCreate({
            where: { social_id: kakaoId, social_provider: "kakao" },
            defaults: { name: nickname },
        });

        // 방문 기록 및 요일 통계
        const activity = await UserActivity.updateVisit(user.id);
        const mostVisited = await UserActivity.getMostVisitedDays(user.id);

        // 추천 노래
        const songData = await getRandomSong(req);

        // 세션 저장
        req.session.user = {
            userId: user.id,
            name: user.name,
            visitCount: activity.visit_count,
            mostVisitedDays: mostVisited.mostVisitedDays.join(", "),
        };
        req.session.songData = songData;

        // 원래 로그인을 시도한 도메인으로 리디렉트
        const loginOrigin = req.session.loginOrigin;
        const redirectUrl = loginOrigin || process.env.FRONTEND_URL || "http://localhost:3000";
        
        console.log('Kakao login success, redirecting to:', `${redirectUrl}?loginSuccess=true&userName=${encodeURIComponent(user.name)}`);
        
        // 세션에서 origin 정보 삭제
        delete req.session.loginOrigin;
        
        res.redirect(`${redirectUrl}?loginSuccess=true&userName=${encodeURIComponent(user.name)}`);

    } catch (err) {
        console.error("카카오 로그인 실패:", err.message);
        
        // 에러 시에도 원래 도메인으로 리다이렉트
        const loginOrigin = req.session.loginOrigin;
        const redirectUrl = loginOrigin || process.env.FRONTEND_URL || "http://localhost:3000";
        
        // 세션에서 origin 정보 삭제
        delete req.session.loginOrigin;
        
        res.redirect(`${redirectUrl}?loginError=true&errorMessage=${encodeURIComponent('카카오 로그인에 실패했습니다.')}`);
    }
});

module.exports = router;
