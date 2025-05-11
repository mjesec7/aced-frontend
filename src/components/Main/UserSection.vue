<template>
  <div>
    <!-- 🔐 Auth buttons -->
    <div v-if="!currentUser" class="auth-buttons">
      <button class="auth-button" @click="openModal('register')">Регистрация</button>
      <button class="auth-button" @click="openModal('login')">Вход</button>
    </div>

    <!-- 👤 User Info -->
    <div v-else class="user-menu">
      <button class="user-button" @click="toggleDropdown">
        Привет, {{ currentUser.name }}
        <span class="badge">
          {{ displayPlan }}
        </span>
      </button>
      <div v-if="dropdownOpen" class="dropdown-menu">
        <ul>
          <li @click="$router.push('/profile')">Профиль</li>
          <li @click="$router.push('/settings')">Настройки</li>
          <li @click="logout">Выйти</li>
        </ul>
      </div>
    </div>

    <!-- 🪪 Modal -->
    <div v-if="isModalOpen" class="global-auth-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <span class="close-btn" @click="closeModal">&times;</span>

        <!-- 👤 Register Form -->
        <div v-if="authMode === 'register'">
          <h2>Регистрация</h2>
          <input v-model="user.name" placeholder="Имя" />
          <input v-model="user.surname" placeholder="Фамилия" />
          <input v-model="user.email" type="email" placeholder="Email" />
          <input v-model="user.password" type="password" placeholder="Пароль" />
          <input v-model="user.confirmPassword" type="password" placeholder="Повторите пароль" />
          <button class="auth-submit" @click="register">Зарегистрироваться</button>
          <p class="switch-text">Уже есть аккаунт? <span @click="switchAuth('login')">Войти</span></p>
        </div>

        <!-- 🔐 Login Form -->
        <div v-else>
          <h2>Вход</h2>
          <input v-model="login.email" type="email" placeholder="Email" />
          <input v-model="login.password" type="password" placeholder="Пароль" />
          <button class="auth-submit" @click="handleEmailLogin">Войти</button>
          <button class="google-auth" @click="loginWithGoogle">Войти через Google</button>
          <p class="switch-text">Нет аккаунта? <span @click="switchAuth('register')">Зарегистрироваться</span></p>
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
  onAuthStateChanged,
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
      user: { name: "", surname: "", email: "", password: "", confirmPassword: "" },
      login: { email: "", password: "" },
      loggingIn: false,
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
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${user.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { name, subscriptionPlan } = res.data;
          this.setUser({
            name: name || user.email,
            email: user.email,
            uid: user.uid,
            subscriptionPlan: subscriptionPlan || 'free',
          });
          localStorage.setItem('plan', subscriptionPlan || 'free');
        } catch (err) {
          console.warn('⚠️ Не удалось получить данные пользователя:', err);
        }
      } else {
        this.logoutUser();
      }
    });

    window.addEventListener("open-login-modal", () => {
      this.openModal("login");
    });
  },

  methods: {
    ...mapMutations(["setUser"]),
    ...mapActions(["loginUser", "logoutUser"]),

    openModal(mode) {
      this.authMode = mode;
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
      this.resetForms();
    },
    switchAuth(mode) {
      this.authMode = mode;
      this.resetForms();
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },
    async loginWithGoogle() {
      if (this.loggingIn) return;
      this.loggingIn = true;

      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const token = await user.getIdToken(true);

        const apiBase = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(`${apiBase}/users/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const subscriptionPlan = res.data.subscriptionPlan || 'free';
        const name = res.data.name || user.displayName || user.email;

        await axios.post(`${apiBase}/users/save`, {
          token,
          name,
          subscriptionPlan,
        });

        localStorage.setItem("firebaseUserId", user.uid);
        localStorage.setItem("userId", user.uid);
        localStorage.setItem("plan", subscriptionPlan);
        this.setUser({ name, email: user.email, subscriptionPlan, uid: user.uid });

        if (this.$store && this.$store.commit) {
          this.$store.commit("setFirebaseUserId", user.uid);
        }

        this.$router.push("/profile");
      } catch (error) {
        console.error("❌ Google login error:", error);
        alert("❌ Ошибка входа через Google. Попробуйте снова.");
      } finally {
        this.loggingIn = false;
      }
    },

    async handleEmailLogin() {
      if (!this.login.email || !this.login.password) {
        alert("❗ Введите email и пароль");
        return;
      }
      try {
        const result = await signInWithEmailAndPassword(auth, this.login.email, this.login.password);
        const token = await result.user.getIdToken();
        const apiBase = import.meta.env.VITE_API_BASE_URL;

        const res = await axios.get(`${apiBase}/users/${result.user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { name, subscriptionPlan } = res.data;

        const userData = {
          name: name || result.user.email,
          email: result.user.email,
          uid: result.user.uid,
          subscriptionPlan: subscriptionPlan || 'free',
        };

        localStorage.setItem("plan", userData.subscriptionPlan);
        await this.loginUser({ userData, token });
        this.closeModal();
      } catch (error) {
        console.error("❌ Email login failed:", error);
        alert("Ошибка входа: " + error.message);
      }
    },

    async register() {
      if (this.user.password !== this.user.confirmPassword) {
        alert("Пароли не совпадают!");
        return;
      }
      try {
        const result = await createUserWithEmailAndPassword(auth, this.user.email, this.user.password);
        const token = await result.user.getIdToken();

        const userData = {
          name: this.user.name,
          email: this.user.email,
          uid: result.user.uid,
          subscriptionPlan: 'free'
        };

        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users/save`, {
          token,
          name: userData.name,
          subscriptionPlan: 'free',
        });

        localStorage.setItem("plan", 'free');
        await this.loginUser({ userData, token });
        alert("Вы успешно зарегистрированы!");
        this.closeModal();
      } catch (error) {
        console.error("❌ Registration error:", error);
        alert("Ошибка регистрации: " + error.message);
      }
    },

    logout() {
      auth.signOut().then(() => {
        this.logoutUser();
        this.dropdownOpen = false;
        localStorage.removeItem("plan");
      });
    },

    resetForms() {
      this.user = { name: "", surname: "", email: "", password: "", confirmPassword: "" };
      this.login = { email: "", password: "" };
    },
  },
};
</script>

<style scoped>
@import "@/assets/css/UserSection.css";

.badge {
  margin-left: 8px;
  background-color: #9333ea;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
}
</style>
