<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <!-- Header -->
    <div class="text-center mb-6 relative">
      <div class="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 mb-4">
        <span class="text-2xl">✨</span>
        <span class="font-bold text-indigo-700">Word Constellation</span>
      </div>
      
      <button 
        @click="showHelp = !showHelp" 
        class="absolute right-0 top-0 p-2 text-indigo-400 hover:text-indigo-600 transition-colors"
        title="How to play"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <div v-if="showHelp" class="absolute top-12 right-0 w-72 bg-white p-5 rounded-xl shadow-xl border border-indigo-100 z-50 text-left">
        <h4 class="font-bold text-indigo-700 mb-2 flex items-center gap-2">
          <span>🎮</span> How to Play
        </h4>
        <ul class="space-y-2 text-sm text-gray-600">
          <li class="flex gap-2">
            <span class="text-indigo-500 font-bold">1.</span>
            <span>Look for words related to the <strong>Central Word</strong>.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-indigo-500 font-bold">2.</span>
            <span><strong>Drag</strong> from one word to another to connect them.</span>
          </li>
          <li class="flex gap-2">
            <span class="text-indigo-500 font-bold">3.</span>
            <span>Find all connections to reveal the full constellation!</span>
          </li>
        </ul>
        <button @click="showHelp = false" class="mt-3 w-full py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100">Got it!</button>
      </div>

      <p class="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
        {{ step.prompt || 'Drag to connect words that are synonyms, antonyms, or related to the central concept.' }}
      </p>
    </div>

    <!-- Central Word -->
    <div class="text-center mb-4">
      <span class="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xl shadow-lg">
        {{ centralWordText }}
      </span>
    </div>

    <!-- Constellation Canvas -->
    <div class="constellation-canvas" ref="canvas" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @touchmove="handleTouchMove" @touchend="handleMouseUp">
      <!-- SVG for connections -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none">
        <!-- Background stars -->
        <circle
          v-for="star in backgroundStars"
          :key="star.id"
          :cx="star.x"
          :cy="star.y"
          :r="star.r"
          fill="white"
          :opacity="star.opacity"
          class="twinkle"
          :style="{ animationDelay: star.delay + 's' }"
        />

        <!-- Correct connections (constellation lines) -->
        <line
          v-for="conn in correctConnections"
          :key="`line-${conn.from}-${conn.to}`"
          :x1="getWordPosition(conn.from).x"
          :y1="getWordPosition(conn.from).y"
          :x2="getWordPosition(conn.to).x"
          :y2="getWordPosition(conn.to).y"
          stroke="url(#connectionGradient)"
          stroke-width="3"
          stroke-linecap="round"
          class="constellation-line"
        />

        <!-- Active dragging line -->
        <line
          v-if="dragging && dragStart && dragEnd"
          :x1="dragStart.x"
          :y1="dragStart.y"
          :x2="dragEnd.x"
          :y2="dragEnd.y"
          stroke="#a5b4fc"
          stroke-width="2"
          stroke-dasharray="6 4"
          stroke-linecap="round"
        />

        <!-- Gradient definition -->
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#818cf8" />
            <stop offset="50%" stop-color="#c084fc" />
            <stop offset="100%" stop-color="#818cf8" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Word Nodes -->
      <div
        v-for="(word, idx) in step.words"
        :key="word.id"
        :ref="el => wordRefs[word.id] = el"
        class="word-node"
        :class="{
          'connected': isWordConnected(word.id),
          'dragging': dragFromWord === word.id,
          'hovering': hoveringWord === word.id && dragging && dragFromWord !== word.id,
          'central': word.id === 'center'
        }"
        :style="getWordStyle(word, idx)"
        @mousedown="startDrag(word, $event)"
        @touchstart.prevent="startDrag(word, $event)"
        @mouseenter="hoveringWord = word.id"
        @mouseleave="hoveringWord = null"
      >
        <div class="word-glow"></div>
        <div class="word-content">
          <span class="word-text">{{ word.text }}</span>
          <span v-if="word.type && showTypes" class="word-type">{{ word.type }}</span>
        </div>

        <!-- Connection count badge -->
        <div v-if="getConnectionCount(word.id) > 0" class="connection-badge">
          {{ getConnectionCount(word.id) }}
        </div>
      </div>

      <!-- Central Star (the main word) -->
      <div class="central-star" :style="getCentralStyle()">
        <div class="star-rays"></div>
        <div class="star-core">
          <span>{{ centralWordText }}</span>
        </div>
      </div>
    </div>

    <!-- Relationship Types Legend -->
    <div v-if="step.showLegend !== false" class="mt-6 flex flex-wrap justify-center gap-3">
      <div
        v-for="relType in relationshipTypes"
        :key="relType.type"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
        :class="relType.class"
      >
        <span>{{ relType.icon }}</span>
        <span class="font-medium">{{ relType.label }}</span>
      </div>
    </div>

    <!-- Progress & Feedback -->
    <div class="mt-6">
      <div class="flex items-center gap-4 mb-4">
        <div class="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <span class="text-sm font-bold text-gray-600">
          {{ correctConnections.length }} / {{ step.requiredConnections?.length || step.words.length }}
        </span>
      </div>

      <div class="step-feedback" :class="feedbackClass">
        {{ feedback }}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-start gap-3 mt-4">
      <button
        v-if="correctConnections.length > 0 && !isComplete"
        @click="resetConstellation"
        class="px-6 py-3 rounded-full font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        Reset
      </button>
      <button
        v-if="isComplete"
        @click="$emit('complete', true)"
        class="px-8 py-3 rounded-full font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md hover:shadow-lg transition-all"
      >
        Constellation Complete! →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

