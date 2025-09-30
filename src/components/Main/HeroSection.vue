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
  background: #ffffff;
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
  background: radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, transparent 70%);
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
  background: radial-gradient(circle, rgba(99, 102, 241, 0.02) 0%, transparent 70%);
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
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
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
}

/* Hero Content */
.hero-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
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

/* Hero Message */
.hero-message {
  text-align: left;
}

.hero-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 600;
  color: #0f0f0f;
  line-height: 1.3;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
  line-height: 1.6;
}

/* CTA Cards */
.cta-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.cta-card {
  position: relative;
  padding: 28px 32px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  border: 1px solid;
}

.cta-card.glass {
  background: #ffffff;
  border-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.cta-card.premium {
  background: #fafafa;
  border-color: #8b5cf6;
  position: relative;
}

.cta-card.premium::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6, #6d28d9, #8b5cf6);
  background-size: 200% 100%;
}

.cta-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.cta-card.premium:hover::after {
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.card-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.6875rem;
  color: #6b7280;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.03em;
  text-transform: uppercase;
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
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
  color: #111827;
}

.card-description {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 20px;
  flex: 1;
  color: #6b7280;
}

.card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid;
}

.cta-card.glass .card-action {
  background: #ffffff;
  border-color: #e5e7eb;
  color: #111827;
}

.cta-card.glass:hover .card-action {
  background: #f9fafb;
  border-color: #d1d5db;
}

.cta-card.premium .card-action {
  background: #8b5cf6;
  border-color: #8b5cf6;
  color: #ffffff;
}

.cta-card.premium:hover .card-action {
  background: #7c3aed;
  border-color: #7c3aed;
}

.action-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.action-arrow {
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.cta-card:hover .action-arrow {
  transform: translateX(2px);
}

.card-shine {
  display: none;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 40px;
  padding: 24px 32px;
  background: rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  margin-top: 40px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.stat-number {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f0f0f;
  line-height: 1;
}

.stat-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 400;
  text-transform: lowercase;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(0, 0, 0, 0.1);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .nav-inner {
    padding: 0 30px;
  }
  
  .hero-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
  }
  
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 50px;
  }
  
  .hero-message {
    text-align: center;
  }
  
  .stats-bar {
    justify-content: center;
  }
  
  .stat-item {
    align-items: center;
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
  
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .hero-message {
    text-align: center;
  }
  
  .cta-cards {
    gap: 16px;
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
    justify-content: center;
  }
  
  .stat-item {
    align-items: center;
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
  
  .hero-inner {
    gap: 32px;
  }
  
  .cta-cards {
    gap: 14px;
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
    padding: 30px 40px;
  }
  
  .hero-inner {
    gap: 40px;
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