<template>
  <div class="study-page" v-if="showStudyInterface" :key="`study-${componentKey}`">
    <header class="study-header">
      <div class="study-header-content">
        <button @click="goBackToCourses" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span>Назад к курсам</span>
        </button>

        <span class="subscription-badge" :class="subscriptionClass">
          {{ subscriptionText }}
        </span>

        <div class="course-info">
          <h1 class="course-title">{{ selectedCourse?.title || 'Загрузка...' }}</h1>
          <div class="course-meta">
            <span class="course-category">{{ selectedCourse?.category }}</span>
            <span class="course-level">{{ selectedCourse?.level }}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-info">
            <span class="progress-text">Прогресс: {{ completedLessons }}/{{ totalLessons }}</span>
            <span class="progress-percent">{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </header>

    <div class="study-main">
      <aside class="study-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
        <div class="sidebar-header">
          <h3>Содержание курса</h3>
          <button @click="toggleSidebar" class="sidebar-toggle mobile-only">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div class="lessons-list">
          <div
            v-for="(lesson, index) in lessons"
            :key="lesson.id"
            :class="['lesson-item', {
              'active': currentLessonIndex === index,
              'completed': lesson.completed,
              'locked': lesson.locked
            }]"
            @click="selectLesson(index)"
          >
            <div class="lesson-number">{{ index + 1 }}</div>
            <div class="lesson-content">
              <h4 class="lesson-title">{{ lesson.title }}</h4>
              <p class="lesson-duration">{{ lesson.duration }}</p>
            </div>
            <div class="lesson-status">
              <svg v-if="lesson.completed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"/>
                <path d="M22 4L12 14.01l-3-3"/>
              </svg>
              <svg v-else-if="lesson.locked" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
        </div>
      </aside>

      <main class="study-content">
        <button @click="toggleSidebar" class="sidebar-toggle desktop-hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span>Содержание</span>
        </button>

        <div v-if="currentLesson" class="lesson-container">
          <div class="lesson-header">
            <div class="lesson-meta">
              <span class="lesson-number-badge">Урок {{ currentLessonIndex + 1 }}</span>
              <span class="lesson-duration-badge">{{ currentLesson.duration }}</span>
            </div>
            <h2 class="lesson-title">{{ currentLesson.title }}</h2>
            <p class="lesson-description">{{ currentLesson.description }}</p>
          </div>

          <div class="lesson-content-area">
            <div class="text-content">
              <div class="content-section" v-html="currentLesson.content"></div>

              <div v-if="currentLesson.resources && currentLesson.resources.length" class="resources-section">
                <h3>Материалы урока</h3>
                <div class="resources-list">
                  <a
                    v-for="resource in currentLesson.resources"
                    :key="resource.id"
                    :href="resource.url"
                    download
                    class="resource-item"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>{{ resource.name }}</span>
                    <span class="resource-size">{{ resource.size }}</span>
                  </a>
                </div>
              </div>

              <div v-if="currentLesson.quiz" class="quiz-section">
                <h3>Проверьте себя</h3>
                <div class="quiz-container">
                  <div v-if="!quizCompleted" class="quiz-questions">
                    <div class="question-item">
                      <h4>{{ currentLesson.quiz.question }}</h4>
                      <div class="quiz-options">
                        <label
                          v-for="(option, index) in currentLesson.quiz.options"
                          :key="index"
                          class="quiz-option"
                        >
                          <input
                            type="radio"
                            :name="'quiz-' + currentLesson.id"
                            :value="index"
                            v-model="selectedAnswer"
                          />
                          <span>{{ option }}</span>
                        </label>
                      </div>
                      <button
                        @click="submitQuiz"
                        :disabled="selectedAnswer === null"
                        class="quiz-submit-btn"
                      >
                        Проверить ответ
                      </button>
                    </div>
                  </div>
                  <div v-else class="quiz-result">
                    <div :class="['quiz-feedback', quizCorrect ? 'correct' : 'incorrect']">
                      <svg v-if="quizCorrect" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"/>
                        <path d="M22 4L12 14.01l-3-3"/>
                      </svg>
                      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <span v-if="quizCorrect">Правильно! Отличная работа!</span>
                      <span v-else>Неправильно. Попробуйте еще раз!</span>
                    </div>
                    <button v-if="!quizCorrect" @click="quizCompleted = false" class="retry-quiz-btn">
                      Попробовать снова
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="lesson-navigation">
              <button
                @click="previousLesson"
                :disabled="currentLessonIndex === 0"
                class="nav-btn prev-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Предыдущий урок
              </button>

              <button
                v-if="!currentLesson.completed && (!currentLesson.quiz || (currentLesson.quiz && quizCorrect))"
                @click="markLessonCompleted"
                class="complete-btn"
              >
                Завершить урок
              </button>

              <button
                @click="nextLesson"
                :disabled="currentLessonIndex === lessons.length - 1 || lessons[currentLessonIndex + 1]?.locked"
                class="nav-btn next-btn"
              >
                Следующий урок
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>

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
    </div>

    <div class="content-wrapper">
      <div class="container">
        <div class="filter-bar">
          <div class="filter-group-search">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input v-model="searchTerm" @input="debounceSearch" placeholder="Поиск курсов..." class="input-search" />
          </div>

          <div class="filter-group-select">
            <select v-model="categoryFilter" @change="applyFilters" class="select-field">
              <option value="all">Все категории</option>
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
              <option value="all">Все уровни</option>
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
              Все
            </button>
            <button :class="['button-filter', { active: typeFilter === 'free' }]" @click="setTypeFilter('free')">
              Бесплатные
            </button>
            <button :class="['button-filter', { active: typeFilter === 'premium' }]" @click="setTypeFilter('premium')">
              Премиум
            </button>
          </div>
        </div>

        <div class="results-info">
          <div class="results-count">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="results-icon">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state-icon">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
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
          <div v-for="course in courses" :key="course.id" class="course-card" @click="openModal(course)">
            <div class="course-card-image-wrapper">
              <img 
                :src="getCourseImage(course)" 
                :alt="course.title" 
                class="course-card-image"
                @error="handleImageError($event, course)"
              />
              <div v-if="course.isPremium" class="badge badge-premium">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="badge-icon">
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="course-card-stat-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{ course.duration }}</span>
                </div>
                <div class="course-card-level">{{ course.level }}</div>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state-icon">
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

    <div v-if="isModalOpen && selectedCourse" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <button class="modal-close" @click="closeModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m14 6 4 10L2 10"></path>
                    <path d="M5 14 2 12l10-2L9.5 2l.5 6"></path>
                  </svg>
                  Премиум
                </div>
                <div v-else class="modal-badge modal-badge-free">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Бесплатно
                </div>
              </div>

              <div class="modal-meta-overlay">
                <div class="modal-duration">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <div class="modal-course-info">
              <div class="modal-tags">
                <span class="modal-tag modal-tag-category">{{ selectedCourse.category }}</span>
                <span class="modal-tag modal-tag-level">{{ selectedCourse.level }}</span>
              </div>

              <h2 class="modal-title">{{ selectedCourse.title }}</h2>
              <p class="modal-description">{{ selectedCourse.fullDescription }}</p>
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
                    <li v-for="(skill, index) in selectedCourse.skills" :key="index" class="modal-skill-item">
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
                    <li v-for="(module, index) in selectedCourse.modules" :key="index" class="modal-module-item">
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
  </div>
