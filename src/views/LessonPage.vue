<template>
  <!-- ✅ FIXED: Interactive Panel with Guaranteed Visibility and Enhanced Scrolling -->
  <div class="interactive-panel force-visible">
    <!-- Exercise Content -->
    <div v-if="isExerciseStep" class="exercise-content force-visible">
      <!-- Fixed Header -->
      <div class="exercise-header">
        <h3>{{ currentExercise?.title || 'Упражнение' }}</h3>
        <div class="exercise-counter">
          {{ exerciseIndex + 1 }} из {{ totalExercises }}
        </div>
      </div>

      <!-- ✅ ENHANCED: Scrollable Body with Better Touch Support -->
      <div class="exercise-body" ref="exerciseBody">
        <!-- Short Answer Exercise -->
        <div v-if="exerciseType === 'short-answer'" class="exercise-type short-answer force-visible">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          <div class="answer-input">
            <textarea
              v-model="localUserAnswer"
              @input="updateAnswer"
              placeholder="Введите ваш ответ здесь..."
              rows="3"
              class="answer-textarea"
              :disabled="showCorrectAnswer"
            />
          </div>
        </div>

        <!-- Multiple Choice Exercise -->
        <div v-else-if="exerciseType === 'multiple-choice' || exerciseType === 'abc'" class="exercise-type multiple-choice force-visible">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          <div class="options-list">
            <div 
              v-for="(option, index) in exerciseOptions" 
              :key="index"
              class="option-item"
              :class="{ 
                selected: localUserAnswer === option,
                disabled: showCorrectAnswer
              }"
              @click="!showCorrectAnswer && selectOption(option)"
            >
              <input 
                type="radio" 
                :name="'exercise-' + exerciseIndex"
                :value="option"
                v-model="localUserAnswer"
                @change="updateAnswer"
                :disabled="showCorrectAnswer"
                class="option-radio"
              />
              <div class="option-text">{{ option }}</div>
            </div>
          </div>
        </div>

        <!-- Fill in the Blanks Exercise -->
        <div v-else-if="exerciseType === 'fill-blank'" class="exercise-type fill-blank force-visible">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          <div v-if="currentExercise?.template" class="fill-blank-template">
            <div v-html="renderFillBlankTemplate()" />
          </div>
          
          <div class="fill-blank-inputs">
            <div 
              v-for="(blank, index) in blankCount" 
              :key="`blank-${index}-${exerciseIndex}`"
              class="blank-input-group"
            >
              <label :for="`blank-input-${index}`" class="blank-label">
                Пропуск {{ index + 1 }}:
              </label>
              <input
                :id="`blank-input-${index}`"
                type="text"
                class="blank-input"
                :value="getFillBlankValue(index)"
                @input="handleFillBlankInput(index, $event)"
                :placeholder="`Введите ответ ${index + 1}`"
                autocomplete="off"
                :disabled="showCorrectAnswer"
              />
              <div v-if="getFillBlankValue(index)" class="input-preview">
                Введено: "{{ getFillBlankValue(index) }}"
              </div>
            </div>
          </div>
        </div>

        <!-- True/False Exercise -->
        <div v-else-if="exerciseType === 'true-false'" class="exercise-type true-false force-visible">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          <div v-if="currentExercise?.statement" class="statement-text">
            {{ currentExercise.statement }}
          </div>
          <div class="true-false-options">
            <div 
              class="tf-option"
              :class="{ 
                selected: localUserAnswer === 'true',
                disabled: showCorrectAnswer
              }"
              @click="!showCorrectAnswer && selectTrueFalse('true')"
            >
              <input 
                type="radio" 
                name="true-false"
                value="true"
                v-model="localUserAnswer"
                @change="updateAnswer"
                :disabled="showCorrectAnswer"
              />
              <span>Правда</span>
            </div>
            <div 
              class="tf-option"
              :class="{ 
                selected: localUserAnswer === 'false',
                disabled: showCorrectAnswer
              }"
              @click="!showCorrectAnswer && selectTrueFalse('false')"
            >
              <input 
                type="radio" 
                name="true-false"
                value="false"
                v-model="localUserAnswer"
                @change="updateAnswer"
                :disabled="showCorrectAnswer"
              />
              <span>Ложь</span>
            </div>
          </div>
        </div>

        <!-- Matching Exercise -->
        <div v-else-if="exerciseType === 'matching'" class="exercise-type matching force-visible">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          
          <div class="matching-container">
            <!-- Left Side -->
            <div class="matching-side left-side">
              <h4>Соедините:</h4>
              <div 
                v-for="(item, index) in leftItems" 
                :key="`left-${index}`"
                class="matching-item"
                :class="{ 
                  selected: selectedMatchingItem?.side === 'left' && selectedMatchingItem?.index === index,
                  matched: isItemMatched('left', index),
                  disabled: showCorrectAnswer
                }"
                @click="handleMatchingItemClick('left', index)"
              >
                {{ item }}
                <span v-if="selectedMatchingItem?.side === 'left' && selectedMatchingItem?.index === index" class="selection-indicator">👆</span>
              </div>
            </div>
            
            <!-- Right Side -->
            <div class="matching-side right-side">
              <h4>С:</h4>
              <div 
                v-for="(item, index) in rightItems" 
                :key="`right-${index}`"
                class="matching-item"
                :class="{ 
                  selected: selectedMatchingItem?.side === 'right' && selectedMatchingItem?.index === index,
                  matched: isItemMatched('right', index),
                  disabled: showCorrectAnswer
                }"
                @click="handleMatchingItemClick('right', index)"
              >
                {{ item }}
                <span v-if="selectedMatchingItem?.side === 'right' && selectedMatchingItem?.index === index" class="selection-indicator">👆</span>
              </div>
            </div>
          </div>
          
          <!-- Matching Pairs Display -->
          <div v-if="matchingPairs && matchingPairs.length > 0" class="matching-pairs">
            <h4>Соединения:</h4>
            <div 
              v-for="(pair, index) in matchingPairs" 
              :key="`pair-${index}`"
              class="pair-item"
            >
              <span class="pair-text">
                {{ getLeftItemText(pair.leftIndex) }} ↔ {{ getRightItemText(pair.rightIndex) }}
              </span>
              <button 
                v-if="!showCorrectAnswer"
                @click="handleRemovePair(index)" 
                class="remove-pair"
                type="button"
              >×</button>
            </div>
          </div>
          
          <!-- Instructions -->
          <div class="matching-instructions">
            <p>💡 <strong>Инструкция:</strong> Нажмите на элемент слева, затем на соответствующий элемент справа для создания связи.</p>
            <p v-if="selectedMatchingItem" class="current-selection">
              🎯 Выбран элемент: <strong>{{ selectedMatchingItem.side === 'left' ? 'слева' : 'справа' }}</strong> - 
              "{{ selectedMatchingItem.side === 'left' ? leftItems[selectedMatchingItem.index] : rightItems[selectedMatchingItem.index] }}"
            </p>
          </div>
        </div>

        <!-- Ordering Exercise -->
        <div v-else-if="exerciseType === 'ordering'" class="exercise-type ordering force-visible">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          <div class="ordering-instructions">
            💡 <strong>Инструкция:</strong> Перетащите элементы в правильном порядке или используйте кнопки ↑↓ для перемещения
          </div>
          <div class="ordering-container">
            <div 
              v-for="(item, index) in localOrderingItems" 
              :key="`ordering-${item.id || item.text || index}`"
              class="ordering-item"
              :class="{ 
                dragging: draggedOrderingItem === index,
                disabled: showCorrectAnswer,
                'drop-target': dropTargetIndex === index && draggedOrderingItem !== index
              }"
              :draggable="!showCorrectAnswer"
              @dragstart="startOrderingDrag($event, index)"
              @dragend="endOrderingDrag"
              @dragover.prevent="handleOrderingDragOver($event, index)"
              @dragenter.prevent="handleOrderingDragEnter(index)"
              @dragleave="handleOrderingDragLeave"
              @drop.prevent="handleOrderingDrop($event, index)"
            >
              <div class="ordering-item-content">
                <div class="drag-handle" :class="{ disabled: showCorrectAnswer }">≡</div>
                <div class="item-text">{{ getOrderingItemText(item) }}</div>
                <div class="item-number">{{ index + 1 }}</div>
                <div v-if="!showCorrectAnswer" class="ordering-controls">
                  <button 
                    v-if="index > 0"
                    @click="moveOrderingItem(index, index - 1)"
                    class="move-btn move-up"
                    title="Переместить вверх"
                  >↑</button>
                  <button 
                    v-if="index < localOrderingItems.length - 1"
                    @click="moveOrderingItem(index, index + 1)"
                    class="move-btn move-down"
                    title="Переместить вниз"
                  >↓</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ ENHANCED: Drag and Drop Exercise with Better Touch Support -->
        <div v-else-if="exerciseType === 'drag-drop'" class="exercise-type drag-drop force-visible">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          
          <!-- Mobile/Touch Instructions -->
          <div class="touch-instructions">
            <p>📱 <strong>На мобильных:</strong> Коснитесь элемента, затем коснитесь зоны назначения</p>
            <p>🖱️ <strong>На компьютере:</strong> Перетащите элементы в нужные зоны</p>
          </div>
          
          <div v-if="availableDragItems.length > 0 && dropZones.length > 0" class="drag-drop-container">
            <!-- Available Items to Drag -->
            <div class="drag-items">
              <h4>Элементы для перемещения:</h4>
              <div class="drag-items-scroll">
                <div 
                  v-for="(item, index) in availableDragItems" 
                  :key="'drag-' + index"
                  class="drag-item"
                  :class="{ 
                    dragging: draggedDragItem === item,
                    disabled: showCorrectAnswer,
                    selected: selectedTouchItem === item
                  }"
                  :draggable="!showCorrectAnswer && !isTouchDevice"
                  @dragstart="startDragItem(item, $event)"
                  @dragend="endDragItem"
                  @click="handleTouchItemSelect(item)"
                  @touchend.prevent="handleTouchItemSelect(item)"
                >
                  {{ getDragItemText(item) }}
                  <span v-if="selectedTouchItem === item" class="touch-selected-indicator">👆</span>
                </div>
              </div>
            </div>

            <!-- Drop Zones -->
            <div class="drop-zones">
              <h4>Зоны назначения:</h4>
              <div class="drop-zones-scroll">
                <div 
                  v-for="(zone, index) in dropZones" 
                  :key="'zone-' + index"
                  class="drop-zone"
                  :class="{ 
                    'drag-over': dropOverZone === getZoneId(zone),
                    disabled: showCorrectAnswer,
                    'touch-highlight': touchHighlightZone === getZoneId(zone)
                  }"
                  @dragover.prevent="dragOverZone(getZoneId(zone), $event)"
                  @dragleave="dragLeaveZone($event)"
                  @drop="dropInZone(getZoneId(zone), $event)"
                  @click="handleTouchZoneSelect(getZoneId(zone))"
                  @touchend.prevent="handleTouchZoneSelect(getZoneId(zone))"
                >
                  <div class="zone-label">{{ zone.label }}</div>
                  <div class="zone-items">
                    <div 
                      v-for="(item, itemIndex) in getDropZoneItems(getZoneId(zone))" 
                      :key="'dropped-' + itemIndex"
                      class="dropped-item"
                      @click="!showCorrectAnswer && removeDroppedItem(getZoneId(zone), itemIndex)"
                    >
                      {{ getDragItemText(item) }}
                      <span v-if="!showCorrectAnswer" class="remove-dropped">×</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-dragdrop-data">
            <p>⚠️ Данные для перетаскивания не загружены</p>
          </div>
        </div>

        <!-- Confirmation Section -->
        <div v-if="confirmation" class="confirmation-section">
          <!-- Second Chance Indicator -->
          <div v-if="isOnSecondChance && !showCorrectAnswer" class="second-chance-indicator">
            <div class="attempt-counter">
              <span class="attempt-text">Попытка {{ attemptCount }} из {{ maxAttempts }}</span>
              <div class="attempt-dots">
                <div 
                  v-for="n in maxAttempts" 
                  :key="n"
                  class="attempt-dot"
                  :class="{ 
                    filled: n <= attemptCount,
                    current: n === attemptCount + 1 && !showCorrectAnswer
                  }"
                />
              </div>
            </div>
          </div>

          <!-- Confirmation Message -->
          <div 
            class="confirmation-message" 
            :class="{ 
              correct: answerWasCorrect, 
              incorrect: !answerWasCorrect && !showCorrectAnswer,
              'show-answer': showCorrectAnswer
            }"
          >
            {{ confirmation }}
          </div>

          <!-- Correct Answer Display -->
          <div v-if="showCorrectAnswer && correctAnswerText" class="correct-answer-display">
            <div class="correct-answer-label">💡 Правильный ответ:</div>
            <div class="correct-answer-text">{{ correctAnswerText }}</div>
          </div>
        </div>

        <!-- Hints and Feedback -->
        <div v-if="(currentHint || smartHint) && !showCorrectAnswer" class="hints-section">
          <div v-if="currentHint" class="hint basic-hint">
            <div class="hint-icon">💡</div>
            <div class="hint-text">{{ currentHint }}</div>
          </div>
          <div v-if="smartHint" class="hint smart-hint">
            <div class="hint-icon">🤖</div>
            <div class="hint-text">{{ smartHint }}</div>
            <button @click="$emit('clear-hint')" class="clear-hint-btn">×</button>
          </div>
        </div>
      </div>

      <!-- ✅ ENHANCED: Action Buttons with Better Layout -->
      <div class="exercise-actions">
        <button 
          v-if="!confirmation && attemptCount === 0"
          @click="$emit('show-hint')" 
          class="hint-btn"
        >
          💡 Подсказка
        </button>
        
        <button 
          v-if="!confirmation || (isOnSecondChance && !showCorrectAnswer)"
          @click="$emit('submit')"
          :disabled="!canSubmitAnswer"
          class="submit-btn"
          :class="{ 
            disabled: !canSubmitAnswer,
            'second-chance': isOnSecondChance
          }"
        >
          {{ isOnSecondChance ? 'Попробовать ещё раз' : 'Проверить' }}
          <span v-if="isOnSecondChance" class="second-chance-icon">🔄</span>
        </button>
        
        <button 
          v-if="confirmation && (answerWasCorrect || showCorrectAnswer)"
          @click="$emit('next-exercise')"
          class="next-btn"
        >
          {{ isLastExercise ? 'Завершить' : 'Далее' }}
          <span class="next-icon">→</span>
        </button>
      </div>
    </div>

    <!-- Quiz Content -->
    <div v-else-if="isQuizStep" class="quiz-content force-visible">
      <!-- Fixed Header -->
      <div class="quiz-header">
        <h3>{{ currentQuiz?.title || 'Вопрос' }}</h3>
        <div class="quiz-counter">
          {{ quizIndex + 1 }} из {{ totalQuizzes }}
        </div>
      </div>

      <!-- ✅ ENHANCED: Scrollable Body -->
      <div class="quiz-body" ref="quizBody">
        <div class="quiz-question">
          {{ currentQuiz?.question }}
        </div>

        <div class="quiz-options">
          <div 
            v-for="(option, index) in quizOptions" 
            :key="index"
            class="quiz-option"
            :class="{ 
              selected: localUserAnswer === option,
              disabled: showCorrectAnswer
            }"
            @click="!showCorrectAnswer && selectQuizOption(option)"
          >
            <input 
              type="radio" 
              :name="'quiz-' + quizIndex"
              :value="option"
              v-model="localUserAnswer"
              @change="updateAnswer"
              :disabled="showCorrectAnswer"
              class="option-radio"
            />
            <div class="option-text">{{ option }}</div>
          </div>
        </div>

        <!-- Quiz Confirmation Section -->
        <div v-if="confirmation" class="confirmation-section">
          <div v-if="isOnSecondChance && !showCorrectAnswer" class="second-chance-indicator">
            <div class="attempt-counter">
              <span class="attempt-text">Попытка {{ attemptCount }} из {{ maxAttempts }}</span>
              <div class="attempt-dots">
                <div 
                  v-for="n in maxAttempts" 
                  :key="n"
                  class="attempt-dot"
                  :class="{ 
                    filled: n <= attemptCount,
                    current: n === attemptCount + 1 && !showCorrectAnswer
                  }"
                />
              </div>
            </div>
          </div>

          <div 
            class="confirmation-message" 
            :class="{ 
              correct: answerWasCorrect, 
              incorrect: !answerWasCorrect && !showCorrectAnswer,
              'show-answer': showCorrectAnswer
            }"
          >
            {{ confirmation }}
          </div>

          <div v-if="showCorrectAnswer && correctAnswerText" class="correct-answer-display">
            <div class="correct-answer-label">💡 Правильный ответ:</div>
            <div class="correct-answer-text">{{ correctAnswerText }}</div>
          </div>
        </div>
      </div>

      <!-- ✅ ENHANCED: Action Buttons -->
      <div class="quiz-actions">
        <button 
          v-if="!confirmation || (isOnSecondChance && !showCorrectAnswer)"
          @click="$emit('submit')"
          :disabled="!canSubmitAnswer"
          class="submit-btn"
          :class="{ 
            disabled: !canSubmitAnswer,
            'second-chance': isOnSecondChance
          }"
        >
          {{ isOnSecondChance ? 'Попробовать ещё раз' : 'Ответить' }}
          <span v-if="isOnSecondChance" class="second-chance-icon">🔄</span>
        </button>
        
        <button 
          v-if="confirmation && (answerWasCorrect || showCorrectAnswer)"
          @click="$emit('next-quiz')"
          class="next-btn"
        >
          {{ isLastQuiz ? 'Завершить' : 'Следующий вопрос' }}
          <span class="next-icon">→</span>
        </button>
      </div>
    </div>

    <!-- No Content State -->
    <div v-else class="no-content force-visible">
      <div class="no-content-icon">📝</div>
      <h4>Нет интерактивного содержимого</h4>
      <p>Для этого шага нет упражнений или вопросов</p>
    </div>
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
import ProgressBar from '@/components/lesson/ProgressBar.vue'
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
    // RESIZABLE SPLIT SCREEN STATE
    // ==========================================
    const isResizing = ref(false)
    const startX = ref(0)
    const startY = ref(0)
    const startWidthLeft = ref(50)
    const startWidthRight = ref(50)
    const currentLeftWidth = ref(50)
    const currentRightWidth = ref(50)
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
    // RESIZABLE SPLIT SCREEN COMPUTED PROPERTIES
    // ==========================================
    const leftPanelStyle = computed(() => {
      const isVertical = window.innerWidth <= 1023
      if (isVertical) {
        return { 
          flex: `1 1 ${currentLeftWidth.value}%`,
          minHeight: '200px',
          maxHeight: currentLeftWidth.value >= 75 ? '75%' : 'none'
        }
      }
      return { 
        flex: `0 0 ${currentLeftWidth.value}%`,
        minWidth: '300px',
        maxWidth: currentLeftWidth.value >= 75 ? '75%' : 'none'
      }
    })

    const rightPanelStyle = computed(() => {
      const isVertical = window.innerWidth <= 1023
      if (isVertical) {
        return { 
          flex: `1 1 ${currentRightWidth.value}%`,
          minHeight: '200px',
          maxHeight: currentRightWidth.value >= 75 ? '75%' : 'none'
        }
      }
      return { 
        flex: `0 0 ${currentRightWidth.value}%`,
        minWidth: '300px',
        maxWidth: currentRightWidth.value >= 75 ? '75%' : 'none'
      }
    })

    const widthIndicatorText = computed(() => {
      return `${Math.round(currentLeftWidth.value)}% | ${Math.round(currentRightWidth.value)}%`
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
    // RESIZABLE SPLIT SCREEN METHODS
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
      
       ('🔧 Started resizing:', resizeDirection.value)
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
      
      // Apply constraints (25% minimum, 75% maximum)
      const minWidth = 25
      const maxWidth = 75
      
      if (newLeftWidth < minWidth) {
        newLeftWidth = minWidth
        newRightWidth = 100 - newLeftWidth
      } else if (newLeftWidth > maxWidth) {
        newLeftWidth = maxWidth
        newRightWidth = 100 - newLeftWidth
      }
      
      if (newRightWidth < minWidth) {
        newRightWidth = minWidth
        newLeftWidth = 100 - newRightWidth
      } else if (newRightWidth > maxWidth) {
        newRightWidth = maxWidth
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
      
       ('✅ Stopped resizing. Final sizes:', {
        left: Math.round(currentLeftWidth.value),
        right: Math.round(currentRightWidth.value)
      })
    }

    // Keyboard support for accessibility
    const handleResizeKeyboard = (event) => {
      const step = 5 // 5% step size
      let newLeftWidth = currentLeftWidth.value
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newLeftWidth = Math.max(25, currentLeftWidth.value - step)
          break
        case 'ArrowRight':
          event.preventDefault()
          newLeftWidth = Math.min(75, currentLeftWidth.value + step)
          break
        case 'ArrowUp':
          if (resizeDirection.value === 'vertical') {
            event.preventDefault()
            newLeftWidth = Math.max(25, currentLeftWidth.value - step)
          }
          break
        case 'ArrowDown':
          if (resizeDirection.value === 'vertical') {
            event.preventDefault()
            newLeftWidth = Math.min(75, currentLeftWidth.value + step)
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

    // Function to reset to default sizes
    const resetSplitSizes = () => {
      currentLeftWidth.value = 50
      currentRightWidth.value = 50
      
      // Remove saved sizes from localStorage
      try {
        localStorage.removeItem('lessonPageSplitSizes')
      } catch (error) {
        console.warn('Could not remove saved sizes from localStorage:', error)
      }
      
       ('🔄 Reset split sizes to default (50/50)')
    }

    // Function to load saved sizes from localStorage
    const loadSavedSizes = () => {
      try {
        const saved = localStorage.getItem('lessonPageSplitSizes')
        if (saved) {
          const { left, right, timestamp } = JSON.parse(saved)
          
          // Check if saved data is recent (within 30 days)
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
          if (timestamp && timestamp > thirtyDaysAgo) {
            currentLeftWidth.value = Math.max(25, Math.min(75, left || 50))
            currentRightWidth.value = Math.max(25, Math.min(75, right || 50))
             ('📊 Loaded saved split sizes:', { left: currentLeftWidth.value, right: currentRightWidth.value })
          } else {
            // Remove old data
            localStorage.removeItem('lessonPageSplitSizes')
          }
        }
      } catch (error) {
        console.warn('Could not load saved sizes from localStorage:', error)
      }
    }

    // Handle window resize
    const handleWindowResize = () => {
      const wasVertical = resizeDirection.value === 'vertical'
      const isNowVertical = window.innerWidth <= 1023
      
      if (wasVertical !== isNowVertical) {
        resizeDirection.value = isNowVertical ? 'vertical' : 'horizontal'
         ('📱 Resize direction changed to:', resizeDirection.value)
      }
    }

    // ==========================================
    // NAVIGATION METHODS
    // ==========================================
    const handleReturnToCatalogue = () => {
       ('🔄 Returning to catalogue...')
      
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
       ('📚 Navigating to homework...')
      
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
       ('🚪 Exiting lesson...')
      
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
        
         ('📊 Problem Report Submitted:', {
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

    // ==========================================
    // VOCABULARY METHODS
    // ==========================================
    const initializeVocabularyModal = (step) => {
       ('📚 Initializing vocabulary modal from LessonPage:', step)

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
           ('✅ Found vocabulary step in lesson, using first one:', vocabularySteps[0])
          vocabularyStep = vocabularySteps[0]
        } else {
          console.error('❌ No vocabulary steps found in entire lesson')
          return
        }
      }

      vocabulary.initializeVocabularyModal(vocabularyStep)
    }

    const jumpToVocabWord = (index) => {
       ('🎯 Jumping to vocabulary word:', index)

      if (index >= 0 && index < vocabulary.vocabularyModal.words.length) {
        vocabulary.cardAnimation.isFlipping = false
        vocabulary.cardAnimation.showDefinition = false

        setTimeout(() => {
          vocabulary.vocabularyModal.currentIndex = index
           (`✅ Jumped to word ${index + 1}/${vocabulary.vocabularyModal.words.length}`)
        }, 50)
      } else {
        console.warn('⚠️ Invalid vocabulary word index:', index)
      }
    }

    const showVocabDefinition = () => {
       ('🔄 Showing vocabulary definition')
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

    // ==========================================
    // EXERCISE METHODS
    // ==========================================
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

    // ==========================================
    // DRAG AND DROP EVENT HANDLERS
    // ==========================================
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

    // ==========================================
    // DRAG & DROP HELPER METHODS
    // ==========================================
    const ensureDragDropInitialization = () => {
      const currentExercise = getCurrentExercise()
      
      if (!currentExercise || currentExercise.type !== 'drag-drop') {
        return
      }
      
      
      if (exercises.availableDragItems.value.length === 0 || exercises.dropZones.value.length === 0) {
        exercises.initializeDragDropItems(currentExercise)
      }
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================
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

    // ==========================================
    // SUBMISSION HANDLER
    // ==========================================
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

    // ==========================================
    // NAVIGATION FUNCTIONS
    // ==========================================
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

    // ==========================================
    // SIMPLIFIED EXERCISE METHODS
    // ==========================================
    const showHint = (exercise) => exercises.showHint(exercise)
    const clearSmartHint = () => exercises.clearSmartHint()

    // ==========================================
    // AI HELP PANEL METHODS
    // ==========================================
    const toggleExplanationHelp = explanation.toggleExplanationHelp
    const askAboutExplanation = explanation.askAboutExplanation
    const sendAIMessage = explanation.sendAIMessage
    const askAI = explanation.askAI
    const clearAIChat = explanation.clearAIChat

    // ==========================================
    // FLOATING AI ASSISTANT METHODS
    // ==========================================
    const toggleFloatingAI = explanation.toggleFloatingAI
    const closeFloatingAI = explanation.closeFloatingAI
    const sendFloatingAIMessage = explanation.sendFloatingAIMessage

    // ==========================================
    // CONFETTI ANIMATION
    // ==========================================
    const startConfetti = () => {
      showConfetti.value = true
      nextTick(() => {
        setTimeout(() => {
          showConfetti.value = false
        }, 5000)
      })
    }

    // ==========================================
    // MIGRATION FUNCTIONALITY
    // ==========================================
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

    // ==========================================
    // LESSON COMPLETION WITH EXTRACTION
    // ==========================================
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
      } else {
      }

      lessonOrchestrator.lessonCompleted.value = true
      extractionResults.value = extractionResult
    }

    // ==========================================
    // LIFECYCLE HOOKS
    // ==========================================
    onMounted(() => {
      document.addEventListener('keydown', handleKeyboardShortcuts)
      window.addEventListener('resize', handleWindowResize)
      
      // Load saved split sizes
      loadSavedSizes()
      
      // Make debug functions globally available
      window.resetSplitSizes = resetSplitSizes
      window.loadSavedSizes = loadSavedSizes
      
      
     
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
    })

    // ==========================================
    // WATCHERS
    // ==========================================
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
    })

    // ==========================================
    // RETURN ALL PROPS AND METHODS
    // ==========================================
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