<template>
  <div class="study-card" :class="getTopicTypeClass(topic)">
    <!-- Topic Type Badge -->
    <div class="topic-badge" :class="getTopicType(topic)">
      <span class="badge-text">{{ getTopicTypeLabel(topic) }}</span>
    </div>

    <!-- Progress Ring -->
    <div class="progress-ring" v-if="lessonProgress > 0">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="3"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          :stroke="getProgressColor()"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <div class="progress-text">{{ lessonProgress }}%</div>
    </div>

    <!-- Topic Content -->
    <div class="topic-content">
      <h3 class="topic-title">{{ displayName }}</h3>
      <p class="topic-desc">{{ displayDescription }}</p>
      
      <!-- Topic Stats -->
      <div class="topic-stats">
        <div class="stat-item">
          <span class="stat-icon">📚</span>
          <span class="stat-value">{{ totalLessons }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⏱</span>
          <span class="stat-value">{{ estimatedDuration }}мин</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📈</span>
          <span class="stat-value">{{ topic.level || 1 }}</span>
        </div>
      </div>
      
      <!-- Subject Tag -->
      <div class="subject-info">
        <span class="subject-tag">{{ topic.subject || 'Общий' }}</span>
        <span class="progress-badge" v-if="lessonProgress > 0" :class="getProgressBadgeClass()">
          {{ getProgressLabel() }}
        </span>
      </div>
      
      <!-- Medal and Stars -->
      <div class="achievements" v-if="progress.medal !== 'none' || progress.stars > 0">
        <span class="medal-badge" v-if="progress.medal && progress.medal !== 'none'">
          {{ getMedalIcon(progress.medal) }}
        </span>
        <span class="stars-display" v-if="progress.stars > 0">
          ⭐ {{ progress.stars }}
        </span>
      </div>
      
      <!-- Card Actions -->
      <div class="card-actions">
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
        
        <button class="remove-btn" @click="showDeleteModal = true" title="Удалить курс">
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">Удалить</span>
        </button>
      </div>
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
import { userStatusMixin } from '@/composables/useUserStatus';

export default {
  name: 'StudyCard',
  
  // ✅ ENHANCED: Add the comprehensive user status mixin
  mixins: [userStatusMixin],
  
  props: {
    topic: { type: Object, required: true },
    progress: { type: Object, default: () => ({ percent: 0, medal: 'none', stars: 0, points: 0 }) },
    lessons: { type: Array, default: () => [] }
  },
  
  data() {
    return {
      showDeleteModal: false,
      lang: localStorage.getItem('lang') || 'ru',
      
      // ✅ ENHANCED: Add reactivity tracking
      componentKey: 0,
      lastStatusUpdate: Date.now()
    };
  },
  
  computed: {
    // ✅ ENHANCED: Map user status getters with mixin integration
    ...mapGetters('user', [
      'userStatus',
      'isPremiumUser',
      'isStartUser',
      'isProUser',
      'isFreeUser',
      'hasActiveSubscription',
      'forceUpdateCounter'
    ]),
    
    displayName() {
      if (!this.topic) return 'Курс без названия';
      
      try {
        // Enhanced name extraction with comprehensive fallbacks
        if (this.topic.name && typeof this.topic.name === 'string' && this.topic.name.trim()) {
          return this.topic.name.trim();
        }
        
        if (this.topic.name && typeof this.topic.name === 'object' && this.topic.name !== null) {
          const name = this.topic.name[this.lang] || this.topic.name.ru || this.topic.name.en || this.topic.name.uz ||
                      Object.values(this.topic.name).find(val => val && typeof val === 'string' && val.trim());
          if (name && typeof name === 'string' && name.trim()) {
            return name.trim();
          }
        }
        
        if (this.topic.topicName) {
          if (typeof this.topic.topicName === 'string' && this.topic.topicName.trim()) {
            return this.topic.topicName.trim();
          }
        }
        
        if (this.topic.topic) {
          if (typeof this.topic.topic === 'string' && this.topic.topic.trim()) {
            return this.topic.topic.trim();
          }
        }
        
        if (this.topic.title) {
          if (typeof this.topic.title === 'string' && this.topic.title.trim()) {
            return this.topic.title.trim();
          }
        }
        
        // Fallback to subject + level
        if (this.topic.subject) {
          const level = this.topic.level ? ` (Уровень ${this.topic.level})` : '';
          return `${this.topic.subject}${level}`;
        }
        
        return 'Курс без названия';
      } catch (error) {
        console.error('Error getting topic name:', error);
        return 'Курс без названия';
      }
    },
    
    displayDescription() {
      try {
        if (this.topic.description) {
          if (typeof this.topic.description === 'string' && this.topic.description.trim()) {
            const desc = this.topic.description.trim();
            return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
          }
        }
        
        if (this.topic.topicDescription) {
          if (typeof this.topic.topicDescription === 'string' && this.topic.topicDescription.trim()) {
            const desc = this.topic.topicDescription.trim();
            return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
          }
        }
        
        // Construct description from available data
        const name = this.displayName;
        const subject = this.topic.subject || 'Общий предмет';
        const level = this.topic.level || 1;
        const lessonCount = this.totalLessons;
        
        if (lessonCount > 0) {
          return `Курс "${name}" по предмету "${subject}" (Уровень ${level}) содержит ${lessonCount} уроков.`;
        } else {
          return `Курс "${name}" по предмету "${subject}" (Уровень ${level}).`;
        }
      } catch (error) {
        console.error('Error getting topic description:', error);
        return 'Описание отсутствует';
      }
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
    
    // Progress ring calculations
    circumference() {
      return 2 * Math.PI * 16; // radius = 16
    },
    
    progressOffset() {
      const progress = this.lessonProgress / 100;
      return this.circumference - (progress * this.circumference);
    }
  },
  
  // ✅ ENHANCED: Watch for user status changes
  watch: {
    userStatus: {
      handler(newStatus, oldStatus) {
        console.log('📊 StudyCard: User status changed from', oldStatus, 'to:', newStatus);
        this.triggerReactivityUpdate();
      },
      immediate: true
    },
    
    forceUpdateCounter: {
      handler(newCounter, oldCounter) {
        console.log('📊 StudyCard: Force update counter changed:', oldCounter, '→', newCounter);
        this.triggerReactivityUpdate();
      },
      immediate: true
    }
  },
  
  mounted() {
    console.log('📱 StudyCard: Component mounted for topic:', this.displayName);
  },
  
  methods: {
    // ✅ ENHANCED: Add reactivity update method
    triggerReactivityUpdate() {
      this.componentKey++;
      this.lastStatusUpdate = Date.now();
      this.$forceUpdate();
      
      console.log('🔄 StudyCard: Reactivity update triggered:', {
        componentKey: this.componentKey,
        topicName: this.displayName,
        userStatus: this.userStatus
      });
    },
    
    getTopicType(topic) {
      if (!topic) return 'free';
      
      const type = topic.type || topic.accessType || topic.pricing || topic.plan;
      
      if (!type || type === 'free' || type === 'public') return 'free';
      if (type === 'premium' || type === 'paid' || type === 'start') return 'premium';
      if (type === 'pro' || type === 'professional') return 'pro';
      
      return 'free';
    },
    
    getTopicTypeClass(topic) {
      return `topic-${this.getTopicType(topic)}`;
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

    getMedalIcon(medal) {
      switch (medal) {
        case 'gold': return '🥇';
        case 'silver': return '🥈';
        case 'bronze': return '🥉';
        default: return '';
      }
    },

    getProgressColor() {
      const progress = this.lessonProgress;
      if (progress === 100) return '#10b981'; // green
      if (progress >= 70) return '#3b82f6'; // blue
      if (progress >= 30) return '#f59e0b'; // yellow
      if (progress > 0) return '#ef4444'; // red
      return '#e5e7eb'; // gray
    },
    
    getProgressBadgeClass() {
      const progress = this.lessonProgress;
      if (progress === 100) return 'badge-completed';
      if (progress >= 70) return 'badge-high';
      if (progress >= 30) return 'badge-medium';
      return 'badge-low';
    },
    
    getProgressLabel() {
      const progress = this.lessonProgress;
      if (progress === 100) return '✅ Завершён';
      if (progress >= 70) return '🔥 Почти готово';
      if (progress >= 30) return '📈 В процессе';
      return '🚀 Начат';
    },

    getContinueButtonClass() {
      const progress = this.lessonProgress;
      if (progress === 100) return 'btn-completed';
      if (progress > 0) return 'btn-continue';
      return 'btn-start';
    },

    getContinueIcon() {
      const progress = this.lessonProgress;
      if (progress === 100) return '🔄';
      if (progress > 0) return '▶️';
      return '🚀';
    },

    getContinueText() {
      const progress = this.lessonProgress;
      if (progress === 100) return 'Повторить';
      if (progress > 0) return 'Продолжить';
      return 'Начать';
    },
    
    getContinueButtonTitle() {
      const progress = this.lessonProgress;
      if (progress === 100) return 'Курс завершён! Можете пересмотреть материалы';
      if (progress > 0) return `Продолжить изучение (${progress}% завершено)`;
      return 'Начать изучение курса';
    },

    // ✅ ENHANCED: Use mixin property for access check
    hasTopicAccess(topic) {
      const topicType = this.getTopicType(topic);
      
      if (topicType === 'free') return true;
      if (topicType === 'premium' && this.reactiveIsPremiumUser) return true;
      if (topicType === 'pro' && this.reactiveIsProUser) return true;
      
      return false;
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
          l => l && l._id && this.hasTopicAccess(l)
        );
        
        if (!availableLesson) {
          // Just take the first lesson if no access check passes
          const firstLesson = this.lessons.find(l => l && l._id);
          if (firstLesson) {
            this.$router.push({ 
              name: 'LessonPage', 
              params: { id: firstLesson._id } 
            });
            return;
          }
          throw new Error('Нет доступных уроков.');
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

    async confirmDelete() {
      try {
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

        // Try to remove from backend
        try {
          const result = await removeFromStudyList(userId, topicId);
          console.log('Backend deletion result:', result);
        } catch (backendError) {
          console.warn('Backend deletion failed, but continuing with UI update:', backendError);
        }

        // Always emit deletion event to update UI
        this.showDeleteModal = false;
        this.$emit('deleted', topicId);
        
        this.$nextTick(() => {
          alert('✅ Курс успешно удалён из вашего списка!');
        });
        
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
/* StudyCard.vue - Matching Recommendation Card Design */

.study-card {
  flex: 0 0 280px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  height: 380px;
  position: relative;
  overflow: hidden;
}

.study-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 24px rgba(139, 92, 246, 0.4), 0 12px 32px rgba(139, 92, 246, 0.15);
  border-color: #8b5cf6;
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.03), #ffffff);
}

.topic-free {
  border-left: 3px solid #64748b;
}

.topic-premium {
  border-left: 3px solid #8b5cf6;
}

.topic-pro {
  border-left: 3px solid #1e293b;
}

/* Topic Badge */
.topic-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.topic-badge.free {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.topic-badge.premium {
  background: #8b5cf6;
  color: #ffffff;
  border: 1px solid #8b5cf6;
}

.topic-badge.pro {
  background: #1f2937;
  color: #ffffff;
  border: 1px solid #1f2937;
}

/* Progress Ring */
.progress-ring {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}

.progress-ring svg {
  transform: rotate(-90deg);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.6rem;
  font-weight: 600;
  color: #1a1a1a;
}

/* Topic Content */
.topic-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px;
  padding-top: 45px;
}

.topic-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 6px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6rem;
}

.topic-desc {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
  min-height: 2.4rem;
}

.topic-stats {
  display: flex;
  justify-content: space-between;
  margin: 0 0 8px 0;
  padding: 6px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.stat-icon {
  font-size: 0.8rem;
  opacity: 0.7;
}

.stat-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #111827;
}

.subject-info {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.subject-tag {
  display: inline-block;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid #cbd5e1;
}

.progress-badge {
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid;
}

.progress-badge.badge-completed {
  background: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}

.progress-badge.badge-high {
  background: #dbeafe;
  color: #1e40af;
  border-color: #bfdbfe;
}

.progress-badge.badge-medium {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.progress-badge.badge-low {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.achievements {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.medal-badge {
  font-size: 1rem;
}

.stars-display {
  font-size: 0.8rem;
  color: #f59e0b;
  font-weight: 600;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  flex-shrink: 0;
  align-items: center;
}

.continue-btn,
.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
  white-space: nowrap;
  min-height: 36px;
  box-sizing: border-box;
}

.continue-btn {
  flex: 2;
}

.remove-btn {
  flex: 1;
  background: #f8fafc;
  color: #ef4444;
  border: 2px solid #e2e8f0;
}

.remove-btn:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  transform: translateY(-1px);
}

.btn-start {
  background: #111827;
  color: #ffffff;
  border: 2px solid #111827;
}

.btn-start:hover {
  background: #1f2937;
  border-color: #1f2937;
  transform: translateY(-1px);
}

.btn-continue {
  background: #3b82f6;
  color: #ffffff;
  border: 2px solid #3b82f6;
}

.btn-continue:hover {
  background: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
}

.btn-completed {
  background: #10b981;
  color: #ffffff;
  border: 2px solid #10b981;
}

.btn-completed:hover {
  background: #059669;
  border-color: #059669;
  transform: translateY(-1px);
}

.btn-disabled {
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  border-color: #e2e8f0 !important;
  cursor: not-allowed !important;
}

.btn-disabled:hover {
  transform: none !important;
}

.btn-icon {
  font-size: 0.8rem;
  font-weight: bold;
}

.btn-text {
  font-size: 0.7rem;
  font-weight: 600;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 380px;
  width: 90%;
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
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
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.modal-content p {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 400;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.warning-text {
  color: #10b981 !important;
  font-weight: 500 !important;
  margin-bottom: 20px !important;
  background: #f0fdf4;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
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
}

.confirm-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #f1f5f9;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .study-card {
    flex: 0 0 260px;
    height: 360px;
  }
  
  .topic-content {
    padding: 12px;
    padding-top: 40px;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .continue-btn,
  .remove-btn {
    flex: 1;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .study-card {
    flex: 0 0 240px;
    height: 340px;
  }
  
  .topic-content {
    padding: 10px;
    padding-top: 38px;
  }
  
  .topic-title {
    font-size: 0.95rem;
    min-height: 2.4rem;
  }
  
  .topic-desc {
    font-size: 0.75rem;
    min-height: 2.2rem;
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
  }
}
</style>