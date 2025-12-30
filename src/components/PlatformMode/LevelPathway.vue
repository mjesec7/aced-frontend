<template>
  <div class="level-pathway">
    <!-- Stats Header -->
    <div class="pathway-header">
      <div class="stat-item">
        <div class="stat-icon level-icon">⭐</div>
        <div class="stat-info">
          <span class="stat-value">{{ level }}</span>
          <span class="stat-label">{{ $t('levelPathway.level') }}</span>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon xp-icon">💎</div>
        <div class="stat-info">
          <span class="stat-value">{{ xp }}</span>
          <span class="stat-label">{{ $t('levelPathway.xp') }}</span>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon streak-icon">🔥</div>
        <div class="stat-info">
          <span class="stat-value">{{ streak }}</span>
          <span class="stat-label">{{ $t('levelPathway.dayStreak') }}</span>
        </div>
      </div>
    </div>

    <!-- Pathway Visualization -->
    <div class="pathway-track">
      <div
        v-for="(node, index) in pathwayNodes"
        :key="index"
        class="pathway-node"
        :class="{
          completed: node.completed,
          current: node.current,
          locked: node.locked
        }"
      >
        <div class="node-connector" v-if="index > 0"></div>
        <div class="node-circle">
          <span v-if="node.completed">✓</span>
          <span v-else-if="node.current">{{ index + 1 }}</span>
          <span v-else>🔒</span>
        </div>
        <div class="node-label">{{ node.title }}</div>
      </div>
    </div>

    <!-- Continue Button -->
    <button
      class="continue-btn"
      @click="continueLesson"
      :disabled="!hasCurrentLesson"
    >
      <span>{{ $t('levelPathway.continue') }}</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'LevelPathway',
  props: {
    level: {
      type: Number,
      default: 1
    },
    xp: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    lessons: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    pathwayNodes() {
      if (this.lessons.length === 0) {
        // Use $t for default placeholder lessons with lessonNumber translation
        return [
          { title: this.$t('levelPathway.lessonNumber', { number: 1 }), completed: true, current: false, locked: false },
          { title: this.$t('levelPathway.lessonNumber', { number: 2 }), completed: true, current: false, locked: false },
          { title: this.$t('levelPathway.lessonNumber', { number: 3 }), completed: false, current: true, locked: false },
          { title: this.$t('levelPathway.lessonNumber', { number: 4 }), completed: false, current: false, locked: true },
          { title: this.$t('levelPathway.lessonNumber', { number: 5 }), completed: false, current: false, locked: true }
        ]
      }
      return this.lessons.map((lesson, index) => ({
        title: lesson.title || lesson.lessonName || this.$t('levelPathway.lessonNumber', { number: index + 1 }),
        completed: lesson.completed || false,
        current: lesson.current || false,
        locked: !lesson.completed && !lesson.current
      }))
    },
    hasCurrentLesson() {
      return this.pathwayNodes.some(node => node.current)
    }
  },
  methods: {
    continueLesson() {
      const currentLesson = this.pathwayNodes.find(node => node.current)
      if (currentLesson) {
        this.$emit('continue', currentLesson)
      }
    }
  }
}
</script>

<style scoped>
.level-pathway {
  background: #fff;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pathway-header {
  display: flex;
  justify-content: space-around;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.level-icon {
  background: #fef3c7;
}

.xp-icon {
  background: #ede9fe;
}

.streak-icon {
  background: #fee2e2;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.2rem;
}

.pathway-track {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  overflow-x: auto;
  gap: 0.5rem;
}

.pathway-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 60px;
}

.node-connector {
  position: absolute;
  top: 20px;
  right: 50%;
  width: 100%;
  height: 3px;
  background: #e5e7eb;
  z-index: 0;
}

.pathway-node.completed .node-connector {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.node-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  z-index: 1;
  transition: all 0.3s;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  color: #9ca3af;
}

.pathway-node.completed .node-circle {
  background: linear-gradient(135deg, #10b981, #34d399);
  border-color: #10b981;
  color: #fff;
}

.pathway-node.current .node-circle {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border-color: #8b5cf6;
  color: #fff;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  animation: pulse 2s infinite;
}

.pathway-node.locked .node-circle {
  background: #f9fafb;
  border-color: #e5e7eb;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
  }
}

.node-label {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: #6b7280;
  text-align: center;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pathway-node.current .node-label {
  color: #8b5cf6;
  font-weight: 600;
}

.continue-btn {
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.continue-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
}

.continue-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .pathway-header {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .stat-item {
    flex: 1;
    min-width: 80px;
    justify-content: center;
  }
}
</style>
