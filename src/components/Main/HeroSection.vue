<template>
  <div class="hero-container">
    <!-- Top Navigation -->
    <div class="top-nav">
      <div class="nav-inner">
        <img src="@/assets/logo.png" alt="ACED Logo" class="aced-logo" />
        <UserSection />
      </div>
    </div>

    <!-- Main Hero Content -->
    <div class="hero-content">
      <div class="hero-inner">
        <!-- Main Message -->
        <div class="hero-message">
          <h1 class="hero-title">
            Начни учиться.<br />
            Прямо сейчас.
          </h1>
          <p class="hero-subtitle">
            Тысячи студентов уже начали. Присоединяйся бесплатно.
          </p>
        </div>

        <!-- CTA Buttons -->
        <div class="cta-section">
          <button class="cta-primary" @click="handleStartFree">
            <span class="cta-icon">🚀</span>
            <span class="cta-text">Попробовать бесплатно</span>
          </button>
          <button class="cta-secondary" @click="handleRegister">
            Зарегистрироваться
          </button>
        </div>

        <!-- Social Proof -->
        <div class="social-proof">
          <div class="proof-item">
            <span class="proof-number">2,847</span>
            <span class="proof-label">студентов</span>
          </div>
          <div class="proof-divider"></div>
          <div class="proof-item">
            <span class="proof-number">120+</span>
            <span class="proof-label">уроков</span>
          </div>
          <div class="proof-divider"></div>
          <div class="proof-item">
            <span class="proof-number">100%</span>
            <span class="proof-label">бесплатно</span>
          </div>
        </div>

        <!-- Value Props - Short & Punchy -->
        <div class="value-props">
          <div class="prop-item">
            <span class="prop-icon">⚡</span>
            <span class="prop-text">Начни за 30 секунд</span>
          </div>
          <div class="prop-item">
            <span class="prop-icon">📈</span>
            <span class="prop-text">Отслеживай прогресс</span>
          </div>
          <div class="prop-item">
            <span class="prop-icon">🎯</span>
            <span class="prop-text">Получай сертификаты</span>
          </div>
        </div>

        <!-- Final Push -->
        <div class="final-cta">
          <p class="final-text">
            Зарегистрируйся и сохраняй прогресс.<br />
            <span class="highlight">Навсегда бесплатно.</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="scroll-indicator" @click="scrollToLessons">
      <span class="scroll-text">Смотреть уроки</span>
      <span class="scroll-arrow">↓</span>
    </div>
  </div>
</template>

<script>
import UserSection from "@/components/Main/UserSection.vue";

