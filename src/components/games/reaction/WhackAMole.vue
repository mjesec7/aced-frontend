<template>
  <div class="whack-game-wrapper">
    <!-- HUD Sidebar - Top Right -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="3"
    />

    <!-- Question Banner - Below HUD, Centered -->
    <div v-if="gameActive" class="question-banner">
      <p class="question-text">{{ currentPrompt }}</p>
    </div>

    <!-- Game Area - During active gameplay -->
    <div v-if="gameActive" class="game-area">
      <div class="game-grid">
        <div v-for="(hole, index) in holes" :key="index" class="hole-wrapper">
          
          <!-- Answer Sign - Only when mole is active -->
          <transition name="sign-pop">
            <div 
              v-if="hole.active"
              class="answer-sign"
              :class="{ 
                'answer-sign--hit': hole.state === 'hit',
                'answer-sign--wrong': hole.state === 'miss'
              }"
            >
              <span class="answer-text">{{ hole.content }}</span>
            </div>
          </transition>

          <!-- Hole Container - clips the mole -->
          <div class="hole-container">
            <!-- The Dark Hole Void (Back) -->
            <div class="hole-void"></div>

            <!-- The Mole - hidden by default, pops up when active -->
            <div
              class="mole"
              :class="{
                'mole--up': hole.active,
                'mole--hit': hole.state === 'hit',
                'mole--wrong': hole.state === 'miss'
              }"
              @mousedown.prevent="handleWhack(index)"
              @touchstart.prevent="handleWhack(index)"
            >
              <div class="mole__body">
                <div class="mole__ears">
                  <div class="mole__ear"></div>
                  <div class="mole__ear"></div>
                </div>
                <div class="mole__head">
                  <div class="mole__eyes">
                    <div class="mole__eye"><div class="mole__pupil"></div></div>
                    <div class="mole__eye"><div class="mole__pupil"></div></div>
                  </div>
                  <div class="mole__nose"></div>
                  <div class="mole__cheeks">
                    <div class="mole__cheek"></div>
                    <div class="mole__cheek"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- The Dirt Mound (Front Mask) -->
            <div class="mound-front">
              <div class="mound-front__dirt"></div>
              <div class="mound-front__grass">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>

          <!-- Hit Effect -->
          <transition name="effect-pop">
            <div v-if="hole.showEffect" class="hit-effect">
              {{ hole.state === 'hit' ? '✨' : '💥' }}
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- START SCREEN -->
    <div v-if="!gameActive && !isGameOver" class="start-screen">
      <div class="start-content">
        <div class="start-icon">🐹</div>
        <h1 class="start-title">Whack-a-Mole!</h1>
        <p class="start-description">
          Tap the moles showing the <strong>correct answers</strong> to score points.
          <br>Be quick - they won't stay up for long!
        </p>
        
        <div class="start-stats">
          <div class="start-stat">
            <span class="start-stat-icon">❤️</span>
            <span class="start-stat-value">{{ maxLives }} lives</span>
          </div>
          <div class="start-stat">
            <span class="start-stat-icon">⏱️</span>
            <span class="start-stat-value">{{ initialTime }}s</span>
          </div>
          <div class="start-stat">
            <span class="start-stat-icon">🎯</span>
            <span class="start-stat-value">{{ targetScore }} pts</span>
          </div>
        </div>

        <button class="start-button" @click="startGame">
          <span>Start Game</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
      </div>
    </div>

    <!-- COMPLETION OVERLAY -->
    <transition name="slide-up">
      <div v-if="isGameOver" class="completion-overlay">
        <div class="completion-card">
          <div class="completion-emoji">
            {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👏' : '💪' }}
          </div>
          
          <h2 class="completion-title">
            {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great Job!' : earnedStars >= 1 ? 'Good Work!' : 'Nice Try!' }}
          </h2>

          <div class="completion-score">{{ score }} points</div>

          <div class="completion-stars">
            <span v-for="n in 3" :key="n" class="star" :class="{ 'star--earned': n <= earnedStars }">★</span>
          </div>

          <div class="completion-stats">
            <div class="stat">
              <span class="stat-label">Correct</span>
              <span class="stat-value correct">{{ correctHits }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Wrong</span>
              <span class="stat-value wrong">{{ wrongHits }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Accuracy</span>
              <span class="stat-value">{{ accuracy }}%</span>
            </div>
          </div>

          <div class="completion-progress">
            <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
          </div>
          <p class="completion-hint">Continuing in {{ Math.ceil(progressWidth / 20) }}s...</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import GameHUDSidebar from '../base/GameHUDSidebar.vue';

const props = defineProps({
  gameData: { type: Object, required: true },
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 3 },
  timeRemaining: { type: Number, default: 60 }
});

const emit = defineEmits(['score-change', 'life-lost', 'game-complete', 'item-collected', 'game-started']);

// Config
const GRID_SIZE = 4;
const BASE_SPEED = 2500;
const MIN_SPEED = 1200;
const AUTO_DISMISS_DURATION = 5000;

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
const mode = computed(() => {
  return (props.gameData?.questions && props.gameData.questions.length > 0) ? 'question' : 'category';
});

const questions = computed(() => props.gameData?.questions || []);
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);

const currentPrompt = computed(() => {
  if (mode.value === 'question') {
    return currentQuestion.value?.q || currentQuestion.value?.question || "Find the correct answer!";
  }
  return props.gameData?.targetCategory || props.gameData?.prompt || "Tap the correct items!";
});

const accuracy = computed(() => {
  const total = correctHits.value + wrongHits.value;
  if (total === 0) return 0;
  return Math.round((correctHits.value / total) * 100);
});

// Initialize holes
const initHoles = () => {
  holes.value = Array.from({ length: GRID_SIZE }, () => ({
    active: false,
    content: '',
    isCorrect: false,
    state: 'idle',
    showEffect: false,
    timer: null
  }));
};

// Spawn a mole
const spawnMole = () => {
  if (!gameActive.value) return;

  const available = holes.value.map((h, i) => (!h.active ? i : null)).filter(i => i !== null);
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
      if (Array.isArray(wrong) && wrong.length > 0) {
        content = wrong[Math.floor(Math.random() * wrong.length)];
      } else {
        content = "✗";
      }
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
      isCorrect = item.isCorrect !== undefined ? item.isCorrect : item.correct !== undefined ? item.correct : true;
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

// Handle whacking a mole
const handleWhack = (index) => {
  const hole = holes.value[index];
  
  if (!hole.active || hole.state !== 'idle') return;

  clearTimeout(hole.timer);
  hole.showEffect = true;

  if (hole.isCorrect) {
    hole.state = 'hit';
    correctHits.value++;
    emit('score-change', 10);
    emit('item-collected', { isCorrect: true });

    if (mode.value === 'question') {
      setTimeout(() => nextQuestion(), 500);
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
  }, 400);
};

// Next question
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

// Calculate stars
const calculateStars = () => {
  const percentage = (props.score / targetScore.value) * 100;
  if (percentage >= 100) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 40) return 1;
  return 0;
};

// Finish game
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

// Start game
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
  }, 600);
};

