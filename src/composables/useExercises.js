// src/composables/useExercises.js - COMPLETE EXERCISE LOGIC WITH FIXED DRAG & DROP
import { ref, reactive, computed } from 'vue'

export function useExercises() {
  // ✅ Exercise state
  const currentExerciseIndex = ref(0)
  const currentQuizIndex = ref(0)
  const userAnswer = ref('')
  const confirmation = ref('')
  const answerWasCorrect = ref(false)
  const currentHint = ref('')
  const smartHint = ref('')
  
  // ✅ Exercise type data
  const fillBlankAnswers = ref([])
  const matchingPairs = ref([])
  const selectedMatchingItem = ref(null)
  const orderingItems = ref([])
  const dragDropPlacements = reactive({})
  const availableDragItems = ref([])
  const dropZones = ref([])
  
  // ✅ Drag and drop state
  const draggedDragItem = ref(null)
  const dropOverZone = ref(null)
  const draggedItem = ref(null)
  const dropTarget = ref(null)

  // ==========================================
  // 🔥 VALIDATION FUNCTIONS
  // ==========================================
  
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

  const validateShortAnswer = (userAnswer, exercise) => {
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
      
      if (correctAnswerTrimmed.length > 3) {
        const similarity = calculateSimilarity(userAnswerTrimmed, correctAnswerTrimmed)
        return similarity > 0.8
      }
      
      return false
    })
  }

  const validateMultipleChoice = (userAnswer, exercise) => {
    const correctAnswer = exercise.correctAnswer

    if (typeof correctAnswer === 'number') {
      if (typeof userAnswer === 'number') {
        return userAnswer === correctAnswer
      }
      
      if (exercise.options && Array.isArray(exercise.options)) {
        const userIndex = exercise.options.findIndex(option => {
          const optionText = typeof option === 'string' ? option : (option?.text || String(option))
          return optionText === userAnswer
        })
        return userIndex === correctAnswer
      }
    }

    if (typeof correctAnswer === 'string') {
      if (typeof userAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      }
      
      if (typeof userAnswer === 'number' && exercise.options) {
        const selectedOption = exercise.options[userAnswer]
        const selectedText = typeof selectedOption === 'string' ? selectedOption : (selectedOption?.text || String(selectedOption))
        return selectedText.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      }
    }

    return false
  }

  const validateTrueFalse = (userAnswer, exercise) => {
    const correctAnswer = exercise.correctAnswer

    if (typeof correctAnswer === 'boolean') {
      if (typeof userAnswer === 'boolean') {
        return userAnswer === correctAnswer
      }
      if (typeof userAnswer === 'string') {
        const userBool = userAnswer.toLowerCase() === 'true'
        return userBool === correctAnswer
      }
      if (typeof userAnswer === 'number') {
        const userBool = userAnswer === 0
        return userBool === correctAnswer
      }
    }

    if (typeof correctAnswer === 'number') {
      if (typeof userAnswer === 'number') {
        return userAnswer === correctAnswer
      }
      if (typeof userAnswer === 'string') {
        if (userAnswer.toLowerCase() === 'true') {
          return correctAnswer === 0
        }
        if (userAnswer.toLowerCase() === 'false') {
          return correctAnswer === 1
        }
      }
    }

    if (typeof correctAnswer === 'string') {
      if (typeof userAnswer === 'string') {
        return userAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }
    }

    return false
  }

  const validateFillBlank = (userAnswers, exercise) => {
    if (!Array.isArray(userAnswers)) {
      userAnswers = fillBlankAnswers.value
    }

    if (!Array.isArray(userAnswers)) {
      return false
    }

    let correctAnswers = []
    
    if (exercise.blanks && Array.isArray(exercise.blanks)) {
      correctAnswers = exercise.blanks.map(blank => {
        if (typeof blank === 'string') {
          return blank
        } else if (blank && blank.answer) {
          return blank.answer
        } else if (blank && blank.text) {
          return blank.text
        } else {
          return String(blank)
        }
      })
    } else if (exercise.correctAnswers && Array.isArray(exercise.correctAnswers)) {
      correctAnswers = exercise.correctAnswers
    } else if (exercise.answers && Array.isArray(exercise.answers)) {
      correctAnswers = exercise.answers
    } else {
      const hint = exercise.hint || ''
      if (hint.includes(',')) {
        correctAnswers = hint.split(',').map(h => h.trim())
      } else {
        correctAnswers = [hint]
      }
    }
    
    const finalCorrectAnswers = correctAnswers.map(answer => {
      if (typeof answer === 'string') {
        return answer.trim()
      } else if (typeof answer === 'object' && answer !== null) {
        return answer.answer || answer.text || answer.value || answer.correct || String(answer)
      } else {
        return String(answer || '').trim()
      }
    }).filter(answer => answer && answer.trim())

    if (finalCorrectAnswers.length === 0) {
      return false
    }

    let correctCount = 0
    for (let i = 0; i < finalCorrectAnswers.length; i++) {
      const userAnswerItem = String(userAnswers[i] || '').trim().toLowerCase()
      const correctAnswer = finalCorrectAnswers[i]

      if (!userAnswerItem || !correctAnswer) {
        continue
      }

      let isCorrect = false

      if (Array.isArray(correctAnswer)) {
        isCorrect = correctAnswer.some(answer => {
          const answerText = String(answer || '').trim().toLowerCase()
          return answerText === userAnswerItem
        })
      } else {
        const correctText = String(correctAnswer || '').trim().toLowerCase()
        isCorrect = userAnswerItem === correctText
        
        if (!isCorrect && correctText.length > 3) {
          const similarity = calculateSimilarity(userAnswerItem, correctText)
          isCorrect = similarity > 0.85
        }
      }

      if (isCorrect) {
        correctCount++
      }
    }

    return correctCount === finalCorrectAnswers.length
  }

  const validateMatching = (userPairs, exercise) => {
    if (!Array.isArray(userPairs)) {
      userPairs = matchingPairs.value
    }

    console.log('🔗 Validating matching exercise')
    
    if (!Array.isArray(userPairs) || userPairs.length === 0) {
      console.log('❌ No user pairs provided')
      return false
    }

    const exercisePairs = exercise.pairs || []
    if (!Array.isArray(exercisePairs) || exercisePairs.length === 0) {
      console.log('❌ No exercise pairs found')
      return false
    }

    if (userPairs.length !== exercisePairs.length) {
      console.log(`❌ Incomplete: ${userPairs.length}/${exercisePairs.length} pairs`)
      return false
    }

    let correctCount = 0
    
    for (let i = 0; i < userPairs.length; i++) {
      const userPair = userPairs[i]
      
      if (!userPair || typeof userPair !== 'object') {
        console.log(`❌ Invalid pair at index ${i}:`, userPair)
        continue
      }

      const leftIndex = userPair.leftIndex
      const rightIndex = userPair.rightIndex

      console.log(`🔍 Checking pair ${i}: leftIndex=${leftIndex}, rightIndex=${rightIndex}`)

      if (leftIndex === rightIndex) {
        correctCount++
        console.log(`✅ CORRECT: Index ${leftIndex} matches ${rightIndex}`)
      } else {
        console.log(`❌ WRONG: Index ${leftIndex} does not match ${rightIndex}`)
      }
    }

    const isValid = correctCount === exercisePairs.length
    console.log(`🎯 Validation result: ${correctCount}/${exercisePairs.length} correct = ${isValid}`)
    
    return isValid
  }

  const validateOrdering = (userItems, exercise) => {
    if (!Array.isArray(userItems)) {
      userItems = userAnswer.value || orderingItems.value
    }

    console.log('🔄 Validating ordering exercise:', {
      userItems: userItems,
      exerciseItems: exercise.items,
      userItemsCount: Array.isArray(userItems) ? userItems.length : 0,
      exerciseItemsCount: Array.isArray(exercise.items) ? exercise.items.length : 0
    })
    
    if (!Array.isArray(userItems) || userItems.length === 0) {
      console.log('❌ No user items provided')
      return false
    }

    const correctItems = exercise.items || []
    if (!Array.isArray(correctItems) || correctItems.length === 0) {
      console.log('❌ No correct items found in exercise')
      return false
    }

    if (userItems.length !== correctItems.length) {
      console.log(`❌ Length mismatch: user=${userItems.length}, correct=${correctItems.length}`)
      return false
    }

    let correctCount = 0
    for (let i = 0; i < correctItems.length; i++) {
      const userItem = userItems[i]
      const correctItem = correctItems[i]
      
      const userText = typeof userItem === 'string' ? userItem : 
                      (userItem?.text || userItem?.id || String(userItem))
      const correctText = typeof correctItem === 'string' ? correctItem : 
                         (correctItem?.text || correctItem?.id || String(correctItem))
      
      console.log(`  Comparing position ${i}: "${userText}" vs "${correctText}"`)
      
      if (userText.trim().toLowerCase() === correctText.trim().toLowerCase()) {
        correctCount++
        console.log(`    ✅ Match at position ${i}`)
      } else {
        console.log(`    ❌ No match at position ${i}`)
      }
    }

    const isValid = correctCount === correctItems.length
    console.log(`🎯 Ordering validation result: ${correctCount}/${correctItems.length} correct = ${isValid}`)
    
    return isValid
  }

  // 🔥 FIXED: Enhanced Drag & Drop Validation
  const validateDragDrop = (userPlacements, exercise) => {
    if (!userPlacements || typeof userPlacements !== 'object') {
      userPlacements = dragDropPlacements
    }

    console.log('🔄 Validating drag-drop exercise:', {
      userPlacements,
      exercise: exercise.dropZones
    })

    let dropZonesArray = []
    
    if (Array.isArray(exercise.dropZones)) {
      dropZonesArray = exercise.dropZones
    } else if (exercise.dropZones && typeof exercise.dropZones === 'object') {
      dropZonesArray = Object.values(exercise.dropZones).filter(zone => 
        zone && (zone.label || zone.id)
      )
    } else {
      console.log('❌ No drop zones found in exercise')
      return false
    }

    let correctCount = 0
    let totalRequired = 0

    for (const zone of dropZonesArray) {
      const zoneId = zone.id || zone.label || String(zone)
      const userItems = userPlacements[zoneId] || []
      
      let correctItems = []
      if (Array.isArray(zone.correctItems)) {
        correctItems = zone.correctItems
      } else if (Array.isArray(zone.items)) {
        correctItems = zone.items
      } else if (zone.correctItem !== undefined) {
        if (typeof zone.correctItem === 'number' && exercise.dragItems) {
          const dragItems = Array.isArray(exercise.dragItems) ? exercise.dragItems : Object.values(exercise.dragItems)
          correctItems = [dragItems[zone.correctItem]]
        } else {
          correctItems = [zone.correctItem]
        }
      }

      totalRequired += correctItems.length

      console.log(`🎯 Zone "${zoneId}": ${userItems.length} user items, ${correctItems.length} required items`)

      for (const correctItem of correctItems) {
        const correctText = typeof correctItem === 'string' ? correctItem : (correctItem?.text || correctItem?.label || String(correctItem))
        
        const isItemPresent = userItems.some(userItem => {
          const userText = typeof userItem === 'string' ? userItem : (userItem?.text || userItem?.label || String(userItem))
          const match = userText.trim().toLowerCase() === correctText.trim().toLowerCase()
          console.log(`  Checking: "${userText}" vs "${correctText}" = ${match}`)
          return match
        })

        if (isItemPresent) {
          correctCount++
          console.log(`  ✅ Found correct item: "${correctText}"`)
        } else {
          console.log(`  ❌ Missing item: "${correctText}"`)
        }
      }
    }

    const isValid = correctCount === totalRequired && totalRequired > 0
    console.log(`🎯 Drag-drop validation: ${correctCount}/${totalRequired} correct = ${isValid}`)
    
    return isValid
  }

  // ==========================================
  // 🔥 UNIFIED VALIDATION METHOD
  // ==========================================
  
  const validateCurrentAnswer = (exercise) => {
    if (!exercise) return false

    const exerciseType = exercise.type || 'short-answer'
    
    console.log(`🔍 Validating ${exerciseType} exercise`)

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
        return validateOrdering(userAnswer.value || orderingItems.value, exercise)
      case 'drag-drop':
        return validateDragDrop(dragDropPlacements, exercise)
      default:
        return validateShortAnswer(userAnswer.value, exercise)
    }
  }

  const validateQuizAnswer = (quiz) => {
    if (!quiz) return false

    const quizType = quiz.type || 'multiple-choice'

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

  // ==========================================
  // 🔥 ANSWER DISPLAY METHODS
  // ==========================================
  
  const getCorrectAnswerDisplay = (exercise) => {
    if (!exercise) return ''

    const exerciseType = exercise.type || 'short-answer'
    
    switch (exerciseType) {
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
            if (typeof blank === 'string') {
              return blank
            } else if (blank && blank.answer) {
              return blank.answer
            } else if (blank && blank.text) {
              return blank.text
            } else {
              return String(blank)
            }
          })
        } else if (exercise.correctAnswers && Array.isArray(exercise.correctAnswers)) {
          correctAnswers = exercise.correctAnswers
        } else if (exercise.answers && Array.isArray(exercise.answers)) {
          correctAnswers = exercise.answers
        } else if (exercise.hint) {
          correctAnswers = exercise.hint.split(',').map(h => h.trim())
        }
        
        const displayAnswers = correctAnswers.map(answer => {
          if (typeof answer === 'string') {
            return answer.trim()
          } else if (typeof answer === 'object' && answer !== null) {
            return answer.answer || answer.text || answer.value || answer.correct || String(answer)
          } else {
            return String(answer || '').trim()
          }
        }).filter(answer => answer && answer.trim())
        
        return displayAnswers.join(', ')

      case 'drag-drop':
        return 'Правильное размещение показано выше'

      default:
        return String(exercise.correctAnswer || exercise.answer || '')
    }
  }

  // ==========================================
  // 🔥 MESSAGE METHODS
  // ==========================================
  
  const getSecondChanceMessage = (exercise) => {
    const messages = [
      '🤔 Не совсем правильно. У вас есть ещё одна попытка!',
      '💭 Подумайте ещё немного. Попробуйте снова!',
      '🎯 Почти попали! Ещё одна попытка!',
      '🔍 Внимательнее! У вас есть вторая попытка!',
      '📚 Перечитайте материал и попробуйте ещё раз!',
      '⚡ Не сдавайтесь! Попробуйте другой вариант!'
    ]
    
    let message = messages[Math.floor(Math.random() * messages.length)]
    
    if (exercise) {
      switch (exercise.type) {
        case 'fill-blank':
          message += ' Проверьте правописание и попробуйте синонимы.'
          break
        case 'matching':
          message += ' Подумайте о логических связях между элементами.'
          break
        case 'multiple-choice':
          message += ' Внимательно прочитайте все варианты.'
          break
        case 'drag-drop':
          message += ' Попробуйте другое размещение элементов.'
          break
        case 'true-false':
          message += ' Подумайте о правильности утверждения.'
          break
        case 'ordering':
          message += ' Проверьте правильность последовательности.'
          break
      }
    }
    
    return message
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

  // ==========================================
  // 🔥 UNIFIED ANSWER UPDATE METHOD
  // ==========================================
  
  const updateUserAnswer = (newAnswer, exercise) => {
    console.log('📝 Updating user answer:', newAnswer, 'for exercise type:', exercise?.type)
    
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
        // fillBlankAnswers updated separately
        break
      default:
        userAnswer.value = newAnswer
    }
  }

  const getCurrentUserAnswer = () => {
    // Return the appropriate answer based on current exercise type
    return userAnswer.value || fillBlankAnswers.value || matchingPairs.value || orderingItems.value
  }

  // ==========================================
  // 🔥 INTERACTION HANDLERS
  // ==========================================
  
  const handleMatchingSelection = (selection) => {
    selectedMatchingItem.value = selection
  }

  const removeMatchingPair = (pairIndex) => {
    if (pairIndex >= 0 && pairIndex < matchingPairs.value.length) {
      const updatedPairs = matchingPairs.value.filter((_, index) => index !== pairIndex)
      matchingPairs.value = updatedPairs
      userAnswer.value = updatedPairs
      console.log('✅ Pair removed, updated pairs:', updatedPairs)
    } else {
      console.warn('⚠️ Invalid pair index for removal:', pairIndex)
    }
  }

  // ==========================================
  // 🔥 FIXED: DRAG AND DROP HANDLERS
  // ==========================================
  
  const handleDragItemStart = ({ item, event }) => {
    console.log('🔥 useExercises: Starting drag for item:', item)
    draggedDragItem.value = item
  }

  const handleDragOverZone = (zoneId) => {
    console.log('🔥 useExercises: Drag over zone:', zoneId)
    dropOverZone.value = zoneId
  }

  const handleDragLeaveZone = () => {
    console.log('🔥 useExercises: Drag leave zone')
    dropOverZone.value = null
  }

  const handleDropInZone = ({ zoneId, item }) => {
    console.log('🔥 useExercises: Drop in zone:', zoneId, 'item:', item)
    
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
    
    console.log('✅ Updated dragDropPlacements:', JSON.parse(JSON.stringify(dragDropPlacements)))
    
    // Clean up drag state
    draggedDragItem.value = null
    dropOverZone.value = null
  }

  const handleRemoveDroppedItem = ({ zoneId, itemIndex, item }) => {
    console.log('🗑️ useExercises: Removing dropped item:', { zoneId, itemIndex, item })
    
    if (!dragDropPlacements || 
        !dragDropPlacements[zoneId] || 
        !dragDropPlacements[zoneId][itemIndex]) {
      console.warn('⚠️ Invalid removal request')
      return
    }
    
    dragDropPlacements[zoneId].splice(itemIndex, 1)
    
    console.log('✅ Item removed, updated placements:', JSON.parse(JSON.stringify(dragDropPlacements)))
  }

  // ==========================================
  // 🔥 HINT SYSTEM
  // ==========================================
  
  const showHint = () => {
    currentHint.value = "Внимательно прочитайте вопрос и подумайте о правильном ответе."
  }

  const clearSmartHint = () => {
    smartHint.value = ''
  }

  const setSmartHint = (hint) => {
    smartHint.value = hint
  }

  // ==========================================
  // EXISTING METHODS (kept as-is)
  // ==========================================
  
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
    if (isLastExercise(currentStep)) {
      resetExerciseState()
      onNextStep()
    } else {
      currentExerciseIndex.value++
      resetExerciseAnswers()
      initializeCurrentExerciseData(getCurrentExercise(currentStep))
    }
  }
  
  const goToNextQuiz = (currentStep, onNextStep) => {
    if (isLastQuiz(currentStep)) {
      resetExerciseState()
      onNextStep()
    } else {
      currentQuizIndex.value++
      resetExerciseAnswers()
    }
  }
  
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
      console.log('📝 Found explicit blanks array:', blankCount)
    } else {
      const template = exercise.template || exercise.question || ''
      console.log('📝 Parsing template for blanks:', template)
      
      const underscoreMatches = template.match(/_+/g) || []
      const blankMatches = template.match(/\[blank\]/gi) || []
      const curlyBraceMatches = template.match(/\{[^}]*\}/g) || []
      
      blankCount = Math.max(
        underscoreMatches.length, 
        blankMatches.length, 
        curlyBraceMatches.length
      )
      
      console.log('📝 Found blanks - underscores:', underscoreMatches.length, 'blank tags:', blankMatches.length, 'curly braces:', curlyBraceMatches.length)
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
  
  // 🔥 FIXED: Enhanced Drag Drop Initialization
  const initializeDragDropItems = (exercise) => {
    // Clear existing placements
    Object.keys(dragDropPlacements).forEach(key => {
      delete dragDropPlacements[key]
    })
    
    availableDragItems.value = []
    dropZones.value = []
    
    if (!exercise || exercise.type !== 'drag-drop') {
      console.log('✅ Initialized empty drag-drop items')
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
    
    console.log('✅ Initialized drag-drop items:', {
      dragItems: availableDragItems.value.length,
      dropZones: dropZones.value.length,
      placements: Object.keys(dragDropPlacements)
    })
  }
  
  const initializeMatchingItems = () => {
    matchingPairs.value = []
    selectedMatchingItem.value = null
    console.log('✅ Initialized matching items')
  }
  
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
        const hasAnswers = Array.isArray(fillBlankAnswers.value) && fillBlankAnswers.value.length > 0
        const hasFilledAnswers = hasAnswers && fillBlankAnswers.value.some(answer => 
          answer && typeof answer === 'string' && answer.trim().length > 0
        )
        return hasFilledAnswers
        
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
    
    console.log(`📝 Updated blank ${index + 1}:`, newValue, 'All answers:', fillBlankAnswers.value)
  }
  
  const resetExerciseState = () => {
    currentExerciseIndex.value = 0
    currentQuizIndex.value = 0
    resetExerciseAnswers()
    resetExerciseData()
  }
  
  const resetExerciseAnswers = () => {
    userAnswer.value = ''
    confirmation.value = ''
    answerWasCorrect.value = false
    currentHint.value = ''
    smartHint.value = ''
  }
  
  const resetExerciseData = () => {
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
  
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }
  
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
    draggedItem,
    dropTarget,
    
    // Core Methods
    getCurrentExercise,
    getCurrentQuiz,
    getTotalExercises,
    getTotalQuizzes,
    isLastExercise,
    isLastQuiz,
    goToNextExercise,
    goToNextQuiz,
    initializeCurrentExerciseData,
    initializeFillBlankAnswers,
    initializeOrderingItems,
    initializeDragDropItems,
    initializeMatchingItems,
    canSubmitAnswer,
    resetExerciseState,
    resetExerciseAnswers,
    resetExerciseData,
    updateFillBlankAnswer,
    getCurrentExerciseType,
    getFormattedFillBlankTemplate,
    
    // 🔥 FIXED: Validation Methods
    validateCurrentAnswer,
    validateQuizAnswer,
    validateShortAnswer,
    validateMultipleChoice,
    validateTrueFalse,
    validateFillBlank,
    validateMatching,
    validateOrdering,
    validateDragDrop,
    
    // 🔥 FIXED: Display Methods
    getCorrectAnswerDisplay,
    getSecondChanceMessage,
    getFinalFailureMessage,
    getRandomSuccessMessage,
    
    // 🔥 FIXED: Interaction Methods
    updateUserAnswer,
    getCurrentUserAnswer,
    handleMatchingSelection,
    removeMatchingPair,
    
    // 🔥 FIXED: Drag and Drop Methods
    handleDragItemStart,
    handleDragOverZone,
    handleDragLeaveZone,
    handleDropInZone,
    handleRemoveDroppedItem,
    
    // 🔥 FIXED: Hint Methods
    showHint,
    clearSmartHint,
    setSmartHint,
    
    // Helper Methods
    calculateSimilarity,
    levenshteinDistance,
    getCorrectAnswersArray
  }
}