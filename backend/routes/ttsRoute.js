const express = require("express");
const router = express.Router();
const { readTextWithTTS } = require("../services/ttsService");

router.post("/tts", async (req, res) => {
    try {
        // 요청 본문에서 text와 speed 추출
        const { text, speed } = req.body;
        if (!text) {
            return res.status(400).json({ error: "텍스트가 필요합니다" });
        }

        // 속도 유효성 검사 (0.1 ~ 2.0 범위)
        const speakingRate = speed && speed >= 0.1 && speed <= 2.0 ? speed : 0.7;

        // TTS 처리
        const audioContent = await readTextWithTTS(text, speakingRate);

        // 응답으로 MP3 데이터 전송
        res.json({ audioContent: audioContent.toString("base64") });
    } catch (error) {
        console.error("Error in TTS route:", error);
        res.status(500).json({ error: "Failed to process TTS" });
    }
});

module.exports = router;
