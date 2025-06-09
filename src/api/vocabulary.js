// src/api/vocabulary.js - MAIN FRONTEND (aced.live) Vocabulary API
import api from '@/api'; // This imports from src/api.js (main frontend API instance)

// ========================================
// 🌐 PUBLIC VOCABULARY API (Main Frontend)
// ========================================

// Get all available languages
export const getVocabularyLanguages = () => {
  console.log('🌍 Main Frontend: Fetching vocabulary languages...');
  return api.get('/vocabulary/languages');
};

// Get topics for a specific language
export const getVocabularyTopics = (language) => {
  console.log('📚 Main Frontend: Fetching topics for language:', language);
  return api.get(`/vocabulary/topics/${language}`);
};

// Get subtopics for a language/topic
export const getVocabularySubtopics = (language, topic) => {
  console.log('📖 Main Frontend: Fetching subtopics for:', language, topic);
  return api.get(`/vocabulary/subtopics/${language}/${encodeURIComponent(topic)}`);
};

// Get words for a specific subtopic
export const getVocabularyWords = (language, topic, subtopic, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/words/${language}/${encodeURIComponent(topic)}/${encodeURIComponent(subtopic)}`;
  const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  
  console.log('📝 Main Frontend: Fetching words:', { language, topic, subtopic, params });
  return api.get(url);
};

// Search vocabulary words
export const searchVocabulary = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  console.log('🔍 Main Frontend: Searching vocabulary with params:', params);
  return api.get(`/vocabulary/search?${queryParams}`);
};

// Get vocabulary statistics
export const getVocabularyStats = () => {
  console.log('📊 Main Frontend: Fetching vocabulary statistics...');
  return api.get('/vocabulary/stats/overview');
};

// ========================================
// 🔐 USER PROGRESS API (Main Frontend - Authenticated Users)
// ========================================

// Get user's vocabulary progress
export const getUserVocabularyProgress = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/progress/${userId}`;
  const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  
  console.log('📈 Main Frontend: Fetching user progress for:', userId, params);
  return api.get(url);
};

// Update word learning progress
export const updateWordProgress = (userId, progressData) => {
  console.log('📝 Main Frontend: Updating word progress for user:', userId, progressData);
  return api.post(`/vocabulary/progress/${userId}/update`, progressData);
};

// Get words due for review
export const getWordsForReview = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/review/${userId}`;
  const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  
  console.log('🔄 Main Frontend: Fetching words for review for user:', userId, params);
  return api.get(url);
};

// Get user's language-specific progress
export const getUserLanguageProgress = (userId, language) => {
  console.log('🌍 Main Frontend: Fetching language progress for user:', userId, 'language:', language);
  return api.get(`/vocabulary/progress/${userId}?language=${language}`);
};

// Get language-specific statistics
export const getLanguageStats = (language) => {
  console.log('📊 Main Frontend: Fetching language stats for:', language);
  return api.get(`/vocabulary/stats/language/${language}`);
};

// ========================================
// 🎮 VOCABULARY GAMES & QUIZZES (Main Frontend)
// ========================================

// Generate quiz for user
export const generateVocabularyQuiz = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/game/quiz/${userId}`;
  const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  
  console.log('🎯 Main Frontend: Generating quiz for user:', userId, params);
  return api.get(url);
};

// Submit quiz results
export const submitQuizResults = (userId, results) => {
  console.log('📤 Main Frontend: Submitting quiz results for user:', userId, results);
  return api.post(`/vocabulary/game/submit/${userId}`, results);
};

// ========================================
// ✏️ USER WORD SUBMISSION (Main Frontend)
// ========================================

// Add a word (user submission - simplified for main frontend)
export const addVocabularyWord = (wordData) => {
  console.log('➕ Main Frontend: User adding vocabulary word:', wordData);
  
  // For main frontend, users can suggest words but need admin approval
  const enhancedData = {
    translationLanguage: 'russian',
    isActive: false, // User submissions start as inactive until admin approves
    importance: 3,
    partOfSpeech: wordData.partOfSpeech || 'noun',
    difficulty: wordData.difficulty || 'beginner',
    examples: [],
    synonyms: [],
    antonyms: [],
    userSubmitted: true, // Flag to identify user submissions
    submittedBy: wordData.userId || null,
    ...wordData
  };

  // This might go to a different endpoint for user submissions
  return api.post('/vocabulary/user/submit', enhancedData);
};

