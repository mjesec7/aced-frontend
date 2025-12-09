<template>
  <section class="pricing-section">
    <div class="container">
      <div class="header">
        <h2 class="title">Simple and Transparent Pricing</h2>
        <p class="subtitle">Choose the duration that works best for you</p>
      </div>

      <!-- Three Pricing Cards -->
      <div class="pricing-cards-grid">
        
        <!-- 1 Month Card -->
        <div class="plan-card">
          <div class="plan-top">
            <h3 class="plan-name">1 Month</h3>
            <p class="plan-description">Perfect for trying out</p>
          </div>

          <div class="plan-price">
            <div class="price-main">
              <span class="amount">250,000</span>
              <span class="currency">UZS</span>
            </div>
            <div class="price-period">per month</div>
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
              <span>Unlimited messages</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Unlimited images</span>
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
              <span>Priority support</span>
            </div>
          </div>

          <button class="plan-button" @click="handleSubscribe(1)">
            Subscribe Now
          </button>
        </div>

        <!-- 3 Months Card - MOST POPULAR -->
        <div class="plan-card featured">
          <div class="badge">Most Popular</div>
          
          <div class="plan-top">
            <h3 class="plan-name">3 Months</h3>
            <p class="plan-description">Best value for learners</p>
          </div>

          <div class="plan-price">
            <div class="price-main">
              <span class="amount">675,000</span>
              <span class="currency">UZS</span>
            </div>
            <div class="price-note">
              <span class="per-month">225,000 UZS/month</span>
              <span class="save">10% OFF</span>
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
              <span>Unlimited messages</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Unlimited images</span>
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
              <span>Priority support</span>
            </div>
          </div>

          <button class="plan-button" @click="handleSubscribe(3)">
            Subscribe Now
          </button>
        </div>

        <!-- 6 Months Card -->
        <div class="plan-card">
          <div class="plan-top">
            <h3 class="plan-name">6 Months</h3>
            <p class="plan-description">Maximum savings</p>
          </div>

          <div class="plan-price">
            <div class="price-main">
              <span class="amount">1,200,000</span>
              <span class="currency">UZS</span>
            </div>
            <div class="price-note">
              <span class="per-month">200,000 UZS/month</span>
              <span class="save">20% OFF</span>
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
              <span>Unlimited messages</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Unlimited images</span>
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
              <span>Priority support</span>
            </div>
          </div>

          <button class="plan-button" @click="handleSubscribe(6)">
            Subscribe Now
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
    handleSubscribe(duration) {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        window.dispatchEvent(new CustomEvent("open-Login-modal"));
      } else {
        // Navigate to payment page with duration parameter
        this.$router.push(`/pay/pro?duration=${duration}`);
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
  max-width: 1200px;
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

/* Cards Grid */
.pricing-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

/* Plan Card */
.plan-card {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  padding: 32px 24px;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

/* Featured Card (3 months) */
.plan-card.featured {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}

.plan-card.featured:hover {
  transform: scale(1.08) translateY(-4px);
  box-shadow: 0 16px 40px rgba(102, 126, 234, 0.4);
}

/* Badge */
.badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #000000;
  color: #ffffff;
  padding: 6px 20px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Plan Top */
.plan-top {
  margin-bottom: 24px;
  text-align: center;
}

.plan-name {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.plan-card.featured .plan-name {
  color: white;
}

.plan-description {
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
}

/* Pricing */
.plan-price {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
}

.plan-card.featured .plan-price {
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
  justify-content: center;
}

.amount {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.currency {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.8;
}

.price-period {
  font-size: 13px;
  opacity: 0.7;
}

.price-note {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.per-month {
  font-size: 13px;
  opacity: 0.8;
}

.save {
  background: rgba(251, 191, 36, 0.2);
  color: #f59e0b;
  padding: 3px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.plan-card.featured .save {
  background: rgba(0, 0, 0, 0.25);
  color: #fbbf24;
}

/* Features */
.plan-features {
  margin-bottom: 24px;
  flex-grow: 1;
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

.plan-card.featured .feature .icon {
  color: #ffffff;
}

.feature span {
  opacity: 0.95;
}

/* Button */
.plan-button {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.plan-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.plan-button:active {
  transform: translateY(0);
}

.plan-card.featured .plan-button {
  background: #ffffff;
  color: #764ba2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.plan-card.featured .plan-button:hover {
  box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-section {
    padding: 64px 20px;
  }

  .pricing-cards-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  .plan-card.featured {
    transform: scale(1);
  }

  .plan-card.featured:hover {
    transform: scale(1.02) translateY(-4px);
  }

  .title {
    font-size: 32px;
  }

  .subtitle {
    font-size: 15px;
  }

  .amount {
    font-size: 32px;
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
    padding: 28px 20px;
  }

  .amount {
    font-size: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>