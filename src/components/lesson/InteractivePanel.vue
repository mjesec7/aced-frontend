<template>
  <div class="interactive-panel">
    <!-- Header -->
    <div class="interactive-header">
      <div class="header-content">
        <div class="header-info">
          <div class="header-icon">🎯</div>
          <div class="header-text">
            <h3 class="header-title">Интерактивная практика</h3>
            <p class="header-subtitle">Примените полученные знания</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="progress-indicator">
            <span class="progress-text">{{ getProgressText() }}</span>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          v-for="tab in availableTabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="interactive-content" ref="interactiveContent">
      <!-- Exercise Content -->
      <div v-if="activeTab === 'exercises' && isExerciseStep" class="exercise-container">
        <!-- Exercise Header -->
        <div class="exercise-header">
          <div class="exercise-meta">
            <span class="exercise-type">{{ getExerciseTypeText() }}</span>
            <span class="exercise-counter">{{ exerciseIndex + 1 }} / {{ totalExercises }}</span>
          </div>
        </div>

        <!-- Exercise Body -->
        <div class="exercise-body">
          <!-- Short Answer Exercise -->
          <div v-if="exerciseType === 'short-answer'" class="exercise-type short-answer">
            <div class="question-display">
              <h4 class="question-text">{{ currentExercise?.question }}</h4>
            </div>
            <div class="answer-section">
              <div class="input-wrapper">
                <textarea
                  v-model="localUserAnswer"
                  @input="updateAnswer"
                  placeholder="Введите ваш ответ здесь..."
                  rows="4"
                  class="answer-textarea"
                  :disabled="showCorrectAnswer"
                />
                <div class="input-footer">
                  <span class="char-counter">{{ getCharacterCount() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Multiple Choice Exercise -->
          <div v-else-if="exerciseType === 'multiple-choice' || exerciseType === 'abc'" class="exercise-type multiple-choice">
            <div class="question-display">
              <h4 class="question-text">{{ currentExercise?.question }}</h4>
            </div>
            <div class="options-container">
              <div 
                v-for="(option, index) in exerciseOptions" 
                :key="index"
                class="option-item"
                :class="{ 
                  selected: localUserAnswer === option,
                  disabled: showCorrectAnswer,
                  correct: showCorrectAnswer && isCorrectOption(option),
                  incorrect: showCorrectAnswer && localUserAnswer === option && !isCorrectOption(option)
                }"
                @click="!showCorrectAnswer && selectOption(option)"
              >
                <div class="option-radio">
                  <input 
                    type="radio" 
                    :name="'exercise-' + exerciseIndex"
                    :value="option"
                    v-model="localUserAnswer"
                    @change="updateAnswer"
                    :disabled="showCorrectAnswer"
                  />
                  <div class="radio-custom"></div>
                </div>
                <div class="option-content">
                  <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
                  <span class="option-text">{{ option }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- True/False Exercise -->
          <div v-else-if="exerciseType === 'true-false'" class="exercise-type true-false">
            <div class="question-display">
              <h4 class="question-text">{{ currentExercise?.question }}</h4>
              <div v-if="currentExercise?.statement" class="statement-text">
                {{ currentExercise.statement }}
              </div>
            </div>
            <div class="true-false-options">
              <div 
                class="tf-option true-option"
                :class="{ 
                  selected: localUserAnswer === 'true',
                  disabled: showCorrectAnswer,
                  correct: showCorrectAnswer && isCorrectTrueFalse('true'),
                  incorrect: showCorrectAnswer && localUserAnswer === 'true' && !isCorrectTrueFalse('true')
                }"
                @click="!showCorrectAnswer && selectTrueFalse('true')"
              >
                <div class="tf-icon">✅</div>
                <span class="tf-label">Правда</span>
              </div>
              <div 
                class="tf-option false-option"
                :class="{ 
                  selected: localUserAnswer === 'false',
                  disabled: showCorrectAnswer,
                  correct: showCorrectAnswer && isCorrectTrueFalse('false'),
                  incorrect: showCorrectAnswer && localUserAnswer === 'false' && !isCorrectTrueFalse('false')
                }"
                @click="!showCorrectAnswer && selectTrueFalse('false')"
              >
                <div class="tf-icon">❌</div>
                <span class="tf-label">Ложь</span>
              </div>
            </div>
          </div>

          <!-- Fill in the Blanks Exercise -->
          <div v-else-if="exerciseType === 'fill-blank'" class="exercise-type fill-blank">
            <div class="question-display">
              <h4 class="question-text">{{ currentExercise?.question }}</h4>
            </div>
            <div class="fill-blank-container">
              <div v-if="currentExercise?.template" class="template-display">
                <div v-html="renderFillBlankTemplate()" class="template-content"></div>
              </div>
              <div class="blank-inputs">
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
                    :placeholder="`Ответ ${index + 1}`"
                    :disabled="showCorrectAnswer"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Other exercise types can be added here -->
        </div>

        <!-- Exercise Feedback -->
        <div v-if="confirmation" class="exercise-feedback">
          <div v-if="isOnSecondChance && !showCorrectAnswer" class="attempt-indicator">
            <div class="attempt-info">
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
            class="feedback-message" 
            :class="{ 
              correct: answerWasCorrect, 
              incorrect: !answerWasCorrect && !showCorrectAnswer,
              'show-answer': showCorrectAnswer
            }"
          >
            <div class="feedback-icon">
              <span v-if="answerWasCorrect">✅</span>
              <span v-else-if="showCorrectAnswer">💡</span>
              <span v-else>❌</span>
            </div>
            <div class="feedback-text">{{ confirmation }}</div>
          </div>

          <div v-if="showCorrectAnswer && correctAnswerText" class="correct-answer-display">
            <div class="correct-answer-header">
              <div class="answer-icon">💡</div>
              <span class="answer-label">Правильный ответ:</span>
            </div>
            <div class="correct-answer-content">{{ correctAnswerText }}</div>
          </div>
        </div>

        <!-- Exercise Hints -->
        <div v-if="(currentHint || smartHint) && !showCorrectAnswer" class="exercise-hints">
          <div v-if="currentHint" class="hint basic-hint">
            <div class="hint-header">
              <div class="hint-icon">💡</div>
              <span class="hint-type">Подсказка</span>
            </div>
            <div class="hint-content">{{ currentHint }}</div>
          </div>
          <div v-if="smartHint" class="hint smart-hint">
            <div class="hint-header">
              <div class="hint-icon">🤖</div>
              <span class="hint-type">AI Подсказка</span>
              <button @click="$emit('clear-hint')" class="clear-hint-btn">✕</button>
            </div>
            <div class="hint-content">{{ smartHint }}</div>
          </div>
        </div>
      </div>

      <!-- Quiz Content -->
      <div v-else-if="activeTab === 'quiz' && isQuizStep" class="quiz-container">
        <div class="quiz-header">
          <div class="quiz-meta">
            <span class="quiz-type">Викторина</span>
            <span class="quiz-counter">{{ quizIndex + 1 }} / {{ totalQuizzes }}</span>
          </div>
        </div>

        <div class="quiz-body">
          <div class="question-display">
            <h4 class="question-text">{{ currentQuiz?.question }}</h4>
          </div>

          <div class="quiz-options">
            <div 
              v-for="(option, index) in quizOptions" 
              :key="index"
              class="quiz-option"
              :class="{ 
                selected: localUserAnswer === option,
                disabled: showCorrectAnswer,
                correct: showCorrectAnswer && isCorrectQuizOption(option),
                incorrect: showCorrectAnswer && localUserAnswer === option && !isCorrectQuizOption(option)
              }"
              @click="!showCorrectAnswer && selectQuizOption(option)"
            >
              <div class="option-radio">
                <input 
                  type="radio" 
                  :name="'quiz-' + quizIndex"
                  :value="option"
                  v-model="localUserAnswer"
                  @change="updateAnswer"
                  :disabled="showCorrectAnswer"
                />
                <div class="radio-custom"></div>
              </div>
              <div class="option-content">
                <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
                <span class="option-text">{{ option }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quiz feedback (similar to exercise feedback) -->
        <div v-if="confirmation" class="quiz-feedback">
          <div v-if="isOnSecondChance && !showCorrectAnswer" class="attempt-indicator">
            <div class="attempt-info">
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
            class="feedback-message" 
            :class="{ 
              correct: answerWasCorrect, 
              incorrect: !answerWasCorrect && !showCorrectAnswer,
              'show-answer': showCorrectAnswer
            }"
          >
            <div class="feedback-icon">
              <span v-if="answerWasCorrect">✅</span>
              <span v-else-if="showCorrectAnswer">💡</span>
              <span v-else>❌</span>
            </div>
            <div class="feedback-text">{{ confirmation }}</div>
          </div>

          <div v-if="showCorrectAnswer && correctAnswerText" class="correct-answer-display">
            <div class="correct-answer-header">
              <div class="answer-icon">💡</div>
              <span class="answer-label">Правильный ответ:</span>
            </div>
            <div class="correct-answer-content">{{ correctAnswerText }}</div>
          </div>
        </div>
      </div>

      <!-- Practice Tab Content -->
      <div v-else-if="activeTab === 'practice'" class="practice-container">
        <div class="practice-placeholder">
          <div class="placeholder-icon">🧪</div>
          <h4>Дополнительная практика</h4>
          <p>Здесь будут дополнительные упражнения для закрепления материала</p>
        </div>
      </div>

      <!-- Examples Tab Content -->
      <div v-else-if="activeTab === 'examples'" class="examples-container">
        <div class="examples-placeholder">
          <div class="placeholder-icon">💡</div>
          <h4>Примеры и демонстрации</h4>
          <p>Здесь будут практические примеры применения изученного материала</p>
        </div>
      </div>

      <!-- No Content State -->
      <div v-else class="no-content">
        <div class="no-content-icon">📝</div>
        <h4>Нет интерактивного содержимого</h4>
        <p>Для этого шага нет упражнений или заданий</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="interactive-actions">
      <div class="action-buttons">
        <button 
          v-if="!confirmation && attemptCount === 0 && (isExerciseStep || isQuizStep)"
          @click="$emit('show-hint')" 
          class="action-btn hint-btn"
        >
          <span class="btn-icon">💡</span>
          <span class="btn-text">Подсказка</span>
        </button>
        
        <button 
          v-if="(!confirmation || (isOnSecondChance && !showCorrectAnswer)) && (isExerciseStep || isQuizStep)"
          @click="$emit('submit')"
          :disabled="!canSubmitAnswer"
          class="action-btn submit-btn"
          :class="{ 
            disabled: !canSubmitAnswer,
            'second-chance': isOnSecondChance
          }"
        >
          <span class="btn-icon">{{ isOnSecondChance ? '🔄' : '✅' }}</span>
          <span class="btn-text">{{ isOnSecondChance ? 'Попробовать ещё раз' : 'Проверить' }}</span>
        </button>
        
        <button 
          v-if="confirmation && (answerWasCorrect || showCorrectAnswer)"
          @click="handleNext"
          class="action-btn next-btn"
        >
          <span class="btn-text">{{ isLastItem ? 'Завершить' : 'Далее' }}</span>
          <span class="btn-icon">{{ isLastItem ? '🏁' : '→' }}</span>
        </button>
      </div>
    </div>

    <!-- AI Helper Integration -->
    <div class="ai-helper-integration">
      <button 
        @click="toggleAIHelper" 
        class="ai-helper-toggle"
        :class="{ active: showAIHelper }"
      >
        <span class="ai-icon">🤖</span>
        <span class="ai-text">AI Помощник</span>
      </button>
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
    // Reactive state
    const interactiveContent = ref(null)
    const localUserAnswer = ref('')
    const localFillBlankAnswers = ref([])
    const activeTab = ref('exercises')
    const showAIHelper = ref(false)

    // Computed properties
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
    
    const blankCount = computed(() => {
      if (!props.currentExercise) return 0
      
      if (props.currentExercise.blanks && Array.isArray(props.currentExercise.blanks)) {
        return props.currentExercise.blanks.length
      }
      
      if (props.currentExercise.correctAnswers && Array.isArray(props.currentExercise.correctAnswers)) {
        return props.currentExercise.correctAnswers.length
      }
      
      const template = props.currentExercise.template || props.currentExercise.question || ''
      const matches = template.match(/\*/g) || template.match(/_+/g) || template.match(/\[blank\]/gi) || []
      
      return Math.max(matches.length, 1)
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
          
        default:
          return localUserAnswer.value !== ''
      }
    })

    const isLastItem = computed(() => {
      if (isExerciseStep.value) {
        return props.exerciseIndex >= props.totalExercises - 1
      }
      if (isQuizStep.value) {
        return props.quizIndex >= props.totalQuizzes - 1
      }
      return false
    })

    const availableTabs = computed(() => {
      const tabs = []
      
      if (isExerciseStep.value) {
        tabs.push({ id: 'exercises', label: 'Упражнения', icon: '✏️' })
        tabs.push({ id: 'practice', label: 'Практика', icon: '🧪' })
      }
      
      if (isQuizStep.value) {
        tabs.push({ id: 'quiz', label: 'Викторина', icon: '🧩' })
      }
      
      tabs.push({ id: 'examples', label: 'Примеры', icon: '💡' })
      
      return tabs
    })

    // Methods
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
        return `<span class="blank-placeholder">[Пропуск ${++blankIndex}]</span>`
      })
      
      template = template.replace(/_+/g, () => {
        return `<span class="blank-placeholder">[Пропуск ${++blankIndex}]</span>`
      })
      
      template = template.replace(/\[blank\]/gi, () => {
        return `<span class="blank-placeholder">[Пропуск ${++blankIndex}]</span>`
      })
      
      return template
    }

    const isCorrectOption = (option) => {
      const correctAnswer = props.currentExercise?.correctAnswer
      if (Array.isArray(correctAnswer)) {
        return correctAnswer.includes(option)
      }
      return correctAnswer === option
    }

    const isCorrectQuizOption = (option) => {
      const correctAnswer = props.currentQuiz?.correctAnswer
      if (Array.isArray(correctAnswer)) {
        return correctAnswer.includes(option)
      }
      return correctAnswer === option
    }

    const isCorrectTrueFalse = (value) => {
      const correctAnswer = props.currentExercise?.correctAnswer
      return String(correctAnswer).toLowerCase() === value
    }

    const getExerciseTypeText = () => {
      const typeNames = {
        'short-answer': 'Короткий ответ',
        'multiple-choice': 'Множественный выбор',
        'abc': 'Выбор варианта',
        'true-false': 'Верно/Неверно',
        'fill-blank': 'Заполните пропуски',
        'matching': 'Сопоставление',
        'ordering': 'Упорядочивание',
        'drag-drop': 'Перетащи и отпусти'
      }
      return typeNames[exerciseType.value] || 'Упражнение'
    }

    const getProgressText = () => {
      if (isExerciseStep.value) {
        return `${props.exerciseIndex + 1} / ${props.totalExercises} упражнений`
      }
      if (isQuizStep.value) {
        return `${props.quizIndex + 1} / ${props.totalQuizzes} вопросов`
      }
      return 'Практика'
    }

    const getCharacterCount = () => {
      return String(localUserAnswer.value || '').length
    }

    const handleNext = () => {
      if (isExerciseStep.value) {
        emit('next-exercise')
      } else if (isQuizStep.value) {
        emit('next-quiz')
      }
    }

    const toggleAIHelper = () => {
      showAIHelper.value = !showAIHelper.value
    }

    const setupScrollDetection = () => {
      nextTick(() => {
        const content = interactiveContent.value
        if (content) {
          const handleScroll = () => {
            if (content.scrollTop > 20) {
              content.classList.add('scrolled')
            } else {
              content.classList.remove('scrolled')
            }
          }
          
          content.addEventListener('scroll', handleScroll, { passive: true })
          handleScroll()
        }
      })
    }

    // Watchers
    watch(() => props.userAnswer, (newValue) => {
      if (exerciseType.value !== 'fill-blank') {
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

    watch(() => props.currentExercise, (newExercise, oldExercise) => {
      if (newExercise && newExercise !== oldExercise) {
        localUserAnswer.value = props.userAnswer || ''
        
        if (newExercise.type === 'fill-blank') {
          nextTick(() => {
            const count = blankCount.value
            localFillBlankAnswers.value = new Array(count).fill('')
          })
        }
      }
    }, { immediate: true })

    watch(() => props.currentStep, (newStep) => {
      if (newStep) {
        // Set appropriate active tab
        if (isExerciseStep.value) {
          activeTab.value = 'exercises'
        } else if (isQuizStep.value) {
          activeTab.value = 'quiz'
        } else {
          activeTab.value = 'examples'
        }
      }
    }, { immediate: true })

    // Lifecycle
    onMounted(() => {
      setupScrollDetection()
      
      // Initialize local state
      localUserAnswer.value = props.userAnswer || ''
      
      // Initialize fill blank answers
      if (exerciseType.value === 'fill-blank') {
        const count = blankCount.value
        localFillBlankAnswers.value = new Array(count).fill('')
        
        if (props.fillBlankAnswers && Array.isArray(props.fillBlankAnswers)) {
          for (let i = 0; i < Math.min(count, props.fillBlankAnswers.length); i++) {
            localFillBlankAnswers.value[i] = props.fillBlankAnswers[i] || ''
          }
        }
      }
    })

    return {
      // Refs
      interactiveContent,
      
      // State
      localUserAnswer,
      localFillBlankAnswers,
      activeTab,
      showAIHelper,
      
      // Computed
      isExerciseStep,
      isQuizStep,
      exerciseType,
      exerciseOptions,
      quizOptions,
      blankCount,
      canSubmitAnswer,
      isLastItem,
      availableTabs,
      
      // Methods
      updateAnswer,
      selectOption,
      selectQuizOption,
      selectTrueFalse,
      getFillBlankValue,
      handleFillBlankInput,
      renderFillBlankTemplate,
      isCorrectOption,
      isCorrectQuizOption,
      isCorrectTrueFalse,
      getExerciseTypeText,
      getProgressText,
      getCharacterCount,
      handleNext,
      toggleAIHelper,
      setupScrollDetection
    }
  }
}
</script>

<style scoped>
/* ✅ Use the improved CSS file */
@import "@/assets/css/InteractivePanel.css";
</style>