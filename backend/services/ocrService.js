const fs = require("fs");
const vision = require("@google-cloud/vision");

function makeClient() {
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
  }
  return new vision.ImageAnnotatorClient();
}

const client = makeClient();

/** 이미지에서 텍스트 추출 */
async function detectText(filePath) {
  const [result] = await client.textDetection(filePath);
  const texts = result?.textAnnotations || [];
  if (!texts.length) throw new Error("이미지에서 텍스트를 감지할 수 없습니다");
  return texts[0].description;
}

module.exports = { detectText };
