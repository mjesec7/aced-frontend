<template>
  <section class="aced-section" id="aced">
    <div class="section-header">
      <div class="header-content">
        <div class="label-badge">🚀 Start Learning</div>
        <h1 class="headline">Start your learning journey today</h1>
        <p class="context-text">Choose a course and start learning right now</p>
      </div>
    </div>

    <!-- Course Cards Grid -->
    <div class="courses-grid">
      <div v-if="loadingCourses" class="loading-grid">
        <div class="course-placeholder glass-card" v-for="n in 6" :key="n">
          <div class="placeholder-content">
            <div class="loader-spinner"></div>
          </div>
        </div>
      </div>
      
      <div v-else-if="displayedCourses.length > 0" class="courses-container">
        <div 
          v-for="course in displayedCourses" 
          :key="course._id"
          class="course-card"
          :class="[
            `course-${getTopicType(course)}`,
            { 'featured': isFeaturedCourse(course) }
          ]"
          @click="handleCourseClick(course)"
        >
          <!-- Accent Bar -->
          <div class="accent-bar" :class="getTopicType(course)"></div>
          
          <!-- Course Header -->
          <div class="course-header">
            <div class="header-top">
              <div class="course-badge" :class="getTopicType(course)">
                <span class="badge-icon">{{ getTopicTypeIcon(course) }}</span>
                <span class="badge-text">{{ getTopicTypeLabel(course) }}</span>
              </div>
              <div class="course-level">
                <span class="level-label">Level</span>
                <span class="level-number">{{ course.level || 1 }}</span>
              </div>
            </div>
          </div>
          
          <!-- Course Content -->
          <div class="course-content">
            <h3 class="course-title">{{ getTopicName(course) }}</h3>
            <p class="course-description">{{ getTopicDescription(course) }}</p>
          </div>
          
          <!-- Course Meta -->
          <div class="course-meta">
            <div class="meta-group">
              <div class="meta-item">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <span class="meta-text">{{ course.lessons?.length || 0 }} lessons</span>
              </div>
              <div class="meta-divider"></div>
              <div class="meta-item">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span class="meta-text">{{ Math.round((course.totalTime || 0) / 60) || 1 }} hours</span>
              </div>
            </div>
          </div>
          
          <!-- Course Footer -->
          <div class="course-footer">
            <button 
              class="action-btn"
              :class="getStartButtonClass(course)"
              @click.stop="handleStartCourse(course)"
              :disabled="processingCourse === course._id"
            >
              <span v-if="processingCourse === course._id" class="btn-spinner"></span>
              <span v-else class="btn-content">
                <span class="btn-text">{{ getStartButtonText(course) }}</span>
                <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </button>
          </div>
          
          <!-- Hover Effect Overlay -->
          <div class="hover-overlay"></div>
        </div>
      </div>
      
      <div v-else class="empty-courses glass-card">
        <div class="empty-icon">🔍</div>
        <h3>No Courses Found</h3>
        <p>Loading available courses...</p>
        <button v-if="!loadingCourses" @click="refreshCourses" class="retry-btn">
          <span>🔄</span>
          <span>Try Again</span>
        </button>
      </div>
    </div>

    <!-- Registration Modal for Premium Access -->
    <div v-if="showRegistrationModal" class="modal-overlay" @click="closeRegistrationModal">
      <div class="registration-modal glass-card" @click.stop>
        <button class="close-btn" @click="closeRegistrationModal">
          <span>×</span>
        </button>
        
        <div class="modal-header">
          <div class="modal-icon">🎓</div>
          <h2>Premium Access</h2>
          <p>Registration is required to access this course</p>
        </div>
        
        <div class="course-preview" v-if="selectedCourse">
          <div class="course-info">
            <h3>{{ getTopicName(selectedCourse) }}</h3>
            <p class="course-type">{{ getTopicTypeLabel(selectedCourse) }} course</p>
            <div class="course-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">📚</span>
                <span>{{ selectedCourse.lessons?.length || 0 }} lessons</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🎯</span>
                <span>Practical exercises</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🏆</span>
                <span>Certificate upon completion</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="register-btn" @click="triggerRegistration">
            <span class="btn-icon">🚀</span>
            <span>Register and Start</span>
            <span class="btn-glow"></span>
          </button>
          <button class="cancel-btn" @click="closeRegistrationModal">
            Not Ready Yet
          </button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="error-alert glass-card">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ errorMessage }}</span>
      <button class="retry-error-btn" @click="refreshCourses">
        <span>🔄</span>
        <span>Retry</span>
      </button>
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
      // ✅ UPDATED: Prevent duplicate processing
      if (!course?._id || this.processingCourse === course._id || this.navigationInProgress) {
return;
      }
