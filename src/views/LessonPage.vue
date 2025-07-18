<template>
  <div class="lesson-page">
    <!-- REMOVED: No floating button anymore -->

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
        <button @click="handleReturnToCatalogue" class="back-btn">⬅️ К каталогу</button>
      </div>
    </div>

    <!-- Paywall Modal -->
    <div v-if="showPaywallModal" class="modal-overlay">
      <div class="modal-content">
        <h3>🔒 Платный контент</h3>
        <p>Этот урок доступен только для подписчиков.</p>
        <div class="modal-actions">
          <button @click="$router.push('/pay/start')" class="premium-btn">💳 Получить подписку</button>
          <button @click="handleReturnToCatalogue" class="cancel-btn">⬅️ Назад к каталогу</button>
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

    <!-- Enhanced Problem Report Modal -->
    <div v-if="showProblemReportModal" class="modal-overlay" @click.self="closeProblemReportModal">
      <div class="problem-report-modal">
        <div class="modal-header">
          <h3>⚠️ Сообщить о проблеме с уроком</h3>
          <button @click="closeProblemReportModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <p class="modal-description">
            Помогите нам улучшить урок! Опишите проблему подробно и приложите скриншот, если это возможно.
          </p>
          
          <div class="form-group">
            <label for="problemType">Тип проблемы:</label>
            <select id="problemType" v-model="problemType" class="form-select">
              <option value="">Выберите тип проблемы</option>
              <option value="content">Ошибка в содержании</option>
              <option value="technical">Техническая проблема</option>
              <option value="interface">Проблема с интерфейсом</option>
              <option value="exercise">Ошибка в упражнении</option>
              <option value="audio">Проблема со звуком</option>
              <option value="other">Другое</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="problemDescription">Подробное описание проблемы: <span class="required">*</span></label>
            <textarea 
              id="problemDescription" 
              v-model="problemDescription" 
              rows="4" 
              placeholder="Опишите проблему как можно подробнее: что произошло, на каком шаге, что вы ожидали увидеть..."
              class="form-textarea"
              :class="{ 'error': showValidationError && !problemDescription.trim() }"
            ></textarea>
            <div v-if="showValidationError && !problemDescription.trim()" class="error-message">
              Пожалуйста, опишите проблему
            </div>
          </div>
          
          <div class="form-group">
            <label for="screenshotUrl">Ссылка на скриншот или фото (необязательно):</label>
            <input 
              type="url" 
              id="screenshotUrl" 
              v-model="screenshotUrl" 
              placeholder="https://example.com/screenshot.png или вставьте ссылку с облачного хранилища"
              class="form-input"
            >
            <div class="help-text">
              💡 Совет: Сделайте скриншот и загрузите его на imgbb.com, imgur.com или Google Drive, затем вставьте ссылку сюда
            </div>
          </div>
          
          <div class="form-group">
            <label for="contactInfo">Ваш контакт для обратной связи (необязательно):</label>
            <input 
              type="text" 
              id="contactInfo" 
              v-model="contactInfo" 
              placeholder="Telegram @username, email или телефон"
              class="form-input"
            >
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeProblemReportModal" class="cancel-btn">
            Отмена
          </button>
          <button 
            @click="submitProblemReport" 
            class="submit-btn"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '📤 Отправка...' : '📤 Отправить отчет' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success notification -->
    <div v-if="showSuccessMessage" class="success-notification">
      <div class="success-content">
        <div class="success-icon">✅</div>
        <div class="success-text">
          <h4>Спасибо за отчет!</h4>
          <p>Мы получили вашу информацию и рассмотрим проблему в ближайшее время.</p>
        </div>
        <button @click="closeSuccessMessage" class="close-success">✕</button>
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

    <!-- Intro Screen with Problem Report Button at Bottom -->
    <LessonIntro
      v-if="!started && !showPaywallModal && !loading && !error"
      :lesson="lesson"
      :estimated-time="estimatedTime"
      :steps="steps"
      :previous-progress="previousProgress"
      @start="startLesson"
      @continue="continuePreviousProgress"
      @exit="confirmExit"
      @report-problem="openProblemReportModal"
    />

    <!-- Main Lesson Content -->
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">

      <!-- Top Header with Problem Report Strip Below -->
      <LessonHeader
        :lesson="lesson"
        :current-step="currentIndex + 1"
        :total-steps="steps.length"
        :formatted-time="formattedTime"
        :stars="stars"
        @exit="confirmExit"
        @report-problem="openProblemReportModal"
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
      @return-to-catalogue="handleReturnToCatalogue"
      @share="shareResult"
      @homework="handleGoToHomework"
      @vocabulary="goToVocabulary"
    >
      <!-- Slot for additional buttons/content in CompletionScreen -->
      <template #extra-actions>
        <button @click="openProblemReportModal" class="btn-secondary">
          ⚠️ Сообщить о проблеме с уроком
        </button>
      </template>
    </CompletionScreen>

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
// ✅ FULLY UPDATED LessonPage.vue <script> with Problem Reporting Integration
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'; // Import useRouter

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
    const router = useRouter(); // Initialize router
    
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
    // PROBLEM REPORTING STATE
    // ==========================================
    const showProblemReportModal = ref(false);
    const problemDescription = ref('');
    const problemType = ref('');
    const screenshotUrl = ref('');
    const contactInfo = ref('');
    const isSubmitting = ref(false);
    const showValidationError = ref(false);
    const showSuccessMessage = ref(false);

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
    // PROBLEM REPORTING METHODS
    // ==========================================
    const openProblemReportModal = () => {
      showProblemReportModal.value = true;
      resetProblemForm();
    };

    const closeProblemReportModal = () => {
      showProblemReportModal.value = false;
      resetProblemForm();
    };

    const resetProblemForm = () => {
      problemDescription.value = '';
      problemType.value = '';
      screenshotUrl.value = '';
      contactInfo.value = '';
      isSubmitting.value = false;
      showValidationError.value = false;
    };

    const validateForm = () => {
      const isValid = problemDescription.value.trim().length > 0;
      showValidationError.value = !isValid;
      return isValid;
    };

    const getCurrentLessonInfo = () => {
      return {
        lessonName: lessonOrchestrator.lesson.value?.lessonName || 'Неизвестный урок',
        lessonId: lessonOrchestrator.lesson.value?._id || 'N/A',
        currentStep: lessonOrchestrator.currentIndex.value + 1,
        totalSteps: lessonOrchestrator.steps.value?.length || 0,
        userAgent: navigator.userAgent,
        timestamp: new Date().toLocaleString('ru-RU'),
        url: window.location.href
      };
    };

    const formatProblemReport = () => {
      const lessonInfo = getCurrentLessonInfo();
      
      let message = `🚨 ОТЧЕТ О ПРОБЛЕМЕ В УРОКЕ\n\n`;
      
      // Lesson Information
      message += `📚 Урок: ${lessonInfo.lessonName}\n`;
      message += `🆔 ID урока: ${lessonInfo.lessonId}\n`;
      message += `📍 Текущий шаг: ${lessonInfo.currentStep}/${lessonInfo.totalSteps}\n`;
      message += `🕐 Время: ${lessonInfo.timestamp}\n\n`;
      
      // Problem Details
      if (problemType.value) {
        const typeLabels = {
          content: 'Ошибка в содержании',
          technical: 'Техническая проблема',
          interface: 'Проблема с интерфейсом',
          exercise: 'Ошибка в упражнении',
          audio: 'Проблема со звуком',
          other: 'Другое'
        };
        message += `⚠️ Тип проблемы: ${typeLabels[problemType.value]}\n\n`;
      }
      
      message += `📝 Описание проблемы:\n${problemDescription.value}\n\n`;
      
      if (screenshotUrl.value) {
        message += `📸 Скриншот: ${screenshotUrl.value}\n\n`;
      }
      
      if (contactInfo.value) {
        message += `📞 Контакт: ${contactInfo.value}\n\n`;
      }
      
      // Technical Information
      message += `🔧 ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ:\n`;
      message += `🌐 URL: ${lessonInfo.url}\n`;
      message += `💻 Браузер: ${lessonInfo.userAgent}\n`;
      
      return message;
    };

    const submitProblemReport = async () => {
      if (!validateForm()) {
        return;
      }
      
      try {
        isSubmitting.value = true;
        
        const reportMessage = formatProblemReport();
        const encodedMessage = encodeURIComponent(reportMessage);
        const telegramLink = `https://t.me/aced_live?text=${encodedMessage}`;
        
        // Log the report for analytics (optional)
        console.log('📊 Problem Report Submitted:', {
          lessonId: getCurrentLessonInfo().lessonId,
          problemType: problemType.value,
          hasScreenshot: !!screenshotUrl.value,
          hasContact: !!contactInfo.value,
          timestamp: new Date().toISOString()
        });
        
        // Optional: Send to your analytics API
        try {
          await fetch('/api/analytics/problem-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken.value}`
            },
            body: JSON.stringify({
              lessonId: getCurrentLessonInfo().lessonId,
              problemType: problemType.value,
              description: problemDescription.value,
              hasScreenshot: !!screenshotUrl.value,
              hasContact: !!contactInfo.value,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            })
          });
        } catch (analyticsError) {
          console.warn('Analytics logging failed:', analyticsError);
          // Don't block the main flow if analytics fails
        }
        
        // Open Telegram with the formatted message
        window.open(telegramLink, '_blank');
        
        // Show success message
        closeProblemReportModal();
        showSuccessMessage.value = true;
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          showSuccessMessage.value = false;
        }, 5000);
        
      } catch (error) {
        console.error('❌ Error submitting problem report:', error);
        
        // Show error toast if available
        if (lessonOrchestrator.showToast) {
          lessonOrchestrator.showToast('Ошибка при отправке отчета. Попробуйте еще раз.', 'error');
        } else {
          alert('Ошибка при отправке отчета. Попробуйте еще раз.');
        }
      } finally {
        isSubmitting.value = false;
      }
    };

    const closeSuccessMessage = () => {
      showSuccessMessage.value = false;
    };

    // Alternative method: Direct problem report without modal (for quick access)
    const quickProblemReport = (issueType = 'technical') => {
      const lessonInfo = getCurrentLessonInfo();
      const message = `🚨 Быстрый отчет о проблеме в уроке "${lessonInfo.lessonName}" (Шаг ${lessonInfo.currentStep}/${lessonInfo.totalSteps}). Тип: ${issueType}. Время: ${lessonInfo.timestamp}`;
      const encodedMessage = encodeURIComponent(message);
      const telegramLink = `https://t.me/aced_live?text=${encodedMessage}`;
      window.open(telegramLink, '_blank');
    };

    // Keyboard shortcut support (Ctrl+Shift+R to report problem)
    const handleKeyboardShortcuts = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        if (!showProblemReportModal.value && lessonOrchestrator.started.value && !lessonOrchestrator.lessonCompleted.value) {
          openProblemReportModal();
        }
      }
    };

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
          initializationTracker.value = { currentExerciseId: exerciseId, initialized: false }
          nextTick(() => {
            exercises.initializeCurrentExerciseData(exercise)
            initializationTracker.value.initialized = true
          })
        }
      }
      return exercise
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

    // ==========================================
    // SIMPLIFIED EVENT HANDLERS (Delegate to composable)
    // ==========================================
    const handleAnswerChanged = (newAnswer) => {
      console.log('📝 Answer changed:', newAnswer)
      exercises.updateUserAnswer(newAnswer, getCurrentExercise())
    }
    
    const updateFillBlankAnswer = ({ index, value }) => {
      exercises.updateFillBlankAnswer(index, value)
    }
    
    const handleMatchingItemSelected = (selection) => {
      console.log('🔗 Handling matching item selection:', selection)
      exercises.handleMatchingSelection(selection)
    }
    
    const handleRemoveMatchingPair = (pairIndex) => {
      console.log('🗑️ Handling remove matching pair:', pairIndex)
      exercises.removeMatchingPair(pairIndex)
    }
    
    const handleDragItemStart = ({ item, type }) => {
      exercises.handleDragItemStart({ item, type });
    }

    const handleDragOverZone = (zoneId) => {
      exercises.handleDragOverZone(zoneId);
    }

    const handleDragLeaveZone = (zoneId) => {
      exercises.handleDragLeaveZone(zoneId);
    }

    const handleDropInZone = ({ zoneId, item, type }) => {
      exercises.handleDropInZone({ zoneId, item, type });
    }

    const handleRemoveDroppedItem = (item) => {
      exercises.handleRemoveDroppedItem(item);
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
          lessonOrchestrator.earnedPoints.value += 5 // ✅ Use composable message method
          exercises.confirmation.value = exercises.getRandomSuccessMessage() + ' 🌟 Бонус за первую попытку!'
        } else {
          exercises.confirmation.value = exercises.getRandomSuccessMessage() + ' 💪 Отлично, со второй попытки!'
        }
        sound.playSuccessSound?.()
        isOnSecondChance.value = false
      } else {
        exercises.answerWasCorrect.value = false
        if (attemptCount.value < maxAttempts.value) {
          isOnSecondChance.value = true // ✅ Use composable message method
          exercises.confirmation.value = exercises.getSecondChanceMessage(exerciseOrQuiz)
          sound.playErrorSound?.()
          return
        } else {
          lessonOrchestrator.mistakeCount.value++
          lessonOrchestrator.earnedPoints.value = Math.max(0, lessonOrchestrator.earnedPoints.value - 2)
          showCorrectAnswer.value = true // ✅ Use composable display method
          correctAnswerText.value = exercises.getCorrectAnswerDisplay(exerciseOrQuiz)
          exercises.confirmation.value = exercises.getFinalFailureMessage(exerciseOrQuiz, correctAnswerText.value)
          isOnSecondChance.value = false
          sound.playErrorSound?.()
          if (lessonOrchestrator.mistakeCount.value >= 2) {
            await explanation.generateSmartHintForMistakes?.(
              exerciseOrQuiz,
              lessonOrchestrator.mistakeCount.value,
              { lessonId: lessonOrchestrator.lesson.value._id, userAnswer: exercises.getCurrentUserAnswer(), correctAnswer: correctAnswerText.value }
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
      initializationTracker.value = { currentExerciseId: null, initialized: false }
    }
    
    const moveToNextStep = () => {
      resetAttempts()
      if (exercises.isLastExercise?.(lessonOrchestrator.currentStep.value) || exercises.isLastQuiz?.(lessonOrchestrator.currentStep.value)) {
        lessonOrchestrator.goNext()
      } else {
        if (lessonOrchestrator.currentStep.value.type === 'exercise' || lessonOrchestrator.currentStep.value.type === 'practice') {
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
    // NAVIGATION FUNCTIONS FOR COMPLETION SCREEN
    // ==========================================
    const handleReturnToCatalogue = () => {
      router.push({ name: 'CataloguePage' }); // Correctly uses the named route for CataloguePage
    };

    const handleGoToHomework = () => {
      if (lessonOrchestrator.lesson.value?._id) {
        router.push({
          name: 'LessonHomeworkPage', // Uses the named route for lesson-specific homework
          params: { lessonId: lessonOrchestrator.lesson.value._id },
          query: {
            title: lessonOrchestrator.lesson.value.title, // Pass title for context
            subject: lessonOrchestrator.lesson.value.subject // Pass subject for context
          }
        });
      } else {
        console.error('❌ Cannot navigate to homework: Lesson ID is missing.');
        // Fallback to the generic homework list page if lesson ID is not available
        router.push({ name: 'HomeworkList' });
      }
    };

    // ==========================================
    // SIMPLIFIED EXERCISE METHODS (Delegate to composable)
    // ==========================================
    const showHint = (exercise) => exercises.showHint(exercise);
    const clearSmartHint = () => exercises.clearSmartHint();

    // ==========================================
    // AI HELP PANEL METHODS
    // ==========================================
    const toggleExplanationHelp = explanation.toggleExplanationHelp;
    const askAboutExplanation = explanation.askAboutExplanation;
    const sendAIMessage = explanation.sendAIMessage;
    const askAI = explanation.askAI;
    const clearAIChat = explanation.clearAIChat;

    // ==========================================
    // FLOATING AI ASSISTANT METHODS
    // ==========================================
    const toggleFloatingAI = explanation.toggleFloatingAI;
    const closeFloatingAI = explanation.closeFloatingAI;
    const sendFloatingAIMessage = explanation.sendFloatingAIMessage;

    // ==========================================
    // CONFETTI ANIMATION
    // ==========================================
    const confettiCanvas = ref(null);
    const showConfetti = ref(false);

    const startConfetti = () => {
      showConfetti.value = true;
      nextTick(() => {
        // Implement your confetti logic here using confettiCanvas.value
        // For example: confetti({ canvas: confettiCanvas.value, ... });
        // This part would depend on your confetti library.
        console.log('Starting confetti animation...');
        setTimeout(() => {
          showConfetti.value = false;
        }, 5000); // Stop confetti after 5 seconds
      });
    };

    // ==========================================
    // LIFECYCLE HOOKS
    // ==========================================
    
    // Add keyboard event listener when component is mounted
    onMounted(() => {
      document.addEventListener('keydown', handleKeyboardShortcuts);
    });

    // Remove keyboard event listener when component is unmounted
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    });

    // ==========================================
    // WATCHERS
    // ==========================================
    watch(() => lessonOrchestrator.lessonCompleted.value, (newVal) => {
      if (newVal) {
        console.log('Lesson completed watcher triggered!');
        startConfetti();
      }
    });

    // ==========================================
    // RETURN ALL PROPS AND METHODS
    // ==========================================

    return {
      // Data and state from lessonOrchestrator
      loading: lessonOrchestrator.loading,
      error: lessonOrchestrator.error,
      lesson: lessonOrchestrator.lesson,
      started: lessonOrchestrator.started,
      currentIndex: lessonOrchestrator.currentIndex,
      steps: lessonOrchestrator.steps,
      progressPercentage: lessonOrchestrator.progressPercentage,
      currentStep: lessonOrchestrator.currentStep,
      isInteractiveStep: lessonOrchestrator.isInteractiveStep,
      showPaywallModal: paymentValidation.showPaywallModal,
      showExitModal: lessonOrchestrator.showExitModal,
      lessonCompleted: lessonOrchestrator.lessonCompleted,
      readableTime: lessonOrchestrator.readableTime,
      stars: lessonOrchestrator.stars,
      mistakeCount: lessonOrchestrator.mistakeCount,
      earnedPoints: lessonOrchestrator.earnedPoints,
      medalLabel: lessonOrchestrator.medalLabel,
      getMedalIcon: lessonOrchestrator.getMedalIcon,
      progressInsight: lessonOrchestrator.progressInsight,
      estimatedTime: lessonOrchestrator.estimatedTime,
      previousProgress: lessonOrchestrator.previousProgress,
      formattedTime: lessonOrchestrator.formattedTime,

      // Exercise state
      userAnswer: exercises.userAnswer,
      confirmation: exercises.confirmation,
      answerWasCorrect: exercises.answerWasCorrect,
      currentHint: exercises.currentHint,
      smartHint: explanation.smartHint,
      fillBlankAnswers: exercises.fillBlankAnswers,
      matchingPairs: exercises.matchingPairs,
      selectedMatchingItem: exercises.selectedMatchingItem,
      orderingItems: exercises.orderingItems,
      dragDropPlacements: exercises.dragDropPlacements,
      availableDragItems: exercises.availableDragItems,
      dropZones: exercises.dropZones,
      currentExerciseIndex: exercises.currentExerciseIndex,
      currentQuizIndex: exercises.currentQuizIndex,

      // Local lesson state
      attemptCount,
      maxAttempts,
      showCorrectAnswer,
      correctAnswerText,
      isOnSecondChance,
      showMigrationPanel,
      migrationLoading,
      extractionResults,

      // AI Explanation and Chat
      showExplanationHelp: explanation.showExplanationHelp,
      explanationQuestion: explanation.explanationQuestion,
      explanationAIResponse: explanation.explanationAIResponse,
      isLoadingExplanation: explanation.isLoadingExplanation,
      aiSuggestions: explanation.aiSuggestions,
      aiChatInput: explanation.aiChatInput,
      aiChatHistory: explanation.aiChatHistory,
      aiIsLoading: explanation.aiIsLoading,
      aiUsage: explanation.aiUsage,
      showFloatingAI: explanation.showFloatingAI,
      floatingAIInput: explanation.floatingAIInput,
      quickSuggestions: explanation.quickSuggestions,

      // Vocabulary Modal
      vocabularyModal: vocabulary.vocabularyModal,
      cardAnimation: vocabulary.cardAnimation,
      currentVocabWord: vocabulary.currentWord,
      vocabProgress: vocabulary.progress,
      isLastVocabWord: vocabulary.isLastWord,

      // Problem Reporting
      showProblemReportModal,
      problemDescription,
      problemType,
      screenshotUrl,
      contactInfo,
      isSubmitting,
      showValidationError,
      showSuccessMessage,

      // Confetti
      confettiCanvas,
      showConfetti,

      // Lesson orchestrator methods
      retryLoad: lessonOrchestrator.retryLoad,
      startLesson: lessonOrchestrator.startLesson,
      continuePreviousProgress: lessonOrchestrator.continuePreviousProgress,
      confirmExit: lessonOrchestrator.confirmExit,
      exitLesson: lessonOrchestrator.exitLesson,
      cancelExit: lessonOrchestrator.cancelExit,
      shareResult: lessonOrchestrator.shareResult,
      goToVocabulary: lessonOrchestrator.goToVocabulary,
      getLessonProgress: lessonOrchestrator.getLessonProgress,

      // Exercise methods
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      handleAnswerChanged,
      updateFillBlankAnswer,
      handleSubmitOrNext,
      goToNextExercise,
      goToNextQuiz,
      goNext,
      goPrevious,
      showHint,
      clearSmartHint,
      handleMatchingItemSelected,
      handleRemoveMatchingPair,
      handleDragItemStart,
      handleDragOverZone,
      handleDragLeaveZone,
      handleDropInZone,
      handleRemoveDroppedItem,

      // AI Help Panel Methods
      toggleExplanationHelp,
      askAboutExplanation,
      sendAIMessage,
      askAI,
      clearAIChat,

      // Floating AI Assistant Methods
      toggleFloatingAI,
      closeFloatingAI,
      sendFloatingAIMessage,

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

      // Migration methods
      migrateLessonContent,
      showMigrationPanelModal,
      closeMigrationPanel,

      // Navigation methods
      handleReturnToCatalogue,
      handleGoToHomework,

      // Problem Reporting methods
      openProblemReportModal,
      closeProblemReportModal,
      submitProblemReport,
      closeSuccessMessage,
      quickProblemReport
    }
  }
}
</script>


<style scoped>
/* Remove the floating button styles from your CSS: */

/* REMOVE THESE STYLES:
.floating-problem-report-btn { ... }
*/

/* Keep all other existing styles from LessonPage.css */
@import "@/assets/css/LessonPage.css";

/* Add any remaining modal styles that might be missing */
.problem-report-modal {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.2rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  background: #f8fafc;
  border-left: 4px solid #f59e0b;
  padding: 16px;
  margin-bottom: 24px;
  border-radius: 0 8px 8px 0;
  color: #374151;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.required {
  color: #ef4444;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  box-sizing: border-box;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.form-textarea.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 6px;
  font-weight: 500;
}

.help-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.4;
}

.modal-footer {
  background: #f9fafb;
  padding: 20px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.cancel-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.submit-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  font-size: 0.95rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* SUCCESS NOTIFICATION */
.success-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.success-content {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  max-width: 400px;
}

.success-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.success-text h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
}

.success-text p {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.close-success {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-success:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>