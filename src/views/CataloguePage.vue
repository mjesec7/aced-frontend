<template>
  <div class="catalogue-page">
    <header class="hero-header" :style="{ backgroundImage: `url(${currentHeroImage})` }">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Learning
          </div>
          <h1 class="hero-title">Discover the World of Knowledge</h1>
          <p class="hero-subtitle">{{ filteredCourses.length }} courses available</p>
        </div>
        <div class="status-container">
          <div class="status-badge" :class="`status-${userStatus}`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            {{ userStatusLabel }}
          </div>
        </div>
      </div>
    </header>

    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ courses.length }}</span>
            <span class="stat-label">Total Courses</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ studyPlanTopics.length }}</span>
            <span class="stat-label">In Your Plan</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ availableSubjects.length }}</span>
            <span class="stat-label">Subjects</span>
          </div>
        </div>
      </div>
    </div>

    <div class="control-section">
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
            placeholder="Find course by name..."
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
            <label>Subject</label>
            <select v-model="selectedSubjectFilter">
              <option :value="null">All</option>
              <option v-for="subject in availableSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="filter-pill">
            <label>Level</label>
            <select v-model="selectedLevelFilter">
              <option :value="null">All</option>
              <option v-for="level in availableLevels" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
          </div>

          <div class="filter-pill">
            <label>Type</label>
            <select v-model="typeFilter">
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div class="filter-pill">
            <label>Progress</label>
            <select v-model="progressFilter">
              <option value="all">All</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button v-if="hasActiveFilters" @click="clearFilters" class="reset-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Reset
          </button>

          <button @click="shuffleCourses" class="shuffle-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
            Shuffle
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loader">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
      </div>
      <p>Loading courses...</p>
    </div>

    <main v-else class="main-section">
      <!-- Empty State -->
      <div v-if="!filteredCourses.length" class="empty-container">
        <div class="empty-illustration">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <h3>No Courses Found</h3>
        <p>Try changing your filter or search parameters</p>
      </div>

      <!-- SCHOOL MODE VIEW: Subjects with Levels -->
      <div v-else-if="isSchoolMode" class="courses-container">
        <div v-for="(courses, subject) in coursesBySubject" :key="subject" class="subject-section">
          <div class="subject-header">
            <div class="subject-info">
              <h2 class="subject-title">{{ subject }}</h2>
              <span class="subject-count">{{ courses.length }} {{ courses.length === 1 ? 'course' : 'courses' }}</span>
            </div>
            <button
              v-if="placementTestTaken"
              class="take-test-btn"
              @click="goToLevelTest(subject)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Take Test
            </button>
          </div>

          <div class="courses-grid">
            <article v-for="course in courses" :key="course.topicId" class="course-card">
            <!-- Course Image Banner -->
            <div class="card-image" :style="{ background: getSubjectGradient(course.subject) }">
              <span class="subject-icon">{{ getSubjectIcon(course.subject) }}</span>
              <span class="level-badge">Level {{ course.level }}</span>
            </div>

            <div class="card-header">
              <span class="course-badge" :class="course.type">
                {{ getTypeLabel(course.type) }}
              </span>
              <button 
                class="bookmark-btn" 
                :class="{ active: course.inStudyPlan }"
                @click.stop="addToStudyPlan(course)" 
                :disabled="course.inStudyPlan"
              >
                <svg viewBox="0 0 24 24" :fill="course.inStudyPlan ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>

            <div class="card-body">
              <h3 class="course-name">{{ course.name }}</h3>
              
              <div class="course-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {{ course.subject }}
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  {{ getLevelDescription(course.level) }}
                </span>
              </div>

              <div class="course-stats">
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ course.lessonCount }} {{ getLessonWord(course.lessonCount) }}
                </div>
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ course.totalTime }} min
                </div>
              </div>

              <div class="progress-container">
                <div class="progress-info">
                  <span class="progress-text">Progress</span>
                  <span class="progress-percent">{{ course.progress }}%</span>
                </div>
                <div class="progress-track">
                  <div 
                    class="progress-fill" 
                    :class="getProgressColor(course.progress)"
                    :style="{ width: course.progress + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button 
                class="course-btn" 
                :class="getButtonClass(course.progress)"
                @click="handleCourseAccess(course.topicId, course.type)"
              >
                <span>{{ getButtonText(course.progress) }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </article>
        </div>
        </div>
      </div>

      <!-- STUDY CENTRE MODE VIEW: Random Topics with Search -->
      <div v-else-if="isStudyCentreMode" class="courses-container">
        <div class="courses-grid">
          <article v-for="course in paginatedCourses" :key="course.topicId" class="course-card">
            <!-- Course Image Banner -->
            <div class="card-image" :style="{ background: getSubjectGradient(course.subject) }">
              <span class="subject-icon">{{ getSubjectIcon(course.subject) }}</span>
              <span class="level-badge">Level {{ course.level }}</span>
            </div>

            <div class="card-header">
              <span class="course-badge" :class="course.type">
                {{ getTypeLabel(course.type) }}
              </span>
              <button
                class="bookmark-btn"
                :class="{ active: course.inStudyPlan }"
                @click.stop="addToStudyPlan(course)"
                :disabled="course.inStudyPlan"
              >
                <svg viewBox="0 0 24 24" :fill="course.inStudyPlan ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>

            <div class="card-body">
              <h3 class="course-name">{{ course.name }}</h3>

              <div class="course-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {{ course.subject }}
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  {{ getLevelDescription(course.level) }}
                </span>
              </div>

              <div class="course-stats">
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ course.lessonCount }} {{ getLessonWord(course.lessonCount) }}
                </div>
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ course.totalTime }} min
                </div>
              </div>

              <div class="progress-container">
                <div class="progress-info">
                  <span class="progress-text">Progress</span>
                  <span class="progress-percent">{{ course.progress }}%</span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :class="getProgressColor(course.progress)"
                    :style="{ width: course.progress + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button
                class="course-btn"
                :class="getButtonClass(course.progress)"
                @click="handleCourseAccess(course.topicId, course.type)"
              >
                <span>{{ getButtonText(course.progress) }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </article>
        </div>

        <div class="pagination-section">
          <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          
          <div class="page-info">
            <span class="page-current">{{ currentPage }}</span>
            <span class="page-separator">/</span>
            <span class="page-total">{{ totalPages }}</span>
          </div>
          
          <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </main>

    <transition name="modal-fade">
      <div v-if="showAddModal" class="modal-backdrop" @click="showAddModal = false">
        <div class="modal-card" @click.stop>
          <button class="modal-close" @click="showAddModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <div class="modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          
          <h3 class="modal-title">Add to Study Plan?</h3>
          <p class="modal-text" v-if="selectedCourse">
            The course <strong>{{ selectedCourse.name }}</strong> will be added to your personal study plan
          </p>
          
          <div class="modal-actions">
            <button @click="showAddModal = false" class="modal-btn secondary">Cancel</button>
            <button @click="confirmAddToStudyPlan" class="modal-btn primary">Add</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-fade">
      <div v-if="showSuccessModal" class="modal-backdrop" @click="showSuccessModal = false">
        <div class="modal-card success" @click.stop>
          <div class="success-animation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          
          <h3 class="modal-title">Successfully Added!</h3>
          <p class="modal-text" v-if="selectedCourse">
            {{ selectedCourse.name }}
          </p>
          
          <button @click="showSuccessModal = false" class="modal-btn primary full">Great</button>
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
import {
  getAllLessons,
  getUserProgress,
  getUserStudyList,
  addToStudyList,
  getTopicsGrouped,
  getTopicsAsCourses
} from '@/api';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'CataloguePage',
  components: { PaymentModal },
  mixins: [userStatusMixin],

  setup() {
    // Use level system for school mode
    const {
      isSchoolMode,
      isStudyCentreMode,
      canAccessLevel,
      currentLevelCap,
      placementTestTaken
    } = useLevelSystem();

    // Use mode content for fetching
    const {
      groupedContent,
      courseCards,
      loading: modeLoading,
      error: modeError,
      subjects,
      fetchContent,
      getLevelsForSubject,
      getTopicsForLevel,
      totalTopicsCount
    } = useModeContent();

    return {
      isSchoolMode,
      isStudyCentreMode,
      canAccessLevel,
      currentLevelCap,
      placementTestTaken,
      groupedContent,
      courseCards,
      modeLoading,
      modeError,
      subjects,
      fetchContent,
      getLevelsForSubject,
      getTopicsForLevel,
      totalTopicsCount
    };
  },

  data() {
    return {
      userId: null,
      lang: localStorage.getItem('lang') || 'en',
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
      requestedTopicId: null,
      heroImages: [
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&h=400&fit=crop&q=80'
      ],
      currentHeroImage: '',
    };
  },

  computed: {
    ...mapGetters('user', { vuexUserStatus: 'userStatus' }),
    userStatus() {
      return this.vuexUserStatus || localStorage.getItem('userStatus') || 'free';
    },
    userStatusLabel() {
      const labels = { free: 'Free', start: 'Start', pro: 'Pro' };
      return labels[this.userStatus] || 'Free';
    },
    availableSubjects() {
      const subjects = new Set(this.courses.map(course => course.subject));
      return Array.from(subjects).sort();
    },
    availableLevels() {
      const levels = new Set(this.courses.map(course => course.level));
      return Array.from(levels).sort((a, b) => Number(a) - Number(b));
    },

    // School Mode: Group courses by subject
    coursesBySubject() {
      if (!this.isSchoolMode) return {};

      const grouped = {};
      this.courses.forEach(course => {
        const subject = course.subject || 'Uncategorized';
        if (!grouped[subject]) {
          grouped[subject] = [];
        }
        grouped[subject].push(course);
      });

      // Sort each subject's courses by level
      Object.keys(grouped).forEach(subject => {
        grouped[subject].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
      });

      return grouped;
    },

    filteredCourses() {
      let coursesToFilter = this.courses;

      // School Mode: Filter by accessible levels
      if (this.isSchoolMode) {
        coursesToFilter = this.courses.filter(course => {
          const courseLevel = Number(course.level || 1);
          return this.canAccessLevel(courseLevel);
        });
      }

      // Apply search and filters
      return coursesToFilter.filter(course => {
        if (this.searchQuery && !course.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          return false;
        }
        if (this.selectedSubjectFilter && course.subject !== this.selectedSubjectFilter) {
          return false;
        }
        if (this.selectedLevelFilter && course.level !== this.selectedLevelFilter) {
          return false;
        }
        if (this.typeFilter === 'free' && course.type !== 'free') return false;
        if (this.typeFilter === 'premium' && course.type === 'free') return false;

        const progress = course.progress || 0;
        if (this.progressFilter === 'not-started' && progress !== 0) return false;
        if (this.progressFilter === 'in-progress' && (progress === 0 || progress === 100)) return false;
        if (this.progressFilter === 'completed' && progress !== 100) return false;

        return true;
      });
    },
    totalPages() {
      if (!this.filteredCourses.length) return 1;
      return Math.ceil(this.filteredCourses.length / this.coursesPerPage);
    },
    paginatedCourses() {
      const shuffled = [...this.filteredCourses].sort((a, b) => {
        const hashA = this.hashString(a.topicId + this.randomSeed);
        const hashB = this.hashString(b.topicId + this.randomSeed);
        return hashA - hashB;
      });
      const start = (this.currentPage - 1) * this.coursesPerPage;
      const end = start + this.coursesPerPage;
      return shuffled.slice(start, end);
    },
    hasActiveFilters() {
      return !!(
        this.searchQuery || 
        this.selectedSubjectFilter || 
        this.selectedLevelFilter ||
        this.typeFilter !== 'all' || 
        this.progressFilter !== 'all'
      );
    },
  },

  async mounted() {
    this.selectRandomHeroImage();
    await this.initialize();
  },

  methods: {
    // --- INITIALIZATION & DATA LOADING ---
    selectRandomHeroImage() {
      const randomIndex = Math.floor(Math.random() * this.heroImages.length);
      this.currentHeroImage = this.heroImages[randomIndex];
    },
    async initialize() {
      this.userId = this.$store?.state?.firebaseUserId || localStorage.getItem('firebaseUserId');
      if (!this.userId) {
        this.$router.push('/');
        return;
      }
      await this.loadData();
    },
    async loadData() {


this.isLoading = true;
      try {
        // Load progress and study list in parallel
        const [progressResult, studyListResult] = await Promise.all([
          getUserProgress(this.userId),
          getUserStudyList(this.userId),
        ]);

        if (progressResult?.success) {
          this.userProgress = this.processProgressData(progressResult.data);
        }

        if (studyListResult?.success) {
          this.studyPlanTopics = studyListResult.data.map(item =>
            this.extractTopicId(item.topicId)
          ).filter(Boolean);
        }

        // Try to fetch content using new mode-based endpoints
        try {
          if (this.isSchoolMode) {
const result = await getTopicsGrouped();

);

            if (result.success && result.data) {
              this.processModeContent(result.data, 'school');
              return; // Success, exit early
            }
          } else {
const result = await getTopicsAsCourses();

if (result.success && result.courses) {
this.processModeContent(result.courses, 'study-centre');
              return; // Success, exit early
            }
          }
        } catch (modeError) {
}

        // Fallback: Use legacy method (getAllLessons)
const lessonsResult = await getAllLessons();

this.lessons = lessonsResult?.data || [];
        this.processAllCourses();

      } catch (error) {
} finally {
        this.isLoading = false;
}
    },

    // --- DATA PROCESSING ---
    processProgressData(progressData) {
      const progressMap = {};
      const lessonsByTopic = {};

      // First, group all lessons by their topic
      this.lessons.forEach(lesson => {
        const topicId = this.extractTopicId(lesson.topicId);
        if (topicId) {
          if (!lessonsByTopic[topicId]) lessonsByTopic[topicId] = new Set();
          lessonsByTopic[topicId].add(this.extractTopicId(lesson._id));
        }
      });
      
      // Then, calculate completed lessons per topic
      progressData.forEach(p => {
        const topicId = this.extractTopicId(p.topicId);
        if (topicId && p.completed) {
          if (!progressMap[topicId]) progressMap[topicId] = 0;
          progressMap[topicId]++;
        }
      });

      // Calculate percentage
      const finalProgress = {};
      for (const topicId in lessonsByTopic) {
        const completedCount = progressMap[topicId] || 0;
        const totalLessons = lessonsByTopic[topicId].size;
        finalProgress[topicId] = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      }
      return finalProgress;
    },
    processAllCourses() {
const coursesMap = new Map();

      this.lessons.forEach((lesson, idx) => {
        const topicId = this.extractTopicId(lesson.topicId);

        if (idx < 5) {
}

        if (!topicId) {
return;
        }

        if (!coursesMap.has(topicId)) {
          coursesMap.set(topicId, {
            topicId,
            name: this.getTopicName(lesson),
            level: String(lesson.level || '1'),
            subject: String(lesson.subject || 'Uncategorized'),
            lessonCount: 0,
            totalTime: 0,
            type: 'free',
          });
        }

        const course = coursesMap.get(topicId);
        course.lessonCount++;
        course.totalTime += this.estimateLessonTime(lesson);

        if (['premium', 'start', 'pro'].includes(lesson.type)) {
          course.type = 'premium';
        }
      });
this.courses = Array.from(coursesMap.values()).map(course => ({
        ...course,
        progress: this.userProgress[course.topicId] || 0,
        inStudyPlan: this.studyPlanTopics.includes(course.topicId),
      }));
},

    /**
     * Process content from new mode-based endpoints
     * @param {Object|Array} data - Grouped content or course array
     * @param {String} mode - 'school' or 'study-centre'
     */
    processModeContent(data, mode) {
? data[0] : null
      });

      if (mode === 'school') {
        // School Mode: data is grouped { subject: { level: [topics] } }
        const allCourses = [];

        for (const subject in data) {
          for (const level in data[subject]) {
            const topics = data[subject][level];
            topics.forEach(topic => {
              // Try multiple name sources with fallback
              const courseName = topic.name ||
                                topic.topicName ||
                                topic.title ||
                                'Untitled Course';
allCourses.push({
                topicId: topic._id || topic.id,
                name: courseName,
                level: String(level),
                subject: subject,
                lessonCount: topic.lessonCount || 0,
                totalTime: topic.totalTime || 10,
                type: topic.type || 'free',
                progress: this.userProgress[topic._id || topic.id] || 0,
                inStudyPlan: this.studyPlanTopics.includes(topic._id || topic.id),
              });
            });
          }
        }

        this.courses = allCourses;
} else {
        // Study Centre Mode: data is array of course objects
this.courses = data.map(course => {
          // Try multiple name sources with fallback
          const courseName = course.name ||
                            course.topicName ||
                            course.title ||
                            'Untitled Course';
return {
            topicId: course._id || course.id || course.topicId,
            name: courseName,
            level: String(course.level || 1),
            subject: course.subject || 'Uncategorized',
            lessonCount: course.lessonCount || 0,
            totalTime: course.totalTime || 10,
            type: course.type || 'free',
            progress: this.userProgress[course._id || course.id || course.topicId] || 0,
            inStudyPlan: this.studyPlanTopics.includes(course._id || course.id || course.topicId),
          };
        });
}

      // Log first few courses for debugging
);
    },

    // --- FILTER & PAGINATION HANDLERS ---
    clearFilters() {
      this.searchQuery = '';
      this.selectedSubjectFilter = null;
      this.selectedLevelFilter = null;
      this.typeFilter = 'all';
      this.progressFilter = 'all';
      this.currentPage = 1;
    },
    shuffleCourses() {
      this.randomSeed = Math.random();
      this.currentPage = 1;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    // --- USER ACTIONS ---
    handleCourseAccess(topicId, type) {
      if (!this.hasTopicAccess(type)) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
        return;
      }
      this.$router.push(`/topic/${topicId}/overview`);
    },
    addToStudyPlan(course) {
      if (course.inStudyPlan) return;
      this.selectedCourse = course;
      this.showAddModal = true;
    },
    async confirmAddToStudyPlan() {
      if (!this.selectedCourse || !this.userId) return;
      try {
        const topicData = {
          topicId: this.selectedCourse.topicId,
          topic: this.selectedCourse.name,
          subject: this.selectedCourse.subject || 'General',
          level: parseInt(this.selectedCourse.level) || 1,
          lessonCount: this.selectedCourse.lessonCount || 0,
          totalTime: this.selectedCourse.totalTime || 10,
          type: this.selectedCourse.type || 'free'
        };
        
        const result = await addToStudyList(this.userId, topicData);
        
        if (result?.success) {
          this.selectedCourse.inStudyPlan = true;
          this.studyPlanTopics.push(this.selectedCourse.topicId);
          const courseIndex = this.courses.findIndex(c => c.topicId === this.selectedCourse.topicId);
          if (courseIndex !== -1) {
            this.courses[courseIndex].inStudyPlan = true;
          }
          this.showAddModal = false;
          this.showSuccessModal = true;
        } else {
          throw new Error(result.error || 'Failed to add to study plan');
        }
      } catch (error) {
alert(error.message || 'Failed to add course to study plan');
        this.showAddModal = false;
      }
    },
    handlePaymentSuccess() {
      this.showPaywall = false;
      this.$forceUpdate();
    },

    // --- HELPER & FORMATTER METHODS ---
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    },
    extractTopicId(topicId) {
      if (!topicId) return null;
      if (typeof topicId === 'string') return topicId;
      if (typeof topicId === 'object' && topicId._id) return topicId._id;
      return String(topicId);
    },
    getTopicName(lesson) {
      // Try multiple sources for topic name
      if (lesson?.topic && typeof lesson.topic === 'string' && lesson.topic.trim()) {
        return lesson.topic.trim();
      }

      if (lesson?.topicName && typeof lesson.topicName === 'string' && lesson.topicName.trim()) {
        return lesson.topicName.trim();
      }

      // Try translations
      const lang = localStorage.getItem('lang') || 'en';
      if (lesson?.translations?.[lang]?.topic) {
        return lesson.translations[lang].topic.trim();
      }

      // Try nested topic object
      if (lesson?.topic && typeof lesson.topic === 'object') {
        if (lesson.topic[lang]) return lesson.topic[lang].trim();
        if (lesson.topic.en) return lesson.topic.en.trim();
      }

      // Fallback to lesson name
      if (lesson?.lessonName) {
        return `Topic: ${lesson.lessonName.trim()}`;
      }

      return 'Untitled Topic';
    },
    estimateLessonTime: (lesson) => lesson.estimatedTime || lesson.duration || 10,
    getLevelDescription(level) {
      const descriptions = { 
        1: 'Beginner', 2: 'Elementary', 3: 'Basic', 
        4: 'Intermediate', 5: 'Advanced', 6: 'Professional'
      };
      return descriptions[parseInt(level)] || `Level ${level}`;
    },
    getProgressColor(progress) {
      if (progress >= 80) return 'high';
      if (progress >= 40) return 'medium';
      if (progress > 0) return 'low';
      return 'very-low';
    },
    getButtonClass(progress) {
      if (progress === 100) return 'completed';
      if (progress > 0) return 'continue';
      return 'start';
    },
    getButtonText(progress) {
      if (progress === 100) return 'Completed';
      if (progress > 0) return 'Continue';
      return 'Start Course';
    },
    getTypeLabel(type) {
      return { free: 'Free', premium: 'Premium' }[type] || 'Free';
    },
    getLessonWord(count) {
      return count === 1 ? 'lesson' : 'lessons';
    },
    hasTopicAccess(topicType) {
      if (topicType === 'free') return true;
      return this.userStatus === 'pro' || this.userStatus === 'start';
    },

    // Navigate to level test
    goToLevelTest(subject) {
// Store the subject for the test
      sessionStorage.setItem('testSubject', subject);
      // Navigate to level test route
      this.$router.push({
        name: 'LevelTest',
        query: { subject, level: this.currentLevelCap }
      });
    },

    // Generate subject-based gradient background
    getSubjectGradient(subject) {
      const gradients = {
        'Mathematics': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'English': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'Science': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'Physics': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'Chemistry': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'Biology': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'History': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'Geography': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'Computer Science': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'Programming': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'Design': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'Art': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'Music': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'Languages': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'default': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'
      };

      return gradients[subject] || gradients.default;
    },

    // Get subject icon as SVG
    getSubjectIcon(subject) {
      const icons = {
        'Mathematics': '📐',
        'English': '📚',
        'Science': '🔬',
        'Physics': '⚛️',
        'Chemistry': '⚗️',
        'Biology': '🧬',
        'History': '📜',
        'Geography': '🌍',
        'Computer Science': '💻',
        'Programming': '👨‍💻',
        'Design': '🎨',
        'Art': '🖼️',
        'Music': '🎵',
        'Languages': '🗣️',
        'default': '📖'
      };

      return icons[subject] || icons.default;
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.catalogue-page {
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
  transition: background-image 0.5s ease-in-out;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;
}
.hero-left {
  flex: 1;
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
.status-container {
  flex-shrink: 0;
}
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.status-badge svg {
  width: 1.125rem;
  height: 1.125rem;
}
.status-badge.status-free {
  color: #6b7280;
}
.status-badge.status-start {
  color: #92400e;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}
.status-badge.status-pro {
  color: #92400e;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
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
.reset-btn, .shuffle-btn {
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
}
.reset-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1.5px solid #fca5a5;
}
.reset-btn:hover {
  background: #fee2e2;
}
.shuffle-btn {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  border: 1.5px solid #fbbf24;
}
.shuffle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.25);
}
.reset-btn svg, .shuffle-btn svg {
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
  margin: 0;
}

/* MAIN SECTION */
.main-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}
.courses-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* COURSES GRID */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* COURSE CARD */
.course-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border: 1px solid #f3f4f6;
}
.course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}

