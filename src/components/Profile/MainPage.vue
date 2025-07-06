<template>
  <div class="dashboard">
    <h1 class="title">👋 Добро пожаловать обратно!</h1>
    <div class="controls">
      <input v-model="searchQuery" class="search-input" placeholder="🔍 Поиск тем или курсов..." />
      <select v-model="filterSubject" class="filter-select">
        <option value="">Все предметы</option>
        <option v-for="subject in allSubjects" :key="subject" :value="subject">{{ subject }}</option>
      </select>
      <select v-model="filterType" class="filter-select">
        <option value="">Все типы</option>
        <option value="free">💚 Бесплатные</option>
        <option value="premium">💎 Премиум</option>
        <option value="pro">🌟 Pro</option>
      </select>
      <span class="user-status-badge" :class="userStatus">{{ userStatusLabel }}</span>
    </div>

    <!-- Error Alert -->
    <div v-if="hasErrors" class="error-alert">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div class="error-messages">
          <p v-if="errors.recommendations">{{ errors.recommendations }}</p>
          <p v-if="errors.studyList">{{ errors.studyList }}</p>
        </div>
        <button class="retry-btn" @click="retryAll">🔄 Retry</button>
      </div>
    </div>

    <!-- 🌟 Recommendations -->
    <div class="section recommendations-section">
      <div class="section-header">
        <h2>🌟 Рекомендовано для вас</h2>
        <div class="header-controls">
          <span class="results-count">{{ filteredRecommendations.length }} найдено</span>
          <button class="refresh-btn" @click="refreshRecommendations" :disabled="loadingRecommendations">
            🔄 Обновить
          </button>
        </div>
      </div>

      <div v-if="loadingRecommendations" class="grid">
        <div class="recommendation-placeholder" v-for="n in 4" :key="n">⏳</div>
      </div>

      <div v-else-if="filteredRecommendations.length" class="grid">
        <div class="topic-card" v-for="topic in filteredRecommendations" :key="topic._id" :class="getTopicTypeClass(topic)">
          <!-- Topic Type Badge -->
          <div class="topic-type-badge" :class="getTopicType(topic)">
            <span class="badge-icon">{{ getTopicTypeIcon(topic) }}</span>
            <span class="badge-text">{{ getTopicTypeLabel(topic) }}</span>
          </div>

          <!-- Topic Content -->
          <div class="topic-content">
            <h3 class="topic-title">📘 {{ getTopicName(topic) }}</h3>
            <p class="topic-desc">{{ getTopicDescription(topic) }}</p>
            
            <!-- Topic Metadata -->
            <div class="topic-metadata">
              <div class="metadata-item">
                <span class="metadata-icon">📚</span>
                <span class="metadata-text">{{ topic.lessons?.length || 0 }} уроков</span>
              </div>
              <div v-if="topic.subject" class="metadata-item">
                <span class="metadata-icon">🏷️</span>
                <span class="metadata-text">{{ topic.subject }}</span>
              </div>
              <div v-if="topic.difficulty" class="metadata-item">
                <span class="metadata-icon">⚡</span>
                <div class="difficulty-stars">
                  <span v-for="i in 5" :key="i" class="star" :class="{ 'filled': i <= topic.difficulty }">★</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="card-buttons">
            <button 
              class="btn-add" 
              @click="handleAddTopic(topic)"
              :disabled="isInStudyList(topic)"
              :title="isInStudyList(topic) ? 'Уже в списке' : 'Добавить в мои курсы'"
            >
              {{ isInStudyList(topic) ? '✓ Добавлено' : '＋ Добавить' }}
            </button>
            <button 
              class="btn-start" 
              @click="handleStartTopic(topic)"
              :class="getStartButtonClass(topic)"
              :title="getStartButtonTitle(topic)"
            >
              <span class="btn-icon">{{ getStartButtonIcon(topic) }}</span>
              <span class="btn-text">{{ getStartButtonText(topic) }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-message">
        <div class="empty-icon">🔍</div>
        <h3>Нет подходящих рекомендаций</h3>
        <p v-if="filterType || filterSubject || searchQuery">
          Попробуйте изменить фильтры поиска
        </p>
        <p v-else>
          Рекомендации появятся на основе ваших интересов
        </p>
        <button v-if="errors.recommendations" class="retry-btn inline" @click="fetchRecommendations">
          🔄 Попробовать снова
        </button>
        <button v-else-if="filterType || filterSubject || searchQuery" class="clear-filters-btn" @click="clearFilters">
          🗑️ Очистить фильтры
        </button>
      </div>
    </div>

    <!-- 📚 Study List -->
    <div class="section study-section">
      <div class="section-header">
        <h2>📘 Мои курсы</h2>
        <div class="header-controls">
          <span class="results-count">{{ filteredStudyList.length }} активных</span>
          <button v-if="invalidTopicsCleanedUp > 0" class="info-badge">
            🧹 Очищено: {{ invalidTopicsCleanedUp }}
          </button>
        </div>
      </div>
      
      <div v-if="loadingStudyList" class="grid">
        <div class="study-placeholder" v-for="n in 3" :key="n">⏳</div>
      </div>

      <div v-else-if="filteredStudyList.length" class="grid">
        <StudyCard
          v-for="topic in filteredStudyList"
          :key="topic._id"
          :topic="topic"
          :progress="topic.progress || { percent: 0, medal: 'none' }"
          :lessons="topic.lessons || []"
          @deleted="removeStudyCard"
        />
      </div>

      <div v-else class="empty-message">
        <div class="empty-icon">📚</div>
        <h3>У вас пока нет активных курсов</h3>
        <p v-if="filterType || filterSubject || searchQuery">
          Нет курсов, соответствующих фильтрам
        </p>
        <p v-else>
          Добавьте курсы из рекомендаций или найдите их в каталоге
        </p>
        <div class="empty-actions">
          <button v-if="filterType || filterSubject || searchQuery" class="clear-filters-btn" @click="clearFilters">
            🗑️ Очистить фильтры
          </button>
          <router-link to="/profile/catalogue" class="browse-link">
            📚 Просмотреть каталог курсов
          </router-link>
        </div>
      </div>
    </div>

    <!-- 💳 Payment Modal -->
    <PaymentModal
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="userStatus = $event"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import { auth } from '@/firebase';
import StudyCard from '@/components/Profile/StudyCard.vue';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'MainPage',
  components: { StudyCard, PaymentModal },
  data() {
    return {
      userId: null,
      recommendations: [],
      studyList: [],
      allSubjects: [],
      loadingRecommendations: true,
      loadingStudyList: true,
      searchQuery: '',
      filterSubject: '',
      filterType: '', // New filter for free/premium/pro
      showPaywall: false,
      requestedTopicId: null,
      lang: localStorage.getItem('lang') || 'en',
      // Error handling state
      errors: {
        recommendations: null,
        studyList: null
      },
      retryCount: 0,
      maxRetries: 3,
      invalidTopicsCleanedUp: 0
    };
  },
  computed: {
    ...mapGetters('user', ['userStatus']),
    
    filteredRecommendations() {
      return this.recommendations
        .filter(t => t.lessons?.length)
        .filter(t => {
          const name = this.getTopicName(t);
          const description = this.getTopicDescription(t);
          const topicType = this.getTopicType(t);
          
          return (
            (!this.filterSubject || t.subject === this.filterSubject) &&
            (!this.filterType || topicType === this.filterType) &&
            (name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
             description.toLowerCase().includes(this.searchQuery.toLowerCase()))
          );
        });
    },
    
    filteredStudyList() {
      return this.studyList.filter(t => {
        const name = this.getTopicName(t);
        const description = this.getTopicDescription(t);
        const topicType = this.getTopicType(t);
        
        return (
          (!this.filterSubject || t.subject === this.filterSubject) &&
          (!this.filterType || topicType === this.filterType) &&
          (name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
           description.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      });
    },
    
    userStatusLabel() {
      if (this.userStatus === 'pro') return 'Pro';
      if (this.userStatus === 'start') return 'Start';
      return 'Free';
    },
    
    hasErrors() {
      return this.errors.recommendations || this.errors.studyList;
    }
  },
  async mounted() {
    const storedId = this.$store.state.firebaseUserId || localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!storedId) {
      return this.$router.push('/');
    }
    this.userId = storedId;
    
    // Load in parallel but handle errors independently
    await Promise.allSettled([
      this.fetchRecommendations(),
      this.fetchStudyList()
    ]);
  },
  methods: {
    // ✅ ENHANCED: Topic type detection methods
    getTopicType(topic) {
      // Check various possible fields for topic type
      const type = topic.type || topic.accessType || topic.pricing || topic.plan;
      
      if (!type || type === 'free' || type === 'public') return 'free';
      if (type === 'premium' || type === 'paid' || type === 'start') return 'premium';
      if (type === 'pro' || type === 'professional') return 'pro';
      
      // Fallback: if no explicit type, assume free
      return 'free';
    },
    
    getTopicTypeClass(topic) {
      return `topic-${this.getTopicType(topic)}`;
    },
    
    getTopicTypeIcon(topic) {
      const type = this.getTopicType(topic);
      switch (type) {
        case 'free': return '💚';
        case 'premium': return '💎';
        case 'pro': return '🌟';
        default: return '💚';
      }
    },
    
    getTopicTypeLabel(topic) {
      const type = this.getTopicType(topic);
      switch (type) {
        case 'free': return 'Бесплатно';
        case 'premium': return 'Премиум';
        case 'pro': return 'Pro';
        default: return 'Бесплатно';
      }
    },
    
    // ✅ ENHANCED: Access status methods
    getAccessStatus(topic) {
      const topicType = this.getTopicType(topic);
      const hasAccess = this.hasTopicAccess(topic);
      
      if (hasAccess) return 'accessible';
      if (topicType === 'free') return 'accessible';
      return 'restricted';
    },
    
    getAccessIcon(topic) {
      const status = this.getAccessStatus(topic);
      switch (status) {
        case 'accessible': return '✅';
        case 'restricted': return '🔒';
        default: return '✅';
      }
    },
    
    getAccessText(topic) {
      const status = this.getAccessStatus(topic);
      const topicType = this.getTopicType(topic);
      
      if (status === 'accessible') {
        return topicType === 'free' ? 'Бесплатный доступ' : 'У вас есть доступ';
      }
      
      return `Требуется ${this.getTopicTypeLabel(topic)}`;
    },
    
    hasTopicAccess(topic) {
      const topicType = this.getTopicType(topic);
      
      if (topicType === 'free') return true;
      if (topicType === 'premium' && (this.userStatus === 'start' || this.userStatus === 'pro')) return true;
      if (topicType === 'pro' && this.userStatus === 'pro') return true;
      
      return false;
    },
    
    // ✅ ENHANCED: Button state methods
    isInStudyList(topic) {
      return this.studyList.some(t => t._id === topic._id);
    },
    
    getStartButtonClass(topic) {
      const hasAccess = this.hasTopicAccess(topic);
      const topicType = this.getTopicType(topic);
      
      if (!hasAccess) return 'btn-restricted';
      if (topicType === 'pro') return 'btn-pro';
      if (topicType === 'premium') return 'btn-premium';
      return 'btn-free';
    },
    
    getStartButtonIcon(topic) {
      if (!this.hasTopicAccess(topic)) return '🔒';
      return '🚀';
    },
    
    getStartButtonText(topic) {
      if (!this.hasTopicAccess(topic)) {
        const topicType = this.getTopicType(topic);
        return topicType === 'pro' ? 'Нужен Pro' : 'Нужен Start';
      }
      return 'Начать';
    },
    
    getStartButtonTitle(topic) {
      const topicType = this.getTopicType(topic);
      const hasAccess = this.hasTopicAccess(topic);
      
      if (!hasAccess) {
        return `Этот курс требует подписку ${this.getTopicTypeLabel(topic)}`;
      }
      
      return `Начать изучение курса "${this.getTopicName(topic)}"`;
    },
    
    // ✅ Enhanced filter methods
    clearFilters() {
      this.searchQuery = '';
      this.filterSubject = '';
      this.filterType = '';
    },
    
    getTopicName(topic) {
      return topic.name?.[this.lang] || topic.name?.en || topic.name || 'Без названия';
    },
    
    getTopicDescription(topic) {
      return topic.description?.[this.lang] || topic.description?.en || topic.description || 'Описание отсутствует';
    },

    // Enhanced error handling method
    handleApiError(error, context) {
      console.error(`❌ API Error [${context}]:`, error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 404:
            errorMessage = 'Resource not found. It may have been deleted.';
            break;
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            setTimeout(() => this.$router.push('/'), 2000);
            return { message: errorMessage, shouldRedirect: true };
          case 403:
            errorMessage = 'Access denied. You may not have permission.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = data?.message || `Server error (${status})`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || 'Something went wrong';
      }
      
      return { message: errorMessage, originalError: error };
    },

    async fetchRecommendations() {
      try {
        this.loadingRecommendations = true;
        this.errors.recommendations = null;
        
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error('No authentication token available');
        }
        
        const headers = { Authorization: `Bearer ${token}` };
        
        const response = await axios.get(`${BASE_URL}/users/${this.userId}/recommendations`, { headers });
        const data = response.data;
        
        this.recommendations = Array.isArray(data) ? data : [];
        this.extractSubjects(this.recommendations);
        
        
      } catch (err) {
        const errorInfo = this.handleApiError(err, 'fetch-recommendations');
        this.errors.recommendations = errorInfo.message;
        
        this.recommendations = [];
        
        if (err.response?.status === 404) {
          this.errors.recommendations = null;
        }
      } finally {
        this.loadingRecommendations = false;
      }
    },

    async fetchStudyList() {
      try {
        this.loadingStudyList = true;
        this.errors.studyList = null;
        this.invalidTopicsCleanedUp = 0;
        
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error('No authentication token available');
        }
        
        const headers = { Authorization: `Bearer ${token}` };
        
        const { data: studyListEntries } = await axios.get(`${BASE_URL}/users/${this.userId}/study-list`, { headers });
        
        if (!Array.isArray(studyListEntries) || studyListEntries.length === 0) {
          this.studyList = [];
          return;
        }
        
        let userProgressData = [];
        try {
          const progressResponse = await axios.get(`${BASE_URL}/users/${this.userId}/progress`, { headers });
          userProgressData = progressResponse.data?.data || progressResponse.data || [];
        } catch (progressError) {
          console.warn('⚠️ Failed to load progress data:', progressError.message);
        }
        
        const validTopics = [];
        
        const topicPromises = studyListEntries.map(async (entry) => {
          if (!entry.topicId) {
            console.warn('⚠️ Study list entry missing topicId:', entry);
            return null;
          }
          
          try {
            
            const topicRes = await axios.get(`${BASE_URL}/topics/${entry.topicId}`, { 
              headers,
              timeout: 10000
            });
            
            const topicData = topicRes.data?.data || topicRes.data;
            
            if (!topicData || !topicData._id) {
              console.warn(`⚠️ Invalid topic data structure for ${entry.topicId}`);
              return null;
            }
            
            
            let lessons = [];
            
            if (topicData.lessons && Array.isArray(topicData.lessons) && topicData.lessons.length > 0) {
              lessons = topicData.lessons;
            } else {
              try {
                const lessonsRes = await axios.get(`${BASE_URL}/lessons/topic/${entry.topicId}`, { 
                  headers,
                  timeout: 10000
                });
                
                if (lessonsRes.status === 200) {
                  lessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : 
                           Array.isArray(lessonsRes.data?.data) ? lessonsRes.data.data : [];
                }
              } catch (lessonsError) {
                console.warn(`⚠️ Failed to fetch lessons for topic ${entry.topicId}:`, lessonsError.message);
              }
            }
            
            
            let completedLessons = 0;
            let totalStars = 0;
            let totalPoints = 0;
            
            lessons.forEach(lesson => {
              const progress = userProgressData.find(p => {
                const progressLessonId = p.lessonId?._id || p.lessonId;
                return progressLessonId?.toString() === lesson._id?.toString();
              });
              
              if (progress && progress.completed) {
                completedLessons++;
                totalStars += progress.stars || 0;
                totalPoints += progress.points || 0;
              }
            });
            
            const progressPercent = lessons.length > 0 
              ? Math.round((completedLessons / lessons.length) * 100)
              : 0;
            
            let medal = 'none';
            if (progressPercent === 100 && lessons.length > 0) {
              const avgStars = totalStars / lessons.length;
              if (avgStars >= 2.5) medal = 'gold';
              else if (avgStars >= 1.5) medal = 'silver';
              else medal = 'bronze';
            }
            
            return {
              ...topicData,
              lessons: lessons,
              progress: {
                percent: progressPercent,
                medal: medal,
                completedLessons: completedLessons,
                totalLessons: lessons.length,
                stars: totalStars,
                points: totalPoints
              }
            };
            
          } catch (error) {
            console.error(`❌ Error processing topic ${entry.topicId}:`, error);
            return null;
          }
        });
        
        const results = await Promise.allSettled(topicPromises);
        
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            validTopics.push(result.value);
          }
        });
        
        this.studyList = validTopics;
        this.extractSubjects(this.studyList);
        
        
      } catch (err) {
        const errorInfo = this.handleApiError(err, 'fetch-study-list');
        this.errors.studyList = errorInfo.message;
        this.studyList = [];
        console.error('❌ Critical error in fetchStudyList:', err);
      } finally {
        this.loadingStudyList = false;
      }
    },

    extractSubjects(items) {
      const subjects = new Set(items.map(item => item.subject).filter(Boolean));
      this.allSubjects = Array.from(subjects);
    },

    async refreshRecommendations() {
      await this.fetchRecommendations();
    },

    async retryAll() {
      if (this.retryCount >= this.maxRetries) {
        console.warn('⚠️ Max retries reached');
        return;
      }
      
      this.retryCount++;
      
      await Promise.allSettled([
        this.errors.recommendations ? this.fetchRecommendations() : Promise.resolve(),
        this.errors.studyList ? this.fetchStudyList() : Promise.resolve()
      ]);
    },

    async handleAddTopic(topic) {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return alert('Пожалуйста, войдите в аккаунт.');
        
        const headers = { Authorization: `Bearer ${token}` };
        const url = `${BASE_URL}/users/${this.userId}/study-list`;
        
        const payload = {
          subject: topic.subject,
          level: topic.level,
          topic: this.getTopicName(topic),
          topicId: topic._id
        };
        
        await axios.post(url, payload, { headers });
        await this.fetchStudyList();
        
        this.recommendations = this.recommendations.filter(t => t._id !== topic._id);
        
        
      } catch (err) {
        const errorInfo = this.handleApiError(err, 'add-topic');
        console.error('❌ Add topic error details:', err.response?.data);
        alert(`Error adding topic: ${errorInfo.message}`);
      }
    },

    handleStartTopic(topic) {
      if (!topic._id) {
        console.warn('⚠️ Cannot start topic without ID');
        return;
      }
      
      const topicType = this.getTopicType(topic);
      const hasAccess = this.hasTopicAccess(topic);
      
      if (!hasAccess) {
        this.requestedTopicId = topic._id;
        this.showPaywall = true;
      } else {
        this.$router.push({ path: `/topic/${topic._id}/overview` });
      }
    },

    async removeStudyCard(id) {
      try {
        this.studyList = this.studyList.filter(topic => topic._id !== id);
        
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const headers = { Authorization: `Bearer ${token}` };
          await axios.delete(`${BASE_URL}/users/${this.userId}/study-list/${id}`, { headers });
        }
      } catch (error) {
        console.error('❌ Error removing study card:', error);
        await this.fetchStudyList();
      }
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ========================================
   🎨 BASE THEME: BLACK, WHITE, PURPLE
