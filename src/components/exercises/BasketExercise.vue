<template>
  <div class="basket-exercise">
    <!-- View Mode Toggle (for demo) -->
    <div class="view-toggle mb-4">
      <button
        @click="viewMode = 'explanation'"
        :class="['toggle-btn', { active: viewMode === 'explanation' }]"
      >
        <span class="icon">📚</span>
        Explanation
      </button>
      <button
        @click="viewMode = 'exercise'"
        :class="['toggle-btn', { active: viewMode === 'exercise' }]"
      >
        <span class="icon">🎯</span>
        Exercise
      </button>
    </div>

    <!-- Explanation View -->
    <div v-if="viewMode === 'explanation'" class="explanation-card">
      <div class="card-header">
        <div class="lesson-badge">
          <div class="badge-icon">📚</div>
          <div>
            <h2 class="lesson-title">Lesson 3.2</h2>
            <p class="lesson-subtitle">Multiplication Concept</p>
          </div>
        </div>
        <span class="type-badge">Explanation</span>
      </div>

      <!-- Main Explanation -->
      <div class="explanation-content">
        <div class="learning-objective">
          <p>Learning Objective</p>
        </div>
        <h3 class="content-title">Multiplication Trick: Break It Down</h3>
        <p class="content-description">
          When multiplying larger numbers like 7 × 8, you can make it easier by breaking them down into simpler calculations you already know!
        </p>
      </div>

      <!-- Visual Example -->
      <div class="visual-example">
        <div class="example-header">
          <span class="sparkles-icon">✨</span>
          <div>
            <h4 class="example-title">Example: 7 × 8</h4>
            <p class="example-subtitle">Let's break this down step by step:</p>
          </div>
        </div>

        <div class="steps-container">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <p><strong>Start with a round number:</strong> 7 × 10 = <span class="highlight-purple">70</span></p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <p><strong>We went too far by:</strong> 7 × 2 = <span class="highlight-orange">14</span></p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <p><strong>Subtract to get the answer:</strong> 70 - 14 = <span class="highlight-green">56</span></p>
            </div>
          </div>
        </div>

        <div class="result-box">
          <p><strong>Result:</strong> <span class="result-text">7 × 8 = 56</span> ✓</p>
        </div>
      </div>

      <!-- Key Takeaway -->
      <div class="key-takeaway">
        <div class="takeaway-icon">💡</div>
        <div>
          <h4 class="takeaway-title">Key Takeaway</h4>
          <p class="takeaway-text">
            You can multiply by breaking numbers into easier chunks. Multiply by 10, then subtract what you overcounted!
          </p>
        </div>
      </div>

      <button @click="handleContinueFromExplanation" class="continue-btn">
        Got it! Let's Practice
        <span class="arrow-icon">→</span>
      </button>
    </div>

    <!-- Exercise View -->
    <div v-else class="exercise-card">
      <div class="card-header">
        <div class="lesson-badge">
          <div class="badge-icon">⭐</div>
          <div>
            <h2 class="lesson-title">Question 7</h2>
            <p class="lesson-subtitle">Basket Challenge</p>
          </div>
        </div>
        <span class="type-badge interactive">Interactive</span>
      </div>

      <!-- Question -->
      <div class="question-content">
        <div class="question-type">Drag & Drop</div>
        <h3 class="question-title">What is 7 × 8?</h3>
        <p class="question-description">Drag the correct answer into the basket below</p>
      </div>

      <!-- Basket Area -->
      <div class="basket-area">
        <div
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          :class="['basket', {
            'basket-hover': isDragOver && !droppedAnswer,
            'basket-correct': droppedAnswer && isCorrect,
            'basket-incorrect': droppedAnswer && isCorrect === false
          }]"
        >
          <!-- Basket SVG -->
          <svg class="basket-svg" width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 45L30 90C30 95 35 100 40 100H80C85 100 90 95 90 90L100 45H20Z" stroke="currentColor" strokeWidth="4"/>
            <path d="M15 45H105" stroke="currentColor" strokeWidth="4"/>
            <circle cx="60" cy="60" r="25" stroke="currentColor" strokeWidth="3" strokeDasharray="4 4"/>
          </svg>

          <div class="basket-content">
            <div v-if="!droppedAnswer" class="basket-empty">
              <p :class="['basket-text', { active: isDragOver }]">
                {{ isDragOver ? 'Drop here!' : 'Drag your answer here' }}
              </p>
              <p class="basket-hint">Put the correct number in the basket</p>
            </div>
            <div v-else class="basket-filled">
              <div v-if="isCorrect" class="result-icon success">✓</div>
              <div v-else class="result-icon error">✗</div>
              <p class="result-message">
                {{ isCorrect ? 'Perfect! 🎉' : 'Try again!' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Answer Options -->
      <div class="answer-options">
        <div
          v-for="answer in answers"
          :key="answer.number"
          @dragstart="handleDragStart(answer)"
          @dragend="handleDragEnd"
          :draggable="!usedNumbers.has(answer.number)"
          :class="['answer-option', {
            'answer-used': usedNumbers.has(answer.number),
            'answer-dragging': isDragging && currentDragNumber === answer.number
          }]"
        >
          <span class="answer-number">{{ answer.number }}</span>
          <span v-if="!usedNumbers.has(answer.number)" class="sparkle">✨</span>
        </div>
      </div>

      <!-- Feedback -->
      <div v-if="isCorrect !== null" :class="['feedback', isCorrect ? 'feedback-success' : 'feedback-error']">
        <div class="feedback-icon">
          {{ isCorrect ? '✓' : '✗' }}
        </div>
        <div class="feedback-content">
          <h4 class="feedback-title">
            {{ isCorrect ? 'Excellent Work! 🎉' : 'Not quite! Try again' }}
          </h4>
          <p class="feedback-text">
            {{ isCorrect
              ? `Perfect! 7 × 8 = 56. You earned +${attempts === 1 ? 50 : 25} points!`
              : 'That\'s not correct. Remember: (7 × 10) - (7 × 2) = 70 - 14 = 56'
            }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button
          v-if="!isCorrect && droppedAnswer"
          @click="handleReset"
          class="reset-btn"
        >
          <span class="icon">↻</span>
          Try Again
        </button>
        <button
          v-if="isCorrect"
          @click="handleContinue"
          class="continue-btn success"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BasketExercise',
  props: {
    initialViewMode: {
      type: String,
      default: 'explanation'
    }
  },
  emits: ['score-update', 'streak-update', 'continue'],
  data() {
    return {
      viewMode: this.initialViewMode,
      droppedAnswer: null,
      isCorrect: null,
      usedNumbers: new Set(),
      attempts: 0,
      correctAnswer: 56,
      isDragOver: false,
      isDragging: false,
      currentDragNumber: null,
      answers: [
        { number: 48, isCorrect: false },
        { number: 54, isCorrect: false },
        { number: 56, isCorrect: true },
        { number: 63, isCorrect: false },
      ]
    };
  },
  methods: {
    handleContinueFromExplanation() {
      this.viewMode = 'exercise';
    },
    handleDragStart(answer) {
      this.isDragging = true;
      this.currentDragNumber = answer.number;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('answer', JSON.stringify(answer));
    },
    handleDragEnd() {
      this.isDragging = false;
      this.currentDragNumber = null;
    },
    handleDragOver(event) {
      if (this.droppedAnswer) return;
      event.preventDefault();
      this.isDragOver = true;
    },
    handleDragLeave() {
      this.isDragOver = false;
    },
    handleDrop(event) {
      if (this.droppedAnswer) return;
      event.preventDefault();
      this.isDragOver = false;

      const answer = JSON.parse(event.dataTransfer.getData('answer'));
      this.droppedAnswer = answer.number;
      this.usedNumbers.add(answer.number);
      this.attempts++;

      if (answer.isCorrect) {
        this.isCorrect = true;
        const points = this.attempts === 1 ? 50 : 25;
        this.$emit('score-update', points);
        this.$emit('streak-update', 1);
      } else {
        this.isCorrect = false;
        this.$emit('streak-update', -1);
      }
    },
    handleReset() {
      this.droppedAnswer = null;
      this.isCorrect = null;
    },
    handleContinue() {
      this.$emit('continue');
    }
  }
};
</script>

