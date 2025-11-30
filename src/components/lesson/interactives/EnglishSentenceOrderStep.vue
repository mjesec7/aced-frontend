<template>
  <div class="interactive-step step-animate-in">
    <p class="text-lg text-gray-600 mb-6 leading-relaxed">
      {{ step.prompt }}
    </p>

    <!-- Drag Container -->
    <div 
      class="bg-gray-50 p-6 rounded-xl border border-gray-200 min-h-[100px] flex flex-wrap gap-3 items-center"
      :class="{ 'bg-blue-50 border-blue-200 dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop="dragging = false"
    >
      <div
        v-for="(word, index) in words"
        :key="`${index}-${word}`"
        :draggable="!isCorrect"
        @dragstart="onDragStart(index)"
        @dragover.prevent
        @drop="onDrop(index)"
        class="px-4 py-2 rounded-full font-medium shadow-sm transition-all duration-200 select-none"
        :class="{
          'bg-green-100 text-green-800 border border-green-200 cursor-default': isCorrect,
          'bg-white text-gray-800 border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 hover:text-blue-600 active:scale-95': !isCorrect
        }"
      >
        {{ word }}
      </div>
      
      <span v-if="words.length === 0" class="text-gray-400 italic">
        Loading words...
      </span>
    </div>

    <!-- Hint -->
    <p class="text-sm text-gray-500 italic flex items-center gap-2 mb-6">
      <span class="text-lg">💡</span>
      Hint: Drag words to reorder them.
    </p>

    <!-- Preview -->
    <div class="bg-white p-4 rounded-lg border border-gray-100 shadow-sm mb-6">
      <span class="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
        Preview
      </span>
      <p class="text-lg text-gray-800 font-serif">
        {{ words.join(' ') }}
      </p>
    </div>

    <!-- Feedback & Check -->
    <div class="step-feedback mb-4" :class="isCorrect ? 'success' : 'error'">
      {{ feedback }}
    </div>

    <button
      @click="checkSentence"
      :disabled="isCorrect"
      class="px-6 py-3 rounded-full font-bold text-white shadow-md transition-transform active:scale-95"
      :class="{
        'bg-green-500 cursor-default': isCorrect,
        'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700': !isCorrect
      }"
    >
      {{ isCorrect ? '✓ Correct!' : 'Check Sentence' }}
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const words = ref([]);
const dragFromIndex = ref(null);
const feedback = ref('');
const isCorrect = ref(false);
const dragging = ref(false);

// Initialize
watch(() => props.step, () => {
  if (props.step.scrambledOptions?.length) {
    words.value = [...props.step.scrambledOptions];
  } else {
    words.value = [...props.step.correctOrder].sort(() => Math.random() - 0.5);
  }
  feedback.value = '';
  isCorrect.value = false;
}, { immediate: true });

const onDragStart = (index) => {
  dragFromIndex.value = index;
  feedback.value = '';
};

const onDrop = (dropIndex) => {
  if (dragFromIndex.value === null || dragFromIndex.value === dropIndex) return;

  const newWords = [...words.value];
  const [movedItem] = newWords.splice(dragFromIndex.value, 1);
  newWords.splice(dropIndex, 0, movedItem);

  words.value = newWords;
  dragFromIndex.value = null;
  isCorrect.value = false;
};

const checkSentence = () => {
  const correct = words.value.join(' ') === props.step.correctOrder.join(' ');

  if (correct) {
    feedback.value = '✅ Perfect! The sentence is in the correct order.';
    isCorrect.value = true;
    emit('complete', true);
  } else {
    feedback.value = '❌ Not quite. Try rearranging the words again.';
    isCorrect.value = false;
    emit('complete', false);
  }
};
</script>
