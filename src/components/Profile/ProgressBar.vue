<template>
  <div class="progress-container">
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: percent + '%' }"></div>
    </div>
    <div class="progress-text">{{ Math.round(percent) }}%</div>
  </div>
</template>

<script>
export default {
  name: 'ProgressBar',
  props: {
    percent: {
      type: Number,
      required: true,
      default: 0,
    },
  },
};
</script>

<style scoped>
.progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.progress-track {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  transition: width 0.4s ease;
  border-radius: 12px 0 0 12px;
}

.progress-text {
  font-size: 0.85rem;
  color: #4b5563;
  font-weight: 600;
}
</style>
