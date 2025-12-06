<template>
  <div class="topic-card" @mouseover="hover = true" @mouseleave="hover = false">
    <div class="card-header">
      <h2 class="topic-title">{{ topic.name }}</h2>
      <p class="topic-subject">{{ topic.subject }}</p>
    </div>

    <p class="topic-description">
      {{ topic.description.length > 100 ? topic.description.slice(0, 100) + '...' : topic.description }}
    </p>

    <div class="card-buttons">
      <button class="add-btn" @click.stop="addToStudyList">➕ Добавить</button>
      <button class="start-btn" @click.stop="goToLesson">🚀 Начать</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TopicCard',
  props: {
    topic: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      hover: false,
    };
  },
  methods: {
    addToStudyList() {
      this.$emit('add', this.topic._id);
    },
    goToLesson() {
      const subject = this.topic.subject?.toLowerCase?.().replace(/\s+/g, '-');
      if (!subject) {
alert('❌ Предмет не указан.');
        return;
      }

      this.$router.push({ name: 'LessonPage', params: { subject } });
    },
  },
};
</script>

<style scoped>
.topic-card {
  background: linear-gradient(145deg, #c084fc, #a855f7);
  color: white;
  padding: 24px;
  border-radius: 18px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 260px;
}

.topic-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 14px 28px rgba(168, 85, 247, 0.3);
  background: linear-gradient(145deg, #a855f7, #8b5cf6);
}

.card-header {
  margin-bottom: 12px;
}

.topic-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #f3e8ff;
}

.topic-subject {
  font-size: 0.95rem;
  color: #ddd6fe;
}

.topic-description {
  font-size: 1rem;
  margin: 16px 0;
  color: #ede9fe;
}

.card-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.add-btn, .start-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.add-btn {
  background: #60a5fa;
  color: white;
}

.add-btn:hover {
  background: #3b82f6;
  transform: scale(1.05);
}

.start-btn {
  background: #f472b6;
  color: white;
}

.start-btn:hover {
  background: #ec4899;
  transform: scale(1.05);
}
</style>
