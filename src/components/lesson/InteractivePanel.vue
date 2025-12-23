<template>
  <div class="w-full h-full flex flex-col overflow-hidden" :class="isGameMode ? '' : 'bg-slate-50'">
    
    <!-- GAME MODE - Absolute positioning to fill container completely -->
    <template v-if="isGameMode">
      <div class="absolute inset-0">
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
    </template>

    <!-- SELECTION GAME MODE -->
    <template v-else-if="isSelectionGame && selectionCurrentQuestion">
      <div class="flex-1 overflow-y-auto">
        <div class="bg-white p-4 sm:p-8 min-h-full">
          <div class="text-center mb-6 sm:mb-8">
            <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Shape Recognition</h1>
            <p class="text-sm sm:text-base text-purple-600">Click on the correct shape!</p>
            <div class="flex items-center justify-center gap-2 mt-3">
              <span class="text-yellow-500">⭐</span>
              <span class="text-sm font-semibold text-slate-900">Score: {{ selectionScore }} / {{ selectionQuestions.length }}</span>
            </div>
          </div>

          <div class="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg rounded-2xl p-4 sm:p-6 text-center mb-6 sm:mb-8">
            <h2 class="text-lg sm:text-2xl font-bold text-slate-900 mb-2">{{ selectionCurrentQuestion.prompt }}</h2>
            <p class="text-sm sm:text-base text-purple-600">{{ selectionCurrentQuestion.hint || 'Click on the shape below' }}</p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            <button
              v-for="item in selectionCurrentQuestion.items"
              :key="item.id"
              @click="selectionHandleSelection(item)"
              :disabled="selectionFeedback !== null"
              class="relative w-full aspect-square rounded-2xl border-4 transition-all duration-200"
              :class="[
                selectionSelectedItemId === item.id && selectionFeedback === 'correct' ? 'border-green-500 bg-green-50' :
                selectionSelectedItemId === item.id && selectionFeedback === 'incorrect' ? 'border-red-500 bg-red-50' :
                'border-purple-200 bg-white hover:border-purple-400 hover:shadow-lg',
                selectionFeedback !== null ? 'cursor-not-allowed' : 'cursor-pointer'
              ]"
            >
              <div class="flex flex-col items-center justify-center h-full p-2 sm:p-4">
                <img v-if="item.image" :src="item.image" :alt="item.name" class="w-16 h-16 sm:w-24 sm:h-24 object-contain mb-2" />
                <p class="text-xs sm:text-sm font-medium text-slate-700">{{ item.name }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- EXERCISE MODE -->
    <template v-else-if="currentExercise">
      <div class="flex-1 overflow-y-auto">
        <div class="p-4 sm:p-6">
          
          <!-- Exercise Header -->
          <header v-if="!isSpecialInteractiveType" class="text-center mb-6 sm:mb-8">
            <div class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
              {{ exerciseIndex + 1 }}
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{{ exerciseTitle }}</h2>
            <p v-if="exerciseDescription" class="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">{{ exerciseDescription }}</p>
          </header>

          <!-- MULTIPLE CHOICE -->
          <div v-if="isMultipleChoiceType" class="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-slate-200">
            <span class="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold text-xs sm:text-sm mb-4 sm:mb-6">
              {{ exerciseTypeLabel }}
            </span>

            <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed mb-6 sm:mb-8">{{ questionText }}</h3>

            <div class="space-y-2 sm:space-y-3">
              <button
                v-for="(option, idx) in normalizedOptions"
                :key="idx"
                @click="selectOption(idx)"
                :disabled="showCorrectAnswer"
                class="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 text-left transition-all min-h-[48px]"
                :class="getOptionClass(idx)"
              >
                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all" :class="getOptionLetterClass(idx)">
                  {{ String.fromCharCode(65 + idx) }}
                </div>
                <span class="flex-1 font-medium text-slate-700 text-sm sm:text-base">{{ getOptionText(option) }}</span>
                <svg v-if="userAnswer === idx" class="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>

            <div v-if="showCorrectAnswer" class="mt-6 p-4 rounded-xl border-2 flex gap-3" :class="answerWasCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" :class="answerWasCorrect ? 'bg-green-500' : 'bg-red-500'">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="answerWasCorrect" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h4 class="font-bold" :class="answerWasCorrect ? 'text-green-800' : 'text-red-800'">{{ answerWasCorrect ? 'Correct! 🎉' : 'Not quite right' }}</h4>
                <p v-if="!answerWasCorrect" class="text-sm mt-1" :class="answerWasCorrect ? 'text-green-700' : 'text-red-700'">
                  The correct answer is: <strong>{{ String.fromCharCode(65 + correctAnswerIndex) }}</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- TRUE/FALSE -->
          <div v-else-if="isTrueFalseType" class="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-slate-200 text-center">
            <span class="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 font-semibold text-xs sm:text-sm mb-4 sm:mb-6">
              True or False
            </span>

            <h3 class="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed mb-6 sm:mb-8">{{ questionText }}</h3>

            <div class="flex justify-center gap-4 sm:gap-6">
              <button
                @click="userAnswer = true"
                :disabled="showCorrectAnswer"
                class="flex-1 max-w-[140px] p-4 rounded-xl border-3 flex flex-col items-center transition-all min-h-[90px]"
                :class="userAnswer === true ? 'border-green-500 bg-green-50 shadow-lg -translate-y-1' : 'border-slate-200 bg-white hover:border-green-300'"
              >
                <span class="text-3xl mb-1">👍</span>
                <span class="font-bold text-sm">True</span>
              </button>
              <button
                @click="userAnswer = false"
                :disabled="showCorrectAnswer"
                class="flex-1 max-w-[140px] p-4 rounded-xl border-3 flex flex-col items-center transition-all min-h-[90px]"
                :class="userAnswer === false ? 'border-red-500 bg-red-50 shadow-lg -translate-y-1' : 'border-slate-200 bg-white hover:border-red-300'"
              >
                <span class="text-3xl mb-1">👎</span>
                <span class="font-bold text-sm">False</span>
              </button>
            </div>

            <div v-if="showCorrectAnswer" class="mt-6 p-4 rounded-xl border-2 flex gap-3 text-left max-w-sm mx-auto" :class="answerWasCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" :class="answerWasCorrect ? 'bg-green-500' : 'bg-red-500'">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="answerWasCorrect" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h4 class="font-bold" :class="answerWasCorrect ? 'text-green-800' : 'text-red-800'">{{ answerWasCorrect ? 'Correct! 🎉' : 'Not Quite' }}</h4>
                <p v-if="!answerWasCorrect" class="text-sm mt-1" :class="answerWasCorrect ? 'text-green-700' : 'text-red-700'">
                  The statement is actually <strong>{{ currentExercise.correctAnswer ? 'True' : 'False' }}</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- SPECIAL INTERACTIVE TYPES -->
          <template v-else-if="isSpecialInteractiveType">
            <ModernHistogram v-if="exerciseType === 'histogram'" :title="exerciseContentData.title || exerciseTitle" :description="exerciseContentData.description" :data="exerciseContentData.data" :correctValue="exerciseContentData.correctValue" :min="exerciseContentData.min || 0" :max="exerciseContentData.max || 100000" :step="exerciseContentData.step || 100" @complete="handleInteractiveComplete" @next="emit('next-exercise')" />
            <ModernMap v-else-if="exerciseType === 'map'" :title="exerciseContentData.title || exerciseTitle" :description="exerciseContentData.description" :image="exerciseContentData.image" :markers="exerciseContentData.markers" @complete="handleInteractiveComplete" @next="emit('next-exercise')" />
            <ModernBlockCoding v-else-if="exerciseType === 'block-coding'" :type="exerciseContentData.subtype || 'maze'" :title="exerciseContentData.title || exerciseTitle" :description="exerciseContentData.description" :availableBlocks="exerciseContentData.availableBlocks" :config="exerciseContentData.config" @complete="handleInteractiveComplete" @next="emit('next-exercise')" />
            <GeometryExercise v-else-if="exerciseType === 'geometry'" :geometryData="exerciseContentData" :userAnswer="geometryUserAnswer" @update:userAnswer="geometryUserAnswer = $event" @submit="handleGeometrySubmit" @next-exercise="emit('next-exercise')" />
            <DataAnalysisStep v-else-if="exerciseType === 'data_analysis'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <FractionVisualStep v-else-if="exerciseType === 'fraction_visual'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <GeometryPolyStep v-else-if="exerciseType === 'geometry_poly'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <ChemMixingStep v-else-if="exerciseType === 'chem_mixing'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <ChemMatchingStep v-else-if="exerciseType === 'chem_matching'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <EnglishSentenceFixStep v-else-if="exerciseType === 'english_sentence_fix'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <EnglishSentenceOrderStep v-else-if="exerciseType === 'english_sentence_order'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <LanguageNounBagStep v-else-if="exerciseType === 'language_noun_bag'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <LanguageToneTransformer v-else-if="exerciseType === 'language_tone_transformer'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <LanguageIdiomBridge v-else-if="exerciseType === 'language_idiom_bridge'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <LanguageWordConstellation v-else-if="exerciseType === 'language_word_constellation'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <LanguageRhythmMatch v-else-if="exerciseType === 'language_rhythm_match'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
            <LanguageFalseFriends v-else-if="exerciseType === 'language_false_friends'" :step="exerciseContentData" @complete="handleInteractiveComplete" />
          </template>

          <!-- FALLBACK -->
          <div v-else class="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-slate-200">
            <span class="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs sm:text-sm mb-4">
              {{ exerciseType || 'Exercise' }}
            </span>
            <h3 v-if="questionText" class="text-lg sm:text-xl font-bold text-slate-900 mb-4">{{ questionText }}</h3>
            <textarea v-model="userAnswer" placeholder="Type your answer here..." :disabled="showCorrectAnswer" class="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 outline-none resize-none h-32 text-base"></textarea>
          </div>

          <!-- Submit/Next Button -->
          <footer v-if="!isSpecialInteractiveType" class="mt-6 flex justify-end">
            <button v-if="!showCorrectAnswer" @click="submit" :disabled="!canSubmit" class="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]">
              Check Answer
            </button>
            <button v-else @click="handleNext" class="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all min-h-[48px]">
              Continue →
            </button>
          </footer>
        </div>
      </div>
    </template>
    
    <!-- Loading State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useExercises } from '@/composables/useExercises';
