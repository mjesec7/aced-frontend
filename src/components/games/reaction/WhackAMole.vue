<template>
  <div 
    ref="gameWrapper"
    class="absolute inset-0 font-sans select-none overflow-hidden flex flex-col safe-area-padding"
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

    <!-- Question Banner -->
    <div 
      v-if="gameActive" 
      class="absolute top-0 left-0 right-0 z-40 flex justify-center pt-3 px-3 pointer-events-none"
      :class="bannerTopClass"
    >
      <div 
        :key="currentQuestionIndex"
        class="relative group pointer-events-auto banner-float banner-pop"
      >
        <!-- Premium background with glow -->
        <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div class="relative bg-white py-2.5 px-5 sm:py-3 sm:px-6 rounded-2xl shadow-2xl border-2 border-indigo-50 inline-block min-w-[140px] sm:min-w-[180px]">
          <!-- Question Label -->
          <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm whitespace-nowrap">
            Question
          </div>
          
          <p 
            class="font-black text-indigo-950 text-center tracking-tight leading-tight break-words"
            :class="bannerTextClass"
          >
            {{ currentPrompt }}
          </p>
        </div>
      </div>
    </div>

    <!-- Game Area -->
    <div 
      v-if="gameActive" 
      class="flex-1 flex items-center justify-center px-2 pb-3 min-h-0 overflow-hidden"
      :class="gameAreaPaddingClass"
    >
      <div 
        class="grid w-full h-full"
        :class="gridClass"
      >
        <div 
          v-for="(hole, index) in holes" 
          :key="index" 
          class="relative cursor-pointer tap-highlight-none touch-manipulation"
          @mousedown.prevent="handleWhack(index)"
          @touchstart="handleTouchWhack(index, $event)"
        >
          <!-- Answer Bubble -->
          <div 
            v-if="hole.active"
            class="absolute z-30 left-1/2 -translate-x-1/2 bubble-pop"
            style="bottom: 75%;"
          >
            <div 
              class="py-1 px-2 sm:px-3 rounded-lg shadow-md border-2 inline-block"
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
                class="mole-wrapper absolute bottom-0 left-1/2 w-[80%]"
                :class="hole.active ? 'mole-up' : 'mole-down'"
              >
                <div 
                  class="relative w-full aspect-[1/0.85] transition-all duration-150"
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
                <div class="grass-blade grass-light" style="height: 14px; transform: rotate(6deg) translateY(-4px);"></div>
                <div class="grass-blade" style="height: 8px; transform: rotate(-6deg) translateY(-4px);"></div>
                <div class="grass-blade grass-light" style="height: 12px; transform: rotate(12deg) translateY(-4px);"></div>
                <div class="grass-blade" style="height: 10px; transform: rotate(3deg) translateY(-4px);"></div>
              </div>
            </div>
          </div>

          <!-- Hit Effect -->
          <div 
            v-if="hole.showEffect" 
            class="absolute top-0 left-1/2 -translate-x-1/2 text-xl sm:text-2xl z-40 pointer-events-none hit-float"
          >
            {{ hole.state === 'hit' ? '⭐' : '❌' }}
          </div>
        </div>
      </div>
    </div>

    <!-- START SCREEN -->
    <div 
      v-if="!gameActive && !isGameOver" 
      class="absolute inset-0 flex flex-col items-center justify-center z-50 overflow-y-auto p-4 sm:p-6 safe-area-padding"
      style="background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); -webkit-overflow-scrolling: touch;"
    >
      <div class="text-center w-full max-w-xs mx-auto py-6 sm:py-8 my-auto flex flex-col items-center">
        <div class="text-5xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">🐹</div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-white mb-1 sm:mb-2">Whack-a-Mole!</h1>
        <p class="text-xs sm:text-sm text-white/80 mb-5 sm:mb-6 px-2">
          Tap moles with <strong class="text-white">correct answers</strong>!
        </p>
        
        <div class="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5 sm:mb-6">
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/10">
            <span class="text-xs sm:text-sm font-bold text-white">❤️ {{ maxLives }}</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/10">
            <span class="text-xs sm:text-sm font-bold text-white">⏱️ {{ initialTime }}s</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/10">
            <span class="text-xs sm:text-sm font-bold text-white">🎯 {{ targetScore }}</span>
          </div>
        </div>

        <button 
          @click="startGame"
          @touchend.prevent="handleStartTouch"
          class="bg-white text-indigo-600 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-xl 
                 hover:scale-105 active:scale-95 transition-transform duration-150 
                 min-h-[48px] min-w-[160px] tap-highlight-none touch-manipulation"
        >
          Start Game ▶
        </button>
      </div>
    </div>

    <!-- GAME OVER -->
    <div 
      v-if="isGameOver" 
      class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
    >
      <div class="bg-white rounded-2xl p-5 sm:p-6 text-center max-w-xs w-full shadow-2xl animate-modal-pop">
        <div class="text-4xl sm:text-5xl mb-2">
          {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👍' : '💪' }}
        </div>
        
        <h2 class="text-lg sm:text-xl font-bold text-slate-800">
          {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great!' : earnedStars >= 1 ? 'Good!' : 'Try Again!' }}
        </h2>

        <div class="text-3xl sm:text-4xl font-bold text-indigo-500 my-2">{{ score }}</div>

        <div class="flex justify-center gap-1 mb-4">
          <span 
            v-for="n in 3" 
            :key="n" 
            class="text-2xl sm:text-3xl transition-colors"
            :class="n <= earnedStars ? 'text-amber-400' : 'text-slate-200'"
          >★</span>
        </div>

        <div class="flex justify-around mb-4 text-sm">
          <div class="flex-1">
            <div class="text-slate-400 text-xs">Correct</div>
            <div class="font-bold text-green-500">{{ correctHits }}</div>
          </div>
          <div class="flex-1">
            <div class="text-slate-400 text-xs">Wrong</div>
            <div class="font-bold text-red-500">{{ wrongHits }}</div>
          </div>
          <div class="flex-1">
            <div class="text-slate-400 text-xs">Accuracy</div>
            <div class="font-bold text-slate-700">{{ accuracy }}%</div>
          </div>
        </div>

        <div class="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-indigo-500 transition-all duration-50" :style="{ width: progressWidth + '%' }"></div>
        </div>
        <p class="text-xs text-slate-400 mt-1">{{ Math.ceil(progressWidth / 20) }}s...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import GameHUDSidebar from '../base/GameHUDSidebar.vue';

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
const AUTO_DISMISS_DURATION = 5000;

// Refs
const gameWrapper = ref(null);
const containerWidth = ref(400);
const containerHeight = ref(600);
let resizeObserver = null;

// Responsive computed classes
const bannerTopClass = computed(() => {
  // Add extra top padding on small screens to account for HUD
  return containerWidth.value < 400 ? 'pt-2' : 'pt-3';
});

const bannerTextClass = computed(() => {
  const w = containerWidth.value;
  if (w < 300) return 'text-sm';
  if (w < 400) return 'text-base';
  return 'text-lg sm:text-xl';
});

const answerTextClass = computed(() => {
  const w = containerWidth.value;
  if (w < 350) return 'text-[10px] sm:text-xs';
  return 'text-xs sm:text-sm';
});

const gameAreaPaddingClass = computed(() => {
  // Responsive top padding for game area based on container size
  const w = containerWidth.value;
  const h = containerHeight.value;
  
  if (h < 450) return 'pt-14';
  if (w < 350) return 'pt-16';
  return 'pt-20 sm:pt-24';
});

// Grid responsive - adapts to container size
const gridClass = computed(() => {
  const w = containerWidth.value;
  const h = containerHeight.value;
  const isLandscape = w > h;
  
  // Very small screens or landscape mobile - 4 columns
  if (h < 400 && isLandscape) {
    return 'grid-cols-4 gap-1 max-w-[400px] max-h-[120px] mx-auto place-items-center';
  }
  
  if (w < 280) return 'grid-cols-2 gap-1 max-w-[200px] max-h-[220px] mx-auto place-items-center';
  if (w < 350) return 'grid-cols-2 gap-1.5 max-w-[260px] max-h-[280px] mx-auto place-items-center';
  if (w < 450) return 'grid-cols-2 gap-2 max-w-[320px] max-h-[340px] mx-auto place-items-center';
  
  return 'grid-cols-4 gap-2 sm:gap-3 max-w-[500px] max-h-[280px] mx-auto place-items-center';
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
  holes.value = Array.from({ length: 4 }, () => ({
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

// Separate touch handler to prevent ghost clicks
const handleTouchWhack = (index, event) => {
  event.preventDefault();
  event.stopPropagation();
  handleWhack(index);
};

// Handle start button touch separately
const handleStartTouch = (event) => {
  event.preventDefault();
  event.stopPropagation();
  startGame();
};

// Whack handler
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
  
  // Small delay before spawning to ensure UI is ready
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
    const entry = entries[0];
    if (entry) {
      containerWidth.value = entry.contentRect.width;
      containerHeight.value = entry.contentRect.height;
    }
  });
  resizeObserver.observe(gameWrapper.value);
  
  // Initial measurement
  containerWidth.value = gameWrapper.value.offsetWidth;
  containerHeight.value = gameWrapper.value.offsetHeight;
};

// Watchers
watch(() => props.score, (val) => { if (val >= targetScore.value && gameActive.value) finishGame(); });
watch(() => props.lives, (val) => { if (val <= 0 && gameActive.value) finishGame(); });
watch(() => props.timeRemaining, (val) => { if (val <= 0 && gameActive.value) finishGame(); });

onMounted(() => {
  initHoles();
  nextTick(() => {
    setupResizeObserver();
  });
});

onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
/* Safe area padding for notched devices (iPhone X+, etc.) */
.safe-area-padding {
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}

/* Disable tap highlight on mobile */
.tap-highlight-none {
  -webkit-tap-highlight-color: transparent;
}

/* Touch manipulation for better touch response */
.touch-manipulation {
  touch-action: manipulation;
}

/* Question banner animations */
.banner-float {
  animation: float 3s ease-in-out infinite;
}

.banner-pop {
  animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Answer bubble pop animation */
.bubble-pop {
  animation: bubble-pop 0.2s ease-out;
}

@keyframes bubble-pop {
  0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}

/* Mole wrapper - handles the up/down animation */
.mole-wrapper {
  transition: transform 0.15s ease-out;
}

.mole-up {
  transform: translateX(-50%) translateY(5%);
}

.mole-down {
  transform: translateX(-50%) translateY(100%);
}

/* Grass blade styling */
.grass-blade {
  width: 4px;
  background: #10b981;
  border-radius: 2px 2px 0 0;
  transform-origin: bottom center;
}

.grass-light {
  background: #34d399;
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

/* Hit effect floating animation */
.hit-float {
  animation: hit-float 0.5s ease-out forwards;
}

@keyframes hit-float {
  0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(1.3); }
}

/* Modal pop animation */
.animate-modal-pop {
  animation: modal-pop 0.3s ease-out;
}

@keyframes modal-pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Responsive adjustments for very small screens */
@media (max-height: 500px) {
  .banner-float {
    animation: none;
  }
}

/* Landscape mobile specific */
@media (max-height: 450px) and (orientation: landscape) {
  .safe-area-padding {
    padding-top: 8px !important;
  }
}
</style>