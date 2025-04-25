<template>
    <div class="lesson-view">
      <LessonHeader :lessonId="lessonId" />
  
      <div class="tabs">
        <button :class="{ active: activeTab === 'explanation' }" @click="activeTab = 'explanation'">📘 Объяснение</button>
        <button :class="{ active: activeTab === 'task' }" @click="activeTab = 'task'">🧠 Задание</button>
      </div>
  
      <div class="tab-content">
        <ExplanationTab v-if="activeTab === 'explanation'" :lessonId="lessonId" />
  
        <div v-if="activeTab === 'task'">
          <PuzzleBlock :lessonId="lessonId" />
          <WritingBoard />
          <LessonNavigation @prev="goToPrev" @next="goToNext" />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import LessonHeader from '@/components/Lessons/LessonHeader.vue';
  import ExplanationTab from '@/components/Lessons/ExplanationTab.vue';
  import PuzzleBlock from '@/components/Lessons/PuzzleBlock.vue';
  import WritingBoard from '@/components/Lessons/WritingBoard.vue';
  import LessonNavigation from '@/components/Lessons/LessonNavigation.vue';
  
  export default {
    name: 'LessonView',
    components: {
      LessonHeader,
      ExplanationTab,
      PuzzleBlock,
      WritingBoard,
      LessonNavigation
    },
    data() {
      return {
        lessonId: this.$route.params.id,
        activeTab: 'explanation'
      };
    },
    methods: {
      goToPrev() {
        alert('⏮ Переход к предыдущему уроку (логика будет добавлена позже)');
      },
      goToNext() {
        alert('⏭ Переход к следующему уроку (логика будет добавлена позже)');
      }
    }
  };
  </script>
  
  <style scoped>
  .lesson-view {
    padding: 40px 20px;
    max-width: 900px;
    margin: auto;
    font-family: 'Inter', sans-serif;
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
    margin-top: 16px;
  }
  </style>
  