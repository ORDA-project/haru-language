const express = require("express");
const router = express.Router();
const googleRouter = require("../login/googleLogin");
const kakaoRouter = require("../login/kakaoLogin");

// Google 라우트 등록
router.use("/google", googleRouter);

// Kakao 라우트 등록
router.use("/kakao", kakaoRouter);

// 세션 확인용 라우트 (실제 구현 때는 불필요)
router.get("/check", (req, res) => {
    if (req.session.user) {
        res.json({
            isLoggedIn: true,
            user: req.session.user,
        });
    } else {
        res.json({
            isLoggedIn: false,
        });
    }
});

// 로그아웃 라우트
// 로그아웃 코드를 따로 팔지 아니면 묶을지 못 정해서 일단 여기 뒀습니다...!
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("세션 삭제 실패:", err);
            return res.status(500).send("Failed to log out.");
        }
        res.clearCookie("user_sid"); // 세션 쿠키 삭제
        res.send("Logged out successfully."); //일단 간단한 문구로 실행 확인
        // res.redirect("/"); //로그아웃 후 처음으로 리다이렉트
    });
});

module.exports = router;
