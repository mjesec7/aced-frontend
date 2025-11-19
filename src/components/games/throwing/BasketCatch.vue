<template>
  <div
    class="basket-catch-game"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
    @click="handleGameClick"
  >
    <transition-group name="fall" tag="div" class="items-layer">
      <div
        v-for="item in fallingItems"
        :key="item.id"
        class="falling-item"
        :class="{ 'is-correct': item.isCorrect, 'is-wrong': !item.isCorrect }"
        :style="{
          left: item.x + '%',
          top: item.y + '%',
          transition: 'top ' + item.speed + 's linear'
        }"
      >
        <div class="item-bubble">
          {{ item.text }}
        </div>
      </div>
    </transition-group>

    <div class="basket" :style="{ left: basketPosition + '%' }">
      <div class="basket-emoji">🧺</div>
      <div class="basket-hitbox"></div>
    </div>

    <transition name="fade">
      <div v-if="showStartHint" class="game-overlay-hint">
        Move mouse or drag to catch!
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
const gameLoopFrame = ref(null);
const showStartHint = ref(true);

// Game Config
const BASKET_WIDTH_PERCENT = 15; // Approximate width of basket in %
const HIT_Y_THRESHOLD = 85; // Y-position % where catch happens

// Computed
const itemsPool = computed(() => {
  // Merge correct and wrong answers into a single pool
  const correct = (props.gameData.correctAnswers || []).map(text => ({ text, isCorrect: true }));
  const wrong = (props.gameData.wrongAnswers || []).map(text => ({ text, isCorrect: false }));

  // Fallback if no specific arrays
  if (correct.length === 0 && wrong.length === 0 && props.gameData.items) {
      return props.gameData.items;
  }
  return [...correct, ...wrong];
});

// Methods
const spawnItem = () => {
  if (!gameActive.value || itemsPool.value.length === 0) return;

  const randomItem = itemsPool.value[Math.floor(Math.random() * itemsPool.value.length)];

  // Randomize speed based on difficulty
  const baseSpeed = props.gameData.difficulty === 'hard' ? 2 : 3;

  const newItem = {
    id: `item-${itemIdCounter.value++}`,
    text: randomItem.text,
    isCorrect: randomItem.isCorrect,
    x: Math.random() * 90, // 0-90% width
    y: -10, // Start above
    speed: baseSpeed + Math.random(), // seconds to fall
    startTime: Date.now()
  };

  fallingItems.value.push(newItem);

  // Start the fall animation immediately via CSS class trigger
  requestAnimationFrame(() => {
      const item = fallingItems.value.find(i => i.id === newItem.id);
      if (item) item.y = 110; // Trigger CSS transition
  });

  // Cleanup timeout (backup for game loop)
  setTimeout(() => {
      removeItem(newItem.id, false);
  }, (newItem.speed + 1) * 1000);
};

const checkCollisions = () => {
  if (!gameActive.value) return;

  fallingItems.value.forEach(item => {
      // Get current Y based on time (CSS transition approximation)
      // Note: For precise games, we'd use JS animation, but this is efficient
      // We rely on the fact that items falling "through" the hit zone will be caught

      // Simple hit detection: if item is in catch zone Y
      // We check the DOM element position for truth
      const el = document.getElementById(item.id); // Ideally use refs map, but DOM query is okay for low item count

      // Logic: Since we use CSS transition, we calculate position mathematically
      const elapsed = (Date.now() - item.startTime) / 1000;
      const progress = elapsed / item.speed;
      const currentY = -10 + (progress * 120); // -10 to 110

      if (currentY > HIT_Y_THRESHOLD && currentY < HIT_Y_THRESHOLD + 10) {
          // Check X overlap
          const basketLeft = basketPosition.value - (BASKET_WIDTH_PERCENT / 2);
          const basketRight = basketPosition.value + (BASKET_WIDTH_PERCENT / 2);

          if (item.x + 5 > basketLeft && item.x < basketRight) {
              catchItem(item);
          }
      }
  });

  gameLoopFrame.value = requestAnimationFrame(checkCollisions);
};

const catchItem = (item) => {
  if (item.caught) return;
  item.caught = true;

  // Visual feedback would go here

  if (item.isCorrect) {
      emit('score-change', 10);
      emit('item-collected', { isCorrect: true });
  } else {
      emit('score-change', -5);
      emit('life-lost');
      emit('item-collected', { isCorrect: false });
  }

  removeItem(item.id, true);
};

const removeItem = (itemId, caught) => {
  const index = fallingItems.value.findIndex(i => i.id === itemId);
  if (index !== -1) {
      fallingItems.value.splice(index, 1);
  }
};

// Controls
const handleMouseMove = (e) => {
  if (!gameContainer.value) return;
  const rect = gameContainer.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = (x / rect.width) * 100;
  basketPosition.value = Math.max(5, Math.min(95, percent));
  showStartHint.value = false;
};

const handleTouchMove = (e) => {
  e.preventDefault(); // Prevent scroll
  if (!gameContainer.value || !e.touches[0]) return;
  const rect = gameContainer.value.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const percent = (x / rect.width) * 100;
  basketPosition.value = Math.max(5, Math.min(95, percent));
  showStartHint.value = false;
};

const handleGameClick = () => {
  // Fallback for click-to-move
  showStartHint.value = false;
};

// Lifecycle
const startGame = () => {
  gameActive.value = true;
  spawnInterval.value = setInterval(spawnItem, 1500);
  checkCollisions();
  setTimeout(() => { showStartHint.value = false; }, 3000);
};

const stopGame = () => {
  gameActive.value = false;
  clearInterval(spawnInterval.value);
  cancelAnimationFrame(gameLoopFrame.value);
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
  min-height: 400px;
  background: linear-gradient(to bottom, #87CEEB, #E0F7FA);
  overflow: hidden;
  border-radius: 12px;
  cursor: none; /* Hide cursor for immersion */
  touch-action: none;
}

.items-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.falling-item {
  position: absolute;
  width: auto;
  max-width: 120px;
  /* Transition is handled inline for performance */
}

.item-bubble {
  background: white;
  padding: 8px 12px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  font-weight: bold;
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
}

.falling-item.is-correct .item-bubble {
  border: 2px solid #4CAF50;
  color: #2E7D32;
}

.falling-item.is-wrong .item-bubble {
  border: 2px solid #F44336;
  color: #C62828;
}

.basket {
  position: absolute;
  bottom: 20px;
  width: 80px; /* Approximate size */
  height: 60px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 10;
}

.basket-emoji {
  font-size: 60px;
  line-height: 1;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.2));
}

.game-overlay-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 18px;
  pointer-events: none;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
