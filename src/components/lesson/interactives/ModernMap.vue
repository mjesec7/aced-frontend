<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🗺️</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Geography Challenge</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">{{ title }}</h2>
      <p class="text-sm text-slate-500 mt-1">{{ description }}</p>
    </div>

    <!-- Map Container -->
    <div
      class="map-container relative w-full rounded-xl overflow-hidden border border-slate-200/60"
      ref="mapContainer"
    >
      <!-- Grid background -->
      <div class="map-grid"></div>

      <!-- Map content area -->
      <div class="relative w-full h-full">
        <!-- Decorative lat/lon lines -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute inset-0">
            <div
              v-for="i in 8"
              :key="'lat-' + i"
              class="lat-line"
              :style="{ top: (i * 12.5) + '%' }"
            ></div>
          </div>
          <div class="absolute inset-0">
            <div
              v-for="i in 12"
              :key="'lon-' + i"
              class="lon-line"
              :style="{ left: (i * 8.33) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Region SVG decoration -->
        <div class="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 800 500" class="w-full h-full">
            <defs>
              <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.05" />
                <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0.08" />
              </linearGradient>
            </defs>
            <path
              d="M 200,100 L 700,100 L 700,400 L 500,450 L 200,400 Z"
              fill="url(#landGradient)"
              stroke="#8b5cf6"
              stroke-width="1.5"
              stroke-dasharray="8,4"
              opacity="0.4"
            />
            <text
              x="450" y="260"
              font-size="48"
              fill="#94a3b8"
              opacity="0.15"
              text-anchor="middle"
              font-family="Inter, Arial, sans-serif"
              font-weight="bold"
            >
              ASIA
            </text>
          </svg>
        </div>

        <!-- Location Markers -->
        <div
          v-for="marker in markers"
          :key="marker.id"
          class="marker"
          :class="{
            'marker-selected': selectedMarkerId === marker.id,
            'marker-correct': selectedMarkerId === marker.id && marker.isCorrect && showFeedback,
            'marker-incorrect': selectedMarkerId === marker.id && !marker.isCorrect && showFeedback,
            'marker-pulse': selectedMarkerId === marker.id
          }"
          :style="{ left: marker.x + '%', top: marker.y + '%' }"
          @click="handleMarkerClick(marker)"
        >
          <!-- Marker pin -->
          <div class="marker-pin">
            <div class="pin-head">
              <svg
                v-if="selectedMarkerId === marker.id && showFeedback && marker.isCorrect"
                class="pin-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
              <svg
                v-else-if="selectedMarkerId === marker.id && showFeedback && !marker.isCorrect"
                class="pin-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <div v-else class="pin-dot"></div>
            </div>
            <div class="pin-spike"></div>
          </div>

          <!-- Location label -->
          <div class="marker-label">
            {{ marker.label }}
          </div>
        </div>

        <!-- Click ripple effect -->
        <div
          v-if="ripple.show"
          class="click-ripple"
          :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
        ></div>
      </div>

      <!-- Compass rose -->
      <div class="compass">
        <div class="compass-rose">
          <div class="compass-n">N</div>
          <div class="compass-arrows">
            <div class="compass-arrow compass-arrow-n">&#9650;</div>
            <div class="compass-arrow compass-arrow-e">&#9654;</div>
            <div class="compass-arrow compass-arrow-s">&#9660;</div>
            <div class="compass-arrow compass-arrow-w">&#9664;</div>
          </div>
        </div>
      </div>

      <!-- Scale indicator -->
      <div class="scale-indicator">
        <div class="scale-line"></div>
        <span class="text-xs font-semibold text-slate-500">~ 1000 km</span>
      </div>
    </div>

    <!-- Feedback Section -->
    <div class="mt-5">
      <transition name="slide-up" mode="out-in">
        <div v-if="showFeedback" class="w-full">
          <!-- Feedback message -->
          <div
            class="step-feedback mb-4"
            :class="isCorrect ? 'success' : 'error'"
          >
            {{ isCorrect ? 'Perfect! You found the right location. +15 XP' : 'Not quite the right location. Try another marker.' }}
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-center">
            <button
              v-if="isCorrect"
              @click="handleContinue"
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

        <div v-else class="flex items-center justify-center gap-2.5 py-4 px-5 bg-slate-50/80 rounded-xl border border-dashed border-slate-200/80 text-slate-400 text-sm font-medium">
          <span class="text-base">📍</span>
          <span>Click on a location marker to make your selection</span>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  image: String,
  title: {
    type: String,
    default: 'Find the Location'
  },
  description: {
    type: String,
    default: 'Select the correct location marker on the map'
  },
  markers: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['next', 'complete']);

// State
const selectedMarkerId = ref(null);
const showFeedback = ref(false);
const isCorrect = ref(false);
const attemptCount = ref(0);
const maxAttempts = 5;
const mapContainer = ref(null);
const ripple = ref({ show: false, x: 0, y: 0 });

