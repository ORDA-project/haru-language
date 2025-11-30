const { WritingRecord, WritingExample, WritingQuestion } = require("../models");
const callGPT = require("./gptService");
const { Op } = require("sequelize");

const FALLBACK_TRANSLATIONS = {
  "집에 누워서 넷플릭스를 보는게 취미입니다":
    "My hobby is lying at home and watching Netflix.",
  "나는 어제 학교에 갔다": "I went to school yesterday.",
  "오늘 날씨가 좋다": "The weather is nice today.",
  "나는 한국어를 배우고 있다": "I am learning Korean.",
  안녕하세요: "Hello.",
  감사합니다: "Thank you.",
  죄송합니다: "I'm sorry.",
  "좋은 하루 되세요": "Have a good day.",
  "만나서 반갑습니다": "Nice to meet you.",
  "어떻게 지내세요": "How are you?",
};

const FALLBACK_KO_TRANSLATIONS = Object.fromEntries(
  Object.entries(FALLBACK_TRANSLATIONS).map(([ko, en]) => [en, `${ko}.`])
);

function getFallbackTranslation(koreanText) {
  return FALLBACK_TRANSLATIONS[koreanText] || `[Translation needed for: ${koreanText}]`;
}

function getFallbackKoreanTranslation(englishText) {
  return (
    FALLBACK_KO_TRANSLATIONS[englishText] ||
    `[한국어 번역이 필요합니다: ${englishText}]`
  );
}

async function correctWriting(text, userId, writingQuestionId = null) {
  // 입력 검증
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("BAD_REQUEST: text는 필수이며 비어있을 수 없습니다.");
  }
  if (text.length > 5000) {
    throw new Error("BAD_REQUEST: text는 최대 5000자까지 입력 가능합니다.");
  }
  if (!userId) {
    throw new Error("BAD_REQUEST: userId는 필수입니다.");
  }
  if (writingQuestionId !== null && (!Number.isInteger(writingQuestionId) || writingQuestionId <= 0)) {
    throw new Error("BAD_REQUEST: writingQuestionId는 양의 정수여야 합니다.");
  }

  try {
    const prompt =
      "You are an AI English tutor that provides grammar correction and writing feedback. " +
      "When given a text, return a JSON object with the following:\n\n" +
      "- 'correctedText': The grammatically corrected version of the input text.\n" +
      "- 'hasErrors': Whether the original text contains grammatical errors (true or false).\n" +
      "- 'feedback': A JSON array of explanations in Korean about corrections made, where each item is a separate explanation sentence.\n\n" +
      "If there are no errors, return 'hasErrors': false and an empty 'feedback' array.\n" +
      "Provide only the JSON output.";

    const response = await callGPT(
      prompt,
      `Please correct and provide feedback for: "${text}"`,
      500
    );

    let correctionData;
    try {
      correctionData = JSON.parse(response);
      if (
        !correctionData.correctedText ||
        typeof correctionData.hasErrors !== "boolean" ||
        !Array.isArray(correctionData.feedback)
      ) {
        throw new Error("GPT 응답 형식이 올바르지 않습니다");
      }
    } catch (parseError) {
      console.warn("GPT 응답 파싱 실패:", parseError.message);
      correctionData = {
        correctedText: text,
        hasErrors: false,
        feedback: ["첨삭 처리 중 오류가 발생했습니다."],
      };
    }

    await WritingRecord.create({
      user_id: userId,
      writing_question_id: writingQuestionId,
      original_text: text.trim(),
      processed_text: correctionData.correctedText,
      feedback: JSON.stringify(correctionData.feedback),
      type: "correction",
    });

    return {
      originalText: text.trim(),
      processedText: correctionData.correctedText,
      hasErrors: correctionData.hasErrors,
      feedback: correctionData.feedback,
    };
  } catch (error) {
    // 이미 표준화된 에러는 그대로 전달
    if (error.message?.includes("BAD_REQUEST") || error.message?.includes("NOT_FOUND")) {
      throw error;
    }
    console.error("문장 첨삭 오류:", error.message);
    throw new Error("문장 첨삭에 실패했습니다.");
  }
}

