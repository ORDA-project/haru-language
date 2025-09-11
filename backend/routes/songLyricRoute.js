const express = require("express");
const router = express.Router();

/**
 * @openapi
 * /song/lyric:
 *   get:
 *     summary: Get song lyric information from session
 *     tags:
 *       - Song
 *     responses:
 *       200:
 *         description: Song lyric and metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                   example: true
 *                 songData:
 *                   type: object
 *                   properties:
 *                     Artist:
 *                       type: string
 *                       example: "IU"
 *                     Title:
 *                       type: string
 *                       example: "醫뗭? ??
 *                     Lyric:
 *                       type: string
 *                       example: "?ㅻ뒛? 醫뗭? ??n?덈Т?섎룄 醫뗭? ??
 *       404:
 *         description: No recommended song or no lyric found
 *       500:
 *         description: Failed to fetch lyric
 */
router.get("/", async (req, res) => {
  try {
    // ?몄뀡?먯꽌 songData 媛?몄삤湲?
    const songData = req.session.songData;

    // ?몄뀡??異붿쿇???몃옒媛 ?놁쓣 寃쎌슦
    if (!songData) {
      return res.status(404).json({
        result: false,
        message: "異붿쿇???몃옒媛 ?놁뒿?덈떎.",
      });
    }

    // 媛???뺣낫媛 ?녿뒗 寃쎌슦
    if (!songData.Lyric) {
      return res.status(404).json({
        result: false,
        message: "媛???뺣낫媛 ?놁뒿?덈떎.",
      });
    }

    // 媛??以꾨컮轅?泥섎━ (40??湲곗?)
    const formattedLyric = songData.Lyric.replace(/(.{1,40})(\s|$)/g, "$1\n").trim();

    // ?몄뀡?먯꽌 媛?ъ? ?몃옒 ?뺣낫瑜?諛섑솚
    return res.status(200).json({
      result: true,
      songData: {
        Artist: songData.Artist,
        Title: songData.Title,
        Lyric: formattedLyric, // HTML-friendly 媛??
      },
    });
  } catch (error) {
    console.error("媛??議고쉶 ?ㅽ뙣:", error.message);
    return res.status(500).json({
      result: false,
      message: "媛??議고쉶???ㅽ뙣?덉뒿?덈떎.",
    });
  }
});

module.exports = router;
