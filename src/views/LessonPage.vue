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
      @report-problem="openProblemReportModal"
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
        @report-problem="openProblemReportModal"
      />

      <!-- Progress Bar -->
      <ProgressBar
        :progress-percentage="progressPercentage"
        :stars="stars"
        :current-step="currentIndex"
        :total-steps="steps.length"
      />

      <!-- Split Screen Content with Resizable Divider -->
      <div 
        class="split-content" 
        :class="{ 'is-resizing': isResizing }"
        ref="splitContainer"
      >
        <!-- Left Panel - Content Display -->
        <div 
          class="content-panel-wrapper" 
          :style="leftPanelStyle"
          ref="leftPanel"
        >
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
        </div>

        <!-- Enhanced Resizable Divider -->
        <div 
          class="split-divider"
          :class="{ 
            'active': isResizing,
            'hover': isDividerHovered 
          }"
          @mousedown="startResize"
          @touchstart="startResize"
          @keydown="handleResizeKeyboard"
          @mouseenter="isDividerHovered = true"
          @mouseleave="isDividerHovered = false"
          tabindex="0"
          role="separator"
          aria-label="Изменить ширину панелей"
          :aria-valuenow="Math.round(leftPanelWidth)"
          aria-valuemin="25"
          aria-valuemax="75"
        >
          <div class="divider-handle">
            <div class="divider-grip">
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
            </div>
          </div>
          
          <!-- Divider Tooltip -->
          <div class="divider-tooltip" :class="{ 'visible': isDividerHovered || isResizing }">
            <div class="tooltip-content">
              <span class="percentage-display">{{ Math.round(leftPanelWidth) }}% | {{ Math.round(rightPanelWidth) }}%</span>
              <small>Перетащите для изменения размера</small>
            </div>
          </div>
        </div>

        <!-- Right Panel - Interactive Content OR AI Help -->
        <div 
          class="right-panel-wrapper" 
          :style="rightPanelStyle"
          ref="rightPanel"
        >
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
              <div class="resize-help">
                <small>💡 Совет: Используйте разделитель для изменения размера панелей</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Resize Controls (Quick Presets) -->
      <div class="resize-controls">
        <div class="controls-group">
          <span class="controls-label">Быстрые настройки:</span>
          <button 
            @click="setQuickResize(25, 75)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(25, 75) }"
            title="25% / 75% - Контент слева минимально"
          >
            ◐
          </button>
          <button 
            @click="setQuickResize(50, 50)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(50, 50) }"
            title="50% / 50% - Равномерно"
          >
            ◑
          </button>
          <button 
            @click="setQuickResize(75, 25)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(75, 25) }"
            title="75% / 25% - Контент слева максимально"
          >
            ◒
          </button>
          <button 
            @click="resetToDefault" 
            class="resize-reset" 
            title="Сброс к значениям по умолчанию"
          >
            ⟲
          </button>
        </div>
      </div>

      <!-- Enhanced Resize Indicator -->
      <div v-if="isResizing" class="resize-indicator">
        <div class="indicator-content">
          <div class="size-display">
            <div class="left-size">
              <span class="label">Левая панель</span>
              <span class="value">{{ Math.round(leftPanelWidth) }}%</span>
            </div>
            <div class="divider-icon">⟷</div>
            <div class="right-size">
              <span class="label">Правая панель</span>
              <span class="value">{{ Math.round(rightPanelWidth) }}%</span>
            </div>
          </div>
          <div class="resize-hint">
            <small>Отпустите для применения • ESC для отмены</small>
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
      @report-problem="openProblemReportModal"
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
        @report-problem="openProblemReportModal"
      />

      <!-- Progress Bar -->
      <ProgressBar
        :progress-percentage="progressPercentage"
        :stars="stars"
        :current-step="currentIndex"
        :total-steps="steps.length"
      />

      <!-- Split Screen Content with Resizable Divider -->
      <div 
        class="split-content" 
        :class="{ 'is-resizing': isResizing }"
        ref="splitContainer"
      >
        <!-- Left Panel - Content Display -->
        <div 
          class="content-panel-wrapper" 
          :style="leftPanelStyle"
          ref="leftPanel"
        >
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
        </div>

        <!-- Enhanced Resizable Divider -->
        <div 
          class="split-divider"
          :class="{ 
            'active': isResizing,
            'hover': isDividerHovered 
          }"
          @mousedown="startResize"
          @touchstart="startResize"
          @keydown="handleResizeKeyboard"
          @mouseenter="isDividerHovered = true"
          @mouseleave="isDividerHovered = false"
          tabindex="0"
          role="separator"
          aria-label="Изменить ширину панелей"
          :aria-valuenow="Math.round(leftPanelWidth)"
          aria-valuemin="25"
          aria-valuemax="75"
        >
          <div class="divider-handle">
            <div class="divider-grip">
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
            </div>
          </div>
          
          <!-- Divider Tooltip -->
          <div class="divider-tooltip" :class="{ 'visible': isDividerHovered || isResizing }">
            <div class="tooltip-content">
              <span class="percentage-display">{{ Math.round(leftPanelWidth) }}% | {{ Math.round(rightPanelWidth) }}%</span>
              <small>Перетащите для изменения размера</small>
            </div>
          </div>
        </div>

        <!-- Right Panel - Interactive Content OR AI Help -->
        <div 
          class="right-panel-wrapper" 
          :style="rightPanelStyle"
          ref="rightPanel"
        >
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
              <div class="resize-help">
                <small>💡 Совет: Используйте разделитель для изменения размера панелей</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Resize Controls (Quick Presets) -->
      <div class="resize-controls">
        <div class="controls-group">
          <span class="controls-label">Быстрые настройки:</span>
          <button 
            @click="setQuickResize(25, 75)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(25, 75) }"
            title="25% / 75% - Контент слева минимально"
          >
            ◐
          </button>
          <button 
            @click="setQuickResize(50, 50)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(50, 50) }"
            title="50% / 50% - Равномерно"
          >
            ◑
          </button>
          <button 
            @click="setQuickResize(75, 25)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(75, 25) }"
            title="75% / 25% - Контент слева максимально"
          >
            ◒
          </button>
          <button 
            @click="resetToDefault" 
            class="resize-reset" 
            title="Сброс к значениям по умолчанию"
          >
            ⟲
          </button>
        </div>
      </div>

      <!-- Enhanced Resize Indicator -->
      <div v-if="isResizing" class="resize-indicator">
        <div class="indicator-content">
          <div class="size-display">
            <div class="left-size">
              <span class="label">Левая панель</span>
              <span class="value">{{ Math.round(leftPanelWidth) }}%</span>
            </div>
            <div class="divider-icon">⟷</div>
            <div class="right-size">
              <span class="label">Правая панель</span>
              <span class="value">{{ Math.round(rightPanelWidth) }}%</span>
            </div>
          </div>
          <div class="resize-hint">
            <small>Отпустите для применения • ESC для отмены</small>
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
export default {
  data() {
    return {
      // ... your existing data properties ...
      
      // Enhanced resizing properties
      leftPanelWidth: 50,
      rightPanelWidth: 50,
      defaultLeftWidth: 50,
      defaultRightWidth: 50,
      isResizing: false,
      isDividerHovered: false,
      startX: 0,
      startY: 0,
      startLeftWidth: 0,
      startRightWidth: 0,
      minPanelWidth: 25,
      maxPanelWidth: 75,
      
      // Touch handling
      lastTouchX: 0,
      lastTouchY: 0,
    }
  },
  
  computed: {
    leftPanelStyle() {
      return {
        width: `${this.leftPanelWidth}%`,
        minWidth: `${this.minPanelWidth}%`,
        maxWidth: `${this.maxPanelWidth}%`,
        transition: this.isResizing ? 'none' : 'width 0.2s ease-out'
      }
    },
    
    rightPanelStyle() {
      return {
        width: `${this.rightPanelWidth}%`,
        minWidth: `${this.minPanelWidth}%`,
        maxWidth: `${this.maxPanelWidth}%`,
        transition: this.isResizing ? 'none' : 'width 0.2s ease-out'
      }
    },
    
    widthIndicatorText() {
      return `${Math.round(this.leftPanelWidth)}% | ${Math.round(this.rightPanelWidth)}%`
    }
  },
  
  mounted() {
    // Add global event listeners for resizing
    document.addEventListener('mousemove', this.handleResize)
    document.addEventListener('mouseup', this.stopResize)
    document.addEventListener('touchmove', this.handleResize, { passive: false })
    document.addEventListener('touchend', this.stopResize)
    document.addEventListener('keydown', this.handleGlobalKeydown)
    
    // Load saved panel sizes from localStorage
    this.loadPanelSizes()
  },
  
  beforeUnmount() {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleResize)
    document.removeEventListener('mouseup', this.stopResize)
    document.removeEventListener('touchmove', this.handleResize)
    document.removeEventListener('touchend', this.stopResize)
    document.removeEventListener('keydown', this.handleGlobalKeydown)
  },
  
  methods: {
    // ... your existing methods ...
    
    startResize(event) {
      event.preventDefault()
      this.isResizing = true
      
      if (event.type === 'mousedown') {
        this.startX = event.clientX
        this.startY = event.clientY
      } else if (event.type === 'touchstart') {
        this.startX = event.touches[0].clientX
        this.startY = event.touches[0].clientY
        this.lastTouchX = this.startX
        this.lastTouchY = this.startY
      }
      
      this.startLeftWidth = this.leftPanelWidth
      this.startRightWidth = this.rightPanelWidth
      
      // Add active cursor to body
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      // Prevent text selection during resize
      document.body.classList.add('no-select')
    },
    
    handleResize(event) {
      if (!this.isResizing) return
      
      event.preventDefault()
      
      let currentX, currentY
      
      if (event.type === 'mousemove') {
        currentX = event.clientX
        currentY = event.clientY
      } else if (event.type === 'touchmove') {
        currentX = event.touches[0].clientX
        currentY = event.touches[0].clientY
        this.lastTouchX = currentX
        this.lastTouchY = currentY
      }
      
      const containerRect = this.$refs.splitContainer.getBoundingClientRect()
      const containerWidth = containerRect.width
      
      // Calculate the change in position
      const deltaX = currentX - this.startX
      const deltaPercentage = (deltaX / containerWidth) * 100
      
      // Calculate new widths
      let newLeftWidth = this.startLeftWidth + deltaPercentage
      let newRightWidth = this.startRightWidth - deltaPercentage
      
      // Apply constraints
      if (newLeftWidth < this.minPanelWidth) {
        newLeftWidth = this.minPanelWidth
        newRightWidth = 100 - newLeftWidth
      } else if (newLeftWidth > this.maxPanelWidth) {
        newLeftWidth = this.maxPanelWidth
        newRightWidth = 100 - newLeftWidth
      }
      
      if (newRightWidth < this.minPanelWidth) {
        newRightWidth = this.minPanelWidth
        newLeftWidth = 100 - newRightWidth
      } else if (newRightWidth > this.maxPanelWidth) {
        newRightWidth = this.maxPanelWidth
        newLeftWidth = 100 - newRightWidth
      }
      
      // Update the widths
      this.leftPanelWidth = newLeftWidth
      this.rightPanelWidth = newRightWidth
    },
    
    stopResize() {
      if (!this.isResizing) return
      
      this.isResizing = false
      this.isDividerHovered = false
      
      // Remove cursor and selection styles
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.classList.remove('no-select')
      
      // Save the new panel sizes
      this.savePanelSizes()
      
      // Emit resize event for any components that need to react
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    handleResizeKeyboard(event) {
      if (!this.isDividerHovered && !this.isResizing) return
      
      const step = event.shiftKey ? 10 : 5 // Larger steps with Shift
      let newLeftWidth = this.leftPanelWidth
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newLeftWidth = Math.max(this.minPanelWidth, this.leftPanelWidth - step)
          break
        case 'ArrowRight':
          event.preventDefault()
          newLeftWidth = Math.min(this.maxPanelWidth, this.leftPanelWidth + step)
          break
        case 'Home':
          event.preventDefault()
          newLeftWidth = this.minPanelWidth
          break
        case 'End':
          event.preventDefault()
          newLeftWidth = this.maxPanelWidth
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          newLeftWidth = 50 // Reset to center
          break
      }
      
      if (newLeftWidth !== this.leftPanelWidth) {
        this.leftPanelWidth = newLeftWidth
        this.rightPanelWidth = 100 - newLeftWidth
        this.savePanelSizes()
      }
    },
    
    handleGlobalKeydown(event) {
      // Allow ESC to cancel resize
      if (event.key === 'Escape' && this.isResizing) {
        this.leftPanelWidth = this.startLeftWidth
        this.rightPanelWidth = this.startRightWidth
        this.stopResize()
      }
    },
    
    setQuickResize(leftWidth, rightWidth) {
      this.leftPanelWidth = leftWidth
      this.rightPanelWidth = rightWidth
      this.savePanelSizes()
      
      // Trigger resize event
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    isQuickResizeActive(leftWidth, rightWidth) {
      return Math.abs(this.leftPanelWidth - leftWidth) < 1 && 
             Math.abs(this.rightPanelWidth - rightWidth) < 1
    },
    
    resetToDefault() {
      this.leftPanelWidth = this.defaultLeftWidth
      this.rightPanelWidth = this.defaultRightWidth
      this.savePanelSizes()
      
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    savePanelSizes() {
      try {
        const sizes = {
          leftWidth: this.leftPanelWidth,
          rightWidth: this.rightPanelWidth
        }
        localStorage.setItem('lesson-panel-sizes', JSON.stringify(sizes))
      } catch (error) {
        console.warn('Could not save panel sizes to localStorage:', error)
      }
    },
    
    loadPanelSizes() {
      try {
        const saved = localStorage.getItem('lesson-panel-sizes')
        if (saved) {
          const sizes = JSON.parse(saved)
          this.leftPanelWidth = sizes.leftWidth || this.defaultLeftWidth
          this.rightPanelWidth = sizes.rightWidth || this.defaultRightWidth
        }
      } catch (error) {
        console.warn('Could not load panel sizes from localStorage:', error)
        this.leftPanelWidth = this.defaultLeftWidth
        this.rightPanelWidth = this.defaultRightWidth
      }
    }
  }
}
</script><template>
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
      @report-problem="openProblemReportModal"
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
        @report-problem="openProblemReportModal"
      />

      <!-- Progress Bar -->
      <ProgressBar
        :progress-percentage="progressPercentage"
        :stars="stars"
        :current-step="currentIndex"
        :total-steps="steps.length"
      />

      <!-- Split Screen Content with Resizable Divider -->
      <div 
        class="split-content" 
        :class="{ 'is-resizing': isResizing }"
        ref="splitContainer"
      >
        <!-- Left Panel - Content Display -->
        <div 
          class="content-panel-wrapper" 
          :style="leftPanelStyle"
          ref="leftPanel"
        >
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
        </div>

        <!-- Enhanced Resizable Divider -->
        <div 
          class="split-divider"
          :class="{ 
            'active': isResizing,
            'hover': isDividerHovered 
          }"
          @mousedown="startResize"
          @touchstart="startResize"
          @keydown="handleResizeKeyboard"
          @mouseenter="isDividerHovered = true"
          @mouseleave="isDividerHovered = false"
          tabindex="0"
          role="separator"
          aria-label="Изменить ширину панелей"
          :aria-valuenow="Math.round(leftPanelWidth)"
          aria-valuemin="25"
          aria-valuemax="75"
        >
          <div class="divider-handle">
            <div class="divider-grip">
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
              <div class="grip-line"></div>
            </div>
          </div>
          
          <!-- Divider Tooltip -->
          <div class="divider-tooltip" :class="{ 'visible': isDividerHovered || isResizing }">
            <div class="tooltip-content">
              <span class="percentage-display">{{ Math.round(leftPanelWidth) }}% | {{ Math.round(rightPanelWidth) }}%</span>
              <small>Перетащите для изменения размера</small>
            </div>
          </div>
        </div>

        <!-- Right Panel - Interactive Content OR AI Help -->
        <div 
          class="right-panel-wrapper" 
          :style="rightPanelStyle"
          ref="rightPanel"
        >
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
              <div class="resize-help">
                <small>💡 Совет: Используйте разделитель для изменения размера панелей</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Resize Controls (Quick Presets) -->
      <div class="resize-controls">
        <div class="controls-group">
          <span class="controls-label">Быстрые настройки:</span>
          <button 
            @click="setQuickResize(25, 75)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(25, 75) }"
            title="25% / 75% - Контент слева минимально"
          >
            ◐
          </button>
          <button 
            @click="setQuickResize(50, 50)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(50, 50) }"
            title="50% / 50% - Равномерно"
          >
            ◑
          </button>
          <button 
            @click="setQuickResize(75, 25)" 
            class="resize-preset" 
            :class="{ active: isQuickResizeActive(75, 25) }"
            title="75% / 25% - Контент слева максимально"
          >
            ◒
          </button>
          <button 
            @click="resetToDefault" 
            class="resize-reset" 
            title="Сброс к значениям по умолчанию"
          >
            ⟲
          </button>
        </div>
      </div>

      <!-- Enhanced Resize Indicator -->
      <div v-if="isResizing" class="resize-indicator">
        <div class="indicator-content">
          <div class="size-display">
            <div class="left-size">
              <span class="label">Левая панель</span>
              <span class="value">{{ Math.round(leftPanelWidth) }}%</span>
            </div>
            <div class="divider-icon">⟷</div>
            <div class="right-size">
              <span class="label">Правая панель</span>
              <span class="value">{{ Math.round(rightPanelWidth) }}%</span>
            </div>
          </div>
          <div class="resize-hint">
            <small>Отпустите для применения • ESC для отмены</small>
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
export default {
  data() {
    return {
      // ... your existing data properties ...
      
      // Enhanced resizing properties
      leftPanelWidth: 50,
      rightPanelWidth: 50,
      defaultLeftWidth: 50,
      defaultRightWidth: 50,
      isResizing: false,
      isDividerHovered: false,
      startX: 0,
      startY: 0,
      startLeftWidth: 0,
      startRightWidth: 0,
      minPanelWidth: 25,
      maxPanelWidth: 75,
      
      // Touch handling
      lastTouchX: 0,
      lastTouchY: 0,
    }
  },
  
  computed: {
    leftPanelStyle() {
      return {
        width: `${this.leftPanelWidth}%`,
        minWidth: `${this.minPanelWidth}%`,
        maxWidth: `${this.maxPanelWidth}%`,
        transition: this.isResizing ? 'none' : 'width 0.2s ease-out'
      }
    },
    
    rightPanelStyle() {
      return {
        width: `${this.rightPanelWidth}%`,
        minWidth: `${this.minPanelWidth}%`,
        maxWidth: `${this.maxPanelWidth}%`,
        transition: this.isResizing ? 'none' : 'width 0.2s ease-out'
      }
    },
    
    widthIndicatorText() {
      return `${Math.round(this.leftPanelWidth)}% | ${Math.round(this.rightPanelWidth)}%`
    }
  },
  
  mounted() {
    // Add global event listeners for resizing
    document.addEventListener('mousemove', this.handleResize)
    document.addEventListener('mouseup', this.stopResize)
    document.addEventListener('touchmove', this.handleResize, { passive: false })
    document.addEventListener('touchend', this.stopResize)
    document.addEventListener('keydown', this.handleGlobalKeydown)
    
    // Load saved panel sizes from localStorage
    this.loadPanelSizes()
  },
  
  beforeUnmount() {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleResize)
    document.removeEventListener('mouseup', this.stopResize)
    document.removeEventListener('touchmove', this.handleResize)
    document.removeEventListener('touchend', this.stopResize)
    document.removeEventListener('keydown', this.handleGlobalKeydown)
  },
  
  methods: {
    // ... your existing methods ...
    
    startResize(event) {
      event.preventDefault()
      this.isResizing = true
      
      if (event.type === 'mousedown') {
        this.startX = event.clientX
        this.startY = event.clientY
      } else if (event.type === 'touchstart') {
        this.startX = event.touches[0].clientX
        this.startY = event.touches[0].clientY
        this.lastTouchX = this.startX
        this.lastTouchY = this.startY
      }
      
      this.startLeftWidth = this.leftPanelWidth
      this.startRightWidth = this.rightPanelWidth
      
      // Add active cursor to body
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      // Prevent text selection during resize
      document.body.classList.add('no-select')
    },
    
    handleResize(event) {
      if (!this.isResizing) return
      
      event.preventDefault()
      
      let currentX, currentY
      
      if (event.type === 'mousemove') {
        currentX = event.clientX
        currentY = event.clientY
      } else if (event.type === 'touchmove') {
        currentX = event.touches[0].clientX
        currentY = event.touches[0].clientY
        this.lastTouchX = currentX
        this.lastTouchY = currentY
      }
      
      const containerRect = this.$refs.splitContainer.getBoundingClientRect()
      const containerWidth = containerRect.width
      
      // Calculate the change in position
      const deltaX = currentX - this.startX
      const deltaPercentage = (deltaX / containerWidth) * 100
      
      // Calculate new widths
      let newLeftWidth = this.startLeftWidth + deltaPercentage
      let newRightWidth = this.startRightWidth - deltaPercentage
      
      // Apply constraints
      if (newLeftWidth < this.minPanelWidth) {
        newLeftWidth = this.minPanelWidth
        newRightWidth = 100 - newLeftWidth
      } else if (newLeftWidth > this.maxPanelWidth) {
        newLeftWidth = this.maxPanelWidth
        newRightWidth = 100 - newLeftWidth
      }
      
      if (newRightWidth < this.minPanelWidth) {
        newRightWidth = this.minPanelWidth
        newLeftWidth = 100 - newRightWidth
      } else if (newRightWidth > this.maxPanelWidth) {
        newRightWidth = this.maxPanelWidth
        newLeftWidth = 100 - newRightWidth
      }
      
      // Update the widths
      this.leftPanelWidth = newLeftWidth
      this.rightPanelWidth = newRightWidth
    },
    
    stopResize() {
      if (!this.isResizing) return
      
      this.isResizing = false
      this.isDividerHovered = false
      
      // Remove cursor and selection styles
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.classList.remove('no-select')
      
      // Save the new panel sizes
      this.savePanelSizes()
      
      // Emit resize event for any components that need to react
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    handleResizeKeyboard(event) {
      if (!this.isDividerHovered && !this.isResizing) return
      
      const step = event.shiftKey ? 10 : 5 // Larger steps with Shift
      let newLeftWidth = this.leftPanelWidth
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newLeftWidth = Math.max(this.minPanelWidth, this.leftPanelWidth - step)
          break
        case 'ArrowRight':
          event.preventDefault()
          newLeftWidth = Math.min(this.maxPanelWidth, this.leftPanelWidth + step)
          break
        case 'Home':
          event.preventDefault()
          newLeftWidth = this.minPanelWidth
          break
        case 'End':
          event.preventDefault()
          newLeftWidth = this.maxPanelWidth
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          newLeftWidth = 50 // Reset to center
          break
      }
      
      if (newLeftWidth !== this.leftPanelWidth) {
        this.leftPanelWidth = newLeftWidth
        this.rightPanelWidth = 100 - newLeftWidth
        this.savePanelSizes()
      }
    },
    
    handleGlobalKeydown(event) {
      // Allow ESC to cancel resize
      if (event.key === 'Escape' && this.isResizing) {
        this.leftPanelWidth = this.startLeftWidth
        this.rightPanelWidth = this.startRightWidth
        this.stopResize()
      }
    },
    
    setQuickResize(leftWidth, rightWidth) {
      this.leftPanelWidth = leftWidth
      this.rightPanelWidth = rightWidth
      this.savePanelSizes()
      
      // Trigger resize event
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    isQuickResizeActive(leftWidth, rightWidth) {
      return Math.abs(this.leftPanelWidth - leftWidth) < 1 && 
             Math.abs(this.rightPanelWidth - rightWidth) < 1
    },
    
    resetToDefault() {
      this.leftPanelWidth = this.defaultLeftWidth
      this.rightPanelWidth = this.defaultRightWidth
      this.savePanelSizes()
      
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    
    savePanelSizes() {
      try {
        const sizes = {
          leftWidth: this.leftPanelWidth,
          rightWidth: this.rightPanelWidth
        }
        localStorage.setItem('lesson-panel-sizes', JSON.stringify(sizes))
      } catch (error) {
        console.warn('Could not save panel sizes to localStorage:', error)
      }
    },
    
    loadPanelSizes() {
      try {
        const saved = localStorage.getItem('lesson-panel-sizes')
        if (saved) {
          const sizes = JSON.parse(saved)
          this.leftPanelWidth = sizes.leftWidth || this.defaultLeftWidth
          this.rightPanelWidth = sizes.rightWidth || this.defaultRightWidth
        }
      } catch (error) {
        console.warn('Could not load panel sizes from localStorage:', error)
        this.leftPanelWidth = this.defaultLeftWidth
        this.rightPanelWidth = this.defaultRightWidth
      }
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";
</style>