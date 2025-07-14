<template>
  <div class="settings-page">
    <!-- User Profile Settings -->
    <div class="settings-content">
      <h2 class="section-title">⚙️ Настройки профиля</h2>

      <label>Имя</label>
      <input 
        type="text" 
        v-model="user.name" 
        placeholder="Введите имя"
        :disabled="loading" 
      />

      <label>Фамилия</label>
      <input 
        type="text" 
        v-model="user.surname" 
        placeholder="Введите фамилию"
        :disabled="loading" 
      />

      <label>Email</label>
      <input 
        type="email" 
        v-model="user.email" 
        placeholder="Введите email"
        :disabled="loading" 
      />

      <div v-if="!isGoogleUser">
        <label>Текущий пароль</label>
        <input 
          type="password" 
          v-model="oldPassword" 
          placeholder="Введите текущий пароль"
          :disabled="loading" 
        />

        <label>Новый пароль</label>
        <input 
          type="password" 
          v-model="newPassword" 
          placeholder="Введите новый пароль"
          :disabled="loading" 
        />

        <label>Подтвердите новый пароль</label>
        <input 
          type="password" 
          v-model="confirmPassword" 
          placeholder="Повторите новый пароль"
          :disabled="loading" 
        />
      </div>

      <p class="forgot-password" @click="sendPasswordReset">
        {{ isGoogleUser ? 'Создать пароль' : 'Забыли пароль?' }}
      </p>

      <div class="button-group">
        <button 
          class="save-button" 
          @click="saveChanges"
          :disabled="loading"
        >
          {{ loading ? '⏳ Сохранение...' : 'Сохранить' }}
        </button>
        <button class="back-button" @click="goToProfile">В профиль</button>
      </div>
    </div>

    <!-- Subscription and Payment Settings -->
    <div class="settings-content">
      <h2 class="section-title">💳 Подписка и оплата</h2>

      <!-- Current Plan Display -->
      <div class="current-plan-section">
        <div class="plan-info">
          <h3>Текущий тариф</h3>
          <div class="plan-display">
            <span :class="['plan-badge', currentPlanClass]">
              {{ currentPlanLabel }}
            </span>
            <div class="plan-details">
              <p class="plan-description">{{ currentPlanDescription }}</p>
              <p v-if="subscriptionDetails?.expiryDate" class="plan-expiry">
                Активен до: {{ formatDate(subscriptionDetails.expiryDate) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Options -->
      <div class="payment-options">
        <h3>Варианты оплаты</h3>
        
        <!-- Promo Code Section -->
        <div class="promo-section">
          <h4>🎟️ Промокод</h4>
          <div class="promo-input-group">
            <input 
              type="text" 
              v-model="promoCode" 
              placeholder="acedpromocode2406"
              :disabled="loading"
              @keyup.enter="applyPromo"
            />
            <select v-model="selectedPlan" :disabled="loading">
              <option value="">Выберите тариф...</option>
              <option value="start">Start (260,000 сум)</option>
              <option value="pro">Pro (455,000 сум)</option>
            </select>
          </div>
          <button 
            class="promo-button" 
            @click="applyPromo"
            :disabled="loading || !promoCode.trim() || !selectedPlan"
          >
            {{ loading ? '⏳ Применение...' : 'Применить промокод' }}
          </button>
        </div>

        <!-- Payment Plans -->
        <div class="plans-section">
          <h4>💰 Выберите тариф для оплаты</h4>
          <div class="plans-grid">
            <div 
              class="plan-card" 
              :class="{ active: paymentPlan === 'start', disabled: currentPlan === 'start' || currentPlan === 'pro' }"
              @click="selectPaymentPlan('start')"
            >
              <div class="plan-header">
                <h5>Start</h5>
                <div class="plan-price">260,000 сум</div>
              </div>
              <ul class="plan-features">
                <li>✅ Базовые курсы</li>
                <li>✅ Домашние задания</li>
                <li>✅ Основные тесты</li>
                <li>✅ Прогресс-трекинг</li>
              </ul>
              <div v-if="currentPlan === 'start'" class="plan-status">
                ✅ Активен
              </div>
            </div>
            
            <div 
              class="plan-card recommended" 
              :class="{ active: paymentPlan === 'pro', disabled: currentPlan === 'pro' }"
              @click="selectPaymentPlan('pro')"
            >
              <div class="plan-badge">Рекомендуем</div>
              <div class="plan-header">
                <h5>Pro</h5>
                <div class="plan-price">455,000 сум</div>
              </div>
              <ul class="plan-features">
                <li>✅ Все возможности Start</li>
                <li>✅ Продвинутые курсы</li>
                <li>✅ Персональная аналитика</li>
                <li>✅ Приоритетная поддержка</li>
                <li>✅ Эксклюзивные материалы</li>
              </ul>
              <div v-if="currentPlan === 'pro'" class="plan-status">
                ✅ Активен
              </div>
            </div>
          </div>
          
          <button 
            class="payment-button" 
            @click="goToPayment"
            :disabled="loading || !paymentPlan || (currentPlan !== 'free' && paymentPlan === currentPlan)"
          >
            {{ getPaymentButtonText() }}
          </button>
        </div>

        <!-- Payment History -->
        <div v-if="paymentHistory.length > 0" class="payment-history">
          <h4>📊 История платежей</h4>
          <div class="history-list">
            <div 
              v-for="payment in paymentHistory" 
              :key="payment.id"
              class="payment-item"
            >
              <div class="payment-info">
                <span class="payment-id">{{ payment.id }}</span>
                <span class="payment-amount">{{ formatAmount(payment.amount) }}</span>
              </div>
              <div class="payment-status">
                <span :class="['status-badge', getStatusClass(payment.state)]">
                  {{ payment.stateText }}
                </span>
                <span class="payment-date">{{ formatDate(payment.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="notification" class="notification" :class="notificationClass">
      <span class="notification-icon">{{ notificationIcon }}</span>
      {{ notification }}
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loadingText }}</p>
    </div>
  </div>
</template>

<script>
import { auth, db } from "@/firebase";
import { 
  applyPromoCode, 
  getUserStatus,
  getPaymentAmounts,
  formatPaymentAmount,
  getTransactionStateText,
  handlePaymentError
} from "@/api";
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default {
  name: 'AcedSettings',
  data() {
    return {
      // User profile data
      user: { name: "", surname: "", email: "" },
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      currentUser: null,
      isGoogleUser: false,
      
      // Payment data
      promoCode: "",
      selectedPlan: "",
      paymentPlan: "",
      currentPlan: "free",
      subscriptionDetails: null,
      paymentHistory: [],
      
      // UI state
      loading: false,
      loadingText: "",
      notification: "",
      notificationClass: "",
      notificationIcon: ""
    };
  },
  computed: {
    currentPlanLabel() {
      const labels = {
        pro: 'Pro',
        start: 'Start', 
        premium: 'Premium',
        free: 'Free'
      };
      return labels[this.currentPlan] || 'Free';
    },
    
    currentPlanClass() {
      const classes = {
        pro: 'badge-pro',
        start: 'badge-start',
        premium: 'badge-premium',
        free: 'badge-free'
      };
      return classes[this.currentPlan] || 'badge-free';
    },
    
    currentPlanDescription() {
      const descriptions = {
        pro: 'Полный доступ ко всем курсам и функциям',
        start: 'Доступ к базовым курсам и материалам',
        premium: 'Премиум подписка с эксклюзивным контентом',
        free: 'Бесплатный доступ с ограниченным функционалом'
      };
      return descriptions[this.currentPlan] || 'Бесплатный доступ';
    },
    
    userId() {
      return this.currentUser?.uid || this.$store.getters['user/getUserId'];
    }
  },
  
  async mounted() {
    await this.initializeComponent();
  },
  
  methods: {
    async initializeComponent() {
      this.loading = true;
      this.loadingText = 'Загрузка настроек...';
      
      try {
        await this.checkAuthState();
        await this.loadPaymentHistory();
      } catch (error) {
        console.error('❌ Settings initialization error:', error);
        this.showNotification('Ошибка загрузки настроек', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    checkAuthState() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.currentUser = user;
          if (user) {
            this.isGoogleUser = user.providerData[0]?.providerId === "google.com";
            await this.fetchUserData();
            await this.fetchSubscriptionStatus();
          }
          resolve();
        });
      });
    },
    
    async fetchUserData() {
      try {
        if (!this.currentUser) return;
        
        const userRef = doc(db, "users", this.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          this.user = userDoc.data();
        } else {
          const newUserData = {
            name: "Новый пользователь",
            surname: "",
            email: this.currentUser.email,
          };
          await setDoc(userRef, newUserData);
          this.user = newUserData;
        }
      } catch (error) {
        console.error('❌ User data fetch error:', error);
        this.showNotification("Ошибка загрузки данных пользователя", 'error');
      }
    },
    
    async fetchSubscriptionStatus() {
      try {
        if (!this.currentUser) return;
        
        const result = await getUserStatus(this.currentUser.uid);
        
        if (result.data) {
          this.currentPlan = result.data.status || result.data.subscriptionPlan || 'free';
          this.subscriptionDetails = result.data.subscriptionDetails || null;
        } else {
          this.currentPlan = 'free';
        }
        
        
      } catch (err) {
        console.warn('⚠️ Failed to fetch subscription status:', err);
        this.currentPlan = 'free';
      }
    },
    
    async loadPaymentHistory() {
      try {
        // Get payment history from store
        const history = this.$store.getters['user/paymentHistory'] || [];
        this.paymentHistory = history.slice(0, 5); // Show last 5 payments
      } catch (error) {
        console.warn('⚠️ Failed to load payment history:', error);
      }
    },
    
    async saveChanges() {
      if (!this.currentUser) {
        return this.showNotification("Пользователь не авторизован", 'error');
      }
      
      this.loading = true;
      this.loadingText = 'Сохранение изменений...';
      
      try {
        // Update Firestore
        const userRef = doc(db, "users", this.currentUser.uid);
        await updateDoc(userRef, { 
          name: this.user.name, 
          surname: this.user.surname 
        });
        
        // Update email if changed
        if (this.user.email !== this.currentUser.email) {
          if (this.isGoogleUser) {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            await updateEmail(this.currentUser, this.user.email);
          } else {
            if (!this.oldPassword) {
              return this.showNotification("Введите текущий пароль для изменения email", 'error');
            }
            const credential = EmailAuthProvider.credential(this.currentUser.email, this.oldPassword);
            await reauthenticateWithCredential(this.currentUser, credential);
            await updateEmail(this.currentUser, this.user.email);
          }
        }
        
        // Update password if provided
        if (this.newPassword) {
          if (this.isGoogleUser) {
            return this.showNotification("Вы вошли через Google. Пароль изменить нельзя", 'error');
          }
          if (this.newPassword !== this.confirmPassword) {
            return this.showNotification("Пароли не совпадают", 'error');
          }
          const credential = EmailAuthProvider.credential(this.currentUser.email, this.oldPassword);
          await reauthenticateWithCredential(this.currentUser, credential);
          await updatePassword(this.currentUser, this.newPassword);
        }
        
        // Update store
        await this.$store.dispatch('user/updateProfile', {
          name: this.user.name,
          surname: this.user.surname,
          email: this.user.email
        });
        
        this.showNotification("Изменения успешно сохранены!", 'success');
        
        // Clear password fields
        this.oldPassword = "";
        this.newPassword = "";
        this.confirmPassword = "";
        
      } catch (error) {
        console.error("❌ Save changes error:", error);
        this.showNotification(`Ошибка: ${error.message}`, 'error');
      } finally {
        this.loading = false;
      }
    },
    
    async applyPromo() {
      if (!this.promoCode.trim() || !this.selectedPlan) {
        return this.showNotification("Введите промокод и выберите тариф", 'error');
      }
      
      if (!this.userId) {
        return this.showNotification("Ошибка авторизации", 'error');
      }
      
      this.loading = true;
      this.loadingText = 'Применение промокода...';
      
      try {
     
        
        const result = await applyPromoCode(
          this.userId,
          this.selectedPlan,
          this.promoCode.trim()
        );
        
        if (result.success) {
          this.showNotification(result.message || "✅ Промокод успешно применён!", 'success');
          
          // Update current plan
          this.currentPlan = this.selectedPlan;
          
          // Update store
          await this.$store.dispatch('user/loadUserStatus');
          
          // Clear form
          this.promoCode = "";
          this.selectedPlan = "";
          
        } else {
          this.showNotification(result.error || "❌ Не удалось применить промокод", 'error');
        }
        
      } catch (error) {
        console.error("❌ Promo code error:", error);
        this.showNotification(handlePaymentError(error, 'Применение промокода'), 'error');
      } finally {
        this.loading = false;
      }
    },
    
    selectPaymentPlan(plan) {
      // Don't allow selecting current plan or downgrade
      if (this.currentPlan === plan || 
          (this.currentPlan === 'pro' && plan === 'start')) {
        return;
      }
      
      this.paymentPlan = plan;
    },
    
    async goToPayment() {
      if (!this.paymentPlan) {
        return this.showNotification("Выберите тариф для оплаты", 'error');
      }
      
      if (!this.userId) {
        return this.showNotification("Ошибка авторизации", 'error');
      }
      
      try {
          
        
        // Navigate to payment page
        await this.$router.push({ 
          name: 'PaymePayment', 
          params: { plan: this.paymentPlan },
          query: { 
            userId: this.userId,
            returnTo: this.$route.query.returnTo || 'settings'
          }
        });
        
      } catch (error) {
        console.error('❌ Payment navigation error:', error);
        this.showNotification('Ошибка при переходе к оплате', 'error');
      }
    },
    
    getPaymentButtonText() {
      if (!this.paymentPlan) {
        return 'Выберите тариф';
      }
      
      if (this.loading) {
        return '⏳ Обработка...';
      }
      
      if (this.currentPlan === this.paymentPlan) {
        return '✅ Уже активен';
      }
      
      const amounts = getPaymentAmounts();
      const planData = amounts[this.paymentPlan];
      
      if (planData) {
        return `💳 Оплатить ${planData.label} (${formatPaymentAmount(planData.uzs, 'UZS')})`;
      }
      
      return 'Перейти к оплате';
    },
    
    async sendPasswordReset() {
      try {
        if (!this.currentUser) {
          return this.showNotification("Ошибка: Пользователь не авторизован", 'error');
        }
        
        await sendPasswordResetEmail(auth, this.currentUser.email);
        this.showNotification("Ссылка для создания пароля отправлена на ваш email", 'success');
        
      } catch (error) {
        console.error("❌ Password reset error:", error);
        this.showNotification(`Ошибка: ${error.message}`, 'error');
      }
    },
    
    // Utility methods
    formatAmount(amount) {
      return formatPaymentAmount(amount / 100, 'UZS');
    },
    
    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    getStatusClass(state) {
      const stateInfo = getTransactionStateText(state);
      return `status-${stateInfo.color}`;
    },
    
    showNotification(message, type = 'info') {
      this.notification = message;
      this.notificationClass = `notification-${type}`;
      
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      this.notificationIcon = icons[type] || 'ℹ️';
      
      setTimeout(() => {
        this.notification = "";
        this.notificationClass = "";
        this.notificationIcon = "";
      }, 5000);
    },
    
    // Navigation methods
    goBack() {
      this.$router.push("/");
    },
    
    goToProfile() {
      this.$router.push("/profile/main");
    }
  }
};
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(20px, 5vw, 40px) clamp(15px, 4vw, 20px);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #1f2937;
  min-height: 100vh;
  gap: clamp(25px, 5vw, 40px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.section-title {
  font-size: clamp(1.4rem, 4vw, 1.75rem);
  font-weight: 800;
  margin-bottom: clamp(20px, 4vw, 24px);
  text-align: center;
  color: #4c1d95;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.settings-content {
  width: 100%;
  max-width: clamp(350px, 90vw, 600px);
  background: #ffffff;
  padding: clamp(25px, 5vw, 40px);
  border-radius: clamp(16px, 3vw, 24px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.settings-content:hover {
  box-shadow: 0 20px 60px rgba(124, 58, 237, 0.15);
  transform: translateY(-2px);
}

/* Form Elements */
label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: clamp(6px, 1.5vw, 8px);
  font-size: clamp(0.9rem, 2.2vw, 0.95rem);
}

input, select {
  width: 100%;
  padding: clamp(12px, 3vw, 14px) clamp(14px, 3.5vw, 16px);
  margin-bottom: clamp(16px, 3.5vw, 20px);
  border: 2px solid #e5e7eb;
  border-radius: clamp(10px, 2.5vw, 12px);
  background: #f9fafb;
  color: #1f2937;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  transition: all 0.3s ease;
  font-family: inherit;
  box-sizing: border-box;
}

input:focus, select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
  background: #ffffff;
}

input:disabled, select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f3f4f6;
}

/* Current Plan Section */
.current-plan-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: clamp(20px, 4vw, 24px);
  border-radius: clamp(12px, 3vw, 16px);
  margin-bottom: clamp(24px, 5vw, 32px);
}

