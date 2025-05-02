<template>
  <div class="lesson-page">
    <div class="lesson-split">
      <!-- LEFT PANEL: Scrollable Lesson Content -->
      <div class="lesson-left">
        <h2 class="lesson-title">{{ lesson.lessonName || 'Без названия' }}</h2>

        <div class="section" v-if="currentStep === 0">
          <h3>📚 Объяснение</h3>
          <div v-html="lesson.explanation || 'Нет объяснения'" class="lesson-text"></div>
        </div>

        <div class="section" v-else-if="currentStep === 1">
          <h3>📗 Примеры</h3>
          <div v-html="lesson.examples || 'Нет примеров'" class="lesson-text"></div>
        </div>

        <div class="section" v-else-if="currentStep >= 2 && currentStep < exerciseSteps">
          <h3>✏️ Упражнение {{ currentStep - 1 }}</h3>
          <p class="lesson-text">{{ currentExercise.question || 'Вопрос отсутствует' }}</p>
          <button class="hint-btn" @click="toggleHint">💡 Подсказка</button>
          <div v-if="showHint" class="hint-box">{{ currentExercise.hint || lesson.hint || 'Подсказка недоступна' }}</div>
        </div>

        <div class="section" v-else-if="currentStep === exerciseSteps">
          <h3>🧠 Квиз</h3>
          <p class="lesson-text">{{ currentQuiz.question || 'Вопрос отсутствует' }}</p>
          <ul>
            <li v-for="(option, index) in currentQuiz.options || []" :key="index">
              {{ option.option || option }}
            </li>
          </ul>
        </div>

        <div class="section" v-else>
          <h3>🏆 Урок завершён!</h3>
          <p>Вы прошли все этапы!</p>
        </div>

        <div class="navigation-area">
          <button class="nav-btn" @click="goPrevious" :disabled="currentStep === 0">⬅️ Назад</button>
          <button class="nav-btn" @click="goNext">➡️ Далее</button>
        </div>
      </div>

      <!-- RIGHT PANEL: Writing Board -->
      <div class="lesson-right">
        <h3>✏️ Практическая зона</h3>
        <textarea v-model="userAnswer" placeholder="Введите ваш ответ..."></textarea>
        <button class="submit-btn" @click="submitAnswer">Отправить</button>
        <div v-if="confirmation" class="confirmation">{{ confirmation }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LessonPage',
  data() {
    return {
      lesson: {},
      allLessons: [],
      loading: true,
      userAnswer: '',
      confirmation: '',
      currentStep: 0,
      completedLessons: new Set(),
      showHint: false,
    };
  },
  computed: {
    exerciseSteps() {
      return 2 + (this.lesson.exercises?.length || 0);
    },
    currentExercise() {
      return this.lesson.exercises?.[this.currentStep - 2] || {};
    },
    currentQuiz() {
      return this.lesson.quiz?.[0] || {};
    },
  },
  async mounted() {
    await this.loadLesson();
  },
  methods: {
    async loadLesson() {
      try {
        const lessonId = this.$route.params.id;
        const { data: lessonData } = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/${lessonId}`);
        this.lesson = lessonData;
        if (this.lesson.topicId) {
          const { data: topicLessons } = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/topic/${this.lesson.topicId}`);
          this.allLessons = Array.isArray(topicLessons) ? topicLessons : [];
        }
      } catch (error) {
        console.error('Ошибка загрузки урока:', error);
      } finally {
        this.loading = false;
      }
    },
    submitAnswer() {
      if (!this.userAnswer.trim()) {
        this.confirmation = '⚠️ Пожалуйста, введите ответ.';
        return;
      }
      this.confirmation = '✅ Ответ отправлен!';
      this.userAnswer = '';
    },
    goPrevious() {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.resetAnswer();
      }
    },
    goNext() {
      if (this.currentStep < this.exerciseSteps) {
        this.currentStep++;
        this.resetAnswer();
      } else {
        this.goToNextLesson();
      }
    },
    resetAnswer() {
      this.userAnswer = '';
      this.confirmation = '';
      this.showHint = false;
    },
    goToNextLesson() {
      const currentIndex = this.allLessons.findIndex(l => l._id === this.lesson._id);
      if (!this.completedLessons.has(this.lesson._id)) {
        this.completedLessons.add(this.lesson._id);
      }
      if (currentIndex !== -1 && currentIndex + 1 < this.allLessons.length) {
        const nextLessonId = this.allLessons[currentIndex + 1]._id;
        this.$router.push({ name: 'LessonView', params: { id: nextLessonId } });
      } else {
        const performance = Math.round((this.completedLessons.size / this.allLessons.length) * 100);
        this.$router.push({ name: 'TopicFinished', query: { performance } });
      }
    },
    toggleHint() {
      this.showHint = !this.showHint;
    }
  }
};
</script>

<style scoped>
.lesson-page {
  background: white;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  color: black;
}

.lesson-split {
  display: flex;
  height: calc(100vh - 40px);
}

.lesson-left {
  width: 60%;
  padding: 24px;
  overflow-y: auto;
  border-right: 2px solid transparent;
  border-image: linear-gradient(to bottom, #7c3aed, #8b5cf6);
  border-image-slice: 1;
}

.lesson-right {
  width: 40%;
  padding: 24px;
  background: #f8fafc;
  box-shadow: inset 0 0 20px rgba(124, 58, 237, 0.1);
}

.lesson-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 20px;
}

.lesson-text {
  font-size: 1rem;
  line-height: 1.6;
}

textarea {
  width: 100%;
  height: 150px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  color: black;
  font-size: 1rem;
}

.submit-btn, .nav-btn, .hint-btn {
  margin-top: 16px;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  color: white;
  font-weight: 700;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
}

.navigation-area {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.confirmation {
  margin-top: 10px;
  color: #065f46;
  font-weight: 600;
}
</style>
