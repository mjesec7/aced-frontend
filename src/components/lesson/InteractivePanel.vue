<template>
  <div class="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
    
    <!-- GAME MODE -->
    <div v-if="isGameMode" class="w-full max-w-6xl mx-auto">
      <GameContainer
        :game-data="gameData"
        :game-type="gameType"
        :user-id="userId"
        :lesson-id="lessonId"
        :step-index="stepIndex"
        @game-complete="handleGameComplete"
        @game-exit="handleGameExit"
      />
    </div>

    <!-- SELECTION GAME MODE -->
    <div v-else-if="isSelectionGame && selectionCurrentQuestion" class="w-full max-w-6xl mx-auto">
      <div class="min-h-[600px] w-full bg-white rounded-2xl p-6 relative shadow-xl">

        <!-- Header with Score -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">Interactive Exercise</h2>
            <p class="text-purple-600">Select the correct answer below</p>
          </div>

          <div class="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200">
            <span class="text-2xl">⭐</span>
            <span class="font-bold text-slate-700">
              {{ selectionScore }} / {{ selectionQuestions.length }}
            </span>
          </div>
        </div>

        <!-- Question Prompt -->
        <div class="mb-10 text-center">
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-8 shadow-sm">
            <h3 class="text-3xl font-bold text-slate-800 mb-2">
              {{ selectionCurrentQuestion.prompt }}
            </h3>
            <p v-if="selectionCurrentQuestion.hint" class="text-slate-500">
              {{ selectionCurrentQuestion.hint }}
            </p>
          </div>
        </div>

        <!-- Selection Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div
            v-for="(item, index) in selectionCurrentQuestion.items"
            :key="item.id"
            class="relative group"
          >
            <button
              @click="selectionHandleSelection(item)"
              :disabled="selectionFeedback !== null"
              class="w-full aspect-square rounded-2xl border-4 flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 bg-white shadow-sm hover:shadow-md disabled:cursor-not-allowed"
              :class="[
                selectionSelectedItemId === item.id && selectionFeedback === 'correct' ? 'border-green-500 bg-green-50' :
                selectionSelectedItemId === item.id && selectionFeedback === 'incorrect' ? 'border-red-500 bg-red-50' :
                'border-purple-100 hover:border-purple-300'
              ]"
            >
              <div class="p-4 flex flex-col items-center">
                <!-- Image Display -->
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  class="w-24 h-24 object-contain mb-3 drop-shadow-md"
                />

                <!-- Shape Display (for SVG or HTML shapes) -->
                <div v-else-if="item.shape" v-html="item.shape" class="w-24 h-24 mb-3 text-purple-500"></div>

                <!-- Item Name -->
                <span class="text-lg font-medium text-slate-700">{{ item.name }}</span>
              </div>

              <!-- Feedback Icon Overlay -->
              <transition name="bounce">
                <div v-if="selectionSelectedItemId === item.id && selectionFeedback"
                     class="absolute inset-0 flex items-center justify-center rounded-xl bg-opacity-20 z-10"
                     :class="selectionFeedback === 'correct' ? 'bg-green-100' : 'bg-red-100'"
                >
                  <div v-if="selectionFeedback === 'correct'" class="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                    <span class="text-white text-3xl font-bold">✓</span>
                  </div>
                  <div v-else class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                    <span class="text-white text-3xl font-bold">✕</span>
                  </div>
                </div>
              </transition>
            </button>
          </div>
        </div>

        <!-- Completion Modal -->
        <transition name="fade">
          <div v-if="selectionIsComplete" class="absolute inset-0 z-50 bg-white bg-opacity-95 flex items-center justify-center p-4 rounded-2xl">
            <div class="bg-white border-2 border-purple-200 shadow-2xl rounded-2xl p-12 text-center max-w-md">
              <div class="mb-6 flex justify-center">
                <div class="w-24 h-24 text-yellow-400 flex items-center justify-center text-6xl animate-pulse">
                  ⭐
                </div>
              </div>
              <h2 class="text-3xl font-bold text-slate-900 mb-4">Lesson Complete!</h2>
              <p class="text-xl text-slate-600 mb-8">
                You scored {{ selectionScore }} out of {{ selectionQuestions.length }}
              </p>
              <div class="flex gap-4 justify-center">
                <button
                  @click="selectionResetGame"
                  class="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <span>🔄</span>
                  Play Again
                </button>
                <button
                  @click="emit('next-exercise')"
                  class="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  Next
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </transition>

      </div>
    </div>

    <!-- EXERCISE MODE -->
    <div v-else-if="currentExercise" class="max-w-6xl mx-auto">

      <!-- Header -->
      <header class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 font-bold text-xl mb-4 shadow-sm">
          {{ exerciseIndex + 1 }}
        </div>
        <h2 class="text-3xl font-bold text-slate-900 mb-2">{{ currentExercise.title }}</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">{{ currentExercise.description }}</p>
      </header>

      <!-- Main Content Area -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        <!-- Standard Exercises (Reading, etc.) -->
        <div v-if="!['geometry'].includes(exerciseType)" class="p-6 md:p-10">
           <!-- Fallback for non-geometry exercises (keeping existing logic simplified for brevity but styled) -->
           <div v-if="['reading', 'short-answer'].includes(exerciseType)" class="space-y-6">
              <article v-if="currentExercise.content" class="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 class="text-blue-800 font-semibold mb-2">Reading Text</h3>
                <p class="text-slate-700 leading-relaxed">{{ currentExercise.content }}</p>
              </article>

              <div v-for="(question, qIndex) in (currentExercise.questions || [])" :key="qIndex" class="space-y-3">
                <p class="font-medium text-slate-800">{{ question.question }}</p>
                <textarea 
                  :value="userAnswer[qIndex] || ''" 
                  @input="updateMultiAnswer(qIndex, $event.target.value)" 
                  placeholder="Type your answer..." 
                  :disabled="showCorrectAnswer" 
                  class="w-full p-4 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none h-32"
                ></textarea>
                <div v-if="showCorrectAnswer" class="p-4 rounded-lg bg-green-50 border border-green-100 text-green-800">
                  <p class="font-semibold">Correct Answer:</p>
                  <p>{{ question.correctAnswer }}</p>
                </div>
              </div>
           </div>
        </div>

        <!-- Geometry Exercise -->
        <div v-else-if="exerciseType === 'geometry'" class="p-6 md:p-10">
          <!-- Calculate Mode -->
          <div v-if="geometryData.mode === 'calculate'" class="grid md:grid-cols-2 gap-8">
            <!-- Left: Shape & Given Info -->
            <div class="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h3 class="text-purple-600 font-semibold text-lg mb-6">Given Information</h3>
              
              <div class="space-y-1 mb-8">
                <p class="text-gray-700">Side a = <span class="font-semibold">{{ geometryData.given.side_a }}</span> units</p>
                <p class="text-purple-600 font-medium">Angle = {{ geometryData.given.angle }}°</p>
              </div>

              <!-- Square with Rainbow Gradient Border -->
              <div class="flex justify-center items-center py-12">
                <div class="relative">
                  <svg width="280" height="280" viewBox="0 0 280 280">
                    <defs>
                      <!-- Rainbow gradient for border -->
                      <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ec4899" />
                        <stop offset="33%" stop-color="#f97316" />
                        <stop offset="66%" stop-color="#eab308" />
                        <stop offset="100%" stop-color="#22c55e" />
                      </linearGradient>
                    </defs>
                    
                    <!-- Square with gradient border -->
                    <rect 
                      x="40" y="40" 
                      width="200" height="200" 
                      fill="white" 
                      stroke="url(#rainbowGradient)" 
                      stroke-width="6"
                      rx="4"
                    />
                    
                    <!-- 90° angle marker -->
                    <path d="M 40 220 L 60 220 L 60 240" fill="none" stroke="#eab308" stroke-width="2" />
                    <text x="70" y="235" class="text-xs fill-yellow-500 font-medium">90°</text>
                    
                    <!-- Side a label (bottom) -->
                    <text x="140" y="270" text-anchor="middle" class="fill-green-500 font-semibold text-sm">
                      side a = {{ geometryData.given.side_a }}
                    </text>
                    
                    <!-- Side b label (right) - with input -->
                    <text x="260" y="140" text-anchor="start" class="fill-pink-500 font-semibold text-sm">
                      side b = ?
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Right: Formulas & Submit -->
            <div class="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
              <h3 class="text-purple-600 font-semibold text-lg mb-6">Select the Formula You Used</h3>

              <!-- Formula Cards -->
              <div class="space-y-3">
                <button
                  v-for="formula in geometryData.formulas"
                  :key="formula.id"
                  @click="selectFormula(formula.id)"
                  class="w-full text-left p-5 rounded-xl border-2 transition-all duration-200"
                  :class="selectedFormula === formula.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200 bg-white'"
                >
                  <p class="font-semibold text-gray-900 mb-1.5">{{ formula.name }}</p>
                  <p class="font-mono text-purple-600 text-sm">{{ formula.formula }}</p>
                </button>
              </div>

              <!-- Hint Section -->
              <div v-if="geometryData.hint" class="mt-6 bg-purple-50 rounded-xl border border-purple-100 p-5">
                <h3 class="text-purple-600 font-semibold mb-2 flex items-center gap-2">
                  <span class="text-xl">💡</span>
                  Hint
                </h3>
                <p class="text-slate-700 text-sm leading-relaxed">
                  {{ geometryData.hint }}
                </p>
              </div>

              <!-- Input for side b -->
              <div class="pt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Enter value for side b:</label>
                <input
                  type="number"
                  v-model="userAnswer.side_b"
                  placeholder="Enter value..."
                  class="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <!-- Submit Button -->
              <button
                @click="submitGeometry"
                :disabled="!canSubmitGeometry"
                class="w-full py-3.5 rounded-xl font-semibold text-white transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Submit Answer
              </button>

              <!-- Feedback -->
              <transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
              >
                <div v-if="showFeedback" class="mt-4 p-4 rounded-xl border-2"
                  :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
                >
                  <div class="flex items-start gap-3">
                    <div class="mt-0.5">
                      <span v-if="isCorrect" class="text-green-600 text-xl">✓</span>
                      <span v-else class="text-red-600 text-xl">✕</span>
                    </div>
                    <div>
                      <h4 class="font-bold" :class="isCorrect ? 'text-green-800' : 'text-red-800'">
                        {{ isCorrect ? 'Correct!' : 'Not quite right' }}
                      </h4>
                      <p class="text-sm mt-1" :class="isCorrect ? 'text-green-700' : 'text-red-700'">
                        {{ isCorrect ? 'Great job! All sides of a square are equal.' : 'Check your calculation and formula choice.' }}
                      </p>
                    </div>
                  </div>
                </div>
              </transition>

              <!-- Next Button -->
              <button
                v-if="isCorrect"
                @click="emit('next-exercise')"
                class="w-full py-3.5 rounded-xl font-semibold text-white shadow-md bg-purple-600 hover:bg-purple-700 transition-all mt-4"
              >
                Next →
              </button>
            </div>
          </div>

          <!-- Identify Mode -->
          <div v-if="geometryData.mode === 'identify'" class="max-w-lg mx-auto space-y-8">
            <div class="bg-white rounded-xl border border-purple-100 shadow-sm p-8">
              <h3 class="text-purple-600 font-semibold mb-6 text-center">Identify the Shape</h3>
              
              <!-- Shape Display -->
              <div class="relative flex justify-center items-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100 mb-6">
                <svg width="200" height="200" viewBox="0 0 200 200" class="drop-shadow-lg">
                  <defs>
                    <linearGradient id="shapeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#a855f7" />
                      <stop offset="100%" stop-color="#ec4899" />
                    </linearGradient>
                    <filter id="shapeGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <!-- Circle -->
                  <circle 
                    v-if="geometryData.shape === 'circle'" 
                    cx="100" cy="100" r="70" 
                    fill="url(#shapeGradient)" 
                    opacity="0.8"
                    filter="url(#shapeGlow)"
                    class="animate-pulse"
                  />
                  
                  <!-- Triangle -->
                  <polygon 
                    v-if="geometryData.shape === 'triangle'" 
                    points="100,30 170,170 30,170"
                    fill="url(#shapeGradient)" 
                    opacity="0.8"
                    filter="url(#shapeGlow)"
                    class="animate-pulse"
                  />
                  
                  <!-- Square -->
                  <rect 
                    v-if="geometryData.shape === 'square'" 
                    x="40" y="40" width="120" height="120"
                    fill="url(#shapeGradient)" 
                    opacity="0.8"
                    filter="url(#shapeGlow)"
                    class="animate-pulse"
                  />
                  
                  <!-- Rectangle -->
                  <rect 
                    v-if="geometryData.shape === 'rectangle'" 
                    x="30" y="60" width="140" height="80"
                    fill="url(#shapeGradient)" 
                    opacity="0.8"
                    filter="url(#shapeGlow)"
                    class="animate-pulse"
                  />
                </svg>
              </div>
              
              <!-- Input Field -->
              <div class="space-y-4">
                <label class="block text-sm font-medium text-purple-700">What shape is this?</label>
                <input 
                  v-model="userAnswer" 
                  placeholder="Type the shape name..." 
                  :disabled="showCorrectAnswer"
                  @keyup.enter="submit"
                  class="w-full p-4 rounded-lg border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-center text-lg font-medium"
                  :class="showCorrectAnswer && answerWasCorrect ? 'bg-green-50 border-green-500' : showCorrectAnswer ? 'bg-red-50 border-red-500' : ''"
                />
                
                <!-- Submit Button -->
                <button 
                  v-if="!showCorrectAnswer"
                  @click="submit"
                  :disabled="!userAnswer || userAnswer.trim() === ''"
                  class="w-full py-3.5 rounded-xl font-semibold text-white shadow-md transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="userAnswer && userAnswer.trim() !== '' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300'"
                >
                  Submit Answer
                </button>
                
                <!-- Feedback -->
                <transition
                  enter-active-class="transition duration-300 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                >
                  <div v-if="showCorrectAnswer" class="p-4 rounded-lg border-2"
                    :class="answerWasCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
                  >
                    <div class="flex items-center gap-3">
                      <div class="p-2 rounded-full shrink-0" 
                        :class="answerWasCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                      >
                        <span v-if="answerWasCorrect" class="text-xl">✓</span>
                        <span v-else class="text-xl">✕</span>
                      </div>
                      <div>
                        <h4 class="font-bold" :class="answerWasCorrect ? 'text-green-800' : 'text-red-800'">
                          {{ answerWasCorrect ? 'Correct!' : 'Not quite right' }}
                        </h4>
                        <p v-if="!answerWasCorrect" class="text-sm mt-1 text-red-700">
                          The correct answer is: <strong>{{ geometryData.correctAnswer }}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>

          <!-- Draw Mode (Future Implementation) -->
          <div v-else class="max-w-lg mx-auto text-center py-12">
             <div class="bg-amber-50 border border-amber-200 rounded-xl p-6">
               <p class="text-amber-800 font-medium">🚧 Draw mode coming soon!</p>
               <p class="text-amber-600 text-sm mt-2">This interactive drawing feature is under development.</p>
             </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions (Non-Geometry) -->
      <footer v-if="exerciseType !== 'geometry'" class="mt-8 flex justify-end">
        <button 
          v-if="!showCorrectAnswer" 
          @click="submit" 
          :disabled="!canSubmit"
          class="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answers
        </button>
        <button 
          v-else 
          @click="handleNext" 
          class="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-colors"
        >
          Next →
        </button>
      </footer>

    </div>
    
    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[60vh]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useExercises } from '@/composables/useExercises';
