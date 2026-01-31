<template>
  <LessonLoader 
    v-if="showStudyInterface" 
    :course="selectedCourse"
    @back-to-courses="goBackToCourses"
    :key="`lesson-${componentKey}`"
  />

  <div v-else class="courses-page" :key="`courses-${componentKey}`">
    <div class="header">
      <div class="container">
        <div class="header-content">
          <div class="header-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="header-badge-icon">
              <path d="M5.5 8.5L2 12l3.5 3.5" />
              <path d="M18.5 8.5L22 12l-3.5 3.5" />
              <path d="M12 2l-2 10l2 10l2-10z" />
            </svg>
            New courses every week
          </div>
          <h1 class="header-title">Modern Professions</h1>
          <h2 class="header-subtitle">
            Learn relevant skills and grow with technology
          </h2>
          <p class="header-description">
            Discover courses in most in-demand areas: AI, blockchain, design, marketing and programming
          </p>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="container">
        <div class="filter-bar">
          <div class="filter-group-search">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input 
              v-model="searchTerm" 
              @input="debounceSearch" 
              placeholder="Search courses..." 
              class="input-search" 
            />
          </div>

          <div class="filter-group-select">
            <select v-model="categoryFilter" @change="applyFilters" class="select-field">
              <option value="all">All categories</option>
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="select-arrow">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div class="filter-group-select">
            <select v-model="levelFilter" @change="applyFilters" class="select-field">
              <option value="all">All levels</option>
              <option v-for="level in availableLevels" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="select-arrow">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div class="filter-group-buttons">
            <button :class="['button-filter', { active: typeFilter === 'all' }]" @click="setTypeFilter('all')">
              All
            </button>
            <button :class="['button-filter', { active: typeFilter === 'free' }]" @click="setTypeFilter('free')">
              Free
            </button>
            <button :class="['button-filter', { active: typeFilter === 'premium' }]" @click="setTypeFilter('premium')">
              Premium
            </button>
          </div>
        </div>

        <div class="results-info">
          <div class="results-count">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="results-icon">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
            <span>Courses found: {{ courses.length }}</span>
          </div>
          <div class="results-updated">Updated today</div>
        </div>

        <div v-if="loading" class="empty-state">
          <div class="spinner"></div>
          <h3 class="empty-state-title">Loading courses...</h3>
          <p class="empty-state-description">Preparing the best courses for you</p>
        </div>

        <div v-else-if="error" class="empty-state">
          <div class="empty-state-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state-icon">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 class="empty-state-title">Failed to load courses</h3>
          <p class="empty-state-description">{{ error }}</p>
          <button @click="loadCourses" class="button-reset-filters">
            Try again
          </button>
        </div>

        <div v-else-if="courses.length > 0" class="courses-grid">
          <div 
            v-for="course in courses" 
            :key="course.id || course._id" 
            class="course-card" 
            @click="openModal(course)"
          >
            <div class="course-card-image-wrapper">
              <div 
                class="course-card-image"
                :style="getCourseImageStyle(course)"
                @error="handleImageError($event, course)"
              >
                <div v-if="!course.imageLoaded" class="image-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="placeholder-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </div>
              </div>
              <div v-if="course.isPremium" class="badge badge-premium">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="badge-icon">
                  <path d="m14 6 4 10L2 10"></path>
                  <path d="M5 14 2 12l10-2L9.5 2l.5 6"></path>
                </svg>
                Premium
              </div>
              <div v-else class="badge badge-free">Free</div>
            </div>

            <div class="course-card-content">
              <div class="course-card-meta">
                <div class="course-card-category">{{ course.category || 'General' }}</div>
              </div>
              <h3 class="course-card-title">{{ course.title || 'Untitled' }}</h3>
              <p class="course-card-description">{{ course.description || 'No description provided' }}</p>
              <div class="course-card-stats-and-provider">
                <div class="course-card-stats">
                  <div class="course-card-stat">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="course-card-stat-icon">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{{ course.duration || '30 min' }}</span>
                  </div>
                  <div v-if="course.rating > 0" class="course-card-rating">
                    <svg viewBox="0 0 24 24" fill="#fbbf24" width="14" height="14">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    <span>{{ course.rating.toFixed(1) }}</span>
                  </div>
                  <div class="course-card-level">{{ course.level || 'Basic' }}</div>
                </div>
                <div class="course-card-provider">
                  <p>from</p>
                  <img src="@/assets/logo.png" alt="ACED" class="h-6 w-6 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
          <h3 class="empty-state-title">No courses found</h3>
          <p class="empty-state-description">
            Try changing search parameters or choose another category
          </p>
          <button @click="clearFilters" class="button-reset-filters">
            Reset filters
          </button>
        </div>
      </div>
    </div>

    <Transition name="modal" appear>
      <div v-if="isModalOpen && selectedCourse" class="modal-overlay" @click="closeModal">
        <div class="modal-container" @click.stop>
         
          <div v-if="modalLoading" class="modal-loading-state">
            <div class="spinner"></div>
            <p>Loading course info...</p>
          </div>

          <div v-else-if="selectedCourse" class="modal-content">
            <button class="modal-close" @click="closeModal" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

            <div class="modal-header-section">
                <div 
                  class="modal-image"
                  :style="getCourseImageStyle(selectedCourse)"
                >
                  <div class="modal-image-background-icon" v-html="getCategoryIcon(selectedCourse.category)"></div>
                  <div v-if="!selectedCourse.imageLoaded" class="modal-image-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="placeholder-icon">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                </div>

                <div class="modal-badge-container">
                  <div v-if="selectedCourse.isPremium" class="modal-badge modal-badge-premium">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m14 6 4 10L2 10"></path>
                      <path d="M5 14 2 12l10-2L9.5 2l.5 6"></path>
                    </svg>
                    Premium
                  </div>
                  <div v-else class="modal-badge modal-badge-free">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Free
                  </div>
                </div>

                <div class="modal-meta-overlay">
                  <div class="modal-duration">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {{ selectedCourse.duration || '30 мин' }}
                  </div>
                  <div class="modal-provider">
                    <span>от</span>
                    <img src="@/assets/logo.png" alt="ACED" class="h-6 w-6 object-contain" />
                  </div>
                </div>
            </div>

            <div class="modal-body">
              <div class="modal-course-info">
                <div class="modal-tags">
                  <span class="modal-tag modal-tag-category">{{ selectedCourse.category || 'Общий' }}</span>
                  <span class="modal-tag modal-tag-level">{{ selectedCourse.level || 'Базовый' }}</span>
                </div>

                <h2 class="modal-title">{{ selectedCourse.title || 'Без названия' }}</h2>
                <p class="modal-description">{{ selectedCourse.fullDescription || selectedCourse.description || 'Описание курса не указано' }}</p>
              </div>

              <div class="modal-divider"></div>

              <div class="modal-details">
                <div class="modal-details-grid">
                  <div class="modal-section">
                    <h3 class="modal-section-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                      </svg>
                      Что вы изучите:
                    </h3>
                    <ul class="modal-skills-list">
                      <li v-for="(skill, index) in getSkillsList(selectedCourse)" :key="`skill-${index}`" class="modal-skill-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="skill-check-icon">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"></path>
                          <path d="M22 4L12 14.01l-3-3"></path>
                        </svg>
                        {{ skill }}
                      </li>
                    </ul>
                  </div>

                  <div class="modal-section">
                    <h3 class="modal-section-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      Программа курса:
                    </h3>
                    <ul class="modal-modules-list">
                      <li v-for="(module, index) in getModulesList(selectedCourse)" :key="`module-${index}`" class="modal-module-item">
                        <span class="module-number">{{ index + 1 }}.</span>
                        <span class="module-text">{{ module }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button 
                  :class="['modal-action-button', { 
                    'premium': selectedCourse.isPremium && !isPremiumUser,
                    'accessible': !selectedCourse.isPremium || isPremiumUser
                  }]" 
                  @click="startCourse(selectedCourse)"
                  :disabled="selectedCourse.isPremium && !isPremiumUser"
                >
                  <svg v-if="selectedCourse.isPremium && !isPremiumUser" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  
                  <span v-if="selectedCourse.isPremium && !isPremiumUser">
                    Требуется подписка {{ currentUserStatus === 'free' ? 'Start/Pro' : 'Pro' }}
                  </span>
                  <span v-else>Начать изучение</span>
                </button>
                <p class="modal-action-description">
                  Начните изучение прямо сейчас и развивайте свои навыки
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import {
  getUpdatedCourses,
  getCourseById,
  getUpdatedCoursesWithFormat,
  getCourseStructured,
  getCourseStructuredEnhanced
} from '@/api.js';
import { getBulkCourseRatings } from '@/api/ratings';
import { mapGetters, mapState } from 'vuex';
import LessonLoader from '../components/Updated/LessonPlayer.vue';