======================================== */
.dashboard {
  padding: 24px 16px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  min-height: 100vh;
  color: #1a1a1a;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
  margin-bottom: 32px;
  letter-spacing: -0.02em;
}

/* ========================================
   🎛️ CONTROLS
======================================== */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  padding: 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.search-input,
.filter-select {
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 400;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  color: #1a1a1a;
  transition: all 0.3s ease;
  min-width: 180px;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

.search-input::placeholder {
  color: #6b7280;
  font-weight: 400;
}

.filter-select option {
  background: #ffffff;
  color: #1a1a1a;
}

/* User Status Badge */
.user-status-badge {
  font-size: 0.75rem;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.user-status-badge.free {
  background: #6b7280;
}

.user-status-badge.start {
  background: #8b5cf6;
}

.user-status-badge.pro {
  background: #1a1a1a;
}

/* ========================================
   🚨 ERROR ALERTS
======================================== */
.error-alert {
  background: #fef2f2;
  border: 1px solid #ef4444;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-messages {
  flex: 1;
}

.error-messages p {
  margin: 0 0 4px 0;
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 500;
}

.retry-btn {
  background: #1a1a1a;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #8b5cf6;
  transform: translateY(-1px);
}

.retry-btn.inline {
  background: #8b5cf6;
  margin-top: 12px;
}

.retry-btn.inline:hover {
  background: #7c3aed;
}

/* ========================================
   📦 SECTIONS
======================================== */
.section {
  margin-bottom: 60px;
  position: relative;
}

.recommendations-section,
.study-section {
  padding: 32px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
  text-align: left;
  position: relative;
}

.section h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 3px;
  background: #8b5cf6;
  border-radius: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin-bottom: 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-count {
  background: #f3f4f6;
  color: #1a1a1a;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.refresh-btn {
  background: #1a1a1a;
  color: #ffffff;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: #8b5cf6;
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.info-badge {
  background: #8b5cf6;
  color: #ffffff;
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: default;
}

/* ========================================
   🃏 GRID & CARDS
======================================== */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  padding: 0;
}

.recommendation-placeholder,
.study-placeholder {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #6b7280;
  font-weight: 500;
}

.empty-message {
  text-align: center;
  margin-top: 40px;
  font-size: 1rem;
  color: #6b7280;
  font-weight: 400;
  padding: 40px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-message h3 {
  margin: 0 0 12px 0;
  color: #1a1a1a;
  font-size: 1.25rem;
  font-weight: 600;
}

.empty-message p {
  margin: 8px 0;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.clear-filters-btn {
  background: #6b7280;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.clear-filters-btn:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.browse-link {
  background: #8b5cf6;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.browse-link:hover {
  background: #7c3aed;
  transform: translateY(-1px);
}

/* ========================================
   🎴 TOPIC CARDS - CLEAN DESIGN
======================================== */
.topic-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  min-height: 280px;
  position: relative;
  overflow: hidden;
}

.topic-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: #8b5cf6;
}

/* Clean type indicators */
.topic-free {
  border-left: 4px solid #1a1a1a;
}

.topic-premium {
  border-left: 4px solid #8b5cf6;
}

.topic-pro {
  border-left: 4px solid #6b7280;
}

/* Topic type badge - simplified */
.topic-type-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 2;
}

.topic-type-badge.free {
  background: #f3f4f6;
  color: #1a1a1a;
  border: 1px solid #e5e7eb;
}

.topic-type-badge.premium {
  background: #f3f0ff;
  color: #8b5cf6;
  border: 1px solid #8b5cf6;
}

.topic-type-badge.pro {
  background: #1a1a1a;
  color: #ffffff;
  border: 1px solid #1a1a1a;
}

.badge-icon {
  font-size: 0.9rem;
}

.badge-text {
  font-size: 0.7rem;
}

/* Topic content */
.topic-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topic-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  line-height: 1.4;
  margin-top: 20px;
}

