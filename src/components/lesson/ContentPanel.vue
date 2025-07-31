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
   FIXED CONTENTPANEL STYLES - PROPER SCROLLING
   ================================ */

   .content-panel {
  background: white;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden; /* ✅ FIXED: Let step-content handle scrolling */
  min-height: 0; /* ✅ CRITICAL: Allow flex shrinking */
  height: 100%; /* ✅ FIXED: Take full height */
}

.content-panel::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 2px;
  background: linear-gradient(180deg, #3b82f6, #1d4ed8);
  opacity: 0.1;
  z-index: 1;
}

/* ✅ FIXED: Step header - no scrolling needed */
.step-header {
  flex-shrink: 0; /* ✅ CRITICAL: Don't shrink header */
  padding: 24px 32px 16px 32px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  z-index: 2;
}

.step-title {
  font-size: 1.2rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.step-number {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.step-type-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.step-type-text {
  font-weight: 600;
  color: #1e293b;
}

.exercise-counter,
.quiz-counter {
  font-size: 0.9rem;
  color: #666;
  font-weight: normal;
  margin-left: 0.5rem;
}

/* ✅ CRITICAL: Step content - MAIN SCROLLABLE AREA */
.step-content {
  flex: 1; /* ✅ CRITICAL: Take remaining space */
  overflow-y: auto; /* ✅ CRITICAL: Enable vertical scrolling */
  overflow-x: hidden; /* ✅ FIXED: Prevent horizontal scrolling */
  padding: 24px 32px; /* ✅ FIXED: Add padding for content */
  min-height: 0; /* ✅ CRITICAL: Allow flex shrinking */
  position: relative;
  
  /* ✅ FIXED: Smooth scrolling */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS smooth scrolling */
  
  /* ✅ FIXED: Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1);
}

.step-content::-webkit-scrollbar {
  width: 8px;
}

.step-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.step-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.step-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}

/* ✅ FIXED: Animation for step changes */
@keyframes stepFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-content {
  animation: stepFadeIn 0.3s ease-out;
}

/* ✅ FIXED: Clean question display */
.clean-question {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #2c3e50;
  margin: 0 0 16px 0;
  padding: 0;
  font-weight: 600;
  text-align: left;
}

/* ✅ FIXED: Interactive content styling */
.interactive-content {
  padding: 0;
  margin: 0;
}

.current-exercise-content,
.current-quiz-content {
  background: linear-gradient(135deg, #f8f9ff 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 2rem;
  border: 2px solid #e1e8ff;
  margin-bottom: 16px;
  position: relative;
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
}

/* ✅ FIXED: Exercise type badge - subtle */
.exercise-type-info {
  margin-top: 1rem;
  text-align: center;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

/* ✅ FIXED: Text Content */
.text-content {
  line-height: 1.7;
  margin: 0;
}

.content-text {
  font-size: 1rem;
  color: #374151;
  margin: 0;
  line-height: 1.8;
}

/* ✅ FIXED: Vocabulary Content */
.vocabulary-content.enhanced {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin: 0;
}

.vocabulary-modal-trigger {
  text-align: center;
}

.trigger-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 32px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.trigger-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.trigger-card h3 {
  margin: 0 0 12px 0;
  font-size: 1.5rem;
}

.trigger-card p {
  margin: 0 0 24px 0;
  opacity: 0.9;
}

.start-vocabulary-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  min-height: 44px;
}

.start-vocabulary-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.vocabulary-list-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  font-size: 1.3rem;
}

.review-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  min-height: 44px;
}

.review-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
}

.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: none; /* ✅ FIXED: Allow natural height */
}

.vocabulary-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
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
  margin-bottom: 12px;
}

.vocab-item-header .vocab-term {
  font-size: 1.2rem;
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
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.mini-pronunciation-btn:hover {
  background: #e2e8f0;
  transform: scale(1.1);
}

.learned-badge {
  color: #3b82f6;
  font-size: 1.2rem;
}

.vocabulary-item .vocab-definition {
  font-size: 1rem;
  color: #4b5563;
  margin-bottom: 8px;
  line-height: 1.6;
}

.vocabulary-item .vocab-example {
  font-size: 0.9rem;
  color: #6b7280;
  font-style: italic;
  padding: 8px 0;
  border-top: 1px solid #e5e7eb;
  margin-top: 8px;
}

.vocabulary-item .vocab-pronunciation {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 4px;
}

.vocabulary-summary {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.summary-stat {
  text-align: center;
}

.summary-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  display: block;
}

.summary-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 4px;
}

/* ✅ FIXED: Media Content */
.media-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.media-placeholder {
  background: #f8fafc;
  padding: 40px;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.media-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.media-placeholder h4 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 1.1rem;
}

.media-placeholder p {
  margin: 0 0 16px 0;
  color: #64748b;
}

