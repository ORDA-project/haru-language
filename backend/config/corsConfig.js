const allowList = [
  process.env.CLIENT_URL,        // 배포 프론트
  "http://localhost:3000",         // 로컬 프론트
].filter(Boolean);

module.exports = {
  origin(origin, cb) {
    if (!origin || allowList.includes(origin)) return cb(null, true); 
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
