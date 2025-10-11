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
  
  // ✅ NEW: Guest mode state
  const isGuestMode = ref(false)
  const showPaywallModal = ref(false)
  const guestLessonLimit = ref(3) // Number of free lessons for guests
  const guestLessonsViewed = ref(0)
  
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
  
  // ✅ NEW: Check if user is in guest mode
  const checkGuestMode = () => {
    // Check multiple sources for guest mode
    const hasGuestQuery = route.query.guest === 'true'
    const hasAuthToken = !!localStorage.getItem('authToken')
    const hasFirebaseUser = !!auth.currentUser
    const isFreeType = route.query.type === 'free'
    
    const isGuest = hasGuestQuery || (!hasAuthToken && !hasFirebaseUser) || isFreeType
    
    console.log('🔐 Guest mode check:', {
      hasGuestQuery,
      hasAuthToken,
      hasFirebaseUser,
      isFreeType,
      result: isGuest
    })
    
    return isGuest
  }
  
  // ✅ NEW: Track guest lesson views
  const trackGuestLessonView = () => {
    try {
      const guestData = JSON.parse(localStorage.getItem('guestLessonData') || '{}')
      const lessonId = lesson.value._id
      
      if (!guestData.viewedLessons) {
        guestData.viewedLessons = []
      }
      
      if (!guestData.viewedLessons.includes(lessonId)) {
        guestData.viewedLessons.push(lessonId)
        guestData.lastViewed = Date.now()
      }
      
      localStorage.setItem('guestLessonData', JSON.stringify(guestData))
      guestLessonsViewed.value = guestData.viewedLessons.length
      
      console.log('📊 Guest lessons viewed:', guestLessonsViewed.value, '/', guestLessonLimit.value)
      
    } catch (error) {
      console.error('Error tracking guest lesson view:', error)
    }
  }
  
  // ✅ NEW: Check if guest has reached limit
  const checkGuestLimit = () => {
    if (!isGuestMode.value) return false
    
    try {
      const guestData = JSON.parse(localStorage.getItem('guestLessonData') || '{}')
      const viewedCount = guestData.viewedLessons?.length || 0
      
      return viewedCount >= guestLessonLimit.value
    } catch (error) {
      return false
    }
  }
  
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
  
  // ✅ NEW: Guest-specific computed properties
  const canAccessLesson = computed(() => {
    if (!isGuestMode.value) return true
    
    const lessonType = lesson.value.type || route.query.type || 'free'
    const isFree = lessonType === 'free'
    const withinLimit = !checkGuestLimit()
    
    return isFree || withinLimit
  })
  
  const guestAccessMessage = computed(() => {
    if (!isGuestMode.value) return ''
    
    const remaining = Math.max(0, guestLessonLimit.value - guestLessonsViewed.value)
    
    if (remaining === 0) {
      return 'Вы достигли лимита бесплатных уроков. Зарегистрируйтесь для продолжения!'
    } else if (remaining <= 2) {
      return `У вас осталось ${remaining} бесплатных урока. Зарегистрируйтесь для неограниченного доступа!`
    }
    
    return ''
  })
  
  // ✅ MODIFIED: Authentication methods - now optional for guests
  const waitForAuth = async () => {
    // Skip auth wait for guest mode
    if (checkGuestMode()) {
      console.log('🆓 Guest mode detected, skipping auth wait')
      return
    }
    
    if (auth.currentUser) {
      console.log('✅ User already authenticated')
      return
    }
    
    console.log('⏳ Waiting for authentication...')
    
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe()
        
        if (user) {
          console.log('✅ User authenticated:', user.uid)
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
            console.warn('⚠️ Store update failed:', storeError)
          }
        } else {
          console.log('⚠️ No authenticated user')
        }
        
        resolve()
      })
      
      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe()
        console.log('⏱️ Auth wait timeout')
        resolve()
      }, 5000)
    })
  }
  
  // ✅ MODIFIED: Lesson loading methods - support guest access
  const loadLesson = async () => {
    try {
      const lessonId = route.params.id
      
      if (!lessonId || lessonId === 'null' || lessonId === 'undefined') {
        throw new Error('Invalid lesson ID')
      }
      
      loading.value = true
      error.value = null
      
      console.log('📚 Loading lesson:', lessonId)
      
      // ✅ Check if guest mode
      isGuestMode.value = checkGuestMode()
      
      console.log('🔐 Loading mode:', isGuestMode.value ? 'GUEST' : 'AUTHENTICATED')
      
      // ✅ Load lesson data
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
      
      console.log('✅ Lesson loaded:', lesson.value.lessonName || lesson.value.title)
      console.log('📊 Lesson type:', lesson.value.type)
      
      // ✅ NEW: Check guest access restrictions
      if (isGuestMode.value) {
        const lessonType = lesson.value.type || route.query.type || 'free'
        
        // Check if lesson is premium and guest trying to access
        if (lessonType !== 'free' && lessonType !== 'public') {
          console.warn('⚠️ Guest trying to access premium content:', lessonType)
          showPaywallModal.value = true
          error.value = 'Этот урок доступен только для зарегистрированных пользователей'
          loading.value = false
          return
        }
        
        // Check guest lesson limit
        if (checkGuestLimit()) {
          console.warn('⚠️ Guest has reached lesson limit')
          showPaywallModal.value = true
          error.value = 'Вы достигли лимита бесплатных уроков'
          loading.value = false
          return
        }
        
        // Track guest lesson view
        trackGuestLessonView()
      }
      
      // Process lesson steps
      processLessonSteps()
      
      // ✅ REMOVED: Don't require auth for guest mode
      // The old code had: if (!auth.currentUser) { throw new Error('Authentication required') }
      
      if (steps.value.length === 0) {
        console.warn('⚠️ No steps found, creating default step')
        steps.value = [{
          type: 'explanation',
          data: { content: lesson.value.description || 'Lesson content not available' }
        }]
      }
      
      console.log('✅ Processed', steps.value.length, 'steps')
      
      // Log step details for debugging
      steps.value.forEach((step, index) => {
        console.log(`  Step ${index + 1}: ${step.type}`, step.data ? '✓' : '✗')
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
      console.log('📝 No steps array found, using legacy format')
      processLegacyLessonFormat()
      return
    }
    
    console.log('📝 Processing', lesson.value.steps.length, 'steps')
    
    lesson.value.steps.forEach((step, index) => {
      if (!step || typeof step !== 'object') {
        console.warn(`⚠️ Invalid step at index ${index}`)
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
      console.warn('⚠️ No valid steps processed')
      steps.value.push({
        type: 'explanation',
        data: {
          content: lesson.value.description || 'Урок временно недоступен'
        }
      })
    }
  }
  
  const processExerciseStep = (step, index) => {
    console.log(`Processing exercise step ${index + 1}`)
    return {
      type: 'exercise',
      data: step.data || step.exercises || []
    }
  }
  
  const processQuizStep = (step, index) => {
    console.log(`Processing quiz step ${index + 1}`)
    return {
      type: 'quiz',
      data: step.data || step.questions || []
    }
  }
  
  const processVocabularyStep = (step, index) => {
    console.log(`Processing vocabulary step ${index + 1}`)
    return {
      type: 'vocabulary',
      data: step.data || step.words || []
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
    console.log('📝 Processing legacy lesson format')
    
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
    
    // Add examples
    if (Array.isArray(lesson.value.examples)) {
      lesson.value.examples.forEach(example => {
        steps.value.push({
          type: 'example',
          data: {
            content: typeof example === 'string' ? example : example.content || ''
          }
        })
      })
    }
    
    // Add exercises
    if (Array.isArray(lesson.value.exercises)) {
      steps.value.push({
        type: 'exercise',
        data: lesson.value.exercises
      })
    }
    
    console.log('✅ Processed legacy format:', steps.value.length, 'steps')
  }
  
  // ✅ MODIFIED: Progress management - handle guest progress
  const loadPreviousProgress = async () => {
    // ✅ NEW: Handle guest progress from localStorage
    if (isGuestMode.value) {
      console.log('🆓 Guest mode: Loading progress from localStorage')
      try {
        const guestProgress = JSON.parse(localStorage.getItem('guestProgress') || '{}')
        const lessonProgress = guestProgress[lesson.value._id]
        
        if (lessonProgress) {
          previousProgress.value = {
            completedSteps: lessonProgress.completedSteps || [],
            mistakes: lessonProgress.mistakes || 0,
            stars: lessonProgress.stars || 0,
            duration: lessonProgress.elapsedSeconds || 0,
            currentStep: lessonProgress.currentStep || 0
          }
          console.log('✅ Guest progress loaded:', previousProgress.value)
        } else {
          console.log('📝 No previous guest progress found')
        }
      } catch (error) {
        console.error('❌ Error loading guest progress:', error)
      }
      return
    }
    
    // Regular authenticated user progress
    if (!lesson.value._id || !userId.value) {
      console.log('⚠️ Cannot load progress: missing lessonId or userId')
      return
    }
    
    try {
      console.log('📊 Loading progress for user:', userId.value)
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
          console.log('✅ Progress loaded:', previousProgress.value)
        } else {
          previousProgress.value = null
          console.log('📝 No previous progress found')
        }
      } else {
        previousProgress.value = null
        console.log('📝 No progress data available')
      }
      
    } catch (err) {
      console.warn('⚠️ Could not load previous progress:', err)
      previousProgress.value = null
    }
  }
  
  // ✅ MODIFIED: Save progress - handle guest saves
  const saveProgress = async (completed = false) => {
    try {
      // ✅ NEW: Save guest progress to localStorage
      if (isGuestMode.value) {
        console.log('💾 Saving guest progress to localStorage')
        
        const guestProgress = JSON.parse(localStorage.getItem('guestProgress') || '{}')
        
        const completedSteps = []
        if (started.value) {
          const maxIndex = Math.min(currentIndex.value, steps.value.length - 1)
          for (let i = 0; i <= maxIndex; i++) {
            completedSteps.push(i)
          }
        }
        
        guestProgress[lesson.value._id] = {
          lessonId: lesson.value._id,
          lessonName: lesson.value.lessonName || lesson.value.title,
          currentStep: currentIndex.value,
          completedSteps: completedSteps,
          mistakes: mistakeCount.value,
          stars: stars.value,
          elapsedSeconds: elapsedSeconds.value,
          completed: completed,
          timestamp: Date.now()
        }
        
        localStorage.setItem('guestProgress', JSON.stringify(guestProgress))
        console.log('✅ Guest progress saved to localStorage')
        return true
      }
      
      // Regular authenticated save
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

      console.log('💾 Saving progress to server:', progressData)

      const result = await submitProgress(userId.value, progressData)
      
      if (result.success) {
        console.log('✅ Progress saved to server')
        return true
      } else {
        console.warn('⚠️ Progress save failed')
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
        // Retry after 30 seconds if save failed
        setTimeout(() => autosaveProgress(), 30000)
      }
    } catch (error) {
      console.error('❌ Autosave error:', error)
    }
  }
  
  // ✅ Lesson control methods
  const startLesson = () => {
    console.log('▶️ Starting lesson')
    started.value = true
    timerInterval.value = setInterval(() => elapsedSeconds.value++, 1000)
    
    // ✅ Only autosave for authenticated users
    if (!isGuestMode.value) {
      autosaveTimer.value = setInterval(() => autosaveProgress(), 15000)
    } else {
      // For guests, save periodically to localStorage
      autosaveTimer.value = setInterval(() => saveProgress(false), 30000)
    }
  }
  
  const continuePreviousProgress = () => {
    console.log('⏩ Continuing from previous progress')
    if (previousProgress.value) {
      currentIndex.value = Math.min(
        previousProgress.value.completedSteps?.length || previousProgress.value.currentStep || 0, 
        steps.value.length - 1
      )
      stars.value = parseInt(previousProgress.value.stars) || 0
      mistakeCount.value = parseInt(previousProgress.value.mistakes) || 0
      elapsedSeconds.value = parseInt(previousProgress.value.duration) || 0
      hintsUsed.value = Boolean(previousProgress.value.hintsUsed)
      earnedPoints.value = parseInt(previousProgress.value.points) || 0
      
      console.log('✅ Progress restored:', {
        currentIndex: currentIndex.value,
        stars: stars.value,
        mistakes: mistakeCount.value
      })
    }
    startLesson()
  }
  
  const goNext = () => {
    if (isLastStep.value) {
      completeLesson()
    } else {
      currentIndex.value++
      console.log('➡️ Next step:', currentIndex.value + 1, '/', steps.value.length)
    }
  }
  
  const goPrevious = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--
      console.log('⬅️ Previous step:', currentIndex.value + 1, '/', steps.value.length)
    }
  }
  
  const completeLesson = async () => {
    console.log('🎉 Completing lesson')
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
    
    console.log('✅ Lesson completed:', {
      mistakes: mistakeCount.value,
      stars: stars.value,
      points: earnedPoints.value,
      time: formattedTime.value
    })
  }
  
  const retryLoad = async () => {
    console.log('🔄 Retrying lesson load, attempt:', retryCount.value + 1)
    retryCount.value++
    await loadLesson()
  }
  
  // ✅ MODIFIED: Modal controls - handle guest exit
  const confirmExit = () => {
    console.log('🚪 Confirming exit')
    showExitModal.value = true
  }
  
  const cancelExit = () => {
    console.log('❌ Canceling exit')
    showExitModal.value = false
  }
  
  const exitLesson = async () => {
    console.log('👋 Exiting lesson')
    if (started.value && !lessonCompleted.value) {
      await saveProgress(false)
    }
    showExitModal.value = false
    
    // ✅ MODIFIED: Different redirect for guests
    if (isGuestMode.value) {
      console.log('🆓 Guest user exiting, redirecting to home')
      router.push({ 
        name: 'HomePage',
        query: { message: 'guest_lesson_exit' }
      })
    } else {
      console.log('👤 Authenticated user exiting, redirecting to catalogue')
      router.push('/profile/catalogue')
    }
  }
  
  // ✅ NEW: Show registration/paywall modal for guests
  const showRegistrationPrompt = () => {
    showPaywallModal.value = true
  }
  
  const closePaywallModal = () => {
    showPaywallModal.value = false
  }
  
  const redirectToRegistration = () => {
    router.push({
      name: 'HomePage',
      query: { 
        openLogin: 'true',
        returnTo: route.fullPath
      }
    })
  }
  
  // ✅ Utility methods
  const clearTimers = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    if (autosaveTimer.value) {
      clearInterval(autosaveTimer.value)
      autosaveTimer.value = null
    }
  }
  
  const launchConfetti = () => {
    // Implementation would use confetti library
    console.log('🎊 Launching confetti')
    setTimeout(() => (showConfetti.value = false), 5000)
  }
  
  // ✅ MODIFIED: Handle lesson error - add guest-specific messages
  const handleLessonError = (error) => {
    if (error.message?.includes('not found')) {
      return 'Урок не найден. Проверьте ссылку или попробуйте перезагрузить страницу.'
    } else if (error.message?.includes('Invalid lesson ID')) {
      return 'Неверный ID урока. Пожалуйста, проверьте ссылку.'
    } else if (error.message?.includes('Authentication') && !isGuestMode.value) {
      return 'Необходимо войти в систему для доступа к уроку.'
    } else if (error.message?.includes('premium') || error.message?.includes('subscription')) {
      return 'Этот урок доступен только для подписчиков. Зарегистрируйтесь для получения доступа!'
    } else if (error.message?.includes('limit')) {
      return 'Вы достигли лимита бесплатных уроков. Зарегистрируйтесь для продолжения обучения!'
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
  
  // ✅ MODIFIED: Lifecycle management - support guest mode
  const initializeLesson = async () => {
    console.log('🚀 Initializing lesson orchestrator')
    
    // ✅ Check guest mode first
    isGuestMode.value = checkGuestMode()
    
    console.log('🔐 Mode:', isGuestMode.value ? 'GUEST' : 'AUTHENTICATED')
    
    if (!isGuestMode.value) {
      // Only wait for auth if not in guest mode
      await waitForAuth()
      
      userId.value = localStorage.getItem('firebaseUserId') || 
                    localStorage.getItem('userId') || 
                    auth.currentUser?.uid
      
      if (!userId.value) {
        console.warn('⚠️ No user ID found, switching to guest mode')
        isGuestMode.value = true
      } else {
        console.log('✅ User ID:', userId.value)
      }
    } else {
      console.log('🆓 Guest mode - skipping authentication')
    }
    
    // ✅ Load lesson (works for both guests and authenticated users)
    await loadLesson()
    
    // ✅ Only proceed if lesson loaded successfully
    if (!error.value) {
      // ✅ Load previous progress (works for both)
      await loadPreviousProgress()
    }
  }
  
  const cleanup = () => {
    console.log('🧹 Cleaning up lesson orchestrator')
    clearTimers()
    if (started.value && !lessonCompleted.value) {
      saveProgress(false)
    }
  }
  
  // ✅ Lifecycle hooks
  onMounted(async () => {
    console.log('📱 LessonOrchestrator mounted')
    await initializeLesson()
  })
  
  onUnmounted(() => {
    console.log('📴 LessonOrchestrator unmounted')
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
    
    // ✅ NEW: Guest mode state
    isGuestMode,
    showPaywallModal,
    guestLessonLimit,
    guestLessonsViewed,
    
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
    canAccessLesson,
    guestAccessMessage,
    
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
    showRegistrationPrompt,
    closePaywallModal,
    redirectToRegistration,
    checkGuestMode,
    trackGuestLessonView,
    checkGuestLimit,
    getStepIcon,
    getStepTypeText,
    getMedalIcon,
    formatContent,
    getLocalized,
    initializeLesson,
    cleanup
  }
}