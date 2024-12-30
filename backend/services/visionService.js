const vision = require("@google-cloud/vision");

// Google Cloud Vision 클라이언트 초기화
const client = new vision.ImageAnnotatorClient();

/**
 * Vision API를 사용해 이미지에서 텍스트 추출
 * @param {string} filePath 업로드된 파일 경로
 * @returns {string} 추출된 텍스트
 */
async function detectText(filePath) {
  const [result] = await client.textDetection(filePath);
  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    throw new Error("No text detected");
  }

  return detections[0].description;
}

module.exports = {
  detectText,
};