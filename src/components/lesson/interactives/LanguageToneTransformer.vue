<template>
  <div class="interactive-step step-animate-in">
    <!-- Header with animated gradient -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-200 mb-4">
        <span class="text-2xl">🎭</span>
        <span class="font-bold text-violet-700">Tone Transformer</span>
      </div>
      <p class="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
        {{ step.prompt || 'Transform the sentence to match the target tone' }}
      </p>
    </div>

    <!-- Original Sentence Display -->
    <div class="relative mb-8">
      <div class="absolute -top-3 left-4 px-3 py-1 bg-white text-xs font-bold text-gray-500 uppercase tracking-wider">
        Original ({{ getRegisterLabel(step.originalTone) }})
      </div>
      <div class="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6">
        <p class="text-xl text-gray-800 font-medium leading-relaxed">
          "{{ step.originalSentence }}"
        </p>
        <div class="mt-3 flex items-center gap-2">
          <ToneIndicator :tone="step.originalTone" />
        </div>
      </div>
    </div>

    <!-- Animated Transform Arrow -->
    <div class="flex justify-center mb-8">
      <div class="relative">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg transform-arrow">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
        </div>
        <div class="absolute -right-24 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 font-bold text-sm whitespace-nowrap">
          Transform to: {{ getRegisterLabel(step.targetTone) }}
        </div>
      </div>
    </div>

    <!-- Target Tone Display -->
    <div class="relative mb-8">
      <div class="absolute -top-3 left-4 px-3 py-1 bg-white text-xs font-bold uppercase tracking-wider"
           :class="getToneColorClass(step.targetTone)">
        Target Tone: {{ getRegisterLabel(step.targetTone) }}
      </div>
      <div
        class="border-2 rounded-2xl p-6 transition-all duration-300"
        :class="getTargetBoxClass()"
      >
        <!-- Word Selection Mode -->
        <div v-if="!isCorrect" class="space-y-4">
          <p class="text-sm text-gray-500 mb-4">Click on words to build your transformed sentence:</p>

          <!-- Current Answer Preview -->
          <div class="min-h-[60px] bg-white rounded-xl border-2 border-dashed border-gray-300 p-4 flex flex-wrap gap-2 items-center">
            <span v-if="selectedWords.length === 0" class="text-gray-400 italic">
              Your sentence will appear here...
            </span>
            <div
              v-for="(word, idx) in selectedWords"
              :key="`selected-${idx}`"
              @click="removeWord(idx)"
              class="px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 font-medium cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors group"
            >
              {{ word }}
              <span class="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">×</span>
            </div>
          </div>

          <!-- Available Word Chips -->
          <div class="flex flex-wrap gap-2 justify-center">
            <button
              v-for="(word, idx) in availableWords"
              :key="`word-${idx}`"
              @click="selectWord(idx)"
              :disabled="usedIndices.includes(idx)"
              class="px-4 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105"
              :class="usedIndices.includes(idx)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-violet-400 hover:bg-violet-50 hover:shadow-md cursor-pointer'"
            >
              {{ word }}
            </button>
          </div>

          <!-- Punctuation helpers -->
          <div class="flex justify-center gap-2 mt-4">
            <button
              v-for="punct in ['.', '!', '?', ',', '...']"
              :key="punct"
              @click="addPunctuation(punct)"
              class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
            >
              {{ punct }}
            </button>
            <button
              @click="clearSelection"
              class="px-4 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Success State -->
        <div v-else class="text-center">
          <p class="text-xl font-medium leading-relaxed" :class="getToneTextClass(step.targetTone)">
            "{{ selectedWords.join(' ') }}"
          </p>
          <div class="mt-3 flex items-center justify-center gap-2">
            <ToneIndicator :tone="step.targetTone" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tone Guide -->
    <div v-if="!isCorrect && step.showGuide !== false" class="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
      <div class="flex items-start gap-3">
        <span class="text-xl">💡</span>
        <div>
          <p class="font-semibold text-amber-800 mb-1">Tone Guide: {{ getRegisterLabel(step.targetTone) }}</p>
          <p class="text-amber-700 text-sm">{{ getToneGuide(step.targetTone) }}</p>
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
        class="px-8 py-3 rounded-full font-bold text-white shadow-md transition-all active:scale-95"
        :class="isCorrect
          ? 'bg-green-500 cursor-default'
          : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700'"
      >
        {{ isCorrect ? '✓ Perfect Transformation!' : 'Check Tone' }}
      </button>

      <button
        v-if="!isCorrect && attempts > 0"
        @click="showHint"
        class="px-6 py-3 rounded-full font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors"
      >
        Show Hint
      </button>
    </div>

    <!-- Hint Display -->
    <div v-if="hintVisible && !isCorrect" class="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
      <p class="text-blue-800">
        <span class="font-bold">Hint:</span> {{ step.hint || `Try starting with: "${step.correctAnswer.split(' ').slice(0, 3).join(' ')}..."` }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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
    return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300';
  }
  const toneColors = {
    formal: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
    casual: 'bg-gradient-to-br from-green-50 to-teal-50 border-green-200',
    sarcastic: 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200',
    enthusiastic: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200',
    romantic: 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200'
  };
  return toneColors[props.step.targetTone] || 'bg-gray-50 border-gray-200';
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
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(217, 70, 239, 0.6);
  }
}

.step-feedback {
  min-height: 24px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.step-feedback:empty {
  display: none;
}

.step-feedback.success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.step-feedback.error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #991b1b;
  border: 1px solid #fca5a5;
}
</style>
