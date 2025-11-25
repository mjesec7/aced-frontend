<template>
  <div class="content-panel-wrapper">
    <header class="content-step-header">
      <h3 class="header-title">
        <span class="step-number">{{ currentIndex + 1 }}</span>
        <span class="step-icon">{{ getStepIcon(currentStep?.type) }}</span>
        <span class="step-text">{{ getStepTypeText(currentStep?.type) }}</span>
        
        <span v-if="isInteractiveStep" class="exercise-counter">
          ({{ exerciseIndex + 1 }}/{{ totalExercises || 1 }})
        </span>
      </h3>
    </header>
    
    <div class="content-step-container">
      <div class="content-padding">
        
        <div v-if="isExerciseStep" class="interactive-instruction-card">
          <div class="instruction-icon">✏️</div>
          <h3 class="instruction-heading">Complete the exercise on the right</h3>
          <p class="instruction-text">
            Use the interactive panel to answer {{ totalExercisesInStep }} question(s) and continue with the lesson.
          </p>
        </div>

        <div v-else-if="isGameStep" class="game-context-view">
            <div class="game-intro-card">
                <div class="intro-header">
                    <span class="game-icon">🎮</span>
                    <h3>Game Time: {{ currentStep.title || 'Interactive Challenge' }}</h3>
                </div>

                <div class="game-instructions-box">
                    <h4>How to Play:</h4>
                    <ul class="instruction-list">
                        <li>Solve the math problem shown at the top.</li>
                        <li>Catch the <strong>correct answer</strong> in your basket.</li>
                        <li>Avoid the wrong numbers!</li>
                        <li>Complete all questions to win.</li>
                    </ul>
                </div>
            </div>

            <div class="content-text-faded" v-html="formatContent(getStepContent(currentStep))"></div>
        </div>

        <div v-else-if="isInteractiveStep && !isExerciseStep && !isGameStep" class="interactive-instruction-card">
          <div class="instruction-icon">
            {{ currentStep?.type === 'practice' ? '🧪' : '🧩' }}
          </div>
          <h3 class="instruction-heading">Complete the {{ getStepTypeText(currentStep?.type).toLowerCase() }} on the right</h3>
          <p class="instruction-text">Use the interactive panel to answer the question and continue with the lesson.</p>
        </div>

        <div v-else-if="['explanation', 'example', 'reading'].includes(currentStep?.type)" class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>

        <div v-else-if="currentStep?.type === 'vocabulary'" class="vocabulary-content">
          <div v-if="!currentStep?.data?.modalCompleted" class="vocabulary-trigger">
            <div class="trigger-icon">📚</div>
            <h3 class="trigger-heading">Vocabulary Learning</h3>
            <p class="trigger-subheading">{{ Array.isArray(currentStep?.data) ? currentStep.data.length : 1 }} new words await you!</p>
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
                v-for="(vocab, vocabIndex) in (currentStep?.data?.allWords || currentStep?.data || [])"
                :key="vocab?.id || `vocab-list-${vocabIndex}`"
                class="vocabulary-item"
                :class="{ 'is-learned': vocab?.learned }"
              >
                <div class="vocab-item-header">
                  <div class="vocab-term">
                    {{ vocab?.term || 'Term' }}
                    <button
                      v-if="vocab?.term"
                      @click="$emit('pronounce', vocab.term)"
                      class="pronunciation-button"
                      title="Pronunciation"
                    >
                      🔊
                    </button>
                  </div>
                  <div v-if="vocab?.learned" class="learned-badge">✅</div>
                </div>
                <div class="vocab-definition">{{ vocab?.definition || 'Definition' }}</div>
                <div v-if="vocab?.example" class="vocab-example">
                  <strong>Example:</strong> {{ vocab.example }}
                </div>
              </div>
            </div>

            <div class="vocabulary-summary">
              <div class="summary-stat">
                <span class="summary-number">{{ ((currentStep?.data?.allWords || []).filter(w => w?.learned) || []).length }}</span>
                <span class="summary-label">learned</span>
              </div>
              <div class="summary-stat">
                <span class="summary-number">{{ (currentStep?.data?.allWords || []).length }}</span>
                <span class="summary-label">total</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="['video', 'audio'].includes(currentStep?.type)" class="media-placeholder">
          <div class="media-icon">{{ currentStep?.type === 'video' ? '🎬' : '🎵' }}</div>
          <h4 class="media-title">{{ currentStep?.type === 'video' ? 'Video Lesson' : 'Audio Lesson' }}</h4>
          <p class="media-description">{{ currentStep?.data?.description || 'Multimedia content' }}</p>
          <div class="media-url">{{ currentStep?.data?.url || 'URL unavailable' }}</div>
        </div>

        <div v-else class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
      </div>
    </div>
    
    <footer class="content-navigation">
      <button v-if="currentIndex > 0" class="nav-button prev-button" @click="$emit('previous')">
        ⬅️ Back
      </button>
      <button
        v-if="!isInteractiveStep"
        class="nav-button next-button"
        @click="$emit('next')"
      >
        {{ isLastStep ? '🏁 Finish' : '➡️ Next' }}
      </button>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'ContentPanel',
  props: {
    currentStep: Object,
    currentIndex: Number,
    isInteractiveStep: Boolean,
    isGameStep: Boolean, // Add this
    showExplanationAlways: Boolean,
    totalExercises: Number,
    exerciseIndex: Number,
    isLastStep: Boolean,
  },
  emits: [ 'init-vocabulary', 'pronounce', 'next', 'previous' ],


  computed: {
    isExerciseStep() {
      return (this.currentStep?.type === 'exercise' || this.currentStep?.type === 'practice') &&
             !this.currentStep?.gameType;
    },
    isGameStep() {
      return this.currentStep?.type === 'game' || Boolean(this.currentStep?.gameType);
    },
    totalExercisesInStep() {
      if (!this.currentStep) return 0;

      // Check all possible data locations
      if (Array.isArray(this.currentStep.data)) {
        return this.currentStep.data.length;
      }
      if (this.currentStep.data?.exercises) {
        return this.currentStep.data.exercises.length;
      }
      if (this.currentStep.exercises) {
        return this.currentStep.exercises.length;
      }
      return 1;
    }
  },

  methods: {
    getStepIcon(stepType) {
      const icons = {
        explanation: '📚', example: '💡', reading: '📖', exercise: '✏️',
        practice: '🧪', quiz: '🧩', vocabulary: '📝', video: '🎬', audio: '🎵', game: '🎮'
      };
      return icons[stepType] || '📄';
    },
    getStepTypeText(stepType) {
      const texts = {
        explanation: 'Explanation', example: 'Example', reading: 'Reading',
        exercise: 'Exercise', practice: 'Practice', quiz: 'Quiz',
        vocabulary: 'Vocabulary', video: 'Video', audio: 'Audio', game: 'Game'
      };
      return texts[stepType] || 'Content';
    },
    getStepContent(step) {
      if (!step) {
        return 'Step not found';
      }

      // For game-type steps, return instructions
      if (step.gameType) {
        return step.instructions || step.description || 'Complete the game to proceed';
      }

      // Try multiple paths to extract content
      let content = null;

      // Path 1: step.data.content
      if (step.data?.content) {
        content = step.data.content;
      }
      // Path 2: step.data.text
      else if (step.data?.text) {
        content = step.data.text;
      }
      // Path 3: step.content.text
      else if (step.content?.text) {
        content = step.content.text;
      }
      // Path 4: step.content.content
      else if (step.content?.content) {
        content = step.content.content;
      }
      // Path 5: step.content as string
      else if (typeof step.content === 'string') {
        content = step.content;
      }
      // Path 6: step.data as string
      else if (typeof step.data === 'string') {
        content = step.data;
      }
      // Path 7: step.description
      else if (step.description) {
        content = step.description;
      }
      // Path 8: step.text
      else if (step.text) {
        content = step.text;
      }

      if (!content) {
        return `Content for "${step.type}" step is not available`;
      }

      return content;
    },
    formatContent(content) {
      if (!content) {
        return '';
      }

      let formatted = String(content);

      // Process custom tags like [card]...[/card] for styled boxes
      formatted = formatted.replace(/\[card title="(.*?)"\]([\s\S]*?)\[\/card\]/g, (match, title, innerContent) => {
        return `<div class="content-card"><h3 class="card-heading">${title}</h3><div class="card-content">${innerContent}</div></div>`;
      });
      formatted = formatted.replace(/\[card\]([\s\S]*?)\[\/card\]/g, (match, innerContent) => {
        return `<div class="content-card">${innerContent}</div>`;
      });

      // Process standard markdown
      formatted = formatted
        .replace(/^## (.*$)/gim, '<h2 class="content-h2">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="content-h3">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      return `<p>${formatted}</p>`;
    }
  }
}
</script>