import { useGeometry } from '@/composables/useGeometry';
import { useSelectionGame } from '@/composables/useSelectionGame';
import GameContainer from '../games/base/GameContainer.vue';

const props = defineProps({
  currentExercise: Object,
  exerciseIndex: Number,
  totalExercises: Number,
  userId: String,
  lessonId: String,
  stepIndex: Number,
});

const emit = defineEmits(['submit', 'next-exercise']);

// Core Composables
const { 
    userAnswer, 
    confirmation, 
    answerWasCorrect, 
    showCorrectAnswer, 
    submitAnswer: submitLogic, 
    resetExerciseState 
} = useExercises();

const {
  resetGeometry
} = useGeometry();

// --- STATE ---
const activeSide = ref(null);
const selectedFormula = ref(null);
const showFeedback = ref(false);
const isCorrect = ref(false);

const localMatchingAnswers = ref({});
const normalizedExercise = ref(null);

// --- COMPUTED ---
const exerciseType = computed(() => {
  if (props.currentExercise?.type === 'exercise' && props.currentExercise?.data?.type) {
    return props.currentExercise.data.type;
  }
  return props.currentExercise?.type || 'short-answer';
});

const geometryData = computed(() => props.currentExercise?.data || {});

// Selection Game Mode Detection
const isSelectionGame = computed(() => {
  return props.currentExercise?.type === 'selection_game' ||
         props.currentExercise?.data?.type === 'selection_game';
});

