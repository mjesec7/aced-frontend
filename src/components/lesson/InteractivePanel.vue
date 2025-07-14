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
            />
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
              <input 
                type="radio" 
                :name="'exercise-' + exerciseIndex"
                :value="option"
                v-model="localUserAnswer"
                @change="$emit('answer-changed', option)"
                :disabled="showCorrectAnswer"
                class="option-radio"
              />
              <div class="option-text">{{ option }}</div>
            </div>
          </div>
        </div>

        <!-- Fill in the Blanks Exercise -->
        <div v-else-if="exerciseType === 'fill-blank'" class="exercise-type fill-blank">
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
          
          <!-- Debug Section -->
          <div v-if="showDebugInfo" class="debug-section">
            <h4>Debug Info:</h4>
            <p>fillBlankAnswers prop: {{ JSON.stringify(fillBlankAnswers) }}</p>
            <p>localFillBlankAnswers: {{ JSON.stringify(localFillBlankAnswers) }}</p>
            <p>blankCount: {{ blankCount }}</p>
            <button @click="debugFillBlank" class="debug-btn">Debug</button>
          </div>
        </div>

        <!-- Matching Exercise - ENHANCED -->
        <div v-else-if="exerciseType === 'matching'" class="exercise-type matching">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          
          <!-- Debug info for matching -->
          <div v-if="showDebugInfo" class="debug-section">
            <h4>Matching Debug:</h4>
            <p>Left items: {{ JSON.stringify(leftItems) }}</p>
            <p>Right items: {{ JSON.stringify(rightItems) }}</p>
            <p>Current pairs: {{ JSON.stringify(matchingPairs) }}</p>
            <p>Selected item: {{ JSON.stringify(selectedMatchingItem) }}</p>
            <p>Exercise pairs: {{ JSON.stringify(currentExercise?.pairs) }}</p>
            <p>Can submit: {{ canSubmitAnswer }}</p>
            <button @click="debugMatching" class="debug-btn">Debug Matching</button>
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
                :data-side="'left'"
                :data-index="index"
              >
                {{ item }}
                <!-- Visual indicator for selected item -->
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
                :data-side="'right'"
                :data-index="index"
              >
                {{ item }}
                <!-- Visual indicator for selected item -->
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

        <!-- FIXED: Ordering Exercise with proper drag and drop implementation -->
        <div v-else-if="exerciseType === 'ordering'" class="exercise-type ordering">
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
          
          <!-- Debug for ordering -->
          <div v-if="showDebugInfo" class="debug-section">
            <h4>Ordering Debug:</h4>
            <p>Original items: {{ JSON.stringify(currentExercise?.items) }}</p>
            <p>Local ordering items: {{ JSON.stringify(localOrderingItems) }}</p>
            <p>Dragged item: {{ draggedOrderingItem }}</p>
            <button @click="debugOrdering" class="debug-btn">Debug Ordering</button>
          </div>
        </div>

        <!-- Drag and Drop Exercise -->
        <div v-else-if="exerciseType === 'drag-drop'" class="exercise-type drag-drop">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          
          <div v-if="showDebugInfo" class="debug-section">
            <h4>Drag-Drop Debug:</h4>
            <p>availableDragItems: {{ availableDragItems.length }}</p>
            <p>dropZones: {{ dropZones.length }}</p>
          </div>
          
          <div v-if="availableDragItems.length > 0 && dropZones.length > 0" class="drag-drop-container">
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

      <!-- Exercise Actions -->
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
            <input 
              type="radio" 
              :name="'quiz-' + quizIndex"
              :value="option"
              v-model="localUserAnswer"
              @change="$emit('answer-changed', option)"
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
    // ==========================================
    // REACTIVE STATE
    // ==========================================
    const localUserAnswer = ref('')
    const localFillBlankAnswers = ref([])
    const draggedDragItem = ref(null)
    const dropOverZone = ref(null)
    const showDebugInfo = ref(false)

    // FIXED: Ordering exercise state
    const localOrderingItems = ref([])
    const draggedOrderingItem = ref(null)
    const dropTargetIndex = ref(null)

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================
    const isExerciseStep = computed(() => 
      ['exercise', 'practice'].includes(props.currentStep?.type)
    )
    
    const isQuizStep = computed(() => 
      props.currentStep?.type === 'quiz'
    )
    
    const exerciseType = computed(() => 
      props.currentExercise?.type || 'short-answer'
    )
    
    const exerciseOptions = computed(() => {
      if (!props.currentExercise?.options) return []
      return props.currentExercise.options.map(option => {
        if (typeof option === 'string') return option
        if (option && option.text) return option.text
        return String(option)
      })
    })
    
    const quizOptions = computed(() => {
      if (!props.currentQuiz?.options) return []
      return props.currentQuiz.options.map(option => {
        if (typeof option === 'string') return option
        if (option && option.text) return option.text
        return String(option)
      })
    })
    
    // ✅ ENHANCED: Left items processing with multiple data structure support
    const leftItems = computed(() => {
      console.log('🔍 Computing left items for matching exercise:', {
        exercise: props.currentExercise,
        pairs: props.currentExercise?.pairs,
        pairsType: typeof props.currentExercise?.pairs,
        isArray: Array.isArray(props.currentExercise?.pairs)
      })
      
      if (!props.currentExercise?.pairs) {
        console.warn('⚠️ No pairs found in matching exercise')
        return []
      }
      
      const pairs = props.currentExercise.pairs
      
      // ✅ Handle different data structures
      if (Array.isArray(pairs)) {
        const leftItems = pairs.map((pair, index) => {
          console.log(`  Processing pair ${index}:`, pair)
          
          if (Array.isArray(pair)) {
            // Format: [left, right]
            return String(pair[0] || '')
          } else if (pair && typeof pair === 'object') {
            // Format: {left: "...", right: "..."} or {0: "...", 1: "..."}
            return String(pair.left || pair[0] || pair.question || pair.term || '')
          } else {
            // Fallback for string or other types
            return String(pair || '')
          }
        }).filter(item => item.trim() !== '')
        
        console.log('✅ Computed left items:', leftItems)
        return leftItems
      }
      
      console.warn('⚠️ Pairs is not an array:', pairs)
      return []
    })
    
    // ✅ FIXED: Right items are now SHUFFLED for challenging gameplay
    const rightItems = computed(() => {
      console.log('🔍 Computing right items for matching exercise (will be shuffled):', {
        exercise: props.currentExercise,
        pairs: props.currentExercise?.pairs
      })
      
      if (!props.currentExercise?.pairs) {
        console.warn('⚠️ No pairs found in matching exercise')
        return []
      }
      
      const pairs = props.currentExercise.pairs
      
      // ✅ Handle different data structures
      if (Array.isArray(pairs)) {
        const rightItems = pairs.map((pair, index) => {
          console.log(`  Processing pair ${index}:`, pair)
          
          if (Array.isArray(pair)) {
            // Format: [left, right]
            return String(pair[1] || '')
          } else if (pair && typeof pair === 'object') {
            // Format: {left: "...", right: "..."} or {0: "...", 1: "..."}
            return String(pair.right || pair[1] || pair.answer || pair.definition || '')
          } else {
            // Fallback for string or other types
            return String(pair || '')
          }
        }).filter(item => item.trim() !== '')
        
        // 🔀 SHUFFLE THE RIGHT ITEMS SO THEY'RE NOT IN CORRECT ORDER
        const shuffledRightItems = [...rightItems].sort(() => Math.random() - 0.5)
        
        console.log('✅ Original right items:', rightItems)
        console.log('🔀 Shuffled right items:', shuffledRightItems)
        return shuffledRightItems
      }
      
      console.warn('⚠️ Pairs is not an array:', pairs)
      return []
    })

    // ✅ Helper to get original right items in correct order (for validation)
    const getOriginalRightItems = computed(() => {
      if (!props.currentExercise?.pairs) {
        return []
      }
      
      const pairs = props.currentExercise.pairs
      
      if (Array.isArray(pairs)) {
        return pairs.map((pair, index) => {
          if (Array.isArray(pair)) {
            return String(pair[1] || '')
          } else if (pair && typeof pair === 'object') {
            return String(pair.right || pair[1] || pair.answer || pair.definition || '')
          } else {
            return String(pair || '')
          }
        }).filter(item => item.trim() !== '')
      }
      
      return []
    })
    
    const isLastExercise = computed(() => 
      props.exerciseIndex >= props.totalExercises - 1
    )
    
    const isLastQuiz = computed(() => 
      props.quizIndex >= props.totalQuizzes - 1
    )

    const blankCount = computed(() => {
      if (!props.currentExercise) return 0
      
      // Handle MongoDB structure for blanks
      if (props.currentExercise.blanks && Array.isArray(props.currentExercise.blanks)) {
        return props.currentExercise.blanks.length
      }
      
      if (props.currentExercise.correctAnswers && Array.isArray(props.currentExercise.correctAnswers)) {
        return props.currentExercise.correctAnswers.length
      }
      
      if (props.currentExercise.answers && Array.isArray(props.currentExercise.answers)) {
        return props.currentExercise.answers.length
      }
      
      // Parse template for different blank formats
      const template = props.currentExercise.template || props.currentExercise.question || ''
      const asteriskMatches = template.match(/\*/g) || []
      const underscoreMatches = template.match(/_+/g) || []
      const blankMatches = template.match(/\[blank\]/gi) || []
      const curlyBraceMatches = template.match(/\{[^}]*\}/g) || []
      
      return Math.max(
        asteriskMatches.length,
        underscoreMatches.length, 
        blankMatches.length, 
        curlyBraceMatches.length,
        1
      )
    })
    
    const canSubmitAnswer = computed(() => {
      switch (exerciseType.value) {
        case 'multiple-choice':
        case 'abc':
        case 'true-false':
          return localUserAnswer.value && String(localUserAnswer.value).trim()
          
        case 'short-answer':
          return String(localUserAnswer.value || '').trim().length >= 1
          
        case 'fill-blank':
          const answersToCheck = localFillBlankAnswers.value.length > 0 
            ? localFillBlankAnswers.value 
            : props.fillBlankAnswers
          return answersToCheck.some(answer => String(answer || '').trim().length >= 1)
          
        case 'matching':
          console.log('🔍 Checking matching submission readiness:', {
            pairsCount: props.matchingPairs.length,
            leftItemsCount: leftItems.value.length,
            rightItemsCount: rightItems.value.length,
            requiredPairs: Math.min(leftItems.value.length, rightItems.value.length)
          })
          
          // Need at least one pair to submit
          return props.matchingPairs.length > 0
          
        case 'ordering':
          console.log('🔍 Checking ordering submission readiness:', {
            localItemsCount: localOrderingItems.value.length,
            originalItemsCount: props.currentExercise?.items?.length || 0
          })
          return localOrderingItems.value.length > 0
          
        case 'drag-drop':
          const placements = Object.values(props.dragDropPlacements || {})
          return placements.some(items => Array.isArray(items) && items.length > 0)
          
        default:
          return false
      }
    })

    // ==========================================
    // FILL-BLANK METHODS
    // ==========================================
    const getFillBlankValue = (index) => {
      if (localFillBlankAnswers.value[index] !== undefined) {
        return localFillBlankAnswers.value[index]
      }
      return props.fillBlankAnswers[index] || ''
    }

    const handleFillBlankInput = (index, event) => {
      const value = event.target.value
      
      // Update local array
      while (localFillBlankAnswers.value.length <= index) {
        localFillBlankAnswers.value.push('')
      }
      localFillBlankAnswers.value[index] = value
      localFillBlankAnswers.value = [...localFillBlankAnswers.value]
      
      emit('fill-blank-updated', index, event)
    }

    const renderFillBlankTemplate = () => {
      if (!props.currentExercise?.template) return ''
      
      let template = props.currentExercise.template
      let blankIndex = 0
      
      // Handle MongoDB structure - replace * with blank indicators
      template = template.replace(/\*/g, () => {
        return `<span class="blank-indicator">[Пропуск ${++blankIndex}]</span>`
      })
      
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

    const initializeFillBlankAnswers = () => {
      if (exerciseType.value === 'fill-blank') {
        const count = blankCount.value
        localFillBlankAnswers.value = new Array(count).fill('')
        
        if (props.fillBlankAnswers && Array.isArray(props.fillBlankAnswers)) {
          for (let i = 0; i < Math.min(count, props.fillBlankAnswers.length); i++) {
            localFillBlankAnswers.value[i] = props.fillBlankAnswers[i] || ''
          }
        }
      }
    }

    // ==========================================
    // OPTION SELECTION METHODS
    // ==========================================
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

    // ==========================================
    // MATCHING METHODS - ENHANCED WITH SHUFFLING SUPPORT
    // ==========================================

    // ✅ Helper function to get the ACTUAL right index (mapping shuffled back to original)
    const getActualRightIndex = (shuffledIndex) => {
      const shuffledItem = rightItems.value[shuffledIndex]
      const originalItems = getOriginalRightItems.value
      
      // Find the original index of this item
      const actualIndex = originalItems.findIndex(item => 
        item.toLowerCase().trim() === shuffledItem.toLowerCase().trim()
      )
      
      console.log(`🔍 Mapping shuffled index ${shuffledIndex} ("${shuffledItem}") to actual index ${actualIndex}`)
      
      return actualIndex
    }

    const handleMatchingItemClick = (side, index) => {
      console.log('🖱️ Matching item clicked:', { side, index, disabled: props.showCorrectAnswer })
      
      if (props.showCorrectAnswer) {
        console.log('⚠️ Exercise is disabled, ignoring click')
        return
      }
      
      // Call the selectMatchingItem method
      selectMatchingItem(side, index)
    }

    const handleRemovePair = (pairIndex) => {
      console.log('🗑️ Remove pair clicked:', pairIndex)
      
      if (props.showCorrectAnswer) {
        console.log('⚠️ Exercise is disabled, ignoring remove')
        return
      }
      
      // Call the removeMatchingPair method
      removeMatchingPair(pairIndex)
    }
    
    // ✅ ENHANCED: selectMatchingItem with proper index mapping for shuffled items
    const selectMatchingItem = (side, index) => {
      console.log('🔗 selectMatchingItem called:', { 
        side, 
        index, 
        currentSelection: props.selectedMatchingItem,
        leftItems: leftItems.value,
        rightItems: rightItems.value,
        currentPairs: props.matchingPairs
      })
      
      const currentSelection = props.selectedMatchingItem
      
      // If nothing is selected, select this item
      if (!currentSelection) {
        console.log('  ➡️ No previous selection, selecting item')
        emit('matching-item-selected', { side, index })
        return
      }
      
      // If clicking the same item, deselect it
      if (currentSelection.side === side && currentSelection.index === index) {
        console.log('  ➡️ Clicking same item, deselecting')
        emit('matching-item-selected', null)
        return
      }
      
      // If selecting from the same side, switch selection
      if (currentSelection.side === side) {
        console.log('  ➡️ Selecting different item from same side')
        emit('matching-item-selected', { side, index })
        return
      }
      
      // If selecting from different side, create a pair
      console.log('  ➡️ Creating pair between different sides')
      
      let leftIndex, rightIndex
      
      if (side === 'left') {
        leftIndex = index
        rightIndex = getActualRightIndex(currentSelection.index) // Map shuffled to actual
      } else {
        leftIndex = currentSelection.index
        rightIndex = getActualRightIndex(index) // Map shuffled to actual
      }
      
      const newPair = { leftIndex, rightIndex }
      
      console.log('  📝 New pair to create (with actual indices):', newPair)
      
      // Check if this exact pair already exists
      const currentPairs = props.matchingPairs || []
      const pairExists = currentPairs.some(pair => 
        pair.leftIndex === newPair.leftIndex && pair.rightIndex === newPair.rightIndex
      )
      
      if (!pairExists) {
        console.log('  ✅ Creating new pair')
        
        // Remove any existing pairs that use these items
        const updatedPairs = currentPairs.filter(pair => 
          pair.leftIndex !== newPair.leftIndex && pair.rightIndex !== newPair.rightIndex
        )
        
        // Add the new pair
        updatedPairs.push(newPair)
        
        console.log('  📋 Updated pairs:', updatedPairs)
        
        // Emit the change - this is the key fix!
        emit('answer-changed', updatedPairs)
      } else {
        console.log('  ⚠️ Pair already exists')
      }
      
      // Clear selection after creating/attempting pair
      emit('matching-item-selected', null)
    }
    
    // ✅ ENHANCED: removeMatchingPair with proper emit calls
    const removeMatchingPair = (pairIndex) => {
      console.log('🗑️ removeMatchingPair called:', { 
        pairIndex, 
        currentPairs: props.matchingPairs,
        pairToRemove: props.matchingPairs?.[pairIndex]
      })
      
      const currentPairs = props.matchingPairs || []
      
      if (pairIndex >= 0 && pairIndex < currentPairs.length) {
        const updatedPairs = currentPairs.filter((_, index) => index !== pairIndex)
        console.log('  ✅ Updated pairs after removal:', updatedPairs)
        
        // Emit the change - this is the key fix!
        emit('answer-changed', updatedPairs)
        emit('remove-matching-pair', pairIndex)
      } else {
        console.warn('  ⚠️ Invalid pair index:', pairIndex)
      }
    }
    
    // ✅ Enhanced isItemMatched function
    const isItemMatched = (side, index) => {
      const currentPairs = props.matchingPairs || []
      
      if (currentPairs.length === 0) {
        return false
      }
      
      if (side === 'left') {
        return currentPairs.some(pair => pair.leftIndex === index)
      } else {
        // For right side, we need to check if the actual index is matched
        const actualIndex = getActualRightIndex(index)
        return currentPairs.some(pair => pair.rightIndex === actualIndex)
      }
    }
    
    // ✅ Helper functions to get item text by index
    const getLeftItemText = (index) => {
      if (index >= 0 && index < leftItems.value.length) {
        return leftItems.value[index]
      }
      return `Left Item ${index + 1}`
    }
    
    const getRightItemText = (index) => {
      // This should return the original right item text, not shuffled
      const originalItems = getOriginalRightItems.value
      if (index >= 0 && index < originalItems.length) {
        return originalItems[index]
      }
      return `Right Item ${index + 1}`
    }

    // ✅ Enhanced debug function with shuffling info
    const debugMatching = () => {
      console.log('🔍 MATCHING DEBUG FULL STATE:', {
        currentExercise: props.currentExercise,
        exercisePairs: props.currentExercise?.pairs,
        leftItems: leftItems.value,
        rightItems: rightItems.value,
        originalRightItems: getOriginalRightItems.value,
        userPairs: props.matchingPairs,
        selectedItem: props.selectedMatchingItem,
        canSubmit: canSubmitAnswer.value,
        showCorrectAnswer: props.showCorrectAnswer
      })
      
      // Test index mapping
      if (rightItems.value.length > 0) {
        console.log('🧪 Testing index mapping:')
        rightItems.value.forEach((item, shuffledIndex) => {
          const actualIndex = getActualRightIndex(shuffledIndex)
          console.log(`  Shuffled[${shuffledIndex}]: "${item}" → Actual[${actualIndex}]: "${getOriginalRightItems.value[actualIndex]}"`)
        })
      }
    }

    // ==========================================
    // FIXED: ORDERING METHODS - COMPLETE IMPLEMENTATION
    // ==========================================
    
    const initializeOrderingItems = () => {
      console.log('🔄 Initializing ordering items:', props.currentExercise?.items)
      
      if (props.currentExercise?.items && Array.isArray(props.currentExercise.items)) {
        // Create a shuffled version of the items for the exercise
        const items = props.currentExercise.items.map((item, index) => ({
          id: item.id || `item_${index}`,
          text: typeof item === 'string' ? item : (item.text || String(item)),
          originalIndex: index
        }))
        
        // Shuffle the items so they're not in correct order
        const shuffledItems = [...items].sort(() => Math.random() - 0.5)
        localOrderingItems.value = shuffledItems
        
        console.log('✅ Ordering items initialized:', {
          original: items,
          shuffled: shuffledItems
        })
        
        // Emit the initial shuffled order
        emit('answer-changed', localOrderingItems.value)
      }
    }

    const getOrderingItemText = (item) => {
      if (typeof item === 'string') return item
      if (item && item.text) return item.text
      return String(item || '')
    }

    const moveOrderingItem = (fromIndex, toIndex) => {
      console.log(`🔄 Moving item from ${fromIndex} to ${toIndex}`)
      
      if (fromIndex === toIndex || 
          fromIndex < 0 || fromIndex >= localOrderingItems.value.length ||
          toIndex < 0 || toIndex >= localOrderingItems.value.length) {
        return
      }
      
      const newItems = [...localOrderingItems.value]
      const [movedItem] = newItems.splice(fromIndex, 1)
      newItems.splice(toIndex, 0, movedItem)
      
      localOrderingItems.value = newItems
      
      console.log('✅ Items reordered:', newItems.map(item => item.text))
      
      // Emit the updated order
      emit('answer-changed', localOrderingItems.value)
    }

    // ✅ FIXED: Drag and drop methods for ordering
    const startOrderingDrag = (event, index) => {
      console.log('🖱️ Starting drag for ordering item:', index)
      draggedOrderingItem.value = index
      
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', index.toString())
      }
    }

    const endOrderingDrag = () => {
      console.log('🖱️ Ending drag for ordering')
      draggedOrderingItem.value = null
      dropTargetIndex.value = null
    }

    const handleOrderingDragOver = (event, index) => {
      if (draggedOrderingItem.value !== null && draggedOrderingItem.value !== index) {
        event.preventDefault()
        dropTargetIndex.value = index
      }
    }

    const handleOrderingDragEnter = (index) => {
      if (draggedOrderingItem.value !== null && draggedOrderingItem.value !== index) {
        dropTargetIndex.value = index
      }
    }

    const handleOrderingDragLeave = () => {
      // Only clear if we're leaving the container
      // dropTargetIndex.value = null
    }

    const handleOrderingDrop = (event, dropIndex) => {
      event.preventDefault()
      
      const dragIndex = draggedOrderingItem.value
      
      console.log(`🎯 Dropping item from ${dragIndex} to ${dropIndex}`)
      
      if (dragIndex !== null && dragIndex !== dropIndex) {
        moveOrderingItem(dragIndex, dropIndex)
      }
      
      endOrderingDrag()
    }

    const debugOrdering = () => {
      console.log('🔍 ORDERING DEBUG:', {
        currentExercise: props.currentExercise,
        originalItems: props.currentExercise?.items,
        localOrderingItems: localOrderingItems.value,
        draggedItem: draggedOrderingItem.value,
        dropTarget: dropTargetIndex.value,
        canSubmit: canSubmitAnswer.value
      })
    }

    // ==========================================
    // DRAG AND DROP METHODS
    // ==========================================
    const getDragItemText = (item) => {
      if (typeof item === 'string') return item
      if (item && item.text) return item.text
      if (item && item.label) return item.label
      return String(item)
    }
    
    const getZoneId = (zone) => {
      if (zone && zone.id) return zone.id
      if (zone && zone.label) return zone.label
      return String(zone)
    }
    
    const startDragItem = (item, event) => {
      draggedDragItem.value = item
      if (event && event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', JSON.stringify(item))
      }
      emit('drag-item-start', item)
    }
    
    const endDragItem = () => {
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
        if (event && event.dataTransfer) {
          const transferData = event.dataTransfer.getData('text/plain')
          if (transferData) {
            draggedItem = JSON.parse(transferData)
          }
        }
      } catch (e) {
        console.warn('Could not parse transfer data, using local state')
      }
      
      if (!draggedItem && draggedDragItem.value) {
        draggedItem = draggedDragItem.value
      }
      
      if (!draggedItem) {
        console.warn('❌ No item to drop')
        return
      }
      
      const updatedPlacements = { ...props.dragDropPlacements }
      
      if (!updatedPlacements[zoneId]) {
        updatedPlacements[zoneId] = []
      }
      
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
        
        updatedPlacements[zoneId].push(draggedItem)
        emit('answer-changed', updatedPlacements)
        emit('drop-in-zone', { zoneId, item: draggedItem })
      }
      
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
        
        emit('answer-changed', updatedPlacements)
        emit('remove-dropped-item', { zoneId, itemIndex, item: removedItem })
      }
    }

    // ==========================================
    // WATCHERS
    // ==========================================
    watch(() => props.userAnswer, (newValue) => {
      if (exerciseType.value !== 'fill-blank' && exerciseType.value !== 'ordering') {
        localUserAnswer.value = newValue || ''
      }
    }, { immediate: true })

    watch(() => props.fillBlankAnswers, (newValue) => {
      if (Array.isArray(newValue)) {
        if (localFillBlankAnswers.value.length === 0 || 
            localFillBlankAnswers.value.every(answer => !answer || answer.trim() === '')) {
          localFillBlankAnswers.value = [...newValue]
        }
      }
    }, { immediate: true, deep: true })

    // ✅ FIXED: Watch for ordering items changes
    watch(() => props.orderingItems, (newValue) => {
      if (Array.isArray(newValue) && newValue.length > 0) {
        localOrderingItems.value = [...newValue]
      }
    }, { immediate: true, deep: true })

    watch(() => props.currentExercise, (newExercise, oldExercise) => {
      if (newExercise && newExercise !== oldExercise) {
        localUserAnswer.value = props.userAnswer || ''
        
        if (newExercise.type === 'fill-blank') {
          nextTick(() => {
            initializeFillBlankAnswers()
          })
        }
        
        // ✅ FIXED: Initialize ordering items when exercise changes
        if (newExercise.type === 'ordering') {
          nextTick(() => {
            initializeOrderingItems()
          })
        }
        
        // Special handling for matching exercises
        if (newExercise.type === 'matching') {
          console.log('🔗 Matching exercise changed:', {
            question: newExercise.question,
            pairs: newExercise.pairs,
            leftItemsCount: leftItems.value.length,
            rightItemsCount: rightItems.value.length
          })
          
          // Clear any existing selection when exercise changes
          emit('matching-item-selected', null)
        }
      }
    }, { immediate: true })

    // ==========================================
    // LIFECYCLE
    // ==========================================
    onMounted(() => {
      localUserAnswer.value = props.userAnswer || ''
      initializeFillBlankAnswers()
      
      // ✅ FIXED: Initialize ordering items on mount
      if (props.currentExercise?.type === 'ordering') {
        initializeOrderingItems()
      }
    })

    // ==========================================
    // RETURN
    // ==========================================
    return {
      // State
      localUserAnswer,
      localFillBlankAnswers,
      draggedDragItem,
      dropOverZone,
      showDebugInfo,
      
      // ✅ FIXED: Ordering state
      localOrderingItems,
      draggedOrderingItem,
      dropTargetIndex,
      
      // Computed
      isExerciseStep,
      isQuizStep,
      exerciseType,
      exerciseOptions,
      quizOptions,
      leftItems,
      rightItems,
      getOriginalRightItems,
      isLastExercise,
      isLastQuiz,
      blankCount,
      canSubmitAnswer,
      
      // Fill-blank methods
      getFillBlankValue,
      handleFillBlankInput,
      renderFillBlankTemplate,
      debugFillBlank,
      initializeFillBlankAnswers,
      
      // Option selection methods
      selectOption,
      selectQuizOption,
      selectTrueFalse,
      
      // Enhanced matching methods with shuffling support
      handleMatchingItemClick,
      handleRemovePair,
      selectMatchingItem,
      removeMatchingPair,
      isItemMatched,
      getLeftItemText,
      getRightItemText,
      debugMatching,
      getActualRightIndex,
      
      // ✅ FIXED: Ordering methods
      initializeOrderingItems,
      getOrderingItemText,
      moveOrderingItem,
      startOrderingDrag,
      endOrderingDrag,
      handleOrderingDragOver,
      handleOrderingDragEnter,
      handleOrderingDragLeave,
      handleOrderingDrop,
      debugOrdering,
      
      // Drag and drop methods
      getDragItemText,
      getZoneId,
      startDragItem,
      endDragItem,
      dragOverZone,
      dragLeaveZone,
      dropInZone,
      getDropZoneItems,
      removeDroppedItem
    }
  }
}
</script>

