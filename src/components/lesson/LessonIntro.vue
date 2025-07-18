<template>
  <div class="intro-screen">
    <div class="top-buttons">
      <button 
        class="problem-report-btn-intro" 
        @click="$emit('report-problem')"
        title="Сообщить о проблеме с уроком"
      >
        ⚠️
      </button>
      <button class="exit-btn" @click="$emit('exit')">✕</button>
    </div>
    
    <div class="intro-content">
      <h2 class="lesson-title">{{ getLocalized(lesson?.lessonName) || 'Без названия' }}</h2>
      <p class="lesson-description">{{ getLocalized(lesson?.description) || 'Описание недоступно' }}</p>
      
      <div class="lesson-info-grid">
        <div class="info-card">
          <div class="info-icon">⏱️</div>
          <div class="info-text">
            <span class="info-label">Время</span>
            <span class="info-value">~{{ estimatedTime }} мин</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">📝</div>
          <div class="info-text">
            <span class="info-label">Шагов</span>
            <span class="info-value">{{ (steps || []).length }}</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">🎯</div>
          <div class="info-text">
            <span class="info-label">Тип</span>
            <span class="info-value">{{ lesson?.type === 'premium' ? 'Премиум' : 'Бесплатный' }}</span>
          </div>
        </div>
      </div>
      
      <!-- Previous Progress Display -->
      <div v-if="previousProgress && (previousProgress?.completedSteps || []).length > 0" class="previous-progress">
        <h4>📈 Предыдущий прогресс</h4>
        <div class="progress-stats-grid">
          <div class="stat">
            <span class="stat-value">{{ (previousProgress?.completedSteps || []).length }}/{{ (steps || []).length }}</span>
            <span class="stat-label">Прогресс</span>
          </div>
          <div class="stat">
            <span class="stat-value">⭐ {{ previousProgress?.stars || 0 }}</span>
            <span class="stat-label">Звезды</span>
          </div>
          <div class="stat">
            <span class="stat-value">❌ {{ previousProgress?.mistakes || 0 }}</span>
            <span class="stat-label">Ошибки</span>
          </div>
        </div>
        <button @click="$emit('continue')" class="continue-btn">
          📖 Продолжить с места остановки
        </button>
      </div>
      
      <div class="intro-actions">
        <button class="start-btn" @click="$emit('start')">
          {{ previousProgress ? '🔄 Начать заново' : '🚀 Начать урок' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LessonIntro',
  props: {
    lesson: {
      type: Object,
      required: true
    },
    estimatedTime: {
      type: Number,
      default: 10
    },
    steps: {
      type: Array,
      default: () => []
    },
    previousProgress: {
      type: Object,
      default: null
    }
  },
  emits: ['start', 'continue', 'exit', 'report-problem'], // Added report-problem
  methods: {
    getLocalized(field) {
      if (typeof field === 'string') return field;
      return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim();
    }
  }
}
</script>

<style scoped>
.intro-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
  text-align: center;
  position: relative;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* Top buttons container */
.top-buttons {
  position: absolute;
  top: 40px;
  right: 40px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.problem-report-btn-intro {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  position: relative;
  overflow: hidden;
}

.problem-report-btn-intro::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.problem-report-btn-intro:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

.problem-report-btn-intro:hover::before {
  left: 100%;
}

.exit-btn {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  font-size: 1.5rem;
  color: #ef4444;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.exit-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.intro-content {
  max-width: 600px;
  width: 100%;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lesson-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.lesson-description {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0 0 32px 0;
  line-height: 1.6;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.lesson-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.info-card {
  background: white;
  padding: 24px 20px;
  border-radius: 16px;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.info-card:hover::before {
  transform: scaleX(1);
}

.info-icon {
  font-size: 2rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.info-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.info-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.previous-progress {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%);
  padding: 32px;
  border-radius: 20px;
  margin: 32px 0;
  border: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.previous-progress::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.previous-progress h4 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 600;
}

.progress-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.stat:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.stat-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.continue-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

.intro-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.start-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 18px 36px;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
  min-height: 56px;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.start-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.4);
}

.start-btn:hover::before {
  left: 100%;
}

.start-btn:active {
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .intro-screen {
    padding: 20px 16px;
  }

  .top-buttons {
    top: 20px;
    right: 20px;
    gap: 8px;
  }

  .problem-report-btn-intro,
  .exit-btn {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .lesson-title {
    font-size: 2rem;
  }

  .lesson-description {
    font-size: 1rem;
  }

  .lesson-info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .info-card {
    padding: 20px 16px;
  }

  .previous-progress {
    padding: 24px 20px;
  }

  .progress-stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat {
    padding: 12px;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .intro-actions {
    flex-direction: column;
    align-items: center;
  }

  .start-btn {
    width: 100%;
    max-width: 300px;
    font-size: 1.1rem;
    padding: 16px 32px;
  }
}

@media (max-width: 480px) {
  .top-buttons {
    top: 15px;
    right: 15px;
    gap: 6px;
  }

  .problem-report-btn-intro,
  .exit-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
    padding: 8px;
  }

  .lesson-title {
    font-size: 1.5rem;
  }

  .lesson-description {
    font-size: 0.95rem;
  }

  .info-card {
    padding: 16px;
    gap: 12px;
  }

  .info-icon {
    font-size: 1.5rem;
  }

  .previous-progress {
    padding: 20px 16px;
  }

  .progress-stats-grid {
    gap: 8px;
  }

  .stat {
    padding: 10px;
  }

  .stat-value {
    font-size: 1rem;
  }

  .start-btn {
    font-size: 1rem;
    padding: 14px 28px;
  }
}

/* Focus states for accessibility */
.exit-btn:focus,
.start-btn:focus,
.continue-btn:focus,
.problem-report-btn-intro:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .intro-content {
    animation: none;
  }
  
  .info-card:hover,
  .stat:hover,
  .start-btn:hover,
  .continue-btn:hover,
  .problem-report-btn-intro:hover {
    transform: none;
  }

  .start-btn::before,
  .problem-report-btn-intro::before {
    display: none;
  }
}
</style>