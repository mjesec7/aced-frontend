<template>
  <div class="payme-payment">
    <div class="payment-box">
      <h2>Оплата тарифа: <span>{{ planLabel }}</span></h2>
      <p class="amount">Сумма к оплате: <strong>{{ formattedAmount }} сум</strong></p>

      <form @submit.prevent="initiatePayment">
        <input
          type="text"
          v-model="form.phone"
          placeholder="Номер телефона (например, +998901234567)"
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
        phone: "",
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
  },
  methods: {
    async initiatePayment() {
      this.loading = true;
      this.error = "";
      this.success = false;

      try {
        // ✅ 1. Check Promo First
        if (this.form.promocode.trim()) {
          const promoRes = await axios.post(
            `${process.env.VUE_APP_API_URL}/payments/promo`,
            {
              code: this.form.promocode.trim(),
              phone: this.form.phone,
              plan: this.plan,
            }
          );

          if (promoRes.data?.unlocked) {
            this.success = true;
            return;
          }
        }

        // ✅ 2. Fallback to Payme flow
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}/payments/payme`,
          {
            amount: this.amount,
            phone: this.form.phone,
            plan: this.plan,
          }
        );

        if (response.data?.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        } else {
          this.error = "Ошибка при получении ссылки на оплату.";
        }
      } catch (err) {
        console.error("❌ Payment Error:", err.response?.data || err.message);
        this.error = err.response?.data?.error || "Не удалось инициализировать оплату.";
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
  background: linear-gradient(to bottom, #f3f4f6, #fff);
  display: flex;
  justify-content: center;
  align-items: center;
}

.payment-box {
  background: white;
  padding: 40px;
  border-radius: 16px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  font-family: 'Unbounded', sans-serif;
  text-align: center;
}

.payment-box h2 {
  margin-bottom: 20px;
  font-size: 22px;
  color: #333;
}

.amount {
  margin-bottom: 20px;
  font-size: 18px;
  color: #555;
}

form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

input {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-family: inherit;
  font-size: 15px;
}

.pay-button {
  background-color: #9333ea;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
}

.pay-button:hover {
  background-color: #6b21a8;
}

.error-text {
  margin-top: 16px;
  color: #dc2626;
  font-weight: 600;
}

.success-text {
  margin-top: 16px;
  color: #16a34a;
  font-weight: 600;
}
</style>