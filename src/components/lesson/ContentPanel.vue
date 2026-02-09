<template>
  <div class="content-panel" :class="{ 'game-mode': isGameStep }">
    <header class="content-step-header">
      <h3 class="header-title">
        <span class="step-number">{{ currentIndex + 1 }}</span>
        <span class="step-icon">{{ getStepIcon(currentStep?.type) }}</span>
        <span class="step-text">{{ getStepTypeText(currentStep?.type) }}</span>
        
        <span v-if="isInteractiveStep && !isGameStep" class="exercise-counter">
          ({{ exerciseIndex + 1 }}/{{ totalExercises || 1 }})
        </span>
      </h3>
    </header>
    
    <div class="content-step-container">
      <div class="content-padding">
        
        <!-- EXPLANATION/EXAMPLE/READING STEPS -->
        <div v-if="['explanation', 'example', 'reading'].includes(currentStep?.type)">
          <div v-if="hasEmptyContent" class="empty-content-card">
            <div class="empty-icon">📭</div>
            <h3 class="empty-heading">Content Not Available</h3>
            <p class="empty-text">This step doesn't have content yet. Click Next to continue with the lesson.</p>
          </div>
          <div v-else class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
        </div>
        
        <!-- EXERCISE STEPS -->
        <div v-else-if="isExerciseStep" class="interactive-instruction-card">
          <div class="instruction-icon">✏️</div>
          <h3 class="instruction-heading">{{ getLocalizedText(currentStep?.title) || 'Complete the exercise on the right' }}</h3>
          <p class="instruction-text">
            {{ getLocalizedText(currentStep?.instructions) || 'Use the interactive panel to answer the question and continue with the lesson.' }}
          </p>
        </div>

        <!-- GAME STEPS - COMPACT VERSION -->
        <div v-else-if="isGameStep" class="game-context-view">
          <div class="game-intro-card">
            <div class="intro-header">
              <span class="game-icon">🎮</span>
              <h3>{{ getLocalizedText(currentStep?.title) || 'Interactive Challenge' }}</h3>
            </div>

            <div class="game-instructions-box">
              <h4>How to Play:</h4>
              <p v-if="currentStep?.instructions" class="game-instructions-text">
                {{ getLocalizedText(currentStep.instructions) }}
              </p>
              <ul v-else class="instruction-list">
                <li>Follow the instructions in the game panel</li>
                <li>Complete all objectives to proceed</li>
                <li>Have fun learning!</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- SPECIAL INTERACTIVE STEPS -->
        <div v-else-if="isSpecialInteractive" class="interactive-instruction-card">
          <div class="instruction-icon">🎮</div>
          <h3 class="instruction-heading">{{ getLocalizedText(currentStep?.title) || 'Interactive Exercise' }}</h3>
          <p class="instruction-text">{{ getLocalizedText(currentStep?.instructions) || 'Complete the interactive exercise on the right to continue.' }}</p>
        </div>

        <!-- QUIZ STEPS -->
        <div v-else-if="currentStep?.type === 'quiz'" class="interactive-instruction-card">
          <div class="instruction-icon">🧩</div>
          <h3 class="instruction-heading">{{ getLocalizedText(currentStep?.title) || 'Quiz Time!' }}</h3>
          <p class="instruction-text">{{ getLocalizedText(currentStep?.instructions) || 'Answer the questions on the right to test your knowledge.' }}</p>
        </div>

        <!-- DATA ANALYSIS STEPS -->
        <div v-else-if="currentStep?.type === 'data_analysis'" class="interactive-instruction-card">
          <div class="instruction-icon">📊</div>
          <h3 class="instruction-heading">{{ getLocalizedText(currentStep?.title) || 'Data Analysis' }}</h3>
          <p class="instruction-text">{{ getLocalizedText(currentStep?.instructions) || 'Analyze the data and answer the question.' }}</p>
        </div>

        <!-- MATCHING STEPS -->
        <div v-else-if="currentStep?.type === 'chem_matching'" class="interactive-instruction-card">
          <div class="instruction-icon">🔗</div>
          <h3 class="instruction-heading">{{ getLocalizedText(currentStep?.title) || 'Matching Exercise' }}</h3>
          <p class="instruction-text">{{ getLocalizedText(currentStep?.instructions) || 'Match the items on the left with their correct pairs on the right.' }}</p>
        </div>

        <!-- SENTENCE ORDER STEPS -->
        <div v-else-if="currentStep?.type === 'english_sentence_order'" class="interactive-instruction-card">
          <div class="instruction-icon">📝</div>
          <h3 class="instruction-heading">{{ getLocalizedText(currentStep?.title) || 'Put in Order' }}</h3>
          <p class="instruction-text">{{ getLocalizedText(currentStep?.instructions) || 'Arrange the items in the correct order.' }}</p>
        </div>

        <!-- WORD CONSTELLATION STEPS -->
        <div v-else-if="currentStep?.type === 'language_word_constellation'" class="interactive-instruction-card">
          <div class="instruction-icon">🌟</div>
          <h3 class="instruction-heading">{{ getLocalizedText(currentStep?.title) || 'Word Constellation' }}</h3>
          <p class="instruction-text">{{ getLocalizedText(currentStep?.instructions) || 'Connect the related words to build a semantic map.' }}</p>
        </div>

        <!-- OTHER INTERACTIVE STEPS -->
        <div v-else-if="isInteractiveStep && !isExerciseStep && !isGameStep" class="interactive-instruction-card">
          <div class="instruction-icon">{{ currentStep?.type === 'practice' ? '🧪' : '🧩' }}</div>
          <h3 class="instruction-heading">{{ getLocalizedText(currentStep?.title) || `Complete the ${getStepTypeText(currentStep?.type).toLowerCase()} on the right` }}</h3>
          <p class="instruction-text">{{ getLocalizedText(currentStep?.instructions) || 'Use the interactive panel to complete this activity.' }}</p>
        </div>

        <!-- VOCABULARY -->
        <div v-else-if="currentStep?.type === 'vocabulary'" class="vocabulary-content">
          <div v-if="!vocabularyModalCompleted" class="vocabulary-trigger">
            <div class="trigger-icon">📚</div>
            <h3 class="trigger-heading">{{ getLocalizedText(currentStep?.title) || 'Vocabulary Learning' }}</h3>
            <p class="trigger-subheading">{{ getVocabularyCount }} new words await you!</p>
            <button @click="$emit('init-vocabulary')" class="trigger-button">
              🚀 Start Learning
            </button>
          </div>

          <div v-else class="vocabulary-list-view">
            <div class="vocabulary-header">
              <h3>📖 Learned Words</h3>
              <button @click="$emit('init-vocabulary')" class="review-button">
                🔄 Review
              </button>
            </div>

            <div class="vocabulary-list">
              <div
                v-for="(vocab, vocabIndex) in vocabularyTerms"
                :key="vocab?.id || `vocab-list-${vocabIndex}`"
                class="vocabulary-item"
                :class="{ 'is-learned': vocab?.learned }"
              >
                <div class="vocab-item-header">
                  <div class="vocab-term">
                    {{ getLocalizedText(vocab?.term) }}
                    <button
                      v-if="vocab?.term"
                      @click="$emit('pronounce', getLocalizedText(vocab.term))"
                      class="pronunciation-button"
                      title="Pronunciation"
                    >
                      🔊
                    </button>
                  </div>
                  <div v-if="vocab?.learned" class="learned-badge">✅</div>
                </div>
                <div class="vocab-definition">{{ getLocalizedText(vocab?.definition) }}</div>
                <div v-if="vocab?.example" class="vocab-example">
                  <strong>Example:</strong> {{ getLocalizedText(vocab.example) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MEDIA PLACEHOLDER -->
        <div v-else-if="['video', 'audio'].includes(currentStep?.type)" class="media-placeholder">
          <div class="media-icon">{{ currentStep?.type === 'video' ? '🎬' : '🎵' }}</div>
          <h4 class="media-title">{{ currentStep?.type === 'video' ? 'Video Lesson' : 'Audio Lesson' }}</h4>
          <p class="media-description">{{ getLocalizedText(currentStep?.data?.description) || getLocalizedText(currentStep?.description) || 'Multimedia content' }}</p>
        </div>

        <!-- DEFAULT CONTENT -->
        <div v-else class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
      </div>
    </div>
    
    <footer class="content-navigation">
      <button v-if="currentIndex > 0" class="nav-button prev-button" @click="$emit('previous')">
        ⬅️ {{ $t('lessonNavigation.back') }}
      </button>
      <button
        v-if="!isInteractiveStep || hasEmptyContent"
        class="nav-button next-button"
        :class="{ 'hide-on-mobile-game': isGameStep }"
        @click="$emit('next')"
      >
        {{ isLastStep ? ('🏁 ' + $t('lessonNavigation.finish')) : ('➡️ ' + $t('lessonNavigation.next')) }}
      </button>
    </footer>
  </div>
</template>

<script>
import { eventBus } from '@/utils/eventBus';
import { useLanguage } from '@/composables/useLanguage';

export default {
  name: 'ContentPanel',
  props: {
    currentStep: Object,
    currentIndex: Number,
    isInteractiveStep: Boolean,
    isGameStep: Boolean,
    showExplanationAlways: Boolean,
    totalExercises: Number,
    exerciseIndex: Number,
    isLastStep: Boolean,
  },
  emits: ['init-vocabulary', 'pronounce', 'next', 'previous'],

  data() {
    return {
      highlightPhrases: []
    };
  },

  computed: {
    /**
     * Get current language from localStorage or default to 'en'
     */
    currentLang() {
      return localStorage.getItem('lang') || 'en';
    },

    isExerciseStep() {
      return (this.currentStep?.type === 'exercise' || this.currentStep?.type === 'practice') &&
             !this.currentStep?.gameType;
    },

    hasEmptyContent() {
      const content = this.getStepContent(this.currentStep);
      if (!content || typeof content !== 'string') return true;
      const trimmed = content.trim();
      return !trimmed || trimmed.includes('is not available') || trimmed.includes('not found') || trimmed.length < 3;
    },

    specialInteractiveTypes() {
      return [
        'histogram', 'map', 'block-coding',
        'data_analysis', 'fraction_visual', 'geometry_poly',
        'chem_mixing', 'chem_matching',
        'english_sentence_fix', 'english_sentence_order',
        'language_noun_bag', 'geometry', 'selection_game',
        'language_tone_transformer', 'language_idiom_bridge',
        'language_word_constellation', 'language_rhythm_match',
        'language_false_friends'
      ];
    },

    isSpecialInteractive() {
      return this.specialInteractiveTypes.includes(this.currentStep?.type);
    },

    totalExercisesInStep() {
      if (!this.currentStep) return 0;
      if (Array.isArray(this.currentStep.data)) return this.currentStep.data.length;
      if (this.currentStep.data?.exercises) return this.currentStep.data.exercises.length;
      if (this.currentStep.exercises) return this.currentStep.exercises.length;
      return 1;
    },

    /**
     * Check if vocabulary modal has been completed
     */
    vocabularyModalCompleted() {
      return this.currentStep?.data?.modalCompleted || false;
    },

    /**
     * Get vocabulary terms from various possible locations
     */
    vocabularyTerms() {
      if (!this.currentStep) return [];
      
      // Check content.terms first (Water Cycle format)
      if (this.currentStep.content?.terms && Array.isArray(this.currentStep.content.terms)) {
        return this.currentStep.content.terms;
      }
      
      // Check data.terms
      if (this.currentStep.data?.terms && Array.isArray(this.currentStep.data.terms)) {
        return this.currentStep.data.terms;
      }
      
      // Check data.allWords
      if (this.currentStep.data?.allWords && Array.isArray(this.currentStep.data.allWords)) {
        return this.currentStep.data.allWords;
      }
      
      // Check data directly if it's an array
      if (Array.isArray(this.currentStep.data)) {
        return this.currentStep.data;
      }
      
      return [];
    },

    /**
     * Get vocabulary count for display
     */
    getVocabularyCount() {
      return this.vocabularyTerms.length || 1;
    }
  },

  setup() {
    const { getLocalizedText, currentLanguage } = useLanguage();
    return { getLocalizedText, currentLanguage };
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
        audio: '🎵',
        game: '🎮',
        data_analysis: '📊',
        chem_matching: '🔗',
        chem_mixing: '⚗️',
        english_sentence_order: '📝',
        english_sentence_fix: '✍️',
        language_word_constellation: '🌟',
        language_noun_bag: '🎒',
        fraction_visual: '🔢',
        geometry_poly: '📐',
        histogram: '📈',
        map: '🗺️',
        'block-coding': '🧱'
      };
      return icons[stepType] || '📄';
    },

    getStepTypeText(stepType) {
      const texts = {
        explanation: 'Explanation',
        example: 'Example',
        reading: 'Reading',
        exercise: 'Exercise',
        practice: 'Practice',
        quiz: 'Quiz',
        vocabulary: 'Vocabulary',
        video: 'Video',
        audio: 'Audio',
        game: 'Game',
        data_analysis: 'Data Analysis',
        chem_matching: 'Matching',
        chem_mixing: 'Mixing',
        english_sentence_order: 'Sentence Order',
        english_sentence_fix: 'Sentence Fix',
        language_word_constellation: 'Word Constellation',
        language_noun_bag: 'Word Sort',
        fraction_visual: 'Fractions',
        geometry_poly: 'Geometry',
        histogram: 'Histogram',
        map: 'Map',
        'block-coding': 'Block Coding'
      };
      return texts[stepType] || 'Content';
    },

    /**
     * FIXED: Extract step content with full localization support
     * Handles multiple content structures including:
     * - step.content.text (Water Cycle multilingual format)
     * - step.data.content
     * - step.data.text
     * - step.content (string)
     * - step.data (string)
     * - step.description
     * - step.text
     */
    getStepContent(step) {
      if (!step) return 'Step not found';

      // Game steps - special handling
      if (step.gameType) {
        const instructions = this.getLocalizedText(step.instructions);
        const description = this.getLocalizedText(step.description);
        return instructions || description || 'Complete the game to proceed';
      }

      let content = null;

      // Priority 1: step.content.text (Water Cycle multilingual format)
      if (step.content?.text !== undefined) {
        content = step.content.text;
      }
      // Priority 2: step.data.content
      else if (step.data?.content !== undefined) {
        content = step.data.content;
      }
      // Priority 3: step.data.text
      else if (step.data?.text !== undefined) {
        content = step.data.text;
      }
      // Priority 4: step.content.content
      else if (step.content?.content !== undefined) {
        content = step.content.content;
      }
      // Priority 5: step.content as string
      else if (typeof step.content === 'string') {
        content = step.content;
      }
      // Priority 6: step.data as string
      else if (typeof step.data === 'string') {
        content = step.data;
      }
      // Priority 7: step.description
      else if (step.description !== undefined) {
        content = step.description;
      }
      // Priority 8: step.text
      else if (step.text !== undefined) {
        content = step.text;
      }

      // Apply localization if content exists
      if (content !== null && content !== undefined) {
        const localizedContent = this.getLocalizedText(content);
        
        if (localizedContent && localizedContent.trim()) {
          return localizedContent;
        }
      }

      return `Content for "${step.type}" step is not available`;
    },

    /**
     * Format content with markdown-like syntax and HTML
     */
    formatContent(content) {
      if (!content) return '';
      
      // Ensure content is a string (apply localization if needed)
      let formatted = this.getLocalizedText(content);
      
      if (typeof formatted !== 'string') {
        console.warn('formatContent received non-string:', typeof formatted);
        formatted = String(formatted || '');
      }

      if (!formatted.trim()) {
        return '';
      }

      // Process card shortcodes
      formatted = formatted.replace(
        /\[card title="(.*?)"\]([\s\S]*?)\[\/card\]/g,
        (match, title, innerContent) => {
          return `<div class="content-card"><h3 class="card-heading">${title}</h3><div class="card-content">${innerContent}</div></div>`;
        }
      );
      
      formatted = formatted.replace(
        /\[card\]([\s\S]*?)\[\/card\]/g,
        (match, innerContent) => {
          return `<div class="content-card">${innerContent}</div>`;
        }
      );

      // Markdown-like formatting
      formatted = formatted
        .replace(/^## (.*$)/gim, '<h2 class="content-h2">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="content-h3">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      return `<p>${formatted}</p>`;
    },

    /**
     * Apply AI highlights to content text
     * @param {string[]} phrases - Array of phrases to highlight
     */
    applyHighlights(phrases) {
      this.highlightPhrases = phrases || [];

      this.$nextTick(() => {
        const contentContainer = this.$el?.querySelector('.content-text');
        if (!contentContainer || !phrases || phrases.length === 0) return;

        // Remove old highlights
        const oldMarks = contentContainer.querySelectorAll('mark.ai-highlight');
        oldMarks.forEach(mark => {
          const parent = mark.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
          }
        });

        // Apply new highlights
        phrases.forEach(phrase => {
          if (!phrase || phrase.length < 3) return;

          const walker = document.createTreeWalker(
            contentContainer,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );

          const nodesToReplace = [];
          let node;

          while (node = walker.nextNode()) {
            if (node.nodeValue && node.nodeValue.includes(phrase)) {
              nodesToReplace.push(node);
            }
          }

          nodesToReplace.forEach(textNode => {
            const parts = textNode.nodeValue.split(phrase);
            const fragment = document.createDocumentFragment();

            parts.forEach((part, index) => {
              fragment.appendChild(document.createTextNode(part));
              if (index < parts.length - 1) {
                const mark = document.createElement('mark');
                mark.className = 'ai-highlight';
                mark.textContent = phrase;
                fragment.appendChild(mark);
              }
            });

            if (textNode.parentNode) {
              textNode.parentNode.replaceChild(fragment, textNode);
            }
          });
        });
      });
    },

    /**
     * Clear all AI highlights from content
     */
    clearHighlights() {
      this.highlightPhrases = [];

      this.$nextTick(() => {
        const contentContainer = this.$el?.querySelector('.content-text');
        if (!contentContainer) return;

        const marks = contentContainer.querySelectorAll('mark.ai-highlight');
        marks.forEach(mark => {
          const parent = mark.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
          }
        });
      });
    },

    /**
     * Handler for EventBus highlight-text event
     */
    handleHighlightText(phrases) {
      this.applyHighlights(phrases);
    }
  },

  mounted() {
    // Listen for highlight commands from FloatingAIAssistant
    eventBus.on('highlight-text', this.handleHighlightText);
    eventBus.on('clear-highlights', this.clearHighlights);
  },

  beforeUnmount() {
    // Clean up event listeners
    eventBus.off('highlight-text', this.handleHighlightText);
    eventBus.off('clear-highlights', this.clearHighlights);
  }
}
</script>

