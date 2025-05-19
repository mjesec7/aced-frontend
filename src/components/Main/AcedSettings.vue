<template>
  <div class="settings-page">
    <div class="settings-content">
      <h2 class="section-title">Настройки профиля</h2>

      <label>Имя</label>
      <input type="text" v-model="user.name" placeholder="Введите имя" />

      <label>Фамилия</label>
      <input type="text" v-model="user.surname" placeholder="Введите фамилию" />

      <label>Email</label>
      <input type="email" v-model="user.email" placeholder="Введите email" />

      <div v-if="!isGoogleUser">
        <label>Текущий пароль</label>
        <input type="password" v-model="oldPassword" placeholder="Введите текущий пароль" />

        <label>Новый пароль</label>
        <input type="password" v-model="newPassword" placeholder="Введите новый пароль" />

        <label>Подтвердите новый пароль</label>
        <input type="password" v-model="confirmPassword" placeholder="Повторите новый пароль" />
      </div>

      <p class="forgot-password" @click="sendPasswordReset">Забыли пароль?</p>
      <p v-if="isGoogleUser" class="forgot-password" @click="sendPasswordReset">Создать пароль</p>

      <div class="button-group">
        <button class="save-button" @click="saveChanges">Сохранить</button>
        <button class="back-button" @click="goToProfile">В профиль</button>
      </div>
    </div>

    <div class="settings-content">
      <h2 class="section-title">💳 Подписка и оплата</h2>

      <label>Промокод</label>
      <input type="text" v-model="promoCode" placeholder="acedpromocode2406" />

      <label>Выберите тариф</label>
      <select v-model="selectedPlan">
        <option value="">Выберите...</option>
        <option value="start">Start</option>
        <option value="pro">Pro</option>
      </select>

      <p class="current-plan">
        Текущий тариф: <span :class="['plan-badge', currentPlanClass]">{{ currentPlanLabel }}</span>
      </p>

      <button class="promo-button" @click="applyPromo">Применить промокод</button>
      <button class="payment-button" @click="goToPayment">Перейти к оплате</button>
    </div>

    <div v-if="notification" class="notification">{{ notification }}</div>
  </div>
</template>

