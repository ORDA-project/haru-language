const express = require("express");
const router = express.Router();
const { readTextWithTTS } = require("../services/ttsService");

/**
 * @openapi
 * /api/tts:
 *   post:
 *     summary: Convert text into speech (TTS)
 *     description: 입력된 텍스트를 Google Cloud Text-to-Speech API로 음성으로 변환합니다.
 *     tags:
 *       - TTS
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
 *                 example: "Hello, how are you?"
 *               speed:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 2.0
 *                 description: Speaking rate (default 0.7)
 *                 example: 1.0
 *     responses:
 *       200:
 *         description: Base64-encoded MP3 audio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audioContent:
 *                   type: string
 *                   format: base64
 *                   example: "UklGRkQAAABXQVZFZm10IBAAAAABAAEA..."
 *       400:
 *         description: text missing
 *       500:
 *         description: Failed to process TTS
 */
router.post("/tts", async (req, res) => {
  try {
    const { text, speed } = req.body;
    if (!text) {
      return res.status(400).json({ error: "텍스트가 필요합니다" });
    }

    const speakingRate = speed && speed >= 0.1 && speed <= 2.0 ? speed : 0.7;
    const audioContent = await readTextWithTTS(text, speakingRate);
    res.json({ audioContent: audioContent.toString("base64") });
  } catch (error) {
    console.error("Error in TTS route:", error);
    res.status(500).json({ error: "Failed to process TTS" });
  }
});

module.exports = router;

