<template>
  <div>
    <!-- Authentication Buttons -->
    <div v-if="!currentUser" class="auth-buttons">
      <button class="auth-button" @click="openModal('register')">Регистрация</button>
      <button class="auth-button" @click="openModal('login')">Вход</button>
    </div>

    <!-- User Dropdown if Logged In -->
    <div v-else class="user-menu">
      <button class="user-button" @click="toggleDropdown">
        Привет, {{ currentUser?.name || 'Пользователь' }}
      </button>
      <div v-if="dropdownOpen" class="dropdown-menu">
        <ul>
          <li @click="$router.push('/profile')">Профиль</li>
          <li @click="$router.push('/settings')">Настройки</li>
          <li>Прогресс</li>
          <li @click="logout">Выйти</li>
        </ul>
      </div>
    </div>

    <!-- Authentication Modal (Centered on Screen) -->
    <div v-if="isModalOpen" class="global-auth-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <span class="close-btn" @click="closeModal">&times;</span>

        <div v-if="authMode === 'register'">
          <h2>Регистрация</h2>
          <input id="name" name="name" type="text" v-model="user.name" placeholder="Имя" required />
          <input id="surname" name="surname" type="text" v-model="user.surname" placeholder="Фамилия" required />
          <input id="email" name="email" type="email" v-model="user.email" placeholder="Email" required />
          <input id="password" name="password" type="password" v-model="user.password" placeholder="Пароль" required />
          <input id="confirmPassword" name="confirmPassword" type="password" v-model="user.confirmPassword" placeholder="Повторите пароль" required />
          <button class="auth-submit" @click="register">Зарегистрироваться</button>
          <p class="switch-text">Уже есть аккаунт? <span @click="switchAuth('login')">Войти</span></p>
        </div>

        <div v-else>
          <h2>Вход</h2>
          <input id="loginEmail" name="loginEmail" type="email" v-model="login.email" placeholder="Email" required />
          <input id="loginPassword" name="loginPassword" type="password" v-model="login.password" placeholder="Пароль" required />
          <button class="auth-submit" @click="loginUser">Войти</button>
          <button class="google-auth" @click="loginWithGoogle">Войти через Google</button>
          <p class="switch-text">Нет аккаунта? <span @click="switchAuth('register')">Зарегистрироваться</span></p>
        </div>
      </div>
    </div>

    <!-- Settings Component -->
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
import AcedSettings from "@/components/Main/AcedSettings.vue";

export default {
  components: { AcedSettings },
  data() {
    return {
      isModalOpen: false,
      authMode: "register",
      user: { name: "", surname: "", email: "", password: "", confirmPassword: "" },
      login: { email: "", password: "" },
      currentUser: null,
      dropdownOpen: false,
      showSettings: false,
    };
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user ? { name: user.displayName || user.email } : null;
    });

    window.addEventListener("open-login-modal", () => {
      this.openModal("login");
    });
  },
  methods: {
    openModal(mode) {
      this.isModalOpen = false;
      this.$nextTick(() => {
        this.authMode = mode;
        this.isModalOpen = true;
      });
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
    openSettings() {
      this.showSettings = true;
      this.dropdownOpen = false;
    },
    async loginWithGoogle() {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        this.currentUser = { name: result.user.displayName };
        this.closeModal();
      } catch (error) {
        alert("Ошибка входа через Google: " + error.message);
      }
    },
    async loginUser() {
      try {
        await signInWithEmailAndPassword(auth, this.login.email, this.login.password);
        this.currentUser = { name: this.login.email };
        this.closeModal();
      } catch (error) {
        alert("Ошибка входа: " + error.message);
      }
    },
    async register() {
      if (this.user.password !== this.user.confirmPassword) {
        alert("Пароли не совпадают!");
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, this.user.email, this.user.password);
        this.currentUser = { name: this.user.name };
        alert("Вы успешно зарегистрированы!");
        this.closeModal();
      } catch (error) {
        alert("Ошибка регистрации: " + error.message);
      }
    },
    logout() {
      auth.signOut().then(() => {
        this.currentUser = null;
        this.dropdownOpen = false;
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
@import "../../assets/css/UserSection.css";
</style>
