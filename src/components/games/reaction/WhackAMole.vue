<template>
  <div class="whack-a-mole-game">
    <div class="hud-glass-panel">
      <div class="hud-top-row">
        <div class="progress-pill">
          <span class="pill-icon">🔨</span>
          <span class="pill-text">Q{{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
        </div>
        <div class="timer-pill" :class="{ 'pulse-red': timeRemaining < 10 }">
          <span>⏳ {{ timeRemaining }}s</span>
        </div>
        <div class="lives-container">
          <span v-for="i in 3" :key="i" class="heart" :class="{ 'lost': i > lives }">❤️</span>
        </div>
      </div>

      <div class="question-banner">
        <transition name="scale-up" mode="out-in">
          <h1 :key="currentQuestionIndex" class="math-text">{{ currentQuestionText }}</h1>
        </transition>
      </div>
    </div>

    <div class="game-board">
      <div class="mole-grid">
        <div
          v-for="hole in holes"
          :key="hole.id"
          class="hole-container"
        >
          <div class="dirt-mound"></div>
          <div class="hole-opening"></div>

          <transition name="mole-pop">
            <div
              v-if="hole.active"
              class="mole-character"
              :class="{ 'hit': hole.isHit, 'missed': hole.isMissed }"
              @mousedown="whackHole(hole)"
            >
              <div class="mole-head">
                <div class="mole-face">
                  <span class="mole-eyes">👀</span>
                </div>
                <div class="answer-sign">
                  {{ hole.content }}
                </div>
              </div>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="hole.showEffect" class="hit-effect">💥</div>
          </transition>
        </div>
      </div>
    </div>

    <div v-if="!gameActive" class="start-overlay" @click="startGame">
      <div class="start-card">
        <div class="start-icon">🔨</div>
        <h2>Whack the Answer!</h2>
        <p>Hit the moles holding the correct number!</p>
        <button class="start-btn">▶ Play</button>
      </div>
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

const emit = defineEmits(['score-change', 'life-lost', 'item-collected', 'game-complete']);

// State
const holes = ref([]);
const gameActive = ref(false);
const spawnInterval = ref(null);
const currentQuestionIndex = ref(0);
const difficulty = ref(1);

// Constants
const GRID_SIZE = 9;

// --- Questions Logic ---
const questions = computed(() => {
  return props.gameData.questions || [
    { q: "5 + 5 = ?", a: "10", wrong: ["11", "9", "15", "50"] }
  ];
});

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const currentQuestionText = computed(() => currentQuestion.value?.q || "Loading...");

// --- Game Methods ---
const initializeHoles = () => {
  holes.value = Array.from({ length: GRID_SIZE }, (_, index) => ({
    id: index,
    active: false,
    content: '',
    isCorrect: false,
    isHit: false,
    isMissed: false,
    showEffect: false,
    timeoutId: null
  }));
};

const spawnMole = () => {
  if (!gameActive.value || !currentQuestion.value) return;

  // 1. Find empty holes
  const availableHoles = holes.value.filter(h => !h.active);
  if (availableHoles.length === 0) return;

  // 2. Determine if this mole carries the Correct Answer
  // (If no correct answer is currently visible, force higher chance)
  const activeCorrect = holes.value.some(h => h.active && h.isCorrect);
  const shouldSpawnCorrect = !activeCorrect || Math.random() > 0.6;

  // 3. Get Content
  const q = currentQuestion.value;
  let text = "";
  let isCorrect = false;

  if (shouldSpawnCorrect) {
    text = q.a || q.correctAnswer;
    isCorrect = true;
  } else {
    const wrong = q.wrong || ["0"];
    text = wrong[Math.floor(Math.random() * wrong.length)];
    isCorrect = false;
  }

  // 4. Pick Hole & Activate
  const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
  randomHole.active = true;
  randomHole.content = text;
  randomHole.isCorrect = isCorrect;
  randomHole.isHit = false;
  randomHole.isMissed = false;

  // 5. Set Hide Timeout
  const duration = Math.max(800, 2000 - (difficulty.value * 200));
  randomHole.timeoutId = setTimeout(() => {
    if (randomHole.active && !randomHole.isHit) {
      randomHole.active = false;
    }
  }, duration);
};

const whackHole = (hole) => {
  if (!hole.active || hole.isHit || !gameActive.value) return;

  clearTimeout(hole.timeoutId);
  hole.isHit = true;
  hole.showEffect = true;

  if (hole.isCorrect) {
    emit('score-change', 20);
    emit('item-collected', { isCorrect: true });

    // Success Visuals
    setTimeout(() => {
      hole.active = false;
      hole.showEffect = false;
      nextQuestion();
    }, 500);
  } else {
    // Wrong Answer
    emit('score-change', -10);
    emit('life-lost');
    hole.isMissed = true; // Turns red

    setTimeout(() => {
      hole.active = false;
      hole.showEffect = false;
    }, 500);
  }
};

const nextQuestion = () => {
  // Clear board
  holes.value.forEach(h => {
    h.active = false;
    clearTimeout(h.timeoutId);
  });

  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
  } else {
    emit('game-complete', { score: props.score + 100 });
  }
};

const startGame = () => {
  gameActive.value = true;
  initializeHoles();

  // Game Loop
  spawnInterval.value = setInterval(() => {
    spawnMole();
  }, 900);
};

const stopGame = () => {
  gameActive.value = false;
  if (spawnInterval.value) clearInterval(spawnInterval.value);
  holes.value.forEach(h => clearTimeout(h.timeoutId));
};

// Lifecycle
watch(() => props.lives, (val) => {
  if(val <= 0) stopGame();
});

onMounted(() => initializeHoles());
onUnmounted(stopGame);
</script>

<style scoped>
/* === CONTAINER === */
.whack-a-mole-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #a5d6a7 0%, #81c784 100%); /* Grassy green */
  overflow: hidden;
  border-radius: 16px;
  font-family: 'Inter', sans-serif;
  user-select: none;
  border: 4px solid white;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.1);
}

