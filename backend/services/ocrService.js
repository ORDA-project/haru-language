const fs = require("fs");
const vision = require("@google-cloud/vision");

let client;

function makeClient() {
  try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      const c = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      return new vision.ImageAnnotatorClient({
        credentials: { client_email: c.client_email, private_key: c.private_key },
        projectId: c.project_id,
      });
    }
    if (process.env.GOOGLE_CREDENTIALS_B64) {
      const path = "/tmp/gcp-credentials.json";
      fs.writeFileSync(path, Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, "base64"));
      process.env.GOOGLE_APPLICATION_CREDENTIALS = path;
      return new vision.ImageAnnotatorClient();
    }
    return new vision.ImageAnnotatorClient();
  } catch (error) {
    console.error("OCR 클라이언트 초기화 실패:", error.message);
    return null;
  }
}

// 클라이언트 초기화 시도
client = makeClient();

/** 이미지에서 텍스트 추출 */
async function detectText(filePath) {
  if (!client) {
    // 클라이언트가 없으면 재시도
    client = makeClient();
    if (!client) {
      throw new Error("OCR 서비스를 초기화할 수 없습니다.");
    }
  }

  if (!filePath) {
    throw new Error("파일 경로가 제공되지 않았습니다.");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
  }

  try {
    const [result] = await client.textDetection(filePath);
    const texts = result?.textAnnotations || [];
    if (!texts.length) {
      throw new Error("이미지에서 텍스트를 감지할 수 없습니다");
    }
    return texts[0].description;
  } catch (error) {
    // Google Cloud Vision API 에러 처리
    if (error.code === 7 || error.message?.includes("PERMISSION_DENIED")) {
      throw new Error("OCR 서비스 권한 오류입니다.");
    }
    if (error.code === 8 || error.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("OCR 서비스 할당량이 초과되었습니다.");
    }
    throw error;
  }
}

module.exports = { detectText };
