<template>
  <div class="homework-page">
    <div class="back-button">
      <router-link to="/profile/homeworks" class="back-link">← Назад к списку</router-link>
    </div>
    
    <h1>Домашка: {{ lessonName || 'Без названия' }}</h1>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <h3>{{ error }}</h3>
      <router-link to="/profile/homeworks" class="error-button">Вернуться к списку</router-link>
    </div>

    <div v-else-if="!lessonId" class="error">
      <div class="error-icon">⚠️</div>
      <h3>Ошибка загрузки</h3>
      <p>ID урока не найден. Пожалуйста, вернитесь к списку домашних заданий.</p>
      <router-link to="/profile/homeworks" class="error-button">Вернуться к списку</router-link>
    </div>

    <div v-else-if="questions.length === 0" class="empty">
      В этом уроке нет домашнего задания.
    </div>

    <form v-else @submit.prevent="submitHomework">
      <div v-for="(q, i) in questions" :key="i" class="question-block">
        <p><strong>{{ i + 1 }}. {{ q.question }}</strong></p>

        <div class="options">
          <label v-for="(opt, j) in q.options" :key="j" class="option">
            <input
              type="radio"
              :name="'q' + i"
              :value="opt"
              v-model="userAnswers[i]"
            />
            {{ opt }}
          </label>
        </div>
      </div>

      <div class="actions">
        <button type="button" @click="saveHomework">Сохранить</button>
        <button type="submit" class="submit-btn">Завершить</button>
      </div>
    </form>
  </div>
</template>

