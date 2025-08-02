<template>
  <div class="lesson-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Загрузка урока...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-screen">
      <div class="error-icon">❌</div>
      <h3>Ошибка загрузки урока</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="retryLoad" class="retry-btn">🔄 Попробовать снова</button>
        <button @click="handleReturnToCatalogue" class="back-btn">⬅️ К каталогу</button>
      </div>
    </div>

    <!-- Paywall Modal -->
    <div v-if="showPaywallModal" class="modal-overlay">
      <div class="modal-content">
        <h3>🔒 Платный контент</h3>
        <p>Этот урок доступен только для подписчиков.</p>
        <div class="modal-actions">
          <button @click="$router.push('/pay/start')" class="premium-btn">💳 Получить подписку</button>
          <button @click="handleReturnToCatalogue" class="cancel-btn">⬅️ Назад к каталогу</button>
        </div>
      </div>
    </div>

    <!-- Exit Confirmation Modal -->
    <div v-if="showExitModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Вы действительно хотите выйти?</h3>
        <p>Ваш прогресс будет сохранён автоматически.</p>
        <div class="modal-actions">
          <button @click="exitLesson" class="confirm-btn">Да, выйти</button>
          <button @click="cancelExit" class="cancel-btn">Нет, остаться</button>
        </div>
      </div>
    </div>

    <!-- Enhanced Problem Report Modal -->
    <div v-if="showProblemReportModal" class="modal-overlay" @click.self="closeProblemReportModal">
      <div class="problem-report-modal">
        <div class="modal-header">
          <h3>⚠️ Сообщить о проблеме с уроком</h3>
          <button @click="closeProblemReportModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <p class="modal-description">
            Помогите нам улучшить урок! Опишите проблему подробно и приложите скриншот, если это возможно.
          </p>
          
          <div class="form-group">
            <label for="problemType">Тип проблемы:</label>
            <select id="problemType" v-model="problemType" class="form-select">
              <option value="">Выберите тип проблемы</option>
              <option value="content">Ошибка в содержании</option>
              <option value="technical">Техническая проблема</option>
              <option value="interface">Проблема с интерфейсом</option>
              <option value="exercise">Ошибка в упражнении</option>
              <option value="audio">Проблема со звуком</option>
              <option value="other">Другое</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="problemDescription">Подробное описание проблемы: <span class="required">*</span></label>
            <textarea 
              id="problemDescription" 
              v-model="problemDescription" 
              rows="4" 
              placeholder="Опишите проблему как можно подробнее: что произошло, на каком шаге, что вы ожидали увидеть..."
              class="form-textarea"
              :class="{ 'error': showValidationError && !problemDescription.trim() }"
            ></textarea>
            <div v-if="showValidationError && !problemDescription.trim()" class="error-message">
              Пожалуйста, опишите проблему
            </div>
          </div>
          
          <div class="form-group">
            <label for="screenshotUrl">Ссылка на скриншот или фото (необязательно):</label>
            <input 
              type="url" 
              id="screenshotUrl" 
              v-model="screenshotUrl" 
              placeholder="https://example.com/screenshot.png или вставьте ссылку с облачного хранилища"
              class="form-input"
            >
            <div class="help-text">
              💡 Совет: Сделайте скриншот и загрузите его на imgbb.com, imgur.com или Google Drive, затем вставьте ссылку сюда
            </div>
          </div>
          
          <div class="form-group">
            <label for="contactInfo">Ваш контакт для обратной связи (необязательно):</label>
            <input 
              type="text" 
              id="contactInfo" 
              v-model="contactInfo" 
              placeholder="Telegram @username, email или телефон"
              class="form-input"
            >
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeProblemReportModal" class="cancel-btn">
            Отмена
          </button>
          <button 
            @click="submitProblemReport" 
            class="submit-btn"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '📤 Отправка...' : '📤 Отправить отчет' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success notification -->
    <div v-if="showSuccessMessage" class="success-notification">
      <div class="success-content">
        <div class="success-icon">✅</div>
        <div class="success-text">
          <h4>Спасибо за отчет!</h4>
          <p>Мы получили вашу информацию и рассмотрим проблему в ближайшее время.</p>
        </div>
        <button @click="closeSuccessMessage" class="close-success">✕</button>
      </div>
    </div>

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

    <!-- Intro Screen with Problem Report Button at Bottom -->
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

      <!-- Combined Header with Progress Bar -->
      <LessonHeader
        :lesson="lesson"
        :current-step="currentIndex + 1"
        :total-steps="steps.length"
        :formatted-time="formattedTime"
        :stars="stars"
        :progress-percentage="progressPercentage"
        @exit="confirmExit"
        @report-problem="openProblemReportModal"
      />

      <!-- Split Screen Content -->
      <div class="split-content" :class="{ dragging: isResizing }">
        <!-- Left Panel - Clean Content Display -->
        <div class="content-panel" :style="leftPanelStyle">
          <ContentPanel
            :current-step="currentStep"
            :current-index="currentIndex"
            :is-interactive-step="isInteractiveStep"
            :current-exercise="getCurrentExercise()"
            :current-quiz="getCurrentQuiz()"
            :exercise-index="currentExerciseIndex"
            :quiz-index="currentQuizIndex"
            :total-exercises="getTotalExercises()"
            :total-quizzes="getTotalQuizzes()"
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

        <!-- Resize Divider -->
        <div 
          class="resize-divider"
          :class="{ active: isResizing }"
          @mousedown="startResize"
          @touchstart="startResize"
          @keydown="handleResizeKeyboard"
          tabindex="0"
          role="separator"
          :aria-label="`Resize panels. Current split: ${widthIndicatorText}`"
          :title="`Current split: ${widthIndicatorText}. Use arrow keys or drag to resize.`"
        ></div>

        <!-- Right Panel - Interactive Content -->
        <div class="right-panel" :style="rightPanelStyle">
          <!-- Interactive Panel (Exercises/Quizzes) -->
          <div v-if="isInteractiveStep" class="interactive-panel-container">
            <InteractivePanel
              :current-step="currentStep"
              :current-exercise="getCurrentExercise()"
              :current-quiz="getCurrentQuiz()"
              :exercise-index="currentExerciseIndex"
              :quiz-index="currentQuizIndex"
              :total-exercises="getTotalExercises()"
              :total-quizzes="getTotalQuizzes()"
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

          <!-- Non-interactive step placeholder -->
          <div v-else class="non-interactive-panel">
            <div class="panel-placeholder">
              <div class="placeholder-icon">📖</div>
              <h4>Изучите материал слева</h4>
              <p>Внимательно прочитайте объяснение и переходите к следующему шагу</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Lesson Completion Screen -->
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
      <!-- Slot for additional buttons/content in CompletionScreen -->
      <template #extra-actions>
        <button @click="openProblemReportModal" class="btn-secondary">
          ⚠️ Сообщить о проблеме с уроком
        </button>
      </template>
    </CompletionScreen>

    <!-- Migration Panel (Admin/User) -->
    <div v-if="showMigrationPanel" class="migration-panel">
      <div class="migration-content">
        <h3>🔄 Обновление контента</h3>
        <p>Хотите создать задания и словарь из уже пройденных уроков?</p>
        <div class="migration-actions">
          <button
            @click="migrateLessonContent"
            :disabled="migrationLoading"
            class="migrate-btn"
          >
            {{ migrationLoading ? '⏳ Обработка...' : '🚀 Обновить контент' }}
          </button>
          <button @click="closeMigrationPanel" class="cancel-btn">❌ Закрыть</button>
        </div>
      </div>
    </div>

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

    <!-- Confetti Animation -->
    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
