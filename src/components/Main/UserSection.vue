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
        <span v-if="currentUser.subscriptionPlan" class="badge">
          {{ currentUser.subscriptionPlan === 'pro' ? 'PRO' : 'START' }}
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
    };
  },

  computed: {
    ...mapGetters(["getUser"]),
    currentUser() {
      return this.getUser;
    },
  },

  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Firebase auth state detected user:", user);
        this.setUser({
          name: user.displayName || user.email,
          email: user.email,
          subscriptionPlan: localStorage.getItem("plan") || "start",
          uid: user.uid,
        });
      } else {
        console.warn("🚫 No Firebase user detected. Logging out...");
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
      console.log("🔓 Opening modal in mode:", mode);
      this.authMode = mode;
      this.isModalOpen = true;
    },
    closeModal() {
      console.log("❌ Closing modal");
      this.isModalOpen = false;
      this.resetForms();
    },
    switchAuth(mode) {
      console.log("🔄 Switching auth mode to:", mode);
      this.authMode = mode;
      this.resetForms();
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },

    async loginWithGoogle() {
      console.log("🔐 Logging in with Google...");
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const userData = {
          name: result.user.displayName || result.user.email,
          email: result.user.email,
          uid: result.user.uid,
          subscriptionPlan: localStorage.getItem("plan") || "start",
        };
        console.log("✅ Google login success:", userData);
        await this.loginUser({ userData, token: "token-placeholder" }); // now calls Vuex action ✅
        this.closeModal();
      } catch (error) {
        console.error("❌ Google login error:", error);
        alert("Ошибка входа через Google: " + error.message);
      }
    },

    async handleEmailLogin() {
      console.log("🔐 Email login started with:", this.login.email);
      if (!this.login.email || !this.login.password) {
        alert("❗ Введите email и пароль");
        return;
      }
      try {
        const result = await signInWithEmailAndPassword(auth, this.login.email, this.login.password);
        const userData = {
          name: result.user.displayName || result.user.email,
          email: result.user.email,
          uid: result.user.uid,
          subscriptionPlan: localStorage.getItem("plan") || "start",
        };
        console.log("✅ Email login success:", userData);
        await this.loginUser({ userData, token: "token-placeholder" }); // now works as Vuex action ✅
        this.closeModal();
      } catch (error) {
        console.error("❌ Email login failed:", error);
        alert("Ошибка входа: " + error.message);
      }
    },

    async register() {
      console.log("📝 Attempting registration for:", this.user.email);
      if (this.user.password !== this.user.confirmPassword) {
        console.warn("⚠️ Passwords do not match!");
        alert("Пароли не совпадают!");
        return;
      }
      try {
        const result = await createUserWithEmailAndPassword(auth, this.user.email, this.user.password);
        const userData = {
          name: this.user.name,
          email: this.user.email,
          uid: result.user.uid,
          subscriptionPlan: localStorage.getItem("plan") || "start",
        };
        console.log("✅ Registration successful:", userData);
        await this.loginUser({ userData, token: "token-placeholder" }); // call Vuex action ✅
        alert("Вы успешно зарегистрированы!");
        this.closeModal();
      } catch (error) {
        console.error("❌ Registration error:", error);
        alert("Ошибка регистрации: " + error.message);
      }
    },

    logout() {
      console.log("🚪 Logging out...");
      auth.signOut().then(() => {
        this.logoutUser();
        this.dropdownOpen = false;
        console.log("✅ Successfully logged out");
      });
    },

    resetForms() {
      console.log("🔄 Resetting auth forms");
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
