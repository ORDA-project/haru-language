const express = require("express");
const { recommendQuote } = require("../services/gptService");

const router = express.Router();

router.get('/quote/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const quote = await recommendQuote(userId);
      res.status(200).json(quote);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


module.exports = router;