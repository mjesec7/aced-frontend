<template>
  <div class="courses-page">
    <div class="header">
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
    </div>

    <div class="content-wrapper">
      <div class="container">
        <div class="filter-bar">
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
            <select
              v-model="categoryFilter"
              @change="applyFilters"
              class="select-field"
            >
              <option value="all">Все категории</option>
              <option
                v-for="category in categories"
                :key="category"
                :value="category"
              >
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
            <select
              v-model="levelFilter"
              @change="applyFilters"
              class="select-field"
            >
              <option value="all">Все уровни</option>
              <option value="Начинающий">Начинающий</option>
              <option value="Средний">Средний</option>
              <option value="Продвинутый">Продвинутый</option>
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
        </div>

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
              <path
                d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
              ></path>
            </svg>
            <span>Найдено курсов: {{ filteredCourses.length }}</span>
          </div>
          <div class="results-updated">Обновлено сегодня</div>
        </div>

        <div v-if="filteredCourses.length > 0" class="courses-grid">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="course-card"
            @click="openModal(course)"
          >
            <div class="course-card-image-wrapper">
              <img
                :src="course.image"
                :alt="course.title"
                class="course-card-image"
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

    <div v-if="isModalOpen && selectedCourse" class="modal-overlay">
      <div class="modal-container">
        <button class="modal-close" @click="closeModal">
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
            class="modal-close-icon"
          >
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
        <div class="modal-content">
          <div class="modal-image-wrapper">
            <img
              :src="selectedCourse.image"
              :alt="selectedCourse.title"
              class="modal-image"
            />
            <div class="modal-image-overlay"></div>
            <div v-if="selectedCourse.isPremium" class="modal-badge-premium">
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
            <div v-else class="modal-badge-free">Бесплатно</div>

            <div class="modal-meta-bottom">
              <div class="modal-meta-item">
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
                  class="modal-meta-icon"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{{ selectedCourse.duration }}</span>
              </div>
              <div class="modal-provider-info">
                <p>от</p>
                <p>Aced</p>
              </div>
            </div>
          </div>

          <div class="modal-info">
            <div class="modal-header">
              <div class="modal-badges-header">
                <div class="modal-category">{{ selectedCourse.category }}</div>
                <div class="modal-level">{{ selectedCourse.level }}</div>
              </div>
              <h3 class="modal-title">{{ selectedCourse.title }}</h3>
              <p class="modal-description">{{ selectedCourse.fullDescription }}</p>
            </div>

            <hr class="modal-separator" />

            <div class="modal-details">
              <div class="modal-details-section">
                <h4 class="modal-details-title">
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
                    class="modal-details-icon"
                  >
                    <path
                      d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
                    ></path>
                  </svg>
                  Что вы изучите:
                </h4>
                <ul class="modal-list">
                  <li
                    v-for="(skill, index) in selectedCourse.skills.slice(0, 4)"
                    :key="index"
                    class="modal-list-item"
                  >
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
                      class="list-check-icon"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"></path>
                      <path d="M22 4L12 14.01l-3-3"></path>
                    </svg>
                    <span>{{ skill }}</span>
                  </li>
                  <li
                    v-if="selectedCourse.skills.length > 4"
                    class="modal-list-more"
                  >
                    и еще {{ selectedCourse.skills.length - 4 }} навыков...
                  </li>
                </ul>
              </div>

              <div class="modal-details-section">
                <h4 class="modal-details-title">Программа курса:</h4>
                <ul class="modal-list">
                  <li
                    v-for="(module, index) in selectedCourse.modules.slice(0, 6)"
                    :key="index"
                    class="modal-list-item-plain"
                  >
                    {{ index + 1 }}. {{ module }}
                  </li>
                  <li
                    v-if="selectedCourse.modules.length > 6"
                    class="modal-list-more"
                  >
                    и еще {{ selectedCourse.modules.length - 6 }} модулей...
                  </li>
                </ul>
              </div>
            </div>

            <div class="modal-actions">
              <button
                :class="['button-action', { premium: selectedCourse.isPremium }]"
              >
                <svg
                  v-if="selectedCourse.isPremium"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="button-icon"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="button-icon"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                {{ selectedCourse.isPremium ? 'Только для подписчиков' : 'Начать курс' }}
              </button>
              <p class="modal-action-hint">
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
export default {
  name: 'UpdatedCourses',
  data() {
    return {
      courses: [
        {
          id: '1',
          title: 'ИИ и машинное обучение: с нуля до профессионала',
          description: 'Освойте основы искусственного интеллекта, изучите популярные алгоритмы машинного обучения и создайте свои первые AI-проекты.',
          fullDescription: 'Комплексный курс по искусственному интеллекту и машинному обучению. Вы изучите основы математики для ML, освоите Python, TensorFlow и создадите реальные проекты с использованием нейронных сетей.',
          category: 'Искусственный интеллект',
          duration: '12 недель',
          level: 'Начинающий',
          isPremium: true,
          image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
          skills: [
            'Основы машинного обучения и нейронных сетей',
            'Программирование на Python для Data Science',
            'Работа с TensorFlow и PyTorch',
            'Обработка естественного языка (NLP)',
            'Компьютерное зрение',
            'Развертывание ML-моделей в продакшн'
          ],
          modules: [
            'Введение в ИИ и основы математики',
            'Python для машинного обучения',
            'Линейная алгебра и статистика',
            'Обучение с учителем',
            'Обучение без учителя',
            'Глубокое обучение и нейронные сети',
            'Обработка естественного языка',
            'Компьютерное зрение',
            'Практические проекты',
            'Развертывание моделей'
          ]
        },
        {
          id: '2',
          title: 'UX/UI дизайн: современные подходы',
          description: 'Изучите принципы пользовательского опыта, освойте Figma и создайте портфолио современного дизайнера.',
          fullDescription: 'Практический курс по UX/UI дизайну с фокусом на современные тренды. Научитесь создавать интуитивные интерфейсы, проводить пользовательские исследования и работать с командой разработки.',
          category: 'Дизайн',
          duration: '8 недель',
          level: 'Начинающий',
          isPremium: false,
          image: 'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=800&h=600&fit=crop',
          skills: [
            'Принципы UX/UI дизайна',
            'Пользовательские исследования',
            'Создание wireframes и прототипов',
            'Работа в Figma',
            'Типографика и колористика',
            'Адаптивный дизайн'
          ],
          modules: [
            'Введение в UX/UI дизайн',
            'Пользовательские исследования',
            'Информационная архитектура',
            'Wireframing и прототипирование',
            'Визуальный дизайн',
            'Работа с Figma',
            'Адаптивный дизайн',
            'Создание портфолио'
          ]
        },
        {
          id: '3',
          title: 'Блокчейн и криптовалюты: технологии будущего',
          description: 'Погрузитесь в мир криптовалют и блокчейн-технологий. Изучите смарт-контракты и создайте свой токен.',
          fullDescription: 'Полный курс по блокчейн-технологиям от основ до создания собственных проектов. Изучите Ethereum, Solidity, DeFi и NFT.',
          category: 'Блокчейн',
          duration: '10 недель',
          level: 'Средний',
          isPremium: true,
          image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop',
          skills: [
            'Основы блокчейн-технологий',
            'Создание смарт-контрактов на Solidity',
            'Работа с Ethereum и Web3',
            'DeFi и децентрализованные приложения',
            'NFT и токенизация',
            'Безопасность в блокчейне'
          ],
          modules: [
            'Введение в блокчейн',
            'Криптография и консенсус',
            'Ethereum и смарт-контракты',
            'Solidity для начинающих',
            'Web3 и dApps',
            'DeFi протоколы',
            'NFT и метавселенная',
            'Безопасность и аудит',
            'Практические проекты'
          ]
        },
        {
          id: '4',
          title: 'Цифровой маркетинг: полный гид',
          description: 'Освойте все каналы цифрового маркетинга: от контекстной рекламы до социальных сетей и email-маркетинга.',
          fullDescription: 'Комплексный курс по цифровому маркетингу с акцентом на практические навыки. Научитесь создавать эффективные рекламные кампании и анализировать их результаты.',
          category: 'Маркетинг',
          duration: '6 недель',
          level: 'Начинающий',
          isPremium: false,
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
          skills: [
            'Стратегия цифрового маркетинга',
            'Контекстная реклама (Яндекс.Директ, Google Ads)',
            'SMM и реклама в социальных сетях',
            'Email-маркетинг и автоворонки',
            'Аналитика и метрики',
            'SEO-оптимизация'
          ],
          modules: [
            'Основы цифрового маркетинга',
            'Контекстная реклама',
            'Социальные сети и SMM',
            'Email-маркетинг',
            'Контент-маркетинг',
            'Аналитика и оптимизация'
          ]
        },
        {
          id: '5',
          title: 'React и Next.js: современная frontend-разработка',
          description: 'Изучите современные технологии frontend-разработки. Создайте полноценные веб-приложения с использованием React и Next.js.',
          fullDescription: 'Практический курс по современной frontend-разработке. Освойте React, Next.js, TypeScript и создайте portfolio-проекты для трудоустройства.',
          category: 'Веб-разработка',
          duration: '14 недель',
          level: 'Средний',
          isPremium: true,
          image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=600&fit=crop',
          skills: [
            'React и его экосистема',
            'Next.js и серверный рендеринг',
            'TypeScript для React',
            'State management (Redux, Zustand)',
            'Стилизация (CSS-in-JS, Tailwind)',
            'Тестирование React-приложений'
          ],
          modules: [
            'Основы React',
            'Компоненты и хуки',
            'State management',
            'Роутинг в React',
            'Next.js и SSR',
            'TypeScript',
            'Стилизация компонентов',
            'API интеграция',
            'Тестирование',
            'Деплой приложений'
          ]
        },
        {
          id: '6',
          title: 'Data Science: анализ данных на Python',
          description: 'Станьте специалистом по анализу данных. Изучите Python, pandas, matplotlib и создайте свои первые модели.',
          fullDescription: 'Полноценный курс по Data Science с практическими проектами. Освойте статистику, машинное обучение и визуализацию данных.',
          category: 'Анализ данных',
          duration: '16 недель',
          level: 'Начинающий',
          isPremium: true,
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
          skills: [
            'Python для анализа данных',
            'Pandas и NumPy',
            'Визуализация данных (Matplotlib, Seaborn)',
            'Статистический анализ',
            'Машинное обучение с Scikit-learn',
            'Работа с базами данных'
          ],
          modules: [
            'Введение в Data Science',
            'Python основы',
            'NumPy и Pandas',
            'Статистика и вероятность',
            'Визуализация данных',
            'Машинное обучение',
            'Обработка текстовых данных',
            'Временные ряды',
            'Практические проекты'
          ]
        },
      ],
      selectedCourse: null,
      isModalOpen: false,
      searchTerm: '',
      categoryFilter: 'all',
      levelFilter: 'all',
      typeFilter: 'all',
      debounceTimeout: null,
    };
  },
  computed: {
    categories() {
      return [...new Set(this.courses.map((course) => course.category))];
    },
    filteredCourses() {
      return this.courses.filter((course) => {
        const matchesSearch =
          course.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(this.searchTerm.toLowerCase());
        const matchesCategory =
          this.categoryFilter === 'all' || course.category === this.categoryFilter;
        const matchesLevel =
          this.levelFilter === 'all' || course.level === this.levelFilter;
        const matchesType =
          this.typeFilter === 'all' ||
          (this.typeFilter === 'free' && !course.isPremium) ||
          (this.typeFilter === 'premium' && course.isPremium);

        return matchesSearch && matchesCategory && matchesLevel && matchesType;
      });
    },
  },
  methods: {
    debounceSearch() {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(this.applyFilters, 300);
    },
    applyFilters() {
      // The computed property `filteredCourses` handles the filtering automatically
    },
    setTypeFilter(type) {
      this.typeFilter = type;
    },
    clearFilters() {
      this.searchTerm = '';
      this.categoryFilter = 'all';
      this.levelFilter = 'all';
      this.typeFilter = 'all';
    },
    openModal(course) {
      this.selectedCourse = course;
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
      this.selectedCourse = null;
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", sans-serif;
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
@media (min-width: 1024px) {
  .filter-group-select.category {
    width: 16rem;
  }
  .filter-group-select.level {
    width: 12rem;
  }
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
.button-filter.active.premium {
  background-color: var(--color-brand);
}
.button-filter.active.free {
  background-color: var(--color-success);
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
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
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.course-card:hover {
  transform: translateY(-0.25rem);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1);
  border-color: rgba(139, 127, 191, 0.3);
}

.course-card-image-wrapper {
  position: relative;
  padding: 1.5rem 1.5rem 0.5rem;
}
.course-card-image {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  border-radius: 0.5rem;
}

.badge {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-premium {
  background-image: linear-gradient(
    to right,
    var(--color-brand),
    var(--color-brand-light)
  );
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1);
  border: none;
}
.badge-free {
  background-color: var(--color-green-100);
  color: var(--color-green-800);
  border: none;
}
.badge-icon {
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.25rem;
}

.course-card-content {
  padding: 1.5rem;
  padding-top: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.course-card-meta {
  display: flex;
  justify-content: space-between;
}
.course-card-category {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(139, 127, 191, 0.3);
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-brand);
}
.course-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
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
  -webkit-line-clamp: 3;
}
.course-card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
}
.course-card-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.course-card-stat-icon {
  width: 1rem;
  height: 1rem;
}
.course-card-level {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(139, 127, 191, 0.2);
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-brand);
}

.course-card-provider {
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}
.course-card-provider p:first-child {
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
}
.course-card-provider p:last-child {
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

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-container {
  position: relative;
  width: 95%;
  max-width: 1200px;
  max-height: 85vh;
  overflow-y: auto;
  background-color: var(--color-background);
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
@media (min-width: 640px) {
  .modal-container {
    border-radius: 0.5rem;
  }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  height: 2rem;
  width: 2rem;
  border-radius: 9999px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}
.modal-close:hover {
  background-color: rgba(0, 0, 0, 0.7);
}
.modal-close-icon {
  width: 1rem;
  height: 1rem;
}

.modal-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}
@media (min-width: 1024px) {
  .modal-content {
    grid-template-columns: 2fr 3fr;
  }
}

.modal-image-wrapper {
  position: relative;
}
.modal-image {
  width: 100%;
  height: 16rem;
  object-fit: cover;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}
@media (min-width: 1024px) {
  .modal-image {
    height: 100%;
    border-top-right-radius: 0;
    border-bottom-left-radius: 0.5rem;
  }
}
.modal-image-overlay {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.modal-badge-premium, .modal-badge-free {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  border: none;
}
.modal-badge-premium {
  background-image: linear-gradient(to right, var(--color-brand), var(--color-brand-light));
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}
.modal-badge-free {
  background-color: var(--color-success);
}
.modal-meta-bottom {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}
.modal-meta-icon {
  width: 1rem;
  height: 1rem;
}
.modal-provider-info {
  text-align: right;
}
.modal-provider-info p:first-child {
  font-size: 0.75rem;
  opacity: 0.8;
}
.modal-provider-info p:last-child {
  font-weight: 500;
}

.modal-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.modal-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.modal-badges-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-category, .modal-level {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-brand);
}
.modal-category {
  border: 1px solid rgba(139, 127, 191, 0.3);
}
.modal-level {
  border: 1px solid rgba(139, 127, 191, 0.2);
}
.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
}
.modal-description {
  color: var(--color-muted-foreground);
}

.modal-separator {
  height: 1px;
  background-color: var(--color-border);
  border: none;
}

.modal-details {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .modal-details {
    grid-template-columns: 1fr 1fr;
  }
}
.modal-details-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.modal-details-title {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}
.modal-details-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-brand);
}
.modal-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.modal-list-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
}
.list-check-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-success);
  margin-top: 0.125rem;
  flex-shrink: 0;
}
.modal-list-more {
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
  margin-left: 1.5rem;
}
.modal-list-item-plain {
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
}
.button-action {
  width: 100%;
  height: 2.75rem;
  padding: 0 2rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  background-image: linear-gradient(
    to right,
    var(--color-brand),
    var(--color-brand-light)
  );
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}
.button-action:hover {
  background-image: linear-gradient(
    to right,
    var(--color-brand-dark),
    var(--color-brand)
  );
}
.button-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
}
.modal-action-hint {
  font-size: 0.75rem;
  text-align: center;
  color: var(--color-muted-foreground);
}
</style>