const jwt = require("jsonwebtoken");

// 보안: 프로덕션에서는 반드시 환경 변수로 설정해야 함
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET 환경 변수가 설정되지 않았습니다. 프로덕션 환경에서는 필수입니다.");
  }
  console.warn("경고: JWT_SECRET이 설정되지 않았습니다. 개발 환경에서만 기본값을 사용합니다.");
}

// 기본값은 개발 환경에서만 사용 (최소 32자 이상의 랜덤 문자열 권장)
const DEFAULT_SECRET = "dev-secret-key-change-in-production-MUST-BE-CHANGED-IN-PRODUCTION";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"; // 7일

/**
 * JWT 토큰 생성
 * @param {Object} payload - 토큰에 포함할 데이터
 * @returns {string} JWT 토큰
 */
const generateToken = (payload) => {
  const secret = JWT_SECRET || DEFAULT_SECRET;
  
  // 보안: 민감한 정보는 토큰에 포함하지 않음
  const safePayload = {
    userId: payload.userId,
    social_id: payload.social_id,
    social_provider: payload.social_provider,
    // name, email 등은 필요시에만 포함 (선택적)
    ...(payload.name && { name: payload.name }),
    ...(payload.email && { email: payload.email }),
  };

  return jwt.sign(safePayload, secret, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "soksok-language",
    audience: "soksok-language-client",
  });
};

/**
 * JWT 토큰 검증
 * @param {string} token - 검증할 토큰
 * @returns {Object|null} 디코딩된 페이로드 또는 null
 */
const verifyToken = (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("토큰이 제공되지 않았습니다.");
  }

  // 보안: 토큰 길이 검증 (JWT는 일반적으로 매우 길기 때문에)
  if (token.length > 2000) {
    throw new Error("유효하지 않은 토큰 형식입니다.");
  }

  const secret = JWT_SECRET || DEFAULT_SECRET;

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: "soksok-language",
      audience: "soksok-language-client",
    });

    // 보안: 디코딩된 페이로드 검증
    if (!decoded.userId || !decoded.social_id) {
      throw new Error("토큰에 필수 정보가 없습니다.");
    }

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("토큰이 만료되었습니다.");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("유효하지 않은 토큰입니다.");
    }
    throw error;
  }
};

/**
 * 요청에서 토큰 추출 (Authorization 헤더 또는 쿠키)
 * @param {Object} req - Express 요청 객체
 * @returns {string|null} 토큰 또는 null
 */
const extractToken = (req) => {
  // 1. Authorization 헤더에서 추출 (Bearer 토큰)
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return token;
  }

  // 2. 쿠키에서 추출 (fallback)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * JWT 인증 미들웨어
 */
const authenticateToken = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "인증 토큰이 필요합니다.",
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // req.user에 사용자 정보 저장
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: error.message || "유효하지 않은 토큰입니다.",
    });
  }
};

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
 */
const optionalAuthenticate = (req, res, next) => {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // 토큰이 유효하지 않아도 통과 (선택적 인증)
      req.user = null;
    }
  }

  next();
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  authenticateToken,
  optionalAuthenticate,
};

