<template>
  <div class="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
    
    <!-- Header -->
    <div class="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <h2 class="text-2xl font-bold mb-2">{{ title }}</h2>
      <p class="text-purple-100">{{ description }}</p>
    </div>

    <div class="flex flex-col lg:flex-row">
      
      <!-- Left Panel: Code Workspace -->
      <div class="w-full lg:w-1/2 flex flex-col border-r border-gray-200">
        
        <!-- Workspace Area -->
        <div class="flex-1 p-6 bg-gray-50 overflow-y-auto min-h-[400px]">
          <div class="space-y-3">
            
            <!-- Start Block -->
            <div class="bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl p-4 font-bold flex items-center gap-3 shadow-md">
              <span class="text-2xl">▶</span>
              <span>When Run</span>
            </div>

            <!-- User Blocks -->
            <transition-group name="list" class="space-y-3">
              <div 
                v-for="(block, index) in workspaceBlocks" 
                :key="block.id"
                class="group"
              >
                <div 
                  class="bg-white rounded-xl p-4 shadow-sm border-2 transition-all duration-200 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02]"
                  :class="getBlockBorderColor(block.type)"
                >
                  <span class="text-2xl">{{ getBlockIcon(block.type) }}</span>
                  
                  <div class="flex-1 flex items-center gap-2 font-medium text-gray-800">
                    <span>{{ block.label }}</span>
                    
                    <input 
                      v-if="block.type === 'repeat'"
                      type="number" 
                      v-model.number="block.count"
                      min="1" 
                      max="10"
                      class="w-14 px-2 py-1 rounded-lg border-2 border-gray-300 text-center focus:border-purple-500 outline-none font-bold"
                      @click.stop
                    />
                    <span v-if="block.type === 'repeat'" class="text-gray-600">times</span>
                  </div>

                  <button 
                    @click="removeBlock(index)"
                    class="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </transition-group>

            <!-- Placeholder -->
            <div 
              v-if="workspaceBlocks.length === 0"
              class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400 bg-white"
            >
              <div class="text-4xl mb-3">🧩</div>
              <p class="font-medium">Add blocks below to build your program</p>
            </div>
          </div>
        </div>

        <!-- Toolbox -->
        <div class="p-6 bg-white border-t-2 border-gray-200">
          <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Available Blocks</p>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="blockType in availableBlocks"
              :key="blockType"
              @click="addBlock(blockType)"
              class="px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all transform hover:scale-105 hover:shadow-md active:scale-95 flex items-center gap-2"
              :class="getBlockButtonColor(blockType)"
            >
              <span class="text-lg">{{ getBlockIcon(blockType) }}</span>
              <span>{{ getBlockLabel(blockType) }}</span>
            </button>
          </div>
        </div>

        <!-- Controls -->
        <div class="p-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
          <button 
            @click="resetWorkspace"
            class="px-4 py-2 text-gray-600 hover:text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            🔄 Reset
          </button>
          <button 
            @click="runCode"
            :disabled="isRunning || workspaceBlocks.length === 0"
            class="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
          >
            <span v-if="isRunning" class="animate-spin">↻</span>
            <span v-else class="text-xl">▶</span>
            <span>{{ isRunning ? 'Running...' : 'Run Code' }}</span>
          </button>
        </div>
      </div>

      <!-- Right Panel: Maze Visualizer -->
      <div class="w-full lg:w-1/2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden flex flex-col items-center justify-center p-8 min-h-[500px]">
        
        <!-- Direct Controls -->
        <div class="mb-6 flex flex-col items-center gap-3">
          <p class="text-sm font-bold text-gray-600 uppercase tracking-wide">Control Robot</p>
          <div class="flex flex-col items-center gap-2">
            <button
              @click="moveRobotDirect('forward')"
              :disabled="isRunning"
              class="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-2xl font-bold border-2 border-blue-400"
            >
              ⬆
            </button>
            <div class="flex gap-2">
              <button
                @click="moveRobotDirect('left')"
                :disabled="isRunning"
                class="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-2xl font-bold border-2 border-purple-400"
              >
                ⬅
              </button>
              <button
                @click="moveRobotDirect('right')"
                :disabled="isRunning"
                class="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-2xl font-bold border-2 border-purple-400"
              >
                ⮕
              </button>
            </div>
          </div>
        </div>
        
        <!-- Maze Grid -->
        <div v-if="type === 'maze'" class="relative w-full max-w-[360px] aspect-square">
          <div class="absolute inset-0 bg-white rounded-3xl shadow-2xl border-4 border-indigo-200 grid grid-cols-5 grid-rows-5 gap-3 p-4">
            
            <!-- Grid Cells -->
            <div 
              v-for="(cell, i) in mazeGrid" 
              :key="i"
              class="relative rounded-lg transition-all duration-200"
              :class="cell.isWall ? 'bg-gradient-to-br from-gray-600 to-gray-700 shadow-inner' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200'"
            >
              <!-- Goal -->
              <div v-if="cell.isGoal" class="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-lg flex items-center justify-center border-2 border-yellow-400 animate-pulse">
                <span class="text-3xl filter drop-shadow-md">⭐</span>
              </div>
            </div>

            <!-- Robot -->
            <div 
              class="absolute transition-all duration-300 z-20"
              :style="{ 
                left: `${robotState.x * 20 + robotState.x * 2 + 3}%`, 
                top: `${robotState.y * 20 + robotState.y * 2 + 3}%`,
                width: '18%',
                height: '18%',
                transform: `rotate(${robotState.rotation}deg)`
              }"
            >
              <div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-2xl border-3 border-blue-200 flex items-center justify-center transform hover:scale-110 transition-transform">
                <span class="text-2xl filter drop-shadow-lg">🤖</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Feedback Overlay -->
        <transition name="fade-scale">
          <div v-if="showFeedback" class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm transform transition-all">
              <div class="text-7xl mb-4">{{ isCorrect ? '🎉' : '💥' }}</div>
              <h3 class="text-3xl font-bold mb-3" :class="isCorrect ? 'text-green-600' : 'text-red-500'">
                {{ isCorrect ? 'Success!' : 'Not Quite!' }}
              </h3>
              <p class="text-gray-600 mb-6 text-lg">{{ feedbackMessage }}</p>
              <div class="flex gap-3 justify-center">
                <button 
                  v-if="!isCorrect"
                  @click="resetLevel"
                  class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Try Again
                </button>
                <button 
                  v-if="isCorrect"
                  @click="$emit('next')"
                  class="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                >
                  Next Level →
                </button>
              </div>
            </div>
          </div>
        </transition>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  type: { type: String, required: true },
  title: { type: String, default: 'Robot Navigation' },
  description: { type: String, default: 'Add movement blocks to guide the robot to the star' },
  config: { type: Object, default: () => ({}) },
  availableBlocks: { type: Array, default: () => ['move_forward', 'turn_left', 'turn_right', 'repeat'] }
});