<style scoped>
.content-panel {
  --background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  --foreground: #1e293b;
  --card: #fff;
  --card-foreground: #334155;
  --primary: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
  --primary-solid: #7c3aed;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --muted-foreground: #64748b;
  --border: #e2e8f0;
  --radius: 0.75rem;
  --lesson-purple: #8b5cf6;
  --lesson-purple-light: #f5f3ff;
  --lesson-blue: #3b82f6;
  --lesson-blue-light: #eff6ff;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);

  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  background: var(--background);
  color: var(--foreground);
  overflow: hidden;
}

/* ============================================
   GAME MODE - COMPACT LAYOUT
   ============================================ */
.content-panel.game-mode {
  max-height: 100%;
}

.content-panel.game-mode .content-step-container {
  flex: 0 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.content-panel.game-mode .content-padding {
  padding: 1rem;
}

.content-panel.game-mode .game-intro-card {
  padding: 1rem;
}

.content-panel.game-mode .intro-header {
  margin-bottom: 0.75rem;
}

.content-panel.game-mode .intro-header h3 {
  font-size: 1rem;
}

.content-panel.game-mode .game-icon {
  font-size: 1.25rem;
}

.content-panel.game-mode .game-instructions-box h4 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.content-panel.game-mode .instruction-list {
  font-size: 0.85rem;
  line-height: 1.4;
  padding-left: 1rem;
}

.content-panel.game-mode .instruction-list li {
  margin-bottom: 2px;
}

/* Header */
.content-step-header {
  padding: 1.25rem 1.75rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.03) 100%);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header-title {
  font-size: 1.25rem;
  color: var(--foreground);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-weight: 600;
}

