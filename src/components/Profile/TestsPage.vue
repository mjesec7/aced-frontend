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
        <!-- Empty State -->
        <div v-if="tests.length === 0" class="empty-state">
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
        
        <!-- Tests Grid -->
        <div v-else class="tests-grid">
          <div 
            v-for="test in tests" 
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
                <div class="test-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📘</span>
                    <span class="meta-text">{{ test.topic }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">📚</span>
                    <span class="meta-text">{{ test.subject }}</span>
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
            <h3 class="question-text">{{ currentQuestion.question }}</h3>
            
            <div class="options-container">
              <label 
                v-for="(opt, j) in currentQuestion.options" 
                :key="j" 
                class="option-item"
                :class="{ 'selected': userAnswers[currentQuestionIndex] === opt }"
              >
                <input
                  type="radio"
                  :value="opt"
                  v-model="userAnswers[currentQuestionIndex]"
                  class="option-input"
                />
                <div class="option-content">
                  <div class="option-radio"></div>
                  <span class="option-text">{{ opt }}</span>
                </div>
              </label>
            </div>

            <div class="question-actions">
              <button 
                class="next-btn"
                @click="nextQuestion"
                :disabled="!userAnswers[currentQuestionIndex]"
                :class="{ 'disabled': !userAnswers[currentQuestionIndex] }"
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
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'TestsPage',
  data() {
    return {
      loading: true,
      tests: [],
      activeTest: null,
      userAnswers: [],
      currentQuestionIndex: 0
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
        return acc + (q.correctAnswer === this.userAnswers[idx] ? 1 : 0);
      }, 0);
    },
    score() {
      if (!this.activeTest || !this.activeTest.questions) return 0;
      return Math.round((this.correctCount / this.activeTest.questions.length) * 100);
    }
  },
  async mounted() {
    await this.loadTests();
  },
  methods: {
    async loadTests() {
      try {
        this.loading = true;
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          console.error('❌ Пользователь не авторизован');
          return;
        }

        const { data } = await axios.get(`${BASE_URL}/tests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.tests = data.tests || [];
      } catch (err) {
        console.error('❌ Ошибка загрузки тестов:', err);
        this.$toast?.error('Ошибка загрузки тестов');
      } finally {
        this.loading = false;
      }
    },

    async startTest(test) {
      try {
        this.loading = true;
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          console.error('❌ Пользователь не авторизован');
          return;
        }

        const { data } = await axios.get(`${BASE_URL}/tests/${test._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.activeTest = data.test;
        this.userAnswers = Array(this.activeTest.questions.length).fill('');
        this.currentQuestionIndex = 0;
      } catch (err) {
        console.error('❌ Ошибка загрузки теста:', err);
        this.$toast?.error('Ошибка загрузки теста');
      } finally {
        this.loading = false;
      }
    },

    nextQuestion() {
      if (!this.userAnswers[this.currentQuestionIndex]) {
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
        const token = await auth.currentUser?.getIdToken();
        const userId = auth.currentUser?.uid;

        if (!token || !userId) {
          console.error('❌ Пользователь не авторизован');
          return;
        }

        await axios.post(
          `${BASE_URL}/users/${userId}/tests/${this.activeTest._id}/submit`,
          { answers: this.userAnswers },
          { headers: { Authorization: `Bearer ${token}` } }
        );

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
.tests-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.tests-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.page-header {
  position: relative;
  text-align: center;
  padding: 4rem 2rem 2rem;
  color: white;
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: inline-block;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.page-title {
  font-size: 3rem;
  font-weight: 900;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 20px rgba(255, 255, 255, 0.3);
}

.page-subtitle {
  font-size: 1.2rem;
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

.content-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  color: white;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 2rem;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 6rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 2rem;
  opacity: 0.7;
}

.empty-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.empty-description {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.empty-decoration {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.decoration-dot {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.decoration-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.decoration-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2rem;
}

.test-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.test-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
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

@keyframes shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

.card-content {
  padding: 2rem;
}

.test-badge {
  display: inline-block;
  margin-bottom: 1.5rem;
}

.badge-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.test-main {
  margin-bottom: 2rem;
}

.test-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  line-height: 1.3;
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
  font-size: 0.95rem;
  color: #6b7280;
}

.meta-icon {
  font-size: 1rem;
}

.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
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

.test-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.test-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2.5rem 2rem;
  text-align: center;
}

.test-name {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 2rem 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
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

.question-section {
  padding: 3rem 2rem;
}

.question-card {
  max-width: 800px;
  margin: 0 auto;
}

.question-number {
  display: inline-block;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.question-text {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2.5rem;
  line-height: 1.5;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
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
  padding: 1.2rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  background: #fafafa;
  transition: all 0.3s ease;
  position: relative;
}

.option-item:hover .option-content {
  border-color: #667eea;
  background: #f8faff;
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
  transition: all 0.3s ease;
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
  color: #374151;
  line-height: 1.4;
  flex: 1;
}

.question-actions {
  text-align: center;
}

.next-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1.2rem 3rem;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
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

.results-section {
  padding: 4rem 2rem;
}

.results-card {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.results-header {
  margin-bottom: 3rem;
}

.results-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.results-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.results-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: #f9fafb;
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.score-card {
  background: linear-gradient(135deg, #f0f9ff, #ede9fe);
  border-color: #c7d2fe;
}

.stat-value {
  font-size: 3rem;
  font-weight: 900;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-total {
  font-size: 1.2rem;
  color: #6b7280;
  font-weight: 600;
}

.stat-label {
  font-size: 0.9rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  margin-top: 0.5rem;
}

.score-value.excellent {
  color: #10b981;
}

.score-value.good {
  color: #3b82f6;
}

.score-value.average {
  color: #f59e0b;
}

.score-value.poor {
  color: #ef4444;
}

.score-description {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.score-description.excellent {
  color: #10b981;
}

.score-description.good {
  color: #3b82f6;
}

.score-description.average {
  color: #f59e0b;
}

.score-description.poor {
  color: #ef4444;
}

.back-btn {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
  border: none;
  padding: 1.2rem 2.5rem;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
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

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    padding: 3rem 1rem 1.5rem;
  }
  
  .page-title {
    font-size: 2.2rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .content-container {
    padding: 0 1rem 3rem;
  }
  
  .tests-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .test-card {
    margin: 0 0.5rem;
  }
  
  .card-content {
    padding: 1.5rem;
  }
  
  .test-title {
    font-size: 1.2rem;
  }
  
  .question-section {
    padding: 2rem 1.5rem;
  }
  
  .question-text {
    font-size: 1.1rem;
  }
  
  .option-content {
    padding: 1rem;
  }
  
  .next-btn {
    padding: 1rem 2rem;
    font-size: 1rem;
    min-width: 160px;
  }
  
  .results-section {
    padding: 3rem 1.5rem;
  }
  
  .results-title {
    font-size: 1.8rem;
  }
  
  .results-stats {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .stat-card {
    padding: 1.5rem;
  }
  
  .stat-value {
    font-size: 2.5rem;
  }

  .test-header {
    padding: 2rem 1.5rem;
  }
  
  .test-name {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .header-icon {
    font-size: 3rem;
  }
  
  .page-title {
    font-size: 1.8rem;
  }
  
  .empty-state {
    padding: 4rem 1.5rem;
  }
  
  .empty-icon {
    font-size: 3rem;
  }
  
  .empty-title {
    font-size: 1.5rem;
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
  
  .results-icon {
    font-size: 3rem;
  }
  
  .stat-value {
    font-size: 2rem;
  }
}

/* Animation enhancements */
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

.question-card {
  animation: fadeInUp 0.5s ease-out;
}

.results-card {
  animation: fadeInUp 0.6s ease-out;
}

/* Focus states for accessibility */
.start-btn:focus,
.next-btn:focus,
.back-btn:focus {
  outline: 3px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
}

.option-item:focus-within .option-content {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
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
  .test-card {
    transition: none;
    animation: none;
  }
  
  .loading-spinner .spinner-ring {
    animation: none;
  }
  
  .header-icon {
    animation: none;
  }
  
  .results-icon {
    animation: none;
  }
  
  .decoration-dot {
    animation: none;
  }
  
  .progress-fill {
    transition: none;
  }
}

/* Print styles */
@media print {
  .tests-page {
    background: white !important;
  }
  
  .tests-page::before {
    display: none;
  }
  
  .page-header {
    background: none !important;
    color: black !important;
  }
  
  .test-header {
    background: none !important;
    color: black !important;
  }
  
  .start-btn,
  .next-btn,
  .back-btn {
    display: none;
  }
  
  .test-card:hover {
    transform: none;
    box-shadow: none;
  }
}
</style>