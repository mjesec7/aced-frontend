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
  background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 320px;
  justify-content: space-between;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.study-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(147, 51, 234, 0.2);
  background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  min-height: 44px;
}

.topic-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  margin: 0;
  flex: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.medal-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.progress-bar {
  background: rgba(255, 255, 255, 0.1);
  height: 12px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #9333ea 100%);
  border-radius: 10px;
  transition: width 0.5s ease-out;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  font-weight: 600;
  gap: 12px;
}

.progress-info > span {
  color: #e2e8f0;
  font-weight: 700;
}

.estimated-time {
  font-size: 0.9rem;
  font-weight: 500;
  color: #cbd5e1;
  margin: 0;
  font-style: normal;
  display: flex;
  align-items: center;
  gap: 4px;
}

.continue-btn {
  align-self: stretch;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 16px rgba(29, 78, 216, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.continue-btn:hover {
  background: linear-gradient(135deg, #1e40af 0%, #6d28d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(29, 78, 216, 0.4);
}

.continue-btn:active {
  transform: translateY(0);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.8);
  color: #ffffff;
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 32px 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
  max-width: 420px;
  width: 90%;
}

.modal-content p {
  color: #e2e8f0;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.modal-content p:last-of-type {
  color: #cbd5e1;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 24px;
}

.modal-actions {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.confirm-btn {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: #ffffff;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  min-width: 100px;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  min-width: 100px;
  backdrop-filter: blur(4px);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .study-card {
    padding: 24px;
    min-height: 300px;
  }
  
  .topic-name {
    font-size: 1.2rem;
  }
  
  .continue-btn {
    padding: 12px 24px;
    font-size: 0.9rem;
  }
  
  .modal-content {
    padding: 28px 32px;
  }
  
  .modal-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .confirm-btn,
  .cancel-btn {
    width: 100%;
    max-width: 201px;
  }
}
</style>