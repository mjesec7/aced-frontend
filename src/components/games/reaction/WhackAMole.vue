<template>
  <div class="whack-game-container">
    <!-- Right Sidebar HUD -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="3"
    />

    <!-- Question Banner -->
    <div v-if="gameActive" class="question-banner">
      <p class="question-text">{{ currentPrompt }}</p>
    </div>

    <!-- Game Area -->
    <div class="game-area">
      <div class="game-grid">
        <div v-for="(hole, index) in holes" :key="index" class="hole-wrapper">
          <!-- Back of the mound -->
          <div class="mound-back"></div>

          <!-- The Mole -->
          <div
            class="mole-character"
            :class="{
              'visible': hole.active,
              'hit': hole.state === 'hit',
              'miss': hole.state === 'miss'
            }"
            @mousedown.prevent="handleWhack(index)"
            @touchstart.prevent="handleWhack(index)"
          >
            <div class="mole-body">
              <div class="mole-face">
                <div class="eyes">
                  <span class="eye left"></span>
                  <span class="eye right"></span>
                </div>
                <div class="snout"></div>
                <div class="content-sign">
                  {{ hole.content }}
                </div>
              </div>
            </div>
          </div>

          <!-- Front of the mound -->
          <div class="mound-front">
            <div class="grass-tuft"></div>
          </div>

          <!-- Effects -->
          <transition name="pop">
            <div v-if="hole.showEffect" class="hit-spark">
              {{ hole.state === 'hit' ? '✨' : '❌' }}
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Start Game Modal -->
    <transition name="fade">
      <div v-if="!gameActive && !isGameOver" class="modal-overlay" @click.self="startGame">
        <div class="small-modal">
          <div class="modal-icon">🔨</div>
          <h3 class="modal-title">Ready to Whack?</h3>
          <p class="modal-desc">Hit the correct answers!</p>
          <button class="modal-btn" @click="startGame">Start</button>
        </div>
      </div>
    </transition>

    <!-- Game Over Toast - Auto dismisses -->
    <transition name="slide-up">
      <div v-if="isGameOver && showCompletionToast" class="completion-toast">
        <div class="toast-content">
          <div class="toast-icon">{{ score >= 100 ? '🎉' : score >= 50 ? '👍' : '💪' }}</div>
          <div class="toast-info">
            <div class="toast-title">{{ score >= 100 ? 'Perfect!' : score >= 50 ? 'Good job!' : 'Nice try!' }}</div>
            <div class="toast-score">{{ score }} points</div>
          </div>
          <div class="toast-stars">
            <span v-for="n in 3" :key="n" :class="n <= earnedStars ? 'star-filled' : 'star-empty'">★</span>
          </div>
        </div>
        <div class="toast-progress">
          <div class="toast-progress-bar" :style="{ width: progressWidth + '%' }"></div>
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

// State
const holes = ref([]);
const gameActive = ref(false);
const gameInterval = ref(null);
const currentQuestionIndex = ref(0);
const isGameOver = ref(false);
const earnedStars = ref(0);
const showCompletionToast = ref(false);
const progressWidth = ref(100);
const autoDismissTimer = ref(null);
const progressTimer = ref(null);
const AUTO_DISMISS_DURATION = 5000;

// --- Computed Logic ---

const mode = computed(() => {
  return (props.gameData.questions && props.gameData.questions.length > 0) ? 'question' : 'category';
});

const questions = computed(() => props.gameData.questions || []);
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);

const currentPrompt = computed(() => {
  if (mode.value === 'question') {
    return currentQuestion.value?.q || "Get Ready!";
  }
  return props.gameData.targetCategory || "Hit the correct items!";
});

const instructions = computed(() => {
  return props.gameData.instructions || (mode.value === 'question' ? "Hit the answer!" : "Whack the correct items!");
});

// --- Game Loop ---

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
    isCorrect = Math.random() > 0.5;
    
    if (isCorrect) {
      content = q.a || q.correctAnswer || "OK";
    } else {
      const wrong = q.wrong || ["0", "1", "2"];
      if (Array.isArray(wrong) && wrong.length > 0) {
        content = wrong[Math.floor(Math.random() * wrong.length)];
      } else {
        content = "X";
      }
    }
  } else {
    const items = props.gameData.items || [];
    if (items.length === 0) return; 

    const randomIndex = Math.floor(Math.random() * items.length);
    const item = items[randomIndex];
    
    if (typeof item === 'string') {
      content = item;
      isCorrect = true; 
    } else {
      content = item.text || item.word || "??";
      isCorrect = item.isCorrect !== undefined ? item.isCorrect : true;
    }
  }

  hole.content = content;
  hole.isCorrect = isCorrect;
  hole.active = true;
  hole.state = 'idle';

  const speed = Math.max(MIN_SPEED, BASE_SPEED - (props.score * 10));
  
  hole.timer = setTimeout(() => {
    if (hole.active && hole.state === 'idle') {
      hole.active = false;
    }
  }, speed);
};

