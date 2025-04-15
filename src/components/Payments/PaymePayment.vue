<template>
  <div class="payme-payment">
    <div class="payment-box">
      <!-- ✅ Show success screen -->
      <template v-if="success">
        <img src="@/assets/icons/success.png" alt="Успешно" class="success-icon" />
        <h2>Платёж успешно завершен!</h2>
        <p>Спасибо за покупку тарифа <strong>{{ planLabel }}</strong>.</p>
      </template>

      <!-- 💳 Show payment form -->
      <template v-else>
        <h2>Оплата тарифа: <span>{{ planLabel }}</span></h2>
        <p class="amount">Сумма к оплате: <strong>{{ formattedAmount }} сум</strong></p>

        <form @submit.prevent="initiatePayment">
          <input
            type="text"
            v-model="form.phone"
            placeholder="Номер телефона (например, +998901234567)"
            required
          />
          <button type="submit" class="pay-button" :disabled="loading">
            {{ loading ? 'Обработка...' : 'Оплатить через Payme' }}
          </button>
        </form>

        <p v-if="error" class="error-text">❌ {{ error }}</p>
      </template>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: ["plan"],
  data() {
    return {
      form: { phone: "" },
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
  mounted() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      this.success = true;
    }
  },
  methods: {
    async initiatePayment() {
      this.loading = true;
      this.error = "";

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || process.env.VUE_APP_API_URL}/payments/payme`,
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
        this.error = "Не удалось инициализировать оплату.";
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
  max-width: 420px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  font-family: 'Unbounded', sans-serif;
  text-align: center;
  animation: fadeIn 0.5s ease;
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

.success-icon {
  width: 100px;
  margin-bottom: 20px;
}

.error-text {
  margin-top: 16px;
  color: #dc2626;
  font-weight: 600;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
