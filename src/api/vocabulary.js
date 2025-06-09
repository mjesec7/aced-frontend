// src/api/vocabulary.js - Vocabulary API Functions
import api from '@/api'; // Your existing API instance

// ========================================
// 🌐 PUBLIC VOCABULARY API
// ========================================

// Get all available languages
export const getVocabularyLanguages = () => {
  return api.get('/vocabulary/languages');
};

// Get topics for a specific language
export const getVocabularyTopics = (language) => {
  return api.get(`/vocabulary/topics/${language}`);
};

// Get subtopics for a language/topic
export const getVocabularySubtopics = (language, topic) => {
  return api.get(`/vocabulary/subtopics/${language}/${encodeURIComponent(topic)}`);
};

// Get words for a specific subtopic
export const getVocabularyWords = (language, topic, subtopic, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/words/${language}/${encodeURIComponent(topic)}/${encodeURIComponent(subtopic)}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Get dialogues for context learning
export const getVocabularyDialogues = (language, topic, subtopic) => {
  return api.get(`/vocabulary/dialogues/${language}/${encodeURIComponent(topic)}/${encodeURIComponent(subtopic)}`);
};

// Search vocabulary words
export const searchVocabulary = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/vocabulary/search?${queryParams}`);
};

// Get vocabulary statistics
export const getVocabularyStats = () => {
  return api.get('/vocabulary/stats/overview');
};

// ========================================
// 🔐 USER PROGRESS API (Authenticated)
// ========================================

// Get user's vocabulary progress
export const getUserVocabularyProgress = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/progress/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Update word learning progress
export const updateWordProgress = (userId, progressData) => {
  return api.post(`/vocabulary/progress/${userId}/update`, progressData);
};

// Get words due for review
export const getWordsForReview = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/review/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Get user's language-specific progress
export const getUserLanguageProgress = (userId, language) => {
  return api.get(`/vocabulary/progress/${userId}?language=${language}`);
};

// Get recent words studied by user
export const getRecentWords = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/vocabulary/progress/${userId}?${queryParams}`);
};

// Get language-specific statistics
export const getLanguageStats = (language) => {
  return api.get(`/vocabulary/stats/language/${language}`);
};

// ========================================
// 🎮 VOCABULARY GAMES & QUIZZES
// ========================================

// Generate quiz for user
export const generateVocabularyQuiz = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/game/quiz/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Submit quiz results
export const submitQuizResults = (userId, results) => {
  return api.post(`/vocabulary/game/submit/${userId}`, results);
};

// Get quiz history
export const getQuizHistory = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/game/history/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// ========================================
// 🛠️ ADMIN API (Content Management)
// ========================================

// Get all vocabulary for admin
export const getVocabularyAdmin = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = '/vocabulary/admin/all';
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Create new vocabulary word
export const createVocabularyWord = (wordData) => {
  return api.post('/vocabulary/admin/create', wordData);
};

// Update vocabulary word
export const updateVocabularyWord = (id, wordData) => {
  return api.put(`/vocabulary/admin/${id}`, wordData);
};

// Delete vocabulary word
export const deleteVocabularyWord = (id) => {
  return api.delete(`/vocabulary/admin/${id}`);
};

// Bulk create vocabulary words
export const bulkCreateVocabulary = (data) => {
  return api.post('/vocabulary/admin/bulk-create', data);
};

// Import vocabulary from CSV
export const importVocabularyCSV = (data) => {
  return api.post('/vocabulary/admin/import-csv', data);
};

// ========================================
// 📱 DIALOGUE MANAGEMENT
// ========================================

// Get all dialogues (admin)
export const getDialoguesAdmin = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = '/vocabulary/admin/dialogues';
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Create new dialogue
export const createDialogue = (dialogueData) => {
  return api.post('/vocabulary/admin/dialogue/create', dialogueData);
};

// Update dialogue
export const updateDialogue = (id, dialogueData) => {
  return api.put(`/vocabulary/admin/dialogue/${id}`, dialogueData);
};

