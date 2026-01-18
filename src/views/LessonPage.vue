<template>
  <div class="lesson-page">
    <!-- Loading Screen -->
    <div v-if="loading" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 p-4">
      <div class="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p class="text-slate-600 font-medium">{{ $t('loadingStates.lesson') }}</p>
    </div>

    <!-- Error Screen -->
    <div v-else-if="error" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold text-slate-800 mb-2">{{ $t('loadingStates.errorLoading') }}</h3>
      <p class="text-slate-500 mb-6 max-w-sm">{{ error }}</p>
      <div class="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button @click="retryLoad" class="flex-1 py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Try Again
        </button>
        <button @click="handleReturnToCatalogue" class="flex-1 py-3 px-6 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back
        </button>
      </div>
    </div>

    <!-- Premium Content Modal -->
    <Teleport to="body">
      <div v-if="showPaywallModal" class="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-xs p-6 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Premium Content</h3>
          <p class="text-slate-500 text-sm mb-6">Upgrade to access this lesson</p>
          <div class="space-y-2">
            <button @click="$router.push('/pay/start')" class="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
              Get Premium
            </button>
            <button @click="handleReturnToCatalogue" class="w-full py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors">
              Go Back
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Exit Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showExitModal" class="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-xs p-6 text-center">
          <h3 class="text-lg font-bold text-slate-900 mb-2">Leave Lesson?</h3>
          <p class="text-slate-500 text-sm mb-6">Your progress will be saved</p>
          <div class="space-y-2">
            <button @click="exitLesson" class="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
              Leave
            </button>
            <button @click="cancelExit" class="w-full py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors">
              Stay
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Problem Report Modal -->
    <Teleport to="body">
      <div v-if="showProblemReportModal" class="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4" @click.self="closeProblemReportModal">
        <div class="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-900">Report Issue</h3>
            <button @click="closeProblemReportModal" class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select v-model="problemType" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                <option value="">Select...</option>
                <option value="content">Content Error</option>
                <option value="technical">Technical</option>
                <option value="exercise">Exercise</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
              <textarea
                v-model="problemDescription"
                rows="3"
                placeholder="Describe the issue..."
                class="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                :class="showValidationError && !problemDescription.trim() ? 'border-red-300' : 'border-slate-200'"
              ></textarea>
              <p v-if="showValidationError && !problemDescription.trim()" class="mt-1 text-xs text-red-500">Required</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Contact (optional)</label>
              <input
                type="text"
                v-model="contactInfo"
                placeholder="Email or @telegram"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
            </div>
          </div>
          <div class="px-5 py-4 border-t border-slate-100 flex gap-3">
            <button @click="closeProblemReportModal" class="flex-1 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button
              @click="submitProblemReport"
              :disabled="isSubmitting"
              class="flex-1 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Success Notification -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-x-full"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-full"
      >
        <div v-if="showSuccessMessage" class="fixed top-4 right-4 z-[2000] max-w-sm w-full">
          <div class="bg-white rounded-2xl shadow-xl border border-emerald-100 p-4 flex items-start gap-4">
            <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-slate-800">Report Sent!</h4>
              <p class="text-sm text-slate-500 mt-0.5">Thank you for helping us improve.</p>
            </div>
            <button @click="closeSuccessMessage" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Vocabulary Modal -->
    <VocabularyModal
      v-if="vocabularyModal.isVisible"
      :vocabulary-data="vocabularyModal"
      :card-animation="cardAnimation"
      :current-word="currentVocabWord"
      :progress="vocabProgress"
      :is-last-word="isLastVocabWord"
      @show-definition="showVocabDefinition"
      @hide-definition="hideVocabDefinition"
      @mark-learned="markWordAsLearned"
      @next-word="nextVocabWord"
      @previous-word="previousVocabWord"
      @skip="skipVocabularyModal"
      @restart="restartVocabulary"
      @close="closeVocabularyModal"
      @pronounce="pronounceWord"
      @jump-to-word="jumpToVocabWord"
    />

    <!-- Lesson Intro -->
    <LessonIntro
      v-if="!started && !showPaywallModal && !loading && !error"
      :lesson="lesson"
      :estimated-time="estimatedTime"
      :steps="steps"
      :previous-progress="previousProgress"
      @start="startLesson"
      @continue="continuePreviousProgress"
      @exit="confirmExit"
      @report-problem="openProblemReportModal"
    />

    <!-- Main Lesson Content -->
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container-new">
      <!-- Header -->
      <LessonHeader
        :lesson="lesson"
        :current-step="currentIndex + 1"
        :total-steps="steps.length"
        :formatted-time="readableTime"
        :stars="stars"
        :progress-percentage="progressPercentage"
        :streak="consecutiveCorrect"
        :points="earnedPoints"
        :is-speaking="isAISpeaking"
        :is-listening="isListening"
        :is-analyzing="isAnalyzing"
        @exit="confirmExit"
        @report-problem="openProblemReportModal"
        @toggle-speech="handleToggleSpeech"
        @toggle-voice-input="toggleMicrophone"
      />

      <!-- Split Screen Layout -->
      <div class="split-content" :class="{ 'is-game-active': isGameStep }" ref="splitContainer">
        <div class="split-panel content-side" :style="leftPanelStyle">
          <ContentPanel
            :current-step="currentStep"
            :current-index="currentIndex"
            :is-interactive-step="isInteractiveStep"
            :is-game-step="isGameStep"
            :show-explanation-always="true"
            :current-exercise="getCurrentExercise(currentStep)"
            :current-quiz="getCurrentQuiz(currentStep)"
            :exercise-index="currentExerciseIndex"
            :quiz-index="currentQuizIndex"
            :total-exercises="getTotalExercises(currentStep)"
            :total-quizzes="getTotalQuizzes(currentStep)"
            :show-explanation-help="showExplanationHelp"
            :explanation-question="explanationQuestion"
            :explanation-ai-response="explanationAIResponse"
            :is-loading-explanation="isLoadingExplanation"
            :is-last-step="isLastStep"
            @toggle-explanation-help="toggleExplanationHelp"
            @update:explanation-question="explanationQuestion = $event"
            @ask-explanation="askAboutExplanation"
            @init-vocabulary="initializeVocabularyModal"
            @pronounce="pronounceWord"
            @next="goNext"
            @previous="goPrevious"
          />
        </div>

        <div
          v-if="!resizeDisabled"
          class="resize-handle"
          @mousedown="startResize"
          @touchstart="startResize"
          :class="{ 'is-resizing': isResizing }"
        >
          <div class="handle-bar"></div>
        </div>

        <div class="split-panel interactive-side" :style="rightPanelStyle">
          <div v-if="isInteractiveStep || isGameStep" class="interactive-container">
            <InteractivePanel
              :key="currentStep?.id || currentStep?._id || currentIndex"
              :current-step="currentStep"
              :current-exercise="getCurrentExercise(currentStep)"
              :current-quiz="getCurrentQuiz(currentStep)"
              :exercise-index="currentExerciseIndex"
              :quiz-index="currentQuizIndex"
              :total-exercises="getTotalExercises(currentStep)"
              :total-quizzes="getTotalQuizzes(currentStep)"
              :user-answer="userAnswer"
              :confirmation="confirmation"
              :answer-was-correct="answerWasCorrect"
              :current-hint="currentHint"
              :smart-hint="smartHint"
              :mistake-count="mistakeCount"
              :fill-blank-answers="fillBlankAnswers"
              :matching-pairs="matchingPairs"
              :selected-matching-item="selectedMatchingItem"
              :ordering-items="orderingItems"
              :drag-drop-placements="dragDropPlacements"
              :available-drag-items="availableDragItems"
              :drop-zones="dropZones"
              :attempt-count="attemptCount"
              :max-attempts="maxAttempts"
              :is-on-second-chance="isOnSecondChance"
              :show-correct-answer="showCorrectAnswer"
              :correct-answer-text="correctAnswerText"
              @answer-changed="handleAnswerChanged"
              @fill-blank-updated="updateFillBlankAnswer"
              @submit="handleSubmitOrNext"
              @next-exercise="goToNextExercise"
              @next-quiz="goToNextQuiz"
              @show-hint="showHint"
              @clear-hint="clearSmartHint"
              @matching-item-selected="handleMatchingItemSelected"
              @remove-matching-pair="handleRemoveMatchingPair"
              @drag-item-start="handleDragItemStart"
              @drag-over-zone="handleDragOverZone"
              @drag-leave-zone="handleDragLeaveZone"
              @drop-in-zone="handleDropInZone"
              @remove-dropped-item="handleRemoveDroppedItem"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Completion Screen -->
    <CompletionScreen
      v-if="lessonCompleted"
      :lesson="lesson"
      :readable-time="readableTime"
      :stars="stars"
      :mistake-count="mistakeCount"
      :earned-points="earnedPoints"
      :medal-label="medalLabel"
      :medal-icon="getMedalIcon()"
      :progress-insight="progressInsight"
      :total-steps="steps.length"
      :extraction-results="extractionResults"
      @return-to-catalogue="handleReturnToCatalogue"
      @share="shareResult"
      @homework="handleGoToHomework"
      @vocabulary="goToVocabulary"
    >
      <template #extra-actions>
        <button
          @click="openProblemReportModal"
          class="w-full py-3 px-4 text-slate-500 hover:text-amber-600 font-medium rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Report an issue with this lesson
        </button>
      </template>
    </CompletionScreen>

    <!-- Migration Panel -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-full"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-full"
      >
        <div v-if="showMigrationPanel" class="fixed bottom-4 right-4 z-[100] max-w-sm w-full">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
                <h3 class="font-semibold text-slate-800">Content Update</h3>
              </div>
            </div>
            <div class="px-5 py-4">
              <p class="text-sm text-slate-600 mb-4">Create assignments and vocabulary from completed lessons?</p>
              <div class="flex gap-3">
                <button
                  @click="migrateLessonContent"
                  :disabled="migrationLoading"
                  class="flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg v-if="!migrationLoading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                  <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ migrationLoading ? 'Processing...' : 'Update' }}
                </button>
                <button @click="closeMigrationPanel" class="py-2.5 px-4 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Floating AI Button -->
    <button
      v-if="started && !lessonCompleted"
      @click="toggleFloatingAI"
      class="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110 hover:shadow-xl z-50"
      :class="showFloatingAI ? 'bg-cyan-500 shadow-cyan-500/40' : 'bg-indigo-600 shadow-indigo-500/40'"
      aria-label="AI Assistant"
    >
      <span v-if="showFloatingAI">✕</span>
      <span v-else>🤖</span>
    </button>

    <!-- Floating AI Chat Panel with Speech Analysis -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
      >
        <FloatingAIAssistant
          v-if="showFloatingAI"
          :current-step="currentStep"
          :ai-chat-history="formattedAIChatHistory"
          :ai-is-loading="isAITyping"
          :user-progress="aiUserProgress"
          :ai-usage="aiUsage"
          :lesson-id="lessonIdForAI"
          :current-slide-index="currentIndex"
          @close="toggleFloatingAI"
          @send-message="handleAISendMessage"
          @ask-ai="handleAIQuickQuestion"
          @clear-chat="clearAIChat"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, isRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

