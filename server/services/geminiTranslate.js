const axios = require("axios");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=" +
  GEMINI_API_KEY;

async function geminiTranslate(indonesianText) {
  const prompt = `Translate this Indonesian text to English: "${indonesianText}"`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 250 },
  };
  const response = await axios.post(GEMINI_URL, body, {
    headers: { "Content-Type": "application/json" },
  });
  const data = response.data;
  let result = null;

  result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!result) throw new Error("No translation from Gemini");

  console.log(result.trim());
  return result.trim();
}

module.exports = geminiTranslate;
