<template>
  <section class="pricing-section">
    <div class="container">
      <div class="header">
        <h2 class="title">Simple and Transparent Pricing</h2>
        <p class="subtitle">Choose the duration that works best for you</p>
      </div>

      <!-- Pro Plan Card -->
      <div class="pro-plan-wrapper">
        <div class="plan-card pro">
          <div class="badge">Most Popular</div>
          
          <div class="plan-top">
            <h3 class="plan-name">Pro Plan</h3>
            <p class="plan-description">Full access to all features</p>
          </div>

          <!-- Duration Selector -->
          <div class="duration-selector">
            <button
              v-for="option in durationOptions"
              :key="option.months"
              @click="selectedDuration = option.months"
              :class="['duration-btn', { active: selectedDuration === option.months }]"
            >
              <div class="duration-period">{{ option.label }}</div>
              <div v-if="option.savings" class="duration-savings">Save {{ option.savings }}</div>
            </button>
          </div>

          <!-- Pricing Display -->
          <div class="plan-price">
            <div class="price-main">
              <span class="amount">{{ formatPrice(currentPrice) }}</span>
              <span class="currency">UZS</span>
            </div>
            <div v-if="selectedDuration > 1" class="price-note">
              <span class="per-month">{{ formatPrice(pricePerMonth) }} UZS/month</span>
              <span class="save">{{ savingsPercentage }}% OFF</span>
            </div>
          </div>

          <!-- Features -->
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
              <span>Unlimited tests and analytics</span>
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
              <span>Personal vocabulary</span>
            </div>
            <div class="feature">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Priority support</span>
            </div>
          </div>

          <button class="plan-button" @click="handleSubscribe">
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
  
  data() {
    return {
      selectedDuration: 1,
      durationOptions: [
        { months: 1, label: '1 Month', price: 250000, savings: null },
        { months: 3, label: '3 Months', price: 675000, savings: '10%' },
        { months: 6, label: '6 Months', price: 1200000, savings: '20%' }
      ]
    };
  },
  
  computed: {
    currentPrice() {
      const option = this.durationOptions.find(opt => opt.months === this.selectedDuration);
      return option ? option.price : 250000;
    },
    
    pricePerMonth() {
      return Math.round(this.currentPrice / this.selectedDuration);
    },
    
    savingsPercentage() {
      if (this.selectedDuration === 1) return 0;
      const basePrice = 250000 * this.selectedDuration;
      return Math.round(((basePrice - this.currentPrice) / basePrice) * 100);
    }
  },
  
  methods: {
    formatPrice(price) {
      return price.toLocaleString('en-US');
    },
    
    handleSubscribe() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        window.dispatchEvent(new CustomEvent("open-Login-modal"));
      } else {
        // Pass duration instead of plan name
        this.$router.push(`/pay/pro?duration=${this.selectedDuration}`);
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

/* Pro Plan Wrapper */
.pro-plan-wrapper {
  max-width: 480px;
  margin: 0 auto;
}

/* Plan Card */
.plan-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  padding: 40px 32px;
  position: relative;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.plan-card.pro {
  border: 2px solid rgba(255, 255, 255, 0.2);
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
  margin-bottom: 28px;
  text-align: center;
}

.plan-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: inherit;
}

.plan-description {
  font-size: 15px;
  margin: 0;
  opacity: 0.9;
}

/* Duration Selector */
.duration-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(0, 0, 0, 0.15);
  padding: 6px;
  border-radius: 12px;
}

.duration-btn {
  flex: 1;
  padding: 12px 8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  position: relative;
}

.duration-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.duration-btn.active {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.duration-period {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.duration-savings {
  font-size: 10px;
  font-weight: 600;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Pricing */
.plan-price {
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
  justify-content: center;
}

.amount {
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.currency {
  font-size: 18px;
  font-weight: 600;
  opacity: 0.9;
}

.price-note {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.per-month {
  font-size: 13px;
  opacity: 0.8;
}

.save {
  background: rgba(0, 0, 0, 0.25);
  color: #fbbf24;
  padding: 3px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Features */
.plan-features {
  margin-bottom: 28px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 1.5;
}

.feature .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  color: #ffffff;
}

.feature span {
  opacity: 0.95;
}

/* Button */
.plan-button {
  width: 100%;
  padding: 16px 24px;
  background: #ffffff;
  color: #764ba2;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.plan-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3);
}

.plan-button:active {
  transform: translateY(0);
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

  .plan-card {
    padding: 32px 24px;
  }

  .plan-name {
    font-size: 24px;
  }

  .amount {
    font-size: 38px;
  }

  .duration-selector {
    flex-direction: column;
  }

  .duration-btn {
    padding: 14px 12px;
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