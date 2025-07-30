<template>
  <div class="lesson-page">
    <!-- Loading State -->
    <LoadingScreen v-if="loading" />

    <!-- Error State -->
    <ErrorScreen 
      v-else-if="error" 
      :error="error"
      @retry="retryLoad"
      @back="handleReturnToCatalogue"
    />

    <!-- Paywall Modal -->
    <PaywallModal 
      v-if="showPaywallModal"
      @subscribe="$router.push('/pay/start')"
      @back="handleReturnToCatalogue"
    />

    <!-- Exit Confirmation -->
    <ExitModal 
      v-if="showExitModal"
      @confirm="exitLesson"
      @cancel="cancelExit"
    />

    <!-- Problem Report Modal -->
    <ProblemReportModal 
      v-if="showProblemReportModal"
      :lesson="lesson"
      :current-step="currentIndex + 1"
      :total-steps="steps.length"
      @close="closeProblemReportModal"
      @submit="submitProblemReport"
    />

    <!-- Vocabulary Learning Modal -->
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
      @close="confirmExit"
      @pronounce="pronounceWord"
      @jump-to-word="jumpToVocabWord"
    />

    <!-- Intro Screen -->
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
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      <!-- Header -->
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
          <ContentPanel
            :current-step="currentStep"
            :current-index="currentIndex"
            :total-steps="steps.length"
            :is-last-step="isLastStep"
            @next="goNext"
            @previous="goPrevious"
            @init-vocabulary="initializeVocabularyModal"
            @pronounce="pronounceWord"
          />
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
              <InteractivePanel
                :current-step="currentStep"
                :current-exercise="getCurrentExercise()"
                :current-quiz="getCurrentQuiz()"
                :exercise-index="currentExerciseIndex"
                :quiz-index="currentQuizIndex"
                :total-exercises="getTotalExercises()"
                :total-quizzes="getTotalQuizzes()"
                @submit="handleSubmit"
                @next-exercise="goToNextExercise"
                @next-quiz="goToNextQuiz"
              />
            </div>
            
            <!-- AI Help section at bottom -->
            <div class="ai-help-section">
              <AIHelpPanel
                :suggestions="aiSuggestions"
                :chat-history="aiChatHistory"
                :is-loading="aiIsLoading"
                :usage="aiUsage"
                @send-message="sendAIMessage"
                @ask-ai="askAI"
                @clear-chat="clearAIChat"
              />
            </div>
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
      @return-to-catalogue="handleReturnToCatalogue"
      @share="shareResult"
      @homework="handleGoToHomework"
    />

    <!-- Floating AI Assistant Toggle -->
    <button
      v-if="started && !lessonCompleted"
      class="floating-ai-btn"
      @click="toggleFloatingAI"
      :class="{ active: showFloatingAI }"
    >
      🤖
    </button>

    <!-- Floating AI Assistant -->
    <FloatingAIAssistant
      v-if="showFloatingAI && started && !lessonCompleted"
      :usage="aiUsage"
      :suggestions="quickSuggestions"
      :chat-history="aiChatHistory"
      :is-loading="aiIsLoading"
      @close="closeFloatingAI"
      @send-message="sendFloatingAIMessage"
      @ask-ai="askAI"
      @clear-chat="clearAIChat"
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

// Import clean, focused composables
import { useLessonState } from '@/composables/lesson/useLessonState'
import { useLessonNavigation } from '@/composables/lesson/useLessonNavigation'
import { useLessonContent } from '@/composables/lesson/useLessonContent'
import { useLessonExercises } from '@/composables/lesson/useLessonExercises'
import { useLessonVocabulary } from '@/composables/lesson/useLessonVocabulary'
import { useLessonAI } from '@/composables/lesson/useLessonAI'
import { useLessonProgress } from '@/composables/lesson/useLessonProgress'
import { useLessonModals } from '@/composables/lesson/useLessonModals'

