<template>
  <div class="lesson-page">
    <!-- Loading Screen -->
    <div v-if="loading" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 p-4">
      <div class="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p class="text-slate-600 font-medium">Loading lesson...</p>
    </div>

    <!-- Error Screen -->
    <div v-else-if="error" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold text-slate-800 mb-2">Error Loading Lesson</h3>
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
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-900">Report Issue</h3>
            <button @click="closeProblemReportModal" class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <!-- Problem Type -->
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

            <!-- Description -->
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

            <!-- Contact -->
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

          <!-- Footer -->
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
            <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
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

    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container-new">

      <!-- New Header - Mobile Optimized -->
      <div class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3">
        <div class="flex items-center justify-between gap-2 sm:gap-4">
          <!-- Left side: Close + Title + Progress -->
          <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              @click="confirmExit"
              class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
              aria-label="Exit lesson"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <div class="min-w-0 flex-1 hidden sm:block">
              <h2 class="text-sm font-semibold text-slate-800 truncate">{{ lesson?.title || 'Lesson' }}</h2>
              <p class="text-xs text-slate-400 truncate">{{ lesson?.subtitle || '' }}</p>
            </div>

            <!-- Progress Bar -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="w-20 sm:w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
              <span class="text-xs font-semibold text-slate-500 tabular-nums">{{ currentIndex + 1 }}/{{ steps.length }}</span>
            </div>
          </div>

          <!-- Right side: Stats -->
          <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div class="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 rounded-lg">
              <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
              </svg>
              <span class="text-xs font-bold text-amber-700">{{ consecutiveCorrect }}</span>
            </div>
            <div class="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 rounded-lg">
              <svg class="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
              </svg>
              <span class="text-xs font-bold text-indigo-700">{{ earnedPoints }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Split Screen Layout with Resize -->
      <div
        class="split-content"
        ref="splitContainer"
        @mouseup="stopResize"
        @mouseleave="stopResize"
        @touchend="stopResize"
      >
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

    <!-- Floating AI Assistant Button -->
    <button
      v-if="started && !lessonCompleted"
      @click="toggleFloatingAI"
      class="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110 hover:shadow-xl z-50"
      :class="showFloatingAI ? 'bg-cyan-500 shadow-cyan-500/40' : 'bg-indigo-600 shadow-indigo-500/40'"
      aria-label="AI Assistant"
    >
      <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    </button>

    <FloatingAIAssistant
      v-if="showFloatingAI && started && !lessonCompleted"
      :ai-usage="aiUsage"
      :quick-suggestions="quickSuggestions"
      :ai-chat-history="aiChatHistory"
      :floating-ai-input="floatingAIInput"
      :ai-is-loading="aiIsLoading"
      @close="closeFloatingAI"
      @send-message="sendFloatingAIMessage"
      @ask-ai="askAI"
      @clear-chat="clearAIChat"
    />

    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
// ✅ COMPLETE LESSONPAGE.VUE SCRIPT with Guest Mode Support
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// Import composables
import { useVocabulary } from '@/composables/useVocabulary'
import { useExercises } from '@/composables/useExercises'
import { usePaymentValidation } from '@/composables/usePaymentValidation'
import { useSound } from '@/composables/useSound'
import { useExplanation } from '@/composables/useExplanation'
import { useLessonOrchestrator } from '@/composables/useLessonOrchestrator'

// Import components
import VocabularyModal from '@/components/lesson/VocabularyModal.vue'
import LessonIntro from '@/components/lesson/LessonIntro.vue'
import LessonHeader from '@/components/lesson/LessonHeader.vue'
import ContentPanel from '@/components/lesson/ContentPanel.vue'
import InteractivePanel from '@/components/lesson/InteractivePanel.vue'
import AIHelpPanel from '@/components/lesson/AIHelpPanel.vue'
import CompletionScreen from '@/components/lesson/CompletionScreen.vue'
import FloatingAIAssistant from '@/components/lesson/FloatingAIAssistant.vue'

// Import CSS
import '@/assets/css/LessonPage.css'

export default {
  name: 'LessonPage',

  components: {
    VocabularyModal,
    LessonIntro,
    LessonHeader,
    ContentPanel,
    InteractivePanel,
    AIHelpPanel,
    CompletionScreen,
    FloatingAIAssistant
  },

  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // ==========================================
    // GUEST MODE STATE
    // ==========================================
    const isGuestMode = computed(() => {
      return route.query.guest === 'true' || !localStorage.getItem('authToken')
    })
    
    const guestBannerDismissed = ref(false)
    let guestAutoSaveInterval = null
    
    // ==========================================
    // COMPOSABLES INITIALIZATION
    // ==========================================
    const lessonOrchestrator = useLessonOrchestrator()
    const vocabulary = useVocabulary()
    const exercises = useExercises()
    const paymentValidation = usePaymentValidation()
    const sound = useSound()
    const explanation = useExplanation()

    // Sync guest mode with orchestrator
    watch(isGuestMode, (newValue) => {
      if (lessonOrchestrator.isGuestMode) {
        lessonOrchestrator.isGuestMode.value = newValue
      }
    }, { immediate: true })

    // Initialize services
    sound.initializeSpeech?.()
    explanation.initializeAI?.()

    // ==========================================
    // RESIZABLE SPLIT SCREEN STATE
    // ==========================================
    const isResizing = ref(false)
    const currentLeftWidth = ref(60) // Initial %
    const startX = ref(0)
    const startY = ref(0)
    const startWidthLeft = ref(60)
    const startWidthRight = ref(40)
    const currentRightWidth = ref(40)
    const resizeDirection = ref('horizontal')

    // ==========================================
    // OTHER REACTIVE STATE
    // ==========================================
    const attemptCount = ref(0)
    const maxAttempts = ref(2)
    const showCorrectAnswer = ref(false)
    const correctAnswerText = ref('')
    const isOnSecondChance = ref(false)
    const extractionResults = ref(null)
    const migrationLoading = ref(false)
    const showMigrationPanel = ref(false)

    // Tab switching state
    const currentTab = ref('explanation')

    // Problem reporting state
    const showProblemReportModal = ref(false)
    const problemDescription = ref('')
    const problemType = ref('')
    const screenshotUrl = ref('')
    const contactInfo = ref('')
    const isSubmitting = ref(false)
    const showValidationError = ref(false)
    const showSuccessMessage = ref(false)

    // Exercise initialization tracking
    const initializationTracker = ref({
      currentExerciseId: null,
      initialized: false
    })

    // Confetti
    const confettiCanvas = ref(null)
    const showConfetti = ref(false)

    // ==========================================
    // GUEST MODE METHODS
    // ==========================================
    const handleGuestRegister = () => {
// Save current lesson ID to return to after registration
      if (lessonOrchestrator.lesson.value?._id) {
        try {
          sessionStorage.setItem('returnToLesson', lessonOrchestrator.lesson.value._id)
        } catch (error) {
}
      }
      
      // Trigger registration modal
      const hero = document.getElementById("hero")
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth" })
        setTimeout(() => {
          window.dispatchEvent(new Event("open-Login-modal"))
        }, 600)
      } else {
        window.dispatchEvent(new Event("open-Login-modal"))
      }
      
      // Close any modals
      if (lessonOrchestrator.showExitModal) {
        lessonOrchestrator.showExitModal.value = false
      }
    }
    
    const dismissGuestBanner = () => {
      guestBannerDismissed.value = true
      try {
        sessionStorage.setItem('guestBannerDismissed', 'true')
      } catch (error) {
}
    }
    
    const saveGuestProgress = () => {
      if (!isGuestMode.value) return
      
      try {
        const guestProgress = JSON.parse(localStorage.getItem('guestProgress') || '{}')
        const lessonId = lessonOrchestrator.lesson.value?._id
        
        if (lessonId) {
          guestProgress[lessonId] = {
            currentStep: lessonOrchestrator.currentIndex.value,
            completedSteps: Array.from({length: lessonOrchestrator.currentIndex.value + 1}, (_, i) => i),
            mistakes: lessonOrchestrator.mistakeCount.value,
            stars: lessonOrchestrator.stars.value,
            elapsedSeconds: lessonOrchestrator.elapsedSeconds.value,
            timestamp: Date.now(),
            completed: lessonOrchestrator.lessonCompleted.value || false
          }
          
          localStorage.setItem('guestProgress', JSON.stringify(guestProgress))
}
      } catch (error) {
}
    }
    
    const loadGuestProgress = () => {
      if (!isGuestMode.value) return null
      
      try {
        const guestProgress = JSON.parse(localStorage.getItem('guestProgress') || '{}')
        const lessonId = lessonOrchestrator.lesson.value?._id
        
        if (lessonId && guestProgress[lessonId]) {
return guestProgress[lessonId]
        }
      } catch (error) {
}
      
      return null
    }

    const startGuestAutoSave = () => {
      if (!isGuestMode.value) return
      
      // Save every 30 seconds for guests
      guestAutoSaveInterval = setInterval(() => {
        if (lessonOrchestrator.started.value && !lessonOrchestrator.lessonCompleted.value) {
          saveGuestProgress()
        }
      }, 30000)
    }

    const stopGuestAutoSave = () => {
      if (guestAutoSaveInterval) {
        clearInterval(guestAutoSaveInterval)
        guestAutoSaveInterval = null
      }
    }

    // ==========================================
    // RESIZABLE SPLIT SCREEN COMPUTED PROPERTIES
    // ==========================================
    const leftPanelStyle = computed(() => {
      // Show both panels for game steps - games stay in interactive panel
      return { width: `${currentLeftWidth.value}%` }
    })

    const rightPanelStyle = computed(() => {
      return { width: `${100 - currentLeftWidth.value}%` }
    })

    const widthIndicatorText = computed(() => {
      return `Content: ${Math.round(currentLeftWidth.value)}% | Interactive: ${Math.round(currentRightWidth.value)}%`
    })

    // ==========================================
    // OTHER COMPUTED PROPERTIES
    // ==========================================
    const getUserProgress = computed(() => ({
      currentStep: lessonOrchestrator.currentIndex.value,
      completedSteps: Array.from({length: lessonOrchestrator.currentIndex.value}, (_, i) => i),
      mistakes: lessonOrchestrator.mistakeCount.value,
      stars: lessonOrchestrator.stars.value,
      elapsedSeconds: lessonOrchestrator.elapsedSeconds.value
    }))

    const isLastStep = computed(() => {
      return lessonOrchestrator.currentIndex.value >= lessonOrchestrator.steps.value.length - 1
    })

    const isGameStep = computed(() => {
      const step = lessonOrchestrator.currentStep.value;
      return step?.type === 'game' || !!step?.gameType;
    })

    const userToken = computed(() => {
      return lessonOrchestrator.currentUser?.value?.token || localStorage.getItem('authToken')
    })

    // ==========================================
    // RESIZABLE SPLIT SCREEN METHODS
    // ==========================================
    const startResize = (event) => {
      event.preventDefault()
      
      isResizing.value = true
      resizeDirection.value = window.innerWidth <= 1023 ? 'vertical' : 'horizontal'
      
      if (resizeDirection.value === 'horizontal') {
        startX.value = event.clientX || event.touches?.[0]?.clientX || 0
      } else {
        startY.value = event.clientY || event.touches?.[0]?.clientY || 0
      }
      
      startWidthLeft.value = currentLeftWidth.value
      startWidthRight.value = currentRightWidth.value
      
      document.addEventListener('mousemove', handleResize, { passive: false })
      document.addEventListener('mouseup', stopResize)
      document.addEventListener('touchmove', handleResize, { passive: false })
      document.addEventListener('touchend', stopResize)
      
      document.body.style.userSelect = 'none'
      document.body.style.cursor = resizeDirection.value === 'horizontal' ? 'col-resize' : 'row-resize'
    }

    const handleResize = (event) => {
      if (!isResizing.value) return
      
      event.preventDefault()
      
      const splitContent = document.querySelector('.split-content')
      if (!splitContent) return
      
      let delta = 0
      let containerSize = 0
      
      if (resizeDirection.value === 'horizontal') {
        const currentX = event.clientX || event.touches?.[0]?.clientX || startX.value
        delta = currentX - startX.value
        containerSize = splitContent.offsetWidth
      } else {
        const currentY = event.clientY || event.touches?.[0]?.clientY || startY.value
        delta = currentY - startY.value
        containerSize = splitContent.offsetHeight
      }
      
      const deltaPercentage = (delta / containerSize) * 100
      
      let newLeftWidth = startWidthLeft.value + deltaPercentage
      let newRightWidth = startWidthRight.value - deltaPercentage
      
      const minLeftWidth = 20
      const maxLeftWidth = 85
      const minRightWidth = 15
      const maxRightWidth = 80
      
      if (newLeftWidth < minLeftWidth) {
        newLeftWidth = minLeftWidth
        newRightWidth = 100 - newLeftWidth
      } else if (newLeftWidth > maxLeftWidth) {
        newLeftWidth = maxLeftWidth
        newRightWidth = 100 - newLeftWidth
      }
      
      if (newRightWidth < minRightWidth) {
        newRightWidth = minRightWidth
        newLeftWidth = 100 - newRightWidth
      } else if (newRightWidth > maxRightWidth) {
        newRightWidth = maxRightWidth
        newLeftWidth = 100 - newRightWidth
      }
      
      currentLeftWidth.value = newLeftWidth
      currentRightWidth.value = newRightWidth
    }

    const stopResize = () => {
      if (!isResizing.value) return
      
      isResizing.value = false
      
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
      document.removeEventListener('touchmove', handleResize)
      document.removeEventListener('touchend', stopResize)
      
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      
      try {
        localStorage.setItem('lessonPageSplitSizes', JSON.stringify({
          left: currentLeftWidth.value,
          right: currentRightWidth.value,
          timestamp: Date.now()
        }))
      } catch (error) {
}
    }

    const handleResizeKeyboard = (event) => {
      const step = 5
      let newLeftWidth = currentLeftWidth.value
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newLeftWidth = Math.max(20, currentLeftWidth.value - step)
          break
        case 'ArrowRight':
          event.preventDefault()
          newLeftWidth = Math.min(85, currentLeftWidth.value + step)
          break
        case 'ArrowUp':
          if (resizeDirection.value === 'vertical') {
            event.preventDefault()
            newLeftWidth = Math.max(20, currentLeftWidth.value - step)
          }
          break
        case 'ArrowDown':
          if (resizeDirection.value === 'vertical') {
            event.preventDefault()
            newLeftWidth = Math.min(85, currentLeftWidth.value + step)
          }
          break
        case 'Home':
          event.preventDefault()
          newLeftWidth = 20
          break
        case 'End':
          event.preventDefault()
          newLeftWidth = 85
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          newLeftWidth = 75
          break
        default:
          return
      }
      
      currentLeftWidth.value = newLeftWidth
      currentRightWidth.value = 100 - newLeftWidth
      
      try {
        localStorage.setItem('lessonPageSplitSizes', JSON.stringify({
          left: currentLeftWidth.value,
          right: currentRightWidth.value,
          timestamp: Date.now()
        }))
      } catch (error) {
}
    }

    const resetSplitSizes = () => {
      currentLeftWidth.value = 75
      currentRightWidth.value = 25
      
      try {
        localStorage.removeItem('lessonPageSplitSizes')
      } catch (error) {
}
    }

    const loadSavedSizes = () => {
      try {
        const saved = localStorage.getItem('lessonPageSplitSizes')
        if (saved) {
          const { left, right, timestamp } = JSON.parse(saved)
          
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
          if (timestamp && timestamp > thirtyDaysAgo) {
            currentLeftWidth.value = Math.max(20, Math.min(85, left || 75))
            currentRightWidth.value = Math.max(15, Math.min(80, right || 25))
          } else {
            localStorage.removeItem('lessonPageSplitSizes')
            currentLeftWidth.value = 75
            currentRightWidth.value = 25
          }
        } else {
          currentLeftWidth.value = 75
          currentRightWidth.value = 25
        }
      } catch (error) {
        currentLeftWidth.value = 75
        currentRightWidth.value = 25
      }
    }

    const handleWindowResize = () => {
      const wasVertical = resizeDirection.value === 'vertical'
      const isNowVertical = window.innerWidth <= 1023
      
      if (wasVertical !== isNowVertical) {
        resizeDirection.value = isNowVertical ? 'vertical' : 'horizontal'
        
        if (isNowVertical && currentLeftWidth.value < 65) {
          currentLeftWidth.value = 70
          currentRightWidth.value = 30
        } else if (!isNowVertical && currentLeftWidth.value > 80) {
          currentLeftWidth.value = 75
          currentRightWidth.value = 25
        }
      }
    }

    // ==========================================
    // NAVIGATION METHODS
    // ==========================================
    const handleReturnToCatalogue = () => {
      // STRICT REDIRECT: Always go to catalogue as requested
      router.push('/profile/catalogue').catch(err => {
         console.warn('Router navigation failed, trying path:', err);
         window.location.href = '/profile/catalogue';
      });
    }

    const handleGoToHomework = () => {
if (isGuestMode.value) {
handleGuestRegister()
        return
      }
      
      if (lessonOrchestrator.lesson.value?._id) {
        try {
          router.push({
            name: 'LessonHomeworkPage',
            params: { lessonId: lessonOrchestrator.lesson.value._id },
            query: {
              title: lessonOrchestrator.lesson.value.title || lessonOrchestrator.lesson.value.lessonName,
              subject: lessonOrchestrator.lesson.value.subject || 'general'
            }
          }).catch(err => {
            router.push({ 
              name: 'HomeworkList' 
            }).catch(err2 => {
window.location.href = '/profile/homeworks'
            })
          })
        } catch (error) {
window.location.href = '/profile/homeworks'
        }
      } else {
try {
          router.push({ 
            name: 'HomeworkList' 
          }).catch(err => {
window.location.href = '/profile/homeworks'
          })
        } catch (error) {
          window.location.href = '/profile/homeworks'
        }
      }
    }

    const addToMyCourses = async () => {
      if (isGuestMode.value || !lessonOrchestrator.lesson.value) return;

      try {
        const userId = lessonOrchestrator.currentUser.value?.uid;
        const lesson = lessonOrchestrator.lesson.value;

        await fetch(`/api/users/${userId}/study-list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken.value}`
          },
          body: JSON.stringify({
             topicId: lesson.topicId,
             topicName: lesson.topic,
             // Add metadata to help backend identify it
             lessonId: lesson._id,
             addedAt: new Date()
          })
        });
      } catch (e) {
        console.error('Failed to add to courses silently', e);
      }
    };

    const startLesson = async () => {
       await lessonOrchestrator.startLesson();
       addToMyCourses(); // Fire and forget
    };

    const exitLesson = async () => {
      try {
        // Save progress before exit
        if (isGuestMode.value) {
          saveGuestProgress()
        } else if (lessonOrchestrator.saveProgress) {
          // Don't await for faster exit
          lessonOrchestrator.saveProgress().catch(err => {
            console.error('Error saving progress on exit:', err)
          })
        }

        if (lessonOrchestrator.cleanup) {
          lessonOrchestrator.cleanup()
        }

        lessonOrchestrator.showExitModal.value = false

        // STRICT REDIRECT: Always go to catalogue for all users
        handleReturnToCatalogue()

      } catch (error) {
        console.error('Error during exit:', error)
        lessonOrchestrator.showExitModal.value = false

        // Fallback navigation
        router.push('/profile/catalogue')
      }
    }

    // ==========================================
    // PROBLEM REPORTING METHODS
    // ==========================================
    const openProblemReportModal = () => {
      showProblemReportModal.value = true
      resetProblemForm()
    }

    const closeProblemReportModal = () => {
      showProblemReportModal.value = false
      resetProblemForm()
    }

    const resetProblemForm = () => {
      problemDescription.value = ''
      problemType.value = ''
      screenshotUrl.value = ''
      contactInfo.value = ''
      isSubmitting.value = false
      showValidationError.value = false
    }

    const validateForm = () => {
      const isValid = problemDescription.value.trim().length > 0
      showValidationError.value = !isValid
      return isValid
    }

    const getCurrentLessonInfo = () => {
      return {
        lessonName: lessonOrchestrator.lesson.value?.lessonName || 'Unknown lesson',
        lessonId: lessonOrchestrator.lesson.value?._id || 'N/A',
        currentStep: lessonOrchestrator.currentIndex.value + 1,
        totalSteps: lessonOrchestrator.steps.value?.length || 0,
        userAgent: navigator.userAgent,
        timestamp: new Date().toLocaleString('en-US'),
        url: window.location.href,
        isGuestMode: isGuestMode.value
      }
    }

    const formatProblemReport = () => {
      const lessonInfo = getCurrentLessonInfo()

      let message = `🚨 LESSON PROBLEM REPORT\n\n`
      message += `📚 Lesson: ${lessonInfo.lessonName}\n`
      message += `🆔 Lesson ID: ${lessonInfo.lessonId}\n`
      message += `📍 Current Step: ${lessonInfo.currentStep}/${lessonInfo.totalSteps}\n`
      message += `👤 Mode: ${lessonInfo.isGuestMode ? 'Guest (trial)' : 'Registered'}\n`
      message += `🕐 Time: ${lessonInfo.timestamp}\n\n`

      if (problemType.value) {
        const typeLabels = {
          content: 'Content Error',
          technical: 'Technical Problem',
          interface: 'Interface Issue',
          exercise: 'Exercise Error',
          audio: 'Audio Problem',
          other: 'Other'
        }
        message += `⚠️ Problem Type: ${typeLabels[problemType.value]}\n\n`
      }

      message += `📝 Problem Description:\n${problemDescription.value}\n\n`

      if (screenshotUrl.value) {
        message += `📸 Screenshot: ${screenshotUrl.value}\n\n`
      }

      if (contactInfo.value) {
        message += `📞 Contact: ${contactInfo.value}\n\n`
      }

      message += `🔧 TECHNICAL INFORMATION:\n`
      message += `🌐 URL: ${lessonInfo.url}\n`
      message += `💻 Browser: ${lessonInfo.userAgent}\n`

      return message
    }

    const submitProblemReport = async () => {
      if (!validateForm()) {
        return
      }
      
      try {
        isSubmitting.value = true
        
        const reportMessage = formatProblemReport()
        const encodedMessage = encodeURIComponent(reportMessage)
        const telegramLink = `https://t.me/aced_live?text=${encodedMessage}`
// Only try analytics for authenticated users
        if (!isGuestMode.value) {
          try {
            await fetch('/api/analytics/problem-report', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken.value}`
              },
              body: JSON.stringify({
                lessonId: getCurrentLessonInfo().lessonId,
                problemType: problemType.value,
                description: problemDescription.value,
                hasScreenshot: !!screenshotUrl.value,
                hasContact: !!contactInfo.value,
                isGuestMode: isGuestMode.value,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
              })
            })
          } catch (analyticsError) {
// Don't block the report submission
          }
        }
        
        window.open(telegramLink, '_blank')
        
        closeProblemReportModal()
        showSuccessMessage.value = true
        
        setTimeout(() => {
          showSuccessMessage.value = false
        }, 5000)
        
      } catch (error) {
if (lessonOrchestrator.showToast) {
          lessonOrchestrator.showToast('Error submitting report. Please try again.', 'error')
        } else {
          alert('Error submitting report. Please try again.')
        }
      } finally {
        isSubmitting.value = false
      }
    }

    const closeSuccessMessage = () => {
      showSuccessMessage.value = false
    }

    const handleKeyboardShortcuts = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        if (!showProblemReportModal.value && lessonOrchestrator.started.value && !lessonOrchestrator.lessonCompleted.value) {
          openProblemReportModal()
        }
      }
      
      if (event.ctrlKey && event.altKey && event.key === 'R') {
        event.preventDefault()
        resetSplitSizes()
      }
    }

    // ==========================================
    // VOCABULARY METHODS
    // ==========================================
    const initializeVocabularyModal = (step) => {
let vocabularyStep = step

      if (!vocabularyStep) {
        vocabularyStep = lessonOrchestrator.currentStep.value
      }

      if (!vocabularyStep) {
return
      }

      if (vocabularyStep.type !== 'vocabulary') {
const vocabularySteps = lessonOrchestrator.steps.value?.filter(s => s.type === 'vocabulary')
        if (vocabularySteps && vocabularySteps.length > 0) {
          vocabularyStep = vocabularySteps[0]
        } else {
return
        }
      }

      vocabulary.initializeVocabularyModal(vocabularyStep)
    }

    const jumpToVocabWord = (index) => {
if (index >= 0 && index < vocabulary.vocabularyModal.words.length) {
        vocabulary.cardAnimation.isFlipping = false
        vocabulary.cardAnimation.showDefinition = false

        setTimeout(() => {
          vocabulary.vocabularyModal.currentIndex = index
        }, 50)
      } else {
}
    }

    const showVocabDefinition = () => {
      vocabulary.showVocabDefinition()
    }

    const hideVocabDefinition = () => {
      vocabulary.hideVocabDefinition()
    }

    const markWordAsLearned = () => {
      vocabulary.markWordAsLearned()
    }

    const nextVocabWord = () => {
      vocabulary.nextVocabWord()
    }

    const previousVocabWord = () => {
      vocabulary.previousVocabWord()
    }

    const skipVocabularyModal = () => {
      vocabulary.skipVocabularyModal()
    }

    const restartVocabulary = () => {
      vocabulary.restartVocabulary()
    }

    const closeVocabularyModal = () => {
      if (vocabulary.vocabularyModal) {
        vocabulary.vocabularyModal.isVisible = false
      }
    }

    const pronounceWord = (word) => {
      if (!word || typeof word !== 'string') {
        return
      }
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(word.trim())
          utterance.lang = 'en-US'
          utterance.rate = 0.8
          utterance.pitch = 1
          utterance.onerror = (event) =>
window.speechSynthesis.speak(utterance)
        } else {
          sound.pronounceWord?.(word)
        }
      } catch (error) {
sound.pronounceWord?.(word)
      }
    }

    // ==========================================
    // EXERCISE METHODS
    // ==========================================
    const getCurrentExercise = () => {
      const step = lessonOrchestrator.currentStep.value
      if (!step) return null

      // ✅ DEBUG: Check what step we are actually on


      // ✅ CRITICAL FIX: Force Game Object Creation
      if (step.type === 'game' || step.gameType || (step.data && step.data.gameConfig)) {
        const specificGameType = step.gameType ||
                                (step.gameConfig && step.gameConfig.type) ||
                                (step.gameConfig && step.gameConfig.gameType) ||
                                (step.data && step.data.gameType) ||
                                (step.data && step.data.type) ||
                                (step.type === 'whack-a-mole' ? 'whack-a-mole' : null) || 
                                (step.type === 'basket-catch' ? 'basket-catch' : null) ||
                                'basket-catch';



        return {
          ...step,
          _id: step._id || `game_${lessonOrchestrator.currentIndex.value}`,
          id: step.id || `game_${lessonOrchestrator.currentIndex.value}`,
          type: 'game',
          title: step.title || 'Game',
          description: step.instructions || step.description || '',
          gameType: specificGameType,
          gameConfig: {
            ...(step.gameConfig || {}),
            ...(step.data || {}),
            gameType: specificGameType,
            questions: step.gameConfig?.questions || step.data?.questions || step.questions || []
          },
          questions: step.questions || step.gameConfig?.questions || step.data?.questions || [],
          instructions: step.instructions || step.description || "Play the game!",
        };
      }

      // ✅ FIX: Handle Steps with Data Arrays (Exercises/Quizzes)
      if (['exercise', 'quiz', 'practice'].includes(step.type) && Array.isArray(step.data)) {
        const index = exercises.currentExerciseIndex.value || 0
        const specificExercise = step.data[index]

        if (specificExercise) {
          const exerciseId = specificExercise.id || `${step.id}_${index}`

          if (initializationTracker.value.currentExerciseId !== exerciseId) {
            initializationTracker.value = { currentExerciseId: exerciseId, initialized: false }
            nextTick(() => {
              exercises.initializeCurrentExerciseData(specificExercise)
              initializationTracker.value.initialized = true

              if (specificExercise.type === 'drag-drop') {
                ensureDragDropInitialization()
              }
            })
          }
          return specificExercise
        }
      }

      // ✅✅✅ CRITICAL FIX: Handle exercises with CONTENT.type (your lesson structure)
      // This handles: histogram, map, block-coding, data_analysis, fraction_visual, etc.
      if (step.type === 'exercise' && step.content && step.content.type) {

        const exerciseId = step.id || step._id || `${step.content.type}_${lessonOrchestrator.currentIndex.value}`;
        
        // Build normalized exercise object
        // The key is to merge content.data into the exercise while preserving step metadata
        const normalizedExercise = {
          // Step-level properties
          _id: step._id,
          id: step.id,
          type: 'exercise',  // Keep as 'exercise' for InteractivePanel routing
          order: step.order,
          title: step.title,
          instructions: step.instructions,
          description: step.instructions || step.description,
          difficulty: step.difficulty,
          estimatedDuration: step.estimatedDuration,
          scoring: step.scoring,
          
          // Content structure (what InteractivePanel needs)
          content: step.content,  // Keep original content object
          
          // Also provide data for backwards compatibility
          data: step.content.data || step.content,
          
          // Exercise-specific type for InteractivePanel's exerciseType computed
          exerciseType: step.content.type,
        };
        
        if (initializationTracker.value.currentExerciseId !== exerciseId) {
          initializationTracker.value = { currentExerciseId: exerciseId, initialized: false };
          nextTick(() => {
            exercises.initializeCurrentExerciseData(normalizedExercise);
            initializationTracker.value.initialized = true;
          });
        }
        

        return normalizedExercise;
      }

      // ✅ FIX: Handle exercises with DATA.type (alternative structure)
      if (step.type === 'exercise' && step.data && typeof step.data === 'object' && !Array.isArray(step.data) && step.data.type) {

        const exerciseId = step.id || `${step.data.type}_${lessonOrchestrator.currentIndex.value}`;
        
        const normalizedExercise = {
          ...step.data,
          ...step,
          exerciseType: step.data.type,
          data: step.data,
          content: step.data  // Also set content for consistency
        };
        
        if (initializationTracker.value.currentExerciseId !== exerciseId) {
          initializationTracker.value = { currentExerciseId: exerciseId, initialized: false };
          nextTick(() => {
            exercises.initializeCurrentExerciseData(normalizedExercise);
            initializationTracker.value.initialized = true;
          });
        }
        return normalizedExercise;
      }

      // ✅ Handle direct interactive step types (data_analysis, fraction_visual, etc.)
      const directInteractiveTypes = [
        'data_analysis', 'fraction_visual', 'geometry_poly',
        'chem_mixing', 'chem_matching',
        'english_sentence_fix', 'english_sentence_order',
        'language_noun_bag', 'histogram', 'map', 'block-coding',
        // New innovative language exercises
        'language_tone_transformer', 'language_idiom_bridge',
        'language_word_constellation', 'language_rhythm_match',
        'language_false_friends'
      ];
      
      if (directInteractiveTypes.includes(step.type)) {

        const exerciseId = step.id || step._id || `${step.type}_${lessonOrchestrator.currentIndex.value}`;
        
        const normalizedExercise = {
          ...step,
          exerciseType: step.type,
          content: step.content || step,
          data: step.content?.data || step.data || step
        };

        
        if (initializationTracker.value.currentExerciseId !== exerciseId) {
          initializationTracker.value = { currentExerciseId: exerciseId, initialized: false };
          nextTick(() => {
            exercises.initializeCurrentExerciseData(normalizedExercise);
            initializationTracker.value.initialized = true;
          });
        }
        return normalizedExercise;
      }

      // Fallback to existing logic (for single-item steps)
      const exercise = exercises.getCurrentExercise(step)
      if (exercise) {
        const exerciseId = exercise.id || `${exercise.type}_${exercise.question?.substring(0, 20)}`
        if (initializationTracker.value.currentExerciseId !== exerciseId) {
          initializationTracker.value = { currentExerciseId: exerciseId, initialized: false }
          nextTick(() => {
            exercises.initializeCurrentExerciseData(exercise)
            initializationTracker.value.initialized = true

            if (exercise.type === 'drag-drop') {
              nextTick(() => {
                ensureDragDropInitialization()
              })
            }
          })
        }
      }
      return exercise
    }
    
    const getCurrentQuiz = () => {
      return exercises.getCurrentQuiz(lessonOrchestrator.currentStep.value)
    }

    const getTotalExercises = () => {
      return exercises.getTotalExercises(lessonOrchestrator.currentStep.value)
    }

    const getTotalQuizzes = () => {
      return exercises.getTotalQuizzes(lessonOrchestrator.currentStep.value)
    }

    // Drag and Drop event handlers
    const handleDragItemStart = ({ item, event }) => {
      exercises.handleDragItemStart({ item, event })
      
      if (sound.playClickSound) {
        sound.playClickSound()
      }
    }

    const handleDragOverZone = (zoneId) => {
      exercises.handleDragOverZone(zoneId)
    }

    const handleDragLeaveZone = () => {
      exercises.handleDragLeaveZone()
    }

    const handleDropInZone = ({ zoneId, item }) => {
      exercises.handleDropInZone({ zoneId, item })
      
      if (sound.playSuccessSound) {
        sound.playSuccessSound()
      }
      
      // Save guest progress after drop
      if (isGuestMode.value) {
        saveGuestProgress()
      } else if (lessonOrchestrator.saveProgress) {
        lessonOrchestrator.saveProgress().catch(err => {
})
      }
    }

    const handleRemoveDroppedItem = ({ zoneId, itemIndex, item }) => {
      exercises.handleRemoveDroppedItem({ zoneId, itemIndex, item })
      
      if (sound.playClickSound) {
        sound.playClickSound()
      }
    }

    const ensureDragDropInitialization = () => {
      const currentExercise = getCurrentExercise()
      
      if (!currentExercise || currentExercise.type !== 'drag-drop') {
        return
      }
      
      if (exercises.availableDragItems.value.length === 0 || exercises.dropZones.value.length === 0) {
        exercises.initializeDragDropItems(currentExercise)
      }
    }

    // Event handlers
    const handleAnswerChanged = (newAnswer) => {
      exercises.updateUserAnswer(newAnswer, getCurrentExercise())
    }
    
    const updateFillBlankAnswer = ({ index, value }) => {
      exercises.updateFillBlankAnswer(index, value)
    }
    
    const handleMatchingItemSelected = (selection) => {
      exercises.handleMatchingSelection(selection)
    }
    
    const handleRemoveMatchingPair = (pairIndex) => {
      exercises.removeMatchingPair(pairIndex)
    }

    // Submission handler
    const handleSubmitOrNext = async () => {
      const currentStep = lessonOrchestrator.currentStep.value
      if (!currentStep) {
        return
      }
      if (showCorrectAnswer.value) {
        moveToNextStep()
        return
      }

      const currentExercise = getCurrentExercise()
      const currentQuiz = getCurrentQuiz()
      let isCorrect = false
      let exerciseOrQuiz = null

      if (currentStep.type === 'exercise' || currentStep.type === 'practice') {
        exerciseOrQuiz = currentExercise
        if (exerciseOrQuiz) {
          isCorrect = exercises.validateCurrentAnswer(exerciseOrQuiz)
        }
      } else if (currentStep.type === 'quiz') {
        exerciseOrQuiz = currentQuiz
        if (exerciseOrQuiz) {
          isCorrect = exercises.validateQuizAnswer(exerciseOrQuiz)
        }
      }

      attemptCount.value++

      if (isCorrect) {
        exercises.answerWasCorrect.value = true
        lessonOrchestrator.stars.value++
        lessonOrchestrator.earnedPoints.value += 10
        if (attemptCount.value === 1) {
          lessonOrchestrator.earnedPoints.value += 5
          exercises.confirmation.value = exercises.getRandomSuccessMessage() + ' 🌟 Bonus for first attempt!'
        } else {
          exercises.confirmation.value = exercises.getRandomSuccessMessage() + ' 💪 Great, on the second attempt!'
        }
        sound.playSuccessSound?.()
        isOnSecondChance.value = false
      } else {
        exercises.answerWasCorrect.value = false
        if (attemptCount.value < maxAttempts.value) {
          isOnSecondChance.value = true
          exercises.confirmation.value = exercises.getSecondChanceMessage(exerciseOrQuiz)
          sound.playErrorSound?.()
          return
        } else {
          lessonOrchestrator.mistakeCount.value++
          lessonOrchestrator.earnedPoints.value = Math.max(0, lessonOrchestrator.earnedPoints.value - 2)
          showCorrectAnswer.value = true
          correctAnswerText.value = exercises.getCorrectAnswerDisplay(exerciseOrQuiz)
          exercises.confirmation.value = exercises.getFinalFailureMessage(exerciseOrQuiz, correctAnswerText.value)
          isOnSecondChance.value = false
          sound.playErrorSound?.()
          if (lessonOrchestrator.mistakeCount.value >= 2) {
            await explanation.generateSmartHintForMistakes?.(
              exerciseOrQuiz,
              lessonOrchestrator.mistakeCount.value,
              { lessonId: lessonOrchestrator.lesson.value._id, userAnswer: exercises.getCurrentUserAnswer(), correctAnswer: correctAnswerText.value }
            )
          }
        }
      }
      
      // Save progress based on mode
      if (isGuestMode.value) {
        saveGuestProgress()
      } else {
        // Only save to server if authenticated
        await lessonOrchestrator.saveProgress()
      }
    }

    // Navigation functions
    const resetAttempts = () => {
      attemptCount.value = 0
      isOnSecondChance.value = false
      showCorrectAnswer.value = false
      correctAnswerText.value = ''
      exercises.confirmation.value = ''
      exercises.answerWasCorrect.value = false
      initializationTracker.value = { currentExerciseId: null, initialized: false }
    }
    
    const moveToNextStep = () => {
      resetAttempts()
      if (exercises.isLastExercise?.(lessonOrchestrator.currentStep.value) || exercises.isLastQuiz?.(lessonOrchestrator.currentStep.value)) {
        lessonOrchestrator.goNext()
      } else {
        if (lessonOrchestrator.currentStep.value.type === 'exercise' || lessonOrchestrator.currentStep.value.type === 'practice') {
          exercises.goToNextExercise(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
        } else if (lessonOrchestrator.currentStep.value.type === 'quiz') {
          exercises.goToNextQuiz(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
        }
      }
      
      // Save progress after navigation
      if (isGuestMode.value) {
        saveGuestProgress()
      }
    }
    
    const goToNextExercise = () => {
      resetAttempts()
      exercises.goToNextExercise(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
      if (isGuestMode.value) {
        saveGuestProgress()
      }
    }
    
    const goToNextQuiz = () => {
      resetAttempts()
      exercises.goToNextQuiz(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
      if (isGuestMode.value) {
        saveGuestProgress()
      }
    }
    
    const goNext = () => {
      resetAttempts()
      lessonOrchestrator.goNext()
      if (isGuestMode.value) {
        saveGuestProgress()
      }
    }
    
    const goPrevious = () => {
      resetAttempts()
      lessonOrchestrator.goPrevious()
      if (isGuestMode.value) {
        saveGuestProgress()
      }
    }

    // Simplified exercise methods
    const showHint = (exercise) => exercises.showHint(exercise)
    const clearSmartHint = () => exercises.clearSmartHint()

    // AI help panel methods
    const toggleExplanationHelp = explanation.toggleExplanationHelp
    const askAboutExplanation = explanation.askAboutExplanation
    const sendAIMessage = explanation.sendAIMessage
    const askAI = explanation.askAI
    const clearAIChat = explanation.clearAIChat

    // Floating AI assistant methods
    const toggleFloatingAI = explanation.toggleFloatingAI
    const closeFloatingAI = explanation.closeFloatingAI
    const sendFloatingAIMessage = explanation.sendFloatingAIMessage

    // Confetti animation
    const startConfetti = () => {
      showConfetti.value = true
      nextTick(() => {
        setTimeout(() => {
          showConfetti.value = false
        }, 5000)
      })
    }

    // Migration functionality
    const migrateLessonContent = async () => {
      if (isGuestMode.value) {
handleGuestRegister()
        return
      }
      
      try {
        migrationLoading.value = true

        if (!lessonOrchestrator.currentUser?.value?.uid) {
          throw new Error('User not found')
        }

        const response = await fetch(`/api/homework/migrate-from-lessons/${lessonOrchestrator.currentUser.value.uid}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken.value}`,
            'Content-Type': 'application/json'
          }
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Migration failed')
        }

        if (result.success) {
          const message = `✅ Migration completed! Created ${result.data?.homeworkCreated || 0} assignments and added ${result.data?.vocabularyAdded || 0} words to vocabulary.`

          if (lessonOrchestrator.showToast) {
            lessonOrchestrator.showToast(message, 'success')
          } else {
            alert(message)
          }

          showMigrationPanel.value = false
        } else {
          throw new Error(result.error || 'Migration failed')
        }

      } catch (error) {
const errorMessage = '❌ Migration error: ' + error.message

        if (lessonOrchestrator.showToast) {
          lessonOrchestrator.showToast(errorMessage, 'error')
        } else {
          alert(errorMessage)
        }
      } finally {
        migrationLoading.value = false
      }
    }

    const showMigrationPanelModal = () => {
      showMigrationPanel.value = true
    }

    const closeMigrationPanel = () => {
      showMigrationPanel.value = false
    }

    // Lesson completion with extraction
    const completeLessonWithExtraction = async () => {
      try {
        const completionResult = await lessonOrchestrator.completeLesson?.()

        if (completionResult?.success || lessonOrchestrator.lessonCompleted.value) {
          // Skip extraction for guest users
          if (!isGuestMode.value) {
            const extractionResult = await extractLessonContent()

            if (extractionResult?.success) {
              showCompletionMessage(extractionResult)
            } else {
              lessonOrchestrator.lessonCompleted.value = true
            }
          } else {
            // For guests, just mark as completed
            lessonOrchestrator.lessonCompleted.value = true
            saveGuestProgress() // Save final state
            
            // Show guest-specific completion message
            if (lessonOrchestrator.showToast) {
              lessonOrchestrator.showToast(
                '🎉 Lesson completed! Register to save your progress forever.',
                'success'
              )
            }
          }
        }
      } catch (error) {
lessonOrchestrator.lessonCompleted.value = true
      }
    }

    const extractLessonContent = async () => {
      try {
        if (!lessonOrchestrator.currentUser?.value?.uid || !lessonOrchestrator.lesson.value?._id) {
return { success: false, error: 'Missing user or lesson data' }
        }

        const response = await fetch('/api/lessons/complete-and-extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken.value}`
          },
          body: JSON.stringify({
            userId: lessonOrchestrator.currentUser.value.uid,
            lessonId: lessonOrchestrator.lesson.value._id,
            progress: getUserProgress.value
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to extract content')
        }

        return result

      } catch (error) {
return { success: false, error: error.message }
      }
    }

    const showCompletionMessage = (extractionResult) => {
      let message = '🎉 Lesson completed successfully!'

      if (extractionResult.homeworkCreated) {
        message += '\n📝 New homework assignment created and available in the assignments section!'
      }

      if (extractionResult.vocabularyAdded) {
        message += `\n📚 ${extractionResult.vocabularyCount} new words added to your vocabulary collection!`
      }

      if (lessonOrchestrator.showToast) {
        lessonOrchestrator.showToast(message, 'success')
      }

      lessonOrchestrator.lessonCompleted.value = true
      extractionResults.value = extractionResult
    }

    // Lifecycle hooks
    onMounted(() => {
      document.addEventListener('keydown', handleKeyboardShortcuts)
      window.addEventListener('resize', handleWindowResize)
      
      // Load saved split sizes
      loadSavedSizes()
      
      // Adjust for current screen size
      handleWindowResize()
      
      // Check if guest banner was dismissed
      try {
        if (sessionStorage.getItem('guestBannerDismissed')) {
          guestBannerDismissed.value = true
        }
      } catch (error) {
}
      
      // Load guest progress if available
      if (isGuestMode.value) {
        const savedProgress = loadGuestProgress()
        if (savedProgress) {
}
        startGuestAutoSave()
}
      
      // Make debug functions globally available
      window.resetSplitSizes = resetSplitSizes
      window.loadSavedSizes = loadSavedSizes
      window.getCurrentSplit = () => ({
        left: currentLeftWidth.value,
        right: currentRightWidth.value,
        direction: resizeDirection.value
      })
})

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboardShortcuts)
      window.removeEventListener('resize', handleWindowResize)
      
      // Clean up any active resize state
      if (isResizing.value) {
        stopResize()
      }
      
      // Stop guest auto-save
      stopGuestAutoSave()
      
      // Save guest progress one last time
      if (isGuestMode.value && lessonOrchestrator.started.value) {
        saveGuestProgress()
}
      
      // Clean up debug functions
      delete window.resetSplitSizes
      delete window.loadSavedSizes
      delete window.getCurrentSplit
    })

    // Watchers
    watch(() => lessonOrchestrator.lessonCompleted.value, (newVal, oldVal) => {
      if (newVal && !oldVal) {
        startConfetti()
        if (isGuestMode.value) {
          saveGuestProgress()
}
      }
    })

    // Watch for step changes and reset exercise index
    watch(() => lessonOrchestrator.currentStep.value, (newStep, oldStep) => {
      // Reset exercise index when changing high-level steps
      if (newStep?.id !== oldStep?.id) {

        exercises.currentExerciseIndex.value = 0

        // Also reset initialization tracker
        initializationTracker.value = { currentExerciseId: null, initialized: false }
      }

      // Check for drag-drop exercises
      if (newStep && newStep.type === 'exercise') {
        const currentExercise = getCurrentExercise()
        if (currentExercise && currentExercise.type === 'drag-drop') {
          nextTick(() => {
            ensureDragDropInitialization()
          })
        }
      }
    }, { immediate: false })

    // Watch for exercise changes and ensure drag-drop is initialized
    watch(() => [lessonOrchestrator.currentStep.value, exercises.currentExerciseIndex.value],
      ([newStep, newIndex], [oldStep, oldIndex]) => {
        if (newStep && newStep.type === 'exercise') {
          const currentExercise = getCurrentExercise()
          if (currentExercise && currentExercise.type === 'drag-drop') {
            nextTick(() => {
              ensureDragDropInitialization()
            })
          }
        }
      },
      { immediate: true }
    )

    // Watch for resize direction changes
    watch(() => resizeDirection.value, (newDirection) => {
})
    
    // Auto-save guest progress on step change
    watch(() => lessonOrchestrator.currentIndex.value, (newIndex, oldIndex) => {
      if (isGuestMode.value && lessonOrchestrator.started.value && newIndex !== oldIndex) {
        saveGuestProgress()
}
    })

    // Return all props and methods
    return {
      // Guest Mode
      isGuestMode,
      guestBannerDismissed,
      handleGuestRegister,
      dismissGuestBanner,
      saveGuestProgress,
      loadGuestProgress,

      // Resizable Split Screen State
      isResizing,
      currentLeftWidth,
      currentRightWidth,
      resizeDirection,
      leftPanelStyle,
      rightPanelStyle,
      widthIndicatorText,

      // Resizable Split Screen Methods
      startResize,
      handleResize,
      stopResize,
      handleResizeKeyboard,
      resetSplitSizes,
      loadSavedSizes,
      handleWindowResize,

      // Data and state from lessonOrchestrator
      loading: lessonOrchestrator.loading,
      error: lessonOrchestrator.error,
      lesson: lessonOrchestrator.lesson,
      started: lessonOrchestrator.started,
      currentIndex: lessonOrchestrator.currentIndex,
      steps: lessonOrchestrator.steps,
      progressPercentage: lessonOrchestrator.progressPercentage,
      currentStep: lessonOrchestrator.currentStep,
      isInteractiveStep: lessonOrchestrator.isInteractiveStep,
      isGameStep,
      showPaywallModal: paymentValidation.showPaywallModal,
      showExitModal: lessonOrchestrator.showExitModal,
      lessonCompleted: lessonOrchestrator.lessonCompleted,
      readableTime: lessonOrchestrator.readableTime,
      stars: lessonOrchestrator.stars,
      mistakeCount: lessonOrchestrator.mistakeCount,
      earnedPoints: lessonOrchestrator.earnedPoints,
      medalLabel: lessonOrchestrator.medalLabel,
      getMedalIcon: lessonOrchestrator.getMedalIcon,
      progressInsight: lessonOrchestrator.progressInsight,
      estimatedTime: lessonOrchestrator.estimatedTime,
      previousProgress: lessonOrchestrator.previousProgress,
      formattedTime: lessonOrchestrator.formattedTime,

      // Exercise state
      userAnswer: exercises.userAnswer,
      confirmation: exercises.confirmation,
      answerWasCorrect: exercises.answerWasCorrect,
      currentHint: exercises.currentHint,
      smartHint: explanation.smartHint,
      fillBlankAnswers: exercises.fillBlankAnswers,
      matchingPairs: exercises.matchingPairs,
      selectedMatchingItem: exercises.selectedMatchingItem,
      orderingItems: exercises.orderingItems,
      dragDropPlacements: exercises.dragDropPlacements,
      availableDragItems: exercises.availableDragItems,
      dropZones: exercises.dropZones,
      currentExerciseIndex: exercises.currentExerciseIndex,
      currentQuizIndex: exercises.currentQuizIndex,

      // Local lesson state
      attemptCount,
      maxAttempts,
      showCorrectAnswer,
      correctAnswerText,
      isOnSecondChance,
      showMigrationPanel,
      migrationLoading,
      extractionResults,
      currentTab,
      consecutiveCorrect: lessonOrchestrator.consecutiveCorrect,

      // AI Explanation and Chat
      showExplanationHelp: explanation.showExplanationHelp,
      explanationQuestion: explanation.explanationQuestion,
      explanationAIResponse: explanation.explanationAIResponse,
      isLoadingExplanation: explanation.isLoadingExplanation,
      aiSuggestions: explanation.aiSuggestions,
      aiChatInput: explanation.aiChatInput,
      aiChatHistory: explanation.aiChatHistory,
      aiIsLoading: explanation.aiIsLoading,
      aiUsage: explanation.aiUsage,
      showFloatingAI: explanation.showFloatingAI,
      floatingAIInput: explanation.floatingAIInput,
      quickSuggestions: explanation.quickSuggestions,

      // Vocabulary Modal
      vocabularyModal: vocabulary.vocabularyModal,
      cardAnimation: vocabulary.cardAnimation,
      currentVocabWord: vocabulary.currentWord,
      vocabProgress: vocabulary.progress,
      isLastVocabWord: vocabulary.isLastWord,

      // Problem Reporting
      showProblemReportModal,
      problemDescription,
      problemType,
      screenshotUrl,
      contactInfo,
      isSubmitting,
      showValidationError,
      showSuccessMessage,

      // Confetti
      confettiCanvas,
      showConfetti,

      // Lesson orchestrator methods
      retryLoad: lessonOrchestrator.retryLoad,
      startLesson,
      continuePreviousProgress: lessonOrchestrator.continuePreviousProgress,
      confirmExit: lessonOrchestrator.confirmExit,
      cancelExit: lessonOrchestrator.cancelExit,
      shareResult: lessonOrchestrator.shareResult,
      goToVocabulary: lessonOrchestrator.goToVocabulary,
      getLessonProgress: lessonOrchestrator.getLessonProgress,

      // Navigation methods
      exitLesson,
      handleReturnToCatalogue,
      handleGoToHomework,

      // Exercise methods
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      handleAnswerChanged,
      updateFillBlankAnswer,
      handleSubmitOrNext,
      goToNextExercise,
      goToNextQuiz,
      goNext,
      goPrevious,
      showHint,
      clearSmartHint,
      handleMatchingItemSelected,
      handleRemoveMatchingPair,

      // Drag and Drop methods
      handleDragItemStart,
      handleDragOverZone,
      handleDragLeaveZone,
      handleDropInZone,
      handleRemoveDroppedItem,
      ensureDragDropInitialization,

      // AI Help Panel Methods
      toggleExplanationHelp,
      askAboutExplanation,
      sendAIMessage,
      askAI,
      clearAIChat,

      // Floating AI Assistant Methods
      toggleFloatingAI,
      closeFloatingAI,
      sendFloatingAIMessage,

      // Vocabulary methods
      initializeVocabularyModal,
      jumpToVocabWord,
      showVocabDefinition,
      hideVocabDefinition,
      markWordAsLearned,
      nextVocabWord,
      previousVocabWord,
      skipVocabularyModal,
      closeVocabularyModal,
      restartVocabulary,
      pronounceWord,

      // Migration methods
      migrateLessonContent,
      showMigrationPanelModal,
      closeMigrationPanel,

      // Problem Reporting methods
      openProblemReportModal,
      closeProblemReportModal,
      submitProblemReport,
      closeSuccessMessage,

      // Lesson completion methods
      completeLessonWithExtraction,
      extractLessonContent,
      showCompletionMessage
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";

/* Modal animation */
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

/* Ensure buttons have proper touch targets on mobile */
button {
  min-height: 44px;
}

/* Focus states for accessibility */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-modal-in {
    animation: none;
  }
}
</style>