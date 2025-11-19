<template>
  <div
    class="basket-game-container"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
    @click="handleGameClick"
    :class="{ 'shake-screen': isShaking }"
  >
    <!-- 🟢 HEADER HUD -->
    <div class="hud-glass-panel">
        <div class="hud-top-row">
            <div class="progress-pill">
                <span class="pill-icon">🧠</span>
                <span class="pill-text">Q{{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
            </div>

            <div class="timer-pill" :class="{ 'pulse-red': timeRemaining < 10 }">
                <span>⏰ {{ timeRemaining }}</span>
            </div>

            <div class="lives-container">
                <span v-for="i in 3" :key="i" class="heart" :class="{ 'lost': i > lives }">❤️</span>
            </div>

            <button class="pause-btn" @click.stop="$emit('pause')">⏸️</button>
        </div>

        <!-- 🟢 MAIN QUESTION DISPLAY -->
        <div class="question-banner">
            <transition name="slide-fade" mode="out-in">
                <h1 :key="currentQuestionIndex">{{ currentQuestionText }}</h1>
            </transition>
        </div>
    </div>

    <!-- 🟢 FALLING ITEMS LAYER -->
    <div class="game-world">
      <div
        v-for="item in fallingItems"
        :key="item.id"
        class="falling-orb"
        :style="{
          left: item.x + '%',
          top: item.y + '%',
          backgroundColor: item.color,
          transition: item.falling ? `top ${item.speed}s linear` : 'none'
        }"
      >
        <span class="orb-text">{{ item.text }}</span>
      </div>
    </div>

    <!-- 🟢 BASKET -->
    <div class="basket-wrapper" :style="{ left: basketPosition + '%' }">
      <div class="basket-body">
          <span class="basket-icon">🗑️</span>
      </div>
      <div class="basket-guide-line"></div>
    </div>

    <!-- 🟢 FEEDBACK OVERLAY -->
    <transition name="pop">
      <div v-if="showFeedback" class="feedback-splash" :class="feedbackType">
         <div class="splash-icon">{{ feedbackIcon }}</div>
         <div class="splash-text">{{ feedbackText }}</div>
      </div>
    </transition>

    <!-- 🟢 START OVERLAY -->
    <div v-if="!gameActive && !isPaused" class="start-overlay" @click="startGame">
        <div class="start-card">
            <h2>Ready to Solve?</h2>
            <p>Drag the basket to catch the correct answer!</p>
            <button class="start-btn">▶ Start Game</button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  gameData: { type: Object, required: true },
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 3 },
  timeRemaining: { type: Number, default: 60 },
  isPaused: { type: Boolean, default: false }
});

const emit = defineEmits(['score-change', 'life-lost', 'item-collected', 'game-complete', 'pause']);

// Refs
const gameContainer = ref(null);
const fallingItems = ref([]);
const basketPosition = ref(50);
const gameActive = ref(false); // Start inactive
const itemIdCounter = ref(0);
const spawnInterval = ref(null);
const collisionInterval = ref(null);
const currentQuestionIndex = ref(0);
const isShaking = ref(false);

// Feedback
const showFeedback = ref(false);
const feedbackText = ref('');
const feedbackType = ref('');
const feedbackIcon = ref('');

// Colors for bubbles (Pastel Palette)
const BUBBLE_COLORS = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'];

// --- Computed Logic ---

const questions = computed(() => {
    return props.gameData.questions || [
        { q: "2 + 2 = ?", a: "4", wrong: ["2", "5", "6"] } // Fallback
    ];
});

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const currentQuestionText = computed(() => currentQuestion.value?.q || "Loading...");

// --- Game Loop ---

const spawnItem = () => {
  if (!gameActive.value || props.isPaused) return;

  const q = currentQuestion.value;
  const isCorrectSpawn = Math.random() > 0.5; // 50/50 chance

  const text = isCorrectSpawn
      ? (q.a || q.correctAnswer)
      : (q.wrong || ["0"])[Math.floor(Math.random() * (q.wrong?.length || 1))];

  const newItem = {
    id: `item-${itemIdCounter.value++}`,
    text: text,
    isCorrect: isCorrectSpawn,
    x: Math.random() * 80 + 10, // 10% - 90%
    y: -15,
    speed: props.gameData.difficulty === 'hard' ? 2.5 : 4, // Seconds to fall
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    falling: false,
    startTime: Date.now()
  };

  fallingItems.value.push(newItem);

  // Trigger animation
  setTimeout(() => {
      const item = fallingItems.value.find(i => i.id === newItem.id);
      if (item) {
          item.falling = true;
          item.y = 110;
      }
  }, 50);

  // Auto cleanup
  setTimeout(() => { removeItem(newItem.id); }, (newItem.speed + 1) * 1000);
};

const checkCollisions = () => {
  if (!gameActive.value || props.isPaused) return;

  fallingItems.value.forEach(item => {
      if (item.caught) return;

      // Mathematical Position Calculation
      const elapsed = (Date.now() - item.startTime) / 1000;
      const progress = elapsed / item.speed;
      const currentY = -15 + (progress * 125);

      // Catch Zone: 82% - 92% Y
      if (currentY > 82 && currentY < 92) {
          const basketLeft = basketPosition.value - 10; // +/- 10% width
          const basketRight = basketPosition.value + 10;

          if (item.x > basketLeft && item.x < basketRight) {
              catchItem(item);
          }
      }
  });
};

const catchItem = (item) => {
  item.caught = true;
  const el = document.getElementById(item.id);
  if(el) el.style.transition = 'none';

  if (item.isCorrect) {
      handleSuccess();
  } else {
      handleFailure();
  }
  removeItem(item.id);
};

