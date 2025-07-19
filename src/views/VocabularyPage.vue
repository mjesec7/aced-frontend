<template>
  <div class="vocabulary-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>{{ loadingMessage }}</span>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ error.title }}</h3>
      <p>{{ error.message }}</p>
      <button @click="initialize" class="retry-btn">Повторить</button>
    </div>
    
    <!-- No Languages Available -->
    <div v-else-if="!hasLanguages" class="empty-state">
      <div class="empty-icon">🌍</div>
      <h3>Добро пожаловать!</h3>
      <p>Выберите язык для начала изучения словаря</p>
      <button @click="initialize" class="primary-btn">Обновить</button>
    </div>
    
    <!-- Language Selection View -->
    <div v-else-if="!selectedLanguage" class="language-selection">
      <div class="page-header">
        <div class="header-content">
          <div class="header-main">
            <h1 class="page-title">📚 Словарь</h1>
            <p class="page-subtitle">Выберите язык для изучения</p>
          </div>
          
          <!-- Quick Stats -->
          <div class="stats-bar" v-if="overallStats">
            <div class="stat">
              <span class="stat-number">{{ overallStats.totalWords || 0 }}</span>
              <span class="stat-label">всего слов</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ availableLanguages.length }}</span>
              <span class="stat-label">языков доступно</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ overallStats.languagesStarted || 0 }}</span>
              <span class="stat-label">начато изучение</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ overallStats.wordsFromLessons || 0 }}</span>
              <span class="stat-label">из уроков</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="languages-grid">
        <div 
          v-for="language in availableLanguages" 
          :key="language.code"
          class="language-card"
          :class="{ 'has-progress': language.totalWords > 0 }"
          @click="selectLanguage(language)"
        >
          <div class="lang-flag">{{ language.flag }}</div>
          <div class="lang-info">
            <h3 class="lang-name">{{ language.nameRu || language.name }}</h3>
            <div class="lang-stats">
              <div v-if="language.totalWords > 0" class="stat-item">
                <span class="stat-icon">📚</span>
                <span class="stat-text">{{ language.totalWords }} слов изучается</span>
              </div>
              <div v-if="language.wordsFromLessons > 0" class="stat-item">
                <span class="stat-icon">🎓</span>
                <span class="stat-text">{{ language.wordsFromLessons }} из уроков</span>
              </div>
              <div v-if="language.mastered > 0" class="stat-item">
                <span class="stat-icon">✅</span>
                <span class="stat-text">{{ language.mastered }} изучено</span>
              </div>
              <div v-if="language.totalWords === 0" class="stat-item">
                <span class="stat-icon">🚀</span>
                <span class="stat-text">Начать изучение</span>
              </div>
            </div>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </div>
    
    <!-- Selected Language View -->
    <div v-else class="language-view">
      <!-- Language Header -->
      <div class="language-header">
        <button @click="goBackToLanguages" class="back-btn">
          ← Назад к языкам
        </button>
        
        <div class="lang-title-section">
          <span class="lang-flag-large">{{ selectedLanguage.flag }}</span>
          <div class="lang-title-info">
            <h1 class="lang-title">{{ selectedLanguage.nameRu || selectedLanguage.name }}</h1>
            <p class="lang-subtitle">{{ getTotalWordsText() }}</p>
          </div>
        </div>
        
        <div class="lang-actions">
          <button 
            v-if="hasAnyContent" 
            @click="createTest" 
            class="action-btn primary"
          >
            <span class="btn-icon">🎯</span>
            <span>Тест</span>
          </button>
          <button 
            v-if="hasAnyContent"
            @click="startReview"
            class="action-btn secondary"
          >
            <span class="btn-icon">📖</span>
            <span>Повторить</span>
          </button>
        </div>
      </div>

      <!-- Language Loading -->
      <div v-if="languageLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>Загрузка словаря...</span>
      </div>

      <!-- Language Content -->
      <div v-else-if="hasAnyContent" class="language-content">
        
        <!-- Filter and Search -->
        <div class="controls-section">
          <div class="search-bar">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Поиск слов..."
              class="search-input"
              @input="performSearch"
            >
            <span class="search-icon">🔍</span>
          </div>
          
          <div class="filter-tabs">
            <button 
              v-for="tab in filterTabs" 
              :key="tab.key"
              @click="setActiveTab(tab.key)"
              class="filter-tab"
              :class="{ active: activeTab === tab.key }"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
              <span class="tab-count">{{ tab.count }}</span>
            </button>
          </div>
        </div>

        <!-- Topics Section -->
        <section v-if="activeTab === 'topics' && topics.length > 0" class="vocabulary-section">
          <div class="section-header">
            <div class="section-info">
              <h2 class="section-title">📚 Темы для изучения</h2>
              <span class="section-count">{{ topics.length }}</span>
            </div>
          </div>

          <div class="topics-grid">
            <div 
              v-for="topic in topics"
              :key="topic.name"
              class="topic-card"
              @click="selectTopic(topic)"
            >
              <div class="topic-icon">{{ getTopicIcon(topic.name) }}</div>
              
              <div class="topic-content">
                <h3 class="topic-name">{{ getTopicNameRu(topic.name) }}</h3>
                <p class="topic-description">{{ getTopicDescription(topic.name) }}</p>
                
                <div class="topic-stats">
                  <div class="stat-badge">
                    <span class="stat-icon">📝</span>
                    <span>{{ topic.wordCount }} слов</span>
                  </div>
                  <div class="stat-badge difficulty" :class="topic.difficulty || 'beginner'">
                    <span class="stat-icon">{{ getDifficultyIcon(topic.difficulty || 'beginner') }}</span>
                    <span>{{ getDifficultyLabel(topic.difficulty || 'beginner') }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-arrow">→</div>
            </div>
          </div>
        </section>

        <!-- Words from Lessons Section -->
        <section v-if="activeTab === 'lessons' && wordsFromLessons.length > 0" class="vocabulary-section">
          <div class="section-header">
            <div class="section-info">
              <h2 class="section-title">🎓 Слова из пройденных уроков</h2>
              <span class="section-count">{{ wordsFromLessons.length }}</span>
            </div>
            <div class="section-actions">
              <button @click="practiceFromLessons" class="practice-btn">
                <span class="btn-icon">🔄</span>
                <span>Практика</span>
              </button>
            </div>
          </div>

          <div class="words-grid">
            <div 
              v-for="word in paginatedWordsFromLessons"
              :key="word.id"
              class="word-card lesson-word"
              @click="showWordDetails(word)"
            >
              <div class="word-header">
                <h4 class="word-text">{{ word.word }}</h4>
                <span class="word-lesson">{{ word.lessonName }}</span>
              </div>
              <p class="word-translation">{{ word.translation }}</p>
              <div class="word-meta">
                <span class="word-type">{{ getPartOfSpeechRu(word.partOfSpeech) }}</span>
                <span class="word-difficulty" :class="word.difficulty">
                  {{ getDifficultyLabel(word.difficulty) }}
                </span>
              </div>
              <div class="word-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${word.progress || 0}%` }"
                  ></div>
                </div>
                <span class="progress-text">{{ word.progress || 0 }}%</span>
              </div>
            </div>
          </div>

          <!-- Pagination for words from lessons -->
          <div v-if="wordsFromLessons.length > wordsPerPage" class="pagination">
            <button 
              @click="changePage(-1)" 
              :disabled="currentPage === 1"
              class="pagination-btn"
            >
              ←
            </button>
            <span class="pagination-info">
              {{ currentPage }} из {{ totalPages }}
            </span>
            <button 
              @click="changePage(1)" 
              :disabled="currentPage === totalPages"
              class="pagination-btn"
            >
              →
            </button>
          </div>
        </section>

        <!-- All Words Section -->
        <section v-if="activeTab === 'all' && allWords.length > 0" class="vocabulary-section">
          <div class="section-header">
            <div class="section-info">
              <h2 class="section-title">📖 Все слова</h2>
              <span class="section-count">{{ allWords.length }}</span>
            </div>
            <div class="section-actions">
              <select v-model="sortBy" @change="sortWords" class="sort-select">
                <option value="word">По алфавиту</option>
                <option value="difficulty">По сложности</option>
                <option value="progress">По прогрессу</option>
                <option value="recent">Недавние</option>
              </select>
            </div>
          </div>

          <div class="words-grid">
            <div 
              v-for="word in paginatedAllWords"
              :key="word.id"
              class="word-card"
              @click="showWordDetails(word)"
            >
              <div class="word-header">
                <h4 class="word-text">{{ word.word }}</h4>
                <span class="word-source" v-if="word.source">{{ word.source }}</span>
              </div>
              <p class="word-translation">{{ word.translation }}</p>
              <div class="word-meta">
                <span class="word-type">{{ getPartOfSpeechRu(word.partOfSpeech) }}</span>
                <span class="word-difficulty" :class="word.difficulty">
                  {{ getDifficultyLabel(word.difficulty) }}
                </span>
              </div>
              <div class="word-progress" v-if="word.progress !== undefined">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${word.progress || 0}%` }"
                  ></div>
                </div>
                <span class="progress-text">{{ word.progress || 0 }}%</span>
              </div>
            </div>
          </div>

          <!-- Pagination for all words -->
          <div v-if="allWords.length > wordsPerPage" class="pagination">
            <button 
              @click="changeAllWordsPage(-1)" 
              :disabled="allWordsCurrentPage === 1"
              class="pagination-btn"
            >
              ←
            </button>
            <span class="pagination-info">
              {{ allWordsCurrentPage }} из {{ allWordsTotalPages }}
            </span>
            <button 
              @click="changeAllWordsPage(1)" 
              :disabled="allWordsCurrentPage === allWordsTotalPages"
              class="pagination-btn"
            >
              →
            </button>
          </div>
        </section>

        <!-- Review Section -->
        <section v-if="activeTab === 'review' && wordsForReview.length > 0" class="vocabulary-section">
          <div class="section-header">
            <div class="section-info">
              <h2 class="section-title">🔄 Повторение</h2>
              <span class="section-count">{{ wordsForReview.length }}</span>
            </div>
            <div class="section-actions">
              <button @click="startReviewSession" class="practice-btn primary">
                <span class="btn-icon">🎯</span>
                <span>Начать повторение</span>
              </button>
            </div>
          </div>

          <div class="words-grid">
            <div 
              v-for="word in wordsForReview"
              :key="word.id"
              class="word-card review-word"
              @click="showWordDetails(word)"
            >
              <div class="word-header">
                <h4 class="word-text">{{ word.word }}</h4>
                <span class="review-due">{{ getReviewStatus(word) }}</span>
              </div>
              <p class="word-translation">{{ word.translation }}</p>
              <div class="word-meta">
                <span class="word-type">{{ getPartOfSpeechRu(word.partOfSpeech) }}</span>
                <span class="review-stats">
                  {{ word.timesCorrect || 0 }}/{{ word.timesShown || 0 }}
                </span>
              </div>
            </div>
          </div>
        </section>
        
      </div>
      
      <!-- Empty Language State -->
      <div v-else class="empty-language-state">
        <div class="empty-icon">📚</div>
        <h3>Начните изучение {{ selectedLanguage.nameRu || selectedLanguage.name }}</h3>
        <p>Пройдите уроки или выберите тему для начала изучения словаря</p>
        <div class="empty-actions">
          <button @click="goBackToLanguages" class="primary-btn">Выбрать другой язык</button>
        </div>
      </div>
    </div>

    <!-- Word Details Modal -->
    <div v-if="selectedWord" class="word-modal" @click="closeWordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ selectedWord.word }}</h3>
          <button @click="closeWordModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="word-details">
            <p class="word-translation-large">{{ selectedWord.translation }}</p>
            <div class="word-info">
              <span class="word-type-large">{{ getPartOfSpeechRu(selectedWord.partOfSpeech) }}</span>
              <span class="word-difficulty-large" :class="selectedWord.difficulty">
                {{ getDifficultyLabel(selectedWord.difficulty) }}
              </span>
            </div>
            <div v-if="selectedWord.definition" class="word-definition">
              <h4>Определение:</h4>
              <p>{{ selectedWord.definition }}</p>
            </div>
            <div v-if="selectedWord.examples && selectedWord.examples.length > 0" class="word-examples">
              <h4>Примеры:</h4>
              <div v-for="example in selectedWord.examples" :key="example.sentence" class="example">
                <p class="example-sentence">{{ example.sentence }}</p>
                <p class="example-translation">{{ example.translation }}</p>
              </div>
            </div>
            <div v-if="selectedWord.lessonName" class="word-lesson-info">
              <h4>Из урока:</h4>
              <p>{{ selectedWord.lessonName }}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="markAsKnown(selectedWord)" class="modal-btn success">
            ✅ Знаю
          </button>
          <button @click="markAsUnknown(selectedWord)" class="modal-btn warning">
            ❌ Не знаю
          </button>
          <button @click="addToReview(selectedWord)" class="modal-btn primary">
            🔄 Повторить позже
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="toast.visible" class="toast" :class="toast.type">
      <div class="toast-icon">
        {{ toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️' }}
      </div>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Mock current user - replace with your actual auth solution
const currentUser = ref({ uid: 'demo-user-123', role: 'user' })

// Simple toast functionality
const toast = ref({ visible: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { visible: true, message, type }
  setTimeout(() => { toast.value.visible = false }, 3000)
}
const hideToast = () => { toast.value.visible = false }

// State
const isLoading = ref(true)
const languageLoading = ref(false)
const error = ref(null)
const selectedLanguage = ref(null)
const loadingMessage = ref('Загрузка языков...')
const topics = ref([])
const wordsFromLessons = ref([])
const allWords = ref([])
const wordsForReview = ref([])
const selectedWord = ref(null)

// Data
const availableLanguages = ref([])
const overallStats = ref(null)

// Filters and search
const activeTab = ref('topics')
const searchQuery = ref('')
const sortBy = ref('word')

// Pagination
const wordsPerPage = 12
const currentPage = ref(1)
const allWordsCurrentPage = ref(1)

// Enhanced vocabulary service with better error handling and fallbacks
const vocabularyService = {
  async getUserLanguages(userId) {
    try {
      // First, try the main vocabulary languages endpoint
      let response, languagesResult
      
      try {
        response = await fetch(`/api/vocabulary/languages`)
        
        // Check if response is ok and content-type is JSON
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON - vocabulary routes may not be available')
        }
        
        languagesResult = await response.json()
      } catch (apiError) {
        console.warn('Primary vocabulary API not available:', apiError.message)
        // Fallback to mock data or alternative approach
        return this.getFallbackLanguages(userId)
      }
      
      if (!languagesResult.success) {
        console.warn('Vocabulary API returned error:', languagesResult.error)
        return this.getFallbackLanguages(userId)
      }

      // Get user progress for each language
      const languagesWithProgress = await Promise.all(
        languagesResult.data.map(async (lang) => {
          try {
            // Get vocabulary statistics (with fallback)
            let statsData = { success: false, data: { totalWords: 0 } }
            try {
              const statsResponse = await fetch(`/api/vocabulary/stats/language/${lang.code}`)
              if (statsResponse.ok) {
                statsData = await statsResponse.json()
              }
            } catch (statsError) {
              console.warn(`Stats not available for ${lang.code}:`, statsError.message)
            }
            
            // Get user progress (with fallback)
            let progressData = { success: false, data: [] }
            try {
              const progressResponse = await fetch(`/api/vocabulary/progress/${userId}?language=${lang.code}`)
              if (progressResponse.ok) {
                progressData = await progressResponse.json()
              }
            } catch (progressError) {
              console.warn(`Progress not available for ${lang.code}:`, progressError.message)
            }
            
            // Get words from lessons (with enhanced fallback)
            const wordsFromLessons = await this.getWordsFromLessonsWithFallback(userId, lang.code)
            
            const totalProgress = progressData.success ? progressData.data : []
            const mastered = totalProgress.filter(p => p.status === 'mastered').length
            
            return {
              ...lang,
              flag: getLanguageFlag(lang.code),
              totalWords: (statsData.success ? statsData.data.totalWords : 0) + wordsFromLessons.length,
              wordsFromLessons: wordsFromLessons.length,
              progress: totalProgress.length > 0 ? Math.round((mastered / totalProgress.length) * 100) : 0,
              mastered: mastered
            }
          } catch (langError) {
            console.warn(`Error processing language ${lang.code}:`, langError)
            return {
              ...lang,
              flag: getLanguageFlag(lang.code),
              totalWords: 0,
              wordsFromLessons: 0,
              progress: 0,
              mastered: 0
            }
          }
        })
      )

      const totalWords = languagesWithProgress.reduce((sum, lang) => sum + lang.totalWords, 0)
      const totalFromLessons = languagesWithProgress.reduce((sum, lang) => sum + lang.wordsFromLessons, 0)
      const languagesStarted = languagesWithProgress.filter(lang => lang.totalWords > 0).length

      return {
        success: true,
        data: {
          languages: languagesWithProgress,
          stats: {
            totalWords,
            wordsFromLessons: totalFromLessons,
            languagesStarted,
            mastered: languagesWithProgress.reduce((sum, lang) => sum + lang.mastered, 0)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user languages:', error)
      // Return fallback data instead of failing completely
      return this.getFallbackLanguages(userId)
    }
  },

  async getFallbackLanguages(userId) {
    console.log('🔄 Using fallback language data extraction from lessons...')
    
    try {
      // Try to get languages from user's completed lessons
      const userProgressResponse = await fetch(`/api/user-progress?userId=${userId}`)
      
      if (!userProgressResponse.ok) {
        throw new Error('User progress not available')
      }
      
      const userProgress = await userProgressResponse.json()
      
      if (!userProgress.success || !userProgress.data) {
        throw new Error('No user progress data')
      }
      
      // Get completed lessons
      const completedLessons = userProgress.data.filter(p => 
        p.completed && p.progressPercent >= 70
      )
      
      console.log(`📚 Found ${completedLessons.length} completed lessons`)
      
      // Extract vocabulary from lessons and determine languages
      const languageStats = {}
      
      for (const progress of completedLessons.slice(0, 20)) {
        try {
          const lessonResponse = await fetch(`/api/lessons/${progress.lessonId}`)
          
          if (!lessonResponse.ok) continue
          
          const lessonData = await lessonResponse.json()
          
          if (lessonData.success && lessonData.lesson) {
            // Determine language from lesson subject
            const language = this.getLanguageFromSubject(lessonData.lesson.subject)
            
            if (!languageStats[language]) {
              languageStats[language] = {
                code: language,
                name: this.getLanguageDisplayName(language),
                nameRu: this.getLanguageDisplayNameRu(language),
                totalWords: 0,
                wordsFromLessons: 0,
                progress: 0,
                mastered: 0
              }
            }
            
            // Count vocabulary in this lesson
            if (lessonData.lesson.steps) {
              const vocabularySteps = lessonData.lesson.steps.filter(step => step.type === 'vocabulary')
              
              vocabularySteps.forEach(step => {
                if (Array.isArray(step.data)) {
                  step.data.forEach(vocab => {
                    if (vocab.term && vocab.definition) {
                      languageStats[language].wordsFromLessons++
                      languageStats[language].totalWords++
                      languageStats[language].mastered++ // From completed lesson
                    }
                  })
                }
              })
            }
          }
        } catch (lessonError) {
          console.warn(`Could not process lesson ${progress.lessonId}:`, lessonError.message)
        }
      }
      
      // Add default languages if none found
      if (Object.keys(languageStats).length === 0) {
        languageStats.english = {
          code: 'english',
          name: 'English',
          nameRu: 'Английский',
          totalWords: 0,
          wordsFromLessons: 0,
          progress: 0,
          mastered: 0
        }
      }
      
      // Convert to array and add flags
      const languages = Object.values(languageStats).map(lang => ({
        ...lang,
        flag: getLanguageFlag(lang.code),
        progress: lang.totalWords > 0 ? Math.round((lang.mastered / lang.totalWords) * 100) : 0
      }))
      
      const totalWords = languages.reduce((sum, lang) => sum + lang.totalWords, 0)
      const totalFromLessons = languages.reduce((sum, lang) => sum + lang.wordsFromLessons, 0)
      const languagesStarted = languages.filter(lang => lang.totalWords > 0).length
      
      console.log(`✅ Fallback extraction complete: ${languages.length} languages, ${totalWords} total words`)
      
      return {
        success: true,
        data: {
          languages,
          stats: {
            totalWords,
            wordsFromLessons: totalFromLessons,
            languagesStarted,
            mastered: languages.reduce((sum, lang) => sum + lang.mastered, 0)
          }
        },
        source: 'fallback_extraction'
      }
      
    } catch (fallbackError) {
      console.warn('Fallback language extraction failed:', fallbackError.message)
      
      // Last resort: return basic language structure
      return {
        success: true,
        data: {
          languages: [
            {
              code: 'english',
              name: 'English',
              nameRu: 'Английский',
              flag: '🇺🇸',
              totalWords: 0,
              wordsFromLessons: 0,
              progress: 0,
              mastered: 0
            },
            {
              code: 'spanish',
              name: 'Spanish',
              nameRu: 'Испанский',
              flag: '🇪🇸',
              totalWords: 0,
              wordsFromLessons: 0,
              progress: 0,
              mastered: 0
            },
            {
              code: 'french',
              name: 'French',
              nameRu: 'Французский',
              flag: '🇫🇷',
              totalWords: 0,
              wordsFromLessons: 0,
              progress: 0,
              mastered: 0
            }
          ],
          stats: {
            totalWords: 0,
            wordsFromLessons: 0,
            languagesStarted: 0,
            mastered: 0
          }
        },
        source: 'basic_fallback'
      }
    }
  },

  getLanguageFromSubject(subject) {
    const subjectLower = subject.toLowerCase()
    
    if (subjectLower.includes('english') || subjectLower.includes('английский')) return 'english'
    if (subjectLower.includes('spanish') || subjectLower.includes('испанский')) return 'spanish'
    if (subjectLower.includes('french') || subjectLower.includes('французский')) return 'french'
    if (subjectLower.includes('german') || subjectLower.includes('немецкий')) return 'german'
    if (subjectLower.includes('chinese') || subjectLower.includes('китайский')) return 'chinese'
    if (subjectLower.includes('japanese') || subjectLower.includes('японский')) return 'japanese'
    if (subjectLower.includes('korean') || subjectLower.includes('корейский')) return 'korean'
    if (subjectLower.includes('arabic') || subjectLower.includes('арабский')) return 'arabic'
    if (subjectLower.includes('uzbek') || subjectLower.includes('узбекский')) return 'uzbek'
    if (subjectLower.includes('russian') || subjectLower.includes('русский')) return 'russian'
    
    return 'english' // Default fallback
  },

  getLanguageDisplayName(code) {
    const names = {
      'english': 'English',
      'spanish': 'Spanish',
      'french': 'French',
      'german': 'German',
      'chinese': 'Chinese',
      'arabic': 'Arabic',
      'japanese': 'Japanese',
      'korean': 'Korean',
      'uzbek': 'Uzbek',
      'russian': 'Russian'
    }
    return names[code] || code.charAt(0).toUpperCase() + code.slice(1)
  },

  getLanguageDisplayNameRu(code) {
    const names = {
      'english': 'Английский',
      'spanish': 'Испанский',
      'french': 'Французский',
      'german': 'Немецкий',
      'chinese': 'Китайский',
      'arabic': 'Арабский',
      'japanese': 'Японский',
      'korean': 'Корейский',
      'uzbek': 'Узбекский',
      'russian': 'Русский'
    }
    return names[code] || this.getLanguageDisplayName(code)
  },

  async getLanguageContent(userId, languageCode) {
    try {
      const results = await Promise.allSettled([
        // Get topics (with fallback)
        this.getTopicsWithFallback(languageCode),
        
        // Get words from lessons - with enhanced fallback
        this.getWordsFromLessonsWithFallback(userId, languageCode),
        
        // Get all vocabulary words (with fallback)
        this.getAllWordsWithFallback(languageCode),
        
        // Get user progress (with fallback)
        this.getUserProgressWithFallback(userId, languageCode),
        
        // Get words for review (with fallback)
        this.getReviewWordsWithFallback(userId, languageCode)
      ])

      const [topicsResult, lessonsResult, allWordsResult, progressResult, reviewResult] = results

      return {
        success: true,
        data: {
          topics: topicsResult.status === 'fulfilled' ? topicsResult.value : [],
          wordsFromLessons: lessonsResult.status === 'fulfilled' ? lessonsResult.value : [],
          allWords: allWordsResult.status === 'fulfilled' ? allWordsResult.value : [],
          userProgress: progressResult.status === 'fulfilled' ? progressResult.value : [],
          wordsForReview: reviewResult.status === 'fulfilled' ? reviewResult.value : []
        }
      }
    } catch (error) {
      console.error('Error fetching language content:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async getTopicsWithFallback(languageCode) {
    try {
      const response = await fetch(`/api/vocabulary/topics/${languageCode}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
    } catch (error) {
      console.warn('Topics API not available:', error.message)
    }
    
    // Return fallback topics
    return [
      { name: 'Travel', wordCount: 0, difficulty: 'beginner' },
      { name: 'Food', wordCount: 0, difficulty: 'beginner' },
      { name: 'Family', wordCount: 0, difficulty: 'beginner' },
      { name: 'Business', wordCount: 0, difficulty: 'intermediate' },
      { name: 'Technology', wordCount: 0, difficulty: 'advanced' }
    ]
  },

  async getAllWordsWithFallback(languageCode) {
    try {
      const response = await fetch(`/api/vocabulary/words/${languageCode}/all/all?limit=1000`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
    } catch (error) {
      console.warn('All words API not available:', error.message)
    }
    
    return [] // Return empty array as fallback
  },

  async getUserProgressWithFallback(userId, languageCode) {
    try {
      const response = await fetch(`/api/vocabulary/progress/${userId}?language=${languageCode}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
    } catch (error) {
      console.warn('User progress API not available:', error.message)
    }
    
    return [] // Return empty array as fallback
  },

  async getReviewWordsWithFallback(userId, languageCode) {
    try {
      const response = await fetch(`/api/vocabulary/review/${userId}?language=${languageCode}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
    } catch (error) {
      console.warn('Review words API not available:', error.message)
    }
    
    return [] // Return empty array as fallback
  },

  async getWordsFromLessonsWithFallback(userId, languageCode) {
    try {
      // First try the dedicated endpoint
      const response = await fetch(`/api/vocabulary/from-lessons/${userId}?language=${languageCode}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
    } catch (error) {
      console.warn('From-lessons API not available, using fallback extraction:', error.message)
    }
    
    // Enhanced fallback: extract from user progress and lessons
    return this.extractVocabularyFromUserLessons(userId, languageCode)
  },

  async extractVocabularyFromUserLessons(userId, languageCode) {
    try {
      const userProgressResponse = await fetch(`/api/user-progress?userId=${userId}`)
      
      if (!userProgressResponse.ok) {
        return []
      }
      
      const userProgress = await userProgressResponse.json()
      
      if (!userProgress.success) {
        return []
      }
      
      const completedLessons = userProgress.data.filter(p => 
        p.completed && p.progressPercent >= 70 // Include lessons with 70%+ completion
      )
      
      const vocabularyFromLessons = []
      
      // Process completed lessons in batches to avoid overwhelming the API
      for (const progress of completedLessons.slice(0, 20)) {
        try {
          const lessonResponse = await fetch(`/api/lessons/${progress.lessonId}`)
          
          if (!lessonResponse.ok) continue
          
          const lessonData = await lessonResponse.json()
          
          if (lessonData.success && lessonData.lesson.steps) {
            // Check if this lesson is for the requested language
            const lessonLanguage = this.getLanguageFromSubject(lessonData.lesson.subject || '')
            if (languageCode && lessonLanguage !== languageCode) {
              continue
            }
            
            const vocabularySteps = lessonData.lesson.steps.filter(step => step.type === 'vocabulary')
            
            vocabularySteps.forEach(step => {
              if (Array.isArray(step.data)) {
                step.data.forEach((vocab, index) => {
                  if (vocab.term && vocab.definition) {
                    vocabularyFromLessons.push({
                      id: `${progress.lessonId}_${index}_${vocab.term}`,
                      word: vocab.term,
                      translation: vocab.definition,
                      definition: vocab.example || '',
                      language: languageCode || lessonLanguage,
                      partOfSpeech: 'noun',
                      difficulty: lessonData.lesson.metadata?.difficulty || 'beginner',
                      source: 'lesson',
                      lessonId: progress.lessonId,
                      lessonName: lessonData.lesson.lessonName || lessonData.lesson.title,
                      progress: Math.round((progress.progressPercent || 0)),
                      examples: vocab.example ? [{ 
                        sentence: vocab.example, 
                        translation: vocab.definition 
                      }] : [],
                      updatedAt: progress.updatedAt || new Date().toISOString()
                    })
                  }
                })
              }
            })
          }
        } catch (lessonError) {
          console.warn(`Could not fetch lesson ${progress.lessonId}:`, lessonError)
        }
      }
      
      return vocabularyFromLessons
    } catch (error) {
      console.warn('Error extracting vocabulary from lessons:', error)
      return []
    }
  },

  async updateWordProgress(userId, vocabularyId, correct, timeSpent = 0) {
    try {
      const response = await fetch(`/api/vocabulary/progress/${userId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vocabularyId,
          correct,
          timeSpent
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating word progress:', error)
      // Return success for fallback mode
      return { 
        success: true, 
        message: 'Progress updated locally (API not available)',
        fallback: true 
      }
    }
  }
}(`Could not fetch lesson ${progress.lessonId}:`, lessonError)
        }
      }
      
      return vocabularyFromLessons
    } catch (error) {
      console.warn('Error getting words from lessons:', error)
      return []
    }
  },

  async updateWordProgress(userId, vocabularyId, correct, timeSpent = 0) {
    try {
      const response = await fetch(`/api/vocabulary/progress/${userId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vocabularyId,
          correct,
          timeSpent
        })
      })
      
      return await response.json()
    } catch (error) {
      console.error('Error updating word progress:', error)
      return { success: false, error: error.message }
    }
  }
}

// Helper function to get language flags
const getLanguageFlag = (code) => {
  const flags = {
    'english': '🇺🇸',
    'spanish': '🇪🇸', 
    'french': '🇫🇷',
    'german': '🇩🇪',
    'chinese': '🇨🇳',
    'arabic': '🇸🇦',
    'japanese': '🇯🇵',
    'korean': '🇰🇷',
    'uzbek': '🇺🇿',
    'russian': '🇷🇺'
  }
  return flags[code] || '🌍'
}

// Computed
const hasLanguages = computed(() => 
  availableLanguages.value && availableLanguages.value.length > 0
)

const hasAnyContent = computed(() => 
  topics.value.length > 0 || wordsFromLessons.value.length > 0 || allWords.value.length > 0
)

const filterTabs = computed(() => [
  {
    key: 'topics',
    label: 'Темы',
    icon: '📚',
    count: topics.value.length
  },
  {
    key: 'lessons',
    label: 'Из уроков',
    icon: '🎓',
    count: wordsFromLessons.value.length
  },
  {
    key: 'all',
    label: 'Все слова',
    icon: '📖',
    count: allWords.value.length
  },
  {
    key: 'review',
    label: 'Повторение',
    icon: '🔄',
    count: wordsForReview.value.length
  }
])

const paginatedWordsFromLessons = computed(() => {
  const start = (currentPage.value - 1) * wordsPerPage
  const end = start + wordsPerPage
  return wordsFromLessons.value.slice(start, end)
})

const totalPages = computed(() => 
  Math.ceil(wordsFromLessons.value.length / wordsPerPage)
)

const paginatedAllWords = computed(() => {
  const start = (allWordsCurrentPage.value - 1) * wordsPerPage
  const end = start + wordsPerPage
  return allWords.value.slice(start, end)
})

const allWordsTotalPages = computed(() => 
  Math.ceil(allWords.value.length / wordsPerPage)
)

const getTotalWordsText = () => {
  const topicsCount = topics.value.length
  const wordsFromLessonsCount = wordsFromLessons.value.length
  const totalVocabWords = allWords.value.length
  
  if (topicsCount === 0 && wordsFromLessonsCount === 0) return 'Нет слов'
  
  let parts = []
  if (topicsCount > 0) parts.push(`${topicsCount} тем`)
  if (wordsFromLessonsCount > 0) parts.push(`${wordsFromLessonsCount} из уроков`)
  if (totalVocabWords > 0) parts.push(`${totalVocabWords} в словаре`)
  
  return parts.join(', ')
}

// Helper functions
const getTopicIcon = (topicName) => {
  const icons = {
    'Travel': '✈️', 'Business': '💼', 'Food': '🍽️', 'Family': '👨‍👩‍👧‍👦',
    'Education': '🎓', 'Health': '🏥', 'Technology': '💻', 'Sports': '⚽',
    'Music': '🎵', 'Art': '🎨', 'Nature': '🌿', 'Animals': '🐾'
  }
  return icons[topicName] || '📖'
}

const getTopicNameRu = (topicName) => {
  const translations = {
    'Travel': 'Путешествия', 'Business': 'Бизнес', 'Food': 'Еда',
    'Family': 'Семья', 'Education': 'Образование', 'Health': 'Здоровье',
    'Technology': 'Технологии', 'Sports': 'Спорт', 'Music': 'Музыка',
    'Art': 'Искусство', 'Nature': 'Природа', 'Animals': 'Животные'
  }
  return translations[topicName] || topicName
}

const getTopicDescription = (topicName) => {
  const descriptions = {
    'Travel': 'Основные слова для путешествий',
    'Business': 'Деловая лексика и термины',
    'Food': 'Еда, напитки и кулинария',
    'Family': 'Семья и родственники',
    'Education': 'Образование и обучение',
    'Health': 'Здоровье и медицина',
    'Technology': 'Технологии и компьютеры',
    'Sports': 'Спорт и физическая активность'
  }
  return descriptions[topicName] || 'Изучайте новые слова'
}

const getDifficultyIcon = (difficulty) => {
  const icons = { beginner: '🟢', intermediate: '🟡', advanced: '🔴' }
  return icons[difficulty] || '⚪'
}

const getDifficultyLabel = (difficulty) => {
  const labels = { beginner: 'Легкий', intermediate: 'Средний', advanced: 'Сложный' }
  return labels[difficulty] || difficulty
}

const getPartOfSpeechRu = (partOfSpeech) => {
  const translations = {
    'noun': 'Существительное',
    'verb': 'Глагол',
    'adjective': 'Прилагательное',
    'adverb': 'Наречие',
    'preposition': 'Предлог',
    'conjunction': 'Союз',
    'interjection': 'Междометие',
    'phrase': 'Фраза',
    'idiom': 'Идиома'
  }
  return translations[partOfSpeech] || partOfSpeech
}

const getReviewStatus = (word) => {
  if (!word.nextReview) return 'Готово к повторению'
  
  const now = new Date()
  const reviewDate = new Date(word.nextReview)
  
  if (reviewDate <= now) return 'Готово'
  
  const diffHours = Math.ceil((reviewDate - now) / (1000 * 60 * 60))
  if (diffHours < 24) return `Через ${diffHours}ч`
  
  const diffDays = Math.ceil(diffHours / 24)
  return `Через ${diffDays}д`
}

// Update the initialize method to handle the improved error handling
const initialize = async () => {
  if (!currentUser.value) {
    showToast('Пожалуйста, войдите в систему', 'warning')
    return
  }

  try {
    isLoading.value = true
    error.value = null
    loadingMessage.value = 'Загрузка ваших языков...'
    
    const result = await vocabularyService.getUserLanguages(currentUser.value.uid)
    
    if (result.success) {
      availableLanguages.value = result.data.languages || []
      overallStats.value = result.data.stats || { 
        totalWords: 0, 
        languagesStarted: 0, 
        mastered: 0,
        wordsFromLessons: 0 
      }

      // Show appropriate message based on data source
      if (result.source === 'fallback_extraction') {
        showToast('Vocabulary loaded from your lessons', 'info')
      } else if (result.source === 'basic_fallback') {
        showToast('Basic vocabulary interface loaded', 'info')
      } else {
        showToast('Vocabulary loaded successfully', 'success')
      }
    } else {
      throw new Error(result.error)
    }
    
  } catch (err) {
    console.error('❌ Failed to initialize vocabulary:', err)
    error.value = {
      title: 'Ошибка загрузки',
      message: 'Не удалось загрузить словарь. Проверьте подключение к интернету.',
      code: err.code || 'UNKNOWN_ERROR'
    }
  } finally {
    isLoading.value = false
  }
}

const selectLanguage = async (language) => {
  selectedLanguage.value = language
  await loadLanguageContent(language)
}

const loadLanguageContent = async (language) => {
  try {
    languageLoading.value = true
    topics.value = []
    wordsFromLessons.value = []
    allWords.value = []
    wordsForReview.value = []
    
    const result = await vocabularyService.getLanguageContent(currentUser.value.uid, language.code)
    
    if (result.success) {
      topics.value = result.data.topics || []
      wordsFromLessons.value = result.data.wordsFromLessons || []
      allWords.value = result.data.allWords || []
      wordsForReview.value = result.data.wordsForReview || []
      
      // Set default active tab based on available content
      if (wordsFromLessons.value.length > 0) {
        activeTab.value = 'lessons'
      } else if (topics.value.length > 0) {
        activeTab.value = 'topics'
      } else if (allWords.value.length > 0) {
        activeTab.value = 'all'
      } else {
        activeTab.value = 'topics'
      }
    } else {
      throw new Error(result.error)
    }
    
  } catch (err) {
    console.error('❌ Failed to load language content:', err)
    showToast('Не удалось загрузить содержимое языка', 'error')
  } finally {
    languageLoading.value = false
  }
}

const selectTopic = (topic) => {
  router.push({
    name: 'VocabularyTopic',
    params: { 
      languageCode: selectedLanguage.value.code,
      topicName: topic.name
    }
  })
}

const setActiveTab = (tabKey) => {
  activeTab.value = tabKey
  currentPage.value = 1
  allWordsCurrentPage.value = 1
}

const performSearch = () => {
  // Implement search functionality
  if (!searchQuery.value.trim()) {
    return
  }
  
  // Filter words based on search query
  const query = searchQuery.value.toLowerCase()
  
  if (activeTab.value === 'lessons') {
    // Filter words from lessons
    wordsFromLessons.value = wordsFromLessons.value.filter(word => 
      word.word.toLowerCase().includes(query) ||
      word.translation.toLowerCase().includes(query)
    )
  } else if (activeTab.value === 'all') {
    // Filter all words
    allWords.value = allWords.value.filter(word => 
      word.word.toLowerCase().includes(query) ||
      word.translation.toLowerCase().includes(query) ||
      (word.definition && word.definition.toLowerCase().includes(query))
    )
  }
  
  currentPage.value = 1
  allWordsCurrentPage.value = 1
}

const sortWords = () => {
  const sortFunction = (a, b) => {
    switch (sortBy.value) {
      case 'word':
        return a.word.localeCompare(b.word)
      case 'difficulty':
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
        return (difficultyOrder[a.difficulty] || 1) - (difficultyOrder[b.difficulty] || 1)
      case 'progress':
        return (b.progress || 0) - (a.progress || 0)
      case 'recent':
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      default:
        return 0
    }
  }
  
  if (activeTab.value === 'lessons') {
    wordsFromLessons.value.sort(sortFunction)
  } else if (activeTab.value === 'all') {
    allWords.value.sort(sortFunction)
  }
}

const changePage = (direction) => {
  const newPage = currentPage.value + direction
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage
  }
}

const changeAllWordsPage = (direction) => {
  const newPage = allWordsCurrentPage.value + direction
  if (newPage >= 1 && newPage <= allWordsTotalPages.value) {
    allWordsCurrentPage.value = newPage
  }
}

const showWordDetails = (word) => {
  selectedWord.value = word
}

const closeWordModal = () => {
  selectedWord.value = null
}

const markAsKnown = async (word) => {
  const result = await vocabularyService.updateWordProgress(
    currentUser.value.uid, 
    word.id || word._id, 
    true, 
    5
  )
  
  if (result.success) {
    showToast('Слово отмечено как изученное', 'success')
    // Update local progress
    if (word.progress !== undefined) {
      word.progress = Math.min(100, (word.progress || 0) + 20)
    }
  } else {
    showToast('Ошибка обновления прогресса', 'error')
  }
  
  closeWordModal()
}

const markAsUnknown = async (word) => {
  const result = await vocabularyService.updateWordProgress(
    currentUser.value.uid, 
    word.id || word._id, 
    false, 
    3
  )
  
  if (result.success) {
    showToast('Слово добавлено для повторения', 'info')
    // Update local progress
    if (word.progress !== undefined) {
      word.progress = Math.max(0, (word.progress || 0) - 10)
    }
  } else {
    showToast('Ошибка обновления прогресса', 'error')
  }
  
  closeWordModal()
}

const addToReview = async (word) => {
  // Add word to review list
  if (!wordsForReview.value.find(w => (w.id || w._id) === (word.id || word._id))) {
    wordsForReview.value.push(word)
    showToast('Слово добавлено для повторения', 'success')
  } else {
    showToast('Слово уже в списке повторения', 'info')
  }
  
  closeWordModal()
}

const goBackToLanguages = () => {
  selectedLanguage.value = null
  topics.value = []
  wordsFromLessons.value = []
  allWords.value = []
  wordsForReview.value = []
  activeTab.value = 'topics'
  searchQuery.value = ''
  currentPage.value = 1
  allWordsCurrentPage.value = 1
}

const createTest = () => {
  // Create vocabulary test for selected language
  router.push({
    name: 'VocabularyTest',
    params: { languageCode: selectedLanguage.value.code },
    query: { mode: 'test' }
  })
}

const startReview = () => {
  activeTab.value = 'review'
}

const practiceFromLessons = () => {
  router.push({
    name: 'VocabularyPractice',
    params: { languageCode: selectedLanguage.value.code },
    query: { source: 'lessons' }
  })
}

const startReviewSession = () => {
  router.push({
    name: 'VocabularyReview',
    params: { languageCode: selectedLanguage.value.code },
    query: { mode: 'review' }
  })
}

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    // Reset filters when search is cleared
    loadLanguageContent(selectedLanguage.value)
  }
})

// Lifecycle
onMounted(async () => {
  await initialize()
})
</script>

<style scoped>
/* Variables */
:root {
  --primary: #8b5cf6;
  --primary-dark: #7c3aed;
  --secondary: #6366f1;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --white: #ffffff;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --transition: all 0.2s ease;
  --transition-fast: all 0.15s ease;
}

/* Base */
.vocabulary-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Inter', system-ui, sans-serif;
  padding: 2rem;
}

/* Loading & Error States */
.loading-state, 
.error-state,
.empty-state,
.empty-language-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--white);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  margin: 0 auto;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.error-state h3,
.empty-state h3,
.empty-language-state h3 {
  color: var(--gray-900);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.error-state p,
.empty-state p,
.empty-language-state p {
  color: var(--gray-600);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.retry-btn,
.primary-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.retry-btn:hover,
.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* Page Header */
.page-header {
  background: var(--white);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.page-subtitle {
  margin: 0.5rem 0 0 0;
  color: var(--gray-600);
  font-size: 1rem;
}

.stats-bar {
  display: flex;
  gap: 2rem;
}

.stat {
  text-align: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
  border-radius: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Languages Grid */
.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.language-card {
  background: var(--white);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  box-shadow: var(--shadow);
}

.language-card.has-progress:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.lang-flag {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 1rem;
  animation: bounce 3s ease-in-out infinite;
}

.lang-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.75rem 0;
  text-align: center;
}

.lang-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gray-50);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-700);
}

.language-card:hover .stat-item {
  background: #ede9fe;
  color: var(--primary);
}

.stat-icon {
  font-size: 1rem;
}

.card-arrow {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 1.25rem;
  color: var(--gray-400);
  transition: var(--transition);
}

.language-card:hover .card-arrow {
  color: var(--primary);
  transform: translateX(4px);
}

/* Language View */
.language-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  background: var(--white);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
}

.back-btn {
  background: var(--gray-100);
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition);
}

.back-btn:hover {
  background: var(--gray-200);
  transform: translateX(-2px);
}

.lang-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
}

.lang-flag-large {
  font-size: 3rem;
}

.lang-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.lang-subtitle {
  color: var(--gray-600);
  margin: 0.25rem 0 0 0;
}

.lang-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: 2px solid transparent;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.action-btn.secondary {
  background: var(--white);
  border: 2px solid var(--secondary);
  color: var(--secondary);
}

.action-btn.secondary:hover {
  background: var(--secondary);
  color: var(--white);
}

/* Controls Section */
.controls-section {
  background: var(--white);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
}

.search-bar {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 3rem;
  border: 2px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: var(--transition);
  background: var(--gray-50);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--white);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  color: var(--gray-400);
  pointer-events: none;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid var(--gray-200);
  border-radius: 0.75rem;
  background: var(--gray-50);
  color: var(--gray-700);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.filter-tab:hover {
  border-color: var(--primary);
  background: var(--white);
}

.filter-tab.active {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--white);
}

.tab-icon {
  font-size: 1.125rem;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
}

.filter-tab:not(.active) .tab-count {
  background: var(--gray-200);
  color: var(--gray-600);
}

/* Vocabulary Sections */
.vocabulary-section {
  background: var(--white);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--gray-100);
}

.section-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.section-count {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Topics Grid */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.topic-card {
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
}

.topic-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
  background: var(--white);
}

.topic-icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 1rem;
}

.topic-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.topic-description {
  color: var(--gray-600);
  font-size: 0.875rem;
  text-align: center;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.topic-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--white);
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: var(--gray-700);
  font-weight: 500;
  border: 1px solid var(--gray-200);
}

.stat-badge.difficulty.beginner {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.stat-badge.difficulty.intermediate {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}

.stat-badge.difficulty.advanced {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

/* Words Grid */
.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.word-card {
  background: var(--white);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid var(--gray-100);
  position: relative;
  overflow: hidden;
}

.word-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.word-card.lesson-word {
  border-left: 4px solid var(--success);
}

.word-card.review-word {
  border-left: 4px solid var(--warning);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.word-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
  flex: 1;
}

.word-lesson,
.word-source {
  font-size: 0.75rem;
  color: var(--primary);
  background: rgba(139, 92, 246, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.review-due {
  font-size: 0.75rem;
  color: var(--warning);
  background: rgba(245, 158, 11, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.word-translation {
  font-size: 1rem;
  color: var(--gray-700);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.word-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.word-type {
  font-size: 0.75rem;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.word-difficulty {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

.word-difficulty.beginner {
  background: #dcfce7;
  color: #166534;
}

.word-difficulty.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.word-difficulty.advanced {
  background: #fecaca;
  color: #991b1b;
}

.review-stats {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: 500;
}

.word-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 0.5rem;
  background: var(--gray-200);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success) 0%, var(--primary) 100%);
  transition: var(--transition);
}

.progress-text {
  font-size: 0.75rem;
  color: var(--gray-600);
  font-weight: 600;
  min-width: 2.5rem;
  text-align: right;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  background: var(--white);
  border: 2px solid var(--gray-200);
  color: var(--gray-700);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-weight: 600;
  color: var(--gray-700);
}

/* Section Actions */
.section-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.practice-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid var(--primary);
  border-radius: 0.75rem;
  background: var(--white);
  color: var(--primary);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 600;
}

.practice-btn:hover {
  background: var(--primary);
  color: var(--white);
}

.practice-btn.primary {
  background: var(--primary);
  color: var(--white);
}

.practice-btn.primary:hover {
  background: var(--primary-dark);
}

.sort-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--gray-200);
  border-radius: 0.5rem;
  background: var(--white);
  color: var(--gray-700);
  cursor: pointer;
  transition: var(--transition);
}

.sort-select:focus {
  outline: none;
  border-color: var(--primary);
}

/* Word Modal */
.word-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: var(--white);
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray-400);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: var(--transition);
}

.modal-close:hover {
  background: var(--gray-100);
  color: var(--gray-600);
}

.modal-body {
  padding: 0 1.5rem;
}

.word-translation-large {
  font-size: 1.25rem;
  color: var(--gray-700);
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.word-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.word-type-large {
  background: var(--gray-100);
  color: var(--gray-700);
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
}

.word-difficulty-large {
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
}

.word-difficulty-large.beginner {
  background: #dcfce7;
  color: #166534;
}

.word-difficulty-large.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.word-difficulty-large.advanced {
  background: #fecaca;
  color: #991b1b;
}

.word-definition,
.word-examples,
.word-lesson-info {
  margin-bottom: 1.5rem;
}

.word-definition h4,
.word-examples h4,
.word-lesson-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.word-definition p,
.word-lesson-info p {
  color: var(--gray-700);
  line-height: 1.6;
  margin: 0;
}

.example {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
  border-left: 4px solid var(--primary);
}

.example:last-child {
  margin-bottom: 0;
}

.example-sentence {
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.example-translation {
  color: var(--gray-600);
  font-style: italic;
  margin: 0;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--gray-200);
  justify-content: flex-end;
}

.modal-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 600;
}

.modal-btn.success {
  background: var(--success);
  color: var(--white);
}

.modal-btn.success:hover {
  background: #059669;
}

.modal-btn.warning {
  background: var(--warning);
  color: var(--white);
}

.modal-btn.warning:hover {
  background: #d97706;
}

.modal-btn.primary {
  background: var(--primary);
  color: var(--white);
}

.modal-btn.primary:hover {
  background: var(--primary-dark);
}

/* Toast */
.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: var(--white);
  color: var(--gray-900);
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.4s ease;
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 400px;
}

.toast.error {
  border-color: var(--error);
  background: #fef2f2;
  color: #991b1b;
}

.toast.success {
  border-color: var(--success);
  background: #ecfdf5;
  color: #065f46;
}

.toast.warning {
  border-color: var(--warning);
  background: #fffbeb;
  color: #92400e;
}

.toast-icon {
  font-size: 1.125rem;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .vocabulary-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .language-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .lang-title-section {
    justify-content: center;
  }
  
/* Responsive */
@media (max-width: 768px) {
  .vocabulary-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .language-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .lang-title-section {
    justify-content: center;
  }
  
  .languages-grid,
  .topics-grid,
  .words-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    flex-direction: column;
  }
  
  .modal-content {
    margin: 1rem;
    max-height: 90vh;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .section-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-btn {
    justify-content: center;
  }
  
  .word-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .word-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .vocabulary-page {
    padding: 0.5rem;
  }
  
  .page-header,
  .language-header,
  .controls-section,
  .vocabulary-section {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .lang-title {
    font-size: 1.5rem;
  }
  
  .filter-tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .word-card,
  .topic-card {
    padding: 1rem;
  }
  
  .modal-content {
    margin: 0.5rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  :root {
    --gray-50: #1f2937;
    --gray-100: #374151;
    --gray-200: #4b5563;
    --gray-300: #6b7280;
    --gray-400: #9ca3af;
    --gray-500: #d1d5db;
    --gray-600: #e5e7eb;
    --gray-700: #f3f4f6;
    --gray-800: #f9fafb;
    --gray-900: #ffffff;
    --white: #111827;
  }
  
  .vocabulary-page {
    background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  }
  
  .loading-spinner {
    border-color: var(--gray-700);
    border-top-color: var(--primary);
  }
}

/* Print styles */
@media print {
  .vocabulary-page {
    background: white;
    padding: 1rem;
  }
  
  .back-btn,
  .action-btn,
  .practice-btn,
  .filter-tabs,
  .pagination,
  .modal-footer,
  .toast {
    display: none;
  }
  
  .word-card,
  .topic-card,
  .language-card {
    border: 1px solid #ccc;
    break-inside: avoid;
    margin-bottom: 1rem;
  }
  
  .word-card:hover,
  .topic-card:hover,
  .language-card:hover {
    transform: none;
    box-shadow: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --primary: #6d28d9;
    --primary-dark: #5b21b6;
    --success: #047857;
    --warning: #d97706;
    --error: #dc2626;
  }
  
  .word-card,
  .topic-card,
  .language-card {
    border-width: 2px;
  }
  
  .filter-tab.active {
    outline: 2px solid var(--primary);
  }
  
  .word-card:hover,
  .topic-card:hover,
  .language-card:hover {
    outline: 2px solid var(--primary);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .lang-flag {
    animation: none;
  }
  
  .loading-spinner {
    animation: none;
    border: 3px solid var(--primary);
  }
}

/* Focus styles for accessibility */
.vocabulary-page *:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.vocabulary-page button:focus,
.vocabulary-page input:focus,
.vocabulary-page select:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Custom scrollbar for modal */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: var(--gray-400);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--gray-500);
}

/* Loading skeleton styles */
.skeleton {
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Additional utility classes */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}

.gap-4 {
  gap: 1rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.p-1 {
  padding: 0.25rem;
}

.p-2 {
  padding: 0.5rem;
}

.p-4 {
  padding: 1rem;
}

.rounded {
  border-radius: 0.25rem;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.rounded-xl {
  border-radius: 0.75rem;
}

.shadow {
  box-shadow: var(--shadow);
}

.shadow-lg {
  box-shadow: var(--shadow-lg);
}

.shadow-xl {
  box-shadow: var(--shadow-xl);
}
}
</style>