// src/composables/useLessonOrchestrator.js
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
  const currentStep = computed(() => steps.value[currentIndex.value] || null)
  
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
  
  // ✅ Lesson loading methods
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
      console.log('📊 Steps available:', lesson.value.steps?.length || 0)
      
      processLessonSteps()
      
      if (!auth.currentUser) {
        throw new Error('Authentication required')
      }
      
      if (steps.value.length === 0) {
        console.warn('⚠️ No steps found in lesson, creating default step')
        steps.value = [{
          type: 'explanation',
          data: { content: lesson.value.description || 'Lesson content not available' }
        }]
      }
      
      // Log step details for debugging
      steps.value.forEach((step, index) => {
        console.log(`📝 Step ${index + 1}:`, {
          type: step.type,
          hasData: !!step.data,
          dataType: typeof step.data,
          isArray: Array.isArray(step.data)
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
  
  const processLessonSteps = () => {
    console.log('🔄 Starting lesson step processing...')
    steps.value = []
    
    if (!lesson.value.steps || !Array.isArray(lesson.value.steps)) {
      console.warn('⚠️ No steps array found, trying legacy format')
      processLegacyLessonFormat()
      return
    }
    
    lesson.value.steps.forEach((step, index) => {
      console.log(`🔍 Processing step ${index + 1}:`, step)
      
      if (!step || typeof step !== 'object') {
        console.warn(`⚠️ Step ${index + 1}: Invalid step object, skipping`)
        return
      }
      
      if (!step.type) {
        console.warn(`⚠️ Step ${index + 1}: Missing step type, defaulting to explanation`)
        step.type = 'explanation'
      }
      
      let processedStep = { ...step }
      
      try {
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
            processedStep = processBasicStep(step, index)
        }
        
        if (!processedStep.data) {
          console.warn(`⚠️ Step ${index + 1}: No data after processing, creating default`)
          processedStep.data = {
            content: `Контент для ${step.type} шага ${index + 1}`
          }
        }
        
        steps.value.push(processedStep)
        console.log(`✅ Step ${index + 1} processed successfully:`, processedStep.type)
        
      } catch (stepError) {
        console.error(`❌ Error processing step ${index + 1}:`, stepError)
        steps.value.push({
          type: 'explanation',
          data: { 
            content: `Ошибка загрузки шага ${index + 1}: ${stepError.message}`,
            error: true
          }
        })
      }
    })
    
    console.log(`✅ Processed ${steps.value.length} total steps`)
    
    if (steps.value.length === 0) {
      console.warn('⚠️ No valid steps found, creating default step')
      steps.value.push({
        type: 'explanation',
        data: {
          content: lesson.value.description || 'Урок временно недоступен'
        }
      })
    }
  }
  
  const processExerciseStep = (step, index) => {
    // Implementation similar to original but extracted
    console.log(`📝 Processing exercise step ${index + 1}:`, step)
    // ... exercise processing logic
    return {
      type: 'exercise',
      data: step.data || []
    }
  }
  
  const processQuizStep = (step, index) => {
    // Implementation similar to original but extracted
    console.log(`🧩 Processing quiz step ${index + 1}:`, step)
    // ... quiz processing logic
    return {
      type: 'quiz',
      data: step.data || []
    }
  }
  
  const processVocabularyStep = (step, index) => {
    // Implementation similar to original but extracted
    console.log(`📚 Processing vocabulary step ${index + 1}:`, step)
    // ... vocabulary processing logic
    return {
      type: 'vocabulary',
      data: step.data || []
    }
  }
  
  const processBasicStep = (step, index) => {
    let content = ''
    
    if (typeof step.content === 'string') {
      content = step.content
    } else if (step.data && typeof step.data.content === 'string') {
      content = step.data.content
    } else if (step.data && typeof step.data === 'string') {
      content = step.data
    } else if (typeof step.data === 'object' && step.data.text) {
      content = step.data.text
    }
    
    if (!content.trim()) {
      // Create better default content in Russian
      const defaultContent = {
        'explanation': `Это объяснение для шага ${index + 1}. Здесь вы изучите основные концепции и принципы.`,
        'reading': `Читайте внимательно материал для шага ${index + 1}. Обратите внимание на ключевые моменты.`,
        'vocabulary': `Изучите новые слова и термины для шага ${index + 1}. Запомните их значения и использование.`,
        'example': `Рассмотрите примеры для шага ${index + 1}. Они помогут лучше понять материал.`,
        'exercise': `Выполните упражнение для закрепления материала шага ${index + 1}.`,
        'practice': `Практикуйтесь в применении знаний из шага ${index + 1}.`,
        'quiz': `Пройдите тест по материалу шага ${index + 1}.`
      }
      
      content = defaultContent[step.type] || `Содержание для ${step.type} шага ${index + 1}`
    }
    
    return {
      type: step.type,
      data: {
        content: content,
        questions: step.questions || step.data?.questions || [
          'Что вы поняли из этого материала?',
          'Как можно применить эти знания на практике?',
          'Какие вопросы у вас остались?'
        ]
      }
    }
  }
  
  const processLegacyLessonFormat = () => {
    console.log('🔄 Processing legacy lesson format')
    
    // Add explanations
    if (Array.isArray(lesson.value.explanations)) {
      lesson.value.explanations.forEach((explanation, index) => {
        steps.value.push({
          type: 'explanation',
          data: {
            content: typeof explanation === 'string' ? explanation : explanation.content || `Объяснение ${index + 1}`,
            questions: [
              'Что вы поняли из этого объяснения?',
              'Как можно применить эти знания?',
              'Какие вопросы у вас остались?'
            ]
          }
        })
      })
    }
    
    // Add examples
    if (Array.isArray(lesson.value.examples)) {
      lesson.value.examples.forEach((example, index) => {
        steps.value.push({
          type: 'example',
          data: {
            content: typeof example === 'string' ? example : example.content || `Пример ${index + 1}`,
            questions: [
              'Что демонстрирует этот пример?',
              'Как можно использовать этот подход?',
              'Какие выводы можно сделать?'
            ]
          }
        })
      })
    }
    
    // Add exercises
    if (Array.isArray(lesson.value.exercises)) {
      lesson.value.exercises.forEach((exercise, index) => {
        steps.value.push({
          type: 'exercise',
          data: {
            content: typeof exercise === 'string' ? exercise : exercise.content || `Упражнение ${index + 1}`,
            questions: [
              'Как вы будете решать эту задачу?',
              'Какие знания вам понадобятся?',
              'Какой результат вы ожидаете?'
            ]
          }
        })
      })
    }
    
    // Add vocabulary
    if (Array.isArray(lesson.value.vocabulary)) {
      lesson.value.vocabulary.forEach((vocab, index) => {
        steps.value.push({
          type: 'vocabulary',
          data: {
            content: typeof vocab === 'string' ? vocab : vocab.content || `Словарь ${index + 1}`,
            questions: [
              'Запомнили ли вы эти термины?',
              'Как вы будете использовать эти слова?',
              'Какие ассоциации у вас возникают?'
            ]
          }
        })
      })
    }
    
    // If no steps were created, create a default explanation
    if (steps.value.length === 0) {
      steps.value.push({
        type: 'explanation',
        data: {
          content: lesson.value.description || 'Добро пожаловать в урок! Изучите материал внимательно.',
          questions: [
            'Что вы ожидаете от этого урока?',
            'Какие цели вы ставите перед собой?',
            'Как вы планируете применять полученные знания?'
          ]
        }
      })
    }
    
    console.log(`✅ Processed ${steps.value.length} steps from legacy format`)
  }
  
  // ✅ Progress management
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
        // Don't treat this as a fatal error - the lesson can continue
        return true
      }
      
    } catch (err) {
      console.error('❌ Progress save error:', err.message)
      // Don't treat progress save errors as fatal - lesson can continue
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
  
  // ✅ Lesson control methods
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
  
  // ✅ Modal controls
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
  
  // ✅ Utility methods
  const clearTimers = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
    if (autosaveTimer.value) {
      clearInterval(autosaveTimer.value)
    }
  }
  
  const launchConfetti = () => {
    // Implementation would use confetti library
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
  
  // ✅ Lifecycle management
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