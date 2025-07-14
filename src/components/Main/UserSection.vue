<template>
  <div class="user-section-wrapper">
    <!-- 🔐 Auth buttons -->
    <div v-if="!currentUser" class="auth-buttons">
      <button class="auth-button register" @click="openModal('register')">
        <span class="button-text">Регистрация</span>
      </button>
      <button class="auth-button login" @click="openModal('Login')">
        <span class="button-text">Вход</span>
      </button>
    </div>

    <!-- 👤 User Info with separate profile button -->
    <div v-else class="user-section">
      <!-- Profile Button -->
      <button class="profile-button" @click="$router.push('/profile')">
        <span class="profile-icon">👤</span>
        <span class="profile-text">Профиль</span>
      </button>
      
      <!-- User Menu with Dropdown -->
      <div class="user-menu">
        <button 
          class="user-button" 
          :class="{ active: dropdownOpen }"
          @click="toggleDropdown"
        >
          <span class="user-greeting">Привет, {{ currentUser.name }}</span>
          <span class="badge" :class="displayPlan.toLowerCase()">
            {{ displayPlan }}
          </span>
          <span class="dropdown-arrow" :class="{ rotated: dropdownOpen }">▼</span>
        </button>
        <div 
          v-if="dropdownOpen" 
          class="dropdown-menu show"
          @click.stop
        >
          <ul>
            <li @click="$router.push('/settings')">
              <span class="menu-icon">⚙️</span>
              <span class="menu-text">Настройки</span>
            </li>
            <li @click="logout">
              <span class="menu-icon">🚪</span>
              <span class="menu-text">Выйти</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 🪪 Modal -->
    <div v-if="isModalOpen" class="global-auth-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal" aria-label="Закрыть">
          <span>&times;</span>
        </button>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>

        <!-- 👤 Register Form -->
        <div v-else-if="authMode === 'register'" class="auth-form">
          <h2>Регистрация</h2>
          <div class="form-group">
            <input 
              v-model="user.name" 
              type="text"
              placeholder="Имя" 
              :disabled="isLoading"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <input 
              v-model="user.surname" 
              type="text"
              placeholder="Фамилия" 
              :disabled="isLoading"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <input 
              v-model="user.email" 
              type="email" 
              placeholder="Email" 
              :disabled="isLoading"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <input 
              v-model="user.password" 
              type="password" 
              placeholder="Пароль" 
              :disabled="isLoading"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <input 
              v-model="user.confirmPassword" 
              type="password" 
              placeholder="Повторите пароль" 
              :disabled="isLoading"
              class="form-input"
              required
            />
          </div>
          <button class="auth-submit" @click="register" :disabled="isLoading">
            <span v-if="isLoading" class="button-spinner"></span>
            {{ isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>
          <div class="divider">
            <span>или</span>
          </div>
          <button class="google-auth" @click="LoginWithGoogle" :disabled="isLoading">
            <span class="google-icon">🔍</span>
            {{ isLoading ? 'Загрузка...' : 'Регистрация через Google' }}
          </button>
          <p class="switch-text">
            Уже есть аккаунт? 
            <span @click="switchAuth('Login')" class="switch-link">Войти</span>
          </p>
        </div>

        <!-- 🔐 Login Form -->
        <div v-else class="auth-form">
          <h2>Вход</h2>
          <div class="form-group">
            <input 
              v-model="Login.email" 
              type="email" 
              placeholder="Email" 
              :disabled="isLoading"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <input 
              v-model="Login.password" 
              type="password" 
              placeholder="Пароль" 
              :disabled="isLoading"
              class="form-input"
              required
            />
          </div>
          <button class="auth-submit" @click="handleEmailLogin" :disabled="isLoading">
            <span v-if="isLoading" class="button-spinner"></span>
            {{ isLoading ? 'Вход...' : 'Войти' }}
          </button>
          <div class="divider">
            <span>или</span>
          </div>
          <button class="google-auth" @click="LoginWithGoogle" :disabled="isLoading">
            <span class="google-icon">🔍</span>
            {{ isLoading ? 'Загрузка...' : 'Войти через Google' }}
          </button>
          <p class="switch-text">
            Нет аккаунта? 
            <span @click="switchAuth('register')" class="switch-link">Зарегистрироваться</span>
          </p>
        </div>

        <!-- Error message display -->
        <div v-if="errorMessage" class="error-message">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ errorMessage }}</span>
        </div>
      </div>
    </div>

    <!-- ⚙️ Settings -->
    <AcedSettings v-if="showSettings" @close-settings="showSettings = false" />
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
import AcedSettings from "@/components/Main/AcedSettings.vue";

