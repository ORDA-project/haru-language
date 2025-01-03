const textToSpeech = require("@google-cloud/text-to-speech");
// const fs = require("fs"); 파일 처리 안하면 불필요
// const util = require("util");
require("dotenv").config({ path: "../.env" }); // .env 파일 로드

// Google Cloud TTS 클라이언트 초기화
const ttsClient = new textToSpeech.TextToSpeechClient();

/**
 * 텍스트 데이터를 받아 tts로 변환 후 즉시 실행
 * @param {string} text - 변환할 텍스트
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

    // 오디오 재생을 위해 데이터 반환
    console.log("TTS audio generated successfully!");
    return response.audioContent;
  } catch (error) {
    console.error("Error during TTS conversion:", error.message);
    throw new Error("Failed to read text with TTS.");
  }
}

module.exports = {
  readTextWithTTS,
};
