<template>
  <section class="relative py-24 overflow-hidden bg-slate-50" id="aced">
    <!-- Background Elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute top-[10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-100/40 blur-[120px]"></div>
      <div class="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-100/40 blur-[120px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-16">
        <div class="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-bold uppercase tracking-wide mb-6 shadow-sm">
          🚀 Start Learning
        </div>
        <h1 class="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
          Start your learning <br class="hidden md:block" /> journey today
        </h1>
        <p class="text-xl text-slate-600 max-w-2xl leading-relaxed">
          Choose a course and start learning right now. Access high-quality lessons, interactive exercises, and expert support.
        </p>
      </div>

      <!-- Course Cards Grid -->
      <div class="relative z-10">
        <!-- Loading State -->
        <div v-if="loadingCourses" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="n in 6" :key="n" class="h-[420px] bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse flex items-center justify-center">
            <div class="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        </div>
        
        <!-- Courses List -->
        <div v-else-if="displayedCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="course in displayedCourses" 
            :key="course._id"
            class="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer flex flex-col h-full"
            :class="{
              'border-indigo-200 shadow-indigo-100': getTopicType(course) === 'free',
              'border-purple-200 shadow-purple-100': getTopicType(course) === 'premium',
              'border-pink-200 shadow-pink-100': getTopicType(course) === 'pro'
            }"
            @click="handleCourseClick(course)"
          >
            <!-- Accent Bar -->
            <div class="absolute top-0 left-0 w-full h-1.5 transition-all duration-300 group-hover:h-2"
              :class="{
                'bg-gradient-to-r from-indigo-400 to-purple-500': getTopicType(course) === 'free',
                'bg-gradient-to-r from-purple-400 to-fuchsia-500': getTopicType(course) === 'premium',
                'bg-gradient-to-r from-pink-400 to-rose-500': getTopicType(course) === 'pro'
              }"
            ></div>
            
            <!-- Course Header -->
            <div class="p-8 pb-4">
              <div class="flex justify-between items-start mb-6">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border"
                  :class="{
                    'bg-indigo-50 text-indigo-700 border-indigo-100': getTopicType(course) === 'free',
                    'bg-purple-50 text-purple-700 border-purple-100': getTopicType(course) === 'premium',
                    'bg-pink-50 text-pink-700 border-pink-100': getTopicType(course) === 'pro'
                  }"
                >
                  <span>{{ getTopicTypeIcon(course) }}</span>
                  <span>{{ getTopicTypeLabel(course) }}</span>
                </div>
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Level</span>
                  <span class="text-sm font-extrabold text-slate-700">{{ course.level || 1 }}</span>
                </div>
              </div>
              
              <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {{ getTopicName(course) }}
              </h3>
              <p class="text-slate-500 text-sm leading-relaxed line-clamp-3">
                {{ getTopicDescription(course) }}
              </p>
            </div>
            
            <!-- Spacer -->
            <div class="flex-grow"></div>
            
            <!-- Course Meta -->
            <div class="px-8 py-6 bg-slate-50/50 border-t border-slate-100 mt-4">
              <div class="flex items-center gap-6 mb-6 text-sm font-medium text-slate-600">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  <span>{{ course.lessons?.length || 0 }} lessons</span>
                </div>
                <div class="w-1 h-1 rounded-full bg-slate-300"></div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{ Math.round((course.totalTime || 0) / 60) || 1 }} hours</span>
                </div>
              </div>
              
              <button 
                class="w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                :class="{
                  'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40': getTopicType(course) === 'free',
                  'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-purple-500/25 hover:shadow-purple-500/40': getTopicType(course) === 'premium',
                  'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-pink-500/25 hover:shadow-pink-500/40': getTopicType(course) === 'pro'
                }"
                @click.stop="handleStartCourse(course)"
                :disabled="processingCourse === course._id"
              >
                <span v-if="processingCourse === course._id" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span v-else class="flex items-center gap-2">
                  <span>{{ getStartButtonText(course) }}</span>
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center py-20 px-8 bg-white rounded-3xl border border-slate-200 max-w-lg mx-auto">
          <div class="text-6xl mb-6 opacity-30">🔍</div>
          <h3 class="text-2xl font-bold text-slate-900 mb-3">No Courses Found</h3>
          <p class="text-slate-500 mb-8">We couldn't load the courses at this time.</p>
          <button v-if="!loadingCourses" @click="refreshCourses" class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
            <span>🔄</span>
            <span>Try Again</span>
          </button>
        </div>
      </div>

      <!-- Registration Modal -->
      <div v-if="showRegistrationModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click="closeRegistrationModal">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
        
        <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 md:p-10 transform transition-all scale-100" @click.stop>
          <button class="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" @click="closeRegistrationModal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div class="text-center mb-8">
            <div class="text-5xl mb-6">🎓</div>
            <h2 class="text-3xl font-bold text-slate-900 mb-3">Premium Access</h2>
            <p class="text-slate-500">Registration is required to access this course</p>
          </div>
          
          <div v-if="selectedCourse" class="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 mb-8">
            <h3 class="text-xl font-bold text-slate-900 mb-2">{{ getTopicName(selectedCourse) }}</h3>
            <p class="text-indigo-600 font-bold text-sm mb-6 uppercase tracking-wide">{{ getTopicTypeLabel(selectedCourse) }} course</p>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3 text-slate-600 font-medium">
                <span class="text-xl">📚</span>
                <span>{{ selectedCourse.lessons?.length || 0 }} lessons</span>
              </div>
              <div class="flex items-center gap-3 text-slate-600 font-medium">
                <span class="text-xl">🎯</span>
                <span>Practical exercises</span>
              </div>
              <div class="flex items-center gap-3 text-slate-600 font-medium">
                <span class="text-xl">🏆</span>
                <span>Certificate upon completion</span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-3">
            <button class="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3" @click="triggerRegistration">
              <span>🚀</span>
              <span>Register and Start</span>
            </button>
            <button class="w-full py-4 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors" @click="closeRegistrationModal">
              Not Ready Yet
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="fixed bottom-8 right-8 z-[100] max-w-md w-full bg-red-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-slide-up">
        <span class="text-2xl">⚠️</span>
        <span class="flex-1 font-bold">{{ errorMessage }}</span>
        <button class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors" @click="refreshCourses">
          Retry
        </button>
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

    getTopicTypeIcon(course) {
      const type = this.getTopicType(course);
      const icons = { free: '✨', premium: '💎', pro: '👑' };
      return icons[type] || '✨';
    },

    getTopicTypeLabel(course) {
      const type = this.getTopicType(course);
      const labels = { free: 'Free', premium: 'Premium', pro: 'Pro' };
      return labels[type] || 'Free';
    },

    getStartButtonText(course) {
      if (this.processingCourse === course._id) return 'Opening...';
      
      const type = this.getTopicType(course);
      const isAuthenticated = this.checkUserAuthentication();
      
      if (type === 'free') {
        return isAuthenticated ? 'Start Learning' : 'Try Free';
      }
      if (type === 'premium') return isAuthenticated ? 'Start Course' : 'Get Access';
      return isAuthenticated ? 'Open Pro' : 'Get Pro Access';
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