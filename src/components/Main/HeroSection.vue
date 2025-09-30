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
            <div class="label-badge">Образовательная платформа</div>
            <h1 class="hero-title">
              Учитесь эффективно.<br />
              Достигайте большего.
            </h1>
            <p class="hero-subtitle">
              Персонализированное обучение с AI-ассистентом и отслеживанием прогресса в реальном времени
            </p>
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="stat-item">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-number">2,847</div>
                <div class="stat-label">Активных студентов</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📚</div>
              <div class="stat-info">
                <div class="stat-number">120+</div>
                <div class="stat-label">Уроков доступно</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⭐</div>
              <div class="stat-info">
                <div class="stat-number">4.8/5</div>
                <div class="stat-label">Средний рейтинг</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Glassmorphism Cards -->
        <div class="hero-right">
          <div class="cards-stack">
            <!-- Free Card -->
            <div class="glass-card" @click="handleStartFree">
              <div class="card-inner">
                <div class="card-header">
                  <h3 class="card-title">Начать бесплатно</h3>
                  <div class="card-tag">Free</div>
                </div>
                <p class="card-description">
                  Мгновенный доступ к бесплатным урокам без регистрации
                </p>
                <div class="card-footer">
                  <span class="card-link">Попробовать →</span>
                </div>
              </div>
              <div class="glass-shine"></div>
            </div>

            <!-- Premium Card -->
            <div class="glass-card premium" @click="handleRegister">
              <div class="card-inner">
                <div class="card-header">
                  <h3 class="card-title">Зарегистрироваться</h3>
                  <div class="card-tag premium">Pro</div>
                </div>
                <p class="card-description">
                  Полный доступ с отслеживанием прогресса и сертификатами
                </p>
                <div class="card-footer">
                  <span class="card-link">Начать →</span>
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
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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
  height: 45px;
  width: auto;
}

/* Hero Content */
.hero-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 50px;
  z-index: 2;
}

.hero-inner {
  max-width: 1400px;
  width: 100%;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 60px;
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
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 30px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #7c3aed;
  letter-spacing: 0.02em;
}

.hero-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: #525252;
  font-weight: 400;
  line-height: 1.7;
  max-width: 540px;
}

/* Quick Stats */
.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 12px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-number {
  font-family: 'Inter', sans-serif;
  font-size: 1.375rem;
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1;
}

.stat-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  color: #737373;
  font-weight: 500;
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
  gap: 16px;
  width: 100%;
  max-width: 480px;
}

.glass-card {
  position: relative;
  padding: 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.glass-card.premium {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 
    0 12px 40px rgba(139, 92, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 1);
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
  transform: translateY(-4px);
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.glass-card.premium:hover {
  box-shadow: 
    0 20px 60px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  border-color: rgba(139, 92, 246, 0.3);
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: #0a0a0a;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.card-tag {
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #525252;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-tag.premium {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #7c3aed;
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
    height: 70px;
  }
  
  .nav-inner {
    padding: 0 24px;
  }
  
  .aced-logo {
    height: 40px;
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
  
  .quick-stats {
    padding: 24px;
    gap: 16px;
  }
  
  .stat-icon {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
  }
  
  .stat-number {
    font-size: 1.125rem;
  }
  
  .glass-card {
    padding: 28px;
  }
  
  .card-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .hero-content {
    padding: 20px 16px;
  }
  
  .hero-left {
    gap: 24px;
  }
  
  .label-badge {
    font-size: 0.75rem;
    padding: 6px 12px;
  }
  
  .quick-stats {
    padding: 20px;
  }
  
  .cards-stack {
    gap: 12px;
  }
  
  .glass-card {
    padding: 24px;
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