<template>
  <div class="catalogue-page">
    <!-- Redesigned Header -->
    <div class="catalogue-header">
      <div class="header-top">
        <div class="header-left">
          <h1 class="page-title">{{ $t('catalogue.title') }}</h1>
          <p class="page-subtitle">{{ $t('catalogue.subtitle') || 'From quick bites to deep dives.' }}</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-number">{{ totalCourseCount }}</span>
            <span class="stat-label">{{ $t('catalogue.courses') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ uniqueCreatorsCount }}</span>
            <span class="stat-label">{{ $t('catalogue.creators') }}</span>
          </div>
        </div>
      </div>

      <!-- Category Chips -->
      <div class="category-chips-wrapper">
        <div class="category-chips">
          <button
            class="category-chip"
            :class="{ active: !selectedSubjectFilter }"
            @click="selectedSubjectFilter = null"
          >
            <span class="chip-emoji">🎯</span>
            {{ $t('catalogue.all') }}
          </button>
          <button
            v-for="subject in availableSubjects"
            :key="subject"
            class="category-chip"
            :class="{ active: selectedSubjectFilter === subject }"
            @click="selectedSubjectFilter = subject"
          >
            <span class="chip-emoji">{{ getSubjectEmoji(subject) }}</span>
            {{ subject }}
          </button>
        </div>
      </div>

      <!-- Study Mode Tabs -->
      <div class="study-mode-row">
        <div class="study-mode-tabs">
          <button
            class="mode-tab"
            :class="{ active: studyModeFilter === 'all' }"
            @click="studyModeFilter = 'all'"
          >
            {{ $t('catalogue.all') || 'All' }}
          </button>
          <button
            class="mode-tab"
            :class="{ active: studyModeFilter === 'quick-skill' }"
            @click="studyModeFilter = 'quick-skill'"
          >
            {{ $t('catalogue.quickSkills') || 'Quick Skills' }}
          </button>
          <button
            class="mode-tab"
            :class="{ active: studyModeFilter === 'mastery-path' }"
            @click="studyModeFilter = 'mastery-path'"
          >
            {{ $t('catalogue.deepDives') || 'Deep Dives' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Continue Learning Section (if user has courses in progress) -->
    <div v-if="inProgressCourses.length > 0" class="continue-section">
      <div class="section-header-row">
        <div class="section-title-row">
          <span class="section-icon">🕐</span>
          <h2 class="section-title">{{ $t('catalogue.continueLearning') || 'Continue Learning' }}</h2>
        </div>
      </div>
      <div class="continue-cards">
        <div
          v-for="course in inProgressCourses.slice(0, 2)"
          :key="course.topicId + '-continue'"
          class="continue-card"
          @click="handleCourseAccess(course.topicId, course.type)"
        >
          <div class="continue-card-thumbnail">
            <img v-if="course.thumbnail" :src="course.thumbnail" :alt="getTopicName(course)" />
            <div v-else class="thumbnail-placeholder">
              <span>{{ getSubjectEmoji(course.subject) }}</span>
            </div>
          </div>
          <div class="continue-card-content">
            <span class="study-mode-badge-small" :class="getStudyMode(course)">
              {{ getStudyModeLabel(course) }}
            </span>
            <h3 class="continue-card-title">{{ getTopicName(course) }}</h3>
            <div class="continue-card-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: course.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ course.completedLessons || Math.round(course.progress * course.lessonCount / 100) }}/{{ course.lessonCount }} {{ $t('catalogue.lessons') }}</span>
            </div>
          </div>
          <div class="continue-card-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Recommended Section -->
    <div class="recommended-section">
      <div class="section-header-row">
        <div class="section-title-row">
          <span class="section-icon">💡</span>
          <h2 class="section-title">{{ $t('catalogue.recommendedForYou') || 'Recommended for You' }}</h2>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-content">
        <!-- Search -->
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="$t('catalogue.findCourse')"
          />
        </div>

        <!-- Filter Pills -->
        <select v-model="selectedLevelFilter" class="filter-select">
          <option :value="null">{{ $t('catalogue.allLevels') }}</option>
          <option v-for="level in availableLevels" :key="level" :value="level">{{ $t('dashboard.level') }} {{ level }}</option>
        </select>

        <select v-model="selectedCreatorFilter" class="filter-select">
          <option :value="null">{{ $t('catalogue.allCreators') }}</option>
          <option v-for="creator in availableCreators" :key="creator" :value="creator">{{ creator }}</option>
        </select>

        <!-- Sort Options -->
        <select v-model="sortOption" class="filter-select sort-select">
          <option value="popular">{{ $t('catalogue.sortPopular') }}</option>
          <option value="newest">{{ $t('catalogue.sortNewest') }}</option>
          <option value="rating">{{ $t('catalogue.sortRating') }}</option>
          <option value="title">{{ $t('catalogue.sortTitle') }}</option>
        </select>

        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="clear-filters-btn"
        >
          {{ $t('catalogue.clear') }}
        </button>

        <button @click="shuffleCourses" class="shuffle-btn" title="Shuffle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('catalogue.loadingCourses') }}</p>
    </div>

    <!-- Content -->
    <main v-else>
      <!-- Empty State -->
      <div v-if="!filteredCourses.length" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">{{ $t('catalogue.noCoursesFound') }}</h3>
        <p class="empty-text">{{ $t('catalogue.tryAdjustingFilters') }}</p>
      </div>

      <!-- School Mode: Grouped by Subject -->
      <div v-else-if="isSchoolMode" class="subject-groups">
        <section v-for="(courses, subject) in coursesBySubject" :key="subject">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-2xl">{{ getSubjectEmoji(subject) }}</span>
            <h2 class="text-xl font-bold text-slate-800">{{ subject }}</h2>
            <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">{{ courses.length }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <article
              v-for="course in courses"
              :key="`${course.topicId}-${language}`"
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

      <!-- Course Grid -->
      <div v-else>
        <div class="course-grid">
          <article
            v-for="course in paginatedCourses"
            :key="`${course.topicId}-${language}`"
            @click="handleCourseAccess(course.topicId, course.type)"
            class="course-card"
            :class="getStudyMode(course)"
          >
            <!-- Card Thumbnail -->
            <div class="card-thumbnail">
              <img v-if="course.thumbnail" :src="course.thumbnail" :alt="getTopicName(course)" />
              <div v-else class="thumbnail-placeholder-large">
                <span>{{ getSubjectEmoji(course.subject) }}</span>
              </div>
              <!-- Top Row Badges -->
              <div class="thumbnail-badges-row">
                <div class="study-mode-badge-card" :class="getStudyMode(course)">
                  {{ getStudyModeLabel(course) }}
                </div>
                <button
                  @click.stop="addToStudyPlan(course)"
                  :disabled="course.inStudyPlan"
                  class="save-btn-card"
                  :class="{ added: course.inStudyPlan }"
                  :title="course.inStudyPlan ? $t('catalogue.inPlan') : $t('catalogue.addToStudyPlan')"
                >
                  <svg viewBox="0 0 24 24" :fill="course.inStudyPlan ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
              <!-- Bottom Access Badge -->
              <div class="access-badge-card" :class="course.type === 'free' ? 'free' : 'pro'">
                <svg v-if="course.type !== 'free'" class="access-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                {{ course.type === 'free' ? $t('catalogue.free') : $t('catalogue.pro') }}
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <!-- Title -->
              <h3 class="card-title">{{ getTopicName(course) }}</h3>

              <!-- Creator Info -->
              <div class="card-creator" @click.stop="filterByCreator(course.instructor?.name || course.author)">
                <div class="creator-avatar">
                  <img v-if="course.instructor?.avatar" :src="course.instructor.avatar" :alt="course.instructor?.name" />
                  <span v-else class="avatar-placeholder">{{ getCreatorInitials(course) }}</span>
                </div>
                <span class="creator-name">{{ course.instructor?.name || course.author || 'ACED' }}</span>
                <svg v-if="isVerifiedCreator(course)" class="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>

              <!-- Rating -->
              <div class="card-rating">
                <div class="stars">
                  <svg v-for="star in 5" :key="star" class="star-icon" :class="{ filled: star <= Math.round(course.rating || 0) }" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <span class="rating-text">{{ (course.rating || 0).toFixed(1) }}</span>
                <span class="rating-count">({{ course.ratingCount || 0 }})</span>
              </div>

              <!-- Course Meta (Lessons/Topics) -->
              <div class="card-meta">
                <span class="meta-item">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ course.lessonCount || 0 }} {{ $t('catalogue.lessons') }}
                </span>
                <span v-if="getStudyMode(course) === 'mastery-path' && getTopicsCount(course) > 0" class="meta-item">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {{ getTopicsCount(course) }} {{ $t('catalogue.topics') }}
                </span>
              </div>

              <!-- Progress -->
              <div class="card-progress">
                <span class="progress-label">{{ $t('catalogue.progress') }}</span>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      :class="getProgressColorClass(course.progress)"
                      :style="{ width: course.progress + '%' }"
                    ></div>
                  </div>
                  <span class="progress-percent">{{ course.progress }}%</span>
                </div>
              </div>
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
      selectedCreatorFilter: null,
      sortOption: 'popular',
      typeFilter: 'all',
      studyModeFilter: 'all',
      progressFilter: 'all',
      currentPage: 1,
      coursesPerPage: 12,
      randomSeed: Math.random(),
      showAddModal: false,
      showSuccessModal: false,
      showPaywall: false,
      selectedCourse: null,
      requestedTopicId: null,
      rawData: null,
      rawMode: null,
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
    availableSubjects() { return [...new Set(this.courses.map(c => c.subject).filter(Boolean))].sort(); },
    availableLevels() { return [...new Set(this.courses.map(c => c.level))].sort((a, b) => Number(a) - Number(b)); },
    availableCreators() {
      return [...new Set(this.courses.map(c => c.instructor?.name || c.author || 'ACED').filter(Boolean))].sort();
    },
    uniqueCreatorsCount() {
      return this.availableCreators.length;
    },
    totalCourseCount() {
      return this.courses.length;
    },
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
          const displayName = this.getTopicName(c).toLowerCase();
          if (!displayName.includes(this.searchQuery.toLowerCase())) return false;
        }
        if (this.selectedSubjectFilter && c.subject !== this.selectedSubjectFilter) return false;
        if (this.selectedLevelFilter && c.level !== this.selectedLevelFilter) return false;
        if (this.selectedCreatorFilter) {
          const creatorName = c.instructor?.name || c.author || 'ACED';
          if (creatorName !== this.selectedCreatorFilter) return false;
        }
        if (this.typeFilter === 'free' && c.type !== 'free') return false;
        if (this.typeFilter === 'premium' && c.type === 'free') return false;
        if (this.studyModeFilter !== 'all') {
          const courseMode = this.getStudyMode(c);
          if (courseMode !== this.studyModeFilter) return false;
        }
        return true;
      });
    },
    sortedCourses() {
      const sorted = [...this.filteredCourses];
      switch (this.sortOption) {
        case 'popular':
          return sorted.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
        case 'newest':
          return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        case 'rating':
          return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'title':
          return sorted.sort((a, b) => this.getTopicName(a).localeCompare(this.getTopicName(b)));
        default:
          return sorted;
      }
    },
    inProgressCourses() {
      return this.courses.filter(c => c.progress > 0 && c.progress < 100);
    },
    totalPages() { return Math.max(1, Math.ceil(this.sortedCourses.length / this.coursesPerPage)); },
    paginatedCourses() {
      const list = this.sortOption === 'popular' ?
        [...this.sortedCourses].sort((a, b) => this.hashString(a.topicId + this.randomSeed) - this.hashString(b.topicId + this.randomSeed)) :
        this.sortedCourses;
      return list.slice((this.currentPage - 1) * this.coursesPerPage, this.currentPage * this.coursesPerPage);
    },
    hasActiveFilters() {
      return !!(this.searchQuery || this.selectedSubjectFilter || this.selectedLevelFilter ||
                this.selectedCreatorFilter || this.typeFilter !== 'all' || this.studyModeFilter !== 'all');
    },
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
    
    clearFilters() { this.searchQuery = ''; this.selectedSubjectFilter = null; this.selectedLevelFilter = null; this.typeFilter = 'all'; this.studyModeFilter = 'all'; this.currentPage = 1; },
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
      // Pass this.language as 4th param to make Vue track the dependency for reactivity
      return getLocalizedText(l, 'lessonName', '', this.language) ||
             getLocalizedText(l, 'topicName', '', this.language) ||
             getLocalizedText(l, 'name', '', this.language) ||
             getLocalizedText(l, 'title', '', this.language) ||
             (l?.topic && typeof l.topic === 'string' ? l.topic : '') ||
             'Untitled';
    },
    getLevelDescription(l) {
      const keys = { 1: 'catalogue.beginner', 2: 'catalogue.elementary', 3: 'catalogue.intermediate', 4: 'catalogue.intermediate', 5: 'catalogue.upperIntermediate', 6: 'catalogue.advanced' };
      return keys[parseInt(l)] ? this.$t(keys[parseInt(l)]) : `${this.$t('dashboard.level')} ${l}`;
    },
    getProgressColor(p) { if (p >= 80) return 'bg-green-500'; if (p >= 40) return 'bg-indigo-500'; if (p > 0) return 'bg-amber-500'; return 'bg-gray-200'; },
    getProgressColorClass(p) { if (p >= 80) return 'complete'; if (p >= 40) return 'good'; if (p > 0) return 'started'; return 'none'; },
    getStudyMode(course) {
      if (!course) return 'quick-skill';
      // studyMode field takes priority if provided by backend
      if (course.studyMode) {
        return course.studyMode === 'mastery' || course.studyMode === 'mastery-path' || course.studyMode === 'deep-dive' ? 'mastery-path' : 'quick-skill';
      }
      // Deep Dive / Mastery Path = playlist with multiple topics
      // Check if it's a collection/playlist of topics
      if (course.isPlaylist || course.isCollection || course.type === 'playlist') {
        return 'mastery-path';
      }
      if (course.topics && course.topics.length > 1) {
        return 'mastery-path';
      }
      // Quick Skill = single topic with lessons
      return 'quick-skill';
    },
    getStudyModeLabel(course) {
      const mode = this.getStudyMode(course);
      return mode === 'mastery-path' ? this.$t('catalogue.masteryPath') : this.$t('catalogue.quickSkill');
    },
    getButtonText(p) { if (p === 100) return this.$t('catalogue.review'); if (p > 0) return this.$t('catalogue.continueBtn'); return this.$t('catalogue.start'); },
    hasTopicAccess(type) { return type === 'free' || this.userStatus === 'pro' || this.userStatus === 'start'; },
    getSubjectEmoji(s) { const e = { 'Mathematics': '📐', 'Math': '📐', 'English': '📚', 'Science': '🔬', 'Physics': '⚛️', 'Chemistry': '⚗️', 'Biology': '🧬', 'History': '📜', 'Geography': '🌍', 'Computer Science': '💻', 'Programming': '👨‍💻', 'Art': '🎨', 'Music': '🎵', 'Languages': '🗣️' }; return e[s] || '📖'; },
    getTopicsCount(course) {
      if (course.topics && Array.isArray(course.topics)) {
        return course.topics.length;
      }
      if (course.topicsCount) {
        return course.topicsCount;
      }
      return 0;
    },
    getCreatorInitials(course) {
      const name = course.instructor?.name || course.author || 'ACED';
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    },
    isVerifiedCreator(course) {
      // Check if creator is verified (ACED is always verified, others can have verified flag)
      const name = course.instructor?.name || course.author || 'ACED';
      return name === 'ACED' || course.instructor?.verified === true;
    },
    filterByCreator(creatorName) {
      if (creatorName) {
        this.selectedCreatorFilter = creatorName;
        this.currentPage = 1;
      }
    },
    clearFilters() {
      this.searchQuery = '';
      this.selectedSubjectFilter = null;
      this.selectedLevelFilter = null;
      this.selectedCreatorFilter = null;
      this.typeFilter = 'all';
      this.studyModeFilter = 'all';
      this.currentPage = 1;
    },
  },
};
</script>

