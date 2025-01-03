require('dotenv').config({ path: "../.env" });
const express = require('express');
const axios = require('axios');

const router = express.Router();

// Google API 설정
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Google 로그인 페이지로 리다이렉트
router.get('/', (req, res) => {
    const googleAuthURL = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&scope=email%20profile`;
    res.redirect(googleAuthURL);
});

// Google에서 Authorization Code를 받는 콜백
router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code is missing.');
    }

    try {
        // Access Token 요청
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            {
                code: code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code',
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const { access_token } = tokenResponse.data;

        // Access Token을 사용해 사용자 정보 요청
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        // 사용자 정보 출력
        const { name, email } = userResponse.data;
        res.send(`Hello, ${name}! Your email is ${email}.`);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).send('Failed to authenticate with Google.');
    }
});

module.exports = router;