<style scoped>
/* ==========================================
   COMPACT BASE LAYOUT - REDUCED PADDING & MARGINS
   ========================================== */
   .interactive-panel {
  background: #f8fafc;
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  gap: 12px;
}

.exercise-content,
.quiz-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.exercise-header,
.quiz-header {
  padding: 12px 16px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.exercise-header h3,
.quiz-header h3 {
  font-size: 1.1rem;
  color: #4c1d95;
  margin: 0;
  font-weight: 700;
}

.exercise-counter,
.quiz-counter {
  font-size: 0.85rem;
  color: #6b46c1;
  font-weight: 600;
  background: rgba(107, 70, 193, 0.1);
  padding: 4px 10px;
  border-radius: 10px;
}

.exercise-body,
.quiz-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exercise-actions,
.quiz-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* ==========================================
   COMPACT QUESTION STYLING
   ========================================== */
.question-text,
.quiz-question {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #ddd6fe;
  box-shadow: 0 1px 3px rgba(107, 70, 193, 0.1);
}

/* ==========================================
   COMPACT FORM CONTROLS
   ========================================== */
.answer-input {
  margin: 0;
}

.answer-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 2px solid #ddd6fe;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;
  background: white;
  box-sizing: border-box;
}

.answer-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
}

.answer-textarea:disabled {
  background: #f8fafc;
  color: #9ca3af;
}

