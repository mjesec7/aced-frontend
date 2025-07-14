<template>
  <section class="about-container">
    <div class="about-content">
      <h2 class="title">О платформе ACED</h2>
      <p class="description">
        ACED — это инновационная образовательная платформа, созданная в Узбекистане для нового поколения учеников. 
        Мы только начинаем свой путь, но уже применяем лучшие мировые практики образования с современными технологиями.
      </p>
      <p class="description">
        Наша миссия — сделать качественное образование доступным для каждого студента в Узбекистане. 
        Мы создаем персонализированные программы обучения, которые адаптируются под уникальные потребности и цели каждого учащегося.
      </p>
      <p class="description">
        От школьной программы до профессиональных навыков — ACED готов помочь узбекским студентам раскрыть свой потенциал 
        и подготовиться к успешному будущему в глобальной экономике.
      </p>
      
      <div class="achievement-stats">
        <div class="stat-item">
          <span class="stat-number">2024</span>
          <span class="stat-label">Год основания</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">5+</span>
          <span class="stat-label">Предметов доступно</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">∞</span>
          <span class="stat-label">Возможностей</span>
        </div>
      </div>
    </div>

    <div class="chart-wrapper">
      <h3 class="chart-title">Потенциал влияния ACED на жизнь студентов</h3>
      <div class="chart-container">
        <canvas id="impactChart" width="600" height="360"></canvas>
      </div>
      <p class="chart-subtitle">
        Прогнозируемые результаты на основе исследований эффективности современных образовательных платформ
      </p>
    </div>
  </section>
</template>

<script>
import { onMounted } from 'vue'
import Chart from 'chart.js/auto'

// Import SVG icons
import happy from '@/assets/icons/happy.svg'
import confidence from '@/assets/icons/confidence.svg'
import motivation from '@/assets/icons/motivation.svg'
import freedom from '@/assets/icons/freedom.svg'
import world from '@/assets/icons/world.svg'

export default {
name: 'AboutUs',
setup() {
  onMounted(() => {
    const canvas = document.getElementById('impactChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');

    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#4c1d95');
    gradient.addColorStop(0.5, '#9333ea');
    gradient.addColorStop(1, '#c084fc');

    const icons = [happy, confidence, motivation, freedom, world];

    const loadImages = (sources) => {
      return Promise.all(
        sources.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
          });
        })
      );
    };

    // Wait for all icons to load before creating the chart
    loadImages(icons).then((images) => {
      const iconPlugin = {
        id: 'icons',
        afterDatasetsDraw(chart) {
          const { ctx, scales: { y } } = chart;
          ctx.save();

          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 0;

          images.forEach((img, index) => {
            const yPos = y.getPixelForTick(index);
            const iconSize = 24;
            // Position icons further to the left to avoid overlap
            ctx.drawImage(img, -45, yPos - iconSize / 2, iconSize, iconSize);
          });

          ctx.restore();
        }
      };

      // Create the chart after icons are ready
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [
            'Уровень счастья',
            'Уверенность в себе', 
            'Мотивация учиться',
            'Чувство свободы',
            'Готовность менять мир'
          ],
          datasets: [{
            label: 'ACED Impact',
            data: [92, 88, 95, 85, 90],
            backgroundColor: gradient,
            borderRadius: 8,
            barThickness: 25
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              left: 60,  // Reduced padding
              right: 40,
              top: 20,
              bottom: 20
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,  // Set maximum to 100%
              grid: { 
                display: false 
              },
              ticks: {
                color: '#cbd5e1',
                callback: val => val + '%',
                font: { 
                  family: 'Unbounded',
                  size: 11
                }
              }
            },
            y: {
              grid: { 
                display: false 
              },
              ticks: {
                padding: 15,  // Reduced padding
                color: '#ffffff',
                font: { 
                  family: 'Unbounded', 
                  size: 11  // Smaller font size
                }
              }
            }
          },
          plugins: {
            legend: { 
              display: false 
            },
            tooltip: {
              backgroundColor: '#1e1b4b',
              titleColor: '#fff',
              bodyColor: '#d1d5db',
              callbacks: {
                label: function(context) {
                  return context.parsed.x + '%';
                }
              }
            }
          }
        },
        plugins: [iconPlugin]
      });
    }).catch((err) => {
      console.error('Failed to load one or more icons:', err);
      
      // Fallback chart without icons
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [
            'Уровень счастья',
            'Уверенность в себе',
            'Мотивация учиться', 
            'Чувство свободы',
            'Готовность менять мир'
          ],
          datasets: [{
            label: 'ACED Impact',
            data: [92, 88, 95, 85, 90],
            backgroundColor: gradient,
            borderRadius: 8,
            barThickness: 25
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              left: 20,
              right: 40,
              top: 20,
              bottom: 20
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              grid: { display: false },
              ticks: {
                color: '#cbd5e1',
                callback: val => val + '%',
                font: { family: 'Unbounded', size: 11 }
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                padding: 15,
                color: '#ffffff',
                font: { family: 'Unbounded', size: 11 }
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e1b4b',
              titleColor: '#fff',
              bodyColor: '#d1d5db',
              callbacks: {
                label: function(context) {
                  return context.parsed.x + '%';
                }
              }
            }
          }
        }
      });
    });
  });
}
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&display=swap');

