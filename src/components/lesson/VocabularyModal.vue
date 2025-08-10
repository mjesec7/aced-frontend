<template>
  <div class="vocabulary-modal-overlay" @click.self="$emit('close')">
    <div class="vocabulary-modal-container">
      
      <!-- Modal Header -->
      <div class="vocabulary-modal-header">
        <div class="vocab-progress-section">
          <div class="vocab-progress-bar">
            <div class="vocab-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="vocab-progress-text">
            {{ (vocabularyData?.currentIndex || 0) + 1 }} / {{ getValidWordsCount() }}
          </div>
        </div>
        
        <div class="vocab-header-actions">
          <button @click="$emit('skip')" class="vocab-skip-btn" title="Пропустить и перейти к списку">
            <span class="btn-icon">⏭️</span>
            <span class="btn-text">Пропустить</span>
          </button>
          <button @click="$emit('close')" class="vocab-close-btn" title="Выйти из урока">
            ✕
          </button>
        </div>
      </div>

      <!-- DEBUG INFO (only in development) -->
      <div v-if="isDevelopment" class="debug-info">
        <details>
          <summary>🔍 Debug Info</summary>
          <pre>{{ debugInfo }}</pre>
        </details>
      </div>

      <!-- FIXED: Vocabulary Card Container with proper data validation -->
      <div v-if="!vocabularyData?.isCompleted && !vocabularyData?.showingList && hasValidWords" class="vocabulary-card-container">
        
        <!-- Main Vocabulary Card -->
        <div class="vocabulary-card" 
             :class="{ 
               'flipped': cardAnimation?.showDefinition, 
               'flipping': cardAnimation?.isFlipping,
               'learned': currentDisplayWord?.learned
             }">
          
          <!-- Front of Card (Term) -->
          <div class="card-front" @click="$emit('show-definition')">
            <div class="card-content">
              <div class="vocab-term-section">
                <h2 class="vocab-term">{{ getWordTerm(currentDisplayWord) }}</h2>
                
                <div v-if="getWordPronunciation(currentDisplayWord)" class="vocab-pronunciation">
                  /{{ getWordPronunciation(currentDisplayWord) }}/
                </div>
                
                <div v-if="getWordPartOfSpeech(currentDisplayWord)" class="vocab-part-of-speech">
                  {{ getWordPartOfSpeech(currentDisplayWord) }}
                </div>
              </div>
              
              <div class="card-instruction">
                <div class="instruction-icon">💫</div>
                <p>Нажмите, чтобы увидеть определение</p>
              </div>
            </div>
            
            <!-- Voice Button - Fixed Position -->
            <button 
              v-if="getWordTerm(currentDisplayWord)" 
              @click.stop="$emit('pronounce', getWordTerm(currentDisplayWord))"
              class="voice-btn"
              title="Произношение"
            >
              <span class="voice-icon">🔊</span>
            </button>
          </div>

          <!-- Back of Card (Definition) -->
          <div class="card-back" @click="$emit('hide-definition')">
            <div class="card-content">
              <div class="vocab-definition-section">
                <h3 class="vocab-term-small">{{ getWordTerm(currentDisplayWord) }}</h3>
                
                <div class="vocab-definition">
                  {{ getWordDefinition(currentDisplayWord) }}
                </div>
                
                <div v-if="getWordExample(currentDisplayWord)" class="vocab-example">
                  <strong>Пример:</strong><br>
                  <em>{{ getWordExample(currentDisplayWord) }}</em>
                </div>
              </div>
              
              <div class="card-instruction">
                <div class="instruction-icon">↩️</div>
                <p>Нажмите, чтобы вернуться к термину</p>
              </div>
            </div>
            
            <!-- Voice Button - Also on back -->
            <button 
              v-if="getWordTerm(currentDisplayWord)" 
              @click.stop="$emit('pronounce', getWordTerm(currentDisplayWord))"
              class="voice-btn"
              title="Произношение"
            >
              <span class="voice-icon">🔊</span>
            </button>
          </div>
        </div>

        <!-- Card Actions -->
        <div class="vocab-card-actions">
          <button 
            @click="$emit('previous-word')" 
            :disabled="(vocabularyData?.currentIndex || 0) === 0"
            class="vocab-nav-btn vocab-prev-btn"
            title="Предыдущее слово"
          >
            <span class="btn-icon">⬅️</span>
            <span class="btn-text">Назад</span>
          </button>
          
          <div class="vocab-main-actions">
            <button 
              @click="$emit('mark-learned')" 
              class="vocab-learned-btn"
              :class="{ active: currentDisplayWord?.learned }"
              title="Отметить как изученное"
            >
              <span class="btn-icon">{{ currentDisplayWord?.learned ? '✅' : '📚' }}</span>
              <span class="btn-text">{{ currentDisplayWord?.learned ? 'Изучено' : 'Изучить' }}</span>
            </button>
            
            <button 
              @click="$emit('next-word')" 
              class="vocab-next-btn"
              title="Следующее слово"
            >
              <span class="btn-icon">{{ isLastWord ? '🏁' : '➡️' }}</span>
              <span class="btn-text">{{ isLastWord ? 'Завершить' : 'Далее' }}</span>
            </button>
          </div>
          
          <button 
            @click="$emit('restart')" 
            class="vocab-restart-btn"
            title="Начать заново"
          >
            <span class="btn-icon">🔄</span>
            <span class="btn-text">Заново</span>
          </button>
        </div>

        <!-- Quick Navigation Dots -->
        <div class="vocab-dots-navigation">
          <button
            v-for="(word, wordIndex) in getValidWords()"
            :key="getWordId(word, wordIndex)"
            @click="jumpToWord(wordIndex)"
            class="vocab-dot"
            :class="{ 
              active: wordIndex === (vocabularyData?.currentIndex || 0),
              learned: word?.learned 
            }"
            :title="getWordTerm(word)"
          >
          </button>
        </div>
      </div>

      <!-- FIXED: No Words Available State -->
      <div v-else-if="!hasValidWords && !vocabularyData?.isCompleted && !vocabularyData?.showingList" class="no-vocabulary-content">
        <div class="no-vocab-icon">📚</div>
        <h3 class="no-vocab-title">Словарь пуст</h3>
        <p class="no-vocab-subtitle">
          {{ vocabularyData?.words?.length > 0 ? 'В этом уроке нет корректных слов для изучения' : 'В этом уроке нет слов для изучения' }}
        </p>
        
        <!-- Show problematic data for debugging in development -->
        <div v-if="isDevelopment && vocabularyData?.words?.length > 0" class="debug-words">
          <details>
            <summary>🔧 Отладочная информация слов</summary>
            <pre>{{ JSON.stringify(vocabularyData.words, null, 2) }}</pre>
          </details>
        </div>
        
        <button @click="$emit('skip')" class="continue-btn">
          <span class="btn-icon">📋</span>
          <span class="btn-text">Продолжить урок</span>
        </button>
      </div>

      <!-- Completion Screen -->
      <div v-else-if="vocabularyData?.isCompleted && !vocabularyData?.showingList" class="vocabulary-completion">
        <div class="completion-animation">
          <div class="completion-icon">🎉</div>
          <h3 class="completion-title">Отлично!</h3>
          <p class="completion-subtitle">
            Вы изучили {{ getLearnedWordsCount() }} из {{ getValidWordsCount() }} слов
          </p>
          
          <div class="completion-stats">
            <div class="completion-stat">
              <div class="stat-number">{{ getLearnedWordsCount() }}</div>
              <div class="stat-label">Изучено</div>
            </div>
            <div class="completion-stat">
              <div class="stat-number">{{ getCompletionPercentage() }}%</div>
              <div class="stat-label">Прогресс</div>
            </div>
          </div>
          
          <button @click="$emit('skip')" class="continue-btn">
            <span class="btn-icon">📋</span>
            <span class="btn-text">Перейти к списку слов</span>
          </button>
        </div>
      </div>

      <!-- List Transition Screen -->
      <div v-else-if="vocabularyData?.showingList" class="vocabulary-list-transition">
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
</template>

