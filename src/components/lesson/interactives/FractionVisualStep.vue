<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🧩</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Fractions</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">{{ getLocalizedText(step.prompt) }}</h2>
    </div>

    <!-- Grids -->
    <div class="flex flex-col sm:flex-row gap-6 justify-center items-center sm:items-start">
      <!-- Target Grid (Read-only) -->
      <div class="flex flex-col items-center gap-2.5">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Target: {{ step.targetNumerator }}/{{ step.targetDenominator }}
        </span>
        <div
          class="fraction-grid"
          :style="gridStyle(step.targetDenominator)"
        >
          <div
            v-for="(_, i) in step.targetDenominator"
            :key="'target-' + i"
            class="fraction-cell"
            :class="i < step.targetNumerator ? 'active' : ''"
          />
        </div>
      </div>

      <!-- Equals Sign -->
      <div class="text-3xl font-light text-slate-300 self-center hidden sm:block">=</div>

      <!-- User Grid (Interactive) -->
      <div class="flex flex-col items-center gap-2.5">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Your Answer: {{ userShadedCount }}/{{ step.userTotalBlocks }}
        </span>
        <div
          class="fraction-grid cursor-pointer"
          :style="gridStyle(step.userTotalBlocks)"
        >
          <button
            v-for="(active, i) in userGrid"
            :key="'user-' + i"
            @click="toggleCell(i)"
            :disabled="status === 'correct'"
            class="fraction-cell focus:outline-none"
            :class="{
              'active': active,
              'locked': status === 'correct',
              '': !active && status !== 'correct'
            }"
            :aria-label="`Toggle cell ${i + 1}`"
          />
        </div>
      </div>
    </div>

    <!-- Check Button -->
    <div class="mt-6 flex justify-center">
      <button
        @click="checkAnswer"
        :disabled="status === 'correct'"
        class="step-btn-primary inline-flex items-center gap-2"
        :class="{
          'step-btn-success': status === 'correct',
          'step-btn-error': status === 'incorrect'
        }"
      >
        <svg v-if="status === 'idle'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        {{ buttonText }}
      </button>
    </div>

    <!-- Feedback -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div
        v-if="feedback"
        class="mt-4 flex items-start gap-3 p-4 rounded-xl border"
        :class="status === 'correct'
          ? 'bg-emerald-50/50 border-emerald-200/60'
          : 'bg-red-50/50 border-red-200/60'"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base shrink-0"
          :class="status === 'correct' ? 'bg-emerald-500' : 'bg-red-500'"
        >
          {{ status === 'correct' ? '🎯' : '🔄' }}
        </div>
        <div class="pt-0.5">
          <h4 class="text-sm font-bold mb-0.5" :class="status === 'correct' ? 'text-emerald-700' : 'text-red-700'">
            {{ status === 'correct' ? 'Equivalent!' : 'Not quite' }}
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed">{{ feedback }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getLocalizedText } from '@/composables/useLanguage';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const userGrid = ref([]);
const status = ref('idle');
const feedback = ref('');

// Initialize grid when step changes
watch(() => props.step, () => {
  userGrid.value = Array(props.step.userTotalBlocks).fill(false);
  status.value = 'idle';
  feedback.value = '';
}, { immediate: true });

const userShadedCount = computed(() => userGrid.value.filter(Boolean).length);

const gridStyle = (count) => {
  const cols = count <= 4 ? 2 : count <= 9 ? 3 : 4;
  return { gridTemplateColumns: `repeat(${cols}, 1fr)` };
};

const buttonText = computed(() => {
  if (status.value === 'correct') return 'Correct! (Equivalent)';
  if (status.value === 'incorrect') return 'Try again';
  return 'Check Answer';
});

const toggleCell = (index) => {
  if (status.value === 'correct') return;
  userGrid.value[index] = !userGrid.value[index];
  if (status.value === 'incorrect') {
    status.value = 'idle';
    feedback.value = '';
  }
};

const checkAnswer = () => {
  const targetVal = props.step.targetNumerator / props.step.targetDenominator;
  const userVal = userShadedCount.value / props.step.userTotalBlocks;

  if (Math.abs(targetVal - userVal) < 0.0001) {
    status.value = 'correct';
    feedback.value = `Perfect! ${userShadedCount.value}/${props.step.userTotalBlocks} = ${props.step.targetNumerator}/${props.step.targetDenominator}`;
    emit('complete', true);
  } else {
    status.value = 'incorrect';
    feedback.value = 'Not quite equivalent. Try shading a different number of cells.';
    emit('complete', false);
    setTimeout(() => {
      status.value = 'idle';
      feedback.value = '';
    }, 2000);
  }
};
</script>
