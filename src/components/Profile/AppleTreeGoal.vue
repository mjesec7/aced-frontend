<template>
  <div class="apple-tree-goal" :class="{ 'tree-complete': isComplete }">
    <div class="tree-header">
      <h3 class="tree-title">
        <span class="tree-emoji">{{ currentTree.emoji }}</span>
        Weekly Goal
      </h3>
      <span class="week-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Week {{ currentWeekNumber }}
      </span>
    </div>

    <div class="tree-visualization">
      <!-- Tree SVG with progressive color fill -->
      <div class="tree-container" :style="treeColorStyle">
        <svg viewBox="0 0 200 220" class="tree-svg">
          <!-- Ground -->
          <ellipse cx="100" cy="210" rx="60" ry="10" fill="#8B4513" opacity="0.3"/>
          
          <!-- Tree trunk -->
          <path 
            d="M90 180 L85 210 L115 210 L110 180 Z" 
            :fill="trunkColor"
            class="tree-trunk"
          />
          <path 
            d="M80 190 Q70 195 75 200 Q85 195 80 190" 
            :fill="trunkColor"
            opacity="0.8"
          />
          <path 
            d="M120 190 Q130 195 125 200 Q115 195 120 190" 
            :fill="trunkColor"
            opacity="0.8"
          />
          
          <!-- Tree crown layers (bottom to top) -->
          <ellipse 
            cx="100" cy="140" rx="55" ry="45" 
            :fill="leafColor" 
            class="tree-crown layer-1"
          />
          <ellipse 
            cx="100" cy="100" rx="50" ry="40" 
            :fill="leafColorLight" 
            class="tree-crown layer-2"
          />
          <ellipse 
            cx="100" cy="65" rx="40" ry="35" 
            :fill="leafColor" 
            class="tree-crown layer-3"
          />
          <ellipse 
            cx="100" cy="40" rx="25" ry="22" 
            :fill="leafColorLight" 
            class="tree-crown layer-4"
          />
          
          <!-- Apples (appear based on progress) -->
          <g class="apples" :style="{ opacity: applesOpacity }">
            <circle v-for="apple in visibleApples" :key="apple.id"
              :cx="apple.x" :cy="apple.y" r="8"
              :fill="appleColor"
              class="apple"
            >
              <animate 
                v-if="isComplete"
                attributeName="r" 
                values="8;9;8" 
                dur="2s" 
                repeatCount="indefinite"
              />
            </circle>
            <!-- Apple stems -->
            <path v-for="apple in visibleApples" :key="'stem-'+apple.id"
              :d="`M${apple.x} ${apple.y-8} Q${apple.x} ${apple.y-14} ${apple.x+3} ${apple.y-12}`"
              stroke="#5D4037"
              stroke-width="1.5"
              fill="none"
            />
          </g>
          
          <!-- Sparkles when complete -->
          <g v-if="isComplete" class="sparkles">
            <circle cx="50" cy="50" r="3" fill="#FFD700" class="sparkle s1"/>
            <circle cx="150" cy="40" r="2" fill="#FFD700" class="sparkle s2"/>
            <circle cx="45" cy="100" r="2.5" fill="#FFD700" class="sparkle s3"/>
            <circle cx="155" cy="110" r="2" fill="#FFD700" class="sparkle s4"/>
            <circle cx="100" cy="20" r="3" fill="#FFD700" class="sparkle s5"/>
          </g>
        </svg>
      </div>

      <!-- Progress meter -->
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-label">{{ completedLessons }} / {{ goalTarget }} Lessons</span>
          <span class="progress-percent">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar-track">
          <div 
            class="progress-bar-fill" 
            :style="{ width: progressPercent + '%' }"
            :class="{ complete: isComplete }"
          ></div>
        </div>
      </div>
    </div>

    <div class="tree-footer">
      <p class="encouragement">{{ encouragementText }}</p>
      <router-link v-if="!isComplete" to="/profile/catalogue" class="start-lesson-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Start a Lesson
      </router-link>
      <div v-else class="completed-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Goal Completed!
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AppleTreeGoal',
  
  props: {
    lessonsCompleted: {
      type: Number,
      default: 0
    },
    goalTarget: {
      type: Number,
      default: 20
    }
  },

  setup(props) {
    const store = useStore();
    
    // Tree variations for each week
    const treeVariations = [
      { name: 'Apple Tree', emoji: '🍎', appleColor: '#E53935', leafBase: '#4CAF50' },
      { name: 'Cherry Tree', emoji: '🍒', appleColor: '#C62828', leafBase: '#66BB6A' },
      { name: 'Orange Tree', emoji: '🍊', appleColor: '#FF9800', leafBase: '#43A047' },
      { name: 'Peach Tree', emoji: '🍑', appleColor: '#FFAB91', leafBase: '#81C784' },
      { name: 'Lemon Tree', emoji: '🍋', appleColor: '#FDD835', leafBase: '#AED581' },
      { name: 'Pear Tree', emoji: '🍐', appleColor: '#C0CA33', leafBase: '#8BC34A' },
    ];

    // Calculate current week number of the year
    const currentWeekNumber = computed(() => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const diff = now - start;
      const oneWeek = 604800000; // milliseconds in a week
      return Math.ceil((diff + start.getDay() * 86400000) / oneWeek);
    });

    // Get tree variation based on week
    const currentTree = computed(() => {
      const weekIndex = currentWeekNumber.value % treeVariations.length;
      return treeVariations[weekIndex];
    });

    // Progress calculations
    const completedLessons = computed(() => {
      return Math.min(props.lessonsCompleted, props.goalTarget);
    });

    const progressPercent = computed(() => {
      return Math.round((completedLessons.value / props.goalTarget) * 100);
    });

    const isComplete = computed(() => progressPercent.value >= 100);

    // Color calculations based on progress
    const colorIntensity = computed(() => progressPercent.value / 100);

    const leafColor = computed(() => {
      const base = currentTree.value.leafBase;
      const gray = '#9E9E9E';
      return interpolateColor(gray, base, colorIntensity.value);
    });

    const leafColorLight = computed(() => {
      const base = lightenColor(currentTree.value.leafBase, 15);
      const gray = '#BDBDBD';
      return interpolateColor(gray, base, colorIntensity.value);
    });

    const trunkColor = computed(() => {
      const brown = '#5D4037';
      const gray = '#757575';
      return interpolateColor(gray, brown, colorIntensity.value);
    });

    const appleColor = computed(() => currentTree.value.appleColor);

    const applesOpacity = computed(() => {
      // Apples start appearing at 50% progress
      if (progressPercent.value < 50) return 0;
      return (progressPercent.value - 50) / 50;
    });

    // Apple positions
    const allApples = [
      { id: 1, x: 70, y: 65 },
      { id: 2, x: 130, y: 70 },
      { id: 3, x: 100, y: 50 },
      { id: 4, x: 60, y: 100 },
      { id: 5, x: 140, y: 95 },
      { id: 6, x: 85, y: 120 },
      { id: 7, x: 115, y: 125 },
      { id: 8, x: 75, y: 145 },
      { id: 9, x: 125, y: 140 },
      { id: 10, x: 100, y: 85 },
    ];

    const visibleApples = computed(() => {
      const appleCount = Math.floor((progressPercent.value / 100) * allApples.length);
      return allApples.slice(0, appleCount);
    });

    const treeColorStyle = computed(() => ({
      filter: `saturate(${0.2 + colorIntensity.value * 0.8})`
    }));

    // Encouragement messages
    const encouragementText = computed(() => {
      const percent = progressPercent.value;
      if (percent === 0) return "🌱 Plant the seeds of knowledge!";
      if (percent < 25) return "🌿 Your tree is starting to grow!";
      if (percent < 50) return "🌳 Keep it up! Halfway there!";
      if (percent < 75) return "🍃 Amazing progress! Apples appearing!";
      if (percent < 100) return "🍎 Almost there! The tree is flourishing!";
      return "🎉 Incredible! Your tree is full of fruit!";
    });

    // Color utility functions
    function interpolateColor(color1, color2, factor) {
      const c1 = hexToRgb(color1);
      const c2 = hexToRgb(color2);
      const r = Math.round(c1.r + (c2.r - c1.r) * factor);
      const g = Math.round(c1.g + (c2.g - c1.g) * factor);
      const b = Math.round(c1.b + (c2.b - c1.b) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    }

    function lightenColor(hex, percent) {
      const rgb = hexToRgb(hex);
      const r = Math.min(255, rgb.r + Math.round(255 * percent / 100));
      const g = Math.min(255, rgb.g + Math.round(255 * percent / 100));
      const b = Math.min(255, rgb.b + Math.round(255 * percent / 100));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    return {
      currentWeekNumber,
      currentTree,
      completedLessons,
      progressPercent,
      isComplete,
      leafColor,
      leafColorLight,
      trunkColor,
      appleColor,
      applesOpacity,
      visibleApples,
      treeColorStyle,
      encouragementText
    };
  }
};
</script>