/* ==========================================
   COMPACT OPTIONS STYLING
   ========================================== */
.options-list,
.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.option-item,
.quiz-option {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  overflow: hidden;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 10px;
}

.option-item:hover,
.quiz-option:hover {
  border-color: #8b5cf6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.option-item.selected,
.quiz-option.selected {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.option-item.disabled,
.quiz-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.option-radio {
  display: none;
}

.option-text {
  font-size: 0.9rem;
  line-height: 1.3;
  flex: 1;
  color: #374151;
}

/* ==========================================
   COMPACT TRUE/FALSE STYLING
   ========================================== */
.true-false-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0;
}

.tf-option {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 16px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 50px;
}

.tf-option:hover {
  border-color: #8b5cf6;
  transform: translateY(-1px);
}

.tf-option.selected {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.tf-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.tf-option input {
  display: none;
}

.tf-option span {
  font-weight: 600;
  color: #374151;
}

/* ==========================================
   COMPACT FILL BLANK STYLING
   ========================================== */
.fill-blank-template {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #ddd6fe;
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

.blank-indicator {
  background: #8b5cf6;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
}

.fill-blank-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.blank-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  transition: all 0.15s ease;
}

.blank-input-group:hover {
  border-color: #ddd6fe;
}

.blank-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4c1d95;
  margin: 0;
}

.blank-input {
  padding: 10px 12px;
  border: 2px solid #ddd6fe;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.15s ease;
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.blank-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
}

.blank-input:disabled {
  background: #f8fafc;
  color: #9ca3af;
  border-color: #e2e8f0;
}

.input-preview {
  font-size: 0.75rem;
  color: #6b46c1;
  font-style: italic;
  padding: 2px 0;
}

/* ==========================================
   COMPACT MATCHING STYLING
   ========================================== */
.matching-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 0;
}

