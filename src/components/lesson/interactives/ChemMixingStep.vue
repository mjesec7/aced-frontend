<template>
  <div class="interactive-step step-animate-in">
    <p class="text-lg text-gray-600 mb-6 leading-relaxed">
      {{ step.prompt }}
    </p>

    <!-- Lab Layout -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 items-end justify-items-center mb-8">
      
      <!-- Substance A -->
      <div class="flex flex-col gap-3 w-full max-w-[150px]">
        <h3 class="text-sm font-bold text-gray-500 text-center truncate" :title="substanceA.name">
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
          <label class="text-xs font-semibold text-gray-400">Volume (ml)</label>
          <input
            type="number"
            v-model.number="volumeA"
            :max="substanceA.maxVolume"
            :min="0"
            :disabled="mixingState === 'mixing'"
            class="p-2 border border-gray-200 rounded-lg text-center font-mono font-bold 
                   focus:ring-2 focus:ring-purple-400 outline-none
                   bg-white text-gray-900"
            @input="resetMixing"
          />
        </div>
      </div>

      <!-- Mixing Beaker -->
      <div class="flex flex-col items-center gap-4 w-full order-last sm:order-none">
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
              class="absolute -top-6 -right-8 text-6xl animate-bounce z-10"
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
      <div class="flex flex-col gap-3 w-full max-w-[150px]">
        <h3 class="text-sm font-bold text-gray-500 text-center truncate" :title="substanceB.name">
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
          <label class="text-xs font-semibold text-gray-400">Volume (ml)</label>
          <input
            type="number"
            v-model.number="volumeB"
            :max="substanceB.maxVolume"
            :min="0"
            :disabled="mixingState === 'mixing'"
            class="p-2 border border-gray-200 rounded-lg text-center font-mono font-bold 
                   focus:ring-2 focus:ring-purple-400 outline-none
                   bg-white text-gray-900"
            @input="resetMixing"
          />
        </div>
      </div>
    </div>

    <!-- Info Panel -->
    <div class="bg-gray-50 rounded-xl p-4 text-sm flex flex-col sm:flex-row justify-between gap-2 border border-gray-100">
      <div>
        <span class="font-semibold">Target:</span> 
        {{ substanceA.targetVolume }}ml + {{ substanceB.targetVolume }}ml 
        <span class="text-gray-400">(±{{ step.tolerance }}ml)</span>
      </div>
      <div>
        <span class="font-semibold">Current:</span> 
        {{ volumeA || 0 }}ml + {{ volumeB || 0 }}ml
      </div>
    </div>

    <!-- Feedback -->
    <div class="step-feedback mt-4" :class="mixingState === 'success' ? 'success' : mixingState === 'fail' ? 'error' : ''">
      {{ feedback }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

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
  feedback.value = 'Mixing... 🧪';

  setTimeout(() => {
    const tolerance = props.step.tolerance || 5;
    const okA = Math.abs((volumeA.value || 0) - substanceA.value.targetVolume) <= tolerance;
    const okB = Math.abs((volumeB.value || 0) - substanceB.value.targetVolume) <= tolerance;

    if (okA && okB) {
      mixingState.value = 'success';
      feedback.value = '✅ Perfect! The solution is stable and balanced.';
      emit('complete', true);
    } else {
      mixingState.value = 'fail';
      feedback.value = '💥 The proportions were off! The reaction became unstable.';
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