// Delete dialogue
export const deleteDialogue = (id) => {
  return api.delete(`/vocabulary/admin/dialogue/${id}`);
};

// ========================================
// 🔧 UTILITY FUNCTIONS
// ========================================

// Add a quick word (simplified interface)
export const addVocabularyWord = (wordData) => {
  const enhancedData = {
    translationLanguage: 'russian',
    isActive: true,
    importance: 3,
    partOfSpeech: wordData.partOfSpeech || 'noun',
    difficulty: wordData.difficulty || 'beginner',
    examples: [],
    synonyms: [],
    antonyms: [],
    ...wordData
  };

  return createVocabularyWord(enhancedData);
};

// Batch operations helper
export const batchUpdateProgress = async (userId, progressUpdates) => {
  const promises = progressUpdates.map(update =>
    updateWordProgress(userId, update)
  );

  return Promise.allSettled(promises);
};

// Get word details by ID
export const getWordById = (id) => {
  return api.get(`/vocabulary/word/${id}`);
};

// Mark word as learned
export const markWordAsLearned = (userId, vocabularyId) => {
  return updateWordProgress(userId, {
    vocabularyId,
    correct: true,
    timeSpent: 0
  });
};

// Reset word progress
export const resetWordProgress = (userId, vocabularyId) => {
  return api.post(`/vocabulary/progress/${userId}/reset`, {
    vocabularyId
  });
};

// Get study recommendations
export const getStudyRecommendations = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/recommendations/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Export user's vocabulary data
export const exportUserVocabulary = (userId, format = 'csv') => {
  return api.get(`/vocabulary/export/${userId}?format=${format}`, {
    responseType: 'blob'
  });
};

// Get vocabulary learning streaks
export const getLearningStreaks = (userId) => {
  return api.get(`/vocabulary/streaks/${userId}`);
};

// ========================================
// 📊 ANALYTICS & INSIGHTS
// ========================================

// Get detailed vocabulary analytics
export const getVocabularyAnalytics = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/analytics/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Get learning insights
export const getLearningInsights = (userId, language = null) => {
  const url = language
    ? `/vocabulary/insights/${userId}?language=${language}`
    : `/vocabulary/insights/${userId}`;
  return api.get(url);
};

// Get word difficulty analysis
export const getWordDifficultyAnalysis = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/analysis/difficulty/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Get mastery levels by topic
export const getMasteryByTopic = (userId, language = null) => {
  const url = language
    ? `/vocabulary/mastery/${userId}?language=${language}`
    : `/vocabulary/mastery/${userId}`;
  return api.get(url);
};

// ========================================
// 🎯 SPACED REPETITION SYSTEM
// ========================================

// Get SRS queue for user
export const getSRSQueue = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/srs/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Update SRS parameters for a word
export const updateSRSParameters = (userId, vocabularyId, performance) => {
  return api.post(`/vocabulary/srs/${userId}/update`, {
    vocabularyId,
    performance, // 'easy', 'good', 'hard', 'again'
    responseTime: Date.now()
  });
};

// Get SRS statistics
export const getSRSStats = (userId) => {
  return api.get(`/vocabulary/srs/${userId}/stats`);
};

// ========================================
// 🔍 ADVANCED SEARCH & FILTERING
// ========================================

// Advanced vocabulary search
export const advancedVocabularySearch = (params = {}) => {
  return api.post('/vocabulary/search/advanced', params);
};

// Get similar words
export const getSimilarWords = (wordId, limit = 10) => {
  return api.get(`/vocabulary/similar/${wordId}?limit=${limit}`);
};

// Search by definition
export const searchByDefinition = (query, params = {}) => {
  const searchParams = { q: query, ...params };
  const queryParams = new URLSearchParams(searchParams).toString();
  return api.get(`/vocabulary/search/definition?${queryParams}`);
};

