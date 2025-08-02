<template>
  <div class="lesson-header">
    <!-- Top Row: Exit Button, Title, Problem Report -->
    <div class="header-top-row">
      <button class="exit-btn-small" @click="$emit('exit')">✕</button>
      <h2 class="lesson-title">{{ getLocalized(lesson?.lessonName) || 'Урок' }}</h2>
      <button 
        class="problem-report-btn-header" 
        @click="$emit('report-problem')"
        title="Сообщить о проблеме с уроком"
      >
        ⚠️
      </button>
    </div>

    <!-- Bottom Row: Progress Bar with Meta Info -->
    <div class="progress-section">
      <div class="progress-bar-container">
        <!-- Progress Bar -->
        <div class="progress-bar-wrapper">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }">
            <div class="progress-shine"></div>
          </div>
          <div class="progress-markers">
            <div 
              v-for="marker in progressMarkers" 
              :key="marker.id"
              class="progress-marker"
              :class="{ 
                'completed': marker.completed,
                'current': marker.current 
              }"
              :style="{ left: marker.position + '%' }"
              :title="marker.title"
            >
              <div class="marker-dot"></div>
            </div>
          </div>
        </div>

        <!-- Meta Information -->
        <div class="meta-row">
          <div class="step-info">{{ currentStep }}/{{ totalSteps }}</div>
          <div class="progress-percentage">{{ progressPercentage }}%</div>
          <div class="timer-display">{{ formattedTime }}</div>
          <div class="stars-display">⭐ {{ stars }}</div>
        </div>
      </div>
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
    progressPercentage: {
      type: Number,
      required: true,
      default: 0
    }
  },
  emits: ['exit', 'report-problem'],
  computed: {
    progressMarkers() {
      if (this.totalSteps <= 1) return [];
      
      const markers = [];
      const stepWidth = 100 / (this.totalSteps - 1);
      
      for (let i = 0; i < this.totalSteps; i++) {
        markers.push({
          id: i,
          position: i * stepWidth,
          completed: i < this.currentStep - 1,
          current: i === this.currentStep - 1,
          title: `Шаг ${i + 1}`
        });
      }
      
      return markers;
    }
  },
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
  border-bottom: 1px solid #e2e8f0;
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
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  opacity: 0.6;
}

/* Top Row - Title and Buttons */
.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px 4px 20px;
  gap: 16px;
}

.exit-btn-small,
.problem-report-btn-header {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.15) 100%);
  border: 2px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 600;
  font-size: 0.9rem;
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
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.exit-btn-small:hover::before {
  left: 100%;
}

.exit-btn-small:active {
  transform: scale(0.95) rotate(90deg);
}

.problem-report-btn-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
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
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
}

.problem-report-btn-header:hover::before {
  left: 100%;
}

.problem-report-btn-header:active {
  transform: translateY(0);
}

.lesson-title {
  font-size: 0.95rem;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  flex: 1;
  text-align: center;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  min-width: 0;
}

/* Progress Section */
.progress-section {
  padding: 0 20px 8px 20px;
}

.progress-bar-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Progress Bar */
.progress-bar-wrapper {
  position: relative;
  background: #f1f5f9;
  height: 6px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: inherit;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progressShine 2s infinite;
}

@keyframes progressShine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.progress-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.progress-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 2px solid #cbd5e1;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-marker.completed .marker-dot {
  background: #3b82f6;
  border-color: #3b82f6;
  transform: scale(1.1);
}

.progress-marker.current .marker-dot {
  background: #f59e0b;
  border-color: #f59e0b;
  transform: scale(1.2);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.1); }
}

/* Meta Row */
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.step-info,
.progress-percentage,
.timer-display,
.stars-display {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  min-height: 24px;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.step-info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
}

.progress-percentage {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 1px 3px rgba(71, 85, 105, 0.05);
}

.timer-display {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid rgba(5, 150, 105, 0.3);
  box-shadow: 0 1px 3px rgba(5, 150, 105, 0.1);
}

.stars-display {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.1);
}

/* Enhanced hover effects for meta items */
.timer-display:hover,
.step-info:hover,
.progress-percentage:hover,
.stars-display:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.step-info:hover {
  background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
  border-color: rgba(59, 130, 246, 0.5);
}

.progress-percentage:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  border-color: rgba(148, 163, 184, 0.5);
}

.timer-display:hover {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: rgba(5, 150, 105, 0.4);
}

.stars-display:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
  border-color: rgba(245, 158, 11, 0.6);
}

/* Enhanced progress bar states */
.progress-bar[style*="100%"] {
  background: linear-gradient(90deg, #059669 0%, #047857 100%);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-top-row {
    padding: 6px 16px 3px 16px;
  }
  
  .progress-section {
    padding: 0 16px 6px 16px;
  }
  
  .lesson-title {
    font-size: 0.9rem;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 30px;
    height: 30px;
    font-size: 0.85rem;
  }
  
  .meta-row {
    gap: 6px;
  }
  
  .step-info,
  .progress-percentage,
  .timer-display,
  .stars-display {
    font-size: 0.7rem;
    padding: 3px 6px;
    min-height: 22px;
  }
}

@media (max-width: 768px) {
  .header-top-row {
    padding: 5px 12px 2px 12px;
  }
  
  .progress-section {
    padding: 0 12px 5px 12px;
  }
  
  .lesson-title {
    font-size: 0.85rem;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .meta-row {
    gap: 4px;
    overflow-x: auto;
    padding-bottom: 1px;
  }
  
  .step-info,
  .progress-percentage,
  .timer-display,
  .stars-display {
    font-size: 0.65rem;
    padding: 2px 5px;
    min-height: 20px;
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  .header-top-row {
    padding: 4px 10px 2px 10px;
  }
  
  .progress-section {
    padding: 0 10px 4px 10px;
  }
  
  .lesson-title {
    font-size: 0.8rem;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 26px;
    height: 26px;
    font-size: 0.75rem;
  }
  
  .progress-bar-wrapper {
    height: 5px;
  }
  
  .marker-dot {
    width: 8px;
    height: 8px;
    border-width: 1px;
  }
  
  .meta-row {
    gap: 3px;
  }
  
  .step-info,
  .progress-percentage,
  .timer-display,
  .stars-display {
    font-size: 0.6rem;
    padding: 2px 4px;
    min-height: 18px;
  }
}

/* Focus states for accessibility */
.exit-btn-small:focus,
.problem-report-btn-header:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .progress-bar-wrapper {
    border: 2px solid #000;
  }
  
  .progress-bar {
    background: #000;
  }
  
  .marker-dot {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .progress-bar {
    transition: width 0.2s ease;
  }
  
  .progress-shine {
    animation: none;
  }
  
  .progress-marker.current .marker-dot {
    animation: none;
  }
  
  .exit-btn-small:hover,
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
  
  .progress-shine {
    display: none;
  }
}
</style>