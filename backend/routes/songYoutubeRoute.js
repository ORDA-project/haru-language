const express = require("express");
const { google } = require("googleapis");
require("dotenv").config();

const router = express.Router();

// ?좏뒠釉?API ???뺤씤
if (!process.env.YOUTUBE_API_KEY) {
  throw new Error("YOUTUBE_API_KEY媛 .env???ㅼ젙?섏뼱 ?덉? ?딆뒿?덈떎.");
}

// ?좏뒠釉?API ?대씪?댁뼵???ㅼ젙
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// ?좏뒠釉?留곹겕 寃???⑥닔
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
      throw new Error("?좏뒠釉뚯뿉??鍮꾨뵒?ㅻ? 李얠쓣 ???놁뒿?덈떎.");
    }

    const videoId = response.data.items[0]?.id?.videoId;

    if (!videoId) {
      throw new Error("鍮꾨뵒??ID瑜?李얠쓣 ???놁뒿?덈떎.");
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return { videoUrl, embedUrl };
  } catch (error) {
    console.error("?좏뒠釉?API ?붿껌 ?ㅽ뙣:", error.message);
    throw new Error("?좏뒠釉?鍮꾨뵒??留곹겕瑜?媛?몄삤?????ㅽ뙣?덉뒿?덈떎.");
  }
}

// ?몄뀡 留곹겕?먯꽌 videoId 異붿텧?섎뒗 ?⑥닔
function extractVideoIdFromUrl(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1); // e.g., /abc123 ??abc123
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
 * @openapi
 * /song/youtube:
 *   get:
 *     summary: Get YouTube video link for a song (from session or YouTube API)
 *     tags:
 *       - Song
 *     responses:
 *       200:
 *         description: Returns YouTube video link and embed URL
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
 *                   example: "https://www.youtube.com/watch?v=abc123"
 *                 embedUrl:
 *                   type: string
 *                   example: "https://www.youtube.com/embed/abc123"
 *                 title:
 *                   type: string
 *                   example: "醫뗭? ??
 *                 artist:
 *                   type: string
 *                   example: "IU"
 *                 source:
 *                   type: string
 *                   example: "api"
 *       400:
 *         description: Song info not found in session
 *       500:
 *         description: Failed to fetch YouTube video link
 */
// ?좏뒠釉?留곹겕 諛섑솚 ?쇱슦??
router.get("/", async (req, res) => {
  try {
    const songData = req.session.songData;

    if (!songData || !songData.Title || !songData.Artist) {
      return res.status(400).json({
        result: false,
        message: "?몃옒 ?뺣낫媛 ?몄뀡???놁뒿?덈떎.",
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

    // ?녾굅??videoId瑜?異붿텧?????놁쓣 寃쎌슦 ??API ?몄텧
    const { videoUrl, embedUrl } = await getYoutubeVideoUrl(Title, Artist);

    // ?몄뀡?????
    if (!req.session.songData) {
      req.session.songData = {};
    }
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
    console.error("?좏뒠釉?鍮꾨뵒??留곹겕 議고쉶 ?ㅽ뙣:", error.message);
    res.status(500).json({
      result: false,
      message: "?좏뒠釉?鍮꾨뵒??留곹겕瑜?媛?몄삤?????ㅽ뙣?덉뒿?덈떎.",
    });
  }
});

module.exports = router;