// Get words by difficulty range
export const getWordsByDifficulty = (language, difficulty, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/difficulty/${language}/${difficulty}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// ========================================
// 📚 VOCABULARY SETS & COLLECTIONS
// ========================================

// Get user's vocabulary sets
export const getUserVocabularySets = (userId) => {
  return api.get(`/vocabulary/sets/${userId}`);
};

// Create vocabulary set
export const createVocabularySet = (userId, setData) => {
  return api.post(`/vocabulary/sets/${userId}`, setData);
};

// Add word to vocabulary set
export const addWordToSet = (userId, setId, vocabularyId) => {
  return api.post(`/vocabulary/sets/${userId}/${setId}/words`, {
    vocabularyId
  });
};

// Remove word from vocabulary set
export const removeWordFromSet = (userId, setId, vocabularyId) => {
  return api.delete(`/vocabulary/sets/${userId}/${setId}/words/${vocabularyId}`);
};

// Get words in vocabulary set
export const getSetWords = (userId, setId) => {
  return api.get(`/vocabulary/sets/${userId}/${setId}/words`);
};

// ========================================
// 🎨 MULTIMEDIA & ENRICHMENT
// ========================================

// Get word pronunciation
export const getWordPronunciation = (word, language) => {
  return api.get(`/vocabulary/pronunciation/${language}/${encodeURIComponent(word)}`);
};

// Get word images
export const getWordImages = (word, language, limit = 5) => {
  return api.get(`/vocabulary/images/${language}/${encodeURIComponent(word)}?limit=${limit}`);
};

// Get usage examples
export const getUsageExamples = (word, language, limit = 10) => {
  return api.get(`/vocabulary/examples/${language}/${encodeURIComponent(word)}?limit=${limit}`);
};

// Get word etymology
export const getWordEtymology = (word, language) => {
  return api.get(`/vocabulary/etymology/${language}/${encodeURIComponent(word)}`);
};

// ========================================
// 🏆 GAMIFICATION & ACHIEVEMENTS
// ========================================

// Get user achievements
export const getVocabularyAchievements = (userId) => {
  return api.get(`/vocabulary/achievements/${userId}`);
};

// Get leaderboard
export const getVocabularyLeaderboard = (language = null, timeframe = 'week') => {
  const params = new URLSearchParams({ timeframe });
  if (language) params.append('language', language);
  return api.get(`/vocabulary/leaderboard?${params.toString()}`);
};

// Get daily challenge
export const getDailyChallenge = (userId, language = null) => {
  const url = language
    ? `/vocabulary/challenge/daily/${userId}?language=${language}`
    : `/vocabulary/challenge/daily/${userId}`;
  return api.get(url);
};

// Submit daily challenge
export const submitDailyChallenge = (userId, challengeData) => {
  return api.post(`/vocabulary/challenge/daily/${userId}/submit`, challengeData);
};

// ========================================
// 🔄 SYNCHRONIZATION & BACKUP
// ========================================

// Sync vocabulary progress
export const syncVocabularyProgress = (userId, syncData) => {
  return api.post(`/vocabulary/sync/${userId}`, syncData);
};

// Backup user vocabulary data
export const backupVocabularyData = (userId) => {
  return api.post(`/vocabulary/backup/${userId}`);
};

// Restore vocabulary data
export const restoreVocabularyData = (userId, backupData) => {
  return api.post(`/vocabulary/restore/${userId}`, backupData);
};

// Get sync status
export const getSyncStatus = (userId) => {
  return api.get(`/vocabulary/sync/${userId}/status`);
};

// ========================================
// 📱 MOBILE & OFFLINE SUPPORT
// ========================================

// Get offline vocabulary pack
export const getOfflineVocabularyPack = (language, level = 'beginner') => {
  return api.get(`/vocabulary/offline/${language}?level=${level}`);
};

// Update offline progress
export const updateOfflineProgress = (userId, offlineData) => {
  return api.post(`/vocabulary/offline/${userId}/sync`, offlineData);
};

// ========================================
// 🔧 ADMIN UTILITIES
// ========================================

// Get admin statistics
export const getAdminVocabularyStats = () => {
  return api.get('/vocabulary/admin/stats');
};

// Bulk operations
export const bulkDeleteVocabulary = (ids) => {
  return api.delete('/vocabulary/admin/bulk-delete', {
    data: { ids }
  });
};

// Cleanup operations
export const cleanupVocabulary = (operation) => {
  return api.post('/vocabulary/admin/cleanup', { action: operation });
};

// Generate vocabulary report
export const generateVocabularyReport = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/vocabulary/admin/report?${queryParams}`);
};

// ========================================
// 📊 DATA VALIDATION & QUALITY
// ========================================

// Validate vocabulary data
export const validateVocabularyData = (data) => {
  return api.post('/vocabulary/admin/validate', data);
};

// Check for duplicates
export const checkDuplicates = (language, topic = null) => {
  const params = new URLSearchParams({ language });
  if (topic) params.append('topic', topic);
  return api.get(`/vocabulary/admin/duplicates?${params.toString()}`);
};

// Fix data inconsistencies
export const fixDataInconsistencies = () => {
  return api.post('/vocabulary/admin/fix-inconsistencies');
};

// ========================================
// 🌍 LOCALIZATION & TRANSLATION
// ========================================

// Get supported languages
export const getSupportedLanguages = () => {
  return api.get('/vocabulary/languages/supported');
};

// Translate vocabulary interface
export const getVocabularyTranslations = (language) => {
  return api.get(`/vocabulary/translations/${language}`);
};

// ========================================
// 📈 PERFORMANCE MONITORING
// ========================================

// Get API performance metrics
export const getAPIMetrics = () => {
  return api.get('/vocabulary/metrics');
};

// Report vocabulary API issue
export const reportVocabularyIssue = (issueData) => {
  return api.post('/vocabulary/support/report', issueData);
};

// ========================================
// 🎯 SPECIALIZED LEARNING MODES
// ========================================

// Get flashcard deck
export const getFlashcardDeck = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/flashcards/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Get typing challenge words
export const getTypingChallengeWords = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/typing/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// Get listening exercise
export const getListeningExercise = (userId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const baseUrl = `/vocabulary/listening/${userId}`;
  return api.get(queryParams ? `${baseUrl}?${queryParams}` : baseUrl);
};

// ========================================
// 🎮 GAMIFIED LEARNING
// ========================================

// Get word battle opponent
export const getWordBattleOpponent = (userId, language) => {
  return api.get(`/vocabulary/battle/${userId}/opponent?language=${language}`);
};

// Start word battle
export const startWordBattle = (userId, opponentId, settings) => {
  return api.post(`/vocabulary/battle/${userId}/start`, {
    opponentId,
    settings
  });
};

// Submit word battle answer
export const submitBattleAnswer = (userId, battleId, answer) => {
  return api.post(`/vocabulary/battle/${userId}/${battleId}/answer`, answer);
};

// ========================================
// 🔍 ERROR HANDLING UTILITIES
// ========================================

// Centralized error handler for vocabulary API
export const handleVocabularyError = (error, context = 'Vocabulary API') => {
  console.error(`❌ ${context} Error:`, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
    data: error.response?.data
  });

  // Return user-friendly error message
  if (error.response?.status === 401) {
    return 'Необходима авторизация для доступа к словарю';
  } else if (error.response?.status === 403) {
    return 'Нет доступа к этой функции словаря';
  } else if (error.response?.status === 404) {
    return 'Запрашиваемые слова не найдены';
  } else if (error.response?.status === 429) {
    return 'Слишком много запросов. Попробуйте позже';
  } else if (error.response?.status >= 500) {
    return 'Ошибка сервера словаря. Попробуйте позже';
  } else {
    return error.response?.data?.message || error.message || 'Произошла ошибка при работе со словарем';
  }
};

// Retry wrapper for vocabulary API calls
export const retryVocabularyAPI = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`⚠️ Vocabulary API attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// ========================================
// 📋 VOCABULARY API CONSTANTS
// ========================================

export const VOCABULARY_CONSTANTS = {
  DIFFICULTIES: ['beginner', 'intermediate', 'advanced'],
  PARTS_OF_SPEECH: ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'interjection', 'phrase', 'idiom'],
  LANGUAGES: ['english', 'spanish', 'french', 'german', 'chinese', 'arabic', 'japanese', 'korean', 'uzbek', 'russian'],
  QUIZ_TYPES: ['multiple-choice', 'translation', 'typing', 'listening', 'speaking'],
  SRS_PERFORMANCE: ['again', 'hard', 'good', 'easy'],
  MAX_EXAMPLES: 5,
  MAX_WORDS_PER_REQUEST: 100,
  CACHE_DURATION: 300000 // 5 minutes
};

