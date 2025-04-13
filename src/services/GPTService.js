import axios from "axios";

// ✅ Uses .env variable like VUE_APP_API_URL
const baseURL = process.env.VUE_APP_API_URL;

export async function getAIResponse(userInput, imageUrl = null, lessonId = null) {
  try {
    const response = await axios.post(`${baseURL}/chat`, {
      userInput,
      imageUrl,
      lessonId
    });
    return response.data.reply;
  } catch (error) {
    console.error("❌ Error getting AI response:", error.response?.data || error.message);
    return "Произошла ошибка при получении ответа от AI.";
  }
}
