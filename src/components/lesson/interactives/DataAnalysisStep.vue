<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">📊</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Data Analysis</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ getLocalizedText(step.prompt) || 'Analyze the Data' }}
      </h2>
    </div>

    <!-- Chart Section -->
    <div class="bg-slate-50/80 rounded-xl border border-slate-200/60 p-4 mb-4">
      <div class="flex items-end justify-around gap-2 h-36 mb-2 px-1">
        <div
          v-for="(item, index) in chartData"
          :key="index"
          class="flex-1 max-w-[72px] flex flex-col items-center gap-1.5"
        >
          <span class="text-xs font-bold text-slate-700">{{ item.value }}</span>
          <div
            class="w-full rounded-t-lg transition-all duration-500 relative group"
            :class="barColors[index % barColors.length]"
            :style="{ height: getBarHeight(item.value) + '%', animationDelay: (index * 0.08) + 's' }"
            style="animation: growUp 0.5s ease-out backwards;"
          >
            <div class="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-800 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {{ item.label }}: {{ item.value }} {{ numericLabel }}
            </div>
          </div>
          <span class="text-[11px] font-medium text-slate-500 text-center truncate w-full">{{ item.label }}</span>
        </div>
      </div>
      <div class="text-center pt-2 border-t border-slate-100">
        <span class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{{ numericLabel }}</span>
      </div>
    </div>

    <!-- Answer Input -->
    <div class="bg-white rounded-xl border border-slate-200/60 p-4 mb-4">
      <label class="block text-sm font-semibold text-slate-700 mb-2">Enter your answer:</label>
      <div class="flex gap-3 items-center">
        <input
          type="number"
          v-model.number="userAnswer"
          :disabled="isCompleted"
          :step="0.01"
          class="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base font-mono font-bold focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50 disabled:bg-slate-100 transition-all"
          placeholder="0.00"
          @keyup.enter="checkAnswer"
        />
        <span class="text-sm text-slate-500 font-semibold px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">{{ numericLabel }}</span>
      </div>
      <p class="mt-2.5 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
        💡 Tip: Calculate the average of all values (sum ÷ count)
      </p>
    </div>

    <!-- Button -->
    <div class="flex justify-center mb-3">
      <button
        v-if="!isCompleted"
        @click="checkAnswer"
        :disabled="userAnswer === null || userAnswer === ''"
        class="step-btn-primary inline-flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
        Calculate
      </button>
      <button
        v-else
        @click="$emit('complete', true)"
        class="step-btn-primary step-btn-success inline-flex items-center gap-2"
      >
        Continue
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
      </button>
    </div>

    <!-- Feedback -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div
        v-if="feedback.show"
        class="flex items-start gap-3 p-4 rounded-xl border"
        :class="feedback.isCorrect
          ? 'bg-emerald-50/50 border-emerald-200/60'
          : 'bg-red-50/50 border-red-200/60'"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base shrink-0"
          :class="feedback.isCorrect ? 'bg-emerald-500' : 'bg-red-500'"
        >
          {{ feedback.isCorrect ? '🎯' : '📐' }}
        </div>
        <div class="pt-0.5">
          <h4 class="text-sm font-bold mb-0.5" :class="feedback.isCorrect ? 'text-emerald-700' : 'text-red-700'">
            {{ feedback.isCorrect ? 'Correct!' : 'Not quite' }}
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed">{{ feedback.message }}</p>
        </div>
      </div>
    </transition>
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

const userAnswer = ref(null);
const isCompleted = ref(false);
const feedback = ref({ show: false, isCorrect: false, message: '' });

const barColors = [
  'bg-violet-400', 'bg-indigo-400', 'bg-blue-400',
  'bg-cyan-400', 'bg-teal-400', 'bg-emerald-400'
];

const numericLabel = computed(() => {
  const label = props.step?.numericLabel || props.step?.numeric_label || props.step?.content?.numericLabel || 'Value';
  return getLocalizedText(label) || label;
});

const numericKey = computed(() => props.step?.numericKey || props.step?.numeric_key || props.step?.content?.numericKey || 'value');

const chartData = computed(() => {
  const data = props.step?.data || props.step?.content?.data || [];
  if (!Array.isArray(data)) return [];
  return data.map(item => ({
    label: getLocalizedText(item.label) || item.label || 'Item',
    value: item[numericKey.value] || item.value || 0
  }));
});

const maxValue = computed(() => {
  if (chartData.value.length === 0) return 100;
  return Math.max(...chartData.value.map(d => d.value));
});

const getBarHeight = (value) => {
  if (!value || !maxValue.value) return 5;
  return Math.max(12, (value / maxValue.value) * 100);
};

const checkAnswer = () => {
  if (userAnswer.value === null) return;
  const tolerance = props.step?.tolerance || props.step?.content?.tolerance || 0.5;
  const correctAnswer = props.step?.correctAnswer || props.step?.correct_answer || props.step?.content?.correctAnswer;
  if (correctAnswer === undefined || correctAnswer === null) return;

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
@keyframes growUp {
  from { transform: scaleY(0); transform-origin: bottom; }
  to { transform: scaleY(1); transform-origin: bottom; }
}
</style>
