<template>
  <div class="interactive-step step-animate-in">
    <!-- Header -->
    <div class="mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-lg mb-3">
        <span class="text-sm">🧪</span>
        <span class="text-xs font-semibold text-violet-600 uppercase tracking-wide">Lab Mixing</span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 leading-snug">{{ getLocalizedText(step.prompt) }}</h2>
    </div>

    <!-- Lab Layout -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end justify-items-center mb-5">

      <!-- Substance A -->
      <div class="flex flex-col gap-2.5 w-full max-w-[150px]">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center truncate" :title="substanceA.name">
          {{ substanceA.name }}
        </h3>
        <div class="flex justify-center">
          <div class="chem-tube">
            <div
              class="chem-tube-fill"
              :style="{
                height: `${fillHeight(volumeA, substanceA.maxVolume)}%`,
                backgroundColor: substanceA.color
              }"
            />
            <div class="chem-tube-graduations" />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Volume (ml)</label>
          <input
            type="number"
            v-model.number="volumeA"
            :max="substanceA.maxVolume"
            :min="0"
            :disabled="mixingState === 'mixing'"
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-900
                   focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100
                   disabled:opacity-50 disabled:bg-slate-100 transition-all"
            @input="resetMixing"
          />
        </div>
      </div>

      <!-- Mixing Beaker -->
      <div class="flex flex-col items-center gap-3 w-full order-last sm:order-none">
        <div class="relative">
          <div class="chem-beaker">
            <div
              class="chem-beaker-fill"
              :class="{ 'animate-pulse': mixingState === 'mixing' }"
              :style="{
                height: mixingState === 'idle' ? '0%' : '75%',
                backgroundColor: beakerColor
              }"
            />

            <!-- Bubbles Animation -->
            <div v-if="mixingState === 'mixing'" class="chem-bubbles">
              <div class="chem-bubble" />
              <div class="chem-bubble" style="width: 12px; height: 12px;" />
              <div class="chem-bubble" />
            </div>
          </div>

          <!-- Explosion Emoji -->
          <transition name="bounce">
            <div
              v-if="mixingState === 'fail'"
              class="absolute -top-6 -right-8 text-5xl animate-bounce z-10"
            >
              💥
            </div>
          </transition>
        </div>

        <button
          @click="startReaction"
          :disabled="mixingState === 'mixing' || mixingState === 'success'"
          class="step-btn-primary"
          :class="{
            'opacity-50 cursor-wait': mixingState === 'mixing',
            'step-btn-success': mixingState === 'success'
          }"
        >
          {{ reactionButtonText }}
        </button>
      </div>

      <!-- Substance B -->
      <div class="flex flex-col gap-2.5 w-full max-w-[150px]">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center truncate" :title="substanceB.name">
          {{ substanceB.name }}
        </h3>
        <div class="flex justify-center">
          <div class="chem-tube">
            <div
              class="chem-tube-fill"
              :style="{
                height: `${fillHeight(volumeB, substanceB.maxVolume)}%`,
                backgroundColor: substanceB.color
              }"
            />
            <div class="chem-tube-graduations" />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Volume (ml)</label>
          <input
            type="number"
            v-model.number="volumeB"
            :max="substanceB.maxVolume"
            :min="0"
            :disabled="mixingState === 'mixing'"
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-900
                   focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100
                   disabled:opacity-50 disabled:bg-slate-100 transition-all"
            @input="resetMixing"
          />
        </div>
      </div>
    </div>

    <!-- Info Panel -->
    <div class="bg-slate-50/80 rounded-xl border border-slate-200/60 p-4 text-sm flex flex-col sm:flex-row justify-between gap-2 mb-4">
      <div class="text-slate-700">
        <span class="font-semibold">Target:</span>
        {{ substanceA.targetVolume }}ml + {{ substanceB.targetVolume }}ml
        <span class="text-slate-400 ml-1">(+/- {{ step.tolerance }}ml)</span>
      </div>
      <div class="text-slate-700">
        <span class="font-semibold">Current:</span>
        {{ volumeA || 0 }}ml + {{ volumeB || 0 }}ml
      </div>
    </div>

    <!-- Feedback -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div
        v-if="feedback"
        class="flex items-start gap-3 p-4 rounded-xl border"
        :class="mixingState === 'success'
          ? 'bg-emerald-50/50 border-emerald-200/60'
          : mixingState === 'fail'
            ? 'bg-red-50/50 border-red-200/60'
            : 'bg-indigo-50/50 border-indigo-200/60'"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base shrink-0"
          :class="mixingState === 'success' ? 'bg-emerald-500' : mixingState === 'fail' ? 'bg-red-500' : 'bg-indigo-500'"
        >
          {{ mixingState === 'success' ? '✅' : mixingState === 'fail' ? '💥' : '🧪' }}
        </div>
        <div class="pt-0.5">
          <h4 class="text-sm font-bold mb-0.5"
            :class="mixingState === 'success' ? 'text-emerald-700' : mixingState === 'fail' ? 'text-red-700' : 'text-indigo-700'"
          >
            {{ mixingState === 'success' ? 'Reaction Complete' : mixingState === 'fail' ? 'Unstable!' : 'Mixing...' }}
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed">{{ feedback }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getLocalizedText } from '@/composables/useLanguage';

const props = defineProps({
  step: { type: Object, required: true }
});

const emit = defineEmits(['complete']);

const volumeA = ref(0);
const volumeB = ref(0);
const mixingState = ref('idle'); // 'idle' | 'mixing' | 'success' | 'fail'
const feedback = ref('');

const substanceA = computed(() => props.step.substances?.[0] || {});
const substanceB = computed(() => props.step.substances?.[1] || {});

const fillHeight = (volume, max) => {
  if (!max || volume <= 0) return 0;
  return Math.min(volume / max, 1) * 90;
};

const beakerColor = computed(() => {
  if (mixingState.value === 'success') return props.step.successColor;
  if (mixingState.value === 'fail') return props.step.failColor;
  return '#e5e7eb';
});

const reactionButtonText = computed(() => {
  if (mixingState.value === 'mixing') return 'Mixing...';
  if (mixingState.value === 'success') return 'Reaction Complete';
  return 'Start Reaction';
});

const resetMixing = () => {
  if (mixingState.value !== 'mixing') {
    mixingState.value = 'idle';
    feedback.value = '';
  }
};

const startReaction = () => {
  if (mixingState.value === 'mixing') return;

  mixingState.value = 'mixing';
  feedback.value = 'Mixing substances together...';

  setTimeout(() => {
    const tolerance = props.step.tolerance || 5;
    const okA = Math.abs((volumeA.value || 0) - substanceA.value.targetVolume) <= tolerance;
    const okB = Math.abs((volumeB.value || 0) - substanceB.value.targetVolume) <= tolerance;

    if (okA && okB) {
      mixingState.value = 'success';
      feedback.value = 'Perfect! The solution is stable and balanced.';
      emit('complete', true);
    } else {
      mixingState.value = 'fail';
      feedback.value = 'The proportions were off! The reaction became unstable.';
      emit('complete', false);
    }
  }, 1500);
};
</script>

<style scoped>
.bounce-enter-active {
  animation: bounce-in 0.5s;
}

@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
