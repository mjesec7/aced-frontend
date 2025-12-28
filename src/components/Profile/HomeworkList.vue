<template>
  <div class="min-h-screen bg-white">
    <!-- Clean Header -->
    <div class="max-w-6xl mx-auto px-6 pt-8 pb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
            <span class="text-2xl">📝</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">{{ $t('homeworkList.title') }}</h1>
            <p class="text-slate-500 text-sm">{{ validHomeworks.length }} {{ $t('homeworkList.assignments') }}</p>
          </div>
        </div>
        
        <!-- Inline Stats -->
        <div class="hidden md:flex items-center gap-3">
          <div class="px-4 py-2 rounded-full bg-green-50 text-green-600 text-sm font-medium">
            ✅ {{ completedHomeworks }} {{ $t('homeworkList.done') }}
          </div>
          <div class="px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-sm font-medium">
            ⏳ {{ inProgressHomeworks }} {{ $t('homeworkList.inProgress') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="max-w-6xl mx-auto px-6 pb-6">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="relative flex-1 min-w-64">
          <input
            v-model="searchQuery"
            type="text"
            class="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            :placeholder="$t('homeworkList.searchPlaceholder')"
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
          <option value="">{{ $t('homeworkList.allSubjects') }}</option>
          <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
        </select>

        <select 
          v-model="selectedStatus" 
          class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer hover:border-gray-300 transition-all"
        >
          <option value="">{{ $t('homeworkList.allStatus') }}</option>
          <option value="pending">{{ $t('homeworkList.notStarted') }}</option>
          <option value="in-progress">{{ $t('homeworkList.statusInProgress') }}</option>
          <option value="completed">{{ $t('homeworkList.completed') }}</option>
        </select>

        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters"
          class="px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          {{ $t('homeworkList.clear') }}
        </button>

        <button 
          @click="refreshHomeworks"
          class="p-2.5 rounded-xl border border-gray-200 text-slate-500 hover:border-gray-300 hover:text-slate-700 transition-all"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24">
      <div class="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
      <p class="mt-4 text-slate-500 text-sm">{{ $t('homeworkList.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-24">
      <div class="text-6xl mb-4">😕</div>
      <h3 class="text-lg font-semibold text-slate-800 mb-2">{{ $t('homeworkList.somethingWentWrong') }}</h3>
      <p class="text-slate-500 text-sm mb-4">{{ error }}</p>
      <button @click="refreshHomeworks" class="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-all">
        {{ $t('homeworkList.tryAgain') }}
      </button>
    </div>

    <!-- Homework Grid -->
    <div v-else class="max-w-6xl mx-auto px-6 pb-12">
      <!-- Empty State -->
      <div v-if="displayableHomeworks.length === 0" class="text-center py-24">
        <div class="text-6xl mb-4">{{ validHomeworks.length === 0 ? '📭' : '🔍' }}</div>
        <h3 class="text-lg font-semibold text-slate-800 mb-2">
          {{ validHomeworks.length === 0 ? $t('homeworkList.noHomeworkYet') : $t('homeworkList.noMatchesFound') }}
        </h3>
        <p class="text-slate-500 text-sm">
          {{ validHomeworks.length === 0 ? $t('homeworkList.startCourseToGet') : $t('homeworkList.tryDifferentFilters') }}
        </p>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <article 
          v-for="hw in displayableHomeworks" 
          :key="getHomeworkKey(hw)"
          @click="goToHomework(hw)"
          class="group p-5 rounded-2xl border border-gray-100 hover:border-purple-200 hover:scale-[1.02] transition-all duration-200 cursor-pointer bg-white relative"
        >
          <!-- Urgent Badge -->
          <div v-if="isUrgent(hw)" class="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
            {{ $t('homeworkList.dueSoon') }}
          </div>

          <!-- Top Row -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ getSubjectEmoji(hw.subject) }}</span>
              <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ hw.subject || 'General' }}</span>
            </div>
            <span 
              class="px-2 py-1 rounded-lg text-xs font-medium"
              :class="{
                'bg-slate-100 text-slate-500': getStatus(hw) === 'pending',
                'bg-amber-100 text-amber-600': getStatus(hw) === 'in-progress',
                'bg-green-100 text-green-600': getStatus(hw) === 'completed'
              }"
            >
              {{ statusLabel(hw) }}
            </span>
          </div>

          <!-- Title -->
          <h3 class="font-semibold text-slate-800 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {{ getHomeworkTitle(hw) }}
          </h3>

          <!-- Meta -->
          <div class="flex items-center gap-4 text-xs text-slate-500 mb-4">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {{ getExerciseCount(hw) }} {{ $t('homeworkList.exercises') }}
            </span>
            <span v-if="hw.dueDate" class="flex items-center gap-1" :class="isOverdue(hw) ? 'text-red-500 font-medium' : ''">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ formatDate(hw.dueDate) }}
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="mb-4">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-slate-400">{{ $t('homeworkList.progress') }}</span>
              <span class="font-medium text-slate-600">{{ getScore(hw) }}%</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="{
                  'bg-green-500': getScore(hw) >= 80,
                  'bg-purple-500': getScore(hw) >= 50 && getScore(hw) < 80,
                  'bg-amber-500': getScore(hw) > 0 && getScore(hw) < 50,
                  'bg-gray-200': getScore(hw) === 0
                }"
                :style="{ width: getScore(hw) + '%' }"
              ></div>
            </div>
          </div>

          <!-- Action -->
          <div class="pt-4 border-t border-gray-50 flex justify-end">
            <span 
              class="text-sm font-medium flex items-center gap-1"
              :class="isCompleted(hw) ? 'text-green-500' : 'text-purple-500 group-hover:text-purple-600'"
            >
              {{ getButtonText(hw) }}
              <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </article>
      </div>
    </div>
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
    };
  },
  
  computed: {
    subjects() {
      return [...new Set(this.validHomeworks.map(hw => hw.subject).filter(Boolean))].sort();
    },
    
    validHomeworks() {
      return this.homeworks.filter(hw => {
        if (!hw) return false;
        const hasValidId = (hw._id || hw.lessonId) && hw._id !== 'null' && hw.lessonId !== 'null';
        const hasTitle = hw.title || hw.lessonName;
        const hasExercises = this.getExerciseCount(hw) > 0;
        return hasValidId && hasTitle && hasExercises;
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
    getSubjectEmoji(subject) {
      const emojis = {
        'Mathematics': '📐', 'Math': '📐',
        'English': '📚', 'Language': '📚',
        'Science': '🔬', 'Physics': '⚛️',
        'Chemistry': '⚗️', 'Biology': '🧬',
        'History': '📜', 'Geography': '🌍',
        'Computer Science': '💻', 'Programming': '👨‍💻',
      };
      return emojis[subject] || '📝';
    },

    getHomeworkKey(hw) {
      return hw._id ? `hw-${hw._id}` : hw.lessonId ? `lesson-${hw.lessonId}` : `temp-${Math.random()}`;
    },
    
    getHomeworkTitle(hw) {
      return hw.title || hw.lessonName || 'Homework';
    },
    
    getExerciseCount(hw) {
      if (hw.exerciseCount > 0) return hw.exerciseCount;
      if (Array.isArray(hw.exercises)) return hw.exercises.length;
      if (Array.isArray(hw.homework)) return hw.homework.length;
      if (Array.isArray(hw.questions)) return hw.questions.length;
      return 0;
    },
    
    hasProgress(hw) {
      return !!(hw.hasProgress || hw.completed !== undefined || hw.score !== undefined || hw.userProgress || hw.progress);
    },
    
    isCompleted(hw) {
      return !!(hw.completed || hw.userProgress?.completed || hw.progress?.completed);
    },
    
    getScore(hw) {
      return hw.score || hw.userProgress?.score || hw.progress?.score || 0;
    },
    
    async goToHomework(hw) {
      try {
        await this.$router.push({
          name: 'HomeworkPage',
          params: { id: hw._id || hw.lessonId },
          query: {
            title: this.getHomeworkTitle(hw),
            subject: hw.subject || 'Unknown',
            type: hw.type || (hw.lessonId ? 'lesson' : 'standalone')
          }
        });
      } catch (err) {
        console.error(err);
      }
    },
    
    statusLabel(hw) {
      if (!this.hasProgress(hw)) return this.$t('homeworkList.notStarted');
      if (!this.isCompleted(hw)) return this.$t('homeworkList.statusInProgress');
      return this.$t('homeworkList.completed');
    },
    
    getStatus(hw) {
      if (!this.hasProgress(hw)) return 'pending';
      if (!this.isCompleted(hw)) return 'in-progress';
      return 'completed';
    },
    
    getButtonText(hw) {
      if (this.isCompleted(hw)) return this.$t('homeworkList.view');
      if (this.hasProgress(hw)) return this.$t('homeworkList.continue');
      return this.$t('homeworkList.start');
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
      return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    },
    
    isOverdue(hw) {
      return hw.dueDate && new Date(hw.dueDate) < new Date() && !this.isCompleted(hw);
    },
    
    isUrgent(hw) {
      if (!hw.dueDate || this.isCompleted(hw)) return false;
      const diffDays = Math.ceil((new Date(hw.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    },
    
    async fetchHomeworks() {
      try {
        this.loading = true;
        this.error = null;
        
        const user = auth.currentUser;
        if (!user) throw new Error('Not authorized');
        
        const result = await getAllHomeworks(user.uid);
        
        if (result.success && result.data) {
          this.homeworks = result.data.map(hw => ({
            ...hw,
            hasProgress: !!(hw.hasProgress || hw.userProgress || hw.progress || hw.completed !== undefined || hw.score !== undefined),
            completed: !!(hw.completed || hw.userProgress?.completed || hw.progress?.completed),
            score: hw.score || hw.userProgress?.score || hw.progress?.score || 0,
          }));
        } else {
          this.error = result.error || 'Failed to load';
          this.homeworks = [];
        }
      } catch (err) {
        this.error = err.message;
        this.homeworks = [];
      } finally {
        this.loading = false;
      }
    },
  },
  
  async mounted() {
    await this.fetchHomeworks();
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