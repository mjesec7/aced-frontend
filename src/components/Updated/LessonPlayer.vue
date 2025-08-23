<template>
  <div class="courses-page" :key="`courses-${componentKey}`">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="header-badge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="header-badge-icon"
            >
              <path d="M5.5 8.5L2 12l3.5 3.5" />
              <path d="M18.5 8.5L22 12l-3.5 3.5" />
              <path d="M12 2l-2 10l2 10l2-10z" />
            </svg>
            Новые курсы каждую неделю
          </div>
          <h1 class="header-title">Современные профессии</h1>
          <h2 class="header-subtitle">
            Изучайте актуальные навыки и развивайтесь вместе с технологиями
          </h2>
          <p class="header-description">
            Откройте для себя курсы по самым востребованным направлениям: ИИ,
            блокчейн, дизайн, маркетинг и программирование
          </p>
        </div>
      </div>
    </header>

    <div class="content-wrapper">
      <div class="container">
        <section class="filter-bar">
          <div class="filter-group-search">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="search-icon"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              v-model="searchTerm"
              @input="debounceSearch"
              placeholder="Поиск курсов..."
              class="input-search"
            />
          </div>

          <div class="filter-group-select">
            <select v-model="categoryFilter" @change="applyFilters" class="select-field">
              <option value="all">Все категории</option>
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="select-arrow"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div class="filter-group-select">
            <select v-model="levelFilter" @change="applyFilters" class="select-field">
              <option value="all">Все уровни</option>
              <option v-for="level in availableLevels" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="select-arrow"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div class="filter-group-buttons">
            <button
              :class="['button-filter', { active: typeFilter === 'all' }]"
              @click="setTypeFilter('all')"
            >
              Все
            </button>
            <button
              :class="['button-filter', { active: typeFilter === 'free' }]"
              @click="setTypeFilter('free')"
            >
              Бесплатные
            </button>
            <button
              :class="['button-filter', { active: typeFilter === 'premium' }]"
              @click="setTypeFilter('premium')"
            >
              Премиум
            </button>
          </div>
        </section>

        <div class="results-info">
          <div class="results-count">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="results-icon"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
            <span>Найдено курсов: {{ courses.length }}</span>
          </div>
          <div class="results-updated">Обновлено сегодня</div>
        </div>

        <div v-if="loading" class="empty-state">
          <div class="spinner"></div>
          <h3 class="empty-state-title">Загрузка курсов...</h3>
        </div>

        <div v-else-if="error" class="empty-state">
          <div class="empty-state-icon-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="empty-state-icon"
            >
              <path
                d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 class="empty-state-title">Не удалось загрузить курсы</h3>
          <p class="empty-state-description">{{ error }}</p>
          <button @click="fetchCourses" class="button-reset-filters">
            Попробовать снова
          </button>
        </div>

        <div v-else-if="courses.length > 0" class="courses-grid">
          <div
            v-for="course in courses"
            :key="course.id"
            class="course-card"
            @click="openModal(course)"
          >
            <div class="course-card-image-wrapper">
              <img
                :src="getCourseImage(course)"
                :alt="course.title"
                class="course-card-image"
                @error="handleImageError($event, course)"
              />
              <div v-if="course.isPremium" class="badge badge-premium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="badge-icon"
                >
                  <path d="m14 6 4 10L2 10"></path>
                  <path d="M5 14 2 12l10-2L9.5 2l.5 6"></path>
                </svg>
                Премиум
              </div>
              <div v-else class="badge badge-free">Бесплатно</div>
            </div>

            <div class="course-card-content">
              <div class="course-card-meta">
                <div class="course-card-category">{{ course.category }}</div>
              </div>
              <h3 class="course-card-title">{{ course.title }}</h3>
              <p class="course-card-description">{{ course.description }}</p>
              <div class="course-card-stats">
                <div class="course-card-stat">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="course-card-stat-icon"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{ course.duration }}</span>
                </div>
                <div class="course-card-level">{{ course.difficulty || course.level }}</div>
              </div>
              <div class="course-card-provider">
                <p>от</p>
                <p>Aced</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-icon-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="empty-state-icon"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
          <h3 class="empty-state-title">Курсы не найдены</h3>
          <p class="empty-state-description">
            Попробуйте изменить параметры поиска или выбрать другую категорию
          </p>
          <button @click="clearFilters" class="button-reset-filters">
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen && selectedCourse" class="modal-overlay" @click="closeModal">
        <div class="modal-container" @click.stop>
          <button class="modal-close" @click="closeModal">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <div v-if="modalLoading" class="modal-loading-state">
            <div class="spinner"></div>
            <p>Загрузка информации о курсе...</p>
          </div>

          <div v-else class="modal-content">
            <div class="modal-header-section">
              <div class="modal-image-container">
                <img
                  :src="getCourseImage(selectedCourse)"
                  :alt="selectedCourse.title"
                  class="modal-image"
                  @error="handleImageError($event, selectedCourse)"
                />
                <div class="modal-image-overlay"></div>

                <div class="modal-badge-container">
                  <div v-if="selectedCourse.isPremium" class="modal-badge modal-badge-premium">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="m14 6 4 10L2 10"></path>
                      <path d="M5 14 2 12l10-2L9.5 2l.5 6"></path>
                    </svg>
                    Премиум
                  </div>
                  <div v-else class="modal-badge modal-badge-free">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Бесплатно
                  </div>
                </div>

                <div class="modal-meta-overlay">
                  <div class="modal-duration">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {{ selectedCourse.duration }}
                  </div>
                  <div class="modal-provider">
                    <span>от</span>
                    <span>Aced</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-body">
              <section class="modal-course-info">
                <div class="modal-tags">
                  <span class="modal-tag modal-tag-category">{{ selectedCourse.category }}</span>
                  <span class="modal-tag modal-tag-level">{{
                    selectedCourse.difficulty || selectedCourse.level
                  }}</span>
                </div>

                <h2 class="modal-title">{{ selectedCourse.title }}</h2>
                <p class="modal-description">
                  {{ selectedCourse.fullDescription || selectedCourse.description }}
                </p>
              </section>

              <div class="modal-divider"></div>

              <section class="modal-details">
                <div class="modal-details-grid">
                  <div class="modal-section">
                    <h3 class="modal-section-title">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
                        ></path>
                      </svg>
                      Что вы изучите:
                    </h3>
                    <ul class="modal-skills-list">
                      <li
                        v-for="(outcome, index) in getCourseOutcomes(selectedCourse)"
                        :key="index"
                        class="modal-skill-item"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          class="skill-check-icon"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"></path>
                          <path d="M22 4L12 14.01l-3-3"></path>
                        </svg>
                        {{ outcome }}
                      </li>
                    </ul>
                  </div>

                  <div class="modal-section">
                    <h3 class="modal-section-title">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      Программа курса:
                    </h3>
                    <ul class="modal-modules-list">
                      <li
                        v-for="(lesson, index) in getCourseModules(selectedCourse)"
                        :key="index"
                        class="modal-module-item"
                      >
                        <span class="module-number">{{ index + 1 }}.</span>
                        <div class="module-content">
                          <span class="module-text">{{ lesson.title }}</span>
                          <span v-if="lesson.duration" class="module-duration">{{
                            lesson.duration
                          }}</span>
                          <div v-if="lesson.hasImages" class="module-badge">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="9" cy="9" r="2"></circle>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                            </svg>
                            Изображения
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section v-if="selectedCourse.studentsCount || selectedCourse.rating" class="modal-stats">
                <div class="modal-stats-grid">
                  <div v-if="selectedCourse.studentsCount" class="modal-stat-item">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <div>
                      <div class="stat-value">{{ formatNumber(selectedCourse.studentsCount) }}</div>
                      <div class="stat-label">студентов</div>
                    </div>
                  </div>

                  <div v-if="selectedCourse.rating" class="modal-stat-item">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polygon
                        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                      ></polygon>
                    </svg>
                    <div>
                      <div class="stat-value">{{ selectedCourse.rating.toFixed(1) }}</div>
                      <div class="stat-label">рейтинг</div>
                    </div>
                  </div>

                  <div v-if="getCourseImageCount(selectedCourse) > 0" class="modal-stat-item">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="9" cy="9" r="2"></circle>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                    </svg>
                    <div>
                      <div class="stat-value">{{ getCourseImageCount(selectedCourse) }}</div>
                      <div class="stat-label">изображений</div>
                    </div>
                  </div>
                </div>
              </section>

              <footer class="modal-actions">
                <button
                  :class="[
                    'modal-action-button',
                    {
                      premium: selectedCourse.isPremium && !isPremiumUser,
                      accessible: !selectedCourse.isPremium || isPremiumUser,
                    },
                  ]"
                  @click="startCourse(selectedCourse)"
                >
                  <svg
                    v-if="selectedCourse.isPremium && !isPremiumUser"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <svg
                    v-else
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
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
              </footer>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script>
