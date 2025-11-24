<template>
  <div class="w-full space-y-6">
    <!-- Challenge Header -->
    <div class="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      <h3 class="text-white font-bold text-lg mb-2">{{ title || 'Coding Challenge' }}</h3>
      <p class="text-white/70 text-sm">{{ description || 'Program the robot to reach the goal.' }}</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Left: Toolbox & Workspace -->
      <div class="space-y-4">
        <!-- Available Blocks -->
        <div class="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
          <h4 class="text-white/70 text-xs uppercase tracking-wide mb-3">Available Blocks</h4>
          <div class="space-y-2">
            <div 
              v-for="block in availableBlocks" 
              :key="block"
              @click="addBlock(block)"
              class="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              {{ getBlockLabel(block) }}
            </div>
          </div>
        </div>

        <!-- Workspace -->
        <div class="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-white/70 text-xs uppercase tracking-wide">Your Program</h4>
            <button 
              @click="workspaceBlocks = []"
              class="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div class="space-y-2 min-h-[200px]">
            <div 
              v-for="(block, index) in workspaceBlocks" 
              :key="index"
              class="group relative px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg cursor-move"
            >
              {{ getBlockLabel(block) }}
              <button 
                @click="removeBlock(index)"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
            <div v-if="workspaceBlocks.length === 0" class="text-white/40 text-center py-8 text-sm">
              Click blocks to build your program
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex gap-3">
          <button
            @click="runCode"
            :disabled="running ||workspaceBlocks.length === 0"
            class="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ running ? '▶ Running...' : '▶ Run Code' }}
          </button>
          <button
            @click="resetVisualization"
            class="px-6 py-3 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-200"
          >
            ⟲ Reset
          </button>
        </div>
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
    return 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/50';
  }
  if (goalPosition.value.x === x && goalPosition.value.y === y) {
    return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50';
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

const runCode = async () => {
  running.value = true;
  statusMessage.value = 'Running...';
  success.value = false;
  
  for (const block of workspaceBlocks.value) {
    await executeBlock(block);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Check if goal reached
  if (isMaze.value) {
    if (robotPosition.value.x === goalPosition.value.x && 
        robotPosition.value.y === goalPosition.value.y) {
      statusMessage.value = '🎉 Goal reached! Perfect!';
      success.value = true;
      setTimeout(() => {
        emit('complete', true);
        emit('next');
      }, 2000);
    } else {
      statusMessage.value = '❌ Not quite. Try again!';
    }
  } else {
    statusMessage.value = '✅ Code executed!';
    success.value = true;
    setTimeout(() => {
      emit('complete', true);
      emit('next');
    }, 2000);
  }
  
  running.value = false;
};

const executeBlock = async (block) => {
  if (block === 'move_forward') {
    const directions = [
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 0, dy: -1 }  // up
    ];
    const dir = directions[robotDirection.value];
    const newX = robotPosition.value.x + dir.dx;
    const newY = robotPosition.value.y + dir.dy;
    
    if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5) {
      if (!walls.value.some(w => w.x === newX && w.y === newY)) {
        robotPosition.value = { x: newX, y: newY };
      }
    }
  } else if (block === 'turn_left') {
    robotDirection.value = (robotDirection.value + 3) % 4;
  } else if (block === 'turn_right') {
    robotDirection.value = (robotDirection.value + 1) % 4;
  }
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
