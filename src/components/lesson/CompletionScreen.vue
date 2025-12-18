<template>
  <div class="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
    <!-- Main completion card -->
    <div class="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
      <!-- Header with gradient -->
      <div class="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-6 py-8 sm:px-8 sm:py-10 text-center text-white overflow-hidden">
        <!-- Decorative circles -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <!-- Medal icon -->
        <div class="relative z-10 mb-4">
          <div
            class="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full text-5xl sm:text-6xl animate-bounce-in"
            :class="medalBgClass"
          >
            {{ medalIcon }}
          </div>
        </div>

        <!-- Title -->
        <h2 class="relative z-10 text-2xl sm:text-3xl font-bold mb-2">Lesson Complete!</h2>
        <p class="relative z-10 text-white/80 font-medium">{{ medalLabel }}</p>
      </div>

      <!-- Stats grid -->
      <div class="px-6 py-6 sm:px-8">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <!-- Time stat -->
          <div class="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 hover:shadow-md transition-shadow">
            <div class="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-slate-800">{{ readableTime }}</div>
            <div class="text-xs text-slate-500 font-medium uppercase tracking-wide">Time</div>
          </div>

          <!-- Stars stat -->
          <div class="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 hover:shadow-md transition-shadow">
            <div class="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-slate-800">{{ stars }}</div>
            <div class="text-xs text-slate-500 font-medium uppercase tracking-wide">Stars</div>
          </div>

          <!-- Mistakes stat -->
          <div class="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 hover:shadow-md transition-shadow">
            <div class="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center" :class="mistakeCount === 0 ? 'bg-emerald-100' : 'bg-red-100'">
              <svg class="w-5 h-5" :class="mistakeCount === 0 ? 'text-emerald-600' : 'text-red-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="mistakeCount === 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-slate-800">{{ mistakeCount }}</div>
            <div class="text-xs text-slate-500 font-medium uppercase tracking-wide">{{ mistakeCount === 0 ? 'Perfect!' : 'Mistakes' }}</div>
          </div>

          <!-- Points stat -->
          <div class="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 hover:shadow-md transition-shadow">
            <div class="w-10 h-10 mx-auto mb-2 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-slate-800">{{ earnedPoints }}</div>
            <div class="text-xs text-slate-500 font-medium uppercase tracking-wide">Points</div>
          </div>
        </div>

        <!-- Performance metrics -->
        <div class="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
          <h4 class="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Performance</h4>

          <!-- Accuracy bar -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Accuracy</span>
              <span class="text-sm font-bold text-slate-800">{{ accuracyPercentage }}%</span>
            </div>
            <div class="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-out"
                :class="accuracyPercentage >= 80 ? 'bg-emerald-500' : accuracyPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'"
                :style="{ width: accuracyPercentage + '%' }"
              ></div>
            </div>
          </div>

          <!-- Speed bar -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Speed</span>
              <span class="text-sm font-bold text-slate-800">{{ getSpeedText() }}</span>
            </div>
            <div class="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                :style="{ width: speedPercentage + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- AI Progress Insight -->
        <div v-if="progressInsight" class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 mb-6 border border-indigo-100">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-indigo-800 mb-1">AI Progress Analysis</h4>
              <p class="text-sm text-slate-600 leading-relaxed">{{ progressInsight }}</p>
            </div>
          </div>
        </div>

        <!-- Achievements -->
        <div v-if="achievements.length" class="mb-6">
          <h4 class="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Achievements Unlocked</h4>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="achievement in achievements"
              :key="achievement.id"
              class="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl"
              :title="achievement.description"
            >
              <span class="text-lg">{{ achievement.icon }}</span>
              <span class="text-sm font-medium text-amber-800">{{ achievement.name }}</span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="space-y-3">
          <button
            @click="$emit('return-to-catalogue')"
            class="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            Continue Learning
          </button>

          <div class="grid grid-cols-2 gap-3">
            <button
              @click="$emit('homework')"
              class="py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              Homework
            </button>

            <button
              @click="$emit('share')"
              class="py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
              Share
            </button>
          </div>
        </div>

        <!-- Extra actions slot -->
        <div class="mt-4">
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
      if (this.mistakeCount === 0) return 'bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-amber-500/30';
      if (this.mistakeCount <= 2) return 'bg-gradient-to-br from-slate-200 to-slate-400 shadow-lg shadow-slate-500/30';
      return 'bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-700/30';
    },

    accuracyPercentage() {
      if (this.totalSteps === 0) return 100;
      const correctSteps = this.totalSteps - this.mistakeCount;
      return Math.max(0, Math.round((correctSteps / this.totalSteps) * 100));
    },

    speedPercentage() {
      const timeInMinutes = this.parseTimeToMinutes(this.readableTime);
      const expectedTime = this.totalSteps * 2;
      const speedRatio = expectedTime / Math.max(timeInMinutes, 1);
      return Math.min(100, Math.max(0, Math.round(speedRatio * 50)));
    },

    achievements() {
      const achievements = [];

      if (this.mistakeCount === 0) {
        achievements.push({
          id: 'perfect',
          name: 'Perfect',
          icon: '🎯',
          description: 'Completed the lesson without mistakes'
        });
      }

      if (this.stars >= this.totalSteps * 0.8) {
        achievements.push({
          id: 'star_collector',
          name: 'Star Collector',
          icon: '⭐',
          description: 'Collected most stars'
        });
      }

      const timeInMinutes = this.parseTimeToMinutes(this.readableTime);
      if (timeInMinutes <= this.totalSteps * 1.5) {
        achievements.push({
          id: 'speed_runner',
          name: 'Speed Runner',
          icon: '⚡',
          description: 'Completed the lesson very fast'
        });
      }

      if (this.earnedPoints >= 80) {
        achievements.push({
          id: 'high_scorer',
          name: 'High Achiever',
          icon: '🏆',
          description: 'Achieved high score'
        });
      }

      return achievements;
    }
  },
  methods: {
    parseTimeToMinutes(timeString) {
      const parts = timeString.split(' ');
      let minutes = 0;

      for (let i = 0; i < parts.length; i++) {
        if (parts[i].includes('min')) {
          minutes += parseInt(parts[i - 1]) || 0;
        }
        if (parts[i].includes('sec')) {
          minutes += (parseInt(parts[i - 1]) || 0) / 60;
        }
      }

      return Math.max(minutes, 0.1);
    },

    getSpeedText() {
      const percentage = this.speedPercentage;
      if (percentage >= 80) return 'Lightning Fast';
      if (percentage >= 60) return 'Quick';
      if (percentage >= 40) return 'Steady';
      if (percentage >= 20) return 'Relaxed';
      return 'Take Your Time';
    }
  }
}
</script>

<style scoped>
/* Custom animation */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-slide-up {
  animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
}

/* Smooth scrolling */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}

/* Focus states */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-slide-up,
  .animate-bounce-in {
    animation: none;
    opacity: 1;
    transform: none;
  }

  * {
    transition-duration: 0.01ms !important;
  }
}
</style>
