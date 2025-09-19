<template>
  <div>
    <div v-if="!currentUser" class="auth-buttons">
      <button class="auth-btn outline" @click="openModal('register')">Регистрация</button>
      <button class="auth-btn gradient" @click="openModal('Login')">Вход</button>
    </div>

    <div v-else class="user-section">
      <button class="auth-btn outline profile" @click="$router.push('/profile/main')">
        Профиль
      </button>
      
      <div class="user-menu">
        <button class="user-button" @click="toggleDropdown">
          Привет, {{ currentUser.name }}
          <span class="badge">{{ displayPlan }}</span>
        </button>
        <div v-if="dropdownOpen" class="dropdown-menu">
          <ul>
            <li @click="$router.push('/profile/settings')">⚙️ Настройки</li>
            <li @click="logout">🚪 Выйти</li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="isModalOpen" class="global-auth-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <span class="close-btn" @click="closeModal">&times;</span>

        <div v-if="isLoading" class="loading-state">{{ loadingMessage }}</div>
        
        <div v-else-if="authMode === 'register'">
          <h2 class="modal-title">Регистрация</h2>
          <input v-model="user.name" placeholder="Имя"/>
          <input v-model="user.surname" placeholder="Фамилия"/>
          <input v-model="user.email" type="email" placeholder="Email"/>
          <input v-model="user.password" type="password" placeholder="Пароль"/>
          <input v-model="user.confirmPassword" type="password" placeholder="Повторите пароль"/>
          <button class="auth-submit gradient" @click="register">Зарегистрироваться</button>
          <button class="auth-submit outline" @click="LoginWithGoogle">Регистрация через Google</button>
          <p class="switch-text">Уже есть аккаунт? <span @click="switchAuth('Login')">Войти</span></p>
        </div>
        
        <div v-else>
          <h2 class="modal-title">Вход</h2>
          <input v-model="Login.email" type="email" placeholder="Email"/>
          <input v-model="Login.password" type="password" placeholder="Пароль"/>
          <button class="auth-submit gradient" @click="handleEmailLogin">Войти</button>
          <button class="auth-submit outline" @click="LoginWithGoogle">Войти через Google</button>
          <p class="switch-text">Нет аккаунта? <span @click="switchAuth('register')">Зарегистрироваться</span></p>
        </div>
        
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { auth } from "@/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";
import { mapMutations, mapActions, mapGetters } from "vuex";

