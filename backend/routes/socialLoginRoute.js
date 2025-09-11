const express = require("express");
const axios = require("axios");
const router = express.Router();
const googleRouter = require("../login/googleLogin");
const kakaoRouter = require("../login/kakaoLogin");


// Google 濡쒓렇???쇱슦??
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

// Kakao 濡쒓렇???쇱슦??
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


// ?몄뀡 ?곹깭 ?뺤씤
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
 *                     name: "?띻만??
 */
router.get("/check", (req, res) => {
  const user = req.session.user;
  res.json({
    isLoggedIn: !!user,
    user: user || null,
  });
});


// 濡쒓렇?꾩썐 ?쇱슦??
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
    const accessToken = req.session.token;

    // 移댁뭅??濡쒓렇?꾩썐 ?붿껌 (?좏깮 ?ы빆)
    if (accessToken) {
      await axios.post(
        "https://kapi.kakao.com/v1/user/logout",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }

    // ?몄뀡 ?쒓굅 諛?荑좏궎 ??젣
    req.session.destroy((err) => {
      if (err) {
        console.error("?몄뀡 ??젣 ?ㅽ뙣:", err);
        return res.status(500).send("濡쒓렇?꾩썐 ?ㅽ뙣");
      }

      res.clearCookie("user_sid");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");

      console.log("濡쒓렇?꾩썐 ?깃났");
      res.status(200).send("Logout successful");
    });
  } catch (error) {
    console.error("濡쒓렇?꾩썐 泥섎━ ?ㅽ뙣:", error.message || error);
    res.status(500).send("Failed to log out.");
  }
});

module.exports = router;
