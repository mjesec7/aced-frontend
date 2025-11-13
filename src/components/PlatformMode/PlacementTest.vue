<template>
  <div class="placement-test">
    <!-- Introduction Screen -->
    <div v-if="currentScreen === 'intro'" class="screen intro-screen">
      <div class="container">
        <div class="welcome-card">
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>

          <h1>Discover Your Level</h1>
          <p class="subtitle">
            Take this quick assessment to unlock a personalized learning journey tailored to your skill level.
          </p>

          <div class="info-grid">
            <div class="info-card">
              <div class="info-number">~50</div>
              <div class="info-label">Questions</div>
            </div>
            <div class="info-card">
              <div class="info-number">30min</div>
              <div class="info-label">Duration</div>
            </div>
            <div class="info-card">
              <div class="info-number">Smart</div>
              <div class="info-label">Adaptive</div>
            </div>
          </div>

          <div class="features">
            <div class="feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Adjusts to your level</span>
            </div>
            <div class="feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>No time pressure</span>
            </div>
            <div class="feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Instant feedback</span>
            </div>
          </div>

          <button class="primary-btn" @click="startTest" :disabled="loading">
            <span v-if="!loading">Let's Begin</span>
            <span v-else>Starting...</span>
            <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <p class="skip-text">
            Not ready? <router-link to="/profile/updated-courses">Explore courses instead</router-link>
          </p>
        </div>
      </div>
    </div>

    <!-- Test Screen -->
    <div v-else-if="currentScreen === 'test'" class="screen test-screen">
      <div class="test-header">
        <button class="back-btn" @click="confirmExit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <div class="progress-info">
          <span class="question-count">Question {{ currentQuestionIndex + 1 }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="question-card" v-if="currentQuestion">
          <div class="difficulty-indicator" :class="difficultyClass">
            {{ difficultyLabel }}
          </div>

          <h2 class="question-text">{{ currentQuestion.questionText || currentQuestion.question }}</h2>

          <div class="options">
            <button
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="option-btn"
              :class="{ selected: selectedAnswer === index }"
              @click="selectAnswer(index)"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
              <span class="option-text">{{ option }}</span>
              <span class="check-mark" v-if="selectedAnswer === index">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            </button>
          </div>

          <div class="action-buttons">
            <button
              class="submit-btn"
              :disabled="selectedAnswer === null || submitting"
              @click="submitAnswer"
            >
              <span>{{ submitting ? 'Submitting...' : 'Continue' }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="error" class="error-card">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-else-if="currentScreen === 'results'" class="screen results-screen">
      <div class="container">
        <div class="results-card">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
          </div>

          <h1>Assessment Complete!</h1>
          <p class="results-subtitle">
            Great job! We've analyzed your responses and determined your optimal starting level.
          </p>

          <div class="level-result">
            <div class="level-badge">
              <div class="level-number">{{ results.recommendedLevel || 1 }}</div>
              <div class="level-label">Your Level</div>
            </div>
            <div class="grade-badge">
              <div class="grade-text">{{ getGradeLabel(results.recommendedLevel) }}</div>
              <div class="grade-label">Grade</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ results.overallScore || 0 }}%</div>
              <div class="stat-label">Overall Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ results.percentile || 0 }}th</div>
              <div class="stat-label">Percentile</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ results.confidence || 'Medium' }}</div>
              <div class="stat-label">Confidence</div>
            </div>
          </div>

          <div v-if="results.subjectScores && results.subjectScores.length" class="subjects-section">
            <h3>Subject Breakdown</h3>
            <div class="subject-scores">
              <div v-for="subject in results.subjectScores" :key="subject.subject" class="subject-item">
                <div class="subject-header">
                  <span class="subject-name">{{ subject.subject }}</span>
                  <span class="subject-score">{{ subject.score }}%</span>
                </div>
                <div class="subject-bar">
                  <div class="subject-fill" :style="{ width: subject.score + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <button class="primary-btn" @click="goToDashboard">
            <span>Start Learning</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Exit Confirmation Modal -->
    <div v-if="showExitModal" class="modal-overlay" @click="showExitModal = false">
      <div class="modal-card" @click.stop>
        <h3>Exit Test?</h3>
        <p>Your progress will be lost if you exit now. Are you sure?</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showExitModal = false">Continue Test</button>
          <button class="btn-danger" @click="exitTest">Exit</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { startPlacementTest, submitPlacementTestAnswer } from '@/api/user';

