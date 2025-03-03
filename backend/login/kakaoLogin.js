const express = require("express");
const axios = require("axios");
const { User, UserActivity } = require("../models");
const { sequelize } = require("../db"); // Sequelize 인스턴스 가져오기
const { Op } = require("sequelize"); // Sequelize에서 Op 가져오기
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

        // 방문 기록 업데이트 (하루 00:00 기준)
        const userActivity = await UserActivity.updateVisit(user.id);
        const visitCount = userActivity.visit_count;

        // 최다 방문 요일 계산
        const mostVisitedDaysData = await UserActivity.getMostVisitedDays(user.id);
        const mostVisitedDays = mostVisitedDaysData.mostVisitedDays.join(", "); // 최다 방문 요일 리스트

        // 추천 노래 가져오기
        const songData = await getRandomSong(req);

        // 세션에 사용자 및 활동 데이터 저장
        req.session.user = {
            userId: user.id,
            name: user.name,
            visitCount: visitCount, 
            mostVisitedDays: mostVisitedDays, 
        };
        req.session.songData = songData; 

        // 추가 정보 입력 여부 확인 후 리디렉트
        /*
        if (!user.gender || !user.goal) {
        return res.redirect("http://localhost:3000/userdetails");
        }
        */
        
        // 로그인 성공 후 홈으로 리다이렉트
        res.redirect("http://localhost:3000/home");

    } catch (err) {
        console.error("카카오 로그인 실패:", err.message);
        res.status(500).send("Kakao Authentication Failed");
    }
});

module.exports = router;
