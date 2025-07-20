<template>
  <div class="vocabulary-in-page">
    <!-- Header -->
    <div class="page-header">
      <button @click="goBack" class="back-btn">
        ← Назад
      </button>
      
      <div class="language-info">
        <div class="language-flag-container">
          <span class="language-flag">{{ getLanguageFlag(languageCode) }}</span>
        </div>
        <div class="language-details">
          <h1 class="language-title">{{ getLanguageName(languageCode) }}</h1>
          <p class="language-subtitle">
            {{ currentView === 'topics' ? 'Выберите тему для изучения' : 
               currentView === 'learning' ? `Изучение: ${selectedTopic}` :
               currentView === 'test' ? 'Режим тестирования' : '' }}
          </p>
        </div>
      </div>

      <button 
        v-if="currentView === 'topics' && topics.length > 0"
        @click="createTest" 
        class="create-test-btn"
      >
        🎯 Создать тест
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>{{ loadingMessage }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ error.title || 'Ошибка' }}</h3>
      <p>{{ error.message }}</p>
      <button @click="initialize" class="retry-btn">Повторить</button>
    </div>

    <!-- Topics View -->
    <section v-else-if="currentView === 'topics'" class="topics-section">
      <!-- Topics Grid -->
      <div v-if="topics.length > 0" class="topics-grid">
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
            
            <div class="topic-meta">
              <div class="meta-item">
                <span class="meta-icon">📝</span>
                <span>{{ topic.wordCount }} слов</span>
              </div>
              <div class="meta-item difficulty" :class="topic.difficulty || 'beginner'">
                <span class="meta-icon">{{ getDifficultyIcon(topic.difficulty || 'beginner') }}</span>
                <span>{{ getDifficultyLabel(topic.difficulty || 'beginner') }}</span>
              </div>
            </div>
          </div>
          
          <div class="card-hover-effect">
            <div class="hover-text">Начать изучение</div>
            <div class="hover-arrow">→</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Темы не найдены</h3>
        <p>В этом языке пока нет тем для изучения</p>
        <button @click="goBack" class="clear-btn">Назад к языкам</button>
      </div>
    </section>

    <!-- Learning View -->
    <section v-else-if="currentView === 'learning'" class="learning-section">
      <div class="learning-header">
        <div class="learning-info">
          <h2>{{ getTopicNameRu(selectedTopic) }}</h2>
          <p>{{ currentWords.length }} слов для изучения</p>
        </div>

        <div class="learning-progress">
          <div class="progress-stats">
            <span class="progress-counter">{{ currentWordIndex + 1 }} / {{ currentWords.length }}</span>
            <span class="progress-percentage">{{ Math.round(((currentWordIndex + 1) / currentWords.length) * 100) }}%</span>
          </div>
          <div class="progress-bar-learning">
            <div 
              class="progress-fill-learning" 
              :style="{ width: ((currentWordIndex + 1) / currentWords.length) * 100 + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Learning Complete -->
      <div v-if="learningComplete" class="learning-complete">
        <div class="complete-icon">🎉</div>
        <div class="complete-content">
          <h3>Поздравляем!</h3>
          <p>Вы завершили все слова в теме "{{ getTopicNameRu(selectedTopic) }}"</p>
          
          <div class="complete-stats">
            <div class="stat-item">
              <div class="stat-circle">
                <span class="stat-number">{{ currentWords.length }}</span>
              </div>
              <span class="stat-label">слов изучено</span>
            </div>
            <div class="stat-item">
              <div class="stat-circle">
                <span class="stat-number">{{ learningProgress.length }}</span>
              </div>
              <span class="stat-label">отмечено как изученные</span>
            </div>
          </div>
          
          <div class="complete-actions">
            <button @click="createTest" class="btn primary">
              🎯 Пройти тест
            </button>
            <button @click="goBackToTopics" class="btn secondary">
              Выбрать другую тему
            </button>
          </div>
        </div>
      </div>

      <!-- Word Card -->
      <div v-else-if="currentWords.length > 0" class="word-container">
        <div class="word-card" :key="currentWordIndex">
          <div class="word-header">
            <div class="word-number">{{ currentWordIndex + 1 }}</div>
            <div class="word-type" v-if="currentWords[currentWordIndex]?.partOfSpeech">
              {{ getPartOfSpeechRu(currentWords[currentWordIndex].partOfSpeech) }}
            </div>
          </div>

          <div class="word-main-container">
            <div class="word-main">{{ currentWords[currentWordIndex]?.word }}</div>
            <button 
              @click="pronounceWord(currentWords[currentWordIndex]?.word)"
              class="pronunciation-btn"
              title="Произношение"
            >
              🔊
            </button>
          </div>
          
          <div class="word-details">
            <div class="translation-section">
              <button @click="toggleTranslation" class="toggle-btn" :class="{ active: showTranslation }">
                <span class="toggle-icon">{{ showTranslation ? '👁️' : '👁️‍🗨️' }}</span>
                <span>{{ showTranslation ? 'Скрыть перевод' : 'Показать перевод' }}</span>
              </button>
              
              <div v-if="showTranslation" class="word-translation">
                <div class="translation-text">
                  {{ currentWords[currentWordIndex]?.translation }}
                  <button 
                    @click="pronounceWord(currentWords[currentWordIndex]?.translation, 'ru-RU')"
                    class="mini-pronunciation-btn"
                    title="Произношение перевода"
                  >
                    🔊
                  </button>
                </div>
              </div>
            </div>

            <div v-if="showTranslation && currentWords[currentWordIndex]?.examples?.length > 0" class="word-example">
              <div class="example-label">Пример:</div>
              <div class="example-text">
                {{ currentWords[currentWordIndex].examples[0].sentence }}
                <button 
                  @click="pronounceWord(currentWords[currentWordIndex].examples[0].sentence)"
                  class="mini-pronunciation-btn"
                  title="Произношение примера"
                >
                  🔊
                </button>
              </div>
              <div v-if="currentWords[currentWordIndex].examples[0].translation" class="example-translation">
                {{ currentWords[currentWordIndex].examples[0].translation }}
              </div>
            </div>

            <div v-if="showTranslation && currentWords[currentWordIndex]?.definition" class="word-definition">
              <div class="definition-label">Определение:</div>
              <div class="definition-text">{{ currentWords[currentWordIndex].definition }}</div>
            </div>
          </div>

          <div class="word-actions">
            <button 
              @click="previousWord" 
              :disabled="currentWordIndex === 0"
              class="btn secondary nav-btn"
            >
              ← Предыдущее
            </button>
            
            <button @click="markWordAsLearned" class="btn success learn-btn">
              ✓ Изучено
            </button>
            
            <button 
              @click="nextWord" 
              class="btn primary nav-btn"
            >
              {{ currentWordIndex === currentWords.length - 1 ? 'Завершить' : 'Следующее' }} →
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Test View -->
    <section v-else-if="currentView === 'test'" class="test-section">
      <div class="test-header">
        <h2>Тест: {{ getTopicNameRu(selectedTopic) }}</h2>
        <p v-if="!testComplete">Вопрос {{ currentQuestionIndex + 1 }} из {{ testQuestions.length }}</p>
      </div>

      <!-- Test Results -->
      <div v-if="testComplete" class="test-results">
        <div class="results-icon" :class="{ passed: testResults.passed, failed: !testResults.passed }">
          {{ testResults.passed ? '🎉' : '📚' }}
        </div>
        
        <div class="results-content">
          <h3>{{ testResults.passed ? 'Тест пройден!' : 'Продолжайте практиковаться' }}</h3>
          
          <div class="results-stats">
            <div class="result-item">
              <div class="result-circle" :class="getScoreClass(testResults.percentage)">
                <span class="result-number">{{ testResults.percentage }}%</span>
              </div>
              <span class="result-label">Результат</span>
            </div>
            <div class="result-item">
              <div class="result-circle">
                <span class="result-number">{{ testResults.correct }}/{{ testResults.total }}</span>
              </div>
              <span class="result-label">Правильных</span>
            </div>
          </div>

          <div class="results-actions">
            <button @click="retakeTest" class="btn primary">
              🔄 Пройти заново
            </button>
            <button @click="goBackToTopics" class="btn secondary">
              Вернуться к темам
            </button>
          </div>
        </div>
      </div>

      <!-- Test Question -->
      <div v-else-if="testQuestions.length > 0" class="test-question">
        <div class="question-progress">
          <div class="progress-bar-test">
            <div 
              class="progress-fill-test" 
              :style="{ width: ((currentQuestionIndex + 1) / testQuestions.length) * 100 + '%' }"
            ></div>
          </div>
        </div>

        <div class="question-content">
          <div class="question-header">
            <div class="question-number">{{ currentQuestionIndex + 1 }}</div>
            <h3>Как переводится это слово?</h3>
          </div>
          
          <div class="test-word">
            <span class="word-text">{{ testQuestions[currentQuestionIndex]?.word }}</span>
            <button 
              @click="pronounceWord(testQuestions[currentQuestionIndex]?.word)"
              class="word-pronunciation-btn"
              title="Произношение"
            >
              🔊
            </button>
          </div>
        </div>

        <div class="question-options">
          <button 
            v-for="(option, index) in testQuestions[currentQuestionIndex]?.options" 
            :key="index"
            @click="submitTestAnswer(option)"
            class="option-btn"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
            <span class="option-text">{{ option }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Toast Messages -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <div class="toast-icon">
        {{ toastType === 'success' ? '✅' : toastType === 'error' ? '❌' : 'ℹ️' }}
      </div>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { vocabularyService } from '@/services/vocabularyService'

const router = useRouter()
const route = useRoute()
const { currentUser } = useAuth()

// Reactive data
const loading = ref(true)
const error = ref(null)
const languageCode = ref(route.params.languageCode)
const currentView = ref('topics') // 'topics', 'learning', 'test'
const topics = ref([])
const currentWords = ref([])
const selectedTopic = ref('')
const toastMessage = ref('')
const toastType = ref('success')
const loadingMessage = ref('Загрузка...')

// Learning state
const currentWordIndex = ref(0)
const learningProgress = ref([])
const showTranslation = ref(false)
const learningComplete = ref(false)

// Test state
const testQuestions = ref([])
const currentQuestionIndex = ref(0)
const userAnswers = ref([])
const testComplete = ref(false)
const testResults = ref({})

// Language data
const languageNames = {
  english: 'Английский',
  spanish: 'Испанский', 
  french: 'Французский',
  german: 'Немецкий',
  chinese: 'Китайский',
  arabic: 'Арабский',
  japanese: 'Японский',
  korean: 'Корейский',
  uzbek: 'Узбекский',
  russian: 'Русский'
}

const languageFlags = {
  english: '🇺🇸', spanish: '🇪🇸', french: '🇫🇷', german: '🇩🇪',
  chinese: '🇨🇳', arabic: '🇸🇦', japanese: '🇯🇵', korean: '🇰🇷',
  uzbek: '🇺🇿', russian: '🇷🇺'
}

const speechLanguages = {
  english: 'en-US', spanish: 'es-ES', french: 'fr-FR', german: 'de-DE',
  chinese: 'zh-CN', arabic: 'ar-SA', japanese: 'ja-JP', korean: 'ko-KR',
  uzbek: 'uz-UZ', russian: 'ru-RU'
}

// Helper methods
const getLanguageFlag = (code) => languageFlags[code] || '🌐'
const getLanguageName = (code) => languageNames[code] || code

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
    'Health': 'Здоровье и медицина'
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
    'noun': 'существительное',
    'verb': 'глагол',
    'adjective': 'прилагательное',
    'adverb': 'наречие',
    'phrase': 'фраза',
    'idiom': 'идиома'
  }
  return translations[partOfSpeech] || partOfSpeech
}

