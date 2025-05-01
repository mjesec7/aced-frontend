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

.stat-card.no-data {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.spark-bar {
  width: 6px;
  height: 100%;
  background: linear-gradient(to bottom, #9333ea, #ec4899);
  border-radius: 6px;
  margin-right: 16px;
  transition: background 0.3s ease;
}

.spark-bar.inactive {
  background: #d1d5db;
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
  transition: color 0.3s ease;
}

.stat-card.no-data .stat-value {
  color: #9ca3af;
}

.stat-subtext {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 6px;
}
</style>
