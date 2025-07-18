<template>
  <div class="lesson-header">
    <button class="exit-btn-small" @click="$emit('exit')">✕</button>
    <h2 class="lesson-title">{{ getLocalized(lesson?.lessonName) || 'Урок' }}</h2>
    <div class="lesson-meta">
      <div class="timer-display">⏱ {{ formattedTime }}</div>
      <div class="step-counter">{{ currentStep }}/{{ totalSteps }}</div>
      <!-- Hide stars display during lesson progress to avoid overlap with problem report button -->
      <div 
        v-if="showStarsInHeader" 
        class="stars-display"
      >
        ⭐ {{ stars }}
      </div>
      <button 
        class="problem-report-btn-header" 
        @click="$emit('report-problem')"
        title="Сообщить о проблеме с уроком"
      >
        ⚠️ Проблема
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LessonHeader',
  props: {
    lesson: {
      type: Object,
      required: true
    },
    currentStep: {
      type: Number,
      required: true
    },
    totalSteps: {
      type: Number,
      required: true
    },
    formattedTime: {
      type: String,
      required: true
    },
    stars: {
      type: Number,
      default: 0
    },
    // New prop to control when to show stars
    showStarsInHeader: {
      type: Boolean,
      default: false
    }
  },
  emits: ['exit', 'report-problem'],
  methods: {
    getLocalized(field) {
      if (typeof field === 'string') return field;
      return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim();
    }
  }
}
</script>

<style scoped>
.lesson-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 16px 32px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.lesson-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  opacity: 0.6;
  border-radius: 0 0 2px 2px;
}

.exit-btn-small {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.15) 100%);
  border: 2px solid rgba(239, 68, 68, 0.2);
  font-size: 1.2rem;
  color: #ef4444;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.exit-btn-small::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.exit-btn-small:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.25) 100%);
  border-color: rgba(239, 68, 68, 0.4);
  transform: scale(1.05) rotate(90deg);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
}

.exit-btn-small:hover::before {
  left: 100%;
}

.exit-btn-small:active {
  transform: scale(0.95) rotate(90deg);
}

.lesson-title {
  font-size: 1.4rem;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  flex-grow: 1;
  min-width: 0;
  text-align: center;
  font-weight: 700;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 0 20px;
  letter-spacing: -0.025em;
}

.lesson-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.timer-display,
.step-counter,
.stars-display {
  font-size: 0.95rem;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.timer-display {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  border: 2px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 4px 12px rgba(71, 85, 105, 0.1);
}

.step-counter {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 2px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.stars-display {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 2px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

/* Enhanced Problem Report Button */
.problem-report-btn-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 12px 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.problem-report-btn-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.problem-report-btn-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
}

.problem-report-btn-header:hover::before {
  left: 100%;
}

.problem-report-btn-header:active {
  transform: translateY(0);
}

/* Enhanced hover effects for meta items */
.timer-display:hover,
.step-counter:hover,
.stars-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.timer-display:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  border-color: rgba(148, 163, 184, 0.5);
}

.step-counter:hover {
  background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
  border-color: rgba(59, 130, 246, 0.5);
}

.stars-display:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
  border-color: rgba(245, 158, 11, 0.6);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .lesson-header {
    padding: 14px 24px;
    gap: 10px;
  }

  .lesson-title {
    font-size: 1.2rem;
    padding: 0 16px;
  }

  .lesson-meta {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .lesson-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .lesson-title {
    font-size: 1.1rem;
    text-align: left;
    order: 2;
    padding: 0;
    width: 100%;
  }

  .exit-btn-small {
    align-self: flex-end;
    order: 1;
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .lesson-meta {
    order: 3;
    align-self: flex-start;
    gap: 8px;
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .timer-display,
  .step-counter,
  .stars-display {
    font-size: 0.8rem;
    padding: 8px 12px;
    min-height: 36px;
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .problem-report-btn-header {
    font-size: 0.75rem;
    padding: 8px 12px;
    min-height: 36px;
    width: 100%;
    margin-top: 8px;
    justify-content: center;
  }
}

@media (max-width: 580px) {
  .lesson-meta {
    gap: 6px;
  }

  .timer-display,
  .step-counter,
  .stars-display {
    font-size: 0.75rem;
    padding: 6px 10px;
    min-height: 32px;
  }

  .problem-report-btn-header {
    font-size: 0.7rem;
    padding: 6px 10px;
    min-height: 32px;
    margin-top: 6px;
  }
}

@media (max-width: 480px) {
  .lesson-header {
    padding: 10px 12px;
    gap: 12px;
  }

  .lesson-title {
    font-size: 1rem;
  }

  .lesson-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 8px;
    width: 100%;
  }

  .timer-display,
  .step-counter,
  .stars-display {
    font-size: 0.75rem;
    padding: 8px 10px;
    min-height: 32px;
    justify-content: center;
  }

  .problem-report-btn-header {
    grid-column: 1 / -1;
    margin-top: 4px;
    font-size: 0.75rem;
    padding: 8px 12px;
    min-height: 36px;
  }
}

/* Focus states for accessibility */
.exit-btn-small:focus,
.problem-report-btn-header:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .timer-display,
  .step-counter,
  .stars-display,
  .problem-report-btn-header {
    border-width: 3px;
  }
  
  .lesson-header {
    border-bottom-width: 3px;
  }

  .problem-report-btn-header {
    border: 3px solid #d97706;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .exit-btn-small:hover,
  .timer-display:hover,
  .step-counter:hover,
  .stars-display:hover,
  .problem-report-btn-header:hover {
    transform: none;
  }

  .exit-btn-small::before,
  .problem-report-btn-header::before {
    display: none;
  }
}

/* Print styles */
@media print {
  .exit-btn-small,
  .problem-report-btn-header {
    display: none;
  }
  
  .lesson-header {
    box-shadow: none;
    border-bottom: 2px solid #000;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .lesson-header {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-bottom-color: #475569;
  }

  .lesson-title {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .timer-display {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    color: #d1d5db;
    border-color: rgba(156, 163, 175, 0.3);
  }

  .step-counter {
    background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
    color: #bfdbfe;
    border-color: rgba(59, 130, 246, 0.4);
  }

  .stars-display {
    background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
    color: #fef3c7;
    border-color: rgba(245, 158, 11, 0.5);
  }
}

/* Animation keyframes */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

/* Loading state animation */
.lesson-header.loading .timer-display,
.lesson-header.loading .step-counter {
  background: linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 40px, #f1f5f9 80px);
  background-size: 200px;
  animation: shimmer 1.5s infinite;
}
</style>