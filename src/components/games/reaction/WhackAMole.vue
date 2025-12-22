<template>
  <div 
    ref="gameWrapper"
    class="game-root"
  >
    <!-- HUD - Top Bar -->
    <div v-if="gameActive" class="game-hud">
      <div class="hud-item hud-score">
        <span class="hud-icon">🎯</span>
        <span class="hud-value">{{ score }}</span>
      </div>
      <div class="hud-item hud-timer">
        <span class="hud-icon">⏱️</span>
        <span class="hud-value">{{ timeRemaining }}s</span>
      </div>
      <div class="hud-item hud-lives">
        <span v-for="i in 3" :key="i" class="heart" :class="{ 'heart-empty': i > lives }">
          {{ i <= lives ? '❤️' : '🖤' }}
        </span>
      </div>
    </div>

    <!-- Question Banner -->
    <div v-if="gameActive" class="question-section">
      <div class="question-banner" :key="currentQuestionIndex">
        <div class="question-label">QUESTION</div>
        <div class="question-text">{{ currentPrompt }}</div>
      </div>
    </div>

    <!-- Game Grid Area -->
    <div v-if="gameActive" class="game-grid-area">
      <div class="holes-container" :class="gridLayoutClass">
        <div 
          v-for="(hole, index) in holes" 
          :key="index" 
          class="hole-wrapper"
          @mousedown.prevent="handleWhack(index)"
          @touchstart.prevent="handleWhack(index)"
        >
          <!-- Answer Label - Above the hole -->
          <div class="answer-label-wrapper">
            <div 
              v-if="hole.active" 
              class="answer-label"
              :class="getAnswerLabelClass(hole)"
            >
              {{ hole.content }}
            </div>
          </div>
          
          <!-- The Hole with Mole -->
          <div class="hole">
            <!-- Hole shadow (dark ellipse at bottom) -->
            <div class="hole-shadow"></div>
            
            <!-- Mole container with clipping -->
            <div class="mole-container">
              <div 
                class="mole"
                :class="[
                  hole.active ? 'mole-visible' : 'mole-hidden',
                  getMoleStateClass(hole)
                ]"
              >
                <!-- Mole face -->
                <div class="mole-face">
                  <div class="mole-ear mole-ear-left"></div>
                  <div class="mole-ear mole-ear-right"></div>
                  <div class="mole-head">
                    <div class="mole-eye mole-eye-left"></div>
                    <div class="mole-eye mole-eye-right"></div>
                    <div class="mole-nose"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Dirt mound (covers bottom of mole) -->
            <div class="dirt-mound">
              <div class="grass"></div>
            </div>
          </div>

          <!-- Hit Effect -->
          <div v-if="hole.showEffect" class="hit-effect">
            {{ hole.state === 'hit' ? '⭐' : '❌' }}
          </div>
        </div>
      </div>
    </div>

    <!-- START SCREEN -->
    <div v-if="!gameActive && !isGameOver" class="start-screen">
      <div class="start-content">
        <div class="start-mascot">🐹</div>
        <h1 class="start-title">Whack-a-Mole!</h1>
        <p class="start-subtitle">Tap moles with <strong>correct answers</strong>!</p>
        
        <div class="start-stats">
          <div class="stat-item">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">{{ maxLives }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">⏱️</span>
            <span class="stat-value">{{ initialTime }}s</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🎯</span>
            <span class="stat-value">{{ targetScore }}</span>
          </div>
        </div>

        <button class="start-btn" @click="startGame">
          Start Game ▶
        </button>
      </div>
    </div>

    <!-- GAME OVER SCREEN -->
    <div v-if="isGameOver" class="gameover-overlay">
      <div class="gameover-modal">
        <div class="gameover-emoji">
          {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👍' : '💪' }}
        </div>
        <h2 class="gameover-title">
          {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great!' : earnedStars >= 1 ? 'Good!' : 'Try Again!' }}
        </h2>
        <div class="gameover-score">{{ score }}</div>
        <div class="gameover-stars">
          <span v-for="n in 3" :key="n" :class="n <= earnedStars ? 'star-filled' : 'star-empty'">★</span>
        </div>
        <div class="gameover-stats">
          <div class="gstat">
            <div class="gstat-label">Correct</div>
            <div class="gstat-value gstat-correct">{{ correctHits }}</div>
          </div>
          <div class="gstat">
            <div class="gstat-label">Wrong</div>
            <div class="gstat-value gstat-wrong">{{ wrongHits }}</div>
          </div>
          <div class="gstat">
            <div class="gstat-label">Accuracy</div>
            <div class="gstat-value">{{ accuracy }}%</div>
          </div>
        </div>
        <div class="gameover-progress">
          <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
        </div>
        <div class="gameover-timer">{{ Math.ceil(progressWidth / 20) }}s...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
  gameData: { type: Object, required: true },
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 3 },
  timeRemaining: { type: Number, default: 60 }
});

