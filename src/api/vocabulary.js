// src/api/vocabulary.js - CLEAN VERSION WITHOUT FALLBACK
import api from '@/api';

// ========================================
// 🌐 PUBLIC VOCABULARY API
// ========================================

export const getVocabularyLanguages = async () => {
  try {
    const response = await api.get('/vocabulary/languages');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching languages:', error);
    throw error;
  }
};

export const getVocabularyTopics = async (language) => {
  try {
    const response = await api.get(`/vocabulary/topics/${language}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching topics:', error);
    throw error;
  }
};

export const getVocabularySubtopics = async (language, topic) => {
  try {
    const response = await api.get(`/vocabulary/subtopics/${language}/${encodeURIComponent(topic)}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching subtopics:', error);
    throw error;
  }
};

export const getVocabularyWords = async (language, topic, subtopic, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const baseUrl = `/vocabulary/words/${language}/${encodeURIComponent(topic)}/${encodeURIComponent(subtopic)}`;
    const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching words:', error);
    throw error;
  }
};

export const searchVocabulary = async (params = {}) => {
  try {
    const response = await api.get('/vocabulary/search', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error searching vocabulary:', error);
    throw error;
  }
};

export const getVocabularyStats = async () => {
  try {
    const response = await api.get('/vocabulary/stats/overview');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    throw error;
  }
};

// ========================================
// 🔐 USER PROGRESS API (With Analytics Integration)
// ========================================

export const getUserVocabularyProgress = async (userId, params = {}) => {
  try {
    const response = await api.get(`/vocabulary/progress/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching user progress:', error);
    throw error;
  }
};

export const updateWordProgress = async (userId, progressData) => {
  try {
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
    try {
      await logVocabularyActivity(userId, {
        action: 'word_progress_updated_offline',
        language: progressData.language,
        topic: progressData.topic,
        correct: progressData.correct,
        timeSpent: progressData.timeSpent
      });
    } catch (analyticsError) {
      console.warn('⚠️ Analytics logging also failed:', analyticsError);
    }
    
    throw error;
  }
};

export const getWordsForReview = async (userId, params = {}) => {
  try {
    const response = await api.get(`/vocabulary/review/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching review words:', error);
    throw error;
  }
};

export const getUserLanguageProgress = async (userId, language) => {
  try {
    const response = await api.get(`/vocabulary/progress/${userId}?language=${language}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching language progress:', error);
    throw error;
  }
};

export const getLanguageStats = async (language) => {
  try {
    const response = await api.get(`/vocabulary/stats/language/${language}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching language stats:', error);
    throw error;
  }
};

// ========================================
// 🎮 VOCABULARY GAMES & QUIZZES
// ========================================

export const generateVocabularyQuiz = async (userId, params = {}) => {
  try {
    const response = await api.get(`/vocabulary/game/quiz/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error generating quiz:', error);
    throw error;
  }
};

export const submitQuizResults = async (userId, results) => {
  try {
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
    try {
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
    } catch (analyticsError) {
      console.warn('⚠️ Analytics logging failed:', analyticsError);
    }
    
    throw error;
  }
};

// ========================================
// 📊 USER ANALYTICS
// ========================================

export const getVocabularyAnalytics = async (userId, params = {}) => {
  try {
    const response = await api.get(`/vocabulary/analytics/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    throw error;
  }
};

export const getLearningInsights = async (userId, language = null) => {
  try {
    const url = language 
      ? `/vocabulary/insights/${userId}?language=${language}`
      : `/vocabulary/insights/${userId}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching learning insights:', error);
    throw error;
  }
};

export const getVocabularyAchievements = async (userId) => {
  try {
    const response = await api.get(`/vocabulary/achievements/${userId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching achievements:', error);
    throw error;
  }
};

export const getStudyRecommendations = async (userId, params = {}) => {
  try {
    const response = await api.get(`/vocabulary/recommendations/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching study recommendations:', error);
    throw error;
  }
};

// ========================================
// 🔥 ANALYTICS INTEGRATION
// ========================================

export const logVocabularyActivity = async (userId, activityData) => {
  try {
    
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
    } catch (analyticsError) {
      console.warn('⚠️ Failed to send to analytics endpoint:', analyticsError.message);
      throw analyticsError;
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
    } catch (diaryError) {
      console.warn('⚠️ Failed to send to diary endpoint:', diaryError.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error logging vocabulary activity:', error);
    throw error;
  }
};

export const markWordAsLearned = async (userId, vocabularyId, wordData = {}) => {
  try {
    
    const progressData = {
      vocabularyId,
      correct: true,
      timeSpent: wordData.timeSpent || 0,
      language: wordData.language,
      topic: wordData.topic
    };
    
    const response = await updateWordProgress(userId, progressData);
    
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
  console.error(`❌ ${context} Error:`, error);
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    context
  };
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