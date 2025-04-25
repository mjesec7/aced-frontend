<template>
  <div class="writing-board">
    <label>✏️ Напиши свой ответ ниже:</label>
    <textarea 
      v-model="userInput" 
      rows="6" 
      placeholder="Напиши объяснение, размышления или решение задания...">
    </textarea>
    <button @click="submitAnswer" :disabled="loading">
      {{ loading ? "⏳ Отправка..." : "Отправить" }}
    </button>
    
    <transition name="fade">
      <p v-if="confirmation" class="confirmation">{{ confirmation }}</p>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'WritingBoard',
  data() {
    return {
      userInput: '',
      confirmation: '',
      loading: false
    }
  },
  methods: {
    async submitAnswer() {
      if (!this.userInput.trim()) {
        this.confirmation = '❌ Пожалуйста, напиши ответ перед отправкой.';
        return;
      }

      this.loading = true;

      // TODO: Send userInput to backend here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // fake delay

      this.confirmation = '✅ Спасибо! Твой ответ сохранён.';
      this.userInput = '';
      this.loading = false;

      setTimeout(() => {
        this.confirmation = '';
      }, 3000);
    }
  }
}
</script>

<style scoped>
/* Fade transition for confirmation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.writing-board {
  background: #f9fafb;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  font-family: 'Inter', sans-serif;
}
label {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 8px;
  display: block;
}
textarea {
  width: 100%;
  padding: 12px;
  margin-top: 6px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
  resize: vertical;
}
button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #9333ea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}
button:hover {
  background: #7c3aed;
}
button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}
.confirmation {
  margin-top: 8px;
  color: #4ade80;
  font-weight: 500;
}
</style>