<style scoped>
.basket-exercise {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.25rem;
  border-radius: 0.5rem;
  width: fit-content;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-btn .icon {
  font-size: 0.875rem;
}

/* Card Styles */
.explanation-card,
.exercise-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.lesson-badge {
  display: flex;
  gap: 0.5rem;
}

.badge-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.lesson-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.lesson-subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  background: #f3f4f6;
  color: #6b7280;
  font-weight: 500;
}

.type-badge.interactive {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: white;
}

/* Explanation Content */
.explanation-content {
  margin-bottom: 1.5rem;
}

.learning-objective {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.content-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.content-description {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

/* Visual Example */
.visual-example {
  background: linear-gradient(135deg, #eff6ff, #f5f3ff);
  border: 1px solid #dbeafe;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.example-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sparkles-icon {
  font-size: 1.25rem;
}

.example-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.example-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.step-number {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #8b5cf6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  background: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.step-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #111827;
}

.highlight-purple {
  font-weight: 700;
  color: #8b5cf6;
}

.highlight-orange {
  font-weight: 700;
  color: #f97316;
}

.highlight-green {
  font-weight: 700;
  color: #10b981;
}

.result-box {
  margin-top: 1rem;
  padding: 1rem;
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  border-radius: 0.5rem;
  text-align: center;
}

.result-box p {
  margin: 0;
  font-size: 0.875rem;
  color: #065f46;
}

.result-text {
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
}

/* Key Takeaway */
.key-takeaway {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.takeaway-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.takeaway-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #78350f;
}

.takeaway-text {
  margin: 0;
  font-size: 0.875rem;
  color: #92400e;
  line-height: 1.5;
}

/* Question Content */
.question-content {
  margin-bottom: 1.5rem;
}

.question-type {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: #d1fae5;
  color: #065f46;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  margin-bottom: 0.75rem;
}

.question-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.question-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Basket Area */
.basket-area {
  margin-bottom: 1.5rem;
}

.basket {
  position: relative;
  min-height: 200px;
  border: 4px dashed #d1d5db;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  background: #f9fafb;
}

.basket.basket-hover {
  border-color: #3b82f6;
  background: #dbeafe;
  transform: scale(1.02);
}

.basket.basket-correct {
  border-color: #10b981;
  background: #d1fae5;
}

.basket.basket-incorrect {
  border-color: #ef4444;
  background: #fee2e2;
}

.basket-svg {
  position: absolute;
  opacity: 0.2;
  pointer-events: none;
  color: #9ca3af;
}

.basket-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 1.5rem;
}

.basket-empty .basket-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.basket-empty .basket-text.active {
  color: #3b82f6;
}

.basket-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

.basket-filled {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.result-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.result-icon.success {
  background: #10b981;
  color: white;
}

.result-icon.error {
  background: #ef4444;
  color: white;
}

.result-message {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.result-icon.success + .result-message {
  color: #065f46;
}

.result-icon.error + .result-message {
  color: #991b1b;
}

/* Answer Options */
.answer-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.answer-option {
  position: relative;
  padding: 1rem 1.5rem;
  border: 2px solid #bfdbfe;
  background: linear-gradient(135deg, #eff6ff, #eef2ff);
  border-radius: 0.75rem;
  text-align: center;
  cursor: move;
  transition: all 0.2s;
  user-select: none;
}

.answer-option:not(.answer-used):hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.answer-option.answer-used {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: #e5e7eb;
  background: #f3f4f6;
}

.answer-option.answer-dragging {
  opacity: 0.5;
  transform: rotate(6deg) scale(1.1);
}

.answer-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e40af;
}

.answer-option.answer-used .answer-number {
  color: #9ca3af;
}

.sparkle {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  font-size: 1rem;
}

/* Feedback */
.feedback {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.feedback.feedback-success {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
}

.feedback.feedback-error {
  background: #fed7aa;
  border: 1px solid #fdba74;
}

.feedback-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.feedback.feedback-success .feedback-icon {
  color: #059669;
}

.feedback.feedback-error .feedback-icon {
  color: #ea580c;
}

.feedback-content {
  flex: 1;
}

.feedback-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.feedback.feedback-success .feedback-title {
  color: #065f46;
}

.feedback.feedback-error .feedback-title {
  color: #7c2d12;
}

.feedback-text {
  margin: 0;
  font-size: 0.875rem;
}

.feedback.feedback-success .feedback-text {
  color: #047857;
}

.feedback.feedback-error .feedback-text {
  color: #9a3412;
}

/* Buttons */
.continue-btn,
.reset-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.continue-btn {
  background: #3b82f6;
  color: white;
}

.continue-btn:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.continue-btn.success {
  background: linear-gradient(135deg, #059669, #10b981);
}

.continue-btn.success:hover {
  background: linear-gradient(135deg, #047857, #059669);
}

.reset-btn {
  background: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.reset-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.action-buttons > * {
  flex: 1;
}

.arrow-icon,
.icon {
  font-size: 1rem;
}

@media (max-width: 640px) {
  .explanation-card,
  .exercise-card {
    padding: 1.5rem;
  }

  .answer-options {
    grid-template-columns: repeat(2, 1fr);
  }

  .question-title {
    font-size: 1.25rem;
  }
}
</style>