// Import child components
import VocabularyModal from '@/components/lesson/VocabularyModal.vue'
import LessonIntro from '@/components/lesson/LessonIntro.vue'
import ContentPanel from '@/components/lesson/ContentPanel.vue'
import InteractivePanel from '@/components/lesson/InteractivePanel.vue'
import CompletionScreen from '@/components/lesson/CompletionScreen.vue'
import FloatingAIAssistant from '@/components/lesson/FloatingAIAssistant.vue'
import LessonHeader from '@/components/lesson/LessonHeader.vue'

// Import Composables
import { useVoiceAssistant } from '@/composables/useVoiceAssistant'
import { eventBus } from '@/utils/eventBus'

// Import API
import { getLessonById } from '@/api/lessons'
import { getLessonAIResponse, getUserUsage } from '@/services/GPTService'
import { clearChatHistory } from '@/api/chat'

// Import language composable for multi-language support
import { useLanguage, getLocalizedText } from '@/composables/useLanguage';

const route = useRoute()
const router = useRouter()
const i18n = useI18n()
const { t } = i18n
const { language, setLanguage, currentLanguageInfo } = useLanguage();

// Voice Assistant Composable
const {
  isSpeaking,
  isListening,
  isAnalyzing,
  toggleMicrophone,
  stopAudio,
  analyzeAndSpeak,
  preAnalyzeSteps,
  handleVoiceQuestion
} = useVoiceAssistant(i18n);