const handleWhack = (index) => {
  const hole = holes.value[index];
  
  if (!hole.active || hole.state !== 'idle') return;

  clearTimeout(hole.timer);
  hole.showEffect = true;

  if (hole.isCorrect) {
    hole.state = 'hit';
    emit('score-change', 10);
    emit('item-collected', { isCorrect: true });

    if (mode.value === 'question') {
      setTimeout(() => nextQuestion(), 600);
    }
  } else {
    hole.state = 'miss';
    emit('score-change', -5);
    emit('life-lost');
    emit('item-collected', { isCorrect: false });
  }

  setTimeout(() => {
    hole.active = false;
    hole.showEffect = false;
    hole.state = 'idle';
  }, 500);
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    holes.value.forEach(h => { h.active = false; clearTimeout(h.timer); });
  } else {
    finishGame();
  }
};

const finishGame = () => {
  stopGame();
  isGameOver.value = true;
  showCompletionToast.value = true;
  progressWidth.value = 100;

  const percentage = (props.score / 100) * 100;
  if (percentage >= 100) earnedStars.value = 3;
  else if (percentage >= 70) earnedStars.value = 2;
  else if (percentage >= 50) earnedStars.value = 1;
  else earnedStars.value = 0;

  const startTime = Date.now();
  progressTimer.value = setInterval(() => {
    const elapsed = Date.now() - startTime;
    progressWidth.value = Math.max(0, 100 - (elapsed / AUTO_DISMISS_DURATION) * 100);
  }, 50);

  autoDismissTimer.value = setTimeout(() => {
    clearInterval(progressTimer.value);
    showCompletionToast.value = false;
    emit('game-complete', { score: props.score, completed: props.score >= 50 });
  }, AUTO_DISMISS_DURATION);
};

const continueLesson = () => {
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
  showCompletionToast.value = false;
  emit('game-complete', { score: props.score, completed: props.score >= 50 });
};

// --- Lifecycle ---

const startGame = () => {
  isGameOver.value = false;
  gameActive.value = true;
  initHoles();
  
  emit('game-started');
  
  setTimeout(() => {
    gameInterval.value = setInterval(spawnMole, 1000);
  }, 500);
};

const stopGame = () => {
  gameActive.value = false;
  if (gameInterval.value) clearInterval(gameInterval.value);
  holes.value.forEach(h => clearTimeout(h.timer));
};

watch(() => props.score, (val) => { if(val >= 100) finishGame(); });
watch(() => props.lives, (val) => { if(val <= 0) finishGame(); });
watch(() => props.timeRemaining, (val) => { if(val <= 0) finishGame(); });

onMounted(initHoles);
onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');

.whack-game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 450px;
  /* FIXED: Solid green background - no gradient that could show blue */
  background: #22c55e;
  overflow: hidden;
  border-radius: 16px;
  user-select: none;
  font-family: 'Fredoka', sans-serif;
  display: flex;
  flex-direction: column;
}

/* Question Banner */
.question-banner {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 240, 255, 0.98));
  backdrop-filter: blur(12px);
  padding: 16px 28px;
  margin: 16px auto 0;
  border-radius: 20px;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(59, 130, 246, 0.2);
  z-index: 50;
  border: 2px solid rgba(59, 130, 246, 0.3);
  flex-shrink: 0;
}

.question-text {
  font-size: 1.75rem;
  font-weight: 900;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

/* Game Area - fills remaining space */
.game-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 0;
  /* Gradient from lighter to darker green - NO BLUE */
  background: linear-gradient(180deg, #4ade80 0%, #22c55e 60%, #16a34a 100%);
}

/* GRID */
.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: 700px;
  width: 100%;
}

.hole-wrapper {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  cursor: pointer;
  overflow: hidden;
  border-radius: 0 0 20px 20px;
}

