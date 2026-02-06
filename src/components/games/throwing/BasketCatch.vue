<template>
  <div
    class="basket-catch-game"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
  >
    <!-- Fun Background Elements -->
    <div class="sun">☀️</div>
    <div class="cloud cloud-1">☁️</div>
    <div class="cloud cloud-2">☁️</div>
    <div class="cloud cloud-3">☁️</div>
    <div class="cloud cloud-4">☁️</div>
    <div class="cloud cloud-5">☁️</div>
    <div class="cloud cloud-6">☁️</div>
    <div class="cloud cloud-7">☁️</div>
    <div class="cloud cloud-8">☁️</div>

    <!-- START SCREEN OVERLAY -->
    <div v-if="!gameActive && !gameEnded" class="start-overlay">
      <div class="start-card">
        <div class="start-icon">🧺</div>
        <h2>Basket Catch</h2>
        <p class="start-description">{{ currentQuestionText }}</p>
        <div class="start-rules">
          <div class="rule-item">
            <span class="rule-icon">🎯</span>
            <span>Catch {{ totalItemsToWin }} correct items to win</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon">✅</span>
            <span>+100 points for correct answers</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon">❌</span>
            <span>-50 points for wrong answers</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon">❤️</span>
            <span>You have 5 lives (5 mistakes = game over)</span>
          </div>
        </div>
        <button class="start-btn" @click="startGame">
          🎮 Start the Game
        </button>
      </div>
    </div>

    <!-- GAME OVER OVERLAY -->
    <div v-if="gameEnded" class="game-over-overlay">
      <div class="game-over-card" :class="gameWon ? 'won' : 'lost'">
        <div class="game-over-icon">{{ gameWon ? '🎉' : '💔' }}</div>
        <h2>{{ gameWon ? 'Congratulations!' : 'Game Over' }}</h2>
        <p class="game-over-message">
          {{ gameWon ? 'You caught all the correct answers!' : 'You ran out of lives!' }}
        </p>
        <div class="game-over-stats">
          <div class="stat-item">
            <span class="stat-value">{{ finalScore }}</span>
            <span class="stat-label">Score</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ correctCaught }}</span>
            <span class="stat-label">Correct</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ mistakesMade }}</span>
            <span class="stat-label">Mistakes</span>
          </div>
        </div>
        <div class="game-over-actions">
          <button class="try-again-btn" @click="restartGame">
            🔄 Try Again
          </button>
          <button class="continue-btn" @click="handleContinue">
            Continue →
          </button>
        </div>
      </div>
    </div>

    <!-- Right Sidebar HUD -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="5"
    />

    <!-- Question Display -->
    <div v-if="gameActive" class="question-display">
      <div class="question-icon">❓</div>
      <div class="question-text">{{ currentQuestionText }}</div>
      <div class="progress-indicator">
        🎯 {{ correctCaught }} / {{ totalItemsToWin }} caught
      </div>
    </div>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import GameHUDSidebar from '../base/GameHUDSidebar.vue';

const props = defineProps({
  gameData: { type: Object, required: true },
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 5 },
  timeRemaining: { type: Number, default: 60 },
  isPaused: { type: Boolean, default: false }
});

const emit = defineEmits(['score-change', 'life-lost', 'item-collected', 'game-complete', 'pause', 'game-started', 'try-again']);

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

// Game End State
const gameEnded = ref(false);
const gameWon = ref(false);
const finalScore = ref(0);
const correctCaught = ref(0);
const mistakesMade = ref(0);

// Feedback
const showFeedback = ref(false);
const feedbackText = ref('');
const feedbackType = ref('');
const feedbackIcon = ref('');

// Colors
const BUBBLE_COLORS = ['#FFE0B2', '#C8E6C9', '#BBDEFB', '#F8BBD0', '#E1BEE7'];

// Questions/Items Logic
const questions = computed(() => props.gameData.questions || [{ q: "Ready?", a: "Go", wrong: [] }]);
const items = computed(() => props.gameData.items || []);
const correctItemsList = computed(() => items.value.filter(i => i.isCorrect));
const wrongItemsList = computed(() => items.value.filter(i => !i.isCorrect));
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);

