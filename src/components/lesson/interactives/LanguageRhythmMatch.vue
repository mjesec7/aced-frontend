<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="text-center mb-6">
      <div class="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-100 to-teal-100 border border-cyan-200 mb-4">
        <span class="text-2xl">🎵</span>
        <span class="font-bold text-cyan-700">Rhythm Match</span>
      </div>
      <p class="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
        {{ step.prompt || 'Match sentences with the same stress pattern (rhythm)' }}
      </p>
    </div>

    <!-- Audio Visualization Legend -->
    <div class="flex justify-center gap-6 mb-6">
      <div class="flex items-center gap-2">
        <div class="w-4 h-8 rounded bg-cyan-500"></div>
        <span class="text-sm text-gray-600">Stressed syllable</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-cyan-300"></div>
        <span class="text-sm text-gray-600">Unstressed syllable</span>
      </div>
    </div>

    <!-- Target Pattern -->
    <div class="mb-8">
      <div class="text-center mb-3">
        <span class="text-sm font-bold text-gray-500 uppercase tracking-wider">Target Rhythm Pattern</span>
      </div>
      <div class="target-pattern-card">
        <!-- Waveform Visualization -->
        <div class="waveform-container mb-4">
          <div
            v-for="(beat, idx) in step.targetPattern"
            :key="idx"
            class="waveform-bar"
            :class="beat === 1 ? 'stressed' : 'unstressed'"
            :style="{ animationDelay: idx * 0.1 + 's' }"
          ></div>
        </div>

        <!-- Pattern notation -->
        <div class="flex justify-center gap-2 mb-3">
          <span
            v-for="(beat, idx) in step.targetPattern"
            :key="`notation-${idx}`"
            class="text-2xl"
          >
            {{ beat === 1 ? '●' : '○' }}
          </span>
        </div>

        <!-- Example sentence -->
        <p class="text-lg text-gray-800 font-medium text-center">
          "{{ step.targetSentence }}"
        </p>
        <p class="text-sm text-gray-500 text-center mt-2">
          {{ getPatternName(step.targetPattern) }}
        </p>

        <!-- Play button -->
        <button
          @click="playPattern(step.targetPattern)"
          class="mt-4 mx-auto flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-700 font-medium transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hear Rhythm
        </button>
      </div>
    </div>

    <!-- Sentence Options -->
    <div class="space-y-4 mb-6">
      <p class="text-center text-gray-600 font-medium">Which sentence has the same rhythm?</p>

      <div
        v-for="(option, idx) in step.options"
        :key="idx"
        @click="selectOption(idx)"
        class="option-card"
        :class="{
          'selected': selectedOption === idx,
          'correct': showResult && isCorrectOption(idx),
          'incorrect': showResult && selectedOption === idx && !isCorrectOption(idx)
        }"
      >
        <!-- Mini waveform -->
        <div class="mini-waveform">
          <div
            v-for="(beat, beatIdx) in option.pattern"
            :key="beatIdx"
            class="mini-bar"
            :class="beat === 1 ? 'stressed' : 'unstressed'"
          ></div>
        </div>

        <!-- Sentence -->
        <div class="flex-1">
          <p class="text-gray-800 font-medium">{{ option.sentence }}</p>
          <p v-if="showResult && isCorrectOption(idx)" class="text-sm text-green-600 mt-1">
            Pattern: {{ option.pattern.map(b => b === 1 ? '●' : '○').join(' ') }}
          </p>
        </div>

        <!-- Play button -->
        <button
          @click.stop="playPattern(option.pattern)"
          class="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
        </button>

        <!-- Selection indicator -->
        <div v-if="selectedOption === idx" class="selection-indicator">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Pattern Explanation (shown after answer) -->
    <transition name="slide-fade">
      <div v-if="showResult && step.explanation" class="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div class="flex items-start gap-3">
          <span class="text-xl">💡</span>
          <div>
            <p class="font-semibold text-blue-800 mb-1">Understanding Rhythm</p>
            <p class="text-blue-700 text-sm">{{ step.explanation }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Feedback -->
    <div class="step-feedback" :class="feedbackClass">
      {{ feedback }}
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-start gap-3 mt-4">
      <button
        v-if="!showResult"
        @click="checkAnswer"
        :disabled="selectedOption === null"
        class="px-8 py-3 rounded-full font-bold text-white shadow-md transition-all active:scale-95"
        :class="selectedOption !== null
          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700'
          : 'bg-gray-300 cursor-not-allowed'"
      >
        Check Rhythm
      </button>
      <button
        v-else
        @click="$emit('complete', isCorrect)"
        class="px-8 py-3 rounded-full font-bold text-white shadow-md transition-all"
        :class="isCorrect
          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
          : 'bg-gradient-to-r from-cyan-600 to-teal-600'"
      >
        {{ isCorrect ? 'Continue →' : 'Try Another →' }}
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

// Audio context for playing rhythm
let audioContext = null;

// State
const selectedOption = ref(null);
const showResult = ref(false);
const feedback = ref('');
const isCorrect = ref(false);

// Computed
const feedbackClass = computed(() => {
  if (!feedback.value) return '';
  return isCorrect.value ? 'success' : 'error';
});

// Initialize
watch(() => props.step, () => {
  selectedOption.value = null;
  showResult.value = false;
  feedback.value = '';
  isCorrect.value = false;
}, { immediate: true });

// Methods
const selectOption = (idx) => {
  if (showResult.value) return;
  selectedOption.value = idx;
  feedback.value = '';
};

const isCorrectOption = (idx) => {
  return props.step.correctIndex === idx;
};

const checkAnswer = () => {
  if (selectedOption.value === null) return;

  showResult.value = true;
  isCorrect.value = selectedOption.value === props.step.correctIndex;

  if (isCorrect.value) {
    feedback.value = '🎵 Perfect! You matched the rhythm correctly!';
    emit('complete', true);
  } else {
    feedback.value = '❌ Not quite. Listen to the patterns again - the stress falls on different syllables.';
    emit('complete', false);
  }
};

const getPatternName = (pattern) => {
  // Common poetic meter names
  const patternStr = pattern.join('');

  const patterns = {
    '01': 'Iambic (da-DUM)',
    '10': 'Trochaic (DUM-da)',
    '001': 'Anapestic (da-da-DUM)',
    '100': 'Dactylic (DUM-da-da)',
    '0101': 'Iambic dimeter',
    '1010': 'Trochaic dimeter',
    '010101': 'Iambic trimeter',
    '01010101': 'Iambic tetrameter',
    '0101010101': 'Iambic pentameter'
  };

  // Check for repeating patterns
  if (patternStr.match(/^(01)+$/)) return `Iambic (${pattern.length / 2} feet)`;
  if (patternStr.match(/^(10)+$/)) return `Trochaic (${pattern.length / 2} feet)`;
  if (patternStr.match(/^(001)+$/)) return `Anapestic (${pattern.length / 3} feet)`;
  if (patternStr.match(/^(100)+$/)) return `Dactylic (${pattern.length / 3} feet)`;

  return patterns[patternStr] || 'Custom rhythm pattern';
};

const playPattern = async (pattern) => {
  try {
    // Create audio context on demand
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const tempo = 300; // ms per beat
    const now = audioContext.currentTime;

    pattern.forEach((beat, idx) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      // Higher pitch and volume for stressed syllables
      if (beat === 1) {
        osc.frequency.value = 600;
        gain.gain.value = 0.5;
      } else {
        osc.frequency.value = 400;
        gain.gain.value = 0.2;
      }

      osc.type = 'sine';

      const startTime = now + (idx * tempo) / 1000;
      const duration = 0.15;

      gain.gain.setValueAtTime(gain.gain.value, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.log('Audio not supported');
  }
};
</script>

<style scoped>
.target-pattern-card {
  background: linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%);
  border: 2px solid #22d3d1;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(34, 211, 238, 0.2);
}

.waveform-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 8px;
  height: 80px;
}

.waveform-bar {
  width: 24px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  animation: wave-bounce 1s ease infinite;
}

.waveform-bar.stressed {
  height: 70px;
  background: linear-gradient(180deg, #0891b2 0%, #06b6d4 100%);
}

.waveform-bar.unstressed {
  height: 35px;
  background: linear-gradient(180deg, #67e8f9 0%, #a5f3fc 100%);
}

@keyframes wave-bounce {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.1); }
}

.waveform-bar:nth-child(odd) {
  animation-delay: 0.1s;
}

/* Mini waveform for options */
.mini-waveform {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 40px;
  padding: 8px;
  background: #f1f5f9;
  border-radius: 12px;
  flex-shrink: 0;
}

.mini-bar {
  width: 8px;
  border-radius: 2px 2px 0 0;
}

.mini-bar.stressed {
  height: 32px;
  background: #06b6d4;
}

.mini-bar.unstressed {
  height: 16px;
  background: #a5f3fc;
}

/* Option cards */
.option-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.option-card:hover {
  border-color: #22d3d1;
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.15);
  transform: translateX(4px);
}

.option-card.selected {
  border-color: #0891b2;
  background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
  box-shadow: 0 4px 16px rgba(8, 145, 178, 0.2);
}

.option-card.correct {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.option-card.incorrect {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.selection-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0891b2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(8, 145, 178, 0.4);
}

.correct .selection-indicator {
  background: #10b981;
}

.incorrect .selection-indicator {
  background: #ef4444;
}

/* Feedback */
.step-feedback {
  min-height: 24px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 500;
}

.step-feedback:empty {
  display: none;
}

.step-feedback.success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.step-feedback.error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #991b1b;
  border: 1px solid #fca5a5;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.4s ease;
}

.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