// Stop game
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

// Lifecycle
onMounted(() => {
  initHoles();
});

onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
});
</script>

<style scoped>
/* ==========================================
   WRAPPER
   ========================================== */
.whack-game-wrapper {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
  font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
  user-select: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ==========================================
   QUESTION BANNER - BELOW HUD, CENTERED
   Moves down + left on narrower panels
   ========================================== */
.question-banner {
  position: absolute;
  top: 80px; /* Below the HUD with gap */
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 28px;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 90;
  max-width: 85%;
  transition: top 0.2s ease;
}

.question-text {
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  text-align: center;
  white-space: nowrap;
}

/* Responsive - move down and adjust on narrower panels */
@media (max-width: 700px) {
  .question-banner {
    top: 85px;
  }
}

@media (max-width: 550px) {
  .question-banner {
    top: 90px;
    padding: 10px 20px;
  }
  
  .question-text {
    font-size: 0.95rem;
  }
}

@media (max-width: 450px) {
  .question-banner {
    top: 95px;
    padding: 8px 16px;
    border-radius: 16px;
    max-width: 90%;
  }
  
  .question-text {
    font-size: 0.9rem;
    white-space: normal;
  }
}

@media (max-width: 380px) {
  .question-banner {
    top: 100px;
    padding: 8px 14px;
  }
  
  .question-text {
    font-size: 0.85rem;
  }
}

/* ==========================================
   GAME AREA
   ========================================== */
.game-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 140px 16px 20px;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 550px) {
  .game-area {
    padding-top: 150px;
  }
}

@media (max-width: 450px) {
  .game-area {
    padding-top: 160px;
    padding-left: 8px;
    padding-right: 8px;
  }
}

/* ==========================================
   GAME GRID
   ========================================== */
.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(6px, 1.5vw, 16px);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 400px) {
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

/* ==========================================
   HOLE WRAPPER
   ========================================== */
.hole-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

/* ==========================================
   ANSWER SIGN - FLOATS ABOVE HOLE
   ========================================== */
.answer-sign {
  position: relative;
  margin-bottom: 8px;
  background: white;
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  border: 3px solid #fbbf24;
  z-index: 30;
}

/* Speech bubble pointer */
.answer-sign::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid white;
}

