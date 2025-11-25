<template>
  <div class="w-full">
    <!-- Map Container -->
    <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
      <!-- Animated Background Grid -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20">
        <div class="absolute inset-0 opacity-50 grid-pattern"></div>
      </div>

      <!-- Map Image -->
      <img 
        :src="image" 
        alt="Interactive Map" 
        class="relative z-10 w-full h-auto"
      />

      <!-- Radar Sweep Effect -->
      <div class="absolute inset-0 z-20 pointer-events-none">
        <div class="radar-sweep"></div>
      </div>

      <!-- Interactive Markers -->
      <div 
        v-for="marker in markers" 
        :key="marker.id"
        class="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        :style="{ left: marker.x + '%', top: marker.y + '%' }"
        @click="selectMarker(marker)"
      >
        <div class="relative group">
          <!-- Ripple Effect -->
          <div v-if="!marker.clicked" class="absolute inset-0 -m-4">
            <div class="w-16 h-16 rounded-full border-2 border-purple-400 animate-ping"></div>
            <div class="absolute inset-0 w-16 h-16 rounded-full border-2 border-purple-400 animate-ping animation-delay-500"></div>
          </div>

          <!-- Marker Pin -->
          <div 
            class="relative transition-all duration-300 transform"
            :class="[
              marker.clicked 
                ? (marker.isCorrect ? 'scale-125' : 'scale-110 animate-shake') 
                : 'hover:scale-110'
            ]"
          >
            <!-- Outer Glow -->
            <div 
              class="absolute inset-0 rounded-full blur-xl"
              :class="[
                marker.clicked
                  ? (marker.isCorrect ? 'bg-green-400' : 'bg-red-400')
                  : 'bg-purple-400'
              ]"
              :style="{ opacity: marker.clicked ? 0.5 : 0.3 }"
            ></div>

            <!-- Pin SVG -->
            <div class="relative">
              <svg width="40" height="48" viewBox="0 0 40 48" class="drop-shadow-2xl">
                <defs>
                  <linearGradient :id="`gradient-${marker.id}`" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" :style="`stop-color:${getMarkerColor(marker, 'light')}`" />
                    <stop offset="100%" :style="`stop-color:${getMarkerColor(marker, 'dark')}`" />
                  </linearGradient>
                </defs>
                <path 
                  d="M20 0C8.95 0 0 8.95 0 20C0 25 2 29.5 5 33L20 48L35 33C38 29.5 40 25 40 20C40 8.95 31.05 0 20 0Z" 
                  :fill="`url(#gradient-${marker.id})`"
                />
                <circle cx="20" cy="20" r="8" fill="white" opacity="0.9"/>
                <text 
                  v-if="marker.clicked"
                  x="20" 
                  y="25" 
                  text-anchor="middle" 
                  fill="currentColor"
                  :class="marker.isCorrect ? 'text-green-600' : 'text-red-600'"
                  font-weight="bold"
                  font-size="16"
                >
                  {{ marker.isCorrect ? '✓' : '✗' }}
                </text>
                <circle 
                  v-else
                  cx="20" 
                  cy="20" 
                  r="4" 
                  :fill="getMarkerColor(marker, 'dark')"
                />
              </svg>
            </div>
          </div>

          <!-- Hover Label -->
          <transition name="fade-slide">
            <div 
              v-if="!marker.clicked"
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap"
            >
              <div class="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-2xl border border-white/20">
                <p class="font-bold text-sm">{{ marker.label }}</p>
                <p class="text-xs text-white/70">Click to select</p>
              </div>
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/90"></div>
            </div>
          </transition>

          <!-- Result Label -->
          <transition name="bounce">
            <div 
              v-if="marker.clicked"
              class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap"
            >
              <div 
                class="px-4 py-2 rounded-lg shadow-2xl border backdrop-blur-md font-bold"
                :class="marker.isCorrect 
                  ? 'bg-green-500/20 border-green-400/50 text-green-300'
                  : 'bg-red-500/20 border-red-400/50 text-red-300'"
              >
                {{ marker.isCorrect ? '🎯 Correct!' : '❌ Wrong' }}
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Success Overlay -->
      <transition name="fade">
        <div 
          v-if="isComplete"
          class="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          <div class="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl p-8 rounded-2xl border border-green-400/50 text-center transform scale-110">
            <div class="text-6xl mb-4">🌟</div>
            <h3 class="text-2xl font-bold text-green-300 mb-2">Perfect!</h3>
            <p class="text-green-200">You found {{ correctMarker?.label }}!</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- Hint Section -->
    <div v-if="attempts > 0 && !isComplete" class="mt-4 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/20">
      <p class="text-white/70 text-sm">
        <span class="text-yellow-400">💡</span>
        {{ attempts === 1 ? 'First try! ' : `Attempt ${attempts}. ` }}
        {{ getHint() }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: String,
  description: String,
  image: {
    type: String,
    required: true
  },
  markers: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['complete', 'next']);

// State
const attempts = ref(0);
const isComplete = ref(false);

// Computed
const correctMarker = computed(() => {
  return props.markers.find(m => m.isCorrect);
});

// Methods
const getMarkerColor = (marker, shade) => {
  if (marker.clicked) {
    if (marker.isCorrect) {
      return shade === 'light' ? '#10b981' : '#059669';
    } else {
      return shade === 'light' ? '#ef4444' : '#dc2626';
    }
  }
  return shade === 'light' ? '#a855f7' : '#7c3aed';
};

const selectMarker = (marker) => {
  if (isComplete.value || marker.clicked) return;
  
  attempts.value++;
  marker.clicked = true;
  
  if (marker.isCorrect) {
    isComplete.value = true;
    setTimeout(() => {
      emit('complete', true);
      emit('next');
    }, 2000);
  } else {
    // Reset wrong marker after delay
    setTimeout(() => {
      marker.clicked = false;
    }, 2000);
  }
};

const getHint = () => {
  const hints = [
    'Look for geographical features mentioned in the description.',
    'Consider the climate and region.',
    'Think about neighboring locations.',
    'Check the cardinal directions.'
  ];
  return hints[Math.min(attempts.value - 1, hints.length - 1)];
};
</script>

<style scoped>
.grid-pattern {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

@keyframes radar-sweep {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.radar-sweep {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  transform: translate(-50%, -50%);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(168, 85, 247, 0.1) 30deg,
    transparent 90deg
  );
  animation: radar-sweep 4s linear infinite;
  pointer-events: none;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}

@keyframes bounce-in {
  0% {
    transform: translateX(-50%) scale(0.5);
    opacity: 0;
  }
  60% {
    transform: translateX(-50%) scale(1.1);
  }
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
}
</style>