import { useSelectionGame } from '@/composables/useSelectionGame';

import GameContainer from '@/components/games/base/GameContainer.vue';
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

const { userAnswer, answerWasCorrect, showCorrectAnswer, submitAnswer: submitLogic, resetExerciseState } = useExercises();

const specialInteractiveTypes = ['histogram', 'map', 'block-coding', 'data_analysis', 'fraction_visual', 'geometry_poly', 'chem_mixing', 'chem_matching', 'english_sentence_fix', 'english_sentence_order', 'language_noun_bag', 'geometry', 'language_tone_transformer', 'language_idiom_bridge', 'language_word_constellation', 'language_rhythm_match', 'language_false_friends'];
const multipleChoiceTypes = ['multiple-choice', 'multiple_choice', 'abc', 'quiz', 'dialogue-completion', 'mcq', 'choice'];
const trueFalseTypes = ['true-false', 'true_false', 'boolean', 'tf'];

const exerciseType = computed(() => {
  if (!props.currentExercise) return 'short-answer';
  const ex = props.currentExercise;
  const types = [ex.exerciseType, ex.content?.type, ex.data?.type, ex.type].filter(Boolean);
  if (ex.type === 'exercise' && (ex.content?.type || ex.data?.type)) return ex.content?.type || ex.data?.type;
  const found = types.find(t => specialInteractiveTypes.includes(t));
  if (found) return found;
  if ((ex.options?.length || ex.content?.options?.length) >= 2) return 'multiple-choice';
  return types[0] || 'short-answer';
});

