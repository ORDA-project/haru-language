const express = require("express");
const { getAnswer } = require("../services/gptService");
require("dotenv").config({ path: "../.env" });

const router = express.Router();


router.post("/", async (req, res) => {
  const question = req.body.question;

  try {
 
    const gptResponse = await getAnswer(question);

    res.send({
      answer: gptResponse,
    });

  } catch (error) {
    console.error("Error generating answer:", error);
    res.status(500).send({ message: "Error generating answer", error });
  }
});

module.exports = router;