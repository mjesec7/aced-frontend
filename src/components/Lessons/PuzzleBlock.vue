<template>
  <transition name="fade">
    <div class="puzzle-block">
      <div v-if="loading" class="loading">Loading puzzle...</div>

      <div v-else-if="puzzle">
        <h3>🧩 {{ puzzle.title }}</h3>
        <p>{{ puzzle.description }}</p>
        <textarea v-model="userAnswer" :placeholder="$t('puzzle.placeholder')"></textarea>
        <button @click="submitAnswer">{{ $t('puzzle.submit') }}</button>
        <p v-if="feedback" class="feedback">{{ feedback }}</p>
      </div>

      <div v-else class="error-message">
        ❌ Puzzle not found or failed to load.
      </div>
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
      feedback: '',
      loading: true,
    };
  },
  async mounted() {
    if (!this.lessonId) {
      console.error('❌ No lessonId provided to PuzzleBlock.');
      this.loading = false;
      return;
    }

    try {
      const res = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}/puzzle`);
      this.puzzle = res.data;
    } catch (err) {
      console.error('❌ Error loading puzzle:', err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    submitAnswer() {
      if (!this.userAnswer.trim()) {
        this.feedback = this.$t('puzzle.error') || 'Please enter an answer!';
        return;
      }

      // Normally, you'd validate answer via backend here
      this.feedback = this.$t('puzzle.thanks') || 'Thank you for your answer!';
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
.loading, .error-message {
  text-align: center;
  margin-top: 40px;
  font-size: 1rem;
  color: #666;
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
