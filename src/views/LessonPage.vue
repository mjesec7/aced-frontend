<template>
  <div class="lesson-page">
    <!-- Loading Screen -->
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

    <!-- Error Screen -->
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

    <!-- Debug Info (Development Only) -->
    <div v-if="isDevelopment && !loading && !error" class="debug-panel">
      <details>
        <summary>🐛 Debug Info</summary>
        <div class="debug-content">
          <h4>Lesson Data:</h4>
          <pre>{{ JSON.stringify({ lessonName: lesson.lessonName, stepsCount: steps.length, currentIndex }, null, 2) }}</pre>
          <h4>Current Step:</h4>
          <pre>{{ JSON.stringify(currentStep, null, 2) }}</pre>
        </div>
      </details>
    </div>

    <!-- Modals -->
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

    <!-- Vocabulary Modal -->
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

    <!-- Lesson Intro -->
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

    <!-- Main Lesson Content -->
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      <!-- Lesson Header -->
      <LessonHeader
        :lesson="lesson"
        :current-step="currentIndex + 1"
        :total-steps="steps.length"
        :formatted-time="formattedTime"
        :stars="stars"
        @exit="confirmExit"
        @report-problem="openProblemReportModal"
      />

      <!-- Progress Bar -->
      <ProgressBar
        :progress-percentage="progressPercentage"
        :stars="stars"
        :current-step="currentIndex"
        :total-steps="steps.length"
      />

      <!-- Split Screen Container -->
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
          <!-- Content Panel (Left/Top) -->
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

          <!-- Interactive Panel (Right/Bottom) -->
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

    <!-- Completion Screen -->
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

    <!-- Floating AI Button -->
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

    <!-- Notifications -->
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

    <!-- Confetti Canvas -->
    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