const emit = defineEmits(['score-change', 'life-lost', 'game-complete', 'item-collected', 'game-started']);

// Config
const BASE_SPEED = 2500;
const MIN_SPEED = 1200;
const AUTO_DISMISS_DURATION = 5000;
const HOLE_COUNT = 4;

// Refs
const gameWrapper = ref(null);
const containerWidth = ref(400);
const containerHeight = ref(500);
let resizeObserver = null;

// Game settings
const maxLives = computed(() => props.gameData?.lives || 3);
const initialTime = computed(() => props.gameData?.timeLimit || 60);
const targetScore = computed(() => props.gameData?.targetScore || 100);

// State
const holes = ref([]);
const gameActive = ref(false);
const gameInterval = ref(null);
const currentQuestionIndex = ref(0);
const isGameOver = ref(false);
const earnedStars = ref(0);
const progressWidth = ref(100);
const progressTimer = ref(null);
const autoDismissTimer = ref(null);
const correctHits = ref(0);
const wrongHits = ref(0);

// Layout - always 2x2 for mobile-first design
const gridLayoutClass = computed(() => {
  const w = containerWidth.value;
  if (w >= 600) return 'grid-4x1';
  return 'grid-2x2';
});

// Mode detection
const mode = computed(() => {
  return (props.gameData?.questions?.length > 0) ? 'question' : 'category';
});

const questions = computed(() => props.gameData?.questions || []);
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);

const currentPrompt = computed(() => {
  if (mode.value === 'question') {
    return currentQuestion.value?.q || currentQuestion.value?.question || "Find the answer!";
  }
  return props.gameData?.targetCategory || props.gameData?.prompt || "Tap correct items!";
});

const accuracy = computed(() => {
  const total = correctHits.value + wrongHits.value;
  return total === 0 ? 0 : Math.round((correctHits.value / total) * 100);
});

// Mole state classes
const getMoleStateClass = (hole) => {
  if (hole.state === 'hit') return 'mole-hit';
  if (hole.state === 'miss') return 'mole-miss';
  return '';
};

const getAnswerLabelClass = (hole) => {
  if (hole.state === 'hit') return 'answer-correct';
  if (hole.state === 'miss') return 'answer-wrong';
  return 'answer-default';
};

// Initialize holes
const initHoles = () => {
  holes.value = Array.from({ length: HOLE_COUNT }, () => ({
    active: false,
    content: '',
    isCorrect: false,
    state: 'idle',
    showEffect: false,
    timer: null
  }));
};

// Spawn mole
const spawnMole = () => {
  if (!gameActive.value) return;

  const available = holes.value
    .map((h, i) => (!h.active ? i : null))
    .filter(i => i !== null);
  
  if (available.length === 0) return;

  const holeIdx = available[Math.floor(Math.random() * available.length)];
  const hole = holes.value[holeIdx];

  let content = "";
  let isCorrect = false;

  if (mode.value === 'question') {
    const q = currentQuestion.value;
    if (!q) return;
    
    isCorrect = Math.random() > 0.4;
    
    if (isCorrect) {
      content = q.a || q.answer || q.correctAnswer || "✓";
    } else {
      const wrong = q.wrong || q.wrongAnswers || q.distractors || [];
      content = wrong.length > 0 
        ? wrong[Math.floor(Math.random() * wrong.length)] 
        : "✗";
    }
  } else {
    const items = props.gameData?.items || [];
    if (items.length === 0) return;

    const item = items[Math.floor(Math.random() * items.length)];
    
    if (typeof item === 'string') {
      content = item;
      isCorrect = true;
    } else {
      content = item.text || item.word || item.label || "?";
      isCorrect = item.isCorrect ?? item.correct ?? true;
    }
  }

  hole.content = content;
  hole.isCorrect = isCorrect;
  hole.active = true;
  hole.state = 'idle';

  const speed = Math.max(MIN_SPEED, BASE_SPEED - (props.score * 15));
  
  hole.timer = setTimeout(() => {
    if (hole.active && hole.state === 'idle') {
      hole.active = false;
    }
  }, speed);
};

