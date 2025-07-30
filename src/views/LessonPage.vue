<template>
  <div class="lesson-page">
    <!-- Loading Screen -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <h3>Loading lesson...</h3>
        <p>Preparing your learning experience</p>
      </div>
    </div>

    <!-- Error Screen -->
    <div v-else-if="error" class="error-screen">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button @click="retryLoad" class="btn btn-primary">
            <span class="btn-icon">🔄</span>
            Try Again
          </button>
          <button @click="handleReturnToCatalogue" class="btn btn-secondary">
            <span class="btn-icon">🏠</span>
            Back to Catalogue
          </button>
        </div>
      </div>
    </div>

    <!-- Debug Info (Development Only) -->
    <div v-if="isDevelopment && !loading && !error" class="debug-panel">
      <details>
        <summary>🐛 Debug Info</summary>
        <div class="debug-content">
          <h4>Lesson Data:</h4>
          <pre>{{ debugInfo }}</pre>
          <h4>Current Step:</h4>
          <pre>{{ JSON.stringify(currentStep, null, 2) }}</pre>
          <h4>Composables Status:</h4>
          <ul>
            <li>Orchestrator: {{ orchestratorLoaded ? '✅' : '❌' }}</li>
            <li>Exercises: {{ exercisesLoaded ? '✅' : '❌' }}</li>
            <li>Steps Count: {{ steps.length }}</li>
            <li>Current Index: {{ currentIndex }}</li>
          </ul>
        </div>
      </details>
    </div>

    <!-- Exit Modal -->
    <div v-if="showExitModal" class="modal-overlay">
      <div class="exit-modal">
        <div class="modal-header">
          <h2>👋 Leaving so soon?</h2>
        </div>
        <div class="modal-body">
          <p>Your progress will be saved automatically.</p>
          <div class="progress-preview">
            <div class="progress-stats">
              <div class="stat">
                <span class="stat-value">{{ progressPercentage }}%</span>
                <span class="stat-label">Completed</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ stars }}</span>
                <span class="stat-label">Stars</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="exitLesson" class="btn btn-primary">
            <span class="btn-icon">🚪</span>
            Yes, Exit
          </button>
          <button @click="cancelExit" class="btn btn-secondary">
            <span class="btn-icon">📚</span>
            Continue Learning
          </button>
        </div>
      </div>
    </div>

    <!-- Lesson Intro -->
    <LessonIntro
      v-if="!started && !loading && !error && lesson.lessonName"
      :lesson="lesson"
      :steps="steps"
      :estimated-time="estimatedTime"
      :previous-progress="previousProgress"
      @start="startLesson"
      @continue="continuePreviousProgress"
      @exit="confirmExit"
    />

    <!-- Main Lesson Content -->
    <div v-else-if="started && !loading && !error" class="lesson-container">
      <!-- Lesson Header -->
      <LessonHeader
        :lesson="lesson"
        :current-step="currentIndex + 1"
        :total-steps="steps.length"
        :formatted-time="formattedTime"
        :stars="stars"
        @exit="confirmExit"
      />

      <!-- Progress Bar -->
      <ProgressBar
        :progress-percentage="progressPercentage"
        :stars="stars"
        :current-step="currentIndex"
        :total-steps="steps.length"
      />

      <!-- Split Screen Container -->
      <div class="split-container">
        <div 
          class="split-content"
          :class="{
            'both-panels': showContentPanel && showInteractivePanel,
            'content-only': showContentPanel && !showInteractivePanel,
            'interactive-only': !showContentPanel && showInteractivePanel
          }"
        >
          <!-- Content Panel (Left Side) -->
          <ContentPanel
            v-if="showContentPanel"
            :current-step="currentStep"
            :current-index="currentIndex"
            :total-steps="steps.length"
            :is-last-step="isLastStep"
            :style="contentPanelStyle"
            @previous="goPrevious"
            @next="goNext"
            @complete="goNext"
            @pronounce="pronounceContent"
            @init-vocabulary="() => {}"
          />

          <!-- Resize Handle -->
          <div 
            v-if="showContentPanel && showInteractivePanel"
            class="resize-handle vertical-handle"
            @mousedown="startResize"
            @dblclick="resetToDefault"
            tabindex="0"
            role="separator"
            aria-label="Resize panels"
          >
            <div class="resize-grip">
              <div class="grip-dots">
                <span class="grip-dot"></span>
                <span class="grip-dot"></span>
                <span class="grip-dot"></span>
              </div>
            </div>
          </div>

          <!-- Interactive Panel (Right Side) -->
          <InteractivePanel
            v-if="showInteractivePanel"
            :current-exercise="getCurrentExercise(currentStep)"
            :exercise-index="0"
            :total-exercises="1"
            :earned-points="earnedPoints"
            :style="interactivePanelStyle"
            @submit="handleSubmit"
            @next-exercise="goNext"
            @show-hint="() => {}"
          />
        </div>
      </div>
    </div>

    <!-- Completion Screen -->
    <CompletionScreen
      v-if="lessonCompleted"
      :readable-time="readableTime"
      :stars="stars"
      :mistake-count="mistakeCount"
      :earned-points="earnedPoints"
      :medal-label="medalLabel"
      :medal-icon="getMedalIcon()"
      @return-to-catalogue="handleReturnToCatalogue"
      @go-to-homework="handleGoToHomework"
      @share-result="shareResult"
    />

    <!-- Notifications -->
    <div v-if="notifications.length" class="notification-system">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification"
        :class="notification.type"
        @click="closeNotification(notification.id)"
      >
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'error'">❌</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="notification-content">
          <span class="notification-message">{{ notification.message }}</span>
        </div>
        <button class="notification-close">✕</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/firebase'
