<template>
    <div class="lesson-view">
      <LessonHeader :lesson="lesson" />
      <div class="lesson-body">
        <WritingBoard :lesson="lesson" />
        <ExplanationTab :lesson="lesson" />
      </div>
      <LessonNavigation :lessonId="lesson._id" />
    </div>
  </template>
  
  <script>
  import LessonHeader from './components/LessonHeader.vue';
  import ExplanationTab from './components/ExplanationTab.vue';
  import WritingBoard from './components/WritingBoard.vue';
  import LessonNavigation from './components/LessonNavigation.vue';
  
  export default {
    name: 'LessonView',
    components: { LessonHeader, ExplanationTab, WritingBoard, LessonNavigation },
    data() {
      return { lesson: null }
    },
    async mounted() {
      const res = await fetch(`/api/lessons/${this.$route.params.id}`);
      this.lesson = await res.json();
    }
  }
  </script>
  
  <style scoped>
  .lesson-view {
    max-width: 1200px;
    margin: auto;
    padding: 40px 20px;
  }
  .lesson-body {
    display: flex;
    gap: 30px;
    margin-top: 30px;
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    .lesson-body {
      flex-direction: column;
    }
  }
  </style>
  