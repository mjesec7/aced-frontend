<template>
  <div class="content-panel">
    <!-- Fixed Header with Modern Design -->
    <div class="content-header">
      <div class="step-info">
        <div class="step-number">
          <span class="step-badge">{{ currentIndex + 1 }}</span>
        </div>
        <div class="step-details">
          <h3 class="step-title">
            <span class="step-icon">{{ getStepIcon(currentStep?.type) }}</span>
            <span class="step-type">{{ getStepTypeText(currentStep?.type) }}</span>
          </h3>
          <div class="step-meta">
            <!-- Exercise/quiz counter for interactive steps -->
            <span v-if="isInteractiveStep && ['exercise', 'practice'].includes(currentStep?.type)" class="step-counter">
              Упражнение {{ exerciseIndex + 1 }} из {{ totalExercises || 1 }}
            </span>
            <span v-else-if="isInteractiveStep && currentStep?.type === 'quiz'" class="step-counter">
              Вопрос {{ quizIndex + 1 }} из {{ totalQuizzes || 1 }}
            </span>
            <span v-else class="step-counter">
              Шаг {{ currentIndex + 1 }} из {{ totalSteps || 1 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Scrollable Content Area -->
    <div class="content-body" ref="contentBody">
      <!-- Interactive Step Content -->
      <div v-if="isInteractiveStep" class="interactive-content">
        <!-- Exercise Content -->
        <div v-if="['exercise', 'practice'].includes(currentStep?.type)" class="exercise-preview">
          <div class="preview-card">
            <div class="preview-header">
              <div class="preview-icon">✏️</div>
              <h4>Практическое задание</h4>
            </div>
            <div class="preview-content">
              <div class="question-preview">{{ getStepContent(currentStep) }}</div>
              <div v-if="currentExercise?.type && currentExercise.type !== 'short-answer'" class="exercise-type-badge">
                <span class="type-label">{{ getExerciseTypeName(currentExercise?.type) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quiz Content -->
        <div v-else-if="currentStep?.type === 'quiz'" class="quiz-preview">
          <div class="preview-card">
            <div class="preview-header">
              <div class="preview-icon">🧩</div>
              <h4>Проверочный вопрос</h4>
            </div>
            <div class="preview-content">
              <div class="question-preview">{{ getStepContent(currentStep) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Text Content Steps -->
      <div v-else-if="['explanation', 'example', 'reading'].includes(currentStep?.type)" class="text-content">
        <article class="content-article">
          <div class="article-content" v-html="formatContent(getStepContent(currentStep))"></div>
          
          <!-- AI Help Section for Explanations -->
          <div v-if="showExplanationHelp" class="explanation-help">
            <div class="help-header">
              <div class="help-icon">🤖</div>
              <h4>AI Помощник</h4>
            </div>
            <div class="help-content">
              <div class="help-input">
                <input 
                  :value="explanationQuestion"
                  @input="updateExplanationQuestion"
                  placeholder="Задайте вопрос об этом материале..."
                  @keyup.enter="askExplanation"
                  class="help-input-field"
                />
                <button 
                  @click="askExplanation" 
                  :disabled="!explanationQuestion?.trim()"
                  class="help-submit-btn"
                >
                  <span v-if="isLoadingExplanation" class="loading-spinner">⏳</span>
                  <span v-else>📤</span>
                </button>
              </div>
              <div v-if="explanationAIResponse" class="ai-response">
                <div class="response-header">
                  <div class="response-icon">🤖</div>
                  <span>Ответ AI:</span>
                </div>
                <div class="response-content">{{ explanationAIResponse }}</div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Vocabulary Step -->
      <div v-else-if="currentStep?.type === 'vocabulary'" class="vocabulary-content">
        <!-- Vocabulary Modal Trigger -->
        <div v-if="!currentStep?.data?.modalCompleted" class="vocabulary-trigger">
          <div class="trigger-card">
            <div class="trigger-visual">
              <div class="trigger-icon">📚</div>
              <div class="trigger-particles">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="trigger-content">
              <h3>Изучение новых слов</h3>
              <p>{{ getVocabularyWordsCount() }} новых терминов ждут изучения</p>
              <button @click="$emit('init-vocabulary')" class="start-vocab-btn">
                <span class="btn-icon">🚀</span>
                <span class="btn-text">Начать изучение</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Vocabulary Summary -->
        <div v-else class="vocabulary-summary">
          <div class="summary-header">
            <div class="header-icon">📖</div>
            <h3>Изученные слова</h3>
            <button @click="$emit('init-vocabulary')" class="review-vocab-btn">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Повторить</span>
            </button>
          </div>
          
          <div class="vocabulary-grid">
            <div 
              v-for="(vocab, vocabIndex) in getVocabularyWords()" 
              :key="vocab?.id || `vocab-${vocabIndex}`" 
              class="vocab-card"
              :class="{ learned: vocab?.learned }"
            >
              <div class="vocab-card-header">
                <div class="vocab-term">
                  {{ vocab?.term || 'Term' }}
                  <button 
                    v-if="vocab?.term"
                    @click="$emit('pronounce', vocab.term)"
                    class="pronounce-btn"
                    title="Произношение"
                  >
                    🔊
                  </button>
                </div>
                <div v-if="vocab?.learned" class="learned-indicator">✅</div>
              </div>
              
              <div class="vocab-definition">{{ vocab?.definition || 'Определение' }}</div>
              
              <div v-if="vocab?.example" class="vocab-example">
                <strong>Пример:</strong> {{ vocab.example }}
              </div>
            </div>
          </div>
          
          <!-- Vocabulary Stats -->
          <div class="vocab-stats">
            <div class="stat-item">
              <div class="stat-number">{{ getLearnedCount() }}</div>
              <div class="stat-label">изучено</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-number">{{ getVocabularyWordsCount() }}</div>
              <div class="stat-label">всего</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Media Content -->
      <div v-else-if="['video', 'audio'].includes(currentStep?.type)" class="media-content">
        <div class="media-card">
          <div class="media-header">
            <div class="media-icon">{{ currentStep?.type === 'video' ? '🎬' : '🎵' }}</div>
            <h4>{{ currentStep?.type === 'video' ? 'Видео урок' : 'Аудио урок' }}</h4>
          </div>
          <div class="media-body">
            <p class="media-description">{{ currentStep?.data?.description || 'Мультимедиа контент' }}</p>
            <div class="media-placeholder">
              <div class="placeholder-icon">{{ currentStep?.type === 'video' ? '📹' : '🎧' }}</div>
              <p>Контент будет загружен</p>
              <div class="media-url">{{ currentStep?.data?.url || 'URL недоступен' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Default Content -->
      <div v-else class="default-content">
        <div class="default-card">
          <div class="default-icon">📄</div>
          <div class="default-text" v-html="formatContent(getStepContent(currentStep))"></div>
        </div>
      </div>
    </div>

    <!-- Fixed Footer with Navigation -->
    <div class="content-footer">
      <div class="footer-actions">
        <button 
          v-if="currentIndex > 0" 
          @click="$emit('previous')" 
          class="nav-btn prev-btn"
        >
          <span class="btn-icon">⬅️</span>
          <span class="btn-text">Назад</span>
        </button>
        
        <div class="footer-center">
          <button 
            v-if="['explanation', 'example', 'reading'].includes(currentStep?.type)"
            @click="$emit('toggle-explanation-help')"
            class="help-toggle-btn"
            :class="{ active: showExplanationHelp }"
          >
            <span class="btn-icon">🤖</span>
            <span class="btn-text">{{ showExplanationHelp ? 'Скрыть помощь' : 'AI помощь' }}</span>
          </button>
        </div>
        
        <button 
          v-if="!isInteractiveStep" 
          @click="$emit('next')"
          class="nav-btn next-btn"
        >
          <span class="btn-text">{{ isLastStep ? 'Завершить' : 'Далее' }}</span>
          <span class="btn-icon">{{ isLastStep ? '🏁' : '➡️' }}</span>
        </button>
      </div>
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
    totalSteps: {
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
  mounted() {
    this.setupScrollDetection()
  },
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
      }
      return icons[stepType] || '📄'
    },

    getStepTypeText(stepType) {
      const texts = {
        explanation: 'Объяснение',
        example: 'Пример',
        reading: 'Материал для чтения',
        exercise: 'Упражнение',
        practice: 'Практика',
        quiz: 'Викторина',
        vocabulary: 'Изучение словаря',
        video: 'Видео урок',
        audio: 'Аудио урок'
      }
      return texts[stepType] || 'Контент'
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
        'drag-drop': 'Перетащи и отпусти'
      }
      return typeNames[type] || 'Упражнение'
    },

    getStepContent(step) {
      if (!step || !step.data) {
        return 'Контент недоступен'
      }
      
      // For interactive steps, show the question
      if (['exercise', 'practice'].includes(step.type)) {
        if (this.currentExercise && this.currentExercise.question) {
          return this.getLocalized(this.currentExercise.question)
        }
        return 'Упражнение загружается...'
      }
      
      if (step.type === 'quiz') {
        if (this.currentQuiz && this.currentQuiz.question) {
          return this.getLocalized(this.currentQuiz.question)
        }
        return 'Вопрос загружается...'
      }
      
      // For other steps, show content
      try {
        if (typeof step.data === 'string' && step.data.trim()) {
          return step.data.trim()
        }
        
        if (step.data.content) {
          const content = this.getLocalized(step.data.content)
          if (content && content.trim()) {
            return content.trim()
          }
        }
        
        if (step.data.text) {
          const text = this.getLocalized(step.data.text)
          if (text && text.trim()) {
            return text.trim()
          }
        }
        
        if (step.type === 'vocabulary') {
          const wordsCount = this.getVocabularyWordsCount()
          return `Изучение словаря: ${wordsCount} новых слов`
        }
        
        return `Контент для шага "${step.type}"`
        
      } catch (error) {
        console.error('Error in getStepContent:', error)
        return 'Ошибка загрузки контента'
      }
    },

    formatContent(content) {
      if (!content) return 'Контент недоступен'
      
      // Convert markdown-like formatting
      let formatted = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
      
      return formatted
    },

    getVocabularyWords() {
      const data = this.currentStep?.data
      if (Array.isArray(data)) return data
      if (data?.allWords && Array.isArray(data.allWords)) return data.allWords
      if (data?.words && Array.isArray(data.words)) return data.words
      return []
    },

    getVocabularyWordsCount() {
      return this.getVocabularyWords().length
    },

    getLearnedCount() {
      return this.getVocabularyWords().filter(word => word?.learned).length
    },

    updateExplanationQuestion(event) {
      this.$emit('update:explanation-question', event.target.value)
    },

    askExplanation() {
      if (this.explanationQuestion?.trim()) {
        this.$emit('ask-explanation', this.explanationQuestion)
      }
    },

    setupScrollDetection() {
      this.$nextTick(() => {
        const contentBody = this.$refs.contentBody
        if (contentBody) {
          const handleScroll = () => {
            if (contentBody.scrollTop > 20) {
              contentBody.classList.add('scrolled')
            } else {
              contentBody.classList.remove('scrolled')
            }
          }
          
          contentBody.addEventListener('scroll', handleScroll, { passive: true })
          handleScroll() // Initial check
        }
      })
    },

    getLocalized(field) {
      if (typeof field === 'string') return field
      return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim()
    }
  }
}
</script>

<style scoped>
/* Modern Content Panel Design */
.content-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

/* Fixed Header */
.content-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
  flex-shrink: 0;
  position: relative;
}

.content-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  opacity: 0.6;
}

.step-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.step-number {
  flex-shrink: 0;
}

.step-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.step-details {
  flex: 1;
  min-width: 0;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.step-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.step-type {
  flex: 1;
  min-width: 0;
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-counter {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Scrollable Content Body */
.content-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.content-body::-webkit-scrollbar {
  width: 6px;
}

.content-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.content-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 3px;
  transition: all 0.2s ease;
}

.content-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

/* Scroll indicator */
.content-body::before {
  content: '';
  position: sticky;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #6366f1 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
  margin: -24px -24px 22px;
}

.content-body.scrolled::before {
  opacity: 1;
}

/* Interactive Content Preview */
.interactive-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.preview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-icon {
  font-size: 1.5rem;
}

.preview-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0c4a6e;
}

.question-preview {
  font-size: 1.125rem;
  line-height: 1.6;
  color: #1e293b;
  margin-bottom: 16px;
  font-weight: 500;
}

.exercise-type-badge {
  display: inline-flex;
  align-items: center;
}

.type-label {
  background: rgba(14, 165, 233, 0.1);
  color: #0c4a6e;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(14, 165, 233, 0.2);
}

/* Text Content */
.text-content {
  max-width: none;
}

.content-article {
  line-height: 1.8;
  color: #374151;
}

.article-content {
  font-size: 1rem;
  line-height: 1.8;
  color: #374151;
}

.article-content h1,
.article-content h2,
.article-content h3,
.article-content h4 {
  color: #1e293b;
  margin: 24px 0 16px 0;
  font-weight: 600;
}

.article-content h1 { font-size: 1.75rem; }
.article-content h2 { font-size: 1.5rem; }
.article-content h3 { font-size: 1.25rem; }
.article-content h4 { font-size: 1.125rem; }

.article-content p {
  margin: 0 0 16px 0;
}

.article-content strong {
  color: #1e293b;
  font-weight: 600;
}

.article-content em {
  color: #6366f1;
  font-style: italic;
}

.article-content code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: Monaco, Consolas, monospace;
  font-size: 0.9em;
  color: #6366f1;
}

.article-content ul,
.article-content ol {
  margin: 16px 0;
  padding-left: 24px;
}

.article-content li {
  margin: 8px 0;
}

/* AI Help Section */
.explanation-help {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-top: 24px;
}

.help-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.help-icon {
  font-size: 1.25rem;
}

.help-header h4 {
  margin: 0;
  color: #7c3aed;
  font-size: 1.1rem;
  font-weight: 600;
}

.help-input {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.help-input-field {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.2s ease;
}

.help-input-field:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.help-submit-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.help-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ai-response {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.response-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #7c3aed;
  font-weight: 600;
  font-size: 0.9rem;
}

.response-content {
  color: #374151;
  line-height: 1.6;
}

/* Vocabulary Content */
.vocabulary-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.vocabulary-trigger {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.trigger-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 32px;
  border-radius: 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
  max-width: 400px;
  width: 100%;
}

.trigger-visual {
  position: relative;
  margin-bottom: 24px;
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

.trigger-particles {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.trigger-particles span {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

.trigger-particles span:nth-child(1) {
  left: 20%;
  animation-delay: 0s;
}

.trigger-particles span:nth-child(2) {
  left: 50%;
  animation-delay: 1s;
}

.trigger-particles span:nth-child(3) {
  left: 80%;
  animation-delay: 2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); opacity: 0.7; }
  50% { transform: translateY(-20px); opacity: 1; }
}

.trigger-content h3 {
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.trigger-content p {
  margin: 0 0 24px 0;
  opacity: 0.9;
  font-size: 1rem;
}

.start-vocab-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(8px);
}

.start-vocab-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

/* Vocabulary Summary */
.vocabulary-summary {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.header-icon {
  font-size: 1.5rem;
  margin-right: 8px;
}

.summary-header h3 {
  display: flex;
  align-items: center;
  margin: 0;
  color: #1e293b;
  font-size: 1.3rem;
  font-weight: 700;
  flex: 1;
}

.review-vocab-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.review-vocab-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
}

.vocabulary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.vocab-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.vocab-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #6366f1;
}

.vocab-card.learned {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
}

.vocab-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.vocab-term {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.pronounce-btn {
  background: #f1f5f9;
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  color: #6366f1;
}

.pronounce-btn:hover {
  background: #e2e8f0;
  transform: scale(1.1);
}

.learned-indicator {
  color: #10b981;
  font-size: 1.2rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.vocab-definition {
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 12px;
  font-weight: 500;
}

.vocab-example {
  color: #6b7280;
  font-style: italic;
  font-size: 0.9rem;
  line-height: 1.4;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.vocab-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: #6366f1;
  display: block;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 2px;
  height: 40px;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  border-radius: 1px;
}

/* Media Content */
.media-content {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.media-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.media-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.media-icon {
  font-size: 2rem;
}

.media-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.media-description {
  color: #64748b;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.media-placeholder {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-top: 16px;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.6;
}

.media-url {
  font-size: 0.85rem;
  color: #9ca3af;
  font-family: Monaco, Consolas, monospace;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 6px;
  word-break: break-all;
  margin-top: 12px;
}

/* Default Content */
.default-content {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.default-card {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.default-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.default-text {
  font-size: 1rem;
  line-height: 1.7;
  color: #374151;
}

/* Fixed Footer */
.content-footer {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-top: 1px solid #e2e8f0;
  padding: 16px 24px;
  flex-shrink: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.footer-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-btn,
.help-toggle-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  position: relative;
  overflow: hidden;
}

.nav-btn::before,
.help-toggle-btn::before {
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
.help-toggle-btn:hover::before {
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.next-btn:hover {
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.help-toggle-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.help-toggle-btn:hover,
.help-toggle-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.btn-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.btn-text {
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-header {
    padding: 16px 20px;
  }
  
  .content-body {
    padding: 20px;
  }
  
  .content-footer {
    padding: 14px 20px;
  }
  
  .vocabulary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .content-header {
    padding: 14px 16px;
  }
  
  .step-info {
    flex-direction: column;
    gap: 12px;
  }
  
  .step-badge {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  
  .step-title {
    font-size: 1.1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .content-body {
    padding: 16px;
  }
  
  .content-footer {
    padding: 12px 16px;
  }
  
  .footer-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .footer-center {
    order: -1;
  }
  
  .nav-btn,
  .help-toggle-btn {
    width: 100%;
    justify-content: center;
  }
  
  .trigger-card {
    padding: 32px 24px;
  }
  
  .vocab-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-divider {
    width: 40px;
    height: 2px;
  }
}

@media (max-width: 480px) {
  .content-header {
    padding: 12px 14px;
  }
  
  .step-badge {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
  
  .step-title {
    font-size: 1rem;
  }
  
  .step-icon {
    font-size: 1.3rem;
  }
  
  .content-body {
    padding: 14px;
  }
  
  .preview-card {
    padding: 20px;
  }
  
  .question-preview {
    font-size: 1rem;
  }
  
  .trigger-card {
    padding: 28px 20px;
  }
  
  .trigger-icon {
    font-size: 3rem;
  }
  
  .vocab-card {
    padding: 14px;
  }
  
  .vocab-term {
    font-size: 1.1rem;
  }
  
  .help-input {
    flex-direction: column;
    gap: 8px;
  }
  
  .help-submit-btn {
    width: 100%;
  }
}

/* Loading spinner animation */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Focus states for accessibility */
.nav-btn:focus,
.help-toggle-btn:focus,
.start-vocab-btn:focus,
.review-vocab-btn:focus,
.pronounce-btn:focus,
.help-input-field:focus,
.help-submit-btn:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .content-panel,
  .preview-card,
  .vocab-card,
  .media-card {
    border-width: 2px;
  }
  
  .step-badge {
    border: 2px solid #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .trigger-icon,
  .learned-indicator {
    animation: none;
  }
  
  .nav-btn:hover,
  .help-toggle-btn:hover,
  .vocab-card:hover {
    transform: none;
  }
}

/* Print styles */
@media print {
  .content-header,
  .content-footer {
    background: white !important;
    box-shadow: none;
  }
  
  .content-body {
    overflow: visible;
  }
  
  .nav-btn,
  .help-toggle-btn,
  .start-vocab-btn,
  .review-vocab-btn,
  .pronounce-btn {
    display: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .content-panel {
    background: #1e293b;
  }
  
  .content-header {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    border-bottom-color: #475569;
  }
  
  .step-title,
  .question-preview,
  .article-content {
    color: #e2e8f0;
  }
  
  .step-counter {
    background: rgba(139, 92, 246, 0.2);
    color: #c4b5fd;
  }
  
  .preview-card {
    background: rgba(14, 165, 233, 0.1);
    border-color: #0ea5e9;
  }
  
  .vocab-card {
    background: #334155;
    border-color: #475569;
  }
  
  .vocab-term {
    color: #f1f5f9;
  }
  
  .vocab-definition {
    color: #cbd5e1;
  }
  
  .content-footer {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    border-top-color: #475569;
  }
}
  </style>