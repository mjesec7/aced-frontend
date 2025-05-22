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
  import api from '@/api';
  import { auth } from '@/firebase';
  
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
          if (!user) throw new Error('Пользователь не авторизован');
          const token = await user.getIdToken();
          const userId = user.uid;
  
          const { data: lesson } = await api.get(`/lessons/${this.lessonId}`);
          this.lessonName = lesson.lessonName;
          this.questions = lesson.homework || [];
          this.userAnswers = this.questions.map(() => '');
  
          const { data: progressRes } = await api.get(
            `/users/${userId}/homeworks/lesson/${this.lessonId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          if (progressRes?.data?.answers?.length) {
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
          if (!user) throw new Error('Пользователь не авторизован');
          const token = await user.getIdToken();
          const userId = user.uid;
  
          const answers = this.userAnswers.map((ans, i) => ({
            questionIndex: i,
            answer: ans
          }));
  
          await api.post(
            `/users/${userId}/homeworks`,
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
          if (!user) throw new Error('Пользователь не авторизован');
          const token = await user.getIdToken();
          const userId = user.uid;
  
          const answers = this.userAnswers.map((ans, i) => ({
            questionIndex: i,
            answer: ans
          }));
  
          const { data } = await api.post(
            `/users/${userId}/homeworks/lesson/${this.lessonId}/submit`,
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
  background: linear-gradient(to bottom right, #f0f4ff, #ffffff);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.loading {
  text-align: center;
  font-size: 1.3rem;
  color: #6a5acd;
  margin-top: 3rem;
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
}

.option:hover {
  background: #ececff;
}

.option input {
  margin-right: 0.6rem;
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
</style>
