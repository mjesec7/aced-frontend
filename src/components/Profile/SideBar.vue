<template>
  <div class="sidebar-wrapper">
    <!-- Right-side Toggle Button -->
    <button class="toggle-btn" @click="toggleSidebar">
      {{ isOpen ? '×' : '☰' }}
    </button>

    <!-- Sidebar -->
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <div class="user-name" v-if="userName">
          👤 {{ userName }}
        </div>

        <div class="nav-links">
          <router-link
            v-for="link in links"
            :key="link.name"
            :to="`/profile/${link.name}`"
            class="nav-item"
          >
            {{ link.label }}
          </router-link>
        </div>

        <div class="bottom-logout">
          <button class="logout-button" @click="showLogoutModal = true">Выйти</button>
        </div>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
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
      isOpen: false,
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
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&display=swap');

.sidebar-wrapper {
  position: relative;
}

.sidebar {
  width: 250px;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background-color: #ffffff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  padding: 20px;
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  transform: translateX(-100%);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.toggle-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ffffff;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 1100;
}

.user-name {
  padding: 80px 20px 20px;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.nav-links {
  display: flex;
  flex-direction: column;
  padding: 10px 10px 0;
  align-items: flex-start;
  gap: 10px;
}

.nav-item {
  font-size: 0.88rem;
  padding: 8px 0;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  transition: 0.3s;
  color: #222;
  text-decoration: none;
}

.nav-item:hover {
  background: none;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(90deg, #5b21b6, #7e22ce);
}

.bottom-logout {
  margin-top: 40px;
}

.logout-button {
  padding: 10px 15px;
  background: red;
  color: white;
  border: none;
  font-size: 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Unbounded', sans-serif;
  margin-left: 20px;
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