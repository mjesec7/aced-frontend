<template>
  <div 
    class="interactive-panel-wrapper" 
    :class="{ 'is-game-mode': isGameMode }"
  >
    
    <!-- GAME MODE - Full height, no padding -->
    <div v-if="isGameMode" class="game-full-container">
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
    <div v-else-if="isSelectionGame && selectionCurrentQuestion" class="w-full h-full overflow-y-auto">
      <div class="bg-white p-4 sm:p-8 min-h-full">
        <!-- Header -->
        <div class="text-center mb-6 sm:mb-8">
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Shape Recognition Lesson
          </h1>
          <p class="text-sm sm:text-base text-purple-600">
            Click on the correct shape!
          </p>

          <!-- Score -->
          <div class="flex items-center justify-center gap-2 mt-3">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span class="text-sm sm:text-base font-semibold text-slate-900">
              Score: {{ selectionScore }} / {{ selectionQuestions.length }}
            </span>
          </div>
        </div>

        <!-- Question Card -->
        <div class="mb-6 sm:mb-8">
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg rounded-2xl p-4 sm:p-6 text-center">
            <h2 class="text-lg sm:text-2xl font-bold text-slate-900 mb-2">
              {{ getLocalizedText(selectionCurrentQuestion.prompt) }}
            </h2>
            <p class="text-sm sm:text-base text-purple-600">
              {{ getLocalizedText(selectionCurrentQuestion.hint) || 'Click on the shape below' }}
            </p>
          </div>
        </div>

        <!-- Shapes Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          <button
            v-for="(item, index) in selectionCurrentQuestion.items"
            :key="item.id"
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
            <div class="flex flex-col items-center justify-center h-full p-2 sm:p-4">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name"
                class="w-16 h-16 sm:w-24 sm:h-24 object-contain mb-2"
              />
              <p class="text-xs sm:text-sm font-medium text-slate-700">
                {{ getLocalizedText(item.name) }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- EXERCISE MODE -->
    <div v-else-if="currentExercise" class="exercise-scroll-container">
      <div class="exercise-content">
        <!-- Exercise Header -->
        <header 
          v-if="!isSpecialInteractiveType"
          class="text-center mb-6 sm:mb-8"
        >
          <div class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg">
            {{ exerciseIndex + 1 }}
          </div>
          <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">{{ exerciseTitle }}</h2>
          <p v-if="exerciseDescription" class="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">{{ exerciseDescription }}</p>
        </header>

        <!-- MULTIPLE CHOICE -->
        <div v-if="isMultipleChoiceType" class="exercise-card">
          <div class="mb-4 sm:mb-6">
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold text-xs sm:text-sm">
              {{ exerciseTypeLabel }}
            </span>
          </div>

          <h3 class="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-relaxed mb-6 sm:mb-8">
            {{ questionText }}
          </h3>

          <div class="space-y-2 sm:space-y-3">
            <button
              v-for="(option, idx) in normalizedOptions"
              :key="idx"
              @click="selectOption(idx)"
              :disabled="showCorrectAnswer"
              class="option-btn"
              :class="getOptionClass(idx)"
            >
              <div class="option-letter" :class="getOptionLetterClass(idx)">
                {{ String.fromCharCode(65 + idx) }}
              </div>
              <span class="option-text">{{ getOptionText(option) }}</span>
              <div v-if="userAnswer === idx" class="option-check">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </button>
          </div>

          <transition name="slide-fade">
            <div v-if="showCorrectAnswer" class="feedback-box mt-6" :class="answerWasCorrect ? 'feedback-success' : 'feedback-error'">
              <div class="feedback-icon">
                <svg v-if="answerWasCorrect" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h4 class="font-bold text-sm sm:text-base">{{ answerWasCorrect ? 'Correct! 🎉' : 'Not quite right' }}</h4>
                <p v-if="!answerWasCorrect" class="text-xs sm:text-sm mt-1">
                  The correct answer is: <strong>{{ String.fromCharCode(65 + correctAnswerIndex) }}</strong>
                </p>
              </div>
            </div>
          </transition>
        </div>

        <!-- TRUE/FALSE -->
        <div v-else-if="isTrueFalseType" class="exercise-card text-center">
          <div class="mb-4 sm:mb-6">
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 font-semibold text-xs sm:text-sm">
              True or False
            </span>
          </div>

          <h3 class="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-relaxed mb-6 sm:mb-8">
            {{ questionText }}
          </h3>

          <div class="flex justify-center gap-4 sm:gap-6">
            <button
              @click="userAnswer = true"
              :disabled="showCorrectAnswer"
              class="tf-btn"
              :class="userAnswer === true ? 'tf-true-selected' : 'tf-default'"
            >
              <span class="text-3xl mb-1">👍</span>
              <span class="text-sm sm:text-base font-bold">True</span>
            </button>

            <button
              @click="userAnswer = false"
              :disabled="showCorrectAnswer"
              class="tf-btn"
              :class="userAnswer === false ? 'tf-false-selected' : 'tf-default'"
            >
              <span class="text-3xl mb-1">👎</span>
              <span class="text-sm sm:text-base font-bold">False</span>
            </button>
          </div>

          <transition name="slide-fade">
            <div v-if="showCorrectAnswer" class="feedback-box mt-6 mx-auto max-w-sm" :class="answerWasCorrect ? 'feedback-success' : 'feedback-error'">
              <div class="feedback-icon">
                <svg v-if="answerWasCorrect" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h4 class="font-bold text-sm sm:text-base">{{ answerWasCorrect ? 'Correct! 🎉' : 'Not Quite' }}</h4>
                <p v-if="!answerWasCorrect" class="text-xs sm:text-sm mt-1">
                  The statement is actually <strong>{{ currentExercise.correctAnswer ? 'True' : 'False' }}</strong>
                </p>
              </div>
            </div>
          </transition>
        </div>

        <!-- SPECIAL INTERACTIVE TYPES -->
        <template v-else-if="isSpecialInteractiveType">
          <ModernHistogram v-if="exerciseType === 'histogram'" :title="exerciseContentData.title || exerciseTitle" :description="exerciseContentData.description || exerciseDescription" :data="exerciseContentData.data" :correctValue="exerciseContentData.correctValue" :min="exerciseContentData.min || 0" :max="exerciseContentData.max || 100000" :step="exerciseContentData.step || 100" @complete="handleInteractiveComplete" @next="emit('next-exercise')" />
          <ModernMap v-else-if="exerciseType === 'map'" :title="exerciseContentData.title || exerciseTitle" :description="exerciseContentData.description || exerciseDescription" :image="exerciseContentData.image" :markers="exerciseContentData.markers" @complete="handleInteractiveComplete" @next="emit('next-exercise')" />
          <ModernBlockCoding v-else-if="exerciseType === 'block-coding'" :type="exerciseContentData.subtype || exerciseContentData.type || 'maze'" :title="exerciseContentData.title || exerciseTitle" :description="exerciseContentData.description || exerciseDescription" :availableBlocks="exerciseContentData.availableBlocks" :config="exerciseContentData.config" @complete="handleInteractiveComplete" @next="emit('next-exercise')" />
          <GeometryExercise v-else-if="exerciseType === 'geometry'" :geometryData="exerciseContentData" :userAnswer="geometryUserAnswer" @update:userAnswer="geometryUserAnswer = $event" @submit="handleGeometrySubmit" @next-exercise="emit('next-exercise')" />
          <DataAnalysisStep v-else-if="exerciseType === 'data_analysis' || exerciseType === 'data-analysis' || exerciseType === 'dataanalysis'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <FractionVisualStep v-else-if="exerciseType === 'fraction_visual'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <GeometryPolyStep v-else-if="exerciseType === 'geometry_poly'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <ChemMixingStep v-else-if="exerciseType === 'chem_mixing'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <ChemMatchingStep v-else-if="exerciseType === 'chem_matching' || exerciseType === 'matching' || exerciseType === 'match' || exerciseType === 'pair_matching'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <EnglishSentenceFixStep v-else-if="exerciseType === 'english_sentence_fix'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <EnglishSentenceOrderStep v-else-if="exerciseType === 'english_sentence_order' || exerciseType === 'sentence_order' || exerciseType === 'sentence_ordering' || exerciseType === 'word_order' || exerciseType === 'ordering' || exerciseType === 'reorder'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <LanguageNounBagStep v-else-if="exerciseType === 'language_noun_bag'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <LanguageToneTransformer v-else-if="exerciseType === 'language_tone_transformer'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <LanguageIdiomBridge v-else-if="exerciseType === 'language_idiom_bridge'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <LanguageWordConstellation v-else-if="exerciseType === 'language_word_constellation'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <LanguageRhythmMatch v-else-if="exerciseType === 'language_rhythm_match'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          <LanguageFalseFriends v-else-if="exerciseType === 'language_false_friends'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
        </template>

        <!-- FALLBACK / SHORT ANSWER -->
        <div v-else class="exercise-card">
          <div class="mb-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs sm:text-sm">
              {{ exerciseType || 'Exercise' }}
            </span>
          </div>

          <h3 v-if="questionText" class="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed mb-4">
            {{ questionText }}
          </h3>

          <textarea 
            v-model="userAnswer"
            placeholder="Type your answer here..." 
            :disabled="showCorrectAnswer" 
            class="w-full p-3 sm:p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-0 transition-all outline-none resize-none h-32 text-base text-slate-800 placeholder-slate-400"
          ></textarea>

          <transition name="slide-fade">
            <div v-if="showCorrectAnswer" class="feedback-box mt-4" :class="answerWasCorrect ? 'feedback-success' : 'feedback-error'">
              <div class="feedback-icon">
                <svg v-if="answerWasCorrect" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h4 class="font-bold">{{ answerWasCorrect ? 'Great job!' : 'Here\'s the answer:' }}</h4>
                <p v-if="!answerWasCorrect" class="text-sm mt-1">{{ currentExercise.correctAnswer }}</p>
              </div>
            </div>
          </transition>
        </div>

        <!-- Submit/Next Button -->
        <footer v-if="!isSpecialInteractiveType" class="mt-6 flex justify-end">
          <button 
            v-if="!showCorrectAnswer" 
            @click="submit" 
            :disabled="!canSubmit"
            class="btn-primary"
          >
            Check Answer
          </button>
          <button 
            v-else 
            @click="handleNext" 
            class="btn-success"
          >
            Continue →
          </button>
        </footer>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-slate-500 text-sm">Loading exercise...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useExercises } from '@/composables/useExercises';
import { useSelectionGame } from '@/composables/useSelectionGame';
import { useLanguage } from '@/composables/useLanguage';

// Game Components
import GameContainer from '@/components/games/base/GameContainer.vue';

// Interactive Components
import ModernHistogram from './interactives/ModernHistogram.vue';
import ModernMap from './interactives/ModernMap.vue';
import ModernBlockCoding from './interactives/ModernBlockCoding.vue';
import GeometryExercise from './GeometryExercise.vue';
import DataAnalysisStep from './interactives/DataAnalysisStep.vue';
import FractionVisualStep from './interactives/FractionVisualStep.vue';
import GeometryPolyStep from './interactives/GeometryPolyStep.vue';
import ChemMixingStep from './interactives/ChemMixingStep.vue';
import ChemMatchingStep from './interactives/ChemMatchingStep.vue';
import EnglishSentenceFixStep from './interactives/EnglishSentenceFixStep.vue';
import EnglishSentenceOrderStep from './interactives/EnglishSentenceOrderStep.vue';
import LanguageNounBagStep from './interactives/LanguageNounBagStep.vue';
import LanguageToneTransformer from './interactives/LanguageToneTransformer.vue';
import LanguageIdiomBridge from './interactives/LanguageIdiomBridge.vue';
import LanguageWordConstellation from './interactives/LanguageWordConstellation.vue';
import LanguageRhythmMatch from './interactives/LanguageRhythmMatch.vue';
import LanguageFalseFriends from './interactives/LanguageFalseFriends.vue';

const props = defineProps({
  currentExercise: Object,
  exerciseIndex: Number,
  totalExercises: Number,
  userId: String,
  lessonId: String,
  stepIndex: Number,
});

const emit = defineEmits(['submit', 'next-exercise']);

const { getLocalizedText } = useLanguage();

const { 
  userAnswer, 
  confirmation, 
  answerWasCorrect, 
  showCorrectAnswer, 
  submitAnswer: submitLogic, 
  resetExerciseState 
} = useExercises();

const specialInteractiveTypes = [
  'histogram', 'map', 'block-coding', 'data_analysis', 'fraction_visual',
  'geometry_poly', 'chem_mixing', 'chem_matching', 'english_sentence_fix',
  'english_sentence_order', 'language_noun_bag', 'geometry',
  'language_tone_transformer', 'language_idiom_bridge',
  'language_word_constellation', 'language_rhythm_match', 'language_false_friends',
  // Add common aliases
  'matching', 'sentence_order', 'sentence_ordering', 'word_order', 'ordering',
  'data-analysis', 'dataanalysis'
];

// Map exercise type aliases to canonical types
const typeAliases = {
  'matching': 'chem_matching',
  'match': 'chem_matching',
  'pair_matching': 'chem_matching',
  'sentence_order': 'english_sentence_order',
  'sentence_ordering': 'english_sentence_order',
  'word_order': 'english_sentence_order',
  'ordering': 'english_sentence_order',
  'reorder': 'english_sentence_order',
  'data-analysis': 'data_analysis',
  'dataanalysis': 'data_analysis',
  'data analysis': 'data_analysis'
};

// Normalize exercise type - handle aliases
const normalizeExerciseType = (type) => {
  if (!type) return null;
  const normalized = type.toLowerCase().trim();
  return typeAliases[normalized] || normalized;
};

const multipleChoiceTypes = ['multiple-choice', 'multiple_choice', 'abc', 'quiz', 'dialogue-completion', 'mcq', 'choice'];
const trueFalseTypes = ['true-false', 'true_false', 'boolean', 'tf'];

const exerciseType = computed(() => {
  if (!props.currentExercise) return 'short-answer';
  const ex = props.currentExercise;

  // Collect all possible type values
  const possibleTypes = [ex.exerciseType, ex.content?.type, ex.data?.type, ex.type].filter(Boolean);

  // If top-level type is 'exercise', look inside content/data
  if (ex.type === 'exercise') {
    if (ex.content?.type) return normalizeExerciseType(ex.content.type);
    if (ex.data?.type) return normalizeExerciseType(ex.data.type);
  }

  // Normalize all types and find a special interactive type
  const normalizedTypes = possibleTypes.map(t => normalizeExerciseType(t));
  const foundSpecialType = normalizedTypes.find(t => specialInteractiveTypes.includes(t));
  if (foundSpecialType) return normalizeExerciseType(foundSpecialType);

  // Check for multiple choice by presence of options
  if (ex.options && Array.isArray(ex.options) && ex.options.length > 0) return 'multiple-choice';
  if (ex.content?.options && Array.isArray(ex.content.options)) return 'multiple-choice';

  // Return first available type, normalized
  return normalizeExerciseType(possibleTypes[0]) || ex.type || 'short-answer';
});

const isMultipleChoiceType = computed(() => {
  const type = exerciseType.value?.toLowerCase();
  if (specialInteractiveTypes.includes(type)) return false;
  if (multipleChoiceTypes.some(t => type?.includes(t))) return true;
  const ex = props.currentExercise;
  if (ex?.options && Array.isArray(ex.options) && ex.options.length >= 2) return true;
  if (ex?.content?.options && Array.isArray(ex.content.options)) return true;
  return false;
});

const isTrueFalseType = computed(() => trueFalseTypes.some(t => exerciseType.value?.toLowerCase()?.includes(t)));

// Check if it's a special interactive type (including aliases)
const isSpecialInteractiveType = computed(() => {
  const type = exerciseType.value;
  if (!type) return false;
  // Check if type is in special types list or has an alias mapping
  return specialInteractiveTypes.includes(type) || Object.keys(typeAliases).includes(type.toLowerCase());
});

const exerciseContentData = computed(() => {
  if (!props.currentExercise) return {};
  const ex = props.currentExercise;
  if (ex.content && typeof ex.content === 'object') return ex.content;
  if (ex.data && typeof ex.data === 'object' && !Array.isArray(ex.data)) return ex.data;
  return ex;
});

const exerciseTitle = computed(() => getLocalizedText(props.currentExercise?.title) || getLocalizedText(props.currentExercise?.content?.title) || getLocalizedText(exerciseContentData.value?.title) || 'Exercise');
const exerciseDescription = computed(() => getLocalizedText(props.currentExercise?.instructions) || getLocalizedText(props.currentExercise?.description) || getLocalizedText(props.currentExercise?.content?.description) || '');
const exerciseTypeLabel = computed(() => {
  const type = exerciseType.value;
  if (type === 'quiz') return 'Quiz Question';
  if (multipleChoiceTypes.includes(type)) return 'Multiple Choice';
  return 'Question';
});

const questionText = computed(() => getLocalizedText(props.currentExercise?.question) || getLocalizedText(props.currentExercise?.content?.question) || getLocalizedText(props.currentExercise?.data?.question) || getLocalizedText(props.currentExercise?.prompt) || 'Select the correct answer');

const normalizedOptions = computed(() => {
  const ex = props.currentExercise;
  if (ex?.options && Array.isArray(ex.options)) return ex.options;
  if (ex?.content?.options && Array.isArray(ex.content.options)) return ex.content.options;
  if (ex?.data?.options && Array.isArray(ex.data.options)) return ex.data.options;
  return [];
});

const getOptionText = (option) => {
  if (typeof option === 'string') return option;
  if (typeof option === 'number') return String(option);
  
  // Handle localized object directly
  const localized = getLocalizedText(option);
  if (localized && typeof localized === 'string') return localized;

  if (option?.text) return getLocalizedText(option.text);
  if (option?.label) return getLocalizedText(option.label);
  if (option?.value) return getLocalizedText(option.value);
  return String(option);
};

const correctAnswerIndex = computed(() => {
  const ex = props.currentExercise;
  if (typeof ex?.correctAnswer === 'number') return ex.correctAnswer;
  if (typeof ex?.content?.correctAnswer === 'number') return ex.content.correctAnswer;
  if (typeof ex?.correctAnswerIndex === 'number') return ex.correctAnswerIndex;
  if (ex?.correctAnswer !== undefined) {
    const idx = normalizedOptions.value.findIndex(opt => getOptionText(opt) === String(ex.correctAnswer) || opt === ex.correctAnswer);
    if (idx !== -1) return idx;
  }
  const correctIdx = normalizedOptions.value.findIndex(opt => opt?.isCorrect === true);
  if (correctIdx !== -1) return correctIdx;
  return 0;
});

const canSubmit = computed(() => {
  if (isMultipleChoiceType.value || isTrueFalseType.value) return userAnswer.value !== null && userAnswer.value !== undefined;
  return userAnswer.value !== null && userAnswer.value !== undefined && userAnswer.value !== '';
});

const selectOption = (idx) => { if (!showCorrectAnswer.value) userAnswer.value = idx; };

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

const submit = () => { submitLogic(props.currentExercise); emit('submit'); };
const handleNext = () => { emit('next-exercise'); };
const handleInteractiveComplete = (success) => { if (success) { answerWasCorrect.value = true; showCorrectAnswer.value = true; } };

const geometryUserAnswer = ref({ side_b: null });
const handleGeometrySubmit = (result) => {
  answerWasCorrect.value = result.isCorrect;
  showCorrectAnswer.value = true;
  if (result.isCorrect) setTimeout(() => emit('next-exercise'), 1500);
};

const isGameMode = computed(() => {
  if (!props.currentExercise) return false;
  return props.currentExercise.type === 'game' || Boolean(props.currentExercise.gameType) || ['basket-catch', 'whack-a-mole'].includes(props.currentExercise.type);
});

const gameType = computed(() => isGameMode.value ? (props.currentExercise.gameType || props.currentExercise.type || 'basket-catch') : null);
const gameData = computed(() => isGameMode.value ? { ...props.currentExercise, ...props.currentExercise.gameData } : null);

const handleGameComplete = (result) => {
  answerWasCorrect.value = result.completed || result.stars >= 2;
  showCorrectAnswer.value = true;
  setTimeout(() => emit('next-exercise'), 1500);
};

const handleGameExit = () => { resetExerciseState(); showCorrectAnswer.value = false; };

const isSelectionGame = computed(() => props.currentExercise?.type === 'selection_game' || props.currentExercise?.content?.type === 'selection_game');
const selectionGameData = computed(() => isSelectionGame.value ? (exerciseContentData.value || props.currentExercise) : { questions: [] });

const { score: selectionScore, currentQuestion: selectionCurrentQuestion, questions: selectionQuestions, selectedItemId: selectionSelectedItemId, feedback: selectionFeedback, handleSelection: selectionHandleSelection } = useSelectionGame(selectionGameData);

watch(() => props.currentExercise, () => { resetExerciseState(); userAnswer.value = null; }, { immediate: true });
</script>

<style scoped>
/* Main wrapper - full height */
.interactive-panel-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
}

