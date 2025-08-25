<template>
  <div class="lesson-player-overlay" @click="handleOverlayClick">
    <div class="lesson-player" @click.stop>
      <!-- Header with progress and course info -->
      <header class="player-header">
        <button 
          class="close-btn" 
          @click="$emit('close')" 
          aria-label="Close lesson"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="header-content">
          <div class="course-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
            {{ courseTitle }}
          </div>

          <h1 class="lesson-title">{{ currentLessonTitle }}</h1>

          <div class="progress-container">
            <div class="progress-info">
              <span class="progress-text">Lesson {{ currentLessonIndex + 1 }} of {{ totalLessons }}</span>
              <span class="progress-percentage">{{ Math.round(progressPercentage) }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content area -->
      <main class="player-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
          </div>
          <h3>Loading Course...</h3>
          <p>Preparing your learning materials</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>Failed to Load Course</h3>
          <p>{{ error }}</p>
          <button @click="loadCourseContent" class="retry-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Try Again
          </button>
        </div>

        <!-- Lesson Content -->
        <div v-else-if="currentLesson && hasSteps" class="lesson-content">
          <!-- Learning Objectives -->
          <div class="objectives-card" v-if="learningObjectives && learningObjectives.length > 0">
            <div class="card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.95 0 3.73.62 5.19 1.68"></path>
              </svg>
              Learning Objectives
            </div>
            <ul class="objectives-list">
              <li v-for="(objective, index) in learningObjectives" :key="index">
                {{ objective }}
              </li>
            </ul>
          </div>

          <!-- Lesson Steps -->
          <div 
            v-for="(step, index) in currentLesson.steps" 
            :key="`step-${index}`"
            class="step-card"
          >
            <div class="step-header">
              <div class="step-number">{{ index + 1 }}</div>
              <h2 class="step-title">{{ getStepTitle(step) }}</h2>
              <div class="step-type-badge" :class="step.type">
                {{ getStepTypeLabel(step.type) }}
              </div>
            </div>

            <div class="step-content">
              <component 
                :is="getStepComponent(step.type)"
                :step="step"
                :step-index="index"
                @quiz-answer="handleQuizAnswer"
                @pdf-fullscreen="openPdfFullscreen"
              />
            </div>
          </div>
        </div>

        <!-- Empty States -->
        <div v-else-if="currentLesson && !hasSteps" class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <h3>Lesson Content Coming Soon</h3>
          <p>This lesson is being prepared and will be available shortly.</p>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
          </div>
          <h3>Course Unavailable</h3>
          <p>Unable to load course content at this time.</p>
          <button @click="$emit('back-to-courses')" class="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back to Courses
          </button>
        </div>
      </main>

      <!-- Navigation Footer -->
      <footer class="player-footer" v-if="!loading && !error && lessons.length > 0">
        <button 
          class="nav-btn nav-btn--secondary"
          :disabled="isFirstLesson"
          @click="goToPreviousLesson"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
          Previous
        </button>

        <div class="lesson-indicators">
          <div 
            v-for="(lesson, index) in lessons.slice(0, 5)" 
            :key="index"
            class="lesson-dot"
            :class="{ active: index === currentLessonIndex, completed: index < currentLessonIndex }"
          ></div>
          <span v-if="lessons.length > 5" class="more-lessons">+{{ lessons.length - 5 }}</span>
        </div>

        <button 
          v-if="!isLastLesson"
          class="nav-btn nav-btn--primary"
          @click="goToNextLesson"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>

        <button 
          v-else
          class="nav-btn nav-btn--success"
          @click="completeCourse"
        >
          Complete Course
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </button>
      </footer>
    </div>

    <!-- PDF Fullscreen Modal -->
    <Transition name="modal-fade">
      <div v-if="fullscreenPdf" class="pdf-modal" @click="closePdfFullscreen">
        <div class="pdf-container" @click.stop>
          <button 
            class="pdf-close-btn"
            @click="closePdfFullscreen"
            aria-label="Close PDF"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <iframe 
            :src="fullscreenPdf" 
            class="pdf-frame"
            title="PDF Viewer"
          ></iframe>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
// ✅ MAIN FRONTEND API IMPORTS - Enhanced with better error handling
import { getCourseById, getCourseContent, getUpdatedCourses } from '@/api.js';

export default {
  name: 'LessonPlayer',
  
  props: {
    course: {
      type: Object,
      required: true,
      validator: (course) => course && (course.title || course._id)
    }
  },

  emits: ['close', 'back-to-courses'],

  data() {
    return {
      lessons: [],
      currentLessonIndex: 0,
      quizAnswers: new Map(),
      fullscreenPdf: null,
      loading: true,
      error: null,
      courseData: null,
      retryCount: 0,
      maxRetries: 3
    }
  },

  computed: {
    courseTitle() {
      return this.courseData?.title || this.course?.title || 'Course';
    },

    currentLesson() {
      return this.lessons[this.currentLessonIndex] || null;
    },

    currentLessonTitle() {
      const lesson = this.currentLesson;
      if (!lesson) return 'Loading lesson...';
      return lesson.title || lesson.lessonName || `Lesson ${this.currentLessonIndex + 1}`;
    },

    hasSteps() {
      return this.currentLesson && this.currentLesson.steps && this.currentLesson.steps.length > 0;
    },

    totalLessons() {
      return this.lessons.length;
    },

    progressPercentage() {
      if (this.totalLessons === 0) return 0;
      return ((this.currentLessonIndex + 1) / this.totalLessons) * 100;
    },

    isFirstLesson() {
      return this.currentLessonIndex === 0;
    },

    isLastLesson() {
      return this.currentLessonIndex === this.totalLessons - 1;
    },

    learningObjectives() {
      // Extract learning objectives from course data
      if (this.courseData?.learningOutcomes && Array.isArray(this.courseData.learningOutcomes)) {
        return this.courseData.learningOutcomes;
      }
      if (this.currentLesson?.learningObjectives && Array.isArray(this.currentLesson.learningObjectives)) {
        return this.currentLesson.learningObjectives;
      }
      return this.getDefaultObjectives();
    }
  },

  watch: {
    course: {
      handler() {
        this.retryCount = 0;
        this.loadCourseContent();
      },
      deep: true,
      immediate: true
    }
  },

  methods: {
    // ✅ COMPLETELY REWRITTEN: Enhanced course loading with multiple fallback strategies
    async loadCourseContent() {
      if (!this.course || (!this.course._id && !this.course.id)) {
        console.error('❌ LessonPlayer: Invalid course data:', this.course);
        this.error = 'Invalid course data provided';
        this.loading = false;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const courseId = this.course._id || this.course.id;
        console.log('📚 LessonPlayer: Loading course content for ID:', courseId);

        let courseDetails = null;
        let lessons = [];

        // ✅ STRATEGY 1: Try Updated Courses API first (main frontend API)
        try {
          console.log('🔍 Strategy 1: Trying Updated Courses API...');
          
          // First get all updated courses to find our course
          const coursesResponse = await getUpdatedCourses();
          if (coursesResponse && coursesResponse.success && coursesResponse.courses) {
            const foundCourse = coursesResponse.courses.find(c => 
              (c._id || c.id) === courseId
            );
            
            if (foundCourse) {
              console.log('✅ Course found in Updated Courses API');
              courseDetails = foundCourse;
              
              // Extract lessons from curriculum
              if (foundCourse.curriculum && Array.isArray(foundCourse.curriculum)) {
                lessons = this.processLessonsFromCurriculum(foundCourse.curriculum);
                console.log('✅ Lessons extracted from updated course curriculum:', lessons.length);
              }
            }
          }
        } catch (updatedCoursesError) {
          console.warn('⚠️ Updated Courses API failed:', updatedCoursesError.message);
        }

        // ✅ STRATEGY 2: Try specific course by ID
        if (!courseDetails || lessons.length === 0) {
          try {
            console.log('🔍 Strategy 2: Trying specific course by ID...');
            const courseResponse = await getCourseById(courseId);
            
            if (courseResponse && courseResponse.success && courseResponse.data) {
              courseDetails = courseResponse.data;
              console.log('✅ Course details loaded from getCourseById');
              
              // Check for curriculum
              if (courseDetails.curriculum && Array.isArray(courseDetails.curriculum)) {
                lessons = this.processLessonsFromCurriculum(courseDetails.curriculum);
                console.log('✅ Lessons from course curriculum:', lessons.length);
              }
            }
          } catch (courseByIdError) {
            console.warn('⚠️ getCourseById failed:', courseByIdError.message);
          }
        }

        // ✅ STRATEGY 3: Try course content endpoint
        if (lessons.length === 0) {
          try {
            console.log('🔍 Strategy 3: Trying course content endpoint...');
            const contentResponse = await getCourseContent(courseId);
            
            if (contentResponse && contentResponse.success && contentResponse.data) {
              lessons = this.processLessons(contentResponse.data);
              console.log('✅ Lessons from content endpoint:', lessons.length);
            }
          } catch (contentError) {
            console.warn('⚠️ getCourseContent failed:', contentError.message);
          }
        }

        // ✅ STRATEGY 4: Use course prop data as fallback
        if (lessons.length === 0 && this.course.curriculum) {
          console.log('🔍 Strategy 4: Using course prop curriculum...');
          lessons = this.processLessonsFromCurriculum(this.course.curriculum);
          console.log('✅ Lessons from course prop:', lessons.length);
        }

        // ✅ STRATEGY 5: Create demo content if still no lessons
        if (lessons.length === 0) {
          console.log('🔍 Strategy 5: Creating demo lessons...');
          lessons = this.createEnhancedDemoLessons();
          this.error = 'Demo content - Real course materials are temporarily unavailable';
        }

        // Set final data
        this.courseData = courseDetails || this.course;
        this.lessons = lessons;

        console.log(`✅ LessonPlayer: Successfully loaded ${lessons.length} lessons for: ${this.courseData?.title}`);
        
        // Clear error if we have content
        if (lessons.length > 0 && this.error?.includes('Demo content')) {
          // Keep demo warning but don't treat as error
        } else if (lessons.length > 0) {
          this.error = null;
        }
        
      } catch (error) {
        console.error('❌ LessonPlayer: Critical error loading course:', error);
        this.handleLoadingError(error);
      } finally {
        this.loading = false;
      }
    },

    // ✅ NEW: Process lessons from curriculum array (Updated Courses format)
    processLessonsFromCurriculum(curriculum) {
      if (!Array.isArray(curriculum)) {
        console.warn('⚠️ Curriculum is not an array:', typeof curriculum);
        return [];
      }

      return curriculum.map((lesson, index) => {
        try {
          const processedLesson = {
            ...lesson,
            id: lesson._id || lesson.id || `curriculum_lesson_${index}`,
            _id: lesson._id || lesson.id || `curriculum_lesson_${index}`,
            title: lesson.title || `Lesson ${index + 1}`,
            lessonName: lesson.title || `Lesson ${index + 1}`,
            description: lesson.description || '',
            duration: lesson.duration || '30 min',
            order: lesson.order !== undefined ? lesson.order : index,
            steps: this.processSteps(lesson.steps || [])
          };

          console.log(`✅ Processed curriculum lesson ${index + 1}: "${processedLesson.title}" with ${processedLesson.steps.length} steps`);
          return processedLesson;

        } catch (lessonError) {
          console.error(`❌ Error processing curriculum lesson ${index}:`, lessonError);
          return this.createFallbackLesson(index, lesson);
        }
      });
    },

    // ✅ ENHANCED: Better lesson processing
    processLessons(lessonsArray) {
      if (!Array.isArray(lessonsArray)) {
        console.warn('⚠️ processLessons: Input is not an array:', typeof lessonsArray);
        return [];
      }

      return lessonsArray.map((lesson, index) => {
        try {
          if (!lesson || typeof lesson !== 'object') {
            console.warn(`⚠️ Invalid lesson at index ${index}:`, lesson);
            return this.createFallbackLesson(index);
          }

          const processedLesson = {
            ...lesson,
            id: lesson._id || lesson.id || `lesson_${index}`,
            _id: lesson._id || lesson.id || `lesson_${index}`,
            title: lesson.title || lesson.lessonName || lesson.name || `Lesson ${index + 1}`,
            lessonName: lesson.title || lesson.lessonName || lesson.name || `Lesson ${index + 1}`,
            description: lesson.description || lesson.desc || '',
            duration: lesson.duration || lesson.estimatedTime || '30 min',
            order: lesson.order !== undefined ? lesson.order : index,
            steps: this.processSteps(lesson.steps || lesson.content || [])
          };

          console.log(`✅ Processed lesson ${index + 1}: "${processedLesson.title}" with ${processedLesson.steps.length} steps`);
          return processedLesson;

        } catch (lessonError) {
          console.error(`❌ Error processing lesson ${index}:`, lessonError);
          return this.createFallbackLesson(index, lesson);
        }
      });
    },

    // ✅ COMPLETELY REWRITTEN: Enhanced step processing
    processSteps(steps) {
      if (!Array.isArray(steps)) {
        console.warn('⚠️ processSteps: Input is not an array:', typeof steps);
        return [];
      }

      return steps.map((step, index) => {
        try {
          if (!step || typeof step !== 'object') {
            console.warn(`⚠️ Invalid step at index ${index}:`, step);
            return this.createFallbackStep(index);
          }

          const stepType = this.detectStepType(step);
          
          const processedStep = {
            ...step,
            id: step.id || step._id || `step_${index}`,
            type: stepType,
            title: step.title || step.name || this.getStepTitle({ ...step, type: stepType }),
            description: step.description || step.desc || '',
            content: this.extractContent(step),
            data: this.processStepData(step, stepType),
            order: step.order !== undefined ? step.order : index,
            images: this.processImages(step.images || step.data?.images || [])
          };

          console.log(`✅ Processed step ${index + 1}: "${processedStep.title}" (${stepType})`);
          return processedStep;
          
        } catch (stepError) {
          console.error(`❌ Error processing step ${index}:`, stepError);
          return this.createFallbackStep(index, step);
        }
      });
    },

    // ✅ ENHANCED: Better step type detection
    detectStepType(step) {
      if (!step) return 'explanation';

      // Direct type property
      if (step.type && typeof step.type === 'string') {
        return step.type.toLowerCase();
      }

      // Check for specific indicators
      if (step.question || step.quiz || step.quizzes || (step.data && Array.isArray(step.data) && step.data.some(d => d.question))) {
        return 'quiz';
      }

      if (step.videoUrl || step.video || (step.data?.url && step.data.url.includes('youtube'))) {
        return 'video';
      }

      if (step.pdfUrl || step.pdf || (step.data?.url && step.data.url.includes('.pdf'))) {
        return 'pdf';
      }

      if (step.practice || step.practiceType || step.instructions || step.files) {
        return 'practice';
      }

      if (step.images && Array.isArray(step.images) && step.images.length > 0 && !step.content) {
        return 'image';
      }

      // Content analysis
      const content = step.content || step.text || step.description || '';
      if (typeof content === 'string') {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('example') || lowerContent.includes('пример')) return 'example';
        if (lowerContent.includes('practice') || lowerContent.includes('упражнение')) return 'practice';
        if (lowerContent.includes('read') || lowerContent.includes('reading') || lowerContent.includes('читать')) return 'reading';
      }

      return 'explanation';
    },

    // ✅ ENHANCED: Better content extraction
    extractContent(step) {
      if (!step) return '';

      const contentSources = [
        step.content,
        step.text,
        step.description,
        step.body,
        step.html,
        step.markdown,
        step.data?.content,
        step.data?.text,
        step.data?.description
      ];

      for (const source of contentSources) {
        if (source && typeof source === 'string' && source.trim().length > 0) {
          return source.trim();
        }
      }

      return this.generateFallbackContent(step);
    },

    // ✅ ENHANCED: Generate better fallback content
    generateFallbackContent(step) {
      const stepType = this.detectStepType(step);
      const title = step.title || step.name || '';
      
      switch (stepType) {
        case 'video':
          return title ? `Video lesson: ${title}` : 'Video content';
        case 'pdf':
          return title ? `PDF material: ${title}` : 'PDF document';
        case 'practice':
          return title ? `Practice exercise: ${title}` : 'Hands-on practice activity';
        case 'quiz':
          return title ? `Interactive quiz: ${title}` : 'Knowledge assessment';
        case 'image':
          return title ? `Visual content: ${title}` : 'Images and diagrams';
        case 'example':
          return title ? `Example: ${title}` : 'Practical example';
        case 'reading':
          return title ? `Reading material: ${title}` : 'Reading assignment';
        default:
          return title || 'Learning content';
      }
    },

    // ✅ ENHANCED: Better step data processing
    processStepData(step, stepType) {
      const baseData = step.data || {};
      const type = stepType || step.type || 'explanation';

      try {
        switch (type) {
          case 'explanation':
          case 'example':
          case 'reading':
          case 'text':
            return {
              ...baseData,
              content: this.extractContent(step),
              images: this.processImages(baseData.images || step.images || [])
            };

          case 'quiz':
            return this.processQuizData(step, baseData);

          case 'video':
            return {
              ...baseData,
              url: baseData.url || step.videoUrl || step.video || step.url || '',
              description: baseData.description || step.description || this.extractContent(step)
            };

          case 'pdf':
            return {
              ...baseData,
              url: baseData.url || step.pdfUrl || step.pdf || step.url || '',
              description: baseData.description || step.description || this.extractContent(step)
            };

          case 'practice':
            return {
              ...baseData,
              instructions: baseData.instructions || step.instructions || this.extractContent(step),
              type: baseData.type || step.practiceType || 'guided',
              files: baseData.files || step.files || []
            };

          default:
            return {
              ...baseData,
              content: this.extractContent(step),
              images: this.processImages(baseData.images || step.images || [])
            };
        }
      } catch (error) {
        console.error(`❌ Error processing step data for type ${type}:`, error);
        return {
          content: this.extractContent(step) || 'Error processing step content',
          error: error.message
        };
      }
    },

    // ✅ ENHANCED: Better quiz data processing
    processQuizData(step, baseData) {
      // Multiple quiz formats
      if (Array.isArray(baseData) && baseData.length > 0) {
        return baseData.map(quiz => this.normalizeQuizItem(quiz));
      }

      if (Array.isArray(step.data) && step.data.length > 0) {
        return step.data.map(quiz => this.normalizeQuizItem(quiz));
      }

      if (step.question || baseData.question) {
        return [this.normalizeQuizItem({
          question: step.question || baseData.question || this.extractContent(step),
          type: step.quizType || baseData.type || 'multiple-choice',
          options: step.options || baseData.options || [],
          correctAnswer: step.correctAnswer || baseData.correctAnswer || 0,
          explanation: step.explanation || baseData.explanation || ''
        })];
      }

      if (step.quizzes && Array.isArray(step.quizzes)) {
        return step.quizzes.map(quiz => this.normalizeQuizItem(quiz));
      }

      return [];
    },

    // ✅ NEW: Normalize quiz item format
    normalizeQuizItem(quiz) {
      return {
        question: quiz.question || quiz.text || '',
        type: quiz.type || 'multiple-choice',
        options: (quiz.options || []).map(opt => {
          if (typeof opt === 'string') return { text: opt, correct: false };
          return { text: opt.text || String(opt), correct: Boolean(opt.correct) };
        }),
        correctAnswer: parseInt(quiz.correctAnswer) || 0,
        explanation: quiz.explanation || '',
        images: this.processImages(quiz.images || [])
      };
    },

    // ✅ ENHANCED: Better image processing
    processImages(images) {
      if (!Array.isArray(images)) return [];

      return images
        .filter(img => img && (img.url || img.base64 || img.src))
        .map((img, index) => {
          try {
            let imageUrl = img.url || img.src || img.base64;
            
            if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
              // Handle relative URLs
              const baseUrl = process.env.NODE_ENV === 'production' 
                ? 'https://api.aced.live'
                : 'http://localhost:5000';
              imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }

            return {
              id: img.id || `img_${index}_${Date.now()}`,
              url: imageUrl,
              caption: img.caption || img.description || '',
              alt: img.alt || img.caption || `Image ${index + 1}`,
              filename: img.filename || img.name || `image_${index}`,
              size: img.size || 0,
              order: img.order !== undefined ? img.order : index
            };
          } catch (imgError) {
            console.error(`❌ Error processing image ${index}:`, imgError);
            return null;
          }
        })
        .filter(img => img !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },

    // ✅ NEW: Create fallback lesson
    createFallbackLesson(index, lesson = null) {
      return {
        id: `fallback_lesson_${index}`,
        _id: `fallback_lesson_${index}`,
        title: lesson?.title || `Lesson ${index + 1} (Loading Error)`,
        lessonName: lesson?.title || `Lesson ${index + 1} (Loading Error)`,
        description: 'There was an error loading this lesson content',
        duration: '30 min',
        order: index,
        steps: [this.createFallbackStep(0)]
      };
    },

    // ✅ NEW: Create fallback step
    createFallbackStep(index, step = null) {
      return {
        id: `fallback_step_${index}`,
        type: 'explanation',
        title: step?.title || '❌ Loading Error',
        description: 'Step content could not be loaded',
        content: 'This step content is temporarily unavailable. Please try refreshing the lesson.',
        data: { content: 'Content loading error' },
        order: index,
        images: []
      };
    },

    // ✅ ENHANCED: Create better demo lessons
    createEnhancedDemoLessons() {
      const courseTitle = this.courseData?.title || this.course?.title || 'Course';
      
      return [
        {
          id: 'demo_intro',
          title: 'Getting Started',
          lessonName: 'Getting Started',
          description: 'Introduction to your learning journey',
          duration: '15 min',
          steps: [
            {
              id: 'demo_welcome',
              type: 'explanation',
              title: `Welcome to ${courseTitle}`,
              content: `Welcome to your learning journey with ${courseTitle}! This is demonstration content while we load your actual course materials.`,
              data: {
                content: `<div class="demo-content">
                  <h2>🎉 Welcome to ${courseTitle}</h2>
                  <p>This is demonstration content while we load your actual course materials.</p>
                  <div class="demo-features">
                    <h3>What you'll experience:</h3>
                    <ul>
                      <li>📝 Interactive lessons with rich content</li>
                      <li>🎯 Hands-on practice exercises</li>
                      <li>📊 Progress tracking and assessments</li>
                      <li>🎥 Video content and multimedia</li>
                    </ul>
                  </div>
                </div>`
              }
            },
            {
              id: 'demo_objectives',
              type: 'explanation',
              title: 'Learning Objectives',
              content: 'Here are the key things you\'ll master in this course',
              data: {
                content: `<div class="objectives-content">
                  <h3>🎯 By the end of this course, you will:</h3>
                  <ul>
                    <li>Understand the fundamental concepts</li>
                    <li>Apply practical skills to real-world scenarios</li>
                    <li>Build confidence in your abilities</li>
                    <li>Create your own projects</li>
                  </ul>
                </div>`
              }
            }
          ]
        },
        {
          id: 'demo_interactive',
          title: 'Interactive Learning',
          lessonName: 'Interactive Learning',
          description: 'Experience different types of learning content',
          duration: '20 min',
          steps: [
            {
              id: 'demo_content_types',
              type: 'explanation',
              title: 'Types of Learning Content',
              content: 'This course includes various interactive elements designed to enhance your learning experience.',
              data: {
                content: `<div class="content-types">
                  <h3>📚 Learning Experience</h3>
                  <div class="content-grid">
                    <div class="content-type">
                      <h4>📝 Text & Explanations</h4>
                      <p>Clear, structured lessons with rich formatting</p>
                    </div>
                    <div class="content-type">
                      <h4>❓ Interactive Quizzes</h4>
                      <p>Test your understanding with immediate feedback</p>
                    </div>
                    <div class="content-type">
                      <h4>🎯 Practice Exercises</h4>
                      <p>Hands-on activities to reinforce learning</p>
                    </div>
                    <div class="content-type">
                      <h4>🎥 Multimedia Content</h4>
                      <p>Videos, images, and interactive media</p>
                    </div>
                  </div>
                </div>`
              }
            },
            {
              id: 'demo_quiz',
              type: 'quiz',
              title: 'Quick Knowledge Check',
              content: 'Test your understanding',
              data: [{
                question: 'What makes this learning platform effective?',
                type: 'multiple-choice',
                options: [
                  { text: 'Interactive content and immediate feedback', correct: true },
                  { text: 'Only text-based lessons', correct: false },
                  { text: 'Passive video watching', correct: false },
                  { text: 'No progress tracking', correct: false }
                ],
                correctAnswer: 0,
                explanation: 'Correct! Interactive content with immediate feedback creates an engaging learning environment that helps retain information better.'
              }]
            }
          ]
        }
      ];
    },

    // ✅ ENHANCED: Better error handling
    handleLoadingError(error) {
      this.retryCount++;
      
      if (error.message?.includes('Network')) {
        this.error = 'Network connection issue - please check your internet connection';
      } else if (error.response?.status === 404) {
        this.error = 'Course not found on the server';
      } else if (error.response?.status === 403) {
        this.error = 'Access denied - you may not have permission to view this course';
      } else if (error.response?.status >= 500) {
        this.error = 'Server error - please try again later';
      } else {
        this.error = 'Failed to load course content';
      }

      // Provide fallback content on error
      if (this.retryCount <= this.maxRetries) {
        try {
          this.lessons = this.createEnhancedDemoLessons();
          this.error += ' (showing demo content)';
        } catch (demoError) {
          console.error('❌ Even demo content failed:', demoError);
          this.error = 'Critical error loading any content';
        }
      }
    },

    // ✅ Navigation methods
    goToPreviousLesson() {
      if (!this.isFirstLesson) {
        this.currentLessonIndex--;
        console.log(`🔙 Previous lesson: ${this.currentLessonIndex + 1}`);
      }
    },

    goToNextLesson() {
      if (!this.isLastLesson) {
        this.currentLessonIndex++;
        console.log(`➡️ Next lesson: ${this.currentLessonIndex + 1}`);
      }
    },

    completeCourse() {
      console.log('🎉 Course completed!');
      if (confirm('Congratulations on completing the course! Return to courses list?')) {
        this.$emit('back-to-courses');
      }
    },

    // ✅ Event handlers
    handleOverlayClick() {
      this.$emit('close');
    },

    handleQuizAnswer(stepIndex, answerIndex, isCorrect) {
      this.quizAnswers.set(stepIndex, {
        answerIndex,
        isCorrect,
        answered: true
      });
      console.log('📝 Quiz answer recorded:', { stepIndex, answerIndex, isCorrect });
    },

    openPdfFullscreen(pdfUrl) {
      this.fullscreenPdf = pdfUrl;
    },

    closePdfFullscreen() {
      this.fullscreenPdf = null;
    },

    // ✅ Utility methods
    getStepTitle(step) {
      if (step.title) return step.title;
      
      const titles = {
        explanation: '📝 Explanation',
        example: '💡 Example',
        text: '📝 Text',
        reading: '📚 Reading',
        video: '🎥 Video',
        pdf: '📄 Document',
        practice: '🎯 Practice',
        quiz: '❓ Quiz',
        image: '🖼️ Visual Content'
      };
      
      return titles[step.type] || '📌 Step';
    },

    getStepTypeLabel(type) {
      const labels = {
        explanation: 'Learn',
        example: 'Example',
        text: 'Read',
        reading: 'Study',
        video: 'Watch',
        pdf: 'Document',
        practice: 'Practice',
        quiz: 'Quiz',
        image: 'Visual'
      };
      return labels[type] || 'Content';
    },

    getStepComponent(type) {
      const components = {
        explanation: 'step-text',
        example: 'step-text',
        reading: 'step-text',
        text: 'step-text',
        video: 'step-video',
        pdf: 'step-pdf',
        practice: 'step-practice',
        quiz: 'step-quiz',
        image: 'step-text'
      };
      return components[type] || 'step-text';
    },

    getDefaultObjectives() {
      return [
        'Understand the core concepts covered in this course',
        'Apply practical skills to real-world scenarios',
        'Build confidence through hands-on practice',
        'Complete projects that demonstrate your learning'
      ];
    }
  },

  // ✅ ENHANCED STEP COMPONENTS with Runway ML styling
  components: {
    'step-text': {
      props: ['step'],
      template: `
        <div class="step-text">
          <div class="text-content" v-html="formattedContent"></div>
          <div v-if="hasImages" class="step-images">
            <div v-for="image in step.data.images || step.images || []" :key="image.id" class="step-image">
              <img :src="image.url" :alt="image.alt" :title="image.caption" loading="lazy" />
              <p v-if="image.caption" class="image-caption">{{ image.caption }}</p>
            </div>
          </div>
        </div>
      `,
      computed: {
        formattedContent() {
          let content = this.step.data?.content || this.step.content || this.step.text || this.step.description || '';
          
          if (typeof content === 'string') {
            // Convert markdown-like formatting to HTML
            content = content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n/g, '<br>');
            
            if (!content.includes('<p>') && !content.includes('<div>') && content.length > 0) {
              content = '<p>' + content + '</p>';
            }
          }
          
          return content || '<p>Content not available</p>';
        },
        hasImages() {
          const images = this.step.data?.images || this.step.images || [];
          return Array.isArray(images) && images.length > 0;
        }
      }
    },

    'step-video': {
      props: ['step'],
      template: `
        <div class="step-video">
          <div class="video-wrapper">
            <div v-if="isYouTube" class="video-embed">
              <iframe 
                :src="embedUrl"
                frameborder="0"
                allowfullscreen
                class="video-iframe"
                title="Video content"
              ></iframe>
            </div>
            <video 
              v-else-if="isDirectVideo"
              controls
              class="video-element"
              :poster="step.data?.thumbnail"
            >
              <source :src="videoUrl" type="video/mp4">
              <source :src="videoUrl" type="video/webm">
              <p>Your browser doesn't support video playback.</p>
            </video>
            <div v-else class="video-placeholder">
              <div class="placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5,3 19,12 5,21 5,3"></polygon>
                </svg>
              </div>
              <p>Video content unavailable</p>
              <small v-if="videoUrl">URL: {{ videoUrl }}</small>
            </div>
          </div>
          <div v-if="description" class="video-description" v-html="formattedDescription"></div>
        </div>
      `,
      computed: {
        videoUrl() {
          return this.step.data?.url || this.step.videoUrl || this.step.video || this.step.url || '';
        },
        description() {
          return this.step.data?.description || this.step.description || this.step.content || '';
        },
        formattedDescription() {
          return this.description.replace(/\n/g, '<br>');
        },
        isYouTube() {
          return this.videoUrl.includes('youtube.com') || this.videoUrl.includes('youtu.be');
        },
        isDirectVideo() {
          return /\.(mp4|webm|ogg)$/i.test(this.videoUrl) || this.videoUrl.includes('blob:');
        },
        embedUrl() {
          if (this.videoUrl.includes('youtube.com/watch')) {
            const videoId = this.videoUrl.split('v=')[1]?.split('&')[0];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
          }
          if (this.videoUrl.includes('youtu.be/')) {
            const videoId = this.videoUrl.split('youtu.be/')[1]?.split('?')[0];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
          }
          return this.videoUrl;
        }
      }
    },

    'step-pdf': {
      props: ['step'],
      emits: ['pdf-fullscreen'],
      template: `
        <div class="step-pdf">
          <div class="pdf-header">
            <h3>📄 PDF Material</h3>
            <div v-if="description" v-html="formattedDescription"></div>
          </div>
          
          <div class="pdf-viewer">
            <iframe 
              v-if="pdfUrl"
              :src="pdfUrl" 
              class="pdf-iframe"
              title="PDF Document"
            ></iframe>
            <div v-else class="pdf-placeholder">
              <div class="placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
              </div>
              <p>PDF file unavailable</p>
            </div>
          </div>

          <div class="pdf-actions" v-if="pdfUrl">
            <a 
              :href="pdfUrl" 
              target="_blank"
              download
              class="action-btn action-btn--secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </a>
            <button 
              @click="$emit('pdf-fullscreen', pdfUrl)"
              class="action-btn action-btn--primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,3 21,3 21,9"></polyline>
                <polyline points="9,21 3,21 3,15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              Fullscreen
            </button>
          </div>
        </div>
      `,
      computed: {
        pdfUrl() {
          return this.step.data?.url || this.step.pdfUrl || this.step.pdf || this.step.url;
        },
        description() {
          return this.step.data?.description || this.step.description || this.step.content;
        },
        formattedDescription() {
          return this.description ? this.description.replace(/\n/g, '<br>') : '';
        }
      }
    },

    'step-practice': {
      props: ['step'],
      template: `
        <div class="step-practice">
          <div class="practice-header">
            <h3>🎯 Practice Exercise</h3>
            <div v-if="instructions" v-html="formattedInstructions"></div>
          </div>

          <div v-if="hasFiles" class="practice-files">
            <h4>Download Files:</h4>
            <div class="file-grid">
              <a 
                v-for="(file, index) in files"
                :key="index"
                :href="file.url"
                class="file-card"
                target="_blank"
                download
              >
                <div class="file-icon">{{ getFileIcon(file.type) }}</div>
                <span class="file-name">{{ file.name }}</span>
                <div class="download-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
              </a>
            </div>
          </div>

          <div v-else class="no-files">
            <p>Complete the exercise following the instructions above</p>
          </div>
        </div>
      `,
      computed: {
        instructions() {
          return this.step.data?.instructions || this.step.instructions || this.step.content || this.step.description;
        },
        formattedInstructions() {
          return this.instructions ? this.instructions.replace(/\n/g, '<br>') : '';
        },
        files() {
          return this.step.data?.files || this.step.files || [];
        },
        hasFiles() {
          return this.files.length > 0;
        }
      },
      methods: {
        getFileIcon(type) {
          const icons = {
            pdf: '📄', doc: '📝', docx: '📝', txt: '📝',
            zip: '📦', rar: '📦', '7z': '📦',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
            mp4: '🎥', mov: '🎥', avi: '🎥',
            mp3: '🎵', wav: '🎵'
          };
          return icons[type?.toLowerCase()] || '📎';
        }
      }
    },

    'step-quiz': {
      props: ['step', 'stepIndex'],
      emits: ['quiz-answer'],
      data() {
        return {
          selectedQuestions: new Map(),
          showFeedback: new Map()
        }
      },
      template: `
        <div class="step-quiz">
          <div v-if="quizData && quizData.length > 0">
            <div v-for="(quiz, quizIndex) in quizData" :key="quizIndex" class="quiz-item">
              <div class="quiz-header">
                <h3>❓ {{ quiz.question || 'Question not provided' }}</h3>
              </div>
              
              <div v-if="quiz.options && quiz.options.length > 0" class="quiz-options">
                <button
                  v-for="(option, index) in quiz.options"
                  :key="index"
                  @click="selectAnswer(quizIndex, index, option)"
                  :disabled="isQuizAnswered(quizIndex)"
                  :class="getOptionClass(quizIndex, index, option)"
                  class="quiz-option"
                >
                  <span class="option-text">{{ getOptionText(option) }}</span>
                  <div v-if="isQuizAnswered(quizIndex)" class="option-indicator">
                    <svg v-if="isCorrectOption(option)" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    <svg v-else-if="getSelectedAnswer(quizIndex) === index" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                </button>
              </div>
              
              <Transition name="slide-down">
                <div v-if="isQuizAnswered(quizIndex) && quiz.explanation" class="quiz-explanation">
                  <div class="explanation-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9,9h6v6H9z"></path>
                    </svg>
                    Explanation
                  </div>
                  <div v-html="formattedExplanation(quiz.explanation)"></div>
                </div>
              </Transition>
            </div>
          </div>
          
          <div v-else class="no-quiz">
            <div class="placeholder-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p>Quiz content unavailable</p>
          </div>
        </div>
      `,
      computed: {
        quizData() {
          const stepData = this.step.data;
          if (Array.isArray(stepData) && stepData.length > 0) {
            return stepData.filter(quiz => quiz && (quiz.question || quiz.text));
          }
          if (stepData && Array.isArray(stepData.questions)) {
            return stepData.questions.filter(quiz => quiz && (quiz.question || quiz.text));
          }
          if (stepData && (stepData.question || stepData.text)) {
            return [{
              question: stepData.question || stepData.text,
              options: stepData.options || [],
              explanation: stepData.explanation || '',
              correctAnswer: stepData.correctAnswer
            }];
          }
          return [];
        }
      },
      methods: {
        selectAnswer(quizIndex, optionIndex, option) {
          if (this.isQuizAnswered(quizIndex)) return;
          
          this.selectedQuestions.set(quizIndex, optionIndex);
          const isCorrect = this.isCorrectOption(option);
          this.$emit('quiz-answer', this.stepIndex, optionIndex, isCorrect);
          
          // Show feedback after a short delay
          setTimeout(() => {
            this.showFeedback.set(quizIndex, true);
            this.$forceUpdate();
          }, 300);
        },
        getOptionText(option) {
          if (typeof option === 'string') return option;
          return option.text || option.label || option.value || 'Option';
        },
        isCorrectOption(option) {
          if (typeof option === 'object') {
            return Boolean(option.correct || option.isCorrect);
          }
          return false;
        },
        isQuizAnswered(quizIndex) {
          return this.selectedQuestions.has(quizIndex);
        },
        getSelectedAnswer(quizIndex) {
          return this.selectedQuestions.get(quizIndex);
        },
        getOptionClass(quizIndex, optionIndex, option) {
          const selectedAnswer = this.getSelectedAnswer(quizIndex);
          const isAnswered = this.isQuizAnswered(quizIndex);
          
          if (!isAnswered) {
            return selectedAnswer === optionIndex ? 'selected' : '';
          }
          
          if (this.isCorrectOption(option)) {
            return 'correct';
          }
          if (selectedAnswer === optionIndex && !this.isCorrectOption(option)) {
            return 'incorrect';
          }
          return 'disabled';
        },
        formattedExplanation(explanation) {
          return explanation ? explanation.replace(/\n/g, '<br>') : '';
        }
      }
    }
  }
}
</script>