export default {
  components: { UserSection },
  
  methods: {
    handleStartFree() {
      // Scroll to AcedSection to show free lessons
      const acedSection = document.getElementById('aced');
      if (acedSection) {
        acedSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        // Fallback
        window.scrollTo({
          top: window.innerHeight,
          behavior: 'smooth'
        });
      }
    },
    
    handleRegister() {
      // Trigger the registration modal from UserSection
      window.dispatchEvent(new Event("open-Login-modal"));
    },
    
    scrollToLessons() {
      const acedSection = document.getElementById('aced');
      if (acedSection) {
        acedSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.hero-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Animated Background Pattern */
.hero-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  animation: backgroundShift 15s ease-in-out infinite;
  pointer-events: none;
}

@keyframes backgroundShift {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

/* Navigation */
.top-nav {
  position: relative;
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.nav-inner {
  max-width: 1400px;
  width: 100%;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.aced-logo {
  height: 70px;
  width: auto;
  filter: brightness(0) invert(1);
}

/* Hero Content */
.hero-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px 120px;
  z-index: 2;
}

.hero-inner {
  max-width: 900px;
  width: 100%;
  text-align: center;
}

/* Hero Message */
.hero-message {
  margin-bottom: 40px;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  color: rgba(255, 255, 255, 0.95);
  font-weight: 400;
  margin-bottom: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* CTA Section */
.cta-section {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  margin-bottom: 50px;
  flex-wrap: wrap;
  animation: fadeInUp 0.8s ease-out 0.2s backwards;
}

.cta-primary {
  background: white;
  color: #667eea;
  border: none;
  padding: 18px 40px;
  font-family: 'Unbounded', sans-serif;
  font-size: 18px;
  font-weight: 700;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.cta-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
  background: #f8f9ff;
}

.cta-icon {
  font-size: 22px;
}

.cta-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
  padding: 16px 36px;
  font-family: 'Unbounded', sans-serif;
  font-size: 18px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-secondary:hover {
  background: white;
  color: #667eea;
  transform: translateY(-3px);
}

/* Social Proof */
.social-proof {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-bottom: 50px;
  animation: fadeInUp 0.8s ease-out 0.4s backwards;
}

.proof-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.proof-number {
  font-family: 'Unbounded', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: white;
  line-height: 1;
  margin-bottom: 4px;
}

.proof-label {
  font-family: 'Unbounded', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.proof-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
}

/* Value Props */
.value-props {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 50px;
  flex-wrap: wrap;
  animation: fadeInUp 0.8s ease-out 0.6s backwards;
}

.prop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-family: 'Unbounded', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
}

.prop-icon {
  font-size: 1.3rem;
}

/* Final CTA */
.final-cta {
  animation: fadeInUp 0.8s ease-out 0.8s backwards;
}

.final-text {
  font-family: 'Unbounded', sans-serif;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  line-height: 1.6;
}

.highlight {
  color: white;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

/* Scroll Indicator */
.scroll-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  z-index: 10;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

.scroll-text {
  font-family: 'Unbounded', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.scroll-arrow {
  font-size: 1.5rem;
  color: white;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-title {
    font-size: clamp(2.5rem, 7vw, 4.5rem);
  }
  
  .nav-inner {
    padding: 0 30px;
  }
}

@media (max-width: 768px) {
  .top-nav {
    height: 80px;
  }
  
  .nav-inner {
    padding: 0 20px;
  }
  
  .aced-logo {
    height: 55px;
  }
  
  .hero-content {
    padding: 20px 20px 100px;
  }
  
  .hero-message {
    margin-bottom: 30px;
  }
  
  .hero-subtitle {
    font-size: clamp(1rem, 2.5vw, 1.3rem);
  }
  
  .cta-section {
    margin-bottom: 40px;
    gap: 12px;
  }
  
  .cta-primary {
    padding: 16px 32px;
    font-size: 16px;
  }
  
  .cta-secondary {
    padding: 14px 28px;
    font-size: 16px;
  }
  
  .social-proof {
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .proof-number {
    font-size: 1.6rem;
  }
  
  .proof-label {
    font-size: 0.75rem;
  }
  
  .value-props {
    gap: 25px;
    margin-bottom: 40px;
  }
  
  .prop-item {
    font-size: 0.85rem;
  }
  
  .final-text {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .top-nav {
    height: 70px;
  }
  
  .aced-logo {
    height: 45px;
  }
  
  .hero-title {
    margin-bottom: 16px;
  }
  
  .cta-section {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .cta-primary,
  .cta-secondary {
    width: 100%;
    justify-content: center;
    padding: 14px 24px;
    font-size: 15px;
  }
  
  .social-proof {
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .proof-divider {
    display: none;
  }
  
  .value-props {
    flex-direction: column;
    gap: 15px;
  }
  
  .prop-item {
    font-size: 0.8rem;
  }
  
  .final-text {
    font-size: 0.9rem;
  }
  
  .scroll-indicator {
    bottom: 20px;
  }
}

@media (max-width: 320px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .cta-primary,
  .cta-secondary {
    padding: 12px 20px;
    font-size: 14px;
  }
  
  .proof-number {
    font-size: 1.4rem;
  }
}

/* Landscape orientation */
@media (max-height: 600px) and (orientation: landscape) {
  .hero-content {
    padding: 20px 20px 80px;
  }
  
  .hero-message {
    margin-bottom: 20px;
  }
  
  .cta-section {
    margin-bottom: 25px;
  }
  
  .social-proof {
    margin-bottom: 25px;
  }
  
  .value-props {
    margin-bottom: 25px;
  }
  
  .scroll-indicator {
    bottom: 15px;
  }
}
</style>