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
router.get("/logout", async (req, res) => {
    try {
        // (선택) OAuth 토큰 무효화
        const accessToken = req.session.token; // 저장된 토큰
        if (accessToken) {
            await axios.post(
                "https://kapi.kakao.com/v1/user/logout",
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        }

        // 세션 삭제
        req.session.destroy((err) => {
            if (err) {
                console.error("세션 삭제 실패:", err);
                return res.status(500).send("로그아웃 실패");
            }
            // 클라이언트 쿠키 삭제
            res.clearCookie("user_sid");

            // 캐시 제거
            res.setHeader("Cache-Control", "no-store");
            res.setHeader("Pragma", "no-cache");

            // 로그아웃 성공 메시지 또는 리다이렉트
            console.log(`로그아웃 성공`);
            res.redirect("http://localhost:3000"); // 로그아웃 후 기본 페이지로 이동
        });
    } catch (error) {
        console.error("로그아웃 처리 실패:", error);
        res.status(500).send("Failed to log out.");
    }
});

module.exports = router;
