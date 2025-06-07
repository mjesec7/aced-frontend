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
          <span class="level-tag" v-if="topic.level">{{ topic.level }}</span>
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
          <span class="detail-icon">📚</span>
          <span class="detail-text">{{ progress.completedLessons || 0 }} из {{ progress.totalLessons || lessons.length }} уроков</span>
        </div>
      </div>
      
      <div class="detail-row">
        <div class="detail-item">
          <span class="detail-icon">⭐</span>
          <span class="detail-text">{{ progress.stars || 0 }} звезд</span>
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
      <button class="continue-btn" @click="goToLesson">
        <span class="btn-icon">▶️</span>
        <span>{{ lessonProgress > 0 ? 'Продолжить' : 'Начать изучение' }}</span>
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
          <p class="warning-text">Это также удалит весь ваш прогресс по этому курсу.</p>
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
      const wordSource = ['explanation', 'content', 'examples']
        .map(k => this.topic[k]?.[this.lang] || this.topic[k]?.en || this.topic[k] || '')
        .join(' ');
      const wordCount = wordSource.trim().split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 50);
      const exerciseTime = Math.ceil((this.topic.exercises?.length || 0) * 1.5);
      return Math.max(readTime + exerciseTime, 5);
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
        case 'free': return 'Бесплатно';
        case 'premium': return 'Премиум';
        case 'pro': return 'Pro';
        default: return 'Бесплатно';
      }
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
   🎴 STUDY CARD - CLEAN THEME
======================================== */
.study-card {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  min-height: 280px;
  padding: 24px;
  gap: 20px;
  overflow: hidden;
}

.study-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: #8b5cf6;
}

/* Topic type specific styles */
.topic-free {
  border-left: 4px solid #1a1a1a;
}

.topic-premium {
  border-left: 4px solid #8b5cf6;
}

.topic-pro {
  border-left: 4px solid #6b7280;
}

/* ========================================
   🏷️ TOPIC TYPE BADGE
======================================== */
.topic-type-badge {
  position: absolute;
  top: 16px;
  right: 50px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  font-size: 0.9rem;
}

.badge-text {
  font-size: 0.7rem;
}

/* ========================================
   🎯 CLOSE BUTTON
======================================== */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ffffff;
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
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  transform: scale(1.15);
}

/* ========================================
   📋 CARD HEADER
======================================== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-top: 20px;
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
  color: #1a1a1a;
  border: 1px solid #e5e7eb;
}

.level-tag {
  background: #8b5cf6;
  color: #ffffff;
}

/* ========================================
   📊 PROGRESS SECTION
======================================== */
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
  color: #1a1a1a;
}

.points-earned {
  font-size: 0.8rem;
  font-weight: 500;
  color: #8b5cf6;
  background: #f3f0ff;
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid #8b5cf6;
}

.progress-bar {
  background: #f3f4f6;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.progress-fill {
  height: 100%;
  background: #8b5cf6;
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* ========================================
   📝 CARD DETAILS
======================================== */
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

/* ========================================
   🔘 CARD ACTIONS
======================================== */
.card-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.continue-btn,
.overview-btn {
  padding: 12px 16px;
  font-size: 0.85rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  border: 2px solid transparent;
}

.continue-btn {
  background: #1a1a1a;
  color: #ffffff;
  border-color: #1a1a1a;
  flex: 2;
}

.continue-btn:hover {
  background: #8b5cf6;
  border-color: #8b5cf6;
  transform: translateY(-2px);
}

.overview-btn {
  background: #ffffff;
  color: #1a1a1a;
  border-color: #e5e7eb;
  flex: 1;
}

.overview-btn:hover {
  background: #f9fafb;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 0.8rem;
}

/* ========================================
   🔔 MODAL STYLES
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 420px;
  width: 90%;
  max-height: 90vh;
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
  font-size: 3rem;
  margin-bottom: 20px;
}

.modal-content h4 {
  color: #1a1a1a;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.modal-content p {
  color: #6b7280;
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
  background: #ef4444;
  color: #ffffff;
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  min-width: 120px;
}

.confirm-btn:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

.cancel-btn {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  padding: 12px 28px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  min-width: 120px;
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
  
  .close-btn {
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    font-size: 13px;
  }
  
  .topic-type-badge {
    top: 10px;
    right: 45px;
    padding: 4px 8px;
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
  
  .topic-type-badge {
    top: 8px;
    right: 40px;
    padding: 3px 6px;
  }
  
  .badge-text {
    font-size: 0.6rem;
  }
}
</style>