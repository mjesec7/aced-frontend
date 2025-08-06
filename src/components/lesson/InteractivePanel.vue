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
                  :key="`option-${index}-${exerciseIndex}`"
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

            <!-- FIXED MATCHING EXERCISE -->
            <div v-else-if="exerciseType === 'matching'" class="exercise-type">
              <div class="question-text">{{ currentExercise?.question }}</div>
              
              <!-- Debug Info (remove in production) -->
              <div v-if="process.env.NODE_ENV === 'development'" class="debug-info">
                <small>Debug: Left items: {{ leftItems.length }}, Right items: {{ rightItems.length }}</small>
                <br>
                <small>Exercise pairs: {{ currentExercise?.pairs?.length || 0 }}</small>
                <br>
                <small>Current pairs: {{ matchingPairs.length }}</small>
                <br>
                <small>Right items mapping: {{ rightItemsMapping.length }}</small>
              </div>
              
              <div class="matching-container">
                <!-- Left Side -->
                <div class="matching-side left-side">
                  <h4>Соедините:</h4>
                  <div 
                    v-for="(item, index) in leftItems" 
                    :key="`left-${index}-${exerciseIndex}`"
                    class="matching-item"
                    :class="{ 
                      selected: isItemSelected('left', index),
                      matched: isItemMatched('left', index),
                      disabled: showCorrectAnswer
                    }"
                    @click="!showCorrectAnswer && handleMatchingClick('left', index)"
                    tabindex="0"
                    @keypress.enter="!showCorrectAnswer && handleMatchingClick('left', index)"
                    @keypress.space.prevent="!showCorrectAnswer && handleMatchingClick('left', index)"
                    :aria-label="`Left item ${index + 1}: ${item}`"
                  >
                    {{ item }}
                    <span v-if="isItemSelected('left', index)" class="selection-indicator">👆</span>
                    <span v-if="isItemMatched('left', index)" class="match-indicator">✓</span>
                  </div>
                </div>
                
                <!-- Right Side -->
                <div class="matching-side right-side">
                  <h4>С:</h4>
                  <div 
                    v-for="(item, index) in rightItems" 
                    :key="`right-${index}-${exerciseIndex}`"
                    class="matching-item"
                    :class="{ 
                      selected: isItemSelected('right', index),
                      matched: isItemMatched('right', index),
                      disabled: showCorrectAnswer
                    }"
                    @click="!showCorrectAnswer && handleMatchingClick('right', index)"
                    tabindex="0"
                    @keypress.enter="!showCorrectAnswer && handleMatchingClick('right', index)"
                    @keypress.space.prevent="!showCorrectAnswer && handleMatchingClick('right', index)"
                    :aria-label="`Right item ${index + 1}: ${item}`"
                  >
                    {{ item }}
                    <span v-if="isItemSelected('right', index)" class="selection-indicator">👆</span>
                    <span v-if="isItemMatched('right', index)" class="match-indicator">✓</span>
                  </div>
                </div>
              </div>
              
              <!-- Current Pairs Display -->
              <div v-if="matchingPairs && matchingPairs.length > 0" class="matching-pairs">
                <h4>Соединения ({{ matchingPairs.length }}):</h4>
                <div class="pairs-list">
                  <div 
                    v-for="(pair, index) in matchingPairs" 
                    :key="`pair-${index}-${exerciseIndex}`"
                    class="pair-item"
                    :class="{ 'pair-correct': isPairCorrect(pair) }"
                  >
                    <span class="pair-text">
                      <strong>{{ getLeftItemText(pair.leftIndex) }}</strong> 
                      <span class="pair-arrow">↔</span> 
                      <strong>{{ getRightItemText(pair.rightIndex, pair.rightDisplayIndex) }}</strong>
                    </span>
                    <button 
                      v-if="!showCorrectAnswer"
                      @click="removePair(index)" 
                      class="remove-pair"
                      type="button"
                      :aria-label="`Удалить связь ${index + 1}`"
                      title="Удалить связь"
                    >×</button>
                  </div>
                </div>
              </div>
              
              <!-- Instructions -->
              <div class="matching-instructions">
                <div class="instruction-main">
                  <span class="instruction-icon">💡</span>
                  <strong>Инструкция:</strong> Нажмите на элемент слева, затем на соответствующий элемент справа для создания связи.
                </div>
                
                <div v-if="selectedMatchingItem" class="current-selection">
                  <span class="selection-icon">🎯</span>
                  <span>Выбран элемент: <strong>{{ selectedMatchingItem.side === 'left' ? 'слева' : 'справа' }}</strong></span>
                  <span class="selected-text">"{{ getSelectedItemText() }}"</span>
                  <button 
                    @click="clearSelection" 
                    class="clear-selection"
                    title="Очистить выбор"
                  >×</button>
                </div>
                
                <div v-if="matchingPairs.length === 0" class="no-pairs-message">
                  <span class="warning-icon">⚠️</span>
                  Создайте хотя бы одну связь для продолжения
                </div>
                
                <div v-if="matchingPairs.length > 0 && matchingPairs.length < leftItems.length" class="progress-message">
                  <span class="progress-icon">📊</span>
                  Создано {{ matchingPairs.length }} из {{ leftItems.length }} связей
                </div>
                
                <div v-if="matchingPairs.length === leftItems.length" class="complete-message">
                  <span class="complete-icon">✅</span>
                  Все связи созданы! Можете проверить ответ.
                </div>
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
                  :key="`ordering-${item.id || item.text || index}-${exerciseIndex}`"
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
                    :key="`drag-${index}-${exerciseIndex}`"
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
                    :key="`zone-${index}-${exerciseIndex}`"
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
                        :key="`dropped-${itemIndex}-${exerciseIndex}`"
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
                :key="`quiz-option-${index}-${quizIndex}`"
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
    
    // 🔥 NEW: Store the mapping of shuffled right items to their original indices
    const rightItemsMapping = ref([])

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
    
    // 🔥 FIXED: Left items computation (unchanged but safe)
    const leftItems = computed(() => {
      try {
        if (!props.currentExercise?.pairs) {
          console.log('⚠️ No pairs found in exercise')
          return []
        }
        
        const pairs = props.currentExercise.pairs
        console.log('🔧 DEBUG: Computing left items from pairs:', pairs)
        
        if (!Array.isArray(pairs)) {
          console.warn('⚠️ Pairs is not an array:', typeof pairs)
          return []
        }
        
        const items = pairs.map((pair, index) => {
          try {
            let leftItem = ''
            
            if (Array.isArray(pair)) {
              leftItem = String(pair[0] || '')
            } else if (pair && typeof pair === 'object') {
              leftItem = String(pair.left || pair[0] || pair.question || pair.term || '')
            } else {
              leftItem = String(pair || '')
            }
            
            console.log(`  Left item ${index}: "${leftItem}"`)
            return leftItem.trim()
          } catch (itemError) {
            console.error(`❌ Error processing left item ${index}:`, itemError)
            return `Item ${index + 1}`
          }
        }).filter(item => item !== '')
        
        console.log('✅ Final left items:', items)
        return items
      } catch (error) {
        console.error('❌ Error computing left items:', error)
        return []
      }
    })
    
    // 🔥 FIXED: Right items computation with proper index tracking
    const rightItems = computed(() => {
      try {
        if (!props.currentExercise?.pairs) {
          console.log('⚠️ No pairs found in exercise')
          return []
        }
        
        const pairs = props.currentExercise.pairs
        console.log('🔧 DEBUG: Computing right items from pairs:', pairs)
        
        if (!Array.isArray(pairs)) {
          console.warn('⚠️ Pairs is not an array:', typeof pairs)
          return []
        }
        
        // Get items with their original indices
        const itemsWithIndices = pairs.map((pair, originalIndex) => {
          try {
            let rightItem = ''
            
            if (Array.isArray(pair)) {
              rightItem = String(pair[1] || '')
            } else if (pair && typeof pair === 'object') {
              rightItem = String(pair.right || pair[1] || pair.answer || pair.definition || '')
            } else {
              rightItem = String(pair || '')
            }
            
            console.log(`  Right item ${originalIndex}: "${rightItem}"`)
            return {
              text: rightItem.trim(),
              originalIndex: originalIndex
            }
          } catch (itemError) {
            console.error(`❌ Error processing right item ${originalIndex}:`, itemError)
            return {
              text: `Answer ${originalIndex + 1}`,
              originalIndex: originalIndex
            }
          }
        }).filter(item => item.text !== '')
        
        // 🔥 CRITICAL: Shuffle the items but keep track of original indices
        const shuffled = [...itemsWithIndices].sort(() => Math.random() - 0.5)
        
        // Store the mapping for later use
        rightItemsMapping.value = shuffled
        console.log('🔧 Right items mapping:', shuffled.map(item => ({
          displayText: item.text,
          originalIndex: item.originalIndex
        })))
        
        // Return just the text for display
        const displayItems = shuffled.map(item => item.text)
        console.log('✅ Final right items (shuffled for display):', displayItems)
        return displayItems
      } catch (error) {
        console.error('❌ Error computing right items:', error)
        return []
      }
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
    // 🔥 FIXED: MATCHING METHODS
    // ========================
    const handleMatchingClick = (side, index) => {
      console.log('🔗 Matching click:', { side, index, current: props.selectedMatchingItem })
      
      if (props.showCorrectAnswer) {
        console.log('❌ Cannot interact - correct answer is shown')
        return
      }
      
      const currentSelection = props.selectedMatchingItem
      
      // If nothing is selected, select this item
      if (!currentSelection) {
        console.log('✅ Selecting first item:', { side, index })
        emit('matching-item-selected', { side, index })
        return
      }
      
      // If clicking the same item, deselect it
      if (currentSelection.side === side && currentSelection.index === index) {
        console.log('🔄 Deselecting same item')
        emit('matching-item-selected', null)
        return
      }
      
      // If clicking another item on the same side, change selection
      if (currentSelection.side === side) {
        console.log('🔄 Changing selection on same side')
        emit('matching-item-selected', { side, index })
        return
      }
      
      // If clicking an item on the opposite side, create a pair
      console.log('🎯 Creating pair between sides')
      createMatchingPair(currentSelection, { side, index })
    }

    const createMatchingPair = (firstItem, secondItem) => {
      let leftIndex, rightDisplayIndex
      
      // Determine which is left and which is right
      if (firstItem.side === 'left') {
        leftIndex = firstItem.index
        rightDisplayIndex = secondItem.index
      } else {
        leftIndex = secondItem.index
        rightDisplayIndex = firstItem.index
      }
      
      console.log('🔗 Creating pair:', { leftIndex, rightDisplayIndex })
      
      // 🔥 CRITICAL FIX: Get the original index from the mapping
      const rightMapping = rightItemsMapping.value[rightDisplayIndex]
      const originalRightIndex = rightMapping ? rightMapping.originalIndex : rightDisplayIndex
      
      console.log('🔧 DEBUG: Mapping display index to original:', {
        displayIndex: rightDisplayIndex,
        originalIndex: originalRightIndex,
        rightText: rightItems.value[rightDisplayIndex],
        mapping: rightMapping
      })
      
      const newPair = { 
        leftIndex, 
        rightIndex: originalRightIndex, // Use the original index for validation
        rightDisplayIndex // Store display index for text retrieval
      }
      
      const currentPairs = props.matchingPairs || []
      
      // Check if this exact pair already exists
      const pairExists = currentPairs.some(pair => 
        pair.leftIndex === newPair.leftIndex && pair.rightIndex === newPair.rightIndex
      )
      
      if (pairExists) {
        console.log('⚠️ Pair already exists')
        emit('matching-item-selected', null)
        return
      }
      
      // Remove any existing pairs that use these items
      const filteredPairs = currentPairs.filter(pair => 
        pair.leftIndex !== newPair.leftIndex && 
        pair.rightDisplayIndex !== newPair.rightDisplayIndex
      )
      
      // Add the new pair
      const updatedPairs = [...filteredPairs, newPair]
      
      console.log('✅ Updated pairs:', updatedPairs)
      
      // Emit the updated pairs
      emit('answer-changed', updatedPairs)
      
      // Clear selection
      emit('matching-item-selected', null)
    }

    const isItemSelected = (side, index) => {
      const selection = props.selectedMatchingItem
      return selection && selection.side === side && selection.index === index
    }

    const isItemMatched = (side, index) => {
      const currentPairs = props.matchingPairs || []
      
      if (side === 'left') {
        return currentPairs.some(pair => pair.leftIndex === index)
      } else {
        // 🔥 FIXED: For right side, check using display index
        return currentPairs.some(pair => pair.rightDisplayIndex === index)
      }
    }

    const isPairCorrect = (pair) => {
      // This is for visual feedback only - actual validation happens in useExercises
      // Check if leftIndex matches rightIndex (they should be the same for correct pairs)
      return pair.leftIndex === pair.rightIndex
    }

    const getSelectedItemText = () => {
      const selection = props.selectedMatchingItem
      if (!selection) return ''
      
      if (selection.side === 'left') {
        return leftItems.value[selection.index] || ''
      } else {
        return rightItems.value[selection.index] || ''
      }
    }

    const clearSelection = () => {
      emit('matching-item-selected', null)
    }

    const removePair = (pairIndex) => {
      console.log('🗑️ Removing pair at index:', pairIndex)
      
      if (props.showCorrectAnswer) {
        console.log('❌ Cannot remove - correct answer is shown')
        return
      }
      
      const currentPairs = props.matchingPairs || []
      
      if (pairIndex >= 0 && pairIndex < currentPairs.length) {
        const updatedPairs = currentPairs.filter((_, index) => index !== pairIndex)
        console.log('✅ Updated pairs after removal:', updatedPairs)
        emit('answer-changed', updatedPairs)
        emit('remove-matching-pair', pairIndex)
      } else {
        console.warn('⚠️ Invalid pair index for removal:', pairIndex)
      }
    }

    const getLeftItemText = (index) => {
      if (index >= 0 && index < leftItems.value.length) {
        return leftItems.value[index]
      }
      return `Left Item ${index + 1}`
    }

    const getRightItemText = (originalIndex, displayIndex) => {
      // 🔥 FIXED: Get the text from the correct source
      // If displayIndex is provided, use it for current display
      if (displayIndex !== undefined && displayIndex >= 0 && displayIndex < rightItems.value.length) {
        return rightItems.value[displayIndex]
      }
      
      // Otherwise get from original pairs using original index
      if (!props.currentExercise?.pairs || originalIndex < 0 || originalIndex >= props.currentExercise.pairs.length) {
        return `Right Item ${originalIndex + 1}`
      }
      
      const pair = props.currentExercise.pairs[originalIndex]
      
      if (Array.isArray(pair)) {
        return String(pair[1] || '')
      } else if (pair && typeof pair === 'object') {
        return String(pair.right || pair[1] || pair.answer || pair.definition || '')
      }
      
      return `Right Item ${originalIndex + 1}`
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
          // Reset matching state when exercise changes
          emit('matching-item-selected', null)
          // Clear the mapping when exercise changes
          rightItemsMapping.value = []
          console.log('🔄 Reset matching exercise state')
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
      rightItemsMapping, // 🔥 NEW: Export the mapping
      
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
      
      // 🔥 FIXED: Matching methods
      handleMatchingClick,
      createMatchingPair,
      isItemSelected,
      isItemMatched,
      isPairCorrect,
      getSelectedItemText,
      clearSelection,
      removePair,
      getLeftItemText,
      getRightItemText,
      
      // Ordering methods
      initializeOrderingItems,
      getOrderingItemText,
      moveOrderingItem,
      startOrderingDrag,
      endOrderingDrag,
      handleOrderingDragOver,
      handleOrderingDragEnter,
      handleOrderingDragLeave,
      handleOrderingDrop,
      
      // Drag and drop methods
      startDragItem,
      endDragItem,
      dragOverZone,
      dragLeaveZone,
      dropInZone,
      getDragItemText,
      getZoneId,
      getDropZoneItems,
      removeDroppedItem,
      
      // Touch support methods
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
  height: calc(100vh - 300px) !important;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
  min-height: 200px !important;
  max-height: calc(100vh - 300px) !important;
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: auto !important;
  flex: 1;
  padding: 16px 20px 20px 20px;
}

.scroll-content-wrapper {
  min-height: 400px;
  padding-bottom: 40px;
}

.spacer {
  height: 100px;
  background: transparent;
}

/* CRITICAL: Match Content Panel Navigation Exactly */
.interactive-actions {
  display: flex !important;
  gap: 12px;
  padding: 16px 28px;
  border-top: 1px solid #e2e8f0;
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
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 100px;
  min-height: 40px;
  font-size: 0.95rem !important;
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

/* ================================
   ENHANCED MATCHING EXERCISE STYLES
   ================================ */

.matching-container {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  min-height: 200px;
}

@media (max-width: 768px) {
  .matching-container {
    flex-direction: column;
    gap: 15px;
  }
}

.matching-side {
  flex: 1;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  min-height: 180px;
}

.left-side {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%);
}

.right-side {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #f8fafc 100%);
}

.matching-side h4 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.matching-item {
  padding: 12px 16px;
  margin: 8px 0;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  font-weight: 500;
  line-height: 1.4;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  word-wrap: break-word;
}

.matching-item:hover:not(.disabled) {
  border-color: #3b82f6;
  background: #f0f9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.matching-item:active:not(.disabled) {
  transform: translateY(0);
}

.matching-item.selected {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #ede9fe 0%, #f3f4f6 100%);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { 
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); 
  }
  50% { 
    box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.2); 
  }
}