<style scoped>
/* ===== RUNWAY ML INSPIRED DESIGN SYSTEM ===== */
:root {
  /* Dark theme colors */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-card: #222222;
  --bg-elevated: #2a2a2a;
  
  /* Text colors */
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #666666;
  
  /* Brand colors */
  --accent-purple: #8b5cf6;
  --accent-purple-hover: #7c3aed;
  --accent-blue: #3b82f6;
  --accent-green: #10b981;
  --accent-red: #ef4444;
  --accent-orange: #f59e0b;
  
  /* Border colors */
  --border-primary: #333333;
  --border-secondary: #444444;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Border radius */
  --radius-sm: 6px;
  --radius: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Typography */
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  
  /* Transitions */
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== BASE STYLES ===== */
* {
  box-sizing: border-box;
}

.lesson-player-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.lesson-player {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 1200px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ===== HEADER STYLES ===== */
.player-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  padding: var(--space-6) var(--space-8);
  position: relative;
  flex-shrink: 0;
}

.close-btn {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: 36px;
  height: 36px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  z-index: 10;
}

.close-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-secondary);
  transform: scale(1.05);
}

.header-content {
  max-width: calc(100% - 48px);
}

.course-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--bg-elevated);
  color: var(--accent-purple);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: var(--space-4);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.lesson-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-6) 0;
  line-height: 1.2;
  background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
  -webkit-background-clip: text;
  background-clip: text;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.progress-percentage {
  color: var(--accent-purple);
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-purple), var(--accent-blue));
  border-radius: var(--radius-sm);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
  border-radius: var(--radius-sm);
}

