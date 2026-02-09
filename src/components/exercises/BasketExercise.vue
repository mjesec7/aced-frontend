<template>
  <div class="basket-exercise-container">
    <!-- Tab Buttons -->
    <div class="tab-buttons">
      <button
        :class="['tab-btn', { active: viewMode === 'explanation' }]"
        @click="viewMode = 'explanation'"
      >
        📖 Explanation
      </button>
      <button
        :class="['tab-btn', { active: viewMode === 'exercise' }]"
        @click="viewMode = 'exercise'"
      >
        🎯 Exercise
      </button>
    </div>

    <!-- Explanation View -->
    <div v-show="viewMode === 'explanation'" class="view-content">
      <div class="lesson-header">
        <div class="lesson-info">
          <div class="lesson-icon">📖</div>
          <div class="lesson-details">
            <h3>Lesson 3.2</h3>
            <p>Multiplication Concept</p>
          </div>
        </div>
        <span class="explanation-badge">Explanation</span>
      </div>

      <span class="learning-objective">Learning Objective</span>

      <div class="content-section">
        <h2>Multiplication Trick: Break It Down</h2>
        <p>When multiplying larger numbers like 7 × 8, you can make it easier by breaking them down into simpler calculations you already know!</p>
      </div>

      <div class="example-box">
        <div class="example-header">
          <span class="example-icon">✨</span>
          <h4>Example: 7 × 8</h4>
        </div>
        <p class="example-description">Let's break this down step by step:</p>

        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-content">
            <strong>Start with a round number:</strong> 7 × 10 = <span class="highlight">70</span>
          </div>
        </div>

        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-content">
            <strong>We went too far by:</strong> 7 × 2 = <span class="highlight-orange">14</span>
          </div>
        </div>

        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-content">
            <strong>Subtract the extra:</strong> 70 - 14 = <span class="highlight">56</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Exercise View -->
    <div v-show="viewMode === 'exercise'" class="view-content">
      <div class="question-header">
        <div class="question-info">
          <div class="question-icon">⭐</div>
          <div class="question-details">
            <h3>Question 7</h3>
            <p>Basket Challenge</p>
          </div>
        </div>
        <span class="interactive-badge">Interactive</span>
      </div>

      <span class="drag-drop-badge">Drag & Drop</span>

      <h2 class="question-text">What is 7 × 8?</h2>
      <p class="instruction-text">Drag the correct answer into the basket below</p>

      <!-- Basket Area -->
      <div
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        :class="['basket-area', {
          'basket-hover': isDragOver && !droppedAnswer,
          'basket-correct': droppedAnswer && isCorrect,
          'basket-incorrect': droppedAnswer && isCorrect === false
        }]"
      >
        <svg class="basket-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M20 45L30 90C30 95 35 100 40 100H80C85 100 90 95 90 90L100 45H20Z" stroke="currentColor" stroke-width="4"/>
          <path d="M15 45H105" stroke="currentColor" stroke-width="4"/>
          <circle cx="60" cy="60" r="25" stroke="currentColor" stroke-width="3" stroke-dasharray="4 4"/>
        </svg>

        <div class="basket-content">
          <div v-if="!droppedAnswer" class="empty-state">
            <p :class="['drop-text', { active: isDragOver }]">
              {{ isDragOver ? 'Drop here!' : 'Drag answer here' }}
            </p>
          </div>
          <div v-else class="filled-state">
            <div v-if="isCorrect" class="success-icon">✓</div>
            <div v-else class="error-icon">✗</div>
            <p class="result-text">{{ isCorrect ? 'Perfect! 🎉' : 'Try again!' }}</p>
          </div>
        </div>
      </div>

      <!-- Answer Options -->
      <div class="answer-grid">
        <div
          v-for="answer in answers"
          :key="answer.number"
          @dragstart="handleDragStart(answer)"
          @dragend="handleDragEnd"
          :draggable="!usedNumbers.has(answer.number)"
          :class="['answer-option', {
            'used': usedNumbers.has(answer.number),
            'dragging': isDragging && currentDragNumber === answer.number
          }]"
        >
          <span class="answer-number">{{ answer.number }}</span>
        </div>
      </div>

      <!-- Feedback -->
      <div v-if="isCorrect !== null" :class="['feedback-box', isCorrect ? 'success' : 'error']">
        <div class="feedback-icon">{{ isCorrect ? '✓' : '✗' }}</div>
        <div class="feedback-content">
          <h4>{{ isCorrect ? 'Excellent Work! 🎉' : 'Not quite! Try again' }}</h4>
          <p>
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
          class="btn-reset"
        >
          ↻ Try Again
        </button>
        <button
          v-if="isCorrect"
          @click="handleContinue"
          class="btn-continue"
        >
          Continue →
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
.basket-exercise-container {
  width: 100%;
}

