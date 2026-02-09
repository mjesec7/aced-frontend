// src/services/GPTService.js - FULLY ENHANCED VERSION
import { auth } from '@/firebase';
import api from '@/api/core';
import { extractExerciseContent } from '@/utils/exerciseContentExtractor';

// Use the shared api instance from core.js for consistent baseURL handling
const gptApi = api;

/**
 * Simple message sender that extracts exercise context automatically
 * Use this when you need a straightforward AI chat with exercise awareness
 *
 * @param {string} message - User's message
 * @param {Object} currentExercise - Current exercise object (optional)
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<{text: string, usage?: Object}>}
 */
export async function sendMessage(message, currentExercise = null, language = 'en') {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authorized.');
    }

    if (!message?.trim()) {
      return { text: 'Please enter a message.' };
    }

    const token = await user.getIdToken();

    // EXTRACT: Convert the raw exercise JSON into readable text for AI
    const exerciseContext = extractExerciseContent(currentExercise, language);

    const response = await gptApi.post(
      '/chat',
      {
        userInput: message,
        exerciseContext, // Human-readable exercise description
        language,
        trackUsage: true,
        monthKey: getCurrentMonthKey()
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    const text = response.data?.reply ||
                 response.data?.text ||
                 response.data?.choices?.[0]?.message?.content ||
                 'AI could not provide an answer.';

    return {
      text,
      usage: response.data?.usage || null
    };

  } catch (error) {
    console.error('[GPTService] sendMessage error:', error);

    if (error.response?.status === 429) {
      return { text: 'Too many requests. Please wait and try again.' };
    }
    if (error.response?.status === 403) {
      return { text: 'Access restricted. Check your subscription plan.' };
    }

    return { text: 'Sorry, an error occurred. Please try again.' };
  }
}

// Helper function to get current month key
const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
};

// Helper function to check usage limits
const checkUsageLimits = (plan, currentUsage, hasImage = false) => {
  const limits = {
    free: { messages: 50, images: 5 },
    start: { messages: -1, images: 20 }, // -1 means unlimited
    pro: { messages: -1, images: -1 }
  };

  const planLimits = limits[plan] || limits.free;

  // Check message limit
  if (planLimits.messages !== -1 && currentUsage.messages >= planLimits.messages) {
    return {
      allowed: false,
      reason: 'message_limit_exceeded',
      message: `Достигнут лимит сообщений (${planLimits.messages}) для плана "${plan}". Обновите план для продолжения.`
    };
  }

  // Check image limit if image is attached
  if (hasImage && planLimits.images !== -1 && currentUsage.images >= planLimits.images) {
    return {
      allowed: false,
      reason: 'image_limit_exceeded',
      message: `Достигнут лимит изображений (${planLimits.images}) для плана "${plan}". Обновите план для продолжения.`
    };
  }

  return {
    allowed: true,
    remaining: {
      messages: planLimits.messages === -1 ? '∞' : Math.max(0, planLimits.messages - currentUsage.messages),
      images: planLimits.images === -1 ? '∞' : Math.max(0, planLimits.images - currentUsage.images)
    }
  };
};

// Function to get user usage for current month
export async function getUserUsage() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('❌ Пользователь не авторизован.');
    }

    const token = await user.getIdToken();

    const response = await gptApi.get('/chat/usage', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      usage: response.data.usage || { messages: 0, images: 0 },
      plan: response.data.plan || 'free',
      limits: response.data.limits || { messages: 50, images: 5 }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      usage: { messages: 0, images: 0 },
      plan: 'free'
    };
  }
}

