<!-- src/components/Lessons/LessonHeader.vue -->
<template>
  <div class="lesson-header-container" v-if="lesson">
    <div class="lesson-header">
      <h2>{{ lesson.lessonName }}</h2>
      <p>{{ lesson.subject }} • Level {{ lesson.level }} • Topic: {{ lesson.topic }}</p>
      <div class="actions">
        <button class="add-plan-btn" @click="addToStudyPlan">
          ➕ Add to Study Plan
        </button>
        <div v-if="lesson.isPremium" class="badge">🌟 Premium</div>
      </div>
    </div>
    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress" :style="{ width: `${progressPercentage}%` }"></div>
    </div>
  </div>
  <div v-else class="loading">Loading lesson information...</div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'LessonHeader',
  props: ['lessonId'],
  data() {
    return { lesson: null, progressPercentage: 0 }
  },
  async mounted() {
    // Fetch lesson data
    const res = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}`)
    this.lesson = res.data
    // Optionally fetch user progress here to set progressPercentage
  },
  methods: {
    async addToStudyPlan() {
      // Call backend to add subject/level/topic to user study plan
      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/users/${this.getUserId()}/study-plan`,
          {
            subject: this.lesson.subject,
            level: this.lesson.level,
            topic: this.lesson.topic
          }
        );
        alert("Added to your study plan!");
      } catch (err) {
        console.error("Failed to add to study plan:", err);
      }
    },
    getUserId() {
      // Replace with actual user ID retrieval (e.g. from auth context)
      return this.$root.firebaseUserId; 
    }
  }
}
</script>

<style scoped>
.lesson-header-container {
  background: #f7f7fc;
  padding: 20px;
  border-radius: 8px;
}
.lesson-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #222;
}
.lesson-header p {
  margin: 4px 0 12px;
  color: #555;
  font-size: 0.9rem;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.add-plan-btn {
  background: linear-gradient(to right, #9333ea, #ec4899);
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}
.add-plan-btn:hover {
  background: linear-gradient(to right, #7f1dcb, #db2777);
}
.badge {
  background: #9333ea;
  color: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
}
.progress-bar {
  margin-top: 12px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  height: 8px;
}
.progress {
  height: 100%;
  background: #9333ea;
  width: 0%;
  transition: width 0.5s ease;
}
</style>
