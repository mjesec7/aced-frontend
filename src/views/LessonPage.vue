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

    <!-- ✅ NEW: Vocabulary Learning Modal -->
    <div v-if="vocabularyModal.isVisible" class="vocabulary-modal-overlay">
      <div class="vocabulary-modal-container">
        
        <!-- Modal Header -->
        <div class="vocabulary-modal-header">
          <div class="vocab-progress-section">
            <div class="vocab-progress-bar">
              <div class="vocab-progress-fill" :style="{ width: vocabProgress + '%' }"></div>
            </div>
            <div class="vocab-progress-text">
              {{ vocabularyModal.currentIndex + 1 }} / {{ vocabularyModal.words.length }}
            </div>
          </div>
          
          <div class="vocab-header-actions">
            <button @click="skipVocabularyModal" class="vocab-skip-btn" title="Пропустить и перейти к списку">
              ⏭️ Пропустить
            </button>
            <button @click="confirmExit" class="vocab-close-btn" title="Выйти из урока">
              ✕
            </button>
          </div>
        </div>

        <!-- Vocabulary Card Container -->
        <div v-if="!vocabularyModal.isCompleted && !vocabularyModal.showingList" class="vocabulary-card-container">
          
          <!-- Main Vocabulary Card -->
          <div class="vocabulary-card" 
               :class="{ 
                 'flipped': cardAnimation.showDefinition, 
                 'flipping': cardAnimation.isFlipping,
                 'learned': currentVocabWord?.learned
               }">
            
            <!-- Front of Card (Term) -->
            <div class="card-front" @click="showVocabDefinition">
              <div class="card-content">
                <div class="vocab-term-section">
                  <h2 class="vocab-term">{{ currentVocabWord?.term || 'Loading...' }}</h2>
                  
                  <div v-if="currentVocabWord?.pronunciation" class="vocab-pronunciation">
                    /{{ currentVocabWord.pronunciation }}/
                  </div>
                  
                  <div v-if="currentVocabWord?.partOfSpeech" class="vocab-part-of-speech">
                    {{ currentVocabWord.partOfSpeech }}
                  </div>
                </div>
                
                <div class="card-instruction">
                  <div class="instruction-icon">👆</div>
                  <p>Нажмите, чтобы увидеть определение</p>
                </div>
                
                <!-- Pronunciation Button -->
                <button 
                  v-if="currentVocabWord?.term" 
                  @click.stop="pronounceWord(currentVocabWord.term)"
                  class="pronunciation-btn"
                  title="Произношение"
                >
                  🔊
                </button>
              </div>
            </div>

            <!-- Back of Card (Definition) -->
            <div class="card-back" @click="hideVocabDefinition">
              <div class="card-content">
                <div class="vocab-definition-section">
                  <h3 class="vocab-term-small">{{ currentVocabWord?.term }}</h3>
                  
                  <div class="vocab-definition">
                    {{ currentVocabWord?.definition || 'Определение не найдено' }}
                  </div>
                  
                  <div v-if="currentVocabWord?.example" class="vocab-example">
                    <strong>Пример:</strong><br>
                    <em>{{ currentVocabWord.example }}</em>
                  </div>
                </div>
                
                <div class="card-instruction">
                  <div class="instruction-icon">👆</div>
                  <p>Нажмите, чтобы вернуться к термину</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="vocab-card-actions">
            <button 
              @click="previousVocabWord" 
              :disabled="vocabularyModal.currentIndex === 0"
              class="vocab-nav-btn vocab-prev-btn"
              title="Предыдущее слово"
            >
              ⬅️ Назад
            </button>
            
            <div class="vocab-main-actions">
              <button 
                @click="markWordAsLearned" 
                class="vocab-learned-btn"
                :class="{ active: currentVocabWord?.learned }"
                title="Отметить как изученное"
              >
                {{ currentVocabWord?.learned ? '✅ Изучено' : '📚 Изучить' }}
              </button>
              
              <button 
                @click="nextVocabWord" 
                class="vocab-next-btn"
                title="Следующее слово"
              >
                {{ isLastVocabWord ? '🏁 Завершить' : '➡️ Далее' }}
              </button>
            </div>
            
            <button 
              @click="restartVocabulary" 
              class="vocab-restart-btn"
              title="Начать заново"
            >
              🔄 Заново
            </button>
          </div>

          <!-- Quick Navigation Dots -->
          <div class="vocab-dots-navigation">
            <button
              v-for="(word, wordIndex) in vocabularyModal.words"
              :key="word.id || wordIndex"
              @click="vocabularyModal.currentIndex = wordIndex; cardAnimation.showDefinition = false;"
              class="vocab-dot"
              :class="{ 
                active: wordIndex === vocabularyModal.currentIndex,
                learned: word.learned 
              }"
              :title="word.term"
            >
            </button>
          </div>
        </div>

        <!-- Completion Screen -->
        <div v-else-if="vocabularyModal.isCompleted && !vocabularyModal.showingList" class="vocabulary-completion">
          <div class="completion-animation">
            <div class="completion-icon">🎉</div>
            <h3>Отлично!</h3>
            <p>Вы изучили {{ vocabularyModal.words.filter(w => w.learned).length }} из {{ vocabularyModal.words.length }} слов</p>
            
            <div class="completion-stats">
              <div class="completion-stat">
                <div class="stat-number">{{ vocabularyModal.words.filter(w => w.learned).length }}</div>
                <div class="stat-label">Изучено</div>
              </div>
              <div class="completion-stat">
                <div class="stat-number">{{ Math.round((vocabularyModal.words.filter(w => w.learned).length / vocabularyModal.words.length) * 100) }}%</div>
                <div class="stat-label">Прогресс</div>
              </div>
            </div>
            
            <button @click="showVocabularyList" class="continue-btn">
              📋 Перейти к списку слов
            </button>
          </div>
        </div>

        <!-- List Transition Screen -->
        <div v-else-if="vocabularyModal.showingList" class="vocabulary-list-transition">
          <div class="transition-animation">
            <div class="transition-icon">📚</div>
            <h3>Переход к списку слов...</h3>
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Intro Screen -->
    <div v-if="!started && !showPaywallModal && !loading && !error" class="intro-screen">
      <button class="exit-btn" @click="confirmExit">✕</button>
      
      <div class="intro-content">
        <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) || 'Без названия' }}</h2>
        <p class="lesson-description">{{ getLocalized(lesson.description) || 'Описание недоступно' }}</p>
        
        <div class="lesson-info-grid">
          <div class="info-card">
            <div class="info-icon">⏱️</div>
            <div class="info-text">
              <span class="info-label">Время</span>
              <span class="info-value">~{{ estimatedTime }} мин</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">📝</div>
            <div class="info-text">
              <span class="info-label">Шагов</span>
              <span class="info-value">{{ steps.length }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🎯</div>
            <div class="info-text">
              <span class="info-label">Тип</span>
              <span class="info-value">{{ lesson.type === 'premium' ? 'Премиум' : 'Бесплатный' }}</span>
            </div>
          </div>
        </div>
        
        <!-- Previous Progress Display -->
        <div v-if="previousProgress && previousProgress.completedSteps.length > 0" class="previous-progress">
          <h4>📈 Предыдущий прогресс</h4>
          <div class="progress-stats-grid">
            <div class="stat">
              <span class="stat-value">{{ previousProgress.completedSteps.length }}/{{ steps.length }}</span>
              <span class="stat-label">Прогресс</span>
            </div>
            <div class="stat">
              <span class="stat-value">⭐ {{ previousProgress.stars || 0 }}</span>
              <span class="stat-label">Звезды</span>
            </div>
            <div class="stat">
              <span class="stat-value">❌ {{ previousProgress.mistakes || 0 }}</span>
              <span class="stat-label">Ошибки</span>
            </div>
          </div>
          <button @click="continuePreviousProgress" class="continue-btn">
            📖 Продолжить с места остановки
          </button>
        </div>
        
        <div class="intro-actions">
          <button class="start-btn" @click="startLesson">
            {{ previousProgress ? '🔄 Начать заново' : '🚀 Начать урок' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Lesson Content - ALWAYS SPLIT SCREEN -->
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      
      <!-- Top Header -->
      <div class="lesson-header">
        <button class="exit-btn-small" @click="confirmExit">✕</button>
        <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) }}</h2>
        <div class="lesson-meta">
          <div class="timer-display">⏱ {{ formattedTime }}</div>
          <div class="step-counter">{{ currentIndex + 1 }}/{{ steps.length }}</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-bar-wrapper">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <div class="progress-info">
          <span class="progress-label">{{ progressPercentage }}% завершено</span>
          <span class="stars-display">⭐ {{ stars }}</span>
        </div>
      </div>

      <!-- Split Screen Content -->
      <div class="split-content">
        
        <!-- ✅ COMPLETELY FIXED: Left Panel - Clean Content Display -->
        <div class="content-panel">
          <div class="step-header">
            <h3 class="step-title">
              <span class="step-number">{{ currentIndex + 1 }}</span>
              <span class="step-type-icon">{{ getStepIcon(currentStep?.type) }}</span>
              <span class="step-type-text">{{ getStepTypeText(currentStep?.type) }}</span>
              
              <!-- ✅ Exercise/quiz counter for interactive steps -->
              <span v-if="isInteractiveStep && ['exercise', 'practice'].includes(currentStep?.type)" class="exercise-counter">
                ({{ currentExerciseIndex + 1 }}/{{ getTotalExercises() }})
              </span>
              <span v-else-if="isInteractiveStep && currentStep?.type === 'quiz'" class="quiz-counter">
                ({{ currentQuizIndex + 1 }}/{{ getTotalQuizzes() }})
              </span>
            </h3>
          </div>
          
          <!-- ✅ CRITICAL FIX: Left panel content shows ONLY clean questions -->
          <div class="step-content">
            <!-- ✅ FOR INTERACTIVE STEPS: Show ONLY the question, no instructions -->
            <div v-if="isInteractiveStep" class="interactive-content">
              
              <!-- Exercise Content - ONLY the question -->
              <div v-if="['exercise', 'practice'].includes(currentStep?.type)" class="current-exercise-content">
                <div class="exercise-question-display">
                  <div class="clean-question">{{ getStepContent(currentStep) }}</div>
                  
                  <!-- Show exercise type badge ONLY if not default type -->
                  <div v-if="getCurrentExercise()?.type && getCurrentExercise().type !== 'short-answer'" class="exercise-type-info">
                    <span class="type-badge">{{ getExerciseTypeName(getCurrentExercise()?.type) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Quiz Content - ONLY the question -->
              <div v-else-if="currentStep?.type === 'quiz'" class="current-quiz-content">
                <div class="quiz-question-display">
                  <div class="clean-question">{{ getStepContent(currentStep) }}</div>
                </div>
              </div>
            </div>

            <!-- ✅ FOR NON-INTERACTIVE STEPS: Show regular content -->
            <div v-else-if="['explanation', 'example', 'reading'].includes(currentStep?.type)" class="text-content">
              <div class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
              
              <!-- AI Help for Explanations -->
              <div v-if="showExplanationHelp" class="explanation-help">
                <h4>🤖 Нужна помощь с пониманием?</h4>
                <div class="explanation-help-input">
                  <input 
                    v-model="explanationQuestion" 
                    placeholder="Задайте вопрос об этом объяснении..."
                    @keyup.enter="askAboutExplanation"
                  />
                  <button @click="askAboutExplanation" :disabled="!explanationQuestion.trim()">
                    Спросить AI
                  </button>
                </div>
                <div v-if="explanationAIResponse" class="ai-response">
                  <p>{{ explanationAIResponse }}</p>
                </div>
              </div>
            </div>

            <!-- ✅ Vocabulary Step -->
            <div v-else-if="currentStep?.type === 'vocabulary'" class="vocabulary-content enhanced">
              
              <!-- Show modal trigger if not completed -->
              <div v-if="!currentStep.data?.modalCompleted" class="vocabulary-modal-trigger">
                <div class="trigger-card">
                  <div class="trigger-icon">📚</div>
                  <h3>Изучение словаря</h3>
                  <p>{{ Array.isArray(currentStep.data) ? currentStep.data.length : 1 }} новых слов ждут вас!</p>
                  <button @click="initializeVocabularyModal(currentStep)" class="start-vocabulary-btn">
                    🚀 Начать изучение
                  </button>
                </div>
              </div>

              <!-- Show list view after modal completion -->
              <div v-else class="vocabulary-list-view">
                <div class="vocabulary-header">
                  <h3>📖 Изученные слова</h3>
                  <button @click="initializeVocabularyModal(currentStep)" class="review-btn">
                    🔄 Повторить
                  </button>
                </div>
                
                <div class="vocabulary-list">
                  <div 
                    v-for="(vocab, vocabIndex) in (currentStep.data?.allWords || currentStep.data || [])" 
                    :key="vocab.id || vocabIndex" 
                    class="vocabulary-item enhanced"
                    :class="{ learned: vocab.learned }"
                  >
                    <div class="vocab-item-header">
                      <div class="vocab-term">
                        {{ vocab.term }}
                        <button 
                          @click="pronounceWord(vocab.term)"
                          class="mini-pronunciation-btn"
                          title="Произношение"
                        >
                          🔊
                        </button>
                      </div>
                      <div v-if="vocab.learned" class="learned-badge">✅</div>
                    </div>
                    
                    <div class="vocab-definition">{{ vocab.definition }}</div>
                    
                    <div v-if="vocab.example" class="vocab-example">
                      <strong>Пример:</strong> {{ vocab.example }}
                    </div>
                    
                    <div v-if="vocab.pronunciation" class="vocab-pronunciation">
                      Произношение: /{{ vocab.pronunciation }}/
                    </div>
                  </div>
                </div>
                
                <!-- Summary Stats -->
                <div class="vocabulary-summary">
                  <div class="summary-stat">
                    <span class="summary-number">{{ (currentStep.data?.allWords || []).filter(w => w.learned).length }}</span>
                    <span class="summary-label">изучено</span>
                  </div>
                  <div class="summary-stat">
                    <span class="summary-number">{{ (currentStep.data?.allWords || []).length }}</span>
                    <span class="summary-label">всего</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Video/Audio Step -->
            <div v-else-if="['video', 'audio'].includes(currentStep?.type)" class="media-content">
              <div class="media-placeholder">
                <div class="media-icon">{{ currentStep.type === 'video' ? '🎬' : '🎵' }}</div>
                <h4>{{ currentStep.type === 'video' ? 'Видео урок' : 'Аудио урок' }}</h4>
                <p>{{ currentStep.data.description || 'Мультимедиа контент' }}</p>
                <div class="media-url">{{ currentStep.data.url || 'URL недоступен' }}</div>
              </div>
            </div>

            <!-- Default content for other step types -->
            <div v-else class="default-content">
              <div class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
            </div>
          </div>
          
          <!-- Content Navigation -->
          <div class="content-navigation">
            <button v-if="currentIndex > 0" class="nav-btn prev-btn" @click="goPrevious">
              ⬅️ Назад
            </button>
            <button 
              v-if="!isInteractiveStep" 
              class="nav-btn next-btn" 
              @click="goNext"
            >
              {{ isLastStep ? '🏁 Завершить' : '➡️ Далее' }}
            </button>
            <button 
              v-if="['explanation', 'example', 'reading'].includes(currentStep?.type)"
              class="help-btn" 
              @click="showExplanationHelp = !showExplanationHelp"
              :class="{ active: showExplanationHelp }"
            >
              🤖 {{ showExplanationHelp ? 'Скрыть помощь' : 'AI помощь' }}
            </button>
          </div>
        </div>

        <!-- Right Panel - Interactive Content -->
        <div class="interactive-panel">
          
          <!-- ✅ All Exercise Types Support -->
          <div v-if="isInteractiveStep && ['exercise', 'practice'].includes(currentStep?.type)" class="exercise-container">
            <div class="exercise-header">
              <h3 class="exercise-title">
                {{ currentStep.type === 'practice' ? '🧪 Практическое задание' : '✏️ Упражнение' }}
              </h3>
              <div class="exercise-progress" v-if="getCurrentExercise()">
                <span class="exercise-counter">{{ currentExerciseIndex + 1 }} / {{ getTotalExercises() }}</span>
              </div>
            </div>
            
            <div class="exercise-content" v-if="getCurrentExercise()">
              <div class="exercise-question">
                {{ getCurrentExercise().question }}
              </div>
              
              <div class="exercise-instruction" v-if="getCurrentExercise().instruction">
                <div class="instruction-badge">💡 Инструкция</div>
                <div class="instruction-text">{{ getCurrentExercise().instruction }}</div>
              </div>
              
              <!-- ✅ SHORT ANSWER / TEXT INPUT -->
              <div v-if="getCurrentExercise().type === 'short-answer'" class="short-answer-container">
                <textarea 
                  v-model="userAnswer" 
                  placeholder="Введите ваш ответ..."
                  class="answer-textarea"
                  :disabled="answerWasCorrect"
                  @keyup.enter="handleSubmitOrNext"
                ></textarea>
              </div>
              
              <!-- ✅ MULTIPLE CHOICE / ABC -->
              <div v-else-if="['multiple-choice', 'abc'].includes(getCurrentExercise().type)" class="options-grid">
                <label 
                  v-for="(option, optionIndex) in getCurrentExercise().options" 
                  :key="optionIndex" 
                  class="option-card"
                  :class="{ 
                    selected: userAnswer === option,
                    correct: answerWasCorrect && userAnswer === option,
                    incorrect: !answerWasCorrect && userAnswer === option && confirmation
                  }"
                >
                  <input 
                    type="radio" 
                    :value="option" 
                    v-model="userAnswer" 
                    class="option-radio"
                    :disabled="answerWasCorrect"
                  />
                  <div class="option-content">
                    <span class="option-letter">{{ String.fromCharCode(65 + optionIndex) }}</span>
                    <span class="option-text">{{ option }}</span>
                  </div>
                </label>
              </div>
              
              <!-- ✅ TRUE/FALSE -->
              <div v-else-if="getCurrentExercise().type === 'true-false'" class="true-false-container">
                <div class="true-false-statement">
                  {{ getCurrentExercise().statement || getCurrentExercise().question }}
                </div>
                <div class="true-false-options">
                  <label 
                    class="true-false-option"
                    :class="{ 
                      selected: userAnswer === 'true',
                      correct: answerWasCorrect && userAnswer === 'true',
                      incorrect: !answerWasCorrect && userAnswer === 'true' && confirmation
                    }"
                  >
                    <input 
                      type="radio" 
                      value="true" 
                      v-model="userAnswer" 
                      :disabled="answerWasCorrect"
                    />
                    <div class="option-content">
                      <span class="option-icon">✅</span>
                      <span class="option-text">Правда</span>
                    </div>
                  </label>
                  <label 
                    class="true-false-option"
                    :class="{ 
                      selected: userAnswer === 'false',
                      correct: answerWasCorrect && userAnswer === 'false',
                      incorrect: !answerWasCorrect && userAnswer === 'false' && confirmation
                    }"
                  >
                    <input 
                      type="radio" 
                      value="false" 
                      v-model="userAnswer" 
                      :disabled="answerWasCorrect"
                    />
                    <div class="option-content">
                      <span class="option-icon">❌</span>
                      <span class="option-text">Ложь</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <!-- ✅ FILL IN THE BLANKS -->
              <div v-else-if="getCurrentExercise().type === 'fill-blank'" class="fill-blank-container">
                <div class="fill-blank-template" v-html="getFillBlankTemplate()"></div>
                <div class="blank-inputs">
                  <div 
                    v-for="(blank, blankIndex) in getCurrentExercise().blanks" 
                    :key="blankIndex" 
                    class="blank-input-group"
                  >
                    <label class="blank-label">Пропуск {{ blankIndex + 1 }}:</label>
                    <input 
                      v-model="fillBlankAnswers[blankIndex]" 
                      type="text" 
                      class="blank-input"
                      :disabled="answerWasCorrect"
                      :placeholder="`Введите слово для пропуска ${blankIndex + 1}`"
                    />
                  </div>
                </div>
              </div>
              
              <!-- ✅ MATCHING PAIRS -->
              <div v-else-if="getCurrentExercise().type === 'matching'" class="matching-container">
                <div class="matching-grid">
                  <div class="matching-column">
                    <h4>Колонка A</h4>
                    <div 
                      v-for="(item, leftIndex) in getMatchingLeftItems()" 
                      :key="'left-' + leftIndex" 
                      class="matching-item left-item"
                      :class="{ 
                        selected: selectedMatchingItem?.side === 'left' && selectedMatchingItem.index === leftIndex,
                        matched: isItemMatched('left', leftIndex)
                      }"
                      @click="selectMatchingItem('left', leftIndex)"
                    >
                      <span class="matching-item-letter">{{ String.fromCharCode(65 + leftIndex) }}</span>
                      <span class="matching-item-text">{{ item }}</span>
                    </div>
                  </div>
                  
                  <div class="matching-column">
                    <h4>Колонка B</h4>
                    <div 
                      v-for="(item, rightIndex) in getMatchingRightItems()" 
                      :key="'right-' + rightIndex" 
                      class="matching-item right-item"
                      :class="{ 
                        selected: selectedMatchingItem?.side === 'right' && selectedMatchingItem.index === rightIndex,
                        matched: isItemMatched('right', rightIndex)
                      }"
                      @click="selectMatchingItem('right', rightIndex)"
                    >
                      <span class="matching-item-number">{{ rightIndex + 1 }}</span>
                      <span class="matching-item-text">{{ item }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="matching-pairs-display" v-if="matchingPairs.length > 0">
                  <h4>Ваши пары:</h4>
                  <div class="created-pairs">
                    <div 
                      v-for="(pair, pairIndex) in matchingPairs" 
                      :key="pairIndex" 
                      class="created-pair"
                    >
                      <span class="pair-left">{{ String.fromCharCode(65 + pair.leftIndex) }}: {{ pair.leftText }}</span>
                      <span class="pair-connector">↔</span>
                      <span class="pair-right">{{ pair.rightIndex + 1 }}: {{ pair.rightText }}</span>
                      <button @click="removeMatchingPair(pairIndex)" class="remove-pair-btn" title="Удалить пару">✕</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- ✅ ORDERING/SEQUENCING -->
              <div v-else-if="getCurrentExercise().type === 'ordering'" class="ordering-container">
                <div class="ordering-instructions">
                  <p>Расположите элементы в правильном порядке (перетащите или используйте кнопки):</p>
                </div>
                <div class="ordering-items">
                  <div 
                    v-for="(item, itemIndex) in orderingItems" 
                    :key="item.id" 
                    class="ordering-item"
                    :class="{ 
                      dragging: draggedItem === itemIndex,
                      'drop-target': dropTarget === itemIndex 
                    }"
                    draggable="true"
                    @dragstart="startDrag($event, itemIndex)"
                    @dragover.prevent="onDragOver($event, itemIndex)"
                    @dragenter.prevent="onDragEnter(itemIndex)"
                    @dragleave.prevent="onDragLeave"
                    @drop.prevent="onDrop($event, itemIndex)"
                  >
                    <div class="ordering-item-content">
                      <div class="ordering-item-handle">⋮⋮</div>
                      <div class="ordering-item-text">{{ item.text }}</div>
                      <div class="ordering-item-controls">
                        <button 
                          @click="moveOrderingItem(itemIndex, -1)" 
                          :disabled="itemIndex === 0"
                          class="ordering-move-btn"
                          title="Переместить вверх"
                        >
                          ↑
                        </button>
                        <button 
                          @click="moveOrderingItem(itemIndex, 1)" 
                          :disabled="itemIndex === orderingItems.length - 1"
                          class="ordering-move-btn"
                          title="Переместить вниз"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="ordering-reset">
                  <button @click="resetOrdering" class="reset-ordering-btn">🔄 Сбросить порядок</button>
                </div>
              </div>
              
              <!-- ✅ DRAG AND DROP -->
              <div v-else-if="getCurrentExercise().type === 'drag-drop'" class="drag-drop-container">
                <div class="drag-drop-instructions">
                  <p>Перетащите элементы в правильные зоны:</p>
                </div>
                
                <div class="drag-drop-layout">
                  <!-- Draggable Items -->
                  <div class="draggable-items-area">
                    <h4>Элементы для перетаскивания:</h4>
                    <div class="draggable-items">
                      <div 
                        v-for="item in getAvailableDragItems()" 
                        :key="item.id" 
                        class="draggable-item"
                        :class="{ dragging: draggedDragItem === item.id }"
                        draggable="true"
                        @dragstart="startDragDrop($event, item)"
                      >
                        {{ item.text }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Drop Zones -->
                  <div class="drop-zones-area">
                    <h4>Зоны для размещения:</h4>
                    <div class="drop-zones">
                      <div 
                        v-for="zone in getCurrentExercise().dropZones" 
                        :key="zone.id" 
                        class="drop-zone"
                        :class="{ 
                          'drop-over': dropOverZone === zone.id,
                          'has-items': getDropZoneItems(zone.id).length > 0 
                        }"
                        @dragover.prevent="onDropZoneOver(zone.id)"
                        @dragenter.prevent="onDropZoneEnter(zone.id)"
                        @dragleave.prevent="onDropZoneLeave"
                        @drop.prevent="onDropZoneDrop($event, zone.id)"
                      >
                        <div class="drop-zone-label">{{ zone.label }}</div>
                        <div class="dropped-items">
                          <div 
                            v-for="droppedItem in getDropZoneItems(zone.id)" 
                            :key="droppedItem.id" 
                            class="dropped-item"
                            @dblclick="returnDragItem(droppedItem)"
                            title="Двойной клик для возврата"
                          >
                            {{ droppedItem.text }}
                            <button @click="returnDragItem(droppedItem)" class="remove-dropped-btn">✕</button>
                          </div>
                        </div>
                        <div v-if="getDropZoneItems(zone.id).length === 0" class="drop-zone-placeholder">
                          Перетащите элементы сюда
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Smart Hint Display -->
              <div v-if="smartHint" class="smart-hint">
                <div class="hint-header">💡 Подсказка от AI</div>
                <div class="hint-content">{{ smartHint }}</div>
                <button @click="smartHint = ''" class="close-hint-btn">✕</button>
              </div>

              <!-- Answer Feedback -->
              <div v-if="confirmation" :class="['feedback', { 'correct': answerWasCorrect, 'incorrect': !answerWasCorrect }]">
                <div class="feedback-icon">{{ answerWasCorrect ? '✅' : '❌' }}</div>
                <div class="feedback-text">{{ confirmation }}</div>
              </div>

              <!-- Action Buttons -->
              <div class="exercise-actions">
                <button 
                  v-if="!answerWasCorrect" 
                  class="submit-btn" 
                  @click="handleSubmitOrNext" 
                  :disabled="!canSubmitAnswer()"
                >
                  🔍 Проверить ответ
                </button>
                <button 
                  v-else 
                  class="next-btn" 
                  @click="goToNextExercise"
                >
                  {{ isLastExercise() ? '➡️ Следующий шаг' : '➡️ Следующее упражнение' }}
                </button>
                
                <button 
                  v-if="!answerWasCorrect && mistakeCount >= 2" 
                  class="hint-btn"
                  @click="showHint"
                >
                  💡 Подсказка
                </button>
                
                <button 
                  v-if="getCurrentExercise().type === 'matching'"
                  @click="clearMatchingPairs"
                  class="clear-btn"
                  :disabled="matchingPairs.length === 0"
                >
                  🗑️ Очистить пары
                </button>
              </div>

              <!-- Regular Hint Display -->
              <div v-if="currentHint" class="hint-display">
                <div class="hint-header">💡 Подсказка</div>
                <div class="hint-content">{{ currentHint }}</div>
              </div>
            </div>
          </div>

          <!-- Quiz Step -->
          <div v-else-if="isInteractiveStep && currentStep?.type === 'quiz'" class="quiz-container">
            <div class="quiz-header">
              <h3 class="quiz-title">🧩 Викторина</h3>
              <div class="quiz-progress" v-if="getCurrentQuiz()">
                <span class="quiz-counter">{{ currentQuizIndex + 1 }} / {{ getTotalQuizzes() }}</span>
              </div>
            </div>
            
            <div class="quiz-content" v-if="getCurrentQuiz()">
              <div class="quiz-question">{{ getCurrentQuiz().question }}</div>
              
              <div class="quiz-options">
                <label 
                  v-for="(option, quizOptionIndex) in getQuizOptions(getCurrentQuiz())" 
                  :key="quizOptionIndex" 
                  class="quiz-option-card"
                  :class="{ 
                    selected: userAnswer === option,
                    correct: answerWasCorrect && userAnswer === option,
                    incorrect: !answerWasCorrect && userAnswer === option && confirmation
                  }"
                >
                  <input 
                    type="radio" 
                    :value="option" 
                    v-model="userAnswer" 
                    class="quiz-radio"
                    :disabled="answerWasCorrect"
                  />
                  <div class="quiz-option-content">
                    <span class="quiz-option-letter">{{ String.fromCharCode(65 + quizOptionIndex) }}</span>
                    <span class="quiz-option-text">{{ option }}</span>
                  </div>
                </label>
              </div>

              <div v-if="confirmation" :class="['feedback', { 'correct': answerWasCorrect, 'incorrect': !answerWasCorrect }]">
                <div class="feedback-icon">{{ answerWasCorrect ? '✅' : '❌' }}</div>
                <div class="feedback-text">{{ confirmation }}</div>
              </div>

              <div class="quiz-actions">
                <button 
                  v-if="!answerWasCorrect" 
                  class="submit-btn" 
                  @click="handleSubmitOrNext" 
                  :disabled="!userAnswer"
                >
                  🔍 Ответить
                </button>
                <button 
                  v-else 
                  class="next-btn" 
                  @click="goToNextQuiz"
                >
                  {{ isLastQuiz() ? '➡️ Следующий шаг' : '➡️ Следующий вопрос' }}
                </button>
              </div>
            </div>
          </div>

          <!-- AI Help Panel for Interactive Steps -->
          <div v-else-if="isInteractiveStep" class="ai-help-panel">
            <h4>🤖 AI Помощник</h4>
            <p>Выберите ответ слева, и я помогу вам с объяснениями!</p>
            
            <!-- Quick suggestions -->
            <div v-if="aiSuggestions.length" class="quick-suggestions">
              <p><strong>Популярные вопросы:</strong></p>
              <button 
                v-for="suggestion in aiSuggestions" 
                :key="suggestion"
                @click="askAI(suggestion)"
                class="suggestion-btn"
              >
                {{ suggestion }}
              </button>
            </div>
            
            <!-- Chat input -->
            <div class="ai-chat-input">
              <input 
                v-model="aiChatInput" 
                @keyup.enter="sendAIMessage"
                placeholder="Спросите об этом упражнении..."
                :disabled="aiIsLoading"
              />
              <button 
                @click="sendAIMessage" 
                :disabled="!aiChatInput.trim() || aiIsLoading"
              >
                {{ aiIsLoading ? '⏳' : '📤' }}
              </button>
            </div>
            
            <!-- Chat history -->
            <div v-if="aiChatHistory.length" class="ai-chat-history">
              <div 
                v-for="message in aiChatHistory.slice(-3)" 
                :key="message.id"
                :class="['chat-message', message.type]"
              >
                <strong v-if="message.type === 'user'">Вы:</strong>
                <strong v-else>🤖 AI:</strong>
                {{ message.content }}
              </div>
            </div>
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
    </div>

    <!-- Lesson Completion Screen -->
    <div v-if="lessonCompleted" class="completion-screen">
      <div class="completion-content">
        <div class="completion-header">
          <h3 class="completion-title">🏆 Урок завершён!</h3>
          <div class="medal-section">
            <div class="medal-icon">{{ getMedalIcon() }}</div>
            <p class="medal-label">{{ medalLabel }}</p>
          </div>
        </div>
        
        <div class="completion-stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ readableTime }}</div>
            <div class="stat-label">Время</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ stars }}</div>
            <div class="stat-label">Звезды</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">❌</div>
            <div class="stat-value">{{ mistakeCount }}</div>
            <div class="stat-label">Ошибки</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ earnedPoints }}</div>
            <div class="stat-label">Очки</div>
          </div>
        </div>
        
        <!-- AI Progress Insight -->
        <div v-if="progressInsight" class="progress-insight">
          <h4>🤖 Анализ прогресса</h4>
          <p>{{ progressInsight }}</p>
        </div>
        
        <div class="completion-actions">
          <button class="action-btn primary" @click="$router.push('/catalogue')">📚 К каталогу</button>
          <button class="action-btn secondary" @click="shareResult">📤 Поделиться</button>
          <button class="action-btn secondary" @click="goToHomework">📝 Домашнее задание</button>
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
    <div v-if="showFloatingAI && started && !lessonCompleted" class="floating-ai-assistant">
      <div class="ai-header">
        <h4>🤖 AI Помощник</h4>
        <button @click="showFloatingAI = false" class="close-ai-btn">✕</button>
      </div>
      
      <div class="ai-body">
        <div v-if="aiUsage" class="usage-display">
          <p>📊 Использовано: {{ aiUsage.messages }}/{{ aiUsage.plan === 'free' ? '50' : '∞' }}</p>
        </div>
        
        <div class="quick-suggestions">
          <button 
            v-for="suggestion in quickSuggestions" 
            :key="suggestion"
            @click="askAI(suggestion)"
            class="quick-suggestion-btn"
          >
            {{ suggestion }}
          </button>
        </div>
        
        <div class="ai-chat-area">
          <div class="chat-messages">
            <div 
              v-for="message in aiChatHistory.slice(-5)" 
              :key="message.id"
              :class="['chat-message', message.type]"
            >
              {{ message.content }}
            </div>
          </div>
          
          <div class="chat-input">
            <input 
              v-model="floatingAIInput" 
              @keyup.enter="sendFloatingAIMessage"
              placeholder="Спросите о текущем шаге..."
              :disabled="aiIsLoading"
            />
            <button 
              @click="sendFloatingAIMessage" 
              :disabled="!floatingAIInput.trim() || aiIsLoading"
            >
              {{ aiIsLoading ? '⏳' : '📤' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confetti Animation -->
    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>
<script>
import confetti from 'canvas-confetti';
import { auth } from '@/firebase';
import { mapGetters, mapState } from 'vuex';
import { 
  getLessonById, 
  getLessonProgress, 
  submitProgress,
  getUserStatus,
  withErrorHandling
} from '@/api';

// Enhanced GPT service imports
import { 
  getLessonAIResponse, 
  generateLessonSuggestions, 
  generateSmartHint, 
  generateProgressInsight,
  getExplanationHelp,
  getUserUsage,
  formatUsageDisplay
} from '@/services/GPTService';

export default {
  name: 'LessonPage',
  data() {
    return {
      // Core lesson data
      lesson: {},
      steps: [],
      currentIndex: 0,
      started: false,
      loading: true,
      error: null,
      retryCount: 0,
      
      // User interaction
      userAnswer: '',
      confirmation: '',
      answerWasCorrect: false,
      currentHint: '',
      
      // Progress tracking
      mistakeCount: 0,
      stars: 0,
      earnedPoints: 0,
      hintsUsed: false,
      mistakeLog: [],
      previousProgress: null,
      
      // Lesson state
      lessonCompleted: false,
      elapsedSeconds: 0,
      timerInterval: null,
      autosaveTimer: null,
      
      // UI state
      showConfetti: false,
      showPaywallModal: false,
      showExitModal: false,
      
      // Medal system
      medalLabel: '',
      
      // User identification
      userId: null,
      
      // AI Integration
      aiChatHistory: [],
      aiChatInput: '',
      aiSuggestions: [],
      smartHint: '',
      aiIsLoading: false,
      showFloatingAI: false,
      floatingAIInput: '',
      quickSuggestions: [],
      aiUsage: null,
      progressInsight: '',
      
      // Explanation Help
      showExplanationHelp: false,
      explanationQuestion: '',
      explanationAIResponse: '',
      
      // ✅ NEW: Vocabulary Modal System
      vocabularyModal: {
        isVisible: false,
        currentIndex: 0,
        words: [],
        isCompleted: false,
        showingList: false
      },
      
      // Animation states
      cardAnimation: {
        isFlipping: false,
        showDefinition: false
      },
      currentExerciseIndex: 0,
    currentQuizIndex: 0,
    fillBlankAnswers: [],
    matchingPairs: [],
    selectedMatchingItem: null,
    orderingItems: [],
    dragDropPlacements: {},
    draggedDragItem: null,
    dropOverZone: null,
    draggedItem: null,
    dropTarget: null,
      
      // Debug mode
      debugMode: process.env.NODE_ENV === 'development'
    };
  },
  
  computed: {
    ...mapState(['user']),
    ...mapGetters(['isAuthenticated']),
    
    userStatus() {
      return this.$store?.state?.user?.subscriptionPlan || 
             this.$store?.getters?.userStatus || 
             this.user?.subscriptionPlan || 
             localStorage.getItem('subscriptionPlan') || 
             'free';
    },
    
    isPremiumUser() {
      const status = this.userStatus;
      const premiumStatuses = ['premium', 'start', 'pro'];
      return premiumStatuses.includes(status) || 
             premiumStatuses.includes(localStorage.getItem('subscriptionPlan'));
    },
    
    currentStep() {
      return this.steps[this.currentIndex] || null;
    },
    
    isInteractiveStep() {
      return this.currentStep && ['exercise', 'practice', 'quiz'].includes(this.currentStep.type);
    },
    
    progressPercentage() {
      if (this.steps.length === 0) return 0;
      const completed = Math.min(this.currentIndex + 1, this.steps.length);
      return Math.floor((completed / this.steps.length) * 100);
    },
    
    formattedTime() {
      const min = Math.floor(this.elapsedSeconds / 60);
      const sec = this.elapsedSeconds % 60;
      return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    },
    
    readableTime() {
      const min = Math.floor(this.elapsedSeconds / 60);
      const sec = this.elapsedSeconds % 60;
      return `${min} мин ${sec} сек`;
    },
    
    isLastStep() {
      return this.currentIndex >= this.steps.length - 1;
    },
    
    userHasAccess() {
      return this.lesson.type !== 'premium' || this.isPremiumUser;
    },

    estimatedTime() {
      return this.lesson.metadata?.estimatedDuration || 
             Math.max(5, this.steps.length * 2);
    },
    
    // ✅ NEW: Vocabulary computed properties
    currentVocabWord() {
      if (!this.vocabularyModal.words.length) return null;
      return this.vocabularyModal.words[this.vocabularyModal.currentIndex];
    },
    
    vocabProgress() {
      if (!this.vocabularyModal.words.length) return 0;
      return Math.round(((this.vocabularyModal.currentIndex + 1) / this.vocabularyModal.words.length) * 100);
    },
    
    isLastVocabWord() {
      return this.vocabularyModal.currentIndex >= this.vocabularyModal.words.length - 1;
    }
  },
  
  async mounted() {
    await this.waitForAuth();
    
    this.userId = localStorage.getItem('firebaseUserId') || 
                  localStorage.getItem('userId') || 
                  auth.currentUser?.uid;
    
    if (!this.userId) {
      console.error('❌ No user ID found');
      return this.$router.push('/');
    }
    
    if (!this.isAuthenticated && !auth.currentUser) {
      console.error('❌ User not authenticated');
      return this.$router.push('/Login');
    }
    
    await this.loadLesson();
    await this.loadPreviousProgress();
    await this.loadAIUsage();
  },
  
  beforeUnmount() {
    this.clearTimers();
    if (this.started && !this.lessonCompleted) {
      this.saveProgress(false);
    }
  },
  
  methods: {
    // =============================================
    // AUTHENTICATION METHODS
    // =============================================
    
    async waitForAuth() {
      if (auth.currentUser) {
        return;
      }
      
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          
          if (user && this.$store.commit) {
            try {
              this.$store.commit('user/setUser', {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
              });
            } catch (storeError) {
              console.warn('⚠️ Could not update store:', storeError.message);
            }
          }
          
          resolve();
        });
        
        setTimeout(() => {
          console.warn('⚠️ Authentication wait timeout');
          unsubscribe();
          resolve();
        }, 5000);
      });
    },

    // =============================================
    // LESSON LOADING METHODS
    // =============================================
    
    async loadLesson() {
      try {
        const lessonId = this.$route.params.id;
        
        this.loading = true;
        this.error = null;

        console.log('🔍 Loading lesson:', lessonId);

        const response = await withErrorHandling(
          () => getLessonById(lessonId),
          'Load lesson'
        );

        // ✅ CRITICAL FIX: Better response handling
        let lessonData = null;
        
        if (response.success) {
          lessonData = response.lesson || response.data;
        } else if (response.lesson) {
          lessonData = response.lesson;
        } else if (response._id || response.lessonName) {
          lessonData = response;
        } else {
          throw new Error('Invalid lesson response format');
        }

        if (!lessonData || !lessonData._id) {
          throw new Error('Lesson data is invalid or missing');
        }
        
        this.lesson = lessonData;
        console.log('✅ Lesson loaded:', this.lesson.lessonName);
        console.log('📊 Steps available:', this.lesson.steps?.length || 0);
        
        // ✅ CRITICAL FIX: Enhanced step processing
        this.processLessonSteps();
        
        // Check access permissions
        const lessonType = this.lesson.type || 'free';
        const userHasPremium = this.isPremiumUser;
        
        if (!auth.currentUser) {
          throw new Error('Authentication required');
        }
        
        if (lessonType === 'premium' && !userHasPremium) {
          this.showPaywallModal = true;
          this.loading = false;
          return;
        }
        
        if (this.steps.length === 0) {
          console.warn('⚠️ No steps found in lesson, creating default step');
          this.steps = [{
            type: 'explanation',
            data: { content: this.lesson.description || 'Lesson content not available' }
          }];
        }
        
        // Log step details for debugging
        this.steps.forEach((step, index) => {
          console.log(`📝 Step ${index + 1}:`, {
            type: step.type,
            hasData: !!step.data,
            dataType: typeof step.data,
            isArray: Array.isArray(step.data),
            dataKeys: step.data ? Object.keys(step.data) : [],
            arrayLength: Array.isArray(step.data) ? step.data.length : 'N/A'
          });
        });
        
      } catch (err) {
        console.error('❌ Error loading lesson:', err);
        this.error = this.handleLessonError(err);
      } finally {
        this.loading = false;
      }
    },

    processLessonSteps() {
  console.log('🔄 Starting lesson step processing...');
  this.steps = [];
  
  if (!this.lesson.steps || !Array.isArray(this.lesson.steps)) {
    console.warn('⚠️ No steps array found, trying legacy format');
    this.processLegacyLessonFormat();
    return;
  }
  
  // ✅ CRITICAL FIX: Process each step with enhanced validation
  this.lesson.steps.forEach((step, index) => {
    console.log(`🔍 Processing step ${index + 1}:`, step);
    
    if (!step || typeof step !== 'object') {
      console.warn(`⚠️ Step ${index + 1}: Invalid step object, skipping`);
      return;
    }
    
    if (!step.type) {
      console.warn(`⚠️ Step ${index + 1}: Missing step type, defaulting to explanation`);
      step.type = 'explanation';
    }
    
    // ✅ ENHANCED: Better step processing
    let processedStep = { ...step };
    
    try {
      switch (step.type) {
        case 'exercise':
        case 'practice':
          processedStep = this.processExerciseStep(step, index);
          break;
        case 'quiz':
          processedStep = this.processQuizStep(step, index);
          break;
        case 'vocabulary':
          processedStep = this.processVocabularyStep(step, index);
          break;
        case 'explanation':
        case 'example':
        case 'reading':
        default:
          processedStep = this.processBasicStep(step, index);
      }
      
      // ✅ VALIDATION: Ensure processed step has valid data
      if (!processedStep.data) {
        console.warn(`⚠️ Step ${index + 1}: No data after processing, creating default`);
        processedStep.data = {
          content: `Контент для ${step.type} шага ${index + 1}`
        };
      }
      
      this.steps.push(processedStep);
      console.log(`✅ Step ${index + 1} processed successfully:`, processedStep.type);
      
    } catch (stepError) {
      console.error(`❌ Error processing step ${index + 1}:`, stepError);
      // Add error step instead of skipping
      this.steps.push({
        type: 'explanation',
        data: { 
          content: `Ошибка загрузки шага ${index + 1}: ${stepError.message}`,
          error: true
        }
      });
    }
  });
  
  console.log(`✅ Processed ${this.steps.length} total steps`);
  
  // ✅ SAFETY: Ensure we have at least one step
  if (this.steps.length === 0) {
    console.warn('⚠️ No valid steps found, creating default step');
    this.steps.push({
      type: 'explanation',
      data: {
        content: this.lesson.description || 'Урок временно недоступен'
      }
    });
  }
},
    processExerciseStep(step, index) {
      console.log(`📝 Processing exercise step ${index + 1}:`, step);
      
      let exercises = [];
      
      // ✅ CRITICAL FIX: Handle multiple data structures
      if (Array.isArray(step.data)) {
        exercises = step.data;
      } else if (step.data && Array.isArray(step.data.exercises)) {
        exercises = step.data.exercises;
      } else if (step.data && step.data.question) {
        // Single exercise
        exercises = [step.data];
      } else if (step.exercises && Array.isArray(step.exercises)) {
        exercises = step.exercises;
      }
      
      // ✅ Validate and normalize exercises
      const validExercises = exercises.filter(ex => {
        const hasQuestion = ex.question && String(ex.question).trim();
        const hasAnswer = (ex.answer || ex.correctAnswer) && 
                         String(ex.answer || ex.correctAnswer).trim();
        
        if (!hasQuestion) {
          console.warn(`⚠️ Exercise missing question:`, ex);
          return false;
        }
        if (!hasAnswer) {
          console.warn(`⚠️ Exercise missing answer:`, ex);
          return false;
        }
        
        return true;
      }).map(ex => ({
        ...ex,
        question: String(ex.question).trim(),
        answer: String(ex.answer || ex.correctAnswer || '').trim(),
        correctAnswer: String(ex.correctAnswer || ex.answer || '').trim(),
        type: ex.type || 'short-answer',
        options: ex.options || [],
        hint: ex.hint || '',
        explanation: ex.explanation || ''
      }));
      
      if (validExercises.length === 0) {
        console.warn(`⚠️ No valid exercises found, creating default`);
        validExercises.push({
          question: "Sample exercise question",
          answer: "Sample answer",
          correctAnswer: "Sample answer",
          type: 'short-answer',
          options: [],
          hint: 'Think about what we just learned',
          explanation: 'This is a sample exercise'
        });
      }
      
      console.log(`✅ Processed ${validExercises.length} exercises`);
      
      return {
        type: 'exercise',
        data: validExercises
      };
    },

    processQuizStep(step, index) {
      console.log(`🧩 Processing quiz step ${index + 1}:`, step);
      
      let quizzes = [];
      
      // Handle multiple data structures
      if (Array.isArray(step.data)) {
        quizzes = step.data;
      } else if (step.data && Array.isArray(step.data.quizzes)) {
        quizzes = step.data.quizzes;
      } else if (step.data && step.data.question) {
        // Single quiz
        quizzes = [step.data];
      } else if (step.quizzes && Array.isArray(step.quizzes)) {
        quizzes = step.quizzes;
      }
      
      // ✅ Validate and normalize quizzes
      const validQuizzes = quizzes.filter(quiz => {
        const hasQuestion = quiz.question && String(quiz.question).trim();
        const hasCorrectAnswer = quiz.correctAnswer !== undefined && quiz.correctAnswer !== null;
        
        if (!hasQuestion) {
          console.warn(`⚠️ Quiz missing question:`, quiz);
          return false;
        }
        if (!hasCorrectAnswer) {
          console.warn(`⚠️ Quiz missing correct answer:`, quiz);
          return false;
        }
        
        return true;
      }).map(quiz => {
        const processedQuiz = {
          ...quiz,
          question: String(quiz.question).trim(),
          type: quiz.type || 'multiple-choice',
          correctAnswer: quiz.correctAnswer,
          explanation: quiz.explanation || '',
          options: []
        };
        
        // Process options based on type
        if (processedQuiz.type === 'multiple-choice') {
          if (Array.isArray(quiz.options)) {
            processedQuiz.options = quiz.options.map(opt => {
              if (typeof opt === 'string') return opt;
              if (opt && opt.text) return opt.text;
              return String(opt);
            });
          } else {
            // Default options if missing
            processedQuiz.options = ['Option A', 'Option B', 'Option C', 'Option D'];
          }
          
          // Validate correct answer index
          if (typeof processedQuiz.correctAnswer === 'number') {
            if (processedQuiz.correctAnswer >= processedQuiz.options.length) {
              console.warn(`⚠️ Correct answer index out of bounds, fixing`);
              processedQuiz.correctAnswer = 0;
            }
          }
        } else if (processedQuiz.type === 'true-false') {
          processedQuiz.options = ['True', 'False'];
        }
        
        return processedQuiz;
      });
      
      if (validQuizzes.length === 0) {
        console.warn(`⚠️ No valid quizzes found, creating default`);
        validQuizzes.push({
          question: "Sample quiz question?",
          type: 'multiple-choice',
          options: ['Option A', 'Option B', 'Option C'],
          correctAnswer: 0,
          explanation: 'This is a sample quiz question'
        });
      }
      
      console.log(`✅ Processed ${validQuizzes.length} quiz questions`);
      
      return {
        type: 'quiz',
        data: validQuizzes
      };
    },
  getUserResponseBasedOnType() {
      const exerciseType = this.getCurrentExerciseType();
      
      switch (exerciseType) {
        case 'fill-blank':
          return this.fillBlankAnswers;
        case 'matching':
          return this.matchingPairs;
        case 'ordering':
          return this.orderingItems;
        case 'drag-drop':
          return this.dragDropPlacements;
        default:
          return this.userAnswer;
      }
    },

    getCurrentExerciseType() {
      const exercise = this.getCurrentExercise();
      return exercise?.type || 'short-answer';
    },

    hasValidUserResponse(response) {
      if (response === null || response === undefined) return false;
      
      if (Array.isArray(response)) {
        return response.length > 0 && response.some(item => 
          item !== null && item !== undefined && String(item).trim() !== ''
        );
      }
      
      if (typeof response === 'object') {
        return Object.keys(response).length > 0;
      }
      
      return String(response).trim() !== '';
    },

    safeStringConvert(value) {
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return value.join(', ');
      return String(value).trim();
    },

    processVocabularyStep(step, index) {
      console.log(`📚 Processing vocabulary step ${index + 1}:`, step);
      
      let vocabulary = [];
      
      if (Array.isArray(step.data)) {
        vocabulary = step.data;
      } else if (step.data && Array.isArray(step.data.vocabulary)) {
        vocabulary = step.data.vocabulary;
      } else if (step.vocabulary && Array.isArray(step.vocabulary)) {
        vocabulary = step.vocabulary;
      }
      
      const validVocabulary = vocabulary.filter(vocab => {
        return vocab.term && vocab.term.trim() && vocab.definition && vocab.definition.trim();
      }).map(vocab => ({
        term: String(vocab.term).trim(),
        definition: String(vocab.definition).trim(),
        example: vocab.example ? String(vocab.example).trim() : '',
        pronunciation: vocab.pronunciation || ''
      }));
      
      if (validVocabulary.length === 0) {
        validVocabulary.push({
          term: "Sample Term",
          definition: "Sample definition for this term",
          example: "Example usage of the term",
          pronunciation: ""
        });
      }
      
      console.log(`✅ Processed ${validVocabulary.length} vocabulary items`);
      
      return {
        type: 'vocabulary',
        data: validVocabulary
      };
    },

    processBasicStep(step, index) {
      let content = '';
      
      if (typeof step.content === 'string') {
        content = step.content;
      } else if (step.data && typeof step.data.content === 'string') {
        content = step.data.content;
      } else if (step.data && typeof step.data === 'string') {
        content = step.data;
      } else if (typeof step.data === 'object' && step.data.text) {
        content = step.data.text;
      }
      
      if (!content.trim()) {
        content = `Content for ${step.type} step ${index + 1}`;
      }
      
      return {
        type: step.type,
        data: {
          content: content,
          questions: step.questions || step.data?.questions || []
        }
      };
    },

    processLegacyLessonFormat() {
      console.log('🔄 Processing legacy lesson format');
      
      // Add explanations
      if (Array.isArray(this.lesson.explanations)) {
        this.lesson.explanations.forEach(explanation => {
          this.steps.push({
            type: 'explanation',
            data: {
              content: typeof explanation === 'string' ? explanation : explanation.content || ''
            }
          });
        });
      }
      
      // Add examples
      if (Array.isArray(this.lesson.examples)) {
        this.lesson.examples.forEach(example => {
          this.steps.push({
            type: 'example',
            data: {
              content: typeof example === 'string' ? example : example.content || ''
            }
          });
        });
      }
      
      // Add exercises from exerciseGroups
      if (Array.isArray(this.lesson.exerciseGroups)) {
        this.lesson.exerciseGroups.forEach(group => {
          if (group.exercises) {
            this.steps.push({
              type: 'exercise',
              data: group.exercises
            });
          }
        });
      }
      
      // Add quiz
      if (Array.isArray(this.lesson.quiz)) {
        this.steps.push({
          type: 'quiz',
          data: this.lesson.quiz
        });
      }
      
      console.log(`✅ Processed ${this.steps.length} steps from legacy format`);
    },

    async loadPreviousProgress() {
      if (!this.lesson._id) return;
      
      try {
        const progressResult = await getLessonProgress(this.userId, this.lesson._id);
        
        if (progressResult.success && progressResult.data) {
          const progressData = progressResult.data;
          
          if (progressData.completedSteps && progressData.completedSteps.length > 0) {
            this.previousProgress = {
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
            };
            
          } else {
            this.previousProgress = null;
          }
        } else {
          this.previousProgress = null;
        }
        
      } catch (err) {
        console.warn('⚠️ Failed to load previous progress:', err);
        this.previousProgress = null;
      }
    },

    // =============================================
    // ENHANCED QUESTION/ANSWER METHODS
    // =============================================

    getExerciseQuestion(step) {
  console.log('🔍 getExerciseQuestion called with step:', step);
  
  if (!step || !step.data) {
    console.warn('⚠️ getExerciseQuestion: Invalid step data');
    return 'Exercise question unavailable';
  }
  
  try {
    let exercise = null;
    
    // Get current exercise based on index
    if (Array.isArray(step.data)) {
      exercise = step.data[this.currentExerciseIndex] || step.data[0];
    } else if (step.data.exercises && Array.isArray(step.data.exercises)) {
      exercise = step.data.exercises[this.currentExerciseIndex] || step.data.exercises[0];
    } else {
      exercise = step.data; // Single exercise
    }
    
    if (exercise && exercise.question) {
      const question = this.getLocalized(exercise.question);
      console.log('✅ Found current exercise question:', question.substring(0, 50) + '...');
      return question;
    }
    
  } catch (error) {
    console.error('❌ Error in getExerciseQuestion:', error);
  }
  
  console.warn('⚠️ No exercise question found');
  return 'Exercise question not available';
},

