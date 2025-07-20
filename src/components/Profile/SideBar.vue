<template>
  <div class="sidebar-wrapper">
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <!-- 👤 User Info - Fixed at top -->
        <div class="user-info" v-if="user">
          <img src="@/assets/icons/user.png" alt="User Icon" class="user-icon" />
          <div class="user-details">
            <span class="user-name">{{ user.name || user.email }}</span>
            <span class="user-plan">📦 {{ planLabel }}</span>
          </div>
        </div>

        <!-- 📚 Navigation Links - Scrollable -->
        <div class="nav-links scrollable">
          <router-link
            to="/profile/main"
            class="nav-item"
            :class="{ active: isActive('main') }"
            @click="closeSidebarOnMobile"
          >
            <span class="highlight"></span>
            Главная
          </router-link>

          <router-link
            to="/profile/catalogue"
            class="nav-item"
            :class="{ active: isActive('catalogue') }"
            @click="closeSidebarOnMobile"
          >
            <span class="highlight"></span>
            Каталог
          </router-link>

          <router-link
            v-for="link in links"
            :key="link.name"
            :to="getRoutePath(link.name)"
            class="nav-item"
            :class="{ active: isActive(link.name) }"
            @click="closeSidebarOnMobile"
          >
            <span class="highlight"></span>
            {{ link.label }}
          </router-link>
        </div>

        <!-- 🚪 Logout - Fixed at bottom -->
        <div class="bottom-logout">
          <button class="logout-button" @click="showLogoutModal = true">Выйти</button>
        </div>
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div 
      class="sidebar-overlay" 
      v-if="isOpen && isMobile" 
      @click="closeSidebar"
    ></div>

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
  props: {
    isOpen: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      showLogoutModal: false,
      links: [
        { name: 'analytics', label: 'Аналитика' },
        { name: 'goal', label: 'Цели' },
        { name: 'diary', label: 'Дневник' },
        { name: 'homework', label: 'Помощь с ДЗ' },
        { name: 'homeworks', label: 'Домашние задания' },
        { name: 'tests', label: 'Тесты' },
        // ✅ UPDATED: Vocabulary now points to standalone VocabularyPage
        { name: 'vocabulary', label: 'Словарь' },
        { name: 'settings', label: 'Настройки' }
      ],
      isMobile: false
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
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    
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
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
  },
  methods: {
    ...mapMutations(['setUser', 'clearUser']),
    checkMobile() {
      this.isMobile = window.innerWidth <= 768;
    },
    closeSidebar() {
      this.$emit('toggle-sidebar', false);
    },
    closeSidebarOnMobile() {
      if (this.isMobile) {
        this.closeSidebar();
      }
    },
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
    getRoutePath(linkName) {
      if (linkName === 'settings') {
        return '/settings';
      }
      // ✅ All links go to profile routes (including vocabulary)
      return `/profile/${linkName}`;
    },
    isActive(name) {
      const path = this.$route.path;
      
      if (name === 'main') {
        return path === '/profile/main' || path === '/profile' || path === '/profile/';
      }
      if (name === 'catalogue') {
        return path === '/profile/catalogue';
      }
      if (name === 'analytics') {
        return path === '/profile/analytics';
      }
      if (name === 'goal') {
        return path === '/profile/goal';
      }
      if (name === 'diary') {
        return path === '/profile/diary';
      }
      if (name === 'homework') {
        return path === '/profile/homework';
      }
      if (name === 'homeworks') {
        return path === '/profile/homeworks' || path.startsWith('/profile/homeworks/');
      }
      if (name === 'tests') {
        return path === '/profile/tests' || path.startsWith('/profile/tests/');
      }
      // ✅ UPDATED: Vocabulary now checks for profile vocabulary route
      if (name === 'vocabulary') {
        return path === '/profile/vocabulary' || path.startsWith('/profile/vocabulary');
      }
      if (name === 'settings') {
        return path === '/settings';
      }
      
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
  width: 260px;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #ffffff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  color: #111827;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.user-info {
  padding: 60px 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: #111827;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.user-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: #f3f4f6;
  border: 2px solid #c7d2fe;
}

.user-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 6px;
}

.user-name {
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.2;
  color: #1f2937;
  word-break: break-word;
  max-width: 160px;
}

.user-plan {
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 2px;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.nav-links {
  flex: 1;
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-links.scrollable {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
}

.nav-links.scrollable::-webkit-scrollbar {
  width: 4px;
}

.nav-links.scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.nav-links.scrollable::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 2px;
}

.nav-links.scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

.nav-item {
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  color: #111827;
  text-decoration: none;
  background-color: #f9fafb;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
}

.nav-item:hover {
  background: linear-gradient(to right, #ede9fe, #f0f5ff);
  color: #4f46e5;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.12);
}

.nav-item .highlight {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(to bottom, #6366f1, #8b5cf6);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nav-item.active .highlight,
.nav-item:hover .highlight {
  opacity: 1;
}

.nav-item.active {
  background: linear-gradient(to right, #ede9fe, #f0f5ff);
  color: #4f46e5;
  transform: translateX(4px);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.bottom-logout {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.logout-button {
  padding: 8px 14px;
  background: #ef4444;
  color: white;
  border: none;
  font-size: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Unbounded', sans-serif;
  transition: all 0.2s ease;
  width: 100%;
  font-weight: 600;
  min-height: 36px;
}

.logout-button:hover {
  background: #dc2626;
  transform: translateY(-1px);
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

/* Desktop: Always show sidebar */
@media (min-width: 769px) {
  .sidebar {
    transform: translateX(0) !important;
  }
  
  .sidebar-overlay {
    display: none !important;
  }
}

/* Mobile: Hide sidebar by default */
@media (max-width: 768px) {
  .sidebar {
    z-index: 1001;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>