<!-- src/components/Lessons/ExamplesTab.vue -->
<template>
    <div class="tab-section">
      <div v-html="examples"></div>
      <button class="complete-btn" @click="markComplete">✔️ Mark Examples Complete</button>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  export default {
    name: 'ExamplesTab',
    props: ['lessonId'],
    data() {
      return { examples: '' }
    },
    async mounted() {
      const res = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}`)
      this.examples = res.data.examples || "No examples available."
    },
    methods: {
      async markComplete() {
        try {
          await axios.post(
            `${process.env.VUE_APP_API_URL}/users/${this.$root.firebaseUserId}/progress`,
            { lessonId: this.lessonId, section: 'examples' }
          );
          alert("Examples section marked complete!");
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .complete-btn {
    margin-top: 20px;
    background: #22c55e;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
  }
  .complete-btn:hover {
    background: #16a34a;
  }
  </style>
  