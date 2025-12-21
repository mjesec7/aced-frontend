<template>
  <div 
    ref="gameWrapper"
    class="absolute inset-0 font-sans select-none overflow-hidden flex flex-col"
    style="background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);"
  >
    
    <!-- HUD Sidebar -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="3"
    />

    <!-- Question Banner - smoothly animates position -->
    <div 
      v-if="gameActive" 
      class="absolute z-40 question-banner"
      :style="questionBannerStyle"
    >
      <div class="bg-white py-2 px-4 rounded-xl shadow-md inline-block">
        <p 
          class="font-bold text-slate-700 text-center whitespace-nowrap"
          :class="bannerTextClass"
        >
          {{ currentPrompt }}
        </p>
      </div>
    </div>

    <!-- Game Area -->
    <div 
      v-if="gameActive" 
      class="flex-1 flex items-center justify-center px-2 pb-3"
      :style="{ paddingTop: gameAreaPadding }"
    >
      <div 
        class="grid w-full"
        :class="gridClass"
      >
        <div 
          v-for="(hole, index) in holes" 
          :key="index" 
          class="relative cursor-pointer"
          @mousedown.prevent="handleWhack(index)"
          @touchstart.prevent="handleWhack(index)"
        >
          <!-- Answer Bubble - closer to head, auto-width -->
          <div 
            v-if="hole.active"
            class="absolute z-30 left-1/2 bubble-position"
            style="bottom: 75%;"
          >
            <div 
              class="py-1 px-2 rounded-lg shadow-md border-2 inline-block"
              :class="getAnswerBubbleClass(hole)"
            >
              <span 
                class="font-bold text-slate-700 whitespace-nowrap"
                :class="answerTextClass"
              >
                {{ hole.content }}
              </span>
            </div>
          </div>

          <!-- Hole Container -->
          <div class="relative w-full aspect-square">
            
            <!-- Dark hole background -->
            <div class="absolute bottom-[15%] left-[10%] w-[80%] h-[30%] bg-amber-950 rounded-[50%]"></div>

            <!-- Mole clip area -->
            <div class="absolute bottom-[28%] left-[15%] w-[70%] h-[50%] overflow-hidden">
              <div 
                class="mole-wrapper"
                :style="{ transform: `translateX(-50%) translateY(${hole.active ? '5%' : '100%'})` }"
              >
                <div 
                  class="relative w-full aspect-[1/0.85]"
                  :class="getMoleEffectClass(hole)"
                >
                  <!-- Main body -->
                  <div 
                    class="absolute inset-0 rounded-[50%] shadow-md"
                    style="background: linear-gradient(180deg, #D4A574 0%, #B8845A 100%);"
                  ></div>
                  
                  <!-- Left ear -->
                  <div 
                    class="absolute w-[18%] aspect-square rounded-full"
                    style="top: -6%; left: 18%; background: #C4956A;"
                  ></div>
                  
                  <!-- Right ear -->
                  <div 
                    class="absolute w-[18%] aspect-square rounded-full"
                    style="top: -6%; right: 18%; background: #C4956A;"
                  ></div>
                  
                  <!-- Two dot eyes -->
                  <div class="absolute w-[10%] aspect-square bg-slate-800 rounded-full" style="top: 38%; left: 30%;"></div>
                  <div class="absolute w-[10%] aspect-square bg-slate-800 rounded-full" style="top: 38%; right: 30%;"></div>
                  
                  <!-- Pink nose -->
                  <div class="absolute w-[7%] aspect-square bg-pink-400 rounded-full" style="top: 58%; left: 50%; transform: translateX(-50%);"></div>
                </div>
              </div>
            </div>

            <!-- Dirt mound - static -->
            <div class="absolute bottom-0 left-0 w-full h-[38%] pointer-events-none">
              <div 
                class="absolute bottom-0 w-full h-full rounded-t-[100%]"
                style="background: linear-gradient(0deg, #5D4037 0%, #795548 50%, #8D6E63 100%);"
              ></div>
              <!-- Grass -->
              <div class="absolute top-0 left-[10%] w-[80%] flex justify-around">
                <div class="grass-blade" style="height: 10px; transform: rotate(-12deg) translateY(-4px);"></div>
                <div class="grass-blade" style="height: 14px; transform: rotate(6deg) translateY(-4px); background: #34d399;"></div>
                <div class="grass-blade" style="height: 8px; transform: rotate(-6deg) translateY(-4px);"></div>
                <div class="grass-blade" style="height: 12px; transform: rotate(12deg) translateY(-4px); background: #34d399;"></div>
                <div class="grass-blade" style="height: 10px; transform: rotate(3deg) translateY(-4px);"></div>
              </div>
            </div>
          </div>

          <!-- Hit Effect -->
          <div 
            v-if="hole.showEffect" 
            class="absolute top-0 left-1/2 text-2xl z-40 pointer-events-none"
            style="transform: translateX(-50%);"
          >
            {{ hole.state === 'hit' ? '⭐' : '❌' }}
          </div>
        </div>
      </div>
    </div>

    <!-- START SCREEN -->
    <div 
      v-if="!gameActive && !isGameOver" 
      class="absolute inset-0 flex items-center justify-center p-4 z-50"
      style="background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);"
    >
      <div class="text-center max-w-xs w-full">
        <div class="text-6xl mb-4 animate-bounce">🐹</div>
        <h1 class="text-2xl font-extrabold text-white mb-2">Whack-a-Mole!</h1>
        <p class="text-sm text-white/80 mb-6">
          Tap moles with <strong class="text-white">correct answers</strong>!
        </p>
        
        <div class="flex justify-center gap-3 mb-6">
          <div class="bg-white/20 px-3 py-1.5 rounded-lg">
            <span class="text-xs font-bold text-white">❤️ {{ maxLives }}</span>
          </div>
          <div class="bg-white/20 px-3 py-1.5 rounded-lg">
            <span class="text-xs font-bold text-white">⏱️ {{ initialTime }}s</span>
          </div>
          <div class="bg-white/20 px-3 py-1.5 rounded-lg">
            <span class="text-xs font-bold text-white">🎯 {{ targetScore }}</span>
          </div>
        </div>

        <button 
          @click="startGame"
          class="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold shadow-lg 
                 hover:scale-105 active:scale-100 transition-transform"
        >
          Start Game ▶
        </button>
      </div>
    </div>

    <!-- GAME OVER -->
    <div 
      v-if="isGameOver" 
      class="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
    >
      <div class="bg-white rounded-2xl p-6 text-center max-w-xs w-full shadow-xl">
        <div class="text-4xl mb-2">
          {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👍' : '💪' }}
        </div>
        
        <h2 class="text-xl font-bold text-slate-800">
          {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great!' : earnedStars >= 1 ? 'Good!' : 'Try Again!' }}
        </h2>

        <div class="text-3xl font-bold text-indigo-500 my-2">{{ score }}</div>

        <div class="flex justify-center gap-1 mb-4">
          <span 
            v-for="n in 3" 
            :key="n" 
            class="text-2xl"
            :class="n <= earnedStars ? 'text-amber-400' : 'text-slate-200'"
          >★</span>
        </div>

        <div class="flex justify-around mb-4 text-sm">
          <div>
            <div class="text-slate-400">Correct</div>
            <div class="font-bold text-green-500">{{ correctHits }}</div>
          </div>
          <div>
            <div class="text-slate-400">Wrong</div>
            <div class="font-bold text-red-500">{{ wrongHits }}</div>
          </div>
          <div>
            <div class="text-slate-400">Accuracy</div>
            <div class="font-bold">{{ accuracy }}%</div>
          </div>
        </div>

        <div class="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-indigo-500 transition-all" :style="{ width: progressWidth + '%' }"></div>
        </div>
        <p class="text-xs text-slate-400 mt-1">{{ Math.ceil(progressWidth / 20) }}s...</p>
      </div>
    </div>
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

// Refs
const gameWrapper = ref(null);
const containerWidth = ref(600);
let resizeObserver = null;

// Question banner - smoothly transitions position based on container width
// As container gets smaller, banner moves down (below HUD) and slightly right
const questionBannerStyle = computed(() => {
  const w = containerWidth.value;
  
  // Calculate position based on width
  // Wide: centered near top
  // Narrow: lower and more to the right to avoid HUD overlap
  
  // Formula-based positioning for smooth transition
  // Starts moving at 900px, stops at 300px
  const startW = 900;
  const endW = 300;
  
  // Calculate progress 0..1 (0 at startW, 1 at endW)
  const progress = Math.min(Math.max((startW - w) / (startW - endW), 0), 1);
  
  // Interpolate values
  // Top: 70px -> 200px
  const top = 70 + (200 - 70) * progress;
  
  // Left: 50% -> 55%
  const left = 50 + (55 - 50) * progress;
  
  // TranslateX is constant
  const translateX = -50;
  
  return {
    top: `${top}px`,
    left: `${left}%`,
    transform: `translateX(${translateX}%)`
  };
});

// Game area padding - matches banner position
const gameAreaPadding = computed(() => {
  const w = containerWidth.value;
  // Formula-based padding
  // Starts at 900px, stops at 300px
  const startW = 900;
  const endW = 300;
  
  // Calculate progress 0..1
  const progress = Math.min(Math.max((startW - w) / (startW - endW), 0), 1);
  
  // Padding: 110px -> 220px
  const padding = 110 + (220 - 110) * progress;
  
  return `${padding}px`;
});

// Grid responsive
const gridClass = computed(() => {
  const w = containerWidth.value;
  if (w < 300) return 'grid-cols-2 gap-1 max-w-[240px] mx-auto';
  if (w < 400) return 'grid-cols-2 gap-2 max-w-[300px] mx-auto';
  if (w < 500) return 'grid-cols-2 gap-2 max-w-[340px] mx-auto';
  return 'grid-cols-4 gap-2 max-w-[500px] mx-auto';
});

// Text sizes
const bannerTextClass = computed(() => {
  const w = containerWidth.value;
  if (w < 300) return 'text-xs';
  if (w < 400) return 'text-sm';
  return 'text-base';
});

const answerTextClass = computed(() => {
  const w = containerWidth.value;
  if (w < 350) return 'text-xs';
  return 'text-sm';
});

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
  return (props.gameData?.questions?.length > 0) ? 'question' : 'category';
});

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

