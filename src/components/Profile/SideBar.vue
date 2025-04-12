<template>
  <div class="sidebar-wrapper">
    <button class="toggle-btn" @click="toggleSidebar">
      {{ isOpen ? '×' : '☰' }}
    </button>

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
          <button class="logout-button" @click="logout">Выйти</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'

export default {
  name: 'SideBar',
  data() {
    return {
      isOpen: true,
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
    }
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.userName = user.displayName || user.email
      }
    })
  },
  methods: {
    toggleSidebar() {
      this.isOpen = !this.isOpen
    },
    logout() {
      this.$emit('logout')
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&display=swap');

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
}

.sidebar.open {
  width: 220px;
}

.sidebar-content {
  width: 220px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.toggle-btn {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 999;
  background: white;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-name {
  padding: 70px 20px 20px;
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

.logout-button {
  margin: 20px 15px;
  padding: 10px 15px;
  background: red;
  color: white;
  border: none;
  font-size: 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Unbounded', sans-serif;
}
</style>
