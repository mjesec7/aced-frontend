<template>
  <div class="min-h-screen bg-white p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      
      <!-- Header -->
      <div class="text-center mb-8 md:mb-12">
        <h1 class="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Geometry Lesson: Square Properties</h1>
        <p class="text-purple-600 text-lg md:text-xl font-medium">
          Find the missing side length using the correct formula
        </p>
      </div>

      <!-- Calculate Mode (Split View) -->
      <div v-if="geometryData.mode === 'calculate'" class="grid lg:grid-cols-2 gap-6 md:gap-8 items-start">
        
        <!-- Left: Shape & Given Info -->
        <div class="bg-white rounded-2xl border-2 border-purple-200 p-6 md:p-8 shadow-lg">
          <h3 class="text-purple-600 font-semibold text-lg mb-4 md:mb-6">Given Information</h3>
          
          <div class="space-y-1 mb-6 md:mb-8">
            <p class="text-slate-900 text-base">Side a = <span class="font-semibold">{{ geometryData.given.side_a }}</span> units</p>
            <p class="text-purple-600 font-medium text-base">Angle = {{ geometryData.given.angle }}°</p>
          </div>

          <!-- Square with Rainbow Gradient Border -->
          <div class="flex justify-center items-center py-8 md:py-12">
            <div class="relative">
              <svg width="280" height="280" viewBox="0 0 280 280" class="max-w-full h-auto">
                <defs>
                  <!-- Rainbow gradient for border -->
                  <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" />
                    <stop offset="25%" stop-color="#ec4899" />
                    <stop offset="50%" stop-color="#f97316" />
                    <stop offset="75%" stop-color="#eab308" />
                    <stop offset="100%" stop-color="#22c55e" />
                  </linearGradient>
                </defs>
                
                <!-- Square with gradient border -->
                <rect 
                  x="40" y="40" 
                  width="200" height="200" 
                  fill="white" 
                  stroke="url(#rainbowGradient)" 
                  stroke-width="4"
                  rx="4"
                />
                
                <!-- 90° angle marker -->
                <path d="M 40 220 L 55 220 L 55 240" fill="none" stroke="#eab308" stroke-width="2" />
                <text x="62" y="233" class="text-xs fill-yellow-500 font-medium">90°</text>
                
                <!-- Side a label (bottom) - given side -->
                <text x="140" y="268" text-anchor="middle" class="fill-green-600 font-bold text-sm">
                  side a = {{ geometryData.given.side_a }}
                </text>
                
                <!-- Side b label (right) - clickable unknown side -->
                <g 
                  @click="handleSideClick('b')"
                  class="cursor-pointer transition-all duration-200"
                >
                  <text 
                    x="255" 
                    y="140" 
                    text-anchor="start" 
                    class="font-bold text-sm"
                    :class="activeSide === 'b' ? 'fill-pink-600' : 'fill-pink-500 hover:fill-pink-600'"
                  >
                    side b = ?
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- Right: Formulas & Submit -->
        <div class="space-y-6">
          <!-- Formula Selection Card -->
          <div class="bg-white rounded-2xl border-2 border-purple-200 p-6 md:p-8 shadow-lg">
            <h3 class="text-purple-600 font-semibold text-lg mb-6">Select the Formula You Used</h3>

            <!-- Formula Cards -->
            <div class="space-y-3 md:space-y-4">
              <button
                v-for="formula in geometryData.formulas"
                :key="formula.id"
                @click="selectFormula(formula.id)"
                class="w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                :class="selectedFormula === formula.id
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300 bg-white hover:shadow-sm'"
              >
                <p class="font-semibold text-slate-900 mb-1.5">{{ formula.name }}</p>
                <p class="font-mono text-purple-600 text-sm">{{ formula.formula }}</p>
              </button>
            </div>

            <!-- Input for side b -->
            <div class="pt-6">
              <label class="block text-sm font-medium text-slate-900 mb-2">Enter value for side b:</label>
              <input
                type="number"
                v-model="userAnswer.side_b"
                placeholder="Enter value..."
                class="w-full p-3 md:p-4 rounded-lg border-2 border-purple-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>

            <!-- Submit Button -->
            <button
              @click="submitGeometry"
              :disabled="!canSubmitGeometry"
              class="w-full py-3.5 md:py-4 rounded-full font-semibold text-white text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            >
              Check Answer
            </button>

            <!-- Feedback -->
            <transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
            >
              <div v-if="showFeedback" class="mt-4 p-4 rounded-xl border-2"
                :class="isCorrect ? 'bg-teal-50 border-teal-400' : 'bg-red-50 border-red-400'"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0">
                    <div v-if="isCorrect" class="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                      <span class="text-white text-sm font-bold">✓</span>
                    </div>
                    <div v-else class="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <span class="text-white text-sm font-bold">✕</span>
                    </div>
                  </div>
                  <div>
                    <h4 class="font-bold text-base" :class="isCorrect ? 'text-teal-900' : 'text-red-900'">
                      {{ isCorrect ? 'Great job!' : 'Not quite right' }}
                    </h4>
                    <p class="text-sm mt-1" :class="isCorrect ? 'text-teal-800' : 'text-red-800'">
                      {{ isCorrect ? `Side b = ${geometryData.given.side_a} units` : 'Review the hint and square property, then try again.' }}
                    </p>
                  </div>
                </div>
              </div>
            </transition>

            <!-- Next Button -->
            <transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
            >
              <button
                v-if="isCorrect"
                @click="emit('next-exercise')"
                class="w-full py-3.5 md:py-4 rounded-full font-semibold text-white shadow-lg bg-purple-600 hover:bg-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4"
              >
                Next →
              </button>
            </transition>
          </div>

          <!-- Hint Card (Separate, Below) -->
          <div v-if="geometryData.hint" class="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-lg">
            <h3 class="text-purple-600 font-semibold text-base mb-2 flex items-center gap-2">
              <span class="text-xl">💡</span>
              Hint
            </h3>
            <p class="text-slate-700 text-sm md:text-base leading-relaxed">
              {{ geometryData.hint }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  geometryData: {
    type: Object,
    required: true
  },
  userAnswer: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:userAnswer', 'next-exercise', 'submit']);

// State
const activeSide = ref(null);
const selectedFormula = ref(null);
const showFeedback = ref(false);
const isCorrect = ref(false);

// Computed
const canSubmitGeometry = computed(() => {
  return props.userAnswer?.side_b && selectedFormula.value;
});

// Methods
const handleSideClick = (side) => {
  if (side !== 'a') {  // Only allow selecting the unknown side
    activeSide.value = side;
    showFeedback.value = false;
  }
};

const selectFormula = (id) => {
  selectedFormula.value = id;
  showFeedback.value = false;
};

const submitGeometry = () => {
  // Validate
  const correctSide = props.geometryData.correctAnswer.side_b;
  const correctFormulaId = props.geometryData.correctAnswer.formulaId;
  
  const userSide = parseFloat(props.userAnswer.side_b);
  const userFormula = selectedFormula.value;

  isCorrect.value = (userSide === correctSide && userFormula === correctFormulaId);
  showFeedback.value = true;

  emit('submit', {
    isCorrect: isCorrect.value,
    userSide,
    userFormula
  });
};

// Watchers
watch(() => props.geometryData, () => {
  activeSide.value = null;
  selectedFormula.value = null;
  showFeedback.value = false;
  isCorrect.value = false;
}, { deep: true });
</script>