const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'average'
  return 'poor'
}

// Toast functionality
const showToast = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  setTimeout(() => { toastMessage.value = '' }, 3000)
}

// Speech synthesis
const pronounceWord = async (text, language = null) => {
  if (!text || !text.trim()) {
    showToast('Нет текста для произношения', 'error')
    return
  }

  if ('speechSynthesis' in window) {
    try {
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text.trim())
      utterance.lang = language || speechLanguages[languageCode.value] || 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 1
      
      speechSynthesis.speak(utterance)
      showToast(`🔊 ${text}`, 'info')
      
    } catch (error) {
      console.warn('⚠️ Speech synthesis failed:', error)
      showToast('Произношение недоступно', 'error')
    }
  } else {
    showToast('Ваш браузер не поддерживает произношение', 'error')
  }
}

// Navigation methods
const goBack = () => {
  if (currentView.value === 'learning' || currentView.value === 'test') {
    currentView.value = 'topics'
    resetLearningState()
  } else {
    router.push({ name: 'VocabularyPage' })
  }
}

const goBackToTopics = () => {
  currentView.value = 'topics'
  resetLearningState()
}

// Topic selection
const selectTopic = async (topic) => {
  selectedTopic.value = topic.name
  currentView.value = 'learning'
  await fetchTopicWords(topic.name)
}

