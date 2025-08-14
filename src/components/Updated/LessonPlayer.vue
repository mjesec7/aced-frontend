<template>
  <div class="lesson-player">
    <div class="sidebar">
      <!-- Course Header -->
      <div class="course-header">
        <div class="course-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13.431m0 0a2.768 2.768 0 01-1.378-2.348v-2.185m1.378 2.348A2.768 2.768 0 0013.378 17.5v-2.185m-1.378 2.348a2.768 2.768 0 01-1.378-2.348v-2.185m1.378 2.348A2.768 2.768 0 0013.378 17.5v-2.185"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </div>
        <div>
          <h1 class="course-title">{{ course?.title || 'AI Video Mastery' }}</h1>
          <p class="course-subtitle">Complete Course</p>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-label">Progress</span>
          <span class="progress-count">{{ completedLessons }}/{{ totalLessons }} Complete</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- Lessons List -->
      <div class="lessons-list">
        <div
          v-for="(lesson, index) in lessons"
          :key="lesson.id"
          @click="selectLesson(index)"
          :class="[
            'lesson-item',
            {
              'lesson-completed': lesson.completed,
              'lesson-current': currentLessonIndex === index,
              'lesson-locked': lesson.locked
            }
          ]"
        >
          <div class="lesson-status">
            <!-- Completed Icon -->
            <div v-if="lesson.completed" class="status-icon completed">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <!-- Current Lesson Dot -->
            <div v-else-if="currentLessonIndex === index" class="status-icon current">
              <div class="current-dot"></div>
            </div>
            <!-- Default Empty Circle -->
            <div v-else class="status-icon default"></div>
          </div>

          <div class="lesson-content">
            <div class="lesson-header">
              <span class="lesson-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span v-if="currentLessonIndex === index" class="current-badge">Current</span>
            </div>
            <h3 class="lesson-title">{{ lesson.title }}</h3>
            <div class="lesson-meta">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>{{ lesson.readingTime }}</span>
            </div>
          </div>

          <div class="lesson-arrow">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div v-if="currentLesson" class="content-wrapper">
        <!-- Lesson Header -->
        <div class="lesson-header-section">
          <div class="lesson-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div class="lesson-title-section">
            <h1 class="main-lesson-title">{{ currentLesson.title }}</h1>
            <div class="lesson-meta-info">
              <div class="meta-item">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span>{{ currentLesson.readingTime }}</span>
              </div>
              <div class="meta-item">
                <span>Lesson {{ currentLessonIndex + 1 }} of {{ totalLessons }}</span>
              </div>
            </div>
          </div>
        </div>

        <p v-if="currentLesson.description" class="lesson-description">{{ currentLesson.description }}</p>

        <!-- Learning Objectives -->
        <div v-if="currentLesson.objectives && currentLesson.objectives.length" class="objectives-section">
          <h2 class="objectives-title">Learning Objectives</h2>
          <ul class="objectives-list">
            <li v-for="(objective, index) in currentLesson.objectives" :key="index" class="objective-item">
              <div class="objective-bullet"></div>
              <span>{{ objective }}</span>
            </li>
          </ul>
        </div>

        <!-- Lesson Content -->
        <div class="lesson-content-section">
          <div class="content-prose" v-html="currentLesson.content"></div>
          
          <!-- Resources Section -->
          <div v-if="currentLesson.resources && currentLesson.resources.length" class="resources-section">
            <h3>Lesson Resources</h3>
            <div class="resources-grid">
              <a
                v-for="resource in currentLesson.resources"
                :key="resource.id"
                :href="resource.url"
                download
                class="resource-item"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <div class="resource-details">
                  <span class="resource-name">{{ resource.name }}</span>
                  <span class="resource-size">{{ resource.size }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- Quiz Section -->
          <div v-if="currentLesson.quiz" class="quiz-section">
            <h3>Test Your Knowledge</h3>
            <div class="quiz-container">
              <div v-if="!quizCompleted" class="quiz-questions">
                <div class="question-card">
                  <h4>{{ currentLesson.quiz.question }}</h4>
                  <div class="quiz-options">
                    <label
                      v-for="(option, index) in currentLesson.quiz.options"
                      :key="index"
                      class="quiz-option"
                      :class="{ 'selected': selectedAnswer === index }"
                    >
                      <input
                        type="radio"
                        :name="'quiz-' + currentLesson.id"
                        :value="index"
                        v-model="selectedAnswer"
                      />
                      <span>{{ option }}</span>
                    </label>
                  </div>
                  <button
                    @click="submitQuiz"
                    :disabled="selectedAnswer === null"
                    class="quiz-submit-btn"
                  >
                    Check Answer
                  </button>
                </div>
              </div>
              <div v-else class="quiz-result">
                <div class="quiz-feedback" :class="{ 'correct': quizCorrect, 'incorrect': !quizCorrect }">
                  <svg v-if="quizCorrect" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>{{ quizCorrect ? 'Correct! Great work!' : 'Incorrect. Try again!' }}</span>
                </div>
                <button v-if="!quizCorrect" @click="quizCompleted = false" class="retry-btn">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="lesson-navigation">
          <button
            @click="previousLesson"
            :disabled="currentLessonIndex === 0"
            class="nav-btn prev-btn"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Previous Lesson
          </button>
          
          <button
            v-if="currentLesson && !currentLesson.completed && (!currentLesson.quiz || (currentLesson.quiz && quizCorrect))"
            @click="markLessonCompleted"
            class="complete-btn"
          >
            Complete Lesson
          </button>
          
          <button
            @click="nextLesson"
            :disabled="currentLessonIndex === lessons.length - 1 || (lessons[currentLessonIndex + 1] && lessons[currentLessonIndex + 1].locked)"
            class="nav-btn next-btn"
          >
            Next Lesson
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="9,6 15,12 9,18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LessonLoader',
  props: {
    course: {
      type: Object,
      required: true
    }
  },
  emits: ['back-to-courses'],
  data() {
    return {
      lessons: [],
      currentLessonIndex: 2, // Start at lesson 3 (index 2) to match the image
      currentLesson: null,
      sidebarOpen: false,
      selectedAnswer: null,
      quizCompleted: false,
      quizCorrect: false,
      componentKey: 0,
    };
  },

  computed: {
    completedLessons() {
      return this.lessons.filter(lesson => lesson.completed).length;
    },
    totalLessons() {
      return this.lessons.length;
    },
    progressPercent() {
      if (this.totalLessons === 0) return 0;
      return Math.round((this.completedLessons / this.totalLessons) * 100);
    }
  },

  watch: {
    course: {
      handler: 'initializeStudyData',
      immediate: true,
      deep: true
    },
    currentLessonIndex: {
      handler: 'updateCurrentLessonContent',
      immediate: true,
    }
  },

  methods: {
    initializeStudyData() {
      this.lessons = this.course.lessons || this.generateSampleLessons();
      this.updateCurrentLessonContent();
      this.sidebarOpen = false;
      this.selectedAnswer = null;
      this.quizCompleted = false;
      this.quizCorrect = false;
    },
    
    updateCurrentLessonContent() {
      if (this.lessons[this.currentLessonIndex]) {
        this.currentLesson = { ...this.lessons[this.currentLessonIndex] };
        if (!this.currentLesson.content) {
          this.currentLesson.content = this.getLessonContent(this.currentLesson.id);
        }
        if (!this.currentLesson.description && this.getLessonDescription(this.currentLesson.id)) {
          this.currentLesson.description = this.getLessonDescription(this.currentLesson.id);
        }
        if (!this.currentLesson.objectives && this.getLessonObjectives(this.currentLesson.id)) {
          this.currentLesson.objectives = this.getLessonObjectives(this.currentLesson.id);
        }
      } else {
        this.currentLesson = null;
      }
    },

    getLessonContent(lessonId) {
      const contentMap = {
        3: `# Getting Started with Runway ML

Runway ML is at the forefront of AI-powered video creation, offering cutting-edge tools that democratize video production. In this lesson, we'll explore the platform's capabilities and get hands-on experience with creating your first AI-generated videos.

## What is Runway ML?

Runway ML is an AI research company that develops next-generation creative tools. Their platform offers various AI models for:

• **Text-to-video generation** - Create videos from written descriptions
• **Image-to-video conversion** - Animate static images into dynamic videos
• **Video editing and enhancement** - Modify existing video content with AI
• **Style transfer and effects** - Apply artistic styles and visual effects

The platform has revolutionized how content creators, filmmakers, and marketers approach video production by making professional-quality video generation accessible to everyone.

## Platform Overview

When you first access Runway ML, you'll notice the clean, intuitive interface designed for both beginners and professionals. The main dashboard includes several key areas:

### 1. Project Management

The project management system allows you to:
- **Create and organize** your video projects in dedicated folders
- **Access recent works** and templates for quick project starts
- **Collaborate with team members** through shared workspaces
- **Version control** to track different iterations of your projects

### 2. Model Selection

Runway offers several powerful AI models, each designed for specific use cases:

**Gen-2: The Flagship Text-to-Video Model**
- Primary tool for creating videos from text prompts
- Supports various styles from photorealistic to artistic
- Capable of generating 4-second clips at high quality
- Best for: Original content creation, concept visualization

**Gen-1: Video-to-Video Transformation**
- Transforms existing videos using text prompts
- Maintains original video structure while changing style/content
- Excellent for stylistic transformations
- Best for: Style transfer, mood changes, artistic interpretations

**Inpainting: Selective Video Editing**
- Remove or replace specific elements in videos
- Seamlessly fill in selected areas with AI-generated content
- Precise control over what gets modified
- Best for: Object removal, background changes, cleanup

**Motion Brush: Directional Movement Control**
- Paint motion directions directly onto your video
- Control how different parts of the scene move
- Create complex animations with simple brush strokes
- Best for: Adding specific movements, animation control`
      };
      return contentMap[lessonId] || 'Lesson content not found.';
    },
    
    getLessonDescription(lessonId) {
      const descriptionMap = {
        3: "Learn the fundamentals of Runway ML, one of the most powerful AI video generation platforms available today."
      };
      return descriptionMap[lessonId] || null;
    },
    
    getLessonObjectives(lessonId) {
      const objectivesMap = {
        3: [
          "Understand Runway ML interface and navigation",
          "Learn basic text-to-video generation",
          "Explore different video models available",
          "Practice with your first AI video creation"
        ]
      };
      return objectivesMap[lessonId] || [];
    },

    generateSampleLessons() {
      return [
        {
          id: 1,
          title: "Introduction to AI Video Creation",
          readingTime: "8 min read",
          completed: true,
          locked: false,
          type: "text"
        },
        {
          id: 2,
          title: "Understanding AI Video Platforms",
          readingTime: "12 min read",
          completed: true,
          locked: false,
          type: "text"
        },
        {
          id: 3,
          title: "Runway ML: Getting Started",
          readingTime: "10 min read",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 4,
          title: "Text-to-Video Fundamentals",
          readingTime: "15 min read",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 5,
          title: "Prompt Engineering for Video",
          readingTime: "18 min read",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 6,
          title: "Advanced Runway Techniques",
          readingTime: "20 min read",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 7,
          title: "Midjourney for Video Assets",
          readingTime: "16 min read",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 8,
          title: "Stable Video Diffusion",
          readingTime: "19 min read",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 9,
          title: "Video Editing with AI Tools",
          readingTime: "22 min read",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 10,
          title: "Combining Multiple Platforms",
          readingTime: "25 min read",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 11,
          title: "Creating Consistent Characters",
          readingTime: "21 min read",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 12,
          title: "Storytelling with AI Video",
          readingTime: "23 min read",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 13,
          title: "Commercial Applications",
          readingTime: "20 min read",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 14,
          title: "Final Project Workshop",
          readingTime: "35 min read",
          completed: false,
          locked: true,
          type: "workshop"
        }
      ];
    },

    goBackToCourses() {
      this.$emit('back-to-courses');
    },

    selectLesson(index) {
      if (this.lessons[index] && !this.lessons[index].locked) {
        this.currentLessonIndex = index;
        this.selectedAnswer = null;
        this.quizCompleted = false;
        this.quizCorrect = false;
      }
    },

    markLessonCompleted() {
      if (this.currentLesson) {
        this.currentLesson.completed = true;
        const lessonInArray = this.lessons.find(l => l.id === this.currentLesson.id);
        if (lessonInArray) {
          lessonInArray.completed = true;
        }

        if (this.currentLessonIndex + 1 < this.lessons.length) {
          this.$set(this.lessons[this.currentLessonIndex + 1], 'locked', false);
        }
      }
    },

    submitQuiz() {
      if (!this.currentLesson || !this.currentLesson.quiz) return;
      const currentQuiz = this.currentLesson.quiz;
      this.quizCorrect = parseInt(this.selectedAnswer) === currentQuiz.correctAnswer;
      this.quizCompleted = true;

      if (this.quizCorrect) {
        this.markLessonCompleted();
      }
    },

    nextLesson() {
      if (this.currentLessonIndex + 1 < this.lessons.length) {
        const nextLessonCandidate = this.lessons[this.currentLessonIndex + 1];
        if (!nextLessonCandidate.locked) {
          this.selectLesson(this.currentLessonIndex + 1);
        }
      }
    },

    previousLesson() {
      if (this.currentLessonIndex > 0) {
        this.selectLesson(this.currentLessonIndex - 1);
      }
    }
  }
};
</script>