// Whack handler
const handleWhack = (index) => {
  const hole = holes.value[index];
  if (!hole || !hole.active || hole.state !== 'idle') return;

  clearTimeout(hole.timer);
  hole.showEffect = true;

  if (hole.isCorrect) {
    hole.state = 'hit';
    correctHits.value++;
    emit('score-change', 10);
    emit('item-collected', { isCorrect: true });
    if (mode.value === 'question') {
      setTimeout(() => nextQuestion(), 400);
    }
  } else {
    hole.state = 'miss';
    wrongHits.value++;
    emit('score-change', -5);
    emit('life-lost');
    emit('item-collected', { isCorrect: false });
  }

  setTimeout(() => {
    hole.active = false;
    hole.showEffect = false;
    hole.state = 'idle';
  }, 350);
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    holes.value.forEach(h => {
      h.active = false;
      clearTimeout(h.timer);
    });
  } else {
    finishGame();
  }
};

const calculateStars = () => {
  const pct = (props.score / targetScore.value) * 100;
  if (pct >= 100) return 3;
  if (pct >= 70) return 2;
  if (pct >= 40) return 1;
  return 0;
};

const finishGame = () => {
  stopGame();
  isGameOver.value = true;
  earnedStars.value = calculateStars();
  progressWidth.value = 100;

  const startTime = Date.now();
  progressTimer.value = setInterval(() => {
    const elapsed = Date.now() - startTime;
    progressWidth.value = Math.max(0, 100 - (elapsed / AUTO_DISMISS_DURATION) * 100);
  }, 50);

  autoDismissTimer.value = setTimeout(() => {
    clearInterval(progressTimer.value);
    emit('game-complete', {
      score: props.score,
      stars: earnedStars.value,
      accuracy: accuracy.value,
      correctHits: correctHits.value,
      wrongHits: wrongHits.value,
      completed: props.score >= targetScore.value * 0.4
    });
  }, AUTO_DISMISS_DURATION);
};

const startGame = () => {
  isGameOver.value = false;
  gameActive.value = true;
  correctHits.value = 0;
  wrongHits.value = 0;
  currentQuestionIndex.value = 0;
  initHoles();
  emit('game-started');

  setTimeout(() => {
    gameInterval.value = setInterval(spawnMole, 900);
  }, 500);
};

const stopGame = () => {
  gameActive.value = false;
  if (gameInterval.value) {
    clearInterval(gameInterval.value);
    gameInterval.value = null;
  }
  holes.value.forEach(h => {
    if (h.timer) clearTimeout(h.timer);
  });
};

const setupResizeObserver = () => {
  if (!gameWrapper.value) return;

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) {
      containerWidth.value = entry.contentRect.width;
      containerHeight.value = entry.contentRect.height;
    }
  });
  resizeObserver.observe(gameWrapper.value);

  containerWidth.value = gameWrapper.value.offsetWidth;
  containerHeight.value = gameWrapper.value.offsetHeight;
};

// Watchers
watch(() => props.score, (val) => {
  if (val >= targetScore.value && gameActive.value) finishGame();
});
watch(() => props.lives, (val) => {
  if (val <= 0 && gameActive.value) finishGame();
});
watch(() => props.timeRemaining, (val) => {
  if (val <= 0 && gameActive.value) finishGame();
});

onMounted(() => {
  initHoles();
  nextTick(() => {
    setupResizeObserver();
  });
});

onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
/* =============================================
   ROOT CONTAINER
   ============================================= */
