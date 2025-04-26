<template>
    <div class="study-card">
      <div class="card-header">
        <h3 class="topic-name">{{ topic.name }}</h3>
        <MedalBadge v-if="progress.medal" :type="progress.medal" />
      </div>
  
      <ProgressBar :percent="progress.percent" />
  
      <div class="progress-text">
        Прогресс: {{ Math.round(progress.percent) }}%
      </div>
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
        required: true,
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
    height: 220px;
    justify-content: center;
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
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
  </style>
  