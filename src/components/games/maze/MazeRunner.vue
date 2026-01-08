<template>
  <div class="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
    
    <div class="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px]"></div>

    <div class="relative z-10 mb-6 flex justify-between w-full max-w-md px-4">
      <div class="flex flex-col">
        <span class="text-xs font-bold tracking-wider text-slate-400 uppercase">Current Level</span>
        <span class="text-2xl font-black text-slate-800">01</span>
      </div>
      <div class="flex flex-col items-end">
        <span class="text-xs font-bold tracking-wider text-slate-400 uppercase">Status</span>
        <span class="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Active
        </span>
      </div>
    </div>

    <div 
      class="relative bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 select-none"
      :style="{ width: boardWidth + 'px', height: boardHeight + 'px' }"
    >
      
      <div 
        class="grid w-full h-full"
        :style="{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: gapSize + 'px'
        }"
      >
        <div 
          v-for="(cell, index) in flatGrid" 
          :key="index"
          class="rounded-md transition-colors duration-300"
          :class="[
            cell === 1 
              ? 'bg-slate-800 shadow-inner' /* Wall */ 
              : 'bg-slate-50 border border-slate-100/50' /* Path */
          ]"
        >
          <div v-if="cell === 0" class="w-1 h-1 bg-slate-200 rounded-full mx-auto mt-[40%]"></div>
        </div>
      </div>

      <div 
        class="absolute flex items-center justify-center text-emerald-500 animate-bounce"
        :style="getPositionStyle(goalPosition)"
      >
        <svg class="w-6 h-6 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M10 9H3V5a2 2 0 012-2h4a2 2 0 012 2v4zm10-4h-4m0 0v4m0-4h4a2 2 0 012 2v4m-6 4v.01" /></svg>
      </div>

      <div 
        class="absolute z-20 flex items-center justify-center transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
        :style="getPositionStyle(robotPosition)"
      >
        <div class="relative w-4/5 h-4/5">
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black/20 blur-sm rounded-full transition-all duration-500"
               :class="{ 'scale-75 opacity-10': isMoving, 'scale-100 opacity-20': !isMoving }">
          </div>
          
          <div class="w-full h-full bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white relative animate-float">
             <svg class="w-3/5 h-3/5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <div class="absolute -top-1 w-1 h-2 bg-indigo-400 rounded-full"></div>
             <div class="absolute -top-2 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

    </div>

    <div class="mt-6 flex gap-4 text-xs font-mono text-slate-400">
      <div class="flex items-center gap-1"><span class="px-2 py-1 bg-white border rounded shadow-sm">WASD</span> to move</div>
      <div class="flex items-center gap-1"><span class="px-2 py-1 bg-white border rounded shadow-sm">SPACE</span> to jump</div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

// --- PROPS ---
const props = defineProps({
  grid: { 
    type: Array, 
    // Default 10x10 maze (0=path, 1=wall)
    default: () => [
      [1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,1],
      [1,0,1,0,1,0,1,1,0,1],
      [1,0,1,0,0,0,0,1,0,1],
      [1,0,1,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,1,0,1],
      [1,1,1,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1]
    ]
  },
  robotPos: { type: Object, default: () => ({ x: 1, y: 1 }) }, // Use passed prop or internal state
  goalPos: { type: Object, default: () => ({ x: 8, y: 7 }) }
});

// --- CONFIG ---
const cellSize = 48; // px
const gapSize = 8;   // px
const gridSize = 10; // columns

// --- STATE ---
// If you want the component to control itself for demo purposes:
const internalRobot = ref({ ...props.robotPos });
const isMoving = ref(false);

const robotPosition = computed(() => props.robotPos || internalRobot.value);
const goalPosition = computed(() => props.goalPos);

// Calculate total board size based on cells + gaps
const boardWidth = computed(() => (cellSize * gridSize) + (gapSize * (gridSize - 1)) + 32); // +32 for padding
const boardHeight = computed(() => (cellSize * props.grid.length) + (gapSize * (props.grid.length - 1)) + 32);

const flatGrid = computed(() => props.grid.flat());

// --- HELPER: CALCULATE PIXEL POSITION ---
// This is the magic sauce for "Antigravity". 
// Instead of grid rows, we calculate exact Top/Left pixels.
const getPositionStyle = (pos) => {
  if (!pos) return {};
  // 16px (p-4 padding) + (Index * (Size + Gap))
  const left = 16 + (pos.x * (cellSize + gapSize));
  const top = 16 + (pos.y * (cellSize + gapSize));
  return {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    transform: `translate(${left}px, ${top}px)` // Hardware accelerated movement
  };
};

// --- Watch for movement to trigger animations ---
watch(() => props.robotPos, () => {
  isMoving.value = true;
  setTimeout(() => isMoving.value = false, 500);
}, { deep: true });

</script>

<style scoped>
/* Floating Animation for the Robot Body */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>