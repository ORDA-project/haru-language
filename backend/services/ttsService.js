const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");
require("dotenv").config({ path: "../.env" }); // .env 파일 로드

// Google Cloud TTS 클라이언트 초기화
const ttsClient = new textToSpeech.TextToSpeechClient();

/**
 * 텍스트를 음성으로 변환하고 파일로 저장
 * @param {string} text - 변환할 텍스트
 * @param {string} outputFilePath - 저장할 오디오 파일 경로
 */

async function convertTextToSpeech(text, outputFilePath) {
  try {
    const request = {
      input: { text: text },
      voice: {
        languageCode: process.env.GOOGLE_TTS_LANGUAGE_CODE, // .env에서 가져옴
        name: process.env.GOOGLE_TTS_VOICE_NAME, // .env에서 가져옴
        ssmlGender: process.env.GOOGLE_TTS_SSML_GENDER, // .env에서 가져옴
      },
      audioConfig: {
        audioEncoding: process.env.GOOGLE_TTS_AUDIO_ENCODING, // .env에서 가져옴
      },
    };

    // TTS 요청
    const [response] = await ttsClient.synthesizeSpeech(request);

    // 오디오 파일로 저장
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(outputFilePath, response.audioContent, "binary");
    console.log(`Audio content written to file: ${outputFilePath}`);
  } catch (error) {
    console.error("Error during TTS conversion:", error.message);
    throw new Error("Failed to convert text to speech.");
  }
}

module.exports = {
  convertTextToSpeech,
};