.matching-side {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.matching-side h4 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #4c1d95;
  text-align: center;
}

.matching-item {
  position: relative;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  text-align: center;
  user-select: none;
}

.matching-item:hover:not(.disabled) {
  border-color: #8b5cf6;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(139, 92, 246, 0.2);
}

.matching-item.selected {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  font-weight: bold;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.matching-item.matched {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  opacity: 0.8;
}

.matching-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 1rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
}

.matching-pairs {
  margin: 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.matching-pairs h4 {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  color: #4c1d95;
}

.pair-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd6fe;
}

.pair-text {
  font-weight: 600;
  font-size: 0.85rem;
  color: #4c1d95;
}

.remove-pair {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8rem;
  transition: all 0.15s ease;
}

.remove-pair:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.matching-instructions {
  margin: 0;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-size: 0.85rem;
}

.current-selection {
  margin-top: 6px;
  font-style: italic;
  color: #1e40af;
  font-size: 0.8rem;
}

/* ==========================================
   COMPACT ORDERING STYLING
   ========================================== */
.ordering-instructions {
  background: rgba(139, 92, 246, 0.1);
  border: 2px solid #ddd6fe;
  border-radius: 6px;
  padding: 10px 12px;
  margin: 0;
  font-size: 0.85rem;
  color: #4c1d95;
  text-align: center;
  font-weight: 600;
}

