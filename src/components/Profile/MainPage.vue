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

            <!-- Access Status for Current User -->
            <div class="access-status" :class="getAccessStatus(topic)">
              <span class="access-icon">{{ getAccessIcon(topic) }}</span>
              <span class="access-text">{{ getAccessText(topic) }}</span>
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
        
        console.log(`✅ Loaded ${this.recommendations.length} recommendations`);
        
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
        console.log(`📋 Raw study list data:`, studyListEntries);
        
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
            console.log(`🔍 Processing topic: ${entry.topicId}`);
            
            const topicRes = await axios.get(`${BASE_URL}/topics/${entry.topicId}`, { 
              headers,
              timeout: 10000
            });
            
            const topicData = topicRes.data?.data || topicRes.data;
            
            if (!topicData || !topicData._id) {
              console.warn(`⚠️ Invalid topic data structure for ${entry.topicId}`);
              return null;
            }
            
            console.log(`✅ Topic found: ${this.getTopicName(topicData)}`);
            
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
            
            console.log(`✅ Found ${lessons.length} lessons for topic ${entry.topicId}`);
            
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
        
        console.log(`✅ Study list loaded: ${validTopics.length} valid topics`);
        
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
      console.log(`🔄 Retrying... (${this.retryCount}/${this.maxRetries})`);
      
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
        
        console.log(`✅ Added topic to study list: ${this.getTopicName(topic)}`);
        
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
          console.log(`✅ Removed topic ${id} from study list`);
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

.dashboard {
  padding: 24px 16px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
  position: relative;
}

.dashboard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.03;
  z-index: 0;
}

.dashboard > * {
  position: relative;
  z-index: 1;
}

.title {
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  color: #1a1a1a;
  margin-bottom: 32px;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-input,
.filter-select {
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 400;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  color: #374151;
  transition: all 0.3s ease;
  min-width: 180px;
  backdrop-filter: blur(5px);
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  background: white;
  transform: translateY(-1px);
}

.search-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.filter-select option {
  background: white;
  color: #374151;
}

.user-status-badge {
  font-size: 0.75rem;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.user-status-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.user-status-badge:hover::before {
  left: 100%;
}

.user-status-badge.free {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.user-status-badge.start {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.user-status-badge.pro {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.user-status-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

/* Error Alert */
.error-alert {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fca5a5;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
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
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.retry-btn.inline {
  background: #3b82f6;
  margin-top: 12px;
}

.retry-btn.inline:hover {
  background: #2563eb;
}

.section {
  margin-bottom: 60px;
  position: relative;
}

.recommendations-section {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.02) 0%, rgba(79, 70, 229, 0.02) 100%);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid rgba(147, 51, 234, 0.1);
  backdrop-filter: blur(10px);
}

.study-section {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(5, 150, 105, 0.02) 100%);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.1);
  backdrop-filter: blur(10px);
}

.section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
  text-align: left;
  position: relative;
}

.recommendations-section h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #9333ea, #4f46e5);
  border-radius: 2px;
}

.study-section h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
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
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.refresh-btn {
  background: linear-gradient(135deg, #1a1a1a 0%, #374151 100%);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.refresh-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.refresh-btn:hover::before {
  left: 100%;
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.info-badge {
  background: #10b981;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: default;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  padding: 0;
}

.recommendation-placeholder,
.study-placeholder {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 16px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #9ca3af;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.recommendation-placeholder::before,
.study-placeholder::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.empty-message {
  text-align: center;
  margin-top: 40px;
  font-size: 1rem;
  color: #6b7280;
  font-weight: 400;
  padding: 40px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 16px;
  border: 1px solid rgba(229, 231, 235, 0.6);
  backdrop-filter: blur(10px);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-message h3 {
  margin: 0 0 12px 0;
  color: #374151;
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
  color: white;
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
  background: #3b82f6;
  color: white;
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
  background: #2563eb;
  transform: translateY(-1px);
}

/* ✅ ENHANCED: Topic card styles with type indicators */
.topic-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(229, 231, 235, 0.6);
  min-height: 280px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.topic-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.topic-card:hover::before {
  transform: scaleX(1);
}

.topic-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

/* Topic type specific styles */
.topic-free {
  border-left: 4px solid #10b981;
}

.topic-premium {
  border-left: 4px solid #f59e0b;
}

.topic-pro {
  border-left: 4px solid #8b5cf6;
}

/* Topic type badge */
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
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 1px solid #10b981;
}

.topic-type-badge.premium {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #f59e0b;
}

.topic-type-badge.pro {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
  border: 1px solid #8b5cf6;
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
  margin-top: 20px; /* Space for badge */
}

.topic-desc {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 8px 0 16px 0;
  line-height: 1.6;
  flex-grow: 1;
}

/* Topic metadata */
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
  color: #d1d5db;
  font-size: 0.8rem;
}

.star.filled {
  color: #fbbf24;
}

/* Access status */
.access-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 16px;
}

.access-status.accessible {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 1px solid #10b981;
}

.access-status.restricted {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
  border: 1px solid #ef4444;
}

.access-icon {
  font-size: 0.9rem;
}

.access-text {
  font-size: 0.75rem;
}

/* Card buttons */
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
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}

.btn-add::before,
.btn-start::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.btn-add:hover::before,
.btn-start:hover::before {
  left: 100%;
}

.btn-add {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #374151;
  border: 1px solid #e2e8f0;
}

.btn-add:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
  color: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
}

.btn-add:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.btn-add:disabled:hover {
  transform: none;
  box-shadow: none;
}

/* Start button variants */
.btn-free {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: 1px solid #10b981;
}

.btn-free:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.btn-premium {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: 1px solid #f59e0b;
}

.btn-premium:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

.btn-pro {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: 1px solid #8b5cf6;
}

.btn-pro:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
}

.btn-restricted {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  border: 1px solid #6b7280;
}

.btn-restricted:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(107, 114, 128, 0.4);
}

.btn-icon {
  font-size: 0.9rem;
}

.btn-text {
  font-size: 0.8rem;
}

/* Responsive Design */
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