<template>
    <div class="updated-courses-container">
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="gradient-text">Актуальные курсы</span>
            </h1>
            <p class="hero-subtitle">
              Изучайте новейшие технологии и инструменты. От создания ИИ-помощников до современных методов редактирования.
            </p>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">{{ filteredCourses.length }}</span>
                <span class="stat-label">Курсов</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ totalDuration }}</span>
                <span class="stat-label">Часов</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ categories.length }}</span>
                <span class="stat-label">Категорий</span>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="floating-card">
              <div class="card-icon">🤖</div>
              <div class="card-text">AI Tools</div>
            </div>
            <div class="floating-card floating-card-delayed">
              <div class="card-icon">🎬</div>
              <div class="card-text">Video Editing</div>
            </div>
            <div class="floating-card floating-card-delayed-2">
              <div class="card-icon">⚡</div>
              <div class="card-text">Automation</div>
            </div>
          </div>
        </div>
      </div>
  
      <div class="filters-section">
        <div class="container">
          <div class="filters-header">
            <h2>Найди свой курс</h2>
            <button class="clear-filters" @click="clearFilters" v-if="hasActiveFilters">
              Очистить фильтры
            </button>
          </div>
          
          <div class="filters-grid">
            <div class="filter-group">
              <label class="filter-label">Категория</label>
              <div class="filter-options">
                <button 
                  v-for="category in categories" 
                  :key="category"
                  class="filter-chip"
                  :class="{ active: selectedCategory === category }"
                  @click="setCategory(category)"
                >
                  {{ getCategoryIcon(category) }} {{ category }}
                </button>
              </div>
            </div>
  
            <div class="filter-group">
              <label class="filter-label">Уровень сложности</label>
              <div class="filter-options">
                <button 
                  v-for="level in difficultyLevels" 
                  :key="level"
                  class="filter-chip difficulty-chip"
                  :class="{ active: selectedDifficulty === level }"
                  @click="setDifficulty(level)"
                >
                  {{ getDifficultyIcon(level) }} {{ level }}
                </button>
              </div>
            </div>
  
            <div class="filter-group">
              <label class="filter-label">Длительность</label>
              <div class="filter-options">
                <button 
                  v-for="duration in durationOptions" 
                  :key="duration"
                  class="filter-chip duration-chip"
                  :class="{ active: selectedDuration === duration }"
                  @click="setDuration(duration)"
                >
                  {{ duration }}
                </button>
              </div>
            </div>
  
            <div class="filter-group search-group">
              <label class="filter-label">Поиск</label>
              <div class="search-input-container">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Поиск по названию или описанию..."
                  class="search-input"
                />
                <div class="search-icon">🔍</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <div class="courses-section">
        <div class="container">
          <div class="section-header">
            <h2>{{ getSectionTitle() }}</h2>
            <div class="sort-options">
              <select v-model="sortBy" class="sort-select">
                <option value="newest">Сначала новые</option>
                <option value="popular">По популярности</option>
                <option value="duration">По длительности</option>
                <option value="difficulty">По сложности</option>
              </select>
            </div>
          </div>
  
          <div class="courses-grid" v-if="filteredCourses.length > 0">
            <div 
              v-for="course in sortedCourses" 
              :key="course.id"
              class="course-card"
              @click="openCourse(course)"
            >
              <div class="course-image">
                <img :src="course.thumbnail" :alt="course.title" />
                <div class="course-overlay">
                  <div v-if="course.isPremium" class="premium-badge-overlay">
                    PRO
                  </div>
                  <div class="course-category">{{ course.category }}</div>
                  <div class="course-duration">{{ course.duration }}</div>
                </div>
                <div class="course-difficulty" :class="course.difficulty.toLowerCase()">
                  {{ getDifficultyIcon(course.difficulty) }}
                </div>
              </div>
              
              <div class="course-content">
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-description">{{ course.description }}</p>
                
                <div class="course-meta">
                  <div class="course-tools">
                    <span 
                      v-for="tool in course.tools.slice(0, 3)" 
                      :key="tool"
                      class="tool-tag"
                    >
                      {{ tool }}
                    </span>
                    <span v-if="course.tools.length > 3" class="tool-more">
                      +{{ course.tools.length - 3 }}
                    </span>
                  </div>
                  
                  <div class="course-stats">
                    <div class="stat">
                      <span class="stat-icon">👥</span>
                      <span class="stat-value">{{ course.students }}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-icon">⭐</span>
                      <span class="stat-value">{{ course.rating }}</span>
                    </div>
                  </div>
                </div>
  
                <div class="course-footer">
                  <div class="course-instructor">
                    <img :src="course.instructor.avatar" :alt="course.instructor.name" class="instructor-avatar" />
                    <span class="instructor-name">{{ course.instructor.name }}</span>
                  </div>
                  
                  <div class="course-actions">
                    <button class="btn-secondary" @click.stop="toggleBookmark(course)">
                      {{ course.bookmarked ? '❤️' : '🤍' }}
                    </button>
                    <button 
                      class="btn-primary" 
                      :class="{ 'premium-course': course.isPremium }"
                      @click.stop="handleCourseStart(course)"
                    >
                      Начать
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <div v-else class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Курсы не найдены</h3>
            <p>Попробуйте изменить фильтры или поисковый запрос</p>
            <button class="btn-primary" @click="clearFilters">Сбросить фильтры</button>
          </div>
        </div>
      </div>
  
      <div v-if="selectedCourse" class="course-modal-overlay" @click="closeCourseModal">
        <div class="course-modal" @click.stop>
          <div class="modal-header">
            <h2>{{ selectedCourse.title }}</h2>
            <button class="close-btn" @click="closeCourseModal">×</button>
          </div>
          
          <div class="modal-content">
            <div class="modal-image">
              <img :src="selectedCourse.thumbnail" :alt="selectedCourse.title" />
            </div>
            
            <div class="modal-info">
              <div class="course-details">
                <div class="detail-item">
                  <span class="detail-label">Категория:</span>
                  <span class="detail-value">{{ selectedCourse.category }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Уровень:</span>
                  <span class="detail-value">{{ selectedCourse.difficulty }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Длительность:</span>
                  <span class="detail-value">{{ selectedCourse.duration }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Студентов:</span>
                  <span class="detail-value">{{ selectedCourse.students }}</span>
                </div>
              </div>
              
              <p class="course-full-description">{{ selectedCourse.fullDescription }}</p>
              
              <div class="course-tools-list">
                <h4>Инструменты и технологии:</h4>
                <div class="tools-grid">
                  <span v-for="tool in selectedCourse.tools" :key="tool" class="tool-tag-large">
                    {{ tool }}
                  </span>
                </div>
              </div>
              
              <div class="course-curriculum">
                <h4>Программа курса:</h4>
                <div class="curriculum-list">
                  <div v-for="(lesson, index) in selectedCourse.curriculum" :key="index" class="curriculum-item">
                    <div class="lesson-number">{{ index + 1 }}</div>
                    <div class="lesson-info">
                      <h5>{{ lesson.title }}</h5>
                      <p>{{ lesson.description }}</p>
                      <span class="lesson-duration">{{ lesson.duration }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <div class="instructor-info">
              <img :src="selectedCourse.instructor.avatar" :alt="selectedCourse.instructor.name" class="instructor-avatar-large" />
              <div class="instructor-details">
                <h4>{{ selectedCourse.instructor.name }}</h4>
                <p>{{ selectedCourse.instructor.bio }}</p>
              </div>
            </div>
            
            <div class="modal-actions">
              <button class="btn-secondary" @click="toggleBookmark(selectedCourse)">
                {{ selectedCourse.bookmarked ? 'Удалить из избранного' : 'Добавить в избранное' }}
              </button>
              <button 
                class="btn-primary btn-large" 
                :class="{ 'premium-course': selectedCourse.isPremium }"
                @click="handleCourseStart(selectedCourse)"
              >
                Начать обучение
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <PaymentModal
        v-if="showPaymentModal"
        :visible="showPaymentModal"
        :userId="currentUserId"
        :defaultPlan="requiredPlan"
        :requestedTopicId="selectedCourseId"
        @close="closePaymentModal"
        @unlocked="handleCourseUnlocked"
        @payment-initiated="handlePaymentInitiated"
      />
    </div>
  </template>
  
  <script>
  import PaymentModal from '@/components/Modals/PaymentModal.vue';
  import { mapState, mapGetters } from 'vuex';
  
  export default {
    name: 'UpdatedCourses',
    
    components: {
      PaymentModal
    },
    
    data() {
      return {
        searchQuery: '',
        selectedCategory: '',
        selectedDifficulty: '',
        selectedDuration: '',
        sortBy: 'newest',
        selectedCourse: null,
        
        // ✅ NEW: Payment Modal State
        showPaymentModal: false,
        selectedCourseId: null,
        requiredPlan: 'pro', // Default to pro for premium courses
        
        categories: ['ИИ и автоматизация', 'Видеомонтаж', 'Графический дизайн', 'Web-разработка', 'Мобильная разработка', 'Машинное обучение'],
        difficultyLevels: ['Начинающий', 'Средний', 'Продвинутый'],
        durationOptions: ['< 2 часов', '2-5 часов', '5-10 часов', '> 10 часов'],
        
        courses: [
          {
            id: 1,
            title: 'Создание ИИ-помощника с OpenAI',
            description: 'Изучите, как создать своего собственного ИИ-помощника используя API OpenAI и современные инструменты разработки.',
            fullDescription: 'В этом курсе вы изучите полный процесс создания ИИ-помощника от концепции до развертывания. Мы рассмотрим работу с API OpenAI, создание пользовательского интерфейса, интеграцию с различными сервисами и оптимизацию производительности.',
            category: 'ИИ и автоматизация',
            difficulty: 'Средний',
            duration: '8 часов',
            thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
            students: '2.3k',
            rating: '4.8',
            bookmarked: false,
            isPremium: true, // ✅ NEW: Premium course
            tools: ['OpenAI API', 'Python', 'Flask', 'React', 'Docker'],
            instructor: {
              name: 'Алексей Петров',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
              bio: 'Senior AI Engineer с 8-летним опытом в машинном обучении и разработке ИИ-систем.'
            },
            curriculum: [
              { title: 'Введение в OpenAI API', description: 'Основы работы с API, настройка окружения', duration: '45 мин' },
              { title: 'Создание базового чат-бота', description: 'Разработка простого текстового помощника', duration: '90 мин' },
              { title: 'Интеграция с веб-интерфейсом', description: 'Создание пользовательского интерфейса', duration: '120 мин' },
              { title: 'Расширенные возможности', description: 'Работа с файлами, изображениями и функциями', duration: '180 мин' },
              { title: 'Развертывание и масштабирование', description: 'Деплой приложения и оптимизация', duration: '105 мин' }
            ]
          },
          {
            id: 2,
            title: 'Профессиональный монтаж в DaVinci Resolve',
            description: 'Освойте профессиональный видеомонтаж и цветокоррекцию в DaVinci Resolve 18. От базовых навыков до голливудского уровня.',
            fullDescription: 'Комплексный курс по DaVinci Resolve 18, который проведет вас через все этапы профессионального видеопроизводства. Изучите монтаж, цветокоррекцию, работу со звуком и визуальные эффекты.',
            category: 'Видеомонтаж',
            difficulty: 'Продвинутый',
            duration: '12 часов',
            thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=250&fit=crop',
            students: '1.8k',
            rating: '4.9',
            bookmarked: true,
            isPremium: true, // ✅ NEW: Premium course
            tools: ['DaVinci Resolve', 'Fusion', 'Fairlight', 'Color Grading'],
            instructor: {
              name: 'Мария Соколова',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
              bio: 'Режиссер монтажа с опытом работы над фильмами и рекламными роликами.'
            },
            curriculum: [
              { title: 'Интерфейс и настройка проекта', description: 'Знакомство с интерфейсом DaVinci Resolve', duration: '60 мин' },
              { title: 'Основы монтажа', description: 'Импорт, нарезка и сборка видео', duration: '150 мин' },
              { title: 'Профессиональная цветокоррекция', description: 'Color Grading и создание стильных looks', duration: '240 мин' },
              { title: 'Работа со звуком в Fairlight', description: 'Аудиомонтаж и мастеринг', duration: '120 мин' },
              { title: 'Визуальные эффекты в Fusion', description: 'Композитинг и VFX', duration: '180 мин' },
              { title: 'Экспорт и оптимизация', description: 'Рендеринг для различных платформ', duration: '90 мин' }
            ]
          },
          {
            id: 3,
            title: 'Генерация изображений с Midjourney & DALL-E',
            description: 'Мастер-класс по созданию профессиональных изображений с помощью ИИ. Изучите промпт-инжиниринг и продвинутые техники.',
            fullDescription: 'Углубленный курс по генерации изображений с помощью ИИ. Изучите все тонкости работы с Midjourney, DALL-E и другими инструментами для создания профессионального визуального контента.',
            category: 'ИИ и автоматизация',
            difficulty: 'Начинающий',
            duration: '6 часов',
            thumbnail: 'https://images.unsplash.com/photo-1686191128892-34c2d7d6d9b9?w=400&h=250&fit=crop',
            students: '3.5k',
            rating: '4.7',
            bookmarked: false,
            isPremium: false, // ✅ Free course
            tools: ['Midjourney', 'DALL-E', 'Stable Diffusion', 'Photoshop'],
            instructor: {
              name: 'Дмитрий Козлов',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
              bio: 'Digital-художник и эксперт по ИИ-генерации изображений с портфолио из 500+ проектов.'
            },
            curriculum: [
              { title: 'Введение в ИИ-генерацию', description: 'Обзор инструментов и возможностей', duration: '45 мин' },
              { title: 'Основы промпт-инжиниринга', description: 'Как правильно составлять запросы', duration: '90 мин' },
              { title: 'Работа с Midjourney', description: 'Освоение Discord-бота и команд', duration: '120 мин' },
              { title: 'DALL-E и альтернативы', description: 'Сравнение различных платформ', duration: '75 мин' },
              { title: 'Постобработка в Photoshop', description: 'Доработка сгенерированных изображений', duration: '105 мин' }
            ]
          },
          {
            id: 4,
            title: 'Создание SaaS-приложения на Next.js',
            description: 'Полное руководство по разработке современного SaaS-приложения с аутентификацией, платежами и развертыванием.',
            fullDescription: 'Создайте полноценное SaaS-приложение с нуля, используя современный стек технологий. Изучите Next.js 14, TypeScript, Prisma, Stripe, и развертывание на Vercel.',
            category: 'Web-разработка',
            difficulty: 'Продвинутый',
            duration: '15 часов',
            thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
            students: '1.2k',
            rating: '4.8',
            bookmarked: true,
            isPremium: true, // ✅ NEW: Premium course
            tools: ['Next.js', 'TypeScript', 'Prisma', 'Stripe', 'Vercel'],
            instructor: {
              name: 'Сергей Иванов',
              avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50&h=50&fit=crop&crop=face',
              bio: 'Fullstack разработчик и основатель трех успешных SaaS-продуктов.'
            },
            curriculum: [
              { title: 'Настройка проекта Next.js 14', description: 'Инициализация и конфигурация', duration: '60 мин' },
              { title: 'База данных и Prisma ORM', description: 'Моделирование данных и миграции', duration: '120 мин' },
              { title: 'Аутентификация и авторизация', description: 'NextAuth.js и защита роутов', duration: '150 мин' },
              { title: 'UI/UX с Tailwind CSS', description: 'Создание адаптивного интерфейса', duration: '180 мин' },
              { title: 'Интеграция платежей Stripe', description: 'Подписки и обработка платежей', duration: '200 мин' },
              { title: 'API и серверные компоненты', description: 'Backend функциональность', duration: '240 мин' },
              { title: 'Тестирование и развертывание', description: 'Jest, Cypress и деплой на Vercel', duration: '150 мин' }
            ]
          },
          {
            id: 5,
            title: 'Мобильные приложения на React Native',
            description: 'Создавайте кроссплатформенные мобильные приложения для iOS и Android с помощью React Native и Expo.',
            fullDescription: 'Изучите разработку мобильных приложений с использованием React Native. От настройки среды разработки до публикации в App Store и Google Play.',
            category: 'Мобильная разработка',
            difficulty: 'Средний',
            duration: '10 часов',
            thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
            students: '2.1k',
            rating: '4.6',
            bookmarked: false,
            isPremium: false, // ✅ Free course
            tools: ['React Native', 'Expo', 'TypeScript', 'Firebase', 'Redux'],
            instructor: {
              name: 'Анна Волкова',
              avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
              bio: 'Lead Mobile Developer с опытом разработки приложений для крупных компаний.'
            },
            curriculum: [
              { title: 'Настройка среды разработки', description: 'Expo CLI и эмуляторы', duration: '45 мин' },
              { title: 'Основы React Native', description: 'Компоненты и навигация', duration: '120 мин' },
              { title: 'Работа с API и состоянием', description: 'Redux Toolkit и async thunks', duration: '150 мин' },
              { title: 'Нативные функции', description: 'Камера, GPS, уведомления', duration: '180 мин' },
              { title: 'Стилизация и анимации', description: 'Responsive design и Animated API', duration: '135 мин' },
              { title: 'Публикация приложений', description: 'App Store и Google Play', duration: '90 мин' }
            ]
          },
          {
            id: 6,
            title: 'Machine Learning с Python и TensorFlow',
            description: 'Углубленный курс по машинному обучению. От линейной регрессии до глубоких нейронных сетей.',
            fullDescription: 'Комплексное изучение машинного обучения с практическими проектами. Освойте алгоритмы ML, работу с данными и создание собственных моделей.',
            category: 'Машинное обучение',
            difficulty: 'Продвинутый',
            duration: '20 часов',
            thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop',
            students: '1.5k',
            rating: '4.9',
            bookmarked: false,
            isPremium: true, // ✅ NEW: Premium course
            tools: ['Python', 'TensorFlow', 'Keras', 'Pandas', 'NumPy', 'Jupyter'],
            instructor: {
              name: 'Игорь Смирнов',
              avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=50&h=50&fit=crop&crop=face',
              bio: 'PhD в области машинного обучения, исследователь и консультант по ИИ.'
            },
            curriculum: [
              { title: 'Основы ML и подготовка данных', description: 'Preprocessing, feature engineering', duration: '180 мин' },
              { title: 'Линейная и логистическая регрессия', description: 'Классические алгоритмы ML', duration: '150 мин' },
              { title: 'Деревья решений и ансамбли', description: 'Random Forest, Gradient Boosting', duration: '200 мин' },
              { title: 'Нейронные сети с TensorFlow', description: 'Deep Learning основы', duration: '300 мин' },
              { title: 'Компьютерное зрение', description: 'CNN и обработка изображений', duration: '250 мин' },
              { title: 'NLP и обработка текста', description: 'RNN, LSTM, Transformers', duration: '280 мин' },
              { title: 'Развертывание ML моделей', description: 'Production ML с Docker и API', duration: '240 мин' }
            ]
          }
        ]
      };
    },
  
    computed: {
      ...mapState(['user']),
      ...mapGetters('user', ['userStatus', 'isPremiumUser', 'isStartUser', 'isProUser']),
  
      // ✅ NEW: Get current user ID
      currentUserId() {
        return this.user?.uid || this.$store.getters['user/getUserId'] || localStorage.getItem('firebaseUserId');
      },
  
      // ✅ NEW: Get current user plan
      currentUserPlan() {
        const storeStatus = this.userStatus;
        const localStatus = localStorage.getItem('userStatus');
        const subscriptionData = localStorage.getItem('subscriptionData');
        
        let subscriptionPlan = null;
        if (subscriptionData) {
          try {
            const parsed = JSON.parse(subscriptionData);
            const now = new Date();
            const expiry = parsed.expiryDate ? new Date(parsed.expiryDate) : null;
            if (parsed.plan && expiry && now < expiry && parsed.plan !== 'free') {
              subscriptionPlan = parsed.plan;
            }
          } catch (e) {
            console.error('Error parsing subscription data:', e);
          }
        }
        
        return subscriptionPlan || storeStatus || localStatus || 'free';
      },
  
      filteredCourses() {
        let filtered = this.courses;
  
        // Filter by search query
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter(course => 
            course.title.toLowerCase().includes(query) ||
            course.description.toLowerCase().includes(query) ||
            course.tools.some(tool => tool.toLowerCase().includes(query))
          );
        }
  
        // Filter by category
        if (this.selectedCategory) {
          filtered = filtered.filter(course => course.category === this.selectedCategory);
        }
  
        // Filter by difficulty
        if (this.selectedDifficulty) {
          filtered = filtered.filter(course => course.difficulty === this.selectedDifficulty);
        }
  
        // Filter by duration
        if (this.selectedDuration) {
          filtered = filtered.filter(course => {
            const hours = parseInt(course.duration);
            switch (this.selectedDuration) {
              case '< 2 часов': return hours < 2;
              case '2-5 часов': return hours >= 2 && hours <= 5;
              case '5-10 часов': return hours >= 5 && hours <= 10;
              case '> 10 часов': return hours > 10;
              default: return true;
            }
          });
        }
  
        return filtered;
      },
  
      sortedCourses() {
        const courses = [...this.filteredCourses];
        
        switch (this.sortBy) {
          case 'popular':
            return courses.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
          case 'duration':
            return courses.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
          case 'difficulty':
            const difficultyOrder = { 'Начинающий': 1, 'Средний': 2, 'Продвинутый': 3 };
            return courses.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
          case 'newest':
          default:
            return courses.sort((a, b) => b.id - a.id);
        }
      },
  
      totalDuration() {
        return this.filteredCourses.reduce((total, course) => {
          const durationValue = parseInt(course.duration);
          return total + (isNaN(durationValue) ? 0 : durationValue);
        }, 0);
      },
  
      hasActiveFilters() {
        return this.selectedCategory || this.selectedDifficulty || this.selectedDuration || this.searchQuery;
      }
    },
  
    methods: {
      setCategory(category) {
        this.selectedCategory = this.selectedCategory === category ? '' : category;
      },
  
      setDifficulty(difficulty) {
        this.selectedDifficulty = this.selectedDifficulty === difficulty ? '' : difficulty;
      },
  
      setDuration(duration) {
        this.selectedDuration = this.selectedDuration === duration ? '' : duration;
      },
  
      clearFilters() {
        this.selectedCategory = '';
        this.selectedDifficulty = '';
        this.selectedDuration = '';
        this.searchQuery = '';
      },
  
      getCategoryIcon(category) {
        const icons = {
          'ИИ и автоматизация': '🤖',
          'Видеомонтаж': '🎬',
          'Графический дизайн': '🎨',
          'Web-разработка': '💻',
          'Мобильная разработка': '📱',
          'Машинное обучение': '🧠'
        };
        return icons[category] || '📚';
      },
  
      getDifficultyIcon(difficulty) {
        const icons = {
          'Начинающий': '🟢',
          'Средний': '🟡',
          'Продвинутый': '🔴'
        };
        return icons[difficulty] || '⚪';
      },
  
      getSectionTitle() {
        if (this.hasActiveFilters) {
          return `Найдено курсов: ${this.filteredCourses.length}`;
        }
        return 'Все актуальные курсы';
      },
  
      openCourse(course) {
        this.selectedCourse = course;
        document.body.style.overflow = 'hidden';
      },
  
      closeCourseModal() {
        this.selectedCourse = null;
        document.body.style.overflow = 'auto';
      },
  
      toggleBookmark(course) {
        course.bookmarked = !course.bookmarked;
        // Here you would typically make an API call to save the bookmark status
        
        if (this.$toast) {
          const message = course.bookmarked ? 
            'Курс добавлен в избранное' : 
            'Курс удален из избранного';
          this.$toast.success(message, { duration: 2000 });
        }
      },
  
      // ✅ NEW: Check if user has access to specific course
      hasAccessToCourse(course) {
        if (!course.isPremium) {
          return true; // Free courses are always accessible
        }
        
        const plan = this.currentUserPlan;
        return ['start', 'pro'].includes(plan);
      },
  
      // ✅ NEW: Handle course start action
      handleCourseStart(course) {
        console.log('🎓 Starting course:', course.title);
        console.log('👤 User plan:', this.currentUserPlan);
        console.log('🔒 Is premium course:', course.isPremium);
        
        // Check if user has access to the course
        if (course.isPremium && !this.hasAccessToCourse(course)) {
          // Show payment modal for premium courses
          this.selectedCourseId = course.id.toString();
          this.requiredPlan = 'pro'; // Premium courses require Pro plan
          this.showPaymentModal = true;
          
          // Close course modal if open
          if (this.selectedCourse) {
            this.closeCourseModal();
          }
          
          console.log('💳 Showing payment modal for premium course');
          return;
        }
        
        // User has access - start the course
        this.startCourse(course);
      },
  
      // ✅ NEW: Start course (redirect to course content)
      startCourse(course) {
        console.log('🚀 Starting course:', course.title);
        
        // Here you would typically navigate to the course content page
        // For now, we'll show a success message
        if (this.$toast) {
          this.$toast.success(`Начинаем курс: ${course.title}`, {
            duration: 3000,
            position: 'top-center'
          });
        }
        
        // Example navigation (replace with your actual course route)
        // this.$router.push({ 
        //  name: 'CourseContent', 
        //  params: { courseId: course.id }
        // });
        
        // Close modals
        this.closeCourseModal();
      },
  
      // ✅ NEW: Close payment modal
      closePaymentModal() {
        this.showPaymentModal = false;
        this.selectedCourseId = null;
      },
  
      // ✅ NEW: Handle successful course unlock
      handleCourseUnlocked(data) {
        console.log('🔓 Course unlocked:', data);
        
        this.closePaymentModal();
        
        // Find the course that was unlocked
        const course = this.courses.find(c => c.id.toString() === this.selectedCourseId);
        if (course) {
          // Start the course immediately after unlock
          setTimeout(() => {
            this.startCourse(course);
          }, 1000);
        }
        
        // Update user status in store if needed
        if (data.plan) {
          this.$store.commit('user/SET_USER_STATUS', data.plan);
          localStorage.setItem('userStatus', data.plan);
        }
      },
  
      // ✅ NEW: Handle payment initiated
      handlePaymentInitiated(data) {
        console.log('💳 Payment initiated:', data);
        
        // The PaymentModal will handle navigation to payment page
        // We just need to close our modal
        this.closePaymentModal();
      }
    },
  
    beforeUnmount() {
      document.body.style.overflow = 'auto';
    }
  };
  </script>
  
  <style scoped>
  .updated-courses-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
  }
  
  /* Hero Section */
  .hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 60vh;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
  }
  
  .hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="0.5" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="0.3" fill="white" opacity="0.08"/><circle cx="50" cy="10" r="0.4" fill="white" opacity="0.06"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
  }
  
  .hero-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    position: relative;
    z-index: 2;
  }
  
  .hero-text {
    color: white;
  }
  
  .hero-title {
    font-size: 4rem;
    font-weight: 800;
    margin: 0 0 1rem;
    line-height: 1.1;
  }
  
  .gradient-text {
    background: linear-gradient(45deg, #ffffff, #e0e7ff, #c7d2fe);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 200% 200%;
    animation: gradientShift 3s ease-in-out infinite;
  }
  
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  .hero-subtitle {
    font-size: 1.3rem;
    margin: 0 0 2rem;
    line-height: 1.6;
    opacity: 0.9;
  }
  
  .hero-stats {
    display: flex;
    gap: 2rem;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
  }
  
  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .hero-visual {
    position: relative;
    height: 400px;
  }
  
  .floating-card {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: float 6s ease-in-out infinite;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .floating-card:nth-child(1) {
    top: 20%;
    left: 10%;
    animation-delay: 0s;
  }
  
  .floating-card-delayed {
    top: 50%;
    right: 20%;
    animation-delay: 2s;
  }
  
  .floating-card-delayed-2 {
    bottom: 20%;
    left: 30%;
    animation-delay: 4s;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(1deg); }
    66% { transform: translateY(10px) rotate(-1deg); }
  }
  
  .card-icon {
    font-size: 2rem;
  }
  
  .card-text {
    font-weight: 600;
    color: #4c1d95;
    font-size: 0.9rem;
  }
  
  /* Filters Section */
  .filters-section {
    background: white;
    padding: 3rem 0;
    position: relative;
    z-index: 3;
    margin-top: -2rem;
    border-radius: 2rem 2rem 0 0;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  
  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .filters-header h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }
  
  .clear-filters {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .clear-filters:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
  }
  
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-label {
    font-weight: 600;
    color: #374151;
    font-size: 1.1rem;
  }
  
  .filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .filter-chip {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    color: #64748b;
    padding: 0.75rem 1.25rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  }
  
  .filter-chip:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
  }
  
  .filter-chip.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: #667eea;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
  
  .search-group {
    grid-column: 1 / -1;
  }
  
  .search-input-container {
    position: relative;
  }
  
  .search-input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: #f8fafc;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.2rem;
    color: #9ca3af;
  }
  
  /* Courses Section */
  .courses-section {
    background: white;
    padding: 3rem 0 4rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
  }
  
  .section-header h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }
  
  .sort-select {
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-weight: 600;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .sort-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 2rem;
  }
  
  .course-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #f1f5f9;
  }
  
  .course-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    border-color: #667eea;
  }
  
  .course-image {
    position: relative;
    height: 220px;
    overflow: hidden;
  }
  
  .course-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .course-card:hover .course-image img {
    transform: scale(1.05);
  }
  
  .course-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .course-category {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
  }
  
  .course-duration {
    background: rgba(255, 255, 255, 0.95);
    color: #374151;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
  }
  
  .course-difficulty {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
    border: 2px solid white;
  }
  
  .course-difficulty.начинающий {
    background: rgba(34, 197, 94, 0.9);
  }
  
  .course-difficulty.средний {
    background: rgba(251, 191, 36, 0.9);
  }
  
  .course-difficulty.продвинутый {
    background: rgba(239, 68, 68, 0.9);
  }
  
  .course-content {
    padding: 1.5rem;
  }
  
  .course-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.75rem;
    line-height: 1.3;
  }
  
  .course-description {
    color: #6b7280;
    line-height: 1.6;
    margin: 0 0 1.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .course-meta {
    margin-bottom: 1.5rem;
  }
  
  .course-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .tool-tag {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .tool-more {
    background: #f1f5f9;
    color: #64748b;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .course-stats {
    display: flex;
    gap: 1rem;
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: #6b7280;
  }
  
  .stat-icon {
    font-size: 1rem;
  }
  
  .course-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .course-instructor {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .instructor-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .instructor-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #374151;
  }
  
  .course-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  
  .btn-secondary {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    color: #64748b;
    padding: 0.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1.1rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-secondary:hover {
    background: #e2e8f0;
    transform: scale(1.1);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
  
  .btn-large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .empty-state h3 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
    color: #374151;
  }
  
  .empty-state p {
    margin: 0 0 2rem;
    font-size: 1.1rem;
  }
  
  /* Course Modal */
  .course-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    backdrop-filter: blur(4px);
  }
  
  .course-modal {
    background: white;
    border-radius: 24px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.2);
  }
  
  .modal-header {
    padding: 2rem 2rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border-radius: 24px 24px 0 0;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
  }
  
  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 2rem;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  .modal-content {
    padding: 2rem;
  }
  
  .modal-image {
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 2rem;
  }
  
  .modal-image img {
    width: 100%;
    height: 300px;
    object-fit: cover;
  }
  
  .course-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 16px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .detail-label {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 600;
  }
  
  .detail-value {
    font-size: 1.1rem;
    color: #1f2937;
    font-weight: 700;
  }
  
  .course-full-description {
    font-size: 1.1rem;
    line-height: 1.7;
    color: #374151;
    margin: 0 0 2rem;
  }
  
  .course-tools-list h4,
  .course-curriculum h4 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1rem;
  }
  
  .tools-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  
  .tool-tag-large {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 16px;
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .curriculum-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .curriculum-item {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 16px;
    transition: all 0.3s ease;
  }
  
  .curriculum-item:hover {
    background: #e2e8f0;
    transform: translateX(4px);
  }
  
  .lesson-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
  }
  
  .lesson-info h5 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .lesson-info p {
    margin: 0 0 0.5rem;
    color: #6b7280;
    line-height: 1.5;
  }
  
  .lesson-duration {
    font-size: 0.9rem;
    color: #667eea;
    font-weight: 600;
  }
  
  .modal-footer {
    padding: 2rem;
    border-top: 1px solid #e5e7eb;
    background: #f8fafc;
    border-radius: 0 0 24px 24px;
  }
  
  .instructor-info {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .instructor-avatar-large {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .instructor-details h4 {
    margin: 0 0 0.5rem;
    font-size: 1.2rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .instructor-details p {
    margin: 0;
    color: #6b7280;
    line-height: 1.5;
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  
  /* ✅ NEW: Premium Course Styling */
  .premium-badge-overlay {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
  
  .btn-primary.premium-course {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: 1px solid #f59e0b;
  }
  
  .btn-primary.premium-course:hover {
    background: linear-gradient(135deg, #d97706, #b45309);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
  }
  
  .course-card:has(.premium-badge-overlay) {
    border: 2px solid #f59e0b20;
  }
  
  .course-card:has(.premium-badge-overlay):hover {
    border-color: #f59e0b;
    box-shadow: 0 20px 40px rgba(245, 158, 11, 0.15);
  }
  
  /* Enhanced course overlay positioning */
  .course-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .hero-content {
      grid-template-columns: 1fr;
      gap: 2rem;
      text-align: center;
    }
  
    .hero-title {
      font-size: 2.5rem;
    }
  
    .hero-stats {
      justify-content: center;
    }
  
    .hero-visual {
      height: 200px;
    }
  
    .floating-card {
      position: relative;
      display: inline-flex;
      margin: 0.5rem;
    }
  
    .floating-card:nth-child(1),
    .floating-card-delayed,
    .floating-card-delayed-2 {
      position: relative;
      top: auto;
      left: auto;
      right: auto;
      bottom: auto;
    }
  
    .filters-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  
    .courses-grid {
      grid-template-columns: 1fr;
    }
  
    .course-modal {
      margin: 1rem;
      max-height: 95vh;
    }
  
    .modal-content {
      padding: 1.5rem;
    }
  
    .course-details {
      grid-template-columns: 1fr;
    }
  
    .modal-actions {
      flex-direction: column;
    }
  
    .instructor-info {
      flex-direction: column;
      text-align: center;
    }
  }
  
  @media (max-width: 480px) {
    .container {
      padding: 0 1rem;
    }
  
    .hero-title {
      font-size: 2rem;
    }
  
    .hero-subtitle {
      font-size: 1.1rem;
    }
  
    .filters-section {
      padding: 2rem 0;
    }
  
    .courses-section {
      padding: 2rem 0;
    }
  
    .course-card {
      margin: 0 0.5rem;
    }
  }
  </style>