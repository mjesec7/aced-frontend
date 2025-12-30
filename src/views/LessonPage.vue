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
      <div v-if="showPaywallModal" class="fixed inset-0 z-1000 bg-black/40 flex items-center justify-center p-4">
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
      <div v-if="showExitModal" class="fixed inset-0 z-1000 bg-black/40 flex items-center justify-center p-4">
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
      <div v-if="showProblemReportModal" class="fixed inset-0 z-1000 bg-black/40 flex items-center justify-center p-4" @click.self="closeProblemReportModal">
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
        <div v-if="showSuccessMessage" class="fixed top-4 right-4 z-2000 max-w-sm w-full">
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
      <!-- Header -->
      <div class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3">
        <div class="flex items-center justify-between gap-2 sm:gap-4">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              @click="confirmExit"
              class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
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
            <div class="flex items-center gap-2 shrink-0">
              <div class="w-20 sm:w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-linear-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
              <span class="text-xs font-semibold text-slate-500 tabular-nums">{{ currentIndex + 1 }}/{{ steps.length }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
        <div v-if="showMigrationPanel" class="fixed bottom-4 right-4 z-100 max-w-sm w-full">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 bg-linear-to-r from-blue-50 to-indigo-50">
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
      <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    </button>

    <!-- Lexi Voice AI Button -->
    <button
      v-if="started && !lessonCompleted"
      @click="handleLexiSpeak"
      @contextmenu.prevent="handleLexiListen"
      class="fixed bottom-24 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
      :class="{
        'bg-emerald-500 shadow-emerald-500/40': lexiIsPlaying,
    // ==========================================
    return {
      // Guest Mode
      isGuestMode,
      guestBannerDismissed,
      handleGuestRegister,
      dismissGuestBanner,
      saveGuestProgress,
      loadGuestProgress,

      // Resize State
      isResizing,
      currentLeftWidth,
      currentRightWidth,
      resizeDirection,
      leftPanelStyle,
      rightPanelStyle,
      resizeDisabled,
      isTablet,

      // Resize Methods
      startResize,
      handleResize,
      stopResize,
      resetSplitSizes,
      loadSavedSizes,
      handleWindowResize,

      // Orchestrator Data
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

      // Exercise State
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

      // Local State
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

      // AI State
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

      // Vocabulary
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

      // Computed
      isLastStep,

      // Methods
      retryLoad: lessonOrchestrator.retryLoad,
      startLesson,
      continuePreviousProgress: lessonOrchestrator.continuePreviousProgress,
      confirmExit: lessonOrchestrator.confirmExit,
      cancelExit: lessonOrchestrator.cancelExit,
      shareResult: lessonOrchestrator.shareResult,
      goToVocabulary: lessonOrchestrator.goToVocabulary,
      getLessonProgress: lessonOrchestrator.getLessonProgress,

      // Navigation
      exitLesson,
      handleReturnToCatalogue,
      handleGoToHomework,

      // Exercise Methods
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

      // Drag and Drop
      handleDragItemStart,
      handleDragOverZone,
      handleDragLeaveZone,
      handleDropInZone,
      handleRemoveDroppedItem,
      ensureDragDropInitialization,

      // AI Methods
      toggleExplanationHelp,
      askAboutExplanation,
      sendAIMessage,
      askAI,
      clearAIChat,
      toggleFloatingAI,
      closeFloatingAI,
      sendFloatingAIMessage,

      // Vocabulary Methods
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

      // Migration
      migrateLessonContent,
      showMigrationPanelModal,
      closeMigrationPanel,

      // Problem Reporting
      openProblemReportModal,
      closeProblemReportModal,
      submitProblemReport,
      closeSuccessMessage,

      // Lexi Voice AI
      lexiIsPlaying: lexi.isPlaying,
      lexiIsLoading: lexi.isLoading,
      lexiIsListening: lexi.isListening,
      lexiError: lexi.error,
      handleLexiSpeak,
      handleLexiListen,
      stopLexi: lexi.stop,
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";

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