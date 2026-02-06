<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">📊</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Histogram</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">{{ title || 'Data Visualization' }}</h2>
      <p v-if="description" class="text-sm text-slate-500 mt-1 leading-relaxed">{{ description }}</p>
    </div>

    <!-- Chart Section -->
    <div class="bg-slate-50/80 rounded-xl border border-slate-200/60 p-4 mb-4">
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
            <div
              class="bar"
              :class="{ 'bar-selected': selectedIndex === index }"
              :style="{ height: `${(value / maxValue) * 100}%` }"
            >
              <div class="bar-value">{{ value }}</div>
            </div>
            <div class="bar-label">{{ chartData.labels[index] }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slider Section -->
    <div class="bg-white rounded-xl border border-slate-200/60 p-4 mb-4">
      <div class="flex justify-between items-center mb-3">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Value</span>
        <span class="text-lg font-bold text-violet-600">{{ currentValue }}</span>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <span class="text-xs font-semibold text-slate-400 min-w-[40px] text-right">{{ min }}</span>
        <div class="slider-track-wrapper flex-1">
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
        <span class="text-xs font-semibold text-slate-400 min-w-[40px]">{{ max }}</span>
      </div>

      <!-- Submit Button -->
      <button
        @click="checkAnswer"
        :disabled="isLocked"
        class="step-btn-primary w-full"
        :class="{ 'step-btn-success': isLocked }"
      >
        {{ isLocked ? 'Correct!' : 'Submit Answer' }}
      </button>
    </div>

    <!-- Feedback -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="feedback"
        class="flex items-start gap-3 p-4 rounded-xl border"
        :class="isCorrect
          ? 'bg-emerald-50/50 border-emerald-200/60'
          : 'bg-red-50/50 border-red-200/60'"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base shrink-0"
          :class="isCorrect ? 'bg-emerald-500' : 'bg-red-500'"
        >
          {{ isCorrect ? '🎯' : '💫' }}
        </div>
        <div class="pt-0.5">
          <h4 class="text-sm font-bold mb-0.5" :class="isCorrect ? 'text-emerald-700' : 'text-red-700'">
            {{ isCorrect ? 'Perfect!' : 'Not quite' }}
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed">{{ feedback }}</p>
        </div>
      </div>
    </transition>
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
/* Chart Layout */
.chart-inner {
  position: relative;
  height: 220px;
}

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
  background: rgba(226, 232, 240, 0.6);
  position: relative;
}

.grid-label {
  position: absolute;
  left: -36px;
  top: -8px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.bars-container {
  position: absolute;
  bottom: 0;
  left: 36px;
  right: 0;
  height: calc(100% - 30px);
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 6px;
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
  max-width: 56px;
  background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 6px 6px 0 0;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 1px 4px rgba(139, 92, 246, 0.15);
}

.bar:hover {
  background: linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(139, 92, 246, 0.25);
}

.bar-selected {
  background: linear-gradient(180deg, #6366f1 0%, #4f46e5 100%) !important;
  box-shadow: 0 3px 12px rgba(99, 102, 241, 0.3) !important;
  transform: scale(1.03) !important;
}

.bar-value {
  position: absolute;
  top: -26px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
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
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

/* Slider */
.slider-track-wrapper {
  position: relative;
  height: 36px;
  display: flex;
  align-items: center;
}

.slider-track {
  position: absolute;
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  pointer-events: none;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
  transition: width 0.05s linear;
  border-radius: 999px;
}

.slider-input {
  position: relative;
  width: 100%;
  height: 6px;
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
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid #7c3aed;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: all 0.15s;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.slider-input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid #7c3aed;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: all 0.15s;
}

.slider-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 768px) {
  .chart-inner {
    height: 180px;
  }

  .bars-container {
    left: 28px;
  }

  .grid-label {
    left: -28px;
    font-size: 10px;
  }
}
</style>
