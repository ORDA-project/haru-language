const express = require("express");
const router = express.Router();
const { readTextWithTTS } = require("../services/ttsService");

/**
 * @swagger
 * /api/tts:
 *   post:
 *     summary: 텍스트를 음성으로 변환 (TTS)
 *     description: 입력된 텍스트를 Google Cloud Text-to-Speech API를 사용하여 음성으로 변환합니다
 *     tags: [TTS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: "음성으로 변환할 텍스트"
 *                 example: "안녕하세요, 반갑습니다."
 *               speed:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 2.0
 *                 description: "음성 속도 (기본값: 0.7)"
 *                 example: 1.0
 *     responses:
 *       200:
 *         description: "TTS 변환 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audioContent:
 *                   type: string
 *                   format: base64
 *                   description: "Base64로 인코딩된 MP3 오디오 데이터"
 *       400:
 *         description: "텍스트가 필요함"
 *       500:
 *         description: "TTS 처리 실패"
 */
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