import { 
  getLessonById, 
  getLessonProgress, 
  submitProgress,
  withErrorHandling
} from '@/api'

// Import available components (these should exist)
import LessonIntro from '@/components/lesson/LessonIntro.vue'
import LessonHeader from '@/components/lesson/LessonHeader.vue'
import ProgressBar from '@/components/lesson/ProgressBar.vue'
import ContentPanel from '@/components/lesson/ContentPanel.vue'
import InteractivePanel from '@/components/lesson/InteractivePanel.vue'
import CompletionScreen from '@/components/lesson/CompletionScreen.vue'

// Safe imports with fallbacks
let useLessonOrchestrator, useExercises
try {
  const orchestratorModule = require('@/composables/useLessonOrchestrator')
  useLessonOrchestrator = orchestratorModule.useLessonOrchestrator
} catch (error) {
  console.warn('⚠️ useLessonOrchestrator not found, using fallback')
}

try {
  const exercisesModule = require('@/composables/useExercises')
  useExercises = exercisesModule.useExercises
} catch (error) {
  console.warn('⚠️ useExercises not found, using fallback')
}

export default {
  name: 'LessonPage',

  components: {
    LessonIntro,
    LessonHeader,
    ProgressBar,
    ContentPanel,
    InteractivePanel,
    CompletionScreen
  },

  setup() {
    const route = useRoute()
    const router = useRouter()

    // ==========================================
    // CORE STATE (FALLBACK IMPLEMENTATION)
    // ==========================================
    const lesson = ref({})
    const steps = ref([])
    const currentIndex = ref(0)
    const started = ref(false)
    const loading = ref(true)
    const error = ref(null)
    const retryCount = ref(0)
    
    // Progress state
    const mistakeCount = ref(0)
    const stars = ref(0)
    const earnedPoints = ref(0)
    const hintsUsed = ref(false)
    const previousProgress = ref(null)
    
    // Completion state
    const lessonCompleted = ref(false)
    const elapsedSeconds = ref(0)
    const showExitModal = ref(false)
    const medalLabel = ref('')
    
    // UI state
    const notifications = ref([])
    const timerInterval = ref(null)
    const userId = ref(null)

    // ==========================================
    // COMPOSABLES (WITH FALLBACKS)
    // ==========================================
    const orchestratorLoaded = ref(false)
    const exercisesLoaded = ref(false)

    let orchestrator = null
    let exercises = null

    if (useLessonOrchestrator && typeof useLessonOrchestrator === 'function') {
      try {
        orchestrator = useLessonOrchestrator()
        orchestratorLoaded.value = true
        console.log('✅ useLessonOrchestrator loaded successfully')
      } catch (error) {
        console.error('❌ Error initializing useLessonOrchestrator:', error)
      }
    }

    if (useExercises && typeof useExercises === 'function') {
      try {
        exercises = useExercises()
        exercisesLoaded.value = true
        console.log('✅ useExercises loaded successfully')
      } catch (error) {
        console.error('❌ Error initializing useExercises:', error)
      }
    }

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================
    const isDevelopment = computed(() => {
      return process.env.NODE_ENV === 'development'
    })

    const currentStep = computed(() => {
      if (orchestrator && orchestrator.currentStep) {
        return orchestrator.currentStep.value
      }
      if (!steps.value || steps.value.length === 0) return null
      return steps.value[currentIndex.value] || null
    })

    const progressPercentage = computed(() => {
      if (orchestrator && orchestrator.progressPercentage) {
        return orchestrator.progressPercentage.value
      }
      if (steps.value.length === 0) return 0
      const completed = Math.min(currentIndex.value + 1, steps.value.length)
      return Math.floor((completed / steps.value.length) * 100)
    })

    const formattedTime = computed(() => {
      if (orchestrator && orchestrator.formattedTime) {
        return orchestrator.formattedTime.value
      }
      const min = Math.floor(elapsedSeconds.value / 60)
      const sec = elapsedSeconds.value % 60
      return `${min}:${sec < 10 ? '0' : ''}${sec}`
    })

    const readableTime = computed(() => {
      if (orchestrator && orchestrator.readableTime) {
        return orchestrator.readableTime.value
      }
      const min = Math.floor(elapsedSeconds.value / 60)
      const sec = elapsedSeconds.value % 60
      return `${min} мин ${sec} сек`
    })

    const isLastStep = computed(() => {
      if (orchestrator && orchestrator.isLastStep) {
        return orchestrator.isLastStep.value
      }
      return currentIndex.value >= steps.value.length - 1
    })

    const estimatedTime = computed(() => {
      if (orchestrator && orchestrator.estimatedTime) {
        return orchestrator.estimatedTime.value
      }
      return lesson.value.metadata?.estimatedDuration || Math.max(5, steps.value.length * 2)
    })

    const debugInfo = computed(() => {
      return {
        lessonName: lesson.value.lessonName,
        stepsCount: steps.value.length,
        currentIndex: currentIndex.value,
        orchestratorLoaded: orchestratorLoaded.value,
        exercisesLoaded: exercisesLoaded.value,
        currentStepType: currentStep.value?.type,
        currentStepHasData: !!currentStep.value?.data
      }
    })

    const showContentPanel = computed(() => {
      if (!currentStep.value) return false
      const contentTypes = ['explanation', 'example', 'reading', 'vocabulary']
      return contentTypes.includes(currentStep.value.type) || 
             (currentStep.value.data && currentStep.value.data.content)
    })

    const showInteractivePanel = computed(() => {
      if (!currentStep.value) return false
      const interactiveTypes = ['exercise', 'practice', 'quiz']
      return interactiveTypes.includes(currentStep.value.type)
    })

    const contentPanelStyle = computed(() => {
      if (!showInteractivePanel.value) {
        return { flex: '1' }
      }
      return { 
        flex: '0 0 50%',
        minWidth: '400px',
        maxWidth: '75%'
      }
    })

    const interactivePanelStyle = computed(() => {
      if (!showContentPanel.value) {
        return { flex: '1' }
      }
      return { 
        flex: '0 0 50%',
        minWidth: '400px',
        maxWidth: '75%'
      }
    })

    // ==========================================
    // FALLBACK LESSON LOADING
    // ==========================================
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
        
        // Process steps
        processLessonSteps()
        
        if (steps.value.length === 0) {
          console.warn('⚠️ No steps found in lesson, creating default step')
          createDefaultSteps()
        }
        
        console.log(`📝 Processed ${steps.value.length} steps`)
        
      } catch (err) {
        console.error('❌ Error loading lesson:', err)
        error.value = handleLessonError(err)
        retryCount.value++
      } finally {
        loading.value = false
      }
    }

    const processLessonSteps = () => {
      console.log('🔄 Processing lesson steps...')
      steps.value = []
      
      // Try different possible lesson structures
      let stepsArray = null
      
      if (lesson.value.steps && Array.isArray(lesson.value.steps)) {
        stepsArray = lesson.value.steps
      } else {
        stepsArray = buildStepsFromLegacyFormat()
      }
      
      if (!stepsArray || stepsArray.length === 0) {
        createDefaultSteps()
        return
      }
      
      stepsArray.forEach((step, index) => {
        try {
          const processedStep = processIndividualStep(step, index)
          steps.value.push(processedStep)
        } catch (stepError) {
          console.error(`❌ Error processing step ${index + 1}:`, stepError)
          steps.value.push({
            type: 'explanation',
            data: { 
              content: `<div class="error-content">
                <h3>⚠️ Step ${index + 1} Loading Error</h3>
                <p>There was an issue loading this step: ${stepError.message}</p>
              </div>`,
              error: true
            }
          })
        }
      })
    }

    const buildStepsFromLegacyFormat = () => {
      const legacySteps = []
      
      // Check for explanations
      if (lesson.value.explanations && Array.isArray(lesson.value.explanations)) {
        lesson.value.explanations.forEach((explanation, index) => {
          legacySteps.push({
            type: 'explanation',
            title: `Explanation ${index + 1}`,
            content: typeof explanation === 'string' ? explanation : explanation.content || explanation.text || '',
            data: { content: typeof explanation === 'string' ? explanation : explanation.content || explanation.text || '' }
          })
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
      
      return legacySteps
    }

    const processIndividualStep = (step, index) => {
      if (!step.type) {
        step.type = 'explanation'
      }
      
      let processedStep = { ...step }
      
      switch (step.type) {
        case 'explanation':
        case 'example':
        case 'reading':
        default:
          processedStep = processContentStep(step, index)
      }
      
      if (!processedStep.data) {
        processedStep.data = {
          content: `<div class="default-content">
            <h3>${getStepTypeText(step.type)} ${index + 1}</h3>
            <p>Content for this ${step.type} step is being prepared.</p>
          </div>`
        }
      }
      
      return processedStep
    }

    const processContentStep = (step, index) => {
      let content = ''
      
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

    // ==========================================
    // INTERACTIVE PANEL METHODS
    // ==========================================
    const getCurrentExercise = (step) => {
      if (!step || !step.data) return null
      
      // If step has exercise data
      if (Array.isArray(step.data)) {
        return step.data[0] // Return first exercise
      }
      
      // If step itself is an exercise
      if (step.question || step.type === 'exercise') {
        return step
      }
      
      // Create a default exercise for interactive steps
      if (['exercise', 'practice', 'quiz'].includes(step.type)) {
        return {
          type: 'component-classification',
          question: 'Drag each React concept to its correct category',
          description: 'Classify the React concepts shown in the content panel',
          points: 20,
          categories: [
            { id: 'hooks', name: 'Hooks' },
            { id: 'syntax', name: 'Syntax' },
            { id: 'structure', name: 'Structure' }
          ],
          items: [
            { id: 'useState', name: 'useState' },
            { id: 'jsx', name: 'JSX' },
            { id: 'useEffect', name: 'useEffect' },
            { id: 'render', name: 'render()' },
            { id: 'component', name: 'Component' },
            { id: 'props', name: 'props' }
          ],
          correctClassifications: {
            'hooks': ['useState', 'useEffect'],
            'syntax': ['render()', 'JSX'],
            'structure': ['Component', 'props']
          }
        }
      }
      
      return null
    }

    const handleSubmit = (answer) => {
      console.log('📝 Answer submitted:', answer)
      
      // Simple validation - you can make this more sophisticated
      const isCorrect = Math.random() > 0.3 // 70% chance of success for demo
      
      if (isCorrect) {
        stars.value++
        earnedPoints.value += 10
        addNotification('Great job! ⭐ +1 star earned', 'success')
        
        // Auto-advance after a delay
        setTimeout(() => {
          goNext()
        }, 2000)
      } else {
        mistakeCount.value++
        addNotification('Not quite right. Try again!', 'error')
      }
    }

    // ==========================================
    // SPLIT SCREEN METHODS
    // ==========================================
    const startResize = (event) => {
      // Simple resize implementation
      console.log('🔧 Resize started')
    }

    const resetToDefault = () => {
      console.log('🔧 Reset to default layout')
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    const handleLessonError = (error) => {
      if (error.message?.includes('not found')) {
        return 'Урок не найден. Проверьте ссылку или попробуйте перезагрузить страницу.'
      } else if (error.message?.includes('Authentication')) {
        return 'Необходимо войти в систему для доступа к уроку.'
      } else {
        return error.message || 'Произошла ошибка при загрузке урока.'
      }
    }

    const getStepTypeText = (stepType) => {
      const texts = {
        explanation: 'Объяснение',
        example: 'Пример',
        reading: 'Чтение',
        exercise: 'Упражнение',
        practice: 'Практика',
        quiz: 'Викторина',
        vocabulary: 'Словарь'
      }
      return texts[stepType] || 'Контент'
    }

    const getMedalIcon = () => {
      if (mistakeCount.value === 0) return '🥇'
      if (mistakeCount.value <= 2) return '🥈'
      return '🥉'
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
      showExitModal.value = false
      router.push('/catalogue')
    }

    const handleReturnToCatalogue = () => {
      router.push('/profile/catalogue')
    }

    const handleGoToHomework = () => {
      const lessonId = lesson.value?._id
      if (lessonId) {
        router.push(`/lessons/${lessonId}/homework`)
      } else {
        router.push('/profile/homeworks')
      }
    }

    const shareResult = () => {
      const shareData = {
        title: `I completed "${lesson.value.lessonName}"!`,
        text: `Just finished this lesson with ${stars.value} stars and ${earnedPoints.value} points!`,
        url: window.location.href
      }
      
      if (navigator.share) {
        navigator.share(shareData)
      } else {
        navigator.clipboard.writeText(`${shareData.title} ${shareData.text} ${shareData.url}`)
        addNotification('Link copied to clipboard!', 'success')
      }
    }

    const pronounceContent = () => {
      if (currentStep.value?.data?.content) {
        console.log('🔊 Pronouncing:', currentStep.value.data.content.replace(/<[^>]*>/g, ''))
      }
    }

    const closeNotification = (notificationId) => {
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
    }

    const addNotification = (message, type = 'info') => {
      const notification = {
        id: Date.now() + Math.random(),
        message,
        type,
        timestamp: Date.now()
      }
      notifications.value.push(notification)
      
      setTimeout(() => {
        closeNotification(notification.id)
      }, 5000)
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    const initializeLesson = async () => {
      userId.value = localStorage.getItem('firebaseUserId') || 
                    localStorage.getItem('userId') || 
                    auth.currentUser?.uid

      if (!userId.value) {
        console.error('❌ No user ID found')
        router.push('/')
        return
      }

      await loadLesson()
    }

    // ==========================================
    // LIFECYCLE HOOKS
    // ==========================================
    onMounted(async () => {
      console.log('🔧 LessonPage mounted')
      await initializeLesson()
    })

    onUnmounted(() => {
      console.log('🧹 LessonPage unmounting')
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
      }
    })

    // ==========================================
    // RETURN ALL STATE AND METHODS
    // ==========================================
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
      previousProgress,
      
      // Completion state
      lessonCompleted,
      elapsedSeconds,
      showExitModal,
      medalLabel,
      
      // UI state
      notifications,
      userId,
      
      // Composable status
      orchestratorLoaded,
      exercisesLoaded,
      
      // Computed
      isDevelopment,
      currentStep,
      progressPercentage,
      formattedTime,
      readableTime,
      isLastStep,
      estimatedTime,
      debugInfo,
      showContentPanel,
      showInteractivePanel,
      contentPanelStyle,
      interactivePanelStyle,
      
      // Methods
      loadLesson,
      processLessonSteps,
      startLesson,
      continuePreviousProgress,
      goNext,
      goPrevious,
      completeLesson,
      getCurrentExercise,
      handleSubmit,
      startResize,
      resetToDefault,
      handleLessonError,
      getStepTypeText,
      getMedalIcon,
      retryLoad,
      confirmExit,
      cancelExit,
      exitLesson,
      handleReturnToCatalogue,
      handleGoToHomework,
      shareResult,
      pronounceContent,
      closeNotification,
      addNotification,
      initializeLesson
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";

/* Additional styles for proper split screen */
.split-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-lg);
  margin: var(--space-lg);
  margin-bottom: 0;
}

.split-content {
  height: 100%;
  display: flex;
  overflow: hidden;
  position: relative;
}

.split-content.both-panels {
  /* Both panels visible */
}

.split-content.content-only {
  /* Only content panel */
}

.split-content.interactive-only {
  /* Only interactive panel */
}

/* Resize handle */
.resize-handle {
  width: 6px;
  background: #e2e8f0;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.resize-handle:hover {
  background: #8b5cf6;
  width: 8px;
}

.resize-grip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0.4;
  transition: opacity 0.2s ease;
}

.resize-handle:hover .resize-grip {
  opacity: 1;
}

.grip-dots {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.grip-dot {
  width: 3px;
  height: 3px;
  background: currentColor;
  border-radius: 50%;
}

/* Debug panel styles */
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  max-width: 400px;
  z-index: 1000;
}

.debug-panel details {
  cursor: pointer;
}

.debug-panel summary {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.debug-content {
  max-height: 300px;
  overflow-y: auto;
}

.debug-content h4 {
  margin: 0.5rem 0 0.25rem 0;
  color: #fbbf24;
}

.debug-content pre {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.debug-content ul {
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.debug-content li {
  margin: 0.25rem 0;
  font-size: 0.75rem;
}
</style>