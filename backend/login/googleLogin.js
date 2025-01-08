const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { User, UserActivity } = require("../models");

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
        const [user, created] = await User.findOrCreate({
            where: { social_id: id, social_provider: "google" },
            defaults: { name, email },
        });

        // 이름과 이메일 업데이트 (기존 사용자일 경우)
        if (!created) {
            user.name = name;
            user.email = email;
            await user.save();
        }

        // 사용자 활동 데이터가 없으면 생성
        await UserActivity.findOrCreate({
            where: { user_id: user.id },
            defaults: {
                visit_count: 0,
                most_visited_day: null,
            },
        });

        // 세션에 사용자 정보 저장
        req.session.user = { id: user.id, name: user.name, email: user.email };
        console.log(req.session.user); // 세션에 저장된 사용자 정보 확인


        // 로그인 성공 후 홈으로 리다이렉트
        res.redirect("/home");

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Google Authentication Failed");
    }
});

module.exports = router;