getCorrectAnswer(step) {
  if (!step || !step.data) {
    return '';
  }
  
  try {
    let exercise = null;
    
    if (['exercise', 'practice'].includes(step.type)) {
      if (Array.isArray(step.data)) {
        exercise = step.data[this.currentExerciseIndex];
      } else if (step.data.exercises && Array.isArray(step.data.exercises)) {
        exercise = step.data.exercises[this.currentExerciseIndex];
      } else {
        exercise = step.data;
      }
    } else if (step.type === 'quiz') {
      if (Array.isArray(step.data)) {
        exercise = step.data[this.currentQuizIndex];
      } else if (step.data.quizzes && Array.isArray(step.data.quizzes)) {
        exercise = step.data.quizzes[this.currentQuizIndex];
      } else {
        exercise = step.data;
      }
    }
    
    if (!exercise) {
      return '';
    }
    
    const answer = exercise.correctAnswer || exercise.answer;
    if (answer !== undefined && answer !== null) {
      return Array.isArray(answer) ? answer.join(', ') : String(answer).trim();
    }
    
    if (exercise.options && Array.isArray(exercise.options)) {
      const correctIndex = exercise.correctAnswer;
      if (typeof correctIndex === 'number' && correctIndex >= 0 && correctIndex < exercise.options.length) {
        return exercise.options[correctIndex];
      }
    }
    
  } catch (error) {
    console.error('❌ Error in getCorrectAnswer:', error);
  }
  
  return '';
},
    hasOptions(step) {
      if (!step || !step.data) return false;
      
      try {
        // Handle array of exercises
        if (Array.isArray(step.data)) {
          const firstExercise = step.data[0];
          return firstExercise && Array.isArray(firstExercise.options) && firstExercise.options.length > 0;
        }
        
        // Handle single exercise
        if (Array.isArray(step.data.options) && step.data.options.length > 0) {
          return true;
        }
        
        // Handle nested exercises
        if (step.data.exercises && Array.isArray(step.data.exercises) && step.data.exercises.length > 0) {
          const firstExercise = step.data.exercises[0];
          return firstExercise && Array.isArray(firstExercise.options) && firstExercise.options.length > 0;
        }
        
      } catch (error) {
        console.error('❌ Error in hasOptions:', error);
      }
      
      return false;
    },

    getOptions(step) {
      if (!this.hasOptions(step)) return [];
      
      let options = [];
      
      try {
        // Handle array of exercises
        if (Array.isArray(step.data)) {
          const firstExercise = step.data[0];
          options = firstExercise?.options || [];
        } 
        // Handle nested exercises
        else if (step.data.exercises && Array.isArray(step.data.exercises) && step.data.exercises.length > 0) {
          const firstExercise = step.data.exercises[0];
          options = firstExercise?.options || [];
        }
        // Handle single exercise
        else {
          options = step.data.options || [];
        }
        
        // Normalize options to strings
        const normalizedOptions = options.map(option => {
          if (typeof option === 'string') return option;
          if (option && typeof option === 'object') {
            return option.text || option.label || option.value || String(option);
          }
          return String(option);
        }).filter(opt => opt && opt.trim());
        
        console.log('✅ Normalized options:', normalizedOptions);
        return normalizedOptions;
        
      } catch (error) {
        console.error('❌ Error in getOptions:', error);
        return [];
      }
    },

    getQuizQuestion(step) {
  console.log('🔍 getQuizQuestion called with step:', step);
  
  if (!step || !step.data) {
    console.warn('⚠️ getQuizQuestion: Invalid step data');
    return 'Quiz question unavailable';
  }
  
  let question = '';
  
  try {
    const quiz = this.getCurrentQuiz();
    if (quiz && quiz.question) {
      question = this.getLocalized(quiz.question);
      console.log('✅ Found quiz question via getCurrentQuiz:', question.substring(0, 50) + '...');
      return question;
    }
    
    // Handle different data structures as fallback
    if (Array.isArray(step.data) && step.data.length > 0) {
      const firstQuiz = step.data[0];
      if (firstQuiz && firstQuiz.question) {
        question = this.getLocalized(firstQuiz.question);
        console.log('✅ Found quiz question in step.data array:', question.substring(0, 50) + '...');
        return question;
      }
    }
    
    if (step.data.question) {
      question = this.getLocalized(step.data.question);
      console.log('✅ Found quiz question in step.data:', question.substring(0, 50) + '...');
      return question;
    }
    
    if (step.data.quizzes && Array.isArray(step.data.quizzes) && step.data.quizzes.length > 0) {
      const firstQuiz = step.data.quizzes[0];
      if (firstQuiz && firstQuiz.question) {
        question = this.getLocalized(firstQuiz.question);
        console.log('✅ Found quiz question in step.data.quizzes:', question.substring(0, 50) + '...');
        return question;
      }
    }
    
  } catch (error) {
    console.error('❌ Error in getQuizQuestion:', error);
  }
  
  console.warn('⚠️ No quiz question found, using default');
  return 'Quiz question not available - please check lesson content';
},

