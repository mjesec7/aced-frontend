// src/composables/useExercises.js - Enhanced with question-answer detection
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
  // VALIDATION & DISPLAY FUNCTIONS (REPLACE THESE)
  // ===================================

  const validateShortAnswer = (userAnswer, exercise) => {
    if (exercise.questions && Array.isArray(exercise.questions) && exercise.questions.length > 1) {
      if (!Array.isArray(userAnswer)) return false;
      const correctAnswers = getCorrectAnswersArray(exercise);
      if (userAnswer.length !== correctAnswers.length) return false;
      return userAnswer.every((answer, index) => {
        if (answer === undefined || answer === null || typeof answer !== 'string') return false;
        const correctAnswer = correctAnswers[index];
        if (correctAnswer === undefined || correctAnswer === null) return false;
        const userTrimmed = answer.trim().toLowerCase();
        const correctTrimmed = String(correctAnswer).trim().toLowerCase();
        if (userTrimmed === correctTrimmed) return true;
        if (correctTrimmed.length > 3) {
          return calculateSimilarity(userTrimmed, correctTrimmed) > 0.8;
        }
        return false;
      });
    }
    if (!userAnswer || typeof userAnswer !== 'string') return false;
    const correctAnswers = getCorrectAnswersArray(exercise);
    const userAnswerTrimmed = userAnswer.trim().toLowerCase();
    return correctAnswers.some(answer => {
      const correctAnswerTrimmed = String(answer).trim().toLowerCase();
      if (userAnswerTrimmed === correctAnswerTrimmed) return true;
      if (correctTrimmed.length > 3) {
        return calculateSimilarity(userAnswerTrimmed, correctAnswerTrimmed) > 0.8;
      }
      return false;
    });
  };

  const validateMultipleChoice = (userAnswer, exercise) => {
    const correctAnswer = exercise.correctAnswer;
    const normalize = (ans) => {
      if (Array.isArray(ans)) return ans.map(String).sort();
      if (ans === null || ans === undefined) return [];
      return [String(ans)];
    };
    const normalizedUserAnswer = normalize(userAnswer);
    const normalizedCorrectAnswer = (() => {
      if (Array.isArray(correctAnswer)) {
        return correctAnswer.map(c => {
          if (typeof c === 'number' && exercise.options) {
            const option = exercise.options[c];
            return String(typeof option === 'string' ? option : (option?.text || option));
          }
          return String(c);
        }).sort();
      }
      if (typeof correctAnswer === 'number' && exercise.options) {
        const option = exercise.options[correctAnswer];
        return [String(typeof option === 'string' ? option : (option?.text || option))];
      }
      return normalize(correctAnswer);
    })();
    return JSON.stringify(normalizedUserAnswer) === JSON.stringify(normalizedCorrectAnswer);
  };

  const validateTrueFalse = (userAnswer, exercise) => {
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
  // MAIN VALIDATION FUNCTION (UPDATE THIS)
  // ===================================
  const validateCurrentAnswer = (exercise) => {
    if (!exercise) return false;

    // **ADD THIS LINE:** If exercise.type is missing, it safely defaults to 'short-answer'.
    const exerciseType = exercise.type || 'short-answer';

    // The switch statement now uses the safe exerciseType variable
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
        // **ADD THIS** as a final fallback for safety.
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
  // ENHANCED ANSWER DISPLAY FUNCTIONS
  // ===================================

  const getCorrectAnswerDisplay = (exercise) => {
    if (!exercise) return '';
    const exerciseType = exercise.type || 'short-answer';
    const correctAnswer = exercise.correctAnswer || exercise.answer;
    switch (exerciseType) {
      case 'matching':
        return exercise.pairs?.map(p => `${p.left} ↔ ${p.correctMatch || p.right || p[1]}`).join('; ') || 'Correct pairs are shown above';
      case 'multiple-choice': case 'abc': case 'dialogue-completion':
        if (Array.isArray(correctAnswer)) return correctAnswer.map(ans => (typeof ans === 'number' && exercise.options) ? (exercise.options[ans]?.text || exercise.options[ans]) : String(ans)).join(', ');
        if (typeof correctAnswer === 'number' && exercise.options) {
          const option = exercise.options[correctAnswer];
          return typeof option === 'string' ? option : (option?.text || String(option));
        }
        return String(correctAnswer || '');
      case 'true-false':
        return String(correctAnswer) === 'true' || String(correctAnswer) === '0' ? 'Правда' : 'Ложь';
      case 'structure': case 'ordering':
        if (exercise.correctOrder?.length) return exercise.correctOrder.join(' ');
        if (exercise.items?.length) return exercise.items.map((item, index) => `${index + 1}. ${item?.text || item}`).join('; ');
        return 'The correct order is shown above';
      case 'fill-blanks':
        return getCorrectAnswersArray(exercise).join(', ');
      case 'reading': case 'short-answer': case 'sentence-transformation': case 'error-correction':
        if (Array.isArray(correctAnswer)) return correctAnswer.join('; ');
        return String(correctAnswer || '');
      default:
        return String(correctAnswer || '');
    }
  };


  // ===================================
  // SUBMISSION, NAVIGATION & OTHER HELPERS (ADD/REPLACE THIS BLOCK)
  // ===================================

  const getRandomSuccessMessage = () => '✅ Отлично! Правильный ответ!';
  const getSecondChanceMessage = () => '🤔 Не совсем правильно. У вас есть ещё одна попытка!';
  const getFinalFailureMessage = (exercise, correctAnswer) => `📚 Не беспокойтесь! Правильный ответ: ${correctAnswer}`;

  const canSubmitAnswer = (exercise) => {
    if (!exercise) return userAnswer.value && userAnswer.value.trim().length > 0;
    const exerciseType = exercise.type || 'short-answer';
    switch (exerciseType) {
      case 'short-answer':
        const detectedQuestions = detectQuestionsFromExercise(exercise);
        if (detectedQuestions.length > 1) {
          if (!Array.isArray(userAnswer.value)) return false;
          const answeredCount = userAnswer.value.filter(answer => answer && typeof answer === 'string' && answer.trim().length > 0).length;
          return answeredCount >= Math.ceil(detectedQuestions.length * 0.7);
        }
        return userAnswer.value && userAnswer.value.trim().length > 0;
      case 'multiple-choice': case 'abc': case 'true-false':
        return userAnswer.value !== null && userAnswer.value !== undefined && userAnswer.value !== '';
      case 'fill-blank':
        return Array.isArray(fillBlankAnswers.value) && fillBlankAnswers.value.some(answer => answer && answer.trim().length > 0);
      case 'matching':
        return Array.isArray(matchingPairs.value) && matchingPairs.value.length > 0;
      case 'ordering':
        return Array.isArray(orderingItems.value) && orderingItems.value.length > 0;
      case 'drag-drop':
        return Object.values(dragDropPlacements).some(items => Array.isArray(items) && items.length > 0);
      default:
        return userAnswer.value && userAnswer.value.trim().length > 0;
    }
  };

  const submitAnswer = (exercise) => {
    if (!canSubmitAnswer(exercise)) return false;
    attemptCount.value++;
    const isCorrect = validateCurrentAnswer(exercise);
    answerWasCorrect.value = isCorrect;
    if (isCorrect) {
      confirmation.value = getRandomSuccessMessage();
      showCorrectAnswer.value = true;
    } else if (isOnSecondChance.value) {
      confirmation.value = getSecondChanceMessage(exercise);
      showCorrectAnswer.value = false;
    } else {
      const correctAnswer = getCorrectAnswerDisplay(exercise);
      confirmation.value = getFinalFailureMessage(exercise, correctAnswer);
      showCorrectAnswer.value = true;
    }
    return isCorrect;
  };

  const submitQuizAnswer = (quiz) => {
    if (!canSubmitAnswer(quiz)) return false;
    attemptCount.value++;
    const isCorrect = validateQuizAnswer(quiz);
    answerWasCorrect.value = isCorrect;
    if (isCorrect) {
      confirmation.value = getRandomSuccessMessage();
      showCorrectAnswer.value = false;
    } else if (isOnSecondChance.value) {
      confirmation.value = getSecondChanceMessage(quiz);
      showCorrectAnswer.value = false;
    } else {
      const correctAnswer = getCorrectAnswerDisplay(quiz);
      confirmation.value = getFinalFailureMessage(quiz, correctAnswer);
      showCorrectAnswer.value = true;
    }
    return isCorrect;
  };

  const getCurrentExercise = (currentStep) => {
    if (!currentStep || !['exercise', 'practice'].includes(currentStep.type)) return null;
    let exercises = [];
    if (Array.isArray(currentStep.data)) exercises = currentStep.data;
    else if (currentStep.data?.exercises) exercises = currentStep.data.exercises;
    else if (currentStep.data?.question) exercises = [currentStep.data];
    else if (currentStep.exercises) exercises = currentStep.exercises;
    if (exercises.length === 0) return null;
    if (currentExerciseIndex.value >= exercises.length) currentExerciseIndex.value = 0;
    return exercises[currentExerciseIndex.value] || null;
  };

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
    if (!currentStep || !['exercise', 'practice'].includes(currentStep.type)) return 0;
    let exercises = [];
    if (Array.isArray(currentStep.data)) exercises = currentStep.data;
    else if (currentStep.data?.exercises) exercises = currentStep.data.exercises;
    else if (currentStep.data?.question) exercises = [currentStep.data];
    return exercises.length;
  };


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

  const isLastExercise = (currentStep) => getTotalExercises(currentStep) > 0 && currentExerciseIndex.value >= getTotalExercises(currentStep) - 1;


  const isLastQuiz = (currentStep) => {
    const totalQuizzes = getTotalQuizzes(currentStep)
    return currentQuizIndex.value >= totalQuizzes - 1
  }

  const goToNextExercise = (currentStep, onNextStep) => {
    if (isLastExercise(currentStep)) {
      resetExerciseState();
      onNextStep();
    } else {
      currentExerciseIndex.value++;
      resetExerciseAnswers();
      initializeCurrentExerciseData(getCurrentExercise(currentStep));
    }
  };


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

    // Shuffle the array until it's in a different order or after 10 attempts
    while (attempts < 10 && JSON.stringify(shuffledItems.map(i => i.originalIndex)) === JSON.stringify(itemsWithMetadata.map(i => i.originalIndex))) {
      shuffledItems.sort(() => Math.random() - 0.5);
      attempts++;
    }

    orderingItems.value = shuffledItems;
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
  }

  const initializeMatchingItems = () => {
    matchingPairs.value = [];
    selectedMatchingItem.value = null;

    // Force refresh of right items shuffling
    if (typeof window !== 'undefined') {
      // Clear any cached shuffling state
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
        // Fill blank is updated separately via updateFillBlankAnswer
        break
      case 'short-answer':
        // Enhanced: Handle multiple questions
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
    currentExerciseIndex.value = 0;
    currentQuizIndex.value = 0;
    resetExerciseAnswers();
    resetExerciseData();
  };


  const resetExerciseAnswers = () => {
    userAnswer.value = '';
    confirmation.value = '';
    answerWasCorrect.value = false;
    currentHint.value = '';
    smartHint.value = '';
    resetAttemptState();
  };

  const resetAttemptState = () => {
    attemptCount.value = 0;
    showCorrectAnswer.value = false;
  };

  const resetExerciseData = () => {
    fillBlankAnswers.value = [];
    matchingPairs.value = [];
    selectedMatchingItem.value = null;
    orderingItems.value = [];
    availableDragItems.value = [];
    dropZones.value = [];
    Object.keys(dragDropPlacements).forEach(key => delete dragDropPlacements[key]);
  };

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
    // This will be called when starting a new matching exercise
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