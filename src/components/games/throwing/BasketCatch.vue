<template>
  <div
    class="basket-catch-game"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
    @click="handleGameClick"
  >
    <div class="game-header">
        <div class="instruction-pill">
            <span class="icon">💡</span>
            <span>{{ instructionsText }}</span>
        </div>
    </div>

    <div class="items-layer">
      <div
        v-for="item in fallingItems"
        :key="item.id"
        class="falling-item"
        :class="{ 'is-correct': item.isCorrect, 'is-wrong': !item.isCorrect }"
        :style="{
          left: item.x + '%',
          top: item.y + '%',
          transition: item.falling ? `top ${item.speed}s linear` : 'none'
        }"
      >
        <div class="item-bubble">
          {{ item.text }}
        </div>
      </div>
    </div>

    <div class="basket" :style="{ left: basketPosition + '%' }">
      <div class="basket-emoji">🧺</div>
      <div class="basket-hitbox"></div>
    </div>

    <transition name="fade">
      <div v-if="showStartHint" class="game-overlay-hint">
        <div class="hint-content">
            <span class="mouse-icon">🖱️</span>
            Slide to Catch!
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  gameData: { type: Object, required: true },
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 3 },
  timeRemaining: { type: Number, default: 60 }
});

const emit = defineEmits(['score-change', 'life-lost', 'item-collected']);

// Refs
const gameContainer = ref(null);
const fallingItems = ref([]);
const basketPosition = ref(50);
const gameActive = ref(true);
const itemIdCounter = ref(0);
const spawnInterval = ref(null);
const collisionInterval = ref(null);
const showStartHint = ref(true);

// Game Constants
const HIT_Y_THRESHOLD = 82; // % from top where catch happens
const BASKET_WIDTH_PERCENT = 12;

// Computed
const itemsPool = computed(() => {
  // 1. Try explicit arrays
  if (props.gameData.correctAnswers?.length || props.gameData.wrongAnswers?.length) {
      const correct = (props.gameData.correctAnswers || []).map(text => ({ text, isCorrect: true }));
      const wrong = (props.gameData.wrongAnswers || []).map(text => ({ text, isCorrect: false }));
      return [...correct, ...wrong];
  }

  // 2. Try generic items array
  if (props.gameData.items?.length) {
      return props.gameData.items.map(i =>
          typeof i === 'string' ? { text: i, isCorrect: true } : i
      );
  }

  // 3. Fallback for testing
  return [
      { text: "Correct 1", isCorrect: true },
      { text: "Correct 2", isCorrect: true },
      { text: "Wrong 1", isCorrect: false },
      { text: "Wrong 2", isCorrect: false }
  ];
});

const instructionsText = computed(() => {
    // Try to find a specific instruction about what to catch
    if (props.gameData.instructions) {
        // Simplify long instructions for the top bar
        const simple = props.gameData.instructions.split('\n')[0];
        return simple.length > 50 ? simple.substring(0, 47) + '...' : simple;
    }
    return "Catch the correct answers!";
});

// Methods
const spawnItem = () => {
  if (!gameActive.value || itemsPool.value.length === 0) return;

  const randomItem = itemsPool.value[Math.floor(Math.random() * itemsPool.value.length)];
  const baseSpeed = props.gameData.difficulty === 'hard' ? 2.5 : 4;

  const newItem = {
    id: `item-${itemIdCounter.value++}`,
    text: randomItem.text,
    isCorrect: randomItem.isCorrect,
    x: Math.random() * 85 + 5, // 5-90% to keep in bounds
    y: -15, // Start above
    speed: baseSpeed - (Math.random() * 1), // Random speed variation
    falling: false, // Animation trigger
    startTime: Date.now()
  };

  fallingItems.value.push(newItem);

  // Trigger animation in next frame
  setTimeout(() => {
      const item = fallingItems.value.find(i => i.id === newItem.id);
      if (item) {
          item.falling = true; // Enable transition
          item.y = 120; // Destination
      }
  }, 50);

  // Cleanup failsafe
  setTimeout(() => {
      removeItem(newItem.id);
  }, (newItem.speed + 1) * 1000);
};

