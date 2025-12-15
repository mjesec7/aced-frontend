<template>
  <div class="min-h-screen bg-white">
    <!-- Clean Header -->
    <div class="max-w-6xl mx-auto px-6 pt-8 pb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <span class="text-2xl">📝</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Tests</h1>
            <p class="text-slate-500 text-sm">{{ filteredTests.length }} available</p>
          </div>
        </div>
        
        <!-- Inline Stats -->
        <div class="hidden md:flex items-center gap-3">
          <div class="px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
            📚 {{ uniqueSubjects.length }} subjects
          </div>
          <div class="px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-sm font-medium">
            ⭐ {{ uniqueLevels.length }} levels
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div v-if="!activeTest" class="max-w-6xl mx-auto px-6 pb-6">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="relative flex-1 min-w-64">
          <input
            v-model="searchQuery"
            type="text"
            class="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            placeholder="Search tests..."
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <!-- Filter Pills -->
        <select 
          v-model="selectedSubject" 
          class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer hover:border-gray-300 transition-all"
        >
          <option value="">All Subjects</option>
          <option v-for="subject in uniqueSubjects" :key="subject" :value="subject">{{ subject }}</option>
        </select>

        <select 
          v-model="selectedLevel" 
          class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer hover:border-gray-300 transition-all"
        >
          <option value="">All Levels</option>
          <option v-for="level in uniqueLevels" :key="level" :value="level">Level {{ level }}</option>
        </select>

        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters"
          class="px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24">
      <div class="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      <p class="mt-4 text-slate-500 text-sm">Loading...</p>
    </div>

    <!-- Tests Grid -->
    <div v-else-if="!activeTest" class="max-w-6xl mx-auto px-6 pb-12">
      <!-- Empty State -->
      <div v-if="filteredTests.length === 0" class="text-center py-24">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-lg font-semibold text-slate-800 mb-2">No tests found</h3>
        <p class="text-slate-500 text-sm">Try adjusting your filters</p>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <article 
          v-for="test in filteredTests" 
          :key="test._id"
          @click="handleStartTest(test)"
          class="group p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:scale-[1.02] transition-all duration-200 cursor-pointer bg-white"
        >
          <!-- Top Row -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ getSubjectEmoji(test.subject) }}</span>
              <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ test.subject || 'General' }}</span>
            </div>
            <span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
              Lvl {{ test.level || 1 }}
            </span>
          </div>

          <!-- Title -->
          <h3 class="font-semibold text-slate-800 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {{ test.title }}
          </h3>

          <!-- Meta -->
          <div class="flex items-center gap-4 text-xs text-slate-500">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {{ test.questions?.length || 0 }} questions
            </span>
            <span v-if="test.duration" class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ test.duration }}m
            </span>
          </div>

          <!-- Action -->
          <div class="mt-4 pt-4 border-t border-gray-50 flex justify-end">
            <span class="text-sm font-medium text-indigo-500 group-hover:text-indigo-600 flex items-center gap-1">
              Start
              <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </article>
      </div>
    </div>

    <!-- Test Taking Interface -->
    <div v-else-if="!isTestCompleted" class="max-w-2xl mx-auto px-6 py-8">
      <!-- Progress -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-slate-600">Question {{ currentQuestionIndex + 1 }} of {{ activeTest.questions.length }}</span>
          <span class="text-sm font-medium text-indigo-500">{{ Math.round(progressPercentage) }}%</span>
        </div>
        <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            class="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Question Card -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-6">{{ currentQuestion.text || currentQuestion.question }}</h2>

        <!-- Options -->
        <div v-if="currentQuestion.type === 'multiple-choice' || currentQuestion.options" class="space-y-3">
          <label 
            v-for="(opt, j) in currentQuestion.options || ['true', 'false']" 
            :key="j" 
            class="flex items-center p-4 rounded-xl border cursor-pointer transition-all hover:border-indigo-200 hover:bg-indigo-50/30"
            :class="userAnswers[currentQuestionIndex] === (opt.text || opt) ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'"
          >
            <input type="radio" :value="opt.text || opt" v-model="userAnswers[currentQuestionIndex]" class="sr-only"/>
            <div 
              class="w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors"
              :class="userAnswers[currentQuestionIndex] === (opt.text || opt) ? 'border-indigo-500' : 'border-gray-300'"
            >
              <div v-if="userAnswers[currentQuestionIndex] === (opt.text || opt)" class="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            </div>
            <span class="text-slate-700">{{ opt.text || opt }}</span>
          </label>
        </div>

        <!-- Text Input -->
        <div v-else>
          <textarea
            v-model="userAnswers[currentQuestionIndex]"
            class="w-full p-4 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition-all text-slate-700 resize-none"
            placeholder="Type your answer..."
            rows="4"
          ></textarea>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-end">
        <button 
          @click="handleNextQuestion"
          :disabled="!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].trim() === ''"
          class="px-6 py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {{ isLastQuestion ? 'Finish' : 'Next' }}
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-else class="max-w-md mx-auto px-6 py-16 text-center">
      <div class="text-6xl mb-6">{{ score >= 70 ? '🎉' : score >= 50 ? '👍' : '💪' }}</div>
      
      <h2 class="text-2xl font-bold text-slate-800 mb-2">
        {{ score >= 70 ? 'Great job!' : score >= 50 ? 'Good effort!' : 'Keep practicing!' }}
      </h2>
      <p class="text-slate-500 mb-8">You scored {{ score }}% on this test</p>

      <!-- Score Ring -->
      <div class="relative w-32 h-32 mx-auto mb-8">
        <svg class="transform -rotate-90 w-full h-full">
          <circle class="text-gray-100" stroke-width="8" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64"/>
          <circle 
            class="transition-all duration-1000 ease-out"
            :class="score >= 70 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-400'"
            stroke-width="8" stroke-linecap="round" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64"
            :style="{ strokeDasharray: 352, strokeDashoffset: 352 - (score / 100) * 352 }"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-3xl font-bold text-slate-800">{{ score }}%</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="flex justify-center gap-6 mb-8">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-500">{{ correctCount }}</div>
          <div class="text-xs text-slate-500">Correct</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-slate-800">{{ activeTest.questions.length }}</div>
          <div class="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <button 
        @click="handleGoBack"
        class="px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-all"
      >
        Back to Tests
      </button>
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
    const error = ref(null);
    
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
          test.title?.toLowerCase().includes(searchQuery.value.toLowerCase());
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

    const hasActiveFilters = computed(() => 
      !!(searchQuery.value || selectedSubject.value || selectedLevel.value)
    );

    const getSubjectEmoji = (subject) => {
      const emojis = {
        'Mathematics': '📐', 'Math': '📐',
        'English': '📚', 'Language': '📚',
        'Science': '🔬', 'Physics': '⚛️',
        'Chemistry': '⚗️', 'Biology': '🧬',
        'History': '📜', 'Geography': '🌍',
        'Computer Science': '💻', 'Programming': '👨‍💻',
        'Art': '🎨', 'Music': '🎵',
      };
      return emojis[subject] || '📖';
    };

    const loadTests = async () => {
      try {
        loading.value = true;
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');

        const token = await user.getIdToken();
        const userId = user.uid;

        let loadedTests = [];
        try {
          const { data } = await api.get(`/users/${userId}/tests`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          loadedTests = data?.tests || [];
        } catch {
          const { data } = await api.get('/tests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          loadedTests = Array.isArray(data?.data || data) ? (data?.data || data) : [];
        }
        
        tests.value = loadedTests.filter(t => t.isActive !== false);
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const handleStartTest = async (test) => {
      if (!test) return;
      try {
        loading.value = true;
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');

        const token = await user.getIdToken();
        const userId = user.uid;

        let fullTest;
        try {
          const { data } = await api.get(`/users/${userId}/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fullTest = data?.test || data?.data || data;
        } catch {
          const { data } = await api.get(`/tests/${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fullTest = data?.data || data;
        }

        if (!fullTest?.questions?.length) throw new Error('No questions');

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
        error.value = err.message;
        activeTest.value = null;
      } finally {
        loading.value = false;
      }
    };

    const handleNextQuestion = () => {
      const answer = userAnswers.value[currentQuestionIndex.value];
      if (!answer || answer.trim() === '') return;

      if (currentQuestionIndex.value + 1 < activeTest.value.questions.length) {
        currentQuestionIndex.value++;
      } else {
        nextTick(() => handleSubmitTest());
      }
    };

    const handleSubmitTest = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const answers = userAnswers.value.map((answer, index) => ({ questionIndex: index, answer }));

        try {
          await api.post(`/users/${user.uid}/tests/${activeTest.value._id}/submit`, { answers }, { headers: { Authorization: `Bearer ${token}` } });
        } catch {
          await api.post(`/tests/${activeTest.value._id}/submit`, { userId: user.uid, answers }, { headers: { Authorization: `Bearer ${token}` } });
        }

        currentQuestionIndex.value = activeTest.value.questions.length;
      } catch (err) {
        console.error(err);
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
      const correct = question.correctAnswer;
      if (question.type === 'multiple-choice' && Array.isArray(question.options)) {
        if (typeof correct === 'number') {
          return userAnswer === (question.options[correct]?.text || question.options[correct]);
        }
        return userAnswer === correct;
      }
      return userAnswer.toString().toLowerCase().trim() === correct.toString().toLowerCase().trim();
    };

    onMounted(() => loadTests());
    onBeforeUnmount(() => { activeTest.value = null; userAnswers.value = []; });

    return {
      loading, tests, activeTest, userAnswers, currentQuestionIndex,
      searchQuery, selectedSubject, selectedLevel, error,
      uniqueSubjects, uniqueLevels, filteredTests, currentQuestion,
      progressPercentage, isLastQuestion, isTestCompleted, correctCount, score, hasActiveFilters,
      getSubjectEmoji, handleStartTest, handleNextQuestion, handleGoBack, clearFilters
    };
  }
};
</script>

<style scoped>
/* Mobile first responsive adjustments */
@media (max-width: 640px) {
  .min-h-screen { padding: 1rem !important; }
  .max-w-6xl { padding-left: 1rem !important; padding-right: 1rem !important; }
  .text-2xl { font-size: 1.25rem !important; }
  .gap-4 { gap: 0.75rem !important; }
  .grid-cols-1 { grid-template-columns: 1fr !important; }
  .p-5 { padding: 1rem !important; }
  .hidden.md\\:flex { display: none !important; }
  .relative.flex-1.min-w-64 { min-width: 100% !important; }
  .flex-wrap { flex-wrap: wrap !important; }
  .flex-wrap > select { flex: 1 1 45%; min-width: 120px; }
}

@media (min-width: 641px) and (max-width: 1023px) {
  .grid { grid-template-columns: repeat(2, 1fr) !important; }
  .lg\\:grid-cols-3 { grid-template-columns: repeat(2, 1fr) !important; }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
}
</style>