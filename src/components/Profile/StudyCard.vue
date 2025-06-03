<template>
  <div v-if="lessonExists" class="study-card">
    <button class="close-btn" @click="showDeleteModal = true">✕</button>

    <div class="card-header">
      <div class="topic-info">
        <h3 class="topic-name">{{ displayName }}</h3>
        <div class="topic-meta">
          <span class="subject-tag" v-if="topic.subject">{{ topic.subject }}</span>
          <span class="level-tag" v-if="topic.level">{{ topic.level }}</span>
        </div>
      </div>
      <div class="achievement-section">
        <img v-if="medal !== 'none'" :src="`/assets/medals/${medal}.png`" :alt="medal" class="medal-icon" />
        <div class="stats">
          <div class="stat-item">
            <span class="stat-value">{{ progress.completedLessons || 0 }}</span>
            <span class="stat-label">из {{ progress.totalLessons || lessons.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-text">{{ lessonProgress }}% завершено</span>
        <span class="points-earned" v-if="progress.points">+{{ progress.points }} очков</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: lessonProgress + '%' }"></div>
      </div>
    </div>

    <div class="card-details">
      <div class="detail-row">
        <div class="detail-item">
          <span class="detail-icon">⭐</span>
          <span class="detail-text">{{ progress.stars || 0 }} звезд получено</span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">⏱</span>
          <span class="detail-text">~{{ estimatedDuration }} мин</span>
        </div>
      </div>
      
      <div class="recent-activity" v-if="lastActivity">
        <span class="activity-text">Последний раз: {{ lastActivity }}</span>
      </div>
    </div>

    <div class="card-actions">
      <button class="continue-btn primary" @click="goToLesson">
        <span class="btn-icon">▶️</span>
        <span>{{ lessonProgress > 0 ? 'Продолжить' : 'Начать изучение' }}</span>
      </button>
      <button class="overview-btn secondary" @click="goToOverview">
        <span class="btn-icon">📋</span>
        <span>Обзор</span>
      </button>
    </div>

    <!-- 🗑 Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-icon">🗑️</div>
        <h4>Удалить курс?</h4>
        <p>Вы уверены, что хотите удалить <strong>{{ displayName }}</strong>?</p>
        <p class="warning-text">Это также удалит весь ваш прогресс по этому курсу.</p>
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
      return Math.max(readTime + exerciseTime, 5);
    },
    lastActivity() {
      // Mock data - you can implement real last activity tracking
      if (this.lessonProgress > 0) {
        const days = Math.floor(Math.random() * 7) + 1;
        return days === 1 ? 'вчера' : `${days} дней назад`;
      }
      return null;
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
    goToOverview() {
      this.$router.push({ path: `/topic/${this.topic._id}/overview` });
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
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 280px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.study-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.study-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: #d1d5db;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  /* Add padding-right to ensure space for close button */
  padding-right: 40px;
}

.topic-info {
  flex: 1;
}

.topic-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.topic-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.subject-tag,
.level-tag {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: capitalize;
}

.subject-tag {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.level-tag {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.achievement-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.medal-icon {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  /* Ensure proper image loading */
  object-fit: contain;
  background: transparent;
}

.stats {
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}

.stat-label {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 500;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.points-earned {
  font-size: 0.8rem;
  font-weight: 500;
  color: #059669;
  background: #ecfdf5;
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid #a7f3d0;
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
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.detail-icon {
  font-size: 0.9rem;
}

.detail-text {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.recent-activity {
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.activity-text {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.continue-btn,
.overview-btn {
  padding: 10px 16px;
  font-size: 0.85rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}

.continue-btn.primary {
  background: #1a1a1a;
  color: white;
  flex: 2;
}

.continue-btn.primary:hover {
  background: #333;
  transform: translateY(-1px);
}

.overview-btn.secondary {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
  flex: 1;
}

.overview-btn.secondary:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-icon {
  font-size: 0.8rem;
}

/* FIXED: Better close button positioning and accessibility */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  z-index: 10;
  /* Improved accessibility */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.close-btn:active {
  transform: scale(1.05);
}

/* FIXED: Stable modal without flickering */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  backdrop-filter: blur(8px);
  /* Prevent flickering */
  animation: fadeIn 0.2s ease-out;
  /* Prevent interaction with background */
  pointer-events: all;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

.modal-content {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 420px;
  width: 90%;
  /* Prevent modal from flickering */
  transform: scale(1);
  animation: modalSlideIn 0.3s ease-out;
  /* Ensure modal stays on top */
  position: relative;
  z-index: 100000;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  animation: bounceIn 0.5s ease-out;
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

.modal-content h4 {
  color: #111827;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.modal-content p {
  color: #374151;
  font-size: 1rem;
  font-weight: 400;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.warning-text {
  color: #dc2626 !important;
  font-weight: 600 !important;
  margin-bottom: 28px !important;
  background: #fef2f2;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.confirm-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.confirm-btn:active {
  transform: translateY(0);
}

.cancel-btn {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 12px 28px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  min-width: 120px;
}

.cancel-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cancel-btn:active {
  transform: translateY(0);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .study-card {
    padding: 20px;
    min-height: 260px;
  }
  
  .topic-name {
    font-size: 1.1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    /* Maintain padding for close button on mobile */
    padding-right: 35px;
  }
  
  .achievement-section {
    flex-direction: row;
    align-self: flex-end;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .continue-btn,
  .overview-btn {
    flex: 1;
  }
  
  /* Adjust close button for mobile */
  .close-btn {
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    font-size: 13px;
  }
  
  .modal-content {
    padding: 28px 24px;
    margin: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .confirm-btn,
  .cancel-btn {
    width: 100%;
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .close-btn {
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .card-header {
    padding-right: 32px;
  }
}
</style>