// Refs
const canvas = ref(null);
const wordRefs = reactive({});

// State
const connections = ref([]); // { from, to }
const dragging = ref(false);
const dragFromWord = ref(null);
const dragStart = ref(null);
const dragEnd = ref(null);
const hoveringWord = ref(null);
const feedback = ref('');
const showTypes = ref(true);
const showHelp = ref(false);
const backgroundStars = ref([]);

// Generate background stars
const generateBackgroundStars = () => {
  const stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      id: i,
      x: Math.random() * 100 + '%',
      y: Math.random() * 100 + '%',
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 3
    });
  }
  backgroundStars.value = stars;
};

// Relationship types
const relationshipTypes = [
  { type: 'synonym', label: 'Synonym', icon: '≈', class: 'bg-blue-100 text-blue-700' },
  { type: 'antonym', label: 'Antonym', icon: '↔', class: 'bg-red-100 text-red-700' },
  { type: 'related', label: 'Related', icon: '→', class: 'bg-green-100 text-green-700' },
  { type: 'category', label: 'Category', icon: '⊂', class: 'bg-purple-100 text-purple-700' }
];

// Computed
const centralWordText = computed(() => {
  if (typeof props.step.centralWord === 'object' && props.step.centralWord !== null) {
    return props.step.centralWord.text || 'Center';
  }
  return props.step.centralWord;
});

const correctConnections = computed(() => {
  return connections.value.filter(conn => {
    const required = props.step.requiredConnections || [];
    return required.some(req =>
      (req.from === conn.from && req.to === conn.to) ||
      (req.from === conn.to && req.to === conn.from)
    );
  });
});

const progressPercent = computed(() => {
  const total = props.step.requiredConnections?.length || props.step.words.length;
  return (correctConnections.value.length / total) * 100;
});

const isComplete = computed(() => {
  const required = props.step.requiredConnections?.length || props.step.words.length;
  return correctConnections.value.length >= required;
});

const feedbackClass = computed(() => {
  if (!feedback.value) return '';
  if (feedback.value.includes('✓') || feedback.value.includes('🌟')) return 'success';
  return 'error';
});

// Initialize
watch(() => props.step, () => {
  connections.value = [];
  feedback.value = '';
  dragging.value = false;
  generateBackgroundStars();
}, { immediate: true });

onMounted(() => {
  generateBackgroundStars();
});

// Word positioning - arrange in a circle around center
const getWordStyle = (word, idx) => {
  const total = props.step.words.length;
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 38; // % from center

  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  };
};

const getCentralStyle = () => {
  return {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)'
  };
};

const getWordPosition = (wordId) => {
  if (!canvas.value) return { x: 0, y: 0 };

  const el = wordRefs[wordId];
  if (!el) return { x: canvas.value.offsetWidth / 2, y: canvas.value.offsetHeight / 2 };

  const canvasRect = canvas.value.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  return {
    x: elRect.left + elRect.width / 2 - canvasRect.left,
    y: elRect.top + elRect.height / 2 - canvasRect.top
  };
};

// Connection helpers
const isWordConnected = (wordId) => {
  return connections.value.some(c => c.from === wordId || c.to === wordId);
};

const getConnectionCount = (wordId) => {
  return connections.value.filter(c => c.from === wordId || c.to === wordId).length;
};

