<template>
  <div class="game-container" :class="`game-${gameType}`">

    <!-- Dynamic Game Component - Games have their own start modals -->
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
// TODO: Add sound effect support
// import { useSound } from '@/composables/useSound';
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
  gameData: {
    type: Object,
    required: true
  },
  gameType: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  lessonId: {
    type: String,
    required: true
  },
  stepIndex: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['game-complete', 'game-exit']);

// Composables
// TODO: Add sound effect support
// const sound = useSound();

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
// Called when child game component starts (emits 'game-started')
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

  // Start timer
  startTimer();
};

const startTimer = () => {
  timerInterval.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;

      // Warning sound at 10 seconds
      if (timeRemaining.value === 10) {
        // TODO: Add sound effect support
        // sound.play('warning');
      }
    } else {
      clearInterval(timerInterval.value);
      handleGameComplete({ reason: 'timeout' });
    }
  }, 1000);
};

const handleScoreChange = (change) => {
  score.value += change;

  // Record action
  actions.value.push({
    timestamp: new Date().toISOString(),
    action: change > 0 ? 'correct' : 'wrong',
    points: change
  });

  if (change > 0) {
    // TODO: Add sound effect support
    // sound.play('success');
  }
};

const handleLifeLost = () => {
  lives.value--;
  // TODO: Add sound effect support
  // sound.play('error');

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

  // Play completion sound
  if (stars.value >= 2) {
    // TODO: Add sound effect support
    // sound.play('complete');
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
};

const handleGiveUp = () => {
  showGiveUpConfirm.value = false;
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
  emit('game-exit', { score: score.value, gaveUp: true });
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
  min-height: 500px;
  overflow: hidden;
  /* FIXED: Changed from blue/purple gradient to transparent */
  /* Each game component now handles its own background */
  background: transparent;
  border-radius: 12px;
}

/* Game-specific container backgrounds (fallbacks) */
.game-container.game-basket-catch {
  background: linear-gradient(180deg, #87CEEB 0%, #98D8C8 100%);
}

.game-container.game-memory-cards {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.game-container.game-whack-a-mole {
  /* WhackAMole has its own green background, keep container transparent */
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

.instructions-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.instructions-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  animation: slideUp 0.4s ease-out;
  font-family: 'Fredoka', sans-serif;
}

@keyframes slideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.instructions-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.instructions-title {
  font-size: 28px;
  font-weight: 800;
  color: #333;
  margin: 0 0 15px 0;
}

.instructions-text {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 30px 0;
}

.instructions-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.meta-icon {
  font-size: 18px;
}

.start-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(168, 85, 247, 0.4);
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

/* Give Up Button */
.give-up-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  z-index: 150;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.give-up-btn:hover {
  background: rgba(220, 38, 38, 1);
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5);
}

/* Confirmation Modal */
.confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 250;
}

.confirm-modal {
  background: white;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  max-width: 320px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
}

.confirm-modal h3 {
  margin: 0 0 12px;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
}

.confirm-modal p {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 1rem;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
}

.confirm-btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-btn.cancel {
  background: #f1f5f9;
  color: #475569;
}

.confirm-btn.cancel:hover {
  background: #e2e8f0;
}

.confirm-btn.confirm {
  background: #ef4444;
  color: white;
}

.confirm-btn.confirm:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .instructions-card {
    padding: 30px 20px;
  }

  .instructions-icon {
    font-size: 48px;
  }

  .instructions-title {
    font-size: 24px;
  }
}
</style>