const emit = defineEmits(['next', 'complete']);

const workspaceBlocks = ref([]);
const isRunning = ref(false);
const showFeedback = ref(false);
const isCorrect = ref(false);
const feedbackMessage = ref('');

const robotState = ref({ x: 0, y: 0, rotation: 90 });
const mazeGrid = ref([]);

const blockDefinitions = {
  move_forward: { label: 'Move Forward', icon: '⬆️', borderColor: 'border-blue-400 hover:border-blue-500', buttonColor: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' },
  turn_left: { label: 'Turn Left', icon: '⬅️', borderColor: 'border-purple-400 hover:border-purple-500', buttonColor: 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100' },
  turn_right: { label: 'Turn Right', icon: '➡️', borderColor: 'border-purple-400 hover:border-purple-500', buttonColor: 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100' },
  repeat: { label: 'Repeat', icon: '🔁', borderColor: 'border-orange-400 hover:border-orange-500', buttonColor: 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100' }
};

const getBlockLabel = (type) => blockDefinitions[type]?.label || type;
const getBlockIcon = (type) => blockDefinitions[type]?.icon || '🧩';
const getBlockBorderColor = (type) => blockDefinitions[type]?.borderColor || 'border-gray-300';
const getBlockButtonColor = (type) => blockDefinitions[type]?.buttonColor || 'border-gray-300 bg-gray-50';

const addBlock = (type) => {
  workspaceBlocks.value.push({
    id: Date.now(),
    type,
    label: getBlockLabel(type),
    count: type === 'repeat' ? 2 : undefined
  });
};

const removeBlock = (index) => {
  workspaceBlocks.value.splice(index, 1);
};

const resetWorkspace = () => {
  workspaceBlocks.value = [];
  resetLevel();
};

const resetLevel = () => {
  showFeedback.value = false;
  isRunning.value = false;
  robotState.value = { ...(props.config.start || { x: 0, y: 0 }), rotation: 90 };
};

const initLevel = () => {
  workspaceBlocks.value = [];
  const size = 5;
  mazeGrid.value = Array(size * size).fill(null).map((_, i) => ({
    x: i % size,
    y: Math.floor(i / size),
    isWall: false,
    isGoal: false
  }));
  
  if (props.config.walls) {
    props.config.walls.forEach(w => {
      const idx = w.y * size + w.x;
      if (mazeGrid.value[idx]) mazeGrid.value[idx].isWall = true;
    });
  }
  if (props.config.goal) {
    const idx = props.config.goal.y * size + props.config.goal.x;
    if (mazeGrid.value[idx]) mazeGrid.value[idx].isGoal = true;
  }
  
  robotState.value = { ...(props.config.start || { x: 0, y: 0 }), rotation: 90 };
};

const runCode = async () => {
  if (isRunning.value) return;
  isRunning.value = true;
  resetLevel();
  
  for (const block of workspaceBlocks.value) {
    if (!isRunning.value) break;
    await executeBlock(block);
    await new Promise(r => setTimeout(r, 400));
  }
  
  checkWinCondition();
  isRunning.value = false;
};

const executeBlock = async (block) => {
  const { x, y, rotation } = robotState.value;
  let newX = x, newY = y, newRotation = rotation;

  if (block.type === 'move_forward') {
    if (rotation % 360 === 0 || rotation % 360 === -360) newY -= 1;
    else if (rotation % 360 === 90 || rotation % 360 === -270) newX += 1;
    else if (rotation % 360 === 180 || rotation % 360 === -180) newY += 1;
    else if (rotation % 360 === 270 || rotation % 360 === -90) newX -= 1;
    
    if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5) {
      const idx = newY * 5 + newX;
      if (!mazeGrid.value[idx].isWall) {
        robotState.value = { x: newX, y: newY, rotation };
      }
    }
  } else if (block.type === 'turn_left') {
    robotState.value.rotation -= 90;
  } else if (block.type === 'turn_right') {
    robotState.value.rotation += 90;
  }
};

// NEW: Real-time robot control with arrow buttons
const moveRobotDirect = async (direction) => {
  const block = {
    type: direction === 'forward' ? 'move_forward' : direction === 'left' ? 'turn_left' : 'turn_right'
  };
  await executeBlock(block);
  
  // Check if goal reached after each move
  const { x, y } = robotState.value;
  const idx = y * 5 + x;
  if (mazeGrid.value[idx]?.isGoal) {
    isCorrect.value = true;
    feedbackMessage.value = "You reached the goal!";
    showFeedback.value = true;
    emit('complete', true);
  }
};

const checkWinCondition = () => {
  const { x, y } = robotState.value;
  const idx = y * 5 + x;
  if (mazeGrid.value[idx]?.isGoal) {
    isCorrect.value = true;
    feedbackMessage.value = "You successfully reached the goal!";
    showFeedback.value = true;
    emit('complete', true);
  } else {
    isCorrect.value = false;
    feedbackMessage.value = "The robot didn't reach the goal. Try again!";
    showFeedback.value = true;
  }
};

onMounted(initLevel);
watch(() => props.config, initLevel, { deep: true });
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.list-leave-active {
  position: absolute;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