<style scoped>
/* Reset and Base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.lesson-player {
  height: 100vh;
  background: #ffffff;
  display: flex;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Sidebar Styles */
.sidebar {
  width: 320px;
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.course-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.course-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.course-icon svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.course-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #1a1a1a;
}

.course-subtitle {
  font-size: 14px;
  color: #717182;
  margin: 0;
}

.progress-section {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #717182;
}

.progress-count {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ececf0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B5CF6, #A78BFA);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.lessons-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  border: 2px solid transparent;
}

.lesson-item:hover:not(.lesson-locked) {
  background: rgba(139, 92, 246, 0.05);
  border-color: rgba(139, 92, 246, 0.2);
}

.lesson-item.lesson-current {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8B5CF6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.lesson-item.lesson-locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.lesson-status {
  flex-shrink: 0;
}

.status-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.status-icon.completed {
  background: #8B5CF6;
  border-radius: 50%;
  color: white;
}

.status-icon.current {
  border: 2px solid #8B5CF6;
  border-radius: 50%;
}

.current-dot {
  width: 8px;
  height: 8px;
  background: #8B5CF6;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-icon.default {
  border: 2px solid #717182;
  border-radius: 50%;
}

.lesson-content {
  flex: 1;
  min-width: 0;
}

.lesson-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.lesson-number {
  font-size: 12px;
  font-weight: 500;
  color: #717182;
}

.current-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: #8B5CF6;
  color: white;
  border-radius: 12px;
  font-weight: 500;
}