.topic-desc {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 8px 0 16px 0;
  line-height: 1.6;
  flex-grow: 1;
}

/* Topic metadata - clean */
.topic-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.metadata-icon {
  font-size: 0.9rem;
}

.metadata-text {
  font-weight: 500;
}

.difficulty-stars {
  display: flex;
  gap: 1px;
}

.star {
  color: #e5e7eb;
  font-size: 0.8rem;
}

.star.filled {
  color: #8b5cf6;
}

/* ========================================
   🔘 BUTTONS - CLEAN DESIGN
======================================== */
.card-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding: 0 24px 24px 24px;
}

.btn-add,
.btn-start {
  flex: 1;
  padding: 12px 16px;
  font-size: 0.85rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  border: 2px solid transparent;
}

.btn-add {
  background: #ffffff;
  color: #1a1a1a;
  border-color: #e5e7eb;
}

.btn-add:hover {
  background: #f9fafb;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-2px);
}

.btn-add:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.btn-add:disabled:hover {
  transform: none;
}

/* Start button variants - clean */
.btn-free,
.btn-premium,
.btn-pro {
  background: #1a1a1a;
  color: #ffffff;
  border-color: #1a1a1a;
}

.btn-free:hover,
.btn-premium:hover,
.btn-pro:hover {
  background: #8b5cf6;
  border-color: #8b5cf6;
  transform: translateY(-2px);
}

.btn-restricted {
  background: #6b7280;
  color: #ffffff;
  border-color: #6b7280;
}

.btn-restricted:hover {
  background: #4b5563;
  border-color: #4b5563;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 0.9rem;
}

.btn-text {
  font-size: 0.8rem;
}

/* ========================================
   📱 RESPONSIVE DESIGN
======================================== */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px 12px;
  }
  
  .title {
    font-size: 1.75rem;
    margin-bottom: 24px;
  }
  
  .controls {
    padding: 20px;
    gap: 12px;
  }
  
  .search-input,
  .filter-select {
    min-width: 140px;
    font-size: 0.85rem;
    padding: 10px 14px;
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .section h2 {
    font-size: 1.25rem;
  }
  
  .recommendations-section,
  .study-section {
    padding: 24px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .card-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .topic-metadata {
    flex-direction: column;
    gap: 8px;
  }
  
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.5rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .recommendations-section,
  .study-section {
    padding: 20px;
  }
  
  .topic-content {
    padding: 20px;
  }
  
  .card-buttons {
    padding: 0 20px 20px 20px;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.5rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .recommendations-section,
  .study-section {
    padding: 20px;
  }
}
</style>