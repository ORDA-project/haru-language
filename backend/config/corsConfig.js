const defaultOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CDN_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://haru-language.vercel.app",
  "https://haru-language-server.onrender.com",
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Disposition"],
  optionsSuccessStatus: 204,
  credentials: true,
  maxAge: 86400,
};

module.exports.allowedOrigins = allowedOrigins;