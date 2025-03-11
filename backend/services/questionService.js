const { Question, Answer } = require("../models");
const callGPT = require("./gptService");

async function getAnswer(question, userId) {
  try {
    const prompt = 
      "You are an English teacher helping students improve their language skills. Provide clear and helpful explanations for their questions about grammar, vocabulary, and usage. Include explanations in Korean with examples in both English and Korean.";

    const response = await callGPT(prompt, question, 500);
    const answerContent = response.trim();

    // 질문 저장
    const savedQuestion = await Question.create({
      user_id: userId,
      content: question,
    });

    // 답변 저장
    const savedAnswer = await Answer.create({
      question_id: savedQuestion.id,
      content: answerContent,
    });

    return {
      question: savedQuestion.content,
      answer: savedAnswer.content,
    };
  } catch (error) {
    console.error("Error answering question:", error.message);
    throw new Error("Failed to get an answer from GPT.");
  }
}

module.exports = { getAnswer };