// Learning methods
const resetLearningState = () => {
  currentWordIndex.value = 0
  learningProgress.value = []
  showTranslation.value = false
  learningComplete.value = false
  testQuestions.value = []
  currentQuestionIndex.value = 0
  userAnswers.value = []
  testComplete.value = false
  testResults.value = {}
}

const nextWord = () => {
  if (currentWordIndex.value < currentWords.value.length - 1) {
    currentWordIndex.value++
    showTranslation.value = false
  } else {
    learningComplete.value = true
    showToast('🎉 Вы изучили все слова!')
  }
}

const previousWord = () => {
  if (currentWordIndex.value > 0) {
    currentWordIndex.value--
    showTranslation.value = false
  }
}

const toggleTranslation = () => {
  showTranslation.value = !showTranslation.value
}

const markWordAsLearned = async () => {
  const currentWord = currentWords.value[currentWordIndex.value]
  if (!currentWord || learningProgress.value.includes(currentWord.id)) {
    return
  }

  try {
    const response = await vocabularyService.updateWordProgress(
      currentUser.value.uid, 
      currentWord.id, 
      { correct: true, timeSpent: 0 }
    )

    if (response.success) {
      learningProgress.value.push(currentWord.id)
      showToast('✅ Слово отмечено как изученное')
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error('❌ Failed to mark word as learned:', error)
    showToast('Ошибка при обновлении прогресса', 'error')
  }
}

// Test methods
const createTest = () => {
  if (currentWords.value.length === 0) {
    showToast('Сначала изучите слова', 'error')
    return
  }
  
  currentView.value = 'test'
  generateTestQuestions()
}

const generateTestQuestions = () => {
  const words = currentWords.value.slice()
  const questions = []
  
  // Shuffle words and take up to 10
  const shuffledWords = words.sort(() => Math.random() - 0.5).slice(0, 10)
  
  shuffledWords.forEach(word => {
    // Create wrong answers from other words
    const otherWords = words.filter(w => w.id !== word.id)
    const wrongAnswers = otherWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.translation)
    
    const options = [word.translation, ...wrongAnswers]
      .sort(() => Math.random() - 0.5)
    
    questions.push({
      word: word.word,
      correctAnswer: word.translation,
      options: options
    })
  })
  
  testQuestions.value = questions
  currentQuestionIndex.value = 0
  userAnswers.value = []
  testComplete.value = false
}

