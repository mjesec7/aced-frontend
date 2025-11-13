<template>
  <div class="placement-test-container">
    <!-- Test Introduction Screen -->
    <div v-if="!testStarted && !testCompleted" class="intro-screen">
      <div class="intro-content">
        <div class="test-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1>Welcome to Your Placement Test</h1>
        <p class="intro-description">
          This adaptive test will help us determine your current level and create a personalized learning path for you.
        </p>

        <div class="test-info">
          <div class="info-item">
            <span class="info-label">Questions:</span>
            <span class="info-value">Approx. 50</span>
          </div>
          <div class="info-item">
            <span class="info-label">Duration:</span>
            <span class="info-value">30-45 minutes</span>
          </div>
          <div class="info-item">
            <span class="info-label">Type:</span>
            <span class="info-value">Adaptive (adjusts to your level)</span>
          </div>
        </div>

        <div class="test-instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Answer each question to the best of your ability</li>
            <li>The test adapts: harder questions if you're doing well, easier if struggling</li>
            <li>You cannot go back to previous questions</li>
            <li>Take your time - there's no strict time limit per question</li>
            <li>Be honest - this helps us place you at the right level</li>
          </ul>
        </div>

        <button class="start-btn" @click="startTest" :disabled="isLoading">
          {{ isLoading ? 'Preparing Test...' : 'Start Placement Test' }}
        </button>

        <p class="skip-note">
          Want to explore freely instead? <router-link to="/profile/updated-courses">Skip to Study Centre</router-link>
        </p>
      </div>
    </div>

    <!-- Test In Progress -->
    <div v-if="testStarted && !testCompleted" class="test-screen">
      <!-- Progress Header -->
      <div class="test-header">
        <div class="progress-info">
          <span class="question-counter">Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}</span>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>

        <div class="difficulty-indicator">
          <span class="difficulty-label">Current Difficulty:</span>
          <div class="difficulty-dots">
            <span
              v-for="i in 10"
              :key="i"
              class="dot"
              :class="{ active: i <= currentDifficulty }"
            ></span>
          </div>
        </div>
      </div>

      <!-- Question Card -->
      <div v-if="currentQuestion" class="question-card">
        <div class="question-content">
          <h2 class="question-text">{{ currentQuestion.questionText }}</h2>

          <!-- Multiple Choice Options -->
          <div class="options-container">
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="option"
              :class="{ selected: selectedAnswer === option }"
              @click="selectAnswer(option)"
            >
              <div class="option-radio">
                <div v-if="selectedAnswer === option" class="radio-dot"></div>
              </div>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
        </div>

        <div class="question-footer">
          <button
            class="submit-answer-btn"
            :disabled="!selectedAnswer || isSubmitting"
            @click="submitAnswer"
          >
            {{ isSubmitting ? 'Submitting...' : 'Submit Answer' }}
          </button>
        </div>
      </div>

      <!-- Loading Next Question -->
      <div v-else class="loading-question">
        <div class="spinner"></div>
        <p>Loading next question...</p>
      </div>
    </div>

    <!-- Test Completed - Results -->
    <div v-if="testCompleted" class="results-screen">
      <div class="results-content">
        <div class="celebration-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>

        <h1>Placement Test Complete!</h1>
        <p class="results-subtitle">Here are your results:</p>

        <div class="results-card">
          <div class="result-item main-result">
            <span class="result-label">Your Level:</span>
            <span class="result-value level">{{ results.level }}</span>
          </div>

          <div class="result-item">
            <span class="result-label">Grade:</span>
            <span class="result-value grade" :style="{ color: getGradeBadgeColor(results.grade) }">
              {{ results.grade }}
            </span>
          </div>

          <div class="result-item">
            <span class="result-label">Score:</span>
            <span class="result-value">{{ results.score }}%</span>
          </div>

          <div class="result-item">
            <span class="result-label">Questions Answered:</span>
            <span class="result-value">{{ results.totalAnswered }}</span>
          </div>
        </div>

        <div class="grade-description">
          <h3>{{ results.grade }} Level</h3>
          <p>{{ getGradeDescription(results.grade) }}</p>
        </div>

        <div v-if="results.recommendations && results.recommendations.length > 0" class="recommendations">
          <h3>Recommended for you:</h3>
          <ul>
            <li v-for="(rec, index) in results.recommendations" :key="index">{{ rec }}</li>
          </ul>
        </div>

        <button class="continue-btn" @click="continueToDashboard">
          Continue to Your Dashboard
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-overlay">
      <div class="error-content">
        <h2>Oops! Something went wrong</h2>
        <p>{{ error }}</p>
        <button @click="retryTest">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { startPlacementTest, submitPlacementTestAnswer } from '@/api/user';
