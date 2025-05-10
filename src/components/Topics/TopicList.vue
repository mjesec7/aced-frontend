<template>
    <div class="topic-list">
      <h1 class="title">Темы для изучения</h1>
      <div v-if="loading" class="loading">Загрузка тем...</div>
  
      <div v-else class="grid">
        <TopicCard
          v-for="topic in topics"
          :key="topic._id"
          :topic="topic"
          @add="handleAddTopic"
          @start="handleStartTopic"
        />
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import TopicCard from '@/components/Topics/TopicCard.vue';
  
  export default {
    name: 'TopicList',
    components: { TopicCard },
    data() {
      return {
        topics: [],
        loading: true,
      };
    },
    async mounted() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/topics`);
        this.topics = res.data;
      } catch (err) {
        console.error('❌ Ошибка загрузки тем:', err);
      } finally {
        this.loading = false;
      }
    },
    methods: {
      async handleAddTopic(topicId) {
        try {
          await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users/${this.$root.firebaseUserId}/study-list`, {
            topicId
          });
          alert('✅ Тема добавлена в список!');
        } catch (err) {
          console.error('❌ Ошибка при добавлении темы:', err);
        }
      },
      handleStartTopic(topicId) {
        this.$router.push(`/topic/${topicId}/overview`);
      },
    },
  };
  </script>
  
  <style scoped>
  .topic-list {
    padding: 40px 20px;
    max-width: 1200px;
    margin: 0 auto;
    font-family: 'Inter', sans-serif;
  }
  
  .title {
    font-size: 2.2rem;
    font-weight: 800;
    color: #4c1d95;
    margin-bottom: 30px;
    text-align: center;
  }
  
  .loading {
    text-align: center;
    font-size: 1.1rem;
    color: #6b7280;
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
  </style>