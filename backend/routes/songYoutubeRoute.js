const express = require("express");
const { google } = require("googleapis");
require("dotenv").config(); // .env에서 API Key 로드

const router = express.Router();

// 유튜브 API 클라이언트 설정
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY, // .env 파일에서 API Key를 가져옵니다.
});

// 노래 제목과 아티스트를 기반으로 유튜브 비디오 링크를 가져오는 함수
async function getYoutubeVideoUrl(Title, Artist) {
  try {
    const query = `${Title} ${Artist}`;
    const response = await youtube.search.list({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: 1, // 첫 번째 결과만 가져옵니다.
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error("유튜브에서 비디오를 찾을 수 없습니다.");
    }

    const video = response.data.items[0]; // 첫 번째 비디오 정보
    const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
    const embedUrl = `https://www.youtube.com/embed/${video.id.videoId}`;
    return { videoUrl, embedUrl };
  } catch (error) {
    console.error("유튜브 API 요청 실패:", error.message);
    throw new Error("유튜브 비디오 링크를 가져오는 데 실패했습니다.");
  }
}

// 로그인 후 세션에 저장된 노래 정보를 바탕으로 유튜브 링크를 반환하는 라우터
router.get("/", async (req, res) => {
  try {
    const Title = req.session.songData?.Title; // 세션에서 노래 제목 가져오기
    const Artist = req.session.songData?.Artist; // 세션에서 아티스트 가져오기

    if (!Title || !Artist) {
      return res.status(400).json({ result: false, message: "노래 제목이나 아티스트가 없습니다." });
    }

    // 유튜브 링크 가져오기
    const { videoUrl, embedUrl } = await getYoutubeVideoUrl(Title, Artist);

    res.status(200).json({
      result: true,
      videoUrl: videoUrl, //유튜브 페이지로 이동할 때 사용
      embedUrl: embedUrl, // HTML로 현재 페이지에 삽입할 때
      title: Title,
      artist: Artist,
    });
  } catch (error) {
    console.error("유튜브 비디오 링크 조회 실패:", error.message);
    res.status(500).json({
      result: false,
      message: "유튜브 비디오 링크를 가져오는 데 실패했습니다.",
    });
  }
});

module.exports = router;
