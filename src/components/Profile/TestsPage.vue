<template>
  <div class="tests-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Tests</h1>
        <p class="page-subtitle">Test your knowledge and track your progress</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading tests...</span>
    </div>

    <div v-else class="content-container">
      <!-- Test List Page -->
      <div v-if="!activeTest" class="tests-section">
        <!-- Filters Section -->
        <div v-if="tests.length > 0" class="filters-section">
          <div class="search-container">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="search-icon">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="search-input" 
              placeholder="Search tests..."
            />
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Subject:</label>
            <select v-model="selectedSubject" class="filter-select">
              <option value="">All subjects</option>
              <option v-for="subject in uniqueSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Level:</label>
            <select v-model="selectedLevel" class="filter-select">
              <option value="">All levels</option>
              <option v-for="level in uniqueLevels" :key="level" :value="level">
                Level {{ level }}
              </option>
            </select>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTests.length === 0 && tests.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No tests available</h3>
          <p>Tests will appear here when they are added by administrators</p>
        </div>

        <!-- No Results State -->
        <div v-else-if="filteredTests.length === 0 && tests.length > 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No tests found</h3>
          <p>Try adjusting your search filters</p>
          <button @click="clearFilters" class="clear-btn">Clear filters</button>
        </div>
        
        <!-- Tests Grid -->
        <div v-else class="tests-grid">
          <div 
            v-for="test in filteredTests" 
            :key="test._id" 
            class="test-card"
            @click="startTest(test)"
          >
            <div class="card-header">
              <div class="test-badge">
                {{ test.questions?.length || 0 }} questions
              </div>
              <div v-if="test.duration" class="duration-badge">
                {{ test.duration }}m
              </div>
            </div>
            
            <div class="card-content">
              <h3 class="test-title">{{ test.title }}</h3>
              <p v-if="test.description" class="test-description">{{ test.description }}</p>
              
              <div class="test-meta">
                <div class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M2 3h6l4 6 4-6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>{{ test.subject || 'General' }}</span>
                </div>
                <div class="meta-item level" :class="getLevelClass(test.level || 1)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Level {{ test.level || 1 }}</span>
                </div>
              </div>
            </div>
            
            <div class="card-action">
              <button class="start-btn">
                <span>Start Test</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Single Test Page -->
      <div v-else class="test-container">
        <!-- Test Header -->
        <div class="test-header">
          <div class="test-info">
            <h2 class="test-name">{{ activeTest.title }}</h2>
            <p v-if="activeTest.description" class="test-description">{{ activeTest.description }}</p>
            
            <div class="progress-section">
              <div class="progress-info">
                <span class="progress-text">Question {{ currentQuestionIndex + 1 }} of {{ activeTest.questions.length }}</span>
                <span class="progress-percentage">{{ Math.round(((currentQuestionIndex + 1) / activeTest.questions.length) * 100) }}%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${((currentQuestionIndex + 1) / activeTest.questions.length) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Section -->
        <div v-if="currentQuestionIndex < activeTest.questions.length" class="question-section">
          <div class="question-card">
            <div class="question-number">{{ currentQuestionIndex + 1 }}</div>
            <h3 class="question-text">{{ currentQuestion.text || currentQuestion.question }}</h3>
            
            <!-- Multiple Choice -->
            <div v-if="currentQuestion.type === 'multiple-choice' || (currentQuestion.options && currentQuestion.options.length > 0)" class="options-container">
              <label 
                v-for="(opt, j) in currentQuestion.options" 
                :key="j" 
                class="option-item"
                :class="{ 'selected': userAnswers[currentQuestionIndex] === (opt.text || opt) }"
              >
                <input
                  type="radio"
                  :value="opt.text || opt"
                  v-model="userAnswers[currentQuestionIndex]"
                  class="option-input"
                />
                <div class="option-content">
                  <div class="option-radio"></div>
                  <span class="option-text">{{ opt.text || opt }}</span>
                </div>
              </label>
            </div>

            <!-- True/False -->
            <div v-else-if="currentQuestion.type === 'true-false'" class="options-container">
              <label 
                class="option-item"
                :class="{ 'selected': userAnswers[currentQuestionIndex] === 'true' }"
              >
                <input
                  type="radio"
                  value="true"
                  v-model="userAnswers[currentQuestionIndex]"
                  class="option-input"
                />
                <div class="option-content">
                  <div class="option-radio"></div>
                  <span class="option-text">True</span>
                </div>
              </label>
              <label 
                class="option-item"
                :class="{ 'selected': userAnswers[currentQuestionIndex] === 'false' }"
              >
                <input
                  type="radio"
                  value="false"
                  v-model="userAnswers[currentQuestionIndex]"
                  class="option-input"
                />
                <div class="option-content">
                  <div class="option-radio"></div>
                  <span class="option-text">False</span>
                </div>
              </label>
            </div>

            <!-- Short Answer -->
            <div v-else class="text-answer-container">
              <textarea
                v-model="userAnswers[currentQuestionIndex]"
                class="text-answer-input"
                :placeholder="`Enter your answer for question ${currentQuestionIndex + 1}`"
                rows="4"
              ></textarea>
            </div>

            <div class="question-actions">
              <button 
                class="next-btn"
                @click="nextQuestion"
                :disabled="!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === ''"
                :class="{ 'disabled': !userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === '' }"
              >
                <span v-if="currentQuestionIndex === activeTest.questions.length - 1">
                  Complete Test
                </span>
                <span v-else>
                  Next Question
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Results Section -->
        <div v-else class="results-section">
          <div class="results-card">
            <div class="results-header">
              <div class="results-icon">🎉</div>
              <h3 class="results-title">Test completed!</h3>
            </div>
            
            <div class="results-stats">
              <div class="stat-card">
                <div class="stat-value">{{ correctCount }}</div>
                <div class="stat-total">of {{ activeTest.questions.length }}</div>
                <div class="stat-label">correct answers</div>
              </div>
              
              <div class="stat-card score-card">
                <div class="stat-value score-value" :class="getScoreClass(score)">
                  {{ score }}%
                </div>
                <div class="stat-label">final score</div>
                <div class="score-description" :class="getScoreClass(score)">
                  {{ getScoreDescription(score) }}
                </div>
              </div>
            </div>

            <div class="results-actions">
              <button class="back-btn" @click="goBack">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Back to Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'TestsPage',
  data() {
    return {
      loading: true,
      tests: [],
      activeTest: null,
      userAnswers: [],
      currentQuestionIndex: 0,
      
      // Filters
      selectedSubject: '',
      selectedLevel: '',
      searchQuery: ''
    };
  },
  computed: {
    currentQuestion() {
      if (!this.activeTest || !this.activeTest.questions) return null;
      return this.activeTest.questions[this.currentQuestionIndex];
    },
    correctCount() {
      if (!this.activeTest || !this.activeTest.questions) return 0;
      return this.activeTest.questions.reduce((acc, q, idx) => {
        const correctAnswer = q.correctAnswer;
        const userAnswer = this.userAnswers[idx];
        
        // Handle different answer formats
        let isCorrect = false;
        if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
          // For multiple choice, correctAnswer might be an index or the actual text
          if (typeof correctAnswer === 'number') {
            const correctOptionText = q.options[correctAnswer]?.text || q.options[correctAnswer];
            isCorrect = userAnswer === correctOptionText;
          } else {
            isCorrect = userAnswer === correctAnswer;
          }
        } else {
          // For other types, do direct comparison
          isCorrect = userAnswer?.toString().toLowerCase().trim() === correctAnswer?.toString().toLowerCase().trim();
        }
        
        return acc + (isCorrect ? 1 : 0);
      }, 0);
    },
    score() {
      if (!this.activeTest || !this.activeTest.questions) return 0;
      return Math.round((this.correctCount / this.activeTest.questions.length) * 100);
    },
    uniqueSubjects() {
      return [...new Set(this.tests.map(test => test.subject).filter(Boolean))].sort();
    },
    uniqueLevels() {
      return [...new Set(this.tests.map(test => test.level).filter(Boolean))].sort((a, b) => a - b);
    },
    filteredTests() {
      return this.tests.filter(test => {
        const matchesSubject = !this.selectedSubject || test.subject === this.selectedSubject;
        const matchesLevel = !this.selectedLevel || test.level == this.selectedLevel;
        const matchesSearch = !this.searchQuery || 
          test.title?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          test.description?.toLowerCase().includes(this.searchQuery.toLowerCase());
        
        return matchesSubject && matchesLevel && matchesSearch;
      });
    }
  },
  async mounted() {
    await this.loadTests();
  },
  methods: {
    async loadTests() {
      try {
        this.loading = true;
        const user = auth.currentUser;
        if (!user) {
          console.error('❌ User not authenticated');
          this.$toast?.error('Please sign in');
          return;
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        console.log('🔍 Loading tests for user:', userId);

        // Method 1: Try user-specific tests endpoint
        try {
          const { data: userTestsResponse } = await api.get(`/users/${userId}/tests`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (userTestsResponse?.tests && Array.isArray(userTestsResponse.tests)) {
            this.tests = userTestsResponse.tests;
            console.log('✅ Loaded tests from user endpoint:', this.tests.length);
            return;
          }
        } catch (userTestsError) {
          console.warn('⚠️ User tests endpoint failed:', userTestsError.message);
        }

        // Method 2: Try direct tests endpoint
        try {
          const { data: testsResponse } = await api.get('/tests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const testsData = testsResponse?.data || testsResponse || [];
          // Filter only active tests for users
          this.tests = Array.isArray(testsData) ? testsData.filter(test => test.isActive !== false) : [];
          console.log('✅ Loaded tests from direct endpoint:', this.tests.length);
        } catch (directTestsError) {
          console.error('❌ Failed to load tests:', directTestsError);
          this.$toast?.error('Error loading tests');
          this.tests = [];
        }

      } catch (err) {
        console.error('❌ Error loading tests:', err);
        this.$toast?.error('Error loading tests');
        this.tests = [];
      } finally {
        this.loading = false;
      }
    },

    async startTest(test) {
      try {
        this.loading = true;
        const user = auth.currentUser;
        if (!user) {
          console.error('❌ User not authenticated');
          return;
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        console.log('🚀 Starting test:', test.title, 'ID:', test._id);

        // Try to get the full test with questions
        try {
          const { data: fullTestResponse } = await api.get(`/users/${userId}/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          this.activeTest = fullTestResponse?.test || fullTestResponse?.data || fullTestResponse;
        } catch (userTestError) {
          console.warn('⚠️ User-specific test endpoint failed, trying direct:', userTestError.message);
          
          // Fallback to direct test endpoint
          const { data: directTestResponse } = await api.get(`/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          this.activeTest = directTestResponse?.data || directTestResponse;
        }

        if (!this.activeTest || !this.activeTest.questions || this.activeTest.questions.length === 0) {
          throw new Error('Test contains no questions');
        }

        // Process questions to ensure they have proper structure
        this.activeTest.questions = this.activeTest.questions.map(q => ({
          ...q,
          text: q.text || q.question,
          type: q.type || 'multiple-choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer
        }));

        this.userAnswers = Array(this.activeTest.questions.length).fill('');
        this.currentQuestionIndex = 0;
        
        console.log('✅ Test loaded successfully:', this.activeTest.title);
        console.log('📊 Questions:', this.activeTest.questions.length);
        
      } catch (err) {
        console.error('❌ Error loading test:', err);
        this.$toast?.error('Error loading test: ' + err.message);
      } finally {
        this.loading = false;
      }
    },

    nextQuestion() {
      const currentAnswer = this.userAnswers[this.currentQuestionIndex];
      if (!currentAnswer || currentAnswer.trim() === '') {
        this.$toast?.warning('Please select an answer');
        return;
      }

      if (this.currentQuestionIndex + 1 < this.activeTest.questions.length) {
        this.currentQuestionIndex++;
      } else {
        this.submitTest();
      }
    },

    async submitTest() {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('❌ User not authenticated');
          return;
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        console.log('📤 Submitting test results...');

        // Format answers for submission
        const formattedAnswers = this.userAnswers.map((answer, index) => ({
          questionIndex: index,
          answer: answer
        }));

        try {
          await api.post(
            `/users/${userId}/tests/${this.activeTest._id}/submit`,
            { answers: formattedAnswers },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log('✅ Test results submitted successfully');
        } catch (submitError) {
          console.warn('⚠️ User-specific submit failed, trying direct route:', submitError.message);
          
          // Fallback submit
          await api.post(
            `/tests/${this.activeTest._id}/submit`,
            { 
              userId: userId,
              answers: formattedAnswers 
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        // Move to results view
        this.currentQuestionIndex = this.activeTest.questions.length;
        
      } catch (err) {
        console.error('❌ Error submitting test:', err);
        this.$toast?.error('Error submitting test results');
      }
    },

    goBack() {
      this.activeTest = null;
      this.userAnswers = [];
      this.currentQuestionIndex = 0;
    },

    clearFilters() {
      this.selectedSubject = '';
      this.selectedLevel = '';
      this.searchQuery = '';
    },

    getLevelClass(level) {
      if (level <= 2) return 'beginner';
      if (level <= 4) return 'intermediate';
      return 'advanced';
    },

    getScoreClass(score) {
      if (score >= 90) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'average';
      return 'poor';
    },

    getScoreDescription(score) {
      if (score >= 90) return 'Excellent!';
      if (score >= 70) return 'Good job!';
      if (score >= 50) return 'Satisfactory';
      return 'Needs improvement';
    }
  }
};
</script>

<style scoped>
/* Variables */
:root {
  --brand-purple: #8b5cf6;
  --brand-purple-dark: #7c3aed;
  --brand-purple-light: #a78bfa;
  --black: #000000;
  --white: #ffffff;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
}

/* Base */
.tests-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: var(--white);
  color: var(--black);
  font-family: 'Inter', system-ui, sans-serif;
}

/* Header Section */
.page-header {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--gray-200);
}

.header-content {
  position: relative;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--black);
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 16px;
  color: var(--gray-600);
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--brand-purple);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state span {
  color: var(--gray-600);
  font-size: 14px;
}

/* Content Container */
.content-container {
  position: relative;
}

/* Filters Section */
.filters-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding: 16px;
  background: var(--gray-50);
  border-radius: 8px;
  border: 1px solid var(--gray-200);
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: 14px;
  background: var(--white);
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-purple);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.filter-label {
  font-weight: 500;
  color: var(--gray-700);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: 14px;
  background: var(--white);
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--brand-purple);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--gray-600);
  margin-bottom: 24px;
}

.clear-btn {
  background: var(--brand-purple);
  color: var(--white);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clear-btn:hover {
  background: var(--brand-purple-dark);
}

/* Tests Grid */
.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.test-card {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--white);
}

.test-card:hover {
  border-color: var(--brand-purple);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.test-badge {
  background: var(--brand-purple);
  color: var(--white);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 8px;
  border-radius: 12px;
}

.duration-badge {
  background: var(--gray-100);
  color: var(--gray-700);
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
}

.card-content {
  margin-bottom: 20px;
}

.test-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.test-description {
  color: var(--gray-600);
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 16px 0;
}

.test-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--gray-600);
}

