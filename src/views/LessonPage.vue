<template>
  <div class="lesson-page">
    <div v-if="loading" class="loading-screen">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <h3>Loading lesson...</h3>
        <p>Preparing your learning experience</p>
      </div>
    </div>

    <div v-else-if="error" class="error-screen">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button @click="retryLoad" class="btn btn-primary">
            <span class="btn-icon">🔄</span>
            Try Again
          </button>
          <button @click="handleReturnToCatalogue" class="btn btn-secondary">
            <span class="btn-icon">🏠</span>
            Back to Catalogue
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPaywallModal" class="modal-overlay">
      <div class="paywall-modal">
        <div class="modal-header">
          <h2>🔒 Premium Content</h2>
          <button @click="closePaywallModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="premium-features">
            <div class="feature">
              <span class="feature-icon">⭐</span>
              <span>Advanced exercises</span>
            </div>
            <div class="feature">
              <span class="feature-icon">🎯</span>
              <span>Personalized learning</span>
            </div>
            <div class="feature">
              <span class="feature-icon">📊</span>
              <span>Detailed progress tracking</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="$router.push('/pay/start')" class="btn btn-premium">
            <span class="btn-icon">🚀</span>
            Upgrade Now
          </button>
          <button @click="handleReturnToCatalogue" class="btn btn-ghost">
            Maybe Later
          </button>
        </div>
      </div>
    </div>

    <div v-if="showExitModal" class="modal-overlay">
      <div class="exit-modal">
        <div class="modal-header">
          <h2>👋 Leaving so soon?</h2>
        </div>
        <div class="modal-body">
          <p>Your progress will be saved automatically.</p>
          <div class="progress-preview">
            <div class="progress-stats">
              <div class="stat">
                <span class="stat-value">{{ progressPercentage }}%</span>
                <span class="stat-label">Completed</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ stars }}</span>
                <span class="stat-label">Stars</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="exitLesson" class="btn btn-primary">
            <span class="btn-icon">🚪</span>
            Yes, Exit
          </button>
          <button @click="cancelExit" class="btn btn-secondary">
            <span class="btn-icon">📚</span>
            Continue Learning
          </button>
        </div>
      </div>
    </div>

    <VocabularyModal
      v-if="vocabularyModal.isVisible"
      :vocabulary-data="vocabularyModal"
      :card-animation="cardAnimation"
      :current-vocab-word="currentVocabWord"
      :vocab-progress="vocabProgress"
      :is-last-vocab-word="isLastVocabWord"
      @close="skipVocabularyModal"
      @skip="skipVocabularyModal"
      @show-definition="showVocabDefinition"
      @hide-definition="hideVocabDefinition"
      @mark-learned="markWordAsLearned"
      @next-word="nextVocabWord"
      @previous-word="previousVocabWord"
      @pronounce="pronounceWord"
    />

    <LessonIntro
      v-if="!started && !showPaywallModal && !loading && !error"
      :lesson="lesson"
      :steps="steps"
      :estimated-time="estimatedTime"
      :previous-progress="previousProgress"
      @start="startLesson"
      @continue="continuePreviousProgress"
      @exit="confirmExit"
      @report-problem="openProblemReportModal"
    />

    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      <LessonHeader
        :lesson="lesson"
        :current-step="currentIndex + 1"
        :total-steps="steps.length"
        :formatted-time="formattedTime"
        :stars="stars"
        @exit="confirmExit"
        @report-problem="openProblemReportModal"
      />

      <ProgressBar
        :progress-percentage="progressPercentage"
        :stars="stars"
        :current-step="currentIndex"
        :total-steps="steps.length"
      />

      <div class="split-container">
        <div 
          class="split-content"
          :class="{
            'both-panels': showContentPanel && showInteractivePanel,
            'content-only': showContentPanel && !showInteractivePanel,
            'interactive-only': !showContentPanel && showInteractivePanel,
            'vertical-layout': isVerticalLayout
          }"
        >
          <ContentPanel
            v-if="showContentPanel"
            :current-step="currentStep"
            :current-index="currentIndex"
            :total-steps="steps.length"
            :is-last-step="isLastStep"
            :style="contentPanelStyle"
            @previous="goPrevious"
            @next="goNext"
            @complete="goNext"
            @pronounce="pronounceContent"
            @init-vocabulary="initializeVocabularyModal"
          />

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
          >
            <div class="resize-grip">
              <div class="grip-dots">
                <span class="grip-dot"></span>
                <span class="grip-dot"></span>
                <span class="grip-dot"></span>
              </div>
              <div v-if="showTooltip" class="resize-tooltip">
                {{ tooltipText }}
              </div>
            </div>
          </div>

          <InteractivePanel
            v-if="showInteractivePanel"
            :current-exercise="getCurrentExercise(currentStep)"
            :exercise-index="currentExerciseIndex"
            :total-exercises="getTotalExercises(currentStep)"
            :earned-points="earnedPoints"
            :style="interactivePanelStyle"
            @submit="handleSubmit"
            @next-exercise="goToNextExercise"
            @show-hint="() => {}"
          />
        </div>
      </div>
    </div>

    <CompletionScreen
      v-if="lessonCompleted"
      :readable-time="readableTime"
      :stars="stars"
      :mistake-count="mistakeCount"
      :earned-points="earnedPoints"
      :medal-label="medalLabel"
      :medal-icon="getMedalIcon()"
      @return-to-catalogue="handleReturnToCatalogue"
      @go-to-homework="handleGoToHomework"
      @share-result="shareResult"
    />

    <button
      v-if="started && !lessonCompleted"
      class="floating-ai-btn"
      @click="toggleFloatingAI"
      :class="{ active: showFloatingAI }"
      title="AI Assistant"
    >
      <div class="ai-pulse"></div>
      <span class="ai-emoji">🤖</span>
    </button>

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

    <div v-if="notifications.length" class="notification-system">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification"
        :class="notification.type"
        @click="closeNotification(notification.id)"
      >
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'error'">❌</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="notification-content">
          <span class="notification-message">{{ notification.message }}</span>
        </div>
        <button class="notification-close">✕</button>
      </div>
    </div>

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

