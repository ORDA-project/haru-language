require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// 카카오 앱 설정 (카카오 개발자 콘솔에서 확인)
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

// 카카오 로그인 페이지로 리다이렉트
app.get('/auth/kakao', (req, res) => {
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}`;
    res.redirect(kakaoAuthURL);
});

// 카카오에서 Authorization Code를 받는 콜백
app.get('/auth/kakao/callback', async (req, res) => {
    console.log('Query Params:', req.query); // Authorization Code 확인
    const { code } = req.query; // Authorization 
    
    if (!code) {
        return res.status(400).send('Authorization code is missing.');
    }

    try {
        // Access Token 요청
        const tokenResponse = await axios.post(
            'https://kauth.kakao.com/oauth/token',
            null, // POST 요청의 body는 null로 설정
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

        // 사용자 정보 출력
        const nickname = userResponse.data.properties.nickname;
        res.send(`Hello, ${nickname}!`); // 한 번만 응답

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).send('Failed to authenticate with Kakao.');
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