const connectionExists = (from, to) => {
  return connections.value.some(c =>
    (c.from === from && c.to === to) || (c.from === to && c.to === from)
  );
};

// Drag handlers
const startDrag = (word, event) => {
  dragging.value = true;
  dragFromWord.value = word.id;
  dragStart.value = getWordPosition(word.id);

  const rect = canvas.value.getBoundingClientRect();
  if (event.touches) {
    dragEnd.value = {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top
    };
  } else {
    dragEnd.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
};

const handleMouseMove = (event) => {
  if (!dragging.value || !canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  dragEnd.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
};

const handleTouchMove = (event) => {
  if (!dragging.value || !canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  dragEnd.value = {
    x: event.touches[0].clientX - rect.left,
    y: event.touches[0].clientY - rect.top
  };
};

const handleMouseUp = () => {
  if (!dragging.value) return;

  if (hoveringWord.value && hoveringWord.value !== dragFromWord.value) {
    tryCreateConnection(dragFromWord.value, hoveringWord.value);
  }

  dragging.value = false;
  dragFromWord.value = null;
  dragStart.value = null;
  dragEnd.value = null;
};

const tryCreateConnection = (from, to) => {
  // Check if connection already exists
  if (connectionExists(from, to)) {
    feedback.value = '⚠️ These words are already connected!';
    return;
  }

  // Check if this is a valid connection
  const required = props.step.requiredConnections || [];
  const isValid = required.some(req =>
    (req.from === from && req.to === to) || (req.from === to && req.to === from)
  );

  if (isValid) {
    connections.value.push({ from, to });
    feedback.value = '✓ Connection discovered!';

    if (isComplete.value) {
      feedback.value = '🌟 Constellation complete! You found all the word relationships!';
      emit('complete', true);
    }
  } else {
    feedback.value = '✗ These words don\'t have a direct relationship. Try another pair!';

    // Shake animation on wrong connection
    const fromEl = wordRefs[from];
    const toEl = wordRefs[to];
    if (fromEl) fromEl.classList.add('shake');
    if (toEl) toEl.classList.add('shake');
    setTimeout(() => {
      if (fromEl) fromEl.classList.remove('shake');
      if (toEl) toEl.classList.remove('shake');
    }, 500);
  }
};

const resetConstellation = () => {
  connections.value = [];
  feedback.value = '';
};
</script>

<style scoped>
.constellation-canvas {
  position: relative;
  width: 100%;
  height: 450px;
  background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: inset 0 0 100px rgba(99, 102, 241, 0.2);
}

/* Background star twinkle */
.twinkle {
  animation: twinkle 3s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

/* Word nodes */
.word-node {
  position: absolute;
  z-index: 10;
  cursor: grab;
  user-select: none;
}

.word-node:active {
  cursor: grabbing;
}

.word-glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.word-node:hover .word-glow,
.word-node.connected .word-glow {
  opacity: 1;
}

.word-node.dragging .word-glow {
  opacity: 1;
  animation: pulse 1s ease infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.word-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  border: 2px solid #e0e7ff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.word-node:hover .word-content {
  transform: scale(1.05);
  border-color: #a5b4fc;
}

.word-node.connected .word-content {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-color: #818cf8;
}

.word-node.hovering .word-content {
  border-color: #818cf8;
  box-shadow: 0 0 20px rgba(129, 140, 248, 0.5);
}

.word-text {
  font-weight: 600;
  font-size: 14px;
  color: #1e1b4b;
}

.word-type {
  font-size: 10px;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.connection-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

/* Central star */
.central-star {
  position: absolute;
  z-index: 5;
}

.star-rays {
  position: absolute;
  inset: -30px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
  animation: star-pulse 2s ease-in-out infinite;
}

@keyframes star-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.star-core {
  padding: 16px 28px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 20px;
  color: white;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 0 40px rgba(251, 191, 36, 0.6);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Constellation lines */
.constellation-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-constellation 0.8s ease forwards;
}

@keyframes draw-constellation {
  to { stroke-dashoffset: 0; }
}

/* Shake animation */
.shake {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translate(-50%, -50%); }
  20% { transform: translate(-50%, -50%) translateX(-5px); }
  40% { transform: translate(-50%, -50%) translateX(5px); }
  60% { transform: translate(-50%, -50%) translateX(-5px); }
  80% { transform: translate(-50%, -50%) translateX(5px); }
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
</style>
