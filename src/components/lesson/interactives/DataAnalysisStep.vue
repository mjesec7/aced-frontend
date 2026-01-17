<template>
  <div class="data-analysis-container">

    <!-- Background Decorations -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="bg-decoration bg-decoration-1"></div>
      <div class="bg-decoration bg-decoration-2"></div>
    </div>

    <div class="relative z-10">

      <!-- Header -->
      <div class="da-header">
        <div class="da-badge">
          <span class="da-badge-icon">📊</span>
          <span class="da-badge-text">Data Analysis</span>
        </div>
        <h2 class="da-title">
          {{ getLocalizedText(step.prompt) || 'Analyze the Data' }}
        </h2>
      </div>

      <!-- Chart Section -->
      <div class="da-chart-section">

        <!-- Bar Chart -->
        <div class="da-chart">
          <div
            v-for="(item, index) in chartData"
            :key="index"
            class="da-bar-wrapper"
          >
            <!-- Value Label -->
            <span class="da-bar-value">{{ item.value }}</span>

            <!-- Bar -->
            <div
              class="da-bar bar-animate"
              :class="getBarColor(index)"
              :style="{ height: getBarHeight(item.value) + '%', animationDelay: (index * 0.1) + 's' }"
            >
              <!-- Hover Tooltip -->
              <div class="da-tooltip">
                {{ item.label }}: {{ item.value }} {{ numericLabel }}
              </div>
            </div>

            <!-- Label -->
            <span class="da-bar-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- Y-Axis Label -->
        <div class="da-axis-label">
          <span>{{ numericLabel }}</span>
        </div>
      </div>

      <!-- Answer Input -->
      <div class="da-input-section">
        <label class="da-input-label">
          Enter your answer:
        </label>
        <div class="da-input-row">
          <input
            type="number"
            v-model.number="userAnswer"
            :disabled="isCompleted"
            :step="0.01"
            class="da-input"
            placeholder="0.00"
            @keyup.enter="checkAnswer"
          />
          <span class="da-input-unit">{{ numericLabel }}</span>
        </div>

        <!-- Hint -->
        <p class="da-hint">
          💡 Tip: Calculate the average of all values (sum ÷ count)
        </p>
      </div>

      <!-- Submit Button -->
      <div class="da-button-wrapper">
        <button
          v-if="!isCompleted"
          @click="checkAnswer"
          :disabled="userAnswer === null || userAnswer === ''"
          class="da-btn da-btn-primary"
        >
          <svg class="da-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          Calculate
        </button>

        <button
          v-else
          @click="$emit('complete', true)"
          class="da-btn da-btn-success"
        >
          Continue
          <svg class="da-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </button>
      </div>

      <!-- Feedback -->
      <transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
      >
        <div
          v-if="feedback.show"
          class="da-feedback"
          :class="feedback.isCorrect ? 'da-feedback-success' : 'da-feedback-error'"
        >
          <div class="da-feedback-icon">
            {{ feedback.isCorrect ? '🎯' : '📐' }}
          </div>
          <div class="da-feedback-content">
            <h4 class="da-feedback-title">
              {{ feedback.isCorrect ? 'Correct!' : 'Not quite' }}
            </h4>
            <p class="da-feedback-message">
              {{ feedback.message }}
            </p>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useLanguage } from '@/composables/useLanguage';

const { getLocalizedText } = useLanguage();

const props = defineProps({
  step: {
    type: Object,
    default: () => ({
      prompt: 'What is the average rainfall?',
      numericLabel: 'Rainfall (mm)',
      numericKey: 'rainfall',
      data: [
        { label: 'January', rainfall: 45 },
        { label: 'February', rainfall: 38 },
        { label: 'March', rainfall: 52 }
      ],
      correctAnswer: 45,
      tolerance: 0.5
    })
  }
});

const emit = defineEmits(['complete']);

// State
const userAnswer = ref(null);
const isCompleted = ref(false);
const feedback = ref({
  show: false,
  isCorrect: false,
  message: ''
});

// Computed - with fallbacks for different data structures
const numericLabel = computed(() => {
  const label = props.step?.numericLabel || props.step?.numeric_label || props.step?.content?.numericLabel || 'Value';
  return getLocalizedText(label) || label;
});