// Enhanced AI response function with usage tracking
export async function getAIResponse(userInput, imageUrl = null, lessonId = null) {


  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('❌ Пользователь не авторизован.');
    }

    if (!userInput && !imageUrl) {
      return '⚠️ Введите вопрос или прикрепите изображение.';
    }

    const token = await user.getIdToken();

    // First, check current usage and limits
    const usageInfo = await getUserUsage();
    if (!usageInfo.success) {
      throw new Error('Не удалось проверить лимиты использования.');
    }

    // Check if request is within limits
    const limitCheck = checkUsageLimits(usageInfo.plan, usageInfo.usage, !!imageUrl);
    if (!limitCheck.allowed) {
      return `🚫 ${limitCheck.message}`;
    }


    // Make the AI request
    const response = await gptApi.post(
      '/chat',
      {
        userInput,
        imageUrl,
        lessonId,
        // Include usage tracking data
        trackUsage: true,
        monthKey: getCurrentMonthKey(),
        hasImage: !!imageUrl
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const reply =
      response.data?.reply ||
      response.data?.choices?.[0]?.message?.content ||
      '⚠️ AI не дал ответа.';

    // Log updated usage if provided
    if (response.data?.updatedUsage) {
    }

    return reply;

  } catch (error) {
    // Handle specific error types
    if (error.response?.status === 429) {
      return '⏳ Слишком много запросов. Попробуйте через некоторое время.';
    }

    if (error.response?.status === 403) {
      return '🚫 Доступ ограничен. Проверьте свой план подписки.';
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return '⏱️ Запрос занял слишком много времени. Попробуйте снова.';
    }

    // Check if it's a usage limit error from backend
    if (error.response?.data?.error?.includes('limit') || error.response?.data?.error?.includes('лимит')) {
      return `🚫 ${error.response.data.error}`;
    }

    const fallbackMessage = '❌ Произошла ошибка при получении ответа от AI.';
    const devMessage = error?.response?.data?.error || error.message || fallbackMessage;

    return process.env.NODE_ENV === 'development' ? devMessage : fallbackMessage;
  }
}

// ✅ ENHANCED: RAG-enabled lesson-context AI response with full context injection
// Returns: { reply: string, hasMemory?: boolean, messageCount?: number } or string on error
//
// RAG Architecture Flow:
// 1. Frontend sends: userInput, language, lessonContext, userProgress, stepContext
// 2. Backend fetches: Full lesson data, User progress history, Chat memory
// 3. Backend constructs: System prompt with all context for AI
// 4. AI generates: Context-aware response in the specified language
export async function getLessonAIResponse(userInput, lessonContext, userProgress, stepContext, language = 'en') {

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authorized.');
    }

    if (!userInput) {
      return 'Please ask a question about the lesson.';
    }

    // Check usage limits first
    const usageInfo = await getUserUsage();
    if (!usageInfo.success) {
      throw new Error('Failed to check usage limits');
    }

    const limitCheck = checkUsageLimits(usageInfo.plan, usageInfo.usage, false);
    if (!limitCheck.allowed) {
      return limitCheck.message;
    }

    const token = await user.getIdToken();

    // Build enriched lesson context for RAG (Context Injection)
    // This data is used by backend to construct the system prompt
    const enrichedLessonContext = {
      lessonId: lessonContext?.lessonId || lessonContext?._id || '',
      lessonName: lessonContext?.lessonName || lessonContext?.title || '',
      topic: lessonContext?.topic || '',
      subject: lessonContext?.subject || '',
      totalSteps: lessonContext?.totalSteps || 0
    };

    // Build enriched user progress for personalization
    // Backend uses this to identify user's weak areas
    const enrichedUserProgress = {
      currentStep: userProgress?.currentStep || 0,
      completedSteps: userProgress?.completedSteps || 0,
      mistakes: userProgress?.mistakes || 0,
      stars: userProgress?.stars || 0,
      progressPercent: userProgress?.progressPercent || 0,
      // Add difficulty tracking for personalization
      weakAreas: userProgress?.weakAreas || [],
      recentMistakes: userProgress?.recentMistakes || []
    };

    // Build enriched step context with exercise data
    // This allows AI to "see" the current exercise without revealing answers
    const enrichedStepContext = {
      type: stepContext?.type || 'explanation',
      stepIndex: stepContext?.stepIndex || 0,
      exerciseIndex: stepContext?.exerciseIndex,
      totalExercises: stepContext?.totalExercises,
      // Exercise data (question, options, etc. - NO correct answers)
      exerciseData: stepContext?.exerciseData || null,
      // Additional context for explanation steps
      content: stepContext?.content || null,
      // Include exercise content for AI analysis
      exerciseContent: stepContext?.exerciseContent || null
    };

    const response = await gptApi.post('/chat/lesson-context', {
      userInput,
      language: language || 'en', // CRITICAL: Pass language to backend
      lessonContext: enrichedLessonContext,
      userProgress: enrichedUserProgress,
      stepContext: enrichedStepContext,
      // Additional flags for backend processing
      trackUsage: true,
      monthKey: getCurrentMonthKey(),
      // Enable memory features
      enableMemory: true,
      enablePersonalization: true
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000
    });

    const reply = response.data?.reply || 'AI could not provide an answer.';

    // Return full response with memory and context info
    // Callers can use: const result = await getLessonAIResponse(...)
    // result.reply, result.hasMemory, result.messageCount
    return {
      reply,
      hasMemory: response.data?.hasMemory || false,
      messageCount: response.data?.messageCount || 0,
      // Additional response data for UI enhancements
      suggestions: response.data?.suggestions || [],
      contextUsed: response.data?.contextUsed || false,
      // Pass through usage info
      usage: response.data?.usage || null
    };

  } catch (error) {
    if (error.response?.status === 429) {
      return 'Too many requests. Please wait and try again.';
    }

    if (error.response?.status === 403) {
      return 'Access restricted. Check your subscription plan.';
    }

    return 'Sorry, an error occurred. Please try again.';
  }
}

