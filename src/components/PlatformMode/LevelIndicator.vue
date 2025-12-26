<template>
  <div class="level-indicator" :class="{ compact: isCompact }">
    <!-- School Mode Badge -->
    <div v-if="isSchoolMode" class="school-badge">
      <div class="badge-content">
        <span class="mode-icon">🎓</span>
        <div class="badge-info">
          <span class="badge-label">{{ $t('dashboard.level') }}</span>
          <span class="badge-value">{{ currentLevelCap }}</span>
        </div>
        <div class="badge-info grade">
          <span class="badge-label">{{ $t('dashboard.grade') }}</span>
          <span class="badge-value" :style="{ color: getGradeBadgeColor(currentGrade) }">
            {{ currentGrade || $t('dashboard.notAvailable') }}
          </span>
        </div>
      </div>

      <!-- Progress Ring -->
      <div v-if="showProgress" class="progress-ring">
        <svg width="60" height="60">
          <circle
            class="progress-ring-circle-bg"
            stroke="#e5e7eb"
            stroke-width="4"
            fill="transparent"
            r="26"
            cx="30"
            cy="30"
          />
          <circle
            class="progress-ring-circle"
            :stroke="getGradeBadgeColor(currentGrade)"
            stroke-width="4"
            fill="transparent"
            r="26"
            cx="30"
            cy="30"
            :style="{ strokeDashoffset: progressOffset }"
          />
        </svg>
        <span class="progress-text">{{ levelProgress }}%</span>
      </div>
    </div>

    <!-- Study Centre Badge -->
    <div v-else-if="isStudyCentreMode" class="study-centre-badge">
      <div class="badge-content">
        <span class="mode-icon">🌟</span>
        <div class="badge-info">
          <span class="badge-label">{{ $t('sidebar.studyCentre') }}</span>
          <span class="badge-label">{{ $t('dashboard.unlimitedAccess') }}</span>
        </div>
      </div>
    </div>

    <!-- No Mode Selected -->
    <div v-else class="no-mode-badge" @click="$emit('selectMode')">
      <span class="mode-icon">❓</span>
      <span class="select-mode-text">{{ $t('dashboard.selectMode') }}</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useLevelSystem } from '@/composables/useLevelSystem';

export default {
  name: 'LevelIndicator',

  props: {
    isCompact: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: true
    }
  },

  emits: ['selectMode'],

  setup() {
    const {
      isSchoolMode,
      isStudyCentreMode,
      currentGrade,
      currentLevelCap,
      levelProgress,
      getGradeBadgeColor
    } = useLevelSystem();

    // Calculate progress ring offset
    const progressOffset = computed(() => {
      const circumference = 2 * Math.PI * 26; // radius = 26
      const progress = levelProgress.value || 0;
      return circumference - (progress / 100) * circumference;
    });

    return {
      isSchoolMode,
      isStudyCentreMode,
      currentGrade,
      currentLevelCap,
      levelProgress,
      getGradeBadgeColor,
      progressOffset
    };
  }
};
</script>

<style scoped>
.level-indicator {
  display: inline-flex;
  align-items: center;
  font-family: 'Unbounded', sans-serif;
}

.school-badge,
.study-centre-badge,
.no-mode-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.school-badge:hover,
.study-centre-badge:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.no-mode-badge {
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.no-mode-badge:hover {
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.badge-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mode-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.badge-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.badge-info.grade {
  border-left: 2px solid #e5e7eb;
  padding-left: 0.75rem;
  margin-left: 0.5rem;
}

.badge-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.progress-ring {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring-circle {
  stroke-dasharray: 163.36; /* 2 * PI * 26 */
  stroke-dashoffset: 163.36;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.select-mode-text {
  font-weight: 600;
  font-size: 1rem;
}

/* Compact Version */
.level-indicator.compact .school-badge,
.level-indicator.compact .study-centre-badge {
  padding: 0.5rem 1rem;
  gap: 0.5rem;
}

.level-indicator.compact .mode-icon {
  font-size: 1.25rem;
}

.level-indicator.compact .badge-label {
  font-size: 0.625rem;
}

.level-indicator.compact .badge-value {
  font-size: 0.95rem;
}

.level-indicator.compact .progress-ring {
  width: 45px;
  height: 45px;
}

.level-indicator.compact .progress-ring svg {
  width: 45px;
  height: 45px;
}

.level-indicator.compact .progress-text {
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  .badge-content {
    gap: 0.5rem;
  }

  .badge-info.grade {
    display: none;
  }

  .progress-ring {
    display: none;
  }
}
</style>
