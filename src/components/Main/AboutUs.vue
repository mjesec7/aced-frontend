<template>
    <section class="about-container">
      <div class="about-content">
        <h2 class="title">О компании ACED</h2>
        <p class="description">
          Мы создаем образовательные технологии нового поколения, которые делают знания доступными каждому человеку в мире.
        </p>
        <p class="description">
          Наша цель — разрушить барьеры, сделать обучение гибким, персонализированным и вдохновляющим.
        </p>
        <p class="description">
          С ACED ты не просто учишься. Ты становишься свободнее, сильнее и готов менять свою реальность.
        </p>
      </div>
  
      <div class="chart-wrapper">
        <h3 class="chart-title">Как ACED изменил мою жизнь</h3>
        <div class="chart-container">
          <canvas id="impactChart" width="600" height="320"></canvas>
        </div>
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
        img.src = src; // ← FIXED LINE!
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

  ctx.shadowColor = '#a855f7';     // ✅ glowing purple
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
  padding: 100px 60px;
  background: radial-gradient(ellipse at center, #1b0032, #0a0018);
  color: white;
  gap: 60px;
  flex-wrap: wrap;
}

.about-content {
  flex: 1;
  max-width: 500px;
}

.title {
  font-family: 'Unbounded', sans-serif;
  font-size: 2.8rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(to right, #a855f7, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.description {
  font-family: 'Unbounded', sans-serif; /* ✅ updated */
  font-size: 1.1rem;
  line-height: 1.8;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.chart-wrapper {
  flex: 1;
  max-width: 700px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  backdrop-filter: blur(20px);
  position: relative;
}

.chart-title {
  font-family: 'Unbounded', sans-serif;
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #ffffff;
}

  </style>
  