<script>
export default {
  name: 'VocabularyModal',
  props: {
    vocabularyData: {
      type: Object,
      required: true,
      default: () => ({
        isVisible: false,
        currentIndex: 0,
        words: [],
        isCompleted: false,
        showingList: false
      })
    },
    cardAnimation: {
      type: Object,
      default: () => ({
        isFlipping: false,
        showDefinition: false
      })
    },
    currentWord: {
      type: Object,
      default: null
    },
    progress: {
      type: Number,
      default: 0
    },
    isLastWord: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'show-definition',
    'hide-definition', 
    'mark-learned',
    'next-word',
    'previous-word',
    'skip',
    'restart',
    'close',
    'pronounce',
    'jump-to-word'
  ],
  computed: {
    // Environment check
    isDevelopment() {
      return process.env.NODE_ENV === 'development'
    },

    // FIXED: Robust validation for vocabulary words
    hasValidWords() {
      const words = this.getValidWords()
      const hasWords = words.length > 0
      
      if (this.isDevelopment) {
        
      }
      
      return hasWords
    },

    // FIXED: Current word with better fallback logic
    currentDisplayWord() {
      const validWords = this.getValidWords()
      const index = this.vocabularyData?.currentIndex || 0
      const word = validWords[index] || this.currentWord || null
      
      if (this.isDevelopment) {
       
      }
      
      return word
    },

    // Debug information
    debugInfo() {
      if (!this.isDevelopment) return null
      
      return {
        vocabularyData: {
          isVisible: this.vocabularyData?.isVisible,
          currentIndex: this.vocabularyData?.currentIndex,
          wordsLength: this.vocabularyData?.words?.length,
          isCompleted: this.vocabularyData?.isCompleted,
          showingList: this.vocabularyData?.showingList,
          wordsStructure: this.vocabularyData?.words?.slice(0, 2)?.map(word => ({
            keys: Object.keys(word || {}),
            hasTerms: !!(word?.term || word?.word),
            hasDefinition: !!(word?.definition || word?.translation)
          }))
        },
        currentWord: this.currentWord ? {
          keys: Object.keys(this.currentWord),
          term: this.getWordTerm(this.currentWord),
          definition: this.getWordDefinition(this.currentWord)
        } : null,
        validWordsCount: this.getValidWordsCount(),
        hasValidWords: this.hasValidWords
      }
    }
  },
  methods: {
    // FIXED: Robust word validation and extraction
    getValidWords() {
      const words = this.vocabularyData?.words || []
      
      return words.filter(word => {
        if (!word || typeof word !== 'object') {
          return false
        }
        
        const hasTerm = this.getWordTerm(word)
        const hasDefinition = this.getWordDefinition(word)
        
        return !!(hasTerm && hasDefinition)
      })
    },

    getValidWordsCount() {
      return this.getValidWords().length
    },

    getLearnedWordsCount() {
      return this.getValidWords().filter(word => word?.learned).length
    },

    getCompletionPercentage() {
      const total = this.getValidWordsCount()
      const learned = this.getLearnedWordsCount()
      return total > 0 ? Math.round((learned / total) * 100) : 0
    },

    // FIXED: Flexible word property extraction with multiple fallbacks
    getWordTerm(word) {
      if (!word) return ''
      
      // Try multiple possible property names
      const term = word.term || word.word || word.title || word.name || ''
      return String(term).trim()
    },

    getWordDefinition(word) {
      if (!word) return 'Определение не найдено'
      
      // Try multiple possible property names
      const definition = word.definition || word.translation || word.meaning || word.desc || word.description || ''
      return String(definition).trim() || 'Определение не найдено'
    },

    getWordExample(word) {
      if (!word) return ''
      
      const example = word.example || word.examples || word.usage || ''
      return String(example).trim()
    },

    getWordPronunciation(word) {
      if (!word) return ''
      
      const pronunciation = word.pronunciation || word.phonetic || ''
      return String(pronunciation).trim()
    },

    getWordPartOfSpeech(word) {
      if (!word) return ''
      
      const partOfSpeech = word.partOfSpeech || word.pos || word.type || ''
      return String(partOfSpeech).trim()
    },

    getWordId(word, index) {
      if (!word) return `vocab-${index}`
      
      return word.id || word._id || `vocab-${index}-${this.getWordTerm(word)?.substring(0, 10) || 'word'}`
    },

    jumpToWord(index) {
      this.$emit('jump-to-word', index)
    }
  },
  
  // Add mounted hook for debugging
  mounted() {
    if (this.isDevelopment) {
    
    }
  },

  // Watch for data changes
  watch: {
    vocabularyData: {
      handler(newData) {
        if (this.isDevelopment) {
       
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>

<style scoped>
/* Debug styles */
.debug-info {
  background: rgba(255, 255, 0, 0.1);
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 0.8rem;
}

.debug-info summary {
  cursor: pointer;
  font-weight: 600;
  color: #92400e;
}

.debug-info pre {
  margin-top: 8px;
  background: white;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.7rem;
  color: #374151;
}

.debug-words {
  margin: 16px 0;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  font-size: 0.8rem;
}

.debug-words summary {
  cursor: pointer;
  font-weight: 600;
  color: #dc2626;
}

.debug-words pre {
  margin-top: 8px;
  background: white;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.7rem;
  color: #374151;
  max-height: 200px;
  overflow-y: auto;
}

/* Main modal styles */
.vocabulary-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(16px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(16px);
  }
}

.vocabulary-modal-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  padding: 28px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.vocabulary-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.vocab-progress-section {
  flex: 1;
  margin-right: 20px;
}

.vocab-progress-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.vocab-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: inherit;
  transition: width 0.6s ease;
  position: relative;
}

.vocab-progress-text {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.vocab-header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.vocab-skip-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vocab-skip-btn:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.vocab-close-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-weight: 500;
}

.vocab-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.05);
}

/* Vocabulary Card Container */
.vocabulary-card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* Main Vocabulary Card */
.vocabulary-card {
  width: 100%;
  max-width: 480px;
  height: 320px;
  position: relative;
  perspective: 1000px;
  cursor: pointer;
  animation: cardAppear 0.4s ease-out;
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.vocabulary-card:hover {
  transform: scale(1.015);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.6s ease;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08);
}

.card-front {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  transform: rotateY(0deg);
}

.card-back {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
  transform: rotateY(180deg);
}

.vocabulary-card.flipped .card-front {
  transform: rotateY(-180deg);
}

.vocabulary-card.flipped .card-back {
  transform: rotateY(0deg);
}

.vocabulary-card.learned::after {
  content: '✅';
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 1.25rem;
  z-index: 10;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.card-content {
  padding: 32px;
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.vocab-term-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.vocab-term {
  font-size: 2.25rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  line-height: 1.1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  word-break: break-word;
}

.vocab-term-small {
  font-size: 1.375rem;
  font-weight: 500;
  margin: 0 0 20px 0;
  opacity: 0.9;
  word-break: break-word;
}

.vocab-pronunciation {
  font-size: 1rem;
  opacity: 0.8;
  font-style: italic;
  margin-bottom: 8px;
}

.vocab-part-of-speech {
  font-size: 0.875rem;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.vocab-definition-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.vocab-definition {
  font-size: 1.125rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.vocab-example {
  font-size: 0.9375rem;
  opacity: 0.9;
  font-style: italic;
  margin-top: 16px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-instruction {
  opacity: 0.7;
  font-size: 0.875rem;
}

.instruction-icon {
  font-size: 1.125rem;
  margin-bottom: 4px;
}

/* Voice Button */
.voice-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 5;
}

.voice-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.voice-btn:active {
  transform: scale(0.95);
}

/* Card Actions */
.vocab-card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.vocab-nav-btn {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
}

.vocab-nav-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(100, 116, 139, 0.3);
}

.vocab-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.vocab-main-actions {
  display: flex;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.vocab-learned-btn {
  background: #f1f5f9;
  color: #64748b;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vocab-learned-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.vocab-learned-btn:hover {
  transform: translateY(-1px);
}

.vocab-next-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vocab-next-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(99, 102, 241, 0.3);
}

.vocab-restart-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vocab-restart-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(245, 158, 11, 0.3);
}

.btn-icon {
  font-size: 1rem;
}

.btn-text {
  font-size: 0.875rem;
}

/* Quick Navigation Dots */
.vocab-dots-navigation {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  flex-wrap: wrap;
  max-width: 100%;
}

.vocab-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.vocab-dot.active {
  background: #6366f1;
  border-color: #6366f1;
  transform: scale(1.2);
}

.vocab-dot.learned {
  background: #10b981;
  border-color: #10b981;
}

.vocab-dot:hover {
  transform: scale(1.3);
}

/* No Vocabulary Content State */
.no-vocabulary-content {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.no-vocab-icon {
  font-size: 4rem;
  margin-bottom: 24px;
  opacity: 0.7;
}

.no-vocab-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #374151;
}

.no-vocab-subtitle {
  font-size: 1rem;
  margin: 0 0 32px 0;
  color: #6b7280;
  line-height: 1.5;
}

/* Completion Screen */
.vocabulary-completion {
  text-align: center;
  padding: 32px 20px;
}

.completion-animation {
  animation: completionBounce 0.5s ease-out;
}

@keyframes completionBounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
}

.completion-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
}

.completion-title {
  font-size: 1.875rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.completion-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.completion-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin: 24px 0;
}

.completion-stat {
  text-align: center;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 600;
  color: #6366f1;
  display: block;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 4px;
}

.continue-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.continue-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(99, 102, 241, 0.3);
}

