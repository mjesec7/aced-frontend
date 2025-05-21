<template>
  <div class="sidebar-wrapper">
    <div class="sidebar open">
      <div class="sidebar-content">
        <!-- 👤 User Info -->
        <div class="user-info" v-if="user">
          <img src="@/assets/icons/user.png" alt="User Icon" class="user-icon" />
          <div class="user-details">
            <span class="user-name">{{ user.name || user.email }}</span>
            <span class="user-plan">📦 {{ planLabel }}</span>
          </div>
        </div>

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
import { mapState, mapMutations, mapGetters } from 'vuex';

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
        { name: 'settings', label: 'Настройки' }
      ]
    };
  },
  computed: {
    ...mapState(['user']),
    ...mapGetters('user', ['userStatus']),
    planLabel() {
      if (this.userStatus === 'pro') return 'Pro';
      if (this.userStatus === 'start') return 'Start';
      return 'Free';
    }
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setUser({
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          uid: user.uid
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
.sidebar-wrapper {
  position: relative;
}

.sidebar {
  width: 240px;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #ffffff;
  border-top-right-radius: 24px;
  border-bottom-right-radius: 24px;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
  padding: 30px 0;
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  color: #111827;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-family: 'Inter', sans-serif;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.user-info {
  padding: 20px 24px 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 1rem;
  color: #111827;
  border-bottom: 1px solid #f1f5f9;
}

.user-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  background: #f3f4f6;
  border: 2px solid #c7d2fe;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 700;
  font-size: 1rem;
  color: #1f2937;
}

.user-plan {
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 2px;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
}

.nav-links {
  flex-grow: 1;
  padding: 30px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-item {
  font-size: 0.95rem;
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 500;
  color: #111827;
  text-decoration: none;
  display: flex;
  align-items: center;
  position: relative;
  transition: 0.25s;
}

.nav-item:hover {
  background: #f3f4f6;
  transform: translateX(6px);
}

.nav-item.active {
  background: linear-gradient(to right, #8b5cf6, #7c3aed);
  color: white;
  font-weight: 700;
  transform: translateX(6px);
}

.nav-item.active .highlight {
  display: none;
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

.bottom-logout {
  padding: 30px 20px;
  border-top: 1px solid #f1f5f9;
}

.logout-button {
  padding: 10px 16px;
  background: #ef4444;
  color: white;
  border: none;
  font-size: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: 0.3s;
  width: 100%;
  font-weight: 700;
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
  font-family: 'Inter', sans-serif;
  max-width: 380px;
  width: 90%;
  animation: fadeIn 0.3s ease-in-out;
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
  transition: all 0.2s ease;
  font-weight: 600;
}

.confirm-btn {
  background: #ef4444;
  color: white;
}

.cancel-btn {
  background: #e5e7eb;
  color: #1f2937;
}

.confirm-btn:hover {
  background: #dc2626;
}

.cancel-btn:hover {
  background: #d1d5db;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
