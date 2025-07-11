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

    <!-- ✅ VOCABULARY LEARNING MODAL -->
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
      />

      <!-- Split Screen Content -->
      <div class="split-content">
        
        <!-- Left Panel - Clean Content Display -->
        <ContentPanel
          :current-step="currentStep"
          :current-index="currentIndex"
          :show-explanation-help="showExplanationHelp"
          :explanation-question="explanationQuestion"
          :explanation-ai-response="explanationAIResponse"
          :is-loading-explanation="isLoadingExplanation"
          @toggle-explanation-help="toggleExplanationHelp"
          @ask-explanation="(question) => askAboutExplanation(getStepContent(currentStep), lesson)"
          @init-vocabulary="initializeVocabularyModal"
          @pronounce="pronounceWord"
          @next="goNext"
          @previous="goPrevious"
        />

        <!-- Right Panel - Interactive Content -->
        <InteractivePanel
          v-if="isInteractiveStep"
          :current-step="currentStep"
          :current-exercise="getCurrentExercise(currentStep)"
          :current-quiz="getCurrentQuiz(currentStep)"
          :exercise-index="currentExerciseIndex"
          :quiz-index="currentQuizIndex"
          :total-exercises="getTotalExercises(currentStep)"
          :total-quizzes="getTotalQuizzes(currentStep)"
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
          @next-exercise="goToNextExercise(currentStep, goNext)"
          @next-quiz="goToNextQuiz(currentStep, goNext)"
          @show-hint="showHint"
          @clear-hint="clearSmartHint"
        />

        <!-- AI Help Panel for Interactive Steps -->
        <AIHelpPanel
          v-else-if="isInteractiveStep"
          :ai-suggestions="aiSuggestions"
          :ai-chat-input="aiChatInput"
          :ai-chat-history="aiChatHistory"
          :ai-is-loading="aiIsLoading"
          :ai-usage="aiUsage"
          @send-message="sendAIMessage(lesson, getUserProgress(), currentStep)"
          @ask-ai="(question) => askAI(question, lesson, getUserProgress(), currentStep)"
        />

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
      @send-message="sendFloatingAIMessage(lesson, getUserProgress(), currentStep)"
      @ask-ai="(question) => askAI(question, lesson, getUserProgress(), currentStep)"
    />

    <!-- Confetti Animation -->
    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import { computed } from 'vue'

// ✅ Import all our extracted composables
import { useVocabulary } from '@/composables/useVocabulary'
import { useExercises } from '@/composables/useExercises'
import { usePaymentValidation } from '@/composables/usePaymentValidation'
import { useSound } from '@/composables/useSound'
import { useExplanation } from '@/composables/useExplanation'
import { useLessonOrchestrator } from '@/composables/useLessonOrchestrator'

// ✅ Import components (these would need to be created)
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
    // ✅ Use all our composables
    const lessonOrchestrator = useLessonOrchestrator()
    const vocabulary = useVocabulary()
    const exercises = useExercises()
    const paymentValidation = usePaymentValidation()
    const sound = useSound()
    const explanation = useExplanation()
    
    // ✅ Initialize services
    sound.initializeSpeech()
    explanation.initializeAI()
    
    // ✅ Additional computed properties that combine multiple composables
    const getUserProgress = computed(() => ({
      currentStep: lessonOrchestrator.currentIndex.value,
      completedSteps: Array.from({length: lessonOrchestrator.currentIndex.value}, (_, i) => i),
      mistakes: lessonOrchestrator.mistakeCount.value,
      stars: lessonOrchestrator.stars.value,
      elapsedSeconds: lessonOrchestrator.elapsedSeconds.value
    }))
    
    // ✅ Combined methods that use multiple composables
    const handleSubmitOrNext = async () => {
      const currentExercise = exercises.getCurrentExercise(lessonOrchestrator.currentStep.value)
      const currentQuiz = exercises.getCurrentQuiz(lessonOrchestrator.currentStep.value)
      
      // Validation logic would go here, using exercise validation methods
      // This would be extracted to a separate validation composable
      
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
        
        // Generate smart hint if needed
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
      // This would use the exercise validation logic
      // For now, just a placeholder
      return Math.random() > 0.3 // 70% success rate for demo
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
    
    const getStepContent = (step) => {
      if (!step || !step.data) return 'Контент недоступен'
      
      // For interactive steps, show only the question
      if (['exercise', 'practice'].includes(step.type)) {
        const currentExercise = exercises.getCurrentExercise(step)
        if (currentExercise && currentExercise.question) {
          return lessonOrchestrator.getLocalized(currentExercise.question)
        }
        return 'Упражнение загружается...'
      }
      
      if (step.type === 'quiz') {
        const currentQuiz = exercises.getCurrentQuiz(step)
        if (currentQuiz && currentQuiz.question) {
          return lessonOrchestrator.getLocalized(currentQuiz.question)
        }
        return 'Вопрос загружается...'
      }
      
      // For non-interactive steps, show content
      if (typeof step.data === 'string' && step.data.trim()) {
        return step.data.trim()
      }
      
      if (step.data.content) {
        return lessonOrchestrator.getLocalized(step.data.content).trim()
      }
      
      return `Контент для шага "${step.type}"`
    }
    
    return {
      // ✅ Expose everything from composables
      ...lessonOrchestrator,
      ...vocabulary,
      ...exercises,
      ...paymentValidation,
      ...sound,
      ...explanation,
      
      // ✅ Additional computed and methods
      getUserProgress,
      handleSubmitOrNext,
      shareResult,
      goToHomework,
      getStepContent,
      validateUserAnswer
    }
  }
}
</script>

<style scoped>
/* ✅ Import the existing CSS file to maintain styling */
@import "@/assets/css/LessonPage.css";

/* ✅ Additional styles for new components can be added here */
.split-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
}

.content-panel,
.interactive-panel {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.non-interactive-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  color: #6c757d;
}

.panel-placeholder {
  padding: 40px;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.floating-ai-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,123,255,0.3);
  transition: all 0.3s ease;
  z-index: 1000;
}

.floating-ai-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0,123,255,0.4);
}

.floating-ai-btn.active {
  background: #28a745;
}

.confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}
</style>