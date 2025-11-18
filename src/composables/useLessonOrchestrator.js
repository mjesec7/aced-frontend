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

    } catch (error) {
      // Error tracking guest lesson view
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
    return `${min} min ${sec} sec`
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
      return 'You have reached the limit of free lessons. Register to continue!'
    } else if (remaining <= 2) {
      return `You have ${remaining} free lessons remaining. Register for unlimited access!`
    }

    return ''
  })
  
  // ✅ MODIFIED: Authentication methods - now optional for guests
  const waitForAuth = async () => {
    // Skip auth wait for guest mode
    if (checkGuestMode()) {
      return
    }

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
            // Store update failed
          }
        }

        resolve()
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe()
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

      // ✅ Check if guest mode
      isGuestMode.value = checkGuestMode()
      
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

      // ✅ NEW: Check guest access restrictions
      if (isGuestMode.value) {
        const lessonType = lesson.value.type || route.query.type || 'free'
        
        // Check if lesson is premium and guest trying to access
        if (lessonType !== 'free' && lessonType !== 'public') {
          showPaywallModal.value = true
          error.value = 'This lesson is only available to registered users'
          loading.value = false
          return
        }

        // Check guest lesson limit
        if (checkGuestLimit()) {
          showPaywallModal.value = true
          error.value = 'You have reached the limit of free lessons'
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
        steps.value = [{
          type: 'explanation',
          data: { content: lesson.value.description || 'Lesson content not available' }
        }]
      }

    } catch (err) {
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
            content: `Content for ${step.type} step ${index + 1}`
          }
        }

        steps.value.push(processedStep)

      } catch (stepError) {
        steps.value.push({
          type: 'explanation',
          data: {
            content: `Error loading step ${index + 1}: ${stepError.message}`,
            error: true
          }
        })
      }
    })

    if (steps.value.length === 0) {
      steps.value.push({
        type: 'explanation',
        data: {
          content: lesson.value.description || 'Lesson temporarily unavailable'
        }
      })
    }
  }
  
  const processExerciseStep = (step, index) => {
    return {
      type: 'exercise',
      data: step.data || step.exercises || []
    }
  }
  
  const processQuizStep = (step, index) => {
    return {
      type: 'quiz',
      data: step.data || step.questions || []
    }
  }
  
  const processVocabularyStep = (step, index) => {
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
  }
  
  // ✅ MODIFIED: Progress management - handle guest progress
  const loadPreviousProgress = async () => {
    // ✅ NEW: Handle guest progress from localStorage
    if (isGuestMode.value) {
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
        }
      } catch (error) {
        // Error loading guest progress
      }
      return
    }

    // Regular authenticated user progress
    if (!lesson.value._id || !userId.value) {
      return
    }

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
  
  // ✅ MODIFIED: Save progress - handle guest saves
  const saveProgress = async (completed = false) => {
    try {
      // ✅ NEW: Save guest progress to localStorage
      if (isGuestMode.value) {
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
        return true
      }

      // Regular authenticated save
      if (!userId.value || !lesson.value._id) {
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
      // Autosave error
    }
  }
  
  // ✅ Lesson control methods
  const startLesson = () => {
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
      medalLabel.value = '🥇 Gold Medal - Perfect!'
    } else if (mistakeCount.value <= 2) {
      medalLabel.value = '🥈 Silver Medal - Excellent!'
    } else {
      medalLabel.value = '🥉 Bronze Medal - Good!'
    }

    setTimeout(() => launchConfetti(), 200)
    await saveProgress(true)
  }

  const retryLoad = async () => {
    retryCount.value++
    await loadLesson()
  }

  // ✅ MODIFIED: Modal controls - handle guest exit
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

    // ✅ MODIFIED: Different redirect for guests
    if (isGuestMode.value) {
      router.push({
        name: 'HomePage',
        query: { message: 'guest_lesson_exit' }
      })
    } else {
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
    setTimeout(() => (showConfetti.value = false), 5000)
  }
  
  // ✅ MODIFIED: Handle lesson error - add guest-specific messages
  const handleLessonError = (error) => {
    if (error.message?.includes('not found')) {
      return 'Lesson not found. Check the link or try reloading the page.'
    } else if (error.message?.includes('Invalid lesson ID')) {
      return 'Invalid lesson ID. Please check the link.'
    } else if (error.message?.includes('Authentication') && !isGuestMode.value) {
      return 'You need to log in to access this lesson.'
    } else if (error.message?.includes('premium') || error.message?.includes('subscription')) {
      return 'This lesson is only available to subscribers. Register to get access!'
    } else if (error.message?.includes('limit')) {
      return 'You have reached the limit of free lessons. Register to continue learning!'
    } else {
      return error.message || 'An error occurred while loading the lesson.'
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
      explanation: 'Explanation',
      example: 'Example',
      reading: 'Reading',
      exercise: 'Exercise',
      practice: 'Practice',
      quiz: 'Quiz',
      vocabulary: 'Vocabulary',
      video: 'Video',
      audio: 'Audio'
    }
    return texts[stepType] || 'Content'
  }
  
  const getMedalIcon = () => {
    if (mistakeCount.value === 0) return '🥇'
    if (mistakeCount.value <= 2) return '🥈'
    return '🥉'
  }
  
  const formatContent = (content) => {
    if (!content) return 'Content unavailable'
    return content.replace(/\n/g, '<br>')
  }
  
  const getLocalized = (field) => {
    if (typeof field === 'string') return field
    return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim()
  }
  
  // ✅ MODIFIED: Lifecycle management - support guest mode
  const initializeLesson = async () => {
    // ✅ Check guest mode first
    isGuestMode.value = checkGuestMode()

    if (!isGuestMode.value) {
      // Only wait for auth if not in guest mode
      await waitForAuth()

      userId.value = localStorage.getItem('firebaseUserId') ||
                    localStorage.getItem('userId') ||
                    auth.currentUser?.uid

      if (!userId.value) {
        isGuestMode.value = true
      }
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