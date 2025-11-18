<template>
  <div class="level-test-container">
    <!-- Header -->
    <div class="test-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <div class="test-info">
        <h1 class="test-title">{{ subject }} Level Test</h1>
        <p class="test-subtitle">Level {{ targetLevel }} Assessment</p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <div class="progress-text">
        Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}
      </div>
    </div>

    <!-- Test Screen -->
    <div v-if="!showResults" class="test-content">
      <div class="question-card">
        <div class="question-number">Question {{ currentQuestionIndex + 1 }}</div>
        <h2 class="question-text">{{ currentQuestion.question }}</h2>

        <div class="answers-grid">
          <button
            v-for="(answer, index) in currentQuestion.answers"
            :key="index"
            class="answer-btn"
            :class="{ selected: selectedAnswer === index }"
            @click="selectAnswer(index)"
          >
            <span class="answer-letter">{{ String.fromCharCode(65 + index) }}</span>
            <span class="answer-text">{{ answer }}</span>
          </button>
        </div>

        <div class="question-actions">
          <button
            class="next-btn"
            :disabled="selectedAnswer === null"
            @click="nextQuestion"
          >
            {{ isLastQuestion ? 'Finish Test' : 'Next Question' }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-else class="results-screen">
      <div class="results-card">
        <div class="results-icon" :class="passed ? 'success' : 'fail'">
          <svg v-if="passed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        <h2 class="results-title">{{ passed ? 'Congratulations!' : 'Keep Practicing!' }}</h2>
        <p class="results-message">
          {{ passed
            ? `You've passed the Level ${targetLevel} test!`
            : `You scored ${score}%. Keep learning to improve!`
          }}
        </p>

        <div class="results-stats">
          <div class="stat-item">
            <div class="stat-value">{{ correctAnswers }}/{{ questions.length }}</div>
            <div class="stat-label">Correct Answers</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ score }}%</div>
            <div class="stat-label">Score</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ passed ? 'Pass' : 'Fail' }}</div>
            <div class="stat-label">Result</div>
          </div>
        </div>

        <div class="results-actions">
          <button class="primary-btn" @click="goToCourses">
            {{ passed ? 'Continue Learning' : 'Back to Courses' }}
          </button>
          <button v-if="!passed" class="secondary-btn" @click="retakeTest">
            Retake Test
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';

