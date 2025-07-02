
<template>
  <div>
    <!-- 🔐 Auth buttons -->
    <div v-if="!currentUser" class="auth-buttons">
      <button class="auth-button" @click="openModal('register')">Регистрация</button>
      <button class="auth-button" @click="openModal('Login')">Вход</button>
    </div>

    <!-- 👤 User Info with separate profile button -->
    <div v-else class="user-section">
      <!-- Profile Button -->
      <button class="profile-button" @click="$router.push('/profile')">
        Профиль
      </button>
      
      <!-- User Menu with Dropdown -->
      <div class="user-menu">
        <button 
          class="user-button" 
          :class="{ active: dropdownOpen }"
          @click="toggleDropdown"
        >
          Привет, {{ currentUser.name }}
          <span class="badge">
            {{ displayPlan }}
          </span>
        </button>
        <div 
          v-if="dropdownOpen" 
          class="dropdown-menu show"
          @click.stop
        >
          <ul>
            <li @click="$router.push('/settings')">⚙️ Настройки</li>
            <li @click="logout">🚪 Выйти</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 🪪 Modal -->
    <div v-if="isModalOpen" class="global-auth-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <span class="close-btn" @click="closeModal">&times;</span>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-state">
          <p>Загрузка...</p>
        </div>

        <!-- 👤 Register Form -->
        <div v-else-if="authMode === 'register'">
          <h2>Регистрация</h2>
          <input v-model="user.name" placeholder="Имя" :disabled="isLoading" />
          <input v-model="user.surname" placeholder="Фамилия" :disabled="isLoading" />
          <input v-model="user.email" type="email" placeholder="Email" :disabled="isLoading" />
          <input v-model="user.password" type="password" placeholder="Пароль" :disabled="isLoading" />
          <input v-model="user.confirmPassword" type="password" placeholder="Повторите пароль" :disabled="isLoading" />
          <button class="auth-submit" @click="register" :disabled="isLoading">
            {{ isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>
          <button class="google-auth" @click="LoginWithGoogle" :disabled="isLoading">
            {{ isLoading ? 'Загрузка...' : 'Регистрация через Google' }}
          </button>
          <p class="switch-text">Уже есть аккаунт? <span @click="switchAuth('Login')">Войти</span></p>
        </div>

        <!-- 🔐 Login Form -->
        <div v-else>
          <h2>Вход</h2>
          <input v-model="Login.email" type="email" placeholder="Email" :disabled="isLoading" />
          <input v-model="Login.password" type="password" placeholder="Пароль" :disabled="isLoading" />
          <button class="auth-submit" @click="handleEmailLogin" :disabled="isLoading">
            {{ isLoading ? 'Вход...' : 'Войти' }}
          </button>
          <button class="google-auth" @click="LoginWithGoogle" :disabled="isLoading">
            {{ isLoading ? 'Загрузка...' : 'Войти через Google' }}
          </button>
          <p class="switch-text">Нет аккаунта? <span @click="switchAuth('register')">Зарегистрироваться</span></p>
        </div>

        <!-- Error message display -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
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
    console.log('🔄 Auth state changed for user:', firebaseUser.uid);
    console.log('🌐 Frontend domain:', window.location.hostname);
    
    const token = await firebaseUser.getIdToken(true);
    const apiBase = this.getApiBase();
    
    console.log('📡 Using API base:', apiBase);

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

      console.log('✅ User data loaded from api.aced.live:', userData);
      this.setUserData(userData, firebaseUser.uid, token);
    }
  } catch (error) {
    console.log('⚠️ Could not load user from api.aced.live:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    });
    
    if (error.response?.status === 404) {
      console.log('👤 User not found in backend - will be created on next action');
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

        console.log('💾 Saving user to backend:', { ...userData, token: 'hidden' });

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
        
        console.log('🔄 Starting Google sign-in...');
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        console.log('✅ Firebase auth successful:', firebaseUser.uid);
        
        // Get fresh token
        const token = await firebaseUser.getIdToken(true);
        console.log('🎫 Got fresh token');

        // Save user to backend
        const savedUser = await this.saveUserToBackend(firebaseUser, token);
        console.log('💾 User saved to backend:', savedUser);

        // Set user data in frontend
        const userData = {
          name: savedUser.name || firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          subscriptionPlan: savedUser.subscriptionPlan || 'free',
        };

        this.setUserData(userData, firebaseUser.uid, token);

        console.log('✅ Google Login complete');
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
        console.log('🔄 Starting email Login...');
        const result = await signInWithEmailAndPassword(auth, this.Login.email, this.Login.password);
        const firebaseUser = result.user;
        const token = await firebaseUser.getIdToken(true);
        
        console.log('✅ Email auth successful:', firebaseUser.uid);

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
        
        console.log('✅ Email Login complete');
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
        console.log('🔄 Starting registration...');
        const result = await createUserWithEmailAndPassword(auth, this.user.email, this.user.password);
        const firebaseUser = result.user;
        const token = await firebaseUser.getIdToken(true);
        
        console.log('✅ Firebase registration successful:', firebaseUser.uid);

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
        
        console.log('✅ Registration complete');
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
        
        console.log('✅ Logout successful');
        
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