const isMultipleChoiceType = computed(() => {
  const t = exerciseType.value?.toLowerCase();
  if (specialInteractiveTypes.includes(t)) return false;
  if (multipleChoiceTypes.some(m => t?.includes(m))) return true;
  return (props.currentExercise?.options?.length >= 2 || props.currentExercise?.content?.options?.length >= 2);
});

const isTrueFalseType = computed(() => trueFalseTypes.some(t => exerciseType.value?.toLowerCase()?.includes(t)));
const isSpecialInteractiveType = computed(() => specialInteractiveTypes.includes(exerciseType.value));

const exerciseContentData = computed(() => {
  const ex = props.currentExercise;
  if (ex?.content && typeof ex.content === 'object') return ex.content;
  if (ex?.data && typeof ex.data === 'object') return ex.data;
  return ex || {};
});

const exerciseTitle = computed(() => props.currentExercise?.title || props.currentExercise?.content?.title || 'Exercise');
const exerciseDescription = computed(() => props.currentExercise?.instructions || props.currentExercise?.description || props.currentExercise?.content?.description || '');
const exerciseTypeLabel = computed(() => exerciseType.value === 'quiz' ? 'Quiz Question' : multipleChoiceTypes.includes(exerciseType.value) ? 'Multiple Choice' : 'Question');
const questionText = computed(() => props.currentExercise?.question || props.currentExercise?.content?.question || props.currentExercise?.prompt || 'Select the correct answer');