/* Course Image Banner */
.card-image {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.subject-icon {
  font-size: 3.5rem;
  opacity: 0.7;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.level-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  color: #1e293b;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.card-header {
  padding: 1rem 1rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.course-badge {
  padding: 0.3125rem 0.625rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.course-badge.free {
  background: #f3f4f6;
  color: #6b7280;
}
.course-badge.premium, .course-badge.pro {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}
.bookmark-btn {
  width: 2rem;
  height: 2rem;
  border: 1.5px solid #e5e7eb;
  background: white;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
}
.bookmark-btn:hover:not(:disabled) {
  border-color: #6366f1;
  background: #eef2ff;
  color: #6366f1;
  transform: scale(1.05);
}
.bookmark-btn.active {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: #3b82f6;
  color: #3b82f6;
}
.bookmark-btn:disabled {
  cursor: not-allowed;
}
.bookmark-btn svg {
  width: 1rem;
  height: 1rem;
}

.card-body {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.course-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
}
.course-meta {
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
}
.meta-item svg {
  width: 0.8125rem;
  height: 0.8125rem;
  color: #9ca3af;
}
.course-stats {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.75rem;
  color: #374151;
  font-weight: 600;
}
.stat-item svg {
  width: 0.875rem;
  height: 0.875rem;
  color: #6b7280;
}

.progress-container {
  margin-top: auto;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.375rem;
}
.progress-text {
  font-size: 0.6875rem;
  color: #6b7280;
  font-weight: 500;
}
.progress-percent {
  font-size: 0.6875rem;
  color: #111827;
  font-weight: 700;
}
.progress-track {
  width: 100%;
  height: 5px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-fill.high {
  background: linear-gradient(90deg, #10b981, #059669);
}
.progress-fill.medium {
  background: linear-gradient(90deg, #6366f1, #4f46e5);
}
.progress-fill.low {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}
.progress-fill.very-low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.card-footer {
  padding: 0 1rem 1rem;
}
.course-btn {
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
}
.course-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}
.course-btn.start {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}
.course-btn.start:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
}
.course-btn.continue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}
.course-btn.continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}
.course-btn.completed {
  background: #f3f4f6;
  color: #6b7280;
  cursor: default;
}

/* PAGINATION */
.pagination-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}
.page-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: 1.5px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  border-color: #6366f1;
  background: #eef2ff;
  color: #6366f1;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-btn svg {
  width: 1rem;
  height: 1rem;
}
.page-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 700;
}
.page-current {
  color: #6366f1;
}
.page-separator {
  color: #d1d5db;
}
.page-total {
  color: #9ca3af;
}