.media-url {
  font-size: 0.85rem;
  color: #9ca3af;
  font-family: monospace;
  background: white;
  padding: 8px;
  border-radius: 4px;
}

/* ✅ FIXED: Default Content */
.default-content {
  line-height: 1.7;
}

/* ✅ FIXED: AI Help Panel */
.explanation-help {
  background: rgba(139, 92, 246, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin: 16px 0;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.explanation-help h4 {
  margin: 0 0 12px 0;
  color: #6d28d9;
}

.explanation-help-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.explanation-help-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.explanation-help-input button {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.explanation-help-input button:hover:not(:disabled) {
  background: #7c3aed;
}

.explanation-help-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-response {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* ✅ FIXED: Content Navigation - ALWAYS AT BOTTOM */
.content-navigation {
  flex-shrink: 0; /* ✅ CRITICAL: Don't shrink navigation */
  display: flex;
  gap: 12px;
  padding: 24px 32px;
  border-top: 1px solid #e2e8f0;
  background: white;
  flex-wrap: wrap;
  z-index: 2;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
  min-height: 44px;
}

.prev-btn {
  background: #f1f5f9;
  color: #64748b;
}

.prev-btn:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.next-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.help-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  flex: 0 0 auto;
  min-width: 140px;
}

.help-btn:hover,
.help-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
}

/* ================================
   RESPONSIVE DESIGN FIXES
   ================================ */

@media (max-width: 1024px) {
  .content-panel {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .content-panel::before {
    display: none;
  }
  
  .step-header {
    padding: 20px 24px 12px 24px;
  }
  
  .step-content {
    padding: 20px 24px;
  }
  
  .content-navigation {
    padding: 20px 24px;
  }
}

@media (max-width: 768px) {
  .step-header {
    padding: 16px 20px 12px 20px;
  }
  
  .step-content {
    padding: 16px 20px;
  }
  
  .content-navigation {
    padding: 16px 20px;
  }

  .step-title {
    font-size: 1.1rem;
    gap: 8px;
  }

  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .current-exercise-content,
  .current-quiz-content {
    padding: 1.5rem;
  }

  .clean-question {
    font-size: 1.1rem;
  }

  .content-navigation {
    flex-direction: column;
    gap: 8px;
  }

  .nav-btn {
    width: 100%;
    min-width: auto;
  }

  .vocabulary-content.enhanced {
    padding: 20px;
  }

  .trigger-card {
    padding: 32px 24px;
  }

  .vocabulary-summary {
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .step-header {
    padding: 16px;
  }
  
  .step-content {
    padding: 16px;
  }
  
  .content-navigation {
    padding: 16px;
  }

  .step-title {
    font-size: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .step-number {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .current-exercise-content,
  .current-quiz-content {
    padding: 1rem;
  }

  .clean-question {
    font-size: 1rem;
  }

  .vocabulary-content.enhanced {
    padding: 16px;
  }

  .trigger-card {
    padding: 24px 16px;
  }

  .trigger-icon {
    font-size: 2rem;
  }

  .vocabulary-summary {
    flex-direction: column;
    gap: 16px;
  }

  .summary-number {
    font-size: 1.25rem;
  }
}

/* ================================
   ACCESSIBILITY FIXES
   ================================ */

/* Focus states for accessibility */
.nav-btn:focus,
.help-btn:focus,
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
    border-width: 2px;
  }

  .step-number {
    border: 2px solid white;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .step-content {
    animation: none;
  }

  .vocabulary-item:hover,
  .nav-btn:hover,
  .help-btn:hover,
  .start-vocabulary-btn:hover,
  .review-btn:hover {
    transform: none;
  }
  
  .step-content {
    scroll-behavior: auto;
  }
}

/* Print styles */
@media print {
  .content-navigation,
  .help-btn,
  .start-vocabulary-btn,
  .review-btn,
  .mini-pronunciation-btn {
    display: none;
  }

  .content-panel {
    border: none;
    box-shadow: none;
    overflow: visible;
  }
  
  .step-content {
    overflow: visible;
    padding: 20px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .content-panel {
    background: #1e293b;
    border-right-color: #374151;
  }

  .step-header {
    background: #1e293b;
    border-bottom-color: #374151;
  }

  .content-navigation {
    background: #1e293b;
    border-top-color: #374151;
  }

  .step-title,
  .clean-question,
  .content-text {
    color: #e2e8f0;
  }

  .current-exercise-content,
  .current-quiz-content {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
  }

  .vocabulary-item {
    background: #374151;
    border-color: #4b5563;
    color: #e2e8f0;
  }

  .media-placeholder {
    background: #374151;
    border-color: #4b5563;
  }

  .explanation-help {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.3);
  }

  .ai-response {
    background: #374151;
    color: #e2e8f0;
  }
}
</style>