.step-number {
  background: var(--primary);
  color: var(--primary-foreground);
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

.step-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.step-text {
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--foreground);
}

.exercise-counter {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  font-weight: 600;
  margin-left: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 100px;
}

/* Body - SCROLLABLE */
.content-step-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-padding {
  padding: 1.5rem 1.25rem;
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

@media (min-width: 640px) {
  .content-padding {
    padding: 2rem 1.5rem;
  }
}

/* Content Text */
.content-text {
  line-height: 1.8;
  color: var(--card-foreground);
  font-size: 1.0625rem;
  max-width: 720px;
  margin: 0 auto;
  letter-spacing: -0.01em;
}

.content-text :deep(p) {
  margin-bottom: 1.25rem;
}

.content-text :deep(h2.content-h2) {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 1rem;
  margin-top: 2rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #8b5cf6, #6366f1) border-box;
  border-image-slice: 1;
  letter-spacing: -0.02em;
}

.content-text :deep(h3.content-h3) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 0.875rem;
  margin-top: 1.5rem;
  letter-spacing: -0.01em;
}

.content-text :deep(strong) {
  color: var(--foreground);
  font-weight: 700;
}

.content-text :deep(code) {
  background: linear-gradient(135deg, #f5f3ff, #eff6ff);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.875em;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* AI Highlight Styles */
.content-text :deep(.ai-highlight) {
  background-color: #fef08a;
  color: #1a1a1a;
  border-radius: 4px;
  padding: 1px 4px;
  margin: 0 -2px;
  box-shadow: 0 0 12px rgba(254, 240, 138, 0.6);
  transition: all 0.3s ease;
  animation: highlightPulse 2s ease-in-out infinite;
}

.content-text :deep(.ai-highlight:hover) {
  background-color: #fde047;
  box-shadow: 0 0 16px rgba(253, 224, 71, 0.8);
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 8px rgba(254, 240, 138, 0.4);
  }
  50% {
    box-shadow: 0 0 16px rgba(254, 240, 138, 0.8);
  }
}

/* Interactive Instruction Card */
.interactive-instruction-card {
  background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 50%, #f0fdf4 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
  box-shadow:
    0 4px 20px rgba(139, 92, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.interactive-instruction-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6, #6366f1, #3b82f6);
  border-radius: 20px 20px 0 0;
}

.instruction-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  display: inline-block;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: floatIcon 3s ease-in-out infinite;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.instruction-heading {
  margin: 0 0 1rem 0;
  color: var(--foreground);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.instruction-text {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 360px;
  margin: 0 auto;
}

/* Empty Content Card */
.empty-content-card {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border: 2px dashed #d4d4d8;
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
  display: inline-block;
}

.empty-heading {
  margin: 0 0 1rem 0;
  color: var(--foreground);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.empty-text {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 320px;
  margin: 0 auto;
}

/* Game Context View */
.game-context-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
}

.game-intro-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.game-intro-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
}

.intro-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.game-icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.intro-header h3 {
  margin: 0;
  color: #0369a1;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.game-instructions-box {
  margin-top: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
}

.game-instructions-box h4 {
  color: #0c4a6e;
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.game-instructions-text {
  color: #334155;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0;
}

.instruction-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #334155;
  font-size: 0.9rem;
  line-height: 1.6;
}

.instruction-list li {
  margin-bottom: 0.375rem;
  position: relative;
}

.instruction-list li::marker {
  color: #3b82f6;
}

/* Vocabulary */
.vocabulary-trigger {
  text-align: center;
  background: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%);
  color: white;
  padding: 3rem 2.5rem;
  border-radius: 24px;
  box-shadow:
    0 10px 40px rgba(124, 58, 237, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.vocabulary-trigger::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
  pointer-events: none;
}

.trigger-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  display: inline-block;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  animation: floatIcon 3s ease-in-out infinite;
}

.trigger-heading {
  margin: 0 0 0.75rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.trigger-subheading {
  margin: 0 0 2rem 0;
  opacity: 0.9;
  font-size: 1.125rem;
  font-weight: 500;
}

.trigger-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 1rem 2.5rem;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1.125rem;
  backdrop-filter: blur(4px);
}

.trigger-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

/* Vocabulary List View */
.vocabulary-list-view {
  max-width: 580px;
  margin: 0 auto;
}

.vocabulary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.vocabulary-header h3 {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: -0.01em;
}

.review-button {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.review-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vocabulary-item {
  background: white;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.vocabulary-item:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.12);
  transform: translateY(-2px);
}

.vocabulary-item.is-learned {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.vocab-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.625rem;
}

.vocab-term {
  font-weight: 700;
  font-size: 1.0625rem;
  color: var(--foreground);
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.pronunciation-button {
  background: rgba(139, 92, 246, 0.1);
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.8;
  transition: all 0.2s;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.pronunciation-button:hover {
  opacity: 1;
  background: rgba(139, 92, 246, 0.2);
}

.learned-badge {
  font-size: 1.125rem;
}

.vocab-definition {
  color: var(--muted-foreground);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.vocab-example {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  color: var(--muted-foreground);
  font-style: italic;
  line-height: 1.5;
}

/* Media Placeholder */
.media-placeholder {
  background: var(--secondary);
  padding: 3rem;
  border-radius: 1rem;
  border: 2px dashed var(--border);
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.media-icon {
  font-size: 3.5rem;
  margin-bottom: 1.25rem;
}

.media-title {
  margin: 0 0 1rem 0;
  color: var(--foreground);
  font-size: 1.3rem;
  font-weight: 600;
}

.media-description {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 1.1rem;
}

/* Navigation */
.content-navigation {
  padding: 1.25rem 1.75rem;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.02) 100%);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.nav-button {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  font-size: 1rem;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.prev-button {
  background: white;
  color: var(--muted-foreground);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.prev-button:hover {
  background: var(--secondary);
  color: var(--foreground);
  transform: translateX(-2px);
}

.next-button {
  background: var(--primary);
  color: var(--primary-foreground);
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
}

.next-button:hover {
  transform: translateY(-2px) translateX(2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45);
}

.next-button:active {
  transform: translateY(0);
}

/* ============================================
   MOBILE RESPONSIVE
   ============================================ */
@media (max-width: 768px) {
  .content-step-header {
    padding: 0.75rem 1rem;
  }

  .header-title {
    font-size: 1rem;
    gap: 0.5rem;
  }

  .step-number {
    width: 26px;
    height: 26px;
    font-size: 0.875rem;
  }

  .step-icon {
    font-size: 1.1rem;
  }

  .step-text {
    font-size: 0.875rem;
  }

  .content-padding {
    padding: 1rem;
  }

  .content-text {
    font-size: 0.9375rem;
    line-height: 1.6;
  }

  .interactive-instruction-card,
  .empty-content-card {
    padding: 1.5rem 1rem;
    margin: 0;
    max-width: none;
  }

  .instruction-icon,
  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }

  .instruction-heading,
  .empty-heading {
    font-size: 1.1rem;
  }

  .vocabulary-trigger {
    padding: 2rem 1.25rem;
    max-width: none;
  }

  .trigger-icon {
    font-size: 2.5rem;
  }

  .trigger-heading {
    font-size: 1.4rem;
  }

  .trigger-subheading {
    font-size: 1rem;
  }

  .content-navigation {
    padding: 0.75rem 1rem;
  }

  .nav-button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  /* Game mode on mobile - even more compact */
  .content-panel.game-mode .content-step-header {
    padding: 0.5rem 0.75rem;
  }

  .content-panel.game-mode .content-padding {
    padding: 0.75rem;
  }

  .content-panel.game-mode .game-intro-card {
    padding: 0.75rem;
  }

  .content-panel.game-mode .intro-header h3 {
    font-size: 0.9rem;
  }

  .content-panel.game-mode .game-instructions-box h4 {
    font-size: 0.8rem;
  }

  .content-panel.game-mode .instruction-list {
    font-size: 0.75rem;
  }

  .content-panel.game-mode .content-navigation {
    padding: 0.5rem 0.75rem;
  }

  .hide-on-mobile-game {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .content-step-header {
    padding: 0.625rem 0.75rem;
  }

  .header-title {
    font-size: 0.875rem;
  }

  .step-number {
    width: 22px;
    height: 22px;
    font-size: 0.75rem;
  }

  .exercise-counter {
    font-size: 0.8rem;
  }

  .content-padding {
    padding: 1rem 0.75rem;
  }

  .content-text {
    font-size: 0.875rem;
  }

  .instruction-heading,
  .empty-heading {
    font-size: 1rem;
  }

  .instruction-text,
  .empty-text {
    font-size: 0.875rem;
  }

  /* Game mode on small mobile */
  .content-panel.game-mode .header-title {
    font-size: 0.8rem;
  }

  .content-panel.game-mode .step-number {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
}

/* ============================================
   LANDSCAPE MOBILE - HIDE CONTENT FOR GAMES
   ============================================ */
@media (max-height: 500px) and (orientation: landscape) {
  .content-panel.game-mode .content-step-container {
    display: none;
  }

  .content-panel.game-mode .content-step-header {
    padding: 0.4rem 0.75rem;
  }

  .content-panel.game-mode .content-navigation {
    padding: 0.4rem 0.75rem;
  }

  .content-panel.game-mode .nav-button {
    padding: 0.4rem 0.75rem;
    min-height: 36px;
    font-size: 0.8rem;
  }
}
</style>