</template>

<script>
import { getUpdatedCourses, getCourseById } from '@/api.js';
import { checkSubscriptionAccess } from '@/router/index.js';
import { mapGetters, mapState } from 'vuex';

export default {
  name: 'CoursesPage',
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
      showStudyInterface: false,
      lessons: [],
      currentLessonIndex: 0,
      currentLesson: null,
      sidebarOpen: false,
      selectedAnswer: null,
      quizCompleted: false,
      quizCorrect: false,
      
      // ✅ ENHANCED: Add comprehensive reactivity tracking
      componentKey: 0,
      lastUpdateTime: Date.now(),
      forceUpdateCounter: 0,

      // ✅ HARDCODED IMAGES MAP
      courseImages: {
        // Programming & Development
        'javascript': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
        'python': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop',
        'react': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
        'vue': 'https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=250&fit=crop',
        'node': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
        'web development': 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=250&fit=crop',
        'programming': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
        'coding': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
        'software development': 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=400&h=250&fit=crop',
        
        // AI & Machine Learning
        'artificial intelligence': 'https://images.unsplash.com/photo-1555255707-c079660887b?w=400&h=250&fit=crop',
        'machine learning': 'https://images.unsplash.com/photo-1555255707-c079660887b?w=400&h=250&fit=crop',
        'ai': 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=250&fit=crop',
        'data science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
        'neural networks': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
        
        // Design
        'design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
        'ui design': 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=250&fit=crop',
        'ux design': 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=250&fit=crop',
        'graphic design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop',
        'web design': 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=250&fit=crop',
        
        // Business & Marketing
        'marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
        'digital marketing': 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400&h=250&fit=crop',
        'business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
        'entrepreneurship': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=250&fit=crop',
        'finance': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=250&fit=crop',
        
        // Languages
        'english': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
        'language learning': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop',
        'languages': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop',
        
        // Blockchain & Crypto
        'blockchain': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
        'cryptocurrency': 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=250&fit=crop',
        'bitcoin': 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=250&fit=crop',
        'crypto': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=250&fit=crop',
        
        // Default fallback images by category
        'технологии': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=250&fit=crop',
        'образование': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop',
        'наука': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop',
        'искусство': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=250&fit=crop',
        'музыка': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop',
        'спорт': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
        'здоровье': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop',
        'кулинария': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop',
        
        // Generic fallbacks
        'default': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=250&fit=crop',
        'course': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=250&fit=crop',
        'learning': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
        'education': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop',
        'study': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop'
      }
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
      const userStatus = this.currentUser?.subscriptionPlan || 
                        localStorage.getItem('userStatus') || 
                        localStorage.getItem('plan') || 
                        'free';
      return userStatus;
    },

    isPremiumUser() {
      const status = this.currentUserStatus;
      return status === 'pro' || status === 'start';
    },

    subscriptionClass() {
      const status = this.currentUserStatus;
      if (status === 'pro') return 'badge-pro';
      if (status === 'start') return 'badge-start';
      return 'badge-free';
    },

    subscriptionText() {
      const status = this.currentUserStatus;
      switch (status) {
        case 'pro': return 'Pro подписка';
        case 'start': return 'Start подписка';
        default: return 'Бесплатный доступ';
      }
    },

    completedLessons() {
      return this.lessons.filter(lesson => lesson.completed).length;
    },
    
    totalLessons() {
      return this.lessons.length;
    },
    
    progressPercent() {
      if (this.totalLessons === 0) return 0;
      return Math.round((this.completedLessons / this.totalLessons) * 100);
    }
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
      immediate: true
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
      immediate: true
    },

    currentUserStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log('📊 UpdatedCourses: Current user status computed changed:', oldStatus, '→', newStatus);
          this.triggerReactivityUpdate();
        }
      },
      immediate: true
    }
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
    async fetchCourses() {
      this.loading = true;
      this.error = null;
      try {
        const filters = {
          search: this.searchTerm,
          category: this.categoryFilter,
          difficulty: this.levelFilter,
          type: this.typeFilter,
        };

        const response = await getUpdatedCourses(filters);
        if (response.success) {
          this.courses = response.courses || [];
          this.availableCategories = response.categories || [];
          this.availableLevels = response.difficulties || [];
        } else {
          this.error = response.error;
          this.courses = [];
        }
      } catch (e) {
        this.error = 'Не удалось загрузить курсы. Пожалуйста, попробуйте позже.';
      } finally {
        this.loading = false;
      }
    },

    getCourseImage(course) {
      if (!course) return this.courseImages.default;

      const safeString = (value) => {
        if (value === null || value === undefined) return '';
        return String(value).toLowerCase().trim();
      };

      const title = safeString(course.title);
      const category = safeString(course.category);
      const description = safeString(course.description);

      const titleKeywords = [
        'javascript', 'python', 'react', 'vue', 'node', 'ai', 'machine learning',
        'design', 'marketing', 'blockchain', 'crypto', 'english', 'business'
      ];

      for (const keyword of titleKeywords) {
        if (title.includes(keyword) && this.courseImages[keyword]) {
          return this.courseImages[keyword];
        }
      }

      if (category && this.courseImages[category]) {
        return this.courseImages[category];
      }

      const categoryKeywords = Object.keys(this.courseImages);
      for (const keyword of categoryKeywords) {
        if (category.includes(keyword) && this.courseImages[keyword]) {
          return this.courseImages[keyword];
        }
      }

      const contentKeywords = [
        'programming', 'coding', 'development', 'design', 'marketing', 
        'business', 'ai', 'blockchain', 'language'
      ];

      for (const keyword of contentKeywords) {
        if ((title.includes(keyword) || description.includes(keyword)) && this.courseImages[keyword]) {
          return this.courseImages[keyword];
        }
      }

      if (course.isPremium) {
        return this.courseImages.course;
      }

      return this.courseImages.default;
    },

    handleImageError(event, course) {
      console.warn('Image failed to load for course:', course?.title || 'Unknown');
      event.target.src = this.courseImages.default;
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
        const response = await getCourseById(course._id);
        if (response.success) {
          this.selectedCourse = response.data;
        } else {
          console.error('Failed to fetch detailed course info:', response.error);
          this.selectedCourse = course;
        }
      } catch (e) {
        console.error('API error while fetching course details:', e);
        this.selectedCourse = course;
      } finally {
        this.modalLoading = false;
      }
    },

    startCourse(course) {
      console.log('🚀 Starting course:', course.title);
      console.log('Course isPremium:', course.isPremium);
      console.log('User status:', this.currentUserStatus);
      console.log('User isPremium:', this.isPremiumUser);
      
      if (course.isPremium && !this.isPremiumUser) {
        console.log('❌ Course is premium and user lacks access');
        
        if (this.$toast) {
          this.$toast.error(`Этот курс доступен только по подписке. Ваш статус: ${this.currentUserStatus}`, { 
            duration: 4000 
          });
        } else {
          alert(`Этот курс доступен только по подписке Start/Pro. Ваш текущий статус: ${this.currentUserStatus}`);
        }
        return;
      }
      
      console.log('✅ Access granted - starting course');
      this.selectedCourse = course;
      this.isModalOpen = false;
      this.showStudyInterface = true;
      this.initializeStudyData();
    },

    initializeStudyData() {
      this.currentLessonIndex = 0;
      this.lessons = this.selectedCourse.lessons || this.generateSampleLessons();
      this.currentLesson = this.lessons[0];
      this.sidebarOpen = false;
      this.selectedAnswer = null;
      this.quizCompleted = false;
      this.quizCorrect = false;
    },

    generateSampleLessons() {
      return [
        {
          id: 1,
          title: "Введение в курс",
          description: "Обзор курса и что вы изучите",
          duration: "15 мин",
          completed: false,
          locked: false,
          content: `
            <h3>Добро пожаловать в курс!</h3>
            <p>В этом курсе вы изучите основы современных технологий и получите практические навыки, которые помогут вам в карьере.</p>
            <h4>Что вас ждет:</h4>
            <ul>
              <li>Теоретические основы</li>
              <li>Практические задания</li>
              <li>Реальные проекты</li>
              <li>Сертификат о прохождении</li>
            </ul>
            <p>Желаем успехов в обучении!</p>
          `,
          resources: [],
          quiz: {
            question: "Что является основной целью данного курса?",
            options: [
              "Изучение теории без практики",
              "Получение практических навыков для карьеры",
              "Просто потратить время",
              "Получить сертификат любой ценой"
            ],
            correctAnswer: 1
          }
        },
        {
          id: 2,
          title: "Основные концепции",
          description: "Изучаем ключевые понятия и термины",
          duration: "25 мин",
          completed: false,
          locked: true,
          content: `
            <h3>Основные концепции</h3>
            <p>В этом уроке мы рассмотрим ключевые понятия, которые будут использоваться на протяжении всего курса.</p>
          `,
          resources: [
            { id: 1, name: "Конспект урока.pdf", size: "2.3 MB", url: "#" },
            { id: 2, name: "Дополнительные материалы.zip", size: "5.1 MB", url: "#" }
          ],
          quiz: {
            question: "Что такое API?",
            options: [
              "Язык программирования",
              "Интерфейс для взаимодействия программ",
              "Библиотека для графики",
              "База данных"
            ],
            correctAnswer: 1
          }
        },
        {
          id: 3,
          title: "Практическое задание",
          description: "Применяем полученные знания на практике",
          duration: "40 мин",
          completed: false,
          locked: true,
          content: `
            <h3>Практическое задание</h3>
            <p>Теперь пришло время применить полученные знания на практике.</p>
          `
        }
      ];
    },

    goBackToCourses() {
      this.showStudyInterface = false;
      this.selectedCourse = null;
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    selectLesson(index) {
      if (this.lessons[index].locked) return;
      this.currentLessonIndex = index;
      this.currentLesson = this.lessons[index];
      this.selectedAnswer = null;
      this.quizCompleted = false;
      this.quizCorrect = false;
      if (window.innerWidth < 1024) {
        this.sidebarOpen = false;
      }
    },

    markLessonCompleted() {
      this.lessons[this.currentLessonIndex].completed = true;
      if (this.currentLessonIndex + 1 < this.lessons.length) {
        this.lessons[this.currentLessonIndex + 1].locked = false;
      }
    },

    submitQuiz() {
      const currentQuiz = this.currentLesson.quiz;
      this.quizCorrect = this.selectedAnswer === currentQuiz.correctAnswer;
      this.quizCompleted = true;

      if (this.quizCorrect) {
        this.markLessonCompleted();
      }
    },

    nextLesson() {
      if (this.currentLessonIndex + 1 < this.lessons.length) {
        this.selectLesson(this.currentLessonIndex + 1);
      }
    },

    previousLesson() {
      if (this.currentLessonIndex > 0) {
        this.selectLesson(this.currentLessonIndex - 1);
      }
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
        timestamp: this.lastUpdateTime
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
        'user/FORCE_UPDATE'
      ];
      
      return userMutations.some(type => mutation.type.includes(type)) ||
             mutation.type.includes('user/') ||
             mutation.type.toLowerCase().includes('status') ||
             mutation.type.toLowerCase().includes('subscription');
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

    addCourseImage(keyword, imageUrl) {
      this.courseImages[keyword.toLowerCase()] = imageUrl;
      console.log(`Added new course image for keyword: ${keyword}`);
    },

    getAvailableImageKeywords() {
      return Object.keys(this.courseImages).sort();
    },

    findBestImageMatch(course) {
      const image = this.getCourseImage(course);
      const keyword = Object.keys(this.courseImages).find(key => 
        this.courseImages[key] === image
      );
      
      return {
        imageUrl: image,
        matchedKeyword: keyword,
        courseTitle: course.title,
        courseCategory: course.category
      };
    }
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

/* SUBSCRIPTION STATUS BADGE STYLES */
.subscription-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.subscription-badge.badge-free {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.subscription-badge.badge-start {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.subscription-badge.badge-pro {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* MODAL STYLES */
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
  from { opacity: 0; }
  to { opacity: 1; }
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
  height: 280px; /* Increased height */
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
  padding: 32px; /* Increased padding */
  display: flex;
  flex-direction: column;
  gap: 32px; /* Increased gap */
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
  font-size: 28px; /* Larger title */
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 16px 0;
  color: var(--color-foreground);
}

.modal-description {
  font-size: 16px; /* Larger description */
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
  grid-template-columns: 1fr 1fr; /* Always 2 columns on desktop */
  gap: 40px; /* Increased gap */
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

.module-text {
  color: var(--color-muted-foreground);
  flex: 1;
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

/* STUDY INTERFACE STYLES */
.study-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8fafc;
  color: var(--color-foreground);
}

.study-header {
  background: linear-gradient(135deg, #ffffff, #f1f5f9);
  border-bottom: 2px solid #e2e8f0;
  padding: 1.5rem 0;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.study-header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 2rem;
  align-items: center;
}

@media (max-width: 768px) {
  .study-header-content {
    grid-template-columns: 1fr;
    gap: 1rem;
    text-align: center;
  }
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background: #f8fafc;
  border-color: var(--color-brand);
  color: var(--color-brand);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.course-info {
  text-align: center;
}

.course-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  line-height: 1.3;
}

.course-meta {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.course-category,
.course-level {
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  color: white;
  border: none;
  box-shadow: 0 2px 4px rgba(139, 127, 191, 0.3);
}

.progress-section {
  text-align: right;
}

.progress-info {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.progress-text {
  color: #64748b;
}

.progress-percent {
  color: var(--color-brand);
  font-size: 1.125rem;
}

.progress-bar {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  width: 200px;
  margin-left: auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-brand), var(--color-brand-light));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.study-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: #f8fafc;
}

/* SIDEBAR - CLEANER DESIGN */
.study-sidebar {
  width: 320px;
  background: white;
  border-right: 2px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

@media (max-width: 1023px) {
  .study-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 50;
    transform: translateX(-100%);
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.15);
  }

  .study-sidebar.sidebar-open {
    transform: translateX(0);
  }
}

.sidebar-header {
  padding: 2rem;
  border-bottom: 2px solid #f1f5f9;
  background: linear-gradient(135deg, #fafbfc, #f8fafc);
}

.sidebar-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  text-align: center;
}

.lessons-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.75rem;
  border: 2px solid transparent;
  background: #f8fafc;
}

.lesson-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.lesson-item.active {
  background: linear-gradient(135deg, rgba(139, 127, 191, 0.1), rgba(165, 153, 212, 0.1));
  border-color: var(--color-brand);
  box-shadow: 0 4px 16px rgba(139, 127, 191, 0.2);
}

.lesson-item.completed {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1));
  border-color: #22c55e;
}

.lesson-item.locked {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f1f5f9;
}

.lesson-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.lesson-item.active .lesson-number {
  background: var(--color-brand);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 127, 191, 0.4);
}