import { useLevelSystem } from '@/composables/useLevelSystem';

export default {
  name: 'PlacementTest',

  setup() {
    const store = useStore();
    const router = useRouter();
    const { getGradeBadgeColor, getGradeDescription } = useLevelSystem();

    // Test State
    const testStarted = ref(false);
    const testCompleted = ref(false);
    const isLoading = ref(false);
    const isSubmitting = ref(false);
    const error = ref(null);

    // Test Data
    const testId = ref(null);
    const currentQuestion = ref(null);
    const currentQuestionIndex = ref(0);
    const totalQuestions = ref(50);
    const currentDifficulty = ref(5);
    const selectedAnswer = ref(null);
    const questionStartTime = ref(null);

    // Results
    const results = ref({
      level: 0,
      grade: '',
      score: 0,
      totalAnswered: 0,
      recommendations: []
    });

    // Computed
    const progressPercentage = computed(() => {
      return Math.round((currentQuestionIndex.value / totalQuestions.value) * 100);
    });

    // Start the test
    const startTest = async () => {
      try {
        isLoading.value = true;
        error.value = null;

        const userId = store.getters.getFirebaseUserId;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const result = await startPlacementTest(userId);

        if (result.success && result.data) {
          testId.value = result.data.testId;
          currentQuestion.value = result.data.question;
          totalQuestions.value = result.data.totalQuestions || 50;
          testStarted.value = true;
          questionStartTime.value = Date.now();
        } else {
          throw new Error(result.error || 'Failed to start test');
        }
      } catch (err) {
        console.error('Error starting test:', err);
        // Check if it's a 404 error (backend not ready)
        if (err.message && err.message.includes('404')) {
          error.value = 'Placement test feature is coming soon! For now, you can freely explore all content in Study Centre mode.';
        } else {
          error.value = err.message || 'Failed to start placement test';
        }
      } finally {
        isLoading.value = false;
      }
    };

    // Select an answer
    const selectAnswer = (answer) => {
      selectedAnswer.value = answer;
    };

    // Submit answer and get next question
    const submitAnswer = async () => {
      if (!selectedAnswer.value || isSubmitting.value) return;

      try {
        isSubmitting.value = true;
        error.value = null;

        const timeSpent = Math.round((Date.now() - questionStartTime.value) / 1000); // in seconds

        const result = await submitPlacementTestAnswer(
          testId.value,
          selectedAnswer.value,
          timeSpent
        );

        if (result.success && result.data) {
          if (result.data.testComplete) {
            // Test is complete - show results
            showResults(result.data.results);
          } else {
            // Load next question
            currentQuestion.value = result.data.question;
            currentQuestionIndex.value = result.data.questionNumber - 1;
            currentDifficulty.value = Math.round(result.data.question.difficulty || 5);
            selectedAnswer.value = null;
            questionStartTime.value = Date.now();
          }
        } else {
          throw new Error(result.error || 'Failed to submit answer');
        }
      } catch (err) {
        console.error('Error submitting answer:', err);
        error.value = err.message || 'Failed to submit answer';
      } finally {
        isSubmitting.value = false;
      }
    };

    // Show test results
    const showResults = (testResults) => {
      results.value = {
        level: testResults.recommendedLevel || testResults.level || 1,
        grade: testResults.grade || 'A1',
        score: Math.round(testResults.overallScore || testResults.score || 0),
        totalAnswered: testResults.totalAnswered || currentQuestionIndex.value + 1,
        recommendations: testResults.customRecommendations || testResults.recommendations || []
      };

      // Save results to Vuex store
      store.dispatch('platformMode/setPlacementTestResults', {
        overallScore: results.value.score,
        level: results.value.level
      });

      testCompleted.value = true;
      testStarted.value = false;
    };

    // Continue to dashboard
    const continueToDashboard = () => {
      router.push({ name: 'ProfileMain' });
    };

    // Retry test
    const retryTest = () => {
      error.value = null;
      testStarted.value = false;
      testCompleted.value = false;
      currentQuestionIndex.value = 0;
      selectedAnswer.value = null;
      currentQuestion.value = null;
    };

    onMounted(() => {
      // Check if user has already completed placement test
      const placementTestTaken = store.getters['platformMode/placementTestTaken'];
      if (placementTestTaken) {
        router.push({ name: 'ProfileMain' });
      }
    });

    return {
      testStarted,
      testCompleted,
      isLoading,
      isSubmitting,
      error,
      currentQuestion,
      currentQuestionIndex,
      totalQuestions,
      currentDifficulty,
      selectedAnswer,
      results,
      progressPercentage,
      startTest,
      selectAnswer,
      submitAnswer,
      continueToDashboard,
      retryTest,
      getGradeBadgeColor,
      getGradeDescription
    };
  }
};
</script>