.ordering-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.ordering-item {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  cursor: move;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
}

.ordering-item:hover:not(.disabled) {
  border-color: #8b5cf6;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(139, 92, 246, 0.15);
}

.ordering-item.dragging {
  opacity: 0.7;
  transform: rotate(2deg) scale(1.02);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3);
  z-index: 1000;
}

.ordering-item.drop-target {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
  border-style: dashed;
  border-width: 2px;
}

.ordering-item.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.ordering-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

.drag-handle {
  color: #8b5cf6;
  font-size: 1.2rem;
  cursor: grab;
  font-weight: bold;
  transition: all 0.15s ease;
  min-width: 16px;
  text-align: center;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle.disabled {
  cursor: not-allowed;
  color: #9ca3af;
}

.item-text {
  flex: 1;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
  line-height: 1.3;
}

.item-number {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.ordering-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: auto;
}

.move-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  width: 28px;
  height: 20px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: bold;
  color: #6b7280;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.move-btn:hover {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
  transform: scale(1.05);
}

.move-btn:active {
  transform: scale(0.95);
}

/* ==========================================
   COMPACT DRAG AND DROP STYLING
   ========================================== */
.drag-drop-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 0;
}

.drag-items {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.drag-items h4 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #4c1d95;
  text-align: center;
}

