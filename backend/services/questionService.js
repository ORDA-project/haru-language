const { Question, Answer, User, UserInterest } = require("../models");
const callGPT = require("./gptService");

async function getAnswer(question, userId) {
  try {
    // 사용자 정보 가져오기 (목표, 관심사)
    const user = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: UserInterest,
          attributes: ["interest"],
        },
      ],
    });

    // 사용자 맞춤 프롬프트 생성
    let personalizedPrompt = 
      "You are an English teacher helping students improve their language skills. Provide clear and helpful explanations for their questions about grammar, vocabulary, and usage. Include explanations in Korean with examples in both English and Korean.";
    
    if (user) {
      const interests = user.UserInterests?.map((i) => i.interest) || [];
      const goal = user.goal;
      
      if (interests.length > 0 || goal) {
        personalizedPrompt += "\n\nStudent's learning context:";
        
        if (goal) {
          const goalMap = {
            hobby: "hobby/leisure learning",
            exam: "exam preparation",
            business: "business English",
            travel: "travel English"
          };
          personalizedPrompt += `\n- Learning goal: ${goalMap[goal] || goal}`;
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
          personalizedPrompt += `\n- Interests: ${interestText}`;
        }
        
        personalizedPrompt += "\n\nPlease tailor your response to match the student's learning goals and interests when relevant.";
      }
    }

    // 질문 먼저 저장 (GPT 응답 전에 저장하여 학습 횟수에 반영)
    const savedQuestion = await Question.create({
      user_id: userId,
      content: question,
    });

    // GPT 응답 받기
    const response = await callGPT(personalizedPrompt, question, 500);
    const answerContent = response.trim();

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
    // Question은 이미 저장되었을 수 있으므로, GPT 응답 실패 시에도 Question은 유지
    // 하지만 사용자에게는 에러를 알려야 함
    throw new Error("Failed to get an answer from GPT.");
  }
}

module.exports = { getAnswer };
