<template>
    <div class="examples-tab">
      <div v-if="loading" class="loading">Loading examples...</div>
  
      <div v-else-if="examples">
        <transition name="fade">
          <div v-html="examples" class="examples-content"></div>
        </transition>
  
        <button class="complete-btn" @click="markComplete">
          ✔️ Mark Examples Complete
        </button>
      </div>
  
      <div v-else class="no-examples">
        ❌ No examples available for this lesson.
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'ExamplesTab',
    props: ['lessonId'],
    data() {
      return {
        examples: '',
        loading: true,
      };
    },
    async mounted() {
      if (!this.lessonId) {
        console.error('❌ No lessonId provided to ExamplesTab.');
        this.loading = false;
        return;
      }
      try {
        const res = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}`);
        this.examples = res.data.examples || '';
      } catch (err) {
        console.error('❌ Error loading examples:', err);
      } finally {
        this.loading = false;
      }
    },
    methods: {
      async markComplete() {
        try {
          await axios.post(
            `${process.env.VUE_APP_API_URL}/users/${this.$root.firebaseUserId}/progress`,
            { lessonId: this.lessonId, section: 'examples' }
          );
          alert('✅ Examples section marked complete!');
        } catch (err) {
          console.error('❌ Error marking examples complete:', err);
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .examples-tab {
    padding: 20px;
  }
  
  .loading, .no-examples {
    text-align: center;
    font-size: 1.1rem;
    color: #6b7280;
    margin-top: 40px;
  }
  
  .examples-content {
    background: #f3f4f6;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  
  .complete-btn {
    display: inline-block;
    margin-top: 10px;
    padding: 10px 20px;
    background: linear-gradient(to right, #22c55e, #16a34a);
    color: #fff;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s ease, transform 0.2s ease;
  }
  
  .complete-btn:hover {
    background: linear-gradient(to right, #16a34a, #15803d);
    transform: scale(1.05);
  }
  
  /* Smooth fade transition */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
  </style>
  