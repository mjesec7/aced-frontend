<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🎮</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Maze Challenge</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">{{ title || 'Navigate the Robot' }}</h2>
      <p v-if="description" class="text-sm text-slate-500 mt-1 leading-relaxed">{{ description || 'Use the arrow buttons to navigate the robot to the golden star!' }}</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-5 items-start">
      <!-- Maze Grid -->
      <div class="flex-1 order-2 lg:order-1">
        <div class="bg-slate-50/80 rounded-xl border border-slate-200/60 p-4">
          <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 text-center">Maze Grid</h4>

          <!-- Maze Visualization -->
          <div v-if="type === 'maze' || config?.type === 'maze'">
            <div class="grid grid-cols-5 gap-2 bg-white p-3 rounded-lg border border-slate-100">
              <div
                v-for="(cell, index) in 25"
                :key="index"
                class="aspect-square rounded-lg flex items-center justify-center text-3xl transition-all duration-300"
                :class="getCellClass(index)"
              >
                {{ getCellContent(index) }}
              </div>
            </div>
          </div>

          <!-- Geometry/Turtle Visualization -->
          <div v-else class="aspect-square bg-white rounded-lg border border-slate-100 relative">
            <svg class="w-full h-full" viewBox="0 0 200 200">
              <path
                v-for="(line, index) in drawnLines"
                :key="index"
                :d="`M ${line.from.x} ${line.from.y} L ${line.to.x} ${line.to.y}`"
                stroke="#7c3aed"
                stroke-width="2"
                fill="none"
                class="animate-draw"
              />
              <circle
                v-if="turtlePosition"
                :cx="turtlePosition.x"
                :cy="turtlePosition.y"
                r="4"
                fill="#8b5cf6"
                class="animate-pulse"
              />
            </svg>
          </div>

          <!-- Status Message -->
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
          >
            <div
              v-if="statusMessage"
              class="mt-3 flex items-start gap-3 p-3 rounded-xl border"
              :class="success
                ? 'bg-emerald-50/50 border-emerald-200/60'
                : 'bg-red-50/50 border-red-200/60'"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0"
                :class="success ? 'bg-emerald-500' : 'bg-red-500'"
              >
                {{ success ? '🎉' : '🚫' }}
              </div>
              <p class="text-sm font-semibold pt-1" :class="success ? 'text-emerald-700' : 'text-red-700'">{{ statusMessage }}</p>
            </div>
          </transition>
        </div>
      </div>

      <!-- Controls Sidebar -->
      <div class="w-full lg:w-72 order-1 lg:order-2 space-y-4">
        <!-- Movement Controls -->
        <div class="bg-slate-50/80 rounded-xl border border-slate-200/60 p-5">
          <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 text-center">Controls</h4>
          <div class="flex flex-col items-center gap-2">
            <!-- Up Arrow -->
            <button
              @click="moveDirection('up')"
              :disabled="running"
              class="control-btn"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/>
              </svg>
            </button>
            <!-- Left, Down, Right Arrows -->
            <div class="flex gap-2">
              <button
                @click="moveDirection('left')"
                :disabled="running"
                class="control-btn"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button
                @click="moveDirection('down')"
                :disabled="running"
                class="control-btn"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <button
                @click="moveDirection('right')"
                :disabled="running"
                class="control-btn"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <button
          @click="resetVisualization"
          class="step-btn-primary w-full inline-flex items-center justify-center gap-2"
          style="background: linear-gradient(135deg, #f59e0b, #d97706);"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  type: String,
  title: String,
  description: String,
  availableBlocks: {
    type: Array,
    default: () => ['move_forward', 'turn_left', 'turn_right']
  },
  config: Object
});

const emit = defineEmits(['complete', 'next']);

// State
const workspaceBlocks = ref([]);
const running = ref(false);
const robotPosition = ref({ x: 0, y: 0 });
const robotDirection = ref(0); // 0=right, 1=down, 2=left, 3=up
const drawnLines = ref([]);
const turtlePosition = ref({ x: 100, y: 100 });
const turtleAngle = ref(0);
const statusMessage = ref('');
const success = ref(false);

