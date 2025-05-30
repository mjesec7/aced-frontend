<template>
  <div class="homework-list-wrapper">
    <h1>📚 Домашние задания</h1>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="homeworks.length === 0" class="empty">Нет домашних заданий.</div>

    <div v-else class="homework-cards">
      <div v-for="hw in homeworks" :key="hw.lessonId" class="homework-card">
        <div class="card-header">
          <h3>{{ hw.lessonName || 'Без названия' }}</h3>
          <span class="status-chip" :class="statusClass(hw)">
            {{ statusLabel(hw) }}
          </span>
        </div>

        <div class="card-body">
          <p><strong>Прогресс:</strong>
            <span v-if="hw.record?.completed">
              {{ hw.record.score }}%
            </span>
            <span v-else-if="hw.record">В процессе</span>
            <span v-else>Не начато</span>
          </p>
        </div>

        <div class="card-footer">
          <button @click="goToHomework(hw.lessonId)">Перейти к домашке →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'HomeworkList',
  data() {
    return {
      homeworks: [],
      loading: true,
    };
  },
  methods: {
    goToHomework(lessonId) {
      this.$router.push(`/profile/homeworks/${lessonId}`);
    },
    statusLabel(hw) {
      if (!hw.record) return '⏳ Не начато';
      if (!hw.record.completed) return '🔄 В процессе';
      return '✅ Завершено';
    },
    statusClass(hw) {
      if (!hw.record) return 'pending';
      if (!hw.record.completed) return 'in-progress';
      return 'completed';
    },
    async fetchHomeworks() {
      try {
        this.loading = true;
        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        const token = await user.getIdToken();
        const userId = user.uid;

        const { data: progressRes } = await api.get(`/users/${userId}/homeworks`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const progressMap = {};
        for (const hw of progressRes.data) {
          progressMap[hw.lessonId] = hw;
        }

        const { data: lessonsRes } = await api.get(`/lessons`);
        const homeworkLessons = lessonsRes.data.filter(lesson => lesson.homework?.length > 0);

        this.homeworks = homeworkLessons.map(lesson => ({
          lessonId: lesson._id,
          lessonName: lesson.lessonName,
          record: progressMap[lesson._id] || null
        }));
      } catch (err) {
        console.error('❌ Ошибка загрузки домашних заданий:', err);
        this.$toast?.error('Ошибка загрузки домашних заданий.');
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.fetchHomeworks();
  }
};
</script>

<style scoped>
.homework-list-wrapper {
  max-width: 900px;
  margin: auto;
  padding: 2.5rem 1rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #4b0082;
}

.loading,
.empty {
  text-align: center;
  font-size: 1.2rem;
  color: #777;
  margin-top: 2rem;
}

.homework-cards {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.homework-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.homework-card:hover {
  transform: scale(1.015);
  box-shadow: 0 10px 24px rgba(106, 90, 205, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.status-chip {
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-chip.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-chip.in-progress {
  background-color: #e0f2fe;
  color: #0369a1;
}

.status-chip.completed {
  background-color: #d1fae5;
  color: #065f46;
}

.card-body {
  margin-top: 0.75rem;
  color: #555;
}

.card-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.card-footer button {
  background-color: #6a5acd;
  color: #fff;
  border: none;
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.card-footer button:hover {
  background-color: #5848c2;
}
</style>
