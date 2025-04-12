<template>
    <div class="explanation">
      <h3>🔍 Объяснение</h3>
      <p v-html="lesson.content"></p>
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
  .explanation {
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 12px rgba(147, 51, 234, 0.06);
  }
  h3 {
    font-size: 1.2rem;
    margin-bottom: 10px;
    color: #9333ea;
    font-weight: 600;
  }
  p {
    color: #333;
    line-height: 1.6;
  }
  </style>