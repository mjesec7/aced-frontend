<!-- src/components/Lessons/ExercisesTab.vue -->
<template>
    <div class="tab-section">
      <!-- Reuse existing PuzzleBlock and WritingBoard -->
      <PuzzleBlock :lessonId="lessonId" />
      <WritingBoard />
      <!-- Navigation and Complete Button -->
      <div class="nav-complete">
        <LessonNavigation @prev="goPrev" @next="goNext" />
        <button class="complete-btn" @click="markComplete">✔️ Mark Exercises Complete</button>
      </div>
    </div>
  </template>
  
  <script>
  import PuzzleBlock from '@/components/Lessons/PuzzleBlock.vue'
  import WritingBoard from '@/components/Lessons/WritingBoard.vue'
  import LessonNavigation from '@/components/Lessons/LessonNavigation.vue'
  import axios from 'axios'
  export default {
    name: 'ExercisesTab',
    props: ['lessonId'],
    components: { PuzzleBlock, WritingBoard, LessonNavigation },
    methods: {
      async markComplete() {
        try {
          await axios.post(
            `${process.env.VUE_APP_API_URL}/users/${this.$root.firebaseUserId}/progress`,
            { lessonId: this.lessonId, section: 'exercises' }
          );
          alert("Exercises section marked complete!");
        } catch (err) {
          console.error(err);
        }
      },
      goPrev() { this.$emit('prev') },
      goNext() { this.$emit('next') }
    }
  }
  </script>
  
  <style scoped>
  .nav-complete {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
  }
  .complete-btn {
    background: #22c55e;
    color: #fff;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
  }
  .complete-btn:hover {
    background: #16a34a;
  }
  </style>
  