// ✅ COMPLETE LESSONPAGE.VUE SCRIPT with Enhanced Resizable Split Screen
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

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
// ✅ REMOVED: ProgressBar import - now integrated into LessonHeader
import ContentPanel from '@/components/lesson/ContentPanel.vue'
import InteractivePanel from '@/components/lesson/InteractivePanel.vue'
import AIHelpPanel from '@/components/lesson/AIHelpPanel.vue'
import CompletionScreen from '@/components/lesson/CompletionScreen.vue'
import FloatingAIAssistant from '@/components/lesson/FloatingAIAssistant.vue'

export default {
  name: 'LessonPage',

  components: {
    VocabularyModal,
    LessonIntro,
    LessonHeader,
    // ✅ REMOVED: ProgressBar component
    ContentPanel,
    InteractivePanel,
    AIHelpPanel,
    CompletionScreen,
    FloatingAIAssistant
  },

  setup() {
    const router = useRouter()
    
    // ==========================================
    // COMPOSABLES INITIALIZATION
    // ==========================================
    const lessonOrchestrator = useLessonOrchestrator()
    const vocabulary = useVocabulary()
    const exercises = useExercises()
    const paymentValidation = usePaymentValidation()
    const sound = useSound()
    const explanation = useExplanation()

    // Initialize services
    sound.initializeSpeech?.()
    explanation.initializeAI?.()

    // ==========================================
    // RESIZABLE SPLIT SCREEN STATE - MAXIMUM CONTENT SPACE
    // ==========================================
    const isResizing = ref(false)
    const startX = ref(0)
    const startY = ref(0)
    const startWidthLeft = ref(75)  // ✅ NEW DEFAULT: 75% for content
    const startWidthRight = ref(25) // ✅ NEW DEFAULT: 25% for interactive
    const currentLeftWidth = ref(75)  // ✅ INCREASED: 75% by default instead of 50%
    const currentRightWidth = ref(25) // ✅ DECREASED: 25% for interactive panel
    const resizeDirection = ref('horizontal') // 'horizontal' or 'vertical'

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
    // RESIZABLE SPLIT SCREEN COMPUTED PROPERTIES - MAXIMUM CONTENT SPACE
    // ==========================================
    const leftPanelStyle = computed(() => {
      const isVertical = window.innerWidth <= 1023
      if (isVertical) {
        return { 
          flex: `1 1 ${currentLeftWidth.value}%`,
          minHeight: '300px', // ✅ INCREASED: More space for content
          maxHeight: currentLeftWidth.value >= 80 ? '80%' : 'none' // ✅ UPDATED: New constraint
        }
      }
      return { 
        flex: `0 0 ${currentLeftWidth.value}%`,
        minWidth: '300px', // ✅ MAINTAINED: Adequate minimum
        maxWidth: currentLeftWidth.value >= 85 ? '85%' : 'none', // ✅ UPDATED: New constraint
        height: '100%', // ✅ ENSURE: Full height usage
        overflow: 'hidden' // ✅ ENSURE: No overflow on container
      }
    })

    const rightPanelStyle = computed(() => {
      const isVertical = window.innerWidth <= 1023
      if (isVertical) {
        return { 
          flex: `1 1 ${currentRightWidth.value}%`,
          minHeight: '150px', // ✅ REDUCED: Allow more space for content
          maxHeight: currentRightWidth.value >= 75 ? '75%' : 'none'
        }
      }
      return { 
        flex: `0 0 ${currentRightWidth.value}%`,
        minWidth: '200px', // ✅ REDUCED: Lower minimum for max content space
        maxWidth: currentRightWidth.value >= 80 ? '80%' : 'none',
        height: '100%', // ✅ ENSURE: Full height usage
        overflow: 'hidden' // ✅ ENSURE: Container doesn't overflow
      }
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

    const userToken = computed(() => {
      return lessonOrchestrator.currentUser?.value?.token || localStorage.getItem('authToken')
    })

    // ==========================================
    // RESIZABLE SPLIT SCREEN METHODS - MAXIMUM CONTENT SPACE
    // ==========================================
    const startResize = (event) => {
      event.preventDefault()
      
      isResizing.value = true
      
      // Determine if we're in mobile/tablet mode (vertical) or desktop mode (horizontal)
      resizeDirection.value = window.innerWidth <= 1023 ? 'vertical' : 'horizontal'
      
      if (resizeDirection.value === 'horizontal') {
        startX.value = event.clientX || event.touches?.[0]?.clientX || 0
      } else {
        startY.value = event.clientY || event.touches?.[0]?.clientY || 0
      }
      
      startWidthLeft.value = currentLeftWidth.value
      startWidthRight.value = currentRightWidth.value
      
      // Add event listeners
      document.addEventListener('mousemove', handleResize, { passive: false })
      document.addEventListener('mouseup', stopResize)
      document.addEventListener('touchmove', handleResize, { passive: false })
      document.addEventListener('touchend', stopResize)
      
      // Prevent text selection during resize
      document.body.style.userSelect = 'none'
      document.body.style.cursor = resizeDirection.value === 'horizontal' ? 'col-resize' : 'row-resize'
      
      console.log('🔧 Started resizing:', resizeDirection.value)
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
      
      // Calculate percentage change
      const deltaPercentage = (delta / containerSize) * 100
      
      // Calculate new widths
      let newLeftWidth = startWidthLeft.value + deltaPercentage
      let newRightWidth = startWidthRight.value - deltaPercentage
      
      // ✅ UPDATED: New constraints for maximum content space
      const minLeftWidth = 20   // ✅ REDUCED: Allow content to shrink to 20%
      const maxLeftWidth = 85   // ✅ INCREASED: Allow content to expand to 85%
      const minRightWidth = 15  // ✅ REDUCED: Interactive can be as small as 15%
      const maxRightWidth = 80  // ✅ INCREASED: Interactive can be as large as 80%
      
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
      
      // Update reactive values
      currentLeftWidth.value = newLeftWidth
      currentRightWidth.value = newRightWidth
    }

    const stopResize = () => {
      if (!isResizing.value) return
      
      isResizing.value = false
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
      document.removeEventListener('touchmove', handleResize)
      document.removeEventListener('touchend', stopResize)
      
      // Restore text selection and cursor
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      
      // Save the current sizes to localStorage for persistence
      try {
        localStorage.setItem('lessonPageSplitSizes', JSON.stringify({
          left: currentLeftWidth.value,
          right: currentRightWidth.value,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.warn('Could not save split sizes to localStorage:', error)
      }
      
      console.log('✅ Stopped resizing. Final sizes:', {
        left: Math.round(currentLeftWidth.value),
        right: Math.round(currentRightWidth.value)
      })
    }

    // Keyboard support for accessibility with new constraints
    const handleResizeKeyboard = (event) => {
      const step = 5 // 5% step size
      let newLeftWidth = currentLeftWidth.value
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newLeftWidth = Math.max(20, currentLeftWidth.value - step) // ✅ UPDATED: New minimum
          break
        case 'ArrowRight':
          event.preventDefault()
          newLeftWidth = Math.min(85, currentLeftWidth.value + step) // ✅ UPDATED: New maximum
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
          newLeftWidth = 20 // ✅ UPDATED: New minimum
          break
        case 'End':
          event.preventDefault()
          newLeftWidth = 85 // ✅ UPDATED: New maximum
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          newLeftWidth = 75 // ✅ UPDATED: New default
          break
        default:
          return
      }
      
      currentLeftWidth.value = newLeftWidth
      currentRightWidth.value = 100 - newLeftWidth
      
      // Save the new sizes
      try {
        localStorage.setItem('lessonPageSplitSizes', JSON.stringify({
          left: currentLeftWidth.value,
          right: currentRightWidth.value,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.warn('Could not save split sizes to localStorage:', error)
      }
    }

    // Function to reset to new default sizes
    const resetSplitSizes = () => {
      currentLeftWidth.value = 75  // ✅ NEW DEFAULT: 75% for content
      currentRightWidth.value = 25 // ✅ NEW DEFAULT: 25% for interactive
      
      // Remove saved sizes from localStorage
      try {
        localStorage.removeItem('lessonPageSplitSizes')
      } catch (error) {
        console.warn('Could not remove saved sizes from localStorage:', error)
      }
      
      console.log('🔄 Reset split sizes to new defaults (75/25)')
    }

    // Function to load saved sizes from localStorage with new defaults
    const loadSavedSizes = () => {
      try {
        const saved = localStorage.getItem('lessonPageSplitSizes')
        if (saved) {
          const { left, right, timestamp } = JSON.parse(saved)
          
          // Check if saved data is recent (within 30 days)
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
          if (timestamp && timestamp > thirtyDaysAgo) {
            currentLeftWidth.value = Math.max(20, Math.min(85, left || 75)) // ✅ UPDATED: New ranges
            currentRightWidth.value = Math.max(15, Math.min(80, right || 25)) // ✅ UPDATED: New ranges
            console.log('📊 Loaded saved split sizes:', { left: currentLeftWidth.value, right: currentRightWidth.value })
          } else {
            // Remove old data and use new defaults
            localStorage.removeItem('lessonPageSplitSizes')
            currentLeftWidth.value = 75  // ✅ NEW DEFAULT
            currentRightWidth.value = 25 // ✅ NEW DEFAULT
          }
        } else {
          // Use new defaults
          currentLeftWidth.value = 75
          currentRightWidth.value = 25
        }
      } catch (error) {
        console.warn('Could not load saved sizes from localStorage:', error)
        // Fallback to new defaults
        currentLeftWidth.value = 75
        currentRightWidth.value = 25
      }
    }

    // Handle window resize with mobile optimization
    const handleWindowResize = () => {
      const wasVertical = resizeDirection.value === 'vertical'
      const isNowVertical = window.innerWidth <= 1023
      
      if (wasVertical !== isNowVertical) {
        resizeDirection.value = isNowVertical ? 'vertical' : 'horizontal'
        
        // ✅ MOBILE OPTIMIZATION: Adjust splits for mobile
        if (isNowVertical && currentLeftWidth.value < 65) {
          currentLeftWidth.value = 70  // ✅ GIVE MORE SPACE: To content on mobile
          currentRightWidth.value = 30
        } else if (!isNowVertical && currentLeftWidth.value > 80) {
          currentLeftWidth.value = 75  // ✅ BALANCE: For desktop
          currentRightWidth.value = 25
        }
        
        console.log('📱 Resize direction changed to:', resizeDirection.value, 'New split:', `${currentLeftWidth.value}/${currentRightWidth.value}`)
      }
    }

    // ==========================================
    // ALL OTHER METHODS FROM ORIGINAL FILE
    // ==========================================
    
    // Navigation methods
    const handleReturnToCatalogue = () => {
      console.log('🔄 Returning to catalogue...')
      
      try {
        router.push({ 
          path: '/profile/catalogue' 
        }).catch(err => {
          console.warn('⚠️ Direct path navigation failed:', err)
          router.push({ 
            name: 'CataloguePage' 
          }).catch(err2 => {
            console.warn('⚠️ Named route navigation failed:', err2)
            router.push({ 
              path: '/profile' 
            }).catch(err3 => {
              console.error('❌ All navigation attempts failed:', err3)
              window.location.href = '/profile/catalogue'
            })
          })
        })
      } catch (error) {
        console.error('❌ Navigation error in handleReturnToCatalogue:', error)
        window.location.href = '/profile/catalogue'
      }
    }

    const handleGoToHomework = () => {
      console.log('📚 Navigating to homework...')
      
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
            console.warn('⚠️ Lesson homework navigation failed:', err)
            router.push({ 
              name: 'HomeworkList' 
            }).catch(err2 => {
              console.error('❌ Homework navigation failed:', err2)
              window.location.href = '/profile/homeworks'
            })
          })
        } catch (error) {
          console.error('❌ Error navigating to homework:', error)
          window.location.href = '/profile/homeworks'
        }
      } else {
        console.error('❌ Cannot navigate to homework: Lesson ID is missing.')
        try {
          router.push({ 
            name: 'HomeworkList' 
          }).catch(err => {
            console.error('❌ Fallback homework navigation failed:', err)
            window.location.href = '/profile/homeworks'
          })
        } catch (error) {
          window.location.href = '/profile/homeworks'
        }
      }
    }

    const exitLesson = () => {
      console.log('🚪 Exiting lesson...')
      
      try {
        if (lessonOrchestrator.saveProgress) {
          lessonOrchestrator.saveProgress().catch(err => {
            console.warn('⚠️ Failed to save progress on exit:', err)
          })
        }
        
        if (lessonOrchestrator.cleanup) {
          lessonOrchestrator.cleanup()
        }
        
        lessonOrchestrator.showExitModal.value = false
        handleReturnToCatalogue()
        
      } catch (error) {
        console.error('❌ Error during lesson exit:', error)
        lessonOrchestrator.showExitModal.value = false
        
        try {
          router.push({ path: '/profile/catalogue' })
        } catch (navError) {
          window.location.href = '/profile/catalogue'
        }
      }
    }

    // Problem reporting methods
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
        lessonName: lessonOrchestrator.lesson.value?.lessonName || 'Неизвестный урок',
        lessonId: lessonOrchestrator.lesson.value?._id || 'N/A',
        currentStep: lessonOrchestrator.currentIndex.value + 1,
        totalSteps: lessonOrchestrator.steps.value?.length || 0,
        userAgent: navigator.userAgent,
        timestamp: new Date().toLocaleString('ru-RU'),
        url: window.location.href
      }
    }

    const formatProblemReport = () => {
      const lessonInfo = getCurrentLessonInfo()
      
      let message = `🚨 ОТЧЕТ О ПРОБЛЕМЕ В УРОКЕ\n\n`
      message += `📚 Урок: ${lessonInfo.lessonName}\n`
      message += `🆔 ID урока: ${lessonInfo.lessonId}\n`
      message += `📍 Текущий шаг: ${lessonInfo.currentStep}/${lessonInfo.totalSteps}\n`
      message += `🕐 Время: ${lessonInfo.timestamp}\n\n`
      
      if (problemType.value) {
        const typeLabels = {
          content: 'Ошибка в содержании',
          technical: 'Техническая проблема',
          interface: 'Проблема с интерфейсом',
          exercise: 'Ошибка в упражнении',
          audio: 'Проблема со звуком',
          other: 'Другое'
        }
        message += `⚠️ Тип проблемы: ${typeLabels[problemType.value]}\n\n`
      }
      
      message += `📝 Описание проблемы:\n${problemDescription.value}\n\n`
      
      if (screenshotUrl.value) {
        message += `📸 Скриншот: ${screenshotUrl.value}\n\n`
      }
      
      if (contactInfo.value) {
        message += `📞 Контакт: ${contactInfo.value}\n\n`
      }
      
      message += `🔧 ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ:\n`
      message += `🌐 URL: ${lessonInfo.url}\n`
      message += `💻 Браузер: ${lessonInfo.userAgent}\n`
      
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
        
        console.log('📊 Problem Report Submitted:', {
          lessonId: getCurrentLessonInfo().lessonId,
          problemType: problemType.value,
          hasScreenshot: !!screenshotUrl.value,
          hasContact: !!contactInfo.value,
          timestamp: new Date().toISOString()
        })
        
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
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            })
          })
        } catch (analyticsError) {
          console.warn('Analytics logging failed:', analyticsError)
        }
        
        window.open(telegramLink, '_blank')
        
        closeProblemReportModal()
        showSuccessMessage.value = true
        
        setTimeout(() => {
          showSuccessMessage.value = false
        }, 5000)
        
      } catch (error) {
        console.error('❌ Error submitting problem report:', error)
        
        if (lessonOrchestrator.showToast) {
          lessonOrchestrator.showToast('Ошибка при отправке отчета. Попробуйте еще раз.', 'error')
        } else {
          alert('Ошибка при отправке отчета. Попробуйте еще раз.')
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
      
      // Keyboard shortcut for resetting split sizes
      if (event.ctrlKey && event.altKey && event.key === 'R') {
        event.preventDefault()
        resetSplitSizes()
      }
    }

    // Vocabulary methods
    const initializeVocabularyModal = (step) => {
      console.log('📚 Initializing vocabulary modal from LessonPage:', step)

      let vocabularyStep = step

      if (!vocabularyStep) {
        console.warn('⚠️ No step provided to initializeVocabularyModal, using current step')
        vocabularyStep = lessonOrchestrator.currentStep.value
      }

      if (!vocabularyStep) {
        console.error('❌ No vocabulary step available for initialization')
        return
      }

      if (vocabularyStep.type !== 'vocabulary') {
        console.error('❌ Step is not a vocabulary type:', vocabularyStep.type)

        const vocabularySteps = lessonOrchestrator.steps.value?.filter(s => s.type === 'vocabulary')
        if (vocabularySteps && vocabularySteps.length > 0) {
          console.log('✅ Found vocabulary step in lesson, using first one:', vocabularySteps[0])
          vocabularyStep = vocabularySteps[0]
        } else {
          console.error('❌ No vocabulary steps found in entire lesson')
          return
        }
      }

      vocabulary.initializeVocabularyModal(vocabularyStep)
    }

    const jumpToVocabWord = (index) => {
      console.log('🎯 Jumping to vocabulary word:', index)

      if (index >= 0 && index < vocabulary.vocabularyModal.words.length) {
        vocabulary.cardAnimation.isFlipping = false
        vocabulary.cardAnimation.showDefinition = false

        setTimeout(() => {
          vocabulary.vocabularyModal.currentIndex = index
          console.log(`✅ Jumped to word ${index + 1}/${vocabulary.vocabularyModal.words.length}`)
        }, 50)
      } else {
        console.warn('⚠️ Invalid vocabulary word index:', index)
      }
    }

    const showVocabDefinition = () => {
      console.log('🔄 Showing vocabulary definition')
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

    const pronounceWord = (word) => {
      if (!word || typeof word !== 'string') {
        console.warn('⚠️ Invalid word for pronunciation:', word)
        return
      }
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(word.trim())
          utterance.lang = 'en-US'
          utterance.rate = 0.8
          utterance.pitch = 1
          utterance.onerror = (event) => console.error('❌ Pronunciation error:', event.error)
          window.speechSynthesis.speak(utterance)
        } else {
          console.warn('⚠️ Speech synthesis not supported')
          sound.pronounceWord?.(word)
        }
      } catch (error) {
        console.error('❌ Error pronouncing word:', error)
        sound.pronounceWord?.(word)
      }
    }

    // Exercise methods
    const getCurrentExercise = () => {
      const exercise = exercises.getCurrentExercise(lessonOrchestrator.currentStep.value)
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
      
      if (lessonOrchestrator.saveProgress) {
        lessonOrchestrator.saveProgress().catch(err => {
          console.warn('⚠️ Failed to save progress after drop:', err)
        })
      }
    }

    const handleRemoveDroppedItem = ({ zoneId, itemIndex, item }) => {
      exercises.handleRemoveDroppedItem({ zoneId, itemIndex, item })
      
      if (sound.playClickSound) {
        sound.playClickSound()
      }
    }

    // Drag & Drop helper methods
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
        console.warn('❌ No current step available')
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
      await lessonOrchestrator.saveProgress()
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
    }
    
    const goToNextExercise = () => {
      resetAttempts()
      exercises.goToNextExercise(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
    }
    
    const goToNextQuiz = () => {
      resetAttempts()
      exercises.goToNextQuiz(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
    }
    
    const goNext = () => {
      resetAttempts()
      lessonOrchestrator.goNext()
    }
    
    const goPrevious = () => {
      resetAttempts()
      lessonOrchestrator.goPrevious()
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
          const message = `✅ Миграция завершена! Создано ${result.data?.homeworkCreated || 0} заданий и добавлено ${result.data?.vocabularyAdded || 0} слов в словарь.`

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
        console.error('❌ Migration error:', error)
        const errorMessage = '❌ Ошибка миграции: ' + error.message

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
          const extractionResult = await extractLessonContent()

          if (extractionResult?.success) {
            showCompletionMessage(extractionResult)
          } else {
            console.warn('⚠️ Content extraction failed, but lesson still completed')
            lessonOrchestrator.lessonCompleted.value = true
          }
        }
      } catch (error) {
        console.error('❌ Error completing lesson with extraction:', error)
        lessonOrchestrator.lessonCompleted.value = true
      }
    }

    const extractLessonContent = async () => {
      try {
        if (!lessonOrchestrator.currentUser?.value?.uid || !lessonOrchestrator.lesson.value?._id) {
          console.error('❌ Missing required data for extraction')
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
        console.error('❌ Error extracting lesson content:', error)
        return { success: false, error: error.message }
      }
    }

    const showCompletionMessage = (extractionResult) => {
      let message = '🎉 Урок успешно завершён!'

      if (extractionResult.homeworkCreated) {
        message += '\n📝 Новое домашнее задание создано и доступно в разделе заданий!'
      }

      if (extractionResult.vocabularyAdded) {
        message += `\n📚 ${extractionResult.vocabularyCount} новых слов добавлено в вашу коллекцию словаря!`
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
      
      // ✅ LOAD: Saved split sizes with new defaults
      loadSavedSizes()
      
      // ✅ RESPONSIVE: Adjust for current screen size
      handleWindowResize()
      
      // Make debug functions globally available
      window.resetSplitSizes = resetSplitSizes
      window.loadSavedSizes = loadSavedSizes
      window.getCurrentSplit = () => ({
        left: currentLeftWidth.value,
        right: currentRightWidth.value,
        direction: resizeDirection.value
      })
      
      console.log('🎯 LessonPage initialized with split:', `${currentLeftWidth.value}/${currentRightWidth.value}`)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboardShortcuts)
      window.removeEventListener('resize', handleWindowResize)
      
      // Clean up any active resize state
      if (isResizing.value) {
        stopResize()
      }
      
      // Clean up debug functions
      delete window.resetSplitSizes
      delete window.loadSavedSizes
      delete window.getCurrentSplit
    })

    // Watchers
    watch(() => lessonOrchestrator.lessonCompleted.value, (newVal) => {
      if (newVal) {
        startConfetti()
      }
    })

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

    // Watch for window size changes to update resize direction
    watch(() => resizeDirection.value, (newDirection) => {
      console.log('📐 Resize direction updated:', newDirection)
    })

    // Return all props and methods
    return {
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
      startLesson: lessonOrchestrator.startLesson,
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