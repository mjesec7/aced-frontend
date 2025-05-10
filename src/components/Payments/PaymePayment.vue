<template>
  <div class="payme-payment">
    <div class="payment-box">
      <h2>Оплата тарифа: <span>{{ planLabel }}</span></h2>
      <p class="amount">Сумма к оплате: <strong>{{ formattedAmount }} сум</strong></p>

      <form @submit.prevent="initiatePayment">
        <input
          type="text"
          v-model="form.name"
          placeholder="Ваше имя (как при регистрации)"
          required
        />

        <input
          type="text"
          v-model="form.phone"
          placeholder="Номер телефона (например, +998901234567)"
          required
        />

        <input
          type="text"
          v-model="form.userId"
          placeholder="Ваш ID пользователя"
          required
        />

        <input
          type="text"
          v-model="form.promocode"
          placeholder="Промокод (если есть)"
        />

        <button type="submit" class="pay-button" :disabled="loading">
          {{ loading ? 'Обработка...' : 'Оплатить через Payme' }}
        </button>
      </form>

      <p v-if="error" class="error-text">❌ {{ error }}</p>
      <p v-if="success" class="success-text">🎉 Промокод активирован! Вам открыт доступ к PRO-курсам.</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: ["plan"],
  data() {
    return {
      form: {
        name: "",
        phone: "",
        userId: "",
        promocode: "",
      },
      loading: false,
      error: "",
      success: false,
    };
  },
  computed: {
  amount() {
    return this.plan === "pro" ? 455000 : 260000;
  },
  planLabel() {
    return this.plan === "pro" ? "PRO" : "STARTER";
  },
  formattedAmount() {
    return this.amount.toLocaleString("ru-RU");
  },
  apiUrl() {
    return import.meta.env.VITE_API_BASE_URL;
  },
},

  methods: {
    async initiatePayment() {
      this.loading = true;
      this.error = "";
      this.success = false;

      const payload = {
        name: this.form.name.trim(),
        phone: this.form.phone.trim(),
        userId: this.form.userId.trim(),
        plan: this.plan,
        promocode: this.form.promocode.trim()
      };

      if (!payload.name || !payload.phone || !payload.userId) {
        this.error = "Пожалуйста, заполните все обязательные поля.";
        this.loading = false;
        return;
      }

      try {
        // ✅ 1. Promo First
        if (payload.promocode) {
          const promoRes = await axios.post(`${this.apiUrl}/payments/promo`, payload);
          if (promoRes.data?.unlocked) {
            this.success = true;
            return;
          }
        }

        // ✅ 2. Payment
        const response = await axios.post(`${this.apiUrl}/payments/payme`, {
          amount: this.amount,
          phone: payload.phone,
          plan: payload.plan,
          userId: payload.userId,
          name: payload.name
        });

        if (response.data?.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        } else {
          this.error = "Ошибка при получении ссылки на оплату.";
        }
      } catch (err) {
        console.error("❌ Payment Error:", err.response?.data || err.message);
        this.error = err.response?.data?.error || "Ошибка обработки платежа.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.payme-payment {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #f8fafc, #f3e8ff);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.payment-box {
  background: white;
  padding: 40px;
  border-radius: 20px;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  font-family: 'Unbounded', sans-serif;
  text-align: center;
}

.payment-box h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.amount {
  margin-bottom: 24px;
  font-size: 18px;
  color: #4b5563;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

input {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  font-size: 15px;
  font-family: inherit;
  transition: border 0.2s ease;
}

input:focus {
  border-color: #9333ea;
  outline: none;
}

.pay-button {
  background-color: #9333ea;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s ease;
}

.pay-button:hover {
  background-color: #7e22ce;
}

.error-text {
  margin-top: 20px;
  color: #dc2626;
  font-weight: 600;
}

.success-text {
  margin-top: 20px;
  color: #16a34a;
  font-weight: 600;
}
</style>
