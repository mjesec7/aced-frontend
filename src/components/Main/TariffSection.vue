<template>
  <section class="pricing-section">
    <div class="container">
      <div class="header">
        <h2 class="title">Simple and Transparent Pricing</h2>
        <p class="subtitle">Choose the plan that's right for you</p>
      </div>

      <div class="plans">
        <!-- Basic Plan -->
        <div class="plan-card">
          <div class="plan-top">
            <h3 class="plan-name">Basic</h3>
            <p class="plan-description">Perfect to get started</p>
          </div>

          <div class="plan-price">
            <div class="price-main">
              <span class="amount">260,000</span>
              <span class="currency">sum</span>
            </div>
            <div class="price-note">
              <span class="original">520,000 sum</span>
              <span class="save">-50%</span>
            </div>
          </div>

          <div class="plan-features">
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Access to all subjects</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>AI homework help</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Progress and statistics</span>
            </div>
          </div>

          <button class="plan-button" @click="handleClick('start')">
            Start Learning
          </button>
        </div>

        <!-- Pro Plan -->
        <div class="plan-card premium">
          <div class="badge">Recommended</div>
          
          <div class="plan-top">
            <h3 class="plan-name">Professional</h3>
            <p class="plan-description">Maximum capabilities</p>
          </div>

          <div class="plan-price">
            <div class="price-main">
              <span class="amount">450,000</span>
              <span class="currency">sum</span>
            </div>
            <div class="price-note">
              <span class="original">900,000 sum</span>
              <span class="save premium">-50%</span>
            </div>
          </div>

          <div class="plan-features">
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Everything in Basic</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Personal AI tutor</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Advanced analytics</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Personalized learning path</span>
            </div>
          </div>

          <button class="plan-button premium" @click="handleClick('pro')">
            Start Now
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
  padding: 80px 24px;
  background: #ffffff;
}

.container {
  max-width: 960px;
  margin: 0 auto;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 56px;
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.subtitle {
  font-size: 16px;
  color: #666666;
  margin: 0;
  font-weight: 400;
}

/* Plans Grid */
.plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* Plan Card */
.plan-card {
  background: #fafafa;
  border-radius: 16px;
  padding: 32px 28px;
  position: relative;
  transition: all 0.2s ease;
  border: 1.5px solid transparent;
}

.plan-card:hover {
  border-color: #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.plan-card.premium {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.plan-card.premium:hover {
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.2);
}

/* Badge */
.badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #000000;
  color: #ffffff;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Plan Top */
.plan-top {
  margin-bottom: 24px;
}

.plan-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: inherit;
}

.plan-description {
  font-size: 14px;
  margin: 0;
  opacity: 0.7;
}

/* Pricing */
.plan-price {
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.plan-card.premium .plan-price {
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 10px;
}

.amount {
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.currency {
  font-size: 18px;
  font-weight: 600;
  opacity: 0.8;
}

.price-note {
  display: flex;
  align-items: center;
  gap: 10px;
}

.original {
  font-size: 14px;
  text-decoration: line-through;
  opacity: 0.5;
}

.save {
  background: #000000;
  color: #ffffff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.save.premium {
  background: rgba(0, 0, 0, 0.2);
}

/* Features */
.plan-features {
  margin-bottom: 28px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.feature .icon {
  width: 18px;
  height: 18px;
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
  padding: 14px 24px;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.plan-button:hover {
  background: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.plan-button.premium {
  background: #ffffff;
  color: #764ba2;
}

.plan-button.premium:hover {
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.25);
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-section {
    padding: 64px 20px;
  }

  .title {
    font-size: 32px;
  }

  .subtitle {
    font-size: 15px;
  }

  .plans {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .plan-card {
    padding: 28px 24px;
  }

  .amount {
    font-size: 38px;
  }
}

@media (max-width: 480px) {
  .pricing-section {
    padding: 48px 16px;
  }

  .header {
    margin-bottom: 40px;
  }

  .title {
    font-size: 28px;
  }

  .plan-card {
    padding: 24px 20px;
  }

  .amount {
    font-size: 36px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>