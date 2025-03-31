<template>
    <div class="settings-page">
      <button class="close-btn" @click="goBack">✖</button>
      <div class="settings-content">
        <h2>Настройки профиля</h2>
  
        <label>Имя</label>
        <input type="text" v-model="user.name" placeholder="Введите имя" />
  
        <label>Фамилия</label>
        <input type="text" v-model="user.surname" placeholder="Введите фамилию" />
  
        <label>Email</label>
        <input type="email" v-model="user.email" placeholder="Введите email" />
  
        <!-- Password Section -->
        <div v-if="!isGoogleUser">
          <label>Текущий пароль</label>
          <input type="password" v-model="oldPassword" placeholder="Введите текущий пароль" />
  
          <label>Новый пароль</label>
          <input type="password" v-model="newPassword" placeholder="Введите новый пароль" />
  
          <label>Подтвердите новый пароль</label>
          <input type="password" v-model="confirmPassword" placeholder="Повторите новый пароль" />
        </div>
  
        <p class="forgot-password" @click="resetPassword">Забыли пароль?</p>
  
        <!-- Create Password Button (Styled like "Forgot Password") -->
        <p v-if="isGoogleUser" class="forgot-password" @click="sendPasswordReset">
          Создать пароль
        </p>
  
        <!-- Buttons -->
        <div class="button-group">
          <button class="save-button" @click="saveChanges">Сохранить</button>
          <button class="close-button" @click="goBack">Назад</button>
        </div>
      </div>
  
      <!-- Notifications -->
      <div v-if="notification" class="notification">{{ notification }}</div>
    </div>
  </template>
  
  
  
  <script>
  import { auth, db } from "@/firebase";
  import {
    updateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
  } from "firebase/auth";
  import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
  import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
  
  export default {
    data() {
      return {
        user: { name: "", surname: "", email: "" },
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
        currentUser: null,
        isGoogleUser: false, // New flag to check if logged in with Google
        notification: "", // Notification message
      };
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
  
      async saveChanges() {
        if (!this.currentUser) {
          this.showNotification("Пользователь не авторизован.");
          return;
        }
  
        try {
          const userRef = doc(db, "users", this.currentUser.uid);
  
          console.log("🔥 Updating user:", this.currentUser.uid);
  
          // **1. Update Name & Surname**
          await updateDoc(userRef, {
            name: this.user.name,
            surname: this.user.surname,
          });
  
          // **2. Update Email**
          if (this.user.email !== this.currentUser.email) {
            console.log("📧 Updating email from", this.currentUser.email, "to", this.user.email);
  
            if (this.isGoogleUser) {
              // **Re-authenticate with Google**
              const provider = new GoogleAuthProvider();
              await signInWithPopup(auth, provider);
              await updateEmail(this.currentUser, this.user.email);
            } else {
              if (!this.oldPassword) {
                this.showNotification("Введите текущий пароль для изменения email.");
                return;
              }
  
              console.log("🔑 Old password entered:", this.oldPassword);
  
              const credential = EmailAuthProvider.credential(
                this.currentUser.email,
                this.oldPassword
              );
              await reauthenticateWithCredential(this.currentUser, credential);
              await updateEmail(this.currentUser, this.user.email);
            }
          }
  
          // **3. Update Password**
          if (this.newPassword) {
            if (this.isGoogleUser) {
              this.showNotification("Вы вошли через Google. Пароль изменить нельзя. Используйте кнопку 'Создать пароль'.");
              return;
            }
  
            if (this.newPassword !== this.confirmPassword) {
              this.showNotification("Пароли не совпадают.");
              return;
            }
  
            console.log("🔐 Updating password...");
  
            const credential = EmailAuthProvider.credential(
              this.currentUser.email,
              this.oldPassword
            );
            await reauthenticateWithCredential(this.currentUser, credential);
            await updatePassword(this.currentUser, this.newPassword);
          }
  
          this.showNotification("Изменения сохранены!");
        } catch (error) {
          console.error("🚨 Ошибка:", error);
          this.showNotification("Ошибка: " + error.message);
        }
      },
  
      async sendPasswordReset() {
        try {
          if (!this.currentUser) {
            this.showNotification("Ошибка: Пользователь не авторизован.");
            return;
          }
  
          await sendPasswordResetEmail(auth, this.currentUser.email);
          this.showNotification("Ссылка для создания пароля отправлена на ваш email.");
        } catch (error) {
          console.error("Ошибка отправки email:", error);
          this.showNotification("Ошибка: " + error.message);
        }
      },
  
      showNotification(message) {
        this.notification = message;
        setTimeout(() => {
          this.notification = "";
        }, 5000); // Hide after 5 seconds
      },
  
      goBack() {
        this.$router.push("/");
      },
    },
  };
  </script>
  


  
  
  <style scoped>
  /* Page Styling */
  .settings-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    background-color: #121212;
    color: white;
    min-height: 100vh;
  }
  
  /* Close Button */
  .close-btn {
    position: absolute;
    top: 20px;
    right: 30px;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
  }
  
  /* Settings Content */
  .settings-content {
    width: 100%;
    max-width: 400px;
    background: #1e1e1e;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(255, 255, 255, 0.1);
  }
  
  /* Inputs */
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
  
  /* Buttons */
  .button-group {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  
  .save-button, .close-button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: 0.3s;
  }
  
  .save-button {
    background: purple;
    color: white;
  }
  
  .save-button:hover {
    background: #a000a0;
  }
  
  .close-button {
    background: white;
    color: purple;
  }
  
  .close-button:hover {
    background: #f0f0f0;
  }
  
  /* Forgot Password */
  .forgot-password {
    color: #a000a0;
    cursor: pointer;
    text-align: right;
    font-size: 14px;
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

  </style>
  