// ==================== LOCALIZATION HELPERS ====================

    // Helper to get localized text
    // Now using the shared helper from useLanguage.js
    
    // Helper to extract lesson title
    const extractLessonTitle = (lesson) => {
      if (!lesson) return 'Lesson';
      return getLocalizedText(lesson, 'lessonName') || 
             getLocalizedText(lesson, 'title') || 
             getLocalizedText(lesson, 'name') || 
             'Lesson';
    };

    // Helper to extract lesson description
    const extractLessonDescription = (lesson) => {
      if (!lesson) return '';
      return getLocalizedText(lesson, 'subtitle') || 
             getLocalizedText(lesson, 'description') || 
             getLocalizedText(lesson, 'summary') || 
             getLocalizedText(lesson, 'desc') || 
             '';
    };

/**
 * Process step content with localization
 */
function processStepWithLocalization(step, index) {
  if (!step) return null

  const lang = language.value || localStorage.getItem('lang') || 'ru'

  // Extract localized content
  const getStepField = (fieldName) => {
    const value = step[fieldName]

    if (typeof value === 'string') return value

    if (typeof value === 'object' && value !== null) {
      return value[lang] || value.en || value.ru || value.uz || ''
    }

    // Check step.data for the field
    if (step.data && step.data[fieldName]) {
      const dataValue = step.data[fieldName]
      if (typeof dataValue === 'string') return dataValue
      if (typeof dataValue === 'object' && dataValue !== null) {
        return dataValue[lang] || dataValue.en || dataValue.ru || dataValue.uz || ''
      }
    }

    return ''
  }

  return {
    ...step,
    id: step.id || step._id || `step_${index}`,
    type: step.type || 'explanation',
    title: getLocalizedText(step, 'title') || `Step ${index + 1}`,
    content: step.content, // Pass the entire content
    description: getLocalizedText(step, 'description'),
    explanation: getLocalizedText(step, 'explanation'),
    // Preserve other step properties
    data: step.data,
    images: step.images || [],
    // Look for exercises in multiple locations - exercises are in content.exercises
    exercises: step.exercises || step.content?.exercises || step.data?.exercises || [],
    // Look for quizzes - quiz questions are in content.questions
    quizzes: step.quizzes || step.content?.questions || step.data?.quizzes || [],
    options: step.options || step.data?.options || [],
    // Preserve vocabulary for vocabulary steps - terms are in content.terms
    vocabulary: step.vocabulary || step.content?.terms || step.data?.vocabulary || step.words || step.data?.words || []
  }
}

// ==================== STATE ====================

// Loading & Error
const loading = ref(true)
const error = ref(null)

// Lesson Data
const lesson = ref(null)
const steps = ref([])
const currentIndex = ref(0)
const started = ref(false)
const lessonCompleted = ref(false)
const previousProgress = ref(null)

// Modals
const showPaywallModal = ref(false)
const showExitModal = ref(false)
const showProblemReportModal = ref(false)
const showSuccessMessage = ref(false)
const showMigrationPanel = ref(false)

// Problem Report
const problemType = ref('')
const problemDescription = ref('')
const contactInfo = ref('')
const showValidationError = ref(false)
const isSubmitting = ref(false)

// Progress & Scoring
const consecutiveCorrect = ref(0)
const earnedPoints = ref(0)
const mistakeCount = ref(0)
const stars = ref(0)
const readableTime = ref('0:00')
const medalLabel = ref('')
const progressInsight = ref('')
const extractionResults = ref(null)

// Exercise State
const currentExerciseIndex = ref(0)
const currentQuizIndex = ref(0)
const userAnswer = ref('')
const confirmation = ref(null)
const answerWasCorrect = ref(false)
const currentHint = ref('')
const smartHint = ref('')
const fillBlankAnswers = ref({})
const matchingPairs = ref([])
const selectedMatchingItem = ref(null)
const orderingItems = ref([])
const dragDropPlacements = ref({})
const availableDragItems = ref([])
const dropZones = ref([])
const attemptCount = ref(0)
const maxAttempts = ref(3)
const isOnSecondChance = ref(false)
const showCorrectAnswer = ref(false)
const correctAnswerText = ref('')

// Explanation Help
const showExplanationHelp = ref(false)
const explanationQuestion = ref('')
const explanationAIResponse = ref('')
const isLoadingExplanation = ref(false)

// Vocabulary Modal
const vocabularyModal = ref({ isVisible: false })
const cardAnimation = ref('')
const currentVocabWord = ref(null)
const vocabProgress = ref({ current: 0, total: 0 })
const isLastVocabWord = ref(false)

// Resize
const splitContainer = ref(null)
const isResizing = ref(false)
const leftPanelWidth = ref(50)
const resizeDisabled = ref(false)

// Floating AI
const showFloatingAI = ref(false)
const aiChatMessages = ref([])
const aiChatInput = ref('')
const isAITyping = ref(false)
const voiceEnabled = ref(true)
const aiUsage = ref({
  current: 0,
  limit: 50,
  remaining: 50,
  percentage: 0,
  unlimited: false,
  plan: 'free'
})

// Migration
const migrationLoading = ref(false)

// ==================== COMPUTED ====================

const currentStep = computed(() => steps.value[currentIndex.value] || null)

const progressPercentage = computed(() => {
  if (steps.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / steps.value.length) * 100)
})

const isAISpeaking = computed(() => isSpeaking.value)

const estimatedTime = computed(() => {
  // Use lesson's timing if available, otherwise calculate from steps
  // Returns a NUMBER (LessonIntro adds formatting)
  if (lesson.value?.estimatedDuration) {
    return Number(lesson.value.estimatedDuration) || 0
  }
  if (lesson.value?.timing?.estimatedDuration) {
    return Number(lesson.value.timing.estimatedDuration) || 0
  }
  const totalSteps = steps.value.length
  if (totalSteps === 0) return 0
  return Math.ceil(totalSteps * 1.5)
})

const isInteractiveStep = computed(() => {
  const step = currentStep.value
  if (!step) return false

  // Check standard interactive types
  if (step.type === 'exercise' || step.type === 'quiz') return true

  // Check for special interactive types
  const stepType = step.type?.toLowerCase()
  const contentType = step.content?.type?.toLowerCase() || step.data?.type?.toLowerCase()

  const specialTypes = [
    'histogram', 'map', 'block-coding', 'data_analysis', 'fraction_visual',
    'geometry_poly', 'chem_mixing', 'chem_matching', 'english_sentence_fix',
    'english_sentence_order', 'language_noun_bag', 'geometry',
    'language_tone_transformer', 'language_idiom_bridge',
    'language_word_constellation', 'language_rhythm_match', 'language_false_friends',
    'matching', 'sentence_order', 'sentence_ordering', 'word_order', 'ordering',
    'data-analysis', 'dataanalysis', 'match', 'pair_matching', 'reorder'
  ]

  return (stepType && specialTypes.includes(stepType)) ||
         (contentType && specialTypes.includes(contentType))
})