// Total items needed to win - use gameData config, or correct items count, or minimum 5
const totalItemsToWin = computed(() => {
  if (props.gameData.targetScore) return Math.ceil(props.gameData.targetScore / 100);
  if (props.gameData.itemsToCollect) return props.gameData.itemsToCollect;
  if (correctItemsList.value.length > 0) return Math.max(5, correctItemsList.value.length);
  return Math.max(5, questions.value.length); // Minimum 5 items to catch
});

const currentQuestionText = computed(() => {
  // Use instructions or first question
  if (props.gameData.gameplayData?.instructions?.en) return props.gameData.gameplayData.instructions.en;
  return currentQuestion.value?.q || currentQuestion.value?.question || `Catch ${totalItemsToWin.value} correct items!`;
});

// Game Loop
const spawnItem = () => {
  if (!gameActive.value || props.isPaused) return;

  // Use items array if available, otherwise fall back to questions
  let text = '';
  let isCorrectSpawn = false;
  
  if (items.value.length > 0) {
    // Use items from gameConfig - 50% chance correct/wrong
    isCorrectSpawn = Math.random() > 0.4; // Slightly favor correct items
    
    if (isCorrectSpawn && correctItemsList.value.length > 0) {
      const item = correctItemsList.value[Math.floor(Math.random() * correctItemsList.value.length)];
      text = item.content || item.text || item.id;
    } else if (wrongItemsList.value.length > 0) {
      const item = wrongItemsList.value[Math.floor(Math.random() * wrongItemsList.value.length)];
      text = item.content || item.text || item.id;
      isCorrectSpawn = false;
    } else {
      // Fallback if no items
      text = isCorrectSpawn ? "correct" : "wrong";
    }
  } else {
    // Fallback to questions format
    const q = currentQuestion.value;
    if (!q) return;
    
    isCorrectSpawn = Math.random() > 0.5;
    const correctAnswer = q.a || q.correctAnswer || q.answer;
    const wrongAnswers = q.wrong || q.wrongAnswers || ["0", "1"];
    const wrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
    text = isCorrectSpawn ? correctAnswer : wrongAnswer;
  }

  const newItem = {
    id: `item-${itemIdCounter.value++}`,
    text: text,
    isCorrect: isCorrectSpawn,
    x: Math.random() * 70 + 15, // 15% - 85% (more centered)
    speed: props.gameData.difficulty === 'hard' ? 3 : props.gameData.difficulty === 'easy' ? 5 : 4,
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
      correctCaught.value++;
      emit('item-collected', { isCorrect: true });
      triggerFeedback('Correct!', 'success', '✨');
      
      // Check if user has caught enough correct items to win
      if (correctCaught.value >= totalItemsToWin.value) {
          // Clear remaining items and end game as win
          fallingItems.value = [];
          setTimeout(() => {
              endGame(true);
          }, 800);
      }
  } else {
      emit('score-change', -50); // Higher penalty for wrong answers
      emit('life-lost');
      emit('item-collected', { isCorrect: false });
      mistakesMade.value++;
      triggerFeedback('Wrong! -50', 'error', '❌');
      
      // Check if out of lives (5 mistakes = game over)
      if (props.lives <= 1) {
          setTimeout(() => {
              endGame(false);
          }, 800);
      }
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

// Lifecycle
const startGame = () => {
    gameActive.value = true;
    gameEnded.value = false;
    gameWon.value = false;
    fallingItems.value = [];
    currentQuestionIndex.value = 0;
    correctCaught.value = 0;
    mistakesMade.value = 0;

    if (spawnInterval.value) clearInterval(spawnInterval.value);
    if (collisionInterval.value) clearInterval(collisionInterval.value);

    spawnInterval.value = setInterval(spawnItem, 1400);
    collisionInterval.value = setInterval(checkCollisions, 50);
    
    // Notify parent that game has started
    emit('game-started');
};

const stopGame = () => {
    gameActive.value = false;
    clearInterval(spawnInterval.value);
    clearInterval(collisionInterval.value);
};

const endGame = (won) => {
    stopGame();
    gameEnded.value = true;
    gameWon.value = won;
    finalScore.value = props.score;
    fallingItems.value = [];
};

const restartGame = () => {
    // Reset all game state
    gameEnded.value = false;
    gameWon.value = false;
    finalScore.value = 0;
    correctCaught.value = 0;
    mistakesMade.value = 0;
    
    // Emit try-again to reset parent state (lives, score)
    emit('try-again');
    
    // Start fresh game
    startGame();
};

const handleContinue = () => {
    // Emit game-complete to advance to next step
    emit('game-complete', { 
        score: finalScore.value, 
        completed: gameWon.value,
        stars: gameWon.value ? (mistakesMade.value === 0 ? 3 : mistakesMade.value <= 2 ? 2 : 1) : 0,
        correctCaught: correctCaught.value,
        mistakesMade: mistakesMade.value
    });
};

watch(() => props.lives, (val) => { 
    if(val <= 0 && gameActive.value) {
        endGame(false);
    }
});

onMounted(() => {
    // Clean start state - DO NOT auto-start, wait for user to click start button
    fallingItems.value = [];
    gameEnded.value = false;
    gameActive.value = false;
});
onUnmounted(stopGame);
</script>

<style scoped>
/* MAIN CONTAINER */
.basket-catch-game {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  background: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #FFE4B5 100%);
  overflow: hidden;
  border-radius: 16px;
  font-family: 'Inter', sans-serif;
  user-select: none;
  border: 4px solid white;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.05);
  cursor: default;
}

/* START SCREEN OVERLAY */
.start-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.start-card {
  background: white;
  padding: 32px 40px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 380px;
  width: 90%;
  animation: slideUp 0.4s ease-out;
}

.start-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.start-card h2 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 800;
}

