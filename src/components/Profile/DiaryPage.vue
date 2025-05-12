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
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    this.today = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
        const token = await auth.currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [lessonsRes, userRes] = await Promise.all([
          axios.get(`${BASE_URL}/lessons`, { headers }),
          axios.get(`${BASE_URL}/users/${userId}`, { headers })
        ]);

        this.lessons = lessonsRes.data || [];
        this.userProgress = userRes.data.progress || {};
        this.diaryLogs = userRes.data.diary || [];

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
        const token = await auth.currentUser.getIdToken();

        await axios.post(
          `${BASE_URL}/users/${userId}/diary`,
          {
            date: new Date().toISOString().split('T')[0],
            studyMinutes: this.studyMinutes,
            completedTopics: this.completedToday,
            averageGrade:
              this.gradesThisWeek.length > 0
                ? Math.round(this.gradesThisWeek.reduce((sum, g) => sum + g.score, 0) / this.gradesThisWeek.length)
                : 0,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        this.diarySaved = true;
      } catch (error) {
        console.error('❌ Ошибка сохранения дневника:', error);
      } finally {
        this.saving = false;
      }
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }
};
</script>




<style scoped>
.diary-page {
  padding: 32px;
  font-family: 'Inter', sans-serif;
  background-color: #f9fafb;
  min-height: 100vh;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #4f46e5;
  text-align: center;
  margin-bottom: 40px;
}

.loading {
  text-align: center;
  margin-top: 80px;
  font-size: 1.2rem;
  color: #6b7280;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
}

.card h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 14px;
}

.card p,
.card li {
  font-size: 1rem;
  color: #374151;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin-bottom: 8px;
}

.progress-area {
  text-align: center;
  margin-top: 30px;
}

.progress-area p {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.progress-bar {
  height: 16px;
  border-radius: 10px;
  overflow: hidden;
  background: #e5e7eb;
  margin-top: 12px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #6366f1, #60a5fa);
  transition: width 0.5s ease-in-out;
}

.save-diary {
  margin-top: 40px;
  text-align: center;
}

.save-btn {
  background: linear-gradient(to right, #4f46e5, #6366f1);
  color: white;
  padding: 14px 28px;
  font-size: 1.1rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.save-btn:hover {
  background: linear-gradient(to right, #4338ca, #4f46e5);
}

.save-success {
  margin-top: 12px;
  color: #10b981;
  font-weight: 600;
  font-size: 0.95rem;
}

.diary-history {
  margin-top: 60px;
}

.history-title {
  font-size: 2rem;
  text-align: center;
  font-weight: 700;
  margin-bottom: 30px;
  color: #4f46e5;
}

.history-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.history-card h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10px;
}

.history-card h4 {
  font-size: 1.1rem;
  margin-top: 16px;
  color: #374151;
  font-weight: 600;
}

</style>