.lesson-title {
  font-size: 14px;
  font-weight: 400;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.lesson-current .lesson-title {
  color: #8B5CF6;
  font-weight: 500;
}

.lesson-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #717182;
}

.lesson-meta svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.lesson-arrow {
  flex-shrink: 0;
  color: #717182;
}

.lesson-arrow svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
}

.lesson-header-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.lesson-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.lesson-icon svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.lesson-title-section {
  flex: 1;
}

.main-lesson-title {
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #1a1a1a;
}

.lesson-meta-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #717182;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.lesson-description {
  font-size: 18px;
  color: #717182;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.objectives-section {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.objectives-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: #8B5CF6;
}

.objectives-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.objective-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.objective-bullet {
  width: 6px;
  height: 6px;
  background: #8B5CF6;
  border-radius: 50%;
  margin-top: 10px;
  flex-shrink: 0;
}

.lesson-content-section {
  margin-bottom: 32px;
}

.content-prose {
  line-height: 1.7;
  color: #1a1a1a;
  font-size: 16px;
}

.content-prose h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 32px 0 16px 0;
  color: #1a1a1a;
}

.content-prose h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 28px 0 12px 0;
  color: #1a1a1a;
}

.content-prose h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 8px 0;
  color: #1a1a1a;
}

