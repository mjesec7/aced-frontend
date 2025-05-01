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

    if (!userInput && !imageUrl) {
      return '⚠️ Введите вопрос или прикрепите изображение.';
    }

    const token = await user.getIdToken();

    const response = await gptApi.post(
      '/chat',
      {
        userInput,
        imageUrl,
        lessonId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const reply =
      response.data?.reply ||
      response.data?.choices?.[0]?.message?.content ||
      '⚠️ AI не дал ответа.';

    console.log('✅ [GPTService] AI Response:', reply);
    return reply;
  } catch (error) {
    const fallbackMessage = '❌ Произошла ошибка при получении ответа от AI.';
    const devMessage =
      error?.response?.data?.error || error.message || fallbackMessage;

    console.error('❌ [GPTService] Error:', devMessage);

    return process.env.NODE_ENV === 'development' ? devMessage : fallbackMessage;
  }
}
