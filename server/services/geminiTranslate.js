const axios = require("axios");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateText?key=" +
  GEMINI_API_KEY;

async function geminiTranslate(indonesianText) {
  const prompt = `Translate this Indonesian text to English: "${indonesianText}"`;
  const body = {
    prompt: { text: prompt },
  };

  try {
    const response = await axios.post(GEMINI_URL, body, {
      headers: { "Content-Type": "application/json" },
    });

    const result = response.data?.candidates?.[0]?.output;
    if (!result) throw new Error("No translation from Gemini");

    return result.trim();
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
}

module.exports = geminiTranslate;
