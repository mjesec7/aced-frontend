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
      <p class="hero-subtitle">
        Современная образовательная платформа с инновационными методами обучения
      </p>
      <div class="hero-buttons">
        <button class="hero-btn primary" @click="showModal = true">
          Узнать больше
        </button>
        <button class="hero-btn secondary">
          Начать обучение
        </button>
      </div>
    </div>

    <!-- About ACED Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">&times;</button>
        
        <div class="modal-header">
          <img src="@/assets/logo.png" alt="ACED Logo" class="modal-logo" />
          <h2>О платформе ACED</h2>
        </div>

        <div class="modal-body">
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3>Персонализированное обучение</h3>
              <p>Адаптивные программы, которые подстраиваются под ваш темп и стиль обучения</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🚀</div>
              <h3>Современные технологии</h3>
              <p>Интерактивные уроки, VR-симуляции и AI-помощники для эффективного изучения</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">👥</div>
              <h3>Сообщество учеников</h3>
              <p>Совместное обучение, форумы и менторская поддержка от экспертов</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Отслеживание прогресса</h3>
              <p>Детальная аналитика успеваемости и рекомендации по улучшению результатов</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🌍</div>
              <h3>Доступность 24/7</h3>
              <p>Учитесь когда и где удобно с любого устройства в любое время</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🏆</div>
              <h3>Сертификация</h3>
              <p>Получайте признанные сертификаты и дипломы по завершении курсов</p>
            </div>
          </div>
          
          <div class="stats-section">
            <div class="stat-item">
              <span class="stat-number">50K+</span>
              <span class="stat-label">Активных студентов</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">200+</span>
              <span class="stat-label">Курсов доступно</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">95%</span>
              <span class="stat-label">Успешных выпускников</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-btn primary" @click="closeModal">
            Начать обучение сейчас
          </button>
          <button class="modal-btn secondary" @click="closeModal">
            Закрыть
          </button>
        </div>
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
      showModal: false,
    };
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll);
    window.addEventListener("resize", this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = window.innerHeight;
      this.heroOpacity = Math.max(1 - scrollTop / maxScroll, 0);
    },
    handleResize() {
      // Handle any resize logic if needed
    },
    closeModal() {
      this.showModal = false;
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&display=swap');

html, body {
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
  border-bottom-left-radius: clamp(20px, 5vw, 50px);
  border-bottom-right-radius: clamp(20px, 5vw, 50px);
  z-index: 0;
  overflow: hidden;
}

/* 🧭 Navigation Bar */
.top-nav {
  position: absolute;
  top: 0;
  width: 100%;
  height: clamp(70px, 12vw, 100px);
  display: flex;
  justify-content: center;
  padding: 0;
  z-index: 3;
  align-items: center;
}

.nav-inner {
  max-width: 1400px;
  width: 100%;
  padding: 0 clamp(15px, 4vw, 20px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.aced-logo {
  height: clamp(50px, 10vw, 80px);
  width: auto;
}

.auth-buttons {
  display: flex;
  gap: clamp(10px, 2vw, 15px);
}

.auth-button {
  border: 2px solid purple;
  background: transparent;
  color: black;
  border-radius: clamp(6px, 1.5vw, 8px);
  cursor: pointer;
  transition: 0.3s;
  max-height: clamp(40px, 8vw, 50px);
  padding: clamp(8px, 2vw, 12px) clamp(15px, 3vw, 20px);
  font-size: clamp(0.8rem, 2vw, 1rem);
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
  padding: 0 clamp(15px, 4vw, 20px);
  width: 100%;
  max-width: 1200px;
  box-sizing: border-box;
}

.hero-title {
  font-size: clamp(1.8rem, 6vw, 3.5rem);
  margin-bottom: clamp(15px, 3vw, 20px);
  line-height: 1.2;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero-subtitle {
  font-size: clamp(1rem, 3vw, 1.4rem);
  margin-bottom: clamp(25px, 5vw, 30px);
  opacity: 0.8;
  line-height: 1.4;
  font-weight: 400;
}

.hero-buttons {
  display: flex;
  justify-content: center;
  gap: clamp(15px, 3vw, 20px);
  flex-wrap: wrap;
}

.hero-btn {
  padding: clamp(12px, 2.5vw, 16px) clamp(20px, 4vw, 30px);
  font-size: clamp(0.9rem, 2.2vw, 1.1rem);
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: clamp(8px, 2vw, 12px);
  font-weight: 600;
  min-height: clamp(45px, 8vw, 55px);
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.hero-btn.primary {
  background: linear-gradient(135deg, #9333ea, #7c3aed);
  border: 2px solid transparent;
  color: white;
}

.hero-btn.primary:hover {
  background: linear-gradient(135deg, #7c3aed, #6b21a8);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(147, 51, 234, 0.3);
}

.hero-btn.secondary {
  background: transparent;
  border: 2px solid #9333ea;
  color: #9333ea;
}

.hero-btn.secondary:hover {
  background: #9333ea;
  color: white;
  transform: translateY(-2px);
}

.hero-btn:active {
  transform: translateY(0);
}

/* 🔮 Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: clamp(15px, 3vw, 20px);
  box-sizing: border-box;
}

.modal-content {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-radius: clamp(15px, 3vw, 25px);
  max-width: min(900px, 95vw);
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: clamp(15px, 3vw, 20px);
  right: clamp(15px, 3vw, 20px);
  background: none;
  border: none;
  font-size: clamp(1.5rem, 4vw, 2rem);
  cursor: pointer;
  color: #6b7280;
  transition: color 0.3s ease;
  z-index: 10;
}

.modal-close:hover {
  color: #ef4444;
}

.modal-header {
  text-align: center;
  padding: clamp(25px, 5vw, 40px) clamp(20px, 4vw, 40px) clamp(20px, 4vw, 30px);
  border-bottom: 1px solid #e5e7eb;
}

.modal-logo {
  height: clamp(40px, 8vw, 60px);
  margin-bottom: clamp(15px, 3vw, 20px);
}

.modal-header h2 {
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  color: #1f2937;
  margin: 0;
  font-weight: 700;
}

.modal-body {
  padding: clamp(20px, 4vw, 30px);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: clamp(20px, 4vw, 25px);
  margin-bottom: clamp(30px, 5vw, 40px);
}

.feature-card {
  background: white;
  padding: clamp(20px, 4vw, 25px);
  border-radius: clamp(12px, 2vw, 15px);
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: clamp(2rem, 5vw, 2.5rem);
  margin-bottom: clamp(10px, 2vw, 15px);
}

.feature-card h3 {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #1f2937;
  margin-bottom: clamp(8px, 2vw, 10px);
  font-weight: 600;
}

.feature-card p {
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, #9333ea, #7c3aed);
  border-radius: clamp(12px, 2vw, 15px);
  padding: clamp(25px, 5vw, 30px);
  margin-bottom: clamp(20px, 4vw, 30px);
  flex-wrap: wrap;
  gap: clamp(15px, 3vw, 20px);
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-number {
  display: block;
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  font-weight: 700;
  margin-bottom: clamp(5px, 1vw, 8px);
}

.stat-label {
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  opacity: 0.9;
}

.modal-footer {
  padding: clamp(20px, 4vw, 30px);
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: clamp(15px, 3vw, 20px);
  justify-content: center;
  flex-wrap: wrap;
}

.modal-btn {
  padding: clamp(12px, 2.5vw, 15px) clamp(25px, 5vw, 30px);
  border-radius: clamp(8px, 2vw, 10px);
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-height: clamp(45px, 8vw, 50px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-btn.primary {
  background: linear-gradient(135deg, #9333ea, #7c3aed);
  color: white;
}

.modal-btn.primary:hover {
  background: linear-gradient(135deg, #7c3aed, #6b21a8);
  transform: translateY(-2px);
}

.modal-btn.secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.modal-btn.secondary:hover {
  background: #e5e7eb;
  color: #374151;
}

/* Mobile specific optimizations */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-btn {
    width: 100%;
    max-width: 280px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-section {
    flex-direction: column;
    text-align: center;
  }
  
  .modal-footer {
    flex-direction: column;
    align-items: center;
  }
  
  .modal-btn {
    width: 100%;
    max-width: 280px;
  }
}

/* Tablet optimizations */
@media (min-width: 769px) and (max-width: 1024px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero-buttons {
    gap: 20px;
  }
}

/* Large screen optimizations */
@media (min-width: 1400px) {
  .hero-title {
    font-size: 4rem;
  }
  
  .hero-subtitle {
    font-size: 1.6rem;
  }
  
  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .hero-btn:hover,
  .modal-btn:hover,
  .feature-card:hover {
    transform: none;
  }
  
  .hero-btn:active,
  .modal-btn:active {
    transform: scale(0.95);
  }
  
  .feature-card:active {
    transform: scale(0.98);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .modal-content {
    animation: none;
  }
  
  .hero-btn,
  .modal-btn,
  .feature-card {
    transition: none;
  }
  
  .hero-btn:hover,
  .modal-btn:hover,
  .feature-card:hover {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .modal-content {
    border: 2px solid #000;
  }
  
  .feature-card {
    border: 1px solid #666;
  }
  
  .hero-btn,
  .modal-btn {
    border-width: 3px;
  }
}</style>