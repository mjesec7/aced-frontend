<template>
  <div 
    ref="gameWrapper"
    class="game-container"
  >
    <!-- GAME PLAYING STATE -->
    <template v-if="gameActive">
      
      <!-- Top Section: Question + Stats -->
      <div class="top-section">
        <!-- Question Card -->
        <div class="question-card" :key="currentQuestionIndex">
          <span class="question-label">Question</span>
          <p class="question-text">{{ currentPrompt }}</p>
        </div>
        
        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-badge stat-score">
            <span class="stat-icon">🎯</span>
            <span class="stat-value">{{ score }}</span>
          </div>
          <div class="stat-badge stat-time">
            <span class="stat-icon">⏱️</span>
            <span class="stat-value">{{ timeRemaining }}s</span>
          </div>
          <div class="stat-badge stat-lives">
            <span v-for="i in maxLives" :key="i" class="heart">
              {{ i <= lives ? '❤️' : '🤍' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Main Game Area -->
      <div class="game-area">
        <div class="moles-grid">
          <!-- Mole 1 -->
          <div class="mole-cell" @click="handleWhack(0)" @touchstart.prevent="handleWhack(0)">
            <MoleHole :hole="holes[0]" />
          </div>
          <!-- Mole 2 -->
          <div class="mole-cell" @click="handleWhack(1)" @touchstart.prevent="handleWhack(1)">
            <MoleHole :hole="holes[1]" />
          </div>
          <!-- Mole 3 -->
          <div class="mole-cell" @click="handleWhack(2)" @touchstart.prevent="handleWhack(2)">
            <MoleHole :hole="holes[2]" />
          </div>
          <!-- Mole 4 -->
          <div class="mole-cell" @click="handleWhack(3)" @touchstart.prevent="handleWhack(3)">
            <MoleHole :hole="holes[3]" />
          </div>
        </div>
      </div>
    </template>

    <!-- START SCREEN -->
    <div v-else-if="!isGameOver" class="start-screen">
      <div class="start-content">
        <!-- Animated Mole -->
        <div class="start-mole">
          <div class="mole-preview">
            <div class="preview-body"></div>
            <div class="preview-ear preview-ear-l"></div>
            <div class="preview-ear preview-ear-r"></div>
            <div class="preview-eye preview-eye-l"></div>
            <div class="preview-eye preview-eye-r"></div>
            <div class="preview-nose"></div>
            <div class="preview-cheek preview-cheek-l"></div>
            <div class="preview-cheek preview-cheek-r"></div>
          </div>
        </div>
        
        <h1 class="start-title">Whack-a-Mole!</h1>
        <p class="start-subtitle">Tap moles with the <strong>correct answer</strong></p>
        
        <div class="start-info">
          <div class="info-item">
            <span class="info-icon">❤️</span>
            <span class="info-label">Lives</span>
            <span class="info-value">{{ maxLives }}</span>
          </div>
          <div class="info-item">
            <span class="info-icon">⏱️</span>
            <span class="info-label">Time</span>
            <span class="info-value">{{ initialTime }}s</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🎯</span>
            <span class="info-label">Goal</span>
            <span class="info-value">{{ targetScore }}</span>
          </div>
        </div>

        <button class="start-button" @click="startGame" @touchend.prevent="startGame">
          <span class="button-text">Play Now</span>
          <span class="button-icon">▶</span>
        </button>
      </div>
    </div>

    <!-- GAME OVER SCREEN -->
    <div v-else class="gameover-screen">
      <div class="gameover-card">
        <div class="gameover-emoji">
          {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👍' : '💪' }}
        </div>
        
        <h2 class="gameover-title">
          {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great Job!' : earnedStars >= 1 ? 'Good Try!' : 'Keep Going!' }}
        </h2>

        <div class="gameover-score">{{ score }}</div>
        <div class="gameover-score-label">points</div>

        <div class="gameover-stars">
          <span v-for="n in 3" :key="n" class="star" :class="n <= earnedStars ? 'star-filled' : 'star-empty'">★</span>
        </div>

        <div class="gameover-stats">
          <div class="gstat">
            <div class="gstat-value gstat-correct">{{ correctHits }}</div>
            <div class="gstat-label">Correct</div>
          </div>
          <div class="gstat-divider"></div>
          <div class="gstat">
            <div class="gstat-value gstat-wrong">{{ wrongHits }}</div>
            <div class="gstat-label">Wrong</div>
          </div>
          <div class="gstat-divider"></div>
          <div class="gstat">
            <div class="gstat-value">{{ accuracy }}%</div>
            <div class="gstat-label">Accuracy</div>
          </div>
        </div>

        <div class="gameover-progress">
          <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
        </div>
        <p class="gameover-timer">Next in {{ Math.ceil(progressWidth / 20) }}s</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineComponent, h } from 'vue';

// Inline MoleHole component for cleaner code
const MoleHole = defineComponent({
  props: { hole: Object },
  setup(props) {
    return () => h('div', { class: 'hole-container' }, [
      h('div', { class: 'hole-visual' }, [
        h('div', { class: 'hole-bg' }),
        // Mole
        h('div', { 
          class: ['mole-wrapper', { 
            'mole-up': props.hole?.active,
            'mole-hit': props.hole?.state === 'hit',
            'mole-miss': props.hole?.state === 'miss'
          }]
        }, [
          h('div', { class: 'mole-body' }, [
            h('div', { class: 'mole-face' }, [
              h('div', { class: 'mole-eyebrow mole-eyebrow-l' }),
              h('div', { class: 'mole-eyebrow mole-eyebrow-r' }),
              h('div', { class: 'mole-eye mole-eye-l' }),
              h('div', { class: 'mole-eye mole-eye-r' }),
              h('div', { class: 'mole-nose' }),
              h('div', { class: 'mole-mouth' })
            ]),
            // Wooden Sign
            h('div', { class: 'mole-sign' }, [
              h('div', { class: 'sign-text' }, props.hole?.content || '')
            ])
          ])
        ]),
        // Dirt mound (front layer)
        h('div', { class: 'dirt-mound' })
      ]),
      // Hit effect
      props.hole?.showEffect ? h('div', { class: 'hit-effect' }, props.hole.state === 'hit' ? '⭐' : '❌') : null
    ]);
  }
});

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
const AUTO_DISMISS = 5000;

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

// Computed
const mode = computed(() => (props.gameData?.questions?.length > 0) ? 'question' : 'category');
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

// Initialize
const initHoles = () => {
  holes.value = Array.from({ length: 4 }, () => ({
    active: false, content: '', isCorrect: false, state: 'idle', showEffect: false, timer: null
  }));
};

// Spawn mole
const spawnMole = () => {
  if (!gameActive.value) return;
  const available = holes.value.map((h, i) => (!h.active ? i : null)).filter(i => i !== null);
  if (available.length === 0) return;

  const idx = available[Math.floor(Math.random() * available.length)];
  const hole = holes.value[idx];
  let content = "", isCorrect = false;

  if (mode.value === 'question') {
    const q = currentQuestion.value;
    if (!q) return;
    isCorrect = Math.random() > 0.4;
    if (isCorrect) {
      content = q.a || q.answer || q.correctAnswer || "✓";
    } else {
      const wrong = q.wrong || q.wrongAnswers || q.distractors || [];
      content = wrong.length > 0 ? wrong[Math.floor(Math.random() * wrong.length)] : "✗";
    }
  } else {
    const items = props.gameData?.items || [];
    if (items.length === 0) return;
    const item = items[Math.floor(Math.random() * items.length)];
    if (typeof item === 'string') { content = item; isCorrect = true; }
    else { content = item.text || item.word || item.label || "?"; isCorrect = item.isCorrect ?? item.correct ?? true; }
  }

  hole.content = content;
  hole.isCorrect = isCorrect;
  hole.active = true;
  hole.state = 'idle';

  const speed = Math.max(MIN_SPEED, BASE_SPEED - (props.score * 15));
  hole.timer = setTimeout(() => { if (hole.active && hole.state === 'idle') hole.active = false; }, speed);
};

// Whack
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
    if (mode.value === 'question') setTimeout(() => nextQuestion(), 400);
  } else {
    hole.state = 'miss';
    wrongHits.value++;
    emit('score-change', -5);
    emit('life-lost');
    emit('item-collected', { isCorrect: false });
  }

  setTimeout(() => { hole.active = false; hole.showEffect = false; hole.state = 'idle'; }, 350);
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    holes.value.forEach(h => { h.active = false; clearTimeout(h.timer); });
  } else finishGame();
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

  const start = Date.now();
  progressTimer.value = setInterval(() => {
    progressWidth.value = Math.max(0, 100 - ((Date.now() - start) / AUTO_DISMISS) * 100);
  }, 50);

  autoDismissTimer.value = setTimeout(() => {
    clearInterval(progressTimer.value);
    emit('game-complete', { score: props.score, stars: earnedStars.value, accuracy: accuracy.value, correctHits: correctHits.value, wrongHits: wrongHits.value, completed: props.score >= targetScore.value * 0.4 });
  }, AUTO_DISMISS);
};