export default {
  name: 'PlacementTest',

  setup() {
    const router = useRouter();
    const store = useStore();

    const currentScreen = ref('intro'); // 'intro', 'test', 'results'
    const loading = ref(false);
    const submitting = ref(false);
    const error = ref('');
    const showExitModal = ref(false);

    const testId = ref(null);
    const currentQuestion = ref(null);
    const currentQuestionIndex = ref(0);
    const selectedAnswer = ref(null);
    const startTime = ref(null);
    const results = ref({});

    // Progress
    const progressPercentage = computed(() => {
      return Math.min((currentQuestionIndex.value / 50) * 100, 100);
    });

    // Difficulty indicator
    const difficultyClass = computed(() => {
      if (!currentQuestion.value) return 'medium';
      const diff = currentQuestion.value.difficulty || 5;
      if (diff <= 3) return 'easy';
      if (diff <= 7) return 'medium';
      return 'hard';
    });

    const difficultyLabel = computed(() => {
      const classes = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
      return classes[difficultyClass.value];
    });

    // Start test
    const startTest = async () => {
      loading.value = true;
      error.value = '';

      try {
        const userId = store.state.firebaseUserId || localStorage.getItem('firebaseUserId');
        if (!userId) {
          throw new Error('Please log in to take the test');
        }

        const response = await startPlacementTest(userId);

        if (response.success && response.data) {
          testId.value = response.data.testId;
          currentQuestion.value = response.data.question;
          currentQuestionIndex.value = 0;
          currentScreen.value = 'test';
          startTime.value = Date.now();
        } else {
          throw new Error(response.error || 'Failed to start test');
        }
      } catch (err) {
        console.error('Error starting test:', err);
        error.value = err.message || 'Failed to start the placement test';
      } finally {
        loading.value = false;
      }
    };

    // Select answer
    const selectAnswer = (index) => {
      selectedAnswer.value = index;
    };

    // Submit answer
    const submitAnswer = async () => {
      if (selectedAnswer.value === null) return;

      submitting.value = true;
      error.value = '';

      try {
        const timeSpent = Math.floor((Date.now() - startTime.value) / 1000);
        const response = await submitPlacementTestAnswer(
          testId.value,
          selectedAnswer.value,
          timeSpent
        );

        if (response.success && response.data) {
          if (response.data.testComplete) {
            // Test finished
            results.value = response.data.results;
            currentScreen.value = 'results';

            // Update store with results
            if (results.value.recommendedLevel) {
              store.commit('platformMode/SET_PLACEMENT_TEST_RESULTS', {
                levelAssigned: results.value.recommendedLevel,
                overallScore: results.value.overallScore,
                percentile: results.value.percentile,
                subjects: results.value.subjectScores
              });
            }
          } else {
            // Next question
            currentQuestion.value = response.data.question;
            currentQuestionIndex.value = response.data.questionNumber - 1;
            selectedAnswer.value = null;
            startTime.value = Date.now();
          }
        } else {
          throw new Error(response.error || 'Failed to submit answer');
        }
      } catch (err) {
        console.error('Error submitting answer:', err);
        error.value = err.message || 'Failed to submit answer';
      } finally {
        submitting.value = false;
      }
    };

    // Get grade label
    const getGradeLabel = (level) => {
      const mapping = {
        1: 'A1', 2: 'A1', 3: 'A1',
        4: 'A2', 5: 'A2', 6: 'A2',
        7: 'B1', 8: 'B1', 9: 'B1',
        10: 'B2', 11: 'B2', 12: 'B2',
        13: 'C1', 14: 'C1', 15: 'C1',
        16: 'C2', 17: 'C2', 18: 'C2',
        19: 'Expert', 20: 'Master'
      };
      return mapping[level] || 'A1';
    };

    // Confirm exit
    const confirmExit = () => {
      showExitModal.value = true;
    };

    // Exit test
    const exitTest = () => {
      router.push('/profile/main');
    };

    // Go to dashboard
    const goToDashboard = () => {
      router.push('/profile/catalogue');
    };

    return {
      currentScreen,
      loading,
      submitting,
      error,
      showExitModal,
      currentQuestion,
      currentQuestionIndex,
      selectedAnswer,
      results,
      progressPercentage,
      difficultyClass,
      difficultyLabel,
      startTest,
      selectAnswer,
      submitAnswer,
      getGradeLabel,
      confirmExit,
      exitTest,
      goToDashboard
    };
  }
};
</script>

