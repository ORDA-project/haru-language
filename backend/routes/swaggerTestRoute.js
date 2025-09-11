const express = require("express");
const router = express.Router();

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
 *                       example: "í™ê¸¸ë™"
 */
router.post("/", (req, res) => {
  req.session.user = {
    userId: 4,
    social_id: "test123",
    social_provider: "swagger",
    name: "홍길동", // 깨진 문자 수정
    visitCount: 1,
    mostVisitedDays: "Monday",
  };

  req.session.save((err) => {
    if (err) {
      console.error("세션 저장 실패:", err); // 깨진 문자 수정
      return res.status(500).json({ error: "세션 저장 실패" }); // 깨진 문자 수정
    }
    res.json({
      message: "Swagger test user logged in",
      user: req.session.user,
    });
  });
});

module.exports = router;