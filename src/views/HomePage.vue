<template>
  <div class="home-page">
    <!-- Hero Section with 3D Viewer -->
    <HeroSection />
    <AcedSection />
    <AnalyticsSection />
    <StickyNavbar />
    <ChatBot />
  </div>
</template>

<script setup>
import HeroSection from '@/components/HeroSection.vue';
import AcedSection from '@/components/AcedSection.vue';
import AnalyticsSection from '@/components/AnalyticsSection.vue';
import StickyNavbar from '@/components/StickyNavbar.vue';
import ChatBot from '@/components/ChatBot.vue';
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
