<template>
  <div class="content-panel-wrapper">
    <div class="content-step-header">
      <h3 class="content-step-title">
        <span class="content-step-number">{{ currentIndex + 1 }}</span>
        <span class="content-step-type-icon">{{ getStepIcon(currentStep?.type) }}</span>
        <span class="content-step-type-text">{{ getStepTypeText(currentStep?.type) }}</span>
        
        <!-- Exercise/quiz counter for interactive steps -->
        <span v-if="isInteractiveStep && ['exercise', 'practice'].includes(currentStep?.type)" class="content-exercise-counter">
          ({{ exerciseIndex + 1 }}/{{ totalExercises || 1 }})
        </span>
        <span v-else-if="isInteractiveStep && currentStep?.type === 'quiz'" class="content-quiz-counter">
          ({{ quizIndex + 1 }}/{{ totalQuizzes || 1 }})
        </span>
      </h3>
    </div>
    
    <!-- Scrollable Content Area -->
    <div class="content-step-container">
      <div class="content-step-content">
        <!-- FOR INTERACTIVE STEPS: Show ONLY the question, no instructions -->
        <div v-if="isInteractiveStep" class="interactive-content">
          
          <!-- Exercise Content - ONLY the question -->
          <div v-if="['exercise', 'practice'].includes(currentStep?.type)" class="current-exercise-content">
            <div class="exercise-question-display">
              <div class="clean-question">{{ getStepContent(currentStep) }}</div>
              
              <!-- Show exercise type badge ONLY if not default type -->
              <div v-if="currentExercise?.type && currentExercise.type !== 'short-answer'" class="exercise-type-info">
                <span class="type-badge">{{ getExerciseTypeName(currentExercise?.type) }}</span>
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

        <!-- FOR NON-INTERACTIVE STEPS: Show only explanation content -->
        <div v-else-if="['explanation', 'example', 'reading'].includes(currentStep?.type)" class="text-content">
          <div class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
        </div>

        <!-- Vocabulary Step -->
        <div v-else-if="currentStep?.type === 'vocabulary'" class="vocabulary-content enhanced">
          
          <!-- Show modal trigger if not completed -->
          <div v-if="!currentStep?.data?.modalCompleted" class="vocabulary-modal-trigger">
            <div class="trigger-card">
              <div class="trigger-icon">📚</div>
              <h3>Изучение словаря</h3>
              <p>{{ Array.isArray(currentStep?.data) ? currentStep.data.length : 1 }} новых слов ждут вас!</p>
              <button @click="$emit('init-vocabulary')" class="start-vocabulary-btn">
                🚀 Начать изучение
              </button>
            </div>
          </div>

          <!-- Show list view after modal completion -->
          <div v-else class="vocabulary-list-view">
            <div class="vocabulary-header">
              <h3>📖 Изученные слова</h3>
              <button @click="$emit('init-vocabulary')" class="review-btn">
                🔄 Повторить
              </button>
            </div>
            
            <div class="vocabulary-list">
              <div 
                v-for="(vocab, vocabIndex) in (currentStep?.data?.allWords || currentStep?.data || [])" 
                :key="vocab?.id || `vocab-list-${vocabIndex}`" 
                class="vocabulary-item enhanced"
                :class="{ learned: vocab?.learned }"
              >
                <div class="vocab-item-header">
                  <div class="vocab-term">
                    {{ vocab?.term || 'Term' }}
                    <button 
                      v-if="vocab?.term"
                      @click="$emit('pronounce', vocab.term)"
                      class="mini-pronunciation-btn"
                      title="Произношение"
                    >
                      🔊
                    </button>
                  </div>
                  <div v-if="vocab?.learned" class="learned-badge">✅</div>
                </div>
                
                <div class="vocab-definition">{{ vocab?.definition || 'Definition' }}</div>
                
                <div v-if="vocab?.example" class="vocab-example">
                  <strong>Пример:</strong> {{ vocab.example }}
                </div>
                
                <div v-if="vocab?.pronunciation" class="vocab-pronunciation">
                  Произношение: /{{ vocab.pronunciation }}/
                </div>
              </div>
            </div>
            
            <!-- Summary Stats -->
            <div class="vocabulary-summary">
              <div class="summary-stat">
                <span class="summary-number">{{ ((currentStep?.data?.allWords || []).filter(w => w?.learned) || []).length }}</span>
                <span class="summary-label">изучено</span>
              </div>
              <div class="summary-stat">
                <span class="summary-number">{{ (currentStep?.data?.allWords || []).length }}</span>
                <span class="summary-label">всего</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Video/Audio Step -->
        <div v-else-if="['video', 'audio'].includes(currentStep?.type)" class="media-content">
          <div class="media-placeholder">
            <div class="media-icon">{{ currentStep?.type === 'video' ? '🎬' : '🎵' }}</div>
            <h4>{{ currentStep?.type === 'video' ? 'Видео урок' : 'Аудио урок' }}</h4>
            <p>{{ currentStep?.data?.description || 'Мультимедиа контент' }}</p>
            <div class="media-url">{{ currentStep?.data?.url || 'URL недоступен' }}</div>
          </div>
        </div>

        <!-- Default content for other step types -->
        <div v-else class="default-content">
          <div class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
        </div>
      </div>
    </div>
    
    <!-- Content Navigation -->
    <div class="content-navigation">
      <button v-if="currentIndex > 0" class="content-nav-btn content-prev-btn" @click="$emit('previous')">
        ⬅️ Назад
      </button>
      <button 
        v-if="!isInteractiveStep" 
        class="content-nav-btn content-next-btn" 
        @click="$emit('next')"
      >
        {{ isLastStep ? '🏁 Завершить' : '➡️ Далее' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContentPanel',
  props: {
    currentStep: {
      type: Object,
      required: true
    },
    currentIndex: {
      type: Number,
      required: true
    },
    isInteractiveStep: {
      type: Boolean,
      default: false
    },
    currentExercise: {
      type: Object,
      default: null
    },
    currentQuiz: {
      type: Object,
      default: null
    },
    exerciseIndex: {
      type: Number,
      default: 0
    },
    quizIndex: {
      type: Number,
      default: 0
    },
    totalExercises: {
      type: Number,
      default: 0
    },
    totalQuizzes: {
      type: Number,
      default: 0
    },
    isLastStep: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'init-vocabulary',
    'pronounce',
    'next',
    'previous'
  ],
  methods: {
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

    getStepContent(step) {
      if (!step || !step.data) {
        return 'Контент недоступен';
      }
      
      // For interactive steps, show ONLY the question
      if (['exercise', 'practice'].includes(step.type)) {
        if (this.currentExercise && this.currentExercise.question) {
          return this.getLocalized(this.currentExercise.question);
        }
        return 'Упражнение загружается...';
      }
      
      if (step.type === 'quiz') {
        if (this.currentQuiz && this.currentQuiz.question) {
          return this.getLocalized(this.currentQuiz.question);
        }
        return 'Вопрос загружается...';
      }
      
      // For non-interactive steps, show only explanation content
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
        
        if (step.type === 'vocabulary') {
          if (Array.isArray(step.data) && step.data.length > 0) {
            return `Изучение словаря: ${step.data.length} новых слов`;
          }
        }
        
        return `Контент для шага "${step.type}"`;
        
      } catch (error) {
        console.error('Error in getStepContent:', error);
        return 'Ошибка загрузки контента';
      }
    },

    formatContent(content) {
      if (!content) return 'Контент недоступен';
      return content.replace(/\n/g, '<br>');
    },

    getLocalized(field) {
      if (typeof field === 'string') return field;
      return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim();
    }
  }
}
</script>