const isGameStep = computed(() => {
  const step = currentStep.value
  if (!step) return false
  return step.type === 'game'
})

const isLastStep = computed(() => currentIndex.value === steps.value.length - 1)

// Format AI chat messages for FloatingAIAssistant component
const formattedAIChatHistory = computed(() => {
  return aiChatMessages.value.map((msg, index) => ({
    id: `msg-${index}-${Date.now()}`,
    type: msg.role === 'user' ? 'user' : 'ai',
    content: msg.content,
    timestamp: msg.timestamp || new Date().toISOString()
  }))
})

// User progress for AI personalization (RAG Architecture)
// This is passed to FloatingAIAssistant for contextual suggestions
const aiUserProgress = computed(() => ({
  currentStep: currentIndex.value,
  completedSteps: currentIndex.value,
  mistakes: mistakeCount.value,
  stars: stars.value,
  progressPercent: progressPercentage.value,
  consecutiveCorrect: consecutiveCorrect.value,
  // Track weak areas based on mistakes (for personalization)
  weakAreas: [],
  recentMistakes: []
}))

// CRITICAL: Lesson ID for FloatingAIAssistant (RAG - enables backend to fetch lesson data)
const lessonIdForAI = computed(() => {
  const l = lesson.value;
  // Fallback to route params (support both 'id' and 'lessonId')
  const routeId = route.params.id || route.params.lessonId;

  if (!l) return routeId || '';
  
  if (typeof l._id === 'string') return l._id;
  if (l._id && l._id.$oid) return l._id.$oid; // Handle MongoDB extended JSON
  if (l.id) return l.id;
  
  return String(l._id || routeId || '');
})

const leftPanelStyle = computed(() => ({
  width: resizeDisabled.value ? '100%' : `${leftPanelWidth.value}%`
}))

const rightPanelStyle = computed(() => ({
  width: resizeDisabled.value ? '0%' : `${100 - leftPanelWidth.value}%`
}))

// ==================== METHODS ====================

// Loading & Navigation
async function loadLesson() {
  loading.value = true
  error.value = null

  try {
    const lessonId = route.params.id
    if (!lessonId) {
      throw new Error('No lesson ID provided')
    }

    const result = await getLessonById(lessonId)

    if (result.success && result.data) {
      const lessonData = result.data

      // Extract localized title and description using helper functions
      const localizedTitle = extractLessonTitle(lessonData)
      const localizedDescription = extractLessonDescription(lessonData)

      // DEBUG: Log lesson data loading
      console.log('📥 [LessonPage] loadLesson setting lesson.value:', {
        id: lessonData._id || lessonData.id,
        title: localizedTitle,
        isRef: isRef(lesson) // Check if it's a ref
      });

      // Map backend fields to frontend display with localization
      lesson.value = {
        ...lessonData,
        title: localizedTitle,
        subtitle: localizedDescription,
        estimatedDuration: lessonData.timing?.estimatedDuration || 0
      }

      // Extract and process steps with localization
      const rawSteps = lessonData.steps || []
      steps.value = rawSteps.map((step, index) => processStepWithLocalization(step, index)).filter(Boolean)

      // Trigger pre-analysis in the background
      if (steps.value.length > 0) {
        preAnalyzeSteps(steps.value, language.value)
      }
    } else {
      throw new Error(result.error || 'Failed to load lesson data')
    }
  } catch (err) {
    console.error('[LessonPage] loadLesson error:', err)
    error.value = err.message || 'Failed to load lesson'
  } finally {
    loading.value = false
  }
}

function retryLoad() {
  loadLesson()
}

function handleReturnToCatalogue() {
  router.push('/profile/catalogue')
}

function handleToggleSpeech() {
  if (isSpeaking.value) {
    stopAudio()
  } else {
    analyzeAndSpeak(currentStep.value)
  }
}

function handleSpeakingStart() {
  // Handled by composable
}

function handleSpeakingEnd() {
  // Handled by composable
}

function startLesson() {
  started.value = true
  if (steps.value[currentIndex.value]) {
    analyzeAndSpeak(steps.value[currentIndex.value], true) // isFirstStep = true
  }
}

function continuePreviousProgress() {
  if (previousProgress.value) {
    currentIndex.value = previousProgress.value.stepIndex || 0
  }
  started.value = true
}

function confirmExit() {
  showExitModal.value = true
}

function cancelExit() {
  showExitModal.value = false
}

function exitLesson() {
  showExitModal.value = false
  handleReturnToCatalogue()
}

// Navigation
function goNext() {
  if (currentIndex.value < steps.value.length - 1) {
    currentIndex.value++
    resetExerciseState()
  } else {
    completeLesson()
  }
}

function goPrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetExerciseState()
  }
}

function resetExerciseState(fullReset = true) {
  userAnswer.value = ''
  confirmation.value = null
  answerWasCorrect.value = false
  currentHint.value = ''
  smartHint.value = ''
  fillBlankAnswers.value = {}
  matchingPairs.value = []
  selectedMatchingItem.value = null
  attemptCount.value = 0
  isOnSecondChance.value = false
  showCorrectAnswer.value = false
  correctAnswerText.value = ''
  // Only reset indices when doing a full reset (e.g., moving to a new step)
  if (fullReset) {
    currentExerciseIndex.value = 0
    currentQuizIndex.value = 0
  }
}

function completeLesson() {
  lessonCompleted.value = true
  calculateResults()
}

function calculateResults() {
  const totalSteps = steps.value.length
  const accuracy = totalSteps > 0 ? (totalSteps - mistakeCount.value) / totalSteps : 1
  
  if (accuracy >= 0.9) {
    stars.value = 3
    medalLabel.value = 'Gold'
  } else if (accuracy >= 0.7) {
    stars.value = 2
    medalLabel.value = 'Silver'
  } else {
    stars.value = 1
    medalLabel.value = 'Bronze'
  }
  
  progressInsight.value = `You completed ${totalSteps} steps with ${mistakeCount.value} mistakes.`
}

