<template>
  <div
    class="basket-catch-game"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
    @click="handleGameClick"
  >
    <div class="game-hud">
        <div class="question-banner">
            <span class="q-label">Solve:</span>
            <span class="q-text">{{ currentQuestionText }}</span>
        </div>
        <div class="progress-dots">
             <div
                v-for="(q, idx) in questions"
                :key="idx"
                class="dot"
                :class="{ 'active': idx === currentQuestionIndex, 'done': idx < currentQuestionIndex }"
             ></div>
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
      <div class="basket-visual">
          <span class="basket-emoji">🧺</span>
          <div class="basket-glow"></div>
      </div>
    </div>

    <transition name="pop">
      <div v-if="showFeedback" class="feedback-overlay">
         <div class="feedback-text">{{ feedbackText }}</div>
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
const showFeedback = ref(false);
const feedbackText = ref('');

// Constants
const HIT_Y_THRESHOLD = 82;
const BASKET_WIDTH_PERCENT = 12;

// --- Question Logic ---

const questions = computed(() => {
    // 1. Look for specific 'questions' array in gameData
    if (props.gameData.questions && props.gameData.questions.length > 0) {
        return props.gameData.questions;
    }
    // 2. Fallback generator if no questions provided (Math mode default)
    return [
        { q: "7 x 6", a: "42", wrong: ["36", "48", "54", "49"] },
        { q: "9 x 5", a: "45", wrong: ["54", "40", "35", "50"] },
        { q: "8 x 8", a: "64", wrong: ["56", "72", "88", "48"] },
        { q: "6 x 4", a: "24", wrong: ["28", "12", "36", "18"] },
        { q: "3 x 9", a: "27", wrong: ["29", "18", "30", "21"] }
    ];
});

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const currentQuestionText = computed(() => currentQuestion.value?.question || currentQuestion.value?.q || "Ready?");

// --- Spawning Logic ---

const spawnItem = () => {
  if (!gameActive.value || !currentQuestion.value) return;

  const q = currentQuestion.value;
  const correctAnswer = q.correctAnswer || q.a || q.answer;
  // Ensure wrong answers exists, default to some random numbers if missing
  const wrongAnswers = q.wrongAnswers || q.wrong || q.distractors || ["0", "1", "2"];

  // 40% chance to spawn the CORRECT answer, 60% for WRONG
  const isCorrectSpawn = Math.random() > 0.6;

  let text = "";
  let isCorrect = false;

  if (isCorrectSpawn) {
      text = correctAnswer;
      isCorrect = true;
  } else {
      text = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
      isCorrect = false;
  }

  // Difficulty Speed
  const baseSpeed = props.gameData.difficulty === 'hard' ? 2.0 : 3.5;

  const newItem = {
    id: `item-${itemIdCounter.value++}`,
    text: text,
    isCorrect: isCorrect,
    x: Math.random() * 85 + 5,
    y: -15,
    speed: baseSpeed - (Math.random() * 0.5),
    falling: false,
    startTime: Date.now()
  };

  fallingItems.value.push(newItem);

  // Start animation
  setTimeout(() => {
      const item = fallingItems.value.find(i => i.id === newItem.id);
      if (item) {
          item.falling = true;
          item.y = 120;
      }
  }, 50);

  // Cleanup
  setTimeout(() => { removeItem(newItem.id); }, (newItem.speed + 1) * 1000);
};

// --- Physics & Collision ---

const checkCollisions = () => {
  if (!gameActive.value) return;

  fallingItems.value.forEach(item => {
      if (item.caught) return;

      const elapsed = (Date.now() - item.startTime) / 1000;
      const progress = elapsed / item.speed;
      const currentY = -15 + (progress * 135);

      if (currentY > HIT_Y_THRESHOLD && currentY < HIT_Y_THRESHOLD + 10) {
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

  // Stop visual falling
  const el = document.getElementById(item.id);
  if (el) el.style.transition = 'none';

  if (item.isCorrect) {
      emit('score-change', 20); // Higher points for correct answer
      handleCorrectAnswer();
  } else {
      emit('score-change', -5);
      emit('life-lost');
      triggerFeedback('❌ Oops!', 'wrong');
  }

  removeItem(item.id);
};

const handleCorrectAnswer = () => {
    // Clear current items
    fallingItems.value = [];

    triggerFeedback('✨ Correct!', 'success');

    // Advance Question
    if (currentQuestionIndex.value < questions.value.length - 1) {
        setTimeout(() => {
            currentQuestionIndex.value++;
        }, 1000);
    } else {
        // Game Won
        setTimeout(() => {
            emit('game-complete', { score: props.score + 100 });
        }, 1000);
    }
};

const triggerFeedback = (text, type) => {
    feedbackText.value = text;
    showFeedback.value = true;
    setTimeout(() => { showFeedback.value = false; }, 800);
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

const handleGameClick = () => {
  // Optional: Could be used for accessibility or mobile tap controls
};

// Lifecycle
const startGame = () => {
  gameActive.value = true;
  spawnInterval.value = setInterval(spawnItem, 1200);
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
  background: linear-gradient(to bottom, #e0f2fe, #f0f9ff);
  overflow: hidden;
  border-radius: 16px;
  cursor: none;
  touch-action: none;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
  font-family: 'Inter', sans-serif;
}

/* HUD */
.game-hud {
    position: absolute;
    top: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    z-index: 20;
    pointer-events: none;
}

.question-banner {
    background: white;
    padding: 12px 32px;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid #3b82f6;
}

.q-label {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    font-weight: 700;
}

.q-text {
    font-size: 28px;
    font-weight: 800;
    color: #1e293b;
}

.progress-dots {
    display: flex;
    gap: 8px;
}

.dot {
    width: 10px;
    height: 10px;
    background: rgba(0,0,0,0.1);
    border-radius: 50%;
    transition: all 0.3s;
}
.dot.active { background: #3b82f6; transform: scale(1.3); }
.dot.done { background: #22c55e; }

/* Items */
.items-layer { position: absolute; inset: 0; pointer-events: none; }
.falling-item { position: absolute; transform: translateX(-50%); z-index: 10; }

.item-bubble {
  background: white;
  padding: 12px 18px;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  font-weight: 800;
  font-size: 20px;
  color: #334155;
  border: 3px solid #e2e8f0;
}

.falling-item.is-correct .item-bubble {
    border-color: #3b82f6; /* Hint: Don't make it too obvious until caught? Or maybe keep neutral */
}
/* Optional: Keep neutral until caught to increase difficulty, or color code */

/* Basket */
.basket {
  position: absolute;
  bottom: 30px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 30;
}

.basket-visual {
    position: relative;
}

.basket-emoji {
  font-size: 80px;
  line-height: 1;
  filter: drop-shadow(0 8px 8px rgba(0,0,0,0.15));
}

/* Feedback Overlay */
.feedback-overlay {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 50;
}

.feedback-text {
    font-size: 42px;
    font-weight: 900;
    color: #3b82f6;
    text-shadow: 0 4px 0 white;
    white-space: nowrap;
    animation: popUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popUp {
    0% { transform: scale(0); opacity: 0; }
    70% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
}

.pop-enter-active, .pop-leave-active { transition: opacity 0.3s; }
.pop-enter-from, .pop-leave-to { opacity: 0; }
</style>
