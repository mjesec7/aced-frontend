<template>
    <div class="settings-wrapper">
      <!-- 🔙 Back Button -->
      <button class="back-btn" @click="goBack">← Назад в профиль</button>
  
      <!-- ⚙️ Settings Component -->
      <AcedSettings @close-settings="goBack" />
    </div>
  </template>
  
  <script>
  import AcedSettings from '@/components/Main/AcedSettings.vue';
  
  export default {
    name: 'SettingsPage',
    components: { AcedSettings },
    methods: {
      goBack() {
        this.$router.push('/profile/main');
      }
    }
  };
  </script>
  
  <style scoped>
  .settings-wrapper {
    padding: 32px;
    font-family: 'Unbounded', sans-serif;
    background: linear-gradient(to right, #f9fafb, #ffffff);
    min-height: 100vh;
  }
  
  /* 🔙 Back Button Style */
  .back-btn {
    margin-bottom: 24px;
    background-color: #e0e7ff;
    color: #4f46e5;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  .back-btn:hover {
    background-color: #c7d2fe;
  }
  </style>
  