// Default export with all functions
export default {
  // Public API
  getVocabularyLanguages,
  getVocabularyTopics,
  getVocabularySubtopics,
  getVocabularyWords,
  getVocabularyDialogues,
  searchVocabulary,
  getVocabularyStats,

  // User Progress
  getUserVocabularyProgress,
  updateWordProgress,
  getWordsForReview,
  getUserLanguageProgress,
  getRecentWords,
  getLanguageStats,

  // Games & Quizzes
  generateVocabularyQuiz,
  submitQuizResults,
  getQuizHistory,

  // Admin
  getVocabularyAdmin,
  createVocabularyWord,
  updateVocabularyWord,
  deleteVocabularyWord,
  bulkCreateVocabulary,
  importVocabularyCSV,

  // Dialogues
  getDialoguesAdmin,
  createDialogue,
  updateDialogue,
  deleteDialogue,

  // Utilities
  addVocabularyWord,
  batchUpdateProgress,
  getWordById,
  markWordAsLearned,
  resetWordProgress,
  getStudyRecommendations,
  exportUserVocabulary,
  getLearningStreaks,

  // Analytics
  getVocabularyAnalytics,
  getLearningInsights,
  getWordDifficultyAnalysis,
  getMasteryByTopic,

  // SRS
  getSRSQueue,
  updateSRSParameters,
  getSRSStats,

  // Advanced Search
  advancedVocabularySearch,
  getSimilarWords,
  searchByDefinition,
  getWordsByDifficulty,

  // Sets & Collections
  getUserVocabularySets,
  createVocabularySet,
  addWordToSet,
  removeWordFromSet,
  getSetWords,

  // Multimedia
  getWordPronunciation,
  getWordImages,
  getUsageExamples,
  getWordEtymology,

  // Gamification
  getVocabularyAchievements,
  getVocabularyLeaderboard,
  getDailyChallenge,
  submitDailyChallenge,

  // Sync & Backup
  syncVocabularyProgress,
  backupVocabularyData,
  restoreVocabularyData,
  getSyncStatus,

  // Offline
  getOfflineVocabularyPack,
  updateOfflineProgress,

  // Admin Utilities
  getAdminVocabularyStats,
  bulkDeleteVocabulary,
  cleanupVocabulary,
  generateVocabularyReport,

  // Data Quality
  validateVocabularyData,
  checkDuplicates,
  fixDataInconsistencies,

  // Localization
  getSupportedLanguages,
  getVocabularyTranslations,

  // Performance
  getAPIMetrics,
  reportVocabularyIssue,

  // Learning Modes
  getFlashcardDeck,
  getTypingChallengeWords,
  getListeningExercise,

  // Battle Mode
  getWordBattleOpponent,
  startWordBattle,
  submitBattleAnswer,

  // Error Handling
  handleVocabularyError,
  retryVocabularyAPI,

  // Constants
  VOCABULARY_CONSTANTS
};
