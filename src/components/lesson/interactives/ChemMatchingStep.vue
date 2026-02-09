<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🔗</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Matching Exercise</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ getLocalizedText(step.prompt) }}
      </h2>
    </div>

    <!-- Matching Grid -->
    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 mb-4">
      <!-- Left Column -->
      <div class="bg-white rounded-xl border border-slate-200/60 p-4">
        <h3 class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-2.5 border-b border-slate-100">
          <span class="text-sm">📋</span>
          {{ leftHeader }}
        </h3>
        <div class="flex flex-col gap-2.5">
          <button
            v-for="pair in normalizedPairs"
            :key="`left-${pair.id}`"
            @click="handleSelection('left', pair.id)"
            class="matching-item"
            :class="getItemClass(pair.id, 'left')"
          >
            <span class="flex-1 text-left">{{ getLeftText(pair) }}</span>
            <span
              v-if="matchedIds.includes(pair.id)"
              class="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            >
              ✓
            </span>
          </button>
        </div>
      </div>

      <!-- Connection Indicator -->
      <div class="hidden md:flex flex-col items-center justify-center py-6">
        <div class="w-0.5 h-8 bg-gradient-to-b from-violet-300 to-indigo-300 rounded-full"></div>
        <span class="text-violet-400 text-lg my-1.5">↔</span>
        <div class="w-0.5 h-8 bg-gradient-to-b from-indigo-300 to-violet-300 rounded-full"></div>
      </div>

      <!-- Right Column -->
      <div class="bg-white rounded-xl border border-slate-200/60 p-4">
        <h3 class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-2.5 border-b border-slate-100">
          <span class="text-sm">🎯</span>
          {{ rightHeader }}
        </h3>
        <div class="flex flex-col gap-2.5">
          <button
            v-for="pair in shuffledPairs"
            :key="`right-${pair.id}`"
            @click="handleSelection('right', pair.id)"
            class="matching-item"
            :class="getItemClass(pair.id, 'right')"
          >
            <span class="flex-1 text-left">{{ getRightText(pair) }}</span>
            <span
              v-if="matchedIds.includes(pair.id)"
              class="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            >
              ✓
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="bg-slate-50/80 rounded-xl border border-slate-200/60 p-3 flex items-center gap-3 mb-4">
      <div class="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-500"
          :style="{ width: `${(matchedIds.length / normalizedPairs.length) * 100}%` }"
        ></div>
      </div>
      <span class="text-xs font-semibold text-slate-500 whitespace-nowrap">{{ matchedIds.length }} / {{ normalizedPairs.length }} matched</span>
    </div>

    <!-- Feedback -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="feedback.text"
        class="flex items-start gap-3 p-4 rounded-xl border mb-4"
        :class="feedback.type === 'correct'
          ? 'bg-emerald-50/50 border-emerald-200/60'
          : 'bg-red-50/50 border-red-200/60'"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base shrink-0"
          :class="feedback.type === 'correct' ? 'bg-emerald-500' : 'bg-red-500'"
        >
          {{ feedback.type === 'correct' ? '✅' : '❌' }}
        </div>
        <div class="pt-0.5">
          <h4 class="text-sm font-bold mb-0.5" :class="feedback.type === 'correct' ? 'text-emerald-700' : 'text-red-700'">
            {{ feedback.type === 'correct' ? 'Match!' : 'Try again' }}
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed">{{ feedback.text }}</p>
        </div>
      </div>
    </transition>

    <!-- Completion Card -->
    <transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
    >
      <div
        v-if="isComplete"
        class="flex flex-col items-center gap-2 p-6 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-center"
      >
        <div
          class="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-2xl"
        >
          🎉
        </div>
        <h4 class="text-lg font-bold text-emerald-700">Excellent Work!</h4>
        <p class="text-sm text-emerald-600">You matched all pairs correctly!</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useLanguage } from '@/composables/useLanguage';

const { getLocalizedText } = useLanguage();

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const selectedLeftId = ref(null);
const selectedRightId = ref(null);
const matchedIds = ref([]);
const feedback = ref({ text: '', type: null });

