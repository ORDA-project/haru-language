const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callGPT(prompt, userInput, maxTokens = 600, options = {}) {
  // API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("GPT API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.");
  }

  try {
    const { responseFormat } = options;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userInput },
      ],
      max_tokens: maxTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });

    const result = response.choices[0].message.content.trim();
    return result;
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production";
    
    if (!isProduction) {
      console.error("GPT API 호출 실패:", error.message);
      if (error.code) console.error("에러 코드:", error.code);
      if (error.status) console.error("에러 상태:", error.status);
    }
    
    if (error.status === 429) {
      throw new Error("GPT API 요청 한도 초과. 잠시 후 다시 시도해주세요.");
    }
    if (error.status === 401) {
      throw new Error("GPT API 인증 실패. API 키를 확인해주세요.");
    }
    if (error.code === 'insufficient_quota') {
      throw new Error("GPT API 사용량 한도를 초과했습니다. 결제 정보를 확인해주세요.");
    }

    throw new Error(`GPT API 호출 실패: ${error.message}`);
  }
}

module.exports = callGPT;
