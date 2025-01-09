const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 세션에서 songData 가져오기
    const songData = req.session.songData;

    if (!songData) {
      return res.status(404).json({
        result: false,
        message: "추천된 노래가 없습니다.",
      });
    }

    // 세션에서 가사 바로 반환
    return res.status(200).json({
      result: true,
      songData: {
        Artist: songData.Artist,
        Title: songData.Title,
        Lyric: songData.Lyric,
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