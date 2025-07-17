<template>
  <div v-if="lessonExists" class="study-card" :class="getTopicTypeClass(topic)">
    <button class="close-btn" @click="showDeleteModal = true">✕</button>

    <!-- Topic Type Badge -->
    <div class="topic-type-badge" :class="getTopicType(topic)">
      <span class="badge-icon">{{ getTopicTypeIcon(topic) }}</span>
      <span class="badge-text">{{ getTopicTypeLabel(topic) }}</span>
    </div>

    <div class="card-header">
      <div class="topic-info">
        <h3 class="topic-name">{{ displayName }}</h3>
        <div class="topic-meta">
          <span class="subject-tag" v-if="topic.subject">{{ topic.subject }}</span>
          <span class="level-tag" v-if="topic.level">Ур. {{ topic.level }}</span>
        </div>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-text">{{ lessonProgress }}%</span>
        <span class="medal-badge" v-if="progress.medal && progress.medal !== 'none'">
          {{ getMedalIcon(progress.medal) }}
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: lessonProgress + '%' }" :class="getProgressClass()"></div>
      </div>
      <div class="progress-details">
        <span class="lessons-count">{{ progress.completedLessons || 0 }}/{{ progress.totalLessons || lessons.length }}</span>
        <span class="points" v-if="progress.points">+{{ progress.points }}⭐</span>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-item">
        <span class="stat-icon">📚</span>
        <span class="stat-text">{{ progress.totalLessons || lessons.length }} уроков</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">⏱</span>
        <span class="stat-text">~{{ estimatedDuration }} мин</span>
      </div>
      <div class="stat-item" v-if="progress.stars">
        <span class="stat-icon">⭐</span>
        <span class="stat-text">{{ progress.stars }} звезд</span>
      </div>
    </div>
    
    <div class="recent-activity" v-if="lastActivity">
      <span class="activity-icon">🕒</span>
      <span class="activity-text">{{ lastActivity }}</span>
    </div>

    <div class="card-actions">
      <button class="continue-btn" @click="goToLesson" :class="getContinueButtonClass()">
        <span class="btn-icon">{{ getContinueIcon() }}</span>
        <span>{{ getContinueText() }}</span>
      </button>
      <button class="overview-btn" @click="goToOverview">
        <span class="btn-icon">📋</span>
        <span>Обзор</span>
      </button>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-icon">🗑️</div>
          <h4>Удалить курс?</h4>
          <p>Вы уверены, что хотите удалить <strong>{{ displayName }}</strong>?</p>
          <p class="warning-text">Прогресс по курсу будет сохранён.</p>
          <div class="modal-actions">
            <button class="confirm-btn" @click="confirmDelete">Удалить</button>
            <button class="cancel-btn" @click="showDeleteModal = false">Отмена</button>
          </div>
        </div>
      </div>
    </Teleport>
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
    progress: { type: Object, default: () => ({ percent: 0 }) },
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
    estimatedDuration() {
      const lessonCount = this.progress.totalLessons || this.lessons.length || 0;
      return Math.max(lessonCount * 8, 10); // 8 min per lesson estimate
    },
    lastActivity() {
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
    // ✅ Topic type detection methods (same as MainPage)
    getTopicType(topic) {
      const type = topic.type || topic.accessType || topic.pricing || topic.plan;
      
      if (!type || type === 'free' || type === 'public') return 'free';
      if (type === 'premium' || type === 'paid' || type === 'start') return 'premium';
      if (type === 'pro' || type === 'professional') return 'pro';
      
      return 'free';
    },
    
    getTopicTypeClass(topic) {
      return `topic-${this.getTopicType(topic)}`;
    },
    
    getTopicTypeIcon(topic) {
      const type = this.getTopicType(topic);
      switch (type) {
        case 'free': return '💚';
        case 'premium': return '💎';
        case 'pro': return '🌟';
        default: return '💚';
      }
    },
    
    getTopicTypeLabel(topic) {
      const type = this.getTopicType(topic);
      switch (type) {
        case 'free': return 'Free';
        case 'premium': return 'Start';
        case 'pro': return 'Pro';
        default: return 'Free';
      }
    },

    // ✅ Progress and medal helpers
    getMedalIcon(medal) {
      switch (medal) {
        case 'gold': return '🥇';
        case 'silver': return '🥈';
        case 'bronze': return '🥉';
        default: return '';
      }
    },

    getProgressClass() {
      const progress = this.lessonProgress;
      if (progress === 100) return 'progress-completed';
      if (progress >= 70) return 'progress-high';
      if (progress >= 30) return 'progress-medium';
      if (progress > 0) return 'progress-low';
      return 'progress-none';
    },

    getContinueButtonClass() {
      const progress = this.lessonProgress;
      if (progress === 100) return 'btn-completed';
      if (progress > 0) return 'btn-continue';
      return 'btn-start';
    },

    getContinueIcon() {
      const progress = this.lessonProgress;
      if (progress === 100) return '✅';
      if (progress > 0) return '▶️';
      return '🚀';
    },

    getContinueText() {
      const progress = this.lessonProgress;
      if (progress === 100) return 'Завершен';
      if (progress > 0) return 'Продолжить';
      return 'Начать';
    },

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
        this.showDeleteModal = false;
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
/* ========================================
   🎴 COMPACT STUDY CARD DESIGN
======================================== */
.study-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  min-height: 220px;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

.study-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #8b5cf6;
}

/* Topic type specific styles */
.topic-free {
  border-left: 3px solid #1a1a1a;
}

.topic-premium {
  border-left: 3px solid #8b5cf6;
}

