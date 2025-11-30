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

    const response = await callGPT(personalizedPrompt, question, 500);
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
