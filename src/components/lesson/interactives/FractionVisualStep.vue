<template>
  <div class="interactive-step step-animate-in">
    <p class="text-lg text-gray-600 mb-6 leading-relaxed">
      {{ step.prompt }}
    </p>

    <div class="flex flex-col sm:flex-row gap-8 justify-center items-center sm:items-start">
      <!-- Target Grid (Read-only) -->
      <div class="flex flex-col items-center gap-3">
        <span class="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Target: {{ step.targetNumerator }}/{{ step.targetDenominator }}
        </span>
        <div 
          class="grid gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 shadow-inner"
          :style="gridStyle(step.targetDenominator)"
        >
          <div
            v-for="(_, i) in step.targetDenominator"
            :key="'target-' + i"
            class="w-12 h-12 rounded-lg border-2 transition-all duration-300"
            :class="i < step.targetNumerator 
              ? 'bg-blue-500 border-blue-600' 
              : 'bg-white border-gray-200
          />
        </div>
      </div>

      <!-- Equals Sign -->
      <div class="text-4xl font-light text-gray-300 self-center hidden sm:block">=</div>

      <!-- User Grid (Interactive) -->
      <div class="flex flex-col items-center gap-3">
        <span class="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Your Answer: {{ userShadedCount }}/{{ step.userTotalBlocks }}
        </span>
        <div 
          class="grid gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 shadow-inner cursor-pointer"
          :style="gridStyle(step.userTotalBlocks)"
        >
          <button
            v-for="(active, i) in userGrid"
            :key="'user-' + i"
            @click="toggleCell(i)"
            :disabled="status === 'correct'"
            class="w-12 h-12 rounded-lg border-2 transition-all duration-200 transform focus:outline-none"
            :class="{
              'bg-blue-500 border-blue-600 shadow-md': active,
              'bg-white border-gray-200 hover:border-blue-300 hover:scale-105 active:scale-95': !active && status !== 'correct'
            }"
            :aria-label="`Toggle cell ${i + 1}`"
          />
        </div>
      </div>
    </div>

    <!-- Check Button -->
    <div class="mt-8">
      <button
        @click="checkAnswer"
        :disabled="status === 'correct'"
        class="w-full py-4 rounded-xl font-bold text-lg transition-all shadow-sm"
        :class="buttonClass"
      >
        {{ buttonText }}
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="feedback" class="step-feedback mt-4" :class="status">
      {{ feedback }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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
  if (status.value === 'correct') return '✅ Correct! (Equivalent)';
  if (status.value === 'incorrect') return '❌ Try again';
  return 'Check Answer';
});

const buttonClass = computed(() => {
  if (status.value === 'correct') {
    return 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-2 cursor-default';
  }
  if (status.value === 'incorrect') {
    return 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-2';
  }
  return 'bg-gray-100 text-gray-900 hover:bg-gray-200
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
    feedback.value = `🎉 Perfect! ${userShadedCount.value}/${props.step.userTotalBlocks} = ${props.step.targetNumerator}/${props.step.targetDenominator}`;
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