<style scoped>
.apple-tree-goal {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #86efac;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.apple-tree-goal.tree-complete {
  background: linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%);
  border-color: #fcd34d;
  box-shadow: 0 0 20px rgba(250, 204, 21, 0.3);
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tree-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #166534;
  margin: 0;
}

.tree-emoji {
  font-size: 1.25rem;
}

.week-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: white;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.week-badge svg {
  width: 14px;
  height: 14px;
}

.tree-visualization {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.tree-container {
  width: 180px;
  height: 200px;
  transition: filter 0.5s ease;
}

.tree-svg {
  width: 100%;
  height: 100%;
}

.tree-crown {
  transition: fill 0.5s ease;
}

.apple {
  transition: opacity 0.3s ease;
}

/* Sparkle animations */
.sparkle {
  animation: sparkle 1.5s ease-in-out infinite;
}

.sparkle.s1 { animation-delay: 0s; }
.sparkle.s2 { animation-delay: 0.3s; }
.sparkle.s3 { animation-delay: 0.6s; }
.sparkle.s4 { animation-delay: 0.9s; }
.sparkle.s5 { animation-delay: 1.2s; }

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.5); }
}

/* Progress Section */
.progress-section {
  width: 100%;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #166534;
}

.progress-percent {
  font-size: 0.875rem;
  font-weight: 700;
  color: #15803d;
}

.progress-bar-track {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.progress-bar-fill.complete {
  background: linear-gradient(90deg, #f59e0b, #eab308);
}

/* Footer */
.tree-footer {
  margin-top: 16px;
  text-align: center;
}

.encouragement {
  font-size: 0.875rem;
  color: #166534;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.start-lesson-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-lesson-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.start-lesson-btn svg {
  width: 16px;
  height: 16px;
}

.completed-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
}

.completed-badge svg {
  width: 18px;
  height: 18px;
}

/* Responsive */
@media (max-width: 768px) {
  .apple-tree-goal {
    padding: 16px;
  }

  .tree-container {
    width: 150px;
    height: 170px;
  }

  .tree-title {
    font-size: 0.9375rem;
  }
}
</style>
