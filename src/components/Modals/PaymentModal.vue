<template>
    <div v-if="visible" class="modal">
      <div class="modal-content">
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
        <button @click="applyPromoCode">🎟 Применить промокод</button>
  
        <div v-if="promoError" class="promo-error">{{ promoError }}</div>
        <div v-if="promoSuccess" class="promo-success">{{ promoSuccess }}</div>
  
        <button @click="goToPaymentPage">💳 Перейти к оплате</button>
        <button @click="$emit('close')">❌ Отмена</button>
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
        }
      },
      goToPaymentPage() {
        if (!this.selectedPlan) {
          this.promoError = 'Выберите тариф перед переходом';
          return;
        }
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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  }
  
  .modal-content {
    background: white;
    padding: 30px;
    border-radius: 14px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  
  .modal-content select,
  .promo-input {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #d1d5db;
    border-radius: 8px;
  }
  
  .promo-error {
    color: #dc2626;
    margin-top: 5px;
  }
  
  .promo-success {
    color: #16a34a;
    margin-top: 5px;
  }
  </style>
  