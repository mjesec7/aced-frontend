<template>
  <transition name="fade">
    <div class="lesson-nav">
      <button @click="$emit('prev')" :disabled="disablePrev">
        ← Назад
      </button>
      <button @click="$emit('next')" :disabled="disableNext">
        Далее →
      </button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'LessonNavigation',
  props: {
    disablePrev: {
      type: Boolean,
      default: false
    },
    disableNext: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.lesson-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font-family: 'Inter', sans-serif;
}

button {
  padding: 10px 20px;
  background: #9333ea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

button:hover {
  background: #7c3aed;
}

button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.7;
}

button:active {
  transform: scale(0.96);
}
</style>
