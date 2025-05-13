<template>
  <div class="sidebar-wrapper">
    <div class="sidebar open">
      <div class="sidebar-content">
        <!-- 👤 User Info -->
        <div class="user-info" v-if="user">
          <img src="@/assets/icons/user.png" alt="User Icon" class="user-icon" />
          <span class="user-name">{{ user.name || user.email }}</span>
        </div>

        <!-- 📚 Navigation Links -->
       <!-- 📚 Navigation Links -->
<div class="nav-links">
  <router-link
    to="/profile/main"
    class="nav-item"
    :class="{ active: isActive('main') }"
  >
    <span class="highlight"></span>
    Главная
  </router-link>

  <router-link
    to="/profile/catalogue"
    class="nav-item"
    :class="{ active: isActive('catalogue') }"
  >
    <span class="highlight"></span>
    Каталог
  </router-link>

  <router-link
    v-for="link in links"
    :key="link.name"
    :to="link.name === 'settings' ? `/${link.name}` : `/profile/${link.name}`"
    class="nav-item"
    :class="{ active: isActive(link.name) }"
  >
    <span class="highlight"></span>
    {{ link.label }}
  </router-link>
</div>


        <!-- 🚪 Logout -->
        <div class="bottom-logout">
          <button class="logout-button" @click="showLogoutModal = true">Выйти</button>
        </div>
      </div>
    </div>

    <!-- 🔐 Confirm Logout Modal -->
    <div class="logout-modal" v-if="showLogoutModal">
      <div class="logout-modal-content">
        <p>Вы уверены, что хотите выйти?</p>
        <div class="logout-actions">
          <button class="confirm-btn" @click="logout">Да</button>
          <button class="cancel-btn" @click="showLogoutModal = false">Нет</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'SideBar',
  data() {
    return {
      showLogoutModal: false,
      links: [
        { name: 'analytics', label: 'Аналитика' },
        { name: 'goal', label: 'Цели' },
        { name: 'diary', label: 'Дневник' },
        { name: 'homework', label: 'Помощь с ДЗ' },
        { name: 'settings', label: 'Настройки' } // ✅ Added
      ]
    };
  },
  computed: {
    ...mapState(['user'])
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setUser({
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          uid: user.uid,
          subscriptionPlan: localStorage.getItem('plan') || 'start'
        });
      }
    });
  },
  methods: {
    ...mapMutations(['setUser', 'clearUser']),
    logout() {
      signOut(auth)
        .then(() => {
          this.clearUser();
          this.$toast.success('Вы успешно вышли из аккаунта.', {
            duration: 3000,
            position: 'top-center'
          });
          setTimeout(() => {
            this.$router.push('/');
          }, 1500);
        })
        .catch((err) => {
          console.error('❌ Ошибка выхода:', err.message);
          this.$toast.error('Ошибка при выходе: попробуйте ещё раз.');
        });
    },
    isActive(name) {
      const path = this.$route.path;
      if (name === 'main') return path === '/profile/main';
      if (name === 'catalogue') return path === '/profile/catalogue';
      if (name === 'settings') return path === '/settings';
      return path.includes(`/profile/${name}`);
    }
  }
};
</script>

<style scoped>
/* same beautiful styles unchanged */
.sidebar-wrapper {
  position: relative;
}
.sidebar {
  width: 250px;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #ffffff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.06);
  padding: 20px 0;
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  color: #111827;
}
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.user-info {
  padding: 40px 20px 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #eee;
}
.user-icon {
  width: 32px;
  height: 32px;
}
.user-name {
  font-weight: 700;
  font-size: 1rem;
}
.nav-links {
  flex-grow: 1;
  padding: 30px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.nav-item {
  font-size: 0.95rem;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  transition: 0.3s;
  color: #111827;
  text-decoration: none;
  background-color: #f9fafb;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}
.nav-item:hover {
  background: linear-gradient(to right, #ede9fe, #f0f5ff);
  color: #4f46e5;
  transform: translateX(6px);
}
.nav-item .highlight {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(to bottom, #6366f1, #8b5cf6);
  border-radius: 2px;
}
.nav-item.active {
  background: linear-gradient(to right, #ede9fe, #f0f5ff);
  color: #4f46e5;
  transform: translateX(6px);
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
}
.bottom-logout {
  padding: 30px 20px;
}
.logout-button {
  padding: 10px 16px;
  background: #ef4444;
  color: white;
  border: none;
  font-size: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Unbounded', sans-serif;
  transition: 0.3s;
}
.logout-button:hover {
  background: #dc2626;
}
.logout-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.logout-modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  font-family: 'Unbounded', sans-serif;
}
.logout-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
.confirm-btn,
.cancel-btn {
  padding: 10px 20px;
  font-size: 0.9rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.confirm-btn {
  background: red;
  color: white;
}
.cancel-btn {
  background: #ccc;
  color: #222;
}
</style>
