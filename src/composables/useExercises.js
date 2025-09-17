// src/composables/useExercises.js
import { ref, reactive, computed } from 'vue';

export function useExercises() {
  // ===================================
  // STATE MANAGEMENT
  // ===================================
  
  // Navigation state
  const currentExerciseIndex = ref(0)
  const currentQuizIndex = ref(0)
  const _currentExercise = ref(null); // Internal reactive reference to the current exercise
  
  // Answer state
  const userAnswer = ref(null)
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
  // NEW: ENHANCED QUESTION DETECTION
  // ===================================
  
  const detectQuestionsFromExercise = (exercise) => {
    if (!exercise) return []
    
    console.log('🔍 Detecting questions from exercise:', exercise)
    
    let questions = []
    
    // Strategy 1: Check for explicit questions array
    if (exercise.questions && Array.isArray(exercise.questions)) {
      questions = exercise.questions.map((q, index) => ({
        question: typeof q === 'string' ? q : (q.text || q.question || `Вопрос ${index + 1}`),
        index: index,
        source: 'explicit-array'
      }))
      console.log('🔍 Found explicit questions array:', questions)
      return questions
    }
    
    // Strategy 2: Parse main question field for multiple questions
    const mainQuestion = exercise.question || exercise.content || ''
    if (mainQuestion) {
      // Split by common question patterns
      const questionPatterns = [
        {
          name: 'numbered-dot',
          regex: /(\d+\.\s*[^?]*\?)/g,
          extract: (match) => match.replace(/^\d+\.\s*/, '').trim()
        },
        {
          name: 'numbered-paren',
          regex: /(\d+\)\s*[^?]*\?)/g,
          extract: (match) => match.replace(/^\d+\)\s*/, '').trim()
        },
        {
          name: 'question-prefix',
          regex: /((?:Вопрос|Question)\s*\d+[:.]\s*[^?]*\?)/gi,
          extract: (match) => match.replace(/(?:Вопрос|Question)\s*\d+[:.]\s*/i, '').trim()
        },
        {
          name: 'simple-questions',
          regex: /([А-ЯA-Z][^?]*\?)/g,
          extract: (match) => match.trim()
        }
      ]
      
      for (const pattern of questionPatterns) {
        const matches = [...mainQuestion.matchAll(pattern.regex)]
        if (matches.length > 1) {
          questions = matches.map((match, index) => ({
            question: pattern.extract(match[1] || match[0]),
            index: index,
            source: `pattern-${pattern.name}`
          }))
          console.log(`🔍 Parsed questions using ${pattern.name}:`, questions)
          break
        }
      }
      
      // Strategy 3: Split by line breaks if multiple lines with question marks
      if (questions.length === 0) {
        const lines = mainQuestion.split(/\n+/).filter(line => line.trim().length > 0)
        const questionLines = lines.filter(line => line.includes('?'))
        
        if (questionLines.length > 1) {
          questions = questionLines.map((line, index) => ({
            question: line.trim().replace(/^\d+[\.)]\s*/, ''), // Remove numbering
            index: index,
            source: 'line-split'
          }))
          console.log('🔍 Split questions by lines:', questions)
        }
      }
    }
    
    // Strategy 4: Check data field for questions
    if (questions.length === 0 && exercise.data) {
      if (Array.isArray(exercise.data)) {
        const dataQuestions = exercise.data.filter(item => {
          if (typeof item === 'string') return item.includes('?')
          return item && (item.question || item.text) && String(item.question || item.text).includes('?')
        })
        
        if (dataQuestions.length > 0) {
          questions = dataQuestions.map((item, index) => ({
            question: typeof item === 'string' ? item : (item.question || item.text || `Вопрос ${index + 1}`),
            index: index,
            source: 'data-array'
          }))
        }
      } else if (exercise.data.questions && Array.isArray(exercise.data.questions)) {
        questions = exercise.data.questions.map((q, index) => ({
          question: typeof q === 'string' ? q : (q.text || q.question || `Вопрос ${index + 1}`),
          index: index,
          source: 'data-questions'
        }))
      }
    }
    
    console.log('🔍 Final detected questions:', questions)
    return questions
  }
  
  // ===================================
  // UTILITY FUNCTIONS
  // ===================================
  
  const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (s1, s2) => {
    s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) costs[j] = j;
        else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  // Improved Fisher-Yates shuffle algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array] // Create a copy to avoid mutating original
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    // For arrays with more than 1 element, ensure it's actually shuffled
    if (shuffled.length > 1) {
      let attempts = 0
      while (attempts < 5 && JSON.stringify(shuffled) === JSON.stringify(array)) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        attempts++
      }
    }
    
    return shuffled
  }

  // Helper function to check if items are in original order
  const isArrayInOriginalOrder = (shuffledItems) => {
    return shuffledItems.every((item, index) => item.originalIndex === index)
  }

  const getCorrectAnswersArray = (exercise) => {
    const correctAnswer = exercise.correctAnswer || exercise.answer;
    return Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer].filter(Boolean);
  };

  // ===================================
  // ENHANCED VALIDATION FUNCTIONS
  // ===================================
  
  const validateShortAnswer = (userAnswer, exercise) => {
    console.log('🔍 Validating short answer:', { userAnswer, exercise })
    
    // Detect questions from exercise
    const detectedQuestions = detectQuestionsFromExercise(exercise)
    
    // Handle multiple questions (enhanced detection)
    if (detectedQuestions.length > 1) {
      if (!Array.isArray(userAnswer)) {
        console.log('🔍 Multiple questions detected but userAnswer is not array:', userAnswer)
        return false
      }
      
      const correctAnswers = getCorrectAnswersArray(exercise)
      console.log('🔍 Multiple questions validation:', { userAnswer, correctAnswers, detectedQuestions })
      
      // Validate each detected question
      let validAnswers = 0
      const totalQuestions = detectedQuestions.length
      
      for (let i = 0; i < totalQuestions; i++) {
        const userAnswerItem = userAnswer[i]
        if (!userAnswerItem || typeof userAnswerItem !== 'string') continue
        
        const userTrimmed = userAnswerItem.trim().toLowerCase()
        if (userTrimmed.length < 1) continue
        
        // Get corresponding correct answer
        let correctAnswer = null
        if (correctAnswers[i]) {
          correctAnswer = correctAnswers[i]
        } else if (correctAnswers.length === 1) {
          // If only one correct answer provided, use pattern matching
          correctAnswer = correctAnswers[0]
        }
        
        if (correctAnswer) {
          const correctTrimmed = String(correctAnswer).trim().toLowerCase()
          
          if (userTrimmed === correctTrimmed) {
            validAnswers++
          } else if (correctTrimmed.length > 3) {
            // Fuzzy matching for longer answers
            const similarity = calculateSimilarity(userTrimmed, correctTrimmed)
            if (similarity > 0.8) {
              validAnswers++
            }
          }
        } else {
          // If no specific correct answer, accept any non-empty response
          if (userTrimmed.length >= 2) {
            validAnswers++
          }
        }
      }
      
      // Require at least 70% of questions to be answered correctly
      const successRate = validAnswers / totalQuestions
      console.log('🔍 Multiple questions success rate:', successRate, `(${validAnswers}/${totalQuestions})`)
      return successRate >= 0.7
    }
    
    // Single question validation (existing logic)
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
    const correctAnswer = exercise.correctAnswer;

    // Case 1: Correct answer is a number (index)
    if (typeof correctAnswer === 'number') {
      return userAnswer === correctAnswer;
    }

    // Case 2: Correct answer is a letter ID (e.g., "B")
    if (typeof correctAnswer === 'string' && correctAnswer.length === 1) {
      return userAnswer === correctAnswer.toUpperCase();
    }
    
    // Case 3: Correct answer is the full text of the option
    if (typeof correctAnswer === 'string') {
        return userAnswer === correctAnswer;
    }

    // Fallback for array-based correct answers (for multi-select)
    if (Array.isArray(correctAnswer)) {
        const normalizedUser = Array.isArray(userAnswer) ? [...userAnswer].sort() : [userAnswer];
        const normalizedCorrect = [...correctAnswer].sort();
        return JSON.stringify(normalizedUser) === JSON.stringify(normalizedCorrect);
    }

    return false;
  };

  const validateTrueFalse = (userAnswer, exercise) => {
    const correctAnswer = exercise.correctAnswer

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

    if (typeof correctAnswer === 'string') {
      if (typeof userAnswer === 'string') {
        return userAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }
    }

    return false
  }

  const validateFillBlank = (userAnswers, exercise) => {
    if (!userAnswers || typeof userAnswers !== 'object') return false;
    const allBlanks = exercise.questions.flatMap(q => q.blanks);
    if (Object.keys(userAnswers).length < allBlanks.length) return false;
    return allBlanks.every(blank => 
      (userAnswers[blank.id] || '').trim().toLowerCase() === blank.correctAnswer.trim().toLowerCase()
    );
  };
  
  const validateMatching = (userPairs, exercise) => {
    if (!userPairs || typeof userPairs !== 'object') return false;
    if (Object.keys(userPairs).length < exercise.pairs.length) return false;
    return exercise.pairs.every(pair => 
      userPairs[pair.id] === pair.correctMatch
    );
  };
  
  const validateOrdering = (userItems, exercise) => {
    if (!userItems || typeof userItems !== 'object') return false;
    if (Object.keys(userItems).length < exercise.questions.length) return false;
    return exercise.questions.every(q => 
      JSON.stringify(userItems[q.id]) === JSON.stringify(q.correctOrder)
    );
  };

  const validateDragDrop = (userPlacements, exercise) => {
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
    if (!exercise) return false;
    
    const exerciseType = exercise.type || 'short-answer';

    switch (exerciseType) {
      case 'short-answer':
      case 'reading':
      case 'sentence-transformation':
      case 'error-correction':
        return validateShortAnswer(userAnswer.value, exercise);
      case 'multiple-choice':
      case 'abc':
      case 'dialogue-completion':
        return validateMultipleChoice(userAnswer.value, exercise);
      case 'true-false':
        return validateTrueFalse(userAnswer.value, exercise);
      case 'fill-blanks':
        return validateFillBlank(userAnswer.value, exercise);
      case 'matching':
        return validateMatching(userAnswer.value, exercise);
      case 'structure':
      case 'ordering':
        return validateOrdering(userAnswer.value, exercise);
      case 'drag-drop':
        return validateDragDrop(dragDropPlacements, exercise);
      default:
        return validateShortAnswer(userAnswer.value, exercise);
    }
  };

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
  // ENHANCED ANSWER DISPLAY FUNCTIONS
  // ===================================
  
  const getCorrectAnswerDisplay = (exercise) => {
    if (!exercise) return '';
    const { correctAnswer, type = 'short-answer' } = exercise;

    if (type === 'multiple-choice' || type === 'abc' || type === 'dialogue-completion') {
      if (typeof correctAnswer === 'number') {
        return exercise.options[correctAnswer]?.text || exercise.options[correctAnswer] || '';
      }
      if (typeof correctAnswer === 'string' && correctAnswer.length === 1) {
          const foundOption = exercise.options.find(opt => (opt.text || opt).startsWith(correctAnswer));
          return foundOption?.text || foundOption || '';
      }
    }

    if (type === 'matching') {
        if (exercise.pairs && Array.isArray(exercise.pairs)) {
          return exercise.pairs.map(pair => `${pair.left} ↔ ${pair.correctMatch}`).join('; ');
        }
        return 'Правильные пары показаны выше';
    }

    if (type === 'ordering' || type === 'structure') {
        if (exercise.questions && Array.isArray(exercise.questions)) {
            return exercise.questions.map(q => q.correctOrder.join(' ')).join('; ');
        }
        return 'Правильный порядок показан выше';
    }
    
    return Array.isArray(correctAnswer) ? correctAnswer.join('; ') : String(correctAnswer || '');
  };

  // ===================================
  // SUBMISSION FUNCTIONS
  // ===================================
  
  const submitAnswer = (exercise) => {
    attemptCount.value++;
    const isCorrect = validateCurrentAnswer(exercise);
    answerWasCorrect.value = isCorrect;

    if (isCorrect) {
      confirmation.value = '✅ Отлично! Правильный ответ!';
    } else {
      const correctAnswerText = getCorrectAnswerDisplay(exercise);
      confirmation.value = `Правильный ответ: ${correctAnswerText}`;
    }
    showCorrectAnswer.value = true;
    return isCorrect;
  };

  const submitQuizAnswer = (quiz) => {
    attemptCount.value++
    
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
  
  const setCurrentExercise = (exercise) => {
    _currentExercise.value = exercise;
  };

  const getCurrentExercise = (currentStep) => {
    console.log('🔍 DEBUG getCurrentExercise - Step:', currentStep)
    
    if (!currentStep || !['exercise', 'practice'].includes(currentStep.type)) {
      return null
    }
    
    let exercises = []
    
    try {
      if (Array.isArray(currentStep.data)) {
        exercises = currentStep.data
      } 
      else if (currentStep.data && Array.isArray(currentStep.data.exercises)) {
        exercises = currentStep.data.exercises
      }
      else if (currentStep.data && currentStep.data.question) {
        exercises = [currentStep.data]
      }
      else if (currentStep.exercises && Array.isArray(currentStep.exercises)) {
        exercises = currentStep.exercises
      }
      
      if (exercises.length === 0) return null
      
      if (currentExerciseIndex.value >= exercises.length) {
        currentExerciseIndex.value = 0
      }
      
      const exercise = exercises[currentExerciseIndex.value]
      
      if (exercise) {
        detectQuestionsFromExercise(exercise)
      }

      setCurrentExercise(exercise); // Keep internal ref updated
      return exercise || null
      
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
        console.log('📝 Original items:', exercise.items)
        initializeOrderingItems(exercise)
        console.log('🔀 Shuffled items:', orderingItems.value.map(item => item.text))
        break
      case 'drag-drop':
        initializeDragDropItems(exercise)
        break
      case 'matching':
        initializeMatchingItems()
        break
      case 'short-answer':
        // Enhanced: Initialize for multiple questions
        const detectedQuestions = detectQuestionsFromExercise(exercise)
        if (detectedQuestions.length > 1) {
          console.log('🔧 Initializing multiple answer array for', detectedQuestions.length, 'questions')
          userAnswer.value = new Array(detectedQuestions.length).fill('')
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
      const curlyBraceMatches = template.match(/\{[^}]*\}/g) || []
      
      blankCount = Math.max(
        underscoreMatches.length, 
        blankMatches.length, 
        curlyBraceMatches.length
      )
    }
    
    fillBlankAnswers.value = new Array(Math.max(1, blankCount)).fill('')
  }
  
  const initializeOrderingItems = (exercise) => {
    if (!exercise || exercise.type !== 'ordering' || !Array.isArray(exercise.items)) {
      orderingItems.value = [];
      return;
    }

    const itemsWithMetadata = exercise.items.map((item, index) => ({
      id: `item_${index}_${Math.random()}`,
      text: typeof item === 'string' ? item : (item?.text || String(item)),
      originalIndex: index
    }));

    let shuffledItems = [...itemsWithMetadata];
    let attempts = 0;
    
    while (attempts < 10 && JSON.stringify(shuffledItems.map(i => i.originalIndex)) === JSON.stringify(itemsWithMetadata.map(i => i.originalIndex))) {
        shuffledItems.sort(() => Math.random() - 0.5);
        attempts++;
    }
    
    orderingItems.value = shuffledItems;
  }
  
  const initializeDragDropItems = (exercise) => {
    Object.keys(dragDropPlacements).forEach(key => {
      delete dragDropPlacements[key]
    })
    
    availableDragItems.value = []
    dropZones.value = []
    
    if (!exercise || exercise.type !== 'drag-drop') {
      return
    }
    
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
      
      dropZones.value.forEach(zone => {
        dragDropPlacements[zone.id] = []
      })
    }
  }
  
  const initializeMatchingItems = () => {
    matchingPairs.value = [];
    selectedMatchingItem.value = null;
  
    if (typeof window !== 'undefined') {
      window.matchingShuffleCache = null;
    }
  };

  // ===================================
  // UPDATE FUNCTIONS
  // ===================================
  
  const updateUserAnswer = (newAnswer, exercise) => {
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
        break
      case 'short-answer':
        const detectedQuestions = detectQuestionsFromExercise(exercise)
        if (detectedQuestions.length > 1 && Array.isArray(newAnswer)) {
          userAnswer.value = newAnswer
        } else {
          userAnswer.value = newAnswer
        }
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
  }

  const getCurrentUserAnswer = () => {
    return userAnswer.value || fillBlankAnswers.value || matchingPairs.value || orderingItems.value
  }

  // ===================================
  // INTERACTION HANDLERS
  // ===================================
  
  const handleMatchingSelection = (selection) => {
    selectedMatchingItem.value = selection
  }

  const removeMatchingPair = (pairIndex) => {
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
    draggedDragItem.value = item
  }

  const handleDragOverZone = (zoneId) => {
    dropOverZone.value = zoneId
  }

  const handleDragLeaveZone = () => {
    dropOverZone.value = null
  }

  const handleDropInZone = ({ zoneId, item }) => {
    if (!dragDropPlacements[zoneId]) {
      dragDropPlacements[zoneId] = []
    }
    
    const itemText = typeof item === 'string' ? item : (item?.text || item?.label || String(item))
    
    Object.keys(dragDropPlacements).forEach(otherZoneId => {
      if (otherZoneId !== zoneId && Array.isArray(dragDropPlacements[otherZoneId])) {
        dragDropPlacements[otherZoneId] = dragDropPlacements[otherZoneId].filter(placedItem => {
          const placedText = typeof placedItem === 'string' ? placedItem : (placedItem?.text || placedItem?.label || String(placedItem))
          return placedText !== itemText
        })
      }
    })
    
    const isAlreadyInZone = dragDropPlacements[zoneId].some(placedItem => {
      const placedText = typeof placedItem === 'string' ? placedItem : (placedItem?.text || placedItem?.label || String(placedItem))
      return placedText === itemText
    })
    
    if (!isAlreadyInZone) {
      dragDropPlacements[zoneId].push(item)
    }
    
    draggedDragItem.value = null
    dropOverZone.value = null
  }

  const handleRemoveDroppedItem = ({ zoneId, itemIndex, item }) => {
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
  
  const resetAttemptState = () => {
    attemptCount.value = 0
    showCorrectAnswer.value = false
  }

  const resetExerciseAnswers = () => {
    userAnswer.value = null; // Reset to null to clear selection
    confirmation.value = ''
    answerWasCorrect.value = false
    currentHint.value = ''
    smartHint.value = ''
    resetAttemptState()
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
  
  const resetExerciseState = () => {
    currentExerciseIndex.value = 0
    currentQuizIndex.value = 0
    resetExerciseAnswers()
    resetExerciseData()
    resetAttemptState()
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
      return pairs.map((pair, index) => {
        let text = ''
        if (Array.isArray(pair)) {
          text = String(pair[0] || '')
        } else if (pair && typeof pair === 'object') {
          text = String(pair.left || pair[0] || pair.question || pair.term || '')
        } else {
          text = String(pair || '')
        }
        return { text, originalIndex: index }
      }).filter(item => item.text.trim() !== '')
    }
    return []
  }
  
  const getRightItemsArray = (exercise) => {
    if (!exercise?.pairs) return []
    const pairs = exercise.pairs
    if (Array.isArray(pairs)) {
      const rightItemsWithMetadata = pairs.map((pair, index) => {
        let text = ''
        if (Array.isArray(pair)) {
          text = String(pair[1] || '')
        } else if (pair && typeof pair === 'object') {
          text = String(pair.right || pair[1] || pair.answer || pair.definition || '')
        } else {
          text = String(pair || '')
        }
        return { text, originalIndex: index }
      }).filter(item => item.text.trim() !== '')
      
      return shuffleArray(rightItemsWithMetadata)
    }
    return []
  }
  
  const forceReshuffleRightItems = () => {
    return true
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
    setCurrentExercise,
    
    // Enhanced: Question Detection Methods
    detectQuestionsFromExercise,
    
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
    shuffleArray,
    isArrayInOriginalOrder,
    forceReshuffleRightItems
  }
}