.meta-item.level.beginner {
  color: var(--success);
}

.meta-item.level.intermediate {
  color: var(--warning);
}

.meta-item.level.advanced {
  color: var(--error);
}

.card-action {
  display: flex;
  justify-content: flex-end;
}

.start-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--brand-purple);
  color: var(--white);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-btn:hover {
  background: var(--brand-purple-dark);
}

/* Test Container */
.test-container {
  background: var(--white);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--gray-200);
}

.test-header {
  background: var(--gray-50);
  padding: 32px;
  border-bottom: 1px solid var(--gray-200);
}

.test-info {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.test-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--black);
  margin: 0 0 8px 0;
}

.test-description {
  color: var(--gray-600);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.progress-section {
  margin-top: 24px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 14px;
  color: var(--gray-700);
  font-weight: 500;
}

.progress-percentage {
  font-size: 14px;
  color: var(--brand-purple);
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--brand-purple);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Question Section */
.question-section {
  padding: 32px;
}

.question-card {
  max-width: 700px;
  margin: 0 auto;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 32px;
}

.question-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--brand-purple);
  color: var(--white);
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}

.question-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 24px 0;
  line-height: 1.4;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.option-item {
  display: block;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-input {
  display: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--gray-200);
  border-radius: 8px;
  background: var(--white);
  transition: all 0.2s ease;
}

