<template>
  <div class="lesson-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Загрузка урока...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-screen">
      <div class="error-icon">❌</div>
      <h3>Ошибка загрузки урока</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="retryLoad" class="retry-btn">🔄 Попробовать снова</button>
        <button @click="$router.push('/catalogue')" class="back-btn">⬅️ К каталогу</button>
      </div>
    </div>

    <!-- Paywall Modal -->
    <div v-if="showPaywallModal" class="modal-overlay">
      <div class="modal-content">
        <h3>🔒 Платный контент</h3>
        <p>Этот урок доступен только для подписчиков.</p>
        <div class="modal-actions">
          <button @click="$router.push('/pay/start')" class="premium-btn">💳 Получить подписку</button>
          <button @click="$router.push('/catalogue')" class="cancel-btn">⬅️ Назад к каталогу</button>
        </div>
      </div>
    </div>

    <!-- Exit Confirmation Modal -->
    <div v-if="showExitModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Вы действительно хотите выйти?</h3>
        <p>Ваш прогресс будет сохранён автоматически.</p>
        <div class="modal-actions">
          <button @click="exitLesson" class="confirm-btn">Да, выйти</button>
          <button @click="cancelExit" class="cancel-btn">Нет, остаться</button>
        </div>
      </div>
    </div>

    <!-- Vocabulary Learning Modal -->
    <VocabularyModal 
      v-if="vocabularyModal.isVisible"
      :vocabulary-data="vocabularyModal"
      :card-animation="cardAnimation"
      :current-word="currentVocabWord"
      :progress="vocabProgress"
      :is-last-word="isLastVocabWord"
      @show-definition="showVocabDefinition"
      @hide-definition="hideVocabDefinition"
      @mark-learned="markWordAsLearned"
      @next-word="nextVocabWord"
      @previous-word="previousVocabWord"
      @skip="skipVocabularyModal"
      @restart="restartVocabulary"
      @close="confirmExit"
      @pronounce="pronounceWord"
    />

    <!-- Intro Screen -->
    <LessonIntro
      v-if="!started && !showPaywallModal && !loading && !error"
      :lesson="lesson"
      :estimated-time="estimatedTime"
      :steps="steps"
      :previous-progress="previousProgress"
      @start="startLesson"
      @continue="continuePreviousProgress"
      @exit="confirmExit"
    />

    <!-- Main Lesson Content -->
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      
      <!-- Top Header -->
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

      <!-- Split Screen Content -->
      <div class="split-content">
        
        <!-- Left Panel - Clean Content Display -->
        <ContentPanel
          :current-step="currentStep"
          :current-index="currentIndex"
          :is-interactive-step="isInteractiveStep"
          :current-exercise="getCurrentExercise()"
          :current-quiz="getCurrentQuiz()"
          :exercise-index="currentExerciseIndex"
          :quiz-index="currentQuizIndex"
          :total-exercises="getTotalExercises()"
          :total-quizzes="getTotalQuizzes()"
          :show-explanation-help="showExplanationHelp"
          :explanation-question="explanationQuestion"
          :explanation-ai-response="explanationAIResponse"
          :is-loading-explanation="isLoadingExplanation"
          :is-last-step="isLastStep"
          @toggle-explanation-help="toggleExplanationHelp"
          @update:explanation-question="explanationQuestion = $event"
          @ask-explanation="askAboutExplanation"
          @init-vocabulary="initializeVocabularyModal"
          @pronounce="pronounceWord"
          @next="goNext"
          @previous="goPrevious"
        />

        <!-- Right Panel - Interactive Content OR AI Help -->
        <div v-if="isInteractiveStep" class="interactive-panel-container">
          <!-- Interactive Panel (Exercises/Quizzes) -->
          <InteractivePanel
            :current-step="currentStep"
            :current-exercise="getCurrentExercise()"
            :current-quiz="getCurrentQuiz()"
            :exercise-index="currentExerciseIndex"
            :quiz-index="currentQuizIndex"
            :total-exercises="getTotalExercises()"
            :total-quizzes="getTotalQuizzes()"
            :user-answer="userAnswer"
            :confirmation="confirmation"
            :answer-was-correct="answerWasCorrect"
            :current-hint="currentHint"
            :smart-hint="smartHint"
            :mistake-count="mistakeCount"
            :fill-blank-answers="fillBlankAnswers"
            :matching-pairs="matchingPairs"
            :selected-matching-item="selectedMatchingItem"
            :ordering-items="orderingItems"
            :drag-drop-placements="dragDropPlacements"
            @answer-changed="userAnswer = $event"
            @fill-blank-updated="updateFillBlankAnswer"
            @submit="handleSubmitOrNext"
            @next-exercise="goToNextExercise"
            @next-quiz="goToNextQuiz"
            @show-hint="showHint"
            @clear-hint="clearSmartHint"
          />
          
          <!-- AI Help Panel (shown below or alongside interactive content) -->
          <AIHelpPanel
            :ai-suggestions="aiSuggestions"
            :ai-chat-input="aiChatInput"
            :ai-chat-history="aiChatHistory"
            :ai-is-loading="aiIsLoading"
            :ai-usage="aiUsage"
            @send-message="sendAIMessage"
            @ask-ai="askAI"
            @clear-chat="clearAIChat"
          />
        </div>

        <!-- Non-interactive step placeholder -->
        <div v-else class="non-interactive-panel">
          <div class="panel-placeholder">
            <div class="placeholder-icon">📖</div>
            <h4>Изучите материал слева</h4>
            <p>Внимательно прочитайте объяснение и переходите к следующему шагу</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lesson Completion Screen -->
    <CompletionScreen
      v-if="lessonCompleted"
      :lesson="lesson"
      :readable-time="readableTime"
      :stars="stars"
      :mistake-count="mistakeCount"
      :earned-points="earnedPoints"
      :medal-label="medalLabel"
      :medal-icon="getMedalIcon()"
      :progress-insight="progressInsight"
      :total-steps="steps.length"
      @return-to-catalogue="$router.push('/catalogue')"
      @share="shareResult"
      @homework="goToHomework"
    />

    <!-- Floating AI Assistant Toggle -->
    <button 
      v-if="started && !lessonCompleted" 
      class="floating-ai-btn" 
      @click="toggleFloatingAI"
      :class="{ active: showFloatingAI }"
    >
      🤖
    </button>

    <!-- Floating AI Assistant -->
    <FloatingAIAssistant
      v-if="showFloatingAI && started && !lessonCompleted"
      :ai-usage="aiUsage"
      :quick-suggestions="quickSuggestions"
      :ai-chat-history="aiChatHistory"
      :floating-ai-input="floatingAIInput"
      :ai-is-loading="aiIsLoading"
      @close="closeFloatingAI"
      @send-message="sendFloatingAIMessage"
      @ask-ai="askAI"
      @clear-chat="clearAIChat"
    />

    <!-- Confetti Animation -->
    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import { computed } from 'vue'

