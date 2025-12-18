<template>
  <div class="fixed inset-0 z-50 flex items-center justify-content bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
    <!-- Subtle background pattern -->
    <div class="absolute inset-0 opacity-40">
      <div class="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl"></div>
      <div class="absolute bottom-20 right-10 w-96 h-96 bg-indigo-100 rounded-full blur-3xl"></div>
    </div>

    <!-- Close button -->
    <button
      @click="$emit('exit')"
      class="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all duration-200 shadow-sm z-10"
      aria-label="Close"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <!-- Main content container -->
    <div class="relative w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 overflow-y-auto max-h-screen">
      <div class="text-center">
        <!-- Lesson badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-medium mb-6">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/>
          </svg>
          <span>{{ lesson?.type === 'premium' ? 'Premium Lesson' : 'Free Lesson' }}</span>
        </div>

        <!-- Title -->
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-3 leading-tight tracking-tight">
          {{ getLocalized(lesson?.lessonName) || 'Untitled Lesson' }}
        </h1>

        <!-- Description -->
        <p class="text-slate-500 text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed">
          {{ getLocalized(lesson?.description) || 'Get ready to learn something new!' }}
        </p>

        <!-- Stats cards -->
        <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-md mx-auto">
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div class="text-2xl sm:text-3xl mb-1">
              <svg class="w-6 h-6 sm:w-7 sm:h-7 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="text-lg sm:text-xl font-bold text-slate-800">~{{ estimatedTime }}</div>
            <div class="text-xs text-slate-400 font-medium uppercase tracking-wide">minutes</div>
          </div>

          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div class="text-2xl sm:text-3xl mb-1">
              <svg class="w-6 h-6 sm:w-7 sm:h-7 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <div class="text-lg sm:text-xl font-bold text-slate-800">{{ (steps || []).length }}</div>
            <div class="text-xs text-slate-400 font-medium uppercase tracking-wide">steps</div>
          </div>

          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div class="text-2xl sm:text-3xl mb-1">
              <svg class="w-6 h-6 sm:w-7 sm:h-7 mx-auto text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </div>
            <div class="text-lg sm:text-xl font-bold text-slate-800">{{ lesson?.type === 'premium' ? 'Pro' : 'Free' }}</div>
            <div class="text-xs text-slate-400 font-medium uppercase tracking-wide">access</div>
          </div>
        </div>

        <!-- Previous Progress Section -->
        <div
          v-if="previousProgress && (previousProgress?.completedSteps || []).length > 0"
          class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 sm:p-6 mb-6 border border-amber-100 text-left max-w-md mx-auto"
        >
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <span class="font-semibold text-amber-800">Continue where you left off</span>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="bg-white/70 rounded-xl p-3 text-center">
              <div class="text-lg font-bold text-slate-800">{{ (previousProgress?.completedSteps || []).length }}/{{ (steps || []).length }}</div>
              <div class="text-xs text-slate-500">Progress</div>
            </div>
            <div class="bg-white/70 rounded-xl p-3 text-center">
              <div class="text-lg font-bold text-slate-800 flex items-center justify-center gap-1">
                <span class="text-amber-500">*</span>{{ previousProgress?.stars || 0 }}
              </div>
              <div class="text-xs text-slate-500">Stars</div>
            </div>
            <div class="bg-white/70 rounded-xl p-3 text-center">
              <div class="text-lg font-bold text-slate-800">{{ previousProgress?.mistakes || 0 }}</div>
              <div class="text-xs text-slate-500">Mistakes</div>
            </div>
          </div>

          <button
            @click="$emit('continue')"
            class="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Continue Learning
          </button>
        </div>

        <!-- Start button -->
        <div class="space-y-3 max-w-md mx-auto">
          <button
            @click="$emit('start')"
            class="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ previousProgress ? 'Start Over' : 'Begin Lesson' }}
          </button>

          <!-- Report problem link -->
          <button
            @click="$emit('report-problem')"
            class="text-slate-400 hover:text-amber-600 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 mx-auto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            Report an issue
          </button>
        </div>
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
/* Ensure proper centering on all devices */
.justify-content {
  justify-content: center;
}

/* Smooth scrolling for overflow content */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}

/* Focus states for accessibility */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
