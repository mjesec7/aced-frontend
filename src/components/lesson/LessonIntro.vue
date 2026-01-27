<template>
  <div class="fixed inset-0 z-50 bg-white flex flex-col">
    <!-- Top Bar -->
    <div class="flex items-center justify-between px-4 py-4 border-b border-slate-100">
      <button
        @click="$emit('exit')"
        class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">{{ lesson?.type === 'premium' ? t('lessonIntro.premium') : t('lessonIntro.free') }}</span>
      <div class="w-10"></div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      <div class="w-full max-w-md text-center flex flex-col gap-10">
        <!-- Lesson Info Group -->
        <div class="flex flex-col gap-5">
          <!-- Icon -->
          <div class="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg class="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>

          <!-- Title -->
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">
            {{ getLocalized(lesson?.lessonName) || 'Lesson' }}
          </h1>

          <!-- Description -->
          <p class="text-slate-500 text-base sm:text-lg leading-relaxed">
            {{ getLocalized(lesson?.description) || 'Start learning now' }}
          </p>
        </div>

        <!-- Stats Row -->
        <div class="flex justify-center gap-12 py-2">
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">~{{ estimatedTime }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wide mt-1">{{ t('lessonIntro.min') }}</div>
          </div>
          <div class="w-px bg-slate-200"></div>
          <div class="text-center">
            <div class="text-3xl font-bold text-slate-900">{{ (steps || []).length }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wide mt-1">{{ t('lessonIntro.steps') }}</div>
          </div>
        </div>

        <!-- Continue Progress Card -->
        <div
          v-if="previousProgress && (previousProgress?.completedSteps || []).length > 0"
          class="bg-slate-50 rounded-2xl p-5 text-left"
        >
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-medium text-slate-600">{{ t('lessonIntro.previousProgress') }}</span>
            <span class="text-sm font-bold text-slate-900">{{ (previousProgress?.completedSteps || []).length }}/{{ (steps || []).length }}</span>
          </div>

          <div class="h-2 bg-slate-200 rounded-full overflow-hidden mb-5">
            <div
              class="h-full bg-slate-900 rounded-full transition-all"
              :style="{ width: ((previousProgress?.completedSteps || []).length / Math.max((steps || []).length, 1)) * 100 + '%' }"
            ></div>
          </div>

          <button
            @click="$emit('continue')"
            class="w-full py-3.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            {{ t('lessonIntro.continue') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="px-6 pb-8 pt-4 border-t border-slate-100 bg-white">
      <div class="max-w-md mx-auto space-y-4">
        <button
          @click="$emit('start')"
          class="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-lg"
        >
          {{ previousProgress ? t('lessonIntro.startOver') : t('lessonIntro.startLesson') }}
        </button>

        <button
          @click="$emit('report-problem')"
          class="w-full py-3 text-slate-400 hover:text-slate-600 text-sm transition-colors"
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
  mounted() {
    console.log('🟢 [LessonIntro v2] MOUNTED - lesson:', this.lesson?.lessonName, 'type:', typeof this.lesson?.lessonName);
  },
  methods: {
    getLocalized(field) {
      console.log('🟢 [LessonIntro v2] getLocalized input:', field, 'type:', typeof field);
      // Handle null/undefined
      if (field === null || field === undefined) return '';

      // If it's already a string, return it (legacy format)
      if (typeof field === 'string') return field;

      // If it's an object with language keys (multilingual format)
      if (typeof field === 'object') {
        const lang = this.language || localStorage.getItem('lang') || 'ru';
        console.log('🟢 [LessonIntro v2] Object detected, lang:', lang, 'keys:', Object.keys(field));
        const value = field[lang] || field['en'] || field['ru'] || field['uz'];
        console.log('🟢 [LessonIntro v2] Selected value:', value);
        if (value && typeof value === 'string') {
          return value.replace(/^(en|ru|uz):/i, '').trim();
        }
        // Try to get any available string value
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