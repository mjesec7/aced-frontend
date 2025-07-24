<template>
  <div class="profile-page">
    <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">☰</button>
    <SideBar v-if="sidebarOpen" @close="sidebarOpen = false" />

    <div class="main-content" :class="{ 'with-sidebar': sidebarOpen }">
      <router-view />
    </div>
  </div>
</template>

<script>
import SideBar from '@/components/Profile/SideBar.vue';
import { userStatusMixin } from '@/composables/useUserStatus';

export default {
  name: 'ProfilePage',
  components: { SideBar },
  mixins: [userStatusMixin], // ✅ Use the mixin for reactive user status
  
  data() {
    return {
      sidebarOpen: true,
      // ✅ Enhanced reactivity tracking
      componentKey: 0,
      lastUpdate: Date.now()
    };
  },
  
  computed: {
    // ✅ Enhanced sidebar classes with user status
    mainContentClass() {
      const counter = this.forceUpdateCounter || 0; // Force reactivity
      return {
        'with-sidebar': this.sidebarOpen,
        [`user-${this.userStatus}`]: true,
        'premium-user': this.isPremiumUser,
        'updated': this.lastUpdate > Date.now() - 5000
      };
    }
  },
  
  watch: {
    // ✅ Watch for user status changes to update layout
    userStatus: {
      handler(newStatus, oldStatus) {
        console.log('📊 ProfilePage: User status changed:', oldStatus, '→', newStatus);
        this.triggerComponentUpdate();
      },
      immediate: true
    }
  },
  
  mounted() {
    console.log('🔧 ProfilePage: Component mounted with status:', this.userStatus);
    this.setupProfileEventListeners();
  },
  
  beforeUnmount() {
    this.cleanupProfileEventListeners();
  },
  
  methods: {
    // ✅ Enhanced close sidebar method
    closeSidebar() {
      this.sidebarOpen = false;
      console.log('📱 ProfilePage: Sidebar closed');
    },
    
    // ✅ Enhanced toggle sidebar method
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
      console.log('📱 ProfilePage: Sidebar toggled:', this.sidebarOpen);
    },
    
    // ✅ Trigger component update
    triggerComponentUpdate() {
      this.componentKey++;
      this.lastUpdate = Date.now();
      this.$forceUpdate();
      
      console.log('🔄 ProfilePage: Component update triggered:', {
        key: this.componentKey,
        userStatus: this.userStatus
      });
    },
    
    // ✅ Setup profile-specific event listeners
    setupProfileEventListeners() {
      console.log('🔧 ProfilePage: Setting up profile event listeners');
      
      // Additional profile-specific listeners can go here
      if (typeof window !== 'undefined' && window.eventBus) {
        this.profileStatusHandler = (data) => {
          console.log('📡 ProfilePage: Profile status event:', data);
          this.triggerComponentUpdate();
          
          // Update page title based on status
          const planLabel = data.newStatus === 'pro' ? 'Pro' : data.newStatus === 'start' ? 'Start' : 'Free';
          if (document.title && !document.title.includes('|')) {
            document.title = `ACED Profile | ${planLabel}`;
          }
        };
        
        window.eventBus.on('userStatusChanged', this.profileStatusHandler);
        window.eventBus.on('promocodeApplied', this.profileStatusHandler);
      }
    },
    
    // ✅ Cleanup profile-specific event listeners
    cleanupProfileEventListeners() {
      console.log('🧹 ProfilePage: Cleaning up profile event listeners');
      
      if (typeof window !== 'undefined' && window.eventBus && this.profileStatusHandler) {
        window.eventBus.off('userStatusChanged', this.profileStatusHandler);
        window.eventBus.off('promocodeApplied', this.profileStatusHandler);
      }
    }
  }
};
</script>

<style scoped>
.profile-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: white;
  position: relative;
}

.sidebar-toggle {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 2000;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.main-content {
  flex: 1;
  padding: 40px 50px;
  transition: margin-left 0.3s ease;
  background-color: #fafafa;
  min-height: 100vh;
}

.main-content.with-sidebar {
  margin-left: 250px; /* match sidebar width */
}
</style>