.plan-info h3 {
  font-size: clamp(1.1rem, 2.8vw, 1.2rem);
  font-weight: 700;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.plan-display {
  display: flex;
  align-items: center;
  gap: clamp(12px, 3vw, 16px);
  flex-wrap: wrap;
}

.plan-badge {
  padding: clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px);
  border-radius: 20px;
  font-weight: 700;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.badge-free {
  background-color: #ef4444;
  color: white;
}

.badge-start {
  background-color: #f59e0b;
  color: white;
}

.badge-pro {
  background-color: #10b981;
  color: white;
}

.badge-premium {
  background-color: #8b5cf6;
  color: white;
}

.plan-details {
  flex: 1;
  min-width: 200px;
}

.plan-description {
  margin: 0 0 clamp(6px, 1.5vw, 8px) 0;
  font-size: clamp(0.9rem, 2.2vw, 0.95rem);
  opacity: 0.9;
}

.plan-expiry {
  margin: 0;
  font-size: clamp(0.8rem, 2vw, 0.85rem);
  opacity: 0.8;
}

/* Payment Options */
.payment-options h3 {
  font-size: clamp(1.2rem, 3vw, 1.3rem);
  font-weight: 700;
  color: #1f2937;
  margin-bottom: clamp(20px, 4vw, 24px);
}

.promo-section,
.plans-section {
  margin-bottom: clamp(24px, 5vw, 32px);
  padding: clamp(20px, 4vw, 24px);
  background: #f8fafc;
  border-radius: clamp(12px, 3vw, 16px);
  border: 1px solid #e2e8f0;
}

.promo-section h4,
.plans-section h4 {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  font-weight: 600;
  color: #374151;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.promo-input-group {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2.5vw, 12px);
  margin-bottom: clamp(12px, 3vw, 16px);
}

/* Plans Grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(15px, 3vw, 20px);
  margin-bottom: clamp(20px, 4vw, 24px);
}

.plan-card {
  border: 2px solid #e5e7eb;
  border-radius: clamp(12px, 3vw, 16px);
  padding: clamp(20px, 4vw, 24px);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.plan-card:hover:not(.disabled) {
  border-color: #7c3aed;
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
}

.plan-card.active {
  border-color: #7c3aed;
  background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.2);
}

.plan-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f9fafb;
}

.plan-card.recommended {
  border-color: #10b981;
}

.plan-card.recommended.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
}

.plan-card .plan-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: clamp(0.7rem, 1.8vw, 0.75rem);
  font-weight: 600;
}

.plan-header h5 {
  font-size: clamp(1.1rem, 2.8vw, 1.25rem);
  font-weight: 700;
  color: #1f2937;
  margin-bottom: clamp(6px, 1.5vw, 8px);
}

.plan-price {
  font-size: clamp(1.2rem, 3vw, 1.4rem);
  font-weight: 800;
  color: #7c3aed;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  padding: clamp(3px, 1vw, 4px) 0;
  font-size: clamp(0.85rem, 2.1vw, 0.9rem);
  color: #4b5563;
}

.plan-status {
  margin-top: clamp(12px, 3vw, 16px);
  padding: clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px);
  background: #d1fae5;
  color: #065f46;
  border-radius: clamp(6px, 1.5vw, 8px);
  text-align: center;
  font-weight: 600;
  font-size: clamp(0.85rem, 2.1vw, 0.9rem);
}

/* Buttons */
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(12px, 3vw, 16px);
  justify-content: space-between;
  margin-top: clamp(24px, 5vw, 32px);
}

