<template>
  <div class="lesson-container">
    <!-- Left Side - Lesson Content -->
    <div class="lesson-content">
      <div class="content-wrapper">
        <div class="lesson-header">
          <h1 class="lesson-title">{{ lessonData.title || 'Урок загружается...' }}</h1>
          <p class="lesson-description">{{ lessonData.description || 'Изучаем английскую грамматику' }}</p>
        </div>

        <!-- Dynamic Content Cards -->
        <div 
          v-for="(section, index) in lessonSections" 
          :key="`section-${index}`"
          class="content-card"
        >
          <h2 class="card-title">{{ section.title }}</h2>
          <div v-if="section.type === 'text'" class="card-text" v-html="section.content"></div>
          <div v-else-if="section.type === 'formula'" class="formula-box">
            <p class="formula-text" v-html="section.content"></p>
          </div>
          <div v-else-if="section.type === 'examples'" class="examples-list">
            <div 
              v-for="(example, exIndex) in section.examples" 
              :key="`example-${exIndex}`"
              class="example-item"
            >
              <p class="example-text" v-html="example.text"></p>
              <p class="example-note">{{ example.note }}</p>
            </div>
          </div>
          <div v-else-if="section.type === 'uses'" class="uses-list">
            <div 
              v-for="(use, useIndex) in section.uses" 
              :key="`use-${useIndex}`"
              class="use-item"
            >
              <span class="use-number">{{ useIndex + 1 }}</span>
              <span class="use-text">{{ use }}</span>
            </div>
          </div>
          <div v-else-if="section.type === 'expressions'" class="expressions-grid">
            <div class="expressions-column">
              <h3 class="expressions-title">{{ section.column1?.title || 'Общие слова:' }}</h3>
              <ul class="expressions-list">
                <li v-for="(expr, exprIndex) in section.column1?.items" :key="`expr1-${exprIndex}`">
                  • {{ expr }}
                </li>
              </ul>
            </div>
            <div class="expressions-column">
              <h3 class="expressions-title">{{ section.column2?.title || 'Периоды времени:' }}</h3>
              <ul class="expressions-list">
                <li v-for="(expr, exprIndex) in section.column2?.items" :key="`expr2-${exprIndex}`">
                  • {{ expr }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right Side - Interactive Panel -->
    <div class="interactive-panel">
      <div class="interactive-wrapper">
        <!-- Exercise Header with Navigation -->
        <div class="exercise-header">
          <div class="exercise-info">
            <div class="exercise-badges">
              <span class="exercise-number" :style="{ backgroundColor: currentExercise?.color || 'var(--lesson-purple)' }">
                {{ currentExerciseIndex + 1 }}
              </span>
              <span class="exercise-type" :style="{ backgroundColor: currentExercise?.lightColor || 'var(--lesson-purple-light)' }">
                Упражнение {{ currentExerciseIndex + 1 }} из {{ exercises.length }}
              </span>
            </div>
            <h2 class="exercise-title">{{ currentExercise?.title || 'Упражнение' }}</h2>
            <p class="exercise-description">{{ currentExercise?.description || 'Выполните задание' }}</p>
          </div>
          
          <!-- Navigation Buttons -->
          <div class="exercise-navigation">
            <button
              @click="handlePrevious"
              :disabled="currentExerciseIndex === 0"
              class="nav-button nav-prev"
            >
              <ChevronLeftIcon class="nav-icon" />
              Назад
            </button>
            
            <div class="progress-dots">
              <button
                v-for="(_, index) in exercises"
                :key="`dot-${index}`"
                @click="setCurrentExerciseIndex(index)"
                class="progress-dot"
                :class="{ active: index === currentExerciseIndex }"
                :style="{
                  backgroundColor: index === currentExerciseIndex 
                    ? (currentExercise?.color || 'var(--lesson-purple)') 
                    : 'var(--muted-foreground)'
                }"
              />
            </div>
            
            <button
              @click="handleNext"
              :disabled="currentExerciseIndex === exercises.length - 1"
              class="nav-button nav-next"
              :style="currentExerciseIndex === exercises.length - 1 ? {} : {
                borderColor: currentExercise?.color || 'var(--lesson-purple)',
                color: currentExercise?.color || 'var(--lesson-purple)'
              }"
            >
              Далее
              <ChevronRightIcon class="nav-icon" />
            </button>
          </div>
        </div>

        <!-- Current Exercise Content -->
        <div class="exercise-content">
          <!-- Reading Comprehension -->
          <div v-if="currentExercise?.id === 'reading'" class="exercise-type-content">
            <!-- Instructions -->
            <div class="instructions-card">
              <div class="instructions-header">
                <h3 class="instructions-title">Понимание прочитанного</h3>
                <p class="instructions-text">
                  Прочитайте текст ниже и ответьте на вопросы, которые следуют.
                </p>
              </div>
              <div class="instructions-box">
                <h4 class="instructions-subtitle">Инструкции:</h4>
                <ul class="instructions-list">
                  <li>• Внимательно прочитайте каждый вопрос</li>
                  <li>• Проверьте требуемый тип ответа (слово, предложение или число)</li>
                  <li>• Дайте подходящий ответ</li>
                  <li>• Нажмите "Проверить ответы" когда закончите</li>
                </ul>
              </div>
            </div>

            <!-- Reading Text -->
            <div class="reading-text-card">
              <h3 class="reading-title">Текст для чтения</h3>
              <div class="reading-content">
                <p class="reading-paragraph">{{ currentExerciseData?.readingText || 'Текст загружается...' }}</p>
              </div>
            </div>

            <!-- Questions -->
            <div class="questions-section">
              <h3 class="questions-title">Вопросы</h3>
              <div 
                v-for="(question, qIndex) in currentQuestions" 
                :key="`question-${qIndex}`"
                class="question-item"
              >
                <div class="question-header">
                  <span class="question-number" :style="{ backgroundColor: getTypeColor(question.type) }">
                    {{ qIndex + 1 }}
                  </span>
                  <span class="question-type" :style="{ backgroundColor: getTypeBgColor(question.type) }">
                    {{ getTypeLabel(question.type) }}
                  </span>
                </div>
                <p class="question-text">{{ question.question }}</p>
                
                <textarea
                  v-if="question.type === 'sentence'"
                  v-model="readingAnswers[question.id]"
                  :placeholder="question.placeholder"
                  class="answer-textarea"
                  :style="{ '--tw-ring-color': getTypeColor(question.type) }"
                  rows="3"
                  :disabled="readingSubmitted"
                />
                <input
                  v-else
                  v-model="readingAnswers[question.id]"
                  :placeholder="question.placeholder"
                  :type="question.type === 'number' ? 'number' : 'text'"
                  class="answer-input"
                  :style="{ '--tw-ring-color': getTypeColor(question.type) }"
                  :disabled="readingSubmitted"
                />
              </div>
            </div>

            <!-- Submit/Reset Buttons -->
            <div class="exercise-actions">
              <button 
                v-if="!readingSubmitted"
                @click="checkReadingAnswers"
                class="action-button submit-button"
                :disabled="!hasReadingAnswers"
                :style="{ backgroundColor: 'var(--lesson-purple)', borderColor: 'var(--lesson-purple)' }"
              >
                <CheckCircleIcon class="action-icon" />
                Проверить ответы
              </button>
              <button 
                v-else
                @click="resetReadingAnswers"
                class="action-button reset-button"
                :style="{ borderColor: 'var(--lesson-purple)', color: 'var(--lesson-purple)' }"
              >
                <RotateCcwIcon class="action-icon" />
                Попробовать снова
              </button>
            </div>

            <!-- Results -->
            <div v-if="readingSubmitted" class="results-card">
              <div class="results-header">
                <h3 class="results-title">Результаты</h3>
                <div class="results-score">
                  {{ readingScore.correct }}/{{ readingScore.total }}
                </div>
                <p class="results-message">
                  {{ readingScore.correct === readingScore.total 
                    ? "Отлично! Все правильно!" 
                    : `Хорошая попытка! Вы ответили правильно на ${readingScore.correct} из ${readingScore.total} вопросов.` }}
                </p>
              </div>
              
              <div class="results-details">
                <div 
                  v-for="question in currentQuestions" 
                  :key="`result-${question.id}`"
                  class="result-item"
                  :class="{ 
                    correct: isReadingAnswerCorrect(question), 
                    incorrect: !isReadingAnswerCorrect(question) 
                  }"
                >
                  <p class="result-question">Вопрос {{ question.id }}</p>
                  <p class="result-answer" :class="{ correct: isReadingAnswerCorrect(question), incorrect: !isReadingAnswerCorrect(question) }">
                    Ваш ответ: {{ readingAnswers[question.id] || '(Нет ответа)' }}
                  </p>
                  <p v-if="!isReadingAnswerCorrect(question)" class="result-correct">
                    Правильный ответ: {{ question.correctAnswer }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Multiple Choice -->
          <div v-else-if="currentExercise?.id === 'multiple-choice'" class="exercise-type-content">
            <!-- Instructions -->
            <div class="instructions-card">
              <div class="instructions-header">
                <h3 class="instructions-title">Множественный выбор</h3>
                <p class="instructions-text">
                  Выберите лучший ответ для каждого вопроса.
                </p>
              </div>
              <div class="instructions-box">
                <h4 class="instructions-subtitle">Инструкции:</h4>
                <ul class="instructions-list">
                  <li>• Внимательно прочитайте каждый вопрос</li>
                  <li>• Выберите лучший ответ из предложенных вариантов</li>
                  <li>• Только один ответ правильный для каждого вопроса</li>
                  <li>• Нажмите "Проверить ответы" когда закончите</li>
                </ul>
              </div>
            </div>

            <!-- Questions -->
            <div class="questions-section">
              <h3 class="questions-title">Вопросы</h3>
              <div 
                v-for="(question, qIndex) in currentMCQuestions" 
                :key="`mc-question-${qIndex}`"
                class="question-card"
              >
                <div class="question-header">
                  <span class="question-number" :style="{ backgroundColor: 'var(--lesson-green)' }">
                    {{ qIndex + 1 }}
                  </span>
                  <span class="question-type" :style="{ backgroundColor: 'var(--lesson-green-light)' }">
                    Множественный выбор
                  </span>
                </div>
                
                <p class="question-text">{{ question.question }}</p>
                
                <div class="options-list">
                  <button
                    v-for="(option, optIndex) in question.options"
                    :key="`option-${optIndex}`"
                    @click="!mcSubmitted && selectMCAnswer(question.id, getOptionLetter(optIndex))"
                    :disabled="mcSubmitted"
                    class="option-button"
                    :class="{ 
                      selected: mcAnswers[question.id] === getOptionLetter(optIndex),
                      correct: mcSubmitted && getOptionLetter(optIndex) === question.correctAnswer,
                      incorrect: mcSubmitted && mcAnswers[question.id] === getOptionLetter(optIndex) && getOptionLetter(optIndex) !== question.correctAnswer
                    }"
                  >
                    <span class="option-text">{{ option }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Submit/Reset Buttons -->
            <div class="exercise-actions">
              <button 
                v-if="!mcSubmitted"
                @click="checkMCAnswers"
                class="action-button submit-button"
                :disabled="!hasMCAnswers"
                :style="{ backgroundColor: 'var(--lesson-green)', borderColor: 'var(--lesson-green)' }"
              >
                <CheckCircleIcon class="action-icon" />
                Проверить ответы
              </button>
              <button 
                v-else
                @click="resetMCAnswers"
                class="action-button reset-button"
                :style="{ borderColor: 'var(--lesson-green)', color: 'var(--lesson-green)' }"
              >
                <RotateCcwIcon class="action-icon" />
                Попробовать снова
              </button>
            </div>

            <!-- Results -->
            <div v-if="mcSubmitted" class="results-card">
              <div class="results-header">
                <h3 class="results-title">Результаты</h3>
                <div class="results-score">
                  {{ mcScore.correct }}/{{ mcScore.total }}
                </div>
                <p class="results-message">
                  {{ mcScore.correct === mcScore.total 
                    ? "Отлично! Все правильно!" 
                    : `Хорошая попытка! Вы ответили правильно на ${mcScore.correct} из ${mcScore.total} вопросов.` }}
                </p>
              </div>
            </div>
          </div>

          <!-- Short Answer -->
          <div v-else-if="currentExercise?.id === 'short-answer'" class="exercise-type-content">
            <!-- Instructions -->
            <div class="instructions-card">
              <div class="instructions-header">
                <h3 class="instructions-title">Краткий ответ</h3>
                <p class="instructions-text">
                  Дайте краткие, точные ответы на каждый вопрос.
                </p>
              </div>
              <div class="instructions-box">
                <h4 class="instructions-subtitle">Инструкции:</h4>
                <ul class="instructions-list">
                  <li>• Пишите короткие, точные ответы</li>
                  <li>• Внимательно проверяйте правописание</li>
                  <li>• Некоторые вопросы могут требовать несколько слов</li>
                  <li>• Используйте строчные буквы, если не требуются заглавные</li>
                </ul>
              </div>
            </div>

            <!-- Questions -->
            <div class="questions-section">
              <h3 class="questions-title">Вопросы</h3>
              <div 
                v-for="(question, qIndex) in currentSAQuestions" 
                :key="`sa-question-${qIndex}`"
                class="question-card"
              >
                <div class="question-header">
                  <span class="question-number" :style="{ backgroundColor: 'var(--lesson-blue)' }">
                    {{ qIndex + 1 }}
                  </span>
                  <span class="question-type" :style="{ backgroundColor: 'var(--lesson-blue-light)' }">
                    Краткий ответ
                  </span>
                </div>
                
                <p class="question-text">{{ question.question }}</p>
                
                <input
                  v-model="saAnswers[question.id]"
                  :placeholder="question.placeholder"
                  class="answer-input"
                  :style="{ '--tw-ring-color': 'var(--lesson-blue)' }"
                  :disabled="saSubmitted"
                />
                
                <div v-if="saSubmitted" class="answer-feedback" :class="{ 
                  correct: isSAAnswerCorrect(question), 
                  incorrect: !isSAAnswerCorrect(question) 
                }">
                  <p class="feedback-answer">Ваш ответ: {{ saAnswers[question.id] || '(Нет ответа)' }}</p>
                  <p v-if="!isSAAnswerCorrect(question)" class="feedback-correct">
                    Правильный ответ: {{ question.correctAnswer }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Submit/Reset Buttons -->
            <div class="exercise-actions">
              <button 
                v-if="!saSubmitted"
                @click="checkSAAnswers"
                class="action-button submit-button"
                :disabled="!hasSAAnswers"
                :style="{ backgroundColor: 'var(--lesson-blue)', borderColor: 'var(--lesson-blue)' }"
              >
                <CheckCircleIcon class="action-icon" />
                Проверить ответы
              </button>
              <button 
                v-else
                @click="resetSAAnswers"
                class="action-button reset-button"
                :style="{ borderColor: 'var(--lesson-blue)', color: 'var(--lesson-blue)' }"
              >
                <RotateCcwIcon class="action-icon" />
                Попробовать снова
              </button>
            </div>

            <!-- Results -->
            <div v-if="saSubmitted" class="results-card">
              <div class="results-header">
                <h3 class="results-title">Результаты</h3>
                <div class="results-score">
                  {{ saScore.correct }}/{{ saScore.total }}
                </div>
                <p class="results-message">
                  {{ saScore.correct === saScore.total 
                    ? "Отлично! Все правильно!" 
                    : `Хорошая попытка! Вы ответили правильно на ${saScore.correct} из ${saScore.total} вопросов.` }}
                </p>
              </div>
            </div>
          </div>

          <!-- Other Exercise Types (Matching, Fill Blanks, Structure) can be added here -->
          <div v-else class="exercise-placeholder">
            <div class="placeholder-content">
              <h3>{{ currentExercise?.title || 'Упражнение' }}</h3>
              <p>{{ currentExercise?.description || 'Этот тип упражнения скоро будет доступен.' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'

// Mock icons - replace with your actual icon imports
const ChevronLeftIcon = { template: '<span>←</span>' }
const ChevronRightIcon = { template: '<span>→</span>' }
const CheckCircleIcon = { template: '<span>✓</span>' }
const RotateCcwIcon = { template: '<span>↻</span>' }

export default {
  name: 'PresentPerfectLesson',
  components: {
    ChevronLeftIcon,
    ChevronRightIcon,
    CheckCircleIcon,
    RotateCcwIcon
  },
  props: {
    lessonId: {
      type: [String, Number],
      default: null
    },
    stepData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // ========================
    // REACTIVE STATE
    // ========================
    const lessonData = ref({})
    const lessonSections = ref([])
    const exercises = ref([])
    const currentExerciseIndex = ref(0)
    
    // Exercise states
    const readingAnswers = reactive({})
    const readingSubmitted = ref(false)
    const mcAnswers = reactive({})
    const mcSubmitted = ref(false)
    const saAnswers = reactive({})
    const saSubmitted = ref(false)

    // ========================
    // COMPUTED PROPERTIES
    // ========================
    const currentExercise = computed(() => {
      return exercises.value[currentExerciseIndex.value] || null
    })

    const currentExerciseData = computed(() => {
      return currentExercise.value?.data || {}
    })

    const currentQuestions = computed(() => {
      if (currentExercise.value?.id === 'reading') {
        return currentExerciseData.value.questions || []
      }
      return []
    })

    const currentMCQuestions = computed(() => {
      if (currentExercise.value?.id === 'multiple-choice') {
        return currentExerciseData.value.questions || []
      }
      return []
    })

    const currentSAQuestions = computed(() => {
      if (currentExercise.value?.id === 'short-answer') {
        return currentExerciseData.value.questions || []
      }
      return []
    })

    const hasReadingAnswers = computed(() => {
      return Object.keys(readingAnswers).length > 0
    })

    const hasMCAnswers = computed(() => {
      return Object.keys(mcAnswers).length > 0
    })

    const hasSAAnswers = computed(() => {
      return Object.keys(saAnswers).length > 0
    })

    const readingScore = computed(() => {
      if (!readingSubmitted.value) return { correct: 0, total: 0 }
      
      const correct = currentQuestions.value.filter(q => 
        readingAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase()
      ).length
      return { correct, total: currentQuestions.value.length }
    })

    const mcScore = computed(() => {
      if (!mcSubmitted.value) return { correct: 0, total: 0 }
      
      const correct = currentMCQuestions.value.filter(q => 
        mcAnswers[q.id] === q.correctAnswer
      ).length
      return { correct, total: currentMCQuestions.value.length }
    })

    const saScore = computed(() => {
      if (!saSubmitted.value) return { correct: 0, total: 0 }
      
      const correct = currentSAQuestions.value.filter(q => 
        saAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase()
      ).length
      return { correct, total: currentSAQuestions.value.length }
    })

    // ========================
    // METHODS
    // ========================
    
    // Navigation methods
    const handleNext = () => {
      if (currentExerciseIndex.value < exercises.value.length - 1) {
        currentExerciseIndex.value++
      }
    }
    
    const handlePrevious = () => {
      if (currentExerciseIndex.value > 0) {
        currentExerciseIndex.value--
      }
    }

    const setCurrentExerciseIndex = (index) => {
      if (index >= 0 && index < exercises.value.length) {
        currentExerciseIndex.value = index
      }
    }

    // Helper methods
    const getTypeLabel = (type) => {
      switch (type) {
        case 'word': return 'Одно слово'
        case 'sentence': return 'Полное предложение'
        case 'number': return 'Число'
        default: return 'Ответ'
      }
    }

    const getTypeColor = (type) => {
      switch (type) {
        case 'word': return 'var(--lesson-green)'
        case 'sentence': return 'var(--lesson-blue)'
        case 'number': return 'var(--lesson-yellow)'
        default: return 'var(--lesson-purple)'
      }
    }

    const getTypeBgColor = (type) => {
      switch (type) {
        case 'word': return 'var(--lesson-green-light)'
        case 'sentence': return 'var(--lesson-blue-light)'
        case 'number': return 'var(--lesson-yellow-light)'
        default: return 'var(--lesson-purple-light)'
      }
    }

    const getOptionLetter = (index) => {
      return String.fromCharCode(65 + index) // A, B, C, D...
    }

    // Answer checking methods
    const isReadingAnswerCorrect = (question) => {
      return readingAnswers[question.id]?.toLowerCase().trim() === question.correctAnswer.toLowerCase()
    }

    const isSAAnswerCorrect = (question) => {
      return saAnswers[question.id]?.toLowerCase().trim() === question.correctAnswer.toLowerCase()
    }

    // Exercise action methods
    const selectMCAnswer = (questionId, answer) => {
      mcAnswers[questionId] = answer
    }

    const checkReadingAnswers = () => {
      readingSubmitted.value = true
    }

    const resetReadingAnswers = () => {
      Object.keys(readingAnswers).forEach(key => {
        delete readingAnswers[key]
      })
      readingSubmitted.value = false
    }

    const checkMCAnswers = () => {
      mcSubmitted.value = true
    }

    const resetMCAnswers = () => {
      Object.keys(mcAnswers).forEach(key => {
        delete mcAnswers[key]
      })
      mcSubmitted.value = false
    }

    const checkSAAnswers = () => {
      saSubmitted.value = true
    }

    const resetSAAnswers = () => {
      Object.keys(saAnswers).forEach(key => {
        delete saAnswers[key]
      })
      saSubmitted.value = false
    }

    // Data loading methods
    const loadLessonData = async () => {
      try {
        // This should connect to your backend composables
        // Replace with actual API calls or composable usage
        
        if (props.stepData) {
          // Use provided step data
          lessonData.value = props.stepData
          parseLessonContent(props.stepData)
        } else if (props.lessonId) {
          // Load from API using lessonId
          // const data = await loadLessonById(props.lessonId)
          // lessonData.value = data
          // parseLessonContent(data)
          
          // For now, show loading state
          console.log('Loading lesson with ID:', props.lessonId)
        } else {
          console.warn('No lesson data or ID provided')
        }
      } catch (error) {
        console.error('Error loading lesson data:', error)
      }
    }

    const parseLessonContent = (data) => {
      // Parse lesson sections from backend data
      if (data.sections) {
        lessonSections.value = data.sections
      }
      
      // Parse exercises from backend data
      if (data.exercises) {
        exercises.value = data.exercises.map((exercise, index) => ({
          ...exercise,
          color: getExerciseColor(exercise.type, index),
          lightColor: getExerciseLightColor(exercise.type, index)
        }))
      }
    }

    const getExerciseColor = (type, index) => {
      const colors = [
        'var(--lesson-purple)',
        'var(--lesson-green)', 
        'var(--lesson-blue)',
        'var(--lesson-yellow)',
        'var(--lesson-purple)',
        'var(--lesson-green)'
      ]
      return colors[index % colors.length]
    }

    const getExerciseLightColor = (type, index) => {
      const colors = [
        'var(--lesson-purple-light)',
        'var(--lesson-green-light)', 
        'var(--lesson-blue-light)',
        'var(--lesson-yellow-light)',
        'var(--lesson-purple-light)',
        'var(--lesson-green-light)'
      ]
      return colors[index % colors.length]
    }

    // ========================
    // WATCHERS
    // ========================
    watch(() => currentExerciseIndex.value, () => {
      // Reset all answer states when changing exercises
      Object.keys(readingAnswers).forEach(key => delete readingAnswers[key])
      Object.keys(mcAnswers).forEach(key => delete mcAnswers[key])
      Object.keys(saAnswers).forEach(key => delete saAnswers[key])
      
      readingSubmitted.value = false
      mcSubmitted.value = false
      saSubmitted.value = false
    })

    watch(() => props.stepData, (newData) => {
      if (newData) {
        lessonData.value = newData
        parseLessonContent(newData)
      }
    }, { deep: true })

    // ========================
    // LIFECYCLE
    // ========================
    onMounted(() => {
      loadLessonData()
    })

    // ========================
    // RETURN
    // ========================
    return {
      // State
      lessonData,
      lessonSections,
      exercises,
      currentExerciseIndex,
      readingAnswers,
      readingSubmitted,
      mcAnswers,
      mcSubmitted,
      saAnswers,
      saSubmitted,
      
      // Computed
      currentExercise,
      currentExerciseData,
      currentQuestions,
      currentMCQuestions,
      currentSAQuestions,
      hasReadingAnswers,
      hasMCAnswers,
      hasSAAnswers,
      readingScore,
      mcScore,
      saScore,
      
      // Methods
      handleNext,
      handlePrevious,
      setCurrentExerciseIndex,
      getTypeLabel,
      getTypeColor,
      getTypeBgColor,
      getOptionLetter,
      isReadingAnswerCorrect,
      isSAAnswerCorrect,
      selectMCAnswer,
      checkReadingAnswers,
      resetReadingAnswers,
      checkMCAnswers,
      resetMCAnswers,
      checkSAAnswers,
      resetSAAnswers
    }
  }
}
</script>

<style scoped>
/* CSS Variables for theming */
:root {
  --lesson-purple: #8b5cf6;
  --lesson-purple-light: #ede9fe;
  --lesson-green: #10b981;
  --lesson-green-light: #d1fae5;
  --lesson-blue: #3b82f6;
  --lesson-blue-light: #dbeafe;
  --lesson-yellow: #f59e0b;
  --lesson-yellow-light: #fef3c7;
  --background: #ffffff;
  --card: #ffffff;
  --border: #e2e8f0;
  --foreground: #1e293b;
  --card-foreground: #374151;
  --muted-foreground: #64748b;
  --input-background: #f8fafc;
}

/* Main Layout */
.lesson-container {
  height: 100vh;
  display: flex;
  background: var(--background);
}

/* Left Side - Lesson Content */
.lesson-content {
  width: 50%;
  border-right: 1px solid var(--border);
}

.content-wrapper {
  height: 100%;
  padding: 24px;
  background: var(--background);
  overflow-y: auto;
}

.lesson-header {
  margin-bottom: 24px;
}

.lesson-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0 0 8px 0;
}

.lesson-description {
  color: var(--muted-foreground);
  margin: 0;
  font-size: 1.1rem;
}

.content-card {
  padding: 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--card-foreground);
  margin: 0 0 16px 0;
}

.card-text {
  color: var(--muted-foreground);
  line-height: 1.7;
  margin: 0 0 16px 0;
  font-size: 1rem;
}

.formula-box {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--lesson-purple-light);
  border-left: 4px solid var(--lesson-purple);
}

