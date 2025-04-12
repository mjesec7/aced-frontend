<template>
    <div class="writing-board">
      <label>✏️ Твоя практика:</label>
      <textarea v-model="userInput" rows="6" placeholder="Пиши здесь свои мысли или ответы..."></textarea>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        userInput: ''
      }
    }
  }
  </script>
  
  <style scoped>
  .writing-board {
    background: #f9fafb;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    margin-bottom: 24px;
  }
  textarea {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #ddd;
    font-size: 1rem;
  }
  </style>