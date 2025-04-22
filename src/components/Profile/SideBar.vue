<template>
  <div class="sidebar-wrapper">
    <!-- Sidebar -->
    <div class="sidebar open">
      <div class="sidebar-content">
        <div class="user-info" v-if="userName">
          <img src="@/assets/icons/user.png" alt="User Icon" class="user-icon" />
          <span class="user-name">{{ userName }}</span>
        </div>

        <div class="nav-links">
          <router-link
            v-for="link in links"
            :key="link.name"
            :to="`/profile/${link.name}`"
            class="nav-item"
          >
            <span class="highlight"></span>
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
  props: ['sidebarOpen'],
  data() {
    return {
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

.sidebar {
  width: 250px;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #ffffff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.06);
  padding: 20px;
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  color: #111827;
}

.sidebar-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.user-info {
  padding: 50px 20px 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #eee;
}

.user-icon {
  width: 30px;
  height: 30px;
}

.user-name {
  font-weight: 700;
  font-size: 1rem;
}

.nav-links {
  display: flex;
  flex-direction: column;
  padding: 20px 10px 0;
  align-items: flex-start;
  gap: 20px;
}

.nav-item {
  font-size: 0.96rem;
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 600;
  transition: 0.3s;
  color: #111827;
  text-decoration: none;
  background-color: #f9f9f9;
  position: relative;
  overflow: hidden;
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

.bottom-logout {
  padding: 80px 10px 20px;
}

.logout-button {
  padding: 12px 18px;
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
