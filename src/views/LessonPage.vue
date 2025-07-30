<template>
  <div class="lesson-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Loading lesson...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-screen">
      <div class="error-content">
        <h2>⚠️ Lesson Error</h2>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button @click="retryLoad" class="btn btn-primary">Try Again</button>
          <button @click="handleReturnToCatalogue" class="btn btn-secondary">Back to Catalogue</button>
        </div>
      </div>
    </div>

    <!-- Paywall Modal -->
    <div v-if="showPaywallModal" class="modal-overlay">
      <div class="paywall-modal">
        <h2>Premium Content</h2>
        <p>This lesson requires a premium subscription.</p>
        <div class="modal-actions">
          <button @click="$router.push('/pay/start')" class="btn btn-primary">Subscribe</button>
          <button @click="handleReturnToCatalogue" class="btn btn-secondary">Back</button>
        </div>
      </div>
    </div>

    <!-- Exit Confirmation -->
    <div v-if="showExitModal" class="modal-overlay">
      <div class="exit-modal">
        <h2>Exit Lesson?</h2>
        <p>Your progress will be saved.</p>
        <div class="modal-actions">
          <button @click="exitLesson" class="btn btn-primary">Exit</button>
          <button @click="cancelExit" class="btn btn-secondary">Continue</button>
        </div>
      </div>
    </div>

    <!-- Problem Report Modal -->
    <div v-if="showProblemReportModal" class="modal-overlay">
      <div class="problem-report-modal">
        <h2>Report Problem</h2>
        <div class="form-group">
          <label>Problem Type:</label>
          <select v-model="problemType">
            <option value="content">Content Issue</option>
            <option value="technical">Technical Problem</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Description:</label>
          <textarea v-model="problemDescription" rows="4"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="submitProblemReport" class="btn btn-primary">Submit</button>
          <button @click="closeProblemReportModal" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Vocabulary Learning Modal -->
    <div v-if="vocabularyModal.isVisible" class="modal-overlay">
      <div class="vocabulary-modal">
        <div class="vocab-header">
          <h2>Vocabulary Learning</h2>
          <div class="vocab-progress">
            <span>{{ currentIndex + 1 }} / {{ vocabularyModal.words.length }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: vocabProgress + '%' }"></div>
            </div>
          </div>
        </div>
        
        <div v-if="currentVocabWord" class="vocab-card" :class="{ flipping: cardAnimation.isFlipping }">
          <div class="card-front" v-if="!cardAnimation.showDefinition">
            <h3>{{ extractWordProperty(currentVocabWord, 'term') }}</h3>
            <p class="pronunciation" v-if="extractWordProperty(currentVocabWord, 'pronunciation')">
              {{ extractWordProperty(currentVocabWord, 'pronunciation') }}
            </p>
            <button @click="showVocabDefinition" class="btn btn-primary">Show Definition</button>
            <button @click="pronounceWord(extractWordProperty(currentVocabWord, 'term'))" class="btn btn-icon">🔊</button>
          </div>
          
          <div class="card-back" v-else>
            <h3>{{ extractWordProperty(currentVocabWord, 'term') }}</h3>
            <p class="definition">{{ extractWordProperty(currentVocabWord, 'definition') }}</p>
            <p class="example" v-if="extractWordProperty(currentVocabWord, 'example')">
              <strong>Example:</strong> {{ extractWordProperty(currentVocabWord, 'example') }}
            </p>
            <div class="vocab-actions">
              <button @click="markWordAsLearned" class="btn" :class="currentVocabWord.learned ? 'btn-success' : 'btn-primary'">
                {{ currentVocabWord.learned ? '✓ Learned' : 'Mark as Learned' }}
              </button>
              <button @click="hideVocabDefinition" class="btn btn-secondary">Hide Definition</button>
            </div>
          </div>
        </div>
        
        <div class="vocab-controls">
          <button @click="previousVocabWord" :disabled="currentIndex === 0" class="btn btn-secondary">Previous</button>
          <button @click="nextVocabWord" class="btn btn-primary">
            {{ isLastVocabWord ? 'Complete' : 'Next' }}
          </button>
          <button @click="skipVocabularyModal" class="btn btn-secondary">Skip</button>
        </div>
      </div>
    </div>

    <!-- Intro Screen -->
    <div v-if="!started && !showPaywallModal && !loading && !error" class="lesson-intro">
      <div class="intro-content">
        <h1>{{ getLocalized(lesson.lessonName) }}</h1>
        <p class="lesson-description">{{ getLocalized(lesson.description) }}</p>
        
        <div class="lesson-stats">
          <div class="stat">
            <span class="stat-label">Estimated Time:</span>
            <span class="stat-value">{{ estimatedTime }} minutes</span>
          </div>
          <div class="stat">
            <span class="stat-label">Steps:</span>
            <span class="stat-value">{{ steps.length }}</span>
          </div>
        </div>
        
        <div class="intro-actions">
          <button v-if="!previousProgress" @click="startLesson" class="btn btn-primary btn-large">
            Start Lesson
          </button>
          <div v-else class="continue-options">
            <button @click="continuePreviousProgress" class="btn btn-primary btn-large">
              Continue from Step {{ (previousProgress.completedSteps?.length || 0) + 1 }}
            </button>
            <button @click="startLesson" class="btn btn-secondary">Start Over</button>
          </div>
          
          <button @click="confirmExit" class="btn btn-secondary">Back to Catalogue</button>
        </div>
        
        <button @click="openProblemReportModal" class="report-problem-btn">Report Problem</button>
      </div>
    </div>

    <!-- Main Lesson Content -->
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      <!-- Header -->
      <div class="lesson-header">
        <div class="header-content">
          <h2>{{ getLocalized(lesson.lessonName) }}</h2>
          <div class="lesson-info">
            <span class="step-counter">Step {{ currentIndex + 1 }} of {{ steps.length }}</span>
            <span class="timer">⏱️ {{ formattedTime }}</span>
            <div class="stars">⭐ {{ stars }}</div>
          </div>
        </div>
        <div class="header-actions">
          <button @click="openProblemReportModal" class="btn btn-icon" title="Report Problem">⚠️</button>
          <button @click="confirmExit" class="btn btn-secondary">Exit</button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <span class="progress-text">{{ progressPercentage }}% Complete</span>
      </div>

      <!-- Split Screen Content -->
      <div 
        class="split-content"
        :class="{
          'both-panels': showContentPanel && showInteractivePanel,
          'left-only': showContentPanel && !showInteractivePanel,
          'right-only': !showContentPanel && showInteractivePanel,
          'vertical-split': isVerticalLayout,
          'horizontal-split': !isVerticalLayout
        }"
      >
        <!-- Left Panel: Content -->
        <div 
          v-if="showContentPanel"
          class="panel left-panel"
          :style="leftPanelStyle"
        >
          <div class="content-panel">
            <!-- Content based on step type -->
            <div v-if="currentStep" class="step-content">
              <!-- Explanation Step -->
              <div v-if="currentStep.type === 'explanation'" class="explanation-content">
                <h3>{{ getStepIcon(currentStep.type) }} {{ getStepTypeText(currentStep.type) }}</h3>
                <div class="content-body" v-html="formatContent(currentStep.data?.content || '')"></div>
              </div>

              <!-- Example Step -->
              <div v-else-if="currentStep.type === 'example'" class="example-content">
                <h3>{{ getStepIcon(currentStep.type) }} {{ getStepTypeText(currentStep.type) }}</h3>
                <div class="content-body" v-html="formatContent(currentStep.data?.content || '')"></div>
              </div>

              <!-- Reading Step -->
              <div v-else-if="currentStep.type === 'reading'" class="reading-content">
                <h3>{{ getStepIcon(currentStep.type) }} {{ getStepTypeText(currentStep.type) }}</h3>
                <div class="content-body" v-html="formatContent(currentStep.data?.content || '')"></div>
              </div>

              <!-- Vocabulary Step -->
              <div v-else-if="currentStep.type === 'vocabulary'" class="vocabulary-content">
                <h3>{{ getStepIcon(currentStep.type) }} {{ getStepTypeText(currentStep.type) }}</h3>
                <p>Ready to learn new vocabulary?</p>
                <button @click="initializeVocabularyModal(currentStep)" class="btn btn-primary">
                  Start Vocabulary Learning
                </button>
              </div>

              <!-- Default Content -->
              <div v-else class="default-content">
                <h3>{{ getStepIcon(currentStep.type) }} {{ getStepTypeText(currentStep.type) }}</h3>
                <div class="content-body" v-html="formatContent(currentStep.data?.content || 'Content not available')"></div>
              </div>
            </div>

            <!-- Navigation -->
            <div class="content-navigation">
              <button 
                @click="goPrevious" 
                :disabled="currentIndex === 0"
                class="btn btn-secondary"
              >
                Previous
              </button>
              
              <button 
                @click="goNext"
                class="btn btn-primary"
              >
                {{ isLastStep ? 'Complete Lesson' : 'Next' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Resize Handle -->
        <div 
          v-if="showContentPanel && showInteractivePanel"
          class="resize-handle"
          :class="{
            'vertical-handle': !isVerticalLayout,
            'horizontal-handle': isVerticalLayout,
            'resizing': isResizing
          }"
          @mousedown="startResize"
          @touchstart="startResize"
          @dblclick="resetToDefault"
          @keydown="handleKeyboardResize"
          tabindex="0"
          role="separator"
          :aria-label="resizeAriaLabel"
          :aria-valuenow="Math.round(leftPanelWidth)"
          aria-valuemin="25"
          aria-valuemax="75"
        >
          <div class="resize-indicator">
            <div class="resize-grip">
              <span class="grip-dot"></span>
              <span class="grip-dot"></span>
              <span class="grip-dot"></span>
            </div>
            <div class="resize-tooltip" v-if="showTooltip">
              <span class="tooltip-text">{{ tooltipText }}</span>
              <small class="tooltip-hint">Drag to resize • Double-click to reset</small>
            </div>
          </div>
        </div>

        <!-- Right Panel: Interactive -->
        <div 
          v-if="showInteractivePanel"
          class="panel right-panel"
          :style="rightPanelStyle"
        >
          <div class="right-panel-content">
            <!-- Main interactive content -->
            <div class="interactive-section">
              <div v-if="isInteractiveStep" class="interactive-panel">
                <!-- Exercise Content -->
                <div v-if="currentStep.type === 'exercise' || currentStep.type === 'practice'">
                  <div v-if="getCurrentExercise(currentStep)" class="exercise-container">
                    <h4>Exercise {{ currentExerciseIndex + 1 }} of {{ getTotalExercises(currentStep) }}</h4>
                    
                    <!-- Exercise content based on type -->
                    <div class="exercise-content">
                      <h5>{{ getCurrentExercise(currentStep).question || getCurrentExercise(currentStep).title }}</h5>
                      
                      <!-- Short Answer -->
                      <div v-if="getCurrentExercise(currentStep).type === 'short-answer'" class="exercise-input">
                        <input 
                          v-model="userAnswer" 
                          type="text" 
                          placeholder="Your answer..."
                          class="form-control"
                        />
                      </div>

                      <!-- Multiple Choice -->
                      <div v-else-if="getCurrentExercise(currentStep).type === 'multiple-choice'" class="exercise-options">
                        <div 
                          v-for="(option, index) in getCurrentExercise(currentStep).options" 
                          :key="index"
                          class="option"
                        >
                          <label>
                            <input 
                              type="radio" 
                              :value="index" 
                              v-model="userAnswer"
                            />
                            {{ option }}
                          </label>
                        </div>
                      </div>

                      <!-- True/False -->
                      <div v-else-if="getCurrentExercise(currentStep).type === 'true-false'" class="exercise-options">
                        <label>
                          <input type="radio" value="true" v-model="userAnswer" />
                          True
                        </label>
                        <label>
                          <input type="radio" value="false" v-model="userAnswer" />
                          False
                        </label>
                      </div>

                      <!-- Fill in Blanks -->
                      <div v-else-if="getCurrentExercise(currentStep).type === 'fill-blank'" class="fill-blank-exercise">
                        <div class="template-text" v-html="getFormattedFillBlankTemplate(getCurrentExercise(currentStep))"></div>
                        <div class="blank-inputs">
                          <input 
                            v-for="(blank, index) in fillBlankAnswers" 
                            :key="index"
                            v-model="fillBlankAnswers[index]"
                            type="text"
                            :placeholder="`Blank ${index + 1}`"
                            class="form-control blank-input"
                          />
                        </div>
                      </div>

                      <!-- Default -->
                      <div v-else class="exercise-input">
                        <input 
                          v-model="userAnswer" 
                          type="text" 
                          placeholder="Your answer..."
                          class="form-control"
                        />
                      </div>
                    </div>

                    <!-- Submit Button -->
                    <button 
                      @click="handleSubmit(userAnswer)"
                      :disabled="!canSubmitAnswer(getCurrentExercise(currentStep))"
                      class="btn btn-primary"
                    >
                      Submit Answer
                    </button>

                    <!-- Feedback -->
                    <div v-if="confirmation" class="exercise-feedback" :class="{ correct: answerWasCorrect, incorrect: !answerWasCorrect }">
                      <p>{{ confirmation }}</p>
                    </div>

                    <!-- Navigation -->
                    <div class="exercise-navigation">
                      <button 
                        v-if="!isLastExercise(currentStep)"
                        @click="goToNextExercise(currentStep, goNext)"
                        class="btn btn-primary"
                      >
                        Next Exercise
                      </button>
                      <button 
                        v-else
                        @click="goNext"
                        class="btn btn-success"
                      >
                        Complete Exercises
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Quiz Content -->
                <div v-else-if="currentStep.type === 'quiz'">
                  <div v-if="getCurrentQuiz(currentStep)" class="quiz-container">
                    <h4>Quiz {{ currentQuizIndex + 1 }} of {{ getTotalQuizzes(currentStep) }}</h4>
                    
                    <div class="quiz-content">
                      <h5>{{ getCurrentQuiz(currentStep).question }}</h5>
                      
                      <!-- Quiz options -->
                      <div class="quiz-options">
                        <div 
                          v-for="(option, index) in getCurrentQuiz(currentStep).options" 
                          :key="index"
                          class="option"
                        >
                          <label>
                            <input 
                              type="radio" 
                              :value="index" 
                              v-model="userAnswer"
                            />
                            {{ option }}
                          </label>
                        </div>
                      </div>
                    </div>

                    <!-- Submit Button -->
                    <button 
                      @click="handleSubmit(userAnswer)"
                      :disabled="userAnswer === null || userAnswer === undefined"
                      class="btn btn-primary"
                    >
                      Submit Answer
                    </button>

                    <!-- Feedback -->
                    <div v-if="confirmation" class="quiz-feedback" :class="{ correct: answerWasCorrect, incorrect: !answerWasCorrect }">
                      <p>{{ confirmation }}</p>
                    </div>

                    <!-- Navigation -->
                    <div class="quiz-navigation">
                      <button 
                        v-if="!isLastQuiz(currentStep)"
                        @click="goToNextQuiz(currentStep, goNext)"
                        class="btn btn-primary"
                      >
                        Next Question
                      </button>
                      <button 
                        v-else
                        @click="goNext"
                        class="btn btn-success"
                      >
                        Complete Quiz
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- AI Help section at bottom -->
            <div class="ai-help-section">
              <AIHelpPanel
                :ai-suggestions="aiSuggestions"
                :ai-chat-history="aiChatHistory"
                :ai-is-loading="aiIsLoading"
                :ai-usage="aiUsage"
                @send-message="handleAIMessage"
                @ask-ai="askAI"
                @clear-chat="handleClearAIChat"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Completion Screen -->
    <div v-if="lessonCompleted" class="completion-screen">
      <div class="completion-content">
        <h1>🎉 Lesson Completed!</h1>
        <div class="completion-stats">
          <div class="stat">
            <span class="stat-icon">⏱️</span>
            <span class="stat-value">{{ readableTime }}</span>
            <span class="stat-label">Time Spent</span>
          </div>
          <div class="stat">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">{{ stars }}</span>
            <span class="stat-label">Stars Earned</span>
          </div>
          <div class="stat">
            <span class="stat-icon">💯</span>
            <span class="stat-value">{{ earnedPoints }}</span>
            <span class="stat-label">Points</span>
          </div>
        </div>
        
        <div class="medal-section">
          <div class="medal">{{ getMedalIcon() }}</div>
          <p class="medal-text">{{ medalLabel }}</p>
        </div>

        <div class="completion-actions">
          <button @click="handleReturnToCatalogue" class="btn btn-primary btn-large">
            Back to Catalogue
          </button>
          <button @click="handleGoToHomework" class="btn btn-secondary">
            Practice & Homework
          </button>
        </div>
      </div>
    </div>

    <!-- Floating AI Assistant Toggle -->
    <button
      v-if="started && !lessonCompleted"
      class="floating-ai-btn"
      @click="toggleFloatingAI"
      :class="{ active: showFloatingAI }"
      title="AI Assistant"
    >
      🤖
    </button>

    <!-- Floating AI Assistant -->
    <FloatingAIAssistant
      v-if="showFloatingAI && started && !lessonCompleted"
      :usage="aiUsage"
      :quick-suggestions="quickSuggestions"
      :ai-chat-history="aiChatHistory"
      :ai-is-loading="aiIsLoading"
      :floating-a-i-input="floatingAIInput"
      @close="closeFloatingAI"
      @send-message="handleFloatingAIMessage"
      @ask-ai="askAI"
      @clear-chat="handleClearAIChat"
    />

    <!-- Success Notifications -->
    <div v-if="notifications.length" class="notification-system">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification"
        :class="notification.type"
        @click="closeNotification(notification.id)"
      >
        <span class="notification-message">{{ notification.message }}</span>
        <button class="notification-close">✕</button>
      </div>
    </div>

    <!-- Confetti Animation -->
    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

// Import the actual composables from the correct path
import { useLessonOrchestrator } from '@/composables/useLessonOrchestrator'
import { useExercises } from '@/composables/useExercises'
import { useVocabulary } from '@/composables/useVocabulary'
import { useExplanation } from '@/composables/useExplanation'
import { usePaymentValidation } from '@/composables/usePaymentValidation'
import { useSound } from '@/composables/useSound'

export default {
  name: 'LessonPage',

  setup() {
    const router = useRouter()

    // ==========================================
    // COMPOSABLES - Using the actual composables
    // ==========================================
    const {
      // Core lesson state
      lesson,
      steps,
      currentIndex,
      started,
      loading,
      error,
      retryCount,
      
      // Progress state
      mistakeCount,
      stars,
      earnedPoints,
      hintsUsed,
      mistakeLog,
      previousProgress,
      
      // Completion state
      lessonCompleted,
      elapsedSeconds,
      showConfetti,
      showExitModal,
      medalLabel,
      
      // User state
      userId,
      
      // Computed
      currentStep,
      isInteractiveStep,
      progressPercentage,
      formattedTime,
      readableTime,
      isLastStep,
      estimatedTime,
      
      // Methods
      loadLesson,
      saveProgress,
      startLesson,
      continuePreviousProgress,
      goNext,
      goPrevious,
      completeLesson,
      retryLoad,
      confirmExit,
      cancelExit,
      exitLesson,
      getStepIcon,
      getStepTypeText,
      getMedalIcon,
      formatContent,
      getLocalized,
      initializeLesson,
      cleanup
    } = useLessonOrchestrator()

    const {
      // Exercise state
      currentExerciseIndex,
      currentQuizIndex,
      userAnswer,
      confirmation,
      answerWasCorrect,
      currentHint,
      smartHint,
      fillBlankAnswers,
      matchingPairs,
      selectedMatchingItem,
      orderingItems,
      dragDropPlacements,
      availableDragItems,
      dropZones,
      
      // Methods
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      isLastExercise,
      isLastQuiz,
      goToNextExercise,
      goToNextQuiz,
      initializeCurrentExerciseData,
      canSubmitAnswer,
      resetExerciseState,
      resetExerciseAnswers,
      updateFillBlankAnswer,
      getCurrentExerciseType,
      getFormattedFillBlankTemplate,
      validateCurrentAnswer,
      validateQuizAnswer,
      getCorrectAnswerDisplay,
      getRandomSuccessMessage
    } = useExercises()

    const {
      // Vocabulary state
      vocabularyModal,
      cardAnimation,
      currentVocabWord,
      vocabProgress,
      isLastVocabWord,
      
      // Methods
      initializeVocabularyModal,
      showVocabDefinition,
      hideVocabDefinition,
      markWordAsLearned,
      nextVocabWord,
      previousVocabWord,
      jumpToVocabWord,
      skipVocabularyModal,
      restartVocabulary,
      extractWordProperty
    } = useVocabulary()

    const {
      // AI state
      aiChatHistory,
      aiChatInput,
      aiSuggestions,
      aiIsLoading,
      showFloatingAI,
      floatingAIInput,
      quickSuggestions,
      aiUsage,
      progressInsight,
      
      // Methods
      sendAIMessage,
      sendFloatingAIMessage,
      askAI,
      generateAISuggestions,
      toggleFloatingAI,
      closeFloatingAI
    } = useExplanation()

    const {
      // Payment state
      showPaywallModal,
      userStatus,
      isPremiumUser,
      
      // Methods
      validateLessonAccess,
      closePaywallModal
    } = usePaymentValidation()

    const {
      // Sound state
      isPlaying,
      speechSupported,
      
      // Methods
      initializeSpeech,
      pronounceWord
    } = useSound()

    // ==========================================
    // LOCAL STATE
    // ==========================================
    const isResizing = ref(false)
    const leftPanelWidth = ref(50)
    const rightPanelWidth = ref(50)
    const showTooltip = ref(false)
    const resizeStartInfo = ref(null)
    const confettiCanvas = ref(null)
    const notifications = ref([])

    // Problem report state
    const showProblemReportModal = ref(false)
    const problemType = ref('content')
    const problemDescription = ref('')

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================
    const showContentPanel = computed(() => {
      if (!currentStep.value) return false
      
      const contentTypes = ['explanation', 'example', 'reading', 'vocabulary']
      return contentTypes.includes(currentStep.value.type) || 
             (currentStep.value.data && currentStep.value.data.content)
    })

    const showInteractivePanel = computed(() => {
      if (!currentStep.value) return false
      
      const interactiveTypes = ['exercise', 'practice', 'quiz']
      return interactiveTypes.includes(currentStep.value.type)
    })

    const isVerticalLayout = computed(() => {
      return window.innerWidth <= 1024
    })

    const leftPanelStyle = computed(() => {
      if (!showInteractivePanel.value) {
        return { flex: '1' }
      }
      
      if (isVerticalLayout.value) {
        return {
          flex: `0 0 ${leftPanelWidth.value}%`,
          minHeight: '200px',
          maxHeight: leftPanelWidth.value >= 75 ? '75%' : 'none'
        }
      }
      
      return {
        flex: `0 0 ${leftPanelWidth.value}%`,
        minWidth: '300px',
        maxWidth: leftPanelWidth.value >= 75 ? '75%' : 'none'
      }
    })

    const rightPanelStyle = computed(() => {
      if (!showContentPanel.value) {
        return { flex: '1' }
      }
      
      if (isVerticalLayout.value) {
        return {
          flex: `0 0 ${100 - leftPanelWidth.value}%`,
          minHeight: '200px',
          maxHeight: (100 - leftPanelWidth.value) >= 75 ? '75%' : 'none'
        }
      }
      
      return {
        flex: `0 0 ${100 - leftPanelWidth.value}%`,
        minWidth: '300px',
        maxWidth: (100 - leftPanelWidth.value) >= 75 ? '75%' : 'none'
      }
    })

    const resizeAriaLabel = computed(() => {
      const direction = isVerticalLayout.value ? 'vertical' : 'horizontal'
      return `Resize panels ${direction}ly. Current split: ${Math.round(leftPanelWidth.value)}% | ${Math.round(100 - leftPanelWidth.value)}%`
    })

    const tooltipText = computed(() => {
      return `${Math.round(leftPanelWidth.value)}% | ${Math.round(100 - leftPanelWidth.value)}%`
    })

    // ==========================================
    // SPLIT SCREEN METHODS
    // ==========================================
    const startResize = (event) => {
      event.preventDefault()
      
      isResizing.value = true
      showTooltip.value = true
      
      const isTouch = event.type === 'touchstart'
      const clientX = isTouch ? event.touches[0].clientX : event.clientX
      const clientY = isTouch ? event.touches[0].clientY : event.clientY
      
      resizeStartInfo.value = {
        startX: clientX,
        startY: clientY,
        startLeftWidth: leftPanelWidth.value,
        isVertical: isVerticalLayout.value
      }
      
      const moveEvent = isTouch ? 'touchmove' : 'mousemove'
      const endEvent = isTouch ? 'touchend' : 'mouseup'
      
      document.addEventListener(moveEvent, handleResize, { passive: false })
      document.addEventListener(endEvent, stopResize)
      
      document.body.style.userSelect = 'none'
      document.body.style.cursor = isVerticalLayout.value ? 'row-resize' : 'col-resize'
    }

    const handleResize = (event) => {
      if (!isResizing.value || !resizeStartInfo.value) return
      
      event.preventDefault()
      
      const isTouch = event.type === 'touchmove'
      const clientX = isTouch ? event.touches[0].clientX : event.clientX
      const clientY = isTouch ? event.touches[0].clientY : event.clientY
      
      const container = event.target.closest('.split-content')
      if (!container) return
      
      let delta = 0
      let containerSize = 0
      
      if (resizeStartInfo.value.isVertical) {
        delta = clientY - resizeStartInfo.value.startY
        containerSize = container.offsetHeight
      } else {
        delta = clientX - resizeStartInfo.value.startX
        containerSize = container.offsetWidth
      }
      
      const deltaPercentage = (delta / containerSize) * 100
      
      let newLeftWidth = resizeStartInfo.value.startLeftWidth + deltaPercentage
      newLeftWidth = Math.max(25, Math.min(75, newLeftWidth))
      
      leftPanelWidth.value = newLeftWidth
    }

    const stopResize = () => {
      if (!isResizing.value) return
      
      isResizing.value = false
      showTooltip.value = false
      resizeStartInfo.value = null
      
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
      document.removeEventListener('touchmove', handleResize)
      document.removeEventListener('touchend', stopResize)
      
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      
      saveLayoutPreferences()
    }

    const handleKeyboardResize = (event) => {
      const step = 5
      let newLeftWidth = leftPanelWidth.value
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newLeftWidth = Math.max(25, leftPanelWidth.value - step)
          break
        case 'ArrowRight':
          event.preventDefault()
          newLeftWidth = Math.min(75, leftPanelWidth.value + step)
          break
        case 'ArrowUp':
          if (isVerticalLayout.value) {
            event.preventDefault()
            newLeftWidth = Math.max(25, leftPanelWidth.value - step)
          }
          break
        case 'ArrowDown':
          if (isVerticalLayout.value) {
            event.preventDefault()
            newLeftWidth = Math.min(75, leftPanelWidth.value + step)
          }
          break
        case 'Home':
          event.preventDefault()
          newLeftWidth = 25
          break
        case 'End':
          event.preventDefault()
          newLeftWidth = 75
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          newLeftWidth = 50
          break
        default:
          return
      }
      
      leftPanelWidth.value = newLeftWidth
      saveLayoutPreferences()
    }

    const resetToDefault = () => {
      leftPanelWidth.value = 50
      
      try {
        localStorage.removeItem('lessonLayoutPrefs')
      } catch (error) {
        console.warn('Could not remove layout preferences:', error)
      }
    }

    const saveLayoutPreferences = () => {
      try {
        localStorage.setItem('lessonLayoutPrefs', JSON.stringify({
          leftWidth: leftPanelWidth.value,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.warn('Could not save layout preferences:', error)
      }
    }

    const loadLayoutPreferences = () => {
      try {
        const saved = localStorage.getItem('lessonLayoutPrefs')
        if (saved) {
          const { leftWidth, timestamp } = JSON.parse(saved)
          
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
          if (timestamp && timestamp > thirtyDaysAgo) {
            leftPanelWidth.value = Math.max(25, Math.min(75, leftWidth || 50))
          } else {
            localStorage.removeItem('lessonLayoutPrefs')
          }
        }
      } catch (error) {
        console.warn('Could not load layout preferences:', error)
      }
    }

    // ==========================================
    // NAVIGATION METHODS
    // ==========================================
    const handleReturnToCatalogue = () => {
      saveProgress()
      router.push('/profile/catalogue')
    }

    const handleGoToHomework = () => {
      const lessonId = lesson.value?._id
      if (lessonId) {
        router.push(`/lessons/${lessonId}/homework`)
      } else {
        router.push('/profile/homeworks')
      }
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    const handleSubmit = (answer) => {
      console.log('📝 Submitting answer:', answer)
      
      let isCorrect = false
      let feedbackMessage = ''
      
      // Validate answer based on current step type
      if (currentStep.value.type === 'exercise' || currentStep.value.type === 'practice') {
        const exercise = getCurrentExercise(currentStep.value)
        if (exercise) {
          isCorrect = validateCurrentAnswer(exercise)
          feedbackMessage = isCorrect ? 
            getRandomSuccessMessage() : 
            `Incorrect. The correct answer is: ${getCorrectAnswerDisplay(exercise)}`
        }
      } else if (currentStep.value.type === 'quiz') {
        const quiz = getCurrentQuiz(currentStep.value)
        if (quiz) {
          isCorrect = validateQuizAnswer(quiz)
          feedbackMessage = isCorrect ? 
            '✅ Correct!' : 
            `❌ Incorrect. The correct answer is: ${getCorrectAnswerDisplay(quiz)}`
        }
      }
      
      // Update state
      answerWasCorrect.value = isCorrect
      confirmation.value = feedbackMessage
      
      // Update progress
      if (isCorrect) {
        stars.value++
        earnedPoints.value += 10
      } else {
        mistakeCount.value++
        mistakeLog.value.push({
          step: currentIndex.value,
          question: getCurrentExercise(currentStep.value)?.question || getCurrentQuiz(currentStep.value)?.question || '',
          userAnswer: answer,
          correctAnswer: getCorrectAnswerDisplay(getCurrentExercise(currentStep.value) || getCurrentQuiz(currentStep.value)),
          timestamp: new Date().toISOString()
        })
      }
      
      // Auto-advance after a delay if correct
      if (isCorrect) {
        setTimeout(() => {
          if (currentStep.value.type === 'exercise' || currentStep.value.type === 'practice') {
            if (!isLastExercise(currentStep.value)) {
              goToNextExercise(currentStep.value, goNext)
            } else {
              goNext()
            }
          } else if (currentStep.value.type === 'quiz') {
            if (!isLastQuiz(currentStep.value)) {
              goToNextQuiz(currentStep.value, goNext)
            } else {
              goNext()
            }
          }
        }, 2000)
      }
    }

    // ==========================================
    // PROBLEM REPORTING
    // ==========================================
    const openProblemReportModal = () => {
      showProblemReportModal.value = true
    }

    const closeProblemReportModal = () => {
      showProblemReportModal.value = false
      problemType.value = 'content'
      problemDescription.value = ''
    }

    const submitProblemReport = () => {
      console.log('📋 Problem report submitted:', {
        type: problemType.value,
        description: problemDescription.value,
        lessonId: lesson.value?._id,
        currentStep: currentIndex.value + 1,
        totalSteps: steps.value?.length || 0
      })
      
      addNotification('Problem report submitted successfully!', 'success')
      closeProblemReportModal()
    }

    // ==========================================
    // AI METHODS WRAPPER (using composable methods)
    // ==========================================
    const handleAIMessage = (message) => {
      if (typeof sendAIMessage === 'function') {
        sendAIMessage(lesson.value, userProgress.value, currentStep.value)
      } else {
        console.warn('AI service not available')
      }
    }

    const handleFloatingAIMessage = (message) => {
      if (typeof sendFloatingAIMessage === 'function') {
        sendFloatingAIMessage(lesson.value, userProgress.value, currentStep.value)
      } else {
        console.warn('AI service not available')
      }
    }

    const handleClearAIChat = () => {
      if (typeof clearAIChat === 'function') {
        clearAIChat()
      } else {
        aiChatHistory.value = []
      }
    }

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    const closeNotification = (notificationId) => {
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
    }

    const addNotification = (message, type = 'info') => {
      const notification = {
        id: Date.now() + Math.random(),
        message,
        type,
        timestamp: Date.now()
      }
      notifications.value.push(notification)
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        closeNotification(notification.id)
      }, 5000)
    }

    // ==========================================
    // CONFETTI ANIMATION
    // ==========================================
    const launchConfetti = () => {
      if (!confettiCanvas.value) return
      
      const canvas = confettiCanvas.value
      const ctx = canvas.getContext('2d')
      
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      const particles = []
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
      
      // Create particles
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15
        })
      }
      
      // Animation loop
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        particles.forEach((particle, index) => {
          // Update position
          particle.x += particle.vx
          particle.y += particle.vy
          particle.vy += 0.2 // gravity
          particle.rotation += particle.rotationSpeed
          
          // Draw particle
          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation * Math.PI / 180)
          ctx.fillStyle = particle.color
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
          ctx.restore()
          
          // Remove particles that are off screen
          if (particle.y > canvas.height + 10) {
            particles.splice(index, 1)
          }
        })
        
        if (particles.length > 0) {
          requestAnimationFrame(animate)
        }
      }
      
      animate()
    }

    // ==========================================
    // LIFECYCLE HOOKS
    // ==========================================
    onMounted(async () => {
      console.log('🔧 LessonPage mounted')
      
      // Initialize services
      initializeSpeech()
      loadLayoutPreferences()
      
      // Initialize lesson
      await initializeLesson()
      
      // Set up window resize listener
      window.addEventListener('resize', () => {
        nextTick(() => {
          // Force re-evaluation of computed properties
        })
      })
      
      // Launch confetti if lesson completed
      if (lessonCompleted.value) {
        setTimeout(launchConfetti, 500)
      }
    })

    onUnmounted(() => {
      console.log('🧹 LessonPage unmounting')
      
      if (isResizing.value) {
        stopResize()
      }
      
      cleanup()
    })

    // ==========================================
    // RETURN - All state and methods for template
    // ==========================================
    return {
      // Core lesson state
      lesson,
      steps,
      currentIndex,
      started,
      loading,
      error,
      retryCount,
      
      // Progress state
      mistakeCount,
      stars,
      earnedPoints,
      hintsUsed,
      mistakeLog,
      previousProgress,
      
      // Completion state
      lessonCompleted,
      elapsedSeconds,
      showConfetti,
      showExitModal,
      medalLabel,
      
      // User state
      userId,
      
      // Computed
      currentStep,
      isInteractiveStep,
      progressPercentage,
      formattedTime,
      readableTime,
      isLastStep,
      estimatedTime,
      
      // Exercise state
      currentExerciseIndex,
      currentQuizIndex,
      userAnswer,
      confirmation,
      answerWasCorrect,
      currentHint,
      smartHint,
      fillBlankAnswers,
      matchingPairs,
      selectedMatchingItem,
      orderingItems,
      dragDropPlacements,
      availableDragItems,
      dropZones,
      
      // Vocabulary state
      vocabularyModal,
      cardAnimation,
      currentVocabWord,
      vocabProgress,
      isLastVocabWord,
      
      // AI state
      aiChatHistory,
      aiChatInput,
      aiSuggestions,
      aiIsLoading,
      showFloatingAI,
      floatingAIInput,
      quickSuggestions,
      aiUsage,
      progressInsight,
      
      // Payment state
      showPaywallModal,
      userStatus,
      isPremiumUser,
      
      // Sound state
      isPlaying,
      speechSupported,
      
      // Local state
      isResizing,
      leftPanelWidth,
      rightPanelWidth,
      showTooltip,
      confettiCanvas,
      notifications,
      showProblemReportModal,
      problemType,
      problemDescription,

      // Computed properties
      showContentPanel,
      showInteractivePanel,
      isVerticalLayout,
      leftPanelStyle,
      rightPanelStyle,
      resizeAriaLabel,
      tooltipText,

      // Core methods
      loadLesson,
      saveProgress,
      startLesson,
      continuePreviousProgress,
      goNext,
      goPrevious,
      completeLesson,
      retryLoad,
      confirmExit,
      cancelExit,
      exitLesson,
      getStepIcon,
      getStepTypeText,
      getMedalIcon,
      formatContent,
      getLocalized,
      initializeLesson,
      cleanup,

      // Exercise methods
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      isLastExercise,
      isLastQuiz,
      goToNextExercise,
      goToNextQuiz,
      initializeCurrentExerciseData,
      canSubmitAnswer,
      resetExerciseState,
      resetExerciseAnswers,
      updateFillBlankAnswer,
      getCurrentExerciseType,
      getFormattedFillBlankTemplate,
      validateCurrentAnswer,
      validateQuizAnswer,
      getCorrectAnswerDisplay,
      getRandomSuccessMessage,

      // Vocabulary methods
      initializeVocabularyModal,
      showVocabDefinition,
      hideVocabDefinition,
      markWordAsLearned,
      nextVocabWord,
      previousVocabWord,
      jumpToVocabWord,
      skipVocabularyModal,
      restartVocabulary,
      extractWordProperty,

      // AI methods (wrapped to avoid conflicts)
      handleAIMessage,
      handleFloatingAIMessage,
      handleClearAIChat,
      
      // AI methods from composable (aliased)
      sendAIMessage,
      sendFloatingAIMessage,
      askAI,
      generateAISuggestions,
      toggleFloatingAI,
      closeFloatingAI,

      // Payment methods
      validateLessonAccess,
      closePaywallModal,

      // Sound methods
      initializeSpeech,
      pronounceWord,

      // Split screen methods
      startResize,
      handleResize,
      stopResize,
      handleKeyboardResize,
      resetToDefault,
      saveLayoutPreferences,
      loadLayoutPreferences,

      // Event handlers
      handleReturnToCatalogue,
      handleGoToHomework,
      handleSubmit,
      openProblemReportModal,
      closeProblemReportModal,
      submitProblemReport,
      closeNotification,
      addNotification,
      launchConfetti
    }
  }
}
</script>

