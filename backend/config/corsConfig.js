const allowedOrigins = [
  "https://orda-project.github.io/haru-language/",
  "https://orda-project.github.io",
  process.env.CLIENT_URL,
  // 개발환경에서만 localhost 허용
  ...(process.env.NODE_ENV !== 'production' ? [
    "http://localhost:3000",  // 프론트엔드 개발서버
    "http://localhost:8000",  // 백엔드 개발서버
  ] : [])
].filter(Boolean);

const toOrigin = (v) => {
  try { return new URL(v).origin; }
  catch { return String(v).replace(/\/+$/, ""); }
};

const normalizedAllowed = Array.from(new Set(allowedOrigins.map(toOrigin)));

module.exports = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const clean = toOrigin(origin);
    const ok = normalizedAllowed.includes(clean);

    if (ok) return callback(null, true);

    console.warn(`[CORS] blocked: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
  credentials: true,
};