<template>
  <div class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
    <!-- Decorative Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl"></div>
      <div class="absolute top-1/3 right-1/4 w-2 h-2 bg-violet-300 rounded-full animate-pulse"></div>
      <div class="absolute top-2/3 left-1/5 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-pulse" style="animation-delay: 1s"></div>
    </div>

    <!-- Top Bar -->
    <div class="relative flex items-center justify-between px-5 py-4">
      <button
        @click="$emit('exit')"
        class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <span
        class="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase"
        :class="lesson?.type === 'premium'
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/60'
          : 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60'"
      >
        {{ lesson?.type === 'premium' ? t('lessonIntro.premium') : t('lessonIntro.free') }}
      </span>
      <div class="w-10"></div>
    </div>

    <!-- Main Content -->
    <div class="relative flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
      <div class="w-full max-w-lg text-center flex flex-col items-center">
        <!-- Icon -->
        <div class="relative mb-8">
          <div class="absolute inset-0 bg-violet-200/30 rounded-3xl blur-xl scale-125"></div>
          <div class="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200/50">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-tight">
          {{ getLocalized(lesson?.lessonName) || 'Lesson' }}
        </h1>

        <!-- Description -->
        <p class="text-slate-500 text-base sm:text-lg leading-relaxed max-w-sm mb-10">
          {{ getLocalized(lesson?.description) || 'Start learning now' }}
        </p>

        <!-- Stats Cards -->
        <div class="flex items-stretch gap-4 mb-10 w-full max-w-xs">
          <div class="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 text-center shadow-sm">
            <div class="text-2xl font-bold text-slate-900 mb-1">~{{ estimatedTime }}</div>
            <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">{{ t('lessonIntro.min') }}</div>
          </div>
          <div class="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 text-center shadow-sm">
            <div class="text-2xl font-bold text-slate-900 mb-1">{{ (steps || []).length }}</div>
            <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">{{ t('lessonIntro.steps') }}</div>
          </div>
        </div>

        <!-- Continue Progress Card -->
        <div
          v-if="previousProgress && (previousProgress?.completedSteps || []).length > 0"
          class="w-full max-w-xs bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 text-left shadow-sm"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-slate-500">{{ t('lessonIntro.previousProgress') }}</span>
            <span class="text-sm font-bold text-violet-600">{{ Math.round(progressPercent) }}%</span>
          </div>

          <div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              class="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>

          <button
            @click="$emit('continue')"
            class="w-full py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-200/50 transition-all duration-200 active:scale-[0.98]"
          >
            {{ t('lessonIntro.continue') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="relative px-6 pb-8 pt-4">
      <div class="max-w-lg mx-auto space-y-3">
        <button
          @click="$emit('start')"
          class="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-violet-200/50 transition-all duration-200 text-lg active:scale-[0.98]"
        >
          {{ previousProgress ? t('lessonIntro.startOver') : t('lessonIntro.startLesson') }}
        </button>

        <button
          @click="$emit('report-problem')"
          class="w-full py-2.5 text-slate-400 hover:text-violet-500 text-sm font-medium transition-colors duration-200"
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
