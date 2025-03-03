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

        if (!userCreated) {
            user.name = name;
            user.email = email;
            await user.save();
        }

        // 방문 기록 업데이트 (하루 00:00 기준)
        const userActivity = await UserActivity.updateVisit(user.id);
        const visitCount = userActivity.visit_count;

        // 최다 방문 요일 계산
        const mostVisitedDaysData = await UserActivity.getMostVisitedDays(user.id);
        const mostVisitedDays = mostVisitedDaysData.mostVisitedDays.join(", "); 

        // 세션에 사용자 정보 저장
        req.session.user = {
            userId: user.id,
            name: user.name,
            email: user.email,
            visitCount: visitCount, 
            mostVisitedDays: mostVisitedDays, 
        };

        // 추천 노래 가져오기
        const songData = await getRandomSong(req);
        req.session.songData = songData; // 세션에 저장

        // 추가 정보 입력 안 했으면 리디렉트
        /*
        if (!user.gender || !user.goal) {
            return res.redirect("http://localhost:3000/userdetails");
        } 
        */
        
        // 로그인 성공 후 홈으로 리디렉트
        res.redirect("http://localhost:3000/home");

    } catch (err) {
        console.error("Google Authentication Failed:", err.message);
        res.status(500).send("Google Authentication Failed");
    }
});

module.exports = router;
