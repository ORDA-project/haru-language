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
    // 보안: origin이 없는 경우 (같은 origin 요청, Postman, 브라우저 직접 접속 등) 처리
    // favicon.ico, manifest.json, 루트 경로 등은 origin이 없을 수 있음
    // 실제 보안은 JWT 인증으로 처리하므로 origin이 없는 요청도 허용
    if (!origin) {
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Cache-Control", "Pragma"],
  exposedHeaders: ["Content-Disposition"],
  optionsSuccessStatus: 204,
  credentials: true,
  maxAge: 86400,
};

module.exports.allowedOrigins = allowedOrigins;