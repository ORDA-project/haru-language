const allowedOrigins = [
  "http://localhost:3000",
  "https://haru-language.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean); // undefined 값 제거

const corsConfig = {
  origin: function (origin, callback) {
    console.log("CORS request from origin:", origin);
    console.log("Allowed origins:", allowedOrigins);

    // origin이 없는 경우 (모바일 앱, postman 등) 허용
    if (!origin) {
      console.log("No origin header - allowing request");
      return callback(null, true);
    }

    // 정확한 매치 확인
    const isAllowed = allowedOrigins.some((allowed) => origin === allowed);

    if (isAllowed) {
      console.log(`CORS allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      console.warn("Available origins:", allowedOrigins);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

module.exports = corsConfig;
