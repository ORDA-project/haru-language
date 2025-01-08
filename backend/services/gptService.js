const { Example, ExampleItem, Dialogue, Question, Answer } = require('../models');
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

      for (const [speaker, dialogueData] of Object.entries(exampleItemData.dialogue)) {
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
      throw new Error('질문과 사용자 ID는 필수입니다.');
    }
  
    // GPT API 요청
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an English teacher helping students improve their language skills. Provide clear and helpful explanations for their questions about grammar, vocabulary, and usage. Include explanations in Korean with examples in both English and Korean."
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
            "You are a motivational assistant. Based on the given topics, recommend an inspirational quote in English and its Korean translation, including the quote's source. Return a JSON object with 'quote', 'translation', and 'source' fields."
        },
        {
          role: "user",
          content: `The topics are:\n${topics}`,
        },
      ],
      max_tokens: 200,
    });

    const quote = response.choices[0].message.content.trim();

    return { quote };
  } catch (error) {
    console.error("Error recommending quote:", error.message);
    throw new Error("Failed to recommend a quote.");
  }
}

module.exports = {
  generateExamples,
  getAnswer,
  recommendQuote,
};