// Initialize Selection Game (only when in selection game mode)
const selectionGameData = computed(() => {
  if (!isSelectionGame.value) return null;
  return props.currentExercise?.data || props.currentExercise;
});

const {
  score: selectionScore,
  currentQuestion: selectionCurrentQuestion,
  currentQuestionIndex: selectionQuestionIndex,
  questions: selectionQuestions,
  selectedItemId: selectionSelectedItemId,
  feedback: selectionFeedback,
  isComplete: selectionIsComplete,
  handleSelection: selectionHandleSelection,
  resetGame: selectionResetGame
} = useSelectionGame(selectionGameData);

// Watch for lesson changes to reset selection game
watch(() => props.currentExercise, () => {
  if (isSelectionGame.value) {
    selectionResetGame();
  }
});

const canSubmit = computed(() => {
  if (exerciseType.value === 'matching') {
    return Object.values(localMatchingAnswers.value).some(val => val);
  }
  const answer = userAnswer.value;
  if (Array.isArray(answer)) return answer.some(val => val && val.trim() !== '');
  if (typeof answer === 'object' && answer !== null) return Object.values(answer).some(val => val);
  return answer !== null && answer !== undefined && answer !== '';
});

const canSubmitGeometry = computed(() => {
  return userAnswer.value?.side_b && selectedFormula.value;
});

