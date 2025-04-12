<template>
    <div class="overview-container">
      <h1 class="heading">Выбери предмет</h1>
      <div class="subject-grid">
        <div
          class="subject-card"
          v-for="subject in subjects"
          :key="subject._id"
          @click="goToLesson(subject._id)"
        >
          <h2>{{ subject.name }}</h2>
          <p>{{ subject.description }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'SubjectOverview',
    data() {
      return {
        subjects: []
      }
    },
    async mounted() {
      const res = await fetch('/api/lessons/subjects');
      this.subjects = await res.json();
    },
    methods: {
      goToLesson(subjectId) {
        this.$router.push(`/lesson/${subjectId}`);
      }
    }
  }
  </script>
  
  <style scoped>
  .overview-container {
    padding: 60px 20px;
    max-width: 1000px;
    margin: auto;
    text-align: center;
  }
  .heading {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 40px;
    font-family: 'Unbounded', sans-serif;
  }
  .subject-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  .subject-card {
    background: white;
    border: 1px solid #ddd;
    padding: 20px;
    border-radius: 14px;
    cursor: pointer;
    transition: 0.3s;
  }
  .subject-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(147, 51, 234, 0.15);
  }
  .subject-card h2 {
    font-size: 1.3rem;
    margin-bottom: 10px;
    color: #111827;
  }
  .subject-card p {
    font-size: 0.9rem;
    color: #555;
  }
  </style>