/* Game mode - no background, full height */
.interactive-panel-wrapper.is-game-mode {
  background: transparent;
}

/* Game container - CRITICAL: fills all space */
.game-full-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Exercise scroll container */
.exercise-scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.exercise-content {
  padding: 1rem;
  min-height: 100%;
}

@media (min-width: 640px) {
  .exercise-content {
    padding: 1.5rem;
  }
}

/* Exercise card */
.exercise-card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

@media (min-width: 640px) {
  .exercise-card {
    border-radius: 1.5rem;
    padding: 2rem;
  }
}

/* Option buttons */
.option-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 2px solid;
  text-align: left;
  transition: all 0.2s;
  cursor: pointer;
  min-height: 48px;
}

@media (min-width: 640px) {
  .option-btn {
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 1rem;
  }
}

.option-default { border-color: #e2e8f0; background: white; }
.option-default:hover:not(:disabled) { border-color: #a78bfa; background: #faf5ff; transform: translateY(-2px); }
.option-selected { border-color: #a855f7; background: linear-gradient(135deg, #fae8ff, #f3e8ff); box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3); }
.option-correct { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5, #d1fae5); }
.option-incorrect { border-color: #ef4444; background: linear-gradient(135deg, #fef2f2, #fee2e2); }
.option-disabled { border-color: #e2e8f0; background: #f8fafc; opacity: 0.6; cursor: not-allowed; }

.option-letter {
  width: 2rem; height: 2rem;
  border-radius: 0.5rem;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.875rem;
  flex-shrink: 0;
  transition: all 0.2s;
}

@media (min-width: 640px) {
  .option-letter { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; font-size: 1rem; }
}

.letter-default { background: #f1f5f9; color: #64748b; }
.letter-selected { background: linear-gradient(135deg, #a855f7, #ec4899); color: white; }
.letter-correct { background: #10b981; color: white; }
.letter-incorrect { background: #ef4444; color: white; }
.letter-disabled { background: #e2e8f0; color: #94a3b8; }

.option-text { flex: 1; font-size: 0.875rem; font-weight: 500; color: #334155; }
@media (min-width: 640px) { .option-text { font-size: 1rem; } }

.option-check { width: 1.25rem; height: 1.25rem; color: #8b5cf6; flex-shrink: 0; }

/* True/False buttons */
.tf-btn {
  flex: 1; max-width: 140px;
  padding: 1rem; border-radius: 1rem;
  border: 3px solid;
  display: flex; flex-direction: column; align-items: center;
  cursor: pointer; transition: all 0.3s;
  min-height: 90px;
}

@media (min-width: 640px) {
  .tf-btn { max-width: 180px; padding: 1.5rem; border-radius: 1.25rem; min-height: 110px; }
}

.tf-default { border-color: #e2e8f0; background: white; }
.tf-default:hover:not(:disabled) { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); }
.tf-true-selected { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5, #d1fae5); transform: translateY(-4px); box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25); }
.tf-false-selected { border-color: #ef4444; background: linear-gradient(135deg, #fef2f2, #fee2e2); transform: translateY(-4px); box-shadow: 0 8px 24px rgba(239, 68, 68, 0.25); }

/* Feedback box */
.feedback-box {
  display: flex; gap: 0.75rem;
  padding: 0.875rem 1rem; border-radius: 0.75rem;
  border: 2px solid; align-items: flex-start;
}

@media (min-width: 640px) {
  .feedback-box { gap: 1rem; padding: 1.25rem 1.5rem; border-radius: 1rem; }
}

.feedback-success { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-color: #6ee7b7; }
.feedback-success h4 { color: #065f46; }
.feedback-success p { color: #047857; }

.feedback-error { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-color: #fca5a5; }
.feedback-error h4 { color: #991b1b; }
.feedback-error p { color: #b91c1c; }

.feedback-icon {
  width: 2rem; height: 2rem;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.feedback-success .feedback-icon { background: #10b981; color: white; }
.feedback-error .feedback-icon { background: #ef4444; color: white; }

/* Buttons */
.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white; border: none; border-radius: 0.75rem;
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
  min-height: 44px;
}

.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-success {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white; border: none; border-radius: 0.75rem;
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  min-height: 44px;
}

.btn-success:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }

/* Transitions */
.slide-fade-enter-active { transition: all 0.4s ease-out; }
.slide-fade-leave-active { transition: all 0.3s ease-in; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-10px); opacity: 0; }

/* ============================================
   TABLET RESPONSIVE (768px - 1366px)
   ============================================ */

/* iPad Mini & Small Tablets */
@media (min-width: 768px) and (max-width: 1023px) {
  .exercise-content {
    padding: 0.875rem;
  }

  .exercise-card {
    padding: 1rem;
    border-radius: 1rem;
  }

  .option-btn {
    padding: 0.625rem 0.875rem;
    gap: 0.625rem;
    min-height: 44px;
  }

  .option-letter {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }

  .option-text {
    font-size: 0.8rem;
  }

  .tf-btn {
    max-width: 120px;
    padding: 0.75rem;
    min-height: 80px;
  }

  .feedback-box {
    padding: 0.75rem;
    gap: 0.625rem;
  }

  .feedback-icon {
    width: 1.75rem;
    height: 1.75rem;
  }

  .btn-primary,
  .btn-success {
    padding: 0.625rem 1.25rem;
    font-size: 0.8rem;
    min-height: 40px;
  }
}

/* iPad Air & Larger Tablets */
@media (min-width: 1024px) and (max-width: 1366px) {
  .exercise-content {
    padding: 1rem;
  }

  .exercise-card {
    padding: 1.25rem;
  }

  .option-btn {
    padding: 0.75rem 1rem;
    min-height: 46px;
  }

  .option-letter {
    width: 2rem;
    height: 2rem;
    font-size: 0.875rem;
  }

  .tf-btn {
    max-width: 140px;
    padding: 1rem;
    min-height: 90px;
  }
}

/* Tablet Landscape - more compact */
@media (min-width: 768px) and (max-height: 800px) and (orientation: landscape) {
  .exercise-content {
    padding: 0.5rem;
  }

  .exercise-card {
    padding: 0.75rem;
  }

  header.text-center {
    margin-bottom: 0.5rem;
  }

  header .w-10 {
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.25rem;
  }

  header h2 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .option-btn {
    padding: 0.5rem 0.75rem;
    min-height: 38px;
  }

  .option-letter {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.7rem;
  }

  .option-text {
    font-size: 0.75rem;
  }

  .space-y-2 > :not([hidden]) ~ :not([hidden]),
  .space-y-3 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.375rem;
  }

  .feedback-box {
    padding: 0.5rem;
    margin-top: 0.5rem;
  }

  footer.mt-6 {
    margin-top: 0.5rem;
  }
}

/* Short screens - compact everything */
@media (max-height: 600px) {
  .exercise-content {
    padding: 0.5rem;
  }

  .exercise-card {
    padding: 0.625rem;
    border-radius: 0.75rem;
  }

  header.text-center {
    margin-bottom: 0.375rem;
  }

  header .w-10,
  header .w-12 {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.7rem;
    margin-bottom: 0.25rem;
  }

  header h2 {
    font-size: 0.875rem;
    margin-bottom: 0.125rem;
  }

  header p {
    font-size: 0.7rem;
  }

  .option-btn {
    padding: 0.375rem 0.625rem;
    min-height: 32px;
    border-radius: 0.5rem;
  }

  .option-letter {
    width: 1.25rem;
    height: 1.25rem;
    font-size: 0.625rem;
    border-radius: 0.25rem;
  }

  .option-text {
    font-size: 0.7rem;
  }

  .tf-btn {
    max-width: 100px;
    padding: 0.5rem;
    min-height: 60px;
    border-radius: 0.75rem;
  }

  .tf-btn .text-3xl {
    font-size: 1.5rem;
  }

  .feedback-box {
    padding: 0.5rem;
    gap: 0.5rem;
    border-radius: 0.5rem;
    margin-top: 0.375rem;
  }

  .feedback-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .btn-primary,
  .btn-success {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    min-height: 36px;
    border-radius: 0.5rem;
  }
}
</style>