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
              {{ (vocabularyData?.currentIndex || 0) + 1 }} / {{ (vocabularyData?.words || []).length || 1 }}
            </div>
          </div>
          
          <div class="vocab-header-actions">
            <button @click="$emit('skip')" class="vocab-skip-btn" title="Пропустить и перейти к списку">
              ⏭️ Пропустить
            </button>
            <button @click="$emit('close')" class="vocab-close-btn" title="Выйти из урока">
              ✕
            </button>
          </div>
        </div>
  
        <!-- Vocabulary Card Container -->
        <div v-if="!vocabularyData?.isCompleted && !vocabularyData?.showingList" class="vocabulary-card-container">
          
          <!-- Main Vocabulary Card -->
          <div class="vocabulary-card" 
               :class="{ 
                 'flipped': cardAnimation?.showDefinition, 
                 'flipping': cardAnimation?.isFlipping,
                 'learned': currentWord?.learned
               }">
            
            <!-- Front of Card (Term) -->
            <div class="card-front" @click="$emit('show-definition')">
              <div class="card-content">
                <div class="vocab-term-section">
                  <h2 class="vocab-term">{{ currentWord?.term || 'Loading...' }}</h2>
                  
                  <div v-if="currentWord?.pronunciation" class="vocab-pronunciation">
                    /{{ currentWord.pronunciation }}/
                  </div>
                  
                  <div v-if="currentWord?.partOfSpeech" class="vocab-part-of-speech">
                    {{ currentWord.partOfSpeech }}
                  </div>
                </div>
                
                <div class="card-instruction">
                  <div class="instruction-icon">👆</div>
                  <p>Нажмите, чтобы увидеть определение</p>
                </div>
                
                <!-- Pronunciation Button -->
                <button 
                  v-if="currentWord?.term" 
                  @click.stop="$emit('pronounce', currentWord.term)"
                  class="pronunciation-btn"
                  title="Произношение"
                >
                  🔊
                </button>
              </div>
            </div>
  
            <!-- Back of Card (Definition) -->
            <div class="card-back" @click="$emit('hide-definition')">
              <div class="card-content">
                <div class="vocab-definition-section">
                  <h3 class="vocab-term-small">{{ currentWord?.term || '' }}</h3>
                  
                  <div class="vocab-definition">
                    {{ currentWord?.definition || 'Определение не найдено' }}
                  </div>
                  
                  <div v-if="currentWord?.example" class="vocab-example">
                    <strong>Пример:</strong><br>
                    <em>{{ currentWord.example }}</em>
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
              @click="$emit('previous-word')" 
              :disabled="(vocabularyData?.currentIndex || 0) === 0"
              class="vocab-nav-btn vocab-prev-btn"
              title="Предыдущее слово"
            >
              ⬅️ Назад
            </button>
            
            <div class="vocab-main-actions">
              <button 
                @click="$emit('mark-learned')" 
                class="vocab-learned-btn"
                :class="{ active: currentWord?.learned }"
                title="Отметить как изученное"
              >
                {{ currentWord?.learned ? '✅ Изучено' : '📚 Изучить' }}
              </button>
              
              <button 
                @click="$emit('next-word')" 
                class="vocab-next-btn"
                title="Следующее слово"
              >
                {{ isLastWord ? '🏁 Завершить' : '➡️ Далее' }}
              </button>
            </div>
            
            <button 
              @click="$emit('restart')" 
              class="vocab-restart-btn"
              title="Начать заново"
            >
              🔄 Заново
            </button>
          </div>
  
          <!-- Quick Navigation Dots -->
          <div class="vocab-dots-navigation">
            <button
              v-for="(word, wordIndex) in (vocabularyData?.words || [])"
              :key="word?.id || `vocab-dot-${wordIndex}`"
              @click="jumpToWord(wordIndex)"
              class="vocab-dot"
              :class="{ 
                active: wordIndex === (vocabularyData?.currentIndex || 0),
                learned: word?.learned 
              }"
              :title="word?.term || 'Word'"
            >
            </button>
          </div>
        </div>
  
        <!-- Completion Screen -->
        <div v-else-if="vocabularyData?.isCompleted && !vocabularyData?.showingList" class="vocabulary-completion">
          <div class="completion-animation">
            <div class="completion-icon">🎉</div>
            <h3>Отлично!</h3>
            <p>Вы изучили {{ ((vocabularyData?.words || []).filter(w => w?.learned) || []).length }} из {{ (vocabularyData?.words || []).length }} слов</p>
            
            <div class="completion-stats">
              <div class="completion-stat">
                <div class="stat-number">{{ ((vocabularyData?.words || []).filter(w => w?.learned) || []).length }}</div>
                <div class="stat-label">Изучено</div>
              </div>
              <div class="completion-stat">
                <div class="stat-number">{{ Math.round((((vocabularyData?.words || []).filter(w => w?.learned) || []).length / Math.max((vocabularyData?.words || []).length, 1)) * 100) }}%</div>
                <div class="stat-label">Прогресс</div>
              </div>
            </div>
            
            <button @click="$emit('skip')" class="continue-btn">
              📋 Перейти к списку слов
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
      'pronounce'
    ],
    methods: {
      jumpToWord(index) {
        this.$emit('jump-to-word', index);
      }
    }
  }
  </script>
  
  <style scoped>
  /* Vocabulary Modal Overlay */
  .vocabulary-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(12px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    padding: 20px;
    animation: modalFadeIn 0.4s ease-out;
  }
  
  @keyframes modalFadeIn {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(12px);
    }
  }
  
  /* Modal Container */
  .vocabulary-modal-container {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 24px;
    padding: 32px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    position: relative;
    animation: modalSlideUp 0.4s ease-out;
  }
  
  @keyframes modalSlideUp {
    from {
      opacity: 0;
      transform: translateY(40px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Modal Header */
  .vocabulary-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .vocab-progress-section {
    flex: 1;
    margin-right: 20px;
  }
  
  .vocab-progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .vocab-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: inherit;
    transition: width 0.5s ease;
    position: relative;
  }
  
  .vocab-progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: progressShimmer 2s infinite;
  }
  
  @keyframes progressShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .vocab-progress-text {
    font-size: 0.9rem;
    color: #4b5563;
    font-weight: 600;
  }
  
  .vocab-header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .vocab-skip-btn,
  .vocab-close-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .vocab-skip-btn {
    background: #f1f5f9;
    color: #64748b;
  }
  
  .vocab-skip-btn:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
  }
  
  .vocab-close-btn {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    padding: 0;
    font-size: 1.2rem;
  }
  
  .vocab-close-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(1.1);
  }
  
  /* Vocabulary Card Container */
  .vocabulary-card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  
  /* Main Vocabulary Card */
  .vocabulary-card {
    width: 100%;
    max-width: 500px;
    height: 350px;
    position: relative;
    perspective: 1000px;
    cursor: pointer;
    margin-bottom: 20px;
    animation: cardAppear 0.5s ease-out;
  }
  
  @keyframes cardAppear {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .vocabulary-card:hover {
    transform: scale(1.02);
  }
  
  .card-front,
  .card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.6s ease;
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.2);
  }
  
  .card-front {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: rotateY(0deg);
  }
  
  .card-back {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
    top: 15px;
    right: 15px;
    font-size: 1.5rem;
    z-index: 10;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Card Content */
  .card-content {
    padding: 40px;
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
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 16px 0;
    line-height: 1.2;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .vocab-term-small {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 20px 0;
    opacity: 0.9;
  }
  
  .vocab-pronunciation {
    font-size: 1.1rem;
    opacity: 0.8;
    font-style: italic;
    margin-bottom: 8px;
  }
  
  .vocab-part-of-speech {
    font-size: 0.9rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
  }
  
  .vocab-definition-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  .vocab-definition {
    font-size: 1.2rem;
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .vocab-example {
    font-size: 1rem;
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
    font-size: 0.9rem;
  }
  
  .instruction-icon {
    font-size: 1.2rem;
    margin-bottom: 4px;
  }
  
  .pronunciation-btn {
    position: absolute;
    bottom: 15px;
    right: 15px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .pronunciation-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  /* Card Actions */
  .vocab-card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  
  .vocab-nav-btn {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
    min-height: 44px;
  }
  
  .vocab-nav-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
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
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px;
  }
  
  .vocab-learned-btn.active {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
  }
  
  .vocab-learned-btn:hover {
    transform: translateY(-2px);
  }
  
  .vocab-next-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px;
  }
  
  .vocab-next-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
  }
  
  .vocab-restart-btn {
    background: #f59e0b;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px;
  }
  
  .vocab-restart-btn:hover {
    background: #d97706;
    transform: translateY(-2px);
  }
  
  /* Quick Navigation Dots */
  .vocab-dots-navigation {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  
  .vocab-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }
  
  .vocab-dot.active {
    background: #3b82f6;
    border-color: #3b82f6;
  }
  
  .vocab-dot.learned {
    background: #3b82f6;
    border-color: #3b82f6;
  }
  
  .vocab-dot:hover {
    transform: scale(1.2);
  }
  
  /* Completion Screen */
  .vocabulary-completion {
    text-align: center;
    padding: 40px 20px;
  }
  
  .completion-animation {
    animation: completionBounce 0.6s ease-out;
  }
  
  @keyframes completionBounce {
    0%, 20%, 40%, 60%, 80% { transform: translateY(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateY(-10px); }
  }
  
  .completion-icon {
    font-size: 4rem;
    margin-bottom: 20px;
  }
  
  .completion-stats {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin: 24px 0;
  }
  
  .completion-stat {
    text-align: center;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #3b82f6;
    display: block;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #64748b;
    margin-top: 4px;
  }
  
  .continue-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 16px 32px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 24px;
    min-height: 44px;
  }
  
  .continue-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
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
    font-size: 3rem;
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
    width: 8px;
    height: 8px;
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
      font-size: 2rem;
    }
  
    .vocab-definition {
      font-size: 1.1rem;
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
      font-size: 1.25rem;
    }
  }
  
  @media (max-width: 480px) {
    .vocabulary-modal-container {
      padding: 16px;
      margin: 8px;
    }
  
    .vocabulary-card {
      height: 250px;
    }
  
    .vocab-term {
      font-size: 1.8rem;
    }
  
    .vocab-definition {
      font-size: 1rem;
    }
  
    .card-content {
      padding: 20px;
    }
  
    .completion-stats {
      flex-direction: column;
      gap: 16px;
    }
  }
  </style>