.matching-item.matched {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #f0fdf4 100%);
  opacity: 0.8;
}

.matching-item.matched:hover {
  border-color: #059669;
  background: linear-gradient(135deg, #a7f3d0 0%, #d1fae5 100%);
}

.matching-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f3f4f6;
}

.matching-item.disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: #e2e8f0;
  background: #f3f4f6;
}

.selection-indicator {
  font-size: 1.2rem;
  animation: bounce 1s infinite;
  margin-left: 8px;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { 
    transform: translateY(0); 
  }
  40% { 
    transform: translateY(-3px); 
  }
  60% { 
    transform: translateY(-2px); 
  }
}

.match-indicator {
  color: #10b981;
  font-weight: bold;
  font-size: 1.1rem;
  margin-left: 8px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

/* ================================
   MATCHING PAIRS DISPLAY
   ================================ */

.matching-pairs {
  margin: 20px 0;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.matching-pairs h4 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pairs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pair-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  transition: all 0.2s ease;
  min-height: 44px;
}

.pair-item:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.pair-item.pair-correct {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%);
}

.pair-text {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  line-height: 1.3;
  word-wrap: break-word;
}

.pair-arrow {
  color: #6b7280;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.remove-pair {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 4px 8px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  line-height: 1;
}

.remove-pair:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
  transform: scale(1.1);
}

