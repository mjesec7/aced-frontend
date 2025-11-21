<template>
  <div class="whack-game-container">
    <div class="hud-glass">
      <div class="hud-stats">
        <div class="stat-pill">
          <span>🎯 Score: {{ score }}</span>
        </div>
        <div class="stat-pill timer" :class="{ 'low': timeRemaining < 10 }">
          <span>⏳ {{ timeRemaining }}</span>
        </div>
        <div class="lives">
          <span v-for="n in 3" :key="n" class="heart" :class="{ 'lost': n > lives }">❤️</span>
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
        <div class="mound-back"></div>

        <div
          class="mole-character"
          :class="{
            'visible': hole.active,
            'hit': hole.state === 'hit',
            'miss': hole.state === 'miss'
          }"
          @mousedown="handleWhack(index)"
        >
          <div class="mole-body">
            <div class="mole-face">
              <div class="eyes">👀</div>
              <div class="content-sign">
                {{ hole.content }}
              </div>
            </div>
          </div>
        </div>

        <div class="mound-front"></div>

        <transition name="pop">
          <div v-if="hole.showEffect" class="hit-spark">💥</div>
        </transition>
      </div>
    </div>

    <div v-if="!gameActive" class="overlay" @click="startGame">
      <div class="card">
        <div class="icon">🔨</div>
        <h2>Ready to Whack?</h2>
        <p>{{ instructions }}</p>
        <button class="play-btn">▶ Start Game</button>
      </div>
    </div>
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
const BASE_SPEED = 1200;

// State
const holes = ref([]);
const gameActive = ref(false);
const gameInterval = ref(null);
const currentQuestionIndex = ref(0);

// --- Computed Logic ---

// 1. Determine Mode: Question-Based (Math) or Category-Based (Vocab)
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
    // 40% chance for correct answer to appear
    isCorrect = Math.random() > 0.6;
    if (isCorrect) {
      content = q.a || q.correctAnswer;
    } else {
      const wrong = q.wrong || ["0"];
      content = wrong[Math.floor(Math.random() * wrong.length)];
    }
  } else {
    // Category Mode (Vocab/Grammar)
    const items = props.gameData.items || [];
    if (items.length === 0) return; // No items to show

    const item = items[Math.floor(Math.random() * items.length)];
    // Handle string vs object
    if (typeof item === 'string') {
      content = item;
      isCorrect = true; // Assuming simple list is all correct targets
    } else {
      content = item.text;
      isCorrect = item.isCorrect;
    }
  }

  // Activate Hole
  hole.content = content;
  hole.isCorrect = isCorrect;
  hole.active = true;
  hole.state = 'idle';

  // Auto-hide
  const speed = Math.max(600, BASE_SPEED - (props.score * 5));
  hole.timer = setTimeout(() => {
    if (hole.active && hole.state === 'idle') {
      hole.active = false;
      // Optional: Penalty for missing a correct mole?
      // if(hole.isCorrect) emit('life-lost');
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

    // Advance Question if needed
    if (mode.value === 'question') {
      setTimeout(() => nextQuestion(), 500);
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
  }, 400);
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    // Clear board
    holes.value.forEach(h => { h.active = false; clearTimeout(h.timer); });
  } else {
    emit('game-complete', { score: props.score + 50 });
  }
};

// --- Lifecycle ---

const startGame = () => {
  gameActive.value = true;
  initHoles();
  gameInterval.value = setInterval(spawnMole, 900);
};

const stopGame = () => {
  gameActive.value = false;
  clearInterval(gameInterval.value);
  holes.value.forEach(h => clearTimeout(h.timer));
};

watch(() => props.lives, (val) => { if(val <= 0) stopGame(); });
watch(() => props.timeRemaining, (val) => { if(val <= 0) stopGame(); });

onMounted(initHoles);
onUnmounted(stopGame);
</script>

<style scoped>
.whack-game-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #86efac, #22c55e); /* Grass Green */
  overflow: hidden;
  border-radius: 16px;
  user-select: none;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

/* HUD */
.hud-glass {
  background: rgba(255,255,255,0.9);
  margin: 8px; /* Reduced margin */
  padding: 8px 16px; /* Reduced padding */
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  z-index: 20;
  text-align: center;
  max-width: 90%; /* Prevent full width on small screens */
  align-self: center; /* Center in flex container */
}

.hud-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 700;
  color: #475569;
}

.stat-pill {
  background: #f0fdf4;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.timer.low { color: #ef4444; animation: pulse 1s infinite; }
.lives { display: flex; gap: 4px; }
.heart.lost { opacity: 0.3; filter: grayscale(1); }

.prompt-text {
  margin: 0;
  font-size: 1.8rem;
  color: #1e293b;
  font-weight: 800;
}

/* GRID */
.game-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px 20px 20px 20px;
  max-width: 500px;
  margin: 0 auto;
  align-content: center;
}

.hole-wrapper {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

/* DIRT MOUNDS */
.mound-back {
  position: absolute;
  bottom: 15%;
  width: 80%;
  height: 30%;
  background: #5d4037;
  border-radius: 50% 50% 0 0;
  z-index: 1;
}

.mound-front {
  position: absolute;
  bottom: 0;
  width: 90%;
  height: 25%;
  background: #795548;
  border-radius: 50% 50% 10px 10px;
  z-index: 10;
}

/* MOLE */
.mole-character {
  position: absolute;
  bottom: 15%;
  width: 70%;
  height: 80%;
  z-index: 5;
  transform: translateY(110%);
  transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.mole-character.visible { transform: translateY(0); }
.mole-character.hit { transform: scale(0.9) translateY(10px); filter: brightness(1.2); }
.mole-character.miss { filter: hue-rotate(90deg); } /* Turn reddish */

.mole-body {
  width: 100%;
  height: 100%;
  background: #a1887f;
  border-radius: 40px 40px 0 0;
  border: 3px solid #5d4037;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset -5px 0 10px rgba(0,0,0,0.1);
}

.mole-face { text-align: center; }
.eyes { font-size: 1.5rem; margin-bottom: 4px; }

.content-sign {
  background: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1.1rem;
  border: 2px solid #d7ccc8;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  min-width: 50px;
}

/* EFFECTS */
.hit-spark {
  position: absolute;
  top: 10%;
  font-size: 3rem;
  z-index: 20;
  animation: popOut 0.3s forwards;
}

/* OVERLAY */
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.icon { font-size: 3rem; }
.card h2 { font-size: 1.8rem; font-weight: 800; color: #333; margin: 10px 0; }
.card p { font-size: 1rem; color: #666; margin-bottom: 20px; }
.play-btn {
  background: #22c55e; color: white; border: none;
  padding: 12px 30px; border-radius: 12px; font-weight: 700; cursor: pointer;
  margin-top: 15px; font-size: 1.1rem;
  transition: all 0.3s;
}
.play-btn:hover {
  background: #16a34a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

@keyframes popOut { from { transform: scale(0.5); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
@keyframes slide-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.pop-enter-active, .pop-leave-active {
  transition: opacity 0.3s;
}

.pop-enter-from, .pop-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(10px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .hud-glass {
    margin: 12px;
    padding: 10px 15px;
  }

  .prompt-text {
    font-size: 1.4rem;
  }

  .game-grid {
    gap: 8px;
    padding: 10px 15px;
  }

  .content-sign {
    font-size: 0.9rem;
    padding: 3px 6px;
  }

  .card {
    padding: 20px;
  }

  .icon {
    font-size: 2.5rem;
  }

  .card h2 {
    font-size: 1.4rem;
  }

  .card p {
    font-size: 0.9rem;
  }
}
</style>
