<template>
  <div class="whack-game-wrapper">
    <!-- HUD Sidebar - Only during active gameplay -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="3"
    />

    <!-- Question Banner - During active gameplay -->
    <div v-if="gameActive" class="question-banner">
      <p class="question-text">{{ currentPrompt }}</p>
    </div>

    <!-- Game Area - During active gameplay -->
    <div v-if="gameActive" class="game-area">
      <div class="game-grid">
        <div v-for="(hole, index) in holes" :key="index" class="hole-wrapper">
          <div class="hole-shadow"></div>

          <!-- Cute Mole -->
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
                <div class="mole__mouth"></div>
              </div>
              <div class="mole__sign">
                <span class="mole__answer">{{ hole.content }}</span>
              </div>
            </div>
          </div>

          <!-- Dirt Mound -->
          <div class="mound">
            <div class="mound__dirt"></div>
            <div class="mound__grass">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>

          <!-- Hit Effect -->
          <div v-if="hole.showEffect" class="hit-effect">
            {{ hole.state === 'hit' ? '✨' : '💥' }}
          </div>
        </div>
      </div>
    </div>

    <!-- START SCREEN - Full screen, not a small modal -->
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

    <!-- COMPLETION TOAST - Shows for 5 seconds then auto-emits complete -->
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
    
    isCorrect = Math.random() > 0.4; // 60% chance of correct answer
    
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

  // Speed increases as score goes up
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
    // Clear all active moles for new question
    holes.value.forEach(h => { 
      h.active = false; 
      clearTimeout(h.timer); 
    });
  } else {
    finishGame();
  }
};

// Calculate stars based on score
const calculateStars = () => {
  const percentage = (props.score / targetScore.value) * 100;
  if (percentage >= 100) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 40) return 1;
  return 0;
};

