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
              :class="{ selected: localUserAnswer === option }"
              @click="selectOption(option)"
            >
              <div class="option-radio">
                <input 
                  type="radio" 
                  :name="'exercise-' + exerciseIndex"
                  :value="option"
                  v-model="localUserAnswer"
                  @change="$emit('answer-changed', option)"
                />
              </div>
              <div class="option-text">{{ option }}</div>
            </div>
          </div>
        </div>
  
        <!-- Fill in the Blanks Exercise -->
        <div v-else-if="exerciseType === 'fill-blank'" class="exercise-type fill-blank">
          <div class="question-text">
            {{ currentExercise?.question }}
          </div>
          <div class="fill-blank-template">
            <div v-html="renderFillBlankTemplate()"></div>
          </div>
          <div class="fill-blank-inputs">
            <div 
              v-for="(blank, index) in getBlankCount()" 
              :key="index"
              class="blank-input-group"
            >
              <label class="blank-label">Пропуск {{ index + 1 }}:</label>
              <input
                type="text"
                v-model="localFillBlankAnswers[index]"
                @input="updateFillBlank(index, $event)"
                class="blank-input"
                :placeholder="`Ответ ${index + 1}`"
              />
            </div>
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
                  matched: isItemMatched('left', index)
                }"
                @click="selectMatchingItem('left', index)"
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
                  matched: isItemMatched('right', index)
                }"
                @click="selectMatchingItem('right', index)"
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
              <button @click="removeMatchingPair(index)" class="remove-pair">×</button>
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
              :class="{ selected: localUserAnswer === 'true' }"
              @click="selectTrueFalse('true')"
            >
              <input 
                type="radio" 
                name="true-false"
                value="true"
                v-model="localUserAnswer"
                @change="$emit('answer-changed', 'true')"
              />
              <span>Правда</span>
            </div>
            <div 
              class="tf-option"
              :class="{ selected: localUserAnswer === 'false' }"
              @click="selectTrueFalse('false')"
            >
              <input 
                type="radio" 
                name="true-false"
                value="false"
                v-model="localUserAnswer"
                @change="$emit('answer-changed', 'false')"
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
              :class="{ dragging: draggedItem === index }"
              draggable="true"
              @dragstart="startDrag(index)"
              @dragover.prevent
              @drop="handleDrop(index)"
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
                :key="index"
                class="drag-item"
                :class="{ dragging: draggedDragItem === item }"
                draggable="true"
                @dragstart="startDragItem(item)"
              >
                {{ item.text || item }}
              </div>
            </div>
            <div class="drop-zones">
              <div 
                v-for="(zone, index) in dropZones" 
                :key="index"
                class="drop-zone"
                :class="{ 'drag-over': dropOverZone === zone.id }"
                @dragover.prevent="dragOverZone(zone.id)"
                @dragleave="dragLeaveZone"
                @drop="dropInZone(zone.id)"
              >
                <div class="zone-label">{{ zone.label }}</div>
                <div class="zone-items">
                  <div 
                    v-for="(item, itemIndex) in getDropZoneItems(zone.id)" 
                    :key="itemIndex"
                    class="dropped-item"
                  >
                    {{ item.text || item }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Hints and Feedback -->
        <div v-if="currentHint || smartHint" class="hints-section">
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
  
        <!-- Confirmation Message -->
        <div v-if="confirmation" class="confirmation-message" :class="{ correct: answerWasCorrect, incorrect: !answerWasCorrect }">
          {{ confirmation }}
        </div>
  
        <!-- Exercise Actions -->
        <div class="exercise-actions">
          <button 
            v-if="!confirmation"
            @click="$emit('show-hint')" 
            class="hint-btn"
          >
            💡 Подсказка
          </button>
          
          <button 
            v-if="!confirmation"
            @click="$emit('submit')"
            :disabled="!canSubmitAnswer"
            class="submit-btn"
            :class="{ disabled: !canSubmitAnswer }"
          >
            Проверить
          </button>
          
          <button 
            v-if="confirmation"
            @click="$emit('next-exercise')"
            class="next-btn"
          >
            {{ isLastExercise ? 'Завершить' : 'Далее' }}
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
  
        <div class="quiz-question">
          {{ currentQuiz?.question }}
        </div>
  
        <div class="quiz-options">
          <div 
            v-for="(option, index) in quizOptions" 
            :key="index"
            class="quiz-option"
            :class="{ selected: localUserAnswer === option }"
            @click="selectQuizOption(option)"
          >
            <div class="option-radio">
              <input 
                type="radio" 
                :name="'quiz-' + quizIndex"
                :value="option"
                v-model="localUserAnswer"
                @change="$emit('answer-changed', option)"
              />
            </div>
            <div class="option-text">{{ option }}</div>
          </div>
        </div>
  
        <div v-if="confirmation" class="confirmation-message" :class="{ correct: answerWasCorrect, incorrect: !answerWasCorrect }">
          {{ confirmation }}
        </div>
  
        <div class="quiz-actions">
          <button 
            v-if="!confirmation"
            @click="$emit('submit')"
            :disabled="!canSubmitAnswer"
            class="submit-btn"
            :class="{ disabled: !canSubmitAnswer }"
          >
            Ответить
          </button>
          
          <button 
            v-if="confirmation"
            @click="$emit('next-quiz')"
            class="next-btn"
          >
            {{ isLastQuiz ? 'Завершить' : 'Следующий вопрос' }}
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
  import { ref, computed, watch, onMounted } from 'vue'
  
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
      draggedDragItem: [String, Object],
      dropOverZone: String,
      availableDragItems: { type: Array, default: () => [] },
      dropZones: { type: Array, default: () => [] }
    },
    emits: [
      'answer-changed',
      'fill-blank-updated',
      'submit',
      'next-exercise',
      'next-quiz',
      'show-hint',
      'clear-hint'
    ],
    setup(props, { emit }) {
      // Local reactive state
      const localUserAnswer = ref('')
      const localFillBlankAnswers = ref([])
  
      // Computed properties
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
      
      const canSubmitAnswer = computed(() => {
        if (exerciseType.value === 'fill-blank') {
          return localFillBlankAnswers.value.some(answer => answer && answer.trim())
        }
        if (exerciseType.value === 'matching') {
          return props.matchingPairs.length > 0
        }
        if (exerciseType.value === 'ordering') {
          return props.orderingItems.length > 0
        }
        if (exerciseType.value === 'drag-drop') {
          return Object.keys(props.dragDropPlacements).length > 0
        }
        return localUserAnswer.value && String(localUserAnswer.value).trim()
      })
  
      // Methods
      const getBlankCount = () => {
        if (!props.currentExercise) return 0
        
        if (props.currentExercise.blanks && Array.isArray(props.currentExercise.blanks)) {
          return props.currentExercise.blanks.length
        }
        
        const template = props.currentExercise.template || props.currentExercise.question || ''
        const underscoreMatches = template.match(/_+/g) || []
        const blankMatches = template.match(/\[blank\]/gi) || []
        
        return Math.max(underscoreMatches.length, blankMatches.length, 1)
      }
  
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
  
      const updateFillBlank = (index, event) => {
        while (localFillBlankAnswers.value.length <= index) {
          localFillBlankAnswers.value.push('')
        }
        localFillBlankAnswers.value[index] = event.target.value
        emit('fill-blank-updated', index, event)
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
  
      const selectMatchingItem = (side, index) => {
        // This would be handled by the parent component
        // For now, just emit an event
        emit('matching-item-selected', { side, index })
      }
  
      const isItemMatched = (side, index) => {
        if (side === 'left') {
          return props.matchingPairs.some(pair => pair.leftIndex === index)
        }
        return props.matchingPairs.some(pair => pair.rightIndex === index)
      }
  
      const removeMatchingPair = (pairIndex) => {
        emit('remove-matching-pair', pairIndex)
      }
  
      const startDrag = (index) => {
        emit('drag-start', index)
      }
  
      const handleDrop = (index) => {
        emit('drag-drop', index)
      }
  
      const startDragItem = (item) => {
        emit('drag-item-start', item)
      }
  
      const dragOverZone = (zoneId) => {
        emit('drag-over-zone', zoneId)
      }
  
      const dragLeaveZone = () => {
        emit('drag-leave-zone')
      }
  
      const dropInZone = (zoneId) => {
        emit('drop-in-zone', zoneId)
      }
  
      const getDropZoneItems = (zoneId) => {
        return props.dragDropPlacements[zoneId] || []
      }
  
      // Watch for prop changes to sync local state
      watch(() => props.userAnswer, (newValue) => {
        localUserAnswer.value = newValue || ''
      }, { immediate: true })
  
      watch(() => props.fillBlankAnswers, (newValue) => {
        localFillBlankAnswers.value = Array.isArray(newValue) ? [...newValue] : []
      }, { immediate: true })
  
      // Initialize local state
      onMounted(() => {
        localUserAnswer.value = props.userAnswer || ''
        localFillBlankAnswers.value = Array.isArray(props.fillBlankAnswers) ? [...props.fillBlankAnswers] : []
        
        // Initialize fill blank answers if needed
        if (exerciseType.value === 'fill-blank') {
          const blankCount = getBlankCount()
          while (localFillBlankAnswers.value.length < blankCount) {
            localFillBlankAnswers.value.push('')
          }
        }
      })
  
      return {
        localUserAnswer,
        localFillBlankAnswers,
        isExerciseStep,
        isQuizStep,
        exerciseType,
        exerciseOptions,
        quizOptions,
        leftItems,
        rightItems,
        isLastExercise,
        isLastQuiz,
        canSubmitAnswer,
        getBlankCount,
        renderFillBlankTemplate,
        updateFillBlank,
        selectOption,
        selectQuizOption,
        selectTrueFalse,
        selectMatchingItem,
        isItemMatched,
        removeMatchingPair,
        startDrag,
        handleDrop,
        startDragItem,
        dragOverZone,
        dragLeaveZone,
        dropInZone,
        getDropZoneItems
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
    overflow-y: auto;
    min-height: 100%;
  }
  
  .exercise-container,
  .quiz-container {
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
  }
  
  .exercise-title,
  .quiz-title {
    font-size: 1.2rem;
    color: #4c1d95;
    margin: 0;
    font-weight: 700;
  }
  
  .exercise-progress,
  .quiz-progress {
    font-size: 0.9rem;
    color: #6b46c1;
    font-weight: 600;
    background: rgba(107, 70, 193, 0.1);
    padding: 6px 12px;
    border-radius: 12px;
  }
  
  .exercise-content,
  .quiz-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .exercise-question,
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
  
  .exercise-instruction {
    margin-bottom: 20px;
  }
  
  .instruction-badge {
    display: inline-block;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .instruction-text {
    font-size: 0.95rem;
    color: #64748b;
    line-height: 1.5;
  }
  
  /* Form Controls with Purple Theme */
  .short-answer-container {
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
  .options-grid,
  .quiz-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .option-card,
  .quiz-option-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
    min-height: 50px;
  }
  
  .option-card:hover,
  .quiz-option-card:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  }
  
  .option-card.selected,
  .quiz-option-card.selected {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.05);
  }
  
  .option-card.correct,
  .quiz-option-card.correct {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
  }
  
  .option-card.incorrect,
  .quiz-option-card.incorrect {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
  
  .option-radio,
  .quiz-radio {
    display: none;
  }
  
  .option-content,
  .quiz-option-content {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .option-letter,
  .quiz-option-letter {
    background: #f1f5f9;
    color: #64748b;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.9rem;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }
  
  .option-card.selected .option-letter,
  .quiz-option-card.selected .quiz-option-letter {
    background: #8b5cf6;
    color: white;
  }
  
  .option-text,
  .quiz-option-text {
    font-size: 0.95rem;
    line-height: 1.4;
    flex: 1;
    color: #374151;
  }
  
  /* True/False Styling */
  .true-false-container {
    margin-bottom: 24px;
  }
  
  .true-false-statement {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    border: 2px solid #ddd6fe;
  }
  
  .true-false-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .true-false-option {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 20px;
    text-align: center;
  }
  
  .true-false-option:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
  }
  
  .true-false-option.selected {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.05);
  }
  
  .true-false-option .option-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .true-false-option .option-icon {
    font-size: 2rem;
  }
  
  .true-false-option .option-text {
    font-weight: 600;
    color: #374151;
  }
  
  /* Fill Blank Styling */
  .fill-blank-container {
    margin-bottom: 24px;
  }
  
  .fill-blank-template {
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid #ddd6fe;
    margin-bottom: 20px;
    line-height: 1.6;
    font-size: 1rem;
  }
  
  .fill-blank-placeholder {
    background: #8b5cf6;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.85rem;
  }
  
  .blank-inputs {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .blank-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .blank-label {
    font-weight: 600;
    color: #4c1d95;
    font-size: 0.9rem;
  }
  
  .blank-input {
    padding: 12px;
    border: 2px solid #ddd6fe;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }
  
  .blank-input:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  
  /* Feedback Styling */
  .feedback {
    margin: 16px 0;
    padding: 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: fadeIn 0.3s ease;
  }
  
  .feedback.correct {
    background: rgba(124, 58, 237, 0.1);
    border: 2px solid rgba(124, 58, 237, 0.3);
  }
  
  .feedback.incorrect {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid rgba(239, 68, 68, 0.3);
  }
  
  .feedback-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .feedback-text {
    font-weight: 600;
    color: #1e293b;
    flex: 1;
  }
  
  /* Action Buttons with Purple Theme */
  .exercise-actions,
  .quiz-actions {
    display: flex;
    gap: 12px;
    margin-top: auto;
    flex-wrap: wrap;
  }
  
  .submit-btn,
  .next-btn,
  .hint-btn,
  .clear-btn,
  .skip-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 120px;
    min-height: 44px;
    font-size: 0.95rem;
  }
  
  .submit-btn {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
  }
  
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
  }
  
  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  .next-btn {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: white;
  }
  
  .next-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(124, 58, 237, 0.3);
  }
  
  .hint-btn {
    background: #f59e0b;
    color: white;
    flex: 0 0 auto;
  }
  
  .hint-btn:hover {
    background: #d97706;
    transform: translateY(-2px);
  }
  
  .clear-btn,
  .skip-btn {
    background: #64748b;
    color: white;
    flex: 0 0 auto;
  }
  
  .clear-btn:hover,
  .skip-btn:hover {
    background: #475569;
    transform: translateY(-2px);
  }
  
  /* Smart Hint */
  .smart-hint {
    background: rgba(245, 158, 11, 0.1);
    padding: 16px;
    border-radius: 12px;
    margin: 16px 0;
    border: 2px solid rgba(245, 158, 11, 0.3);
    position: relative;
  }
  
  .hint-header {
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
  }
  
  .hint-content {
    color: #78350f;
    line-height: 1.5;
  }
  
  .close-hint-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #92400e;
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  
  .close-hint-btn:hover {
    background: rgba(245, 158, 11, 0.2);
  }
  
  /* Error States */
  .exercise-error,
  .quiz-error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
  }
  
  .error-message {
    background: white;
    padding: 40px;
    border-radius: 16px;
    border: 2px solid #f3f4f6;
    max-width: 400px;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }
  
  .error-message h4 {
    color: #1e293b;
    margin: 0 0 12px 0;
    font-size: 1.1rem;
  }
  
  .error-message p {
    color: #64748b;
    margin: 0 0 20px 0;
    line-height: 1.5;
  }
  
  /* Matching Exercises */
  .matching-container {
    margin-bottom: 24px;
  }
  
  .matching-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 20px;
  }
  
  .matching-column h4 {
    color: #4c1d95;
    margin-bottom: 12px;
    font-size: 1rem;
    text-align: center;
  }
  
  .matching-item {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .matching-item:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
  }
  
  .matching-item.selected {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
  }
  
  .matching-item.matched {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .matching-item-letter,
  .matching-item-number {
    background: #f1f5f9;
    color: #64748b;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.8rem;
    flex-shrink: 0;
  }
  
  .matching-item.selected .matching-item-letter,
  .matching-item.selected .matching-item-number {
    background: #8b5cf6;
    color: white;
  }
  
  .matching-item-text {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .matching-pairs-display {
    margin-top: 20px;
    background: white;
    padding: 16px;
    border-radius: 12px;
    border: 2px solid #ddd6fe;
  }
  
  .matching-pairs-display h4 {
    color: #4c1d95;
    margin: 0 0 12px 0;
    font-size: 1rem;
  }
  
  .created-pairs {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .created-pair {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 8px;
    font-size: 0.85rem;
  }
  
  .pair-left,
  .pair-right {
    flex: 1;
  }
  
  .pair-connector {
    color: #8b5cf6;
    font-weight: bold;
  }
  
  .remove-pair-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-size: 0.7rem;
    transition: all 0.2s ease;
  }
  
  .remove-pair-btn:hover {
    background: #dc2626;
    transform: scale(1.1);
  }
  
  /* Ordering Exercises */
  .ordering-container {
    margin-bottom: 24px;
  }
  
  .ordering-instructions {
    margin-bottom: 16px;
    color: #64748b;
    font-size: 0.95rem;
  }
  
  .ordering-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .ordering-item {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: move;
    transition: all 0.2s ease;
  }
  
  .ordering-item:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
  }
  
  .ordering-item.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
  
  .ordering-item.drop-target {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
  }
  
  .ordering-item-content {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .ordering-item-handle {
    color: #94a3b8;
    cursor: grab;
    font-weight: bold;
  }
  
  .ordering-item-handle:active {
    cursor: grabbing;
  }
  
  .ordering-item-text {
    flex: 1;
    font-size: 0.95rem;
  }
  
  .ordering-item-controls {
    display: flex;
    gap: 4px;
  }
  
  .ordering-move-btn {
    background: #f1f5f9;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s ease;
  }
  
  .ordering-move-btn:hover:not(:disabled) {
    background: #8b5cf6;
    color: white;
    border-color: #8b5cf6;
  }
  
  .ordering-move-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .ordering-reset {
    text-align: center;
  }
  
  .reset-ordering-btn {
    background: #64748b;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }
  
  .reset-ordering-btn:hover {
    background: #475569;
    transform: translateY(-1px);
  }
  
  /* Drag and Drop */
  .drag-drop-container {
    margin-bottom: 24px;
  }
  
  .drag-drop-instructions {
    margin-bottom: 16px;
    color: #64748b;
    font-size: 0.95rem;
  }
  
  .drag-drop-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  
  .draggable-items-area h4,
  .drop-zones-area h4 {
    color: #4c1d95;
    margin-bottom: 12px;
    font-size: 1rem;
  }
  
  .draggable-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .draggable-item {
    background: white;
    border: 2px solid #ddd6fe;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: grab;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  
  .draggable-item:hover {
    border-color: #8b5cf6;
    transform: translateY(-1px);
  }
  
  .draggable-item.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }
  
  .drop-zones {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .drop-zone {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    padding: 16px;
    min-height: 80px;
    transition: all 0.2s ease;
  }
  
  .drop-zone.drop-over {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
  }
  
  .drop-zone.has-items {
    border-style: solid;
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.05);
  }
  
  .drop-zone-label {
    font-weight: 600;
    color: #4c1d95;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  
  .dropped-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .dropped-item {
    background: #8b5cf6;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }
  
  .remove-dropped-btn {
    background: rgba(255, 255, 255, 0.3);
    border: none;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    cursor: pointer;
    font-size: 0.7rem;
    color: white;
    transition: all 0.2s ease;
  }
  
  .remove-dropped-btn:hover {
    background: rgba(255, 255, 255, 0.5);
  }
  
  .drop-zone-placeholder {
    color: #94a3b8;
    font-style: italic;
    text-align: center;
    font-size: 0.9rem;
  }
  
  /* Hint Display */
  .hint-display {
    margin-top: 16px;
    padding: 16px;
    background: #fef3c7;
    border: 2px solid #f59e0b;
    border-radius: 8px;
    animation: fadeIn 0.3s ease;
  }
  
  .hint-display .hint-header {
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
  }
  
  .hint-display .hint-content {
    color: #78350f;
    line-height: 1.5;
  }
  
  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translateY(-10px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .interactive-panel {
      padding: 20px 16px;
    }
    
    .matching-grid,
    .drag-drop-layout {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .true-false-options {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    .exercise-actions,
    .quiz-actions {
      flex-direction: column;
      gap: 8px;
    }
    
    .submit-btn,
    .next-btn,
    .hint-btn,
    .clear-btn {
      width: 100%;
      min-width: auto;
    }
  }
  </style>