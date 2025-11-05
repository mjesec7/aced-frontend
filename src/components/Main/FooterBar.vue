<template>
  <footer class="main-footer" id="contacts">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo">
            <div class="logo-icon">A</div>
            <span class="logo-text">ACED</span>
          </div>
          <p class="brand-description">
            Next generation education. We're here to help you grow and achieve your goals.
          </p>
          <div class="social-links">
            <a href="#" class="social-link">
              <span class="social-icon">📱</span>
            </a>
            <a href="#" class="social-link">
              <span class="social-icon">💬</span>
            </a>
            <a href="#" class="social-link">
              <span class="social-icon">📧</span>
            </a>
          </div>
        </div>

        <div class="footer-section">
          <h4 class="section-title">Navigation</h4>
          <ul class="link-list">
            <li><a href="#about-us" class="footer-link">About Us</a></li>
            <li><a href="#aced" class="footer-link">Courses</a></li>
            <li><a href="#tariffs" class="footer-link">Pricing</a></li>
            <li><a href="#" @click.prevent="showAIHelperModal" class="footer-link">AI Assistant</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4 class="section-title">Contact</h4>
          <ul class="link-list">
            <li class="contact-item">
              <span class="contact-icon">📱</span>
              <span>Telegram: @aced.live</span>
            </li>
            <li>
              <a href="#" @click.prevent="showContactModal" class="contact-link">
                <span class="link-icon">✉️</span>
                <span>Contact Us</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p class="copyright">© 2025 ACED. All rights reserved.</p>
        <div class="footer-links">
          <a href="#" class="bottom-link">Privacy Policy</a>
          <span class="divider">•</span>
          <a href="#" class="bottom-link">Terms of Service</a>
        </div>
      </div>
    </div>

    <div v-if="showAIModal || showContact" class="modal-overlay" @click.self="closeModals">
      <div v-if="showAIModal" class="modal-content glass-card">
        <button class="close-btn" @click="showAIModal = false">
          <span>×</span>
        </button>
        <div class="modal-icon">🤖</div>
        <h3 class="modal-title">Where to find AI Assistant?</h3>
        <p class="modal-text">
          Our AI assistant is located in the bottom right corner of the screen. Just click on the robot icon and it will be happy to help you!
        </p>
        <button class="modal-button" @click="showAIModal = false">
          <span>Got it!</span>
          <span class="button-glow"></span>
        </button>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.main-footer {
  width: 100%;
  padding: 80px 50px 30px;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  color: #0a0a0a;
  font-family: 'Inter', sans-serif;
  border-top: 1.5px solid rgba(139, 92, 246, 0.1);
  position: relative;
}

.main-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 60px;
  margin-bottom: 60px;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.5rem;
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.logo-text {
  font-size: 1.875rem;
  font-weight: 800;
  color: #0a0a0a;
  letter-spacing: -0.02em;
}

.brand-description {
  color: #737373;
  line-height: 1.7;
  font-size: 0.9375rem;
  font-weight: 400;
  max-width: 400px;
  margin: 0;
}

.social-links {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(139, 92, 246, 0.08);
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.social-link:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.social-icon {
  font-size: 1.25rem;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  font-size: 0.8125rem;
  letter-spacing: 0.05em;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-link {
  text-decoration: none;
  color: #737373;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  display: inline-block;
}

.footer-link:hover {
  color: #7c3aed;
  transform: translateX(4px);
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #737373;
  font-size: 0.9375rem;
  font-weight: 500;
}

.contact-icon {
  font-size: 1.125rem;
}

.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #7c3aed;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9375rem;
}

.contact-link:hover {
  color: #6d28d9;
  transform: translateX(4px);
}

.link-icon {
  font-size: 1.125rem;
}

.footer-bottom {
  border-top: 1.5px solid rgba(139, 92, 246, 0.1);
  padding-top: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.copyright {
  font-size: 0.875rem;
  color: #a3a3a3;
  font-weight: 500;
  margin: 0;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bottom-link {
  text-decoration: none;
  color: #737373;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.bottom-link:hover {
  color: #7c3aed;
}

.divider {
  color: #d4d4d4;
  font-size: 0.875rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  border-radius: 24px;
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);
}

.modal-content {
  width: 90%;
  max-width: 480px;
  padding: 48px 40px;
  text-align: center;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  background: rgba(139, 92, 246, 0.08);
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #737373;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
  transform: rotate(90deg);
}

.modal-icon {
  font-size: 4rem;
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.modal-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
}

.modal-text {
  color: #737373;
  line-height: 1.7;
  font-size: 1rem;
  font-weight: 400;
  margin: 0 0 32px 0;
}

.modal-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 
    0 4px 20px rgba(139, 92, 246, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.modal-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 2px;
  background: linear-gradient(135deg, #a78bfa, #d8b4fe);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 35px rgba(139, 92, 246, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.modal-button:hover::before {
  opacity: 1;
}

.button-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-button:hover .button-glow {
  opacity: 1;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  
  .footer-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .main-footer {
    padding: 60px 24px 24px;
  }
  
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 40px;
    margin-bottom: 40px;
  }
  
  .footer-brand {
    text-align: center;
    align-items: center;
  }
  
  .logo {
    justify-content: center;
  }
  
  .brand-description {
    text-align: center;
  }
  
  .social-links {
    justify-content: center;
  }
  
  .footer-section {
    text-align: center;
    align-items: center;
  }
  
  .link-list {
    align-items: center;
  }
  
  .footer-link:hover,
  .contact-link:hover {
    transform: translateX(0) scale(1.05);
  }
  
  .footer-bottom {
    flex-direction: column;
    text-align: center;
    padding-top: 24px;
  }
  
  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .main-footer {
    padding: 40px 16px 20px;
  }
  
  .modal-content {
    padding: 40px 24px;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .modal-icon {
    font-size: 3rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>