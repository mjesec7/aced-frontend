<template>
  <div class="interactive-step step-animate-in">
    <p class="text-base text-slate-600 mb-5 leading-relaxed">
      {{ getLocalizedText(step.prompt) || 'Arrange the words in the correct order' }}
    </p>

    <!-- Drag Container -->
    <div
      class="bg-slate-50/80 p-5 rounded-xl border min-h-[80px] flex flex-wrap gap-2.5 items-center transition-all duration-200"
      :class="dragging ? 'border-violet-300 bg-violet-50/30' : 'border-slate-200/60'"
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
        class="px-4 py-2 rounded-lg font-medium transition-all duration-200 select-none border"
        :class="{
          'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default': isCorrect,
          'bg-white text-slate-800 border-slate-200 cursor-grab active:cursor-grabbing hover:border-violet-300 hover:shadow-sm active:scale-95': !isCorrect
        }"
      >
        {{ word }}
      </div>

      <span v-if="words.length === 0" class="text-slate-400 italic text-sm">
        Loading words...
      </span>
    </div>

    <!-- Hint -->
    <p class="text-xs text-slate-500 flex items-center gap-1.5 mt-2.5 mb-5">
      <span class="text-sm">💡</span>
      Drag words to reorder them
    </p>

    <!-- Preview -->
    <div class="bg-white p-3.5 rounded-xl border border-slate-200/60 mb-5">
      <span class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Preview</span>
      <p class="text-base text-slate-800 font-serif leading-relaxed">{{ words.join(' ') }}</p>
    </div>

    <!-- Feedback -->
    <div v-if="feedback" class="step-feedback mb-4" :class="isCorrect ? 'success' : 'error'">
      {{ feedback }}
    </div>

    <button
      @click="checkSentence"
      :disabled="isCorrect"
      class="step-btn-primary"
      :class="{ 'step-btn-success': isCorrect }"
    >
      {{ isCorrect ? 'Correct!' : 'Check Sentence' }}
    </button>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useLanguage } from '@/composables/useLanguage';

const { getLocalizedText } = useLanguage();

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const words = ref([]);
const dragFromIndex = ref(null);
const feedback = ref('');
const isCorrect = ref(false);
const dragging = ref(false);

const normalizedCorrectOrder = computed(() => {
  const order = props.step?.correctOrder || props.step?.correct_order || props.step?.content?.correctOrder || [];
  if (!Array.isArray(order)) return [];
  return order.map(word => getLocalizedText(word) || String(word));
});

watch(() => props.step, () => {
  const scrambled = props.step?.scrambledOptions || props.step?.scrambled_options || props.step?.content?.scrambledOptions;
  if (scrambled?.length) {
    words.value = scrambled.map(word => getLocalizedText(word) || String(word));
  } else if (normalizedCorrectOrder.value.length > 0) {
    words.value = [...normalizedCorrectOrder.value].sort(() => Math.random() - 0.5);
  } else {
    words.value = [];
  }
  feedback.value = '';
  isCorrect.value = false;
}, { immediate: true });

const onDragStart = (index) => { dragFromIndex.value = index; feedback.value = ''; };

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
  const correct = words.value.join(' ') === normalizedCorrectOrder.value.join(' ');
  if (correct) {
    feedback.value = 'Perfect! The sentence is in the correct order.';
    isCorrect.value = true;
    emit('complete', true);
  } else {
    feedback.value = 'Not quite. Try rearranging the words again.';
    isCorrect.value = false;
    emit('complete', false);
  }
};
</script>
