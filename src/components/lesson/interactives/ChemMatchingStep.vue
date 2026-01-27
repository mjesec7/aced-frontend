<template>
  <div class="interactive-step step-animate-in">
    <p class="text-lg text-gray-600 mb-6 leading-relaxed">
      {{ getLocalizedText(step.prompt) }}
    </p>

    <div class="grid grid-cols-2 gap-4 sm:gap-8">
      <!-- Left Column -->
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{{ leftHeader }}</h3>
        <div class="flex flex-col gap-2">
          <button
            v-for="pair in normalizedPairs"
            :key="`left-${pair.id}`"
            @click="handleSelection('left', pair.id)"
            class="w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 font-medium text-sm sm:text-base"
            :class="getItemClass(pair.id, 'left')"
          >
            {{ getLeftText(pair) }}
          </button>
        </div>
      </div>

      <!-- Right Column -->
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{{ rightHeader }}</h3>
        <div class="flex flex-col gap-2">
          <button
            v-for="pair in shuffledPairs"
            :key="`right-${pair.id}`"
            @click="handleSelection('right', pair.id)"
            class="w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 font-medium font-mono text-sm sm:text-base"
            :class="getItemClass(pair.id, 'right')"
          >
            {{ getRightText(pair) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Feedback Area -->
    <div class="h-8 flex items-center justify-center font-bold text-lg transition-colors duration-300 mt-6">
      <span :class="feedback.type === 'correct' ? 'text-green-600' : 'text-red-500'">
        {{ feedback.text }}
      </span>
    </div>

    <div v-if="isComplete" class="bg-green-100 text-green-800 p-4 rounded-xl text-center font-bold mt-4">
      🎉 Great job! You matched all correctly.
    </div>
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
  // Try different locations for pairs data
  const pairs = props.step?.pairs || props.step?.items || props.step?.content?.pairs || [];
  if (!Array.isArray(pairs) || pairs.length === 0) {
    console.warn('ChemMatchingStep: No pairs found in step data', props.step);
    return [];
  }
  // Ensure each pair has an id
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
    feedback.value = { text: '✅ Correct match!', type: 'correct' };
    selectedLeftId.value = null;
    selectedRightId.value = null;
  } else {
    // Incorrect match
    feedback.value = { text: '❌ Not a correct pair. Try again.', type: 'wrong' };
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
    return "border-green-500 bg-green-50 text-green-700 cursor-default shadow-none";
  }
  if (isError) {
    return "border-red-500 bg-red-50 text-red-700 animate-pulse";
  }
  if (isSelected) {
    return "border-purple-500 bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-200";
  }
  return "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";
};
</script>
