const { WritingRecord, WritingExample, WritingQuestion } = require("../models");
const callGPT = require("./gptService");

// 폴백 번역 함수 (GPT API 실패 시 사용)
function getFallbackTranslation(koreanText) {
  const translations = {
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

  return translations[koreanText] || `[Translation needed for: ${koreanText}]`;
}

// 영어→한국어 폴백 번역 함수
function getFallbackKoreanTranslation(englishText) {
  const translations = {
    "My hobby is lying at home and watching Netflix.":
      "집에 누워서 넷플릭스를 보는게 취미입니다.",
    "I went to school yesterday.": "나는 어제 학교에 갔다.",
    "The weather is nice today.": "오늘 날씨가 좋다.",
    "I am learning Korean.": "나는 한국어를 배우고 있다.",
    "Hello.": "안녕하세요.",
    "Thank you.": "감사합니다.",
    "I'm sorry.": "죄송합니다.",
    "Have a good day.": "좋은 하루 되세요.",
    "Nice to meet you.": "만나서 반갑습니다.",
    "How are you?": "어떻게 지내세요?",
  };

  return (
    translations[englishText] || `[한국어 번역이 필요합니다: ${englishText}]`
  );
}

// 영어 문장 첨삭
async function correctWriting(text, userId, writingQuestionId = null) {
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
    const correctionData = JSON.parse(response);

    // WritingRecord 테이블에 저장
    const record = await WritingRecord.create({
      user_id: userId,
      writing_question_id: writingQuestionId,
      original_text: text,
      processed_text: correctionData.correctedText,
      feedback: JSON.stringify(correctionData.feedback),
      type: "correction",
    });

    return {
      originalText: text,
      processedText: correctionData.correctedText,
      hasErrors: correctionData.hasErrors,
      feedback: correctionData.feedback,
    };
  } catch (error) {
    console.error("Error in writing correction:", error.message);
    throw new Error("Failed to correct writing.");
  }
}

// 한국어 → 영어 번역
async function translateWriting(text, userId, writingQuestionId) {
  try {
    const question = await WritingQuestion.findOne({
      where: { id: writingQuestionId },
    });
    const example = await WritingExample.findOne({
      where: { writing_question_id: writingQuestionId },
    });

    if (!question) {
      throw new Error("해당 Writing 질문을 찾을 수 없습니다.");
    }

    if (!example) {
      throw new Error("해당 질문에 대한 예시 문장이 없습니다.");
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
      console.log("GPT 원본 응답:", response);

      try {
        translationData = JSON.parse(response);
      } catch (parseError) {
        console.error("JSON 파싱 에러:", parseError);
        console.error("파싱 실패한 응답:", response);
        throw new Error("GPT 응답을 파싱할 수 없습니다.");
      }

      console.log("GPT 응답 데이터:", translationData);
      console.log("translatedText 값:", translationData?.translatedText);

      // GPT 응답 검증
      if (
        !translationData.translatedText ||
        !Array.isArray(translationData.translatedText)
      ) {
        console.error(
          "GPT 응답에 translatedText 배열이 없습니다:",
          translationData
        );
        throw new Error("GPT가 올바른 번역 데이터를 반환하지 않았습니다.");
      }
    } catch (gptError) {
      console.error("GPT API 호출 실패, 폴백 로직 사용:", gptError.message);

      // 폴백: 간단한 번역 로직
      translationData = {
        koreanSentences: [text],
        translatedText: [getFallbackTranslation(text)],
        feedback: [
          "GPT API가 일시적으로 사용할 수 없어 기본 번역을 제공합니다.",
        ],
      };

      console.log("폴백 번역 데이터:", translationData);
    }

    // 문장별로 단어 랜덤 배열 적용
    const sentencePairs = translationData.translatedText.map(
      (sentence, index) => ({
        koreanSentence: translationData.koreanSentences[index] || "",
        originalSentence: sentence,
        shuffledWords: shuffleArray(sentence.split(" ")), // 단어 단위 랜덤 배열 적용
      })
    );

    const processedText = translationData.translatedText.join(" "); // 번역된 문장을 하나의 문자열로 저장

    // WritingRecord 테이블에 저장
    const record = await WritingRecord.create({
      user_id: userId,
      writing_question_id: writingQuestionId,
      original_text: text,
      processed_text: processedText,
      feedback: JSON.stringify(translationData.feedback),
      type: "translation",
    });

    return {
      originalText: text,
      sentencePairs: sentencePairs,
      feedback: translationData.feedback,
      example: {
        korean: example.example,
        english: example.translation,
      },
    };
  } catch (error) {
    console.error("Error in writing translation:", error.message);
    throw new Error("Failed to translate writing.");
  }
}

