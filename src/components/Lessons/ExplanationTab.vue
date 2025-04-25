<!-- src/components/Lessons/ExplanationTab.vue -->
<template>
  <div class="tab-section">
    <div v-html="explanation"></div>
    <button class="complete-btn" @click="markComplete">✔️ Mark Explanation Complete</button>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'ExplanationTab',
  props: ['lessonId'],
  data() {
    return { explanation: '' }
  },
  async mounted() {
    const res = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}`)
    this.explanation = res.data.explanation || "No explanation available."
  },
  methods: {
    async markComplete() {
      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/users/${this.$root.firebaseUserId}/progress`,
          { lessonId: this.lessonId, section: 'explanation' }
        );
        alert("Explanation section marked complete!");
      } catch (err) {
        console.error(err);
      }
    }
  }
}
</script>

<style scoped>
.tab-section {
  position: relative;
}
.complete-btn {
  margin-top: 20px;
  background: #22c55e;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}
.complete-btn:hover {
  background: #16a34a;
}
</style>
