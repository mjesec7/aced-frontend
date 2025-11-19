<template>
  <div
    class="basket-catch-game"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
    @click="handleGameClick"
  >
    <div class="game-hud-wrapper">
        <div class="hud-card">
            <div class="hud-row">
                <span class="badge-pill">Math Problem {{ currentQuestionIndex + 1 }}/{{ questions.length }}</span>
                <span class="timer-pill" :class="{ 'urgent': timeRemaining < 10 }">⏱️ {{ timeRemaining }}s</span>
            </div>
            <div class="question-display">
                {{ currentQuestionText }}
            </div>
             <div class="progress-track">
                <div
                    class="progress-fill"
                    :style="{ width: ((currentQuestionIndex) / questions.length * 100) + '%' }"
                ></div>
            </div>
        </div>
    </div>

    <div class="items-layer">
      <div
        v-for="item in fallingItems"
        :key="item.id"
        class="falling-item"
        :style="{
          left: item.x + '%',
          top: item.y + '%',
          transition: item.falling ? `top ${item.speed}s linear` : 'none'
        }"
      >
        <div class="math-bubble">
          {{ item.text }}
        </div>
      </div>
    </div>

    <div class="basket" :style="{ left: basketPosition + '%' }">
      <div class="basket-visual">
          <span class="basket-emoji">🗑️</span>
      </div>
      <div class="basket-label">Catch Here</div>
    </div>

    <transition name="scale-fade">
      <div v-if="showFeedback" class="feedback-toast" :class="feedbackType">
         <span class="feedback-icon">{{ feedbackIcon }}</span>
         <span class="feedback-text">{{ feedbackText }}</span>
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

const emit = defineEmits(['score-change', 'life-lost', 'item-collected', 'game-complete']);

// Refs
const gameContainer = ref(null);
const fallingItems = ref([]);
const basketPosition = ref(50);
const gameActive = ref(true);
const itemIdCounter = ref(0);
const spawnInterval = ref(null);
const collisionInterval = ref(null);
const currentQuestionIndex = ref(0);

// Feedback State
const showFeedback = ref(false);
const feedbackText = ref('');
const feedbackType = ref('');
const feedbackIcon = ref('');

// Constants
const HIT_Y_THRESHOLD = 85;
const BASKET_WIDTH_PERCENT = 14;

// Questions Data
const questions = computed(() => {
    if (props.gameData.questions && props.gameData.questions.length > 0) {
        return props.gameData.questions;
    }
    return [
        { q: "7 x 6 = ?", a: "42", wrong: ["36", "48", "54", "49"] },
        { q: "9 x 5 = ?", a: "45", wrong: ["54", "40", "35", "50"] },
        { q: "8 x 8 = ?", a: "64", wrong: ["56", "72", "88", "48"] },
        { q: "6 x 4 = ?", a: "24", wrong: ["28", "12", "36", "18"] }
    ];
});

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const currentQuestionText = computed(() => currentQuestion.value?.q || currentQuestion.value?.question || "Loading...");

// Spawning
const spawnItem = () => {
  if (!gameActive.value || !currentQuestion.value) return;

  const q = currentQuestion.value;
  const correctAnswer = q.a || q.correctAnswer || q.answer;
  const wrongAnswers = q.wrong || q.wrongAnswers || ["0", "1"];

  const isCorrectSpawn = Math.random() > 0.55; // Slightly higher chance for correct answers

  let text = "";
  let isCorrect = false;

  if (isCorrectSpawn) {
      text = correctAnswer;
      isCorrect = true;
  } else {
      text = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
      isCorrect = false;
  }

  const newItem = {
    id: `item-${itemIdCounter.value++}`,
    text: text,
    isCorrect: isCorrect,
    x: Math.random() * 85 + 5,
    y: -15,
    speed: 3.5, // Consistent readable speed
    falling: false,
    startTime: Date.now()
  };

  fallingItems.value.push(newItem);

  setTimeout(() => {
      const item = fallingItems.value.find(i => i.id === newItem.id);
      if (item) {
          item.falling = true;
          item.y = 125;
      }
  }, 50);

  setTimeout(() => { removeItem(newItem.id); }, (newItem.speed + 1) * 1000);
};

