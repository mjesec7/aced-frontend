// src/composables/useExercises.js - FIXED VERSION
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
  
  // ✅ Drag and drop state
  const draggedDragItem = ref(null)
  const dropOverZone = ref(null)
  const draggedItem = ref(null)
  const dropTarget = ref(null)
  
  // ✅ Get current exercise/quiz
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
  
  // ✅ Exercise counts
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
  
  // ✅ Exercise navigation
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
  
  // ✅ Exercise initialization - FIXED
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
        initializeDragDropItems()
        break
      case 'matching':
        initializeMatchingItems()
        break
    }
  }
  
  // ✅ FIXED - Fill blank initialization
  const initializeFillBlankAnswers = (exercise) => {
    if (!exercise) {
      fillBlankAnswers.value = []
      return
    }
    
    let blankCount = 0
    
    // Check for explicit blanks array first
    if (exercise.blanks && Array.isArray(exercise.blanks)) {
      blankCount = exercise.blanks.length
      console.log('📝 Found explicit blanks array:', blankCount)
    } else {
      // Parse template/question for blanks
      const template = exercise.template || exercise.question || ''
      console.log('📝 Parsing template for blanks:', template)
      
      // Count different blank patterns
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
    
    // Always reinitialize the array to ensure proper reactivity
    fillBlankAnswers.value = new Array(Math.max(1, blankCount)).fill('')
    console.log(`✅ Initialized ${fillBlankAnswers.value.length} fill-blank answers`)
  }
  
  // ✅ FIXED - Ordering initialization
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
  
  // ✅ FIXED - Drag drop initialization
  const initializeDragDropItems = () => {
    // Clear existing placements
    Object.keys(dragDropPlacements).forEach(key => {
      delete dragDropPlacements[key]
    })
    console.log('✅ Initialized drag-drop placements')
  }
  
  // ✅ FIXED - Matching initialization
  const initializeMatchingItems = () => {
    matchingPairs.value = []
    selectedMatchingItem.value = null
    console.log('✅ Initialized matching items')
  }
  
  // ✅ FIXED - Answer validation
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
        // Check if we have answers and at least one is filled
        const hasAnswers = Array.isArray(fillBlankAnswers.value) && fillBlankAnswers.value.length > 0
        const hasFilledAnswers = hasAnswers && fillBlankAnswers.value.some(answer => 
          answer && typeof answer === 'string' && answer.trim().length > 0
        )
        console.log('🔍 Fill-blank validation:', {
          hasAnswers,
          hasFilledAnswers,
          answers: fillBlankAnswers.value,
          exerciseType
        })
        return hasFilledAnswers
        
      case 'matching':
        return Array.isArray(matchingPairs.value) && matchingPairs.value.length > 0
        
      case 'ordering':
        return Array.isArray(orderingItems.value) && orderingItems.value.length > 0
        
      case 'drag-drop':
        return Object.keys(dragDropPlacements).length > 0
        
      default:
        return userAnswer.value && userAnswer.value.trim().length > 0
    }
  }
  
  // ✅ FIXED - Fill blank answer updating
  const updateFillBlankAnswer = (index, value) => {
    // Ensure we have an array
    if (!Array.isArray(fillBlankAnswers.value)) {
      fillBlankAnswers.value = []
    }
    
    // Extend array if needed
    while (fillBlankAnswers.value.length <= index) {
      fillBlankAnswers.value.push('')
    }
    
    // Handle both event objects and direct values
    const newValue = typeof value === 'object' && value?.target ? value.target.value : value
    
    // Update the specific index
    fillBlankAnswers.value[index] = newValue || ''
    
    console.log(`📝 Updated blank ${index + 1}:`, newValue, 'All answers:', fillBlankAnswers.value)
  }
  
  // ✅ Reset functions
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
    
    // Clear drag-drop placements
    Object.keys(dragDropPlacements).forEach(key => {
      delete dragDropPlacements[key]
    })
  }
  
  // ✅ Helper functions
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }
  
  const getCurrentExerciseType = (exercise) => {
    return exercise?.type || 'short-answer'
  }
  
  // ✅ ADDED - Get formatted fill-blank template
  const getFormattedFillBlankTemplate = (exercise) => {
    if (!exercise || exercise.type !== 'fill-blank') {
      return ''
    }
    
    const template = exercise.template || exercise.question || ''
    let blankIndex = 0
    
    // Replace different blank patterns with input fields
    return template
      .replace(/\[blank\]/gi, () => `<input data-blank-index="${blankIndex++}">`)
      .replace(/_+/g, () => `<input data-blank-index="${blankIndex++}">`)
      .replace(/\{[^}]*\}/g, () => `<input data-blank-index="${blankIndex++}">`)
  }
  
  // ✅ ADDED - Validate fill-blank answers
  const validateFillBlankAnswers = (exercise) => {
    if (!exercise || exercise.type !== 'fill-blank') {
      return false
    }
    
    const correctAnswers = exercise.correctAnswers || exercise.answers || []
    if (!Array.isArray(correctAnswers)) {
      return false
    }
    
    // Check if all answers are correct
    return fillBlankAnswers.value.every((userAnswer, index) => {
      const correctAnswer = correctAnswers[index]
      if (!correctAnswer) return false
      
      const userAnswerTrimmed = (userAnswer || '').trim().toLowerCase()
      
      // Handle multiple correct answers
      if (Array.isArray(correctAnswer)) {
        return correctAnswer.some(answer => 
          answer.toLowerCase().trim() === userAnswerTrimmed
        )
      }
      
      return correctAnswer.toLowerCase().trim() === userAnswerTrimmed
    })
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
    draggedDragItem,
    dropOverZone,
    draggedItem,
    dropTarget,
    
    // Methods
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
    validateFillBlankAnswers
  }
}