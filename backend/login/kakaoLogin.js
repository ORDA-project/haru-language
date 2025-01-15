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

        // 방문 기록 업데이트 로직
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정

        // 오늘 날짜의 방문 기록 확인
        const userActivity = await UserActivity.findOne({
            where: {
                user_id: user.id,
                createdAt: {
                    [Op.gte]: today, // 오늘 이후 데이터만 조회
                    [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000), // 내일 자정 이전까지
                },
            },
        });

        let visitCount = 1; // 기본 방문 횟수
        if (!userActivity) {
            const newUserActivity = await UserActivity.create({
                user_id: user.id,
                visit_count: 1,
            });
            visitCount = newUserActivity.visit_count; // 새로 생성된 방문 횟수
        } else {
            visitCount = userActivity.visit_count; // 기존 방문 횟수
            console.log("오늘 이미 방문 기록이 존재합니다. visit_count는 증가하지 않습니다.");
        }

        // 최다 방문 요일 계산
        const activities = await UserActivity.findAll({
            where: { user_id: user.id },
            attributes: ["createdAt"], // createdAt 필드만 가져오기
        });

        const dayCounts = activities.reduce((counts, activity) => {
            const day = new Date(activity.createdAt).toLocaleDateString("en-US", { weekday: "long" });
            counts[day] = (counts[day] || 0) + 1;
            return counts;
        }, {});

        const maxVisits = Math.max(...Object.values(dayCounts)); // 가장 높은 방문 횟수
        const mostVisitedDays = Object.keys(dayCounts).filter(day => dayCounts[day] === maxVisits);

        // 추천 노래 가져오기
        const songData = await getRandomSong(req);

        // 세션에 사용자 및 활동 데이터 저장
        req.session.user = {
            userId: user.id,
            name: user.name,
            visitCount: visitCount, // 방문 횟수 (수정된 변수 사용)
            mostVisitedDays: mostVisitedDays.join(", "), // 최다 방문 요일
        };
        req.session.songData = songData; // 랜덤 노래 정보 저장

        console.log(req.session.user, req.session.songData); // 세션에 저장된 사용자 정보 확인

        // 로그인 성공 후 홈으로 리다이렉트
        res.redirect("http://localhost:3000/home");

    } catch (err) {
        console.error("카카오 로그인 실패:", err.message);
        res.status(500).send("Kakao Authentication Failed");
    }
});

module.exports = router;
