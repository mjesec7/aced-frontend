<template>
  <div class="game-complete-overlay">
    <div class="game-complete-card">
      <!-- Stars Display -->
      <div class="stars-display">
        <div v-for="n in 3" :key="n" class="star" :class="{ filled: n <= stars }">
          ⭐
        </div>
      </div>

      <!-- Title -->
      <h2 class="complete-title">{{ completionTitle }}</h2>
      <p class="complete-message">{{ completionMessage }}</p>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-label">Final Score</div>
            <div class="stat-value">{{ formattedScore }}</div>
          </div>
        </div>

        <div v-if="accuracy !== null" class="stat-item">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">Accuracy</div>
            <div class="stat-value">{{ Math.round(accuracy) }}%</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-label">Time</div>
            <div class="stat-value">{{ formattedTime }}</div>
          </div>
        </div>

        <div v-if="targetScore" class="stat-item">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-label">Target</div>
            <div class="stat-value">{{ targetScore }}</div>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="targetScore" class="progress-section">
        <div class="progress-label">
          <span>Progress</span>
          <span class="progress-percent">{{ progressPercentage }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
      </div>

      <!-- Personal Best Badge -->
      <div v-if="isPersonalBest" class="personal-best-badge">
        🏆 New Personal Best!
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="$emit('retry')" class="game-btn retry-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Try Again
        </button>
        <button @click="$emit('continue')" class="game-btn continue-btn">
          <span>Continue Lesson</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      <!-- Share Button -->
      <button @click="shareResults" class="share-btn">
        📤 Share Results
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  score: {
    type: Number,
    required: true
  },
  targetScore: {
    type: Number,
    default: null
  },
  stars: {
    type: Number,
    default: 0,
    validator: (val) => val >= 0 && val <= 3
  },
  timeSpent: {
    type: Number, // seconds
    required: true
  },
  accuracy: {
    type: Number, // percentage
    default: null
  },
  isPersonalBest: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['retry', 'continue', 'share']);

const completionTitle = computed(() => {
  if (props.stars === 3) return '🎉 Perfect!';
  if (props.stars === 2) return '✨ Great Job!';
  if (props.stars === 1) return '👍 Good Effort!';
  return '💪 Keep Trying!';
});

const completionMessage = computed(() => {
  if (props.stars === 3) return 'You mastered this game!';
  if (props.stars === 2) return 'Almost perfect! Try again for 3 stars!';
  if (props.stars === 1) return 'You\'re improving! Keep practicing!';
  return 'Don\'t give up! Practice makes perfect!';
});

const formattedScore = computed(() => {
  return props.score.toLocaleString();
});

const formattedTime = computed(() => {
  const minutes = Math.floor(props.timeSpent / 60);
  const seconds = props.timeSpent % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
});

const progressPercentage = computed(() => {
  if (!props.targetScore) return 0;
  return Math.min(Math.round((props.score / props.targetScore) * 100), 100);
});

const shareResults = () => {
  const text = `I scored ${props.score} points with ${props.stars} stars! 🎮`;
  emit('share', { text, score: props.score, stars: props.stars });

  // Try to share using Web Share API
  if (navigator.share) {
    navigator.share({
      title: 'My Game Results',
      text: text,
      url: window.location.href
    }).catch(err => {
      // Silently handle share cancellation
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert('Results copied to clipboard!');
    });
  }
};
</script>

<style scoped>
.game-complete-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
  padding: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.game-complete-card {
  background: white;
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.4s ease-out;
  text-align: center;
}

@keyframes slideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.stars-display {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.star {
  font-size: 48px;
  filter: grayscale(100%) opacity(0.3);
  transition: all 0.3s;
  animation: starPop 0.5s ease-out;
}

.star.filled {
  filter: grayscale(0%) opacity(1);
  animation: starFill 0.5s ease-out;
}

@keyframes starPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes starFill {
  0%, 50% { transform: scale(1); }
  75% { transform: scale(1.3) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.complete-title {
  font-size: 32px;
  font-weight: 800;
  color: #333;
  margin: 0 0 10px 0;
}

.complete-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-item {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 28px;
}

.stat-content {
  text-align: left;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #999;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.progress-section {
  margin-bottom: 25px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.progress-percent {
  color: #4caf50;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 1s ease-out;
  border-radius: 6px;
}

.personal-best-badge {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b6914;
  padding: 12px 24px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 25px;
  animation: badgePulse 2s infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.game-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.game-btn svg {
  width: 20px;
  height: 20px;
}

.retry-btn {
  background: #f5f5f5;
  color: #666;
}

.retry-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.continue-btn {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

.share-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover {
  border-color: #4caf50;
  color: #4caf50;
}

/* Responsive */
@media (max-width: 768px) {
  .game-complete-card {
    padding: 30px 20px;
  }

  .complete-title {
    font-size: 24px;
  }

  .stars-display .star {
    font-size: 36px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