const startGame = () => {
  isGameOver.value = false;
  gameActive.value = true;
  correctHits.value = 0;
  wrongHits.value = 0;
  currentQuestionIndex.value = 0;
  initHoles();
  emit('game-started');
  setTimeout(() => { gameInterval.value = setInterval(spawnMole, 900); }, 500);
};

const stopGame = () => {
  gameActive.value = false;
  if (gameInterval.value) { clearInterval(gameInterval.value); gameInterval.value = null; }
  holes.value.forEach(h => { if (h.timer) clearTimeout(h.timer); });
};

watch(() => props.score, (v) => { if (v >= targetScore.value && gameActive.value) finishGame(); });
watch(() => props.lives, (v) => { if (v <= 0 && gameActive.value) finishGame(); });
watch(() => props.timeRemaining, (v) => { if (v <= 0 && gameActive.value) finishGame(); });

onMounted(() => initHoles());
onUnmounted(() => { stopGame(); if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value); if (progressTimer.value) clearInterval(progressTimer.value); });
</script>

<style scoped>
/* ============================================
   GAME CONTAINER - Mobile First
   ============================================ */
.game-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #7c3aed;
  font-family: 'Nunito', system-ui, -apple-system, sans-serif;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* ============================================
   TOP SECTION - Question + Stats
   ============================================ */