const checkCollisions = () => {
  if (!gameActive.value) return;

  fallingItems.value.forEach(item => {
      if (item.caught) return;

      // Calculate current Y position based on time (more accurate than DOM polling)
      const elapsed = (Date.now() - item.startTime) / 1000; // seconds
      const progress = elapsed / item.speed; // 0 to 1

      // Map progress (0 to 1) to Y (-15 to 120)
      const currentY = -15 + (progress * 135);

      // Check if item is in the "Catch Zone"
      if (currentY > HIT_Y_THRESHOLD && currentY < HIT_Y_THRESHOLD + 10) {
          // Check X overlap
          const basketLeft = basketPosition.value - (BASKET_WIDTH_PERCENT / 2);
          const basketRight = basketPosition.value + (BASKET_WIDTH_PERCENT / 2);

          // Allow some leniency
          if (item.x + 5 > basketLeft && item.x < basketRight) {
              catchItem(item);
          }
      }
  });
};

const catchItem = (item) => {
  if (item.caught) return;
  item.caught = true;

  // Stop falling visual
  const el = document.getElementById(item.id);
  if (el) el.style.transition = 'none';

  if (item.isCorrect) {
      emit('score-change', 10);
      emit('item-collected', { isCorrect: true });
  } else {
      emit('score-change', -5);
      emit('life-lost');
      emit('item-collected', { isCorrect: false });
  }

  removeItem(item.id);
};

const removeItem = (itemId) => {
  const index = fallingItems.value.findIndex(i => i.id === itemId);
  if (index !== -1) {
      fallingItems.value.splice(index, 1);
  }
};

// Input Handlers
const handleMouseMove = (e) => {
  if (!gameContainer.value) return;
  const rect = gameContainer.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  updateBasket(x, rect.width);
};

const handleTouchMove = (e) => {
  e.preventDefault();
  if (!gameContainer.value || !e.touches[0]) return;
  const rect = gameContainer.value.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  updateBasket(x, rect.width);
};

const updateBasket = (x, width) => {
    const percent = (x / width) * 100;
    basketPosition.value = Math.max(8, Math.min(92, percent));
    showStartHint.value = false;
};

const handleGameClick = () => {
  showStartHint.value = false;
};

// Lifecycle
const startGame = () => {
  gameActive.value = true;
  spawnInterval.value = setInterval(spawnItem, 1200);
  collisionInterval.value = setInterval(checkCollisions, 50); // Check 20 times a second
  setTimeout(() => { showStartHint.value = false; }, 3000);
};

const stopGame = () => {
  gameActive.value = false;
  clearInterval(spawnInterval.value);
  clearInterval(collisionInterval.value);
  fallingItems.value = [];
};

watch(() => props.lives, (val) => { if(val <= 0) stopGame(); });
watch(() => props.timeRemaining, (val) => { if(val <= 0) stopGame(); });

onMounted(startGame);
onUnmounted(stopGame);
</script>

<style scoped>
.basket-catch-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #87CEEB, #E0F7FA);
  overflow: hidden;
  border-radius: 12px;
  cursor: none;
  user-select: none;
  touch-action: none;
  font-family: 'Nunito', sans-serif;
}

/* Header / Instructions */
.game-header {
    position: absolute;
    top: 10px;
    width: 100%;
    display: flex;
    justify-content: center;
    z-index: 20;
    pointer-events: none;
}

.instruction-pill {
    background: rgba(255, 255, 255, 0.9);
    padding: 6px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #333;
    font-size: clamp(12px, 2vw, 16px); /* Responsive Font */
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 90%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Items */
.items-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.falling-item {
  position: absolute;
  transform: translateX(-50%);
  z-index: 10;
}

.item-bubble {
  background: white;
  padding: 8px 14px;
  border-radius: 50px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  font-weight: 800;
  font-size: clamp(12px, 2.5vw, 18px); /* Responsive Font */
  text-align: center;
  white-space: nowrap;
  border: 2px solid transparent;
}

.falling-item.is-correct .item-bubble {
  border-color: #4CAF50;
  color: #2E7D32;
}

.falling-item.is-wrong .item-bubble {
  border-color: #F44336;
  color: #C62828;
}

/* Basket */
.basket {
  position: absolute;
  bottom: 5%; /* Relative positioning */
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 30;
  display: flex;
  justify-content: center;
  align-items: center;
}

.basket-emoji {
  font-size: clamp(40px, 8vw, 80px); /* Responsive Size */
  line-height: 1;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
}

/* Hint */
.game-overlay-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  pointer-events: none;
}

.hint-content {
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 12px 24px;
    border-radius: 30px;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
