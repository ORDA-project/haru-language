const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");

const router = express.Router();

// 환경 변수 및 구글 인증 파일 로드
const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
let client_id, client_secret, REDIRECT_URI;

try {
    // 먼저 파일에서 읽기 시도
    if (credentialsPath && fs.existsSync(credentialsPath)) {
        const raw = fs.readFileSync(credentialsPath, "utf8");
        const googleConfig = JSON.parse(raw).web;
        client_id = googleConfig.client_id;
        client_secret = googleConfig.client_secret;
        REDIRECT_URI = googleConfig.redirect_uris[0];
    }
    // 파일이 없으면 환경변수 사용
    else if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) {
        client_id = process.env.GOOGLE_CLIENT_ID;
        client_secret = process.env.GOOGLE_CLIENT_SECRET;
        REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
    }
    // 둘 다 없으면 에러
    else {
        throw new Error("Google 인증 정보가 없습니다. GOOGLE_CREDENTIALS_PATH 파일 또는 GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI 환경변수가 필요합니다.");
    }
} catch (err) {
    console.error("Google 인증 설정 실패:", err.message);
    process.exit(1);
}

// 구글 인증 상수 정의
const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// Google 로그인 URL로 리디렉트
router.get("/", (req, res) => {
    // 리퍼러에서 origin 정보를 가져와서 세션에 저장
    const referer = req.get('Referer') || req.headers.origin;
    if (referer) {
        const refererUrl = new URL(referer);
        const origin = `${refererUrl.protocol}//${refererUrl.host}`;
        req.session.loginOrigin = origin;
        console.log('Google login origin saved:', origin);
    }
    
    const authURL = `${GOOGLE_AUTH_BASE_URL}?response_type=code&client_id=${client_id}&redirect_uri=${REDIRECT_URI}&scope=email%20profile`;
    res.redirect(authURL);
});

// OAuth 콜백 처리
router.get("/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Authorization code is missing.");

    try {
        // 토큰 요청
        const tokenRes = await axios.post(GOOGLE_TOKEN_URL, null, {
            params: {
                code,
                client_id,
                client_secret,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
            },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const accessToken = tokenRes.data.access_token;

        // 사용자 정보 요청
        const userRes = await axios.get(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { id, name, email } = userRes.data;

        // 사용자 DB 저장 또는 갱신
        const [user, created] = await User.findOrCreate({
            where: { social_id: id, social_provider: "google" },
            defaults: { name, email },
        });

        if (!created) {
            user.name = name;
            user.email = email;
            await user.save();
        }

        // 방문 기록 및 통계 처리
        const activity = await UserActivity.updateVisit(user.id);
        const { visit_count } = activity;
        const { mostVisitedDays } = await UserActivity.getMostVisitedDays(user.id);
        const mostVisited = mostVisitedDays.join(", ");

        // 세션 저장
        req.session.user = {
            userId: user.id,
            name: user.name,
            email: user.email,
            visitCount: visit_count,
            mostVisitedDays: mostVisited,
        };

        req.session.songData = await getRandomSong(req);

        // 개발 환경에서는 항상 localhost로 리다이렉트
        let redirectUrl;
        if (process.env.NODE_ENV === 'development') {
            redirectUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        } else {
            const loginOrigin = req.session.loginOrigin;
            redirectUrl = loginOrigin || process.env.FRONTEND_URL || "http://localhost:3000";
        }
        
        console.log('Google login success, redirecting to:', `${redirectUrl}?loginSuccess=true&userName=${encodeURIComponent(user.name)}`);
        
        // 세션에서 origin 정보 삭제
        delete req.session.loginOrigin;
        
        res.redirect(`${redirectUrl}/home?loginSuccess=true&userName=${encodeURIComponent(user.name)}`);

    } catch (err) {
        console.error("Google 인증 처리 오류:", err.message);
        
        // 개발 환경에서는 항상 localhost로 리다이렉트
        let redirectUrl;
        if (process.env.NODE_ENV === 'development') {
            redirectUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        } else {
            const loginOrigin = req.session.loginOrigin;
            redirectUrl = loginOrigin || process.env.FRONTEND_URL || "http://localhost:3000";
        }
        
        // 세션에서 origin 정보 삭제
        delete req.session.loginOrigin;
        
        res.redirect(`${redirectUrl}/home?loginError=true&errorMessage=${encodeURIComponent('Google 로그인에 실패했습니다.')}`);
    }
});

module.exports = router;