const submitTestAnswer = (selectedAnswer) => {
  const currentQuestion = testQuestions.value[currentQuestionIndex.value]
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer
  
  userAnswers.value.push({
    question: currentQuestion,
    userAnswer: selectedAnswer,
    correct: isCorrect
  })

  if (currentQuestionIndex.value < testQuestions.value.length - 1) {
    currentQuestionIndex.value++
  } else {
    completeTest()
  }
}

const completeTest = () => {
  const correctAnswers = userAnswers.value.filter(a => a.correct).length
  const totalQuestions = testQuestions.value.length
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)

  testResults.value = {
    correct: correctAnswers,
    total: totalQuestions,
    percentage: percentage,
    passed: percentage >= 70
  }

  testComplete.value = true
  
  if (testResults.value.passed) {
    showToast(`🎉 Тест пройден! Результат: ${percentage}%`)
  } else {
    showToast(`📚 Продолжайте изучение. Результат: ${percentage}%`, 'info')
  }
}

const retakeTest = () => {
  generateTestQuestions()
}

// API methods
const initialize = async () => {
  if (!currentUser.value) {
    showToast('Пожалуйста, войдите в систему', 'error')
    router.push('/auth/login')
    return
  }

  try {
    loading.value = true
    error.value = null
    loadingMessage.value = 'Загрузка тем...'
    
    // Check if we should go directly to a topic
    const topicFromQuery = route.query.topic
    if (topicFromQuery) {
      selectedTopic.value = topicFromQuery
      currentView.value = 'learning'
      await fetchTopicWords(topicFromQuery)
      return
    }
    
    // Load topics for language selection
    await fetchTopics()
    
  } catch (err) {
    console.error('❌ Failed to initialize:', err)
    error.value = {
      title: 'Ошибка загрузки',
      message: err.message || 'Не удалось загрузить данные',
      code: 'INIT_ERROR'
    }
  } finally {
    loading.value = false
  }
}

const fetchTopics = async () => {
  try {
    const response = await vocabularyService.getLanguageTopics(currentUser.value.uid, languageCode.value)
    
    if (response.success) {
      topics.value = response.data.topics || []
      
      if (topics.value.length === 0) {
        throw new Error('В этом языке пока нет тем для изучения')
      }
    } else {
      throw new Error(response.error || 'Failed to fetch topics')
    }
    
  } catch (err) {
    console.error('❌ Failed to fetch topics:', err)
    throw err
  }
}

