const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// 세션 설정
app.use(session({
    secret: '######입력해야함',
    resave: false,
    saveUninitialized: true,
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth 전략
passport.use(new GoogleStrategy({
    clientID: 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
    // Google 로그인 사용자 정보 처리
    return done(null, profile);
}));

// 직렬화 & 역직렬화
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Google 로그인 라우트
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.send(`Hello, ${req.user.displayName}!`);
    });

// 홈 라우트
app.get('/', (req, res) => {
    res.send('<a href="/auth/google">Login with Google</a>');
});

// 서버 실행
app.listen(3000, () => {
    console.log('Google Login Server running on http://localhost:3000');
});

