<template>
  <div class="user-section-wrapper">
    <!-- Force update -->
    <!-- Language Switcher -->
    <LanguageSwitcher :compact="true" />

    <div v-if="!currentUser" class="auth-buttons">
      <button class="auth-btn login-btn" @click="openModal('Login')">
        <span class="btn-text">{{ $t('userSection.login') }}</span>
        <span class="btn-icon">→</span>
      </button>
      <button class="auth-btn register-btn" @click="openModal('register')">
        <span class="btn-text">{{ $t('userSection.register') }}</span>
        <span class="btn-glow"></span>
      </button>
    </div>

    <div v-else class="user-section">
      <button class="auth-btn profile-btn" @click="$router.push('/profile')">
        <span class="profile-icon">👤</span>
        <span>{{ $t('userSection.profile') }}</span>
      </button>

      <div class="user-menu">
        <button
          class="user-button"
          :class="{ active: dropdownOpen }"
          @click="toggleDropdown"
        >
          <span class="user-greeting">{{ $t('userSection.greeting', { name: currentUser.name }) }}</span>
          <span class="badge" :class="planClass">
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
              <span>{{ $t('userSection.settings') }}</span>
            </li>
            <li @click="logout">
              <span class="menu-icon">🚪</span>
              <span>{{ $t('userSection.logout') }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="isModalOpen" class="global-auth-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal">
          <span>×</span>
        </button>

        <div v-if="isLoading" class="loading-state">
          <div class="loader-spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>

        <div v-else-if="authMode === 'register'" class="auth-form">
          <div class="modal-header">
            <h2>{{ $t('userSection.createAccount') }}</h2>
            <p class="modal-subtitle">{{ $t('userSection.startJourney') }}</p>
          </div>

          <div class="form-group">
            <input v-model="user.name" :placeholder="$t('userSection.firstName')" :disabled="isLoading" class="form-input" />
          </div>
          <div class="form-group">
            <input v-model="user.surname" :placeholder="$t('userSection.lastName')" :disabled="isLoading" class="form-input" />
          </div>
          <div class="form-group">
            <input v-model="user.email" type="email" :placeholder="$t('userSection.email')" :disabled="isLoading" class="form-input" />
          </div>
          <div class="form-group">
            <input v-model="user.password" type="password" :placeholder="$t('userSection.password')" :disabled="isLoading" class="form-input" />
          </div>
          <div class="form-group">
            <input v-model="user.confirmPassword" type="password" :placeholder="$t('userSection.confirmPassword')" :disabled="isLoading" class="form-input" />
          </div>

          <button class="auth-submit" @click="register" :disabled="isLoading">
            <span>{{ isLoading ? $t('userSection.registering') : $t('userSection.signUp') }}</span>
            <span class="submit-glow"></span>
          </button>

          <div class="divider">
            <span>{{ $t('common.or') }}</span>
          </div>

          <button class="google-auth" @click="LoginWithGoogle" :disabled="isLoading">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{{ isLoading ? $t('common.loading') : $t('userSection.continueWithGoogle') }}</span>
          </button>

          <p class="switch-text">
            {{ $t('userSection.alreadyHaveAccount') }}
            <span class="switch-link" @click="switchAuth('Login')">{{ $t('userSection.signIn') }}</span>
          </p>
        </div>

        <div v-else class="auth-form">
          <div class="modal-header">
            <h2>{{ $t('userSection.welcomeBack') }}</h2>
            <p class="modal-subtitle">{{ $t('userSection.continuelearning') }}</p>
          </div>

          <div class="form-group">
            <input v-model="Login.email" type="email" :placeholder="$t('userSection.email')" :disabled="isLoading" class="form-input" />
          </div>
          <div class="form-group">
            <input v-model="Login.password" type="password" :placeholder="$t('userSection.password')" :disabled="isLoading" class="form-input" />
          </div>

          <button class="auth-submit" @click="handleEmailLogin" :disabled="isLoading">
            <span>{{ isLoading ? $t('userSection.signingIn') : $t('userSection.signIn') }}</span>
            <span class="submit-glow"></span>
          </button>

          <div class="divider">
            <span>{{ $t('common.or') }}</span>
          </div>

          <button class="google-auth" @click="LoginWithGoogle" :disabled="isLoading">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{{ isLoading ? $t('common.loading') : $t('userSection.continueWithGoogle') }}</span>
          </button>

          <p class="switch-text">
            {{ $t('userSection.dontHaveAccount') }}
            <span class="switch-link" @click="switchAuth('register')">{{ $t('userSection.signUp') }}</span>
          </p>
        </div>

        <div v-if="errorMessage" class="error-message">
          <span class="message-icon">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="success-message">
          <span class="message-icon">✓</span>
          <span>{{ successMessage }}</span>
        </div>
      </div>
    </div>

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
import { useI18n } from 'vue-i18n';
import AcedSettings from "@/components/Main/AcedSettings.vue";
import LanguageSwitcher from "@/components/LanguageSwitcher.vue";

export default {
  components: { AcedSettings, LanguageSwitcher },

  setup() {
    const { t } = useI18n();
    return { t };
  },

  data() {
    return {
      isModalOpen: false,
      authMode: "register",
      dropdownOpen: false,
      showSettings: false,
      isLoading: false,
      errorMessage: '',
      successMessage: '',
      loadingMessage: '',
      user: { name: "", surname: "", email: "", password: "", confirmPassword: "" },
      Login: { email: "", password: "" },
    };
  },

  computed: {
    ...mapGetters(["getUser"]),
    ...mapGetters('user', ['userStatus', 'subscription', 'forceUpdateKey']),
    currentUser() {
      return this.getUser;
    },
    displayPlan() {
      const plan = this.userStatus ||
                   this.$store?.state?.user?.userStatus ||
                   this.currentUser?.subscriptionPlan ||
                   localStorage.getItem("userStatus") ||
                   localStorage.getItem("plan") ||
                   'free';
      return plan.toUpperCase();
    },
    planClass() {
      const plan = (this.userStatus ||
                    this.$store?.state?.user?.userStatus ||
                    this.currentUser?.subscriptionPlan ||
                    localStorage.getItem("userStatus") ||
                    localStorage.getItem("plan") ||
                    'free').toLowerCase();
      return `badge-${plan}`;
    }
  },

  mounted() {
    this.loadingMessage = this.$t('common.loading');

    onAuthStateChanged(auth, (user) => {
      if (user && !this.currentUser) {
        this.handleAuthStateChange(user);
      }
    });

    window.addEventListener("open-Login-modal", () => {
      this.openModal("Login");
    });

    window.addEventListener('userStatusChanged', this.handleStatusUpdate);
    window.addEventListener('subscriptionUpdated', this.handleStatusUpdate);
    window.addEventListener('forceUpdate', this.handleStatusUpdate);

    document.addEventListener('click', (event) => {
      if (!this.$el.contains(event.target)) {
        this.dropdownOpen = false;
      }
    });
  },

  beforeUnmount() {
    window.removeEventListener('userStatusChanged', this.handleStatusUpdate);
    window.removeEventListener('subscriptionUpdated', this.handleStatusUpdate);
    window.removeEventListener('forceUpdate', this.handleStatusUpdate);
  },

  methods: {
    ...mapMutations(["setUser", "setFirebaseUserId", "setToken"]),
    ...mapActions(["LoginUser", "logoutUser"]),

    handleStatusUpdate() {
      this.$forceUpdate();
    },

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

        const response = await axios({
          method: 'POST',
          url: `${apiBase}/api/users/save`,
          data: userData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        });

        if (response.data && response.data.success !== false) {
          const savedUser = response.data.user || response.data.data || response.data;
          return {
            success: true,
            user: savedUser,
            source: 'backend'
          };
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

        return {
          success: true,
          user: fallbackUser,
          source: 'firebase-only',
          warning: 'Backend synchronization failed, using Firebase-only mode'
        };
      }
    },

    async handleAuthStateChange(firebaseUser) {
      try {
        this.loadingMessage = this.$t('common.loading');
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
          this.showError(this.$t('errors.loginError'));
        }
      }
    },

    async handleEmailLogin() {
      if (!this.Login.email || !this.Login.password) {
        this.showError(this.$t('errors.fillAllFields'));
        return;
      }
      this.isLoading = true;
      this.clearMessages();
      this.loadingMessage = this.$t('userSection.signingIn');
      try {
        const result = await signInWithEmailAndPassword(auth, this.Login.email, this.Login.password);
        this.loadingMessage = this.$t('common.loading');
        await this.handleAuthStateChange(result.user);
        this.showSuccess(this.$t('success.signedIn'));
        setTimeout(() => {
          this.closeModal();
        }, 1000);
      } catch (error) {
        let errorMsg = this.$t('errors.loginError');
        if (error.code === 'auth/user-not-found') {
          errorMsg = this.$t('errors.userNotFound');
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMsg = this.$t('errors.invalidPassword');
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = this.$t('errors.invalidEmail');
        } else if (error.code === 'auth/too-many-requests') {
          errorMsg = this.$t('errors.tooManyAttempts');
        } else if (error.code === 'auth/user-disabled') {
          errorMsg = this.$t('errors.accountDisabled');
        } else if (error.code === 'auth/network-request-failed') {
          errorMsg = this.$t('errors.networkError');
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
      this.loadingMessage = this.$t('common.loading');
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        this.loadingMessage = this.$t('common.loading');
        await this.handleAuthStateChange(result.user);
        this.showSuccess(this.$t('success.signedInGoogle'));
        setTimeout(() => {
          this.closeModal();
          this.$router.push("/profile");
        }, 1000);
      } catch (error) {
        let errorMsg = this.$t('errors.googleSignInError');
        if (error.code === 'auth/popup-closed-by-user') {
          errorMsg = this.$t('errors.popupClosed');
        } else if (error.code === 'auth/popup-blocked') {
          errorMsg = this.$t('errors.popupBlocked');
        } else if (error.code === 'auth/network-request-failed') {
          errorMsg = this.$t('errors.networkError');
        }
        this.showError(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    async register() {
      if (!this.user.name || !this.user.email || !this.user.password) {
        this.showError(this.$t('errors.fillAllFields'));
        return;
      }
      if (this.user.password !== this.user.confirmPassword) {
        this.showError(this.$t('errors.passwordsMismatch'));
        return;
      }
      if (this.user.password.length < 6) {
        this.showError(this.$t('errors.passwordMinLength'));
        return;
      }
      this.isLoading = true;
      this.clearMessages();
      this.loadingMessage = this.$t('userSection.registering');
      try {
        const result = await createUserWithEmailAndPassword(auth, this.user.email, this.user.password);
        const firebaseUser = result.user;
        this.loadingMessage = this.$t('common.loading');
        const registrationData = {
          name: this.user.name,
          surname: this.user.surname,
          subscriptionPlan: 'free'
        };
        const token = await firebaseUser.getIdToken(true);
        const saveResult = await this.saveUserToBackend(firebaseUser, token, registrationData);
        const userData = {
          name: saveResult.user.name || this.user.name,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          subscriptionPlan: saveResult.user.subscriptionPlan || 'free',
          ...saveResult.user
        };
        this.setUserData(userData, firebaseUser.uid, token);
        this.showSuccess(this.$t('success.registrationSuccess'));
        setTimeout(() => {
          this.closeModal();
        }, 1500);
      } catch (error) {
        let errorMsg = this.$t('errors.registrationError');
        if (error.code === 'auth/email-already-in-use') {
          errorMsg = this.$t('errors.emailInUse');
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = this.$t('errors.invalidEmail');
        } else if (error.code === 'auth/weak-password') {
          errorMsg = this.$t('errors.weakPassword');
        } else if (error.code === 'auth/network-request-failed') {
          errorMsg = this.$t('errors.networkError');
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  font-family: 'Inter', sans-serif;
}

/* User Section Wrapper */
.user-section-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Auth Buttons */
.auth-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.auth-btn {
  position: relative;
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-btn {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  color: #0a0a0a;
  border: 1.5px solid rgba(139, 92, 246, 0.2);
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
}

.login-btn .btn-icon {
  transition: transform 0.3s ease;
}

.login-btn:hover .btn-icon {
  transform: translateX(4px);
}

.register-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.register-btn:hover .btn-glow {
  opacity: 1;
}

/* User Section */
.user-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.profile-btn {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  color: #0a0a0a;
  border: 1.5px solid rgba(139, 92, 246, 0.2);
}

.profile-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
}

.profile-icon {
  font-size: 1.125rem;
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(25px);
  border: 1.5px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  color: #0a0a0a;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.1);
}

.user-button:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.2);
}

.user-button.active {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
}

.user-greeting {
  font-weight: 600;
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-free {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge-pro {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.dropdown-arrow {
  font-size: 0.625rem;
  transition: transform 0.3s ease;
  color: #737373;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(139, 92, 246, 0.2);
  overflow: hidden;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.dropdown-menu.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.dropdown-menu ul {
  list-style: none;
  padding: 8px;
  margin: 0;
}

.dropdown-menu li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #404040;
  transition: all 0.2s ease;
}

.dropdown-menu li:hover {
  background: rgba(139, 92, 246, 0.08);
  color: #7c3aed;
  transform: translateX(4px);
}

.menu-icon {
  font-size: 1.125rem;
}

/* Global Auth Modal - below language switcher dropdown */
.global-auth-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2147483640; /* Below language dropdown (2147483647) but above everything else */
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  position: relative;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(40px);
  border: 2px solid rgba(139, 92, 246, 0.15);
  border-radius: 24px;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  box-shadow: 0 24px 64px rgba(139, 92, 246, 0.25);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  color: #666;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #000;
  transform: rotate(90deg);
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.modal-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.modal-subtitle {
  color: #666;
  font-size: 0.9375rem;
}

.form-group {
  margin-bottom: 16px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  background: #f9fafb;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #8b5cf6;
  background: white;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

.auth-submit {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.auth-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.auth-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 24px 0;
  color: #9ca3af;
  font-size: 0.875rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.divider span {
  padding: 0 12px;
}

.google-auth {
  width: 100%;
  padding: 12px;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.google-auth:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.google-icon {
  width: 20px;
  height: 20px;
}

.switch-text {
  text-align: center;
  margin-top: 24px;
  color: #6b7280;
  font-size: 0.9375rem;
}

.switch-link {
  color: #8b5cf6;
  font-weight: 600;
  cursor: pointer;
  margin-left: 4px;
  transition: color 0.2s ease;
}

.switch-link:hover {
  color: #7c3aed;
  text-decoration: underline;
}

.error-message,
.success-message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.loading-state {
  text-align: center;
  padding: 40px 0;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 480px) {
  .modal-content {
    padding: 24px;
    margin: 16px;
    width: auto;
  }

  .auth-buttons .btn-text {
    display: none;
  }

  .auth-btn {
    padding: 10px;
  }

  .user-greeting {
    display: none;
  }
}
</style>
