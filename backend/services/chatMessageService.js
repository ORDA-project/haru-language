const { ChatMessage } = require('../models');
const { Op } = require('sequelize');

/**
 * 채팅 메시지 저장
 */
async function saveChatMessage(userId, messageData) {
  try {
    if (!userId) {
      throw new Error('유저 ID는 필수입니다.');
    }

    const { type, content, examples, imageUrl, questionId } = messageData;

    if (!type) {
      throw new Error('메시지 타입은 필수입니다.');
    }

    // content가 없어도 imageUrl이나 examples가 있으면 허용 (이미지만 있는 메시지 또는 예문만 있는 메시지)
    if (!content && !imageUrl && !examples) {
      throw new Error('메시지 내용, 이미지, 또는 예문이 필요합니다.');
    }

    const chatMessage = await ChatMessage.create({
      user_id: userId,
      type,
      content,
      examples: examples || null,
      image_url: imageUrl || null,
      question_id: questionId || null,
    });

    return {
      id: chatMessage.id.toString(),
      type: chatMessage.type,
      content: chatMessage.content,
      examples: chatMessage.examples,
      imageUrl: chatMessage.image_url,
      timestamp: chatMessage.created_at,
    };
  } catch (error) {
    console.error('채팅 메시지 저장 중 오류:', error.message);
    throw new Error('채팅 메시지 저장에 실패했습니다.');
  }
}

/**
 * 여러 채팅 메시지 저장 (트랜잭션 사용)
 */
async function saveChatMessages(userId, messages) {
  const { sequelize } = require('../db');
  const transaction = await sequelize.transaction();
  
  try {
    if (!userId || !Array.isArray(messages)) {
      throw new Error('유저 ID와 메시지 배열이 필요합니다.');
    }

    // 트랜잭션 내에서 일괄 저장
    const savedMessages = await Promise.all(
      messages.map((msg) => {
        // content가 없어도 imageUrl이나 examples가 있으면 허용 (이미지만 있는 메시지 또는 예문만 있는 메시지)
        if (!msg.content && !msg.imageUrl && !msg.examples) {
          throw new Error('메시지 내용, 이미지, 또는 예문이 필요합니다.');
        }
        
        return ChatMessage.create({
          user_id: userId,
          type: msg.type,
          content: msg.content || '', // 빈 문자열 허용
          examples: msg.examples || null,
          image_url: msg.imageUrl || null,
          question_id: msg.questionId || null,
        }, { transaction });
      })
    );

    await transaction.commit();

    return savedMessages.map((msg) => ({
      id: msg.id.toString(),
      type: msg.type,
      content: msg.content,
      examples: msg.examples,
      imageUrl: msg.image_url,
      timestamp: msg.created_at,
    }));
  } catch (error) {
    await transaction.rollback();
    console.error('채팅 메시지 일괄 저장 중 오류:', error.message);
    throw new Error('채팅 메시지 저장에 실패했습니다.');
  }
}

/**
 * 날짜별 채팅 메시지 조회
 */
async function getChatMessagesByDate(userId, dateString) {
  try {
    if (!userId) {
      throw new Error('유저 ID는 필수입니다.');
    }

    // dateString은 YYYY-MM-DD 형식
    const startDate = new Date(dateString);
    startDate.setHours(4, 0, 0, 0); // 오전 4시 기준

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const messages = await ChatMessage.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      order: [['created_at', 'ASC']],
    });

    return messages.map((msg) => ({
      id: msg.id.toString(),
      type: msg.type,
      content: msg.content,
      examples: msg.examples,
      imageUrl: msg.image_url,
      timestamp: msg.created_at,
    }));
  } catch (error) {
    console.error('채팅 메시지 조회 중 오류:', error.message);
    throw new Error('채팅 메시지 조회에 실패했습니다.');
  }
}

/**
 * 최근 채팅 메시지 조회 (오늘 날짜 기준)
 * 조회만 수행하며, 사이드 이펙트 없음
 */
async function getRecentChatMessages(userId) {
  try {
    if (!userId) {
      throw new Error('유저 ID는 필수입니다.');
    }

    // 오늘 날짜 (오전 4시 기준)
    const today = new Date();
    const todayBy4AM = new Date(today);
    todayBy4AM.setHours(4, 0, 0, 0);
    if (today < todayBy4AM) {
      todayBy4AM.setDate(todayBy4AM.getDate() - 1);
    }

    const messages = await ChatMessage.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: todayBy4AM,
        },
      },
      order: [['created_at', 'ASC']],
    });

    return messages.map((msg) => ({
      id: msg.id.toString(),
      type: msg.type,
      content: msg.content,
      examples: msg.examples,
      imageUrl: msg.image_url,
      timestamp: msg.created_at,
    }));
  } catch (error) {
    console.error('최근 채팅 메시지 조회 중 오류:', error.message);
    throw new Error('채팅 메시지 조회에 실패했습니다.');
  }
}

/**
 * 채팅 메시지 삭제
 */
async function deleteChatMessage(userId, messageId) {
  try {
    if (!userId) {
      throw new Error('유저 ID는 필수입니다.');
    }

    const message = await ChatMessage.findOne({
      where: {
        id: messageId,
        user_id: userId,
      },
    });

    if (!message) {
      throw new Error('NOT_FOUND: 메시지를 찾을 수 없습니다.');
    }

    await message.destroy();

    return { message: '메시지가 삭제되었습니다.' };
  } catch (error) {
    if (error.message.includes('NOT_FOUND')) {
      throw error;
    }
    console.error('채팅 메시지 삭제 중 오류:', error.message);
    throw new Error('채팅 메시지 삭제에 실패했습니다.');
  }
}

/**
 * 여러 채팅 메시지 삭제
 */
async function deleteChatMessages(userId, messageIds) {
  try {
    if (!userId || !Array.isArray(messageIds)) {
      throw new Error('유저 ID와 메시지 ID 배열이 필요합니다.');
    }

    // 유효한 숫자 ID만 필터링
    const validIds = messageIds
      .map(id => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        return numId;
      })
      .filter(id => Number.isInteger(id) && id > 0);

    if (validIds.length === 0) {
      throw new Error('유효한 메시지 ID가 없습니다.');
    }

    const deletedCount = await ChatMessage.destroy({
      where: {
        id: {
          [Op.in]: validIds,
        },
        user_id: userId,
      },
    });

    return { 
      message: `${deletedCount}개의 메시지가 삭제되었습니다.`,
      deletedCount,
    };
  } catch (error) {
    console.error('채팅 메시지 일괄 삭제 중 오류:', error.message);
    throw new Error('채팅 메시지 삭제에 실패했습니다.');
  }
}

module.exports = {
  saveChatMessage,
  saveChatMessages,
  getChatMessagesByDate,
  getRecentChatMessages,
  deleteChatMessage,
  deleteChatMessages,
};