getQuizOptions(quiz) {
  console.log('🔍 getQuizOptions called with quiz:', quiz);
  
  if (!quiz) {
    console.warn('⚠️ No quiz provided to getQuizOptions');
    return [];
  }
  
  let options = [];
  
  try {
    // Handle different option structures
    if (Array.isArray(quiz.options)) {
      options = quiz.options;
      console.log('✅ Found options in quiz.options:', options);
    } else if (quiz.type === 'true-false') {
      options = ['True', 'False'];
      console.log('✅ Generated true/false options');
    } else if (quiz.type === 'multiple-choice' || quiz.type === 'abc') {
      // If no options but it's multiple choice, create defaults
      options = ['Option A', 'Option B', 'Option C', 'Option D'];
      console.warn('⚠️ No options found for multiple choice, using defaults');
    } else {
      console.warn('⚠️ No options found for quiz type:', quiz.type);
      return [];
    }
    
    // ✅ CRITICAL FIX: Better option normalization
    const normalizedOptions = options.map((option, index) => {
      let text = '';
      
      if (typeof option === 'string') {
        text = option;
      } else if (option && typeof option === 'object') {
        // Handle MongoDB objects like {"text": "Nice to meet you!"}
        text = option.text || option.label || option.value || String(option);
      } else {
        text = String(option);
      }
      
      // Clean up the text
      text = text.trim();
      
      console.log(`📝 Option ${index}: ${JSON.stringify(option)} → "${text}"`);
      return text;
    }).filter(opt => opt && opt.length > 0);
    
    console.log('✅ Final normalized quiz options:', normalizedOptions);
    return normalizedOptions;
    
  } catch (error) {
    console.error('❌ Error in getQuizOptions:', error);
    return ['Option A', 'Option B']; // Fallback options
  }
},

    getQuizCorrectAnswer(step) {
      console.log('🔍 getQuizCorrectAnswer called with step:', step);
      
      if (!step || !step.data) {
        console.warn('⚠️ getQuizCorrectAnswer: Invalid step data');
        return null;
      }
      
      try {
        let correctAnswer = null;
        
        // Handle array of quiz questions (get first one)
        if (Array.isArray(step.data)) {
          const firstQuiz = step.data[0];
          correctAnswer = firstQuiz?.correctAnswer;
        }
        // Handle nested quizzes
        else if (step.data.quizzes && Array.isArray(step.data.quizzes) && step.data.quizzes.length > 0) {
          const firstQuiz = step.data.quizzes[0];
          correctAnswer = firstQuiz?.correctAnswer;
        }
        // Handle single quiz
        else {
          correctAnswer = step.data.correctAnswer;
        }
        
        console.log('✅ Quiz correct answer:', correctAnswer);
        return correctAnswer;
        
      } catch (error) {
        console.error('❌ Error in getQuizCorrectAnswer:', error);
        return null;
      }
    },

    validateQuizAnswer(userAnswer, step) {
  console.log('🔍 validateQuizAnswer called:', { userAnswer, stepType: step?.type });
  
  try {
    const quiz = this.getCurrentQuiz();
    if (!quiz) {
      console.warn('⚠️ No current quiz found');
      return false;
    }
    
    const correctAnswer = quiz.correctAnswer;
    console.log('🎯 Quiz correct answer:', correctAnswer, 'Type:', typeof correctAnswer);
    
    if (correctAnswer === null || correctAnswer === undefined) {
      console.warn('⚠️ No correct answer available for quiz validation');
      return false;
    }
    
    // ✅ CRITICAL FIX: Get processed options
    const options = this.getQuizOptions(quiz);
    console.log('📝 Processed quiz options:', options);
    console.log('👤 User selected:', userAnswer);
    
    // Handle multiple choice by index
    if (typeof correctAnswer === 'number') {
      if (options.length > correctAnswer && correctAnswer >= 0) {
        const correctOption = options[correctAnswer];
        console.log('✅ Correct option text:', correctOption);
        
        // ✅ FIXED: Normalize both strings for comparison
        const normalizedUserAnswer = this.normalizeText(userAnswer);
        const normalizedCorrectOption = this.normalizeText(correctOption);
        
        const isCorrect = normalizedUserAnswer === normalizedCorrectOption;
        console.log('🔍 Comparison details:', { 
          normalizedUserAnswer, 
          normalizedCorrectOption, 
          isCorrect 
        });
        
        return isCorrect;
      } else {
        console.warn('⚠️ Correct answer index out of bounds:', correctAnswer, 'Options length:', options.length);
        return false;
      }
    }
    
    // Handle direct string comparison
    if (typeof correctAnswer === 'string') {
      const normalizedUserAnswer = this.normalizeText(userAnswer);
      const normalizedCorrectAnswer = this.normalizeText(correctAnswer);
      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      console.log('✅ String-based validation:', { userAnswer, correctAnswer, isCorrect });
      return isCorrect;
    }
    
    // Handle boolean for true/false questions
    if (typeof correctAnswer === 'boolean') {
      const userBool = userAnswer.toLowerCase() === 'true' || userAnswer === 'True';
      const isCorrect = userBool === correctAnswer;
      console.log('✅ Boolean-based validation:', { userAnswer, userBool, correctAnswer, isCorrect });
      return isCorrect;
    }
    
    console.warn('⚠️ Unknown correct answer type:', typeof correctAnswer);
    return false;
    
  } catch (error) {
    console.error('❌ Error in validateQuizAnswer:', error);
    return false;
  }
},
debugABCExercise() {
  const exercise = this.getCurrentExercise();
  console.log('🐛 ABC DEBUG - Current Exercise:', exercise);
  console.log('🐛 ABC DEBUG - Exercise Type:', exercise?.type);
  console.log('🐛 ABC DEBUG - Options:', exercise?.options);
  console.log('🐛 ABC DEBUG - Correct Answer (raw):', exercise?.correctAnswer);
  console.log('🐛 ABC DEBUG - Correct Answer (parsed):', parseInt(exercise?.correctAnswer));
  console.log('🐛 ABC DEBUG - User Selected:', this.userAnswer);
  
  if (exercise?.options) {
    exercise.options.forEach((option, index) => {
      const optionText = typeof option === 'string' ? option : option.text;
      console.log(`🐛 ABC DEBUG - Option ${index}: "${optionText}"`);
    });
  }
  
  const userIndex = this.findOptionIndex(this.userAnswer, exercise?.options);
  console.log('🐛 ABC DEBUG - User Selected Index:', userIndex);
},