/* ===== MAIN CONTENT AREA ===== */
.player-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-8);
  background: var(--bg-primary);
}

/* Custom scrollbar */
.player-content::-webkit-scrollbar {
  width: 8px;
}

.player-content::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.player-content::-webkit-scrollbar-thumb {
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
}

.player-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-secondary);
}

/* ===== LOADING STATES ===== */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 400px;
  padding: var(--space-12);
  color: var(--text-secondary);
}

.loading-spinner {
  position: relative;
  margin-bottom: var(--space-6);
}

.spinner-ring {
  width: 48px;
  height: 48px;
  border: 3px solid var(--bg-elevated);
  border-top: 3px solid var(--accent-purple);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.loading-state h3, .error-state h3, .empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-3) 0;
}

.loading-state p, .error-state p, .empty-state p {
  margin: 0 0 var(--space-6) 0;
  max-width: 400px;
  line-height: 1.6;
}

.retry-btn, .back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--accent-purple);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
}

.retry-btn:hover, .back-btn:hover {
  background: var(--accent-purple-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* ===== LESSON CONTENT ===== */
.lesson-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.objectives-card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-4);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--accent-green);
  font-weight: 600;
  font-size: 1.125rem;
  margin-bottom: var(--space-4);
}

.objectives-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.objectives-list li {
  position: relative;
  padding-left: var(--space-6);
  color: var(--text-secondary);
  line-height: 1.5;
}

