const callGPT = require("./gptService");
const { Example, ExampleItem, Dialogue, User, UserInterest } = require("../models");

async function generateExamples(inputSentence, userId) {
  // 사용자 정보 가져오기 (목표, 관심사)
  let user = null;
  if (userId) {
    try {
      user = await User.findOne({
        where: { id: userId },
        include: [
          {
            model: UserInterest,
            attributes: ["interest"],
          },
        ],
      });
    } catch (userError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("사용자 정보 조회 중 오류:", userError.message);
      }
      // 사용자 정보 조회 실패해도 예문 생성은 계속 진행
    }
  }

  // 원하는 출력 스키마를 강하게 고정
  let prompt =
    "You are an AI assistant that creates English learning examples from sentences. " +
    "You MUST return a JSON object with a 'generatedExample' object containing: " +
    "1. 'extractedSentence': the input sentence, " +
    "2. 'description': a detailed, practical explanation in Korean (2-3 sentences) that explains: " +
    "   - When and in what situations this sentence/expression is actually used in real life, " +
    "   - What context or circumstances make it appropriate, " +
    "   - How native speakers typically use it, " +
    "   - Why someone would say this (the purpose or intent behind it). " +
    "   Make it practical and relatable, like '이 표현은 ~할 때 쓰는 거예요' or '현지에서는 ~한 상황에서 자주 사용해요'. " +
    "   IMPORTANT: Wrap key phrases (like specific situations, times, places, or important concepts) with double asterisks **like this** to indicate they should be underlined. " +
    "3. 'examples': an array of exactly 3 examples. " +
    "Each example must have: " +
    "- 'id': an integer (1, 2, 3), " +
    "- 'context': a detailed situation description in Korean (1-2 sentences) that includes (DO NOT use ** or any markdown formatting in context): " +
    "   - Specific time, place, and setting (e.g., '아침에 친구와 함께 카페에 있을 때', '회의실에서 동료에게 말할 때'), " +
    "   - The relationship between speakers (friends, colleagues, family, etc.), " +
    "   - The emotional tone or atmosphere (casual, formal, concerned, etc.), " +
    "   - Why this conversation is happening in this context. " +
    "- 'dialogue': an object with 'A' and 'B' properties. " +
    "Each dialogue speaker (A and B) must be an object with 'english' and 'korean' string properties. " +
    "Example dialogue format: { 'A': { 'english': 'Hello', 'korean': '안녕' }, 'B': { 'english': 'Hi', 'korean': '안녕' } } " +
    "\n\nCRITICAL REQUIREMENTS FOR DIVERSITY: " +
    "You must create exactly 3 COMPLETELY DIFFERENT examples. Each example MUST vary significantly: " +
    "- Different questions/expressions (Speaker A): For each example, use DIFFERENT but related expressions to the input sentence. " +
    "  For example, if the input is 'How do you feel today?', create variations like: " +
    "  Example 1: 'How are you feeling today?' " +
    "  Example 2: 'What's your mood like?' " +
    "  Example 3: 'How's your day going?' " +
    "  Each question should be semantically related but use different wording and structure. " +
    "- Different responses (Speaker B): Each response should be unique and appropriate to its specific question. " +
    "- Different subjects (different people, characters, or entities) " +
    "- Different time settings (morning, afternoon, evening, different days, seasons, etc.) " +
    "- Different vocabulary and expressions (use different words, phrases, and sentence structures) " +
    "- Different contexts and situations (completely different scenarios, locations, or circumstances) " +
    "- Different dialogue patterns (vary the conversation flow, question types, response styles) " +
    "Do NOT use the same question/expression for all examples. Do NOT simply rephrase the same content. " +
    "Each example should feel like a unique, independent conversation with its own question and response. " +
    "The three examples should cover different ways to express similar meanings, showing various natural ways to ask and respond. ";

  // 사용자 맞춤 프롬프트 추가
  if (user) {
    const interests = user.UserInterests?.map((i) => i.interest) || [];
    const goal = user.goal;
    
    if (interests.length > 0 || goal) {
      prompt += "\n\nStudent's learning context:";
      
      if (goal) {
        const goalMap = {
          hobby: "hobby/leisure learning",
          exam: "exam preparation",
          business: "business English",
          travel: "travel English"
        };
        prompt += `\n- Learning goal: ${goalMap[goal] || goal}`;
      }
      
      if (interests.length > 0) {
        const interestMap = {
          conversation: "conversation",
          reading: "reading comprehension",
          grammar: "grammar analysis",
          business: "business English",
          vocabulary: "vocabulary"
        };
        const interestText = interests.map(i => interestMap[i] || i).join(", ");
        prompt += `\n- Interests: ${interestText}`;
      }
      
      prompt += "\n\nPlease tailor the example contexts and dialogues to match the student's learning goals and interests. Create situations that are relevant to their interests when possible.";
    }
  }

  prompt += "\nReturn ONLY valid JSON matching the schema. Do not include explanations or markdown.";

  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "generated_example_response",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          generatedExample: {
            type: "object",
            additionalProperties: false,
            properties: {
              extractedSentence: { type: "string" },
              description: { type: "string" },
              examples: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "integer" },
                    context: { type: "string" },
                    dialogue: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        A: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            english: { type: "string" },
                            korean: { type: "string" },
                          },
                          required: ["english", "korean"],
                        },
                        B: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            english: { type: "string" },
                            korean: { type: "string" },
                          },
                          required: ["english", "korean"],
                        },
                      },
                      required: ["A", "B"],
                    },
                  },
                  required: ["id", "context", "dialogue"],
                },
              },
            },
            required: ["extractedSentence", "description", "examples"],
          },
        },
        required: ["generatedExample"],
      },
    },
  };

  let result;
  try {
    result = (await callGPT(
      prompt,
      `Make exactly 3 examples from: "${inputSentence}"`,
      1200, // 3개 예문 생성에 충분한 토큰
      { responseFormat }
    ))?.trim();
    
    if (!result) {
      throw new Error("GPT API가 빈 응답을 반환했습니다.");
    }
  } catch (gptError) {
    // 에러 로그 출력 (서버 로그에만 기록)
    console.error("GPT API 호출 중 오류:", gptError.message);
    throw gptError;
  }

  let gptResponse;
  try {
    gptResponse = JSON.parse(result);
    // 응답 구조 검증
    if (!gptResponse.generatedExample || !gptResponse.generatedExample.extractedSentence) {
      throw new Error("GPT 응답 형식이 올바르지 않습니다");
    }
    
    // examples 배열 검증 (3개 필수)
    if (!gptResponse.generatedExample.examples || !Array.isArray(gptResponse.generatedExample.examples) || gptResponse.generatedExample.examples.length < 3) {
      console.error(`GPT 응답에 예문이 부족합니다. (요구: 3개, 실제: ${gptResponse.generatedExample.examples?.length || 0}개)`);
      throw new Error("GPT 응답에 예문이 부족합니다");
    }
  } catch (parseError) {
    // 에러 로그 출력 (서버 로그에만 기록)
    console.error("GPT 응답 파싱 실패:", parseError.message);
    throw new Error("GPT 응답 처리 실패");
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
      if (examples && Array.isArray(examples) && examples.length > 0) {
        for (const exampleData of examples) {
          if (!exampleData || !exampleData.context) {
            continue; // 유효하지 않은 데이터는 건너뛰기
          }

          // ExampleItem 저장
          const exampleItem = await ExampleItem.create({
            example_id: example.id,
            context: exampleData.context || ""
          });

          // Dialogue 저장
          if (exampleData.dialogue && typeof exampleData.dialogue === "object") {
            const { A, B } = exampleData.dialogue;
            
            if (A && typeof A === "object" && A.english && A.korean) {
              await Dialogue.create({
                example_item_id: exampleItem.id,
                speaker: 'A',
                english: String(A.english || ""),
                korean: String(A.korean || "")
              });
            }

            if (B && typeof B === "object" && B.english && B.korean) {
              await Dialogue.create({
                example_item_id: exampleItem.id,
                speaker: 'B',
                english: String(B.english || ""),
                korean: String(B.korean || "")
              });
            }
          }
        }
      }

    }
  } catch (dbError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("DB 저장 중 오류:", dbError.message);
    }
    // DB 저장 실패해도 GPT 응답은 반환
  }

  // 최종 응답 검증 (3개 필수)
  if (!gptResponse.generatedExample?.examples || gptResponse.generatedExample.examples.length < 3) {
    throw new Error("GPT 응답에 예문이 부족합니다");
  }
  
  // 예문이 3개보다 많으면 처음 3개만 사용
  if (gptResponse.generatedExample.examples.length > 3) {
    gptResponse.generatedExample.examples = gptResponse.generatedExample.examples.slice(0, 3);
  }

  return gptResponse;
}

async function deleteExample(userId, exampleId) {
  if (!userId) {
    throw new Error("BAD_REQUEST: userId는 필수입니다.");
  }
  if (!exampleId || !Number.isInteger(exampleId) || exampleId <= 0) {
    throw new Error("BAD_REQUEST: 유효하지 않은 exampleId입니다.");
  }

  try {
    const example = await Example.findOne({
      where: { id: exampleId, user_id: userId },
    });

    if (!example) {
      throw new Error("NOT_FOUND: 해당 예문을 찾을 수 없거나 삭제 권한이 없습니다.");
    }

    await example.destroy();
    return { message: "예문 기록이 삭제되었습니다." };
  } catch (error) {
    console.error("예문 삭제 중 오류:", error.message);
    throw error;
  }
}

module.exports = generateExamples;
module.exports.deleteExample = deleteExample;