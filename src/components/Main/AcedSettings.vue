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

      <!-- 🔒 PROMO FEATURE -->
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
  padding: 40px;
  background-color: #121212;
  color: white;
  min-height: 100vh;
  position: relative;
}
.section-title {
  font-size: 24px;
  margin-bottom: 20px;
  font-weight: bold;
  text-align: center;
}
.settings-content {
  width: 100%;
  max-width: 440px;
  background: #1e1e1e;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.08);
}
input {
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  margin-bottom: 15px;
  border: none;
  border-radius: 8px;
  background: #2a2a2a;
  color: white;
}
.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}
.save-button, .back-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}
.save-button {
  background: #8b5cf6;
  color: white;
}
.save-button:hover {
  background: #7c3aed;
}
.back-button {
  background: white;
  color: #7c3aed;
}
.back-button:hover {
  background: #f3f4f6;
}
.forgot-password {
  color: #a000a0;
  cursor: pointer;
  text-align: right;
  font-size: 14px;
  margin-bottom: 10px;
}
.forgot-password:hover {
  text-decoration: underline;
}
.notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  animation: fadeIn 0.5s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    bottom: 10px;
  }
  to {
    opacity: 1;
    bottom: 20px;
  }
}
.current-plan {
  margin-top: 10px;
  font-size: 0.95rem;
}
.plan-badge {
  padding: 5px 12px;
  border-radius: 12px;
  font-weight: bold;
  margin-left: 8px;
  font-size: 0.85rem;
  text-transform: uppercase;
}
.badge-free {
  background-color: #6b7280;
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
