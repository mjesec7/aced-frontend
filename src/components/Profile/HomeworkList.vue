<template>
  <div class="min-h-screen bg-[#fafafa] p-6">
    <!-- Hero Header -->
    <header class="max-w-7xl mx-auto mb-8 relative overflow-hidden rounded-2xl bg-indigo-600 text-white shadow-lg">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90"></div>
      <div class="relative z-10 px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Homework Assignments
          </div>
          <h1 class="text-3xl md:text-4xl font-bold mb-2">Your Assignments</h1>
          <p class="text-indigo-100 text-lg">{{ validHomeworks.length }} assignments available</p>
        </div>
        <!-- Decorative Icon -->
        <div class="hidden md:block opacity-20 transform rotate-12">
          <svg class="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
      </div>
    </header>

    <!-- Stats Section -->
    <div class="max-w-7xl mx-auto mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ totalHomeworks }}</div>
            <div class="text-sm text-gray-500 font-medium">Total Assignments</div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ completedHomeworks }}</div>
            <div class="text-sm text-gray-500 font-medium">Completed</div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ inProgressHomeworks }}</div>
            <div class="text-sm text-gray-500 font-medium">In Progress</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Section -->
    <div class="max-w-7xl mx-auto mb-8">
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
            placeholder="Search by title..."
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
              <option v-for="subject in subjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
            <select v-model="selectedStatus" class="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer">
              <option value="">All</option>
              <option value="pending">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
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

          <button 
            @click="refreshHomeworks" 
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500 font-medium">Loading assignments...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 border-dashed max-w-7xl mx-auto">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">Load Error</h3>
      <p class="text-gray-500 text-center max-w-xs mb-6">{{ error }}</p>
      <button 
        @click="refreshHomeworks" 
        class="px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="displayableHomeworks.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 border-dashed max-w-7xl mx-auto">
      <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">
        {{ validHomeworks.length === 0 ? 'No Homework' : 'No Matches Found' }}
      </h3>
      <p class="text-gray-500 text-center max-w-xs mb-6">
        {{ validHomeworks.length === 0 ? 'Homework will appear after starting a course or completing a lesson.' : 'Try adjusting your search or filters.' }}
      </p>
      <button 
        v-if="validHomeworks.length > 0" 
        @click="clearFilters" 
        class="px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
      >
        Clear Filters
      </button>
      <button 
        v-else 
        @click="refreshHomeworks" 
        class="px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
      >
        Refresh
      </button>
    </div>

    <!-- Homework Grid -->
    <main v-else class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article 
          v-for="hw in displayableHomeworks" 
          :key="getHomeworkKey(hw)" 
          class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col relative overflow-hidden"
          :class="{ 'ring-2 ring-red-100': isUrgent(hw) }"
        >
          <!-- Urgent Badge -->
          <div v-if="isUrgent(hw)" class="absolute top-0 right-0 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
            DUE SOON
          </div>

          <div class="p-6 flex-1">
            <div class="flex items-start justify-between mb-4">
              <div class="flex gap-2">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-gray-100 text-gray-600': getStatus(hw) === 'pending',
                    'bg-amber-100 text-amber-700': getStatus(hw) === 'in-progress',
                    'bg-green-100 text-green-700': getStatus(hw) === 'completed'
                  }"
                >
                  {{ statusLabel(hw) }}
                </span>
                <span v-if="hw.type" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                  {{ getTypeLabel(hw.type) }}
                </span>
              </div>
            </div>

            <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
              {{ getHomeworkTitle(hw) }}
            </h3>
            
            <div class="flex flex-col gap-2 mb-4">
              <div v-if="hw.subject" class="flex items-center gap-2 text-sm text-gray-500">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {{ hw.subject }}
              </div>
              <div v-if="getExerciseCount(hw) > 0" class="flex items-center gap-2 text-sm text-gray-500">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {{ getExerciseCount(hw) }} {{ getExerciseWord(getExerciseCount(hw)) }}
              </div>
              <div v-if="hw.dueDate" class="flex items-center gap-2 text-sm" :class="isOverdue(hw) ? 'text-red-500 font-medium' : 'text-gray-500'">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ formatDate(hw.dueDate) }}
              </div>
            </div>

            <!-- Difficulty Stars -->
            <div v-if="hw.difficulty" class="flex items-center gap-2 mb-4">
              <span class="text-xs font-semibold text-gray-400 uppercase">Difficulty:</span>
              <div class="flex">
                <span 
                  v-for="i in 5" 
                  :key="i" 
                  class="text-sm"
                  :class="i <= hw.difficulty ? 'text-amber-400' : 'text-gray-200'"
                >★</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-auto">
              <div class="flex justify-between items-end mb-1">
                <span class="text-xs font-semibold text-gray-500 uppercase">Progress</span>
                <span class="text-xs font-bold text-gray-900">{{ getScore(hw) }}%</span>
              </div>
              <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  :class="{
                    'bg-green-500': getScore(hw) >= 80,
                    'bg-indigo-500': getScore(hw) >= 50 && getScore(hw) < 80,
                    'bg-amber-500': getScore(hw) > 0 && getScore(hw) < 50,
                    'bg-gray-300': getScore(hw) === 0
                  }"
                  :style="{ width: getProgressWidth(hw) }"
                ></div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
            <button 
              class="flex items-center gap-2 text-sm font-semibold transition-all group-hover:translate-x-1"
              :class="isCompleted(hw) ? 'text-green-600' : 'text-indigo-600'"
              @click="goToHomework(hw)"
            >
              {{ getButtonText(hw) }}
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script>
import { getAllHomeworks } from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'HomeworkList',
  data() {
    return {
      homeworks: [],
      loading: true,
      error: null,
      selectedSubject: '',
      selectedStatus: '',
      searchQuery: '',
      heroImages: [
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&h=400&fit=crop&q=80',
      ],
      currentHeroImage: '',
    };
  },
  
  computed: {
    subjects() {
      const subjects = [...new Set(this.validHomeworks.map(hw => hw.subject).filter(Boolean))];
      return subjects.sort();
    },
    
    validHomeworks() {
      return this.homeworks.filter(hw => {
        if (!hw) return false;
        const hasValidId = (hw._id || hw.lessonId) && 
                          hw._id !== 'null' && 
                          hw.lessonId !== 'null';
        if (!hasValidId) return false;
        const hasTitle = hw.title || hw.lessonName;
        if (!hasTitle) return false;
        const hasExercises = this.getExerciseCount(hw) > 0;
        if (!hasExercises) return false;
        return true;
      });
    },
    
    filteredHomeworks() {
      return this.validHomeworks.filter(hw => {
        const matchesSubject = !this.selectedSubject || hw.subject === this.selectedSubject;
        const matchesStatus = !this.selectedStatus || this.getStatus(hw) === this.selectedStatus;
        const matchesSearch = !this.searchQuery || 
          this.getHomeworkTitle(hw).toLowerCase().includes(this.searchQuery.toLowerCase());
        return matchesSubject && matchesStatus && matchesSearch;
      });
    },
    
    displayableHomeworks() {
      return this.filteredHomeworks;
    },
    
    totalHomeworks() {
      return this.validHomeworks.length;
    },
    
    completedHomeworks() {
      return this.validHomeworks.filter(hw => this.isCompleted(hw)).length;
    },
    
    inProgressHomeworks() {
      return this.validHomeworks.filter(hw => this.hasProgress(hw) && !this.isCompleted(hw)).length;
    },
    
    hasActiveFilters() {
      return !!(this.searchQuery || this.selectedSubject || this.selectedStatus);
    },
  },
  
  methods: {
    selectRandomHeroImage() {
      const randomIndex = Math.floor(Math.random() * this.heroImages.length);
      this.currentHeroImage = this.heroImages[randomIndex];
    },
    
    getHomeworkKey(hw) {
      if (hw._id) return `hw-${hw._id}`;
      if (hw.lessonId) return `lesson-${hw.lessonId}`;
      return `temp-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    getHomeworkTitle(hw) {
      return hw.title || hw.lessonName || 'Homework' || 'Untitled';
    },
    
    getExerciseCount(hw) {
      if (hw.exerciseCount && hw.exerciseCount > 0) return hw.exerciseCount;
      if (hw.exercises && Array.isArray(hw.exercises)) return hw.exercises.length;
      if (hw.homework && Array.isArray(hw.homework)) return hw.homework.length;
      if (hw.questions && Array.isArray(hw.questions)) return hw.questions.length;
      return 0;
    },
    
    getExerciseWord(count) {
      if (count === 1) return 'exercise';
      return 'exercises';
    },
    
    getTypeLabel(type) {
      switch (type) {
        case 'standalone': return 'Standalone';
        case 'lesson': return 'Lesson';
        default: return 'HW';
      }
    },
    
    hasProgress(hw) {
      return !!(
        hw.hasProgress ||
        hw.completed !== undefined ||
        hw.score !== undefined ||
        hw.userProgress ||
        hw.progress
      );
    },
    
    isCompleted(hw) {
      return !!(
        hw.completed ||
        hw.userProgress?.completed ||
        hw.progress?.completed
      );
    },
    
    getScore(hw) {
      return (
        hw.score ||
        hw.userProgress?.score ||
        hw.progress?.score ||
        0
      );
    },
    
    async goToHomework(hw) {
      try {
        let routeName = 'HomeworkPage';
        let params = { id: hw._id || hw.lessonId };
        let query = {
          title: this.getHomeworkTitle(hw),
          subject: hw.subject || 'Unknown',
          type: hw.type || (hw.lessonId ? 'lesson' : 'standalone')
        };
        
        await this.$router.push({
          name: routeName,
          params: params,
          query: query
        });
      } catch (err) {
        console.error('Navigation error:', err);
      }
    },
    
    statusLabel(hw) {
      if (!this.hasProgress(hw)) return 'Not Started';
      if (!this.isCompleted(hw)) return 'In Progress';
      return 'Completed';
    },
    
    getStatus(hw) {
      if (!this.hasProgress(hw)) return 'pending';
      if (!this.isCompleted(hw)) return 'in-progress';
      return 'completed';
    },
    
    getProgressWidth(hw) {
      if (!this.hasProgress(hw)) return '0%';
      return `${this.getScore(hw)}%`;
    },
    
    getButtonText(hw) {
      if (this.isCompleted(hw)) return 'View';
      if (this.hasProgress(hw)) return 'Continue';
      return 'Start';
    },
    
    clearFilters() {
      this.selectedSubject = '';
      this.selectedStatus = '';
      this.searchQuery = '';
    },
    
    refreshHomeworks() {
      this.fetchHomeworks();
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    },
    
    isOverdue(hw) {
      if (!hw.dueDate) return false;
      return new Date(hw.dueDate) < new Date() && !this.isCompleted(hw);
    },
    
    isUrgent(hw) {
      if (!hw.dueDate || this.isCompleted(hw)) return false;
      const dueDate = new Date(hw.dueDate);
      const now = new Date();
      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    },
    
    async fetchHomeworks() {
      try {
        this.loading = true;
        this.error = null;
        
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authorized');
        }
        
        const result = await getAllHomeworks(user.uid);
        
        if (result.success && result.data) {
          this.homeworks = result.data.map(hw => ({
            ...hw,
            hasProgress: this.extractHasProgress(hw),
            completed: this.extractCompleted(hw),
            score: this.extractScore(hw),
          }));
        } else {
          this.error = result.error || 'Failed to load homework';
          this.homeworks = [];
        }
      } catch (err) {
        this.error = err.message || 'Error loading homework';
        this.homeworks = [];
      } finally {
        this.loading = false;
      }
    },
    
    extractCompleted(hw) {
      return !!(
        hw.completed ||
        hw.userProgress?.completed ||
        hw.progress?.completed
      );
    },
    
    extractScore(hw) {
      return (
        hw.score ||
        hw.userProgress?.score ||
        hw.progress?.score ||
        0
      );
    },
    
    extractHasProgress(hw) {
      return !!(
        hw.hasProgress ||
        hw.userProgress ||
        hw.progress ||
        hw.completed !== undefined ||
        hw.score !== undefined
      );
    }
  },
  
  async mounted() {
    this.selectRandomHeroImage();
    await this.fetchHomeworks();
  }
};
</script>