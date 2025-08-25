const allowedOrigins = [
  "http://localhost:3000",
  "https://orda-project.github.io/haru-language",
  process.env.FRONTEND_URL
].filter(Boolean); // undefined 값 제거

const corsConfig = {
  origin: function (origin, callback) {
    // origin이 없는 경우 (모바일 앱, postman 등) 허용
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

module.exports = corsConfig;
