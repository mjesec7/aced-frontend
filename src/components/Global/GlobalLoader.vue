<!-- components/GlobalLoader.vue -->
<template>
    <div v-if="visible" class="global-loader">
      <div class="spinner"></div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'GlobalLoader',
    props: {
      visible: Boolean
    }
  };
  </script>
  
  <style scoped>
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(243, 244, 246, 0.75); /* soft gray backdrop */
  backdrop-filter: blur(4px); /* subtle blur effect */
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease-in-out;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #e0e7ff; /* soft lavender */
  border-top: 6px solid #7c3aed; /* deep purple */
  border-radius: 50%;
  animation: spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  box-shadow: 0 0 10px rgba(124, 58, 237, 0.2);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

  </style>
  