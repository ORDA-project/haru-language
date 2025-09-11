const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { detectText } = require("../services/ocrService");
const generateExamples = require("../services/exampleService");
const { getExamplesByUserId } = require("../services/historyService");
const { User } = require("../models");
require("dotenv").config({ path: "../.env" });

const router = express.Router();

// Multer ?ㅼ젙 (?뚯씪 ?낅줈??
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB ?쒗븳
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

/**
 * @openapi
 * /example:
 *   post:
 *     summary: Generate examples from uploaded image using OCR and GPT
 *     tags:
 *       - Example
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to process
 *     responses:
 *       200:
 *         description: Examples generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 extractedText:
 *                   type: string
 *                   example: "Hello world"
 *                 generatedExample:
 *                   type: object
 *                   description: GPT-generated examples
 *       400:
 *         description: User not logged in or invalid file
 *       500:
 *         description: Error processing image or generating examples
 */
router.post("/", upload.single("image"), async (req, res) => {
  console.log("File uploaded:", req.file);
  const filePath = req.file.path;
  const sessionUser = req.session.user;

  if (!sessionUser?.userId) {
    return res.status(400).json({ message: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" });
  }

  try {
    // Step 1: OCR 泥섎━
    const extractedText = await detectText(filePath);

    // Step 2: GPT API濡??덈Ц ?앹꽦 (?몄뀡??userId瑜?吏곸젒 ?ъ슜)
    const gptResponse = await generateExamples(extractedText, sessionUser.userId);

    // ?낅줈?쒕맂 ?뚯씪 ??젣
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Failed to delete temp file:', err);
    }
    res.send({
      extractedText,
      generatedExample: gptResponse,
    });
  } catch (error) {
    console.error("Error generating examples:", error);

    // ?뚯씪 ??젣
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('Failed to delete temp file in error handler:', err);
      }
    }
    res.status(500).send({ message: "Error generating examples", error });
  }
});

/**
 * @openapi
 * /example/{userId}:
 *   get:
 *     summary: Get examples by user ID (uses social_id)
 *     tags:
 *       - Example
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: "test123"
 *         description: User's social_id
 *     responses:
 *       200:
 *         description: Examples retrieved successfully
 *       404:
 *         description: No examples found for this user
 *       500:
 *         description: Server error
 */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;  // social_id媛 ?ㅼ뼱??

  try {
    // social_id濡??ㅼ젣 user 李얘린
    const user = await User.findOne({ where: { social_id: userId } });
    if (!user) {
      return res.status(404).json({ message: "?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎." });
    }

    // ?ㅼ젣 DB id濡??덈Ц 議고쉶
    const examples = await getExamplesByUserId(user.id);

    // examples媛 null?닿굅??undefined?????덉쑝誘濡??덉쟾?섍쾶 泥섎━
    const safeExamples = examples || [];

    if (!safeExamples.length) {
      return res.status(200).json({
        message: "?대떦 ?좎????덈Ц???놁뒿?덈떎.",
        data: []  // 鍮?諛곗뿴 諛섑솚
      });
    }

    res.status(200).json({
      message: "?덈Ц 議고쉶 ?깃났",
      data: safeExamples,
    });
  } catch (error) {
    console.error("?덈Ц 議고쉶 API ?ㅻ쪟:", error.message);
    res.status(500).json({
      message: "?덈Ц 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
      error: error.message,
    });
  }
});

module.exports = router;
