<template>
  <transition name="fade">
    <div class="puzzle-block" v-if="puzzle">
      <h3>🧩 {{ puzzle.title }}</h3>
      <p>{{ puzzle.description }}</p>
      <textarea v-model="userAnswer" :placeholder="$t('puzzle.placeholder')"></textarea>
      <button @click="submitAnswer">{{ $t('puzzle.submit') }}</button>
      <p v-if="feedback" class="feedback">{{ feedback }}</p>
    </div>
  </transition>
</template>

<script>
import axios from 'axios';
export default {
  name: 'PuzzleBlock',
  props: {
    lessonId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      puzzle: null,
      userAnswer: '',
      feedback: ''
    }
  },
  mounted() {
    axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}/puzzle`)
      .then(res => {
        this.puzzle = res.data;
      })
      .catch(err => {
        console.error('Ошибка загрузки задачи:', err);
      });
  },
  methods: {
    submitAnswer() {
      if (!this.userAnswer.trim()) {
        this.feedback = this.$t('puzzle.error');
        return;
      }
      // In a real scenario, the answer would be sent to the backend for validation
      this.feedback = this.$t('puzzle.thanks');
      this.userAnswer = '';
    }
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

.puzzle-block {
  background: #eef2ff;
  padding: 16px;
  border-radius: 12px;
  margin-top: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  font-family: 'Inter', sans-serif;
}
textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px;
  margin-top: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
  resize: vertical;
}
button {
  margin-top: 12px;
  padding: 8px 16px;
  background: #9333ea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}
button:hover {
  background: #7c3aed;
}
.feedback {
  margin-top: 8px;
  color: #333;
  font-style: italic;
}
</style>