// Import composables
import { useVocabulary } from '@/composables/useVocabulary'
import { useExercises } from '@/composables/useExercises'
import { usePaymentValidation } from '@/composables/usePaymentValidation'
import { useSound } from '@/composables/useSound'
import { useExplanation } from '@/composables/useExplanation'
import { useLessonOrchestrator } from '@/composables/useLessonOrchestrator'

// Import components
import VocabularyModal from '@/components/lesson/VocabularyModal.vue'
import LessonIntro from '@/components/lesson/LessonIntro.vue'
import LessonHeader from '@/components/lesson/LessonHeader.vue'
import ProgressBar from '@/components/lesson/ProgressBar.vue'
import ContentPanel from '@/components/lesson/ContentPanel.vue'
import InteractivePanel from '@/components/lesson/InteractivePanel.vue'
import AIHelpPanel from '@/components/lesson/AIHelpPanel.vue'
import CompletionScreen from '@/components/lesson/CompletionScreen.vue'
import FloatingAIAssistant from '@/components/lesson/FloatingAIAssistant.vue'

export default {
  name: 'LessonPage',
  components: {
    VocabularyModal,
    LessonIntro,
    LessonHeader,
    ProgressBar,
    ContentPanel,
    InteractivePanel,
    AIHelpPanel,
    CompletionScreen,
    FloatingAIAssistant
  },
  
  setup() {
    // Use all composables
    const lessonOrchestrator = useLessonOrchestrator()
    const vocabulary = useVocabulary()
    const exercises = useExercises()
    const paymentValidation = usePaymentValidation()
    const sound = useSound()
    const explanation = useExplanation()
    
    // Initialize services
    sound.initializeSpeech()
    explanation.initializeAI()
    
    // Additional computed properties
    const getUserProgress = computed(() => ({
      currentStep: lessonOrchestrator.currentIndex.value,
      completedSteps: Array.from({length: lessonOrchestrator.currentIndex.value}, (_, i) => i),
      mistakes: lessonOrchestrator.mistakeCount.value,
      stars: lessonOrchestrator.stars.value,
      elapsedSeconds: lessonOrchestrator.elapsedSeconds.value
    }))

    const isLastStep = computed(() => {
      return lessonOrchestrator.currentIndex.value >= lessonOrchestrator.steps.value.length - 1
    })
    
    // Methods
    const handleSubmitOrNext = async () => {
      const currentExercise = exercises.getCurrentExercise(lessonOrchestrator.currentStep.value)
      const currentQuiz = exercises.getCurrentQuiz(lessonOrchestrator.currentStep.value)
      
      const isCorrect = validateUserAnswer(
        exercises.userAnswer.value,
        currentExercise || currentQuiz,
        lessonOrchestrator.currentStep.value?.type
      )
      
      if (isCorrect) {
        exercises.answerWasCorrect.value = true
        exercises.confirmation.value = '✅ Верно! Отличная работа!'
        lessonOrchestrator.stars.value++
        lessonOrchestrator.earnedPoints.value += 10
      } else {
        lessonOrchestrator.mistakeCount.value++
        exercises.answerWasCorrect.value = false
        lessonOrchestrator.earnedPoints.value = Math.max(0, lessonOrchestrator.earnedPoints.value - 2)
        exercises.confirmation.value = '❌ Неверно. Попробуйте еще раз.'
        
        if (lessonOrchestrator.mistakeCount.value >= 2) {
          await explanation.generateSmartHintForMistakes(
            currentExercise || currentQuiz,
            lessonOrchestrator.mistakeCount.value,
            { lessonId: lessonOrchestrator.lesson.value._id }
          )
        }
      }
      
      await lessonOrchestrator.saveProgress()
    }
    
    const validateUserAnswer = (userAnswer, exercise, stepType) => {
      // Use your exercise validation logic here
      return Math.random() > 0.3 // Placeholder
    }

    const getCurrentExercise = () => {
      return exercises.getCurrentExercise(lessonOrchestrator.currentStep.value)
    }

    const getCurrentQuiz = () => {
      return exercises.getCurrentQuiz(lessonOrchestrator.currentStep.value)
    }

    const getTotalExercises = () => {
      return exercises.getTotalExercises(lessonOrchestrator.currentStep.value)
    }

    const getTotalQuizzes = () => {
      return exercises.getTotalQuizzes(lessonOrchestrator.currentStep.value)
    }

    const goToNextExercise = () => {
      exercises.goToNextExercise(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
    }

    const goToNextQuiz = () => {
      exercises.goToNextQuiz(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
    }

    const askAboutExplanation = (question) => {
      const explanationText = lessonOrchestrator.getStepContent(lessonOrchestrator.currentStep.value)
      explanation.askAboutExplanation(explanationText, question, {
        lessonId: lessonOrchestrator.lesson.value._id,
        lessonName: lessonOrchestrator.lesson.value.lessonName
      })
    }

    const sendAIMessage = (message) => {
      explanation.sendAIMessage(message, lessonOrchestrator.lesson.value, getUserProgress.value, lessonOrchestrator.currentStep.value)
    }

    const sendFloatingAIMessage = (message) => {
      explanation.sendFloatingAIMessage(message, lessonOrchestrator.lesson.value, getUserProgress.value, lessonOrchestrator.currentStep.value)
    }

    const askAI = (question) => {
      explanation.askAI(question, lessonOrchestrator.lesson.value, getUserProgress.value, lessonOrchestrator.currentStep.value)
    }

    const clearAIChat = () => {
      explanation.clearAIChat()
    }

    const toggleFloatingAI = () => {
      explanation.toggleFloatingAI()
    }

    const closeFloatingAI = () => {
      explanation.closeFloatingAI()
    }

    const shareResult = () => {
      const message = `🎉 Я только что завершил урок "${lessonOrchestrator.getLocalized(lessonOrchestrator.lesson.value.lessonName)}"! Получил ${lessonOrchestrator.stars.value} звезд и ${lessonOrchestrator.earnedPoints.value} очков! 🚀`
      
      if (navigator.share) {
        navigator.share({
          title: 'Мой успех в обучении!',
          text: message,
          url: window.location.href
        }).catch(() => {
          fallbackShare(message)
        })
      } else {
        fallbackShare(message)
      }
    }
    
    const fallbackShare = (message) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(message).then(() => {
          alert('📋 Результат скопирован в буфер обмена!')
        }).catch(() => {
          alert('📤 ' + message)
        })
      } else {
        alert('📤 ' + message)
      }
    }
    
    const goToHomework = () => {
      lessonOrchestrator.router.push(`/profile/homeworks/${lessonOrchestrator.lesson.value._id}`)
    }

    const getMedalIcon = () => {
      if (lessonOrchestrator.mistakeCount.value === 0) return '🥇'
      if (lessonOrchestrator.mistakeCount.value <= 2) return '🥈'
      return '🥉'
    }
    
    return {
      // Expose everything from composables
      ...lessonOrchestrator,
      ...vocabulary,
      ...exercises,
      ...paymentValidation,
      ...sound,
      ...explanation,
      
      // Additional computed and methods
      getUserProgress,
      isLastStep,
      handleSubmitOrNext,
      validateUserAnswer,
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      goToNextExercise,
      goToNextQuiz,
      askAboutExplanation,
      sendAIMessage,
      sendFloatingAIMessage,
      askAI,
      clearAIChat,
      toggleFloatingAI,
      closeFloatingAI,
      shareResult,
      goToHomework,
      getMedalIcon
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";

/* Interactive panel container for exercises with AI help */
.interactive-panel-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

@media (max-width: 1024px) {
  .interactive-panel-container {
    padding: 16px;
    gap: 12px;
  }
}
</style>