// Dynamic headers based on content
const leftHeader = computed(() => {
  return getLocalizedText(props.step.leftHeader) || getLocalizedText(props.step.termHeader) || 'Items';
});

const rightHeader = computed(() => {
  return getLocalizedText(props.step.rightHeader) || getLocalizedText(props.step.definitionHeader) || 'Matches';
});

// Helper to get left column text (supports name, term, left, key)
const getLeftText = (pair) => {
  return getLocalizedText(pair.name) ||
         getLocalizedText(pair.term) ||
         getLocalizedText(pair.left) ||
         getLocalizedText(pair.key) ||
         'Item';
};

// Helper to get right column text (supports formula, definition, right, value)
const getRightText = (pair) => {
  return getLocalizedText(pair.formula) ||
         getLocalizedText(pair.definition) ||
         getLocalizedText(pair.right) ||
         getLocalizedText(pair.value) ||
         'Match';
};

// Normalize pairs - handle different data structures
const normalizedPairs = computed(() => {
  const pairs = props.step?.pairs || props.step?.items || props.step?.content?.pairs || [];
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return [];
  }
  return pairs.map((pair, index) => ({
    ...pair,
    id: pair.id ?? index
  }));
});

// Shuffle right column once when step changes
const shuffledPairs = computed(() => {
  if (normalizedPairs.value.length === 0) return [];
  return [...normalizedPairs.value].sort(() => Math.random() - 0.5);
});

const isComplete = computed(() => normalizedPairs.value.length > 0 && matchedIds.value.length === normalizedPairs.value.length);

watch(isComplete, (complete) => {
  if (complete) {
    emit('complete', true);
  }
});

const handleSelection = (type, id) => {
  if (matchedIds.value.includes(id)) return; // Already matched
  if (type === 'left' && selectedLeftId.value === id) return; // Already selected
  if (type === 'right' && selectedRightId.value === id) return; // Already selected

  // Clear feedback when making a new selection
  if (feedback.value.type === 'wrong') {
    feedback.value = { text: '', type: null };
  }

  if (type === 'left') {
    selectedLeftId.value = id;
    if (selectedRightId.value !== null) {
      checkMatch(id, selectedRightId.value);
    }
  } else {
    selectedRightId.value = id;
    if (selectedLeftId.value !== null) {
      checkMatch(selectedLeftId.value, id);
    }
  }
};

const checkMatch = (leftId, rightId) => {
  if (leftId === rightId) {
    // Correct match
    matchedIds.value = [...matchedIds.value, leftId];
    feedback.value = { text: 'Correct match!', type: 'correct' };
    selectedLeftId.value = null;
    selectedRightId.value = null;
  } else {
    // Incorrect match
    feedback.value = { text: 'Not a correct pair. Try again.', type: 'wrong' };
    // Delay clearing to let user see what they clicked
    setTimeout(() => {
      selectedLeftId.value = null;
      selectedRightId.value = null;
      if (feedback.value.type === 'wrong') {
        feedback.value = { text: '', type: null };
      }
    }, 1000);
  }
};

const getItemClass = (id, type) => {
  const isMatched = matchedIds.value.includes(id);
  const isSelected = type === 'left' ? selectedLeftId.value === id : selectedRightId.value === id;
  const isError = feedback.value.type === 'wrong' && isSelected;

  if (isMatched) {
    return "item-matched";
  }
  if (isError) {
    return "item-error";
  }
  if (isSelected) {
    return "item-selected";
  }
  return "item-default";
};
</script>

<style scoped>
.matching-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid transparent;
  font-weight: 500;
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-default {
  background: #f8fafc;
  border-color: rgba(226, 232, 240, 0.8);
  color: #334155;
}

.item-default:hover {
  background: #f1f5f9;
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.item-selected {
  background: rgba(139, 92, 246, 0.06);
  border-color: #7c3aed;
  color: #6d28d9;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.15);
}

.item-matched {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.3);
  color: #047857;
  cursor: default;
}

.item-error {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
  animation: step-shake 0.4s ease-in-out;
}
</style>