.game-root {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* =============================================
   HUD - TOP BAR
   ============================================= */
.game-hud {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.hud-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.hud-icon {
  font-size: 14px;
}

.hud-value {
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.hud-lives {
  gap: 2px;
}

.heart {
  font-size: 14px;
  transition: transform 0.2s;
}

.heart-empty {
  opacity: 0.4;
}

/* =============================================
   QUESTION SECTION
   ============================================= */
.question-section {
  display: flex;
  justify-content: center;
  padding: 8px 12px;
  flex-shrink: 0;
}

.question-banner {
  background: white;
  border-radius: 12px;
  padding: 8px 16px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  animation: popIn 0.3s ease-out;
  max-width: 90%;
}

.question-label {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: #6366f1;
  color: white;
  font-size: 8px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

.question-text {
  font-size: 14px;
  font-weight: 700;
  color: #1e1b4b;
  margin-top: 4px;
  word-break: break-word;
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* =============================================
   GAME GRID AREA
   ============================================= */
.game-grid-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  min-height: 0;
  overflow: hidden;
}

.holes-container {
  display: grid;
  gap: 8px;
  width: 100%;
  max-width: 100%;
}

/* 2x2 grid for mobile */
.holes-container.grid-2x2 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  max-width: 280px;
  max-height: 320px;
}

/* 4x1 grid for wider screens */
.holes-container.grid-4x1 {
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 1fr;
  max-width: 500px;
  max-height: 150px;
}

/* =============================================
   HOLE WRAPPER - CONTAINS LABEL + HOLE
   ============================================= */
.hole-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  touch-action: manipulation;
  position: relative;
}

/* Answer label above the hole */
.answer-label-wrapper {
  height: 28px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 4px;
}

.answer-label {
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  border: 2px solid;
  animation: labelPop 0.2s ease-out;
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.answer-default {
  background: white;
  border-color: #fbbf24;
}

.answer-correct {
  background: #ecfdf5;
  border-color: #34d399;
}

.answer-wrong {
  background: #fef2f2;
  border-color: #f87171;
}

@keyframes labelPop {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* =============================================
   THE HOLE
   ============================================= */
.hole {
  width: 80px;
  height: 70px;
  position: relative;
}

@media (min-width: 400px) {
  .hole {
    width: 100px;
    height: 85px;
  }
}

@media (min-width: 600px) {
  .hole {
    width: 90px;
    height: 80px;
  }
}

/* Dark hole shadow at bottom */
.hole-shadow {
  position: absolute;
  bottom: 20%;
  left: 10%;
  width: 80%;
  height: 25%;
  background: #3d2817;
  border-radius: 50%;
  z-index: 1;
}

/* Mole container - clips the mole */
.mole-container {
  position: absolute;
  bottom: 35%;
  left: 15%;
  width: 70%;
  height: 55%;
  overflow: hidden;
  z-index: 2;
}

/* The mole itself */
.mole {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 85%;
  transform: translateX(-50%);
  transition: transform 0.15s ease-out;
}

.mole-hidden {
  transform: translateX(-50%) translateY(100%);
}

.mole-visible {
  transform: translateX(-50%) translateY(0);
}

.mole-hit {
  filter: brightness(1.3);
}

.mole-hit .mole-head {
  transform: scale(0.9);
}

.mole-miss {
  filter: brightness(0.7);
  animation: shake 0.25s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(-50%) rotate(-8deg); }
  75% { transform: translateX(-50%) rotate(8deg); }
}

/* Mole face parts */
.mole-face {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 0.9;
}

.mole-head {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #D4A574 0%, #B8845A 100%);
  border-radius: 50%;
  position: relative;
  transition: transform 0.15s;
}

.mole-ear {
  position: absolute;
  width: 20%;
  aspect-ratio: 1;
  background: #C4956A;
  border-radius: 50%;
  top: -5%;
}

.mole-ear-left { left: 15%; }
.mole-ear-right { right: 15%; }

.mole-eye {
  position: absolute;
  width: 12%;
  aspect-ratio: 1;
  background: #1e293b;
  border-radius: 50%;
  top: 35%;
}

.mole-eye-left { left: 28%; }
.mole-eye-right { right: 28%; }

.mole-nose {
  position: absolute;
  width: 10%;
  aspect-ratio: 1;
  background: #f472b6;
  border-radius: 50%;
  top: 55%;
  left: 50%;
  transform: translateX(-50%);
}

/* Dirt mound */
.dirt-mound {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40%;
  z-index: 3;
}

.dirt-mound::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(0deg, #5D4037 0%, #795548 50%, #8D6E63 100%);
  border-radius: 100% 100% 0 0;
}

.grass {
  position: absolute;
  top: 0;
  left: 10%;
  width: 80%;
  height: 8px;
  display: flex;
  justify-content: space-around;
}

.grass::before,
.grass::after {
  content: '';
  width: 3px;
  height: 8px;
  background: #10b981;
  border-radius: 2px 2px 0 0;
  transform: rotate(-10deg) translateY(-3px);
}

.grass::after {
  background: #34d399;
  transform: rotate(10deg) translateY(-3px);
}

/* Hit effect */
.hit-effect {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  z-index: 10;
  pointer-events: none;
  animation: floatUp 0.5s ease-out forwards;
}

@keyframes floatUp {
  0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-25px) scale(1.2); }
}

/* =============================================
   START SCREEN
   ============================================= */
.start-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  padding: 16px;
  z-index: 50;
}

