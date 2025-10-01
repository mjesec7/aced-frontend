<template>
  <section class="pricing-section">
    <div class="container">
      <div class="text-center">
        <div class="label-badge">🎯 Инвестиция в будущее</div>
        <h2 class="section-title">
          Выберите свой план<br />
          <span class="gradient-text">и начните расти</span>
        </h2>
        <p class="section-subtitle">
          Инвестируйте в своё образование сегодня. Каждый урок — это шаг к новым возможностям.
        </p>
      </div>

      <div class="pricing-cards">
        <div class="card glass-card">
          <div class="card-header">
            <div class="plan-icon">✨</div>
            <h3 class="plan-name">Базовый</h3>
            <p class="plan-desc">Для начинающих</p>
          </div>
          
          <div class="price-wrapper">
            <div class="price-row">
              <p class="old-price">520,000 сум</p>
              <div class="discount-badge">-50%</div>
            </div>
            <p class="price">260,000 <span class="currency">сум</span></p>
            <p class="period">единовременно</p>
          </div>
          
          <ul class="features">
            <li><span class="check">✓</span> <span>Доступ ко всем предметам</span></li>
            <li><span class="check">✓</span> <span>Помощь ИИ с домашкой</span></li>
            <li><span class="check">✓</span> <span>Прогресс и статистика</span></li>
          </ul>
          
          <button class="btn btn-outline" @click="handleClick('start')">
            <span class="btn-text">Выбрать план</span>
            <span class="btn-icon">→</span>
            <span class="btn-glow"></span>
          </button>
          
          <div class="card-shine"></div>
        </div>

        <div class="card glass-card popular">
          <div class="popular-badge">
            <span class="badge-icon">⭐</span>
            <span>Самый популярный</span>
          </div>
          
          <div class="card-header">
            <div class="plan-icon premium">💎</div>
            <h3 class="plan-name">Профессионал</h3>
            <p class="plan-desc">Для карьерного роста</p>
          </div>
          
          <div class="price-wrapper">
            <div class="price-row">
              <p class="old-price">900,000 сум</p>
              <div class="discount-badge premium">-50%</div>
            </div>
            <p class="price premium">450,000 <span class="currency">сум</span></p>
            <p class="period">единовременно</p>
            <div class="economy-badge">
              <span class="economy-icon">🎉</span>
              <span>Экономия 450,000 сум</span>
            </div>
          </div>
          
          <ul class="features">
            <li><span class="check premium">✓</span> <span>Всё из Базового +</span></li>
            <li><span class="check premium">✓</span> <span>Персональный ИИ-наставник</span></li>
            <li><span class="check premium">✓</span> <span>Продвинутая аналитика</span></li>
            <li><span class="check premium">✓</span> <span>Индивидуальная карта обучения</span></li>
          </ul>
          
          <button class="btn btn-gradient" @click="handleClick('pro')">
            <span class="btn-text">Начать сейчас!</span>
            <span class="btn-icon">🚀</span>
            <span class="btn-glow"></span>
          </button>
          
          <div class="card-shine"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { getAuth } from "firebase/auth";

