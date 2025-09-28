<template>
  <section class="about-container" id="about-us">
    <div class="content-wrapper">
      <!-- Left side - Text content -->
      <div class="about-content">
        <h2 class="title">О платформе ACED</h2>
        <p class="description">
          ACED — это платформа нового поколения для обучения, которая делает процесс интерактивным, персонализированным и измеримым. Наш главный фокус — современное и общее образование, где студенты получают не только знания по языкам, но и по другим важным дисциплинам.
        </p>
        <div class="achievement-stats">
          <div class="stat-item">
            <span class="stat-number">2024</span>
            <span class="stat-label">Год основания</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">5+</span>
            <span class="stat-label">Предметов</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">∞</span>
            <span class="stat-label">Возможностей</span>
          </div>
        </div>
      </div>

      <!-- Right side - Feature cards -->
      <div class="features-wrapper">
        <h3 class="features-title">Возможности платформы</h3>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h4>Структурированные уроки</h4>
            <p>Каждый урок состоит из шагов: объяснения, примеры, практические задания, упражнения и тесты.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">💾</div>
            <h4>Автосохранение</h4>
            <p>Прогресс учащихся сохраняется автоматически в реальном времени.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h4>Домашние задания</h4>
            <p>Домашние задания встроены в систему и могут пересдаваться.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h4>Тестирование</h4>
            <p>Существует отдельная страница для тестов, где можно проходить и пересматривать результаты.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📈</div>
            <h4>Аналитика</h4>
            <p>Учащиеся получают аналитику по своим результатам: сильные стороны, ошибки и рекомендации.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h4>AI-помощник</h4>
            <p>Встроенный AI-помощник помогает разбирать материал и подсказывает при затруднениях.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h4>Кроссплатформенность</h4>
            <p>Платформа доступна на компьютере и мобильных устройствах, все данные синхронизируются.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AboutUs'
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&display=swap');

.about-container {
  padding: 80px 40px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  font-family: 'Unbounded', sans-serif;
  color: #1a1a1a;
  position: relative;
  overflow: hidden;
}

.about-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5rem;
  align-items: start;
  position: relative;
  z-index: 1;
}

.about-content {
  padding-right: 2rem;
}

.title {
  font-size: clamp(2.2rem, 5vw, 3rem);
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.description {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  line-height: 1.8;
  color: #4a4a4a;
  margin-bottom: 2.5rem;
  font-weight: 400;
}

.achievement-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 1.5rem 1rem;
  border-radius: 1rem;
  flex: 1;
  min-width: 120px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8));
  opacity: 0;
  transition: all 0.4s ease;
  border-radius: 1rem;
  z-index: 1;
}

.stat-item:hover::before {
  opacity: 0.1;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 0 30px rgba(139, 92, 246, 0.4),
    0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.5);
}

.stat-number,
.stat-label {
  position: relative;
  z-index: 2;
}

.stat-number {
  display: block;
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  font-weight: 700;
  color: #2a2a2a;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.features-wrapper {
  padding-left: 2rem;
}

.features-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2a2a2a;
  margin-bottom: 2rem;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8));
  opacity: 0;
  transition: all 0.4s ease;
  border-radius: 1rem;
  z-index: 1;
}

.feature-card:hover::before {
  opacity: 0.05;
}

.feature-card:hover {
  transform: translateX(10px);
  box-shadow: 
    0 0 40px rgba(139, 92, 246, 0.3),
    0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.4);
}

.feature-icon,
.feature-card h4,
.feature-card p {
  position: relative;
  z-index: 2;
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.feature-card h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2a2a2a;
  margin-bottom: 0.8rem;
}

.feature-card p {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #555;
  margin: 0;
}

@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 4rem;
  }
  
  .about-content,
  .features-wrapper {
    padding-left: 0;
    padding-right: 0;
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .about-container {
    padding: 60px 20px;
  }
  
  .content-wrapper {
    gap: 3rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .achievement-stats {
    justify-content: center;
    gap: 0.8rem;
  }
  
  .stat-item {
    flex-basis: 30%;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .stat-item {
    flex-basis: 45%;
    padding: 1rem 0.5rem;
  }
}
</style>