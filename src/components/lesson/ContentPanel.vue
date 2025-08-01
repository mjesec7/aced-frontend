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
        <!-- FOR INTERACTIVE STEPS: Show simple instruction -->
        <div v-if="isInteractiveStep" class="interactive-instruction">
          <div class="instruction-card">
            <div class="instruction-icon">
              {{ currentStep?.type === 'exercise' ? '✏️' : currentStep?.type === 'practice' ? '🧪' : '🧩' }}
            </div>
            <h3>Complete the {{ getStepTypeText(currentStep?.type).toLowerCase() }} on the right</h3>
            <p>Use the interactive panel to answer the question and continue with the lesson.</p>
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
      
      // Convert markdown-like formatting to HTML
      let formatted = content
        // Convert ## headings to h2
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        // Convert ### headings to h3  
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        // Convert **bold** to strong
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Convert *italic* to em
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Convert `code` to code tags
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Convert line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      
      // Wrap in paragraph tags if not already wrapped
      if (!formatted.includes('<h') && !formatted.includes('<p>')) {
        formatted = '<p>' + formatted + '</p>';
      }
      
      return formatted;
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
  overflow: hidden !important;
  box-sizing: border-box;
  position: relative;
}

.content-step-header {
  padding: 16px 28px; /* Reduced from 24px */
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  background: white;
  box-sizing: border-box;
}

.content-step-title {
  font-size: 1.2rem !important; /* Reduced from 1.4rem */
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px; /* Reduced from 12px */
  flex-wrap: wrap;
  font-weight: 600;
}

.content-step-number {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  width: 32px; /* Reduced from 40px */
  height: 32px; /* Reduced from 40px */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem; /* Reduced from 1.1rem */
  flex-shrink: 0;
}

.content-step-type-icon {
  font-size: 1.3rem; /* Reduced from 1.5rem */
  flex-shrink: 0;
}

.content-step-type-text {
  font-weight: 700;
  color: #1e293b;
  font-size: 1.1rem !important; /* Reduced from 1.2rem */
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
  overflow-y: auto !important;
  overflow-x: hidden !important;
  min-height: 0 !important;
  max-height: none !important;
  height: auto !important; /* Remove any height constraints */
  width: 100%;
  box-sizing: border-box;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

.content-step-content {
  padding: 32px 28px;
  padding-bottom: 40px; /* Extra padding at bottom to ensure full scroll */
  animation: contentFadeIn 0.3s ease-out;
  box-sizing: border-box;
  width: 100%;
  min-height: auto !important; /* Remove height constraints */
  height: auto !important;
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

/* Interactive instruction styling */
.interactive-instruction {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
}

.instruction-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
}

.instruction-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  opacity: 0.8;
}

.instruction-card h3 {
  margin: 0 0 16px 0;
  color: #0c4a6e;
  font-size: 1.3rem;
  font-weight: 600;
}

.instruction-card p {
  margin: 0;
  color: #075985;
  font-size: 1rem;
  line-height: 1.5;
  opacity: 0.9;
}

/* Text Content - styled like the reference image */
.text-content {
  line-height: 1.7;
  width: 100%;
}

.content-text {
  font-size: 1rem !important;
  color: #374151;
  margin: 0;
  line-height: 1.7;
  font-weight: 400;
  width: 100%;
  max-width: none !important;
  box-sizing: border-box;
}

/* Style headings like the reference */
.content-text :deep(h1),
.content-text :deep(h2),
.content-text :deep(h3) {
  color: #1f2937;
  font-weight: 600;
  margin: 2rem 0 1rem 0;
  padding-left: 16px;
  border-left: 4px solid #8b5cf6;
  line-height: 1.4;
}

.content-text :deep(h1) {
  font-size: 1.5rem;
}

.content-text :deep(h2) {
  font-size: 1.3rem;
}

.content-text :deep(h3) {
  font-size: 1.2rem;
}

/* Style paragraphs like the reference */
.content-text :deep(p) {
  margin: 1rem 0;
  color: #374151;
  line-height: 1.7;
  font-size: 1rem;
}

/* Style sections with background like the reference */
.content-text :deep(.section),
.content-text :deep(.component-section) {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-left: 4px solid #8b5cf6;
}