export default {
  components: { AcedSettings },

  data() {
    return {
      isModalOpen: false,
      authMode: "register",
      dropdownOpen: false,
      showSettings: false,
      isLoading: false,
      errorMessage: '',
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
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user && !this.currentUser) {
        this.handleAuthStateChange(user);
      }
    });

    // Listen for custom events
    window.addEventListener("open-Login-modal", () => {
      this.openModal("Login");
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!this.$el.contains(event.target)) {
        this.dropdownOpen = false;
      }
    });
  },

  methods: {
    ...mapMutations(["setUser", "setFirebaseUserId", "setToken"]),
    ...mapActions(["LoginUser", "logoutUser"]),

    openModal(mode) {
      this.authMode = mode;
      this.isModalOpen = true;
      this.clearError();
    },

    closeModal() {
      this.isModalOpen = false;
      this.resetForms();
      this.clearError();
    },

    switchAuth(mode) {
      this.authMode = mode;
      this.resetForms();
      this.clearError();
    },

    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },

    clearError() {
      this.errorMessage = '';
    },

    showError(message) {
      this.errorMessage = message;
      setTimeout(() => {
        this.clearError();
      }, 5000);
    },

    async handleAuthStateChange(firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken(true);
        const apiBase = this.getApiBase();
        
        // ✅ Production-optimized API call
        const response = await axios.get(`${apiBase}/users/${firebaseUser.uid}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        if (response.data) {
          const userData = {
            name: response.data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            subscriptionPlan: response.data.subscriptionPlan || 'free',
          };

          this.setUserData(userData, firebaseUser.uid, token);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          const userData = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            subscriptionPlan: 'free',
          };
          this.setUserData(userData, firebaseUser.uid, await firebaseUser.getIdToken(true));
        } else {
          console.error('🌐 Backend connection issue with api.aced.live');
          this.showError('Проблема с подключением к серверу');
        }
      }
    },

    getApiBase() {
      // ✅ Production-aware API base URL
      const envUrl = import.meta.env.VITE_API_BASE_URL;
      
      // Always use production API for live site
      if (window.location.hostname === 'aced.live') {
        return 'https://api.aced.live/api';
      }
      
      // For local development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return envUrl || 'http://localhost:5000/api';
      }
      
      // Default fallback
      return envUrl || 'https://api.aced.live/api';
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

    async saveUserToBackend(firebaseUser, token, additionalData = {}) {
      try {
        const apiBase = this.getApiBase();
        const userData = {
          token,
          name: additionalData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          Login: firebaseUser.email,
          email: firebaseUser.email,
          subscriptionPlan: additionalData.subscriptionPlan || 'free',
        };

        const response = await axios.post(`${apiBase}/users/save`, userData);
        return response.data;
      } catch (error) {
        console.error('❌ Backend save error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Ошибка сохранения пользователя');
      }
    },

    async LoginWithGoogle() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      this.clearError();

      try {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        // Get fresh token
        const token = await firebaseUser.getIdToken(true);

        // Save user to backend
        const savedUser = await this.saveUserToBackend(firebaseUser, token);

        // Set user data in frontend
        const userData = {
          name: savedUser.name || firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          subscriptionPlan: savedUser.subscriptionPlan || 'free',
        };

        this.setUserData(userData, firebaseUser.uid, token);

        this.closeModal();
        
        // Navigate to profile
        this.$router.push("/profile");

      } catch (error) {
        console.error("❌ Google Login error:", error);
        
        let errorMsg = "Ошибка входа через Google";
        if (error.code === 'auth/popup-closed-by-user') {
          errorMsg = "Окно входа было закрыто";
        } else if (error.code === 'auth/popup-blocked') {
          errorMsg = "Всплывающее окно заблокировано браузером";
        } else if (error.message.includes('Request failed')) {
          errorMsg = "Ошибка соединения с сервером";
        }
        
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    async handleEmailLogin() {
      if (!this.Login.email || !this.Login.password) {
        this.showError("Введите email и пароль");
        return;
      }

      this.isLoading = true;
      this.clearError();

      try {
        const result = await signInWithEmailAndPassword(auth, this.Login.email, this.Login.password);
        const firebaseUser = result.user;
        const token = await firebaseUser.getIdToken(true);

        const apiBase = this.getApiBase();

        // Try to get existing user data
        let userData;
        try {
          const response = await axios.get(`${apiBase}/users/${firebaseUser.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          userData = {
            name: response.data.name || firebaseUser.email,
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            subscriptionPlan: response.data.subscriptionPlan || 'free',
          };
        } catch (error) {
          // User doesn't exist in backend, create them
          const savedUser = await this.saveUserToBackend(firebaseUser, token);
          userData = {
            name: savedUser.name || firebaseUser.email,
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            subscriptionPlan: savedUser.subscriptionPlan || 'free',
          };
        }

        this.setUserData(userData, firebaseUser.uid, token);
        
        this.closeModal();

      } catch (error) {
        console.error("❌ Email Login failed:", error);
        
        let errorMsg = "Ошибка входа";
        if (error.code === 'auth/user-not-found') {
          errorMsg = "Пользователь не найден";
        } else if (error.code === 'auth/wrong-password') {
          errorMsg = "Неверный пароль";
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = "Неверный формат email";
        } else if (error.code === 'auth/too-many-requests') {
          errorMsg = "Слишком много попыток. Попробуйте позже";
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
      this.clearError();

      try {
        const result = await createUserWithEmailAndPassword(auth, this.user.email, this.user.password);
        const firebaseUser = result.user;
        const token = await firebaseUser.getIdToken(true);

        // Save user to backend with registration data
        const savedUser = await this.saveUserToBackend(firebaseUser, token, {
          name: this.user.name,
          subscriptionPlan: 'free'
        });

        const userData = {
          name: savedUser.name || this.user.name,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          subscriptionPlan: savedUser.subscriptionPlan || 'free'
        };

        this.setUserData(userData, firebaseUser.uid, token);
        
        this.showError("Вы успешно зарегистрированы!");
        
        setTimeout(() => {
          this.closeModal();
        }, 1500);

      } catch (error) {
        console.error("❌ Registration error:", error);
        
        let errorMsg = "Ошибка регистрации";
        if (error.code === 'auth/email-already-in-use') {
          errorMsg = "Email уже используется";
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = "Неверный формат email";
        } else if (error.code === 'auth/weak-password') {
          errorMsg = "Слишком слабый пароль";
        }
        
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        await auth.signOut();
        this.logoutUser();
        this.dropdownOpen = false;
        
        // Clear all stored data
        localStorage.removeItem("plan");
        localStorage.removeItem("user");
        localStorage.removeItem("firebaseUserId");
        localStorage.removeItem("token");
        
        // Redirect to home if needed
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
.user-section-wrapper {
  position: relative;
  z-index: 100;
}

/* Auth Buttons */
.auth-buttons {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.auth-button {
  background: linear-gradient(135deg, #9333ea, #7c3aed);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 120px;
  box-shadow: 0 4px 15px rgba(147, 51, 234, 0.3);
}

.auth-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.auth-button:hover::before {
  left: 100%;
}

.auth-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(147, 51, 234, 0.4);
}

.auth-button.register {
  background: linear-gradient(135deg, #9333ea, #c084fc);
}

.auth-button.login {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
}

.button-text {
  position: relative;
  z-index: 1;
}

/* User Section */
.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.profile-button {
  background: linear-gradient(135deg, #1e293b, #334155);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.profile-button:hover {
  background: linear-gradient(135deg, #334155, #475569);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.profile-icon {
  font-size: 1.1rem;
}

.profile-text {
  font-weight: 500;
}

.user-menu {
  position: relative;
}

.user-button {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #e2e8f0;
  border: 1px solid rgba(167, 139, 250, 0.3);
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
  min-width: 200px;
  justify-content: space-between;
}

.user-button:hover,
.user-button.active {
  background: linear-gradient(135deg, #1e293b, #334155);
  box-shadow: 0 4px 15px rgba(147, 51, 234, 0.3);
}

.user-greeting {
  font-weight: 500;
  flex-grow: 1;
  text-align: left;
}

.badge {
  background: linear-gradient(135deg, #9333ea, #c084fc);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge.free {
  background: linear-gradient(135deg, #64748b, #94a3b8);
}

.badge.starter {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.badge.pro {
  background: linear-gradient(135deg, #9333ea, #c084fc);
}

.dropdown-arrow {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 12px;
  min-width: 180px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}

.dropdown-menu.show {
  opacity: 1;
  transform: translateY(0);
}

.dropdown-menu ul {
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.dropdown-menu li {
  padding: 12px 16px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.dropdown-menu li:hover {
  background: rgba(147, 51, 234, 0.2);
  color: #c084fc;
}

.dropdown-menu li:first-child {
  border-radius: 8px 8px 0 0;
}

.dropdown-menu li:last-child {
  border-radius: 0 0 8px 8px;
}

.menu-icon {
  font-size: 1rem;
}

.menu-text {
  font-weight: 500;
}

/* Modal Styles */
.global-auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(135deg, #1e293b, #334155);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(167, 139, 250, 0.3);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 2rem;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.3s ease;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.1);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 2rem;
  color: #e2e8f0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(147, 51, 234, 0.3);
  border-top: 4px solid #9333ea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Auth Form */
.auth-form {
  color: #e2e8f0;
}

.auth-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #c084fc;
  font-size: 1.8rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  padding: 15px;
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.5);
  color: #e2e8f0;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.form-input:focus {
  outline: none;
  border-color: #9333ea;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.2);
}

.form-input::placeholder {
  color: #94a3b8;
}

.auth-submit {
  width: 100%;
  background: linear-gradient(135deg, #9333ea, #7c3aed);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(147, 51, 234, 0.3);
}

.auth-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(147, 51, 234, 0.4);
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
  color: #94a3b8;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(148, 163, 184, 0.3);
}

.divider span {
  background: linear-gradient(135deg, #1e293b, #334155);
  padding: 0 15px;
  position: relative;
  z-index: 1;
}

.google-auth {
  width: 100%;
  background: #fff;
  color: #333;
  border: 2px solid #ddd;
  padding: 15px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.google-auth:hover:not(:disabled) {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.google-auth:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  font-size: 1.2rem;
}

.switch-text {
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 20px;
}

.switch-link {
  color: #c084fc;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.3s ease;
}

.switch-link:hover {
  color: #a855f7;
}

/* Error Message */
.error-message {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 15px;
  border-radius: 12px;
  margin-top: 20px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(5px);
}

.error-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.error-text {
  flex-grow: 1;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .auth-buttons {
    gap: 10px;
  }
  
  .auth-button {
    padding: 10px 20px;
    font-size: 0.8rem;
    min-width: 100px;
  }
  
  .user-section {
    gap: 15px;
  }
  
  .profile-button {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
  
  .user-button {
    padding: 10px 16px;
    font-size: 0.8rem;
    min-width: 180px;
  }
  
  .user-greeting {
    font-size: 0.8rem;
  }
  
  .badge {
    padding: 3px 6px;
    font-size: 0.7rem;
  }
  
  .dropdown-menu {
    min-width: 160px;
  }
  
  .dropdown-menu li {
    padding: 10px 14px;
    font-size: 0.8rem;
  }
  
  .modal-content {
    padding: 30px 25px;
    margin: 10px;
  }
  
  .auth-form h2 {
    font-size: 1.5rem;
    margin-bottom: 25px;
  }
  
  .form-input {
    padding: 12px;
    font-size: 0.9rem;
  }
  
  .auth-submit,
  .google-auth {
    padding: 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .auth-buttons {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
  
  .auth-button {
    width: 100%;
    justify-content: center;
  }
  
  .user-section {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .profile-button,
  .user-button {
    width: 100%;
    justify-content: center;
  }
  
  .user-button {
    min-width: auto;
  }
  
  .dropdown-menu {
    left: 0;
    right: 0;
    min-width: auto;
  }
  
  .modal-content {
    padding: 25px 20px;
  }
  
  .close-btn {
    top: 10px;
    right: 15px;
    font-size: 1.5rem;
    width: 35px;
    height: 35px;
  }
}

/* Large screens */
@media (min-width: 1200px) {
  .auth-button {
    padding: 14px 28px;
    font-size: 1rem;
  }
  
  .user-button {
    padding: 14px 24px;
    font-size: 1rem;
  }
  
  .profile-button {
    padding: 12px 24px;
    font-size: 1rem;
  }
}
</style>