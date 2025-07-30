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

    <!-- All your existing modals stay the same -->
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

    <!-- All your other existing modals... -->

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

    <!-- Main Lesson Content - NEW MODERN DESIGN -->
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      <!-- Top Header with Progress -->
      <div class="lesson-header">
        <div class="lesson-header-content">
          <!-- Lesson Info -->
          <div class="lesson-info">
            <div class="lesson-badge">
              <span class="lesson-badge-icon">📚</span>
              <span class="lesson-badge-text">{{ getLocalized(lesson?.lessonName) || 'Урок' }}</span>
            </div>
            <div class="lesson-meta">
              <div class="meta-item">
                <span class="meta-icon">📖</span>
                <span class="meta-text">Урок {{ currentIndex + 1 }} • Глава {{ lesson?.chapter || 1 }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">⏱️</span>
                <span class="meta-text">{{ formattedTime }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">👥</span>
                <span class="meta-text">Начальный уровень</span>
              </div>
            </div>
          </div>

          <!-- Progress and Actions -->
          <div class="lesson-actions">
            <div class="lesson-status">
              <span class="status-badge status-interactive">Интерактивный</span>
            </div>
            <button @click="confirmExit" class="exit-lesson-btn">✕</button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <p class="progress-text">Прогресс: {{ Math.round(progressPercentage) }}% завершено</p>
        </div>
      </div>

      <!-- Split Screen Content with Resizable Divider -->
      <div 
        class="split-content" 
        :class="{ 'is-resizing': isResizing }"
        ref="splitContainer"
      >
        <!-- Left Panel - Content Display -->
        <div 
          class="content-panel-wrapper" 
          :style="leftPanelStyle"
          ref="leftPanel"
        >
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

        <!-- Enhanced Resizable Divider -->
        <div 
          class="split-divider"
          :class="{ 
            'active': isResizing,
            'hover': isDividerHovered 
          }"
          @mousedown="startResize"
          @touchstart="startResize"
          @keydown="handleResizeKeyboard"
          @mouseenter="isDividerHovered = true"
          @mouseleave="isDividerHovered = false"
          tabindex="0"
          role="separator"
          aria-label="Изменить ширину панелей"
          :aria-valuenow="Math.round(leftPanelWidth)"
          aria-valuemin="25"
          aria-valuemax="75"
        >
          <div class="divider-handle">
            <div class="divider-grip">
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
            </div>
          </div>
          
          <!-- Divider Tooltip -->
          <div class="divider-tooltip" :class="{ 'visible': isDividerHovered || isResizing }">
            <div class="tooltip-content">
              <span class="percentage-display">{{ Math.round(leftPanelWidth) }}% | {{ Math.round(rightPanelWidth) }}%</span>
              <small>Перетащите для изменения размера</small>
            </div>
          </div>
        </div>

        <!-- Right Panel - Interactive Practice -->
        <div 
          class="right-panel-wrapper" 
          :style="rightPanelStyle"
          ref="rightPanel"
        >
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
      </div>

      <!-- Quick Resize Controls -->
      <div class="resize-controls">
        <span class="controls-label">Быстрые настройки:</span>
        <button 
          @click="setQuickResize(25, 75)" 
          class="resize-preset" 
          :class="{ active: isQuickResizeActive(25, 75) }"
          title="25% / 75%"
        >
          ◐
        </button>
        <button 
          @click="setQuickResize(50, 50)" 
          class="resize-preset" 
          :class="{ active: isQuickResizeActive(50, 50) }"
          title="50% / 50%"
        >
          ◑
        </button>
        <button 
          @click="setQuickResize(75, 25)" 
          class="resize-preset" 
          :class="{ active: isQuickResizeActive(75, 25) }"
          title="75% / 25%"
        >
          ◒
        </button>
        <button 
          @click="resetToDefault" 
          class="resize-reset" 
          title="Сброс"
        >
          ⟲
        </button>
      </div>

      <!-- Resize Indicator -->
      <div v-if="isResizing" class="resize-indicator">
        <div class="indicator-content">
          <span class="percentage-display">{{ Math.round(leftPanelWidth) }}% | {{ Math.round(rightPanelWidth) }}%</span>
          <small>Отпустите для применения • ESC для отмены</small>
        </div>
      </div>
    </div>

    <!-- Keep all your existing completion screen and other components -->
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
    />

    <!-- Floating AI Assistant -->
    <AIHelper />
  </div>
</template>

<script>
// Import your existing components
import ContentPanel from '../components/lesson/ContentPanel.vue'
import InteractivePanel from '../components/lesson/InteractivePanel.vue'
import VocabularyModal from '../components/lesson/VocabularyModal.vue'
import LessonIntro from '../components/lesson/LessonIntro.vue'
import CompletionScreen from '../components/lesson/CompletionScreen.vue'
import AIHelper from '../components/lesson/AIHelpPanel.vue'

export default {
  name: 'LessonPage',
  components: {
    ContentPanel,
    InteractivePanel,
    VocabularyModal,
    LessonIntro,
    CompletionScreen,
    AIHelper
  },
  data() {
    return {
      // Keep ALL your existing data properties from the original file
      // Enhanced resizing properties
      leftPanelWidth: 50,
      rightPanelWidth: 50,
      defaultLeftWidth: 50,
      defaultRightWidth: 50,
      isResizing: false,
      isDividerHovered: false,
      startX: 0,
      startY: 0,
      startLeftWidth: 0,
      startRightWidth: 0,
      minPanelWidth: 25,
      maxPanelWidth: 75,
      
      // Keep all your other existing data properties...
      loading: false,
      error: null,
      lesson: {},
      steps: [],
      currentIndex: 0,
      started: false,
      currentStep: {},
      isInteractiveStep: false,
      // ... all other properties from your original file
    }
  },
  
  computed: {
    // Keep all your existing computed properties
    leftPanelStyle() {
      return {
        width: `${this.leftPanelWidth}%`,
        minWidth: `${this.minPanelWidth}%`,
        maxWidth: `${this.maxPanelWidth}%`,
        transition: this.isResizing ? 'none' : 'width 0.2s ease-out'
      }
    },
    
    rightPanelStyle() {
      return {
        width: `${this.rightPanelWidth}%`,
        minWidth: `${this.minPanelWidth}%`,
        maxWidth: `${this.maxPanelWidth}%`,
        transition: this.isResizing ? 'none' : 'width 0.2s ease-out'
      }
    },
    
    progressPercentage() {
      if (this.steps.length === 0) return 0
      return (this.currentIndex / this.steps.length) * 100
    },
    
    // Keep all your other existing computed properties...
  },
  
  mounted() {
    // Keep all your existing mounted logic
    document.addEventListener('mousemove', this.handleResize)
    document.addEventListener('mouseup', this.stopResize)
    document.addEventListener('touchmove', this.handleResize, { passive: false })
    document.addEventListener('touchend', this.stopResize)
    document.addEventListener('keydown', this.handleGlobalKeydown)
    
    this.loadPanelSizes()
  },
  
  beforeUnmount() {
    // Keep all your existing cleanup
    document.removeEventListener('mousemove', this.handleResize)
    document.removeEventListener('mouseup', this.stopResize)
    document.removeEventListener('touchmove', this.handleResize)
    document.removeEventListener('touchend', this.stopResize)
    document.removeEventListener('keydown', this.handleGlobalKeydown)
  },
  
  methods: {
    // Keep ALL your existing methods from the original file
    
    // Resizing methods
    startResize(event) {
      event.preventDefault()
      this.isResizing = true
      
      if (event.type === 'mousedown') {
        this.startX = event.clientX
        this.startY = event.clientY
      } else if (event.type === 'touchstart') {
        this.startX = event.touches[0].clientX
        this.startY = event.touches[0].clientY
      }
      
      this.startLeftWidth = this.leftPanelWidth
      this.startRightWidth = this.rightPanelWidth
      
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.body.classList.add('no-select')
    },
    
    handleResize(event) {
      if (!this.isResizing) return
      
      event.preventDefault()
      
      let currentX
      
      if (event.type === 'mousemove') {
        currentX = event.clientX
      } else if (event.type === 'touchmove') {
        currentX = event.touches[0].clientX
      }
      
      const containerRect = this.$refs.splitContainer.getBoundingClientRect()
      const containerWidth = containerRect.width
      
      const deltaX = currentX - this.startX
      const deltaPercentage = (deltaX / containerWidth) * 100
      
      let newLeftWidth = this.startLeftWidth + deltaPercentage
      let newRightWidth = this.startRightWidth - deltaPercentage
      
      // Apply constraints
      if (newLeftWidth < this.minPanelWidth) {
        newLeftWidth = this.minPanelWidth
        newRightWidth = 100 - newLeftWidth
      } else if (newLeftWidth > this.maxPanelWidth) {
        newLeftWidth = this.maxPanelWidth
        newRightWidth = 100 - newLeftWidth
      }
      
      if (newRightWidth < this.minPanelWidth) {
        newRightWidth = this.minPanelWidth
        newLeftWidth = 100 - newRightWidth
      } else if (newRightWidth > this.maxPanelWidth) {
        newRightWidth = this.maxPanelWidth
        newLeftWidth = 100 - newRightWidth
      }
      
      this.leftPanelWidth = newLeftWidth
      this.rightPanelWidth = newRightWidth
    },
    
    stopResize() {
      if (!this.isResizing) return
      
      this.isResizing = false
      this.isDividerHovered = false
      
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.classList.remove('no-select')
      
      this.savePanelSizes()
      
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    handleResizeKeyboard(event) {
      if (!this.isDividerHovered && !this.isResizing) return
      
      const step = event.shiftKey ? 10 : 5
      let newLeftWidth = this.leftPanelWidth
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newLeftWidth = Math.max(this.minPanelWidth, this.leftPanelWidth - step)
          break
        case 'ArrowRight':
          event.preventDefault()
          newLeftWidth = Math.min(this.maxPanelWidth, this.leftPanelWidth + step)
          break
        case 'Home':
          event.preventDefault()
          newLeftWidth = this.minPanelWidth
          break
        case 'End':
          event.preventDefault()
          newLeftWidth = this.maxPanelWidth
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          newLeftWidth = 50
          break
      }
      
      if (newLeftWidth !== this.leftPanelWidth) {
        this.leftPanelWidth = newLeftWidth
        this.rightPanelWidth = 100 - newLeftWidth
        this.savePanelSizes()
      }
    },
    
    handleGlobalKeydown(event) {
      if (event.key === 'Escape' && this.isResizing) {
        this.leftPanelWidth = this.startLeftWidth
        this.rightPanelWidth = this.startRightWidth
        this.stopResize()
      }
    },
    
    setQuickResize(leftWidth, rightWidth) {
      this.leftPanelWidth = leftWidth
      this.rightPanelWidth = rightWidth
      this.savePanelSizes()
      
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    isQuickResizeActive(leftWidth, rightWidth) {
      return Math.abs(this.leftPanelWidth - leftWidth) < 1 && 
             Math.abs(this.rightPanelWidth - rightWidth) < 1
    },
    
    resetToDefault() {
      this.leftPanelWidth = this.defaultLeftWidth
      this.rightPanelWidth = this.defaultRightWidth
      this.savePanelSizes()
      
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    savePanelSizes() {
      try {
        const sizes = {
          leftWidth: this.leftPanelWidth,
          rightWidth: this.rightPanelWidth
        }
        localStorage.setItem('lesson-panel-sizes', JSON.stringify(sizes))
      } catch (error) {
        console.warn('Could not save panel sizes to localStorage:', error)
      }
    },
    
    loadPanelSizes() {
      try {
        const saved = localStorage.getItem('lesson-panel-sizes')
        if (saved) {
          const sizes = JSON.parse(saved)
          this.leftPanelWidth = sizes.leftWidth || this.defaultLeftWidth
          this.rightPanelWidth = sizes.rightWidth || this.defaultRightWidth
        }
      } catch (error) {
        console.warn('Could not load panel sizes from localStorage:', error)
        this.leftPanelWidth = this.defaultLeftWidth
        this.rightPanelWidth = this.defaultRightWidth
      }
    },

    getLocalized(field) {
      if (typeof field === 'string') return field
      return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim()
    },
    
    // Keep ALL your other existing methods from the original file
    // getCurrentExercise, getCurrentQuiz, handleAnswerChanged, etc...
  }
}
</script>

<style scoped>
.lesson-page {
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

/* Loading and Error States */
.loading-screen,
.error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 32px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #6B46C1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modern Lesson Container */
.lesson-container {
  height: 100vh;
  display: grid;
  grid-rows: auto 1fr auto;
  overflow: hidden;
}

/* Modern Header Design */
.lesson-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px 16px 24px;
  position: relative;
}

.lesson-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.lesson-info {
  flex: 1;
}

.lesson-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 600;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(107, 70, 193, 0.25);
}

.lesson-badge-icon {
  font-size: 1.1rem;
}

.lesson-badge-text {
  font-size: 0.95rem;
}

.lesson-meta {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.9rem;
}

.meta-icon {
  color: #6B46C1;
}

.lesson-actions {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-interactive {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #7dd3fc;
}

.exit-lesson-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.exit-lesson-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.05);
}

/* Progress Bar */
.progress-container {
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6B46C1 0%, #8B5CF6 100%);
  border-radius: inherit;
  transition: width 0.6s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

/* Split Content Layout */
.split-content {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  height: 100%;
  min-height: 0;
  background: #f8fafc;
  gap: 0;
}

.content-panel-wrapper,
.right-panel-wrapper {
  background: white;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Enhanced Resizable Divider */
.split-divider {
  width: 6px;
  background: #e2e8f0;
  cursor: col-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 20;
}

.split-divider:hover,
.split-divider.hover {
  background: #6B46C1;
  width: 8px;
}

.split-divider.active {
  background: #8B5CF6;
  width: 8px;
}

.divider-handle {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  padding: 4px 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  opacity: 0;
}

.split-divider:hover .divider-handle,
.split-divider.active .divider-handle {
  opacity: 1;
}

.divider-grip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.grip-line {
  width: 2px;
  height: 4px;
  background: #6B46C1;
  border-radius: 1px;
}

.divider-tooltip {
  position: absolute;
  left: 150%;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1000;
}

.divider-tooltip.visible {
  opacity: 1;
}

.percentage-display {
  font-weight: 600;
}

/* Quick Resize Controls */
.resize-controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.5);
  z-index: 100;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.lesson-container:hover .resize-controls,
.resize-controls:hover,
.resize-controls:focus-within {
  opacity: 1;
  transform: translateY(0);
}

.controls-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.resize-preset,
.resize-reset {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  position: relative;
}

.resize-preset:hover,
.resize-reset:hover {
  background: #6B46C1;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(107, 70, 193, 0.25);
}

.resize-preset.active {
  background: #6B46C1;
  color: white;
}

/* Resize Indicator */
.resize-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
}

.indicator-content {
  text-align: center;
}

.percentage-display {
  font-size: 1rem;
  margin-bottom: 4px;
  display: block;
}

/* Responsive Design */
@media (max-width: 1023px) {
  .split-content {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto 1fr;
  }
  
  .split-divider {
    width: 100%;
    height: 6px;
    cursor: row-resize;
  }
  
  .split-divider:hover,
  .split-divider.hover {
    height: 8px;
  }
  
  .divider-handle {
    padding: 2px 4px;
  }
  
  .divider-grip {
    flex-direction: row;
  }
  
  .grip-line {
    width: 4px;
    height: 2px;
  }
  
  .divider-tooltip {
    left: 50%;
    top: 120%;
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .lesson-header {
    padding: 16px 20px 12px 20px;
  }
  
  .lesson-header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .lesson-actions {
    align-self: flex-end;
  }
  
  .lesson-meta {
    gap: 16px;
  }
  
  .meta-item {
    font-size: 0.85rem;
  }
  
  .resize-controls {
    bottom: 16px;
    right: 16px;
    padding: 6px 10px;
    gap: 6px;
  }
  
  .controls-label {
    display: none;
  }
  
  .resize-preset,
  .resize-reset {
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .lesson-header {
    padding: 12px 16px 10px 16px;
  }
  
  .lesson-badge {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
  
  .lesson-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .resize-controls {
    bottom: 12px;
    right: 12px;
    padding: 4px 8px;
    gap: 4px;
  }
  
  .resize-preset,
  .resize-reset {
    width: 20px;
    height: 20px;
    font-size: 0.65rem;
  }
}

/* Modal Styles (keeping your existing ones) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 20px;
}

.premium-btn,
.confirm-btn {
  background: linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.premium-btn:hover,
.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(107, 70, 193, 0.25);
}

.cancel-btn {
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #e2e8f0;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.retry-btn {
  background: linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(107, 70, 193, 0.25);
}

.back-btn {
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #e2e8f0;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Focus states for accessibility */
.exit-lesson-btn:focus,
.resize-preset:focus,
.resize-reset:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .lesson-header,
  .content-panel-wrapper,
  .right-panel-wrapper {
    border: 2px solid #000;
  }
  
  .split-divider {
    background: #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .resize-preset:hover,
  .resize-reset:hover,
  .exit-lesson-btn:hover {
    transform: none;
  }
}

/* Print styles */
@media print {
  .lesson-header,
  .resize-controls,
  .resize-indicator,
  .exit-lesson-btn {
    display: none;
  }
  
  .split-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
  }
  
  .split-divider {
    display: none;
  }
  
  .content-panel-wrapper,
  .right-panel-wrapper {
    width: 100% !important;
    height: auto;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .lesson-page {
    background: #0f172a;
  }
  
  .lesson-header {
    background: #1e293b;
    border-bottom-color: #334155;
  }
  
  .lesson-badge {
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
  }
  
  .meta-item {
    color: #cbd5e1;
  }
  
  .meta-icon {
    color: #A78BFA;
  }
  
  .progress-bar {
    background: #334155;
  }
  
  .progress-fill {
    background: linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%);
  }
  
  .progress-text {
    color: #94a3b8;
  }
  
  .split-content {
    background: #0f172a;
  }
  
  .content-panel-wrapper,
  .right-panel-wrapper {
    background: #1e293b;
  }
  
  .split-divider {
    background: #475569;
  }
  
  .split-divider:hover,
  .split-divider.hover {
    background: #8B5CF6;
  }
  
  .resize-controls {
    background: rgba(30, 41, 59, 0.95);
    border-color: #334155;
  }
  
  .controls-label {
    color: #94a3b8;
  }
  
  .resize-preset,
  .resize-reset {
    background: #334155;
    color: #cbd5e1;
  }
  
  .resize-preset:hover,
  .resize-reset:hover {
    background: #8B5CF6;
    color: white;
  }
}
</style>