// Mole effect class for hit/miss states
const getMoleEffectClass = (hole) => {
  if (hole.state === 'hit') return 'mole-hit';
  if (hole.state === 'miss') return 'mole-miss';
  return '';
};

const getAnswerBubbleClass = (hole) => {
  if (hole.state === 'hit') return 'border-green-400 bg-green-50';
  if (hole.state === 'miss') return 'border-red-400 bg-red-50';
  return 'border-amber-300 bg-white';
};

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

// Spawn mole
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
      content = wrong.length > 0 ? wrong[Math.floor(Math.random() * wrong.length)] : "✗";
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
      isCorrect = item.isCorrect ?? item.correct ?? true;
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

// Whack handler
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
    if (mode.value === 'question') setTimeout(() => nextQuestion(), 400);
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
  }, 350);
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    holes.value.forEach(h => { h.active = false; clearTimeout(h.timer); });
  } else {
    finishGame();
  }
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
  }, 500);
};

const stopGame = () => {
  gameActive.value = false;
  if (gameInterval.value) {
    clearInterval(gameInterval.value);
    gameInterval.value = null;
  }
  holes.value.forEach(h => { if (h.timer) clearTimeout(h.timer); });
};

const setupResizeObserver = () => {
  if (!gameWrapper.value) return;
  resizeObserver = new ResizeObserver((entries) => {
    containerWidth.value = entries[0].contentRect.width;
  });
  resizeObserver.observe(gameWrapper.value);
  containerWidth.value = gameWrapper.value.offsetWidth;
};

// Watchers
watch(() => props.score, (val) => { if (val >= targetScore.value && gameActive.value) finishGame(); });
watch(() => props.lives, (val) => { if (val <= 0 && gameActive.value) finishGame(); });
watch(() => props.timeRemaining, (val) => { if (val <= 0 && gameActive.value) finishGame(); });

onMounted(() => {
  initHoles();
  setupResizeObserver();
});

onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
/* Question banner - smooth transition when resizing */
.question-banner {
  transition: top 0.3s ease-out, left 0.3s ease-out, transform 0.3s ease-out;
}

/* Mole wrapper - handles the up/down animation */
.mole-wrapper {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 80%;
  transition: transform 0.15s ease-out;
}

/* Answer bubble positioning - centered above mole */
.bubble-position {
  transform: translateX(-50%);
}

/* Grass blade styling */
.grass-blade {
  width: 4px;
  background: #10b981;
  border-radius: 2px 2px 0 0;
  transform-origin: bottom center;
}

/* Mole hit effect */
.mole-hit {
  filter: brightness(1.25);
  transform: scale(0.9);
}

/* Mole miss effect */
.mole-miss {
  filter: brightness(0.75);
  animation: wiggle 0.25s ease-in-out;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}
</style>