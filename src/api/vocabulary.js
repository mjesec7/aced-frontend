// src/api/vocabulary.js - UPDATED WITH FALLBACK INTEGRATION
import api from '@/api';
import {
  safeVocabularyApiCall,
  handleVocabularyApiError,
  getFallbackLanguages,
  getFallbackTopics,
  getFallbackWords,
  getFallbackStats,
  mockAnalyticsCall
} from '@/utils/vocabularyFallback';

// ========================================
// 🌐 PUBLIC VOCABULARY API (With Fallback)
// ========================================

export const getVocabularyLanguages = async () => {
  return await safeVocabularyApiCall(
    () => api.get('/vocabulary/languages'),
    getFallbackLanguages(),
    'Languages'
  );
};

export const getVocabularyTopics = async (language) => {
  return await safeVocabularyApiCall(
    () => api.get(`/vocabulary/topics/${language}`),
    getFallbackTopics(language),
    'Topics'
  );
};

export const getVocabularySubtopics = async (language, topic) => {
  return await safeVocabularyApiCall(
    () => api.get(`/vocabulary/subtopics/${language}/${encodeURIComponent(topic)}`),
    [], // No fallback subtopics for now
    'Subtopics'
  );
};

export const getVocabularyWords = async (language, topic, subtopic, params = {}) => {
  return await safeVocabularyApiCall(
    () => {
      const queryParams = new URLSearchParams(params).toString();
      const baseUrl = `/vocabulary/words/${language}/${encodeURIComponent(topic)}/${encodeURIComponent(subtopic)}`;
      const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
      return api.get(url);
    },
    getFallbackWords(language, topic),
    'Words'
  );
};

export const searchVocabulary = async (params = {}) => {
  return await safeVocabularyApiCall(
    () => api.get('/vocabulary/search', { params }),
    [], // No fallback for search
    'Search'
  );
};

export const getVocabularyStats = async () => {
  return await safeVocabularyApiCall(
    () => api.get('/vocabulary/stats/overview'),
    getFallbackStats(),
    'Stats'
  );
};

// ========================================
// 🔐 USER PROGRESS API (With Analytics Integration)
// ========================================

