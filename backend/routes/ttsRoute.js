const express = require("express");
const router = express.Router();
const { readTextWithTTS } = require("../services/ttsService");

router.post("/tts", async (req, res) => {
    try {
        // 요청 본문에서 text 추출
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        // TTS 처리
        const audioContent = await readTextWithTTS(text);

        // 응답으로 MP3 데이터 전송
        res.json({ audioContent: audioContent.toString("base64") });
    } catch (error) {
        console.error("Error in TTS route:", error);
        res.status(500).json({ error: "Failed to process TTS" });
    }
});

module.exports = router;