// Methods
const handleMarkerClick = (marker) => {
  if (isCorrect.value) return;

  // Show ripple effect
  if (mapContainer.value) {
    const rect = mapContainer.value.getBoundingClientRect();
    const x = (marker.x / 100) * rect.width;
    const y = (marker.y / 100) * rect.height;

    ripple.value = { show: true, x, y };
    setTimeout(() => {
      ripple.value.show = false;
    }, 600);
  }

  attemptCount.value++;
  selectedMarkerId.value = marker.id;
  showFeedback.value = true;

  if (marker.isCorrect) {
    isCorrect.value = true;
    emit('complete', true);
  } else {
    isCorrect.value = false;
    emit('complete', false);
    // Auto-hide incorrect feedback after delay
    setTimeout(() => {
      if (!isCorrect.value) {
        showFeedback.value = false;
        selectedMarkerId.value = null;
      }
    }, 2500);
  }
};

const handleContinue = () => {
  emit('next');
};

const skipExercise = () => {
  emit('complete', false);
  emit('next');
};
</script>

<style scoped>
/* ================================ */
/* MAP CONTAINER                    */
/* ================================ */

.map-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: linear-gradient(135deg, #faf5ff 0%, #f1f5f9 50%, #eff6ff 100%);
}

@media (max-width: 768px) {
  .map-container {
    height: 400px;
  }
}

/* Grid overlay */
.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

/* Latitude & Longitude lines */
.lat-line {
  position: absolute;
  width: 100%;
  height: 1px;
  left: 0;
  background: rgba(139, 92, 246, 0.08);
}

.lon-line {
  position: absolute;
  width: 1px;
  height: 100%;
  top: 0;
  background: rgba(139, 92, 246, 0.08);
}

/* ================================ */
/* MARKERS                          */
/* ================================ */

.marker {
  position: absolute;
  transform: translate(-50%, -100%);
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.marker:hover {
  z-index: 20;
  transform: translate(-50%, -100%) scale(1.12);
}

.marker-pulse {
  animation: marker-pulse 0.5s ease-out;
}

@keyframes marker-pulse {
  0%, 100% { transform: translate(-50%, -100%) scale(1); }
  50% { transform: translate(-50%, -100%) scale(1.18); }
}

/* Pin design */
.marker-pin {
  position: relative;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.1));
}

.pin-head {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: 2.5px solid white;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(139, 92, 246, 0.3);
  transition: all 0.25s ease;
}

.marker:hover .pin-head {
  box-shadow: 0 5px 16px rgba(139, 92, 246, 0.45);
}

.marker-correct .pin-head {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.35);
}

.marker-incorrect .pin-head {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 3px 10px rgba(239, 68, 68, 0.35);
}

.pin-head > * {
  transform: rotate(45deg);
}

.pin-dot {
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
}

.pin-icon {
  width: 22px;
  height: 22px;
  color: white;
  stroke-width: 3;
}

.pin-spike {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 10px solid #7c3aed;
}

.marker-correct .pin-spike {
  border-top-color: #059669;
}

.marker-incorrect .pin-spike {
  border-top-color: #dc2626;
}

/* Marker label tooltip */
.marker-label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  padding: 6px 12px;
  background: #1e293b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.marker-label::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1e293b;
}

.marker:hover .marker-label,
.marker-selected .marker-label {
  opacity: 1;
}

/* ================================ */
/* CLICK RIPPLE                     */
/* ================================ */

.click-ripple {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.3);
  transform: translate(-50%, -50%);
  animation: ripple-effect 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-effect {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(3);
  }
}

/* ================================ */
/* COMPASS                          */
/* ================================ */

.compass {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 52px;
  height: 52px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.compass-rose {
  position: relative;
  width: 42px;
  height: 42px;
}

.compass-n {
  position: absolute;
  top: 1px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 700;
  color: #7c3aed;
}

.compass-arrows {
  position: relative;
  width: 100%;
  height: 100%;
}

.compass-arrow {
  position: absolute;
  font-size: 9px;
  color: #cbd5e1;
}

.compass-arrow-n {
  top: 7px;
  left: 50%;
  transform: translateX(-50%);
}

.compass-arrow-e {
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
}

.compass-arrow-s {
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
}

.compass-arrow-w {
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
}

/* ================================ */
/* SCALE INDICATOR                  */
/* ================================ */

.scale-indicator {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: white;
  padding: 6px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.6);
  z-index: 5;
}

.scale-line {
  width: 70px;
  height: 2px;
  background: linear-gradient(to right, #475569 0%, #475569 50%, transparent 50%);
  background-size: 18px 100%;
  margin-bottom: 3px;
}

/* ================================ */
/* TRANSITIONS                      */
/* ================================ */

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

/* ================================ */
/* RESPONSIVE                       */
/* ================================ */

@media (max-width: 768px) {
  .pin-head {
    width: 34px;
    height: 34px;
  }

  .compass {
    width: 44px;
    height: 44px;
    top: 10px;
    right: 10px;
  }

  .compass-rose {
    width: 34px;
    height: 34px;
  }

  .scale-indicator {
    bottom: 10px;
    left: 10px;
  }
}
</style>
