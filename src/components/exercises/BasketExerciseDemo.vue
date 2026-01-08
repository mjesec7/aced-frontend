<template>
  <div class="demo-container">
    <!-- Header with Stats -->
    <header class="demo-header">
      <div class="header-content">
        <div class="lesson-info">
          <button class="close-btn">✕</button>
          <div class="progress-info">
            <div class="badges">
              <span class="badge">Lesson 3</span>
              <span class="lesson-name">Times Tables 6-9</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
              <span class="progress-text">{{ currentQuestion }}/{{ totalQuestions }}</span>
            </div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-item streak">
            <span class="stat-icon">⚡</span>
            <span class="stat-value">{{ streak }}</span>
          </div>
          <div class="stat-item score">
            <span class="stat-icon">🏆</span>
            <span class="stat-value">{{ score }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <div class="content-wrapper">
        <!-- Left Column: BasketExercise -->
        <div class="left-column">
          <BasketExercise
            :initial-view-mode="viewMode"
            @score-update="handleScoreUpdate"
            @streak-update="handleStreakUpdate"
            @continue="handleContinue"
          />
        </div>

        <!-- Right Column: Sidebar -->
        <div class="right-column">
          <div class="sidebar-sticky">
            <!-- Concept Card -->
            <div class="concept-card">
              <div class="concept-header">
                <div class="concept-icon">⭐</div>
                <h3>Multiplication Trick</h3>
              </div>
              <div class="concept-content">
                <div class="concept-example">
                  <p class="example-label">For 7 × 8:</p>
                  <p class="example-steps">
                    Think: 7 × 10 = 70<br>
                    Subtract: 7 × 2 = 14<br>
                    Answer: 70 - 14 = <strong>56</strong>
                  </p>
                </div>
                <p class="concept-description">
                  Breaking down larger multiplications into simpler steps makes them easier to solve!
                </p>
              </div>
            </div>

            <!-- Stats Card -->
            <div class="stats-card">
              <h3 class="stats-title">Your Stats</h3>
              <div class="stats-list">
                <div class="stat-row">
                  <div class="stat-label">
                    <span class="stat-icon-mini">🏆</span>
                    Total Score
                  </div>
                  <span class="stat-number">{{ score }}</span>
                </div>
                <div class="stat-row">
                  <div class="stat-label">
                    <span class="stat-icon-mini">⚡</span>
                    Current Streak
                  </div>
                  <span class="stat-number">{{ streak }} 🔥</span>
                </div>
                <div class="stat-row">
                  <div class="stat-label">
                    <span class="stat-icon-mini">🎯</span>
                    Accuracy
                  </div>
                  <span class="stat-number">87%</span>
                </div>
              </div>
            </div>

            <!-- Quick Tip -->
            <div class="tip-card">
              <div class="tip-header">
                <span class="tip-emoji">💡</span>
                <h4>Pro Tip</h4>
              </div>
              <p class="tip-text">
                {{ viewMode === 'explanation'
                  ? 'Read through the explanation carefully - understanding the concept will help you solve problems faster!'
                  : 'Drag the correct answer into the basket. First attempts earn more points!'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BasketExercise from './BasketExercise.vue';

export default {
  name: 'BasketExerciseDemo',
  components: {
    BasketExercise
  },
  data() {
    return {
      viewMode: 'explanation',
      score: 245,
      streak: 3,
      currentQuestion: 7,
      totalQuestions: 20
    };
  },
  computed: {
    progressPercent() {
      return (this.currentQuestion / this.totalQuestions) * 100;
    }
  },
  methods: {
    handleScoreUpdate(points) {
      this.score += points;
    },
    handleStreakUpdate(change) {
      if (change > 0) {
        this.streak += change;
      } else {
        this.streak = 0;
      }
    },
    handleContinue() {
      // Move to next question
      this.currentQuestion++;
      alert('Moving to next question...');
    }
  }
};
</script>

<style scoped>
.demo-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 50%, #fce7f3 100%);
  display: flex;
  flex-direction: column;
}

/* Header */
.demo-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.lesson-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f3f4f6;
}

.progress-info {
  flex: 1;
  min-width: 0;
}

.badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.badge {
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.25rem;
}

.lesson-name {
  font-size: 0.75rem;
  color: #6b7280;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  height: 0.375rem;
  background: #3b82f6;
  border-radius: 0.25rem;
  transition: width 0.3s;
  position: relative;
  flex: 1;
  max-width: 180px;
  background-color: #e5e7eb;
}

.progress-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--progress, 35%);
  background: #3b82f6;
  border-radius: 0.25rem;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}

.stats {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
}

.stat-item.streak {
  background: #fffbeb;
}

.stat-item.score {
  background: #f5f3ff;
}

.stat-icon {
  font-size: 0.875rem;
}

.stat-value {
  font-size: 0.75rem;
  font-weight: 600;
}

.stat-item.streak .stat-value {
  color: #92400e;
}

.stat-item.score .stat-value {
  color: #6b21a8;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow: auto;
}

.content-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
}

.left-column {
  min-width: 0;
}

.right-column {
  position: relative;
}

.sidebar-sticky {
  position: sticky;
  top: 5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Concept Card */
.concept-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.concept-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.concept-icon {
  width: 1.5rem;
  height: 1.5rem;
  background: #f5f3ff;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.concept-header h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.concept-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.concept-example {
  background: #f5f3ff;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.example-label {
  margin: 0 0 0.25rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b21a8;
}

.example-steps {
  margin: 0;
  font-size: 0.75rem;
  color: #581c87;
  line-height: 1.5;
}

.concept-description {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.5;
}

/* Stats Card */
.stats-card {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 0.75rem;
  padding: 1.25rem;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stats-title {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.stat-icon-mini {
  font-size: 1rem;
}

.stat-number {
  font-size: 1rem;
  font-weight: 700;
}

/* Tip Card */
.tip-card {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 1rem;
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tip-emoji {
  font-size: 1rem;
}

.tip-header h4 {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #78350f;
}

.tip-text {
  margin: 0;
  font-size: 0.75rem;
  color: #92400e;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .sidebar-sticky {
    position: static;
  }

  .right-column {
    order: -1;
  }
}

@media (max-width: 640px) {
  .header-content {
    padding: 0.5rem 1rem;
  }

  .content-wrapper {
    padding: 1rem;
    gap: 1rem;
  }

  .stats {
    flex-direction: column;
  }
}
</style>