// ✅ NEW: Generate contextual suggestions based on lesson step
export function generateLessonSuggestions(currentStep, userProgress) {
  const suggestions = [];

  if (!currentStep) return suggestions;

  switch (currentStep.type) {
    case 'explanation':
      suggestions.push(
        "Можешь объяснить это проще?",
        "Какие ключевые моменты я должен запомнить?",
        "Можешь привести пример из реальной жизни?"
      );
      break;

    case 'exercise':
      if (userProgress?.mistakes > 0) {
        suggestions.push(
          "У меня проблемы с этим, можешь дать подсказку?",
          "Какой подход мне использовать для решения?",
          "Помоги понять, что я делаю неправильно?"
        );
      } else {
        suggestions.push(
          "Правильно ли мой подход?",
          "На чём мне сосредоточиться в этом упражнении?",
          "Можешь проверить моё понимание?"
        );
      }
      break;

    case 'quiz':
    case 'tryout':
      suggestions.push(
        "Я не уверен в этом вопросе, поможешь?",
        "О чём мне думать при ответе на этот вопрос?",
        "Можешь провести меня через это пошагово?"
      );
      break;

    case 'vocabulary':
      suggestions.push(
        "Поможешь запомнить это слово?",
        "Как лучше использовать это слово?",
        "Можешь дать больше примеров?"
      );
      break;

    default:
      suggestions.push(
        "Можешь помочь мне лучше понять это?",
        "На чём мне здесь сосредоточиться?",
        "Есть ли что-то важное, что я должен запомнить?"
      );
  }

  return suggestions;
}

// ✅ NEW: Smart hint generation for when students are struggling
export async function generateSmartHint(exercise, mistakeCount, lessonContext) {
  if (mistakeCount < 2) return null; // Only provide hints after 2+ mistakes

  try {
    const user = auth.currentUser;
    if (!user) return null;

    const token = await user.getIdToken();

    const response = await gptApi.post('/chat/smart-hint', {
      exercise,
      mistakeCount,
      lessonContext
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000
    });

    return response.data?.reply || "Не переживай! Потрать немного времени на размышления о ключевых концепциях из этого урока. У тебя получится! 💪";
  } catch (error) {
    return "Не переживай! Потрать немного времени на размышления о ключевых концепциях из этого урока. У тебя получится! 💪";
  }
}

// ✅ NEW: Progress insights and encouragement
export async function generateProgressInsight(userProgress, lessonContext) {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const token = await user.getIdToken();

    const response = await gptApi.post('/chat/progress-insight', {
      userProgress,
      lessonContext
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000
    });

    const completionPercent = Math.round((userProgress.completedSteps.length / lessonContext.totalSteps) * 100);
    return response.data?.reply || `Отличный прогресс! Вы завершили ${completionPercent}% урока. Продолжайте в том же духе! 🌟`;
  } catch (error) {
    const completionPercent = Math.round((userProgress.completedSteps.length / lessonContext.totalSteps) * 100);
    return `Отличный прогресс! Вы завершили ${completionPercent}% урока. Продолжайте в том же духе! 🌟`;
  }
}

