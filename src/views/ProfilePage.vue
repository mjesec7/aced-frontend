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
import SideBar from '@/components/Profile/SideBar.vue'

export default {
  components: { SideBar },
  data() {
    return {
      sidebarOpen: true
    }
  }
}
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
