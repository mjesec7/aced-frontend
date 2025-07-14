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
      @return-to-catalogue="$router.push('/profile/catalogue')"   
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
    // REACTIVE STATE
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
    // HELPER FUNCTIONS
    // ==========================================
    
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

    // ==========================================
    // EXERCISE INITIALIZATION
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
    // VALIDATION FUNCTIONS
    // ==========================================
    
    const validateShortAnswer = (userAnswer, exercise) => {
      if (!userAnswer || typeof userAnswer !== 'string') {
        return false
      }

      const correctAnswers = getCorrectAnswersArray(exercise)
      const userAnswerTrimmed = userAnswer.trim().toLowerCase()

      return correctAnswers.some(answer => {
        const correctAnswerTrimmed = String(answer).trim().toLowerCase()
        
        if (userAnswerTrimmed === correctAnswerTrimmed) {
          return true
        }
        
        if (correctAnswerTrimmed.length > 3) {
          const similarity = calculateSimilarity(userAnswerTrimmed, correctAnswerTrimmed)
          return similarity > 0.8
        }
        
        return false
      })
    }

    const validateMultipleChoice = (userAnswer, exercise) => {
      const correctAnswer = exercise.correctAnswer

      if (typeof correctAnswer === 'number') {
        if (typeof userAnswer === 'number') {
          return userAnswer === correctAnswer
        }
        
        if (exercise.options && Array.isArray(exercise.options)) {
          const userIndex = exercise.options.findIndex(option => {
            const optionText = typeof option === 'string' ? option : (option?.text || String(option))
            return optionText === userAnswer
          })
          return userIndex === correctAnswer
        }
      }

      if (typeof correctAnswer === 'string') {
        if (typeof userAnswer === 'string') {
          return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        }
        
        if (typeof userAnswer === 'number' && exercise.options) {
          const selectedOption = exercise.options[userAnswer]
          const selectedText = typeof selectedOption === 'string' ? selectedOption : (selectedOption?.text || String(selectedOption))
          return selectedText.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        }
      }

      return false
    }

    const validateTrueFalse = (userAnswer, exercise) => {
      const correctAnswer = exercise.correctAnswer

      if (typeof correctAnswer === 'boolean') {
        if (typeof userAnswer === 'boolean') {
          return userAnswer === correctAnswer
        }
        if (typeof userAnswer === 'string') {
          const userBool = userAnswer.toLowerCase() === 'true'
          return userBool === correctAnswer
        }
        if (typeof userAnswer === 'number') {
          const userBool = userAnswer === 0
          return userBool === correctAnswer
        }
      }

      if (typeof correctAnswer === 'number') {
        if (typeof userAnswer === 'number') {
          return userAnswer === correctAnswer
        }
        if (typeof userAnswer === 'string') {
          if (userAnswer.toLowerCase() === 'true') {
            return correctAnswer === 0
          }
          if (userAnswer.toLowerCase() === 'false') {
            return correctAnswer === 1
          }
        }
      }

      if (typeof correctAnswer === 'string') {
        if (typeof userAnswer === 'string') {
          return userAnswer.toLowerCase() === correctAnswer.toLowerCase()
        }
      }

      return false
    }

    const validateFillBlank = (userAnswers, exercise) => {
      if (!Array.isArray(userAnswers)) {
        return false
      }

      let correctAnswers = []
      
      if (exercise.blanks && Array.isArray(exercise.blanks)) {
        correctAnswers = exercise.blanks.map(blank => {
          if (typeof blank === 'string') {
            return blank
          } else if (blank && blank.answer) {
            return blank.answer
          } else if (blank && blank.text) {
            return blank.text
          } else {
            return String(blank)
          }
        })
      } else if (exercise.correctAnswers && Array.isArray(exercise.correctAnswers)) {
        correctAnswers = exercise.correctAnswers
      } else if (exercise.answers && Array.isArray(exercise.answers)) {
        correctAnswers = exercise.answers
      } else {
        const hint = exercise.hint || ''
        if (hint.includes(',')) {
          correctAnswers = hint.split(',').map(h => h.trim())
        } else {
          correctAnswers = [hint]
        }
      }
      
      const finalCorrectAnswers = correctAnswers.map(answer => {
        if (typeof answer === 'string') {
          return answer.trim()
        } else if (typeof answer === 'object' && answer !== null) {
          return answer.answer || answer.text || answer.value || answer.correct || String(answer)
        } else {
          return String(answer || '').trim()
        }
      }).filter(answer => answer && answer.trim())

      if (finalCorrectAnswers.length === 0) {
        return false
      }

      let correctCount = 0
      for (let i = 0; i < finalCorrectAnswers.length; i++) {
        const userAnswer = String(userAnswers[i] || '').trim().toLowerCase()
        const correctAnswer = finalCorrectAnswers[i]

        if (!userAnswer || !correctAnswer) {
          continue
        }

        let isCorrect = false

        if (Array.isArray(correctAnswer)) {
          isCorrect = correctAnswer.some(answer => {
            const answerText = String(answer || '').trim().toLowerCase()
            return answerText === userAnswer
          })
        } else {
          const correctText = String(correctAnswer || '').trim().toLowerCase()
          isCorrect = userAnswer === correctText
          
          if (!isCorrect && correctText.length > 3) {
            const similarity = calculateSimilarity(userAnswer, correctText)
            isCorrect = similarity > 0.85
          }
        }

        if (isCorrect) {
          correctCount++
        }
      }

      return correctCount === finalCorrectAnswers.length
    }

    const validateMatching = (userPairs, exercise) => {
      console.log('🔗 Validating matching exercise')
      
      if (!Array.isArray(userPairs) || userPairs.length === 0) {
        console.log('❌ No user pairs provided')
        return false
      }

      const exercisePairs = exercise.pairs || []
      if (!Array.isArray(exercisePairs) || exercisePairs.length === 0) {
        console.log('❌ No exercise pairs found')
        return false
      }

      if (userPairs.length !== exercisePairs.length) {
        console.log(`❌ Incomplete: ${userPairs.length}/${exercisePairs.length} pairs`)
        return false
      }

      let correctCount = 0
      
      for (let i = 0; i < userPairs.length; i++) {
        const userPair = userPairs[i]
        
        if (!userPair || typeof userPair !== 'object') {
          console.log(`❌ Invalid pair at index ${i}:`, userPair)
          continue
        }

        const leftIndex = userPair.leftIndex
        const rightIndex = userPair.rightIndex

        console.log(`🔍 Checking pair ${i}: leftIndex=${leftIndex}, rightIndex=${rightIndex}`)

        if (leftIndex === rightIndex) {
          correctCount++
          console.log(`✅ CORRECT: Index ${leftIndex} matches ${rightIndex}`)
        } else {
          console.log(`❌ WRONG: Index ${leftIndex} does not match ${rightIndex}`)
        }
      }

      const isValid = correctCount === exercisePairs.length
      console.log(`🎯 Validation result: ${correctCount}/${exercisePairs.length} correct = ${isValid}`)
      
      return isValid
    }

    const validateOrdering = (userItems, exercise) => {
      console.log('🔄 Validating ordering exercise:', {
        userItems: userItems,
        exerciseItems: exercise.items,
        userItemsCount: Array.isArray(userItems) ? userItems.length : 0,
        exerciseItemsCount: Array.isArray(exercise.items) ? exercise.items.length : 0
      })
      
      if (!Array.isArray(userItems) || userItems.length === 0) {
        console.log('❌ No user items provided')
        return false
      }

      const correctItems = exercise.items || []
      if (!Array.isArray(correctItems) || correctItems.length === 0) {
        console.log('❌ No correct items found in exercise')
        return false
      }

      if (userItems.length !== correctItems.length) {
        console.log(`❌ Length mismatch: user=${userItems.length}, correct=${correctItems.length}`)
        return false
      }

      let correctCount = 0
      for (let i = 0; i < correctItems.length; i++) {
        const userItem = userItems[i]
        const correctItem = correctItems[i]
        
        const userText = typeof userItem === 'string' ? userItem : 
                        (userItem?.text || userItem?.id || String(userItem))
        const correctText = typeof correctItem === 'string' ? correctItem : 
                           (correctItem?.text || correctItem?.id || String(correctItem))
        
        console.log(`  Comparing position ${i}: "${userText}" vs "${correctText}"`)
        
        if (userText.trim().toLowerCase() === correctText.trim().toLowerCase()) {
          correctCount++
          console.log(`    ✅ Match at position ${i}`)
        } else {
          console.log(`    ❌ No match at position ${i}`)
        }
      }

      const isValid = correctCount === correctItems.length
      console.log(`🎯 Ordering validation result: ${correctCount}/${correctItems.length} correct = ${isValid}`)
      
      return isValid
    }

    const validateDragDrop = (userPlacements, exercise) => {
      if (!userPlacements || typeof userPlacements !== 'object') {
        return false
      }

      let dropZones = []
      
      if (Array.isArray(exercise.dropZones)) {
        dropZones = exercise.dropZones
      } else if (exercise.dropZones && typeof exercise.dropZones === 'object') {
        dropZones = Object.values(exercise.dropZones).filter(zone => 
          zone && (zone.label || zone.id)
        )
      } else {
        return false
      }

      let correctCount = 0
      let totalRequired = 0

      for (const zone of dropZones) {
        const zoneId = zone.id || zone.label || String(zone)
        const userItems = userPlacements[zoneId] || []
        
        let correctItems = []
        if (Array.isArray(zone.correctItems)) {
          correctItems = zone.correctItems
        } else if (Array.isArray(zone.items)) {
          correctItems = zone.items
        } else if (zone.correctItem !== undefined) {
          if (typeof zone.correctItem === 'number' && exercise.dragItems) {
            const dragItems = Array.isArray(exercise.dragItems) ? exercise.dragItems : Object.values(exercise.dragItems)
            correctItems = [dragItems[zone.correctItem]]
          } else {
            correctItems = [zone.correctItem]
          }
        }

        totalRequired += correctItems.length

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

    const validateUserAnswer = (userAnswer, exercise, stepType) => {
      if (!exercise) {
        return false
      }

      const exerciseType = exercise.type || 'short-answer'

      switch (exerciseType) {
        case 'short-answer':
          return validateShortAnswer(userAnswer, exercise)
        case 'multiple-choice':
        case 'abc':
          return validateMultipleChoice(userAnswer, exercise)
        case 'true-false':
          return validateTrueFalse(userAnswer, exercise)
        default:
          return validateShortAnswer(userAnswer, exercise)
      }
    }

    const validateQuizAnswer = (userAnswer, quiz) => {
      if (!quiz) {
        return false
      }

      const quizType = quiz.type || 'multiple-choice'

      switch (quizType) {
        case 'multiple-choice':
          return validateMultipleChoice(userAnswer, quiz)
        case 'true-false':
          return validateTrueFalse(userAnswer, quiz)
        case 'short-answer':
          return validateShortAnswer(userAnswer, quiz)
        default:
          return validateMultipleChoice(userAnswer, quiz)
      }
    }

    // ==========================================
    // CORRECT ANSWER DISPLAY
    // ==========================================
    
    const getCorrectAnswerDisplay = (exercise) => {
      if (!exercise) return ''

      const exerciseType = exercise.type || 'short-answer'
      
      switch (exerciseType) {
        case 'multiple-choice':
        case 'abc':
          if (typeof exercise.correctAnswer === 'number' && exercise.options) {
            const correctOption = exercise.options[exercise.correctAnswer]
            return typeof correctOption === 'string' ? correctOption : (correctOption?.text || String(correctOption))
          }
          return String(exercise.correctAnswer || '')

        case 'true-false':
          if (typeof exercise.correctAnswer === 'boolean') {
            return exercise.correctAnswer ? 'Правда' : 'Ложь'
          }
          if (typeof exercise.correctAnswer === 'number') {
            return exercise.correctAnswer === 0 ? 'Правда' : 'Ложь'
          }
          return String(exercise.correctAnswer || '')

        case 'fill-blank':
          let correctAnswers = []
          
          if (exercise.blanks && Array.isArray(exercise.blanks)) {
            correctAnswers = exercise.blanks.map(blank => {
              if (typeof blank === 'string') {
                return blank
              } else if (blank && blank.answer) {
                return blank.answer
              } else if (blank && blank.text) {
                return blank.text
              } else {
                return String(blank)
              }
            })
          } else if (exercise.correctAnswers && Array.isArray(exercise.correctAnswers)) {
            correctAnswers = exercise.correctAnswers
          } else if (exercise.answers && Array.isArray(exercise.answers)) {
            correctAnswers = exercise.answers
          } else if (exercise.hint) {
            correctAnswers = exercise.hint.split(',').map(h => h.trim())
          }
          
          const displayAnswers = correctAnswers.map(answer => {
            if (typeof answer === 'string') {
              return answer.trim()
            } else if (typeof answer === 'object' && answer !== null) {
              return answer.answer || answer.text || answer.value || answer.correct || String(answer)
            } else {
              return String(answer || '').trim()
            }
          }).filter(answer => answer && answer.trim())
          
          return displayAnswers.join(', ')

        case 'matching':
          if (exercise.pairs && Array.isArray(exercise.pairs)) {
            return exercise.pairs.map((pair, index) => {
              let leftItem = ''
              let rightItem = ''
              
              if (Array.isArray(pair)) {
                leftItem = String(pair[0] || '')
                rightItem = String(pair[1] || '')
              } else if (pair && typeof pair === 'object') {
                leftItem = String(pair.left || pair[0] || pair.question || pair.term || '')
                rightItem = String(pair.right || pair[1] || pair.answer || pair.definition || '')
              } else {
                leftItem = String(pair || '')
                rightItem = String(pair || '')
              }
              
              return `${leftItem} ↔ ${rightItem}`
            }).join('; ')
          }
          return 'Правильные соответствия: каждый левый элемент соединяется с соответствующим правым элементом по порядку'

        case 'ordering':
          if (exercise.items && Array.isArray(exercise.items)) {
            return exercise.items.map((item, index) => 
              `${index + 1}. ${typeof item === 'string' ? item : (item?.text || String(item))}`
            ).join('; ')
          }
          return 'Правильный порядок показан выше'

        case 'drag-drop':
          let dropZones = []
          if (Array.isArray(exercise.dropZones)) {
            dropZones = exercise.dropZones
          } else if (exercise.dropZones && typeof exercise.dropZones === 'object') {
            dropZones = Object.values(exercise.dropZones)
          }
          
          return dropZones.map(zone => {
            let items = []
            if (Array.isArray(zone.correctItems)) {
              items = zone.correctItems
            } else if (Array.isArray(zone.items)) {
              items = zone.items
            } else if (zone.correctItem !== undefined) {
              if (typeof zone.correctItem === 'number' && exercise.dragItems) {
                const dragItems = Array.isArray(exercise.dragItems) ? exercise.dragItems : Object.values(exercise.dragItems)
                items = [dragItems[zone.correctItem]]
              } else {
                items = [zone.correctItem]
              }
            }
            
            const itemTexts = items.map(item => 
              typeof item === 'string' ? item : (item?.text || String(item))
            )
            
            return `${zone.label || zone.id}: ${itemTexts.join(', ')}`
          }).join('; ')

        default:
          return String(exercise.correctAnswer || exercise.answer || '')
      }
    }

    // ==========================================
    // MESSAGE FUNCTIONS
    // ==========================================
    
    const getSecondChanceMessage = (exercise) => {
      const messages = [
        '🤔 Не совсем правильно. У вас есть ещё одна попытка!',
        '💭 Подумайте ещё немного. Попробуйте снова!',
        '🎯 Почти попали! Ещё одна попытка!',
        '🔍 Внимательнее! У вас есть вторая попытка!',
        '📚 Перечитайте материал и попробуйте ещё раз!',
        '⚡ Не сдавайтесь! Попробуйте другой вариант!'
      ]
      
      let message = messages[Math.floor(Math.random() * messages.length)]
      
      if (exercise) {
        switch (exercise.type) {
          case 'fill-blank':
            message += ' Проверьте правописание и попробуйте синонимы.'
            break
          case 'matching':
            message += ' Подумайте о логических связях между элементами.'
            break
          case 'multiple-choice':
            message += ' Внимательно прочитайте все варианты.'
            break
          case 'drag-drop':
            message += ' Попробуйте другое размещение элементов.'
            break
          case 'true-false':
            message += ' Подумайте о правильности утверждения.'
            break
          case 'ordering':
            message += ' Проверьте правильность последовательности.'
            break
        }
      }
      
      return message
    }

    const getFinalFailureMessage = (exercise, correctAnswer) => {
      const messages = [
        '📚 Не беспокойтесь! Правильный ответ:',
        '💡 Вот правильный ответ:',
        '🎯 Правильный ответ:',
        '✅ Запомните правильный ответ:'
      ]
      
      const message = messages[Math.floor(Math.random() * messages.length)]
      return `${message} ${correctAnswer}`
    }

    const getRandomSuccessMessage = () => {
      const messages = [
        '✅ Отлично! Правильный ответ!',
        '🎉 Верно! Так держать!',
        '⭐ Великолепно! Продолжайте!',
        '🚀 Правильно! Вы молодец!',
        '💯 Точно в цель! Отличная работа!',
        '🏆 Превосходно! Идём дальше!'
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================

    const handleAnswerChanged = (newAnswer) => {
      console.log('📝 Answer changed:', newAnswer)
      
      const currentExercise = getCurrentExercise()
      
      if (currentExercise?.type === 'matching') {
        exercises.matchingPairs.value = newAnswer || []
        exercises.userAnswer.value = newAnswer || []
        
        console.log('🔗 Updated matching pairs:', exercises.matchingPairs.value)
      } else if (currentExercise?.type === 'ordering') {
        exercises.userAnswer.value = newAnswer || []
        console.log('🔄 Updated ordering items:', exercises.userAnswer.value)
      } else {
        exercises.userAnswer.value = newAnswer
      }
    }

    const handleMatchingItemSelected = (selection) => {
      console.log('🔗 Handling matching item selection:', selection)
      exercises.selectedMatchingItem.value = selection
    }

    const handleRemoveMatchingPair = (pairIndex) => {
      console.log('🗑️ Handling remove matching pair:', pairIndex)
      
      if (pairIndex >= 0 && pairIndex < exercises.matchingPairs.value.length) {
        const updatedPairs = exercises.matchingPairs.value.filter((_, index) => index !== pairIndex)
        exercises.matchingPairs.value = updatedPairs
        exercises.userAnswer.value = updatedPairs
        
        console.log('  ✅ Pair removed, updated pairs:', updatedPairs)
      } else {
        console.warn('  ⚠️ Invalid pair index for removal:', pairIndex)
      }
    }

    // ==========================================
    // MAIN SUBMISSION HANDLER
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

      let isCorrect = false
      let exerciseOrQuiz = null

      if (currentStep.type === 'exercise' || currentStep.type === 'practice') {
        exerciseOrQuiz = getCurrentExercise()
        
        if (exerciseOrQuiz) {
          switch (exerciseOrQuiz.type) {
            case 'fill-blank':
              isCorrect = validateFillBlank(exercises.fillBlankAnswers.value, exerciseOrQuiz)
              break
            case 'matching':
              isCorrect = validateMatching(exercises.matchingPairs.value, exerciseOrQuiz)
              break
            case 'ordering':
              const orderingItems = exercises.userAnswer.value || []
              console.log('🔄 Validating ordering with items:', orderingItems)
              isCorrect = validateOrdering(orderingItems, exerciseOrQuiz)
              break
            case 'drag-drop':
              isCorrect = validateDragDrop(exercises.dragDropPlacements, exerciseOrQuiz)
              break
            default:
              isCorrect = validateUserAnswer(exercises.userAnswer.value, exerciseOrQuiz, currentStep.type)
              break
          }
        }
      } else if (currentStep.type === 'quiz') {
        exerciseOrQuiz = exercises.getCurrentQuiz(currentStep)
        
        if (exerciseOrQuiz) {
          isCorrect = validateQuizAnswer(exercises.userAnswer.value, exerciseOrQuiz)
        }
      }

      attemptCount.value++

      if (isCorrect) {
        exercises.answerWasCorrect.value = true
        lessonOrchestrator.stars.value++
        lessonOrchestrator.earnedPoints.value += 10
        
        if (attemptCount.value === 1) {
          lessonOrchestrator.earnedPoints.value += 5
          exercises.confirmation.value = getRandomSuccessMessage() + ' 🌟 Бонус за первую попытку!'
        } else {
          exercises.confirmation.value = getRandomSuccessMessage() + ' 💪 Отлично, со второй попытки!'
        }
        
        sound.playSuccessSound?.()
        isOnSecondChance.value = false
        
      } else {
        exercises.answerWasCorrect.value = false
        
        if (attemptCount.value < maxAttempts.value) {
          isOnSecondChance.value = true
          exercises.confirmation.value = getSecondChanceMessage(exerciseOrQuiz)
          sound.playErrorSound?.()
          
          return
          
        } else {
          lessonOrchestrator.mistakeCount.value++
          lessonOrchestrator.earnedPoints.value = Math.max(0, lessonOrchestrator.earnedPoints.value - 2)
          
          showCorrectAnswer.value = true
          correctAnswerText.value = getCorrectAnswerDisplay(exerciseOrQuiz)
          exercises.confirmation.value = getFinalFailureMessage(exerciseOrQuiz, correctAnswerText.value)
          
          isOnSecondChance.value = false
          sound.playErrorSound?.()
          
          if (lessonOrchestrator.mistakeCount.value >= 2) {
            await explanation.generateSmartHintForMistakes?.(
              exerciseOrQuiz,
              lessonOrchestrator.mistakeCount.value,
              { 
                lessonId: lessonOrchestrator.lesson.value._id,
                userAnswer: exercises.userAnswer.value || exercises.fillBlankAnswers.value || exercises.matchingPairs.value,
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
    // EXERCISE METHODS
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
    // DRAG AND DROP EVENT HANDLERS
    // ==========================================
    
    const handleDragItemStart = (item) => {
      exercises.draggedDragItem.value = item
    }

    const handleDragOverZone = (zoneId) => {
      exercises.dropOverZone.value = zoneId
    }

    const handleDragLeaveZone = () => {
      exercises.dropOverZone.value = null
    }

    const handleDropInZone = ({ zoneId, item }) => {
      if (!exercises.dragDropPlacements) {
        exercises.dragDropPlacements = {}
      }
      
      if (!exercises.dragDropPlacements[zoneId]) {
        exercises.dragDropPlacements[zoneId] = []
      }
      
      const itemText = typeof item === 'string' ? item : (item?.text || item?.label || String(item))
      
      Object.keys(exercises.dragDropPlacements).forEach(otherZoneId => {
        if (otherZoneId !== zoneId && Array.isArray(exercises.dragDropPlacements[otherZoneId])) {
          exercises.dragDropPlacements[otherZoneId] = exercises.dragDropPlacements[otherZoneId].filter(placedItem => {
            const placedText = typeof placedItem === 'string' ? placedItem : (placedItem?.text || placedItem?.label || String(placedItem))
            return placedText !== itemText
          })
        }
      })
      
      const isAlreadyInZone = exercises.dragDropPlacements[zoneId].some(placedItem => {
        const placedText = typeof placedItem === 'string' ? placedItem : (placedItem?.text || placedItem?.label || String(placedItem))
        return placedText === itemText
      })
      
      if (!isAlreadyInZone) {
        exercises.dragDropPlacements[zoneId].push(item)
      }
      
      const updatedPlacements = {}
      Object.keys(exercises.dragDropPlacements).forEach(key => {
        updatedPlacements[key] = [...exercises.dragDropPlacements[key]]
      })
      
      Object.keys(exercises.dragDropPlacements).forEach(key => {
        delete exercises.dragDropPlacements[key]
      })
      
      Object.assign(exercises.dragDropPlacements, updatedPlacements)
    }

    const handleRemoveDroppedItem = ({ zoneId, itemIndex, item }) => {
      if (!exercises.dragDropPlacements || 
          !exercises.dragDropPlacements[zoneId] || 
          !exercises.dragDropPlacements[zoneId][itemIndex]) {
        return
      }
      
      exercises.dragDropPlacements[zoneId].splice(itemIndex, 1)
      
      const updatedPlacements = {}
      Object.keys(exercises.dragDropPlacements).forEach(key => {
        updatedPlacements[key] = [...exercises.dragDropPlacements[key]]
      })
      
      Object.keys(exercises.dragDropPlacements).forEach(key => {
        delete exercises.dragDropPlacements[key]
      })
      
      Object.assign(exercises.dragDropPlacements, updatedPlacements)
    }

    const updateFillBlankAnswer = (index, event) => {
      if (!exercises.fillBlankAnswers.value || !Array.isArray(exercises.fillBlankAnswers.value)) {
        exercises.fillBlankAnswers.value = []
      }
      
      while (exercises.fillBlankAnswers.value.length <= index) {
        exercises.fillBlankAnswers.value.push('')
      }
      
      const newValue = event.target ? event.target.value : event
      exercises.fillBlankAnswers.value[index] = newValue
      
      exercises.fillBlankAnswers.value = [...exercises.fillBlankAnswers.value]
    }

    const showHint = () => {
      exercises.currentHint.value = "Внимательно прочитайте вопрос и подумайте о правильном ответе."
    }

    const clearSmartHint = () => {
      exercises.smartHint.value = ''
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
    
    const goToHomework = () => {
      lessonOrchestrator.router?.push(`/profile/homeworks/${lessonOrchestrator.lesson.value._id}`)
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

    // ==========================================
    // RETURN STATEMENT
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
      
      // Core methods
      getUserProgress,
      isLastStep,
      handleSubmitOrNext,
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      
      // Navigation
      goToNextExercise,
      goToNextQuiz,
      goNext,
      goPrevious,
      resetAttempts,
      moveToNextStep,
      
      // Display methods
      getCorrectAnswerDisplay,
      getSecondChanceMessage,
      getFinalFailureMessage,
      getRandomSuccessMessage,
      
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
      
      // Event handlers
      handleAnswerChanged,
      handleMatchingItemSelected,
      handleRemoveMatchingPair,
      
      // Other event handlers
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
      getMedalIcon,
      
      // Additional properties
      availableDragItems: exercises.availableDragItems,
      dropZones: exercises.dropZones
    }
  }
}
</script>
<style scoped>
@import "@/assets/css/LessonPage.css";
</style>