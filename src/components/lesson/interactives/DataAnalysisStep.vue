<template>
  <div class="interactive-step step-animate-in w-full">
    <p class="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
      {{ step.prompt }}
    </p>

    <!-- Data Table -->
    <div class="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
      <table class="w-full text-left bg-white dark:bg-gray-800">
        <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {{ labelColumn }}
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
              {{ step.numericLabel }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr 
            v-for="(row, idx) in step.data" 
            :key="idx"
            class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
              {{ row.label }}
            </td>
            <td class="px-6 py-4 text-sm text-right font-mono text-purple-600 dark:text-purple-400">
              {{ row[step.numericKey] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Calculation Hint -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-800">
      <p class="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <span class="text-lg">💡</span>
        <span>
          <strong>Tip:</strong> Add all {{ step.numericLabel.toLowerCase() }}s together, 
          then divide by {{ step.data.length }} (the number of items).
        </span>
      </p>
    </div>

    <!-- Answer Input -->
    <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl max-w-2xl mx-auto">
      <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Enter the Mean (Average):
      </label>
      <div class="flex gap-3">
        <input
          type="number"
          v-model="userAnswer"
          :disabled="status === 'correct'"
          placeholder="e.g. 75"
          class="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                 outline-none transition-all bg-white dark:bg-gray-700
                 text-gray-900 dark:text-white"
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
  return 'bg-zinc-900 dark:bg-zinc-700 text-white hover:bg-zinc-800 dark:hover:bg-zinc-600';
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
</script>
