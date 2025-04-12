<template>
    <div class="lesson-nav">
      <button @click="$emit('prev')">← Назад</button>
      <button @click="$emit('next')">Следующий →</button>
    </div>
  </template>
  
  <script>
  export default {}
  </script>
  
  <style scoped>
  .lesson-nav {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  button {
    padding: 10px 20px;
    background: #7c3aed;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: 0.3s ease;
  }
  button:hover {
    opacity: 0.9;
  }
  </style>