.formula-text {
  color: var(--foreground);
  margin: 0;
  font-size: 1rem;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.example-item {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--lesson-green-light);
  border-left: 4px solid var(--lesson-green);
}

.example-text {
  color: var(--foreground);
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.example-note {
  color: var(--muted-foreground);
  margin: 0;
  font-size: 0.9rem;
}

.uses-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.use-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.use-number {
  background: var(--lesson-blue);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.use-text {
  color: var(--foreground);
  line-height: 1.6;
}

.expressions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.expressions-column {
  padding: 16px;
  border-radius: 8px;
  background: var(--lesson-yellow-light);
}

.expressions-title {
  color: var(--foreground);
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.expressions-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.expressions-list li {
  color: var(--muted-foreground);
  margin: 4px 0;
  font-size: 0.9rem;
}

/* Right Side - Interactive Panel */
.interactive-panel {
  width: 50%;
}

.interactive-wrapper {
  height: 100%;
  padding: 24px;
  background: var(--background);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Exercise Header */
.exercise-header {
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 20px;
}

.exercise-info {
  margin-bottom: 16px;
}

.exercise-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.exercise-number {
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
}

.exercise-type {
  color: var(--foreground);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.exercise-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--card-foreground);
  margin: 0 0 4px 0;
}

.exercise-description {
  color: var(--muted-foreground);
  margin: 0;
  font-size: 0.9rem;
}

.exercise-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  color: var(--muted-foreground);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-button:hover:not(:disabled) {
  background: var(--input-background);
  transform: translateY(-1px);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-next {
  color: var(--lesson-purple);
  border-color: var(--lesson-purple);
}

.nav-icon {
  width: 16px;
  height: 16px;
}

.progress-dots {
  display: flex;
  gap: 6px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.3;
}

.progress-dot.active {
  opacity: 1;
  transform: scale(1.2);
}

/* Exercise Content */
.exercise-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exercise-type-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Instructions Card */
.instructions-card {
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.instructions-header {
  margin-bottom: 16px;
}

.instructions-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--card-foreground);
  margin: 0 0 8px 0;
}

.instructions-text {
  color: var(--muted-foreground);
  margin: 0;
  font-size: 1rem;
}

.instructions-box {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--lesson-purple-light);
}

.instructions-subtitle {
  color: var(--foreground);
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
}

.instructions-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.instructions-list li {
  color: var(--muted-foreground);
  margin: 4px 0;
  font-size: 0.9rem;
}

/* Reading Text Card */
.reading-text-card {
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.reading-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--card-foreground);
  margin: 0 0 12px 0;
}

.reading-content {
  padding: 16px;
  border-radius: 8px;
  background: var(--lesson-blue-light);
}

.reading-paragraph {
  color: var(--foreground);
  line-height: 1.7;
  margin: 0;
}

/* Questions Section */
.questions-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.questions-title {
  color: var(--foreground);
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.question-item,
.question-card {
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-number {
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.question-type {
  color: var(--foreground);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.question-text {
  color: var(--card-foreground);
  margin: 0;
  line-height: 1.6;
  font-size: 1rem;
}

/* Answer Inputs */
.answer-textarea,
.answer-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--input-background);
  transition: border-color 0.2s ease;
  font-family: inherit;
  resize: vertical;
}

.answer-textarea {
  min-height: 80px;
}

.answer-textarea:focus,
.answer-input:focus {
  outline: none;
  border-color: var(--lesson-purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.answer-textarea::placeholder,
.answer-input::placeholder {
  color: var(--muted-foreground);
  font-style: italic;
}

/* Options List */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-button {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.option-button:hover:not(:disabled) {
  border-color: var(--lesson-green);
  background: var(--lesson-green-light);
}

.option-button.selected {
  border-color: var(--lesson-green);
  background: var(--lesson-green-light);
}

.option-button.correct {
  border-color: var(--lesson-green);
  background: var(--lesson-green-light);
}

.option-button.incorrect {
  border-color: var(--lesson-yellow);
  background: var(--lesson-yellow-light);
}

.option-button:disabled {
  cursor: not-allowed;
}

.option-text {
  color: var(--foreground);
  font-size: 1rem;
  line-height: 1.4;
}

/* Exercise Actions */
.exercise-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px 0;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;
  justify-content: center;
}

.submit-button {
  color: white;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reset-button {
  background: transparent;
  border: 2px solid var(--lesson-purple);
  color: var(--lesson-purple);
}

.reset-button:hover {
  background: var(--lesson-purple-light);
  transform: translateY(-1px);
}

.action-icon {
  width: 16px;
  height: 16px;
}

/* Results Card */
.results-card {
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.results-header {
  text-align: center;
  margin-bottom: 16px;
}

.results-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--card-foreground);
  margin: 0 0 12px 0;
}

.results-score {
  font-size: 2rem;
  font-weight: 700;
  color: var(--lesson-green);
  margin-bottom: 8px;
}

.results-message {
  color: var(--muted-foreground);
  margin: 0;
  font-size: 1rem;
}

.results-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.result-item.correct {
  background: var(--lesson-green-light);
  border-color: var(--lesson-green);
}

.result-item.incorrect {
  background: var(--lesson-yellow-light);
  border-color: var(--lesson-yellow);
}

.result-question {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  margin: 0 0 4px 0;
}

.result-answer {
  font-size: 0.9rem;
  margin: 0 0 4px 0;
}

.result-answer.correct {
  color: var(--foreground);
}

.result-answer.incorrect {
  color: #dc2626;
}

.result-correct {
  font-size: 0.9rem;
  color: var(--foreground);
  margin: 0;
}

/* Answer Feedback */
.answer-feedback {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-top: 12px;
}

.answer-feedback.correct {
  background: var(--lesson-green-light);
  border-color: var(--lesson-green);
}

.answer-feedback.incorrect {
  background: var(--lesson-yellow-light);
  border-color: var(--lesson-yellow);
}

.feedback-answer {
  font-size: 0.9rem;
  margin: 0 0 4px 0;
}

.feedback-answer.correct {
  color: var(--foreground);
}

.feedback-answer.incorrect {
  color: #dc2626;
}

.feedback-correct {
  font-size: 0.9rem;
  color: var(--foreground);
  margin: 0;
}

/* Exercise Placeholder */
.exercise-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
}

.placeholder-content h3 {
  color: var(--card-foreground);
  margin: 0 0 8px 0;
  font-size: 1.3rem;
}

.placeholder-content p {
  color: var(--muted-foreground);
  margin: 0;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .lesson-container {
    flex-direction: column;
    height: auto;
  }
  
  .lesson-content,
  .interactive-panel {
    width: 100%;
  }
  
  .lesson-content {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  
  .content-wrapper,
  .interactive-wrapper {
    padding: 16px;
  }
  
  .exercise-navigation {
    flex-direction: column;
    gap: 12px;
  }
  
  .expressions-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .exercise-actions {
    flex-direction: column;
  }
  
  .action-button {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .lesson-title {
    font-size: 1.5rem;
  }
  
  .card-title {
    font-size: 1.3rem;
  }
  
  .exercise-title {
    font-size: 1.1rem;
  }
  
  .content-wrapper,
  .interactive-wrapper {
    padding: 12px;
  }
  
  .content-card,
  .exercise-header,
  .instructions-card,
  .reading-text-card,
  .question-item,
  .question-card,
  .results-card {
    padding: 12px;
  }
}

/* Focus states for accessibility */
.nav-button:focus,
.progress-dot:focus,
.option-button:focus,
.action-button:focus,
.answer-textarea:focus,
.answer-input:focus {
  outline: 2px solid var(--lesson-blue);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .question-item,
  .question-card,
  .content-card,
  .exercise-header {
    border-width: 3px;
  }
  
  .question-number,
  .exercise-number {
    border: 2px solid white;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .nav-button,
  .option-button,
  .action-button,
  .progress-dot {
    transition: none;
  }
  
  .nav-button:hover,
  .action-button:hover {
    transform: none;
  }
}
</style>