<template>
  <div class="tests-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon" aria-hidden="true">🧪</div>
        <h1 class="page-title">Тесты</h1>
        <p class="page-subtitle">Проверьте свои знания и отслеживайте прогресс</p>
        <div class="header-decoration" aria-hidden="true"></div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-animation" aria-hidden="true">
        <div class="loading-circle"></div>
        <div class="loading-circle"></div>
        <div class="loading-circle"></div>
      </div>
      <span class="loading-text">Загрузка тестов...</span>
    </div>

    <!-- Main Content -->
    <div v-else class="content-container">
      <!-- Test List View -->
      <div v-if="!activeTest" class="test-list-view">
        <!-- Filters Section -->
        <div v-if="tests.length > 0" class="filters-section">
          <div class="search-container">
            <div class="search-icon">🔍</div>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="search-input" 
              placeholder="Поиск тестов..."
            />
            <div class="search-glow"></div>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">📚 Предмет:</label>
            <select v-model="selectedSubject" class="filter-select">
              <option value="">Все предметы</option>
              <option v-for="subject in uniqueSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">📊 Уровень:</label>
            <select v-model="selectedLevel" class="filter-select">
              <option value="">Все уровни</option>
              <option v-for="level in uniqueLevels" :key="level" :value="level">
                Уровень {{ level }}
              </option>
            </select>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTests.length === 0 && tests.length === 0" class="empty-state">
          <div class="empty-animation">
            <div class="empty-icon">📝</div>
            <div class="empty-particles">
              <span v-for="i in 5" :key="i" class="particle"></span>
            </div>
          </div>
          <h3>Тестов пока нет</h3>
          <p>Тесты появятся здесь, когда они будут добавлены администратором</p>
        </div>

        <!-- No Results State -->
        <div v-else-if="filteredTests.length === 0 && tests.length > 0" class="empty-state">
          <div class="empty-animation">
            <div class="empty-icon">🔍</div>
            <div class="search-ripple"></div>
          </div>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить фильтры поиска</p>
          <button @click="clearFilters" class="clear-btn">
            <span class="btn-icon">✨</span>
            Очистить фильтры
          </button>
        </div>
        
        <!-- Tests Grid -->
        <div v-else class="tests-grid">
          <div 
            v-for="test in filteredTests" 
            :key="test._id" 
            class="test-card"
            @click="handleStartTest(test)"
          >
            <div class="card-glow"></div>
            <div class="card-header">
              <div class="test-badges">
                <div class="test-badge questions">
                  <span class="badge-icon">📝</span>
                  {{ test.questions?.length || 0 }} вопросов
                </div>
                <div v-if="test.duration" class="test-badge duration">
                  <span class="badge-icon">⏱️</span>
                  {{ test.duration }}м
                </div>
              </div>
              <div class="card-corner"></div>
            </div>
            
            <div class="card-content">
              <h3 class="test-title">{{ test.title }}</h3>
              <p v-if="test.description" class="test-description">{{ test.description }}</p>
              
              <div class="test-meta">
                <div class="meta-item subject">
                  <span class="meta-icon">📘</span>
                  <span>{{ test.subject || 'Общий' }}</span>
                </div>
                <div class="meta-item level" :class="getLevelClass(test.level || 1)">
                  <span class="meta-icon">{{ getLevelIcon(test.level || 1) }}</span>
                  <span>Уровень {{ test.level || 1 }}</span>
                </div>
              </div>
            </div>
            
            <div class="card-action">
              <button class="start-btn">
                <span class="btn-text">Начать тест</span>
                <span class="btn-arrow">→</span>
                <div class="btn-ripple"></div>
              </button>
            </div>

            <div class="card-hover-effect">
              <div class="hover-glow"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Test View -->
      <div v-else class="test-container">
        <!-- Test Header -->
        <div class="test-header">
          <div class="test-info">
            <h2 class="test-name">{{ activeTest.title }}</h2>
            <p v-if="activeTest.description" class="test-description">{{ activeTest.description }}</p>
            
            <div class="progress-section">
              <div class="progress-info">
                <span class="progress-text">Вопрос {{ currentQuestionIndex + 1 }} из {{ activeTest.questions.length }}</span>
                <span class="progress-percentage">{{ progressPercentage }}%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${progressPercentage}%` }"
                >
                  <div class="progress-sparkle"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Section -->
        <div v-if="!isTestCompleted" class="question-section">
          <div class="question-card">
            <div class="question-header">
              <div class="question-number">{{ currentQuestionIndex + 1 }}</div>
              <div class="question-indicator">
                <div 
                  v-for="(q, index) in activeTest.questions" 
                  :key="index" 
                  class="indicator-dot" 
                  :class="{ 
                    active: index === currentQuestionIndex, 
                    completed: index < currentQuestionIndex 
                  }"
                ></div>
              </div>
            </div>
            
            <h3 class="question-text">{{ currentQuestion.text || currentQuestion.question }}</h3>
            
            <!-- Multiple Choice -->
            <div v-if="currentQuestion.type === 'multiple-choice' || (currentQuestion.options && currentQuestion.options.length > 0)" class="options-container">
              <label 
                v-for="(opt, j) in currentQuestion.options" 
                :key="j" 
                class="option-item"
                :class="{ 'selected': userAnswers[currentQuestionIndex] === (opt.text || opt) }"
              >
                <input
                  type="radio"
                  :value="opt.text || opt"
                  v-model="userAnswers[currentQuestionIndex]"
                  class="option-input"
                />
                <div class="option-content">
                  <div class="option-radio">
                    <div class="radio-inner"></div>
                  </div>
                  <span class="option-text">{{ opt.text || opt }}</span>
                  <div class="option-glow"></div>
                </div>
              </label>
            </div>

            <!-- True/False -->
            <div v-else-if="currentQuestion.type === 'true-false'" class="options-container">
              <label 
                class="option-item"
                :class="{ 'selected': userAnswers[currentQuestionIndex] === 'true' }"
              >
                <input
                  type="radio"
                  value="true"
                  v-model="userAnswers[currentQuestionIndex]"
                  class="option-input"
                />
                <div class="option-content">
                  <div class="option-radio">
                    <div class="radio-inner"></div>
                  </div>
                  <span class="option-text">Правда</span>
                  <div class="option-glow"></div>
                </div>
              </label>
              <label 
                class="option-item"
                :class="{ 'selected': userAnswers[currentQuestionIndex] === 'false' }"
              >
                <input
                  type="radio"
                  value="false"
                  v-model="userAnswers[currentQuestionIndex]"
                  class="option-input"
                />
                <div class="option-content">
                  <div class="option-radio">
                    <div class="radio-inner"></div>
                  </div>
                  <span class="option-text">Ложь</span>
                  <div class="option-glow"></div>
                </div>
              </label>
            </div>

            <!-- Short Answer -->
            <div v-else class="text-answer-container">
              <textarea
                v-model="userAnswers[currentQuestionIndex]"
                class="text-answer-input"
                :placeholder="`Введите ваш ответ на вопрос ${currentQuestionIndex + 1}`"
                rows="4"
              ></textarea>
              <div class="input-glow"></div>
            </div>

            <div class="question-actions">
              <button 
                class="next-btn"
                @click="handleNextQuestion"
                :disabled="!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === ''"
                :class="{ 'disabled': !userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === '' }"
              >
                <span class="btn-icon">{{ isLastQuestion ? '✅' : '→' }}</span>
                <span v-if="isLastQuestion">
                  Завершить тест
                </span>
                <span v-else>
                  Следующий вопрос
                </span>
                <div class="btn-ripple"></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Results Section -->
        <div v-else class="results-section">
          <div class="results-card">
            <div class="results-animation">
              <div class="results-icon">🎉</div>
              <div class="celebration-burst">
                <span v-for="i in 12" :key="i" class="burst-particle"></span>
              </div>
            </div>
            
            <div class="results-content">
              <h3 class="results-title">Тест завершен!</h3>
              
              <div class="results-stats">
                <div class="stat-card answers">
                  <div class="stat-circle">
                    <div class="stat-value">{{ correctCount }}</div>
                    <div class="stat-total">из {{ activeTest.questions.length }}</div>
                  </div>
                  <div class="stat-label">правильных ответов</div>
                  <div class="stat-decoration"></div>
                </div>
                
                <div class="stat-card score" :class="getScoreClass(score)">
                  <div class="stat-circle score-circle" :class="getScoreClass(score)">
                    <div class="stat-value score-value">{{ score }}%</div>
                  </div>
                  <div class="stat-label">итоговый результат</div>
                  <div class="score-description" :class="getScoreClass(score)">{{ getScoreDescription(score) }}</div>
                  <div class="stat-decoration" :class="getScoreClass(score)"></div>
                </div>
              </div>

              <div class="results-actions">
                <button class="back-btn" @click="handleGoBack">
                  <span class="btn-icon">←</span>
                  <span>Вернуться к тестам</span>
                  <div class="btn-glow"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import { auth } from '@/firebase'

export default {
  name: 'TestsPage',
  
  setup() {
    // Reactive state
    const loading = ref(true)
    const tests = ref([])
    const activeTest = ref(null)
    const userAnswers = ref([])
    const currentQuestionIndex = ref(0)
    
    // Filter state
    const searchQuery = ref('')
    const selectedSubject = ref('')
    const selectedLevel = ref('')

    // Computed properties
    const uniqueSubjects = computed(() => 
      [...new Set(tests.value.map(test => test.subject).filter(Boolean))].sort()
    )

    const uniqueLevels = computed(() => 
      [...new Set(tests.value.map(test => test.level).filter(Boolean))].sort((a, b) => a - b)
    )

    const filteredTests = computed(() => {
      return tests.value.filter(test => {
        const matchesSubject = !selectedSubject.value || test.subject === selectedSubject.value
        const matchesLevel = !selectedLevel.value || test.level == selectedLevel.value
        const matchesSearch = !searchQuery.value || 
          test.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          test.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
        
        return matchesSubject && matchesLevel && matchesSearch
      })
    })

    const currentQuestion = computed(() => {
      if (!activeTest.value?.questions) return null
      return activeTest.value.questions[currentQuestionIndex.value]
    })

    const progressPercentage = computed(() => 
      Math.round(((currentQuestionIndex.value + 1) / (activeTest.value?.questions?.length || 1)) * 100)
    )

    const isLastQuestion = computed(() => 
      currentQuestionIndex.value === (activeTest.value?.questions?.length || 0) - 1
    )

    const isTestCompleted = computed(() => 
      activeTest.value && currentQuestionIndex.value >= activeTest.value.questions?.length
    )

    const correctCount = computed(() => {
      if (!activeTest.value?.questions) return 0
      
      return activeTest.value.questions.reduce((acc, question, index) => {
        const userAnswer = userAnswers.value[index]
        const isCorrect = checkAnswer(question, userAnswer)
        return acc + (isCorrect ? 1 : 0)
      }, 0)
    })

    const score = computed(() => {
      if (!activeTest.value?.questions?.length) return 0
      return Math.round((correctCount.value / activeTest.value.questions.length) * 100)
    })

    // Methods
    const loadTests = async () => {
      try {
        loading.value = true
        const user = auth.currentUser
        
        if (!user) {
          throw new Error('Пользователь не авторизован')
        }

        const token = await user.getIdToken()
        const userId = user.uid


        // Try user-specific tests endpoint first
        try {
          const { data: userTestsResponse } = await api.get(`/users/${userId}/tests`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (userTestsResponse?.tests && Array.isArray(userTestsResponse.tests)) {
            tests.value = userTestsResponse.tests
            return
          }
        } catch (userTestsError) {
          console.warn('⚠️ User tests endpoint failed:', userTestsError.message)
        }

        // Fallback to direct tests endpoint
        try {
          const { data: testsResponse } = await api.get('/tests', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          const testsData = testsResponse?.data || testsResponse || []
          tests.value = Array.isArray(testsData) ? testsData.filter(test => test.isActive !== false) : []
        } catch (directTestsError) {
          console.error('❌ Failed to load tests:', directTestsError)
          showToast('Ошибка загрузки тестов', 'error')
          tests.value = []
        }

      } catch (err) {
        console.error('❌ Ошибка загрузки тестов:', err)
        showToast('Ошибка загрузки тестов', 'error')
        tests.value = []
      } finally {
        loading.value = false
      }
    }

    const handleStartTest = async (test) => {
      try {
        loading.value = true
        const user = auth.currentUser
        
        if (!user) {
          console.error('❌ Пользователь не авторизован')
          return
        }

        const token = await user.getIdToken()
        const userId = user.uid


        // Try to get the full test with questions
        try {
          const { data: fullTestResponse } = await api.get(`/users/${userId}/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          activeTest.value = fullTestResponse?.test || fullTestResponse?.data || fullTestResponse
        } catch (userTestError) {
          console.warn('⚠️ User-specific test endpoint failed, trying direct:', userTestError.message)
          
          // Fallback to direct test endpoint
          const { data: directTestResponse } = await api.get(`/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          activeTest.value = directTestResponse?.data || directTestResponse
        }

        if (!activeTest.value || !activeTest.value.questions || activeTest.value.questions.length === 0) {
          throw new Error('Тест не содержит вопросов')
        }

        // Process questions to ensure they have proper structure
        activeTest.value.questions = activeTest.value.questions.map(q => ({
          ...q,
          text: q.text || q.question,
          type: q.type || 'multiple-choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer
        }))

        userAnswers.value = Array(activeTest.value.questions.length).fill('')
        currentQuestionIndex.value = 0

        
      } catch (err) {
        console.error('❌ Ошибка загрузки теста:', err)
        showToast('Ошибка загрузки теста: ' + err.message, 'error')
      } finally {
        loading.value = false
      }
    }

    const handleNextQuestion = () => {
      const currentAnswer = userAnswers.value[currentQuestionIndex.value]
      if (!currentAnswer || currentAnswer.trim() === '') {
        showToast('Пожалуйста, выберите ответ', 'warning')
        return
      }

      if (currentQuestionIndex.value + 1 < activeTest.value.questions.length) {
        currentQuestionIndex.value++
      } else {
        handleSubmitTest()
      }
    }

    const handleSubmitTest = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          console.error('❌ Пользователь не авторизован')
          return
        }

        const token = await user.getIdToken()
        const userId = user.uid


        const formattedAnswers = userAnswers.value.map((answer, index) => ({
          questionIndex: index,
          answer: answer
        }))

        try {
          await api.post(
            `/users/${userId}/tests/${activeTest.value._id}/submit`,
            { answers: formattedAnswers },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          
        } catch (submitError) {
          console.warn('⚠️ User-specific submit failed, trying direct route:', submitError.message)
          
          // Fallback submit
          await api.post(
            `/tests/${activeTest.value._id}/submit`,
            { 
              userId: userId,
              answers: formattedAnswers 
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        }

        // Move to results view
        currentQuestionIndex.value = activeTest.value.questions.length
        
      } catch (err) {
        console.error('❌ Ошибка отправки теста:', err)
        showToast('Ошибка отправки результатов теста', 'error')
      }
    }

    const handleGoBack = () => {
      activeTest.value = null
      userAnswers.value = []
      currentQuestionIndex.value = 0
    }

    const clearFilters = () => {
      selectedSubject.value = ''
      selectedLevel.value = ''
      searchQuery.value = ''
    }

    const checkAnswer = (question, userAnswer) => {
      if (!userAnswer) return false

      const correctAnswer = question.correctAnswer

      if (question.type === 'multiple-choice' && Array.isArray(question.options)) {
        if (typeof correctAnswer === 'number') {
          const correctOptionText = question.options[correctAnswer]?.text || question.options[correctAnswer]
          return userAnswer === correctOptionText
        }
        return userAnswer === correctAnswer
      }

      return userAnswer.toString().toLowerCase().trim() === 
             correctAnswer.toString().toLowerCase().trim()
    }

    const getLevelClass = (level) => {
      if (level <= 2) return 'beginner'
      if (level <= 4) return 'intermediate'
      return 'advanced'
    }

    const getLevelIcon = (level) => {
      if (level <= 2) return '🟢'
      if (level <= 4) return '🟡'
      return '🔴'
    }

    const getScoreClass = (score) => {
      if (score >= 90) return 'excellent'
      if (score >= 70) return 'good'
      if (score >= 50) return 'average'
      return 'poor'
    }

    const getScoreDescription = (score) => {
      if (score >= 90) return 'Отлично!'
      if (score >= 70) return 'Хорошо!'
      if (score >= 50) return 'Удовлетворительно'
      return 'Нужно подтянуть знания'
    }

    const showToast = (message, type = 'info') => {
      // Use your toast notification system
      if (window.$toast) {
        window.$toast[type](message)
      } else {
      }
    }

    // Lifecycle
    onMounted(() => {
      loadTests()
    })

    return {
      // State
      loading,
      tests,
      activeTest,
      userAnswers,
      currentQuestionIndex,
      searchQuery,
      selectedSubject,
      selectedLevel,
      
      // Computed
      uniqueSubjects,
      uniqueLevels,
      filteredTests,
      currentQuestion,
      progressPercentage,
      isLastQuestion,
      isTestCompleted,
      correctCount,
      score,
      
      // Methods
      handleStartTest,
      handleNextQuestion,
      handleSubmitTest,
      handleGoBack,
      clearFilters,
      getLevelClass,
      getLevelIcon,
      getScoreClass,
      getScoreDescription
    }
  }
}
</script>

<style scoped>
/* CSS Variables */
:root {
  --brand-purple: #8b5cf6;
  --brand-purple-dark: #7c3aed;
  --brand-purple-light: #a78bfa;
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
}

/* Base Styles */
.tests-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
}

.tests-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

.content-container {
  position: relative;
  z-index: 1;
}

/* Header Section */
.page-header {
  text-align: center;
  margin-bottom: 4rem;
  position: relative;
}

.header-content {
  background: #ffffff;
  border-radius: 1.5rem;
  padding: 3rem;
  box-shadow: 0 1.25rem 2.5rem rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.header-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
}

.header-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-0.5rem) rotate(2deg); }
  75% { transform: translateY(-0.25rem) rotate(-2deg); }
}

.page-title {
  font-size: 3rem;
  font-weight: 900;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--gray-600);
  margin: 0;
  font-weight: 400;
  line-height: 1.6;
}

.header-decoration {
  position: absolute;
  bottom: -1.25rem;
  left: 50%;
  transform: translateX(-50%);
  width: 6.25rem;
  height: 0.25rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  border-radius: 0.125rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 1.5rem;
  text-align: center;
  background: #ffffff;
  border-radius: 1.25rem;
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.1);
}

.loading-animation {
  position: relative;
  width: 5rem;
  height: 5rem;
  margin-bottom: 1.5rem;
}

.loading-circle {
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--brand-purple);
  border-radius: 50%;
  animation: bounce 1.5s infinite ease-in-out;
}

.loading-circle:nth-child(1) {
  left: 0;
  top: 1.875rem;
  animation-delay: -0.32s;
}

.loading-circle:nth-child(2) {
  left: 1.875rem;
  top: 1.875rem;
  animation-delay: -0.16s;
}

.loading-circle:nth-child(3) {
  left: 3.75rem;
  top: 1.875rem;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  color: var(--gray-600);
  font-size: 1rem;
  font-weight: 500;
}

/* Test List View */
.test-list-view {
  animation: fadeInUp 0.8s ease 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(1.875rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Filters Section */
.filters-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 1.25rem;
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.1);
  flex-wrap: wrap;
  justify-content: center;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 300px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  color: var(--gray-400);
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3.125rem;
  border: 2px solid var(--gray-200);
  border-radius: 1rem;
  font-size: 1rem;
  background: #ffffff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-purple);
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

.search-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  border-radius: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.search-input:focus ~ .search-glow {
  opacity: 0.1;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.filter-label {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: #ffffff;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--brand-purple);
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 5rem 1.5rem;
  background: #ffffff;
  border-radius: 1.25rem;
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.1);
}

.empty-animation {
  position: relative;
  margin-bottom: 2rem;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.25rem;
  animation: emptyFloat 3s ease-in-out infinite;
}

@keyframes emptyFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-0.75rem); }
}

.empty-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.particle {
  position: absolute;
  width: 0.375rem;
  height: 0.375rem;
  background: var(--brand-purple);
  border-radius: 50%;
  animation: particleFloat 2s ease-in-out infinite;
}

.particle:nth-child(1) { top: -2.5rem; left: -1.875rem; animation-delay: 0s; }
.particle:nth-child(2) { top: -3.125rem; left: 1.25rem; animation-delay: 0.4s; }
.particle:nth-child(3) { top: -1.875rem; left: 2.5rem; animation-delay: 0.8s; }
.particle:nth-child(4) { top: 1.875rem; left: -2.5rem; animation-delay: 1.2s; }
.particle:nth-child(5) { top: 2.5rem; left: 1.875rem; animation-delay: 1.6s; }

@keyframes particleFloat {
  0%, 100% { opacity: 0.3; transform: translateY(0) scale(1); }
  50% { opacity: 1; transform: translateY(-1.25rem) scale(1.2); }
}

.search-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6.25rem;
  height: 6.25rem;
  border: 2px solid var(--brand-purple);
  border-radius: 50%;
  animation: searchRipple 2s ease-out infinite;
}

@keyframes searchRipple {
  0% { width: 0; height: 0; opacity: 1; }
  100% { width: 7.5rem; height: 7.5rem; opacity: 0; }
}

.empty-state h3 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #000000;
  margin: 0 0 1rem 0;
}

.empty-state p {
  color: var(--gray-600);
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  color: #ffffff;
  border: none;
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.clear-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.clear-btn:hover::before {
  left: 100%;
}

.clear-btn:hover {
  transform: translateY(-0.25rem) scale(1.05);
  box-shadow: 0 0.5rem 2rem rgba(139, 92, 246, 0.4);
}

/* Tests Grid */
.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2rem;
}

.test-card {
  background: #ffffff;
  border-radius: 1.5rem;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.1);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 0.25rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.test-card:hover .card-glow {
  transform: scaleX(1);
}

.test-card:hover {
  transform: translateY(-0.75rem) scale(1.02);
  border-color: var(--brand-purple);
  box-shadow: 0 1.25rem 3.75rem rgba(139, 92, 246, 0.25);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  position: relative;
}

.test-badges {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.test-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.test-badge.questions {
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  color: #ffffff;
}

.test-badge.duration {
  background: var(--gray-100);
  color: var(--gray-700);
}

.badge-icon {
  font-size: 0.875rem;
}

.card-corner {
  width: 1.25rem;
  height: 1.25rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  border-radius: 0 0 0 1.25rem;
  position: absolute;
  top: -2rem;
  right: -2rem;
}

.card-content {
  margin-bottom: 1.5rem;
}

.test-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #000000;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.test-description {
  color: var(--gray-600);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1.25rem 0;
}

.test-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 500;
}

.meta-item.subject {
  background: var(--gray-50);
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
}

.meta-item.level {
  background: var(--gray-50);
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
}

.meta-item.level.beginner {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.meta-item.level.intermediate {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.meta-item.level.advanced {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.meta-icon {
  font-size: 1rem;
}

.card-action {
  position: relative;
}

.start-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  color: #ffffff;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-ripple {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.start-btn:hover .btn-ripple {
  left: 100%;
}

.start-btn:hover {
  transform: translateY(-0.125rem);
  box-shadow: 0 0.5rem 1.5rem rgba(139, 92, 246, 0.4);
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-arrow {
  font-size: 1.125rem;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.start-btn:hover .btn-arrow {
  transform: translateX(0.25rem);
}

.card-hover-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 1.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.hover-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: hoverPulse 2s ease-in-out infinite;
}

@keyframes hoverPulse {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
}

.test-card:hover .card-hover-effect {
  opacity: 1;
}

/* Test Container */
.test-container {
  background: #ffffff;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 1.25rem 3.75rem rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(139, 92, 246, 0.1);
  animation: fadeInUp 0.8s ease 0.2s both;
}

/* Test Header */
.test-header {
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
  padding: 2.5rem;
  border-bottom: 1px solid var(--gray-200);
  text-align: center;
  position: relative;
}

.test-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
}

.test-info {
  max-width: 600px;
  margin: 0 auto;
}

.test-name {
  font-size: 1.75rem;
  font-weight: 800;
  color: #000000;
  margin: 0 0 0.75rem 0;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.test-description {
  color: var(--gray-600);
  margin: 0 0 2rem 0;
  line-height: 1.6;
  font-size: 1rem;
}

.progress-section {
  margin-top: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-text {
  font-size: 1rem;
  color: var(--gray-700);
  font-weight: 600;
}

.progress-percentage {
  font-size: 1rem;
  color: var(--brand-purple);
  font-weight: 700;
}

.progress-bar {
  height: 0.5rem;
  background: var(--gray-200);
  border-radius: 0.25rem;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  border-radius: 0.25rem;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-sparkle {
  position: absolute;
  top: 0;
  right: 0;
  width: 1.875rem;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: progressSparkle 2s ease-in-out infinite;
}

@keyframes progressSparkle {
  0%, 100% { opacity: 0; transform: translateX(-0.9375rem); }
  50% { opacity: 1; transform: translateX(0.9375rem); }
}

/* Question Section */
.question-section {
  padding: 3rem;
}

.question-card {
  max-width: 800px;
  margin: 0 auto;
  background: var(--gray-50);
  border-radius: 1.25rem;
  padding: 2.5rem;
  border: 2px solid var(--gray-200);
  position: relative;
  animation: questionAppear 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes questionAppear {
  from {
    opacity: 0;
    transform: translateY(1.875rem) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.question-number {
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  color: #ffffff;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  animation: questionPulse 2s ease-in-out infinite;
}

@keyframes questionPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
  50% { box-shadow: 0 0 0 0.75rem rgba(139, 92, 246, 0); }
}

.question-indicator {
  display: flex;
  gap: 0.5rem;
}

.indicator-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: var(--gray-300);
  transition: all 0.3s ease;
}

.indicator-dot.active {
  background: var(--brand-purple);
  transform: scale(1.2);
  box-shadow: 0 0 0 0.25rem rgba(139, 92, 246, 0.3);
}

.indicator-dot.completed {
  background: var(--success);
}

.question-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
  margin: 0 0 2rem 0;
  line-height: 1.4;
  text-align: center;
}

/* Options Container */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.option-item {
  display: block;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-input {
  display: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid var(--gray-200);
  border-radius: 1rem;
  background: #ffffff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.option-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  opacity: 0;
  transition: all 0.3s ease;
}

.option-item:hover .option-content {
  border-color: var(--brand-purple-light);
  background: var(--gray-50);
  transform: translateX(0.5rem);
}

.option-item:hover .option-glow {
  left: 0;
  opacity: 0.05;
}

.option-item.selected .option-content {
  border-color: var(--brand-purple);
  background: rgba(139, 92, 246, 0.05);
  transform: translateX(0.5rem);
}

.option-item.selected .option-glow {
  left: 0;
  opacity: 0.1;
}

.option-radio {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--gray-300);
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.option-item.selected .option-radio {
  border-color: var(--brand-purple);
  background: var(--brand-purple);
}

.radio-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 0.5rem;
  height: 0.5rem;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.option-item.selected .radio-inner {
  transform: translate(-50%, -50%) scale(1);
}

.option-text {
  font-size: 1rem;
  color: #000000;
  font-weight: 500;
  line-height: 1.5;
  position: relative;
  z-index: 1;
}

/* Text Answer */
.text-answer-container {
  margin-bottom: 2.5rem;
  position: relative;
}

.text-answer-input {
  width: 100%;
  padding: 1.25rem;
  border: 2px solid var(--gray-200);
  border-radius: 1rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 7.5rem;
  transition: all 0.3s ease;
  background: #ffffff;
}

.text-answer-input:focus {
  outline: none;
  border-color: var(--brand-purple);
  box-shadow: 0 0 0 0.25rem rgba(139, 92, 246, 0.1);
}

.input-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  border-radius: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.text-answer-input:focus ~ .input-glow {
  opacity: 0.05;
}

/* Question Actions */
.question-actions {
  display: flex;
  justify-content: center;
}

.next-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  color: #ffffff;
  border: none;
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 12.5rem;
}

.next-btn:hover:not(.disabled) {
  transform: translateY(-0.125rem) scale(1.05);
  box-shadow: 0 0.5rem 1.5rem rgba(139, 92, 246, 0.4);
}

.next-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.125rem;
  position: relative;
  z-index: 1;
}

.next-btn span {
  position: relative;
  z-index: 1;
}

/* Results Section */
.results-section {
  padding: 4rem 3rem;
}

.results-card {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  background: var(--gray-50);
  border-radius: 1.5rem;
  padding: 3rem;
  border: 2px solid var(--gray-200);
  position: relative;
  overflow: hidden;
}

.results-animation {
  position: relative;
  margin-bottom: 2.5rem;
}

.results-icon {
  font-size: 5rem;
  animation: resultsFloat 3s ease-in-out infinite;
}

@keyframes resultsFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-0.5rem) rotate(3deg); }
  75% { transform: translateY(-0.25rem) rotate(-3deg); }
}

.celebration-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.burst-particle {
  position: absolute;
  width: 0.5rem;
  height: 0.5rem;
  background: var(--success);
  border-radius: 50%;
  animation: burstFloat 4s ease-in-out infinite;
}

.burst-particle:nth-child(1) { top: -3.75rem; left: -3.125rem; animation-delay: 0s; }
.burst-particle:nth-child(2) { top: -4.375rem; left: 2.5rem; animation-delay: 0.3s; }
.burst-particle:nth-child(3) { top: -3.125rem; left: 3.75rem; animation-delay: 0.6s; }
.burst-particle:nth-child(4) { top: 3.125rem; left: -3.75rem; animation-delay: 0.9s; }
.burst-particle:nth-child(5) { top: 3.75rem; left: 3.125rem; animation-delay: 1.2s; }
.burst-particle:nth-child(6) { top: 2.5rem; left: -2.5rem; animation-delay: 1.5s; }
.burst-particle:nth-child(7) { top: -2.5rem; left: 0px; animation-delay: 1.8s; }
.burst-particle:nth-child(8) { top: 0px; left: 4.375rem; animation-delay: 2.1s; }
.burst-particle:nth-child(9) { top: 4.375rem; left: 0px; animation-delay: 2.4s; }
.burst-particle:nth-child(10) { top: -1.875rem; left: -4.375rem; animation-delay: 2.7s; }
.burst-particle:nth-child(11) { top: 1.875rem; left: 5rem; animation-delay: 3s; }
.burst-particle:nth-child(12) { top: -5rem; left: 1.25rem; animation-delay: 3.3s; }

@keyframes burstFloat {
  0%, 100% { opacity: 0.3; transform: translateY(0) scale(1); }
  25% { opacity: 1; transform: translateY(-1.25rem) scale(1.3); }
  75% { opacity: 0.7; transform: translateY(-0.625rem) scale(0.8); }
}

.results-content h3 {
  font-size: 2rem;
  font-weight: 800;
  color: #000000;
  margin: 0 0 2.5rem 0;
}

.results-title {
  font-size: 2rem;
  font-weight: 800;
  color: #000000;
  margin: 0 0 2.5rem 0;
}

.results-stats {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  text-align: center;
  background: #ffffff;
  padding: 2rem 1.5rem;
  border-radius: 1.25rem;
  border: 2px solid var(--gray-200);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-0.25rem);
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1);
}

.stat-card.score.excellent {
  border-color: var(--success);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%);
}

.stat-card.score.good {
  border-color: var(--brand-purple);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
}

.stat-card.score.average {
  border-color: var(--warning);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%);
}

.stat-card.score.poor {
  border-color: var(--error);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
}

.stat-circle {
  width: 6.25rem;
  height: 6.25rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  position: relative;
  overflow: hidden;
}

.score-circle.excellent {
  background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
}

.score-circle.good {
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
}

.score-circle.average {
  background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
}

.score-circle.poor {
  background: linear-gradient(135deg, var(--error) 0%, #dc2626 100%);
}

.stat-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: statShimmer 3s ease-in-out infinite;
}

@keyframes statShimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  position: relative;
  z-index: 1;
}

.score-value {
  font-size: 1.5rem;
}

.stat-total {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.score-description {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.score-description.excellent { color: var(--success); }
.score-description.good { color: var(--brand-purple); }
.score-description.average { color: var(--warning); }
.score-description.poor { color: var(--error); }

.stat-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  background: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
}

.stat-card.score.excellent .stat-decoration {
  background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
}

.stat-card.score.average .stat-decoration {
  background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
}

.stat-card.score.poor .stat-decoration {
  background: linear-gradient(135deg, var(--error) 0%, #dc2626 100%);
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ffffff;
  color: var(--gray-700);
  border: 2px solid var(--gray-300);
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2), transparent);
  transition: left 0.5s ease;
}

.back-btn:hover .btn-glow {
  left: 100%;
}

.back-btn:hover {
  background: var(--gray-50);
  border-color: var(--brand-purple);
  transform: translateY(-0.125rem);
}

.back-btn span {
  position: relative;
  z-index: 1;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .tests-page {
    padding: 1.5rem 1rem;
  }

  .tests-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .results-stats {
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .tests-page {
    padding: 1rem;
  }

  .header-content {
    padding: 2rem 1.5rem;
  }

  .page-title {
    font-size: 2.25rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .header-icon {
    font-size: 3rem;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filter-group {
    min-width: auto;
  }

  .search-container {
    min-width: auto;
    max-width: none;
  }

  .tests-grid {
    grid-template-columns: 1fr;
  }

  .test-header {
    padding: 2rem 1.5rem;
  }

  .question-section {
    padding: 2rem 1.5rem;
  }

  .question-card {
    padding: 2rem 1.5rem;
  }

  .results-section {
    padding: 3rem 1.5rem;
  }

  .results-card {
    padding: 2rem 1.5rem;
  }

  .results-stats {
    flex-direction: column;
    gap: 1.25rem;
    align-items: center;
  }

  .stat-card {
    max-width: 200px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .header-icon {
    font-size: 2.5rem;
  }

  .question-text {
    font-size: 1.25rem;
  }

  .option-content {
    padding: 1rem;
  }

  .option-text {
    font-size: 0.875rem;
  }

  .text-answer-input {
    padding: 1rem;
    font-size: 0.875rem;
  }

  .next-btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
    min-width: 10rem;
  }

  .results-card {
    padding: 1.5rem 1rem;
  }

  .stat-circle {
    width: 5rem;
    height: 5rem;
  }

  .stat-value {
    font-size: 1.125rem;
  }

  .score-value {
    font-size: 1.25rem;
  }

  .question-header {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .question-indicator {
    order: -1;
  }
}

/* Accessibility */
.test-card:focus,
.option-item:focus-within,
.next-btn:focus,
.back-btn:focus,
.clear-btn:focus {
  outline: 3px solid var(--brand-purple);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .test-card,
  .question-card,
  .option-content {
    border-width: 3px;
  }
  
  .tests-page {
    background: #ffffff;
    color: #000000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Print styles */
@media print {
  .tests-page {
    background: #ffffff;
    color: #000000;
  }
  
  .header-icon,
  .loading-animation,
  .empty-animation,
  .celebration-burst {
    display: none;
  }
}
</style>