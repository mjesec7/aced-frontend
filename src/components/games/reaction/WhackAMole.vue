<template>
  <div class="whack-game-container">
    <!-- HUD Sidebar -->
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
          <!-- Hole Shadow -->
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
              <!-- Ears -->
              <div class="mole__ears">
                <div class="mole__ear mole__ear--left"></div>
                <div class="mole__ear mole__ear--right"></div>
              </div>
              
              <!-- Head -->
              <div class="mole__head">
                <!-- Eyes -->
                <div class="mole__eyes">
                  <div class="mole__eye">
                    <div class="mole__pupil"></div>
                    <div class="mole__eye-shine"></div>
                  </div>
                  <div class="mole__eye">
                    <div class="mole__pupil"></div>
                    <div class="mole__eye-shine"></div>
                  </div>
                </div>
                
                <!-- Nose -->
                <div class="mole__nose">
                  <div class="mole__nose-shine"></div>
                </div>
                
                <!-- Cheeks -->
                <div class="mole__cheeks">
                  <div class="mole__cheek"></div>
                  <div class="mole__cheek"></div>
                </div>
                
                <!-- Mouth -->
                <div class="mole__mouth"></div>
              </div>
              
              <!-- Answer Sign -->
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

          <!-- Hit Effects -->
          <transition name="pop">
            <div v-if="hole.showEffect" class="effect">
              {{ hole.state === 'hit' ? '✨' : '💥' }}
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Start Modal -->
    <transition name="fade">
      <div v-if="!gameActive && !isGameOver" class="modal-overlay">
        <div class="start-modal">
          <div class="start-modal__emoji">🐹</div>
          <h3 class="start-modal__title">Whack-a-Mole!</h3>
          <p class="start-modal__desc">Tap the moles with correct answers</p>
          <button class="start-modal__btn" @click="startGame">
            <span>Start Game</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- Completion Toast -->
    <transition name="toast">
      <div v-if="isGameOver && showCompletionToast" class="toast">
        <div class="toast__content">
          <div class="toast__emoji">{{ score >= 100 ? '🎉' : score >= 50 ? '👏' : '💪' }}</div>
          <div class="toast__info">
            <div class="toast__title">{{ score >= 100 ? 'Perfect!' : score >= 50 ? 'Great job!' : 'Nice try!' }}</div>
            <div class="toast__score">{{ score }} points</div>
          </div>
          <div class="toast__stars">
            <span v-for="n in 3" :key="n" class="toast__star" :class="{ 'toast__star--filled': n <= earnedStars }">★</span>
          </div>
        </div>
        <div class="toast__progress">
          <div class="toast__bar" :style="{ width: progressWidth + '%' }"></div>
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

// Computed
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

// Methods
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

// Watchers
watch(() => props.score, (val) => { if(val >= 100) finishGame(); });
watch(() => props.lives, (val) => { if(val <= 0) finishGame(); });
watch(() => props.timeRemaining, (val) => { if(val <= 0) finishGame(); });

// Lifecycle
onMounted(initHoles);
onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
});
</script>

<style scoped>
.whack-game-container {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #86efac 0%, #4ade80 50%, #22c55e 100%);
  overflow: hidden;
  font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
  user-select: none;
  display: flex;
  flex-direction: column;
}

/* Question Banner */
.question-banner {
  flex-shrink: 0;
  background: white;
  margin: 12px auto;
  padding: 12px 24px;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-width: min(500px, calc(100% - 120px));
  text-align: center;
}

.question-text {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Game Area */
.game-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  min-height: 0;
  overflow: hidden;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(10px, 3vw, 24px);
  width: 100%;
  max-width: 650px;
}

/* Hole */
.hole-wrapper {
  position: relative;
  aspect-ratio: 1 / 1.1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  cursor: pointer;
}

.hole-shadow {
  position: absolute;
  bottom: 15%;
  width: 85%;
  height: 15%;
  background: radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%);
  border-radius: 50%;
}