.option-item:hover .option-content {
  border-color: var(--brand-purple-light);
  background: var(--gray-50);
}

.option-item.selected .option-content {
  border-color: var(--brand-purple);
  background: var(--brand-purple-light);
  background-opacity: 0.1;
}

.option-radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-300);
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.option-item.selected .option-radio {
  border-color: var(--brand-purple);
}

.option-item.selected .option-radio::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--brand-purple);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.option-text {
  font-size: 14px;
  color: var(--black);
  font-weight: 500;
  line-height: 1.4;
}

.text-answer-container {
  margin-bottom: 32px;
}

.text-answer-input {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--gray-200);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.text-answer-input:focus {
  outline: none;
  border-color: var(--brand-purple);
}

.question-actions {
  display: flex;
  justify-content: flex-end;
}

.next-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--brand-purple);
  color: var(--white);
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.next-btn:hover:not(.disabled) {
  background: var(--brand-purple-dark);
}

.next-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Results Section */
.results-section {
  padding: 48px 32px;
}

.results-card {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 48px 32px;
}

.results-header {
  margin-bottom: 32px;
}

.results-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.results-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--black);
  margin: 0;
}

.results-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: var(--gray-50);
  border-radius: 8px;
  border: 1px solid var(--gray-200);
}

.stat-card.score-card {
  background: linear-gradient(135deg, var(--brand-purple-light), var(--brand-purple));
  color: var(--white);
  border-color: var(--brand-purple);
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--black);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-value.score-value {
  color: var(--white);
  font-size: 36px;
}

