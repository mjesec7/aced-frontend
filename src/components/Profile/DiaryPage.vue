<template>
  <div class="diary-page">
    <h1 class="page-title">🗓 Дневник — {{ today }}</h1>

    <div v-if="loading" class="loading">Загрузка данных...</div>

    <div v-else>
      <div class="cards-grid">
        <!-- Study Time Tracker -->
        <div class="card">
          <h2>⏳ Время изучения сегодня</h2>
          <p>{{ studyMinutes }} минут</p>
        </div>

        <!-- Lessons for Today -->
        <div class="card">
          <h2>🕓 Уроки на сегодня</h2>
          <ul v-if="lessonsToday.length">
            <li v-for="lesson in lessonsToday" :key="lesson._id">
              {{ lesson.subject }} — {{ lesson.topic }}
            </li>
          </ul>
          <p v-else>Все уроки на сегодня завершены!</p>
        </div>

        <!-- Lessons for Tomorrow -->
        <div class="card">
          <h2>🔜 Уроки на завтра</h2>
          <ul v-if="lessonsTomorrow.length">
            <li v-for="lesson in lessonsTomorrow" :key="lesson._id">
              {{ lesson.subject }} — {{ lesson.topic }}
            </li>
          </ul>
          <p v-else>На завтра ещё нет уроков.</p>
        </div>

        <!-- Grades This Week -->
        <div class="card">
          <h2>🏆 Оценки за неделю</h2>
          <ul v-if="gradesThisWeek.length">
            <li v-for="grade in gradesThisWeek" :key="grade.lessonId">
              {{ grade.subject }} — {{ grade.topic }}: <strong>{{ grade.score }}%</strong>
            </li>
          </ul>
          <p v-else>Пока нет оценок на этой неделе.</p>
        </div>
      </div>

      <!-- Today Progress -->
      <div class="progress-area">
        <p>Прогресс дня: {{ progressPercent }}%</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- Save Diary Button -->
      <div class="save-diary">
        <button class="save-btn" @click="saveDiary" :disabled="diarySaved || saving">
          ✅ Завершить день
        </button>
        <p v-if="diarySaved" class="save-success">Дневник сохранён успешно!</p>
      </div>

      <!-- Diary History Section -->
      <div class="diary-history" v-if="recentDiaryLogs.length">
        <h2 class="history-title">📚 История дневника</h2>

        <div v-for="log in recentDiaryLogs" :key="log.date" class="history-card">
          <h3>📅 {{ formatDate(log.date) }}</h3>
          <p>⏳ Время обучения: {{ log.studyMinutes }} минут</p>

          <div v-if="log.completedTopics?.length">
            <h4>✅ Завершённые темы:</h4>
            <ul>
              <li v-for="topic in log.completedTopics" :key="topic">{{ topic }}</li>
            </ul>
          </div>

          <div v-if="log.gradesToday?.length">
            <h4>🏆 Оценки:</h4>
            <ul>
              <li v-for="grade in log.gradesToday" :key="grade.topic">
                {{ grade.subject }} — {{ grade.topic }}: <strong>{{ grade.score }}%</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { mapState } from 'vuex';

