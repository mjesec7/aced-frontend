<template>
  <footer class="main-footer" id="contacts">
    <div class="footer-grid">
      <!-- Logo + Message -->
      <div class="footer-brand">
        <h2>ACED</h2>
        <p>Образование нового поколения. Мы рядом, чтобы помочь тебе расти.</p>
      </div>

      <!-- Navigation -->
      <div class="footer-section">
        <h4>Навигация</h4>
        <ul>
          <li><a href="#about-us">О Нас</a></li>
          <li><a href="#cards">Возможности</a></li>
          <li><a @click.prevent="scrollToPassionTest">Тест</a></li>
          <li><a @click.prevent="showAIHelperModal">AI Помощник</a></li>
        </ul>
      </div>

      <!-- Contact -->
      <div class="footer-section">
        <h4>Контакты</h4>
        <p>Telegram: @aced.live</p>
        <p><a @click.prevent="showContactModal" class="contact-link">Написать нам</a></p>
      </div>
    </div>

    <div class="footer-bottom">
      <p>© 2025 ACED. Все права защищены.</p>
    </div>

    <!-- AI Helper Modal -->
    <div v-if="showAIModal" class="modal-overlay" @click.self="showAIModal = false">
      <div class="modal-content">
        <span class="close-btn" @click="showAIModal = false">×</span>
        <h3>Где найти AI помощника?</h3>
        <p>Наш AI помощник доступен в правом нижнем углу экрана. Просто кликни по иконке чата!</p>
        <button class="modal-button" @click="showAIModal = false">Понял!</button>
      </div>
    </div>

    <!-- Contact Modal -->
    <ContactModal v-if="showContact" @close="showContact = false" />
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
    scrollToPassionTest() {
      const section = document.querySelector('#passion-test');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      } else {
        this.$router.push('/main/passiontestvue').then(() => {
          setTimeout(() => {
            const retry = document.querySelector('#passion-test');
            if (retry) retry.scrollIntoView({ behavior: 'smooth' });
          }, 400);
        });
      }
    },
    showAIHelperModal() {
      this.showAIModal = true;
    },
    showContactModal() {
      this.showContact = true;
    }
  }
};
</script>

<style scoped>
.main-footer {
  width: 100%;
  padding: 80px 40px 30px;
  background: radial-gradient(ellipse at center, #0a0c2b, #1b1e44);
  color: white;
  font-family: 'Unbounded', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 40px;
  width: 100%;
  max-width: 1200px;
}

.footer-brand {
  flex: 1;
  min-width: 250px;
}

.footer-brand h2 {
  font-size: 2rem;
  background: linear-gradient(to right, #a855f7, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

.footer-section {
  flex: 1;
  min-width: 200px;
}

.footer-section h4 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #c084fc;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 10px;
}

.footer-section a {
  text-decoration: none;
  color: #d1d5db;
  transition: color 0.3s ease;
  cursor: pointer;
}

.footer-section a:hover {
  color: #ffffff;
}

.contact-link {
  color: #93c5fd;
  font-weight: bold;
}

.contact-link:hover {
  color: #ffffff;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 50px;
  padding-top: 20px;
  font-size: 0.9rem;
  color: #a3a3c2;
  text-align: center;
  width: 100%;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 12, 43, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: #1b1e44;
  border: 1px solid #a855f7;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  color: white;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 0 20px #a855f7aa;
  position: relative;
}

.modal-content h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.modal-content p {
  font-size: 1rem;
  margin-bottom: 20px;
}

.modal-button {
  background: #a855f7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
}

.modal-button:hover {
  background: #9333ea;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 1.4rem;
  cursor: pointer;
  color: #ccc;
}

/* Tablet styles */
@media (max-width: 768px) {
  .main-footer {
    padding: 60px 20px 30px;
  }
  
  .footer-grid {
    flex-direction: column;
    gap: 30px;
    text-align: center;
  }
  
  .footer-brand {
    min-width: auto;
  }
  
  .footer-brand h2 {
    font-size: 1.8rem;
  }
  
  .footer-section {
    min-width: auto;
  }
  
  .footer-section h4 {
    font-size: 1.1rem;
  }
  
  .footer-bottom {
    margin-top: 40px;
    font-size: 0.85rem;
  }
  
  .modal-content {
    padding: 25px;
    max-width: 350px;
  }
  
  .modal-content h3 {
    font-size: 1.3rem;
  }
  
  .modal-content p {
    font-size: 0.9rem;
  }
}

/* Mobile styles */
@media (max-width: 480px) {
  .main-footer {
    padding: 40px 15px 20px;
  }
  
  .footer-grid {
    gap: 25px;
  }
  
  .footer-brand h2 {
    font-size: 1.6rem;
  }
  
  .footer-brand p {
    font-size: 0.9rem;
  }
  
  .footer-section h4 {
    font-size: 1rem;
  }
  
  .footer-section li {
    margin-bottom: 8px;
  }
  
  .footer-section a {
    font-size: 0.9rem;
  }
  
  .footer-bottom {
    margin-top: 30px;
    font-size: 0.8rem;
  }
  
  .modal-content {
    padding: 20px;
    max-width: 300px;
  }
  
  .modal-content h3 {
    font-size: 1.2rem;
  }
  
  .modal-content p {
    font-size: 0.85rem;
  }
  
  .modal-button {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}

/* Very small screens */
@media (max-width: 320px) {
  .main-footer {
    padding: 30px 10px 15px;
  }
  
  .footer-brand h2 {
    font-size: 1.4rem;
  }
  
  .footer-brand p {
    font-size: 0.8rem;
  }
  
  .footer-section h4 {
    font-size: 0.9rem;
  }
  
  .footer-section a {
    font-size: 0.8rem;
  }
  
  .footer-bottom {
    font-size: 0.75rem;
  }
  
  .modal-content {
    padding: 15px;
    max-width: 280px;
  }
  
  .modal-content h3 {
    font-size: 1.1rem;
  }
  
  .modal-content p {
    font-size: 0.8rem;
  }
  
  .modal-button {
    padding: 6px 14px;
    font-size: 0.8rem;
  }
}
</style>