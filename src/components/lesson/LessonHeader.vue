<template>
  <div class="lesson-header">
    <button class="exit-btn-small" @click="$emit('exit')">✕</button>
    <h2 class="lesson-title">{{ getLocalized(lesson?.lessonName) || 'Урок' }}</h2>
    <div class="lesson-meta">
      <div class="timer-display">⏱ {{ formattedTime }}</div>
      <div class="step-counter">{{ currentStep }}/{{ totalSteps }}</div>
      <div class="stars-display">⭐ {{ stars }}</div>
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
  background: white;
  padding: 16px 32px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 100;
}

.lesson-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  opacity: 0.1;
}

.exit-btn-small {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  font-size: 1.2rem;
  color: #ef4444;
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
}

.exit-btn-small:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.05);
}

.exit-btn-small:active {
  transform: scale(0.95);
}

.lesson-title {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0;
  flex-grow: 1;
  min-width: 0;
  text-align: center;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 0 16px;
}

.lesson-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.timer-display,
.step-counter,
.stars-display {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.timer-display {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #475569;
  border: 1px solid #cbd5e1;
}

.step-counter {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.stars-display {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #fbbf24;
}

/* Problem Report Button in Header */
.problem-report-btn-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.2);
}

.problem-report-btn-header:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.problem-report-btn-header:active {
  transform: translateY(0);
}

.timer-display:hover,
.step-counter:hover,
.stars-display:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .lesson-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
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
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .lesson-meta {
    order: 3;
    align-self: flex-start;
    gap: 10px;
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .timer-display,
  .step-counter,
  .stars-display,
  .problem-report-btn-header {
    font-size: 0.85rem;
    padding: 6px 10px;
    min-height: 32px;
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .problem-report-btn-header {
    flex: 0 0 auto;
    min-width: 90px;
  }
}

@media (max-width: 580px) {
  .lesson-meta {
    gap: 8px;
  }

  .timer-display,
  .step-counter,
  .stars-display {
    font-size: 0.8rem;
    padding: 5px 8px;
    min-height: 28px;
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .problem-report-btn-header {
    font-size: 0.75rem;
    padding: 5px 8px;
    min-height: 28px;
    min-width: 80px;
    width: 100%;
    margin-top: 4px;
  }
}

@media (max-width: 480px) {
  .lesson-header {
    padding: 10px 12px;
  }

  .lesson-title {
    font-size: 1rem;
  }

  .lesson-meta {
    gap: 6px;
    flex-direction: column;
    width: 100%;
  }

  .timer-display,
  .step-counter,
  .stars-display {
    font-size: 0.8rem;
    padding: 5px 8px;
    min-height: 28px;
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .problem-report-btn-header {
    width: 100%;
    margin-top: 4px;
    font-size: 0.8rem;
    padding: 6px 12px;
    min-height: 32px;
  }

  /* Create a row for main stats */
  .lesson-meta {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 6px;
  }

  .problem-report-btn-header {
    grid-column: 1 / -1;
    margin-top: 2px;
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
    border-width: 2px;
  }
  
  .lesson-header {
    border-bottom-width: 2px;
  }

  .problem-report-btn-header {
    border: 2px solid #d97706;
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
}

/* Print styles */
@media print {
  .exit-btn-small,
  .problem-report-btn-header {
    display: none;
  }
  
  .lesson-header {
    box-shadow: none;
    border-bottom: 1px solid #000;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .lesson-header {
    background: #1e293b;
    border-bottom-color: #374151;
  }

  .lesson-title {
    color: #e2e8f0;
  }

  .timer-display {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }

  .step-counter {
    background: #1e3a8a;
    color: #bfdbfe;
    border-color: #3b82f6;
  }

  .stars-display {
    background: #92400e;
    color: #fef3c7;
    border-color: #f59e0b;
  }
}
</style>