<template>
  <section class="about-container" id="about-us">
    <div class="content-wrapper">
      <div class="about-content">
        <div class="title-section">
          <div class="label-badge">✨ New Generation Education</div>
          <h2 class="title">About ACED Platform</h2>
          <div class="title-accent"></div>
        </div>
        
        <div class="description-wrapper">
          <p class="description">
            ACED is a next-generation learning platform that makes the process 
            <span class="highlight-text" data-highlight="interactive">interactive</span>, 
            <span class="highlight-text" data-highlight="personalized">personalized</span> and 
            <span class="highlight-text" data-highlight="measurable">measurable</span>. 
            Our main focus is modern and comprehensive education, where students gain not only language skills but also knowledge in other important disciplines.
          </p>
        </div>

        <div class="cards-grid">
          <div class="mission-card glass-card">
            <div class="card-header">
              <div class="card-icon">🎯</div>
              <h4 class="card-title">Our Mission</h4>
            </div>
            <p class="card-text">
              Transform education through technology, making quality learning accessible to every student.
            </p>
            <div class="card-shine"></div>
          </div>

          <div class="vision-card glass-card">
            <div class="card-header">
              <div class="card-icon">🌟</div>
              <h4 class="card-title">Our Vision</h4>
            </div>
            <p class="card-text">
              Creating a personalized learning ecosystem where every student can unlock their potential with modern AI technologies.
            </p>
            <div class="card-shine"></div>
          </div>
        </div>
      </div>

      <div class="features-section">
        <h3 class="section-subtitle">Platform Features</h3>
        
        <div class="main-feature-display glass-card">
          <div class="feature-preview">
            <div class="preview-header">
              <div class="preview-indicator"></div>
              <span class="preview-title" id="previewTitle">Structured Learning</span>
            </div>
            <div class="preview-content" id="previewContent">
              <div class="content-section active" data-content="lessons">
                <div class="lesson-steps">
                  <div class="step active" data-step="explanation">Explanation</div>
                  <div class="step" data-step="examples">Examples</div>
                  <div class="step" data-step="practice">Practice</div>
                  <div class="step" data-step="test">Test</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" id="progressFill"></div>
                </div>
              </div>
              
              <div class="content-section" data-content="analytics">
                <div class="analytics-display">
                  <div class="metric-row">
                    <span class="metric-label">Performance:</span>
                    <span class="metric-value">87%</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Strengths:</span>
                    <span class="metric-value">Grammar, Reading</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Needs Attention:</span>
                    <span class="metric-value">Listening</span>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill analytics-progress"></div>
                </div>
              </div>
              
              <div class="content-section" data-content="ai">
                <div class="ai-chat">
                  <div class="chat-message user">I don't understand this topic...</div>
                  <div class="chat-message ai">Let's break it down step by step! Starting with the basics...</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ai-progress"></div>
                </div>
              </div>
              
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
          <div class="card-shine"></div>
        </div>

        <div class="features-nav">
          <div class="feature-nav-item glass-card active" data-feature="lessons">
            <div class="nav-icon">📚</div>
            <span>Lessons</span>
            <div class="nav-shine"></div>
          </div>
          <div class="feature-nav-item glass-card" data-feature="analytics">
            <div class="nav-icon">📊</div>
            <span>Analytics</span>
            <div class="nav-shine"></div>
          </div>
          <div class="feature-nav-item glass-card" data-feature="ai">
            <div class="nav-icon">🤖</div>
            <span>AI Assistant</span>
            <div class="nav-shine"></div>
          </div>
          <div class="feature-nav-item glass-card" data-feature="sync">
            <div class="nav-icon">🔄</div>
            <span>Sync</span>
            <div class="nav-shine"></div>
          </div>
        </div>

        <div class="benefits-grid">
          <div class="benefit-card glass-card">
            <div class="benefit-number">95%</div>
            <div class="benefit-label">Results Improvement</div>
            <div class="card-shine"></div>
          </div>
          <div class="benefit-card glass-card">
            <div class="benefit-number">24/7</div>
            <div class="benefit-label">Availability</div>
            <div class="card-shine"></div>
          </div>
          <div class="benefit-card glass-card">
            <div class="benefit-number">∞</div>
            <div class="benefit-label">Unlimited Attempts</div>
            <div class="card-shine"></div>
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
      const navItems = document.querySelectorAll('.feature-nav-item');
      const contentSections = document.querySelectorAll('.content-section');
      const previewTitle = document.getElementById('previewTitle');
      const lessonSteps = document.querySelectorAll('.step');
      const progressFill = document.getElementById('progressFill');
      const highlightTexts = document.querySelectorAll('.highlight-text');
      
      const featureTitles = {
        lessons: 'Structured Learning',
        analytics: 'Detailed Performance Analytics',
        ai: 'Personal AI Assistant',
        sync: 'Cross-Device Sync'
      };
      
      const stepProgress = {
        explanation: 25,
        examples: 50,
        practice: 75,
        test: 100
      };
      
      highlightTexts.forEach(text => {
        text.addEventListener('mouseenter', () => {
          const highlight = text.dataset.highlight;
          text.style.transform = 'scale(1.05)';
          
          if (highlight === 'interactive') {
            text.style.animation = 'bounce 0.6s ease';
          } else if (highlight === 'personalized') {
            text.style.animation = 'pulse 0.6s ease';
          } else if (highlight === 'measurable') {
            text.style.animation = 'shake 0.6s ease';
          }
        });
        
        text.addEventListener('mouseleave', () => {
          text.style.transform = 'scale(1)';
          text.style.animation = 'none';
        });
      });
      
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          const feature = item.dataset.feature;
          
          navItems.forEach(nav => nav.classList.remove('active'));
          item.classList.add('active');
          
          contentSections.forEach(section => section.classList.remove('active'));
          
          const targetContent = document.querySelector(`[data-content="${feature}"]`);
          if (targetContent) {
            targetContent.classList.add('active');
          }
          
          if (previewTitle && featureTitles[feature]) {
            previewTitle.textContent = featureTitles[feature];
          }
        });
      });
      
      lessonSteps.forEach(step => {
        step.addEventListener('click', () => {
          const stepType = step.dataset.step;
          
          lessonSteps.forEach(s => s.classList.remove('active'));
          step.classList.add('active');
          
          if (progressFill && stepProgress[stepType]) {
            progressFill.style.width = stepProgress[stepType] + '%';
            progressFill.style.animation = 'none';
            setTimeout(() => {
              progressFill.style.animation = 'progress-animate 3s infinite';
            }, 1000);
          }
        });
      });
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1.05); }
          40% { transform: translateY(-5px) scale(1.05); }
          60% { transform: translateY(-3px) scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0) scale(1.05); }
          25% { transform: translateX(-2px) scale(1.05); }
          75% { transform: translateX(2px) scale(1.05); }
        }
      `;
      document.head.appendChild(style);
    });
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.about-container {
  padding: 120px 0;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  font-family: 'Inter', sans-serif;
  color: #0a0a0a;
  position: relative;
  overflow: hidden;
}

.about-container::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.04) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(60px);
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 50px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: start;
  position: relative;
  z-index: 2;
}

/* Left Content */
.about-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 30px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #7c3aed;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.title {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0;
}

.title-accent {
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  border-radius: 2px;
  animation: accent-grow 2s ease-in-out infinite alternate;
}

@keyframes accent-grow {
  0% { width: 80px; opacity: 0.8; }
  100% { width: 140px; opacity: 1; }
}

.description {
  font-size: clamp(1.0625rem, 2vw, 1.1875rem);
  line-height: 1.7;
  color: #404040;
  font-weight: 400;
  margin: 0;
}

.highlight-text {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.highlight-text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  transition: width 0.3s ease;
}

.highlight-text:hover::after {
  width: 100%;
}

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(25px);
  border-radius: 16px;
  border: 1.5px solid rgba(139, 92, 246, 0.15);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.08);
}

.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.glass-card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.2);
}

.glass-card:hover::before {
  opacity: 1;
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
  pointer-events: none;
}

.glass-card:hover .card-shine {
  left: 100%;
}

.mission-card,
.vision-card {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
  z-index: 2;
}

.card-icon {
  font-size: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0a0a0a;
  margin: 0;
}

.card-text {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #525252;
  margin: 0;
  position: relative;
  z-index: 2;
}

/* Features Section */
.features-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0a0a0a;
  letter-spacing: -0.01em;
  margin: 0;
}

.main-feature-display {
  padding: 28px;
}

.feature-preview {
  position: relative;
  z-index: 2;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.preview-indicator {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
}

.preview-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0a0a0a;
}

.preview-content {
  position: relative;
  min-height: 120px;
}

.content-section {
  display: none;
  animation: fadeIn 0.4s ease;
}

.content-section.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.lesson-steps {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.step {
  background: rgba(139, 92, 246, 0.08);
  color: #737373;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1.5px solid transparent;
}

.step.active {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  transform: scale(1.05);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.step:hover:not(.active) {
  background: rgba(139, 92, 246, 0.15);
  color: #7c3aed;
  border-color: rgba(139, 92, 246, 0.2);
}

.analytics-display {
  margin-bottom: 16px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-label {
  font-size: 0.875rem;
  color: #737373;
  font-weight: 500;
}

.metric-value {
  font-size: 0.875rem;
  color: #0a0a0a;
  font-weight: 600;
}

.ai-chat {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.8125rem;
  max-width: 85%;
  line-height: 1.5;
}

.chat-message.user {
  background: rgba(139, 92, 246, 0.08);
  color: #525252;
  margin-left: auto;
  border: 1px solid rgba(139, 92, 246, 0.15);
}

.chat-message.ai {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.sync-devices {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.device {
  font-size: 2rem;
  animation: bounce 2s infinite;
}

.device:nth-child(1) { animation-delay: 0s; }
.device:nth-child(3) { animation-delay: 0.5s; }
.device:nth-child(5) { animation-delay: 1s; }

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}

.sync-arrow {
  color: #8b5cf6;
  font-size: 1.25rem;
  animation: pulse 1.5s infinite;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(139, 92, 246, 0.1);
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
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  animation: progress-animate 3s infinite;
}

.analytics-progress {
  width: 87%;
  background: linear-gradient(90deg, #7c3aed, #6d28d9);
  animation: analytics-animate 4s infinite;
}

.ai-progress {
  width: 60%;
  background: linear-gradient(90deg, #6d28d9, #5b21b6);
  animation: ai-animate 2s infinite;
}

.sync-progress {
  width: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
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

/* Features Navigation */
.features-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.feature-nav-item {
  padding: 18px 14px;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.feature-nav-item .nav-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.feature-nav-item:hover .nav-shine {
  left: 100%;
}

.feature-nav-item.active {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.feature-nav-item.active .nav-icon {
  filter: brightness(2);
  transform: scale(1.1);
}

.feature-nav-item.active span {
  color: white !important;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
  display: block;
  position: relative;
  z-index: 2;
  transition: transform 0.3s ease;
}

.feature-nav-item span {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #525252;
  position: relative;
  z-index: 2;
  transition: color 0.3s ease;
}

.feature-nav-item:hover:not(.active) span {
  color: #7c3aed;
  font-weight: 600;
}

/* Benefits Grid */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.benefit-card {
  padding: 24px 18px;
  text-align: center;
}

.benefit-number {
  font-size: 2.25rem;
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.benefit-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 2;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 60px;
    padding: 0 40px;
  }
  
  .features-nav {
    grid-template-columns: repeat(2, 1fr);
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
  
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .main-feature-display {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 0 16px;
  }
  
  .features-nav {
    grid-template-columns: 1fr;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>