const isLastExercise = computed(() => props.exerciseIndex >= props.totalExercises - 1);

// --- METHODS ---

// Geometry Specific
const selectFormula = (formulaId) => {
  selectedFormula.value = formulaId;
};

const submitGeometry = () => {
  // Handle both data structure formats
  const correctAnswerData = geometryData.value.correctAnswer;
  const correctSide = typeof correctAnswerData === 'object'
    ? correctAnswerData.side_b
    : correctAnswerData;
  const correctFormulaId = typeof correctAnswerData === 'object'
    ? correctAnswerData.formulaId
    : geometryData.value.correctFormulaId;

  const userSideB = parseFloat(userAnswer.value.side_b);

  isCorrect.value = Math.abs(userSideB - correctSide) < 0.01 &&
                    selectedFormula.value === correctFormulaId;

  showFeedback.value = true;
  answerWasCorrect.value = isCorrect.value;
  showCorrectAnswer.value = true;
};

const submit = () => {
  if (exerciseType.value === 'matching') {
    userAnswer.value = localMatchingAnswers.value;
  }
  submitLogic(props.currentExercise);
  emit('submit');
};

const handleNext = () => {
  emit('next-exercise');
};

const resetAndNext = () => {
    emit('next-exercise');
};

const updateMultiAnswer = (index, value) => {
    const newAnswers = [...userAnswer.value];
    newAnswers[index] = value;
    userAnswer.value = newAnswers;
};