<script>
import { auth, db } from "@/firebase";
import axios from "axios";
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
  data() {
    return {
      user: { name: "", surname: "", email: "" },
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      currentUser: null,
      isGoogleUser: false,
      notification: "",
      promoCode: "",
      selectedPlan: "",
      currentPlan: "free"
    };
  },
  computed: {
    currentPlanLabel() {
      if (this.currentPlan === 'pro') return 'Pro';
      if (this.currentPlan === 'start') return 'Start';
      return 'Free';
    },
    currentPlanClass() {
      return {
        pro: 'badge-pro',
        start: 'badge-start',
        free: 'badge-free'
      }[this.currentPlan] || 'badge-free';
    }
  },
  mounted() {
    this.checkAuthState();
  },
  methods: {
    checkAuthState() {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        if (user) {
          this.isGoogleUser = user.providerData[0]?.providerId === "google.com";
          await this.fetchUserData();
          await this.fetchSubscriptionStatus();
        }
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
          await setDoc(userRef, {
            name: "Новый пользователь",
            surname: "",
            email: this.currentUser.email,
          });
          this.user = { name: "Новый пользователь", surname: "", email: this.currentUser.email };
        }
      } catch (error) {
        this.showNotification("Ошибка загрузки данных: " + error.message);
      }
    },
    async fetchSubscriptionStatus() {
      try {
        const token = await this.currentUser.getIdToken();
        const res = await axios.get(`/api/users/${this.currentUser.uid}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.currentPlan = res.data?.status || 'free';
      } catch (err) {
        console.warn('⚠️ Не удалось получить текущий тариф:', err);
        this.currentPlan = 'free';
      }
    },
    async saveChanges() {
      if (!this.currentUser) return this.showNotification("Пользователь не авторизован.");
      try {
        const userRef = doc(db, "users", this.currentUser.uid);
        await updateDoc(userRef, { name: this.user.name, surname: this.user.surname });
        if (this.user.email !== this.currentUser.email) {
          if (this.isGoogleUser) {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            await updateEmail(this.currentUser, this.user.email);
          } else {
            if (!this.oldPassword) return this.showNotification("Введите текущий пароль для изменения email.");
            const credential = EmailAuthProvider.credential(this.currentUser.email, this.oldPassword);
            await reauthenticateWithCredential(this.currentUser, credential);
            await updateEmail(this.currentUser, this.user.email);
          }
        }
        if (this.newPassword) {
          if (this.isGoogleUser) return this.showNotification("Вы вошли через Google. Пароль изменить нельзя.");
          if (this.newPassword !== this.confirmPassword)
            return this.showNotification("Пароли не совпадают.");
          const credential = EmailAuthProvider.credential(this.currentUser.email, this.oldPassword);
          await reauthenticateWithCredential(this.currentUser, credential);
          await updatePassword(this.currentUser, this.newPassword);
        }
        this.showNotification("Изменения сохранены!");
      } catch (error) {
        console.error("🚨 Ошибка:", error);
        this.showNotification("Ошибка: " + error.message);
      }
    },
    async applyPromo() {
      if (!this.promoCode || !this.selectedPlan) return this.showNotification("Введите промокод и выберите тариф.");
      try {
        const res = await axios.post("/api/payments/promo", {
          userId: this.currentUser.uid,
          plan: this.selectedPlan,
          promoCode: this.promoCode
        });
        this.showNotification(res.data.message || "✅ Промокод применён!");
        this.currentPlan = this.selectedPlan;
      } catch (err) {
        console.error("Promo error:", err);
        this.showNotification(err.response?.data?.message || "❌ Не удалось применить промокод");
      }
    },
    async sendPasswordReset() {
      try {
        if (!this.currentUser) return this.showNotification("Ошибка: Пользователь не авторизован.");
        await sendPasswordResetEmail(auth, this.currentUser.email);
        this.showNotification("Ссылка для создания пароля отправлена на ваш email.");
      } catch (error) {
        console.error("Ошибка отправки email:", error);
        this.showNotification("Ошибка: " + error.message);
      }
    },
    goToPayment() {
      alert("🧾 Платёжная система ещё не подключена. Пожалуйста, попробуйте позже.");
    },
    showNotification(message) {
      this.notification = message;
      setTimeout(() => (this.notification = ""), 5000);
    },
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
  padding: 50px 20px;
  background: linear-gradient(to bottom right, #f8fafc, #ffffff);
  color: #1f2937;
  min-height: 100vh;
  gap: 50px;
  font-family: 'Inter', sans-serif;
}

.section-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 20px;
  text-align: center;
  color: #4c1d95;
}

.settings-content {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  padding: 36px;
  border-radius: 20px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
}

.settings-content:hover {
  box-shadow: 0 12px 40px rgba(124, 58, 237, 0.15);
}

input, select {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  margin-bottom: 20px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
  color: #1f2937;
  font-size: 1rem;
  transition: border 0.3s, box-shadow 0.3s;
}

input:focus, select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: space-between;
  margin-top: 30px;
}

.save-button,
.back-button,
.promo-button,
.payment-button {
  flex: 1 1 45%;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.save-button {
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  color: white;
}

.save-button:hover {
  background: linear-gradient(to right, #6d28d9, #7c3aed);
  transform: translateY(-2px);
}

.back-button {
  background: #f3f4f6;
  color: #4c1d95;
}

.back-button:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.promo-button {
  background: linear-gradient(to right, #10b981, #34d399);
  color: white;
}

.promo-button:hover {
  background: linear-gradient(to right, #059669, #10b981);
  transform: translateY(-2px);
}

.payment-button {
  background: linear-gradient(to right, #60a5fa, #818cf8);
  color: white;
}

.payment-button:hover {
  background: linear-gradient(to right, #3b82f6, #6366f1);
  transform: translateY(-2px);
}

.forgot-password {
  color: #7c3aed;
  cursor: pointer;
  text-align: right;
  font-size: 14px;
  margin-bottom: 12px;
}

.forgot-password:hover {
  text-decoration: underline;
}

.notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 0.95rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.current-plan {
  margin-top: 12px;
  font-size: 1rem;
  margin-bottom: 12px;
  color: #334155;
}

.plan-badge {
  padding: 6px 16px;
  border-radius: 16px;
  font-weight: bold;
  margin-left: 10px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.badge-free {
  background-color: #ef4444;
  color: white;
}

.badge-start {
  background-color: #facc15;
  color: black;
}

.badge-pro {
  background-color: #10b981;
  color: white;
}
</style>