const normalizedOptions = computed(() => {
  const ex = props.currentExercise;
  return ex?.options || ex?.content?.options || ex?.data?.options || [];
});

const getOptionText = (opt) => typeof opt === 'string' ? opt : opt?.text || opt?.label || opt?.value || String(opt);

const correctAnswerIndex = computed(() => {
  const ex = props.currentExercise;
  if (typeof ex?.correctAnswer === 'number') return ex.correctAnswer;
  if (typeof ex?.content?.correctAnswer === 'number') return ex.content.correctAnswer;
  if (typeof ex?.correctAnswerIndex === 'number') return ex.correctAnswerIndex;
  const idx = normalizedOptions.value.findIndex(o => getOptionText(o) === String(ex?.correctAnswer) || o?.isCorrect);
  return idx !== -1 ? idx : 0;
});

const canSubmit = computed(() => isMultipleChoiceType.value || isTrueFalseType.value ? userAnswer.value != null : !!userAnswer.value);

const selectOption = (idx) => { if (!showCorrectAnswer.value) userAnswer.value = idx; };

const getOptionClass = (idx) => {
  const sel = userAnswer.value === idx, cor = idx === correctAnswerIndex.value;
  if (showCorrectAnswer.value) {
    if (cor) return 'border-green-500 bg-green-50';
    if (sel) return 'border-red-500 bg-red-50';
    return 'border-slate-200 bg-slate-50 opacity-60';
  }
  return sel ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50';
};

const getOptionLetterClass = (idx) => {
  const sel = userAnswer.value === idx, cor = idx === correctAnswerIndex.value;
  if (showCorrectAnswer.value) {
    if (cor) return 'bg-green-500 text-white';
    if (sel) return 'bg-red-500 text-white';
    return 'bg-slate-200 text-slate-400';
  }
  return sel ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-slate-100 text-slate-500';
};

const submit = () => { submitLogic(props.currentExercise); emit('submit'); };
const handleNext = () => emit('next-exercise');
const handleInteractiveComplete = (success) => { if (success) { answerWasCorrect.value = true; showCorrectAnswer.value = true; } };

const geometryUserAnswer = ref({ side_b: null });
const handleGeometrySubmit = (r) => { answerWasCorrect.value = r.isCorrect; showCorrectAnswer.value = true; if (r.isCorrect) setTimeout(() => emit('next-exercise'), 1500); };

const isGameMode = computed(() => {
  const ex = props.currentExercise;
  return ex?.type === 'game' || !!ex?.gameType || ['basket-catch', 'whack-a-mole'].includes(ex?.type);
});

const gameType = computed(() => isGameMode.value ? (props.currentExercise.gameType || props.currentExercise.type || 'basket-catch') : null);
const gameData = computed(() => isGameMode.value ? { ...props.currentExercise, ...props.currentExercise.gameData } : null);

const handleGameComplete = (r) => { answerWasCorrect.value = r.completed || r.stars >= 2; showCorrectAnswer.value = true; setTimeout(() => emit('next-exercise'), 1500); };
const handleGameExit = () => { resetExerciseState(); showCorrectAnswer.value = false; };

const isSelectionGame = computed(() => ['selection_game'].includes(props.currentExercise?.type || props.currentExercise?.content?.type));
const selectionGameData = computed(() => isSelectionGame.value ? (exerciseContentData.value || props.currentExercise) : { questions: [] });
const { score: selectionScore, currentQuestion: selectionCurrentQuestion, questions: selectionQuestions, selectedItemId: selectionSelectedItemId, feedback: selectionFeedback, handleSelection: selectionHandleSelection } = useSelectionGame(selectionGameData);

watch(() => props.currentExercise, () => { resetExerciseState(); userAnswer.value = null; }, { immediate: true });
</script>

<style scoped>
.border-3 { border-width: 3px; }
</style>