function getMedalIcon() {
  const icons = {
    Gold: '🥇',
    Silver: '🥈',
    Bronze: '🥉'
  }
  return icons[medalLabel.value] || '🏅'
}

function shareResult() {
  // Share functionality
  console.log('Sharing result...')
}

function handleGoToHomework() {
  router.push('/homework')
}

function goToVocabulary() {
  router.push('/vocabulary')
}

// Helper to extract exercises from various possible locations in step data
function extractExercisesFromStep(step) {
  if (!step) return []

  // Try all possible locations where exercises might be stored
  if (step.exercises && Array.isArray(step.exercises) && step.exercises.length > 0) {
    return step.exercises
  }
  if (step.content?.exercises && Array.isArray(step.content.exercises) && step.content.exercises.length > 0) {
    return step.content.exercises
  }
  if (step.data?.exercises && Array.isArray(step.data.exercises) && step.data.exercises.length > 0) {
    return step.data.exercises
  }
  // Also check for questions (some exercise types use this)
  if (step.questions && Array.isArray(step.questions) && step.questions.length > 0) {
    return step.questions
  }
  if (step.content?.questions && Array.isArray(step.content.questions) && step.content.questions.length > 0) {
    return step.content.questions
  }

  return []
}

// Helper to extract quiz questions from various possible locations
function extractQuizzesFromStep(step) {
  if (!step) return []

  if (step.quizzes && Array.isArray(step.quizzes) && step.quizzes.length > 0) {
    return step.quizzes
  }
  if (step.content?.questions && Array.isArray(step.content.questions) && step.content.questions.length > 0) {
    return step.content.questions
  }
  if (step.data?.quizzes && Array.isArray(step.data.quizzes) && step.data.quizzes.length > 0) {
    return step.data.quizzes
  }
  if (step.data?.questions && Array.isArray(step.data.questions) && step.data.questions.length > 0) {
    return step.data.questions
  }

  return []
}

// Exercise Helpers
// Special interactive types that are handled as single exercises (not arrays)
const specialInteractiveTypes = [
  'histogram', 'map', 'block-coding', 'data_analysis', 'fraction_visual',
  'geometry_poly', 'chem_mixing', 'chem_matching', 'english_sentence_fix',
  'english_sentence_order', 'language_noun_bag', 'geometry',
  'language_tone_transformer', 'language_idiom_bridge',
  'language_word_constellation', 'language_rhythm_match', 'language_false_friends',
  // Common aliases
  'matching', 'sentence_order', 'sentence_ordering', 'word_order', 'ordering',
  'data-analysis', 'dataanalysis', 'match', 'pair_matching', 'reorder'
]

function getCurrentExercise(step) {
  if (!step) return null

  // Check if step itself is a special interactive type
  const stepType = step.type?.toLowerCase()
  if (stepType && specialInteractiveTypes.includes(stepType)) {
    // Return the step data with type included for special interactive types
    const exerciseData = step.data || step.content || {}
    return {
      ...exerciseData,
      type: stepType, // Ensure type is always present
      exerciseType: stepType // Also set exerciseType for InteractivePanel
    }
  }

  // Also check if the step contains a special type in content/data
  const contentType = step.content?.type?.toLowerCase() || step.data?.type?.toLowerCase()
  if (contentType && specialInteractiveTypes.includes(contentType)) {
    const exerciseData = step.content || step.data || {}
    return {
      ...exerciseData,
      type: contentType, // Ensure type is always present
      exerciseType: contentType // Also set exerciseType for InteractivePanel
    }
  }

  // Handle quiz steps - return quiz data as exercise
  if (step.type === 'quiz') {
    const quizzes = extractQuizzesFromStep(step)
    const quiz = quizzes[currentQuizIndex.value]
    if (quiz) {
      return {
        ...quiz,
        type: quiz.type || 'multiple-choice', // Default quiz type
        exerciseType: quiz.type || 'multiple-choice'
      }
    }
    return null
  }

  // Standard exercise handling
  if (step.type !== 'exercise') return null
  const exercises = extractExercisesFromStep(step)
  return exercises[currentExerciseIndex.value] || null
}

function getCurrentQuiz(step) {
  if (!step || step.type !== 'quiz') return null
  const quizzes = extractQuizzesFromStep(step)
  return quizzes[currentQuizIndex.value] || null
}

function getTotalExercises(step) {
  if (!step) return 0

  // Special interactive types count as 1 exercise
  const stepType = step.type?.toLowerCase()
  const contentType = step.content?.type?.toLowerCase() || step.data?.type?.toLowerCase()
  if ((stepType && specialInteractiveTypes.includes(stepType)) ||
      (contentType && specialInteractiveTypes.includes(contentType))) {
    return 1
  }

  // Handle quiz steps - return quiz count
  if (step.type === 'quiz') {
    return extractQuizzesFromStep(step).length
  }

  if (step.type !== 'exercise') return 0
  return extractExercisesFromStep(step).length
}

function getTotalQuizzes(step) {
  if (!step || step.type !== 'quiz') return 0
  return extractQuizzesFromStep(step).length
}

function handleAnswerChanged(answer) {
  userAnswer.value = answer
}

function updateFillBlankAnswer({ index, value }) {
  fillBlankAnswers.value[index] = value
}

function handleSubmitOrNext() {
  if (confirmation.value) {
    if (answerWasCorrect.value) {
      goToNextExercise()
    } else {
      attemptCount.value++
      if (attemptCount.value >= maxAttempts.value) {
        showCorrectAnswer.value = true
      }
    }
  } else {
    checkAnswer()
  }
}

function checkAnswer() {
  // Placeholder answer checking logic
  const isCorrect = userAnswer.value.toLowerCase() === 'correct'
  
  if (isCorrect) {
    confirmation.value = 'correct'
    answerWasCorrect.value = true
    consecutiveCorrect.value++
    earnedPoints.value += 10
  } else {
    confirmation.value = 'incorrect'
    answerWasCorrect.value = false
    mistakeCount.value++
    consecutiveCorrect.value = 0
  }
}

function goToNextExercise() {
  const step = currentStep.value
  if (!step) return

  const total = getTotalExercises(step)

  // For quiz steps, use currentQuizIndex
  if (step.type === 'quiz') {
    if (currentQuizIndex.value < total - 1) {
      currentQuizIndex.value++
      resetExerciseState(false) // Partial reset - don't reset indices
    } else {
      goNext() // This calls resetExerciseState(true) via goNext
    }
    return
  }

  // For regular exercises
  if (currentExerciseIndex.value < total - 1) {
    currentExerciseIndex.value++
    resetExerciseState(false) // Partial reset - don't reset indices
  } else {
    goNext() // This calls resetExerciseState(true) via goNext
  }
}