import { getUpdatedCourses, getCourseById } from '@/api.js';
import { mapGetters, mapState } from 'vuex';

export default {
  name: 'CoursesPage',
  components: {
  },
  data() {
    return {
      courses: [],
      availableCategories: [],
      availableLevels: [],
      selectedCourse: null,
      isModalOpen: false,
      searchTerm: '',
      categoryFilter: 'all',
      levelFilter: 'all',
      typeFilter: 'all',
      debounceTimeout: null,
      loading: false,
      modalLoading: false,
      error: null,
      componentKey: 0,
      lastUpdateTime: Date.now(),
      forceUpdateCounter: 0,
      courseImages: {
        'javascript': '/images/course/javascript.jpg',
        'python': '/images/course/python.jpg',
        'react': '/images/course/react.jpg',
        'vue': '/images/course/vue.jpg',
        'node': '/images/course/node.jpg',
        'web-разработка': '/images/course/web-dev.jpg',
        'программирование': '/images/course/programming.jpg',
        'ии и автоматизация': '/images/course/ai.jpg',
        'машинное обучение': '/images/course/machine-learning.jpg',
        'дизайн': '/images/course/design.jpg',
        'графический дизайн': '/images/course/graphic-design.jpg',
        'видеомонтаж': '/images/course/video-editing.jpg',
        'маркетинг': '/images/course/marketing.jpg',
        'мобильная разработка': '/images/course/mobile-dev.jpg',
        'default': '/images/course/default.jpg',
        'premium': '/images/course/premium.jpg'
      },
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
      const userStatus =
        this.currentUser?.subscriptionPlan ||
        localStorage.getItem('userStatus') ||
        localStorage.getItem('plan') ||
        'free';
      return userStatus;
    },
    isPremiumUser() {
      const status = this.currentUserStatus;
      return status === 'pro' || status === 'start';
    },
  },
  watch: {
    user: {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        if (newPlan !== oldPlan) {
          console.log('👤 UpdatedCourses: User plan changed:', oldPlan, '→', newPlan);
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true,
    },
    getUser: {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        if (newPlan !== oldPlan) {
          console.log('👤 UpdatedCourses: GetUser plan changed:', oldPlan, '→', newPlan);
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true,
    },
    currentUserStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log(
            '📊 UpdatedCourses: Current user status computed changed:',
            oldStatus,
            '→',
            newStatus
          );
          this.triggerReactivityUpdate();
        }
      },
      immediate: true,
    },
  },
  async mounted() {
    console.log('📱 UpdatedCourses: Component mounted');
    try {
      this.fetchCourses();
      this.setupEventListeners();
      console.log('✅ UpdatedCourses: Component mounted successfully');
    } catch (error) {
      console.error('❌ UpdatedCourses: Mount error:', error);
    }
  },
  beforeUnmount() {
    console.log('📱 UpdatedCourses: Component unmounting');
    this.cleanup();
  },
  methods: {
    getProcessedImage(imagePath) {
      if (!imagePath) return this.courseImages.default;

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

      // If the path is relative, prepend the base URL.
      if (imagePath.startsWith('/')) {
        return `${baseUrl}${imagePath}`;
      }
      return imagePath; // Return as is if it's already an absolute URL.
    },
    async fetchCourses() {
      this.loading = true;
      this.error = null;
      try {
        console.log('📥 Fetching updated courses...');
        const filters = {
          search: this.searchTerm,
          category: this.categoryFilter !== 'all' ? this.categoryFilter : undefined,
          difficulty: this.levelFilter !== 'all' ? this.levelFilter : undefined,
          type: this.typeFilter !== 'all' ? this.typeFilter : undefined,
        };
        const response = await getUpdatedCourses(filters);
        console.log('📦 Courses response:', response);
        if (response.success) {
          this.courses = this.processCourses(response.courses || []);
          this.availableCategories = response.categories?.map(c => c.name) || [];
          this.availableLevels = ['Начинающий', 'Средний', 'Продвинутый'];
          console.log(`✅ Loaded ${this.courses.length} courses`);
        } else {
          this.error = response.error || 'Не удалось загрузить курсы';
          this.courses = [];
        }
      } catch (e) {
        console.error('❌ Error fetching courses:', e);
        this.error = 'Не удалось загрузить курсы. Пожалуйста, попробуйте позже.';
        this.courses = [];
      } finally {
        this.loading = false;
      }
    },
    processCourses(courses) {
      return courses.map((course) => {
        const processedCourse = {
          ...course,
          id: course._id || course.id,
          _id: course._id || course.id,
          difficulty: course.difficulty || course.level || 'Начинающий',
          level: course.level || course.difficulty || 'Начинающий',
          duration: course.duration || (course.estimatedTime?.hours ? `${course.estimatedTime.hours} часов` : '10 часов'),
          instructor: {
            name: course.instructor?.name || 'Aced Team' ,
            avatar: this.getProcessedImage(course.instructor?.avatar) || this.getProcessedImage('/default-avatar.jpg'),
            bio: course.instructor?.bio || '',
          },
          curriculum: this.processCurriculum(course.curriculum || []),
          hasImages: this.courseHasImages(course),
          imageCount: this.getCourseImageCount(course),
        };
        return processedCourse;
      });
    },
    processCurriculum(curriculum) {
      if (!Array.isArray(curriculum)) return [];
      return curriculum.map((lesson, lessonIndex) => {
        const processedLesson = {
          ...lesson,
          id: lesson._id || lesson.id || `lesson_${lessonIndex}`,
          _id: lesson._id || lesson.id || `lesson_${lessonIndex}`,
          title: lesson.title || `Урок ${lessonIndex + 1}`,
          description: lesson.description || '',
          duration: lesson.duration || '30 мин',
          order: lesson.order || lessonIndex,
          steps: this.processSteps(lesson.steps || [], lessonIndex, lesson),
          hasImages: this.lessonHasImages(lesson),
          imageCount: this.getLessonImageCount(lesson),
        };
        return processedLesson;
      });
    },
    processSteps(steps, lessonIndex, lesson) {
      if (!Array.isArray(steps)) return [];
      return steps.map((step, stepIndex) => {
        const processedStep = {
          ...step,
          id: step.id || `step_${lessonIndex}_${stepIndex}`,
          type: step.type || 'explanation',
          title: step.title || '',
          description: step.description || '',
          content: step.content || '',
          images: this.processStepImages(step.images || [], lessonIndex, stepIndex),
          data: this.processStepData(step, lessonIndex, stepIndex),
          lesson: lesson // Attach the parent lesson for context
        };
        return processedStep;
      });
    },
    processStepData(step, lessonIndex, stepIndex) {
      const baseData = step.data || {};
      switch (step.type) {
        case 'explanation':
        case 'example':
        case 'reading':
          return {
            ...baseData,
            content: baseData.content || step.content || '',
            images: this.processStepImages(baseData.images || step.images || [], lessonIndex, stepIndex),
          };
        case 'image':
          return {
            ...baseData,
            images: this.processStepImages(baseData.images || step.images || [], lessonIndex, stepIndex),
            description: baseData.description || step.description || '',
            caption: baseData.caption || step.caption || '',
          };
        case 'practice':
          return {
            ...baseData,
            instructions: baseData.instructions || step.instructions || step.content || '',
            type: baseData.type || 'guided',
            images: this.processStepImages(baseData.images || step.images || [], lessonIndex, stepIndex),
          };
        case 'quiz':
          return Array.isArray(baseData) ? baseData : step.quizzes || [];
        default:
          return {
            ...baseData,
            content: baseData.content || step.content || '',
            images: this.processStepImages(baseData.images || step.images || [], lessonIndex, stepIndex),
          };
      }
    },
    processStepImages(images, lessonIndex, stepIndex) {
      if (!Array.isArray(images)) return [];
      return images
        .filter((img) => img && (img.url || img.base64))
        .map((img, index) => ({
          id: img.id || `img_${index}`,
          url: this.getProcessedImage(img.url || img.base64) || '',
          caption: img.caption || '',
          alt: img.alt || img.caption || `Изображение ${index + 1}`,
          filename: img.filename || `image_${index}`,
          size: img.size || 0,
          order: img.order || index,
          displayOptions: {
            width: img.displayOptions?.width || 'auto',
            height: img.displayOptions?.height || 'auto',
            alignment: img.displayOptions?.alignment || 'center',
            zoom: img.displayOptions?.zoom || false,
          },
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    getCourseImage(course) {
      if (!course) return this.courseImages.default;
      if (course.thumbnail && course.thumbnail !== '/default-course-thumbnail.jpg') {
        return this.getProcessedImage(course.thumbnail);
      }
      const curriculumImages = this.extractCurriculumImages(course);
      if (curriculumImages.length > 0) {
        return curriculumImages[0].url;
      }
      const safeString = (value) => {
        if (value === null || value === undefined) return '';
        return String(value).toLowerCase().trim();
      };
      const category = safeString(course.category);
      if (category && this.courseImages[category]) {
        return this.courseImages[category];
      }

      // Use 'premium' image if it's a premium course and no other thumbnail is found
      if (course.isPremium) {
        return this.courseImages.premium;
      }
      return this.courseImages.default;
    },
    extractCurriculumImages(course) {
      const images = [];
      if (course.curriculum && Array.isArray(course.curriculum)) {
        course.curriculum.forEach((lesson) => {
          if (lesson.steps && Array.isArray(lesson.steps)) {
            lesson.steps.forEach((step) => {
              if (step.images && Array.isArray(step.images)) {
                step.images.forEach((img) => {
                  if (img.url && !img.url.startsWith('data:')) {
                    images.push({
                      url: this.getProcessedImage(img.url),
                      caption: img.caption
                    });
                  }
                });
              }
            });
          }
        });
      }
      return images;
    },
    courseHasImages(course) {
      if (!course.curriculum) return false;
      return course.curriculum.some((lesson) =>
        lesson.steps && lesson.steps.some((step) => step.images && step.images.length > 0)
      );
    },
    getCourseImageCount(course) {
      if (!course.curriculum) return 0;
      let count = 0;
      course.curriculum.forEach((lesson) => {
        if (lesson.steps) {
          lesson.steps.forEach((step) => {
            if (step.images) {
              count += step.images.length;
            }
          });
        }
      });
      return count;
    },
    getCourseOutcomes(course) {
      if (course.learningOutcomes && course.learningOutcomes.length > 0) {
        return course.learningOutcomes;
      }
      const outcomes = [];
      if (course.curriculum && course.curriculum.length > 0) {
        outcomes.push(`Изучите ${course.curriculum.length} практических уроков`);
        const hasImages = this.courseHasImages(course);
        if (hasImages) {
          outcomes.push('Работайте с визуальными материалами и примерами');
        }
        const hasQuizzes = course.curriculum.some((lesson) =>
          lesson.steps && lesson.steps.some((step) => step.type === 'quiz')
        );
        if (hasQuizzes) {
          outcomes.push('Проверьте знания с помощью интерактивных тестов');
        }
        const hasPractice = course.curriculum.some((lesson) =>
          lesson.steps && lesson.steps.some((step) => step.type === 'practice')
        );
        if (hasPractice) {
          outcomes.push('Применяйте знания на практических заданиях');
        }
      }
      const categoryOutcomes = {
        'ИИ и автоматизация': ['Основы искусственного интеллекта', 'Методы машинного обучения', 'Практические применения ИИ'],
        'Видеомонтаж': ['Основы видеомонтажа', 'Работа с профессиональными инструментами', 'Создание качественного видеоконтента'],
        'Графический дизайн': ['Принципы графического дизайна', 'Работа с цветом и композицией', 'Создание профессиональных макетов'],
      };
      const categorySpecific = categoryOutcomes[course.category];
      if (categorySpecific) {
        outcomes.push(...categorySpecific);
      }
      return outcomes.length > 0 ? outcomes : ['Получите практические навыки', 'Изучите современные методы', 'Применяйте знания на практике'];
    },
    getCourseModules(course) {
      if (!course.curriculum || course.curriculum.length === 0) {
        return [
          { title: 'Введение в курс', duration: '30 мин', hasImages: false },
          { title: 'Основные концепции', duration: '45 мин', hasImages: false },
          { title: 'Практические примеры', duration: '60 мин', hasImages: false },
        ];
      }
      return course.curriculum.map((lesson) => ({
        title: lesson.title,
        duration: lesson.duration,
        hasImages: this.lessonHasImages(lesson),
        imageCount: this.getLessonImageCount(lesson),
      }));
    },
    formatNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    },
    handleImageError(event, course) {
      console.warn('Image failed to load for course:', course?.title || 'Unknown');
      event.target.src = this.getProcessedImage(this.courseImages.default);
      event.target.onerror = null;
    },
    debounceSearch() {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(this.fetchCourses, 500);
    },
    applyFilters() {
      this.fetchCourses();
    },
    setTypeFilter(type) {
      this.typeFilter = type;
      this.fetchCourses();
    },
    clearFilters() {
      this.searchTerm = '';
      this.categoryFilter = 'all';
      this.levelFilter = 'all';
      this.typeFilter = 'all';
      this.fetchCourses();
    },
    async openModal(course) {
      this.selectedCourse = null;
      this.isModalOpen = true;
      this.modalLoading = true;
      try {
        console.log('📖 Opening course modal:', course.title);
        const response = await getCourseById(course._id || course.id);
        if (response.success) {
          this.selectedCourse = this.processCourses([response.data.course])[0];
          console.log('✅ Course details loaded:', this.selectedCourse);
        } else {
          console.error('Failed to fetch detailed course info:', response.error);
          this.selectedCourse = this.processCourses([course])[0];
        }
      } catch (e) {
        console.error('API error while fetching course details:', e);
        this.selectedCourse = this.processCourses([course])[0];
      } finally {
        this.modalLoading = false;
      }
    },
    startCourse(course) {
      // This method now navigates to the new route
      console.log('🚀 Starting course:', course.title);
      console.log('Course isPremium:', course.isPremium);
      console.log('User status:', this.currentUserStatus);
      console.log('User isPremium:', this.isPremiumUser);
      if (course.isPremium && !this.isPremiumUser) {
        console.log('❌ Course is premium and user lacks access');
        if (this.$toast) {
          this.$toast.error(`Этот курс доступен только по подписке. Ваш статус: ${this.currentUserStatus}`, {
            duration: 4000,
          });
        } else {
          alert(`Этот курс доступен только по подписке Start/Pro. Ваш текущий статус: ${this.currentUserStatus}`);
        }
        return;
      }
      console.log('✅ Access granted - starting course');
      // Use Vue Router to navigate to the new page
      this.$router.push({ name: 'LessonPlayer', params: { courseId: course.id } });
    },
    closeModal() {
      this.isModalOpen = false;
      this.selectedCourse = null;
    },
    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;
      console.log(`👤 UpdatedCourses: Handling status change ${oldStatus} → ${newStatus}`);
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('plan', newStatus);
      this.triggerReactivityUpdate();
      if (newStatus && newStatus !== 'free' && oldStatus === 'free') {
        const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
        if (this.$toast) {
          this.$toast.success(`🎉 ${planLabel} подписка активирована!`, { duration: 5000 });
        }
      }
      console.log(`✅ UpdatedCourses: Status change handled: ${oldStatus} → ${newStatus}`);
    },
    triggerReactivityUpdate() {
      this.componentKey++;
      this.forceUpdateCounter++;
      this.lastUpdateTime = Date.now();
      this.$forceUpdate();
      this.$nextTick(() => {
        this.$forceUpdate();
      });
      console.log('🔄 UpdatedCourses: Reactivity update triggered:', {
        componentKey: this.componentKey,
        userStatus: this.currentUserStatus,
        timestamp: this.lastUpdateTime,
      });
    },
    setupEventListeners() {
      console.log('🔧 UpdatedCourses: Setting up event listeners');
      if (typeof window !== 'undefined') {
        this.handleSubscriptionChange = (event) => {
          console.log('📡 UpdatedCourses: Subscription change received:', event.detail);
          const { plan, oldPlan } = event.detail;
          this.handleUserStatusChange(plan, oldPlan);
        };
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.handleStorageChange = (event) => {
          if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
            console.log('📡 UpdatedCourses: localStorage userStatus changed:', event.oldValue, '→', event.newValue);
            this.handleUserStatusChange(event.newValue, event.oldValue);
          }
        };
        window.addEventListener('storage', this.handleStorageChange);
      }
      if (typeof window !== 'undefined' && window.eventBus) {
        this.handleUserStatusEvent = (data) => {
          console.log('📡 UpdatedCourses: User status event received:', data);
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };
        this.handlePromocodeEvent = (data) => {
          console.log('📡 UpdatedCourses: Promocode applied event:', data);
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };
        this.handleForceUpdateEvent = () => {
          console.log('📡 UpdatedCourses: Force update event received');
          this.triggerReactivityUpdate();
        };
        window.eventBus.on('userStatusChanged', this.handleUserStatusEvent);
        window.eventBus.on('promocodeApplied', this.handlePromocodeEvent);
        window.eventBus.on('forceUpdate', this.handleForceUpdateEvent);
        window.eventBus.on('globalForceUpdate', this.handleForceUpdateEvent);
        window.eventBus.on('subscriptionUpdated', this.handleUserStatusEvent);
        window.eventBus.on('paymentCompleted', this.handleUserStatusEvent);
        console.log('✅ UpdatedCourses: Event bus listeners registered');
      }
      if (this.$store) {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          if (this.isUserRelatedMutation(mutation)) {
            console.log('📊 UpdatedCourses: Store mutation detected:', mutation.type);
            this.triggerReactivityUpdate();
          }
        });
      }
      console.log('✅ UpdatedCourses: Event listeners setup complete');
    },
    isUserRelatedMutation(mutation) {
      const userMutations = [
        'setUser',
        'SET_USER',
        'updateUser',
        'UPDATE_USER',
        'user/SET_USER_STATUS',
        'user/UPDATE_SUBSCRIPTION',
        'user/FORCE_UPDATE',
      ];
      return (
        userMutations.some((type) => mutation.type.includes(type)) ||
        mutation.type.includes('user/') ||
        mutation.type.toLowerCase().includes('status') ||
        mutation.type.toLowerCase().includes('subscription')
      );
    },
    cleanup() {
      console.log('🧹 UpdatedCourses: Performing cleanup...');
      if (typeof window !== 'undefined') {
        if (this.handleSubscriptionChange) {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        }
        if (this.handleStorageChange) {
          window.removeEventListener('storage', this.handleStorageChange);
        }
      }
      if (typeof window !== 'undefined' && window.eventBus) {
        if (this.handleUserStatusEvent) {
          window.eventBus.off('userStatusChanged', this.handleUserStatusEvent);
          window.eventBus.off('subscriptionUpdated', this.handleUserStatusEvent);
          window.eventBus.off('paymentCompleted', this.handleUserStatusEvent);
        }
        if (this.handlePromocodeEvent) {
          window.eventBus.off('promocodeApplied', this.handlePromocodeEvent);
        }
        if (this.handleForceUpdateEvent) {
          window.eventBus.off('forceUpdate', this.handleForceUpdateEvent);
          window.eventBus.off('globalForceUpdate', this.handleForceUpdateEvent);
        }
      }
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
      console.log('✅ UpdatedCourses: Cleanup completed');
    },
  },
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

