const textToSpeech = require("@google-cloud/text-to-speech");
require("dotenv").config({ path: "../.env" }); // .env 파일 로드

// Google Cloud TTS 클라이언트 초기화
const ttsClient = new textToSpeech.TextToSpeechClient();

/**
 * 텍스트 데이터를 받아 TTS로 변환 후 MP3 데이터 반환
 * @param {string} text - 변환할 텍스트
 * @returns {Buffer} - MP3 음성 데이터
 */
async function readTextWithTTS(text) {
  try {
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
      },
    };

    // TTS 요청
    const [response] = await ttsClient.synthesizeSpeech(request);

    // MP3 데이터를 반환
    console.log("TTS audio generated successfully!");
    return response.audioContent; // MP3 데이터 (Buffer 형식)
  } catch (error) {
    console.error("Error during TTS conversion:", error.message);
    throw new Error("Failed to read text with TTS.");
  }
}

module.exports = {
  readTextWithTTS,
};