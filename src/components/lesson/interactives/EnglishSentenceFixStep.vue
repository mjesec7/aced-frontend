<template>
  <div class="interactive-step step-animate-in">
    <p class="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
      {{ step.prompt }}
    </p>

    <!-- Sentence Display -->
    <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center leading-loose mb-6">
      <button
        v-for="(word, idx) in currentWords"
        :key="idx"
        @click="handleWordClick(idx)"
        class="sentence-token"
        :class="getTokenClass(idx)"
      >
        {{ word }}
      </button>
    </div>

    <!-- Options Panel (shown when error word selected) -->
    <transition name="slide-fade">
      <div 
        v-if="selectedError" 
        class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 animate-fade-in"
      >
        <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
          Choose the correct form for: 
          <span class="text-gray-900 dark:text-white font-bold">"{{ originalWord }}"</span>
        </p>
        
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="opt in selectedError.options"
            :key="opt"
            @click="applyOption(opt)"
            class="px-4 py-2 rounded-lg border font-medium transition-colors"
            :class="{
              'bg-purple-100 text-purple-700 border-purple-300': currentWords[selectedErrorIndex] === opt,
              'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600': currentWords[selectedErrorIndex] !== opt
            }"
          >
            {{ opt }}
          </button>
        </div>
        
        <p class="text-xs text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
          <span class="text-lg">💡</span>
          {{ selectedError.explanation }}
        </p>
      </div>
    </transition>

    <!-- Feedback -->
    <div class="step-feedback mb-4" :class="isCorrect ? 'success' : 'error'">
      {{ feedback }}
    </div>

    <button
      @click="checkSentence"
      :disabled="isCorrect"
      class="px-6 py-3 rounded-full font-bold text-white shadow-md transition-transform active:scale-95"
      :class="{
        'bg-green-500 cursor-default': isCorrect,
        'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700': !isCorrect
      }"
    >
      {{ isCorrect ? 'Correct!' : 'Check Sentence' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const currentWords = ref([]);
const selectedErrorIndex = ref(null);
const feedback = ref('');
const isCorrect = ref(false);

// Initialize
watch(() => props.step, () => {
  if (props.step.tokens?.length) {
    currentWords.value = [...props.step.tokens];
  } else {
    currentWords.value = props.step.originalSentence.split(' ');
  }
  feedback.value = '';
  isCorrect.value = false;
  selectedErrorIndex.value = null;
}, { immediate: true });

const errorIndices = computed(() => new Set(props.step.errors.map(e => e.index)));

const selectedError = computed(() => {
  if (selectedErrorIndex.value === null) return null;
  return props.step.errors.find(e => e.index === selectedErrorIndex.value);
});

const originalWord = computed(() => {
  if (selectedErrorIndex.value === null) return '';
  return props.step.tokens[selectedErrorIndex.value];
});

const getTokenClass = (idx) => {
  const isError = errorIndices.value.has(idx);
  if (!isError) return 'border-transparent bg-white dark:bg-gray-700 cursor-default text-gray-800 dark:text-gray-200';

  const isSelected = idx === selectedErrorIndex.value;
  const errorDef = props.step.errors.find(e => e.index === idx);
  const isFixed = errorDef && currentWords.value[idx] === errorDef.correct;

  let classes = 'cursor-pointer transition-all duration-200 border ';
  
  if (isSelected) {
    classes += 'ring-2 ring-purple-500 shadow-sm ';
  }

  if (isFixed) {
    classes += 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
  } else {
    classes += 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700';
  }

  return classes;
};

const handleWordClick = (idx) => {
  if (!errorIndices.value.has(idx)) {
    selectedErrorIndex.value = null;
    return;
  }
  selectedErrorIndex.value = idx;
  feedback.value = '';
};

const applyOption = (option) => {
  if (selectedErrorIndex.value === null) return;
  currentWords.value[selectedErrorIndex.value] = option;
};

const checkSentence = () => {
  const allCorrect = props.step.errors.every(
    err => currentWords.value[err.index] === err.correct
  );

  if (allCorrect) {
    feedback.value = '✅ Great! You fixed all the mistakes.';
    isCorrect.value = true;
    emit('complete', true);
  } else {
    feedback.value = '❌ There are still some mistakes. Tap the highlighted words.';
    isCorrect.value = false;
    emit('complete', false);
  }
};
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
