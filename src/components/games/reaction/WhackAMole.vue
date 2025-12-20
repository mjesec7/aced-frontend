<template>
  <div class="absolute inset-0 bg-gradient-to-b from-emerald-400 to-green-500 font-sans select-none overflow-hidden flex flex-col">
    
    <!-- HUD Sidebar - Top Right -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="3"
    />

    <!-- Question Banner - Responsive positioning -->
    <div 
      v-if="gameActive" 
      class="absolute z-50 transition-all duration-300 ease-out
             top-20 left-1/2 -translate-x-1/2 max-w-[85%]
             sm:top-[72px]
             min-[400px]:top-24
             min-[350px]:top-28"
      :class="containerClass"
    >
      <div class="bg-white px-5 py-3 rounded-full shadow-lg shadow-black/15 border-2 border-amber-300">
        <p class="text-sm sm:text-base lg:text-lg font-bold text-slate-800 text-center whitespace-nowrap
                  max-[400px]:text-xs max-[400px]:whitespace-normal">
          {{ currentPrompt }}
        </p>
      </div>
    </div>

    <!-- Game Area -->
    <div 
      v-if="gameActive" 
      class="flex-1 flex items-center justify-center pt-36 pb-4 px-3
             sm:pt-32
             min-[400px]:pt-40
             min-[350px]:pt-44"
    >
      <div 
        class="grid gap-3 w-full max-w-full
               grid-cols-2 sm:grid-cols-4
               max-[350px]:gap-2"
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
              class="relative mb-2 z-30"
            >
              <div 
                class="bg-white px-3 py-2 rounded-xl shadow-lg border-3 transition-colors duration-150"
                :class="{
                  'border-amber-400': hole.state === 'idle',
                  'border-green-500 bg-green-50': hole.state === 'hit',
                  'border-red-500 bg-red-50 animate-shake': hole.state === 'miss'
                }"
              >
                <span class="text-sm sm:text-base lg:text-lg font-extrabold text-slate-800 whitespace-nowrap">
                  {{ hole.content }}
                </span>
              </div>
              <!-- Speech bubble pointer -->
              <div 
                class="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 
                       border-l-[10px] border-l-transparent 
                       border-r-[10px] border-r-transparent 
                       border-t-[10px]"
                :class="{
                  'border-t-amber-400': hole.state === 'idle',
                  'border-t-green-500': hole.state === 'hit',
                  'border-t-red-500': hole.state === 'miss'
                }"
              ></div>
              <div 
                class="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 
                       border-l-[8px] border-l-transparent 
                       border-r-[8px] border-r-transparent 
                       border-t-[8px]"
                :class="{
                  'border-t-white': hole.state === 'idle',
                  'border-t-green-50': hole.state === 'hit',
                  'border-t-red-50': hole.state === 'miss'
                }"
              ></div>
            </div>
          </transition>

          <!-- Hole Container - This clips the mole -->
          <div class="relative w-full aspect-square overflow-hidden">
            
            <!-- Dark hole background -->
            <div class="absolute bottom-[25%] left-[10%] w-[80%] h-[22%] 
                        bg-gradient-radial from-amber-900 to-amber-950 
                        rounded-[50%] shadow-inner z-[1]">
            </div>

            <!-- Mole Character -->
            <div 
              class="absolute bottom-[30%] left-1/2 w-[65%] z-[5]
                     transition-transform duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
              :class="{
                '-translate-x-1/2 translate-y-full': !hole.active,
                '-translate-x-1/2 translate-y-0': hole.active && hole.state === 'idle',
                '-translate-x-1/2 translate-y-0 scale-90': hole.state === 'hit',
                '-translate-x-1/2 translate-y-0 animate-mole-shake': hole.state === 'miss'
              }"
            >
              <!-- Mole Body -->
              <div class="flex flex-col items-center">
                <!-- Ears -->
                <div class="absolute top-[5%] w-full flex justify-between px-[5%] z-[1]">
                  <div class="w-[32%] aspect-square bg-gradient-to-br from-amber-600 to-amber-700 rounded-full relative">
                    <div class="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-pink-300 rounded-full"></div>
                  </div>
                  <div class="w-[32%] aspect-square bg-gradient-to-br from-amber-600 to-amber-700 rounded-full relative">
                    <div class="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-pink-300 rounded-full"></div>
                  </div>
                </div>
                
                <!-- Head -->
                <div class="w-full aspect-[1/0.85] bg-gradient-to-b from-amber-600 to-amber-700 
                            rounded-[48%_48%_42%_42%] relative flex flex-col items-center pt-[25%] z-[2]
                            shadow-[inset_0_6px_12px_rgba(255,255,255,0.2),inset_0_-6px_12px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.2)]">
                  
                  <!-- Eyes -->
                  <div class="flex gap-[30%] mb-[10%]">
                    <div class="w-3 sm:w-4 aspect-square bg-white rounded-full shadow-inner relative">
                      <div class="absolute top-[20%] left-[20%] w-[60%] h-[60%] 
                                  bg-gradient-radial from-amber-800 to-amber-950 rounded-full">
                      </div>
                    </div>
                    <div class="w-3 sm:w-4 aspect-square bg-white rounded-full shadow-inner relative">
                      <div class="absolute top-[20%] left-[20%] w-[60%] h-[60%] 
                                  bg-gradient-radial from-amber-800 to-amber-950 rounded-full">
                      </div>
                    </div>
                  </div>
                  
                  <!-- Nose -->
                  <div class="w-4 sm:w-5 aspect-[1.3] bg-gradient-to-b from-amber-800 to-amber-900 rounded-full"></div>
                  
                  <!-- Cheeks -->
                  <div class="absolute top-[55%] w-full flex justify-between px-[8%]">
                    <div class="w-[22%] aspect-[1.2] bg-gradient-radial from-pink-300/50 to-transparent rounded-full"></div>
                    <div class="w-[22%] aspect-[1.2] bg-gradient-radial from-pink-300/50 to-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dirt Mound Front (covers mole when down) -->
            <div class="absolute bottom-0 left-0 w-full h-[38%] z-10 pointer-events-none">
              <div class="absolute bottom-0 w-full h-full 
                          bg-gradient-to-b from-amber-700 to-amber-800 
                          rounded-[50%_50%_8px_8px] shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
              </div>
              <!-- Grass tufts -->
              <div class="absolute -top-1 left-[10%] w-[80%] flex justify-around">
                <span class="w-[10%] h-2 bg-emerald-400 rounded-t-full -rotate-6"></span>
                <span class="w-[10%] h-3 bg-emerald-400 rounded-t-full rotate-3"></span>
                <span class="w-[10%] h-1.5 bg-emerald-400 rounded-t-full -rotate-3"></span>
                <span class="w-[10%] h-3 bg-emerald-400 rounded-t-full rotate-6"></span>
                <span class="w-[10%] h-2 bg-emerald-400 rounded-t-full -rotate-3"></span>
              </div>
            </div>
          </div>

          <!-- Hit Effect -->
          <transition name="effect">
            <div 
              v-if="hole.showEffect" 
              class="absolute top-0 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl z-40 pointer-events-none"
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
             flex items-center justify-center p-6 z-50"
    >
      <div class="text-center max-w-md w-full">
        <div class="text-6xl sm:text-7xl mb-4 animate-bounce">🐹</div>
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 drop-shadow-lg">
          Whack-a-Mole!
        </h1>
        <p class="text-sm sm:text-base text-white/90 mb-6 leading-relaxed">
          Tap the moles showing the <strong class="text-white">correct answers</strong> to score points.
          <br>Be quick - they won't stay up for long!
        </p>
        
        <div class="flex justify-center gap-3 mb-7 flex-wrap">
          <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
            <span>❤️</span>
            <span class="text-sm font-bold text-white">{{ maxLives }} lives</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
            <span>⏱️</span>
            <span class="text-sm font-bold text-white">{{ initialTime }}s</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
            <span>🎯</span>
            <span class="text-sm font-bold text-white">{{ targetScore }} pts</span>
          </div>
        </div>

        <button 
          @click="startGame"
          class="bg-white text-green-600 px-10 py-4 rounded-full text-lg font-bold 
                 shadow-xl shadow-black/20 hover:-translate-y-1 hover:shadow-2xl 
                 active:translate-y-0 transition-all duration-200
                 flex items-center gap-3 mx-auto"
        >
          <span>Start Game</span>
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
      </div>
    </div>

    <!-- COMPLETION OVERLAY -->
    <transition name="slide-up">
      <div 
        v-if="isGameOver" 
        class="absolute inset-0 bg-black/70 backdrop-blur-sm 
               flex items-center justify-center p-5 z-[100]"
      >
        <div class="bg-white rounded-3xl p-6 sm:p-8 text-center max-w-sm w-full shadow-2xl animate-card-in">
          <div class="text-5xl sm:text-6xl mb-2">
            {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👏' : '💪' }}
          </div>
          
          <h2 class="text-xl sm:text-2xl font-extrabold text-slate-800 mb-1">
            {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great Job!' : earnedStars >= 1 ? 'Good Work!' : 'Nice Try!' }}
          </h2>

          <div class="text-3xl sm:text-4xl font-extrabold text-green-500 mb-4">
            {{ score }} points
          </div>

          <div class="flex justify-center gap-1.5 mb-5">
            <span 
              v-for="n in 3" 
              :key="n" 
              class="text-3xl sm:text-4xl transition-all duration-300"
              :class="n <= earnedStars ? 'text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)] animate-star-pop' : 'text-slate-200'"
              :style="{ animationDelay: `${n * 0.1}s` }"
            >
              ★
            </span>
          </div>

          <div class="flex justify-center gap-5 mb-5 p-4 bg-slate-50 rounded-2xl">
            <div class="text-center">
              <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Correct</div>
              <div class="text-lg font-bold text-green-500">{{ correctHits }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Wrong</div>
              <div class="text-lg font-bold text-red-500">{{ wrongHits }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Accuracy</div>
              <div class="text-lg font-bold text-slate-700">{{ accuracy }}%</div>
            </div>
          </div>

          <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div 
              class="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-50"
              :style="{ width: progressWidth + '%' }"
            ></div>
          </div>
          <p class="text-xs text-slate-400">
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

// Container size class for responsive question positioning
const containerClass = ref('');

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
});

onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
});
</script>