<style scoped>
/* Use different class names to avoid conflicts with parent CSS */
.content-panel-wrapper {
  background: white;
  padding: 0 !important;
  margin: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.content-step-header {
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  background: white;
  box-sizing: border-box;
}

.content-step-title {
  font-size: 1.4rem !important;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-weight: 600;
}

.content-step-number {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.content-step-type-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.content-step-type-text {
  font-weight: 700;
  color: #1e293b;
  font-size: 1.2rem !important;
}

.content-exercise-counter,
.content-quiz-counter {
  font-size: 1.1rem !important;
  color: #666;
  font-weight: 500;
  margin-left: 0.5rem;
}

/* Scrollable content container - this is key for proper scrolling */
.content-step-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* Important for flex child to scroll properly */
  width: 100%;
  box-sizing: border-box;
}

.content-step-content {
  padding: 32px 28px;
  animation: contentFadeIn 0.3s ease-out;
  box-sizing: border-box;
  width: 100%;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Make text bigger as requested */
.clean-question {
  font-size: 1.6rem !important;
  line-height: 1.6;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  font-weight: 600;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
}

/* Interactive content styling */
.interactive-content {
  padding: 0;
  margin: 0;
  width: 100%;
}

.current-exercise-content,
.current-quiz-content {
  background: linear-gradient(135deg, #f8f9ff 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 2.5rem;
  border: 2px solid #e1e8ff;
  margin-top: 1rem;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.current-exercise-content::before,
.current-quiz-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 16px 16px 0 0;
}

.exercise-question-display,
.quiz-question-display {
  text-align: left;
  width: 100%;
}

/* Exercise type badge */
.exercise-type-info {
  margin-top: 1rem;
  text-align: center;
}

.type-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

/* Text Content - bigger text, no width limits */
.text-content {
  line-height: 1.8;
  width: 100%;
}

.content-text {
  font-size: 1.3rem !important;
  color: #374151;
  margin: 0;
  line-height: 1.8;
  font-weight: 400;
  width: 100%;
  max-width: none !important; /* Remove any width limits */
  box-sizing: border-box;
}

/* Vocabulary Content */
.vocabulary-content.enhanced {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 28px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
}

.vocabulary-modal-trigger {
  text-align: center;
}

.trigger-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 48px 36px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  width: 100%;
  box-sizing: border-box;
}

.trigger-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
}

.trigger-card h3 {
  margin: 0 0 16px 0;
  font-size: 1.8rem !important;
  font-weight: 700;
}

.trigger-card p {
  margin: 0 0 28px 0;
  opacity: 0.9;
  font-size: 1.2rem !important;
}

.start-vocabulary-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 18px 36px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem !important;
  min-height: 52px;
}

