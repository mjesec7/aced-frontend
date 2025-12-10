<template>
  <div class="lightning-round-game">
    <!-- Current Question -->
    <div v-if="currentQuestion" class="question-container">
      <div class="question-number">
        Question {{ currentQuestionIndex + 1 }} / {{ questions.length }}
      </div>

      <div class="question-card">
        <h3 class="question-text">{{ currentQuestion.question }}</h3>

        <div class="options-grid">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="option-btn"
            :class="getOptionClass(index)"
            :disabled="answered"
            @click="selectOption(index)"
          >
            {{ option }}
          </button>
        </div>

        <div v-if="answered" class="feedback" :class="feedbackClass">
          {{ feedback }}
        </div>
      </div>

      <!-- Question Timer -->
      <div class="question-timer">
        <div class="timer-bar" :style="{ width: `${questionTimePercent}%` }"></div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="game-instructions">
      {{ instructions }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  gameData: {
    type: Object,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  lives: {
    type: Number,
    default: 3
  },
  timeRemaining: {
    type: Number,
    default: 60
  }
});

const emit = defineEmits([
  'score-change',
  'life-lost',
  'game-complete',
  'item-collected'
]);

// State
const currentQuestionIndex = ref(0);
const answered = ref(false);
const selectedOption = ref(null);
const feedback = ref('');
const feedbackClass = ref('');
const questionTimeRemaining = ref(10);
const questionTimer = ref(null);
const gameActive = ref(true);

// Computed
const instructions = computed(() => {
  return props.gameData?.instructions || 'Answer as fast as you can!';
});

const questions = computed(() => {
  return props.gameData?.questions || props.gameData?.items || [];
});

const currentQuestion = computed(() => {
  if (currentQuestionIndex.value < questions.value.length) {
    return questions.value[currentQuestionIndex.value];
  }
  return null;
});

const questionTimePercent = computed(() => {
  const maxTime = 10;
  return (questionTimeRemaining.value / maxTime) * 100;
});

// Methods
const startQuestionTimer = () => {
  questionTimeRemaining.value = 10;

  questionTimer.value = setInterval(() => {
    questionTimeRemaining.value--;

    if (questionTimeRemaining.value <= 0) {
      clearInterval(questionTimer.value);
      if (!answered.value) {
        // Time's up - wrong answer
        handleTimeout();
      }
    }
  }, 1000);
};

const selectOption = (index) => {
  if (answered.value || !gameActive.value) return;

  answered.value = true;
  selectedOption.value = index;

  // Clear timer
  if (questionTimer.value) {
    clearInterval(questionTimer.value);
  }

  // Check if correct
  const question = currentQuestion.value;
  const correctIndex = question.correctAnswer;
  const isCorrect = index === correctIndex;

  // Calculate score with time bonus
  let points = 0;
  if (isCorrect) {
    const timeBonus = Math.floor(questionTimeRemaining.value * 2);
    points = 10 + timeBonus;
    feedback.value = `Correct! +${points} points`;
    feedbackClass.value = 'correct';
  } else {
    points = -5;
    feedback.value = `Wrong! The correct answer was: ${question.options[correctIndex]}`;
    feedbackClass.value = 'incorrect';
    emit('life-lost');
  }

  emit('score-change', points);
  emit('item-collected', { isCorrect });

  // Move to next question after delay
  setTimeout(() => {
    nextQuestion();
  }, 2000);
};

const handleTimeout = () => {
  answered.value = true;
  selectedOption.value = null;
  feedback.value = 'Time\'s up!';
  feedbackClass.value = 'timeout';

  emit('life-lost');
  emit('score-change', -5);
  emit('item-collected', { isCorrect: false });

  // Move to next question
  setTimeout(() => {
    nextQuestion();
  }, 2000);
};

const nextQuestion = () => {
  currentQuestionIndex.value++;

  if (currentQuestionIndex.value >= questions.value.length) {
    // Game complete
    emit('game-complete', { reason: 'all-questions-answered' });
    gameActive.value = false;
  } else {
    // Reset for next question
    answered.value = false;
    selectedOption.value = null;
    feedback.value = '';
    feedbackClass.value = '';
    startQuestionTimer();
  }
};

const getOptionClass = (index) => {
  if (!answered.value) return '';

  const correctIndex = currentQuestion.value?.correctAnswer;

  if (index === selectedOption.value) {
    return index === correctIndex ? 'selected-correct' : 'selected-wrong';
  }

  if (index === correctIndex) {
    return 'show-correct';
  }

  return 'disabled';
};

const stopGame = () => {
  gameActive.value = false;
  if (questionTimer.value) {
    clearInterval(questionTimer.value);
  }
};

// Watch for game end conditions
watch(() => props.lives, (newLives) => {
  if (newLives <= 0) {
    stopGame();
  }
});

watch(() => props.timeRemaining, (newTime) => {
  if (newTime <= 0) {
    stopGame();
  }
});

// Lifecycle
onMounted(() => {
  if (questions.value.length > 0) {
    startQuestionTimer();
  }
});

onUnmounted(() => {
  stopGame();
});
</script>

<style scoped>
.lightning-round-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.question-container {
  width: 100%;
  max-width: 600px;
}

.question-number {
  text-align: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.question-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  margin-bottom: 15px;
}

.question-text {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 25px 0;
  text-align: center;
  line-height: 1.4;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.option-btn {
  padding: 16px 20px;
  background: #f5f5f5;
  border: 3px solid transparent;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.option-btn:hover:not(:disabled) {
  background: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.option-btn:disabled {
  cursor: not-allowed;
}

.option-btn.selected-correct {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  border-color: #16a34a;
  animation: pulse-correct 0.5s;
}

.option-btn.selected-wrong {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: white;
  border-color: #dc2626;
  animation: shake 0.5s;
}

.option-btn.show-correct {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  border-color: #16a34a;
}

.option-btn.disabled {
  opacity: 0.5;
}

@keyframes pulse-correct {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.feedback {
  margin-top: 20px;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  text-align: center;
  animation: fadeIn 0.3s;
}

.feedback.correct {
  background: #d1fae5;
  color: #065f46;
}

.feedback.incorrect,
.feedback.timeout {
  background: #fee2e2;
  color: #991b1b;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.question-timer {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.3);
  border-radius: 4px;
  overflow: hidden;
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  transition: width 1s linear;
  border-radius: 4px;
}

.game-instructions {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255,255,255,0.95);
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  max-width: 80%;
  text-align: center;
  z-index: 100;
}

/* Responsive */
@media (max-width: 768px) {
  .question-card {
    padding: 20px;
  }

  .question-text {
    font-size: 18px;
  }

  .option-btn {
    padding: 12px 16px;
    font-size: 14px;
  }

  .game-instructions {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>