// ✅ NEW: Get help with explanations
export async function getExplanationHelp(explanationText, userQuestion, lessonContext) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Пользователь не авторизован');

    const token = await user.getIdToken();

    const response = await gptApi.post('/chat/explanation-help', {
      explanationText,
      userQuestion,
      lessonContext
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000
    });

    return response.data?.reply || 'Не удалось получить помощь с объяснением. Попробуйте переформулировать вопрос.';
  } catch (error) {
    return 'Не удалось получить помощь с объяснением. Попробуйте переформулировать вопрос.';
  }
}

// Function to reset monthly usage (for admin/testing purposes)
export async function resetMonthlyUsage() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('❌ Пользователь не авторизован.');
    }

    const token = await user.getIdToken();
    const monthKey = getCurrentMonthKey();

    const response = await gptApi.post(
      `/users/${user.uid}/usage/${monthKey}/reset`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { success: true, data: response.data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to get usage statistics
export async function getUsageStats(months = 3) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('❌ Пользователь не авторизован.');
    }

    const token = await user.getIdToken();

    const response = await gptApi.get(`/users/${user.uid}/usage/stats`, {
      params: { months },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      stats: response.data.stats || [],
      totalUsage: response.data.totalUsage || { messages: 0, images: 0 },
      averageDaily: response.data.averageDaily || { messages: 0, images: 0 }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      stats: [],
      totalUsage: { messages: 0, images: 0 }
    };
  }
}

// Function to check if user can upgrade plan
export async function checkUpgradeEligibility() {
  try {
    const usageInfo = await getUserUsage();
    if (!usageInfo.success) return { canUpgrade: false };

    const plan = usageInfo.plan;
    const usage = usageInfo.usage;

    // Suggest upgrade based on usage patterns
    let suggestion = null;

    if (plan === 'free') {
      if (usage.messages > 30 || usage.images > 3) {
        suggestion = {
          recommendedPlan: 'start',
          reason: 'Вы активно используете помощника. План Start даст вам безлимитные сообщения.',
          benefits: ['Безлимитные сообщения', '20 изображений в месяц', 'Приоритетная поддержка']
        };
      }
    } else if (plan === 'start') {
      if (usage.images > 15) {
        suggestion = {
          recommendedPlan: 'pro',
          reason: 'Вы часто используете изображения. План Pro даст полную свободу.',
          benefits: ['Безлимитные сообщения', 'Безлимитные изображения', 'Премиум функции']
        };
      }
    }

    return {
      canUpgrade: plan !== 'pro',
      currentPlan: plan,
      usage: usage,
      suggestion: suggestion
    };

  } catch (error) {
    return { canUpgrade: false, error: error.message };
  }
}

// Helper function for frontend to display usage info
export const formatUsageDisplay = (usage, plan) => {
  const limits = {
    free: { messages: 50, images: 5 },
    start: { messages: -1, images: 20 },
    pro: { messages: -1, images: -1 }
  };

  const planLimits = limits[plan] || limits.free;

  return {
    messages: {
      used: usage.messages || 0,
      limit: planLimits.messages,
      remaining: planLimits.messages === -1 ? '∞' : Math.max(0, planLimits.messages - (usage.messages || 0)),
      percentage: planLimits.messages === -1 ? 0 : Math.min(100, ((usage.messages || 0) / planLimits.messages) * 100)
    },
    images: {
      used: usage.images || 0,
      limit: planLimits.images,
      remaining: planLimits.images === -1 ? '∞' : Math.max(0, planLimits.images - (usage.images || 0)),
      percentage: planLimits.images === -1 ? 0 : Math.min(100, ((usage.images || 0) / planLimits.images) * 100)
    }
  };
};

// Export helper functions
export {
  getCurrentMonthKey,
  checkUsageLimits
};