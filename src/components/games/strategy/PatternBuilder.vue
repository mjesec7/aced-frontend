<template>
  <div class="pattern-builder-game">
    <!-- Pattern Display (what to build) -->
    <div class="pattern-display">
      <h3 class="pattern-title">Build this pattern:</h3>
      <div class="pattern-items">
        <div
          v-for="(item, index) in targetPattern"
          :key="`target-${index}`"
          class="pattern-item target"
        >
          {{ item }}
        </div>
      </div>
    </div>

    <!-- Player's Pattern -->
    <div class="player-pattern">
      <h3 class="pattern-title">Your pattern:</h3>
      <div class="pattern-items">
        <div
          v-for="(item, index) in playerPattern"
          :key="`player-${index}`"
          class="pattern-item player"
          :class="{ correct: isCorrectPosition(index), wrong: isWrongPosition(index) }"
          @click="removeItem(index)"
        >
          {{ item }}
          <span class="remove-icon">×</span>
        </div>
        <div v-if="playerPattern.length < targetPattern.length" class="pattern-item empty">
          ?
        </div>
      </div>
    </div>

    <!-- Available Items -->
    <div class="available-items">
      <h3 class="items-title">Drag or click items:</h3>
      <div class="items-grid">
        <button
          v-for="(item, index) in availableItems"
          :key="`available-${index}`"
          class="item-btn"
          :disabled="!item.available"
          @click="addItem(item)"
        >
          {{ item.text }}
        </button>
      </div>
    </div>

    <!-- Check Button -->
    <button
      v-if="playerPattern.length === targetPattern.length"
      class="check-btn"
      @click="checkPattern"
    >
      Check Pattern
    </button>

    <!-- Instructions -->
    <div class="game-instructions">
      {{ instructions }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

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
const targetPattern = ref([]);
const playerPattern = ref([]);
const availableItems = ref([]);
const currentLevel = ref(0);
const checked = ref(false);
const gameActive = ref(true);

// Computed
const instructions = computed(() => {
  return props.gameData?.instructions || 'Build the pattern using the items below!';
});

const patterns = computed(() => {
  return props.gameData?.items || props.gameData?.patterns || [];
});

// Methods
const initializeLevel = () => {
  if (currentLevel.value >= patterns.value.length) {
    // All levels complete
    emit('game-complete', { reason: 'all-patterns-completed' });
    gameActive.value = false;
    return;
  }

  const pattern = patterns.value[currentLevel.value];

  // Set target pattern
  if (Array.isArray(pattern)) {
    targetPattern.value = [...pattern];
  } else if (pattern.pattern) {
    targetPattern.value = [...pattern.pattern];
  } else {
    // Fallback: generate a simple pattern
    targetPattern.value = ['A', 'B', 'C'];
  }

  // Reset player pattern
  playerPattern.value = [];
  checked.value = false;

  // Create available items (shuffled version of target + some extras)
  const items = [...targetPattern.value];

  // Add some distractor items if specified
  if (pattern.distractors) {
    items.push(...pattern.distractors);
  }

  // Shuffle items
  const shuffled = shuffleArray(items);

  availableItems.value = shuffled.map((text, index) => ({
    id: index,
    text: text,
    available: true
  }));
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const addItem = (item) => {
  if (!item.available || !gameActive.value) return;

  if (playerPattern.value.length < targetPattern.value.length) {
    playerPattern.value.push(item.text);
    item.available = false;
  }
};

const removeItem = (index) => {
  if (!gameActive.value || checked.value) return;

  const removedText = playerPattern.value[index];
  playerPattern.value.splice(index, 1);

  // Make item available again
  const availableItem = availableItems.value.find(
    item => item.text === removedText && !item.available
  );
  if (availableItem) {
    availableItem.available = true;
  }
};

const checkPattern = () => {
  if (playerPattern.value.length !== targetPattern.value.length) return;

  checked.value = true;

  // Check if pattern matches
  const isCorrect = playerPattern.value.every(
    (item, index) => item === targetPattern.value[index]
  );

  if (isCorrect) {
    // Correct!
    const points = 25 + (targetPattern.value.length * 5);
    emit('score-change', points);
    emit('item-collected', { isCorrect: true });

    // Move to next level after delay
    setTimeout(() => {
      currentLevel.value++;
      initializeLevel();
    }, 1500);
  } else {
    // Incorrect
    emit('score-change', -10);
    emit('life-lost');
    emit('item-collected', { isCorrect: false });

    // Allow retry after delay
    setTimeout(() => {
      resetLevel();
    }, 2000);
  }
};

const resetLevel = () => {
  playerPattern.value = [];
  checked.value = false;

  // Reset all items to available
  availableItems.value.forEach(item => {
    item.available = true;
  });
};

const isCorrectPosition = (index) => {
  if (!checked.value) return false;
  return playerPattern.value[index] === targetPattern.value[index];
};

const isWrongPosition = (index) => {
  if (!checked.value) return false;
  return playerPattern.value[index] !== targetPattern.value[index];
};

// Watch for game end conditions
watch(() => props.lives, (newLives) => {
  if (newLives <= 0) {
    gameActive.value = false;
  }
});

watch(() => props.timeRemaining, (newTime) => {
  if (newTime <= 0) {
    gameActive.value = false;
  }
});

// Lifecycle
onMounted(() => {
  if (patterns.value.length > 0) {
    initializeLevel();
  } else {
}
});
</script>

<style scoped>
.pattern-builder-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  padding: 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pattern-display,
.player-pattern {
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.pattern-title,
.items-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 0 0 15px 0;
  text-align: center;
}

.pattern-items {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  min-height: 60px;
  align-items: center;
}

.pattern-item {
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
  transition: all 0.2s;
  position: relative;
}

.pattern-item.target {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  box-shadow: 0 4px 8px rgba(168, 85, 247, 0.3);
}

.pattern-item.player {
  background: #e0e0e0;
  color: #333;
  cursor: pointer;
  border: 2px solid transparent;
}

.pattern-item.player:hover .remove-icon {
  opacity: 1;
}

.pattern-item.player.correct {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  border-color: #16a34a;
  animation: bounce 0.5s;
}

.pattern-item.player.wrong {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: white;
  border-color: #dc2626;
  animation: shake 0.5s;
}

.pattern-item.empty {
  background: #f5f5f5;
  color: #999;
  border: 2px dashed #ccc;
}

.remove-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.available-items {
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}

.item-btn {
  padding: 12px 16px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
}

.item-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(251, 191, 36, 0.4);
}

.item-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.check-btn {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.check-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
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
  .pattern-builder-game {
    padding: 15px;
    gap: 15px;
  }

  .pattern-display,
  .player-pattern,
  .available-items {
    padding: 15px;
  }

  .pattern-item {
    padding: 10px 16px;
    font-size: 16px;
    min-width: 50px;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }

  .item-btn {
    padding: 10px 12px;
    font-size: 14px;
  }

  .check-btn {
    font-size: 16px;
    padding: 14px;
  }

  .game-instructions {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>
