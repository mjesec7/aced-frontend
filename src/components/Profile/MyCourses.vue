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
              <h1 class="page-title">Мои курсы</h1>
              <p class="page-subtitle">{{ filteredCourses.length }} {{ getCourseWord(filteredCourses.length) }}</p>
            </div>
          </div>
          <div class="header-actions">
            <router-link to="/profile/catalogue" class="add-course-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Добавить курс
            </router-link>
          </div>
        </div>
      </div>
  
      <!-- Filters Bar -->
      <div class="filters-section">
        <div class="filters-content">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="search-input" 
              placeholder="Поиск курсов..."
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
  
          <div class="filter-controls">
            <select v-model="filterProgress" class="filter-select">
              <option value="">Все курсы</option>
              <option value="not-started">Не начаты</option>
              <option value="in-progress">В процессе</option>
              <option value="completed">Завершены</option>
            </select>
  
            <select v-model="filterSubject" class="filter-select">
              <option value="">Все предметы</option>
              <option v-for="subject in subjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
  
            <select v-model="sortBy" class="filter-select">
              <option value="recent">По дате</option>
              <option value="progress">По прогрессу</option>
              <option value="name">По названию</option>
              <option value="level">По уровню</option>
            </select>
  
            <button 
              v-if="hasActiveFilters" 
              @click="clearFilters" 
              class="clear-filters-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Очистить
            </button>
          </div>
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
            <div class="stat-label">Всего</div>
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
            <div class="stat-label">В процессе</div>
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
            <div class="stat-label">Завершено</div>
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
            <div class="stat-value">{{ totalHours }}ч</div>
            <div class="stat-label">Изучено</div>
          </div>
        </div>
      </div>
  
      <!-- Courses Grid -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка курсов...</p>
      </div>
  
      <div v-else-if="filteredCourses.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <h3 class="empty-title">
          {{ hasActiveFilters ? 'Курсы не найдены' : 'У вас пока нет курсов' }}
        </h3>
        <p class="empty-text">
          {{ hasActiveFilters 
            ? 'Попробуйте изменить фильтры поиска' 
            : 'Добавьте курсы из каталога, чтобы начать обучение'
          }}
        </p>
        <div class="empty-actions">
          <button v-if="hasActiveFilters" @click="clearFilters" class="secondary-btn">
            Очистить фильтры
          </button>
          <router-link to="/profile/catalogue" class="primary-btn">
            Перейти в каталог
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
                  Открыть курс
                </button>
                <button @click="removeCourse(course)" class="menu-item danger">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Удалить
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
                {{ course.subject || 'Общий' }}
              </span>
              <span class="meta-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Уровень {{ course.level || 1 }}
              </span>
            </div>
  
            <!-- Progress Section -->
            <div class="progress-section">
              <div class="progress-info">
                <span class="progress-label">Прогресс</span>
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
              Продолжить
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
  
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
        requestedTopicId: null
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
        
        // Search filter
        if (this.searchQuery.trim()) {
          const query = this.searchQuery.toLowerCase();
          courses = courses.filter(course => {
            const name = this.getCourseName(course).toLowerCase();
            const subject = (course.subject || '').toLowerCase();
            return name.includes(query) || subject.includes(query);
          });
        }
        
        // Progress filter
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
        
        // Subject filter
        if (this.filterSubject) {
          courses = courses.filter(course => course.subject === this.filterSubject);
        }
        
        // Sort
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
        const minutes = this.studyList.reduce((sum, c) => 
          sum + (c.progress?.completedTime || 0), 0
        );
        return (minutes / 60).toFixed(1);
      },
      
      hasActiveFilters() {
        return !!(this.searchQuery || this.filterProgress || this.filterSubject);
      }
    },
    
    async mounted() {
      await this.initialize();
      
      // Close menu on outside click
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
          console.error('Error loading courses:', error);
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
            
            enriched.push({
              ...topic,
              progress,
              lastAccessed: entry.lastAccessed || new Date().toISOString()
            });
          } catch (error) {
            console.error(`Error enriching ${entry.topicId}:`, error);
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
            totalTime: 0
          };
        }
        
        let completed = 0;
        let completedTime = 0;
        let totalTime = 0;
        
        lessons.forEach(lesson => {
          const lessonTime = lesson.estimatedTime || lesson.duration || 10;
          totalTime += lessonTime;
          
          const progress = this.userProgress.find(p => 
            (p.lessonId?._id || p.lessonId) === lesson._id
          );
          
          if (progress?.completed) {
            completed++;
            completedTime += lessonTime;
          }
        });
        
        return {
          percent: Math.round((completed / lessons.length) * 100),
          completedLessons: completed,
          totalLessons: lessons.length,
          completedTime,
          totalTime
        };
      },
      
      getCourseName(course) {
        return course.name || course.topicName || course.topic || course.title || 'Без названия';
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
        if (!minutes) return '0 мин';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}ч ${mins}м`;
        return `${mins} мин`;
      },
      
      getNextLesson(course) {
        if (!course.lessons || course.lessons.length === 0) return 'Нет уроков';
        
        const completed = course.progress?.completedLessons || 0;
        if (completed >= course.lessons.length) return 'Курс завершен';
        
        const next = course.lessons[completed];
        return next?.lessonName || next?.title || `Урок ${completed + 1}`;
      },
      
      getCourseWord(count) {
        if (count % 10 === 1 && count % 100 !== 11) return 'курс';
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'курса';
        return 'курсов';
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
      
      async removeCourse(course) {
        if (!confirm(`Удалить курс "${this.getCourseName(course)}"?`)) return;
        
        try {
          await removeFromStudyList(this.userId, course._id);
          this.studyList = this.studyList.filter(c => c._id !== course._id);
          this.activeMenu = null;
        } catch (error) {
          console.error('Error removing course:', error);
          alert('Не удалось удалить курс');
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
  
  /* Filters */
  .filters-section {
    max-width: 1400px;
    margin: 0 auto 1.5rem;
  }
  
  .filters-content {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  @media (min-width: 768px) {
    .filters-content {
      flex-direction: row;
      align-items: center;
    }
  }
  
  .search-box {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  
  .search-icon {
    position: absolute;
    left: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.125rem;
    height: 1.125rem;
    color: #9ca3af;
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 0.625rem 2.75rem 0.625rem 2.625rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #a855f7;
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }
  
  .clear-btn {
    position: absolute;
    right: 0.625rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #6b7280;
  }
  
  .clear-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .clear-btn:hover {
    background: #e5e7eb;
    color: #111827;
  }
  
  .filter-controls {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .filter-select {
    padding: 0.625rem 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .filter-select:focus {
    outline: none;
    border-color: #a855f7;
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }
  
  .clear-filters-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .clear-filters-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .clear-filters-btn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #111827;
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
      padding: 1rem;
    }
  
    .filter-controls {
      width: 100%;
    }
  
    .filter-select {
      flex: 1;
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
  }
  
  /* Focus States */
  .back-btn:focus,
  .add-course-btn:focus,
  .search-input:focus,
  .filter-select:focus,
  .clear-filters-btn:focus,
  .continue-btn:focus,
  .menu-btn:focus {
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