export default {
  name: 'TariffSection',
  methods: {
    handleClick(plan) {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        window.dispatchEvent(new CustomEvent("open-Login-modal"));
      } else {
        this.$router.push(`/pay/${plan}`);
      }
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.pricing-section {
  padding: clamp(80px, 10vw, 120px) clamp(20px, 5vw, 80px);
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
}

.pricing-section::before {
  content: '';
  position: absolute;
  top: -30%;
  left: -15%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(60px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.text-center {
  text-align: center;
  margin-bottom: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 30px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #7c3aed;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.section-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 700;
  color: #0a0a0a;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.gradient-text {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle {
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: #737373;
  max-width: 600px;
  line-height: 1.6;
  font-weight: 400;
}

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(25px);
  border-radius: 24px;
  border: 1.5px solid rgba(139, 92, 246, 0.15);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08);
  display: flex;
  flex-direction: column;
}

.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.glass-card:hover {
  transform: translateY(-8px);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 20px 50px rgba(139, 92, 246, 0.2);
}

.glass-card:hover::before {
  opacity: 1;
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
  pointer-events: none;
}

.glass-card:hover .card-shine {
  left: 100%;
}

.card {
  padding: 40px 32px;
  text-align: center;
}

.card.popular {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(139, 92, 246, 0.3);
  transform: translateY(-10px);
  box-shadow: 0 8px 40px rgba(139, 92, 246, 0.15);
}

.card.popular::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 2px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa, #c4b5fd);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.5;
  animation: borderRotate 3s linear infinite;
  pointer-events: none;
}

@keyframes borderRotate {
  0% { filter: hue-rotate(0deg) brightness(1); }
  50% { filter: hue-rotate(10deg) brightness(1.1); }
  100% { filter: hue-rotate(0deg) brightness(1); }
}

.popular-badge {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  padding: 8px 20px;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
  z-index: 10;
}

.badge-icon {
  font-size: 0.875rem;
}

.card-header {
  margin-bottom: 32px;
  position: relative;
  z-index: 2;
}

.plan-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.plan-icon.premium {
  filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.3));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.plan-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
}

.plan-desc {
  font-size: 0.9375rem;
  color: #737373;
  font-weight: 500;
  margin: 0;
}

.price-wrapper {
  margin-bottom: 32px;
  position: relative;
  z-index: 2;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.old-price {
  font-size: 1.125rem;
  color: #a3a3a3;
  text-decoration: line-through;
  font-weight: 500;
  margin: 0;
}

.discount-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.75rem;
  font-weight: 700;
}

.discount-badge.premium {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #7c3aed;
}

.price {
  font-size: 3rem;
  font-weight: 800;
  color: #0a0a0a;
  line-height: 1;
  margin: 0;
  letter-spacing: -0.02em;
}

.price.premium {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.currency {
  font-size: 1.5rem;
  font-weight: 600;
}

.period {
  color: #a3a3a3;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 8px 0 0 0;
}

.economy-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(22, 163, 74, 0.08));
  border: 1px solid rgba(34, 197, 94, 0.25);
  color: #15803d;
  border-radius: 12px;
  padding: 8px 16px;
  margin-top: 16px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.economy-icon {
  font-size: 1rem;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
  text-align: left;
  flex-grow: 1;
  position: relative;
  z-index: 2;
}

.features li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.9375rem;
  color: #404040;
  font-weight: 500;
}

.check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1));
  border: 1.5px solid rgba(139, 92, 246, 0.3);
  border-radius: 50%;
  color: #7c3aed;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.check.premium {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.btn {
  position: relative;
  width: 100%;
  padding: 16px 28px;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  z-index: 2;
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn:hover .btn-glow {
  opacity: 1;
}

.btn-icon {
  transition: transform 0.3s ease;
}

.btn:hover .btn-icon {
  transform: translateX(4px);
}

.btn-outline {
  background: transparent;
  border: 2px solid rgba(139, 92, 246, 0.3);
  color: #7c3aed;
}

.btn-outline:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
}

.btn-gradient {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  color: white;
  box-shadow: 
    0 4px 20px rgba(139, 92, 246, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-gradient::before {
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

.btn-gradient:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 8px 35px rgba(139, 92, 246, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-gradient:hover::before {
  opacity: 1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .pricing-section {
    padding: 60px 24px;
  }
  
  .pricing-cards {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .card.popular {
    transform: translateY(0);
  }
  
  .card {
    padding: 32px 24px;
  }
}

@media (max-width: 480px) {
  .pricing-section {
    padding: 40px 16px;
  }
  
  .text-center {
    margin-bottom: 40px;
  }
  
  .plan-icon {
    font-size: 2.5rem;
  }
  
  .price {
    font-size: 2.5rem;
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