.start-vocabulary-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.vocabulary-list-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.vocabulary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.vocabulary-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.5rem !important;
  font-weight: 700;
}

.review-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem !important;
  min-height: 48px;
}

.review-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
}

.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.vocabulary-item {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.vocabulary-item.enhanced {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.vocabulary-item.learned {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.vocabulary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vocab-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.vocab-item-header .vocab-term {
  font-size: 1.4rem !important;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-pronunciation-btn {
  background: #f1f5f9;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem !important;
  transition: all 0.2s ease;
}

.mini-pronunciation-btn:hover {
  background: #e2e8f0;
  transform: scale(1.1);
}

.learned-badge {
  color: #3b82f6;
  font-size: 1.4rem !important;
}

.vocabulary-item .vocab-definition {
  font-size: 1.2rem !important;
  color: #4b5563;
  margin-bottom: 12px;
  line-height: 1.6;
}

.vocabulary-item .vocab-example {
  font-size: 1.1rem !important;
  color: #6b7280;
  font-style: italic;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
  margin-top: 12px;
}

.vocabulary-item .vocab-pronunciation {
  font-size: 1rem !important;
  color: #9ca3af;
  margin-top: 8px;
}

.vocabulary-summary {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 24px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.summary-stat {
  text-align: center;
}

.summary-number {
  font-size: 1.8rem !important;
  font-weight: 700;
  color: #3b82f6;
  display: block;
}

.summary-label {
  font-size: 1rem !important;
  color: #64748b;
  margin-top: 6px;
  font-weight: 500;
}

/* Media Content */
.media-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
}

.media-placeholder {
  background: #f8fafc;
  padding: 48px;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  text-align: center;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}

.media-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
}

.media-placeholder h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 1.3rem !important;
  font-weight: 600;
}

.media-placeholder p {
  margin: 0 0 20px 0;
  color: #64748b;
  font-size: 1.1rem !important;
}

.media-url {
  font-size: 1rem !important;
  color: #9ca3af;
  font-family: monospace;
  background: white;
  padding: 12px;
  border-radius: 4px;
}

/* Default Content */
.default-content {
  line-height: 1.8;
  width: 100%;
}

/* Content Navigation */
.content-navigation {
  display: flex;
  gap: 16px;
  padding: 24px 28px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  background: white;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.content-nav-btn {
  padding: 16px 28px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 140px;
  min-height: 52px;
  font-size: 1.1rem !important;
}

.content-prev-btn {
  background: #f1f5f9;
  color: #64748b;
}

.content-prev-btn:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.content-next-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.content-next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

/* Custom scrollbar styling */
.content-step-container::-webkit-scrollbar {
  width: 8px;
}

.content-step-container::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.content-step-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.content-step-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-step-header {
    padding: 20px 24px;
  }

  .content-step-content {
    padding: 24px;
  }

  .content-step-title {
    font-size: 1.3rem !important;
    gap: 10px;
  }

  .content-step-number {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .clean-question {
    font-size: 1.4rem !important;
  }

  .content-text {
    font-size: 1.2rem !important;
  }

  .current-exercise-content,
  .current-quiz-content {
    padding: 2rem;
  }

  .content-navigation {
    flex-direction: column;
    gap: 12px;
    padding: 20px 24px;
  }

  .content-nav-btn {
    width: 100%;
    min-width: auto;
  }

  .vocabulary-content.enhanced {
    padding: 24px;
  }

  .trigger-card {
    padding: 36px 28px;
  }

  .vocabulary-summary {
    gap: 24px;
  }
}

@media (max-width: 480px) {
  .content-step-header {
    padding: 16px 20px;
  }

  .content-step-content {
    padding: 20px;
  }

  .content-step-title {
    font-size: 1.2rem !important;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .content-step-number {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .clean-question {
    font-size: 1.3rem !important;
  }

  .content-text {
    font-size: 1.1rem !important;
  }

  .current-exercise-content,
  .current-quiz-content {
    padding: 1.5rem;
  }

  .vocabulary-content.enhanced {
    padding: 20px;
  }

  .trigger-card {
    padding: 28px 20px;
  }

  .trigger-icon {
    font-size: 2.5rem;
  }

  .vocabulary-summary {
    flex-direction: column;
    gap: 20px;
  }

  .summary-number {
    font-size: 1.6rem !important;
  }

  .content-navigation {
    padding: 16px 20px;
  }
}

/* Focus states for accessibility */
.content-nav-btn:focus,
.start-vocabulary-btn:focus,
.review-btn:focus,
.mini-pronunciation-btn:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .current-exercise-content,
  .current-quiz-content,
  .vocabulary-item {
    border-width: 3px;
  }

  .content-step-number {
    border: 2px solid white;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .content-step-content {
    animation: none;
  }

  .vocabulary-item:hover,
  .content-nav-btn:hover,
  .start-vocabulary-btn:hover,
  .review-btn:hover {
    transform: none;
  }
}

/* Print styles */
@media print {
  .content-navigation,
  .start-vocabulary-btn,
  .review-btn,
  .mini-pronunciation-btn {
    display: none;
  }

  .content-panel-wrapper {
    box-shadow: none;
  }
}

/* Ensure no width constraints anywhere */
* {
  max-width: none !important;
}

.content-panel-wrapper,
.content-step-container,
.content-step-content,
.text-content,
.content-text {
  width: 100% !important;
  max-width: none !important;
}
</style>