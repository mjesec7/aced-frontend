<template>
  <div class="w-full space-y-6">
    <!-- Challenge Header -->
    <div class="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      <h3 class="text-white font-bold text-lg mb-2">{{ title || 'Coding Challenge' }}</h3>
      <p class="text-white/70 text-sm">{{ description || 'Program the robot to reach the goal.' }}</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Left: Direct Controls -->
      <div class="space-y-4">
        <!-- Movement Controls -->
        <div class="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h4 class="text-white/70 text-xs uppercase tracking-wide mb-4 text-center">Move the Robot</h4>
          <div class="flex flex-col items-center gap-2">
            <!-- Up Arrow -->
            <button
              @click="moveDirection('up')"
              :disabled="running"
              class="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-2xl"
            >
              ⬆️
            </button>
            <!-- Left, Down, Right Arrows -->
            <div class="flex gap-2">
              <button
                @click="moveDirection('left')"
                :disabled="running"
                class="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-2xl"
              >
                ⬅️
              </button>
              <button
                @click="moveDirection('down')"
                :disabled="running"
                class="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-2xl"
              >
                ⬇️
              </button>
              <button
                @click="moveDirection('right')"
                :disabled="running"
                class="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-2xl"
              >
                ➡️
              </button>
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <button
          @click="resetVisualization"
          class="w-full py-3 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-200"
        >
          ⟲ Reset Position
        </button>
      </div>

      <!-- Right: Visualization -->
      <div class="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h4 class="text-white/70 text-xs uppercase tracking-wide mb-4">Preview</h4>
        
        <!-- Maze Visualization -->
        <div v-if="type === 'maze' || config?.type === 'maze'" class="space-y-4">
          <div class="grid grid-cols-5 gap-1">
            <div 
              v-for="(cell, index) in  25" 
              :key="index"
              class="aspect-square rounded flex items-center justify-center text-2xl transition-all duration-300"
              :class="getCellClass(index)"
            >
              {{ getCellContent(index) }}
            </div>
          </div>
        </div>

        <!-- Geometry/Turtle Visualization -->
        <div v-else class="aspect-square bg-white rounded-lg relative">
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
        <div v-if="statusMessage" class="mt-4 p-3 rounded-lg backdrop-blur-md"
             :class="success ? 'bg-green-500/20 border border-green-400/50 text-green-300' : 'bg-blue-500/20 border border-blue-400/50 text-blue-300'">
          <p class="text-sm font-medium">{{ statusMessage }}</p>
        </div>
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
    return 'bg-[linear-gradient(to_bottom_right,rgb(74,222,128),rgb(16,185,129))] shadow-lg shadow-green-500/50';
  }
  if (goalPosition.value.x === x && goalPosition.value.y === y) {
    return 'bg-[linear-gradient(to_bottom_right,rgb(250,204,21),rgb(249,115,22))] shadow-lg shadow-yellow-500/50';
  }
  if (walls.value.some(w => w.x === x && w.y === y)) {
    return 'bg-slate-700';
  }
  return 'bg-white/5';
};

const getCellContent = (index) => {
  const x = index % 5;
  const y = Math.floor(index / 5);
  
  if (robotPosition.value.x === x && robotPosition.value.y === y) {
    const arrows = ['➡️', '⬇️', '⬅️', '⬆️'];
    return arrows[robotDirection.value];
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
