<template>
    <div class="lesson-view">
      <h1 class="lesson-title">{{ lesson.lessonName }}</h1>
      <p class="lesson-topic">Тема: {{ lesson.topic }}</p>
      <p class="lesson-subject">Предмет: {{ lesson.subject }}</p>
  
      <div class="tabs">
        <button :class="{ active: activeTab === 'explanation' }" @click="activeTab = 'explanation'">📘 Объяснение</button>
        <button :class="{ active: activeTab === 'task' }" @click="activeTab = 'task'">🧠 Задание</button>
      </div>
  
      <div class="tab-content">
        <div v-if="activeTab === 'explanation'">
          <div class="lesson-text" v-html="lesson.explanation || 'Пока нет объяснения...'" />
        </div>
  
        <div v-if="activeTab === 'task'">
          <div class="lesson-text" v-html="lesson.examples || 'Пока нет заданий...'" />
          <textarea v-model="answer" placeholder="Введи свой ответ..." />
          <button class="submit-btn" @click="submitAnswer">Отправить</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'LessonView',
    data() {
      return {
        lesson: {},
        activeTab: 'explanation',
        answer: ''
      }
    },
    mounted() {
      const lessonId = this.$route.params.id;
      axios.get(`${process.env.VUE_APP_API_URL}/lessons/${lessonId}`)
        .then(res => {
          this.lesson = res.data;
        })
        .catch(err => {
          console.error('❌ Ошибка загрузки урока:', err);
        });
    },
    methods: {
      submitAnswer() {
        alert('✅ Ответ отправлен (пока фейк, но скоро будет сохранение!)');
        this.answer = '';
      }
    }
  }
  </script>
  
  <style scoped>
  .lesson-view {
    padding: 40px 20px;
    max-width: 800px;
    margin: auto;
    font-family: 'Inter', sans-serif;
  }
  
  .lesson-title {
    font-size: 2rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 10px;
  }
  
  .lesson-topic,
  .lesson-subject {
    font-size: 1rem;
    color: #6b7280;
    margin-bottom: 6px;
  }
  
  .tabs {
    display: flex;
    gap: 10px;
    margin: 20px 0;
  }
  
  .tabs button {
    padding: 8px 16px;
    border: none;
    border-radius: 10px;
    background: #f3f4f6;
    font-weight: 600;
    cursor: pointer;
  }
  
  .tabs button.active {
    background: linear-gradient(to right, #9333ea, #ec4899);
    color: white;
  }
  
  .tab-content {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    padding: 20px;
    border-radius: 14px;
  }
  
  .lesson-text {
    margin-bottom: 20px;
  }
  
  textarea {
    width: 100%;
    height: 100px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 1rem;
    margin-top: 10px;
    resize: vertical;
  }
  
  .submit-btn {
    margin-top: 12px;
    padding: 10px 16px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(to right, #9333ea, #ec4899);
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
  </style>