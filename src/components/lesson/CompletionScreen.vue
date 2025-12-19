<template>
  <div class="fixed inset-0 z-[1000] bg-white flex flex-col">
    <!-- Top Bar -->
    <div class="flex items-center justify-center px-4 py-4 border-b border-slate-100">
      <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Lesson Complete</span>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
      <div class="w-full max-w-md text-center flex flex-col gap-8">
        <!-- Completion Info Group -->
        <div class="flex flex-col gap-4">
          <!-- Medal Icon -->
          <div class="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl" :class="medalBgClass">
            {{ medalIcon }}
          </div>

          <!-- Title -->
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {{ medalLabel }}
          </h1>
        </div>

        <!-- Stats Row -->
        <div class="flex justify-center gap-10 py-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">{{ readableTime }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wide mt-1">time</div>
          </div>
          <div class="w-px bg-slate-200"></div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">{{ stars }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wide mt-1">stars</div>
          </div>
          <div class="w-px bg-slate-200"></div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">{{ earnedPoints }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wide mt-1">points</div>
          </div>
        </div>

        <!-- Accuracy Bar -->
        <div class="bg-slate-50 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-slate-600">Accuracy</span>
            <span class="text-sm font-bold text-slate-900">{{ accuracyPercentage }}%</span>
          </div>
          <div class="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="accuracyPercentage >= 80 ? 'bg-emerald-500' : accuracyPercentage >= 50 ? 'bg-amber-500' : 'bg-red-400'"
              :style="{ width: accuracyPercentage + '%' }"
            ></div>
          </div>
          <p v-if="mistakeCount === 0" class="text-sm text-emerald-600 mt-3 font-medium">Perfect! No mistakes</p>
          <p v-else class="text-sm text-slate-400 mt-3">{{ mistakeCount }} mistake{{ mistakeCount > 1 ? 's' : '' }}</p>
        </div>

        <!-- AI Insight (if available) -->
        <div v-if="progressInsight" class="bg-slate-50 rounded-2xl p-5 text-left">
          <p class="text-sm text-slate-600 leading-relaxed">{{ progressInsight }}</p>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="px-6 pb-8 pt-4 border-t border-slate-100 bg-white">
      <div class="max-w-md mx-auto space-y-4">
        <button
          @click="$emit('return-to-catalogue')"
          class="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-lg"
        >
          Continue
        </button>

        <div class="flex gap-4">
          <button
            @click="$emit('homework')"
            class="flex-1 py-3.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Homework
          </button>
          <button
            @click="$emit('share')"
            class="flex-1 py-3.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Share
          </button>
        </div>

        <!-- Extra actions slot -->
        <div>
          <slot name="extra-actions"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompletionScreen',
  props: {
    lesson: {
      type: Object,
      required: true
    },
    readableTime: {
      type: String,
      required: true
    },
    stars: {
      type: Number,
      required: true
    },
    mistakeCount: {
      type: Number,
      required: true
    },
    earnedPoints: {
      type: Number,
      required: true
    },
    medalLabel: {
      type: String,
      required: true
    },
    medalIcon: {
      type: String,
      required: true
    },
    progressInsight: {
      type: String,
      default: ''
    },
    totalSteps: {
      type: Number,
      default: 1
    }
  },
  emits: ['return-to-catalogue', 'share', 'homework'],
  computed: {
    medalBgClass() {
      if (this.mistakeCount === 0) return 'bg-amber-100';
      if (this.mistakeCount <= 2) return 'bg-slate-100';
      return 'bg-orange-100';
    },

    accuracyPercentage() {
      if (this.totalSteps === 0) return 100;
      const correctSteps = this.totalSteps - this.mistakeCount;
      return Math.max(0, Math.round((correctSteps / this.totalSteps) * 100));
    }
  }
}
</script>

<style scoped>
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}
</style>