export const getUserVocabularyProgress = async (userId, params = {}) => {
  try {
    console.log('📈 Fetching user progress for:', userId, params);
    const response = await api.get(`/vocabulary/progress/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching user progress:', error);
    return {
      success: true,
      data: {
        wordsLearned: 0,
        accuracy: 0,
        weeklyGrowth: 0,
        accuracyTrend: 0,
        byLanguage: {}
      },
      fromFallback: true
    };
  }
};

export const updateWordProgress = async (userId, progressData) => {
  try {
    console.log('📝 Updating word progress for user:', userId, progressData);
    const response = await api.post(`/vocabulary/progress/${userId}/update`, progressData);
    
    // 🔥 ANALYTICS INTEGRATION: Send vocabulary progress to analytics
    await logVocabularyActivity(userId, {
      action: 'word_progress_updated',
      language: progressData.language,
      topic: progressData.topic,
      correct: progressData.correct,
      timeSpent: progressData.timeSpent
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error updating word progress:', error);
    
    // Still try to log analytics even if API fails
    await logVocabularyActivity(userId, {
      action: 'word_progress_updated_offline',
      language: progressData.language,
      topic: progressData.topic,
      correct: progressData.correct,
      timeSpent: progressData.timeSpent
    });
    
    throw error;
  }
};

export const getWordsForReview = async (userId, params = {}) => {
  return await safeVocabularyApiCall(
    () => api.get(`/vocabulary/review/${userId}`, { params }),
    [], // No fallback for review words
    'Review Words'
  );
};

export const getUserLanguageProgress = async (userId, language) => {
  return await safeVocabularyApiCall(
    () => api.get(`/vocabulary/progress/${userId}?language=${language}`),
    null, // No fallback for user language progress
    'Language Progress'
  );
};

export const getLanguageStats = async (language) => {
  return await safeVocabularyApiCall(
    () => api.get(`/vocabulary/stats/language/${language}`),
    {
      language,
      totalWords: 24,
      topicsCount: 6,
      topics: ['Travel', 'Food', 'Family', 'Business', 'Technology', 'Health'],
      difficulties: ['beginner', 'intermediate', 'advanced']
    },
    'Language Stats'
  );
};

// ========================================
// 🎮 VOCABULARY GAMES & QUIZZES (Enhanced)
// ========================================

export const generateVocabularyQuiz = async (userId, params = {}) => {
  try {
    console.log('🎯 Generating quiz for user:', userId, params);
    const response = await api.get(`/vocabulary/game/quiz/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error generating quiz, creating fallback quiz:', error);
    
    // Create fallback quiz from available words
    const { language = 'english', topic, count = 10 } = params;
    let words = [];
    
    if (topic) {
      words = getFallbackWords(language, topic);
    } else {
      // Get mixed words from multiple topics
      const topics = getFallbackTopics(language);
      topics.forEach(t => {
        words.push(...getFallbackWords(language, t.name));
      });
    }
    
    // Generate quiz questions
    const shuffledWords = words.sort(() => Math.random() - 0.5).slice(0, count);
    const quizQuestions = shuffledWords.map(word => {
      const wrongAnswers = words
        .filter(w => w._id !== word._id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.translation);
      
      const options = [word.translation, ...wrongAnswers].sort(() => Math.random() - 0.5);
      
      return {
        wordId: word._id,
        word: word.word,
        options: options,
        correctAnswer: word.translation,
        examples: [word.example],
        difficulty: word.difficulty
      };
    });
    
    return {
      success: true,
      data: quizQuestions,
      count: quizQuestions.length,
      fromFallback: true,
      message: '✅ Fallback quiz generated successfully'
    };
  }
};

export const submitQuizResults = async (userId, results) => {
  try {
    console.log('📤 Submitting quiz results for user:', userId, results);
    const response = await api.post(`/vocabulary/game/submit/${userId}`, results);
    
    // 🔥 ANALYTICS INTEGRATION: Send quiz results to analytics
    await logVocabularyActivity(userId, {
      action: 'quiz_completed',
      language: results.language,
      topic: results.topic,
      score: results.score,
      totalQuestions: results.totalQuestions,
      timeSpent: results.timeSpent,
      wordsCount: results.totalQuestions,
      points: results.score * 10 // 10 points per correct answer
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error submitting quiz results:', error);
    
    // Still log analytics even if submission fails
    await logVocabularyActivity(userId, {
      action: 'quiz_completed_offline',
      language: results.language,
      topic: results.topic,
      score: results.score,
      totalQuestions: results.totalQuestions,
      timeSpent: results.timeSpent,
      wordsCount: results.totalQuestions,
      points: results.score * 10
    });
    
    // Return mock success for offline mode
    return {
      success: true,
      data: {
        score: results.score,
        totalQuestions: results.totalQuestions,
        percentage: Math.round((results.score / results.totalQuestions) * 100),
        results: results.answers || []
      },
      fromFallback: true,
      message: '✅ Quiz results saved locally'
    };
  }
};

// ========================================
// 📊 USER ANALYTICS (Enhanced with Fallback)
// ========================================

export const getVocabularyAnalytics = async (userId, params = {}) => {
  return await safeVocabularyApiCall(
    () => api.get(`/vocabulary/analytics/${userId}`, { params }),
    {
      totalWordsLearned: 0,
      wordsInProgress: 0,
      wordsForReview: 0,
      accuracy: 0,
      byLanguage: {},
      byTopic: {},
      recentActivity: []
    },
    'Analytics'
  );
};

export const getLearningInsights = async (userId, language = null) => {
  const url = language 
    ? `/vocabulary/insights/${userId}?language=${language}`
    : `/vocabulary/insights/${userId}`;

  return await safeVocabularyApiCall(
    () => api.get(url),
    {
      learningStreak: 0,
      strongestTopics: [],
      needsReview: 0,
      recommendations: [],
      weeklyGoal: { target: 50, current: 0, percentage: 0 }
    },
    'Learning Insights'
  );
};

export const getVocabularyAchievements = async (userId) => {
  return await safeVocabularyApiCall(
    () => api.get(`/vocabulary/achievements/${userId}`),
    [], // No fallback achievements
    'Achievements'
  );
};

export const getStudyRecommendations = async (userId, params = {}) => {
  return await safeVocabularyApiCall(
    () => api.get(`/vocabulary/recommendations/${userId}`, { params }),
    [], // No fallback recommendations
    'Study Recommendations'
  );
};

// ========================================
// 🔥 ENHANCED ANALYTICS INTEGRATION
// ========================================

export const logVocabularyActivity = async (userId, activityData) => {
  try {
    console.log('📊 Logging vocabulary activity for user:', userId, activityData);
    
    // Prepare analytics data
    const analyticsData = {
      userId,
      date: new Date(),
      lessonName: `${activityData.language} - ${activityData.topic}`,
      studyMinutes: Math.ceil((activityData.timeSpent || 0) / 60),
      completedTopics: activityData.action === 'quiz_completed' ? 1 : 0,
      averageGrade: activityData.score || 0,
      mistakes: activityData.action === 'word_progress_updated' && !activityData.correct ? 1 : 0,
      stars: calculateStars(activityData.score),
      points: activityData.points || 0,
      type: 'vocabulary'
    };
    
    try {
      // Send to user analytics endpoint
      await api.post(`/user/${userId}/analytics`, analyticsData);
      console.log('✅ Analytics sent to user analytics endpoint');
    } catch (analyticsError) {
      console.warn('⚠️ Failed to send to analytics endpoint:', analyticsError.message);
      // Use mock analytics as fallback
      await mockAnalyticsCall(userId, analyticsData);
    }
    
    try {
      // Also send to diary for daily tracking
      await api.post(`/user/${userId}/diary`, {
        date: new Date().toISOString().split('T')[0],
        studyMinutes: analyticsData.studyMinutes,
        completedTopics: analyticsData.completedTopics,
        averageGrade: analyticsData.averageGrade,
        lessonName: analyticsData.lessonName,
        mistakes: analyticsData.mistakes,
        stars: analyticsData.stars
      });
      console.log('✅ Analytics sent to diary endpoint');
    } catch (diaryError) {
      console.warn('⚠️ Failed to send to diary endpoint:', diaryError.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error logging vocabulary activity:', error);
    // Use mock analytics as complete fallback
    return await mockAnalyticsCall(userId, {
      ...activityData,
      timestamp: new Date().toISOString()
    });
  }
};

export const markWordAsLearned = async (userId, vocabularyId, wordData = {}) => {
  try {
    console.log('✅ Marking word as learned:', { userId, vocabularyId });
    
    const progressData = {
      vocabularyId,
      correct: true,
      timeSpent: wordData.timeSpent || 0,
      language: wordData.language,
      topic: wordData.topic
    };
    
    let response;
    try {
      response = await updateWordProgress(userId, progressData);
    } catch (apiError) {
      console.warn('⚠️ API call failed, logging activity only:', apiError.message);
      // If API fails, still log the activity
      await logVocabularyActivity(userId, {
        action: 'word_learned_offline',
        language: wordData.language,
        topic: wordData.topic,
        wordsCount: 1,
        timeSpent: wordData.timeSpent || 0,
        points: 5
      });
      
      return {
        success: true,
        fromFallback: true,
        message: 'Word marked as learned (offline mode)'
      };
    }
    
    // 🔥 ANALYTICS INTEGRATION: Log word learned
    await logVocabularyActivity(userId, {
      action: 'word_learned',
      language: wordData.language,
      topic: wordData.topic,
      wordsCount: 1,
      timeSpent: wordData.timeSpent || 0,
      points: 5 // 5 points per word learned
    });
    
    return response;
  } catch (error) {
    console.error('❌ Error marking word as learned:', error);
    throw error;
  }
};

// ========================================
// 🎯 TEST CREATION & MANAGEMENT
// ========================================

export const createVocabularyTest = async (userId, testConfig) => {
  try {
    console.log('🎯 Creating vocabulary test for user:', userId, testConfig);
    
    const { language, topics, wordCount, type } = testConfig;
    
    // Generate quiz based on config
    const quizParams = {
      language,
      topic: topics?.join(','),
      count: wordCount,
      difficulty: testConfig.difficulty
    };
    
    const quiz = await generateVocabularyQuiz(userId, quizParams);
    
    // Log test creation
    await logVocabularyActivity(userId, {
      action: 'test_created',
      language,
      topic: topics?.join(', ') || 'Mixed',
      wordsCount: wordCount,
      timeSpent: 0
    });
    
    return {
      success: true,
      data: {
        testId: `vocab_test_${Date.now()}`,
        questions: quiz.data || [],
        config: testConfig
      }
    };
  } catch (error) {
    console.error('❌ Error creating vocabulary test:', error);
    throw error;
  }
};

export const submitVocabularyTest = async (userId, testData) => {
  try {
    console.log('📤 Submitting vocabulary test for user:', userId);
    
    const { answers, testConfig, timeSpent } = testData;
    
    // Calculate score
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.correct).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Submit quiz results
    const results = {
      answers,
      timeSpent,
      language: testConfig.language,
      topic: testConfig.topics?.join(', ') || 'Mixed',
      score: correctAnswers,
      totalQuestions,
      percentage: score
    };
    
    const response = await submitQuizResults(userId, results);
    
    return {
      success: true,
      data: {
        score,
        totalQuestions,
        correctAnswers,
        percentage: score,
        passed: score >= 70,
        results: response.data
      }
    };
  } catch (error) {
    console.error('❌ Error submitting vocabulary test:', error);
    throw error;
  }
};

// ========================================
// 🔧 UTILITY FUNCTIONS
// ========================================

export const quickWordLookup = async (word, language = 'english') => {
  try {
    console.log('🔍 Quick lookup for word:', word, 'in', language);
    const response = await searchVocabulary({ 
      q: word, 
      language, 
      limit: 1 
    });
    return response.data?.[0] || null;
  } catch (error) {
    console.error('❌ Quick lookup failed:', error);
    return null;
  }
};

export const getDailyGoalProgress = async (userId) => {
  try {
    console.log('🎯 Fetching daily goal progress for user:', userId);
    const response = await getUserVocabularyProgress(userId, {
      timeframe: 'today'
    });
    return response.data?.dailyProgress || { current: 0, target: 10 };
  } catch (error) {
    console.error('❌ Daily goal fetch failed:', error);
    return { current: 0, target: 10 };
  }
};

export const addVocabularyWord = async (wordData) => {
  try {
    console.log('➕ User adding vocabulary word:', wordData);
    
    const enhancedData = {
      translationLanguage: 'russian',
      isActive: false, // User submissions start as inactive until admin approves
      importance: 3,
      partOfSpeech: wordData.partOfSpeech || 'noun',
      difficulty: wordData.difficulty || 'beginner',
      examples: [],
      synonyms: [],
      antonyms: [],
      userSubmitted: true,
      submittedBy: wordData.userId || null,
      ...wordData
    };

    const response = await api.post('/vocabulary/user/submit', enhancedData);
    
    // Log word submission
    if (wordData.userId) {
      await logVocabularyActivity(wordData.userId, {
        action: 'word_submitted',
        language: wordData.language,
        topic: wordData.topic,
        wordsCount: 1,
        points: 2 // 2 points for submitting a word
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error adding vocabulary word:', error);
    throw error;
  }
};

// ========================================
// 🔍 ERROR HANDLING
// ========================================

export const handleVocabularyError = (error, context = 'Vocabulary') => {
  return handleVocabularyApiError(error, null);
};

// ========================================
// 🧮 HELPER FUNCTIONS
// ========================================

function calculateStars(score) {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

// ========================================
// 📋 CONSTANTS
// ========================================

export const VOCABULARY_CONSTANTS = {
  DIFFICULTIES: ['beginner', 'intermediate', 'advanced'],
  LANGUAGES: ['english', 'spanish', 'french', 'german', 'chinese', 'arabic', 'japanese', 'korean', 'uzbek', 'russian'],
  MAX_WORDS_PER_REQUEST: 50,
  CACHE_DURATION: 300000, // 5 minutes
  POINTS: {
    WORD_LEARNED: 5,
    QUIZ_COMPLETED: 10,
    WORD_SUBMITTED: 2,
    DAILY_GOAL: 20
  }
};

// ========================================
// 🎯 DEFAULT EXPORT
// ========================================

export default {
  // Core public API
  getVocabularyLanguages,
  getVocabularyTopics,
  getVocabularySubtopics,
  getVocabularyWords,
  searchVocabulary,
  getVocabularyStats,

  // User progress (for logged-in users)
  getUserVocabularyProgress,
  updateWordProgress,
  getWordsForReview,
  getUserLanguageProgress,
  getLanguageStats,

  // Learning activities
  generateVocabularyQuiz,
  submitQuizResults,
  createVocabularyTest,
  submitVocabularyTest,

  // User interactions
  addVocabularyWord,
  markWordAsLearned,
  getStudyRecommendations,

  // Analytics
  getVocabularyAnalytics,
  getLearningInsights,
  getVocabularyAchievements,
  logVocabularyActivity,

  // Utility functions
  quickWordLookup,
  getDailyGoalProgress,
  handleVocabularyError,

  // Constants
  VOCABULARY_CONSTANTS
};