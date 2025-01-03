const corsConfig = {
    origin: "*", // 모든 도메인 허용 (필요 시 특정 도메인만 허용)
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  };
  
  module.exports = corsConfig;