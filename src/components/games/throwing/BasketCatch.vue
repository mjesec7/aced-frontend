<template>
  <div
    class="basket-catch-game"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
    @click="handleGameClick"
  >
    <!-- Right Sidebar HUD -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="3"
      :prompt="currentQuestionText"
    />

    <div class="game-world">
      <div
        v-for="item in fallingItems"
        :key="item.id"
        class="falling-orb"
        :ref="el => { if(el) itemRefs[item.id] = el }"
        :style="{
          left: item.x + '%',
          animationDuration: item.speed + 's',
          backgroundColor: item.color
        }"
      >
        <span class="orb-text">{{ item.text }}</span>
      </div>
    </div>

    <div class="basket-wrapper" :style="{ left: basketPosition + '%' }">
      <div class="basket-body">
          <span class="basket-emoji">🧺</span>
      </div>
    </div>

    <transition name="pop">
      <div v-if="showFeedback" class="feedback-splash" :class="feedbackType">
         <div class="splash-icon">{{ feedbackIcon }}</div>
         <div class="splash-text">{{ feedbackText }}</div>
      </div>
    </transition>

    <!-- Small Start/Complete Modal -->
    <div v-if="!gameActive" class="modal-overlay" @click="startGame">
        <div class="small-modal">
            <div class="modal-icon">🎮</div>
            <h3 class="modal-title">Ready?</h3>
            <p class="modal-text">Drag the basket to catch the correct answer!</p>
            <button class="modal-btn" @click="startGame">▶ Play Now</button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import GameHUDSidebar from '../base/GameHUDSidebar.vue';

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
const itemRefs = ref({});
const basketPosition = ref(50);
const gameActive = ref(false);
const itemIdCounter = ref(0);
const spawnInterval = ref(null);
const collisionInterval = ref(null);
const currentQuestionIndex = ref(0);

// Feedback
const showFeedback = ref(false);
const feedbackText = ref('');
const feedbackType = ref('');
const feedbackIcon = ref('');

// Colors
const BUBBLE_COLORS = ['#FFE0B2', '#C8E6C9', '#BBDEFB', '#F8BBD0', '#E1BEE7'];

// Questions Logic
const questions = computed(() => props.gameData.questions || [{ q: "Ready?", a: "Go", wrong: [] }]);
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const currentQuestionText = computed(() => currentQuestion.value?.q || currentQuestion.value?.question || "Loading...");

// Game Loop
const spawnItem = () => {
  if (!gameActive.value || props.isPaused) return;

  const q = currentQuestion.value;
  if (!q) return;

  const isCorrectSpawn = Math.random() > 0.5;

  const correctAnswer = q.a || q.correctAnswer || q.answer;
  const wrongAnswers = q.wrong || q.wrongAnswers || ["0", "1"];
  // Pick random wrong answer
  const wrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];

  const text = isCorrectSpawn ? correctAnswer : wrongAnswer;

  const newItem = {
    id: `item-${itemIdCounter.value++}`,
    text: text,
    isCorrect: isCorrectSpawn,
    x: Math.random() * 80 + 10, // 10% - 90%
    speed: props.gameData.difficulty === 'hard' ? 2.5 : 4,
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
  };

  fallingItems.value.push(newItem);

  // Auto cleanup based on speed + buffer
  setTimeout(() => { removeItem(newItem.id); }, (newItem.speed * 1000) + 500);
};

const checkCollisions = () => {
  if (!gameActive.value || props.isPaused) return;

  const basketEl = gameContainer.value?.querySelector('.basket-body');
  if (!basketEl) return;
  const basketRect = basketEl.getBoundingClientRect();

  fallingItems.value.forEach(item => {
    const el = itemRefs.value[item.id];
    if (!el) return;
    const itemRect = el.getBoundingClientRect();

    // Collision detection using bounding boxes
    const overlap = !(
        itemRect.right < basketRect.left + 20 ||
        itemRect.left > basketRect.right - 20 ||
        itemRect.bottom < basketRect.top + 20 ||
        itemRect.top > basketRect.bottom - 20
    );

    if (overlap) {
        catchItem(item);
    }
  });
};

const catchItem = (item) => {
  removeItem(item.id);

  if (item.isCorrect) {
      emit('score-change', 100);
      triggerFeedback('Correct!', 'success', '✨');
      fallingItems.value = []; // Clear items for next question focus

      setTimeout(() => {
          if (currentQuestionIndex.value < questions.value.length - 1) {
              currentQuestionIndex.value++;
          } else {
              emit('game-complete', { score: props.score + 100 });
          }
      }, 800);
  } else {
      emit('score-change', -20);
      emit('life-lost');
      triggerFeedback('Wrong!', 'error', '❌');
  }
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
    if(idx !== -1) {
        fallingItems.value.splice(idx, 1);
        delete itemRefs.value[id];
    }
};

