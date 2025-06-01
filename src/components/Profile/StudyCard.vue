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

    <button class="continue-btn" @click="goToLesson">▶️ Продолжить</button>

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
import { mapGetters } from 'vuex';

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
      lessonExists: false,
      lang: localStorage.getItem('lang') || 'en'
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser']),
    displayName() {
      return this.topic.name?.[this.lang] || this.topic.name?.en || this.topic.name || this.topic.topic || 'Без названия';
    },
    lessonProgress() {
      const val = parseFloat(this.progress.percent);
      return isNaN(val) ? 0 : Math.round(val);
    },
    medal() {
      // Enhanced medal logic based on progress percentage and quality
      const percent = this.lessonProgress;
      const stars = this.progress.stars || 0;
      const totalLessons = this.progress.totalLessons || this.lessons.length || 1;
      
      if (percent === 100) {
        const avgStars = totalLessons > 0 ? stars / totalLessons : 0;
        if (avgStars >= 2.7) return 'gold';
        else if (avgStars >= 1.5) return 'silver';
        else return 'bronze';
      } else if (percent >= 80) {
        return 'silver';
      } else if (percent >= 50) {
        return 'bronze';
      }
      return 'none';
    },
    estimatedDuration() {
      const wordSource = ['explanation', 'content', 'examples']
        .map(k => this.topic[k]?.[this.lang] || this.topic[k]?.en || this.topic[k] || '')
        .join(' ');
      const wordCount = wordSource.trim().split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 50);
      const exerciseTime = Math.ceil((this.topic.exercises?.length || 0) * 1.5);
      return Math.max(readTime + exerciseTime, 5); // Minimum 5 minutes
    }
  },
  mounted() {
    this.checkLessonExists();
  },
  methods: {
    checkLessonExists() {
      this.lessonExists = Array.isArray(this.lessons) && this.lessons.length > 0;
    },
    goToLesson() {
      try {
        if (!Array.isArray(this.lessons) || this.lessons.length === 0) {
          alert('❌ Не удалось открыть урок. Данные темы отсутствуют.');
          return;
        }
        const firstLesson = this.lessons.find(
          l => l && l._id && (l.type !== 'premium' || this.isPremiumUser)
        );
        if (!firstLesson) throw new Error('Нет доступа к уроку.');
        this.$router.push({ name: 'LessonPage', params: { id: firstLesson._id } });
      } catch (err) {
        console.error('❌ Ошибка перехода к уроку:', err);
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
        const userId = this.topic.userId || localStorage.getItem('firebaseUserId');
        const url = `${import.meta.env.VITE_API_BASE_URL}/users/${userId}/study-list/${this.topic._id}`;
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
  background: white;
  border: 1px solid #e5e5e5;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 220px;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.study-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  min-height: 32px;
}

.topic-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  margin: 0;
  flex: 1;
}

.medal-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.progress-bar {
  background: #f3f4f6;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e5e5e5;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 500;
  gap: 8px;
}

.progress-info > span {
  color: #374151;
  font-weight: 600;
}

.estimated-time {
  font-size: 0.8rem;
  font-weight: 400;
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.continue-btn {
  align-self: stretch;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.continue-btn:hover {
  background: #333;
  transform: translateY(-1px);
}

.continue-btn:active {
  transform: translateY(0);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
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
  border: 1px solid #e5e5e5;
  padding: 24px 32px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 380px;
  width: 90%;
}

.modal-content p {
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.modal-content p:last-of-type {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 400;
  margin-bottom: 20px;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.confirm-btn {
  background: #ef4444;
  color: white;
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  min-width: 80px;
}

.confirm-btn:hover {
  background: #dc2626;
}

.cancel-btn {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  min-width: 80px;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .study-card {
    padding: 16px;
    min-height: 200px;
  }
  
  .topic-name {
    font-size: 1rem;
  }
  
  .continue-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
  
  .modal-content {
    padding: 20px 24px;
  }
  
  .modal-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .confirm-btn,
  .cancel-btn {
    width: 100%;
    max-width: 160px;
  }
}
</style>