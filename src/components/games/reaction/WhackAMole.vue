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

// Inline MoleHole component - Cute design with wooden sign
const MoleHole = defineComponent({
  props: { hole: Object },
  setup(props) {
    return () => h('div', { class: 'hole-container' }, [
      h('div', { class: 'hole-visual' }, [
        // Dirt mound background (behind mole)
        h('div', { class: 'dirt-mound-back' }),
        // Mole
        h('div', {
          class: ['mole-wrapper', {
            'mole-up': props.hole?.active,
            'mole-hit': props.hole?.state === 'hit',
            'mole-miss': props.hole?.state === 'miss'
          }]
        }, [
          h('div', { class: 'mole-body' }, [
            // Cute mole head
            h('div', { class: 'mole-head' }, [
              // Ears
              h('div', { class: 'mole-ear mole-ear-l' }),
              h('div', { class: 'mole-ear mole-ear-r' }),
              // Face features
              h('div', { class: 'mole-face' }, [
                // Eyes
                h('div', { class: 'mole-eye mole-eye-l' }, [
                  h('div', { class: 'mole-pupil' }),
                  h('div', { class: 'mole-eye-shine' })
                ]),
                h('div', { class: 'mole-eye mole-eye-r' }, [
                  h('div', { class: 'mole-pupil' }),
                  h('div', { class: 'mole-eye-shine' })
                ]),
                // Rosy cheeks
                h('div', { class: 'mole-cheek mole-cheek-l' }),
                h('div', { class: 'mole-cheek mole-cheek-r' }),
                // Nose
                h('div', { class: 'mole-nose' }),
                // Cute smile
                h('div', { class: 'mole-mouth' })
              ])
            ])
          ])
        ]),
        // Dirt mound front (covers bottom of mole)
        h('div', { class: 'dirt-mound-front' }),
        // Wooden sign with answer - OUTSIDE mole wrapper for proper z-index
        h('div', {
          class: ['wooden-sign', { 'sign-visible': props.hole?.active }]
        }, [
          h('div', { class: 'sign-board' }, [
            h('span', { class: 'sign-text' }, props.hole?.content || '')
          ])
        ])
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
   GAME CONTAINER - Mobile First (Cute Design)
   ============================================ */
.game-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f5f0eb 0%, #e8ddd4 100%);
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
  border-radius: 20px;
  padding: 16px 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(139, 90, 43, 0.15);
  position: relative;
  animation: slideDown 0.3s ease-out;
  border: 3px solid #d4a574;
}

.question-label {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #c9915e, #a67744);
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 14px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(139, 90, 43, 0.3);
}

.question-text {
  font-size: 18px;
  font-weight: 700;
  color: #5d4037;
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
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 20px;
  border: 2px solid #d4a574;
  box-shadow: 0 2px 8px rgba(139, 90, 43, 0.1);
}

.stat-icon { font-size: 14px; }
.stat-value { font-size: 14px; font-weight: 700; color: #5d4037; }
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
  gap: 24px;
  row-gap: 40px;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.mole-cell {
  position: relative;
  cursor: pointer;
  touch-action: manipulation;
  aspect-ratio: 1 / 1.2;
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

/* ============================================
   HOLE VISUAL - The Cute Mole Design
   ============================================ */
:deep(.hole-visual) {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 120px;
  overflow: hidden; /* Hide mole when it goes down */
}

/* ============================================
   DIRT MOUND - Back Layer (Behind Mole)
   ============================================ */
:deep(.dirt-mound-back) {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 65%;
  background:
    radial-gradient(ellipse 120% 100% at 50% 100%, #c9915e 0%, #b07d4f 40%, #8b5a2b 70%, #6d4c41 100%);
  border-radius: 50% 50% 45% 45% / 40% 40% 60% 60%;
  z-index: 1;
}

/* Texture dots on dirt */
:deep(.dirt-mound-back::before) {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(139, 90, 43, 0.4) 2px, transparent 2px),
    radial-gradient(circle at 70% 50%, rgba(139, 90, 43, 0.3) 3px, transparent 3px),
    radial-gradient(circle at 40% 70%, rgba(139, 90, 43, 0.35) 2px, transparent 2px),
    radial-gradient(circle at 80% 25%, rgba(139, 90, 43, 0.3) 2px, transparent 2px),
    radial-gradient(circle at 30% 55%, rgba(139, 90, 43, 0.25) 2px, transparent 2px);
  border-radius: inherit;
}

/* ============================================
   MOLE - The Cute Character
   ============================================ */
:deep(.mole-wrapper) {
  position: absolute;
  bottom: 25%;
  left: 50%;
  transform: translateX(-50%) translateY(150%);
  width: 55%;
  height: 70%;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

:deep(.mole-up) {
  transform: translateX(-50%) translateY(10%) !important;
}

:deep(.mole-hit) .mole-body {
  transform: scale(0.9);
}

:deep(.mole-hit) .mole-head {
  animation: happyBounce 0.3s ease-out;
}

:deep(.mole-miss) .mole-body {
  animation: shake 0.3s ease-in-out;
}

:deep(.mole-body) {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.15s;
}

/* ============================================
   MOLE HEAD - Cute Round Face
   ============================================ */
:deep(.mole-head) {
  position: relative;
  width: 100%;
  padding-bottom: 85%;
  flex-shrink: 0;
}

:deep(.mole-face) {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 70% at 50% 30%, #e8c9a0 0%, transparent 50%),
    linear-gradient(180deg, #d4a574 0%, #c9915e 50%, #b07d4f 100%);
  border-radius: 50% 50% 45% 45%;
  box-shadow:
    inset 0 -8px 16px rgba(139, 90, 43, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Ears */
:deep(.mole-ear) {
  position: absolute;
  width: 28%;
  height: 28%;
  background: linear-gradient(180deg, #d4a574 0%, #c9915e 100%);
  border-radius: 50%;
  top: 5%;
  z-index: -1;
  box-shadow: inset 0 -2px 4px rgba(139, 90, 43, 0.3);
}
:deep(.mole-ear-l) { left: 5%; }
:deep(.mole-ear-r) { right: 5%; }

/* Inner ear */
:deep(.mole-ear::after) {
  content: '';
  position: absolute;
  width: 50%;
  height: 50%;
  background: #b07d4f;
  border-radius: 50%;
  top: 25%;
  left: 25%;
}

/* Eyes */
:deep(.mole-eye) {
  position: absolute;
  width: 22%;
  height: 26%;
  background: white;
  border-radius: 50%;
  top: 32%;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
:deep(.mole-eye-l) { left: 18%; }
:deep(.mole-eye-r) { right: 18%; }

/* Pupil */
:deep(.mole-pupil) {
  position: absolute;
  width: 55%;
  height: 55%;
  background: #3d2817;
  border-radius: 50%;
  top: 30%;
  left: 25%;
}

/* Eye shine */
:deep(.mole-eye-shine) {
  position: absolute;
  width: 25%;
  height: 25%;
  background: white;
  border-radius: 50%;
  top: 25%;
  left: 20%;
}

/* Rosy cheeks */
:deep(.mole-cheek) {
  position: absolute;
  width: 20%;
  height: 12%;
  background: radial-gradient(ellipse, rgba(255, 182, 193, 0.7) 0%, transparent 70%);
  border-radius: 50%;
  top: 55%;
}
:deep(.mole-cheek-l) { left: 8%; }
:deep(.mole-cheek-r) { right: 8%; }

/* Nose */
:deep(.mole-nose) {
  position: absolute;
  width: 18%;
  height: 12%;
  background: linear-gradient(180deg, #8b5a2b 0%, #6d4c41 100%);
  border-radius: 50% 50% 40% 40%;
  top: 52%;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Cute smile */
:deep(.mole-mouth) {
  position: absolute;
  width: 30%;
  height: 10%;
  border: 3px solid #6d4c41;
  border-top: none;
  border-radius: 0 0 50% 50%;
  top: 65%;
  left: 50%;
  transform: translateX(-50%);
  background: transparent;
}

/* ============================================
   WOODEN SIGN - Answer Display (positioned outside mole)
   ============================================ */
:deep(.wooden-sign) {
  position: absolute;
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%) translateY(100%) scale(0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

:deep(.wooden-sign.sign-visible) {
  transform: translateX(-50%) translateY(0) scale(1);
  opacity: 1;
}

:deep(.sign-board) {
  background: linear-gradient(180deg, #fff8f0 0%, #f5e6d3 20%, #e8d5b5 60%, #d4bc96 100%);
  border: 4px solid #6d4c41;
  border-radius: 8px;
  padding: 8px 20px;
  min-width: 50px;
  text-align: center;
  box-shadow:
    inset 0 3px 6px rgba(255, 255, 255, 0.5),
    inset 0 -3px 6px rgba(139, 90, 43, 0.15),
    0 6px 12px rgba(0, 0, 0, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
}

/* Wood grain effect */
:deep(.sign-board::before) {
  content: '';
  position: absolute;
  inset: 3px;
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 8px,
      rgba(139, 90, 43, 0.06) 8px,
      rgba(139, 90, 43, 0.06) 10px
    );
  border-radius: 4px;
  pointer-events: none;
}

:deep(.sign-text) {
  font-size: clamp(18px, 5vw, 28px);
  font-weight: 900;
  color: #3d2817;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  line-height: 1.2;
}

/* ============================================
   DIRT MOUND - Front Layer (Covers Mole Bottom)
   ============================================ */
:deep(.dirt-mound-front) {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 30%;
  background:
    radial-gradient(ellipse 100% 80% at 50% 100%, #c9915e 0%, #b07d4f 50%, #8b5a2b 100%);
  border-radius: 50% 50% 45% 45% / 50% 50% 50% 50%;
  z-index: 3;
  box-shadow:
    inset 0 8px 16px rgba(232, 197, 160, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Texture on front mound */
:deep(.dirt-mound-front::before) {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 25% 40%, rgba(139, 90, 43, 0.3) 3px, transparent 3px),
    radial-gradient(circle at 65% 35%, rgba(139, 90, 43, 0.25) 2px, transparent 2px),
    radial-gradient(circle at 45% 60%, rgba(139, 90, 43, 0.3) 2px, transparent 2px),
    radial-gradient(circle at 75% 55%, rgba(139, 90, 43, 0.2) 3px, transparent 3px);
  border-radius: inherit;
}

/* Hit effect */
:deep(.hit-effect) {
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32px;
  z-index: 10;
  animation: floatUp 0.6s ease-out forwards;
  pointer-events: none;
}

/* ============================================
   START SCREEN - Cute Theme
   ============================================ */
.start-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f5f0eb 0%, #e8ddd4 50%, #d4c4b0 100%);
  padding: 24px;
}

.start-content {
  text-align: center;
  width: 100%;
  max-width: 320px;
}

.start-mole {
  width: 120px;
  height: 120px;
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
  inset: 8%;
  background:
    radial-gradient(ellipse 80% 70% at 50% 30%, #e8c9a0 0%, transparent 50%),
    linear-gradient(180deg, #d4a574 0%, #c9915e 50%, #b07d4f 100%);
  border-radius: 50% 50% 45% 45%;
  box-shadow:
    inset 0 -8px 16px rgba(139, 90, 43, 0.2),
    0 8px 24px rgba(139, 90, 43, 0.3);
}

.preview-ear {
  position: absolute;
  width: 26%;
  height: 26%;
  background: linear-gradient(180deg, #d4a574 0%, #c9915e 100%);
  border-radius: 50%;
  top: 5%;
  box-shadow: inset 0 -2px 4px rgba(139, 90, 43, 0.3);
}
.preview-ear-l { left: 10%; }
.preview-ear-r { right: 10%; }

.preview-ear::after {
  content: '';
  position: absolute;
  width: 50%;
  height: 50%;
  background: #b07d4f;
  border-radius: 50%;
  top: 25%;
  left: 25%;
}

.preview-eye {
  position: absolute;
  width: 20%;
  height: 24%;
  background: white;
  border-radius: 50%;
  top: 35%;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.preview-eye-l { left: 24%; }
.preview-eye-r { right: 24%; }

.preview-eye::before {
  content: '';
  position: absolute;
  width: 55%;
  height: 55%;
  background: #3d2817;
  border-radius: 50%;
  top: 30%;
  left: 25%;
}

.preview-eye::after {
  content: '';
  position: absolute;
  width: 20%;
  height: 20%;
  background: white;
  border-radius: 50%;
  top: 25%;
  left: 20%;
}

.preview-nose {
  position: absolute;
  width: 16%;
  height: 10%;
  background: linear-gradient(180deg, #8b5a2b 0%, #6d4c41 100%);
  border-radius: 50% 50% 40% 40%;
  top: 55%;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.preview-cheek {
  position: absolute;
  width: 18%;
  height: 12%;
  background: radial-gradient(ellipse, rgba(255, 182, 193, 0.7) 0%, transparent 70%);
  border-radius: 50%;
  top: 52%;
}
.preview-cheek-l { left: 12%; }
.preview-cheek-r { right: 12%; }

.start-title {
  font-size: 32px;
  font-weight: 800;
  color: #5d4037;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(139, 90, 43, 0.2);
}

.start-subtitle {
  font-size: 16px;
  color: #8b7355;
  margin: 0 0 28px 0;
}

.start-subtitle strong {
  color: #c9915e;
}

.start-info {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  padding: 12px 16px;
  border-radius: 16px;
  border: 2px solid #d4a574;
  box-shadow: 0 4px 12px rgba(139, 90, 43, 0.15);
}

.info-icon { font-size: 24px; margin-bottom: 4px; }
.info-label { font-size: 11px; color: #a08060; text-transform: uppercase; letter-spacing: 0.5px; }
.info-value { font-size: 18px; font-weight: 700; color: #5d4037; }

.start-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #c9915e 0%, #a67744 100%);
  color: white;
  border: none;
  padding: 16px 40px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(139, 90, 43, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  touch-action: manipulation;
}

.start-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 32px rgba(139, 90, 43, 0.4);
}

.start-button:active {
  transform: scale(0.98);
}

.button-icon {
  font-size: 16px;
}

/* ============================================
   GAME OVER SCREEN - Cute Theme
   ============================================ */
.gameover-screen {
  position: absolute;
  inset: 0;
  background: rgba(93, 64, 55, 0.7);
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
  box-shadow: 0 20px 60px rgba(139, 90, 43, 0.3);
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 3px solid #d4a574;
}

.gameover-emoji {
  font-size: 56px;
  margin-bottom: 8px;
}

.gameover-title {
  font-size: 24px;
  font-weight: 800;
  color: #5d4037;
  margin: 0 0 4px 0;
}

.gameover-score {
  font-size: 56px;
  font-weight: 800;
  background: linear-gradient(135deg, #c9915e, #8b5a2b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.gameover-score-label {
  font-size: 14px;
  color: #a08060;
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
  color: #e8ddd4;
}

.gameover-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: #f5f0eb;
  border-radius: 16px;
  margin-bottom: 16px;
  border: 2px solid #e8ddd4;
}

.gstat {
  text-align: center;
}

.gstat-value {
  font-size: 22px;
  font-weight: 700;
  color: #5d4037;
}

.gstat-correct { color: #4caf50; }
.gstat-wrong { color: #e57373; }

.gstat-label {
  font-size: 11px;
  color: #a08060;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gstat-divider {
  width: 1px;
  height: 32px;
  background: #d4a574;
}

.gameover-progress {
  height: 6px;
  background: #e8ddd4;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #c9915e, #8b5a2b);
  transition: width 0.1s linear;
}

.gameover-timer {
  font-size: 13px;
  color: #a08060;
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

@keyframes happyBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* ============================================
   RESPONSIVE DESIGN - All Device Types
   ============================================ */

/* Large phones and small tablets (481px - 768px) */
@media (min-width: 481px) {
  .moles-grid {
    gap: 32px;
    row-gap: 48px;
    max-width: 450px;
  }

  :deep(.sign-board) {
    padding: 10px 24px;
    min-width: 60px;
  }

  :deep(.sign-text) {
    font-size: 24px;
  }
}

/* Tablets and larger (769px+) */
@media (min-width: 769px) {
  .moles-grid {
    gap: 40px;
    row-gap: 60px;
    max-width: 550px;
  }

  .question-text {
    font-size: 22px;
  }

  :deep(.sign-board) {
    padding: 12px 28px;
    min-width: 70px;
    border-width: 5px;
  }

  :deep(.sign-text) {
    font-size: 28px;
  }
}

/* Small phones (max-width: 400px) */
@media (max-width: 400px) {
  .moles-grid {
    gap: 16px;
    row-gap: 28px;
    padding: 10px;
    max-width: 100%;
  }

  .question-text {
    font-size: 15px;
  }

  .top-section {
    padding: 8px 10px;
    gap: 6px;
  }

  .question-card {
    padding: 12px 14px;
  }

  :deep(.sign-board) {
    padding: 6px 14px;
    min-width: 40px;
    border-width: 3px;
  }

  :deep(.mole-wrapper) {
    width: 52%;
    height: 68%;
  }

  .stat-badge {
    padding: 4px 8px;
  }

  .stat-icon, .stat-value, .heart {
    font-size: 12px;
  }
}

/* Short screens (landscape or small height) */
@media (max-height: 700px) {
  .top-section {
    padding: 6px 12px;
    gap: 4px;
  }

  .question-card {
    padding: 10px 14px;
  }

  .question-label {
    top: -8px;
    font-size: 9px;
    padding: 3px 10px;
  }

  .question-text {
    font-size: 14px;
    margin-top: 4px;
  }

  .stats-row {
    gap: 6px;
  }

  .stat-badge {
    padding: 4px 8px;
  }

  .moles-grid {
    row-gap: 24px;
    gap: 16px;
    padding: 8px;
  }

  :deep(.hole-visual) {
    min-height: 110px;
  }
}

/* Very short screens */
@media (max-height: 600px) {
  .game-area {
    padding: 4px;
  }

  .top-section {
    padding: 4px 8px;
    gap: 4px;
  }

  .question-card {
    padding: 8px 12px;
    border-radius: 12px;
  }

  .moles-grid {
    gap: 12px;
    row-gap: 20px;
    padding: 6px;
  }

  :deep(.hole-visual) {
    min-height: 95px;
  }

  :deep(.mole-wrapper) {
    width: 50%;
    height: 65%;
  }

  :deep(.sign-board) {
    padding: 4px 10px;
    min-width: 35px;
  }
}

/* Extra small phones (iPhone SE, etc) */
@media (max-width: 375px) {
  .moles-grid {
    gap: 12px;
    row-gap: 24px;
    padding: 8px;
  }

  :deep(.mole-wrapper) {
    width: 48%;
    height: 62%;
  }

  :deep(.sign-board) {
    padding: 4px 10px;
    min-width: 35px;
    border-width: 2px;
  }

  .stat-badge {
    padding: 3px 6px;
  }

  .stat-icon, .stat-value {
    font-size: 11px;
  }

  .heart {
    font-size: 11px;
  }
}

/* Landscape mode on phones */
@media (max-height: 500px) and (orientation: landscape) {
  .game-container {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .top-section {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 4px 12px;
  }

  .question-card {
    flex: 1;
    margin-right: 12px;
  }

  .stats-row {
    flex-shrink: 0;
  }

  .game-area {
    width: 100%;
  }

  .moles-grid {
    row-gap: 16px;
    gap: 20px;
    max-width: 400px;
  }

  :deep(.hole-visual) {
    min-height: 85px;
  }

  :deep(.mole-wrapper) {
    width: 45%;
    height: 60%;
  }

  :deep(.sign-board) {
    padding: 3px 8px;
  }
}
</style>