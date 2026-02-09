<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">📐</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Geometry</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">{{ getLocalizedText(step.prompt) }}</h2>
    </div>

    <!-- SVG Canvas -->
    <div class="geometry-canvas mb-4">
      <svg viewBox="0 0 400 300" class="w-full h-auto">
        <!-- Guide Rays -->
        <line
          v-for="(pt, i) in points"
          :key="`ray-${i}`"
          :x1="center.x"
          :y1="center.y"
          :x2="pt.x"
          :y2="pt.y"
          stroke="#e2e8f0"
          stroke-width="2"
          stroke-dasharray="4"
        />

        <!-- Main Triangle -->
        <polygon
          :points="polyString"
          fill="rgba(124, 58, 237, 0.08)"
          stroke="#7c3aed"
          stroke-width="3"
        />

        <!-- Vertices & Exterior Angles -->
        <g v-for="(pt, i) in points" :key="`ext-${i}`">
          <circle :cx="pt.x" :cy="pt.y" r="4" fill="#7c3aed" />
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
    <div class="bg-slate-50/80 rounded-xl border border-slate-200/60 p-4 mb-4">
      <div class="flex items-center gap-4">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Large</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model.number="sliderVal"
          @input="handleSliderChange"
          class="step-slider flex-1"
        />
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Point</span>
      </div>
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
      <div v-if="sliderVal > 0.5" class="overflow-hidden">
        <div class="bg-white rounded-xl border border-slate-200/60 p-4 mb-4">
          <p class="text-sm font-semibold text-slate-800 mb-3">
            What shape do the exterior angles form?
          </p>
          <div class="flex gap-2.5 flex-wrap mb-3">
            <button
              v-for="opt in step.shapes"
              :key="opt"
              @click="handleSelect(opt)"
              :disabled="status === 'correct'"
              class="option-card flex-1 min-w-[80px] text-center text-sm"
              :class="{
                'selected': selectedShape === opt,
              }"
            >
              {{ opt }}
            </button>
          </div>

          <button
            v-if="selectedShape"
            @click="handleConfirm"
            :disabled="status === 'correct'"
            class="step-btn-primary w-full"
            :class="{
              'step-btn-success': status === 'correct',
              'step-btn-error': status === 'incorrect'
            }"
          >
            {{ status === 'correct' ? 'Correct!' : status === 'incorrect' ? 'Incorrect, look closer!' : 'Confirm' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getLocalizedText } from '@/composables/useLanguage';

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
