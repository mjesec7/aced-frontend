<!-- src/views/LessonView.vue -->
<template>
    <div class="lesson-view">
      <LessonHeader :lessonId="lessonId" />
  
      <!-- Tab Buttons -->
      <div class="tabs">
        <button :class="{ active: activeTab==='explanation' }" @click="activeTab='explanation'">
          📘 Explanation
        </button>
        <button :class="{ active: activeTab==='examples' }" @click="activeTab='examples'">
          📗 Examples
        </button>
        <button :class="{ active: activeTab==='exercises' }" @click="activeTab='exercises'">
          🧩 Exercises
        </button>
      </div>
  
      <!-- Tab Contents -->
      <div class="tab-content">
        <ExplanationTab v-if="activeTab==='explanation'" :lessonId="lessonId" />
        <ExamplesTab    v-if="activeTab==='examples'"   :lessonId="lessonId" />
        <ExercisesTab   v-if="activeTab==='exercises'"  :lessonId="lessonId" />
      </div>
    </div>
  </template>
  
  <script>
  import LessonHeader from '@/components/Lessons/LessonHeader.vue'
  import ExplanationTab from '@/components/Lessons/ExplanationTab.vue'
  import ExamplesTab from '@/components/Lessons/ExamplesTab.vue'
  import ExercisesTab from '@/components/Lessons/ExercisesTab.vue'
  
  export default {
    name: "LessonView",
    components: { LessonHeader, ExplanationTab, ExamplesTab, ExercisesTab },
    props: ['lessonId'],
    data() {
      return { activeTab: 'explanation' }
    }
  }
  </script>
  
  <style scoped>
  .lesson-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  .tabs {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }
  .tabs button {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: 2px solid #ccc;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s, border-color 0.3s;
  }
  .tabs button.active {
    background: linear-gradient(to right, #9333ea, #ec4899);
    border-color: transparent;
    color: #fff;
  }
  .tab-content {
    margin-top: 16px;
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  </style>
  