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
      @jump-to-word="jumpToVocabWord"
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
            :available-drag-items="availableDragItems"
            :drop-zones="dropZones"
            :attempt-count="attemptCount"
            :max-attempts="maxAttempts"
            :is-on-second-chance="isOnSecondChance"
            :show-correct-answer="showCorrectAnswer"
            :correct-answer-text="correctAnswerText"
            
            @answer-changed="handleAnswerChanged"
            @fill-blank-updated="updateFillBlankAnswer"
            @submit="handleSubmitOrNext"
            @next-exercise="goToNextExercise"
            @next-quiz="goToNextQuiz"
            @show-hint="showHint"
            @clear-hint="clearSmartHint"
            @matching-item-selected="handleMatchingItemSelected"
            @remove-matching-pair="handleRemoveMatchingPair"
            @drag-item-start="handleDragItemStart"
            @drag-over-zone="handleDragOverZone"
            @drag-leave-zone="handleDragLeaveZone"
            @drop-in-zone="handleDropInZone"
            @remove-dropped-item="handleRemoveDroppedItem"
          />
          
          <!-- AI Help Panel -->
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

    <!-- Enhanced Lesson Completion Screen -->
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
      :extraction-results="extractionResults"
      @return-to-catalogue="$router.push('/profile/catalogue')"   
      @share="shareResult"
      @homework="goToHomework"
      @vocabulary="goToVocabulary"
    />

    <!-- Migration Panel (Admin/User) -->
    <div v-if="showMigrationPanel" class="migration-panel">
      <div class="migration-content">
        <h3>🔄 Обновление контента</h3>
        <p>Хотите создать задания и словарь из уже пройденных уроков?</p>
        <div class="migration-actions">
          <button 
            @click="migrateLessonContent" 
            :disabled="migrationLoading"
            class="migrate-btn"
          >
            {{ migrationLoading ? '⏳ Обработка...' : '🚀 Обновить контент' }}
          </button>
          <button @click="closeMigrationPanel" class="cancel-btn">❌ Закрыть</button>
        </div>
      </div>
    </div>

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
// ✅ FULLY CLEANED LessonPage.vue <script> - Exercise logic moved to composable
import { computed, ref, watch, nextTick } from 'vue'

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
    // ==========================================
    // COMPOSABLES INITIALIZATION
    // ==========================================
    const lessonOrchestrator = useLessonOrchestrator()
    const vocabulary = useVocabulary()
    const exercises = useExercises()
    const paymentValidation = usePaymentValidation()
    const sound = useSound()
    const explanation = useExplanation()
    
    // Initialize services
    sound.initializeSpeech?.()
    explanation.initializeAI?.()

    // ==========================================
    // REACTIVE STATE (Lesson-specific only)
    // ==========================================
    
    // Second chance system
    const attemptCount = ref(0)
    const maxAttempts = ref(2)
    const showCorrectAnswer = ref(false)
    const correctAnswerText = ref('')
    const isOnSecondChance = ref(false)

    // Exercise initialization tracking
    const initializationTracker = ref({
      currentExerciseId: null,
      initialized: false
    })

    // Lesson completion and extraction state
    const extractionResults = ref(null)
    const migrationLoading = ref(false)
    const showMigrationPanel = ref(false)

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================
    
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

    const userToken = computed(() => {
      return lessonOrchestrator.currentUser?.value?.token || localStorage.getItem('authToken')
    })

    // ==========================================
    // LESSON COMPLETION WITH EXTRACTION
    // ==========================================
    
    const completeLessonWithExtraction = async () => {
      try {
        console.log('🏁 Starting enhanced lesson completion with extraction')
        
        const completionResult = await lessonOrchestrator.completeLesson?.()
        
        if (completionResult?.success || lessonOrchestrator.lessonCompleted.value) {
          console.log('✅ Lesson completed, triggering content extraction')
          
          const extractionResult = await extractLessonContent()
          
          if (extractionResult?.success) {
            console.log('🎉 Content extraction successful:', extractionResult)
            showCompletionMessage(extractionResult)
          } else {
            console.warn('⚠️ Content extraction failed, but lesson still completed')
            lessonOrchestrator.lessonCompleted.value = true
          }
        }
      } catch (error) {
        console.error('❌ Error completing lesson with extraction:', error)
        lessonOrchestrator.lessonCompleted.value = true
      }
    }

    const extractLessonContent = async () => {
      try {
        console.log('📤 Extracting lesson content...')
        
        if (!lessonOrchestrator.currentUser?.value?.uid || !lessonOrchestrator.lesson.value?._id) {
          console.error('❌ Missing required data for extraction')
          return { success: false, error: 'Missing user or lesson data' }
        }

        const response = await fetch('/api/lessons/complete-and-extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken.value}`
          },
          body: JSON.stringify({
            userId: lessonOrchestrator.currentUser.value.uid,
            lessonId: lessonOrchestrator.lesson.value._id,
            progress: getUserProgress.value
          })
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to extract content')
        }
        
        console.log('✅ Content extraction response:', result)
        return result
        
      } catch (error) {
        console.error('❌ Error extracting lesson content:', error)
        return { success: false, error: error.message }
      }
    }

    const showCompletionMessage = (extractionResult) => {
      console.log('🎊 Showing enhanced completion message')
      
      let message = '🎉 Урок успешно завершён!'
      
      if (extractionResult.homeworkCreated) {
        message += '\n📝 Новое домашнее задание создано и доступно в разделе заданий!'
      }
      
      if (extractionResult.vocabularyAdded) {
        message += `\n📚 ${extractionResult.vocabularyCount} новых слов добавлено в вашу коллекцию словаря!`
      }
      
      if (lessonOrchestrator.showToast) {
        lessonOrchestrator.showToast(message, 'success')
      } else {
        console.log('📢 Completion message:', message)
      }
      
      lessonOrchestrator.lessonCompleted.value = true
      extractionResults.value = extractionResult
    }

    // ==========================================
    // MIGRATION FUNCTIONALITY
    // ==========================================
    
    const migrateLessonContent = async () => {
      try {
        migrationLoading.value = true
        console.log('🔄 Starting lesson content migration')
        
        if (!lessonOrchestrator.currentUser?.value?.uid) {
          throw new Error('User not found')
        }
        
        const response = await fetch(`/api/homework/migrate-from-lessons/${lessonOrchestrator.currentUser.value.uid}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken.value}`,
            'Content-Type': 'application/json'
          }
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Migration failed')
        }
        
        if (result.success) {
          const message = `✅ Миграция завершена! Создано ${result.data?.homeworkCreated || 0} заданий и добавлено ${result.data?.vocabularyAdded || 0} слов в словарь.`
          
          if (lessonOrchestrator.showToast) {
            lessonOrchestrator.showToast(message, 'success')
          } else {
            alert(message)
          }
          
          showMigrationPanel.value = false
        } else {
          throw new Error(result.error || 'Migration failed')
        }
        
      } catch (error) {
        console.error('❌ Migration error:', error)
        const errorMessage = '❌ Ошибка миграции: ' + error.message
        
        if (lessonOrchestrator.showToast) {
          lessonOrchestrator.showToast(errorMessage, 'error')
        } else {
          alert(errorMessage)
        }
      } finally {
        migrationLoading.value = false
      }
    }

    const showMigrationPanelModal = () => {
      showMigrationPanel.value = true
    }

    const closeMigrationPanel = () => {
      showMigrationPanel.value = false
    }

    // ==========================================
    // VOCABULARY METHODS
    // ==========================================
    
    const initializeVocabularyModal = (step) => {
      console.log('📚 Initializing vocabulary modal from LessonPage:', step)
      
      let vocabularyStep = step
      
      if (!vocabularyStep) {
        console.warn('⚠️ No step provided to initializeVocabularyModal, using current step')
        vocabularyStep = lessonOrchestrator.currentStep.value
      }
      
      if (!vocabularyStep) {
        console.error('❌ No vocabulary step available for initialization')
        return
      }
      
      if (vocabularyStep.type !== 'vocabulary') {
        console.error('❌ Step is not a vocabulary type:', vocabularyStep.type)
        
        const vocabularySteps = lessonOrchestrator.steps.value?.filter(s => s.type === 'vocabulary')
        if (vocabularySteps && vocabularySteps.length > 0) {
          console.log('✅ Found vocabulary step in lesson, using first one:', vocabularySteps[0])
          vocabularyStep = vocabularySteps[0]
        } else {
          console.error('❌ No vocabulary steps found in entire lesson')
          return
        }
      }
      
      vocabulary.initializeVocabularyModal(vocabularyStep)
    }

    const jumpToVocabWord = (index) => {
      console.log('🎯 Jumping to vocabulary word:', index)
      
      if (index >= 0 && index < vocabulary.vocabularyModal.words.length) {
        vocabulary.cardAnimation.isFlipping = false
        vocabulary.cardAnimation.showDefinition = false
        
        setTimeout(() => {
          vocabulary.vocabularyModal.currentIndex = index
          console.log(`✅ Jumped to word ${index + 1}/${vocabulary.vocabularyModal.words.length}`)
        }, 50)
      } else {
        console.warn('⚠️ Invalid vocabulary word index:', index)
      }
    }

    const showVocabDefinition = () => {
      console.log('🔄 Showing vocabulary definition')
      vocabulary.showVocabDefinition()
    }

    const hideVocabDefinition = () => {
      console.log('🔄 Hiding vocabulary definition') 
      vocabulary.hideVocabDefinition()
    }

    const markWordAsLearned = () => {
      console.log('📚 Marking word as learned')
      vocabulary.markWordAsLearned()
    }

    const nextVocabWord = () => {
      console.log('➡️ Going to next vocabulary word')
      vocabulary.nextVocabWord()
    }

    const previousVocabWord = () => {
      console.log('⬅️ Going to previous vocabulary word')
      vocabulary.previousVocabWord()
    }

    const skipVocabularyModal = () => {
      console.log('⏭️ Skipping vocabulary modal')
      vocabulary.skipVocabularyModal()
    }

    const restartVocabulary = () => {
      console.log('🔄 Restarting vocabulary')
      vocabulary.restartVocabulary()
    }

    const pronounceWord = (word) => {
      console.log('🔊 Pronouncing word:', word)
      
      if (!word || typeof word !== 'string') {
        console.warn('⚠️ Invalid word for pronunciation:', word)
        return
      }
      
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          
          const utterance = new SpeechSynthesisUtterance(word.trim())
          utterance.lang = 'en-US'
          utterance.rate = 0.8
          utterance.pitch = 1
          
          utterance.onstart = () => console.log('🎵 Started pronouncing:', word)
          utterance.onend = () => console.log('✅ Finished pronouncing:', word)
          utterance.onerror = (event) => console.error('❌ Pronunciation error:', event.error)
          
          window.speechSynthesis.speak(utterance)
        } else {
          console.warn('⚠️ Speech synthesis not supported')
          sound.pronounceWord?.(word)
        }
      } catch (error) {
        console.error('❌ Error pronouncing word:', error)
        sound.pronounceWord?.(word)
      }
    }

    // ==========================================
    // EXERCISE INITIALIZATION (Simplified)
    // ==========================================
    
    const getCurrentExercise = () => {
      const exercise = exercises.getCurrentExercise(lessonOrchestrator.currentStep.value)
      
      if (exercise) {
        const exerciseId = exercise.id || `${exercise.type}_${exercise.question?.substring(0, 20)}`
        
        if (initializationTracker.value.currentExerciseId !== exerciseId) {
          initializationTracker.value = {
            currentExerciseId: exerciseId,
            initialized: false
          }
          
          nextTick(() => {
            exercises.initializeCurrentExerciseData(exercise)
            initializationTracker.value.initialized = true
          })
        }
      }
      
      return exercise
    }

    // ==========================================
    // SIMPLIFIED EVENT HANDLERS (Delegate to composable)
    // ==========================================

    const handleAnswerChanged = (newAnswer) => {
      console.log('📝 Answer changed:', newAnswer)
      exercises.updateUserAnswer(newAnswer, getCurrentExercise())
    }

    const handleMatchingItemSelected = (selection) => {
      console.log('🔗 Handling matching item selection:', selection)
      exercises.handleMatchingSelection(selection)
    }

    const handleRemoveMatchingPair = (pairIndex) => {
      console.log('🗑️ Handling remove matching pair:', pairIndex)
      exercises.removeMatchingPair(pairIndex)
    }

    // ==========================================
    // SIMPLIFIED SUBMISSION HANDLER
    // ==========================================
    
    const handleSubmitOrNext = async () => {
      console.log('🎯 Submit/Next triggered, attempt:', attemptCount.value + 1)
      
      const currentStep = lessonOrchestrator.currentStep.value
      if (!currentStep) {
        console.warn('❌ No current step available')
        return
      }

      if (showCorrectAnswer.value) {
        moveToNextStep()
        return
      }

      // ✅ SIMPLIFIED: Delegate to exercises composable
      const currentExercise = getCurrentExercise()
      const currentQuiz = getCurrentQuiz()
      
      let isCorrect = false
      let exerciseOrQuiz = null

      if (currentStep.type === 'exercise' || currentStep.type === 'practice') {
        exerciseOrQuiz = currentExercise
        if (exerciseOrQuiz) {
          // ✅ Use composable validation method
          isCorrect = exercises.validateCurrentAnswer(exerciseOrQuiz)
        }
      } else if (currentStep.type === 'quiz') {
        exerciseOrQuiz = currentQuiz
        if (exerciseOrQuiz) {
          // ✅ Use composable validation method  
          isCorrect = exercises.validateQuizAnswer(exerciseOrQuiz)
        }
      }

      attemptCount.value++

      if (isCorrect) {
        exercises.answerWasCorrect.value = true
        lessonOrchestrator.stars.value++
        lessonOrchestrator.earnedPoints.value += 10
        
        if (attemptCount.value === 1) {
          lessonOrchestrator.earnedPoints.value += 5
          // ✅ Use composable message method
          exercises.confirmation.value = exercises.getRandomSuccessMessage() + ' 🌟 Бонус за первую попытку!'
        } else {
          exercises.confirmation.value = exercises.getRandomSuccessMessage() + ' 💪 Отлично, со второй попытки!'
        }
        
        sound.playSuccessSound?.()
        isOnSecondChance.value = false
        
      } else {
        exercises.answerWasCorrect.value = false
        
        if (attemptCount.value < maxAttempts.value) {
          isOnSecondChance.value = true
          // ✅ Use composable message method
          exercises.confirmation.value = exercises.getSecondChanceMessage(exerciseOrQuiz)
          sound.playErrorSound?.()
          return
        } else {
          lessonOrchestrator.mistakeCount.value++
          lessonOrchestrator.earnedPoints.value = Math.max(0, lessonOrchestrator.earnedPoints.value - 2)
          
          showCorrectAnswer.value = true
          // ✅ Use composable display method
          correctAnswerText.value = exercises.getCorrectAnswerDisplay(exerciseOrQuiz)
          exercises.confirmation.value = exercises.getFinalFailureMessage(exerciseOrQuiz, correctAnswerText.value)
          
          isOnSecondChance.value = false
          sound.playErrorSound?.()
          
          if (lessonOrchestrator.mistakeCount.value >= 2) {
            await explanation.generateSmartHintForMistakes?.(
              exerciseOrQuiz,
              lessonOrchestrator.mistakeCount.value,
              { 
                lessonId: lessonOrchestrator.lesson.value._id,
                userAnswer: exercises.getCurrentUserAnswer(),
                correctAnswer: correctAnswerText.value
              }
            )
          }
        }
      }
      
      await lessonOrchestrator.saveProgress()
    }

    // ==========================================
    // NAVIGATION FUNCTIONS
    // ==========================================
    
    const resetAttempts = () => {
      attemptCount.value = 0
      isOnSecondChance.value = false
      showCorrectAnswer.value = false
      correctAnswerText.value = ''
      exercises.confirmation.value = ''
      exercises.answerWasCorrect.value = false
      
      initializationTracker.value = {
        currentExerciseId: null,
        initialized: false
      }
    }

    const moveToNextStep = () => {
      resetAttempts()
      
      if (exercises.isLastExercise?.(lessonOrchestrator.currentStep.value) || 
          exercises.isLastQuiz?.(lessonOrchestrator.currentStep.value)) {
        lessonOrchestrator.goNext()
      } else {
        if (lessonOrchestrator.currentStep.value.type === 'exercise' || 
            lessonOrchestrator.currentStep.value.type === 'practice') {
          exercises.goToNextExercise(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
        } else if (lessonOrchestrator.currentStep.value.type === 'quiz') {
          exercises.goToNextQuiz(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
        }
      }
    }

    const goToNextExercise = () => {
      resetAttempts()
      exercises.goToNextExercise(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
    }

    const goToNextQuiz = () => {
      resetAttempts()
      exercises.goToNextQuiz(lessonOrchestrator.currentStep.value, lessonOrchestrator.goNext)
    }

    const goNext = () => {
      resetAttempts()
      lessonOrchestrator.goNext()
    }

    const goPrevious = () => {
      resetAttempts()
      lessonOrchestrator.goPrevious()
    }

    // ==========================================
    // SIMPLIFIED EXERCISE METHODS (Delegate to composable)
    // ==========================================
    
    const getCurrentQuiz = () => {
      return exercises.getCurrentQuiz(lessonOrchestrator.currentStep.value)
    }

    const getTotalExercises = () => {
      return exercises.getTotalExercises(lessonOrchestrator.currentStep.value)
    }

    const getTotalQuizzes = () => {
      return exercises.getTotalQuizzes(lessonOrchestrator.currentStep.value)
    }

    // ==========================================
    // SIMPLIFIED DRAG AND DROP EVENT HANDLERS (Delegate to composable)
    // ==========================================
    
    const handleDragItemStart = (item) => {
      exercises.startDragItem(item)
    }

    const handleDragOverZone = (zoneId) => {
      exercises.dragOverZone(zoneId)
    }

    const handleDragLeaveZone = () => {
      exercises.dragLeaveZone()
    }

    const handleDropInZone = ({ zoneId, item }) => {
      exercises.dropInZone(zoneId, item)
    }

    const handleRemoveDroppedItem = ({ zoneId, itemIndex, item }) => {
      exercises.removeDroppedItem(zoneId, itemIndex, item)
    }

    const updateFillBlankAnswer = (index, event) => {
      exercises.updateFillBlankAnswer(index, event)
    }

    const showHint = () => {
      exercises.showHint()
    }

    const clearSmartHint = () => {
      exercises.clearSmartHint()
    }

    // ==========================================
    // AI AND EXPLANATION METHODS
    // ==========================================
    
    const askAboutExplanation = (question) => {
      const explanationText = lessonOrchestrator.formatContent?.(lessonOrchestrator.currentStep.value?.data?.content) || ''
      explanation.askAboutExplanation?.(explanationText, question, {
        lessonId: lessonOrchestrator.lesson.value._id,
        lessonName: lessonOrchestrator.lesson.value.lessonName
      })
    }

    const sendAIMessage = (message) => {
      explanation.sendAIMessage?.(message, lessonOrchestrator.lesson.value, getUserProgress.value, lessonOrchestrator.currentStep.value)
    }

    const sendFloatingAIMessage = (message) => {
      explanation.sendFloatingAIMessage?.(message, lessonOrchestrator.lesson.value, getUserProgress.value, lessonOrchestrator.currentStep.value)
    }

    const askAI = (question) => {
      explanation.askAI?.(question, lessonOrchestrator.lesson.value, getUserProgress.value, lessonOrchestrator.currentStep.value)
    }

    const clearAIChat = () => {
      explanation.clearAIChat?.()
    }

    const toggleFloatingAI = () => {
      explanation.toggleFloatingAI?.()
    }

    const closeFloatingAI = () => {
      explanation.closeFloatingAI?.()
    }

    // ==========================================
    // NAVIGATION METHODS FOR COMPLETION SCREEN
    // ==========================================
    
    const goToHomework = () => {
      lessonOrchestrator.router?.push(`/profile/homeworks/${lessonOrchestrator.lesson.value._id}`)
    }

    const goToVocabulary = () => {
      lessonOrchestrator.router?.push('/profile/vocabulary')
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    const shareResult = () => {
      const message = `🎉 Я только что завершил урок "${lessonOrchestrator.lesson.value.lessonName}"! Получил ${lessonOrchestrator.stars.value} звезд и ${lessonOrchestrator.earnedPoints.value} очков! 🚀`
      
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

    const getMedalIcon = () => {
      if (lessonOrchestrator.mistakeCount.value === 0) return '🥇'
      if (lessonOrchestrator.mistakeCount.value <= 2) return '🥈'
      return '🥉'
    }

    // ==========================================
    // WATCHERS
    // ==========================================
    
    watch(() => lessonOrchestrator.currentStep.value, (newStep, oldStep) => {
      if (newStep && newStep !== oldStep) {
        initializationTracker.value = {
          currentExerciseId: null,
          initialized: false
        }
        
        if (newStep.type === 'exercise' || newStep.type === 'practice') {
          const exercise = getCurrentExercise()
          
          if (exercise?.type === 'matching') {
            exercises.initializeMatchingItems?.(exercise)
          }
        }
      }
    }, { immediate: false })

    // Watch for lesson completion to trigger enhanced completion
    watch(() => lessonOrchestrator.lessonCompleted.value, (isCompleted) => {
      if (isCompleted && !extractionResults.value) {
        console.log('🎯 Lesson completed detected, triggering extraction')
        completeLessonWithExtraction()
      }
    })

    // ==========================================
    // OVERRIDE LESSON COMPLETION METHOD
    // ==========================================
    
    // Override the default completion method to use our enhanced version
    const originalCompleteLesson = lessonOrchestrator.completeLesson
    lessonOrchestrator.completeLesson = completeLessonWithExtraction

    // ==========================================
    // RETURN STATEMENT (Much cleaner now!)
    // ==========================================
    
    return {
      // Expose everything from composables
      ...lessonOrchestrator,
      ...vocabulary,
      ...exercises,
      ...paymentValidation,
      ...sound,
      ...explanation,
      
      // Second chance system
      attemptCount,
      maxAttempts,
      isOnSecondChance,
      showCorrectAnswer,
      correctAnswerText,
      
      // Extraction and migration state
      extractionResults,
      migrationLoading,
      showMigrationPanel,
      userToken,
      
      // Core methods
      getUserProgress,
      isLastStep,
      handleSubmitOrNext,
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      
      // Enhanced completion methods
      completeLessonWithExtraction,
      extractLessonContent,
      showCompletionMessage,
      
      // Migration methods
      migrateLessonContent,
      showMigrationPanelModal,
      closeMigrationPanel,
      
      // Navigation
      goToNextExercise,
      goToNextQuiz,
      goNext,
      goPrevious,
      resetAttempts,
      moveToNextStep,
      
      // Vocabulary methods
      initializeVocabularyModal,
      jumpToVocabWord,
      showVocabDefinition,
      hideVocabDefinition,
      markWordAsLearned,
      nextVocabWord,
      previousVocabWord,
      skipVocabularyModal,
      restartVocabulary,
      pronounceWord,
      
      // Simplified event handlers (delegates to composables)
      handleAnswerChanged,
      handleMatchingItemSelected,
      handleRemoveMatchingPair,
      handleDragItemStart,
      handleDragOverZone,
      handleDragLeaveZone,
      handleDropInZone,
      handleRemoveDroppedItem,
      updateFillBlankAnswer,
      showHint,
      clearSmartHint,
      
      // AI and explanation methods
      askAboutExplanation,
      sendAIMessage,
      sendFloatingAIMessage,
      askAI,
      clearAIChat,
      toggleFloatingAI,
      closeFloatingAI,
      
      // Utility methods
      shareResult,
      goToHomework,
      goToVocabulary,
      getMedalIcon,
      
      // Additional properties from composables
      availableDragItems: exercises.availableDragItems,
      dropZones: exercises.dropZones
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";

/* NEW: Additional styles for extraction features */
.extraction-results {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.extraction-results h3 {
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  text-align: center;
}

.extraction-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.extraction-icon {
  font-size: 2rem;
  margin-right: 16px;
  flex-shrink: 0;
}

.extraction-content {
  flex: 1;
}

.extraction-content h4 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.extraction-content p {
  margin: 0 0 12px 0;
  opacity: 0.9;
}

.extraction-content button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.extraction-content button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* Migration panel styles */
.migration-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.migration-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.migration-content h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 1.5rem;
}

.migration-content p {
  margin: 0 0 24px 0;
  color: #666;
  line-height: 1.6;
}

.migration-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.migrate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.migrate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.migrate-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  background: #f1f3f4;
  color: #5f6368;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e8eaed;
  transform: translateY(-1px);
}
</style>