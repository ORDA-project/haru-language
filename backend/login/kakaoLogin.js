require('dotenv').config({ path: "./.env" });
const express = require('express');
const axios = require('axios');

const router = express.Router();

// 카카오 앱 설정 (카카오 개발자 콘솔에서 확인)
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

// 카카오 로그인 페이지로 리다이렉트
router.get('/', (req, res) => {
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}`;
    res.redirect(kakaoAuthURL);
});

// 카카오에서 Authorization Code를 받는 콜백
router.get('/callback', async (req, res) => {
    const { code } = req.query; // Authorization Code
    
    if (!code) {
        return res.status(400).send('Authorization code is missing.');
    }

    try {
        // Access Token 요청
        const tokenResponse = await axios.post(
            'https://kauth.kakao.com/oauth/token',
            null,
            {
                params: {
                    grant_type: 'authorization_code',
                    client_id: KAKAO_REST_API_KEY,
                    redirect_uri: KAKAO_REDIRECT_URI,
                    code: code,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token } = tokenResponse.data;

        // Access Token을 사용해 사용자 정보 요청
        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        // 사용자 정보 가져오기
        const { nickname } = userResponse.data.properties; // 닉네임
        const { id } = userResponse.data; // 고유 사용자 ID

        console.log('[DEBUG] User Info:', userResponse.data);

        // 사용자 정보 출력
        res.send(`
            <h1>Welcome, ${nickname}!</h1>
            <p>Your ID: ${id}</p>
        `);

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).send('Failed to authenticate with Kakao.');
    }
});

module.exports = router;
