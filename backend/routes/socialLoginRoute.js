const express = require("express");
const axios = require("axios");
const router = express.Router();
const googleRouter = require("../login/googleLogin");
const kakaoRouter = require("../login/kakaoLogin");

// Google 로그인 라우터
router.use("/google", googleRouter);

// Kakao 로그인 라우터
router.use("/kakao", kakaoRouter);

// 세션 상태 확인
router.get("/check", (req, res) => {
  const user = req.session.user;
  res.json({
    isLoggedIn: !!user,
    user: user || null,
  });
});

// 로그아웃 라우터
router.get("/logout", async (req, res) => {
  try {
    const accessToken = req.session.token;

    // 카카오 로그아웃 요청 (선택 사항)
    if (accessToken) {
      await axios.post(
        "https://kapi.kakao.com/v1/user/logout",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }

    // 세션 제거 및 쿠키 삭제
    req.session.destroy((err) => {
      if (err) {
        console.error("세션 삭제 실패:", err);
        return res.status(500).send("로그아웃 실패");
      }

      res.clearCookie("user_sid");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");

      console.log("로그아웃 성공");
      res.status(200).send("Logout successful");
    });
  } catch (error) {
    console.error("로그아웃 처리 실패:", error.message || error);
    res.status(500).send("Failed to log out.");
  }
});

module.exports = router;
