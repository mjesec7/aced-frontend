<template>
  <div class="w-full max-w-6xl mx-auto">
    <!-- Challenge Header -->
    <div class="bg-[linear-gradient(135deg,rgb(139,92,246),rgb(219,39,119))] rounded-3xl p-8 mb-8 shadow-2xl">
      <h3 class="text-white font-black text-2xl mb-3">{{ title || '🎮 Maze Challenge' }}</h3>
      <p class="text-white/90 text-base">{{ description || 'Use the arrow buttons to navigate the robot to the golden star!' }}</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 items-start">
      <!-- Maze Grid - Now Larger and Primary -->
      <div class="flex-1 order-2 lg:order-1">
        <div class="bg-linear-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl border-4 border-purple-500/30">
          <h4 class="text-purple-300 font-bold text-sm uppercase tracking-wider mb-6 text-center">🗺️ Maze Grid</h4>
          
          <!-- Maze Visualization -->
          <div v-if="type === 'maze' || config?.type === 'maze'">
            <div class="grid grid-cols-5 gap-3 bg-slate-950/50 p-4 rounded-2xl">
              <div 
                v-for="(cell, index) in 25" 
                :key="index"
                class="aspect-square rounded-xl flex items-center justify-center text-4xl transition-all duration-300 shadow-lg"
                :class="getCellClass(index)"
              >
                {{ getCellContent(index) }}
              </div>
            </div>
          </div>

          <!-- Geometry/Turtle Visualization -->
          <div v-else class="aspect-square bg-white rounded-2xl relative shadow-inner">
            <svg class="w-full h-full" viewBox="0 0 200 200">
              <path 
                v-for="(line, index) in drawnLines" 
                :key="index"
                :d="`M ${line.from.x} ${line.from.y} L ${line.to.x} ${line.to.y}`"
                stroke="#8b5cf6"
                stroke-width="2"
                fill="none"
                class="animate-draw"
              />
              <circle 
                v-if="turtlePosition"
                :cx="turtlePosition.x" 
                :cy="turtlePosition.y" 
                r="4" 
                fill="#ec4899"
                class="animate-pulse"
              />
            </svg>
          </div>

          <!-- Status -->
          <div v-if="statusMessage" class="mt-6 p-4 rounded-2xl backdrop-blur-md shadow-lg"
               :class="success ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-100' : 'bg-rose-500/30 border-2 border-rose-400 text-rose-100'">
            <p class="text-base font-bold text-center">{{ statusMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Controls - Now Sidebar -->
      <div class="w-full lg:w-80 order-1 lg:order-2 space-y-6">
        <!-- Movement Controls -->
        <div class="bg-linear-to-br from-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl">
          <h4 class="text-white font-bold text-base uppercase tracking-wide mb-6 text-center">🎮 Controls</h4>
          <div class="flex flex-col items-center gap-3">
            <!-- Up Arrow -->
            <button
              @click="moveDirection('up')"
              :disabled="running"
              class="w-20 h-20 bg-white/95 hover:bg-white text-purple-600 font-black rounded-2xl hover:shadow-2xl hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-3xl active:scale-95 shadow-xl"
            >
              ⬆
            </button>
            <!-- Left, Down, Right Arrows -->
            <div class="flex gap-3">
              <button
                @click="moveDirection('left')"
                :disabled="running"
                class="w-20 h-20 bg-white/95 hover:bg-white text-purple-600 font-black rounded-2xl hover:shadow-2xl hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-3xl active:scale-95 shadow-xl"
              >
                ⬅
              </button>
              <button
                @click="moveDirection('down')"
                :disabled="running"
                class="w-20 h-20 bg-white/95 hover:bg-white text-purple-600 font-black rounded-2xl hover:shadow-2xl hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-3xl active:scale-95 shadow-xl"
              >
                ⬇
              </button>
              <button
                @click="moveDirection('right')"
                :disabled="running"
                class="w-20 h-20 bg-white/95 hover:bg-white text-purple-600 font-black rounded-2xl hover:shadow-2xl hover:scale-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-3xl active:scale-95 shadow-xl"
              >
                ➡
              </button>
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <button
          @click="resetVisualization"
          class="w-full py-5 bg-linear-to-r from-amber-500 to-orange-500 text-white font-black text-lg rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-200 active:scale-95 shadow-xl"
        >
          🔄 Reset
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
    'move_forward': '⬆ Move Forward',
    'turn_left': '⬅ Turn Left',
    'turn_right': '➡ Turn Right',
    'repeat': '🔁 Repeat',
    'draw_line': '✏️ Draw Line'
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
    return 'bg-[linear-gradient(135deg,rgb(34,211,238),rgb(59,130,246))] shadow-2xl shadow-cyan-400/60 border-2 border-cyan-300/50';
  }
  if (goalPosition.value.x === x && goalPosition.value.y === y) {
    return 'bg-[linear-gradient(135deg,rgb(251,191,36),rgb(245,158,11))] shadow-2xl shadow-amber-400/60 border-2 border-amber-300/50 animate-pulse';
  }
  if (walls.value.some(w => w.x === x && w.y === y)) {
    return 'bg-[linear-gradient(135deg,rgb(88,28,135),rgb(126,34,206))] border-2 border-purple-700/30';
  }
  return 'bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/40 transition-colors';
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
        statusMessage.value = '🎉 Goal reached! Perfect!';
        success.value = true;
        setTimeout(() => {
          emit('complete', true);
          emit('next');
        }, 1500);
      }
    } else {
      statusMessage.value = '🚫 Can\'t move there - wall!';
      setTimeout(() => statusMessage.value = '', 1000);
    }
  } else {
    statusMessage.value = '🚫 Can\'t move outside the maze!';
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
// Initialize
resetVisualization();

import { onMounted } from 'vue';
onMounted(() => {
  console.log('ModernBlockCoding mounted with props:', props);
});
</script>

<style scoped>
@keyframes draw {
  from {
    stroke-dashoffset: 200;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.animate-draw {
  stroke-dasharray: 200;
  animation: draw 0.5s ease-out forwards;
}
</style>