// ========================================
// 📊 USER ANALYTICS (Main Frontend)
// ========================================

// Get user's vocabulary analytics
export const getVocabularyAnalytics = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/analytics/${userId}`;
  const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  
  console.log('📊 Main Frontend: Fetching vocabulary analytics for user:', userId, params);
  return api.get(url);
};

// Get learning insights
export const getLearningInsights = (userId, language = null) => {
  const url = language
    ? `/vocabulary/insights/${userId}?language=${language}`
    : `/vocabulary/insights/${userId}`;
    
  console.log('💡 Main Frontend: Fetching learning insights for user:', userId, 'language:', language);
  return api.get(url);
};

// Get user achievements
export const getVocabularyAchievements = (userId) => {
  console.log('🏆 Main Frontend: Fetching achievements for user:', userId);
  return api.get(`/vocabulary/achievements/${userId}`);
};

// ========================================
// 🔧 UTILITY FUNCTIONS (Main Frontend)
// ========================================

// Mark word as learned
export const markWordAsLearned = (userId, vocabularyId) => {
  console.log('✅ Main Frontend: Marking word as learned:', { userId, vocabularyId });
  return updateWordProgress(userId, {
    vocabularyId,
    correct: true,
    timeSpent: 0
  });
};

// Get study recommendations
export const getStudyRecommendations = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/recommendations/${userId}`;
  const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  
  console.log('💡 Main Frontend: Fetching study recommendations for user:', userId, params);
  return api.get(url);
};

// Quick word lookup for main frontend
export const quickWordLookup = async (word, language = 'english') => {
  try {
    console.log('🔍 Main Frontend: Quick lookup for word:', word, 'in', language);
    const response = await searchVocabulary({ 
      q: word, 
      language, 
      limit: 1 
    });
    return response.data?.[0] || null;
  } catch (error) {
    console.error('❌ Main Frontend: Quick lookup failed:', error);
    return null;
  }
};

// Get user's daily vocabulary goal progress
export const getDailyGoalProgress = async (userId) => {
  try {
    console.log('🎯 Main Frontend: Fetching daily goal progress for user:', userId);
    const response = await getUserVocabularyProgress(userId, {
      timeframe: 'today'
    });
    return response.data?.dailyProgress || { current: 0, target: 10 };
  } catch (error) {
    console.error('❌ Main Frontend: Daily goal fetch failed:', error);
    return { current: 0, target: 10 };
  }
};

// ========================================
// 🔍 ERROR HANDLING (Main Frontend)
// ========================================

// Error handler for main frontend
export const handleVocabularyError = (error, context = 'Vocabulary') => {
  console.error(`❌ Main Frontend ${context} Error:`, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
    data: error.response?.data
  });

  // Return user-friendly error message in Russian for main site
  if (error.response?.status === 401) {
    return 'Необходимо войти в систему для доступа к словарю';
  } else if (error.response?.status === 403) {
    return 'Доступ к этой функции ограничен';
  } else if (error.response?.status === 404) {
    return 'Словарные данные не найдены';
  } else if (error.response?.status >= 500) {
    return 'Ошибка сервера. Попробуйте позже';
  } else {
    return error.response?.data?.message || error.message || 'Произошла ошибка';
  }
};

// ========================================
// 📋 CONSTANTS FOR MAIN FRONTEND
// ========================================

export const VOCABULARY_CONSTANTS = {
  DIFFICULTIES: ['beginner', 'intermediate', 'advanced'],
  LANGUAGES: ['english', 'spanish', 'french', 'german', 'chinese', 'arabic', 'japanese', 'korean', 'uzbek', 'russian'],
  MAX_WORDS_PER_REQUEST: 50, // Lower limit for main frontend
  CACHE_DURATION: 300000 // 5 minutes
};

// ========================================
// 🎯 MAIN FRONTEND DEFAULT EXPORT
// ========================================

// Export only functions needed for main frontend users
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

  // User interactions
  addVocabularyWord, // User submissions
  markWordAsLearned,
  getStudyRecommendations,

  // Analytics for users
  getVocabularyAnalytics,
  getLearningInsights,
  getVocabularyAchievements,

  // Utility functions
  quickWordLookup,
  getDailyGoalProgress,
  handleVocabularyError,

  // Constants
  VOCABULARY_CONSTANTS
};