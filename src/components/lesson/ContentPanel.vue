<template>
  <div class="content-panel">
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
          <h3 class="instruction-heading">Complete the exercise on the right</h3>
          <p class="instruction-text">
            Use the interactive panel to answer the question and continue with the lesson.
          </p>
        </div>

        <!-- GAME STEPS -->
        <div v-else-if="isGameStep" class="game-context-view">
          <div class="game-intro-card">
            <div class="intro-header">
              <span class="game-icon">🎮</span>
              <h3>Game Time: {{ currentStep.title || 'Interactive Challenge' }}</h3>
            </div>

            <div class="game-instructions-box">
              <h4>How to Play:</h4>
              <ul class="instruction-list">
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
          <h3 class="instruction-heading">Interactive Exercise</h3>
          <p class="instruction-text">Complete the interactive exercise on the right to continue.</p>
        </div>

        <!-- OTHER INTERACTIVE STEPS -->
        <div v-else-if="isInteractiveStep && !isExerciseStep && !isGameStep" class="interactive-instruction-card">
          <div class="instruction-icon">{{ currentStep?.type === 'practice' ? '🧪' : '🧩' }}</div>
          <h3 class="instruction-heading">Complete the {{ getStepTypeText(currentStep?.type).toLowerCase() }} on the right</h3>
          <p class="instruction-text">Use the interactive panel to complete this activity.</p>
        </div>

        <!-- VOCABULARY -->
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
          </div>
        </div>

        <!-- MEDIA PLACEHOLDER -->
        <div v-else-if="['video', 'audio'].includes(currentStep?.type)" class="media-placeholder">
          <div class="media-icon">{{ currentStep?.type === 'video' ? '🎬' : '🎵' }}</div>
          <h4 class="media-title">{{ currentStep?.type === 'video' ? 'Video Lesson' : 'Audio Lesson' }}</h4>
          <p class="media-description">{{ currentStep?.data?.description || 'Multimedia content' }}</p>
        </div>

        <!-- DEFAULT CONTENT -->
        <div v-else class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
      </div>
    </div>
    
    <footer class="content-navigation">
      <button v-if="currentIndex > 0" class="nav-button prev-button" @click="$emit('previous')">
        ⬅️ Back
      </button>
      <button
        v-if="!isInteractiveStep || hasEmptyContent"
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
    isGameStep: Boolean,
    showExplanationAlways: Boolean,
    totalExercises: Number,
    exerciseIndex: Number,
    isLastStep: Boolean,
  },
  emits: ['init-vocabulary', 'pronounce', 'next', 'previous'],

  computed: {
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
        'language_noun_bag', 'geometry', 'selection_game'
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
      if (!step) return 'Step not found';
      if (step.gameType) return step.instructions || step.description || 'Complete the game to proceed';

      let content = null;
      if (step.data?.content) content = step.data.content;
      else if (step.data?.text) content = step.data.text;
      else if (step.content?.text) content = step.content.text;
      else if (step.content?.content) content = step.content.content;
      else if (typeof step.content === 'string') content = step.content;
      else if (typeof step.data === 'string') content = step.data;
      else if (step.description) content = step.description;
      else if (step.text) content = step.text;

      if (!content) return `Content for "${step.type}" step is not available`;
      return content;
    },
    formatContent(content) {
      if (!content) return '';
      let formatted = String(content);

      formatted = formatted.replace(/\[card title="(.*?)"\]([\s\S]*?)\[\/card\]/g, (match, title, innerContent) => {
        return `<div class="content-card"><h3 class="card-heading">${title}</h3><div class="card-content">${innerContent}</div></div>`;
      });
      formatted = formatted.replace(/\[card\]([\s\S]*?)\[\/card\]/g, (match, innerContent) => {
        return `<div class="content-card">${innerContent}</div>`;
      });

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
.content-panel {
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

  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans, sans-serif);
  background-color: var(--background);
  color: var(--foreground);
  overflow: hidden; /* CRITICAL: Prevent any overflow */
}

/* Header */
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

/* Body - NO SCROLL */
.content-step-container {
  flex: 1;
  overflow: hidden; /* CRITICAL: No scroll here */
  display: flex;
  flex-direction: column;
}

.content-padding {
  padding: 2rem 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center content vertically */
  overflow: hidden; /* CRITICAL: No scroll */
}

/* Content Text */
.content-text {
  line-height: 1.7;
  color: var(--muted-foreground);
  font-size: 1rem;
  max-width: 800px;
  margin: 0 auto;
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

/* Interactive Instruction Card */
.interactive-instruction-card {
  background: var(--lesson-blue-light);
  border: 2px solid var(--lesson-blue);
  border-radius: 1rem;
  padding: 2.5rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
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

/* Empty Content Card */
.empty-content-card {
  background: var(--secondary);
  border: 2px dashed var(--border);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1.25rem;
  opacity: 0.7;
}

.empty-heading {
  margin: 0 0 1rem 0;
  color: var(--foreground);
  font-size: 1.3rem;
  font-weight: 600;
}

.empty-text {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 1rem;
  line-height: 1.5;
}

/* Game Context View */
.game-context-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
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

.game-icon {
  font-size: 28px;
}

.intro-header h3 {
  margin: 0;
  color: #0369a1;
  font-size: 1.2rem;
}

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

/* Vocabulary */
.vocabulary-trigger {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2.25rem;
  border-radius: 1.25rem;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  max-width: 500px;
  margin: 0 auto;
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