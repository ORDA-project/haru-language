const { WritingRecord, WritingExample, WritingQuestion } = require("../models");
const callGPT = require("./gptService");

/**
 * ✏️ [1] 영어 문장 첨삭 (Grammar Correction + WritingRecord 저장)
 */
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

    const response = await callGPT(prompt, `Please correct and provide feedback for: "${text}"`, 500);
    const correctionData = JSON.parse(response);

    // WritingRecord 테이블에 저장
    const record = await WritingRecord.create({
      user_id: userId,
      writing_question_id: writingQuestionId,
      original_text: text,
      processed_text: correctionData.correctedText,
      feedback: JSON.stringify(correctionData.feedback), // 배열을 JSON 문자열로 변환하여 저장
      type: "correction",
    });

    return {
      originalText: text,
      processedText: correctionData.correctedText,
      hasErrors: correctionData.hasErrors,
      feedback: correctionData.feedback, // 배열 형태 그대로 반환
    };
  } catch (error) {
    console.error("Error in writing correction:", error.message);
    throw new Error("Failed to correct writing.");
  }
}


/**
 * 🌎 [2] 한국어 → 영어 번역 & WritingRecord 저장
 */
async function translateWriting(text, userId, writingQuestionId) {
  try {
    // WritingQuestion 테이블에서 질문 가져오기
    const question = await WritingQuestion.findOne({ where: { id: writingQuestionId } });
    const example = await WritingExample.findOne({ where: { question_id: writingQuestionId } });

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
      `Korean: "${example.original_text}"\n` +
      `English Translation: "${example.corrected_text}"\n` +
      `Explanation: "${example.feedback}"\n\n` +
      "**User's Input:**\n" +
      `Korean: "${text}"\n\n` +
      "Return a JSON object with:\n" +
      "- 'translatedText': The translated English sentences as an array, where each sentence is a separate element.\n" +
      "- 'feedback': A JSON array of explanations in Korean about key phrases and grammar points, where each item is a separate explanation sentence.\n\n" +
      "Provide only the JSON output.";

    const response = await callGPT(prompt, text, 600);
    const translationData = JSON.parse(response);

    // 문장별로 단어 랜덤 배열 적용
    const sentencePairs = translationData.translatedText.map(sentence => ({
      originalSentence: sentence,
      shuffledWords: shuffleArray(sentence.split(" ")), // 단어 단위 랜덤 배열 적용
    }));

    // WritingRecord 테이블에 저장
    const record = await WritingRecord.create({
      user_id: userId,
      writing_question_id: writingQuestionId,
      original_text: text,
      processed_text: JSON.stringify(translationData.translatedText), // 번역된 문장을 배열로 저장
      feedback: JSON.stringify(translationData.feedback), // 배열을 JSON 문자열로 변환하여 저장
      type: "translation",
    });

    return {
      originalText: text,
      sentencePairs: sentencePairs, // 각 문장의 원본과 랜덤 배열된 단어 쌍
      feedback: translationData.feedback, // JSON 배열 형태로 반환
    };
  } catch (error) {
    console.error("Error in writing translation:", error.message);
    throw new Error("Failed to translate writing.");
  }
}

/**
 * 🌀 배열 랜덤 섞기 함수 (Fisher-Yates Shuffle)
 */
function shuffleArray(array) {
  const shuffled = [...array]; // 원본 배열 복사
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = { correctWriting, translateWriting };
