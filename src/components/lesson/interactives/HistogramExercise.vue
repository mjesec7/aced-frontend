<template>
  <div class="histogram-exercise">
    <!-- Header - Only show once -->
    <div class="exercise-header">
      <h2 class="exercise-title">{{ title }}</h2>
      <p class="exercise-description">{{ description }}</p>
    </div>

    <!-- Chart Container -->
    <div class="chart-container">
      <Bar
        v-if="chartData"
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <!-- Interactive Slider Section -->
    <div class="slider-section">
      <div class="slider-header">
        <span class="slider-label">{{ minLabel || 'Population' }}</span>
        <div class="current-value-display">
          <span class="value-number">{{ currentValue }}</span>
        </div>
        <span class="slider-label">{{ maxLabel || max + 'k' }}</span>
      </div>

      <div class="slider-wrapper">
        <div class="slider-track">
          <div 
            class="slider-fill" 
            :style="{ width: `${((currentValue - min) / (max - min)) * 100}%` }"
          ></div>
        </div>
        <input
          type="range"
          :min="min"
          :max="max"
          :step="step"
          v-model.number="currentValue"
          class="slider-input"
          :disabled="isCorrect"
        />
      </div>
      
      <p class="slider-hint">Drag the slider to select the value</p>
    </div>

    <!-- Feedback & Action -->
    <div class="action-section">
      <transition name="feedback-transition" mode="out-in">
        <div v-if="showFeedback" class="feedback-container">
          <div :class="['feedback-badge', isCorrect ? 'feedback-success' : 'feedback-error']">
            <span class="feedback-icon">{{ isCorrect ? '✓' : '✕' }}</span>
            <span class="feedback-text">{{ isCorrect ? 'Correct!' : 'Try Again' }}</span>
          </div>
        </div>
      </transition>

      <button
        v-if="!isCorrect"
        @click="checkAnswer"
        class="btn-check"
      >
        Check Answer
      </button>
      
      <button
        v-else
        @click="$emit('next')"
        class="btn-continue"
      >
        Continue
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { Bar } from 'vue-chartjs';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    default: 'City Population Distribution'
  },
  description: {
    type: String,
    default: 'Use the slider to find the median population value'
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
    default: 100000
  },
  step: {
    type: Number,
    default: 100
  },
  minLabel: {
    type: String,
    default: 'Population'
  },
  maxLabel: {
    type: String,
    default: '80k'
  }
});

const emit = defineEmits(['next', 'complete']);

const currentValue = ref(Math.floor((props.max - props.min) / 2));
const showFeedback = ref(false);
const isCorrect = ref(false);

