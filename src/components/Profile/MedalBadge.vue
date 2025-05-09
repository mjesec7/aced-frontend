<template>
    <div class="medal-badge" :class="badgeClass">
      <img :src="medalIcon" alt="Medal" class="medal-img" />
    </div>
  </template>
  
  <script>
  export default {
    name: 'MedalBadge',
    props: {
      type: {
        type: String,
        required: true,
        validator: (value) => ['gold', 'silver', 'bronze'].includes(value),
      },
    },
    computed: {
      medalIcon() {
  if (this.type === 'gold') {
    return new URL('@/assets/medals/gold.png', import.meta.url).href;
  }
  if (this.type === 'silver') {
    return new URL('@/assets/medals/silver.png', import.meta.url).href;
  }
  if (this.type === 'bronze') {
    return new URL('@/assets/medals/bronze.png', import.meta.url).href;
  }
  return '';
}

      badgeClass() {
        return `badge-${this.type}`;
      }
    },
  };
  </script>
  
  <style scoped>
  .medal-badge {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
  }
  
  .medal-badge:hover {
    transform: scale(1.1);
  }
  
  .medal-img {
    width: 36px;
    height: 36px;
  }
  
  .badge-gold {
    background: linear-gradient(to bottom right, #facc15, #f59e0b);
  }
  
  .badge-silver {
    background: linear-gradient(to bottom right, #d1d5db, #9ca3af);
  }
  
  .badge-bronze {
    background: linear-gradient(to bottom right, #fbbf24, #a16207);
  }
  </style>