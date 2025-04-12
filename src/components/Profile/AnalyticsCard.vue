<template>
    <div class="stat-card">
      <div class="spark-bar" />
      <div class="stat-content">
        <div class="stat-top">
          <p class="stat-label">{{ label }}</p>
          <h2
  class="stat-value"
  :style="{ color: value === 'Нет данных' ? '#9ca3af' : '#111827' }"
>
  {{ value }}
</h2>
        </div>
        <p class="stat-subtext" v-if="subtext">{{ subtext }}</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      label: String,
      value: String,
      subtext: {
        type: String,
        default: ''
      }
    }
  }
  </script>
  
  <style scoped>
  .stat-card {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;
    position: relative;
    overflow: hidden;
    min-height: 100px;
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(147, 51, 234, 0.08);
  }
  
  .spark-bar {
    width: 6px;
    height: 100%;
    background: linear-gradient(to bottom, #9333ea, #ec4899);
    border-radius: 6px;
    margin-right: 16px;
  }
  
  .stat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .stat-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  
  .stat-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #374151;
  }
  
  .stat-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: #111827;
  }
  
  .stat-subtext {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 6px;
  }
  </style>
  