// Computed
const isMaze = computed(() => props.type === 'maze' || props.config?.type === 'maze');
const goalPosition = computed(() => props.config?.goal || { x: 4, y: 4 });
const walls = computed(() => props.config?.walls || []);

// Methods
const getBlockLabel = (block) => {
  const labels = {
    'move_forward': 'Move Forward',
    'turn_left': 'Turn Left',
    'turn_right': 'Turn Right',
    'repeat': 'Repeat',
    'draw_line': 'Draw Line'
  };
  return labels[block] || block;
};

const addBlock = (block) => {
  workspaceBlocks.value.push(block);
};

const removeBlock = (index) => {
  workspaceBlocks.value.splice(index, 1);
};

const getCellClass = (index) => {
  const x = index % 5;
  const y = Math.floor(index / 5);

  if (robotPosition.value.x === x && robotPosition.value.y === y) {
    return 'bg-gradient-to-br from-violet-400 to-indigo-500 shadow-md shadow-violet-200 border border-violet-300/50';
  }
  if (goalPosition.value.x === x && goalPosition.value.y === y) {
    return 'bg-gradient-to-br from-amber-300 to-amber-400 shadow-md shadow-amber-200 border border-amber-300/50 animate-pulse';
  }
  if (walls.value.some(w => w.x === x && w.y === y)) {
    return 'bg-slate-300 border border-slate-400/30';
  }
  return 'bg-slate-100 border border-slate-200/60 hover:bg-slate-150 transition-colors';
};

const getCellContent = (index) => {
  const x = index % 5;
  const y = Math.floor(index / 5);

  if (robotPosition.value.x === x && robotPosition.value.y === y) {
    return '🤖';
  }
  if (goalPosition.value.x === x && goalPosition.value.y === y) {
    return '⭐';
  }
  return '';
};

const moveDirection = async (direction) => {
  running.value = true;

  const directionMap = {
    'up': { dx: 0, dy: -1 },
    'down': { dx: 0, dy: 1 },
    'left': { dx: -1, dy: 0 },
    'right': { dx: 1, dy: 0 }
  };

  const dir = directionMap[direction];
  const newX = robotPosition.value.x + dir.dx;
  const newY = robotPosition.value.y + dir.dy;

  // Check bounds and walls
  if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5) {
    if (!walls.value.some(w => w.x === newX && w.y === newY)) {
      robotPosition.value = { x: newX, y: newY };

      // Check if goal reached
      if (robotPosition.value.x === goalPosition.value.x &&
          robotPosition.value.y === goalPosition.value.y) {
        statusMessage.value = 'Goal reached! Perfect!';
        success.value = true;
        setTimeout(() => {
          emit('complete', true);
          emit('next');
        }, 1500);
      }
    } else {
      statusMessage.value = 'Can\'t move there - wall!';
      setTimeout(() => statusMessage.value = '', 1000);
    }
  } else {
    statusMessage.value = 'Can\'t move outside the maze!';
    setTimeout(() => statusMessage.value = '', 1000);
  }

  setTimeout(() => running.value = false, 300);
};

const resetVisualization = () => {
  robotPosition.value = props.config?.start || { x: 0, y: 0 };
  robotDirection.value = 0;
  drawnLines.value = [];
  turtlePosition.value = { x: 100, y: 100 };
  turtleAngle.value = 0;
  statusMessage.value = '';
  success.value = false;
};

// Initialize
resetVisualization();

import { onMounted } from 'vue';
onMounted(() => {
});
</script>

<style scoped>
@keyframes draw {
  from { stroke-dashoffset: 200; }
  to { stroke-dashoffset: 0; }
}

.animate-draw {
  stroke-dasharray: 200;
  animation: draw 0.5s ease-out forwards;
}

.control-btn {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  background: white;
  color: #7c3aed;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.control-btn:hover:not(:disabled) {
  border-color: #7c3aed;
  background: rgba(139, 92, 246, 0.06);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.control-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
