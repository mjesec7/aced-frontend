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
    goToLesson() {
      const subject = this.topic.subject?.toLowerCase?.().replace(/\s+/g, '-');
      if (!subject) {
        console.warn('⚠️ [StudyCard] subject missing in topic:', this.topic);
        alert('❌ Предмет не указан для перехода.');
        return;
      }

      console.log('🚀 Navigating to LessonPage for subject:', subject);
      this.$router.push({ name: 'LessonPage', params: { subject } });
    }
  }
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
