<template>
  <div class="w-full max-w-6xl mx-auto perspective-1000">
    
    <div class="relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 group transition-all duration-500 hover:shadow-cyan-900/20 hover:border-cyan-500/30">
      
      <div class="absolute top-0 left-0 right-0 z-40 p-6 flex justify-between items-start bg-gradient-to-b from-slate-900/90 to-transparent pointer-events-none">
        <div>
          <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1 tracking-tight">
            {{ title }}
          </h2>
          <p class="text-cyan-100/70 text-sm font-medium tracking-wide border-l-2 border-cyan-500 pl-3">
            {{ description }}
          </p>
        </div>
        <div class="flex items-center gap-2 px-3 py-1 bg-cyan-950/50 border border-cyan-500/30 rounded-full backdrop-blur-md">
          <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
          <span class="text-xs font-mono text-cyan-300 font-bold tracking-wider">LIVE FEED</span>
        </div>
      </div>

      <div class="relative w-full aspect-video bg-slate-950 overflow-hidden">
        
        <div class="absolute inset-0 z-10 opacity-20 pointer-events-none" 
             style="background-image: linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px); background-size: 40px 40px;">
        </div>

        <div class="absolute inset-0 z-20 pointer-events-none bg-radial-gradient"></div>

        <img 
          :src="displayImage" 
          alt="Holographic Map" 
          class="relative z-0 w-full h-full object-contain p-8 md:p-12 transition-transform duration-700 group-hover:scale-105 opacity-80"
          style="filter: invert(1) hue-rotate(180deg) brightness(1.5) contrast(1.2) drop-shadow(0 0 15px rgba(34,211,238,0.2));"
          @error="handleImageError"
        />

        <div class="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <div class="w-full h-[200%] absolute top-[-50%] bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-scanline"></div>
        </div>

        <div 
          v-for="marker in markers" 
          :key="marker.id"
          class="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group/marker"
          :style="{ left: marker.x + '%', top: marker.y + '%' }"
          @click="selectMarker(marker)"
        >
          <div class="relative w-16 h-16 flex items-center justify-center">
            
            <div 
              class="absolute inset-0 border border-dashed rounded-full transition-all duration-300"
              :class="getMarkerClasses(marker, 'ring')"
            ></div>

            <div 
              class="absolute w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] transition-all duration-300"
              :class="getMarkerClasses(marker, 'core')"
            ></div>

            <div v-if="!marker.clicked" class="absolute inset-0 border rounded-full animate-ping opacity-20 border-cyan-400"></div>

            <transition name="fade-slide">
              <div 
                v-if="!marker.clicked"
                class="absolute bottom-full mb-2 px-3 py-1 bg-slate-900/90 border border-cyan-500/30 text-cyan-100 text-xs font-mono rounded backdrop-blur-md opacity-0 group-hover/marker:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              >
                {{ marker.label }}
                <div class="absolute bottom-0 left-0 w-1 h-1 bg-cyan-500"></div>
                <div class="absolute top-0 right-0 w-1 h-1 bg-cyan-500"></div>
              </div>
            </transition>

            <transition name="pop-in">
              <div v-if="marker.clicked" class="absolute top-full mt-2 whitespace-nowrap z-50">
                <div 
                  class="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border shadow-xl"
                  :class="marker.isCorrect 
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-400'"
                >
                  <span class="text-lg">{{ marker.isCorrect ? '✓' : '✕' }}</span>
                  <span class="font-bold font-mono">{{ marker.isCorrect ? 'TARGET ACQUIRED' : 'INVALID TARGET' }}</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div class="absolute bottom-0 inset-x-0 p-4 z-30 pointer-events-none flex justify-between items-end bg-gradient-to-t from-slate-900 to-transparent">
        
        <div class="pointer-events-auto">
          <transition name="slide-up">
            <div v-if="attempts > 0 && !isComplete" class="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border border-yellow-500/30 rounded-xl backdrop-blur-md shadow-lg max-w-md">
              <div class="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <p class="text-[10px] uppercase text-yellow-500/70 font-bold tracking-wider mb-0.5">Tactical Assist</p>
                <p class="text-sm text-yellow-100 font-medium">{{ getHint() }}</p>
              </div>
            </div>
          </transition>
        </div>

        <div class="text-right hidden md:block">
          <div class="text-[10px] text-cyan-500/50 font-mono">LAT: 34.0522 N</div>
          <div class="text-[10px] text-cyan-500/50 font-mono">LNG: 118.2437 W</div>
        </div>
      </div>

      <transition name="fade">
        <div v-if="isComplete" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div class="relative bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center max-w-sm mx-4 transform animate-float">
            <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg"></div>
            <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br-lg"></div>
            
            <div class="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-4xl animate-bounce-slight">
              🌍
            </div>
            <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">Mission Accomplished</h3>
            <p class="text-slate-400 mb-6">Location identified successfully.</p>
            <div class="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full"></div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import localWorldMap from '@/assets/icons/world.svg';

