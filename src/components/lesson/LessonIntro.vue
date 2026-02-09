<template>
  <div class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900">
    <!-- Decorative Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-20 -right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-16 -left-16 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 right-1/3 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl"></div>
    </div>

    <!-- Top Bar -->
    <div class="relative flex items-center justify-between px-4 py-3">
      <button
        @click="$emit('exit')"
        class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <span
        class="px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide uppercase"
        :class="lesson?.type === 'premium'
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'"
      >
        {{ lesson?.type === 'premium' ? t('lessonIntro.premium') : t('lessonIntro.free') }}
      </span>
      <div class="w-9"></div>
    </div>

    <!-- Main Content -->
    <div class="relative flex-1 flex flex-col items-center justify-center px-5 py-4 overflow-y-auto">
      <div class="w-full max-w-md text-center flex flex-col items-center">
        <!-- Icon -->
        <div class="relative mb-5">
          <div class="absolute inset-0 bg-violet-500/30 rounded-2xl blur-xl scale-125"></div>
          <div class="relative w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h1 class="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
          {{ getLocalized(lesson?.lessonName) || 'Lesson' }}
        </h1>

        <!-- Description -->
        <p class="text-white/60 text-sm sm:text-base leading-relaxed max-w-xs mb-5">
          {{ getLocalized(lesson?.description) || 'Start learning now' }}
        </p>

        <!-- Stats Cards - Inline -->
        <div class="flex items-center gap-3 mb-5">
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-white font-semibold">~{{ estimatedTime }}</span>
            <span class="text-white/50 text-sm">{{ t('lessonIntro.min') }}</span>
          </div>
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <span class="text-white font-semibold">{{ (steps || []).length }}</span>
            <span class="text-white/50 text-sm">{{ t('lessonIntro.steps') }}</span>
          </div>
        </div>

        <!-- Continue Progress Card -->
        <div
          v-if="previousProgress && (previousProgress?.completedSteps || []).length > 0"
          class="w-full max-w-xs bg-white/10 backdrop-blur-md rounded-xl border border-white/10 p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-white/70">{{ t('lessonIntro.previousProgress') }}</span>
            <span class="text-sm font-bold text-violet-400">{{ Math.round(progressPercent) }}%</span>
          </div>

          <div class="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              class="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>

          <button
            @click="$emit('continue')"
            class="w-full py-2.5 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-all duration-200"
          >
            {{ t('lessonIntro.continue') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="relative px-5 pb-6 pt-3">
      <div class="max-w-md mx-auto space-y-2">
        <button
          @click="$emit('start')"
          class="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200 text-base active:scale-[0.98]"
        >
          {{ previousProgress ? t('lessonIntro.startOver') : t('lessonIntro.startLesson') }}
        </button>

        <button
          @click="$emit('report-problem')"
          class="w-full py-2 text-white/40 hover:text-white/70 text-xs font-medium transition-colors duration-200"
        >
          {{ t('lessonIntro.reportIssue') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useLanguage } from '@/composables/useLanguage';
import { useI18n } from 'vue-i18n';

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
  setup() {
    const { language } = useLanguage();
    const { t } = useI18n();
    return { language, t };
  },
  computed: {
    progressPercent() {
      const completed = (this.previousProgress?.completedSteps || []).length;
      const total = Math.max((this.steps || []).length, 1);
      return (completed / total) * 100;
    }
  },
  methods: {
    getLocalized(field) {
      if (field === null || field === undefined) return '';
      if (typeof field === 'string') return field;
      if (typeof field === 'object') {
        const lang = this.language || localStorage.getItem('lang') || 'ru';
        const value = field[lang] || field['en'] || field['ru'] || field['uz'];
        if (value && typeof value === 'string') {
          return value.replace(/^(en|ru|uz):/i, '').trim();
        }
        const values = Object.values(field);
        for (const v of values) {
          if (v && typeof v === 'string' && v.trim()) {
            return v.replace(/^(en|ru|uz):/i, '').trim();
          }
        }
      }
      return '';
    }
  }
}
</script>

<style scoped>
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}
</style>
