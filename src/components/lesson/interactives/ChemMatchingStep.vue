<template>
  <div class="interactive-step step-animate-in">
    <p class="text-lg text-gray-600 mb-6 leading-relaxed">
      {{ step.prompt }}
    </p>

    <div class="grid grid-cols-2 gap-4 sm:gap-8">
      <!-- Names Column -->
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Names</h3>
        <div class="flex flex-col gap-2">
          <button
            v-for="pair in step.pairs"
            :key="`name-${pair.id}`"
            @click="handleSelection('name', pair.id)"
            class="w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 font-medium text-sm sm:text-base"
            :class="getItemClass(pair.id, 'name')"
          >
            {{ pair.name }}
          </button>
        </div>
      </div>

      <!-- Formulas Column -->
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Formulas</h3>
        <div class="flex flex-col gap-2">
          <button
            v-for="pair in shuffledPairs"
            :key="`formula-${pair.id}`"
            @click="handleSelection('formula', pair.id)"
            class="w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 font-medium font-mono text-sm sm:text-base"
            :class="getItemClass(pair.id, 'formula')"
          >
            {{ pair.formula }}
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

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const selectedNameId = ref(null);
const selectedFormulaId = ref(null);
const matchedIds = ref([]);
const feedback = ref({ text: '', type: null });

// Shuffle formulas once when step changes
const shuffledPairs = computed(() => {
  return [...props.step.pairs].sort(() => Math.random() - 0.5);
});

const isComplete = computed(() => matchedIds.value.length === props.step.pairs.length);

watch(isComplete, (complete) => {
  if (complete) {
    emit('complete', true);
  }
});

const handleSelection = (type, id) => {
  if (matchedIds.value.includes(id)) return; // Already matched
  if (type === 'name' && selectedNameId.value === id) return; // Already selected
  if (type === 'formula' && selectedFormulaId.value === id) return; // Already selected

  // Clear feedback when making a new selection
  if (feedback.value.type === 'wrong') {
    feedback.value = { text: '', type: null };
  }

  if (type === 'name') {
    selectedNameId.value = id;
    if (selectedFormulaId.value !== null) {
      checkMatch(id, selectedFormulaId.value);
    }
  } else {
    selectedFormulaId.value = id;
    if (selectedNameId.value !== null) {
      checkMatch(selectedNameId.value, id);
    }
  }
};

const checkMatch = (nameId, formulaId) => {
  if (nameId === formulaId) {
    // Correct match
    matchedIds.value = [...matchedIds.value, nameId];
    feedback.value = { text: '✅ Correct match!', type: 'correct' };
    selectedNameId.value = null;
    selectedFormulaId.value = null;
  } else {
    // Incorrect match
    feedback.value = { text: '❌ Not a correct pair. Try again.', type: 'wrong' };
    // Delay clearing to let user see what they clicked
    setTimeout(() => {
      selectedNameId.value = null;
      selectedFormulaId.value = null;
      if (feedback.value.type === 'wrong') {
        feedback.value = { text: '', type: null };
      }
    }, 1000);
  }
};

const getItemClass = (id, type) => {
  const isMatched = matchedIds.value.includes(id);
  const isSelected = type === 'name' ? selectedNameId.value === id : selectedFormulaId.value === id;
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