.start-description {
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 20px;
}

.start-rules {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  text-align: left;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.rule-icon {
  font-size: 1.2rem;
}

.start-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

/* GAME OVER OVERLAY */
.game-over-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.game-over-card {
  background: white;
  padding: 32px 40px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  animation: popIn 0.4s ease-out;
}

.game-over-card.won {
  border: 4px solid #22c55e;
}

.game-over-card.lost {
  border: 4px solid #ef4444;
}

.game-over-icon {
  font-size: 4rem;
  margin-bottom: 12px;
}

.game-over-card h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.game-over-card.won h2 {
  color: #22c55e;
}

.game-over-card.lost h2 {
  color: #ef4444;
}

.game-over-message {
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 20px;
}

.game-over-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e293b;
}

.stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.game-over-actions {
  display: flex;
  gap: 12px;
}

.try-again-btn {
  flex: 1;
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 14px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.try-again-btn:hover {
  background: #e2e8f0;
}

.continue-btn {
  flex: 1;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
}

/* FLOATING CLOUDS */
.cloud {
  position: absolute;
  font-size: 3rem;
  opacity: 0.8;
  animation: float 60s infinite linear;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

/* Use negative delays to have clouds visible immediately */
.cloud-1 { top: 10%; left: -10%; animation-delay: -5s; font-size: 4rem; }
.cloud-2 { top: 25%; left: -20%; animation-delay: -25s; font-size: 3rem; }
.cloud-3 { top: 15%; left: -15%; animation-delay: -45s; font-size: 5rem; opacity: 0.6; }
.cloud-4 { top: 40%; left: -10%; animation-delay: -15s; font-size: 3.5rem; }
.cloud-5 { top: 5%; left: -25%; animation-delay: -35s; font-size: 2.5rem; opacity: 0.5; }
.cloud-6 { top: 35%; left: -30%; animation-delay: -55s; font-size: 4.5rem; }
.cloud-7 { top: 20%; left: -15%; animation-delay: -10s; font-size: 3.2rem; opacity: 0.7; }
.cloud-8 { top: 45%; left: -20%; animation-delay: -40s; font-size: 4.2rem; }

@keyframes float {
  0% { transform: translateX(-150px); }
  100% { transform: translateX(120vw); }
}

/* SUN */
.sun {
  position: absolute;
  top: 40px;
  left: 40px; /* Moved to left */
  font-size: 5rem;
  animation: spin 120s infinite linear;
  z-index: 0;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* QUESTION DISPLAY */
.question-display {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 32px;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
  border: 3px solid #3b82f6;
  animation: bounce 2s infinite ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-5px); }
}

.question-icon {
  font-size: 2rem;
}

.question-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.progress-indicator {
  font-size: 1rem;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 12px;
  border-radius: 10px;
  margin-left: 8px;
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

/* ============================================
   TABLET RESPONSIVE (768px - 1366px)
   ============================================ */

/* iPad Mini & Small Tablets */
@media (min-width: 768px) and (max-width: 1023px) {
  .basket-catch-game {
    min-height: 350px;
    border-radius: 12px;
    border-width: 3px;
  }

  .sun {
    top: 20px;
    left: 20px;
    font-size: 3rem;
  }

  .cloud {
    font-size: 2rem;
  }

  .cloud-1 { font-size: 2.5rem; }
  .cloud-3 { font-size: 3rem; }
  .cloud-6 { font-size: 2.8rem; }

  .question-display {
    top: 12px;
    padding: 10px 20px;
    border-radius: 14px;
    gap: 8px;
    border-width: 2px;
  }

  .question-icon {
    font-size: 1.4rem;
  }

  .question-text {
    font-size: 1rem;
  }

  .falling-orb {
    width: 55px;
    height: 55px;
    border-width: 2px;
  }

  .orb-text {
    font-size: 1.3rem;
  }

  .basket-wrapper {
    bottom: 20px;
  }

  .basket-body {
    font-size: 3rem;
  }

  .feedback-splash {
    padding: 14px 28px;
    border-radius: 14px;
  }

  .splash-icon {
    font-size: 2rem;
  }

  .splash-text {
    font-size: 1.3rem;
  }

  .small-modal {
    padding: 18px;
    max-width: 300px;
  }

  .modal-icon {
    font-size: 2.5rem;
    margin-bottom: 8px;
  }

  .modal-title {
    font-size: 1.2rem;
  }

  .modal-text {
    font-size: 0.875rem;
    margin-bottom: 12px;
  }

  .modal-btn {
    padding: 10px 20px;
    font-size: 0.875rem;
  }
}

/* iPad Air & Larger Tablets */
@media (min-width: 1024px) and (max-width: 1366px) {
  .basket-catch-game {
    min-height: 400px;
  }

  .sun {
    top: 30px;
    left: 30px;
    font-size: 4rem;
  }

  .question-display {
    top: 16px;
    padding: 12px 24px;
    border-radius: 16px;
  }

  .question-icon {
    font-size: 1.6rem;
  }

  .question-text {
    font-size: 1.2rem;
  }

  .falling-orb {
    width: 65px;
    height: 65px;
  }

  .orb-text {
    font-size: 1.5rem;
  }

  .basket-body {
    font-size: 3.5rem;
  }
}

/* Tablet Landscape - compact */
@media (min-width: 768px) and (max-height: 800px) and (orientation: landscape) {
  .basket-catch-game {
    min-height: 280px;
    border-radius: 10px;
  }

  .sun {
    top: 10px;
    left: 10px;
    font-size: 2.5rem;
  }

  .cloud {
    font-size: 1.5rem;
  }

  .cloud-1, .cloud-3, .cloud-6 { font-size: 2rem; }

  .question-display {
    top: 8px;
    padding: 8px 16px;
    border-radius: 12px;
    gap: 6px;
  }

  .question-icon {
    font-size: 1.2rem;
  }

  .question-text {
    font-size: 0.9rem;
  }

  .falling-orb {
    width: 50px;
    height: 50px;
  }

  .orb-text {
    font-size: 1.1rem;
  }

  .basket-wrapper {
    bottom: 15px;
  }

  .basket-body {
    font-size: 2.5rem;
  }

  .feedback-splash {
    padding: 12px 24px;
    border-radius: 12px;
  }

  .splash-icon {
    font-size: 1.8rem;
  }

  .splash-text {
    font-size: 1.1rem;
  }
}

/* Short screens */
@media (max-height: 600px) {
  .basket-catch-game {
    min-height: 220px;
    border-radius: 8px;
    border-width: 2px;
  }

  .sun {
    top: 8px;
    left: 8px;
    font-size: 2rem;
  }

  .cloud {
    font-size: 1.2rem;
    opacity: 0.5;
  }

  .question-display {
    top: 6px;
    padding: 6px 12px;
    border-radius: 10px;
    gap: 4px;
    border-width: 2px;
  }

  .question-icon {
    font-size: 1rem;
  }

  .question-text {
    font-size: 0.8rem;
  }

  .falling-orb {
    width: 40px;
    height: 40px;
    border-width: 2px;
  }

  .orb-text {
    font-size: 0.9rem;
  }

  .basket-wrapper {
    bottom: 10px;
  }

  .basket-body {
    font-size: 2rem;
  }

  .feedback-splash {
    padding: 10px 20px;
    border-radius: 10px;
  }

  .splash-icon {
    font-size: 1.5rem;
    margin-bottom: 2px;
  }

  .splash-text {
    font-size: 1rem;
  }
}
</style>
