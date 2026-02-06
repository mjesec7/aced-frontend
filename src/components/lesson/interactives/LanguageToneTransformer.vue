<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🎭</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Tone Transformer</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ getLocalizedText(step.prompt) || 'Transform the sentence to match the target tone' }}
      </h2>
    </div>

    <!-- Original Sentence Display -->
    <div class="relative mb-6">
      <div class="absolute -top-2.5 left-3 px-2 py-0.5 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider z-10 border border-slate-200/60 rounded-md">
        Original ({{ getRegisterLabel(step.originalTone) }})
      </div>
      <div class="bg-slate-50/80 border border-slate-200/60 rounded-xl p-5 pt-4">
        <p class="text-base text-slate-800 font-medium leading-relaxed mt-1">
          "{{ getLocalizedText(step.originalSentence) }}"
        </p>
        <div class="mt-2.5 flex items-center gap-2">
          <ToneIndicator :tone="step.originalTone" />
        </div>
      </div>
    </div>

    <!-- Transform Arrow -->
    <div class="flex justify-center mb-6">
      <div class="relative">
        <div class="w-12 h-12 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center transform-arrow">
          <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
        </div>
        <div class="absolute -right-28 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-violet-600 font-semibold text-xs whitespace-nowrap">
          Transform to: {{ getRegisterLabel(step.targetTone) }}
        </div>
      </div>
    </div>

    <!-- Target Tone Display -->
    <div class="relative mb-6">
      <div class="absolute -top-2.5 left-3 px-2 py-0.5 bg-white text-[10px] font-bold uppercase tracking-wider z-10 border rounded-md"
           :class="getToneColorClass(step.targetTone) + ' border-slate-200/60'">
        Target: {{ getRegisterLabel(step.targetTone) }}
      </div>
      <div
        class="border rounded-xl p-5 pt-4 transition-all duration-300"
        :class="getTargetBoxClass()"
      >
        <!-- Word Selection Mode -->
        <div v-if="!isCorrect" class="space-y-3 mt-1">
          <p class="text-xs text-slate-400">Click on words to build your transformed sentence:</p>

          <!-- Current Answer Preview -->
          <div class="min-h-[48px] bg-white rounded-lg border border-dashed border-slate-200 p-3 flex flex-wrap gap-1.5 items-center">
            <span v-if="selectedWords.length === 0" class="text-slate-300 italic text-sm">
              Your sentence will appear here...
            </span>
            <div
              v-for="(word, idx) in selectedWords"
              :key="`selected-${idx}`"
              @click="removeWord(idx)"
              class="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-sm font-medium cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors group"
            >
              {{ word }}
              <span class="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs">x</span>
            </div>
          </div>

          <!-- Available Word Chips -->
          <div class="flex flex-wrap gap-1.5 justify-center">
            <button
              v-for="(word, idx) in availableWords"
              :key="`word-${idx}`"
              @click="selectWord(idx)"
              :disabled="usedIndices.includes(idx)"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
              :class="usedIndices.includes(idx)
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                : 'bg-white border border-slate-200/60 text-slate-700 hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-sm'"
            >
              {{ word }}
            </button>
          </div>

          <!-- Punctuation helpers -->
          <div class="flex justify-center gap-1.5 mt-2">
            <button
              v-for="punct in ['.', '!', '?', ',', '...']"
              :key="punct"
              @click="addPunctuation(punct)"
              class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold transition-colors cursor-pointer"
            >
              {{ punct }}
            </button>
            <button
              @click="clearSelection"
              class="px-3 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Success State -->
        <div v-else class="text-center mt-1">
          <p class="text-base font-medium leading-relaxed" :class="getToneTextClass(step.targetTone)">
            "{{ selectedWords.join(' ') }}"
          </p>
          <div class="mt-2.5 flex items-center justify-center gap-2">
            <ToneIndicator :tone="step.targetTone" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tone Guide -->
    <div v-if="!isCorrect && step.showGuide !== false" class="mb-5 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
      <div class="flex items-start gap-2.5">
        <span class="text-sm">💡</span>
        <div>
          <p class="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-0.5">Tone Guide: {{ getRegisterLabel(step.targetTone) }}</p>
          <p class="text-xs text-indigo-600/80 leading-relaxed">{{ getToneGuide(step.targetTone) }}</p>
        </div>
      </div>
    </div>

    <!-- Feedback -->
    <div class="step-feedback mb-4" :class="feedbackClass">
      {{ feedback }}
    </div>

    <!-- Check Button -->
    <div class="flex justify-start gap-3">
      <button
        @click="checkAnswer"
        :disabled="isCorrect || selectedWords.length === 0"
        class="step-btn-primary"
        :class="{
          'step-btn-success cursor-default': isCorrect,
          'opacity-40 cursor-not-allowed': !isCorrect && selectedWords.length === 0
        }"
      >
        {{ isCorrect ? 'Perfect Transformation!' : 'Check Tone' }}
      </button>

      <button
        v-if="!isCorrect && attempts > 0"
        @click="showHint"
        class="px-4 py-2.5 rounded-lg text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors cursor-pointer border border-violet-100"
      >
        Show Hint
      </button>
    </div>

    <!-- Hint Display -->
    <div v-if="hintVisible && !isCorrect" class="mt-4 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
      <p class="text-sm text-indigo-700">
        <span class="font-bold">Hint:</span> {{ getLocalizedText(step.hint) || `Try starting with: "${step.correctAnswer.split(' ').slice(0, 3).join(' ')}..."` }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getLocalizedText } from '@/composables/useLanguage';

