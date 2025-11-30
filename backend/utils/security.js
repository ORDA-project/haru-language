// XSS 방지: HTML 특수문자 이스케이프
const escapeHtml = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// 안전한 메시지 생성 (기본값 포함)
const safeMessage = (name, template) => {
  const safeName = escapeHtml(name || "친구");
  return template.replace("{name}", safeName);
};

module.exports = { escapeHtml, safeMessage };

