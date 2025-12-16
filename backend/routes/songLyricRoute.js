const express = require("express");
const router = express.Router();

/**
 * @openapi
 * /song/lyric:
 *   get:
 *     summary: 추천된 노래의 가사 조회
 *     description: 세션에 저장된 추천 노래의 가사를 반환합니다.
 *     tags:
 *       - Song
 *     responses:
 *       200:
 *         description: 가사 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 songData:
 *                   type: object
 *                   properties:
 *                     Artist:
 *                       type: string
 *                       example: "IU"
 *                     Title:
 *                       type: string
 *                       example: "좋은 날"
 *                     Lyric:
 *                       type: string
 *                       example: "오늘은 좋은 날\n너무나도 좋은 날"
 *       404:
 *         description: 추천된 노래가 없거나 가사 정보가 없음
 *       500:
 *         description: 가사 조회 실패
 */
router.get("/", async (req, res) => {
  try {
    // 세션에서 songData 가져오기
    const songData = req.session.songData;

    // 세션에 추천된 노래가 없을 경우
    if (!songData) {
      return res.status(404).json({
        result: false,
        message: "추천된 노래가 없습니다.",
      });
    }

    // 가사 정보가 없는 경우
    if (!songData.Lyric) {
      return res.status(404).json({
        result: false,
        message: "가사 정보가 없습니다.",
      });
    }

    // 가사 줄바꿈 처리 개선
    // 원본 가사의 줄바꿈을 보존하고, 연속된 공백을 정리
    let formattedLyric = songData.Lyric
      // Windows 스타일 줄바꿈(\r\n)을 Unix 스타일(\n)으로 통일
      .replace(/\r\n/g, '\n')
      // Mac 스타일 줄바꿈(\r)을 Unix 스타일(\n)으로 통일
      .replace(/\r/g, '\n')
      // 연속된 줄바꿈을 최대 2개로 제한 (빈 줄 하나만 허용)
      .replace(/\n{3,}/g, '\n\n')
      // 각 줄의 앞뒤 공백 제거
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // 전체 앞뒤 공백 제거
      .trim();

    // 세션에서 가사와 노래 정보를 반환
    return res.status(200).json({
      result: true,
      songData: {
        Artist: songData.Artist,
        Title: songData.Title,
        Lyric: formattedLyric, // HTML-friendly 가사
      },
    });
  } catch (error) {
    console.error("가사 조회 실패:", error.message);
    return res.status(500).json({
      result: false,
      message: "가사 조회에 실패했습니다.",
    });
  }
});

module.exports = router;