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
  
      const gradient = ctx.createLinearGradient(0, 0, 0, 300)
      gradient.addColorStop(0, '#7c3aed') // Soft purple
      gradient.addColorStop(1, '#ec4899') // Pinkish highlight
  
      const filledGradient = ctx.createLinearGradient(0, 0, 0, 300)
      filledGradient.addColorStop(0, 'rgba(168, 85, 247, 0.15)')
      filledGradient.addColorStop(1, 'rgba(168, 85, 247, 0)')
  
      const dataset = {
        ...this.chartData.datasets[0],
        borderColor: gradient,
        backgroundColor: filledGradient,
        tension: 0.45,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: '#a855f7',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#f472b6'
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
            duration: 1200,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1f1f2e',
              titleColor: '#fefefe',
              bodyColor: '#cfcfcf',
              cornerRadius: 8,
              padding: 12,
              boxPadding: 4
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#555',
                font: { family: 'Inter', size: 12 }
              },
              grid: {
                color: 'rgba(200, 200, 255, 0.05)'
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#555',
                font: { family: 'Inter', size: 12 }
              },
              grid: {
                color: 'rgba(200, 200, 255, 0.07)'
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
    height: 320px;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    background: #f9fafb;
    box-shadow: 0 0 18px rgba(168, 85, 247, 0.12),
                0 2px 12px rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.3s ease;
  }
  .chart-container:hover {
    box-shadow: 0 0 24px rgba(168, 85, 247, 0.2),
                0 6px 20px rgba(0, 0, 0, 0.08);
  }
  </style>
  