<template>
  <div class="w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
    <div class="p-6 md:p-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-2">{{ title }}</h2>
        <p class="text-slate-600">{{ description }}</p>
      </div>

      <!-- Map Container -->
      <div class="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-slate-200">
        <!-- Map Image -->
        <img 
          :src="image" 
          alt="Map" 
          class="w-full h-full object-cover"
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
              class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg border-2 transition-colors"
              :class="[
                selectedMarkerId === marker.id
                  ? (isCorrect && marker.isCorrect ? 'bg-green-500 border-white text-white' : 'bg-red-500 border-white text-white')
                  : 'bg-white border-purple-500 text-purple-600'
              ]"
            >
              <svg v-if="selectedMarkerId === marker.id && isCorrect && marker.isCorrect" class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
              <svg v-else-if="selectedMarkerId === marker.id && !marker.isCorrect" class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <div v-else class="w-3 h-3 md:w-4 md:h-4 bg-purple-600 rounded-full"></div>
            </div>

            <!-- Label Tooltip -->
            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {{ marker.label }}
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback & Action -->
      <div class="mt-8 flex flex-col items-center min-h-[100px]">
        <transition name="fade-scale" mode="out-in">
          <div v-if="showFeedback" class="text-center w-full">
            <div 
              class="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border-2 shadow-sm mb-4"
              :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
            >
              <div class="p-2 rounded-full" :class="isCorrect ? 'bg-green-100' : 'bg-red-100'">
                <span class="text-2xl">{{ isCorrect ? '🎉' : '🤔' }}</span>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-lg" :class="isCorrect ? 'text-green-800' : 'text-red-800'">
                  {{ isCorrect ? 'Correct!' : 'Not quite.' }}
                </h3>
                <p class="text-sm" :class="isCorrect ? 'text-green-700' : 'text-red-700'">
                  {{ isCorrect ? '+15 XP' : 'Try looking for another location.' }}
                </p>
              </div>
            </div>

            <div v-if="isCorrect">
              <button
                @click="$emit('next')"
                class="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all transform active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
              >
                Continue <span class="text-xl">→</span>
              </button>
            </div>
          </div>
          <div v-else class="text-slate-400 text-sm font-medium">
            Select a marker on the map to answer
          </div>
        </transition>
      </div>
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

const handleMarkerClick = (marker) => {
  if (isCorrect.value) return; // Prevent clicking after success

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
</script>

<style scoped>
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
