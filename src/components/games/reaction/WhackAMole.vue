<template>
  <div 
    ref="gameWrapper"
    class="w-full h-full flex flex-col select-none overflow-hidden"
    :style="{ background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }"
  >
    <!-- GAME ACTIVE STATE -->
    <template v-if="gameActive">
      
      <!-- Question Banner - TOP, always visible -->
      <div class="flex-shrink-0 w-full flex justify-center px-3 py-2">
        <div class="relative" :key="currentQuestionIndex">
          <div class="absolute -inset-1 bg-white/20 rounded-xl blur-sm"></div>
          <div class="relative bg-white py-2 px-4 rounded-xl shadow-lg">
            <div class="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Question
            </div>
            <p class="font-bold text-indigo-900 text-center text-sm mt-1">
              {{ currentPrompt }}
            </p>
          </div>
        </div>
      </div>

      <!-- HUD Bar - Below question -->
      <div class="flex-shrink-0 flex justify-center px-3 pb-2">
        <div class="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <div class="flex items-center gap-1 text-white text-xs font-bold">
            <span>🎯</span>
            <span>{{ score }}</span>
          </div>
          <div class="w-px h-4 bg-white/30"></div>
          <div class="flex items-center gap-1 text-white text-xs font-bold">
            <span>⏱️</span>
            <span>{{ timeRemaining }}s</span>
          </div>
          <div class="w-px h-4 bg-white/30"></div>
          <div class="flex items-center gap-0.5">
            <span v-for="i in maxLives" :key="i" class="text-sm">
              {{ i <= lives ? '❤️' : '🖤' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Game Grid Area - Takes ALL remaining space -->
      <div class="flex-1 min-h-0 flex items-center justify-center px-2 pb-2">
        <div class="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-[320px]">
          <div 
            v-for="(hole, index) in holes" 
            :key="index" 
            class="relative cursor-pointer"
            :style="{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }"
            @mousedown.prevent="handleWhack(index)"
            @touchstart.prevent="handleWhack(index)"
          >
            <!-- Answer Bubble -->
            <div class="h-8 flex items-end justify-center mb-1">
              <div 
                v-if="hole.active"
                class="py-1 px-3 rounded-lg shadow-md border-2 transform transition-all duration-150"
                :class="[
                  hole.state === 'hit' ? 'border-green-400 bg-green-50 scale-110' :
                  hole.state === 'miss' ? 'border-red-400 bg-red-50 scale-95' :
                  'border-amber-300 bg-white animate-bounce-subtle'
                ]"
              >
                <span class="font-bold text-slate-700 text-xs whitespace-nowrap">
                  {{ hole.content }}
                </span>
              </div>
            </div>

            <!-- Mole Hole Assembly -->
            <div class="relative w-full mx-auto" style="max-width: 120px; aspect-ratio: 1 / 1;">
              
              <!-- Dark hole ellipse -->
              <div 
                class="absolute rounded-full bg-amber-950"
                style="bottom: 22%; left: 10%; width: 80%; height: 20%;"
              ></div>

              <!-- Mole body area - NO overflow hidden here, mole clips itself -->
              <div 
                class="absolute"
                style="bottom: 30%; left: 10%; width: 80%; height: 55%;"
              >
                <!-- The Mole -->
                <div 
                  class="absolute bottom-0 left-1/2 w-full transition-transform duration-200 ease-out"
                  :style="{ 
                    transform: `translateX(-50%) translateY(${hole.active ? '0%' : '110%'})`,
                  }"
                >
                  <div 
                    class="relative w-full transition-all duration-150"
                    style="aspect-ratio: 1 / 0.9;"
                    :class="[
                      hole.state === 'hit' ? 'scale-90' : '',
                      hole.state === 'miss' ? 'animate-shake' : ''
                    ]"
                  >
                    <!-- Mole main body -->
                    <div 
                      class="absolute inset-0 rounded-full shadow-lg"
                      :style="{ background: 'linear-gradient(180deg, #D4A574 0%, #A67B5B 100%)' }"
                    ></div>
                    
                    <!-- Left ear -->
                    <div 
                      class="absolute w-[22%] rounded-full bg-amber-600"
                      style="aspect-ratio: 1; top: -8%; left: 12%;"
                    ></div>
                    
                    <!-- Right ear -->
                    <div 
                      class="absolute w-[22%] rounded-full bg-amber-600"
                      style="aspect-ratio: 1; top: -8%; right: 12%;"
                    ></div>
                    
                    <!-- Left eye -->
                    <div 
                      class="absolute rounded-full bg-slate-900"
                      style="width: 16%; aspect-ratio: 1; top: 30%; left: 22%;"
                    >
                      <!-- Eye shine -->
                      <div class="absolute w-1/3 h-1/3 bg-white rounded-full top-1 left-1"></div>
                    </div>
                    
                    <!-- Right eye -->
                    <div 
                      class="absolute rounded-full bg-slate-900"
                      style="width: 16%; aspect-ratio: 1; top: 30%; right: 22%;"
                    >
                      <!-- Eye shine -->
                      <div class="absolute w-1/3 h-1/3 bg-white rounded-full top-1 left-1"></div>
                    </div>
                    
                    <!-- Nose -->
                    <div 
                      class="absolute rounded-full bg-pink-400"
                      style="width: 14%; aspect-ratio: 1; top: 52%; left: 50%; transform: translateX(-50%);"
                    ></div>
                    
                    <!-- Left cheek -->
                    <div 
                      class="absolute rounded-full bg-pink-300/50"
                      style="width: 18%; aspect-ratio: 1; top: 48%; left: 8%;"
                    ></div>
                    
                    <!-- Right cheek -->
                    <div 
                      class="absolute rounded-full bg-pink-300/50"
                      style="width: 18%; aspect-ratio: 1; top: 48%; right: 8%;"
                    ></div>
                    
                    <!-- Smile -->
                    <div 
                      class="absolute bg-amber-800 rounded-b-full"
                      style="width: 20%; height: 8%; top: 68%; left: 50%; transform: translateX(-50%);"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Dirt mound - covers bottom of mole -->
              <div 
                class="absolute left-0 right-0 pointer-events-none"
                style="bottom: 0; height: 38%;"
              >
                <div 
                  class="absolute bottom-0 w-full h-full rounded-t-[100%]"
                  :style="{ background: 'linear-gradient(0deg, #4E342E 0%, #6D4C41 40%, #8D6E63 100%)' }"
                ></div>
                <!-- Grass blades -->
                <div class="absolute top-0 left-[15%] w-[70%] flex justify-between">
                  <div class="w-1 h-2 bg-green-500 rounded-t-sm -rotate-12 -translate-y-1"></div>
                  <div class="w-1 h-2.5 bg-green-400 rounded-t-sm rotate-6 -translate-y-1"></div>
                  <div class="w-1 h-2 bg-green-500 rounded-t-sm -rotate-6 -translate-y-1"></div>
                  <div class="w-1 h-3 bg-green-400 rounded-t-sm rotate-12 -translate-y-1"></div>
                </div>
              </div>
            </div>

            <!-- Hit Effect -->
            <div 
              v-if="hole.showEffect" 
              class="absolute top-0 left-1/2 -translate-x-1/2 text-2xl z-50 pointer-events-none animate-float-up"
            >
              {{ hole.state === 'hit' ? '⭐' : '❌' }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- START SCREEN -->
    <div 
      v-if="!gameActive && !isGameOver" 
      class="absolute inset-0 flex items-center justify-center z-50 p-4"
      :style="{ background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }"
    >
      <div class="text-center w-full max-w-xs">
        <div class="text-6xl mb-4 animate-bounce">🐹</div>
        <h1 class="text-2xl font-extrabold text-white mb-2">Whack-a-Mole!</h1>
        <p class="text-sm text-white/80 mb-6">
          Tap the moles with <strong class="text-white">correct answers</strong>!
        </p>
        
        <div class="flex justify-center gap-3 mb-6">
          <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
            <span class="text-sm font-bold text-white">❤️ {{ maxLives }}</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
            <span class="text-sm font-bold text-white">⏱️ {{ initialTime }}s</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
            <span class="text-sm font-bold text-white">🎯 {{ targetScore }}</span>
          </div>
        </div>

        <button 
          @click="startGame"
          @touchend.prevent="startGame"
          class="bg-white text-indigo-600 px-10 py-4 rounded-full font-bold text-lg shadow-xl 
                 hover:scale-105 active:scale-95 transition-transform"
          :style="{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', minHeight: '56px' }"
        >
          Start Game ▶
        </button>
      </div>
    </div>

    <!-- GAME OVER SCREEN -->
    <div 
      v-if="isGameOver" 
      class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
    >
      <div class="bg-white rounded-3xl p-6 text-center max-w-[300px] w-full shadow-2xl animate-pop-in">
        <div class="text-5xl mb-2">
          {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👍' : '💪' }}
        </div>
        
        <h2 class="text-xl font-bold text-slate-800 mb-1">
          {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great Job!' : earnedStars >= 1 ? 'Good Try!' : 'Keep Practicing!' }}
        </h2>

        <div class="text-4xl font-extrabold text-indigo-500 my-3">{{ score }}</div>

        <div class="flex justify-center gap-1 mb-4">
          <span 
            v-for="n in 3" 
            :key="n" 
            class="text-3xl transition-all"
            :class="n <= earnedStars ? 'text-amber-400 scale-110' : 'text-slate-200'"
          >★</span>
        </div>

        <div class="flex justify-around mb-4 py-3 bg-slate-50 rounded-xl">
          <div class="text-center">
            <div class="text-slate-400 text-xs mb-1">Correct</div>
            <div class="font-bold text-green-500 text-lg">{{ correctHits }}</div>
          </div>
          <div class="w-px bg-slate-200"></div>
          <div class="text-center">
            <div class="text-slate-400 text-xs mb-1">Wrong</div>
            <div class="font-bold text-red-500 text-lg">{{ wrongHits }}</div>
          </div>
          <div class="w-px bg-slate-200"></div>
          <div class="text-center">
            <div class="text-slate-400 text-xs mb-1">Accuracy</div>
            <div class="font-bold text-slate-700 text-lg">{{ accuracy }}%</div>
          </div>
        </div>

        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100" 
            :style="{ width: progressWidth + '%' }"
          ></div>
        </div>
        <p class="text-xs text-slate-400 mt-2">Continuing in {{ Math.ceil(progressWidth / 20) }}s...</p>
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

const emit = defineEmits(['score-change', 'life-lost', 'game-complete', 'item-collected', 'game-started']);

// Config
const BASE_SPEED = 2500;
const MIN_SPEED = 1200;
const AUTO_DISMISS_DURATION = 5000;

// Refs
const gameWrapper = ref(null);

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
const mode = computed(() => (props.gameData?.questions?.length > 0) ? 'question' : 'category');
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

// Watchers
watch(() => props.score, (val) => { if (val >= targetScore.value && gameActive.value) finishGame(); });
watch(() => props.lives, (val) => { if (val <= 0 && gameActive.value) finishGame(); });
watch(() => props.timeRemaining, (val) => { if (val <= 0 && gameActive.value) finishGame(); });

onMounted(() => { initHoles(); });

onUnmounted(() => {
  stopGame();
  if (autoDismissTimer.value) clearTimeout(autoDismissTimer.value);
  if (progressTimer.value) clearInterval(progressTimer.value);
});
</script>

<style scoped>
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes float-up {
  0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(1.3); }
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-10deg); }
  40% { transform: rotate(10deg); }
  60% { transform: rotate(-10deg); }
  80% { transform: rotate(10deg); }
}

@keyframes pop-in {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-bounce-subtle {
  animation: bounce-subtle 0.6s ease-in-out infinite;
}

.animate-float-up {
  animation: float-up 0.6s ease-out forwards;
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}

.animate-pop-in {
  animation: pop-in 0.3s ease-out;
}
</style>