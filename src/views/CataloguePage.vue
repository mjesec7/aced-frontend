<template>
    <div class="lessons-page">
      <div class="page-header">
        <h1 class="page-title">📚 Каталог Уроков</h1>
        <span class="subscription-badge" :class="subscriptionClass">
          {{ subscriptionText }}
        </span>
      </div>
  
      <!-- 🔍 Search and Filter Controls -->
      <div class="controls">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="🔍 Поиск уроков или тем..."
        />
        <select v-model="filterType" class="filter-select">
          <option value="all">Все</option>
          <option value="free">Бесплатные</option>
          <option value="premium">Премиум</option>
        </select>
      </div>
  
      <div v-if="loading" class="loading">Загрузка уроков...</div>
  
      <div v-else-if="filteredLessons.length" class="lessons-grid">
        <div v-for="lesson in filteredLessons" :key="lesson._id" class="lesson-card">
          <div class="card-header">
            <h2 class="lesson-title">{{ lesson.lessonName }}</h2>
            <button class="add-btn" @click="addToStudyPlan(lesson)">＋</button>
          </div>
          <p class="lesson-topic">{{ lesson.topic }}</p>
          <span class="subject-badge">{{ lesson.subject }}</span>
          <span class="access-label" :class="lesson.type === 'premium' ? 'paid' : 'free'">
            {{ lesson.type === 'premium' ? 'Платный' : 'Бесплатный' }}
          </span>
          <button class="start-btn" @click="handleAccess(lesson)">Начать курс</button>
        </div>
      </div>
  
      <div v-else class="no-lessons">❌ Уроки не найдены.</div>
  
      <div v-if="showPaywall" class="modal">
        <div class="modal-content">
          <p>🚫 Этот курс доступен только по подписке.</p>
          <button @click="goToPayment">Перейти к тарифам</button>
          <button @click="showPaywall = false">Отмена</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { mapState } from 'vuex';
  import { auth } from '@/firebase';
  
  export default {
    name: 'CataloguePage',
    data() {
      return {
        lessons: [],
        loading: true,
        userId: null,
        filterType: 'all',
        searchQuery: '',
        showPaywall: false,
        requestedTopicId: null,
        plan: 'free'
      };
    },
    computed: {
      ...mapState(['firebaseUserId', 'user']),
      filteredLessons() {
        return this.lessons.filter((lesson) => {
          const matchesFilter = this.filterType === 'all' || lesson.type === this.filterType;
          const matchesSearch =
            lesson.lessonName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            lesson.topic.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            lesson.subject.toLowerCase().includes(this.searchQuery.toLowerCase());
          return matchesFilter && matchesSearch;
        });
      },
      subscriptionClass() {
        return this.plan === 'pro' ? 'badge-pro' : this.plan === 'start' ? 'badge-start' : 'badge-free';
      },
      subscriptionText() {
        return this.plan === 'pro' ? 'Pro подписка' : this.plan === 'start' ? 'Start подписка' : 'Бесплатный доступ';
      }
    },
    async mounted() {
      const storedId =
        this.firebaseUserId ||
        localStorage.getItem('firebaseUserId') ||
        localStorage.getItem('userId');
  
      if (!storedId) {
        console.warn('❌ Нет ID пользователя.');
        this.loading = false;
        return;
      }
  
      this.userId = storedId;
  
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.plan = res.data.status || 'free';
      } catch (err) {
        console.warn('⚠️ Не удалось получить статус подписки.');
      }
  
      this.loadLessons();
    },
    methods: {
      async loadLessons() {
        try {
          const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/lessons`);
          this.lessons = Array.isArray(data) ? data : [];
          console.log(`✅ Загрузено ${this.lessons.length} уроков`);
        } catch (error) {
          console.error('❌ Ошибка при загрузке уроков:', error.response?.data || error.message);
        } finally {
          this.loading = false;
        }
      },
      handleAccess(lesson) {
        if (lesson.type === 'premium' && (!this.plan || this.plan === 'free')) {
          this.requestedTopicId = lesson.topicId;
          this.showPaywall = true;
        } else {
          this.$router.push({ name: 'TopicOverview', params: { id: lesson.topicId } });
        }
      },
      async addToStudyPlan(lesson) {
        if (!auth.currentUser) {
          alert('Пожалуйста, войдите в аккаунт.');
          return;
        }
  
        try {
          const token = await auth.currentUser.getIdToken();
          const url = `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/study-list`;
          const body = {
            subject: lesson.subject,
            topic: lesson.topic
          };
  
          await axios.post(url, body, {
            headers: { Authorization: `Bearer ${token}` }
          });
  
          alert(`✅ Урок "${lesson.lessonName}" добавлен!`);
        } catch (error) {
          console.error('❌ Ошибка при добавлении в учебный план:', error.response?.data || error.message);
          alert('❌ Не удалось добавить урок в учебный план');
        }
      },
      goToPayment() {
        this.showPaywall = false;
        this.$router.push({ name: 'PaymePayment', params: { plan: 'start' } });
      }
    }
  };
  </script>
  
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  
  .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.subscription-badge {
  padding: 8px 16px;
  font-weight: 700;
  border-radius: 16px;
  font-size: 0.85rem;
}
.badge-free {
  background-color: #f87171;
  color: white;
}
.badge-start {
  background-color: #facc15;
  color: black;
}
.badge-pro {
  background-color: #10b981;
  color: white;
}
  .lessons-page {
    padding: 40px 20px;
    max-width: 1300px;
    margin: 0 auto;
    font-family: 'Inter', sans-serif;
  }
  
  .page-title {
    font-size: 2.6rem;
    font-weight: 900;
    color: #4f46e5;
    margin-bottom: 40px;
    text-align: center;
  }
  
  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 30px;
  }
  
  .search-input {
    flex: 1;
    padding: 12px 16px;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
  }
  
  .filter-select {
    padding: 12px 14px;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
  }
  
  .loading, .no-lessons {
    text-align: center;
    font-size: 1.1rem;
    color: #9ca3af;
    margin-top: 60px;
  }
  
  .lessons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 28px;
  }
  
  .lesson-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
    cursor: default;
    position: relative;
  }
  
  .lesson-card.locked {
    opacity: 0.6;
    pointer-events: none;
  }
  
  .lesson-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 10px 24px rgba(79, 70, 229, 0.2);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .lesson-title {
    font-size: 1.3rem;
    font-weight: 800;
    color: #1f2937;
  }
  
  .lesson-topic {
    font-size: 1rem;
    color: #6b7280;
    margin-top: 12px;
  }
  
  .subject-badge {
    font-size: 0.8rem;
    padding: 6px 12px;
    background: linear-gradient(to right, #8b5cf6, #ec4899);
    color: white;
    border-radius: 20px;
    display: inline-block;
    font-weight: 600;
    margin-top: 10px;
  }
  
  .access-label {
    margin-top: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 14px;
    display: inline-block;
    align-self: flex-start;
  }
  
  .access-label.free {
    background-color: #10b981;
    color: white;
  }
  
  .access-label.paid {
    background-color: #ef4444;
    color: white;
  }
  
  .add-btn {
    background: #10b981;
    color: white;
    font-size: 1.2rem;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  .add-btn:hover {
    background: #059669;
  }
  
  .start-btn {
    margin-top: 20px;
    background: linear-gradient(to right, #60a5fa, #818cf8);
    color: white;
    padding: 12px 18px;
    font-size: 0.95rem;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  .start-btn:hover {
    background: linear-gradient(to right, #3b82f6, #6366f1);
  }
  .modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 14px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-content button {
  margin-top: 15px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.modal-content button:first-child {
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  color: white;
}

.modal-content button:last-child {
  background: #e5e7eb;
  color: #1f2937;
}
  </style>