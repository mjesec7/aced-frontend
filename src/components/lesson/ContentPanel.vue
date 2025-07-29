<template>
    <div class="content-panel">
      <div class="step-header">
        <h3 class="step-title">
          <span class="step-number">{{ currentIndex + 1 }}</span>
          <span class="step-type-icon">{{ getStepIcon(currentStep?.type) }}</span>
          <span class="step-type-text">{{ getStepTypeText(currentStep?.type) }}</span>
          
          <!-- Exercise/quiz counter for interactive steps -->
          <span v-if="isInteractiveStep && ['exercise', 'practice'].includes(currentStep?.type)" class="exercise-counter">
            ({{ exerciseIndex + 1 }}/{{ totalExercises || 1 }})
          </span>
          <span v-else-if="isInteractiveStep && currentStep?.type === 'quiz'" class="quiz-counter">
            ({{ quizIndex + 1 }}/{{ totalQuizzes || 1 }})
          </span>
        </h3>
      </div>
      
      <!-- Step content shows ONLY clean questions -->
      <div class="step-content">
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
  
        <!-- FOR NON-INTERACTIVE STEPS: Show regular content -->
        <div v-else-if="['explanation', 'example', 'reading'].includes(currentStep?.type)" class="text-content">
          <div class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
          
          <!-- AI Help for Explanations -->
          <div v-if="showExplanationHelp" class="explanation-help">
            <h4>🤖 Нужна помощь с пониманием?</h4>
            <div class="explanation-help-input">
              <input 
                :value="explanationQuestion"
                @input="updateExplanationQuestion"
                placeholder="Задайте вопрос об этом объяснении..."
                @keyup.enter="askExplanation"
              />
              <button @click="askExplanation" :disabled="!explanationQuestion?.trim()">
                Спросить AI
              </button>
            </div>
            <div v-if="explanationAIResponse" class="ai-response">
              <p>{{ explanationAIResponse }}</p>
            </div>
          </div>
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
      
      <!-- Content Navigation -->
      <div class="content-navigation">
        <button v-if="currentIndex > 0" class="nav-btn prev-btn" @click="$emit('previous')">
          ⬅️ Назад
        </button>
        <button 
          v-if="!isInteractiveStep" 
          class="nav-btn next-btn" 
          @click="$emit('next')"
        >
          {{ isLastStep ? '🏁 Завершить' : '➡️ Далее' }}
        </button>
        <button 
          v-if="['explanation', 'example', 'reading'].includes(currentStep?.type)"
          class="help-btn" 
          @click="$emit('toggle-explanation-help')"
          :class="{ active: showExplanationHelp }"
        >
          🤖 {{ showExplanationHelp ? 'Скрыть помощь' : 'AI помощь' }}
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
      showExplanationHelp: {
        type: Boolean,
        default: false
      },
      explanationQuestion: {
        type: String,
        default: ''
      },
      explanationAIResponse: {
        type: String,
        default: ''
      },
      isLoadingExplanation: {
        type: Boolean,
        default: false
      },
      isLastStep: {
        type: Boolean,
        default: false
      }
    },
    emits: [
      'toggle-explanation-help',
      'ask-explanation',
      'init-vocabulary',
      'pronounce',
      'next',
      'previous',
      'update:explanation-question'
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
  
      updateExplanationQuestion(event) {
        this.$emit('update:explanation-question', event.target.value);
      },
  
      askExplanation() {
        if (this.explanationQuestion?.trim()) {
          this.$emit('ask-explanation', this.explanationQuestion);
        }
      },
  
      getLocalized(field) {
        if (typeof field === 'string') return field;
        return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim();
      }
    }
  }
  </script>
  
  <style scoped>
/* ================================
   CONTENT PANEL - SCROLLABLE READING AREA
   Enhanced with perfect scrolling and readability
   ================================ */

/* ================================
   MAIN CONTENT PANEL CONTAINER
   ================================ */

   .content-panel {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  height: 100%;
  min-height: 0;
}

/* Add resize handle to content panel */
.content-panel::after {
  content: '';
  position: absolute;
  top: 0;
  right: -2px;
  width: 4px;
  height: 100%;
  background: #3b82f6;
  cursor: col-resize;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1000;
}

@media (max-width: 1023px) {
  .content-panel::after {
    top: auto;
    bottom: -2px;
    right: 0;
    width: 100%;
    height: 4px;
    cursor: row-resize;
  }
}

.content-panel:hover::after {
  opacity: 0.6;
}

.content-panel.resizing::after {
  opacity: 1;
}

/* ================================
   STEP HEADER - FIXED AT TOP
   ================================ */

