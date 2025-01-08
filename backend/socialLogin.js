const express = require('express');
const googleRouter = require('./login/googleLogin');
const kakaoRouter = require('./login/kakaoLogin');
require('dotenv').config(); // .env 파일 초기화

const app = express();
const PORT = 8000;

// Google 라우터 연결
app.use('/auth/google', googleRouter);

// Kakao 라우터 연결
app.use('/auth/kakao', kakaoRouter);

// 기본 홈 라우트
app.get('/', (req, res) => {
    res.send(`
        <h1>Social Login</h1>
        <a href="/auth/google">Login with Google</a><br>
        <a href="/auth/kakao">Login with Kakao</a>
    `);
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});