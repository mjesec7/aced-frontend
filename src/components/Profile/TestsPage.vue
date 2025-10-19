<template>
  <div class="tests-page">
    <!-- Hero Header -->
    <header class="hero-header" :style="{ backgroundImage: `url(${currentHeroImage})` }">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Тесты и проверки
          </div>
          <h1 class="hero-title">Проверьте свои знания</h1>
          <p class="hero-subtitle">{{ filteredTests.length }} тестов доступно</p>
        </div>
      </div>
    </header>

    <!-- Stats Section -->
    <div v-if="!activeTest" class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ tests.length }}</span>
            <span class="stat-label">Всего тестов</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ uniqueSubjects.length }}</span>
            <span class="stat-label">Предметов</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ uniqueLevels.length }}</span>
            <span class="stat-label">Уровней</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Control Section (only when not taking test) -->
    <div v-if="!activeTest" class="control-section">
      <div class="control-content">
        <div class="search-container">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Поиск тестов..."
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="filters-pills">
          <div class="filter-pill">
            <label>Предмет</label>
            <select v-model="selectedSubject">
              <option value="">Все</option>
              <option v-for="subject in uniqueSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="filter-pill">
            <label>Уровень</label>
            <select v-model="selectedLevel">
              <option value="">Все</option>
              <option v-for="level in uniqueLevels" :key="level" :value="level">
                Уровень {{ level }}
              </option>
            </select>
          </div>

          <button v-if="hasActiveFilters" @click="clearFilters" class="reset-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Сбросить
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loader">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
      </div>
      <p>Загружаем тесты...</p>
    </div>

    <!-- Test List View -->
    <main v-else-if="!activeTest" class="main-section">
      <!-- Empty State -->
      <div v-if="filteredTests.length === 0 && tests.length === 0" class="empty-container">
        <div class="empty-illustration">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h3>Тестов пока нет</h3>
        <p>Тесты появятся здесь, когда они будут добавлены</p>
      </div>

      <!-- No Results State -->
      <div v-else-if="filteredTests.length === 0 && tests.length > 0" class="empty-container">
        <div class="empty-illustration">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить параметры поиска</p>
        <button @click="clearFilters" class="retry-btn">Очистить фильтры</button>
      </div>

      <!-- Tests Grid -->
      <div v-else class="tests-container">
        <div class="tests-grid">
          <article 
            v-for="test in filteredTests" 
            :key="test._id" 
            class="test-card"
            @click="handleStartTest(test)"
          >
            <div class="card-header">
              <span class="test-badge questions">
                {{ test.questions?.length || 0 }} вопросов
              </span>
              <span v-if="test.duration" class="test-badge duration">
                {{ test.duration }}м
              </span>
            </div>

            <div class="card-body">
              <h3 class="test-name">{{ test.title }}</h3>
              <p v-if="test.description" class="test-description">{{ test.description }}</p>
              
              <div class="test-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {{ test.subject || 'Общий' }}
                </span>
                <span class="meta-item level" :class="getLevelClass(test.level || 1)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  Уровень {{ test.level || 1 }}
                </span>
              </div>
            </div>

            <div class="card-footer">
              <button class="test-btn">
                <span>Начать тест</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </article>
        </div>
      </div>
    </main>

    <!-- Active Test View -->
    <div v-else-if="!isTestCompleted" class="test-taking-section">
      <div class="test-container">
        <!-- Progress Bar -->
        <div class="test-progress-bar">
          <div class="progress-track">
            <div 
              class="progress-fill" 
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <div class="progress-label">
            Вопрос {{ currentQuestionIndex + 1 }} из {{ activeTest.questions.length }}
          </div>
        </div>

        <!-- Question Card -->
        <div class="question-card">
          <div class="question-header">
            <h2 class="test-title">{{ activeTest.title }}</h2>
            <div class="question-number">{{ currentQuestionIndex + 1 }}/{{ activeTest.questions.length }}</div>
          </div>
          
          <h3 class="question-text">{{ currentQuestion.text || currentQuestion.question }}</h3>
          
          <!-- Multiple Choice / True False -->
          <div v-if="currentQuestion.type === 'multiple-choice' || currentQuestion.options" class="options-container">
            <label 
              v-for="(opt, j) in currentQuestion.options || ['true', 'false']" 
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
                <div class="option-radio">
                  <div class="radio-inner"></div>
                </div>
                <span class="option-text">{{ opt.text || opt }}</span>
              </div>
            </label>
          </div>

          <!-- Short Answer -->
          <div v-else class="text-answer-container">
            <textarea
              v-model="userAnswers[currentQuestionIndex]"
              class="text-answer-input"
              placeholder="Введите ваш ответ..."
              rows="4"
            ></textarea>
          </div>

          <div class="question-actions">
            <button 
              class="next-btn"
              @click="handleNextQuestion"
              :disabled="!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === ''"
            >
              <span v-if="isLastQuestion">Завершить тест</span>
              <span v-else>Следующий вопрос</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <div v-else class="results-section">
      <div class="results-container">
        <div class="results-card">
          <div class="results-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          
          <h2 class="results-title">Тест завершен!</h2>
          
          <div class="results-stats">
            <div class="stat-circle-card">
              <div class="circle-wrapper">
                <svg class="progress-ring" width="120" height="120">
                  <circle
                    class="progress-ring-circle"
                    stroke="#e5e7eb"
                    stroke-width="8"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                  />
                  <circle
                    class="progress-ring-circle progress"
                    :class="getScoreClass(score)"
                    stroke-width="8"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                    :style="{ strokeDashoffset: progressOffset }"
                  />
                </svg>
                <div class="circle-content">
                  <div class="score-value">{{ score }}%</div>
                </div>
              </div>
              <div class="score-label">Ваш результат</div>
              <div class="score-description" :class="getScoreClass(score)">
                {{ getScoreDescription(score) }}
              </div>
            </div>
            
            <div class="answers-summary">
              <div class="summary-item">
                <div class="summary-icon correct">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ correctCount }}</div>
                  <div class="summary-label">Правильных</div>
                </div>
              </div>
              
              <div class="summary-item">
                <div class="summary-icon total">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ activeTest.questions.length }}</div>
                  <div class="summary-label">Всего вопросов</div>
                </div>
              </div>
            </div>
          </div>

          <button @click="handleGoBack" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            <span>Вернуться к тестам</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import api from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'TestsPage',
  
  setup() {
    const loading = ref(true);
    const tests = ref([]);
    const activeTest = ref(null);
    const userAnswers = ref([]);
    const currentQuestionIndex = ref(0);
    
    const searchQuery = ref('');
    const selectedSubject = ref('');
    const selectedLevel = ref('');
    
    const heroImages = [
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&h=400&fit=crop&q=80',
    ];
    const currentHeroImage = ref('');

    const uniqueSubjects = computed(() => 
      [...new Set(tests.value.map(test => test.subject).filter(Boolean))].sort()
    );

    const uniqueLevels = computed(() => 
      [...new Set(tests.value.map(test => test.level).filter(Boolean))].sort((a, b) => a - b)
    );

    const filteredTests = computed(() => {
      return tests.value.filter(test => {
        const matchesSubject = !selectedSubject.value || test.subject === selectedSubject.value;
        const matchesLevel = !selectedLevel.value || test.level == selectedLevel.value;
        const matchesSearch = !searchQuery.value || 
          test.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          test.description?.toLowerCase().includes(searchQuery.value.toLowerCase());
        
        return matchesSubject && matchesLevel && matchesSearch;
      });
    });

    const currentQuestion = computed(() => {
      if (!activeTest.value?.questions) return null;
      return activeTest.value.questions[currentQuestionIndex.value];
    });

    const progressPercentage = computed(() => 
      Math.round(((currentQuestionIndex.value + 1) / (activeTest.value?.questions?.length || 1)) * 100)
    );

    const isLastQuestion = computed(() => 
      currentQuestionIndex.value === (activeTest.value?.questions?.length || 0) - 1
    );

    const isTestCompleted = computed(() => 
      activeTest.value && currentQuestionIndex.value >= activeTest.value.questions?.length
    );

    const correctCount = computed(() => {
      if (!activeTest.value?.questions) return 0;
      
      return activeTest.value.questions.reduce((acc, question, index) => {
        const userAnswer = userAnswers.value[index];
        const isCorrect = checkAnswer(question, userAnswer);
        return acc + (isCorrect ? 1 : 0);
      }, 0);
    });

    const score = computed(() => {
      if (!activeTest.value?.questions?.length) return 0;
      return Math.round((correctCount.value / activeTest.value.questions.length) * 100);
    });

    const progressOffset = computed(() => {
      const circumference = 2 * Math.PI * 52;
      return circumference - (score.value / 100) * circumference;
    });

    const hasActiveFilters = computed(() => {
      return !!(searchQuery.value || selectedSubject.value || selectedLevel.value);
    });

    const selectRandomHeroImage = () => {
      const randomIndex = Math.floor(Math.random() * heroImages.length);
      currentHeroImage.value = heroImages[randomIndex];
    };

    const loadTests = async () => {
      try {
        loading.value = true;
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('Пользователь не авторизован');
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        try {
          const { data: userTestsResponse } = await api.get(`/users/${userId}/tests`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (userTestsResponse?.tests && Array.isArray(userTestsResponse.tests)) {
            tests.value = userTestsResponse.tests;
            return;
          }
        } catch (userTestsError) {
          console.warn('User tests endpoint failed:', userTestsError.message);
        }

        try {
          const { data: testsResponse } = await api.get('/tests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const testsData = testsResponse?.data || testsResponse || [];
          tests.value = Array.isArray(testsData) ? testsData.filter(test => test.isActive !== false) : [];
        } catch (directTestsError) {
          console.error('Failed to load tests:', directTestsError);
          tests.value = [];
        }

      } catch (err) {
        console.error('Error loading tests:', err);
        tests.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handleStartTest = async (test) => {
      try {
        loading.value = true;
        const user = auth.currentUser;
        
        if (!user) {
          console.error('User not authenticated');
          return;
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        try {
          const { data: fullTestResponse } = await api.get(`/users/${userId}/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          activeTest.value = fullTestResponse?.test || fullTestResponse?.data || fullTestResponse;
        } catch (userTestError) {
          console.warn('User-specific test endpoint failed:', userTestError.message);
          
          const { data: directTestResponse } = await api.get(`/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          activeTest.value = directTestResponse?.data || directTestResponse;
        }

        if (!activeTest.value || !activeTest.value.questions || activeTest.value.questions.length === 0) {
          throw new Error('Тест не содержит вопросов');
        }

        activeTest.value.questions = activeTest.value.questions.map(q => ({
          ...q,
          text: q.text || q.question,
          type: q.type || 'multiple-choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer
        }));

        userAnswers.value = Array(activeTest.value.questions.length).fill('');
        currentQuestionIndex.value = 0;

      } catch (err) {
        console.error('Error loading test:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleNextQuestion = () => {
      const currentAnswer = userAnswers.value[currentQuestionIndex.value];
      if (!currentAnswer || currentAnswer.trim() === '') {
        return;
      }

      if (currentQuestionIndex.value + 1 < activeTest.value.questions.length) {
        currentQuestionIndex.value++;
      } else {
        handleSubmitTest();
      }
    };

    const handleSubmitTest = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const userId = user.uid;

        const formattedAnswers = userAnswers.value.map((answer, index) => ({
          questionIndex: index,
          answer: answer
        }));

        try {
          await api.post(
            `/users/${userId}/tests/${activeTest.value._id}/submit`,
            { answers: formattedAnswers },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (submitError) {
          console.warn('User-specific submit failed:', submitError.message);
          
          await api.post(
            `/tests/${activeTest.value._id}/submit`,
            { 
              userId: userId,
              answers: formattedAnswers 
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        currentQuestionIndex.value = activeTest.value.questions.length;
        
      } catch (err) {
        console.error('Error submitting test:', err);
      }
    };

    const handleGoBack = () => {
      activeTest.value = null;
      userAnswers.value = [];
      currentQuestionIndex.value = 0;
    };

    const clearFilters = () => {
      selectedSubject.value = '';
      selectedLevel.value = '';
      searchQuery.value = '';
    };

    const checkAnswer = (question, userAnswer) => {
      if (!userAnswer) return false;

      const correctAnswer = question.correctAnswer;

      if (question.type === 'multiple-choice' && Array.isArray(question.options)) {
        if (typeof correctAnswer === 'number') {
          const correctOptionText = question.options[correctAnswer]?.text || question.options[correctAnswer];
          return userAnswer === correctOptionText;
        }
        return userAnswer === correctAnswer;
      }

      return userAnswer.toString().toLowerCase().trim() === 
             correctAnswer.toString().toLowerCase().trim();
    };

    const getLevelClass = (level) => {
      if (level <= 2) return 'beginner';
      if (level <= 4) return 'intermediate';
      return 'advanced';
    };

    const getScoreClass = (score) => {
      if (score >= 90) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'average';
      return 'poor';
    };

    const getScoreDescription = (score) => {
      if (score >= 90) return 'Отлично!';
      if (score >= 70) return 'Хорошо!';
      if (score >= 50) return 'Удовлетворительно';
      return 'Нужно подтянуть знания';
    };

    onMounted(() => {
      selectRandomHeroImage();
      loadTests();
    });

    return {
      loading,
      tests,
      activeTest,
      userAnswers,
      currentQuestionIndex,
      searchQuery,
      selectedSubject,
      selectedLevel,
      currentHeroImage,
      uniqueSubjects,
      uniqueLevels,
      filteredTests,
      currentQuestion,
      progressPercentage,
      isLastQuestion,
      isTestCompleted,
      correctCount,
      score,
      progressOffset,
      hasActiveFilters,
      handleStartTest,
      handleNextQuestion,
      handleSubmitTest,
      handleGoBack,
      clearFilters,
      getLevelClass,
      getScoreClass,
      getScoreDescription
    };
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.tests-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
}

/* HERO HEADER */
.hero-header {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.85) 0%, rgba(168, 85, 247, 0.85) 100%);
}
.hero-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.hero-badge svg {
  width: 0.875rem;
  height: 0.875rem;
}
.hero-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: white;
  margin: 0 0 0.5rem 0;
  line-height: 1.1;
}
.hero-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* STATS SECTION */
.stats-section {
  margin-top: -1.5rem;
  position: relative;
  z-index: 10;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 2rem;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}
.stat-icon.blue {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #3b82f6;
}
.stat-icon.purple {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #a855f7;
}
.stat-icon.gold {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.stat-label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

/* CONTROL SECTION */
.control-section {
  max-width: 1400px;
  margin: 2rem auto 1.5rem;
  padding: 0 2rem;
}
.control-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.search-container {
  position: relative;
  width: 100%;
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.125rem;
  height: 1.125rem;
  color: #9ca3af;
}
.search-input {
  width: 100%;
  padding: 0.875rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9375rem;
  background: white;
  transition: all 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.clear-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.875rem;
  height: 1.875rem;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.clear-btn:hover {
  background: #e5e7eb;
  color: #111827;
}
.clear-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* FILTER PILLS */
.filters-pills {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}
.filter-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.5rem 0.875rem;
  transition: all 0.2s;
}
.filter-pill:hover {
  border-color: #d1d5db;
}
.filter-pill label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 600;
}
.filter-pill select {
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  color: #111827;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  padding: 0.125rem;
}
.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: #fef2f2;
  color: #dc2626;
  border: 1.5px solid #fca5a5;
}
.reset-btn:hover {
  background: #fee2e2;
}
.reset-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* LOADING */
.loading-container {
  max-width: 1400px;
  margin: 4rem auto;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
.loader {
  position: relative;
  width: 80px;
  height: 80px;
}
.loader-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}
.loader-ring:nth-child(2) {
  border-top-color: #a855f7;
  animation-delay: 0.2s;
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
}
.loader-ring:nth-child(3) {
  border-top-color: #fbbf24;
  animation-delay: 0.4s;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-container p {
  font-size: 1.125rem;
  color: #6b7280;
  font-weight: 500;
}

/* EMPTY STATE */
.empty-container {
  max-width: 600px;
  margin: 4rem auto;
  padding: 4rem 2rem;
  text-align: center;
}
.empty-illustration {
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-illustration svg {
  width: 60px;
  height: 60px;
  color: #9ca3af;
}
.empty-container h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}
.empty-container p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}
.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
}

/* MAIN SECTION */
.main-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

/* TESTS GRID */
.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

/* TEST CARD */
.test-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border: 1px solid #f3f4f6;
  cursor: pointer;
}
.test-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}
.card-header {
  padding: 1rem 1rem 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.test-badge {
  padding: 0.3125rem 0.625rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.test-badge.questions {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e40af;
}
.test-badge.duration {
  background: #fef3c7;
  color: #92400e;
}

.card-body {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.test-name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
}
.test-description {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}
.test-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  padding: 0.375rem 0.625rem;
  background: #f9fafb;
  border-radius: 6px;
}
.meta-item svg {
  width: 0.8125rem;
  height: 0.8125rem;
}
.meta-item.level.beginner {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
.meta-item.level.intermediate {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}
.meta-item.level.advanced {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.card-footer {
  padding: 0 1rem 1rem;
}
.test-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}
.test-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}
.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
}

/* TEST TAKING SECTION */
.test-taking-section {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 2rem 4rem;
}
.test-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}
.test-progress-bar {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.progress-track {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  border-radius: 100px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-label {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}

.question-card {
  padding: 2rem;
}
.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.test-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.question-number {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #7c3aed;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
}
.question-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}
.option-item {
  display: block;
  cursor: pointer;
}
.option-input {
  display: none;
}
.option-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  transition: all 0.2s;
}
.option-item:hover .option-content {
  border-color: #a855f7;
  background: #faf5ff;
}
.option-item.selected .option-content {
  border-color: #a855f7;
  background: #faf5ff;
}
.option-radio {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}
.option-item.selected .option-radio {
  border-color: #a855f7;
  background: #a855f7;
}
.radio-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 0.5rem;
  height: 0.5rem;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}
.option-item.selected .radio-inner {
  transform: translate(-50%, -50%) scale(1);
}
.option-text {
  font-size: 0.9375rem;
  color: #374151;
  font-weight: 500;
  line-height: 1.4;
}

.text-answer-container {
  margin-bottom: 2rem;
}
.text-answer-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all 0.2s;
}
.text-answer-input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.question-actions {
  display: flex;
  justify-content: flex-end;
}
.next-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.next-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
}
.next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.next-btn svg {
  width: 1rem;
  height: 1rem;
}

