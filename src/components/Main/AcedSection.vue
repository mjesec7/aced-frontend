<template>
  <section class="py-24 bg-slate-50 border-t border-slate-100" id="aced">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-12">
        <h1 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Explore Courses
        </h1>
        <p class="text-lg text-slate-600 max-w-2xl">
          Master new skills with our comprehensive curriculum.
        </p>
      </div>

      <!-- Course Cards Grid -->
      <div class="relative min-h-[400px]">
        <!-- Loading State -->
        <div v-if="loadingCourses" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="n in 6" :key="n" class="h-[380px] bg-white rounded-xl border border-slate-200 animate-pulse"></div>
        </div>
        
        <!-- Courses List -->
        <div v-else-if="displayedCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="course in displayedCourses" 
            :key="course._id"
            class="group bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-indigo-300 cursor-pointer flex flex-col h-full"
            @click="handleCourseClick(course)"
          >
            <!-- Course Header -->
            <div class="p-6 flex-1">
              <div class="flex justify-between items-start mb-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide"
                  :class="{
                    'bg-slate-100 text-slate-700': getTopicType(course) === 'free',
                    'bg-indigo-50 text-indigo-700': getTopicType(course) === 'premium',
                    'bg-slate-900 text-white': getTopicType(course) === 'pro'
                  }"
                >
                  {{ getTopicTypeLabel(course) }}
                </span>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Lvl {{ course.level || 1 }}
                </span>
              </div>
              
              <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {{ getTopicName(course) }}
              </h3>
              <p class="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4">
                {{ getTopicDescription(course) }}
              </p>
            </div>
            
            <!-- Course Meta & Action -->
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-4 text-xs font-medium text-slate-500">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {{ course.lessons?.length || 0 }} lessons
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ Math.round((course.totalTime || 0) / 60) || 1 }}h
                </div>
              </div>
              
              <button 
                class="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                @click.stop="handleStartCourse(course)"
                :disabled="processingCourse === course._id"
              >
                <span v-if="processingCourse === course._id">Loading...</span>
                <span v-else class="flex items-center gap-1">
                  Start <span class="text-lg leading-none">&rarr;</span>
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div class="text-4xl mb-4 opacity-20">🔍</div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">No courses found</h3>
          <button v-if="!loadingCourses" @click="refreshCourses" class="text-indigo-600 font-medium hover:underline">
            Try refreshing
          </button>
        </div>
      </div>

      <!-- Registration Modal -->
      <div v-if="showRegistrationModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click="closeRegistrationModal">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>
        
        <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-8 transform transition-all" @click.stop>
          <button class="absolute top-4 right-4 text-slate-400 hover:text-slate-600" @click="closeRegistrationModal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div class="text-center mb-6">
            <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-slate-900 mb-2">Premium Access</h2>
            <p class="text-slate-500 text-sm">Sign up to unlock this course.</p>
          </div>
          
          <div v-if="selectedCourse" class="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
            <h3 class="font-bold text-slate-900 mb-1">{{ getTopicName(selectedCourse) }}</h3>
            <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">{{ getTopicTypeLabel(selectedCourse) }} course</p>
            <div class="text-sm text-slate-600 space-y-1">
              <p>• {{ selectedCourse.lessons?.length || 0 }} lessons</p>
              <p>• Certificate of completion</p>
            </div>
          </div>
          
          <div class="space-y-3">
            <button class="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm" @click="triggerRegistration">
              Create Free Account
            </button>
            <button class="w-full py-3 rounded-lg text-slate-500 font-medium hover:bg-slate-50 transition-colors" @click="closeRegistrationModal">
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="fixed bottom-6 right-6 z-[100] bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 shadow-lg flex items-center gap-3">
        <span class="font-medium">{{ errorMessage }}</span>
        <button class="text-sm underline hover:no-underline" @click="refreshCourses">Retry</button>
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
      navigationInProgress: false
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
          const courses = this.buildCoursesFromLessons(lessonsResult.data);
          return courses;
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
          const coursesWithLessons = topicsResult.data.filter(topic => {
            return topic.lessons && topic.lessons.length > 0;
          });
          return coursesWithLessons;
        }
        return [];
      } catch (error) {
        return [];
      }
    },

    buildCoursesFromLessons(lessons) {
      const coursesMap = new Map();
      
      lessons.forEach((lesson, index) => {
        if (!lesson?.topicId) {
          return;
        }
        
        const topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) {
          return;
        }
        
        const topicName = this.getTopicNameFromLesson(lesson);
        if (!topicName) {
          return;
        }
        
        if (!coursesMap.has(topicId)) {
          const newCourse = {
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
          };
          coursesMap.set(topicId, newCourse);
        } else {
          const course = coursesMap.get(topicId);
          course.lessons.push(lesson);
          course.lessonCount++;
          course.totalTime += this.calculateLessonTime(lesson);
        }
      });
      
      const coursesArray = Array.from(coursesMap.values());
      const sortedCourses = coursesArray.sort((a, b) => {
        if (a.type !== b.type) {
          if (a.type === 'free') return -1;
          if (b.type === 'free') return 1;
        }
        return a.subject.localeCompare(b.subject);
      });
      return sortedCourses;
    },

    extractSubjects() {
      const subjects = new Set();
      this.allCourses.forEach(course => {
        if (course.subject) {
          subjects.add(course.subject);
        }
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
        this.errorMessage = 'Maximum number of retry attempts exceeded';
        return;
      }
      
      this.retryCount++;
      await this.initializeCourses();
      
      if (!this.errorMessage) {
        this.retryCount = 0;
      }
    },

    handleCourseClick(course) {
      this.handleStartCourse(course);
    },

    async handleStartCourse(course) {
      if (!course?._id || this.processingCourse === course._id || this.navigationInProgress) {
        return;
      }
      this.processingCourse = course._id;
      this.navigationInProgress = true;
      
      try {
        const topicType = this.getTopicType(course);
        const isAuthenticated = this.checkUserAuthentication();

        if (topicType === 'free') {
          const firstLesson = course.lessons && course.lessons.length > 0 ? course.lessons[0] : null;
          
          if (firstLesson && firstLesson._id) {
            const lessonId = String(firstLesson._id).trim();
            
            if (!lessonId || lessonId === 'null' || lessonId === 'undefined' || lessonId === '') {
              this.errorMessage = 'Invalid lesson ID';
              return;
            }

            try {
              await this.$router.push({ 
                name: 'LessonPage',
                params: { id: lessonId },
                query: { 
                  source: 'aced-section',
                  guest: !isAuthenticated ? 'true' : undefined,
                  type: 'free'
                }
              });
            } catch (navError) {
              const guestParam = !isAuthenticated ? '&guest=true&type=free' : '&type=free';
              window.location.href = `/lesson/${lessonId}?source=aced-section${guestParam}`;
            }
            
          } else {
            try {
              await this.$router.push({ 
                name: 'TopicOverview',
                params: { id: course._id },
                query: { 
                  source: 'aced-section',
                  guest: !isAuthenticated ? 'true' : undefined,
                  type: 'free'
                }
              });
            } catch (topicError) {
              this.errorMessage = 'Unable to open topic';
            }
          }
        } else {
          if (isAuthenticated) {
            const firstLesson = course.lessons && course.lessons.length > 0 ? course.lessons[0] : null;
            
            if (firstLesson && firstLesson._id) {
              const lessonId = String(firstLesson._id).trim();
              
              try {
                await this.$router.push({ 
                  name: 'LessonPage',
                  params: { id: lessonId },
                  query: { 
                    source: 'aced-section',
                    type: topicType
                  }
                });
              } catch (navError) {
                window.location.href = `/lesson/${lessonId}?source=aced-section&type=${topicType}`;
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
      const auth = getAuth();
      const isAuth = !!auth.currentUser;
      return isAuth;
    },

    triggerRegistration() {
      const hero = document.getElementById("hero");
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          window.dispatchEvent(new Event("open-Login-modal"));
        }, 600);
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
      let errorMessage = 'An error occurred while loading courses';
      
      if (error?.response) {
        const status = error.response.status;
        switch (status) {
          case 404:
            errorMessage = 'Courses not found';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = `Server error (${status})`;
        }
      } else if (error?.request) {
        errorMessage = 'Network error. Check your connection.';
      }
      
      this.errorMessage = errorMessage;
    },

    getTopicName(course) {
      if (!course) return 'Untitled';
      return course.name || course.topicName || course.topic || course.title || 'Untitled';
    },

    getTopicDescription(course) {
      if (!course) return 'Learn new skills';
      
      const description = course.description || course.topicDescription;
      if (description && description.length > 85) {
        return description.substring(0, 85) + '...';
      }
      return description || `Learn ${this.getTopicName(course)} with practical exercises`;
    },

    getTopicType(course) {
      if (!course) return 'free';
      
      const type = course.type || course.accessType || course.pricing || 'free';
      const normalizedType = String(type).toLowerCase();
      
      if (normalizedType === 'premium' || normalizedType === 'paid' || normalizedType === 'start') {
        return 'premium';
      }
      if (normalizedType === 'pro' || normalizedType === 'professional') {
        return 'pro';
      }
      return 'free';
    },

    getTopicTypeLabel(course) {
      const type = this.getTopicType(course);
      const labels = { free: 'Free', premium: 'Premium', pro: 'Pro' };
      return labels[type] || 'Free';
    },

    extractTopicId(topicId) {
      if (typeof topicId === 'string') return topicId;
      if (typeof topicId === 'object' && topicId !== null) {
        return topicId._id || topicId.id || String(topicId);
      }
      return String(topicId);
    },

    getTopicNameFromLesson(lesson) {
      if (!lesson) return 'No Topic';
      return lesson.topic || lesson.lessonName || lesson.title || 'No Topic';
    },

    calculateLessonTime(lesson) {
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime);
      if (lesson.duration) return parseInt(lesson.duration);
      return 10;
    }
  }
};
</script>