const fetchTopicWords = async (topicName) => {
  try {
    loading.value = true
    loadingMessage.value = 'Загрузка слов...'
    
    const response = await vocabularyService.getTopicWords(
      currentUser.value.uid, 
      topicName, 
      languageCode.value
    )
    
    if (response.success) {
      currentWords.value = response.data.words || []
      
      if (currentWords.value.length === 0) {
        throw new Error('В этой теме пока нет слов')
      }
      
      resetLearningState()
    } else {
      throw new Error(response.error || 'Failed to fetch words')
    }
    
  } catch (err) {
    console.error('❌ Failed to fetch topic words:', err)
    error.value = {
      title: 'Ошибка загрузки слов',
      message: err.message,
      code: 'WORDS_ERROR'
    }
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  initialize()
})

onUnmounted(() => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
})
</script>

<style scoped>
/* Variables */
:root {
  --primary: #8b5cf6;
  --primary-dark: #7c3aed;
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
  --transition: all 0.2s ease;
}

/* Base */
.vocabulary-in-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Inter', system-ui, sans-serif;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1.5rem 2rem;
  background: var(--white);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(139, 92, 246, 0.1);
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

.language-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
}

.language-flag {
  font-size: 3rem;
  animation: bounce 3s ease-in-out infinite;
}

.language-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.language-subtitle {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0.25rem 0 0 0;
}

