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
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500&display=swap');

.sidebar-wrapper {
  font-family: 'Unbounded', sans-serif;
  position: relative;
}

.sidebar {
  width: 240px;
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.03);
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 1000;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 28px 24px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.user-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  background: #f3f4f6;
  border: 1.5px solid #e0e7ff;
}

.user-details {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: #1e293b;
}

.user-name {
  font-weight: 500;
  font-size: 0.9rem;
  color: #1f2937;
}

.user-plan {
  font-size: 0.7rem;
  margin-top: 2px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.nav-links {
  flex-grow: 1;
  padding: 30px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nav-item {
  padding: 10px 16px;
  font-size: 0.9rem;
  color: #334155;
  background: #f9fafb;
  border-radius: 12px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: linear-gradient(to right, #ede9fe, #f0f5ff);
  transform: translateX(4px);
  color: #6d28d9;
  box-shadow: 0 4px 8px rgba(109, 40, 217, 0.08);
}

.nav-item.active {
  background: linear-gradient(to right, #ede9fe, #f0f5ff);
  color: #6d28d9;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.15);
}

.nav-item .highlight {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(to bottom, #8b5cf6, #7c3aed);
  border-radius: 2px;
}

.bottom-logout {
  padding: 24px;
  border-top: 1px solid #e2e8f0;
}

.logout-button {
  width: 100%;
  background: #f87171;
  color: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.logout-button:hover {
  background: #ef4444;
}

.logout-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.logout-modal-content {
  background: #ffffff;
  padding: 30px;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 360px;
  width: 90%;
  animation: fadeIn 0.3s ease-in-out;
}

.logout-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 14px;
}

.confirm-btn,
.cancel-btn {
  padding: 10px 20px;
  font-size: 0.9rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.confirm-btn {
  background: #ef4444;
  color: white;
}

.confirm-btn:hover {
  background: #dc2626;
}

.cancel-btn {
  background: #e2e8f0;
  color: #1f2937;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