/* List Transition Screen */
.vocabulary-list-transition {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.transition-animation {
  text-align: center;
}

.transition-icon {
  font-size: 2.5rem;
  margin-bottom: 20px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 16px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .vocabulary-modal-container {
    padding: 20px;
    margin: 10px;
  }

  .vocabulary-card {
    height: 280px;
  }

  .vocab-term {
    font-size: 1.875rem;
  }

  .vocab-definition {
    font-size: 1rem;
  }

  .vocabulary-modal-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .vocab-progress-section {
    margin-right: 0;
  }

  .vocab-header-actions {
    justify-content: space-between;
  }

  .vocab-skip-btn {
    flex: 1;
    margin-right: 8px;
  }

  .vocab-card-actions {
    flex-direction: column;
    gap: 8px;
  }

  .vocab-main-actions {
    flex-direction: column;
    width: 100%;
  }

  .completion-stats {
    gap: 20px;
  }

  .stat-number {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .vocabulary-modal-container {
    padding: 16px;
    margin: 8px;
  }

  .vocabulary-card {
    height: 260px;
  }

  .vocab-term {
    font-size: 1.625rem;
  }

  .vocab-definition {
    font-size: 0.9375rem;
  }

  .card-content {
    padding: 24px;
  }

  .completion-stats {
    flex-direction: column;
    gap: 16px;
  }

  .vocab-dots-navigation {
    gap: 4px;
  }

  .vocab-dot {
    width: 8px;
    height: 8px;
  }
}

/* Focus states for accessibility */
.vocab-nav-btn:focus,
.vocab-learned-btn:focus,
.vocab-next-btn:focus,
.vocab-restart-btn:focus,
.vocab-skip-btn:focus,
.vocab-close-btn:focus,
.voice-btn:focus,
.continue-btn:focus,
.vocab-dot:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .vocabulary-card,
  .card-front,
  .card-back {
    border: 2px solid currentColor;
  }
  
  .vocab-dot {
    border-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .vocabulary-card,
  .card-front,
  .card-back,
  .vocab-nav-btn,
  .vocab-learned-btn,
  .vocab-next-btn,
  .vocab-restart-btn,
  .voice-btn,
  .continue-btn {
    transition: none;
  }
  
  .vocabulary-card:hover,
  .vocab-nav-btn:hover,
  .vocab-learned-btn:hover,
  .vocab-next-btn:hover,
  .vocab-restart-btn:hover,
  .voice-btn:hover,
  .continue-btn:hover {
    transform: none;
  }
  
  .modalFadeIn,
  .modalSlideUp,
  .cardAppear,
  .completionBounce,
  .spin,
  .dotPulse {
    animation: none;
  }
}

/* Print styles */
@media print {
  .vocabulary-modal-overlay {
    position: static;
    background: white;
    backdrop-filter: none;
  }
  
  .vocabulary-modal-container {
    box-shadow: none;
    max-height: none;
    overflow: visible;
  }
  
  .vocab-header-actions,
  .vocab-card-actions,
  .voice-btn,
  .vocab-dots-navigation {
    display: none;
  }
  
  .vocabulary-card {
    height: auto;
    perspective: none;
  }
  
  .card-front,
  .card-back {
    position: static;
    transform: none;
    backface-visibility: visible;
  }
  
  .card-back {
    margin-top: 20px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .vocabulary-modal-container {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: #e2e8f0;
  }
  
  .debug-info {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
  }
  
  .debug-info summary {
    color: #60a5fa;
  }
  
  .debug-info pre,
  .debug-words pre {
    background: #0f172a;
    color: #e2e8f0;
  }
  
  .debug-words {
    background: rgba(239, 68, 68, 0.2);
  }
  
  .debug-words summary {
    color: #f87171;
  }
  
  .vocab-progress-bar {
    background: #475569;
  }
  
  .vocab-skip-btn {
    background: #334155;
    color: #cbd5e1;
  }
  
  .vocab-skip-btn:hover {
    background: #475569;
  }
  
  .vocab-learned-btn {
    background: #334155;
    color: #cbd5e1;
  }
  
  .no-vocabulary-content,
  .vocabulary-completion {
    color: #cbd5e1;
  }
  
  .no-vocab-title,
  .completion-title {
    color: #f1f5f9;
  }
}
</style>