// --- WATCHERS ---
watch(() => props.currentExercise, (newEx) => {
  resetExerciseState();
  activeSide.value = null;
  selectedFormula.value = null;
  showFeedback.value = false;
  isCorrect.value = false;
  
  if (!newEx) {
    normalizedExercise.value = null;
    return;
  }

  // Initialize userAnswer based on type
  const exerciseClone = JSON.parse(JSON.stringify(newEx));
  const effectiveType = (exerciseClone.type === 'exercise' && exerciseClone.data?.type) 
      ? exerciseClone.data.type 
      : exerciseClone.type;

  if (effectiveType === 'geometry' && exerciseClone.data?.mode === 'calculate') {
      userAnswer.value = { side_b: '' };
  } else if (effectiveType === 'reading' || effectiveType === 'short-answer') {
      if (exerciseClone.questions) userAnswer.value = Array(exerciseClone.questions.length).fill('');
      else userAnswer.value = '';
  }
  
  normalizedExercise.value = exerciseClone;
}, { immediate: true, deep: true });

// --- GAME MODE LOGIC ---
const isGameMode = computed(() => {
  if (!props.currentExercise) return false;
  return props.currentExercise.type === 'game' ||
         Boolean(props.currentExercise.gameType) ||
         ['basket-catch', 'whack-a-mole'].includes(props.currentExercise.type);
});

const gameType = computed(() => {
  if (!isGameMode.value) return null;
  return props.currentExercise.gameType || props.currentExercise.type || 'basket-catch';
});

const gameData = computed(() => {
  if (!isGameMode.value) return null;
  return { ...props.currentExercise, ...props.currentExercise.gameData };
});