// ✅ ADD this new helper method
normalizeText(text) {
  if (!text) return '';
  return String(text).trim().toLowerCase();
},

validateAnswer(userAnswer, correctAnswer, stepType) {
  // ✅ CRITICAL: Ensure both values exist and convert safely
  if (!this.hasValidUserResponse(userAnswer)) return false;
  if (!this.hasValidUserResponse(correctAnswer)) return false;

  const normalize = (text) => {
    return this.safeStringConvert(text)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?'"()[\]{}]/g, '')
      .replace(/\b(the|a|an|и|в|на|с|по|для|от|до|при|под|над|между|через|без|из)\b/gi, '')
      .trim();
  };

  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  const correctWords = normalizedCorrect.split(' ').filter(word => word.length > 2);
  const userWords = normalizedUser.split(' ');
  
  if (correctWords.length > 0) {
    const containsAllKeyWords = correctWords.every(word => 
      userWords.some(userWord => 
        userWord.includes(word) || word.includes(userWord) || 
        this.calculateSimilarity(userWord, word) > 0.8
      )
    );
    
    if (containsAllKeyWords) {
      return true;
    }
  }

  const correctStr = this.safeStringConvert(correctAnswer);
  if (correctStr.includes(',') || correctStr.includes(';')) {
    return this.validateListAnswer(normalizedUser, normalizedCorrect);
  }

  // Check for mathematical expressions
  if (this.isMathAnswer(correctStr)) {
    return this.validateMathAnswer(userAnswer, correctAnswer);
  }

  // Check for numerical answers with tolerance
  if (this.isNumericAnswer(correctStr)) {
    return this.validateNumericAnswer(userAnswer, correctAnswer);
  }

  // Fuzzy matching for single words or short phrases
  if (correctWords.length <= 3) {
    const similarity = this.calculateSimilarity(normalizedUser, normalizedCorrect);
    if (similarity > 0.85) {
      return true;
    }
  }

  // Check for partial credit scenarios
  const partialScore = this.calculatePartialScore(normalizedUser, normalizedCorrect);
  if (partialScore > 0.7) {
    return true;
  }

  return false;
},