.drag-item {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 6px;
  cursor: move;
  transition: all 0.15s ease;
  font-size: 0.85rem;
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

.drag-item.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.drop-zones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drop-zone {
  background: white;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  min-height: 60px;
  transition: all 0.15s ease;
}

.drop-zone.drag-over {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.drop-zone.disabled {
  opacity: 0.6;
}

.zone-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4c1d95;
  margin-bottom: 6px;
  text-align: center;
}

.zone-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dropped-item {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid #ddd6fe;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 0.8rem;
  color: #4c1d95;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.remove-dropped {
  color: #ef4444;
  font-weight: bold;
  margin-left: 6px;
}

.no-dragdrop-data {
  background: rgba(251, 191, 36, 0.1);
  border: 2px solid #fcd34d;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: #92400e;
}

/* ==========================================
   COMPACT CONFIRMATION AND FEEDBACK
   ========================================== */
.confirmation-section {
  margin: 0;
}

.second-chance-indicator {
  background: rgba(251, 191, 36, 0.1);
  border: 2px solid #fcd34d;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.attempt-counter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attempt-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #92400e;
}

.attempt-dots {
  display: flex;
  gap: 3px;
}

.attempt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: all 0.15s ease;
}

.attempt-dot.filled {
  background: #f59e0b;
}

