<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 mb-4">
        <span class="text-2xl">🌉</span>
        <span class="font-bold text-amber-700">Idiom Bridge</span>
      </div>
      <p class="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
        {{ step.prompt || 'Connect idioms with the same meaning across languages' }}
      </p>
    </div>

    <!-- Language Labels -->
    <div class="flex justify-between mb-4 px-4">
      <div class="flex items-center gap-2">
        <span class="text-2xl">{{ getLanguageFlag(step.sourceLanguage) }}</span>
        <span class="font-bold text-gray-700">{{ step.sourceLanguage || 'English' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-bold text-gray-700">{{ step.targetLanguage || 'Spanish' }}</span>
        <span class="text-2xl">{{ getLanguageFlag(step.targetLanguage) }}</span>
      </div>
    </div>

    <!-- Bridge Container -->
    <div class="relative bridge-container" ref="bridgeContainer">
      <!-- SVG for connection lines -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" ref="svgCanvas">
        <!-- Completed connections -->
        <path
          v-for="(conn, idx) in completedConnections"
          :key="`conn-${idx}`"
          :d="conn.path"
          :stroke="conn.correct ? '#10b981' : '#ef4444'"
          stroke-width="3"
          fill="none"
          class="connection-line"
          :class="{ 'animate-draw': conn.animate }"
        />
        <!-- Active connection being drawn -->
        <path
          v-if="activePath"
          :d="activePath"
          stroke="#8b5cf6"
          stroke-width="3"
          stroke-dasharray="8 4"
          fill="none"
          class="active-connection"
        />
      </svg>

      <!-- Two Columns Layout -->
      <div class="flex justify-between gap-8">
        <!-- Source Idioms (Left) -->
        <div class="flex-1 space-y-4">
          <div
            v-for="(idiom, idx) in step.sourceIdioms"
            :key="`source-${idx}`"
            :ref="el => setSourceRef(idx, el)"
            @mousedown="startConnection(idx, 'source', $event)"
            @touchstart.prevent="startConnection(idx, 'source', $event)"
            class="idiom-card source-card"
            :class="{
              'connected': isSourceConnected(idx),
              'correct': isSourceCorrect(idx),
              'incorrect': isSourceIncorrect(idx),
              'active': activeSource === idx
            }"
          >
            <div class="idiom-content">
              <p class="font-semibold text-gray-800">{{ idiom.text }}</p>
              <p v-if="idiom.literal" class="text-sm text-gray-500 italic mt-1">
                (Literally: {{ idiom.literal }})
              </p>
            </div>
            <div class="connection-dot right-dot" :class="{ 'dot-active': activeSource === idx }"></div>
          </div>
        </div>

        <!-- Bridge Visual -->
        <div class="flex flex-col items-center justify-center px-4">
          <div class="bridge-pillar"></div>
          <div class="bridge-deck">
            <div class="bridge-cable left-cable"></div>
            <div class="bridge-cable right-cable"></div>
          </div>
          <div class="bridge-pillar"></div>
        </div>

        <!-- Target Idioms (Right) -->
        <div class="flex-1 space-y-4">
          <div
            v-for="(idiom, idx) in shuffledTargets"
            :key="`target-${idx}`"
            :ref="el => setTargetRef(idx, el)"
            @mouseup="endConnection(idx)"
            @touchend="endConnection(idx)"
            class="idiom-card target-card"
            :class="{
              'connected': isTargetConnected(idx),
              'correct': isTargetCorrect(idx),
              'incorrect': isTargetIncorrect(idx),
              'hovering': hoveringTarget === idx
            }"
            @mouseenter="hoveringTarget = activeSource !== null ? idx : null"
            @mouseleave="hoveringTarget = null"
          >
            <div class="connection-dot left-dot" :class="{ 'dot-active': hoveringTarget === idx }"></div>
            <div class="idiom-content">
              <p class="font-semibold text-gray-800">{{ idiom.text }}</p>
              <p v-if="idiom.literal" class="text-sm text-gray-500 italic mt-1">
                (Literally: {{ idiom.literal }})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Meaning Reveal (after correct match) -->
    <transition-group name="meaning-reveal" tag="div" class="mt-6 space-y-2">
      <div
        v-for="match in revealedMeanings"
        :key="match.id"
        class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
      >
        <p class="text-green-800">
          <span class="font-bold">Shared meaning:</span> {{ match.meaning }}
        </p>
      </div>
    </transition-group>

    <!-- Progress -->
    <div class="mt-6 flex items-center gap-4">
      <div class="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
          :style="{ width: `${(correctMatches.length / step.sourceIdioms.length) * 100}%` }"
        ></div>
      </div>
      <span class="text-sm font-bold text-gray-600">
        {{ correctMatches.length }} / {{ step.sourceIdioms.length }}
      </span>
    </div>

    <!-- Feedback -->
    <div class="step-feedback mt-4" :class="feedbackClass">
      {{ feedback }}
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-start gap-3 mt-4">
      <button
        v-if="!allCorrect"
        @click="resetConnections"
        class="px-6 py-3 rounded-full font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        Reset All
      </button>
      <button
        v-if="allCorrect"
        @click="$emit('complete', true)"
        class="px-8 py-3 rounded-full font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md hover:shadow-lg transition-all"
      >
        Continue →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

