const express = require("express");
const { getQuotesByUserId } = require("../services/historyService");

const router = express.Router();

router.get('/quote/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const quote = await getQuotesByUserId(userId);
      res.status(200).json({
        data:quote,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


module.exports = router;