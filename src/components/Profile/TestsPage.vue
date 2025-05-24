<template>
    <div class="tests-page">
      <h1 class="page-title">🧪 Тесты</h1>
  
      <div v-if="loading" class="loading">Загрузка тестов...</div>
  
      <div v-else>
        <!-- Test List Page -->
        <div v-if="!activeTest">
          <div class="test-card" v-for="test in tests" :key="test._id">
            <h2>{{ test.title }}</h2>
            <p>📘 Тема: {{ test.topic }}</p>
            <p>📚 Предмет: {{ test.subject }}</p>
            <button @click="startTest(test)">Начать тест</button>
          </div>
        </div>
  
        <!-- Single Test Attempt Page -->
        <div v-else>
          <h2>{{ activeTest.title }}</h2>
          <div v-if="currentQuestionIndex < activeTest.questions.length" class="question-block">
            <p><strong>{{ currentQuestionIndex + 1 }}. {{ currentQuestion.question }}</strong></p>
  
            <div class="options">
              <label v-for="(opt, j) in currentQuestion.options" :key="j" class="option">
                <input
                  type="radio"
                  :value="opt"
                  v-model="userAnswers[currentQuestionIndex]"
                />
                {{ opt }}
              </label>
            </div>
  
            <div class="actions">
              <button @click="nextQuestion">
                {{ currentQuestionIndex === activeTest.questions.length - 1 ? 'Завершить' : 'Далее' }}
              </button>
            </div>
          </div>
  
          <!-- Results -->
          <div v-else class="test-result">
            <h3>✅ Результаты теста</h3>
            <p>Правильных ответов: {{ correctCount }} / {{ activeTest.questions.length }}</p>
            <p>Оценка: {{ score }}%</p>
            <button @click="goBack">Назад ко всем тестам</button>
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
        return this.activeTest.questions[this.currentQuestionIndex];
      },
      correctCount() {
        return this.activeTest.questions.reduce((acc, q, idx) => {
          return acc + (q.correctAnswer === this.userAnswers[idx] ? 1 : 0);
        }, 0);
      },
      score() {
        return Math.round((this.correctCount / this.activeTest.questions.length) * 100);
      }
    },
    async mounted() {
      try {
        const token = await auth.currentUser.getIdToken();
        const { data } = await axios.get(`${BASE_URL}/tests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.tests = data.tests || [];
      } catch (err) {
        console.error('❌ Ошибка загрузки тестов:', err);
      } finally {
        this.loading = false;
      }
    },
    methods: {
      async startTest(test) {
        try {
          this.loading = true;
          const token = await auth.currentUser.getIdToken();
          const { data } = await axios.get(`${BASE_URL}/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.activeTest = data.test;
          this.userAnswers = Array(this.activeTest.questions.length).fill('');
          this.currentQuestionIndex = 0;
        } catch (err) {
          console.error('❌ Ошибка загрузки теста:', err);
        } finally {
          this.loading = false;
        }
      },
      nextQuestion() {
        if (this.currentQuestionIndex + 1 < this.activeTest.questions.length) {
          this.currentQuestionIndex++;
        } else {
          this.submitTest();
        }
      },
      async submitTest() {
        try {
          const token = await auth.currentUser.getIdToken();
          const userId = auth.currentUser.uid;
  
          await axios.post(
            `${BASE_URL}/users/${userId}/tests/${this.activeTest._id}/submit`,
            { answers: this.userAnswers },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.error('❌ Ошибка отправки теста:', err);
        }
      },
      goBack() {
        this.activeTest = null;
        this.userAnswers = [];
      }
    }
  };
  </script>
  
  <style scoped>
  .tests-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  .test-card, .question-block, .test-result {
    margin-bottom: 2rem;
    border: 1px solid #ddd;
    padding: 1.5rem;
    border-radius: 8px;
    background: #f9f9f9;
  }
  .option {
    display: block;
    margin: 0.5rem 0;
  }
  .actions {
    margin-top: 1rem;
  }
  </style>
  