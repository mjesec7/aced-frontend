<template>
    <div class="courses-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">Master AI Skills in 2024</h1>
            <p class="hero-subtitle">
              Stay ahead with cutting-edge AI courses. Get unlimited access to learning 
              and transform your career with the latest AI technologies.
            </p>
            <div class="hero-stats">
              <div class="stat">
                <span class="stat-number">{{ filteredCourses.length }}</span>
                <span class="stat-label">Courses</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ totalHours }}</span>
                <span class="stat-label">Hours</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ availableCategories.length }}</span>
                <span class="stat-label">Categories</span>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Filters Section -->
      <section class="filters">
        <div class="container">
          <div class="filters-header">
            <h2>Popular AI Courses</h2>
            <div class="results-count">
              {{ filteredCourses.length }} courses found
            </div>
          </div>
          
          <div class="filters-content">
            <!-- Quick Filters -->
            <div class="filter-row">
              <div class="filter-chips">
                <button 
                  class="chip"
                  :class="{ active: !selectedFilter }"
                  @click="setFilter('')"
                >
                  All Courses
                </button>
                <button 
                  class="chip"
                  :class="{ active: selectedFilter === 'popular' }"
                  @click="setFilter('popular')"
                >
                  Most Popular
                </button>
                <button 
                  class="chip"
                  :class="{ active: selectedFilter === 'recent' }"
                  @click="setFilter('recent')"
                >
                  Latest
                </button>
                <button 
                  class="chip"
                  :class="{ active: selectedFilter === 'free' }"
                  @click="setFilter('free')"
                >
                  Free
                </button>
              </div>
            </div>
  
            <!-- Category Filter -->
            <div class="filter-row" v-if="availableCategories.length">
              <div class="filter-label">Categories:</div>
              <div class="filter-chips">
                <button 
                  v-for="category in availableCategories" 
                  :key="category"
                  class="chip category-chip"
                  :class="{ active: selectedCategory === category }"
                  @click="setCategory(category)"
                >
                  {{ category }}
                </button>
              </div>
            </div>
  
            <!-- Search -->
            <div class="search-container">
              <div class="search-input-wrapper">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search courses..."
                  class="search-input"
                />
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <button 
                v-if="hasActiveFilters" 
                @click="clearAllFilters"
                class="clear-btn"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Content Section -->
      <section class="content">
        <div class="container">
          <!-- Loading State -->
          <div v-if="loading" class="loading-grid">
            <div v-for="n in 6" :key="n" class="course-skeleton">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line medium"></div>
              </div>
            </div>
          </div>
  
          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Failed to load courses</h3>
            <p>{{ error }}</p>
            <button @click="fetchCourses" class="retry-btn">Try Again</button>
          </div>
  
          <!-- Courses Grid -->
          <div v-else-if="filteredCourses.length" class="courses-grid">
            <article 
              v-for="course in paginatedCourses" 
              :key="course.id"
              class="course-card"
              @click="openCourseModal(course)"
            >
              <div class="course-image">
                <img 
                  :src="course.thumbnail" 
                  :alt="course.title"
                  @error="handleImageError"
                />
                <div class="course-badges">
                  <span v-if="course.isNew" class="badge new">New</span>
                  <span v-if="course.isPopular" class="badge popular">Popular</span>
                  <span v-if="!course.isPremium" class="badge free">Free</span>
                  <span v-if="course.isPremium" class="badge premium">Premium</span>
                </div>
              </div>
              
              <div class="course-content">
                <div class="course-meta">
                  <span class="category">{{ course.category }}</span>
                  <span class="difficulty" :class="getDifficultyClass(course.difficulty)">
                    {{ course.difficulty }}
                  </span>
                </div>
                
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-description">{{ course.description }}</p>
                
                <div class="course-stats">
                  <div v-if="course.rating" class="stat">
                    <span class="icon">⭐</span>
                    <span>{{ course.rating }}</span>
                  </div>
                  <div v-if="course.studentsCount" class="stat">
                    <span class="icon">👥</span>
                    <span>{{ formatNumber(course.studentsCount) }}</span>
                  </div>
                  <div v-if="course.duration" class="stat">
                    <span class="icon">⏰</span>
                    <span>{{ course.duration }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
  
          <!-- Empty State -->
          <div v-else class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No courses found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button @click="clearAllFilters" class="clear-btn">Clear Filters</button>
          </div>
  
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1"
              class="page-btn"
            >
              Previous
            </button>
            <span class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              Next
            </button>
          </div>
        </div>
      </section>
  
      <!-- Course Modal -->
      <div v-if="selectedCourse" class="modal-overlay" @click="closeCourseModal">
        <div class="modal" @click.stop>
          <header class="modal-header">
            <div class="modal-badges">
              <span v-if="selectedCourse.isNew" class="badge new">New</span>
              <span v-if="selectedCourse.isPopular" class="badge popular">Popular</span>
              <span v-if="!selectedCourse.isPremium" class="badge free">Free</span>
              <span v-if="selectedCourse.isPremium" class="badge premium">Premium</span>
            </div>
            <button @click="closeCourseModal" class="close-btn">×</button>
          </header>
  
          <div class="modal-content">
            <div class="modal-image">
              <img :src="selectedCourse.thumbnail" :alt="selectedCourse.title" />
            </div>
            
            <div class="modal-body">
              <h2 class="modal-title">{{ selectedCourse.title }}</h2>
              
              <div class="modal-stats">
                <div v-if="selectedCourse.rating" class="stat">
                  <span class="icon">⭐</span>
                  <span>{{ selectedCourse.rating }} rating</span>
                </div>
                <div v-if="selectedCourse.studentsCount" class="stat">
                  <span class="icon">👥</span>
                  <span>{{ formatNumber(selectedCourse.studentsCount) }} students</span>
                </div>
                <div v-if="selectedCourse.duration" class="stat">
                  <span class="icon">⏰</span>
                  <span>{{ selectedCourse.duration }}</span>
                </div>
                <div v-if="selectedCourse.difficulty" class="stat">
                  <span class="icon">📊</span>
                  <span>{{ selectedCourse.difficulty }}</span>
                </div>
              </div>
  
              <div class="modal-tags">
                <span class="tag">{{ selectedCourse.category }}</span>
                <span class="tag" :class="{ premium: selectedCourse.isPremium }">
                  {{ selectedCourse.isPremium ? 'Premium Course' : 'Free Course' }}
                </span>
              </div>
  
              <div class="modal-section">
                <h3>Course Overview</h3>
                <p>{{ selectedCourse.fullDescription || selectedCourse.description }}</p>
              </div>
  
              <div v-if="selectedCourse.curriculum?.length" class="modal-section">
                <h3>Curriculum</h3>
                <div class="curriculum">
                  <div 
                    v-for="(lesson, index) in selectedCourse.curriculum" 
                    :key="index" 
                    class="curriculum-item"
                  >
                    <span class="lesson-number">{{ index + 1 }}</span>
                    <div class="lesson-content">
                      <h4>{{ lesson.title }}</h4>
                      <p v-if="lesson.description">{{ lesson.description }}</p>
                      <span v-if="lesson.duration" class="lesson-duration">{{ lesson.duration }}</span>
                    </div>
                  </div>
                </div>
              </div>
  
              <div v-if="selectedCourse.instructor" class="instructor-info">
                <img 
                  :src="selectedCourse.instructor.avatar" 
                  :alt="selectedCourse.instructor.name"
                  class="instructor-avatar"
                />
                <div>
                  <h4>{{ selectedCourse.instructor.name }}</h4>
                  <p>{{ selectedCourse.instructor.bio || 'AI Expert and Course Creator' }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <footer class="modal-footer">
            <button @click="toggleBookmark(selectedCourse)" class="btn-secondary">
              {{ selectedCourse.isBookmarked ? '❤️ Bookmarked' : '🤍 Bookmark' }}
            </button>
            <button 
              @click="handleCourseStart(selectedCourse)"
              class="btn-primary"
              :class="{ premium: selectedCourse.isPremium && !hasAccess(selectedCourse) }"
            >
              {{ getStartButtonText(selectedCourse) }}
            </button>
          </footer>
        </div>
      </div>
  
      <!-- Payment Modal -->
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
  import { mapState, mapGetters } from 'vuex';
  import PaymentModal from '@/components/Modals/PaymentModal.vue';
  
  export default {
    name: 'CoursesPage',
    
    components: {
      PaymentModal
    },
    
    data() {
      return {
        // Filter state
        searchQuery: '',
        selectedCategory: '',
        selectedFilter: '',
        
        // Pagination
        currentPage: 1,
        coursesPerPage: 12,
        
        // Modal state
        selectedCourse: null,
        showPaymentModal: false,
        selectedCourseId: null,
        requiredPlan: 'pro',
        
        // Data state
        courses: [],
        loading: false,
        error: null
      };
    },
  
    computed: {
      ...mapState(['user']),
      ...mapGetters('user', ['userStatus', 'isPremiumUser']),
  
      currentUserId() {
        return this.user?.uid || this.$store.getters['user/getUserId'];
      },
  
      currentUserPlan() {
        return this.userStatus || 'free';
      },
  
      availableCategories() {
        return [...new Set(this.courses.map(course => course.category))].filter(Boolean);
      },
  
      filteredCourses() {
        let filtered = [...this.courses];
  
        // Apply search filter
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter(course => 
            course.title?.toLowerCase().includes(query) ||
            course.description?.toLowerCase().includes(query) ||
            course.category?.toLowerCase().includes(query)
          );
        }
  
        // Apply category filter
        if (this.selectedCategory) {
          filtered = filtered.filter(course => course.category === this.selectedCategory);
        }
  
        // Apply quick filters
        if (this.selectedFilter) {
          switch (this.selectedFilter) {
            case 'popular':
              filtered = filtered.filter(course => course.isPopular);
              break;
            case 'recent':
              filtered = filtered.filter(course => course.isNew);
              break;
            case 'free':
              filtered = filtered.filter(course => !course.isPremium);
              break;
          }
        }
  
        return filtered;
      },
  
      paginatedCourses() {
        const start = (this.currentPage - 1) * this.coursesPerPage;
        const end = start + this.coursesPerPage;
        return this.filteredCourses.slice(start, end);
      },
  
      totalPages() {
        return Math.ceil(this.filteredCourses.length / this.coursesPerPage);
      },
  
      totalHours() {
        return this.filteredCourses.reduce((total, course) => {
          const hours = this.parseDuration(course.duration);
          return total + hours;
        }, 0);
      },
  
      hasActiveFilters() {
        return this.selectedCategory || this.selectedFilter || this.searchQuery;
      }
    },
  
    async mounted() {
      await this.fetchCourses();
    },
  
    methods: {
      async fetchCourses() {
        this.loading = true;
        this.error = null;
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/courses`, {
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const data = await response.json();
          this.courses = data.courses || [];
          
        } catch (error) {
          console.error('Error fetching courses:', error);
          this.error = error.message || 'Failed to load courses';
        } finally {
          this.loading = false;
        }
      },
  
      async toggleBookmark(course) {
        try {
          const method = course.isBookmarked ? 'DELETE' : 'POST';
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/courses/${course.id}/bookmark`, {
            method,
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (response.ok) {
            course.isBookmarked = !course.isBookmarked;
            this.showToast(
              course.isBookmarked ? 'Course bookmarked' : 'Bookmark removed',
              'success'
            );
          }
        } catch (error) {
          console.error('Error toggling bookmark:', error);
          this.showToast('Failed to update bookmark', 'error');
        }
      },
  
      getAuthToken() {
        return localStorage.getItem('authToken') || '';
      },
  
      formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
      },
  
      parseDuration(duration) {
        if (!duration) return 0;
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      },
  
      hasAccess(course) {
        if (!course.isPremium) return true;
        return ['start', 'pro'].includes(this.currentUserPlan);
      },
  
      getStartButtonText(course) {
        if (course.isPremium && !this.hasAccess(course)) {
          return '🔒 Upgrade Required';
        }
        return 'Start Learning';
      },
  
      handleCourseStart(course) {
        if (course.isPremium && !this.hasAccess(course)) {
          this.selectedCourseId = course.id.toString();
          this.requiredPlan = 'pro';
          this.showPaymentModal = true;
          this.closeCourseModal();
          return;
        }
        
        this.startCourse(course);
      },
  
      startCourse(course) {
        this.showToast(`Starting course: ${course.title}`, 'success');
        // Navigate to course content
        // this.$router.push({ name: 'CourseContent', params: { courseId: course.id } });
        this.closeCourseModal();
      },
  
      getDifficultyClass(difficulty) {
        if (!difficulty) return '';
        return difficulty.toLowerCase().replace(/\s+/g, '-');
      },
  
      handleImageError(event) {
        event.target.src = '/api/placeholder/400/220';
      },
  
      // Filter methods
      setFilter(filter) {
        this.selectedFilter = this.selectedFilter === filter ? '' : filter;
        this.currentPage = 1;
      },
  
      setCategory(category) {
        this.selectedCategory = this.selectedCategory === category ? '' : category;
        this.currentPage = 1;
      },
  
      clearAllFilters() {
        this.selectedCategory = '';
        this.selectedFilter = '';
        this.searchQuery = '';
        this.currentPage = 1;
      },
  
      // Pagination methods
      nextPage() {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.scrollToTop();
        }
      },
  
      prevPage() {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.scrollToTop();
        }
      },
  
      scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
  
      // Modal methods
      openCourseModal(course) {
        this.selectedCourse = course;
        document.body.style.overflow = 'hidden';
      },
  
      closeCourseModal() {
        this.selectedCourse = null;
        document.body.style.overflow = '';
      },
  
      closePaymentModal() {
        this.showPaymentModal = false;
        this.selectedCourseId = null;
      },
  
      handleCourseUnlocked(data) {
        this.closePaymentModal();
        
        const course = this.courses.find(c => c.id.toString() === this.selectedCourseId);
        if (course) {
          setTimeout(() => this.startCourse(course), 1000);
        }
        
        if (data.plan) {
          this.$store.commit('user/SET_USER_STATUS', data.plan);
        }
      },
  
      handlePaymentInitiated() {
        this.closePaymentModal();
      },
  
      showToast(message, type = 'info') {
        if (this.$toast) {
          this.$toast[type](message, { duration: 3000 });
        }
      }
    },
  
    beforeUnmount() {
      document.body.style.overflow = '';
    }
  };
  </script>
  
  <style scoped>
  /* Base Styles */
  .courses-container {
    min-height: 100vh;
    background: #f8fafc;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
  
  /* Hero Section */
  .hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 80px 0;
  }
  
  .hero-content {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .hero-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 24px;
    line-height: 1.2;
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 40px;
    opacity: 0.9;
    line-height: 1.6;
  }
  
  .hero-stats {
    display: flex;
    justify-content: center;
    gap: 48px;
  }
  
  .stat {
    text-align: center;
  }
  
  .stat-number {
    display: block;
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 1rem;
    opacity: 0.8;
  }
  
  /* Filters Section */
  .filters {
    background: white;
    padding: 32px 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  
  .filters-header h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0;
  }
  
  .results-count {
    background: #f7fafc;
    padding: 8px 16px;
    border-radius: 8px;
    color: #4a5568;
    font-weight: 500;
  }
  
  .filters-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .filter-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .filter-label {
    font-weight: 600;
    color: #4a5568;
    min-width: 100px;
  }
  
  .filter-chips {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .chip {
    background: white;
    border: 2px solid #e2e8f0;
    color: #4a5568;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .chip:hover {
    border-color: #cbd5e0;
  }
  
  .chip.active {
    background: #667eea;
    border-color: #667eea;
    color: white;
  }
  
  .category-chip {
    text-transform: capitalize;
  }
  
  .search-container {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .search-input-wrapper {
    position: relative;
    flex-grow: 1;
    max-width: 400px;
  }
  
  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: #a0aec0;
  }
  
  .clear-btn {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .clear-btn:hover {
    background: #c53030;
  }
  
  /* Content Section */
  .content {
    padding: 48px 0;
  }
  
  /* Loading State */
  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 24px;
  }
  
  .course-skeleton {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  
  .skeleton-image {
    height: 200px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  .skeleton-content {
    padding: 24px;
  }
  
  .skeleton-line {
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  
  .skeleton-line.short {
    width: 40%;
  }
  
  .skeleton-line.medium {
    width: 70%;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Error State */
  .error-state {
    text-align: center;
    padding: 80px 24px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }
  
  .error-state h3 {
    font-size: 1.5rem;
    color: #1a202c;
    margin-bottom: 8px;
  }
  
  .error-state p {
    color: #4a5568;
    margin-bottom: 24px;
  }
  
  .retry-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .retry-btn:hover {
    background: #5a67d8;
  }
  
  /* Courses Grid */
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 24px;
  }
  
  .course-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .course-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .course-image {
    position: relative;
    height: 200px;
    overflow: hidden;
  }
  
  .course-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  
  .course-card:hover .course-image img {
    transform: scale(1.05);
  }
  
  .course-badges {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .badge.new {
    background: #9f7aea;
    color: white;
  }
  
  .badge.popular {
    background: #ed8936;
    color: white;
  }
  
  .badge.free {
    background: #38a169;
    color: white;
  }
  
  .badge.premium {
    background: #d69e2e;
    color: white;
  }
  
  .course-content {
    padding: 24px;
  }
  
  .course-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .category {
    background: #edf2f7;
    color: #4a5568;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .difficulty {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .difficulty.beginner {
    background: #c6f6d5;
    color: #22543d;
  }
  
  .difficulty.intermediate {
    background: #fef5e7;
    color: #744210;
  }
  
  .difficulty.advanced {
    background: #fed7d7;
    color: #742a2a;
  }
  
  .course-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .course-description {
    color: #4a5568;
    line-height: 1.6;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .course-stats {
    display: flex;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
  
  .course-stats .stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.875rem;
    color: #4a5568;
  }
  
  .course-stats .icon {
    font-size: 1rem;
  }
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 80px 24px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 24px;
    opacity: 0.5;
  }
  
  .empty-state h3 {
    font-size: 1.5rem;
    color: #1a202c;
    margin-bottom: 8px;
  }
  
  .empty-state p {
    color: #4a5568;
    margin-bottom: 24px;
  }
  
  /* Pagination */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 48px;
  }
  
  .page-btn {
    background: white;
    border: 2px solid #e2e8f0;
    color: #4a5568;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .page-btn:hover:not(:disabled) {
    border-color: #667eea;
    color: #667eea;
  }
  
  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .page-info {
    font-weight: 500;
    color: #4a5568;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }
  
  .modal {
    background: white;
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px 24px 0;
  }
  
  .modal-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .close-btn {
    background: #f7fafc;
    border: none;
    color: #4a5568;
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  
  .close-btn:hover {
    background: #edf2f7;
  }
  
  .modal-content {
    padding: 0;
  }
  
  .modal-image {
    height: 240px;
    background: #f7fafc;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .modal-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 16px;
    line-height: 1.3;
  }
  
  .modal-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  
  .modal-stats .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color: #4a5568;
    font-weight: 500;
  }
  
  .modal-tags {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  
  .tag {
    background: #edf2f7;
    color: #4a5568;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .tag.premium {
    background: #fed7aa;
    color: #9c4221;
  }
  
  .modal-section {
    margin-bottom: 32px;
  }
  
  .modal-section h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .modal-section h3::before {
    content: "📖";
    font-size: 1.125rem;
  }
  
  .modal-section p {
    color: #4a5568;
    line-height: 1.6;
  }
  
  .curriculum {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .curriculum-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #f7fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
  
  .lesson-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #667eea;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    flex-shrink: 0;
  }
  
  .lesson-content h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 4px;
  }
  
  .lesson-content p {
    color: #4a5568;
    font-size: 0.875rem;
    margin-bottom: 8px;
  }
  
  .lesson-duration {
    background: #e6fffa;
    color: #234e52;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .instructor-info {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: #f7fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    margin-top: 24px;
  }
  
  .instructor-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .instructor-info h4 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 4px;
  }
  
  .instructor-info p {
    color: #4a5568;
    font-size: 0.875rem;
  }
  
  .modal-footer {
    padding: 24px;
    border-top: 1px solid #e2e8f0;
    background: #f7fafc;
    display: flex;
    gap: 16px;
    justify-content: flex-end;
  }
  
  .btn-secondary {
    background: white;
    border: 2px solid #e2e8f0;
    color: #4a5568;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn-secondary:hover {
    border-color: #cbd5e0;
  }
  
  .btn-primary {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary:hover {
    background: #5a67d8;
    transform: translateY(-1px);
  }
  
  .btn-primary.premium {
    background: linear-gradient(135deg, #d69e2e, #b7791f);
  }
  
  .btn-primary.premium:hover {
    background: linear-gradient(135deg, #b7791f, #975a16);
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .container {
      padding: 0 16px;
    }
  
    .hero {
      padding: 60px 0;
    }
  
    .hero-title {
      font-size: 2.25rem;
    }
  
    .hero-subtitle {
      font-size: 1.125rem;
    }
  
    .hero-stats {
      gap: 24px;
      flex-wrap: wrap;
    }
  
    .stat-number {
      font-size: 2rem;
    }
  
    .filters {
      padding: 24px 0;
    }
  
    .filters-header {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
  
    .filters-header h2 {
      font-size: 1.5rem;
    }
  
    .filter-row {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
  
    .filter-label {
      min-width: auto;
    }
  
    .search-container {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
  
    .search-input-wrapper {
      max-width: none;
    }
  
    .courses-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  
    .content {
      padding: 32px 0;
    }
  
    .pagination {
      margin-top: 32px;
    }
  
    .modal {
      margin: 16px;
      max-height: calc(100vh - 32px);
    }
  
    .modal-header {
      padding: 16px 16px 0;
    }
  
    .modal-body {
      padding: 16px;
    }
  
    .modal-footer {
      padding: 16px;
      flex-direction: column;
    }
  
    .modal-stats {
      flex-direction: column;
      gap: 12px;
    }
  
    .instructor-info {
      flex-direction: column;
      text-align: center;
      align-items: center;
    }
  }
  
  @media (max-width: 480px) {
    .hero-title {
      font-size: 1.875rem;
    }
  
    .hero-stats {
      flex-direction: column;
      gap: 16px;
    }
  
    .filter-chips {
      gap: 8px;
    }
  
    .chip {
      padding: 6px 12px;
      font-size: 0.875rem;
    }
  
    .modal-title {
      font-size: 1.5rem;
    }
  
    .curriculum-item {
      padding: 12px;
      gap: 12px;
    }
  
    .lesson-number {
      width: 28px;
      height: 28px;
      font-size: 0.8rem;
    }
  }
  </style>