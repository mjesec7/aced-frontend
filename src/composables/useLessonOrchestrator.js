// src/composables/useLessonOrchestrator.js - FIXED VERSION
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/firebase'
import { 
  getLessonById, 
  getLessonProgress, 
  submitProgress,
  withErrorHandling
} from '@/api'

export function useLessonOrchestrator() {
  // ✅ Core lesson state
  const lesson = ref({})
  const steps = ref([])
  const currentIndex = ref(0)
  const started = ref(false)
  const loading = ref(true)
  const error = ref(null)
  const retryCount = ref(0)
  
  // ✅ Progress tracking
  const mistakeCount = ref(0)
  const stars = ref(0)
  const earnedPoints = ref(0)
  const hintsUsed = ref(false)
  const mistakeLog = ref([])
  const previousProgress = ref(null)
  
  // ✅ Lesson completion
  const lessonCompleted = ref(false)
  const elapsedSeconds = ref(0)
  const timerInterval = ref(null)
  const autosaveTimer = ref(null)
  
  // ✅ UI state
  const showConfetti = ref(false)
  const showExitModal = ref(false)
  const medalLabel = ref('')
  
  // ✅ User identification
  const userId = ref(null)
  const route = useRoute()
  const router = useRouter()
  
  // ✅ Computed properties
  const currentStep = computed(() => {
    if (!steps.value || steps.value.length === 0) return null
    const step = steps.value[currentIndex.value]
    console.log('📍 Current step computed:', step)
    return step || null
  })
  
  const isInteractiveStep = computed(() => {
    return currentStep.value && ['exercise', 'practice', 'quiz'].includes(currentStep.value.type)
  })
  
  const progressPercentage = computed(() => {
    if (steps.value.length === 0) return 0
    const completed = Math.min(currentIndex.value + 1, steps.value.length)
    return Math.floor((completed / steps.value.length) * 100)
  })
  
  const formattedTime = computed(() => {
    const min = Math.floor(elapsedSeconds.value / 60)
    const sec = elapsedSeconds.value % 60
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
  })
  
  const readableTime = computed(() => {
    const min = Math.floor(elapsedSeconds.value / 60)
    const sec = elapsedSeconds.value % 60
    return `${min} мин ${sec} сек`
  })
  
  const isLastStep = computed(() => {
    return currentIndex.value >= steps.value.length - 1
  })
  
  const estimatedTime = computed(() => {
    return lesson.value.metadata?.estimatedDuration || 
           Math.max(5, steps.value.length * 2)
  })
  
  // ✅ Authentication methods
  const waitForAuth = async () => {
    if (auth.currentUser) {
      return
    }
    
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe()
        
        if (user) {
          try {
            // Update store if available
            const store = window.$store || window.__VUE_STORE__
            if (store && store.commit) {
              store.commit('user/setUser', {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
              })
            }
          } catch (storeError) {
            console.warn('⚠️ Could not update store:', storeError.message)
          }
        }
        
        resolve()
      })
      
      setTimeout(() => {
        console.warn('⚠️ Authentication wait timeout')
        unsubscribe()
        resolve()
      }, 5000)
    })
  }
  
  // ✅ FIXED: Lesson loading methods
  const loadLesson = async () => {
    try {
      const lessonId = route.params.id
      
      loading.value = true
      error.value = null

      console.log('🔍 Loading lesson:', lessonId)

      const response = await withErrorHandling(
        () => getLessonById(lessonId),
        'Load lesson'
      )

      let lessonData = null
      
      if (response.success) {
        lessonData = response.lesson || response.data
      } else if (response.lesson) {
        lessonData = response.lesson
      } else if (response._id || response.lessonName) {
        lessonData = response
      } else {
        throw new Error('Invalid lesson response format')
      }

      if (!lessonData || !lessonData._id) {
        throw new Error('Lesson data is invalid or missing')
      }
      
      lesson.value = lessonData
      console.log('✅ Lesson loaded:', lesson.value.lessonName)
      console.log('📊 Raw lesson data:', lesson.value)
      
      processLessonSteps()
      
      if (!auth.currentUser) {
        throw new Error('Authentication required')
      }
      
      if (steps.value.length === 0) {
        console.warn('⚠️ No steps found in lesson, creating default step')
        createDefaultSteps()
      }
      
      // Log step details for debugging
      steps.value.forEach((step, index) => {
        console.log(`📝 Step ${index + 1}:`, {
          type: step.type,
          hasData: !!step.data,
          dataType: typeof step.data,
          isArray: Array.isArray(step.data),
          dataContent: step.data
        })
      })
      
    } catch (err) {
      console.error('❌ Error loading lesson:', err)
      error.value = handleLessonError(err)
      retryCount.value++
    } finally {
      loading.value = false
    }
  }
  
  // ✅ COMPLETELY FIXED: Process lesson steps
  const processLessonSteps = () => {
    console.log('🔄 Starting lesson step processing...')
    console.log('📋 Full lesson object:', lesson.value)
    
    steps.value = []
    
    // Try different possible lesson structures
    let stepsArray = null
    
    // Strategy 1: Direct steps array
    if (lesson.value.steps && Array.isArray(lesson.value.steps)) {
      stepsArray = lesson.value.steps
      console.log('✅ Found steps array directly:', stepsArray.length)
    }
    // Strategy 2: Check for legacy format with individual properties
    else {
      console.log('⚠️ No steps array found, checking legacy format...')
      stepsArray = buildStepsFromLegacyFormat()
    }
    
    if (!stepsArray || stepsArray.length === 0) {
      console.warn('⚠️ No valid steps found, creating default content')
      createDefaultSteps()
      return
    }
    
    // Process each step
    stepsArray.forEach((step, index) => {
      console.log(`🔍 Processing step ${index + 1}:`, step)
      
      if (!step || typeof step !== 'object') {
        console.warn(`⚠️ Step ${index + 1}: Invalid step object, skipping`)
        return
      }
      
      try {
        const processedStep = processIndividualStep(step, index)
        steps.value.push(processedStep)
        console.log(`✅ Step ${index + 1} processed successfully:`, processedStep.type)
      } catch (stepError) {
        console.error(`❌ Error processing step ${index + 1}:`, stepError)
        // Add error step
        steps.value.push({
          type: 'explanation',
          data: { 
            content: `<div class="error-content">
              <h3>⚠️ Step ${index + 1} Loading Error</h3>
              <p>There was an issue loading this step: ${stepError.message}</p>
              <p>Please contact support if this problem persists.</p>
            </div>`,
            error: true
          }
        })
      }
    })
    
    console.log(`✅ Processed ${steps.value.length} total steps`)
    
    if (steps.value.length === 0) {
      console.warn('⚠️ No valid steps after processing, creating default steps')
      createDefaultSteps()
    }
  }
  
  // ✅ NEW: Build steps from legacy lesson format
  const buildStepsFromLegacyFormat = () => {
    console.log('🔄 Building steps from legacy format...')
    const legacySteps = []
    
    // Check for explanations
    if (lesson.value.explanations && Array.isArray(lesson.value.explanations)) {
      lesson.value.explanations.forEach((explanation, index) => {
        legacySteps.push({
          type: 'explanation',
          title: `Explanation ${index + 1}`,
          content: typeof explanation === 'string' ? explanation : explanation.content || explanation.text || '',
          data: typeof explanation === 'string' ? explanation : explanation
        })
      })
    }
    
    // Check for examples
    if (lesson.value.examples && Array.isArray(lesson.value.examples)) {
      lesson.value.examples.forEach((example, index) => {
        legacySteps.push({
          type: 'example',
          title: `Example ${index + 1}`,
          content: typeof example === 'string' ? example : example.content || example.text || '',
          data: typeof example === 'string' ? example : example
        })
      })
    }
    
    // Check for exercises
    if (lesson.value.exercises && Array.isArray(lesson.value.exercises)) {
      legacySteps.push({
        type: 'exercise',
        title: 'Exercises',
        data: lesson.value.exercises
      })
    }
    
    // Check for vocabulary
    if (lesson.value.vocabulary && Array.isArray(lesson.value.vocabulary)) {
      legacySteps.push({
        type: 'vocabulary',
        title: 'Vocabulary',
        data: lesson.value.vocabulary
      })
    }
    
    // Check for quiz
    if (lesson.value.quiz && Array.isArray(lesson.value.quiz)) {
      legacySteps.push({
        type: 'quiz',
        title: 'Quiz',
        data: lesson.value.quiz
      })
    }
    
    // If still no steps, create from basic lesson properties
    if (legacySteps.length === 0) {
      if (lesson.value.description || lesson.value.content) {
        legacySteps.push({
          type: 'explanation',
          title: 'Lesson Content',
          content: lesson.value.description || lesson.value.content || '',
          data: { content: lesson.value.description || lesson.value.content || '' }
        })
      }
    }
    
    console.log(`📚 Built ${legacySteps.length} steps from legacy format`)
    return legacySteps
  }
  
  // ✅ NEW: Process individual step with better error handling
  const processIndividualStep = (step, index) => {
    // Ensure step has a type
    if (!step.type) {
      // Try to infer type from step properties
      if (step.question || step.exercises) {
        step.type = 'exercise'
      } else if (step.quiz || step.questions) {
        step.type = 'quiz'
      } else if (step.vocabulary || step.words) {
        step.type = 'vocabulary'
      } else {
        step.type = 'explanation'
      }
      console.log(`⚡ Inferred step type: ${step.type} for step ${index + 1}`)
    }
    
    let processedStep = { ...step }
    
    switch (step.type) {
      case 'exercise':
      case 'practice':
        processedStep = processExerciseStep(step, index)
        break
      case 'quiz':
        processedStep = processQuizStep(step, index)
        break
      case 'vocabulary':
        processedStep = processVocabularyStep(step, index)
        break
      case 'explanation':
      case 'example':
      case 'reading':
      default:
        processedStep = processContentStep(step, index)
    }
    
    // Ensure every step has valid data
    if (!processedStep.data) {
      console.warn(`⚠️ Step ${index + 1}: No data after processing, creating default`)
      processedStep.data = {
        content: `<div class="default-content">
          <h3>${getStepTypeText(step.type)} ${index + 1}</h3>
          <p>Content for this ${step.type} step is being prepared.</p>
        </div>`
      }
    }
    
    return processedStep
  }
  
  // ✅ FIXED: Process exercise step
  const processExerciseStep = (step, index) => {
    console.log(`📝 Processing exercise step ${index + 1}:`, step)
    
    let exercises = []
    
    // Try different possible exercise structures
    if (Array.isArray(step.data)) {
      exercises = step.data
    } else if (Array.isArray(step.exercises)) {
      exercises = step.exercises
    } else if (step.data && Array.isArray(step.data.exercises)) {
      exercises = step.data.exercises
    } else if (step.question) {
      // Single exercise
      exercises = [step]
    } else if (step.data && step.data.question) {
      exercises = [step.data]
    }
    
    // If no exercises found, create a default one
    if (exercises.length === 0) {
      exercises = [{
        type: 'short-answer',
        question: `Exercise ${index + 1}: What did you learn from this lesson?`,
        correctAnswer: 'Various answers accepted',
        points: 10
      }]
    }
    
    return {
      type: 'exercise',
      title: step.title || `Exercise ${index + 1}`,
      data: exercises
    }
  }
  
  // ✅ FIXED: Process quiz step  
  const processQuizStep = (step, index) => {
    console.log(`🧩 Processing quiz step ${index + 1}:`, step)
    
    let quizzes = []
    
    // Try different possible quiz structures
    if (Array.isArray(step.data)) {
      quizzes = step.data
    } else if (Array.isArray(step.quiz)) {
      quizzes = step.quiz
    } else if (Array.isArray(step.questions)) {
      quizzes = step.questions
    } else if (step.data && Array.isArray(step.data.quiz)) {
      quizzes = step.data.quiz
    } else if (step.data && Array.isArray(step.data.questions)) {
      quizzes = step.data.questions
    } else if (step.question) {
      quizzes = [step]
    } else if (step.data && step.data.question) {
      quizzes = [step.data]
    }
    
    // If no quiz found, create a default one
    if (quizzes.length === 0) {
      quizzes = [{
        type: 'multiple-choice',
        question: `Quiz ${index + 1}: How would you rate your understanding of this lesson?`,
        options: ['Excellent', 'Good', 'Fair', 'Need more practice'],
        correctAnswer: 0,
        points: 5
      }]
    }
    
    return {
      type: 'quiz',
      title: step.title || `Quiz ${index + 1}`,
      data: quizzes
    }
  }
  
  // ✅ FIXED: Process vocabulary step
  const processVocabularyStep = (step, index) => {
    console.log(`📚 Processing vocabulary step ${index + 1}:`, step)
    
    let vocabulary = []
    
    // Try different possible vocabulary structures
    if (Array.isArray(step.data)) {
      vocabulary = step.data
    } else if (Array.isArray(step.vocabulary)) {
      vocabulary = step.vocabulary
    } else if (Array.isArray(step.words)) {
      vocabulary = step.words
    } else if (step.data && Array.isArray(step.data.vocabulary)) {
      vocabulary = step.data.vocabulary
    } else if (step.data && Array.isArray(step.data.words)) {
      vocabulary = step.data.words
    }
    
    // If no vocabulary found, create default ones
    if (vocabulary.length === 0) {
      vocabulary = [
        {
          word: 'Example',
          definition: 'A representative form or pattern',
          pronunciation: 'ig-ZAM-pul',
          example: 'This is an example sentence.'
        }
      ]
    }
    
    return {
      type: 'vocabulary',
      title: step.title || `Vocabulary ${index + 1}`,
      data: vocabulary
    }
  }
  
  // ✅ FIXED: Process content step (explanation, example, reading)
  const processContentStep = (step, index) => {
    console.log(`📖 Processing content step ${index + 1}:`, step)
    
    let content = ''
    
    // Try different possible content sources
    if (typeof step.content === 'string') {
      content = step.content
    } else if (typeof step.data === 'string') {
      content = step.data
    } else if (step.data && typeof step.data.content === 'string') {
      content = step.data.content
    } else if (step.data && typeof step.data.text === 'string') {
      content = step.data.text
    } else if (typeof step.text === 'string') {
      content = step.text
    } else if (typeof step.description === 'string') {
      content = step.description
    }
    
    // If no content found, create default
    if (!content.trim()) {
      content = `<div class="default-content">
        <h3>${getStepTypeText(step.type)} ${index + 1}</h3>
        <p>This is ${step.type} content for step ${index + 1}.</p>
        <p>The content for this step will be available soon.</p>
      </div>`
    }
    
    return {
      type: step.type,
      title: step.title || `${getStepTypeText(step.type)} ${index + 1}`,
      data: {
        content: content,
        questions: step.questions || step.data?.questions || []
      }
    }
  }
  
  // ✅ NEW: Create default steps when none are found
  const createDefaultSteps = () => {
    console.log('🏗️ Creating default steps...')
    
    steps.value = [
      {
        type: 'explanation',
        title: lesson.value.lessonName || 'Lesson Content',
        data: {
          content: `
            <div class="lesson-content">
              <h2>📚 ${lesson.value.lessonName || 'Lesson'}</h2>
              <p>${lesson.value.description || 'Welcome to this lesson! Content is being prepared.'}</p>
              ${lesson.value.content ? `<div class="lesson-body">${lesson.value.content}</div>` : ''}
              <p><em>More interactive content will be added soon.</em></p>
            </div>
          `
        }
      }
    ]
    
    // Add a simple exercise if lesson has any exercise data
    if (lesson.value.exercises || lesson.value.exercise) {
      steps.value.push({
        type: 'exercise',
        title: 'Practice Exercise',
        data: lesson.value.exercises || lesson.value.exercise || [{
          type: 'short-answer',
          question: 'What did you learn from this lesson?',
          correctAnswer: 'Various answers accepted',
          points: 10
        }]
      })
    }
    
    console.log(`✅ Created ${steps.value.length} default steps`)
  }
  
  // Rest of the methods remain the same...
  const loadPreviousProgress = async () => {
    if (!lesson.value._id || !userId.value) {
      console.log('ℹ️ Skipping progress load - missing lessonId or userId');
      return;
    }
    
    try {
      console.log(`🔍 Loading progress for lesson: ${lesson.value._id}, user: ${userId.value}`);
      const progressResult = await getLessonProgress(userId.value, lesson.value._id)
      
      if (progressResult.success) {
        const progressData = progressResult.data
        
        if (progressData && progressData.completedSteps && progressData.completedSteps.length > 0) {
          console.log('✅ Found previous progress:', progressData);
          previousProgress.value = {
            _id: progressData._id,
            userId: progressData.userId,
            lessonId: progressData.lessonId,
            completedSteps: progressData.completedSteps || [],
            accuracy: progressData.accuracy || 0,
            completed: progressData.completed || false,
            duration: progressData.duration || 0,
            mistakes: progressData.mistakes || 0,
            points: progressData.points || 0,
            stars: progressData.stars || 0,
            hintsUsed: progressData.hintsUsed || 0,
            medal: progressData.medal || 'none'
          }
        } else {
          console.log('ℹ️ No previous progress found or progress is empty');
          previousProgress.value = null
        }
      } else {
        console.log('ℹ️ Progress request failed, starting fresh');
        previousProgress.value = null
      }
      
    } catch (err) {
      console.warn('⚠️ Failed to load previous progress:', err.message)
      console.log('ℹ️ Starting lesson without previous progress');
      previousProgress.value = null
    }
  }
  
  const saveProgress = async (completed = false) => {
    try {
      if (!userId.value || !lesson.value._id) {
        console.error('❌ Missing userId or lessonId for progress save')
        return false
      }

      const completedSteps = []
      if (started.value) {
        const maxIndex = Math.min(currentIndex.value, steps.value.length - 1)
        for (let i = 0; i <= maxIndex; i++) {
          completedSteps.push(i)
        }
      }

      const progressPercent = steps.value.length > 0 
        ? Math.floor((completedSteps.length / steps.value.length) * 100) 
        : 0

      const progressData = {
        userId: userId.value,
        lessonId: String(lesson.value._id),
        topicId: String(lesson.value.topicId || lesson.value._id),
        completedSteps: completedSteps,
        progressPercent: progressPercent,
        completed: completed,
        mistakes: mistakeCount.value,
        medal: mistakeCount.value === 0 ? 'gold' : mistakeCount.value <= 2 ? 'silver' : 'bronze',
        duration: elapsedSeconds.value,
        stars: stars.value,
        points: earnedPoints.value,
        hintsUsed: hintsUsed.value ? 1 : 0,
        submittedHomework: false
      }

      console.log('💾 Saving progress:', {
        lessonId: lesson.value._id,
        userId: userId.value,
        completedSteps: completedSteps.length,
        progressPercent,
        completed
      });

      const result = await submitProgress(userId.value, progressData)
      
      if (result.success) {
        console.log('✅ Progress saved successfully');
        return true
      } else {
        console.warn('⚠️ Progress save returned success: false');
        return true
      }
      
    } catch (err) {
      console.error('❌ Progress save error:', err.message)
      return true
    }
  }
  
  const autosaveProgress = async () => {
    try {
      const success = await saveProgress(false)
      if (!success) {
        setTimeout(() => autosaveProgress(), 30000)
      }
    } catch (error) {
      console.error('❌ Autosave error:', error)
    }
  }
  
  const startLesson = () => {
    started.value = true
    timerInterval.value = setInterval(() => elapsedSeconds.value++, 1000)
    autosaveTimer.value = setInterval(() => autosaveProgress(), 15000)
  }
  
  const continuePreviousProgress = () => {
    if (previousProgress.value) {
      currentIndex.value = Math.min(
        previousProgress.value.completedSteps.length, 
        steps.value.length - 1
      )
      stars.value = parseInt(previousProgress.value.stars) || 0
      mistakeCount.value = parseInt(previousProgress.value.mistakes) || 0
      elapsedSeconds.value = parseInt(previousProgress.value.duration) || 0
      hintsUsed.value = Boolean(previousProgress.value.hintsUsed)
      earnedPoints.value = parseInt(previousProgress.value.points) || 0
    }
    startLesson()
  }
  
  const goNext = () => {
    if (isLastStep.value) {
      completeLesson()
    } else {
      currentIndex.value++
    }
  }
  
  const goPrevious = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }
  
  const completeLesson = async () => {
    clearTimers()
    lessonCompleted.value = true
    showConfetti.value = true

    earnedPoints.value = Math.max(0, 100 - mistakeCount.value * 10 + stars.value * 5)

    if (mistakeCount.value === 0) {
      medalLabel.value = '🥇 Золотая медаль - Безупречно!'
    } else if (mistakeCount.value <= 2) {
      medalLabel.value = '🥈 Серебряная медаль - Отлично!'
    } else {
      medalLabel.value = '🥉 Бронзовая медаль - Хорошо!'
    }

    setTimeout(() => launchConfetti(), 200)
    await saveProgress(true)
  }
  
  const retryLoad = async () => {
    retryCount.value++
    await loadLesson()
  }
  
  const confirmExit = () => {
    showExitModal.value = true
  }
  
  const cancelExit = () => {
    showExitModal.value = false
  }
  
  const exitLesson = async () => {
    if (started.value && !lessonCompleted.value) {
      await saveProgress(false)
    }
    showExitModal.value = false
    router.push('/catalogue')
  }
  
  const clearTimers = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
    if (autosaveTimer.value) {
      clearInterval(autosaveTimer.value)
    }
  }
  
  const launchConfetti = () => {
    setTimeout(() => (showConfetti.value = false), 5000)
  }
  
  const handleLessonError = (error) => {
    if (error.message?.includes('not found')) {
      return 'Урок не найден. Проверьте ссылку или попробуйте перезагрузить страницу.'
    } else if (error.message?.includes('Authentication')) {
      return 'Необходимо войти в систему для доступа к уроку.'
    } else if (error.message?.includes('premium')) {
      return 'Этот урок доступен только для премиум-пользователей.'
    } else {
      return error.message || 'Произошла ошибка при загрузке урока.'
    }
  }
  
  const getStepIcon = (stepType) => {
    const icons = {
      explanation: '📚',
      example: '💡',
      reading: '📖',
      exercise: '✏️',
      practice: '🧪',
      quiz: '🧩',
      vocabulary: '📝',
      video: '🎬',
      audio: '🎵'
    }
    return icons[stepType] || '📄'
  }
  
  const getStepTypeText = (stepType) => {
    const texts = {
      explanation: 'Объяснение',
      example: 'Пример',
      reading: 'Чтение',
      exercise: 'Упражнение',
      practice: 'Практика',
      quiz: 'Викторина',
      vocabulary: 'Словарь',
      video: 'Видео',
      audio: 'Аудио'
    }
    return texts[stepType] || 'Контент'
  }
  
  const getMedalIcon = () => {
    if (mistakeCount.value === 0) return '🥇'
    if (mistakeCount.value <= 2) return '🥈'
    return '🥉'
  }
  
  const formatContent = (content) => {
    if (!content) return 'Контент недоступен'
    return content.replace(/\n/g, '<br>')
  }
  
  const getLocalized = (field) => {
    if (typeof field === 'string') return field
    return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim()
  }
  
  const initializeLesson = async () => {
    await waitForAuth()
    
    userId.value = localStorage.getItem('firebaseUserId') || 
                  localStorage.getItem('userId') || 
                  auth.currentUser?.uid
    
    if (!userId.value) {
      console.error('❌ No user ID found')
      router.push('/')
      return
    }
    
    if (!auth.currentUser) {
      console.error('❌ User not authenticated')
      router.push('/Login')
      return
    }
    
    await loadLesson()
    await loadPreviousProgress()
  }
  
  const cleanup = () => {
    clearTimers()
    if (started.value && !lessonCompleted.value) {
      saveProgress(false)
    }
  }
  
  // ✅ Lifecycle hooks
  onMounted(async () => {
    await initializeLesson()
  })
  
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    // Core state
    lesson,
    steps,
    currentIndex,
    started,
    loading,
    error,
    retryCount,
    
    // Progress state
    mistakeCount,
    stars,
    earnedPoints,
    hintsUsed,
    mistakeLog,
    previousProgress,
    
    // Completion state
    lessonCompleted,
    elapsedSeconds,
    showConfetti,
    showExitModal,
    medalLabel,
    
    // User state
    userId,
    
    // Computed
    currentStep,
    isInteractiveStep,
    progressPercentage,
    formattedTime,
    readableTime,
    isLastStep,
    estimatedTime,
    
    // Methods
    loadLesson,
    saveProgress,
    startLesson,
    continuePreviousProgress,
    goNext,
    goPrevious,
    completeLesson,
    retryLoad,
    confirmExit,
    cancelExit,
    exitLesson,
    getStepIcon,
    getStepTypeText,
    getMedalIcon,
    formatContent,
    getLocalized,
    initializeLesson,
    cleanup
  }
}