.topic-pro {
  border-left: 3px solid #6b7280;
}

/* ========================================
   🏷️ COMPACT TOPIC TYPE BADGE
======================================== */
.topic-type-badge {
  position: absolute;
  top: 12px;
  right: 40px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  z-index: 2;
}

.topic-type-badge.free {
  background: #f3f4f6;
  color: #1a1a1a;
  border: 1px solid #e5e7eb;
}

.topic-type-badge.premium {
  background: #f3f0ff;
  color: #8b5cf6;
  border: 1px solid #8b5cf6;
}

.topic-type-badge.pro {
  background: #1a1a1a;
  color: #ffffff;
  border: 1px solid #1a1a1a;
}

.badge-icon {
  font-size: 0.8rem;
}

.badge-text {
  font-size: 0.65rem;
}

/* ========================================
   🎯 COMPACT CLOSE BUTTON
======================================== */
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  transform: scale(1.1);
}

/* ========================================
   📋 COMPACT CARD HEADER
======================================== */
.card-header {
  margin-top: 16px;
}

.topic-info {
  flex: 1;
}

.topic-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
  margin: 0 0 6px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.subject-tag,
.level-tag {
  padding: 3px 6px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: capitalize;
}

.subject-tag {
  background: #f3f4f6;
  color: #1a1a1a;
  border: 1px solid #e5e7eb;
}

.level-tag {
  background: #8b5cf6;
  color: #ffffff;
}

/* ========================================
   📊 COMPACT PROGRESS SECTION
======================================== */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a1a;
}

.medal-badge {
  font-size: 1rem;
}

.progress-bar {
  background: #f3f4f6;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-none { background: #e5e7eb; }
.progress-low { background: #dc2626; }
.progress-medium { background: #d97706; }
.progress-high { background: #1e40af; }
.progress-completed { background: #059669; }

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #6b7280;
}

.lessons-count {
  font-weight: 500;
}

.points {
  color: #8b5cf6;
  font-weight: 600;
}

/* ========================================
   📝 COMPACT CARD STATS
======================================== */
.card-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 1;
  justify-content: center;
}

.stat-icon {
  font-size: 0.8rem;
}

.stat-text {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 500;
}

.recent-activity {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #9ca3af;
  font-style: italic;
  justify-content: center;
}

.activity-icon {
  font-size: 0.75rem;
}

/* ========================================
   🔘 COMPACT CARD ACTIONS
======================================== */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.continue-btn,
.overview-btn {
  padding: 10px 12px;
  font-size: 0.8rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  border: 2px solid transparent;
}

.continue-btn {
  flex: 2;
}

.overview-btn {
  flex: 1;
  background: #ffffff;
  color: #1a1a1a;
  border-color: #e5e7eb;
}

.overview-btn:hover {
  background: #f9fafb;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-1px);
}

/* Continue button variants */
.btn-start {
  background: #1a1a1a;
  color: #ffffff;
  border-color: #1a1a1a;
}

.btn-start:hover {
  background: #8b5cf6;
  border-color: #8b5cf6;
  transform: translateY(-1px);
}

.btn-continue {
  background: #1e40af;
  color: #ffffff;
  border-color: #1e40af;
}

.btn-continue:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-1px);
}

.btn-completed {
  background: #059669;
  color: #ffffff;
  border-color: #059669;
  cursor: default;
}

.btn-completed:hover {
  transform: none;
}

.btn-icon {
  font-size: 0.8rem;
}

/* ========================================
   🔔 COMPACT MODAL STYLES
======================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 380px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
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
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.modal-content h4 {
  color: #1a1a1a;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.modal-content p {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 400;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.warning-text {
  color: #059669 !important;
  font-weight: 500 !important;
  margin-bottom: 20px !important;
  background: #f0fdf4;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.confirm-btn {
  background: #ef4444;
  color: #ffffff;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 100px;
}

.confirm-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 100px;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-1px);
}

/* ========================================
   📱 RESPONSIVE DESIGN
======================================== */
@media (max-width: 768px) {
  .study-card {
    padding: 14px;
    min-height: 200px;
    gap: 10px;
  }
  
  .topic-name {
    font-size: 0.95rem;
  }
  
  .card-header {
    margin-top: 14px;
  }
  
  .card-stats {
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
  }
  
  .stat-item {
    justify-content: flex-start;
    gap: 6px;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .continue-btn,
  .overview-btn {
    flex: 1;
  }
  
  .close-btn {
    top: 6px;
    right: 6px;
    width: 26px;
    height: 26px;
    font-size: 11px;
  }
  
  .topic-type-badge {
    top: 6px;
    right: 36px;
    padding: 3px 6px;
  }
  
  .modal-content {
    padding: 20px;
    margin: 16px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .confirm-btn,
  .cancel-btn {
    width: 100%;
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .study-card {
    padding: 12px;
    min-height: 180px;
  }
  
  .topic-name {
    font-size: 0.9rem;
  }
  
  .card-header {
    margin-top: 12px;
  }
  
  .close-btn {
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
  
  .topic-type-badge {
    top: 4px;
    right: 32px;
    padding: 2px 4px;
  }
  
  .badge-text {
    font-size: 0.6rem;
  }
  
  .progress-bar {
    height: 5px;
  }
  
  .card-stats {
    gap: 4px;
  }
  
  .stat-text {
    font-size: 0.65rem;
  }
  
  .card-actions {
    gap: 4px;
  }
  
  .continue-btn,
  .overview-btn {
    padding: 8px 10px;
    font-size: 0.75rem;
  }
}
</style>