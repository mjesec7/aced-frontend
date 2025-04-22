<template>
  <div class="sidebar-wrapper">
    <button class="toggle-btn" @click="toggleSidebar">
      <span v-if="!isOpen">☰</span>
      <span v-else>✕</span>
    </button>

    <transition name="fade">
      <aside class="sidebar" :class="{ open: isOpen }">
        <div class="sidebar-content">
          <div class="user-info" v-if="userName">
            <span class="avatar">👤</span>
            <span class="user-name">{{ userName }}</span>
          </div>

          <nav class="nav-links">
            <router-link
              v-for="link in links"
              :key="link.name"
              :to="`/profile/${link.name}`"
              class="nav-item"
              active-class="active"
            >
              {{ link.label }}
            </router-link>
          </nav>

          <div class="logout-wrapper">
            <button class="logout-button" @click="showLogoutModal = true">
              Выйти
            </button>
          </div>
        </div>
      </aside>
    </transition>

    <!-- Logout Modal -->
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
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';

export default {
  name: 'SideBar',
  data() {
    return {
      isOpen: true,
      showLogoutModal: false,
      userName: '',
      links: [
        { name: 'free', label: 'Бесплатные Уроки' },
        { name: 'premium', label: 'Премиум Уроки' },
        { name: 'analytics', label: 'Аналитика' },
        { name: 'progress', label: 'Прогресс' },
        { name: 'goal', label: 'Цели' },
        { name: 'plan', label: 'План обучения' },
        { name: 'homework', label: 'Помощь с ДЗ' }
      ]
    };
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.userName = user.displayName || user.email;
      }
    });
  },
  methods: {
    toggleSidebar() {
      this.isOpen = !this.isOpen;
    },
    logout() {
      signOut(auth)
        .then(() => {
          this.userName = '';
          window.location.href = 'https://aced.live';
        })
        .catch((err) => {
          console.error('Ошибка выхода:', err.message);
        });
    }
  }
};
</script>

<style scoped>
.sidebar-wrapper {
  position: relative;
}

.toggle-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  background: #7c3aed;
  color: white;
  border: none;
  padding: 10px 14px;
  font-size: 20px;
  border-radius: 10px;
  cursor: pointer;
  z-index: 2000;
  transition: all 0.3s;
}

.sidebar {
  width: 260px;
  height: 100vh;
  background: white;
  position: fixed;
  top: 0;
  left: 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.08);
  z-index: 1500;
  transition: all 0.3s;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 30px 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #333;
}

.avatar {
  font-size: 24px;
}

.nav-links {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-item {
  text-decoration: none;
  color: #444;
  font-weight: 500;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-item:hover,
.nav-item.active {
  background: linear-gradient(to right, #7c3aed, #a855f7);
  color: white;
}

.logout-wrapper {
  margin-top: auto;
  padding-top: 40px;
}

.logout-button {
  background: #ef4444;
  border: none;
  color: white;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.logout-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.logout-modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
  font-size: 0.95rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.confirm-btn {
  background: #ef4444;
  color: white;
}

.cancel-btn {
  background: #ddd;
  color: #333;
}
</style>
