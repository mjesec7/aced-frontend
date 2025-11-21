<template>
  <div class="whack-game-container">
    <!-- Game Background Elements -->
    <div class="bg-decoration circle-1"></div>
    <div class="bg-decoration circle-2"></div>

    <div class="hud-glass">
      <div class="hud-stats">
        <div class="stat-pill score-pill">
          <span class="stat-icon">🎯</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat-pill timer-pill" :class="{ 'low': timeRemaining < 10 }">
          <span class="stat-icon">⏳</span>
          <span class="stat-value">{{ timeRemaining }}s</span>
        </div>
        <div class="lives-container">
          <transition-group name="heart-pop">
            <span 
              v-for="n in 3" 
              :key="n" 
              class="heart" 
              :class="{ 'lost': n > lives }"
            >❤️</span>
          </transition-group>
        </div>
      </div>

      <div class="instruction-banner">
        <transition name="slide-up" mode="out-in">
          <h2 :key="currentPrompt" class="prompt-text">{{ currentPrompt }}</h2>
        </transition>
      </div>
    </div>

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

    <!-- Start/Game Over Overlay -->
    <transition name="fade">
      <div v-if="!gameActive" class="overlay" @click.self="startGame">
        <div class="card glass-card">
          <div class="icon-bounce">🔨</div>
          <h2>{{ isGameOver ? 'Game Over!' : 'Ready to Whack?' }}</h2>
          <p>{{ isGameOver ? `Final Score: ${score}` : instructions }}</p>
          
          <div v-if="isGameOver" class="result-stars">
            <span v-for="n in 3" :key="n" class="star">{{ n <= earnedStars ? '⭐' : '☆' }}</span>
          </div>

          <button class="play-btn" @click="startGame">
            {{ isGameOver ? '🔄 Play Again' : '▶ Start Game' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  gameData: { type: Object, required: true },
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 3 },
  timeRemaining: { type: Number, default: 60 }
});

const emit = defineEmits(['score-change', 'life-lost', 'game-complete', 'item-collected']);

// Config
const GRID_SIZE = 9;
const BASE_SPEED = 1500; // Slightly slower for better playability
const MIN_SPEED = 700;

// State
const holes = ref([]);
const gameActive = ref(false);
const gameInterval = ref(null);
const currentQuestionIndex = ref(0);
const isGameOver = ref(false);
const earnedStars = ref(0);

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
    state: 'idle', // idle, hit, miss
    showEffect: false,
    timer: null
  }));
};

const spawnMole = () => {
  if (!gameActive.value) return;

  // Find empty hole
  const available = holes.value.map((h, i) => (!h.active ? i : null)).filter(i => i !== null);
  if (available.length === 0) return;

  const holeIdx = available[Math.floor(Math.random() * available.length)];
  const hole = holes.value[holeIdx];

  // Determine Content
  let content = "";
  let isCorrect = false;

  if (mode.value === 'question') {
    const q = currentQuestion.value;
    // 50% chance for correct answer to appear
    isCorrect = Math.random() > 0.5;
    
    if (isCorrect) {
      // Ensure we have a valid correct answer
      content = q.a || q.correctAnswer || "OK";
    } else {
      // Robustly pick a wrong answer
      const wrong = q.wrong || ["0", "1", "2"];
      if (Array.isArray(wrong) && wrong.length > 0) {
        content = wrong[Math.floor(Math.random() * wrong.length)];
      } else {
        content = "X"; // Fallback
      }
    }
  } else {
    // Category Mode (Vocab/Grammar)
    const items = props.gameData.items || [];
    if (items.length === 0) return; 

    // Ensure we pick a random item each time
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

  // Activate Hole
  hole.content = content;
  hole.isCorrect = isCorrect;
  hole.active = true;
  hole.state = 'idle';

  // Calculate speed based on score
  const speed = Math.max(MIN_SPEED, BASE_SPEED - (props.score * 10));
  
  hole.timer = setTimeout(() => {
    if (hole.active && hole.state === 'idle') {
      hole.active = false;
    }
  }, speed);
};

const handleWhack = (index) => {
  const hole = holes.value[index];
  
  // Prevent double hits or hitting inactive moles
  if (!hole.active || hole.state !== 'idle') return;

  clearTimeout(hole.timer);
  hole.showEffect = true;

  if (hole.isCorrect) {
    hole.state = 'hit';
    emit('score-change', 10);
    emit('item-collected', { isCorrect: true });

    // Advance Question if needed
    if (mode.value === 'question') {
      setTimeout(() => nextQuestion(), 600);
    }
  } else {
    hole.state = 'miss';
    emit('score-change', -5);
    emit('life-lost');
    emit('item-collected', { isCorrect: false });
  }

  // Reset visual
  setTimeout(() => {
    hole.active = false;
    hole.showEffect = false;
    hole.state = 'idle';
  }, 500);
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    // Clear board briefly
    holes.value.forEach(h => { h.active = false; clearTimeout(h.timer); });
  } else {
    finishGame();
  }
};

const finishGame = () => {
  stopGame();
  isGameOver.value = true;
  
  // Calculate stars
  if (props.lives >= 3) earnedStars.value = 3;
  else if (props.lives === 2) earnedStars.value = 2;
  else earnedStars.value = 1;
  
  emit('game-complete', { score: props.score + (props.lives * 10) });
};

