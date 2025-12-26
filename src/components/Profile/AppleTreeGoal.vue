<template>
  <div class="apple-tree-goal">
    <div class="goal-header">
      <h3 class="goal-title">{{ $t('dashboard.weeklyGoal') }}</h3>
      <span class="week-label">{{ $t('dashboard.week') }} {{ currentWeek }}</span>
    </div>

    <!-- Tree Visualization -->
    <div class="tree-container">
      <div class="tree-visual" :class="treeStage">
        <!-- Tree SVG -->
        <svg viewBox="0 0 200 200" class="tree-svg">
          <!-- Ground -->
          <ellipse cx="100" cy="185" rx="60" ry="10" fill="#4a3728" opacity="0.3"/>
          
          <!-- Trunk -->
          <path d="M95 185 L90 140 L110 140 L105 185 Z" fill="#8B4513"/>
          
          <!-- Tree Crown based on progress -->
          <circle 
            v-if="progressPercent >= 10" 
            cx="100" cy="100" r="55" 
            :fill="crownColor" 
            class="tree-crown"
          />
          
          <!-- Apples based on progress -->
          <g class="apples">
            <circle v-if="progressPercent >= 60" cx="70" cy="80" r="8" fill="#ef4444" class="apple"/>
            <circle v-if="progressPercent >= 70" cx="130" cy="85" r="8" fill="#ef4444" class="apple"/>
            <circle v-if="progressPercent >= 80" cx="85" cy="120" r="8" fill="#ef4444" class="apple"/>
            <circle v-if="progressPercent >= 90" cx="115" cy="115" r="8" fill="#ef4444" class="apple"/>
            <circle v-if="progressPercent >= 100" cx="100" cy="70" r="10" fill="#fbbf24" class="apple golden"/>
          </g>
        </svg>

        <!-- Sparkles for completion -->
        <div v-if="progressPercent >= 100" class="sparkles">
          <span class="sparkle">✨</span>
          <span class="sparkle">✨</span>
          <span class="sparkle">✨</span>
        </div>
      </div>
    </div>

    <!-- Progress Info -->
    <div class="progress-section">
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${Math.min(progressPercent, 100)}%` }"
          ></div>
        </div>
        <span class="progress-text">
          {{ $t('dashboard.lessonsCount', { current: completedLessons, total: goalLessons }) }}
        </span>
      </div>

      <!-- Encouragement Message -->
      <p class="encouragement">{{ encouragementMessage }}</p>

      <!-- Action Button -->
      <button 
        v-if="progressPercent < 100"
        class="action-btn"
        @click="$emit('startLesson')"
      >
        {{ $t('dashboard.startLesson') }}
      </button>
      <div v-else class="completed-badge">
        <span>🎉</span>
        {{ $t('dashboard.goalCompleted') }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppleTreeGoal',
  props: {
    completedLessons: {
      type: Number,
      default: 0
    },
    goalLessons: {
      type: Number,
      default: 7
    },
    currentWeek: {
      type: Number,
      default: 1
    }
  },
  computed: {
    progressPercent() {
      return Math.round((this.completedLessons / this.goalLessons) * 100)
    },
    treeStage() {
      if (this.progressPercent >= 100) return 'full'
      if (this.progressPercent >= 60) return 'apples'
      if (this.progressPercent >= 30) return 'growing'
      return 'seedling'
    },
    crownColor() {
      if (this.progressPercent >= 60) return '#22c55e'
      if (this.progressPercent >= 30) return '#4ade80'
      return '#86efac'
    },
    encouragementMessage() {
      if (this.progressPercent >= 100) {
        return this.$t('dashboard.encouragement.done')
      } else if (this.progressPercent >= 80) {
        return this.$t('dashboard.encouragement.almost')
      } else if (this.progressPercent >= 60) {
        return this.$t('dashboard.encouragement.apples')
      } else if (this.progressPercent >= 40) {
        return this.$t('dashboard.encouragement.halfway')
      } else if (this.progressPercent >= 20) {
        return this.$t('dashboard.encouragement.growing')
      } else {
        return this.$t('dashboard.encouragement.start')
      }
    }
  }
}
</script>

<style scoped>
.apple-tree-goal {
  background: linear-gradient(135deg, rgba(30, 40, 30, 0.9), rgba(20, 30, 25, 0.95));
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.goal-title {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.week-label {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.tree-container {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.tree-visual {
  position: relative;
  width: 160px;
  height: 160px;
}

.tree-svg {
  width: 100%;
  height: 100%;
}

.tree-crown {
  transition: all 0.5s ease;
}

.apple {
  animation: appear 0.5s ease forwards;
}

.apple.golden {
  filter: drop-shadow(0 0 8px #fbbf24);
}

@keyframes appear {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.sparkles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: 1.5rem;
  animation: sparkle 2s infinite;
}

.sparkle:nth-child(1) {
  top: 10%;
  left: 20%;
  animation-delay: 0s;
}

.sparkle:nth-child(2) {
  top: 20%;
  right: 15%;
  animation-delay: 0.5s;
}

.sparkle:nth-child(3) {
  top: 40%;
  left: 10%;
  animation-delay: 1s;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.progress-section {
  text-align: center;
}

.progress-bar-container {
  margin-bottom: 1rem;
}

.progress-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.progress-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.encouragement {
  color: #4ade80;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  min-height: 1.5rem;
}

.action-btn {
  width: 100%;
  padding: 0.875rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
}

.completed-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  color: #4ade80;
  font-weight: 600;
}

.completed-badge span {
  font-size: 1.25rem;
}
</style>