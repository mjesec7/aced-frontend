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
      <h4>🔧 Debug Info:</h4>
      <p>Total homeworks loaded: {{ homeworks.length }}</p>
      <p>Valid homeworks: {{ validHomeworks.length }}</p>
      <p>API Response: {{ apiResponseStatus }}</p>
      <p>Last fetch time: {{ lastFetchTime }}</p>
      <pre>{{ JSON.stringify(homeworks.slice(0, 2), null, 2) }}</pre>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка домашних заданий...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <h3>Ошибка загрузки</h3>
      <p>{{ error }}</p>
      <button @click="refreshHomeworks" class="refresh-btn">🔄 Попробовать снова</button>
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
          :key="getHomeworkKey(hw)" 
          class="homework-card"
          :class="{ 'urgent': isUrgent(hw) }"
        >
          <div class="card-header">
            <div class="title-section">
              <h3>{{ getHomeworkTitle(hw) }}</h3>
              <span v-if="hw.subject" class="subject-tag">{{ hw.subject }}</span>
              <span class="type-tag" :class="hw.type">{{ getTypeLabel(hw.type) }}</span>
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

            <div v-if="getExerciseCount(hw) > 0" class="exercises-info">
              <span class="exercises-label">📝 Упражнений:</span>
              <span class="exercises-count">{{ getExerciseCount(hw) }}</span>
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
              <div v-if="hw.stars > 0" class="progress-item">
                <span class="progress-label">Звёзды:</span>
                <span class="progress-value">{{ '⭐'.repeat(hw.stars) }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-info">
              <span v-if="getLastAttempt(hw)" class="last-attempt">
                Обновлено: {{ formatDate(getLastAttempt(hw)) }}
              </span>
              <span v-if="hw.type" class="homework-type">
                {{ hw.type === 'standalone' ? 'Отдельное ДЗ' : 'Урок' }}
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
      apiResponseStatus: 'none',
      lastFetchTime: null,
    };
  },
  computed: {
    subjects() {
      const subjects = [...new Set(this.homeworks.map(hw => hw.subject).filter(Boolean))];
      return subjects.sort();
    },
    
    // ✅ FIXED: Enhanced validation that works with both homework types
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
    }
  },
  
  methods: {
    // ✅ FIXED: Enhanced key generation for homework items
    getHomeworkKey(hw) {
      if (hw._id) return `hw-${hw._id}`;
      if (hw.lessonId) return `lesson-${hw.lessonId}`;
      return `temp-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // ✅ FIXED: Enhanced title extraction
    getHomeworkTitle(hw) {
      return hw.title || hw.lessonName || `Домашнее задание ${hw.type || ''}` || 'Без названия';
    },
    
    // ✅ FIXED: Exercise count extraction
    getExerciseCount(hw) {
      return hw.exerciseCount || (hw.exercises && hw.exercises.length) || 0;
    },
    
    // ✅ FIXED: Type label generation
    getTypeLabel(type) {
      switch (type) {
        case 'standalone': return 'Отдельное';
        case 'lesson': return 'Урок';
        default: return 'ДЗ';
      }
    },
    
    // ✅ FIXED: Enhanced progress detection methods
    hasProgress(hw) {
      return !!(
        hw.hasProgress ||
        hw.completed !== undefined ||
        hw.score !== undefined ||
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
        hw.submittedAt ||
        hw.userProgress?.updatedAt ||
        hw.progress?.updatedAt ||
        hw.record?.lastAttempt ||
        hw.record?.updatedAt ||
        (hw.metadata && hw.metadata.lastAttempt)
      );
    },
    
    // ✅ FIXED: Enhanced navigation with better error handling
    goToHomework(hw) {
      console.log('🎯 Navigating to homework:', {
        id: hw._id,
        lessonId: hw.lessonId,
        type: hw.type,
        title: this.getHomeworkTitle(hw)
      });
      
      let routeName;
      let params;
      let query = {
        title: this.getHomeworkTitle(hw),
        subject: hw.subject || 'Unknown'
      };
      
      // ✅ ENHANCED: Better route determination
      if (hw.type === 'standalone' || (hw._id && !hw.lessonId)) {
        // Standalone homework
        routeName = 'HomeworkPage';
        params = { id: hw._id };
        query.type = 'standalone';
        query.homeworkId = hw._id;
      } 
      else if (hw.type === 'lesson' || hw.lessonId) {
        // Lesson-based homework
        routeName = 'HomeworkPage';
        params = { id: hw.lessonId };
        query.type = 'lesson';
        query.lessonId = hw.lessonId;
      }
      else if (hw._id) {
        // Fallback: Try with ID
        routeName = 'HomeworkPage';
        params = { id: hw._id };
        query.type = hw.type || 'unknown';
      }
      else {
        console.error('❌ No valid homework ID found:', hw);
        this.$toast?.error('Ошибка: Не удается найти домашнее задание');
        return;
      }
      
      console.log('📍 Navigation details:', { routeName, params, query });
      
      this.$router.push({
        name: routeName,
        params: params,
        query: query
      }).catch(err => {
        console.error('❌ Navigation error:', err);
        
        // Enhanced fallback navigation
        const fallbackId = hw._id || hw.lessonId;
        const fallbackType = hw.type || (hw.lessonId ? 'lesson' : 'standalone');
        
        console.log('🔄 Trying fallback navigation:', { fallbackId, fallbackType });
        
        this.$router.push({
          path: `/homework/${fallbackId}`,
          query: { 
            type: fallbackType,
            title: this.getHomeworkTitle(hw),
            subject: hw.subject,
            fallback: 'true'
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
    
    // ✅ FIXED: Enhanced homework fetching with comprehensive error handling
    async fetchHomeworks() {
      try {
        this.loading = true;
        this.error = null;
        
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Пользователь не авторизован');
        }
        
        const userId = user.uid;
        this.lastFetchTime = new Date().toISOString();

        console.log('📥 Fetching homework for user:', userId);

        // ✅ ENHANCED: Use the fixed API function
        const result = await getAllHomeworks(userId);
        
        console.log('📊 API Result:', {
          success: result.success,
          dataLength: result.data?.length || 0,
          hasStats: !!result.stats
        });

        this.apiResponseStatus = result.success ? 'success' : 'failed';

        if (result.success && result.data) {
          // ✅ ENHANCED: Process the homework data with comprehensive validation
          this.homeworks = result.data.map(hw => {
            // Normalize the homework structure
            const normalizedHw = {
              // Preserve original data
              ...hw,
              
              // Ensure we have proper IDs
              id: hw._id || hw.lessonId,
              
              // Normalize progress tracking
              hasProgress: this.extractHasProgress(hw),
              completed: this.extractCompleted(hw),
              score: this.extractScore(hw),
              
              // Ensure exercise count is available
              exerciseCount: hw.exerciseCount || (hw.exercises && hw.exercises.length) || 0,
              
              // Enhanced metadata
              metadata: {
                ...hw.metadata,
                originalType: hw.type,
                hasValidId: !!(hw._id || hw.lessonId),
                hasTitle: !!(hw.title || hw.lessonName),
                processed: true,
                processedAt: new Date().toISOString()
              }
            };
            
            console.log(`📝 Processed homework: ${normalizedHw.title || normalizedHw.lessonName}`, {
              id: normalizedHw.id,
              type: normalizedHw.type,
              hasProgress: normalizedHw.hasProgress,
              completed: normalizedHw.completed,
              score: normalizedHw.score
            });
            
            return normalizedHw;
          });
          
          console.log(`✅ Successfully loaded ${this.homeworks.length} homework items`);
          
          if (result.stats) {
            console.log('📊 Homework stats:', result.stats);
          }
        } else {
          console.warn('⚠️ API returned unsuccessful result:', result);
          this.error = result.error || 'Не удалось загрузить домашние задания';
          this.homeworks = [];
        }

      } catch (err) {
        console.error('❌ Error loading homeworks:', err);
        
        // ✅ ENHANCED: Better error handling with specific messages
        let errorMessage = 'Ошибка загрузки домашних заданий';
        
        if (err.message?.includes('авторизован')) {
          errorMessage = 'Необходимо войти в систему';
        } else if (err.response?.status === 404) {
          errorMessage = 'Домашние задания не найдены';
        } else if (err.response?.status === 403) {
          errorMessage = 'Доступ запрещен';
        } else if (err.response?.status >= 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.error = errorMessage;
        this.apiResponseStatus = 'error';
        this.homeworks = [];
        
        this.$toast?.error(`Ошибка загрузки: ${errorMessage}`);
      } finally {
        this.loading = false;
      }
    },
    
    // ✅ Helper methods for extracting progress data from various sources
    extractCompleted(hw) {
      return !!(
        hw.completed ||
        hw.hasProgress === true && hw.score >= 100 ||
        hw.userProgress?.completed ||
        hw.progress?.completed ||
        hw.record?.completed ||
        (hw.metadata && hw.metadata.completed)
      );
    },
    
    extractScore(hw) {
      return (
        hw.score ||
        hw.userProgress?.score ||
        hw.progress?.score ||
        hw.record?.score ||
        (hw.metadata && hw.metadata.score) ||
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
        hw.updatedAt ||
        (hw.metadata && hw.metadata.hasProgress)
      );
    }
  },
  
  async mounted() {
    console.log('🚀 HomeworkList component mounted');
    await this.fetchHomeworks();
  },
  
  // ✅ Add component update hook to refresh when returning from homework
  activated() {
    console.log('🔄 HomeworkList component activated');
    // Refresh homework list when component becomes active
    this.fetchHomeworks();
  },
  
  // ✅ Handle route changes
  watch: {
    '$route'(to, from) {
      // Refresh if returning to homework list from homework page
      if (from.name?.includes('Homework') && to.name === 'HomeworkList') {
        console.log('🔄 Returning from homework page, refreshing list');
        this.fetchHomeworks();
      }
    }
  }
};
</script>

<style scoped>
/* ✅ ENHANCED STYLES WITH BETTER VISUAL FEEDBACK */
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

/* ✅ ENHANCED DEBUG STYLES */
.debug-info {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.debug-info h4 {
  color: #60a5fa;
  margin: 0 0 0.5rem 0;
}

.debug-info pre {
  background: #374151;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow-x: auto;
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

.error {
  text-align: center;
  padding: 3rem;
  color: #ef4444;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.error h3 {
  margin: 1rem 0 0.5rem;
  color: #dc2626;
  font-size: 1.5rem;
}

.error p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.refresh-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-btn:hover {
  background: #dc2626;
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

.title-section {
  flex: 1;
}

.title-section h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #1f2937;
  line-height: 1.3;
}

.subject-tag,
.type-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-right: 0.5rem;
}

.subject-tag {
  background: #e0e7ff;
  color: #3730a3;
}

.type-tag {
  background: #f3f4f6;
  color: #6b7280;
}

.type-tag.standalone {
  background: #ddd6fe;
  color: #5b21b6;
}

.type-tag.lesson {
  background: #d1fae5;
  color: #065f46;
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

.due-date, .difficulty, .exercises-info, .progress-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.progress-details {
  flex-direction: column;
  align-items: stretch;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.progress-label {
  color: #6b7280;
}

.progress-value {
  font-weight: 600;
  color: #374151;
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
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.homework-type {
  font-weight: 500;
  color: #9ca3af;
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
  
  .footer-info {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>