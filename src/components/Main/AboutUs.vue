<template>
  <section class="about-container" id="about-us">
    <div class="content-wrapper">
      <div class="about-content">
        <h2 class="title">О платформе ACED</h2>
        <p class="description">
          ACED — это инновационная образовательная платформа, созданная в Узбекистане для нового поколения. Мы применяем лучшие мировые практики с современными технологиями.
        </p>
        <div class="achievement-stats">
          <div class="stat-item"><span class="stat-number">2024</span><span class="stat-label">Год основания</span></div>
          <div class="stat-item"><span class="stat-number">5+</span><span class="stat-label">Предметов</span></div>
          <div class="stat-item"><span class="stat-number">∞</span><span class="stat-label">Возможностей</span></div>
        </div>
      </div>
      <div class="chart-wrapper">
        <h3 class="chart-title">Потенциал влияния ACED</h3>
        <div class="chart-container"><canvas id="impactChart"></canvas></div>
      </div>
    </div>
  </section>
</template>

<script>
import { onMounted } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'AboutUs',
  setup() {
    onMounted(() => {
      const ctx = document.getElementById('impactChart')?.getContext('2d');
      if (!ctx) return;
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(124, 58, 237, 0.6)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.2)');

      const borderGradient = ctx.createLinearGradient(0, 0, 0, 400);
      borderGradient.addColorStop(0, '#7c3aed');
      borderGradient.addColorStop(1, '#06b6d4');
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Знания', 'Навыки', 'Уверенность', 'Карьера', 'Сообщество'],
          datasets: [{
            label: 'Потенциал влияния',
            data: [90, 85, 95, 80, 88],
            backgroundColor: gradient,
            borderColor: borderGradient,
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 30,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#ffffff',
              titleColor: '#1f2937',
              bodyColor: '#4b5563',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                  label: function(context) {
                      return ` ${context.dataset.label}: ${context.parsed.y}%`;
                  }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: '#e5e7eb' // Changed for light theme
              },
              ticks: {
                color: '#6b7280', // Changed for light theme
                font: {
                  family: "'Unbounded', sans-serif"
                },
                callback: function(value) {
                  return value + '%'
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#6b7280', // Changed for light theme
                font: {
                  family: "'Unbounded', sans-serif",
                  size: 11
                }
              }
            }
          }
        }
      });
    });
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&display=swap');

.about-container {
  padding: 80px 40px;
  background-color: #ffffff; /* Changed to white */
  font-family: 'Unbounded', sans-serif;
  color: #1f2937; /* Changed to dark text color */
}
.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 4rem;
  align-items: center;
  flex-wrap: wrap;
}
.about-content, .chart-wrapper {
  flex: 1;
  min-width: 300px;
}
.title {
  font-size: clamp(2.2rem, 5vw, 2.8rem);
  font-weight: 700;
  background: linear-gradient(to right, #a855f7, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}
.description {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  line-height: 1.8;
  color: #4b5563; /* Changed for better contrast */
  margin-bottom: 2.5rem;
  max-width: 600px;
}
.achievement-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.stat-item {
  text-align: center;
  background: #f9fafb; /* Light gray background */
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb; /* Light gray border */
  flex: 1;
  min-width: 120px;
  transition: transform 0.3s ease;
}
.stat-item:hover {
    transform: translateY(-5px);
}
.stat-number {
  display: block;
  font-size: clamp(1.8rem, 4vw, 2rem);
  font-weight: 700;
  color: #9333ea; /* Darker purple for contrast */
}
.stat-label {
  font-size: 0.8rem;
  color: #6b7280; /* Darker gray for contrast */
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.chart-wrapper {
  background: #ffffff; /* Changed to white */
  border: 1px solid #e5e7eb; /* Light gray border */
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05); /* Softer shadow */
}
.chart-title {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #1f2937; /* Dark text color */
}
.chart-container {
  height: 350px;
  width: 100%;
}

@media (max-width: 992px) {
    .content-wrapper {
        flex-direction: column;
        gap: 3rem;
    }
    .about-content {
        text-align: center;
    }
    .achievement-stats {
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .about-container {
        padding: 60px 20px;
    }
    .achievement-stats {
        gap: 1rem;
    }
    .stat-item {
        flex-basis: 45%;
    }
    .chart-wrapper {
        padding: 1.5rem;
    }
}
</style>
