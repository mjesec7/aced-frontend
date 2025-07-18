<template>
  <div class="study-card" :class="getTopicTypeClass(topic)">
    <button class="close-btn" @click="showDeleteModal = true" title="Удалить курс">×</button>

    <!-- Topic Type Badge -->
    <div class="topic-type-badge" :class="getTopicType(topic)">
      <span class="badge-icon">{{ getTopicTypeIcon(topic) }}</span>
      <span class="badge-text">{{ getTopicTypeLabel(topic) }}</span>
    </div>

    <div class="card-header">
      <div class="topic-info">
        <h3 class="topic-name">{{ displayName }}</h3>
        <p class="topic-description" v-if="displayDescription">{{ displayDescription }}</p>
        <div class="topic-meta">
          <span class="subject-tag" v-if="topic.subject">{{ topic.subject }}</span>
          <span class="level-tag" v-if="topic.level">Ур. {{ topic.level }}</span>
          <span class="date-tag" v-if="addedDate">{{ addedDate }}</span>
        </div>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-text">{{ lessonProgress }}%</span>
        <div class="medal-area">
          <span class="medal-badge" v-if="progress.medal && progress.medal !== 'none'">
            {{ getMedalIcon(progress.medal) }}
          </span>
          <span class="stars-display" v-if="progress.stars > 0">
            <span class="stars-icon">⭐</span>
            <span class="stars-count">{{ progress.stars }}</span>
          </span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: lessonProgress + '%' }" :class="getProgressClass()"></div>
      </div>
      <div class="progress-details">
        <span class="lessons-count">
          <span class="icon">📚</span>
          {{ progress.completedLessons || 0 }}/{{ progress.totalLessons || lessons.length || topic.lessonCount || 0 }}
        </span>
        <span class="points" v-if="progress.points">
          <span class="icon">🎯</span>
          {{ progress.points }} очков
        </span>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-item">
        <span class="stat-icon">📚</span>
        <div class="stat-content">
          <span class="stat-value">{{ totalLessons }}</span>
          <span class="stat-label">уроков</span>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-icon">⏱</span>
        <div class="stat-content">
          <span class="stat-value">{{ estimatedDuration }}</span>
          <span class="stat-label">мин</span>
        </div>
      </div>
      <div class="stat-item" v-if="progress.stars || lessonProgress > 0">
        <span class="stat-icon">🏆</span>
        <div class="stat-content">
          <span class="stat-value">{{ Math.round(lessonProgress) }}%</span>
          <span class="stat-label">готово</span>
        </div>
      </div>
    </div>
    
    <div class="recent-activity" v-if="lastActivity">
      <span class="activity-icon">🕒</span>
      <span class="activity-text">Последний раз: {{ lastActivity }}</span>
    </div>

    <div class="card-actions">
      <!-- Enhanced buttons with better status indication -->
      <button 
        v-if="hasLessons" 
        class="continue-btn" 
        @click="goToLesson" 
        :class="getContinueButtonClass()"
        :title="getContinueButtonTitle()"
      >
        <span class="btn-icon">{{ getContinueIcon() }}</span>
        <span class="btn-text">{{ getContinueText() }}</span>
      </button>
      <button v-else class="continue-btn btn-disabled" disabled title="Уроки скоро появятся">
        <span class="btn-icon">⏳</span>
        <span class="btn-text">Скоро</span>
      </button>
      
      <button class="overview-btn" @click="goToOverview" title="Посмотреть все уроки курса">
        <span class="btn-icon">📋</span>
        <span class="btn-text">Обзор</span>
      </button>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-icon">🗑️</div>
          <h4>Удалить курс?</h4>
          <p>Вы уверены, что хотите удалить <strong>{{ displayName }}</strong> из вашего списка?</p>
          <p class="warning-text">💡 Ваш прогресс по курсу будет сохранён и останется доступным.</p>
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
import { removeFromStudyList } from '@/api';
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
      lang: localStorage.getItem('lang') || 'en'
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser']),
    
    displayName() {
      // Enhanced name extraction with better fallbacks
      const name = this.topic.name || 
                   this.topic.topic || 
                   this.topic.topicName || 
                   this.topic.title ||
                   this.topic.lessonName;
      
      return name || 'Курс без названия';
    },
    
    displayDescription() {
      const desc = this.topic.description || 
                   this.topic.topicDescription ||
                   this.topic.summary;
      
      if (desc && desc.length > 100) {
        return desc.substring(0, 100) + '...';
      }
      return desc || '';
    },
    
    addedDate() {
      const date = this.topic.addedAt || 
                   this.topic.studyListEntry?.addedAt || 
                   this.topic.createdAt;
      
      if (date) {
        const dateObj = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Вчера';
        if (diffDays < 7) return `${diffDays} дней назад`;
        return dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      }
      return null;
    },
    
    hasLessons() {
      return Array.isArray(this.lessons) && this.lessons.length > 0;
    },
    
    totalLessons() {
      return this.progress.totalLessons || 
             this.lessons.length || 
             this.topic.lessonCount || 
             this.topic.lessons?.length || 
             0;
    },
    
    lessonProgress() {
      const val = parseFloat(this.progress.percent);
      return isNaN(val) ? 0 : Math.round(val);
    },
    
    estimatedDuration() {
      const lessonCount = this.totalLessons;
      const timePerLesson = 8; // minutes
      return Math.max(lessonCount * timePerLesson, 10);
    },
    
    lastActivity() {
      // Enhanced last activity calculation
      if (this.progress.updatedAt) {
        const lastUpdate = new Date(this.progress.updatedAt);
        const now = new Date();
        const diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'сегодня';
        if (diffDays === 1) return 'вчера';
        if (diffDays < 7) return `${diffDays} дней назад`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} недель назад`;
        return `более месяца назад`;
      }
      
      if (this.lessonProgress > 0) {
        return 'давно';
      }
      
      return null;
    }
  },
  
  methods: {
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
      if (progress === 100) return 'Завершён';
      if (progress > 0) return 'Продолжить';
      return 'Начать';
    },
    
    getContinueButtonTitle() {
      const progress = this.lessonProgress;
      if (progress === 100) return 'Курс завершён! Можете пересмотреть материалы';
      if (progress > 0) return `Продолжить изучение (${progress}% завершено)`;
      return 'Начать изучение курса';
    },

    goToLesson() {
      if (!this.hasLessons) {
        this.$nextTick(() => {
          alert('❌ Уроки для этого курса ещё готовятся. Попробуйте позже!');
        });
        return;
      }
      
      try {
        // Find the first available lesson
        const availableLesson = this.lessons.find(
          l => l && l._id && (l.type !== 'premium' || this.isPremiumUser)
        );
        
        if (!availableLesson) {
          throw new Error('Нет доступных уроков для вашего тарифного плана.');
        }
        
        this.$router.push({ 
          name: 'LessonPage', 
          params: { id: availableLesson._id } 
        });
      } catch (err) {
        console.error('❌ Ошибка перехода к уроку:', err);
        this.$nextTick(() => {
          alert('❌ Не удалось открыть урок: ' + err.message);
        });
      }
    },

    goToOverview() {
      const topicId = this.topic._id || this.topic.topicId || this.topic.id;
      if (!topicId) {
        console.error('❌ No topic ID available for overview');
        this.$nextTick(() => {
          alert('❌ Не удалось открыть обзор курса');
        });
        return;
      }
      
      this.$router.push({ 
        path: `/topic/${topicId}/overview` 
      });
    },

    async confirmDelete() {
      try {
        if (!auth.currentUser) {
          this.$nextTick(() => {
            alert('❌ Пожалуйста, войдите в аккаунт для удаления курса.');
          });
          return;
        }

        const userId = localStorage.getItem('firebaseUserId') || 
                      this.$store.state.firebaseUserId;
        const topicId = this.topic._id || this.topic.topicId;
        
        if (!userId || !topicId) {
          this.$nextTick(() => {
            alert('❌ Ошибка: не найдены данные для удаления курса');
          });
          return;
        }

        console.log('🗑️ Deleting topic from study list:', { userId, topicId });

        const result = await removeFromStudyList(userId, topicId);
        
        if (result.success !== false) {
          this.showDeleteModal = false;
          this.$emit('deleted', topicId);
          
          this.$nextTick(() => {
            alert('✅ Курс успешно удалён из вашего списка!');
          });
        } else {
          throw new Error(result.error || 'Не удалось удалить курс');
        }
        
      } catch (err) {
        console.error('❌ Ошибка удаления курса:', err);
        this.$nextTick(() => {
          alert('❌ Не удалось удалить курс: ' + (err.message || 'Неизвестная ошибка'));
        });
      }
    }
  }
};
</script>

<style scoped>
/* StudyCard.vue - Professional Styles (No Green Heart) */

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

.topic-free {
  border-left: 3px solid #6b7280;
}

.topic-premium {
  border-left: 3px solid #8b5cf6;
}

.topic-pro {
  border-left: 3px solid #1a1a1a;
}

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
  background: #f8fafc;
  color: #475569;
  border: 1px solid #cbd5e1;
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
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.level-tag {
  background: #8b5cf6;
  color: #ffffff;
}

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

.btn-disabled {
  background: #f3f4f6 !important;
  color: #9ca3af !important;
  border-color: #e5e7eb !important;
  cursor: not-allowed !important;
}

.btn-disabled:hover {
  transform: none !important;
  background: #f3f4f6 !important;
}

.btn-icon {
  font-size: 0.8rem;
}

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
</style>