const numericKey = computed(() => props.step?.numericKey || props.step?.numeric_key || props.step?.content?.numericKey || 'value');

const chartData = computed(() => {
  const data = props.step?.data || props.step?.content?.data || [];
  if (!Array.isArray(data)) {
    console.warn('DataAnalysisStep: No data array found', props.step);
    return [];
  }
  return data.map(item => ({
    label: getLocalizedText(item.label) || item.label || 'Item',
    value: item[numericKey.value] || item.value || 0
  }));
});

const maxValue = computed(() => {
  if (chartData.value.length === 0) return 100;
  return Math.max(...chartData.value.map(d => d.value));
});

// Methods
const getBarHeight = (value) => {
  if (!value || !maxValue.value) return 5;
  return Math.max(10, (value / maxValue.value) * 100);
};

const getBarColor = (index) => {
  const colors = [
    'bg-gradient-to-t from-blue-600 to-blue-400',
    'bg-gradient-to-t from-cyan-600 to-cyan-400',
    'bg-gradient-to-t from-teal-600 to-teal-400',
    'bg-gradient-to-t from-emerald-600 to-emerald-400',
    'bg-gradient-to-t from-green-600 to-green-400',
    'bg-gradient-to-t from-lime-600 to-lime-400',
  ];
  return colors[index % colors.length];
};

const checkAnswer = () => {
  if (userAnswer.value === null) return;

  const tolerance = props.step?.tolerance || props.step?.content?.tolerance || 0.5;
  const correctAnswer = props.step?.correctAnswer || props.step?.correct_answer || props.step?.content?.correctAnswer;

  if (correctAnswer === undefined || correctAnswer === null) {
    console.warn('DataAnalysisStep: No correct answer found', props.step);
    return;
  }

  const isCorrect = Math.abs(userAnswer.value - correctAnswer) <= tolerance;

  isCompleted.value = true;
  feedback.value = {
    show: true,
    isCorrect,
    message: isCorrect
      ? `Excellent! The correct answer is ${Number(correctAnswer).toFixed(2)}. Your calculation is spot on!`
      : `The correct answer is ${Number(correctAnswer).toFixed(2)}. You answered ${userAnswer.value.toFixed(2)}. Remember: Average = Sum of all values ÷ Number of values`
  };

  emit('complete', isCorrect);
};
</script>

<style scoped>
/* ============================================
   BASE STYLES
   ============================================ */
.data-analysis-container {
  width: 100%;
  min-height: 300px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  border-radius: 1.5rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}

.bg-decoration-1 {
  top: -80px;
  right: -80px;
  width: 200px;
  height: 200px;
  background: rgba(59, 130, 246, 0.1);
}

.bg-decoration-2 {
  bottom: -80px;
  left: -80px;
  width: 160px;
  height: 160px;
  background: rgba(16, 185, 129, 0.1);
}

/* Header */
.da-header {
  text-align: center;
  margin-bottom: 1rem;
}

.da-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.5rem;
}

.da-badge-icon {
  font-size: 1rem;
}

.da-badge-text {
  font-size: 0.65rem;
  font-weight: 500;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.da-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

/* Chart Section */
.da-chart-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
}

.da-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
  height: 140px;
  margin-bottom: 0.5rem;
}

