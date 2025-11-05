<template>
  <div class="professional-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="welcome-section">
          <h1 class="main-title">Dashboard</h1>
          <p class="date-text">{{ currentDate }}</p>
        </div>
        <div class="header-stats">
          <div class="stat-badge streak">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <div class="stat-info">
              <div class="stat-label">Streak</div>
              <div class="stat-value">{{ userStreak }} days</div>
            </div>
          </div>
          <div class="stat-badge points">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <div class="stat-info">
              <div class="stat-label">Points</div>
              <div class="stat-value">{{ totalPoints }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="main-column">
        <div class="quick-stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper purple">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div class="stat-data">
              <div class="stat-number">{{ studyList.length }}</div>
              <div class="stat-text">Total Courses</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper green">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="stat-data">
              <div class="stat-number">{{ completedCourses }}</div>
              <div class="stat-text">Completed</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper blue">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-data">
              <div class="stat-number">{{ totalHoursStudied }}</div>
              <div class="stat-text">Hours Studied</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper orange">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div class="stat-data">
              <div class="stat-number">{{ weekProgress }}%</div>
              <div class="stat-text">Weekly Progress</div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div class="header-left">
              <div class="section-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="20" x2="12" y2="10"/>
                  <line x1="18" y1="20" x2="18" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
              </div>
              <div>
                <h2 class="section-title">Active Courses</h2>
                <p class="section-subtitle">{{ inProgressCourses }} in progress</p>
              </div>
            </div>
            <router-link to="/profile/my-courses" class="view-all-link">
              All Courses
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </router-link>
          </div>

          <div v-if="loadingStudyList" class="loading-state">
            <div class="spinner"></div>
            <p>Loading courses...</p>
          </div>

          <div v-else-if="filteredStudyList.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <p class="empty-text">You don't have any active courses yet</p>
            <router-link to="/profile/catalogue" class="add-course-btn">
              Add Course
            </router-link>
          </div>

          <div v-else class="courses-list">
            <div 
              v-for="course in displayedCourses" 
              :key="course._id"
              class="course-card"
              @click="navigateToCourse(course)"
            >
              <div class="course-header">
                <div class="course-info">
                  <div class="course-title-row">
                    <h3 class="course-title">{{ getCourseName(course) }}</h3>
                    <span :class="['type-badge', getTypeClass(course)]">
                      {{ getTypeLabel(course) }}
                    </span>
                  </div>
                  <div class="course-meta">
                    <span class="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      Level {{ course.level || 1 }}
                    </span>
                    <span class="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {{ formatTime(course.progress.totalTime) }}
                    </span>
                    <span class="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {{ getLastAccessed(course) }}
                    </span>
                  </div>
                </div>
                <button class="play-btn" @click.stop="startCourse(course)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </button>
              </div>

              <div class="course-progress-section">
                <div class="progress-header">
                  <span class="next-lesson">
                    Next lesson: {{ getNextLesson(course) }}
                  </span>
                  <span class="lessons-count">
                    {{ course.progress?.completedLessons || 0 }}/{{ course.lessons?.length || 0 }}
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill"
                    :style="{ width: `${course.progress?.percent || 0}%` }"
                    :class="getProgressColorClass(course.progress?.percent || 0)"
                  ></div>
                </div>
              </div>

              <div class="course-footer">
                <span class="progress-percent">
                  {{ course.progress?.percent || 0 }}% complete
                </span>
                <button class="continue-btn" @click.stop="startCourse(course)">
                  Continue
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title-standalone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Quick Access
          </h2>
          <div class="quick-actions-grid">
            <router-link
              v-for="action in quickActions"
              :key="action.id"
              :to="action.path"
              :class="['action-card', action.color]"
              @click="handleActionClick(action, $event)"
            >
              <div v-if="action.premium" class="premium-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <svg class="action-icon" v-html="action.icon"></svg>
              <span class="action-title">{{ action.title }}</span>
              <span class="action-description">{{ action.description }}</span>
            </router-link>
          </div>
        </div>
      </div>

      <div class="sidebar-column">
        <div class="section-card">
          <div class="section-header small">
            <div class="section-icon-badge green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <h3 class="section-title small">Weekly Goals</h3>
              <p class="section-subtitle">{{ completedGoals }}/{{ weeklyGoals.length }} completed</p>
            </div>
          </div>
          <div class="goals-list">
            <div v-for="goal in weeklyGoals" :key="goal.id" class="goal-item">
              <div class="goal-header">
                <span class="goal-title">{{ goal.title }}</span>
                <span class="goal-progress">{{ goal.current }}/{{ goal.target }}</span>
              </div>
              <div class="progress-bar-container small">
                <div 
                  class="progress-bar-fill green"
                  :style="{ width: `${goal.progress}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header small">
            <div class="section-icon-badge blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3 class="section-title small">Recent Activity</h3>
          </div>
          <div v-if="recentActivity.length === 0" class="empty-activity">
            <p>No recent activity</p>
          </div>
          <div v-else class="activity-list">
            <div 
              v-for="activity in recentActivity" 
              :key="activity.id"
              class="activity-item"
            >
              <div :class="['activity-icon-wrapper', activity.color]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="activity.iconPath"></svg>
              </div>
              <div class="activity-content">
                <p class="activity-title">{{ activity.title }}</p>
                <p class="activity-time">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="insights-card">
          <div class="insights-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
              <path d="M22 12A10 10 0 0 0 12 2v10z"/>
            </svg>
            <h3 class="insights-title">Learning Statistics</h3>
          </div>
          <div class="insights-content">
            <div class="insight-item">
              <div class="insight-header">
                <span class="insight-label">Weekly Progress</span>
                <span class="insight-value">{{ weekProgress }}%</span>
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar-fill white"
                  :style="{ width: `${weekProgress}%` }"
                ></div>
              </div>
            </div>
            <div class="insight-divider"></div>
            <div class="insight-stat">
              <div class="insight-stat-label">Average Test Score</div>
              <div class="insight-stat-value">{{ averageTestScore }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PaymentModal
      v-if="userId && showPaywall"
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="handlePaymentSuccess($event)"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { userStatusMixin } from '@/composables/useUserStatus';
import { 
  getUserStudyList,
  getUserProgress,
  getTopicById,
  getLessonsByTopic
} from '@/api';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

// Helper function to normalize a date to the start of the day
const startOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export default {
  name: 'ProfessionalMainPage',
  components: { 
    PaymentModal 
  },
  
  mixins: [userStatusMixin],
  
  data() {
    return {
      userId: null,
      lang: localStorage.getItem('lang') || 'en',
      
      studyList: [],
      userProgress: [],
      loadingStudyList: true,
      
      showPaywall: false,
      requestedTopicId: null,
      
      currentDate: '',
      
      quickActions: [
        { 
          id: 1, 
          title: 'Course Catalog', 
          description: 'Browse all available courses',
          icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>', 
          path: '/profile/catalogue', 
          color: 'purple',
          premium: false 
        },
        { 
          id: 2, 
          title: 'Analytics', 
          description: 'Detailed learning statistics',
          icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', 
          path: '/profile/analytics', 
          color: 'blue',
          premium: true 
        },
        { 
          id: 3, 
          title: 'Homework', 
          description: 'Practice problems and exercises',
          icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>', 
          path: '/profile/homeworks', 
          color: 'green',
          premium: false 
        },
        { 
          id: 4, 
          title: 'Tests & Quizzes', 
          description: 'Test your knowledge',
          icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', 
          path: '/profile/tests', 
          color: 'orange',
          premium: true 
        },
        { 
          id: 5, 
          title: 'My Goals', 
          description: 'Track your progress',
          icon: '<circle cx="12" cy="12" r="10"/><path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', 
          path: '/profile/goal', 
          color: 'pink',
          premium: true 
        },
        { 
          id: 6, 
          title: 'Vocabulary', 
          description: 'Learned terms and concepts',
          icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', 
          path: '/profile/vocabulary', 
          color: 'indigo',
          premium: true 
        }
      ],
      
      weeklyGoals: [
        { id: 1, title: 'Complete 5 lessons', current: 0, target: 5, progress: 0 },
        { id: 2, title: 'Study 2 hours', current: 0, target: 2, progress: 0 },
        { id: 3, title: 'Pass 3 tests', current: 0, target: 3, progress: 0 }
      ],
      
      recentActivity: []
    };
  },
  
  computed: {
    ...mapGetters('user', {
      vuexUserStatus: 'userStatus',
    }),
    
    currentUserStatus() {
      return this.vuexUserStatus || localStorage.getItem('userStatus') || 'free';
    },
    
    filteredStudyList() {
      return this.studyList.filter(course => 
        course?.lessons?.length > 0
      );
    },
    
    displayedCourses() {
      return this.filteredStudyList.slice(0, 3);
    },
    
    completedCourses() {
      return this.studyList.filter(c => c.progress?.percent === 100).length;
    },
    
    inProgressCourses() {
      return this.studyList.filter(c => 
        c.progress?.percent > 0 && c.progress?.percent < 100
      ).length;
    },
    
    totalHoursStudied() {
      const totalMinutes = this.studyList.reduce((sum, course) => 
        sum + (course.progress?.completedTime || 0), 0
      );
      return (totalMinutes / 60).toFixed(1);
    },
    
    weekProgress() {
      if (this.studyList.length === 0) return 0;
      const totalProgress = this.studyList.reduce((sum, c) => 
        sum + (c.progress?.percent || 0), 0
      );
      return Math.round(totalProgress / this.studyList.length);
    },
    
    userStreak() {
      if (this.userProgress.length === 0) return 0;

      const completionDates = [
        ...new Set(
          this.userProgress
            .filter(p => p.completedAt)
            .map(p => startOfDay(p.completedAt).getTime())
        ),
      ].sort((a, b) => b - a);

      if (completionDates.length === 0) return 0;

      const today = startOfDay(new Date()).getTime();
      const yesterday = startOfDay(new Date(Date.now() - 86400000)).getTime();

      if (completionDates[0] < yesterday) return 0;

      let streak = 0;
      let expectedDate = completionDates[0] === today ? today : yesterday;
      
      for (const date of completionDates) {
        if (date === expectedDate) {
          streak++;
          expectedDate -= 86400000;
        } else {
          break;
        }
      }
      
      return streak;
    },
    
    totalPoints() {
      return this.userProgress.reduce((sum, p) => sum + (p.points || 0), 0);
    },
    
    averageTestScore() {
      const testScores = this.userProgress
        .filter(p => p.testScore != null)
        .map(p => p.testScore);
      if (testScores.length === 0) return 0;
      const totalScore = testScores.reduce((a, b) => a + b, 0);
      return Math.round(totalScore / testScores.length);
    },
    
    completedGoals() {
      return this.weeklyGoals.filter(g => g.progress >= 100).length;
    }
  },
  
  async mounted() {
    await this.initialize();
  },
  
  methods: {
    async initialize() {
      this.userId = this.$store?.state?.firebaseUserId || 
                    localStorage.getItem('firebaseUserId') || 
                    localStorage.getItem('userId');
      
      if (!this.userId) {
        this.$router.push('/');
        return;
      }
      
      this.updateCurrentDate();
      setInterval(this.updateCurrentDate, 60000);
      
      await this.loadData();
      this.updateGoalsFromProgress();
      this.generateRecentActivity();
    },
    
    updateCurrentDate() {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      this.currentDate = new Date().toLocaleDateString('en-US', options);
    },
    
    async loadData() {
      this.loadingStudyList = true;
      try {
        const [studyListResult, progressResult] = await Promise.all([
          getUserStudyList(this.userId),
          getUserProgress(this.userId)
        ]);
        
        if (progressResult?.success && Array.isArray(progressResult.data)) {
          this.userProgress = progressResult.data;
        }

        if (studyListResult?.success && Array.isArray(studyListResult.data)) {
          this.studyList = await this.enrichStudyList(studyListResult.data);
        }
        
      } catch (error) {
        console.error('❌ Data loading error:', error);
      } finally {
        this.loadingStudyList = false;
      }
    },
    
    async enrichStudyList(rawList) {
      const enrichedPromises = rawList
        .filter(entry => entry?.topicId)
        .map(async (entry) => {
          try {
            const topicResult = await getTopicById(entry.topicId);
            let topic = topicResult?.success ? topicResult.data : entry;
            
            if (!topic.lessons || topic.lessons.length === 0) {
              const lessonsResult = await getLessonsByTopic(entry.topicId);
              if (lessonsResult?.success && lessonsResult.data) {
                topic.lessons = lessonsResult.data;
              }
            }
            
            return {
              ...topic,
              progress: this.calculateProgress(topic),
              lastAccessed: entry.lastAccessed || new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error enriching topic ${entry.topicId}:`, error);
            return null;
          }
        });
      
      const enriched = await Promise.all(enrichedPromises);
      return enriched.filter(Boolean);
    },
    
    calculateProgress(topic) {
      const lessons = topic.lessons || [];
      if (lessons.length === 0) {
        return { percent: 0, completedLessons: 0, totalLessons: 0, completedTime: 0, totalTime: 0 };
      }
      
      let completedLessons = 0;
      let completedTime = 0;
      const totalTime = lessons.reduce((sum, lesson) => sum + (lesson.estimatedTime || 10), 0);
      
      lessons.forEach(lesson => {
        const progress = this.userProgress.find(p => (p.lessonId?._id || p.lessonId) === lesson._id);
        if (progress?.completed) {
          completedLessons++;
          completedTime += lesson.estimatedTime || 10;
        }
      });
      
      return {
        percent: Math.round((completedLessons / lessons.length) * 100),
        completedLessons,
        totalLessons: lessons.length,
        completedTime,
        totalTime
      };
    },

    updateGoalsFromProgress() {
      const thisWeekProgress = this.userProgress.filter(p => this.isThisWeek(p.completedAt));
      
      const completedLessonsThisWeek = thisWeekProgress.filter(p => p.completed).length;
      const testsThisWeek = thisWeekProgress.filter(p => p.testScore != null).length;
      
      const hoursThisWeek = this.studyList.reduce((sum, course) => {
        const lessonTimes = course.lessons.reduce((lessonSum, lesson) => {
            const progress = thisWeekProgress.find(p => (p.lessonId?._id || p.lessonId) === lesson._id);
            return lessonSum + (progress?.completed ? (lesson.estimatedTime || 10) : 0);
        }, 0);
        return sum + lessonTimes;
      }, 0) / 60;

      this.weeklyGoals[0].current = Math.min(completedLessonsThisWeek, this.weeklyGoals[0].target);
      this.weeklyGoals[0].progress = Math.min((this.weeklyGoals[0].current / this.weeklyGoals[0].target) * 100, 100);

      this.weeklyGoals[1].current = parseFloat(Math.min(hoursThisWeek, this.weeklyGoals[1].target).toFixed(1));
      this.weeklyGoals[1].progress = Math.min((this.weeklyGoals[1].current / this.weeklyGoals[1].target) * 100, 100);
      
      this.weeklyGoals[2].current = Math.min(testsThisWeek, this.weeklyGoals[2].target);
      this.weeklyGoals[2].progress = Math.min((this.weeklyGoals[2].current / this.weeklyGoals[2].target) * 100, 100);
    },

    generateRecentActivity() {
      const sortedProgress = [...this.userProgress]
        .filter(p => p.completedAt)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      const activities = sortedProgress.slice(0, 5).map(p => {
        if (p.testScore != null) {
          return {
            id: `test-${p._id}`,
            title: `Test result: ${p.testScore}%`,
            time: this.getTimeAgo(p.completedAt),
            iconPath: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
            color: 'blue'
          };
        }
        if (p.completed) {
          return {
            id: `lesson-${p._id}`,
            title: `Completed lesson: ${p.lessonId?.lessonName || 'Lesson'}`,
            time: this.getTimeAgo(p.completedAt),
            iconPath: '<polyline points="20 6 9 17 4 12"/>',
            color: 'green'
          };
        }
        return null;
      }).filter(Boolean);
      
      this.recentActivity = activities.slice(0, 3);
    },
    
    isThisWeek(date) {
      if (!date) return false;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return new Date(date) >= weekAgo;
    },
    
    pluralize(count, one, few, many) {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return one;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
      return many;
    },

    getTimeAgo(date) {
      if (!date) return 'recently';
      const diff = new Date() - new Date(date);
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (minutes < 1) return 'just now';
      if (hours < 1) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      if (days < 1) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      return 'over a week ago';
    },
    
    getCourseName(course) {
      return course.name || course.topicName || course.topic || course.title || 'Untitled Course';
    },
    
    getTypeClass(course) {
      return course.type || 'free';
    },
    
    getTypeLabel(course) {
      const labels = { free: 'Free', premium: 'Start', pro: 'Pro' };
      return labels[course.type] || 'Free';
    },
    
    formatTime(minutes) {
      if (!minutes) return '0 h';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        return `${hours} h ${mins > 0 ? `${mins} m` : ''}`.trim();
      }
      return `${mins} m`;
    },
    
    getLastAccessed(course) {
      return this.getTimeAgo(course.lastAccessed);
    },
    
    getNextLesson(course) {
      if (!course.lessons?.length) return 'No lessons';
      const completed = course.progress?.completedLessons || 0;
      if (completed >= course.lessons.length) return 'All completed';
      const nextLesson = course.lessons[completed];
      return nextLesson?.lessonName || nextLesson?.title || `Lesson ${completed + 1}`;
    },
    
    getProgressColorClass(percent) {
      if (percent >= 80) return 'high';
      if (percent >= 50) return 'medium';
      if (percent >= 30) return 'low';
      return 'very-low';
    },
    
    navigateToCourse(course) {
      this.$router.push(`/topic/${course._id}/overview`);
    },
    
    async startCourse(course) {
      if (!this.hasTopicAccess(course)) {
        this.requestedTopicId = course._id;
        this.showPaywall = true;
        return;
      }
      this.$router.push(`/topic/${course._id}/overview`);
    },
    
    hasTopicAccess(topic) {
      const topicType = topic.type || 'free';
      const userStatus = this.currentUserStatus;
      if (topicType === 'free') return true;
      if (userStatus === 'pro') return true;
      if (topicType === 'premium' && userStatus === 'start') return true;
      return false;
    },
    
    handleActionClick(action, event) {
      if (action.premium && !this.hasFeatureAccess(action.path)) {
        event.preventDefault();
        this.showPaywall = true;
      }
    },
    
    hasFeatureAccess(path) {
      const userStatus = this.currentUserStatus;
      if (userStatus === 'pro') return true;
      if (userStatus === 'start' && !path.includes('analytics')) return true;
      return false;
    },
    
    handlePaymentSuccess() {
      this.showPaywall = false;
      this.$forceUpdate();
    }
  }
};
</script>

<style scoped>
/* Same CSS as original - no translation needed */
/* GENERAL STYLES */
.professional-dashboard {
  min-height: 100vh;
  background: #fafafa;
  padding: 1.5rem;
}

/* HEADER */
.dashboard-header {
  max-width: 1400px;
  margin: 0 auto 2rem;
}
.header-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.welcome-section .main-title {
  font-size: 1.5rem; font-weight: 600; color: #111827; margin: 0 0 0.375rem 0;
}
.welcome-section .date-text {
  color: #6b7280; margin: 0; font-size: 0.875rem;
}
.header-stats {
  display: flex; gap: 0.75rem;
}
.stat-badge {
  display: flex; align-items: center; gap: 0.625rem; border-radius: 10px;
  padding: 0.625rem 1rem; border: 1px solid #e5e7eb; background: white;
}
.stat-badge.streak { border-color: #fed7aa; background: #fffbeb; }
.stat-badge.points { border-color: #e9d5ff; background: #faf5ff; }
.stat-badge .stat-icon { width: 1.25rem; height: 1.25rem; color: #f59e0b; }
.stat-badge.points .stat-icon { color: #a855f7; }
.stat-info { display: flex; flex-direction: column; gap: 0.125rem; }
.stat-label { font-size: 0.6875rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.025em; }
.stat-value { font-size: 1rem; font-weight: 600; color: #111827; }

/* DASHBOARD GRID */
.dashboard-grid {
  max-width: 1400px; margin: 0 auto; display: grid;
  grid-template-columns: 1fr; gap: 1.5rem;
}

/* QUICK STATS */
.quick-stats-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem; margin-bottom: 1.5rem;
}
.stat-card {
  background: white; border-radius: 10px; border: 1px solid #e5e7eb;
  padding: 1rem; display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s;
}
.stat-card:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); border-color: #d1d5db; }
.stat-icon-wrapper {
  width: 2.5rem; height: 2.5rem; border-radius: 8px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-icon-wrapper svg, .stat-icon { width: 1.25rem; height: 1.25rem; }
.stat-icon-wrapper.purple { background: #f3e8ff; color: #a855f7; }
.stat-icon-wrapper.green { background: #dcfce7; color: #10b981; }
.stat-icon-wrapper.blue { background: #dbeafe; color: #3b82f6; }
.stat-icon-wrapper.orange { background: #ffedd5; color: #f59e0b; }
.stat-data { flex: 1; }
.stat-number { font-size: 1.5rem; font-weight: 600; color: #111827; line-height: 1; margin-bottom: 0.25rem; }
.stat-text { font-size: 0.6875rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.025em; }

/* SECTION CARDS */
.section-card {
  background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb; padding: 1.5rem; margin-bottom: 1.5rem;
}
.section-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
}
.section-header.small { margin-bottom: 1rem; }
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.section-icon-badge {
  width: 2.25rem; height: 2.25rem; border-radius: 8px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  background: linear-gradient(135deg, #a855f7, #6366f1);
}
.section-icon-badge svg { width: 1.125rem; height: 1.125rem; color: white; }
.section-icon-badge.green { background: linear-gradient(135deg, #10b981, #059669); }
.section-icon-badge.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.section-title { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0; }
.section-title.small { font-size: 0.9375rem; }
.section-title-standalone {
  font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 1rem 0;
  display: flex; align-items: center; gap: 0.5rem;
}
.section-title-standalone svg { width: 1.25rem; height: 1.25rem; color: #a855f7; }
.section-subtitle { font-size: 0.8125rem; color: #6b7280; margin: 0.25rem 0 0 0; }
.view-all-link {
  color: #a855f7; font-weight: 500; font-size: 0.8125rem; text-decoration: none;
  transition: color 0.2s; display: flex; align-items: center; gap: 0.25rem;
}
.view-all-link:hover { color: #9333ea; }
.view-all-link svg { width: 0.875rem; height: 0.875rem; }

/* LOADING & EMPTY STATES */
.loading-state, .empty-state { padding: 2.5rem 1.5rem; text-align: center; }
.spinner {
  width: 2.5rem; height: 2.5rem; border: 2px solid #e5e7eb; border-top-color: #a855f7;
  border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { width: 3rem; height: 3rem; color: #d1d5db; margin: 0 auto 1rem; }
.empty-text { color: #6b7280; margin-bottom: 1.5rem; font-size: 0.875rem; }
.empty-activity { padding: 2rem 1rem; text-align: center; }
.empty-activity p { color: #9ca3af; font-size: 0.875rem; }
.add-course-btn {
  display: inline-block; background: #a855f7; color: white; padding: 0.625rem 1.25rem;
  border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 0.875rem;
  transition: background 0.2s;
}
.add-course-btn:hover { background: #9333ea; }

/* COURSE CARDS */
.courses-list { display: flex; flex-direction: column; gap: 1rem; }
.course-card {
  border: 1px solid #e5e7eb; border-radius: 10px; padding: 1rem;
  cursor: pointer; transition: all 0.2s; background: white;
}
.course-card:hover { border-color: #a855f7; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1); }
.course-header { display: flex; justify-content: space-between; margin-bottom: 0.875rem; }
.course-info { flex: 1; min-width: 0; }
.course-title-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.course-title { font-size: 1rem; font-weight: 600; color: #111827; margin: 0; transition: color 0.2s; }
.course-card:hover .course-title { color: #a855f7; }
.type-badge {
  font-size: 0.6875rem; padding: 0.1875rem 0.5rem; border-radius: 6px; border: 1px solid;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;
}
.type-badge.free { background: #f3f4f6; color: #6b7280; border-color: #d1d5db; }
.type-badge.premium { background: #faf5ff; color: #a855f7; border-color: #e9d5ff; }
.type-badge.pro { background: linear-gradient(to right, #faf5ff, #fce7f3); color: #a855f7; border-color: #e9d5ff; }
.course-meta { display: flex; gap: 1rem; flex-wrap: wrap; }
.meta-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: #6b7280; }
.meta-item svg { width: 0.875rem; height: 0.875rem; }
.play-btn {
  width: 2.5rem; height: 2.5rem; background: #f3e8ff; border: none; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.2s; flex-shrink: 0; color: #a855f7;
}
.play-btn:hover { background: #a855f7; color: white; }
.play-btn svg { width: 1rem; height: 1rem; }
.course-progress-section { margin-bottom: 0.875rem; }
.progress-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8125rem; gap: 0.5rem; }
.next-lesson { color: #111827; font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lessons-count { color: #6b7280; font-weight: 600; flex-shrink: 0; }
.progress-bar-container { width: 100%; height: 6px; background: #f3f4f6; border-radius: 9999px; overflow: hidden; }
.progress-bar-container.small { height: 5px; }
.progress-bar-fill { height: 100%; border-radius: 9999px; transition: width 0.5s ease; }
.progress-bar-fill.high { background: linear-gradient(to right, #10b981, #059669); }
.progress-bar-fill.medium { background: linear-gradient(to right, #3b82f6, #2563eb); }
.progress-bar-fill.low { background: linear-gradient(to right, #f59e0b, #d97706); }
.progress-bar-fill.very-low { background: linear-gradient(to right, #ef4444, #dc2626); }
.progress-bar-fill.green { background: linear-gradient(to right, #10b981, #059669); }
.progress-bar-fill.white { background: white; }
.course-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 0.875rem; border-top: 1px solid #f3f4f6; }
.progress-percent { font-size: 0.8125rem; font-weight: 600; color: #a855f7; }
.continue-btn {
  background: none; border: none; color: #6b7280; font-weight: 500; font-size: 0.8125rem;
  cursor: pointer; transition: color 0.2s; display: flex; align-items: center; gap: 0.25rem; padding: 0;
}
.continue-btn:hover { color: #a855f7; }
.continue-btn svg { width: 0.875rem; height: 0.875rem; }

/* QUICK ACTIONS */
.quick-actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
.action-card {
  position: relative; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.5rem; padding: 1.25rem 1rem; border-radius: 10px;
  text-decoration: none; color: white; text-align: center;
  transition: all 0.2s; border: none;
}
.action-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12); }
.action-card.purple { background: linear-gradient(135deg, #a855f7, #9333ea); }
.action-card.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.action-card.green { background: linear-gradient(135deg, #10b981, #059669); }
.action-card.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.action-card.pink { background: linear-gradient(135deg, #ec4899, #db2777); }
.action-card.indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.premium-badge {
  position: absolute; top: 0.5rem; right: 0.5rem; width: 1.25rem; height: 1.25rem;
  background: rgba(255, 255, 255, 0.25); border-radius: 50%; display: flex;
  align-items: center; justify-content: center;
}
.premium-badge svg { width: 0.75rem; height: 0.75rem; color: white; }
.action-icon {
  width: 2rem; height: 2rem; color: white; stroke: currentColor; fill: none;
  stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
  margin-bottom: 0.25rem;
}
.action-title {
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.3;
}
.action-description {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
  line-height: 1.3;
  margin-top: -0.25rem;
}

/* SIDEBAR */
.sidebar-column { display: flex; flex-direction: column; gap: 1.5rem; }
.goals-list { display: flex; flex-direction: column; gap: 1rem; }
.goal-item { display: flex; flex-direction: column; gap: 0.5rem; }
.goal-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; }
.goal-title { color: #111827; font-weight: 500; }
.goal-progress { color: #6b7280; font-weight: 600; }
.activity-list { display: flex; flex-direction: column; gap: 0.625rem; }
.activity-item { display: flex; gap: 0.75rem; padding: 0.75rem; border-radius: 8px; transition: background 0.2s; }
.activity-item:hover { background: #f9fafb; }
.activity-icon-wrapper {
  width: 2.25rem; height: 2.25rem; border-radius: 8px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.activity-icon-wrapper svg { width: 1.125rem; height: 1.125rem; }
.activity-icon-wrapper.green { background: #dcfce7; color: #10b981; }
.activity-icon-wrapper.blue { background: #dbeafe; color: #3b82f6; }
.activity-content { flex: 1; min-width: 0; }
.activity-title { font-size: 0.8125rem; font-weight: 500; color: #111827; margin: 0 0 0.25rem 0; }
.activity-time { font-size: 0.75rem; color: #6b7280; margin: 0; }

/* INSIGHTS CARD */
.insights-card {
  background: linear-gradient(135deg, #a855f7, #6366f1); border-radius: 12px;
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.25); padding: 1.5rem; color: white;
}
.insights-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; }
.insights-header svg { width: 1.25rem; height: 1.25rem; }
.insights-title { font-size: 1rem; font-weight: 600; margin: 0; }
.insights-content { display: flex; flex-direction: column; gap: 1rem; }
.insight-item { display: flex; flex-direction: column; gap: 0.5rem; }
.insight-header { display: flex; justify-content: space-between; align-items: center; }
.insight-label { font-size: 0.8125rem; opacity: 0.9; }
.insight-value { font-weight: 600; font-size: 0.9375rem; }
.insight-divider { height: 1px; background: rgba(255, 255, 255, 0.2); margin: 0.5rem 0; }
.insight-stat { padding-top: 0.5rem; }
.insight-stat-label { font-size: 0.8125rem; opacity: 0.9; margin-bottom: 0.25rem; }
.insight-stat-value { font-size: 1.5rem; font-weight: 600; }

/* RESPONSIVE & ACCESSIBILITY */
@media (min-width: 768px) {
  .professional-dashboard { padding: 2rem 2.5rem; }
  .header-content { flex-direction: row; justify-content: space-between; align-items: center; }
  .quick-stats-grid { grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .quick-actions-grid { grid-template-columns: repeat(3, 1fr); gap: 1rem; }
}
@media (min-width: 1024px) {
  .dashboard-grid { grid-template-columns: 2fr 1fr; }
}
@media (max-width: 640px) {
  .professional-dashboard { padding: 1rem; }
  .header-content, .section-card { padding: 1.125rem; }
  .welcome-section .main-title { font-size: 1.375rem; }
  .stat-badge { padding: 0.5rem 0.75rem; }
  .course-card { padding: 0.875rem; }
}
.action-card:focus-visible, .course-card:focus-visible, .continue-btn:focus-visible, .play-btn:focus-visible {
  outline: 2px solid #a855f7; outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
@media (prefers-color-scheme: dark) {
  .professional-dashboard { background: #111827; }
  .header-content, .stat-card, .section-card, .course-card { background: #1f2937; border-color: #374151; }
  .welcome-section .main-title, .stat-value, .stat-number, .section-title, .course-title, .goal-title, .activity-title, .next-lesson { color: #f9fafb; }
  .date-text, .stat-label, .stat-text, .section-subtitle, .meta-item, .empty-text, .lessons-count, .goal-progress, .activity-time { color: #9ca3af; }
  .stat-badge.streak { background: #36291a; border-color: #7c4a1b; }
  .stat-badge.points { background: #2f253f; border-color: #5c3b8a; }
  .progress-bar-container { background: #374151; }
  .course-footer { border-top-color: #374151; }
}
</style>