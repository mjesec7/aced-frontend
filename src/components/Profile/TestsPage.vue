<template>
  <div class="tests-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">🧪</div>
        <h1 class="page-title">Тесты</h1>
        <p class="page-subtitle">Проверьте свои знания и отслеживайте прогресс</p>
      </div>
      <div class="header-decoration"></div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <p class="loading-text">Загрузка тестов...</p>
    </div>

    <div v-else class="content-container">
      <!-- Test List Page -->
      <div v-if="!activeTest" class="tests-section">
        <!-- Filters Section -->
        <div v-if="tests.length > 0" class="filters-section">
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

          <div class="filter-group">
            <label class="filter-label">🔍 Поиск:</label>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="filter-input" 
              placeholder="Название теста..."
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTests.length === 0 && tests.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3 class="empty-title">Тестов пока нет</h3>
          <p class="empty-description">
            Тесты появятся здесь, когда они будут добавлены администратором
          </p>
          <div class="empty-decoration">
            <div class="decoration-dot"></div>
            <div class="decoration-dot"></div>
            <div class="decoration-dot"></div>
          </div>
        </div>

        <!-- No Results State -->
        <div v-else-if="filteredTests.length === 0 && tests.length > 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3 class="empty-title">Ничего не найдено</h3>
          <p class="empty-description">
            Попробуйте изменить фильтры поиска
          </p>
          <button @click="clearFilters" class="clear-filters-btn">Очистить фильтры</button>
        </div>
        
        <!-- Tests Grid -->
        <div v-else class="tests-grid">
          <div 
            v-for="test in filteredTests" 
            :key="test._id" 
            class="test-card"
            @click="startTest(test)"
          >
            <div class="card-glow"></div>
            <div class="card-content">
              <div class="test-badge">
                <span class="badge-text">{{ test.questions?.length || 0 }} вопросов</span>
              </div>
              
              <div class="test-main">
                <h3 class="test-title">{{ test.title }}</h3>
                <div v-if="test.description" class="test-description">
                  {{ test.description }}
                </div>
                <div class="test-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📘</span>
                    <span class="meta-text">{{ test.subject || 'Общий' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">📚</span>
                    <span class="meta-text">Уровень {{ test.level || 1 }}</span>
                  </div>
                  <div v-if="test.duration" class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <span class="meta-text">{{ test.duration }} мин</span>
                  </div>
                </div>
              </div>
              
              <div class="test-actions">
                <button class="start-btn">
                  <span class="btn-text">Начать тест</span>
                  <span class="btn-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Single Test Page -->
      <div v-else class="test-container">
        <!-- Test Header -->
        <div class="test-header">
          <div class="test-info">
            <h2 class="test-name">{{ activeTest.title }}</h2>
            <div v-if="activeTest.description" class="test-description-header">
              {{ activeTest.description }}
            </div>
            <div class="progress-section">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${((currentQuestionIndex + 1) / activeTest.questions.length) * 100}%` }"
                ></div>
              </div>
              <p class="progress-text">
                Вопрос {{ currentQuestionIndex + 1 }} из {{ activeTest.questions.length }}
              </p>
            </div>
          </div>
        </div>

        <!-- Question Section -->
        <div v-if="currentQuestionIndex < activeTest.questions.length" class="question-section">
          <div class="question-card">
            <div class="question-number">{{ currentQuestionIndex + 1 }}</div>
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
                  <div class="option-radio"></div>
                  <span class="option-text">{{ opt.text || opt }}</span>
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
                  <div class="option-radio"></div>
                  <span class="option-text">Правда</span>
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
                  <div class="option-radio"></div>
                  <span class="option-text">Ложь</span>
                </div>
              </label>
            </div>

            <!-- Short Answer -->
            <div v-else class="text-answer-container">
              <textarea
                v-model="userAnswers[currentQuestionIndex]"
                class="text-answer-input"
                :placeholder="'Введите ваш ответ на вопрос ' + (currentQuestionIndex + 1)"
                rows="4"
              ></textarea>
            </div>

            <div class="question-actions">
              <button 
                class="next-btn"
                @click="nextQuestion"
                :disabled="!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === ''"
                :class="{ 'disabled': !userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === '' }"
              >
                <span v-if="currentQuestionIndex === activeTest.questions.length - 1">
                  ✅ Завершить тест
                </span>
                <span v-else>
                  Следующий вопрос →
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Results Section -->
        <div v-else class="results-section">
          <div class="results-card">
            <div class="results-header">
              <div class="results-icon">🎉</div>
              <h3 class="results-title">Тест завершен!</h3>
            </div>
            
            <div class="results-stats">
              <div class="stat-card">
                <div class="stat-value">{{ correctCount }}</div>
                <div class="stat-total">из {{ activeTest.questions.length }}</div>
                <div class="stat-label">правильных ответов</div>
              </div>
              
              <div class="stat-card score-card">
                <div class="stat-value score-value" :class="getScoreClass(score)">
                  {{ score }}%
                </div>
                <div class="stat-label">итоговый результат</div>
                <div class="score-description" :class="getScoreClass(score)">
                  {{ getScoreDescription(score) }}
                </div>
              </div>
            </div>

            <div class="results-actions">
              <button class="back-btn" @click="goBack">
                ← Вернуться к тестам
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'TestsPage',
  data() {
    return {
      loading: true,
      tests: [],
      activeTest: null,
      userAnswers: [],
      currentQuestionIndex: 0,
      
      // Filters
      selectedSubject: '',
      selectedLevel: '',
      searchQuery: ''
    };
  },
  computed: {
    currentQuestion() {
      if (!this.activeTest || !this.activeTest.questions) return null;
      return this.activeTest.questions[this.currentQuestionIndex];
    },
    correctCount() {
      if (!this.activeTest || !this.activeTest.questions) return 0;
      return this.activeTest.questions.reduce((acc, q, idx) => {
        const correctAnswer = q.correctAnswer;
        const userAnswer = this.userAnswers[idx];
        
        // Handle different answer formats
        let isCorrect = false;
        if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
          // For multiple choice, correctAnswer might be an index or the actual text
          if (typeof correctAnswer === 'number') {
            const correctOptionText = q.options[correctAnswer]?.text || q.options[correctAnswer];
            isCorrect = userAnswer === correctOptionText;
          } else {
            isCorrect = userAnswer === correctAnswer;
          }
        } else {
          // For other types, do direct comparison
          isCorrect = userAnswer?.toString().toLowerCase().trim() === correctAnswer?.toString().toLowerCase().trim();
        }
        
        return acc + (isCorrect ? 1 : 0);
      }, 0);
    },
    score() {
      if (!this.activeTest || !this.activeTest.questions) return 0;
      return Math.round((this.correctCount / this.activeTest.questions.length) * 100);
    },
    uniqueSubjects() {
      return [...new Set(this.tests.map(test => test.subject).filter(Boolean))].sort();
    },
    uniqueLevels() {
      return [...new Set(this.tests.map(test => test.level).filter(Boolean))].sort((a, b) => a - b);
    },
    filteredTests() {
      return this.tests.filter(test => {
        const matchesSubject = !this.selectedSubject || test.subject === this.selectedSubject;
        const matchesLevel = !this.selectedLevel || test.level == this.selectedLevel;
        const matchesSearch = !this.searchQuery || 
          test.title?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          test.description?.toLowerCase().includes(this.searchQuery.toLowerCase());
        
        return matchesSubject && matchesLevel && matchesSearch;
      });
    }
  },
  async mounted() {
    await this.loadTests();
  },
  methods: {
    async loadTests() {
      try {
        this.loading = true;
        const user = auth.currentUser;
        if (!user) {
          console.error('❌ Пользователь не авторизован');
          this.$toast?.error('Необходимо войти в систему');
          return;
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        console.log('🔍 Loading tests for user:', userId);

        // Method 1: Try user-specific tests endpoint
        try {
          const { data: userTestsResponse } = await api.get(`/users/${userId}/tests`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (userTestsResponse?.tests && Array.isArray(userTestsResponse.tests)) {
            this.tests = userTestsResponse.tests;
            console.log('✅ Loaded tests from user endpoint:', this.tests.length);
            return;
          }
        } catch (userTestsError) {
          console.warn('⚠️ User tests endpoint failed:', userTestsError.message);
        }

        // Method 2: Try direct tests endpoint
        try {
          const { data: testsResponse } = await api.get('/tests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const testsData = testsResponse?.data || testsResponse || [];
          // Filter only active tests for users
          this.tests = Array.isArray(testsData) ? testsData.filter(test => test.isActive !== false) : [];
          console.log('✅ Loaded tests from direct endpoint:', this.tests.length);
        } catch (directTestsError) {
          console.error('❌ Failed to load tests:', directTestsError);
          this.$toast?.error('Ошибка загрузки тестов');
          this.tests = [];
        }

      } catch (err) {
        console.error('❌ Ошибка загрузки тестов:', err);
        this.$toast?.error('Ошибка загрузки тестов');
        this.tests = [];
      } finally {
        this.loading = false;
      }
    },

    async startTest(test) {
      try {
        this.loading = true;
        const user = auth.currentUser;
        if (!user) {
          console.error('❌ Пользователь не авторизован');
          return;
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        console.log('🚀 Starting test:', test.title, 'ID:', test._id);

        // Try to get the full test with questions
        try {
          const { data: fullTestResponse } = await api.get(`/users/${userId}/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          this.activeTest = fullTestResponse?.test || fullTestResponse?.data || fullTestResponse;
        } catch (userTestError) {
          console.warn('⚠️ User-specific test endpoint failed, trying direct:', userTestError.message);
          
          // Fallback to direct test endpoint
          const { data: directTestResponse } = await api.get(`/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          this.activeTest = directTestResponse?.data || directTestResponse;
        }

        if (!this.activeTest || !this.activeTest.questions || this.activeTest.questions.length === 0) {
          throw new Error('Тест не содержит вопросов');
        }

        // Process questions to ensure they have proper structure
        this.activeTest.questions = this.activeTest.questions.map(q => ({
          ...q,
          text: q.text || q.question,
          type: q.type || 'multiple-choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer
        }));

        this.userAnswers = Array(this.activeTest.questions.length).fill('');
        this.currentQuestionIndex = 0;
        
        console.log('✅ Test loaded successfully:', this.activeTest.title);
        console.log('📊 Questions:', this.activeTest.questions.length);
        
      } catch (err) {
        console.error('❌ Ошибка загрузки теста:', err);
        this.$toast?.error('Ошибка загрузки теста: ' + err.message);
      } finally {
        this.loading = false;
      }
    },

    nextQuestion() {
      const currentAnswer = this.userAnswers[this.currentQuestionIndex];
      if (!currentAnswer || currentAnswer.trim() === '') {
        this.$toast?.warning('Пожалуйста, выберите ответ');
        return;
      }

      if (this.currentQuestionIndex + 1 < this.activeTest.questions.length) {
        this.currentQuestionIndex++;
      } else {
        this.submitTest();
      }
    },

    async submitTest() {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('❌ Пользователь не авторизован');
          return;
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        console.log('📤 Submitting test results...');

        // Format answers for submission
        const formattedAnswers = this.userAnswers.map((answer, index) => ({
          questionIndex: index,
          answer: answer
        }));

        try {
          await api.post(
            `/users/${userId}/tests/${this.activeTest._id}/submit`,
            { answers: formattedAnswers },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log('✅ Test results submitted successfully');
        } catch (submitError) {
          console.warn('⚠️ User-specific submit failed, trying direct route:', submitError.message);
          
          // Fallback submit
          await api.post(
            `/tests/${this.activeTest._id}/submit`,
            { 
              userId: userId,
              answers: formattedAnswers 
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        // Move to results view
        this.currentQuestionIndex = this.activeTest.questions.length;
        
      } catch (err) {
        console.error('❌ Ошибка отправки теста:', err);
        this.$toast?.error('Ошибка отправки результатов теста');
      }
    },

    goBack() {
      this.activeTest = null;
      this.userAnswers = [];
      this.currentQuestionIndex = 0;
    },

    clearFilters() {
      this.selectedSubject = '';
      this.selectedLevel = '';
      this.searchQuery = '';
    },

    getScoreClass(score) {
      if (score >= 90) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'average';
      return 'poor';
    },

    getScoreDescription(score) {
      if (score >= 90) return 'Отлично!';
      if (score >= 70) return 'Хорошо!';
      if (score >= 50) return 'Удовлетворительно';
      return 'Нужно подтянуть знания';
    }
  }
};
</script>

<style scoped>
/* CSS Custom Properties for better maintainability */
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --glass-bg: rgba(255, 255, 255, 0.95);
  --glass-border: rgba(255, 255, 255, 0.2);
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border-color: #e5e7eb;
  --hover-color: #f8faff;
  --shadow-sm: 0 10px 40px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 25px 60px rgba(0, 0, 0, 0.15);
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --transition-fast: 0.2s ease;
  --transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Base layout */
.tests-page {
  min-height: 100vh;
  background: var(--primary-gradient);
  position: relative;
  overflow: hidden;
}

.tests-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* Header Section */
.page-header {
  position: relative;
  text-align: center;
  padding: 4rem var(--spacing-lg) var(--spacing-lg);
  color: white;
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-sm);
  display: inline-block;
  animation: float 3s ease-in-out infinite;
}

.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  margin: 0 0 var(--spacing-sm) 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 20px rgba(255, 255, 255, 0.3);
}

.page-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.header-decoration {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: linear-gradient(90deg, transparent, white, transparent);
  border-radius: 2px;
}

/* Content Container */
.content-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg) 4rem;
}

/* Loading States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem var(--spacing-lg);
  color: white;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-lg);
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top: 4px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  top: 10px;
  left: 10px;
  animation-delay: -0.5s;
  border-top-color: rgba(255, 255, 255, 0.6);
}

.spinner-ring:nth-child(3) {
  width: 40px;
  height: 40px;
  top: 20px;
  left: 20px;
  animation-delay: -1s;
  border-top-color: rgba(255, 255, 255, 0.4);
}

.loading-text {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

/* Filters Section */
.filters-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.filter-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.filter-select,
.filter-input {
  padding: 0.75rem var(--spacing-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: var(--transition-fast);
  background: white;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 6rem var(--spacing-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--glass-border);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.7;
}

.empty-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
  line-height: 1.6;
}

.clear-filters-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition-fast);
}

.clear-filters-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.empty-decoration {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-lg);
}

.decoration-dot {
  width: 8px;
  height: 8px;
  background: var(--primary-gradient);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.decoration-dot:nth-child(2) { animation-delay: 0.2s; }
.decoration-dot:nth-child(3) { animation-delay: 0.4s; }

/* Test Cards Grid */
.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(380px, 100%), 1fr));
  gap: var(--spacing-lg);
}

.test-card {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-bounce);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);
  container-type: inline-size;
}

.test-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-lg);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

.card-content {
  padding: var(--spacing-lg);
}

.test-badge {
  display: inline-block;
  margin-bottom: var(--spacing-md);
}

.badge-text {
  background: var(--primary-gradient);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.test-main {
  margin-bottom: var(--spacing-lg);
}

.test-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.3;
}

.test-description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: var(--spacing-sm);
}

.test-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.meta-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Buttons */
.start-btn {
  width: 100%;
  background: var(--primary-gradient);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.start-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.start-btn:hover::before {
  left: 100%;
}

.btn-arrow {
  transition: transform 0.3s ease;
}

.start-btn:hover .btn-arrow {
  transform: translateX(4px);
}

/* Test Container */
.test-container {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--glass-border);
}

.test-header {
  background: var(--primary-gradient);
  color: white;
  padding: 2.5rem var(--spacing-lg);
  text-align: center;
}

.test-name {
  font-size: clamp(1.5rem, 4vw, 1.8rem);
  font-weight: 700;
  margin: 0 0 var(--spacing-sm) 0;
}

.test-description-header {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: var(--spacing-lg);
  line-height: 1.5;
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffffff, #f8fafc);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.progress-text {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

/* Question Section */
.question-section {
  padding: var(--spacing-xl) var(--spacing-lg);
}

.question-card {
  max-width: 800px;
  margin: 0 auto;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: var(--spacing-lg);
}

.question-text {
  font-size: clamp(1.1rem, 3vw, 1.3rem);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2.5rem;
  line-height: 1.5;
}

/* Options */
.options-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
}

.option-item {
  display: block;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.option-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 1.2rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #fafafa;
  transition: var(--transition-smooth);
  position: relative;
}

.option-item:hover .option-content {
  border-color: #667eea;
  background: var(--hover-color);
  transform: translateX(4px);
}

.option-item.selected .option-content {
  border-color: #667eea;
  background: linear-gradient(135deg, #ede9fe, #f0f5ff);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.option-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: var(--transition-smooth);
  flex-shrink: 0;
}

.option-item.selected .option-radio {
  border-color: #667eea;
  background: #667eea;
}

.option-item.selected .option-radio::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.option-text {
  font-size: 1rem;
  color: var(--text-primary);
  line-height: 1.4;
  flex: 1;
}

/* Text Answer */
.text-answer-container {
  margin-bottom: var(--spacing-xl);
}

.text-answer-input {
  width: 100%;
  padding: 1.2rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: var(--transition-fast);
  background: #fafafa;
}

.text-answer-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

/* Question Actions */
.question-actions {
  text-align: center;
}

.next-btn {
  background: var(--primary-gradient);
  color: white;
  border: none;
  padding: 1.2rem var(--spacing-xl);
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
  min-width: 200px;
  position: relative;
  overflow: hidden;
}

.next-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.next-btn:hover:not(.disabled)::before {
  left: 100%;
}

.next-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.next-btn.disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
}

/* Results Section */
.results-section {
  padding: 4rem var(--spacing-lg);
}

.results-card {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.results-header {
  margin-bottom: var(--spacing-xl);
}

.results-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-sm);
  animation: bounce 2s ease-in-out infinite;
}

.results-title {
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.results-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: #f9fafb;
  border-radius: 20px;
  padding: var(--spacing-lg);
  border: 2px solid var(--border-color);
  transition: var(--transition-smooth);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-sm);
}

.score-card {
  background: linear-gradient(135deg, #f0f9ff, #ede9fe);
  border-color: #c7d2fe;
}

.stat-value {
  font-size: clamp(2.5rem, 6vw, 3rem);
  font-weight: 900;
  color: #667eea;
  margin-bottom: var(--spacing-xs);
}

.stat-total {
  font-size: 1.2rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  margin-top: var(--spacing-xs);
}

/* Score Colors */
.score-value.excellent,
.score-description.excellent { color: #10b981; }

.score-value.good,
.score-description.good { color: #3b82f6; }

.score-value.average,
.score-description.average { color: #f59e0b; }

.score-value.poor,
.score-description.poor { color: #ef4444; }

.score-description {
  font-size: 1rem;
  font-weight: 600;
  margin-top: var(--spacing-xs);
}

.back-btn {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
  border: none;
  padding: 1.2rem 2.5rem;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
}

.back-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.back-btn:hover::before {
  left: 100%;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(107, 114, 128, 0.4);
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.test-card {
  animation: fadeInUp 0.6s ease-out;
}

.test-card:nth-child(even) {
  animation-delay: 0.1s;
}

.question-card,
.results-card {
  animation: fadeInUp 0.5s ease-out;
}

/* Focus states for accessibility */
.start-btn:focus,
.next-btn:focus,
.back-btn:focus,
.clear-filters-btn:focus {
  outline: 3px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
}

.option-item:focus-within .option-content {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

/* Container Queries for better responsive behavior */
@container (max-width: 400px) {
  .card-content {
    padding: var(--spacing-md);
  }
  
  .test-title {
    font-size: 1.2rem;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-container {
    padding: 0 var(--spacing-sm) var(--spacing-xl);
  }
  
  .filters-section {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }
  
  .tests-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .question-section {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .next-btn {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: 1rem;
    min-width: 160px;
  }
  
  .results-section {
    padding: var(--spacing-xl) var(--spacing-md);
  }
  
  .results-stats {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .stat-card {
    padding: var(--spacing-md);
  }
  
  .test-header {
    padding: var(--spacing-lg) var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .empty-state {
    padding: 4rem var(--spacing-md);
  }
  
  .question-number {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
  
  .option-content {
    padding: 0.8rem;
  }
  
  .option-text {
    font-size: 0.9rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .test-card {
    border: 2px solid #000;
  }
  
  .option-content {
    border-width: 3px;
  }
  
  .option-item.selected .option-content {
    border-color: #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .test-card {
    animation: none;
  }
}

/* Print styles */
@media print {
  .tests-page {
    background: white !important;
  }
  
  .tests-page::before,
  .card-glow {
    display: none;
  }
  
  .page-header,
  .test-header {
    background: none !important;
    color: black !important;
  }
  
  .start-btn,
  .next-btn,
  .back-btn,
  .clear-filters-btn {
    display: none;
  }
  
  .test-card:hover {
    transform: none;
    box-shadow: none;
  }
}

/* Dark mode support (if needed) */
@media (prefers-color-scheme: dark) {
  :root {
    --glass-bg: rgba(17, 24, 39, 0.95);
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-muted: #9ca3af;
    --border-color: #374151;
    --hover-color: #1f2937;
  }
}
</style>