.top-section {
  flex-shrink: 0;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 14px 18px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  position: relative;
  animation: slideDown 0.3s ease-out;
}

.question-label {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.question-text {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 6px 0 0 0;
  line-height: 1.4;
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.3);
}

.stat-icon { font-size: 14px; }
.stat-value { font-size: 14px; font-weight: 700; color: white; }
.stat-lives { gap: 2px; }
.heart { font-size: 14px; }

/* ============================================
   GAME AREA - Moles Grid
   ============================================ */
.game-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  min-height: 0;
}

.moles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 48px 12px;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 1 / 1.1;
}

.mole-cell {
  position: relative;
  cursor: pointer;
  touch-action: manipulation;
}

/* ============================================
   HOLE CONTAINER - Each Mole Slot
   ============================================ */
.hole-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.answer-wrapper {
  display: none;
}

/* ============================================
   HOLE VISUAL - The Actual Hole + Mole
   ============================================ */
:deep(.hole-visual) {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 80px;
}

:deep(.hole-bg) {
  position: absolute;
  bottom: 20%;
  left: 15%;
  width: 70%;
  height: 22%;
  background: radial-gradient(ellipse, #3d2817 0%, #2a1a0f 100%);
  border-radius: 50%;
}

/* ============================================
   MOLE - The Character
   ============================================ */
:deep(.mole-wrapper) {
  position: absolute;
  bottom: 20%;
  left: 20%;
  width: 60%;
  transform: translateY(100%);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

:deep(.mole-up) {
  transform: translateY(0%);
}

:deep(.mole-hit) .mole-body {
  transform: scale(0.85);
  filter: brightness(1.2);
}

:deep(.mole-miss) .mole-body {
  animation: shake 0.3s ease-in-out;
  filter: brightness(0.8);
}

:deep(.mole-body) {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  transition: transform 0.15s, filter 0.15s;
}

/* Mole face (the round brown part) */
:deep(.mole-face) {
  position: absolute;
  inset: 0 10% 20% 10%;
  background: linear-gradient(180deg, #d4a574 0%, #b8845a 100%);
  border-radius: 50% 50% 40% 40%;
  box-shadow: inset 0 -4px 8px rgba(0,0,0,0.1);
}

/* Eyebrows */
:deep(.mole-eyebrow) {
  position: absolute;
  width: 15%;
  height: 4%;
  background: #4e342e;
  border-radius: 2px;
  top: 28%;
}
:deep(.mole-eyebrow-l) { left: 28%; transform: rotate(-10deg); }
:deep(.mole-eyebrow-r) { right: 28%; transform: rotate(10deg); }

/* Eyes */
:deep(.mole-eye) {
  position: absolute;
  width: 10%;
  padding-bottom: 10%;
  background: #1a1a2e;
  border-radius: 50%;
  top: 38%;
}
:deep(.mole-eye-l) { left: 32%; }
:deep(.mole-eye-r) { right: 32%; }

/* Nose */
:deep(.mole-nose) {
  position: absolute;
  width: 12%;
  padding-bottom: 8%;
  background: #ff6b8a;
  border-radius: 50%;
  top: 52%;
  left: 50%;
  transform: translateX(-50%);
}

/* Mouth */
:deep(.mole-mouth) {
  position: absolute;
  width: 15%;
  height: 6%;
  background: #4e342e;
  border-radius: 0 0 10px 10px;
  top: 65%;
  left: 50%;
  transform: translateX(-50%);
}

/* Wooden Sign */
:deep(.mole-sign) {
  position: absolute;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  height: 32%;
  background: #d2b48c;
  background-image: repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(139, 69, 19, 0.1) 15px, rgba(139, 69, 19, 0.1) 30px);
  border: 2px solid #8b4513;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 5;
}

:deep(.sign-text) {
  color: #4e342e;
  font-weight: 900;
  font-size: 18px;
  text-shadow: 0 1px 2px rgba(255,255,255,0.5);
}

/* ============================================
   DIRT MOUND - Front Layer
   ============================================ */
:deep(.dirt-mound) {
  position: absolute;
  bottom: -5%;
  left: 0;
  width: 100%;
  height: 55%;
  background: radial-gradient(circle at 50% 100%, #8d6e63 0%, #6d4c41 60%, #4e342e 100%);
  border-radius: 50% 50% 15% 15% / 100% 100% 15% 15%;
  z-index: 3;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

:deep(.dirt-mound::after) {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(#4e342e 1.5px, transparent 1.5px);
  background-size: 10px 10px;
  opacity: 0.2;
}

:deep(.grass-blade) {
  position: absolute;
  width: 4px;
  background: linear-gradient(180deg, #66bb6a 0%, #43a047 100%);
  border-radius: 2px 2px 0 0;
  top: 0;
  transform-origin: bottom center;
}
:deep(.grass-1) { left: 15%; height: 12px; transform: rotate(-15deg) translateY(-8px); }
:deep(.grass-2) { left: 30%; height: 16px; transform: rotate(8deg) translateY(-10px); }
:deep(.grass-3) { left: 50%; height: 14px; transform: rotate(-5deg) translateY(-9px); }
:deep(.grass-4) { left: 68%; height: 18px; transform: rotate(12deg) translateY(-11px); }
:deep(.grass-5) { left: 82%; height: 13px; transform: rotate(-10deg) translateY(-8px); }

/* Hit effect */
:deep(.hit-effect) {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 28px;
  z-index: 10;
  animation: floatUp 0.6s ease-out forwards;
  pointer-events: none;
}

/* ============================================
   START SCREEN
   ============================================ */
.start-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 24px;
}

.start-content {
  text-align: center;
  width: 100%;
  max-width: 320px;
}

.start-mole {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  animation: bounce 2s ease-in-out infinite;
}

.mole-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-body {
  position: absolute;
  inset: 10%;
  background: linear-gradient(180deg, #e8c9a0 0%, #d4a574 30%, #b8845a 100%);
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.preview-ear {
  position: absolute;
  width: 26%;
  height: 26%;
  background: #d4a574;
  border-radius: 50%;
  top: 5%;
}
.preview-ear-l { left: 12%; }
.preview-ear-r { right: 12%; }

.preview-eye {
  position: absolute;
  width: 18%;
  height: 22%;
  background: #1a1a2e;
  border-radius: 50%;
  top: 35%;
}
.preview-eye-l { left: 28%; }
.preview-eye-r { right: 28%; }

.preview-nose {
  position: absolute;
  width: 14%;
  height: 10%;
  background: #ff6b8a;
  border-radius: 50%;
  top: 55%;
  left: 50%;
  transform: translateX(-50%);
}

.preview-cheek {
  position: absolute;
  width: 16%;
  height: 10%;
  background: rgba(255,182,193,0.6);
  border-radius: 50%;
  top: 52%;
}
.preview-cheek-l { left: 15%; }
.preview-cheek-r { right: 15%; }

.start-title {
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.start-subtitle {
  font-size: 16px;
  color: rgba(255,255,255,0.9);
  margin: 0 0 28px 0;
}

.start-subtitle strong {
  color: #fbbf24;
}

.start-info {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  padding: 12px 18px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.2);
}

.info-icon { font-size: 24px; margin-bottom: 4px; }
.info-label { font-size: 11px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px; }
.info-value { font-size: 18px; font-weight: 700; color: white; }

.start-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: white;
  color: #764ba2;
  border: none;
  padding: 16px 40px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  touch-action: manipulation;
}

.start-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
}

.start-button:active {
  transform: scale(0.98);
}

.button-icon {
  font-size: 16px;
}

/* ============================================
   GAME OVER SCREEN
   ============================================ */
.gameover-screen {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.gameover-card {
  background: white;
  border-radius: 28px;
  padding: 28px 24px;
  text-align: center;
  width: 100%;
  max-width: 300px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gameover-emoji {
  font-size: 56px;
  margin-bottom: 8px;
}

.gameover-title {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.gameover-score {
  font-size: 56px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.gameover-score-label {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.gameover-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.star {
  font-size: 36px;
  transition: transform 0.3s, color 0.3s;
}

.star-filled {
  color: #fbbf24;
  text-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  animation: starPop 0.4s ease-out;
}

.star-empty {
  color: #e2e8f0;
}

.gameover-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 16px;
}

.gstat {
  text-align: center;
}

.gstat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
}

.gstat-correct { color: #10b981; }
.gstat-wrong { color: #ef4444; }

.gstat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gstat-divider {
  width: 1px;
  height: 32px;
  background: #e2e8f0;
}

.gameover-progress {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.1s linear;
}

.gameover-timer {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 8px;
}

/* ============================================
   ANIMATIONS
   ============================================ */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes popIn {
  0% { opacity: 0; transform: scale(0.8); }
  50% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px) rotate(-3deg); }
  40% { transform: translateX(6px) rotate(3deg); }
  60% { transform: translateX(-4px) rotate(-2deg); }
  80% { transform: translateX(4px) rotate(2deg); }
}

@keyframes floatUp {
  0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(1.3); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes starPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
</style>