function goToNextQuiz() {
  const step = currentStep.value
  if (!step) return

  const total = getTotalQuizzes(step)
  if (currentQuizIndex.value < total - 1) {
    currentQuizIndex.value++
    resetExerciseState(false) // Partial reset - don't reset indices
  } else {
    goNext() // This calls resetExerciseState(true) via goNext
  }
}

function showHint() {
  currentHint.value = 'Try thinking about it differently...'
}

function clearSmartHint() {
  smartHint.value = ''
}

// Matching
function handleMatchingItemSelected(item) {
  if (selectedMatchingItem.value) {
    matchingPairs.value.push({
      left: selectedMatchingItem.value,
      right: item
    })
    selectedMatchingItem.value = null
  } else {
    selectedMatchingItem.value = item
  }
}

function handleRemoveMatchingPair(index) {
  matchingPairs.value.splice(index, 1)
}

// Drag & Drop
function handleDragItemStart(item) {
  // Handle drag start
}

function handleDragOverZone(zoneId) {
  // Handle drag over
}

function handleDragLeaveZone(zoneId) {
  // Handle drag leave
}

function handleDropInZone({ item, zoneId }) {
  dragDropPlacements.value[zoneId] = item
}

function handleRemoveDroppedItem(zoneId) {
  delete dragDropPlacements.value[zoneId]
}

// Explanation Help
function toggleExplanationHelp() {
  showExplanationHelp.value = !showExplanationHelp.value
}

async function askAboutExplanation() {
  if (!explanationQuestion.value.trim()) return
  
  isLoadingExplanation.value = true
  try {
    // API call for AI explanation
    await new Promise(resolve => setTimeout(resolve, 1500))
    explanationAIResponse.value = 'Here is the explanation for your question...'
  } catch (err) {
    explanationAIResponse.value = 'Sorry, I could not get an explanation at this time.'
  } finally {
    isLoadingExplanation.value = false
  }
}

// Vocabulary Modal
function initializeVocabularyModal(vocabData) {
  // If no vocabData passed, get vocabulary from currentStep
  let words = []
  if (vocabData && vocabData.words) {
    words = vocabData.words
  } else if (currentStep.value) {
    // Try to get vocabulary from various possible locations in currentStep
    // In the lesson JSON, vocabulary terms are in content.terms
    words = currentStep.value.vocabulary ||
            currentStep.value.content?.terms ||
            currentStep.value.words ||
            currentStep.value.data?.vocabulary ||
            currentStep.value.data?.words ||
            currentStep.value.content?.vocabulary ||
            currentStep.value.content?.words ||
            []
  }

  vocabularyModal.value = {
    isVisible: true,
    words: words,
    currentIndex: 0
  }
  updateCurrentVocabWord()
}

function updateCurrentVocabWord() {
  const modal = vocabularyModal.value
  if (modal.words && modal.words.length > 0) {
    currentVocabWord.value = modal.words[modal.currentIndex]
    vocabProgress.value = {
      current: modal.currentIndex + 1,
      total: modal.words.length
    }
    isLastVocabWord.value = modal.currentIndex === modal.words.length - 1
  }
}

function showVocabDefinition() {
  if (currentVocabWord.value) {
    currentVocabWord.value.showDefinition = true
  }
}

function hideVocabDefinition() {
  if (currentVocabWord.value) {
    currentVocabWord.value.showDefinition = false
  }
}

function markWordAsLearned() {
  if (currentVocabWord.value) {
    currentVocabWord.value.learned = true
  }
  nextVocabWord()
}

function nextVocabWord() {
  cardAnimation.value = 'slide-left'
  const modal = vocabularyModal.value
  if (modal.currentIndex < modal.words.length - 1) {
    modal.currentIndex++
    updateCurrentVocabWord()
  }
}

function previousVocabWord() {
  cardAnimation.value = 'slide-right'
  const modal = vocabularyModal.value
  if (modal.currentIndex > 0) {
    modal.currentIndex--
    updateCurrentVocabWord()
  }
}

function jumpToVocabWord(index) {
  vocabularyModal.value.currentIndex = index
  updateCurrentVocabWord()
}

function skipVocabularyModal() {
  closeVocabularyModal()
}

function restartVocabulary() {
  vocabularyModal.value.currentIndex = 0
  updateCurrentVocabWord()
}

function closeVocabularyModal() {
  vocabularyModal.value.isVisible = false
}

function pronounceWord(word) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    speechSynthesis.speak(utterance)
  }
}

// Problem Report
function openProblemReportModal() {
  showProblemReportModal.value = true
  problemType.value = ''
  problemDescription.value = ''
  contactInfo.value = ''
  showValidationError.value = false
}

function closeProblemReportModal() {
  showProblemReportModal.value = false
}

async function submitProblemReport() {
  if (!problemDescription.value.trim()) {
    showValidationError.value = true
    return
  }
  
  isSubmitting.value = true
  try {
    // API call to submit report
    await new Promise(resolve => setTimeout(resolve, 1000))
    closeProblemReportModal()
    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to submit report:', err)
  } finally {
    isSubmitting.value = false
  }
}

function closeSuccessMessage() {
  showSuccessMessage.value = false
}

