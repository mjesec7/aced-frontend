<template>
  <div class="fixed inset-0 z-50 bg-white flex flex-col">
    <!-- Top Bar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <button
        @click="$emit('exit')"
        class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">{{ lesson?.type === 'premium' ? 'Premium' : 'Free' }}</span>
      <div class="w-10"></div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center px-6 py-6 overflow-y-auto">
      <div class="w-full max-w-md text-center">
        <!-- Icon -->
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>

        <!-- Title -->
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {{ getLocalized(lesson?.lessonName) || 'Lesson' }}
        </h1>

        <!-- Description -->
        <p class="text-slate-500 mb-8 text-sm sm:text-base leading-relaxed">
          {{ getLocalized(lesson?.description) || 'Start learning now' }}
        </p>

        <!-- Stats Row -->
        <div class="flex justify-center gap-8 mb-8">
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-900">~{{ estimatedTime }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wide">min</div>
          </div>
          <div class="w-px bg-slate-200"></div>
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-900">{{ (steps || []).length }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wide">steps</div>
          </div>
        </div>

        <!-- Continue Progress Card -->
        <div
          v-if="previousProgress && (previousProgress?.completedSteps || []).length > 0"
          class="bg-slate-50 rounded-2xl p-5 mb-6 text-left"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-slate-600">Previous Progress</span>
            <span class="text-sm font-bold text-slate-900">{{ (previousProgress?.completedSteps || []).length }}/{{ (steps || []).length }}</span>
          </div>

          <div class="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
            <div
              class="h-full bg-slate-900 rounded-full transition-all"
              :style="{ width: ((previousProgress?.completedSteps || []).length / Math.max((steps || []).length, 1)) * 100 + '%' }"
            ></div>
          </div>

          <button
            @click="$emit('continue')"
            class="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="px-6 pb-8 pt-4 border-t border-slate-100 bg-white">
      <div class="max-w-md mx-auto space-y-3">
        <button
          @click="$emit('start')"
          class="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-lg"
        >
          {{ previousProgress ? 'Start Over' : 'Start Lesson' }}
        </button>

        <button
          @click="$emit('report-problem')"
          class="w-full py-2 text-slate-400 hover:text-slate-600 text-sm transition-colors"
        >
          Report an issue
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LessonIntro',
  props: {
    lesson: {
      type: Object,
      required: true
    },
    estimatedTime: {
      type: Number,
      default: 10
    },
    steps: {
      type: Array,
      default: () => []
    },
    previousProgress: {
      type: Object,
      default: null
    }
  },
  emits: ['start', 'continue', 'exit', 'report-problem'],
  methods: {
    getLocalized(field) {
      if (typeof field === 'string') return field;
      return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim();
    }
  }
}
</script>

<style scoped>
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}
</style>