.dark {
  --color-background: #111827;
  --color-foreground: #f9fafb;
  --color-card: #1f2937;
  --color-card-foreground: #f9fafb;
  --color-muted: #374151;
  --color-muted-foreground: #9ca3af;
  --color-accent: #374151;
  --color-accent-foreground: #f9fafb;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-input-background: #1f2937;
  --color-ring: #555;
  --color-brand: #9b8fd9;
  --color-brand-light: #b5a9e4;
  --color-brand-dark: #7b6bbf;
  --color-brand-foreground: #ffffff;
  --color-success: #22c55e;
  --color-green-100: #14532d;
  --color-green-800: #d1fae5;
  --brand-purple: #A78BFA;
  --brand-purple-dark: #8B5CF6;
  --brand-purple-light: #C4B5FD;
  --brand-purple-muted: rgba(167, 139, 250, 0.1);
}

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
}
@media (min-width: 768px) {
  .header-title {
    font-size: 3.75rem;
  }
}

.header-subtitle {
  font-size: 1.25rem;
  color: #d1d5db;
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

/* Filters */
.filter-bar {
  background-color: var(--color-card);
  border-radius: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (min-width: 1024px) {
  .filter-bar {
    flex-direction: row;
    align-items: center;
  }
}

.filter-group-search {
  position: relative;
  flex: 1;
}
@media (min-width: 1024px) {
  .filter-group-search {
    flex: 1.5;
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
  gap: 0.5rem;
}

.button-filter {
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background-color: var(--color-background);
  color: var(--color-foreground);
  transition: all 0.2s ease-in-out;
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
  gap: 20px;
}

@media (min-width: 768px) {
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }
}

@media (min-width: 1024px) {
  .courses-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

/* Course Card */
.course-card {
  cursor: pointer;
  background-color: var(--color-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1);
  border-color: rgba(139, 127, 191, 0.3);
}

.course-card-image-wrapper {
  position: relative;
  padding: 16px 16px 0;
}

.course-card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
}

.badge {
  position: absolute;
  top: 24px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
}

.badge-premium {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: none;
}

.badge-free {
  background-color: var(--color-green-100);
  color: var(--color-green-800);
  border: none;
}

.badge-icon {
  width: 10px;
  height: 10px;
  margin-right: 4px;
}

.course-card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.course-card-meta {
  display: flex;
  justify-content: flex-start;
}

.course-card-category {
  display: inline-flex;
  align-items: center;
  border-radius: 16px;
  border: 1px solid rgba(139, 127, 191, 0.3);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-brand);
}

.course-card-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
  transition: color 0.2s ease;
}

