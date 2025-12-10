<template>
  <div class="game-hud-sidebar">
    <div class="hud-section score">
      <span class="hud-icon">🎯</span>
      <span class="hud-value">{{ score }}</span>
      <span class="hud-label">Score</span>
    </div>
    
    <div class="hud-section timer" :class="{ warning: timeRemaining < 10 }">
      <span class="hud-icon">⏳</span>
      <span class="hud-value">{{ timeRemaining }}s</span>
      <span class="hud-label">Time</span>
    </div>
    
    <div class="hud-section lives" v-if="maxLives > 0">
      <div class="hearts">
        <span 
          v-for="n in maxLives" 
          :key="n" 
          class="heart" 
          :class="{ lost: n > lives }"
        >❤️</span>
      </div>
      <span class="hud-label">Lives</span>
    </div>
    
    <div v-if="prompt" class="hud-section prompt">
      <p class="prompt-text">{{ prompt }}</p>
    </div>
    
    <div v-if="targetScore" class="hud-section target">
      <span class="hud-icon">🎯</span>
      <span class="hud-value">{{ targetScore }}</span>
      <span class="hud-label">Target</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  score: {
    type: Number,
    default: 0
  },
  timeRemaining: {
    type: Number,
    default: 60
  },
  lives: {
    type: Number,
    default: 3
  },
  maxLives: {
    type: Number,
    default: 3
  },
  prompt: {
    type: String,
    default: ''
  },
  targetScore: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
.game-hud-sidebar {
  position: absolute;
  right: 20px;
  top: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.hud-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.05);
}

.hud-icon {
  font-size: 1.8rem;
}

.hud-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.hud-label {
  display: none; /* Hide labels in compact mode */
}

.hud-section.timer.warning .hud-value {
  color: #ef4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.hearts {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

.heart {
  font-size: 1.3rem;
  transition: all 0.3s;
}

.heart.lost {
  opacity: 0.3;
  filter: grayscale(1) blur(1px);
  transform: scale(0.8);
}

.hud-section.prompt {
  display: none; /* Hide prompt from HUD - will show in game area */
}

.prompt-text {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .game-hud-sidebar {
    right: 10px;
    top: 10px;
    gap: 8px;
    padding: 8px 12px;
  }

  .hud-section {
    padding: 6px 10px;
  }

  .hud-icon {
    font-size: 1.3rem;
  }

  .hud-value {
    font-size: 1rem;
  }

  .heart {
    font-size: 1rem;
  }
}
</style>