<style scoped>
/* Catalogue Page Styles */
.catalogue-page {
  min-height: 100vh;
  background: #fafafa;
  padding-bottom: 3rem;
}

/* Header */
.catalogue-header {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 1rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
}

/* Header Stats */
.header-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #7c3aed;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Category Chips */
.category-chips-wrapper {
  margin-bottom: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-chips-wrapper::-webkit-scrollbar {
  display: none;
}

.category-chips {
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}

.category-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #475569;
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.category-chip:hover {
  border-color: #c4b5fd;
  background: #faf5ff;
}

.category-chip.active {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white;
  border-color: transparent;
}

.chip-emoji {
  font-size: 1rem;
}

/* Study Mode Row */
.study-mode-row {
  display: flex;
  justify-content: flex-start;
}

/* Study Mode Tabs */
.study-mode-tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.mode-tab {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mode-tab:hover {
  color: #1e293b;
}

.mode-tab.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Continue Learning Section */
.continue-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 1.5rem;
}

.section-header-row {
  margin-bottom: 1rem;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 1.25rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

/* Continue Cards */
.continue-cards {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.continue-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  min-width: 360px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.continue-card:hover {
  border-color: #a78bfa;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.continue-card-thumbnail {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.continue-card-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f3e8ff, #e0e7ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.continue-card-content {
  flex: 1;
  min-width: 0;
}

.study-mode-badge-small {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.study-mode-badge-small.quick-skill {
  background: #dcfce7;
  color: #166534;
}

.study-mode-badge-small.mastery-path {
  background: #f3e8ff;
  color: #7c3aed;
}

.continue-card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.continue-card-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
}

.continue-card-arrow {
  width: 24px;
  height: 24px;
  color: #94a3b8;
  flex-shrink: 0;
}

.continue-card-arrow svg {
  width: 100%;
  height: 100%;
}

/* Recommended Section */
.recommended-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 0.5rem;
}

/* Filter Bar */
.filter-bar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 1.5rem;
}

.filter-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.filter-select {
  padding: 0.625rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  border-color: #cbd5e1;
}

.filter-select:focus {
  outline: none;
  border-color: #a78bfa;
}

.clear-filters-btn {
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #ef4444;
  background: #fef2f2;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover {
  background: #fee2e2;
}

.shuffle-btn {
  padding: 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shuffle-btn:hover {
  border-color: #cbd5e1;
  color: #1e293b;
}

.shuffle-btn svg {
  width: 16px;
  height: 16px;
}

/* Course Grid */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem;
}

/* Course Card */
.course-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}

