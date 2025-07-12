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
// Replace the entire script section in your LessonPage.vue with this:

import { computed, ref } from 'vue'

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
    sound.initializeSpeech?.()
    explanation.initializeAI?.()

    // ✅ VALIDATION FUNCTIONS - INLINE (REPLACES THE PLACEHOLDER!)
    
    const validateShortAnswer = (userAnswer, exercise) => {
      if (!userAnswer || typeof userAnswer !== 'string') {
        return false
      }

      const correctAnswers = getCorrectAnswersArray(exercise)
      const userAnswerTrimmed = userAnswer.trim().toLowerCase()

      console.log('🔍 Short answer validation:', {
        userAnswer: userAnswerTrimmed,
        correctAnswers
      })

      return correctAnswers.some(answer => {
        const correctAnswerTrimmed = String(answer).trim().toLowerCase()
        
        // Exact match
        if (userAnswerTrimmed === correctAnswerTrimmed) {
          return true
        }
        
        // Fuzzy match for typos (allowing 1-2 character differences for longer answers)
        if (correctAnswerTrimmed.length > 3) {
          const similarity = calculateSimilarity(userAnswerTrimmed, correctAnswerTrimmed)
          return similarity > 0.8 // 80% similarity threshold
        }
        
        return false
      })
    }

    const validateMultipleChoice = (userAnswer, exercise) => {
      const correctAnswer = exercise.correctAnswer
      console.log('🔍 MC Validation:', { userAnswer, correctAnswer, type: typeof correctAnswer, options: exercise.options })

      // Handle index-based answers (0, 1, 2, etc.)
      if (typeof correctAnswer === 'number') {
        if (typeof userAnswer === 'number') {
          return userAnswer === correctAnswer
        }
        
        // Convert option text to index
        if (exercise.options && Array.isArray(exercise.options)) {
          const userIndex = exercise.options.findIndex(option => {
            const optionText = typeof option === 'string' ? option : (option?.text || String(option))
            return optionText === userAnswer
          })
          return userIndex === correctAnswer
        }
      }

      // Handle text-based answers
      if (typeof correctAnswer === 'string') {
        if (typeof userAnswer === 'string') {
          return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        }
        
        // Convert index to option text
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
      console.log('🔍 T/F Validation:', { userAnswer, correctAnswer })

      // Handle boolean correctAnswer
      if (typeof correctAnswer === 'boolean') {
        if (typeof userAnswer === 'boolean') {
          return userAnswer === correctAnswer
        }
        if (typeof userAnswer === 'string') {
          const userBool = userAnswer.toLowerCase() === 'true'
          return userBool === correctAnswer
        }
        if (typeof userAnswer === 'number') {
          // 0 = true, 1 = false (typical quiz format)
          const userBool = userAnswer === 0
          return userBool === correctAnswer
        }
      }

      // Handle numeric correctAnswer (0 or 1)
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

      // Handle string correctAnswer
      if (typeof correctAnswer === 'string') {
        if (typeof userAnswer === 'string') {
          return userAnswer.toLowerCase() === correctAnswer.toLowerCase()
        }
      }

      return false
    }

    const validateFillBlank = (userAnswers, exercise) => {
      if (!Array.isArray(userAnswers)) {
        console.warn('❌ User answers is not an array')
        return false
      }

      const correctAnswers = exercise.correctAnswers || exercise.answers || exercise.blanks || []
      
      if (!Array.isArray(correctAnswers)) {
        console.warn('❌ Correct answers is not an array')
        return false
      }

      console.log('🔍 Fill-blank validation:', {
        userAnswers,
        correctAnswers,
        userLength: userAnswers.length,
        correctLength: correctAnswers.length
      })

      // Check if we have the right number of answers
      const requiredAnswers = correctAnswers.length
      if (userAnswers.length < requiredAnswers) {
        console.warn('❌ Not enough user answers provided')
        return false
      }

      // Validate each blank
      let correctCount = 0
      for (let i = 0; i < requiredAnswers; i++) {
        const userAnswer = String(userAnswers[i] || '').trim().toLowerCase()
        const correctAnswer = correctAnswers[i]

        if (!userAnswer) {
          console.log(`❌ Blank ${i + 1}: Empty answer`)
          continue
        }

        let isCorrect = false

        // Handle multiple possible answers
        if (Array.isArray(correctAnswer)) {
          isCorrect = correctAnswer.some(answer => 
            String(answer).trim().toLowerCase() === userAnswer
          )
        } else {
          const correctText = String(correctAnswer).trim().toLowerCase()
          isCorrect = userAnswer === correctText
          
          // Allow fuzzy matching for longer answers
          if (!isCorrect && correctText.length > 3) {
            const similarity = calculateSimilarity(userAnswer, correctText)
            isCorrect = similarity > 0.85
          }
        }

        if (isCorrect) {
          correctCount++
          console.log(`✅ Blank ${i + 1}: Correct`)
        } else {
          console.log(`❌ Blank ${i + 1}: "${userAnswer}" vs "${correctAnswer}"`)
        }
      }

      const success = correctCount === requiredAnswers
      console.log(`🎯 Fill-blank result: ${correctCount}/${requiredAnswers} correct = ${success}`)
      return success
    }

    const validateMatching = (userPairs, exercise) => {
      if (!Array.isArray(userPairs) || userPairs.length === 0) {
        console.warn('❌ No matching pairs provided')
        return false
      }

      const correctPairs = exercise.pairs || []
      if (!Array.isArray(correctPairs) || correctPairs.length === 0) {
        console.warn('❌ No correct pairs defined')
        return false
      }

      console.log('🔍 Matching validation:', {
        userPairs,
        correctPairs,
        userLength: userPairs.length,
        correctLength: correctPairs.length
      })

      // Check if user has made enough pairs
      if (userPairs.length < correctPairs.length) {
        console.warn('❌ Not enough pairs matched')
        return false
      }

      // For matching exercises, leftIndex should equal rightIndex for correct pairs
      // This means the first left item matches with the first right item, etc.
      let correctCount = 0
      for (const userPair of userPairs) {
        const { leftIndex, rightIndex } = userPair

        // Check if this is a correct pairing
        const isCorrect = leftIndex === rightIndex

        if (isCorrect) {
          correctCount++
          console.log(`✅ Matching pair ${leftIndex}-${rightIndex}: Correct`)
        } else {
          console.log(`❌ Matching pair ${leftIndex}-${rightIndex}: Incorrect`)
        }
      }

      const success = correctCount === correctPairs.length
      console.log(`🎯 Matching result: ${correctCount}/${correctPairs.length} correct = ${success}`)
      return success
    }

    const validateOrdering = (userItems, exercise) => {
      if (!Array.isArray(userItems) || userItems.length === 0) {
        console.warn('❌ No ordering items provided')
        return false
      }

      const correctItems = exercise.items || []
      if (!Array.isArray(correctItems) || correctItems.length === 0) {
        console.warn('❌ No correct order defined')
        return false
      }

      console.log('🔍 Ordering validation:', {
        userItems: userItems.map(item => item.text || item),
        correctItems,
        userLength: userItems.length,
        correctLength: correctItems.length
      })

      // Check if we have the right number of items
      if (userItems.length !== correctItems.length) {
        console.warn('❌ Item count mismatch')
        return false
      }

      // Check if items are in correct order
      let correctCount = 0
      for (let i = 0; i < correctItems.length; i++) {
        const userItem = userItems[i]
        const correctItem = correctItems[i]
        
        const userText = typeof userItem === 'string' ? userItem : (userItem?.text || String(userItem))
        const correctText = typeof correctItem === 'string' ? correctItem : (correctItem?.text || String(correctItem))
        
        if (userText.trim().toLowerCase() === correctText.trim().toLowerCase()) {
          correctCount++
          console.log(`✅ Position ${i + 1}: "${userText}" correct`)
        } else {
          console.log(`❌ Position ${i + 1}: "${userText}" vs "${correctText}"`)
        }
      }

      const success = correctCount === correctItems.length
      console.log(`🎯 Ordering result: ${correctCount}/${correctItems.length} correct = ${success}`)
      return success
    }

    const validateDragDrop = (userPlacements, exercise) => {
      if (!userPlacements || typeof userPlacements !== 'object') {
        console.warn('❌ No drag-drop placements provided')
        return false
      }

      const dropZones = exercise.dropZones || []
      if (!Array.isArray(dropZones) || dropZones.length === 0) {
        console.warn('❌ No drop zones defined')
        return false
      }

      console.log('🔍 Drag-drop validation:', {
        userPlacements,
        dropZones,
        placementCount: Object.keys(userPlacements).length
      })

      let correctCount = 0
      let totalRequired = 0

      for (const zone of dropZones) {
        const zoneId = zone.id || zone.label
        const userItems = userPlacements[zoneId] || []
        const correctItems = zone.correctItems || zone.items || []

        totalRequired += correctItems.length

        console.log(`🔍 Zone "${zoneId}":`, {
          userItems: userItems.map(item => item.text || item),
          correctItems,
          userCount: userItems.length,
          correctCount: correctItems.length
        })

        // Check each correct item is in the zone
        for (const correctItem of correctItems) {
          const isItemPresent = userItems.some(userItem => {
            const userText = typeof userItem === 'string' ? userItem : (userItem?.text || String(userItem))
            const correctText = typeof correctItem === 'string' ? correctItem : (correctItem?.text || String(correctItem))
            return userText.trim().toLowerCase() === correctText.trim().toLowerCase()
          })

          if (isItemPresent) {
            correctCount++
            console.log(`✅ "${correctItem}" correctly placed in "${zoneId}"`)
          } else {
            console.log(`❌ "${correctItem}" missing from "${zoneId}"`)
          }
        }
      }

      const success = correctCount === totalRequired && totalRequired > 0
      console.log(`🎯 Drag-drop result: ${correctCount}/${totalRequired} correct = ${success}`)
      return success
    }

    // Helper functions
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

    // Main validation function that routes to specific validators
    const validateUserAnswer = (userAnswer, exercise, stepType) => {
      if (!exercise) {
        console.warn('❌ No exercise provided for validation')
        return false
      }

      const exerciseType = exercise.type || 'short-answer'
      console.log('🔍 Validating answer:', {
        exerciseType,
        userAnswer,
        correctAnswer: exercise.correctAnswer || exercise.answer,
        exercise: exercise
      })

      switch (exerciseType) {
        case 'short-answer':
          return validateShortAnswer(userAnswer, exercise)
        
        case 'multiple-choice':
        case 'abc':
          return validateMultipleChoice(userAnswer, exercise)
        
        case 'true-false':
          return validateTrueFalse(userAnswer, exercise)
        
        default:
          console.warn(`⚠️ Unknown exercise type: ${exerciseType}, trying short answer`)
          return validateShortAnswer(userAnswer, exercise)
      }
    }

    const validateQuizAnswer = (userAnswer, quiz) => {
      if (!quiz) {
        console.warn('❌ No quiz provided for validation')
        return false
      }

      const quizType = quiz.type || 'multiple-choice'
      console.log('🔍 Quiz validation:', {
        quizType,
        userAnswer,
        correctAnswer: quiz.correctAnswer,
        options: quiz.options
      })

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

    // ✅ FIXED: Proper validation logic - REPLACES THE PLACEHOLDER!
    const handleSubmitOrNext = async () => {
      console.log('🎯 Submit/Next triggered')
      
      const currentStep = lessonOrchestrator.currentStep.value
      if (!currentStep) {
        console.warn('❌ No current step available')
        return
      }

      let isCorrect = false
      let exerciseOrQuiz = null

      // Determine if this is an exercise or quiz step
      if (currentStep.type === 'exercise' || currentStep.type === 'practice') {
        exerciseOrQuiz = exercises.getCurrentExercise(currentStep)
        
        if (exerciseOrQuiz) {
          console.log('🔍 Validating exercise:', {
            type: exerciseOrQuiz.type,
            question: exerciseOrQuiz.question,
            correctAnswer: exerciseOrQuiz.correctAnswer,
            userAnswer: exercises.userAnswer.value,
            fillBlanks: exercises.fillBlankAnswers.value,
            matching: exercises.matchingPairs.value,
            dragDrop: exercises.dragDropPlacements
          })

          // Use the proper validation function based on exercise type
          switch (exerciseOrQuiz.type) {
            case 'fill-blank':
              isCorrect = validateFillBlank(exercises.fillBlankAnswers.value, exerciseOrQuiz)
              break
            case 'matching':
              isCorrect = validateMatching(exercises.matchingPairs.value, exerciseOrQuiz)
              break
            case 'ordering':
              isCorrect = validateOrdering(exercises.orderingItems.value, exerciseOrQuiz)
              break
            case 'drag-drop':
              isCorrect = validateDragDrop(exercises.dragDropPlacements, exerciseOrQuiz)
              break
            case 'multiple-choice':
            case 'abc':
            case 'true-false':
            case 'short-answer':
            default:
              isCorrect = validateUserAnswer(exercises.userAnswer.value, exerciseOrQuiz, currentStep.type)
              break
          }
        }
      } else if (currentStep.type === 'quiz') {
        exerciseOrQuiz = exercises.getCurrentQuiz(currentStep)
        
        if (exerciseOrQuiz) {
          console.log('🔍 Validating quiz:', {
            type: exerciseOrQuiz.type,
            question: exerciseOrQuiz.question,
            correctAnswer: exerciseOrQuiz.correctAnswer,
            userAnswer: exercises.userAnswer.value
          })
          
          isCorrect = validateQuizAnswer(exercises.userAnswer.value, exerciseOrQuiz)
        }
      }

      // Process the result
      if (isCorrect) {
        exercises.answerWasCorrect.value = true
        exercises.confirmation.value = getRandomSuccessMessage()
        lessonOrchestrator.stars.value++
        lessonOrchestrator.earnedPoints.value += 10
        
        // Play success sound
        sound.playSuccessSound?.()
        
        console.log('✅ Answer correct!')
      } else {
        lessonOrchestrator.mistakeCount.value++
        exercises.answerWasCorrect.value = false
        lessonOrchestrator.earnedPoints.value = Math.max(0, lessonOrchestrator.earnedPoints.value - 2)
        exercises.confirmation.value = getRandomErrorMessage(exerciseOrQuiz)
        
        // Play error sound
        sound.playErrorSound?.()
        
        console.log('❌ Answer incorrect!')
        
        // Generate smart hint after 2+ mistakes
        if (lessonOrchestrator.mistakeCount.value >= 2) {
          await explanation.generateSmartHintForMistakes?.(
            exerciseOrQuiz,
            lessonOrchestrator.mistakeCount.value,
            { 
              lessonId: lessonOrchestrator.lesson.value._id,
              userAnswer: exercises.userAnswer.value || exercises.fillBlankAnswers.value || exercises.matchingPairs.value
            }
          )
        }
      }
      
      // Save progress
      await lessonOrchestrator.saveProgress()
    }

    // Helper functions for better UX
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

    const getRandomErrorMessage = (exercise) => {
      const messages = [
        '❌ Не совсем правильно. Попробуйте ещё раз!',
        '🤔 Подумайте ещё немного...',
        '💭 Близко, но не то. Попробуйте снова!',
        '🎯 Почти попали! Ещё одна попытка!',
        '📚 Перечитайте материал и попробуйте снова',
        '🔍 Внимательнее! У вас получится!'
      ]
      
      let message = messages[Math.floor(Math.random() * messages.length)]
      
      // Add type-specific hints
      if (exercise) {
        switch (exercise.type) {
          case 'fill-blank':
            message += ' Проверьте правописание.'
            break
          case 'matching':
            message += ' Проверьте соответствия.'
            break
          case 'multiple-choice':
            message += ' Внимательно прочитайте варианты.'
            break
          case 'drag-drop':
            message += ' Проверьте размещение элементов.'
            break
        }
      }
      
      return message
    }

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

    // Exercise methods
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

    // Other utility methods
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
    
    return {
      // Expose everything from composables
      ...lessonOrchestrator,
      ...vocabulary,
      ...exercises,
      ...paymentValidation,
      ...sound,
      ...explanation,
      
      // Methods with proper validation
      getUserProgress,
      isLastStep,
      handleSubmitOrNext, // NOW USES REAL VALIDATION!
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
      getMedalIcon,
      getRandomSuccessMessage,
      getRandomErrorMessage
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