.content-text :deep(.section h4),
.content-text :deep(.component-section h4) {
  color: #8b5cf6;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.content-text :deep(.section p),
.content-text :deep(.component-section p) {
  margin: 0.5rem 0;
  color: #4b5563;
}

/* Style code blocks */
.content-text :deep(code) {
  background: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9rem;
  color: #1e40af;
}

.content-text :deep(pre) {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1rem 0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9rem;
}

/* Style lists */
.content-text :deep(ul),
.content-text :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.content-text :deep(li) {
  margin: 0.5rem 0;
  color: #374151;
  line-height: 1.6;
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

/* Content Navigation - More comfortable size */
.content-navigation {
  display: flex !important;
  gap: 12px; /* Reduced from 16px */
  padding: 16px 28px; /* Reduced from 24px */
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0 !important;
  background: white;
  flex-wrap: wrap;
  box-sizing: border-box;
  position: sticky !important;
  bottom: 0 !important;
  z-index: 100 !important;
  width: 100%;
  margin-top: auto;
}

.content-nav-btn {
  display: block !important;
  padding: 10px 20px; /* Much smaller - reduced from 16px 28px */
  border: none;
  border-radius: 6px; /* Reduced from 8px */
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 100px; /* Reduced from 140px */
  min-height: 40px; /* Much smaller - reduced from 52px */
  font-size: 0.95rem !important; /* Reduced from 1.1rem */
  visibility: visible !important;
  opacity: 1 !important;
}

.content-prev-btn {
  background: #f1f5f9 !important;
  color: #64748b !important;
}

.content-prev-btn:hover {
  background: #e2e8f0 !important;
  transform: translateY(-1px);
}

.content-next-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
  color: white !important;
}

.content-next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

/* Custom scrollbar styling */
.content-step-container::-webkit-scrollbar {
  width: 12px;
}

.content-step-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 6px;
}

.content-step-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
  border: 2px solid #f1f5f9;
}

.content-step-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Firefox scrollbar */
.content-step-container {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-step-header {
    padding: 14px 24px; /* Reduced */
  }

  .content-step-content {
    padding: 20px; /* Reduced from 24px */
  }

  .content-step-title {
    font-size: 1.1rem !important; /* Reduced */
    gap: 8px;
  }

  .content-step-number {
    width: 28px; /* Reduced from 36px */
    height: 28px;
    font-size: 0.85rem; /* Reduced from 1rem */
  }

  .clean-question {
    font-size: 1.3rem !important; /* Reduced */
  }

  .content-text {
    font-size: 1.05rem !important; /* Reduced */
  }

  .current-exercise-content,
  .current-quiz-content {
    padding: 1.5rem; /* Reduced from 2rem */
  }

  .content-navigation {
    flex-direction: column;
    gap: 8px; /* Reduced from 12px */
    padding: 12px 24px; /* Much smaller - reduced from 20px 24px */
  }

  .content-nav-btn {
    width: 100%;
    min-width: auto;
    min-height: 36px; /* Smaller on mobile */
    padding: 8px 16px; /* Smaller padding */
  }

  .vocabulary-content.enhanced {
    padding: 20px; /* Reduced from 24px */
  }

  .trigger-card {
    padding: 32px 24px; /* Reduced from 36px 28px */
  }

  .vocabulary-summary {
    gap: 20px; /* Reduced from 24px */
  }
}

@media (max-width: 480px) {
  .content-step-header {
    padding: 12px 20px; /* Reduced */
  }

  .content-step-content {
    padding: 16px; /* Reduced from 20px */
  }

  .content-step-title {
    font-size: 1rem !important; /* Reduced */
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .content-step-number {
    width: 26px; /* Reduced from 32px */
    height: 26px;
    font-size: 0.8rem; /* Reduced */
  }

  .clean-question {
    font-size: 1.2rem !important; /* Reduced */
  }

  .content-text {
    font-size: 1rem !important; /* Reduced */
  }

  .current-exercise-content,
  .current-quiz-content {
    padding: 1.2rem; /* Reduced from 1.5rem */
  }

  .vocabulary-content.enhanced {
    padding: 16px; /* Reduced from 20px */
  }

  .trigger-card {
    padding: 24px 16px; /* Reduced from 28px 20px */
  }

  .trigger-icon {
    font-size: 2rem; /* Reduced from 2.5rem */
  }

  .vocabulary-summary {
    flex-direction: column;
    gap: 16px; /* Reduced from 20px */
  }

  .summary-number {
    font-size: 1.4rem !important; /* Reduced from 1.6rem */
  }

  .content-navigation {
    padding: 10px 20px; /* Much smaller - reduced from 16px 20px */
  }

  .content-nav-btn {
    min-height: 34px; /* Even smaller on small screens */
    padding: 6px 14px; /* Smaller padding */
    font-size: 0.9rem !important; /* Smaller text */
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

/* Remove any height constraints that might prevent full scrolling */
.content-panel-wrapper,
.content-step-container,
.content-step-content,
.text-content,
.content-text {
  width: 100% !important;
  max-width: none !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}

/* Ensure full scrolling capability */
.content-step-container {
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

/* Make sure content can expand fully */
.content-step-content {
  height: auto !important;
  min-height: auto !important;
}
</style>