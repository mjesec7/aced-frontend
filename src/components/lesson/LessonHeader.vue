<template>
  <div class="lesson-header">
    <div class="header-single-row">
      <!-- Exit Button -->
      <button class="exit-btn-small" @click="$emit('exit')">✕</button>
      
      <!-- Lesson Title -->
      <h2 class="lesson-title">{{ getLocalized(lesson?.lessonName) || getLocalized(lesson?.title) || 'Lesson' }}</h2>

      <!-- Microphone Button -->
      <button 
        class="mic-btn-header" 
        @click="toggleVoiceInput"
        title="Toggle Voice Input"
      >
        <svg class="mic-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Warning for Uzbek (Voice Disabled) -->
      <div 
        v-if="language === 'uz'"
        class="warning-icon-header"
        title="Voice explanation not available in Uzbek"
      >
        🔇
      </div>
      
      <!-- Progress Bar with Markers -->
      <div class="progress-container">
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
        <div class="progress-text">{{ currentStep }}/{{ totalSteps }}</div>
      </div>
      
      <!-- Timer -->
      <div class="timer-display">{{ formattedTime }}</div>
      
      <!-- Stars -->
      <div class="stars-display">⭐ {{ stars }}</div>

      <!-- Streak (Optional) -->
      <div v-if="streak !== undefined" class="streak-display">
        <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
        </svg>
        <span class="text-xs font-bold text-amber-700">{{ streak }}</span>
      </div>

      <!-- Points (Optional) -->
      <div v-if="points !== undefined" class="points-display">
        <svg class="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
        </svg>
        <span class="text-xs font-bold text-indigo-700">{{ points }}</span>
      </div>

      <!-- Problem Report Button -->
      <button 
        class="problem-report-btn-header" 
        @click="$emit('report-problem')"
        title="Report a problem with the lesson"
      >
        ⚠️
      </button>
    </div>
  </div>
</template>

<script>
import { useLanguage } from '@/composables/useLanguage';
import { eventBus } from '@/utils/eventBus';

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
    },
    streak: {
      type: Number,
      default: undefined
    },
    points: {
      type: Number,
      default: undefined
    }
  },
  emits: ['exit', 'report-problem'],
  setup() {
    const { language } = useLanguage();
    return { language };
  },
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
          title: `Step ${i + 1}`
        });
      }

      return markers;
    }
  },
  methods: {
    toggleVoiceInput() {
      eventBus.emit('toggle-voice-input');
    },
    getLocalized(field) {
      // Handle null/undefined
      if (field === null || field === undefined) return '';

      // If it's already a string, return it (legacy format)
      if (typeof field === 'string') return field;

      // If it's an object with language keys (multilingual format)
      if (typeof field === 'object') {
        const lang = this.language || localStorage.getItem('lang') || 'ru';
        // Priority: Current language -> English fallback -> Russian fallback -> Uzbek -> First available
        const value = field[lang] || field['en'] || field['ru'] || field['uz'];
        if (value && typeof value === 'string') {
          return value.replace(/^(en|ru|uz):/i, '').trim();
        }
        // Try to get any available string value
        const values = Object.values(field);
        for (const v of values) {
          if (v && typeof v === 'string' && v.trim()) {
            return v.replace(/^(en|ru|uz):/i, '').trim();
          }
        }
      }
      return '';
    }
  }
}
</script>

<style scoped>
.lesson-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
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

/* Single Row Layout */
.header-single-row {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  gap: 16px;
}

/* Exit Button */
.exit-btn-small {
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

/* Lesson Title */
.lesson-title {
  font-size: 0.95rem;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 150px;
}

/* Progress Container */
.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.progress-bar-wrapper {
  position: relative;
  background: #f1f5f9;
  height: 6px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  flex: 1;
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
  width: 10px;
  height: 10px;
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

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
  min-width: 30px;
}

/* Timer Display */
.timer-display {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid rgba(5, 150, 105, 0.3);
  box-shadow: 0 1px 3px rgba(5, 150, 105, 0.1);
  flex-shrink: 0;
}

.timer-display:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: rgba(5, 150, 105, 0.4);
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
}

/* Stars Display */
.stars-display {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.1);
  flex-shrink: 0;
}

.stars-display:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
  border-color: rgba(245, 158, 11, 0.6);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

/* Microphone Button */
.mic-btn-header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 40px;
  height: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  position: relative;
  overflow: hidden;
  margin: 0 8px;
}

