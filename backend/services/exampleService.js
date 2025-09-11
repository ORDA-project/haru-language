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
    // GPT가 순수 JSON으로 응답하면 그대로 파싱
    gptResponse = JSON.parse(result);
  } catch {
    // 파싱 실패 시에도 프론트가 기대하는 동일 키로 반환
    gptResponse = {
      generatedExample: {
        extractedSentence: inputSentence,
        description: result || "",
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