<template>
  <div
    class="basket-game"
    ref="gameContainer"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
    @click="handleGameClick"
  >
    <div class="hud-banner">
      <div class="stats-row">
        <span>🎯 {{ score }}</span>
        <span>⏰ {{ timeRemaining }}</span>
        <span>❤️ {{ lives }}</span>
      </div>
      <div class="q-display">
        <span class="label">SOLVE:</span>
        <h1 :key="currentQuestionText">{{ currentQuestionText }}</h1>
      </div>
    </div>

    <div class="sky-layer">
      <div
        v-for="item in fallingItems"
        :key="item.id"
        class="falling-item"
        :style="{
          left: item.x + '%',
          animationDuration: item.speed + 's',
          backgroundColor: item.color
        }"
        :ref="el => { if(el) itemRefs[item.id] = el }"
      >
        {{ item.text }}
      </div>
    </div>

    <div class="player-basket" :style="{ left: basketPosition + '%' }">
      <div class="basket-graphic">🧺</div>
    </div>

    <div v-if="!gameActive" class="start-screen" @click="startGame">
      <div class="msg-box">
        <h1>Math Catch</h1>
        <p>Catch the correct answers!</p>
        <button class="btn-play">▶ PLAY</button>
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

const gameContainer = ref(null);
const fallingItems = ref([]);
const itemRefs = ref({});
const basketPosition = ref(50);
const gameActive = ref(false);
const itemIdCounter = ref(0);
const loops = ref({ spawn: null, collision: null });
const currentQIndex = ref(0);

// Colors
const COLORS = ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9'];

// Logic
const questions = computed(() => props.gameData.questions || [{ q: "Ready?", a: "Go", wrong: [] }]);
const currentQuestion = computed(() => questions.value[currentQIndex.value]);
const currentQuestionText = computed(() => currentQuestion.value?.q || "Done!");

// Methods
const spawnItem = () => {
  if (!gameActive.value || !currentQuestion.value) return;

  const q = currentQuestion.value;
  const isCorrect = Math.random() > 0.5;
  const text = isCorrect ? (q.a || q.correctAnswer) : (q.wrong || ["0"])[Math.floor(Math.random() * (q.wrong?.length || 1))];

  const item = {
    id: itemIdCounter.value++,
    text,
    isCorrect,
    x: Math.random() * 80 + 10,
    speed: 3 + Math.random() * 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    createdAt: Date.now()
  };

  fallingItems.value.push(item);

  // Auto remove
  setTimeout(() => {
    const idx = fallingItems.value.findIndex(i => i.id === item.id);
    if (idx !== -1) fallingItems.value.splice(idx, 1);
  }, item.speed * 1000 + 200);
};

const checkCollision = () => {
  if (!gameActive.value) return;
  const basketRect = gameContainer.value?.querySelector('.player-basket')?.getBoundingClientRect();
  if (!basketRect) return;

  fallingItems.value.forEach((item, idx) => {
    const el = itemRefs.value[item.id];
    if (!el) return;

    const rect = el.getBoundingClientRect();

    // Check overlap
    if (!(rect.right < basketRect.left || rect.left > basketRect.right || rect.bottom < basketRect.top || rect.top > basketRect.bottom)) {
      // Collision!
      if (item.isCorrect) {
        emit('score-change', 10);
        emit('item-collected', { isCorrect: true });
        handleCorrect();
      } else {
        emit('score-change', -5);
        emit('life-lost');
        emit('item-collected', { isCorrect: false });
      }
      fallingItems.value.splice(idx, 1);
    }
  });
};

const handleCorrect = () => {
  fallingItems.value = []; // Clear screen
  if (currentQIndex.value < questions.value.length - 1) {
    currentQIndex.value++;
  } else {
    emit('game-complete', { score: props.score + 100 });
  }
};

// Input
const handleMouseMove = (e) => {
  if (!gameContainer.value) return;
  const rect = gameContainer.value.getBoundingClientRect();
  const pct = ((e.clientX - rect.left) / rect.width) * 100;
  basketPosition.value = Math.max(5, Math.min(95, pct));
};

const handleTouchMove = (e) => {
  e.preventDefault();
  if (!gameContainer.value) return;
  const rect = gameContainer.value.getBoundingClientRect();
  const pct = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
  basketPosition.value = Math.max(5, Math.min(95, pct));
};

const handleGameClick = () => {
  // Optional: Handle clicks
};

// Start/Stop
const startGame = () => {
  gameActive.value = true;
  fallingItems.value = [];
  currentQIndex.value = 0;
  loops.value.spawn = setInterval(spawnItem, 1200);
  loops.value.collision = setInterval(checkCollision, 50);
};

const stopGame = () => {
  gameActive.value = false;
  clearInterval(loops.value.spawn);
  clearInterval(loops.value.collision);
};

watch(() => props.lives, v => { if(v<=0) stopGame(); });
onUnmounted(stopGame);
</script>

<style scoped>
.basket-game {
  width: 100%; height: 100%; position: relative; overflow: hidden;
  background: linear-gradient(180deg, #E3F2FD, #FAFAFA);
  border-radius: 12px;
  font-family: sans-serif;
  user-select: none;
}

/* HUD */
.hud-banner {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
  background: rgba(255,255,255,0.9); padding: 10px 20px;
  border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  text-align: center; z-index: 10; width: 90%; max-width: 400px;
}
.stats-row { display: flex; justify-content: space-between; font-weight: bold; color: #555; margin-bottom: 5px; }
.q-display h1 { margin: 0; color: #1565C0; font-size: 1.8rem; }
.label { font-size: 0.7rem; color: #888; letter-spacing: 1px; font-weight: bold; }

/* SKY LAYER */
.sky-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ITEM */
.falling-item {
  position: absolute; top: -50px;
  width: 60px; height: 60px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; color: #333; border: 3px solid white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  animation: fall linear forwards;
  pointer-events: auto;
}
@keyframes fall { to { top: 110%; } }

/* BASKET */
.player-basket {
  position: absolute; bottom: 20px; transform: translateX(-50%);
  font-size: 4rem; pointer-events: none;
  z-index: 5;
}

/* START SCREEN */
.start-screen {
  position: absolute; inset: 0; background: rgba(255,255,255,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 20; cursor: pointer;
}
.msg-box {
  background: white; padding: 30px; border-radius: 20px; text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}
.msg-box h1 { font-size: 2rem; font-weight: 800; color: #1565C0; margin: 0 0 10px 0; }
.msg-box p { font-size: 1rem; color: #666; margin-bottom: 20px; }
.btn-play {
  background: #2196F3; color: white; border: none; padding: 10px 30px;
  border-radius: 8px; font-weight: bold; font-size: 1.2rem; margin-top: 15px;
  cursor: pointer; transition: all 0.3s;
}
.btn-play:hover {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hud-banner {
    padding: 8px 15px;
    width: 95%;
  }

  .q-display h1 {
    font-size: 1.4rem;
  }

  .falling-item {
    width: 50px;
    height: 50px;
    font-size: 0.9rem;
  }

  .player-basket {
    font-size: 3rem;
  }

  .msg-box {
    padding: 20px;
  }

  .msg-box h1 {
    font-size: 1.6rem;
  }

  .msg-box p {
    font-size: 0.9rem;
  }
}
</style>
