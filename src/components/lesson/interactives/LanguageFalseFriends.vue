<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🔍</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">False Friends</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ getLocalizedText(step.prompt) || 'Identify words that look similar but have different meanings!' }}
      </h2>
    </div>

    <!-- Language Pair -->
    <div class="flex items-center justify-center gap-3 mb-5 py-2.5 px-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
      <span class="text-lg">{{ getLanguageFlag(step.language1) }}</span>
      <span class="text-sm font-semibold text-slate-700">{{ getLocalizedText(step.language1) }}</span>
      <span class="text-violet-400">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
      </span>
      <span class="text-sm font-semibold text-slate-700">{{ getLocalizedText(step.language2) }}</span>
      <span class="text-lg">{{ getLanguageFlag(step.language2) }}</span>
    </div>

    <!-- Case Display -->
    <div class="bg-slate-50/80 border border-slate-200/60 rounded-xl p-5 mb-5">
      <!-- Case Header -->
      <div class="flex justify-between items-center mb-4">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Case #{{ currentIndex + 1 }}</span>
        <span
          class="px-3 py-1 rounded-lg text-xs font-semibold"
          :class="{
            'bg-amber-50 text-amber-600 border border-amber-100 case-status-pulse': getCurrentStatus() === 'investigating',
            'bg-emerald-50 text-emerald-600 border border-emerald-100': getCurrentStatus() === 'correct',
            'bg-red-50 text-red-600 border border-red-100': getCurrentStatus() === 'incorrect'
          }"
        >
          {{ getStatusText() }}
        </span>
      </div>

      <!-- Word Comparison -->
      <div class="flex items-stretch gap-3 mb-5">
        <!-- Word 1 -->
        <div
          class="flex-1 bg-white rounded-xl border-2 p-4 text-center relative transition-all duration-300"
          :class="revealed ? 'border-violet-300 shadow-sm' : 'border-slate-200/60'"
        >
          <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-slate-100 border border-slate-200/60 rounded-md text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            {{ getLocalizedText(step.language1) }}
          </div>
          <div class="flex flex-col items-center gap-1.5 mt-3">
            <span class="text-xl font-bold text-slate-900">{{ getLocalizedText(currentWord.word1) }}</span>
            <span v-if="revealed" class="text-xs text-slate-500 italic bg-slate-50 px-2.5 py-0.5 rounded-md">
              {{ getLocalizedText(currentWord.meaning1) }}
            </span>
          </div>
          <div v-if="!revealed" class="text-slate-300 text-lg mt-2 word-mystery-bounce">?</div>
        </div>

        <!-- Comparison Indicator -->
        <div class="flex flex-col items-center justify-center min-w-[48px]">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-base transition-all duration-300"
            :class="{
              'bg-slate-100 text-slate-400': !revealed,
              'bg-red-50 border border-red-200 text-red-500 comparison-shake': revealed && currentWord.isFalseFriend,
              'bg-emerald-50 border border-emerald-200 text-emerald-500': revealed && !currentWord.isFalseFriend
            }"
          >
            <span v-if="!revealed">?</span>
            <span v-else-if="currentWord.isFalseFriend">!</span>
            <span v-else>&#10003;</span>
          </div>
          <div v-if="revealed" class="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-center leading-tight"
            :class="currentWord.isFalseFriend ? 'text-red-500' : 'text-emerald-600'">
            {{ currentWord.isFalseFriend ? 'FALSE FRIEND' : 'True cognate' }}
          </div>
        </div>

        <!-- Word 2 -->
        <div
          class="flex-1 bg-white rounded-xl border-2 p-4 text-center relative transition-all duration-300"
          :class="revealed ? 'border-violet-300 shadow-sm' : 'border-slate-200/60'"
        >
          <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-slate-100 border border-slate-200/60 rounded-md text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            {{ getLocalizedText(step.language2) }}
          </div>
          <div class="flex flex-col items-center gap-1.5 mt-3">
            <span class="text-xl font-bold text-slate-900">{{ getLocalizedText(currentWord.word2) }}</span>
            <span v-if="revealed" class="text-xs text-slate-500 italic bg-slate-50 px-2.5 py-0.5 rounded-md">
              {{ getLocalizedText(currentWord.meaning2) }}
            </span>
          </div>
          <div v-if="!revealed" class="text-slate-300 text-lg mt-2 word-mystery-bounce">?</div>
        </div>
      </div>

      <!-- Guess Buttons -->
      <div v-if="!revealed" class="flex gap-3 justify-center">
        <button @click="makeGuess(true)"
          class="flex-1 max-w-[180px] flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 border-red-200 bg-red-50/50 text-red-700 font-medium transition-all hover:bg-red-100 hover:border-red-300 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer">
          <span class="text-base">!</span>
          <span class="text-sm font-semibold">False Friend</span>
          <span class="text-[10px] text-red-400">Different meanings</span>
        </button>
        <button @click="makeGuess(false)"
          class="flex-1 max-w-[180px] flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 text-emerald-700 font-medium transition-all hover:bg-emerald-100 hover:border-emerald-300 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer">
          <span class="text-base">&#10003;</span>
          <span class="text-sm font-semibold">True Cognate</span>
          <span class="text-[10px] text-emerald-400">Same meaning</span>
        </button>
      </div>

      <!-- Explanation (after reveal) -->
      <transition name="slide-up">
        <div v-if="revealed && currentWord.explanation" class="mt-4 bg-white rounded-xl border border-indigo-100 p-4">
          <div class="flex items-center gap-2 text-indigo-600 mb-2">
            <span class="text-sm">💡</span>
            <span class="text-xs font-bold uppercase tracking-wide">Explanation</span>
          </div>
          <p class="text-sm text-slate-600 leading-relaxed mb-3">{{ getLocalizedText(currentWord.explanation) }}</p>

          <!-- Usage examples -->
          <div v-if="currentWord.example1 || currentWord.example2" class="grid grid-cols-2 gap-2">
            <div v-if="currentWord.example1" class="bg-slate-50/80 p-2.5 rounded-lg">
              <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{{ getLocalizedText(step.language1) }}</span>
              <span class="text-xs text-slate-700 italic">"{{ getLocalizedText(currentWord.example1) }}"</span>
            </div>
            <div v-if="currentWord.example2" class="bg-slate-50/80 p-2.5 rounded-lg">
              <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{{ getLocalizedText(step.language2) }}</span>
              <span class="text-xs text-slate-700 italic">"{{ getLocalizedText(currentWord.example2) }}"</span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Progress Tracker -->
    <div class="flex flex-col items-center gap-2.5 mb-4">
      <div class="flex gap-2">
        <div
          v-for="(word, idx) in step.words"
          :key="idx"
          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
          :class="{
            'bg-violet-100 text-violet-600 ring-2 ring-violet-300 ring-offset-1 progress-dot-pulse': idx === currentIndex,
            'bg-emerald-100 text-emerald-600': results[idx] === 'correct',
            'bg-red-100 text-red-600': results[idx] === 'incorrect',
            'bg-slate-100 text-slate-400': !results[idx] && idx !== currentIndex
          }"
        >
          <span v-if="results[idx] === 'correct'">&#10003;</span>
          <span v-else-if="results[idx] === 'incorrect'">&#10007;</span>
          <span v-else>{{ idx + 1 }}</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-xs">
        <span class="font-semibold text-emerald-600">{{ correctCount }} correct</span>
        <span class="text-slate-300">/</span>
        <span class="text-slate-500">{{ step.words.length }} total</span>
      </div>
    </div>

    <!-- Feedback -->
    <div class="step-feedback" :class="feedbackClass">
      {{ feedback }}
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-start gap-3 mt-4">
      <button
        v-if="revealed && !isComplete"
        @click="nextWord"
        class="step-btn-primary"
      >
        Next Case
      </button>
      <button
        v-if="isComplete"
        @click="showResults = true"
        class="step-btn-primary step-btn-success"
      >
        {{ correctCount >= step.words.length / 2 ? 'View Results' : 'Review Results' }}
      </button>
    </div>

    <!-- Final Results Modal -->
    <transition name="modal">
      <div v-if="showResults" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="showResults = false">
        <div class="bg-white rounded-xl p-6 max-w-md w-[90%] max-h-[80vh] overflow-y-auto shadow-xl border border-slate-200/60">
          <div class="text-center mb-5">
            <span class="text-3xl">{{ correctCount >= step.words.length / 2 ? '🏆' : '📚' }}</span>
            <h3 class="text-lg font-bold text-slate-900 mt-2">Investigation Complete!</h3>
          </div>

          <div class="text-center mb-5">
            <div class="inline-flex flex-col items-center justify-center w-20 h-20 rounded-full bg-violet-50 border-2 border-violet-200">
              <span class="text-2xl font-bold text-violet-700">{{ correctCount }}</span>
              <span class="text-xs text-violet-400">/ {{ step.words.length }}</span>
            </div>
            <p class="text-sm text-slate-500 mt-3">{{ getScoreMessage() }}</p>
          </div>

          <div class="space-y-2 mb-5">
            <div
              v-for="(word, idx) in step.words"
              :key="idx"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm"
              :class="results[idx] === 'correct' ? 'bg-emerald-50/80' : 'bg-red-50/80'"
            >
              <span class="font-medium text-slate-700">{{ word.word1 }} ↔ {{ word.word2 }}</span>
              <span class="text-[10px] text-slate-400">{{ word.isFalseFriend ? '! False Friend' : '&#10003; Cognate' }}</span>
              <span class="font-bold" :class="results[idx] === 'correct' ? 'text-emerald-600' : 'text-red-500'">
                {{ results[idx] === 'correct' ? '&#10003;' : '&#10007;' }}
              </span>
            </div>
          </div>

          <button
            @click="$emit('complete', correctCount >= step.words.length / 2)"
            class="step-btn-primary w-full text-center"
          >
            Continue
          </button>
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

