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
          }
        }
        
        resolve()
      })
      
      setTimeout(() => {
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

      
      processLessonSteps()
      
      if (!auth.currentUser) {
        throw new Error('Authentication required')
      }
      
      if (steps.value.length === 0) {
        steps.value = [{
          type: 'explanation',
          data: { content: lesson.value.description || 'Lesson content not available' }
        }]
      }
      
      // Log step details for debugging
      steps.value.forEach((step, index) => {
    
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
    steps.value = []
    
    if (!lesson.value.steps || !Array.isArray(lesson.value.steps)) {
      processLegacyLessonFormat()
      return
    }
    
    lesson.value.steps.forEach((step, index) => {
      
      if (!step || typeof step !== 'object') {
        return
      }
      
      if (!step.type) {
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
          processedStep.data = {
            content: `Контент для ${step.type} шага ${index + 1}`
          }
        }
        
        steps.value.push(processedStep)
        
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
    
    
    if (steps.value.length === 0) {
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
    // ... exercise processing logic
    return {
      type: 'exercise',
      data: step.data || []
    }
  }
  
  const processQuizStep = (step, index) => {
    // Implementation similar to original but extracted
    // ... quiz processing logic
    return {
      type: 'quiz',
      data: step.data || []
    }
  }
  
  const processVocabularyStep = (step, index) => {
    // Implementation similar to original but extracted
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
      content = `Content for ${step.type} step ${index + 1}`
    }
    
    return {
      type: step.type,
      data: {
        content: content,
        questions: step.questions || step.data?.questions || []
      }
    }
  }
  
  const processLegacyLessonFormat = () => {
    
    // Add explanations
    if (Array.isArray(lesson.value.explanations)) {
      lesson.value.explanations.forEach(explanation => {
        steps.value.push({
          type: 'explanation',
          data: {
            content: typeof explanation === 'string' ? explanation : explanation.content || ''
          }
        })
      })
    }
    
  
    
  }
  
  // ✅ Progress management
  const loadPreviousProgress = async () => {
    if (!lesson.value._id || !userId.value) return
    
    try {
      const progressResult = await getLessonProgress(userId.value, lesson.value._id)
      
      if (progressResult.success && progressResult.data) {
        const progressData = progressResult.data
        
        if (progressData.completedSteps && progressData.completedSteps.length > 0) {
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
          previousProgress.value = null
        }
      } else {
        previousProgress.value = null
      }
      
    } catch (err) {
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

      const result = await submitProgress(userId.value, progressData)
      
      if (result.success) {
        return true
      } else {
        return false
      }
      
    } catch (err) {
      console.error('❌ Progress save error:', err)
      return false
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