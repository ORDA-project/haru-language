const allowedOrigins = [
  "http://localhost:3000",
  "https://orda-project.github.io",
  "https://orda-project.github.io/haru-language",
  process.env.FRONTEND_URL
].filter(Boolean); // undefined 값 제거

const corsConfig = {
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    // origin이 없는 경우 (모바일 앱, postman 등) 허용
    if (!origin) {
      console.log('No origin header - allowing request');
      return callback(null, true);
    }
    
    // 정확한 매치 또는 GitHub Pages 서브패스 허용
    const isAllowed = allowedOrigins.some(allowed => 
      origin === allowed || 
      (allowed === "https://orda-project.github.io" && origin.startsWith("https://orda-project.github.io"))
    );
    
    if (isAllowed) {
      console.log(`CORS allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      console.warn('Available origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

module.exports = corsConfig;