this.processingCourse = course._id;
      this.navigationInProgress = true;
      
      try {
        const topicType = this.getTopicType(course);
        const isAuthenticated = this.checkUserAuthentication();
// ✅ UPDATED: For free courses - allow guest access
        if (topicType === 'free') {
          const firstLesson = course.lessons && course.lessons.length > 0 ? course.lessons[0] : null;
          
          if (firstLesson && firstLesson._id) {
const lessonId = String(firstLesson._id).trim();
            
            if (!lessonId || lessonId === 'null' || lessonId === 'undefined' || lessonId === '') {
this.errorMessage = 'Invalid lesson ID';
              return;
            }
// ✅ NEW: Navigate with guest parameter for unauthenticated users
            try {
              await this.$router.push({ 
                name: 'LessonPage',
                params: { id: lessonId },
                query: { 
                  source: 'aced-section',
                  guest: !isAuthenticated ? 'true' : undefined,  // ✅ Pass guest=true
                  type: 'free'  // ✅ Mark as free content
                }
              });
} catch (navError) {
// Fallback: Try direct path navigation
              const guestParam = !isAuthenticated ? '&guest=true&type=free' : '&type=free';
              window.location.href = `/lesson/${lessonId}?source=aced-section${guestParam}`;
            }
            
          } else {
            // Fallback to topic overview
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
          // ✅ UPDATED: Premium/Pro courses handling
          if (isAuthenticated) {
            // Allow authenticated users to access premium content
            const firstLesson = course.lessons && course.lessons.length > 0 ? course.lessons[0] : null;
            
            if (firstLesson && firstLesson._id) {
              const lessonId = String(firstLesson._id).trim();
              
              try {
                await this.$router.push({ 
                  name: 'LessonPage',
                  params: { id: lessonId },
                  query: { 
                    source: 'aced-section',
                    type: topicType  // Pass the course type
                  }
                });
              } catch (navError) {
window.location.href = `/lesson/${lessonId}?source=aced-section&type=${topicType}`;
              }
            }
          } else {
            // Show registration modal for unauthenticated users
            this.selectedCourse = course;
            this.showRegistrationModal = true;
          }
        }
        
      } catch (error) {
this.errorMessage = 'Unable to open course';
      } finally {
        // Reset processing flags with delay
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

    getStartButtonClass(course) {
      const type = this.getTopicType(course);
      if (type === 'pro') return 'btn-pro';
      if (type === 'premium') return 'btn-premium';
      return 'btn-free';
    },

    getStartButtonText(course) {
      if (this.processingCourse === course._id) return 'Opening...';
      
      const type = this.getTopicType(course);
      const isAuthenticated = this.checkUserAuthentication();
      
      // ✅ UPDATED: Better button text for guests
      if (type === 'free') {
        return isAuthenticated ? 'Start Learning' : 'Try Free';
      }
      if (type === 'premium') return isAuthenticated ? 'Start Course' : 'Get Access';
      return isAuthenticated ? 'Open Pro' : 'Get Pro Access';
    },

    isFeaturedCourse(course) {
      return course.type === 'free' && course.lessons?.length >= 5;
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

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap");

.aced-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 56px;
  padding: clamp(60px, 8vw, 120px) clamp(24px, 5vw, 80px);
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  min-height: 100vh;
  color: #0a0a0a;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
}

.section-header {
  text-align: left;
  max-width: 100%;
  position: relative;
  z-index: 2;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05));
  border: 1.5px solid rgba(139, 92, 246, 0.25);
  border-radius: 30px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #7c3aed;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.15);
}

.headline {
  font-size: clamp(2.25rem, 5.5vw, 3.5rem);
  font-weight: 800;
  color: #0a0a0a;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.context-text {
  font-size: clamp(1.0625rem, 2vw, 1.25rem);
  color: #525252;
  font-weight: 400;
  margin: 0;
  line-height: 1.6;
}

.courses-grid {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.loading-grid, .courses-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 28px;
  padding: 0;
}

.glass-card {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 24px;
  border: 3px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.course-placeholder {
  height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(99, 102, 241, 0.12);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* REDESIGNED COURSE CARD */
.course-card {
  position: relative;
  cursor: pointer;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border: 2.5px solid rgba(139, 92, 246, 0.15);
  border-radius: 24px;
}

.course-card.course-free {
  border: 2.5px solid rgba(139, 92, 246, 0.15);
}

.course-card.course-premium {
  border: 2.5px solid rgba(168, 85, 247, 0.15);
}

.course-card.course-pro {
  border: 2.5px solid rgba(236, 72, 153, 0.15);
}

.course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08);
}

