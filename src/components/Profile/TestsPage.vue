<template>
  <div class="tests-page">
    <h1 class="page-title">🧪 Тесты</h1>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Загрузка тестов...
    </div>

    <div v-else>
      <!-- Test List Page -->
      <div v-if="!activeTest" class="tests-grid">
        <div v-if="tests.length === 0" class="no-tests">
          <p>📋 Пока что тестов нет</p>
          <p>Тесты появятся здесь, когда они будут добавлены администратором.</p>
        </div>
        
        <div v-else class="test-card" v-for="test in tests" :key="test._id">
          <div class="test-header">
            <h2 class="test-title">{{ test.title }}</h2>
            <span class="test-questions-count">{{ test.questions?.length || 0 }} вопросов</span>
          </div>
          <div class="test-info">
            <p class="test-detail">📘 <strong>Тема:</strong> {{ test.topic }}</p>
            <p class="test-detail">📚 <strong>Предмет:</strong> {{ test.subject }}</p>
          </div>
          <button class="start-test-btn" @click="startTest(test)">
            Начать тест
          </button>
        </div>
      </div>

      <!-- Single Test Attempt Page -->
      <div v-else class="test-container">
        <div class="test-header-section">
          <h2 class="active-test-title">{{ activeTest.title }}</h2>
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

        <div v-if="currentQuestionIndex < activeTest.questions.length" class="question-block">
          <div class="question-content">
            <h3 class="question-text">
              {{ currentQuestionIndex + 1 }}. {{ currentQuestion.question }}
            </h3>

            <div class="options">
              <label 
                v-for="(opt, j) in currentQuestion.options" 
                :key="j" 
                class="option"
                :class="{ selected: userAnswers[currentQuestionIndex] === opt }"
              >
                <input
                  type="radio"
                  :value="opt"
                  v-model="userAnswers[currentQuestionIndex]"
                />
                <span class="option-text">{{ opt }}</span>
              </label>
            </div>

            <div class="actions">
              <button 
                class="action-btn"
                @click="nextQuestion"
                :disabled="!userAnswers[currentQuestionIndex]"
              >
                {{ currentQuestionIndex === activeTest.questions.length - 1 ? '✅ Завершить тест' : '➡️ Следующий вопрос' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div v-else class="test-result">
          <div class="result-header">
            <h3 class="result-title">🎉 Тест завершен!</h3>
          </div>
          
          <div class="result-stats">
            <div class="stat-item">
              <div class="stat-number">{{ correctCount }}</div>
              <div class="stat-label">из {{ activeTest.questions.length }}</div>
              <div class="stat-description">правильных ответов</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-number score-number" :class="getScoreClass(score)">{{ score }}%</div>
              <div class="stat-label">результат</div>
              <div class="stat-description">{{ getScoreDescription(score) }}</div>
            </div>
          </div>

          <div class="result-actions">
            <button class="back-btn" @click="goBack">
              ⬅️ К списку тестов
            </button>
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
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: #6b7280;
  font-size: 1.1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-tests {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.test-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.test-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.test-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.test-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.test-questions-count {
  background: #ede9fe;
  color: #7c3aed;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.test-info {
  margin-bottom: 1.5rem;
}

.test-detail {
  margin: 0.5rem 0;
  color: #4b5563;
  font-size: 0.95rem;
}

.start-test-btn {
  width: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(99, 102, 241, 0.5);
}

.test-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.test-header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.active-test-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
}

.question-block {
  padding: 2rem;
}

.question-content {
  max-width: 600px;
  margin: 0 auto;
}

.question-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.option:hover {
  border-color: #6366f1;
  background: #f8faff;
}

.option.selected {
  border-color: #6366f1;
  background: #ede9fe;
}

.option input[type="radio"] {
  margin-right: 1rem;
  transform: scale(1.2);
  accent-color: #6366f1;
}

.option-text {
  font-size: 1rem;
  color: #374151;
  line-height: 1.4;
}

.actions {
  text-align: center;
}

.action-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(99, 102, 241, 0.5);
}

.action-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
}

.test-result {
  padding: 3rem 2rem;
  text-align: center;
}

.result-header {
  margin-bottom: 2rem;
}

.result-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 16px;
  min-width: 150px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #6366f1;
  margin-bottom: 0.5rem;
}

.score-number.excellent {
  color: #10b981;
}

.score-number.good {
  color: #3b82f6;
}

.score-number.average {
  color: #f59e0b;
}

.score-number.poor {
  color: #ef4444;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-description {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.result-actions {
  margin-top: 2rem;
}

.back-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #4b5563;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .tests-page {
    padding: 1rem;
  }
  
  .tests-grid {
    grid-template-columns: 1fr;
  }
  
  .test-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .result-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
}