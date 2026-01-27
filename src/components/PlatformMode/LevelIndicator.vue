<template>
  <div class="level-indicator" :class="mode">
    <!-- School Mode Badge -->
    <div v-if="mode === 'school'" class="school-badge">
      <div class="grade-circle">
        <span class="grade-number">{{ grade }}</span>
        <span class="grade-label">{{ $t('dashboard.grade') }}</span>
      </div>
    </div>

    <!-- Study Centre Mode Badge -->
    <div v-else class="level-badge">
      <div class="level-ring">
        <svg viewBox="0 0 100 100" class="progress-ring">
          <circle
            class="progress-ring-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke-width="6"
          />
          <circle
            class="progress-ring-fill"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke-width="6"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
          />
        </svg>
        <div class="level-content">
          <span class="level-number">{{ level }}</span>
          <span class="level-label">{{ $t('dashboard.level') }}</span>
        </div>
      </div>
    </div>

    <!-- Mode Label -->
    <div class="mode-label">
      <span class="mode-icon">{{ mode === 'school' ? '🏫' : '📚' }}</span>
      <span class="mode-text">
        {{ mode === 'school' ? $t('sidebar.school') : $t('sidebar.studyCentre') }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LevelIndicator',
  props: {
    mode: {
      type: String,
      default: 'school',
      validator: (value) => ['school', 'studyCentre'].includes(value)
    },
    grade: {
      type: Number,
      default: 5
    },
    level: {
      type: Number,
      default: 1
    },
    xp: {
      type: Number,
      default: 0
    },
    xpToNextLevel: {
      type: Number,
      default: 100
    }
  },
  computed: {
    circumference() {
      return 2 * Math.PI * 45
    },
    progressOffset() {
      const progress = this.xp / this.xpToNextLevel
      return this.circumference * (1 - progress)
    }
  }
}
</script>

<style scoped>
.level-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.school-badge .grade-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.grade-number {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.grade-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 2px;
}

.level-badge .level-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-ring {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.progress-ring-bg {
  stroke: rgba(139, 92, 246, 0.2);
}

.progress-ring-fill {
  stroke: url(#gradient);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.level-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.level-number {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.level-label {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 2px;
}

.mode-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
}

.mode-icon {
  font-size: 0.9rem;
}

.mode-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* Gradient definition for SVG */
.level-indicator :deep(svg) {
  overflow: visible;
}
</style>