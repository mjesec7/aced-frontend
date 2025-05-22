<template>
    <div class="homework-page">
      <h1>Домашка: {{ lessonName || 'Без названия' }}</h1>
  
      <div v-if="loading" class="loading">Загрузка...</div>
  
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
  import axios from 'axios';
  import { auth } from '@/firebase';
  import { BASE_URL } from '@/config';
  
  export default {
    name: 'HomeworkPage',
    props: ['lessonId'],
    data() {
      return {
        questions: [],
        lessonName: '',
        userAnswers: [],
        loading: true,
      };
    },
    methods: {
      async fetchHomework() {
        try {
          this.loading = true;
          const user = auth.currentUser;
          const token = await user.getIdToken();
          const userId = user.uid;
  
          // Fetch lesson (with homework)
          const { data: lessonRes } = await axios.get(`${BASE_URL}/lessons/${this.lessonId}`);
          const lesson = lessonRes;
          this.lessonName = lesson.lessonName;
          this.questions = lesson.homework || [];
  
          // Init empty answers
          this.userAnswers = this.questions.map(() => '');
  
          // Fetch previous answers if exist
          const { data: progressRes } = await axios.get(
            `${BASE_URL}/users/${userId}/homeworks/lesson/${this.lessonId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          if (progressRes.data && progressRes.data.answers?.length) {
            for (const entry of progressRes.data.answers) {
              this.userAnswers[entry.questionIndex] = entry.answer;
            }
          }
        } catch (err) {
          console.error('❌ Ошибка загрузки домашки:', err);
          this.$toast?.error('Ошибка загрузки домашки.');
        } finally {
          this.loading = false;
        }
      },
      async saveHomework() {
        try {
          const user = auth.currentUser;
          const token = await user.getIdToken();
          const userId = user.uid;
  
          const answers = this.userAnswers.map((ans, i) => ({
            questionIndex: i,
            answer: ans
          }));
  
          await axios.post(
            `${BASE_URL}/users/${userId}/homeworks`,
            { lessonId: this.lessonId, answers, completed: false },
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
          const user = auth.currentUser;
          const token = await user.getIdToken();
          const userId = user.uid;
  
          const answers = this.userAnswers.map((ans, i) => ({
            questionIndex: i,
            answer: ans
          }));
  
          const { data } = await axios.post(
            `${BASE_URL}/users/${userId}/homeworks/lesson/${this.lessonId}/submit`,
            { answers },
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          this.$toast?.success(`Домашка завершена! Оценка: ${data.data.score}%`);
          this.$router.push('/profile/homeworks');
        } catch (err) {
          console.error('❌ Ошибка при отправке:', err);
          this.$toast?.error('Ошибка отправки ответов.');
        }
      }
    },
    mounted() {
      this.fetchHomework();
    }
  };
  </script>
  
  <style scoped>
  .homework-page {
    max-width: 800px;
    margin: auto;
    padding: 2rem;
  }
  
  .loading {
    text-align: center;
    font-size: 1.2rem;
    color: #888;
  }
  
  .question-block {
    margin-bottom: 2rem;
  }
  
  .options {
    display: flex;
    flex-direction: column;
    margin-top: 0.5rem;
  }
  
  .option {
    margin: 0.3rem 0;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  button {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .submit-btn {
    background-color: #6a5acd;
    color: white;
  }
  </style>
  