const props = defineProps({
  title: { type: String, default: 'Geography' },
  description: { type: String, default: 'Select the correct region.' },
  image: { type: String, default: '' },
  markers: { type: Array, required: true }
});

const emit = defineEmits(['complete', 'next']);

const attempts = ref(0);
const isComplete = ref(false);
const imageError = ref(false);

// Fallback logic
const displayImage = computed(() => {
  if (imageError.value) return localWorldMap;
  if (!props.image || props.image.startsWith('data:image/svg+xml') || props.image.includes('<svg')) {
    return localWorldMap;
  }
  return props.image;
});

const handleImageError = () => { imageError.value = true; };

// Dynamic styling for markers
const getMarkerClasses = (marker, part) => {
  if (part === 'ring') {
    if (marker.clicked) {
      return marker.isCorrect 
        ? 'border-emerald-500 w-full h-full animate-spin-slow' 
        : 'border-rose-500 w-full h-full';
    }
    return 'border-cyan-500/50 w-full h-full animate-spin-slow group-hover/marker:border-cyan-400';
  }
  if (part === 'core') {
    if (marker.clicked) {
      return marker.isCorrect 
        ? 'bg-emerald-400 text-emerald-400' 
        : 'bg-rose-500 text-rose-500';
    }
    return 'bg-cyan-400 text-cyan-400 group-hover/marker:scale-125';
  }
};

const selectMarker = (marker) => {
  if (isComplete.value || marker.clicked) return;
  attempts.value++;
  marker.clicked = true;
  
  if (marker.isCorrect) {
    isComplete.value = true;
    setTimeout(() => { emit('complete', true); emit('next'); }, 2500);
  } else {
    // Reset incorrect marker after delay
    setTimeout(() => { marker.clicked = false; }, 1500);
  }
};

const getHint = () => {
  const hints = [
    'Analyze sector geography.',
    'Check northern/southern hemisphere.',
    'Scan for border outlines.'
  ];
  return hints[Math.min(attempts.value - 1, hints.length - 1)];
};

const correctMarker = computed(() => props.markers.find(m => m.isCorrect));
</script>

<style scoped>
/* Custom Gradients & Animations */
.bg-radial-gradient {
  background: radial-gradient(circle at center, transparent 30%, rgba(2, 6, 23, 0.8) 100%);
}

@keyframes scanline {
  0% { transform: translateY(-50%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(0%); opacity: 0; }
}
.animate-scanline {
  animation: scanline 4s linear infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-bounce-slight {
  animation: bounce-slight 1s ease-in-out;
}
@keyframes bounce-slight {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(10px); }

.pop-in-enter-active { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes pop {
  0% { opacity: 0; transform: scale(0.5) translateY(-10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: all 0.4s ease-out; }
.slide-up-enter-from { opacity: 0; transform: translateY(20px); }
</style>
