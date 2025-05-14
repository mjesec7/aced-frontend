<template>
  <div class="hero-container" :style="{ opacity: heroOpacity }">
    <!-- Top Navigation with Logo and Authentication Buttons -->
    <div class="top-nav">
      <div class="nav-inner">
        <img src="@/assets/logo.png" alt="ACED Logo" class="aced-logo" />
        <UserSection />
      </div>
    </div>

    <!-- Background -->
    <div class="video-container">
      <spline-viewer
        class="spline-bg"
        url="https://prod.spline.design/zoavmG9WcCYRE1gQ/scene.splinecode"
      ></spline-viewer>
    </div>

    <!-- Hero Text -->
    <div class="hero-text">
      <h1 class="hero-title">
        Разблокируйте будущее образования вместе с ACED
      </h1>
      <div class="hero-buttons">
        <button class="hero-btn" @click="scrollToAbout">Узнать больше</button>
      </div>
    </div>
  </div>

  <!-- About Us Section -->
  <section id="about" class="about-section">
    <h2>О нас</h2>
    <p>
      ACED — это платформа, меняющая подход к обучению. Мы создаем инновационные
      решения для будущего образования с помощью ИИ и интерактивных технологий.
    </p>
  </section>
</template>

<script>
import UserSection from "@/components/Main/UserSection.vue";

export default {
  components: { UserSection },
  data() {
    return {
      heroOpacity: 1,
    };
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = window.innerHeight;
      this.heroOpacity = Math.max(1 - scrollTop / maxScroll, 0);
    },
    scrollToAbout() {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: "smooth" });
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded&display=swap');

html,
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  font-family: 'Unbounded', sans-serif;
}

/* 🎯 Hero Container */
.hero-container {
  position: relative;
  width: 100%;
  height: 100vh;
  transition: opacity 0.5s ease, border-radius 0.5s ease;
  border-bottom-left-radius: 50px;
  border-bottom-right-radius: 50px;
  z-index: 0;
  overflow: hidden;
}

/* 🧭 Navigation Bar */
.top-nav {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: center;
  z-index: 3;
  align-items: center;
}

.nav-inner {
  max-width: 1400px;
  width: 100%;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.aced-logo {
  height: 80px;
}

/* 🌌 Spline 3D Background */
.video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.spline-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

/* 📝 Hero Text */
.hero-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
  color: black;
  padding: 0 20px;
  width: 100%;
  max-width: 1200px;
  box-sizing: border-box;
}

.hero-title {
  font-size: 42px;
  margin-bottom: 20px;
}

.hero-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.hero-btn {
  background: transparent;
  border: 2px solid purple;
  color: black;
  padding: 12px 25px;
  font-size: 16px;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: 0.3s;
  border-radius: 10px;
}

.hero-btn:hover {
  color: white;
  background: black;
  border: 0;
}

/* 📖 About Section */
.about-section {
  background: white;
  padding: 100px 20px;
  text-align: center;
  border-top: 1px solid #eee;
}

.about-section h2 {
  font-size: 36px;
  margin-bottom: 20px;
}

.about-section p {
  font-size: 18px;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
}
</style>
