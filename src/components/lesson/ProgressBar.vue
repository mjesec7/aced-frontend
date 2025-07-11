<template>
    <div class="progress-section">
      <div class="progress-bar-wrapper">
        <div class="progress-bar" :style="{ width: progressPercentage + '%' }">
          <div class="progress-shine"></div>
        </div>
        <div class="progress-markers">
          <div 
            v-for="marker in progressMarkers" 
            :key="marker.id"
            class="progress-marker"
            :class="{ 
              'completed': marker.completed,
              'current': marker.current 
            }"
            :style="{ left: marker.position + '%' }"
            :title="marker.title"
          >
            <div class="marker-dot"></div>
          </div>
        </div>
      </div>
      <div class="progress-info">
        <span class="progress-label">{{ progressPercentage }}% завершено</span>
        <span class="stars-display">⭐ {{ stars }}</span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ProgressBar',
    props: {
      progressPercentage: {
        type: Number,
        required: true,
        default: 0
      },
      stars: {
        type: Number,
        default: 0
      },
      currentStep: {
        type: Number,
        default: 0
      },
      totalSteps: {
        type: Number,
        default: 1
      }
    },
    computed: {
      progressMarkers() {
        if (this.totalSteps <= 1) return [];
        
        const markers = [];
        const stepWidth = 100 / (this.totalSteps - 1);
        
        for (let i = 0; i < this.totalSteps; i++) {
          markers.push({
            id: i,
            position: i * stepWidth,
            completed: i < this.currentStep,
            current: i === this.currentStep,
            title: `Шаг ${i + 1}`
          });
        }
        
        return markers;
      }
    }
  }
  </script>
  
  <style scoped>
  .progress-section {
    background: white;
    padding: 20px 32px;
    border-bottom: 1px solid #e2e8f0;
    position: relative;
  }
  
  .progress-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  }
  
  .progress-bar-wrapper {
    position: relative;
    background: #f1f5f9;
    height: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: inherit;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .progress-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.3), 
      transparent
    );
    animation: progressShine 2s infinite;
  }
  
  @keyframes progressShine {
    0% { 
      left: -100%; 
    }
    100% { 
      left: 100%; 
    }
  }
  
  .progress-markers {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
  
  .progress-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
  }
  
  .marker-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    border: 3px solid #cbd5e1;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  .progress-marker.completed .marker-dot {
    background: #3b82f6;
    border-color: #3b82f6;
    transform: scale(1.1);
  }
  
  .progress-marker.current .marker-dot {
    background: #f59e0b;
    border-color: #f59e0b;
    transform: scale(1.2);
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.1);
    }
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  
  .progress-label {
    font-size: 0.95rem;
    color: #475569;
    font-weight: 600;
  }
  
  .stars-display {
    font-size: 0.95rem;
    color: #f59e0b;
    font-weight: 700;
    padding: 6px 12px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 20px;
    border: 1px solid #fbbf24;
    transition: all 0.2s ease;
  }
  
  .stars-display:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.2);
  }
  
  /* Enhanced progress bar states */
  .progress-bar[style*="100%"] {
    background: linear-gradient(90deg, #059669 0%, #047857 100%);
  }
  
  .progress-bar[style*="100%"] .progress-shine {
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.4), 
      transparent
    );
    animation-duration: 1s;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .progress-section {
      padding: 16px 20px;
    }
  
    .progress-bar-wrapper {
      height: 10px;
      margin-bottom: 12px;
    }
  
    .marker-dot {
      width: 12px;
      height: 12px;
      border-width: 2px;
    }
  
    .progress-marker.completed .marker-dot,
    .progress-marker.current .marker-dot {
      transform: scale(1);
    }
  
    .progress-info {
      gap: 12px;
    }
  
    .progress-label,
    .stars-display {
      font-size: 0.9rem;
    }
  
    .stars-display {
      padding: 4px 10px;
    }
  }
  
  @media (max-width: 480px) {
    .progress-section {
      padding: 12px 16px;
    }
  
    .progress-bar-wrapper {
      height: 8px;
      margin-bottom: 10px;
    }
  
    .marker-dot {
      width: 10px;
      height: 10px;
      border-width: 2px;
    }
  
    .progress-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  
    .progress-label,
    .stars-display {
      font-size: 0.85rem;
    }
  
    .stars-display {
      align-self: flex-end;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .progress-bar-wrapper {
      border: 2px solid #000;
    }
    
    .progress-bar {
      background: #000;
    }
    
    .marker-dot {
      border-width: 3px;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .progress-bar {
      transition: width 0.2s ease;
    }
    
    .progress-shine {
      animation: none;
    }
    
    .progress-marker.current .marker-dot {
      animation: none;
    }
    
    .stars-display:hover {
      transform: none;
    }
  }
  
  /* Print styles */
  @media print {
    .progress-section {
      background: white;
      border-bottom: 1px solid #000;
    }
    
    .progress-bar-wrapper {
      background: #ccc;
    }
    
    .progress-bar {
      background: #000;
    }
    
    .progress-shine {
      display: none;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .progress-section {
      background: #1e293b;
      border-bottom-color: #374151;
    }
    
    .progress-bar-wrapper {
      background: #374151;
    }
    
    .progress-label {
      color: #e2e8f0;
    }
    
    .marker-dot {
      background: #1e293b;
      border-color: #6b7280;
    }
    
    .progress-marker.completed .marker-dot {
      background: #3b82f6;
      border-color: #3b82f6;
    }
  }
  </style>