const express = require("express");
const router = express.Router();

// 媛쒕컻?섍꼍???꾨땲硫?404 諛섑솚
if (process.env.NODE_ENV === "production") {
  router.use("*", (req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  module.exports = router;
  return;
}

/**
 * @openapi
 * /swagger-test-login:
 *   post:
 *     summary: Create a fake session for Swagger testing (development only)
 *     tags:
 *       - Swagger
 *     responses:
 *       200:
 *         description: Test user logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Swagger test user logged in"
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "1"
 *                     social_id:
 *                       type: string
 *                       example: "test123"
 *                     name:
 *                       type: string
 *                       example: "?띻만??
 */
router.post("/", (req, res) => {
  req.session.user = {
    userId: 4,                    // DB??primary key (?ㅼ젣 test ?좎???id)
    social_id: "test123",         // OAuth ID  
    social_provider: "swagger",   // OAuth ?쒓났??
    name: "?띻만??,
    visitCount: 1,
    mostVisitedDays: "Monday",
  };

  req.session.save((err) => {
    if (err) {
      console.error("?몄뀡 ????ㅽ뙣:", err);
      return res.status(500).json({ error: "?몄뀡 ????ㅽ뙣" });
    }
    res.json({
      message: "Swagger test user logged in",
      user: req.session.user,
    });
  });
});

module.exports = router;