.course-card:hover .course-card-title {
  color: var(--color-brand);
}

.course-card-description {
  font-size: 14px;
  color: var(--color-muted-foreground);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  flex: 1;
}

.course-card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--color-muted-foreground);
  margin-top: auto;
}

.course-card-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-card-stat-icon {
  width: 14px;
  height: 14px;
}

.course-card-level {
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  border: 1px solid rgba(139, 127, 191, 0.2);
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-brand);
}

.course-card-provider {
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  text-align: center;
  margin-top: auto;
}

.course-card-provider p {
  margin: 0;
  line-height: 1.2;
}

.course-card-provider p:first-child {
  font-size: 12px;
  color: var(--color-muted-foreground);
  margin-bottom: 2px;
}

.course-card-provider p:last-child {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-brand);
}

/* Empty State */
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
  margin-bottom: 0.5rem;
}

.empty-state-description {
  color: var(--color-muted-foreground);
  margin-bottom: 1rem;
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

/* Loading Spinner */
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* ✅ ENHANCED MODAL STYLES WITH IMAGE SUPPORT */
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
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 1100px;
  max-height: 90vh;
  background-color: var(--color-background);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  color: #374151;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-close:hover {
  background-color: white;
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
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
  max-height: 90vh;
  overflow: hidden;
}