<style scoped>
.placement-test-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Intro Screen */
.intro-screen {
  max-width: 700px;
  width: 100%;
}

.intro-content {
  background: white;
  border-radius: 18px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.test-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-icon svg {
  width: 50px;
  height: 50px;
  color: white;
}

.intro-content h1 {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: #1e293b;
}

.intro-description {
  text-align: center;
  color: #64748b;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.test-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-item {
  text-align: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.info-label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.info-value {
  display: block;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.test-instructions {
  margin-bottom: 2rem;
}

.test-instructions h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1e293b;
}

.test-instructions ul {
  list-style: none;
  padding: 0;
}

.test-instructions li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #475569;
}

.test-instructions li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #8b5cf6;
  font-weight: 700;
}

.start-btn {
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.skip-note {
  text-align: center;
  margin-top: 1.5rem;
  color: #64748b;
  font-size: 0.95rem;
}

.skip-note a {
  color: #8b5cf6;
  text-decoration: none;
  font-weight: 600;
}

.skip-note a:hover {
  text-decoration: underline;
}

/* Test Screen */
.test-screen {
  max-width: 900px;
  width: 100%;
}

.test-header {
  background: white;
  border-radius: 18px 18px 0 0;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.progress-info {
  margin-bottom: 1.5rem;
}

.question-counter {
  display: block;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.5s ease;
}

.difficulty-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.difficulty-label {
  font-size: 0.95rem;
  color: #64748b;
}

.difficulty-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: background 0.3s ease;
}

.dot.active {
  background: #8b5cf6;
}

.question-card {
  background: white;
  border-radius: 0 0 18px 18px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.question-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.option.selected {
  background: #ede9fe;
  border-color: #8b5cf6;
}

.option-radio {
  width: 24px;
  height: 24px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.option.selected .option-radio {
  border-color: #8b5cf6;
}

.radio-dot {
  width: 12px;
  height: 12px;
  background: #8b5cf6;
  border-radius: 50%;
  animation: scaleIn 0.2s ease;
}

.option-text {
  font-size: 1.05rem;
  color: #1e293b;
}

.question-footer {
  display: flex;
  justify-content: center;
}

.submit-answer-btn {
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.submit-answer-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.submit-answer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-question {
  background: white;
  border-radius: 18px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Results Screen */
.results-screen {
  max-width: 700px;
  width: 100%;
}

.results-content {
  background: white;
  border-radius: 18px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.celebration-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.celebration-icon svg {
  width: 60px;
  height: 60px;
  color: white;
}

.results-content h1 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.results-subtitle {
  color: #64748b;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.results-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.main-result {
  padding: 1.5rem 0;
}

.result-label {
  font-size: 1.05rem;
  color: #64748b;
}

.result-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.result-value.level {
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.result-value.grade {
  font-size: 1.75rem;
  font-weight: 700;
}

.grade-description {
  margin-bottom: 2rem;
  text-align: left;
}

.grade-description h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.grade-description p {
  color: #64748b;
  line-height: 1.6;
}

.recommendations {
  background: #ede9fe;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.recommendations h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1e293b;
}

.recommendations ul {
  list-style: none;
  padding: 0;
}

.recommendations li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #475569;
}

.recommendations li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #8b5cf6;
  font-weight: 700;
}

.continue-btn {
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

/* Error State */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.error-content {
  background: white;
  border-radius: 18px;
  padding: 2rem;
  max-width: 400px;
  text-align: center;
}

.error-content h2 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-content button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .intro-content,
  .question-card,
  .results-content {
    padding: 2rem;
  }

  .test-info {
    grid-template-columns: 1fr;
  }

  .intro-content h1 {
    font-size: 1.75rem;
  }

  .question-text {
    font-size: 1.25rem;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
