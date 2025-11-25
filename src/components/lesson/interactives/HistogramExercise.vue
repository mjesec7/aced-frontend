<template>
  <div class="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
    <div class="p-6 md:p-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-2">{{ title }}</h2>
        <p class="text-slate-600">{{ description }}</p>
      </div>

      <!-- Chart Container -->
      <div class="relative h-64 md:h-80 w-full mb-8">
        <Bar
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
        />
      </div>

      <!-- Interactive Slider Section -->
      <div class="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm font-semibold text-slate-500">{{ minLabel }}</span>
          <div class="bg-slate-900 text-white px-3 py-1 rounded-lg font-mono font-bold text-lg">
            {{ currentValue }}
          </div>
          <span class="text-sm font-semibold text-slate-500">{{ maxLabel }}</span>
        </div>

        <div class="relative w-full h-12 flex items-center">
          <input
            type="range"
            :min="min"
            :max="max"
            :step="step"
            v-model.number="currentValue"
            class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-700 transition-all"
            :disabled="isCorrect"
          />
        </div>
        
        <p class="text-center text-sm text-slate-500 mt-2">
          Drag the slider to select the value
        </p>
      </div>

      <!-- Feedback & Action -->
      <div class="mt-8 flex flex-col items-center">
        <transition name="fade-scale" mode="out-in">
          <div v-if="showFeedback" class="mb-6 text-center">
            <div 
              class="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2"
              :class="isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'"
            >
              <span class="text-xl font-bold">{{ isCorrect ? '✓' : '✕' }}</span>
              <span class="font-semibold">{{ isCorrect ? 'Correct!' : 'Try Again' }}</span>
            </div>
          </div>
        </transition>

        <button
          v-if="!isCorrect"
          @click="checkAnswer"
          class="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all transform active:scale-95 shadow-lg hover:shadow-xl"
        >
          Check Answer
        </button>
        
        <button
          v-else
          @click="$emit('next')"
          class="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all transform active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          Continue <span class="text-xl">→</span>
        </button>
      </div>
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
    default: 'Data Analysis'
  },
  description: {
    type: String,
    default: 'Analyze the histogram and find the specific value.'
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
  },
  minLabel: {
    type: String,
    default: '0'
  },
  maxLabel: {
    type: String,
    default: '100'
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
      backgroundColor: '#eab308', // Yellow-500 matching the reference
      hoverBackgroundColor: '#ca8a04',
      borderRadius: 4,
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
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      titleFont: { size: 14 },
      bodyFont: { size: 14 },
      cornerRadius: 8,
      displayColors: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f1f5f9'
      },
      ticks: {
        font: { family: "'Inter', sans-serif" }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: { family: "'Inter', sans-serif" }
      }
    }
  }
};

const checkAnswer = () => {
  // Allow for a small margin of error if needed, but for exact values:
  if (currentValue.value === props.correctValue) {
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
/* Custom Range Slider Styling */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  border: 4px solid #7c3aed; /* purple-600 */
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  margin-top: -8px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
}

input[type=range]::-moz-range-thumb {
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  border: 4px solid #7c3aed;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 8px;
  cursor: pointer;
  background: #e2e8f0;
  border-radius: 4px;
}

input[type=range]:focus::-webkit-slider-runnable-track {
  background: #cbd5e1;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