// 배열 랜덤 섞기 함수 (Fisher-Yates Shuffle)
function shuffleArray(array) {
  const shuffled = [...array]; // 원본 배열 복사
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 영어 → 한국어 번역
async function translateEnglishToKorean(text, userId, writingQuestionId) {
  try {
    const question = await WritingQuestion.findOne({
      where: { id: writingQuestionId },
    });
    const example = await WritingExample.findOne({
      where: { writing_question_id: writingQuestionId },
    });

    if (!question) {
      throw new Error("해당 Writing 질문을 찾을 수 없습니다.");
    }

    if (!example) {
      throw new Error("해당 질문에 대한 예시 문장이 없습니다.");
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
      console.log("영어→한국어 GPT 원본 응답:", response);

      try {
        translationData = JSON.parse(response);
      } catch (parseError) {
        console.error("영어→한국어 JSON 파싱 에러:", parseError);
        console.error("파싱 실패한 응답:", response);
        throw new Error("GPT 응답을 파싱할 수 없습니다.");
      }

      console.log("영어→한국어 GPT 응답 데이터:", translationData);

      // GPT 응답 검증
      if (
        !translationData.translatedText ||
        !Array.isArray(translationData.translatedText)
      ) {
        console.error(
          "영어→한국어 GPT 응답에 translatedText 배열이 없습니다:",
          translationData
        );
        throw new Error("GPT가 올바른 번역 데이터를 반환하지 않았습니다.");
      }
    } catch (gptError) {
      console.error(
        "영어→한국어 GPT API 호출 실패, 폴백 로직 사용:",
        gptError.message
      );

      // 폴백: 간단한 번역 로직
      translationData = {
        englishSentences: [text],
        translatedText: [getFallbackKoreanTranslation(text)],
        feedback: [
          "GPT API가 일시적으로 사용할 수 없어 기본 번역을 제공합니다.",
        ],
      };

      console.log("영어→한국어 폴백 번역 데이터:", translationData);
    }

    // 문장별로 단어 랜덤 배열 적용
    const sentencePairs = translationData.translatedText.map(
      (sentence, index) => ({
        englishSentence: translationData.englishSentences[index] || "",
        originalSentence: sentence,
        shuffledWords: shuffleArray(sentence.split(" ")), // 한국어 단어 단위 랜덤 배열 적용
      })
    );

    const processedText = translationData.translatedText.join(" "); // 번역된 문장을 하나의 문자열로 저장

    // WritingRecord 테이블에 저장
    const record = await WritingRecord.create({
      user_id: userId,
      writing_question_id: writingQuestionId,
      original_text: text,
      processed_text: processedText,
      feedback: JSON.stringify(translationData.feedback),
      type: "english_to_korean",
    });

    return {
      originalText: text,
      sentencePairs: sentencePairs,
      feedback: translationData.feedback,
      example: {
        korean: example.example,
        english: example.translation,
      },
    };
  } catch (error) {
    console.error("Error in English to Korean translation:", error.message);
    throw new Error("Failed to translate from English to Korean.");
  }
}

module.exports = { correctWriting, translateWriting, translateEnglishToKorean };
