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
          <p>{{ loadingMessage }}</p>
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
        
        <!-- Success message display -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
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

    // ✅ FIXED: Better API base with fallback handling
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

    // ✅ COMPLETELY REWRITTEN: Graceful backend save with proper fallback
    async saveUserToBackend(firebaseUser, token, additionalData = {}) {
      console.log('💾 Attempting to save user to backend...');
      
      try {
        const apiBase = this.getApiBase();
        
        const userData = {
          uid: firebaseUser.uid,
          firebaseId: firebaseUser.uid,
          name: additionalData.name || 
                firebaseUser.displayName || 
                firebaseUser.email?.split('@')[0] || 
                'User',
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

        console.log('📤 Trying to save to backend:', {
          uid: userData.uid,
          email: userData.email,
          name: userData.name
        });

        // ✅ SINGLE ATTEMPT with short timeout - don't retry if backend is down
        const response = await axios({
          method: 'POST',
          url: `${apiBase}/api/users/save`,
          data: userData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000  // Shorter timeout - fail fast if backend is down
        });

        if (response.data && response.data.success !== false) {
          console.log('✅ Backend save successful:', response.data);
          
          const savedUser = response.data.user || response.data.data || response.data;
          
          return {
            success: true,
            user: savedUser,
            source: 'backend',
            message: 'User saved to backend successfully'
          };
        } else {
          throw new Error('Backend returned unsuccessful response');
        }

      } catch (error) {
        // ✅ CRITICAL: Don't treat backend errors as failures - just log and continue
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        
        console.warn('⚠️ Backend save failed (this is OK - continuing with Firebase-only):', {
          status,
          message,
          code: error.code
        });

        // ✅ Return a constructed user for frontend-only operation
        const fallbackUser = {
          uid: firebaseUser.uid,
          _id: firebaseUser.uid,
          firebaseId: firebaseUser.uid,
          email: firebaseUser.email,
          name: additionalData.name || 
                firebaseUser.displayName || 
                firebaseUser.email?.split('@')[0] || 
                'User',
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

        console.log('✅ Created fallback user (Firebase-only):', fallbackUser.email);

        return {
          success: true,  // ✅ Still return success!
          user: fallbackUser,
          source: 'firebase-only',
          message: 'User authenticated with Firebase (backend sync failed)',
          warning: 'Backend synchronization failed, using Firebase-only mode'
        };
      }
    },

    // ✅ SIMPLIFIED: Auth state change handler with better error handling
    async handleAuthStateChange(firebaseUser) {
      try {
        console.log('🔐 Processing auth state change for:', firebaseUser.uid);
        
        this.loadingMessage = 'Настройка аккаунта...';
        
        const token = await firebaseUser.getIdToken(true);
        
        // ✅ Try to save to backend but don't fail if it doesn't work
        const saveResult = await this.saveUserToBackend(firebaseUser, token);

        // ✅ Always proceed with user setup, regardless of backend status
        const userData = {
          name: saveResult.user.name,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          subscriptionPlan: saveResult.user.subscriptionPlan || 'free',
          ...saveResult.user
        };

        this.setUserData(userData, firebaseUser.uid, token);
        
        // ✅ Only show warning if backend sync failed, not error
        if (saveResult.warning) {
          console.info('ℹ️ Auth completed with warning:', saveResult.warning);
          // Don't show error to user - auth still worked
        } else {
          console.log('✅ Auth completed successfully');
        }
        
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        
        // ✅ GRACEFUL FALLBACK: Create minimal user data
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
          
          console.log('✅ Fallback auth successful');
          
        } catch (fallbackError) {
          console.error('❌ Complete auth failure:', fallbackError);
          this.showError('Ошибка входа в систему');
        }
      }
    },

    // ✅ SIMPLIFIED: Email login with better error isolation
    async handleEmailLogin() {
      if (!this.Login.email || !this.Login.password) {
        this.showError("Введите email и пароль");
        return;
      }

      this.isLoading = true;
      this.clearMessages();
      this.loadingMessage = 'Вход в систему...';

      try {
        console.log('🔐 Starting email login for:', this.Login.email);
        
        // ✅ Firebase authentication first
        const result = await signInWithEmailAndPassword(auth, this.Login.email, this.Login.password);
        const firebaseUser = result.user;
        
        console.log('✅ Firebase authentication successful');
        this.loadingMessage = 'Настройка профиля...';
        
        // ✅ Handle auth state change (includes backend sync attempt)
        await this.handleAuthStateChange(firebaseUser);
        
        this.showSuccess('Вход выполнен успешно!');
        
        setTimeout(() => {
          this.closeModal();
        }, 1000);
        
        console.log('✅ Email login completed');

      } catch (error) {
        console.error("❌ Email Login failed:", error);
        
        // ✅ BETTER ERROR HANDLING: Focus on Firebase errors, not backend errors
        let errorMsg = "Ошибка входа";
        
        if (error.code === 'auth/user-not-found') {
          errorMsg = "Пользователь не найден";
        } else if (error.code === 'auth/wrong-password') {
          errorMsg = "Неверный пароль";
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = "Неверный формат email";
        } else if (error.code === 'auth/too-many-requests') {
          errorMsg = "Слишком много попыток. Попробуйте позже";
        } else if (error.code === 'auth/user-disabled') {
          errorMsg = "Аккаунт заблокирован";
        } else if (error.code === 'auth/invalid-credential') {
          errorMsg = "Неверные данные для входа";
        } else if (error.code === 'auth/network-request-failed') {
          errorMsg = "Проблема с интернет-соединением";
        } else if (error.code && error.code.startsWith('auth/')) {
          // It's a Firebase auth error
          errorMsg = "Ошибка аутентификации Firebase";
        } else {
          // It's likely a network/backend error - be more gentle
          errorMsg = "Проблема с подключением. Попробуйте позже";
        }
        
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
        this.loadingMessage = 'Загрузка...';
      }
    },

    // ✅ SIMPLIFIED: Google login with better error isolation
    async LoginWithGoogle() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      this.clearMessages();
      this.loadingMessage = 'Подключение к Google...';

      try {
        console.log('🔐 Starting Google login...');
        
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // ✅ Firebase authentication first
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        console.log('✅ Google authentication successful');
        this.loadingMessage = 'Настройка профиля...';
        
        // ✅ Handle auth state change (includes backend sync attempt)
        await this.handleAuthStateChange(firebaseUser);
        
        this.showSuccess('Вход через Google выполнен успешно!');
        
        setTimeout(() => {
          this.closeModal();
          this.$router.push("/profile");
        }, 1000);
        
        console.log('✅ Google login completed');

      } catch (error) {
        console.error("❌ Google Login error:", error);
        
        // ✅ BETTER ERROR HANDLING: Focus on actual user-facing issues
        let errorMsg = "Ошибка входа через Google";
        
        if (error.code === 'auth/popup-closed-by-user') {
          errorMsg = "Окно входа было закрыто";
        } else if (error.code === 'auth/popup-blocked') {
          errorMsg = "Всплывающее окно заблокировано браузером";
        } else if (error.code === 'auth/cancelled-popup-request') {
          errorMsg = "Запрос на вход был отменен";
        } else if (error.code === 'auth/network-request-failed') {
          errorMsg = "Проблема с интернет-соединением";
        } else if (error.code && error.code.startsWith('auth/')) {
          errorMsg = "Ошибка аутентификации Google";
        } else {
          // Network/backend errors - don't scare the user
          errorMsg = "Проблема с подключением";
        }
        
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
        this.loadingMessage = 'Загрузка...';
      }
    },

    // ✅ SIMPLIFIED: Registration with better error isolation  
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
        console.log('🔐 Starting registration for:', this.user.email);
        
        // ✅ Firebase registration first
        const result = await createUserWithEmailAndPassword(auth, this.user.email, this.user.password);
        const firebaseUser = result.user;
        
        console.log('✅ Firebase registration successful');
        this.loadingMessage = 'Настройка профиля...';
        
        // ✅ Include registration data
        const registrationData = {
          name: this.user.name,
          surname: this.user.surname,
          subscriptionPlan: 'free'
        };
        
        const token = await firebaseUser.getIdToken(true);
        const saveResult = await this.saveUserToBackend(firebaseUser, token, registrationData);

        // ✅ Always proceed regardless of backend sync status
        const userData = {
          name: saveResult.user.name || this.user.name,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          subscriptionPlan: saveResult.user.subscriptionPlan || 'free',
          ...saveResult.user
        };

        this.setUserData(userData, firebaseUser.uid, token);
        
        // ✅ Show success message regardless of backend sync
        this.showSuccess("Вы успешно зарегистрированы!");
        
        setTimeout(() => {
          this.closeModal();
        }, 1500);
        
        console.log('✅ Registration completed');

      } catch (error) {
        console.error("❌ Registration error:", error);
        
        // ✅ BETTER ERROR HANDLING: Focus on Firebase registration errors
        let errorMsg = "Ошибка регистрации";
        
        if (error.code === 'auth/email-already-in-use') {
          errorMsg = "Email уже используется";
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = "Неверный формат email";
        } else if (error.code === 'auth/weak-password') {
          errorMsg = "Слишком слабый пароль";
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMsg = "Регистрация временно недоступна";
        } else if (error.code === 'auth/network-request-failed') {
          errorMsg = "Проблема с интернет-соединением";
        } else if (error.code && error.code.startsWith('auth/')) {
          errorMsg = "Ошибка Firebase регистрации";
        } else {
          // Likely network/backend issue
          errorMsg = "Проблема с подключением";
        }
        
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
        this.loadingMessage = 'Загрузка...';
      }
    },

    // ✅ Helper methods
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
      setTimeout(() => {
        this.clearMessages();
      }, 5000);
    },

    showSuccess(message) {
      this.successMessage = message;
      this.errorMessage = '';
      setTimeout(() => {
        this.clearMessages();
      }, 3000);
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