<template>
  <div class="interactive-step step-animate-in">
    <p class="text-base text-slate-600 mb-5 leading-relaxed">
      {{ getLocalizedText(step.prompt) }}
    </p>

    <!-- Sentence Display -->
    <div class="bg-slate-50/80 p-5 rounded-xl border border-slate-200/60 flex flex-wrap gap-2 items-center leading-loose mb-5">
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

    <!-- Options Panel -->
    <transition name="slide-fade">
      <div
        v-if="selectedError"
        class="bg-white p-4 rounded-xl border border-slate-200/60 mb-5"
      >
        <p class="text-sm font-medium text-slate-500 mb-3">
          Choose the correct form for:
          <span class="text-slate-900 font-bold">"{{ originalWord }}"</span>
        </p>

        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="opt in selectedError.options"
            :key="opt"
            @click="applyOption(opt)"
            class="px-4 py-2 rounded-lg border-1.5 font-medium transition-all duration-200"
            :class="{
              'bg-violet-50 text-violet-700 border-violet-200': currentWords[selectedErrorIndex] === opt,
              'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300': currentWords[selectedErrorIndex] !== opt
            }"
          >
            {{ opt }}
          </button>
        </div>

        <p class="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex items-center gap-2">
          <span class="text-sm">💡</span>
          {{ getLocalizedText(selectedError.explanation) }}
        </p>
      </div>
    </transition>

    <!-- Feedback -->
    <div v-if="feedback" class="step-feedback mb-4" :class="isCorrect ? 'success' : 'error'">
      {{ feedback }}
    </div>

    <button
      @click="checkSentence"
      :disabled="isCorrect"
      class="step-btn-primary"
      :class="{ 'step-btn-success': isCorrect }"
    >
      {{ isCorrect ? 'Correct!' : 'Check Sentence' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getLocalizedText } from '@/composables/useLanguage';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const currentWords = ref([]);
const selectedErrorIndex = ref(null);
const feedback = ref('');
const isCorrect = ref(false);

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
  if (!isError) return 'border-transparent bg-white cursor-default text-slate-800';

  const isSelected = idx === selectedErrorIndex.value;
  const errorDef = props.step.errors.find(e => e.index === idx);
  const isFixed = errorDef && currentWords.value[idx] === errorDef.correct;

  let classes = 'cursor-pointer transition-all duration-200 border ';
  if (isSelected) classes += 'ring-2 ring-violet-300 shadow-sm ';
  if (isFixed) classes += 'bg-emerald-50 text-emerald-800 border-emerald-200';
  else classes += 'bg-amber-50 text-amber-800 border-amber-200';
  return classes;
};

const handleWordClick = (idx) => {
  if (!errorIndices.value.has(idx)) { selectedErrorIndex.value = null; return; }
  selectedErrorIndex.value = idx;
  feedback.value = '';
};

const applyOption = (option) => {
  if (selectedErrorIndex.value === null) return;
  currentWords.value[selectedErrorIndex.value] = option;
};

const checkSentence = () => {
  const allCorrect = props.step.errors.every(err => currentWords.value[err.index] === err.correct);
  if (allCorrect) {
    feedback.value = 'Great! You fixed all the mistakes.';
    isCorrect.value = true;
    emit('complete', true);
  } else {
    feedback.value = 'There are still some mistakes. Tap the highlighted words.';
    isCorrect.value = false;
    emit('complete', false);
  }
};
</script>

<style scoped>
.slide-fade-enter-active { transition: all 0.25s ease-out; }
.slide-fade-leave-active { transition: all 0.15s ease-in; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-8px); opacity: 0; }
</style>