.answer-sign::before {
  content: '';
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 12px solid #fbbf24;
}

.answer-sign--hit {
  border-color: #22c55e;
  background: #dcfce7;
}

.answer-sign--hit::before {
  border-top-color: #22c55e;
}

.answer-sign--wrong {
  border-color: #ef4444;
  background: #fee2e2;
  animation: signShake 0.3s ease-in-out;
}

.answer-sign--wrong::before {
  border-top-color: #ef4444;
}

@keyframes signShake {
  0%, 100% { transform: translateX(-50%) rotate(0); }
  25% { transform: translateX(-50%) rotate(-10deg); }
  75% { transform: translateX(-50%) rotate(10deg); }
}

.answer-text {
  font-size: clamp(1rem, 4vw, 1.4rem);
  font-weight: 800;
  color: #1e293b;
  white-space: nowrap;
}

/* Sign pop animation */
.sign-pop-enter-active {
  animation: signPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.sign-pop-leave-active {
  animation: signPopOut 0.15s ease-in;
}

@keyframes signPopIn {
  0% { 
    opacity: 0; 
    transform: scale(0.5) translateY(10px); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0); 
  }
}

@keyframes signPopOut {
  0% { 
    opacity: 1; 
    transform: scale(1); 
  }
  100% { 
    opacity: 0; 
    transform: scale(0.8) translateY(-10px); 
  }
}

@media (max-width: 500px) {
  .answer-sign {
    padding: 6px 12px;
    border-width: 2px;
    border-radius: 10px;
    margin-bottom: 6px;
  }
  
  .answer-text {
    font-size: clamp(0.85rem, 3.5vw, 1.1rem);
  }
}

/* ==========================================
   HOLE CONTAINER - CLIPS THE MOLE
   This is the key to hiding moles!
   ========================================== */
.hole-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 0.9;
  overflow: hidden; /* THIS HIDES THE MOLE WHEN DOWN */
}

/* ==========================================
   HOLE VOID
   ========================================== */
