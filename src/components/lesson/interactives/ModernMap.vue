<template>
  <div class="w-full max-w-4xl mx-auto">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-slate-800 mb-2">{{ title }}</h2>
      <p class="text-slate-600">{{ description }}</p>
    </div>

    <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 aspect-video">
      <div class="absolute inset-0 bg-slate-900">
        <div class="absolute inset-0 opacity-20 grid-pattern"></div>
      </div>

      <img 
        :src="displayImage" 
        alt="Interactive Map" 
        class="relative z-10 w-full h-full object-cover transition-opacity duration-500"
        @error="handleImageError"
      />

      <div class="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
        <div class="radar-sweep"></div>
      </div>

      <div 
        v-for="marker in markers" 
        :key="marker.id"
        class="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        :style="{ left: marker.x + '%', top: marker.y + '%' }"
        @click="selectMarker(marker)"
      >
        <div class="relative group">
          <div v-if="!marker.clicked" class="absolute inset-0 -m-4">
            <div class="w-12 h-12 rounded-full border-2 border-white/30 animate-ping"></div>
          </div>

          <div 
            class="relative transition-all duration-300 transform"
            :class="[
              marker.clicked 
                ? (marker.isCorrect ? 'scale-125' : 'scale-110 animate-shake') 
                : 'hover:scale-125 hover:-translate-y-1'
            ]"
          >
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
              <path d="M16 0C7.164 0 0 7.164 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.164 24.836 0 16 0Z" 
                :fill="getMarkerColor(marker)" />
              <circle cx="16" cy="16" r="6" fill="white" fill-opacity="0.9"/>
              <text 
                v-if="marker.clicked"
                x="16" 
                y="20" 
                text-anchor="middle" 
                fill="#333"
                font-weight="bold"
                font-size="12"
              >
                {{ marker.isCorrect ? '✓' : '✕' }}
              </text>
            </svg>
          </div>

          <transition name="fade-slide">
            <div 
              v-if="!marker.clicked"
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-40"
            >
              <div class="bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-xl border border-slate-600 text-sm font-semibold">
                {{ marker.label }}
              </div>
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
            </div>
          </transition>
        </div>
      </div>

      <transition name="fade">
        <div 
          v-if="isComplete"
          class="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <div class="bg-white p-8 rounded-3xl shadow-2xl text-center transform scale-110 animate-bounce-slight">
            <div class="text-6xl mb-4">🌍</div>
            <h3 class="text-2xl font-bold text-slate-800 mb-2">Excellent!</h3>
            <p class="text-slate-600">You found {{ correctMarker?.label }}!</p>
          </div>
        </div>
      </transition>
    </div>

    <div v-if="attempts > 0 && !isComplete" class="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 flex items-center justify-center gap-2">
      <span class="text-xl">💡</span>
      <p class="font-medium">
        {{ attempts === 1 ? 'Keep looking! ' : `Attempt ${attempts}. ` }}
        {{ getHint() }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Geography Task' },
  description: { type: String, default: 'Locate the correct place on the map.' },
  image: { type: String, default: '' },
  markers: { type: Array, required: true }
});

const emit = defineEmits(['complete', 'next']);

// State
const attempts = ref(0);
const isComplete = ref(false);
const imageError = ref(false);

// Default high-quality map if none provided or error occurs
const DEFAULT_MAP = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1920&auto=format&fit=crop';

// Computed
const displayImage = computed(() => {
  if (imageError.value || !props.image || props.image.includes('<svg')) {
    return DEFAULT_MAP;
  }
  return props.image;
});

const correctMarker = computed(() => props.markers.find(m => m.isCorrect));

// Methods
const handleImageError = () => {
  imageError.value = true;
};

const getMarkerColor = (marker) => {
  if (marker.clicked) {
    return marker.isCorrect ? '#22c55e' : '#ef4444'; // Green or Red
  }
  return '#6366f1'; // Indigo default
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
    }, 2500);
  } else {
    // Reset wrong marker after delay to allow retry
    setTimeout(() => {
      marker.clicked = false;
    }, 1500);
  }
};

const getHint = () => {
  const hints = [
    'Try looking in a different region.',
    'Remember the climate and geography.',
    'Check the cardinal directions (North, South...).'
  ];
  return hints[Math.min(attempts.value - 1, hints.length - 1)];
};
</script>

<style scoped>
.grid-pattern {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}

.radar-sweep {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150%;
  height: 150%;
  transform: translate(-50%, -50%);
  background: conic-gradient(from 0deg, transparent 0deg, rgba(255, 255, 255, 0.05) 60deg, transparent 120deg);
  animation: radar-spin 8s linear infinite;
}

@keyframes radar-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake { animation: shake 0.4s ease-in-out; }

.animate-bounce-slight {
  animation: bounce-slight 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}
@keyframes bounce-slight {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1.1); opacity: 1; }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translate(-50%, 10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