.create-test-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.create-test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* Loading, Error, Empty States */
.loading-state,
.error-state, 
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--white);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
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
.empty-state h3 {
  color: var(--gray-900);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.error-state p,
.empty-state p {
  color: var(--gray-600);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.retry-btn,
.clear-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.retry-btn:hover,
.clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* Topics Grid */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.topic-card {
  background: var(--white);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.topic-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.topic-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.topic-name {
  font-size: 1.25rem;
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

.topic-meta {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gray-50);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-700);
}

.meta-item.difficulty.beginner {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.meta-item.difficulty.intermediate {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.meta-item.difficulty.advanced {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.card-hover-effect {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  opacity: 0;
  transform: translateY(10px);
  transition: var(--transition);
  margin-top: 1rem;
}

.topic-card:hover .card-hover-effect {
  opacity: 1;
  transform: translateY(0);
}

.hover-text {
  font-weight: 600;
  color: var(--primary);
  font-size: 0.875rem;
}

.hover-arrow {
  font-size: 1.125rem;
  color: var(--primary);
  transition: transform var(--transition);
}

.topic-card:hover .hover-arrow {
  transform: translateX(4px);
}

/* Learning Section */
.learning-section {
  animation: fadeInUp 0.6s ease;
}

.learning-header {
  text-align: center;
  margin-bottom: 2rem;
  background: var(--white);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
}

.learning-info h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.learning-info p {
  color: var(--gray-600);
  margin: 0 0 2rem 0;
}

.learning-progress {
  max-width: 400px;
  margin: 0 auto;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-counter,
.progress-percentage {
  font-weight: 700;
  color: var(--primary);
}

.progress-bar-learning {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill-learning {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-dark));
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Learning Complete */
.learning-complete {
  background: var(--white);
  border-radius: 1.5rem;
  padding: 3rem;
  text-align: center;
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--success);
}

.complete-icon {
  font-size: 5rem;
  margin-bottom: 2rem;
  animation: celebrate 2s ease-in-out infinite;
}

.complete-content h3 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--success);
  margin: 0 0 1rem 0;
}

.complete-content p {
  color: var(--gray-600);
  margin-bottom: 2rem;
  font-size: 1.125rem;
  line-height: 1.6;
}

.complete-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 2.5rem;
}

.stat-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 500;
}

.complete-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Word Card */
.word-container {
  max-width: 700px;
  margin: 0 auto;
}

.word-card {
  background: var(--white);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
  border: 2px solid rgba(139, 92, 246, 0.1);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.word-number {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.word-type {
  background: var(--gray-100);
  color: var(--gray-700);
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.word-main-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.word-main {
  font-size: 3rem;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.2;
}

.pronunciation-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.pronunciation-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.word-details {
  margin-bottom: 2.5rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gray-100);
  color: var(--gray-700);
  border: 2px solid var(--gray-300);
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  margin: 0 auto 1.25rem;
  transition: var(--transition);
}

.toggle-btn.active,
.toggle-btn:hover {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border-color: var(--primary);
  transform: translateY(-2px);
}

.word-translation {
  margin-bottom: 1rem;
}

.translation-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  animation: translateAppear 0.4s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.word-example,
.word-definition {
  background: var(--gray-50);
  padding: 1.25rem;
  border-radius: 1rem;
  border-left: 4px solid var(--primary);
  text-align: left;
  margin-top: 1rem;
}

.example-label,
.definition-label {
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.example-text,
.definition-text {
  color: var(--gray-700);
  font-style: italic;
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.example-translation {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-style: normal;
}

.mini-pronunciation-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: var(--transition);
}

.mini-pronunciation-btn:hover {
  transform: scale(1.1);
}

.word-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: 2px solid transparent;
  min-width: 120px;
  justify-content: center;
}

.btn.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.btn.secondary {
  background: var(--white);
  color: var(--gray-700);
  border-color: var(--gray-300);
}

.btn.secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
  transform: translateY(-2px);
}

.btn.secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.success {
  background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.btn.success:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
}

/* Test Section */
.test-section {
  animation: fadeInUp 0.6s ease;
}

.test-header {
  text-align: center;
  margin-bottom: 2rem;
  background: var(--white);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
}

.test-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.test-header p {
  color: var(--gray-600);
}

.test-results {
  background: var(--white);
  border-radius: 1.5rem;
  padding: 3rem;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.results-icon {
  font-size: 5rem;
  margin-bottom: 2rem;
}

.results-icon.passed {
  color: var(--success);
  animation: celebrate 2s ease-in-out infinite;
}

.results-icon.failed {
  color: var(--warning);
}

.results-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 2rem 0;
}

.results-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 2.5rem;
}

.result-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.result-circle.excellent {
  background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
}

.result-circle.good {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.result-circle.average {
  background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
}

.result-circle.poor {
  background: linear-gradient(135deg, var(--error) 0%, #dc2626 100%);
}

.result-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.result-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 500;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.test-question {
  max-width: 800px;
  margin: 0 auto;
}

.question-progress {
  margin-bottom: 2rem;
}

.progress-bar-test {
  width: 100%;
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill-test {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-dark));
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-content {
  text-align: center;
  margin-bottom: 2.5rem;
  background: var(--white);
  padding: 2.5rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
}

.question-header {
  margin-bottom: 1.5rem;
}

.question-number {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin: 0 auto 1rem;
}

.question-header h3 {
  font-size: 1.25rem;
  color: var(--gray-600);
  margin: 0;
  font-weight: 600;
}

.test-word {
  position: relative;
  margin-bottom: 1rem;
}

.word-text {
  font-size: 3rem;
  font-weight: 700;
  color: var(--gray-900);
}

.word-pronunciation-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.word-pronunciation-btn:hover {
  transform: scale(1.2);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.question-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.option-btn {
  background: var(--white);
  border: 2px solid var(--gray-200);
  color: var(--gray-700);
  padding: 1.25rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  min-height: 80px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.option-btn:hover {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.option-letter {
  background: var(--gray-100);
  color: var(--gray-700);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
  transition: var(--transition);
}

.option-btn:hover .option-letter {
  background: var(--primary);
  color: white;
}

.option-text {
  font-weight: 500;
  flex: 1;
}

/* Toast */
.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: var(--white);
  color: var(--gray-900);
  padding: 1rem 1.5rem;
  border-radius: 1rem;
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

.toast.info {
  border-color: var(--primary);
  background: #f5f3ff;
  color: #5b21b6;
}

.toast-icon {
  font-size: 1.125rem;
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

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes translateAppear {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .vocabulary-in-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1.25rem;
  }
  
  .language-info {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .language-flag {
    font-size: 2.5rem;
  }
  
  .language-title {
    font-size: 1.5rem;
  }
  
  .topics-grid {
    grid-template-columns: 1fr;
  }
  
  .word-card {
    padding: 2rem 1.5rem;
  }
  
  .word-main {
    font-size: 2.25rem;
  }
  
  .word-main-container {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .word-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 250px;
  }
  
  .complete-stats,
  .results-stats {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .question-options {
    grid-template-columns: 1fr;
  }
  
  .test-word .word-text {
    font-size: 2.25rem;
  }
  
  .toast {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .word-main {
    font-size: 1.875rem;
  }
  
  .test-word .word-text {
    font-size: 1.875rem;
  }
  
  .option-btn {
    padding: 1rem;
    min-height: 60px;
  }
  
  .option-text {
    font-size: 0.875rem;
  }
}
</style>