<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🎵</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Rhythm Match</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">
        {{ getLocalizedText(step.prompt) || 'Match sentences with the same stress pattern (rhythm)' }}
      </h2>
    </div>

    <!-- Audio Visualization Legend -->
    <div class="flex justify-center gap-5 mb-5">
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-6 rounded-sm bg-indigo-500"></div>
        <span class="text-xs text-slate-500">Stressed</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-indigo-300"></div>
        <span class="text-xs text-slate-500">Unstressed</span>
      </div>
    </div>

    <!-- Target Pattern -->
    <div class="mb-6">
      <div class="text-center mb-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Rhythm Pattern</span>
      </div>
      <div class="bg-slate-50/80 border border-slate-200/60 rounded-xl p-5">
        <!-- Waveform Visualization -->
        <div class="waveform-container mb-3">
          <div
            v-for="(beat, idx) in step.targetPattern"
            :key="idx"
            class="waveform-bar"
            :class="beat === 1 ? 'stressed' : 'unstressed'"
            :style="{ animationDelay: idx * 0.1 + 's' }"
          ></div>
        </div>

        <!-- Pattern notation -->
        <div class="flex justify-center gap-1.5 mb-2.5">
          <span
            v-for="(beat, idx) in step.targetPattern"
            :key="`notation-${idx}`"
            class="text-lg"
            :class="beat === 1 ? 'text-indigo-600' : 'text-slate-300'"
          >
            {{ beat === 1 ? '●' : '○' }}
          </span>
        </div>

        <!-- Example sentence -->
        <p class="text-base text-slate-800 font-medium text-center">
          "{{ getLocalizedText(step.targetSentence) }}"
        </p>
        <p class="text-xs text-slate-400 text-center mt-1.5">
          {{ getPatternName(step.targetPattern) }}
        </p>

        <!-- Play button -->
        <button
          @click="playPattern(step.targetPattern)"
          class="mt-3 mx-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium transition-colors cursor-pointer border border-indigo-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hear Rhythm
        </button>
      </div>
    </div>

    <!-- Sentence Options -->
    <div class="space-y-2.5 mb-5">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-1">Which sentence has the same rhythm?</p>

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
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-800 font-medium">{{ getLocalizedText(option.sentence) }}</p>
          <p v-if="showResult && isCorrectOption(idx)" class="text-xs text-emerald-600 mt-0.5">
            Pattern: {{ option.pattern.map(b => b === 1 ? '●' : '○').join(' ') }}
          </p>
        </div>

        <!-- Play button -->
        <button
          @click.stop="playPattern(option.pattern)"
          class="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
        </button>

        <!-- Selection indicator -->
        <div v-if="selectedOption === idx" class="selection-indicator">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Pattern Explanation (shown after answer) -->
    <transition name="slide-fade">
      <div v-if="showResult && step.explanation" class="mb-5 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
        <div class="flex items-start gap-2.5">
          <span class="text-sm">💡</span>
          <div>
            <p class="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">Understanding Rhythm</p>
            <p class="text-sm text-indigo-600/80 leading-relaxed">{{ getLocalizedText(step.explanation) }}</p>
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
        class="step-btn-primary"
        :class="{ 'opacity-40 cursor-not-allowed': selectedOption === null }"
      >
        Check Rhythm
      </button>
      <button
        v-else
        @click="$emit('complete', isCorrect)"
        class="step-btn-primary"
        :class="isCorrect ? 'step-btn-success' : ''"
      >
        {{ isCorrect ? 'Continue' : 'Try Another' }}
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
  return parseInt(props.step.correctIndex) === idx;
};

const checkAnswer = () => {
  if (selectedOption.value === null) {
    return;
  }

  showResult.value = true;

  // Robust comparison
  const correctIdx = parseInt(props.step.correctIndex);
  const selectedIdx = parseInt(selectedOption.value);

  isCorrect.value = !isNaN(correctIdx) && selectedIdx === correctIdx;

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
    // Audio not supported
  }
};
</script>

<style scoped>
.waveform-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 6px;
  height: 60px;
}

.waveform-bar {
  width: 20px;
  border-radius: 3px 3px 0 0;
  transition: all 0.3s ease;
  animation: wave-bounce 1.2s ease infinite;
}

.waveform-bar.stressed {
  height: 52px;
  background: linear-gradient(180deg, #6366f1 0%, #818cf8 100%);
}

.waveform-bar.unstressed {
  height: 26px;
  background: linear-gradient(180deg, #a5b4fc 0%, #c7d2fe 100%);
}

@keyframes wave-bounce {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.08); }
}

.waveform-bar:nth-child(odd) {
  animation-delay: 0.1s;
}

/* Mini waveform for options */
.mini-waveform {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 32px;
  padding: 6px;
  background: #f8fafc;
  border-radius: 0.5rem;
  flex-shrink: 0;
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.mini-bar {
  width: 6px;
  border-radius: 2px 2px 0 0;
}

.mini-bar.stressed {
  height: 24px;
  background: #6366f1;
}

.mini-bar.unstressed {
  height: 12px;
  background: #c7d2fe;
}

/* Option cards - leveraging the shared .option-card from interactives.css */
.option-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border: 1.5px solid rgba(226, 232, 240, 0.6);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.option-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.02);
  transform: translateX(2px);
}

.option-card.selected {
  border-color: #7c3aed;
  background: rgba(139, 92, 246, 0.04);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.08);
}

.option-card.correct {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.04);
}

.option-card.incorrect {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.04);
}

.selection-indicator {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #7c3aed;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(124, 58, 237, 0.3);
}

.correct .selection-indicator {
  background: #10b981;
}

.incorrect .selection-indicator {
  background: #ef4444;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.35s ease;
}

.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
</style>
