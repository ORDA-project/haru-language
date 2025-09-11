const textToSpeech = require("@google-cloud/text-to-speech");
require("dotenv").config({ path: "../.env" }); 

// Google Cloud TTS 클라이언트 초기화
let ttsClient;
try {
  // JSON 문자열을 파싱해서 사용
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  ttsClient = new textToSpeech.TextToSpeechClient({
    credentials: credentials,
    projectId: credentials.project_id,
  });
} catch (error) {
  console.error("Google Cloud TTS 초기화 실패:", error.message);
  ttsClient = null;
}

/**
 * 텍스트 데이터를 받아 TTS로 변환 후 MP3 데이터 반환
 * @param {string} text - 변환할 텍스트
 * @param {number} speed - 말하기 속도 (기본: 0.7)
 * @returns {Buffer} - MP3 음성 데이터
 */
async function readTextWithTTS(text, speed = 0.7) {
  try {
    if (!ttsClient) {
      throw new Error("Google Cloud TTS 클라이언트가 초기화되지 않았습니다.");
    }

    // Google TTS 요청 구성
    const request = {
      input: { text },
      voice: {
        languageCode: process.env.GOOGLE_TTS_LANGUAGE_CODE || "en-US",
        name: process.env.GOOGLE_TTS_VOICE_NAME || "en-US-Wavenet-D",
        ssmlGender: process.env.GOOGLE_TTS_SSML_GENDER || "MALE",
      },
      audioConfig: {
        audioEncoding: "MP3", // MP3 형식으로 변환
        speakingRate: speed,
      },
    };

    // TTS 요청
    const [response] = await ttsClient.synthesizeSpeech(request);

    // MP3 데이터를 반환
    console.log("TTS audio generated successfully!");
    return response.audioContent; // MP3 데이터 (Buffer 형식)
  } catch (error) {
    console.error("Error during TTS conversion:", error.message);
    throw new Error("TTS 변환에 실패했습니다: " + error.message);
  }
}

module.exports = {
  readTextWithTTS,
};