.objectives-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--accent-green);
  font-weight: bold;
}

/* ===== STEP CARDS ===== */
.step-card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}

.step-card:hover {
  border-color: var(--border-secondary);
  box-shadow: var(--shadow-md);
}

.step-header {
  background: var(--bg-secondary);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.step-number {
  width: 32px;
  height: 32px;
  background: var(--accent-purple);
  color: var(--text-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.step-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.step-type-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.step-type-badge.explanation { background: rgba(59, 130, 246, 0.2); color: var(--accent-blue); }
.step-type-badge.example { background: rgba(16, 185, 129, 0.2); color: var(--accent-green); }
.step-type-badge.practice { background: rgba(245, 158, 11, 0.2); color: var(--accent-orange); }
.step-type-badge.quiz { background: rgba(139, 92, 246, 0.2); color: var(--accent-purple); }
.step-type-badge.video { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); }

.step-content {
  padding: var(--space-8);
  background: var(--bg-card);
}

/* ===== STEP COMPONENT STYLES ===== */

/* Text Content */
.step-text {
  line-height: 1.7;
  color: var(--text-secondary);
}

.text-content {
  font-size: 1rem;
  line-height: 1.7;
}

.text-content p {
  margin: 0 0 var(--space-5) 0;
  color: var(--text-secondary);
}

.text-content h1, .text-content h2, .text-content h3 {
  color: var(--text-primary);
  margin: var(--space-6) 0 var(--space-4) 0;
}

.text-content h1 { font-size: 1.5rem; }
.text-content h2 { font-size: 1.25rem; }
.text-content h3 { font-size: 1.125rem; }

.text-content strong {
  color: var(--text-primary);
  font-weight: 600;
}

.text-content ul, .text-content ol {
  margin: var(--space-5) 0;
  padding-left: var(--space-6);
}

.text-content li {
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
}

.step-images {
  margin-top: var(--space-8);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

.step-image {
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.step-image img {
  width: 100%;
  height: auto;
  display: block;
}

.image-caption {
  padding: var(--space-4);
  font-size: 0.875rem;
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
}

/* Video Styles */
.step-video {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.video-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: var(--bg-elevated);
}

.video-embed {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  background: var(--bg-elevated);
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.video-element {
  width: 100%;
  height: auto;
  max-height: 500px;
  display: block;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.placeholder-icon {
  margin-bottom: var(--space-4);
  opacity: 0.6;
}

.video-description {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
}

/* PDF Styles */
.step-pdf {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.pdf-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-3) 0;
}

.pdf-viewer {
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.pdf-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition);
  min-width: 120px;
  justify-content: center;
}

.action-btn--primary {
  background: var(--accent-purple);
  color: var(--text-primary);
  border: none;
}

.action-btn--primary:hover {
  background: var(--accent-purple-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-btn--secondary {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-secondary);
}

.action-btn--secondary:hover {
  background: var(--bg-card);
  border-color: var(--border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Practice Styles */
.step-practice {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.practice-header {
  padding: var(--space-6);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.practice-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-4) 0;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.file-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  transition: var(--transition);
}

.file-card:hover {
  background: var(--bg-card);
  border-color: var(--accent-purple);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.file-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.4;
}

.download-icon {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: var(--transition);
}

.file-card:hover .download-icon {
  color: var(--accent-purple);
}

.no-files {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: var(--space-8);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-secondary);
}

/* Quiz Styles */
.step-quiz {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.quiz-item {
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.quiz-item + .quiz-item {
  margin-top: var(--space-6);
}

.quiz-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-5) 0;
  line-height: 1.4;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.quiz-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--bg-card);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-secondary);
  width: 100%;
}

.quiz-option:hover:not(:disabled) {
  background: var(--bg-elevated);
  border-color: var(--accent-purple);
  transform: translateX(4px);
}

.quiz-option:disabled {
  cursor: not-allowed;
}

.quiz-option.selected {
  border-color: var(--accent-purple);
  background: rgba(139, 92, 246, 0.1);
}

.quiz-option.correct {
  border-color: var(--accent-green);
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-green);
}

.quiz-option.incorrect {
  border-color: var(--accent-red);
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
}

.quiz-option.disabled {
  opacity: 0.7;
}

.option-text {
  flex: 1;
  line-height: 1.5;
}

.option-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  margin-left: var(--space-3);
}

.quiz-option.correct .option-indicator {
  background: var(--accent-green);
  color: var(--text-primary);
}

.quiz-option.incorrect .option-indicator {
  background: var(--accent-red);
  color: var(--text-primary);
}

.quiz-explanation {
  padding: var(--space-5);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--accent-purple);
  margin-top: var(--space-5);
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  font-size: 0.875rem;
}

.quiz-explanation p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.no-quiz {
  text-align: center;
  color: var(--text-muted);
  padding: var(--space-8);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-secondary);
}

