<template>
  <div 
    ref="gameWrapper"
    class="absolute inset-0 bg-gradient-to-b from-emerald-400 to-green-500 font-sans select-none overflow-hidden flex flex-col"
  >
    
    <!-- HUD Sidebar - Top Right -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="3"
    />

    <!-- Question Banner - Responds to container size -->
    <div 
      v-if="gameActive" 
      class="absolute z-50 left-1/2 -translate-x-1/2 transition-all duration-300 ease-out px-3"
      :style="questionBannerStyle"
    >
      <div class="bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-lg shadow-black/10 border border-amber-200">
        <p 
          class="font-bold text-slate-800 text-center leading-snug"
          :class="containerSize === 'xs' ? 'text-xs' : containerSize === 'sm' ? 'text-sm' : 'text-base'"
        >
          {{ currentPrompt }}
        </p>
      </div>
    </div>

    <!-- Game Area -->
    <div 
      v-if="gameActive" 
      class="flex-1 flex items-center justify-center px-3 pb-4"
      :style="{ paddingTop: gameAreaPaddingTop }"
    >
      <div 
        class="grid gap-2 w-full"
        :class="gridClass"
      >
        <div 
          v-for="(hole, index) in holes" 
          :key="index" 
          class="relative flex flex-col items-center cursor-pointer"
          @mousedown.prevent="handleWhack(index)"
          @touchstart.prevent="handleWhack(index)"
        >
          <!-- Answer Sign - Speech bubble above hole -->
          <transition name="sign">
            <div 
              v-if="hole.active"
              class="relative mb-1 z-30"
            >
              <div 
                class="bg-white px-2.5 py-1.5 rounded-xl shadow-md border-2 transition-colors duration-150"
                :class="{
                  'border-amber-300': hole.state === 'idle',
                  'border-green-400 bg-green-50': hole.state === 'hit',
                  'border-red-400 bg-red-50 animate-shake': hole.state === 'miss'
                }"
              >
                <span 
                  class="font-bold text-slate-700 whitespace-nowrap"
                  :class="containerSize === 'xs' ? 'text-xs' : 'text-sm'"
                >
                  {{ hole.content }}
                </span>
              </div>
              <!-- Speech bubble pointer -->
              <div class="absolute left-1/2 -translate-x-1/2 -bottom-1.5">
                <div 
                  class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]"
                  :class="{
                    'border-t-amber-300': hole.state === 'idle',
                    'border-t-green-400': hole.state === 'hit',
                    'border-t-red-400': hole.state === 'miss'
                  }"
                ></div>
              </div>
            </div>
          </transition>

          <!-- Hole Container -->
          <div class="relative w-full aspect-[1/0.8] overflow-hidden">
            
            <!-- Dark hole ellipse -->
            <div class="absolute bottom-[28%] left-[15%] w-[70%] h-[18%] bg-amber-900 rounded-[50%] z-[1]"></div>

            <!-- CUTE MOLE -->
            <div 
              class="absolute bottom-[32%] left-1/2 w-[55%] z-[5] transition-transform duration-200"
              :class="getMoleClass(hole)"
            >
              <!-- Mole SVG - Cute Cartoon Style -->
              <svg viewBox="0 0 100 90" class="w-full h-auto drop-shadow-md">
                <!-- Body/Head - main brown circle -->
                <ellipse cx="50" cy="50" rx="38" ry="35" fill="#8B6914"/>
                <ellipse cx="50" cy="52" rx="35" ry="32" fill="#A67C00"/>
                
                <!-- Ears -->
                <circle cx="18" cy="30" r="12" fill="#8B6914"/>
                <circle cx="18" cy="30" r="7" fill="#FFCDD2"/>
                <circle cx="82" cy="30" r="12" fill="#8B6914"/>
                <circle cx="82" cy="30" r="7" fill="#FFCDD2"/>
                
                <!-- Face highlight -->
                <ellipse cx="50" cy="48" rx="28" ry="25" fill="#C4980A"/>
                
                <!-- Eyes - big and cute -->
                <ellipse cx="35" cy="42" rx="10" ry="11" fill="white"/>
                <ellipse cx="65" cy="42" rx="10" ry="11" fill="white"/>
                
                <!-- Pupils - looking up slightly -->
                <circle cx="36" cy="40" r="5" fill="#2D1B00"/>
                <circle cx="66" cy="40" r="5" fill="#2D1B00"/>
                
                <!-- Eye shine -->
                <circle cx="38" cy="38" r="2" fill="white"/>
                <circle cx="68" cy="38" r="2" fill="white"/>
                
                <!-- Cute pink nose -->
                <ellipse cx="50" cy="58" rx="8" ry="6" fill="#E91E63"/>
                <ellipse cx="50" cy="56" rx="3" ry="2" fill="#F48FB1" opacity="0.6"/>
                
                <!-- Smile -->
                <path d="M 40 68 Q 50 76 60 68" stroke="#5D4037" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                
                <!-- Rosy cheeks -->
                <circle cx="25" cy="55" r="6" fill="#FFCDD2" opacity="0.7"/>
                <circle cx="75" cy="55" r="6" fill="#FFCDD2" opacity="0.7"/>
                
                <!-- Whisker dots -->
                <circle cx="38" cy="62" r="1.5" fill="#5D4037"/>
                <circle cx="42" cy="65" r="1.5" fill="#5D4037"/>
                <circle cx="58" cy="65" r="1.5" fill="#5D4037"/>
                <circle cx="62" cy="62" r="1.5" fill="#5D4037"/>
              </svg>
            </div>

            <!-- Dirt Mound (front - covers mole when down) -->
            <div class="absolute bottom-0 left-0 w-full h-[40%] z-10 pointer-events-none">
              <!-- Main dirt mound -->
              <div class="absolute bottom-0 w-full h-full bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-[50%]"></div>
              <!-- Dirt highlight -->
              <div class="absolute bottom-0 left-[10%] w-[80%] h-[85%] bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-[50%]"></div>
              <!-- Grass tufts -->
              <div class="absolute -top-1 left-[5%] w-[90%] flex justify-around">
                <div class="w-1.5 h-3 bg-green-500 rounded-t-full -rotate-12"></div>
                <div class="w-1.5 h-4 bg-green-400 rounded-t-full rotate-6"></div>
                <div class="w-1.5 h-2.5 bg-green-500 rounded-t-full -rotate-6"></div>
                <div class="w-1.5 h-3.5 bg-green-400 rounded-t-full rotate-12"></div>
                <div class="w-1.5 h-3 bg-green-500 rounded-t-full -rotate-3"></div>
              </div>
            </div>
          </div>

          <!-- Hit Effect -->
          <transition name="effect">
            <div 
              v-if="hole.showEffect" 
              class="absolute top-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
              :class="containerSize === 'xs' ? 'text-2xl' : 'text-3xl'"
            >
              {{ hole.state === 'hit' ? '✨' : '💥' }}
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- START SCREEN -->
    <div 
      v-if="!gameActive && !isGameOver" 
      class="absolute inset-0 bg-gradient-to-b from-emerald-300 to-green-500 
             flex items-center justify-center p-4 z-50"
    >
      <div class="text-center max-w-sm w-full">
        <div class="text-5xl sm:text-6xl mb-3 animate-bounce">🐹</div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-white mb-2 drop-shadow-md">
          Whack-a-Mole!
        </h1>
        <p class="text-sm text-white/90 mb-5 leading-relaxed px-2">
          Tap the moles with <strong class="text-white">correct answers</strong> to score!
        </p>
        
        <div class="flex justify-center gap-2 mb-5 flex-wrap">
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span class="text-sm">❤️</span>
            <span class="text-xs font-bold text-white">{{ maxLives }}</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span class="text-sm">⏱️</span>
            <span class="text-xs font-bold text-white">{{ initialTime }}s</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span class="text-sm">🎯</span>
            <span class="text-xs font-bold text-white">{{ targetScore }}pts</span>
          </div>
        </div>

        <button 
          @click="startGame"
          class="bg-white text-green-600 px-8 py-3 rounded-full text-base font-bold 
                 shadow-lg hover:-translate-y-0.5 hover:shadow-xl 
                 active:translate-y-0 transition-all duration-150
                 inline-flex items-center gap-2"
        >
          <span>Start Game</span>
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
      </div>
    </div>

    <!-- COMPLETION OVERLAY -->
    <transition name="slide-up">
      <div 
        v-if="isGameOver" 
        class="absolute inset-0 bg-black/60 backdrop-blur-sm 
               flex items-center justify-center p-4 z-[100]"
      >
        <div class="bg-white rounded-2xl p-5 text-center max-w-xs w-full shadow-2xl animate-card-in">
          <div class="text-4xl mb-1">
            {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👏' : '💪' }}
          </div>
          
          <h2 class="text-lg font-extrabold text-slate-800 mb-0.5">
            {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great Job!' : earnedStars >= 1 ? 'Good Work!' : 'Nice Try!' }}
          </h2>

          <div class="text-2xl font-extrabold text-green-500 mb-3">
            {{ score }} points
          </div>

          <div class="flex justify-center gap-1 mb-4">
            <span 
              v-for="n in 3" 
              :key="n" 
              class="text-2xl transition-all duration-300"
              :class="n <= earnedStars ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'"
            >
              ★
            </span>
          </div>

          <div class="flex justify-center gap-4 mb-4 p-3 bg-slate-50 rounded-xl text-center">
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Correct</div>
              <div class="text-base font-bold text-green-500">{{ correctHits }}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Wrong</div>
              <div class="text-base font-bold text-red-500">{{ wrongHits }}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Accuracy</div>
              <div class="text-base font-bold text-slate-700">{{ accuracy }}%</div>
            </div>
          </div>

          <div class="h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
            <div 
              class="h-full bg-green-500 rounded-full transition-all duration-50"
              :style="{ width: progressWidth + '%' }"
            ></div>
          </div>
          <p class="text-[10px] text-slate-400">
            Continuing in {{ Math.ceil(progressWidth / 20) }}s...
          </p>
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

// Refs
const gameWrapper = ref(null);
const containerWidth = ref(500);
const containerHeight = ref(400);
let resizeObserver = null;

// Container size category
const containerSize = computed(() => {
  if (containerWidth.value < 280) return 'xs';
  if (containerWidth.value < 400) return 'sm';
  if (containerWidth.value < 550) return 'md';
  return 'lg';
});

// Question banner positioning based on container size
const questionBannerStyle = computed(() => {
  // The smaller the container, the lower and more compact the banner
  if (containerWidth.value < 280) {
    return { top: '100px', maxWidth: '95%' };
  } else if (containerWidth.value < 350) {
    return { top: '90px', maxWidth: '92%' };
  } else if (containerWidth.value < 450) {
    return { top: '80px', maxWidth: '88%' };
  } else if (containerWidth.value < 550) {
    return { top: '75px', maxWidth: '85%' };
  }
  return { top: '70px', maxWidth: '80%' };
});

// Game area padding to account for banner position
const gameAreaPaddingTop = computed(() => {
  if (containerWidth.value < 280) return '140px';
  if (containerWidth.value < 350) return '130px';
  if (containerWidth.value < 450) return '120px';
  if (containerWidth.value < 550) return '115px';
  return '110px';
});

// Grid class based on container size
const gridClass = computed(() => {
  if (containerWidth.value < 320) {
    return 'grid-cols-2 gap-1.5 max-w-[280px] mx-auto';
  } else if (containerWidth.value < 450) {
    return 'grid-cols-2 gap-2 max-w-[350px] mx-auto';
  }
  return 'grid-cols-4 gap-2 max-w-[600px] mx-auto';
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

// Get mole transform class
const getMoleClass = (hole) => {
  const base = '-translate-x-1/2';
  if (!hole.active) {
    return `${base} translate-y-[120%]`; // Hidden below mound
  }
  if (hole.state === 'hit') {
    return `${base} translate-y-0 scale-90 brightness-110`;
  }
  if (hole.state === 'miss') {
    return `${base} translate-y-0 animate-mole-shake`;
  }
  return `${base} translate-y-0`; // Popped up
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

// Setup resize observer to track container size
const setupResizeObserver = () => {
  if (!gameWrapper.value) return;
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
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
  setupResizeObserver();
});

onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
/* Sign transition */
.sign-enter-active {
  animation: signPopIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sign-leave-active {
  animation: signPopOut 0.15s ease-out;
}

@keyframes signPopIn {
  0% { opacity: 0; transform: scale(0.6) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes signPopOut {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.8) translateY(-5px); }
}

/* Effect transition */
.effect-enter-active {
  animation: effectPop 0.35s ease-out;
}
.effect-leave-active {
  animation: effectFade 0.2s ease-out;
}

@keyframes effectPop {
  0% { transform: translateX(-50%) scale(0.3); opacity: 0; }
  50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
  100% { transform: translateX(-50%) scale(1) translateY(-15px); opacity: 0.7; }
}

@keyframes effectFade {
  to { opacity: 0; transform: translateX(-50%) translateY(-25px); }
}

/* Slide up transition */
.slide-up-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-up-leave-active {
  transition: all 0.25s ease-in;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(60px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

/* Shake animation */
@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-4deg); }
  75% { transform: rotate(4deg); }
}
.animate-shake {
  animation: shake 0.25s ease-in-out;
}

/* Mole shake */
@keyframes moleShake {
  0%, 100% { transform: translateX(-50%) translateY(0) rotate(0); }
  20% { transform: translateX(-50%) translateY(0) rotate(-12deg); }
  40% { transform: translateX(-50%) translateY(0) rotate(10deg); }
  60% { transform: translateX(-50%) translateY(0) rotate(-8deg); }
  80% { transform: translateX(-50%) translateY(0) rotate(5deg); }
}
.animate-mole-shake {
  animation: moleShake 0.35s ease-in-out;
}

/* Card entrance */
@keyframes cardIn {
  from { transform: scale(0.85) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
.animate-card-in {
  animation: cardIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>