/* Tab Buttons */
.tab-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  color: #666;
}

.tab-btn.active {
  background: #333;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #e5e5e5;
}

.view-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Explanation View */
.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.lesson-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.lesson-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.lesson-details h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.lesson-details p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.explanation-badge {
  background: #f5f5f5;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
}

.learning-objective {
  background: #e8eaf6;
  color: #5c6bc0;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 20px;
}

.content-section h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
}

.content-section p {
  font-size: 16px;
  color: #555;
  line-height: 1.6;
  margin: 0 0 30px 0;
}

.example-box {
  background: #f8f9fc;
  border-radius: 12px;
  padding: 25px;
  margin-top: 20px;
}

.example-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.example-icon {
  font-size: 24px;
}

.example-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.example-description {
  font-size: 15px;
  color: #555;
  margin: 0 0 20px 0;
}

.step-item {
  background: white;
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 12px;
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.step-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  font-size: 15px;
  color: #333;
  line-height: 1.5;
}

.step-content strong {
  color: #333;
  font-weight: 600;
}

.highlight {
  color: #667eea;
  font-weight: 600;
}

.highlight-orange {
  color: #ff6b35;
  font-weight: 600;
}

/* Exercise View */
.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.question-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.question-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.question-details h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.question-details p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.interactive-badge {
  background: linear-gradient(135deg, #c026d3 0%, #9333ea 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.drag-drop-badge {
  background: #d1fae5;
  color: #065f46;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 20px;
}

.question-text {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
}

.instruction-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px 0;
}

/* Basket Area */
.basket-area {
  position: relative;
  min-height: 200px;
  border: 3px dashed #d1d5db;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  background: #f9fafb;
  margin-bottom: 30px;
}

.basket-area.basket-hover {
  border-color: #3b82f6;
  background: #dbeafe;
  transform: scale(1.02);
}

.basket-area.basket-correct {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.basket-area.basket-incorrect {
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
  padding: 40px;
}

.empty-state .drop-text {
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
}

.empty-state .drop-text.active {
  color: #3b82f6;
  font-size: 18px;
}

.filled-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.success-icon,
.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  color: white;
}

.success-icon {
  background: #10b981;
}

.error-icon {
  background: #ef4444;
}

.result-text {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.basket-correct .result-text {
  color: #065f46;
}

.basket-incorrect .result-text {
  color: #991b1b;
}

/* Answer Options */
.answer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.answer-option {
  padding: 20px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 12px;
  text-align: center;
  cursor: move;
  transition: all 0.2s;
  user-select: none;
}

.answer-option:not(.used):hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
}

.answer-option.used {
  opacity: 0.3;
  cursor: not-allowed;
  background: #f3f4f6;
}

.answer-option.dragging {
  opacity: 0.5;
  transform: rotate(6deg) scale(1.1);
}

.answer-number {
  font-size: 32px;
  font-weight: 700;
  color: #333;
}

.answer-option.used .answer-number {
  color: #9ca3af;
}

/* Feedback */
.feedback-box {
  display: flex;
  gap: 15px;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.feedback-box.success {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.feedback-box.error {
  background: #fed7aa;
  border: 2px solid #f97316;
}

.feedback-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
}

.feedback-box.success .feedback-icon {
  background: #10b981;
  color: white;
}

.feedback-box.error .feedback-icon {
  background: #f97316;
  color: white;
}

.feedback-content {
  flex: 1;
}

.feedback-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.feedback-box.success .feedback-content h4 {
  color: #065f46;
}

.feedback-box.error .feedback-content h4 {
  color: #7c2d12;
}

.feedback-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.feedback-box.success .feedback-content p {
  color: #047857;
}

.feedback-box.error .feedback-content p {
  color: #9a3412;
}

/* Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
}

.btn-reset,
.btn-continue {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-reset {
  background: white;
  color: #666;
  border: 2px solid #e5e7eb;
}

.btn-reset:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-continue {
  background: #333;
  color: white;
}

.btn-continue:hover {
  background: #555;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .answer-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .question-text {
    font-size: 24px;
  }

  .basket-content {
    padding: 20px;
  }

  .lesson-header,
  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