.content-prose h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 8px 0;
  color: #1a1a1a;
}

.content-prose p {
  margin-bottom: 16px;
  line-height: 1.7;
}

.content-prose ul {
  margin: 16px 0;
  padding-left: 20px;
}

.content-prose li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.content-prose strong {
  font-weight: 600;
}

.resources-section {
  margin-top: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.resources-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1a1a1a;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  text-decoration: none;
  color: #1a1a1a;
  transition: all 0.2s ease;
}

.resource-item:hover {
  background: #f8f9fa;
  border-color: #8B5CF6;
  color: #8B5CF6;
}

.resource-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.resource-details {
  flex: 1;
}

.resource-name {
  font-weight: 500;
  font-size: 14px;
  display: block;
  margin-bottom: 2px;
}

.resource-size {
  font-size: 12px;
  color: #717182;
}

.quiz-section {
  margin-top: 32px;
  padding: 24px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quiz-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #1a1a1a;
}

.question-card h4 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: #1a1a1a;
  line-height: 1.5;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.quiz-option:hover {
  background: #f8f9fa;
  border-color: #8B5CF6;
}

.quiz-option.selected {
  border-color: #8B5CF6;
  background: rgba(139, 92, 246, 0.05);
}

.quiz-option input[type="radio"] {
  margin: 0;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.quiz-option span {
  flex: 1;
  font-size: 14px;
  color: #1a1a1a;
}

.quiz-submit-btn {
  display: block;
  margin: 0 auto;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #8B5CF6;
  color: white;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quiz-submit-btn:hover:not(:disabled) {
  background: #7C3AED;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.quiz-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quiz-result {
  text-align: center;
}

.quiz-feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
}

.quiz-feedback svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.quiz-feedback.correct {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.quiz-feedback.incorrect {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.retry-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #8B5CF6;
  color: white;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #7C3AED;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.lesson-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 32px 0 0 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin-top: 32px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: white;
  color: #717182;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
}

.nav-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.nav-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #8B5CF6;
  color: #8B5CF6;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.complete-btn {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.complete-btn:hover {
  background: #16a34a;
  color: white;
}

.next-btn {
  background: #8B5CF6;
  color: white;
  border-color: #8B5CF6;
}

.next-btn:hover:not(:disabled) {
  background: #7C3AED;
  color: white;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .lesson-player {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 40vh;
    order: 2;
  }
  
  .main-content {
    order: 1;
    flex: 1;
  }
  
  .content-wrapper {
    padding: 16px;
  }
  
  .lesson-navigation {
    flex-direction: column;
    gap: 12px;
  }
  
  .nav-btn, .complete-btn {
    width: 100%;
    justify-content: center;
  }
  
  .lessons-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .lesson-header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .lesson-meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .course-header {
    padding: 16px;
  }
  
  .progress-section {
    padding: 16px;
  }
  
  .lessons-list {
    padding: 8px;
  }
  
  .lesson-item {
    padding: 12px;
  }
  
  .content-wrapper {
    padding: 12px;
  }
  
  .main-lesson-title {
    font-size: 20px;
  }
  
  .lesson-description {
    font-size: 16px;
  }
  
  .objectives-section,
  .resources-section,
  .quiz-section {
    padding: 16px;
  }
  
  .resources-grid {
    grid-template-columns: 1fr;
  }
}

/* Scrollbar Styling */
.lessons-list::-webkit-scrollbar,
.main-content::-webkit-scrollbar {
  width: 6px;
}

.lessons-list::-webkit-scrollbar-track,
.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.lessons-list::-webkit-scrollbar-thumb,
.main-content::-webkit-scrollbar-thumb {
  background: #8B5CF6;
  border-radius: 3px;
}

.lessons-list::-webkit-scrollbar-thumb:hover,
.main-content::-webkit-scrollbar-thumb:hover {
  background: #7C3AED;
}

/* Focus States for Accessibility */
.nav-btn:focus,
.quiz-submit-btn:focus,
.retry-btn:focus,
.complete-btn:focus {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}

.lesson-item:focus {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}

.quiz-option:focus-within {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}
</style>