<template>
  <div class="home-page">
    <!-- Hero Section with 3D Viewer -->
    <HeroSection />
    <AcedSection />
    <AnalyticsSection />
    <StickyNavbar />
    <ChatBot/>
  </div>
</template>

<script>
import HeroSection from '@/components/HeroSection.vue';
import AcedSection from '@/components/AcedSection.vue';
import StickyNavbar from '@/components/StickyNavbar.vue';
import AnalyticsSection from '@/components/AnalyticsSection.vue'; 
import ChatBot from '@/components/ChatBot.vue';

export default {
  name: 'HomePage',
  components: {
    HeroSection,
    AcedSection,
    AnalyticsSection, // Register it here
    StickyNavbar,
    ChatBot,
  },
};
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100%;
  height: 100vh;

}
</style>
