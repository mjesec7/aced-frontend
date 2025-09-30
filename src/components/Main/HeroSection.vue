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
          <h1 class="hero-title">Образовательная платформа нового поколения</h1>
          <p class="hero-subtitle">
            Персонализированное обучение с отслеживанием прогресса
          </p>
        </div>

        <!-- CTA Cards -->
        <div class="cta-cards">
          <div class="cta-card glass" @click="handleStartFree">
            <div class="card-content">
              <h3 class="card-title">Начать бесплатно</h3>
              <p class="card-description">
                Доступ к бесплатным урокам без регистрации
              </p>
              <div class="card-action">
                <span class="action-text">Попробовать</span>
                <span class="action-arrow">→</span>
              </div>
            </div>
            <div class="card-shine"></div>
          </div>

          <div class="cta-card glass premium" @click="handleRegister">
            <div class="card-badge">Рекомендуем</div>
            <div class="card-content">
              <h3 class="card-title">Зарегистрироваться</h3>
              <p class="card-description">
                Отслеживайте прогресс и получайте сертификаты
              </p>
              <div class="card-action">
                <span class="action-text">Начать</span>
                <span class="action-arrow">→</span>
              </div>
            </div>
            <div class="card-shine"></div>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-number">2,847</span>
            <span class="stat-label">активных студентов</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">120+</span>
            <span class="stat-label">уроков</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">4.8/5</span>
            <span class="stat-label">рейтинг</span>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.hero-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Subtle metallic purple accents */
.hero-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  pointer-events: none;
  animation: float 20s ease-in-out infinite;
}

.hero-container::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -20%;
  width: 70%;
  height: 70%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
  pointer-events: none;
  animation: float 25s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, 20px); }
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
  backdrop-filter: blur(10px);
  background: rgba(15, 15, 30, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
  height: 50px;
  width: auto;
  filter: brightness(0) invert(1);
}

/* Hero Content */
.hero-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  z-index: 2;
}

.hero-inner {
  max-width: 1100px;
  width: 100%;
  text-align: center;
}

/* Hero Message */
.hero-message {
  margin-bottom: 60px;
}

.hero-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  line-height: 1.6;
}

/* CTA Cards */
.cta-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 60px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.cta-card {
  position: relative;
  padding: 32px 28px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.cta-card.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.cta-card.premium {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.cta-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.cta-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
}

.cta-card:hover::before {
  opacity: 1;
}

.card-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
}

.cta-card:hover .card-shine {
  opacity: 1;
  animation: shine 1.5s ease-in-out;
}

@keyframes shine {
  0% { transform: translateX(-100%) translateY(-100%); }
  100% { transform: translateX(100%) translateY(100%); }
}

.card-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  font-size: 0.75rem;
  color: #c4b5fd;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.02em;
}

.card-content {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.card-description {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 24px;
  flex: 1;
}

.card-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

.action-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #ffffff;
  letter-spacing: 0.01em;
}

.action-arrow {
  font-size: 1.25rem;
  color: rgba(139, 92, 246, 0.8);
  transition: transform 0.3s ease;
}

.cta-card:hover .action-arrow {
  transform: translateX(4px);
  color: #a78bfa;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  max-width: 700px;
  margin: 0 auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

.stat-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
  text-transform: lowercase;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .nav-inner {
    padding: 0 30px;
  }
  
  .hero-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
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
    height: 45px;
  }
  
  .hero-content {
    padding: 40px 20px;
  }
  
  .hero-message {
    margin-bottom: 40px;
  }
  
  .cta-cards {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .cta-card {
    padding: 28px 24px;
    min-height: 180px;
  }
  
  .card-title {
    font-size: 1.25rem;
  }
  
  .stats-bar {
    gap: 24px;
    padding: 20px 24px;
    flex-wrap: wrap;
  }
  
  .stat-number {
    font-size: 1.25rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .top-nav {
    height: 70px;
  }
  
  .aced-logo {
    height: 40px;
  }
  
  .hero-content {
    padding: 30px 16px;
  }
  
  .hero-message {
    margin-bottom: 32px;
  }
  
  .cta-cards {
    gap: 16px;
  }
  
  .cta-card {
    padding: 24px 20px;
    min-height: 160px;
  }
  
  .card-title {
    font-size: 1.125rem;
    margin-bottom: 10px;
  }
  
  .card-description {
    font-size: 0.875rem;
    margin-bottom: 20px;
  }
  
  .action-text {
    font-size: 0.875rem;
  }
  
  .stats-bar {
    padding: 16px 20px;
    gap: 16px;
  }
  
  .stat-divider {
    display: none;
  }
}

@media (max-width: 320px) {
  .hero-title {
    font-size: 1.5rem;
  }
  
  .cta-card {
    padding: 20px 16px;
  }
  
  .card-badge {
    font-size: 0.625rem;
    padding: 3px 8px;
  }
}

/* Landscape orientation */
@media (max-height: 600px) and (orientation: landscape) {
  .hero-content {
    padding: 30px 20px;
  }
  
  .hero-message {
    margin-bottom: 30px;
  }
  
  .cta-cards {
    margin-bottom: 30px;
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