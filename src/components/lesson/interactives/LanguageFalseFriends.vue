<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="text-center mb-6">
      <div class="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-rose-100 to-orange-100 border border-rose-200 mb-4">
        <span class="text-2xl">🔍</span>
        <span class="font-bold text-rose-700">False Friends Detective</span>
      </div>
      <p class="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
        {{ step.prompt || 'Identify words that look similar but have different meanings!' }}
      </p>
    </div>

    <!-- Language Pair -->
    <div class="flex items-center justify-center gap-4 mb-6">
      <span class="text-2xl">{{ getLanguageFlag(step.language1) }}</span>
      <span class="font-bold text-gray-700">{{ step.language1 }}</span>
      <span class="text-2xl text-rose-500">⚡</span>
      <span class="font-bold text-gray-700">{{ step.language2 }}</span>
      <span class="text-2xl">{{ getLanguageFlag(step.language2) }}</span>
    </div>

    <!-- Case Display -->
    <div class="case-file mb-8">
      <div class="case-header">
        <span class="case-number">Case #{{ currentIndex + 1 }}</span>
        <span class="case-status" :class="getCurrentStatus()">{{ getStatusText() }}</span>
      </div>

      <!-- Word Comparison -->
      <div class="word-comparison">
        <!-- Word 1 -->
        <div class="word-card" :class="{ 'revealed': revealed }">
          <div class="language-badge">{{ step.language1 }}</div>
          <div class="word-display">
            <span class="word-text">{{ currentWord.word1 }}</span>
            <span v-if="revealed" class="word-meaning">{{ currentWord.meaning1 }}</span>
          </div>
          <div v-if="!revealed" class="word-mystery">?</div>
        </div>

        <!-- Comparison Indicator -->
        <div class="comparison-center">
          <div class="comparison-icon" :class="{ 'false-friend': revealed && currentWord.isFalseFriend }">
            <span v-if="!revealed">🤔</span>
            <span v-else-if="currentWord.isFalseFriend">⚠️</span>
            <span v-else>✓</span>
          </div>
          <div v-if="revealed" class="comparison-label">
            {{ currentWord.isFalseFriend ? 'FALSE FRIEND!' : 'True cognate' }}
          </div>
        </div>

        <!-- Word 2 -->
        <div class="word-card" :class="{ 'revealed': revealed }">
          <div class="language-badge">{{ step.language2 }}</div>
          <div class="word-display">
            <span class="word-text">{{ currentWord.word2 }}</span>
            <span v-if="revealed" class="word-meaning">{{ currentWord.meaning2 }}</span>
          </div>
          <div v-if="!revealed" class="word-mystery">?</div>
        </div>
      </div>

      <!-- Guess Buttons -->
      <div v-if="!revealed" class="guess-buttons">
        <button @click="makeGuess(true)" class="guess-btn false-friend-btn">
          <span class="text-2xl mb-1">⚠️</span>
          <span class="font-bold">False Friend</span>
          <span class="text-sm opacity-75">Different meanings</span>
        </button>
        <button @click="makeGuess(false)" class="guess-btn true-cognate-btn">
          <span class="text-2xl mb-1">✓</span>
          <span class="font-bold">True Cognate</span>
          <span class="text-sm opacity-75">Same meaning</span>
        </button>
      </div>

      <!-- Explanation (after reveal) -->
      <transition name="slide-up">
        <div v-if="revealed && currentWord.explanation" class="explanation-box">
          <div class="explanation-header">
            <span class="text-lg">💡</span>
            <span class="font-bold">Detective Notes</span>
          </div>
          <p class="explanation-text">{{ currentWord.explanation }}</p>

          <!-- Usage examples -->
          <div v-if="currentWord.example1 || currentWord.example2" class="examples-grid">
            <div v-if="currentWord.example1" class="example-item">
              <span class="example-lang">{{ step.language1 }}:</span>
              <span class="example-text">"{{ currentWord.example1 }}"</span>
            </div>
            <div v-if="currentWord.example2" class="example-item">
              <span class="example-lang">{{ step.language2 }}:</span>
              <span class="example-text">"{{ currentWord.example2 }}"</span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Progress Tracker -->
    <div class="progress-tracker mb-6">
      <div class="progress-dots">
        <div
          v-for="(word, idx) in step.words"
          :key="idx"
          class="progress-dot"
          :class="{
            'current': idx === currentIndex,
            'correct': results[idx] === 'correct',
            'incorrect': results[idx] === 'incorrect',
            'pending': !results[idx] && idx !== currentIndex
          }"
        >
          <span v-if="results[idx] === 'correct'">✓</span>
          <span v-else-if="results[idx] === 'incorrect'">✗</span>
          <span v-else>{{ idx + 1 }}</span>
        </div>
      </div>
      <div class="progress-score">
        <span class="score-correct">{{ correctCount }} correct</span>
        <span class="score-divider">/</span>
        <span class="score-total">{{ step.words.length }} total</span>
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
        class="px-8 py-3 rounded-full font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 shadow-md hover:shadow-lg transition-all"
      >
        Next Case →
      </button>
      <button
        v-if="isComplete"
        @click="showResults = true"
        class="px-8 py-3 rounded-full font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md hover:shadow-lg transition-all"
      >
        {{ correctCount >= step.words.length / 2 ? 'Case Closed! →' : 'Review Results →' }}
      </button>
    </div>

    <!-- Final Results Modal -->
    <transition name="modal">
      <div v-if="showResults" class="results-overlay" @click.self="showResults = false">
        <div class="results-modal">
          <div class="results-header">
            <span class="text-4xl">{{ correctCount >= step.words.length / 2 ? '🏆' : '📚' }}</span>
            <h3>Investigation Complete!</h3>
          </div>
          <div class="results-score">
            <div class="score-circle">
              <span class="score-number">{{ correctCount }}</span>
              <span class="score-label">/ {{ step.words.length }}</span>
            </div>
            <p class="score-message">{{ getScoreMessage() }}</p>
          </div>
          <div class="results-breakdown">
            <div
              v-for="(word, idx) in step.words"
              :key="idx"
              class="result-item"
              :class="results[idx]"
            >
              <span class="result-words">{{ word.word1 }} ↔ {{ word.word2 }}</span>
              <span class="result-type">{{ word.isFalseFriend ? '⚠️ False Friend' : '✓ Cognate' }}</span>
              <span class="result-status">{{ results[idx] === 'correct' ? '✓' : '✗' }}</span>
            </div>
          </div>
          <button
            @click="$emit('complete', correctCount >= step.words.length / 2)"
            class="results-close-btn"
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
.case-file {
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
  border: 3px solid #f59e0b;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2);
  position: relative;
  overflow: hidden;
}

