<template>
  <div class="histogram-wrapper">
    <!-- Title Section -->
    <div class="histogram-header">
      <h3 class="histogram-title">{{ title || 'Data Visualization' }}</h3>
      <p v-if="description" class="histogram-description">{{ description }}</p>
    </div>

    <!-- Chart Visualization -->
    <div class="chart-container">
      <div class="chart-inner">
        <!-- Y-axis Grid Lines -->
        <div class="chart-grid">
          <div v-for="i in 5" :key="i" class="grid-line">
            <span class="grid-label">{{ Math.round((maxValue / 4) * (5 - i)) }}</span>
          </div>
        </div>

        <!-- Bars -->
        <div class="bars-container">
          <div 
            v-for="(value, index) in chartData.values" 
            :key="index"
            class="bar-wrapper"
            @click="selectValue(chartData.labels[index])"
          >
            <!-- Bar -->
            <div 
              class="bar"
              :class="{ 'bar-selected': selectedIndex === index }"
              :style="{ 
                height: `${(value / maxValue) * 100}%`,
              }"
            >
              <!-- Value Label on Hover -->
              <div class="bar-value">{{ value }}</div>
            </div>

            <!-- Label -->
            <div class="bar-label">{{ chartData.labels[index] }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slider Section -->
    <div class="slider-section">
      <div class="slider-header">
        <span class="slider-label">Select Value</span>
        <span class="slider-current-value">{{ currentValue }}</span>
      </div>

      <div class="slider-container">
        <span class="slider-min">{{ min }}</span>
        
        <div class="slider-track-wrapper">
          <input
            type="range"
            :min="min"
            :max="max"
            :step="step"
            v-model.number="currentValue"
            class="slider-input"
            :disabled="isLocked"
            @input="handleSliderInput"
          />
          <div class="slider-track">
            <div 
              class="slider-fill" 
              :style="{ width: sliderPercentage + '%' }"
            ></div>
          </div>
        </div>
        
        <span class="slider-max">{{ max }}</span>
      </div>

      <!-- Submit Button -->
      <button
        @click="checkAnswer"
        :disabled="isLocked"
        class="submit-button"
        :class="{ 'submit-button-success': isLocked }"
      >
        {{ isLocked ? '✓ Correct!' : 'Submit Answer' }}
      </button>

      <!-- Feedback -->
      <transition name="fade-slide">
        <div v-if="feedback" class="feedback" :class="{ 'feedback-success': isCorrect, 'feedback-error': !isCorrect }">
          <span class="feedback-icon">{{ isCorrect ? '🎯' : '💫' }}</span>
          <span class="feedback-text">{{ feedback }}</span>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  title: String,
  description: String,
  data: {
    type: Object,
    required: true
  },
  correctValue: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['complete', 'next']);

// State
const currentValue = ref(Math.floor((props.max + props.min) / 2));
const selectedIndex = ref(-1);
const feedback = ref('');
const isCorrect = ref(false);
const isLocked = ref(false);

// Computed
const chartData = computed(() => props.data || { labels: [], values: [] });
const maxValue = computed(() => Math.max(...chartData.value.values));
const sliderPercentage = computed(() => ((currentValue.value - props.min) / (props.max - props.min)) * 100);

// Methods
const handleSliderInput = (event) => {
  // Smooth slider update
  currentValue.value = Number(event.target.value);
};

const selectValue = (label) => {
  const index = chartData.value.labels.indexOf(label);
  selectedIndex.value = index;
  currentValue.value = parseInt(label.replace('k', '000'));
};

const checkAnswer = () => {
  if (isLocked.value) return;
  
  const tolerance = props.step || 100;
  if (Math.abs(currentValue.value - props.correctValue) <= tolerance) {
    isCorrect.value = true;
    feedback.value = 'Perfect! You found the correct value!';
    isLocked.value = true;
    emit('complete', true);
    setTimeout(() => {
      emit('next');
    }, 2000);
  } else {
    isCorrect.value = false;
    feedback.value = 'Not quite. Try again!';
    setTimeout(() => {
      feedback.value = '';
    }, 2000);
  }
};

// Watch for prop changes
watch(() => props.correctValue, () => {
  currentValue.value = Math.floor((props.max + props.min) / 2);
  selectedIndex.value = -1;
  feedback.value = '';
  isCorrect.value = false;
  isLocked.value = false;
});
</script>

<style scoped>
.histogram-wrapper {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Header */
.histogram-header {
  margin-bottom: 32px;
  text-align: center;
}

.histogram-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.histogram-description {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Chart Container */
.chart-container {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  border: 1px solid #e2e8f0;
}

.chart-inner {
  position: relative;
  height: 300px;
}

/* Grid Lines */
.chart-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  width: 100%;
  height: 1px;
  background: #e2e8f0;
  position: relative;
}

.grid-label {
  position: absolute;
  left: -40px;
  top: -8px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

/* Bars Container */
.bars-container {
  position: absolute;
  bottom: 0;
  left: 40px;
  right: 0;
  height: calc(100% - 30px);
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 8px;
}

.bar-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  cursor: pointer;
}

.bar {
  width: 100%;
  max-width: 60px;
  background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.bar:hover {
  background: linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.bar-selected {
  background: linear-gradient(180deg, #ec4899 0%, #db2777 100%) !important;
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.4) !important;
  transform: scale(1.05) !important;
}

.bar-value {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.bar:hover .bar-value {
  opacity: 1;
}

.bar-label {
  margin-top: 8px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

/* Slider Section */
.slider-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.slider-label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.slider-current-value {
  font-size: 20px;
  font-weight: 700;
  color: #8b5cf6;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.slider-min,
.slider-max {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  min-width: 50px;
}

.slider-min {
  text-align: right;
}

.slider-max {
  text-align: left;
}

.slider-track-wrapper {
  position: relative;
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
}

.slider-track {
  position: absolute;
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  pointer-events: none;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%);
  transition: width 0.05s linear;
  border-radius: 999px;
}

.slider-input {
  position: relative;
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  z-index: 2;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: white;
  border: 3px solid #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
  transition: all 0.2s ease;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.slider-input::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: white;
  border: 3px solid #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
  transition: all 0.2s ease;
}

.slider-input::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.slider-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Submit Button */
.submit-button {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.submit-button-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Feedback */
.feedback {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
}

.feedback-success {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.feedback-error {
  background: #fee2e2;
  color: #991b1b;
  border: 2px solid #ef4444;
}

.feedback-icon {
  font-size: 20px;
}

.feedback-text {
  flex: 1;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Responsive */
@media (max-width: 768px) {
  .histogram-wrapper {
    padding: 16px;
  }

  .chart-inner {
    height: 250px;
  }

  .bars-container {
    left: 30px;
  }

  .grid-label {
    left: -30px;
    font-size: 10px;
  }

  .histogram-title {
    font-size: 20px;
  }

  .slider-current-value {
    font-size: 18px;
  }
}
</style>