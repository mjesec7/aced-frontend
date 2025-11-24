<template>
  <div class="w-full">
    <!-- 3D Histogram Visualization -->
    <div class="relative mb-8">
      <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"></div>
      <div class="relative bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        
        <!-- Chart Title -->
        <h3 class="text-white font-bold text-lg mb-6">{{ title || 'Data Visualization' }}</h3>
        
        <!-- Histogram Bars -->
        <div class="relative h-64">
          <div class="absolute inset-0 flex items-end justify-between gap-2">
            <div 
              v-for="(value, index) in chartData.values" 
              :key="index"
              class="flex-1 group relative"
              @click="selectValue(chartData.labels[index])"
            >
              <!-- Bar -->
              <div 
                class="relative bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all duration-300 hover:from-purple-500 hover:to-pink-400 cursor-pointer"
                :style="{ 
                  height: `${(value / Math.max(...chartData.values)) * 100}%`,
                  boxShadow: selectedIndex === index ? '0 0 30px rgba(168, 85, 247, 0.5)' : ''
                }"
                :class="selectedIndex === index ? 'scale-105' : ''"
              >
                <!-- Value Label -->
                <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="bg-white/90 text-slate-900 px-2 py-1 rounded text-sm font-bold whitespace-nowrap">
                    {{ value }}
                  </div>
                </div>

                <!-- Glow Effect -->
                <div v-if="selectedIndex === index" class="absolute inset-0 bg-gradient-to-t from-purple-400/50 to-pink-400/50 rounded-t-lg animate-pulse"></div>
              </div>

              <!-- Label -->
              <div class="text-center mt-2">
                <span class="text-white/70 text-sm font-medium">{{ chartData.labels[index] }}</span>
              </div>
            </div>
          </div>

          <!-- Grid Lines -->
          <div class="absolute inset-0 pointer-events-none">
            <div v-for="i in 5" :key="i" 
                 class="absolute w-full border-t border-white/10"
                 :style="{ bottom: `${(i - 1) * 25}%` }">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Slider -->
    <div class="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      <div class="mb-4">
        <p class="text-white/70 text-sm uppercase tracking-wide mb-2">Select Value</p>
        <div class="flex items-center justify-between">
          <span class="text-white/50 text-sm">{{ min }}</span>
          <div class="flex-1 mx-4">
            <div class="relative">
              <!-- Custom Slider Track -->
              <div class="h-3 bg-black/30 rounded-full shadow-inner">
                <div 
                  class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
                  :style="{ width: `${((currentValue - min) / (max - min)) * 100}%` }"
                ></div>
              </div>
              
              <!-- Slider Input -->
              <input
                type="range"
                :min="min"
                :max="max"
                :step="step"
                v-model.number="currentValue"
                class="absolute inset-0 w-full opacity-0 cursor-pointer"
                :disabled="isLocked"
              />
              
              <!-- Custom Thumb -->
              <div 
                class="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-200"
                :style="{ left: `${((currentValue - min) / (max - min)) * 100}%` }"
              >
                <div class="relative">
                  <div class="w-6 h-6 bg-white rounded-full shadow-xl border-2 border-purple-500"></div>
                  <!-- Value Tooltip -->
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white text-slate-900 px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap shadow-xl">
                    {{ currentValue }}
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span class="text-white/50 text-sm">{{ max }}</span>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        @click="checkAnswer"
        :disabled="isLocked"
        class="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 relative overflow-hidden group"
        :class="isLocked 
          ? 'bg-green-500 cursor-not-allowed' 
          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl hover:scale-105'"
      >
        <div v-if="!isLocked" class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
        <span class="relative z-10">
          {{ isLocked ? '✓ Correct!' : 'Submit Answer' }}
        </span>
      </button>

      <!-- Feedback -->
      <transition name="bounce">
        <div v-if="feedback" class="mt-4 p-4 rounded-xl border backdrop-blur-md"
             :class="isCorrect 
               ? 'bg-green-500/20 border-green-400/50 text-green-300' 
               : 'bg-red-500/20 border-red-400/50 text-red-300'">
          <p class="font-medium flex items-center gap-2">
            <span class="text-2xl">{{ isCorrect ? '🎯' : '💫' }}</span>
            {{ isCorrect ? 'Perfect! You found the correct value!' : `Not quite. Try again!` }}
          </p>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  title: String,
  description: String,
  data: {
    type: Object,
    required: true
  },
  correctValue: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['complete', 'next']);

// State
const currentValue = ref(Math.floor((props.max + props.min) / 2));
const selectedIndex = ref(-1);
const feedback = ref('');
const isCorrect = ref(false);
const isLocked = ref(false);

// Computed
const chartData = computed(() => props.data || { labels: [], values: [] });

// Methods
const selectValue = (label) => {
  const index = chartData.value.labels.indexOf(label);
  selectedIndex.value = index;
  currentValue.value = parseInt(label);
};

const checkAnswer = () => {
  if (isLocked.value) return;
  
  const tolerance = props.step || 1;
  if (Math.abs(currentValue.value - props.correctValue) <= tolerance) {
    isCorrect.value = true;
    feedback.value = 'Correct!';
    isLocked.value = true;
    emit('complete', true);
    setTimeout(() => {
      emit('next');
    }, 2000);
  } else {
    isCorrect.value = false;
    feedback.value = 'Try again';
    setTimeout(() => {
      feedback.value = '';
    }, 2000);
  }
};

// Watch for prop changes
watch(() => props.correctValue, () => {
  currentValue.value = Math.floor((props.max + props.min) / 2);
  selectedIndex.value = -1;
  feedback.value = '';
  isCorrect.value = false;
  isLocked.value = false;
});
</script>

<style scoped>
.bounce-enter-active {
  animation: bounce-in 0.5s;
}

@keyframes bounce-in {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
