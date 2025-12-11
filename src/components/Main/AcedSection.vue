<template>
  <section class="py-24 bg-gradient-to-b from-white to-amber-50/30 relative overflow-hidden" id="aced">
    <!-- Decorative blobs -->
    <div class="absolute top-40 left-0 w-72 h-72 bg-gradient-to-br from-pink-200/40 to-orange-200/40 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 right-0 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-lime-200/30 rounded-full blur-3xl"></div>

    <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
      <!-- Header -->
      <div class="mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full mb-6">
          <span class="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
          <span class="text-sm font-semibold text-pink-700">Explore & Learn</span>
        </div>
        <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Pick a course,
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">start learning</span>
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl">
          Master new skills with our comprehensive curriculum designed to make learning fun
        </p>
      </div>

      <!-- Course Cards Grid -->
      <div class="relative min-h-[400px]">
        <!-- Loading State -->
        <div v-if="loadingCourses" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="n in 6" :key="n" class="h-[320px] bg-white rounded-3xl border border-gray-100 animate-pulse"></div>
        </div>

        <!-- Courses List -->
        <div v-else-if="displayedCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(course, index) in displayedCourses"
            :key="course._id"
            class="group bg-white rounded-3xl border-2 border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer flex flex-col h-full"
            :class="getCardBorderClass(index)"
            @click="handleCourseClick(course)"
          >
            <!-- Card gradient top bar -->
            <div class="h-2" :class="getCardGradientClass(index)"></div>

            <!-- Course Header -->
            <div class="p-6 flex-1">
              <div class="flex justify-between items-start mb-4">
                <span
                  class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                  :class="getTypeClasses(course)"
                >
                  {{ getTopicTypeLabel(course) }}
                </span>
                <div class="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  Lvl {{ course.level || 1 }}
                </div>
              </div>

              <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300" :class="getTextGradientClass(index)">
                {{ getTopicName(course) }}
              </h3>
              <p class="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">
                {{ getTopicDescription(course) }}
              </p>
            </div>

            <!-- Course Meta & Action -->
            <div class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-4 text-xs font-semibold text-gray-500">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {{ course.lessons?.length || 0 }} lessons
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ Math.round((course.totalTime || 0) / 60) || 1 }}h
                </div>
              </div>

              <button
                class="text-sm font-bold transition-all flex items-center gap-1 px-4 py-2 rounded-xl"
                :class="getButtonClass(index)"
                @click.stop="handleStartCourse(course)"
                :disabled="processingCourse === course._id"
              >
                <span v-if="processingCourse === course._id">...</span>
                <span v-else class="flex items-center gap-1">
                  Start
                  <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No courses found</h3>
          <p class="text-gray-500 mb-6">We're loading up some great content for you</p>
          <button v-if="!loadingCourses" @click="refreshCourses" class="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
            Try Again
          </button>
        </div>
      </div>

      <!-- Registration Modal -->
      <div v-if="showRegistrationModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click="closeRegistrationModal">
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8" @click.stop>
          <button class="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-all" @click="closeRegistrationModal">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Unlock This Course</h2>
            <p class="text-gray-500">Create a free account to access premium content</p>
          </div>

          <div v-if="selectedCourse" class="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-5 mb-6 border border-orange-100">
            <h3 class="font-bold text-gray-900 mb-2">{{ getTopicName(selectedCourse) }}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <span>{{ selectedCourse.lessons?.length || 0 }} lessons</span>
              <span>Certificate included</span>
            </div>
          </div>

          <div class="space-y-3">
            <button class="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-all" @click="triggerRegistration">
              Create Free Account
            </button>
            <button class="w-full py-4 rounded-2xl text-gray-500 font-semibold hover:bg-gray-50 transition-all" @click="closeRegistrationModal">
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="fixed bottom-6 right-6 z-[100] bg-white text-gray-900 px-6 py-4 rounded-2xl border-2 border-red-200 shadow-xl flex items-center gap-4">
        <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div class="font-bold">Oops!</div>
          <div class="text-sm text-gray-500">{{ errorMessage }}</div>
        </div>
        <button class="ml-4 text-sm font-bold text-orange-500 hover:text-orange-600" @click="refreshCourses">Retry</button>
      </div>
    </div>
  </section>
</template>

<script>
import { getAuth } from "firebase/auth";
import { getTopics, getAllLessons } from '@/api';

