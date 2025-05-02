<template>
  <div class="study-card">
    <div class="card-header">
      <h3 class="topic-name">{{ displayName }}</h3>
      <MedalBadge v-if="isValidMedal(progress.medal)" :type="progress.medal" />
    </div>

    <ProgressBar :percent="safePercent" />

    <div class="progress-text">
      Прогресс: {{ safePercent }}%
    </div>

    <button class="continue-btn" @click="goToLesson">
      ▶️ Продолжить
    </button>
  </div>
</template>

<script>
import axios from 'axios';
import MedalBadge from '@/components/Profile/MedalBadge.vue';
import ProgressBar from '@/components/Profile/ProgressBar.vue';

export default {
  name: 'StudyCard',
  components: {
    MedalBadge,
    ProgressBar,
  },
  props: {
    topic: {
      type: Object,
      required: true,
    },
    progress: {
      type: Object,
      default: () => ({ percent: 0, medal: 'none' }),
    },
  },
  computed: {
    displayName() {
      return this.topic.name || this.topic.topic || 'Без названия';
    },
    safePercent() {
      const value = parseFloat(this.progress.percent);
      return isNaN(value) ? 0 : Math.round(value);
    },
  },
  methods: {
    isValidMedal(type) {
      return ['gold', 'silver', 'bronze'].includes(type);
    },

    async goToLesson() {
      const subject = this.topic.subject;
      const topicName = this.topic.name || this.topic.topic;

      if (!subject || !topicName) {
        console.warn('❌ [StudyCard] Missing subject or topic:', this.topic);
        alert('❌ Урок не может быть открыт — нет темы или предмета.');
        return;
      }

      try {
        const url = `${process.env.VUE_APP_API_URL}/lessons/topic/${encodeURIComponent(topicName)}`;
        console.log('📡 [StudyCard] Fetching lesson from:', url);
        const { data } = await axios.get(url);

        if (!data.length) {
          throw new Error('No lessons found for this topic');
        }

        const lessonId = data[0]._id;
        console.log('✅ [StudyCard] Lesson found:', lessonId);

        this.$router.push({ name: 'LessonView', params: { id: lessonId } });

      } catch (err) {
        console.error('❌ [StudyCard] Failed to go to lesson:', err);
        alert('❌ Урок не найден. Проверьте консоль.');
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
  gap: 16px;
  height: 260px;
  justify-content: center;
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

.progress-text {
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  font-weight: 600;
}

.continue-btn {
  align-self: center;
  padding: 8px 20px;
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
