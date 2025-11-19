<template>
  <div
    class="basket-catch-game"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
    @click="handleGameClick"
  >
    <div class="game-hud">
        <div class="question-card">
            <div class="q-label">Current Problem</div>
            <div class="q-text">{{ currentQuestionText }}</div>
        </div>
        <div class="progress-bar">
             <div
                v-for="(q, idx) in questions"
                :key="idx"
                class="progress-segment"
                :class="{ 'completed': idx < currentQuestionIndex, 'active': idx === currentQuestionIndex }"
             ></div>
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
        <div class="item-bubble neutral-bubble">
          {{ item.text }}
        </div>
      </div>
    </div>

    <div class="basket" :style="{ left: basketPosition + '%' }">
      <div class="basket-visual">
          <span class="basket-emoji">🧺</span>
      </div>
    </div>

    <transition name="pop">
      <div v-if="showFeedback" class="feedback-overlay" :class="feedbackType">
         <div class="feedback-content">
             <span class="feedback-icon">{{ feedbackIcon }}</span>
             <span class="feedback-text">{{ feedbackText }}</span>
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
const feedbackType = ref(''); // 'success' or 'error'
const feedbackIcon = ref('');

// Constants
const HIT_Y_THRESHOLD = 85;
const BASKET_WIDTH_PERCENT = 14;

// --- Question Logic ---

const questions = computed(() => {
    // Prioritize structured questions from gameConfig
    if (props.gameData.questions && props.gameData.questions.length > 0) {
        return props.gameData.questions;
    }
    // Fallback Math Data
    return [
        { q: "7 x 6 = ?", a: "42", wrong: ["36", "48", "54", "49"] },
        { q: "9 x 5 = ?", a: "45", wrong: ["54", "40", "35", "50"] },
        { q: "8 x 8 = ?", a: "64", wrong: ["56", "72", "88", "48"] },
        { q: "6 x 4 = ?", a: "24", wrong: ["28", "12", "36", "18"] }
    ];
});

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const currentQuestionText = computed(() => currentQuestion.value?.question || currentQuestion.value?.q || "Get Ready!");

// --- Spawning Logic ---

const spawnItem = () => {
  if (!gameActive.value || !currentQuestion.value) return;

  const q = currentQuestion.value;
  const correctAnswer = q.correctAnswer || q.a || q.answer;
  const wrongAnswers = q.wrongAnswers || q.wrong || ["0", "1", "2"];

  // 40% chance for Correct Answer, 60% for Distractor
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

  const baseSpeed = props.gameData.difficulty === 'hard' ? 2.5 : 3.5;

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

  // Start animation next frame
  setTimeout(() => {
      const item = fallingItems.value.find(i => i.id === newItem.id);
      if (item) {
          item.falling = true;
          item.y = 125; // Fall past bottom
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

  // Stop visual falling
  const el = document.getElementById(item.id);
  if (el) el.style.transition = 'none';

  if (item.isCorrect) {
      emit('score-change', 20);
      handleCorrectAnswer();
  } else {
      emit('score-change', -5);
      emit('life-lost');
      triggerFeedback('Wrong!', 'error', '❌');
  }

  removeItem(item.id);
};

const handleCorrectAnswer = () => {
    // Clear current falling items to clean up screen for next question
    fallingItems.value = [];

    triggerFeedback('Correct!', 'success', '⭐');

    // Advance Question
    if (currentQuestionIndex.value < questions.value.length - 1) {
        setTimeout(() => {
            currentQuestionIndex.value++;
        }, 1000);
    } else {
        setTimeout(() => {
            emit('game-complete', { score: props.score + 100 });
        }, 1000);
    }
};

const triggerFeedback = (text, type, icon) => {
    feedbackText.value = text;
    feedbackType.value = type;
    feedbackIcon.value = icon;
    showFeedback.value = true;
    setTimeout(() => { showFeedback.value = false; }, 1200);
};

const removeItem = (itemId) => {
  const index = fallingItems.value.findIndex(i => i.id === itemId);
  if (index !== -1) fallingItems.value.splice(index, 1);
};

// --- Controls ---

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

const handleGameClick = () => { /* Optional click interactions */ };

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
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  overflow: hidden;
  border-radius: 16px;
  cursor: none;
  touch-action: none;
  font-family: 'Inter', sans-serif;
  border: 1px solid #cbd5e1;
}

/* === HUD === */
.game-hud {
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 20;
    pointer-events: none;
}

.question-card {
    background: white;
    padding: 12px 32px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    text-align: center;
    border: 1px solid #e2e8f0;
    margin-bottom: 12px;
    min-width: 200px;
}

.q-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    font-weight: 600;
    margin-bottom: 4px;
}

.q-text {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
}

.progress-bar {
    display: flex;
    gap: 6px;
}

.progress-segment {
    width: 30px;
    height: 6px;
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
    transition: all 0.3s;
}
.progress-segment.active { background: #3b82f6; }
.progress-segment.completed { background: #22c55e; }

/* === FALLING ITEMS === */
.items-layer { position: absolute; inset: 0; pointer-events: none; }
.falling-item { position: absolute; transform: translateX(-50%); z-index: 10; }

/* Neutral Style - No Spoilers */
.neutral-bubble {
  background: white;
  padding: 12px 20px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  font-weight: 800;
  font-size: 22px;
  color: #334155;
  border: 2px solid #cbd5e1; /* Neutral gray border */
}

/* === BASKET === */
.basket {
  position: absolute;
  bottom: 5%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 30;
}

.basket-emoji {
  font-size: 72px;
  line-height: 1;
  filter: drop-shadow(0 8px 12px rgba(0,0,0,0.15));
}

/* === FEEDBACK OVERLAY === */
.feedback-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.3);
    backdrop-filter: blur(2px);
    z-index: 50;
}

.feedback-content {
    background: white;
    padding: 20px 40px;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transform: scale(1);
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.feedback-overlay.success .feedback-content { border: 3px solid #22c55e; color: #15803d; }
.feedback-overlay.error .feedback-content { border: 3px solid #ef4444; color: #b91c1c; }

.feedback-icon { font-size: 48px; }
.feedback-text { font-size: 32px; font-weight: 800; }

@keyframes popIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.pop-enter-active, .pop-leave-active { transition: opacity 0.2s; }
.pop-enter-from, .pop-leave-to { opacity: 0; }
</style>
