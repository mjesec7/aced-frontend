<template>
  <div 
    ref="gameWrapper"
    class="absolute inset-0 bg-gradient-to-b from-green-400 via-emerald-500 to-green-600 font-sans select-none overflow-hidden flex flex-col"
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
      class="absolute z-50 left-1/2 -translate-x-1/2 transition-all duration-200 ease-out w-[90%] max-w-md"
      :style="questionBannerStyle"
    >
      <div class="bg-white px-4 py-2 rounded-xl shadow-md">
        <p 
          class="font-bold text-slate-700 text-center"
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
          class="relative flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
          @mousedown.prevent="handleWhack(index)"
          @touchstart.prevent="handleWhack(index)"
        >
          <!-- Answer Bubble -->
          <transition name="pop">
            <div 
              v-if="hole.active"
              class="mb-1 z-30"
            >
              <div 
                class="bg-white px-2 py-1 rounded-lg shadow border-2 transition-all duration-100"
                :class="getAnswerBubbleClass(hole)"
              >
                <span 
                  class="font-bold text-slate-700"
                  :class="answerTextClass"
                >
                  {{ hole.content }}
                </span>
              </div>
            </div>
          </transition>

          <!-- Hole with Mole -->
          <div class="relative w-full aspect-square">
            
            <!-- Hole shadow/depth -->
            <div class="absolute bottom-[20%] left-[12%] w-[76%] h-[25%] bg-amber-950 rounded-[50%] z-[1]"></div>

            <!-- ✨ CUTE FRIENDLY MOLE ✨ -->
            <div 
              class="absolute bottom-[22%] left-1/2 w-[65%] z-[5] transition-all duration-150 ease-out"
              :class="getMoleTransform(hole)"
            >
              <div class="relative w-full aspect-square">
                
                <!-- Main body - warm brown, rounder shape -->
                <div 
                  class="absolute inset-[5%] rounded-[45%] shadow-lg"
                  :class="getMoleBodyClass(hole)"
                  style="background: linear-gradient(160deg, #8B6914 0%, #6B4E12 60%, #5A4210 100%);"
                ></div>
                
                <!-- Face/belly lighter area - cream colored -->
                <div 
                  class="absolute top-[18%] left-[18%] w-[64%] h-[65%] rounded-[45%]"
                  style="background: linear-gradient(180deg, #F5E6C8 0%, #E8D4A8 50%, #DFC894 100%);"
                ></div>
                
                <!-- Left ear - small and round -->
                <div class="absolute top-[2%] left-[12%] w-[22%] aspect-square">
                  <div class="w-full h-full rounded-full" style="background: linear-gradient(135deg, #8B6914 0%, #6B4E12 100%);"></div>
                  <div class="absolute top-[28%] left-[28%] w-[44%] h-[44%] rounded-full bg-pink-300/70"></div>
                </div>
                
                <!-- Right ear - small and round -->
                <div class="absolute top-[2%] right-[12%] w-[22%] aspect-square">
                  <div class="w-full h-full rounded-full" style="background: linear-gradient(135deg, #8B6914 0%, #6B4E12 100%);"></div>
                  <div class="absolute top-[28%] left-[28%] w-[44%] h-[44%] rounded-full bg-pink-300/70"></div>
                </div>
                
                <!-- Eyes - big friendly eyes with sparkle -->
                <div class="absolute top-[30%] left-[20%] w-[60%] flex justify-between">
                  <!-- Left eye -->
                  <div class="w-[40%] aspect-square bg-white rounded-full shadow-inner flex items-center justify-center border border-gray-100">
                    <div class="w-[60%] aspect-square rounded-full relative" style="background: linear-gradient(180deg, #2D1B0E 0%, #1A0F08 100%);">
                      <!-- Eye shine - big -->
                      <div class="absolute top-[12%] left-[15%] w-[40%] aspect-square bg-white rounded-full"></div>
                      <!-- Eye shine - small -->
                      <div class="absolute bottom-[25%] right-[20%] w-[18%] aspect-square bg-white/70 rounded-full"></div>
                    </div>
                  </div>
                  <!-- Right eye -->
                  <div class="w-[40%] aspect-square bg-white rounded-full shadow-inner flex items-center justify-center border border-gray-100">
                    <div class="w-[60%] aspect-square rounded-full relative" style="background: linear-gradient(180deg, #2D1B0E 0%, #1A0F08 100%);">
                      <!-- Eye shine - big -->
                      <div class="absolute top-[12%] left-[15%] w-[40%] aspect-square bg-white rounded-full"></div>
                      <!-- Eye shine - small -->
                      <div class="absolute bottom-[25%] right-[20%] w-[18%] aspect-square bg-white/70 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <!-- Nose - cute pink oval -->
                <div class="absolute top-[58%] left-1/2 -translate-x-1/2 w-[18%] aspect-[1.3/1] rounded-[50%] shadow-sm" style="background: linear-gradient(180deg, #E8A0B0 0%, #D4808F 100%);"></div>
                
                <!-- Mouth - happy smile -->
                <div class="absolute top-[70%] left-1/2 -translate-x-1/2 w-[28%]">
                  <svg viewBox="0 0 40 20" class="w-full">
                    <path 
                      d="M5 8 Q20 18 35 8" 
                      fill="none" 
                      stroke="#5A4210" 
                      stroke-width="2.5" 
                      stroke-linecap="round"
                    />
                  </svg>
                </div>
                
                <!-- Blush - soft pink circles -->
                <div class="absolute top-[55%] left-[8%] w-[16%] aspect-[1.4/1] bg-pink-300/50 rounded-full blur-[1px]"></div>
                <div class="absolute top-[55%] right-[8%] w-[16%] aspect-[1.4/1] bg-pink-300/50 rounded-full blur-[1px]"></div>
                
                <!-- Optional whisker dots -->
                <div class="absolute top-[62%] left-[22%] w-[4%] aspect-square bg-amber-800/40 rounded-full"></div>
                <div class="absolute top-[66%] left-[18%] w-[4%] aspect-square bg-amber-800/40 rounded-full"></div>
                <div class="absolute top-[62%] right-[22%] w-[4%] aspect-square bg-amber-800/40 rounded-full"></div>
                <div class="absolute top-[66%] right-[18%] w-[4%] aspect-square bg-amber-800/40 rounded-full"></div>
              </div>
            </div>

            <!-- Dirt mound (hides mole) -->
            <div class="absolute bottom-0 left-0 w-full h-[42%] z-10 pointer-events-none overflow-hidden">
              <div 
                class="absolute bottom-0 w-full h-[120%] rounded-t-[100%]"
                style="background: linear-gradient(0deg, #7A5230 0%, #9A6B42 40%, #B8845A 100%);"
              ></div>
              <!-- Grass blades -->
              <div class="absolute -top-1 left-[8%] w-[84%] flex justify-around">
                <div class="w-1.5 h-3 bg-green-500 rounded-t-full -rotate-12 origin-bottom"></div>
                <div class="w-1 h-4 bg-green-400 rounded-t-full rotate-6 origin-bottom"></div>
                <div class="w-1.5 h-2.5 bg-green-500 rounded-t-full -rotate-6 origin-bottom"></div>
                <div class="w-1 h-3.5 bg-green-400 rounded-t-full rotate-12 origin-bottom"></div>
                <div class="w-1.5 h-2.5 bg-green-500 rounded-t-full rotate-3 origin-bottom"></div>
                <div class="w-1 h-3 bg-green-400 rounded-t-full -rotate-8 origin-bottom"></div>
              </div>
            </div>
          </div>

          <!-- Hit Effect -->
          <transition name="hit">
            <div 
              v-if="hole.showEffect" 
              class="absolute top-0 left-1/2 -translate-x-1/2 text-2xl z-40 pointer-events-none"
            >
              {{ hole.state === 'hit' ? '⭐' : '❌' }}
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- START SCREEN -->
    <div 
      v-if="!gameActive && !isGameOver" 
      class="absolute inset-0 bg-gradient-to-b from-green-400 to-emerald-600 flex items-center justify-center p-4 z-50"
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
          class="bg-white text-green-600 px-8 py-3 rounded-full font-bold shadow-lg 
                 hover:scale-105 active:scale-100 transition-transform"
        >
          Start Game ▶
        </button>
      </div>
    </div>

    <!-- GAME OVER -->
    <transition name="fade">
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

          <div class="text-3xl font-bold text-green-500 my-2">{{ score }}</div>

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
            <div class="h-full bg-green-500 transition-all" :style="{ width: progressWidth + '%' }"></div>
          </div>
          <p class="text-xs text-slate-400 mt-1">{{ Math.ceil(progressWidth / 20) }}s...</p>
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
const containerWidth = ref(600);
let resizeObserver = null;