.da-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.da-bar-value {
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.da-bar {
  width: 100%;
  border-radius: 0.375rem 0.375rem 0 0;
  transition: all 0.5s ease-out;
  position: relative;
  cursor: pointer;
}

.da-bar:hover .da-tooltip {
  opacity: 1;
}

.da-tooltip {
  position: absolute;
  top: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.375rem 0.625rem;
  background: #0f172a;
  color: white;
  font-size: 0.625rem;
  font-weight: 500;
  border-radius: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}

.da-bar-label {
  font-size: 0.6rem;
  color: #94a3b8;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.da-axis-label {
  text-align: center;
}

.da-axis-label span {
  font-size: 0.6rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Input Section */
.da-input-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.da-input-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.da-input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.da-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid #334155;
  border-radius: 0.75rem;
  color: white;
  font-size: 1rem;
  font-family: ui-monospace, monospace;
}

.da-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.da-input:disabled {
  opacity: 0.5;
}

.da-input-unit {
  font-size: 0.75rem;
  color: #64748b;
}

.da-hint {
  margin-top: 0.5rem;
  font-size: 0.65rem;
  color: #64748b;
}

/* Buttons */
.da-button-wrapper {
  display: flex;
  justify-content: center;
}

.da-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.da-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.da-btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.da-btn-primary {
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.da-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.da-btn-success {
  background: linear-gradient(135deg, #059669, #14b8a6);
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
}

.da-btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
}

/* Feedback */
.da-feedback {
  margin-top: 0.75rem;
  padding: 0.875rem;
  border-radius: 1rem;
  border: 1px solid;
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.da-feedback-success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.da-feedback-error {
  background: rgba(244, 63, 94, 0.1);
  border-color: rgba(244, 63, 94, 0.3);
}

.da-feedback-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.da-feedback-success .da-feedback-icon {
  background: rgba(16, 185, 129, 0.2);
}

.da-feedback-error .da-feedback-icon {
  background: rgba(244, 63, 94, 0.2);
}

.da-feedback-content {
  flex: 1;
}

.da-feedback-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.da-feedback-success .da-feedback-title {
  color: #34d399;
}

.da-feedback-error .da-feedback-title {
  color: #fb7185;
}

.da-feedback-message {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* Bar Colors */
.bg-gradient-to-t.from-blue-600.to-blue-400 {
  background: linear-gradient(to top, #2563eb, #60a5fa);
}
.bg-gradient-to-t.from-cyan-600.to-cyan-400 {
  background: linear-gradient(to top, #0891b2, #22d3ee);
}
.bg-gradient-to-t.from-teal-600.to-teal-400 {
  background: linear-gradient(to top, #0d9488, #2dd4bf);
}
.bg-gradient-to-t.from-emerald-600.to-emerald-400 {
  background: linear-gradient(to top, #059669, #34d399);
}
.bg-gradient-to-t.from-green-600.to-green-400 {
  background: linear-gradient(to top, #16a34a, #4ade80);
}
.bg-gradient-to-t.from-lime-600.to-lime-400 {
  background: linear-gradient(to top, #65a30d, #a3e635);
}

/* Animation */
@keyframes growUp {
  from {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  to {
    transform: scaleY(1);
    transform-origin: bottom;
  }
}

.bar-animate {
  animation: growUp 0.6s ease-out backwards;
}

/* ============================================
   TABLET RESPONSIVE (768px - 1366px)
   ============================================ */

@media (min-width: 768px) and (max-width: 1023px) {
  .data-analysis-container {
    padding: 1rem;
    border-radius: 1.25rem;
    min-height: 250px;
  }

  .da-header {
    margin-bottom: 0.75rem;
  }

  .da-badge {
    padding: 0.25rem 0.5rem;
    margin-bottom: 0.375rem;
  }

  .da-badge-icon {
    font-size: 0.875rem;
  }

  .da-badge-text {
    font-size: 0.6rem;
  }

  .da-title {
    font-size: 1rem;
  }

  .da-chart-section {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .da-chart {
    height: 100px;
    gap: 0.375rem;
  }

  .da-bar-value {
    font-size: 0.6rem;
  }

  .da-bar-label {
    font-size: 0.5rem;
  }

  .da-input-section {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .da-input {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .da-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8rem;
  }

  .da-btn-icon {
    width: 1rem;
    height: 1rem;
  }

  .da-feedback {
    padding: 0.625rem;
    margin-top: 0.5rem;
  }

  .da-feedback-icon {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }

  .da-feedback-title {
    font-size: 0.8rem;
  }

  .da-feedback-message {
    font-size: 0.65rem;
  }
}

/* iPad Air & Larger Tablets */
@media (min-width: 1024px) and (max-width: 1366px) {
  .data-analysis-container {
    padding: 1.25rem;
    min-height: 280px;
  }

  .da-chart {
    height: 120px;
  }

  .da-title {
    font-size: 1.125rem;
  }
}

/* Tablet Landscape */
@media (min-width: 768px) and (max-height: 800px) and (orientation: landscape) {
  .data-analysis-container {
    padding: 0.75rem;
    min-height: 200px;
    border-radius: 1rem;
  }

  .da-header {
    margin-bottom: 0.5rem;
  }

  .da-badge {
    padding: 0.2rem 0.4rem;
    margin-bottom: 0.25rem;
  }

  .da-badge-icon {
    font-size: 0.75rem;
  }

  .da-badge-text {
    font-size: 0.5rem;
  }

  .da-title {
    font-size: 0.875rem;
  }

  .da-chart-section {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .da-chart {
    height: 80px;
    gap: 0.25rem;
  }

  .da-bar-value {
    font-size: 0.5rem;
  }

  .da-bar-label {
    font-size: 0.45rem;
  }

  .da-input-section {
    padding: 0.5rem;
    margin-bottom: 0.375rem;
  }

  .da-input-label {
    font-size: 0.65rem;
    margin-bottom: 0.25rem;
  }

  .da-input {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }

  .da-hint {
    font-size: 0.55rem;
    margin-top: 0.25rem;
  }

  .da-btn {
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
    border-radius: 0.75rem;
  }

  .da-btn-icon {
    width: 0.875rem;
    height: 0.875rem;
  }

  .da-feedback {
    padding: 0.5rem;
    margin-top: 0.375rem;
    gap: 0.5rem;
  }

  .da-feedback-icon {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.875rem;
  }

  .da-feedback-title {
    font-size: 0.7rem;
  }

  .da-feedback-message {
    font-size: 0.6rem;
  }
}

/* Short screens */
@media (max-height: 600px) {
  .data-analysis-container {
    padding: 0.5rem;
    min-height: 180px;
    border-radius: 0.75rem;
  }

  .da-header {
    margin-bottom: 0.375rem;
  }

  .da-badge {
    padding: 0.15rem 0.35rem;
    margin-bottom: 0.2rem;
  }

  .da-badge-icon {
    font-size: 0.65rem;
  }

  .da-badge-text {
    font-size: 0.45rem;
  }

  .da-title {
    font-size: 0.75rem;
  }

  .da-chart-section {
    padding: 0.375rem;
    margin-bottom: 0.375rem;
    border-radius: 0.5rem;
  }

  .da-chart {
    height: 60px;
    gap: 0.2rem;
    margin-bottom: 0.25rem;
  }

  .da-bar-value {
    font-size: 0.45rem;
  }

  .da-bar {
    border-radius: 0.2rem 0.2rem 0 0;
  }

  .da-bar-label {
    font-size: 0.4rem;
  }

  .da-input-section {
    padding: 0.375rem;
    margin-bottom: 0.25rem;
    border-radius: 0.5rem;
  }

  .da-input-label {
    font-size: 0.55rem;
    margin-bottom: 0.2rem;
  }

  .da-input {
    padding: 0.3rem 0.4rem;
    font-size: 0.65rem;
    border-radius: 0.5rem;
  }

  .da-input-unit {
    font-size: 0.55rem;
  }

  .da-hint {
    font-size: 0.5rem;
    margin-top: 0.2rem;
  }

  .da-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.6rem;
    border-radius: 0.5rem;
    gap: 0.25rem;
  }

  .da-btn-icon {
    width: 0.75rem;
    height: 0.75rem;
  }

  .da-feedback {
    padding: 0.375rem;
    margin-top: 0.25rem;
    gap: 0.375rem;
    border-radius: 0.5rem;
  }

  .da-feedback-icon {
    width: 1.25rem;
    height: 1.25rem;
    font-size: 0.7rem;
    border-radius: 0.375rem;
  }

  .da-feedback-title {
    font-size: 0.6rem;
  }

  .da-feedback-message {
    font-size: 0.5rem;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .data-analysis-container {
    padding: 0.875rem;
    min-height: 280px;
    border-radius: 1rem;
  }

  .da-title {
    font-size: 1rem;
  }

  .da-chart {
    height: 120px;
  }
}
</style>