.start-content {
  text-align: center;
  max-width: 300px;
  width: 100%;
}

.start-mascot {
  font-size: 48px;
  margin-bottom: 8px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.start-title {
  font-size: 22px;
  font-weight: 800;
  color: white;
  margin: 0 0 4px 0;
}

.start-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 16px 0;
}

.start-subtitle strong {
  color: white;
}

.start-stats {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 12px;
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.start-btn {
  background: white;
  color: #6366f1;
  border: none;
  padding: 14px 32px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  min-height: 48px;
  touch-action: manipulation;
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.25);
}

.start-btn:active {
  transform: scale(0.98);
}

/* =============================================
   GAME OVER SCREEN
   ============================================= */
.gameover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.gameover-modal {
  background: white;
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  max-width: 280px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: popIn 0.3s ease-out;
}

.gameover-emoji {
  font-size: 40px;
  margin-bottom: 4px;
}

.gameover-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.gameover-score {
  font-size: 32px;
  font-weight: 800;
  color: #6366f1;
  margin: 4px 0;
}

.gameover-stars {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
}

.gameover-stars span {
  font-size: 24px;
}

.star-filled {
  color: #fbbf24;
}

.star-empty {
  color: #e2e8f0;
}

.gameover-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
}

.gstat {
  flex: 1;
}

.gstat-label {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.gstat-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.gstat-correct { color: #10b981; }
.gstat-wrong { color: #ef4444; }

.gameover-progress {
  height: 4px;
  background: #f1f5f9;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #6366f1;
  transition: width 0.05s linear;
}

.gameover-timer {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
}

/* =============================================
   RESPONSIVE ADJUSTMENTS
   ============================================= */

/* Very small height - compact everything */
@media (max-height: 450px) {
  .game-hud {
    padding: 4px 8px;
  }
  
  .hud-item {
    padding: 2px 8px;
  }
  
  .hud-icon, .heart {
    font-size: 12px;
  }
  
  .hud-value {
    font-size: 11px;
  }
  
  .question-section {
    padding: 4px 8px;
  }
  
  .question-banner {
    padding: 6px 12px;
  }
  
  .question-text {
    font-size: 12px;
  }
  
  .game-grid-area {
    padding: 4px;
  }
  
  .holes-container.grid-2x2 {
    max-width: 220px;
    max-height: 240px;
    gap: 4px;
  }
  
  .hole {
    width: 70px;
    height: 60px;
  }
  
  .answer-label-wrapper {
    height: 22px;
    margin-bottom: 2px;
  }
  
  .answer-label {
    font-size: 10px;
    padding: 2px 6px;
  }
}

/* Medium height */
@media (min-height: 500px) and (max-height: 650px) {
  .holes-container.grid-2x2 {
    max-width: 260px;
    max-height: 300px;
  }
}

/* Larger screens */
@media (min-height: 700px) {
  .question-text {
    font-size: 16px;
  }
  
  .holes-container.grid-2x2 {
    max-width: 320px;
    max-height: 360px;
    gap: 12px;
  }
  
  .hole {
    width: 110px;
    height: 95px;
  }
  
  .answer-label {
    font-size: 14px;
    padding: 4px 12px;
  }
}

/* Wide screens - 4 column layout */
@media (min-width: 600px) {
  .holes-container.grid-4x1 {
    gap: 12px;
  }
  
  .answer-label-wrapper {
    height: 32px;
  }
}
</style>