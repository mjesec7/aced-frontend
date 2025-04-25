<template>
  <div class="writing-board">
    <label>✏️ {{ $t('writingBoard.prompt') }}</label>
    <textarea 
      v-model="userInput" 
      rows="6" 
      :placeholder="$t('writingBoard.placeholder')">
    </textarea>
    <button @click="submitAnswer">{{ $t('writingBoard.submit') }}</button>
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
      confirmation: ''
    }
  },
  methods: {
    submitAnswer() {
      if (!this.userInput.trim()) {
        return;
      }
      // In a real app, the answer would be sent to the backend here
      this.confirmation = this.$t('writingBoard.thanks');
      this.userInput = '';
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
}
textarea {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
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
.confirmation {
  margin-top: 8px;
  color: #4ade80;
}
</style>
