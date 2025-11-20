/**
 * 입력 검증 미들웨어
 */

/**
 * OAuth code 파라미터 검증
 * 보안: 기본적인 검증만 수행 (구글/카카오 OAuth 코드 형식 다양성 고려)
 */
const validateOAuthCode = (req, res, next) => {
  let { code } = req.query;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: "Authorization code is required.",
    });
  }

  // 문자열로 변환 (배열인 경우 첫 번째 값 사용)
  if (Array.isArray(code)) {
    code = code[0];
  }
  code = String(code).trim();

  // 빈 문자열 검증
  if (!code || code.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Authorization code cannot be empty.",
    });
  }

  // 최소 길이 검증 (너무 짧은 코드는 의심스러움)
  if (code.length < 10) {
    return res.status(400).json({
      success: false,
      error: "Authorization code is too short.",
    });
  }

  // 최대 길이 검증 (보안: 매우 긴 코드는 공격일 수 있음)
  if (code.length > 500) {
    return res.status(400).json({
      success: false,
      error: "Authorization code is too long.",
    });
  }

  // 보안: 위험한 문자 패턴 검증 (XSS, SQL Injection 등 방지)
  // 하지만 OAuth 코드는 다양한 문자를 포함할 수 있으므로 최소한만 검증
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror= 등
    /['";]/g, // SQL Injection 방지
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return res.status(400).json({
        success: false,
        error: "Invalid authorization code format.",
      });
    }
  }

  // 검증 통과: code를 req.query에 정제된 값으로 저장
  req.query.code = code;
  next();
};

/**
 * 사용자 ID 검증 (숫자만)
 */
const validateUserId = (req, res, next) => {
  const userId = req.params.userId || req.body.userId;

  if (userId && !/^\d+$/.test(String(userId))) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID format.",
    });
  }

  next();
};

/**
 * 문자열 입력 정제 (XSS 방지)
 */
const sanitizeString = (input, maxLength = 1000) => {
  if (typeof input !== "string") {
    return "";
  }

  // HTML 태그 제거
  let sanitized = input
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, "")
    .trim();

  // 길이 제한
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * 이메일 형식 검증
 */
const validateEmail = (email) => {
  if (!email) return true; // 선택적 필드
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 요청 본문 크기 제한 검증
 */
const validateBodySize = (maxSize = 10000) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get("content-length") || "0", 10);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: "Request body too large.",
      });
    }

    next();
  };
};

module.exports = {
  validateOAuthCode,
  validateUserId,
  sanitizeString,
  validateEmail,
  validateBodySize,
};