async function translateWriting(text, userId, writingQuestionId) {
  // 입력 검증
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("BAD_REQUEST: text는 필수이며 비어있을 수 없습니다.");
  }
  if (text.length > 5000) {
    throw new Error("BAD_REQUEST: text는 최대 5000자까지 입력 가능합니다.");
  }
  if (!userId) {
    throw new Error("BAD_REQUEST: userId는 필수입니다.");
  }
  if (!writingQuestionId || !Number.isInteger(writingQuestionId) || writingQuestionId <= 0) {
    throw new Error("BAD_REQUEST: writingQuestionId는 양의 정수여야 합니다.");
  }

  try {
    const question = await WritingQuestion.findOne({ where: { id: writingQuestionId } });
    const example = await WritingExample.findOne({
      where: { writing_question_id: writingQuestionId },
    });

    if (!question) {
      throw new Error("NOT_FOUND: 해당 Writing 질문을 찾을 수 없습니다.");
    }
    if (!example) {
      throw new Error("NOT_FOUND: 해당 질문에 대한 예시 문장이 없습니다.");
    }

    const prompt =
      "You are an AI English tutor that helps users express ideas in English naturally.\n" +
      "The user has written a response to a specific question. Your job is to provide an English translation " +
      "that is both natural and grammatically correct. Additionally, provide an explanation of key phrases in Korean.\n\n" +
      "**Question:**\n" +
      `"${question.question_text}"\n\n` +
      "**Example Response:**\n" +
      `Korean: "${example.example}"\n` +
      `English Translation: "${example.translation}"\n\n` +
      "**User's Input:**\n" +
      `Korean: "${text}"\n\n` +
      "Return a JSON object with:\n" +
      "- 'koreanSentences': The original Korean text split into sentences as an array, where each sentence is a separate element.\n" +
      "- 'translatedText': The translated English sentences as an array, where each sentence is a separate element (must match the number of Korean sentences).\n" +
      "- 'feedback': A JSON array of explanations in Korean about key phrases and grammar points, where each item is a separate explanation sentence.\n\n" +
      "Provide only the JSON output.";

    let translationData;
    try {
      const response = await callGPT(prompt, text, 600);
      translationData = JSON.parse(response);
      if (
        !translationData.translatedText ||
        !Array.isArray(translationData.translatedText) ||
        !Array.isArray(translationData.feedback)
      ) {
        throw new Error("GPT 응답 형식이 올바르지 않습니다");
      }
    } catch (gptError) {
      console.error("GPT API 호출 실패, 폴백 로직 사용:", gptError.message);
      translationData = {
        koreanSentences: [text],
        translatedText: [getFallbackTranslation(text)],
        feedback: [
          "GPT API가 일시적으로 사용할 수 없어 기본 번역을 제공합니다.",
        ],
      };
    }

    const sentencePairs = translationData.translatedText.map(
      (sentence, index) => ({
        koreanSentence: translationData.koreanSentences?.[index] || "",
        originalSentence: sentence,
        shuffledWords: shuffleArray(sentence.split(" ")),
      })
    );

    const processedText = translationData.translatedText.join(" ");

    await WritingRecord.create({
      user_id: userId,
      writing_question_id: writingQuestionId,
      original_text: text.trim(),
      processed_text: processedText,
      feedback: JSON.stringify(translationData.feedback),
      type: "translation",
    });

    return {
      originalText: text.trim(),
      sentencePairs,
      feedback: translationData.feedback,
      example: {
        korean: example.example,
        english: example.translation,
      },
    };
  } catch (error) {
    // 이미 표준화된 에러는 그대로 전달
    if (error.message?.includes("BAD_REQUEST") || error.message?.includes("NOT_FOUND")) {
      throw error;
    }
    console.error("번역 처리 오류:", error.message);
    throw new Error("번역에 실패했습니다.");
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function translateEnglishToKorean(text, userId, writingQuestionId) {
  // 입력 검증
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("BAD_REQUEST: text는 필수이며 비어있을 수 없습니다.");
  }
  if (text.length > 5000) {
    throw new Error("BAD_REQUEST: text는 최대 5000자까지 입력 가능합니다.");
  }
  if (!userId) {
    throw new Error("BAD_REQUEST: userId는 필수입니다.");
  }
  if (!writingQuestionId || !Number.isInteger(writingQuestionId) || writingQuestionId <= 0) {
    throw new Error("BAD_REQUEST: writingQuestionId는 양의 정수여야 합니다.");
  }

  try {
    const question = await WritingQuestion.findOne({ where: { id: writingQuestionId } });
    const example = await WritingExample.findOne({
      where: { writing_question_id: writingQuestionId },
    });

    if (!question) {
      throw new Error("NOT_FOUND: 해당 Writing 질문을 찾을 수 없습니다.");
    }
    if (!example) {
      throw new Error("NOT_FOUND: 해당 질문에 대한 예시 문장이 없습니다.");
    }

    const prompt =
      "You are an AI Korean tutor that helps users express ideas in Korean naturally.\n" +
      "The user has written a response in English to a specific question. Your job is to provide a Korean translation " +
      "that is both natural and grammatically correct. Additionally, provide an explanation of key phrases in Korean.\n\n" +
      "**Question:**\n" +
      `"${question.question_text}"\n\n` +
      "**Example Response:**\n" +
      `English: "${example.translation}"\n` +
      `Korean Translation: "${example.example}"\n\n` +
      "**User's Input:**\n" +
      `English: "${text}"\n\n` +
      "Return a JSON object with:\n" +
      "- 'englishSentences': The original English text split into sentences as an array, where each sentence is a separate element.\n" +
      "- 'translatedText': The translated Korean sentences as an array, where each sentence is a separate element (must match the number of English sentences).\n" +
      "- 'feedback': A JSON array of explanations in Korean about key phrases and grammar points, where each item is a separate explanation sentence.\n\n" +
      "Provide only the JSON output.";

    let translationData;
    try {
      const response = await callGPT(prompt, text, 600);
      translationData = JSON.parse(response);
      if (
        !translationData.translatedText ||
        !Array.isArray(translationData.translatedText)
      ) {
        throw new Error("GPT가 올바른 번역 데이터를 반환하지 않았습니다.");
      }
    } catch (gptError) {
      console.error(
        "영어→한국어 GPT API 호출 실패, 폴백 로직 사용:",
        gptError.message
      );
      translationData = {
        englishSentences: [text],
        translatedText: [getFallbackKoreanTranslation(text)],
        feedback: [
          "GPT API가 일시적으로 사용할 수 없어 기본 번역을 제공합니다.",
        ],
      };
    }

    const sentencePairs = translationData.translatedText.map(
      (sentence, index) => ({
        englishSentence: translationData.englishSentences?.[index] || "",
        originalSentence: sentence,
        shuffledWords: shuffleArray(sentence.split(" ")),
      })
    );

    const processedText = translationData.translatedText.join(" ");

    await WritingRecord.create({
      user_id: userId,
      writing_question_id: writingQuestionId,
      original_text: text.trim(),
      processed_text: processedText,
      feedback: JSON.stringify(translationData.feedback),
      type: "english_to_korean",
    });

    return {
      originalText: text.trim(),
      sentencePairs,
      feedback: translationData.feedback,
      example: {
        korean: example.example,
        english: example.translation,
      },
    };
  } catch (error) {
    // 이미 표준화된 에러는 그대로 전달
    if (error.message?.includes("BAD_REQUEST") || error.message?.includes("NOT_FOUND")) {
      throw error;
    }
    console.error("영어→한국어 번역 오류:", error.message);
    throw new Error("영어 문장을 한국어로 번역하지 못했습니다.");
  }
}