export default {
  data() {
    return {
      isModalOpen: false,
      authMode: "register",
      dropdownOpen: false,
      isLoading: false,
      errorMessage: '',
      successMessage: '',
      loadingMessage: 'Загрузка...',
      user: { name: "", surname: "", email: "", password: "", confirmPassword: "" },
      Login: { email: "", password: "" },
    };
  },

  computed: {
    ...mapGetters(["getUser"]),
    currentUser() {
      return this.getUser;
    },
    displayPlan() {
      const plan = this.currentUser?.subscriptionPlan || localStorage.getItem("plan") || 'free';
      return plan.toUpperCase();
    }
  },

  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user && !this.currentUser) {
        this.handleAuthStateChange(user);
      }
    });

    window.addEventListener("open-Login-modal", () => {
      this.openModal("Login");
    });

    document.addEventListener('click', (event) => {
      if (this.$el && !this.$el.contains(event.target)) {
        this.dropdownOpen = false;
      }
    });
  },

  methods: {
    ...mapMutations(["setUser", "setFirebaseUserId", "setToken"]),
    ...mapActions(["LoginUser", "logoutUser"]),

    getApiBase() {
      const envUrl = import.meta.env.VITE_API_BASE_URL;
      if (window.location.hostname === 'aced.live') {
        return 'https://api.aced.live';
      }
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return envUrl || 'http://localhost:5000';
      }
      return envUrl || 'https://api.aced.live';
    },

    async saveUserToBackend(firebaseUser, token, additionalData = {}) {
      try {
        const apiBase = this.getApiBase();
        const userData = {
          uid: firebaseUser.uid,
          firebaseId: firebaseUser.uid,
          name: additionalData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email,
          Login: firebaseUser.email,
          token: token,
          subscriptionPlan: additionalData.subscriptionPlan || 'free',
          emailVerified: firebaseUser.emailVerified || false,
          photoURL: firebaseUser.photoURL || null,
          lastLoginAt: new Date().toISOString(),
          authProvider: firebaseUser.providerData?.[0]?.providerId || 'firebase',
          ...additionalData
        };

        const response = await axios({
          method: 'POST',
          url: `${apiBase}/api/users/save`,
          data: userData,
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 8000
        });

        if (response.data && response.data.success !== false) {
          return { success: true, user: response.data.user || response.data.data || response.data, source: 'backend' };
        } else {
          throw new Error('Backend returned unsuccessful response');
        }
      } catch (error) {
        const message = error.response?.data?.message || error.message;
        const fallbackUser = {
          uid: firebaseUser.uid,
          _id: firebaseUser.uid,
          firebaseId: firebaseUser.uid,
          email: firebaseUser.email,
          name: additionalData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          displayName: firebaseUser.displayName || '',
          subscriptionPlan: additionalData.subscriptionPlan || 'free',
          userStatus: additionalData.subscriptionPlan || 'free',
          emailVerified: firebaseUser.emailVerified || false,
          photoURL: firebaseUser.photoURL || null,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          authProvider: 'firebase',
          backendSyncFailed: true,
          syncError: message
        };
        return { success: true, user: fallbackUser, source: 'firebase-only', warning: 'Backend sync failed' };
      }
    },

    async handleAuthStateChange(firebaseUser) {
      try {
        this.loadingMessage = 'Настройка аккаунта...';
        const token = await firebaseUser.getIdToken(true);
        const saveResult = await this.saveUserToBackend(firebaseUser, token);

        const userData = {
          name: saveResult.user.name,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          subscriptionPlan: saveResult.user.subscriptionPlan || 'free',
          ...saveResult.user
        };
        this.setUserData(userData, firebaseUser.uid, token);
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        try {
          const fallbackUserData = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            subscriptionPlan: 'free',
            authMode: 'fallback'
          };
          const token = await firebaseUser.getIdToken(true);
          this.setUserData(fallbackUserData, firebaseUser.uid, token);
        } catch (fallbackError) {
          console.error('❌ Complete auth failure:', fallbackError);
          this.showError('Ошибка входа в систему');
        }
      }
    },

    async handleEmailLogin() {
      if (!this.Login.email || !this.Login.password) {
        this.showError("Введите email и пароль");
        return;
      }
      this.isLoading = true;
      this.clearMessages();
      this.loadingMessage = 'Вход в систему...';
      try {
        const result = await signInWithEmailAndPassword(auth, this.Login.email, this.Login.password);
        this.loadingMessage = 'Настройка профиля...';
        await this.handleAuthStateChange(result.user);
        this.showSuccess('Вход выполнен успешно!');
        setTimeout(() => this.closeModal(), 1000);
      } catch (error) {
        let errorMsg = "Ошибка входа";
        if (error.code) {
          switch (error.code) {
            case 'auth/user-not-found': errorMsg = "Пользователь не найден"; break;
            case 'auth/wrong-password':
            case 'auth/invalid-credential': errorMsg = "Неверный пароль или email"; break;
            case 'auth/invalid-email': errorMsg = "Неверный формат email"; break;
            case 'auth/too-many-requests': errorMsg = "Слишком много попыток. Попробуйте позже"; break;
            case 'auth/user-disabled': errorMsg = "Аккаунт заблокирован"; break;
            case 'auth/network-request-failed': errorMsg = "Проблема с интернет-соединением"; break;
            default: errorMsg = "Ошибка аутентификации"; break;
          }
        }
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    async LoginWithGoogle() {
      if (this.isLoading) return;
      this.isLoading = true;
      this.clearMessages();
      this.loadingMessage = 'Подключение к Google...';
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        this.loadingMessage = 'Настройка профиля...';
        await this.handleAuthStateChange(result.user);
        this.showSuccess('Вход через Google выполнен успешно!');
        setTimeout(() => {
          this.closeModal();
          this.$router.push("/profile/main");
        }, 1000);
      } catch (error) {
        let errorMsg = "Ошибка входа через Google";
        if (error.code) {
            switch (error.code) {
                case 'auth/popup-closed-by-user': errorMsg = "Окно входа было закрыто"; break;
                case 'auth/popup-blocked': errorMsg = "Всплывающее окно заблокировано"; break;
                case 'auth/network-request-failed': errorMsg = "Проблема с интернет-соединением"; break;
                default: errorMsg = "Ошибка аутентификации Google"; break;
            }
        }
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    async register() {
      if (!this.user.name || !this.user.email || !this.user.password) {
        this.showError("Заполните все обязательные поля");
        return;
      }
      if (this.user.password !== this.user.confirmPassword) {
        this.showError("Пароли не совпадают");
        return;
      }
      if (this.user.password.length < 6) {
        this.showError("Пароль должен содержать минимум 6 символов");
        return;
      }
      this.isLoading = true;
      this.clearMessages();
      this.loadingMessage = 'Создание аккаунта...';
      try {
        const result = await createUserWithEmailAndPassword(auth, this.user.email, this.user.password);
        this.loadingMessage = 'Настройка профиля...';
        const registrationData = { name: this.user.name, surname: this.user.surname, subscriptionPlan: 'free' };
        const token = await result.user.getIdToken(true);
        const saveResult = await this.saveUserToBackend(result.user, token, registrationData);
        const userData = {
          name: saveResult.user.name || this.user.name,
          email: result.user.email,
          uid: result.user.uid,
          subscriptionPlan: saveResult.user.subscriptionPlan || 'free',
          ...saveResult.user
        };
        this.setUserData(userData, result.user.uid, token);
        this.showSuccess("Вы успешно зарегистрированы!");
        setTimeout(() => this.closeModal(), 1500);
      } catch (error) {
        let errorMsg = "Ошибка регистрации";
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use': errorMsg = "Email уже используется"; break;
                case 'auth/invalid-email': errorMsg = "Неверный формат email"; break;
                case 'auth/weak-password': errorMsg = "Слишком слабый пароль"; break;
                case 'auth/network-request-failed': errorMsg = "Проблема с интернет-соединением"; break;
                default: errorMsg = "Ошибка регистрации"; break;
            }
        }
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    setUserData(userData, firebaseUserId, token) {
      this.setUser(userData);
      this.setFirebaseUserId(firebaseUserId);
      this.setToken(token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("firebaseUserId", firebaseUserId);
      localStorage.setItem("token", token);
      localStorage.setItem("plan", userData.subscriptionPlan || 'free');
    },

    openModal(mode) {
      this.authMode = mode;
      this.isModalOpen = true;
      this.clearMessages();
    },

    closeModal() {
      this.isModalOpen = false;
      this.resetForms();
      this.clearMessages();
    },

    switchAuth(mode) {
      this.authMode = mode;
      this.resetForms();
      this.clearMessages();
    },

    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },

    clearMessages() {
      this.errorMessage = '';
      this.successMessage = '';
    },

    showError(message) {
      this.errorMessage = message;
      this.successMessage = '';
      setTimeout(() => this.clearMessages(), 5000);
    },

    showSuccess(message) {
      this.successMessage = message;
      this.errorMessage = '';
      setTimeout(() => this.clearMessages(), 3000);
    },

    async logout() {
      try {
        await auth.signOut();
        this.logoutUser();
        this.dropdownOpen = false;
        localStorage.clear();
        if (this.$route.path !== '/') {
          this.$router.push('/');
        }
      } catch (error) {
        console.error('❌ Logout error:', error);
      }
    },

    resetForms() {
      this.user = { name: "", surname: "", email: "", password: "", confirmPassword: "" };
      this.Login = { email: "", password: "" };
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600&display=swap');

/* Main Containers */
.auth-buttons, .user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Buttons */
.auth-btn {
  padding: 0.6rem 1.25rem;
  border-radius: 0.5rem;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}
.auth-btn.profile {
  padding: 0.6rem 1rem; /* Smaller padding for profile */
}
.auth-btn.outline {
  background: transparent;
  border-color: #7c3aed;
  color: #c084fc;
}
.auth-btn.outline:hover {
  background: rgba(124, 58, 237, 0.1);
  color: #fff;
}
.auth-btn.gradient {
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  color: white;
  border: none;
}
.auth-btn.gradient:hover {
  filter: brightness(1.2);
}

/* User Menu */
.user-menu {
  position: relative;
}
.user-button {
  background: rgba(25, 22, 69, 0.8);
  border: 1px solid #2c2c54;
  color: #fff;
  border-radius: 99px;
  padding: 0.6rem 0.6rem 0.6rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-family: 'Unbounded', sans-serif;
}
.badge {
  background: #7c3aed;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: bold;
}
.dropdown-menu {
  position: absolute;
  top: 120%;
  right: 0;
  background: #191645;
  border-radius: 0.75rem;
  border: 1px solid #2c2c54;
  width: 180px;
  overflow: hidden;
  z-index: 20;
  padding: 0.5rem;
  color: #fff;
}
.dropdown-menu ul { list-style: none; padding: 0; margin: 0; }
.dropdown-menu li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
  color: #e0e7ff;
}
.dropdown-menu li:hover {
  background-color: rgba(124, 58, 237, 0.2);
}

/* Modal Styles */
.global-auth-modal {
  position: fixed;
  inset: 0;
  background: rgba(10, 0, 24, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: #110d2e;
  border-radius: 1rem;
  padding: 2.5rem;
  width: 90%;
  max-width: 450px;
  border: 1px solid #2c2c54;
  box-shadow: 0 0 40px rgba(0,0,0,0.5);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.loading-state {
  padding: 2rem;
  text-align: center;
  color: #fff;
  font-size: 1.1rem;
}
.modal-title {
  text-align: center;
  font-size: 1.8rem;
  color: #fff;
  font-weight: 600;
  margin-bottom: 1rem;
}
.close-btn {
  position: absolute; top: 1rem; right: 1rem; font-size: 1.5rem;
  background: none; border: none; color: #a3a3c2; cursor: pointer;
}
.modal-content input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #2c2c54;
  background: #191645;
  color: #fff;
  font-family: 'Unbounded', sans-serif;
}
.modal-content input:focus {
  outline: none;
  border-color: #7c3aed;
}
.auth-submit {
  width: 100%;
  padding: 0.8rem;
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.switch-text {
  text-align: center; color: #a3a3c2; font-size: 0.9rem;
}
.switch-text span {
  color: #c084fc; cursor: pointer; text-decoration: underline;
}
.error-message, .success-message {
  padding: 0.75rem; border-radius: 0.5rem; text-align: center;
}
.error-message { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
.success-message { background: rgba(34, 197, 94, 0.1); color: #86efac; }
</style>