// src/api.js - MAIN API ENTRY POINT (REFACTORED & MODULAR)

// =============================================
// 💡 CLEAN MODULAR API STRUCTURE
// =============================================

// Core API instance and utilities
import api, { 
  BASE_URL,
  getValidToken,
  debounceRequest,
  cleanupRequestCache,
  retryApiCall,
  withErrorHandling,
  healthCheck,
  authTest,
  checkApiHealth,
  getSystemStatus
} from './api/core';

// Content processing utilities
import * as ContentProcessors from './api/content-processors';

// Course management
import * as CoursesAPI from './api/courses';

// Lessons and topics
import * as LessonsAPI from './api/lessons';

// Homework management
import * as HomeworkAPI from './api/homework';

// Tests management
import * as TestsAPI from './api/tests';

// Progress tracking
import * as ProgressAPI from './api/progress';

// User management
import * as UserAPI from './api/user';

// Subscription management
import * as SubscriptionAPI from './api/subscription';

// Utility functions
import * as Utils from './api/utils';

// Payment integrations
import * as PaymentsAPI from './api/payments';
import * as MulticardAPI from './api/multicard';

// Vocabulary (already modular)
import * as VocabularyAPI from './api/vocabulary';

// =============================================
// 📤 RE-EXPORT EVERYTHING FOR EASY IMPORTS
// =============================================

// Export core API instance as default
export default api;

// Export core utilities
export {
  BASE_URL,
  getValidToken,
  debounceRequest,
  cleanupRequestCache,
  retryApiCall,
  withErrorHandling,
  healthCheck,
  authTest,
  checkApiHealth,
  getSystemStatus
};

// =============================================
// 📚 COURSE API
// =============================================
export const {
  getUpdatedCourses,
  getCourseById,
  getCourseStructured,
  getUpdatedCoursesWithFormat,
  getCourseStructuredEnhanced,
  getCourseContent,
  toggleBookmark,
  getSubjects
} = CoursesAPI;

// =============================================
// 📖 LESSON & TOPIC API
// =============================================
export const {
  getTopics,
  getTopicById,
  getLessonsByTopic,
  getAllLessons,
  getLessonById
} = LessonsAPI;

// =============================================
// 📝 HOMEWORK API
// =============================================
export const {
  getAllHomeworks,
  getHomeworkByLesson,
  getStandaloneHomework,
  saveHomework,
  submitHomework,
  saveStandaloneHomework,
  submitStandaloneHomework
} = HomeworkAPI;

// =============================================
// 📋 TESTS API
// =============================================
export const {
  getAvailableTests,
  getTestById,
  submitTestResult,
  getTestResult,
  getUserTestResults
} = TestsAPI;

// =============================================
// 📊 PROGRESS API
// =============================================
export const {
  submitProgress,
  getLessonProgress,
  getUserProgress,
  getUserProgressStats,
  getLessonProgressStats,
  getTopicsProgress,
  getUserPoints,
  getUserAnalytics,
  getUserStats,
  getUserAchievements,
  getRecommendations
} = ProgressAPI;

// =============================================
// 👤 USER API
// =============================================
export const {
  getUserInfo,
  getUserStatus,
  saveUser,
  updateUserProfile,
  getUserStudyList,
  addToStudyList,
  removeFromStudyList,
  cleanupStudyList,
  getUserGoals,
  createUserGoal,
  updateUserGoal,
  deleteUserGoal,
  saveDiaryEntry,
  getDiaryEntries
} = UserAPI;

// =============================================
// 💳 SUBSCRIPTION API
// =============================================
export const {
  saveSubscriptionToServer,
  loadSubscriptionFromServer,
  syncSubscriptionGlobally,
  updateUserStatusWithPersistence,
  applyPromocodeWithGlobalPersistence,
  completePaymentWithGlobalPersistence,
  checkGlobalSyncStatus
} = SubscriptionAPI;

// =============================================
// 💰 PAYMENT API (Payme)
// =============================================
export const {
  initiatePaymePayment,
  generatePaymeForm,
  applyPromoCode,
  checkPaymentStatus,
  validateUser,
  getPaymentAmounts,
  formatPaymentAmount,
  getTransactionStateText,
  getPaymeErrorMessage,
  handlePaymentError,
  validatePaymeUrl,
  resetPaymentAttempts,
  testCleanUrlGeneration,
  testPaymentFlow,
  generatePaymentForm,
  executePaymentFlow
} = PaymentsAPI;