// Finish game - show completion for 5 seconds
const finishGame = () => {
  stopGame();
  isGameOver.value = true;
  earnedStars.value = calculateStars();
  progressWidth.value = 100;

  // Animate progress bar countdown
  const startTime = Date.now();
  progressTimer.value = setInterval(() => {
    const elapsed = Date.now() - startTime;
    progressWidth.value = Math.max(0, 100 - (elapsed / AUTO_DISMISS_DURATION) * 100);
  }, 50);

  // Auto-dismiss and emit complete after 5 seconds
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
  
  // Start spawning moles after a brief delay
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

// Watch for game-ending conditions
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
   WRAPPER - FILLS ENTIRE CONTAINER
   ========================================== */
.whack-game-wrapper {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #86efac 0%, #4ade80 40%, #22c55e 100%);
  font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
  user-select: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ==========================================
   QUESTION BANNER
   ========================================== */
.question-banner {
  flex-shrink: 0;
  background: white;
  margin: 12px auto 8px;
  padding: 10px 24px;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: min(90%, 500px);
  text-align: center;
  z-index: 10;
}

.question-text {
  font-size: clamp(0.95rem, 2.5vw, 1.4rem);
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* ==========================================
   GAME AREA
   ========================================== */
.game-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  min-height: 0;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(12px, 3vw, 28px);
  width: 100%;
  max-width: 700px;
  padding: 0 8px;
}

/* ==========================================
   HOLE & MOLE
   ========================================== */
.hole-wrapper {
  position: relative;
  aspect-ratio: 1 / 1.15;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  cursor: pointer;
}

.hole-shadow {
  position: absolute;
  bottom: 18%;
  width: 90%;
  height: 18%;
  background: radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%);
  border-radius: 50%;
}

/* Mole */
.mole {
  position: absolute;
  bottom: 24%;
  width: 80%;
  z-index: 5;
  transform: translateY(110%);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mole--up {
  transform: translateY(0);
}

.mole--hit {
  transform: translateY(0) scale(0.9);
  filter: brightness(1.2);
}

.mole--wrong {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(0) rotate(-12deg); }
  75% { transform: translateY(0) rotate(12deg); }
}

.mole__body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Ears */
.mole__ears {
  position: absolute;
  top: 8%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 10%;
  z-index: 1;
}

.mole__ear {
  width: 28%;
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
  padding-top: 20%;
  box-shadow: 
    inset 0 8px 15px rgba(255,255,255,0.2),
    inset 0 -8px 15px rgba(0,0,0,0.15),
    0 6px 12px rgba(0,0,0,0.2);
  z-index: 2;
}

/* Eyes */
.mole__eyes {
  display: flex;
  gap: 24%;
  margin-bottom: 8%;
}

.mole__eye {
  width: clamp(10px, 20%, 24px);
  aspect-ratio: 1;
  background: white;
  border-radius: 50%;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.mole__pupil {
  position: absolute;
  top: 22%;
  left: 22%;
  width: 56%;
  height: 56%;
  background: radial-gradient(circle at 35% 35%, #4a3728, #1a1210);
  border-radius: 50%;
}

/* Nose */
.mole__nose {
  width: clamp(12px, 26%, 28px);
  aspect-ratio: 1.4;
  background: linear-gradient(180deg, #5a4030, #3a2820);
  border-radius: 50%;
  margin-bottom: 5%;
}

/* Cheeks */
.mole__cheeks {
  position: absolute;
  top: 50%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 12%;
}

.mole__cheek {
  width: 18%;
  aspect-ratio: 1.3;
  background: radial-gradient(ellipse, rgba(255,150,150,0.6), transparent 70%);
  border-radius: 50%;
}

/* Mouth */
.mole__mouth {
  width: 18%;
  height: 5%;
  border-bottom: 2px solid #5d4037;
  border-radius: 0 0 50% 50%;
}

/* Answer Sign */
.mole__sign {
  background: white;
  padding: clamp(4px, 1vw, 10px) clamp(8px, 2vw, 16px);
  border-radius: 10px;
  margin-top: -2%;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  border: 2px solid #e8ddd0;
  z-index: 3;
}

.mole__answer {
  font-size: clamp(0.75rem, 2.5vw, 1.15rem);
  font-weight: 800;
  color: #2d1f1a;
}

/* Dirt Mound */
.mound {
  width: 100%;
  position: relative;
  z-index: 10;
}

.mound__dirt {
  width: 100%;
  height: clamp(18px, 5vw, 32px);
  background: linear-gradient(180deg, #a67c52 0%, #704d2a 60%, #5d4037 100%);
  border-radius: 50% 50% 15% 15%;
  box-shadow: inset 0 5px 10px rgba(255,255,255,0.15), 0 3px 8px rgba(0,0,0,0.25);
}

.mound__grass {
  position: absolute;
  top: -4px;
  left: 5%;
  width: 90%;
  display: flex;
  justify-content: space-around;
}

.mound__grass span {
  width: 10%;
  height: clamp(6px, 1.5vw, 12px);
  background: linear-gradient(180deg, #4ade80, #22c55e);
  border-radius: 50% 50% 0 0;
}

.mound__grass span:nth-child(1) { transform: rotate(-20deg); }
.mound__grass span:nth-child(3) { height: 140%; }
.mound__grass span:nth-child(5) { transform: rotate(20deg); }

/* Hit Effect */
.hit-effect {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(2rem, 6vw, 4rem);
  z-index: 20;
  pointer-events: none;
  animation: pop 0.4s ease-out forwards;
}

@keyframes pop {
  0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
  50% { transform: translateX(-50%) scale(1.3); opacity: 1; }
  100% { transform: translateX(-50%) scale(1) translateY(-20px); opacity: 0; }
}

/* ==========================================
   START SCREEN - FULL SIZE
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
  font-size: clamp(5rem, 15vw, 8rem);
  margin-bottom: 16px;
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.start-title {
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 800;
  color: white;
  margin: 0 0 12px;
  text-shadow: 0 3px 10px rgba(0,0,0,0.2);
}

.start-description {
  font-size: clamp(1rem, 3vw, 1.2rem);
  color: rgba(255,255,255,0.9);
  margin: 0 0 28px;
  line-height: 1.5;
}

.start-description strong {
  color: white;
}

.start-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.start-stat {
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.start-stat-icon {
  font-size: 1.3rem;
}

.start-stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.start-button {
  background: white;
  color: #16a34a;
  border: none;
  padding: 18px 48px;
  border-radius: 50px;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}

.start-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
}

.start-button:active {
  transform: translateY(-1px);
}

.start-button svg {
  width: 24px;
  height: 24px;
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
  padding: 24px;
  z-index: 100;
}

.completion-card {
  background: white;
  border-radius: 28px;
  padding: clamp(24px, 5vw, 40px);
  text-align: center;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 25px 80px rgba(0,0,0,0.3);
  animation: cardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardIn {
  from { transform: scale(0.8) translateY(30px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.completion-emoji {
  font-size: clamp(4rem, 12vw, 6rem);
  margin-bottom: 8px;
}

.completion-title {
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px;
}

.completion-score {
  font-size: clamp(1.8rem, 6vw, 2.5rem);
  font-weight: 800;
  color: #22c55e;
  margin-bottom: 16px;
}

.completion-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.star {
  font-size: clamp(2rem, 6vw, 2.5rem);
  color: #e2e8f0;
  transition: all 0.3s;
}

.star--earned {
  color: #fbbf24;
  text-shadow: 0 2px 10px rgba(251, 191, 36, 0.5);
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
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 16px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.25rem;
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
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 3px;
  transition: width 0.05s linear;
}

.completion-hint {
  font-size: 0.85rem;
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

/* ==========================================
   RESPONSIVE
   ========================================== */
@media (max-width: 500px) {
  .question-banner {
    margin: 8px auto 6px;
    padding: 8px 16px;
  }
  
  .game-grid {
    gap: 8px;
  }
  
  .start-stats {
    gap: 12px;
  }
  
  .start-stat {
    padding: 10px 14px;
  }
  
  .completion-stats {
    gap: 16px;
    padding: 12px;
  }
}

@media (max-height: 500px) {
  .question-banner {
    margin: 6px auto 4px;
    padding: 6px 14px;
  }
  
  .game-area {
    padding: 8px;
  }
  
  .start-icon {
    font-size: 4rem;
    margin-bottom: 8px;
  }
  
  .start-title {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }
  
  .start-description {
    margin-bottom: 16px;
    font-size: 0.9rem;
  }
  
  .start-stats {
    margin-bottom: 16px;
  }
  
  .completion-card {
    padding: 20px;
  }
  
  .completion-emoji {
    font-size: 3rem;
  }
}
</style>