.no-quiz p {
  margin: var(--space-4) 0;
  font-weight: 500;
}

/* ===== FOOTER NAVIGATION ===== */
.player-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  padding: var(--space-6) var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-shrink: 0;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
  min-width: 120px;
  justify-content: center;
  height: 44px;
  border: none;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.nav-btn--primary {
  background: var(--accent-purple);
  color: var(--text-primary);
}

.nav-btn--primary:hover:not(:disabled) {
  background: var(--accent-purple-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.nav-btn--secondary {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-secondary);
}

.nav-btn--secondary:hover:not(:disabled) {
  background: var(--bg-card);
  border-color: var(--border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.nav-btn--success {
  background: var(--accent-green);
  color: var(--text-primary);
}

.nav-btn--success:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.lesson-indicators {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius);
}

.lesson-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border-secondary);
  transition: var(--transition);
}

.lesson-dot.active {
  background: var(--accent-purple);
  border-color: var(--accent-purple);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

.lesson-dot.completed {
  background: var(--accent-green);
  border-color: var(--accent-green);
}

.more-lessons {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  margin-left: var(--space-2);
}

/* ===== PDF FULLSCREEN MODAL ===== */
.pdf-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--space-4);
}

.pdf-container {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1400px;
  max-height: 95vh;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-primary);
}

