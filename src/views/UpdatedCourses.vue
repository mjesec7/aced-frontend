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
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-purple-dark rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium">{{ selectedCourse?.title || 'Курс' }}</h3>
          </div>
          <p class="text-sm text-muted-foreground">Полный курс</p>
          <button @click="toggleSidebar" class="sidebar-toggle mobile-only">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div class="sidebar-progress">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">Прогресс</span>
            <span class="text-sm font-medium">{{ completedLessons }}/{{ totalLessons }} Завершено</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2">
            <div 
              class="h-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-light" 
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
        </div>

        <div class="lessons-list">
          <div class="p-4 space-y-2">
            <div
              v-for="(lesson, index) in lessons"
              :key="lesson.id"
              @click="selectLesson(index)"
              :class="[
                'lesson-item-modern',
                {
                  'current': currentLessonIndex === index,
                  'completed': lesson.completed,
                  'locked': lesson.locked
                }
              ]"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <svg v-if="lesson.completed" class="w-5 h-5 text-brand-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                  </svg>
                  <svg v-else-if="lesson.locked" class="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <div v-else-if="currentLessonIndex === index" class="w-5 h-5 rounded-full border-2 border-brand-purple flex items-center justify-center">
                    <div class="w-2 h-2 rounded-full bg-brand-purple"></div>
                  </div>
                  <div v-else class="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs text-muted-foreground font-medium">
                      {{ String(index + 1).padStart(2, '0') }}
                    </span>
                    <span v-if="currentLessonIndex === index" class="text-xs px-2 py-1 bg-brand-purple text-white rounded-full">
                      Текущий
                    </span>
                  </div>
                  <h3 :class="[
                    'text-sm leading-tight mb-2',
                    currentLessonIndex === index ? 'text-brand-purple font-medium' : 'text-foreground'
                  ]">
                    {{ lesson.title }}
                  </h3>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {{ lesson.duration }}
                    <span v-if="lesson.type === 'workshop'" class="px-2 py-0.5 bg-muted rounded text-xs">Практика</span>
                  </div>
                </div>
                
                <svg v-if="!lesson.locked" class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
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

        <div v-if="currentLesson" class="lesson-container-modern">
          <div class="lesson-header-modern">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-purple-dark rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-medium mb-1">{{ currentLesson.title }}</h1>
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {{ currentLesson.duration }}
                  </span>
                  <span>Урок {{ currentLessonIndex + 1 }} из {{ totalLessons }}</span>
                </div>
              </div>
            </div>
            <p class="text-muted-foreground text-lg">{{ currentLesson.description }}</p>
          </div>

          <div v-if="currentLesson.objectives && currentLesson.objectives.length" class="learning-objectives-modern">
            <h2 class="text-lg font-medium mb-4 text-brand-purple-dark">Цели урока</h2>
            <ul class="space-y-2">
              <li v-for="(objective, index) in currentLesson.objectives" :key="index" class="flex items-start gap-3">
                <div class="w-1.5 h-1.5 rounded-full bg-brand-purple mt-2.5 flex-shrink-0"></div>
                <span class="text-foreground">{{ objective }}</span>
              </li>
            </ul>
          </div>

          <div class="lesson-content-modern">
            <div class="content-prose" v-html="currentLesson.content"></div>

            <div v-if="currentLesson.resources && currentLesson.resources.length" class="resources-modern">
              <h3>Материалы урока</h3>
              <div class="resources-grid">
                <a
                  v-for="resource in currentLesson.resources"
                  :key="resource.id"
                  :href="resource.url"
                  download
                  class="resource-item-modern"
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

            <div v-if="currentLesson.quiz" class="quiz-modern">
              <h3>Проверьте себя</h3>
              <div class="quiz-container-modern">
                <div v-if="!quizCompleted" class="quiz-questions">
                  <div class="question-item-modern">
                    <h4>{{ currentLesson.quiz.question }}</h4>
                    <div class="quiz-options-modern">
                      <label
                        v-for="(option, index) in currentLesson.quiz.options"
                        :key="index"
                        class="quiz-option-modern"
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
                      class="quiz-submit-modern"
                    >
                      Проверить ответ
                    </button>
                  </div>
                </div>
                <div v-else class="quiz-result-modern">
                  <div :class="['quiz-feedback-modern', quizCorrect ? 'correct' : 'incorrect']">
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
                  <button v-if="!quizCorrect" @click="quizCompleted = false" class="retry-quiz-modern">
                    Попробовать снова
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="lesson-navigation-modern">
            <button
              @click="previousLesson"
              :disabled="currentLessonIndex === 0"
              class="nav-btn-modern prev-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Предыдущий урок
            </button>

            <button
              v-if="!currentLesson.completed && (!currentLesson.quiz || (currentLesson.quiz && quizCorrect))"
              @click="markLessonCompleted"
              class="complete-btn-modern"
            >
              Завершить урок
            </button>

            <button
              @click="nextLesson"
              :disabled="currentLessonIndex === lessons.length - 1 || lessons[currentLessonIndex + 1]?.locked"
              class="nav-btn-modern next-btn"
            >
              Следующий урок
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
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
        'artificial intelligence': 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400&h=250&fit=crop',
        'machine learning': 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400&h=250&fit=crop',
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
          completed: true,
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
          },
          objectives: [
            "Познакомиться с преподавателями",
            "Оценить структуру курса",
            "Узнать о будущих проектах"
          ],
        },
        {
          id: 2,
          title: "Основные концепции",
          description: "Изучаем ключевые понятия и термины",
          duration: "25 мин",
          completed: false,
          locked: false,
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
          },
          objectives: [
            "Определить основные термины",
            "Понять принципы работы",
            "Разобрать примеры"
          ],
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
          `,
          objectives: [
            "Выполнить первое задание",
            "Проверить свои навыки",
            "Получить обратную связь"
          ],
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
/* ==========================================
   MODERN LESSON INTERFACE STYLES
   Complete redesign with clean, modern aesthetics
   ========================================== */

/* CSS Variables for consistency */
:root {
  --lesson-bg: #fafbfc;
  --lesson-content-bg: #ffffff;
  --lesson-border: #e5e7eb;
  --lesson-text: #1f2937;
  --lesson-text-muted: #6b7280;
  --lesson-text-light: #9ca3af;
  --lesson-accent: #8b5cf6;
  --lesson-accent-light: #a78bfa;
  --lesson-accent-dark: #7c3aed;
  --lesson-success: #10b981;
  --lesson-error: #ef4444;
  --lesson-warning: #f59e0b;
  --lesson-radius: 12px;
  --lesson-radius-sm: 8px;
  --lesson-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --lesson-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Dark theme adjustments */
.dark {
  --lesson-bg: #0f172a;
  --lesson-content-bg: #1e293b;
  --lesson-border: #334155;
  --lesson-text: #f1f5f9;
  --lesson-text-muted: #94a3b8;
  --lesson-text-light: #64748b;
  --lesson-accent: #a78bfa;
  --lesson-accent-light: #c4b5fd;
  --lesson-accent-dark: #8b5cf6;
}

/* ==========================================
   STUDY PAGE LAYOUT
   ========================================== */

.study-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--lesson-bg);
  color: var(--lesson-text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

/* ==========================================
   STUDY HEADER - Clean and minimal
   ========================================== */

.study-header {
  background: var(--lesson-content-bg);
  border-bottom: 1px solid var(--lesson-border);
  padding: 1.5rem 0;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(8px);
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--lesson-border);
  border-radius: var(--lesson-radius-sm);
  background: var(--lesson-content-bg);
  color: var(--lesson-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.back-button:hover {
  background: var(--lesson-bg);
  border-color: var(--lesson-accent);
  color: var(--lesson-accent);
  transform: translateY(-1px);
}

.course-info {
  text-align: center;
}

.course-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--lesson-text);
  letter-spacing: -0.025em;
}

.course-meta {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.course-category,
.course-level {
  padding: 0.375rem 0.75rem;
  border-radius: var(--lesson-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(139, 92, 246, 0.1);
  color: var(--lesson-accent);
  border: 1px solid rgba(139, 92, 246, 0.2);
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
  font-weight: 500;
}

.progress-text {
  color: var(--lesson-text-muted);
}

.progress-percent {
  color: var(--lesson-accent);
  font-weight: 700;
}

.progress-bar {
  height: 6px;
  background: var(--lesson-border);
  border-radius: 3px;
  overflow: hidden;
  width: 200px;
  margin-left: auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--lesson-accent), var(--lesson-accent-light));
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ==========================================
   MAIN LAYOUT
   ========================================== */

.study-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--lesson-bg);
}

/* ==========================================
   SIDEBAR - Modern and clean
   ========================================== */

.study-sidebar {
  width: 320px;
  background: var(--lesson-content-bg);
  border-right: 1px solid var(--lesson-border);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 1023px) {
  .study-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 50;
    transform: translateX(-100%);
    box-shadow: var(--lesson-shadow-lg);
  }

  .study-sidebar.sidebar-open {
    transform: translateX(0);
  }
}

.sidebar-header {
  padding: 2rem;
  border-bottom: 1px solid var(--lesson-border);
  background: var(--lesson-content-bg);
}

.sidebar-progress {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--lesson-border);
  background: var(--lesson-bg);
}

.lessons-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Lesson item redesign */
.lesson-item-modern {
  position: relative;
  padding: 1.25rem;
  border-radius: var(--lesson-radius);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 0.75rem;
  border: 2px solid transparent;
  background: var(--lesson-content-bg);
  box-shadow: var(--lesson-shadow);
}

.lesson-item-modern:hover:not(.locked) {
  background: var(--lesson-bg);
  border-color: var(--lesson-accent-light);
  transform: translateY(-2px);
  box-shadow: var(--lesson-shadow-lg);
}

.lesson-item-modern.current {
  background: rgba(139, 92, 246, 0.05);
  border-color: var(--lesson-accent);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.lesson-item-modern.completed {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.3);
}

.lesson-item-modern.locked {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--lesson-border);
}

/* ==========================================
   CONTENT AREA - Complete redesign
   ========================================== */

.study-content {
  flex: 1;
  overflow-y: auto;
  background: var(--lesson-bg);
  position: relative;
}

.sidebar-toggle.desktop-hidden {
  position: fixed;
  top: 2rem;
  left: 2rem;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--lesson-border);
  border-radius: var(--lesson-radius-sm);
  background: var(--lesson-content-bg);
  color: var(--lesson-text-muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: var(--lesson-shadow);
}

.sidebar-toggle.desktop-hidden:hover {
  background: var(--lesson-bg);
  border-color: var(--lesson-accent);
  color: var(--lesson-accent);
  transform: translateY(-1px);
}

.lesson-container-modern {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

@media (max-width: 1023px) {
  .lesson-container-modern {
    padding: 6rem 1.5rem 3rem;
  }
}

@media (max-width: 768px) {
  .lesson-container-modern {
    padding: 5rem 1rem 2rem;
  }
}

/* ==========================================
   LESSON HEADER - Clean typography
   ========================================== */

.lesson-header-modern {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--lesson-border);
  background: var(--lesson-content-bg);
  border-radius: var(--lesson-radius);
  padding: 2rem;
  box-shadow: var(--lesson-shadow);
}

.lesson-header-modern .flex {
  margin-bottom: 1.5rem;
}

.lesson-header-modern h1 {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--lesson-text);
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.025em;
}

.lesson-header-modern .flex + p {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--lesson-text-muted);
  margin: 0;
}

/* ==========================================
   LEARNING OBJECTIVES - Modern card design
   ========================================== */

.learning-objectives-modern {
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--lesson-content-bg);
  border-radius: var(--lesson-radius);
  border: 1px solid var(--lesson-border);
  box-shadow: var(--lesson-shadow);
  position: relative;
  overflow: hidden;
}

.learning-objectives-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--lesson-accent), var(--lesson-accent-light));
}

.learning-objectives-modern h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--lesson-text);
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.learning-objectives-modern h2::before {
  content: '🎯';
  font-size: 1.5rem;
}

.learning-objectives-modern ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1rem;
}

.learning-objectives-modern li {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--lesson-bg);
  border-radius: var(--lesson-radius-sm);
  border: 1px solid var(--lesson-border);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.learning-objectives-modern li:hover {
  background: rgba(139, 92, 246, 0.05);
  border-color: var(--lesson-accent-light);
  transform: translateX(4px);
}

.learning-objectives-modern li::before {
  content: '✓';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--lesson-accent);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* ==========================================
   LESSON CONTENT - Typography perfection
   ========================================== */

.lesson-content-modern {
  display: grid;
  gap: 3rem;
}

.content-prose {
  background: var(--lesson-content-bg);
  border-radius: var(--lesson-radius);
  padding: 2.5rem;
  box-shadow: var(--lesson-shadow);
  border: 1px solid var(--lesson-border);
}

.content-prose h1,
.content-prose h2,
.content-prose h3,
.content-prose h4,
.content-prose h5,
.content-prose h6 {
  color: var(--lesson-text);
  font-weight: 700;
  line-height: 1.3;
  margin: 2rem 0 1rem 0;
  letter-spacing: -0.025em;
}

.content-prose h1:first-child,
.content-prose h2:first-child,
.content-prose h3:first-child {
  margin-top: 0;
}

.content-prose h1 { font-size: 2.25rem; }
.content-prose h2 { font-size: 1.875rem; }
.content-prose h3 { font-size: 1.5rem; }
.content-prose h4 { font-size: 1.25rem; }
.content-prose h5 { font-size: 1.125rem; }
.content-prose h6 { font-size: 1rem; }

.content-prose p {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--lesson-text);
  margin: 0 0 1.5rem 0;
}

.content-prose ul,
.content-prose ol {
  margin: 1.5rem 0;
  padding-left: 2rem;
  color: var(--lesson-text);
}

.content-prose li {
  margin: 0.75rem 0;
  line-height: 1.6;
}

.content-prose ul li::marker {
  color: var(--lesson-accent);
}

.content-prose ol li::marker {
  color: var(--lesson-accent);
  font-weight: 600;
}

.content-prose blockquote {
  margin: 2rem 0;
  padding: 1.5rem 2rem;
  background: var(--lesson-bg);
  border-left: 4px solid var(--lesson-accent);
  border-radius: 0 var(--lesson-radius-sm) var(--lesson-radius-sm) 0;
  font-style: italic;
  color: var(--lesson-text-muted);
}

.content-prose code {
  background: var(--lesson-bg);
  color: var(--lesson-accent);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.875rem;
}

.content-prose pre {
  background: var(--lesson-text);
  color: white;
  padding: 1.5rem;
  border-radius: var(--lesson-radius-sm);
  overflow-x: auto;
  margin: 1.5rem 0;
}

.content-prose pre code {
  background: none;
  color: inherit;
  padding: 0;
}

/* ==========================================
   RESOURCES SECTION - Modern grid design
   ========================================== */

.resources-modern {
  background: var(--lesson-content-bg);
  border-radius: var(--lesson-radius);
  padding: 2rem;
  border: 1px solid var(--lesson-border);
  box-shadow: var(--lesson-shadow);
}

.resources-modern h3 {
  margin: 0 0 1.5rem 0;
  color: var(--lesson-text);
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.resources-modern h3::before {
  content: '📁';
  font-size: 1.5rem;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.resource-item-modern {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--lesson-bg);
  border: 1px solid var(--lesson-border);
  border-radius: var(--lesson-radius-sm);
  text-decoration: none;
  color: var(--lesson-text);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.resource-item-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--lesson-accent);
  transform: scaleY(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.resource-item-modern:hover {
  background: var(--lesson-content-bg);
  border-color: var(--lesson-accent);
  color: var(--lesson-accent);
  transform: translateY(-2px);
  box-shadow: var(--lesson-shadow-lg);
}

.resource-item-modern:hover::before {
  transform: scaleY(1);
}

.resource-item-modern svg {
  color: var(--lesson-accent);
  flex-shrink: 0;
}

.resource-size {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--lesson-text-light);
  background: var(--lesson-border);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 500;
}

/* ==========================================
   QUIZ SECTION - Interactive and modern
   ========================================== */

.quiz-modern {
  background: var(--lesson-content-bg);
  border: 1px solid var(--lesson-border);
  border-radius: var(--lesson-radius);
  padding: 2.5rem;
  box-shadow: var(--lesson-shadow);
  position: relative;
  overflow: hidden;
}

.quiz-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--lesson-warning), #f59e0b);
}

.quiz-modern h3 {
  margin: 0 0 2rem 0;
  color: var(--lesson-text);
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.quiz-modern h3::before {
  content: '🧠';
  font-size: 2rem;
}

.question-item-modern h4 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--lesson-text);
  line-height: 1.5;
  padding: 1.5rem;
  background: var(--lesson-bg);
  border-radius: var(--lesson-radius-sm);
  border: 1px solid var(--lesson-border);
}

.quiz-options-modern {
  display: grid;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.quiz-option-modern {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid var(--lesson-border);
  border-radius: var(--lesson-radius-sm);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--lesson-bg);
  position: relative;
}

.quiz-option-modern:hover {
  background: var(--lesson-content-bg);
  border-color: var(--lesson-accent-light);
  transform: translateX(4px);
}

.quiz-option-modern:has(input:checked) {
  background: rgba(139, 92, 246, 0.1);
  border-color: var(--lesson-accent);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.quiz-option-modern input[type="radio"] {
  width: 20px;
  height: 20px;
  accent-color: var(--lesson-accent);
  margin: 0;
}

.quiz-option-modern span {
  flex: 1;
  color: var(--lesson-text);
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 500;
}

.quiz-submit-modern,
.retry-quiz-modern {
  display: block;
  margin: 2rem auto 0;
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--lesson-radius-sm);
  background: var(--lesson-accent);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.quiz-submit-modern::before,
.retry-quiz-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.quiz-submit-modern:hover:not(:disabled),
.retry-quiz-modern:hover {
  background: var(--lesson-accent-dark);
  transform: translateY(-2px);
  box-shadow: var(--lesson-shadow-lg);
}

.quiz-submit-modern:hover:not(:disabled)::before,
.retry-quiz-modern:hover::before {
  left: 100%;
}

.quiz-submit-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quiz-result-modern {
  text-align: center;
  padding: 1.5rem;
}

.quiz-feedback-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: var(--lesson-radius-sm);
  margin-bottom: 1.5rem;
  font-weight: 600;
  font-size: 1.125rem;
}

.quiz-feedback-modern.correct {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  color: var(--lesson-success);
  border: 2px solid rgba(16, 185, 129, 0.3);
}

.quiz-feedback-modern.incorrect {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  color: var(--lesson-error);
  border: 2px solid rgba(239, 68, 68, 0.3);
}

/* ==========================================
   NAVIGATION - Clean and accessible
   ========================================== */

.lesson-navigation-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 2.5rem 0;
  margin-top: 3rem;
  background: var(--lesson-content-bg);
  border-radius: var(--lesson-radius);
  padding: 2rem;
  box-shadow: var(--lesson-shadow);
  border: 1px solid var(--lesson-border);
}

@media (max-width: 640px) {
  .lesson-navigation-modern {
    flex-direction: column;
    gap: 1rem;
  }
}

.nav-btn-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: 2px solid var(--lesson-border);
  border-radius: var(--lesson-radius-sm);
  background: var(--lesson-content-bg);
  color: var(--lesson-text-muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.nav-btn-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent);
  transition: left 0.3s;
}

.nav-btn-modern:hover:not(:disabled) {
  background: var(--lesson-bg);
  border-color: var(--lesson-accent);
  color: var(--lesson-accent);
  transform: translateY(-2px);
  box-shadow: var(--lesson-shadow);
}

.nav-btn-modern:hover:not(:disabled)::before {
  left: 100%;
}

.nav-btn-modern:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.complete-btn-modern {
  background: linear-gradient(135deg, var(--lesson-success), #059669);
  color: white;
  border-color: var(--lesson-success);
}

.complete-btn-modern:hover {
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  border-color: #059669;
}

.next-btn:not(:disabled) {
  background: linear-gradient(135deg, var(--lesson-accent), var(--lesson-accent-light));
  color: white;
  border-color: var(--lesson-accent);
}

.next-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--lesson-accent-dark), var(--lesson-accent));
  color: white;
  border-color: var(--lesson-accent-dark);
}

@media (max-width: 640px) {
  .nav-btn-modern {
    width: 100%;
    justify-content: center;
  }
}

/* ==========================================
   RESPONSIVE DESIGN
   ========================================== */

@media (max-width: 768px) {
  .lesson-header-modern h1 {
    font-size: 1.75rem;
  }

  .lesson-header-modern,
  .content-prose,
  .resources-modern,
  .quiz-modern,
  .lesson-navigation-modern {
    padding: 1.5rem;
  }

  .learning-objectives-modern {
    padding: 1.5rem;
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .lesson-container-modern {
    padding: 4rem 1rem 2rem;
  }

  .lesson-header-modern h1 {
    font-size: 1.5rem;
  }

  .content-prose h3 {
    font-size: 1.25rem;
  }

  .quiz-modern h3 {
    font-size: 1.25rem;
  }

  .lesson-header-modern,
  .content-prose,
  .resources-modern,
  .quiz-modern,
  .lesson-navigation-modern {
    padding: 1rem;
  }

  .learning-objectives-modern {
    padding: 1rem;
  }
}

/* ==========================================
   ANIMATIONS AND MICRO-INTERACTIONS
   ========================================== */

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.lesson-container-modern > * {
  animation: fadeInUp 0.6s ease-out backwards;
}

.lesson-container-modern > *:nth-child(1) { animation-delay: 0.1s; }
.lesson-container-modern > *:nth-child(2) { animation-delay: 0.2s; }
.lesson-container-modern > *:nth-child(3) { animation-delay: 0.3s; }
.lesson-container-modern > *:nth-child(4) { animation-delay: 0.4s; }

.lesson-item-modern {
  animation: slideInLeft 0.4s ease-out backwards;
}

.lesson-item-modern:nth-child(1) { animation-delay: 0.1s; }
.lesson-item-modern:nth-child(2) { animation-delay: 0.2s; }
.lesson-item-modern:nth-child(3) { animation-delay: 0.3s; }
.lesson-item-modern:nth-child(4) { animation-delay: 0.4s; }
.lesson-item-modern:nth-child(5) { animation-delay: 0.5s; }

/* Loading states */
.lesson-loading {
  animation: pulse 2s infinite;
}

/* Focus states for accessibility */
.quiz-option-modern:focus-within {
  outline: 2px solid var(--lesson-accent);
  outline-offset: 2px;
}

.nav-btn-modern:focus,
.quiz-submit-modern:focus,
.retry-quiz-modern:focus {
  outline: 2px solid var(--lesson-accent);
  outline-offset: 2px;
}

/* ==========================================
   SPECIAL CONTENT BLOCKS
   ========================================== */

/* Info boxes */
.content-prose .info-box {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-left: 4px solid #3b82f6;
  border-radius: var(--lesson-radius-sm);
  padding: 1.5rem;
  margin: 2rem 0;
}

.content-prose .warning-box {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-left: 4px solid var(--lesson-warning);
  border-radius: var(--lesson-radius-sm);
  padding: 1.5rem;
  margin: 2rem 0;
}

.content-prose .success-box {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05));
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-left: 4px solid var(--lesson-success);
  border-radius: var(--lesson-radius-sm);
  padding: 1.5rem;
  margin: 2rem 0;
}

/* Code blocks with syntax highlighting */
.content-prose .code-block {
  background: #1e293b;
  color: #e2e8f0;
  padding: 2rem;
  border-radius: var(--lesson-radius);
  overflow-x: auto;
  margin: 2rem 0;
  position: relative;
  border: 1px solid #334155;
}

.content-prose .code-block::before {
  content: attr(data-language);
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.1em;
}

/* Tables */
.content-prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  background: var(--lesson-content-bg);
  border-radius: var(--lesson-radius);
  overflow: hidden;
  box-shadow: var(--lesson-shadow);
  border: 1px solid var(--lesson-border);
}

.content-prose th,
.content-prose td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--lesson-border);
}

.content-prose th {
  background: var(--lesson-bg);
  font-weight: 700;
  color: var(--lesson-text);
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.content-prose td {
  color: var(--lesson-text);
}

.content-prose tr:last-child td {
  border-bottom: none;
}

.content-prose tr:hover td {
  background: var(--lesson-bg);
}

/* ==========================================
   UTILITY CLASSES
   ========================================== */

.lesson-fade-in {
  animation: fadeInUp 0.6s ease-out;
}

.lesson-slide-in {
  animation: slideInLeft 0.4s ease-out;
}

.lesson-pulse {
  animation: pulse 2s infinite;
}

.lesson-shadow {
  box-shadow: var(--lesson-shadow);
}

.lesson-shadow-lg {
  box-shadow: var(--lesson-shadow-lg);
}

.lesson-border {
  border: 1px solid var(--lesson-border);
}

.lesson-border-accent {
  border: 1px solid var(--lesson-accent);
}

.lesson-bg {
  background: var(--lesson-bg);
}

.lesson-content-bg {
  background: var(--lesson-content-bg);
}

.lesson-text {
  color: var(--lesson-text);
}

.lesson-text-muted {
  color: var(--lesson-text-muted);
}

.lesson-text-light {
  color: var(--lesson-text-light);
}

.lesson-accent {
  color: var(--lesson-accent);
}

.lesson-rounded {
  border-radius: var(--lesson-radius);
}

.lesson-rounded-sm {
  border-radius: var(--lesson-radius-sm);
}

/* ==========================================
   PRINT STYLES
   ========================================== */

@media print {
  .study-header,
  .study-sidebar,
  .sidebar-toggle,
  .lesson-navigation-modern {
    display: none !important;
  }

  .study-content {
    padding: 0 !important;
  }

  .lesson-container-modern {
    max-width: none !important;
    padding: 0 !important;
  }

  .content-prose,
  .learning-objectives-modern,
  .resources-modern,
  .quiz-modern {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
    break-inside: avoid;
  }

  .quiz-options-modern,
  .quiz-submit-modern,
  .quiz-result-modern {
    display: none !important;
  }
}

/* ==========================================
   ACCESSIBILITY IMPROVEMENTS
   ========================================== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --lesson-border: #000;
    --lesson-text: #000;
    --lesson-text-muted: #333;
    --lesson-accent: #0000ff;
  }

  .dark {
    --lesson-border: #fff;
    --lesson-text: #fff;
    --lesson-text-muted: #ccc;
    --lesson-accent: #00ffff;
  }
}

/* Focus visible for keyboard navigation */
.lesson-item-modern:focus-visible,
.nav-btn-modern:focus-visible,
.quiz-option-modern:focus-visible,
.quiz-submit-modern:focus-visible {
  outline: 3px solid var(--lesson-accent);
  outline-offset: 2px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>