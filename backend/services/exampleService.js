const callGPT = require("./gptService");
const { Example, ExampleItem, Dialogue } = require("../models");

async function generateExamples(inputSentence, userId) {
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

  let gptResponse;
  try {
    gptResponse = JSON.parse(result);
    // 응답 구조 검증
    if (!gptResponse.generatedExample || !gptResponse.generatedExample.extractedSentence) {
      throw new Error("GPT 응답 형식이 올바르지 않습니다");
    }
  } catch (parseError) {
    console.warn("GPT 응답 파싱 실패:", parseError.message);
    gptResponse = {
      generatedExample: {
        extractedSentence: inputSentence,
        description: result || "예문 생성 중 오류가 발생했습니다.",
        examples: [],
      },
    };
  }

  // DB에 저장 (추가)
  try {
    if (gptResponse.generatedExample && userId) {
      const { extractedSentence, description, examples } = gptResponse.generatedExample;

      // 1. Example 테이블에 저장
      const example = await Example.create({
        user_id: userId,
        extracted_sentence: extractedSentence,
        description: description
      });

      // 2. ExampleItem과 Dialogue 저장
      if (examples && examples.length > 0) {
        for (const exampleData of examples) {
          // ExampleItem 저장
          const exampleItem = await ExampleItem.create({
            example_id: example.id,
            context: exampleData.context
          });

          // Dialogue 저장
          if (exampleData.dialogue) {
            const { A, B } = exampleData.dialogue;
            
            if (A) {
              await Dialogue.create({
                example_item_id: exampleItem.id,
                speaker: 'A',
                english: A.english,
                korean: A.korean
              });
            }

            if (B) {
              await Dialogue.create({
                example_item_id: exampleItem.id,
                speaker: 'B',
                english: B.english,
                korean: B.korean
              });
            }
          }
        }
      }

      console.log(`예문이 DB에 저장되었습니다. Example ID: ${example.id}`);
    }
  } catch (dbError) {
    console.error("DB 저장 중 오류:", dbError);
    // DB 저장 실패해도 GPT 응답은 반환
  }

  return gptResponse;
}

module.exports = generateExamples;