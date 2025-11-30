<template>
  <div class="w-full max-w-5xl mx-auto">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-slate-900 mb-2">{{ title }}</h2>
      <p class="text-slate-600">{{ description }}</p>
    </div>

    <div class="relative rounded-xl overflow-hidden shadow-lg border-2 border-slate-200 bg-blue-50 aspect-video group">
      
      <img 
        :src="displayImage" 
        alt="Geographic Map" 
        class="relative z-10 w-full h-full object-cover"
        @error="handleImageError"
      />

      <div 
        v-for="marker in markers" 
        :key="marker.id"
        class="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        :style="{ left: marker.x + '%', top: marker.y + '%' }"
        @click="selectMarker(marker)"
      >
        <div class="relative group/marker">
          <div class="absolute -inset-4 bg-white/0 group-hover/marker:bg-white/20 rounded-full transition-colors"></div>

          <div 
            class="relative transition-transform duration-200 transform origin-bottom"
            :class="[
              marker.clicked 
                ? 'scale-110' 
                : 'hover:scale-125 hover:-translate-y-1'
            ]"
          >
            <svg width="30" height="42" viewBox="0 0 384 512" fill="none" class="drop-shadow-md">
              <path 
                d="M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0s192 86 192 192z" 
                :fill="getMarkerColor(marker)" 
              />
              <circle cx="192" cy="192" r="64" fill="white" />
              <g v-if="marker.clicked" transform="translate(142, 142) scale(2)">
                <path v-if="marker.isCorrect" d="M10 15l-5-5 1.41-1.41L10 12.17l7.59-7.59L19 6l-9 9z" fill="#15803d"/>
                <path v-else d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#b91c1c"/>
              </g>
            </svg>
          </div>

          <transition name="fade-slide">
            <div 
              v-if="!marker.clicked"
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-40"
            >
              <div class="bg-white text-slate-800 px-3 py-1 rounded shadow-md border border-slate-200 text-sm font-bold">
                {{ marker.label }}
              </div>
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white"></div>
            </div>
          </transition>
        </div>
      </div>

      <transition name="fade">
        <div 
          v-if="isComplete"
          class="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div class="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center transform scale-110">
            <div class="text-5xl mb-3">🌍</div>
            <h3 class="text-2xl font-bold text-slate-800 mb-1">Correct!</h3>
            <p class="text-slate-600 font-medium">You found {{ correctMarker?.label }}</p>
          </div>
        </div>
      </transition>
    </div>

    <div v-if="attempts > 0 && !isComplete" class="mt-4 p-4 bg-yellow-50 text-yellow-900 rounded-lg border border-yellow-200 flex items-center justify-center gap-3">
      <span class="text-xl">💡</span>
      <p class="font-medium">{{ getHint() }}</p>
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

// --- REAL FLAT MAP SOURCES (Wikimedia Commons - Political Maps) ---
const MAP_REGIONS = {
  asia: {
    keywords: ['tokyo', 'japan', 'china', 'beijing', 'asia', 'india', 'mumbai', 'bangkok', 'thailand', 'korea', 'seoul', 'vietnam', 'singapore', 'malaysia', 'philippines', 'indonesia', 'taiwan', 'hong kong'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Asia_orthographic_Caucasus_Urals_boundary_%28with_borders%29.svg/1024px-Asia_orthographic_Caucasus_Urals_boundary_%28with_borders%29.svg.png' 
  },
  europe: {
    keywords: ['paris', 'france', 'london', 'uk', 'britain', 'germany', 'berlin', 'rome', 'italy', 'europe', 'spain', 'madrid', 'barcelona', 'portugal', 'amsterdam', 'netherlands', 'greece', 'athens', 'norway', 'sweden', 'denmark', 'poland', 'belgium'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Europe_orthographic_Caucasus_Urals_boundary_%28with_borders%29.svg/1024px-Europe_orthographic_Caucasus_Urals_boundary_%28with_borders%29.svg.png'
  },
  northamerica: {
    keywords: ['usa', 'america', 'united states', 'new york', 'california', 'texas', 'chicago', 'canada', 'toronto', 'mexico', 'north america', 'us'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Map_of_USA_with_state_names_2.svg/1024px-Map_of_USA_with_state_names_2.svg.png'
  },
  world: {
    keywords: ['world', 'earth', 'global', 'international'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1200px-World_map_-_low_resolution.svg.png'
  }
};

const DEFAULT_MAP = MAP_REGIONS.world.url;

// State
const attempts = ref(0);
const isComplete = ref(false);
const imageError = ref(false);

// --- SMART REGION DETECTION ---
const detectedRegion = computed(() => {
  const text = (props.title + ' ' + props.description).toLowerCase();
  
  if (MAP_REGIONS.asia.keywords.some(k => text.includes(k))) return 'asia';
  if (MAP_REGIONS.europe.keywords.some(k => text.includes(k))) return 'europe';
  if (MAP_REGIONS.northamerica.keywords.some(k => text.includes(k))) return 'northamerica';
  
  return 'world';
});

const displayImage = computed(() => {
  // If JSON has ugly SVG placeholder or is missing, use our real flat map
  if (!props.image || props.image.startsWith('data:image/svg+xml') || props.image.includes('<svg')) {
    return MAP_REGIONS[detectedRegion.value].url;
  }
  // If loading failed, fallback to real map
  if (imageError.value) return MAP_REGIONS[detectedRegion.value].url;
  
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
  return '#ef4444'; // Standard Red Map Pin
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
    'Check the general region.',
    'Look for country borders.',
    'Think about North, South, East, West.'
  ];
  return hints[Math.min(attempts.value - 1, hints.length - 1)];
};
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active { 
  transition: all 0.2s ease; 
}
.fade-slide-enter-from, .fade-slide-leave-to { 
  opacity: 0; 
  transform: translate(-50%, 5px); 
}

.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.4s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}
</style>