/* DIRT MOUNDS */
.mound-back {
  position: absolute;
  bottom: 12%;
  width: 85%;
  height: 35%;
  background: linear-gradient(to bottom, #5d4037, #3e2723);
  border-radius: 50% 50% 0 0;
  z-index: 1;
  box-shadow: inset 0 5px 10px rgba(0,0,0,0.3);
}

.mound-front {
  position: absolute;
  bottom: 0;
  width: 95%;
  height: 25%;
  background: linear-gradient(to bottom, #795548, #5d4037);
  border-radius: 50% 50% 15px 15px;
  z-index: 10;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.grass-tuft {
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 10px;
  background-image: radial-gradient(circle at 5px 0, #22c55e 5px, transparent 6px);
  background-size: 15px 10px;
  background-repeat: repeat-x;
}

/* MOLE CHARACTER */
.mole-character {
  position: absolute;
  bottom: 15%;
  width: 75%;
  height: 85%;
  z-index: 5;
  transform: translateY(110%);
  transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform;
}

.mole-character.visible { transform: translateY(0); }
.mole-character.hit { transform: scale(0.95) translateY(15px); filter: brightness(1.1); }
.mole-character.miss { filter: hue-rotate(320deg) saturate(1.5); }

.mole-body {
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, #a1887f, #8d6e63);
  border-radius: 45% 45% 0 0;
  border: 4px solid #5d4037;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset -10px 0 20px rgba(0,0,0,0.15);
  position: relative;
}

.mole-face { 
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -20px;
}

.eyes { 
  display: flex; 
  gap: 12px; 
  margin-bottom: 8px; 
}

.eye {
  width: 12px;
  height: 12px;
  background: #3e2723;
  border-radius: 50%;
  position: relative;
}

.eye::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
}

.snout {
  width: 24px;
  height: 16px;
  background: #ffccbc;
  border-radius: 12px;
  margin-bottom: 10px;
  border: 2px solid #d7ccc8;
}

.content-sign {
  background: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1.1rem;
  color: #333;
  border: 3px solid #d7ccc8;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  min-width: 60px;
  text-align: center;
  transform: rotate(-2deg);
}

/* EFFECTS */
.hit-spark {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 4rem;
  z-index: 20;
  animation: popOut 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  pointer-events: none;
}

/* SMALL MODAL */
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.small-modal {
  background: white;
  padding: 28px 32px;
  border-radius: 24px;
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
  font-size: 4rem;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 10px;
}

.modal-score {
  font-size: 1.2rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 16px;
}

.modal-stars {
  font-size: 2rem;
  margin-bottom: 16px;
  letter-spacing: 4px;
}

.modal-btn {
  width: 100%;
  padding: 14px 28px;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
}

.modal-btn:not(.secondary) {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.modal-btn:not(.secondary):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}

.modal-btn.secondary {
  background: #f1f5f9;
  color: #475569;
}

.modal-btn.secondary:hover {
  background: #e2e8f0;
}

.modal-desc {
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 20px;
}

/* Completion Toast */
.completion-toast {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 20px;
  padding: 18px 24px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  z-index: 200;
  min-width: 300px;
  max-width: 90%;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.toast-icon {
  font-size: 2.8rem;
  flex-shrink: 0;
}

.toast-info {
  flex: 1;
}

.toast-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.toast-score {
  font-size: 0.9rem;
  color: #64748b;
}

.toast-stars {
  display: flex;
  gap: 4px;
  font-size: 1.6rem;
}

.star-filled {
  color: #fbbf24;
}

.star-empty {
  color: #e2e8f0;
}

.toast-progress {
  height: 5px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.toast-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  transition: width 0.05s linear;
}

/* Slide up animation */
.slide-up-enter-active {
  transition: all 0.3s ease-out;
}

.slide-up-leave-active {
  transition: all 0.2s ease-in;
}

.slide-up-enter-from {
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
}

/* ANIMATIONS */
@keyframes popOut { 
  0% { transform: translateX(-50%) scale(0.5); opacity: 0; } 
  50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
  100% { transform: translateX(-50%) scale(1); opacity: 0; } 
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.pop-enter-active, .pop-leave-active { transition: opacity 0.3s; }
.pop-enter-from, .pop-leave-to { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .whack-game-container {
    min-height: 400px;
  }
  
  .question-banner {
    padding: 12px 20px;
    margin: 12px auto 0;
  }
  
  .question-text { 
    font-size: 1.4rem; 
  }
  
  .game-area {
    padding: 12px;
  }
  
  .game-grid {
    gap: 10px;
  }
  
  .content-sign {
    font-size: 0.9rem;
    padding: 4px 8px;
  }
  
  .small-modal {
    padding: 24px;
  }
  
  .modal-icon { 
    font-size: 3.5rem; 
  }
  
  .modal-title { 
    font-size: 1.4rem; 
  }
}

@media (max-width: 480px) {
  .game-grid {
    gap: 8px;
  }
  
  .question-text {
    font-size: 1.2rem;
  }
}
</style>