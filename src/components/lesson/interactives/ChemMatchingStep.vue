<template>
  <div class="matching-exercise-container">
    <!-- Header -->
    <div class="matching-header">
      <div class="matching-badge">
        <span class="badge-icon">🔗</span>
        <span class="badge-text">Matching Exercise</span>
      </div>
      <p class="matching-prompt">
        {{ getLocalizedText(step.prompt) }}
      </p>
    </div>

    <!-- Matching Grid -->
    <div class="matching-grid">
      <!-- Left Column -->
      <div class="matching-column left-column">
        <h3 class="column-header">
          <span class="header-icon">📋</span>
          {{ leftHeader }}
        </h3>
        <div class="items-list">
          <button
            v-for="pair in normalizedPairs"
            :key="`left-${pair.id}`"
            @click="handleSelection('left', pair.id)"
            class="matching-item"
            :class="getItemClass(pair.id, 'left')"
          >
            <span class="item-text">{{ getLeftText(pair) }}</span>
            <span v-if="matchedIds.includes(pair.id)" class="matched-check">✓</span>
          </button>
        </div>
      </div>

      <!-- Connection Line Visual -->
      <div class="connection-indicator">
        <div class="connection-line"></div>
        <span class="connection-icon">↔</span>
        <div class="connection-line"></div>
      </div>

      <!-- Right Column -->
      <div class="matching-column right-column">
        <h3 class="column-header">
          <span class="header-icon">🎯</span>
          {{ rightHeader }}
        </h3>
        <div class="items-list">
          <button
            v-for="pair in shuffledPairs"
            :key="`right-${pair.id}`"
            @click="handleSelection('right', pair.id)"
            class="matching-item"
            :class="getItemClass(pair.id, 'right')"
          >
            <span class="item-text">{{ getRightText(pair) }}</span>
            <span v-if="matchedIds.includes(pair.id)" class="matched-check">✓</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="matching-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${(matchedIds.length / normalizedPairs.length) * 100}%` }"
        ></div>
      </div>
      <span class="progress-text">{{ matchedIds.length }} / {{ normalizedPairs.length }} matched</span>
    </div>

    <!-- Feedback Area -->
    <transition name="feedback-slide">
      <div
        v-if="feedback.text"
        class="matching-feedback"
        :class="feedback.type === 'correct' ? 'feedback-success' : 'feedback-error'"
      >
        <span class="feedback-icon">{{ feedback.type === 'correct' ? '✅' : '❌' }}</span>
        <span class="feedback-text">{{ feedback.text }}</span>
      </div>
    </transition>

    <!-- Completion Message -->
    <transition name="complete-bounce">
      <div v-if="isComplete" class="completion-card">
        <div class="completion-icon">🎉</div>
        <h4 class="completion-title">Excellent Work!</h4>
        <p class="completion-text">You matched all pairs correctly!</p>
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
.matching-exercise-container {
  padding: 1.5rem;
  background: linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%);
  border-radius: 20px;
  min-height: 100%;
}

.matching-header {
  text-align: center;
  margin-bottom: 2rem;
}

.matching-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-radius: 100px;
  margin-bottom: 1rem;
}

.badge-icon {
  font-size: 1.25rem;
}

.badge-text {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.matching-prompt {
  font-size: 1.125rem;
  color: #374151;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.matching-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: start;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .matching-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .connection-indicator {
    display: none;
  }
}

.matching-column {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f3f4f6;
}

.header-icon {
  font-size: 1rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.matching-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 2px solid transparent;
  font-weight: 500;
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-text {
  flex: 1;
}

.matched-check {
  width: 24px;
  height: 24px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
}

.item-default {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #374151;
}

.item-default:hover {
  background: #f3f4f6;
  border-color: #a855f7;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
}

.item-selected {
  background: linear-gradient(135deg, #f3e8ff, #e0e7ff);
  border-color: #a855f7;
  color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
  transform: scale(1.02);
}

.item-matched {
  background: linear-gradient(135deg, #dcfce7, #d1fae5);
  border-color: #10b981;
  color: #047857;
  cursor: default;
}

.item-error {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.connection-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.connection-line {
  width: 2px;
  height: 40px;
  background: linear-gradient(180deg, #a855f7, #6366f1);
  border-radius: 2px;
}

.connection-icon {
  font-size: 1.5rem;
  color: #a855f7;
  margin: 0.5rem 0;
}

.matching-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 100px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #a855f7, #10b981);
  border-radius: 100px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}

.matching-feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  margin-bottom: 1rem;
}

.feedback-success {
  background: linear-gradient(135deg, #dcfce7, #d1fae5);
  color: #047857;
}

.feedback-error {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #dc2626;
}

.feedback-icon {
  font-size: 1.25rem;
}

.feedback-text {
  font-size: 1rem;
}

.completion-card {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #dcfce7, #d1fae5);
  border-radius: 16px;
  border: 2px solid #10b981;
}

.completion-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.completion-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #047857;
  margin: 0 0 0.5rem 0;
}

.completion-text {
  color: #059669;
  font-size: 1rem;
  margin: 0;
}

/* Transitions */
.feedback-slide-enter-active,
.feedback-slide-leave-active {
  transition: all 0.3s ease;
}

.feedback-slide-enter-from,
.feedback-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.complete-bounce-enter-active {
  animation: bounce-in 0.5s ease;
}

@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