<script>
import api from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'HomeworkPage',
  props: {
    lessonId: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      questions: [],
      lessonName: '',
      userAnswers: [],
      loading: true,
      error: null,
    };
  },
  computed: {
    // Get lessonId from route params if not passed as prop
    computedLessonId() {
      // Priority: props > route params > route query
      const fromProp = this.lessonId;
      const fromParams = this.$route.params.lessonId;
      const fromQuery = this.$route.query.lessonId;
      
      const id = fromProp || fromParams || fromQuery;
      
      // Validate the ID
      if (!id || id === 'null' || id === 'undefined') {
        return null;
      }
      
      return String(id);
    }
  },
  watch: {
    // Watch for route changes
    '$route.params.lessonId': {
      immediate: true,
      handler(newId, oldId) {
        console.log('📍 Route param lessonId changed:', { old: oldId, new: newId });
        if (newId && newId !== oldId) {
          this.fetchHomework();
        }
      }
    },
    
    // Watch computed lessonId
    computedLessonId: {
      immediate: true,
      handler(newId, oldId) {
        console.log('📍 Computed lessonId changed:', { old: oldId, new: newId });
        if (newId && newId !== oldId && !this.loading) {
          this.fetchHomework();
        }
      }
    }
  },
  methods: {
    async fetchHomework() {
      try {
        this.loading = true;
        
        // Get lessonId with fallbacks
        const lessonId = this.computedLessonId;
        
        if (!lessonId) {
          console.error('❌ No lessonId available');
          this.$toast?.error('Ошибка: ID урока не найден');
          this.loading = false;
          return;
        }
        
        console.log('📚 Fetching homework for lesson:', lessonId);
        
        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        const token = await user.getIdToken();
        const userId = user.uid;

        // Fetch lesson data to get homework questions
        try {
          const { data: lesson } = await api.get(`/lessons/${lessonId}`);
          console.log('✅ Lesson data loaded:', lesson.lessonName);
          
          this.lessonName = lesson.lessonName || lesson.title || 'Урок';
          this.questions = Array.isArray(lesson.homework) ? lesson.homework : [];
          this.userAnswers = this.questions.map(() => '');

          if (!this.questions.length) {
            console.warn('⚠️ Нет заданий в homework этого урока.');
            return;
          }
        } catch (lessonError) {
          console.error('❌ Failed to load lesson:', lessonError);
          
          // If lesson not found, show appropriate error
          if (lessonError.response && lessonError.response.status === 404) {
            this.$toast?.error('Урок не найден');
            this.error = 'Урок не найден. Возможно, он был удален.';
            this.loading = false;
            
            // Redirect back to homework list after a delay
            setTimeout(() => {
              this.$router.push('/profile/homeworks');
            }, 2000);
            return;
          }
          
          throw lessonError; // Re-throw if not a 404
        }

        // FIXED: Use correct API endpoint format
        // The correct format is: /homeworks/user/:firebaseId/lesson/:lessonId
        try {
          const { data: progressRes } = await api.get(
            `/homeworks/user/${userId}/lesson/${lessonId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log('✅ Loaded homework progress:', progressRes);

          // Handle the response structure
          const homeworkData = progressRes?.data || progressRes;
          
          if (homeworkData?.answers) {
            // If answers is an object with questionIndex as keys
            if (!Array.isArray(homeworkData.answers)) {
              Object.entries(homeworkData.answers).forEach(([index, answer]) => {
                const idx = parseInt(index);
                if (!isNaN(idx) && idx >= 0 && idx < this.userAnswers.length) {
                  this.userAnswers[idx] = answer;
                }
              });
            } else {
              // If answers is an array
              for (const entry of homeworkData.answers) {
                if (entry.questionIndex !== undefined && entry.answer !== undefined) {
                  this.userAnswers[entry.questionIndex] = entry.answer;
                }
              }
            }
          }
        } catch (progressErr) {
          // It's OK if no progress exists yet
          console.log('ℹ️ No existing homework progress found');
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки домашки:', err);
        
        // Check if it's a 404 error (lesson not found)
        if (err.response && err.response.status === 404) {
          this.error = 'Урок не найден. Возможно, он был удален.';
          this.$toast?.error('Урок не найден');
          
          // Redirect back to homework list after a delay
          setTimeout(() => {
            this.$router.push('/profile/homeworks');
          }, 2000);
        } else {
          this.error = 'Ошибка загрузки домашнего задания';
          this.$toast?.error('Ошибка загрузки домашки.');
        }
      } finally {
        this.loading = false;
      }
    },

    async saveHomework() {
      try {
        const lessonId = this.computedLessonId;
        if (!lessonId) {
          this.$toast?.error('Ошибка: ID урока не найден');
          return;
        }
        
        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        const token = await user.getIdToken();
        const userId = user.uid;

        const answers = this.userAnswers.map((ans, i) => ({
          questionIndex: i,
          answer: ans
        }));

        // FIXED: Use correct API endpoint format
        await api.post(
          `/homeworks/user/${userId}/save`,
          { lessonId: lessonId, answers, completed: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        this.$toast?.success('Ответы сохранены!');
      } catch (err) {
        console.error('❌ Ошибка при сохранении:', err);
        this.$toast?.error('Не удалось сохранить.');
      }
    },

    async submitHomework() {
      try {
        const lessonId = this.computedLessonId;
        if (!lessonId) {
          this.$toast?.error('Ошибка: ID урока не найден');
          return;
        }
        
        if (this.userAnswers.includes('')) {
          this.$toast?.warning('Пожалуйста, ответьте на все вопросы.');
          return;
        }

        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        const token = await user.getIdToken();
        const userId = user.uid;

        const answers = this.userAnswers.map((ans, i) => ({
          questionIndex: i,
          answer: ans
        }));

        // FIXED: Use correct API endpoint format
        const { data } = await api.post(
          `/homeworks/user/${userId}/lesson/${lessonId}/submit`,
          { answers },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        this.$toast?.success(`Домашка завершена! Ваша оценка: ${data.score || data.data?.score || 0}%`);
        this.$router.push('/profile/homeworks');
      } catch (err) {
        console.error('❌ Ошибка при отправке:', err);
        this.$toast?.error('Ошибка отправки ответов.');
      }
    }
  },
  created() {
    // Debug route info on component creation
    console.group('🎯 HomeworkPage Created');
    console.log('Props lessonId:', this.lessonId);
    console.log('Route params:', this.$route.params);
    console.log('Computed lessonId:', this.computedLessonId);
    console.groupEnd();
  },
  mounted() {
    // Only fetch if we have a lessonId
    if (this.computedLessonId) {
      this.fetchHomework();
    } else {
      console.error('❌ No lessonId available on mount');
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.homework-page {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  background: linear-gradient(to bottom right, #f0f4ff, #ffffff);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.back-button {
  margin-bottom: 1.5rem;
}

.back-link {
  color: #6a5acd;
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #5848c2;
}

.loading,
.empty,
.error {
  text-align: center;
  font-size: 1.3rem;
  color: #6a5acd;
  margin-top: 3rem;
}

.error {
  color: #ef4444;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error h3 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.error p {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.error-button {
  display: inline-block;
  background: #6a5acd;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s ease;
}

.error-button:hover {
  background: #5848c2;
}

.question-block {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.1);
  margin-bottom: 2rem;
  transition: transform 0.2s ease;
}

.question-block:hover {
  transform: scale(1.01);
}

.question-block p {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: #333;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option {
  background: #f9f9ff;
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: background 0.3s ease;
  cursor: pointer;
}

.option:hover {
  background: #ececff;
}

.option input {
  margin-right: 0.6rem;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

button {
  padding: 0.65rem 1.4rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease-in-out;
  background-color: #e0e0e0;
  color: #333;
}

button:hover {
  background-color: #d1d1f0;
}

.submit-btn {
  background-color: #6a5acd;
  color: white;
}

.submit-btn:hover {
  background-color: #5848c2;
}

@media (max-width: 768px) {
  .homework-page {
    padding: 1rem;
  }
  
  .actions {
    justify-content: stretch;
  }
  
  button {
    flex: 1;
  }
}
</style>