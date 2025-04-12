<template>
  <div class="hero-container" :style="{ opacity: heroOpacity }">
    <!-- Top Navigation with Logo and Authentication Buttons -->
    <div class="top-nav">
      <img src="@/assets/logo.png" alt="ACED Logo" class="aced-logo" />
      <UserSection />
    </div>

    <!-- Video Background -->
    <div class="video-container">
      <video autoplay loop muted playsinline>
        <source src="@/assets/videos/untitled.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>

    <!-- Hero Text -->
    <div class="hero-text">
      <h1 class="hero-title">Разблокируйте будущее образования вместе с ACED</h1>
      <div class="hero-buttons">
        <button class="hero-btn">Узнать больше</button>
      </div>
    </div>
  </div>
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
  },
};
</script>

<style scoped>
/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Unbounded', sans-serif;
}



/* Hero Section */
.hero-container {
  position: relative;
  width: 100%;
  height: 100vh;
  transition: opacity 0.5s ease, border-radius 0.5s ease;
  border-bottom-left-radius: 50px;
  border-bottom-right-radius: 50px;
  z-index: 0;
}

/* Top Navigation */
.top-nav {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: space-between;
  padding: 20px 40px;
  z-index: 3;
  align-items: center;
}

.aced-logo {
  height: 80px;
}

.auth-buttons {
  display: flex;
  gap: 15px;
}

.auth-button {
  border: 2px solid purple;
  background: transparent;
  color: black;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  max-height: 50px;
}

.auth-button:hover {
  color: white;
  background: purple;
}

/* Video Background */
.video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Hero Text */
.hero-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
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
  cursor: pointer;
  transition: 0.3s;
  border-radius: 10px;
}

.hero-btn:hover {
  color: white;
  background: black;
  border: 0;
}
</style>
