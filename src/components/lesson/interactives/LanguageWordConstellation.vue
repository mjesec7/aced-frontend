<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5 relative">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">✨</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Word Constellation</span>
      </div>

      <button
        @click="showHelp = !showHelp"
        class="absolute right-0 top-0 p-1.5 text-slate-400 hover:text-violet-600 transition-colors"
        title="How to play"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <div v-if="showHelp" class="absolute top-10 right-0 w-64 bg-white p-4 rounded-xl shadow-lg border border-slate-200/60 z-50 text-left">
        <h4 class="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <span>🎮</span> How to Play
        </h4>
        <ul class="space-y-1.5 text-xs text-slate-500">
          <li class="flex gap-1.5">
            <span class="text-violet-400 font-bold">1.</span>
            <span>Look for words related to the <strong class="text-slate-700">Central Word</strong>.</span>
          </li>
          <li class="flex gap-1.5">
            <span class="text-violet-400 font-bold">2.</span>
            <span><strong class="text-slate-700">Drag</strong> from one word to another to connect them.</span>
          </li>
          <li class="flex gap-1.5">
            <span class="text-violet-400 font-bold">3.</span>
            <span>Find all connections to reveal the full constellation!</span>
          </li>
        </ul>
        <button @click="showHelp = false" class="mt-2.5 w-full py-1 bg-violet-50 text-violet-600 rounded-lg text-[10px] font-bold hover:bg-violet-100 cursor-pointer">Got it!</button>
      </div>

      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ getLocalizedText(step.prompt) || 'Drag to connect words that are synonyms, antonyms, or related to the central concept.' }}
      </h2>
    </div>

    <!-- Central Word -->
    <div class="text-center mb-3">
      <span class="inline-block px-5 py-2.5 rounded-xl bg-violet-100 border border-violet-200 text-violet-700 font-bold text-base">
        {{ centralWordText }}
      </span>
    </div>

    <!-- Constellation Canvas -->
    <div class="constellation-canvas" ref="canvas" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @touchmove="handleTouchMove" @touchend="handleMouseUp">
      <!-- SVG for connections -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none">
        <!-- Background dots (replacing stars for light theme) -->
        <circle
          v-for="star in backgroundStars"
          :key="star.id"
          :cx="star.x"
          :cy="star.y"
          :r="star.r"
          fill="#c7d2fe"
          :opacity="star.opacity * 0.4"
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
          stroke-width="2.5"
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
          stroke-width="1.5"
          stroke-dasharray="5 3"
          stroke-linecap="round"
        />

        <!-- Gradient definition -->
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#818cf8" />
            <stop offset="50%" stop-color="#a78bfa" />
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
          <span class="word-text">{{ getLocalizedText(word.text) }}</span>
          <span v-if="word.type && showTypes" class="word-type">{{ getLocalizedText(word.type) }}</span>
        </div>

        <!-- Connection count badge -->
        <div v-if="getConnectionCount(word.id) > 0" class="connection-badge">
          {{ getConnectionCount(word.id) }}
        </div>
      </div>

      <!-- Central Star (the main word) -->
      <div class="central-star" :style="getCentralStyle()">
        <div class="star-glow"></div>
        <div class="star-core">
          <span>{{ centralWordText }}</span>
        </div>
      </div>
    </div>

    <!-- Relationship Types Legend -->
    <div v-if="step.showLegend !== false" class="mt-4 flex flex-wrap justify-center gap-2">
      <div
        v-for="relType in relationshipTypes"
        :key="relType.type"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border"
        :class="relType.class"
      >
        <span>{{ relType.icon }}</span>
        <span class="font-medium">{{ relType.label }}</span>
      </div>
    </div>

    <!-- Progress & Feedback -->
    <div class="mt-5">
      <div class="flex items-center gap-3 mb-3">
        <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-violet-500 rounded-full transition-all duration-500"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <span class="text-xs font-semibold text-slate-500">
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
        class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
      >
        Reset
      </button>
      <button
        v-if="isComplete"
        @click="$emit('complete', true)"
        class="step-btn-primary step-btn-success"
      >
        Constellation Complete!
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { getLocalizedText } from '@/composables/useLanguage';

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
  { type: 'synonym', label: 'Synonym', icon: '≈', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { type: 'antonym', label: 'Antonym', icon: '↔', class: 'bg-red-50 text-red-600 border-red-100' },
  { type: 'related', label: 'Related', icon: '→', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { type: 'category', label: 'Category', icon: '⊂', class: 'bg-violet-50 text-violet-600 border-violet-100' }
];

// Computed
const centralWordText = computed(() => {
  if (typeof props.step.centralWord === 'object' && props.step.centralWord !== null) {
    return getLocalizedText(props.step.centralWord.text) || 'Center';
  }
  return getLocalizedText(props.step.centralWord);
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
  height: 420px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 50%, #e0e7ff 100%);
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.6);
}

/* Background dot twinkle */
.twinkle {
  animation: twinkle 3s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.4; }
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
  inset: -6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.word-node:hover .word-glow,
.word-node.connected .word-glow {
  opacity: 1;
}

.word-node.dragging .word-glow {
  opacity: 1;
  animation: node-pulse 1s ease infinite;
}

@keyframes node-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.word-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 16px;
  background: white;
  border-radius: 0.75rem;
  border: 1.5px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.25s ease;
}

.word-node:hover .word-content {
  transform: scale(1.04);
  border-color: #a5b4fc;
}

.word-node.connected .word-content {
  background: rgba(139, 92, 246, 0.04);
  border-color: #8b5cf6;
}

.word-node.hovering .word-content {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);
}

.word-text {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.word-type {
  font-size: 9px;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 1px;
}

.connection-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #7c3aed;
  color: white;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(124, 58, 237, 0.3);
}

/* Central star */
.central-star {
  position: absolute;
  z-index: 5;
}

.star-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
  animation: star-pulse 2s ease-in-out infinite;
}

@keyframes star-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

.star-core {
  padding: 12px 22px;
  background: white;
  border: 2px solid #8b5cf6;
  border-radius: 0.75rem;
  color: #5b21b6;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.15);
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
  animation: node-shake 0.5s ease;
}

@keyframes node-shake {
  0%, 100% { transform: translate(-50%, -50%); }
  20% { transform: translate(-50%, -50%) translateX(-4px); }
  40% { transform: translate(-50%, -50%) translateX(4px); }
  60% { transform: translate(-50%, -50%) translateX(-4px); }
  80% { transform: translate(-50%, -50%) translateX(4px); }
}
</style>