// State
const currentIndex = ref(0);
const revealed = ref(false);
const results = ref({}); // { 0: 'correct', 1: 'incorrect', ... }
const feedback = ref('');
const showResults = ref(false);

// Computed
const currentWord = computed(() => props.step.words[currentIndex.value] || {});
const correctCount = computed(() => Object.values(results.value).filter(r => r === 'correct').length);
const isComplete = computed(() => currentIndex.value >= props.step.words.length - 1 && revealed.value);

const feedbackClass = computed(() => {
  if (!feedback.value) return '';
  if (feedback.value.includes('✓') || feedback.value.includes('🎉')) return 'success';
  return 'error';
});

// Initialize
watch(() => props.step, () => {
  currentIndex.value = 0;
  revealed.value = false;
  results.value = {};
  feedback.value = '';
  showResults.value = false;
}, { immediate: true });

// Methods
const makeGuess = (guessedFalseFriend) => {
  const isCorrect = guessedFalseFriend === currentWord.value.isFalseFriend;
  revealed.value = true;

  results.value[currentIndex.value] = isCorrect ? 'correct' : 'incorrect';

  if (isCorrect) {
    feedback.value = currentWord.value.isFalseFriend
      ? '✓ Correct! This is indeed a false friend - the words look similar but mean different things!'
      : '✓ Correct! These are true cognates with the same meaning.';
  } else {
    feedback.value = currentWord.value.isFalseFriend
      ? '✗ Actually, this is a false friend! Despite looking similar, they have different meanings.'
      : '✗ Actually, these are true cognates - they share the same meaning across both languages.';
  }
};