.modal-header-section {
  position: relative;
  height: 280px;
  overflow: hidden;
  flex-shrink: 0;
}

.modal-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.2), transparent);
}

.modal-badge-container {
  position: absolute;
  top: 16px;
  left: 16px;
}

.modal-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-badge-premium {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  color: white;
  box-shadow: 0 3px 12px rgba(139, 127, 191, 0.3);
}

.modal-badge-free {
  background: linear-gradient(135deg, var(--color-success), #22c55e);
  color: white;
  box-shadow: 0 3px 12px rgba(34, 197, 94, 0.3);
}

.modal-meta-overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: end;
  color: white;
}

.modal-duration {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-provider {
  text-align: right;
  font-size: 13px;
}

.modal-provider span:first-child {
  display: block;
  opacity: 0.8;
  font-size: 11px;
  margin-bottom: 2px;
}

.modal-provider span:last-child {
  display: block;
  font-weight: 700;
  font-size: 15px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.modal-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
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

.modal-tag-level {
  background: rgba(139, 127, 191, 0.05);
  color: var(--color-brand);
  border-color: rgba(139, 127, 191, 0.2);
}

.modal-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 16px 0;
  color: var(--color-foreground);
}

.modal-description {
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-muted-foreground);
  margin: 0;
}

.modal-divider {
  height: 1px;
  background: var(--color-border);
  border: none;
  margin: 0;
}