export default {
  name: 'LevelTest',

  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useStore();

    const subject = ref(route.query.subject || sessionStorage.getItem('testSubject') || 'General');
    const targetLevel = ref(parseInt(route.query.level) || store.getters['platformMode/currentLevelCap'] || 1);

    const currentQuestionIndex = ref(0);
    const selectedAnswer = ref(null);
    const answers = ref([]);
    const showResults = ref(false);
    const questions = ref([]);

    // Generate test questions
    const generateQuestions = () => {
      // Sample questions - in real app, these would come from backend
      const questionPool = [
        {
          question: 'What is the main topic of this lesson?',
          answers: ['Grammar', 'Vocabulary', 'Pronunciation', 'Writing'],
          correct: 0
        },
        {
          question: 'Which of the following is correct?',
          answers: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct: 1
        },
        {
          question: 'Select the best answer:',
          answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'],
          correct: 2
        },
        {
          question: 'Choose the correct statement:',
          answers: ['Statement A', 'Statement B', 'Statement C', 'Statement D'],
          correct: 0
        },
        {
          question: 'What does this concept mean?',
          answers: ['Definition 1', 'Definition 2', 'Definition 3', 'Definition 4'],
          correct: 3
        }
      ];

      // Generate 20 questions max
      const numQuestions = Math.min(20, questionPool.length * 4);
      const generatedQuestions = [];

      for (let i = 0; i < numQuestions; i++) {
        const baseQuestion = questionPool[i % questionPool.length];
        generatedQuestions.push({
          ...baseQuestion,
          id: i,
          question: `${subject.value} Q${i + 1}: ${baseQuestion.question}`
        });
      }

      questions.value = generatedQuestions;
    };

    // Computed properties
    const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
    const isLastQuestion = computed(() => currentQuestionIndex.value === questions.value.length - 1);
    const progressPercentage = computed(() =>
      ((currentQuestionIndex.value + 1) / questions.value.length) * 100
    );

    const correctAnswers = computed(() => {
      return answers.value.filter((ans, idx) =>
        ans === questions.value[idx].correct
      ).length;
    });

    const score = computed(() =>
      Math.round((correctAnswers.value / questions.value.length) * 100)
    );

    const passed = computed(() => score.value >= 70);

    // Methods
    const selectAnswer = (index) => {
      selectedAnswer.value = index;
    };

    const nextQuestion = () => {
      // Save answer
      answers.value[currentQuestionIndex.value] = selectedAnswer.value;

      if (isLastQuestion.value) {
        // Show results
        showResults.value = true;
        saveTestResults();
      } else {
        // Move to next question
        currentQuestionIndex.value++;
        selectedAnswer.value = null;
      }
    };

    const saveTestResults = () => {
      // Save test results to analytics
      try {
        const testData = {
          subject: subject.value,
          level: targetLevel.value,
          score: score.value,
          passed: passed.value,
          correctAnswers: correctAnswers.value,
          totalQuestions: questions.value.length,
          timestamp: Date.now()
        };

        // Store in localStorage for analytics
        const existingTests = JSON.parse(localStorage.getItem('levelTests') || '[]');
        existingTests.push(testData);
        localStorage.setItem('levelTests', JSON.stringify(existingTests));
} catch (error) {
}
    };

    const retakeTest = () => {
      currentQuestionIndex.value = 0;
      selectedAnswer.value = null;
      answers.value = [];
      showResults.value = false;
      generateQuestions();
    };

    const goBack = () => {
      router.back();
    };

    const goToCourses = () => {
      router.push({ name: 'CataloguePage' });
    };

    // Initialize
    onMounted(() => {
      generateQuestions();
    });

    return {
      subject,
      targetLevel,
      currentQuestionIndex,
      selectedAnswer,
      showResults,
      questions,
      currentQuestion,
      isLastQuestion,
      progressPercentage,
      correctAnswers,
      score,
      passed,
      selectAnswer,
      nextQuestion,
      retakeTest,
      goBack,
      goToCourses
    };
  }
};
</script>

<style scoped>
.level-test-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
  padding: 2rem;
}

.test-header {
  max-width: 900px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.back-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.test-info {
  flex: 1;
}

.test-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.test-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.progress-section {
  max-width: 900px;
  margin: 0 auto 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}

.test-content {
  max-width: 900px;
  margin: 0 auto;
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.question-number {
  font-size: 0.875rem;
  font-weight: 700;
  color: #8b5cf6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.question-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2rem 0;
  line-height: 1.4;
}

.answers-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.answer-btn {
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
}

.answer-btn:hover {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.answer-btn.selected {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.answer-letter {
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

.answer-btn.selected .answer-letter {
  background: #8b5cf6;
  color: white;
}

.answer-text {
  flex: 1;
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}

.question-actions {
  display: flex;
  justify-content: flex-end;
}

.next-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.next-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Results Screen */
.results-screen {
  max-width: 600px;
  margin: 0 auto;
}

.results-card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.results-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.results-icon.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.results-icon.fail {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
}

.results-icon svg {
  width: 50px;
  height: 50px;
  color: white;
}

.results-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
}

.results-message {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.results-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #8b5cf6;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.results-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.primary-btn,
.secondary-btn {
  width: 100%;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.primary-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.secondary-btn {
  background: white;
  color: #8b5cf6;
  border: 2px solid #8b5cf6;
}

.secondary-btn:hover {
  background: #f5f3ff;
}

@media (max-width: 768px) {
  .level-test-container {
    padding: 1rem;
  }

  .test-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .question-card {
    padding: 1.5rem;
  }

  .question-text {
    font-size: 1.25rem;
  }

  .results-card {
    padding: 2rem;
  }

  .results-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
