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
        <button class="hero-btn" @click="goToAboutUs">Узнать больше</button>
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
    goToAboutUs() {
      this.$router.push({ name: 'AboutUsPage' });
    }
  }
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
  padding: 0;
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
  width: auto;
}

.auth-buttons {
  display: flex;
  gap: 15px;
}

.auth-button {
  border: 2px solid purple;
  background: transparent;
  color: black;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  max-height: 50px;
  font-family: 'Unbounded', sans-serif;
  padding: 8px 16px;
}

.auth-button:hover {
  color: white;
  background: purple;
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
  font-family: 'Unbounded', sans-serif;
  font-weight: bold;
  line-height: 1.2;
}

.hero-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
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
  font-weight: 600;
}

.hero-btn:hover {
  color: white;
  background: black;
  border-color: black;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 36px;
  }
  
  .nav-inner {
    padding: 0 15px;
  }
  
  .aced-logo {
    height: 70px;
  }
}

@media (max-width: 768px) {
  .hero-container {
    border-bottom-left-radius: 30px;
    border-bottom-right-radius: 30px;
  }
  
  .top-nav {
    height: 80px;
  }
  
  .nav-inner {
    padding: 0 10px;
  }
  
  .aced-logo {
    height: 60px;
  }
  
  .hero-text {
    padding: 0 15px;
  }
  
  .hero-title {
    font-size: 28px;
    margin-bottom: 15px;
  }
  
  .hero-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
  
  .auth-button {
    padding: 6px 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .hero-container {
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
  }
  
  .top-nav {
    height: 70px;
  }
  
  .nav-inner {
    padding: 0 10px;
  }
  
  .aced-logo {
    height: 50px;
  }
  
  .hero-text {
    padding: 0 10px;
  }
  
  .hero-title {
    font-size: 22px;
    margin-bottom: 12px;
    line-height: 1.3;
  }
  
  .hero-buttons {
    gap: 10px;
  }
  
  .hero-btn {
    padding: 8px 16px;
    font-size: 12px;
  }
  
  .auth-buttons {
    gap: 8px;
  }
  
  .auth-button {
    padding: 5px 10px;
    font-size: 12px;
  }
}

@media (max-width: 320px) {
  .hero-title {
    font-size: 18px;
  }
  
  .hero-btn {
    padding: 6px 12px;
    font-size: 11px;
  }
  
  .aced-logo {
    height: 40px;
  }
  
  .auth-button {
    padding: 4px 8px;
    font-size: 10px;
  }
}

/* Landscape orientation for mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .hero-title {
    font-size: 20px;
    margin-bottom: 10px;
  }
  
  .hero-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .top-nav {
    height: 60px;
  }
  
  .aced-logo {
    height: 40px;
  }
}
</style>