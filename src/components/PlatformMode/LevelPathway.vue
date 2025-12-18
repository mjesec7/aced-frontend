<template>
  <div class="level-pathway-container">
    <div class="pathway-header">
      <div class="current-level-display">
        <div class="level-badge" :style="{ background: currentLevelColor }">
          <span class="level-number">{{ currentLevel }}</span>
        </div>
        <div class="level-info">
          <span class="level-label">Level</span>
          <div class="xp-info">
            <span class="xp-current">{{ currentXP }}</span>
            <span class="xp-separator">/</span>
            <span class="xp-target">{{ xpForNextLevel }} XP</span>
          </div>
        </div>
      </div>
      
      <div class="xp-progress-ring">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            stroke="#e5e7eb"
            stroke-width="5"
          />
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            :stroke="currentLevelColor"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
            class="progress-ring-fill"
          />
        </svg>
        <span class="progress-percent">{{ progressPercent }}%</span>
      </div>
    </div>

    <div class="pathway-scroll-wrapper">
      <div class="pathway-track" ref="pathwayTrack">
        <!-- Path line connecting nodes -->
        <svg class="path-line" :width="pathWidth" height="100" preserveAspectRatio="none">
          <path 
            :d="pathD" 
            fill="none" 
            stroke="#e5e7eb" 
            stroke-width="4"
            stroke-linecap="round"
          />
          <path 
            :d="pathD" 
            fill="none" 
            :stroke="currentLevelColor" 
            stroke-width="4"
            stroke-linecap="round"
            :stroke-dasharray="pathLength"
            :stroke-dashoffset="pathProgressOffset"
            class="path-progress"
          />
        </svg>

        <!-- Lesson nodes -->
        <div class="nodes-container">
          <div
            v-for="(lesson, index) in displayedLessons"
            :key="lesson.id || index"
            :class="['lesson-node', getNodeStatus(index)]"
            :style="getNodeStyle(index)"
            @click="handleNodeClick(lesson, index)"
          >
            <div class="node-circle" :style="getNodeCircleStyle(index)">
              <svg v-if="isLessonCompleted(index)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else-if="isLessonLocked(index)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span v-else class="node-number">{{ index + 1 }}</span>
            </div>
            <span class="node-label">{{ lesson.title || `Lesson ${index + 1}` }}</span>
            
            <!-- Star badge for perfect score -->
            <div v-if="lesson.perfectScore" class="star-badge">⭐</div>
          </div>
        </div>
      </div>
    </div>

    <div class="pathway-footer">
      <div class="streak-badge">
        <span class="streak-icon">🔥</span>
        <span class="streak-count">{{ streak }} day streak</span>
      </div>
      <button 
        v-if="nextLesson" 
        class="continue-btn"
        @click="startNextLesson"
      >
        <span>Continue</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'LevelPathway',

  props: {
    lessons: {
      type: Array,
      default: () => []
    },
    userProgress: {
      type: Array,
      default: () => []
    },
    currentLevelProp: {
      type: Number,
      default: 1
    },
    currentXPProp: {
      type: Number,
      default: 0
    },
    streakProp: {
      type: Number,
      default: 0
    }
  },

  emits: ['lesson-click', 'continue'],

  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();
    const pathwayTrack = ref(null);

    // Level colors by tier
    const levelColors = [
      '#22c55e', // Green 1-5
      '#3b82f6', // Blue 6-10
      '#8b5cf6', // Purple 11-15
      '#f59e0b', // Orange 16-20
      '#ef4444', // Red 21-25
      '#ec4899', // Pink 26+
    ];

    const currentLevel = computed(() => props.currentLevelProp);
    const currentXP = computed(() => props.currentXPProp);
    const streak = computed(() => props.streakProp);

    const xpForNextLevel = computed(() => {
      // XP needed increases with level
      return currentLevel.value * 100 + 200;
    });

    const progressPercent = computed(() => {
      return Math.round((currentXP.value / xpForNextLevel.value) * 100);
    });

    const currentLevelColor = computed(() => {
      const tierIndex = Math.floor((currentLevel.value - 1) / 5);
      return levelColors[tierIndex] || levelColors[levelColors.length - 1];
    });

    // Progress ring calculations
    const circumference = 2 * Math.PI * 24;
    const progressOffset = computed(() => {
      return circumference - (progressPercent.value / 100) * circumference;
    });

    // Display 10 lessons max in the pathway
    const displayedLessons = computed(() => {
      return props.lessons.slice(0, 10);
    });

    // Path calculations
    const pathWidth = computed(() => displayedLessons.value.length * 100);
    
    const pathD = computed(() => {
      const nodes = displayedLessons.value.length;
      if (nodes < 2) return '';
      
      let d = 'M 40 50';
      for (let i = 1; i < nodes; i++) {
        const x = i * 100 + 40;
        const y = 50 + (i % 2 === 1 ? -10 : 10); // Slight wave
        d += ` Q ${(i - 0.5) * 100 + 40} ${y} ${x} 50`;
      }
      return d;
    });

    const pathLength = computed(() => {
      // Approximate path length
      return displayedLessons.value.length * 100;
    });

    const completedCount = computed(() => {
      return props.lessons.filter((l, i) => isLessonCompleted(i)).length;
    });

    const pathProgressOffset = computed(() => {
      const progress = completedCount.value / displayedLessons.value.length;
      return pathLength.value - (progress * pathLength.value);
    });

    // Next available lesson
    const nextLesson = computed(() => {
      const nextIndex = props.lessons.findIndex((l, i) => !isLessonCompleted(i));
      return nextIndex >= 0 ? { ...props.lessons[nextIndex], index: nextIndex } : null;
    });

    function isLessonCompleted(index) {
      const lesson = props.lessons[index];
      if (!lesson) return false;
      return props.userProgress.some(p => 
        (p.lessonId?._id || p.lessonId) === lesson._id && p.completed
      );
    }

    function isLessonLocked(index) {
      if (index === 0) return false;
      // Locked if previous lesson not completed
      return !isLessonCompleted(index - 1);
    }

    function isCurrentLesson(index) {
      return !isLessonCompleted(index) && (index === 0 || isLessonCompleted(index - 1));
    }

    function getNodeStatus(index) {
      if (isLessonCompleted(index)) return 'completed';
      if (isLessonLocked(index)) return 'locked';
      if (isCurrentLesson(index)) return 'current';
      return 'available';
    }

    function getNodeStyle(index) {
      return {
        left: `${index * 100 + 20}px`,
        top: `${30 + (index % 2 === 1 ? -8 : 8)}px`
      };
    }

    function getNodeCircleStyle(index) {
      if (isLessonCompleted(index)) {
        return { background: currentLevelColor.value, borderColor: currentLevelColor.value };
      }
      if (isCurrentLesson(index)) {
        return { 
          borderColor: currentLevelColor.value,
          boxShadow: `0 0 0 4px ${currentLevelColor.value}33`
        };
      }
      return {};
    }

    function handleNodeClick(lesson, index) {
      if (isLessonLocked(index)) return;
      emit('lesson-click', { lesson, index });
    }

    function startNextLesson() {
      if (nextLesson.value) {
        emit('continue', nextLesson.value);
      }
    }

    return {
      pathwayTrack,
      currentLevel,
      currentXP,
      streak,
      xpForNextLevel,
      progressPercent,
      currentLevelColor,
      circumference,
      progressOffset,
      displayedLessons,
      pathWidth,
      pathD,
      pathLength,
      pathProgressOffset,
      nextLesson,
      isLessonCompleted,
      isLessonLocked,
      getNodeStatus,
      getNodeStyle,
      getNodeCircleStyle,
      handleNodeClick,
      startNextLesson
    };
  }
};
</script>

