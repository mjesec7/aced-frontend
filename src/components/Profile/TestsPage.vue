<template>
  <div class="min-h-screen bg-[#fafafa] p-6">
    <!-- Hero Header -->
    <header class="max-w-7xl mx-auto mb-8 relative overflow-hidden rounded-2xl bg-indigo-600 text-white shadow-lg">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90"></div>
      <div class="relative z-10 px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Tests and Assessments
          </div>
          <h1 class="text-3xl md:text-4xl font-bold mb-2">Test Your Knowledge</h1>
          <p class="text-indigo-100 text-lg">{{ filteredTests.length }} tests available</p>
        </div>
        <!-- Decorative Icon -->
        <div class="hidden md:block opacity-20 transform rotate-12">
          <svg class="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
      </div>
    </header>

    <!-- Stats Section -->
    <div v-if="!activeTest" class="max-w-7xl mx-auto mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ tests.length }}</div>
            <div class="text-sm text-gray-500 font-medium">Total Tests</div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ uniqueSubjects.length }}</div>
            <div class="text-sm text-gray-500 font-medium">Subjects</div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ uniqueLevels.length }}</div>
            <div class="text-sm text-gray-500 font-medium">Levels</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Section -->
    <div v-if="!activeTest" class="max-w-7xl mx-auto mb-8">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <!-- Search -->
        <div class="relative w-full md:w-96">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Search tests..."
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</span>
            <select v-model="selectedSubject" class="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer">
              <option value="">All</option>
              <option v-for="subject in uniqueSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</span>
            <select v-model="selectedLevel" class="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer">
              <option value="">All</option>
              <option v-for="level in uniqueLevels" :key="level" :value="level">
                Level {{ level }}
              </option>
            </select>
          </div>

          <button 
            v-if="hasActiveFilters" 
            @click="clearFilters" 
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500 font-medium">Loading tests...</p>
    </div>

    <!-- Main Content -->
    <main v-else-if="!activeTest" class="max-w-7xl mx-auto">
      <!-- Empty States -->
      <div v-if="filteredTests.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1">
          {{ tests.length === 0 ? 'No Tests Yet' : 'No Matches Found' }}
        </h3>
        <p class="text-gray-500 text-center max-w-xs mb-6">
          {{ tests.length === 0 ? 'Tests will appear here when they are added.' : 'Try adjusting your search or filters to find what you\'re looking for.' }}
        </p>
        <button 
          v-if="tests.length > 0" 
          @click="clearFilters" 
          class="px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <!-- Tests Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article 
          v-for="test in filteredTests" 
          :key="test._id" 
          class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col"
          @click="handleStartTest(test)"
        >
          <div class="p-6 flex-1">
            <div class="flex items-start justify-between mb-4">
              <div class="flex gap-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {{ test.questions?.length || 0 }} questions
                </span>
                <span v-if="test.duration" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {{ test.duration }}m
                </span>
              </div>
            </div>

            <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
              {{ test.title }}
            </h3>
            <p v-if="test.description" class="text-gray-500 text-sm mb-4 line-clamp-2">
              {{ test.description }}
            </p>
            
            <div class="flex items-center gap-4 text-sm text-gray-500 mt-auto">
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {{ test.subject || 'General' }}
              </span>
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Level {{ test.level || 1 }}
              </span>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
            <button class="flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              Start Test
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </article>
      </div>
    </main>

    <!-- Test Taking Interface -->
    <div v-else-if="!isTestCompleted" class="max-w-3xl mx-auto py-8">
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <!-- Progress Bar -->
        <div class="bg-gray-100 h-2 w-full">
          <div 
            class="bg-indigo-600 h-full transition-all duration-300 ease-out" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <span class="text-sm font-medium text-gray-500">
            Question {{ currentQuestionIndex + 1 }} of {{ activeTest.questions.length }}
          </span>
          <span class="text-sm font-semibold text-indigo-600">
            {{ Math.round(progressPercentage) }}% Complete
          </span>
        </div>

        <div class="p-8">
          <div class="mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-2">{{ activeTest.title }}</h2>
            <h3 class="text-lg text-gray-700 leading-relaxed">{{ currentQuestion.text || currentQuestion.question }}</h3>
          </div>

          <!-- Options -->
          <div v-if="currentQuestion.type === 'multiple-choice' || currentQuestion.options" class="space-y-3">
            <label 
              v-for="(opt, j) in currentQuestion.options || ['true', 'false']" 
              :key="j" 
              class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50"
              :class="userAnswers[currentQuestionIndex] === (opt.text || opt) ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200'"
            >
              <input
                type="radio"
                :value="opt.text || opt"
                v-model="userAnswers[currentQuestionIndex]"
                class="sr-only"
              />
              <div 
                class="w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0"
                :class="userAnswers[currentQuestionIndex] === (opt.text || opt) ? 'border-indigo-600' : 'border-gray-300'"
              >
                <div v-if="userAnswers[currentQuestionIndex] === (opt.text || opt)" class="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
              </div>
              <span class="text-gray-700 font-medium">{{ opt.text || opt }}</span>
            </label>
          </div>

          <!-- Text Input -->
          <div v-else>
            <textarea
              v-model="userAnswers[currentQuestionIndex]"
              class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-colors text-gray-700"
              placeholder="Type your answer here..."
              rows="6"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex justify-end">
            <button 
              class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              @click="handleNextQuestion"
              :disabled="!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === ''"
            >
              <span v-if="isLastQuestion">Finish Test</span>
              <span v-else>Next Question</span>
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <div v-else class="max-w-2xl mx-auto py-12">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
          <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h2>
        <p class="text-gray-500 mb-8">You've successfully finished the assessment.</p>
        
        <div class="flex flex-col items-center justify-center mb-8">
          <div class="relative w-40 h-40 mb-4">
            <svg class="transform -rotate-90 w-full h-full">
              <circle
                class="text-gray-100"
                stroke-width="12"
                stroke="currentColor"
                fill="transparent"
                r="70"
                cx="80"
                cy="80"
              />
              <circle
                class="text-indigo-600 transition-all duration-1000 ease-out"
                stroke-width="12"
                stroke-linecap="round"
                stroke="currentColor"
                fill="transparent"
                r="70"
                cx="80"
                cy="80"
                :style="{ strokeDasharray: 440, strokeDashoffset: 440 - (score / 100) * 440 }"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-4xl font-bold text-gray-900">{{ score }}%</span>
            </div>
          </div>
          <div class="text-lg font-semibold" :class="{
            'text-green-600': score >= 70,
            'text-yellow-600': score >= 50 && score < 70,
            'text-red-600': score < 50
          }">
            {{ getScoreDescription(score) }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-green-50 rounded-xl p-4 border border-green-100">
            <div class="text-2xl font-bold text-green-700">{{ correctCount }}</div>
            <div class="text-sm font-medium text-green-600">Correct Answers</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div class="text-2xl font-bold text-gray-900">{{ activeTest.questions.length }}</div>
            <div class="text-sm font-medium text-gray-500">Total Questions</div>
          </div>
        </div>

        <button 
          @click="handleGoBack" 
          class="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Tests
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
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
    
    // Add error state
    const error = ref(null);
    const retryCount = ref(0);
    
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

    const hasActiveFilters = computed(() => {
      return !!(searchQuery.value || selectedSubject.value || selectedLevel.value);
    });
    
    // Fixed loadTests function
    const loadTests = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        // Create a timeout wrapper
        const withTimeout = (promise, timeoutMs = 10000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeoutMs)
            )
          ]);
        };

        // Try to load tests with multiple strategies
        let loadedTests = [];
        
        // Strategy 1: User-specific tests
        try {
          const userTestsResponse = await withTimeout(
            api.get(`/users/${userId}/tests`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            10000
          );
          
          if (userTestsResponse?.data?.tests) {
            loadedTests = userTestsResponse.data.tests;
          }
        } catch (userTestsError) {
          // Strategy 2: General tests endpoint
          try {
            const generalTestsResponse = await withTimeout(
              api.get('/tests', {
                headers: { Authorization: `Bearer ${token}` }
              }),
              10000
            );
            
            const testsData = generalTestsResponse?.data?.data || 
                             generalTestsResponse?.data || 
                             [];
            loadedTests = Array.isArray(testsData) 
              ? testsData.filter(test => test.isActive !== false) 
              : [];
          } catch (generalTestsError) {
            // Use empty array as final fallback
            loadedTests = [];
          }
        }
        
        tests.value = loadedTests;

      } catch (err) {
        error.value = err.message;
        tests.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Fixed handleStartTest with better error handling
    const handleStartTest = async (test) => {
      if (!test) return;
      
      try {
        loading.value = true;
        error.value = null;
        
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        const token = await user.getIdToken();
        const userId = user.uid;

        // Add timeout to prevent hanging
        const loadTestWithTimeout = async () => {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Loading test timeout')), 15000);
          });
          
          const loadPromise = (async () => {
            // Try user-specific endpoint first
            try {
              const { data } = await api.get(`/users/${userId}/tests/${test._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return data?.test || data?.data || data;
            } catch {
              // Fallback to general endpoint
              const { data } = await api.get(`/tests/${test._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return data?.data || data;
            }
          })();
          
          return Promise.race([loadPromise, timeoutPromise]);
        };
        
        const fullTest = await loadTestWithTimeout();
        
        if (!fullTest?.questions?.length) {
          throw new Error('Test contains no questions');
        }

        // Process test data
        activeTest.value = {
          ...fullTest,
          questions: fullTest.questions.map(q => ({
            ...q,
            text: q.text || q.question,
            type: q.type || 'multiple-choice',
            options: q.options || [],
            correctAnswer: q.correctAnswer
          }))
        };

        userAnswers.value = Array(activeTest.value.questions.length).fill('');
        currentQuestionIndex.value = 0;

      } catch (err) {
        error.value = err.message || 'Failed to load test';
        
        // Reset state on error
        activeTest.value = null;
      } finally {
        loading.value = false;
      }
    };

    // Fixed navigation with proper promise handling
    const handleNextQuestion = () => {
      const currentAnswer = userAnswers.value[currentQuestionIndex.value];
      if (!currentAnswer || currentAnswer.trim() === '') {
        return;
      }

      if (currentQuestionIndex.value + 1 < activeTest.value.questions.length) {
        currentQuestionIndex.value++;
      } else {
        // Use nextTick to avoid navigation timing issues
        nextTick(() => {
          handleSubmitTest();
        });
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
        console.error('Submit error:', err);
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

    const getScoreDescription = (score) => {
      if (score >= 90) return 'Excellent!';
      if (score >= 70) return 'Good!';
      if (score >= 50) return 'Satisfactory';
      return 'Need to improve';
    };
    
    // Add retry mechanism
    const retryLoadTests = async () => {
      retryCount.value++;
      if (retryCount.value <= 3) {
        await loadTests();
      } else {
        error.value = 'Failed to load tests after multiple attempts';
      }
    };
    
    // Cleanup on unmount
    onBeforeUnmount(() => {
      // Cancel any pending requests or timers
      activeTest.value = null;
      userAnswers.value = [];
    });

    // Initialize with error boundary
    onMounted(async () => {
      try {
        await loadTests();
      } catch (err) {
        error.value = 'Error loading page';
      }
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
      uniqueSubjects,
      uniqueLevels,
      filteredTests,
      currentQuestion,
      progressPercentage,
      isLastQuestion,
      isTestCompleted,
      correctCount,
      score,
      hasActiveFilters,
      error,
      retryCount,
      retryLoadTests,
      handleStartTest,
      handleNextQuestion,
      handleSubmitTest,
      handleGoBack,
      clearFilters,
      getScoreDescription,
    };
  }
};
</script>