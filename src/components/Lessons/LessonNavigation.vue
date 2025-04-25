<template>
  <transition name="fade">
    <div class="lesson-nav">
      <button @click="$emit('prev')">
        ← {{ $t('navigation.prev') }}
      </button>
      <button @click="$emit('next')">
        {{ $t('navigation.next') }} →
      </button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'LessonNavigation'
}
</script>

<style scoped>
/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
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
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.3s;
}
button:hover {
  opacity: 0.9;
}
button:active {
  transform: scale(0.95);
}
</style>
