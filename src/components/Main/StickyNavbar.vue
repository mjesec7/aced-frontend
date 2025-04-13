<template>
  <div>
    <!-- Sticky nav links -->
    <nav
      class="nav-container"
      :class="{ 'fade-out': isOverlappingFooter }"
      ref="navRef"
    >
      <router-link class="nav-link" :to="{ path: '/', hash: '#features' }">Тест</router-link>
      <router-link class="nav-link" :to="{ path: '/', hash: '#greatpeople' }">Учёные</router-link>
      <router-link class="nav-link" :to="{ path: '/', hash: '#aced' }">Направления</router-link>
      <router-link class="nav-link" :to="{ path: '/', hash: '#about-us' }">О нас</router-link>
      <span class="nav-link" @click="showModal = true">Контакты</span>
    </nav>

    <!-- Contacts Modal appears ABOVE everything -->
    <ContactsModal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<script>
import ContactsModal from '@/components/Modals/ContactsModal.vue';

export default {
  name: 'StickyNavbar',
  components: { ContactsModal },
  data() {
    return {
      isOverlappingFooter: false,
      showModal: false
    };
  },
  mounted() {
    const footer = document.querySelector('footer');
    const observer = new IntersectionObserver(
      ([entry]) => {
        this.isOverlappingFooter = entry.isIntersecting;
      },
      { root: null, threshold: 0.1 }
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
  cursor: pointer;
}

.nav-link:hover {
  color: #ccc;
}
</style>