.pdf-close-btn {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 10;
  background: var(--bg-elevated);
  border: 1px solid var(--border-secondary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.pdf-close-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
  transform: scale(1.05);
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}

/* ===== TRANSITIONS ===== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active {
  transition: all 0.3s ease-out;
}

.slide-down-leave-active {
  transition: all 0.2s ease-in;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 1024px) {
  .lesson-player {
    max-width: 95vw;
  }
  
  .step-images {
    grid-template-columns: 1fr;
  }
  
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .lesson-player-overlay {
    padding: 0;
  }
  
  .lesson-player {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .player-header {
    padding: var(--space-4);
  }
  
  .lesson-title {
    font-size: 1.5rem;
  }
  
  .player-content {
    padding: var(--space-4);
  }
  
  .step-content {
    padding: var(--space-4);
  }
  
  .step-header {
    padding: var(--space-4);
  }
  
  .player-footer {
    padding: var(--space-4);
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .nav-btn {
    width: 100%;
    min-width: auto;
  }
  
  .lesson-indicators {
    order: -1;
    width: 100%;
    justify-content: center;
  }
  
  .pdf-viewer {
    height: 400px;
  }
  
  .video-embed {
    padding-bottom: 75%; /* 4:3 on mobile */
  }
  
  .file-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .player-header {
    padding: var(--space-3);
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    top: var(--space-3);
    right: var(--space-3);
  }
  
  .lesson-title {
    font-size: 1.25rem;
  }
  
  .course-badge {
    font-size: 0.75rem;
    padding: var(--space-1) var(--space-2);
  }
  
  .step-header {
    padding: var(--space-3);
    gap: var(--space-3);
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  
  .step-title {
    font-size: 1rem;
  }
  
  .step-content {
    padding: var(--space-3);
  }
  
  .quiz-option {
    padding: var(--space-3);
    font-size: 0.875rem;
  }
  
  .file-card {
    padding: var(--space-3);
    gap: var(--space-3);
  }
  
  .practice-header {
    padding: var(--space-4);
  }
  
  .quiz-item {
    padding: var(--space-4);
  }
  
  .loading-state, .error-state, .empty-state {
    padding: var(--space-6);
    min-height: 300px;
  }
  
  .pdf-modal {
    padding: var(--space-2);
  }
  
  .pdf-close-btn {
    width: 36px;
    height: 36px;
    top: var(--space-2);
    right: var(--space-2);
  }
}

