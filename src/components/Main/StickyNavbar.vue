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
  text-align: center;
  white-space: nowrap;
}

.nav-link:hover {
  color: #ccc;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .nav-container {
    width: 95vw;
    max-width: 800px;
  }
  
  .nav-link {
    font-size: 14px;
    padding: 8px 12px;
  }
}

@media (max-width: 768px) {
  .nav-container {
    width: 95vw;
    height: 50px;
    border-radius: 25px;
    bottom: 15px;
  }
  
  .nav-link {
    font-size: 12px;
    padding: 6px 8px;
    font-weight: 600;
  }
}

@media (max-width: 640px) {
  .nav-container {
    width: 98vw;
    height: 45px;
    border-radius: 22px;
    bottom: 10px;
  }
  
  .nav-link {
    font-size: 11px;
    padding: 4px 6px;
  }
}

@media (max-width: 480px) {
  .nav-container {
    width: 98vw;
    height: 40px;
    border-radius: 20px;
    bottom: 10px;
    gap: 5px;
  }
  
  .nav-link {
    font-size: 10px;
    padding: 3px 4px;
    font-weight: 600;
  }
}

@media (max-width: 360px) {
  .nav-container {
    height: 35px;
    border-radius: 18px;
  }
  
  .nav-link {
    font-size: 9px;
    padding: 2px 3px;
  }
}

/* Landscape orientation adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .nav-container {
    bottom: 5px;
    height: 35px;
    border-radius: 18px;
  }
  
  .nav-link {
    font-size: 10px;
    padding: 3px 5px;
  }
}

/* Extra small screens */
@media (max-width: 320px) {
  .nav-container {
    height: 32px;
    border-radius: 16px;
  }
  
  .nav-link {
    font-size: 8px;
    padding: 2px;
  }
}

/* Prevent text wrapping on very small screens */
@media (max-width: 280px) {
  .nav-link {
    font-size: 7px;
    padding: 1px;
  }
}
</style>