const handleSuccess = () => {
    emit('score-change', 100);
    triggerFeedback('Great!', 'success', '✨');

    // Clear items to focus on next question
    fallingItems.value = [];

    setTimeout(() => {
        if (currentQuestionIndex.value < questions.value.length - 1) {
            currentQuestionIndex.value++;
        } else {
            emit('game-complete', { score: props.score + 100 });
        }
    }, 1000);
};

const handleFailure = () => {
    emit('score-change', -20);
    emit('life-lost');
    triggerFeedback('Wrong!', 'error', '💩');

    // Screen shake effect
    isShaking.value = true;
    setTimeout(() => isShaking.value = false, 500);
};

const triggerFeedback = (text, type, icon) => {
    feedbackText.value = text;
    feedbackType.value = type;
    feedbackIcon.value = icon;
    showFeedback.value = true;
    setTimeout(() => showFeedback.value = false, 1000);
};

const removeItem = (id) => {
    const idx = fallingItems.value.findIndex(i => i.id === id);
    if(idx !== -1) fallingItems.value.splice(idx, 1);
};

// --- Input ---

const handleMouseMove = (e) => {
    if(!gameContainer.value || !gameActive.value) return;
    const rect = gameContainer.value.getBoundingClientRect();
    updateBasket(e.clientX - rect.left, rect.width);
};

const handleTouchMove = (e) => {
    e.preventDefault();
    if(!gameContainer.value || !gameActive.value) return;
    const rect = gameContainer.value.getBoundingClientRect();
    updateBasket(e.touches[0].clientX - rect.left, rect.width);
};

const updateBasket = (x, width) => {
    const percent = (x / width) * 100;
    basketPosition.value = Math.max(8, Math.min(92, percent));
};

const handleGameClick = () => {
    if (!gameActive.value) startGame();
};

// --- Lifecycle ---

const startGame = () => {
    gameActive.value = true;
    fallingItems.value = [];
    currentQuestionIndex.value = 0;
    spawnInterval.value = setInterval(spawnItem, 1500);
    collisionInterval.value = setInterval(checkCollisions, 50);
};

const stopGame = () => {
    gameActive.value = false;
    clearInterval(spawnInterval.value);
    clearInterval(collisionInterval.value);
};

// Cleanup
onUnmounted(stopGame);
watch(() => props.lives, (val) => { if(val <= 0) stopGame(); });
</script>

<style scoped>
/* === MAIN CONTAINER === */
.basket-game-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 10%, #f8fafc, #e2e8f0);
  overflow: hidden;
  border-radius: 16px;
  font-family: 'Fredoka', 'Nunito', sans-serif;
  user-select: none;
  touch-action: none;
  border: 4px solid #fff;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

/* === HUD (Glassmorphism) === */
.hud-glass-panel {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 600px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 24px;
    padding: 12px 24px;
    border: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.hud-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.progress-pill, .timer-pill {
    background: #fff;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 800;
    color: #475569;
    font-size: 0.9rem;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    gap: 6px;
}

.timer-pill.pulse-red {
    color: #ef4444;
    animation: heartbeat 1s infinite;
}

.lives-container {
    display: flex;
    gap: 4px;
}
.heart { font-size: 1.2rem; transition: filter 0.3s; }
.heart.lost { filter: grayscale(100%) opacity(0.3); transform: scale(0.8); }

.pause-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
}
.pause-btn:hover { opacity: 1; }

.question-banner h1 {
    margin: 0;
    font-size: 2.2rem;
    color: #1e293b;
    text-align: center;
    font-weight: 900;
    letter-spacing: -1px;
    background: linear-gradient(45deg, #3b82f6, #2563eb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* === GAME PIECES === */
.game-world { position: absolute; inset: 0; pointer-events: none; }
.falling-orb {
    position: absolute;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-50%);
    box-shadow:
        inset 0 -5px 10px rgba(0,0,0,0.1),
        0 5px 15px rgba(0,0,0,0.15);
    z-index: 10;
    border: 3px solid rgba(255,255,255,0.5);
}

.orb-text {
    font-size: 1.6rem;
    font-weight: 800;
    color: #334155;
}

/* === BASKET === */
.basket-wrapper {
    position: absolute;
    bottom: 30px;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 20;
}

.basket-body {
    font-size: 5rem;
    filter: drop-shadow(0 10px 10px rgba(0,0,0,0.2));
    transform-origin: bottom center;
    transition: transform 0.1s;
}

.basket-guide-line {
    width: 2px;
    height: 1000px;
    background: rgba(59, 130, 246, 0.1);
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    z-index: -1;
}

/* === OVERLAYS === */
.start-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    cursor: pointer;
}

.start-card {
    background: white;
    padding: 30px 50px;
    border-radius: 24px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.start-card h2 { margin: 0 0 10px 0; color: #0f172a; }
.start-card p { color: #64748b; margin-bottom: 20px; }

.start-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.feedback-splash {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 300;
    pointer-events: none;
}

.splash-icon { font-size: 4rem; margin-bottom: 5px; }
.splash-text { font-size: 2.5rem; font-weight: 900; color: #3b82f6; text-shadow: 0 4px 0 #fff; }
.feedback-splash.error .splash-text { color: #ef4444; }

/* === ANIMATIONS === */
.shake-screen { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

@keyframes heartbeat { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from { transform: translateY(20px); opacity: 0; }
.slide-fade-leave-to { transform: translateY(-20px); opacity: 0; }
.pop-enter-active { animation: popIn 0.3s; }
.pop-leave-active { transition: opacity 0.2s; opacity: 0; }
</style>