// Question banner positioning
const questionBannerStyle = computed(() => {
  const w = containerWidth.value;
  if (w < 250) return { top: '130px' };
  if (w < 300) return { top: '120px' };
  if (w < 350) return { top: '110px' };
  if (w < 400) return { top: '100px' };
  if (w < 500) return { top: '90px' };
  if (w < 600) return { top: '80px' };
  return { top: '72px' };
});

// Game area padding matches banner position
const gameAreaPadding = computed(() => {
  const w = containerWidth.value;
  if (w < 250) return '165px';
  if (w < 300) return '155px';
  if (w < 350) return '145px';
  if (w < 400) return '135px';
  if (w < 500) return '125px';
  if (w < 600) return '115px';
  return '108px';
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

// Helpers
const getMoleTransform = (hole) => {
  if (!hole.active) return '-translate-x-1/2 translate-y-[100%]';
  if (hole.state === 'hit') return '-translate-x-1/2 translate-y-0 scale-90';
  if (hole.state === 'miss') return '-translate-x-1/2 translate-y-0 animate-wiggle';
  return '-translate-x-1/2 translate-y-0';
};

const getMoleBodyClass = (hole) => {
  if (hole.state === 'hit') return 'brightness-125 saturate-110';
  if (hole.state === 'miss') return 'brightness-90 hue-rotate-15';
  return '';
};

const getAnswerBubbleClass = (hole) => {
  if (hole.state === 'hit') return 'border-green-400 bg-green-50';
  if (hole.state === 'miss') return 'border-red-400 bg-red-50';
  return 'border-amber-300';
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
.pop-enter-active { animation: popIn 0.15s ease-out; }
.pop-leave-active { animation: popOut 0.1s ease-in; }

@keyframes popIn {
  from { opacity: 0; transform: scale(0.7); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes popOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.8); }
}

.hit-enter-active { animation: hitPop 0.3s ease-out; }
.hit-leave-active { animation: hitFade 0.15s ease-out; }

@keyframes hitPop {
  0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
  50% { transform: translateX(-50%) scale(1.3); opacity: 1; }
  100% { transform: translateX(-50%) translateY(-10px) scale(1); opacity: 0.8; }
}
@keyframes hitFade {
  to { opacity: 0; transform: translateX(-50%) translateY(-15px); }
}

.fade-enter-active { transition: opacity 0.2s; }
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes wiggle {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(-50%) rotate(-8deg); }
  75% { transform: translateX(-50%) rotate(8deg); }
}
.animate-wiggle { animation: wiggle 0.25s ease-in-out; }
</style>