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
          <span class="stat-number">6+</span>
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
        <canvas id="impactChart" width="600" height="320"></canvas>
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
ctx.shadowBlur = 9;
ctx.shadowOffsetX = 3;
ctx.shadowOffsetY = 0;

images.forEach((img, index) => {
  const yPos = y.getPixelForTick(index);
  const iconSize = 28;
  ctx.drawImage(img, 5, yPos - iconSize / 2, iconSize, iconSize);
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
            borderRadius: 15
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              left: 100,
              right: 100
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#cbd5e1',
                callback: val => val + '%',
                font: { family: 'Unbounded' }
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                padding: 20,
                color: '#ffffff',
                font: { family: 'Unbounded', size: 14 }
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e1b4b',
              titleColor: '#fff',
              bodyColor: '#d1d5db'
            }
          }
        },
        plugins: [iconPlugin]
      });
    }).catch((err) => {
      console.error('Failed to load one or more icons:', err);
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
  max-width: clamp(400px, 50vw, 500px);
  min-width: 300px;
}

.title {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(2rem, 5vw, 2.8rem);
  margin-bottom: clamp(20px, 4vw, 1.5rem);
  background: linear-gradient(to right, #a855f7, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.description {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(0.95rem, 2.5vw, 1.1rem);
  line-height: 1.8;
  color: #d1d5db;
  margin-bottom: clamp(15px, 3vw, 1rem);
}

.achievement-stats {
  display: flex;
  gap: clamp(20px, 4vw, 30px);
  margin-top: clamp(30px, 5vw, 40px);
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  padding: clamp(15px, 3vw, 20px);
  border-radius: clamp(10px, 2vw, 15px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  flex: 1;
  min-width: 120px;
}

.stat-number {
  display: block;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  color: #a855f7;
  margin-bottom: clamp(5px, 1vw, 8px);
  font-family: 'Unbounded', sans-serif;
}

.stat-label {
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: #cbd5e1;
  font-family: 'Unbounded', sans-serif;
  line-height: 1.2;
}

.chart-wrapper {
  flex: 1;
  max-width: clamp(500px, 60vw, 700px);
  min-width: 300px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: clamp(15px, 3vw, 20px);
  padding: clamp(20px, 4vw, 3rem);
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  backdrop-filter: blur(20px);
  position: relative;
}

.chart-title {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  text-align: center;
  margin-bottom: clamp(20px, 3vw, 1.5rem);
  color: #ffffff;
  line-height: 1.3;
}

.chart-container {
  width: 100%;
  height: clamp(250px, 40vw, 320px);
  position: relative;
}

.chart-subtitle {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
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
  }
  
  .about-content {
    max-width: 100%;
    margin-bottom: 30px;
  }
  
  .achievement-stats {
    justify-content: center;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-item {
    width: 100%;
    max-width: 200px;
  }
  
  .chart-wrapper {
    width: 100%;
    max-width: 100%;
  }
  
  .chart-container {
    height: 280px;
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
    height: 300px;
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
    height: 360px;
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
}</style>