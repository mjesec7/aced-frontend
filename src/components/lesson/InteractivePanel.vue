<template>
  <div class="interactive-panel-wrapper">
    
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
      <!-- ... keep existing selection game code ... -->
      <div class="bg-white p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-slate-900 mb-2">
            Shape Recognition Lesson
          </h1>
          <p class="text-base text-purple-600">
            Click on the correct shape!
          </p>

          <!-- Score -->
          <div class="flex items-center justify-center gap-2 mt-3">
            <svg class="w-6 h-6 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span class="text-base font-semibold text-slate-900">
              Score: {{ selectionScore }} / {{ selectionQuestions.length }}
            </span>
          </div>
        </div>

        <!-- Question Card -->
        <div class="mb-8">
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg rounded-2xl p-6 text-center">
            <h2 class="text-2xl font-bold text-slate-900 mb-2">
              {{ selectionCurrentQuestion.prompt }}
            </h2>
            <p class="text-base text-purple-600">
              {{ selectionCurrentQuestion.hint || 'Click on the shape below' }}
            </p>
          </div>
        </div>

        <!-- Shapes Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div
            v-for="(item, index) in selectionCurrentQuestion.items"
            :key="item.id"
          >
            <button
              @click="selectionHandleSelection(item)"
              :disabled="selectionFeedback !== null"
              class="relative w-full aspect-square rounded-2xl border-4 transition-all duration-200"
              :class="[
                selectionSelectedItemId === item.id && selectionFeedback === 'correct'
                  ? 'border-green-500 bg-green-50'
                  : selectionSelectedItemId === item.id && selectionFeedback === 'incorrect'
                  ? 'border-red-500 bg-red-50'
                  : 'border-purple-200 bg-white hover:border-purple-400 hover:shadow-lg',
                selectionFeedback !== null ? 'cursor-not-allowed' : 'cursor-pointer'
              ]"
            >
              <div class="flex flex-col items-center justify-center h-full p-4">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  class="w-24 h-24 md:w-28 md:h-28 object-contain mb-2"
                />
                <div v-else-if="item.shape" v-html="item.shape" class="w-24 h-24 md:w-28 md:h-28 mb-2"></div>
                <div v-else v-html="getShapeSVG(item.name, 120)" class="w-24 h-24 md:w-28 md:h-28 mb-2"></div>
                <p class="text-sm md:text-base font-medium text-slate-700">
                  {{ item.name }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EXERCISE MODE -->
    <div v-else-if="currentExercise" class="w-full mx-auto px-4 py-6">

      <!-- Exercise Header -->
      <header 
        v-if="!isSpecialInteractiveType"
        class="mb-8 text-center"
      >
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl mb-4 shadow-lg">
          {{ exerciseIndex + 1 }}
        </div>
        <h2 class="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{{ exerciseTitle }}</h2>
        <p v-if="exerciseDescription" class="text-slate-500 max-w-xl mx-auto">{{ exerciseDescription }}</p>
      </header>

      <!-- ======================= -->
      <!-- MULTIPLE CHOICE / QUIZ  -->
      <!-- ======================= -->
      <div v-if="isMultipleChoiceType" class="exercise-card">
        
        <!-- Question Badge -->
        <div class="mb-6">
          <span class="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold text-sm">
            {{ exerciseTypeLabel }}
          </span>
        </div>

        <!-- Question Text -->
        <h3 class="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed mb-8">
          {{ questionText }}
        </h3>

        <!-- Options Grid -->
        <div class="space-y-3">
          <button
            v-for="(option, idx) in normalizedOptions"
            :key="idx"
            @click="selectOption(idx)"
            :disabled="showCorrectAnswer"
            class="option-button"
            :class="getOptionClass(idx)"
          >
            <!-- Option Letter -->
            <div 
              class="option-letter"
              :class="getOptionLetterClass(idx)"
            >
              {{ String.fromCharCode(65 + idx) }}
            </div>
            
            <!-- Option Text -->
            <span class="option-text">
              {{ getOptionText(option) }}
            </span>

            <!-- Selection Indicator -->
            <div v-if="userAnswer === idx" class="option-check">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </button>
        </div>

        <!-- Feedback Section -->
        <transition name="slide-fade">
          <div v-if="showCorrectAnswer" class="feedback-box mt-8" :class="answerWasCorrect ? 'success' : 'error'">
            <div class="feedback-icon">
              <svg v-if="answerWasCorrect" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <div class="feedback-content">
              <h4>{{ answerWasCorrect ? 'Correct! 🎉' : 'Not quite right' }}</h4>
              <p v-if="!answerWasCorrect">
                The correct answer is: <strong>{{ String.fromCharCode(65 + correctAnswerIndex) }}</strong>
              </p>
            </div>
          </div>
        </transition>
      </div>

      <!-- ======================= -->
      <!-- TRUE/FALSE EXERCISE     -->
      <!-- ======================= -->
      <div v-else-if="isTrueFalseType" class="exercise-card text-center">
        
        <div class="mb-6">
          <span class="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 font-semibold text-sm">
            True or False
          </span>
        </div>

        <h3 class="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed mb-10">
          {{ questionText }}
        </h3>

        <!-- True/False Buttons -->
        <div class="flex flex-col sm:flex-row justify-center gap-6">
          <button
            @click="userAnswer = true"
            :disabled="showCorrectAnswer"
            class="tf-button"
            :class="userAnswer === true ? 'tf-true-selected' : 'tf-default'"
          >
            <span class="text-4xl mb-2">👍</span>
            <span class="text-lg font-bold">True</span>
          </button>

          <button
            @click="userAnswer = false"
            :disabled="showCorrectAnswer"
            class="tf-button"
            :class="userAnswer === false ? 'tf-false-selected' : 'tf-default'"
          >
            <span class="text-4xl mb-2">👎</span>
            <span class="text-lg font-bold">False</span>
          </button>
        </div>

        <!-- Feedback -->
        <transition name="slide-fade">
          <div v-if="showCorrectAnswer" class="feedback-box mt-8 mx-auto max-w-md" :class="answerWasCorrect ? 'success' : 'error'">
            <div class="feedback-icon">
              <svg v-if="answerWasCorrect" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <div class="feedback-content">
              <h4>{{ answerWasCorrect ? 'That\'s Right! 🎉' : 'Not Quite' }}</h4>
              <p v-if="!answerWasCorrect">
                The statement is actually <strong>{{ currentExercise.correctAnswer ? 'True' : 'False' }}</strong>
              </p>
            </div>
          </div>
        </transition>
      </div>

      <!-- ======================= -->
      <!-- INTERACTIVE TYPES       -->
      <!-- ======================= -->
      <template v-else-if="isSpecialInteractiveType">
        <!-- HISTOGRAM -->
        <HistogramExercise
          v-if="exerciseType === 'histogram'"
          :title="exerciseContentData.title || exerciseTitle"
          :description="exerciseContentData.description || exerciseDescription"
          :data="exerciseContentData.data"
          :correctValue="exerciseContentData.correctValue"
          :min="exerciseContentData.min || 0"
          :max="exerciseContentData.max || 100000"
          :step="exerciseContentData.step || 100"
          :minLabel="exerciseContentData.minLabel || 'Population'"
          :maxLabel="exerciseContentData.maxLabel || '80k'"
          @complete="handleInteractiveComplete"
          @next="emit('next-exercise')"
        />

        <!-- MAP -->
        <ModernMap
          v-else-if="exerciseType === 'map'"
          :title="exerciseContentData.title || exerciseTitle"
          :description="exerciseContentData.description || exerciseDescription"
          :image="exerciseContentData.image"
          :markers="exerciseContentData.markers"
          @complete="handleInteractiveComplete"
          @next="emit('next-exercise')"
        />

        <!-- BLOCK CODING -->
        <BlockCodingExercise
          v-else-if="exerciseType === 'block-coding'"
          :type="exerciseContentData.subtype || exerciseContentData.type || 'maze'"
          :title="exerciseContentData.title || exerciseTitle"
          :description="exerciseContentData.description || exerciseDescription"
          :availableBlocks="exerciseContentData.availableBlocks"
          :config="exerciseContentData.config"
          @complete="handleInteractiveComplete"
          @next="emit('next-exercise')"
        />

        <!-- Other interactive types... -->
        <DataAnalysisStep v-else-if="exerciseType === 'data_analysis'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
        <FractionVisualStep v-else-if="exerciseType === 'fraction_visual'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
        <GeometryPolyStep v-else-if="exerciseType === 'geometry_poly'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
        <ChemMixingStep v-else-if="exerciseType === 'chem_mixing'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
        <ChemMatchingStep v-else-if="exerciseType === 'chem_matching'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
        <EnglishSentenceFixStep v-else-if="exerciseType === 'english_sentence_fix'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
        <EnglishSentenceOrderStep v-else-if="exerciseType === 'english_sentence_order'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
        <LanguageNounBagStep v-else-if="exerciseType === 'language_noun_bag'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
      </template>

      <!-- ======================= -->
      <!-- FALLBACK / SHORT ANSWER -->
      <!-- ======================= -->
      <div v-else class="exercise-card">
        <div class="mb-6">
          <span class="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-sm">
            {{ exerciseType || 'Exercise' }}
          </span>
        </div>

        <h3 v-if="questionText" class="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed mb-6">
          {{ questionText }}
        </h3>

        <textarea 
          v-model="userAnswer"
          placeholder="Type your answer here..." 
          :disabled="showCorrectAnswer" 
          class="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-0 transition-all outline-none resize-none h-40 text-lg text-slate-800 placeholder-slate-400"
        ></textarea>

        <transition name="slide-fade">
          <div v-if="showCorrectAnswer" class="feedback-box mt-6" :class="answerWasCorrect ? 'success' : 'error'">
            <div class="feedback-icon">
              <svg v-if="answerWasCorrect" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <div class="feedback-content">
              <h4>{{ answerWasCorrect ? 'Great job!' : 'Here\'s the answer:' }}</h4>
              <p v-if="!answerWasCorrect">{{ currentExercise.correctAnswer }}</p>
            </div>
          </div>
        </transition>
      </div>

      <!-- Submit/Next Button -->
      <footer class="mt-8 flex justify-end">
        <button 
          v-if="!showCorrectAnswer && !isSpecialInteractiveType" 
          @click="submit" 
          :disabled="!canSubmit"
          class="btn-primary"
        >
          Check Answer
        </button>
        <button 
          v-else-if="showCorrectAnswer && !isSpecialInteractiveType" 
          @click="handleNext" 
          class="btn-success"
        >
          Continue →
        </button>
      </footer>
    </div>
    
    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-slate-500">Loading exercise...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useExercises } from '@/composables/useExercises';
import { useSelectionGame } from '@/composables/useSelectionGame';

// Game Components
import GameContainer from '@/components/games/base/GameContainer.vue';

// Interactive Components
import HistogramExercise from './interactives/HistogramExercise.vue';
import ModernMap from './interactives/ModernMap.vue';
import BlockCodingExercise from './interactives/BlockCodingExercise.vue';
import DataAnalysisStep from './interactives/DataAnalysisStep.vue';
import FractionVisualStep from './interactives/FractionVisualStep.vue';
import GeometryPolyStep from './interactives/GeometryPolyStep.vue';
import ChemMixingStep from './interactives/ChemMixingStep.vue';
import ChemMatchingStep from './interactives/ChemMatchingStep.vue';
import EnglishSentenceFixStep from './interactives/EnglishSentenceFixStep.vue';
import EnglishSentenceOrderStep from './interactives/EnglishSentenceOrderStep.vue';
import LanguageNounBagStep from './interactives/LanguageNounBagStep.vue';

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

// --- INTERACTIVE TYPES LIST ---
const specialInteractiveTypes = [
  'histogram', 'map', 'block-coding',
  'data_analysis', 'fraction_visual', 'geometry_poly',
  'chem_mixing', 'chem_matching',
  'english_sentence_fix', 'english_sentence_order',
  'language_noun_bag', 'geometry'
];

const multipleChoiceTypes = [
  'multiple-choice', 'multiple_choice', 'abc', 'quiz', 
  'dialogue-completion', 'mcq', 'choice'
];

const trueFalseTypes = ['true-false', 'true_false', 'boolean', 'tf'];

// --- COMPUTED: EXERCISE TYPE ---
const exerciseType = computed(() => {
  if (!props.currentExercise) return 'short-answer';
  
  const ex = props.currentExercise;
  
  // Check multiple locations for type
  const possibleTypes = [
    ex.exerciseType,
    ex.content?.type,
    ex.data?.type,
    ex.type
  ].filter(Boolean);
  
  // If it's a step wrapper with type 'exercise', look deeper
  if (ex.type === 'exercise') {
    if (ex.content?.type) return ex.content.type;
    if (ex.data?.type) return ex.data.type;
  }
  
  // Check if it has options array (likely multiple choice)
  if (ex.options && Array.isArray(ex.options) && ex.options.length > 0) {
    return 'multiple-choice';
  }
  
  // Check content for options
  if (ex.content?.options && Array.isArray(ex.content.options)) {
    return 'multiple-choice';
  }
  
  return possibleTypes[0] || ex.type || 'short-answer';
});

// --- COMPUTED: TYPE CHECKS ---
const isMultipleChoiceType = computed(() => {
  const type = exerciseType.value?.toLowerCase();
  if (multipleChoiceTypes.some(t => type?.includes(t))) return true;
  
  // Also check if exercise has options array
  const ex = props.currentExercise;
  if (ex?.options && Array.isArray(ex.options) && ex.options.length >= 2) return true;
  if (ex?.content?.options && Array.isArray(ex.content.options)) return true;
  
  return false;
});

const isTrueFalseType = computed(() => {
  const type = exerciseType.value?.toLowerCase();
  return trueFalseTypes.some(t => type?.includes(t));
});

const isSpecialInteractiveType = computed(() => {
  return specialInteractiveTypes.includes(exerciseType.value);
});

// --- COMPUTED: EXERCISE CONTENT DATA ---
const exerciseContentData = computed(() => {
  if (!props.currentExercise) return {};
  const ex = props.currentExercise;
  
  if (ex.content?.data) return ex.content.data;
  if (ex.content && typeof ex.content === 'object') return ex.content;
  if (ex.data && typeof ex.data === 'object' && !Array.isArray(ex.data)) return ex.data;
  return ex;
});

// --- COMPUTED: TITLE & DESCRIPTION ---
const exerciseTitle = computed(() => {
  const ex = props.currentExercise;
  return ex?.title || ex?.content?.title || exerciseContentData.value?.title || 'Exercise';
});

const exerciseDescription = computed(() => {
  const ex = props.currentExercise;
  return ex?.instructions || ex?.description || ex?.content?.description || '';
});

const exerciseTypeLabel = computed(() => {
  const type = exerciseType.value;
  if (type === 'quiz') return 'Quiz Question';
  if (multipleChoiceTypes.includes(type)) return 'Multiple Choice';
  return 'Question';
});

// --- COMPUTED: QUESTION TEXT ---
const questionText = computed(() => {
  const ex = props.currentExercise;
  return ex?.question || 
         ex?.content?.question || 
         ex?.data?.question ||
         ex?.prompt ||
         'Select the correct answer';
});

// --- COMPUTED: OPTIONS ---
const normalizedOptions = computed(() => {
  const ex = props.currentExercise;
  
  // Direct options array
  if (ex?.options && Array.isArray(ex.options)) return ex.options;
  
  // Options in content
  if (ex?.content?.options && Array.isArray(ex.content.options)) return ex.content.options;
  
  // Options in data
  if (ex?.data?.options && Array.isArray(ex.data.options)) return ex.data.options;
  
  return [];
});

const getOptionText = (option) => {
  if (typeof option === 'string') return option;
  if (typeof option === 'number') return String(option);
  if (option?.text) return option.text;
  if (option?.label) return option.label;
  if (option?.value) return option.value;
  return String(option);
};

// --- COMPUTED: CORRECT ANSWER ---
const correctAnswerIndex = computed(() => {
  const ex = props.currentExercise;
  
  // Direct correctAnswer as index
  if (typeof ex?.correctAnswer === 'number') return ex.correctAnswer;
  
  // correctAnswer in content
  if (typeof ex?.content?.correctAnswer === 'number') return ex.content.correctAnswer;
  
  // correctAnswerIndex property
  if (typeof ex?.correctAnswerIndex === 'number') return ex.correctAnswerIndex;
  
  // Find by matching value
  if (ex?.correctAnswer !== undefined) {
    const idx = normalizedOptions.value.findIndex(opt => {
      const optText = getOptionText(opt);
      return optText === String(ex.correctAnswer) || opt === ex.correctAnswer;
    });
    if (idx !== -1) return idx;
  }
  
  // Find by isCorrect flag
  const correctIdx = normalizedOptions.value.findIndex(opt => opt?.isCorrect === true);
  if (correctIdx !== -1) return correctIdx;
  
  return 0;
});

// --- COMPUTED: CAN SUBMIT ---
const canSubmit = computed(() => {
  if (isMultipleChoiceType.value || isTrueFalseType.value) {
    return userAnswer.value !== null && userAnswer.value !== undefined;
  }
  return userAnswer.value !== null && userAnswer.value !== undefined && userAnswer.value !== '';
});

// --- METHODS ---
const selectOption = (idx) => {
  if (showCorrectAnswer.value) return;
  userAnswer.value = idx;
};

const getOptionClass = (idx) => {
  const isSelected = userAnswer.value === idx;
  const isCorrect = idx === correctAnswerIndex.value;
  
  if (showCorrectAnswer.value) {
    if (isCorrect) return 'option-correct';
    if (isSelected && !isCorrect) return 'option-incorrect';
    return 'option-disabled';
  }
  
  return isSelected ? 'option-selected' : 'option-default';
};

const getOptionLetterClass = (idx) => {
  const isSelected = userAnswer.value === idx;
  const isCorrect = idx === correctAnswerIndex.value;
  
  if (showCorrectAnswer.value) {
    if (isCorrect) return 'letter-correct';
    if (isSelected && !isCorrect) return 'letter-incorrect';
    return 'letter-disabled';
  }
  
  return isSelected ? 'letter-selected' : 'letter-default';
};

const submit = () => {
  submitLogic(props.currentExercise);
  emit('submit');
};

const handleNext = () => {
  emit('next-exercise');
};

const handleInteractiveComplete = (success) => {
  if (success) {
    answerWasCorrect.value = true;
    showCorrectAnswer.value = true;
  }
};

// --- GAME MODE ---
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
  answerWasCorrect.value = result.completed || result.stars >= 2;
  showCorrectAnswer.value = true;
  setTimeout(() => emit('next-exercise'), 1500);
};