.case-file::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    #f59e0b 0px,
    #f59e0b 20px,
    #fbbf24 20px,
    #fbbf24 40px
  );
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 8px;
}

.case-number {
  font-weight: 800;
  font-size: 18px;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.case-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.case-status.investigating {
  background: #fef3c7;
  color: #92400e;
  animation: pulse-status 2s infinite;
}

.case-status.correct {
  background: #d1fae5;
  color: #065f46;
}

.case-status.incorrect {
  background: #fee2e2;
  color: #991b1b;
}

@keyframes pulse-status {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Word Comparison */
.word-comparison {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 20px;
  margin-bottom: 24px;
}

.word-card {
  flex: 1;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  position: relative;
  transition: all 0.5s ease;
}

.word-card.revealed {
  border-color: #8b5cf6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.language-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.word-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.word-text {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.word-meaning {
  font-size: 14px;
  color: #6b7280;
  font-style: italic;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 8px;
}

.word-mystery {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  color: #9ca3af;
  animation: bounce-mystery 1s ease infinite;
}

@keyframes bounce-mystery {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-4px); }
}

/* Comparison Center */
.comparison-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.comparison-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.5s ease;
}

.comparison-icon.false-friend {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  animation: shake-warning 0.5s ease;
}

@keyframes shake-warning {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-5px) rotate(-5deg); }
  75% { transform: translateX(5px) rotate(5deg); }
}

.comparison-label {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  color: #6b7280;
}

/* Guess Buttons */
.guess-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.guess-btn {
  flex: 1;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 16px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.3s ease;
}

.false-friend-btn {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #fca5a5;
  color: #b91c1c;
}

.false-friend-btn:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.2);
}

.true-cognate-btn {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #6ee7b7;
  color: #065f46;
}

.true-cognate-btn:hover {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
}

/* Explanation Box */
.explanation-box {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-top: 20px;
  border: 2px solid #e0e7ff;
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4338ca;
  margin-bottom: 12px;
}

.explanation-text {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 16px;
}

.examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.example-item {
  background: #f9fafb;
  padding: 12px;
  border-radius: 12px;
}

.example-lang {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.example-text {
  color: #374151;
  font-style: italic;
}

/* Progress Tracker */
.progress-tracker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.progress-dots {
  display: flex;
  gap: 12px;
}

.progress-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.progress-dot.pending {
  background: #f3f4f6;
  color: #9ca3af;
}

.progress-dot.current {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.3);
  animation: pulse-current 2s infinite;
}

@keyframes pulse-current {
  0%, 100% { box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(251, 191, 36, 0.1); }
}

.progress-dot.correct {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.progress-dot.incorrect {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.progress-score {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.score-correct {
  color: #059669;
  font-weight: 600;
}

.score-divider {
  color: #d1d5db;
}

.score-total {
  color: #6b7280;
}

/* Results Modal */
.results-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.results-modal {
  background: white;
  border-radius: 24px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.results-header {
  text-align: center;
  margin-bottom: 24px;
}

.results-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-top: 8px;
}

.results-score {
  text-align: center;
  margin-bottom: 24px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
}

.score-number {
  font-size: 32px;
  font-weight: 800;
  color: white;
}

.score-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.score-message {
  color: #6b7280;
}

.results-breakdown {
  space-y: 8px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 8px;
}

.result-item.correct {
  background: #ecfdf5;
}

.result-item.incorrect {
  background: #fef2f2;
}

.result-words {
  font-weight: 500;
  color: #374151;
}

.result-type {
  font-size: 12px;
  color: #6b7280;
}

.result-status {
  font-weight: bold;
}

.result-item.correct .result-status {
  color: #059669;
}

.result-item.incorrect .result-status {
  color: #dc2626;
}

.results-close-btn {
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.results-close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* Feedback */
.step-feedback {
  min-height: 24px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 500;
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

/* Transitions */
.slide-up-enter-active {
  transition: all 0.4s ease;
}

.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
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

.modal-enter-from .results-modal,
.modal-leave-to .results-modal {
  transform: scale(0.9);
}
</style>
