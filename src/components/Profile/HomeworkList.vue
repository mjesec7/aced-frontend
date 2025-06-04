<template>
  <div class="homework-list-wrapper">
    <div class="header-section">
      <h1>📚 Домашние задания</h1>
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-number">{{ totalHomeworks }}</span>
          <span class="stat-label">Всего</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ completedHomeworks }}</span>
          <span class="stat-label">Завершено</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ inProgressHomeworks }}</span>
          <span class="stat-label">В процессе</span>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filter-group">
        <label class="filter-label">📋 Предмет:</label>
        <select v-model="selectedSubject" class="filter-select">
          <option value="">Все предметы</option>
          <option v-for="subject in subjects" :key="subject" :value="subject">
            {{ subject }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label">📊 Статус:</label>
        <select v-model="selectedStatus" class="filter-select">
          <option value="">Все статусы</option>
          <option value="pending">Не начато</option>
          <option value="in-progress">В процессе</option>
          <option value="completed">Завершено</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">🔍 Поиск:</label>
        <input 
          v-model="searchQuery" 
          type="text" 
          class="filter-input" 
          placeholder="Название урока..."
        />
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка домашних заданий...</p>
    </div>
    
    <div v-else-if="displayableHomeworks.length === 0 && homeworks.length > 0" class="empty">
      <div class="empty-icon">🔍</div>
      <h3>Ничего не найдено</h3>
      <p>Попробуйте изменить фильтры поиска</p>
      <button @click="clearFilters" class="clear-filters-btn">Очистить фильтры</button>
    </div>

    <div v-else-if="homeworks.length === 0" class="empty">
      <div class="empty-icon">📝</div>
      <h3>Нет домашних заданий</h3>
      <p>Домашние задания появятся после начала курса или завершения урока</p>
    </div>

    <div v-else class="homework-cards">
      <TransitionGroup name="card" tag="div" class="cards-container">
        <div 
          v-for="hw in displayableHomeworks" 
          :key="hw.lessonId || hw._id || `temp-${Math.random()}`" 
          class="homework-card"
          :class="{ 'urgent': isUrgent(hw) }"
        >
          <div class="card-header">
            <div class="title-section">
              <h3>{{ hw.title || hw.lessonName || 'Без названия' }}</h3>
              <span v-if="hw.subject" class="subject-tag">{{ hw.subject }}</span>
            </div>
            <span class="status-chip" :class="statusClass(hw)">
              {{ statusLabel(hw) }}
            </span>
          </div>

          <div class="card-body">
            <div class="progress-section">
              <div class="progress-info">
                <strong>Прогресс:</strong>
                <span v-if="hw.record?.completed || hw.completed" class="score-badge success">
                  {{ hw.record?.score || hw.score || 0 }}% ✨
                </span>
                <span v-else-if="hw.record || hw.hasProgress" class="score-badge progress">
                  {{ hw.record?.score || hw.score || 0 }}% 🔄
                </span>
                <span v-else class="score-badge pending">Не начато ⏳</span>
              </div>
              
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: getProgressWidth(hw) }"
                  :class="getProgressClass(hw)"
                ></div>
              </div>
            </div>

            <div v-if="hw.dueDate" class="due-date">
              <span class="due-label">📅 Срок сдачи:</span>
              <span class="due-value" :class="{ 'overdue': isOverdue(hw) }">
                {{ formatDate(hw.dueDate) }}
              </span>
            </div>

            <div v-if="hw.difficulty" class="difficulty">
              <span class="difficulty-label">⚡ Сложность:</span>
              <div class="difficulty-stars">
                <span v-for="i in 5" :key="i" class="star" :class="{ 'filled': i <= hw.difficulty }">★</span>
              </div>
            </div>

            <div v-if="hw.exercises && hw.exercises.length > 0" class="exercises-info">
              <span class="exercises-label">📝 Упражнений:</span>
              <span class="exercises-count">{{ hw.exercises.length }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-info">
              <span v-if="hw.record?.lastAttempt || hw.updatedAt" class="last-attempt">
                Последнее обновление: {{ formatDate(hw.record?.lastAttempt || hw.updatedAt) }}
              </span>
            </div>
            <button @click="goToHomework(hw)" class="action-btn">
              <span v-if="!hw.record && !hw.hasProgress">Начать</span>
              <span v-else-if="!(hw.record?.completed || hw.completed)">Продолжить</span>
              <span v-else>Просмотреть</span>
              →
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script>
import api from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'HomeworkList',
  data() {
    return {
      homeworks: [],
      loading: true,
      selectedSubject: '',
      selectedStatus: '',
      searchQuery: '',
    };
  },
  computed: {
    subjects() {
      const subjects = [...new Set(this.homeworks.map(hw => hw.subject).filter(Boolean))];
      return subjects.sort();
    },
    // ✅ FIXED: More flexible validation that handles both types of homework
    validHomeworks() {
      return this.homeworks.filter(hw => {
        // Debug logging for invalid entries
        if (!hw) {
          console.warn('⚠️ Null/undefined homework entry');
          return false;
        }
        
        // For standalone homework (created in admin panel)
        if (hw._id) {
          // Standalone homework is valid if it has an ID and either exercises or is marked as type 'standalone'
          const hasExercises = hw.exercises && Array.isArray(hw.exercises) && hw.exercises.length > 0;
          const isStandaloneType = hw.type === 'standalone';
          
          if (hasExercises || isStandaloneType) {
            console.log('✅ Valid standalone homework:', hw.title || hw._id);
            return true;
          }
          
          // Also accept if it has a title and subject (basic homework info)
          if (hw.title && hw.subject) {
            console.log('✅ Valid homework with basic info:', hw.title);
            return true;
          }
        }
        
        // For lesson-based homework
        if (hw.lessonId) {
          const hasValidLessonId = hw.lessonId !== 'null' && hw.lessonId !== 'undefined' && hw.lessonId !== '';
          if (hasValidLessonId) {
            console.log('✅ Valid lesson-based homework:', hw.lessonName || hw.lessonId);
            return true;
          }
        }
        
        console.warn('⚠️ Invalid homework entry:', {
          id: hw._id,
          lessonId: hw.lessonId,
          title: hw.title,
          hasExercises: hw.exercises?.length,
          type: hw.type
        });
        return false;
      });
    },
    filteredHomeworks() {
      return this.validHomeworks.filter(hw => {
        const matchesSubject = !this.selectedSubject || hw.subject === this.selectedSubject;
        const matchesStatus = !this.selectedStatus || this.getStatus(hw) === this.selectedStatus;
        const matchesSearch = !this.searchQuery || 
          (hw.title || hw.lessonName || '').toLowerCase().includes(this.searchQuery.toLowerCase());
        
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
      return this.validHomeworks.filter(hw => hw.record?.completed || hw.completed).length;
    },
    inProgressHomeworks() {
      return this.validHomeworks.filter(hw => (hw.record || hw.hasProgress) && !(hw.record?.completed || hw.completed)).length;
    }
  },
  methods: {
    // Updated goToHomework method for HomeworkList.vue
// Replace the existing method with this fixed version

goToHomework(hw) {
  console.log('🚀 goToHomework called with:', hw);
  
  // ✅ FIXED: Use the correct route that exists in your router
  let targetId = null;
  let homeworkType = 'unknown';
  
  // Determine the homework ID and type
  if (hw._id && (hw.type === 'standalone' || (hw.exercises && hw.exercises.length > 0))) {
    // Standalone homework - use _id
    targetId = hw._id;
    homeworkType = 'standalone';
    console.log('📝 Navigating to standalone homework:', targetId);
  } 
  else if (hw.lessonId) {
    // Lesson-based homework - use lessonId
    targetId = hw.lessonId;
    homeworkType = 'lesson';
    console.log('📚 Navigating to lesson homework:', targetId);
  }
  else if (hw._id) {
    // Fallback: treat as homework ID
    targetId = hw._id;
    homeworkType = 'standalone';
    console.log('🔄 Fallback navigation for homework:', targetId);
  }
  
  if (!targetId) {
    console.error('❌ No valid homework ID found:', hw);
    this.$toast?.error('Ошибка: Не удается найти домашнее задание');
    return;
  }
  
  // ✅ SOLUTION: Use the existing HomeworkPage route with the ID parameter
  console.log('✅ Navigating to HomeworkPage with ID:', targetId, 'Type:', homeworkType);
  
  this.$router.push({
    name: 'HomeworkPage',
    params: { 
      id: targetId  // Use 'id' parameter that matches your router config
    },
    query: {
      type: homeworkType,
      title: hw.title || hw.lessonName,
      subject: hw.subject
    }
  }).catch(err => {
    console.error('❌ Navigation error:', err);
    this.$toast?.error('Ошибка навигации: ' + err.message);
  });
},
    statusLabel(hw) {
      if (!hw.record && !hw.hasProgress) return '⏳ Не начато';
      if (!(hw.record?.completed || hw.completed)) return '🔄 В процессе';
      return '✅ Завершено';
    },
    statusClass(hw) {
      return this.getStatus(hw);
    },
    getStatus(hw) {
      if (!hw.record && !hw.hasProgress) return 'pending';
      if (!(hw.record?.completed || hw.completed)) return 'in-progress';
      return 'completed';
    },
    getProgressWidth(hw) {
      if (!hw.record && !hw.hasProgress) return '0%';
      return `${hw.record?.score || hw.score || 0}%`;
    },
    getProgressClass(hw) {
      if (!hw.record && !hw.hasProgress) return 'progress-pending';
      if (!(hw.record?.completed || hw.completed)) return 'progress-active';
      return 'progress-completed';
    },
    clearFilters() {
      this.selectedSubject = '';
      this.selectedStatus = '';
      this.searchQuery = '';
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    },
    isOverdue(hw) {
      if (!hw.dueDate) return false;
      return new Date(hw.dueDate) < new Date() && !(hw.record?.completed || hw.completed);
    },
    isUrgent(hw) {
      if (!hw.dueDate || (hw.record?.completed || hw.completed)) return false;
      const dueDate = new Date(hw.dueDate);
      const now = new Date();
      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    },
    async fetchHomeworks() {
      try {
        this.loading = true;
        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        
        const token = await user.getIdToken();
        const userId = user.uid;

        console.log('🔍 Fetching homeworks for user:', userId);

        // ✅ SIMPLIFIED: Try the main user homework endpoint first
        try {
          const { data: response } = await api.get(`/users/${userId}/homeworks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const homeworkData = response.data || response || [];
          console.log('✅ User homework data loaded directly:', homeworkData.length);
          
          if (Array.isArray(homeworkData) && homeworkData.length > 0) {
            // Process and enhance the homework data
            this.homeworks = homeworkData.map(hw => ({
              ...hw,
              // Ensure consistent structure
              record: hw.userProgress || hw.progress || (hw.completed !== undefined ? {
                completed: hw.completed,
                score: hw.score || 0,
                lastAttempt: hw.updatedAt
              } : null),
              hasProgress: !!(hw.userProgress || hw.progress || hw.completed !== undefined)
            }));
            
            console.log('✅ Processed homework list:', this.homeworks.length, 'items');
            return;
          }
        } catch (error) {
          console.warn('⚠️ Main homework endpoint failed:', error.message);
        }

        // ✅ FALLBACK: Build homework list from multiple sources
        console.log('🔄 Building homework list from multiple sources...');
        
        let allHomeworks = [];
        let lessonsWithHomework = [];
        let userProgress = [];

        // Get admin homework
        try {
          const { data: hwResponse } = await api.get('/homeworks', {
            headers: { Authorization: `Bearer ${token}` }
          });
          allHomeworks = hwResponse.data || hwResponse || [];
          console.log('✅ Admin homeworks loaded:', allHomeworks.length);
        } catch (hwError) {
          console.warn('⚠️ Could not fetch admin homeworks:', hwError.message);
        }

        // Get lessons with homework
        try {
          const { data: lessonsResponse } = await api.get('/lessons');
          const allLessons = lessonsResponse.data || lessonsResponse || [];
          lessonsWithHomework = allLessons.filter(lesson => 
            lesson.homework && Array.isArray(lesson.homework) && lesson.homework.length > 0
          );
          console.log('✅ Lessons with homework loaded:', lessonsWithHomework.length);
        } catch (lessonsError) {
          console.warn('⚠️ Could not fetch lessons:', lessonsError.message);
        }

        // Get user progress
        try {
          const { data: progressResponse } = await api.get(`/homeworks/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          userProgress = progressResponse.data || progressResponse || [];
          console.log('✅ User progress loaded:', userProgress.length);
        } catch (progressError) {
          console.warn('⚠️ Could not fetch user progress:', progressError.message);
        }

        // Combine all sources
        const combinedHomeworks = [];

        // Add standalone homework
        allHomeworks.forEach(hw => {
          const userHwProgress = userProgress.find(up => up.homeworkId === hw._id);
          combinedHomeworks.push({
            ...hw,
            type: 'standalone',
            hasProgress: !!userHwProgress,
            completed: userHwProgress?.completed || false,
            score: userHwProgress?.score || 0,
            record: userHwProgress ? {
              completed: userHwProgress.completed || false,
              score: userHwProgress.score || 0,
              lastAttempt: userHwProgress.updatedAt
            } : null
          });
        });

        // Add lesson-based homework
        lessonsWithHomework.forEach(lesson => {
          const userLessonProgress = userProgress.find(up => up.lessonId === lesson._id);
          combinedHomeworks.push({
            lessonId: lesson._id,
            lessonName: lesson.lessonName || lesson.title,
            title: `Домашнее задание: ${lesson.lessonName || lesson.title}`,
            subject: lesson.subject,
            exercises: lesson.homework,
            type: 'lesson',
            hasProgress: !!userLessonProgress,
            completed: userLessonProgress?.completed || false,
            score: userLessonProgress?.score || 0,
            record: userLessonProgress ? {
              completed: userLessonProgress.completed || false,
              score: userLessonProgress.score || 0,
              lastAttempt: userLessonProgress.updatedAt
            } : null
          });
        });

        // Remove duplicates and sort
        const uniqueHomeworks = combinedHomeworks.filter((hw, index, arr) => {
          return index === arr.findIndex(h => 
            (h._id && h._id === hw._id) || 
            (h.lessonId && h.lessonId === hw.lessonId)
          );
        });

        // Sort by priority
        uniqueHomeworks.sort((a, b) => {
          const statusPriority = { 'in-progress': 0, 'pending': 1, 'completed': 2 };
          const aStatus = this.getStatus(a);
          const bStatus = this.getStatus(b);
          
          if (statusPriority[aStatus] !== statusPriority[bStatus]) {
            return statusPriority[aStatus] - statusPriority[bStatus];
          }
          
          return (a.title || a.lessonName || '').localeCompare(b.title || b.lessonName || '');
        });

        this.homeworks = uniqueHomeworks;
        console.log('✅ Final homework list assembled:', this.homeworks.length, 'items');

      } catch (err) {
        console.error('❌ Ошибка загрузки домашних заданий:', err);
        this.$toast?.error(`Ошибка загрузки домашних заданий: ${err.message}`);
        this.homeworks = [];
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.fetchHomeworks();
  }
};
</script>

<style scoped>
/* Keep all existing styles */
.homework-list-wrapper {
  max-width: 1200px;
  margin: auto;
  padding: 2rem 1rem;
}

.header-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

h1 {
  margin-bottom: 1.5rem;
  font-size: 2.5rem;
  color: #4b0082;
  font-weight: 700;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  min-width: 100px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.filters-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.filter-select,
.filter-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #6a5acd;
  box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #6a5acd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty h3 {
  margin: 1rem 0 0.5rem;
  color: #374151;
  font-size: 1.5rem;
}

.clear-filters-btn {
  background: #6a5acd;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s ease;
}

.clear-filters-btn:hover {
  background: #5848c2;
}

.homework-cards {
  display: grid;
  gap: 1.5rem;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.homework-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.homework-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
}

.homework-card.urgent {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.title-section h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #1f2937;
  line-height: 1.3;
}

.subject-tag {
  display: inline-block;
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-chip {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-chip.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-chip.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-chip.completed {
  background: #d1fae5;
  color: #065f46;
}

.card-body {
  margin-bottom: 1rem;
}

.progress-section {
  margin-bottom: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.score-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.score-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.score-badge.progress {
  background: #dbeafe;
  color: #1e40af;
}

.score-badge.pending {
  background: #f3f4f6;
  color: #6b7280;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-completed {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-active {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.progress-pending {
  background: #d1d5db;
}

.due-date, .difficulty, .exercises-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.due-value.overdue {
  color: #ef4444;
  font-weight: 600;
}

.difficulty-stars {
  display: flex;
  gap: 0.1rem;
}

.star {
  color: #d1d5db;
  font-size: 1rem;
}

.star.filled {
  color: #fbbf24;
}

.exercises-count {
  background: #f0f9ff;
  color: #0369a1;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.footer-info {
  font-size: 0.8rem;
  color: #6b7280;
}

.action-btn {
  background: linear-gradient(135deg, #6a5acd, #5848c2);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover {
  background: linear-gradient(135deg, #5848c2, #4c41b8);
  transform: translateX(2px);
}

/* Transitions */
.card-enter-active, .card-leave-active {
  transition: all 0.3s ease;
}

.card-enter-from, .card-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .homework-list-wrapper {
    padding: 1rem 0.5rem;
  }
  
  .stats-bar {
    gap: 1rem;
  }
  
  .stat-item {
    padding: 0.75rem 1rem;
    min-width: 80px;
  }
  
  .filters-section {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  .cards-container {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
}
</style>