.course-card.course-free:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 20px 48px rgba(139, 92, 246, 0.15), 0 8px 16px rgba(139, 92, 246, 0.08);
}

.course-card.course-premium:hover {
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 20px 48px rgba(168, 85, 247, 0.15), 0 8px 16px rgba(168, 85, 247, 0.08);
}

.course-card.course-pro:hover {
  border-color: rgba(236, 72, 153, 0.4);
  box-shadow: 0 20px 48px rgba(236, 72, 153, 0.15), 0 8px 16px rgba(236, 72, 153, 0.08);
}

.course-card:hover .hover-overlay {
  opacity: 1;
}

.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(79, 70, 229, 0.02) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: 1;
}

/* Accent Bar */
.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  z-index: 2;
  transition: height 0.3s ease;
}

.course-card:hover .accent-bar {
  height: 6px;
}

.accent-bar.free {
  background: linear-gradient(90deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%);
}

.accent-bar.premium {
  background: linear-gradient(90deg, #c084fc 0%, #a855f7 50%, #9333ea 100%);
}

.accent-bar.pro {
  background: linear-gradient(90deg, #f0abfc 0%, #ec4899 50%, #db2777 100%);
}

/* Course Header */
.course-header {
  padding: 24px 28px 20px;
  position: relative;
  z-index: 3;
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.03) 0%, transparent 100%);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 0.6875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: all 0.3s ease;
}

.course-badge.free {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.15), rgba(109, 40, 217, 0.1));
  color: #7c3aed;
  border: 1.5px solid rgba(139, 92, 246, 0.35);
}

.course-badge.premium {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.15), rgba(126, 34, 206, 0.1));
  color: #9333ea;
  border: 1.5px solid rgba(168, 85, 247, 0.35);
}

.course-badge.pro {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.15), rgba(190, 24, 93, 0.1));
  color: #db2777;
  border: 1.5px solid rgba(236, 72, 153, 0.35);
}

.badge-icon {
  font-size: 1rem;
}

.course-level {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05));
  border: 1.5px solid rgba(139, 92, 246, 0.15);
  border-radius: 30px;
}

.level-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #8b5cf6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.level-number {
  font-size: 1.125rem;
  font-weight: 800;
  color: #7c3aed;
  line-height: 1;
}

/* Course Content */
.course-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 28px 24px;
  position: relative;
  z-index: 3;
}

.course-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1.3;
  margin: 0;
  letter-spacing: -0.02em;
  transition: color 0.3s ease;
}

.course-card:hover .course-title {
  color: #8b5cf6;
}

.course-description {
  font-size: 0.9375rem;
  color: #737373;
  line-height: 1.65;
  margin: 0;
  font-weight: 400;
}

/* Course Meta */
.course-meta {
  padding: 20px 28px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.025) 0%, rgba(0, 0, 0, 0.035) 100%);
  border-top: 2px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 3;
  border-radius: 0 0 24px 24px;
}

.meta-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #525252;
  font-weight: 500;
}

.meta-icon {
  width: 18px;
  height: 18px;
  color: #737373;
  flex-shrink: 0;
}

.meta-text {
  font-weight: 600;
  color: #0a0a0a;
}

.meta-divider {
  width: 4px;
  height: 4px;
  background: rgba(139, 92, 246, 0.3);
  border-radius: 50%;
}

/* Course Footer */
.course-footer {
  padding: 24px 28px;
  position: relative;
  z-index: 3;
  border-top: 2px solid rgba(0, 0, 0, 0.06);
}

