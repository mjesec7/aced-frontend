<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
    
    <div class="mb-8 text-center space-y-2">
      <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
        Maze <span class="text-indigo-600">Runner</span>
      </h1>
      <p class="text-slate-500 text-sm font-medium uppercase tracking-wider">
        Level {{ level || 1 }} • Moves: {{ moves || 0 }}
      </p>
    </div>

    <div class="relative bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
      
      <div 
        class="grid gap-2" 
        :style="{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }"
      >
        <div 
          v-for="(cell, index) in flatGrid" 
          :key="index"
          class="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300"
          :class="getCellStyle(cell)"
        >
          <div v-if="isRobotHere(index)" class="relative w-8 h-8">
             <div class="absolute inset-0 bg-indigo-500 rounded-full animate-pulse opacity-50"></div>
             <div class="relative bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110">
               <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
               </svg>
             </div>
          </div>

          <div v-if="isGoalHere(index)" class="text-emerald-500">
             
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 flex gap-4">
      <button class="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
        Reset
      </button>
      <button class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5">
        Start Auto-Run
      </button>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';

// Assuming you have props or state for these. 
// If not, replace with your actual data variables.
const props = defineProps({
  grid: Array, // 2D array or 1D array representing the maze
  robotPosition: Object, // {x, y} or index
  gridSize: { type: Number, default: 10 },
  level: Number,
  moves: Number
});

// Helper to flatten grid if it's 2D, purely for the v-for loop
const flatGrid = computed(() => {
  return props.grid ? props.grid.flat() : Array(100).fill(0); 
});

// Modern Styling Logic
const getCellStyle = (cellValue) => {
  // Assuming 0 = path, 1 = wall
  if (cellValue === 1) {
    return 'bg-slate-800 shadow-inner'; // Wall: Dark, "Solid" look
  }
  return 'bg-slate-100/50 border border-slate-100'; // Path: Light, subtle
};

const isRobotHere = (index) => {
  // Add your logic to match index to robotPosition
  // Example: return index === props.robotPosition.y * props.gridSize + props.robotPosition.x;
  if (!props.robotPosition) return false;
  // Handle both {x,y} and index based position
  if (typeof props.robotPosition === 'number') return index === props.robotPosition;
  return index === props.robotPosition.y * props.gridSize + props.robotPosition.x;
};

const isGoalHere = (index) => {
  // Add goal logic
  return false; 
};
</script>

<style scoped>
/* Sometimes Tailwind grid needs a little helper for dynamic columns 
   if you aren't using the JIT compiler fully for dynamic values.
   The inline style in the template handles the columns mainly.
*/
</style>