.lesson-item.completed .lesson-number {
  background: #22c55e;
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.lesson-content {
  flex: 1;
  min-width: 0;
}

.lesson-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  line-height: 1.4;
}

.lesson-duration {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.lesson-status {
  color: #94a3b8;
  flex-shrink: 0;
}

.lesson-item.completed .lesson-status {
  color: #22c55e;
}

.lesson-item.active .lesson-status {
  color: var(--color-brand);
}

/* MAIN CONTENT - COMPLETELY REDESIGNED */
.study-content {
  flex: 1;
  overflow-y: auto;
  background: white;
  position: relative;
}

.sidebar-toggle.desktop-hidden {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle.desktop-hidden:hover {
  background: #f8fafc;
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.lesson-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

@media (max-width: 1023px) {
  .lesson-container {
    padding: 6rem 2rem 3rem; /* More top padding for mobile toggle */
  }
}

/* LESSON HEADER - CLEAN DESIGN */
.lesson-header {
  margin-bottom: 3rem;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 16px;
  border: 2px solid #e2e8f0;
}

.lesson-meta {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.lesson-number-badge,
.lesson-duration-badge {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.lesson-number-badge {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  color: white;
  box-shadow: 0 4px 12px rgba(139, 127, 191, 0.3);
}

.lesson-duration-badge {
  background: #f1f5f9;
  color: #64748b;
  border: 2px solid #e2e8f0;
}

.lesson-header .lesson-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  color: #1e293b;
  line-height: 1.2;
}

.lesson-description {
  font-size: 1.125rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* LESSON CONTENT - STRUCTURED LAYOUT */
.lesson-content-area {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.text-content {
  line-height: 1.8;
  font-size: 1rem;
}

.content-section {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  border: 2px solid #f1f5f9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.content-section h3 {
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f1f5f9;
}

.content-section h4 {
  color: #334155;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem 0;
}

.content-section p {
  color: #475569;
  margin: 0 0 1.5rem 0;
  line-height: 1.7;
}

.content-section ul,
.content-section ol {
  margin: 1.5rem 0;
  padding-left: 2rem;
}

.content-section li {
  color: #475569;
  margin: 0.75rem 0;
  line-height: 1.6;
}

/* RESOURCES SECTION - CARD DESIGN */
.resources-section {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 16px;
  padding: 2.5rem;
  margin: 3rem 0;
  border: 2px solid #e2e8f0;
}

.resources-section h3 {
  margin: 0 0 2rem 0;
  color: #1e293b;
  font-size: 1.375rem;
  font-weight: 700;
  text-align: center;
}

.resources-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  color: #475569;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.resource-item:hover {
  background: #f8fafc;
  border-color: var(--color-brand);
  color: var(--color-brand);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.resource-item svg {
  color: var(--color-brand);
}

.resource-size {
  margin-left: auto;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

/* QUIZ SECTION - INTERACTIVE DESIGN */
.quiz-section {
  background: linear-gradient(135deg, white, #fafbfc);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 3rem;
  margin: 3rem 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.quiz-section h3 {
  margin: 0 0 2rem 0;
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.question-item h4 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 2rem 0;
  color: #1e293b;
  line-height: 1.5;
  text-align: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #f1f5f9;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.quiz-option:hover {
  background: #f8fafc;
  border-color: var(--color-brand);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quiz-option input[type="radio"] {
  margin: 0;
  width: 20px;
  height: 20px;
}

.quiz-option span {
  flex: 1;
  color: #475569;
  font-size: 1rem;
  font-weight: 500;
}

.quiz-submit-btn,
.retry-quiz-btn {
  display: block;
  margin: 2rem auto 0;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(139, 127, 191, 0.3);
}

.quiz-submit-btn:hover,
.retry-quiz-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 127, 191, 0.4);
}

.quiz-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quiz-result {
  text-align: center;
  padding: 2rem;
}

.quiz-feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 600;
  font-size: 1.125rem;
}

.quiz-feedback.correct {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
  color: #15803d;
  border: 2px solid rgba(34, 197, 94, 0.3);
}

.quiz-feedback.incorrect {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
  color: #dc2626;
  border: 2px solid rgba(239, 68, 68, 0.3);
}

/* NAVIGATION - PROMINENT BUTTONS */
.lesson-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 0;
  border-top: 2px solid #f1f5f9;
  margin-top: 3rem;
}

@media (max-width: 640px) {
  .lesson-navigation {
    flex-direction: column;
    gap: 1rem;
  }
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.nav-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: var(--color-brand);
  color: var(--color-brand);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.complete-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border-color: #22c55e;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.complete-btn:hover {
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
}

.next-btn {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-light));
  color: white;
  border-color: var(--color-brand);
  box-shadow: 0 4px 12px rgba(139, 127, 191, 0.3);
}

.next-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-brand-dark), var(--color-brand));
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 127, 191, 0.4);
}

@media (max-width: 640px) {
  .nav-btn {
    width: 100%;
    justify-content: center;
  }
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

  .study-header-content {
    gap: 0.75rem;
  }

  .course-title {
    font-size: 1.125rem;
  }

  .progress-section {
    min-width: auto;
  }

  .lesson-header .lesson-title {
    font-size: 1.5rem;
  }

  .lesson-container {
    max-width: none;
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
}
</style>