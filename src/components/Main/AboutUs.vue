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

      <!-- Right side - Interactive Feature Showcase -->
      <div class="features-section">
        <h3 class="section-subtitle">Возможности платформы</h3>
        
        <!-- Main Feature Display -->
        <div class="main-feature-display">
          <div class="feature-preview">
            <div class="preview-header">
              <div class="preview-indicator"></div>
              <span class="preview-title" id="previewTitle">Структурированное обучение</span>
            </div>
            <div class="preview-content" id="previewContent">
              <!-- Lessons Content -->
              <div class="content-section active" data-content="lessons">
                <div class="lesson-steps">
                  <div class="step active" data-step="explanation">Объяснение</div>
                  <div class="step" data-step="examples">Примеры</div>
                  <div class="step" data-step="practice">Практика</div>
                  <div class="step" data-step="test">Тест</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" id="progressFill"></div>
                </div>
              </div>
              
              <!-- Analytics Content -->
              <div class="content-section" data-content="analytics">
                <div class="analytics-display">
                  <div class="metric-row">
                    <span class="metric-label">Успеваемость:</span>
                    <span class="metric-value">87%</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Сильные стороны:</span>
                    <span class="metric-value">Грамматика, Чтение</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Требует внимания:</span>
                    <span class="metric-value">Аудирование</span>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill analytics-progress"></div>
                </div>
              </div>
              
              <!-- AI Content -->
              <div class="content-section" data-content="ai">
                <div class="ai-chat">
                  <div class="chat-message user">Не понимаю эту тему...</div>
                  <div class="chat-message ai">Давайте разберем пошагово! Начнем с основ...</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ai-progress"></div>
                </div>
              </div>
              
              <!-- Sync Content -->
              <div class="content-section" data-content="sync">
                <div class="sync-devices">
                  <div class="device phone">📱</div>
                  <div class="sync-arrow">⟷</div>
                  <div class="device laptop">💻</div>
                  <div class="sync-arrow">⟷</div>
                  <div class="device tablet">📱</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill sync-progress"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature Navigation -->
        <div class="features-nav">
          <div class="feature-nav-item active" data-feature="lessons">
            <div class="nav-icon">📚</div>
            <span>Уроки</span>
          </div>
          <div class="feature-nav-item" data-feature="analytics">
            <div class="nav-icon">📊</div>
            <span>Аналитика</span>
          </div>
          <div class="feature-nav-item" data-feature="ai">
            <div class="nav-icon">🤖</div>
            <span>AI-помощник</span>
          </div>
          <div class="feature-nav-item" data-feature="sync">
            <div class="nav-icon">🔄</div>
            <span>Синхронизация</span>
          </div>
        </div>

        <!-- Key Benefits Grid -->
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-number">95%</div>
            <div class="benefit-label">Улучшение результатов</div>
          </div>
          <div class="benefit-card">
            <div class="benefit-number">24/7</div>
            <div class="benefit-label">Доступность</div>
          </div>
          <div class="benefit-card">
            <div class="benefit-number">∞</div>
            <div class="benefit-label">Попыток сдачи</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { onMounted } from 'vue';

export default {
  name: 'AboutUs',
  setup() {
    onMounted(() => {
      // Feature navigation functionality
      const navItems = document.querySelectorAll('.feature-nav-item');
      const contentSections = document.querySelectorAll('.content-section');
      const previewTitle = document.getElementById('previewTitle');
      
      // Lesson step functionality
      const lessonSteps = document.querySelectorAll('.step');
      const progressFill = document.getElementById('progressFill');
      
      const featureTitles = {
        lessons: 'Структурированное обучение',
        analytics: 'Детальная аналитика успеваемости',
        ai: 'Персональный AI-помощник',
        sync: 'Синхронизация между устройствами'
      };
      
      const stepProgress = {
        explanation: 25,
        examples: 50,
        practice: 75,
        test: 100
      };
      
      // Navigation click handlers
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          const feature = item.dataset.feature;
          
          // Remove active from all nav items
          navItems.forEach(nav => nav.classList.remove('active'));
          item.classList.add('active');
          
          // Hide all content sections
          contentSections.forEach(section => section.classList.remove('active'));
          
          // Show selected content
          const targetContent = document.querySelector(`[data-content="${feature}"]`);
          if (targetContent) {
            targetContent.classList.add('active');
          }
          
          // Update title
          if (previewTitle && featureTitles[feature]) {
            previewTitle.textContent = featureTitles[feature];
          }
        });
      });
      
      // Lesson step click handlers
      lessonSteps.forEach(step => {
        step.addEventListener('click', () => {
          const stepType = step.dataset.step;
          
          // Remove active from all steps
          lessonSteps.forEach(s => s.classList.remove('active'));
          step.classList.add('active');
          
          // Update progress bar
          if (progressFill && stepProgress[stepType]) {
            progressFill.style.width = stepProgress[stepType] + '%';
            
            // Temporarily pause animation
            progressFill.style.animation = 'none';
            
            // Resume animation after a brief pause
            setTimeout(() => {
              progressFill.style.animation = 'progress-animate 3s infinite';
            }, 1000);
          }
        });
      });
    });
  }
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