const handleGameComplete = (result) => {
  // Mark the exercise as answered with game results
  // Game is considered "correct" if completed or earned 2+ stars
  answerWasCorrect.value = result.completed || result.stars >= 2;
  showCorrectAnswer.value = true;

  // Store game results in userAnswer for tracking
  // This gets saved to user progress and affects lesson completion stats
  userAnswer.value = {
    type: 'game',
    score: result.score,
    stars: result.stars,
    completed: result.completed,
    accuracy: result.accuracy
  };

  // Auto-advance to next exercise after a short delay
  // Gives user time to see final score/stars
  setTimeout(() => {
    emit('next-exercise');
  }, 1500);
};

/**
 * Handle early game exit (user quits before completion)
 * Allows user to retry the game without penalty
 */
const handleGameExit = () => {
  // Reset state and allow retry
  resetExerciseState();
  showCorrectAnswer.value = false;
};
</script>

<style scoped>
/* ================================ */
/* ==       THEME VARIABLES      == */
/* ================================ */
.interactive-panel {
  /* This makes the variables available to all children of this component */
  --background: #fff;
  --foreground: #27272a; /* Muted Black */
  --card: #fff;
  --card-foreground: #27272a;
  --primary: #030213;
  --primary-foreground: #ffffff;
  --secondary: #f4f4f5;
  --muted-foreground: #71717a;
  --destructive: #d4183d;
  --border: #e4e4e7;
  --input-background: #f4f4f5;
  --ring: #a78bfa;
  --radius: 0.625rem;

  --lesson-purple: #8b7cf6;
  --lesson-purple-light: #f8f7ff;
  --lesson-green: #10b981;
  --lesson-green-light: #f0fdf4;
  --lesson-blue: #3b82f6;
  --lesson-blue-light: #eff6ff;
  --lesson-yellow: #f59e0b;
  --lesson-yellow-light: #fffbeb;
}

/* ================================ */
/* ==       MAIN LAYOUT          == */
/* ================================ */
.interactive-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--font-sans);
  background-color: var(--background);
}
.panel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.game-panel-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  overflow: hidden;
}
.panel-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background-color: var(--card);
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.exercise-step-icon {
  color: white;
  font-size: 0.875rem;
  border-radius: 9999px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
}
.exercise-title {
  color: var(--card-foreground);
  font-weight: 600;
  font-size: 1.125rem;
}
.exercise-description {
  color: var(--muted-foreground);
  font-size: 0.875rem;
}
.exercise-counter {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: var(--foreground);
  border: 1px solid var(--border);
  background-color: var(--secondary);
}
.panel-content-scroll {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem;
}
.exercise-wrapper {
  max-width: 42rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.exercise-type-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.panel-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  background-color: var(--card);
}

/* ================================ */
/* ==      GENERAL ELEMENTS      == */
/* ================================ */
.exercise-card {
  padding: 1rem;
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.question-text {
  color: var(--card-foreground);
  line-height: 1.625;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.card-subtitle {
  margin-bottom: 0.75rem;
  color: var(--card-foreground);
  font-weight: 600;
}
.reading-text-card {
  background-color: var(--secondary);
}
.reading-text-content {
  background-color: var(--lesson-blue-light);
  padding: 1rem;
  border-radius: var(--radius);
  line-height: 1.6;
  color: var(--card-foreground);
}

/* ================================ */
/* ==      GEOMETRY EXPLORER     == */
/* ================================ */
.geometry-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.geometry-card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.geometry-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.canvas-wrapper {
  position: relative;
  width: 300px;
  height: 300px;
  margin-bottom: 1.5rem;
  user-select: none;
}

.geometry-svg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  pointer-events: none; /* Let clicks pass through to canvas */
}

.geometry-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  cursor: crosshair;
  touch-action: none; /* Prevent scrolling while drawing */
}

.geometry-canvas.is-drawing {
  cursor: none;
}

.geometry-feedback {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  z-index: 30;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.geometry-feedback.success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.geometry-feedback.error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.identify-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--foreground);
}
.instruction-text {
  font-size: 0.9rem;
  color: var(--muted-foreground);
  font-style: italic;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: var(--secondary);
  border-radius: 0.375rem;
}

