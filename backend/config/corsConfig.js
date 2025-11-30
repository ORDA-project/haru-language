const defaultOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CDN_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://haru-language.vercel.app",
  "https://haru-language-production.up.railway.app",

].filter(Boolean);

const normalizeOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return String(value).replace(/\/+$/, "");
  }
};

const allowedOrigins = Array.from(new Set(defaultOrigins.map(normalizeOrigin)));

module.exports = {
  origin(origin, callback) {
    // 보안: origin이 없는 경우 (같은 origin 요청, Postman 등) 처리
    // 프로덕션에서는 더 엄격하게 처리할 수 있음
    if (!origin) {
      // 개발 환경에서는 허용, 프로덕션에서는 거부
      if (process.env.NODE_ENV === "production") {
        console.warn("[CORS] Origin이 없는 요청을 거부했습니다.");
        return callback(new Error("Origin header is required in production"));
      }
      return callback(null, true);
    }

    const cleanedOrigin = normalizeOrigin(origin);
    const isAllowed = allowedOrigins.includes(cleanedOrigin);

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`[CORS] blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Disposition"],
  optionsSuccessStatus: 204,
  credentials: true,
  maxAge: 86400,
};

module.exports.allowedOrigins = allowedOrigins;