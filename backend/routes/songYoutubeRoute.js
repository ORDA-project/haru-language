const express = require("express");
const { google } = require("googleapis");
require("dotenv").config();

const router = express.Router();

async function getYoutubeVideoUrl(Title, Artist) {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY가 .env에 설정되어 있지 않습니다.");
    }

    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY,
    });

    const query = `${Title} ${Artist}`;
    const response = await youtube.search.list({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: 1,
    });

    if (!response.data.items?.length) {
      throw new Error("유튜브에서 비디오를 찾을 수 없습니다.");
    }

    const videoId = response.data.items[0]?.id?.videoId;
    if (!videoId) {
      throw new Error("비디오 ID를 찾을 수 없습니다.");
    }

    return {
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  } catch (error) {
    console.error("유튜브 API 요청 실패:", error.message);
    throw new Error("유튜브 비디오 링크를 가져오는 데 실패했습니다.");
  }
}

function extractVideoIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

router.get("/", async (req, res) => {
  try {
    const songData = req.session.songData;

    if (!songData?.Title || !songData?.Artist) {
      return res.status(400).json({
        result: false,
        message: "노래 정보가 세션에 없습니다.",
      });
    }

    const { Title, Artist, youtubeLink } = songData;

    if (youtubeLink) {
      const videoId = extractVideoIdFromUrl(youtubeLink);
      if (videoId) {
        return res.status(200).json({
          result: true,
          videoUrl: youtubeLink,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          title: Title,
          artist: Artist,
          source: "session",
        });
      }
    }

    const { videoUrl, embedUrl } = await getYoutubeVideoUrl(Title, Artist);
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
    return res.status(500).json({
      result: false,
      message: "유튜브 비디오 링크를 가져오는 데 실패했습니다.",
    });
  }
});

module.exports = router;

