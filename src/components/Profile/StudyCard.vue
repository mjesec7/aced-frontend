<template>
  <div class="study-card">
    <div class="card-header">
      <h3 class="topic-name">{{ displayName }}</h3>
      <img v-if="medal" :src="`/assets/medals/${medal}.png`" :alt="medal" class="medal-icon" />
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: lessonProgress + '%' }"></div>
    </div>

    <div class="progress-info">
      <span>{{ lessonProgress }}% завершено</span>
      <p class="estimated-time">⏱ ~{{ estimatedDuration }} мин</p>
    </div>

    <button class="continue-btn" @click="goToLesson">
      ▶️ Продолжить
    </button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'StudyCard',
  props: {
    topic: { type: Object, required: true },
    progress: { type: Object, default: () => ({ percent: 0, medal: 'none' }) },
  },
  computed: {
    displayName() {
      return this.topic.name || this.topic.topic || 'Без названия';
    },
    lessonProgress() {
      const val = parseFloat(this.progress.percent);
      return isNaN(val) ? 0 : Math.round(val);
    },
    medal() {
      return this.progress.medal || '';
    },
    estimatedDuration() {
      const explanation = this.topic.explanation || '';
      const content = this.topic.content || '';
      const examples = this.topic.examples || '';
      const exercisesCount = this.topic.exercises?.length || 0;

      const wordCount = (explanation + content + examples).split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 50); // 50 words/min
      const exerciseTime = Math.ceil(exercisesCount * 1.5);

      return readTime + exerciseTime;
    }
  },
  methods: {
    async goToLesson() {
      const subject = this.topic.subject;
      const topicName = this.topic.name || this.topic.topic;

      if (!subject || !topicName) {
        alert('❌ Урок не может быть открыт — нет темы или предмета.');
        return;
      }

      try {
        const url = `${process.env.VUE_APP_API_URL}/lessons/by-name?subject=${encodeURIComponent(subject)}&name=${encodeURIComponent(topicName)}`;
        const { data } = await axios.get(url);
        const lessonId = data?._id;

        if (!lessonId) throw new Error('Lesson not found');
        this.$router.push({ name: 'LessonPage', params: { id: lessonId } });

      } catch (err) {
        console.error('❌ Ошибка загрузки урока:', err);
        alert('❌ Урок не найден.');
      }
    },
  },
};
</script>



<style scoped>
.study-card {
  background: linear-gradient(to right, #f9fafb, #f3f4f6);
  padding: 24px;
  border-radius: 18px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 280px;
  justify-content: space-between;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: default;
}

.study-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 24px rgba(147, 51, 234, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topic-name {
  font-size: 1.3rem;
  font-weight: 800;
  color: #7c3aed;
}

.medal-icon {
  width: 36px;
  height: 36px;
}

.progress-bar {
  background: #e5e7eb;
  height: 10px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 600;
  color: #4b5563;
  margin-top: 4px;
}

.estimated-time {
  font-style: italic;
  font-weight: 500;
  color: #6b7280;
}

.continue-btn {
  align-self: center;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(to right, #4f46e5, #8b5cf6);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.continue-btn:hover {
  background: linear-gradient(to right, #4338ca, #7c3aed);
}
</style>