// Tone Indicator Component (inline)
const ToneIndicator = {
  props: ['tone'],
  template: `
    <div class="flex items-center gap-2 text-sm">
      <div class="flex gap-0.5">
        <div v-for="i in 5" :key="i"
             class="w-2 h-4 rounded-sm transition-all"
             :class="i <= getToneLevel(tone) ? getToneBarColor(tone) : 'bg-gray-200'"
             :style="{ height: (12 + i * 3) + 'px' }">
        </div>
      </div>
      <span :class="getToneLabelColor(tone)" class="font-medium">{{ getToneEmoji(tone) }} {{ tone }}</span>
    </div>
  `,
  methods: {
    getToneLevel(tone) {
      const levels = { formal: 5, neutral: 3, casual: 2, sarcastic: 4, enthusiastic: 5, romantic: 4 };
      return levels[tone] || 3;
    },
    getToneBarColor(tone) {
      const colors = {
        formal: 'bg-blue-500',
        neutral: 'bg-gray-500',
        casual: 'bg-green-500',
        sarcastic: 'bg-purple-500',
        enthusiastic: 'bg-orange-500',
        romantic: 'bg-pink-500'
      };
      return colors[tone] || 'bg-gray-500';
    },
    getToneLabelColor(tone) {
      const colors = {
        formal: 'text-blue-600',
        neutral: 'text-gray-600',
        casual: 'text-green-600',
        sarcastic: 'text-purple-600',
        enthusiastic: 'text-orange-600',
        romantic: 'text-pink-600'
      };
      return colors[tone] || 'text-gray-600';
    },
    getToneEmoji(tone) {
      const emojis = { formal: '🎩', neutral: '😐', casual: '😎', sarcastic: '😏', enthusiastic: '🎉', romantic: '💕' };
      return emojis[tone] || '💬';
    }
  }
};

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

// State
const selectedWords = ref([]);
const usedIndices = ref([]);
const feedback = ref('');
const isCorrect = ref(false);
const attempts = ref(0);
const hintVisible = ref(false);

// Compute available words from correct answer + distractors
const availableWords = computed(() => {
  const correctWords = props.step.correctAnswer?.split(' ') || [];
  const distractors = props.step.distractors || [];
  const allWords = [...correctWords, ...distractors];
  // Shuffle
  return allWords.sort(() => Math.random() - 0.5);
});

// Watch for step changes
watch(() => props.step, () => {
  selectedWords.value = [];
  usedIndices.value = [];
  feedback.value = '';
  isCorrect.value = false;
  attempts.value = 0;
  hintVisible.value = false;
}, { immediate: true });

// Methods
const selectWord = (idx) => {
  if (usedIndices.value.includes(idx) || isCorrect.value) return;
  selectedWords.value.push(availableWords.value[idx]);
  usedIndices.value.push(idx);
  feedback.value = '';
};

const removeWord = (idx) => {
  if (isCorrect.value) return;
  const word = selectedWords.value[idx];
  const originalIdx = availableWords.value.findIndex((w, i) => w === word && usedIndices.value.includes(i));
  selectedWords.value.splice(idx, 1);
  usedIndices.value = usedIndices.value.filter(i => availableWords.value[i] !== word || i !== originalIdx);
  feedback.value = '';
};

