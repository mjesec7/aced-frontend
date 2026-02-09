<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section id="hero" class="hero-section">
      <HeroSection />
    </section>

    <!-- About Us Section -->
    <section id="about-us">
      <AboutUs />
    </section>

    <!-- ACED Section -->
    <section id="aced">
      <AcedSection />
    </section>

    <!-- Tariff Section -->
    <section id="tariffs">
      <TariffSection />
    </section>

    <!-- Footer Section -->
    <section id="cards">
      <FooterBar />
    </section>

    <!-- ChatBot -->
    <ChatBot />
  </div>
</template>

<script setup>
import HeroSection from '@/components/Main/HeroSection.vue';
import AboutUs from '@/components/Main/AboutUs.vue';
import AcedSection from '@/components/Main/AcedSection.vue';
import TariffSection from '@/components/Main/TariffSection.vue';
import FooterBar from '@/components/Main/FooterBar.vue';
import ChatBot from '@/components/Main/ChatBot.vue';
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: white;
  /* CRITICAL: Do NOT use overflow: hidden - it clips dropdowns */
  /* Do NOT add transform, filter, or will-change - creates stacking context */
}

section {
  width: 100%;
  background-color: white;
  position: relative;
}

/* Hero section - lower z-index so teleported dropdown (z-index: max) appears above */
.hero-section {
  position: relative;
  z-index: 1;
  /* NO overflow: hidden - allows dropdowns to show */
  /* NO transform or filter - avoids creating stacking context that traps dropdown */
}

/* Other sections below hero - even lower z-index */
#about-us,
#aced,
#tariffs,
#cards {
  position: relative;
  z-index: 0;
}
</style>