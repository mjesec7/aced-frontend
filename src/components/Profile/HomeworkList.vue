
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

    <!-- Debug Info (remove in production) -->
    <div v-if="$route.query.debug" class="debug-info">
      <h4>Debug Info:</h4>
      <p>Total homeworks loaded: {{ homeworks.length }}</p>
      <p>Valid homeworks: {{ validHomeworks.length }}</p>
      <pre>{{ JSON.stringify(homeworks.slice(0, 2), null, 2) }}</pre>
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
      <button @click="refreshHomeworks" class="refresh-btn">🔄 Обновить</button>
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
                <span v-if="isCompleted(hw)" class="score-badge success">
                  {{ getScore(hw) }}% ✨
                </span>
                <span v-else-if="hasProgress(hw)" class="score-badge progress">
                  {{ getScore(hw) }}% 🔄
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

            <!-- Progress Details -->
            <div v-if="hasProgress(hw)" class="progress-details">
              <div class="progress-item">
                <span class="progress-label">Последняя попытка:</span>
                <span class="progress-value">{{ formatDate(getLastAttempt(hw)) }}</span>
              </div>
              <div v-if="getScore(hw) > 0" class="progress-item">
                <span class="progress-label">Лучший результат:</span>
                <span class="progress-value">{{ getScore(hw) }}%</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-info">
              <span v-if="getLastAttempt(hw)" class="last-attempt">
                Обновлено: {{ formatDate(getLastAttempt(hw)) }}
              </span>
            </div>
            <button @click="goToHomework(hw)" class="action-btn">
              <span v-if="!hasProgress(hw)">Начать</span>
              <span v-else-if="!isCompleted(hw)">Продолжить</span>
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
    
    // ✅ FIXED: Simplified validation that works with both homework types
    validHomeworks() {
      return this.homeworks.filter(hw => {
        if (!hw) return false;
        
        // Must have either an ID or lessonId
        const hasValidId = (hw._id || hw.lessonId) && 
                          hw._id !== 'null' && 
                          hw.lessonId !== 'null' &&
                          hw._id !== 'undefined' && 
                          hw.lessonId !== 'undefined';
        
        // Must have a title/name
        const hasTitle = hw.title || hw.lessonName;
        
        return hasValidId && hasTitle;
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
      return this.validHomeworks.filter(hw => this.isCompleted(hw)).length;
    },
    
    inProgressHomeworks() {
      return this.validHomeworks.filter(hw => this.hasProgress(hw) && !this.isCompleted(hw)).length;
    }
  },
  
  methods: {
    // ✅ FIXED: Enhanced progress detection methods
    hasProgress(hw) {
      // Check multiple possible progress indicators
      return !!(
        hw.completed !== undefined ||
        hw.score !== undefined ||
        hw.hasProgress ||
        hw.userProgress ||
        hw.progress ||
        hw.record ||
        (hw.metadata && hw.metadata.hasProgress)
      );
    },
    
    isCompleted(hw) {
      return !!(
        hw.completed ||
        hw.userProgress?.completed ||
        hw.progress?.completed ||
        hw.record?.completed ||
        (hw.metadata && hw.metadata.completed)
      );
    },
    
    getScore(hw) {
      return (
        hw.score ||
        hw.userProgress?.score ||
        hw.progress?.score ||
        hw.record?.score ||
        (hw.metadata && hw.metadata.score) ||
        0
      );
    },
    
    getLastAttempt(hw) {
      return (
        hw.updatedAt ||
        hw.userProgress?.updatedAt ||
        hw.progress?.updatedAt ||
        hw.record?.lastAttempt ||
        hw.record?.updatedAt ||
        (hw.metadata && hw.metadata.lastAttempt)
      );
    },
    
    goToHomework(hw) {
      
      let routeName;
      let params;
      let query = {
        title: hw.title || hw.lessonName,
        subject: hw.subject
      };
      
      if (hw._id && (hw.type === 'standalone' || (hw.exercises && hw.exercises.length > 0))) {
        // Standalone homework from admin panel
        routeName = 'StandaloneHomeworkPage';
        params = { homeworkId: hw._id };
        query.type = 'standalone';
      } 
      else if (hw.lessonId) {
        // Lesson-based homework
        routeName = 'LessonHomeworkPage';
        params = { lessonId: hw.lessonId };
        query.type = 'lesson';
      }
      else if (hw._id) {
        // Fallback: Try with flexible route
        routeName = 'HomeworkPage';
        params = { id: hw._id };
        query.type = 'standalone';
      }
      else {
        console.error('❌ No valid homework ID found:', hw);
        this.$toast?.error('Ошибка: Не удается найти домашнее задание');
        return;
      }
      
      
      this.$router.push({
        name: routeName,
        params: params,
        query: query
      }).catch(err => {
        console.error('❌ Navigation error:', err);
        
        // Fallback navigation
        const fallbackId = hw._id || hw.lessonId;
        this.$router.push({
          name: 'HomeworkPage',
          params: { id: fallbackId },
          query: { 
            type: hw.type || (hw.lessonId ? 'lesson' : 'standalone'),
            title: hw.title || hw.lessonName,
            subject: hw.subject
          }
        }).catch(fallbackErr => {
          console.error('❌ Fallback navigation failed:', fallbackErr);
          this.$toast?.error('Ошибка навигации. Обратитесь к администратору.');
        });
      });
    },
    
    statusLabel(hw) {
      if (!this.hasProgress(hw)) return '⏳ Не начато';
      if (!this.isCompleted(hw)) return '🔄 В процессе';
      return '✅ Завершено';
    },
    
    statusClass(hw) {
      return this.getStatus(hw);
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
      if (!this.hasProgress(hw)) return 'progress-pending';
      if (!this.isCompleted(hw)) return 'progress-active';
      return 'progress-completed';
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
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
    
    // ✅ FIXED: Enhanced homework fetching with better progress handling
    async fetchHomeworks() {
      try {
        this.loading = true;
        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        
        const token = await user.getIdToken();
        const userId = user.uid;


        // ✅ Try the main enhanced user homework endpoint
        try {
          const { data: response } = await api.get(`/users/${userId}/homeworks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const homeworkData = response.data || response || [];
          
          if (Array.isArray(homeworkData) && homeworkData.length > 0) {
            // ✅ FIXED: Enhanced processing that preserves all progress info
            this.homeworks = homeworkData.map(hw => {
              // Normalize the homework structure
              const normalizedHw = {
                ...hw,
                // Ensure we have a proper ID
                id: hw._id || hw.lessonId,
                
                // Extract progress info from multiple possible sources
                completed: this.extractCompleted(hw),
                score: this.extractScore(hw),
                hasProgress: this.extractHasProgress(hw),
                
                // Preserve original progress data
                userProgress: hw.userProgress,
                progress: hw.progress,
                record: hw.record,
                
                // Add metadata for tracking
                metadata: {
                  originalType: hw.type,
                  hasProgress: this.extractHasProgress(hw),
                  completed: this.extractCompleted(hw),
                  score: this.extractScore(hw),
                  lastAttempt: hw.updatedAt || hw.submittedAt
                }
              };
              
           
              
              return normalizedHw;
            });
            
            return;
          }
        } catch (error) {
          console.warn('⚠️ Enhanced homework endpoint failed:', error.message);
        }

        // ✅ Fallback: Try to build from multiple sources
        
        const fallbackHomeworks = await this.buildHomeworkListFallback(token, userId);
        this.homeworks = fallbackHomeworks;
        

      } catch (err) {
        console.error('❌ Error loading homeworks:', err);
        this.$toast?.error(`Ошибка загрузки домашних заданий: ${err.message}`);
        this.homeworks = [];
      } finally {
        this.loading = false;
      }
    },
    
    // ✅ Helper methods for extracting progress data
    extractCompleted(hw) {
      return !!(
        hw.completed ||
        hw.userProgress?.completed ||
        hw.progress?.completed ||
        hw.record?.completed
      );
    },
    
    extractScore(hw) {
      return (
        hw.score ||
        hw.userProgress?.score ||
        hw.progress?.score ||
        hw.record?.score ||
        0
      );
    },
    
    extractHasProgress(hw) {
      return !!(
        hw.hasProgress ||
        hw.userProgress ||
        hw.progress ||
        hw.record ||
        hw.completed !== undefined ||
        hw.score !== undefined ||
        hw.submittedAt ||
        hw.updatedAt
      );
    },
    
    // ✅ Fallback method for building homework list
    async buildHomeworkListFallback(token, userId) {
      let allHomeworks = [];
      let lessonsWithHomework = [];
      let userProgress = [];

      // Get admin homework
      try {
        const { data: hwResponse } = await api.get('/homeworks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        allHomeworks = hwResponse.data || hwResponse || [];
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
      } catch (lessonsError) {
        console.warn('⚠️ Could not fetch lessons:', lessonsError.message);
      }

      // Get user progress from multiple endpoints
      try {
        // Try the dedicated homework progress endpoint
        const { data: progressResponse } = await api.get(`/homeworks/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        userProgress = progressResponse.data || progressResponse || [];
      } catch (progressError) {
        console.warn('⚠️ Homework progress endpoint failed:', progressError.message);
        
        // Try general user progress
        try {
          const { data: generalProgress } = await api.get(`/users/${userId}/progress`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          userProgress = generalProgress.data || generalProgress || [];
        } catch (generalError) {
          console.warn('⚠️ General progress endpoint failed:', generalError.message);
        }
      }

      // Combine all sources
      const combinedHomeworks = [];

      // Add standalone homework with progress
      allHomeworks.forEach(hw => {
        const userHwProgress = userProgress.find(up => 
          up.homeworkId === hw._id || 
          up.metadata?.standaloneHomeworkId === hw._id
        );
        
        combinedHomeworks.push({
          ...hw,
          type: 'standalone',
          hasProgress: !!userHwProgress,
          completed: userHwProgress?.completed || false,
          score: userHwProgress?.score || 0,
          userProgress: userHwProgress,
          metadata: {
            hasProgress: !!userHwProgress,
            completed: userHwProgress?.completed || false,
            score: userHwProgress?.score || 0,
            lastAttempt: userHwProgress?.updatedAt
          }
        });
      });

      // Add lesson-based homework with progress
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
          userProgress: userLessonProgress,
          metadata: {
            hasProgress: !!userLessonProgress,
            completed: userLessonProgress?.completed || false,
            score: userLessonProgress?.score || 0,
            lastAttempt: userLessonProgress?.updatedAt
          }
        });
      });

      // Remove duplicates and sort
      const uniqueHomeworks = combinedHomeworks.filter((hw, index, arr) => {
        return index === arr.findIndex(h => 
          (h._id && h._id === hw._id) || 
          (h.lessonId && h.lessonId === hw.lessonId)
        );
      });

      // Sort by priority: in-progress, pending, completed
      uniqueHomeworks.sort((a, b) => {
        const statusPriority = { 'in-progress': 0, 'pending': 1, 'completed': 2 };
        const aStatus = this.getStatus(a);
        const bStatus = this.getStatus(b);
        
        if (statusPriority[aStatus] !== statusPriority[bStatus]) {
          return statusPriority[aStatus] - statusPriority[bStatus];
        }
        
        return (a.title || a.lessonName || '').localeCompare(b.title || b.lessonName || '');
      });

      return uniqueHomeworks;
    }
  },
  
  mounted() {
    this.fetchHomeworks();
  },
  
  // ✅ Add component update hook to refresh when returning from homework
  activated() {
    // Refresh homework list when component becomes active
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