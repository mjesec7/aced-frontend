<template>
  <div
    class="stat-card"
    :class="{ 'no-data': value === 'Нет данных' || !value }"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="spark-bar" :class="{ inactive: value === 'Нет данных' || !value }" />
    <div class="stat-content">
      <div class="stat-top">
        <p class="stat-label">{{ label || 'Без названия' }}</p>
        <h2 class="stat-value">{{ value || 'Нет данных' }}</h2>
      </div>
      <p class="stat-subtext" v-if="subtext">{{ subtext }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    subtext: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      hovered: false
    };
  }
};
</script>


<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 20px rgba(147, 51, 234, 0.05);
  border: 1px solid rgba(228, 228, 231, 0.7);
  position: relative;
  overflow: hidden;
  min-height: 110px;
  transition: all 0.35s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-4px) scale(1.015);
  box-shadow: 0 10px 30px rgba(147, 51, 234, 0.15);
}

.stat-card.no-data {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.spark-bar {
  width: 6px;
  height: 100%;
  background: linear-gradient(to bottom, #9333ea, #ec4899);
  border-radius: 8px;
  margin-right: 20px;
  transition: background 0.3s ease;
}

.spark-bar.inactive {
  background: #cbd5e1;
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
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
  font-family: 'Unbounded', sans-serif;
  transition: color 0.3s ease;
}

.stat-card.no-data .stat-value {
  color: #9ca3af;
}

.stat-subtext {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 6px;
  font-weight: 500;
}

</style>