/* ================================ */
/* ==          BUTTONS           == */
/* ================================ */
.action-button {
  padding: 0.6rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  font-size: 1rem;
}
.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.submit-button {
  color: white;
}
.next-button {
  background-color: transparent;
  border: 1px solid;
}
.option-button {
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  border-radius: 0.5rem;
  border: 2px solid var(--border);
  background-color: var(--card);
  color: var(--foreground);
  transition: border-color 0.2s, background-color 0.2s, transform 0.2s;
  cursor: pointer;
  font-size: 1rem;
}
.option-button:hover:not(:disabled) {
  border-color: var(--lesson-purple);
  transform: translateY(-1px);
}
.option-button.is-selected {
  border-color: var(--lesson-purple);
  background-color: var(--lesson-purple-light);
}
.option-button.is-correct {
  border-color: var(--lesson-green) !important;
  background-color: var(--lesson-green-light) !important;
}
.option-button.is-incorrect {
  border-color: var(--lesson-yellow) !important;
  background-color: var(--lesson-yellow-light) !important;
}
.option-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* ================================ */
/* ==        INPUTS & FORMS      == */
/* ================================ */
.answer-textarea, .matching-select, .fill-blank-input {
  width: 100%;
  background-color: var(--input-background);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.answer-textarea:focus, .matching-select:focus, .fill-blank-input:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--ring);
}
.answer-textarea {
  min-height: 80px;
  resize: vertical;
}
.matching-select.is-correct, .fill-blank-input.is-correct {
    border-color: var(--lesson-green);
}
.matching-select.is-incorrect, .fill-blank-input.is-incorrect {
    border-color: var(--lesson-yellow);
}
.matching-select option:disabled {
    color: var(--muted-foreground);
}

/* ================================ */
/* ==    EXERCISE-SPECIFIC       == */
/* ================================ */

/* Fill Blanks */
.fill-blank-sentence {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  line-height: 2.5; /* Increased for better input spacing */
}
.fill-blank-input {
  display: inline-block;
  width: 160px;
  margin: 0 0.25rem;
  padding: 0.25rem 0.5rem;
  text-align: center;
}

/* Matching */
.matching-pair-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (min-width: 640px) {
  .matching-pair-card {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}
.matching-text-left {
  flex: 1;
  color: var(--card-foreground);
  font-weight: 500;
}
.matching-select-wrapper {
  flex: 1;
  width: 100%;
}

/* Structure */
.word-bank {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 60px;
  padding: 0.75rem;
  border: 2px dashed var(--border);
  border-radius: 0.5rem;
}
.word-button {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background-color: var(--card);
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s, background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--foreground);
  font-weight: 500;
}
.word-button:active {
  cursor: grabbing;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
}
.drag-handle {
  color: var(--muted-foreground);
  cursor: inherit;
}
.word-button.is-correct {
  border-color: var(--lesson-green);
  background-color: var(--lesson-green-light);
}
.word-button.is-incorrect {
  border-color: var(--lesson-yellow);
  background-color: var(--lesson-yellow-light);
}


/* ================================ */
/* ==         FEEDBACK           == */
/* ================================ */
.feedback-container {
  margin-top: 0.75rem;
}
:deep(.feedback-box) {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid;
}
:deep(.feedback-box.is-correct) {
  background-color: var(--lesson-green-light);
  border-color: var(--lesson-green);
}
:deep(.feedback-box.is-incorrect) {
  background-color: var(--lesson-yellow-light);
  border-color: var(--lesson-yellow);
}
:deep(.feedback-line) {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--card-foreground);
}
:deep(.feedback-line strong) {
  font-weight: 600;
}
.correct-answer-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
}
.feedback-summary-card {
  text-align: center;
  padding: 1rem;
  background-color: var(--card);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.feedback-title {
  margin-bottom: 0.75rem;
  color: var(--card-foreground);
  font-size: 1.125rem;
  font-weight: 600;
}
.feedback-message {
  font-size: 1.875rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}
.feedback-message.is-correct {
  color: var(--lesson-green);
}
.feedback-message.is-incorrect {
  color: var(--lesson-yellow);
}
.feedback-subtitle {
  color: var(--muted-foreground);
  font-size: 0.875rem;
}

/* ================================ */
/* ==      LOADING STATE         == */
/* ================================ */
.panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--muted-foreground);
}

/* ================================ */
/* ==   SELECTION GAME TRANSITIONS == */
/* ================================ */

/* Bounce animation for feedback icons */
.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  transition: opacity 0.3s;
}

.bounce-enter-from,
.bounce-leave-to {
  opacity: 0;
  transform: scale(0);
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* Fade animation for completion modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>