.attempt-dot.current {
  background: #8b5cf6;
  transform: scale(1.2);
}

.confirmation-message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  text-align: center;
  font-size: 0.9rem;
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

.correct-answer-display {
  background: rgba(16, 185, 129, 0.1);
  border: 2px solid #a7f3d0;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
}

.correct-answer-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #047857;
  margin-bottom: 6px;
}

.correct-answer-text {
  font-size: 0.9rem;
  color: #065f46;
  font-weight: 500;
}

/* ==========================================
   COMPACT HINTS STYLING
   ========================================== */
.hints-section {
  margin: 0;
}

.hint {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  line-height: 1.3;
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
  font-size: 1rem;
  flex-shrink: 0;
}

.hint-text {
  flex: 1;
}

.clear-hint-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  margin-left: 6px;
  transition: color 0.15s ease;
}

.clear-hint-btn:hover {
  color: #ef4444;
}

/* ==========================================
   COMPACT BUTTONS
   ========================================== */
.hint-btn,
.submit-btn,
.next-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
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
  box-shadow: 0 3px 8px rgba(139, 92, 246, 0.3);
}

.submit-btn.disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #d1d5db;
}

.submit-btn.second-chance {
  background: #f59e0b;
  border-color: #f59e0b;
}

.submit-btn.second-chance:hover:not(.disabled) {
  background: #d97706;
  border-color: #d97706;
}

.next-btn {
  background: #10b981;
  color: white;
  border: 2px solid #10b981;
}

.next-btn:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
}

.next-icon {
  font-size: 1rem;
}

.second-chance-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ==========================================
   COMPACT DEBUG STYLING
   ========================================== */
.debug-section {
  margin: 12px 0;
  padding: 8px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-size: 0.8rem;
}

.debug-section h4 {
  margin: 0 0 6px 0;
  color: #dc2626;
}

.debug-section p {
  margin: 2px 0;
  color: #7f1d1d;
  word-break: break-all;
}

.debug-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  margin-top: 6px;
  font-size: 0.75rem;
}

/* ==========================================
   COMPACT NO CONTENT STATE
   ========================================== */
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
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.7;
}

.no-content h4 {
  margin: 0 0 6px 0;
  font-size: 1rem;
  color: #4b5563;
}

.no-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

/* ==========================================
   COMPACT SCROLLBAR STYLING
   ========================================== */
.exercise-body::-webkit-scrollbar,
.quiz-body::-webkit-scrollbar {
  width: 4px;
}

.exercise-body::-webkit-scrollbar-track,
.quiz-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.exercise-body::-webkit-scrollbar-thumb,
.quiz-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.exercise-body::-webkit-scrollbar-thumb:hover,
.quiz-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ==========================================
   IMPROVED RESPONSIVE DESIGN
   ========================================== */