.course-card.quick-skill:hover {
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
}

.course-card.mastery-path:hover {
  box-shadow: 0 12px 24px rgba(139, 92, 246, 0.15);
}

.card-thumbnail {
  position: relative;
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.card-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder-large {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background: linear-gradient(135deg, #fef3c7, #fbcfe8, #e0e7ff);
}

/* Top badges row - flexbox layout */
.thumbnail-badges-row {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 10;
}

.study-mode-badge-card {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.study-mode-badge-card.quick-skill {
  background: rgba(255, 255, 255, 0.92);
  color: #0d9488;
  border: 1px solid rgba(13, 148, 136, 0.2);
}

.study-mode-badge-card.mastery-path {
  background: rgba(255, 255, 255, 0.92);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.card-content {
  padding: 1rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.author-by {
  font-size: 0.75rem;
  color: #94a3b8;
}

.author-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.card-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.progress-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.progress-bar-bg {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-bar-fill.complete {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-bar-fill.good {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.progress-bar-fill.started {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-bar-fill.none {
  background: #e2e8f0;
}

.progress-percent {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  min-width: 32px;
  text-align: right;
}

/* Save Button in Top Right */
.save-btn-card {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.save-btn-card:hover {
  background: white;
  color: #7c3aed;
  transform: scale(1.05);
}

.save-btn-card.added {
  background: rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.3);
  color: #7c3aed;
}

.save-btn-card:disabled {
  cursor: default;
}

.save-btn-card svg {
  width: 16px;
  height: 16px;
}

/* Access Badge (Free/Pro) - Bottom Left */
.access-badge-card {
  position: absolute;
  bottom: 12px;
  left: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.access-badge-card .access-icon {
  width: 10px;
  height: 10px;
}

.access-badge-card.free {
  background: rgba(255, 255, 255, 0.92);
  color: #475569;
  border: 1px solid rgba(71, 85, 105, 0.15);
}

.access-badge-card.pro {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.95));
  color: #78350f;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Card Creator */
.card-creator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  padding: 4px 0;
}

.card-creator:hover .creator-name {
  color: #7c3aed;
}

.creator-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #c4b5fd, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.creator-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 0.625rem;
  font-weight: 600;
  color: white;
}

.creator-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
  transition: color 0.2s ease;
}

.verified-badge {
  width: 14px;
  height: 14px;
  color: #7c3aed;
  flex-shrink: 0;
}

/* Card Rating */
.card-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.stars {
  display: flex;
  gap: 1px;
}

.star-icon {
  width: 12px;
  height: 12px;
  fill: #e2e8f0;
  stroke: none;
}

.star-icon.filled {
  fill: #fbbf24;
}

.rating-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin-left: 2px;
}

.rating-count {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Card Meta (Lessons/Topics) */
.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #64748b;
}

.meta-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Legacy add-plan-btn - keep for backward compatibility */
.add-plan-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-plan-btn:hover {
  border-color: #a78bfa;
  color: #7c3aed;
}

.add-plan-btn.added {
  background: #f3e8ff;
  border-color: #a78bfa;
  color: #7c3aed;
}

.add-plan-btn svg {
  width: 16px;
  height: 16px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #64748b;
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.empty-text {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
}

/* Subject Groups (School Mode) */
.subject-groups {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.pagination-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #a78bfa;
  color: #7c3aed;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn svg {
  width: 16px;
  height: 16px;
}

.pagination-text {
  font-size: 0.875rem;
  color: #64748b;
}

.pagination-text .current {
  font-weight: 700;
  color: #7c3aed;
}

/* Modal Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 768px) {
  .catalogue-header {
    padding: 1.5rem 1rem 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .study-mode-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .continue-section,
  .recommended-section,
  .filter-bar {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .continue-card {
    min-width: 300px;
  }

  .course-grid {
    grid-template-columns: 1fr;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .filter-content {
    flex-direction: column;
  }

  .search-wrapper {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }
}
</style>