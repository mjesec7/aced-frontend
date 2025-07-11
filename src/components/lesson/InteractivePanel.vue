<template>
    <div class="interactive-panel">
      <!-- Exercise Container -->
      <div v-if="isExerciseStep" class="exercise-container">
        <div class="exercise-header">
          <h3 class="exercise-title">
            {{ currentStep?.type === 'practice' ? '🧪 Практическое задание' : '✏️ Упражнение' }}
          </h3>
          <div class="exercise-progress" v-if="currentExercise">
            <span class="exercise-counter">{{ exerciseIndex + 1 }} / {{ totalExercises || 1 }}</span>
          </div>
        </div>
        
        <!-- Exercise Content -->
        <div class="exercise-content" v-if="currentExercise">
          <div class="exercise-question">
            {{ currentExercise?.question || 'Question not available' }}
          </div>
          
          <div class="exercise-instruction" v-if="currentExercise?.instruction">
            <div class="instruction-badge">💡 Инструкция</div>
            <div class="instruction-text">{{ currentExercise.instruction }}</div>
          </div>
          
          <!-- Short Answer / Text Input -->
          <div v-if="exerciseType === 'short-answer'" class="short-answer-container">
            <textarea 
              :value="userAnswer" 
              @input="$emit('answer-changed', $event.target.value)"
              placeholder="Введите ваш ответ..."
              class="answer-textarea"
              :disabled="answerWasCorrect"
              @keyup.enter="handleSubmitOrNext"
            ></textarea>
          </div>
          
          <!-- Multiple Choice / ABC -->
          <div v-else-if="['multiple-choice', 'abc'].includes(exerciseType)" class="options-grid">
            <label 
              v-for="(option, optionIndex) in exerciseOptions" 
              :key="`option-${exerciseIndex}-${optionIndex}`" 
              class="option-card"
              :class="{ 
                selected: userAnswer === getOptionText(option),
                correct: answerWasCorrect && userAnswer === getOptionText(option),
                incorrect: !answerWasCorrect && userAnswer === getOptionText(option) && confirmation
              }"
            >
              <input 
                type="radio" 
                :value="getOptionText(option)" 
                :checked="userAnswer === getOptionText(option)"
                @change="$emit('answer-changed', $event.target.value)"
                class="option-radio"
                :disabled="answerWasCorrect"
              />
              <div class="option-content">
                <span class="option-letter">{{ String.fromCharCode(65 + optionIndex) }}</span>
                <span class="option-text">{{ getOptionText(option) }}</span>
              </div>
            </label>
          </div>
          
          <!-- True/False -->
          <div v-else-if="exerciseType === 'true-false'" class="true-false-container">
            <div class="true-false-statement">
              {{ currentExercise?.statement || currentExercise?.question }}
            </div>
            <div class="true-false-options">
              <label 
                class="true-false-option"
                :class="{ 
                  selected: userAnswer === 'true',
                  correct: answerWasCorrect && userAnswer === 'true',
                  incorrect: !answerWasCorrect && userAnswer === 'true' && confirmation
                }"
              >
                <input 
                  type="radio" 
                  value="true" 
                  :checked="userAnswer === 'true'"
                  @change="$emit('answer-changed', $event.target.value)"
                  :disabled="answerWasCorrect"
                />
                <div class="option-content">
                  <span class="option-icon">✅</span>
                  <span class="option-text">Правда</span>
                </div>
              </label>
              <label 
                class="true-false-option"
                :class="{ 
                  selected: userAnswer === 'false',
                  correct: answerWasCorrect && userAnswer === 'false',
                  incorrect: !answerWasCorrect && userAnswer === 'false' && confirmation
                }"
              >
                <input 
                  type="radio" 
                  value="false" 
                  :checked="userAnswer === 'false'"
                  @change="$emit('answer-changed', $event.target.value)"
                  :disabled="answerWasCorrect"
                />
                <div class="option-content">
                  <span class="option-icon">❌</span>
                  <span class="option-text">Ложь</span>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Fill in the Blanks -->
          <div v-else-if="exerciseType === 'fill-blank'" class="fill-blank-container">
            <div class="fill-blank-template" v-html="getFillBlankTemplate()"></div>
            <div class="blank-inputs">
              <div 
                v-for="(blank, blankIndex) in (currentExercise?.blanks || [])" 
                :key="`blank-${exerciseIndex}-${blankIndex}`" 
                class="blank-input-group"
              >
                <label class="blank-label">Пропуск {{ blankIndex + 1 }}:</label>
                <input 
                  :value="fillBlankAnswers[blankIndex] || ''"
                  @input="$emit('fill-blank-updated', blankIndex, $event)"
                  type="text" 
                  class="blank-input"
                  :disabled="answerWasCorrect"
                  :placeholder="`Введите слово для пропуска ${blankIndex + 1}`"
                />
              </div>
            </div>
          </div>
          
          <!-- Matching Pairs -->
          <div v-else-if="exerciseType === 'matching'" class="matching-container">
            <div class="matching-grid">
              <div class="matching-column">
                <h4>Колонка A</h4>
                <div 
                  v-for="(item, leftIndex) in leftItems" 
                  :key="`left-${leftIndex}`" 
                  class="matching-item left-item"
                  :class="{ 
                    selected: selectedMatchingItem?.side === 'left' && selectedMatchingItem?.index === leftIndex,
                    matched: isItemMatched('left', leftIndex)
                  }"
                  @click="selectMatchingItem('left', leftIndex)"
                >
                  <span class="matching-item-letter">{{ String.fromCharCode(65 + leftIndex) }}</span>
                  <span class="matching-item-text">{{ item }}</span>
                </div>
              </div>
              
              <div class="matching-column">
                <h4>Колонка B</h4>
                <div 
                  v-for="(item, rightIndex) in rightItems" 
                  :key="`right-${rightIndex}`" 
                  class="matching-item right-item"
                  :class="{ 
                    selected: selectedMatchingItem?.side === 'right' && selectedMatchingItem?.index === rightIndex,
                    matched: isItemMatched('right', rightIndex)
                  }"
                  @click="selectMatchingItem('right', rightIndex)"
                >
                  <span class="matching-item-number">{{ rightIndex + 1 }}</span>
                  <span class="matching-item-text">{{ item }}</span>
                </div>
              </div>
            </div>
            
            <div class="matching-pairs-display" v-if="matchingPairs.length > 0">
              <h4>Ваши пары:</h4>
              <div class="created-pairs">
                <div 
                  v-for="(pair, pairIndex) in matchingPairs" 
                  :key="`pair-${pairIndex}`" 
                  class="created-pair"
                >
                  <span class="pair-left">{{ String.fromCharCode(65 + (pair?.leftIndex || 0)) }}: {{ pair?.leftText || '' }}</span>
                  <span class="pair-connector">↔</span>
                  <span class="pair-right">{{ (pair?.rightIndex || 0) + 1 }}: {{ pair?.rightText || '' }}</span>
                  <button @click="removeMatchingPair(pairIndex)" class="remove-pair-btn" title="Удалить пару">✕</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Ordering/Sequencing -->
          <div v-else-if="exerciseType === 'ordering'" class="ordering-container">
            <div class="ordering-instructions">
              <p>Расположите элементы в правильном порядке (перетащите или используйте кнопки):</p>
            </div>
            <div class="ordering-items">
              <div 
                v-for="(item, itemIndex) in orderingItems" 
                :key="item?.id || `order-${itemIndex}`" 
                class="ordering-item"
                :class="{ 
                  dragging: draggedItem === itemIndex,
                  'drop-target': dropTarget === itemIndex 
                }"
                draggable="true"
                @dragstart="startDrag($event, itemIndex)"
                @dragover.prevent="onDragOver($event, itemIndex)"
                @dragenter.prevent="onDragEnter(itemIndex)"
                @dragleave.prevent="onDragLeave"
                @drop.prevent="onDrop($event, itemIndex)"
              >
                <div class="ordering-item-content">
                  <div class="ordering-item-handle">⋮⋮</div>
                  <div class="ordering-item-text">{{ item?.text || item || 'Item' }}</div>
                  <div class="ordering-item-controls">
                    <button 
                      @click="moveOrderingItem(itemIndex, -1)" 
                      :disabled="itemIndex === 0"
                      class="ordering-move-btn"
                      title="Переместить вверх"
                    >
                      ↑
                    </button>
                    <button 
                      @click="moveOrderingItem(itemIndex, 1)" 
                      :disabled="itemIndex === (orderingItems || []).length - 1"
                      class="ordering-move-btn"
                      title="Переместить вниз"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="ordering-reset">
              <button @click="resetOrdering" class="reset-ordering-btn">🔄 Сбросить порядок</button>
            </div>
          </div>
          
          <!-- Drag and Drop -->
          <div v-else-if="exerciseType === 'drag-drop'" class="drag-drop-container">
            <div class="drag-drop-instructions">
              <p>Перетащите элементы в правильные зоны:</p>
            </div>
            
            <div class="drag-drop-layout">
              <!-- Draggable Items -->
              <div class="draggable-items-area">
                <h4>Элементы для перетаскивания:</h4>
                <div class="draggable-items">
                  <div 
                    v-for="item in availableDragItems" 
                    :key="item?.id || item" 
                    class="draggable-item"
                    :class="{ dragging: draggedDragItem === (item?.id || item) }"
                    draggable="true"
                    @dragstart="startDragDrop($event, item)"
                  >
                    {{ item?.text || item }}
                  </div>
                </div>
              </div>
              
              <!-- Drop Zones -->
              <div class="drop-zones-area">
                <h4>Зоны для размещения:</h4>
                <div class="drop-zones">
                  <div 
                    v-for="zone in dropZones" 
                    :key="zone?.id || zone" 
                    class="drop-zone"
                    :class="{ 
                      'drop-over': dropOverZone === (zone?.id || zone),
                      'has-items': getDropZoneItems(zone?.id || zone).length > 0 
                    }"
                    @dragover.prevent="onDropZoneOver(zone?.id || zone)"
                    @dragenter.prevent="onDropZoneEnter(zone?.id || zone)"
                    @dragleave.prevent="onDropZoneLeave"
                    @drop.prevent="onDropZoneDrop($event, zone?.id || zone)"
                  >
                    <div class="drop-zone-label">{{ zone?.label || 'Zone' }}</div>
                    <div class="dropped-items">
                      <div 
                        v-for="droppedItem in getDropZoneItems(zone?.id || zone)" 
                        :key="droppedItem?.id || droppedItem" 
                        class="dropped-item"
                        @dblclick="returnDragItem(droppedItem)"
                        title="Двойной клик для возврата"
                      >
                        {{ droppedItem?.text || droppedItem }}
                        <button @click="returnDragItem(droppedItem)" class="remove-dropped-btn">✕</button>
                      </div>
                    </div>
                    <div v-if="getDropZoneItems(zone?.id || zone).length === 0" class="drop-zone-placeholder">
                      Перетащите элементы сюда
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Smart Hint Display -->
          <div v-if="smartHint" class="smart-hint">
            <div class="hint-header">💡 Подсказка от AI</div>
            <div class="hint-content">{{ smartHint }}</div>
            <button @click="$emit('clear-hint')" class="close-hint-btn">✕</button>
          </div>
  
          <!-- Answer Feedback -->
          <div v-if="confirmation" :class="['feedback', { 'correct': answerWasCorrect, 'incorrect': !answerWasCorrect }]">
            <div class="feedback-icon">{{ answerWasCorrect ? '✅' : '❌' }}</div>
            <div class="feedback-text">{{ confirmation }}</div>
          </div>
  
          <!-- Action Buttons -->
          <div class="exercise-actions">
            <button 
              v-if="!answerWasCorrect" 
              class="submit-btn" 
              @click="$emit('submit')" 
              :disabled="!canSubmitAnswer"
            >
              🔍 Проверить ответ
            </button>
            <button 
              v-else 
              class="next-btn" 
              @click="$emit('next-exercise')"
            >
              {{ isLastExercise ? '➡️ Следующий шаг' : '➡️ Следующее упражнение' }}
            </button>
            
            <button 
              v-if="!answerWasCorrect && mistakeCount >= 2" 
              class="hint-btn"
              @click="$emit('show-hint')"
            >
              💡 Подсказка
            </button>
            
            <button 
              v-if="exerciseType === 'matching'"
              @click="clearMatchingPairs"
              class="clear-btn"
              :disabled="matchingPairs.length === 0"
            >
              🗑️ Очистить пары
            </button>
          </div>
  
          <!-- Regular Hint Display -->
          <div v-if="currentHint" class="hint-display">
            <div class="hint-header">💡 Подсказка</div>
            <div class="hint-content">{{ currentHint }}</div>
          </div>
        </div>
        
        <!-- Exercise Error Fallback -->
        <div v-else class="exercise-error">
          <div class="error-message">
            <div class="error-icon">⚠️</div>
            <h4>Упражнение недоступно</h4>
            <p>Данные упражнения не загружены. Попробуйте перезагрузить страницу.</p>
            <button @click="$emit('next-exercise')" class="skip-btn">Пропустить ➡️</button>
          </div>
        </div>
      </div>
  
      <!-- Quiz Container -->
      <div v-else-if="isQuizStep" class="quiz-container">
        <div class="quiz-header">
          <h3 class="quiz-title">🧩 Викторина</h3>
          <div class="quiz-progress" v-if="currentQuiz">
            <span class="quiz-counter">{{ quizIndex + 1 }} / {{ totalQuizzes || 1 }}</span>
          </div>
        </div>
        
        <div class="quiz-content" v-if="currentQuiz">
          <div class="quiz-question">{{ currentQuiz?.question || 'Question not available' }}</div>
          
          <div class="quiz-options">
            <label 
              v-for="(option, quizOptionIndex) in quizOptions" 
              :key="`quiz-option-${quizOptionIndex}`" 
              class="quiz-option-card"
              :class="{ 
                selected: userAnswer === option,
                correct: answerWasCorrect && userAnswer === option,
                incorrect: !answerWasCorrect && userAnswer === option && confirmation
              }"
            >
              <input 
                type="radio" 
                :value="option" 
                :checked="userAnswer === option"
                @change="$emit('answer-changed', $event.target.value)"
                class="quiz-radio"
                :disabled="answerWasCorrect"
              />
              <div class="quiz-option-content">
                <span class="quiz-option-letter">{{ String.fromCharCode(65 + quizOptionIndex) }}</span>
                <span class="quiz-option-text">{{ option }}</span>
              </div>
            </label>
          </div>
  
          <div v-if="confirmation" :class="['feedback', { 'correct': answerWasCorrect, 'incorrect': !answerWasCorrect }]">
            <div class="feedback-icon">{{ answerWasCorrect ? '✅' : '❌' }}</div>
            <div class="feedback-text">{{ confirmation }}</div>
          </div>
  
          <div class="quiz-actions">
            <button 
              v-if="!answerWasCorrect" 
              class="submit-btn" 
              @click="$emit('submit')" 
              :disabled="!userAnswer"
            >
              🔍 Ответить
            </button>
            <button 
              v-else 
              class="next-btn" 
              @click="$emit('next-quiz')"
            >
              {{ isLastQuiz ? '➡️ Следующий шаг' : '➡️ Следующий вопрос' }}
            </button>
          </div>
        </div>
        
        <!-- Quiz Error Fallback -->
        <div v-else class="quiz-error">
          <div class="error-message">
            <div class="error-icon">⚠️</div>
            <h4>Вопрос недоступен</h4>
            <p>Данные викторины не загружены. Попробуйте перезагрузить страницу.</p>
            <button @click="$emit('next-quiz')" class="skip-btn">Пропустить ➡️</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { computed } from 'vue'
  
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
    setup(props) {
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
        if (!props.userAnswer) return false
        
        switch (exerciseType.value) {
          case 'fill-blank':
            return props.fillBlankAnswers.some(answer => answer && answer.trim())
          case 'matching':
            return props.matchingPairs.length > 0
          case 'ordering':
            return props.orderingItems.length > 0
          case 'drag-drop':
            return Object.keys(props.dragDropPlacements).length > 0
          default:
            return props.userAnswer && String(props.userAnswer).trim()
        }
      })
      
      // Helper methods
      const getOptionText = (option) => {
        if (typeof option === 'string') return option
        return option?.text || option?.label || String(option)
      }
      
      const getFillBlankTemplate = () => {
        if (!props.currentExercise?.template) return ''
        
        let template = props.currentExercise.template
        let blankIndex = 0
        
        template = template.replace(/_+/g, () => {
          return `<span class="fill-blank-placeholder">[Пропуск ${++blankIndex}]</span>`
        })
        
        return template
      }
      
      const selectMatchingItem = (side, index) => {
        // Emit event to parent to handle matching logic
        // This would be handled in the parent component
      }
      
      const isItemMatched = (side, index) => {
        if (side === 'left') {
          return props.matchingPairs.some(pair => pair.leftIndex === index)
        }
        return props.matchingPairs.some(pair => pair.rightIndex === index)
      }
      
      const removeMatchingPair = (pairIndex) => {
        // Emit to parent
      }
      
      const clearMatchingPairs = () => {
        // Emit to parent
      }
      
      const getDropZoneItems = (zoneId) => {
        return props.dragDropPlacements[zoneId] || []
      }
      
      return {
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
        getOptionText,
        getFillBlankTemplate,
        selectMatchingItem,
        isItemMatched,
        removeMatchingPair,
        clearMatchingPairs,
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