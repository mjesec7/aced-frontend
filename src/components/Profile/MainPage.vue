<template>
  <div class="dashboard">
    <h1 class="title">👋 Добро пожаловать обратно!</h1>
    <div class="controls">
      <input v-model="searchQuery" class="search-input" placeholder="🔍 Поиск тем или курсов..." />
      <select v-model="filterSubject" class="filter-select">
        <option value="">Все предметы</option>
        <option v-for="subject in allSubjects" :key="subject" :value="subject">{{ subject }}</option>
      </select>
      <span class="user-status-badge" :class="userStatus">{{ userStatusLabel }}</span>
    </div>

    <!-- 🌟 Recommendations -->
    <div class="section">
      <div class="section-header">
        <h2>🌟 Рекомендовано для вас</h2>
        <button class="refresh-btn" @click="refreshRecommendations" :disabled="loadingRecommendations">
          🔄 Обновить
        </button>
      </div>

      <div v-if="loadingRecommendations" class="grid">
        <div class="recommendation-placeholder" v-for="n in 4" :key="n">⏳</div>
      </div>

      <div v-else-if="filteredRecommendations.length" class="grid">
        <div class="topic-card" v-for="topic in filteredRecommendations" :key="topic._id">
          <h3 class="topic-title">📘 {{ getTopicName(topic) }}</h3>
          <p class="topic-desc">{{ getTopicDescription(topic) }}</p>
          <p class="lesson-count">Уроков: {{ topic.lessons?.length || 0 }}</p>
          <div class="card-buttons">
            <button class="btn-add" @click="handleAddTopic(topic)">＋ Добавить</button>
            <button class="btn-start" @click="handleStartTopic(topic)">🚀 Начать</button>
          </div>
        </div>
      </div>

      <div v-else class="empty-message">Нет подходящих рекомендаций.</div>
    </div>

    <!-- 📚 Study List -->
    <div class="section">
      <h2>📘 Мои курсы</h2>
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

      <div v-else class="empty-message">У вас пока нет активных курсов.</div>
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
      showPaywall: false,
      requestedTopicId: null,
      lang: localStorage.getItem('lang') || 'en'
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
          return (
            (!this.filterSubject || t.subject === this.filterSubject) &&
            (name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
             description.toLowerCase().includes(this.searchQuery.toLowerCase()))
          );
        });
    },
    filteredStudyList() {
      return this.studyList.filter(t => {
        const name = this.getTopicName(t);
        const description = this.getTopicDescription(t);
        return (
          (!this.filterSubject || t.subject === this.filterSubject) &&
          (name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
           description.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      });
    },
    userStatusLabel() {
      if (this.userStatus === 'pro') return 'Pro';
      if (this.userStatus === 'start') return 'Start';
      return 'Free';
    }
  },
  async mounted() {
    const storedId = this.$store.state.firebaseUserId || localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!storedId) {
      return this.$router.push('/');
    }
    this.userId = storedId;
    await Promise.all([this.fetchRecommendations(), this.fetchStudyList()]);
  },
  methods: {
    getTopicName(topic) {
      return topic.name?.[this.lang] || topic.name?.en || topic.name || 'Без названия';
    },
    getTopicDescription(topic) {
      return topic.description?.[this.lang] || topic.description?.en || topic.description || 'Описание отсутствует';
    },
    async fetchRecommendations() {
      try {
        this.loadingRecommendations = true;
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(`${BASE_URL}/users/${this.userId}/recommendations`, { headers });
        this.recommendations = Array.isArray(data) ? data : [];
        this.extractSubjects(this.recommendations);
      } catch (err) {
        console.error('❌ Ошибка загрузки рекомендаций:', err);
      } finally {
        this.loadingRecommendations = false;
      }
    },
    // In MainPage.vue, update the fetchStudyList method to include progress:

async fetchStudyList() {
  try {
    this.loadingStudyList = true;
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get study list
    const { data } = await axios.get(`${BASE_URL}/users/${this.userId}/study-list`, { headers });
    
    // Get user's progress for all lessons
    const progressResponse = await axios.get(`${BASE_URL}/progress`, {
      headers,
      params: { userId: this.userId }
    });
    
    const userProgressData = progressResponse.data.data || [];
    
    // Create a map of topic progress
    const topicProgressMap = {};
    
    // Process each study list item
    const enriched = await Promise.all(
      data.map(async (item) => {
        try {
          // Get topic details
          const topicRes = await axios.get(`${BASE_URL}/topics/${item.topicId}`, { headers });
          const lessonsRes = await axios.get(`${BASE_URL}/lessons/topic/${item.topicId}`, { headers });
          
          if (!Array.isArray(lessonsRes.data) || lessonsRes.data.length === 0) {
            console.warn('❌ No lessons for topic, removing from list:', item.topicId);
            return null;
          }
          
          const lessons = lessonsRes.data;
          const topicId = item.topicId;
          
          // Calculate progress for this topic
          let completedLessons = 0;
          let totalStars = 0;
          let totalPoints = 0;
          
          lessons.forEach(lesson => {
            const progress = userProgressData.find(p => 
              (p.lessonId?._id || p.lessonId) === lesson._id
            );
            
            if (progress && progress.completed) {
              completedLessons++;
              totalStars += progress.stars || 0;
              totalPoints += progress.points || 0;
            }
          });
          
          const progressPercent = lessons.length > 0 
            ? Math.round((completedLessons / lessons.length) * 100)
            : 0;
          
          // Determine medal based on completion and performance
          let medal = 'none';
          if (progressPercent === 100) {
            const avgStars = totalStars / lessons.length;
            if (avgStars >= 2.5) medal = 'gold';
            else if (avgStars >= 1.5) medal = 'silver';
            else medal = 'bronze';
          }
          
          return {
            ...topicRes.data,
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
        } catch (e) {
          console.warn('❌ Failed to fetch topic:', item.topicId);
          return null;
        }
      })
    );
    
    this.studyList = enriched.filter(Boolean);
    this.extractSubjects(this.studyList);
    
    console.log('📚 Study list with progress loaded:', this.studyList);
  } catch (err) {
    console.error('❌ Error loading study list:', err);
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
        console.error('❌ Ошибка добавления темы:', err);
      }
    },
    handleStartTopic(topic) {
      if (!topic._id) return;
      if (topic.type === 'premium' && (!this.userStatus || this.userStatus === 'free')) {
        this.requestedTopicId = topic._id;
        this.showPaywall = true;
      } else {
        this.$router.push({ path: `/topic/${topic._id}/overview` });
      }
    },
    removeStudyCard(id) {
      this.studyList = this.studyList.filter(topic => topic._id !== id);
    }
  }
};
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.dashboard {
  padding: 40px 24px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

.title {
  font-size: 3rem;
  font-weight: 800;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 48px;
  text-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.02em;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: center;
  margin-bottom: 50px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-input,
.filter-select {
  padding: 16px 24px;
  font-size: 1.1rem;
  font-weight: 500;
  border: 2px solid transparent;
  border-radius: 16px;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #667eea, #764ba2) border-box;
  color: #1f2937;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 200px;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  border-color: #667eea;
}

.search-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.user-status-badge {
  font-size: 0.9rem;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
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
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.user-status-badge.start {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.user-status-badge.pro {
  background: linear-gradient(135deg, #10b981, #059669);
}

.section {
  margin-bottom: 80px;
}

.section h2 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 32px;
  text-align: center;
  position: relative;
}

.section h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section-header h2 {
  margin-bottom: 0;
  text-align: left;
}

.section-header h2::after {
  left: 0;
  transform: none;
}

.refresh-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 14px 28px;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
}

.refresh-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
}

.refresh-btn:active {
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
  padding: 20px 0;
}

.recommendation-placeholder,
.study-placeholder {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 20px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #64748b;
  font-weight: 700;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.recommendation-placeholder::before,
.study-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.recommendation-placeholder:hover,
.study-placeholder:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.3);
}

.recommendation-placeholder:hover::before,
.study-placeholder:hover::before {
  opacity: 1;
}

.empty-message {
  text-align: center;
  margin-top: 60px;
  font-size: 1.25rem;
  color: #64748b;
  font-weight: 600;
  padding: 40px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.topic-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  min-height: 280px;
}

.topic-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.topic-card:hover {
  transform: translateY(-10px) scale(1.03);
  box-shadow: 0 20px 50px rgba(102, 126, 234, 0.25);
  border-color: rgba(102, 126, 234, 0.3);
}

.topic-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 12px;
  line-height: 1.3;
}

.topic-desc {
  font-size: 1rem;
  color: #64748b;
  margin: 16px 0;
  line-height: 1.6;
  flex-grow: 1;
}

.lesson-count {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 20px;
}

.card-buttons {
  display: flex;
  gap: 16px;
  margin-top: auto;
}

.btn-add,
.btn-start {
  flex: 1;
  padding: 14px 20px;
  font-size: 0.95rem;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-add {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5);
}

.btn-start {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
}

.btn-add:active,
.btn-start:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 24px 16px;
  }
  
  .title {
    font-size: 2.2rem;
  }
  
  .controls {
    padding: 24px;
    gap: 16px;
  }
  
  .search-input,
  .filter-select {
    min-width: 160px;
    font-size: 1rem;
    padding: 14px 20px;
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .section h2 {
    font-size: 2rem;
  }
  
  .card-buttons {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>