.save-button,
.back-button,
.promo-button,
.payment-button {
  flex: 1 1 clamp(120px, 45%, 200px);
  padding: clamp(12px, 3vw, 14px) clamp(20px, 4vw, 24px);
  border: none;
  border-radius: clamp(10px, 2.5vw, 12px);
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1.5vw, 8px);
  white-space: nowrap;
  min-height: clamp(44px, 10vw, 48px);
}

.save-button {
  background: linear-gradient(135deg, #9333ea, #a855f7);
  color: white;
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #7e22ce, #9333ea);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(147, 51, 234, 0.3);
}

.back-button {
  background: #f3f4f6;
  color: #4c1d95;
  border: 2px solid #e5e7eb;
}

.back-button:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
  border-color: #d1d5db;
}

.promo-button {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  width: 100%;
  margin-top: clamp(6px, 1.5vw, 8px);
}

.promo-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.payment-button {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  width: 100%;
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  padding: clamp(14px, 3.5vw, 16px) clamp(20px, 4vw, 24px);
}

.payment-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

.save-button:disabled,
.promo-button:disabled,
.payment-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Payment History */
.payment-history {
  background: #f8fafc;
  padding: clamp(20px, 4vw, 24px);
  border-radius: clamp(12px, 3vw, 16px);
  border: 1px solid #e2e8f0;
}

