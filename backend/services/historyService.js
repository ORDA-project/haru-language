const { Question, Answer, Example, ExampleItem, Dialogue } = require('../models');


async function getQuestionsAndAnswersByUserId(userId) {
  try {
    if (!userId) {
      throw new Error('유저 ID는 필수입니다.');
    }

    // 질문과 답변 조회
    const questionsAndAnswers = await Question.findAll({
      where: { user_id: userId }, // 유저 ID 기준 조회
      include: [
        {
          model: Answer, // 관련된 답변 포함
          attributes: ['content'], // 답변의 content만 가져오기
        },
      ],
      attributes: ['id', 'content', 'created_at'], // 질문의 id, content, 생성일자 가져오기
      order: [['created_at', 'DESC']], // 최신 질문 순서로 정렬
    });

    // 결과 반환
    return questionsAndAnswers;
  } catch (error) {
    console.error('질문과 답변 조회 중 오류:', error.message);
    throw new Error('질문과 답변 조회에 실패했습니다.');
  }
}

async function getExamplesByUserId(userId) {
    try {
      if (!userId) {
        throw new Error('userId는 필수입니다.');
      }
  
      const examples = await Example.findAll({
        where: { user_id: userId },
        include: [
          {
            model: ExampleItem,
            attributes: ['id', 'context'], // context 포함
            include: [
              {
                model: Dialogue,
                attributes: ['speaker', 'english', 'korean'], // 필요한 필드만 선택
              },
            ],
          },
        ],
        attributes: ['id', 'extracted_sentence', 'description', 'created_at'], // 필요한 필드만 선택 (images는 DB 컬럼이 없어서 제외)
        order: [['created_at', 'DESC']], // 최신 순으로 정렬
      });
  
      return examples;
    } catch (error) {
      console.error('예문 조회 중 오류:', error.message);
      throw new Error('예문 조회에 실패했습니다.');
    }
  }

module.exports = {
  getQuestionsAndAnswersByUserId,
  getExamplesByUserId,
};