// Collision
const checkCollisions = () => {
  if (!gameActive.value) return;

  fallingItems.value.forEach(item => {
      if (item.caught) return;

      const elapsed = (Date.now() - item.startTime) / 1000;
      const progress = elapsed / item.speed;
      const currentY = -15 + (progress * 140);

      if (currentY > HIT_Y_THRESHOLD && currentY < HIT_Y_THRESHOLD + 15) {
          const basketLeft = basketPosition.value - (BASKET_WIDTH_PERCENT / 2);
          const basketRight = basketPosition.value + (BASKET_WIDTH_PERCENT / 2);

          if (item.x + 5 > basketLeft && item.x < basketRight) {
              catchItem(item);
          }
      }
  });
};

const catchItem = (item) => {
  if (item.caught) return;
  item.caught = true;

  const el = document.getElementById(item.id);
  if (el) el.style.transition = 'none';

  if (item.isCorrect) {
      emit('score-change', 20);
      handleCorrectAnswer();
  } else {
      emit('score-change', -10);
      emit('life-lost');
      triggerFeedback('Oops! Try again', 'error', '❌');
  }

  removeItem(item.id);
};

const handleCorrectAnswer = () => {
    fallingItems.value = []; // Clear screen
    triggerFeedback('Correct!', 'success', '🌟');

    if (currentQuestionIndex.value < questions.value.length - 1) {
        setTimeout(() => {
            currentQuestionIndex.value++;
        }, 1200);
    } else {
        setTimeout(() => {
            emit('game-complete', { score: props.score + 100 });
        }, 1200);
    }
};

const triggerFeedback = (text, type, icon) => {
    feedbackText.value = text;
    feedbackType.value = type;
    feedbackIcon.value = icon;
    showFeedback.value = true;
    setTimeout(() => { showFeedback.value = false; }, 1500);
};

const removeItem = (itemId) => {
  const index = fallingItems.value.findIndex(i => i.id === itemId);
  if (index !== -1) fallingItems.value.splice(index, 1);
};

// Controls
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
};

const handleGameClick = () => {};

// Lifecycle
const startGame = () => {
  gameActive.value = true;
  spawnInterval.value = setInterval(spawnItem, 1500);
  collisionInterval.value = setInterval(checkCollisions, 50);
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
  background: linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 100%);
  overflow: hidden;
  border-radius: 16px;
  cursor: none;
  touch-action: none;
  font-family: 'Inter', sans-serif;
}

/* === 🟢 NEW HUD STYLES === */
.game-hud-wrapper {
    position: absolute;
    top: 20px;
    width: 100%;
    display: flex;
    justify-content: center;
    z-index: 50; /* Ensure on top */
    pointer-events: none;
}

.hud-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(5px);
    border-radius: 16px;
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2);
    padding: 16px 32px;
    text-align: center;
    min-width: 280px;
    border: 1px solid rgba(255,255,255,0.5);
}

.hud-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
}

.question-display {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: -1px;
    margin-bottom: 12px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.progress-track {
    width: 100%;
    height: 6px;
    background: #f1f5f9;
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    transition: width 0.5s ease;
}

.timer-pill.urgent {
    color: #ef4444;
    animation: pulse 1s infinite;
}

/* === ITEMS === */
.items-layer { position: absolute; inset: 0; pointer-events: none; }
.falling-item {
  position: absolute;
  transform: translateX(-50%);
  z-index: 10;
  width: 80px; /* Fixed width for consistency */
  display: flex;
  justify-content: center;
}

.math-bubble {
  background: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.4rem;
  color: #334155;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 4px solid #f1f5f9; /* Neutral border */
}

/* === BASKET === */
.basket {
  position: absolute;
  bottom: 20px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.basket-emoji {
  font-size: 5rem;
  filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));
}

.basket-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: -10px;
  background: rgba(255,255,255,0.8);
  padding: 2px 8px;
  border-radius: 4px;
}

/* === FEEDBACK TOAST === */
.feedback-toast {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 16px 32px;
    border-radius: 20px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 100;
}

.feedback-toast.success { border: 3px solid #22c55e; color: #16a34a; }
.feedback-toast.error { border: 3px solid #ef4444; color: #dc2626; }

.feedback-icon { font-size: 3rem; margin-bottom: 8px; }
.feedback-text { font-size: 1.5rem; font-weight: 800; }

.scale-fade-enter-active { animation: popIn 0.3s; }
.scale-fade-leave-active { transition: opacity 0.2s; opacity: 0; }

@keyframes popIn {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    80% { transform: translate(-50%, -50%) scale(1.1); }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
</style>
