const callGPT = require("./gptService");

async function generateExamples(inputSentence) {
  // 원하는 출력 스키마를 강하게 고정
  const prompt =
    "You are an AI assistant that returns ONLY JSON (no prose, no markdown). " +
    'Output schema EXACTLY as: { "generatedExample": { "extractedSentence": string, "description": string, "examples": [ { "id": number, "context": string, "dialogue": { "A": { "english": string, "korean": string }, "B": { "english": string, "korean": string } } } ] } } ' +
    "All fields must be present. Do not include comments or extra keys.";

  const result = (await callGPT(
    prompt,
    `Make examples from: "${inputSentence}"`,
    700 // 필요하면 토큰 여유
  ))?.trim();

  try {
    // GPT가 순수 JSON으로 응답하면 그대로 파싱
    return JSON.parse(result);
  } catch {
    // 파싱 실패 시에도 프론트가 기대하는 동일 키로 반환
    return {
      generatedExample: {
        extractedSentence: inputSentence,
        description: result || "",
        examples: [],
      },
    };
  }
}

module.exports = generateExamples;