// Import components
import LoadingScreen from '@/components/lesson/LoadingScreen.vue'
import ErrorScreen from '@/components/lesson/ErrorScreen.vue'
import PaywallModal from '@/components/lesson/PaywallModal.vue'
import ExitModal from '@/components/lesson/ExitModal.vue'
import ProblemReportModal from '@/components/lesson/ProblemReportModal.vue'
import VocabularyModal from '@/components/lesson/VocabularyModal.vue'
import LessonIntro from '@/components/lesson/LessonIntro.vue'
import LessonHeader from '@/components/lesson/LessonHeader.vue'
import ProgressBar from '@/components/lesson/ProgressBar.vue'
import ContentPanel from '@/components/lesson/ContentPanel.vue'
import InteractivePanel from '@/components/lesson/InteractivePanel.vue'
import AIHelpPanel from '@/components/lesson/AIHelpPanel.vue'
import CompletionScreen from '@/components/lesson/CompletionScreen.vue'
import FloatingAIAssistant from '@/components/lesson/FloatingAIAssistant.vue'

export default {
  name: 'LessonPage',

  components: {
    LoadingScreen,
    ErrorScreen,
    PaywallModal,
    ExitModal,
    ProblemReportModal,
    VocabularyModal,
    LessonIntro,
    LessonHeader,
    ProgressBar,
    ContentPanel,
    InteractivePanel,
    AIHelpPanel,
    CompletionScreen,
    FloatingAIAssistant
  },

  setup() {
    const router = useRouter()

    // ==========================================
    // COMPOSABLES - Each handles a specific domain
    // ==========================================
    const lessonState = useLessonState()
    const lessonNavigation = useLessonNavigation()
    const lessonContent = useLessonContent()
    const lessonExercises = useLessonExercises()
    const lessonVocabulary = useLessonVocabulary()
    const lessonAI = useLessonAI()
    const lessonProgress = useLessonProgress()
    const lessonModals = useLessonModals()

    // ==========================================
    // SPLIT SCREEN STATE
    // ==========================================
    const isResizing = ref(false)
    const leftPanelWidth = ref(50)
    const rightPanelWidth = ref(50)
    const showTooltip = ref(false)
    const resizeStartInfo = ref(null)
    const confettiCanvas = ref(null)
    const showConfetti = ref(false)
    const notifications = ref([])

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================
    const showContentPanel = computed(() => {
      return lessonContent.hasContent(lessonState.currentStep.value)
    })

    const showInteractivePanel = computed(() => {
      return lessonExercises.hasInteractiveContent(lessonState.currentStep.value) ||
             lessonVocabulary.hasVocabularyContent(lessonState.currentStep.value)
    })

    const isLastStep = computed(() => {
      return lessonState.currentIndex.value >= lessonState.steps.value.length - 1
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
          flex: `0 0 ${rightPanelWidth.value}%`,
          minHeight: '200px',
          maxHeight: rightPanelWidth.value >= 75 ? '75%' : 'none'
        }
      }
      
      return {
        flex: `0 0 ${rightPanelWidth.value}%`,
        minWidth: '300px',
        maxWidth: rightPanelWidth.value >= 75 ? '75%' : 'none'
      }
    })

    const resizeAriaLabel = computed(() => {
      const direction = isVerticalLayout.value ? 'vertical' : 'horizontal'
      return `Resize panels ${direction}ly. Current split: ${Math.round(leftPanelWidth.value)}% | ${Math.round(rightPanelWidth.value)}%`
    })

    const tooltipText = computed(() => {
      return `${Math.round(leftPanelWidth.value)}% | ${Math.round(rightPanelWidth.value)}%`
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
        startRightWidth: rightPanelWidth.value,
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
      rightPanelWidth.value = 100 - newLeftWidth
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
      rightPanelWidth.value = 100 - newLeftWidth
      saveLayoutPreferences()
    }

    const resetToDefault = () => {
      leftPanelWidth.value = 50
      rightPanelWidth.value = 50
      
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
          rightWidth: rightPanelWidth.value,
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
          const { leftWidth, rightWidth, timestamp } = JSON.parse(saved)
          
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
          if (timestamp && timestamp > thirtyDaysAgo) {
            leftPanelWidth.value = Math.max(25, Math.min(75, leftWidth || 50))
            rightPanelWidth.value = Math.max(25, Math.min(75, rightWidth || 50))
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
      lessonProgress.saveProgress()
      router.push('/profile/catalogue')
    }

    const handleGoToHomework = () => {
      const lessonId = lessonState.lesson.value?._id
      if (lessonId) {
        router.push(`/lessons/${lessonId}/homework`)
      } else {
        router.push('/profile/homeworks')
      }
    }

    const exitLesson = () => {
      lessonProgress.saveProgress()
      lessonModals.closeExitModal()
      handleReturnToCatalogue()
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    const handleSubmit = (answer) => {
      lessonExercises.submitAnswer(answer)
    }

    const retryLoad = () => {
      lessonState.retryLoad()
    }

    // ==========================================
    // PROBLEM REPORTING
    // ==========================================
    const openProblemReportModal = () => {
      lessonModals.openProblemReport()
    }

    const closeProblemReportModal = () => {
      lessonModals.closeProblemReport()
    }

    const submitProblemReport = (reportData) => {
      lessonModals.submitProblemReport({
        ...reportData,
        lessonId: lessonState.lesson.value?._id,
        currentStep: lessonState.currentIndex.value + 1,
        totalSteps: lessonState.steps.value?.length || 0
      })
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
    // LIFECYCLE HOOKS
    // ==========================================
    onMounted(() => {
      loadLayoutPreferences()
      window.addEventListener('resize', () => {
        nextTick(() => {
          // Force re-evaluation of computed properties
        })
      })
    })

    onUnmounted(() => {
      if (isResizing.value) {
        stopResize()
      }
    })

    // ==========================================
    // RETURN - All state and methods for template
    // ==========================================
    return {
      // State from composables
      ...lessonState,
      ...lessonNavigation,
      ...lessonContent,
      ...lessonExercises,
      ...lessonVocabulary,
      ...lessonAI,
      ...lessonProgress,
      ...lessonModals,

      // Split screen state
      isResizing,
      leftPanelWidth,
      rightPanelWidth,
      showTooltip,
      confettiCanvas,
      showConfetti,
      notifications,

      // Computed properties
      showContentPanel,
      showInteractivePanel,
      isLastStep,
      isVerticalLayout,
      leftPanelStyle,
      rightPanelStyle,
      resizeAriaLabel,
      tooltipText,

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
      exitLesson,
      handleSubmit,
      retryLoad,
      openProblemReportModal,
      closeProblemReportModal,
      submitProblemReport,
      closeNotification,
      addNotification
    }
  }
}
</script>

<style scoped>
.lesson-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
}

.lesson-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  overflow: hidden;
}