// --- Lifecycle ---

const startGame = () => {
  isGameOver.value = false;
  gameActive.value = true;
  initHoles();
  // Initial delay before first mole
  setTimeout(() => {
    gameInterval.value = setInterval(spawnMole, 1000);
  }, 500);
};

const stopGame = () => {
  gameActive.value = false;
  if (gameInterval.value) clearInterval(gameInterval.value);
  holes.value.forEach(h => clearTimeout(h.timer));
};

watch(() => props.lives, (val) => { if(val <= 0) finishGame(); });
watch(() => props.timeRemaining, (val) => { if(val <= 0) finishGame(); });

onMounted(initHoles);
onUnmounted(stopGame);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');

.whack-game-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #86efac 0%, #22c55e 100%);
  overflow: hidden;
  border-radius: 24px;
  user-select: none;
  font-family: 'Fredoka', sans-serif;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 60px rgba(0,0,0,0.1);
}

.bg-decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: none;
}
.circle-1 { width: 300px; height: 300px; top: -50px; left: -50px; }
.circle-2 { width: 200px; height: 200px; bottom: 50px; right: -20px; }

/* HUD */
.hud-glass {
  /* Relative positioning to take up space in flex container */
  position: relative; 
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  margin: 16px;
  padding: 12px 20px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 30; /* Higher than grid */
  text-align: center;
  max-width: 600px;
  width: 90%;
  align-self: center;
  border: 1px solid rgba(255,255,255,0.5);
  flex-shrink: 0; /* Don't shrink */
}

.hud-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-pill {
  background: white;
  padding: 6px 16px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  font-weight: 700;
  color: #475569;
}

.stat-value { font-size: 1.1rem; }
.timer-pill.low { color: #ef4444; animation: pulse 1s infinite; }

.lives-container { display: flex; gap: 4px; }
.heart { font-size: 1.5rem; transition: all 0.3s; }
.heart.lost { opacity: 0.3; filter: grayscale(1) blur(1px); transform: scale(0.8); }

.prompt-text {
  margin: 0;
  font-size: 1.6rem;
  color: #1e293b;
  font-weight: 800;
  text-shadow: 0 2px 0 rgba(255,255,255,0.5);
}

/* GRID */
.game-grid {
  flex: 1; /* Take remaining space */
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 16px;
  padding: 10px 20px 30px;
  max-width: 100%; /* Allow full width for single row */
  width: 100%;
  margin: 0 auto;
  align-content: center;
  overflow-x: auto; /* Allow horizontal scroll if needed */
  overflow-y: hidden;
}

.hole-wrapper {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  cursor: pointer;
  /* CRITICAL FIX: Hide mole when it goes down */
  overflow: hidden;
  border-radius: 0 0 20px 20px; /* Match mound shape roughly */
}

/* DIRT MOUNDS */
.mound-back {
  position: absolute;
  bottom: 12%;
  width: 85%;
  height: 35%;
  background: linear-gradient(to bottom, #5d4037, #3e2723);
  border-radius: 50% 50% 0 0;
  z-index: 1; /* Behind mole */
  box-shadow: inset 0 5px 10px rgba(0,0,0,0.3);
}

.mound-front {
  position: absolute;
  bottom: 0;
  width: 95%;
  height: 25%;
  background: linear-gradient(to bottom, #795548, #5d4037);
  border-radius: 50% 50% 15px 15px;
  z-index: 10; /* In front of mole */
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
  z-index: 5; /* Between back and front mounds */
  transform: translateY(110%);
  transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform;
}

.mole-character.visible { transform: translateY(0); }
.mole-character.hit { transform: scale(0.95) translateY(15px); filter: brightness(1.1); }
.mole-character.miss { filter: hue-rotate(320deg) saturate(1.5); } /* Reddish tint */

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

/* OVERLAY */
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 32px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  border: 1px solid white;
  max-width: 90%;
  width: 400px;
}

.icon-bounce { 
  font-size: 4rem; 
  margin-bottom: 16px;
  animation: bounce 2s infinite;
}

.glass-card h2 { 
  font-size: 2rem; 
  font-weight: 800; 
  color: #1e293b; 
  margin: 0 0 12px; 
}

.glass-card p { 
  font-size: 1.1rem; 
  color: #64748b; 
  margin-bottom: 24px; 
  line-height: 1.5;
}

.play-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white; 
  border: none;
  padding: 16px 40px; 
  border-radius: 20px; 
  font-weight: 800; 
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
  width: 100%;
}

.play-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(34, 197, 94, 0.4);
}

.play-btn:active {
  transform: translateY(-1px);
}

.result-stars {
  font-size: 2.5rem;
  color: #fbbf24;
  margin-bottom: 20px;
  letter-spacing: 8px;
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

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from { transform: translateY(10px); opacity: 0; }
.slide-up-leave-to { transform: translateY(-10px); opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .hud-glass {
    margin: 10px;
    padding: 8px 16px;
  }
  
  .prompt-text { font-size: 1.2rem; }
  
  .game-grid {
    gap: 10px;
    padding: 10px 15px;
  }
  
  .content-sign {
    font-size: 0.9rem;
    padding: 4px 8px;
  }
  
  .glass-card { padding: 24px; }
  .icon-bounce { font-size: 3rem; }
  .glass-card h2 { font-size: 1.5rem; }
}
</style>
```
