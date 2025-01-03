const { OpenAI } = require("openai");
require("dotenv").config();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GPT를 사용해 입력 문장과 유사한 학습 예제를 생성합니다.
 * 예제는 영어로, 설명은 한국어로 반환합니다.
 * @param {string} inputSentence 입력 문장
 * @returns {Promise<object[]>} 학습 예제 배열
 */
async function generateExamples(inputSentence) {
  try {
    // GPT API 요청
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that generates JSON-formatted learning examples. Each example must follow this format:\n" +
            "   - 'extractedSentence': The input sentence.\n" +
            "   - 'description': A brief explanation in Korean about the sentence.\n" +
            "   - 'examples': A list of three examples. Each example contains:\n" +
            "     - 'id': A unique identifier starting from 1.\n" +
            "     - 'context': A brief scenario or situation (in Korean).\n" +
            "     - 'dialogue': A structured conversation where A and B exchange lines. Each speaker has:\n" +
            "         - 'english': Their line in English.\n" +
            "         - 'korean': The corresponding translation in Korean.\n" +
            "Return only JSON with no additional explanations or metadata. Avoid nested 'generatedExample' objects."
        },
        {
          role: "user",
          content: `Create JSON-formatted data for the following sentence: "${inputSentence}".`,
        },
      ],
      max_tokens: 600,
    });

    // GPT 응답에서 JSON 추출 및 파싱
    const cleanedOutput = response.choices[0].message.content.replace(/```json|```/g, "").trim();
    const examples = JSON.parse(cleanedOutput);

    return examples;
  } catch (error) {
    console.error("Error generating examples:", error.message);
    throw new Error("Failed to generate examples from GPT.");
  }
}

module.exports = {
  generateExamples,
};