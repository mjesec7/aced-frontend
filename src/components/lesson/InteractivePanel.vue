<template>
  <div class="interactive-panel">
    <!-- Exercise Content -->
    <div v-if="isExerciseStep" class="exercise-content">
      <!-- Header -->
      <div class="exercise-header">
        <h3>{{ currentExercise?.title || 'Упражнение' }}</h3>
        <div class="exercise-counter">
          {{ exerciseIndex + 1 }} из {{ totalExercises }}
        </div>
      </div>

      <!-- Scrollable Body -->
      <div class="exercise-body">
        <div class="exercise-content-scroll">
          <div class="scroll-content-wrapper">
            
            <!-- Short Answer -->
            <div v-if="exerciseType === 'short-answer'" class="exercise-type">
              <div class="question-text">{{ currentExercise?.question }}</div>
              <div class="answer-input">
                <textarea
                  v-model="localUserAnswer"
                  @input="updateAnswer"
                  placeholder="Введите ваш ответ здесь..."
                  rows="4"
                  class="answer-textarea"
                  :disabled="showCorrectAnswer"
                />
              </div>
              <div class="spacer"></div>
            </div>

            <!-- Multiple Choice -->
            <div v-else-if="exerciseType === 'multiple-choice' || exerciseType === 'abc'" class="exercise-type">
              <div class="question-text">{{ currentExercise?.question }}</div>
              <div class="options-list">
                <div 
                  v-for="(option, index) in exerciseOptions" 
                  :key="index"
                  class="option-item"
                  :class="{ selected: localUserAnswer === option, disabled: showCorrectAnswer }"
                  @click="!showCorrectAnswer && selectOption(option)"
                  tabindex="0"
                  @keypress.enter="!showCorrectAnswer && selectOption(option)"
                  @keypress.space.prevent="!showCorrectAnswer && selectOption(option)"
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
              <div class="spacer"></div>
            </div>

            <!-- Fill in Blanks -->
            <div v-else-if="exerciseType === 'fill-blank'" class="exercise-type">
              <div class="question-text">{{ currentExercise?.question }}</div>
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
              <div class="spacer"></div>
            </div>

            <!-- True/False -->
            <div v-else-if="exerciseType === 'true-false'" class="exercise-type">
              <div class="question-text">{{ currentExercise?.question }}</div>
              <div v-if="currentExercise?.statement" class="statement-text">
                {{ currentExercise.statement }}
              </div>
              <div class="true-false-options">
                <div 
                  class="tf-option"
                  :class="{ selected: localUserAnswer === 'true', disabled: showCorrectAnswer }"
                  @click="!showCorrectAnswer && selectTrueFalse('true')"
                  tabindex="0"
                  @keypress.enter="!showCorrectAnswer && selectTrueFalse('true')"
                  @keypress.space.prevent="!showCorrectAnswer && selectTrueFalse('true')"
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
                  :class="{ selected: localUserAnswer === 'false', disabled: showCorrectAnswer }"
                  @click="!showCorrectAnswer && selectTrueFalse('false')"
                  tabindex="0"
                  @keypress.enter="!showCorrectAnswer && selectTrueFalse('false')"
                  @keypress.space.prevent="!showCorrectAnswer && selectTrueFalse('false')"
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
              <div class="spacer"></div>
            </div>

            <!-- Matching -->
            <div v-else-if="exerciseType === 'matching'" class="exercise-type">
              <div class="question-text">{{ currentExercise?.question }}</div>
              <div class="matching-container">
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
                    tabindex="0"
                    @keypress.enter="handleMatchingItemClick('left', index)"
                    @keypress.space.prevent="handleMatchingItemClick('left', index)"
                  >
                    {{ item }}
                    <span v-if="selectedMatchingItem?.side === 'left' && selectedMatchingItem?.index === index" class="selection-indicator">👆</span>
                  </div>
                </div>
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
                    tabindex="0"
                    @keypress.enter="handleMatchingItemClick('right', index)"
                    @keypress.space.prevent="handleMatchingItemClick('right', index)"
                  >
                    {{ item }}
                    <span v-if="selectedMatchingItem?.side === 'right' && selectedMatchingItem?.index === index" class="selection-indicator">👆</span>
                  </div>
                </div>
              </div>
              
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
                    :aria-label="`Удалить связь ${index + 1}`"
                  >×</button>
                </div>
              </div>
              
              <div class="matching-instructions">
                <p>💡 <strong>Инструкция:</strong> Нажмите на элемент слева, затем на соответствующий элемент справа для создания связи.</p>
                <p v-if="selectedMatchingItem" class="current-selection">
                  🎯 Выбран элемент: <strong>{{ selectedMatchingItem.side === 'left' ? 'слева' : 'справа' }}</strong> - 
                  "{{ selectedMatchingItem.side === 'left' ? leftItems[selectedMatchingItem.index] : rightItems[selectedMatchingItem.index] }}"
                </p>
              </div>
              <div class="spacer"></div>
            </div>

            <!-- Ordering -->
            <div v-else-if="exerciseType === 'ordering'" class="exercise-type">
              <div class="question-text">{{ currentExercise?.question }}</div>
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
                  tabindex="0"
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
                        :aria-label="`Переместить ${getOrderingItemText(item)} вверх`"
                        title="Переместить вверх"
                      >↑</button>
                      <button 
                        v-if="index < localOrderingItems.length - 1"
                        @click="moveOrderingItem(index, index + 1)"
                        class="move-btn move-down"
                        :aria-label="`Переместить ${getOrderingItemText(item)} вниз`"
                        title="Переместить вниз"
                      >↓</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="spacer"></div>
            </div>

            <!-- Drag and Drop -->
            <div v-else-if="exerciseType === 'drag-drop'" class="exercise-type">
              <div class="question-text">{{ currentExercise?.question }}</div>
              <div v-if="availableDragItems.length > 0 && dropZones.length > 0" class="drag-drop-container">
                <div class="drag-items">
                  <h4>Перетащите элементы:</h4>
                  <div 
                    v-for="(item, index) in availableDragItems" 
                    :key="'drag-' + index"
                    class="drag-item"
                    :class="{ dragging: draggedDragItem === item, disabled: showCorrectAnswer }"
                    :draggable="!showCorrectAnswer"
                    @dragstart="startDragItem(item, $event)"
                    @dragend="endDragItem"
                    @touchstart="handleTouchStart($event, item)"
                    @touchmove.prevent="handleTouchMove"
                    @touchend="handleTouchEnd"
                    tabindex="0"
                    :aria-label="`Перетащить ${getDragItemText(item)}`"
                  >
                    {{ getDragItemText(item) }}
                  </div>
                </div>
                <div class="drop-zones">
                  <div 
                    v-for="(zone, index) in dropZones" 
                    :key="'zone-' + index"
                    class="drop-zone"
                    :class="{ 'drag-over': dropOverZone === getZoneId(zone), disabled: showCorrectAnswer }"
                    @dragover.prevent="dragOverZone(getZoneId(zone), $event)"
                    @dragleave="dragLeaveZone($event)"
                    @drop="dropInZone(getZoneId(zone), $event)"
                    :aria-label="`Зона ${zone.label}`"
                  >
                    <div class="zone-label">{{ zone.label }}</div>
                    <div class="zone-items">
                      <div 
                        v-for="(item, itemIndex) in getDropZoneItems(getZoneId(zone))" 
                        :key="'dropped-' + itemIndex"
                        class="dropped-item"
                        @click="!showCorrectAnswer && removeDroppedItem(getZoneId(zone), itemIndex)"
                        tabindex="0"
                        @keypress.enter="!showCorrectAnswer && removeDroppedItem(getZoneId(zone), itemIndex)"
                        @keypress.space.prevent="!showCorrectAnswer && removeDroppedItem(getZoneId(zone), itemIndex)"
                        :aria-label="`Удалить ${getDragItemText(item)} из ${zone.label}`"
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
              <div class="spacer"></div>
            </div>

            <!-- Confirmation Section -->
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
                      :aria-label="`Попытка ${n}`"
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
                role="alert"
                :aria-live="answerWasCorrect ? 'polite' : 'assertive'"
              >
                {{ confirmation }}
              </div>
              <div v-if="showCorrectAnswer && correctAnswerText" class="correct-answer-display">
                <div class="correct-answer-label">💡 Правильный ответ:</div>
                <div class="correct-answer-text">{{ correctAnswerText }}</div>
              </div>
            </div>

            <!-- Hints Section -->
            <div v-if="(currentHint || smartHint) && !showCorrectAnswer" class="hints-section">
              <div v-if="currentHint" class="hint basic-hint">
                <div class="hint-icon">💡</div>
                <div class="hint-text">{{ currentHint }}</div>
              </div>
              <div v-if="smartHint" class="hint smart-hint">
                <div class="hint-icon">🤖</div>
                <div class="hint-text">{{ smartHint }}</div>
                <button 
                  @click="$emit('clear-hint')" 
                  class="clear-hint-btn"
                  aria-label="Очистить подсказку"
                >×</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Quiz Content -->
    <div v-else-if="isQuizStep" class="quiz-content">
      <!-- Header -->
      <div class="quiz-header">
        <h3>{{ currentQuiz?.title || 'Вопрос' }}</h3>
        <div class="quiz-counter">
          {{ quizIndex + 1 }} из {{ totalQuizzes }}
        </div>
      </div>

      <!-- Scrollable Body -->
      <div class="quiz-body">
        <div class="quiz-content-scroll">
          <div class="scroll-content-wrapper">
            
            <div class="quiz-question">{{ currentQuiz?.question }}</div>

            <div class="quiz-options">
              <div 
                v-for="(option, index) in quizOptions" 
                :key="index"
                class="quiz-option"
                :class="{ selected: localUserAnswer === option, disabled: showCorrectAnswer }"
                @click="!showCorrectAnswer && selectQuizOption(option)"
                tabindex="0"
                @keypress.enter="!showCorrectAnswer && selectQuizOption(option)"
                @keypress.space.prevent="!showCorrectAnswer && selectQuizOption(option)"
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

            <!-- Quiz Confirmation -->
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
                      :aria-label="`Попытка ${n}`"
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
                role="alert"
                :aria-live="answerWasCorrect ? 'polite' : 'assertive'"
              >
                {{ confirmation }}
              </div>
              <div v-if="showCorrectAnswer && correctAnswerText" class="correct-answer-display">
                <div class="correct-answer-label">💡 Правильный ответ:</div>
                <div class="correct-answer-text">{{ correctAnswerText }}</div>
              </div>
            </div>
            
            <div class="spacer"></div>

          </div>
        </div>
      </div>
    </div>

    <!-- No Content State -->
    <div v-else class="no-content">
      <div class="no-content-icon">📝</div>
      <h4>Нет интерактивного содержимого</h4>
      <p>Для этого шага нет упражнений или вопросов</p>
    </div>

    <!-- Action Buttons - Same Level as Content Panel -->
    <div v-if="isExerciseStep || isQuizStep" class="interactive-actions">
      <!-- Exercise Buttons -->
      <template v-if="isExerciseStep">
        <button 
          v-if="!confirmation && attemptCount === 0"
          @click="$emit('show-hint')" 
          class="interactive-nav-btn hint-btn"
          aria-label="Показать подсказку"
        >
          💡 Подсказка
        </button>
        
        <button 
          v-if="!confirmation || (isOnSecondChance && !showCorrectAnswer)"
          @click="$emit('submit')"
          :disabled="!canSubmitAnswer"
          class="interactive-nav-btn submit-btn"
          :class="{ disabled: !canSubmitAnswer, 'second-chance': isOnSecondChance }"
          :aria-label="isOnSecondChance ? 'Попробовать ещё раз' : 'Проверить ответ'"
        >
          {{ isOnSecondChance ? 'Попробовать ещё раз' : 'Проверить' }}
          <span v-if="isOnSecondChance" class="second-chance-icon">🔄</span>
        </button>
        
        <button 
          v-if="confirmation && (answerWasCorrect || showCorrectAnswer)"
          @click="$emit('next-exercise')"
          class="interactive-nav-btn next-btn"
          :aria-label="isLastExercise ? 'Завершить упражнения' : 'Следующее упражнение'"
        >
          {{ isLastExercise ? 'Завершить' : 'Далее' }}
          <span class="next-icon">→</span>
        </button>
      </template>

      <!-- Quiz Buttons -->
      <template v-else-if="isQuizStep">
        <button 
          v-if="!confirmation || (isOnSecondChance && !showCorrectAnswer)"
          @click="$emit('submit')"
          :disabled="!canSubmitAnswer"
          class="interactive-nav-btn submit-btn"
          :class="{ disabled: !canSubmitAnswer, 'second-chance': isOnSecondChance }"
          :aria-label="isOnSecondChance ? 'Попробовать ещё раз' : 'Ответить на вопрос'"
        >
          {{ isOnSecondChance ? 'Попробовать ещё раз' : 'Ответить' }}
          <span v-if="isOnSecondChance" class="second-chance-icon">🔄</span>
        </button>
        
        <button 
          v-if="confirmation && (answerWasCorrect || showCorrectAnswer)"
          @click="$emit('next-quiz')"
          class="interactive-nav-btn next-btn"
          :aria-label="isLastQuiz ? 'Завершить викторину' : 'Следующий вопрос'"
        >
          {{ isLastQuiz ? 'Завершить' : 'Следующий вопрос' }}
          <span class="next-icon">→</span>
        </button>
      </template>
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
    'answer-changed', 'fill-blank-updated', 'submit', 'next-exercise', 'next-quiz',
    'show-hint', 'clear-hint', 'matching-item-selected', 'remove-matching-pair',
    'drag-start', 'drag-drop', 'drag-item-start', 'drag-over-zone',
    'drag-leave-zone', 'drop-in-zone', 'remove-dropped-item'
  ],
  
  setup(props, { emit }) {
    // ========================
    // REACTIVE STATE
    // ========================
    const localUserAnswer = ref('')
    const localFillBlankAnswers = ref([])
    const draggedDragItem = ref(null)
    const dropOverZone = ref(null)
    const localOrderingItems = ref([])
    const draggedOrderingItem = ref(null)
    const dropTargetIndex = ref(null)
    const touchStartPos = ref({ x: 0, y: 0 })
    const draggedTouchItem = ref(null)

    // ========================
    // COMPUTED PROPERTIES
    // ========================
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
    
    const leftItems = computed(() => {
      if (!props.currentExercise?.pairs) return []
      const pairs = props.currentExercise.pairs
      if (Array.isArray(pairs)) {
        return pairs.map((pair) => {
          if (Array.isArray(pair)) return String(pair[0] || '')
          if (pair && typeof pair === 'object') {
            return String(pair.left || pair[0] || pair.question || pair.term || '')
          }
          return String(pair || '')
        }).filter(item => item.trim() !== '')
      }
      return []
    })
    
    const rightItems = computed(() => {
      if (!props.currentExercise?.pairs) return []
      const pairs = props.currentExercise.pairs
      if (Array.isArray(pairs)) {
        const rightItems = pairs.map((pair) => {
          if (Array.isArray(pair)) return String(pair[1] || '')
          if (pair && typeof pair === 'object') {
            return String(pair.right || pair[1] || pair.answer || pair.definition || '')
          }
          return String(pair || '')
        }).filter(item => item.trim() !== '')
        
        // Shuffle for challenge
        return [...rightItems].sort(() => Math.random() - 0.5)
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
      
      if (props.currentExercise.blanks && Array.isArray(props.currentExercise.blanks)) {
        return props.currentExercise.blanks.length
      }
      
      if (props.currentExercise.correctAnswers && Array.isArray(props.currentExercise.correctAnswers)) {
        return props.currentExercise.correctAnswers.length
      }
      
      if (props.currentExercise.answers && Array.isArray(props.currentExercise.answers)) {
        return props.currentExercise.answers.length
      }
      
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
          return props.matchingPairs.length > 0
          
        case 'ordering':
          return localOrderingItems.value.length > 0
          
        case 'drag-drop':
          const placements = Object.values(props.dragDropPlacements || {})
          return placements.some(items => Array.isArray(items) && items.length > 0)
          
        default:
          return false
      }
    })

    // ========================
    // ANSWER METHODS
    // ========================
    const updateAnswer = () => {
      emit('answer-changed', localUserAnswer.value)
    }

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

    // ========================
    // FILL BLANK METHODS
    // ========================
    const getFillBlankValue = (index) => {
      if (localFillBlankAnswers.value[index] !== undefined) {
        return localFillBlankAnswers.value[index]
      }
      return props.fillBlankAnswers[index] || ''
    }

    const handleFillBlankInput = (index, event) => {
      const value = event.target.value
      
      while (localFillBlankAnswers.value.length <= index) {
        localFillBlankAnswers.value.push('')
      }
      localFillBlankAnswers.value[index] = value
      localFillBlankAnswers.value = [...localFillBlankAnswers.value]
      
      emit('fill-blank-updated', { index, value })
    }

    const renderFillBlankTemplate = () => {
      if (!props.currentExercise?.template) return ''
      
      let template = props.currentExercise.template
      let blankIndex = 0
      
      template = template.replace(/\*/g, () => {
        return `<span class="blank-indicator">[Пропуск ${++blankIndex}]</span>`
      })
      
      template = template.replace(/_+/g, () => {
        return `<span class="blank-indicator">[Пропуск ${++blankIndex}]</span>`
      })
      
      template = template.replace(/\[blank\]/gi, () => {
        return `<span class="blank-indicator">[Пропуск ${++blankIndex}]</span>`
      })
      
      return template
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

    // ========================
    // MATCHING METHODS
    // ========================
    const handleMatchingItemClick = (side, index) => {
      if (props.showCorrectAnswer) return
      selectMatchingItem(side, index)
    }

    const handleRemovePair = (pairIndex) => {
      if (props.showCorrectAnswer) return
      removeMatchingPair(pairIndex)
    }
    
    const selectMatchingItem = (side, index) => {
      const currentSelection = props.selectedMatchingItem
      
      if (!currentSelection) {
        emit('matching-item-selected', { side, index })
        return
      }
      
      if (currentSelection.side === side && currentSelection.index === index) {
        emit('matching-item-selected', null)
        return
      }
      
      if (currentSelection.side === side) {
        emit('matching-item-selected', { side, index })
        return
      }
      
      let leftIndex, rightIndex
      
      if (side === 'left') {
        leftIndex = index
        rightIndex = currentSelection.index
      } else {
        leftIndex = currentSelection.index
        rightIndex = index
      }
      
      const newPair = { leftIndex, rightIndex }
      const currentPairs = props.matchingPairs || []
      const pairExists = currentPairs.some(pair => 
        pair.leftIndex === newPair.leftIndex && pair.rightIndex === newPair.rightIndex
      )
      
      if (!pairExists) {
        const updatedPairs = currentPairs.filter(pair => 
          pair.leftIndex !== newPair.leftIndex && pair.rightIndex !== newPair.rightIndex
        )
        updatedPairs.push(newPair)
        emit('answer-changed', updatedPairs)
      }
      
      emit('matching-item-selected', null)
    }
    
    const removeMatchingPair = (pairIndex) => {
      const currentPairs = props.matchingPairs || []
      
      if (pairIndex >= 0 && pairIndex < currentPairs.length) {
        const updatedPairs = currentPairs.filter((_, index) => index !== pairIndex)
        emit('answer-changed', updatedPairs)
        emit('remove-matching-pair', pairIndex)
      }
    }
    
    const isItemMatched = (side, index) => {
      const currentPairs = props.matchingPairs || []
      
      if (currentPairs.length === 0) return false
      
      if (side === 'left') {
        return currentPairs.some(pair => pair.leftIndex === index)
      } else {
        return currentPairs.some(pair => pair.rightIndex === index)
      }
    }
    
    const getLeftItemText = (index) => {
      if (index >= 0 && index < leftItems.value.length) {
        return leftItems.value[index]
      }
      return `Left Item ${index + 1}`
    }
    
    const getRightItemText = (index) => {
      if (index >= 0 && index < rightItems.value.length) {
        return rightItems.value[index]
      }
      return `Right Item ${index + 1}`
    }

    // ========================
    // ORDERING METHODS
    // ========================
    const initializeOrderingItems = () => {
      if (props.currentExercise?.items && Array.isArray(props.currentExercise.items)) {
        const items = props.currentExercise.items.map((item, index) => ({
          id: item.id || `item_${index}`,
          text: typeof item === 'string' ? item : (item.text || String(item)),
          originalIndex: index
        }))
        
        const shuffledItems = [...items].sort(() => Math.random() - 0.5)
        localOrderingItems.value = shuffledItems
        emit('answer-changed', localOrderingItems.value)
      }
    }

    const getOrderingItemText = (item) => {
      if (typeof item === 'string') return item
      if (item && item.text) return item.text
      return String(item || '')
    }

    const moveOrderingItem = (fromIndex, toIndex) => {
      if (fromIndex === toIndex || 
          fromIndex < 0 || fromIndex >= localOrderingItems.value.length ||
          toIndex < 0 || toIndex >= localOrderingItems.value.length) {
        return
      }
      
      const newItems = [...localOrderingItems.value]
      const [movedItem] = newItems.splice(fromIndex, 1)
      newItems.splice(toIndex, 0, movedItem)
      
      localOrderingItems.value = newItems
      emit('answer-changed', localOrderingItems.value)
    }

    const startOrderingDrag = (event, index) => {
      draggedOrderingItem.value = index
      
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', index.toString())
      }
    }

    const endOrderingDrag = () => {
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
    }

    const handleOrderingDrop = (event, dropIndex) => {
      event.preventDefault()
      
      const dragIndex = draggedOrderingItem.value
      
      if (dragIndex !== null && dragIndex !== dropIndex) {
        moveOrderingItem(dragIndex, dropIndex)
      }
      
      endOrderingDrag()
    }

    // ========================
    // DRAG AND DROP METHODS
    // ========================
    const startDragItem = (item, event) => {
      if (!item || props.showCorrectAnswer) return
      
      draggedDragItem.value = item
      
      if (event && event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', JSON.stringify(item))
      }
      
      emit('drag-item-start', { item, event })
    }

    const endDragItem = () => {
      draggedDragItem.value = null
      dropOverZone.value = null
    }

    const dragOverZone = (zoneId, event) => {
      if (!draggedDragItem.value || props.showCorrectAnswer) return
      
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
      
      let droppedItem = draggedDragItem.value
      
      if (!droppedItem && event && event.dataTransfer) {
        try {
          const transferData = event.dataTransfer.getData('text/plain')
          if (transferData) {
            droppedItem = JSON.parse(transferData)
          }
        } catch (e) {
          console.warn('Could not parse transfer data:', e)
        }
      }
      
      if (!droppedItem) return
      
      emit('drop-in-zone', { zoneId, item: droppedItem })
      
      draggedDragItem.value = null
      dropOverZone.value = null
    }

    const getDragItemText = (item) => {
      if (!item) return ''
      if (typeof item === 'string') return item
      if (item.text) return item.text
      if (item.label) return item.label
      if (item.name) return item.name
      if (item.title) return item.title
      if (item.content) return item.content
      return String(item)
    }

    const getZoneId = (zone) => {
      if (!zone) return 'default'
      if (typeof zone === 'string') return zone
      if (zone.id) return zone.id
      if (zone.label) return zone.label
      if (zone.name) return zone.name
      if (zone.title) return zone.title
      return String(zone)
    }

    const getDropZoneItems = (zoneId) => {
      const placements = props.dragDropPlacements || {}
      return placements[zoneId] || []
    }

    const removeDroppedItem = (zoneId, itemIndex) => {
      emit('remove-dropped-item', { zoneId, itemIndex })
    }

    // ========================
    // TOUCH SUPPORT
    // ========================
    const handleTouchStart = (event, item) => {
      if (props.showCorrectAnswer) return
      
      const touch = event.touches[0]
      touchStartPos.value = { x: touch.clientX, y: touch.clientY }
      draggedTouchItem.value = item
      event.preventDefault()
    }

    const handleTouchMove = (event) => {
      if (!draggedTouchItem.value) return
      
      event.preventDefault()
      
      const touch = event.touches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      
      const dropZone = element?.closest('.drop-zone')
      if (dropZone) {
        const zoneLabel = dropZone.querySelector('.zone-label')?.textContent
        if (zoneLabel) {
          dropOverZone.value = zoneLabel
        }
      } else {
        dropOverZone.value = null
      }
    }

    const handleTouchEnd = (event) => {
      if (!draggedTouchItem.value) return
      
      const touch = event.changedTouches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      
      const dropZone = element?.closest('.drop-zone')
      if (dropZone) {
        const zoneLabel = dropZone.querySelector('.zone-label')?.textContent
        if (zoneLabel) {
          dropInZone(zoneLabel, null)
        }
      }
      
      draggedTouchItem.value = null
      dropOverZone.value = null
    }

    // ========================
    // WATCHERS
    // ========================
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
        
        if (newExercise.type === 'ordering') {
          nextTick(() => {
            initializeOrderingItems()
          })
        }
        
        if (newExercise.type === 'matching') {
          emit('matching-item-selected', null)
        }
      }
    }, { immediate: true })

    // ========================
    // LIFECYCLE
    // ========================
    onMounted(() => {
      localUserAnswer.value = props.userAnswer || ''
      initializeFillBlankAnswers()
      
      if (props.currentExercise?.type === 'ordering') {
        initializeOrderingItems()
      }
    })

    // ========================
    // RETURN
    // ========================
    return {
      // State
      localUserAnswer,
      localFillBlankAnswers,
      draggedDragItem,
      dropOverZone,
      localOrderingItems,
      draggedOrderingItem,
      dropTargetIndex,
      touchStartPos,
      draggedTouchItem,
      
      // Computed
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
      
      // Methods
      updateAnswer,
      selectOption,
      selectQuizOption,
      selectTrueFalse,
      getFillBlankValue,
      handleFillBlankInput,
      renderFillBlankTemplate,
      initializeFillBlankAnswers,
      handleMatchingItemClick,
      handleRemovePair,
      selectMatchingItem,
      removeMatchingPair,
      isItemMatched,
      getLeftItemText,
      getRightItemText,
      initializeOrderingItems,
      getOrderingItemText,
      moveOrderingItem,
      startOrderingDrag,
      endOrderingDrag,
      handleOrderingDragOver,
      handleOrderingDragEnter,
      handleOrderingDragLeave,
      handleOrderingDrop,
      startDragItem,
      endDragItem,
      dragOverZone,
      dragLeaveZone,
      dropInZone,
      getDragItemText,
      getZoneId,
      getDropZoneItems,
      removeDroppedItem,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/InteractivePanel.css";

/* Enhanced scroll styling - FIXED HEIGHT CALCULATION */
.exercise-content-scroll,
.quiz-content-scroll {
  height: calc(100vh - 300px) !important; /* Increased from 200px to 300px */
  overflow-y: scroll !important;
  overflow-x: hidden !important;
  min-height: 200px !important; /* Reduced minimum */
  max-height: calc(100vh - 300px) !important; /* Increased from 200px to 300px */
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: auto !important;
  flex: 1;
  padding: 16px 20px 20px 20px;
}

.scroll-content-wrapper {
  min-height: 400px; /* Reduced from 600px */
  padding-bottom: 40px;
}

.spacer {
  height: 100px; /* Reduced from 200px */
  background: transparent;
}

/* CRITICAL: Match Content Panel Navigation Exactly */
.interactive-actions {
  display: flex !important;
  gap: 12px;
  padding: 16px 28px; /* EXACT match to content panel */
  border-top: 1px solid #e2e8f0; /* EXACT match to content panel */
  flex-shrink: 0 !important;
  background: white;
  flex-wrap: wrap;
  box-sizing: border-box;
  width: 100%;
  margin-top: auto;
  
  /* Force visibility - CRITICAL FIX */
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: all !important;
  z-index: 1000 !important;
  position: relative !important;
  
  /* Ensure it's always above the fold */
  min-height: 60px !important;
  max-height: 80px !important;
}

.interactive-nav-btn {
  display: block !important;
  padding: 10px 20px; /* EXACT match to content panel */
  border: none;
  border-radius: 6px; /* EXACT match to content panel */
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 100px; /* EXACT match to content panel */
  min-height: 40px; /* EXACT match to content panel */
  font-size: 0.95rem !important; /* EXACT match to content panel */
  visibility: visible !important;
  opacity: 1 !important;
  
  /* Ensure text fits */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.interactive-nav-btn.hint-btn {
  background: #f59e0b !important;
  color: white !important;
}

.interactive-nav-btn.hint-btn:hover {
  background: #d97706 !important;
  transform: translateY(-1px);
}

.interactive-nav-btn.submit-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
  color: white !important;
}

.interactive-nav-btn.submit-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
}

.interactive-nav-btn.submit-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.interactive-nav-btn.submit-btn.second-chance {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
}

.interactive-nav-btn.next-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
  color: white !important;
}

.interactive-nav-btn.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

/* RESPONSIVE FIXES */
@media (max-height: 700px) {
  .exercise-content-scroll,
  .quiz-content-scroll {
    height: calc(100vh - 250px) !important;
    max-height: calc(100vh - 250px) !important;
    min-height: 150px !important;
  }
  
  .interactive-actions {
    padding: 12px 28px !important;
    min-height: 50px !important;
  }
  
  .interactive-nav-btn {
    padding: 8px 16px !important;
    min-height: 36px !important;
    font-size: 0.9rem !important;
  }
}

@media (max-height: 600px) {
  .exercise-content-scroll,
  .quiz-content-scroll {
    height: calc(100vh - 200px) !important;
    max-height: calc(100vh - 200px) !important;
    min-height: 100px !important;
  }
  
  .interactive-actions {
    padding: 10px 28px !important;
    min-height: 45px !important;
  }
  
  .interactive-nav-btn {
    padding: 6px 14px !important;
    min-height: 32px !important;
    font-size: 0.85rem !important;
  }
}
</style>