// Import the fixed composables
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
    // COMPOSABLES
    // ==========================================
    const orchestrator = useLessonOrchestrator()
    const exercises = useExercises()
    const vocabulary = useVocabulary()
    const explanation = useExplanation()
    const payment = usePaymentValidation()
    const sound = useSound()

    // ==========================================
    // LOCAL STATE
    // ==========================================
    const isResizing = ref(false)
    const leftPanelWidth = ref(50)
    const showTooltip = ref(false)
    const resizeStartInfo = ref(null)
    const confettiCanvas = ref(null)
    const notifications = ref([])
    const showProblemReportModal = ref(false)
    const problemType = ref('content')
    const problemDescription = ref('')

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================
    const isDevelopment = computed(() => {
      return process.env.NODE_ENV === 'development'
    })

    const showContentPanel = computed(() => {
      if (!orchestrator.currentStep.value) return false
      
      const contentTypes = ['explanation', 'example', 'reading', 'vocabulary']
      return contentTypes.includes(orchestrator.currentStep.value.type) || 
             (orchestrator.currentStep.value.data && orchestrator.currentStep.value.data.content)
    })

    const showInteractivePanel = computed(() => {
      if (!orchestrator.currentStep.value) return false
      
      const interactiveTypes = ['exercise', 'practice', 'quiz']
      return interactiveTypes.includes(orchestrator.currentStep.value.type)
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
      currentStep: orchestrator.currentIndex.value,
      totalSteps: orchestrator.steps.value.length,
      completedSteps: Array.from({ length: orchestrator.currentIndex.value }, (_, i) => i),
      stars: orchestrator.stars.value,
      mistakes: orchestrator.mistakeCount.value,
      points: orchestrator.earnedPoints.value,
      accuracy: Math.max(0, 100 - orchestrator.mistakeCount.value * 10),
      timeSpent: orchestrator.elapsedSeconds.value
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
      orchestrator.saveProgress()
      router.push('/profile/catalogue')
    }

    const handleGoToHomework = () => {
      const lessonId = orchestrator.lesson.value?._id
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
      if (orchestrator.currentStep.value.type === 'exercise' || orchestrator.currentStep.value.type === 'practice') {
        const exercise = exercises.getCurrentExercise(orchestrator.currentStep.value)
        if (exercise) {
          isCorrect = exercises.validateCurrentAnswer(exercise)
          feedbackMessage = isCorrect ? 
            exercises.getRandomSuccessMessage() : 
            `Incorrect. The correct answer is: ${exercises.getCorrectAnswerDisplay(exercise)}`
        }
      } else if (orchestrator.currentStep.value.type === 'quiz') {
        const quiz = exercises.getCurrentQuiz(orchestrator.currentStep.value)
        if (quiz) {
          isCorrect = exercises.validateQuizAnswer(quiz)
          feedbackMessage = isCorrect ? 
            '✅ Correct!' : 
            `❌ Incorrect. The correct answer is: ${exercises.getCorrectAnswerDisplay(quiz)}`
        }
      }
      
      // Update state
      exercises.answerWasCorrect.value = isCorrect
      exercises.confirmation.value = feedbackMessage
      
      // Update progress
      if (isCorrect) {
        orchestrator.stars.value++
        orchestrator.earnedPoints.value += 10
        addNotification('Great job! ⭐ +1 star earned', 'success')
      } else {
        orchestrator.mistakeCount.value++
        orchestrator.mistakeLog.value.push({
          step: orchestrator.currentIndex.value,
          question: exercises.getCurrentExercise(orchestrator.currentStep.value)?.question || exercises.getCurrentQuiz(orchestrator.currentStep.value)?.question || '',
          userAnswer: answer,
          correctAnswer: exercises.getCorrectAnswerDisplay(exercises.getCurrentExercise(orchestrator.currentStep.value) || exercises.getCurrentQuiz(orchestrator.currentStep.value)),
          timestamp: new Date().toISOString()
        })
      }
      
      // Auto-advance after a delay if correct
      if (isCorrect) {
        setTimeout(() => {
          if (orchestrator.currentStep.value.type === 'exercise' || orchestrator.currentStep.value.type === 'practice') {
            if (!exercises.isLastExercise(orchestrator.currentStep.value)) {
              exercises.goToNextExercise(orchestrator.currentStep.value, orchestrator.goNext)
            } else {
              orchestrator.goNext()
            }
          } else if (orchestrator.currentStep.value.type === 'quiz') {
            if (!exercises.isLastQuiz(orchestrator.currentStep.value)) {
              exercises.goToNextQuiz(orchestrator.currentStep.value, orchestrator.goNext)
            } else {
              orchestrator.goNext()
            }
          }
        }, 2000)
      }
    }

    // ==========================================
    // AI METHODS WRAPPER
    // ==========================================
    const handleAIMessage = (message) => {
      if (typeof explanation.sendAIMessage === 'function') {
        explanation.sendAIMessage(orchestrator.lesson.value, userProgress.value, orchestrator.currentStep.value)
      } else {
        console.warn('AI service not available')
      }
    }

    const handleFloatingAIMessage = (message) => {
      if (typeof explanation.sendFloatingAIMessage === 'function') {
        explanation.sendFloatingAIMessage(orchestrator.lesson.value, userProgress.value, orchestrator.currentStep.value)
      } else {
        console.warn('AI service not available')
      }
    }

    const handleClearAIChat = () => {
      if (typeof explanation.clearAIChat === 'function') {
        explanation.clearAIChat()
      } else {
        explanation.aiChatHistory.value = []
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
        lessonId: orchestrator.lesson.value?._id,
        currentStep: orchestrator.currentIndex.value + 1,
        totalSteps: orchestrator.steps.value?.length || 0
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
      if (orchestrator.currentStep.value?.data?.content) {
        sound.pronounceWord(orchestrator.currentStep.value.data.content.replace(/<[^>]*>/g, ''))
      }
    }

    const shareResult = () => {
      const shareData = {
        title: `I completed "${orchestrator.getLocalized(orchestrator.lesson.value.lessonName)}"!`,
        text: `Just finished this lesson with ${orchestrator.stars.value} stars and ${orchestrator.earnedPoints.value} points!`,
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
      sound.initializeSpeech()
      loadLayoutPreferences()
      
      // Initialize lesson (this is done by the orchestrator)
      // await orchestrator.initializeLesson() - this is called internally
      
      // Set up window resize listener
      window.addEventListener('resize', () => {
        nextTick(() => {
          // Force re-evaluation of computed properties
        })
      })
      
      // Launch confetti if lesson completed
      if (orchestrator.lessonCompleted.value) {
        setTimeout(launchConfetti, 500)
      }
    })

    onUnmounted(() => {
      console.log('🧹 LessonPage unmounting')
      
      if (isResizing.value) {
        stopResize()
      }
      
      orchestrator.cleanup()
    })

    // ==========================================
    // RETURN - All state and methods for template
    // ==========================================
    return {
      // Expose orchestrator state
      ...orchestrator,
      
      // Expose exercise state
      ...exercises,
      
      // Expose vocabulary state  
      ...vocabulary,
      
      // Expose explanation/AI state
      ...explanation,
      
      // Expose payment state
      ...payment,
      
      // Expose sound state
      ...sound,
      
      // Local state
      isDevelopment,
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
      userProgress,

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
      handleAIMessage,
      handleFloatingAIMessage,
      handleClearAIChat,
      openProblemReportModal,
      closeProblemReportModal,
      submitProblemReport,
      closeNotification,
      addNotification,
      launchConfetti,
      shareResult,
      pronounceContent
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";

/* Additional styles for debug panel */
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  max-width: 400px;
  z-index: 1000;
}

.debug-panel details {
  cursor: pointer;
}

.debug-panel summary {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.debug-content {
  max-height: 300px;
  overflow-y: auto;
}

.debug-content h4 {
  margin: 0.5rem 0 0.25rem 0;
  color: #fbbf24;
}

.debug-content pre {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}
</style>