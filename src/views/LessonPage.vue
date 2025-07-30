<template>
  <div class="lesson-page">
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

    <div v-if="showPaywallModal" class="modal-overlay">
      <div class="paywall-modal">
        <div class="modal-header">
          <h2>🔒 Premium Content</h2>
          <button @click="closePaywallModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="premium-features">
            <div class="feature">
              <span class="feature-icon">⭐</span>
              <span>Advanced exercises</span>
            </div>
            <div class="feature">
              <span class="feature-icon">🎯</span>
              <span>Personalized learning</span>
            </div>
            <div class="feature">
              <span class="feature-icon">📊</span>
              <span>Detailed progress tracking</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="$router.push('/pay/start')" class="btn btn-premium">
            <span class="btn-icon">🚀</span>
            Upgrade Now
          </button>
          <button @click="handleReturnToCatalogue" class="btn btn-ghost">
            Maybe Later
          </button>
        </div>
      </div>
    </div>

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

    <div v-if="vocabularyModal.isVisible" class="modal-overlay vocabulary-overlay">
      <div class="vocabulary-modal">
        <div class="vocab-header">
          <div class="vocab-progress-info">
            <h2>📚 Vocabulary Learning</h2>
            <span class="vocab-counter">{{ currentIndex + 1 }} / {{ vocabularyModal.words.length }}</span>
          </div>
          <div class="vocab-progress-bar">
            <div class="progress-fill" :style="{ width: vocabProgress + '%' }"></div>
          </div>
        </div>
        
        <div v-if="currentVocabWord" class="vocab-card-container">
          <div class="vocab-card" :class="{ flipped: cardAnimation.showDefinition, flipping: cardAnimation.isFlipping }">
            <div class="card-face card-front">
              <div class="word-main">
                <h3 class="word-term">{{ extractWordProperty(currentVocabWord, 'term') }}</h3>
                <p v-if="extractWordProperty(currentVocabWord, 'pronunciation')" class="pronunciation">
                  🔊 {{ extractWordProperty(currentVocabWord, 'pronunciation') }}
                </p>
              </div>
              <div class="card-actions">
                <button @click="showVocabDefinition" class="btn btn-primary">
                  <span class="btn-icon">👁️</span>
                  Show Definition
                </button>
                <button @click="pronounceWord(extractWordProperty(currentVocabWord, 'term'))" class="btn btn-icon-only">
                  🔊
                </button>
              </div>
            </div>
            
            <div class="card-face card-back">
              <div class="definition-content">
                <h3 class="word-term">{{ extractWordProperty(currentVocabWord, 'term') }}</h3>
                <p class="definition">{{ extractWordProperty(currentVocabWord, 'definition') }}</p>
                <p v-if="extractWordProperty(currentVocabWord, 'example')" class="example">
                  <strong>Example:</strong> {{ extractWordProperty(currentVocabWord, 'example') }}
                </p>
              </div>
              <div class="card-actions">
                <button 
                  @click="markWordAsLearned" 
                  class="btn"
                  :class="currentVocabWord.learned ? 'btn-success' : 'btn-primary'"
                >
                  <span class="btn-icon">{{ currentVocabWord.learned ? '✅' : '📖' }}</span>
                  {{ currentVocabWord.learned ? 'Learned!' : 'Mark as Learned' }}
                </button>
                <button @click="hideVocabDefinition" class="btn btn-secondary">
                  <span class="btn-icon">🔄</span>
                  Flip Back
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="vocab-controls">
          <button 
            @click="previousVocabWord" 
            :disabled="currentIndex === 0"
            class="btn btn-secondary"
          >
            <span class="btn-icon">⬅️</span>
            Previous
          </button>
          
          <button @click="skipVocabularyModal" class="btn btn-ghost">
            Skip Vocabulary
          </button>
          
          <button @click="nextVocabWord" class="btn btn-primary">
            <span class="btn-icon">{{ isLastVocabWord ? '🎉' : '➡️' }}</span>
            {{ isLastVocabWord ? 'Complete' : 'Next' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!started && !showPaywallModal && !loading && !error" class="lesson-intro">
      <div class="intro-background">
        <div class="background-pattern"></div>
        <div class="floating-elements">
          <div class="floating-element" style="--delay: 0s">📚</div>
          <div class="floating-element" style="--delay: 2s">⭐</div>
          <div class="floating-element" style="--delay: 4s">🎯</div>
          <div class="floating-element" style="--delay: 6s">💡</div>
        </div>
      </div>
      
      <div class="intro-content">
        <div class="lesson-badge">
          <span class="badge-icon">🔥</span>
          <span class="badge-text">Ready to Learn</span>
        </div>
        
        <h1 class="lesson-title">{{ getLocalized(lesson.lessonName) }}</h1>
        <p class="lesson-description">{{ getLocalized(lesson.description) }}</p>
        
        <div class="lesson-preview">
          <div class="preview-stats">
            <div class="stat-card">
              <div class="stat-icon">⏱️</div>
              <div class="stat-content">
                <span class="stat-value">{{ estimatedTime }}</span>
                <span class="stat-label">minutes</span>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📋</div>
              <div class="stat-content">
                <span class="stat-value">{{ steps.length }}</span>
                <span class="stat-label">steps</span>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-content">
                <span class="stat-value">{{ lesson.difficulty || 'Medium' }}</span>
                <span class="stat-label">difficulty</span>
              </div>
            </div>
          </div>
          
          <div v-if="previousProgress" class="continue-section">
            <div class="continue-card">
              <div class="continue-info">
                <h3>📈 Continue your progress</h3>
                <p>You're {{ Math.round(((previousProgress.completedSteps?.length || 0) / steps.length) * 100) }}% through this lesson</p>
              </div>
              <div class="continue-progress">
                <div class="progress-ring">
                  <div class="ring-background"></div>
                  <div class="ring-progress" :style="{ '--progress': ((previousProgress.completedSteps?.length || 0) / steps.length) * 100 }"></div>
                  <div class="ring-content">
                    <span class="ring-percentage">{{ Math.round(((previousProgress.completedSteps?.length || 0) / steps.length) * 100) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="intro-actions">
          <button 
            v-if="!previousProgress" 
            @click="startLesson" 
            class="btn btn-primary btn-hero"
          >
            <span class="btn-icon">🚀</span>
            <span class="btn-text">Start Learning</span>
            <div class="btn-glow"></div>
          </button>
          
          <div v-else class="continue-options">
            <button @click="continuePreviousProgress" class="btn btn-primary btn-hero">
              <span class="btn-icon">▶️</span>
              <span class="btn-text">Continue from Step {{ (previousProgress.completedSteps?.length || 0) + 1 }}</span>
              <div class="btn-glow"></div>
            </button>
            <button @click="startLesson" class="btn btn-secondary">
              <span class="btn-icon">🔄</span>
              Start Over
            </button>
          </div>
          
          <button @click="confirmExit" class="btn btn-ghost">
            <span class="btn-icon">⬅️</span>
            Back to Catalogue
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      <div class="lesson-header">
        <div class="header-content">
          <div class="lesson-info">
            <h2 class="lesson-name">{{ getLocalized(lesson.lessonName) }}</h2>
            <div class="lesson-meta">
              <div class="meta-item">
                <span class="meta-icon">📍</span>
                <span class="meta-text">Step {{ currentIndex + 1 }} of {{ steps.length }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">⏱️</span>
                <span class="meta-text">{{ formattedTime }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">⭐</span>
                <span class="meta-text">{{ stars }} stars</span>
              </div>
            </div>
          </div>
          
          <div class="header-actions">
            <button @click="openProblemReportModal" class="btn btn-ghost btn-sm" title="Report Problem">
              <span class="btn-icon">⚠️</span>
            </button>
            <button @click="confirmExit" class="btn btn-secondary btn-sm">
              <span class="btn-icon">🚪</span>
              Exit
            </button>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-track">
            <div 
              class="progress-fill" 
              :style="{ width: progressPercentage + '%' }"
            ></div>
            <div class="progress-steps">
              <div 
                v-for="(step, index) in steps" 
                :key="index"
                class="progress-step"
                :class="{
                  completed: index < currentIndex,
                  current: index === currentIndex,
                  upcoming: index > currentIndex
                }"
                :style="{ left: (index / (steps.length - 1)) * 100 + '%' }"
              >
                <div class="step-dot">
                  <span v-if="index < currentIndex">✓</span>
                  <span v-else-if="index === currentIndex">{{ getStepIcon(step.type) }}</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-tooltip">
                  {{ getStepTypeText(step.type) }}
                </div>
              </div>
            </div>
          </div>
          <div class="progress-info">
            <span class="progress-text">{{ progressPercentage }}% Complete</span>
            <span class="progress-remaining">{{ steps.length - currentIndex - 1 }} steps remaining</span>
          </div>
        </div>
      </div>

      <div class="split-container">
        <div 
          class="split-content"
          :class="{
            'both-panels': showContentPanel && showInteractivePanel,
            'content-only': showContentPanel && !showInteractivePanel,
            'interactive-only': !showContentPanel && showInteractivePanel,
            'vertical-layout': isVerticalLayout
          }"
        >
          <div 
            v-if="showContentPanel"
            class="content-panel"
            :style="contentPanelStyle"
          >
            <div class="panel-header">
              <div class="panel-title">
                <span class="panel-icon">{{ getStepIcon(currentStep.type) }}</span>
                <span class="panel-text">{{ getStepTypeText(currentStep.type) }}</span>
              </div>
              <div class="panel-tools">
                <button class="tool-btn" @click="pronounceContent" title="Read aloud">
                  🔊
                </button>
              </div>
            </div>

            <div class="panel-content">
              <div v-if="currentStep.type === 'explanation'" class="explanation-step">
                <div class="step-content" v-html="formatContent(currentStep.data?.content || '')"></div>
              </div>

              <div v-else-if="currentStep.type === 'example'" class="example-step">
                <div class="example-badge">
                  <span class="badge-icon">💡</span>
                  <span class="badge-text">Example</span>
                </div>
                <div class="step-content" v-html="formatContent(currentStep.data?.content || '')"></div>
              </div>

              <div v-else-if="currentStep.type === 'reading'" class="reading-step">
                <div class="reading-badge">
                  <span class="badge-icon">📖</span>
                  <span class="badge-text">Reading</span>
                </div>
                <div class="step-content" v-html="formatContent(currentStep.data?.content || '')"></div>
              </div>

              <div v-else-if="currentStep.type === 'vocabulary'" class="vocabulary-step">
                <div class="vocabulary-trigger">
                  <div class="trigger-icon">📚</div>
                  <h3>Vocabulary Learning</h3>
                  <p>Ready to learn new words and expand your vocabulary?</p>
                  <button @click="initializeVocabularyModal(currentStep)" class="btn btn-primary">
                    <span class="btn-icon">🚀</span>
                    Start Vocabulary
                  </button>
                </div>
              </div>

              <div v-else class="default-step">
                <div class="step-content" v-html="formatContent(currentStep.data?.content || 'Content loading...')"></div>
              </div>
            </div>

            <div class="panel-navigation">
              <button 
                @click="goPrevious" 
                :disabled="currentIndex === 0"
                class="btn btn-secondary"
              >
                <span class="btn-icon">⬅️</span>
                Previous
              </button>
              
              <div class="nav-spacer"></div>
              
              <button 
                @click="goNext"
                class="btn btn-primary"
              >
                <span class="btn-text">{{ isLastStep ? 'Complete' : 'Next' }}</span>
                <span class="btn-icon">{{ isLastStep ? '🎉' : '➡️' }}</span>
              </button>
            </div>
          </div>

          <div 
            v-if="showContentPanel && showInteractivePanel"
            class="resize-handle"
            :class="{
              'vertical-handle': !isVerticalLayout,
              'horizontal-handle': isVerticalLayout,
              'resizing': isResizing
            }"
            @mousedown="startResize"
            @touchstart="startResize"
            @dblclick="resetToDefault"
            @keydown="handleKeyboardResize"
            tabindex="0"
            role="separator"
            :aria-label="resizeAriaLabel"
          >
            <div class="resize-grip">
              <div class="grip-dots">
                <span class="grip-dot"></span>
                <span class="grip-dot"></span>
                <span class="grip-dot"></span>
              </div>
              <div v-if="showTooltip" class="resize-tooltip">
                {{ tooltipText }}
              </div>
            </div>
          </div>

          <div 
            v-if="showInteractivePanel"
            class="interactive-panel"
            :style="interactivePanelStyle"
          >
            <div class="panel-header">
              <div class="panel-title">
                <span class="panel-icon">⚡</span>
                <span class="panel-text">Interactive Exercise</span>
              </div>
              <div class="panel-tools">
                <button class="tool-btn" title="Hint">
                  💡
                </button>
              </div>
            </div>

            <div class="panel-content">
              <div v-if="currentStep.type === 'exercise' || currentStep.type === 'practice'">
                <div v-if="getCurrentExercise(currentStep)" class="exercise-container">
                  <div class="exercise-header">
                    <div class="exercise-badge">
                      <span class="badge-icon">✏️</span>
                      <span class="badge-text">Exercise {{ currentExerciseIndex + 1 }} of {{ getTotalExercises(currentStep) }}</span>
                    </div>
                  </div>
                  
                  <div class="exercise-content">
                    <h3 class="exercise-question">{{ getCurrentExercise(currentStep).question || getCurrentExercise(currentStep).title }}</h3>
                    
                    <div v-if="getCurrentExercise(currentStep).type === 'short-answer'" class="exercise-input-group">
                      <div class="input-wrapper">
                        <input 
                          v-model="userAnswer" 
                          type="text" 
                          placeholder="Type your answer here..."
                          class="exercise-input"
                          @keyup.enter="handleSubmit(userAnswer)"
                        />
                        <div class="input-decoration"></div>
                      </div>
                    </div>

                    <div v-else-if="getCurrentExercise(currentStep).type === 'multiple-choice'" class="exercise-options">
                      <div 
                        v-for="(option, index) in getCurrentExercise(currentStep).options" 
                        :key="index"
                        class="option-card"
                        :class="{ selected: userAnswer === index }"
                        @click="userAnswer = index"
                      >
                        <div class="option-marker">{{ String.fromCharCode(65 + index) }}</div>
                        <div class="option-text">{{ option }}</div>
                        <div class="option-indicator"></div>
                      </div>
                    </div>

                    <div v-else-if="getCurrentExercise(currentStep).type === 'true-false'" class="exercise-options">
                      <div 
                        class="option-card true-false"
                        :class="{ selected: userAnswer === 'true' }"
                        @click="userAnswer = 'true'"
                      >
                        <div class="option-marker">✓</div>
                        <div class="option-text">True</div>
                        <div class="option-indicator"></div>
                      </div>
                      <div 
                        class="option-card true-false"
                        :class="{ selected: userAnswer === 'false' }"
                        @click="userAnswer = 'false'"
                      >
                        <div class="option-marker">✗</div>
                        <div class="option-text">False</div>
                        <div class="option-indicator"></div>
                      </div>
                    </div>

                    <div v-else-if="getCurrentExercise(currentStep).type === 'fill-blank'" class="fill-blank-exercise">
                      <div class="template-display" v-html="getFormattedFillBlankTemplate(getCurrentExercise(currentStep))"></div>
                      <div class="blank-inputs">
                        <div 
                          v-for="(blank, index) in fillBlankAnswers" 
                          :key="index"
                          class="blank-input-group"
                        >
                          <label class="blank-label">Blank {{ index + 1 }}</label>
                          <input 
                            v-model="fillBlankAnswers[index]"
                            type="text"
                            :placeholder="`Answer for blank ${index + 1}`"
                            class="blank-input"
                          />
                        </div>
                      </div>
                    </div>

                    <div v-else class="exercise-input-group">
                      <div class="input-wrapper">
                        <input 
                          v-model="userAnswer" 
                          type="text" 
                          placeholder="Type your answer here..."
                          class="exercise-input"
                          @keyup.enter="handleSubmit(userAnswer)"
                        />
                        <div class="input-decoration"></div>
                      </div>
                    </div>
                  </div>

                  <div class="exercise-submit">
                    <button 
                      @click="handleSubmit(userAnswer)"
                      :disabled="!canSubmitAnswer(getCurrentExercise(currentStep))"
                      class="btn btn-primary btn-submit"
                    >
                      <span class="btn-icon">🎯</span>
                      <span class="btn-text">Submit Answer</span>
                      <div class="btn-shine"></div>
                    </button>
                  </div>

                  <div 
                    v-if="confirmation" 
                    class="exercise-feedback" 
                    :class="{ 
                      correct: answerWasCorrect, 
                      incorrect: !answerWasCorrect,
                      'fade-in': confirmation
                    }"
                  >
                    <div class="feedback-icon">
                      <span v-if="answerWasCorrect">🎉</span>
                      <span v-else>💭</span>
                    </div>
                    <div class="feedback-content">
                      <p class="feedback-text">{{ confirmation }}</p>
                    </div>
                  </div>

                  <div class="exercise-navigation">
                    <button 
                      v-if="!isLastExercise(currentStep)"
                      @click="goToNextExercise(currentStep, goNext)"
                      class="btn btn-primary"
                    >
                      <span class="btn-text">Next Exercise</span>
                      <span class="btn-icon">➡️</span>
                    </button>
                    <button 
                      v-else
                      @click="goNext"
                      class="btn btn-success"
                    >
                      <span class="btn-text">Complete Exercises</span>
                      <span class="btn-icon">🎉</span>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else-if="currentStep.type === 'quiz'">
                <div v-if="getCurrentQuiz(currentStep)" class="quiz-container">
                  <div class="quiz-header">
                    <div class="quiz-badge">
                      <span class="badge-icon">🧩</span>
                      <span class="badge-text">Quiz {{ currentQuizIndex + 1 }} of {{ getTotalQuizzes(currentStep) }}</span>
                    </div>
                  </div>
                  
                  <div class="quiz-content">
                    <h3 class="quiz-question">{{ getCurrentQuiz(currentStep).question }}</h3>
                    
                    <div class="quiz-options">
                      <div 
                        v-for="(option, index) in getCurrentQuiz(currentStep).options" 
                        :key="index"
                        class="option-card"
                        :class="{ selected: userAnswer === index }"
                        @click="userAnswer = index"
                      >
                        <div class="option-marker">{{ String.fromCharCode(65 + index) }}</div>
                        <div class="option-text">{{ option }}</div>
                        <div class="option-indicator"></div>
                      </div>
                    </div>
                  </div>

                  <div class="quiz-submit">
                    <button 
                      @click="handleSubmit(userAnswer)"
                      :disabled="userAnswer === null || userAnswer === undefined"
                      class="btn btn-primary btn-submit"
                    >
                      <span class="btn-icon">🎯</span>
                      <span class="btn-text">Submit Answer</span>
                      <div class="btn-shine"></div>
                    </button>
                  </div>

                  <div 
                    v-if="confirmation" 
                    class="quiz-feedback" 
                    :class="{ 
                      correct: answerWasCorrect, 
                      incorrect: !answerWasCorrect,
                      'fade-in': confirmation
                    }"
                  >
                    <div class="feedback-icon">
                      <span v-if="answerWasCorrect">🎉</span>
                      <span v-else>💭</span>
                    </div>
                    <div class="feedback-content">
                      <p class="feedback-text">{{ confirmation }}</p>
                    </div>
                  </div>

                  <div class="quiz-navigation">
                    <button 
                      v-if="!isLastQuiz(currentStep)"
                      @click="goToNextQuiz(currentStep, goNext)"
                      class="btn btn-primary"
                    >
                      <span class="btn-text">Next Question</span>
                      <span class="btn-icon">➡️</span>
                    </button>
                    <button 
                      v-else
                      @click="goNext"
                      class="btn btn-success"
                    >
                      <span class="btn-text">Complete Quiz</span>
                      <span class="btn-icon">🎉</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="lessonCompleted" class="completion-screen">
      <div class="completion-background">
        <div class="celebration-particles">
          <div class="particle" v-for="i in 20" :key="i"></div>
        </div>
      </div>
      
      <div class="completion-content">
        <div class="completion-header">
          <div class="medal-container">
            <div class="medal-glow"></div>
            <div class="medal">{{ getMedalIcon() }}</div>
          </div>
          <h1 class="completion-title">🎉 Lesson Complete!</h1>
          <p class="completion-subtitle">{{ medalLabel }}</p>
        </div>

        <div class="completion-stats">
          <div class="stat-card large">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <span class="stat-value">{{ readableTime }}</span>
              <span class="stat-label">Time Spent</span>
            </div>
          </div>
          
          <div class="stat-card large">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <span class="stat-value">{{ stars }}</span>
              <span class="stat-label">Stars Earned</span>
            </div>
          </div>
          
          <div class="stat-card large">
            <div class="stat-icon">💯</div>
            <div class="stat-content">
              <span class="stat-value">{{ earnedPoints }}</span>
              <span class="stat-label">Points</span>
            </div>
          </div>
          
          <div class="stat-card large">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <span class="stat-value">{{ Math.max(0, 100 - mistakeCount * 10) }}%</span>
              <span class="stat-label">Accuracy</span>
            </div>
          </div>
        </div>

        <div class="completion-actions">
          <button @click="handleReturnToCatalogue" class="btn btn-primary btn-hero">
            <span class="btn-icon">📚</span>
            <span class="btn-text">Continue Learning</span>
            <div class="btn-glow"></div>
          </button>
          
          <button @click="handleGoToHomework" class="btn btn-secondary">
            <span class="btn-icon">📝</span>
            Practice & Homework
          </button>
          
          <button @click="shareResult" class="btn btn-ghost">
            <span class="btn-icon">🔗</span>
            Share Progress
          </button>
        </div>
      </div>
    </div>

    <button
      v-if="started && !lessonCompleted"
      class="floating-ai-btn"
      @click="toggleFloatingAI"
      :class="{ active: showFloatingAI }"
      title="AI Assistant"
    >
      <div class="ai-pulse"></div>
      <span class="ai-emoji">🤖</span>
    </button>

    <FloatingAIAssistant
      v-if="showFloatingAI && started && !lessonCompleted"
      :usage="aiUsage"
      :quick-suggestions="quickSuggestions"
      :ai-chat-history="aiChatHistory"
      :ai-is-loading="aiIsLoading"
      :floating-a-i-input="floatingAIInput"
      @close="closeFloatingAI"
      @send-message="handleFloatingAIMessage"
      @ask-ai="askAI"
      @clear-chat="handleClearAIChat"
    />

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

    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

// Import the actual composables from the correct path
import { useLessonOrchestrator } from '@/composables/useLessonOrchestrator'
import { useExercises } from '@/composables/useExercises'
import { useVocabulary } from '@/composables/useVocabulary'
import { useExplanation } from '@/composables/useExplanation'
import { usePaymentValidation } from '@/composables/usePaymentValidation'
import { useSound } from '@/composables/useSound'

// Import components (removed AIHelpPanel)
import FloatingAIAssistant from '@/components/lesson/FloatingAIAssistant.vue'

export default {
  name: 'LessonPage',

  components: {
    FloatingAIAssistant
  },

  setup() {
    const router = useRouter()

    // ==========================================
    // COMPOSABLES - Using the actual composables
    // ==========================================
    const {
      // Core lesson state
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
      getStepIcon,
      getStepTypeText,
      getMedalIcon,
      formatContent,
      getLocalized,
      initializeLesson,
      cleanup
    } = useLessonOrchestrator()

    const {
      // Exercise state
      currentExerciseIndex,
      currentQuizIndex,
      userAnswer,
      confirmation,
      answerWasCorrect,
      currentHint,
      smartHint,
      fillBlankAnswers,
      matchingPairs,
      selectedMatchingItem,
      orderingItems,
      dragDropPlacements,
      availableDragItems,
      dropZones,
      
      // Methods
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      isLastExercise,
      isLastQuiz,
      goToNextExercise,
      goToNextQuiz,
      initializeCurrentExerciseData,
      canSubmitAnswer,
      resetExerciseState,
      resetExerciseAnswers,
      updateFillBlankAnswer,
      getCurrentExerciseType,
      getFormattedFillBlankTemplate,
      validateCurrentAnswer,
      validateQuizAnswer,
      getCorrectAnswerDisplay,
      getRandomSuccessMessage
    } = useExercises()

    const {
      // Vocabulary state
      vocabularyModal,
      cardAnimation,
      currentVocabWord,
      vocabProgress,
      isLastVocabWord,
      
      // Methods
      initializeVocabularyModal,
      showVocabDefinition,
      hideVocabDefinition,
      markWordAsLearned,
      nextVocabWord,
      previousVocabWord,
      jumpToVocabWord,
      skipVocabularyModal,
      restartVocabulary,
      extractWordProperty
    } = useVocabulary()

    const {
      // AI state
      aiChatHistory,
      aiChatInput,
      aiSuggestions,
      aiIsLoading,
      showFloatingAI,
      floatingAIInput,
      quickSuggestions,
      aiUsage,
      progressInsight,
      
      // Methods
      sendAIMessage,
      sendFloatingAIMessage,
      askAI,
      generateAISuggestions,
      toggleFloatingAI,
      closeFloatingAI
    } = useExplanation()

    const {
      // Payment state
      showPaywallModal,
      userStatus,
      isPremiumUser,
      
      // Methods
      validateLessonAccess,
      closePaywallModal
    } = usePaymentValidation()

    const {
      // Sound state
      isPlaying,
      speechSupported,
      
      // Methods
      initializeSpeech,
      pronounceWord
    } = useSound()

    // ==========================================
    // LOCAL STATE
    // ==========================================
    const isResizing = ref(false)
    const leftPanelWidth = ref(50)
    const showTooltip = ref(false)
    const resizeStartInfo = ref(null)
    const confettiCanvas = ref(null)
    const notifications = ref([])

    // Problem report state
    const showProblemReportModal = ref(false)
    const problemType = ref('content')
    const problemDescription = ref('')

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================
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

    const isVerticalLayout = computed(() => {
      return window.innerWidth <= 1024
    })

    const contentPanelStyle = computed(() => {
      if (!showInteractivePanel.value) {
        return { flex: '1' }
      }
      
      if (isVerticalLayout.value) {
        return {
          flex: `0 0 ${leftPanelWidth.value}%`,
          minHeight: '300px',
          maxHeight: leftPanelWidth.value >= 75 ? '75%' : 'none'
        }
      }
      
      return {
        flex: `0 0 ${leftPanelWidth.value}%`,
        minWidth: '400px',
        maxWidth: leftPanelWidth.value >= 75 ? '75%' : 'none'
      }
    })

    const interactivePanelStyle = computed(() => {
      if (!showContentPanel.value) {
        return { flex: '1' }
      }
      
      if (isVerticalLayout.value) {
        return {
          flex: `0 0 ${100 - leftPanelWidth.value}%`,
          minHeight: '300px',
          maxHeight: (100 - leftPanelWidth.value) >= 75 ? '75%' : 'none'
        }
      }
      
      return {
        flex: `0 0 ${100 - leftPanelWidth.value}%`,
        minWidth: '400px',
        maxWidth: (100 - leftPanelWidth.value) >= 75 ? '75%' : 'none'
      }
    })

    const resizeAriaLabel = computed(() => {
      const direction = isVerticalLayout.value ? 'vertical' : 'horizontal'
      return `Resize panels ${direction}ly. Current split: ${Math.round(leftPanelWidth.value)}% | ${Math.round(100 - leftPanelWidth.value)}%`
    })

    const tooltipText = computed(() => {
      return `${Math.round(leftPanelWidth.value)}% | ${Math.round(100 - leftPanelWidth.value)}%`
    })

    // Create user progress object for AI context
    const userProgress = computed(() => ({
      currentStep: currentIndex.value,
      totalSteps: steps.value.length,
      completedSteps: Array.from({ length: currentIndex.value }, (_, i) => i),
      stars: stars.value,
      mistakes: mistakeCount.value,
      points: earnedPoints.value,
      accuracy: Math.max(0, 100 - mistakeCount.value * 10),
      timeSpent: elapsedSeconds.value
    }))

    // ==========================================
    // SPLIT SCREEN METHODS
    // ==========================================
    const startResize = (event) => {
      event.preventDefault()
      
      isResizing.value = true
      showTooltip.value = true
      
      const isTouch = event.type === 'touchstart'
      const clientX = isTouch ? event.touches[0].clientX : event.clientX
      const clientY = isTouch ? event.touches[0].clientY : event.clientY
      
      resizeStartInfo.value = {
        startX: clientX,
        startY: clientY,
        startLeftWidth: leftPanelWidth.value,
        isVertical: isVerticalLayout.value
      }
      
      const moveEvent = isTouch ? 'touchmove' : 'mousemove'
      const endEvent = isTouch ? 'touchend' : 'mouseup'
      
      document.addEventListener(moveEvent, handleResize, { passive: false })
      document.addEventListener(endEvent, stopResize)
      
      document.body.style.userSelect = 'none'
      document.body.style.cursor = isVerticalLayout.value ? 'row-resize' : 'col-resize'
    }

    const handleResize = (event) => {
      if (!isResizing.value || !resizeStartInfo.value) return
      
      event.preventDefault()
      
      const isTouch = event.type === 'touchmove'
      const clientX = isTouch ? event.touches[0].clientX : event.clientX
      const clientY = isTouch ? event.touches[0].clientY : event.clientY
      
      const container = event.target.closest('.split-content')
      if (!container) return
      
      let delta = 0
      let containerSize = 0
      
      if (resizeStartInfo.value.isVertical) {
        delta = clientY - resizeStartInfo.value.startY
        containerSize = container.offsetHeight
      } else {
        delta = clientX - resizeStartInfo.value.startX
        containerSize = container.offsetWidth
      }
      
      const deltaPercentage = (delta / containerSize) * 100
      
      let newLeftWidth = resizeStartInfo.value.startLeftWidth + deltaPercentage
      newLeftWidth = Math.max(25, Math.min(75, newLeftWidth))
      
      leftPanelWidth.value = newLeftWidth
    }

    const stopResize = () => {
      if (!isResizing.value) return
      
      isResizing.value = false
      showTooltip.value = false
      resizeStartInfo.value = null
      
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
      document.removeEventListener('touchmove', handleResize)
      document.removeEventListener('touchend', stopResize)
      
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      
      saveLayoutPreferences()
    }

    const handleKeyboardResize = (event) => {
      const step = 5
      let newLeftWidth = leftPanelWidth.value
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newLeftWidth = Math.max(25, leftPanelWidth.value - step)
          break
        case 'ArrowRight':
          event.preventDefault()
          newLeftWidth = Math.min(75, leftPanelWidth.value + step)
          break
        case 'ArrowUp':
          if (isVerticalLayout.value) {
            event.preventDefault()
            newLeftWidth = Math.max(25, leftPanelWidth.value - step)
          }
          break
        case 'ArrowDown':
          if (isVerticalLayout.value) {
            event.preventDefault()
            newLeftWidth = Math.min(75, leftPanelWidth.value + step)
          }
          break
        case 'Home':
          event.preventDefault()
          newLeftWidth = 25
          break
        case 'End':
          event.preventDefault()
          newLeftWidth = 75
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          newLeftWidth = 50
          break
        default:
          return
      }
      
      leftPanelWidth.value = newLeftWidth
      saveLayoutPreferences()
    }

    const resetToDefault = () => {
      leftPanelWidth.value = 50
      
      try {
        localStorage.removeItem('lessonLayoutPrefs')
      } catch (error) {
        console.warn('Could not remove layout preferences:', error)
      }
    }

    const saveLayoutPreferences = () => {
      try {
        localStorage.setItem('lessonLayoutPrefs', JSON.stringify({
          leftWidth: leftPanelWidth.value,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.warn('Could not save layout preferences:', error)
      }
    }

    const loadLayoutPreferences = () => {
      try {
        const saved = localStorage.getItem('lessonLayoutPrefs')
        if (saved) {
          const { leftWidth, timestamp } = JSON.parse(saved)
          
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
          if (timestamp && timestamp > thirtyDaysAgo) {
            leftPanelWidth.value = Math.max(25, Math.min(75, leftWidth || 50))
          } else {
            localStorage.removeItem('lessonLayoutPrefs')
          }
        }
      } catch (error) {
        console.warn('Could not load layout preferences:', error)
      }
    }

    // ==========================================
    // NAVIGATION METHODS
    // ==========================================
    const handleReturnToCatalogue = () => {
      saveProgress()
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

    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    const handleSubmit = (answer) => {
      console.log('📝 Submitting answer:', answer)
      
      let isCorrect = false
      let feedbackMessage = ''
      
      // Validate answer based on current step type
      if (currentStep.value.type === 'exercise' || currentStep.value.type === 'practice') {
        const exercise = getCurrentExercise(currentStep.value)
        if (exercise) {
          isCorrect = validateCurrentAnswer(exercise)
          feedbackMessage = isCorrect ? 
            getRandomSuccessMessage() : 
            `Incorrect. The correct answer is: ${getCorrectAnswerDisplay(exercise)}`
        }
      } else if (currentStep.value.type === 'quiz') {
        const quiz = getCurrentQuiz(currentStep.value)
        if (quiz) {
          isCorrect = validateQuizAnswer(quiz)
          feedbackMessage = isCorrect ? 
            '✅ Correct!' : 
            `❌ Incorrect. The correct answer is: ${getCorrectAnswerDisplay(quiz)}`
        }
      }
      
      // Update state
      answerWasCorrect.value = isCorrect
      confirmation.value = feedbackMessage
      
      // Update progress
      if (isCorrect) {
        stars.value++
        earnedPoints.value += 10
        addNotification('Great job! ⭐ +1 star earned', 'success')
      } else {
        mistakeCount.value++
        mistakeLog.value.push({
          step: currentIndex.value,
          question: getCurrentExercise(currentStep.value)?.question || getCurrentQuiz(currentStep.value)?.question || '',
          userAnswer: answer,
          correctAnswer: getCorrectAnswerDisplay(getCurrentExercise(currentStep.value) || getCurrentQuiz(currentStep.value)),
          timestamp: new Date().toISOString()
        })
      }
      
      // Auto-advance after a delay if correct
      if (isCorrect) {
        setTimeout(() => {
          if (currentStep.value.type === 'exercise' || currentStep.value.type === 'practice') {
            if (!isLastExercise(currentStep.value)) {
              goToNextExercise(currentStep.value, goNext)
            } else {
              goNext()
            }
          } else if (currentStep.value.type === 'quiz') {
            if (!isLastQuiz(currentStep.value)) {
              goToNextQuiz(currentStep.value, goNext)
            } else {
              goNext()
            }
          }
        }, 2000)
      }
    }

    // ==========================================
    // AI METHODS WRAPPER (using composable methods)
    // ==========================================
    const handleAIMessage = (message) => {
      if (typeof sendAIMessage === 'function') {
        sendAIMessage(lesson.value, userProgress.value, currentStep.value)
      } else {
        console.warn('AI service not available')
      }
    }

    const handleFloatingAIMessage = (message) => {
      if (typeof sendFloatingAIMessage === 'function') {
        sendFloatingAIMessage(lesson.value, userProgress.value, currentStep.value)
      } else {
        console.warn('AI service not available')
      }
    }

    const handleClearAIChat = () => {
      if (typeof clearAIChat === 'function') {
        clearAIChat()
      } else {
        aiChatHistory.value = []
      }
    }

    // ==========================================
    // PROBLEM REPORTING
    // ==========================================
    const openProblemReportModal = () => {
      showProblemReportModal.value = true
    }

    const closeProblemReportModal = () => {
      showProblemReportModal.value = false
      problemType.value = 'content'
      problemDescription.value = ''
    }

    const submitProblemReport = () => {
      console.log('📋 Problem report submitted:', {
        type: problemType.value,
        description: problemDescription.value,
        lessonId: lesson.value?._id,
        currentStep: currentIndex.value + 1,
        totalSteps: steps.value?.length || 0
      })
      
      addNotification('Problem report submitted successfully!', 'success')
      closeProblemReportModal()
    }

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
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
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        closeNotification(notification.id)
      }, 5000)
    }

    // ==========================================
    // ADDITIONAL METHODS
    // ==========================================
    const pronounceContent = () => {
      if (currentStep.value?.data?.content) {
        pronounceWord(currentStep.value.data.content.replace(/<[^>]*>/g, ''))
      }
    }

    const shareResult = () => {
      const shareData = {
        title: `I completed "${getLocalized(lesson.value.lessonName)}"!`,
        text: `Just finished this lesson with ${stars.value} stars and ${earnedPoints.value} points!`,
        url: window.location.href
      }
      
      if (navigator.share) {
        navigator.share(shareData)
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.title} ${shareData.text} ${shareData.url}`)
        addNotification('Link copied to clipboard!', 'success')
      }
    }

    // ==========================================
    // CONFETTI ANIMATION
    // ==========================================
    const launchConfetti = () => {
      if (!confettiCanvas.value) return
      
      const canvas = confettiCanvas.value
      const ctx = canvas.getContext('2d')
      
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      const particles = []
      const colors = ['#8b5cf6', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185']
      
      // Create particles
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15
        })
      }
      
      // Animation loop
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        particles.forEach((particle, index) => {
          // Update position
          particle.x += particle.vx
          particle.y += particle.vy
          particle.vy += 0.2 // gravity
          particle.rotation += particle.rotationSpeed
          
          // Draw particle
          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation * Math.PI / 180)
          ctx.fillStyle = particle.color
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
          ctx.restore()
          
          // Remove particles that are off screen
          if (particle.y > canvas.height + 10) {
            particles.splice(index, 1)
          }
        })
        
        if (particles.length > 0) {
          requestAnimationFrame(animate)
        }
      }
      
      animate()
    }

    // ==========================================
    // LIFECYCLE HOOKS
    // ==========================================
    onMounted(async () => {
      console.log('🔧 LessonPage mounted')
      
      // Initialize services
      initializeSpeech()
      loadLayoutPreferences()
      
      // Initialize lesson
      await initializeLesson()
      
      // Set up window resize listener
      window.addEventListener('resize', () => {
        nextTick(() => {
          // Force re-evaluation of computed properties
        })
      })
      
      // Launch confetti if lesson completed
      if (lessonCompleted.value) {
        setTimeout(launchConfetti, 500)
      }
    })

    onUnmounted(() => {
      console.log('🧹 LessonPage unmounting')
      
      if (isResizing.value) {
        stopResize()
      }
      
      cleanup()
    })

    // ==========================================
    // RETURN - All state and methods for template
    // ==========================================
    return {
      // Core lesson state
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
      userProgress,
      
      // Computed
      currentStep,
      isInteractiveStep,
      progressPercentage,
      formattedTime,
      readableTime,
      isLastStep,
      estimatedTime,
      
      // Exercise state
      currentExerciseIndex,
      currentQuizIndex,
      userAnswer,
      confirmation,
      answerWasCorrect,
      currentHint,
      smartHint,
      fillBlankAnswers,
      matchingPairs,
      selectedMatchingItem,
      orderingItems,
      dragDropPlacements,
      availableDragItems,
      dropZones,
      
      // Vocabulary state
      vocabularyModal,
      cardAnimation,
      currentVocabWord,
      vocabProgress,
      isLastVocabWord,
      
      // AI state
      aiChatHistory,
      aiChatInput,
      aiSuggestions,
      aiIsLoading,
      showFloatingAI,
      floatingAIInput,
      quickSuggestions,
      aiUsage,
      progressInsight,
      
      // Payment state
      showPaywallModal,
      userStatus,
      isPremiumUser,
      
      // Sound state
      isPlaying,
      speechSupported,
      
      // Local state
      isResizing,
      leftPanelWidth,
      showTooltip,
      confettiCanvas,
      notifications,
      showProblemReportModal,
      problemType,
      problemDescription,

      // Computed properties
      showContentPanel,
      showInteractivePanel,
      isVerticalLayout,
      contentPanelStyle,
      interactivePanelStyle,
      resizeAriaLabel,
      tooltipText,

      // Core methods
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
      getStepIcon,
      getStepTypeText,
      getMedalIcon,
      formatContent,
      getLocalized,
      initializeLesson,
      cleanup,

      // Exercise methods
      getCurrentExercise,
      getCurrentQuiz,
      getTotalExercises,
      getTotalQuizzes,
      isLastExercise,
      isLastQuiz,
      goToNextExercise,
      goToNextQuiz,
      initializeCurrentExerciseData,
      canSubmitAnswer,
      resetExerciseState,
      resetExerciseAnswers,
      updateFillBlankAnswer,
      getCurrentExerciseType,
      getFormattedFillBlankTemplate,
      validateCurrentAnswer,
      validateQuizAnswer,
      getCorrectAnswerDisplay,
      getRandomSuccessMessage,

      // Vocabulary methods
      initializeVocabularyModal,
      showVocabDefinition,
      hideVocabDefinition,
      markWordAsLearned,
      nextVocabWord,
      previousVocabWord,
      jumpToVocabWord,
      skipVocabularyModal,
      restartVocabulary,
      extractWordProperty,

      // AI methods (wrapped to avoid conflicts)
      handleAIMessage,
      handleFloatingAIMessage,
      handleClearAIChat,
      
      // AI methods from composable (aliased)
      sendAIMessage,
      sendFloatingAIMessage,
      askAI,
      generateAISuggestions,
      toggleFloatingAI,
      closeFloatingAI,

      // Payment methods
      validateLessonAccess,
      closePaywallModal,

      // Sound methods
      initializeSpeech,
      pronounceWord,
      pronounceContent,

      // Split screen methods
      startResize,
      handleResize,
      stopResize,
      handleKeyboardResize,
      resetToDefault,
      saveLayoutPreferences,
      loadLayoutPreferences,

      // Event handlers
      handleReturnToCatalogue,
      handleGoToHomework,
      handleSubmit,
      openProblemReportModal,
      closeProblemReportModal,
      submitProblemReport,
      closeNotification,
      addNotification,
      launchConfetti,
      shareResult
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/LessonPage.css";
</style>