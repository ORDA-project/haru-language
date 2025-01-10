const express = require("express");
const axios = require("axios");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService"); // 랜덤 노래 생성 서비스 추가

require("dotenv").config();

const router = express.Router();

// Kakao 로그인 페이지로 리다이렉트
router.get("/", (req, res) => {
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_REST_API_KEY}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}`;
    res.redirect(kakaoAuthURL);
});

// Kakao에서 Authorization Code 받기
router.get("/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Authorization code is missing.");
    }

    try {
        // Access Token 요청
        const tokenResponse = await axios.post(
            "https://kauth.kakao.com/oauth/token",
            null,
            {
                params: {
                    grant_type: "authorization_code",
                    client_id: process.env.KAKAO_REST_API_KEY,
                    redirect_uri: process.env.KAKAO_REDIRECT_URI,
                    code: code,
                },
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );

        const { access_token } = tokenResponse.data;

        // 사용자 정보 요청
        const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const kakaoId = userResponse.data.id; // Kakao 고유 사용자 ID
        const name = userResponse.data.properties?.nickname || `User_${kakaoId}`; // 닉네임 기본값 처리

        // 사용자 정보 저장 또는 업데이트
        const [user] = await User.findOrCreate({
            where: { social_id: kakaoId, social_provider: "kakao" },
            defaults: { name },
        });

        // 사용자 활동 데이터가 없으면 생성
        await UserActivity.findOrCreate({
            where: { user_id: user.id },
            defaults: {
                visit_count: 1, // 첫 로그인 시 방문 횟수 1
            },
        });

        // 추천 노래 가져오기
        const songData = await getRandomSong(req); // 랜덤 노래 생성

        // 세션에 사용자 및 노래 정보 저장
        req.session.user = { userId: user.id, name: user.name };
        req.session.songData = songData;

        console.log("세션 확인:", req.session);

        // 로그인 성공 후 홈으로 리다이렉트
        res.redirect("http://localhost:3000/home");

    } catch (err) {
        console.error("카카오 로그인 실패:", err.message);
        res.status(500).send("Kakao Authentication Failed");
    }
});

module.exports = router;
