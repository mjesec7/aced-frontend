<template>
  <div class="game-container" :class="`game-${gameType}`">
    <!-- Dynamic Game Component -->
    <component
      :is="gameComponent"
      v-if="!gameComplete"
      :game-data="gameData"
      :score="score"
      :lives="lives"
      :time-remaining="timeRemaining"
      @score-change="handleScoreChange"
      @life-lost="handleLifeLost"
      @game-complete="handleGameComplete"
      @item-collected="handleItemCollected"
      @game-started="handleGameStarted"
    />

    <!-- Game Complete Screen -->
    <GameComplete
      v-if="gameComplete"
      :score="score"
      :target-score="targetScore"
      :stars="stars"
      :time-spent="timeSpent"
      :accuracy="accuracy"
      :is-personal-best="isPersonalBest"
      @retry="retryGame"
      @continue="continueLesson"
      @share="handleShare"
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="game-loading">
      <div class="loading-spinner"></div>
      <p>Loading game...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue';
import { submitGameResults } from '@/api';
import GameHUD from './GameHUD.vue';
import GameComplete from './GameComplete.vue';

// Import game components
import BasketCatch from '../throwing/BasketCatch.vue';
import MemoryCards from '../matching/MemoryCards.vue';
import WhackAMole from '../reaction/WhackAMole.vue';
import LightningRound from '../reaction/LightningRound.vue';
import PatternBuilder from '../strategy/PatternBuilder.vue';
import MazeRunner from '../maze/MazeRunner.vue';

const props = defineProps({
  gameData: { type: Object, required: true },
  gameType: { type: String, required: true },
  userId: { type: String, required: true },
  lessonId: { type: String, required: true },
  stepIndex: { type: Number, required: true }
});

const emit = defineEmits(['game-complete', 'game-exit']);

// State
const gameStarted = ref(false);
const gameComplete = ref(false);
const isLoading = ref(false);
const score = ref(0);
const lives = ref(3);
const timeRemaining = ref(60);
const startTime = ref(0);
const itemsCollected = ref(0);
const correctItems = ref(0);
const wrongItems = ref(0);
const isPersonalBest = ref(false);
const timerInterval = ref(null);
const actions = ref([]);

// Computed
const gameComponent = computed(() => {
  const components = {
    'basket-catch': BasketCatch,
    'memory-cards': MemoryCards,
    'whack-a-mole': WhackAMole,
    'lightning-round': LightningRound,
    'pattern-builder': PatternBuilder,
    'maze-runner': MazeRunner
  };
  return components[props.gameType] || BasketCatch;
});

const gameTitle = computed(() => {
  const titles = {
    'basket-catch': '🧺 Basket Catch',
    'memory-cards': '🎴 Memory Cards',
    'whack-a-mole': '🔨 Whack-a-Mole',
    'lightning-round': '⚡ Lightning Round',
    'pattern-builder': '🔵 Pattern Builder',
    'maze-runner': '🏃 Maze Runner'
  };
  return titles[props.gameType] || 'Game';
});

const gameIcon = computed(() => {
  const icons = {
    'basket-catch': '🧺',
    'memory-cards': '🎴',
    'whack-a-mole': '🔨',
    'lightning-round': '⚡',
    'pattern-builder': '🔵',
    'maze-runner': '🏃'
  };
  return icons[props.gameType] || '🎮';
});

const instructions = computed(() => {
  return props.gameData.instructions || 'Complete the game to proceed!';
});

const targetScore = computed(() => props.gameData.targetScore || 100);
const timeLimit = computed(() => props.gameData.timeLimit || 60);
const maxLives = computed(() => props.gameData.lives || 3);

const progress = computed(() => {
  return (score.value / targetScore.value) * 100;
});

const stars = computed(() => {
  const percentage = (score.value / targetScore.value) * 100;
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
});

const accuracy = computed(() => {
  if (itemsCollected.value === 0) return 0;
  return Math.round((correctItems.value / itemsCollected.value) * 100);
});

const timeSpent = computed(() => {
  if (!startTime.value) return 0;
  const endTime = gameComplete.value ? Date.now() : Date.now();
  return Math.floor((endTime - startTime.value) / 1000);
});

// Methods
const handleGameStarted = () => {
  gameStarted.value = true;
  startTime.value = Date.now();
  lives.value = maxLives.value;
  timeRemaining.value = timeLimit.value;
  score.value = 0;
  itemsCollected.value = 0;
  correctItems.value = 0;
  wrongItems.value = 0;
  actions.value = [];

  startTimer();
};

const startTimer = () => {
  timerInterval.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;

      if (timeRemaining.value === 10) {
        // Warning at 10 seconds
      }
    } else {
      clearInterval(timerInterval.value);
      handleGameComplete({ reason: 'timeout' });
    }
  }, 1000);
};

const handleScoreChange = (change) => {
  score.value += change;

  actions.value.push({
    timestamp: new Date().toISOString(),
    action: change > 0 ? 'correct' : 'wrong',
    points: change
  });
};

const handleLifeLost = () => {
  lives.value--;

  if (lives.value <= 0) {
    handleGameComplete({ reason: 'no-lives' });
  }
};

const handleItemCollected = ({ isCorrect }) => {
  itemsCollected.value++;
  if (isCorrect) {
    correctItems.value++;
  } else {
    wrongItems.value++;
  }
};

const handleGameComplete = async (data = {}) => {
  gameComplete.value = true;

  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }

  // Submit results to backend
  try {
    isLoading.value = true;
    const result = await submitGameResults({
      userId: props.userId,
      lessonId: props.lessonId,
      stepIndex: props.stepIndex,
      gameType: props.gameType,
      score: score.value,
      accuracy: accuracy.value,
      timeSpent: timeSpent.value,
      itemsCollected: itemsCollected.value,
      correctItems: correctItems.value,
      wrongItems: wrongItems.value,
      completed: score.value >= targetScore.value * 0.5,
      actions: actions.value,
      metadata: {
        stars: stars.value,
        livesRemaining: lives.value,
        ...data
      }
    });

    if (result.success) {
      isPersonalBest.value = result.result?.personalBest || false;
    }
  } catch (error) {
    console.error('Error submitting game results:', error);
  } finally {
    isLoading.value = false;
  }
};

const retryGame = () => {
  gameComplete.value = false;
  gameStarted.value = false;
  score.value = 0;
  lives.value = maxLives.value;
  timeRemaining.value = timeLimit.value;
  itemsCollected.value = 0;
  correctItems.value = 0;
  wrongItems.value = 0;
  actions.value = [];
};

const continueLesson = () => {
  emit('game-complete', {
    score: score.value,
    stars: stars.value,
    completed: true,
    accuracy: accuracy.value
  });
};

const handleShare = (shareData) => {
  // Handle share
};

// Lifecycle
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  border-radius: 12px;
  /* Transparent - each game handles its own background */
  background: transparent;
}

/* Game-specific fallback backgrounds */
.game-container.game-basket-catch {
  background: linear-gradient(180deg, #87CEEB 0%, #98D8C8 100%);
}

.game-container.game-memory-cards {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.game-container.game-whack-a-mole {
  /* WhackAMole has its own green background */
  background: transparent;
}

.game-container.game-lightning-round {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.game-container.game-pattern-builder {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.game-container.game-maze-runner {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.game-loading {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 300;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .game-container {
    min-height: 350px;
  }
}
</style>