// Input Handlers
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
    basketPosition.value = Math.max(10, Math.min(90, percent));
};

const handleGameClick = () => {
    if (!gameActive.value) startGame();
};

// Lifecycle
const startGame = () => {
    gameActive.value = true;
    fallingItems.value = [];
    currentQuestionIndex.value = 0;

    if (spawnInterval.value) clearInterval(spawnInterval.value);
    if (collisionInterval.value) clearInterval(collisionInterval.value);

    spawnInterval.value = setInterval(spawnItem, 1400);
    collisionInterval.value = setInterval(checkCollisions, 50);
};

const stopGame = () => {
    gameActive.value = false;
    clearInterval(spawnInterval.value);
    clearInterval(collisionInterval.value);
};

watch(() => props.lives, (val) => { if(val <= 0) stopGame(); });
onMounted(() => {
    // Clean start state
    fallingItems.value = [];
});
onUnmounted(stopGame);
</script>

<style scoped>
/* MAIN CONTAINER */
.basket-catch-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #E3F2FD 0%, #F3E5F5 100%);
  overflow: hidden;
  border-radius: 16px;
  font-family: 'Inter', sans-serif;
  user-select: none;
  border: 4px solid white;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.05);
  cursor: none;
}



/* FALLING ITEMS (CSS ANIMATION) */
.falling-orb {
    position: absolute;
    top: -100px; /* Start above screen */
    width: 75px;
    height: 75px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-50%);
    box-shadow: inset 0 -5px 10px rgba(0,0,0,0.1), 0 8px 15px rgba(0,0,0,0.1);
    z-index: 10;
    border: 3px solid white;

    /* CSS Animation controls movement */
    animation-name: fall;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
}

.orb-text { font-size: 1.8rem; font-weight: 800; color: #334155; }

@keyframes fall {
    from { top: -15%; }
    to { top: 115%; }
}

/* BASKET */
.basket-wrapper {
    position: absolute;
    bottom: 30px;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.basket-body { font-size: 4.5rem; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.15)); }
.basket-label { font-size: 0.7rem; background: rgba(255,255,255,0.9); padding: 2px 8px; border-radius: 8px; font-weight: 700; color: #64748b; margin-top: -10px; }

/* SMALL MODAL */
.modal-overlay {
    position: absolute; 
    inset: 0; 
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(5px); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 300;
}

.small-modal {
    background: white; 
    padding: 24px; 
    border-radius: 20px;
    text-align: center; 
    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    max-width: 350px;
    width: 90%;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-icon { 
    font-size: 3.5rem; 
    margin-bottom: 12px; 
}

.modal-title { 
    margin: 0 0 8px 0; 
    color: #0f172a; 
    font-size: 1.5rem; 
    font-weight: 800; 
}

.modal-text { 
    color: #64748b; 
    margin-bottom: 16px; 
    font-size: 1rem; 
}

.modal-btn {
    background: #3b82f6; 
    color: white; 
    border: none; 
    padding: 12px 24px;
    border-radius: 12px; 
    font-weight: 700; 
    font-size: 1rem; 
    cursor: pointer;
    transition: all 0.3s;
    width: 100%;
}

.modal-btn:hover {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.feedback-splash {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; padding: 20px 40px; border-radius: 20px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2); text-align: center; z-index: 200;
}
.splash-icon { font-size: 3rem; margin-bottom: 5px; }
.splash-text { font-size: 1.8rem; font-weight: 900; color: #1e293b; }
.feedback-splash.success .splash-text { color: #22c55e; }
.feedback-splash.error .splash-text { color: #ef4444; }

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
.pop-enter-active { animation: popIn 0.3s; }
@keyframes popIn { from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
.slide-up-enter-active { transition: all 0.3s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .hud-glass-panel {
    width: 95%;
    padding: 10px 15px;
  }

  .math-text {
    font-size: 1.6rem;
  }

  .falling-orb {
    width: 60px;
    height: 60px;
  }

  .orb-text {
    font-size: 1.4rem;
  }

  .basket-body {
    font-size: 3.5rem;
  }

  .start-card {
    padding: 20px 30px;
  }

  .start-card h2 {
    font-size: 1.4rem;
  }

  .start-icon {
    font-size: 2.5rem;
  }
}
</style>
