const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callGPT(prompt, userInput, maxTokens = 600) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userInput },
      ],
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling GPT:", error.message);
    throw new Error("GPT API 호출 실패");
  }
}

module.exports = callGPT;