<style scoped>
/* ==========================================
   BASE STYLES
   ========================================== */
.lesson-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ==========================================
   LOADING SCREEN
   ========================================== */
.loading-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ==========================================
   ERROR SCREEN
   ========================================== */
.error-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 500px;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #f87171;
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.1);
}

.error-content h2 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.error-content p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* ==========================================
   MODALS
   ========================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.paywall-modal,
.exit-modal,
.problem-report-modal,
.vocabulary-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.vocabulary-modal {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

/* ==========================================
   VOCABULARY MODAL SPECIFIC
   ========================================== */
.vocab-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.vocab-progress {
  margin-top: 1rem;
}

.vocab-progress span {
  display: block;
  margin-bottom: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.vocab-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  margin: 1.5rem 0;
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.3s ease;
}

.vocab-card.flipping {
  transform: rotateY(180deg);
}

.card-front h3,
.card-back h3 {
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 1rem;
}

.pronunciation {
  color: #6b7280;
  font-style: italic;
  margin-bottom: 1rem;
}

.definition {
  color: #374151;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.example {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.vocab-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.vocab-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

/* ==========================================
   LESSON INTRO
   ========================================== */
.lesson-intro {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.intro-content {
  text-align: center;
  max-width: 600px;
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.intro-content h1 {
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 1rem;
}

.lesson-description {
  color: #6b7280;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.lesson-stats {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.intro-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.continue-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.report-problem-btn {
  margin-top: 2rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
}

.report-problem-btn:hover {
  color: #374151;
}

/* ==========================================
   LESSON CONTAINER
   ========================================== */
.lesson-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ==========================================
   LESSON HEADER
   ========================================== */
.lesson-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-content h2 {
  font-size: 1.25rem;
  color: #1f2937;
  margin: 0;
}

.lesson-info {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* ==========================================
   PROGRESS CONTAINER
   ========================================== */
.progress-container {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-container .progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
}

/* ==========================================
   SPLIT SCREEN LAYOUT
   ========================================== */
.split-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.split-content.vertical-split {
  flex-direction: column;
}

.split-content.horizontal-split {
  flex-direction: row;
}

.split-content.left-only .panel,
.split-content.right-only .panel {
  flex: 1;
}

/* ==========================================
   PANELS
   ========================================== */
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.left-panel {
  border-right: none;
}

.right-panel {
  border-left: none;
}

.split-content.vertical-split .left-panel {
  border-right: 1px solid #e2e8f0;
  border-bottom: none;
}

.split-content.vertical-split .right-panel {
  border-left: 1px solid #e2e8f0;
  border-top: none;
}

.right-panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.interactive-section {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
}

.ai-help-section {
  flex-shrink: 0;
  border-top: 1px solid #e2e8f0;
  background: #f9fafb;
}

/* ==========================================
   CONTENT PANEL
   ========================================== */
.content-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.step-content {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
}

.explanation-content,
.example-content,
.reading-content,
.vocabulary-content,
.default-content {
  max-width: none;
}

.explanation-content h3,
.example-content h3,
.reading-content h3,
.vocabulary-content h3,
.default-content h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.content-body {
  color: #374151;
  line-height: 1.6;
  font-size: 1rem;
}

.content-body h1,
.content-body h2,
.content-body h3,
.content-body h4,
.content-body h5,
.content-body h6 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.content-body p {
  margin-bottom: 1rem;
}

.content-body ul,
.content-body ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.content-body li {
  margin-bottom: 0.5rem;
}

.content-body blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1.5rem 0;
  color: #6b7280;
  font-style: italic;
}

.content-body code {
  background: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
}

.content-body pre {
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.content-navigation {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

/* ==========================================
   INTERACTIVE PANEL
   ========================================== */
.interactive-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.exercise-container,
.quiz-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exercise-container h4,
.quiz-container h4 {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
}

.exercise-content,
.quiz-content {
  flex: 1;
}

.exercise-content h5,
.quiz-content h5 {
  font-size: 1.25rem;
  color: #1f2937;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.exercise-input,
.exercise-options,
.quiz-options {
  margin-bottom: 1.5rem;
}

.exercise-options .option,
.quiz-options .option {
  margin-bottom: 0.75rem;
}

.exercise-options label,
.quiz-options label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.exercise-options label:hover,
.quiz-options label:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.exercise-options input[type="radio"]:checked + span,
.quiz-options input[type="radio"]:checked + span {
  border-color: #3b82f6;
  background: #eff6ff;
}

.fill-blank-exercise {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.template-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #374151;
}

.blank-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.blank-input {
  max-width: 200px;
}

.exercise-feedback,
.quiz-feedback {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-weight: 500;
}

.exercise-feedback.correct,
.quiz-feedback.correct {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.exercise-feedback.incorrect,
.quiz-feedback.incorrect {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.exercise-navigation,
.quiz-navigation {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

/* ==========================================
   AI HELP PANEL
   ========================================== */
.ai-help-panel {
  padding: 1rem;
}

.ai-help-panel h4 {
  font-size: 1rem;
  color: #374151;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quick-suggestions {
  margin-bottom: 1rem;
}

.quick-suggestions h5 {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.suggestion-btn {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
  color: #374151;
  cursor: pointer;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.suggestion-btn:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.chat-input input {
  flex: 1;
  font-size: 0.875rem;
}

.chat-input button {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

.usage-info {
  text-align: center;
  color: #9ca3af;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.ai-loading .loading-spinner {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

/* ==========================================
   RESIZE HANDLE
   ========================================== */
.resize-handle {
  position: relative;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  transition: all 0.2s ease;
  z-index: 10;
}

.resize-handle.vertical-handle {
  width: 8px;
  cursor: col-resize;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
}

.resize-handle.horizontal-handle {
  height: 8px;
  cursor: row-resize;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.resize-handle:hover,
.resize-handle.resizing {
  background: #e0e7ff;
  border-color: #6366f1;
}

.resize-handle:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

.resize-indicator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-grip {
  display: flex;
  gap: 2px;
}

.resize-handle.vertical-handle .resize-grip {
  flex-direction: column;
}

.resize-handle.horizontal-handle .resize-grip {
  flex-direction: row;
}

.grip-dot {
  width: 3px;
  height: 3px;
  background: #64748b;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.resize-handle:hover .grip-dot,
.resize-handle.resizing .grip-dot {
  background: #6366f1;
}

.resize-tooltip {
  position: absolute;
  background: #1e293b;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.resize-handle.vertical-handle .resize-tooltip {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
}

.resize-handle.horizontal-handle .resize-tooltip {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.tooltip-text {
  display: block;
  font-weight: 600;
}

.tooltip-hint {
  display: block;
  opacity: 0.8;
  margin-top: 2px;
}

/* ==========================================
   COMPLETION SCREEN
   ========================================== */
.completion-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.completion-content {
  text-align: center;
  max-width: 600px;
}

.completion-content h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.completion-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.completion-stats .stat {
  text-align: center;
}

.completion-stats .stat-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.completion-stats .stat-value {
  font-size: 2rem;
  font-weight: bold;
  display: block;
  margin-bottom: 0.25rem;
}

.completion-stats .stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.medal-section {
  margin-bottom: 2rem;
}

.medal {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.medal-text {
  font-size: 1.25rem;
  font-weight: 600;
}

.completion-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ==========================================
   FLOATING AI BUTTON
   ========================================== */
.floating-ai-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
}

.floating-ai-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
}

.floating-ai-btn.active {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

/* ==========================================
   FLOATING AI MODAL
   ========================================== */
.floating-ai-modal {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 350px;
  max-height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.floating-ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.floating-ai-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #374151;
}

.floating-ai-body {
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

/* ==========================================
   NOTIFICATION SYSTEM
   ========================================== */
.notification-system {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
}

.notification {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: notificationSlideIn 0.3s ease-out;
}

@keyframes notificationSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.notification.success {
  border-left: 4px solid #10b981;
}

.notification.error {
  border-left: 4px solid #ef4444;
}

.notification.warning {
  border-left: 4px solid #f59e0b;
}

.notification.info {
  border-left: 4px solid #3b82f6;
}

.notification-message {
  flex: 1;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.notification-close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* ==========================================
   CONFETTI CANVAS
   ========================================== */
.confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

/* ==========================================
   FORM CONTROLS
   ========================================== */
.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

select.form-control {
  cursor: pointer;
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

/* ==========================================
   BUTTONS
   ========================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border-color: #6b7280;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  border-color: #4b5563;
  transform: translateY(-1px);
}

.btn-success {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  font-size: 1rem;
}

/* ==========================================
   RESPONSIVE DESIGN
   ========================================== */
@media (max-width: 1024px) {
  .split-content {
    flex-direction: column;
  }
  
  .resize-handle.vertical-handle {
    width: 100%;
    height: 8px;
    cursor: row-resize;
  }
  
  .resize-handle.horizontal-handle {
    width: 100%;
    height: 8px;
    cursor: row-resize;
  }
  
  .left-panel,
  .right-panel {
    border: 1px solid #e2e8f0;
  }
  
  .left-panel {
    border-bottom: none;
  }
  
  .right-panel {
    border-top: none;
  }
  
  .ai-help-section {
    max-height: 200px;
  }
  
  .floating-ai-modal {
    right: 16px;
    left: 16px;
    width: auto;
    bottom: 90px;
  }
}

@media (max-width: 768px) {
  .lesson-page {
    height: 100dvh;
  }
  
  .lesson-header {
    padding: 0.75rem 1rem;
  }
  
  .lesson-header h2 {
    font-size: 1.1rem;
  }
  
  .lesson-info {
    gap: 1rem;
    font-size: 0.8rem;
  }
  
  .progress-container {
    padding: 0.75rem 1rem;
  }
  
  .step-content,
  .interactive-section {
    padding: 1rem;
  }
  
  .content-navigation {
    padding: 1rem;
    flex-direction: column;
  }
  
  .floating-ai-btn {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
    bottom: 16px;
    right: 16px;
  }
  
  .notification-system {
    top: 60px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
  
  .notification {
    padding: 12px;
  }
  
  .notification-message {
    font-size: 0.85rem;
  }
  
  .completion-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .completion-actions {
    flex-direction: column;
  }
  
  .intro-content {
    padding: 2rem;
  }
  
  .lesson-stats {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .resize-handle {
    height: 12px;
  }
  
  .grip-dot {
    width: 4px;
    height: 4px;
  }
  
  .ai-help-section {
    max-height: 150px;
  }
  
  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8rem;
  }
  
  .btn-large {
    padding: 0.875rem 1.75rem;
    font-size: 0.9rem;
  }
  
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .vocabulary-modal,
  .paywall-modal,
  .exit-modal,
  .problem-report-modal {
    padding: 1.5rem;
  }
  
  .vocab-card {
    padding: 1.5rem;
    min-height: 150px;
  }
  
  .completion-content h1 {
    font-size: 2rem;
  }
  
  .completion-stats .stat-icon {
    font-size: 1.5rem;
  }
  
  .completion-stats .stat-value {
    font-size: 1.5rem;
  }
  
  .medal {
    font-size: 3rem;
  }
}

/* ==========================================
   ACCESSIBILITY
   ========================================== */
@media (prefers-reduced-motion: reduce) {
  .resize-handle,
  .floating-ai-btn,
  .notification,
  .btn,
  .vocab-card {
    transition: none;
  }
  
  .floating-ai-btn:hover {
    transform: none;
  }
  
  .notification {
    animation: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

@media (prefers-contrast: high) {
  .panel,
  .resize-handle,
  .notification,
  .form-control {
    border-width: 2px;
  }
  
  .grip-dot {
    background: #000;
  }
  
  .btn {
    border-width: 3px;
  }
}

/* ==========================================
   DARK MODE
   ========================================== */
@media (prefers-color-scheme: dark) {
  .lesson-page {
    background: #0f172a;
    color: #e2e8f0;
  }
  
  .panel,
  .lesson-header,
  .progress-container {
    background: #1e293b;
    border-color: #374151;
    color: #e2e8f0;
  }
  
  .resize-handle {
    background: #374151;
    border-color: #4b5563;
  }
  
  .resize-handle:hover,
  .resize-handle.resizing {
    background: #4338ca;
    border-color: #6366f1;
  }
  
  .grip-dot {
    background: #9ca3af;
  }
  
  .resize-handle:hover .grip-dot,
  .resize-handle.resizing .grip-dot {
    background: #e0e7ff;
  }
  
  .form-control {
    background: #374151;
    border-color: #4b5563;
    color: #e2e8f0;
  }
  
  .form-control:focus {
    border-color: #6366f1;
  }
  
  .notification,
  .vocabulary-modal,
  .paywall-modal,
  .exit-modal,
  .problem-report-modal,
  .floating-ai-modal,
  .intro-content {
    background: #1e293b;
    border-color: #374151;
    color: #e2e8f0;
  }
  
  .notification-message {
    color: #e2e8f0;
  }
  
  .notification-close {
    color: #9ca3af;
  }
  
  .notification-close:hover {
    background: #374151;
    color: #e2e8f0;
  }
  
  .ai-help-section,
  .floating-ai-header {
    background: #374151;
  }
  
  .suggestion-btn {
    background: #374151;
    border-color: #4b5563;
    color: #e2e8f0;
  }
  
  .suggestion-btn:hover {
    background: #6366f1;
    border-color: #6366f1;
  }
  
  .vocab-card {
    background: #374151;
    border-color: #4b5563;
  }
  
  .exercise-feedback.correct,
  .quiz-feedback.correct {
    background: #064e3b;
    color: #a7f3d0;
    border-color: #059669;
  }
  
  .exercise-feedback.incorrect,
  .quiz-feedback.incorrect {
    background: #7f1d1d;
    color: #fca5a5;
    border-color: #dc2626;
  }
  
  .progress-bar {
    background: #374151;
  }
  
  .content-body {
    color: #d1d5db;
  }
  
  .content-body h1,
  .content-body h2,
  .content-body h3,
  .content-body h4,
  .content-body h5,
  .content-body h6 {
    color: #f9fafb;
  }
  
  .content-body blockquote {
    border-left-color: #6366f1;
    color: #9ca3af;
  }
  
  .content-body code {
    background: #374151;
    color: #e5e7eb;
  }
  
  .error-content {
    background: #1e293b;
    color: #e2e8f0;
  }
  
  .loading-screen {
    color: #9ca3af;
  }
}

/* ==========================================
   PRINT STYLES
   ========================================== */
@media print {
  .lesson-page {
    height: auto;
    overflow: visible;
    background: white;
  }
  
  .floating-ai-btn,
  .notification-system,
  .resize-handle,
  .header-actions,
  .ai-help-section {
    display: none;
  }
  
  .split-content {
    flex-direction: column;
    overflow: visible;
  }
  
  .panel {
    border: 1px solid #000;
    page-break-inside: avoid;
    overflow: visible;
  }
  
  .lesson-header,
  .progress-container {
    border-bottom: 2px solid #000;
  }
  
  .content-navigation {
    border-top: 1px solid #000;
  }
  
  .btn {
    border: 1px solid #000;
  }
  
  .completion-screen {
    background: white;
    color: black;
  }
  
  .completion-stats {
    background: #f9fafb;
  }
}

/* ==========================================
   HIGH CONTRAST MODE
   ========================================== */
@media (prefers-contrast: high) {
  .lesson-page {
    background: white;
    color: black;
  }
  
  .panel,
  .lesson-header,
  .progress-container {
    background: white;
    border: 2px solid black;
    color: black;
  }
  
  .resize-handle {
    background: black;
    border: 2px solid black;
  }
  
  .grip-dot {
    background: white;
  }
  
  .btn-primary {
    background: black;
    color: white;
    border: 2px solid black;
  }
  
  .btn-secondary {
    background: white;
    color: black;
    border: 2px solid black;
  }
  
  .form-control {
    background: white;
    color: black;
    border: 2px solid black;
  }
  
  .notification {
    background: white;
    color: black;
    border: 2px solid black;
  }
  
  .progress-fill {
    background: black;
  }
}

/* ==========================================
   FOCUS MANAGEMENT
   ========================================== */
.btn:focus,
.form-control:focus,
.resize-handle:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

.notification:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 1px;
}

/* Skip to content link for screen readers */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #3b82f6;
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 10000;
}

.skip-link:focus {
  top: 6px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ==========================================
   LOADING STATES
   ========================================== */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-overlay .loading-spinner {
  width: 32px;
  height: 32px;
}

/* ==========================================
   SMOOTH ANIMATIONS
   ========================================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* ==========================================
   UTILITY CLASSES
   ========================================== */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 0.875rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-lg {
  font-size: 1.125rem;
}

.text-xl {
  font-size: 1.25rem;
}

.text-2xl {
  font-size: 1.5rem;
}

.mb-0 {
  margin-bottom: 0;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-0 {
  margin-top: 0;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.p-0 {
  padding: 0;
}

.p-1 {
  padding: 0.25rem;
}

.p-2 {
  padding: 0.5rem;
}

.p-3 {
  padding: 0.75rem;
}

.p-4 {
  padding: 1rem;
}

.hidden {
  display: none;
}

.block {
  display: block;
}

.inline-block {
  display: inline-block;
}

.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}

.grid {
  display: grid;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.fixed {
  position: fixed;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-auto {
  overflow: auto;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-not-allowed {
  cursor: not-allowed;
}

.select-none {
  user-select: none;
}

.pointer-events-none {
  pointer-events: none;
}

/* ==========================================
   CUSTOM SCROLLBARS
   ========================================== */
.step-content::-webkit-scrollbar,
.interactive-section::-webkit-scrollbar,
.ai-help-section::-webkit-scrollbar,
.floating-ai-body::-webkit-scrollbar {
  width: 8px;
}

.step-content::-webkit-scrollbar-track,
.interactive-section::-webkit-scrollbar-track,
.ai-help-section::-webkit-scrollbar-track,
.floating-ai-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.step-content::-webkit-scrollbar-thumb,
.interactive-section::-webkit-scrollbar-thumb,
.ai-help-section::-webkit-scrollbar-thumb,
.floating-ai-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.step-content::-webkit-scrollbar-thumb:hover,
.interactive-section::-webkit-scrollbar-thumb:hover,
.ai-help-section::-webkit-scrollbar-thumb:hover,
.floating-ai-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Dark mode scrollbars */
@media (prefers-color-scheme: dark) {
  .step-content::-webkit-scrollbar-track,
  .interactive-section::-webkit-scrollbar-track,
  .ai-help-section::-webkit-scrollbar-track,
  .floating-ai-body::-webkit-scrollbar-track {
    background: #374151;
  }
  
  .step-content::-webkit-scrollbar-thumb,
  .interactive-section::-webkit-scrollbar-thumb,
  .ai-help-section::-webkit-scrollbar-thumb,
  .floating-ai-body::-webkit-scrollbar-thumb {
    background: #6b7280;
  }
  
  .step-content::-webkit-scrollbar-thumb:hover,
  .interactive-section::-webkit-scrollbar-thumb:hover,
  .ai-help-section::-webkit-scrollbar-thumb:hover,
  .floating-ai-body::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
}

/* ==========================================
   PERFORMANCE OPTIMIZATIONS
   ========================================== */
.panel,
.resize-handle,
.floating-ai-btn,
.notification {
  contain: layout style paint;
}

.confetti-canvas {
  will-change: transform;
}

.vocab-card.flipping {
  will-change: transform;
}

.loading-spinner {
  will-change: transform;
}

/* ==========================================
   BROWSER SPECIFIC FIXES
   ========================================== */
/* Safari iOS - Fix 100vh on mobile */
@supports (-webkit-touch-callout: none) {
  .lesson-page {
    height: -webkit-fill-available;
  }
}

/* Firefox - Fix button focus outline */
@-moz-document url-prefix() {
  .btn::-moz-focus-inner {
    border: 0;
  }
}

/* Edge - Fix flexbox issues */
@supports (-ms-ime-align: auto) {
  .split-content {
    display: -ms-flexbox;
    -ms-flex-direction: row;
  }
  
  .panel {
    -ms-flex: 1;
  }
}

/* ==========================================
   COMPONENT SPECIFIC ANIMATIONS
   ========================================== */
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromBottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-10px);
  }
  70% {
    transform: translateY(-5px);
  }
  90% {
    transform: translateY(-2px);
  }
}

/* Apply animations */
.lesson-intro {
  animation: fadeIn 0.5s ease-out;
}

.completion-screen {
  animation: slideInFromBottom 0.5s ease-out;
}

.floating-ai-modal {
  animation: slideInFromRight 0.3s ease-out;
}

.vocabulary-modal {
  animation: fadeIn 0.3s ease-out;
}

.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

/* Disable animations for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .lesson-intro,
  .completion-screen,
  .floating-ai-modal,
  .vocabulary-modal,
  .modal-overlay {
    animation: none;
  }
}
</style>