export default {
  name: "AcedSection",
  data() {
    return {
      allCourses: [],
      filteredCourses: [],
      displayedCourses: [],
      maxDisplayedCourses: 6,
      selectedSubject: '',
      selectedType: '',
      availableSubjects: [],
      loadingCourses: true,
      processingCourse: null,
      showRegistrationModal: false,
      selectedCourse: null,
      errorMessage: null,
      retryCount: 0,
      maxRetries: 3,
      lang: localStorage.getItem('lang') || 'en',
      navigationInProgress: false,
      cardColors: [
        { border: 'hover:border-orange-300', gradient: 'bg-gradient-to-r from-orange-400 to-pink-500', text: 'group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-500', button: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
        { border: 'hover:border-teal-300', gradient: 'bg-gradient-to-r from-teal-400 to-cyan-500', text: 'group-hover:bg-gradient-to-r group-hover:from-teal-500 group-hover:to-cyan-500', button: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
        { border: 'hover:border-lime-300', gradient: 'bg-gradient-to-r from-lime-400 to-emerald-500', text: 'group-hover:bg-gradient-to-r group-hover:from-lime-500 group-hover:to-emerald-500', button: 'bg-lime-50 text-lime-600 hover:bg-lime-100' },
        { border: 'hover:border-violet-300', gradient: 'bg-gradient-to-r from-violet-400 to-purple-500', text: 'group-hover:bg-gradient-to-r group-hover:from-violet-500 group-hover:to-purple-500', button: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
        { border: 'hover:border-pink-300', gradient: 'bg-gradient-to-r from-pink-400 to-rose-500', text: 'group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-rose-500', button: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
        { border: 'hover:border-amber-300', gradient: 'bg-gradient-to-r from-amber-400 to-orange-500', text: 'group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-500', button: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
      ]
    };
  },

  async mounted() {
    try {
      await this.initializeCourses();
    } catch (error) {
      this.handleError(error);
    }
  },

  methods: {
    getCardBorderClass(index) {
      return this.cardColors[index % this.cardColors.length].border;
    },
    getCardGradientClass(index) {
      return this.cardColors[index % this.cardColors.length].gradient;
    },
    getTextGradientClass(index) {
      return this.cardColors[index % this.cardColors.length].text;
    },
    getButtonClass(index) {
      return this.cardColors[index % this.cardColors.length].button;
    },
    getTypeClasses(course) {
      const type = this.getTopicType(course);
      if (type === 'free') return 'bg-emerald-100 text-emerald-700';
      if (type === 'premium') return 'bg-gradient-to-r from-orange-400 to-pink-500 text-white';
      return 'bg-gray-900 text-white';
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
          this.extractSubjects();
          this.filterCourses();
        } else {
          this.allCourses = [];
          this.filteredCourses = [];
          this.displayedCourses = [];
        }

      } catch (error) {
        this.handleError(error);
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
      } catch (error) {
        return [];
      }
    },

    async fetchCoursesFromTopics() {
      try {
        const topicsResult = await getTopics({ includeStats: true });
        if (topicsResult?.success && Array.isArray(topicsResult.data) && topicsResult.data.length > 0) {
          return topicsResult.data.filter(topic => topic.lessons && topic.lessons.length > 0);
        }
        return [];
      } catch (error) {
        return [];
      }
    },

    buildCoursesFromLessons(lessons) {
      const coursesMap = new Map();

      lessons.forEach((lesson) => {
        if (!lesson?.topicId) return;

        const topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) return;

        const topicName = this.getTopicNameFromLesson(lesson);
        if (!topicName) return;

        if (!coursesMap.has(topicId)) {
          coursesMap.set(topicId, {
            _id: topicId,
            name: topicName,
            topicName: topicName,
            description: `Course on "${topicName}"`,
            subject: lesson.subject || 'General',
            level: lesson.level || 1,
            type: lesson.type || 'free',
            lessons: [lesson],
            lessonCount: 1,
            totalTime: this.calculateLessonTime(lesson),
            isActive: true,
            hasLessons: true,
            createdAt: lesson.createdAt || new Date().toISOString()
          });
        } else {
          const course = coursesMap.get(topicId);
          course.lessons.push(lesson);
          course.lessonCount++;
          course.totalTime += this.calculateLessonTime(lesson);
        }
      });

      return Array.from(coursesMap.values()).sort((a, b) => {
        if (a.type !== b.type) {
          if (a.type === 'free') return -1;
          if (b.type === 'free') return 1;
        }
        return a.subject.localeCompare(b.subject);
      });
    },

    extractSubjects() {
      const subjects = new Set();
      this.allCourses.forEach(course => {
        if (course.subject) subjects.add(course.subject);
      });
      this.availableSubjects = Array.from(subjects).sort();
    },

    filterCourses() {
      this.filteredCourses = [...this.allCourses];
      this.updateDisplayedCourses();
    },

    updateDisplayedCourses() {
      this.displayedCourses = this.filteredCourses.slice(0, this.maxDisplayedCourses);
    },

    async refreshCourses() {
      if (this.retryCount >= this.maxRetries) {
        this.errorMessage = 'Maximum retry attempts exceeded';
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
        const isAuthenticated = this.checkUserAuthentication();

        if (topicType === 'free') {
          const firstLesson = course.lessons?.[0];
          if (firstLesson?._id) {
            const lessonId = String(firstLesson._id).trim();
            if (!lessonId || lessonId === 'null' || lessonId === 'undefined') {
              this.errorMessage = 'Invalid lesson ID';
              return;
            }
            try {
              await this.$router.push({
                name: 'LessonPage',
                params: { id: lessonId },
                query: { source: 'aced-section', guest: !isAuthenticated ? 'true' : undefined, type: 'free' }
              });
            } catch (navError) {
              window.location.href = `/lesson/${lessonId}?source=aced-section${!isAuthenticated ? '&guest=true&type=free' : '&type=free'}`;
            }
          } else {
            try {
              await this.$router.push({
                name: 'TopicOverview',
                params: { id: course._id },
                query: { source: 'aced-section', guest: !isAuthenticated ? 'true' : undefined, type: 'free' }
              });
            } catch (topicError) {
              this.errorMessage = 'Unable to open topic';
            }
          }
        } else {
          if (isAuthenticated) {
            const firstLesson = course.lessons?.[0];
            if (firstLesson?._id) {
              try {
                await this.$router.push({
                  name: 'LessonPage',
                  params: { id: String(firstLesson._id).trim() },
                  query: { source: 'aced-section', type: topicType }
                });
              } catch (navError) {
                window.location.href = `/lesson/${firstLesson._id}?source=aced-section&type=${topicType}`;
              }
            }
          } else {
            this.selectedCourse = course;
            this.showRegistrationModal = true;
          }
        }
      } catch (error) {
        this.errorMessage = 'Unable to open course';
      } finally {
        setTimeout(() => {
          this.processingCourse = null;
          this.navigationInProgress = false;
        }, 1000);
      }
    },

    checkUserAuthentication() {
      return !!getAuth().currentUser;
    },

    triggerRegistration() {
      const hero = document.getElementById("hero");
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => window.dispatchEvent(new Event("open-Login-modal")), 600);
      } else {
        window.dispatchEvent(new Event("open-Login-modal"));
      }
      this.closeRegistrationModal();
    },

    closeRegistrationModal() {
      this.showRegistrationModal = false;
      this.selectedCourse = null;
    },

    handleError(error) {
      let msg = 'Error loading courses';
      if (error?.response) {
        const status = error.response.status;
        if (status === 404) msg = 'Courses not found';
        else if ([500, 502, 503].includes(status)) msg = 'Server error. Try again later.';
        else msg = `Server error (${status})`;
      } else if (error?.request) {
        msg = 'Network error. Check your connection.';
      }
      this.errorMessage = msg;
    },

    getTopicName(course) {
      return course?.name || course?.topicName || course?.topic || course?.title || 'Untitled';
    },

    getTopicDescription(course) {
      if (!course) return 'Learn new skills';
      const desc = course.description || course.topicDescription;
      if (desc && desc.length > 85) return desc.substring(0, 85) + '...';
      return desc || `Learn ${this.getTopicName(course)} with practical exercises`;
    },

    getTopicType(course) {
      if (!course) return 'free';
      const type = String(course.type || course.accessType || course.pricing || 'free').toLowerCase();
      if (['premium', 'paid', 'start'].includes(type)) return 'premium';
      if (['pro', 'professional'].includes(type)) return 'pro';
      return 'free';
    },

    getTopicTypeLabel(course) {
      const labels = { free: 'Free', premium: 'Premium', pro: 'Pro' };
      return labels[this.getTopicType(course)] || 'Free';
    },

    extractTopicId(topicId) {
      if (typeof topicId === 'string') return topicId;
      if (typeof topicId === 'object' && topicId !== null) return topicId._id || topicId.id || String(topicId);
      return String(topicId);
    },

    getTopicNameFromLesson(lesson) {
      return lesson?.topic || lesson?.lessonName || lesson?.title || 'No Topic';
    },

    calculateLessonTime(lesson) {
      return parseInt(lesson.estimatedTime || lesson.duration || 10);
    }
  }
};
</script>
