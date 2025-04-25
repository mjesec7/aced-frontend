<template>
  <transition name="fade">
    <div class="explanation" v-if="content">
      <h3>🔍 {{ $t('lesson.explanationTitle') }}</h3>
      <p v-html="content"></p>
    </div>
  </transition>
  <div v-else class="loading">Загрузка...</div>
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
      content: ''
    }
  },
  mounted() {
    axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}`)
      .then(res => {
        // Attempt to retrieve explanation from the response
        this.content = res.data.explanation || res.data.content || '';
      })
      .catch(err => {
        console.error('Ошибка загрузки объяснения:', err);
      });
  }
}
</script>

<style scoped>
/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.explanation {
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.06);
  font-family: 'Inter', sans-serif;
}
h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #9333ea;
  font-weight: 600;
}
p {
  color: #333;
  line-height: 1.6;
}
.loading {
  padding: 20px;
  font-style: italic;
  color: #666;
}
</style>
