<template>
  <div class="w-full min-h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 relative overflow-hidden">
    
    <!-- Background Decorations -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-4">
          <span class="text-lg">📊</span>
          <span class="text-xs font-medium text-slate-300 uppercase tracking-wider">Data Analysis</span>
        </div>
        <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">
          {{ step.prompt || 'Analyze the Data' }}
        </h2>
      </div>

      <!-- Chart Section -->
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
        
        <!-- Bar Chart -->
        <div class="flex items-end justify-between gap-3 h-64 mb-4">
          <div 
            v-for="(item, index) in chartData" 
            :key="index"
            class="flex-1 flex flex-col items-center gap-2"
          >
            <!-- Value Label -->
            <span class="text-sm font-bold text-white">{{ item.value }}</span>
            
            <!-- Bar -->
            <div 
              class="w-full rounded-t-lg transition-all duration-500 ease-out relative group cursor-pointer bar-animate"
              :class="getBarColor(index)"
              :style="{ height: getBarHeight(item.value) + '%', animationDelay: (index * 0.1) + 's' }"
            >
              <!-- Hover Tooltip -->
              <div class="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 z-10">
                {{ item.label }}: {{ item.value }} {{ numericLabel }}
              </div>
            </div>
            
            <!-- Label -->
            <span class="text-xs text-slate-400 text-center truncate w-full">{{ item.label }}</span>
          </div>
        </div>

        <!-- Y-Axis Label -->
        <div class="text-center">
          <span class="text-xs text-slate-500 uppercase tracking-wide">{{ numericLabel }}</span>
        </div>
      </div>

      <!-- Answer Input -->
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
        <label class="block text-sm font-medium text-slate-400 mb-3">
          Enter your answer:
        </label>
        <div class="flex gap-4">
          <input
            type="number"
            v-model.number="userAnswer"
            :disabled="isCompleted"
            :step="0.01"
            class="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            placeholder="0.00"
            @keyup.enter="checkAnswer"
          />
          <span class="flex items-center text-slate-500 text-sm">{{ numericLabel }}</span>
        </div>
        
        <!-- Hint -->
        <p class="mt-3 text-xs text-slate-500">
          💡 Tip: Calculate the average of all values (sum ÷ count)
        </p>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-center">
        <button
          v-if="!isCompleted"
          @click="checkAnswer"
          :disabled="userAnswer === null || userAnswer === ''"
          class="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-bold text-white text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:hover:scale-100"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <span class="relative flex items-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            Calculate
          </span>
        </button>

        <button
          v-else
          @click="$emit('complete', true)"
          class="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl font-bold text-white text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <span class="relative flex items-center gap-3">
            Continue
            <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </span>
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
          class="mt-6 p-6 rounded-2xl border backdrop-blur-sm"
          :class="feedback.isCorrect 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-rose-500/10 border-rose-500/30'"
        >
          <div class="flex items-start gap-4">
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              :class="feedback.isCorrect ? 'bg-emerald-500/20' : 'bg-rose-500/20'"
            >
              {{ feedback.isCorrect ? '🎯' : '📐' }}
            </div>
            <div class="flex-1">
              <h4 
                class="text-lg font-bold mb-1"
                :class="feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'"
              >
                {{ feedback.isCorrect ? 'Correct!' : 'Not quite' }}
              </h4>
              <p class="text-slate-400 text-sm">
                {{ feedback.message }}
              </p>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

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

// Computed
const numericLabel = computed(() => props.step.numericLabel || 'Value');
const numericKey = computed(() => props.step.numericKey || 'value');

const chartData = computed(() => {
  const data = props.step.data || [];
  return data.map(item => ({
    label: item.label || 'Item',
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
  
  const tolerance = props.step.tolerance || 0.5;
  const correctAnswer = props.step.correctAnswer;
  const isCorrect = Math.abs(userAnswer.value - correctAnswer) <= tolerance;
  
  isCompleted.value = true;
  feedback.value = {
    show: true,
    isCorrect,
    message: isCorrect 
      ? `Excellent! The correct answer is ${correctAnswer.toFixed(2)}. Your calculation is spot on!`
      : `The correct answer is ${correctAnswer.toFixed(2)}. You answered ${userAnswer.value.toFixed(2)}. Remember: Average = Sum of all values ÷ Number of values`
  };
  
  emit('complete', isCorrect);
};
</script>

<style scoped>
/* Animation for bars on load */
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

/* Smooth transitions */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
