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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.dashboard {
  padding: 24px 16px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.dashboard::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #a8edea 50%, #fed6e3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 32px;
  letter-spacing: -0.02em;
  animation: titleGlow 3s ease-in-out infinite alternate;
  position: relative;
}

@keyframes titleGlow {
  0% { filter: drop-shadow(0 0 20px rgba(168, 237, 234, 0.5)); }
  100% { filter: drop-shadow(0 0 30px rgba(254, 214, 227, 0.7)); }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.controls::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.search-input,
.filter-select {
  padding: 12px 20px;
  font-size: 0.9rem;
  font-weight: 400;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 200px;
  position: relative;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: rgba(120, 219, 255, 0.8);
  box-shadow: 
    0 0 0 3px rgba(120, 219, 255, 0.2),
    0 0 20px rgba(120, 219, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.filter-select option {
  background: #1a1a2e;
  color: #ffffff;
}

.user-status-badge {
  font-size: 0.8rem;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.user-status-badge.free {
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.user-status-badge.start {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.user-status-badge.pro {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
}

.section {
  margin-bottom: 48px;
}

.section h2 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24px;
  text-align: left;
  position: relative;
  padding-left: 20px;
}

.section h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  border-radius: 2px;
  animation: sectionGlow 2s ease-in-out infinite alternate;
}

@keyframes sectionGlow {
  0% { box-shadow: 0 0 5px rgba(79, 172, 254, 0.5); }
  100% { box-shadow: 0 0 15px rgba(0, 242, 254, 0.8); }
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

.refresh-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
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
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 0;
}

.recommendation-placeholder,
.study-placeholder {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  animation: placeholderPulse 1.5s ease-in-out infinite;
}

@keyframes placeholderPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.empty-message {
  text-align: center;
  margin-top: 40px;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.topic-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 24px;
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 220px;
  position: relative;
  overflow: hidden;
}

.topic-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.topic-card:hover::before {
  transform: scaleX(1);
}

.topic-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.topic-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.topic-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 12px 0 16px 0;
  line-height: 1.6;
  flex-grow: 1;
}

.lesson-count {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  margin-bottom: 20px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: inline-block;
}

.card-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.btn-add,
.btn-start {
  flex: 1;
  padding: 12px 20px;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.btn-add::before,
.btn-start::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-add:hover::before,
.btn-start:hover::before {
  left: 100%;
}

.btn-add:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

.btn-start {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
  background: linear-gradient(135deg, #5fbdff, #1af3fe);
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px 12px;
  }
  
  .title {
    font-size: 2rem;
    margin-bottom: 24px;
  }
  
  .controls {
    padding: 20px;
    gap: 16px;
  }
  
  .search-input,
  .filter-select {
    min-width: 160px;
    font-size: 0.85rem;
    padding: 10px 16px;
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .section h2 {
    font-size: 1.4rem;
  }
  
  .card-buttons {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.75rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
    min-width: auto;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .topic-card {
    padding: 20px;
    min-height: 200px;
  }
}

/* Scrollbar styling for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5fbdff, #1af3fe);
}
</style>