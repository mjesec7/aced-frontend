<template>
  <div class="min-h-screen bg-white">
    <!-- Clean Header -->
    <div class="max-w-6xl mx-auto px-6 pt-8 pb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <span class="text-2xl">📚</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">{{ $t('catalogue.title') }}</h1>
            <p class="text-slate-500 text-sm">{{ filteredCourses.length }} {{ $t('catalogue.courses') }}</p>
          </div>
        </div>

        <!-- Status + Stats -->
        <div class="hidden md:flex items-center gap-3">
          <div class="px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-sm font-medium">
            📋 {{ studyPlanTopics.length }} {{ $t('catalogue.inPlan') }}
          </div>
          <div 
            class="px-4 py-2 rounded-full text-sm font-bold"
            :class="{
              'bg-gray-100 text-gray-600': userStatus === 'free',
              'bg-amber-100 text-amber-700': userStatus === 'start' || userStatus === 'pro'
            }"
          >
            {{ userStatus === 'pro' ? '⭐ Pro' : userStatus === 'start' ? '🌟 Start' : '🆓 Free' }}
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
            :placeholder="$t('catalogue.findCourse')"
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <!-- Filter Pills -->
        <select
          v-model="selectedSubjectFilter"
          class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer hover:border-gray-300 transition-all"
        >
          <option :value="null">{{ $t('catalogue.allSubjects') }}</option>
          <option v-for="subject in availableSubjects" :key="subject" :value="subject">{{ subject }}</option>
        </select>

        <select
          v-model="selectedLevelFilter"
          class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer hover:border-gray-300 transition-all"
        >
          <option :value="null">{{ $t('catalogue.allLevels') }}</option>
          <option v-for="level in availableLevels" :key="level" :value="level">{{ $t('dashboard.level') }} {{ level }}</option>
        </select>

        <select
          v-model="typeFilter"
          class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer hover:border-gray-300 transition-all"
        >
          <option value="all">{{ $t('catalogue.allTypes') }}</option>
          <option value="free">{{ $t('catalogue.free') }}</option>
          <option value="premium">{{ $t('catalogue.premium') }}</option>
        </select>

        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          {{ $t('catalogue.clear') }}
        </button>

        <button 
          @click="shuffleCourses"
          class="p-2.5 rounded-xl border border-gray-200 text-slate-500 hover:border-gray-300 hover:text-slate-700 transition-all"
          title="Shuffle"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
            <line x1="4" y1="4" x2="9" y2="9"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24">
      <div class="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      <p class="mt-4 text-slate-500 text-sm">{{ $t('catalogue.loadingCourses') }}</p>
    </div>

    <!-- Content -->
    <main v-else class="max-w-6xl mx-auto px-6 pb-12">
      <!-- Empty State -->
      <div v-if="!filteredCourses.length" class="text-center py-24">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-lg font-semibold text-slate-800 mb-2">{{ $t('catalogue.noCoursesFound') }}</h3>
        <p class="text-slate-500 text-sm">{{ $t('catalogue.tryAdjustingFilters') }}</p>
      </div>

      <!-- School Mode: Grouped by Subject -->
      <div v-else-if="isSchoolMode" class="space-y-10">
        <section v-for="(courses, subject) in coursesBySubject" :key="subject">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-2xl">{{ getSubjectEmoji(subject) }}</span>
            <h2 class="text-xl font-bold text-slate-800">{{ subject }}</h2>
            <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">{{ courses.length }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <article 
              v-for="course in courses" 
              :key="course.topicId"
              @click="handleCourseAccess(course.topicId, course.type)"
              class="group p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:scale-[1.02] transition-all duration-200 cursor-pointer bg-white"
            >
              <!-- Top Row -->
              <div class="flex items-center justify-between mb-3">
                <span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                  {{ $t('catalogue.lvl') }} {{ course.level }}
                </span>
                <div class="flex items-center gap-2">
                  <span 
                    class="px-2 py-1 rounded-lg text-xs font-bold"
                    :class="course.type === 'free' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ course.type === 'free' ? 'FREE' : 'PRO' }}
                  </span>
                  <button 
                    @click.stop="addToStudyPlan(course)"
                    :disabled="course.inStudyPlan"
                    class="p-1.5 rounded-lg transition-all"
                    :class="course.inStudyPlan ? 'bg-indigo-100 text-indigo-500' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" :fill="course.inStudyPlan ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Title -->
              <h3 class="font-semibold text-slate-800 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {{ getTopicName(course) }}
              </h3>

              <!-- Meta -->
              <div class="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  </svg>
                  {{ course.lessonCount }} {{ $t('catalogue.lessons') }}
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ course.totalTime }}m
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="mb-3">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-400">{{ $t('catalogue.progress') }}</span>
                  <span class="font-medium text-slate-600">{{ course.progress }}%</span>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="getProgressColor(course.progress)"
                    :style="{ width: course.progress + '%' }"
                  ></div>
                </div>
              </div>

              <!-- Action -->
              <div class="pt-3 border-t border-gray-50 flex justify-end">
                <span class="text-sm font-medium text-indigo-500 group-hover:text-indigo-600 flex items-center gap-1">
                  {{ getButtonText(course.progress) }}
                  <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </div>
            </article>
          </div>
        </section>
      </div>

      <!-- Study Centre Mode: Grid with Pagination -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <article 
            v-for="course in paginatedCourses" 
            :key="course.topicId"
            @click="handleCourseAccess(course.topicId, course.type)"
            class="group p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:scale-[1.02] transition-all duration-200 cursor-pointer bg-white"
          >
            <!-- Top Row -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ getSubjectEmoji(course.subject) }}</span>
                <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ course.subject }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  class="px-2 py-1 rounded-lg text-xs font-bold"
                  :class="course.type === 'free' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'"
                >
                  {{ course.type === 'free' ? 'FREE' : 'PRO' }}
                </span>
                <button 
                  @click.stop="addToStudyPlan(course)"
                  :disabled="course.inStudyPlan"
                  class="p-1.5 rounded-lg transition-all"
                  :class="course.inStudyPlan ? 'bg-indigo-100 text-indigo-500' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" :fill="course.inStudyPlan ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Title -->
            <h3 class="font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {{ getTopicName(course) }}
            </h3>

            <!-- Level -->
            <div class="text-xs text-slate-500 mb-3">{{ $t('dashboard.level') }} {{ course.level }} · {{ getLevelDescription(course.level) }}</div>

            <!-- Meta -->
            <div class="flex items-center gap-4 text-xs text-slate-500 mb-4">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                </svg>
                {{ course.lessonCount }} {{ $t('catalogue.lessons') }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ course.totalTime }}m
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="mb-3">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-400">{{ $t('catalogue.progress') }}</span>
                <span class="font-medium text-slate-600">{{ course.progress }}%</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  :class="getProgressColor(course.progress)"
                  :style="{ width: course.progress + '%' }"
                ></div>
              </div>
            </div>

            <!-- Action -->
            <div class="pt-3 border-t border-gray-50 flex justify-end">
              <span class="text-sm font-medium text-indigo-500 group-hover:text-indigo-600 flex items-center gap-1">
                {{ getButtonText(course.progress) }}
                <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-4">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1" 
            class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="text-sm text-slate-600">
            <span class="font-bold text-indigo-500">{{ currentPage }}</span> / {{ totalPages }}
          </span>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages" 
            class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </main>

    <!-- Add to Study Plan Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="showAddModal = false">
        <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" @click.stop>
          <div class="text-center mb-4">
            <div class="text-4xl mb-3">📋</div>
            <h3 class="text-lg font-bold text-slate-800">{{ $t('catalogue.addToStudyPlan') }}</h3>
          </div>
          <p class="text-slate-500 text-sm text-center mb-6" v-if="selectedCourse">
            <strong class="text-slate-800">{{ getTopicName(selectedCourse) }}</strong>
          </p>
          <div class="flex gap-3">
            <button @click="showAddModal = false" class="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-slate-600 hover:bg-gray-50 transition-all">{{ $t('catalogue.cancel') }}</button>
            <button @click="confirmAddToStudyPlan" class="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-all">{{ $t('catalogue.add') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Success Modal -->
    <transition name="fade">
      <div v-if="showSuccessModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="showSuccessModal = false">
        <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center" @click.stop>
          <div class="text-5xl mb-3">✅</div>
          <h3 class="text-lg font-bold text-slate-800 mb-2">{{ $t('catalogue.added') }}</h3>
          <p class="text-slate-500 text-sm mb-6" v-if="selectedCourse">{{ getTopicName(selectedCourse) }}</p>
          <button @click="showSuccessModal = false" class="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-all">{{ $t('catalogue.great') }}</button>
        </div>
      </div>
    </transition>

    <PaymentModal 
      v-if="showPaywall" 
      :user-id="userId" 
      :visible="showPaywall" 
      :requested-topic-id="requestedTopicId" 
      @close="showPaywall = false" 
      @unlocked="handlePaymentSuccess"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { userStatusMixin } from '@/composables/useUserStatus';
import { useLevelSystem } from '@/composables/useLevelSystem';
import { useModeContent } from '@/composables/useModeContent';
import { getAllLessons, getUserProgress, getUserStudyList, addToStudyList, getTopicsGrouped, getTopicsAsCourses } from '@/api';
import { useLanguage, getLocalizedText } from '@/composables/useLanguage';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'CataloguePage',
  components: { PaymentModal },
  mixins: [userStatusMixin],

  setup() {
    const { isSchoolMode, isStudyCentreMode, canAccessLevel, currentLevelCap, placementTestTaken } = useLevelSystem();
    const { groupedContent, courseCards, loading: modeLoading, error: modeError, subjects, fetchContent, getLevelsForSubject, getTopicsForLevel, totalTopicsCount } = useModeContent();
    const { language } = useLanguage();
    return { isSchoolMode, isStudyCentreMode, canAccessLevel, currentLevelCap, placementTestTaken, groupedContent, courseCards, modeLoading, modeError, subjects, fetchContent, getLevelsForSubject, getTopicsForLevel, totalTopicsCount, language };
  },

  data() {
    return {
      userId: null,
      lessons: [],
      userProgress: {},
      studyPlanTopics: [],
      isLoading: true,
      courses: [],
      searchQuery: '',
      selectedSubjectFilter: null,
      selectedLevelFilter: null,
      typeFilter: 'all',
      progressFilter: 'all',
      currentPage: 1,
      coursesPerPage: 12,
      randomSeed: Math.random(),
      showAddModal: false,
      showSuccessModal: false,
      showPaywall: false,
      selectedCourse: null,
      selectedCourse: null,
      requestedTopicId: null,
      rawData: null, // Store raw API response
      rawMode: null, // Store which mode the data is for
    };
  },

  watch: {
    // Re-process courses when language changes
    language() {
      this.refreshCourses();
    }
  },

  computed: {
    ...mapGetters('user', { vuexUserStatus: 'userStatus' }),
    userStatus() { return this.vuexUserStatus || localStorage.getItem('userStatus') || 'free'; },
    availableSubjects() { return [...new Set(this.courses.map(c => c.subject))].sort(); },
    availableLevels() { return [...new Set(this.courses.map(c => c.level))].sort((a, b) => Number(a) - Number(b)); },
    coursesBySubject() {
      if (!this.isSchoolMode) return {};
      const grouped = {};
      this.filteredCourses.forEach(c => {
        const s = c.subject || 'Uncategorized';
        if (!grouped[s]) grouped[s] = [];
        grouped[s].push(c);
      });
      Object.keys(grouped).forEach(s => grouped[s].sort((a, b) => Number(a.level) - Number(b.level)));
      return grouped;
    },
    filteredCourses() {
      let list = this.courses;
      if (this.isSchoolMode) list = list.filter(c => this.canAccessLevel(Number(c.level || 1)));
      return list.filter(c => {
        if (this.searchQuery) {
          // Search in the currently displayed localized name
          const displayName = this.getTopicName(c).toLowerCase();
          if (!displayName.includes(this.searchQuery.toLowerCase())) return false;
        }
        if (this.selectedSubjectFilter && c.subject !== this.selectedSubjectFilter) return false;
        if (this.selectedLevelFilter && c.level !== this.selectedLevelFilter) return false;
        if (this.typeFilter === 'free' && c.type !== 'free') return false;
        if (this.typeFilter === 'premium' && c.type === 'free') return false;
        return true;
      });
    },
    totalPages() { return Math.max(1, Math.ceil(this.filteredCourses.length / this.coursesPerPage)); },
    paginatedCourses() {
      const shuffled = [...this.filteredCourses].sort((a, b) => this.hashString(a.topicId + this.randomSeed) - this.hashString(b.topicId + this.randomSeed));
      return shuffled.slice((this.currentPage - 1) * this.coursesPerPage, this.currentPage * this.coursesPerPage);
    },
    hasActiveFilters() { return !!(this.searchQuery || this.selectedSubjectFilter || this.selectedLevelFilter || this.typeFilter !== 'all'); },
  },

  async mounted() {
    this.userId = this.$store?.state?.firebaseUserId || localStorage.getItem('firebaseUserId');
    if (!this.userId) { this.$router.push('/'); return; }
    await this.loadData();
  },

  methods: {
    async loadData() {
      this.isLoading = true;
      try {
        const [progressRes, studyRes] = await Promise.all([getUserProgress(this.userId), getUserStudyList(this.userId)]);
        if (progressRes?.success) this.userProgress = this.processProgressData(progressRes.data);
        if (studyRes?.success) this.studyPlanTopics = studyRes.data.map(i => this.extractTopicId(i.topicId)).filter(Boolean);
        
        try {
          if (this.isSchoolMode) {
            const r = await getTopicsGrouped();
            if (r.success && r.data) { 
              this.rawData = r.data;
              this.rawMode = 'school';
              this.processModeContent(r.data, 'school'); 
            }
          } else {
            const r = await getTopicsAsCourses();
            if (r.success && r.courses) { 
              this.rawData = r.courses;
              this.rawMode = 'study-centre';
              this.processModeContent(r.courses, 'study-centre'); 
            }
          }
        } catch {}
        
        const lessonsRes = await getAllLessons();
        this.lessons = lessonsRes?.data || [];
        this.mergeOrphanLessons();
      } catch {} finally { this.isLoading = false; }
    },

    refreshCourses() {
      if (this.rawData && this.rawMode) {
        this.processModeContent(this.rawData, this.rawMode);
      }
      if (this.lessons.length) {
        this.mergeOrphanLessons();
      }
    },
    
    processProgressData(data) {
      const progressMap = {}, lessonsByTopic = {};
      this.lessons.forEach(l => {
        const tid = this.extractTopicId(l.topicId);
        if (tid) { if (!lessonsByTopic[tid]) lessonsByTopic[tid] = new Set(); lessonsByTopic[tid].add(this.extractTopicId(l._id)); }
      });
      data.forEach(p => { const tid = this.extractTopicId(p.topicId); if (tid && p.completed) { if (!progressMap[tid]) progressMap[tid] = 0; progressMap[tid]++; } });
      const final = {};
      for (const tid in lessonsByTopic) { final[tid] = lessonsByTopic[tid].size > 0 ? Math.round((progressMap[tid] || 0) / lessonsByTopic[tid].size * 100) : 0; }
      return final;
    },
    
    mergeOrphanLessons() {
      // Create a map of existing courses for quick lookup
      const existingTopics = new Set(this.courses.map(c => c.topicId));
      const orphanMap = new Map();

      this.lessons.forEach(l => {
        const tid = this.extractTopicId(l.topicId);
        if (!tid) return;

        // If topic already exists in courses, we might want to update stats, but for now we skip
        if (existingTopics.has(tid)) return;

        if (!orphanMap.has(tid)) {
          orphanMap.set(tid, {
            topicId: tid,
            // Store raw localized objects for reactive language switching
            _rawData: l,
            lessonName: l.lessonName || null,
            topicName: l.topicName || l.name || null,
            level: String(l.level || '1'),
            subject: this.getSubjectName(l),
            lessonCount: 0,
            totalTime: 0,
            type: 'free'
          });
        }

        const c = orphanMap.get(tid);
        c.lessonCount++;
        c.totalTime += l.estimatedTime || l.duration || 10;
        if (['premium', 'start', 'pro'].includes(l.type)) c.type = 'premium';
      });

      const orphans = Array.from(orphanMap.values()).map(c => ({
        ...c,
        progress: this.userProgress[c.topicId] || 0,
        inStudyPlan: this.studyPlanTopics.includes(c.topicId)
      }));

      // If we are refreshing, we want to keep the main courses and just re-append orphans?
      // Actually, processModeContent resets this.courses, so we just append here.
      // But if we call mergeOrphanLessons multiple times, we need to be careful not to duplicate.
      // Since refreshCourses calls processModeContent first (which resets), this is safe.
      this.courses = [...this.courses, ...orphans];
    },
    
    processModeContent(data, mode) {
      if (mode === 'school') {
        const all = [];
        for (const s in data) {
          for (const l in data[s]) {
            data[s][l].forEach(t => {
              all.push({
                topicId: t._id || t.id,
                // Store raw localized objects for reactive language switching
                _rawData: t,
                lessonName: t.lessonName || null,
                topicName: t.topicName || t.name || null,
                level: String(l),
                subject: s,
                lessonCount: t.lessonCount || 0,
                totalTime: t.totalTime || 10,
                type: t.type || 'free',
                progress: this.userProgress[t._id || t.id] || 0,
                inStudyPlan: this.studyPlanTopics.includes(t._id || t.id)
              });
            });
          }
        }
        this.courses = all;
      } else {
        this.courses = data.map(c => ({
          topicId: c._id || c.id || c.topicId,
          // Store raw localized objects for reactive language switching
          _rawData: c,
          lessonName: c.lessonName || null,
          topicName: c.topicName || c.name || null,
          level: String(c.level || 1),
          subject: c.subject || 'Uncategorized',
          lessonCount: c.lessonCount || 0,
          totalTime: c.totalTime || 10,
          type: c.type || 'free',
          progress: this.userProgress[c._id || c.id || c.topicId] || 0,
          inStudyPlan: this.studyPlanTopics.includes(c._id || c.id || c.topicId)
        }));
      }
    },
    
    clearFilters() { this.searchQuery = ''; this.selectedSubjectFilter = null; this.selectedLevelFilter = null; this.typeFilter = 'all'; this.currentPage = 1; },
    shuffleCourses() { this.randomSeed = Math.random(); this.currentPage = 1; },
    nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    prevPage() { if (this.currentPage > 1) { this.currentPage--; window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    handleCourseAccess(topicId, type) { if (!this.hasTopicAccess(type)) { this.requestedTopicId = topicId; this.showPaywall = true; return; } this.$router.push(`/topic/${topicId}/overview`); },
    addToStudyPlan(course) { if (course.inStudyPlan) return; this.selectedCourse = course; this.showAddModal = true; },
    async confirmAddToStudyPlan() {
      if (!this.selectedCourse || !this.userId) return;
      try {
        let rawId = this.selectedCourse.topicId || this.selectedCourse._id || this.selectedCourse.id;
        if (rawId && typeof rawId === 'object') rawId = rawId._id || rawId.id;
        const r = await addToStudyList(this.userId, { topicId: rawId, topic: this.getTopicName(this.selectedCourse), subject: this.selectedCourse.subject || 'General', level: parseInt(this.selectedCourse.level) || 1, lessonCount: this.selectedCourse.lessonCount || 0, totalTime: this.selectedCourse.totalTime || 10, type: this.selectedCourse.type || 'free' });
        if (r?.success) {
          this.selectedCourse.inStudyPlan = true;
          this.studyPlanTopics.push(this.selectedCourse.topicId);
          const idx = this.courses.findIndex(c => c.topicId === this.selectedCourse.topicId);
          if (idx !== -1) this.courses[idx].inStudyPlan = true;
          if (window.eventBus) window.eventBus.emit('studyListUpdated');
          this.showAddModal = false;
          this.showSuccessModal = true;
        }
      } catch (e) { alert(e.message); this.showAddModal = false; }
    },
    handlePaymentSuccess() { this.showPaywall = false; this.$forceUpdate(); },
    hashString(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; } return Math.abs(h); },
    extractTopicId(tid) { if (!tid) return null; if (typeof tid === 'string') return tid; if (typeof tid === 'object' && tid._id) return tid._id; return String(tid); },
    getSubjectName(l) {
      if (l?.subjectName) return getLocalizedText(l.subjectName);
      if (l?.subject) return String(l.subject);
      return 'Uncategorized';
    },
    getTopicName(l) {
      // Priority: lessonName (localized), topicName (localized), name (localized), title (localized), topic (string)
      return getLocalizedText(l, 'lessonName') ||
             getLocalizedText(l, 'topicName') ||
             getLocalizedText(l, 'name') ||
             getLocalizedText(l, 'title') ||
             (l?.topic && typeof l.topic === 'string' ? l.topic : '') ||
             'Untitled';
    },
    getLevelDescription(l) {
      const keys = { 1: 'catalogue.beginner', 2: 'catalogue.elementary', 3: 'catalogue.intermediate', 4: 'catalogue.intermediate', 5: 'catalogue.upperIntermediate', 6: 'catalogue.advanced' };
      return keys[parseInt(l)] ? this.$t(keys[parseInt(l)]) : `${this.$t('dashboard.level')} ${l}`;
    },
    getProgressColor(p) { if (p >= 80) return 'bg-green-500'; if (p >= 40) return 'bg-indigo-500'; if (p > 0) return 'bg-amber-500'; return 'bg-gray-200'; },
    getButtonText(p) { if (p === 100) return this.$t('catalogue.review'); if (p > 0) return this.$t('catalogue.continueBtn'); return this.$t('catalogue.start'); },
    hasTopicAccess(type) { return type === 'free' || this.userStatus === 'pro' || this.userStatus === 'start'; },
    getSubjectEmoji(s) { const e = { 'Mathematics': '📐', 'Math': '📐', 'English': '📚', 'Science': '🔬', 'Physics': '⚛️', 'Chemistry': '⚗️', 'Biology': '🧬', 'History': '📜', 'Geography': '🌍', 'Computer Science': '💻', 'Programming': '👨‍💻', 'Art': '🎨', 'Music': '🎵', 'Languages': '🗣️' }; return e[s] || '📖'; },
  },
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Mobile first responsive adjustments */
@media (max-width: 640px) {
  .min-h-screen { padding: 1rem !important; }
  .max-w-6xl { padding-left: 1rem !important; padding-right: 1rem !important; }
  .text-2xl { font-size: 1.25rem !important; }
  .gap-4 { gap: 0.75rem !important; }
  .gap-6 { gap: 1rem !important; }
  .grid-cols-1 { grid-template-columns: 1fr !important; }
  .p-5 { padding: 1rem !important; }
  .hidden.md\\:flex { display: none !important; }
  .relative.flex-1.min-w-64 { min-width: 100% !important; }
  .flex-wrap { flex-wrap: wrap !important; }
  .flex-wrap > select { flex: 1 1 45%; min-width: 120px; }
  .space-y-10 > section { margin-bottom: 2rem; }
}

@media (min-width: 641px) and (max-width: 1023px) {
  .grid { grid-template-columns: repeat(2, 1fr) !important; }
  .lg\\:grid-cols-3 { grid-template-columns: repeat(2, 1fr) !important; }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
}
</style>