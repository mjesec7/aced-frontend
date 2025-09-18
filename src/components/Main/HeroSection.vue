<template>
  <div class="hero-container">
    <div class="background-effects">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
    </div>

    <header class="top-nav">
      <div class="nav-inner">
        <div class="logo">
          <div class="logo-icon">A</div>
          <span>ACED</span>
        </div>
        <nav class="main-nav">
          <a href="#passion-test">Тест</a>
          <a href="#greatpeople">Учёбные</a>
          <a href="#aced">Направления</a>
          <a href="#about-us">О нас</a>
          <a href="#contacts">Контакт</a>
        </nav>
        <UserSection />
      </div>
    </header>

    <main class="hero-text">
      <div class="badge">
        <span class="sparkle">✨</span> #1 ПЛАТФОРМА ДЛЯ ОБРАЗОВАНИЯ В СНГ
      </div>
      <h1 class="hero-title">
        Разблокируйте
        <span class="line">будущее образования</span>
        <span class="line">вместе с ACED</span>
      </h1>
      <p class="hero-subtitle">
        🚀 Получите навыки будущего уже сегодня! Интерактивные курсы с ИИ,
        практические проекты и сертификаты от ведущих компаний. Ваша карьера
        начинается здесь!
      </p>
    </main>
  </div>
</template>

<script>
import UserSection from "@/components/Main/UserSection.vue";

export default {
  components: { UserSection },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;800&display=swap');

.hero-container {
  min-height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Unbounded', sans-serif;
  background: radial-gradient(circle at 10% 20%, #2c1a4d, #110d2e 40%);
  color: #fff;
}

.background-effects {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.5;
}
.shape {
  position: absolute;
  filter: blur(100px);
}
.shape-1 {
  width: 500px;
  height: 500px;
  top: -150px;
  left: -150px;
  background: #7c3aed;
  border-radius: 50%;
}
.shape-2 {
  width: 400px;
  height: 400px;
  bottom: -150px;
  right: -150px;
  background: #06b6d4;
   border-radius: 50%;
}

.top-nav {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1.5rem 2rem;
  z-index: 10;
}
.nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.5rem;
}
.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(45deg, #a855f7, #38bdf8);
  border-radius: 0.5rem;
  display: grid;
  place-items: center;
  font-weight: bold;
  font-size: 1.25rem;
}
.main-nav {
  display: flex;
  gap: 2.5rem;
}
.main-nav a {
  color: #d1d5db;
  text-decoration: none;
  transition: color 0.3s;
  font-size: 0.9rem;
}
.main-nav a:hover {
  color: #fff;
}
@media (max-width: 768px) {
  .main-nav { display: none; }
}

.hero-text {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 1rem;
}
.badge {
  display: inline-block;
  background: rgba(147, 51, 234, 0.15);
  border: 1px solid rgba(147, 51, 234, 0.3);
  color: #c084fc;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  margin-bottom: 2rem;
}
.hero-title {
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  color: #E0E7FF;
}
.line {
  display: block;
}
.hero-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  max-width: 650px;
  margin: 0 auto 2.5rem;
  color: #d1d5db;
  line-height: 1.6;
  font-weight: 400;
}
</style>