// Refs
const bridgeContainer = ref(null);
const svgCanvas = ref(null);
const sourceRefs = ref({});
const targetRefs = ref({});

// State
const shuffledTargets = ref([]);
const connections = ref([]); // { sourceIdx, targetIdx, correct }
const completedConnections = ref([]); // { path, correct, animate }
const activeSource = ref(null);
const activePath = ref(null);
const hoveringTarget = ref(null);
const feedback = ref('');
const revealedMeanings = ref([]);

// Set refs for DOM elements
const setSourceRef = (idx, el) => {
  if (el) sourceRefs.value[idx] = el;
};

const setTargetRef = (idx, el) => {
  if (el) targetRefs.value[idx] = el;
};

// Computed
const correctMatches = computed(() => connections.value.filter(c => c.correct));
const allCorrect = computed(() => correctMatches.value.length === props.step.sourceIdioms.length);

const feedbackClass = computed(() => {
  if (!feedback.value) return '';
  if (feedback.value.includes('✓') || feedback.value.includes('🎉')) return 'success';
  return 'error';
});

// Check connection states
const isSourceConnected = (idx) => connections.value.some(c => c.sourceIdx === idx);
const isTargetConnected = (idx) => connections.value.some(c => c.targetIdx === idx);
const isSourceCorrect = (idx) => connections.value.some(c => c.sourceIdx === idx && c.correct);
const isSourceIncorrect = (idx) => connections.value.some(c => c.sourceIdx === idx && !c.correct);
const isTargetCorrect = (idx) => connections.value.some(c => c.targetIdx === idx && c.correct);
const isTargetIncorrect = (idx) => connections.value.some(c => c.targetIdx === idx && !c.correct);

// Initialize
watch(() => props.step, () => {
  // Shuffle target idioms
  // Shuffle target idioms with check to avoid direct alignment
  let shuffled = [...props.step.targetIdioms];
  let attempts = 0;
  
  // Try to shuffle until we don't have too many direct matches
  do {
    shuffled.sort(() => Math.random() - 0.5);
    attempts++;
    
    // Check for direct alignment (source[i] matches target[i])
    const directMatches = shuffled.filter((item, index) => 
      props.step.sourceIdioms[index] && item.matchId === props.step.sourceIdioms[index].matchId
    ).length;
    
    // Accept if fewer than 30% are directly aligned, or if we tried enough times
    // For small arrays (length < 4), we just accept any shuffle that isn't 100% match
    if (shuffled.length < 4) {
       if (directMatches < shuffled.length || attempts > 5) break;
    } else {
       if (directMatches <= Math.max(1, shuffled.length * 0.3) || attempts > 10) break;
    }
  } while (true);

  shuffledTargets.value = shuffled;
  connections.value = [];
  completedConnections.value = [];
  revealedMeanings.value = [];
  feedback.value = '';
  activeSource.value = null;
  activePath.value = null;
}, { immediate: true });

// Connection logic
const startConnection = (idx, side, event) => {
  if (isSourceConnected(idx)) {
    // Remove existing connection
    const connIdx = connections.value.findIndex(c => c.sourceIdx === idx);
    if (connIdx !== -1) {
      connections.value.splice(connIdx, 1);
      completedConnections.value.splice(connIdx, 1);
    }
  }
  activeSource.value = idx;
  feedback.value = '';
  updateActivePath(event);
};

const updateActivePath = (event) => {
  if (activeSource.value === null) return;

  const sourceEl = sourceRefs.value[activeSource.value];
  if (!sourceEl || !svgCanvas.value) return;

  const containerRect = svgCanvas.value.getBoundingClientRect();
  const sourceRect = sourceEl.getBoundingClientRect();

  const startX = sourceRect.right - containerRect.left;
  const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;

  let endX, endY;
  if (event.touches) {
    endX = event.touches[0].clientX - containerRect.left;
    endY = event.touches[0].clientY - containerRect.top;
  } else {
    endX = event.clientX - containerRect.left;
    endY = event.clientY - containerRect.top;
  }

  // Curved path
  const controlX = startX + (endX - startX) / 2;
  activePath.value = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;
};