<style scoped>
.placement-test {
  min-height: 100vh;
  background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
}

.screen {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}

/* Intro Screen */
.welcome-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
}

.icon-wrapper svg {
  width: 40px;
  height: 40px;
  color: white;
}

.welcome-card h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
}

.subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.25rem 0.75rem;
  text-align: center;
}

.info-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #8b5cf6;
  margin-bottom: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  text-align: left;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
  color: #374151;
}

.feature svg {
  width: 20px;
  height: 20px;
  color: #10b981;
  flex-shrink: 0;
}

.primary-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.0625rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary-btn svg {
  width: 20px;
  height: 20px;
}

.skip-text {
  margin-top: 1.5rem;
  font-size: 0.9375rem;
  color: #6b7280;
}

.skip-text a {
  color: #8b5cf6;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.skip-text a:hover {
  color: #7c3aed;
}

/* Test Screen */
.test-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e5e7eb;
}

.back-btn svg {
  width: 20px;
  height: 20px;
  color: #374151;
}

.progress-info {
  flex: 1;
}

.question-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.test-screen .container {
  padding-top: 100px;
}

.question-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.difficulty-indicator {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
}

.difficulty-indicator.easy {
  background: #d1fae5;
  color: #065f46;
}

.difficulty-indicator.medium {
  background: #fef3c7;
  color: #92400e;
}

.difficulty-indicator.hard {
  background: #fee2e2;
  color: #991b1b;
}

.question-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.option-btn:hover {
  border-color: #c4b5fd;
  background: #faf5ff;
}

.option-btn.selected {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.option-letter {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8px;
  font-weight: 700;
  color: #374151;
  flex-shrink: 0;
}

.option-btn.selected .option-letter {
  background: #8b5cf6;
  color: white;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}

.check-mark {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.check-mark svg {
  width: 24px;
  height: 24px;
  color: #8b5cf6;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.submit-btn svg {
  width: 18px;
  height: 18px;
}

/* Results Screen */
.results-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.success-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.success-icon svg {
  width: 50px;
  height: 50px;
  color: white;
}

.results-card h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
}

.results-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.level-result {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  border-radius: 16px;
}

.level-badge, .grade-badge {
  text-align: center;
}

.level-number {
  font-size: 3rem;
  font-weight: 700;
  color: #8b5cf6;
  margin-bottom: 0.5rem;
}

.level-label, .grade-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.grade-text {
  font-size: 2rem;
  font-weight: 700;
  color: #8b5cf6;
  margin-bottom: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.subjects-section {
  margin-bottom: 2rem;
  text-align: left;
}

.subjects-section h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
}

.subject-scores {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.subject-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.subject-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
}

.subject-score {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #8b5cf6;
}

.subject-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.subject-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%);
  border-radius: 999px;
  transition: width 0.5s ease;
}

/* Error Card */
.error-card {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  text-align: center;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.modal-card p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-secondary, .btn-danger {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* Responsive */
@media (max-width: 768px) {
  .screen {
    padding: 1rem;
  }

  .welcome-card, .question-card, .results-card {
    padding: 2rem 1.5rem;
  }

  .welcome-card h1, .results-card h1 {
    font-size: 1.5rem;
  }

  .question-text {
    font-size: 1.25rem;
  }

  .info-grid, .stats-grid {
    grid-template-columns: 1fr;
  }

  .level-result {
    flex-direction: column;
    gap: 1rem;
  }

  .test-header {
    padding: 1rem;
  }

  .test-screen .container {
    padding-top: 90px;
  }
}
</style>
