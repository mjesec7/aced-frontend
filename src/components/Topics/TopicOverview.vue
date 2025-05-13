<template>
  <div class="topic-overview">
    <div v-if="loading" class="loading">Загрузка информации о теме...</div>

    <div v-else>
      <h1 class="title">{{ topic.name?.en || topic.name }}</h1>
      <p class="description">{{ topic.description?.en || topic.description }}</p>

      <ul class="details">
        <li><strong>⏳ Время изучения:</strong> {{ topic.timeEstimate || estimatedTime }} минут</li>
        <li v-if="topic.skills?.length"><strong>✨ Навыки:</strong> {{ topic.skills.join(', ') }}</li>
        <li><strong>🧠 Предмет:</strong> {{ topic.subject }}</li>
      </ul>

      <div class="buttons">
        <button class="start-btn" @click="startLearning">🚀 Начать обучение</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TopicOverview',
  data() {
    return {
      topic: {},
      loading: true,
      estimatedTime: 0,
    };
  },
  async mounted() {
    const topicId = this.$route.params.id;
    try {
      // Try fetching the lesson first (used to get topicId)
      const lessonRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/lessons/by-topic/${topicId}`);
      const lessonTopic = lessonRes.data?.topicId || topicId;

      // Fetch topic by topicId
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/topics/${lessonTopic}`);
      this.topic = res.data;
      this.calculateEstimatedTime();
    } catch (err) {
      console.error('❌ Ошибка загрузки темы:', err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    calculateEstimatedTime() {
      const textBlocks = ['explanation', 'content', 'examples']
        .map(k => this.topic[k]?.en || this.topic[k] || '')
        .join(' ');
      const wordCount = textBlocks.trim().split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 50);
      const exerciseTime = Math.ceil((this.topic.exercises?.length || 0) * 1.5);
      this.estimatedTime = readTime + exerciseTime;
    },
    startLearning() {
      this.$router.push(`/topic/${this.$route.params.id}/lessons`);
    },
  },
};
</script>

<style scoped>
.topic-overview {
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}

.loading {
  text-align: center;
  font-size: 1.1rem;
  color: #6b7280;
  margin-top: 60px;
}

.title {
  font-size: 2.4rem;
  font-weight: 800;
  color: #c084fc;
  margin-bottom: 20px;
  text-align: center;
}

.description {
  font-size: 1.1rem;
  color: #4b5563;
  margin-bottom: 20px;
  text-align: center;
}

.details {
  list-style: none;
  padding: 0;
  margin-bottom: 30px;
  color: #4b5563;
  font-size: 1rem;
}
.details li {
  margin-bottom: 10px;
}

.buttons {
  display: flex;
  justify-content: center;
}

.start-btn {
  padding: 12px 24px;
  background: linear-gradient(to right, #60a5fa, #9333ea);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s, background 0.3s;
}

.start-btn:hover {
  transform: scale(1.05);
  background: linear-gradient(to right, #4f46e5, #8b5cf6);
}
</style>