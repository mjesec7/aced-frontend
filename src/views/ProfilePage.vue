<!-- ProfilePage.vue -->
<template>
  <div class="profile-page">
    <!-- Enhanced sidebar toggle with proper spacing -->
    <button class="sidebar-toggle" @click="toggleSidebar" :class="{ active: sidebarOpen }">
      <span class="toggle-line"></span>
      <span class="toggle-line"></span>
      <span class="toggle-line"></span>
    </button>

    <SideBar 
      :isOpen="sidebarOpen" 
      @toggle-sidebar="handleSidebarToggle"
    />

    <div class="main-content" :class="{ 'with-sidebar': sidebarOpen }">
      <router-view />
    </div>
  </div>
</template>

<script>
import SideBar from '@/components/Profile/SideBar.vue'

export default {
  name: 'ProfilePage',
  components: { SideBar },
  data() {
    return {
      sidebarOpen: window.innerWidth > 768 // Auto-open on desktop, closed on mobile
    }
  },
  mounted() {
    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    handleSidebarToggle(isOpen) {
      this.sidebarOpen = isOpen;
    },
    handleResize() {
      // Auto-close sidebar on mobile, auto-open on desktop
      if (window.innerWidth <= 768) {
        this.sidebarOpen = false;
      } else {
        this.sidebarOpen = true;
      }
    }
  }
}
</script>

<style scoped>
/* ========================================
   🏠 PROFILE PAGE LAYOUT
======================================== */
.profile-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  position: relative;
}

/* ========================================
   🍔 ENHANCED SIDEBAR TOGGLE
======================================== */
.sidebar-toggle {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 2000;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  width: 48px;
  height: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle:hover {
  background: #f9fafb;
  border-color: #8b5cf6;
  transform: scale(1.05);
}

.sidebar-toggle.active {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

.toggle-line {
  width: 20px;
  height: 2px;
  background: #6b7280;
  border-radius: 1px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.sidebar-toggle:hover .toggle-line {
  background: #8b5cf6;
}

.sidebar-toggle.active .toggle-line {
  background: #ffffff;
}

.sidebar-toggle.active .toggle-line:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.sidebar-toggle.active .toggle-line:nth-child(2) {
  opacity: 0;
}

.sidebar-toggle.active .toggle-line:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* ========================================
   📄 MAIN CONTENT
======================================== */
.main-content {
  flex: 1;
  padding: 40px 32px;
  transition: margin-left 0.3s ease;
  background: #ffffff;
  min-height: 100vh;
  margin-left: 0;
}

.main-content.with-sidebar {
  margin-left: 280px; /* Match sidebar width */
}

/* ========================================
   📱 RESPONSIVE DESIGN
======================================== */
@media (max-width: 768px) {
  .sidebar-toggle {
    top: 16px;
    left: 16px;
    width: 44px;
    height: 44px;
  }
  
  .toggle-line {
    width: 18px;
  }
  
  .main-content {
    padding: 20px 16px;
    margin-left: 0 !important; /* Always full width on mobile */
  }
  
  .main-content.with-sidebar {
    margin-left: 0; /* Sidebar overlays on mobile */
  }
}

@media (min-width: 769px) {
  /* On desktop, adjust toggle position when sidebar is open */
  .sidebar-toggle {
    transition: left 0.3s ease, opacity 0.3s ease;
  }
  
  .main-content.with-sidebar ~ .sidebar-toggle {
    left: 300px; /* Move toggle when sidebar is open */
  }
}

/* Additional spacing for content when sidebar toggle is visible */
.main-content > * {
  margin-top: 20px; /* Ensure content doesn't overlap with toggle */
}

@media (max-width: 768px) {
  .main-content > * {
    margin-top: 30px; /* More space on mobile */
  }
}</style>