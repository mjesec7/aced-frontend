<template>
  <section class="pricing-section">
    <div class="container">
      <div class="header">
        <h2 class="title">Простые и прозрачные тарифы</h2>
        <p class="subtitle">Выберите план, который подходит именно вам</p>
      </div>

      <div class="plans">
        <!-- Basic Plan -->
        <div class="plan-card">
          <div class="plan-top">
            <h3 class="plan-name">Базовый</h3>
            <p class="plan-description">Идеально для старта</p>
          </div>

          <div class="plan-price">
            <div class="price-main">
              <span class="amount">260,000</span>
              <span class="currency">сум</span>
            </div>
            <div class="price-note">
              <span class="original">520,000 сум</span>
              <span class="save">Скидка 50%</span>
            </div>
          </div>

          <div class="plan-features">
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Доступ ко всем предметам</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Помощь ИИ с домашкой</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Прогресс и статистика</span>
            </div>
          </div>

          <button class="plan-button" @click="handleClick('start')">
            Начать обучение
          </button>
        </div>

        <!-- Pro Plan -->
        <div class="plan-card premium">
          <div class="badge">Рекомендуем</div>
          
          <div class="plan-top">
            <h3 class="plan-name">Профессионал</h3>
            <p class="plan-description">Максимум возможностей</p>
          </div>

          <div class="plan-price">
            <div class="price-main">
              <span class="amount">450,000</span>
              <span class="currency">сум</span>
            </div>
            <div class="price-note">
              <span class="original">900,000 сум</span>
              <span class="save premium">Скидка 50%</span>
            </div>
          </div>

          <div class="plan-features">
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Всё из Базового</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Персональный ИИ-наставник</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Продвинутая аналитика</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Индивидуальная карта обучения</span>
            </div>
          </div>

          <button class="plan-button premium" @click="handleClick('pro')">
            Начать сейчас
          </button>
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
* {
  box-sizing: border-box;
}

.pricing-section {
  padding: 120px 24px;
  background: #ffffff;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 80px;
}

.title {
  font-size: 56px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 16px 0;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.subtitle {
  font-size: 20px;
  color: #666666;
  margin: 0;
  font-weight: 400;
}

/* Plans Grid */
.plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 40px;
  max-width: 880px;
  margin: 0 auto;
}

/* Plan Card */
.plan-card {
  background: #fafafa;
  border-radius: 20px;
  padding: 48px 40px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.plan-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.08);
}

.plan-card.premium {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.plan-card.premium:hover {
  box-shadow: 0 32px 64px rgba(102, 126, 234, 0.3);
}

/* Badge */
.badge {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  background: #000000;
  color: #ffffff;
  padding: 8px 24px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Plan Top */
.plan-top {
  margin-bottom: 32px;
}

.plan-name {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: inherit;
}

.plan-description {
  font-size: 16px;
  margin: 0;
  opacity: 0.7;
}

/* Pricing */
.plan-price {
  margin-bottom: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.plan-card.premium .plan-price {
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.amount {
  font-size: 64px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
}

.currency {
  font-size: 24px;
  font-weight: 600;
  opacity: 0.8;
}

.price-note {
  display: flex;
  align-items: center;
  gap: 12px;
}

.original {
  font-size: 16px;
  text-decoration: line-through;
  opacity: 0.5;
}

.save {
  background: #000000;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.save.premium {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

/* Features */
.plan-features {
  margin-bottom: 40px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 16px;
  line-height: 1.5;
}

.feature .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  color: #667eea;
}

.plan-card.premium .feature .icon {
  color: #ffffff;
}

.feature span {
  opacity: 0.9;
}

/* Button */
.plan-button {
  width: 100%;
  padding: 18px 32px;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.plan-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.plan-button.premium {
  background: #ffffff;
  color: #764ba2;
}

.plan-button.premium:hover {
  box-shadow: 0 12px 24px rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-section {
    padding: 80px 20px;
  }

  .title {
    font-size: 40px;
  }

  .subtitle {
    font-size: 18px;
  }

  .plans {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .plan-card {
    padding: 40px 32px;
  }

  .amount {
    font-size: 56px;
  }
}

@media (max-width: 480px) {
  .pricing-section {
    padding: 60px 16px;
  }

  .header {
    margin-bottom: 60px;
  }

  .title {
    font-size: 32px;
  }

  .plan-card {
    padding: 32px 24px;
  }

  .amount {
    font-size: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>