// Chart Configuration
const chartData = computed(() => ({
  labels: props.data.labels,
  datasets: [
    {
      label: 'Frequency',
      backgroundColor: '#FBBF24', // Amber/Yellow matching screenshot
      hoverBackgroundColor: '#F59E0B',
      borderRadius: 6,
      borderSkipped: false,
      data: props.data.values
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: false // We have our own header
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      titleFont: { 
        size: 13, 
        weight: '600',
        family: "'Inter', 'Segoe UI', sans-serif" 
      },
      bodyFont: { 
        size: 14,
        family: "'Inter', 'Segoe UI', sans-serif" 
      },
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: function(context) {
          return `Count: ${context.raw}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
        drawBorder: false
      },
      border: {
        display: false
      },
      ticks: {
        font: { 
          family: "'Inter', 'Segoe UI', sans-serif",
          size: 12 
        },
        color: '#64748B',
        padding: 8
      }
    },
    x: {
      grid: {
        display: false
      },
      border: {
        display: false
      },
      ticks: {
        font: { 
          family: "'Inter', 'Segoe UI', sans-serif",
          size: 11 
        },
        color: '#64748B',
        padding: 8
      }
    }
  },
  layout: {
    padding: {
      top: 10,
      bottom: 10
    }
  }
};

const checkAnswer = () => {
  // Allow for a tolerance based on step size
  const tolerance = props.step * 2;
  if (Math.abs(currentValue.value - props.correctValue) <= tolerance) {
    isCorrect.value = true;
    showFeedback.value = true;
    emit('complete', true);
  } else {
    isCorrect.value = false;
    showFeedback.value = true;
    setTimeout(() => {
      showFeedback.value = false;
    }, 2000);
  }
};
</script>

<style scoped>
.histogram-exercise {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.08),
    0 20px 25px -5px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

/* Header */
.exercise-header {
  padding: 24px 28px 18px;
  text-align: center;
  background: linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.exercise-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.exercise-description {
  font-size: 0.9rem;
  color: #64748B;
  margin: 0;
  line-height: 1.5;
}

/* Chart Container */
.chart-container {
  position: relative;
  height: 240px;
  padding: 20px 20px 14px;
  background: #FFFFFF;
}

/* Slider Section */
.slider-section {
  padding: 24px 32px 28px;
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.slider-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.current-value-display {
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
  padding: 8px 20px;
  border-radius: 12px;
  box-shadow: 
    0 4px 12px rgba(30, 41, 59, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.value-number {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 0.02em;
}

/* Custom Slider */
.slider-wrapper {
  position: relative;
  height: 48px;
  display: flex;
  align-items: center;
}

.slider-track {
  position: absolute;
  width: 100%;
  height: 12px;
  background: #CBD5E1;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.15),
    0 1px 2px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border: 1px solid #94A3B8;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B5CF6 0%, #A855F7 100%);
  border-radius: 6px;
  transition: width 0.1s ease-out;
  box-shadow: 0 1px 3px rgba(139, 92, 246, 0.5);
}

.slider-input {
  position: relative;
  width: 100%;
  height: 48px;
  cursor: pointer;
  z-index: 20;
  margin: 0;
  background: transparent;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.slider-input::-webkit-slider-runnable-track {
  height: 10px;
  background: transparent;
  border: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 26px;
  height: 26px;
  background: #FFFFFF;
  border: 4px solid #8B5CF6;
  border-radius: 50%;
  margin-top: -8px;
  cursor: grab;
  box-shadow: 
    0 2px 8px rgba(139, 92, 246, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 
    0 3px 12px rgba(139, 92, 246, 0.5),
    0 6px 16px rgba(0, 0, 0, 0.2);
}

.slider-input::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
}

.slider-input::-moz-range-track {
  height: 10px;
  background: transparent;
  border: none;
}

.slider-input::-moz-range-thumb {
  width: 26px;
  height: 26px;
  background: #FFFFFF;
  border: 4px solid #8B5CF6;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 
    0 2px 8px rgba(139, 92, 246, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.slider-input::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 
    0 3px 12px rgba(139, 92, 246, 0.5),
    0 6px 16px rgba(0, 0, 0, 0.2);
}

.slider-input::-moz-range-thumb:active {
  cursor: grabbing;
}

.slider-input:disabled {
  cursor: not-allowed;
}

.slider-thumb-indicator {
  display: none; /* Hide the custom indicator since browser native works better */
}

.slider-hint {
  text-align: center;
  font-size: 0.85rem;
  color: #94A3B8;
  margin: 16px 0 0 0;
}

/* Action Section */
.action-section {
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: #FFFFFF;
}

.feedback-container {
  margin-bottom: 8px;
}

.feedback-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.95rem;
  border: 2px solid;
  transition: all 0.3s ease;
}

.feedback-success {
  background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
  border-color: #6EE7B7;
  color: #047857;
}

.feedback-error {
  background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
  border-color: #FCA5A5;
  color: #DC2626;
}

.feedback-icon {
  font-size: 1.1rem;
  font-weight: 700;
}

/* Buttons */
.btn-check,
.btn-continue {
  padding: 14px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-check {
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
  color: #FFFFFF;
  box-shadow: 
    0 4px 14px rgba(30, 41, 59, 0.25),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-check:hover {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(30, 41, 59, 0.3),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-check:active {
  transform: translateY(0) scale(0.98);
}

.btn-continue {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #FFFFFF;
  box-shadow: 
    0 4px 14px rgba(16, 185, 129, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-continue:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(16, 185, 129, 0.35),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-continue:active {
  transform: translateY(0) scale(0.98);
}

.btn-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2.5;
}

/* Transitions */
.feedback-transition-enter-active,
.feedback-transition-leave-active {
  transition: all 0.3s ease;
}

.feedback-transition-enter-from,
.feedback-transition-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .histogram-exercise {
    border-radius: 16px;
    margin: 0;
  }

  .exercise-header {
    padding: 18px 18px 14px;
  }

  .exercise-title {
    font-size: 1.15rem;
  }

  .exercise-description {
    font-size: 0.85rem;
  }

  .chart-container {
    height: 200px;
    padding: 14px 12px;
  }

  .slider-section {
    padding: 18px 18px 20px;
  }

  .slider-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .slider-label {
    font-size: 0.7rem;
  }

  .current-value-display {
    order: -1;
    width: 100%;
    text-align: center;
    margin-bottom: 6px;
    padding: 6px 16px;
  }

  .value-number {
    font-size: 1.1rem;
  }

  .action-section {
    padding: 18px 18px 24px;
  }

  .btn-check,
  .btn-continue {
    width: 100%;
    justify-content: center;
    padding: 14px 20px;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .chart-container {
    height: 180px;
    padding: 12px 8px;
  }

  .slider-section {
    padding: 16px 16px 18px;
  }

  .slider-wrapper {
    height: 40px;
  }

  .slider-track {
    height: 8px;
  }

  .slider-input::-webkit-slider-thumb {
    width: 22px;
    height: 22px;
    border: 3px solid #8B5CF6;
  }

  .slider-input::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border: 3px solid #8B5CF6;
  }
}
</style>