<style scoped>
.level-pathway-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

/* Header */
.pathway-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.current-level-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.level-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.level-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.xp-info {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.xp-current {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.xp-separator {
  font-size: 0.875rem;
  color: #94a3b8;
}

.xp-target {
  font-size: 0.875rem;
  color: #64748b;
}

/* Progress Ring */
.xp-progress-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring-fill {
  transform: rotate(-90deg);
  transform-origin: center;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-percent {
  position: absolute;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e293b;
}

/* Pathway Track */
.pathway-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  margin: 0 -20px;
  padding: 0 20px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.pathway-scroll-wrapper::-webkit-scrollbar {
  height: 4px;
}

.pathway-scroll-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.pathway-track {
  position: relative;
  height: 120px;
  min-width: max-content;
  padding: 10px 0;
}

.path-line {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.path-progress {
  transition: stroke-dashoffset 0.5s ease;
}

/* Nodes */
.nodes-container {
  position: relative;
  height: 100%;
}

.lesson-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.lesson-node:hover:not(.locked) {
  transform: scale(1.05);
}

.lesson-node.locked {
  cursor: not-allowed;
  opacity: 0.5;
}

.lesson-node.current .node-circle {
  animation: pulse 2s infinite;
}

.node-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 3px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.lesson-node.completed .node-circle {
  color: white;
}

.node-circle svg {
  width: 20px;
  height: 20px;
}

.node-number {
  font-size: 1rem;
  font-weight: 700;
  color: #64748b;
}

.node-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #64748b;
  max-width: 70px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-node.completed .node-label {
  color: #1e293b;
}

.star-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 1rem;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
  }
}

/* Footer */
.pathway-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.streak-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #fff7ed;
  border-radius: 10px;
  border: 1px solid #fed7aa;
}

.streak-icon {
  font-size: 1.25rem;
}

.streak-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #c2410c;
}

.continue-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.continue-btn svg {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .level-pathway-container {
    padding: 16px;
  }

  .pathway-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .xp-progress-ring {
    position: absolute;
    top: 20px;
    right: 16px;
  }

  .level-badge {
    width: 40px;
    height: 40px;
  }

  .level-number {
    font-size: 1.25rem;
  }

  .pathway-footer {
    flex-direction: column;
    gap: 12px;
  }

  .continue-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
