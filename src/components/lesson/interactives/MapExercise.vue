<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🗺️</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Map Challenge</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">{{ title }}</h2>
      <p class="text-sm text-slate-500 mt-1">{{ description }}</p>
    </div>

    <!-- Map Container -->
    <div class="relative w-full rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50/80" style="height: 400px;">
      <!-- Map Image -->
      <img
        :src="image"
        alt="Map"
        class="w-full h-full object-contain"
      />

      <!-- Markers -->
      <div
        v-for="marker in markers"
        :key="marker.id"
        class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
        :style="{ left: marker.x + '%', top: marker.y + '%' }"
        @click="handleMarkerClick(marker)"
      >
        <!-- Marker Pin -->
        <div
          class="relative group"
          :class="[
            selectedMarkerId === marker.id && isCorrect ? 'z-20' : 'z-10',
            showFeedback && selectedMarkerId === marker.id ? 'scale-110' : 'hover:scale-110'
          ]"
        >
          <!-- Pin Icon -->
          <div
            class="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200"
            :class="[
              selectedMarkerId === marker.id
                ? (isCorrect && marker.isCorrect
                    ? 'bg-emerald-500 border-white text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-red-500 border-white text-white shadow-lg shadow-red-500/30')
                : 'bg-white border-violet-400 text-violet-600 shadow-md hover:border-violet-500 hover:shadow-lg'
            ]"
          >
            <svg v-if="selectedMarkerId === marker.id && isCorrect && marker.isCorrect" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
            <svg v-else-if="selectedMarkerId === marker.id && !marker.isCorrect" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <div v-else class="w-3 h-3 bg-violet-500 rounded-full"></div>
          </div>

          <!-- Label Tooltip -->
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {{ marker.label }}
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback & Action -->
    <div class="mt-5 flex flex-col items-center min-h-[72px]">
      <transition name="fade-scale" mode="out-in">
        <div v-if="showFeedback" class="w-full">
          <!-- Feedback message -->
          <div
            class="step-feedback mb-4"
            :class="isCorrect ? 'success' : 'error'"
          >
            {{ isCorrect ? 'Correct! You found the right location. +15 XP' : 'Not quite right. Try another location.' }}
          </div>

          <!-- Action buttons -->
          <div class="flex justify-center">
            <button
              v-if="isCorrect"
              @click="$emit('next')"
              class="step-btn-primary step-btn-success flex items-center gap-2"
            >
              Continue
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
            <button
              v-else-if="attemptCount >= maxAttempts"
              @click="skipExercise"
              class="step-btn-primary flex items-center gap-2"
            >
              Skip & Continue
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-else class="text-slate-400 text-sm font-medium flex items-center gap-2">
          <span class="text-base">📍</span>
          Select a marker on the map to answer
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  image: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Geography Challenge'
  },
  description: {
    type: String,
    default: 'Find the correct location on the map.'
  },
  markers: {
    type: Array,
    required: true,
    // Expected format: [{ id: 1, x: 50, y: 50, label: 'Paris', isCorrect: true }]
    // x and y are percentages (0-100)
  }
});

const emit = defineEmits(['next', 'complete']);

const selectedMarkerId = ref(null);
const showFeedback = ref(false);
const isCorrect = ref(false);
const attemptCount = ref(0);
const maxAttempts = 3;

const handleMarkerClick = (marker) => {
  if (isCorrect.value) return; // Prevent clicking after success

  attemptCount.value++;
  selectedMarkerId.value = marker.id;
  showFeedback.value = true;

  if (marker.isCorrect) {
    isCorrect.value = true;
    emit('complete', true);
  } else {
    isCorrect.value = false;
    // Auto-hide incorrect feedback after a delay to allow retrying
    setTimeout(() => {
      if (!isCorrect.value) { // Only hide if they haven't found the correct one in the meantime (unlikely but safe)
        showFeedback.value = false;
        selectedMarkerId.value = null;
      }
    }, 2000);
  }
};

const skipExercise = () => {
  emit('complete', false);
  emit('next');
};
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