.step-header {
  flex-shrink: 0;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.step-title {
  font-size: 1.3rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-weight: 600;
  line-height: 1.4;
}

.step-number {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.step-type-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.step-type-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.1rem;
}

.exercise-counter,
.quiz-counter {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
  background: rgba(100, 116, 139, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  margin-left: 8px;
}

/* ================================
   MAIN SCROLLABLE CONTENT AREA
   ================================ */

.step-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  min-height: 0;
  
  /* Enhanced scrolling experience */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scroll-padding-top: 20px;
  
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* Enhanced scrollbar design */
.step-content::-webkit-scrollbar {
  width: 8px;
}

.step-content::-webkit-scrollbar-track {
  background: rgba(241, 245, 249, 0.8);
  border-radius: 4px;
  margin: 8px 0;
}

.step-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.step-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Scroll progress indicator */
.step-content::before {
  content: '';
  position: sticky;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #6366f1 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 5;
  margin: -24px -24px 22px;
}

.step-content.scrolled::before {
  opacity: 1;
}

/* Content animation */
.step-content {
  animation: contentFadeIn 0.4s ease-out;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ================================
   INTERACTIVE CONTENT STYLING
   ================================ */

.interactive-content {
  padding: 0;
  margin: 0;
}

.current-exercise-content,
.current-quiz-content {
  background: linear-gradient(135deg, #f8faff 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #e1e8ff;
  margin: 16px 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.current-exercise-content::before,
.current-quiz-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #4f46e5);
  border-radius: 16px 16px 0 0;
}

.exercise-question-display,
.quiz-question-display {
  text-align: left;
}

.clean-question {
  font-size: 1.25rem;
  line-height: 1.6;
  color: #1e293b;
  margin: 0;
  padding: 0;
  font-weight: 600;
  text-align: left;
}

.exercise-type-info {
  margin-top: 16px;
  text-align: center;
}

.type-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  opacity: 0.9;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

/* ================================
   TEXT CONTENT STYLING
   ================================ */

.text-content {
  line-height: 1.8;
  font-size: 1rem;
  color: #374151;
}

.content-text {
  font-size: 1.05rem;
  color: #374151;
  margin: 0;
  line-height: 1.8;
  text-align: justify;
  max-width: none;
}

.content-text h1,
.content-text h2,
.content-text h3,
.content-text h4,
.content-text h5,
.content-text h6 {
  color: #1e293b;
  margin: 24px 0 16px 0;
  line-height: 1.4;
}

.content-text h1 { font-size: 1.8rem; }
.content-text h2 { font-size: 1.5rem; }
.content-text h3 { font-size: 1.3rem; }
.content-text h4 { font-size: 1.1rem; }

.content-text p {
  margin: 0 0 16px 0;
  line-height: 1.8;
}

.content-text ul,
.content-text ol {
  margin: 16px 0;
  padding-left: 24px;
}

.content-text li {
  margin: 8px 0;
  line-height: 1.6;
}

.content-text strong {
  color: #1e293b;
  font-weight: 600;
}

.content-text em {
  color: #6366f1;
  font-style: italic;
}

.content-text code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
  color: #6366f1;
}

.content-text blockquote {
  border-left: 4px solid #6366f1;
  margin: 20px 0;
  padding: 16px 20px;
  background: #f8faff;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #4f46e5;
}

/* ================================
   VOCABULARY CONTENT STYLING
   ================================ */

.vocabulary-content.enhanced {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.vocabulary-modal-trigger {
  text-align: center;
  padding: 20px 0;
}

.trigger-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 32px;
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.trigger-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
}

.trigger-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.trigger-card h3 {
  margin: 0 0 12px 0;
  font-size: 1.6rem;
  font-weight: 700;
}

.trigger-card p {
  margin: 0 0 24px 0;
  opacity: 0.95;
  font-size: 1rem;
  line-height: 1.5;
}

.start-vocabulary-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  min-height: 48px;
  backdrop-filter: blur(8px);
}

.start-vocabulary-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.vocabulary-list-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.vocabulary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.vocabulary-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.4rem;
  font-weight: 700;
}

.review-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  min-height: 44px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.review-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
}

