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
    console.error("GPT API 호출 오류:", error.message);
    if (error.response?.status === 429) {
      throw new Error("GPT API 요청 한도 초과. 잠시 후 다시 시도해주세요.");
    } else if (error.response?.status === 401) {
      throw new Error("GPT API 인증 실패. API 키를 확인해주세요.");
    } else {
      throw new Error(`GPT API 호출 실패: ${error.message}`);
    }
  }
}

module.exports = callGPT;