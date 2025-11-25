<template>
  <div class="interactive-step step-animate-in">
    <p class="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
      {{ step.prompt }}
    </p>

    <!-- Available Words Area -->
    <div 
      class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border-2 transition-all duration-200 min-h-[120px]"
      :class="{
        'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-100 dark:ring-blue-800': draggedItem?.source === 'bag',
        'border-gray-200 dark:border-gray-700': draggedItem?.source !== 'bag'
      }"
      @dragover.prevent
      @drop="onDrop('available')"
    >
      <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        {{ availableLabel }}
      </h3>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(word, idx) in availableWords"
          :key="`${idx}-${word.text}`"
          :draggable="status !== 'correct'"
          @dragstart="onDragStart($event, 'available', idx)"
          @click="moveToBag(idx)"
          class="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-all active:scale-95 select-none cursor-grab active:cursor-grabbing"
          :class="{
            'hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm': status !== 'correct',
            'opacity-50 cursor-not-allowed': status === 'correct'
          }"
        >
          {{ word.text }}
        </div>
        <span v-if="availableWords.length === 0" class="text-gray-400 dark:text-gray-500 italic text-sm self-center">
          {{ emptyAvailableMessage }}
        </span>
      </div>
    </div>

    <!-- Bag / Suitcase -->
    <div class="flex flex-col items-center mt-8">
      <div class="relative w-full max-w-sm">
        <!-- Handle -->
        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-8 border-4 border-gray-400 dark:border-gray-500 rounded-t-xl z-0" />
        
        <!-- Case Body -->
        <div 
          class="relative z-10 bg-indigo-50 dark:bg-indigo-900/20 border-4 rounded-2xl p-6 min-h-[160px] shadow-lg flex flex-col items-center transition-all duration-200"
          :class="{
            'border-indigo-400 dark:border-indigo-500 bg-indigo-100 dark:bg-indigo-900/40 ring-4 ring-indigo-200 dark:ring-indigo-800 scale-[1.02]': draggedItem?.source === 'available',
            'border-indigo-200 dark:border-indigo-700': draggedItem?.source !== 'available'
          }"
          @dragover.prevent
          @drop="onDrop('bag')"
        >
          <h3 class="text-sm font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-wider mb-4">
            {{ bagLabel }}
          </h3>
          
          <div class="flex flex-wrap gap-2 justify-center w-full">
            <div 
              v-if="bagWords.length === 0"
              class="text-indigo-300 dark:text-indigo-500 text-sm italic py-4 border-2 border-dashed border-indigo-200 dark:border-indigo-700 rounded-lg w-full text-center pointer-events-none"
            >
              {{ emptyBagMessage }}
            </div>
            <div
              v-for="(word, idx) in bagWords"
              :key="`bag-${idx}-${word.text}`"
              :draggable="status !== 'correct'"
              @dragstart="onDragStart($event, 'bag', idx)"
              @click="removeFromBag(idx)"
              class="px-4 py-2 rounded-full border border-indigo-300 dark:border-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 font-medium transition-all active:scale-95 select-none cursor-grab active:cursor-grabbing group relative"
              :class="{
                'hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-700': status !== 'correct',
                'opacity-80 cursor-not-allowed': status === 'correct'
              }"
            >
              {{ word.text }}
              <span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 font-bold text-xs pointer-events-none text-red-500 dark:text-red-400">
                ✕
              </span>
            </div>
          </div>
        </div>

        <!-- Wheels -->
        <div class="flex justify-between px-8 -mt-3 relative z-20">
          <div class="w-6 h-6 bg-gray-800 dark:bg-gray-700 rounded-full shadow-md" />
          <div class="w-6 h-6 bg-gray-800 dark:bg-gray-700 rounded-full shadow-md" />
        </div>
      </div>
    </div>

    <!-- Feedback & Check -->
    <div class="step-feedback mt-6" :class="status === 'correct' ? 'success' : status === 'incorrect' ? 'error' : ''">
      {{ feedback }}
    </div>

    <div class="flex justify-start mt-4">
      <button
        @click="checkSelection"
        :disabled="status === 'correct'"
        class="px-8 py-3 rounded-full font-bold text-white shadow-md transition-transform active:scale-95"
        :class="{
          'bg-green-500 cursor-default': status === 'correct',
          'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700': status !== 'correct'
        }"
      >
        {{ status === 'correct' ? 'Correct!' : checkButtonLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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

const availableLabel = computed(() => props.step.availableLabel || 'Available Words');
const bagLabel = computed(() => {
  if (props.step.bagLabel) return props.step.bagLabel;
  const labels = {
    noun: 'Noun Bag',
    verb: 'Verb Collection',
    adj: 'Adjective Box',
    adv: 'Adverb Container'
  };
  return labels[targetPos.value] || 'Word Bag';
});
const emptyAvailableMessage = computed(() => props.step.emptyAvailableMessage || 'All words are in the bag.');
const emptyBagMessage = computed(() => props.step.emptyBagMessage || 'Drag words here');
const checkButtonLabel = computed(() => props.step.checkButtonLabel || 'Check Selection');

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
    feedback.value = props.step.successMessage || `✅ Perfect! All ${targetPos.value}s are in the bag.`;
    status.value = 'correct';
    emit('complete', true);
  } else if (nonTargetInBag.length > 0) {
    feedback.value = props.step.extraWordsMessage || `❌ You included non-${targetPos.value}s in the bag. Remove them.`;
    status.value = 'incorrect';
    emit('complete', false);
  } else {
    feedback.value = props.step.missingWordsMessage || `❌ You haven't added all ${targetPos.value}s yet.`;
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