.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.vocabulary-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.vocabulary-item.enhanced {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.vocabulary-item.learned {
  border-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
}

.vocabulary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.vocab-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.vocab-item-header .vocab-term {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-pronunciation-btn {
  background: #f1f5f9;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  color: #6366f1;
}

.mini-pronunciation-btn:hover {
  background: #e2e8f0;
  transform: scale(1.1);
  color: #4f46e5;
}

.learned-badge {
  color: #3b82f6;
  font-size: 1.3rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.vocabulary-item .vocab-definition {
  font-size: 1rem;
  color: #4b5563;
  margin-bottom: 12px;
  line-height: 1.6;
  font-weight: 500;
}

.vocabulary-item .vocab-example {
  font-size: 0.95rem;
  color: #6b7280;
  font-style: italic;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
  margin-top: 12px;
  line-height: 1.5;
}

.vocabulary-item .vocab-pronunciation {
  font-size: 0.9rem;
  color: #9ca3af;
  margin-top: 8px;
  font-family: 'Monaco', 'Consolas', monospace;
}

.vocabulary-summary {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.05);
}

.summary-stat {
  text-align: center;
}

.summary-number {
  font-size: 2rem;
  font-weight: 800;
  color: #3b82f6;
  display: block;
  line-height: 1;
}

.summary-label {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ================================
   MEDIA CONTENT STYLING
   ================================ */

.media-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 40px 0;
}

.media-placeholder {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 48px 40px;
  border-radius: 20px;
  border: 2px dashed #cbd5e1;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  position: relative;
}

.media-placeholder::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #3b82f6, #6366f1, #8b5cf6, #3b82f6);
  border-radius: 20px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  background-size: 300% 300%;
  animation: gradientShift 4s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.media-placeholder:hover::before {
  opacity: 0.1;
}

.media-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.8;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.media-placeholder h4 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 1.3rem;
  font-weight: 600;
}

.media-placeholder p {
  margin: 0 0 16px 0;
  color: #64748b;
  line-height: 1.6;
}

.media-url {
  font-size: 0.9rem;
  color: #9ca3af;
  font-family: 'Monaco', 'Consolas', monospace;
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  word-break: break-all;
}

/* ================================
   AI EXPLANATION HELP
   ================================ */

.explanation-help {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
  padding: 24px;
  border-radius: 16px;
  margin: 20px 0;
  border: 2px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.explanation-help h4 {
  margin: 0 0 16px 0;
  color: #6d28d9;
  font-size: 1.1rem;
  font-weight: 600;
}

.explanation-help-input {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.explanation-help-input input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.2s ease;
}

.explanation-help-input input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.explanation-help-input button {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.explanation-help-input button:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.explanation-help-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ai-response {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  line-height: 1.6;
  color: #374151;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.05);
}

.ai-response p {
  margin: 0;
}

/* ================================
   CONTENT NAVIGATION - FIXED AT BOTTOM
   ================================ */

.content-navigation {
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  flex-wrap: wrap;
  position: sticky;
  bottom: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.nav-btn,
.help-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 120px;
  min-height: 48px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.nav-btn::before,
.help-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.nav-btn:hover::before,
.help-btn:hover::before {
  left: 100%;
}

.prev-btn {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.prev-btn:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(203, 213, 225, 0.3);
}

.next-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.next-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.help-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  flex: 0 0 auto;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.help-btn:hover,
.help-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

/* ================================
   RESPONSIVE DESIGN - MOBILE OPTIMIZATIONS
   ================================ */

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .step-header {
    padding: 24px 32px 20px 32px;
  }
  
  .step-content {
    padding: 32px;
  }
  
  .content-navigation {
    padding: 24px 32px;
  }
  
  .step-title {
    font-size: 1.4rem;
  }
  
  .clean-question {
    font-size: 1.4rem;
  }
  
  .content-text {
    font-size: 1.1rem;
  }
}

/* Standard Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .step-header {
    padding: 20px 24px 16px 24px;
  }
  
  .step-content {
    padding: 24px;
  }
  
  .content-navigation {
    padding: 20px 24px;
  }
}

/* Tablet (768px - 1023px) */
@media (max-width: 1023px) and (min-width: 768px) {
  .content-panel::after {
    top: auto;
    bottom: -2px;
    right: 0;
    width: 100%;
    height: 4px;
    cursor: row-resize;
  }
  
  .step-header {
    padding: 18px 20px 14px 20px;
  }
  
  .step-content {
    padding: 20px;
  }
  
  .content-navigation {
    padding: 16px 20px;
    flex-direction: column;
    gap: 10px;
  }
  
  .step-title {
    font-size: 1.2rem;
    gap: 10px;
  }
  
  .step-number {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }
  
  .clean-question {
    font-size: 1.15rem;
  }
  
  .current-exercise-content,
  .current-quiz-content {
    padding: 20px;
  }
  
  .nav-btn,
  .help-btn {
    width: 100%;
    min-width: auto;
    flex: none;
  }
  
  .vocabulary-list {
    max-height: 50vh;
  }
  
  .vocabulary-summary {
    gap: 24px;
  }
  
  .trigger-card {
    padding: 32px 24px;
  }
  
  .media-placeholder {
    padding: 40px 32px;
  }
}

/* Mobile (480px - 767px) */
@media (max-width: 767px) {
  .content-panel::after {
    height: 6px;
    bottom: -3px;
  }
  
  .step-header {
    padding: 16px 18px 12px 18px;
  }
  
  .step-content {
    padding: 18px;
  }
  
  .content-navigation {
    padding: 14px 18px;
    flex-direction: column;
    gap: 8px;
  }
  
  .step-title {
    font-size: 1.1rem;
    gap: 8px;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .step-type-icon {
    font-size: 1.2rem;
  }
  
  .step-type-text {
    font-size: 1rem;
  }
  
  .clean-question {
    font-size: 1.1rem;
    line-height: 1.5;
  }
  
  .content-text {
    font-size: 1rem;
    text-align: left;
  }
  
  .current-exercise-content,
  .current-quiz-content {
    padding: 18px;
    margin: 12px 0;
  }
  
  .nav-btn,
  .help-btn {
    padding: 14px 20px;
    font-size: 0.9rem;
    min-height: 44px;
  }
  
  .vocabulary-content.enhanced {
    padding: 20px;
  }
  
  .vocabulary-list {
    max-height: 40vh;
    gap: 12px;
  }
  
  .vocabulary-item {
    padding: 16px;
  }
  
  .vocab-item-header .vocab-term {
    font-size: 1.2rem;
  }
  
  .vocabulary-summary {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
  
  .summary-number {
    font-size: 1.8rem;
  }
  
  .trigger-card {
    padding: 28px 20px;
  }
  
  .trigger-icon {
    font-size: 3rem;
  }
  
  .trigger-card h3 {
    font-size: 1.4rem;
  }
  
  .start-vocabulary-btn {
    padding: 14px 28px;
    font-size: 1rem;
  }
  
  .media-placeholder {
    padding: 32px 24px;
  }
  
  .media-icon {
    font-size: 3rem;
  }
  
  .explanation-help {
    padding: 20px;
  }
  
  .explanation-help-input {
    flex-direction: column;
    gap: 10px;
  }
  
  .explanation-help-input button {
    width: 100%;
  }
}

/* Small Mobile (320px - 479px) */
@media (max-width: 479px) {
  .step-header {
    padding: 12px 16px 10px 16px;
  }
  
  .step-content {
    padding: 16px;
  }
  
  .content-navigation {
    padding: 12px 16px;
  }
  
  .step-title {
    font-size: 1rem;
    gap: 6px;
  }
  
  .step-number {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }
  
  .step-type-icon {
    font-size: 1.1rem;
  }
  
  .step-type-text {
    font-size: 0.95rem;
  }
  
  .clean-question {
    font-size: 1rem;
  }
  
  .content-text {
    font-size: 0.95rem;
  }
  
  .current-exercise-content,
  .current-quiz-content {
    padding: 16px;
    margin: 10px 0;
  }
  
  .nav-btn,
  .help-btn {
    padding: 12px 16px;
    font-size: 0.85rem;
    min-height: 40px;
  }
  
  .vocabulary-content.enhanced {
    padding: 16px;
  }
  
  .vocabulary-list {
    max-height: 35vh;
    gap: 10px;
  }
  
  .vocabulary-item {
    padding: 14px;
  }
  
  .vocab-item-header .vocab-term {
    font-size: 1.1rem;
  }
  
  .vocabulary-item .vocab-definition {
    font-size: 0.95rem;
  }
  
  .trigger-card {
    padding: 24px 16px;
  }
  
  .trigger-icon {
    font-size: 2.5rem;
  }
  
  .trigger-card h3 {
    font-size: 1.2rem;
  }
  
  .trigger-card p {
    font-size: 0.95rem;
  }
  
  .start-vocabulary-btn {
    padding: 12px 24px;
    font-size: 0.95rem;
  }
  
  .media-placeholder {
    padding: 24px 16px;
  }
  
  .media-icon {
    font-size: 2.5rem;
  }
  
  .explanation-help {
    padding: 16px;
  }
}

/* ================================
   ACCESSIBILITY IMPROVEMENTS
   ================================ */

/* Focus states for better keyboard navigation */
.nav-btn:focus,
.help-btn:focus,
.start-vocabulary-btn:focus,
.review-btn:focus,
.mini-pronunciation-btn:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

.explanation-help-input input:focus,
.explanation-help-input button:focus {
  outline: 3px solid #8b5cf6;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .content-panel {
    border: 2px solid #000;
  }
  
  .current-exercise-content,
  .current-quiz-content,
  .vocabulary-item,
  .media-placeholder {
    border-width: 2px;
    border-color: #000;
  }
  
  .step-number {
    border: 2px solid #fff;
  }
  
  .nav-btn,
  .help-btn {
    border: 2px solid #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .trigger-icon,
  .media-icon,
  .learned-badge {
    animation: none;
  }
  
  .nav-btn:hover,
  .help-btn:hover,
  .vocabulary-item:hover,
  .start-vocabulary-btn:hover,
  .review-btn:hover {
    transform: none;
  }
  
  .step-content {
    animation: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .content-panel {
    background: #1e293b;
    color: #e2e8f0;
  }
  
  .step-header {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    border-bottom-color: #475569;
  }
  
  .step-title,
  .clean-question,
  .content-text {
    color: #e2e8f0;
  }
  
  .content-text h1,
  .content-text h2,
  .content-text h3,
  .content-text h4,
  .content-text h5,
  .content-text h6 {
    color: #f1f5f9;
  }
  
  .content-text strong {
    color: #f1f5f9;
  }
  
  .content-text code {
    background: #475569;
    color: #a5b4fc;
  }
  
  .content-text blockquote {
    background: #334155;
    border-left-color: #a5b4fc;
    color: #c7d2fe;
  }
  
  .current-exercise-content,
  .current-quiz-content {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
  }
  
  .vocabulary-content.enhanced {
    background: #334155;
    border-color: #475569;
  }
  
  .vocabulary-item {
    background: #475569;
    border-color: #64748b;
    color: #e2e8f0;
  }
  
  .vocabulary-item.learned {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
  }
  
  .vocab-item-header .vocab-term {
    color: #f1f5f9;
  }
  
  .vocabulary-item .vocab-definition {
    color: #cbd5e1;
  }
  
  .vocabulary-item .vocab-example {
    color: #94a3b8;
    border-top-color: #64748b;
  }
  
  .mini-pronunciation-btn {
    background: #64748b;
    color: #a5b4fc;
  }
  
  .mini-pronunciation-btn:hover {
    background: #475569;
    color: #c7d2fe;
  }
  
  .vocabulary-summary {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
  }
  
  .media-placeholder {
    background: #334155;
    border-color: #64748b;
    color: #cbd5e1;
  }
  
  .media-url {
    background: #475569;
    color: #e2e8f0;
    border-color: #64748b;
  }
  
  .explanation-help {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.3);
  }
  
  .explanation-help h4 {
    color: #c4b5fd;
  }
  
  .explanation-help-input input {
    background: #475569;
    border-color: rgba(139, 92, 246, 0.3);
    color: #e2e8f0;
  }
  
  .ai-response {
    background: #475569;
    color: #e2e8f0;
    border-color: rgba(139, 92, 246, 0.3);
  }
  
  .content-navigation {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    border-top-color: #64748b;
  }
  
  .prev-btn {
    background: linear-gradient(135deg, #475569 0%, #64748b 100%);
    color: #cbd5e1;
    border-color: #64748b;
  }
  
  .prev-btn:hover {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    color: #e2e8f0;
  }
}

/* ================================
   PRINT STYLES
   ================================ */

@media print {
  .content-panel {
    background: white !important;
    color: black !important;
    box-shadow: none;
    border: 1px solid #000;
  }
  
  .step-content {
    overflow: visible;
    max-height: none;
  }
  
  .content-navigation,
  .help-btn,
  .start-vocabulary-btn,
  .review-btn,
  .mini-pronunciation-btn {
    display: none;
  }
  
  .vocabulary-item,
  .current-exercise-content,
  .current-quiz-content {
    background: white !important;
    color: black !important;
    border-color: #000;
    page-break-inside: avoid;
  }
  
  .step-header {
    background: white !important;
    color: black !important;
    border-bottom: 2px solid #000;
  }
  
  .step-number {
    background: black !important;
    color: white !important;
  }
}

/* ================================
   PERFORMANCE OPTIMIZATIONS
   ================================ */

.content-panel,
.step-content,
.vocabulary-item,
.nav-btn,
.help-btn {
  will-change: transform;
  transform: translateZ(0);
}

/* Smooth scrolling optimization */
.step-content,
.vocabulary-list {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* Better text rendering */
.content-panel {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ================================
   UTILITY CLASSES
   ================================ */

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Better text selection */
::selection {
  background-color: rgba(59, 130, 246, 0.2);
  color: inherit;
}

::-moz-selection {
  background-color: rgba(59, 130, 246, 0.2);
  color: inherit;
}
  </style>