// 기록 조회 함수들
async function getWritingRecords(userId, writingQuestionId = null) {
  if (!userId) {
    throw new Error("BAD_REQUEST: userId는 필수입니다.");
  }

  try {
    const where = { user_id: userId };
    if (writingQuestionId !== null) {
      if (!Number.isInteger(writingQuestionId) || writingQuestionId <= 0) {
        throw new Error("BAD_REQUEST: writingQuestionId는 양의 정수여야 합니다.");
      }
      where.writing_question_id = writingQuestionId;
    }

    const records = await WritingRecord.findAll({
      where,
      attributes: ["id", "user_id", "writing_question_id", "original_text", "processed_text", "feedback", "type", "created_at"],
      order: [["created_at", "DESC"]],
    });

    // feedback을 JSON 문자열에서 배열로 변환
    return records.map((record) => ({
      ...record.toJSON(),
      feedback: record.feedback ? JSON.parse(record.feedback) : [],
    }));
  } catch (error) {
    if (error.message?.includes("BAD_REQUEST")) {
      throw error;
    }
    console.error("기록 조회 오류:", error.message);
    throw new Error("기록 조회에 실패했습니다.");
  }
}

module.exports = { 
  correctWriting, 
  translateWriting, 
  translateEnglishToKorean,
  getWritingRecords,
};

