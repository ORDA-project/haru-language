const express = require("express");
const router = express.Router();
const { readTextWithTTS } = require("../services/ttsService");

/**
 * @openapi
 * /api/tts:
 *   post:
 *     summary: Convert text into speech (TTS)
 *     tags:
 *       - TTS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Hello, how are you?"
 *               speed:
 *                 type: number
 *                 example: 1.0
 *                 description: Speaking rate (0.1 ~ 2.0, default 0.7)
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
 *                   example: "UklGRkQAAABXQVZFZm10IBAAAAABAAEA..."
 *       400:
 *         description: text missing
 *       500:
 *         description: Failed to process TTS
 */

router.post("/tts", async (req, res) => {
    try {
        // ?붿껌 蹂몃Ц?먯꽌 text? speed 異붿텧
        const { text, speed } = req.body;
        if (!text) {
            return res.status(400).json({ error: "?띿뒪?멸? ?꾩슂?⑸땲?? });
        }

        // ?띾룄 ?좏슚??寃??(0.1 ~ 2.0 踰붿쐞)
        const speakingRate = speed && speed >= 0.1 && speed <= 2.0 ? speed : 0.7;

        // TTS 泥섎━
        const audioContent = await readTextWithTTS(text, speakingRate);

        // ?묐떟?쇰줈 MP3 ?곗씠???꾩넚
        res.json({ audioContent: audioContent.toString("base64") });
    } catch (error) {
        console.error("Error in TTS route:", error);
        res.status(500).json({ error: "Failed to process TTS" });
    }
});

module.exports = router;
