<template>
  <div class="w-full max-w-5xl mx-auto">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-slate-800 mb-2">{{ title }}</h2>
      <p class="text-slate-600">{{ description }}</p>
    </div>

    <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 aspect-video group">
      <div class="absolute inset-0 bg-slate-900">
        <div class="absolute inset-0 opacity-20 grid-pattern"></div>
      </div>

      <img 
        :src="displayImage" 
        alt="Interactive Map" 
        class="relative z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        @error="handleImageError"
      />

      <div class="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
        <div class="radar-sweep"></div>
      </div>

      <!-- Region Badge -->
      <div class="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/20 text-xs text-white/80 font-semibold">
        📍 {{ currentRegionName }}
      </div>

      <div 
        v-for="marker in markers" 
        :key="marker.id"
        class="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        :style="{ left: marker.x + '%', top: marker.y + '%' }"
        @click="selectMarker(marker)"
      >
        <div class="relative group/marker">
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
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" class="drop-shadow-lg filter">
              <path d="M16 0C7.164 0 0 7.164 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.164 24.836 0 16 0Z" 
                :fill="getMarkerColor(marker)" />
              <circle cx="16" cy="16" r="6" fill="white" fill-opacity="0.9"/>
              <text 
                v-if="marker.clicked"
                x="16" 
                y="21" 
                text-anchor="middle" 
                fill="#333"
                font-weight="900"
                font-size="14"
              >{{ marker.isCorrect ? '✓' : '✕' }}</text>
            </svg>
          </div>

          <transition name="fade-slide">
            <div 
              v-if="!marker.clicked"
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover/marker:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-40"
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

    <div v-if="attempts > 0 && !isComplete" class="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 flex items-center justify-center gap-2 shadow-sm">
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
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  markers: { type: Array, required: true }
});

const emit = defineEmits(['complete', 'next']);

// --- SMART MAP REGION DETECTION SYSTEM ---
const MAP_REGIONS = {
  asia: {
    keywords: ['tokyo', 'japan', 'china', 'beijing', 'asia', 'india', 'mumbai', 'bangkok', 'thailand', 'korea', 'seoul', 'vietnam', 'singapore', 'malaysia', 'philippines', 'indonesia', 'taiwan', 'hong kong'],
    url: 'https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=1920&auto=format&fit=crop', // Asia satellite view
    name: 'Asia'
  },
  europe: {
    keywords: ['paris', 'france', 'london', 'uk', 'britain', 'germany', 'berlin', 'rome', 'italy', 'europe', 'spain', 'madrid', 'barcelona', 'portugal', 'amsterdam', 'netherlands', 'greece', 'athens', 'norway', 'sweden', 'denmark', 'poland', 'belgium'],
    url: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?q=80&w=1920&auto=format&fit=crop', // Europe map
    name: 'Europe'
  },
  northamerica: {
    keywords: ['usa', 'america', 'united states', 'new york', 'california', 'texas', 'chicago', 'canada', 'toronto', 'mexico', 'north america'],
    url: 'https://images.unsplash.com/photo-1547476547-82f7f9999441?q=80&w=1920&auto=format&fit=crop', // North America
    name: 'North America'
  },
  africa: {
    keywords: ['africa', 'egypt', 'cairo', 'south africa', 'kenya', 'nigeria', 'morocco', 'ethiopia'],
    url: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?q=80&w=1920&auto=format&fit=crop', // Africa
    name: 'Africa'
  },
  southamerica: {
    keywords: ['brazil', 'argentina', 'chile', 'peru', 'colombia', 'south america', 'latin america'],
    url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1920&auto=format&fit=crop', // South America
    name: 'South America'
  },
  oceania: {
    keywords: ['australia', 'sydney', 'melbourne', 'new zealand', 'oceania', 'pacific'],
    url: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=1920&auto=format&fit=crop', // Oceania
    name: 'Oceania'
  },
  world: {
    keywords: ['world', 'earth', 'global', 'international'],
    url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1920&auto=format&fit=crop', // World map
    name: 'World'
  }
};

// State
const attempts = ref(0);
const isComplete = ref(false);
const imageError = ref(false);

// --- SMART REGION DETECTION ---
const detectedRegion = computed(() => {
  const text = (props.title + ' ' + props.description).toLowerCase();
  
  // Check each region's keywords
  for (const [regionKey, regionData] of Object.entries(MAP_REGIONS)) {
    if (regionData.keywords.some(keyword => text.includes(keyword))) {
      return regionKey;
    }
  }
  
  // Default to world if no match
  return 'world';
});

const displayImage = computed(() => {
  // 1. If image failed to load, use smart regional fallback
  if (imageError.value) {
    return MAP_REGIONS[detectedRegion.value].url;
  }

  // 2. If JSON provides ugly SVG placeholder or is missing, use smart fallback
  if (!props.image || 
      props.image.startsWith('data:image/svg+xml') || 
      props.image.includes('<svg')) {
    return MAP_REGIONS[detectedRegion.value].url;
  }
  
  // 3. Otherwise, trust the JSON (custom map provided by content creator)
  return props.image;
});

const currentRegionName = computed(() => {
  return MAP_REGIONS[detectedRegion.value].name;
});

// --- EXISTING METHODS ---
const correctMarker = computed(() => props.markers.find(m => m.isCorrect));

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
    }, 2000);
  } else {
    setTimeout(() => {
      marker.clicked = false;
    }, 1500);
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
