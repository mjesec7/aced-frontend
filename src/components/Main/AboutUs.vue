<template>
  <section class="about-container" id="about-us">
    <div class="content-wrapper">
      <!-- Left side - Text content -->
      <div class="about-content">
        <h2 class="title">О платформе ACED</h2>
        <p class="description">
          ACED — это платформа нового поколения для обучения, которая делает процесс интерактивным, персонализированным и измеримым. Наш главный фокус — современное и общее образование, где студенты получают не только знания по языкам, но и по другим важным дисциплинам.
        </p>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">2024</div>
            <div class="stat-label">Год основания</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">5+</div>
            <div class="stat-label">Предметов</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">∞</div>
            <div class="stat-label">Возможностей</div>
          </div>
        </div>
      </div>

      <!-- Right side - Features -->
      <div class="features-section">
        <h3 class="section-subtitle">Возможности платформы</h3>
        <div class="features-list">
          <div class="feature-item">
            <div class="feature-header">
              <div class="feature-number">01</div>
              <h4 class="feature-title">Структурированное обучение</h4>
            </div>
            <p class="feature-description">
              Каждый урок состоит из шагов: объяснения, примеры, практические задания, упражнения и тесты.
            </p>
          </div>

          <div class="feature-item">
            <div class="feature-header">
              <div class="feature-number">02</div>
              <h4 class="feature-title">Автоматическое сохранение</h4>
            </div>
            <p class="feature-description">
              Прогресс учащихся сохраняется автоматически в реальном времени.
            </p>
          </div>

          <div class="feature-item">
            <div class="feature-header">
              <div class="feature-number">03</div>
              <h4 class="feature-title">Гибкие домашние задания</h4>
            </div>
            <p class="feature-description">
              Домашние задания встроены в систему и могут пересдаваться.
            </p>
          </div>

          <div class="feature-item">
            <div class="feature-header">
              <div class="feature-number">04</div>
              <h4 class="feature-title">Система тестирования</h4>
            </div>
            <p class="feature-description">
              Отдельная страница для тестов с возможностью просмотра результатов.
            </p>
          </div>

          <div class="feature-item">
            <div class="feature-header">
              <div class="feature-number">05</div>
              <h4 class="feature-title">Детальная аналитика</h4>
            </div>
            <p class="feature-description">
              Анализ результатов: сильные стороны, ошибки и персональные рекомендации.
            </p>
          </div>

          <div class="feature-item">
            <div class="feature-header">
              <div class="feature-number">06</div>
              <h4 class="feature-title">AI-помощник</h4>
            </div>
            <p class="feature-description">
              Встроенный искусственный интеллект для разбора материала и поддержки.
            </p>
          </div>

          <div class="feature-item">
            <div class="feature-header">
              <div class="feature-number">07</div>
              <h4 class="feature-title">Мультиплатформенность</h4>
            </div>
            <p class="feature-description">
              Доступ с любого устройства с синхронизацией данных в реальном времени.
            </p>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.about-container {
  padding: 120px 0;
  background-color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: start;
}

/* Left Content */
.about-content {
  position: sticky;
  top: 120px;
}

.title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.description {
  font-size: 18px;
  line-height: 1.7;
  color: #4b5563;
  margin-bottom: 48px;
  font-weight: 400;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 16px;
}

.stat-card:hover::before {
  opacity: 0.05;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.3);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  position: relative;
  z-index: 1;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 8px;
  position: relative;
  z-index: 1;
}

/* Right Content */
.features-section {
  padding-left: 24px;
}

.section-subtitle {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 40px;
  letter-spacing: -0.01em;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8));
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
}

.feature-item:hover::before {
  opacity: 0.03;
}

.feature-item:hover {
  transform: translateX(8px);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.2);
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.feature-number {
  width: 32px;
  height: 32px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  letter-spacing: -0.01em;
}

.feature-description {
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
  margin: 0;
  position: relative;
  z-index: 1;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 60px;
  }
  
  .about-content {
    position: static;
  }
  
  .features-section {
    padding-left: 0;
  }
  
  .stats-grid {
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .about-container {
    padding: 80px 0;
  }
  
  .content-wrapper {
    padding: 0 24px;
    gap: 48px;
  }
  
  .title {
    font-size: 36px;
  }
  
  .description {
    font-size: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .features-list {
    gap: 16px;
  }
  
  .feature-item {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 0 16px;
  }
  
  .title {
    font-size: 28px;
  }
  
  .stat-card {
    padding: 20px 12px;
  }
  
  .feature-header {
    gap: 12px;
  }
}
</style>