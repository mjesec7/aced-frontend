<template>
  <div class="map-wrapper">
    <!-- Map Container with Better Background -->
    <div class="map-card">
      <!-- Header with modern styling -->
      <div class="map-header">
        <div class="header-badge">
          <span class="badge-icon">🗺️</span>
          <span class="badge-text">Geography Challenge</span>
        </div>
        <h2 class="map-title">{{ title }}</h2>
        <p class="map-description">{{ description }}</p>
      </div>

      <!-- Map Container with realistic styling -->
      <div class="map-container" ref="mapContainer">
        <!-- Grid background for geographic feel -->
        <div class="map-grid"></div>
        
        <!-- Map content area -->
        <div class="map-content">
          <!-- Decorative map elements -->
          <div class="map-decoration">
            <!-- Latitude/Longitude lines -->
            <div class="lat-lines">
              <div v-for="i in 8" :key="'lat-' + i" class="lat-line" 
                   :style="{ top: (i * 12.5) + '%' }"></div>
            </div>
            <div class="lon-lines">
              <div v-for="i in 12" :key="'lon-' + i" class="lon-line" 
                   :style="{ left: (i * 8.33) + '%' }"></div>
            </div>
          </div>

          <!-- Continents/Region visualization -->
          <div class="region-display">
            <svg viewBox="0 0 800 500" class="region-svg">
              <!-- Simple continent shapes for visual context -->
              <defs>
                <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.1" />
                  <stop offset="100%" style="stop-color:#059669;stop-opacity:0.15" />
                </linearGradient>
              </defs>
              
              <!-- Asia region outline (simplified) -->
              <path d="M 200,100 L 700,100 L 700,400 L 500,450 L 200,400 Z" 
                    fill="url(#landGradient)" 
                    stroke="#10b981" 
                    stroke-width="2" 
                    stroke-dasharray="10,5"
                    opacity="0.6"/>
              
              <!-- Decorative elements -->
              <text x="450" y="260" font-size="48" fill="#94a3b8" opacity="0.3" 
                    text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">
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
            <!-- Marker pin with modern design -->
            <div class="marker-pin">
              <div class="pin-head">
                <!-- Status icon -->
                <svg v-if="selectedMarkerId === marker.id && showFeedback && marker.isCorrect" 
                     class="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
                <svg v-else-if="selectedMarkerId === marker.id && showFeedback && !marker.isCorrect" 
                     class="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
              <div class="compass-arrow compass-arrow-n">▲</div>
              <div class="compass-arrow compass-arrow-e">▶</div>
              <div class="compass-arrow compass-arrow-s">▼</div>
              <div class="compass-arrow compass-arrow-w">◀</div>
            </div>
          </div>
        </div>

        <!-- Scale indicator -->
        <div class="scale-indicator">
          <div class="scale-line"></div>
          <span class="scale-text">~ 1000 km</span>
        </div>
      </div>

      <!-- Feedback Section -->
      <div class="feedback-section">
        <transition name="slide-up" mode="out-in">
          <div v-if="showFeedback" 
               class="feedback" 
               :class="{ 'feedback-success': isCorrect, 'feedback-error': !isCorrect }">
            <div class="feedback-icon-wrapper">
              <span class="feedback-emoji">{{ isCorrect ? '🎯' : '🧭' }}</span>
            </div>
            <div class="feedback-content">
              <h3 class="feedback-title">
                {{ isCorrect ? 'Perfect! You found it!' : 'Not quite the right location' }}
              </h3>
              <p class="feedback-message">
                {{ isCorrect ? 'Excellent geographic knowledge! +15 XP' : 'Try selecting another marker on the map.' }}
              </p>
            </div>
          </div>

          <div v-else class="feedback-idle">
            <span class="feedback-idle-icon">📍</span>
            <span class="feedback-idle-text">Click on a location marker to make your selection</span>
          </div>
        </transition>

        <!-- Action Buttons -->
        <div v-if="showFeedback" class="action-buttons">
          <button
            v-if="isCorrect"
            @click="handleContinue"
            class="action-button action-button-success"
          >
            <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            Continue
          </button>
          <button
            v-else-if="attemptCount >= maxAttempts"
            @click="skipExercise"
            class="action-button action-button-skip"
          >
            <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Skip & Continue
          </button>
        </div>
      </div>
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
.map-wrapper {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.map-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

/* Header */
.map-header {
  padding: 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 2px solid #e2e8f0;
  text-align: center;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border-radius: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.badge-icon {
  font-size: 20px;
}

.badge-text {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.map-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.map-description {
  font-size: 15px;
  color: #64748b;
  margin: 0;
}

/* Map Container */
.map-container {
  position: relative;
  width: 100%;
  height: 550px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  overflow: hidden;
}

.map-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.map-content {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Map decoration */
.map-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.lat-lines,
.lon-lines {
  position: absolute;
  inset: 0;
}

.lat-line,
.lon-line {
  position: absolute;
  background: rgba(16, 185, 129, 0.15);
}

.lat-line {
  width: 100%;
  height: 1px;
  left: 0;
}

.lon-line {
  width: 1px;
  height: 100%;
  top: 0;
}

/* Region display */
.region-display {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.region-svg {
  width: 100%;
  height: 100%;
}

/* LocationMarkers */
.marker {
  position: absolute;
  transform: translate(-50%, -100%);
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.marker:hover {
  z-index: 20;
  transform: translate(-50%, -100%) scale(1.15);
}

.marker-pulse {
  animation: marker-pulse 0.6s ease-out;
}

@keyframes marker-pulse {
  0%, 100% {
    transform: translate(-50%, -100%) scale(1);
  }
  50% {
    transform: translate(-50%, -100%) scale(1.2);
  }
}

/* Marker pin */
.marker-pin {
  position: relative;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.pin-head {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  transition: all 0.3s ease;
}

.marker:hover .pin-head {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
}

.marker-correct .pin-head {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.marker-incorrect .pin-head {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.pin-head > * {
  transform: rotate(45deg);
}

.pin-dot {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
}

.pin-icon {
  width: 26px;
  height: 26px;
  color: white;
  stroke-width: 3;
}

.pin-spike {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 12px solid #4f46e5;
}

.marker-correct .pin-spike {
  border-top-color: #059669;
}

.marker-incorrect .pin-spike {
  border-top-color: #dc2626;
}

/* Marker label */
.marker-label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 12px;
  padding: 8px 14px;
  background: #1e293b;
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.marker-label::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1e293b;
}

.marker:hover .marker-label,
.marker-selected .marker-label {
  opacity: 1;
}

/* Click ripple */
.click-ripple {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.4);
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

/* Compass */
.compass {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.compass-rose {
  position: relative;
  width: 50px;
  height: 50px;
}

.compass-n {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 700;
  color: #ef4444;
}

.compass-arrows {
  position: relative;
  width: 100%;
  height: 100%;
}

.compass-arrow {
  position: absolute;
  font-size: 10px;
  color: #94a3b8;
}

.compass-arrow-n {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.compass-arrow-e {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.compass-arrow-s {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.compass-arrow-w {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

/* Scale indicator */
.scale-indicator {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.scale-line {
  width: 80px;
  height: 3px;
  background: linear-gradient(to right, #1e293b 0%, #1e293b 50%, transparent 50%);
  background-size: 20px 100%;
  margin-bottom: 4px;
}

.scale-text {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

/* Feedback Section */
.feedback-section {
  padding: 28px 32px;
  background: #f8fafc;
  border-top: 2px solid #e2e8f0;
}

.feedback {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 20px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #10b981;
}

.feedback-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #ef4444;
}

.feedback-icon-wrapper {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.feedback-emoji {
  font-size: 32px;
}

.feedback-content {
  flex: 1;
}

.feedback-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 6px 0;
}

.feedback-success .feedback-title {
  color: #065f46;
}

.feedback-error .feedback-title {
  color: #991b1b;
}

.feedback-message {
  font-size: 15px;
  margin: 0;
  line-height: 1.5;
}

.feedback-success .feedback-message {
  color: #047857;
}

.feedback-error .feedback-message {
  color: #b91c1c;
}

/* Idle state */
.feedback-idle {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: white;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.feedback-idle-icon {
  font-size: 24px;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: 12px;
}

.action-button {
  flex: 1;
  padding: 16px 28px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-button-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.action-button-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.action-button-skip {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.action-button-skip:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.button-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2.5;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive */
@media (max-width: 768px) {
  .map-wrapper {
    padding: 12px;
  }

  .map-header {
    padding: 24px 20px;
  }

  .map-title {
    font-size: 22px;
  }

  .map-container {
    height: 450px;
  }

  .pin-head {
    width: 38px;
    height: 38px;
  }

  .compass {
    width: 50px;
    height: 50px;
    top: 12px;
    right: 12px;
  }

  .compass-rose {
    width: 40px;
    height: 40px;
  }

  .scale-indicator {
    bottom: 12px;
    left: 12px;
  }

  .feedback-section {
    padding: 20px 16px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>