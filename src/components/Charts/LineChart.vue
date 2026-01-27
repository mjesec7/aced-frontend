<template>
  <div class="chart-container">
    <canvas ref="lineChartRef"></canvas>
  </div>
</template>

  
<script>
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default {
  name: 'LineChart',
  props: {
    chartData: {
      type: Object,
      required: true
    }
  },
  mounted() {
    const ctx = this.$refs.lineChartRef.getContext('2d')

    const gradientStroke = ctx.createLinearGradient(0, 0, 0, 400)
    gradientStroke.addColorStop(0, '#9333ea') // violet
    gradientStroke.addColorStop(1, '#ec4899') // pink

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 320)
    gradientFill.addColorStop(0, 'rgba(147, 51, 234, 0.25)')
    gradientFill.addColorStop(1, 'rgba(236, 72, 153, 0)')

    const dataset = {
      ...this.chartData.datasets[0],
      borderColor: gradientStroke,
      backgroundColor: gradientFill,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#9333ea',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 7,
      pointHoverBackgroundColor: '#f472b6',
      pointHoverBorderColor: '#fff',
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.chartData.labels,
        datasets: [dataset]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#fefefe',
            bodyColor: '#d1d5db',
            padding: 12,
            cornerRadius: 10,
            titleFont: { family: 'Unbounded', size: 14 },
            bodyFont: { family: 'Inter', size: 12 }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#6b7280',
              font: { family: 'Inter', size: 12 }
            },
            grid: {
              color: 'rgba(100, 100, 100, 0.05)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#6b7280',
              font: { family: 'Inter', size: 12 }
            },
            grid: {
              color: 'rgba(100, 100, 100, 0.07)'
            }
          }
        }
      }
    })
  }
}
</script>

  
  <style scoped>
  .chart-container {
  height: 340px;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(to bottom, #fdfbff, #f3f4f6);
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.08),
              0 4px 20px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.chart-container:hover {
  box-shadow: 0 12px 38px rgba(168, 85, 247, 0.2),
              0 8px 28px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

  </style>
  