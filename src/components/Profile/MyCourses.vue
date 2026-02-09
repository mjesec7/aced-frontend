<template>
  <div class="my-courses-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button class="back-btn" @click="$router.push('/profile/main')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 class="page-title">My Courses</h1>
            <p class="page-subtitle">{{ filteredCourses.length }} {{ getCourseWord(filteredCourses.length) }}</p>
          </div>
        </div>
        <div class="header-actions">
          <router-link to="/profile/catalogue" class="add-course-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Course
          </router-link>
        </div>
      </div>
    </div>

    <!-- UPDATED Filters Bar -->
    <div class="filters-section">
      <div class="filters-content">
        <!-- Search -->
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="search-input" 
            placeholder="Search courses..."
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Filter Chips -->
        <div class="filter-chips">
          <div class="filter-group">
            <label class="filter-label">Progress:</label>
            <div class="chips-row">
              <button 
                :class="['filter-chip', { active: filterProgress === '' }]"
                @click="filterProgress = ''"
              >
                All
              </button>
              <button 
                :class="['filter-chip', { active: filterProgress === 'not-started' }]"
                @click="filterProgress = 'not-started'"
              >
                Not Started
              </button>
              <button 
                :class="['filter-chip', { active: filterProgress === 'in-progress' }]"
                @click="filterProgress = 'in-progress'"
              >
                In Progress
              </button>
              <button 
                :class="['filter-chip', { active: filterProgress === 'completed' }]"
                @click="filterProgress = 'completed'"
              >
                Completed
              </button>
            </div>
          </div>

          <div v-if="subjects.length > 0" class="filter-group">
            <label class="filter-label">Subject:</label>
            <div class="chips-row">
              <button 
                :class="['filter-chip', { active: filterSubject === '' }]"
                @click="filterSubject = ''"
              >
                All
              </button>
              <button 
                v-for="subject in subjects" 
                :key="subject"
                :class="['filter-chip', { active: filterSubject === subject }]"
                @click="filterSubject = subject"
              >
                {{ subject }}
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Sort By:</label>
            <div class="chips-row">
              <button 
                :class="['filter-chip', { active: sortBy === 'recent' }]"
                @click="sortBy = 'recent'"
              >
                By Date
              </button>
              <button 
                :class="['filter-chip', { active: sortBy === 'progress' }]"
                @click="sortBy = 'progress'"
              >
                By Progress
              </button>
              <button 
                :class="['filter-chip', { active: sortBy === 'name' }]"
                @click="sortBy = 'name'"
              >
                By Name
              </button>
            </div>
          </div>
        </div>

        <!-- Clear Filters Button -->
        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters" 
          class="clear-all-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-overview">
      <div class="stat-item">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ studyList.length }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ inProgressCount }}</div>
          <div class="stat-label">In Progress</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ completedCount }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalHours }}h</div>
          <div class="stat-label">Studied</div>
        </div>
      </div>
    </div>

    <!-- Courses Grid -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading courses...</p>
    </div>

    <div v-else-if="filteredCourses.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <h3 class="empty-title">
        {{ hasActiveFilters ? 'No courses found' : 'You don\'t have any courses yet' }}
      </h3>
      <p class="empty-text">
        {{ hasActiveFilters 
          ? 'Try changing your search filters' 
          : 'Add courses from the catalog to start learning'
        }}
      </p>
      <div class="empty-actions">
        <button v-if="hasActiveFilters" @click="clearFilters" class="secondary-btn">
          Clear Filters
        </button>
        <router-link to="/profile/catalogue" class="primary-btn">
          Go to Catalog
        </router-link>
      </div>
    </div>

    <div v-else class="courses-grid">
      <div 
        v-for="course in filteredCourses" 
        :key="course._id"
        class="course-card"
        @click="openCourse(course)"
      >
        <!-- Course Header -->
        <div class="course-header">
          <span :class="['course-type-badge', getTypeClass(course)]">
            {{ getTypeLabel(course) }}
          </span>
          <div class="course-menu">
            <button class="menu-btn" @click.stop="toggleMenu(course._id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            <div v-if="activeMenu === course._id" class="menu-dropdown" @click.stop>
              <button @click="openCourse(course)" class="menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Open Course
              </button>
              <button @click="showDeleteModal(course)" class="menu-item danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Course Content -->
        <div class="course-content">
          <h3 class="course-title">{{ getCourseName(course) }}</h3>
          <div class="course-meta">
            <span class="meta-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              {{ course.subject || 'General' }}
            </span>
            <span class="meta-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Level {{ course.level || 1 }}
            </span>
            <span v-if="course.rating > 0" class="meta-tag rating-tag">
              <svg viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              {{ course.rating.toFixed(1) }}
            </span>
          </div>

          <!-- Progress Section -->
          <div class="progress-section">
            <div class="progress-info">
              <span class="progress-label">Progress</span>
              <span class="progress-value">
                {{ course.progress?.completedLessons || 0 }}/{{ course.lessons?.length || 0 }}
              </span>
            </div>
            <div class="progress-bar-wrapper">
              <div 
                class="progress-bar"
                :class="getProgressColor(course.progress?.percent || 0)"
                :style="{ width: `${course.progress?.percent || 0}%` }"
              ></div>
            </div>
            <div class="progress-stats">
              <span class="progress-percent">{{ course.progress?.percent || 0 }}%</span>
              <span class="time-spent">{{ formatTime(course.progress?.completedTime) }}</span>
            </div>
          </div>
        </div>

        <!-- Course Footer -->
        <div class="course-footer">
          <div class="next-lesson">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{{ getNextLesson(course) }}</span>
          </div>
          <button @click.stop="continueCourse(course)" class="continue-btn">
            Continue
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <transition name="modal">
      <div v-if="deleteModal.show" class="modal-overlay" @click="closeDeleteModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <div class="modal-icon danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <button class="modal-close" @click="closeDeleteModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <h3 class="modal-title">Delete Course?</h3>
            <p class="modal-text">
              Are you sure you want to delete the course 
              <strong>{{ deleteModal.course ? getCourseName(deleteModal.course) : '' }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button @click="closeDeleteModal" class="modal-btn secondary">
              Cancel
            </button>
            <button @click="confirmDelete" class="modal-btn danger" :disabled="deleteModal.deleting">
              <span v-if="!deleteModal.deleting">Delete</span>
              <span v-else class="deleting-text">
                <span class="spinner-small"></span>
                Deleting...
              </span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Payment Modal -->
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
import {
  getUserStudyList,
  getUserProgress,
  getTopicById,
  getLessonsByTopic,
  removeFromStudyList
} from '@/api';
import { getBulkCourseRatings } from '@/api/ratings';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'MyCoursesPage',
  
  components: {
    PaymentModal
  },
  
  mixins: [userStatusMixin],
  
  data() {
    return {
      userId: null,
      studyList: [],
      userProgress: [],
      loading: true,
      
      searchQuery: '',
      filterProgress: '',
      filterSubject: '',
      sortBy: 'recent',
      
      activeMenu: null,
      showPaywall: false,
      requestedTopicId: null,

      deleteModal: {
        show: false,
        course: null,
        deleting: false
      }
    };
  },
  
  computed: {
    ...mapGetters('user', {
      vuexUserStatus: 'userStatus'
    }),
    
    currentUserStatus() {
      return this.vuexUserStatus || localStorage.getItem('userStatus') || 'free';
    },
    
    subjects() {
      const subjectSet = new Set();
      this.studyList.forEach(course => {
        if (course.subject) subjectSet.add(course.subject);
      });
      return Array.from(subjectSet).sort();
    },
    
    filteredCourses() {
      let courses = [...this.studyList];
      
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        courses = courses.filter(course => {
          const name = this.getCourseName(course).toLowerCase();
          const subject = (course.subject || '').toLowerCase();
          return name.includes(query) || subject.includes(query);
        });
      }
      
      if (this.filterProgress) {
        courses = courses.filter(course => {
          const percent = course.progress?.percent || 0;
          switch (this.filterProgress) {
            case 'not-started':
              return percent === 0;
            case 'in-progress':
              return percent > 0 && percent < 100;
            case 'completed':
              return percent === 100;
            default:
              return true;
          }
        });
      }
      
      if (this.filterSubject) {
        courses = courses.filter(course => course.subject === this.filterSubject);
      }
      
      courses.sort((a, b) => {
        switch (this.sortBy) {
          case 'progress':
            return (b.progress?.percent || 0) - (a.progress?.percent || 0);
          case 'name':
            return this.getCourseName(a).localeCompare(this.getCourseName(b));
          case 'level':
            return (a.level || 0) - (b.level || 0);
          case 'recent':
          default:
            return new Date(b.lastAccessed || 0) - new Date(a.lastAccessed || 0);
        }
      });
      
      return courses;
    },
    
    inProgressCount() {
      return this.studyList.filter(c => {
        const p = c.progress?.percent || 0;
        return p > 0 && p < 100;
      }).length;
    },
    
    completedCount() {
      return this.studyList.filter(c => c.progress?.percent === 100).length;
    },
    
    totalHours() {
      // Use actual tracked duration from progress (in seconds), convert to hours
      const seconds = this.studyList.reduce((sum, c) =>
        sum + (c.progress?.completedTime || 0), 0
      );
      // If duration is in minutes (legacy), use as-is; if in seconds, convert
      const hours = seconds > 1000 ? (seconds / 3600) : (seconds / 60);
      return hours.toFixed(1);
    },
    
    hasActiveFilters() {
      return !!(this.searchQuery || this.filterProgress || this.filterSubject || this.sortBy !== 'recent');
    }
  },
  
  async mounted() {
    await this.initialize();
    document.addEventListener('click', this.closeMenu);
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.closeMenu);
  },
  
  methods: {
    async initialize() {
      this.userId = this.$store?.state?.firebaseUserId || 
                    localStorage.getItem('firebaseUserId');
      
      if (!this.userId) {
        this.$router.push('/');
        return;
      }
      
      await this.loadCourses();
    },
    
    async loadCourses() {
      try {
        this.loading = true;
        
        const [studyListResult, progressResult] = await Promise.all([
          getUserStudyList(this.userId),
          getUserProgress(this.userId)
        ]);
        
        if (progressResult?.success && Array.isArray(progressResult.data)) {
          this.userProgress = progressResult.data;
        }
        
        if (studyListResult?.success && Array.isArray(studyListResult.data)) {
          this.studyList = await this.enrichCourses(studyListResult.data);
        }
      } catch (error) {
} finally {
        this.loading = false;
      }
    },
    
    async enrichCourses(rawList) {
      const enriched = [];

      for (const entry of rawList) {
        if (!entry?.topicId) continue;

        try {
          const topicResult = await getTopicById(entry.topicId);
          let topic = topicResult?.success ? topicResult.data : entry;

          if (!topic.lessons || topic.lessons.length === 0) {
            const lessonsResult = await getLessonsByTopic(entry.topicId);
            if (lessonsResult?.success && lessonsResult.data) {
              topic.lessons = lessonsResult.data;
            }
          }

          const progress = this.calculateProgress(topic.lessons);

          // Use the most recent activity timestamp for sorting
          const lastAccessed = progress.lastActivity || entry.lastAccessed || new Date().toISOString();

          enriched.push({
            ...topic,
            progress,
            lastAccessed
          });
        } catch (error) {
          console.warn('Error enriching course:', error);
        }
      }

      // Fetch ratings for all courses
      if (enriched.length > 0) {
        const courseIds = enriched.map(c => c.topicId || c._id).filter(Boolean);
        try {
          const ratingsResponse = await getBulkCourseRatings(courseIds);
          if (ratingsResponse.success && ratingsResponse.data) {
            enriched.forEach(course => {
              const courseId = course.topicId || course._id;
              const ratingData = ratingsResponse.data[courseId];
              course.rating = ratingData?.averageRating || 0;
              course.totalRatings = ratingData?.totalRatings || 0;
            });
          }
        } catch (ratingsError) {
          console.warn('Failed to fetch course ratings:', ratingsError);
        }
      }

      return enriched;
    },
    
    calculateProgress(lessons) {
      if (!lessons || lessons.length === 0) {
        return {
          percent: 0,
          completedLessons: 0,
          totalLessons: 0,
          completedTime: 0,
          totalTime: 0,
          totalPoints: 0,
          totalStars: 0,
          lastActivity: null
        };
      }

      let completed = 0;
      let completedTime = 0;
      let totalTime = 0;
      let totalPoints = 0;
      let totalStars = 0;
      let lastActivity = null;

      lessons.forEach(lesson => {
        const lessonTime = lesson.estimatedTime || lesson.duration || 10;
        totalTime += lessonTime;

        // Convert IDs to strings for proper comparison
        const lessonId = String(lesson._id || lesson.id);
        const progress = this.userProgress.find(p => {
          const progressLessonId = String(p.lessonId?._id || p.lessonId || '');
          return progressLessonId === lessonId;
        });

        if (progress?.completed) {
          completed++;
          // Use actual duration from progress if available, otherwise estimate
          completedTime += progress.duration || lessonTime;
          totalPoints += progress.points || 0;
          totalStars += progress.stars || 0;

          // Track the most recent activity
          const activityDate = progress.completedAt || progress.updatedAt;
          if (activityDate && (!lastActivity || new Date(activityDate) > new Date(lastActivity))) {
            lastActivity = activityDate;
          }
        }
      });

      return {
        percent: Math.round((completed / lessons.length) * 100),
        completedLessons: completed,
        totalLessons: lessons.length,
        completedTime,
        totalTime,
        totalPoints,
        totalStars,
        lastActivity
      };
    },
    
    getCourseName(course) {
      return course.name || course.topicName || course.topic || course.title || 'Untitled';
    },
    
    getTypeClass(course) {
      return course.type || 'free';
    },
    
    getTypeLabel(course) {
      const labels = { free: 'Free', premium: 'Start', pro: 'Pro' };
      return labels[course.type || 'free'] || 'Free';
    },
    
    getProgressColor(percent) {
      if (percent >= 80) return 'high';
      if (percent >= 50) return 'medium';
      if (percent >= 30) return 'low';
      return 'very-low';
    },
    
    formatTime(minutes) {
      if (!minutes) return '0 min';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${mins} min`;
    },
    
    getNextLesson(course) {
      if (!course.lessons || course.lessons.length === 0) return 'No lessons';

      const completed = course.progress?.completedLessons || 0;
      if (completed >= course.lessons.length) return 'Course completed';

      const next = course.lessons[completed];
      return this.getLocalizedLessonName(next) || `Lesson ${completed + 1}`;
    },

    getLocalizedLessonName(lesson) {
      if (!lesson) return '';
      const lang = localStorage.getItem('lang') || 'ru';
      // Check title first
      if (lesson.title && typeof lesson.title === 'string') return lesson.title;
      // Handle multilingual lessonName
      if (lesson.lessonName) {
        if (typeof lesson.lessonName === 'string') return lesson.lessonName;
        if (typeof lesson.lessonName === 'object') {
          return lesson.lessonName[lang] || lesson.lessonName.en || lesson.lessonName.ru || lesson.lessonName.uz || '';
        }
      }
      return '';
    },
    
    getCourseWord(count) {
      if (count === 1) return 'course';
      return 'courses';
    },
    
    clearFilters() {
      this.searchQuery = '';
      this.filterProgress = '';
      this.filterSubject = '';
      this.sortBy = 'recent';
    },
    
    toggleMenu(courseId) {
      this.activeMenu = this.activeMenu === courseId ? null : courseId;
    },
    
    closeMenu() {
      this.activeMenu = null;
    },
    
    openCourse(course) {
      this.$router.push(`/topic/${course._id}/overview`);
    },
    
    continueCourse(course) {
      const hasAccess = this.hasTopicAccess(course);
      
      if (!hasAccess) {
        this.requestedTopicId = course._id;
        this.showPaywall = true;
        return;
      }
      
      this.$router.push(`/topic/${course._id}/overview`);
    },
    
    hasTopicAccess(topic) {
      const topicType = topic.type || 'free';
      const userStatus = this.currentUserStatus;
      
      if (topicType === 'free') return true;
      if (topicType === 'premium' && (userStatus === 'start' || userStatus === 'pro')) return true;
      if (topicType === 'pro' && userStatus === 'pro') return true;
      
      return false;
    },

    showDeleteModal(course) {
      this.deleteModal.course = course;
      this.deleteModal.show = true;
      this.activeMenu = null;
    },

    closeDeleteModal() {
      this.deleteModal.show = false;
      this.deleteModal.course = null;
      this.deleteModal.deleting = false;
    },
    
    async confirmDelete() {
      if (!this.deleteModal.course || this.deleteModal.deleting) return;

      try {
        this.deleteModal.deleting = true;
        await removeFromStudyList(this.userId, this.deleteModal.course._id);
        this.studyList = this.studyList.filter(c => c._id !== this.deleteModal.course._id);
        
        // Notify other components
        if (window.eventBus) {
          window.eventBus.emit('studyListUpdated');
        }
        
        this.closeDeleteModal();
      } catch (error) {
alert('Failed to delete course');
        this.deleteModal.deleting = false;
      }
    },
    
    handlePaymentSuccess(newStatus) {
      this.showPaywall = false;
      this.$forceUpdate();
    }
  }
};
</script>

<style scoped>
.my-courses-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .my-courses-page {
    padding: 2rem 2.5rem;
  }
}

/* Page Header */
.page-header {
  max-width: 1400px;
  margin: 0 auto 2rem;
}

.header-content {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.back-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.back-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.add-course-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #a855f7;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.add-course-btn svg {
  width: 1rem;
  height: 1rem;
}

.add-course-btn:hover {
  background: #9333ea;
}

/* UPDATED Filters */
.filters-section {
  max-width: 1400px;
  margin: 0 auto 1.5rem;
}

.filters-content {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.search-box {
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
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 3rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  transition: all 0.2s;
  background: #fafafa;
}

.search-input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  background: white;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.clear-search-btn svg {
  width: 1rem;
  height: 1rem;
}

.clear-search-btn:hover {
  background: #d1d5db;
  color: #111827;
}

.filter-chips {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chips-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.5rem 1rem;
  border: 1.5px solid #e5e7eb;
  background: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: #a855f7;
  color: #a855f7;
  background: #faf5ff;
}

.filter-chip.active {
  background: #a855f7;
  border-color: #a855f7;
  color: white;
}

.clear-all-btn {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  border: 1.5px solid #fca5a5;
  background: #fef2f2;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn svg {
  width: 1rem;
  height: 1rem;
}

.clear-all-btn:hover {
  background: #fee2e2;
  border-color: #f87171;
}

/* Stats Overview */
.stats-overview {
  max-width: 1400px;
  margin: 0 auto 2rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .stats-overview {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
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

.stat-icon.purple {
  background: #f3e8ff;
  color: #a855f7;
}

.stat-icon.blue {
  background: #dbeafe;
  color: #3b82f6;
}

.stat-icon.green {
  background: #dcfce7;
  color: #10b981;
}

.stat-icon.orange {
  background: #ffedd5;
  color: #f59e0b;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #f3f4f6;
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin: 0 auto 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.empty-text {
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-size: 0.875rem;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.primary-btn {
  background: #a855f7;
  color: white;
  border: none;
}

.primary-btn:hover {
  background: #9333ea;
}

.secondary-btn {
  background: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.secondary-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* Courses Grid */
.courses-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .courses-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .courses-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Course Card */
.course-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.12);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.course-type-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.course-type-badge.free {
  background: #f3f4f6;
  color: #6b7280;
}

.course-type-badge.premium {
  background: #faf5ff;
  color: #a855f7;
}

.course-type-badge.pro {
  background: linear-gradient(to right, #faf5ff, #fce7f3);
  color: #a855f7;
}

.course-menu {
  position: relative;
}

.menu-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
}

.menu-btn svg {
  width: 1rem;
  height: 1rem;
}

.menu-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 160px;
  overflow: hidden;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border: none;
  background: white;
  text-align: left;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item svg {
  width: 1rem;
  height: 1rem;
}

.menu-item:hover {
  background: #f9fafb;
}

.menu-item.danger {
  color: #ef4444;
}

.menu-item.danger:hover {
  background: #fef2f2;
}

.course-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.course-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.meta-tag svg {
  width: 0.875rem;
  height: 0.875rem;
}

.meta-tag.rating-tag {
  color: #d97706;
  font-weight: 600;
}

.meta-tag.rating-tag svg {
  width: 1rem;
  height: 1rem;
}

.progress-section {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
}

.progress-label {
  color: #6b7280;
  font-weight: 500;
}

.progress-value {
  color: #111827;
  font-weight: 600;
}

.progress-bar-wrapper {
  width: 100%;
  height: 6px;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-bar.high {
  background: linear-gradient(to right, #10b981, #059669);
}

.progress-bar.medium {
  background: linear-gradient(to right, #3b82f6, #2563eb);
}

.progress-bar.low {
  background: linear-gradient(to right, #f59e0b, #d97706);
}

.progress-bar.very-low {
  background: linear-gradient(to right, #ef4444, #dc2626);
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.progress-percent {
  color: #a855f7;
  font-weight: 600;
}

.time-spent {
  color: #6b7280;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.next-lesson {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
  flex: 1;
  min-width: 0;
}

.next-lesson svg {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.next-lesson span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.continue-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: #a855f7;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 1rem;
}

.continue-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}

.continue-btn:hover {
  background: #9333ea;
}

/* Delete Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 28rem;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  position: relative;
  padding: 1.5rem 1.5rem 1rem;
  display: flex;
  justify-content: center;
}

.modal-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-icon.danger {
  background: #fef2f2;
  color: #ef4444;
}

.modal-icon svg {
  width: 2rem;
  height: 2rem;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
}

.modal-close svg {
  width: 1.125rem;
  height: 1.125rem;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 0 1.5rem 1.5rem;
  text-align: center;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.modal-text {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.modal-text strong {
  color: #111827;
  font-weight: 600;
}

.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  gap: 0.75rem;
}

.modal-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.modal-btn.secondary {
  background: white;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
}

.modal-btn.secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.modal-btn.danger {
  background: #ef4444;
  color: white;
}

.modal-btn.danger:hover:not(:disabled) {
  background: #dc2626;
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.deleting-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner-small {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(-20px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .my-courses-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .header-content {
    padding: 1rem;
  }

  .filters-content {
    padding: 1.125rem;
  }

  .filter-group {
    gap: 0.5rem;
  }

  .filter-chip {
    padding: 0.4375rem 0.875rem;
    font-size: 0.8125rem;
  }

  .stats-overview {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .stat-item {
    padding: 1rem;
  }

  .course-card {
    padding: 1rem;
  }

  .course-title {
    font-size: 1rem;
  }

  .modal-container {
    margin: 1rem;
  }

  .modal-header {
    padding: 1.25rem 1.25rem 0.75rem;
  }

  .modal-icon {
    width: 3.5rem;
    height: 3.5rem;
  }

  .modal-icon svg {
    width: 1.75rem;
    height: 1.75rem;
  }

  .modal-body {
    padding: 0 1.25rem 1.25rem;
  }

  .modal-title {
    font-size: 1.125rem;
  }

  .modal-text {
    font-size: 0.875rem;
  }

  .modal-footer {
    padding: 0.875rem 1.25rem 1.25rem;
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
  }
}

/* Focus States */
.back-btn:focus,
.add-course-btn:focus,
.search-input:focus,
.filter-chip:focus,
.clear-all-btn:focus,
.continue-btn:focus,
.menu-btn:focus,
.modal-close:focus,
.modal-btn:focus {
  outline: 2px solid #a855f7;
  outline-offset: 2px;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>