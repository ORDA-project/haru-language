const express = require("express");
const { User } = require("../models");
const router = express.Router();

/**
 * @openapi
 * /home:
 *   get:
 *     summary: Get logged-in user's home data (profile, visit stats, recommended song)
 *     tags:
 *       - Home
 *     responses:
 *       200:
 *         description: Returns home data for the logged-in user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                   example: true
 *                 userData:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "?띻만??
 *                     visitCount:
 *                       type: integer
 *                       example: 5
 *                     mostVisitedDay:
 *                       type: string
 *                       example: "Monday"
 *                     recommendation:
 *                       type: string
 *                       example: "醫뗭? ??by IU"
 *       401:
 *         description: Unauthorized (not logged in)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch home data
 */
// 濡쒓렇?명븳 ?ъ슜?먯쓽 ?뺣낫, 諛⑸Ц ?듦퀎, 異붿쿇 ?몃옒瑜?諛섑솚
router.get("/", async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    return res.status(401).json({
      result: false,
      message: "濡쒓렇?몄씠 ?꾩슂?⑸땲??",
    });
  }

  try {
    // userId濡?吏곸젒 李얘린 (DB primary key ?ъ슜)
    const user = await User.findByPk(sessionUser.userId);

    if (!user) {
      return res.status(404).json({
        result: false,
        message: "?ъ슜???곗씠?곕? 李얠쓣 ???놁뒿?덈떎.",
      });
    }

    const { visitCount = 1, mostVisitedDays = "?곗씠???놁쓬" } = sessionUser;
    const songData = req.session.songData;

    return res.status(200).json({
      result: true,
      userData: {
        name: user.name,
        visitCount,
        mostVisitedDay: mostVisitedDays,
        recommendation: songData
          ? `${songData.Title} by ${songData.Artist}`
          : "異붿쿇???몃옒媛 ?놁뒿?덈떎.",
      },
    });
  } catch (error) {
    console.error("???곗씠??媛?몄삤湲??ㅽ뙣:", error.message);
    return res.status(500).json({
      result: false,
      error: "???곗씠?곕? 媛?몄삤?????ㅽ뙣?덉뒿?덈떎.",
    });
  }
});

module.exports = router;