.hole-void {
  position: absolute;
  bottom: 25%;
  width: 80%;
  height: 22%;
  left: 10%;
  background: radial-gradient(ellipse, #3e2723 0%, #271c19 100%);
  border-radius: 50%;
  z-index: 1;
  box-shadow: inset 0 4px 8px rgba(0,0,0,0.5);
}

/* ==========================================
   MOLE - HIDDEN BELOW MOUND BY DEFAULT
   ========================================== */
.mole {
  position: absolute;
  bottom: 30%;
  left: 50%;
  width: 65%;
  transform: translateX(-50%) translateY(100%); /* Hidden below */
  z-index: 2;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.mole--up {
  transform: translateX(-50%) translateY(0); /* Pop up */
}

.mole--hit {
  transform: translateX(-50%) translateY(0) scale(0.9);
  filter: brightness(1.2);
}

.mole--wrong {
  animation: moleShake 0.3s ease-in-out;
}

@keyframes moleShake {
  0%, 100% { transform: translateX(-50%) translateY(0) rotate(0); }
  25% { transform: translateX(-50%) translateY(0) rotate(-15deg); }
  75% { transform: translateX(-50%) translateY(0) rotate(15deg); }
}

.mole__body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Ears */
.mole__ears {
  position: absolute;
  top: 5%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 5%;
  z-index: 1;
}

.mole__ear {
  width: 32%;
  aspect-ratio: 1;
  background: linear-gradient(145deg, #d4a574, #b8956e);
  border-radius: 50%;
  position: relative;
}

.mole__ear::after {
  content: '';
  position: absolute;
  top: 25%;
  left: 25%;
  width: 50%;
  height: 50%;
  background: #ffb5b5;
  border-radius: 50%;
}

/* Head */
.mole__head {
  width: 100%;
  aspect-ratio: 1 / 0.85;
  background: linear-gradient(180deg, #d4a574 0%, #b08060 100%);
  border-radius: 48% 48% 42% 42%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 25%;
  box-shadow: 
    inset 0 6px 12px rgba(255,255,255,0.2),
    inset 0 -6px 12px rgba(0,0,0,0.15),
    0 4px 10px rgba(0,0,0,0.2);
  z-index: 2;
}

/* Eyes */
.mole__eyes {
  display: flex;
  gap: 30%;
  margin-bottom: 10%;
}

.mole__eye {
  width: clamp(6px, 18%, 18px);
  aspect-ratio: 1;
  background: white;
  border-radius: 50%;
  position: relative;
  box-shadow: inset 0 2px 3px rgba(0,0,0,0.1);
}

.mole__pupil {
  position: absolute;
  top: 20%;
  left: 20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle at 35% 35%, #4a3728, #1a1210);
  border-radius: 50%;
}

/* Nose */
.mole__nose {
  width: clamp(8px, 24%, 22px);
  aspect-ratio: 1.3;
  background: linear-gradient(180deg, #5a4030, #3a2820);
  border-radius: 50%;
}

/* Cheeks */
.mole__cheeks {
  position: absolute;
  top: 55%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 8%;
}

.mole__cheek {
  width: 22%;
  aspect-ratio: 1.2;
  background: radial-gradient(ellipse, rgba(255,150,150,0.5), transparent 70%);
  border-radius: 50%;
}

/* ==========================================
   DIRT MOUND - SITS IN FRONT
   ========================================== */
.mound-front {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 38%;
  z-index: 10;
  pointer-events: none;
}

.mound-front__dirt {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #8d6e63 0%, #5d4037 100%);
  border-radius: 50% 50% 8px 8px;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}

.mound-front__grass {
  position: absolute;
  top: -4px;
  left: 10%;
  width: 80%;
  display: flex;
  justify-content: space-around;
}

.mound-front__grass span {
  width: 10%;
  height: 8px;
  background: #4ade80;
  border-radius: 50% 50% 0 0;
}

.mound-front__grass span:nth-child(odd) { 
  height: 12px; 
  transform: rotate(-8deg); 
}

.mound-front__grass span:nth-child(even) { 
  height: 6px; 
  transform: rotate(8deg); 
}

/* ==========================================
   HIT EFFECT
   ========================================== */
.hit-effect {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(1.5rem, 6vw, 3rem);
  z-index: 35;
  pointer-events: none;
}

.effect-pop-enter-active {
  animation: effectPop 0.4s ease-out;
}

.effect-pop-leave-active {
  animation: effectFade 0.2s ease-in;
}

@keyframes effectPop {
  0% { 
    transform: translateX(-50%) scale(0.3); 
    opacity: 0; 
  }
  50% { 
    transform: translateX(-50%) scale(1.3); 
    opacity: 1; 
  }
  100% { 
    transform: translateX(-50%) scale(1) translateY(-20px); 
    opacity: 0.8; 
  }
}

@keyframes effectFade {
  to { 
    opacity: 0; 
    transform: translateX(-50%) translateY(-30px); 
  }
}

/* ==========================================
   START SCREEN
   ========================================== */
.start-screen {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #86efac 0%, #22c55e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.start-content {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.start-icon {
  font-size: clamp(4rem, 12vw, 7rem);
  margin-bottom: 16px;
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.start-title {
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: 800;
  color: white;
  margin: 0 0 12px;
  text-shadow: 0 3px 8px rgba(0,0,0,0.2);
}

.start-description {
  font-size: clamp(0.95rem, 2.5vw, 1.1rem);
  color: rgba(255,255,255,0.9);
  margin: 0 0 24px;
  line-height: 1.5;
}

.start-description strong {
  color: white;
}

.start-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.start-stat {
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  padding: 10px 18px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.start-stat-icon {
  font-size: 1.2rem;
}

.start-stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: white;
}

.start-button {
  background: white;
  color: #16a34a;
  border: none;
  padding: 16px 40px;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  box-shadow: 0 6px 24px rgba(0,0,0,0.2);
}

.start-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 32px rgba(0,0,0,0.25);
}

.start-button:active {
  transform: translateY(-1px);
}

.start-button svg {
  width: 22px;
  height: 22px;
}

/* ==========================================
   COMPLETION OVERLAY
   ========================================== */
.completion-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
}

.completion-card {
  background: white;
  border-radius: 24px;
  padding: clamp(20px, 4vw, 36px);
  text-align: center;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: cardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardIn {
  from { transform: scale(0.8) translateY(30px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.completion-emoji {
  font-size: clamp(3.5rem, 10vw, 5rem);
  margin-bottom: 8px;
}

.completion-title {
  font-size: clamp(1.4rem, 4vw, 1.8rem);
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 6px;
}

.completion-score {
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  font-weight: 800;
  color: #22c55e;
  margin-bottom: 14px;
}

.completion-stars {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 18px;
}

.star {
  font-size: clamp(1.8rem, 5vw, 2.2rem);
  color: #e2e8f0;
  transition: all 0.3s;
}

.star--earned {
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(251, 191, 36, 0.5);
  animation: starPop 0.4s ease-out;
}

@keyframes starPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.completion-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 14px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-value.correct {
  color: #22c55e;
}

.stat-value.wrong {
  color: #ef4444;
}

.completion-progress {
  height: 5px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 3px;
  transition: width 0.05s linear;
}

.completion-hint {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}

/* Slide up animation */
.slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-leave-active {
  transition: all 0.3s ease-in;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(50px);
}
</style>