.modal-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

@media (max-width: 768px) {
  .modal-details-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.modal-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;
}

.modal-skills-list {
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
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-foreground);
}

.skill-check-icon {
  color: var(--color-success);
  flex-shrink: 0;
  margin-top: 1px;
  width: 14px;
  height: 14px;
}

.modal-modules-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-module-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.module-number {
  color: var(--color-brand);
  font-weight: 600;
  flex-shrink: 0;
  min-width: 20px;
}

.module-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-text {
  color: var(--color-foreground);
  font-weight: 500;
}

.module-duration {
  color: var(--color-muted-foreground);
  font-size: 12px;
}

/* ✅ NEW: Module badge for lessons with images */
.module-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  background: rgba(139, 127, 191, 0.1);
  color: var(--color-brand);
  font-size: 10px;
  font-weight: 500;
  width: fit-content;
}

/* ✅ NEW: Course statistics section */
.modal-stats {
  padding: 20px;
  background: var(--color-muted);
  border-radius: 12px;
  margin-top: -16px;
}

.modal-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.modal-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.modal-stat-item svg {
  color: var(--color-brand);
  flex-shrink: 0;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-foreground);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--color-muted-foreground);
  line-height: 1;
}

.modal-actions {
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
  flex-shrink: 0;
}

.modal-action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  box-shadow: 0 3px 12px rgba(139, 127, 191, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.modal-action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(139, 127, 191, 0.4);
}

.modal-action-button.premium {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  box-shadow: 0 3px 12px rgba(245, 158, 11, 0.3);
}

.modal-action-button.premium:hover {
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.modal-action-description {
  text-align: center;
  font-size: 13px;
  color: var(--color-muted-foreground);
  margin: 0;
  line-height: 1.3;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-container {
    margin: 0.5rem;
    max-height: 95vh;
    max-width: none;
  }

  .modal-header-section {
    height: 200px;
  }

  .modal-body {
    padding: 20px;
    gap: 20px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-details-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .modal-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-header-section {
    height: 160px;
  }

  .modal-body {
    padding: 16px;
    gap: 16px;
  }

  .modal-title {
    font-size: 18px;
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .modal-stats {
    padding: 16px;
  }

  .modal-stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .modal-stat-item {
    padding: 8px;
  }

  .stat-value {
    font-size: 16px;
  }
}
</style>