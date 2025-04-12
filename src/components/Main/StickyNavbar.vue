<template>
  <nav
    class="nav-container"
    :class="{ 'fade-out': isOverlappingFooter }"
    ref="navRef"
  >
    <router-link class="nav-link" :to="{ path: '/', hash: '#about-us' }">О Нас</router-link>
    <router-link class="nav-link" :to="{ path: '/', hash: '#cards' }">Возможности</router-link>
    <router-link class="nav-link" :to="{ path: '/', hash: '#passion-test' }">Тест</router-link>
    <router-link class="nav-link" :to="{ path: '/', hash: '#ai' }">AI Помощник</router-link>
    <router-link class="nav-link" :to="{ path: '/', hash: '#contacts' }">Контакты</router-link>
  </nav>
</template>

<script>
export default {
  name: 'StickyNavbar',
  data() {
    return {
      isOverlappingFooter: false
    };
  },
  mounted() {
    const footer = document.querySelector('footer'); // Adjust if your footer has an ID/class
    const observer = new IntersectionObserver(
      ([entry]) => {
        this.isOverlappingFooter = entry.isIntersecting;
      },
      {
        root: null,
        threshold: 0.1
      }
    );
    if (footer) observer.observe(footer);
  }
};
</script>

<style scoped>
.nav-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: black;
  width: 90vw;
  max-width: 1000px;
  height: 60px;
  border-radius: 30px;
  border: 1px solid black;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 999;
  transition: opacity 0.4s ease;
}

.nav-container.fade-out {
  opacity: 0;
  pointer-events: none;
}

.nav-link {
  text-decoration: none;
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  color: white;
  padding: 10px 15px;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #ccc;
}
</style>
