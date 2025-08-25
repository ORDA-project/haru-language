const allowedOrigins = [
  "http://localhost:3000",                    
  "https://orda-project.github.io/haru-language/", 
  "https://orda-project.github.io",           
  process.env.CLIENT_URL,                   
].filter(Boolean);

const toOrigin = (v) => {
  try { return new URL(v).origin; }           // 'https://host' 형태로 정규화
  catch { return String(v).replace(/\/+$/, ""); }
};

// 최종 비교 리스트(중복 제거)
const normalizedAllowed = Array.from(new Set(allowedOrigins.map(toOrigin)));

module.exports = {
  // 브라우저가 보낸 Origin이 normalizedAllowed에 있으면 허용
  origin(origin, callback) {
    // 서버-서버, Postman 등 Origin 없는 요청은 허용
    if (!origin) return callback(null, true);

    const clean = toOrigin(origin);
    const ok = normalizedAllowed.includes(clean);

    if (ok) return callback(null, true);

    console.warn(`[CORS] blocked: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },

  // 프리플라이트 및 일반적으로 쓰는 메서드/헤더 허용
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,

  // 크로스오리진 쿠키 전송 허용(프론트에서 credentials: 'include' 필요)
  credentials: true,
};