.remove-pair:active {
  transform: scale(0.95);
}

/* ================================
   INSTRUCTIONS AND FEEDBACK
   ================================ */

.matching-instructions {
  margin: 16px 0;
  padding: 16px;
  border-radius: 8px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
}

.instruction-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.instruction-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.current-selection {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ede9fe 0%, #f3f4f6 100%);
  border: 1px solid #c4b5fd;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.selection-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.selected-text {
  font-style: italic;
  color: #6b7280;
  font-weight: 500;
}

.clear-selection {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  padding: 2px 6px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: auto;
}

.clear-selection:hover {
  background: rgba(139, 92, 246, 0.2);
  transform: scale(1.1);
}

.no-pairs-message,
.progress-message,
.complete-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.85rem;
  font-weight: 500;
}

.no-pairs-message {
  color: #dc2626;
}

.progress-message {
  color: #f59e0b;
}

.complete-message {
  color: #10b981;
}

.warning-icon,
.progress-icon,
.complete-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* ================================
   DEBUG INFO (DEVELOPMENT ONLY)
   ================================ */

.debug-info {
  padding: 8px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  margin: 8px 0;
  font-family: monospace;
  font-size: 0.8rem;
  color: #92400e;
}

/* ================================
   RESPONSIVE FIXES
   ================================ */

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

