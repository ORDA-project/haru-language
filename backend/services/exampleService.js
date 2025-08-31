const callGPT = require("./gptService");

async function generateExamples(inputSentence) {
  const prompt =
    "You are an AI assistant specializing in generating high-quality learning examples. " +
    "Respond strictly in JSON format only, no extra text. " +
    'Schema: { "example": string }';

  const result = (await callGPT(prompt, `Create JSON-formatted data for: "${inputSentence}"`))?.trim();

  try {
    return JSON.parse(result);
  } catch {
    // 파싱 실패 시 원문을 그대로 담아주기
    return { example: result };
  }
}

module.exports = generateExamples;
