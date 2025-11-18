<template>
  <div class="basket-catch-game">
    <!-- Falling Items -->
    <transition-group name="fall" tag="div" class="items-container">
      <div
        v-for="item in fallingItems"
        :key="item.id"
        class="falling-item"
        :class="{ 'is-correct': item.isCorrect, 'is-wrong': !item.isCorrect }"
        :style="{
          left: item.x + '%',
          top: item.y + '%',
          animationDuration: item.speed + 's'
        }"
        @click="catchItem(item)"
      >
        <div class="item-content">
          {{ item.text }}
        </div>
      </div>
    </transition-group>

    <!-- Basket (Player) -->
    <div class="basket" :style="{ left: basketPosition + '%' }">
      <div class="basket-visual">🧺</div>
      <div class="basket-label">Catch!</div>
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
const fallingItems = ref([]);
const basketPosition = ref(50); // Percentage from left
const gameActive = ref(true);
const itemIdCounter = ref(0);
const spawnInterval = ref(null);

// Computed
const instructions = computed(() => {
  return props.gameData?.instructions || 'Click correct items to catch them!';
});

const items = computed(() => {
  return props.gameData?.items || [];
});

// Methods
const spawnItem = () => {
  if (!gameActive.value || items.value.length === 0) return;

  // Pick a random item from the game data
  const randomItem = items.value[Math.floor(Math.random() * items.value.length)];

  const newItem = {
    id: `item-${itemIdCounter.value++}`,
    text: randomItem.text || randomItem,
    isCorrect: randomItem.isCorrect !== undefined ? randomItem.isCorrect : true,
    x: Math.random() * 90, // Random horizontal position (0-90%)
    y: -10, // Start above viewport
    speed: 3 + Math.random() * 2, // Random fall speed (3-5 seconds)
    caught: false
  };

  fallingItems.value.push(newItem);

  // Remove item after it falls off screen
  setTimeout(() => {
    removeItem(newItem.id, false);
  }, (newItem.speed + 1) * 1000);
};

const catchItem = (item) => {
  if (item.caught || !gameActive.value) return;

  item.caught = true;

  // Determine if correct
  const isCorrect = item.isCorrect;

  // Calculate score change
  const scoreChange = isCorrect ? 10 : -5;

  // Emit events
  emit('score-change', scoreChange);
  emit('item-collected', { isCorrect });

  if (!isCorrect) {
    emit('life-lost');
  }

  // Remove item
  removeItem(item.id, true);

  // Visual feedback
  animateCatch(item.x, item.y);
};

const removeItem = (itemId, caught) => {
  const index = fallingItems.value.findIndex(item => item.id === itemId);
  if (index !== -1) {
    const item = fallingItems.value[index];

    // If item fell off screen without being caught and it was a correct item, lose life
    if (!caught && item.isCorrect && !item.caught) {
      emit('life-lost');
      emit('item-collected', { isCorrect: false });
    }

    fallingItems.value.splice(index, 1);
  }
};

const animateCatch = (x, y) => {
  // Could add particle effects here
};

const startGame = () => {
  gameActive.value = true;

  // Spawn items at regular intervals
  spawnInterval.value = setInterval(() => {
    spawnItem();
  }, 1500); // Spawn new item every 1.5 seconds
};

const stopGame = () => {
  gameActive.value = false;
  if (spawnInterval.value) {
    clearInterval(spawnInterval.value);
  }
  fallingItems.value = [];
};

// Keyboard controls for basket movement (optional)
const handleKeydown = (event) => {
  if (!gameActive.value) return;

  if (event.key === 'ArrowLeft' && basketPosition.value > 0) {
    basketPosition.value = Math.max(0, basketPosition.value - 5);
  } else if (event.key === 'ArrowRight' && basketPosition.value < 90) {
    basketPosition.value = Math.min(90, basketPosition.value + 5);
  }
};

// Mouse/touch controls for basket movement
const handleMouseMove = (event) => {
  if (!gameActive.value) return;

  const gameContainer = event.currentTarget;
  const rect = gameContainer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = (x / rect.width) * 100;

  basketPosition.value = Math.max(0, Math.min(90, percentage - 5)); // -5 to center basket
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
  startGame();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  stopGame();
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.basket-catch-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%);
  overflow: hidden;
  cursor: pointer;
}

.items-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.falling-item {
  position: absolute;
  pointer-events: all;
  cursor: pointer;
  animation: fall linear forwards;
  transition: transform 0.2s;
}

.falling-item:hover {
  transform: scale(1.1);
}

@keyframes fall {
  from {
    top: -10%;
  }
  to {
    top: 110%;
  }
}

.item-content {
  background: white;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  white-space: nowrap;
  transition: all 0.2s;
}

.falling-item.is-correct .item-content {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  border: 3px solid #16a34a;
}

.falling-item.is-wrong .item-content {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: white;
  border: 3px solid #dc2626;
}

.basket {
  position: absolute;
  bottom: 40px;
  transform: translateX(-50%);
  transition: left 0.1s ease-out;
  pointer-events: none;
  z-index: 100;
}

.basket-visual {
  font-size: 64px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.basket-label {
  text-align: center;
  font-weight: 700;
  color: #333;
  margin-top: -10px;
  font-size: 14px;
  text-shadow: 0 2px 4px rgba(255,255,255,0.8);
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-width: 80%;
  text-align: center;
}

.fall-enter-active {
  transition: opacity 0.3s;
}

.fall-enter-from {
  opacity: 0;
}

.fall-leave-active {
  transition: opacity 0.2s;
}

.fall-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .item-content {
    font-size: 14px;
    padding: 8px 16px;
  }

  .basket-visual {
    font-size: 48px;
  }

  .game-instructions {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>
