/**
 * 에러 핸들링 미들웨어
 */

const PROD = process.env.NODE_ENV === "production";

/**
 * 안전한 에러 로깅 (민감한 정보 제외)
 */
const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    name: error.name,
    ...context,
    // 프로덕션에서는 스택 트레이스 제외
    ...(PROD ? {} : { stack: error.stack }),
  };

  console.error("[ERROR]", errorInfo);
};

/**
 * 사용자에게 안전한 에러 메시지 생성
 */
const getUserFriendlyMessage = (error, defaultMessage = "오류가 발생했습니다.") => {
  // 프로덕션에서는 항상 일반적인 메시지 반환
  if (PROD) {
    return defaultMessage;
  }

  // 개발 환경에서는 더 자세한 정보 제공
  return error.message || defaultMessage;
};

/**
 * HTTP 상태 코드 결정
 */
const getStatusCode = (error) => {
  if (error.status) {
    return error.status;
  }

  if (error.name === "ValidationError") {
    return 400;
  }

  if (error.name === "UnauthorizedError" || error.message?.includes("토큰")) {
    return 401;
  }

  if (error.name === "ForbiddenError") {
    return 403;
  }

  if (error.name === "NotFoundError") {
    return 404;
  }

  return 500;
};

module.exports = {
  logError,
  getUserFriendlyMessage,
  getStatusCode,
};

