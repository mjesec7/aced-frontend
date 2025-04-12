import axios from "axios";

// ✅ Vue CLI reads from VUE_APP_API_URL in `.env` files
const baseURL = process.env.VUE_APP_API_URL;

export async function getAIResponse(text, imageUrl) {
  try {
    const response = await axios.post(`${baseURL}/chat`, {
      userInput: text,
      imageUrl: imageUrl || null,
    });
    return response.data.reply;
  } catch (error) {
    console.error('Error getting AI response:', error.response?.data || error.message);
    return 'Произошла ошибка при получении ответа от AI.';
  }
}