export default {
  name: 'DiaryPage',
  data() {
    return {
      today: '',
      lessons: [],
      userProgress: {},
      lessonsToday: [],
      lessonsTomorrow: [],
      gradesThisWeek: [],
      completedToday: [],
      studyMinutes: 0,
      diarySaved: false,
      diaryLogs: [],
      loading: true,
      saving: false,
      timer: null,
    };
  },
  computed: {
    ...mapState(['firebaseUserId']),
    progressPercent() {
      const total = this.completedToday.length + this.lessonsToday.length;
      return total > 0 ? Math.round((this.completedToday.length / total) * 100) : 0;
    },
    recentDiaryLogs() {
      return [...this.diaryLogs]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7);
    }
  },
  mounted() {
    this.today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    this.startTimer();
    this.fetchData();
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  methods: {
    startTimer() {
      this.timer = setInterval(() => {
        this.studyMinutes++;
      }, 60000);
    },
    async fetchData() {
      const userId = this.firebaseUserId;
      if (!userId) {
        console.error('❌ Нет userId в Vuex. Невозможно загрузить дневник.');
        this.loading = false;
        return;
      }

      try {
        const [lessonsRes, userRes] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/lessons`),
          axios.get(`${process.env.VUE_APP_API_URL}/users/${userId}`)
        ]);

        this.lessons = lessonsRes.data || [];
        this.userProgress = userRes.data.progress || {};
        this.diaryLogs = userRes.data.diaryLogs || [];

        this.calculateToday();
      } catch (error) {
        console.error('❌ Ошибка загрузки данных дневника:', error);
      } finally {
        this.loading = false;
      }
    },
    calculateToday() {
      const sections = ['explanation', 'examples', 'exercises', 'quiz'];
      const todayLessons = [];
      const tomorrowLessons = [];
      const completed = [];
      const grades = [];

      this.lessons.forEach(lesson => {
        const progress = this.userProgress[lesson._id] || {};
        const done = sections.filter(sec => progress[sec]).length;
        const score = Math.round((done / sections.length) * 100);

        if (done === sections.length) {
          completed.push(`${lesson.topic} (${lesson.subject})`);
          grades.push({ lessonId: lesson._id, subject: lesson.subject, topic: lesson.topic, score: 100 });
        } else if (done > 0) {
          grades.push({ lessonId: lesson._id, subject: lesson.subject, topic: lesson.topic, score });
        }

        if (!progress.explanation && !progress.examples && !progress.exercises && !progress.quiz) {
          tomorrowLessons.push(lesson);
        } else if (todayLessons.length < 3 && done < sections.length) {
          todayLessons.push(lesson);
        }
      });

      this.completedToday = completed;
      this.lessonsToday = todayLessons;
      this.lessonsTomorrow = tomorrowLessons.slice(0, 3);
      this.gradesThisWeek = grades;
    },
    async saveDiary() {
      const userId = this.firebaseUserId;
      if (!userId) {
        console.error('❌ Нет userId в Vuex. Невозможно сохранить дневник.');
        return;
      }

      try {
        this.saving = true;
        await axios.post(`${process.env.VUE_APP_API_URL}/users/${userId}/diary`, {
          date: new Date().toISOString().split('T')[0],
          studyMinutes: this.studyMinutes,
          completedTopics: this.completedToday,
          gradesToday: this.gradesThisWeek,
        });
        this.diarySaved = true;
      } catch (error) {
        console.error('❌ Ошибка сохранения дневника:', error);
      } finally {
        this.saving = false;
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
};
</script>


<style scoped>
/* 📋 Same beautiful styles you wrote — no changes needed */
.diary-page {
  padding: 24px;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}
.page-title {
  font-size: 2.4rem;
  font-weight: 800;
  color: #7c3aed;
  margin-bottom: 32px;
  text-align: center;
}
.loading {
  text-align: center;
  margin-top: 80px;
  font-size: 1.4rem;
  color: #6b7280;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
.card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
}
.card h2 {
  font-size: 1.4rem;
  margin-bottom: 16px;
  color: #6d28d9;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 10px;
  color: #374151;
  font-size: 1rem;
}
.progress-area {
  margin-top: 40px;
  text-align: center;
}
.progress-bar {
  background: #e5e7eb;
  height: 16px;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 10px;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.progress-fill {
  background: linear-gradient(to right, #8b5cf6, #60a5fa);
  height: 100%;
  transition: width 0.5s ease;
}
.save-diary {
  margin-top: 40px;
  text-align: center;
}
.save-btn {
  background: linear-gradient(to right, #8b5cf6, #60a5fa);
  color: white;
  padding: 12px 24px;
  font-size: 1.1rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.3s;
}
.save-btn:hover {
  background: linear-gradient(to right, #7c3aed, #4f46e5);
}
.save-success {
  margin-top: 12px;
  color: #10b981;
  font-weight: 600;
}
.diary-history {
  margin-top: 50px;
}
.history-title {
  font-size: 2rem;
  margin-bottom: 24px;
  text-align: center;
  color: #4c1d95;
}
.history-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
}
</style>
