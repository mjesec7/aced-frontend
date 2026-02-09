<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🧳</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">{{ bagLabel }}</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ getLocalizedText(step.prompt) }}
      </h2>
    </div>

    <!-- Available Words Area -->
    <div
      class="bg-slate-50/80 p-4 rounded-xl border transition-all duration-200 min-h-[100px]"
      :class="{
        'border-violet-300 bg-violet-50/30 ring-1 ring-violet-100': draggedItem?.source === 'bag',
        'border-slate-200/60': draggedItem?.source !== 'bag'
      }"
      @dragover.prevent
      @drop="onDrop('available')"
    >
      <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
        {{ availableLabel }}
      </h3>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(word, idx) in availableWords"
          :key="`${idx}-${word.text}`"
          :draggable="status !== 'correct'"
          @dragstart="onDragStart($event, 'available', idx)"
          @click="moveToBag(idx)"
          class="px-3.5 py-1.5 rounded-lg border bg-white text-sm text-slate-700 font-medium transition-all select-none cursor-grab active:cursor-grabbing active:scale-95"
          :class="{
            'border-slate-200/60 hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-sm': status !== 'correct',
            'border-slate-200/60 opacity-50 cursor-not-allowed': status === 'correct'
          }"
        >
          {{ word.text }}
        </div>
        <span v-if="availableWords.length === 0" class="text-slate-400 italic text-xs self-center">
          {{ emptyAvailableMessage }}
        </span>
      </div>
    </div>

    <!-- Bag / Suitcase -->
    <div class="flex flex-col items-center mt-6">
      <div class="relative w-full max-w-sm">
        <!-- Handle -->
        <div class="suitcase-handle"></div>

        <!-- Case Body -->
        <div
          class="suitcase-body"
          :class="{ 'active': draggedItem?.source === 'available' }"
          @dragover.prevent
          @drop="onDrop('bag')"
        >
          <h3 class="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-3 text-center">
            {{ bagLabel }}
          </h3>

          <div class="flex flex-wrap gap-2 justify-center w-full">
            <div
              v-if="bagWords.length === 0"
              class="text-violet-300 text-xs italic py-3 border border-dashed border-violet-200/60 rounded-lg w-full text-center pointer-events-none"
            >
              {{ emptyBagMessage }}
            </div>
            <div
              v-for="(word, idx) in bagWords"
              :key="`bag-${idx}-${word.text}`"
              :draggable="status !== 'correct'"
              @dragstart="onDragStart($event, 'bag', idx)"
              @click="removeFromBag(idx)"
              class="px-3.5 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-sm font-medium transition-all select-none cursor-grab active:cursor-grabbing active:scale-95 group relative"
              :class="{
                'hover:bg-red-50 hover:text-red-600 hover:border-red-200': status !== 'correct',
                'opacity-80 cursor-not-allowed': status === 'correct'
              }"
            >
              {{ word.text }}
              <span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 font-bold text-[10px] pointer-events-none text-red-400">
                &#10005;
              </span>
            </div>
          </div>
        </div>

        <!-- Wheels -->
        <div class="suitcase-wheels">
          <div class="suitcase-wheel"></div>
          <div class="suitcase-wheel"></div>
        </div>
      </div>
    </div>

    <!-- Feedback & Check -->
    <div class="step-feedback mt-5" :class="status === 'correct' ? 'success' : status === 'incorrect' ? 'error' : ''">
      {{ feedback }}
    </div>

    <div class="flex justify-start mt-4">
      <button
        @click="checkSelection"
        :disabled="status === 'correct'"
        class="step-btn-primary"
        :class="{
          'step-btn-success cursor-default': status === 'correct',
        }"
      >
        {{ status === 'correct' ? 'Correct!' : checkButtonLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getLocalizedText } from '@/composables/useLanguage';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const availableWords = ref([]);
const bagWords = ref([]);
const feedback = ref('');
const status = ref('idle'); // 'idle' | 'correct' | 'incorrect'
const draggedItem = ref(null);

// Computed labels (support multilingual)
const targetPos = computed(() => props.step.targetPos || 'noun');

const availableLabel = computed(() => getLocalizedText(props.step.availableLabel) || 'Available Words');
const bagLabel = computed(() => {
  if (props.step.bagLabel) return getLocalizedText(props.step.bagLabel);
  const labels = {
    noun: 'Noun Bag',
    verb: 'Verb Collection',
    adj: 'Adjective Box',
    adv: 'Adverb Container'
  };
  return labels[targetPos.value] || 'Word Bag';
});
const emptyAvailableMessage = computed(() => getLocalizedText(props.step.emptyAvailableMessage) || 'All words are in the bag.');
const emptyBagMessage = computed(() => getLocalizedText(props.step.emptyBagMessage) || 'Drag words here');
const checkButtonLabel = computed(() => getLocalizedText(props.step.checkButtonLabel) || 'Check Selection');

// All target words (e.g., all nouns)
const allTargetWords = computed(() =>
  props.step.words.filter(w => w.pos === targetPos.value)
);

// Initialize
watch(() => props.step, () => {
  availableWords.value = [...props.step.words];
  bagWords.value = [];
  feedback.value = '';
  status.value = 'idle';
  draggedItem.value = null;
}, { immediate: true });

const moveToBag = (index) => {
  if (status.value === 'correct') return;

  const newAvailable = [...availableWords.value];
  const [movedWord] = newAvailable.splice(index, 1);

  availableWords.value = newAvailable;
  bagWords.value = [...bagWords.value, movedWord];

  feedback.value = '';
  status.value = 'idle';
};

const removeFromBag = (index) => {
  if (status.value === 'correct') return;

  const newBag = [...bagWords.value];
  const [movedWord] = newBag.splice(index, 1);

  bagWords.value = newBag;
  availableWords.value = [...availableWords.value, movedWord];

  feedback.value = '';
  status.value = 'idle';
};

const checkSelection = () => {
  const wordsInBag = bagWords.value.filter(w => w.pos === targetPos.value);
  const nonTargetInBag = bagWords.value.filter(w => w.pos !== targetPos.value);

  // Check if ALL target words are in the bag
  const allTargetFound = allTargetWords.value.every(target =>
    wordsInBag.some(w => w.text === target.text)
  );

  const noExtraWords = nonTargetInBag.length === 0;
  const isCorrect = allTargetFound && noExtraWords;

  if (isCorrect) {
    feedback.value = getLocalizedText(props.step.successMessage) || `✅ Perfect! All ${targetPos.value}s are in the bag.`;
    status.value = 'correct';
    emit('complete', true);
  } else if (nonTargetInBag.length > 0) {
    feedback.value = getLocalizedText(props.step.extraWordsMessage) || `❌ You included non-${targetPos.value}s in the bag. Remove them.`;
    status.value = 'incorrect';
    emit('complete', false);
  } else {
    feedback.value = getLocalizedText(props.step.missingWordsMessage) || `❌ You haven't added all ${targetPos.value}s yet.`;
    status.value = 'incorrect';
    emit('complete', false);
  }
};

// Drag Handlers
const onDragStart = (e, source, index) => {
  if (status.value === 'correct') {
    e.preventDefault();
    return;
  }
  draggedItem.value = { source, index };
  e.dataTransfer.effectAllowed = 'move';
};

const onDrop = (target) => {
  if (!draggedItem.value || status.value === 'correct') return;

  if (draggedItem.value.source === 'available' && target === 'bag') {
    moveToBag(draggedItem.value.index);
  } else if (draggedItem.value.source === 'bag' && target === 'available') {
    removeFromBag(draggedItem.value.index);
  }

  draggedItem.value = null;
};
</script>