// Replace validateMathAnswer with proper type checking
validateMathAnswer(userAnswer, correctAnswer) {
  try {
    // ✅ CRITICAL: Safe string conversion
    const userStr = this.safeStringConvert(userAnswer);
    const correctStr = this.safeStringConvert(correctAnswer);
    
    if (!userStr || !correctStr) return false;
    
    // Remove spaces and normalize
    const userMath = userStr.replace(/\s/g, '');
    const correctMath = correctStr.replace(/\s/g, '');
    
    // Direct comparison
    if (userMath === correctMath) return true;
    
    // Try to evaluate if they're mathematical expressions
    if (this.isSafeExpression(userMath) && this.isSafeExpression(correctMath)) {
      try {
        const userResult = eval(userMath);
        const correctResult = eval(correctMath);
        return Math.abs(userResult - correctResult) < 0.001;
      } catch (e) {
        return userMath === correctMath;
      }
    }
    
    return false;
  } catch (error) {
    return this.safeStringConvert(userAnswer) === this.safeStringConvert(correctAnswer);
  }
},

    validateListAnswer(userAnswer, correctAnswer) {
      const userItems = userAnswer.split(/[,;]/).map(item => item.trim()).filter(item => item.length > 0);
      const correctItems = correctAnswer.split(/[,;]/).map(item => item.trim()).filter(item => item.length > 0);
      
      if (userItems.length === 0) return false;
      
      // Check how many correct items the user mentioned
      let matchedItems = 0;
      
      correctItems.forEach(correctItem => {
        const isMatched = userItems.some(userItem => {
          const similarity = this.calculateSimilarity(userItem, correctItem);
          return similarity > 0.8 || userItem.includes(correctItem) || correctItem.includes(userItem);
        });
        
        if (isMatched) matchedItems++;
      });
      
      // Accept if user got at least 70% of the items
      const accuracy = matchedItems / correctItems.length;
      console.log('📝 List validation:', { matchedItems, totalItems: correctItems.length, accuracy });
      
      return accuracy >= 0.7;
    },

    validateMathAnswer(userAnswer, correctAnswer) {
      try {
        // Remove spaces and normalize
        const userMath = userAnswer.replace(/\s/g, '');
        const correctMath = correctAnswer.replace(/\s/g, '');
        
        // Direct comparison
        if (userMath === correctMath) return true;
        
        // Try to evaluate if they're mathematical expressions
        if (this.isSafeExpression(userMath) && this.isSafeExpression(correctMath)) {
          try {
            const userResult = eval(userMath);
            const correctResult = eval(correctMath);
            return Math.abs(userResult - correctResult) < 0.001;
          } catch (e) {
            // If evaluation fails, fall back to string comparison
            return userMath === correctMath;
          }
        }
        
        return false;
      } catch (error) {
        console.warn('⚠️ Math validation error:', error);
        return userAnswer.trim() === correctAnswer.trim();
      }
    },

    validateNumericAnswer(userAnswer, correctAnswer) {
  const userStr = this.safeStringConvert(userAnswer);
  const correctStr = this.safeStringConvert(correctAnswer);
  
  if (!userStr || !correctStr) return false;
  
  const userNum = parseFloat(userStr.replace(/[^\d.-]/g, ''));
  const correctNum = parseFloat(correctStr.replace(/[^\d.-]/g, ''));
  
  if (isNaN(userNum) || isNaN(correctNum)) {
    return userStr.toLowerCase() === correctStr.toLowerCase();
  }
  
  // Allow 1% tolerance for floating point numbers
  const tolerance = Math.abs(correctNum) * 0.01;
  return Math.abs(userNum - correctNum) <= tolerance;
},
    calculateSimilarity(str1, str2) {
      if (str1 === str2) return 1;
      if (!str1 || !str2) return 0;
      
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      if (longer.length === 0) return 1;
      
      const distance = this.levenshteinDistance(longer, shorter);
      return (longer.length - distance) / longer.length;
    },

    levenshteinDistance(str1, str2) {
      const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
      
      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,     // deletion
            matrix[j - 1][i] + 1,     // insertion
            matrix[j - 1][i - 1] + cost // substitution
          );
        }
      }
      
      return matrix[str2.length][str1.length];
    },

    calculatePartialScore(userAnswer, correctAnswer) {
      const userWords = userAnswer.split(' ').filter(word => word.length > 2);
      const correctWords = correctAnswer.split(' ').filter(word => word.length > 2);
      
      if (correctWords.length === 0) return 0;
      
      let matchedWords = 0;
      correctWords.forEach(correctWord => {
        const hasMatch = userWords.some(userWord => {
          return this.calculateSimilarity(userWord, correctWord) > 0.8;
        });
        if (hasMatch) matchedWords++;
      });
      
      return matchedWords / correctWords.length;
    },

    isMathAnswer(answer) {
      return /[\d+\-*/=().]/.test(answer) && !/[a-zA-Z]/.test(answer.replace(/[x]/g, ''));
    },

    isNumericAnswer(answer) {
      return /^\s*-?\d+\.?\d*\s*$/.test(answer) || /^\s*-?\d*\.\d+\s*$/.test(answer);
    },

    isSafeExpression(expr) {
      // Only allow numbers, basic operators, and parentheses
      return /^[\d+\-*/().\s]+$/.test(expr) && !expr.includes('eval');
    },

    generateHelpfulFeedback(userAnswer, correctAnswer, stepType) {
  try {
    const userStr = this.safeStringConvert(userAnswer);
    const correctStr = this.safeStringConvert(correctAnswer);
    
    if (!correctStr) {
      return 'Попробуйте еще раз.';
    }
    
    // If it's a list answer, give specific guidance
    if (correctStr.includes(',') || correctStr.includes(';')) {
      const correctItems = correctStr.split(/[,;]/).map(item => item.trim()).filter(item => item);
      return `Попробуйте еще раз. Подсказка: ответ должен содержать ${correctItems.length} элемент${correctItems.length > 1 ? 'а' : ''}.`;
    }
    
    // If it's a short answer, give hint about length
    if (correctStr.length < 20) {
      const wordCount = correctStr.split(' ').filter(word => word.trim()).length;
      return `Попробуйте еще раз. Подсказка: ответ содержит ${wordCount} слов${wordCount > 1 ? 'а' : 'о'}.`;
    }
    
    // For quiz questions, be more specific
    if (stepType === 'quiz') {
      return 'Неверный ответ. Внимательно прочитайте вопрос еще раз.';
    }
    
    return 'Попробуйте еще раз. Подумайте о том, что мы только что изучили.';
    
  } catch (error) {
    return 'Попробуйте еще раз.';
  }
},