.mic-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
}

.mic-btn-header:hover .mic-icon {
  transform: scale(1.1);
}

.mic-btn-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.mic-btn-header:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
}

.mic-btn-header:hover::before {
  left: 100%;
}

.mic-btn-header:active {
  transform: translateY(0);
}

/* Warning Icon */
.warning-icon-header {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  color: white;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
  cursor: help;
  box-shadow: 0 2px 6px rgba(100, 116, 139, 0.3);
}

.streak-display, .points-display {
  display: flex;
  items-center: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  flex-shrink: 0;
}

.streak-display {
  background-color: #fffbeb; /* amber-50 */
}

.points-display {
  background-color: #eef2ff; /* indigo-50 */
}

/* Problem Report Button */
.problem-report-btn-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
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
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
  position: relative;
  overflow: hidden;
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

/* Enhanced progress bar states */
.progress-bar[style*="100%"] {
  background: linear-gradient(90deg, #059669 0%, #047857 100%);
}

/* Responsive Design - Comprehensive Device Coverage */

/* Extra Large Desktops (1440px+) */
@media (min-width: 1440px) {
  .header-single-row {
    padding: 12px 24px;
    gap: 20px;
  }
  
  .lesson-title {
    font-size: 1.1rem;
    min-width: 200px;
  }
  
  .progress-container {
    min-width: 300px;
    gap: 12px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.85rem;
    padding: 6px 10px;
  }
  
  .progress-bar-wrapper {
    height: 8px;
  }
  
  .marker-dot {
    width: 12px;
    height: 12px;
  }
}

/* Large Desktops (1200px - 1439px) */
@media (min-width: 1200px) and (max-width: 1439px) {
  .header-single-row {
    padding: 10px 20px;
    gap: 16px;
  }
  
  .lesson-title {
    font-size: 1rem;
    min-width: 180px;
  }
  
  .progress-container {
    min-width: 250px;
    gap: 10px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 34px;
    height: 34px;
    font-size: 0.95rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.8rem;
    padding: 5px 8px;
  }
  
  .progress-bar-wrapper {
    height: 7px;
  }
  
  .marker-dot {
    width: 11px;
    height: 11px;
  }
}

/* Standard Desktops (1024px - 1199px) */
@media (min-width: 1024px) and (max-width: 1199px) {
  .header-single-row {
    padding: 10px 20px;
    gap: 16px;
  }
  
  .lesson-title {
    font-size: 0.95rem;
    min-width: 150px;
  }
  
  .progress-container {
    min-width: 200px;
    gap: 8px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.75rem;
    padding: 4px 8px;
  }
  
  .progress-bar-wrapper {
    height: 6px;
  }
  
  .marker-dot {
    width: 10px;
    height: 10px;
  }
}

/* Large Tablets (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .header-single-row {
    padding: 8px 16px;
    gap: 12px;
  }
  
  .lesson-title {
    font-size: 0.9rem;
    min-width: 120px;
    flex-shrink: 1;
  }
  
  .progress-container {
    min-width: 150px;
    gap: 6px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 30px;
    height: 30px;
    font-size: 0.85rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .progress-bar-wrapper {
    height: 5px;
  }
  
  .marker-dot {
    width: 9px;
    height: 9px;
    border-width: 1px;
  }
}

/* Small Tablets (640px - 767px) */
@media (min-width: 640px) and (max-width: 767px) {
  .header-single-row {
    padding: 6px 12px;
    gap: 10px;
  }
  
  .lesson-title {
    font-size: 0.85rem;
    min-width: 100px;
    flex-shrink: 1;
  }
  
  .progress-container {
    min-width: 120px;
    gap: 6px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.65rem;
    padding: 2px 5px;
  }
  
  .progress-bar-wrapper {
    height: 5px;
  }
  
  .marker-dot {
    width: 8px;
    height: 8px;
    border-width: 1px;
  }
}

/* Large Phones (480px - 639px) */
@media (min-width: 480px) and (max-width: 639px) {
  .header-single-row {
    padding: 5px 10px;
    gap: 8px;
  }
  
  .lesson-title {
    font-size: 0.8rem;
    min-width: 80px;
    flex-shrink: 1;
  }
  
  .progress-container {
    min-width: 100px;
    gap: 5px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 26px;
    height: 26px;
    font-size: 0.75rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.6rem;
    padding: 2px 4px;
  }
  
  .progress-bar-wrapper {
    height: 4px;
  }
  
  .marker-dot {
    width: 7px;
    height: 7px;
    border-width: 1px;
  }
}

/* Medium Phones (360px - 479px) */
@media (min-width: 360px) and (max-width: 479px) {
  .header-single-row {
    padding: 4px 8px;
    gap: 6px;
  }
  
  .lesson-title {
    font-size: 0.75rem;
    min-width: 60px;
    flex-shrink: 1;
  }
  
  .progress-container {
    min-width: 80px;
    gap: 4px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.55rem;
    padding: 1px 3px;
  }
  
  .progress-bar-wrapper {
    height: 4px;
  }
  
  .marker-dot {
    width: 6px;
    height: 6px;
    border-width: 1px;
  }
}

/* Small Phones (320px - 359px) */
@media (max-width: 359px) {
  .header-single-row {
    padding: 3px 6px;
    gap: 4px;
  }
  
  .lesson-title {
    font-size: 0.7rem;
    min-width: 50px;
    flex-shrink: 1;
  }
  
  .progress-container {
    min-width: 60px;
    gap: 3px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 22px;
    height: 22px;
    font-size: 0.65rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.5rem;
    padding: 1px 2px;
  }
  
  .progress-bar-wrapper {
    height: 3px;
  }
  
  .marker-dot {
    width: 5px;
    height: 5px;
    border-width: 1px;
  }
}

/* Ultra-wide screens (2560px+) */
@media (min-width: 2560px) {
  .header-single-row {
    padding: 16px 32px;
    gap: 24px;
  }
  
  .lesson-title {
    font-size: 1.3rem;
    min-width: 250px;
  }
  
  .progress-container {
    min-width: 400px;
    gap: 16px;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.95rem;
    padding: 8px 12px;
  }
  
  .progress-bar-wrapper {
    height: 10px;
  }
  
  .marker-dot {
    width: 14px;
    height: 14px;
  }
}

/* Portrait orientation adjustments */
@media (orientation: portrait) and (max-width: 768px) {
  .header-single-row {
    gap: calc(100vw * 0.015); /* Dynamic gap based on viewport width */
  }
  
  .lesson-title {
    min-width: calc(100vw * 0.2);
    max-width: calc(100vw * 0.35);
  }
  
  .progress-container {
    min-width: calc(100vw * 0.25);
  }
}

/* Landscape orientation adjustments for phones */
@media (orientation: landscape) and (max-height: 500px) {
  .header-single-row {
    padding: 2px 8px;
    gap: 6px;
  }
  
  .lesson-title {
    font-size: 0.75rem;
  }
  
  .exit-btn-small,
  .problem-report-btn-header {
    width: 20px;
    height: 20px;
    font-size: 0.6rem;
  }
  
  .timer-display,
  .stars-display,
  .progress-text {
    font-size: 0.55rem;
    padding: 1px 3px;
  }
  
  .progress-bar-wrapper {
    height: 3px;
  }
}

/* High DPI screens adjustments */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .marker-dot {
    border-width: 0.5px;
  }
  
  .progress-bar-wrapper {
    box-shadow: inset 0 0.5px 1px rgba(0, 0, 0, 0.05);
  }
}

