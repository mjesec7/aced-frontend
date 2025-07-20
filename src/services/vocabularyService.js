// src/api/vocabulary.js
import { vocabularyService } from '@/services/vocabularyService'

/**
 * Get vocabulary topics for a language
 * @param {string} languageCode - Language code (e.g., 'english', 'spanish')
 * @returns {Promise} - Promise resolving to topics data
 */
export const getVocabularyTopics = async (languageCode) => {
  try {
    // Get current user from your auth system
    const currentUser = getCurrentUser() // You'll need to implement this
    
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    return await vocabularyService.getLanguageTopics(currentUser.uid, languageCode)
  } catch (error) {
    console.error('Error fetching vocabulary topics:', error)
    throw error
  }
}

/**
 * Get language statistics
 * @param {string} languageCode - Language code
 * @returns {Promise} - Promise resolving to language stats
 */
export const getLanguageStats = async (languageCode) => {
  try {
    return await vocabularyService.getLanguageStats(languageCode)
  } catch (error) {
    console.error('Error fetching language stats:', error)
    throw error
  }
}

/**
 * Get user language progress
 * @param {string} userId - User ID
 * @param {string} languageCode - Language code
 * @returns {Promise} - Promise resolving to user progress data
 */
export const getUserLanguageProgress = async (userId, languageCode) => {
  try {
    return await vocabularyService.getUserProgress(userId, languageCode)
  } catch (error) {
    console.error('Error fetching user language progress:', error)
    throw error
  }
}

/**
 * Get user vocabulary by language
 * @param {string} userId - User ID
 * @param {string} languageCode - Language code
 * @returns {Promise} - Promise resolving to vocabulary data
 */
export const getUserVocabularyByLanguage = async (userId, languageCode) => {
  try {
    return await vocabularyService.getUserVocabularyByLanguage(userId, languageCode)
  } catch (error) {
    console.error('Error fetching user vocabulary by language:', error)
    throw error
  }
}

/**
 * Search vocabulary words
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise} - Promise resolving to search results
 */
export const searchVocabulary = async (query, options = {}) => {
  try {
    return await vocabularyService.searchWords(query, options)
  } catch (error) {
    console.error('Error searching vocabulary:', error)
    throw error
  }
}

/**
 * Update word progress
 * @param {string} userId - User ID
 * @param {string} vocabularyId - Vocabulary word ID
 * @param {Object} progressData - Progress data
 * @returns {Promise} - Promise resolving to update result
 */
export const updateWordProgress = async (userId, vocabularyId, progressData) => {
  try {
    return await vocabularyService.updateWordProgress(userId, vocabularyId, progressData)
  } catch (error) {
    console.error('Error updating word progress:', error)
    throw error
  }
}

/**
 * Get words for review
 * @param {string} userId - User ID
 * @param {string} languageCode - Language code (optional)
 * @param {number} limit - Limit number of words (optional)
 * @returns {Promise} - Promise resolving to review words
 */
export const getWordsForReview = async (userId, languageCode = null, limit = 20) => {
  try {
    return await vocabularyService.getWordsForReview(userId, languageCode, limit)
  } catch (error) {
    console.error('Error fetching words for review:', error)
    throw error
  }
}

/**
 * Generate practice words
 * @param {string} userId - User ID
 * @param {string} languageCode - Language code
 * @param {Object} options - Practice options
 * @returns {Promise} - Promise resolving to practice words
 */
export const getPracticeWords = async (userId, languageCode, options = {}) => {
  try {
    return await vocabularyService.getPracticeWords(userId, languageCode, options)
  } catch (error) {
    console.error('Error fetching practice words:', error)
    throw error
  }
}

/**
 * Generate quiz
 * @param {string} userId - User ID
 * @param {Object} options - Quiz options
 * @returns {Promise} - Promise resolving to quiz data
 */
export const generateQuiz = async (userId, options = {}) => {
  try {
    return await vocabularyService.generateQuiz(userId, options)
  } catch (error) {
    console.error('Error generating quiz:', error)
    throw error
  }
}

/**
 * Submit quiz results
 * @param {string} userId - User ID
 * @param {Object} results - Quiz results
 * @returns {Promise} - Promise resolving to submission result
 */
export const submitQuizResults = async (userId, results) => {
  try {
    return await vocabularyService.submitQuizResults(userId, results)
  } catch (error) {
    console.error('Error submitting quiz results:', error)
    throw error
  }
}

/**
 * Get vocabulary statistics overview
 * @returns {Promise} - Promise resolving to stats overview
 */
export const getVocabularyStats = async () => {
  try {
    return await vocabularyService.getVocabularyStats()
  } catch (error) {
    console.error('Error fetching vocabulary stats:', error)
    throw error
  }
}

/**
 * Get user analytics
 * @param {string} userId - User ID
 * @returns {Promise} - Promise resolving to user analytics
 */
export const getUserAnalytics = async (userId) => {
  try {
    return await vocabularyService.getUserAnalytics(userId)
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    throw error
  }
}

/**
 * Helper function to get current user
 * This should be implemented based on your auth system
 */
function getCurrentUser() {
  // Replace this with your actual auth implementation
  // For example, if using Vuex:
  // return store.getters.user
  
  // For now, return a mock user or get from localStorage
  try {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.warn('Could not get current user:', error)
    return null
  }
}

// Export all functions as named exports
export {
  vocabularyService as default
}