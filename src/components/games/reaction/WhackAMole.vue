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

    <!-- Question Banner -->
    <div 
      v-if="gameActive" 
      class="w-full flex justify-center px-3 pt-2 pb-1 flex-shrink-0"
    >
      <div 
        :key="currentQuestionIndex"
        class="relative animate-bounce-in"
      >
        <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-20"></div>
        <div class="relative bg-white py-2 px-4 rounded-xl shadow-lg border border-indigo-100">
          <div class="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Question
          </div>
          <p class="font-bold text-indigo-950 text-center text-sm leading-tight mt-1">
            {{ currentPrompt }}
          </p>
        </div>
      </div>
    </div>

    <!-- Game Area - Takes all remaining space -->
    <div 
      v-if="gameActive" 
      class="flex-1 flex items-center justify-center p-2 min-h-0"
    >
      <div class="grid grid-cols-2 gap-3 w-full max-w-[300px]">
        <div 
          v-for="(hole, index) in holes" 
          :key="index" 
          class="relative cursor-pointer"
          style="-webkit-tap-highlight-color: transparent; touch-action: manipulation;"
          @mousedown.prevent="handleWhack(index)"
          @touchstart.prevent="handleWhack(index)"
        >
          <!-- Answer Bubble - Positioned above hole -->
          <div class="h-7 flex items-end justify-center mb-1">
            <div 
              v-if="hole.active"
              class="py-1 px-2 rounded-lg shadow-md border-2 animate-pop-in"
              :class="[
                hole.state === 'hit' ? 'border-green-400 bg-green-50' :
                hole.state === 'miss' ? 'border-red-400 bg-red-50' :
                'border-amber-300 bg-white'
              ]"
            >
              <span class="font-bold text-slate-700 text-xs whitespace-nowrap">
                {{ hole.content }}
              </span>
            </div>
          </div>

          <!-- Hole Container -->
          <div class="relative w-full" style="aspect-ratio: 1 / 0.85;">
            
            <!-- Dark hole background -->
            <div class="absolute bottom-[15%] left-[10%] w-[80%] h-[28%] bg-amber-950 rounded-[50%]"></div>

            <!-- Mole clip area -->
            <div class="absolute bottom-[28%] left-[12%] w-[76%] h-[52%] overflow-hidden">
              <div 
                class="absolute bottom-0 left-1/2 w-[85%] transition-transform duration-150 ease-out"
                :style="{ transform: `translateX(-50%) translateY(${hole.active ? '5%' : '105%'})` }"
              >
                <div 
                  class="relative w-full transition-all duration-150"
                  style="aspect-ratio: 1 / 0.85;"
                  :class="[
                    hole.state === 'hit' ? 'scale-90 brightness-125' : '',
                    hole.state === 'miss' ? 'brightness-75 animate-wiggle' : ''
                  ]"
                >
                  <!-- Main body -->
                  <div 
                    class="absolute inset-0 rounded-[50%] shadow-md"
                    style="background: linear-gradient(180deg, #D4A574 0%, #B8845A 100%);"
                  ></div>
                  
                  <!-- Left ear -->
                  <div 
                    class="absolute w-[18%] rounded-full"
                    style="aspect-ratio: 1; top: -6%; left: 18%; background: #C4956A;"
                  ></div>
                  
                  <!-- Right ear -->
                  <div 
                    class="absolute w-[18%] rounded-full"
                    style="aspect-ratio: 1; top: -6%; right: 18%; background: #C4956A;"
                  ></div>
                  
                  <!-- Eyes -->
                  <div class="absolute w-[12%] bg-slate-800 rounded-full" style="aspect-ratio: 1; top: 35%; left: 28%;"></div>
                  <div class="absolute w-[12%] bg-slate-800 rounded-full" style="aspect-ratio: 1; top: 35%; right: 28%;"></div>
                  
                  <!-- Eye shine -->
                  <div class="absolute w-[4%] bg-white rounded-full opacity-80" style="aspect-ratio: 1; top: 36%; left: 30%;"></div>
                  <div class="absolute w-[4%] bg-white rounded-full opacity-80" style="aspect-ratio: 1; top: 36%; right: 30%;"></div>
                  
                  <!-- Pink nose -->
                  <div class="absolute w-[10%] bg-pink-400 rounded-full" style="aspect-ratio: 1; top: 55%; left: 50%; transform: translateX(-50%);"></div>
                  
                  <!-- Cheeks -->
                  <div class="absolute w-[12%] bg-pink-300 rounded-full opacity-50" style="aspect-ratio: 1; top: 50%; left: 12%;"></div>
                  <div class="absolute w-[12%] bg-pink-300 rounded-full opacity-50" style="aspect-ratio: 1; top: 50%; right: 12%;"></div>
                </div>
              </div>
            </div>

            <!-- Dirt mound -->
            <div class="absolute bottom-0 left-0 w-full h-[38%] pointer-events-none">
              <div 
                class="absolute bottom-0 w-full h-full rounded-t-[100%]"
                style="background: linear-gradient(0deg, #5D4037 0%, #795548 50%, #8D6E63 100%);"
              ></div>
              <!-- Grass blades -->
              <div class="absolute top-0 left-[10%] w-[80%] flex justify-around">
                <div class="w-1 h-2.5 bg-emerald-500 rounded-t-sm" style="transform: rotate(-12deg) translateY(-3px);"></div>
                <div class="w-1 h-3 bg-emerald-400 rounded-t-sm" style="transform: rotate(6deg) translateY(-3px);"></div>
                <div class="w-1 h-2 bg-emerald-500 rounded-t-sm" style="transform: rotate(-6deg) translateY(-3px);"></div>
                <div class="w-1 h-3 bg-emerald-400 rounded-t-sm" style="transform: rotate(12deg) translateY(-3px);"></div>
                <div class="w-1 h-2.5 bg-emerald-500 rounded-t-sm" style="transform: rotate(3deg) translateY(-3px);"></div>
              </div>
            </div>
          </div>

          <!-- Hit Effect -->
          <div 
            v-if="hole.showEffect" 
            class="absolute top-0 left-1/2 -translate-x-1/2 text-xl z-40 pointer-events-none animate-float-up"
          >
            {{ hole.state === 'hit' ? '⭐' : '❌' }}
          </div>
        </div>
      </div>
    </div>

    <!-- START SCREEN -->
    <div 
      v-if="!gameActive && !isGameOver" 
      class="absolute inset-0 flex items-center justify-center z-50 p-4"
      style="background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);"
    >
      <div class="text-center w-full max-w-xs">
        <div class="text-5xl mb-3 animate-bounce">🐹</div>
        <h1 class="text-xl font-extrabold text-white mb-1">Whack-a-Mole!</h1>
        <p class="text-xs text-white/80 mb-4">
          Tap moles with <strong class="text-white">correct answers</strong>!
        </p>
        
        <div class="flex justify-center gap-2 mb-5">
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl">
            <span class="text-xs font-bold text-white">❤️ {{ maxLives }}</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl">
            <span class="text-xs font-bold text-white">⏱️ {{ initialTime }}s</span>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl">
            <span class="text-xs font-bold text-white">🎯 {{ targetScore }}</span>
          </div>
        </div>

        <button 
          @click="startGame"
          @touchend.prevent="startGame"
          class="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold text-base shadow-xl 
                 hover:scale-105 active:scale-95 transition-transform min-h-[48px]"
          style="-webkit-tap-highlight-color: transparent; touch-action: manipulation;"
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
      <div class="bg-white rounded-2xl p-5 text-center max-w-[280px] w-full shadow-2xl animate-pop-in">
        <div class="text-4xl mb-1">
          {{ earnedStars >= 3 ? '🏆' : earnedStars >= 2 ? '🎉' : earnedStars >= 1 ? '👍' : '💪' }}
        </div>
        
        <h2 class="text-lg font-bold text-slate-800">
          {{ earnedStars >= 3 ? 'Perfect!' : earnedStars >= 2 ? 'Great!' : earnedStars >= 1 ? 'Good!' : 'Try Again!' }}
        </h2>

        <div class="text-3xl font-bold text-indigo-500 my-2">{{ score }}</div>

        <div class="flex justify-center gap-1 mb-3">
          <span 
            v-for="n in 3" 
            :key="n" 
            class="text-2xl"
            :class="n <= earnedStars ? 'text-amber-400' : 'text-slate-200'"
          >★</span>
        </div>

        <div class="flex justify-around mb-3 text-sm">
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
          <div class="h-full bg-indigo-500 transition-all" :style="{ width: progressWidth + '%' }"></div>
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
/* Animations */
@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pop-in {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes float-up {
  0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(1.2); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}

.animate-bounce-in {
  animation: bounce-in 0.3s ease-out;
}

.animate-pop-in {
  animation: pop-in 0.2s ease-out;
}

.animate-float-up {
  animation: float-up 0.5s ease-out forwards;
}

.animate-wiggle {
  animation: wiggle 0.25s ease-in-out;
}
</style>