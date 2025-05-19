<template>
    <div v-if="visible" class="modal">
      <div class="modal-content">
        <button class="close-btn" @click="$emit('close')">✖</button>
        <h3>🔒 Платный курс</h3>
        <p>Выберите тариф для доступа:</p>
  
        <select v-model="selectedPlan">
          <option disabled value="">Выберите тариф...</option>
          <option value="start">Start (260,000 сум)</option>
          <option value="pro">Pro (455,000 сум)</option>
        </select>
  
        <p>Или введите промокод:</p>
        <input
          v-model="promoCodeInput"
          placeholder="acedpromocode2406"
          class="promo-input"
        />
  
        <div class="modal-actions">
          <button class="promo-btn" @click="applyPromoCode">🎟 Применить</button>
          <button class="pay-btn" @click="goToPaymentPage">💳 Оплатить</button>
        </div>
  
        <div v-if="promoError" class="promo-error">{{ promoError }}</div>
        <div v-if="promoSuccess" class="promo-success">{{ promoSuccess }}</div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { auth } from '@/firebase';
  
  export default {
    name: 'PaymentModal',
    props: {
      userId: { type: String, required: true },
      visible: { type: Boolean, default: false },
      requestedTopicId: { type: String, default: '' }
    },
    data() {
      return {
        selectedPlan: '',
        promoCodeInput: '',
        promoError: '',
        promoSuccess: ''
      };
    },
    methods: {
      async applyPromoCode() {
        if (!this.selectedPlan || !this.promoCodeInput) {
          this.promoError = 'Введите тариф и промокод';
          return;
        }
  
        this.$store.commit('setLoading', true);
        try {
          const token = await auth.currentUser.getIdToken();
          const res = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/payments/promo`,
            {
              userId: this.userId,
              plan: this.selectedPlan,
              promoCode: this.promoCodeInput
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
  
          this.$emit('unlocked', res.data.plan);
          this.promoSuccess = res.data.message || '✅ Промокод применён';
          this.promoError = '';
          this.$emit('close');
  
          if (this.requestedTopicId) {
            this.$router.push({ name: 'TopicOverview', params: { id: this.requestedTopicId } });
          }
        } catch (err) {
          console.error('❌ Promo error:', err);
          this.promoError = err.response?.data?.message || 'Ошибка применения промокода';
          this.promoSuccess = '';
        } finally {
          this.$store.commit('setLoading', false);
        }
      },
  
      goToPaymentPage() {
        if (!this.selectedPlan) {
          this.promoError = 'Выберите тариф перед переходом';
          return;
        }
        this.$store.commit('setLoading', true);
        this.$router.push({ name: 'PaymePayment', params: { plan: this.selectedPlan } });
      }
    }
  };
  </script>
  
  <style scoped>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.55);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(3px);
  }
  
  .modal-content {
    background: white;
    padding: 32px 28px;
    border-radius: 20px;
    text-align: center;
    max-width: 400px;
    width: 92%;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    font-family: 'Inter', sans-serif;
    animation: fadeIn 0.3s ease-in-out;
    position: relative;
  }
  
  .close-btn {
    position: absolute;
    top: 16px;
    right: 18px;
    font-size: 1.2rem;
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.2s ease;
  }
  
  .close-btn:hover {
    color: #4b5563;
  }
  
  .modal-content h3 {
    font-size: 1.4rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 16px;
  }
  
  .modal-content p {
    font-weight: 600;
    margin: 14px 0 6px;
    color: #374151;
    text-align: left;
    font-size: 0.95rem;
  }
  
  .modal-content select,
  .promo-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    font-size: 1rem;
    background: #f9fafb;
    margin-bottom: 10px;
    transition: border 0.2s ease;
  }
  
  .modal-content select:focus,
  .promo-input:focus {
    border-color: #7c3aed;
    outline: none;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
  }
  
  .modal-actions {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
  }
  
  .promo-btn,
  .pay-btn {
    flex: 1 1 45%;
    padding: 12px 14px;
    font-size: 0.9rem;
    font-weight: 700;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .promo-btn {
    background: linear-gradient(to right, #10b981, #059669);
    color: white;
  }
  
  .pay-btn {
    background: linear-gradient(to right, #6366f1, #8b5cf6);
    color: white;
  }
  
  .promo-btn:hover,
  .pay-btn:hover {
    transform: translateY(-2px);
  }
  
  .promo-error {
    color: #dc2626;
    font-size: 0.9rem;
    margin-top: 10px;
  }
  
  .promo-success {
    color: #16a34a;
    font-size: 0.9rem;
    margin-top: 10px;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  </style>
  