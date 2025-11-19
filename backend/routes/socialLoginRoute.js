const express = require("express");
const router = express.Router();
const googleRouter = require("../login/googleLogin");
const kakaoRouter = require("../login/kakaoLogin");


// Google 로그인 라우터
/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: Google OAuth login (redirect)
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
router.use("/google", googleRouter);

// Kakao 로그인 라우터
/**
 * @openapi
 * /auth/kakao:
 *   get:
 *     summary: Kakao OAuth login (redirect)
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirects to Kakao login
 */
router.use("/kakao", kakaoRouter);

// 세션 상태 확인
/**
 * @openapi
 * /auth/check:
 *   get:
 *     summary: Check login session status
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Returns login state and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLoggedIn:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   nullable: true
 *                   example:
 *                     id: "123"
 *                     name: "홍길동"
 */
router.get("/check", (req, res) => {
  const user = req.session.user;
  res.json({
    isLoggedIn: !!user,
    user: user || null,
  });
});

// 로그아웃 라우터
/**
 * @openapi
 * /auth/logout:
 *   get:
 *     summary: Logout user and destroy session
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Failed to log out
 */
router.get("/logout", async (req, res) => {
  try {
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