<style scoped>
/* Radial gradient utilities not in Tailwind by default */
.bg-gradient-radial {
  background: radial-gradient(circle, var(--tw-gradient-stops));
}

/* Border width 3 */
.border-3 {
  border-width: 3px;
}

/* Sign transition */
.sign-enter-active {
  animation: signPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.sign-leave-active {
  animation: signPopOut 0.15s ease-in;
}

@keyframes signPopIn {
  0% { opacity: 0; transform: scale(0.5) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes signPopOut {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.8) translateY(-10px); }
}

/* Effect transition */
.effect-enter-active {
  animation: effectPop 0.4s ease-out;
}
.effect-leave-active {
  animation: effectFade 0.2s ease-in;
}

@keyframes effectPop {
  0% { transform: translateX(-50%) scale(0.3); opacity: 0; }
  50% { transform: translateX(-50%) scale(1.3); opacity: 1; }
  100% { transform: translateX(-50%) scale(1) translateY(-20px); opacity: 0.8; }
}

@keyframes effectFade {
  to { opacity: 0; transform: translateX(-50%) translateY(-30px); }
}

/* Slide up transition */
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

/* Shake animation */
@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-5px) rotate(-5deg); }
  75% { transform: translateX(5px) rotate(5deg); }
}
.animate-shake {
  animation: shake 0.3s ease-in-out;
}

/* Mole shake */
@keyframes moleShake {
  0%, 100% { transform: translateX(-50%) translateY(0) rotate(0); }
  25% { transform: translateX(-50%) translateY(0) rotate(-15deg); }
  75% { transform: translateX(-50%) translateY(0) rotate(15deg); }
}
.animate-mole-shake {
  animation: moleShake 0.3s ease-in-out;
}

/* Star pop animation */
@keyframes starPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.animate-star-pop {
  animation: starPop 0.4s ease-out backwards;
}

/* Card entrance */
@keyframes cardIn {
  from { transform: scale(0.8) translateY(30px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
.animate-card-in {
  animation: cardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>