const nextWord = () => {
  if (currentIndex.value < props.step.words.length - 1) {
    currentIndex.value++;
    revealed.value = false;
    feedback.value = '';
  } else {
    showResults.value = true;
  }
};

const getCurrentStatus = () => {
  if (!revealed.value) return 'investigating';
  return results.value[currentIndex.value] || 'pending';
};

const getStatusText = () => {
  if (!revealed.value) return 'Investigating...';
  if (results.value[currentIndex.value] === 'correct') return 'Solved!';
  return 'Missed!';
};

const getScoreMessage = () => {
  const ratio = correctCount.value / props.step.words.length;
  if (ratio >= 0.9) return 'Master Detective! You have an excellent eye for false friends!';
  if (ratio >= 0.7) return 'Great detective work! You caught most of the tricky words.';
  if (ratio >= 0.5) return 'Good effort! Keep practicing to spot more false friends.';
  return 'These sneaky words fooled you! Study the explanations to learn the differences.';
};

const getLanguageFlag = (lang) => {
  const flags = {
    'English': '🇬🇧',
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Russian': '🇷🇺',
    'Portuguese': '🇵🇹',
    'Polish': '🇵🇱',
    'Dutch': '🇳🇱',
    'Swedish': '🇸🇪'
  };
  return flags[lang] || '🌍';
};
</script>

<style scoped>
/* Animations only */
.word-mystery-bounce {
  animation: mystery-bounce 1.2s ease infinite;
}

@keyframes mystery-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.case-status-pulse {
  animation: status-pulse 2s infinite;
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.comparison-shake {
  animation: comp-shake 0.5s ease;
}

@keyframes comp-shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-3px) rotate(-3deg); }
  75% { transform: translateX(3px) rotate(3deg); }
}

.progress-dot-pulse {
  animation: dot-pulse 2s infinite;
}

@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1); }
}

/* Transitions */
.slide-up-enter-active {
  transition: all 0.4s ease;
}
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from {
  transform: translateY(12px);
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