.ai-help-section {
  flex-shrink: 0;
  max-height: 300px;
  border-top: 1px solid #e2e8f0;
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
}

@media (max-width: 768px) {
  .lesson-page {
    height: 100dvh;
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
}

/* ==========================================
   ACCESSIBILITY
   ========================================== */
@media (prefers-reduced-motion: reduce) {
  .resize-handle,
  .floating-ai-btn,
  .notification {
    transition: none;
  }
  
  .floating-ai-btn:hover {
    transform: none;
  }
  
  .notification {
    animation: none;
  }
}

@media (prefers-contrast: high) {
  .panel,
  .resize-handle,
  .notification {
    border-width: 2px;
  }
  
  .grip-dot {
    background: #000;
  }
}

/* ==========================================
   DARK MODE
   ========================================== */
@media (prefers-color-scheme: dark) {
  .lesson-page {
    background: #0f172a;
  }
  
  .panel {
    background: #1e293b;
    border-color: #374151;
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
  
  .notification {
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
}

/* ==========================================
   PRINT STYLES
   ========================================== */
@media print {
  .lesson-page {
    height: auto;
    overflow: visible;
  }
  
  .floating-ai-btn,
  .notification-system,
  .resize-handle {
    display: none;
  }
  
  .split-content {
    flex-direction: column;
  }
  
  .panel {
    border: 1px solid #000;
    page-break-inside: avoid;
  }
}
</style>