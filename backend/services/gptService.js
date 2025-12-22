const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callGPT(prompt, userInput, maxTokens = 600, options = {}) {
  // API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    console.error("GPT API 키가 설정되지 않았습니다.");
    throw new Error("GPT API 설정 오류");
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

    if (!response.choices || response.choices.length === 0) {
      throw new Error("GPT API가 빈 응답을 반환했습니다.");
    }

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("GPT API 응답에 메시지 내용이 없습니다.");
    }

    const result = messageContent.trim();
    if (!result) {
      throw new Error("GPT API가 빈 메시지를 반환했습니다.");
    }

    return result;
  } catch (error) {
    // 에러 로그 출력 (서버 로그에만 기록)
    console.error("GPT API 호출 실패:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    
    // 프로덕션에서는 일반적인 에러 메시지만 반환
    if (error.status === 429) {
      throw new Error("GPT API 요청 한도 초과");
    }
    if (error.status === 401) {
      throw new Error("GPT API 인증 실패");
    }
    if (error.code === 'insufficient_quota') {
      throw new Error("GPT API 사용량 한도 초과");
    }

    throw new Error("GPT API 호출 실패");
  }
}

module.exports = callGPT;
