<template>
  <div class="interactive-step step-animate-in w-full">
    <!-- Debug Info -->
    <div v-if="!hasValidData" class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-4">
      <h3 class="text-lg font-bold text-yellow-800 mb-2">⚠️ Missing Data</h3>
      <p class="text-sm text-yellow-700 mb-2">This step is missing required data to render properly.</p>
      <details class="text-xs text-yellow-600">
        <summary class="cursor-pointer font-semibold mb-2">Debug Information</summary>
        <pre class="bg-white p-3 rounded border border-yellow-300 overflow-auto">{{ JSON.stringify(step, null, 2) }}</pre>
      </details>
    </div>

    <template v-if="hasValidData">
      <p class="text-lg text-gray-600 mb-8 leading-relaxed">
        {{ step.prompt }}
      </p>

    <!-- Data Table -->
    <div class="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 shadow-sm mb-8">
      <table class="w-full text-left bg-white">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {{ labelColumn }}
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
              {{ step.numericLabel }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr 
            v-for="(row, idx) in step.data" 
            :key="idx"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-6 py-4 text-sm font-medium text-gray-900">
              {{ row.label }}
            </td>
            <td class="px-6 py-4 text-sm text-right font-mono text-purple-600">
              {{ row[step.numericKey] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Calculation Hint -->
    <div class="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
      <p class="text-sm text-blue-700 flex items-center gap-2">
        <span class="text-lg">💡</span>
        <span>
          <strong>Tip:</strong> Add all {{ step.numericLabel.toLowerCase() }}s together, 
          then divide by {{ step.data.length }} (the number of items).
        </span>
      </p>
    </div>

    <!-- Answer Input -->
    <div class="bg-gray-50 p-6 rounded-xl max-w-2xl mx-auto">
      <label class="block text-sm font-semibold text-gray-700 mb-3">
        Enter the Mean (Average):
      </label>
      <div class="flex gap-3">
        <input
          type="number"
          v-model="userAnswer"
          :disabled="status === 'correct'"
          placeholder="e.g. 75"
          class="flex-1 p-3 border border-gray-300 rounded-lg 
                 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                 outline-none transition-all bg-white
                 text-gray-900"
          @keyup.enter="checkAnswer"
          @input="resetStatus"
        />
        <button
          v-if="attemptCount < maxAttempts"
          @click="checkAnswer"
          :disabled="status === 'correct' || !userAnswer"
          class="px-6 py-3 rounded-lg font-bold transition-all"
          :class="buttonClass"
        >
          {{ buttonText }}
        </button>
        <button
          v-else
          @click="skipExercise"
          class="px-6 py-3 rounded-lg font-bold transition-all bg-orange-500 text-white hover:bg-orange-600"
        >
          Skip → Continue Anyway
        </button>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="feedback" class="step-feedback mt-4" :class="status">
      {{ feedback }}
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  step: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['complete']);

const userAnswer = ref('');
const status = ref('idle'); // 'idle' | 'correct' | 'incorrect'
const feedback = ref('');
const attemptCount = ref(0);
const maxAttempts = 3;

const labelColumn = computed(() => {
  // Auto-detect first non-numeric column name
  if (props.step.data?.[0]) {
    const keys = Object.keys(props.step.data[0]);
    return keys.find(k => k !== props.step.numericKey) || 'Item';
  }
  return 'Item';
});

const buttonText = computed(() => {
  if (status.value === 'correct') return '✓ Correct!';
  if (status.value === 'incorrect') return 'Try Again';
  return 'Check';
});

const buttonClass = computed(() => {
  if (status.value === 'correct') {
    return 'bg-green-100 text-green-700 cursor-default';
  }
  if (status.value === 'incorrect') {
    return 'bg-red-100 text-red-700 hover:bg-red-200';
  }
  return 'bg-zinc-900 text-white hover:bg-zinc-800';
});

const resetStatus = () => {
  if (status.value === 'incorrect') {
    status.value = 'idle';
    feedback.value = '';
  }
};

const checkAnswer = () => {
  attemptCount.value++;
  const val = parseFloat(userAnswer.value);
  if (isNaN(val)) {
    feedback.value = 'Please enter a valid number';
    return;
  }

  const diff = Math.abs(val - props.step.correctAnswer);
  const isCorrect = diff <= (props.step.tolerance || 1);

  if (isCorrect) {
    status.value = 'correct';
    feedback.value = '🎉 Excellent! That\'s the correct mean.';
    emit('complete', true);
  } else {
    status.value = 'incorrect';
    feedback.value = '❌ Not quite. Try calculating again.';
    emit('complete', false);
  }
};

const skipExercise = () => {
  emit('complete', false);
};

const hasValidData = computed(() => {
  if (!props.step) {
    console.warn('DataAnalysisStep: No step data provided');
    return false;
  }
  if (!props.step.data || !Array.isArray(props.step.data) || props.step.data.length === 0) {
    console.warn('DataAnalysisStep: Missing or invalid data array', props.step);
    return false;
  }
  if (!props.step.numericKey) {
    console.warn('DataAnalysisStep: Missing numericKey', props.step);
    return false;
  }
  if (props.step.correctAnswer === undefined || props.step.correctAnswer === null) {
    console.warn('DataAnalysisStep: Missing correctAnswer', props.step);
    return false;
  }
  return true;
});

import { onMounted } from 'vue';
onMounted(() => {
  console.log('DataAnalysisStep mounted with props:', props.step);
  console.log('Has valid data:', hasValidData.value);
  console.log('Prompt:', props.step?.prompt);
  console.log('Data array:', props.step?.data);
  console.log('Numeric key:', props.step?.numericKey);
  console.log('Correct answer:', props.step?.correctAnswer);
});
</script>
