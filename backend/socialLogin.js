require('dotenv').config();
const express = require('express');
const app = express();

// Google 및 Kakao 라우트 가져오기
const googleLogin = require('./googleLogin');
const kakaoLogin = require('./kakaoLogin');

// 라우트 연결
app.use('/auth/google', googleLogin);
app.use('/auth/kakao', kakaoLogin);

// 기본 라우트
app.get('/', (req, res) => {
    res.send(`
        <h1>Login Page</h1>
        <a href="/auth/google">Login with Google</a><br>
        <a href="/auth/kakao">Login with Kakao</a>
    `);
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

