// src/composables/useExercises.js - Clean and organized exercise logic
import { ref, reactive, computed } from 'vue'

export function useExercises() {
  // ===================================
  // STATE MANAGEMENT
  // ===================================
  
  // Navigation state
  const currentExerciseIndex = ref(0)
  const currentQuizIndex = ref(0)
  
  // Answer state
  const userAnswer = ref('')
  const fillBlankAnswers = ref([])
  const matchingPairs = ref([])
  const orderingItems = ref([])
  const dragDropPlacements = reactive({})
  
  // UI state
  const confirmation = ref('')
  const answerWasCorrect = ref(false)
  const currentHint = ref('')
  const smartHint = ref('')
  const selectedMatchingItem = ref(null)
  
  // Drag and drop state
  const availableDragItems = ref([])
  const dropZones = ref([])
  const draggedDragItem = ref(null)
  const dropOverZone = ref(null)
  
  // Attempt tracking
  const attemptCount = ref(0)
  const maxAttempts = ref(2)
  const showCorrectAnswer = ref(false)
  
  // ===================================
  // COMPUTED PROPERTIES
  // ===================================
  
  const isOnSecondChance = computed(() => {
    return attemptCount.value === 1 && attemptCount.value < maxAttempts.value
  })
  
  // ===================================
  // UTILITY FUNCTIONS
  // ===================================
  
  const calculateSimilarity = (str1, str2) => {
    if (str1 === str2) return 1
    
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1
    
    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  const levenshteinDistance = (str1, str2) => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }

  const getCorrectAnswersArray = (exercise) => {
    const correctAnswer = exercise.correctAnswer || exercise.answer
    
    if (Array.isArray(correctAnswer)) {
      return correctAnswer
    }
    
    if (typeof correctAnswer === 'string' && correctAnswer.includes(',')) {
      return correctAnswer.split(',').map(answer => answer.trim())
    }
    
    return [correctAnswer].filter(Boolean)
  }

  // ===================================
  // VALIDATION FUNCTIONS
  // ===================================
  
  const validateShortAnswer = (userAnswer, exercise) => {
    console.log('📝 Validating short answer:', userAnswer)
    
    if (!userAnswer || typeof userAnswer !== 'string') {
      return false
    }

    const correctAnswers = getCorrectAnswersArray(exercise)
    const userAnswerTrimmed = userAnswer.trim().toLowerCase()

    return correctAnswers.some(answer => {
      const correctAnswerTrimmed = String(answer).trim().toLowerCase()
      
      if (userAnswerTrimmed === correctAnswerTrimmed) {
        return true
      }
      
      // Fuzzy matching for longer answers
      if (correctAnswerTrimmed.length > 3) {
        const similarity = calculateSimilarity(userAnswerTrimmed, correctAnswerTrimmed)
        return similarity > 0.8
      }
      
      return false
    })
  }

  const validateMultipleChoice = (userAnswer, exercise) => {
    console.log('🔘 Validating multiple choice:', userAnswer)
    
    const correctAnswer = exercise.correctAnswer

    // Handle numeric answer indices
    if (typeof correctAnswer === 'number') {
      if (typeof userAnswer === 'number') {
        return userAnswer === correctAnswer
      }
      
      // Convert text answer to index
      if (exercise.options && Array.isArray(exercise.options)) {
        const userIndex = exercise.options.findIndex(option => {
          const optionText = typeof option === 'string' ? option : (option?.text || String(option))
          return optionText === userAnswer
        })
        return userIndex === correctAnswer
      }
    }

    // Handle string answers
    if (typeof correctAnswer === 'string') {
      if (typeof userAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      }
      
      // Convert index to text
      if (typeof userAnswer === 'number' && exercise.options) {
        const selectedOption = exercise.options[userAnswer]
        const selectedText = typeof selectedOption === 'string' ? selectedOption : (selectedOption?.text || String(selectedOption))
        return selectedText.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      }
    }

    return false
  }

  const validateTrueFalse = (userAnswer, exercise) => {
    console.log('✔️ Validating true/false:', userAnswer)
    
    const correctAnswer = exercise.correctAnswer

    // Boolean correct answer
    if (typeof correctAnswer === 'boolean') {
      if (typeof userAnswer === 'boolean') {
        return userAnswer === correctAnswer
      }
      if (typeof userAnswer === 'string') {
        return userAnswer.toLowerCase() === 'true' ? true : false === correctAnswer
      }
      if (typeof userAnswer === 'number') {
        return (userAnswer === 1 ? true : false) === correctAnswer
      }
    }

    // Numeric correct answer (0 = true, 1 = false)
    if (typeof correctAnswer === 'number') {
      if (typeof userAnswer === 'number') {
        return userAnswer === correctAnswer
      }
      if (typeof userAnswer === 'string') {
        const expectedBool = correctAnswer === 0
        const userBool = userAnswer.toLowerCase() === 'true'
        return userBool === expectedBool
      }
    }

    // String correct answer
    if (typeof correctAnswer === 'string') {
      if (typeof userAnswer === 'string') {
        return userAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }
    }

    return false
  }

  const validateFillBlank = (userAnswers, exercise) => {
    console.log('📝 Validating fill blank:', userAnswers)
    
    if (!Array.isArray(userAnswers)) {
      userAnswers = fillBlankAnswers.value || []
    }

    if (!Array.isArray(userAnswers) || userAnswers.length === 0) {
      return false
    }

    // Get correct answers from various possible sources
    let correctAnswers = []
    
    if (exercise.blanks && Array.isArray(exercise.blanks)) {
      correctAnswers = exercise.blanks.map(blank => {
        if (typeof blank === 'string') return blank
        return blank?.answer || blank?.text || String(blank)
      })
    } else if (exercise.correctAnswers && Array.isArray(exercise.correctAnswers)) {
      correctAnswers = exercise.correctAnswers
    } else if (exercise.answers && Array.isArray(exercise.answers)) {
      correctAnswers = exercise.answers
    } else if (exercise.hint) {
      correctAnswers = exercise.hint.split(',').map(h => h.trim())
    }
    
    // Clean and filter answers
    const finalCorrectAnswers = correctAnswers
      .map(answer => String(answer || '').trim())
      .filter(answer => answer.length > 0)

    if (finalCorrectAnswers.length === 0) {
      return false
    }

    // Check each answer
    let correctCount = 0
    for (let i = 0; i < finalCorrectAnswers.length; i++) {
      const userAnswerItem = String(userAnswers[i] || '').trim().toLowerCase()
      const correctAnswer = finalCorrectAnswers[i].toLowerCase()

      if (!userAnswerItem || !correctAnswer) continue

      let isCorrect = userAnswerItem === correctAnswer
      
      // Fuzzy matching for longer answers
      if (!isCorrect && correctAnswer.length > 3) {
        const similarity = calculateSimilarity(userAnswerItem, correctAnswer)
        isCorrect = similarity > 0.85
      }

      if (isCorrect) {
        correctCount++
      }
    }

    return correctCount === finalCorrectAnswers.length
  }

  const validateMatching = (userPairs, exercise) => {
    console.log('🔗 Validating matching exercise')
    
    if (!Array.isArray(userPairs)) {
      userPairs = matchingPairs.value || []
    }

    if (!Array.isArray(userPairs) || userPairs.length === 0) {
      return false
    }

    const exercisePairs = exercise.pairs || []
    if (!Array.isArray(exercisePairs) || exercisePairs.length === 0) {
      return false
    }

    if (userPairs.length !== exercisePairs.length) {
      return false
    }

    // Check if leftIndex === rightIndex for each pair (correct matching)
    let correctCount = 0
    
    userPairs.forEach((userPair) => {
      if (!userPair || typeof userPair !== 'object') return

      const { leftIndex, rightIndex } = userPair
      
      if (leftIndex !== undefined && rightIndex !== undefined && leftIndex === rightIndex) {
        correctCount++
      }
    })

    return correctCount === exercisePairs.length
  }

  const validateOrdering = (userItems, exercise) => {
    console.log('🔄 Validating ordering:', userItems)
    
    if (!Array.isArray(userItems)) {
      userItems = orderingItems.value || []
    }
    
    if (!Array.isArray(userItems) || userItems.length === 0) {
      return false
    }

    const correctItems = exercise.items || []
    if (!Array.isArray(correctItems) || correctItems.length === 0) {
      return false
    }

    if (userItems.length !== correctItems.length) {
      return false
    }

    // Check if each item is in the correct position
    for (let i = 0; i < correctItems.length; i++) {
      const userItem = userItems[i]
      const correctItem = correctItems[i]
      
      const userText = typeof userItem === 'string' ? userItem : (userItem?.text || userItem?.id || String(userItem))
      const correctText = typeof correctItem === 'string' ? correctItem : (correctItem?.text || correctItem?.id || String(correctItem))
      
      if (userText.trim().toLowerCase() !== correctText.trim().toLowerCase()) {
        return false
      }
    }

    return true
  }

  const validateDragDrop = (userPlacements, exercise) => {
    console.log('🎯 Validating drag-drop:', userPlacements)
    
    if (!userPlacements || typeof userPlacements !== 'object') {
      userPlacements = dragDropPlacements
    }

    const dropZonesArray = Array.isArray(exercise.dropZones) 
      ? exercise.dropZones 
      : Object.values(exercise.dropZones || {}).filter(zone => zone && (zone.label || zone.id))

    if (dropZonesArray.length === 0) {
      return false
    }

    let correctCount = 0
    let totalRequired = 0

    for (const zone of dropZonesArray) {
      const zoneId = zone.id || zone.label || String(zone)
      const userItems = userPlacements[zoneId] || []
      
      // Get correct items for this zone
      let correctItems = zone.correctItems || zone.items || []
      
      if (zone.correctItem !== undefined) {
        if (typeof zone.correctItem === 'number' && exercise.dragItems) {
          const dragItems = Array.isArray(exercise.dragItems) ? exercise.dragItems : Object.values(exercise.dragItems)
          correctItems = [dragItems[zone.correctItem]]
        } else {
          correctItems = [zone.correctItem]
        }
      }

      totalRequired += correctItems.length

      // Check if all correct items are present in user's placement
      for (const correctItem of correctItems) {
        const correctText = typeof correctItem === 'string' ? correctItem : (correctItem?.text || correctItem?.label || String(correctItem))
        
        const isItemPresent = userItems.some(userItem => {
          const userText = typeof userItem === 'string' ? userItem : (userItem?.text || userItem?.label || String(userItem))
          return userText.trim().toLowerCase() === correctText.trim().toLowerCase()
        })

        if (isItemPresent) {
          correctCount++
        }
      }
    }

    return correctCount === totalRequired && totalRequired > 0
  }

  // ===================================
  // MAIN VALIDATION FUNCTION
  // ===================================
  
  const validateCurrentAnswer = (exercise) => {
    if (!exercise) {
      console.log('❌ No exercise provided for validation')
      return false
    }

    const exerciseType = exercise.type || 'short-answer'
    
    console.log(`🔍 Validating ${exerciseType.toUpperCase()} exercise`)

    switch (exerciseType) {
      case 'short-answer':
        return validateShortAnswer(userAnswer.value, exercise)
      case 'multiple-choice':
      case 'abc':
        return validateMultipleChoice(userAnswer.value, exercise)
      case 'true-false':
        return validateTrueFalse(userAnswer.value, exercise)
      case 'fill-blank':
        return validateFillBlank(fillBlankAnswers.value, exercise)
      case 'matching':
        return validateMatching(matchingPairs.value, exercise)
      case 'ordering':
        return validateOrdering(orderingItems.value, exercise)
      case 'drag-drop':
        return validateDragDrop(dragDropPlacements, exercise)
      default:
        return validateShortAnswer(userAnswer.value, exercise)
    }
  }

  const validateQuizAnswer = (quiz) => {
    if (!quiz) return false

    const quizType = quiz.type || 'multiple-choice'
    console.log(`🔍 Validating quiz (${quizType}):`, userAnswer.value)

    switch (quizType) {
      case 'multiple-choice':
        return validateMultipleChoice(userAnswer.value, quiz)
      case 'true-false':
        return validateTrueFalse(userAnswer.value, quiz)
      case 'short-answer':
        return validateShortAnswer(userAnswer.value, quiz)
      default:
        return validateMultipleChoice(userAnswer.value, quiz)
    }
  }

  // ===================================
  // ANSWER CHECKING FUNCTIONS
  // ===================================
  
  const canSubmitAnswer = (exercise) => {
    if (!exercise) {
      return userAnswer.value && userAnswer.value.trim().length > 0
    }
    
    const exerciseType = exercise.type || 'short-answer'
    
    switch (exerciseType) {
      case 'short-answer':
        return userAnswer.value && userAnswer.value.trim().length > 0
        
      case 'multiple-choice':
      case 'abc':
      case 'true-false':
        return userAnswer.value !== null && userAnswer.value !== undefined && userAnswer.value !== ''
        
      case 'fill-blank':
        return Array.isArray(fillBlankAnswers.value) && 
               fillBlankAnswers.value.some(answer => answer && answer.trim().length > 0)
        
      case 'matching':
        return Array.isArray(matchingPairs.value) && matchingPairs.value.length > 0
        
      case 'ordering':
        return Array.isArray(orderingItems.value) && orderingItems.value.length > 0
        
      case 'drag-drop':
        return Object.values(dragDropPlacements).some(items => 
          Array.isArray(items) && items.length > 0
        )
        
      default:
        return userAnswer.value && userAnswer.value.trim().length > 0
    }
  }

  // ===================================
  // FEEDBACK MESSAGES
  // ===================================
  
  const getRandomSuccessMessage = () => {
    const messages = [
      '✅ Отлично! Правильный ответ!',
      '🎉 Верно! Так держать!',
      '⭐ Великолепно! Продолжайте!',
      '🚀 Правильно! Вы молодец!',
      '💯 Точно в цель! Отличная работа!',
      '🏆 Превосходно! Идём дальше!'
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getSecondChanceMessage = (exercise) => {
    const messages = [
      '🤔 Не совсем правильно. У вас есть ещё одна попытка!',
      '💭 Подумайте ещё немного. Попробуйте снова!',
      '🎯 Почти попали! Ещё одна попытка!',
      '🔍 Внимательнее! У вас есть вторая попытка!',
      '📚 Перечитайте материал и попробуйте ещё раз!',
      '⚡ Не сдавайтесь! Попробуйте другой вариант!'
    ]
    
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getFinalFailureMessage = (exercise, correctAnswer) => {
    const messages = [
      '📚 Не беспокойтесь! Правильный ответ:',
      '💡 Вот правильный ответ:',
      '🎯 Правильный ответ:',
      '✅ Запомните правильный ответ:'
    ]
    
    const message = messages[Math.floor(Math.random() * messages.length)]
    return `${message} ${correctAnswer}`
  }

  const getMatchingFeedback = (userPairs, exercise, isCorrect) => {
    if (isCorrect) {
      return getRandomSuccessMessage()
    }
    
    if (!Array.isArray(userPairs) || userPairs.length === 0) {
      return '🔗 Создайте хотя бы одну пару для проверки!'
    }
    
    const exercisePairs = exercise.pairs || []
    const requiredPairs = exercisePairs.length
    const userPairCount = userPairs.length
    
    if (userPairCount < requiredPairs) {
      return `🔗 Создайте все ${requiredPairs} пар (у вас ${userPairCount})`
    }
    
    // Count correct pairs
    let correctCount = 0
    userPairs.forEach((userPair) => {
      const { leftIndex, rightIndex } = userPair
      if (leftIndex !== undefined && rightIndex !== undefined && leftIndex === rightIndex) {
        correctCount++
      }
    })
    
    if (correctCount === 0) {
      return '🤔 Ни одна пара не совпадает. Подумайте о логических связях!'
    } else if (correctCount === 1) {
      return `🎯 ${correctCount} пара правильная из ${requiredPairs}. Проверьте остальные!`
    } else {
      return `🎯 ${correctCount} пар правильных из ${requiredPairs}. Почти получилось!`
    }
  }

  // ===================================
  // ANSWER DISPLAY FUNCTIONS
  // ===================================
  
  const getCorrectAnswerDisplay = (exercise) => {
    if (!exercise) return ''

    const exerciseType = exercise.type || 'short-answer'
    
    switch (exerciseType) {
      case 'matching':
        if (exercise.pairs && Array.isArray(exercise.pairs)) {
          return exercise.pairs.map((pair) => {
            let left, right
            
            if (Array.isArray(pair)) {
              left = String(pair[0] || '')
              right = String(pair[1] || '')
            } else if (pair && typeof pair === 'object') {
              left = String(pair.left || pair[0] || pair.question || pair.term || '')
              right = String(pair.right || pair[1] || pair.answer || pair.definition || '')
            } else {
              left = String(pair || '')
              right = 'Unknown'
            }
            
            return `${left} ↔ ${right}`
          }).join('; ')
        }
        return 'Правильные пары показаны выше'

      case 'multiple-choice':
      case 'abc':
        if (typeof exercise.correctAnswer === 'number' && exercise.options) {
          const correctOption = exercise.options[exercise.correctAnswer]
          return typeof correctOption === 'string' ? correctOption : (correctOption?.text || String(correctOption))
        }
        return String(exercise.correctAnswer || '')

      case 'true-false':
        if (typeof exercise.correctAnswer === 'boolean') {
          return exercise.correctAnswer ? 'Правда' : 'Ложь'
        }
        if (typeof exercise.correctAnswer === 'number') {
          return exercise.correctAnswer === 0 ? 'Правда' : 'Ложь'
        }
        return String(exercise.correctAnswer || '')

      case 'ordering':
        if (exercise.items && Array.isArray(exercise.items)) {
          return exercise.items.map((item, index) => 
            `${index + 1}. ${typeof item === 'string' ? item : (item?.text || String(item))}`
          ).join('; ')
        }
        return 'Правильный порядок показан выше'

      case 'fill-blank':
        let correctAnswers = []
        
        if (exercise.blanks && Array.isArray(exercise.blanks)) {
          correctAnswers = exercise.blanks.map(blank => {
            if (typeof blank === 'string') return blank
            return blank?.answer || blank?.text || String(blank)
          })
        } else if (exercise.correctAnswers && Array.isArray(exercise.correctAnswers)) {
          correctAnswers = exercise.correctAnswers
        } else if (exercise.answers && Array.isArray(exercise.answers)) {
          correctAnswers = exercise.answers
        } else if (exercise.hint) {
          correctAnswers = exercise.hint.split(',').map(h => h.trim())
        }
        
        const displayAnswers = correctAnswers
          .map(answer => String(answer || '').trim())
          .filter(answer => answer.length > 0)
        
        return displayAnswers.join(', ')

      case 'drag-drop':
        return 'Правильное размещение показано выше'

      default:
        return String(exercise.correctAnswer || exercise.answer || '')
    }
  }

  // ===================================
  // SUBMISSION FUNCTIONS
  // ===================================
  
  const submitAnswer = (exercise) => {
    console.log('🚀 Submitting answer for:', exercise?.type)
    
    if (!canSubmitAnswer(exercise)) {
      console.warn('⚠️ Cannot submit: answer validation failed')
      return false
    }

    attemptCount.value++
    console.log(`📊 Attempt ${attemptCount.value}/${maxAttempts.value}`)
    
    const isCorrect = validateCurrentAnswer(exercise)
    answerWasCorrect.value = isCorrect
    
    if (isCorrect) {
      confirmation.value = getRandomSuccessMessage()
      showCorrectAnswer.value = false
    } else if (isOnSecondChance.value) {
      if (exercise?.type === 'matching') {
        confirmation.value = getMatchingFeedback(matchingPairs.value, exercise, false)
      } else {
        confirmation.value = getSecondChanceMessage(exercise)
      }
      showCorrectAnswer.value = false
    } else {
      const correctAnswer = getCorrectAnswerDisplay(exercise)
      confirmation.value = getFinalFailureMessage(exercise, correctAnswer)
      showCorrectAnswer.value = true
    }
    
    return isCorrect
  }

  const submitQuizAnswer = (quiz) => {
    console.log('🚀 Submitting quiz answer for:', quiz?.type)
    
    if (!canSubmitAnswer(quiz)) {
      console.warn('⚠️ Cannot submit: quiz answer validation failed')
      return false
    }

    attemptCount.value++
    console.log(`📊 Quiz attempt ${attemptCount.value}/${maxAttempts.value}`)
    
    const isCorrect = validateQuizAnswer(quiz)
    answerWasCorrect.value = isCorrect
    
    if (isCorrect) {
      confirmation.value = getRandomSuccessMessage()
      showCorrectAnswer.value = false
    } else if (isOnSecondChance.value) {
      confirmation.value = getSecondChanceMessage(quiz)
      showCorrectAnswer.value = false
    } else {
      const correctAnswer = getCorrectAnswerDisplay(quiz)
      confirmation.value = getFinalFailureMessage(quiz, correctAnswer)
      showCorrectAnswer.value = true
    }
    
    return isCorrect
  }

  // ===================================
  // EXERCISE NAVIGATION
  // ===================================
  
  const getCurrentExercise = (currentStep) => {
    if (!currentStep || !['exercise', 'practice'].includes(currentStep.type)) {
      return null
    }
    
    let exercises = []
    
    try {
      if (Array.isArray(currentStep.data)) {
        exercises = currentStep.data
      } else if (currentStep.data && Array.isArray(currentStep.data.exercises)) {
        exercises = currentStep.data.exercises
      } else if (currentStep.data && currentStep.data.question) {
        exercises = [currentStep.data]
      }
      
      if (exercises.length === 0) return null
      
      if (currentExerciseIndex.value >= exercises.length) {
        currentExerciseIndex.value = 0
      }
      
      return exercises[currentExerciseIndex.value] || null
      
    } catch (error) {
      console.error('❌ Error in getCurrentExercise:', error)
      return null
    }
  }
  
  const getCurrentQuiz = (currentStep) => {
    if (!currentStep || currentStep.type !== 'quiz') {
      return null
    }
    
    let quizzes = []
    
    try {
      if (Array.isArray(currentStep.data)) {
        quizzes = currentStep.data
      } else if (currentStep.data && Array.isArray(currentStep.data.quizzes)) {
        quizzes = currentStep.data.quizzes
      } else if (currentStep.data && currentStep.data.question) {
        quizzes = [currentStep.data]
      }
      
      if (quizzes.length === 0) return null
      
      if (currentQuizIndex.value >= quizzes.length) {
        currentQuizIndex.value = 0
      }
      
      return quizzes[currentQuizIndex.value] || null
      
    } catch (error) {
      console.error('❌ Error in getCurrentQuiz:', error)
      return null
    }
  }
  
  const getTotalExercises = (currentStep) => {
    if (!currentStep || !['exercise', 'practice'].includes(currentStep.type)) {
      return 0
    }
    
    try {
      let exercises = []
      
      if (Array.isArray(currentStep.data)) {
        exercises = currentStep.data
      } else if (currentStep.data && Array.isArray(currentStep.data.exercises)) {
        exercises = currentStep.data.exercises
      } else if (currentStep.data && currentStep.data.question) {
        exercises = [currentStep.data]
      }
      
      return exercises.length
    } catch (error) {
      console.error('❌ Error in getTotalExercises:', error)
      return 0
    }
  }
  
  const getTotalQuizzes = (currentStep) => {
    if (!currentStep || currentStep.type !== 'quiz') {
      return 0
    }
    
    try {
      let quizzes = []
      
      if (Array.isArray(currentStep.data)) {
        quizzes = currentStep.data
      } else if (currentStep.data && Array.isArray(currentStep.data.quizzes)) {
        quizzes = currentStep.data.quizzes
      } else if (currentStep.data && currentStep.data.question) {
        quizzes = [currentStep.data]
      }
      
      return quizzes.length
    } catch (error) {
      console.error('❌ Error in getTotalQuizzes:', error)
      return 0
    }
  }
  
  const isLastExercise = (currentStep) => {
    const totalExercises = getTotalExercises(currentStep)
    return currentExerciseIndex.value >= totalExercises - 1
  }
  
  const isLastQuiz = (currentStep) => {
    const totalQuizzes = getTotalQuizzes(currentStep)
    return currentQuizIndex.value >= totalQuizzes - 1
  }
  
  const goToNextExercise = (currentStep, onNextStep) => {
    console.log('➡️ Going to next exercise')
    
    if (isLastExercise(currentStep)) {
      console.log('✅ Last exercise completed, moving to next step')
      resetExerciseState()
      onNextStep()
    } else {
      console.log('🔄 Moving to next exercise in current step')
      currentExerciseIndex.value++
      resetExerciseAnswers()
      initializeCurrentExerciseData(getCurrentExercise(currentStep))
    }
  }
  
  const goToNextQuiz = (currentStep, onNextStep) => {
    console.log('➡️ Going to next quiz')
    
    if (isLastQuiz(currentStep)) {
      console.log('✅ Last quiz completed, moving to next step')
      resetExerciseState()
      onNextStep()
    } else {
      console.log('🔄 Moving to next quiz in current step')
      currentQuizIndex.value++
      resetExerciseAnswers()
    }
  }

  // ===================================
  // INITIALIZATION FUNCTIONS
  // ===================================
  
  const initializeCurrentExerciseData = (exercise) => {
    if (!exercise) return
    
    console.log('🔧 Initializing exercise data for type:', exercise.type)
    
    switch (exercise.type) {
      case 'fill-blank':
        initializeFillBlankAnswers(exercise)
        break
      case 'ordering':
        initializeOrderingItems(exercise)
        break
      case 'drag-drop':
        initializeDragDropItems(exercise)
        break
      case 'matching':
        initializeMatchingItems()
        break
    }
  }
  
  const initializeFillBlankAnswers = (exercise) => {
    if (!exercise) {
      fillBlankAnswers.value = []
      return
    }
    
    let blankCount = 0
    
    if (exercise.blanks && Array.isArray(exercise.blanks)) {
      blankCount = exercise.blanks.length
    } else {
      const template = exercise.template || exercise.question || ''
      
      const underscoreMatches = template.match(/_+/g) || []
      const blankMatches = template.match(/\[blank\]/gi) || []
      const curlyBraceMatches = template.match(/\{[^}]*\}/g) || []
      
      blankCount = Math.max(
        underscoreMatches.length, 
        blankMatches.length, 
        curlyBraceMatches.length
      )
    }
    
    fillBlankAnswers.value = new Array(Math.max(1, blankCount)).fill('')
    console.log(`✅ Initialized ${fillBlankAnswers.value.length} fill-blank answers`)
  }
  
  const initializeOrderingItems = (exercise) => {
    if (!exercise || exercise.type !== 'ordering' || !exercise.items) {
      orderingItems.value = []
      return
    }
    
    const items = Array.isArray(exercise.items) ? exercise.items : []
    orderingItems.value = items.map((item, index) => ({
      id: `item_${index}_${Date.now()}`,
      text: typeof item === 'string' ? item : (item?.text || String(item)),
      originalIndex: index
    }))
    
    shuffleArray(orderingItems.value)
    console.log('✅ Initialized ordering items:', orderingItems.value.length)
  }
  
  const initializeDragDropItems = (exercise) => {
    // Clear existing placements
    Object.keys(dragDropPlacements).forEach(key => {
      delete dragDropPlacements[key]
    })
    
    availableDragItems.value = []
    dropZones.value = []
    
    if (!exercise || exercise.type !== 'drag-drop') {
      return
    }
    
    // Initialize drag items
    if (exercise.dragItems && Array.isArray(exercise.dragItems)) {
      availableDragItems.value = exercise.dragItems.map(item => {
        if (typeof item === 'string') {
          return { text: item, id: item }
        } else if (item && item.text) {
          return item
        } else {
          return { text: String(item), id: String(item) }
        }
      })
    }
    
    // Initialize drop zones
    if (exercise.dropZones && Array.isArray(exercise.dropZones)) {
      dropZones.value = exercise.dropZones.map(zone => {
        if (typeof zone === 'string') {
          return { label: zone, id: zone, correctItems: [] }
        } else if (zone && zone.label) {
          return {
            label: zone.label,
            id: zone.id || zone.label,
            correctItems: zone.correctItems || zone.items || []
          }
        } else {
          return { label: String(zone), id: String(zone), correctItems: [] }
        }
      })
      
      // Initialize empty arrays for each zone
      dropZones.value.forEach(zone => {
        dragDropPlacements[zone.id] = []
      })
    }
    
    console.log('✅ Initialized drag-drop items')
  }
  
  const initializeMatchingItems = () => {
    console.log('🔗 Initializing matching items')
    matchingPairs.value = []
    selectedMatchingItem.value = null
  }

  // ===================================
  // UPDATE FUNCTIONS
  // ===================================
  
  const updateUserAnswer = (newAnswer, exercise) => {
    console.log('📝 Updating user answer:', newAnswer, 'for type:', exercise?.type)
    
    if (!exercise) {
      userAnswer.value = newAnswer
      return
    }

    switch (exercise.type) {
      case 'matching':
        matchingPairs.value = newAnswer || []
        userAnswer.value = newAnswer || []
        break
      case 'ordering':
        orderingItems.value = newAnswer || []
        userAnswer.value = newAnswer || []
        break
      case 'fill-blank':
        // Fill blank is updated separately via updateFillBlankAnswer
        break
      default:
        userAnswer.value = newAnswer
    }
  }

  const updateFillBlankAnswer = (index, value) => {
    if (!Array.isArray(fillBlankAnswers.value)) {
      fillBlankAnswers.value = []
    }
    
    while (fillBlankAnswers.value.length <= index) {
      fillBlankAnswers.value.push('')
    }
    
    const newValue = typeof value === 'object' && value?.target ? value.target.value : value
    fillBlankAnswers.value[index] = newValue || ''
    fillBlankAnswers.value = [...fillBlankAnswers.value]
    
    console.log(`📝 Updated blank ${index + 1}:`, newValue)
  }

  const getCurrentUserAnswer = () => {
    return userAnswer.value || fillBlankAnswers.value || matchingPairs.value || orderingItems.value
  }

  // ===================================
  // INTERACTION HANDLERS
  // ===================================
  
  const handleMatchingSelection = (selection) => {
    console.log('🎯 Handle matching selection:', selection)
    selectedMatchingItem.value = selection
  }

  const removeMatchingPair = (pairIndex) => {
    console.log('🗑️ Remove matching pair:', pairIndex)
    
    if (pairIndex >= 0 && pairIndex < matchingPairs.value.length) {
      const updatedPairs = matchingPairs.value.filter((_, index) => index !== pairIndex)
      matchingPairs.value = updatedPairs
      userAnswer.value = updatedPairs
    }
  }

  // ===================================
  // DRAG AND DROP HANDLERS
  // ===================================
  
  const handleDragItemStart = ({ item, event }) => {
    console.log('🔥 Starting drag for item:', item)
    draggedDragItem.value = item
  }

  const handleDragOverZone = (zoneId) => {
    console.log('🔥 Drag over zone:', zoneId)
    dropOverZone.value = zoneId
  }

  const handleDragLeaveZone = () => {
    console.log('🔥 Drag leave zone')
    dropOverZone.value = null
  }

  const handleDropInZone = ({ zoneId, item }) => {
    console.log('🔥 Drop in zone:', zoneId, 'item:', item)
    
    if (!dragDropPlacements[zoneId]) {
      dragDropPlacements[zoneId] = []
    }
    
    const itemText = typeof item === 'string' ? item : (item?.text || item?.label || String(item))
    
    // Remove item from other zones first
    Object.keys(dragDropPlacements).forEach(otherZoneId => {
      if (otherZoneId !== zoneId && Array.isArray(dragDropPlacements[otherZoneId])) {
        dragDropPlacements[otherZoneId] = dragDropPlacements[otherZoneId].filter(placedItem => {
          const placedText = typeof placedItem === 'string' ? placedItem : (placedItem?.text || placedItem?.label || String(placedItem))
          return placedText !== itemText
        })
      }
    })
    
    // Check if item already in target zone
    const isAlreadyInZone = dragDropPlacements[zoneId].some(placedItem => {
      const placedText = typeof placedItem === 'string' ? placedItem : (placedItem?.text || placedItem?.label || String(placedItem))
      return placedText === itemText
    })
    
    if (!isAlreadyInZone) {
      dragDropPlacements[zoneId].push(item)
    }
    
    // Clean up drag state
    draggedDragItem.value = null
    dropOverZone.value = null
  }

  const handleRemoveDroppedItem = ({ zoneId, itemIndex, item }) => {
    console.log('🗑️ Removing dropped item:', { zoneId, itemIndex, item })
    
    if (dragDropPlacements[zoneId] && dragDropPlacements[zoneId][itemIndex]) {
      dragDropPlacements[zoneId].splice(itemIndex, 1)
    }
  }

  // ===================================
  // HINT SYSTEM
  // ===================================
  
  const showHint = () => {
    currentHint.value = "Внимательно прочитайте вопрос и подумайте о правильном ответе."
  }

  const clearSmartHint = () => {
    smartHint.value = ''
  }

  const setSmartHint = (hint) => {
    smartHint.value = hint
  }

  // ===================================
  // RESET FUNCTIONS
  // ===================================
  
  const resetExerciseState = () => {
    console.log('🔄 Reset exercise state')
    currentExerciseIndex.value = 0
    currentQuizIndex.value = 0
    resetExerciseAnswers()
    resetExerciseData()
    resetAttemptState()
  }
  
  const resetExerciseAnswers = () => {
    console.log('🧹 Reset exercise answers')
    userAnswer.value = ''
    confirmation.value = ''
    answerWasCorrect.value = false
    currentHint.value = ''
    smartHint.value = ''
    resetAttemptState()
  }

  const resetAttemptState = () => {
    console.log('🔄 Reset attempt state')
    attemptCount.value = 0
    showCorrectAnswer.value = false
  }
  
  const resetExerciseData = () => {
    console.log('🗑️ Reset exercise data')
    fillBlankAnswers.value = []
    matchingPairs.value = []
    selectedMatchingItem.value = null
    orderingItems.value = []
    availableDragItems.value = []
    dropZones.value = []
    
    Object.keys(dragDropPlacements).forEach(key => {
      delete dragDropPlacements[key]
    })
  }

  // ===================================
  // HELPER FUNCTIONS
  // ===================================
  
  const getCurrentExerciseType = (exercise) => {
    return exercise?.type || 'short-answer'
  }
  
  const getFormattedFillBlankTemplate = (exercise) => {
    if (!exercise || exercise.type !== 'fill-blank') {
      return ''
    }
    
    const template = exercise.template || exercise.question || ''
    let blankIndex = 0
    
    return template
      .replace(/\[blank\]/gi, () => `<input data-blank-index="${blankIndex++}">`)
      .replace(/_+/g, () => `<input data-blank-index="${blankIndex++}">`)
      .replace(/\{[^}]*\}/g, () => `<input data-blank-index="${blankIndex++}">`)
  }

  const getLeftItemsArray = (exercise) => {
    if (!exercise?.pairs) return []
    const pairs = exercise.pairs
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
  }
  
  const getRightItemsArray = (exercise) => {
    if (!exercise?.pairs) return []
    const pairs = exercise.pairs
    if (Array.isArray(pairs)) {
      return pairs.map((pair) => {
        if (Array.isArray(pair)) return String(pair[1] || '')
        if (pair && typeof pair === 'object') {
          return String(pair.right || pair[1] || pair.answer || pair.definition || '')
        }
        return String(pair || '')
      }).filter(item => item.trim() !== '')
    }
    return []
  }

  // ===================================
  // RETURN API
  // ===================================

  return {
    // State
    currentExerciseIndex,
    currentQuizIndex,
    userAnswer,
    confirmation,
    answerWasCorrect,
    currentHint,
    smartHint,
    fillBlankAnswers,
    matchingPairs,
    selectedMatchingItem,
    orderingItems,
    dragDropPlacements,
    availableDragItems,
    dropZones,
    draggedDragItem,
    dropOverZone,
    attemptCount,
    maxAttempts,
    showCorrectAnswer,
    
    // Computed
    isOnSecondChance,
    
    // Core Exercise Methods
    getCurrentExercise,
    getCurrentQuiz,
    getTotalExercises,
    getTotalQuizzes,
    isLastExercise,
    isLastQuiz,
    goToNextExercise,
    goToNextQuiz,
    
    // Validation Methods
    validateCurrentAnswer,
    validateQuizAnswer,
    validateShortAnswer,
    validateMultipleChoice,
    validateTrueFalse,
    validateFillBlank,
    validateMatching,
    validateOrdering,
    validateDragDrop,
    
    // Submission Methods
    canSubmitAnswer,
    submitAnswer,
    submitQuizAnswer,
    
    // Initialization Methods
    initializeCurrentExerciseData,
    initializeFillBlankAnswers,
    initializeOrderingItems,
    initializeDragDropItems,
    initializeMatchingItems,
    
    // Update Methods
    updateUserAnswer,
    updateFillBlankAnswer,
    getCurrentUserAnswer,
    
    // Interaction Handlers
    handleMatchingSelection,
    removeMatchingPair,
    handleDragItemStart,
    handleDragOverZone,
    handleDragLeaveZone,
    handleDropInZone,
    handleRemoveDroppedItem,
    
    // Display Methods
    getCorrectAnswerDisplay,
    getMatchingFeedback,
    getRandomSuccessMessage,
    getSecondChanceMessage,
    getFinalFailureMessage,
    
    // Hint System
    showHint,
    clearSmartHint,
    setSmartHint,
    
    // Reset Methods
    resetExerciseState,
    resetExerciseAnswers,
    resetExerciseData,
    resetAttemptState,
    
    // Helper Methods
    getCurrentExerciseType,
    getFormattedFillBlankTemplate,
    getLeftItemsArray,
    getRightItemsArray,
    calculateSimilarity,
    levenshteinDistance,
    getCorrectAnswersArray,
    shuffleArray
  }
}