async handleSubmitOrNext() {
  const step = this.currentStep;
  if (!step || !step.data) {
    this.confirmation = '⚠️ Ошибка: нет данных о текущем шаге.';
    return;
  }

  // ✅ Get user response based on exercise type
  let userResponse = this.getUserResponseBasedOnType();
  
  // ✅ Validate user response exists
  if (!this.hasValidUserResponse(userResponse)) {
    this.confirmation = '⚠️ Введите ответ.';
    return;
  }

  let isCorrect = false;
  let correctAnswer = '';
  let answerType = this.getCurrentExerciseType();

  console.log('🔍 handleSubmitOrNext - Starting validation:', {
    stepType: step.type,
    answerType,
    userResponse,
    exerciseIndex: this.currentExerciseIndex,
    quizIndex: this.currentQuizIndex
  });

  try {
    // ============================================
    // QUIZ VALIDATION
    // ============================================
    if (step.type === 'quiz') {
      const currentQuiz = this.getCurrentQuiz();
      console.log('🧩 Quiz validation:', { currentQuiz, userResponse });
      
      if (!currentQuiz) {
        this.confirmation = '⚠️ Ошибка: данные викторины недоступны.';
        return;
      }

      isCorrect = this.validateQuizAnswer(userResponse, currentQuiz);
      
      // Get correct answer for display
      const rawCorrectAnswer = currentQuiz.correctAnswer;
      if (typeof rawCorrectAnswer === 'number') {
        const options = this.getQuizOptions(currentQuiz);
        if (options.length > rawCorrectAnswer && rawCorrectAnswer >= 0) {
          correctAnswer = options[rawCorrectAnswer];
        } else {
          correctAnswer = `Option ${rawCorrectAnswer + 1}`;
        }
      } else {
        correctAnswer = String(rawCorrectAnswer);
      }

    // ============================================
    // EXERCISE VALIDATION
    // ============================================
    } else if (['exercise', 'practice'].includes(step.type)) {
      const currentExercise = this.getCurrentExercise();
      console.log('✏️ Exercise validation:', { currentExercise, userResponse, answerType });
      
      if (!currentExercise) {
        this.confirmation = '⚠️ Ошибка: данные упражнения недоступны.';
        return;
      }

      // Handle different exercise types
      switch (answerType) {
        case 'abc':
        case 'multiple-choice': {
          console.log('🔤 ABC/Multiple Choice validation');
          
          if (!currentExercise.options || !Array.isArray(currentExercise.options)) {
            console.error('❌ No options found for ABC exercise');
            this.confirmation = '⚠️ Ошибка: варианты ответов недоступны.';
            return;
          }

          // Get correct answer index
          const correctIndex = this.parseAnswerIndex(currentExercise.correctAnswer || currentExercise.answer);
          
          // Find user selected index
          const userSelectedIndex = this.findOptionIndex(userResponse, currentExercise.options);
          
          console.log('🔍 ABC Comparison:', {
            correctIndex,
            userSelectedIndex,
            userResponse,
            options: currentExercise.options
          });
          
          if (correctIndex === -1) {
            console.error('❌ Invalid correct answer index:', currentExercise.correctAnswer);
            this.confirmation = '⚠️ Ошибка: некорректные данные правильного ответа.';
            return;
          }
          
          if (userSelectedIndex === -1) {
            console.error('❌ Could not find user selected option:', userResponse);
            this.confirmation = '⚠️ Ошибка: не удалось определить выбранный вариант.';
            return;
          }
          
          isCorrect = correctIndex === userSelectedIndex;
          
          // Set correct answer text for display
          if (correctIndex >= 0 && correctIndex < currentExercise.options.length) {
            const correctOption = currentExercise.options[correctIndex];
            correctAnswer = this.extractOptionText(correctOption);
          }
          break;
        }

        case 'true-false': {
          console.log('✅❌ True/False validation');
          
          const correctValue = String(currentExercise.correctAnswer || currentExercise.answer).toLowerCase();
          const userValue = String(userResponse).toLowerCase();
          
          console.log('🔍 True/False Comparison:', { correctValue, userValue });
          
          // Handle different true/false formats
          const normalizeBoolean = (value) => {
            const val = value.toLowerCase().trim();
            if (['true', 'правда', 'верно', 'да', '1'].includes(val)) return 'true';
            if (['false', 'ложь', 'неверно', 'нет', '0'].includes(val)) return 'false';
            return val;
          };
          
          isCorrect = normalizeBoolean(correctValue) === normalizeBoolean(userValue);
          correctAnswer = correctValue === 'true' ? 'Правда' : 'Ложь';
          break;
        }

        case 'fill-blank': {
          console.log('📝 Fill-blank validation');
          
          if (!Array.isArray(this.fillBlankAnswers)) {
            this.confirmation = '⚠️ Ошибка: ответы для пропусков недоступны.';
            return;
          }
          
          const expectedAnswers = currentExercise.blanks || [];
          isCorrect = this.validateFillBlankAnswer(this.fillBlankAnswers, expectedAnswers);
          correctAnswer = expectedAnswers.map(blank => blank.answer || blank).join(', ');
          break;
        }

        case 'matching': {
          console.log('🔗 Matching validation');
          
          if (!Array.isArray(this.matchingPairs)) {
            this.confirmation = '⚠️ Ошибка: пары для сопоставления недоступны.';
            return;
          }
          
          isCorrect = this.validateMatchingAnswer(this.matchingPairs, currentExercise);
          correctAnswer = 'Проверьте правильность сопоставления';
          break;
        }

        case 'ordering': {
          console.log('📋 Ordering validation');
          
          if (!Array.isArray(this.orderingItems)) {
            this.confirmation = '⚠️ Ошибка: элементы для упорядочивания недоступны.';
            return;
          }
          
          isCorrect = this.validateOrderingAnswer(this.orderingItems, currentExercise);
          correctAnswer = 'Проверьте правильность порядка';
          break;
        }

        case 'drag-drop': {
          console.log('🖱️ Drag-drop validation');
          
          if (!this.dragDropPlacements || typeof this.dragDropPlacements !== 'object') {
            this.confirmation = '⚠️ Ошибка: размещение элементов недоступно.';
            return;
          }
          
          isCorrect = this.validateDragDropAnswer(this.dragDropPlacements, currentExercise);
          correctAnswer = 'Проверьте правильность размещения';
          break;
        }

        case 'short-answer':
        default: {
          console.log('📝 Short answer validation');
          
          const expectedAnswer = currentExercise.correctAnswer || currentExercise.answer;
          if (!expectedAnswer) {
            console.error('❌ No expected answer found for short answer exercise');
            this.confirmation = '⚠️ Ошибка: правильный ответ недоступен.';
            return;
          }
          
          isCorrect = this.validateAnswer(userResponse, expectedAnswer, step.type);
          correctAnswer = String(expectedAnswer);
          break;
        }
      }

    // ============================================
    // OTHER STEP TYPES
    // ============================================
    } else {
      console.log('📚 Other step type validation');
      
      const expectedAnswer = this.getCorrectAnswer(step);
      if (expectedAnswer) {
        isCorrect = this.validateAnswer(userResponse, expectedAnswer, step.type);
        correctAnswer = String(expectedAnswer);
      } else {
        // No validation needed for some step types (like explanation)
        isCorrect = true;
      }
    }

    // ============================================
    // PROCESS VALIDATION RESULT
    // ============================================
    console.log('🎯 Validation result:', { isCorrect, correctAnswer });

    if (isCorrect) {
      this.confirmation = '✅ Верно! Отличная работа!';
      this.answerWasCorrect = true;
      this.stars++;
      this.earnedPoints += 10;
      this.currentHint = '';
      this.smartHint = '';
      
      console.log('🌟 Correct answer! Stars:', this.stars, 'Points:', this.earnedPoints);

    } else {
      this.mistakeCount++;
      this.answerWasCorrect = false;
      this.earnedPoints = Math.max(0, this.earnedPoints - 2);

      // Generate helpful feedback
      let feedback = 'Попробуйте еще раз.';
      try {
        feedback = this.generateHelpfulFeedback(userResponse, correctAnswer, answerType);
      } catch (error) {
        console.warn('⚠️ Error generating feedback:', error);
      }
      
      this.confirmation = `❌ Неверно. ${feedback}`;
      
      // Show correct answer if available
      const correctAnswerDisplay = this.safeStringConvert(correctAnswer);
      if (correctAnswerDisplay && correctAnswerDisplay !== 'undefined' && correctAnswerDisplay !== '') {
        this.confirmation += ` Правильный ответ: "${correctAnswerDisplay}"`;
      }

      // Log mistake for analytics
      this.mistakeLog.push({
        stepIndex: this.currentIndex,
        exerciseIndex: this.currentExerciseIndex,
        quizIndex: this.currentQuizIndex,
        question: this.getCurrentQuestionText(),
        userAnswer: userResponse,
        correctAnswer: correctAnswer,
        exerciseType: answerType,
        hint: currentExercise?.hint || null
      });

      console.log('❌ Wrong answer! Mistakes:', this.mistakeCount, 'Points:', this.earnedPoints);

      // Generate smart hint after 2+ mistakes
      if (this.mistakeCount >= 2) {
        try {
          const lessonContext = {
            lessonId: this.lesson._id,
            lessonName: this.lesson.lessonName,
            topic: this.lesson.topic
          };
          
          if (typeof generateSmartHint === 'function') {
            const hintData = step.type === 'quiz' ? this.getCurrentQuiz() : this.getCurrentExercise();
            this.smartHint = await generateSmartHint(hintData, this.mistakeCount, lessonContext);
            this.hintsUsed = true;
          }
        } catch (error) {
          console.warn('⚠️ Error generating smart hint:', error);
        }
      }
    }

  } catch (error) {
    console.error('❌ Critical error in handleSubmitOrNext:', error);
    console.error('❌ Error stack:', error.stack);
    
    this.confirmation = '❌ Произошла критическая ошибка при проверке ответа. Попробуйте еще раз.';
    
    // Log error details for debugging
    console.error('❌ Error context:', {
      stepType: step.type,
      answerType,
      userResponse,
      currentExercise: this.getCurrentExercise(),
      currentQuiz: this.getCurrentQuiz()
    });
  }
},

// ============================================
// HELPER METHODS
// ============================================

parseAnswerIndex(answer) {
  if (typeof answer === 'number') return answer;
  if (typeof answer === 'string') {
    const parsed = parseInt(answer);
    return isNaN(parsed) ? -1 : parsed;
  }
  if (answer && typeof answer === 'object' && answer.$numberInt) {
    const parsed = parseInt(answer.$numberInt);
    return isNaN(parsed) ? -1 : parsed;
  }
  return -1;
},

findOptionIndex(selectedText, options) {
  if (!Array.isArray(options) || !selectedText) return -1;
  
  const normalizedSelected = this.normalizeText(selectedText);
  
  return options.findIndex(option => {
    const optionText = this.extractOptionText(option);
    const normalizedOption = this.normalizeText(optionText);
    return normalizedOption === normalizedSelected;
  });
},

extractOptionText(option) {
  if (typeof option === 'string') return option;
  if (option && typeof option === 'object') {
    return option.text || option.label || option.value || String(option);
  }
  return String(option);
},

normalizeText(text) {
  if (!text) return '';
  return String(text).trim().toLowerCase();
},

getCurrentQuestionText() {
  const step = this.currentStep;
  if (!step) return 'Unknown question';
  
  if (step.type === 'quiz') {
    const quiz = this.getCurrentQuiz();
    return quiz?.question || 'Quiz question unavailable';
  } else if (['exercise', 'practice'].includes(step.type)) {
    const exercise = this.getCurrentExercise();
    return exercise?.question || 'Exercise question unavailable';
  }
  
  return 'Question unavailable';
},

