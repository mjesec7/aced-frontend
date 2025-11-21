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
  right: 0;
  top: 0;
  height: 100%;
  width: 180px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px 0 0 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.hud-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.05);
}

.hud-icon {
  font-size: 1.8rem;
}

.hud-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.hud-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  flex: 1;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border: 2px solid rgba(59, 130, 246, 0.2);
}

.prompt-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin: 0;
  line-height: 1.3;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .game-hud-sidebar {
    width: 140px;
    padding: 15px;
    gap: 12px;
  }

  .hud-section {
    padding: 10px;
  }

  .hud-icon {
    font-size: 1.5rem;
  }

  .hud-value {
    font-size: 1.2rem;
  }

  .prompt-text {
    font-size: 0.9rem;
  }

  .heart {
    font-size: 1.1rem;
  }
}
</style>
