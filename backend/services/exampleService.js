const callGPT = require("./gptService");

async function generateExamples(inputSentence) {
  const prompt = 
    "You are an AI assistant specializing in generating high-quality learning examples ...";
  
  const result = await callGPT(prompt, `Create JSON-formatted data for: "${inputSentence}"`);
  return JSON.parse(result);
}

module.exports = generateExamples;