/* ===== ACCESSIBILITY ===== */
.close-btn:focus-visible,
.nav-btn:focus-visible,
.quiz-option:focus-visible,
.file-card:focus-visible,
.action-btn:focus-visible,
.retry-btn:focus-visible,
.back-btn:focus-visible,
.pdf-close-btn:focus-visible {
  outline: 2px solid var(--accent-purple);
  outline-offset: 2px;
}

/* ===== ANIMATIONS ===== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.step-card {
  animation: fadeInUp 0.4s ease-out;
}

.lesson-content .step-card:nth-child(1) { animation-delay: 0.1s; }
.lesson-content .step-card:nth-child(2) { animation-delay: 0.2s; }
.lesson-content .step-card:nth-child(3) { animation-delay: 0.3s; }
.lesson-content .step-card:nth-child(4) { animation-delay: 0.4s; }
.lesson-content .step-card:nth-child(5) { animation-delay: 0.5s; }

.quiz-option {
  animation: slideInLeft 0.3s ease-out;
}

.quiz-options .quiz-option:nth-child(1) { animation-delay: 0.1s; }
.quiz-options .quiz-option:nth-child(2) { animation-delay: 0.2s; }
.quiz-options .quiz-option:nth-child(3) { animation-delay: 0.3s; }
.quiz-options .quiz-option:nth-child(4) { animation-delay: 0.4s; }

.objectives-card {
  animation: fadeInUp 0.4s ease-out;
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

/* ===== DEMO CONTENT STYLES ===== */
.demo-content {
  padding: var(--space-4);
}

