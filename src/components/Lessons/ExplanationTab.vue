<template>
  <div>
    <transition name="fade">
      <div v-if="loaded" class="explanation" v-html="content"></div>
    </transition>
    <div v-if="!loaded" class="loading">Загрузка...</div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ExplanationTab',
  props: {
    lessonId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      content: '',
      loaded: false
    }
  },
  async mounted() {
    try {
      const res = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}`);
      this.content = res.data.explanation || 'Объяснение не найдено';
      this.loaded = true;
    } catch (err) {
      console.error('❌ Ошибка загрузки объяснения:', err);
      this.loaded = false;
    }
  }
}
</script>

<style scoped>
.loading {
  font-size: 1rem;
  color: #6b7280;
  padding: 12px;
}

.explanation {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #1f2937;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>