.stat-value.excellent {
  color: var(--success);
}

.stat-value.good {
  color: var(--brand-purple);
}

.stat-value.average {
  color: var(--warning);
}

.stat-value.poor {
  color: var(--error);
}

.stat-total {
  font-size: 14px;
  color: var(--gray-600);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.score-card .stat-label {
  color: rgba(255, 255, 255, 0.8);
}

.score-description {
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
  color: var(--white);
}

.score-description.excellent {
  color: var(--success);
}

.score-description.good {
  color: var(--brand-purple);
}

.score-description.average {
  color: var(--warning);
}

.score-description.poor {
  color: var(--error);
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

/* Responsive Design */
@media (max-width: 768px) {
  .tests-page {
    padding: 16px;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .tests-grid {
    grid-template-columns: 1fr;
  }
  
  .test-header {
    padding: 24px 16px;
  }
  
  .question-section {
    padding: 24px 16px;
  }
  
  .question-card {
    padding: 24px 16px;
  }
  
  .results-section {
    padding: 32px 16px;
  }
  
  .results-card {
    padding: 32px 16px;
  }
  
  .results-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .progress-info {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .question-text {
    font-size: 16px;
  }
  
  .option-content {
    padding: 12px;
  }
  
  .option-text {
    font-size: 13px;
  }
  
  .text-answer-input {
    padding: 12px;
    font-size: 13px;
  }
  
  .next-btn {
    padding: 10px 20px;
    font-size: 13px;
  }
  
  .results-card {
    padding: 24px 12px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .stat-value.score-value {
    font-size: 28px;
  }
}

/* Animation for smooth transitions */
.question-card {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Accessibility improvements */
.option-item:focus-within .option-content {
  outline: 2px solid var(--brand-purple);
  outline-offset: 2px;
}

.text-answer-input:focus {
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.next-btn:focus {
  outline: 2px solid var(--brand-purple-light);
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .tests-page {
    background: white;
    color: black;
  }
  
  .test-header,
  .question-section,
  .results-section {
    break-inside: avoid;
  }
  
  .next-btn,
  .back-btn {
    display: none;
  }
}

/* Focus and accessibility styles */
.test-card:focus {
  outline: 2px solid var(--brand-purple);
  outline-offset: 2px;
}

.filter-select:focus,
.search-input:focus {
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

/* Smooth transitions for all interactive elements */
* {
  transition-property: color, background-color, border-color, transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .test-card,
  .question-card,
  .results-card {
    border-width: 2px;
  }
  
  .option-content {
    border-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  :root {
    --white: #1f2937;
    --black: #f9fafb;
    --gray-50: #374151;
    --gray-100: #4b5563;
    --gray-200: #6b7280;
    --gray-300: #9ca3af;
  }
}
</style>