/* Touch device optimizations */
@media (pointer: coarse) {
  .exit-btn-small,
  .problem-report-btn-header {
    min-width: 28px;
    min-height: 28px;
  }
  
  .timer-display,
  .stars-display {
    min-height: 24px;
  }
}

/* Fine pointer (mouse) optimizations */
@media (pointer: fine) {
  .exit-btn-small:hover,
  .problem-report-btn-header:hover {
    transform: translateY(-1px) scale(1.05);
  }
  
  .timer-display:hover,
  .stars-display:hover {
    transform: translateY(-1px);
  }
}

/* Foldable phone support */
@media (max-width: 280px) {
  .header-single-row {
    flex-wrap: wrap;
    padding: 2px 4px;
    gap: 2px;
  }
  
  .lesson-title {
    order: 1;
    width: 100%;
    text-align: center;
    margin-bottom: 2px;
    font-size: 0.65rem;
  }
  
  .exit-btn-small {
    order: 2;
  }
  
  .progress-container {
    order: 3;
    flex: 1;
  }
  
  .timer-display {
    order: 4;
  }
  
  .stars-display {
    order: 5;
  }
  
  .problem-report-btn-header {
    order: 6;
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
  .problem-report-btn-header:hover,
  .timer-display:hover,
  .stars-display:hover {
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