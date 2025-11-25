<template>
  <div class="interactive-step step-animate-in">
    <p class="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
      {{ step.prompt }}
    </p>

    <!-- SVG Canvas -->
    <div class="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 select-none">
      <svg viewBox="0 0 400 300" class="w-full h-auto">
        <!-- Guide Rays -->
        <line
          v-for="(pt, i) in points"
          :key="`ray-${i}`"
          :x1="center.x"
          :y1="center.y"
          :x2="pt.x"
          :y2="pt.y"
          stroke="#e5e7eb"
          stroke-width="2"
          stroke-dasharray="4"
        />

        <!-- Main Triangle -->
        <polygon
          :points="polyString"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="#3b82f6"
          stroke-width="3"
        />

        <!-- Vertices & Exterior Angles -->
        <g v-for="(pt, i) in points" :key="`ext-${i}`">
          <circle :cx="pt.x" :cy="pt.y" r="4" fill="#3b82f6" />
          <!-- Show wedge when shrinking -->
          <path
            v-if="sliderVal > 0.8"
            :d="getArcPath(pt)"
            fill="none"
            stroke="#f59e0b"
            stroke-width="3"
            opacity="0.8"
          />
        </g>

        <!-- Resulting Circle Visual at end state -->
        <circle
          v-if="sliderVal === 1"
          :cx="center.x"
          :cy="center.y"
          r="15"
          fill="none"
          stroke="#f59e0b"
          stroke-width="4"
        />
      </svg>
    </div>

    <!-- Slider Control -->
    <div class="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mt-6">
      <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Large</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        v-model.number="sliderVal"
        @input="handleSliderChange"
        class="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Point</span>
    </div>

    <!-- Question Block - Only appears when shrunk -->
    <transition
      enter-active-class="transition-all duration-500"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-64 opacity-100"
      leave-active-class="transition-all duration-500"
      leave-from-class="max-h-64 opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="sliderVal > 0.5" class="flex flex-col gap-4 mt-4">
        <p class="font-semibold text-gray-800 dark:text-gray-200">
          What shape do the exterior angles form?
        </p>
        <div class="flex gap-3 flex-wrap">
          <button
            v-for="opt in step.shapes"
            :key="opt"
            @click="handleSelect(opt)"
            :disabled="status === 'correct'"
            class="flex-1 min-w-[80px] py-3 px-2 rounded-lg border font-medium transition-all"
            :class="{
              'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm': selectedShape === opt,
              'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300': selectedShape !== opt
            }"
          >
            {{ opt }}
          </button>
        </div>
        
        <button
          v-if="selectedShape"
          @click="handleConfirm"
          :disabled="status === 'correct'"
          class="w-full py-3 rounded-lg font-bold text-white transition-all shadow-md"
          :class="{
            'bg-green-500 cursor-default': status === 'correct',
            'bg-red-500 hover:bg-red-600': status === 'incorrect',
            'bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600': status === 'idle'
          }"
        >
          {{ status === 'correct' ? 'Correct!' : status === 'incorrect' ? 'Incorrect, look closer!' : 'Confirm' }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const sliderVal = ref(0); // 0 to 1
const selectedShape = ref(null);
const status = ref('idle'); // 'idle' | 'correct' | 'incorrect'

// Constants
const basePoints = [
  { x: 200, y: 50 },  // Top
  { x: 350, y: 250 }, // Bottom Right
  { x: 50, y: 250 }   // Bottom Left
];

const center = { x: 200, y: 183 };

// Computed Points based on slider (Linear interpolation)
const points = computed(() => {
  return basePoints.map(p => ({
    x: p.x + (center.x - p.x) * sliderVal.value,
    y: p.y + (center.y - p.y) * sliderVal.value
  }));
});

const polyString = computed(() => {
  return points.value.map(p => `${p.x},${p.y}`).join(' ');
});

const getArcPath = (pt) => {
  // Visual wedge decoration
  return `M ${pt.x + 15} ${pt.y} A 15 15 0 0 1 ${pt.x} ${pt.y - 15}`;
};

const handleSliderChange = () => {
  // Reset question if user goes back
  if (sliderVal.value < 0.8) {
    status.value = 'idle';
    selectedShape.value = null;
  }
};

const handleSelect = (shape) => {
  if (status.value === 'correct') return;
  selectedShape.value = shape;
  status.value = 'idle';
};

const handleConfirm = () => {
  if (!selectedShape.value) return;
  const isCorrect = selectedShape.value === props.step.correctShape;
  status.value = isCorrect ? 'correct' : 'incorrect';
  emit('complete', isCorrect);
};
</script>
