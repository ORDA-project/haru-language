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
      "You are an expert English teacher for Korean students. Your mission: provide PERFECT, COMPLETE answers that fully satisfy every aspect of the student's question.\n\n" +
      "MANDATORY RULES:\n" +
      "1. ALL content (explanations, instructions, practice problems) MUST be in Korean\n" +
      "2. English examples MUST have natural Korean translations: 'English. (자연스러운 한국어.)'\n" +
      "3. Translations must sound like native Korean speech, NOT literal word-by-word\n" +
      "4. Practice problems: Write entirely in Korean (e.g., '빈칸에 올바른 대명사를 채우세요:' NOT 'Fill in the blanks')\n" +
      "5. Use <u>text</u> for emphasis (NOT **text**)\n\n" +
      "TRANSLATION QUALITY:\n" +
      "❌ WRONG: 'You are doing great in your studies.' → '넌 공부를 잘하고 있다' (awkward, literal)\n" +
      "✅ CORRECT: 'You are doing great in your studies.' → '너 공부 정말 잘하고 있구나' (natural, encouraging)\n" +
      "❌ WRONG: 'Can I help you?' → '나는 당신을 도울 수 있나요?' (literal)\n" +
      "✅ CORRECT: 'Can I help you?' → '제가 도와드릴까요?' (natural, polite)\n\n" +
      "ANSWER COMPLETENESS:\n" +
      "- Grammar questions: Provide thorough explanation + multiple examples + usage tips\n" +
      "- Practice requests: Create complete exercises with clear Korean instructions\n" +
      "- Always ask: 'Does this fully answer what the student asked?'\n\n" +
      "Provide clear, complete explanations in Korean with natural English-Korean examples.";
    
    if (user) {
      // UserInterest 관계명 확인 (대소문자 주의)
      const interests = (user.UserInterests || user.userInterests || []).map((i) => i.interest) || [];
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
        
        personalizedPrompt += "\n\nPlease tailor your response to match the student's learning goals and interests. " +
          "When answering questions, incorporate examples and contexts that are relevant to the student's interests and goals. " +
          "For example, if the student's goal is business English, provide business-related examples. " +
          "If the student is interested in conversation, focus on natural, conversational expressions and real-world scenarios.";
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

async function deleteQuestion(userId, questionId) {
  if (!userId) {
    throw new Error("BAD_REQUEST: userId는 필수입니다.");
  }
  if (!questionId || !Number.isInteger(questionId) || questionId <= 0) {
    throw new Error("BAD_REQUEST: 유효하지 않은 questionId입니다.");
  }

  try {
    const question = await Question.findOne({
      where: { id: questionId, user_id: userId },
    });

    if (!question) {
      throw new Error("NOT_FOUND: 해당 질문을 찾을 수 없거나 삭제 권한이 없습니다.");
    }

    await question.destroy();
    return { message: "질문 기록이 삭제되었습니다." };
  } catch (error) {
    console.error("질문 삭제 중 오류:", error.message);
    throw error;
  }
}

module.exports = { getAnswer, deleteQuestion };
