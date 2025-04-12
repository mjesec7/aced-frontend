<template>
    <div class="lesson-header">
      <h2>{{ lesson.lessonName }}</h2>
      <p>{{ lesson.subject }} • Level {{ lesson.level }} • Topic: {{ lesson.topic }}</p>
      <div class="badge" v-if="lesson.isPremium">🌟 Premium</div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      lesson: Object
    }
  }
  </script>
  
  <style scoped>
  .lesson-header {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  h2 {
    font-size: 1.5rem;
    margin-bottom: 6px;
    font-weight: 700;
  }
  .badge {
    display: inline-block;
    padding: 4px 10px;
    background: linear-gradient(to right, #9333ea, #ec4899);
    color: white;
    border-radius: 12px;
    font-size: 0.8rem;
    margin-top: 8px;
  }
  </style>