export default {
  name: 'UpdatedCoursesPage',
  components: {
    LessonLoader
  },
  
  data() {
    return {
      // Course data
      courses: [],
      availableCategories: [],
      availableLevels: [],
      selectedCourse: null,
      
      // UI states
      isModalOpen: false,
      searchTerm: '',
      categoryFilter: 'all',
      levelFilter: 'all',
      typeFilter: 'all',
      debounceTimeout: null,
      loading: false,
      modalLoading: false,
      error: null,
      showStudyInterface: false,
      
      // Enhanced states
      retryCount: 0,
      maxRetries: 3,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      lastFetchTime: 0,
      
      // Reactivity tracking
      componentKey: 0,
      lastUpdateTime: Date.now(),
      forceUpdateCounter: 0
    };
  },

  computed: {
    ...mapGetters('user', ['userStatus']),
    ...mapState(['user']),
    ...mapGetters(['getUser']),

    currentUser() {
      return this.getUser || this.user || {};
    },

    currentUserStatus() {
      try {
        const userStatus = this.currentUser?.subscriptionPlan || 
                          localStorage.getItem('userStatus') || 
                          localStorage.getItem('plan') || 
                          localStorage.getItem('subscriptionPlan') ||
                          'free';
        return userStatus;
      } catch (error) {
        return 'free';
      }
    },

    isPremiumUser() {
      const status = this.currentUserStatus;
      return status === 'pro' || status === 'start';
    },

    // ✅ Enhanced computed properties
    filteredCoursesCount() {
      return this.courses.length;
    },

    hasValidCourses() {
      return Array.isArray(this.courses) && this.courses.length > 0;
    },

    shouldShowEmptyState() {
      return !this.loading && !this.error && !this.hasValidCourses;
    },

    shouldShowErrorState() {
      return !this.loading && this.error;
    },

    shouldRefreshCache() {
      return Date.now() - this.lastFetchTime > this.cacheTimeout;
    }
  },

  watch: {
    user: {
      handler(newUser, oldUser) {
        if (!newUser || !oldUser) return;
        
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: false
    },

    currentUserStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          this.triggerReactivityUpdate();
        }
      },
      immediate: false
    }
  },

  async mounted() {
    try {
      await this.initializeComponent();
    } catch (error) {
      this.error = 'Ошибка инициализации компонента';
    }
  },

  beforeUnmount() {
    this.cleanup();
  },

  methods: {
    // =====================================
    // ENHANCED INITIALIZATION
    // =====================================
    
    async initializeComponent() {
      try {
        // Check if we need to refresh cache
        if (this.shouldRefreshCache || this.courses.length === 0) {
          await this.loadCoursesWithRetry();
        }
        
        this.setupEventListeners();
        this.validateComponentState();
        
      } catch (error) {
        this.handleInitializationError(error);
      }
    },

    async loadCoursesWithRetry() {
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          await this.loadCourses();
          this.retryCount = 0;
          break;
        } catch (error) {
          if (attempt === this.maxRetries) {
            this.handleLoadError(error);
          } else {
            // Wait before retry with exponential backoff
            await this.delay(1000 * Math.pow(2, attempt - 1));
          }
        }
      }
    },

    validateComponentState() {
      // Validate that we have the required data structure
      if (!Array.isArray(this.courses)) {
        this.courses = [];
      }

      if (!Array.isArray(this.availableCategories)) {
        this.availableCategories = [];
      }

      if (!Array.isArray(this.availableLevels)) {
        this.availableLevels = [];
      }
    },

    handleInitializationError(error) {
      this.error = this.getErrorMessage(error);
      this.loading = false;
      
      // Try to provide some fallback data
      this.provideFallbackData();
    },

    provideFallbackData() {
      // Provide empty arrays to prevent template errors
      this.courses = [];
      this.availableCategories = ['ИИ и автоматизация', 'Web-разработка', 'Дизайн', 'Программирование'];
      this.availableLevels = ['Начинающий', 'Средний', 'Продвинутый'];
    },

    // =====================================
    // ENHANCED COURSE LOADING
    // =====================================
    
    async loadCourses() {
      this.loading = true;
      this.error = null;
      
      try {
        const filters = this.buildFilters();
        // Try structured format first, fallback to standard
        let response = await getUpdatedCoursesWithFormat(filters, 'structured');
        
        // Validate response structure
        if (!this.validateResponse(response)) {
          response = await getUpdatedCourses(filters);
        }
        
        if (response && response.success) {
          await this.processCoursesResponse(response);
          this.lastFetchTime = Date.now();
        } else {
          throw new Error(response?.error || 'Failed to fetch courses');
        }
      } catch (error) {
        this.handleLoadError(error);
      } finally {
        this.loading = false;
      }
    },

    validateResponse(response) {
      return response && 
             typeof response === 'object' && 
             response.success !== false &&
             Array.isArray(response.courses);
    },

    async processCoursesResponse(response) {
      // Enhanced course processing with validation
      this.courses = this.processCourses(response.courses || []);
      this.availableCategories = this.processCategories(response.categories || []);
      this.availableLevels = this.processLevels(response.difficulties || []);

      // Store metadata
      this.storeCourseMetadata(response);

      // Fetch ratings for all courses
      await this.fetchCourseRatings();
    },

    async fetchCourseRatings() {
      try {
        const courseIds = this.courses.map(course => course._id || course.id).filter(Boolean);
        if (courseIds.length === 0) return;

        const ratingsResponse = await getBulkCourseRatings(courseIds);
        if (ratingsResponse.success && ratingsResponse.data) {
          this.courses = this.courses.map(course => {
            const courseId = course._id || course.id;
            const ratingData = ratingsResponse.data[courseId];
            return {
              ...course,
              rating: ratingData?.averageRating || course.rating || 0,
              totalRatings: ratingData?.totalRatings || 0
            };
          });
        }
      } catch (error) {
        console.warn('Failed to fetch course ratings:', error);
      }
    },

    processCourses(courses) {
      if (!Array.isArray(courses)) {
        return [];
      }
      
      return courses.map((course, index) => {
        try {
          return this.processSingleCourse(course, index);
        } catch (error) {
          return this.createFallbackCourse(course, index);
        }
      }).filter(course => course !== null);
    },

    processSingleCourse(course, index) {
      // Enhanced course processing with validation
      const processedCourse = {
        ...course,
        id: course._id || course.id || `course_${Date.now()}_${index}`,
        _id: course._id || course.id || `course_${Date.now()}_${index}`,
        title: this.validateString(course.title) || 'Без названия',
        description: this.validateString(course.description) || 'Описание не указано',
        category: this.validateString(course.category) || 'Общий',
        level: this.validateString(course.level || course.difficulty) || 'Базовый',
        duration: this.validateString(course.duration) || '30 мин',
        isPremium: Boolean(course.isPremium || course.premium || course.type === 'premium'),
        
        // Enhanced metadata
        thumbnail: this.generateImageBackground(course.category),
        instructor: this.validateInstructor(course.instructor),
        
        // Enhanced course stats
        studentsCount: this.validateNumber(course.studentsCount, 0),
        rating: this.validateNumber(course.rating, 0, 5),
        
        // Enhanced curriculum data
        curriculum: this.validateCurriculum(course.curriculum),
        structuredData: course.structuredData || null,
        format: course.format || 'standard',
        
        // Computed properties
        isNew: this.isNewCourse(course.createdAt),
        hasHomework: this.hasHomeworkContent(course.curriculum),
        estimatedHours: this.extractHours(course.duration),
        totalLessons: (course.curriculum || []).length,
        
        // Image loading state
        imageLoaded: true, // We'll use CSS backgrounds, so always loaded
        
        // Processing metadata
        processedAt: Date.now(),
        isValid: true
      };

      return processedCourse;
    },

    createFallbackCourse(course, index) {
      // Create a minimal valid course object for corrupted data
      return {
        id: `fallback_${index}`,
        _id: `fallback_${index}`,
        title: 'Курс недоступен',
        description: 'Этот курс временно недоступен',
        category: 'Общий',
        level: 'Базовый',
        duration: '30 мин',
        isPremium: false,
        thumbnail: this.generateImageBackground('default'),
        instructor: { name: 'ACED', avatar: this.getDefaultAvatar() },
        studentsCount: 0,
        rating: 0,
        curriculum: [],
        imageLoaded: true,
        isValid: false,
        isFallback: true
      };
    },

    processCategories(categories) {
      const defaultCategories = [
        'ИИ и автоматизация',
        'Видеомонтаж',
        'Графический дизайн',
        'Web-разработка',
        'Мобильная разработка',
        'Машинное обучение',
        'Дизайн',
        'Программирование',
        'Маркетинг'
      ];

      if (!Array.isArray(categories) || categories.length === 0) {
        return defaultCategories;
      }

      // Merge with defaults and remove duplicates
      const merged = [...new Set([...categories, ...defaultCategories])];
      return merged.sort();
    },

    processLevels(levels) {
      const defaultLevels = ['Начинающий', 'Средний', 'Продвинутый'];

      if (!Array.isArray(levels) || levels.length === 0) {
        return defaultLevels;
      }

      return [...new Set([...levels, ...defaultLevels])].sort();
    },

    storeCourseMetadata(response) {
      try {
        const metadata = {
          totalCourses: this.courses.length,
          format: response.format,
          lastFetch: Date.now(),
          categories: this.availableCategories.length,
          levels: this.availableLevels.length,
          pagination: response.pagination || {}
        };

        sessionStorage.setItem('coursesMetadata', JSON.stringify(metadata));
      } catch (error) {
        // Silent fail
      }
    },

    // =====================================
    // ENHANCED VALIDATION HELPERS
    // =====================================

    validateString(value, fallback = '') {
      return (typeof value === 'string' && value.trim()) ? value.trim() : fallback;
    },

    validateNumber(value, min = 0, max = Infinity) {
      const num = parseFloat(value);
      if (isNaN(num)) return min;
      return Math.max(min, Math.min(max, num));
    },

    validateInstructor(instructor) {
      if (!instructor || typeof instructor !== 'object') {
        return {
          name: 'ACED Instructor',
          avatar: this.getDefaultAvatar(),
          bio: 'Experienced instructor'
        };
      }

      return {
        name: this.validateString(instructor.name, 'ACED Instructor'),
        avatar: this.getDefaultAvatar(),
        bio: this.validateString(instructor.bio, 'Experienced instructor')
      };
    },

    validateCurriculum(curriculum) {
      if (!Array.isArray(curriculum)) return [];
      
      return curriculum.filter(lesson => {
        return lesson && 
               typeof lesson === 'object' && 
               lesson.title && 
               typeof lesson.title === 'string';
      });
    },

    // =====================================
    // ENHANCED HELPER METHODS
    // =====================================

    isNewCourse(createdAt) {
      if (!createdAt) return false;
      try {
        const courseDate = new Date(createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return courseDate > weekAgo;
      } catch (error) {
        return false;
      }
    },

    hasHomeworkContent(curriculum) {
      if (!Array.isArray(curriculum)) return false;
      return curriculum.some(lesson => 
        lesson.steps?.some(step => 
          step.type === 'quiz' || step.type === 'practice'
        )
      );
    },

    extractHours(duration) {
      if (typeof duration === 'string') {
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1]) : 10;
      }
      if (duration?.hours) return duration.hours;
      return 10;
    },

    // =====================================
    // ✅ FAST LOADING CSS GRADIENT IMAGES
    // =====================================
    
    getCategoryIcon(category) {
        const cleanCategory = this.safeString(category);
        const iconProps = 'width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

        const icons = {
            ai: `<svg ${iconProps}><path d="M12 8V4H8"/><rect x="4" y="4" width="8" height="8" rx="2"/><path d="M12 12v4h4"/><rect x="10" y="10" width="8" height="8" rx="2"/></svg>`,
            web: `<svg ${iconProps}><path d="m16 18-6-12 6-6m-12 18 6-12-6-6"/></svg>`,
            design: `<svg ${iconProps}><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="12"/><line x1="22" y1="8.5" x2="2" y2="8.5"/><line x1="2" y1="15.5" x2="22" y2="15.5"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
            mobile: `<svg ${iconProps}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
            marketing: `<svg ${iconProps}><path d="M12 22V12M12 12L8 16M12 12l4 4M12 12L8 8M12 12l4-4M12 2v4M20 12h-4M4 12h4M17.66 17.66l-2.83-2.83M6.34 6.34l2.83 2.83M17.66 6.34l-2.83 2.83M6.34 17.66l2.83-2.83"/></svg>`,
            default: `<svg ${iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        };

        if (cleanCategory.includes('ии') || cleanCategory.includes('машин')) return icons.ai;
        if (cleanCategory.includes('web') || cleanCategory.includes('программирование')) return icons.web;
        if (cleanCategory.includes('мобильная')) return icons.mobile;
        if (cleanCategory.includes('дизайн') || cleanCategory.includes('графический')) return icons.design;
        if (cleanCategory.includes('маркетинг')) return icons.marketing;
        
        return icons.default;
    },

    getCourseImageStyle(course) {
      if (!course) return this.generateImageBackground('default');
      
      // Always use CSS gradients for instant loading
      return this.generateImageBackground(course.category);
    },

    generateImageBackground(category) {
      // ✅ FAST LOADING: CSS gradients based on category - no network requests!
      const gradients = {
        'ИИ и автоматизация': { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important' },
        'Видеомонтаж': { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important' },
        'Графический дизайн': { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important' },
        'Web-разработка': { background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important' },
        'Мобильная разработка': { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%) !important' },
        'Машинное обучение': { background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%) !important' },
        'Дизайн': { background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%) !important' },
        'Программирование': { background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%) !important' },
        'Маркетинг': { background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%) !important' },
        'default': { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important' }
      };
      
      const baseStyle = {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        textAlign: 'center'
      };

      const gradient = gradients[category] || gradients.default;
      return { ...baseStyle, ...gradient };
    },

    getDefaultAvatar() {
      // Simple CSS gradient for avatar too
      return {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        width: '40px',
        height: '40px',
        borderRadius: '50%'
      };
    },

    handleImageError(event, course) {
      // This method is kept for compatibility but won't be needed with CSS gradients
    },

    // =====================================
    // ENHANCED MODAL METHODS
    // =====================================

    async openModal(course) {
      if (!course || (!course._id && !course.id)) {
        return;
      }

      this.selectedCourse = null;
      this.isModalOpen = true;
      this.modalLoading = true;
      
      try {
        const courseId = course._id || course.id;
        
        // Try structured format first with better error handling
        let response = await getCourseStructuredEnhanced(courseId);
        
        if (response && response.success && response.data) {
          this.selectedCourse = this.enhanceCourseForModal(response.data, course);
        } else {
          this.selectedCourse = this.enhanceCourseForModal(course, course);
        }
      } catch (error) {
        this.selectedCourse = this.enhanceCourseForModal(course, course);
      } finally {
        this.modalLoading = false;
      }
    },

    enhanceCourseForModal(detailedCourse, basicCourse) {
      return {
        ...basicCourse, // Keep original data as fallback
        ...detailedCourse, // Override with detailed data
        id: detailedCourse._id || detailedCourse.id || basicCourse.id,
        _id: detailedCourse._id || basicCourse._id,
        title: detailedCourse.title || basicCourse.title,
        isPremium: Boolean(detailedCourse.isPremium || basicCourse.isPremium),
        
        // Enhanced modal-specific data
        skills: this.getSkillsList(detailedCourse),
        modules: this.getModulesList(detailedCourse),
        
        // Use same gradient background as card
        thumbnail: this.generateImageBackground(detailedCourse.category || basicCourse.category),
        imageLoaded: true,
        
        // Enhanced metadata
        format: detailedCourse.format || 'standard',
        structuredData: detailedCourse.structuredData || null,
        hasValidData: this.validateCourseData(detailedCourse),
        
        // Modal display flags
        isModalReady: true,
        modalLoadedAt: Date.now()
      };
    },

    validateCourseData(course) {
      return !!(
        course &&
        course.title &&
        course.description &&
        course.category
      );
    },

    // =====================================
    // ENHANCED COURSE START METHODS
    // =====================================

    async startCourse(course) {
      if (!course) {
        return;
      }
      // Enhanced premium access check
      if (course.isPremium && !this.isPremiumUser) {
        const message = this.getPremiumMessage(course);
        this.showToast(message, 'error');
        return;
      }
      
      try {
        // Ensure we have complete course data for better learning experience
        let completeCourse = await this.ensureCompleteCourseData(course);
        
        this.selectedCourse = completeCourse;
        this.isModalOpen = false;
        this.showStudyInterface = true;
        
        // Track course start
        this.trackCourseStart(completeCourse);
        
      } catch (error) {
        this.showToast('Ошибка при запуске курса', 'error');
      }
    },

    async ensureCompleteCourseData(course) {
      // If we don't have structured data or curriculum, try to fetch it
      if (!course.structuredData && (!course.curriculum || !course.curriculum.length)) {
        try {
          // Try structured format first
          let response = await getCourseStructuredEnhanced(course._id || course.id);
          
          if (response && response.success && response.data) {
            return {
              ...course,
              ...response.data,
              _id: response.data._id || course._id,
              id: response.data.id || course.id || response.data._id,
              format: response.format,
              structuredData: response.format === 'structured' ? response.data : null,
              isEnhanced: true
            };
          }
        } catch (error) {
          // Continue with original course data
        }
      }
      
      return course;
    },

    getPremiumMessage(course) {
      const currentPlan = this.currentUserStatus;
      if (currentPlan === 'free') {
        return `Этот курс доступен только по подписке Start/Pro. Ваш текущий статус: ${currentPlan}`;
      }
      return `Этот курс требует подписку Pro. Ваш текущий статус: ${currentPlan}`;
    },

    trackCourseStart(course) {
      try {
        // Track course start for analytics
        const trackingData = {
          courseId: course.id,
          title: course.title,
          category: course.category,
          isPremium: course.isPremium,
          startedAt: Date.now(),
          userStatus: this.currentUserStatus
        };

        sessionStorage.setItem('lastStartedCourse', JSON.stringify(trackingData));
        
        // Emit event for potential analytics
        this.$emit('courseStarted', trackingData);
      } catch (error) {
        // Silent fail for tracking
      }
    },

    // =====================================
    // ENHANCED ERROR HANDLING
    // =====================================

    handleLoadError(error) {
      this.error = this.getErrorMessage(error);
      this.retryCount++;
      
      // Provide helpful error recovery
      if (this.retryCount >= this.maxRetries) {
        this.provideFallbackData();
      }
    },

    getErrorMessage(error) {
      if (!error) return 'Неизвестная ошибка';
      
      if (typeof error === 'string') return error;
      
      if (error.message) {
        if (error.message.includes('Network')) {
          return 'Проблемы с подключением к интернету. Проверьте соединение.';
        }
        if (error.message.includes('404')) {
          return 'Сервер курсов временно недоступен. Попробуйте позже.';
        }
        if (error.message.includes('500')) {
          return 'Ошибка сервера. Наша команда уже работает над решением.';
        }
        if (error.message.includes('timeout')) {
          return 'Превышено время ожидания. Попробуйте еще раз.';
        }
        return error.message;
      }
      
      return 'Произошла ошибка при загрузке курсов';
    },

    // =====================================
    // ENHANCED UTILITY METHODS
    // =====================================

    async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    showToast(message, type = 'info') {
      if (this.$toast) {
        this.$toast[type](message, { duration: 4000 });
      } else if (this.$notify) {
        this.$notify({ type, message, duration: 4000 });
      } else {
        // Fallback for environments without toast
        // Fallback: no toast available
      }
    },

    goBackToCourses() {
      this.showStudyInterface = false;
      this.selectedCourse = null;
      this.componentKey++; // Force re-render
    },

    closeModal() {
      this.isModalOpen = false;
      this.selectedCourse = null;
      this.modalLoading = false;
    },

    // =====================================
    // ENHANCED FILTER METHODS
    // =====================================

    buildFilters() {
      const filters = {};
      
      if (this.searchTerm && this.searchTerm.trim()) {
        filters.search = this.searchTerm.trim();
      }
      
      if (this.categoryFilter && this.categoryFilter !== 'all') {
        filters.category = this.categoryFilter;
      }
      
      if (this.levelFilter && this.levelFilter !== 'all') {
        filters.difficulty = this.levelFilter;
      }
      
      if (this.typeFilter && this.typeFilter !== 'all') {
        filters.type = this.typeFilter;
      }
      
      return filters;
    },

    debounceSearch() {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      this.debounceTimeout = setTimeout(() => {
        this.loadCoursesWithRetry();
      }, 300);
    },

    applyFilters() {
      this.loadCoursesWithRetry();
    },

    setTypeFilter(type) {
      this.typeFilter = type;
      this.loadCoursesWithRetry();
    },

    clearFilters() {
      this.searchTerm = '';
      this.categoryFilter = 'all';
      this.levelFilter = 'all';
      this.typeFilter = 'all';
      this.loadCoursesWithRetry();
    },

    // =====================================
    // ENHANCED MODAL CONTENT METHODS
    // =====================================

    getSkillsList(course) {
      if (!course) return this.getDefaultSkills();
      
      // Try to get skills from multiple sources
      if (course.skills && Array.isArray(course.skills) && course.skills.length > 0) {
        return course.skills;
      }
      
      if (course.learningOutcomes && Array.isArray(course.learningOutcomes) && course.learningOutcomes.length > 0) {
        return course.learningOutcomes;
      }
      
      // Generate skills based on course category/title
      return this.generateSkillsFromCourse(course);
    },

    generateSkillsFromCourse(course) {
      const title = this.safeString(course.title);
      const category = this.safeString(course.category);
      
      const skillsMap = {
        'javascript': [
          'Основы синтаксиса JavaScript',
          'Работа с DOM элементами',
          'Асинхронное программирование',
          'Современные возможности ES6+'
        ],
        'python': [
          'Синтаксис и структуры данных Python',
          'Объектно-ориентированное программирование',
          'Работа с библиотеками',
          'Создание веб-приложений'
        ],
        'design': [
          'Принципы дизайна и композиции',
          'Работа с цветом и типографикой',
          'Создание пользовательских интерфейсов',
          'Современные дизайн-тренды'
        ],
        'маркетинг': [
          'Стратегия цифрового маркетинга',
          'Анализ целевой аудитории',
          'Создание рекламных кампаний',
          'Измерение эффективности'
        ],
        'ии': [
          'Основы искусственного интеллекта',
          'Машинное обучение',
          'Нейронные сети',
          'Практическое применение ИИ'
        ]
      };
      
      // Check for keyword matches
      for (const [keyword, skills] of Object.entries(skillsMap)) {
        if (title.includes(keyword) || category.includes(keyword)) {
          return skills;
        }
      }
      
      return this.getDefaultSkills();
    },

    getModulesList(course) {
      if (!course) return this.getDefaultModules();

      // Try curriculum first
      if (course.curriculum && Array.isArray(course.curriculum) && course.curriculum.length > 0) {
        return course.curriculum.map(lesson => {
          if (lesson.title && typeof lesson.title === 'string') return lesson.title;
          if (lesson.lessonName) {
            if (typeof lesson.lessonName === 'string') return lesson.lessonName;
            if (typeof lesson.lessonName === 'object') {
              const lang = localStorage.getItem('lang') || 'ru';
              return lesson.lessonName[lang] || lesson.lessonName.en || lesson.lessonName.ru || lesson.lessonName.uz || 'Урок без названия';
            }
          }
          return 'Урок без названия';
        });
      }

      // Try modules field
      if (course.modules && Array.isArray(course.modules) && course.modules.length > 0) {
        return course.modules;
      }

      // Generate based on course type
      return this.generateModulesFromCourse(course);
    },

    generateModulesFromCourse(course) {
      const title = this.safeString(course.title);
      
      if (title.includes('javascript')) {
        return [
          'Введение в JavaScript',
          'Переменные и функции',
          'Работа с DOM',
          'Асинхронность и промисы',
          'Практический проект'
        ];
      }
      
      if (title.includes('design') || title.includes('дизайн')) {
        return [
          'Основы дизайна',
          'Цвет и типографика',
          'Композиция и макеты',
          'UI/UX принципы',
          'Финальный проект'
        ];
      }
      
      return this.getDefaultModules();
    },

    getDefaultSkills() {
      return [
        'Практические навыки в выбранной области',
        'Современные методы и технологии',
        'Решение реальных задач',
        'Портфолио проектов'
      ];
    },

    getDefaultModules() {
      return [
        'Введение в курс',
        'Основные концепции',
        'Практические задания',
        'Продвинутые темы',
        'Итоговый проект'
      ];
    },

    safeString(value) {
      if (value === null || value === undefined) return '';
      return String(value).toLowerCase().trim();
    },

    // =====================================
    // ENHANCED CLEANUP AND EVENT HANDLING
    // =====================================

    cleanup() {
      // Clear timeouts
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = null;
      }

      // Remove event listeners
      this.removeEventListeners();

      // Clear any intervals
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },

    setupEventListeners() {
      // Enhanced event listeners setup
      if (typeof window !== 'undefined') {
        // Handle online/offline events
        this.handleOnline = () => {
          if (this.shouldRefreshCache) {
            this.loadCoursesWithRetry();
          }
        };
        
        this.handleOffline = () => {
          // Handle offline state
        };

        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        // Handle visibility change (tab focus)
        this.handleVisibilityChange = () => {
          if (!document.hidden && this.shouldRefreshCache) {
            this.loadCoursesWithRetry();
          }
        };

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
      }
    },

    removeEventListeners() {
      if (typeof window !== 'undefined') {
        if (this.handleOnline) {
          window.removeEventListener('online', this.handleOnline);
          this.handleOnline = null;
        }
        
        if (this.handleOffline) {
          window.removeEventListener('offline', this.handleOffline);
          this.handleOffline = null;
        }

        if (this.handleVisibilityChange) {
          document.removeEventListener('visibilitychange', this.handleVisibilityChange);
          this.handleVisibilityChange = null;
        }
      }
    },

    triggerReactivityUpdate() {
      this.componentKey++;
      this.forceUpdateCounter++;
      this.lastUpdateTime = Date.now();
      this.$forceUpdate();
    },

    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;
      this.triggerReactivityUpdate();

      // Show success message for upgrades
      if (newStatus && newStatus !== 'free' && oldStatus === 'free') {
        const planLabel = 'Pro';
        this.showToast(`🎉 ${planLabel} подписка активирована!`, 'success');
      }
    }
  }
};
</script>

<style scoped>
/* CSS Variables */
:root {
  --color-background: #ffffff;
  --color-foreground: #222;
  --color-card: #ffffff;
  --color-card-foreground: #222;
  --color-muted: #f3f3f5;
  --color-muted-foreground: #717182;
  --color-accent: #e9ebef;
  --color-accent-foreground: #222;
  --color-border: rgba(0, 0, 0, 0.1);
  --color-input-background: #f3f3f5;
  --color-ring: #ccc;
  --color-brand: #8b7fbf;
  --color-brand-light: #a599d4;
  --color-brand-dark: #6b5b9a;
  --color-brand-foreground: #ffffff;
  --color-success: #16a34a;
  --color-green-100: #d1fae5;
  --color-green-800: #166534;
  --brand-purple: #8B5CF6;
  --brand-purple-dark: #7C3AED;
  --brand-purple-light: #A78BFA;
  --brand-purple-muted: rgba(139, 92, 246, 0.1);
}

/* Base Styles */
.courses-page {
  background-color: var(--color-background);
  min-height: 100vh;
  color: var(--color-foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif;
  line-height: 1.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
.header {
  background-image: linear-gradient(to right, #111827, #1f2937, #111827);
  color: #fff;
  padding: 4rem 0;
  text-align: center;
}

@media (min-width: 768px) {
  .header {
    padding: 6rem 0;
  }
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(139, 127, 191, 0.2);
  color: var(--color-brand-light);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 auto;
}

.header-badge-icon {
  width: 1rem;
  height: 1rem;
}

.header-title {
  font-size: 2.25rem;
  font-weight: 700;
  background-image: linear-gradient(to right, #fff, #e5e7eb, #9ca3af);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0;
}

@media (min-width: 768px) {
  .header-title {
    font-size: 3.75rem;
  }
}

.header-subtitle {
  font-size: 1.25rem;
  color: #d1d5db;
  margin: 0;
}

@media (min-width: 768px) {
  .header-subtitle {
    font-size: 1.5rem;
  }
}

.header-description {
  font-size: 1.125rem;
  color: #9ca3af;
  max-width: 42rem;
  margin: 0 auto;
}

.content-wrapper {
  padding: 2rem 0;
}

/* Filter Bar */
.filter-bar {
  background-color: var(--color-card);
  border-radius: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .filter-bar {
    flex-direction: row;
    align-items: center;
    gap: 2rem;
  }
}

.filter-group-search {
  position: relative;
  flex: 2;
  min-width: 280px;
}

@media (max-width: 767px) {
  .filter-group-search {
    min-width: auto;
  }
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted-foreground);
  width: 1rem;
  height: 1rem;
}

.input-search {
  width: 100%;
  height: 2.5rem;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background-color: var(--color-input-background);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-search:focus {
  border-color: rgba(139, 127, 191, 0.5);
  box-shadow: 0 0 0 2px rgba(139, 127, 191, 0.2);
}

.filter-group-select {
  position: relative;
  flex: 1;
  min-width: 160px;
}

@media (max-width: 767px) {
  .filter-group-select {
    min-width: auto;
  }
}

.select-field {
  width: 100%;
  height: 2.5rem;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background-color: var(--color-input-background);
  font-size: 0.875rem;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  opacity: 0.5;
  pointer-events: none;
}

.filter-group-buttons {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.button-filter {
  height: 2.25rem;
  padding: 0 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background-color: var(--color-background);
  color: var(--color-foreground);
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
}

.button-filter:hover {
  background-color: var(--color-accent);
  color: var(--color-accent-foreground);
}

.button-filter.active {
  background-color: var(--color-brand);
  color: #fff;
  border-color: var(--color-brand);
}

/* Results Info */
.results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.results-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-muted-foreground);
  font-size: 0.875rem;
}

.results-icon {
  width: 1rem;
  height: 1rem;
}

.results-updated {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(139, 127, 191, 0.3);
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-brand);
}

/* Courses Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

@media (min-width: 1024px) {
  .courses-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Course Card */
.course-card {
  cursor: pointer;
  background-color: var(--color-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -3px rgba(0, 0, 0, 0.1);
}

.course-card-image-wrapper {
  position: relative;
  padding: 16px 16px 0;
}

.course-card-image {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.badge {
  position: absolute;
  top: 24px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
}

.badge-premium {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  color: #fff;
}

.badge-free {
  background-color: var(--color-green-100);
  color: var(--color-green-800);
}

.course-card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.course-card-category {
  display: inline-flex;
  border-radius: 16px;
  border: 1px solid rgba(139, 127, 191, 0.3);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-brand);
}

.course-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  transition: color 0.2s ease;
}

.course-card:hover .course-card-title {
  color: var(--color-brand);
}

.course-card-description {
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  flex-grow: 1;
}

.course-card-stats-and-provider {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.course-card-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--color-muted-foreground);
}

.course-card-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-card-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #d97706;
  font-weight: 600;
}

.course-card-rating svg {
  flex-shrink: 0;
}

.course-card-level {
  padding: 2px 8px;
  background: var(--color-muted);
  border-radius: 4px;
  font-size: 12px;
}

.course-card-provider {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 13px;
  color: var(--color-muted-foreground);
}
.course-card-provider p {
  margin: 0;
}


/* Empty State & Loading */
.empty-state {
  text-align: center;
  padding: 4rem 0;
}

.empty-state-icon-wrapper {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  background-color: var(--color-muted);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-muted-foreground);
}

.empty-state-title {
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.empty-state-description {
  color: var(--color-muted-foreground);
  margin: 0 0 1rem 0;
}

.button-reset-filters {
  height: 2.5rem;
  padding: 0 1rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(139, 127, 191, 0.3);
  background-color: var(--color-background);
  color: var(--color-brand);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-reset-filters:hover {
  background-color: rgba(139, 127, 191, 0.1);
}

.spinner {
  width: 4rem;
  height: 4rem;
  border: 4px solid var(--color-muted);
  border-top: 4px solid var(--color-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* --- MODAL STYLES --- */

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 550px; /* Controls the modal's width */
  max-height: 90vh;
  background-color: var(--color-background);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: rgba(0, 0, 0, 0.5);
  transform: scale(1.1);
}

.modal-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.modal-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.modal-header-section {
  position: relative;
  height: 240px;
  flex-shrink: 0;
}

.modal-image {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.modal-image-background-icon {
    position: absolute;
    width: 120px;
    height: 120px;
    z-index: 1;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: rgba(255, 255, 255, 0.15);
}

.modal-image-background-icon >>> svg {
    width: 100%;
    height: 100%;
}


.modal-badge-container {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.modal-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-badge-premium {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  color: white;
}

.modal-badge-free {
  background: linear-gradient(135deg, var(--color-success), #22c55e);
  color: white;
}

.modal-meta-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: end;
  color: white;
  z-index: 10;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.modal-duration {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.modal-provider {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 13px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-tag {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
}

.modal-tag-category {
  background: rgba(139, 127, 191, 0.1);
  color: var(--color-brand);
  border-color: rgba(139, 127, 191, 0.3);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.modal-description {
  font-size: 0.9375rem;
  color: var(--color-muted-foreground);
  margin: 0;
}

.modal-divider {
  height: 1px;
  background: var(--color-border);
  border: none;
}

.modal-details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .modal-details-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.modal-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.modal-skills-list,
.modal-modules-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-skill-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.875rem;
}

.skill-check-icon {
  color: var(--color-success);
  flex-shrink: 0;
  margin-top: 2px;
}

.modal-module-item {
  display: flex;
  gap: 8px;
  font-size: 0.875rem;
}

.module-number {
  color: var(--color-brand);
  font-weight: 600;
}

.module-text {
  color: var(--color-muted-foreground);
}

.modal-actions {
  padding: 24px 32px;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
  flex-shrink: 0;
}

.modal-action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: none;
}

.modal-action-button.accessible {
  background-color: #111827;
  color: #ffffff;
}

.modal-action-button.accessible:hover:not(:disabled) {
  background-color: #1f2937;
  transform: translateY(-2px);
}

.modal-action-button.premium {
  background-color: #fffbeb;
  color: #b45309;
}

.modal-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.modal-action-description {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-muted-foreground);
  margin-top: 0.5rem;
}

/* Responsive Overrides */
@media (max-width: 480px) {
  .modal-body, .modal-actions {
    padding: 16px;
  }
  .modal-title {
    font-size: 1.25rem;
  }
}
</style>