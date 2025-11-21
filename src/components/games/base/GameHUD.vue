<template>
  <div class="game-hud">
    <div class="hud-section hud-left">
      <!-- Score Display -->
      <div class="hud-item score">
        <div class="hud-icon">⭐</div>
        <div class="hud-content">
          <div class="hud-label">Score</div>
          <div class="hud-value">{{ formattedScore }}</div>
        </div>
      </div>

      <!-- Target Score -->
      <div v-if="targetScore" class="hud-item target">
        <div class="hud-icon">🎯</div>
        <div class="hud-content">
          <div class="hud-label">Target</div>
          <div class="hud-value">{{ targetScore }}</div>
        </div>
      </div>
    </div>

    <div class="hud-section hud-center">
      <!-- Timer -->
      <div class="hud-item timer" :class="timerClass">
        <div class="hud-icon">⏱️</div>
        <div class="hud-content">
          <div class="hud-value">{{ formattedTimer }}</div>
        </div>
      </div>
    </div>

    <div class="hud-section hud-right">
      <!-- Lives -->
      <div v-if="lives !== null" class="hud-item lives">
        <div class="lives-container">
          <div v-for="n in maxLives" :key="n" class="life-icon" :class="{ lost: n > lives }">
            ❤️
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="progress !== null" class="hud-item progress-item">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-text">{{ Math.round(progress) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  score: {
    type: Number,
    default: 0
  },
  targetScore: {
    type: Number,
    default: null
  },
  timer: {
    type: Number, // seconds
    default: null
  },
  lives: {
    type: Number,
    default: null
  },
  maxLives: {
    type: Number,
    default: 3
  },
  progress: {
    type: Number, // percentage
    default: null
  }
});

const formattedScore = computed(() => {
  return props.score.toLocaleString();
});

const formattedTimer = computed(() => {
  if (props.timer === null) return '--:--';
  const minutes = Math.floor(props.timer / 60);
  const seconds = props.timer % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const timerClass = computed(() => {
  if (props.timer === null) return '';
  if (props.timer <= 10) return 'warning';
  if (props.timer <= 30) return 'caution';
  return '';
});
</script>

<style scoped>
.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 100%);
  z-index: 100;
  pointer-events: none;
}

.hud-section {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.hud-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 100px;
}

.hud-icon {
  font-size: 24px;
}

.hud-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hud-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
  letter-spacing: 0.5px;
}

.hud-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

/* Timer styles */
.timer .hud-value {
  font-family: 'Courier New', monospace;
}

.timer.warning {
  animation: pulse-warning 1s infinite;
}

.timer.caution .hud-value {
  color: #ff9800;
}

.timer.warning .hud-value {
  color: #f44336;
}

@keyframes pulse-warning {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Lives display */
.lives-container {
  display: flex;
  gap: 5px;
}

.life-icon {
  font-size: 20px;
  transition: all 0.3s;
}

.life-icon.lost {
  filter: grayscale(100%) opacity(0.3);
  transform: scale(0.8);
}

/* Progress bar */
.progress-item {
  flex-direction: column;
  min-width: 150px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease-out;
  border-radius: 4px;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-align: right;
  margin-top: 4px;
}

/* Score special styles */
.score {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #8b6914;
}

.score .hud-label,
.score .hud-value {
  color: #8b6914;
}

/* Responsive */
@media (max-width: 768px) {
  .game-hud {
    flex-wrap: wrap;
    gap: 10px;
    padding: 15px;
  }

  .hud-section {
    gap: 10px;
  }

  .hud-item {
    padding: 8px 12px;
    min-width: 80px;
  }

  .hud-icon {
    font-size: 20px;
  }

  .hud-value {
    font-size: 16px;
  }

  .life-icon {
    font-size: 16px;
  }
}
</style>