validateQuizAnswer(userAnswer, quiz) {
  console.log('🔍 validateQuizAnswer:', { userAnswer, quiz });
  
  if (!quiz || !quiz.question) {
    console.warn('⚠️ Invalid quiz data');
    return false;
  }
  
  const correctAnswer = quiz.correctAnswer;
  
  if (correctAnswer === null || correctAnswer === undefined) {
    console.warn('⚠️ No correct answer available');
    return false;
  }
  
  // Handle index-based answers (multiple choice)
  if (typeof correctAnswer === 'number') {
    const options = this.getQuizOptions(quiz);
    if (options.length > correctAnswer && correctAnswer >= 0) {
      const correctOption = options[correctAnswer];
      const normalizedUser = this.normalizeText(userAnswer);
      const normalizedCorrect = this.normalizeText(correctOption);
      
      console.log('🎯 Quiz index validation:', {
        correctIndex: correctAnswer,
        correctOption,
        normalizedUser,
        normalizedCorrect,
        match: normalizedUser === normalizedCorrect
      });
      
      return normalizedUser === normalizedCorrect;
    }
  }
  
  // Handle direct string/boolean comparison
  const normalizedUser = this.normalizeText(userAnswer);
  const normalizedCorrect = this.normalizeText(String(correctAnswer));
  
  console.log('🎯 Quiz direct validation:', {
    normalizedUser,
    normalizedCorrect,
    match: normalizedUser === normalizedCorrect
  });
  
  return normalizedUser === normalizedCorrect;
},
    showHint() {
      const step = this.currentStep;
      if (step && step.data && step.data.hint) {
        this.currentHint = step.data.hint;
        this.hintsUsed = true;
      } else {
        this.currentHint = 'Подсказка недоступна для этого задания.';
      }
    },

    // =============================================
    // VOCABULARY MODAL METHODS
    // =============================================

    initializeVocabularyModal(step) {
      if (!step || step.type !== 'vocabulary') return;
      
      let vocabularyItems = [];
      
      // Handle different data structures
      if (Array.isArray(step.data)) {
        vocabularyItems = step.data;
      } else if (step.data && Array.isArray(step.data.vocabulary)) {
        vocabularyItems = step.data.vocabulary;
      } else if (step.data && step.data.term && step.data.definition) {
        vocabularyItems = [step.data];
      }
      
      // Filter and validate vocabulary items
      vocabularyItems = vocabularyItems.filter(vocab => 
        vocab.term && vocab.term.trim() && 
        vocab.definition && vocab.definition.trim()
      ).map((vocab, index) => ({
        id: `vocab_${index}_${Date.now()}`,
        term: vocab.term.trim(),
        definition: vocab.definition.trim(),
        example: vocab.example ? String(vocab.example).trim() : '',
        pronunciation: vocab.pronunciation || '',
        partOfSpeech: vocab.partOfSpeech || '',
        difficulty: vocab.difficulty || 'medium',
        learned: false
      }));
      
      if (vocabularyItems.length > 0) {
        this.vocabularyModal = {
          isVisible: true,
          currentIndex: 0,
          words: vocabularyItems,
          isCompleted: false,
          showingList: false
        };
        
        this.cardAnimation = {
          isFlipping: false,
          showDefinition: false
        };
        
        // Track vocabulary step start
        this.trackVocabularyEvent('vocabulary_started', {
          wordCount: vocabularyItems.length,
          stepIndex: this.currentIndex
        });
      }
    },

    showVocabDefinition() {
      if (this.cardAnimation.isFlipping) return;
      
      this.cardAnimation.isFlipping = true;
      
      setTimeout(() => {
        this.cardAnimation.showDefinition = true;
        this.cardAnimation.isFlipping = false;
        
        // Track definition view
        this.trackVocabularyEvent('definition_viewed', {
          word: this.currentVocabWord?.term,
          wordIndex: this.vocabularyModal.currentIndex
        });
      }, 150);
    },

    hideVocabDefinition() {
      if (this.cardAnimation.isFlipping) return;
      
      this.cardAnimation.isFlipping = true;
      
      setTimeout(() => {
        this.cardAnimation.showDefinition = false;
        this.cardAnimation.isFlipping = false;
      }, 150);
    },

    markWordAsLearned() {
      if (this.currentVocabWord) {
        this.currentVocabWord.learned = true;
        
        // Track word completion
        this.trackVocabularyEvent('word_learned', {
          word: this.currentVocabWord.term,
          wordIndex: this.vocabularyModal.currentIndex,
          timeSpent: this.getWordStudyTime()
        });
      }
      
      this.nextVocabWord();
    },

    nextVocabWord() {
      if (this.isLastVocabWord) {
        this.completeVocabularyModal();
      } else {
        // Reset card state
        this.cardAnimation = {
          isFlipping: false,
          showDefinition: false
        };
        
        // Move to next word with animation
        setTimeout(() => {
          this.vocabularyModal.currentIndex++;
        }, 100);
      }
    },

    previousVocabWord() {
      if (this.vocabularyModal.currentIndex > 0) {
        // Reset card state
        this.cardAnimation = {
          isFlipping: false,
          showDefinition: false
        };
        
        // Move to previous word
        setTimeout(() => {
          this.vocabularyModal.currentIndex--;
        }, 100);
      }
    },

    completeVocabularyModal() {
      this.vocabularyModal.isCompleted = true;
      
      // Track completion
      this.trackVocabularyEvent('vocabulary_completed', {
        totalWords: this.vocabularyModal.words.length,
        learnedWords: this.vocabularyModal.words.filter(w => w.learned).length,
        completionRate: this.vocabularyModal.words.filter(w => w.learned).length / this.vocabularyModal.words.length
      });
      
      // Show completion animation
      setTimeout(() => {
        this.showVocabularyList();
      }, 2000);
    },

    showVocabularyList() {
      this.vocabularyModal.showingList = true;
      
      // After a short delay, hide modal and show list in content panel
      setTimeout(() => {
        this.vocabularyModal.isVisible = false;
        this.vocabularyModal.showingList = false;
        
        // Continue to next step or update current step display
        this.updateVocabularyStepDisplay();
      }, 1500);
    },

    updateVocabularyStepDisplay() {
      // Mark vocabulary as completed and show in left panel as list
      if (this.currentStep && this.currentStep.type === 'vocabulary') {
        // Add completed flag to step data
        this.currentStep.data.modalCompleted = true;
        this.currentStep.data.allWords = this.vocabularyModal.words;
      }
    },

    skipVocabularyModal() {
      this.vocabularyModal.isVisible = false;
      this.updateVocabularyStepDisplay();
      
      this.trackVocabularyEvent('vocabulary_skipped', {
        skipAt: this.vocabularyModal.currentIndex,
        totalWords: this.vocabularyModal.words.length
      });
    },

    restartVocabulary() {
      this.vocabularyModal.currentIndex = 0;
      this.vocabularyModal.isCompleted = false;
      this.vocabularyModal.showingList = false;
      this.vocabularyModal.words.forEach(word => word.learned = false);
      
      this.cardAnimation = {
        isFlipping: false,
        showDefinition: false
      };
      
      this.trackVocabularyEvent('vocabulary_restarted');
    },

    trackVocabularyEvent(eventType, data = {}) {
      if (this.debugMode) {
        console.log(`📚 Vocabulary Event: ${eventType}`, data);
      }
      
      // You can send this to analytics service
      // analytics.track(eventType, { lesson: this.lesson._id, ...data });
    },

    getWordStudyTime() {
      // This would track time since word was shown
      return Math.floor(Math.random() * 30) + 10; // Mock data
    },

    async pronounceWord(text) {
      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US'; // Adjust based on lesson language
          utterance.rate = 0.8;
          utterance.pitch = 1;
          
          speechSynthesis.speak(utterance);
          
          this.trackVocabularyEvent('pronunciation_used', {
            word: text
          });
        } catch (error) {
          console.warn('⚠️ Speech synthesis failed:', error);
        }
      }
    },

    // =============================================
    // NAVIGATION METHODS
    // =============================================

    goNext() {
      // Check if current step is vocabulary and modal hasn't been shown
      if (this.currentStep?.type === 'vocabulary' && 
          !this.currentStep.data?.modalCompleted && 
          !this.vocabularyModal.isVisible) {
        this.initializeVocabularyModal(this.currentStep);
        return; // Don't proceed to next step yet
      }
      
      // Original goNext logic
      this.userAnswer = '';
      this.confirmation = '';
      this.answerWasCorrect = false;
      this.currentHint = '';
      this.smartHint = '';
      this.explanationAIResponse = '';
      this.showExplanationHelp = false;

      if (this.isLastStep) {
        this.completeLesson();
      } else {
        this.currentIndex++;
        this.generateAISuggestions();
      }
    },

    goPrevious() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.userAnswer = '';
        this.confirmation = '';
        this.answerWasCorrect = false;
        this.currentHint = '';
        this.smartHint = '';
        this.explanationAIResponse = '';
        this.showExplanationHelp = false;
        this.generateAISuggestions();
        
        // Check if we're going back to a vocabulary step
        if (this.currentStep?.type === 'vocabulary' && this.currentStep.data?.modalCompleted) {
          // Reset the vocabulary step so modal can be shown again if needed
          this.currentStep.data.modalCompleted = false;
        }
      }
    },

    // =============================================
    // PROGRESS AND LESSON COMPLETION
    // =============================================

    async saveProgress(completed = false) {
      try {
        if (!this.userId || !this.lesson._id) {
          console.error('❌ Missing userId or lessonId for progress save');
          return false;
        }

        const completedSteps = [];
        if (this.started) {
          const maxIndex = Math.min(this.currentIndex, this.steps.length - 1);
          for (let i = 0; i <= maxIndex; i++) {
            completedSteps.push(i);
          }
        }

        const progressPercent = this.steps.length > 0 
          ? Math.floor((completedSteps.length / this.steps.length) * 100) 
          : 0;

        const progressData = {
          userId: this.userId,
          lessonId: String(this.lesson._id),
          topicId: String(this.lesson.topicId || this.lesson._id),
          completedSteps: completedSteps,
          progressPercent: progressPercent,
          completed: completed,
          mistakes: this.mistakeCount,
          medal: this.mistakeCount === 0 ? 'gold' : this.mistakeCount <= 2 ? 'silver' : 'bronze',
          duration: this.elapsedSeconds,
          stars: this.stars,
          points: this.earnedPoints,
          hintsUsed: this.hintsUsed ? 1 : 0,
          submittedHomework: false
        };

        // ✅ FIXED: Use the correct API endpoint
        const result = await submitProgress(this.userId, progressData);
        
        if (result.success) {
          return true;
        } else {
          console.warn('⚠️ Progress save returned success: false');
          return false;
        }
        
      } catch (err) {
        console.error('❌ Progress save error:', err);
        return false;
      }
    },

    async autosaveProgress() {
      try {
        const success = await this.saveProgress(false);
        if (!success) {
          setTimeout(() => this.autosaveProgress(), 30000);
        }
      } catch (error) {
        console.error('❌ Autosave error:', error);
      }
    },

    startLesson() {
      this.started = true;
      this.timerInterval = setInterval(() => this.elapsedSeconds++, 1000);
      this.autosaveTimer = setInterval(() => this.autosaveProgress(), 15000);
      this.generateAISuggestions();
    },

    continuePreviousProgress() {
      if (this.previousProgress) {
        this.currentIndex = Math.min(
          this.previousProgress.completedSteps.length, 
          this.steps.length - 1
        );
        this.stars = parseInt(this.previousProgress.stars) || 0;
        this.mistakeCount = parseInt(this.previousProgress.mistakes) || 0;
        this.elapsedSeconds = parseInt(this.previousProgress.duration) || 0;
        this.hintsUsed = Boolean(this.previousProgress.hintsUsed);
        this.earnedPoints = parseInt(this.previousProgress.points) || 0;
      }
      this.startLesson();
    },

    async retryLoad() {
      this.retryCount++;
      await this.loadLesson();
    },

    clearTimers() {
      clearInterval(this.timerInterval);
      clearInterval(this.autosaveTimer);
    },

    async completeLesson() {
      this.clearTimers();
      this.lessonCompleted = true;
      this.showConfetti = true;

      this.earnedPoints = Math.max(0, 100 - this.mistakeCount * 10 + this.stars * 5);

      if (this.mistakeCount === 0) {
        this.medalLabel = '🥇 Золотая медаль - Безупречно!';
      } else if (this.mistakeCount <= 2) {
        this.medalLabel = '🥈 Серебряная медаль - Отлично!';
      } else {
        this.medalLabel = '🥉 Бронзовая медаль - Хорошо!';
      }

      // Generate AI progress insight
      try {
        const lessonContext = {
          lessonId: this.lesson._id,
          lessonName: this.lesson.lessonName,
          topic: this.lesson.topic,
          totalSteps: this.steps.length
        };
        
        const userProgress = {
          completedSteps: Array.from({length: this.steps.length}, (_, i) => i),
          mistakes: this.mistakeCount,
          stars: this.stars,
          elapsedSeconds: this.elapsedSeconds
        };
        
        if (typeof generateProgressInsight === 'function') {
          this.progressInsight = await generateProgressInsight(userProgress, lessonContext);
        }
      } catch (error) {
        console.error('❌ Progress insight error:', error);
        this.progressInsight = 'Отличная работа! Вы успешно завершили урок! 🌟';
      }

      setTimeout(() => this.launchConfetti(), 200);
      await this.saveProgress(true);
    },

    launchConfetti() {
      const canvas = this.$refs.confettiCanvas;
      if (canvas) {
        const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
        myConfetti({ particleCount: 150, spread: 180, origin: { y: 0.6 } });
        setTimeout(() => (this.showConfetti = false), 5000);
      }
    },

    // =============================================
    // UTILITY METHODS
    // =============================================

    getStepIcon(stepType) {
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
      };
      return icons[stepType] || '📄';
    },

    getStepTypeText(stepType) {
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
      };
      return texts[stepType] || 'Контент';
    },

    getMedalIcon() {
      if (this.mistakeCount === 0) return '🥇';
      if (this.mistakeCount <= 2) return '🥈';
      return '🥉';
    },

    formatContent(content) {
      if (!content) return 'Контент недоступен';
      
      // Convert newlines to <br> tags for proper display
      return content.replace(/\n/g, '<br>');
    },

    getLocalized(field) {
      if (typeof field === 'string') return field;
      return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim();
    },
    getStepContent(step) {
  if (!step) {
    return 'Контент недоступен';
  }
  
  if (!step.data) {
    return 'Контент недоступен';
  }
  
  // ✅ CRITICAL FIX: For interactive steps, show ONLY the question
  if (['exercise', 'practice'].includes(step.type)) {
    const currentExercise = this.getCurrentExercise();
    if (currentExercise && currentExercise.question) {
      return this.getLocalized(currentExercise.question);
    }
    return 'Упражнение загружается...';
  }
  
  if (step.type === 'quiz') {
    const currentQuiz = this.getCurrentQuiz();
    if (currentQuiz && currentQuiz.question) {
      return this.getLocalized(currentQuiz.question);
    }
    return 'Вопрос загружается...';
  }
  
  // For non-interactive steps, show content
  try {
    if (typeof step.data === 'string' && step.data.trim()) {
      return step.data.trim();
    }
    
    if (step.data.content) {
      const content = this.getLocalized(step.data.content);
      if (content && content.trim()) {
        return content.trim();
      }
    }
    
    if (step.data.text) {
      const text = this.getLocalized(step.data.text);
      if (text && text.trim()) {
        return text.trim();
      }
    }
    
    if (step.data.explanation) {
      const explanation = this.getLocalized(step.data.explanation);
      if (explanation && explanation.trim()) {
        return explanation.trim();
      }
    }
    
    if (step.data.description) {
      const description = this.getLocalized(step.data.description);
      if (description && description.trim()) {
        return description.trim();
      }
    }
    
    if (step.type === 'vocabulary') {
      if (Array.isArray(step.data) && step.data.length > 0) {
        return `Изучение словаря: ${step.data.length} новых слов`;
      }
    }
    
    return `Контент для шага "${step.type}"`;
    
  } catch (error) {
    console.error('❌ Error in getStepContent:', error);
    return 'Ошибка загрузки контента';
  }
},

    handleLessonError(error) {
      if (error.message?.includes('not found')) {
        return 'Урок не найден. Проверьте ссылку или попробуйте перезагрузить страницу.';
      } else if (error.message?.includes('Authentication')) {
        return 'Необходимо войти в систему для доступа к уроку.';
      } else if (error.message?.includes('premium')) {
        return 'Этот урок доступен только для премиум-пользователей.';
      } else {
        return error.message || 'Произошла ошибка при загрузке урока.';
      }
    },

    // =============================================
    // MODAL HANDLING
    // =============================================

    confirmExit() {
      this.showExitModal = true;
    },

    cancelExit() {
      this.showExitModal = false;
    },

    async exitLesson() {
      if (this.started && !this.lessonCompleted) {
        await this.saveProgress(false);
      }
      this.showExitModal = false;
      this.$router.push('/catalogue');
    },

    // =============================================
    // AI INTEGRATION METHODS
    // =============================================

    async loadAIUsage() {
      try {
        if (typeof getUserUsage === 'function') {
          const usageInfo = await getUserUsage();
          if (usageInfo.success) {
            this.aiUsage = formatUsageDisplay(usageInfo.usage, usageInfo.plan);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load AI usage:', error);
      }
    },

    generateAISuggestions() {
      if (typeof generateLessonSuggestions === 'function') {
        this.aiSuggestions = generateLessonSuggestions(this.currentStep, {
          currentStep: this.currentIndex,
          mistakes: this.mistakeCount,
          completedSteps: Array.from({length: this.currentIndex}, (_, i) => i)
        });
        
        this.quickSuggestions = this.aiSuggestions.slice(0, 3);
      }
    },

    async sendAIMessage() {
      if (!this.aiChatInput.trim() || this.aiIsLoading) return;
      
      const userMessage = this.aiChatInput.trim();
      this.aiChatInput = '';
      this.aiIsLoading = true;
      
      this.aiChatHistory.push({
        id: Date.now(),
        type: 'user',
        content: userMessage
      });
      
      try {
        if (typeof getLessonAIResponse === 'function') {
          const lessonContext = {
            lessonId: this.lesson._id,
            lessonName: this.lesson.lessonName,
            topic: this.lesson.topic,
            totalSteps: this.steps.length
          };
          
          const userProgress = {
            currentStep: this.currentIndex,
            completedSteps: Array.from({length: this.currentIndex}, (_, i) => i),
            mistakes: this.mistakeCount,
            stars: this.stars,
            elapsedSeconds: this.elapsedSeconds
          };
          
          const stepContext = {
            type: this.currentStep?.type || 'unknown',
            data: this.currentStep?.data
          };
          
          const aiResponse = await getLessonAIResponse(userMessage, lessonContext, userProgress, stepContext);
          
          this.aiChatHistory.push({
            id: Date.now() + 1,
            type: 'ai',
            content: aiResponse
          });
          
          this.generateAISuggestions();
          await this.loadAIUsage();
        }
        
      } catch (error) {
        console.error('❌ AI chat error:', error);
        this.aiChatHistory.push({
          id: Date.now() + 1,
          type: 'ai',
          content: 'Извините, возникла ошибка. Попробуйте снова.'
        });
      } finally {
        this.aiIsLoading = false;
      }
    },

    async askAI(question) {
      this.aiChatInput = question;
      await this.sendAIMessage();
    },

    async sendFloatingAIMessage() {
      if (!this.floatingAIInput.trim() || this.aiIsLoading) return;
      
      this.aiChatInput = this.floatingAIInput;
      this.floatingAIInput = '';
      await this.sendAIMessage();
    },

    toggleFloatingAI() {
      this.showFloatingAI = !this.showFloatingAI;
      if (this.showFloatingAI) {
        this.generateAISuggestions();
      }
    },

    async askAboutExplanation() {
      if (!this.explanationQuestion.trim()) return;
      
      try {
        if (typeof getExplanationHelp === 'function') {
          const explanationText = this.getLocalized(this.currentStep.data);
          const lessonContext = {
            lessonId: this.lesson._id,
            lessonName: this.lesson.lessonName,
            topic: this.lesson.topic
          };
          
          this.explanationAIResponse = await getExplanationHelp(
            explanationText, 
            this.explanationQuestion, 
            lessonContext
          );
          
          this.explanationQuestion = '';
        }
        
      } catch (error) {
        console.error('❌ Explanation help error:', error);
        this.explanationAIResponse = 'Не удалось получить помощь. Попробуйте снова.';
      }
    },

    // =============================================
    // SHARING AND EXTERNAL ACTIONS
    // =============================================

    shareResult() {
      const message = `🎉 Я только что завершил урок "${this.getLocalized(this.lesson.lessonName)}"! Получил ${this.stars} звезд и ${this.earnedPoints} очков! 🚀`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Мой успех в обучении!',
          text: message,
          url: window.location.href
        }).catch(err => {
          this.fallbackShare(message);
        });
      } else {
        this.fallbackShare(message);
      }
    },

    fallbackShare(message) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(message).then(() => {
          alert('📋 Результат скопирован в буфер обмена!');
        }).catch(() => {
          alert('📤 ' + message);
        });
      } else {
        alert('📤 ' + message);
      }
    },

    goToHomework() {
      this.$router.push(`/profile/homeworks/${this.lesson._id}`);
    },
    // Add these methods to the LessonPage.vue methods section

// =============================================
// ENHANCED EXERCISE AND QUIZ METHODS
// =============================================

// Current exercise tracking
currentExerciseIndex: 0,
currentQuizIndex: 0,

// Exercise navigation methods
getCurrentExercise() {
  const step = this.currentStep;
  if (!step || !['exercise', 'practice'].includes(step.type)) {
    return null;
  }
  
  let exercises = [];
  
  try {
    if (Array.isArray(step.data)) {
      exercises = step.data;
    } else if (step.data && Array.isArray(step.data.exercises)) {
      exercises = step.data.exercises;
    } else if (step.data && step.data.question) {
      exercises = [step.data];
    }
    
    if (exercises.length === 0) {
      return null;
    }
    
    if (this.currentExerciseIndex >= exercises.length) {
      this.currentExerciseIndex = 0;
    }
    
    return exercises[this.currentExerciseIndex];
    
  } catch (error) {
    console.error('❌ Error in getCurrentExercise:', error);
    return null;
  }
},


  getCurrentQuiz() {
    const step = this.currentStep;
    if (!step || step.type !== 'quiz') {
      return null;
    }
    
    let quizzes = [];
    
    try {
      // Handle different data structures
      if (Array.isArray(step.data)) {
        quizzes = step.data;
      } else if (step.data && Array.isArray(step.data.quizzes)) {
        quizzes = step.data.quizzes;
      } else if (step.data && step.data.question) {
        quizzes = [step.data];
      }
      
      if (quizzes.length === 0) {
        console.warn('⚠️ No quiz questions found');
        return null;
      }
      
      // Ensure index is within bounds
      if (this.currentQuizIndex >= quizzes.length) {
        this.currentQuizIndex = 0;
      }
      
      const quiz = quizzes[this.currentQuizIndex];
      console.log('✅ Current quiz:', quiz);
      return quiz;
      
    } catch (error) {
      console.error('❌ Error in getCurrentQuiz:', error);
      return null;
    }
  },

  getTotalExercises() {
    const step = this.currentStep;
    if (!step || !['exercise', 'practice'].includes(step.type)) {
      return 0;
    }
    
    let exercises = [];
    
    if (Array.isArray(step.data)) {
      exercises = step.data;
    } else if (step.data && Array.isArray(step.data.exercises)) {
      exercises = step.data.exercises;
    } else if (step.data && step.data.question) {
      exercises = [step.data];
    }
    
    return exercises.length;
  },


  getTotalQuizzes() {
    const step = this.currentStep;
    if (!step || step.type !== 'quiz') {
      return 0;
    }
    
    let quizzes = [];
    
    if (Array.isArray(step.data)) {
      quizzes = step.data;
    } else if (step.data && Array.isArray(step.data.quizzes)) {
      quizzes = step.data.quizzes;
    } else if (step.data && step.data.question) {
      quizzes = [step.data];
    }
    
    return quizzes.length;
  },
getQuizCounter() {
  const totalQuizzes = this.getTotalQuizzes();
  if (totalQuizzes === 0) {
    return '0 / 0';
  }
  return `${this.currentQuizIndex + 1} / ${totalQuizzes}`;
},
// Quiz option processing
getQuizOptions(quiz) {
  if (!quiz) return [];
  
  let options = [];
  
  if (Array.isArray(quiz.options)) {
    options = quiz.options;
  } else if (quiz.type === 'true-false') {
    options = ['True', 'False'];
  } else {
    console.warn('⚠️ No options found for quiz');
    return [];
  }
  
  // Normalize options to strings
  return options.map(option => {
    if (typeof option === 'string') return option;
    if (option && typeof option === 'object') {
      return option.text || option.label || option.value || String(option);
    }
    return String(option);
  }).filter(opt => opt && opt.trim());
},

