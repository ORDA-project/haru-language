// 공통 입력 검증 유틸리티
const validateText = (text, fieldName = "text", maxLength = 5000) => {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error(`BAD_REQUEST: ${fieldName}는 필수이며 비어있을 수 없습니다.`);
  }
  if (text.length > maxLength) {
    throw new Error(`BAD_REQUEST: ${fieldName}는 최대 ${maxLength}자까지 입력 가능합니다.`);
  }
  return text.trim();
};

const validateUserId = (userId) => {
  if (!userId) {
    throw new Error("BAD_REQUEST: userId는 필수입니다.");
  }
};

const validateWritingQuestionId = (writingQuestionId, required = false) => {
  if (required && (!writingQuestionId || !Number.isInteger(writingQuestionId) || writingQuestionId <= 0)) {
    throw new Error("BAD_REQUEST: writingQuestionId는 양의 정수여야 합니다.");
  }
  if (writingQuestionId !== null && (!Number.isInteger(writingQuestionId) || writingQuestionId <= 0)) {
    throw new Error("BAD_REQUEST: writingQuestionId는 양의 정수여야 합니다.");
  }
};

module.exports = { validateText, validateUserId, validateWritingQuestionId };

