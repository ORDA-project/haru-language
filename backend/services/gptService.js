const {
  Example,
  ExampleItem,
  Dialogue,
  Question,
  Answer,
  Quote,
} = require("../models");

const { OpenAI } = require("openai");
require("dotenv").config();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateExamples(inputSentence, userId) {
  console.log(userId);
  try {
    // GPT API 요청
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          "role": "system",
          "content": 
            "You are an AI assistant specializing in generating high-quality learning examples for an English education app. Please create JSON-formatted data using the following guidelines:\n\n" +
            "- 'extractedSentence': The input sentence, which must highlight a key grammar or vocabulary concept.\n" +
            "- 'description': A concise explanation in Korean of what learners can study from this sentence (e.g., specific grammar points, idiomatic expressions, or vocabulary usage).\n" +
            "- 'examples': Three carefully curated examples that meet these requirements:\n" +
            "  - 'id': A unique identifier starting from 1.\n" +
            "  - 'context': A brief and relatable scenario in Korean where the sentence can be applied.\n" +
            "  - 'dialogue': A structured and meaningful conversation where A and B exchange lines that:\n" +
            "      - Demonstrate the grammar or vocabulary point in a practical context.\n" +
            "      - Each line includes:\n" +
            "        - 'english': The dialogue in English.\n" +
            "        - 'korean': A natural and accurate translation in Korean.\n\n" +
            "Ensure the examples focus on relevant, practical, and educational content. Avoid generic or trivial examples. Provide only the JSON output without any explanations or metadata."
        },        
        {
          role: "user",
          content: `Create JSON-formatted data for the following sentence: "${inputSentence}".`,
        },
      ],
      max_tokens: 600,
    });

    // GPT 응답에서 JSON 추출 및 파싱
    const cleanedOutput = response.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();
    const examples = JSON.parse(cleanedOutput);

    // 데이터베이스 저장 시작
    const example = await Example.create({
      extracted_sentence: examples.extractedSentence,
      description: examples.description,
      user_id: userId, // 사용자 ID 저장
    });

    for (const exampleItemData of examples.examples) {
      const exampleItem = await ExampleItem.create({
        example_id: example.id,
        context: exampleItemData.context,
      });

      for (const [speaker, dialogueData] of Object.entries(
        exampleItemData.dialogue
      )) {
        await Dialogue.create({
          example_item_id: exampleItem.id,
          speaker,
          english: dialogueData.english,
          korean: dialogueData.korean,
        });
      }
    }

    return examples;
  } catch (error) {
    console.error("Error generating examples:", error.message);
    throw new Error("Failed to generate examples from GPT.");
  }
}

async function getAnswer(question, userId) {
  try {
    if (!question || !userId) {
      throw new Error("질문과 사용자 ID는 필수입니다.");
    }

    // GPT API 요청
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an English teacher helping students improve their language skills. Provide clear and helpful explanations for their questions about grammar, vocabulary, and usage. Include explanations in Korean with examples in both English and Korean.",
        },
        {
          role: "user",
          content: question,
        },
      ],
      max_tokens: 500,
    });

    const answerContent = response.choices[0].message.content.trim();

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

    // 반환 데이터
    return {
      question: savedQuestion.content,
      answer: savedAnswer.content,
    };
  } catch (error) {
    console.error("Error answering question:", error.message);
    throw new Error("Failed to get an answer from GPT.");
  }
}



async function recommendQuote(userId) {
  try {
    // 최근 생성된 예문 기록 가져오기
    const recentExamples = await Example.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 1, // 최신 5개 예문
    });

    if (recentExamples.length === 0) {
      throw new Error('최근 생성된 예문 기록이 없습니다.');
    }

    // 예문에서 주제 추출 및 GPT로 명언 추천 요청
    const topics = recentExamples.map((example) => example.description).join("\n");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a motivational assistant. Based on the given topics, recommend an inspirational quote in English and its Korean translation, including the quote's source. Ensure the 'source' field provides an accurate and well-known reference, such as the author's name, book, speech, or other credible attribution. Avoid using 'anonymous' or 'unknown' unless no verifiable source exists. Return a JSON object with 'quote', 'translation', and 'source' fields."
        },
        {
          role: "user",
          content: `The topics are:\n${topics}`,
        },
      ],
      max_tokens: 200,
    });

    const quote = response.choices[0].message.content.replace(/```json|```/g, "").trim();
    const quoteData = JSON.parse(quote);

    // 명언 데이터베이스에 저장
    await Quote.create({
      user_id: userId,
      quote: quoteData.quote,
      translation: quoteData.translation,
      source: quoteData.source,
    });

    return {
      quote: quoteData.quote,
      translation: quoteData.translation,
      source: quoteData.source,
    };
  } catch (error) {
    console.error("Error recommending quote:", error.message);
    throw new Error("Failed to recommend a quote.");
  }
}


async function generateQuiz(userId) {
  try {
    // 최근 생성된 예문 5개 가져오기
    const recentExamples = await Example.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit: 5,
    });

    if (recentExamples.length < 3) {
      throw new Error("최근 생성된 예문 기록이 없습니다.");
    }

    // GPT 요청을 위한 주제 수집
    const topics = recentExamples.map((example) => example.description).join("\n");
    console.log(topics);

    // GPT로 OX 퀴즈 생성 요청
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:

            "You are a quiz generator for English language learners. Based on the given topics and sentences, create 5 OX quiz questions specifically designed for learning English. Each question should include:\n" +
            "- A question text that tests grammar, vocabulary, or sentence usage and can be answered with 'O' or 'X'.\n" +
            "- Clearly indicate the correct answer ('O' or 'X').\n" +
            "Return the result as a JSON array of questions, with each question having 'question', 'answer', and 'description' fields."
        },
        {
          role: "user",
          content: `The topics and sentences are:\n${topics}`,
        },
      ],
      max_tokens: 600,
    });

    const rawContent = response.choices[0].message.content;
    const cleanedContent = rawContent.replace(/```json|```/g, "").trim();
    const quizQuestions = JSON.parse(cleanedContent);
 
    return quizQuestions;
  } catch (error) {
    console.error("Error generating quiz:", error.message);
    throw new Error("Failed to generate quiz.");
  }
}

module.exports = {
  generateExamples,
  getAnswer,
  recommendQuote,
  generateQuiz,
};