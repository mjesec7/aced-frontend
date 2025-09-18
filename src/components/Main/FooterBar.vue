<template>
  <footer class="main-footer" id="contacts">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo">
            <div class="logo-icon">A</div>
            <span>ACED</span>
          </div>
          <p>Образование нового поколения. Мы рядом, чтобы помочь тебе расти.</p>
        </div>

        <div class="footer-section">
          <h4>Навигация</h4>
          <ul>
            <li><a href="#about-us">О Нас</a></li>
            <li><a href="#aced">Направления</a></li>
            <li><a href="#passion-test">Тест</a></li>
            <li><a href="#" @click.prevent="showAIHelperModal">AI Помощник</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Контакты</h4>
          <p>Telegram: @aced.live</p>
          <p><a href="#" @click.prevent="showContactModal" class="contact-link">Написать нам</a></p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2025 ACED. Все права защищены.</p>
      </div>
    </div>

    <div v-if="showAIModal || showContact" class="modal-overlay" @click.self="closeModals">
      <div v-if="showAIModal" class="modal-content">
        <span class="close-btn" @click="showAIModal = false">×</span>
        <h3>Где найти AI помощника?</h3>
        <p>Наш AI помощник находится в правом нижнем углу экрана. Просто кликните по иконке робота!</p>
        <button class="modal-button" @click="showAIModal = false">Понятно!</button>
      </div>
      <ContactModal v-if="showContact" @close="showContact = false" />
    </div>
  </footer>
</template>

<script>
import ContactModal from '../Modals/ContactsModal.vue';

export default {
  name: 'FooterBar',
  components: {
    ContactModal
  },
  data() {
    return {
      showAIModal: false,
      showContact: false
    };
  },
  methods: {
    showAIHelperModal() {
      this.showAIModal = true;
    },
    showContactModal() {
      this.showContact = true;
    },
    closeModals() {
      this.showAIModal = false;
      this.showContact = false;
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&display=swap');

.main-footer {
  width: 100%;
  padding: 60px 40px 30px;
  background-color: #110d2e;
  color: #d1d5db;
  font-family: 'Unbounded', sans-serif;
  border-top: 1px solid #2c2c54;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
.footer-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 3rem;
}
.footer-brand {
  flex: 1; min-width: 250px;
}
.logo {
  display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;
}
.logo-icon {
  width: 32px; height: 32px; background: linear-gradient(45deg, #a855f7, #38bdf8);
  border-radius: 0.5rem; display: grid; place-items: center;
  font-weight: bold; font-size: 1.25rem; color: #fff;
}
.logo span {
  font-size: 1.5rem; font-weight: 700; color: #fff;
}
.footer-brand p {
  color: #a3a3c2; line-height: 1.6;
}
.footer-section {
  flex: 1; min-width: 180px;
}
.footer-section h4 {
  font-size: 1.1rem; margin-bottom: 1rem; color: #fff;
}
ul {
  list-style: none; padding: 0; margin: 0;
}
li {
  margin-bottom: 0.75rem;
}
a {
  text-decoration: none; color: #d1d5db; transition: color 0.3s ease;
  cursor: pointer;
}
a:hover, .contact-link:hover {
  color: #fff;
}
.contact-link {
  color: #c084fc; font-weight: 600; cursor: pointer;
}
.footer-bottom {
  border-top: 1px solid #2c2c54;
  padding-top: 1.5rem;
  font-size: 0.9rem;
  color: #a3a3c2;
  text-align: center;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 0, 24, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: #191645;
  border-radius: 1rem;
  padding: 2.5rem;
  width: 90%;
  max-width: 450px;
  text-align: center;
  border: 1px solid #7c3aed;
  box-shadow: 0 0 40px rgba(124, 58, 237, 0.5);
  position: relative;
  color: #fff;
}
.modal-content h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}
.modal-content p {
    color: #d1d5db;
    line-height: 1.6;
}
.modal-button {
  margin-top: 1.5rem; 
  background: #7c3aed; 
  color: #fff; 
  padding: 0.75rem 1.5rem; 
  border-radius: 99px; 
  border: none; 
  cursor: pointer;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  transition: background-color 0.2s ease;
}
.modal-button:hover {
    background-color: #9333ea;
}
.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 1.5rem;
  cursor: pointer;
  color: #a3a3c2;
}

@media (max-width: 768px) {
  .footer-grid {
    flex-direction: column;
    text-align: center;
  }
  .logo {
    justify-content: center;
  }
}
</style>