.action-btn {
  position: relative;
  width: 100%;
  padding: 16px 28px;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow: hidden;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.btn-text {
  font-weight: 700;
}

.btn-arrow {
  width: 20px;
  height: 20px;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(4px);
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-free {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 25%, #7c3aed 50%, #6d28d9 75%, #5b21b6 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-free::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.btn-free:hover:not(:disabled)::before {
  left: 100%;
}

.btn-free:hover:not(:disabled) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 25%, #6d28d9 50%, #5b21b6 75%, #4c1d95 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3);
}

.btn-premium {
  background: linear-gradient(135deg, #c084fc 0%, #a855f7 25%, #9333ea 50%, #7e22ce 75%, #6b21a8 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-premium::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.btn-premium:hover:not(:disabled)::before {
  left: 100%;
}

.btn-premium:hover:not(:disabled) {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 25%, #7e22ce 50%, #6b21a8 75%, #581c87 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3);
}

.btn-pro {
  background: linear-gradient(135deg, #f9a8d4 0%, #ec4899 25%, #db2777 50%, #be185d 75%, #9f1239 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-pro::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.btn-pro:hover:not(:disabled)::before {
  left: 100%;
}

.btn-pro:hover:not(:disabled) {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 25%, #be185d 50%, #9f1239 75%, #881337 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(236, 72, 153, 0.6), 0 0 40px rgba(236, 72, 153, 0.3);
}

/* Empty State */
.empty-courses {
  text-align: center;
  padding: 72px 48px;
  max-width: 540px;
  margin: 0 auto;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border: 2px solid rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4.5rem;
  margin-bottom: 24px;
  opacity: 0.25;
}

.empty-courses h3 {
  font-size: 1.625rem;
  font-weight: 700;
  color: #0a0a0a;
  margin-bottom: 14px;
  letter-spacing: -0.02em;
}

.empty-courses p {
  color: #737373;
  margin-bottom: 28px;
  font-size: 1.0625rem;
  line-height: 1.65;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.35s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.retry-btn:hover {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.45);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(16px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.registration-modal {
  width: 100%;
  max-width: 560px;
  padding: 52px;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.24);
  border: 2px solid rgba(0, 0, 0, 0.08);
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(48px) scale(0.94);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.04);
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  color: #737373;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
  transform: rotate(90deg);
}

.modal-header {
  text-align: center;
  margin-bottom: 40px;
}

.modal-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 2.25rem;
  font-weight: 800;
  color: #0a0a0a;
  margin: 0 0 14px 0;
  letter-spacing: -0.03em;
}

.modal-header p {
  color: #737373;
  font-size: 1.0625rem;
  margin: 0;
  line-height: 1.6;
  font-weight: 400;
}

.course-preview {
  padding: 32px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05));
  border-radius: 20px;
  margin-bottom: 40px;
  border: 2px solid rgba(139, 92, 246, 0.15);
}

.course-info h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0 0 10px 0;
  letter-spacing: -0.02em;
}

.course-type {
  color: #7c3aed;
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0 28px 0;
}

.course-benefits {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 1rem;
  color: #404040;
  font-weight: 600;
}

.benefit-icon {
  font-size: 1.5rem;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.register-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 40px;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 25%, #7c3aed 50%, #6d28d9 75%, #5b21b6 100%);
  color: white;
  border: none;
  border-radius: 18px;
  font-weight: 800;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.register-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.register-btn:hover::before {
  left: 100%;
}

.register-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 25%, #6d28d9 50%, #5b21b6 75%, #4c1d95 100%);
}

.btn-icon {
  font-size: 1.25rem;
}

.btn-glow {
  display: none;
}

.cancel-btn {
  padding: 18px 40px;
  background: transparent;
  color: #737373;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-radius: 18px;
  font-weight: 700;
  font-size: 1.0625rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.2);
  color: #525252;
}

/* Error Alert */
.error-alert {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 10000;
  padding: 18px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 460px;
  animation: slideInRight 0.3s ease;
  background: #ef4444;
  border: 1.5px solid rgba(239, 68, 68, 0.4);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(239, 68, 68, 0.35);
}

@keyframes slideInRight {
  from { 
    opacity: 0;
    transform: translateX(100%);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  color: white;
  font-weight: 700;
  font-size: 1rem;
}

.retry-error-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
}

.retry-error-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .loading-grid, .courses-container {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .aced-section {
    padding: 56px 24px;
    gap: 44px;
  }

  .headline {
    font-size: 2.25rem;
  }

  .courses-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .registration-modal {
    padding: 40px 28px;
  }

  .error-alert {
    bottom: 24px;
    right: 24px;
    left: 24px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .aced-section {
    padding: 44px 20px;
  }

  .headline {
    font-size: 2rem;
  }

  .course-card {
    min-height: 340px;
  }

  .course-header {
    padding: 20px 24px 16px;
  }

  .course-content {
    padding: 0 24px 20px;
  }

  .course-title {
    font-size: 1.25rem;
  }

  .course-meta {
    padding: 16px 24px;
  }

  .course-footer {
    padding: 20px 24px;
  }

  .action-btn {
    padding: 14px 24px;
    font-size: 0.9375rem;
  }

  .registration-modal {
    padding: 32px 24px;
  }

  .modal-header h2 {
    font-size: 1.75rem;
  }

  .register-btn {
    padding: 18px 32px;
    font-size: 1.0625rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>