.payment-history h4 {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  font-weight: 600;
  color: #374151;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2.5vw, 12px);
}

.payment-item {
  background: white;
  padding: clamp(12px, 3vw, 16px);
  border-radius: clamp(10px, 2.5vw, 12px);
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(8px, 2vw, 10px);
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: clamp(3px, 1vw, 4px);
}

.payment-id {
  font-family: monospace;
  font-size: clamp(0.8rem, 2vw, 0.85rem);
  color: #6b7280;
}

.payment-amount {
  font-weight: 600;
  color: #1f2937;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
}

.payment-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: clamp(3px, 1vw, 4px);
}

.status-badge {
  padding: clamp(3px, 1vw, 4px) clamp(10px, 2.5vw, 12px);
  border-radius: 20px;
  font-size: clamp(0.75rem, 1.8vw, 0.8rem);
  font-weight: 600;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.payment-date {
  font-size: clamp(0.75rem, 1.8vw, 0.8rem);
  color: #6b7280;
}

/* Forgot Password */
.forgot-password {
  color: #7c3aed;
  cursor: pointer;
  text-align: right;
  font-size: clamp(0.85rem, 2.1vw, 0.9rem);
  margin-bottom: clamp(12px, 3vw, 16px);
  transition: color 0.2s ease;
}

.forgot-password:hover {
  text-decoration: underline;
  color: #6d28d9;
}

/* Notification */
.notification {
  position: fixed;
  bottom: clamp(20px, 5vw, 30px);
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: clamp(12px, 3vw, 16px) clamp(20px, 4vw, 24px);
  border-radius: clamp(10px, 2.5vw, 12px);
  font-size: clamp(0.9rem, 2.2vw, 0.95rem);
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.4s ease-out;
  z-index: 1000;
  max-width: 90%;
  display: flex;
  align-items: center;
  gap: clamp(10px, 2.5vw, 12px);
}

.notification-success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.notification-error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.notification-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.notification-icon {
  font-size: clamp(1.1rem, 2.8vw, 1.2rem);
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.spinner {
  width: clamp(40px, 10vw, 50px);
  height: clamp(40px, 10vw, 50px);
  border: 4px solid #e5e7eb;
  border-left: 4px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: clamp(15px, 4vw, 20px);
}

.loading-overlay p {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  font-weight: 600;
  color: #374151;
}

/* Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .settings-page {
    padding: 20px 15px;
    gap: 25px;
  }
  
  .settings-content {
    padding: 20px;
  }
  
  .section-title {
    font-size: 1.4rem;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .promo-input-group {
    gap: 8px;
  }
  
  .button-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .save-button,
  .back-button {
    flex: 1 1 auto;
    width: 100%;
  }
  
  .plan-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .payment-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .payment-status {
    align-items: flex-start;
  }
  
  .notification {
    margin: 0 20px;
    bottom: 20px;
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .settings-content {
    padding: 16px;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
  
  .plan-card {
    padding: 16px;
  }
  
  .plan-price {
    font-size: 1.2rem;
  }
  
  .promo-input-group {
    flex-direction: column;
  }
  
  .promo-input-group input,
  .promo-input-group select {
    margin-bottom: 8px;
  }
}

/* Extra small mobile */
@media (max-width: 320px) {
  .settings-page {
    padding: 10px 8px;
  }
  
  .settings-content {
    padding: 12px;
  }
  
  input, select {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
  
  .save-button,
  .back-button,
  .promo-button,
  .payment-button {
    padding: 10px 14px;
    font-size: 0.9rem;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .plan-card:hover {
    transform: none;
    box-shadow: none;
  }
  
  .plan-card:active {
    transform: scale(0.98);
  }
  
  .save-button:hover,
  .back-button:hover,
  .promo-button:hover,
  .payment-button:hover {
    transform: none;
  }
  
  .save-button:active,
  .back-button:active,
  .promo-button:active,
  .payment-button:active {
    transform: scale(0.98);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .settings-content,
  .plan-card,
  .save-button,
  .back-button,
  .promo-button,
  .payment-button {
    transition: none;
  }
  
  .settings-content:hover,
  .plan-card:hover,
  .save-button:hover,
  .back-button:hover,
  .promo-button:hover,
  .payment-button:hover {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .settings-page {
    background: #fff;
  }
  
  .settings-content,
  .plan-card,
  .promo-section,
  .plans-section,
  .payment-history {
    border: 2px solid #000;
  }
}
</style>