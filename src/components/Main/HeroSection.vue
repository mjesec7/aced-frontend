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
        <!-- Left Side - Enhanced Message -->
        <div class="hero-left">
          <div class="hero-message">
            <div class="label-badge">🚀 Платформа №1 в Узбекистане</div>
            <h1 class="hero-title">
              Твой путь к знаниям<br />
              начинается здесь
            </h1>
            <p class="hero-subtitle">
              Более 2,800 студентов уже учатся на ACED. Присоединяйся и получи доступ к урокам прямо сейчас — это займет 30 секунд
            </p>
          </div>

          <!-- Social Proof -->
          <div class="proof-section">
            <div class="proof-avatars">
              <div class="avatar">👤</div>
              <div class="avatar">👤</div>
              <div class="avatar">👤</div>
              <div class="avatar-more">+2,844</div>
            </div>
            <div class="proof-text">
              <strong>Уже учатся</strong> и достигают результатов
            </div>
          </div>

          <!-- Trust Badges -->
          <div class="trust-badges">
            <div class="badge-item">
              <span class="badge-icon">✓</span>
              <span>Бесплатный старт</span>
            </div>
            <div class="badge-item">
              <span class="badge-icon">✓</span>
              <span>Без кредитной карты</span>
            </div>
            <div class="badge-item">
              <span class="badge-icon">✓</span>
              <span>Отменить в любое время</span>
            </div>
          </div>
        </div>

        <!-- Right Side - Glassmorphism Cards -->
        <div class="hero-right">
          <div class="cards-stack">
            <!-- Free Card -->
            <div class="glass-card" @click="handleStartFree">
              <div class="card-inner">
                <h3 class="card-title">Попробуй бесплатно</h3>
                <p class="card-description">
                  Начни учиться прямо сейчас. Никаких карт, никаких обязательств.
                </p>
                <div class="card-footer">
                  <span class="card-link">Начать учиться →</span>
                </div>
              </div>
              <div class="glass-shine"></div>
            </div>

            <!-- Premium Card -->
            <div class="glass-card premium" @click="handleRegister">
              <div class="card-inner">
                <h3 class="card-title">Зарегистрируйся и сохрани прогресс</h3>
                <p class="card-description">
                  Отслеживай достижения, получай сертификаты, учись где угодно.
                </p>
                <div class="card-footer">
                  <span class="card-link">Создать аккаунт →</span>
                </div>
              </div>
              <div class="glass-shine"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserSection from "@/components/Main/UserSection.vue";

export default {
  components: { UserSection },
  
  methods: {
    handleStartFree() {
      const acedSection = document.getElementById('aced');
      if (acedSection) {
        acedSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        window.scrollTo({
          top: window.innerHeight,
          behavior: 'smooth'
        });
      }
    },
    
    handleRegister() {
      window.dispatchEvent(new Event("open-Login-modal"));
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.hero-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Subtle gradient orbs */
.hero-container::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -15%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(60px);
}

.hero-container::after {
  content: '';
  position: absolute;
  bottom: -20%;
  left: -10%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(50px);
}

/* Navigation */
.top-nav {
  position: relative;
  width: 100%;
  height: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  background: transparent;
}

.nav-inner {
  max-width: 1400px;
  width: 100%;
  padding: 0 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.aced-logo {
  height: 60px;
  width: auto;
}

/* Hero Content */
.hero-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 50px 60px;
  z-index: 2;
}

.hero-inner {
  max-width: 1400px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

/* Left Side */
.hero-left {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.hero-message {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 30px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #7c3aed;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.hero-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: clamp(1.0625rem, 2vw, 1.1875rem);
  color: #404040;
  font-weight: 400;
  line-height: 1.65;
  max-width: 540px;
}

/* Social Proof */
.proof-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.08);
}

.proof-avatars {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  margin-left: -12px;
  font-size: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar:first-child {
  margin-left: 0;
}

.avatar-more {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  margin-left: -12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.proof-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #404040;
  line-height: 1.4;
}

.proof-text strong {
  color: #0a0a0a;
  font-weight: 600;
}

/* Trust Badges */
.trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #15803d;
}

.badge-icon {
  font-size: 0.875rem;
  font-weight: 700;
}

/* Right Side - Glassmorphism Cards */
.hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.glass-card {
  position: relative;
  padding: 36px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(30px);
  border: 2px solid;
  border-image: linear-gradient(135deg, #8b5cf6, #6d28d9, #8b5cf6) 1;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(139, 92, 246, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  aspect-ratio: 1.8 / 1;
  display: flex;
  align-items: center;
}

.glass-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 2px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9, #a78bfa);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.glass-card.premium {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 
    0 12px 48px rgba(139, 92, 246, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.glass-card.premium::after {
  background: linear-gradient(135deg, #7c3aed, #5b21b6, #8b5cf6);
  animation: borderRotate 3s linear infinite;
}

@keyframes borderRotate {
  0% { filter: hue-rotate(0deg) brightness(1); }
  50% { filter: hue-rotate(10deg) brightness(1.1); }
  100% { filter: hue-rotate(0deg) brightness(1); }
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.glass-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 
    0 20px 60px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.glass-card.premium:hover {
  box-shadow: 
    0 24px 70px rgba(139, 92, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.glass-card:hover::before {
  opacity: 1;
}

.glass-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.6s ease;
  pointer-events: none;
}

.glass-card:hover .glass-shine {
  left: 100%;
}

.card-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: #0a0a0a;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.card-description {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #525252;
  line-height: 1.6;
  font-weight: 400;
}

.card-footer {
  margin-top: 8px;
}

.card-link {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #7c3aed;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.3s ease;
}

.glass-card:hover .card-link {
  gap: 8px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .hero-inner {
    grid-template-columns: 1fr 1fr;
    gap: 50px;
  }
}

@media (max-width: 1024px) {
  .nav-inner {
    padding: 0 40px;
  }
  
  .hero-content {
    padding: 0 40px;
  }
  
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 50px;
  }
  
  .hero-left {
    align-items: center;
    text-align: center;
  }
  
  .label-badge {
    margin: 0 auto;
  }
  
  .hero-subtitle {
    margin: 0 auto;
  }
  
  .cards-stack {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .top-nav {
    height: 80px;
  }
  
  .nav-inner {
    padding: 0 24px;
  }
  
  .aced-logo {
    height: 50px;
  }
  
  .hero-content {
    padding: 30px 24px;
  }
  
  .hero-left {
    gap: 30px;
  }
  
  .hero-message {
    gap: 16px;
  }
  
  .proof-section {
    padding: 16px 20px;
  }
  
  .glass-card {
    padding: 28px;
    aspect-ratio: auto;
    min-height: 180px;
  }
  
  .card-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .hero-content {
    padding: 20px 16px 40px;
  }
  
  .hero-left {
    gap: 24px;
  }
  
  .label-badge {
    font-size: 0.75rem;
    padding: 6px 12px;
  }
  
  .proof-section {
    padding: 14px 16px;
  }
  
  .cards-stack {
    gap: 16px;
  }
  
  .glass-card {
    padding: 24px;
    aspect-ratio: auto;
    min-height: 160px;
  }
  
  .card-inner {
    gap: 12px;
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