// src/composables/useExercises.js
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
  
  // ✅ Exercise initialization
  const initializeCurrentExerciseData = (exercise) => {
    if (!exercise) return
    
    console.log('🔧 Initializing exercise data for type:', exercise.type)
    
    switch (exercise.type) {
      case 'fill-blank':
        initializeFillBlankAnswers(exercise)
        break
      case 'ordering':
        if (!orderingItems.value.length) {
          initializeOrderingItems(exercise)
        }
        break
      case 'drag-drop':
        if (!Object.keys(dragDropPlacements).length) {
          initializeDragDropItems()
        }
        break
      case 'matching':
        if (!matchingPairs.value.length) {
          matchingPairs.value = []
          selectedMatchingItem.value = null
        }
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
      blankCount = Math.max(underscoreMatches.length, blankMatches.length)
    }
    
    if (!Array.isArray(fillBlankAnswers.value) || fillBlankAnswers.value.length !== blankCount) {
      fillBlankAnswers.value = new Array(blankCount).fill('')
      console.log(`✅ Initialized ${blankCount} fill-blank answers`)
    }
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
  
  const initializeDragDropItems = () => {
    Object.keys(dragDropPlacements).forEach(key => {
      delete dragDropPlacements[key]
    })
    console.log('✅ Initialized drag-drop placements')
  }
  
  // ✅ Answer validation helpers
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
        return fillBlankAnswers.value && 
               fillBlankAnswers.value.length > 0 &&
               fillBlankAnswers.value.some(answer => answer && answer.trim())
      case 'matching':
        return matchingPairs.value && matchingPairs.value.length > 0
      case 'ordering':
        return orderingItems.value && orderingItems.value.length > 0
      case 'drag-drop':
        return Object.keys(dragDropPlacements).length > 0
      default:
        return userAnswer.value && userAnswer.value.trim().length > 0
    }
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
  
  const updateFillBlankAnswer = (index, event) => {
    if (!Array.isArray(fillBlankAnswers.value)) {
      fillBlankAnswers.value = []
    }
    
    while (fillBlankAnswers.value.length <= index) {
      fillBlankAnswers.value.push('')
    }
    
    fillBlankAnswers.value[index] = event.target.value
    console.log(`📝 Updated blank ${index + 1}:`, event.target.value)
  }
  
  const getCurrentExerciseType = (exercise) => {
    return exercise?.type || 'short-answer'
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
    canSubmitAnswer,
    resetExerciseState,
    resetExerciseAnswers,
    resetExerciseData,
    updateFillBlankAnswer,
    getCurrentExerciseType
  }
}