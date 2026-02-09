<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🌉</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Idiom Bridge</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ getLocalizedText(step.prompt) || 'Connect idioms with the same meaning across languages' }}
      </h2>
    </div>

    <!-- Language Labels -->
    <div class="flex justify-between mb-4 px-2">
      <div class="flex items-center gap-2">
        <span class="text-lg">{{ getLanguageFlag(step.sourceLanguage) }}</span>
        <span class="text-sm font-semibold text-slate-700">{{ getLocalizedText(step.sourceLanguage) || 'English' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-slate-700">{{ getLocalizedText(step.targetLanguage) || 'Spanish' }}</span>
        <span class="text-lg">{{ getLanguageFlag(step.targetLanguage) }}</span>
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
          stroke-width="2.5"
          fill="none"
          stroke-linecap="round"
          :class="{ 'animate-draw': conn.animate }"
        />
        <!-- Active connection being drawn -->
        <path
          v-if="activePath"
          :d="activePath"
          stroke="#8b5cf6"
          stroke-width="2"
          stroke-dasharray="6 4"
          fill="none"
          class="active-connection"
        />
      </svg>

      <!-- Two Columns Layout -->
      <div class="flex justify-between gap-6">
        <!-- Source Idioms (Left) -->
        <div class="flex-1 space-y-3">
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
              <p class="text-sm font-semibold text-slate-800">{{ getLocalizedText(idiom.text) }}</p>
              <p v-if="idiom.literal" class="text-xs text-slate-400 italic mt-0.5">
                (Literally: {{ getLocalizedText(idiom.literal) }})
              </p>
            </div>
            <div class="connection-dot right-dot" :class="{ 'dot-active': activeSource === idx }"></div>
          </div>
        </div>

        <!-- Bridge Visual (minimal) -->
        <div class="flex flex-col items-center justify-center px-2">
          <div class="w-px h-full bg-slate-200/60"></div>
        </div>

        <!-- Target Idioms (Right) -->
        <div class="flex-1 space-y-3">
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
              <p class="text-sm font-semibold text-slate-800">{{ getLocalizedText(idiom.text) }}</p>
              <p v-if="idiom.literal" class="text-xs text-slate-400 italic mt-0.5">
                (Literally: {{ getLocalizedText(idiom.literal) }})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Meaning Reveal (after correct match) -->
    <transition-group name="meaning-reveal" tag="div" class="mt-4 space-y-2">
      <div
        v-for="match in revealedMeanings"
        :key="match.id"
        class="px-4 py-2.5 bg-emerald-50/80 rounded-lg border border-emerald-100 text-sm"
      >
        <p class="text-emerald-700">
          <span class="font-semibold">Shared meaning:</span> {{ getLocalizedText(match.meaning) }}
        </p>
      </div>
    </transition-group>

    <!-- Progress -->
    <div class="mt-5 flex items-center gap-3">
      <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-violet-500 rounded-full transition-all duration-500"
          :style="{ width: `${(correctMatches.length / step.sourceIdioms.length) * 100}%` }"
        ></div>
      </div>
      <span class="text-xs font-semibold text-slate-500">
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
        class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
      >
        Reset All
      </button>
      <button
        v-if="allCorrect"
        @click="$emit('complete', true)"
        class="step-btn-primary step-btn-success"
      >
        Continue
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { getLocalizedText } from '@/composables/useLanguage';

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
      meaning: getLocalizedText(sourceIdiom.meaning) || getLocalizedText(targetIdiom.meaning) || 'These idioms share the same meaning!'
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
  min-height: 350px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.idiom-card {
  position: relative;
  padding: 12px 16px;
  border-radius: 0.75rem;
  border: 1.5px solid rgba(226, 232, 240, 0.6);
  background: white;
  cursor: pointer;
  transition: all 0.25s ease;
  z-index: 20;
}

.source-card {
  padding-right: 32px;
}

.target-card {
  padding-left: 32px;
}

.idiom-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.idiom-card.active {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.idiom-card.correct {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.04);
}

.idiom-card.incorrect {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.04);
  animation: card-shake 0.4s ease;
}

.idiom-card.hovering {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.03);
}

@keyframes card-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.connection-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.25s ease;
}

.right-dot {
  right: -6px;
}

.left-dot {
  left: -6px;
}

.dot-active {
  background: #8b5cf6;
  transform: translateY(-50%) scale(1.2);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.correct .connection-dot {
  background: #10b981;
}

.incorrect .connection-dot {
  background: #ef4444;
}

/* SVG Connections */
.animate-draw {
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
    stroke-dashoffset: -10;
  }
}

/* Meaning reveal animation */
.meaning-reveal-enter-active {
  animation: slide-in 0.35s ease;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
