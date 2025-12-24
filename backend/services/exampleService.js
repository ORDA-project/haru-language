const callGPT = require("./gptService");
const { Example, ExampleItem, Dialogue, User, UserInterest } = require("../models");

const GOAL_MAP = {
  hobby: "hobby/leisure learning",
  exam: "exam preparation",
  business: "business English",
  travel: "travel English"
};

const INTEREST_MAP = {
  conversation: "conversation",
  reading: "reading comprehension",
  grammar: "grammar analysis",
  business: "business English",
  vocabulary: "vocabulary"
};

async function generateExamples(inputSentence, userId, imageUrl = null) {
  // 사용자 정보 가져오기 (목표, 관심사)
  let user = null;
  if (userId) {
    try {
      user = await User.findOne({
        where: { id: userId },
        include: [{ model: UserInterest, attributes: ["interest"] }],
      });
    } catch (userError) {
      console.error("사용자 정보 조회 중 오류:", userError.message);
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
    "- 'context': a detailed situation description in Korean (2-3 sentences) that includes (DO NOT use ** or any markdown formatting in context): " +
    "   - Specific time, place, and setting (e.g., '아침에 친구와 함께 카페에 있을 때', '회의실에서 동료에게 말할 때'), " +
    "   - The relationship between speakers (friends, colleagues, family, etc.), " +
    "   - The emotional tone or atmosphere (casual, formal, concerned, etc.), " +
    "   - Why this conversation is happening in this context. " +
    "   - IMPORTANT: Explain BOTH Speaker A's question/statement AND Speaker B's response. " +
    "     Describe what A is asking/saying and why, AND what B is responding and why. " +
    "     For example: 'A가 ~라고 물어보는 이유는 ~이고, B가 ~라고 답하는 이유는 ~입니다.' " +
    "     Make sure to provide feedback on both sides of the conversation. " +
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
        prompt += `\n- Learning goal: ${GOAL_MAP[goal] || goal}`;
      }
      if (interests.length > 0) {
        const interestText = interests.map(i => INTEREST_MAP[i] || i).join(", ");
        prompt += `\n- Interests: ${interestText}`;
      }
      prompt += "\n\nPlease tailor the example contexts and dialogues to match the student's learning goals and interests. Create situations that are relevant to their interests when possible.";
    }
  }

  prompt += "\n\nMANDATORY: The 'examples' array MUST contain EXACTLY 3 items. " +
    "DO NOT return an empty array. DO NOT return fewer than 3 examples. " +
    "DO NOT return more than 3 examples. " +
    "If you cannot create 3 examples, you must still return 3 examples even if they are variations. " +
    "The JSON schema requires exactly 3 examples, and your response will be rejected if this requirement is not met. " +
    "\n\nReturn ONLY valid JSON matching the schema. Do not include explanations or markdown.";

  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "generated_example_response",
      schema: {
        type: "object",
        properties: {
          generatedExample: {
            type: "object",
            properties: {
              extractedSentence: { type: "string" },
              description: { type: "string" },
              examples: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    context: { type: "string" },
                    dialogue: {
                      type: "object",
                      properties: {
                        A: {
                          type: "object",
                          properties: {
                            english: { type: "string" },
                            korean: { type: "string" },
                          },
                          required: ["english", "korean"],
                        },
                        B: {
                          type: "object",
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

  // GPT API 호출 (재시도 로직은 파싱 단계에서 통합 처리)
  const callGPTWithRetry = async () => {
    return (await callGPT(
      prompt,
      `Make exactly 3 examples from: "${inputSentence}"`,
      2000,
      { responseFormat }
    ))?.trim();
  };

  let result = await callGPTWithRetry();
  if (!result) {
    throw new Error("GPT API가 빈 응답을 반환했습니다.");
  }
  console.log("GPT 원본 응답 (처음 1000자):", result.substring(0, 1000));

  // JSON 파싱 및 검증 (재시도 포함)
  const maxRetries = 3;
  let gptResponse;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      gptResponse = JSON.parse(result);
      
      // GPT 응답 구조 정규화
      if (gptResponse.examples && !gptResponse.generatedExample?.examples) {
        if (!gptResponse.generatedExample) {
          gptResponse.generatedExample = {};
        }
        gptResponse.generatedExample.examples = gptResponse.examples;
        delete gptResponse.examples;
      }
      
      if (!gptResponse.generatedExample) {
        if (gptResponse.extractedSentence || gptResponse.description || gptResponse.examples) {
          gptResponse.generatedExample = {
            extractedSentence: gptResponse.extractedSentence || inputSentence,
            description: gptResponse.description || "",
            examples: gptResponse.examples || [],
          };
          delete gptResponse.extractedSentence;
          delete gptResponse.description;
          delete gptResponse.examples;
        }
      }
      
      // 응답 구조 검증 및 정규화
      if (!gptResponse.generatedExample) {
        throw new Error("GPT 응답에 generatedExample이 없습니다");
      }
      
      gptResponse.generatedExample.extractedSentence = gptResponse.generatedExample.extractedSentence || inputSentence;
      gptResponse.generatedExample.description = gptResponse.generatedExample.description || "";
      
      if (!Array.isArray(gptResponse.generatedExample.examples)) {
        gptResponse.generatedExample.examples = [];
      }
      
      // 예문 개수 검증
      if (gptResponse.generatedExample.examples.length < 3) {
        if (attempt < maxRetries) {
          console.warn(`예문 부족 (${gptResponse.generatedExample.examples.length}개). 재시도 ${attempt + 1}/${maxRetries}...`);
          result = await callGPTWithRetry();
          if (!result) {
            throw new Error("GPT API가 빈 응답을 반환했습니다.");
          }
          continue;
        }
        console.error("GPT 응답:", JSON.stringify(gptResponse, null, 2));
        throw new Error(`예문 부족 (요구: 3개, 실제: ${gptResponse.generatedExample.examples.length}개)`);
      }
      
      // 성공
      break;
    } catch (error) {
      if (error instanceof SyntaxError && attempt < maxRetries) {
        console.error(`JSON 파싱 실패 (시도 ${attempt}/${maxRetries}):`, error.message);
        result = await callGPTWithRetry();
        if (!result) {
          throw new Error("GPT API가 빈 응답을 반환했습니다.");
        }
        continue;
      }
      throw error;
    }
  }

  // DB에 저장 (추가)
  try {
    if (gptResponse.generatedExample && userId) {
      const { extractedSentence, description, examples } = gptResponse.generatedExample;

      // 1. Example 테이블에 저장 (이미지 URL 포함)
      const images = imageUrl ? [imageUrl] : [];
      const example = await Example.create({
        user_id: userId,
        extracted_sentence: extractedSentence,
        description: description,
        images: images.length > 0 ? images : null
      });

      // 2. ExampleItem과 Dialogue 저장
      if (Array.isArray(examples) && examples.length > 0) {
        for (const exampleData of examples) {
          if (!exampleData?.context) continue;

          const exampleItem = await ExampleItem.create({
            example_id: example.id,
            context: exampleData.context
          });

          const { A, B } = exampleData.dialogue || {};
          
          if (A?.english && A?.korean) {
            await Dialogue.create({
              example_item_id: exampleItem.id,
              speaker: 'A',
              english: String(A.english),
              korean: String(A.korean)
            });
          }

          if (B?.english && B?.korean) {
            await Dialogue.create({
              example_item_id: exampleItem.id,
              speaker: 'B',
              english: String(B.english),
              korean: String(B.korean)
            });
          }
        }
      }

    }
  } catch (dbError) {
    console.error("DB 저장 중 오류:", dbError.message);
    // DB 저장 실패해도 GPT 응답은 반환
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