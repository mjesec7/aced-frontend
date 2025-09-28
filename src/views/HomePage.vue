<template>
  <div class="home-page">
    <!-- Sticky Navigation -->

    <!-- Hero Section -->
    <section id="hero">
      <HeroSection />
    </section>



    <!-- About Us Section -->
    <section id="about-us">
      <AboutUs />
    </section>

    <!-- Features Section -->
    <section id="features">
      <PassionTest />
    </section>

    <!-- ACEED Section -->
    <section id="aced">
      <AcedSection />
    </section>
    <section id="greatpeople">
<GreatPeopleSection/>
    </section>

    <!-- Analytics Section -->
    <section id="analytics">
      <AnalyticsSection />
    </section>
    <!-- Tariff Section -->
<section id="tariffs">
  <TariffSection />
</section>



    <!-- Cards Section (extended creatively) -->
    <section id="cards">
      <FooterBar />
    </section>

    <!-- ChatBot (positioned bottom-right typically via component styles) -->
    <ChatBot />
  </div>
</template>

<script setup>
import HeroSection from '@/components/Main/HeroSection.vue';
import AboutUs from '@/components/Main/AboutUs.vue';
import PassionTest from '@/components/Main/PassionTest.vue';
import AcedSection from '@/components/Main/AcedSection.vue';
import GreatPeopleSection from '@/components/Main/GreatPeopleSection.vue'
import AnalyticsSection from '@/components/Main/AnalyticsSection.vue';
import TariffSection from '@/components/Main/TariffSection.vue'

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
  
}

section {


  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
