<template>
  <section class="py-20 lg:py-24 bg-white" id="aced">
    <div class="max-w-7xl mx-auto px-6 lg:px-16">
      <!-- Header -->
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100 mb-8">
          <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
          <span class="text-sm font-medium text-violet-700">{{ $t('acedSection.exploreCourses') }}</span>
        </div>
        <div class="flex flex-col items-center gap-4">
          <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
            {{ $t('acedSection.startLearning') }} <span class="text-violet-600">{{ $t('acedSection.today') }}</span>
          </h2>
          <p class="text-lg lg:text-xl text-gray-500 text-center max-w-2xl">
            {{ $t('acedSection.chooseCourse') }}
          </p>
        </div>
      </div>

      <!-- Course Cards Grid -->
      <div class="relative min-h-[300px]">
        <!-- Loading State -->
        <div v-if="loadingCourses" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="n in 6" :key="n" class="h-[280px] bg-gray-50 rounded-2xl animate-pulse"></div>
        </div>

        <!-- Courses List -->
        <div v-else-if="displayedCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="course in displayedCourses"
            :key="course._id"
            class="group bg-white rounded-2xl border border-gray-100 hover:border-violet-200 overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
            @click="handleCourseClick(course)"
          >
            <!-- Course Content -->
            <div class="p-6">
              <div class="flex justify-between items-start mb-4">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                  :class="getTypeClasses(course)"
                >
                  {{ getTopicTypeLabel(course) }}
                </span>
                <span class="text-xs font-medium text-gray-400">
                  {{ $t('acedSection.lvl') }} {{ course.level || 1 }}
                </span>
              </div>

              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">
                {{ getTopicName(course) }}
              </h3>
              <p class="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
                {{ getTopicDescription(course) }}
              </p>

              <div class="flex items-center justify-between pt-4 border-t border-gray-50">
                <div class="flex items-center gap-4 text-xs text-gray-400">
                  <span>{{ course.lessons?.length || 0 }} {{ $t('acedSection.lessons') }}</span>
                  <span>{{ Math.round((course.totalTime || 0) / 60) || 1 }}h</span>
                </div>
                <button
                  class="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                  @click.stop="handleStartCourse(course)"
                  :disabled="processingCourse === course._id"
                >
                  {{ $t('acedSection.start') }}
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
          <div class="w-16 h-16 mx-auto mb-4 bg-violet-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">{{ $t('acedSection.noCoursesFound') }}</h3>
          <p class="text-gray-500 mb-4">{{ $t('acedSection.loadingContent') }}</p>
          <button v-if="!loadingCourses" @click="refreshCourses" class="px-6 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors">
            {{ $t('acedSection.tryAgain') }}
          </button>
        </div>
      </div>

      <!-- Registration Modal -->
      <div v-if="showRegistrationModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click="closeRegistrationModal">
        <div class="absolute inset-0 bg-gray-900/50"></div>

        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8" @click.stop>
          <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" @click="closeRegistrationModal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div class="text-center mb-6">
            <div class="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">{{ $t('acedSection.unlockCourse') }}</h2>
            <p class="text-gray-500 text-sm">{{ $t('acedSection.createFreeAccount') }}</p>
          </div>

          <div v-if="selectedCourse" class="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 class="font-semibold text-gray-900">{{ getTopicName(selectedCourse) }}</h3>
            <p class="text-sm text-gray-500">{{ selectedCourse.lessons?.length || 0 }} {{ $t('acedSection.lessons') }}</p>
          </div>

          <div class="space-y-3">
            <button class="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors" @click="triggerRegistration">
              {{ $t('acedSection.createAccount') }}
            </button>
            <button class="w-full py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-50 transition-colors" @click="closeRegistrationModal">
              {{ $t('acedSection.maybeLater') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="fixed bottom-6 right-6 z-[100] bg-white text-gray-900 px-5 py-3 rounded-xl border border-gray-200 shadow-lg flex items-center gap-3">
        <span class="text-sm">{{ errorMessage }}</span>
        <button class="text-sm font-semibold text-violet-600" @click="refreshCourses">{{ $t('acedSection.tryAgain') }}</button>
      </div>
    </div>
  </section>
</template>

<script>
import { getAuth } from "firebase/auth";
import { getTopics, getAllLessons } from '@/api';
import { useLanguage, getLocalizedText } from '@/composables/useLanguage';

export default {
  name: "AcedSection",

  setup() {
    const { language } = useLanguage();
    return { language };
  },

  data() {
    return {
      allCourses: [],
      filteredCourses: [],
      displayedCourses: [],
      maxDisplayedCourses: 6,
      loadingCourses: true,
      processingCourse: null,
      showRegistrationModal: false,
      selectedCourse: null,
      errorMessage: null,
      retryCount: 0,
      maxRetries: 3,
      navigationInProgress: false
    };
  },

  watch: {
    // Re-filter courses when language changes to update displayed names
    language() {
      this.filterCourses();
    }
  },

  async mounted() {
    await this.initializeCourses();
  },

  methods: {
    getTypeClasses(course) {
      const type = this.getTopicType(course);
      if (type === 'free') return 'bg-green-100 text-green-700';
      return 'bg-violet-100 text-violet-700'; // Pro
    },

    getLocalizedLessonName(lesson) {
      if (!lesson) return '';
      const lang = localStorage.getItem('lang') || 'ru';
      if (lesson.title && typeof lesson.title === 'string') return lesson.title;
      if (lesson.lessonName) {
        if (typeof lesson.lessonName === 'string') return lesson.lessonName;
        if (typeof lesson.lessonName === 'object') {
          return lesson.lessonName[lang] || lesson.lessonName.en || lesson.lessonName.ru || lesson.lessonName.uz || '';
        }
      }
      return '';
    },

    async initializeCourses() {
      this.loadingCourses = true;
      this.errorMessage = null;

      try {
        let coursesData = await this.fetchCoursesFromLessons();
        if (!coursesData || coursesData.length === 0) {
          coursesData = await this.fetchCoursesFromTopics();
        }

        if (coursesData && coursesData.length > 0) {
          this.allCourses = coursesData;
          this.filterCourses();
        } else {
          this.allCourses = [];
          this.filteredCourses = [];
          this.displayedCourses = [];
        }
      } catch (error) {
        this.errorMessage = 'Error loading courses';
      } finally {
        this.loadingCourses = false;
      }
    },

    async fetchCoursesFromLessons() {
      try {
        const lessonsResult = await getAllLessons();
        if (lessonsResult?.success && Array.isArray(lessonsResult.data) && lessonsResult.data.length > 0) {
          return this.buildCoursesFromLessons(lessonsResult.data);
        }
        return [];
      } catch { return []; }
    },

    async fetchCoursesFromTopics() {
      try {
        const topicsResult = await getTopics({ includeStats: true });
        if (topicsResult?.success && Array.isArray(topicsResult.data) && topicsResult.data.length > 0) {
          return topicsResult.data.filter(topic => topic.lessons && topic.lessons.length > 0);
        }
        return [];
      } catch { return []; }
    },

    buildCoursesFromLessons(lessons) {
      const coursesMap = new Map();
      lessons.forEach((lesson) => {
        if (!lesson?.topicId) return;
        const topicId = typeof lesson.topicId === 'string' ? lesson.topicId : lesson.topicId._id || String(lesson.topicId);

        if (!coursesMap.has(topicId)) {
          coursesMap.set(topicId, {
            _id: topicId,
            // Store the localized objects directly for language support
            lessonName: lesson.lessonName || null,
            name: lesson.lessonName || lesson.topic || null,
            description: lesson.description || null,
            level: lesson.level || 1,
            type: lesson.type || 'free',
            lessons: [lesson],
            totalTime: parseInt(lesson.estimatedTime || 10)
          });
        } else {
          const course = coursesMap.get(topicId);
          course.lessons.push(lesson);
          course.totalTime += parseInt(lesson.estimatedTime || 10);
          // Update localized fields from first lesson if not set
          if (!course.lessonName && lesson.lessonName) {
            course.lessonName = lesson.lessonName;
            course.name = lesson.lessonName;
          }
          if (!course.description && lesson.description) {
            course.description = lesson.description;
          }
        }
      });

      return Array.from(coursesMap.values()).sort((a, b) => {
        if (a.type === 'free' && b.type !== 'free') return -1;
        if (b.type === 'free' && a.type !== 'free') return 1;
        return 0;
      });
    },

    filterCourses() {
      this.filteredCourses = [...this.allCourses];
      this.displayedCourses = this.filteredCourses.slice(0, this.maxDisplayedCourses);
    },

    async refreshCourses() {
      if (this.retryCount >= this.maxRetries) {
        this.errorMessage = 'Max retries exceeded';
        return;
      }
      this.retryCount++;
      await this.initializeCourses();
      if (!this.errorMessage) this.retryCount = 0;
    },

    handleCourseClick(course) {
      this.handleStartCourse(course);
    },

    async handleStartCourse(course) {
      if (!course?._id || this.processingCourse === course._id || this.navigationInProgress) return;
      this.processingCourse = course._id;
      this.navigationInProgress = true;

      try {
        const topicType = this.getTopicType(course);
        const isAuthenticated = !!getAuth().currentUser;

        if (topicType === 'free') {
          const firstLesson = course.lessons?.[0];
          if (firstLesson?._id) {
            await this.$router.push({ name: 'LessonPage', params: { id: String(firstLesson._id).trim() }, query: { type: 'free' } });
          }
        } else {
          if (isAuthenticated) {
            const firstLesson = course.lessons?.[0];
            if (firstLesson?._id) {
              await this.$router.push({ name: 'LessonPage', params: { id: String(firstLesson._id).trim() }, query: { type: topicType } });
            }
          } else {
            this.selectedCourse = course;
            this.showRegistrationModal = true;
          }
        }
      } catch {
        this.errorMessage = 'Unable to open course';
      } finally {
        setTimeout(() => {
          this.processingCourse = null;
          this.navigationInProgress = false;
        }, 1000);
      }
    },

    triggerRegistration() {
      window.dispatchEvent(new Event("open-Login-modal"));
      this.closeRegistrationModal();
    },

    closeRegistrationModal() {
      this.showRegistrationModal = false;
      this.selectedCourse = null;
    },

    getTopicName(course) {
      if (!course) return this.$t('course.untitled');

      // Try lessonName first (the JSON format uses lessonName for course titles)
      if (course.lessonName) {
        const name = getLocalizedText(course.lessonName);
        if (name) return name;
      }

      // Try name field (could be string or localized object)
      if (course.name) {
        if (typeof course.name === 'object') {
          const name = getLocalizedText(course.name);
          if (name) return name;
        } else if (typeof course.name === 'string') {
          return course.name;
        }
      }

      // Try topicName field
      if (course.topicName) {
        const name = getLocalizedText(course.topicName);
        if (name) return name;
      }

      // Try title field
      if (course.title) {
        const name = getLocalizedText(course.title);
        if (name) return name;
      }

      return this.$t('course.untitled');
    },

    getTopicDescription(course) {
      if (!course) return '';

      // Handle localized description object
      let desc = '';
      if (course.description) {
        if (typeof course.description === 'object') {
          desc = getLocalizedText(course.description);
        } else if (typeof course.description === 'string') {
          desc = course.description;
        }
      }

      if (!desc) {
        return `${this.$t('acedSection.learn') || 'Learn'} ${this.getTopicName(course)}`;
      }

      return desc.length > 80 ? desc.substring(0, 80) + '...' : desc;
    },

    getTopicType(course) {
      const type = String(course?.type || 'free').toLowerCase();
      if (['premium', 'paid', 'start', 'pro', 'professional'].includes(type)) return 'pro';
      return 'free';
    },

    getTopicTypeLabel(course) {
      const type = this.getTopicType(course);
      return type === 'pro' ? this.$t('common.pro') : this.$t('common.free');
    }
  }
};
</script>