/* RESULTS SECTION */
.results-section {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 2rem 4rem;
}
.results-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}
.results-card {
  padding: 3rem 2rem;
  text-align: center;
}
.results-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
}
.results-icon svg {
  width: 40px;
  height: 40px;
}
.results-title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 2rem 0;
}
.results-stats {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.stat-circle-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.circle-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}
.progress-ring {
  transform: rotate(-90deg);
}
.progress-ring-circle {
  stroke-dasharray: 326.73;
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 1s ease;
}
.progress-ring-circle.progress {
  stroke-linecap: round;
}
.progress-ring-circle.progress.excellent {
  stroke: #10b981;
}
.progress-ring-circle.progress.good {
  stroke: #6366f1;
}
.progress-ring-circle.progress.average {
  stroke: #f59e0b;
}
.progress-ring-circle.progress.poor {
  stroke: #ef4444;
}
.circle-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.score-value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.score-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}
.score-description {
  font-size: 1rem;
  font-weight: 700;
}
.score-description.excellent { color: #10b981; }
.score-description.good { color: #6366f1; }
.score-description.average { color: #f59e0b; }
.score-description.poor { color: #ef4444; }

.answers-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 10px;
}
.summary-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.summary-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}
.summary-icon.correct {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #10b981;
}
.summary-icon.total {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #3b82f6;
}
.summary-content {
  flex: 1;
  text-align: left;
}
.summary-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.back-btn:hover {
  background: #f9fafb;
  border-color: #a855f7;
  color: #a855f7;
}
.back-btn svg {
  width: 1rem;
  height: 1rem;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.75rem;
  }
  .hero-subtitle {
    font-size: 0.9375rem;
  }
  .stats-section {
    padding: 0 1.5rem;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .control-section, .main-section, .test-taking-section, .results-section {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .filters-pills {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-pill {
    width: 100%;
  }
  .tests-grid {
    grid-template-columns: 1fr;
  }
  .question-card {
    padding: 1.5rem;
  }
  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .answers-summary {
    grid-template-columns: 1fr;
  }
  .results-card {
    padding: 2rem 1.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>