const endConnection = (targetIdx) => {
  if (activeSource.value === null) return;

  const sourceIdx = activeSource.value;
  const sourceIdiom = props.step.sourceIdioms[sourceIdx];
  const targetIdiom = shuffledTargets.value[targetIdx];

  // Check if target is already connected
  if (isTargetConnected(targetIdx)) {
    activeSource.value = null;
    activePath.value = null;
    feedback.value = '⚠️ This idiom is already connected!';
    return;
  }

  // Check if match is correct
  const isCorrect = sourceIdiom.matchId === targetIdiom.matchId;

  // Create connection path
  const sourceEl = sourceRefs.value[sourceIdx];
  const targetEl = targetRefs.value[targetIdx];
  const containerRect = svgCanvas.value.getBoundingClientRect();

  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  const startX = sourceRect.right - containerRect.left;
  const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
  const endX = targetRect.left - containerRect.left;
  const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

  const controlX = startX + (endX - startX) / 2;
  const path = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;

  connections.value.push({ sourceIdx, targetIdx, correct: isCorrect });
  completedConnections.value.push({ path, correct: isCorrect, animate: true });

  if (isCorrect) {
    feedback.value = '✓ Perfect match!';
    // Reveal the shared meaning
    revealedMeanings.value.push({
      id: sourceIdiom.matchId,
      meaning: sourceIdiom.meaning || targetIdiom.meaning || 'These idioms share the same meaning!'
    });

    if (correctMatches.value.length === props.step.sourceIdioms.length) {
      feedback.value = '🎉 All idioms matched! You\'ve built the complete bridge!';
      emit('complete', true);
    }
  } else {
    feedback.value = '✗ These idioms have different meanings. Try again!';
  }

  activeSource.value = null;
  activePath.value = null;
};

const resetConnections = () => {
  connections.value = [];
  completedConnections.value = [];
  revealedMeanings.value = [];
  feedback.value = '';
  activeSource.value = null;
  activePath.value = null;
};

// Mouse move handler
const handleMouseMove = (event) => {
  if (activeSource.value !== null) {
    updateActivePath(event);
  }
};

const handleMouseUp = () => {
  if (activeSource.value !== null) {
    activeSource.value = null;
    activePath.value = null;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('touchmove', handleMouseMove);
  document.addEventListener('touchend', handleMouseUp);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('touchmove', handleMouseMove);
  document.removeEventListener('touchend', handleMouseUp);
});

// Helpers
const getLanguageFlag = (lang) => {
  const flags = {
    'English': '🇬🇧',
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Russian': '🇷🇺',
    'Chinese': '🇨🇳',
    'Japanese': '🇯🇵',
    'Korean': '🇰🇷',
    'Portuguese': '🇵🇹',
    'Arabic': '🇸🇦'
  };
  return flags[lang] || '🌍';
};
</script>

<style scoped>
.bridge-container {
  position: relative;
  min-height: 400px;
  padding: 20px;
  background: linear-gradient(180deg, #fef3c7 0%, #fef9c3 50%, #ecfdf5 100%);
  border-radius: 24px;
  border: 2px solid #fcd34d;
}

.idiom-card {
  position: relative;
  padding: 16px 24px;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 20;
}

.source-card {
  padding-right: 40px;
}

.target-card {
  padding-left: 40px;
}

.idiom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.idiom-card.active {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
}

.idiom-card.connected {
  opacity: 0.9;
}

.idiom-card.correct {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.idiom-card.incorrect {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  animation: shake 0.5s ease;
}

.idiom-card.hovering {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.connection-dot {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e5e7eb;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.3s ease;
}

.right-dot {
  right: -8px;
}

.left-dot {
  left: -8px;
}

.dot-active {
  background: #8b5cf6;
  transform: translateY(-50%) scale(1.3);
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.3);
}

.correct .connection-dot {
  background: #10b981;
}

.incorrect .connection-dot {
  background: #ef4444;
}

/* Bridge Visual */
.bridge-pillar {
  width: 20px;
  height: 80px;
  background: linear-gradient(180deg, #78716c 0%, #57534e 100%);
  border-radius: 4px;
}

.bridge-deck {
  width: 8px;
  height: 200px;
  background: linear-gradient(90deg, #a8a29e 0%, #78716c 50%, #a8a29e 100%);
  position: relative;
}

.bridge-cable {
  position: absolute;
  width: 60px;
  height: 2px;
  background: #57534e;
  top: 20%;
}

.left-cable {
  right: 0;
  transform: rotate(-30deg);
  transform-origin: right center;
}

.right-cable {
  left: 0;
  transform: rotate(30deg);
  transform-origin: left center;
}

/* SVG Connections */
.connection-line {
  stroke-linecap: round;
}

.connection-line.animate-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-line 0.5s ease forwards;
}

@keyframes draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

.active-connection {
  animation: dash 0.5s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -12;
  }
}

/* Feedback */
.step-feedback {
  min-height: 24px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 500;
}

.step-feedback:empty {
  display: none;
}

.step-feedback.success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.step-feedback.error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #991b1b;
  border: 1px solid #fca5a5;
}

/* Meaning reveal animation */
.meaning-reveal-enter-active {
  animation: slide-in 0.4s ease;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
