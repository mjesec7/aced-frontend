<template>
  <div class="game-container" :class="`game-${gameType}`">
    <!-- Game HUD -->
    <GameHUD
      v-if="gameStarted && !gameComplete"
      :score="score"
      :timer="timeRemaining"
      :lives="lives"
      :max-lives="maxLives"
      :target-score="targetScore"
      :progress="progress"
    />

    <!-- Instructions Overlay -->
    <transition name="fade">
      <div v-if="showInstructions" class="instructions-overlay">
        <div class="instructions-card">
          <div class="instructions-icon">
            {{ gameIcon }}
          </div>
          <h2 class="instructions-title">{{ gameTitle }}</h2>
          <p class="instructions-text">{{ instructions }}</p>
          <div class="instructions-meta">
            <div class="meta-item">
              <span class="meta-icon">⏱️</span>
              <span>{{ timeLimit }}s</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">🎯</span>
              <span>Target: {{ targetScore }}</span>
            </div>
            <div v-if="maxLives > 0" class="meta-item">
              <span class="meta-icon">❤️</span>
              <span>{{ maxLives }} lives</span>
            </div>
          </div>
          <button @click="startGame" class="start-btn">
            Start Game
          </button>
        </div>
      </div>
    </transition>

    <!-- Dynamic Game Component -->
    <component
      :is="gameComponent"
      v-if="gameStarted && !gameComplete"
      :game-data="gameData"
      :score="score"
      :lives="lives"
      :time-remaining="timeRemaining"
      @score-change="handleScoreChange"
      @life-lost="handleLifeLost"
      @game-complete="handleGameComplete"
      @item-collected="handleItemCollected"
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
const showInstructions = ref(true);
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
    'pattern-builder': PatternBuilder
  };
  return components[props.gameType] || BasketCatch;
});

const gameTitle = computed(() => {
  const titles = {
    'basket-catch': '🧺 Basket Catch',
    'memory-cards': '🎴 Memory Cards',
    'whack-a-mole': '🔨 Whack-a-Mole',
    'lightning-round': '⚡ Lightning Round',
    'pattern-builder': '🔵 Pattern Builder'
  };
  return titles[props.gameType] || 'Game';
});

const gameIcon = computed(() => {
  const icons = {
    'basket-catch': '🧺',
    'memory-cards': '🎴',
    'whack-a-mole': '🔨',
    'lightning-round': '⚡',
    'pattern-builder': '🔵'
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
const startGame = () => {
  gameStarted.value = true;
  showInstructions.value = false;
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

  // TODO: Add sound effect support
  // sound.play('start');
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
    console.error('Failed to submit game results:', error);
  } finally {
    isLoading.value = false;
  }
};

const retryGame = () => {
  gameComplete.value = false;
  gameStarted.value = false;
  showInstructions.value = true;
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
  console.log('Sharing results:', shareData);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
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