const addPunctuation = (punct) => {
  if (isCorrect.value) return;
  if (selectedWords.value.length > 0) {
    const lastIdx = selectedWords.value.length - 1;
    selectedWords.value[lastIdx] = selectedWords.value[lastIdx].replace(/[.,!?]+$/, '') + punct;
  }
};

const clearSelection = () => {
  selectedWords.value = [];
  usedIndices.value = [];
  feedback.value = '';
};

const showHint = () => {
  hintVisible.value = true;
};

const checkAnswer = () => {
  attempts.value++;
  const userAnswer = selectedWords.value.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
  const correctAnswer = props.step.correctAnswer.toLowerCase().replace(/\s+/g, ' ').trim();

  // Also accept alternatives if provided
  const alternatives = (props.step.alternatives || []).map(a => a.toLowerCase().replace(/\s+/g, ' ').trim());

  const isMatch = userAnswer === correctAnswer || alternatives.includes(userAnswer);

  if (isMatch) {
    isCorrect.value = true;
    feedback.value = `✨ Brilliant! You've mastered the ${getRegisterLabel(props.step.targetTone)} tone!`;
    emit('complete', true);
  } else {
    feedback.value = `Not quite the right tone. ${getHelpfulFeedback()}`;
    emit('complete', false);
  }
};

const getHelpfulFeedback = () => {
  const hints = {
    formal: 'Try using more polite, professional language.',
    casual: 'Make it sound more relaxed and friendly!',
    sarcastic: 'Add some ironic or mocking undertones.',
    enthusiastic: 'Show more excitement and energy!',
    romantic: 'Make it more affectionate and tender.'
  };
  return hints[props.step.targetTone] || 'Try matching the tone more closely.';
};

const getRegisterLabel = (tone) => {
  const labels = {
    formal: 'Formal',
    neutral: 'Neutral',
    casual: 'Casual',
    sarcastic: 'Sarcastic',
    enthusiastic: 'Enthusiastic',
    romantic: 'Romantic'
  };
  return labels[tone] || tone;
};

const getToneColorClass = (tone) => {
  const colors = {
    formal: 'text-blue-600',
    casual: 'text-green-600',
    sarcastic: 'text-purple-600',
    enthusiastic: 'text-orange-600',
    romantic: 'text-pink-600'
  };
  return colors[tone] || 'text-gray-600';
};

const getToneTextClass = (tone) => {
  const colors = {
    formal: 'text-blue-800',
    casual: 'text-green-800',
    sarcastic: 'text-purple-800',
    enthusiastic: 'text-orange-800',
    romantic: 'text-pink-800'
  };
  return colors[tone] || 'text-gray-800';
};

const getTargetBoxClass = () => {
  if (isCorrect.value) {
    return 'bg-emerald-50/50 border-emerald-200';
  }
  const toneColors = {
    formal: 'bg-blue-50/30 border-blue-200/60',
    casual: 'bg-green-50/30 border-green-200/60',
    sarcastic: 'bg-purple-50/30 border-purple-200/60',
    enthusiastic: 'bg-orange-50/30 border-orange-200/60',
    romantic: 'bg-pink-50/30 border-pink-200/60'
  };
  return toneColors[props.step.targetTone] || 'bg-slate-50/80 border-slate-200/60';
};

const getToneGuide = (tone) => {
  const guides = {
    formal: 'Use polite phrases, complete sentences, and respectful vocabulary. Avoid contractions and slang.',
    casual: 'Be relaxed! Use contractions, simple words, and friendly expressions.',
    sarcastic: 'Say the opposite of what you mean, use exaggeration, or add ironic praise.',
    enthusiastic: 'Show excitement! Use exclamation marks, positive superlatives, and energetic words.',
    romantic: 'Express affection with tender words, poetic language, and emotional expressions.'
  };
  return guides[tone] || 'Match the target tone as closely as possible.';
};

const feedbackClass = computed(() => {
  if (!feedback.value) return '';
  return isCorrect.value ? 'success' : 'error';
});
</script>

<style scoped>
.transform-arrow {
  animation: arrow-pulse 2s ease-in-out infinite;
}

@keyframes arrow-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.05);
  }
}
</style>
