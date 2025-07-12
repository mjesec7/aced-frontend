<template>
    <div class="interactive-panel">
      <!-- Exercise Content -->
      <div v-if="isExerciseStep" class="exercise-content">
        <div class="exercise-header">
          <h3>{{ currentExercise?.title || 'Упражнение' }}</h3>
          <div class="exercise-counter">
            {{ exerciseIndex + 1 }} из {{ totalExercises }}
          </div>
        </div>
  
        <div class="exercise-body">
          <!-- Short Answer Exercise -->
          <div v-if="exerciseType === 'short-answer'" class="exercise-type short-answer">
            <div class="question-text">
              {{ currentExercise?.question }}
            </div>
            <div class="answer-input">
              <textarea
                v-model="localUserAnswer"
                @input="$emit('answer-changed', $event.target.value)"
                placeholder="Введите ваш ответ здесь..."
                rows="3"
                class="answer-textarea"
                :disabled="showCorrectAnswer"
              ></textarea>
            </div>
          </div>
    
          <!-- Multiple Choice Exercise -->
          <div v-else-if="exerciseType === 'multiple-choice' || exerciseType === 'abc'" class="exercise-type multiple-choice">
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
                <div class="option-radio">
                  <input 
                    type="radio" 
                    :name="'exercise-' + exerciseIndex"
                    :value="option"
                    v-model="localUserAnswer"
                    @change="$emit('answer-changed', option)"
                    :disabled="showCorrectAnswer"
                  />
                </div>
                <div class="option-text">{{ option }}</div>
              </div>
            </div>
          </div>
    
          <!-- ✅ FIXED: Fill in the Blanks Exercise -->
          <div v-else-if="exerciseType === 'fill-blank'" class="exercise-type fill-blank">
            <div class="question-text">
              {{ currentExercise?.question }}
            </div>
            <div v-if="currentExercise?.template" class="fill-blank-template">
              <div v-html="renderFillBlankTemplate()"></div>
            </div>
            
            <!-- ✅ CRITICAL: Fixed fill-blank inputs -->
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
                  @keyup="handleFillBlankInput(index, $event)"
                  @change="handleFillBlankInput(index, $event)"
                  :placeholder="`Введите ответ ${index + 1}`"
                  autocomplete="off"
                  :disabled="showCorrectAnswer"
                />
                <!-- ✅ DEBUG: Show current value -->
                <div v-if="getFillBlankValue(index)" class="input-preview">
                  Введено: "{{ getFillBlankValue(index) }}"
                </div>
              </div>
            </div>
            
            <!-- ✅ DEBUG: Show state (remove in production) -->
            <div v-if="showDebugInfo" class="debug-section">
              <h4>Debug Info:</h4>
              <p>fillBlankAnswers prop: {{ JSON.stringify(fillBlankAnswers) }}</p>
              <p>localFillBlankAnswers: {{ JSON.stringify(localFillBlankAnswers) }}</p>
              <p>blankCount: {{ blankCount }}</p>
              <button @click="debugFillBlank" class="debug-btn">Debug</button>
            </div>
          </div>
    
          <!-- Matching Exercise -->
          <div v-else-if="exerciseType === 'matching'" class="exercise-type matching">
            <div class="question-text">
              {{ currentExercise?.question }}
            </div>
            <div class="matching-container">
              <div class="matching-side left-side">
                <h4>Соедините:</h4>
                <div 
                  v-for="(item, index) in leftItems" 
                  :key="'left-' + index"
                  class="matching-item"
                  :class="{ 
                    selected: selectedMatchingItem?.side === 'left' && selectedMatchingItem?.index === index,
                    matched: isItemMatched('left', index),
                    disabled: showCorrectAnswer
                  }"
                  @click="!showCorrectAnswer && selectMatchingItem('left', index)"
                >
                  {{ item }}
                </div>
              </div>
              <div class="matching-side right-side">
                <h4>С:</h4>
                <div 
                  v-for="(item, index) in rightItems" 
                  :key="'right-' + index"
                  class="matching-item"
                  :class="{ 
                    selected: selectedMatchingItem?.side === 'right' && selectedMatchingItem?.index === index,
                    matched: isItemMatched('right', index),
                    disabled: showCorrectAnswer
                  }"
                  @click="!showCorrectAnswer && selectMatchingItem('right', index)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
            <div v-if="matchingPairs.length > 0" class="matching-pairs">
              <h4>Соединения:</h4>
              <div 
                v-for="(pair, index) in matchingPairs" 
                :key="index"
                class="pair-item"
              >
                <span>{{ leftItems[pair.leftIndex] }} ↔ {{ rightItems[pair.rightIndex] }}</span>
                <button 
                  v-if="!showCorrectAnswer"
                  @click="removeMatchingPair(index)" 
                  class="remove-pair"
                >×</button>
              </div>
            </div>
          </div>
    
          <!-- True/False Exercise -->
          <div v-else-if="exerciseType === 'true-false'" class="exercise-type true-false">
            <div class="question-text">
              {{ currentExercise?.question }}
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
                  @change="$emit('answer-changed', 'true')"
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
                  @change="$emit('answer-changed', 'false')"
                  :disabled="showCorrectAnswer"
                />
                <span>Ложь</span>
              </div>
            </div>
          </div>
    
          <!-- Ordering Exercise -->
          <div v-else-if="exerciseType === 'ordering'" class="exercise-type ordering">
            <div class="question-text">
              {{ currentExercise?.question }}
            </div>
            <div class="ordering-instructions">
              Перетащите элементы в правильном порядке:
            </div>
            <div class="ordering-container">
              <div 
                v-for="(item, index) in orderingItems" 
                :key="item.id"
                class="ordering-item"
                :class="{ 
                  dragging: draggedItem === index,
                  disabled: showCorrectAnswer
                }"
                :draggable="!showCorrectAnswer"
                @dragstart="!showCorrectAnswer && startDrag(index)"
                @dragover.prevent
                @drop="!showCorrectAnswer && handleDrop(index)"
              >
                <div class="drag-handle">≡</div>
                <div class="item-text">{{ item.text }}</div>
                <div class="item-number">{{ index + 1 }}</div>
              </div>
            </div>
          </div>
    
          <!-- Drag and Drop Exercise -->
          <div v-else-if="exerciseType === 'drag-drop'" class="exercise-type drag-drop">
            <div class="question-text">
              {{ currentExercise?.question }}
            </div>
            <div class="drag-drop-container">
              <div class="drag-items">
                <h4>Перетащите элементы:</h4>
                <div 
                  v-for="(item, index) in availableDragItems" 
                  :key="'drag-' + index"
                  class="drag-item"
                  :class="{ 
                    dragging: draggedDragItem === item,
                    disabled: showCorrectAnswer
                  }"
                  :draggable="!showCorrectAnswer"
                  @dragstart="!showCorrectAnswer && startDragItem(item, $event)"
                  @dragend="endDragItem"
                >
                  {{ getDragItemText(item) }}
                </div>
              </div>
              <div class="drop-zones">
                <div 
                  v-for="(zone, index) in dropZones" 
                  :key="'zone-' + index"
                  class="drop-zone"
                  :class="{ 
                    'drag-over': dropOverZone === getZoneId(zone),
                    disabled: showCorrectAnswer
                  }"
                  @dragover.prevent="!showCorrectAnswer && dragOverZone(getZoneId(zone), $event)"
                  @dragleave="!showCorrectAnswer && dragLeaveZone($event)"
                  @drop="!showCorrectAnswer && dropInZone(getZoneId(zone), $event)"
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
  
          <!-- ✅ Enhanced Confirmation Section with Second Chance -->
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
                  ></div>
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
  
        <!-- ✅ Enhanced Exercise Actions -->
        <div class="exercise-actions">
          <!-- Hint Button (only on first attempt) -->
          <button 
            v-if="!confirmation && attemptCount === 0"
            @click="$emit('show-hint')" 
            class="hint-btn"
          >
            💡 Подсказка
          </button>
          
          <!-- Submit Button -->
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
          
          <!-- Next Button -->
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
      <div v-else-if="isQuizStep" class="quiz-content">
        <div class="quiz-header">
          <h3>{{ currentQuiz?.title || 'Вопрос' }}</h3>
          <div class="quiz-counter">
            {{ quizIndex + 1 }} из {{ totalQuizzes }}
          </div>
        </div>
  
        <div class="quiz-body">
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
              <div class="option-radio">
                <input 
                  type="radio" 
                  :name="'quiz-' + quizIndex"
                  :value="option"
                  v-model="localUserAnswer"
                  @change="$emit('answer-changed', option)"
                  :disabled="showCorrectAnswer"
                />
              </div>
              <div class="option-text">{{ option }}</div>
            </div>
          </div>
  
          <!-- Quiz Confirmation Section -->
          <div v-if="confirmation" class="confirmation-section">
            <!-- Second Chance Indicator for Quiz -->
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
                  ></div>
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
  
            <!-- Correct Answer Display for Quiz -->
            <div v-if="showCorrectAnswer && correctAnswerText" class="correct-answer-display">
              <div class="correct-answer-label">💡 Правильный ответ:</div>
              <div class="correct-answer-text">{{ correctAnswerText }}</div>
            </div>
          </div>
        </div>
  
        <!-- Quiz Actions -->
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
      <div v-else class="no-content">
        <div class="no-content-icon">📝</div>
        <h4>Нет интерактивного содержимого</h4>
        <p>Для этого шага нет упражнений или вопросов</p>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, watch, onMounted, nextTick } from 'vue'
  
  export default {
    name: 'InteractivePanel',
    props: {
      currentStep: Object,
      currentExercise: Object,
      currentQuiz: Object,
      exerciseIndex: { type: Number, default: 0 },
      quizIndex: { type: Number, default: 0 },
      totalExercises: { type: Number, default: 0 },
      totalQuizzes: { type: Number, default: 0 },
      userAnswer: [String, Array, Object],
      confirmation: String,
      answerWasCorrect: Boolean,
      currentHint: String,
      smartHint: String,
      mistakeCount: { type: Number, default: 0 },
      fillBlankAnswers: { type: Array, default: () => [] },
      matchingPairs: { type: Array, default: () => [] },
      selectedMatchingItem: Object,
      orderingItems: { type: Array, default: () => [] },
      dragDropPlacements: { type: Object, default: () => ({}) },
      draggedItem: Number,
      dropTarget: Number,
      availableDragItems: { type: Array, default: () => [] },
      dropZones: { type: Array, default: () => [] },
      // ✅ NEW: Second chance system props
      attemptCount: { type: Number, default: 0 },
      maxAttempts: { type: Number, default: 2 },
      isOnSecondChance: { type: Boolean, default: false },
      showCorrectAnswer: { type: Boolean, default: false },
      correctAnswerText: { type: String, default: '' }
    },
    emits: [
      'answer-changed',
      'fill-blank-updated',
      'submit',
      'next-exercise',
      'next-quiz',
      'show-hint',
      'clear-hint',
      'matching-item-selected',
      'remove-matching-pair',
      'drag-start',
      'drag-drop',
      'drag-item-start',
      'drag-over-zone',
      'drag-leave-zone',
      'drop-in-zone',
      'remove-dropped-item'
    ],
    setup(props, { emit }) {
      // Local reactive state
      const localUserAnswer = ref('')
      const localFillBlankAnswers = ref([])
      const draggedDragItem = ref(null)
      const dropOverZone = ref(null)
      const showDebugInfo = ref(true) // Set to false in production
  
      // ✅ FIXED: Computed properties
      const isExerciseStep = computed(() => {
        return ['exercise', 'practice'].includes(props.currentStep?.type)
      })
      
      const isQuizStep = computed(() => {
        return props.currentStep?.type === 'quiz'
      })
      
      const exerciseType = computed(() => {
        return props.currentExercise?.type || 'short-answer'
      })
      
      const exerciseOptions = computed(() => {
        if (!props.currentExercise?.options) return []
        return props.currentExercise.options.map(option => {
          if (typeof option === 'string') return option
          return option?.text || option?.label || String(option)
        })
      })
      
      const quizOptions = computed(() => {
        if (!props.currentQuiz?.options) return []
        return props.currentQuiz.options.map(option => {
          if (typeof option === 'string') return option
          return option?.text || option?.label || String(option)
        })
      })
      
      const leftItems = computed(() => {
        if (!props.currentExercise?.pairs) return []
        return props.currentExercise.pairs.map(pair => {
          if (Array.isArray(pair)) return pair[0] || ''
          return pair?.left || ''
        })
      })
      
      const rightItems = computed(() => {
        if (!props.currentExercise?.pairs) return []
        return props.currentExercise.pairs.map(pair => {
          if (Array.isArray(pair)) return pair[1] || ''
          return pair?.right || ''
        })
      })
      
      const isLastExercise = computed(() => {
        return props.exerciseIndex >= props.totalExercises - 1
      })
      
      const isLastQuiz = computed(() => {
        return props.quizIndex >= props.totalQuizzes - 1
      })
  
      // ✅ FIXED: Blank count computation
      const blankCount = computed(() => {
        if (!props.currentExercise) return 0
        
        // Check for explicit blanks array
        if (props.currentExercise.blanks && Array.isArray(props.currentExercise.blanks)) {
          return props.currentExercise.blanks.length
        }
        
        if (props.currentExercise.correctAnswers && Array.isArray(props.currentExercise.correctAnswers)) {
          return props.currentExercise.correctAnswers.length
        }
        
        if (props.currentExercise.answers && Array.isArray(props.currentExercise.answers)) {
          return props.currentExercise.answers.length
        }
        
        // Parse template/question for blanks
        const template = props.currentExercise.template || props.currentExercise.question || ''
        const underscoreMatches = template.match(/_+/g) || []
        const blankMatches = template.match(/\[blank\]/gi) || []
        const curlyBraceMatches = template.match(/\{[^}]*\}/g) || []
        
        return Math.max(
          underscoreMatches.length, 
          blankMatches.length, 
          curlyBraceMatches.length,
          1
        )
      })
      
      // ✅ FIXED: Improved validation logic
      const canSubmitAnswer = computed(() => {
        // For multiple choice, true/false - must have selected an option
        if (exerciseType.value === 'multiple-choice' || 
            exerciseType.value === 'abc' || 
            exerciseType.value === 'true-false') {
          return localUserAnswer.value && String(localUserAnswer.value).trim()
        }
        
        // For short answer - must have meaningful content (at least 1 character)
        if (exerciseType.value === 'short-answer') {
          const answer = String(localUserAnswer.value || '').trim()
          return answer.length >= 1
        }
        
        // For fill-in-the-blank - at least one blank must be filled with meaningful content
        if (exerciseType.value === 'fill-blank') {
          console.log('🔍 Checking fill-blank submit capability:', {
            localFillBlankAnswers: localFillBlankAnswers.value,
            fillBlankAnswers: props.fillBlankAnswers,
            blankCount: blankCount.value
          })
          
          // Check both local and prop arrays
          const answersToCheck = localFillBlankAnswers.value.length > 0 
            ? localFillBlankAnswers.value 
            : props.fillBlankAnswers
            
          return answersToCheck.some(answer => {
            const trimmed = String(answer || '').trim()
            return trimmed.length >= 1
          })
        }
        
        // For matching - must have at least one pair
        if (exerciseType.value === 'matching') {
          return props.matchingPairs.length > 0
        }
        
        // For ordering - must have items
        if (exerciseType.value === 'ordering') {
          return props.orderingItems.length > 0
        }
        
        // For drag-drop - must have at least one placement
        if (exerciseType.value === 'drag-drop') {
          const placements = Object.values(props.dragDropPlacements || {})
          return placements.some(items => Array.isArray(items) && items.length > 0)
        }
        
        return false
      })
  
      // ✅ CRITICAL: Methods for fill-blank handling
      const getFillBlankValue = (index) => {
        // Try local first, then prop
        if (localFillBlankAnswers.value[index] !== undefined) {
          return localFillBlankAnswers.value[index]
        }
        return props.fillBlankAnswers[index] || ''
      }
  
      const handleFillBlankInput = (index, event) => {
        const value = event.target.value
        console.log('📝 Fill-blank input:', { index, value })
        
        // Update local array
        while (localFillBlankAnswers.value.length <= index) {
          localFillBlankAnswers.value.push('')
        }
        localFillBlankAnswers.value[index] = value
        
        // Force reactivity
        localFillBlankAnswers.value = [...localFillBlankAnswers.value]
        
        // Emit to parent
        emit('fill-blank-updated', index, event)
        
        console.log('✅ Updated local fill-blank answers:', localFillBlankAnswers.value)
      }
  
      const debugFillBlank = () => {
        console.log('🔍 Fill-blank debug:', {
          exerciseType: exerciseType.value,
          currentExercise: props.currentExercise,
          blankCount: blankCount.value,
          localFillBlankAnswers: localFillBlankAnswers.value,
          fillBlankAnswers: props.fillBlankAnswers,
          canSubmit: canSubmitAnswer.value
        })
      }
  
      // ✅ FIXED: Template rendering
      const renderFillBlankTemplate = () => {
        if (!props.currentExercise?.template) return ''
        
        let template = props.currentExercise.template
        let blankIndex = 0
        
        // Replace underscores with blank indicators
        template = template.replace(/_+/g, () => {
          return `<span class="blank-indicator">[Пропуск ${++blankIndex}]</span>`
        })
        
        // Replace [blank] markers
        template = template.replace(/\[blank\]/gi, () => {
          return `<span class="blank-indicator">[Пропуск ${++blankIndex}]</span>`
        })
        
        return template
      }
  
      // ✅ OTHER METHODS
      const selectOption = (option) => {
        localUserAnswer.value = option
        emit('answer-changed', option)
      }
  
      const selectQuizOption = (option) => {
        localUserAnswer.value = option
        emit('answer-changed', option)
      }
  
      const selectTrueFalse = (value) => {
        localUserAnswer.value = value
        emit('answer-changed', value)
      }
  
      // ✅ FIXED: Matching Methods
      const selectMatchingItem = (side, index) => {
        console.log('🔍 Selecting matching item:', { side, index })
        
        const currentSelection = props.selectedMatchingItem
        
        // If no previous selection, select this item
        if (!currentSelection) {
          emit('matching-item-selected', { side, index })
          return
        }
        
        // If clicking the same item, deselect
        if (currentSelection.side === side && currentSelection.index === index) {
          emit('matching-item-selected', null)
          return
        }
        
        // If selecting from the same side, change selection
        if (currentSelection.side === side) {
          emit('matching-item-selected', { side, index })
          return
        }
        
        // If selecting from opposite side, create a pair
        const newPair = {
          leftIndex: side === 'left' ? index : currentSelection.index,
          rightIndex: side === 'right' ? index : currentSelection.index
        }
        
        // Check if this pair already exists
        const pairExists = props.matchingPairs.some(pair => 
          pair.leftIndex === newPair.leftIndex && pair.rightIndex === newPair.rightIndex
        )
        
        if (!pairExists) {
          // ✅ CRITICAL: Emit the updated pairs array to parent
          const updatedPairs = [...props.matchingPairs, newPair]
          console.log('✅ Created new matching pair:', newPair, 'Total pairs:', updatedPairs)
          emit('answer-changed', updatedPairs)
        }
        
        // Clear selection
        emit('matching-item-selected', null)
      }
      
      const isItemMatched = (side, index) => {
        if (side === 'left') {
          return props.matchingPairs.some(pair => pair.leftIndex === index)
        }
        return props.matchingPairs.some(pair => pair.rightIndex === index)
      }
      
      const removeMatchingPair = (pairIndex) => {
        const updatedPairs = props.matchingPairs.filter((_, index) => index !== pairIndex)
        console.log('🗑️ Removed matching pair:', pairIndex, 'Remaining pairs:', updatedPairs)
        emit('answer-changed', updatedPairs)
        emit('remove-matching-pair', pairIndex)
      }
  
      // ✅ FIXED: Ordering Methods
      const startDrag = (index) => {
        console.log('🎯 Starting drag for ordering item:', index)
        emit('drag-start', index)
      }
  
      const handleDrop = (index) => {
        console.log('🎯 Handling drop for ordering at index:', index)
        emit('drag-drop', index)
      }
  
      // ✅ FIXED: Drag and Drop Methods
      const getDragItemText = (item) => {
        if (typeof item === 'string') return item
        return item?.text || item?.label || String(item)
      }
      
      const getZoneId = (zone) => {
        return zone?.id || zone?.label || String(zone)
      }
      
      const startDragItem = (item, event) => {
        console.log('🎯 Starting drag:', item)
        draggedDragItem.value = item
        if (event && event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', JSON.stringify(item))
        }
        emit('drag-item-start', item)
      }
      
      const endDragItem = () => {
        console.log('🎯 Ending drag')
        draggedDragItem.value = null
      }
      
      const dragOverZone = (zoneId, event) => {
        if (event) {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
        }
        dropOverZone.value = zoneId
        emit('drag-over-zone', zoneId)
      }
      
      const dragLeaveZone = (event) => {
        // Only clear if we're actually leaving the zone (not entering a child element)
        if (!event || !event.currentTarget.contains(event.relatedTarget)) {
          dropOverZone.value = null
          emit('drag-leave-zone')
        }
      }
      
      const dropInZone = (zoneId, event) => {
        if (event) {
          event.preventDefault()
        }
        
        let draggedItem
        try {
          // Try to get item from dataTransfer first
          if (event && event.dataTransfer) {
            const transferData = event.dataTransfer.getData('text/plain')
            if (transferData) {
              draggedItem = JSON.parse(transferData)
            }
          }
        } catch (e) {
          console.warn('Could not parse transfer data, using local state')
        }
        
        // Fallback to local state
        if (!draggedItem && draggedDragItem.value) {
          draggedItem = draggedDragItem.value
        }
        
        if (!draggedItem) {
          console.warn('❌ No item to drop')
          return
        }
        
        console.log('🎯 Dropping item:', draggedItem, 'in zone:', zoneId)
        
        // Create updated placements
        const updatedPlacements = { ...props.dragDropPlacements }
        
        // Initialize zone if it doesn't exist
        if (!updatedPlacements[zoneId]) {
          updatedPlacements[zoneId] = []
        }
        
        // Check if item is already in this zone
        const isAlreadyInZone = updatedPlacements[zoneId].some(placedItem => {
          const placedText = getDragItemText(placedItem)
          const draggedText = getDragItemText(draggedItem)
          return placedText === draggedText
        })
        
        if (!isAlreadyInZone) {
          // Remove item from other zones first
          Object.keys(updatedPlacements).forEach(otherZoneId => {
            if (otherZoneId !== zoneId) {
              updatedPlacements[otherZoneId] = updatedPlacements[otherZoneId].filter(placedItem => {
                const placedText = getDragItemText(placedItem)
                const draggedText = getDragItemText(draggedItem)
                return placedText !== draggedText
              })
            }
          })
          
          // Add to target zone
          updatedPlacements[zoneId].push(draggedItem)
          
          console.log('✅ Updated placements:', updatedPlacements)
          
          // ✅ CRITICAL: Emit the updated placements to parent
          emit('answer-changed', updatedPlacements)
          emit('drop-in-zone', { zoneId, item: draggedItem })
        }
        
        // Clean up
        draggedDragItem.value = null
        dropOverZone.value = null
      }
      
      const getDropZoneItems = (zoneId) => {
        return props.dragDropPlacements[zoneId] || []
      }
      
      const removeDroppedItem = (zoneId, itemIndex) => {
        const updatedPlacements = { ...props.dragDropPlacements }
        
        if (updatedPlacements[zoneId] && updatedPlacements[zoneId][itemIndex]) {
          const removedItem = updatedPlacements[zoneId][itemIndex]
          updatedPlacements[zoneId].splice(itemIndex, 1)
          
          console.log('🗑️ Removed item from zone:', removedItem, 'from', zoneId)
          
          // ✅ CRITICAL: Emit the updated placements to parent
          emit('answer-changed', updatedPlacements)
          emit('remove-dropped-item', { zoneId, itemIndex, item: removedItem })
        }
      }
  
      // ✅ CRITICAL: Initialize fill-blank answers when exercise changes
      const initializeFillBlankAnswers = () => {
        if (exerciseType.value === 'fill-blank') {
          const count = blankCount.value
          console.log('🔄 Initializing fill-blank answers, count:', count)
          
          // Initialize local array
          localFillBlankAnswers.value = new Array(count).fill('')
          
          // Copy from props if available
          if (props.fillBlankAnswers && Array.isArray(props.fillBlankAnswers)) {
            for (let i = 0; i < Math.min(count, props.fillBlankAnswers.length); i++) {
              localFillBlankAnswers.value[i] = props.fillBlankAnswers[i] || ''
            }
          }
          
          console.log('✅ Fill-blank answers initialized:', localFillBlankAnswers.value)
        }
      }
  
      // ✅ Watch for prop changes to sync local state
      watch(() => props.userAnswer, (newValue) => {
        if (exerciseType.value !== 'fill-blank') {
          localUserAnswer.value = newValue || ''
        }
      }, { immediate: true })
  
      watch(() => props.fillBlankAnswers, (newValue) => {
        if (Array.isArray(newValue)) {
          // Only update if local array is empty or exercise changed
          if (localFillBlankAnswers.value.length === 0 || 
              localFillBlankAnswers.value.every(answer => !answer || answer.trim() === '')) {
            localFillBlankAnswers.value = [...newValue]
            console.log('📝 Synced fill-blank answers from props:', localFillBlankAnswers.value)
          }
        }
      }, { immediate: true, deep: true })
  
      // ✅ Watch for exercise changes
      watch(() => props.currentExercise, (newExercise) => {
        if (newExercise) {
          console.log('🔄 Exercise changed:', newExercise.type)
          
          // Reset local state
          localUserAnswer.value = props.userAnswer || ''
          
          // Initialize fill-blank if needed
          if (newExercise.type === 'fill-blank') {
            nextTick(() => {
              initializeFillBlankAnswers()
            })
          }
        }
      }, { immediate: true })
  
      // ✅ Initialize local state
      onMounted(() => {
        console.log('🚀 InteractivePanel mounted')
        localUserAnswer.value = props.userAnswer || ''
        
        // Initialize fill-blank answers
        initializeFillBlankAnswers()
      })
  
      return {
        localUserAnswer,
        localFillBlankAnswers,
        draggedDragItem,
        dropOverZone,
        showDebugInfo,
        isExerciseStep,
        isQuizStep,
        exerciseType,
        exerciseOptions,
        quizOptions,
        leftItems,
        rightItems,
        isLastExercise,
        isLastQuiz,
        blankCount,
        canSubmitAnswer,
        getFillBlankValue,
        handleFillBlankInput,
        debugFillBlank,
        renderFillBlankTemplate,
        selectOption,
        selectQuizOption,
        selectTrueFalse,
        selectMatchingItem,
        isItemMatched,
        removeMatchingPair,
        startDrag,
        handleDrop,
        getDragItemText,
        getZoneId,
        startDragItem,
        endDragItem,
        dragOverZone,
        dragLeaveZone,
        dropInZone,
        getDropZoneItems,
        removeDroppedItem,
        initializeFillBlankAnswers
      }
    }
  }
  </script>
  
  <style scoped>
  .interactive-panel {
    background: #f8fafc;
    padding: 32px;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  
  .exercise-content,
  .quiz-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .exercise-header,
  .quiz-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  
  .exercise-header h3,
  .quiz-header h3 {
    font-size: 1.2rem;
    color: #4c1d95;
    margin: 0;
    font-weight: 700;
  }
  
  .exercise-counter,
  .quiz-counter {
    font-size: 0.9rem;
    color: #6b46c1;
    font-weight: 600;
    background: rgba(107, 70, 193, 0.1);
    padding: 6px 12px;
    border-radius: 12px;
  }
  
  .exercise-body,
  .quiz-body {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 16px;
  }
  
  .exercise-actions,
  .quiz-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    flex-shrink: 0;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
  
  .question-text,
  .quiz-question {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 24px 0;
    line-height: 1.5;
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid #ddd6fe;
    box-shadow: 0 2px 8px rgba(107, 70, 193, 0.1);
  }
  
  /* Form Controls with Purple Theme */
  .answer-input {
    margin-bottom: 24px;
  }
  
  .answer-textarea {
    width: 100%;
    min-height: 120px;
    padding: 16px;
    border: 2px solid #ddd6fe;
    border-radius: 12px;
    font-size: 0.95rem;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s ease;
    background: white;
    box-sizing: border-box;
  }
  
  .answer-textarea:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  
  .answer-textarea:disabled {
    background: #f8fafc;
    color: #9ca3af;
  }
  
  /* Options Grid with Purple Theme */
  .options-list,
  .quiz-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .option-item,
  .quiz-option {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
    min-height: 50px;
    display: flex;
    align-items: center;
    padding: 16px 20px;
    gap: 12px;
  }
  
  .option-item:hover,
  .quiz-option:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  }
  
  .option-item.selected,
  .quiz-option.selected {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.05);
  }
  
  .option-radio {
    display: none;
  }
  
  .option-text {
    font-size: 0.95rem;
    line-height: 1.4;
    flex: 1;
    color: #374151;
  }
  
  /* True/False Styling */
  .true-false-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .tf-option {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 20px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .tf-option:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
  }
  
  .tf-option.selected {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.05);
  }
  
  .tf-option input {
    display: none;
  }
  
  .tf-option span {
    font-weight: 600;
    color: #374151;
  }
  
  /* ✅ ENHANCED: Fill Blank Styling */
  .fill-blank-template {
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid #ddd6fe;
    margin-bottom: 20px;
    line-height: 1.6;
    font-size: 1rem;
  }
  
  .blank-indicator {
    background: #8b5cf6;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.85rem;
  }
  
  .fill-blank-inputs {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .blank-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    transition: all 0.2s ease;
  }
  
  .blank-input-group:hover {
    border-color: #ddd6fe;
  }
  
  .blank-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #4c1d95;
    margin-bottom: 4px;
  }
  
  .blank-input {
    padding: 12px 16px;
    border: 2px solid #ddd6fe;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    background: white;
    width: 100%;
    box-sizing: border-box;
  }
  
  .blank-input:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  
  .blank-input:disabled {
    background: #f8fafc;
    color: #9ca3af;
    border-color: #e2e8f0;
  }
  
  /* ✅ NEW: Input preview styling */
  .input-preview {
    font-size: 0.8rem;
    color: #6b46c1;
    font-style: italic;
    padding: 4px 0;
  }
  
  /* ✅ NEW: Debug section styling */
  .debug-section {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #fecaca;
    border-radius: 8px;
    padding: 12px;
    margin: 16px 0;
    font-size: 0.8rem;
  }
  
  .debug-section h4 {
    margin: 0 0 8px 0;
    color: #dc2626;
  }
  
  .debug-section p {
    margin: 4px 0;
    color: #7f1d1d;
  }
  
  .debug-btn {
    background: #dc2626;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
  }
  
  /* ✅ NEW: Second chance indicators */
  .second-chance-indicator {
    background: rgba(251, 191, 36, 0.1);
    border: 2px solid #fcd34d;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  
  .attempt-counter {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .attempt-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: #92400e;
  }
  
  .attempt-dots {
    display: flex;
    gap: 4px;
  }
  
  .attempt-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e5e7eb;
    transition: all 0.2s ease;
  }
  
  .attempt-dot.filled {
    background: #f59e0b;
  }
  
  .attempt-dot.current {
    background: #8b5cf6;
    transform: scale(1.2);
  }
  
  .correct-answer-display {
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid #a7f3d0;
    border-radius: 8px;
    padding: 16px;
    margin-top: 12px;
  }
  
  .correct-answer-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #047857;
    margin-bottom: 8px;
  }
  
  .correct-answer-text {
    font-size: 0.95rem;
    color: #065f46;
    font-weight: 500;
  }
  
  /* Enhanced Submit Button for Second Chance */
  .submit-btn.second-chance {
    background: #f59e0b;
    border-color: #f59e0b;
  }
  
  .submit-btn.second-chance:hover:not(.disabled) {
    background: #d97706;
    border-color: #d97706;
  }
  
  .second-chance-icon {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Continue with existing styles... */
  /* Matching Exercise Styling */
  .matching-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }
  
  .matching-side {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
  }
  
  .matching-side h4 {
    margin: 0 0 16px 0;
    font-size: 1rem;
    color: #4c1d95;
    text-align: center;
  }
  
  .matching-item {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    text-align: center;
  }
  
  .matching-item:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
  }
  
  .matching-item.selected {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
    color: #4c1d95;
    font-weight: 600;
  }
  
  .matching-item.matched {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    color: #047857;
    opacity: 0.7;
  }
  
  .matching-pairs {
    background: white;
    border: 2px solid #ddd6fe;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .matching-pairs h4 {
    margin: 0 0 16px 0;
    font-size: 1rem;
    color: #4c1d95;
  }
  
  .pair-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(139, 92, 246, 0.05);
    border: 1px solid #ddd6fe;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  
  .remove-pair {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s ease;
  }
  
  .remove-pair:hover {
    background: #dc2626;
    transform: scale(1.1);
  }
  
  /* Ordering Exercise Styling */
  .ordering-instructions {
    background: rgba(139, 92, 246, 0.1);
    border: 2px solid #ddd6fe;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 0.9rem;
    color: #4c1d95;
    text-align: center;
    font-weight: 600;
  }
  
  .ordering-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }
  
  .ordering-item {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    cursor: move;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .ordering-item:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
  }
  
  .ordering-item.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
  
  .drag-handle {
    color: #9ca3af;
    font-size: 1.2rem;
    cursor: grab;
  }
  
  .drag-handle:active {
    cursor: grabbing;
  }
  
  .item-text {
    flex: 1;
    font-size: 0.95rem;
    color: #374151;
  }
  
  .item-number {
    background: #8b5cf6;
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  /* Drag and Drop Exercise Styling */
  .drag-drop-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }
  
  .drag-items {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
  }
  
  .drag-items h4 {
    margin: 0 0 16px 0;
    font-size: 1rem;
    color: #4c1d95;
    text-align: center;
  }
  
  .drag-item {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    cursor: move;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    text-align: center;
  }
  
  .drag-item:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
  }
  
  .drag-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }
  
  .drop-zones {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .drop-zone {
    background: white;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    min-height: 80px;
    transition: all 0.2s ease;
  }
  
  .drop-zone.drag-over {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.05);
  }
  
  .zone-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #4c1d95;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .zone-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .dropped-item {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid #ddd6fe;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 0.85rem;
    color: #4c1d95;
    text-align: center;
    cursor: pointer;
    position: relative;
  }
  
  .remove-dropped {
    color: #ef4444;
    font-weight: bold;
    margin-left: 8px;
  }
  
  /* Hints and Feedback */
  .hints-section {
    margin-bottom: 24px;
  }
  
  .hint {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 12px;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .basic-hint {
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid #bfdbfe;
    color: #1e40af;
  }
  
  .smart-hint {
    background: rgba(139, 92, 246, 0.1);
    border: 2px solid #ddd6fe;
    color: #4c1d95;
    position: relative;
  }
  
  .hint-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  .hint-text {
    flex: 1;
  }
  
  .clear-hint-btn {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    margin-left: 8px;
    transition: color 0.2s ease;
  }
  
  .clear-hint-btn:hover {
    color: #ef4444;
  }
  
  /* Confirmation Messages */
  .confirmation-message {
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    font-weight: 600;
    text-align: center;
    font-size: 0.95rem;
  }
  
  .confirmation-message.correct {
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid #a7f3d0;
    color: #047857;
  }
  
  .confirmation-message.incorrect {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #fecaca;
    color: #dc2626;
  }
  
  .confirmation-message.show-answer {
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid #bfdbfe;
    color: #1e40af;
  }
  
  /* Buttons */
  .hint-btn,
  .submit-btn,
  .next-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }
  
  .hint-btn {
    background: rgba(59, 130, 246, 0.1);
    color: #1e40af;
    border: 2px solid #bfdbfe;
  }
  
  .hint-btn:hover {
    background: rgba(59, 130, 246, 0.15);
    transform: translateY(-1px);
  }
  
  .submit-btn {
    background: #8b5cf6;
    color: white;
    border: 2px solid #8b5cf6;
  }
  
  .submit-btn:hover:not(.disabled) {
    background: #7c3aed;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
  
  .submit-btn.disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
    border-color: #d1d5db;
  }
  
  .next-btn {
    background: #10b981;
    color: white;
    border: 2px solid #10b981;
  }
  
  .next-btn:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .next-icon {
    font-size: 1.1rem;
  }
  
  /* No Content State */
  .no-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #6b7280;
  }
  
  .no-content-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.7;
  }
  
  .no-content h4 {
    margin: 0 0 8px 0;
    font-size: 1.1rem;
    color: #4b5563;
  }
  
  .no-content p {
    margin: 0;
    font-size: 0.9rem;
    color: #6b7280;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .interactive-panel {
      padding: 16px;
    }
    
    .matching-container,
    .drag-drop-container {
      grid-template-columns: 1fr;
    }
    
    .true-false-options {
      grid-template-columns: 1fr;
    }
    
    .exercise-actions,
    .quiz-actions {
      flex-direction: column;
    }
    
    .exercise-header,
    .quiz-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .question-text,
    .quiz-question {
      font-size: 1rem;
      padding: 16px;
    }
  
    .blank-input-group {
      padding: 12px;
    }
  }
  
  @media (max-width: 480px) {
    .interactive-panel {
      padding: 12px;
    }
    
    .exercise-header h3,
    .quiz-header h3 {
      font-size: 1.1rem;
    }
    
    .question-text,
    .quiz-question {
      font-size: 0.95rem;
      padding: 12px;
    }
    
    .option-item,
    .quiz-option {
      padding: 12px 16px;
    }
    
    .tf-option {
      padding: 16px;
    }
  
    .blank-input-group {
      padding: 8px;
    }
  
    .blank-input {
      padding: 10px 12px;
      font-size: 0.9rem;
    }
  }
  
  /* Scrollbar Styling */
  .exercise-body::-webkit-scrollbar,
  .quiz-body::-webkit-scrollbar {
    width: 6px;
  }
  
  .exercise-body::-webkit-scrollbar-track,
  .quiz-body::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .exercise-body::-webkit-scrollbar-thumb,
  .quiz-body::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .exercise-body::-webkit-scrollbar-thumb:hover,
  .quiz-body::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  /* Animation Classes */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  /* Focus Management */
  .interactive-panel *:focus {
    outline: 2px solid #8b5cf6;
    outline-offset: 2px;
  }
  
  /* High Contrast Mode Support */
  @media (prefers-contrast: high) {
    .option-item,
    .quiz-option,
    .tf-option,
    .matching-item,
    .ordering-item,
    .drag-item,
    .blank-input {
      border-width: 3px;
    }
    
    .confirmation-message {
      border-width: 3px;
    }
  }
  
  /* Reduced Motion Support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    
    .ordering-item.dragging {
      transform: none;
    }
    
    .drag-item.dragging {
      transform: none;
    }
  
    .second-chance-icon {
      animation: none;
    }
  }
  
  /* Print Styles */
  @media print {
    .interactive-panel {
      padding: 0;
      background: white;
    }
    
    .exercise-actions,
    .quiz-actions,
    .debug-section {
      display: none;
    }
    
    .option-item,
    .quiz-option {
      border: 1px solid #000;
      break-inside: avoid;
    }
  }
  </style>