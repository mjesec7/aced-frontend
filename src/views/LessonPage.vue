<template>
  <div class="lesson-page">
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Loading lesson...</p>
    </div>

    <div v-else-if="error" class="error-screen">
      <div class="error-icon">❌</div>
      <h3>Error Loading Lesson</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="retryLoad" class="retry-btn">🔄 Try Again</button>
        <button @click="handleReturnToCatalogue" class="back-btn">⬅️ Back to Catalogue</button>
      </div>
    </div>

    <div v-if="showPaywallModal" class="modal-overlay">
      <div class="modal-content">
        <h3>🔒 Premium Content</h3>
        <p>This lesson is only available to subscribers.</p>
        <div class="modal-actions">
          <button @click="$router.push('/pay/start')" class="premium-btn">💳 Get Subscription</button>
          <button @click="handleReturnToCatalogue" class="cancel-btn">⬅️ Back to Catalogue</button>
        </div>
      </div>
    </div>

    <div v-if="showExitModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Do you really want to exit?</h3>
        <p>Your progress will be saved automatically.</p>
        <div class="modal-actions">
          <button @click="exitLesson" class="confirm-btn">Yes, Exit</button>
          <button @click="cancelExit" class="cancel-btn">No, Stay</button>
        </div>
      </div>
    </div>

    <div v-if="showProblemReportModal" class="modal-overlay" @click.self="closeProblemReportModal">
      <div class="problem-report-modal">
        <div class="modal-header">
          <h3>⚠️ Report a Problem with this Lesson</h3>
          <button @click="closeProblemReportModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-description">
            Help us improve the lesson! Describe the problem in detail and attach a screenshot if possible.
          </p>

          <div class="form-group">
            <label for="problemType">Problem Type:</label>
            <select id="problemType" v-model="problemType" class="form-select">
              <option value="">Select problem type</option>
              <option value="content">Content Error</option>
              <option value="technical">Technical Problem</option>
              <option value="interface">Interface Issue</option>
              <option value="exercise">Exercise Error</option>
              <option value="audio">Audio Problem</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="problemDescription">Detailed Description: <span class="required">*</span></label>
            <textarea
              id="problemDescription"
              v-model="problemDescription"
              rows="4"
              placeholder="Describe the problem in as much detail as possible: what happened, at which step, what you expected to see..."
              class="form-textarea"
              :class="{ 'error': showValidationError && !problemDescription.trim() }"
            ></textarea>
            <div v-if="showValidationError && !problemDescription.trim()" class="error-message">
              Please describe the problem
            </div>
          </div>

          <div class="form-group">
            <label for="screenshotUrl">Screenshot or Photo URL (optional):</label>
            <input
              type="url"
              id="screenshotUrl"
              v-model="screenshotUrl"
              placeholder="https://example.com/screenshot.png or paste a link from cloud storage"
              class="form-input"
            >
            <div class="help-text">
              💡 Tip: Take a screenshot and upload it to imgbb.com, imgur.com, or Google Drive, then paste the link here
            </div>
          </div>

          <div class="form-group">
            <label for="contactInfo">Your contact for feedback (optional):</label>
            <input
              type="text"
              id="contactInfo"
              v-model="contactInfo"
              placeholder="Telegram @username, email, or phone"
              class="form-input"
            >
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeProblemReportModal" class="cancel-btn">
            Cancel
          </button>
          <button
            @click="submitProblemReport"
            class="submit-btn"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '📤 Sending...' : '📤 Send Report' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showSuccessMessage" class="success-notification">
      <div class="success-content">
        <div class="success-icon">✅</div>
        <div class="success-text">
          <h4>Thanks for your report!</h4>
          <p>We've received your information and will review the problem soon.</p>
        </div>
        <button @click="closeSuccessMessage" class="close-success">✕</button>
      </div>
    </div>

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

      <!-- New Header -->
      <div class="lesson-header-new">
        <div class="header-left">
          <button @click="confirmExit" class="close-btn-new">✕</button>
          <div class="lesson-title-info">
            <h2>{{ lesson?.title || 'Lesson' }}</h2>
            <p>{{ lesson?.subtitle || '' }}</p>
          </div>
          <div class="progress-bar-inline">
            <div class="progress-fill-inline" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span class="progress-text-inline">{{ currentIndex + 1 }}/{{ steps.length }}</span>
        </div>
        <div class="header-right">
          <div class="streak-badge-new">
            <span>⚡</span>
            <span>{{ consecutiveCorrect }}</span>
          </div>
          <div class="points-badge-new">
            <span>🏆</span>
            <span>{{ earnedPoints }}</span>
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
          v-if="!isGameStep"
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
        <button @click="openProblemReportModal" class="btn-secondary">
          ⚠️ Report a Problem with this Lesson
        </button>
      </template>
    </CompletionScreen>

    <div v-if="showMigrationPanel" class="migration-panel">
      <div class="migration-content">
        <h3>🔄 Content Update</h3>
        <p>Would you like to create assignments and vocabulary from already completed lessons?</p>
        <div class="migration-actions">
          <button
            @click="migrateLessonContent"
            :disabled="migrationLoading"
            class="migrate-btn"
          >
            {{ migrationLoading ? '⏳ Processing...' : '🚀 Update Content' }}
          </button>
          <button @click="closeMigrationPanel" class="cancel-btn">❌ Close</button>
        </div>
      </div>
    </div>

    <button
      v-if="started && !lessonCompleted"
      class="floating-ai-btn"
      @click="toggleFloatingAI"
      :class="{ active: showFloatingAI }"
    >
      🤖
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
      if (isGameStep.value) return { display: 'none' }
      return { width: `${currentLeftWidth.value}%` }
    })

    const rightPanelStyle = computed(() => {
      if (isGameStep.value) return { width: '100%' }
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
          exercises.confirmation.value = exercises.getRandomSuccessMessage() + ' 🌟 Бонус за первую попытку!'
        } else {
          exercises.confirmation.value = exercises.getRandomSuccessMessage() + ' 💪 Отлично, со второй попытки!'
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
</style>