/* Right Content - Interactive Showcase */
.features-section {
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-subtitle {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.01em;
  margin: 0;
}

/* Main Feature Display */
.main-feature-display {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.main-feature-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.05));
  border-radius: 16px;
}

.feature-preview {
  position: relative;
  z-index: 1;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.preview-indicator {
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.preview-content {
  position: relative;
  min-height: 120px;
}

.content-section {
  display: none;
  animation: fadeIn 0.3s ease-in-out;
}

.content-section.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Lessons Content */
.lesson-steps {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.step {
  background: #f3f4f6;
  color: #6b7280;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.step.active {
  background: linear-gradient(135deg, #4c1d95, #5b21b6);
  color: white;
  transform: scale(1.05);
}

.step:hover {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

/* Analytics Content */
.analytics-display {
  margin-bottom: 16px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 13px;
  color: #111827;
  font-weight: 600;
}

/* AI Chat Content */
.ai-chat {
  margin-bottom: 16px;
}

.chat-message {
  padding: 8px 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  max-width: 80%;
}

.chat-message.user {
  background: #f3f4f6;
  color: #4b5563;
  margin-left: auto;
}

.chat-message.ai {
  background: linear-gradient(135deg, #4c1d95, #5b21b6);
  color: white;
}

/* Sync Content */
.sync-devices {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.device {
  font-size: 24px;
  animation: bounce 2s infinite;
}

.device:nth-child(1) { animation-delay: 0s; }
.device:nth-child(3) { animation-delay: 0.5s; }
.device:nth-child(5) { animation-delay: 1s; }

.sync-arrow {
  color: #8b5cf6;
  font-size: 16px;
  animation: pulse 1.5s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}

/* Progress Bars */
.progress-bar {
  width: 100%;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s ease;
}

#progressFill {
  width: 35%;
  background: linear-gradient(90deg, #6366f1, #3b82f6);
  animation: progress-animate 3s infinite;
}

.analytics-progress {
  width: 87%;
  background: linear-gradient(90deg, #4c1d95, #5b21b6);
  animation: analytics-animate 4s infinite;
}

.ai-progress {
  width: 60%;
  background: linear-gradient(90deg, #312e81, #4c1d95);
  animation: ai-animate 2s infinite;
}

.sync-progress {
  width: 100%;
  background: linear-gradient(90deg, #1e40af, #3b82f6);
  animation: sync-animate 2.5s infinite;
}

@keyframes progress-animate {
  0% { width: 35%; }
  50% { width: 70%; }
  100% { width: 35%; }
}

@keyframes analytics-animate {
  0% { width: 87%; }
  25% { width: 75%; }
  50% { width: 92%; }
  75% { width: 83%; }
  100% { width: 87%; }
}

@keyframes ai-animate {
  0% { width: 60%; }
  50% { width: 85%; }
  100% { width: 60%; }
}

@keyframes sync-animate {
  0% { width: 100%; opacity: 1; }
  50% { width: 0%; opacity: 0.5; }
  100% { width: 100%; opacity: 1; }
}

/* Feature Navigation */
.features-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.feature-nav-item {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #4c1d95, #5b21b6, #6366f1);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
}

.feature-nav-item:hover::before {
  opacity: 0.1;
}

.feature-nav-item:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 0 0 2px rgba(76, 29, 149, 0.4),
    0 8px 25px rgba(76, 29, 149, 0.2);
  border-color: rgba(76, 29, 149, 0.5);
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 8px;
  display: block;
  position: relative;
  z-index: 1;
}

.feature-nav-item span {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  position: relative;
  z-index: 1;
}

.feature-nav-item:hover span {
  color: #111827;
  font-weight: 600;
}

/* Benefits Grid */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.benefit-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.benefit-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
}

.benefit-card:hover::before {
  opacity: 0.08;
}

.benefit-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 
    0 0 0 2px rgba(139, 92, 246, 0.4),
    0 12px 30px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
}

.benefit-number {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.benefit-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  
  .features-nav {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .benefits-grid {
    grid-template-columns: repeat(3, 1fr);
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
  
  .features-nav {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .main-feature-display {
    padding: 20px;
  }
  
  .lesson-steps {
    flex-wrap: wrap;
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
  
  .features-nav {
    grid-template-columns: 1fr;
  }
  
  .feature-nav-item {
    padding: 12px;
  }
}
</style>