// =============================================
// 💳 MULTICARD API
// =============================================
export const {
  testMulticardAuth,
  initiateMulticardPayment,
  getInvoiceInfo,
  cancelInvoice,
  createCardBindingSession,
  checkCardBindingStatus,
  getCardInfo,
  deleteCard,
  createPaymentByToken,
  createPaymentViaApp,
  confirmPayment,
  refundPayment,
  getPaymentInfo,
  getPaymentHistory,
  getPaymentStatistics,
  getApplicationInfo,
  uzsToTiyin,
  tiyinToUzs,
  formatPrice,
  createOfdData,
  getPaymentStatusText,
  getPaymentSystemName
} = MulticardAPI;

// Export entire multicard module for convenience
export { MulticardAPI as multicardAPI };

// =============================================
// 📚 VOCABULARY API
// =============================================
export const {
  getVocabularyLanguages,
  getVocabularyTopics,
  getVocabularySubtopics,
  getVocabularyWords,
  searchVocabulary,
  getVocabularyStats,
  getUserVocabularyProgress,
  updateWordProgress,
  getWordsForReview,
  getUserLanguageProgress,
  getLanguageStats,
  generateVocabularyQuiz,
  submitQuizResults,
  getVocabularyAnalytics,
  getLearningInsights,
  getVocabularyAchievements,
  getStudyRecommendations,
  logVocabularyActivity,
  markWordAsLearned,
  createVocabularyTest,
  submitVocabularyTest,
  quickWordLookup,
  getDailyGoalProgress,
  addVocabularyWord,
  handleVocabularyError,
  VOCABULARY_CONSTANTS
} = VocabularyAPI;

// =============================================
// 🔧 UTILITY API
// =============================================
export const {
  handleApiError,
  isMobileApp,
  isOnline,
  queueOfflineRequest,
  processOfflineQueue,
  diagnosticTool,
  formatCurrency,
  formatDate,
  formatFileSize,
  formatDuration,
  isValidEmail,
  isValidPhoneUZ,
  isValidUrl,
  generateUniqueId,
  deepClone,
  debounce,
  throttle,
  sleep,
  chunkArray,
  removeDuplicates,
  sortByKey,
  groupBy,
  calculatePercentage,
  getRandomItem,
  truncateText,
  copyToClipboard,
  downloadFile,
  getBrowserInfo
} = Utils;

// =============================================
// 🎨 CONTENT PROCESSORS
// =============================================
export const {
  processImageUrl,
  processStepImages,
  processStepData,
  processSteps,
  processCurriculum,
  getDefaultThumbnail,
  getDefaultAvatar,
  extractMinutes,
  extractHours,
  isNewCourse,
  hasHomeworkContent,
  calculateTotalSteps,
  hasQuizContent,
  hasImageContent,
  generateSkillsList,
  generateModulesList,
  processLessonsEnhanced,
  processCurriculumEnhanced
} = ContentProcessors;

// =============================================
// 📦 NAMESPACE EXPORTS (Optional usage style)
// =============================================

// Export grouped APIs for namespace imports
export {
  CoursesAPI,
  LessonsAPI,
  HomeworkAPI,
  TestsAPI,
  ProgressAPI,
  UserAPI,
  SubscriptionAPI,
  PaymentsAPI,
  MulticardAPI,
  VocabularyAPI,
  Utils,
  ContentProcessors
};

// =============================================
// 💡 USAGE EXAMPLES
// =============================================

/*
// ✅ RECOMMENDED: Named imports (tree-shakeable)
import { 
  getCourseById, 
  getUserProgress,
  initiatePaymePayment 
} from '@/api';

// ✅ ALTERNATIVE: Namespace imports
import { CoursesAPI, UserAPI } from '@/api';
await CoursesAPI.getCourseById('123');
await UserAPI.getUserInfo('user123');

// ✅ DEFAULT: Core API instance
import api from '@/api';
const response = await api.get('/custom-endpoint');

// ✅ GROUPED: Import entire modules
import * as CoursesAPI from '@/api/courses';
import * as PaymentsAPI from '@/api/payments';
*/