const express = require("express");
const { google } = require("googleapis");
require("dotenv").config();

const router = express.Router();

// 유튜브 API 키 확인
if (!process.env.YOUTUBE_API_KEY) {
  throw new Error("YOUTUBE_API_KEY가 .env에 설정되어 있지 않습니다.");
}

// 유튜브 API 클라이언트 설정
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// 유튜브 링크 검색 함수
async function getYoutubeVideoUrl(Title, Artist) {
  try {
    const query = `${Title} ${Artist}`;
    const response = await youtube.search.list({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: 1,
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error("유튜브에서 비디오를 찾을 수 없습니다.");
    }

    const videoId = response.data.items[0]?.id?.videoId;

    if (!videoId) {
      throw new Error("비디오 ID를 찾을 수 없습니다.");
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return { videoUrl, embedUrl };
  } catch (error) {
    console.error("유튜브 API 요청 실패:", error.message);
    throw new Error("유튜브 비디오 링크를 가져오는 데 실패했습니다.");
  }
}

// 세션 링크에서 videoId 추출하는 함수
function extractVideoIdFromUrl(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1); // e.g., /abc123 → abc123
    }

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v"); // e.g., watch?v=abc123
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * @swagger
 * /songYoutube:
 *   get:
 *     summary: 추천된 노래의 유튜브 링크 조회
 *     description: 세션에 저장된 추천 노래의 유튜브 비디오 링크를 반환합니다. 세션에 링크가 없으면 YouTube API를 통해 검색합니다.
 *     tags: [Songs]
 *     responses:
 *       200:
 *         description: 유튜브 링크 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                   example: true
 *                 videoUrl:
 *                   type: string
 *                   example: "https://www.youtube.com/watch?v=gdZLi9oWNZg"
 *                 embedUrl:
 *                   type: string
 *                   example: "https://www.youtube.com/embed/gdZLi9oWNZg"
 *                 title:
 *                   type: string
 *                   example: "Dynamite"
 *                 artist:
 *                   type: string
 *                   example: "BTS"
 *                 source:
 *                   type: string
 *                   enum: [session, api]
 *                   example: "session"
 *       400:
 *         description: 노래 정보가 세션에 없음
 *       500:
 *         description: 유튜브 비디오 링크 조회 실패
 */
router.get("/", async (req, res) => {
  try {
    const songData = req.session.songData;

    if (!songData || !songData.Title || !songData.Artist) {
      return res.status(400).json({
        result: false,
        message: "노래 정보가 세션에 없습니다.",
      });
    }

    const { Title, Artist, youtubeLink } = songData;

    if (youtubeLink) {
      const videoId = extractVideoIdFromUrl(youtubeLink);

      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;

        return res.status(200).json({
          result: true,
          videoUrl: youtubeLink,
          embedUrl,
          title: Title,
          artist: Artist,
          source: "session",
        });
      }
    }

    // 없거나 videoId를 추출할 수 없을 경우 → API 호출
    const { videoUrl, embedUrl } = await getYoutubeVideoUrl(Title, Artist);

    // 세션에 저장
    req.session.songData.youtubeLink = videoUrl;

    return res.status(200).json({
      result: true,
      videoUrl,
      embedUrl,
      title: Title,
      artist: Artist,
      source: "api",
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
