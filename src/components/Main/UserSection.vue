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
          <input v-model="user.email" type="email" placeholder="Email"/>
          <input v-model="user.password" type="password" placeholder="Пароль"/>
          <button class="modal-btn solid" @click="register">Зарегистрироваться</button>
          <button class="modal-btn outline" @click="LoginWithGoogle">Регистрация через Google</button>
          <div class="switch-auth-wrapper">
              <span>Уже есть аккаунт?</span>
              <button @click="switchAuth('Login')">Войти</button>
          </div>
        </div>
        
        <div v-else>
          <h2 class="modal-title">Вход</h2>
          <input v-model="Login.email" type="email" placeholder="Email"/>
          <input v-model="Login.password" type="password" placeholder="Пароль"/>
          <button class="modal-btn solid" @click="handleEmailLogin">Войти</button>
          <button class="modal-btn outline" @click="LoginWithGoogle">Войти через Google</button>
          <div class="switch-auth-wrapper">
              <span>Нет аккаунта?</span>
              <button @click="switchAuth('register')">Зарегистрироваться</button>
          </div>
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
      user: { name: "", email: "", password: "" }, // Simplified user object
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
        const registrationData = { name: this.user.name, subscriptionPlan: 'free' };
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
      this.user = { name: "", email: "", password: "" }; // Simplified reset
      this.Login = { email: "", password: "" };
    },
  },
};
</script>


<style scoped>
@import "@/assets/css/UserSection.css";

.loading-state {
  text-align: center;
  padding: 2rem;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.success-message {
  background-color: #efe;
  border: 1px solid #cfc;
  color: #3c3;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.auth-submit:disabled,
.google-auth:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-text span {
  cursor: pointer;
  color: #007bff;
  text-decoration: underline;
}

.switch-text span:hover {
  color: #0056b3;
}
</style>
