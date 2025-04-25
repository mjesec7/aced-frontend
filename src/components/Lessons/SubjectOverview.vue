<template>
  <div class="overview-container">
    <h1 class="heading">{{ $t('subjects.choose') }}</h1>
    <transition-group name="fade" tag="div" class="subject-grid">
      <div
        class="subject-card"
        v-for="subject in subjects"
        :key="subject._id"
        @click="goToLesson(subject._id)"
      >
        <h2>{{ subject.name }}</h2>
        <p>{{ subject.description }}</p>
      </div>
    </transition-group>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'SubjectOverview',
  data() {
    return {
      subjects: []
    }
  },
  mounted() {
    axios.get(`${process.env.VUE_APP_API_URL}/subjects`)
      .then(res => {
        this.subjects = res.data;
      })
      .catch(err => {
        console.error('Ошибка загрузки предметов:', err);
      });
  },
  methods: {
    goToLesson(subjectId) {
      this.$router.push(`/lesson/${subjectId}`);
    }
  }
}
</script>

<style scoped>
/* Fade transition for cards */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.overview-container {
  padding: 60px 20px;
  max-width: 1000px;
  margin: auto;
  text-align: center;
  font-family: 'Inter', sans-serif;
}
.heading {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 40px;
  color: #9333ea;
}
.subject-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}
.subject-card {
  background: white;
  padding: 20px;
  width: 200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
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