/* Cute Mole */
.mole {
  position: absolute;
  bottom: 22%;
  width: 75%;
  z-index: 5;
  transform: translateY(105%);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mole--up {
  transform: translateY(0);
}

.mole--hit {
  transform: translateY(0) scale(0.92);
  filter: brightness(1.15) saturate(1.1);
}

.mole--wrong {
  animation: moleShake 0.35s ease-in-out;
}

@keyframes moleShake {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  20% { transform: translateY(0) rotate(-10deg); }
  40% { transform: translateY(0) rotate(10deg); }
  60% { transform: translateY(0) rotate(-6deg); }
  80% { transform: translateY(0) rotate(6deg); }
}

.mole__body {
  position: relative;
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
  padding: 0 8%;
  z-index: 1;
}

.mole__ear {
  width: 30%;
  aspect-ratio: 1;
  background: linear-gradient(145deg, #d4a574 0%, #b8956e 100%);
  border-radius: 50%;
  position: relative;
  box-shadow: inset -2px -2px 5px rgba(0,0,0,0.1);
}

.mole__ear::after {
  content: '';
  position: absolute;
  top: 25%;
  left: 25%;
  width: 50%;
  height: 50%;
  background: linear-gradient(145deg, #ffb5b5 0%, #f5a0a0 100%);
  border-radius: 50%;
}

/* Head */
.mole__head {
  width: 100%;
  aspect-ratio: 1 / 0.85;
  background: linear-gradient(180deg, #d4a574 0%, #c4956a 40%, #b08060 100%);
  border-radius: 48% 48% 42% 42%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 18%;
  box-shadow: 
    inset 0 8px 15px rgba(255,255,255,0.2),
    inset 0 -8px 15px rgba(0,0,0,0.15),
    0 6px 12px rgba(0,0,0,0.2);
  z-index: 2;
}

/* Eyes */
.mole__eyes {
  display: flex;
  gap: 22%;
  margin-bottom: 6%;
}

.mole__eye {
  width: clamp(14px, 22%, 26px);
  aspect-ratio: 1;
  background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
  border-radius: 50%;
  position: relative;
  box-shadow: 
    inset 0 2px 4px rgba(0,0,0,0.1),
    0 1px 2px rgba(0,0,0,0.1);
}

.mole__pupil {
  position: absolute;
  top: 22%;
  left: 22%;
  width: 56%;
  height: 56%;
  background: radial-gradient(circle at 35% 35%, #4a3728 0%, #1a1210 100%);
  border-radius: 50%;
}

.mole__eye-shine {
  position: absolute;
  top: 18%;
  right: 22%;
  width: 28%;
  height: 28%;
  background: white;
  border-radius: 50%;
}

/* Nose */
.mole__nose {
  width: clamp(16px, 28%, 32px);
  aspect-ratio: 1.4;
  background: linear-gradient(180deg, #5a4030 0%, #3a2820 100%);
  border-radius: 50%;
  position: relative;
  margin-bottom: 4%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.mole__nose-shine {
  position: absolute;
  top: 18%;
  left: 22%;
  width: 25%;
  height: 25%;
  background: rgba(255,255,255,0.5);
  border-radius: 50%;
}

/* Cheeks */
.mole__cheeks {
  position: absolute;
  top: 48%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 10%;
}

.mole__cheek {
  width: 20%;
  aspect-ratio: 1.4;
  background: radial-gradient(ellipse, #ffb5b5 0%, transparent 70%);
  border-radius: 50%;
}

/* Mouth */
.mole__mouth {
  width: 20%;
  height: 6%;
  position: relative;
}

.mole__mouth::after {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  width: 80%;
  height: 100%;
  border-bottom: 3px solid #5d4037;
  border-radius: 0 0 50% 50%;
}

/* Sign */
.mole__sign {
  background: linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%);
  padding: clamp(5px, 1.2vw, 10px) clamp(10px, 2.5vw, 18px);
  border-radius: 12px;
  margin-top: -3%;
  box-shadow: 
    0 4px 12px rgba(0,0,0,0.15),
    inset 0 1px 0 rgba(255,255,255,0.8);
  border: 2px solid #e8ddd0;
  z-index: 3;
}

.mole__answer {
  font-size: clamp(0.85rem, 2.8vw, 1.25rem);
  font-weight: 800;
  color: #2d1f1a;
  display: block;
  text-align: center;
}

/* Mound */
.mound {
  width: 100%;
  position: relative;
  z-index: 10;
}

.mound__dirt {
  width: 100%;
  height: clamp(22px, 6vw, 38px);
  background: linear-gradient(180deg, 
    #a67c52 0%, 
    #8b5e34 30%,
    #704d2a 60%,
    #5d4037 100%
  );
  border-radius: 50% 50% 18% 18%;
  box-shadow: 
    inset 0 6px 12px rgba(255,255,255,0.15),
    inset 0 -4px 8px rgba(0,0,0,0.2),
    0 4px 8px rgba(0,0,0,0.25);
}

.mound__grass {
  position: absolute;
  top: -5px;
  left: 5%;
  width: 90%;
  display: flex;
  justify-content: space-around;
}

.mound__grass span {
  width: 10%;
  height: clamp(8px, 2vw, 14px);
  background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
  border-radius: 50% 50% 0 0;
  transform-origin: bottom center;
}

.mound__grass span:nth-child(1) { transform: rotate(-25deg); height: 80%; }
.mound__grass span:nth-child(2) { transform: rotate(-12deg); }
.mound__grass span:nth-child(3) { height: 120%; }
.mound__grass span:nth-child(4) { transform: rotate(12deg); }
.mound__grass span:nth-child(5) { transform: rotate(25deg); height: 80%; }

/* Effects */
.effect {
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  z-index: 20;
  pointer-events: none;
  animation: effectBurst 0.5s ease-out forwards;
}

@keyframes effectBurst {
  0% { transform: translateX(-50%) scale(0.3); opacity: 0; }
  40% { transform: translateX(-50%) scale(1.4); opacity: 1; }
  100% { transform: translateX(-50%) scale(1) translateY(-25px); opacity: 0; }
}

/* Modal */
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.start-modal {
  background: white;
  padding: clamp(28px, 6vw, 44px);
  border-radius: 28px;
  text-align: center;
  box-shadow: 0 25px 70px rgba(0,0,0,0.3);
  max-width: 340px;
  width: 100%;
  animation: modalPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPop {
  from { transform: scale(0.85) translateY(30px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.start-modal__emoji {
  font-size: clamp(4rem, 12vw, 6rem);
  margin-bottom: 8px;
  animation: emojiWiggle 2s ease-in-out infinite;
}

@keyframes emojiWiggle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(-5deg); }
  75% { transform: translateY(-8px) rotate(5deg); }
}

.start-modal__title {
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px;
}

.start-modal__desc {
  font-size: clamp(0.95rem, 3vw, 1.1rem);
  color: #64748b;
  margin: 0 0 28px;
}

.start-modal__btn {
  width: 100%;
  padding: 18px 28px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 18px;
  font-size: 1.15rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.start-modal__btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(34, 197, 94, 0.5);
}

.start-modal__btn:active {
  transform: translateY(-1px);
}

.start-modal__btn svg {
  width: 22px;
  height: 22px;
}

/* Toast */
.toast {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 22px;
  padding: 18px 22px;
  box-shadow: 0 12px 45px rgba(0,0,0,0.25);
  z-index: 100;
  min-width: 300px;
  max-width: calc(100% - 48px);
}

.toast__content {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.toast__emoji {
  font-size: 2.8rem;
  flex-shrink: 0;
}

.toast__info {
  flex: 1;
  min-width: 0;
}

.toast__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

.toast__score {
  font-size: 0.9rem;
  color: #64748b;
}

.toast__stars {
  display: flex;
  gap: 3px;
}

.toast__star {
  font-size: 1.6rem;
  color: #e2e8f0;
  transition: all 0.3s ease;
}

.toast__star--filled {
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

.toast__progress {
  height: 5px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.toast__bar {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  transition: width 0.05s linear;
  border-radius: 3px;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.toast-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.25s ease-in; }
.toast-enter-from { transform: translateX(-50%) translateY(120%); opacity: 0; }
.toast-leave-to { transform: translateX(-50%) translateY(30px); opacity: 0; }

.pop-enter-active, .pop-leave-active { transition: all 0.3s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.5); }

/* Responsive */
@media (max-width: 500px) {
  .question-banner {
    max-width: calc(100% - 100px);
    padding: 10px 18px;
    margin: 8px auto;
  }
  
  .game-grid {
    gap: 8px;
  }
}

@media (max-height: 450px) {
  .question-banner {
    margin: 6px auto;
    padding: 8px 16px;
  }
  
  .game-area {
    padding: 8px;
  }
}
</style>