@media (max-width: 768px) {
  .matching-side {
    padding: 12px;
    min-height: 150px;
  }
  
  .matching-item {
    padding: 10px 12px;
    min-height: 44px;
    font-size: 0.9rem;
  }
  
  .pair-text {
    font-size: 0.9rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .pair-arrow {
    font-size: 1rem;
  }
  
  .current-selection {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .clear-selection {
    align-self: flex-end;
    margin-top: -24px;
  }
}

@media (max-width: 480px) {
  .matching-container {
    gap: 12px;
  }
  
  .matching-side {
    padding: 10px;
  }
  
  .matching-item {
    padding: 8px 10px;
    margin: 6px 0;
    font-size: 0.85rem;
  }
  
  .matching-pairs {
    padding: 12px;
  }
  
  .instruction-main {
    font-size: 0.85rem;
  }
}

/* ================================
   ACCESSIBILITY IMPROVEMENTS
   ================================ */

.matching-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.matching-item[aria-selected="true"] {
  background: linear-gradient(135deg, #ede9fe 0%, #f3f4f6 100%);
  border-color: #8b5cf6;
}

@media (prefers-reduced-motion: reduce) {
  .matching-item,
  .pair-item,
  .remove-pair,
  .clear-selection {
    transition: none;
  }
  
  .selection-indicator,
  .match-indicator {
    animation: none;
  }
  
  .matching-item.selected {
    animation: none;
  }
}

/* ================================
   HIGH CONTRAST MODE
   ================================ */

@media (prefers-contrast: high) {
  .matching-item {
    border-width: 3px;
  }
  
  .matching-item.selected {
    border-color: #000;
    background: #ffff00;
    color: #000;
  }
  
  .matching-item.matched {
    border-color: #008000;
    background: #90EE90;
    color: #000;
  }
}
</style>