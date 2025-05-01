import axios from 'axios';
import { auth } from '@/firebase'; // ✅ Import Firebase auth

const baseURL = process.env.VUE_APP_API_URL;

const gptApi = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getAIResponse(userInput, imageUrl = null, lessonId = null) {
  console.log('🟣 [GPTService] Request:', { userInput, imageUrl, lessonId });

  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('❌ Пользователь не авторизован.');
    }

    const token = await user.getIdToken(); // ✅ Get token dynamically

    const response = await gptApi.post(
      '/chat',
      {
        userInput,
        imageUrl,
        lessonId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Attach token to headers
        },
      }
    );

    console.log('✅ [GPTService] AI Response:', response.data);
    return response.data.reply;
  } catch (error) {
    console.error('❌ [GPTService] Error:', error?.response?.data || error.message);
    return 'Произошла ошибка при получении ответа от AI.';
  }
}
