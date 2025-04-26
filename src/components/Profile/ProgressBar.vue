<template>
    <div class="progress-container">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: percent + '%' }"></div>
      </div>
      <div class="progress-text">
        {{ Math.round(percent) }}%
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  
  .progress-track {
    width: 100%;
    height: 12px;
    background: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(to right, #60a5fa, #c084fc);
    transition: width 0.5s ease;
  }
  
  .progress-text {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 600;
  }
  </style>
  