@media (max-width: 768px) {
  .interactive-panel {
    padding: 12px;
    gap: 10px;
  }
  
  .drag-drop-container,
  .matching-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .true-false-options {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .exercise-actions,
  .quiz-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .exercise-header,
  .quiz-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
  }
  
  .question-text,
  .quiz-question {
    font-size: 0.95rem;
    padding: 12px;
  }

  .blank-input-group {
    padding: 10px;
  }

  .ordering-container {
    padding: 10px;
  }

  .ordering-item-content {
    padding: 8px 10px;
    gap: 8px;
  }

  .ordering-controls {
    flex-direction: row;
    gap: 3px;
  }

  .move-btn {
    width: 24px;
    height: 18px;
    font-size: 0.7rem;
  }

  .drag-handle {
    font-size: 1rem;
    min-width: 14px;
  }

  .item-number {
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
  }

  .matching-side {
    padding: 10px;
  }

  .matching-item {
    padding: 8px 10px;
    margin-bottom: 4px;
    font-size: 0.8rem;
  }

  .pair-item {
    padding: 6px 10px;
    margin-bottom: 4px;
  }

  .pair-text {
    font-size: 0.8rem;
  }

  .remove-pair {
    width: 18px;
    height: 18px;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .interactive-panel {
    padding: 8px;
    gap: 8px;
  }
  
  .exercise-header h3,
  .quiz-header h3 {
    font-size: 1rem;
  }
  
  .question-text,
  .quiz-question {
    font-size: 0.9rem;
    padding: 10px;
  }
  
  .option-item,
  .quiz-option {
    padding: 10px 12px;
    min-height: 40px;
  }
  
  .tf-option {
    padding: 12px;
  }

  .blank-input-group {
    padding: 8px;
  }

  .blank-input {
    padding: 8px 10px;
    font-size: 0.85rem;
  }

  .ordering-instructions {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .ordering-container {
    padding: 8px;
    gap: 4px;
  }

  .ordering-item-content {
    padding: 6px 8px;
    gap: 6px;
  }

  .item-text {
    font-size: 0.8rem;
  }

  .ordering-controls {
    display: none; /* Hide buttons on very small screens, rely on drag only */
  }

  .drag-handle {
    font-size: 0.9rem;
  }

  .item-number {
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
  }

  .matching-container {
    gap: 8px;
  }

  .matching-side {
    padding: 8px;
  }

  .matching-item {
    padding: 6px 8px;
    font-size: 0.75rem;
  }

  .drag-drop-container {
    gap: 8px;
  }

  .drag-items,
  .drop-zones {
    padding: 8px;
  }

  .drag-item {
    padding: 6px 8px;
    font-size: 0.8rem;
  }

  .drop-zone {
    padding: 8px;
    min-height: 50px;
  }
}

/* ==========================================
   IMPROVED ACCESSIBILITY
   ========================================== */
.interactive-panel *:focus {
  outline: 2px solid #8b5cf6;
  outline-offset: 1px;
}

@media (prefers-contrast: high) {
  .option-item,
  .quiz-option,
  .tf-option,
  .blank-input,
  .drag-item,
  .ordering-item {
    border-width: 3px;
  }
  
  .confirmation-message {
    border-width: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .drag-item.dragging,
  .ordering-item.dragging {
    transform: none;
  }

  .second-chance-icon,
  .selection-indicator {
    animation: none;
  }
}

/* ==========================================
   IMPROVED PRINT STYLES
   ========================================== */
@media print {
  .interactive-panel {
    padding: 0;
    background: white;
  }
  
  .exercise-actions,
  .quiz-actions,
  .debug-section,
  .ordering-controls {
    display: none;
  }
  
  .option-item,
  .quiz-option,
  .ordering-item {
    border: 1px solid #000;
    break-inside: avoid;
  }
}

/* ==========================================
   ENHANCED VISUAL FEEDBACK
   ========================================== */
.ordering-item[draggable="true"]:hover .drag-handle {
  color: #6366f1;
  transform: scale(1.05);
}

.ordering-item.dragging .drag-handle {
  color: #8b5cf6;
  transform: scale(1.1);
}

/* ==========================================
   IMPROVED LAYOUT FOR BETTER SPACE USAGE
   ========================================== */

/* Stack elements more efficiently on smaller screens */
@media (max-width: 1024px) {
  .matching-container {
    grid-template-columns: 1fr;
  }
  
  .matching-side {
    margin-bottom: 8px;
  }
  
  .drag-drop-container {
    grid-template-columns: 1fr;
  }
}

/* Optimize button layouts */
.exercise-actions,
.quiz-actions {
  justify-content: flex-start;
  align-items: center;
}

.exercise-actions > *,
.quiz-actions > * {
  flex: 0 0 auto;
}

/* Better text wrapping */
.option-text,
.item-text,
.pair-text {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* Improved focus management */
.matching-item:focus,
.ordering-item:focus,
.drag-item:focus {
  outline: 3px solid #8b5cf6;
  outline-offset: 2px;
  z-index: 10;
}

/* Better visual hierarchy */
.exercise-body > *:not(:last-child),
.quiz-body > *:not(:last-child) {
  margin-bottom: 0; /* Reset margins, use gap instead */
}

/* Ensure consistent spacing */
.fill-blank-inputs .blank-input-group:last-child,
.options-list .option-item:last-child,
.quiz-options .quiz-option:last-child {
  margin-bottom: 0;
}

/* Improved drag and drop visual feedback */
.drag-item:active {
  transform: scale(0.98);
}

.drop-zone.drag-over::before {
  content: "Отпустите здесь";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  color: #8b5cf6;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 5;
}

.drop-zone {
  position: relative;
}

/* Better loading states */
.option-item.loading,
.quiz-option.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* Enhanced success animations */
.confirmation-message.correct {
  animation: successPulse 0.6s ease-out;
}

@keyframes successPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

/* Improved error state styling */
.confirmation-message.incorrect {
  animation: errorShake 0.5s ease-out;
}

@keyframes errorShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

/* Better spacing for touch interfaces */
@media (pointer: coarse) {
  .option-item,
  .quiz-option,
  .tf-option,
  .matching-item,
  .ordering-item,
  .drag-item {
    min-height: 48px; /* Minimum touch target size */
  }
  
  .move-btn,
  .remove-pair,
  .clear-hint-btn {
    min-width: 44px;
    min-height: 44px;
  }
}

/* Optimize for very wide screens */
@media (min-width: 1200px) {
  .interactive-panel {
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .matching-container,
  .drag-drop-container {
    gap: 24px;
  }
}

/* Ensure proper stacking context */
.ordering-item.dragging {
  z-index: 1000;
}

.matching-item.selected {
  z-index: 10;
}

.drop-zone.drag-over {
  z-index: 5;
}
</style>