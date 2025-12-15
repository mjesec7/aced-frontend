<template>
  <div class="homework-page">
    <!-- Hero Header -->
    <header class="hero-header" :style="{ backgroundImage: `url(${currentHeroImage})` }">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Homework
          </div>
          <h1 class="hero-title">Your Assignments</h1>
          <p class="hero-subtitle">{{ validHomeworks.length }} assignments available</p>
        </div>
      </div>
    </header>

    <!-- Stats Section -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalHomeworks }}</span>
            <span class="stat-label">Total Assignments</span>
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
            <span class="stat-value">{{ completedHomeworks }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ inProgressHomeworks }}</span>
            <span class="stat-label">In Progress</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Control Section -->
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
            placeholder="Search by title..."
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
            <select v-model="selectedSubject">
              <option value="">All</option>
              <option v-for="subject in subjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="filter-pill">
            <label>Status</label>
            <select v-model="selectedStatus">
              <option value="">All</option>
              <option value="pending">Not Started</option>
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

          <button @click="refreshHomeworks" class="refresh-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loader">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
      </div>
      <p>Loading assignments...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-illustration">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3>Load Error</h3>
      <p>{{ error }}</p>
      <button @click="refreshHomeworks" class="retry-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="displayableHomeworks.length === 0 && validHomeworks.length > 0" class="empty-container">
      <div class="empty-illustration">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      <h3>Nothing Found</h3>
      <p>Try changing filter or search parameters</p>
      <button @click="clearFilters" class="retry-btn">Clear Filters</button>
    </div>

    <div v-else-if="validHomeworks.length === 0" class="empty-container">
      <div class="empty-illustration">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <h3>No Homework</h3>
      <p>Homework will appear after starting a course or completing a lesson</p>
      <button @click="refreshHomeworks" class="retry-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Homework Grid -->
    <main v-else class="main-section">
      <div class="homework-container">
        <div class="homework-grid">
          <article 
            v-for="hw in displayableHomeworks" 
            :key="getHomeworkKey(hw)" 
            class="homework-card"
            :class="{ 'urgent': isUrgent(hw) }"
          >
            <div class="card-header">
              <span class="homework-badge" :class="getStatus(hw)">
                {{ statusLabel(hw) }}
              </span>
              <span v-if="hw.type" class="type-badge" :class="hw.type">
                {{ getTypeLabel(hw.type) }}
              </span>
            </div>

            <div class="card-body">
              <h3 class="homework-name">{{ getHomeworkTitle(hw) }}</h3>
              
              <div class="homework-meta">
                <span v-if="hw.subject" class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {{ hw.subject }}
                </span>
                <span v-if="getExerciseCount(hw) > 0" class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ getExerciseCount(hw) }} {{ getExerciseWord(getExerciseCount(hw)) }}
                </span>
              </div>

              <div v-if="hw.dueDate" class="homework-stats">
                <div class="stat-item" :class="{ 'overdue': isOverdue(hw) }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ formatDate(hw.dueDate) }}
                </div>
              </div>

              <div v-if="hw.difficulty" class="difficulty-section">
                <span class="difficulty-label">Difficulty:</span>
                <div class="difficulty-stars">
                  <span v-for="i in 5" :key="i" class="star" :class="{ 'filled': i <= hw.difficulty }">★</span>
                </div>
              </div>

              <div class="progress-container">
                <div class="progress-info">
                  <span class="progress-text">Progress</span>
                  <span class="progress-percent">{{ getScore(hw) }}%</span>
                </div>
                <div class="progress-track">
                  <div 
                    class="progress-fill" 
                    :class="getProgressClass(hw)"
                    :style="{ width: getProgressWidth(hw) }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button 
                class="homework-btn" 
                :class="getButtonClass(hw)"
                @click="goToHomework(hw)"
              >
                <span>{{ getButtonText(hw) }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getAllHomeworks } from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'HomeworkList',
  data() {
    return {
      homeworks: [],
      loading: true,
      error: null,
      selectedSubject: '',
      selectedStatus: '',
      searchQuery: '',
      heroImages: [
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&h=400&fit=crop&q=80',
      ],
      currentHeroImage: '',
    };
  },
  
  computed: {
    subjects() {
      const subjects = [...new Set(this.validHomeworks.map(hw => hw.subject).filter(Boolean))];
      return subjects.sort();
    },
    
    validHomeworks() {
      return this.homeworks.filter(hw => {
        if (!hw) return false;
        const hasValidId = (hw._id || hw.lessonId) && 
                          hw._id !== 'null' && 
                          hw.lessonId !== 'null';
        if (!hasValidId) return false;
        const hasTitle = hw.title || hw.lessonName;
        if (!hasTitle) return false;
        const hasExercises = this.getExerciseCount(hw) > 0;
        if (!hasExercises) return false;
        return true;
      });
    },
    
    filteredHomeworks() {
      return this.validHomeworks.filter(hw => {
        const matchesSubject = !this.selectedSubject || hw.subject === this.selectedSubject;
        const matchesStatus = !this.selectedStatus || this.getStatus(hw) === this.selectedStatus;
        const matchesSearch = !this.searchQuery || 
          this.getHomeworkTitle(hw).toLowerCase().includes(this.searchQuery.toLowerCase());
        return matchesSubject && matchesStatus && matchesSearch;
      });
    },
    
    displayableHomeworks() {
      return this.filteredHomeworks;
    },
    
    totalHomeworks() {
      return this.validHomeworks.length;
    },
    
    completedHomeworks() {
      return this.validHomeworks.filter(hw => this.isCompleted(hw)).length;
    },
    
    inProgressHomeworks() {
      return this.validHomeworks.filter(hw => this.hasProgress(hw) && !this.isCompleted(hw)).length;
    },
    
    hasActiveFilters() {
      return !!(this.searchQuery || this.selectedSubject || this.selectedStatus);
    },
  },
  
  methods: {
    selectRandomHeroImage() {
      const randomIndex = Math.floor(Math.random() * this.heroImages.length);
      this.currentHeroImage = this.heroImages[randomIndex];
    },
    
    getHomeworkKey(hw) {
      if (hw._id) return `hw-${hw._id}`;
      if (hw.lessonId) return `lesson-${hw.lessonId}`;
      return `temp-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    getHomeworkTitle(hw) {
      return hw.title || hw.lessonName || 'Homework' || 'Untitled';
    },
    
    getExerciseCount(hw) {
      if (hw.exerciseCount && hw.exerciseCount > 0) return hw.exerciseCount;
      if (hw.exercises && Array.isArray(hw.exercises)) return hw.exercises.length;
      if (hw.homework && Array.isArray(hw.homework)) return hw.homework.length;
      if (hw.questions && Array.isArray(hw.questions)) return hw.questions.length;
      return 0;
    },
    
    getExerciseWord(count) {
      if (count === 1) return 'exercise';
      return 'exercises';
    },
    
    getTypeLabel(type) {
      switch (type) {
        case 'standalone': return 'Standalone';
        case 'lesson': return 'Lesson';
        default: return 'HW';
      }
    },
    
    hasProgress(hw) {
      return !!(
        hw.hasProgress ||
        hw.completed !== undefined ||
        hw.score !== undefined ||
        hw.userProgress ||
        hw.progress
      );
    },
    
    isCompleted(hw) {
      return !!(
        hw.completed ||
        hw.userProgress?.completed ||
        hw.progress?.completed
      );
    },
    
    getScore(hw) {
      return (
        hw.score ||
        hw.userProgress?.score ||
        hw.progress?.score ||
        0
      );
    },
    
    async goToHomework(hw) {
      try {
        let routeName = 'HomeworkPage';
        let params = { id: hw._id || hw.lessonId };
        let query = {
          title: this.getHomeworkTitle(hw),
          subject: hw.subject || 'Unknown',
          type: hw.type || (hw.lessonId ? 'lesson' : 'standalone')
        };
        
        await this.$router.push({
          name: routeName,
          params: params,
          query: query
        });
      } catch (err) {
}
    },
    
    statusLabel(hw) {
      if (!this.hasProgress(hw)) return 'Not Started';
      if (!this.isCompleted(hw)) return 'In Progress';
      return 'Completed';
    },
    
    getStatus(hw) {
      if (!this.hasProgress(hw)) return 'pending';
      if (!this.isCompleted(hw)) return 'in-progress';
      return 'completed';
    },
    
    getProgressWidth(hw) {
      if (!this.hasProgress(hw)) return '0%';
      return `${this.getScore(hw)}%`;
    },
    
    getProgressClass(hw) {
      const score = this.getScore(hw);
      if (score >= 80) return 'high';
      if (score >= 50) return 'medium';
      if (score > 0) return 'low';
      return 'very-low';
    },
    
    getButtonClass(hw) {
      if (this.isCompleted(hw)) return 'completed';
      if (this.hasProgress(hw)) return 'continue';
      return 'start';
    },
    
    getButtonText(hw) {
      if (this.isCompleted(hw)) return 'View';
      if (this.hasProgress(hw)) return 'Continue';
      return 'Start';
    },
    
    clearFilters() {
      this.selectedSubject = '';
      this.selectedStatus = '';
      this.searchQuery = '';
    },
    
    refreshHomeworks() {
      this.fetchHomeworks();
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    },
    
    isOverdue(hw) {
      if (!hw.dueDate) return false;
      return new Date(hw.dueDate) < new Date() && !this.isCompleted(hw);
    },
    
    isUrgent(hw) {
      if (!hw.dueDate || this.isCompleted(hw)) return false;
      const dueDate = new Date(hw.dueDate);
      const now = new Date();
      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    },
    
    async fetchHomeworks() {
      try {
        this.loading = true;
        this.error = null;
        
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authorized');
        }
        
        const result = await getAllHomeworks(user.uid);
        
        if (result.success && result.data) {
          this.homeworks = result.data.map(hw => ({
            ...hw,
            hasProgress: this.extractHasProgress(hw),
            completed: this.extractCompleted(hw),
            score: this.extractScore(hw),
          }));
        } else {
          this.error = result.error || 'Failed to load homework';
          this.homeworks = [];
        }
      } catch (err) {
this.error = err.message || 'Error loading homework';
        this.homeworks = [];
      } finally {
        this.loading = false;
      }
    },
    
    extractCompleted(hw) {
      return !!(
        hw.completed ||
        hw.userProgress?.completed ||
        hw.progress?.completed
      );
    },
    
    extractScore(hw) {
      return (
        hw.score ||
        hw.userProgress?.score ||
        hw.progress?.score ||
        0
      );
    },
    
    extractHasProgress(hw) {
      return !!(
        hw.hasProgress ||
        hw.userProgress ||
        hw.progress ||
        hw.completed !== undefined ||
        hw.score !== undefined
      );
    }
  },
  
  async mounted() {
    this.selectRandomHeroImage();
    await this.fetchHomeworks();
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.homework-page {
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
  position: relative;
  z-index: 1;
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
.reset-btn, .refresh-btn {
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
.refresh-btn {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e40af;
  border: 1.5px solid #93c5fd;
}
.refresh-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}
.reset-btn svg, .refresh-btn svg {
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

/* ERROR & EMPTY STATES */
.error-container, .empty-container {
  max-width: 600px;
  margin: 4rem auto;
  padding: 4rem 2rem;
  text-align: center;
}
.error-illustration, .empty-illustration {
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.error-illustration svg, .empty-illustration svg {
  width: 60px;
  height: 60px;
  color: #9ca3af;
}
.error-container h3, .empty-container h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}
.error-container p, .empty-container p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}
.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
}
.retry-btn svg {
  width: 1rem;
  height: 1rem;
}

/* MAIN SECTION */
.main-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

/* HOMEWORK GRID */
.homework-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

/* HOMEWORK CARD */
.homework-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border: 1px solid #f3f4f6;
}
.homework-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}
.homework-card.urgent {
  border-left: 3px solid #ef4444;
  background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
}
.card-header {
  padding: 1rem 1rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.homework-badge {
  padding: 0.3125rem 0.625rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.homework-badge.pending {
  background: #fef3c7;
  color: #92400e;
}
.homework-badge.in-progress {
  background: #dbeafe;
  color: #1e40af;
}
.homework-badge.completed {
  background: #d1fae5;
  color: #065f46;
}
.type-badge {
  padding: 0.3125rem 0.625rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f3f4f6;
  color: #6b7280;
}
.type-badge.standalone {
  background: #f3e8ff;
  color: #7c3aed;
}
.type-badge.lesson {
  background: #d1fae5;
  color: #065f46;
}

.card-body {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.homework-name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
}
.homework-meta {
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
.homework-stats {
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
.stat-item.overdue {
  color: #dc2626;
}
.stat-item svg {
  width: 0.875rem;
  height: 0.875rem;
}
.difficulty-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 8px;
}
.difficulty-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
}
.difficulty-stars {
  display: flex;
  gap: 0.125rem;
}
.star {
  color: #e5e7eb;
  font-size: 0.875rem;
}
.star.filled {
  color: #fbbf24;
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
.homework-btn {
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
.homework-btn svg {
  width: 0.875rem;
  height: 0.875rem;
}
.homework-btn.start {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}
.homework-btn.start:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
}
.homework-btn.continue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}
.homework-btn.continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}
.homework-btn.completed {
  background: #f3f4f6;
  color: #6b7280;
}
.homework-btn.completed:hover {
  background: #e5e7eb;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.75rem;
  }
  .hero-subtitle {
    font-size: 0.9375rem;
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
  .homework-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>