/* MODALS */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-card {
  background: white;
  border-radius: 16px;
  max-width: 24rem;
  width: 100%;
  padding: 1.5rem;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.modal-card.success {
  text-align: center;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
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
.modal-close:hover {
  background: #e5e7eb;
  color: #111827;
}
.modal-close svg {
  width: 0.875rem;
  height: 0.875rem;
}
.modal-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #3b82f6;
}
.modal-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}
.success-animation {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #dcfce7, #d1fae5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #10b981;
  animation: successPulse 0.6s ease-out;
}
@keyframes successPulse {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.success-animation svg {
  width: 2rem;
  height: 2rem;
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}
.modal-text {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}
.modal-text strong {
  color: #111827;
  font-weight: 600;
}
.modal-actions {
  display: flex;
  gap: 0.75rem;
}
.modal-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-btn.secondary {
  background: #f3f4f6;
  color: #6b7280;
}
.modal-btn.secondary:hover {
  background: #e5e7eb;
}
.modal-btn.primary {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}
.modal-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
}
.modal-btn.full {
  width: 100%;
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-card, 
.modal-fade-leave-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-fade-enter-from .modal-card, 
.modal-fade-leave-to .modal-card {
  transform: scale(0.9) translateY(-20px);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.75rem;
  }
  .hero-subtitle {
    font-size: 0.9375rem;
  }
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
    padding: 0 1.5rem;
  }
  .stats-section {
    padding: 0 1.5rem;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .control-section, .main-section {
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
  .courses-grid {
    grid-template-columns: 1fr;
  }
  .modal-actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* SCHOOL MODE STYLES */
.subject-section {
  margin-bottom: 3rem;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.subject-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.subject-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.subject-count {
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 500;
}

.take-test-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.take-test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
}

.take-test-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

@media (max-width: 768px) {
  .subject-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .take-test-btn {
    width: 100%;
    justify-content: center;
  }

  .subject-title {
    font-size: 1.25rem;
  }
}
</style>