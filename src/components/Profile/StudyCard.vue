<template>
  <div v-if="lessonExists" class="study-card">
    <button class="close-btn" @click="showDeleteModal = true">✕</button>

    <div class="card-header">
      <h3 class="topic-name">{{ displayName }}</h3>
      <img v-if="medal" :src="`/assets/medals/${medal}.png`" :alt="medal" class="medal-icon" />
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: lessonProgress + '%' }"></div>
    </div>

    <div class="progress-info">
      <span>{{ lessonProgress }}% завершено</span>
      <p class="estimated-time">⏱ ~{{ estimatedDuration }} мин</p>
    </div>

    <button class="continue-btn" @click="goToLesson">
      ▶️ Продолжить
    </button>

    <!-- 🗑 Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <p>❗ Вы уверены, что хотите удалить это?</p>
        <p>Это также удалит ваш прогресс.</p>
        <div class="modal-actions">
          <button class="confirm-btn" @click="confirmDelete">Удалить</button>
          <button class="cancel-btn" @click="showDeleteModal = false">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { auth } from '@/firebase';

export default {
  name: 'StudyCard',
  props: {
    topic: { type: Object, required: true },
    progress: { type: Object, default: () => ({ percent: 0, medal: 'none' }) },
    lessons: { type: Array, default: () => [] }
  },
  data() {
    return {
      showDeleteModal: false,
      lessonExists: false
    };
  },
  computed: {
    displayName() {
      return this.topic.name?.en || this.topic.name || this.topic.topic || 'Без названия';
    },
    lessonProgress() {
      const val = parseFloat(this.progress.percent);
      return isNaN(val) ? 0 : Math.round(val);
    },
    medal() {
      return this.progress.medal || '';
    },
    estimatedDuration() {
      const wordSource = ['explanation', 'content', 'examples']
        .map(k => this.topic[k]?.en || this.topic[k] || '')
        .join(' ');
      const wordCount = wordSource.trim().split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 50);
      const exerciseTime = Math.ceil((this.topic.exercises?.length || 0) * 1.5);
      return readTime + exerciseTime;
    }
  },
  async mounted() {
    await this.checkLessonExists();
  },
  methods: {
    async checkLessonExists() {
      try {
        const subject = this.topic.subject;
        const topicName = this.displayName;
        if (!subject || !topicName || !auth.currentUser) return;

        const token = await auth.currentUser.getIdToken();
        const url = `${import.meta.env.VITE_API_BASE_URL}/lessons/by-name?subject=${encodeURIComponent(subject)}&name=${encodeURIComponent(topicName)}`;
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.lessonExists = !!(data && data._id);
      } catch (err) {
        console.warn('❌ Урок не найден или ошибка запроса:', err.message);
        this.lessonExists = false;
      }
    },

    async goToLesson() {
      try {
        const subject = this.topic.subject;
        const topicName = this.displayName;
        if (!subject || !topicName || !auth.currentUser) {
          alert('❌ Не удалось открыть урок. Данные темы отсутствуют.');
          return;
        }

        const token = await auth.currentUser.getIdToken();
        const url = `${import.meta.env.VITE_API_BASE_URL}/lessons/by-name?subject=${encodeURIComponent(subject)}&name=${encodeURIComponent(topicName)}`;
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!data?._id) throw new Error('Урок не найден');
        this.$router.push({ name: 'LessonPage', params: { id: data._id } });
      } catch (err) {
        console.error('❌ Ошибка перехода:', err);
        alert('❌ Не удалось открыть урок.');
      }
    },

    async confirmDelete() {
      try {
        if (!auth.currentUser) {
          alert('Пожалуйста, войдите в аккаунт.');
          return;
        }

        const token = await auth.currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const url = `${import.meta.env.VITE_API_BASE_URL}/users/${this.topic.userId || localStorage.getItem('firebaseUserId')}/study-list/${this.topic._id}`;
        await axios.delete(url, { headers });

        this.lessonExists = false;
        this.$emit('deleted', this.topic._id);
      } catch (err) {
        console.error('❌ Ошибка удаления:', err);
        alert('❌ Не удалось удалить курс.');
      }
    }
  }
};
</script>


<style scoped>
.study-card {
  position: relative;
  background: linear-gradient(to right, #f9fafb, #f3f4f6);
  padding: 24px;
  border-radius: 18px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 280px;
  justify-content: space-between;
  transition: transform 0.3s, box-shadow 0.3s;
}
.study-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 24px rgba(147, 51, 234, 0.2);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.topic-name {
  font-size: 1.3rem;
  font-weight: 800;
  color: #7c3aed;
}
.medal-icon {
  width: 36px;
  height: 36px;
}
.progress-bar {
  background: #e5e7eb;
  height: 10px;
  border-radius: 8px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  transition: width 0.3s ease;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  font-weight: 600;
  color: #4b5563;
}
.estimated-time {
  font-style: italic;
  font-weight: 500;
  color: #6b7280;
}
.continue-btn {
  align-self: center;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(to right, #4f46e5, #8b5cf6);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.continue-btn:hover {
  background: linear-gradient(to right, #4338ca, #7c3aed);
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 14px;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease;
}
.close-btn:hover {
  color: #ef4444;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.modal-content {
  background: white;
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
}
.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 16px;
}
.confirm-btn {
  background: #ef4444;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.cancel-btn {
  background: #e5e7eb;
  color: #111827;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
