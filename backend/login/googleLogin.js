const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { User, UserActivity } = require("../models");
const { sequelize } = require("../db"); // Sequelize 인스턴스 가져오기
const { Op } = require("sequelize"); // Sequelize에서 Op 가져오기
const { getRandomSong } = require("../services/songService");

require("dotenv").config();

const router = express.Router();

// JSON 파일 경로 (환경 변수에서 읽기)
const googleCredentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

// JSON 파일 읽기
let googleCredentials;
try {
    const fileContent = fs.readFileSync(googleCredentialsPath, "utf8");
    googleCredentials = JSON.parse(fileContent);
} catch (err) {
    console.error("Google JSON 파일 읽기 실패:", err.message);
    process.exit(1); // JSON 파일이 없으면 서버 실행 중단
}

// Google API 설정
const GOOGLE_CLIENT_ID = googleCredentials.web.client_id;
const GOOGLE_CLIENT_SECRET = googleCredentials.web.client_secret;
const GOOGLE_REDIRECT_URI = googleCredentials.web.redirect_uris[0];

// Google 로그인 페이지로 리다이렉트
router.get("/", (req, res) => {
    const googleAuthURL = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&scope=email%20profile`;
    console.log("Google Auth URL:", googleAuthURL);
    res.redirect(googleAuthURL);
});

// Google에서 Authorization Code 받기
router.get("/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Authorization code is missing.");
    }

    try {
        // Access Token 요청
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            null,
            {
                params: {
                    code: code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    redirect_uri: GOOGLE_REDIRECT_URI,
                    grant_type: "authorization_code",
                },
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );

        const { access_token } = tokenResponse.data;

        // 사용자 정보 요청
        const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { id, name, email } = userResponse.data;

        // 사용자 정보 저장 또는 업데이트
        const [user, userCreated] = await User.findOrCreate({
            where: { social_id: id, social_provider: "google" },
            defaults: { name, email },
        });

        // 이름과 이메일 업데이트 (기존 사용자일 경우)
        if (!userCreated) {
            user.name = name;
            user.email = email;
            await user.save();
        }

        // 방문 기록 업데이트 로직
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정

        // 오늘 날짜의 방문 기록 확인
        let visitCount = 1; // 기본 방문 횟수
        const userActivity = await UserActivity.findOne({
            where: {
                user_id: user.id,
                createdAt: {
                    [Op.gte]: today, // 오늘 이후 데이터만 조회
                    [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000), // 내일 자정 이전까지
                },
            },
        });

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

        // 세션에 사용자 정보 및 방문 데이터 저장
        req.session.user = {
            userId: user.id,
            name: user.name,
            email: user.email,
            visitCount: visitCount, // visitCount 변수 사용
            mostVisitedDays: mostVisitedDays.join(", "), // 최다 방문 요일
        };

        // 추천 노래 가져오기
        const songData = await getRandomSong(req); // 랜덤 노래 생성
        req.session.songData = songData; // 세션에 저장

        console.log(req.session.user, req.session.songData); // 세션에 저장된 사용자 정보 확인

        // 로그인 성공 후 홈으로 리다이렉트
        res.redirect("http://localhost:3000/home");

    } catch (err) {
        console.error("Google Authentication Failed:", err.message);
        res.status(500).send("Google Authentication Failed");
    }
});

module.exports = router;