/* === HUD === */
.hud-glass-panel {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: 12px 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgba(255,255,255,0.8);
}

.hud-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-pill,
.timer-pill {
  background: #f0fdf4;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  color: #166534;
  font-size: 0.85rem;
  display: flex;
  gap: 6px;
  border: 1px solid #bbf7d0;
}

.timer-pill.pulse-red {
  color: #ef4444;
  animation: pulse 1s infinite;
}

.lives-container {
  display: flex;
  gap: 4px;
}

.heart {
  font-size: 1.1rem;
}

.heart.lost {
  opacity: 0.3;
  filter: grayscale(1);
}

.question-banner {
  text-align: center;
}

.math-text {
  font-size: 2.2rem;
  font-weight: 900;
  color: #15803d;
  margin: 0;
  letter-spacing: -1px;
}

/* === GAME BOARD === */
.game-board {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 75%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mole-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 90%;
  max-width: 450px;
  padding-bottom: 20px;
}

.hole-container {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

/* === MOLE GRAPHICS === */
.dirt-mound {
  position: absolute;
  bottom: 10px;
  width: 80%;
  height: 25px;
  background: #5d4037;
  border-radius: 50%;
  z-index: 2;
}

.hole-opening {
  position: absolute;
  bottom: 15px;
  width: 60%;
  height: 15px;
  background: #3e2723;
  border-radius: 50%;
  z-index: 1;
}

.mole-character {
  position: absolute;
  bottom: 15px;
  width: 65%;
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1;
  transform-origin: bottom;
  cursor: pointer;
  transition: transform 0.1s;
}

.mole-character:active {
  transform: scale(0.95);
}

.mole-head {
  width: 100%;
  height: 100%;
  background: #8d6e63;
  border-radius: 40px 40px 0 0;
  position: relative;
  border: 3px solid #5d4037;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* HIT STATES */
.mole-character.hit .mole-head {
  background: #a5d6a7;
  border-color: #2e7d32;
}

.mole-character.missed .mole-head {
  background: #ef9a9a;
  border-color: #c62828;
}

.mole-eyes {
  font-size: 1.5rem;
  margin-bottom: -5px;
  z-index: 5;
}

.answer-sign {
  background: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1.2rem;
  color: #3e2723;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  border: 2px solid #d7ccc8;
  margin-top: 5px;
  min-width: 40px;
  text-align: center;
}

.hit-effect {
  position: absolute;
  top: 0;
  font-size: 3rem;
  z-index: 20;
  animation: popEffect 0.3s ease-out forwards;
}

/* === OVERLAYS === */
.start-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  cursor: pointer;
}

.start-card {
  background: white;
  padding: 30px 50px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
}

.start-icon {
  font-size: 4rem;
  margin-bottom: 10px;
}

.start-card h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #333;
  margin: 10px 0;
}

.start-card p {
  font-size: 1rem;
  color: #666;
  margin-bottom: 20px;
}

.start-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.start-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

/* === ANIMATIONS === */
.mole-pop-enter-active {
  animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.mole-pop-leave-active {
  animation: slideDown 0.2s ease-in;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideDown {
  to {
    transform: translateY(100%);
  }
}

@keyframes popEffect {
  from {
    transform: scale(0.5);
    opacity: 1;
  }
  to {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.scale-up-enter-active,
.scale-up-leave-active {
  transition: all 0.3s ease;
}

.scale-up-enter-from {
  transform: scale(0.8);
  opacity: 0;
}

.scale-up-leave-to {
  transform: scale(1.2);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .hud-glass-panel {
    width: 95%;
    padding: 10px 15px;
  }

  .math-text {
    font-size: 1.6rem;
  }

  .mole-grid {
    gap: 8px;
    width: 95%;
  }

  .answer-sign {
    font-size: 1rem;
    padding: 3px 6px;
  }

  .start-card {
    padding: 20px 30px;
  }

  .start-icon {
    font-size: 3rem;
  }

  .start-card h2 {
    font-size: 1.4rem;
  }

  .start-card p {
    font-size: 0.9rem;
  }
}
</style>
