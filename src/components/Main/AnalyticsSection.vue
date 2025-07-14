<template>
  <section class="promo-container">
    <div class="text-section">
      <h2>Образование будущего — с ACED</h2>
      <p>
        Получи доступ к более чем <strong>200+ курсам</strong>, разработанным с помощью AI.
        Учись в собственном ритме, отслеживай прогресс и добивайся настоящих результатов.
      </p>
      <p class="highlight">
        Начни бесплатно и перейди на Pro в любой момент!
      </p>
    </div>

    <div class="floating-cards">
      <div class="promo-card card-1">
        <span class="icon">🤖</span>
        <h3>Искусственный интеллект</h3>
        <p>Персонализированные рекомендации и обучение</p>
      </div>

      <div class="promo-card card-2">
        <span class="icon">📈</span>
        <h3>Твоя аналитика</h3>
        <p>Следи за прогрессом и улучшай результаты</p>
      </div>

      <div class="promo-card card-3">
        <span class="icon">🎓</span>
        <h3>150+ курсов</h3>
        <p>История, биология, кодинг и многое другое</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AnalyticsSection'
}
</script>

<style scoped>
.promo-container {
  min-height: 100vh;
  padding: 80px 20px;
  background: linear-gradient(135deg, #0d102d, #191645);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.text-section {
  max-width: 800px;
  text-align: center;
  margin-bottom: 60px;
}

.text-section h2 {
  font-size: 2.8rem;
  font-family: 'Unbounded', sans-serif;
  background: linear-gradient(to right, #a855f7, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.text-section p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #d1d5db;
}

.highlight {
  margin-top: 10px;
  font-weight: 600;
  color: #fff;
}

.floating-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 28px;
  max-width: 1000px;
  width: 100%;
}

.promo-card {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 30px 20px;
  border-radius: 18px;
  text-align: center;
  transition: transform 0.3s ease;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  position: relative;
}

.promo-card:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 20px 40px rgba(168, 85, 247, 0.3);
}

.promo-card h3 {
  margin-top: 12px;
  font-size: 1.3rem;
  font-family: 'Unbounded', sans-serif;
  background: linear-gradient(to right, #7c3aed, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.promo-card p {
  margin-top: 10px;
  font-size: 0.95rem;
  color: #d1d5db;
}

.icon {
  font-size: 2rem;
  display: block;
}

/* Tablet styles */
@media (max-width: 768px) {
  .promo-container {
    padding: 60px 15px;
  }
  
  .text-section h2 {
    font-size: 2.2rem;
  }
  
  .text-section p {
    font-size: 1rem;
  }
  
  .floating-cards {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .promo-card {
    padding: 25px 15px;
  }
  
  .promo-card h3 {
    font-size: 1.2rem;
  }
}

/* Mobile styles */
@media (max-width: 480px) {
  .promo-container {
    padding: 40px 10px;
  }
  
  .text-section h2 {
    font-size: 1.8rem;
  }
  
  .text-section p {
    font-size: 0.9rem;
  }
  
  .floating-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .promo-card {
    padding: 20px 15px;
  }
  
  .promo-card h3 {
    font-size: 1.1rem;
  }
  
  .promo-card p {
    font-size: 0.85rem;
  }
  
  .icon {
    font-size: 1.8rem;
  }
}
</style>