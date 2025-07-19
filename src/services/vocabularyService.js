// services/vocabularyService.js
import api from '@/api'

class VocabularyService {
  
  /**
   * Get user's available languages with vocabulary data from MongoDB
   * Only returns languages that have actual words
   */
  async getUserLanguages(userId) {
    try {
      // Get all available languages from vocabulary collection
      const languagesResponse = await api.get('/vocabulary/languages')
      
      if (!languagesResponse.data?.success) {
        throw new Error('Failed to fetch available languages')
      }

      const allLanguages = languagesResponse.data.data || []
      const languagesWithContent = []

      // For each language, get word counts and user progress
      for (const language of allLanguages) {
        try {
          // Get language stats
          const statsResponse = await api.get(`/vocabulary/stats/language/${language.code}`)
          const stats = statsResponse.data?.data || { totalWords: 0 }

          // Only include languages with actual words
          if (stats.totalWords > 0) {
            // Get user progress for this language
            let userProgress = { mastered: 0, learning: 0 }
            try {
              const progressResponse = await api.get(`/vocabulary/progress/${userId}`, {
                params: { language: language.code }
              })
              
              if (progressResponse.data?.success) {
                const progress = progressResponse.data.stats || {}
                userProgress = {
                  mastered: progress.mastered || 0,
                  learning: progress.learning || 0
                }
              }
            } catch (progressError) {
              console.warn(`⚠️ No progress data for ${language.code}:`, progressError.message)
            }

            languagesWithContent.push({
              code: language.code,
              name: language.name,
              nameRu: language.nameRu,
              flag: this.getLanguageMetadata(language.code).flag,
              totalWords: stats.totalWords,
              lessonsCount: 0, // Not tracking lesson-specific words in this simplified version
              otherCount: stats.totalWords,
              masteredWords: userProgress.mastered,
              progress: stats.totalWords > 0 ? Math.round((userProgress.mastered / stats.totalWords) * 100) : 0,
              hasLessons: false
            })
          }
        } catch (langError) {
          console.warn(`⚠️ Failed to get stats for ${language.code}:`, langError.message)
          continue
        }
      }

      return {
        success: true,
        data: {
          languages: languagesWithContent,
          stats: {
            totalWords: languagesWithContent.reduce((sum, l) => sum + l.totalWords, 0),
            languagesWithLessons: languagesWithContent.filter(l => l.hasLessons).length,
            mastered: languagesWithContent.reduce((sum, l) => sum + l.masteredWords, 0)
          }
        }
      }
      
    } catch (error) {
      console.error('❌ getUserLanguages failed:', error)
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Get vocabulary for a specific language from MongoDB
   */
  async getLanguageVocabulary(userId, languageCode) {
    try {
      // Get topics for this language
      const topicsResponse = await api.get(`/vocabulary/topics/${languageCode}`)
      const topics = topicsResponse.data?.success ? topicsResponse.data.data : []

      // Get user's progress for this language
      let userProgress = []
      try {
        const progressResponse = await api.get(`/vocabulary/progress/${userId}`, {
          params: { language: languageCode }
        })
        userProgress = progressResponse.data?.success ? progressResponse.data.data : []
      } catch (progressError) {
        console.warn('⚠️ No user progress found:', progressError.message)
      }

      return {
        success: true,
        data: {
          topics: topics,
          lessonWords: [], // Not implementing lesson-based words for now
          otherWords: [], // Will be loaded when user selects a topic
          wordsForReview: userProgress.filter(p => p.status === 'reviewing').length,
          stats: {
            totalTopics: topics.length,
            totalWords: topics.reduce((sum, t) => sum + t.wordCount, 0),
            masteredCount: userProgress.filter(p => p.status === 'mastered').length
          }
        }
      }

    } catch (error) {
      console.error('❌ getLanguageVocabulary failed:', error)
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Get words for a specific topic from MongoDB
   */
  async getTopicWords(userId, topicName, languageCode) {
    try {
      const response = await api.get(`/vocabulary/words/${languageCode}/${topicName}/all`, {
        params: { 
          page: 1, 
          limit: 100,
          userId: userId 
        }
      })

      if (response.data?.success) {
        const words = response.data.data || []
        
        if (words.length === 0) {
          throw new Error(`No words found for topic "${topicName}"`)
        }

        // Enrich words with user progress
        const enrichedWords = await this.enrichWordsWithProgress(userId, words)

        return {
          success: true,
          data: {
            words: enrichedWords,
            topicInfo: {
              name: topicName,
              wordCount: words.length
            }
          }
        }
      }

      throw new Error('Invalid response format')

    } catch (error) {
      console.error('❌ getTopicWords failed:', error)
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Enrich words with user progress data
   */
  async enrichWordsWithProgress(userId, words) {
    try {
      const wordIds = words.map(w => w._id)
      const response = await api.get(`/vocabulary/progress/${userId}`)
      
      const progressMap = new Map()
      if (response.data?.success) {
        response.data.data.forEach(progress => {
          progressMap.set(progress.vocabularyId, progress)
        })
      }

      return words.map(word => {
        const progress = progressMap.get(word._id)
        return {
          ...word,
          status: progress?.status || 'new',
          timesCorrect: progress?.timesCorrect || 0,
          timesShown: progress?.timesShown || 0,
          lastReviewed: progress?.lastReviewed,
          userProgress: progress
        }
      })

    } catch (error) {
      console.warn('⚠️ Failed to enrich words with progress:', error.message)
      // Return words without progress data
      return words.map(word => ({
        ...word,
        status: 'new',
        timesCorrect: 0,
        timesShown: 0
      }))
    }
  }

  /**
   * Get topics available for a language from MongoDB
   */
  async getLanguageTopics(userId, languageCode) {
    try {
      const response = await api.get(`/vocabulary/topics/${languageCode}`)

      if (response.data?.success) {
        const topics = response.data.data || []
        
        // Filter out topics without words
        const topicsWithWords = topics.filter(topic => 
          topic.wordCount > 0
        )

        return {
          success: true,
          data: {
            topics: topicsWithWords,
            userProgress: null // Will implement user progress tracking later
          }
        }
      }

      throw new Error('Invalid response format')

    } catch (error) {
      console.error('❌ getLanguageTopics failed:', error)
      
      if (error.response?.status === 404) {
        return {
          success: true,
          data: { topics: [], userProgress: null }
        }
      }

      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Update word learning progress
   */
  async updateWordProgress(userId, wordId, progressData) {
    try {
      const response = await api.post('/vocabulary/progress', {
        userId,
        vocabularyId: wordId,
        ...progressData,
        timestamp: new Date().toISOString()
      })

      return {
        success: true,
        data: response.data
      }

    } catch (error) {
      console.error('❌ updateWordProgress failed:', error)
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Get topics available for a language
   */
  async getLanguageTopics(userId, languageCode) {
    try {
      const response = await api.get(`/vocabulary/topics/${languageCode}`, {
        params: { userId }
      })

      if (response.data?.success) {
        const topics = response.data.topics || []
        
        // Filter out topics without words
        const topicsWithWords = topics.filter(topic => 
          topic.wordCount > 0
        )

        return {
          success: true,
          data: {
            topics: topicsWithWords,
            userProgress: response.data.userProgress || null
          }
        }
      }

      throw new Error('Invalid response format')

    } catch (error) {
      console.error('❌ getLanguageTopics failed:', error)
      
      if (error.response?.status === 404) {
        return {
          success: true,
          data: { topics: [], userProgress: null }
        }
      }

      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Generate test questions for vocabulary
   */
  async generateTest(userId, config) {
    try {
      const response = await api.post('/vocabulary/generate-test', {
        userId,
        ...config
      })

      if (response.data?.success) {
        return {
          success: true,
          data: response.data
        }
      }

      throw new Error('Failed to generate test')

    } catch (error) {
      console.error('❌ generateTest failed:', error)
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Submit test results
   */
  async submitTestResults(userId, testId, results) {
    try {
      const response = await api.post('/vocabulary/test-results', {
        userId,
        testId,
        results,
        timestamp: new Date().toISOString()
      })

      return {
        success: true,
        data: response.data
      }

    } catch (error) {
      console.error('❌ submitTestResults failed:', error)
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Get user's vocabulary statistics
   */
  async getUserVocabularyStats(userId) {
    try {
      const response = await api.get(`/vocabulary/user-stats/${userId}`)

      return {
        success: true,
        data: response.data?.data || {}
      }

    } catch (error) {
      console.error('❌ getUserVocabularyStats failed:', error)
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Search vocabulary words
   */
  async searchWords(userId, query, filters = {}) {
    try {
      const response = await api.get('/vocabulary/search', {
        params: {
          userId,
          q: query,
          ...filters
        }
      })

      return {
        success: true,
        data: response.data?.results || []
      }

    } catch (error) {
      console.error('❌ searchWords failed:', error)
      return {
        success: false,
        error: this.getErrorMessage(error)
      }
    }
  }

  /**
   * Helper method to extract meaningful error messages
   */
  getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error
    }
    
    if (error.message) {
      return error.message
    }
    
    // Default error messages based on status codes
    const status = error.response?.status
    switch (status) {
      case 401:
        return 'Authentication required. Please log in.'
      case 403:
        return 'Access denied. Insufficient permissions.'
      case 404:
        return 'Requested vocabulary data not found.'
      case 429:
        return 'Too many requests. Please wait and try again.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return 'An unexpected error occurred while loading vocabulary data.'
    }
  }

  /**
   * Validate that a language has actual content
   */
  validateLanguageContent(language) {
    if (!language) return false
    
    const hasWords = language.totalWords > 0
    const hasLessons = language.lessonsCount > 0
    const hasOtherWords = language.otherCount > 0
    
    return hasWords || hasLessons || hasOtherWords
  }

  /**
   * Get supported languages with their metadata
   */
  getSupportedLanguages() {
    return [
      {
        code: 'english',
        name: 'English',
        nameRu: 'Английский',
        flag: '🇺🇸',
        speechLang: 'en-US'
      },
      {
        code: 'spanish',
        name: 'Spanish',
        nameRu: 'Испанский',
        flag: '🇪🇸',
        speechLang: 'es-ES'
      },
      {
        code: 'french',
        name: 'French',
        nameRu: 'Французский',
        flag: '🇫🇷',
        speechLang: 'fr-FR'
      },
      {
        code: 'german',
        name: 'German',
        nameRu: 'Немецкий',
        flag: '🇩🇪',
        speechLang: 'de-DE'
      },
      {
        code: 'chinese',
        name: 'Chinese',
        nameRu: 'Китайский',
        flag: '🇨🇳',
        speechLang: 'zh-CN'
      },
      {
        code: 'japanese',
        name: 'Japanese',
        nameRu: 'Японский',
        flag: '🇯🇵',
        speechLang: 'ja-JP'
      },
      {
        code: 'korean',
        name: 'Korean',
        nameRu: 'Корейский',
        flag: '🇰🇷',
        speechLang: 'ko-KR'
      },
      {
        code: 'arabic',
        name: 'Arabic',
        nameRu: 'Арабский',
        flag: '🇸🇦',
        speechLang: 'ar-SA'
      },
      {
        code: 'uzbek',
        name: 'Uzbek',
        nameRu: 'Узбекский',
        flag: '🇺🇿',
        speechLang: 'uz-UZ'
      },
      {
        code: 'russian',
        name: 'Russian',
        nameRu: 'Русский',
        flag: '🇷🇺',
        speechLang: 'ru-RU'
      }
    ]
  }

  /**
   * Get language metadata by code
   */
  getLanguageMetadata(languageCode) {
    const languages = this.getSupportedLanguages()
    return languages.find(lang => lang.code === languageCode) || {
      code: languageCode,
      name: languageCode,
      nameRu: languageCode,
      flag: '🌐',
      speechLang: 'en-US'
    }
  }
}

// Export singleton instance
export const vocabularyService = new VocabularyService()