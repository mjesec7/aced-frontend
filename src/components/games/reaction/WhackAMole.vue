<template>
  <div class="whack-a-mole-game">
    <!-- Game Board -->
    <div class="mole-grid">
      <div
        v-for="hole in holes"
        :key="hole.id"
        class="hole"
        @click="whackHole(hole)"
      >
        <transition name="pop">
          <div
            v-if="hole.active"
            class="mole"
            :class="{ 'is-correct': hole.isCorrect, 'is-wrong': !hole.isCorrect }"
          >
            <div class="mole-content">
              {{ hole.content }}
            </div>
            <div class="mole-emoji">
              {{ hole.isCorrect ? '✅' : '❌' }}
            </div>
          </div>
        </transition>
        <div class="hole-base"></div>
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
const holes = ref([]);
const gameActive = ref(true);
const spawnInterval = ref(null);
const difficulty = ref(1); // Increases over time

// Computed
const instructions = computed(() => {
  return props.gameData?.instructions || 'Click the correct moles!';
});

const items = computed(() => {
  return props.gameData?.items || [];
});

const gridSize = computed(() => {
  return props.gameData?.gridSize || 9;
});

// Methods
const initializeHoles = () => {
  const holeCount = gridSize.value;
  holes.value = Array.from({ length: holeCount }, (_, index) => ({
    id: index,
    active: false,
    content: '',
    isCorrect: true,
    timeoutId: null
  }));
};

const spawnMole = () => {
  if (!gameActive.value || items.value.length === 0) return;

  // Find available holes
  const availableHoles = holes.value.filter(hole => !hole.active);
  if (availableHoles.length === 0) return;

  // Pick random hole
  const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];

  // Pick random item
  const randomItem = items.value[Math.floor(Math.random() * items.value.length)];

  // Activate mole
  randomHole.active = true;
  randomHole.content = randomItem.text || randomItem.word || randomItem;
  randomHole.isCorrect = randomItem.isCorrect !== undefined ? randomItem.isCorrect : true;

  // Auto-hide after duration (decreases with difficulty)
  const displayDuration = Math.max(800, 2000 - (difficulty.value * 200));

  randomHole.timeoutId = setTimeout(() => {
    if (randomHole.active) {
      // Mole wasn't hit in time
      if (randomHole.isCorrect) {
        // Missed a correct mole - lose life
        emit('life-lost');
        emit('item-collected', { isCorrect: false });
      }
      randomHole.active = false;
    }
  }, displayDuration);
};

const whackHole = (hole) => {
  if (!hole.active || !gameActive.value) return;

  // Clear timeout
  if (hole.timeoutId) {
    clearTimeout(hole.timeoutId);
  }

  const isCorrect = hole.isCorrect;

  // Calculate score change
  const scoreChange = isCorrect ? 15 : -10;

  // Emit events
  emit('score-change', scoreChange);
  emit('item-collected', { isCorrect });

  if (!isCorrect) {
    emit('life-lost');
  }

  // Hide mole
  hole.active = false;

  // Add feedback animation class
  setTimeout(() => {
    // Could add visual feedback here
  }, 100);
};

const startGame = () => {
  gameActive.value = true;
  difficulty.value = 1;

  // Spawn moles at intervals
  spawnInterval.value = setInterval(() => {
    spawnMole();

    // Increase difficulty every 10 seconds
    if (props.timeRemaining % 10 === 0 && difficulty.value < 5) {
      difficulty.value++;
    }
  }, 1200); // Spawn interval
};

const stopGame = () => {
  gameActive.value = false;
  if (spawnInterval.value) {
    clearInterval(spawnInterval.value);
  }

  // Clear all active moles
  holes.value.forEach(hole => {
    if (hole.timeoutId) {
      clearTimeout(hole.timeoutId);
    }
    hole.active = false;
  });
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
  initializeHoles();
  startGame();
});

onUnmounted(() => {
  stopGame();
});
</script>

<style scoped>
.whack-a-mole-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.mole-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 600px;
  width: 100%;
}

.hole {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  user-select: none;
}

.hole-base {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 30%;
  background: #8b4513;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow: inset 0 -4px 8px rgba(0,0,0,0.3);
}

.mole {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.mole.is-correct {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  border: 3px solid #16a34a;
}

.mole.is-wrong {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: white;
  border: 3px solid #dc2626;
}

.mole-content {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  word-break: break-word;
}

.mole-emoji {
  font-size: 24px;
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

/* Pop animation */
.pop-enter-active {
  animation: popUp 0.3s ease-out;
}

.pop-leave-active {
  animation: popDown 0.2s ease-in;
}

@keyframes popUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes popDown {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(50%);
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .mole-grid {
    gap: 15px;
    max-width: 400px;
  }

  .mole-content {
    font-size: 14px;
  }

  .mole-emoji {
    font-size: 20px;
  }

  .game-instructions {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>