// Exercise navigation
goToNextExercise() {
  const totalExercises = this.getTotalExercises();
  
  if (this.isLastExercise()) {
    // Move to next step
    this.goNext();
  } else {
    // Move to next exercise in current step
    this.currentExerciseIndex++;
    
    // CRITICAL: Reset all answer-related state
    this.resetExerciseState();
    
    console.log(`✅ Moved to exercise ${this.currentExerciseIndex + 1} of ${totalExercises}`);
  }
},
resetExerciseState() {
  this.userAnswer = '';
  this.confirmation = '';
  this.answerWasCorrect = false;
  this.currentHint = '';
  this.smartHint = '';
  
  // Reset specific exercise type data
  this.fillBlankAnswers = [];
  this.matchingPairs = [];
  this.selectedMatchingItem = null;
  
  // Re-initialize current exercise data if needed
  this.initializeCurrentExerciseData();
},
initializeCurrentExerciseData() {
  const exercise = this.getCurrentExercise();
  if (!exercise) return;
  
  switch (exercise.type) {
    case 'fill-blank':
      this.fillBlankAnswers = new Array(exercise.blanks?.length || 0).fill('');
      break;
    case 'ordering':
      this.initializeOrderingItems();
      break;
    case 'drag-drop':
      this.initializeDragDropItems();
      break;
    case 'matching':
      this.matchingPairs = [];
      this.selectedMatchingItem = null;
      break;
  }
},
getExerciseTypeName(type) {
  const typeNames = {
    'short-answer': 'Короткий ответ',
    'multiple-choice': 'Множественный выбор',
    'abc': 'Выбор варианта',
    'true-false': 'Верно/Неверно',
    'fill-blank': 'Заполните пропуски',
    'matching': 'Сопоставление',
    'ordering': 'Упорядочивание',
    'drag-drop': 'Перетащите и отпустите'
  };
  return typeNames[type] || 'Упражнение';
},
  goToNextQuiz() {
    if (this.isLastQuiz()) {
      // Move to next step
      this.goNext();
    } else {
      // Move to next quiz in current step
      this.currentQuizIndex++;
      this.resetExerciseState();
    }
  },
isLastExercise() {
    const totalExercises = this.getTotalExercises();
    return this.currentExerciseIndex >= totalExercises - 1;
  },

  isLastQuiz() {
    const totalQuizzes = this.getTotalQuizzes();
    return this.currentQuizIndex >= totalQuizzes - 1;
  },


// Answer validation helpers
canSubmitAnswer() {
    const currentExercise = this.getCurrentExercise();
    if (!currentExercise) {
      // For quiz questions
      return this.userAnswer && this.userAnswer.trim().length > 0;
    }
    
    const exerciseType = currentExercise.type || 'short-answer';
    
    switch (exerciseType) {
      case 'short-answer':
        return this.userAnswer && this.userAnswer.trim().length > 0;
        
      case 'multiple-choice':
      case 'abc':
      case 'true-false':
        return this.userAnswer !== null && this.userAnswer !== undefined && this.userAnswer !== '';
        
      case 'fill-blank':
        return this.fillBlankAnswers && 
               this.fillBlankAnswers.length > 0 &&
               this.fillBlankAnswers.some(answer => answer && answer.trim());
        
      case 'matching':
        return this.matchingPairs && this.matchingPairs.length > 0;
        
      case 'ordering':
        return this.orderingItems && this.orderingItems.length > 0;
        
      case 'drag-drop':
        return this.dragDropPlacements && Object.keys(this.dragDropPlacements).length > 0;
        
      default:
        return this.userAnswer && this.userAnswer.trim().length > 0;
    }
  },

// =============================================
// ADVANCED EXERCISE TYPE SUPPORT
// =============================================

// Fill in the blanks
fillBlankAnswers: [],

getFillBlankTemplate() {
  const exercise = this.getCurrentExercise();
  if (!exercise || exercise.type !== 'fill-blank') return '';
  
  let template = exercise.template || exercise.question || '';
  
  // Replace blanks with input placeholders
  const blankPattern = /\[blank\]/gi;
  let blankIndex = 0;
  
  return template.replace(blankPattern, () => {
    return `<span class="fill-blank-placeholder">[Пропуск ${blankIndex++ + 1}]</span>`;
  });
},

validateFillBlankAnswer(userAnswers, correctAnswers) {
  if (!Array.isArray(userAnswers) || !Array.isArray(correctAnswers)) {
    return false;
  }
  
  if (userAnswers.length !== correctAnswers.length) {
    return false;
  }
  
  let correctCount = 0;
  
  for (let i = 0; i < userAnswers.length; i++) {
    const userAnswer = (userAnswers[i] || '').toLowerCase().trim();
    const correctAnswer = (correctAnswers[i] || '').toLowerCase().trim();
    
    if (this.validateAnswer(userAnswer, correctAnswer, 'fill-blank')) {
      correctCount++;
    }
  }
  
  // Accept if at least 70% of blanks are correct
  const accuracy = correctCount / correctAnswers.length;
  return accuracy >= 0.7;
},

// Matching exercises
matchingPairs: [],
selectedMatchingItem: null,

selectMatchingItem(side, index) {
  const newSelection = { side, index };
  
  if (!this.selectedMatchingItem) {
    // First selection
    this.selectedMatchingItem = newSelection;
  } else if (this.selectedMatchingItem.side === side && this.selectedMatchingItem.index === index) {
    // Deselect same item
    this.selectedMatchingItem = null;
  } else if (this.selectedMatchingItem.side === side) {
    // Select different item on same side
    this.selectedMatchingItem = newSelection;
  } else {
    // Create a pair
    this.createMatchingPair(this.selectedMatchingItem, newSelection);
    this.selectedMatchingItem = null;
  }
},

createMatchingPair(leftItem, rightItem) {
  const exercise = this.getCurrentExercise();
  if (!exercise || exercise.type !== 'matching') return;
  
  // Ensure we have left and right items
  if (leftItem.side === 'right') {
    [leftItem, rightItem] = [rightItem, leftItem];
  }
  
  const leftItems = this.getMatchingLeftItems();
  const rightItems = this.getMatchingRightItems();
  
  const pair = {
    leftIndex: leftItem.index,
    rightIndex: rightItem.index,
    leftText: leftItems[leftItem.index],
    rightText: rightItems[rightItem.index]
  };
  
  // Remove existing pairs with these items
  this.matchingPairs = this.matchingPairs.filter(p => 
    p.leftIndex !== pair.leftIndex && p.rightIndex !== pair.rightIndex
  );
  
  // Add new pair
  this.matchingPairs.push(pair);
},

removeMatchingPair(index) {
  this.matchingPairs.splice(index, 1);
},

clearMatchingPairs() {
  this.matchingPairs = [];
  this.selectedMatchingItem = null;
},

getMatchingLeftItems() {
  const exercise = this.getCurrentExercise();
  if (!exercise || exercise.type !== 'matching') return [];
  
  const pairs = exercise.pairs || [];
  return pairs.map(pair => pair.left || pair[0] || '');
},

getMatchingRightItems() {
  const exercise = this.getCurrentExercise();
  if (!exercise || exercise.type !== 'matching') return [];
  
  const pairs = exercise.pairs || [];
  return pairs.map(pair => pair.right || pair[1] || '');
},

isItemMatched(side, index) {
  if (side === 'left') {
    return this.matchingPairs.some(pair => pair.leftIndex === index);
  } else {
    return this.matchingPairs.some(pair => pair.rightIndex === index);
  }
},

validateMatchingAnswer(userPairs, exercise) {
  if (!Array.isArray(userPairs) || !exercise.pairs) {
    return false;
  }
  
  const correctPairs = exercise.pairs;
  let correctMatches = 0;
  
  userPairs.forEach(userPair => {
    const correctPair = correctPairs[userPair.leftIndex];
    if (correctPair && 
        this.validateAnswer(userPair.rightText, correctPair.right || correctPair[1], 'matching')) {
      correctMatches++;
    }
  });
  
  // Accept if at least 70% of pairs are correct
  const accuracy = correctMatches / Math.min(userPairs.length, correctPairs.length);
  return accuracy >= 0.7;
},

// Ordering/Sequencing exercises
orderingItems: [],
draggedItem: null,
dropTarget: null,

initializeOrderingItems() {
  const exercise = this.getCurrentExercise();
  if (!exercise || exercise.type !== 'ordering') return;
  
  const items = exercise.items || [];
  this.orderingItems = items.map((item, index) => ({
    id: `item_${index}`,
    text: typeof item === 'string' ? item : item.text || '',
    originalIndex: index
  }));
  
  // Shuffle items
  this.shuffleArray(this.orderingItems);
},

shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
},

startDrag(event, index) {
  this.draggedItem = index;
  event.dataTransfer.effectAllowed = 'move';
},

onDragOver(event, index) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
},

onDragEnter(index) {
  this.dropTarget = index;
},

onDragLeave() {
  this.dropTarget = null;
},

onDrop(event, index) {
  event.preventDefault();
  
  if (this.draggedItem !== null && this.draggedItem !== index) {
    const draggedItemData = this.orderingItems[this.draggedItem];
    this.orderingItems.splice(this.draggedItem, 1);
    this.orderingItems.splice(index, 0, draggedItemData);
  }
  
  this.draggedItem = null;
  this.dropTarget = null;
},

moveOrderingItem(index, direction) {
  const newIndex = index + direction;
  
  if (newIndex >= 0 && newIndex < this.orderingItems.length) {
    const item = this.orderingItems[index];
    this.orderingItems.splice(index, 1);
    this.orderingItems.splice(newIndex, 0, item);
  }
},

resetOrdering() {
  this.initializeOrderingItems();
},

validateOrderingAnswer(userOrder, exercise) {
  if (!Array.isArray(userOrder) || !exercise.items) {
    return false;
  }
  
  const correctOrder = exercise.items;
  let correctPositions = 0;
  
  userOrder.forEach((item, index) => {
    const correctItem = correctOrder[index];
    const itemText = typeof item === 'string' ? item : item.text;
    const correctText = typeof correctItem === 'string' ? correctItem : correctItem.text;
    
    if (this.validateAnswer(itemText, correctText, 'ordering')) {
      correctPositions++;
    }
  });
  
  // Accept if at least 80% of items are in correct position
  const accuracy = correctPositions / correctOrder.length;
  return accuracy >= 0.8;
},

// Drag and Drop exercises
dragDropPlacements: {},
draggedDragItem: null,
dropOverZone: null,

initializeDragDropItems() {
  const exercise = this.getCurrentExercise();
  if (!exercise || exercise.type !== 'drag-drop') return;
  
  this.dragDropPlacements = {};
},

getAvailableDragItems() {
  const exercise = this.getCurrentExercise();
  if (!exercise || exercise.type !== 'drag-drop') return [];
  
  const allItems = exercise.dragItems || [];
  const placedItems = Object.values(this.dragDropPlacements).flat();
  
  return allItems.filter(item => 
    !placedItems.some(placedItem => placedItem.id === item.id)
  );
},

getDropZoneItems(zoneId) {
  return this.dragDropPlacements[zoneId] || [];
},

startDragDrop(event, item) {
  this.draggedDragItem = item;
  event.dataTransfer.effectAllowed = 'move';
},

onDropZoneOver(zoneId) {
  this.dropOverZone = zoneId;
},

onDropZoneEnter(zoneId) {
  this.dropOverZone = zoneId;
},

onDropZoneLeave() {
  this.dropOverZone = null;
},

onDropZoneDrop(event, zoneId) {
  event.preventDefault();
  
  if (this.draggedDragItem) {
    if (!this.dragDropPlacements[zoneId]) {
      this.dragDropPlacements[zoneId] = [];
    }
    
    // Remove item from other zones
    Object.keys(this.dragDropPlacements).forEach(zone => {
      this.dragDropPlacements[zone] = this.dragDropPlacements[zone].filter(
        item => item.id !== this.draggedDragItem.id
      );
    });
    
    // Add to current zone
    this.dragDropPlacements[zoneId].push(this.draggedDragItem);
  }
  
  this.draggedDragItem = null;
  this.dropOverZone = null;
},

returnDragItem(item) {
  // Remove item from all zones
  Object.keys(this.dragDropPlacements).forEach(zone => {
    this.dragDropPlacements[zone] = this.dragDropPlacements[zone].filter(
      placedItem => placedItem.id !== item.id
    );
  });
},

validateDragDropAnswer(userPlacements, exercise) {
  if (!userPlacements || !exercise.dropZones) {
    return false;
  }
  
  let correctPlacements = 0;
  let totalExpectedPlacements = 0;
  
  exercise.dropZones.forEach(zone => {
    const expectedItems = zone.expectedItems || [];
    const userItems = userPlacements[zone.id] || [];
    
    totalExpectedPlacements += expectedItems.length;
    
    expectedItems.forEach(expectedItem => {
      if (userItems.some(userItem => 
        this.validateAnswer(userItem.text || userItem.id, expectedItem, 'drag-drop')
      )) {
        correctPlacements++;
      }
    });
  });
  
  if (totalExpectedPlacements === 0) return true;
  
  // Accept if at least 70% of items are correctly placed
  const accuracy = correctPlacements / totalExpectedPlacements;
  return accuracy >= 0.7;
},

// =============================================
// STEP NAVIGATION OVERRIDES
// =============================================

// Override goNext to reset exercise/quiz indices
goNext() {
  // Reset exercise and quiz indices when moving to next step
  this.currentExerciseIndex = 0;
  this.currentQuizIndex = 0;
  
  // Reset all exercise-specific data
  this.fillBlankAnswers = [];
  this.matchingPairs = [];
  this.selectedMatchingItem = null;
  this.orderingItems = [];
  this.dragDropPlacements = {};
  this.draggedDragItem = null;
  this.dropOverZone = null;
  
  // Check if current step is vocabulary and modal hasn't been shown
  if (this.currentStep?.type === 'vocabulary' && 
      !this.currentStep.data?.modalCompleted && 
      !this.vocabularyModal.isVisible) {
    this.initializeVocabularyModal(this.currentStep);
    return; // Don't proceed to next step yet
  }
  
  // Original goNext logic
  this.userAnswer = '';
  this.confirmation = '';
  this.answerWasCorrect = false;
  this.currentHint = '';
  this.smartHint = '';
  this.explanationAIResponse = '';
  this.showExplanationHelp = false;

  if (this.isLastStep) {
    this.completeLesson();
  } else {
    this.currentIndex++;
    
    // Initialize new step data
    this.initializeStepData();
    this.generateAISuggestions();
  }
},

// Override goPrevious to reset exercise/quiz indices
goPrevious() {
  if (this.currentIndex > 0) {
    this.currentIndex--;
    
    // Reset indices and data
    this.currentExerciseIndex = 0;
    this.currentQuizIndex = 0;
    this.fillBlankAnswers = [];
    this.matchingPairs = [];
    this.selectedMatchingItem = null;
    this.orderingItems = [];
    this.dragDropPlacements = {};
    
    this.userAnswer = '';
    this.confirmation = '';
    this.answerWasCorrect = false;
    this.currentHint = '';
    this.smartHint = '';
    this.explanationAIResponse = '';
    this.showExplanationHelp = false;
    
    // Initialize step data
    this.initializeStepData();
    this.generateAISuggestions();
    
    // Check if we're going back to a vocabulary step
    if (this.currentStep?.type === 'vocabulary' && this.currentStep.data?.modalCompleted) {
      // Reset the vocabulary step so modal can be shown again if needed
      this.currentStep.data.modalCompleted = false;
    }
  }
},

// Initialize step-specific data
initializeStepData() {
  if (!this.currentStep) return;
  
  switch (this.currentStep.type) {
    case 'exercise':
    case 'practice':
      if (this.getCurrentExercise()?.type === 'fill-blank') {
        const exercise = this.getCurrentExercise();
        this.fillBlankAnswers = new Array(exercise.blanks?.length || 0).fill('');
      } else if (this.getCurrentExercise()?.type === 'ordering') {
        this.initializeOrderingItems();
      } else if (this.getCurrentExercise()?.type === 'drag-drop') {
        this.initializeDragDropItems();
      }
      break;
      
    case 'quiz':
      // Quiz initialization if needed
      break;
      
    case 'vocabulary':
      // Vocabulary initialization handled in modal
      break;
  }
}
  }
};
</script>
<style scoped>
/* ===========================================
  BASE STYLES & RESET
  =========================================== */
  @import "@/assets/css/LessonPage.css";</style>
