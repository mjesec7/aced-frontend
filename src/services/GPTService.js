import axios from 'axios';

// ✅ Use correct baseURL from Vue CLI .env
const baseURL = process.env.VUE_APP_API_URL;

// ✅ Create a reusable axios instance
const gptApi = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Main function to send question (with optional image and lesson context)
export async function getAIResponse(userInput, imageUrl = null, lessonId = null) {
  console.log('🟣 [GPTService] Request:', { userInput, imageUrl, lessonId });

  try {
    const response = await gptApi.post('/chat', {
      userInput,
      imageUrl,
      lessonId,
    });

    console.log('✅ [GPTService] AI Response:', response.data);
    return response.data.reply;
  } catch (error) {
    console.error('❌ [GPTService] Error:', error?.response?.data || error.message);
    return 'Произошла ошибка при получении ответа от AI.';
  }
}