// Import components
import VocabularyModal from '@/components/lesson/VocabularyModal.vue'
import LessonIntro from '@/components/lesson/LessonIntro.vue'
import LessonHeader from '@/components/lesson/LessonHeader.vue'
import ProgressBar from '@/components/lesson/ProgressBar.vue'
import ContentPanel from '@/components/lesson/ContentPanel.vue'
import InteractivePanel from '@/components/lesson/InteractivePanel.vue'
import CompletionScreen from '@/components/lesson/CompletionScreen.vue'
import FloatingAIAssistant from '@/components/lesson/FloatingAIAssistant.vue'

export default {
  name: 'LessonPage',

  components: {
    VocabularyModal,
    LessonIntro,
    LessonHeader,
    ProgressBar,
    ContentPanel,
    InteractivePanel,
    CompletionScreen,
    FloatingAIAssistant
  },

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

    const contentPanelStyle = computed(() => {
      if (!showInteractivePanel.value) {
        return { flex: '1' }
      }
      
      if (isVerticalLayout.value) {
        return {
          flex: `0 0 ${leftPanelWidth.value}%`,
          minHeight: '300px',
          maxHeight: leftPanelWidth.value >= 75 ? '75%' : 'none'
        }
      }
      
      return {
        flex: `0 0 ${leftPanelWidth.value}%`,
        minWidth: '400px',
        maxWidth: leftPanelWidth.value >= 75 ? '75%' : 'none'
      }
    })

    const interactivePanelStyle = computed(() => {
      if (!showContentPanel.value) {
        return { flex: '1' }
      }
      
      if (isVerticalLayout.value) {
        return {
          flex: `0 0 ${100 - leftPanelWidth.value}%`,
          minHeight: '300px',
          maxHeight: (100 - leftPanelWidth.value) >= 75 ? '75%' : 'none'
        }
      }
      
      return {
        flex: `0 0 ${100 - leftPanelWidth.value}%`,
        minWidth: '400px',
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

    // Create user progress object for AI context
    const userProgress = computed(() => ({
      currentStep: currentIndex.value,
      totalSteps: steps.value.length,
      completedSteps: Array.from({ length: currentIndex.value }, (_, i) => i),
      stars: stars.value,
      mistakes: mistakeCount.value,
      points: earnedPoints.value,
      accuracy: Math.max(0, 100 - mistakeCount.value * 10),
      timeSpent: elapsedSeconds.value
    }))

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
        addNotification('Great job! ⭐ +1 star earned', 'success')
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
    // ADDITIONAL METHODS
    // ==========================================
    const pronounceContent = () => {
      if (currentStep.value?.data?.content) {
        pronounceWord(currentStep.value.data.content.replace(/<[^>]*>/g, ''))
      }
    }

    const shareResult = () => {
      const shareData = {
        title: `I completed "${getLocalized(lesson.value.lessonName)}"!`,
        text: `Just finished this lesson with ${stars.value} stars and ${earnedPoints.value} points!`,
        url: window.location.href
      }
      
      if (navigator.share) {
        navigator.share(shareData)
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.title} ${shareData.text} ${shareData.url}`)
        addNotification('Link copied to clipboard!', 'success')
      }
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
      const colors = ['#8b5cf6', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185']
      
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
      userProgress,
      
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
      contentPanelStyle,
      interactivePanelStyle,
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
      pronounceContent,

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
      launchConfetti,
      shareResult
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";
</style>