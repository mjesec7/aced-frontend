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

/* Responsive - Mobile */
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

/* ============================================
   TABLET RESPONSIVE (768px - 1366px)
   ============================================ */

/* iPad Mini & Small Tablets */
@media (min-width: 768px) and (max-width: 1023px) {
  .game-hud-sidebar {
    right: 12px;
    top: 12px;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 12px;
  }

  .hud-section {
    padding: 5px 8px;
    border-radius: 10px;
  }

  .hud-icon {
    font-size: 1.4rem;
  }

  .hud-value {
    font-size: 1rem;
  }

  .heart {
    font-size: 1rem;
  }
}

/* iPad Air & Larger Tablets */
@media (min-width: 1024px) and (max-width: 1366px) {
  .game-hud-sidebar {
    right: 14px;
    top: 14px;
    gap: 10px;
    padding: 10px 14px;
  }

  .hud-section {
    padding: 6px 10px;
  }

  .hud-icon {
    font-size: 1.5rem;
  }

  .hud-value {
    font-size: 1.1rem;
  }

  .heart {
    font-size: 1.1rem;
  }
}

/* Tablet Landscape */
@media (min-width: 768px) and (max-height: 800px) and (orientation: landscape) {
  .game-hud-sidebar {
    right: 10px;
    top: 10px;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 10px;
  }

  .hud-section {
    padding: 4px 6px;
    border-radius: 8px;
  }

  .hud-icon {
    font-size: 1.2rem;
  }

  .hud-value {
    font-size: 0.9rem;
  }

  .heart {
    font-size: 0.9rem;
  }
}

/* Short screens */
@media (max-height: 600px) {
  .game-hud-sidebar {
    right: 8px;
    top: 8px;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 8px;
  }

  .hud-section {
    padding: 3px 5px;
    border-radius: 6px;
    gap: 4px;
  }

  .hud-icon {
    font-size: 1rem;
  }

  .hud-value {
    font-size: 0.8rem;
  }

  .hearts {
    gap: 2px;
  }

  .heart {
    font-size: 0.8rem;
  }
}
</style>
