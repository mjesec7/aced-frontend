<template>
    <div class="lesson-header">
      <button class="exit-btn-small" @click="$emit('exit')">✕</button>
      <h2 class="lesson-title">{{ getLocalized(lesson?.lessonName) || 'Урок' }}</h2>
      <div class="lesson-meta">
        <div class="timer-display">⏱ {{ formattedTime }}</div>
        <div class="step-counter">{{ currentStep }}/{{ totalSteps }}</div>
        <div class="stars-display">⭐ {{ stars }}</div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LessonHeader',
    props: {
      lesson: {
        type: Object,
        required: true
      },
      currentStep: {
        type: Number,
        required: true
      },
      totalSteps: {
        type: Number,
        required: true
      },
      formattedTime: {
        type: String,
        required: true
      },
      stars: {
        type: Number,
        default: 0
      }
    },
    emits: ['exit'],
    methods: {
      getLocalized(field) {
        if (typeof field === 'string') return field;
        return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim();
      }
    }
  }
  </script>
  
  <style scoped>
  .lesson-header {
    background: white;
    padding: 16px 32px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    position: relative;
    z-index: 100;
  }
  
  .lesson-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    opacity: 0.1;
  }
  
  .exit-btn-small {
    background: rgba(239, 68, 68, 0.1);
    border: none;
    font-size: 1.2rem;
    color: #ef4444;
    cursor: pointer;
    padding: 10px;
    border-radius: 10px;
    transition: all 0.2s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: 44px;
    min-height: 44px;
  }
  
  .exit-btn-small:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(1.05);
  }
  
  .exit-btn-small:active {
    transform: scale(0.95);
  }
  
  .lesson-title {
    font-size: 1.25rem;
    color: #1e293b;
    margin: 0;
    flex-grow: 1;
    min-width: 0;
    text-align: center;
    font-weight: 600;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    padding: 0 16px;
  }
  
  .lesson-meta {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  
  .timer-display,
  .step-counter,
  .stars-display {
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-height: 36px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .timer-display {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    color: #475569;
    border: 1px solid #cbd5e1;
  }
  
  .step-counter {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
    border: 1px solid #93c5fd;
  }
  
  .stars-display {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    border: 1px solid #fbbf24;
  }
  
  .timer-display:hover,
  .step-counter:hover,
  .stars-display:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .lesson-header {
      padding: 12px 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  
    .lesson-title {
      font-size: 1.1rem;
      text-align: left;
      order: 2;
      padding: 0;
      width: 100%;
    }
  
    .exit-btn-small {
      align-self: flex-end;
      order: 1;
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }
  
    .lesson-meta {
      order: 3;
      align-self: flex-start;
      gap: 12px;
      width: 100%;
      justify-content: space-between;
    }
  
    .timer-display,
    .step-counter,
    .stars-display {
      font-size: 0.85rem;
      padding: 6px 10px;
      min-height: 32px;
    }
  }
  
  @media (max-width: 480px) {
    .lesson-header {
      padding: 10px 12px;
    }
  
    .lesson-title {
      font-size: 1rem;
    }
  
    .lesson-meta {
      gap: 8px;
      flex-wrap: wrap;
    }
  
    .timer-display,
    .step-counter,
    .stars-display {
      font-size: 0.8rem;
      padding: 5px 8px;
      min-height: 28px;
      flex: 1;
      min-width: 0;
      justify-content: center;
    }
  }
  
  /* Focus states for accessibility */
  .exit-btn-small:focus {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .timer-display,
    .step-counter,
    .stars-display {
      border-width: 2px;
    }
    
    .lesson-header {
      border-bottom-width: 2px;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .exit-btn-small:hover,
    .timer-display:hover,
    .step-counter:hover,
    .stars-display:hover {
      transform: none;
    }
  }
  
  /* Print styles */
  @media print {
    .exit-btn-small {
      display: none;
    }
    
    .lesson-header {
      box-shadow: none;
      border-bottom: 1px solid #000;
    }
  }
  </style>