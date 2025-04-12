<template>
    <div class="puzzle-block">
      <h3>🧩 {{ puzzle.title }}</h3>
      <p>{{ puzzle.description }}</p>
      <textarea v-model="userAnswer" placeholder="Введи решение..."></textarea>
      <button @click="submitAnswer">Отправить</button>
      <p v-if="feedback">{{ feedback }}</p>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      puzzle: Object
    },
    data() {
      return {
        userAnswer: '',
        feedback: ''
      }
    },
    methods: {
      submitAnswer() {
        if (!this.userAnswer.trim()) {
          this.feedback = 'Пожалуйста, напиши решение.';
          return;
        }
  
        this.feedback = 'Спасибо! Твое решение отправлено.';
        // Later this could be handled with backend validation or AI review
      }
    }
  }
  </script>
  
  <style scoped>
  .puzzle-block {
    background: #eef2ff;
    padding: 16px;
    border-radius: 12px;
    margin-top: 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  }
  textarea {
    width: 100%;
    min-height: 80px;
    padding: 8px;
    margin-top: 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 1rem;
  }
  </style>
  