<style scoped>
/* ================================ */
/* ==       THEME VARIABLES      == */
/* ================================ */
.content-panel-wrapper {
  --background: #fff;
  --foreground: #27272a;
  --card: #fff;
  --card-foreground: #27272a;
  --primary: #030213;
  --primary-foreground: #ffffff;
  --secondary: #f4f4f5;
  --muted-foreground: #71717a;
  --border: #e4e4e7;
  --radius: 0.625rem;
  --lesson-purple: #8b7cf6;
  --lesson-purple-light: #f8f7ff;
  --lesson-blue: #3b82f6;
  --lesson-blue-light: #eff6ff;
}

/* ================================ */
/* ==       MAIN LAYOUT          == */
/* ================================ */
.content-panel-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans, sans-serif);
  background-color: var(--background);
  color: var(--foreground);
}
.content-step-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px; /* Reduced padding */
}
.content-padding {
  padding: 1.5rem;
}

/* Responsive Text */
.content-text {
  font-size: clamp(1rem, 2.5vmin, 1.2rem); /* Responsive text size */
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
}

/* Game Context View */
.game-context-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.game-intro-card {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 16px;
    padding: 24px;
}

.intro-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.game-icon { font-size: 28px; }
.intro-header h3 { margin: 0; color: #0369a1; font-size: 1.2rem; }

.game-instructions-box {
    margin-top: 12px;
}

.game-instructions-box h4 {
    color: #0c4a6e;
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0 0 8px 0;
}

.instruction-list {
    margin: 0;
    padding-left: 20px;
    color: #334155;
    font-size: 0.95rem;
    line-height: 1.6;
}

.instruction-list li {
    margin-bottom: 4px;
}

.content-text-faded {
    opacity: 0.7;
    font-size: 0.9rem;
}

/* ================================ */
/* ==         HEADER             == */
/* ================================ */
.content-step-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.header-title {
  font-size: 1.25rem;
  color: var(--foreground);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}
.step-number {
  background-color: var(--primary);
  color: var(--primary-foreground);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}
.step-icon {
  font-size: 1.3rem;
}
.step-text {
  font-weight: 700;
}
.exercise-counter {
  font-size: 1rem;
  color: var(--muted-foreground);
  font-weight: 500;
  margin-left: 0.5rem;
}

/* ================================ */
/* ==      STYLED CONTENT        == */
/* ================================ */
.content-text {
  line-height: 1.7;
  color: var(--muted-foreground);
  font-size: 1rem;
}
.content-text :deep(p) {
  margin-bottom: 1rem;
}
.content-text :deep(h2.content-h2) {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}
.content-text :deep(h3.content-h3) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--card-foreground);
  margin-bottom: 0.75rem;
  margin-top: 1.25rem;
}
.content-text :deep(strong) {
  color: var(--foreground);
  font-weight: 600;
}
.content-text :deep(em) {
  font-style: italic;
}
.content-text :deep(code) {
  background-color: var(--secondary);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 0.9rem;
  color: var(--primary);
}
.content-text :deep(.content-card) {
  padding: 1rem;
  background-color: var(--secondary);
  border-left: 3px solid var(--lesson-blue);
  border-radius: var(--radius);
  margin: 1.5rem 0;
}
.content-text :deep(.card-heading) {
  color: var(--foreground);
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.content-text :deep(.card-content) {
  color: var(--muted-foreground);
}

/* ================================ */
/* ==    INTERACTIVE PROMPT      == */
/* ================================ */
.interactive-instruction-card {
  background: var(--lesson-blue-light);
  border: 2px solid var(--lesson-blue);
  border-radius: 1rem;
  padding: 2.5rem;
  text-align: center;
  max-width: 500px;
  margin: 2rem auto;
}
.instruction-icon {
  font-size: 3rem;
  margin-bottom: 1.25rem;
}
.instruction-heading {
  margin: 0 0 1rem 0;
  color: var(--foreground);
  font-size: 1.3rem;
  font-weight: 600;
}
.instruction-text {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 1rem;
  line-height: 1.5;
}

/* ================================ */
/* ==      VOCABULARY VIEW       == */
/* ================================ */
.vocabulary-trigger {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2.25rem;
  border-radius: 1.25rem;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}
.trigger-icon {
  font-size: 3.5rem;
  margin-bottom: 1.25rem;
}
.trigger-heading {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  font-weight: 700;
}
.trigger-subheading {
  margin: 0 0 1.75rem 0;
  opacity: 0.9;
  font-size: 1.2rem;
}
.trigger-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
}
.trigger-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}
.vocabulary-list-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.vocabulary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid var(--border);
}
.vocabulary-header h3 {
  margin: 0;
  color: var(--foreground);
  font-size: 1.5rem;
  font-weight: 700;
}
.review-button {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;
}
.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.vocabulary-item {
  background: var(--card);
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.vocabulary-item.is-learned {
  border-color: var(--lesson-blue);
  background: var(--lesson-blue-light);
}
.vocab-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.vocab-term {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--foreground);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.pronunciation-button {
  background: var(--secondary);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}
.pronunciation-button:hover {
  background: var(--border);
  transform: scale(1.1);
}
.learned-badge {
  color: var(--lesson-blue);
  font-size: 1.4rem;
}
.vocab-definition {
  font-size: 1.2rem;
  color: var(--muted-foreground);
  margin-bottom: 0.75rem;
  line-height: 1.6;
}
.vocab-example {
  font-size: 1.1rem;
  color: var(--muted-foreground);
  font-style: italic;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  margin-top: 0.75rem;
}
.vocabulary-summary {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  padding: 1.5rem;
  background: var(--lesson-blue-light);
  border-radius: 0.75rem;
  border: 1px solid var(--lesson-blue);
}
.summary-stat {
  text-align: center;
}
.summary-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--lesson-blue);
  display: block;
}
.summary-label {
  font-size: 1rem;
  color: var(--muted-foreground);
  margin-top: 6px;
  font-weight: 500;
}
/* ================================ */
/* ==      MEDIA PLACEHOLDER     == */
/* ================================ */
.media-placeholder {
  background: var(--secondary);
  padding: 3rem;
  border-radius: 1rem;
  border: 2px dashed var(--border);
  text-align: center;
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
  margin: 0 0 1.25rem 0;
  color: var(--muted-foreground);
  font-size: 1.1rem;
}
.media-url {
  font-size: 1rem;
  color: var(--muted-foreground);
  font-family: var(--font-mono, monospace);
  background: var(--background);
  padding: 0.75rem;
  border-radius: 4px;
}
/* ================================ */
/* ==       NAVIGATION           == */
/* ================================ */
.content-navigation {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}
.nav-button {
  padding: 0.6rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  flex: 1;
  font-size: 1rem;
}
.prev-button {
  background-color: var(--secondary);
  color: var(--muted-foreground);
  border-color: var(--border);
}
.prev-button:hover {
  background-color: var(--border);
}
.next-button {
  background-color: var(--primary);
  color: var(--primary-foreground);
}
.next-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
</style>