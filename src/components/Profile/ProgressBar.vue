<template>
  <div class="progress-container">
    <div class="progress-wrapper">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: percent + '%' }"></div>
      </div>
      <span class="progress-text">{{ Math.round(percent) }}%</span>
    </div>
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
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.progress-bar {
  width: 100%;
  height: 14px;
  background: linear-gradient(to right, #f3f4f6, #e5e7eb);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.06);
  position: relative;
}

.progress-fill {
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: linear-gradient(90deg, #9333ea, #ec4899);
  transition: width 0.4s ease-in-out;
  position: relative;
  box-shadow: 0 0 6px rgba(236, 72, 153, 0.35);
}

.progress-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  margin-top: 4px;
  padding-left: 4px;
}

</style>
