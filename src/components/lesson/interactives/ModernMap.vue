<template>
  <div class="map-wrapper">
    <!-- Header -->
    <div class="map-header">
      <h2 class="map-title">{{ title }}</h2>
      <p class="map-description">{{ description }}</p>
    </div>

    <!-- Map Container -->
    <div class="map-container" ref="mapContainer">
      <!-- Map Image -->
      <img 
        :src="displayImage" 
        alt="Map" 
        class="map-image"
        @error="handleImageError"
        @load="handleImageLoad"
      />

      <!-- Markers -->
      <div 
        v-for="marker in markers" 
        :key="marker.id"
        class="marker"
        :class="{ 
          'marker-selected': selectedMarkerId === marker.id,
          'marker-correct': selectedMarkerId === marker.id && marker.isCorrect && showFeedback,
          'marker-incorrect': selectedMarkerId === marker.id && !marker.isCorrect && showFeedback
        }"
        :style="{ left: marker.x + '%', top: marker.y + '%' }"
        @click="handleMarkerClick(marker)"
      >
        <!-- Marker Pin -->
        <div class="marker-pin">
          <!-- Icon based on state -->
          <svg v-if="selectedMarkerId === marker.id && showFeedback && marker.isCorrect" 
               class="marker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
          <svg v-else-if="selectedMarkerId === marker.id && showFeedback && !marker.isCorrect" 
               class="marker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          <div v-else class="marker-dot"></div>
        </div>

        <!-- Label Tooltip -->
        <div class="marker-tooltip">
          {{ marker.label }}
        </div>
      </div>

      <!-- Click Ripple Effect -->
      <div 
        v-if="ripple.show" 
        class="click-ripple"
        :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
      ></div>
    </div>

    <!-- Feedback Section -->
    <div class="feedback-section">
      <transition name="slide-up" mode="out-in">
        <div v-if="showFeedback" class="feedback" :class="{ 'feedback-success': isCorrect, 'feedback-error': !isCorrect }">
          <div class="feedback-icon-wrapper">
            <span class="feedback-emoji">{{ isCorrect ? '🎉' : '🤔' }}</span>
          </div>
          <div class="feedback-content">
            <h3 class="feedback-title">{{ isCorrect ? 'Correct!' : 'Not quite.' }}</h3>
            <p class="feedback-message">
              {{ isCorrect ? '+15 XP' : 'Try looking for another location.' }}
            </p>
          </div>
        </div>

        <div v-else class="feedback-idle">
          <span class="feedback-idle-icon">📍</span>
          <span class="feedback-idle-text">Select a marker on the map to answer</span>
        </div>
      </transition>

      <!-- Action Buttons -->
      <div v-if="showFeedback" class="action-buttons">
        <button
          v-if="isCorrect"
          @click="handleContinue"
          class="action-button action-button-success"
        >
          Continue →
        </button>
        <button
          v-else-if="attemptCount >= maxAttempts"
          @click="skipExercise"
          class="action-button action-button-skip"
        >
          Skip → Continue Anyway
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import localWorldMap from '@/assets/icons/world.svg';

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
    required: true
  }
});

const emit = defineEmits(['next', 'complete']);

// State
const selectedMarkerId = ref(null);
const showFeedback = ref(false);
const isCorrect = ref(false);
const attemptCount = ref(0);
const maxAttempts = 3;
const imageError = ref(false);
const mapContainer = ref(null);
const ripple = ref({ show: false, x: 0, y: 0 });

// Computed
const displayImage = computed(() => {
  if (imageError.value) return localWorldMap;
  if (!props.image || props.image.startsWith('data:image/svg+xml') || props.image.includes('<svg')) {
    return localWorldMap;
  }
  return props.image;
});

// Methods
const handleImageError = () => {
  imageError.value = true;
};

const handleImageLoad = () => {
  console.log('Map image loaded successfully');
};

const handleMarkerClick = (marker) => {
  if (isCorrect.value) return;

  // Show ripple effect
  const rect = mapContainer.value.getBoundingClientRect();
  const x = (marker.x / 100) * rect.width;
  const y = (marker.y / 100) * rect.height;
  
  ripple.value = { show: true, x, y };
  setTimeout(() => {
    ripple.value.show = false;
  }, 600);

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
    }, 2000);
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
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Header */
.map-header {
  padding: 24px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.map-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.map-description {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Map Container */
.map-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: #f8fafc;
  overflow: hidden;
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
}

/* Markers */
.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
}

.marker:hover {
  z-index: 20;
  transform: translate(-50%, -50%) scale(1.2);
}

.marker-pin {
  width: 40px;
  height: 40px;
  background: white;
  border: 3px solid #8b5cf6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.marker:hover .marker-pin {
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.marker-selected .marker-pin {
  animation: pulse 0.6s ease-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.marker-correct .marker-pin {
  background: #10b981;
  border-color: #059669;
}

.marker-incorrect .marker-pin {
  background: #ef4444;
  border-color: #dc2626;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: #8b5cf6;
  border-radius: 50%;
}

.marker-icon {
  width: 24px;
  height: 24px;
  color: white;
}

/* Marker Tooltip */
.marker-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 6px 12px;
  background: #1e293b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.marker-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1e293b;
}

.marker:hover .marker-tooltip {
  opacity: 1;
}

/* Click Ripple */
.click-ripple {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #8b5cf6;
  transform: translate(-50%, -50%);
  animation: ripple-effect 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-effect {
  0% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(4);
  }
}

/* Feedback Section */
.feedback-section {
  padding: 24px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.feedback {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.feedback-success {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.feedback-error {
  background: #fee2e2;
  border: 2px solid #ef4444;
}

.feedback-icon-wrapper {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.feedback-emoji {
  font-size: 28px;
}

.feedback-content {
  flex: 1;
}

.feedback-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.feedback-success .feedback-title {
  color: #065f46;
}

.feedback-error .feedback-title {
  color: #991b1b;
}

.feedback-message {
  font-size: 14px;
  margin: 0;
}

.feedback-success .feedback-message {
  color: #047857;
}

.feedback-error .feedback-message {
  color: #b91c1c;
}

/* Idle State */
.feedback-idle {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.feedback-idle-icon {
  font-size: 20px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
}

.action-button {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-button-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-button-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.action-button-skip {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.action-button-skip:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
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
  .map-container {
    height: 400px;
  }

  .map-title {
    font-size: 20px;
  }

  .marker-pin {
    width: 36px;
    height: 36px;
  }

  .marker-dot {
    width: 10px;
    height: 10px;
  }

  .marker-icon {
    width: 20px;
    height: 20px;
  }

  .feedback-title {
    font-size: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>