.about-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: clamp(40px, 8vw, 100px) clamp(20px, 5vw, 60px);
  background: radial-gradient(ellipse at center, #1b0032, #0a0018);
  color: white;
  gap: clamp(30px, 6vw, 60px);
  flex-wrap: wrap;
  min-height: 100vh;
}

.about-content {
  flex: 1;
  max-width: clamp(350px, 50vw, 500px);
  min-width: 280px;
}

.title {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  margin-bottom: clamp(20px, 4vw, 1.5rem);
  background: linear-gradient(to right, #a855f7, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.description {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  line-height: 1.8;
  color: #d1d5db;
  margin-bottom: clamp(15px, 3vw, 1rem);
}

.achievement-stats {
  display: flex;
  gap: clamp(15px, 4vw, 30px);
  margin-top: clamp(30px, 5vw, 40px);
  flex-wrap: wrap;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  padding: clamp(12px, 3vw, 20px);
  border-radius: clamp(10px, 2vw, 15px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  flex: 1;
  min-width: 100px;
  max-width: 140px;
}

.stat-number {
  display: block;
  font-size: clamp(1.3rem, 4vw, 2rem);
  font-weight: 700;
  color: #a855f7;
  margin-bottom: clamp(5px, 1vw, 8px);
  font-family: 'Unbounded', sans-serif;
}

.stat-label {
  font-size: clamp(0.75rem, 2vw, 0.9rem);
  color: #cbd5e1;
  font-family: 'Unbounded', sans-serif;
  line-height: 1.2;
}

.chart-wrapper {
  flex: 1;
  max-width: clamp(450px, 60vw, 750px);  /* Slightly larger */
  min-width: 350px;  /* Increased minimum width */
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: clamp(15px, 3vw, 20px);
  padding: clamp(25px, 4vw, 40px);  /* Increased padding */
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  backdrop-filter: blur(20px);
  position: relative;
}

.chart-title {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  text-align: center;
  margin-bottom: clamp(20px, 3vw, 1.5rem);
  color: #ffffff;
  line-height: 1.3;
}

.chart-container {
  width: 100%;
  height: clamp(280px, 35vw, 360px);  /* Increased minimum height */
  position: relative;
  overflow: visible;  /* Allow icons to show outside container */
}

.chart-subtitle {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(0.75rem, 2vw, 0.9rem);
  text-align: center;
  margin-top: clamp(15px, 3vw, 20px);
  color: #9ca3af;
  font-style: italic;
}

/* Mobile specific styles */
@media (max-width: 768px) {
  .about-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 30px 15px;
    gap: 25px;
  }
  
  .about-content {
    max-width: 100%;
    margin-bottom: 20px;
  }
  
  .achievement-stats {
    justify-content: center;
    gap: 10px;
  }
  
  .stat-item {
    min-width: 90px;
    max-width: 120px;
  }
  
  .chart-wrapper {
    width: 100%;
    max-width: 100%;
    padding: 20px 15px;
    min-width: 300px;
  }
  
  .chart-container {
    height: 300px;  /* Increased mobile height */
  }
}

/* Small mobile (320px and below) */
@media (max-width: 320px) {
  .about-container {
    padding: 20px 10px;
  }
  
  .achievement-stats {
    flex-direction: column;
    align-items: center;
  }
  
  .stat-item {
    width: 100%;
    max-width: 200px;
  }
  
  .chart-wrapper {
    padding: 15px 10px;
  }
  
  .chart-container {
    height: 320px;
  }
}

/* Tablet specific styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .about-container {
    gap: 40px;
    padding: 60px 30px;
  }
  
  .achievement-stats {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .chart-container {
    height: 320px;
  }
}

/* Large screen styles */
@media (min-width: 1400px) {
  .about-container {
    padding: 120px 80px;
    gap: 80px;
  }
  
  .title {
    font-size: 3.2rem;
  }
  
  .description {
    font-size: 1.2rem;
  }
  
  .chart-container {
    height: 400px;
  }
}

/* Extra large screens */
@media (min-width: 1920px) {
  .about-container {
    padding: 140px 100px;
    gap: 100px;
  }
  
  .title {
    font-size: 3.5rem;
  }
  
  .description {
    font-size: 1.3rem;
  }
  
  .chart-container {
    height: 440px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .stat-item:hover {
    transform: none;
  }
  
  .stat-item:active {
    transform: scale(0.95);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .stat-item {
    transition: none;
  }
  
  .stat-item:hover,
  .stat-item:active {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .about-container {
    background: #000;
  }
  
  .chart-wrapper,
  .stat-item {
    border: 2px solid rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.8);
  }
  
  .title {
    -webkit-text-fill-color: #a855f7;
  }
}

/* Portrait orientation adjustments */
@media (orientation: portrait) and (max-width: 768px) {
  .about-container {
    min-height: auto;
    padding: 40px 20px;
  }
  
  .chart-container {
    height: 280px;
  }
}

/* Landscape orientation adjustments */
@media (orientation: landscape) and (max-height: 600px) {
  .about-container {
    padding: 30px 40px;
    min-height: auto;
  }
  
  .chart-container {
    height: 240px;
  }
}
</style>