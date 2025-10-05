<template>
  <section class="pricing-section">
    <div class="container">
      <div class="section-header">
        <span class="section-label">Тарифы</span>
        <h2 class="section-title">
          Выберите свой план
        </h2>
        <p class="section-subtitle">
          Инвестируйте в своё образование. Каждый урок — шаг к новым возможностям
        </p>
      </div>

      <div class="pricing-grid">
        <!-- Basic Plan -->
        <div class="pricing-card">
          <div class="card-content">
            <div class="plan-header">
              <h3 class="plan-title">Базовый</h3>
              <p class="plan-subtitle">Для начинающих</p>
            </div>

            <div class="pricing-info">
              <div class="price-compare">
                <span class="old-price">520,000</span>
                <span class="discount">-50%</span>
              </div>
              <div class="current-price">
                <span class="amount">260,000</span>
                <span class="currency">сум</span>
              </div>
            </div>

            <ul class="features-list">
              <li class="feature-item">
                <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Доступ ко всем предметам</span>
              </li>
              <li class="feature-item">
                <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Помощь ИИ с домашкой</span>
              </li>
              <li class="feature-item">
                <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Прогресс и статистика</span>
              </li>
            </ul>

            <button class="cta-button" @click="handleClick('start')">
              Выбрать план
            </button>
          </div>
        </div>

        <!-- Professional Plan -->
        <div class="pricing-card featured">
          <div class="popular-tag">Популярный</div>
          
          <div class="card-content">
            <div class="plan-header">
              <h3 class="plan-title">Профессионал</h3>
              <p class="plan-subtitle">Для карьерного роста</p>
            </div>

            <div class="pricing-info">
              <div class="price-compare">
                <span class="old-price">900,000</span>
                <span class="discount featured">-50%</span>
              </div>
              <div class="current-price featured">
                <span class="amount">450,000</span>
                <span class="currency">сум</span>
              </div>
              <div class="savings-badge">
                Экономия 450,000 сум
              </div>
            </div>

            <ul class="features-list">
              <li class="feature-item">
                <svg class="check-icon featured" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Всё из Базового +</span>
              </li>
              <li class="feature-item">
                <svg class="check-icon featured" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Персональный ИИ-наставник</span>
              </li>
              <li class="feature-item">
                <svg class="check-icon featured" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Продвинутая аналитика</span>
              </li>
              <li class="feature-item">
                <svg class="check-icon featured" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Индивидуальная карта обучения</span>
              </li>
            </ul>

            <button class="cta-button featured" @click="handleClick('pro')">
              Начать сейчас
            </button>
          </div>
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
.pricing-section {
  padding: 100px 24px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  position: relative;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

/* Section Header */
.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-label {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 20px;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.section-title {
  font-size: 48px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 18px;
  color: #666666;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Pricing Grid */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  max-width: 900px;
  margin: 0 auto;
}

/* Pricing Card */
.pricing-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  position: relative;
  transition: all 0.3s ease;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.pricing-card.featured {
  background: linear-gradient(180deg, #ffffff 0%, #faf5ff 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
}

.pricing-card.featured::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  z-index: -1;
}

.pricing-card.featured:hover {
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.25);
}

/* Popular Tag */
.popular-tag {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Card Content */
.card-content {
  padding: 40px 32px;
}

/* Plan Header */
.plan-header {
  margin-bottom: 32px;
}

.plan-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
}

.plan-subtitle {
  font-size: 15px;
  color: #666666;
  margin: 0;
  font-weight: 500;
}

/* Pricing Info */
.pricing-info {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f0f0f0;
}

.price-compare {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.old-price {
  font-size: 16px;
  color: #999999;
  text-decoration: line-through;
  font-weight: 500;
}

.discount {
  display: inline-block;
  padding: 4px 10px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
}

.discount.featured {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  color: #667eea;
}

.current-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.current-price .amount {
  font-size: 48px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1;
  letter-spacing: -0.02em;
}

.current-price.featured .amount {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.current-price .currency {
  font-size: 18px;
  color: #666666;
  font-weight: 600;
}

.savings-badge {
  display: inline-block;
  margin-top: 16px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #d1fae515 0%, #10b98115 100%);
  border: 1px solid #10b98130;
  color: #059669;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
}

/* Features List */
.features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  font-size: 15px;
  color: #404040;
  line-height: 1.5;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: #667eea;
  flex-shrink: 0;
  margin-top: 2px;
}

.check-icon.featured {
  color: #764ba2;
}

/* CTA Button */
.cta-button {
  width: 100%;
  padding: 16px 24px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.cta-button:hover {
  background: #333333;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.cta-button.featured {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.cta-button.featured:hover {
  background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-section {
    padding: 60px 20px;
  }

  .section-title {
    font-size: 36px;
  }

  .section-subtitle {
    font-size: 16px;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .card-content {
    padding: 32px 24px;
  }

  .current-price .amount {
    font-size: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>