// Resize Functionality
function startResize(e) {
  if (resizeDisabled.value) return
  isResizing.value = true
  
  const startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
  const startWidth = leftPanelWidth.value
  const container = splitContainer.value
  
  if (!container) return
  
  const containerWidth = container.offsetWidth
  
  function onMove(moveEvent) {
    const currentX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX
    const diff = currentX - startX
    const diffPercent = (diff / containerWidth) * 100
    const newWidth = Math.min(Math.max(startWidth + diffPercent, 30), 70)
    leftPanelWidth.value = newWidth
  }
  
  function onEnd() {
    isResizing.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchmove', onMove)
  document.addEventListener('touchend', onEnd)
}

// Floating AI
function toggleFloatingAI() {
  showFloatingAI.value = !showFloatingAI.value
}

// Build exercise data for AI context
function buildExerciseData() {
  const step = currentStep.value
  if (!step) return null

  const stepType = step.type?.toLowerCase()

  // Get current exercise data based on step type
  let exercise = null
  if (stepType === 'exercise') {
    const exercises = extractExercisesFromStep(step)
    exercise = exercises[currentExerciseIndex.value]
  } else if (stepType === 'quiz') {
    const quizzes = extractQuizzesFromStep(step)
    exercise = quizzes[currentQuizIndex.value]
  } else if (specialInteractiveTypes.includes(stepType)) {
    // Special interactive types - the step data IS the exercise
    exercise = step.data || step.content || step
  }

  if (!exercise) return null

  // Build exercise data object (don't include correctAnswer to prevent cheating)
  // Build exercise data object (don't include correctAnswer to prevent cheating)
  const exerciseData = {
    type: exercise.type || exercise.exerciseType || stepType,
    question: getLocalizedText(exercise.question) || getLocalizedText(exercise.prompt) || getLocalizedText(exercise.text) || getLocalizedText(exercise.title),
    prompt: getLocalizedText(exercise.prompt) || getLocalizedText(exercise.instructions)
  }

  // DEBUG: Log raw exercise data to help debug missing questions
  console.log('🚀 [FRONTEND DEBUG] Exercise Data Extraction:', {
    raw: exercise,
    extracted: exerciseData
  });

  // Add options for multiple choice
  if (exercise.options && Array.isArray(exercise.options)) {
    exerciseData.options = exercise.options.map(opt =>
      typeof opt === 'string' ? opt : getLocalizedText(opt.text) || getLocalizedText(opt.label) || opt
    )
  }

  // Add pairs for matching
  if (exercise.pairs && Array.isArray(exercise.pairs)) {
    exerciseData.pairs = exercise.pairs.map(pair => ({
      name: getLocalizedText(pair.name) || getLocalizedText(pair.left),
      formula: getLocalizedText(pair.formula) || getLocalizedText(pair.right)
    }))
  }

  // Add items for ordering/sentence order
  if (exercise.items && Array.isArray(exercise.items)) {
    exerciseData.items = exercise.items.map(item =>
      typeof item === 'string' ? item : getLocalizedText(item.text) || item
    )
  }

  // Add correct order items for sentence order (scrambled, not the answer)
  if (exercise.correctOrder && Array.isArray(exercise.correctOrder)) {
    exerciseData.items = exercise.correctOrder // These are the words to arrange
  }

  // Add bins/categories for sorting/basket exercises
  if (exercise.bins && Array.isArray(exercise.bins)) {
    exerciseData.bins = exercise.bins.map(bin =>
      typeof bin === 'string' ? bin : getLocalizedText(bin.label) || getLocalizedText(bin.name) || bin
    )
  }
  if (exercise.categories && Array.isArray(exercise.categories)) {
    exerciseData.categories = exercise.categories.map(cat =>
      typeof cat === 'string' ? cat : getLocalizedText(cat.label) || getLocalizedText(cat.name) || cat
    )
  }

  return exerciseData
}

// Build full AI request context (RAG Architecture - Context Injection)
// This function collects all relevant data for the backend to construct the AI system prompt
function buildAIRequestContext() {
  const step = currentStep.value
  const stepType = step?.type?.toLowerCase()
  const isExerciseType = stepType === 'exercise' || stepType === 'quiz' || specialInteractiveTypes.includes(stepType)

  // Build step content for non-exercise types (explanation, vocabulary)
  const stepContent = !isExerciseType ? buildStepContent(step) : null

  // Helper to safely get lesson ID
  const getSafeLessonId = (l) => {
    // Try route params as fallback (critical if lesson ref is empty)
    const routeId = route.params.id || route.params.lessonId;

    if (!l) return routeId || '';
    if (typeof l._id === 'string') return l._id;
    if (l._id && l._id.$oid) return l._id.$oid; // Handle MongoDB extended JSON
    if (l.id) return l.id;
    return String(l._id || routeId || '');
  };

  const safeLessonId = getSafeLessonId(lesson.value);

  // DEBUG: Log AI Context building
  console.log('🚀 [FRONTEND DEBUG] Building context:', {
    lessonId: safeLessonId,
    routeParams: route.params,
    routeId: route.params.id,
    routeLessonId: route.params.lessonId,
    rawId: lesson.value?._id,
    lessonName: lesson.value?.lessonName,
    stepIndex: currentIndex.value
  });

  return {
    lessonContext: {
      lessonId: safeLessonId,
      lessonName: getLocalizedText(lesson.value.lessonName) || getLocalizedText(lesson.value.name) || lesson.value.title,
      topic: lesson.value.topic || lesson.value.topicId?.name,
      subject: lesson.value.subject,
      totalSteps: steps.value.length
    },
    userProgress: {
      currentStep: currentIndex.value,
      completedSteps: currentIndex.value,
      mistakes: mistakeCount.value,
      stars: stars.value,
      progressPercent: progressPercentage.value,
      consecutiveCorrect: consecutiveCorrect.value,
      // Weak areas for personalization (backend can use this to adapt explanations)
      weakAreas: [],
      recentMistakes: []
    },
    stepContext: {
      type: stepType || 'explanation',
      stepIndex: currentIndex.value,
      exerciseIndex: isExerciseType ? currentExerciseIndex.value : undefined,
      totalExercises: isExerciseType ? getTotalExercises(step) : undefined,
      // For exercises: include exercise data (question, options - no answers)
      exerciseData: isExerciseType ? buildExerciseData() : undefined,
      // For explanations/vocabulary: include step content
      content: stepContent
    },
    // Language for localized AI responses
    language: language.value || 'ru'
  }
}

// Build step content for explanation and vocabulary steps
// This allows AI to "read" and explain the content in detail
function buildStepContent(step) {
  if (!step) return null

  const stepType = step.type?.toLowerCase()

  // For explanation steps, extract the main content
  if (stepType === 'explanation') {
    return {
      title: getLocalizedText(step.title) || getLocalizedText(step.content?.title),
      text: getLocalizedText(step.content?.text) ||
            getLocalizedText(step.content?.explanation) ||
            getLocalizedText(step.description) ||
            getLocalizedText(step.explanation),
      // Include any key points or highlights
      keyPoints: step.content?.keyPoints || step.keyPoints || []
    }
  }

  // For vocabulary steps, extract words and definitions
  if (stepType === 'vocabulary') {
    const terms = step.vocabulary || step.content?.terms || step.words || []
    return {
      title: getLocalizedText(step.title) || 'Vocabulary',
      terms: terms.map(term => ({
        word: getLocalizedText(term.word) || getLocalizedText(term.term),
        definition: getLocalizedText(term.definition) || getLocalizedText(term.meaning),
        example: getLocalizedText(term.example) || getLocalizedText(term.sentence)
      }))
    }
  }

  // For other types, return generic content
  return {
    title: getLocalizedText(step.title),
    text: getLocalizedText(step.content?.text) || getLocalizedText(step.description)
  }
}

async function sendAIMessage() {
  const message = aiChatInput.value.trim()
  if (!message) return

  aiChatMessages.value.push({ role: 'user', content: message, timestamp: new Date().toISOString() })
  aiChatInput.value = ''
  isAITyping.value = true

  try {
    const context = buildAIRequestContext()

    const response = await getLessonAIResponse(
      message,
      context.lessonContext,
      context.userProgress,
      context.stepContext
    )

    // Handle both object response and string response
    const replyText = typeof response === 'object' ? response.reply : response

    aiChatMessages.value.push({
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[LessonPage] AI message error:', err)
    aiChatMessages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date().toISOString()
    })
  } finally {
    isAITyping.value = false
  }
}

// Handler for AI send message from FloatingAIAssistant
// Accepts both string (backward compatibility) and object { message, lessonId, currentStepIndex }
async function handleAISendMessage(payload) {
  // Handle both old format (string) and new format (object with position data)
  const messageText = typeof payload === 'object' ? payload.message : payload
  const positionLessonId = typeof payload === 'object' ? payload.lessonId : null
  const positionStepIndex = typeof payload === 'object' ? payload.currentStepIndex : null

  if (!messageText) return

  aiChatMessages.value.push({
    role: 'user',
    content: messageText,
    timestamp: new Date().toISOString()
  })

  isAITyping.value = true

  try {
    // Build context - use position data from payload if available (more accurate)
    const context = buildAIRequestContext()

    // Override stepContext.stepIndex if explicitly provided from FloatingAIAssistant
    // This ensures the backend receives the exact position the user is viewing
    if (positionStepIndex !== null && positionStepIndex !== undefined) {
      context.stepContext.stepIndex = positionStepIndex
    }

    // Ensure lessonId is set correctly
    if (positionLessonId) {
      context.lessonContext.lessonId = positionLessonId
    }

    const response = await getLessonAIResponse(
      messageText,
      context.lessonContext,
      context.userProgress,
      context.stepContext
    )

    const replyText = typeof response === 'object' ? response.reply : response

    // Update AI usage from response if available
    if (typeof response === 'object' && response.usage) {
      aiUsage.value = {
        current: response.usage.current || 0,
        limit: response.usage.limit || 50,
        remaining: response.usage.remaining || 50,
        percentage: response.usage.percentage || 0,
        unlimited: response.usage.unlimited || false,
        plan: response.usage.plan || 'free'
      }
    }

    aiChatMessages.value.push({
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[LessonPage] AI message error:', err)
    aiChatMessages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date().toISOString()
    })
  } finally {
    isAITyping.value = false
  }
}

// Handler for quick AI questions
function handleAIQuickQuestion(question) {
  handleAISendMessage(question)
}

// Clear AI chat history (both local and backend)
async function clearAIChat() {
  aiChatMessages.value = []

  // Also clear backend chat history
  if (lesson.value._id) {
    try {
      await clearChatHistory(lesson.value._id)
    } catch (err) {
      console.warn('[LessonPage] Failed to clear backend chat history:', err)
    }
  }
}

// Handler for analysis complete
function handleAnalysisComplete({ explanation, highlights }) {
  console.log('[LessonPage] Analysis complete:', { explanation, highlightCount: highlights?.length })
}

// Migration
function closeMigrationPanel() {
  showMigrationPanel.value = false
}

async function migrateLessonContent() {
  migrationLoading.value = true
  try {
    // API call for migration
    await new Promise(resolve => setTimeout(resolve, 2000))
    closeMigrationPanel()
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    migrationLoading.value = false
  }
}

// ==================== LIFECYCLE ====================

// Watch for language changes and re-process lesson content
watch(language, () => {
  if (lesson.value) {
    // Re-extract localized title and description
    const localizedTitle = extractLessonTitle(lesson.value)
    const localizedDescription = extractLessonDescription(lesson.value)
    lesson.value.title = localizedTitle
    lesson.value.subtitle = localizedDescription

    // Re-process steps with new language
    const rawSteps = lesson.value.steps || []
    steps.value = rawSteps.map((step, index) => processStepWithLocalization(step, index)).filter(Boolean)
  }
})

// Watch for step changes to trigger AI speech
watch(currentIndex, (newIndex) => {
  if (started.value && steps.value[newIndex]) {
    analyzeAndSpeak(steps.value[newIndex], newIndex === 0)
  }
})

// Handle Voice Events
onMounted(() => {
  eventBus.on('voice-transcript', (transcript) => {
    handleVoiceQuestion(transcript, currentStep.value, aiChatMessages.value)
  })

  eventBus.on('ai-voice-input', (text) => {
    aiChatMessages.value.push({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    })
  })

  eventBus.on('ai-voice-response', (text) => {
    aiChatMessages.value.push({
      role: 'assistant',
      content: text,
      timestamp: new Date().toISOString()
    })
  })

  loadLesson()
  
  // Check if we should auto-start (e.g. from a direct link or refresh)
  if (route.query.start === 'true') {
    startLesson()
  }
})

onUnmounted(() => {
  eventBus.off('voice-transcript')
  eventBus.off('ai-voice-input')
  eventBus.off('ai-voice-response')
})
</script>

<style scoped>
.lesson-page {
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #f8fafc;
}

.lesson-container-new {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.split-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.split-content.is-game-active {
  flex-direction: column;
}

.split-panel {
  overflow-y: auto;
  transition: width 0.1s ease;
}

.content-side {
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
}

.interactive-side {
  background-color: #f8fafc;
}

.interactive-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resize-handle {
  width: 8px;
  background-color: #e2e8f0;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.resize-handle:hover,
.resize-handle.is-resizing {
  background-color: #cbd5e1;
}

.handle-bar {
  width: 4px;
  height: 40px;
  background-color: #94a3b8;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .split-content {
    flex-direction: column;
  }
  
  .split-panel {
    width: 100% !important;
  }
  
  .content-side {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .resize-handle {
    display: none;
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-modal-in {
  animation: modal-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

button {
  min-height: 44px;
}

button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .animate-modal-in {
    animation: none;
  }
}
</style> 