const handleGameExit = () => {
  resetExerciseState();
  showCorrectAnswer.value = false;
};

// --- SELECTION GAME ---
const isSelectionGame = computed(() => {
  if (!props.currentExercise) return false;
  return props.currentExercise?.type === 'selection_game' ||
         props.currentExercise?.content?.type === 'selection_game';
});

const selectionGameData = computed(() => {
  if (!isSelectionGame.value) return { questions: [] };
  return exerciseContentData.value || props.currentExercise;
});

const {
  score: selectionScore,
  currentQuestion: selectionCurrentQuestion,
  questions: selectionQuestions,
  selectedItemId: selectionSelectedItemId,
  feedback: selectionFeedback,
  handleSelection: selectionHandleSelection,
} = useSelectionGame(selectionGameData);

// --- WATCH ---
watch(() => props.currentExercise, (newEx) => {
  resetExerciseState();
  userAnswer.value = null;
}, { immediate: true });
</script>

<style scoped>
.interactive-panel-wrapper {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

/* Exercise Card */
.exercise-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* Option Button Styles */
.option-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 16px;
  border: 2px solid;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
}

.option-default {
  border-color: #e2e8f0;
  background: white;
}

.option-default:hover:not(:disabled) {
  border-color: #a78bfa;
  background: #faf5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.option-selected {
  border-color: #a855f7;
  background: linear-gradient(135deg, #fae8ff 0%, #f3e8ff 100%);
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
}

.option-correct {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.option-incorrect {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.option-disabled {
  border-color: #e2e8f0;
  background: #f8fafc;
  opacity: 0.6;
  cursor: not-allowed;
}

/* Option Letter */
.option-letter {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.letter-default {
  background: #f1f5f9;
  color: #64748b;
}

.letter-selected {
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: white;
}

.letter-correct {
  background: #10b981;
  color: white;
}

.letter-incorrect {
  background: #ef4444;
  color: white;
}

.letter-disabled {
  background: #e2e8f0;
  color: #94a3b8;
}

/* Option Text */
.option-text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: #334155;
}

/* Option Check */
.option-check {
  width: 24px;
  height: 24px;
  color: #8b5cf6;
}

/* True/False Buttons */
.tf-button {
  flex: 1;
  max-width: 200px;
  padding: 24px;
  border-radius: 20px;
  border: 3px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tf-default {
  border-color: #e2e8f0;
  background: white;
}

.tf-default:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.tf-true-selected {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
}

.tf-false-selected {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.25);
}

/* Feedback Box */
.feedback-box {
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  border: 2px solid;
  align-items: flex-start;
}

.feedback-box.success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #6ee7b7;
}

.feedback-box.error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #fca5a5;
}

.feedback-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feedback-box.success .feedback-icon {
  background: #10b981;
  color: white;
}

.feedback-box.error .feedback-icon {
  background: #ef4444;
  color: white;
}

.feedback-content h4 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
}

.feedback-box.success .feedback-content h4 {
  color: #065f46;
}

.feedback-box.error .feedback-content h4 {
  color: #991b1b;
}

.feedback-content p {
  margin: 0;
  font-size: 14px;
}

.feedback-box.success .feedback-content p {
  color: #047857;
}

.feedback-box.error .feedback-content p {
  color: #b91c1c;
}

/* Buttons */
.btn-primary {
  padding: 14px 32px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-success {
  padding: 14px 32px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.4s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .exercise-card {
    padding: 20px;
    border-radius: 20px;
  }
  
  .option-button {
    padding: 14px 16px;
  }
  
  .option-letter {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  
  .tf-button {
    padding: 20px;
    max-width: 160px;
  }
}
</style>