.demo-content h2 {
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  font-size: 1.5rem;
}

.demo-features {
  margin-top: var(--space-6);
  padding: var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius);
  border: 1px solid var(--border-primary);
}

.demo-features h3 {
  color: var(--accent-purple);
  margin-bottom: var(--space-3);
}

.demo-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.demo-features li {
  padding: var(--space-2) 0;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.demo-features li:last-child {
  border-bottom: none;
}

.content-types {
  padding: var(--space-4);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.content-type {
  padding: var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius);
}

.content-type h4 {
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
  font-size: 1rem;
}

.content-type p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* ===== HIGH CONTRAST MODE SUPPORT ===== */
@media (prefers-contrast: high) {
  :root {
    --bg-primary: #000000;
    --bg-secondary: #1a1a1a;
    --bg-card: #2a2a2a;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --border-primary: #555555;
    --border-secondary: #777777;
  }
  
  .step-card,
  .quiz-item,
  .file-card,
  .objectives-card {
    border-width: 2px;
  }
}

/* ===== REDUCED MOTION SUPPORT ===== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .step-card,
  .quiz-option,
  .objectives-card {
    animation: none;
  }
  
  .progress-fill {
    transition: none;
  }
}

/* ===== PRINT STYLES ===== */
@media print {
  .lesson-player-overlay {
    position: static;
    background: none;
    padding: 0;
  }
  
  .lesson-player {
    box-shadow: none;
    border: 1px solid #333;
    max-height: none;
    background: white;
    color: black;
  }
  
  .close-btn,
  .player-footer,
  .nav-btn {
    display: none;
  }
  
  .player-content {
    overflow: visible;
    background: white;
  }
  
  .step-card {
    break-inside: avoid;
    margin-bottom: var(--space-6);
    background: white;
    border: 1px solid #ccc;
  }
  
  .video-wrapper,
  .pdf-viewer {
    display: none;
  }
  
  .video-description {
    display: block;
    text-align: left;
    font-style: normal;
    padding: var(--space-4);
    border: 1px solid #ccc;
    border-radius: var(--radius);
    background: #f5f5f5;
    color: black;
  }
  
  .video-description::before {
    content: "Video: ";
    font-weight: bold;
  }
  
  /* Convert dark theme colors for print */
  .player-header,
  .step-header,
  .quiz-item,
  .objectives-card {
    background: #f9f9f9 !important;
    color: black !important;
  }
  
  .lesson-title,
  .step-title,
  .text-content h1,
  .text-content h2,
  .text-content h3 {
    color: black !important;
  }
  
  .text-content p,
  .text-content li {
    color: #333 !important;
  }
}
</style>