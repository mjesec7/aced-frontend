<template>
  <div class="lesson-player">
    <div class="lesson-header">
      <button @click="backToCourses" class="back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H6m6-7l-7 7 7 7"/>
        </svg>
        Назад к курсам
      </button>
      
      <div class="course-info">
        <h1 class="course-title">{{ course?.title }}</h1>
        <p class="course-category">{{ course?.category }}</p>
      </div>

      <div class="lesson-progress">
        <div class="progress-info">
          {{ currentLessonIndex + 1 }} из {{ lessons.length }} уроков
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${overallProgress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <div class="lesson-content">
      <div class="lesson-sidebar">
        <div class="sidebar-header">
          <h3>Содержание курса</h3>
          <span class="lesson-count">{{ lessons.length }} уроков</span>
        </div>
        
        <div class="lesson-list">
          <div 
            v-for="(lesson, index) in lessons" 
            :key="lesson.id"
            :class="['lesson-item', { 
              'active': index === currentLessonIndex,
              'completed': lesson.completed 
            }]"
            @click="selectLesson(index)"
          >
            <div class="lesson-number">{{ index + 1 }}</div>
            <div class="lesson-details">
              <div class="lesson-name">{{ lesson.title }}</div>
              <div class="lesson-meta">
                <span class="lesson-duration">{{ lesson.duration }}</span>
                <span v-if="lesson.imageMetadata?.hasImages" class="lesson-images">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="9" cy="9" r="2"></circle>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                  </svg>
                  {{ lesson.imageMetadata.totalImages }}
                </span>
              </div>
            </div>
            <div class="lesson-status">
              <svg v-if="lesson.completed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="check-icon">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"></path>
                <path d="M22 4L12 14.01l-3-3"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="lesson-main">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка урока...</p>
        </div>

        <div v-else-if="currentLesson" class="lesson-viewer">
          <div class="lesson-viewer-header">
            <h2 class="lesson-title">{{ currentLesson.title }}</h2>
            <p v-if="currentLesson.description" class="lesson-description">
              {{ currentLesson.description }}
            </p>
          </div>

          <div v-if="currentLesson.steps && currentLesson.steps.length > 0" class="step-navigation">
            <div class="step-indicators">
              <div 
                v-for="(step, index) in currentLesson.steps" 
                :key="step.id"
                :class="['step-indicator', { 
                  'active': index === currentStepIndex,
                  'completed': index < currentStepIndex 
                }]"
                @click="selectStep(index)"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-type">{{ getStepTypeLabel(step.type) }}</div>
              </div>
            </div>
            
            <div class="step-progress">
              {{ currentStepIndex + 1 }} / {{ currentLesson.steps.length }} шагов
            </div>
          </div>

          <div v-if="currentStep" class="step-content">
            <div class="step-header">
              <div class="step-type-badge" :class="`type-${currentStep.type}`">
                <component :is="getStepIcon(currentStep.type)" class="step-icon" />
                {{ getStepTypeLabel(currentStep.type) }}
              </div>
              <h3 v-if="currentStep.title" class="step-title">{{ currentStep.title }}</h3>
            </div>

            <div class="step-body">
              <div v-if="isTextStep(currentStep)" class="text-step">
                <div v-if="currentStep.content || currentStep.data?.content" class="step-text">
                  {{ currentStep.content || currentStep.data?.content }}
                </div>
                
                <div v-if="hasStepImages(currentStep)" class="step-images">
                  <div 
                    v-for="(image, index) in getStepImages(currentStep)" 
                    :key="image.id || index"
                    class="step-image-container"
                    :class="getImageLayoutClass(image)"
                  >
                    <img 
                      :src="image.url" 
                      :alt="image.alt || image.caption"
                      class="step-image"
                      @click="openImageModal(image)"
                      @error="handleImageError($event, image)"
                    />
                    <div v-if="image.caption" class="image-caption">
                      {{ image.caption }}
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="currentStep.type === 'image'" class="image-step">
                <div v-if="currentStep.data?.description" class="image-description">
                  {{ currentStep.data.description }}
                </div>
                
                <div class="image-gallery">
                  <div 
                    v-for="(image, index) in getStepImages(currentStep)" 
                    :key="image.id || index"
                    class="gallery-image-container"
                    :class="getImageLayoutClass(image)"
                  >
                    <img 
                      :src="image.url" 
                      :alt="image.alt || image.caption"
                      class="gallery-image"
                      @click="openImageModal(image)"
                      @error="handleImageError($event, image)"
                    />
                    <div v-if="image.caption" class="image-caption">
                      {{ image.caption }}
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="currentStep.type === 'practice'" class="practice-step">
                <div class="practice-instructions">
                  {{ currentStep.data?.instructions || currentStep.instructions || currentStep.content }}
                </div>
                
                <div v-if="hasStepImages(currentStep)" class="practice-images">
                  <div 
                    v-for="(image, index) in getStepImages(currentStep)" 
                    :key="image.id || index"
                    class="practice-image-container"
                  >
                    <img 
                      :src="image.url" 
                      :alt="image.alt || image.caption"
                      class="practice-image"
                      @click="openImageModal(image)"
                      @error="handleImageError($event, image)"
                    />
                    <div v-if="image.caption" class="image-caption">
                      {{ image.caption }}
                    </div>
                  </div>
                </div>
                
                <div class="practice-area">
                  <div class="practice-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                      <circle cx="12" cy="13" r="3"></circle>
                    </svg>
                    <p>Практическое задание</p>
                    <p class="practice-hint">Примените полученные знания на практике</p>
                  </div>
                </div>
              </div>

              <div v-else-if="currentStep.type === 'quiz'" class="quiz-step">
                <div v-if="Array.isArray(currentStep.data) && currentStep.data.length > 0">
                  <div v-for="(quiz, quizIndex) in currentStep.data" :key="quizIndex" class="quiz-item">
                    <h4 class="quiz-question">{{ quiz.question }}</h4>
                    
                    <div v-if="quiz.images && quiz.images.length > 0" class="quiz-images">
                      <div 
                        v-for="(image, index) in quiz.images" 
                        :key="image.id || index"
                        class="quiz-image-container"
                      >
                        <img 
                          :src="image.url" 
                          :alt="image.alt || image.caption"
                          class="quiz-image"
                          @click="openImageModal(image)"
                          @error="handleImageError($event, image)"
                        />
                        <div v-if="image.caption" class="image-caption">
                          {{ image.caption }}
                        </div>
                      </div>
                    </div>
                    
                    <div v-if="quiz.options && quiz.options.length > 0" class="quiz-options">
                      <div 
                        v-for="(option, optionIndex) in quiz.options" 
                        :key="optionIndex"
                        class="quiz-option"
                        @click="selectQuizOption(quizIndex, optionIndex)"
                        :class="{ 'selected': selectedAnswers[quizIndex] === optionIndex }"
                      >
                        <div class="option-indicator"></div>
                        <div class="option-text">{{ option.text }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-else class="quiz-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <p>Тест не настроен</p>
                </div>
              </div>

              <div v-else class="default-step">
                <div v-if="currentStep.content" class="step-content-text">
                  {{ currentStep.content }}
                </div>
                <div v-else class="step-placeholder">
                  <p>Содержимое шага</p>
                </div>
              </div>
            </div>

            <div class="step-controls">
              <button 
                @click="previousStep" 
                :disabled="currentStepIndex === 0"
                class="step-button step-button-prev"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H6m6-7l-7 7 7 7"/>
                </svg>
                Назад
              </button>

              <button 
                @click="nextStep" 
                :disabled="currentStepIndex >= currentLesson.steps.length - 1"
                class="step-button step-button-next"
              >
                Далее
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 12h12m-6-7l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-else class="no-steps">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
            <p>Содержимое урока пока не доступно</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="imageModalOpen" class="image-modal-overlay" @click="closeImageModal">
      <div class="image-modal" @click.stop>
        <button @click="closeImageModal" class="modal-close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
        
        <div class="modal-image-container">
          <img 
            v-if="selectedImage"
            :src="selectedImage.url" 
            :alt="selectedImage.alt || selectedImage.caption"
            class="modal-image"
          />
        </div>
        
        <div v-if="selectedImage?.caption" class="modal-image-caption">
          {{ selectedImage.caption }}
        </div>
      </div>
    </div>
  </div>
</template>

// ===== LESSON PLAYER.VUE SCRIPT FIXES =====

<script>
import { getCourseById } from '@/api.js';

export default {
  name: 'LessonPlayer',
  data() {
    return {
      lessons: [],
      currentLessonIndex: 0,
      currentStepIndex: 0,
      loading: true,
      error: null,
      selectedAnswers: {},
      imageModalOpen: false,
      selectedImage: null,
      course: null,
      
      stepTypeLabels: {
        explanation: 'Объяснение',
        example: 'Пример',
        reading: 'Чтение',
        image: 'Изображения',
        practice: 'Практика',
        quiz: 'Тест',
        video: 'Видео',
        audio: 'Аудио'
      }
    };
  },
  computed: {
    currentLesson() {
      return this.lessons[this.currentLessonIndex] || null;
    },
    
    currentStep() {
      if (!this.currentLesson) return null;
      
      // ✅ FIXED: Handle different data structures properly
      const lesson = this.currentLesson;
      
      // Check direct steps array
      if (lesson.steps && Array.isArray(lesson.steps) && lesson.steps.length > 0) {
        return lesson.steps[this.currentStepIndex] || null;
      }
      
      // Check curriculum structure
      if (lesson.curriculum && Array.isArray(lesson.curriculum)) {
        const firstModule = lesson.curriculum[0];
        if (firstModule && firstModule.steps && Array.isArray(firstModule.steps)) {
          return firstModule.steps[this.currentStepIndex] || null;
        }
      }
      
      return null;
    },
    
    overallProgress() {
      if (this.lessons.length === 0) return 0;
      const completedLessons = this.lessons.filter(lesson => lesson.completed).length;
      const currentLessonProgress = this.getCurrentLessonProgress();
      return Math.round(((completedLessons + currentLessonProgress) / this.lessons.length) * 100);
    },
  },
  created() {
    const courseId = this.$route.params.courseId;
    if (courseId) {
      this.loadCourse(courseId);
    } else {
      this.error = 'Course ID is missing.';
      this.loading = false;
    }
  },
  methods: {
    // ✅ FIXED: Improved course loading with better error handling
    async loadCourse(courseId) {
      try {
        this.loading = true;
        this.error = null;
        console.log('🎓 Loading course content for ID:', courseId);

        const response = await getCourseById(courseId);

        if (response.success && response.data) {
          this.course = response.data;
          
          // ✅ FIXED: Handle multiple response formats
          let lessonsData = null;
          
          // Try different data structures
          if (response.data.lessons && Array.isArray(response.data.lessons)) {
            lessonsData = response.data.lessons;
          } else if (response.data.curriculum && Array.isArray(response.data.curriculum)) {
            lessonsData = response.data.curriculum;
          } else if (response.data.course && response.data.course.curriculum) {
            lessonsData = response.data.course.curriculum;
          }
          
          if (lessonsData && lessonsData.length > 0) {
            this.lessons = lessonsData.map((lesson, index) => ({
              ...lesson,
              id: lesson._id || lesson.id || `lesson_${index}`,
              title: lesson.title || lesson.lessonName || `Урок ${index + 1}`,
              completed: false,
              steps: lesson.steps || [],
              duration: lesson.duration || '30 мин'
            }));
            
            console.log(`✅ Loaded course: ${this.course.title} with ${this.lessons.length} lessons`);
          } else {
            // Create default lesson structure if no lessons found
            this.lessons = [{
              id: 'default_lesson',
              title: this.course.title || 'Урок',
              completed: false,
              steps: [],
              duration: '30 мин'
            }];
            console.warn('⚠️ No lessons found, created default lesson');
          }

        } else {
          throw new Error(response.error || 'Не удалось загрузить содержимое курса');
        }
      } catch (error) {
        console.error('❌ Error loading course:', error);
        this.error = error.message || 'Произошла ошибка при загрузке курса';
      } finally {
        this.loading = false;
      }
    },

    // ✅ PERFORMANCE: Helper method for progress calculation
    getCurrentLessonProgress() {
      if (!this.currentLesson) return 0;
      
      const totalSteps = this.getTotalStepsInLesson(this.currentLesson);
      if (totalSteps === 0) return 0;
      
      return this.currentStepIndex / totalSteps;
    },

    // ✅ HELPER: Get total steps in a lesson
    getTotalStepsInLesson(lesson) {
      if (!lesson) return 0;
      
      if (lesson.steps && Array.isArray(lesson.steps)) {
        return lesson.steps.length;
      }
      
      if (lesson.curriculum && Array.isArray(lesson.curriculum)) {
        const firstModule = lesson.curriculum[0];
        if (firstModule && firstModule.steps && Array.isArray(firstModule.steps)) {
          return firstModule.steps.length;
        }
      }
      
      return 0;
    },

    backToCourses() {
      this.$router.push({ name: 'CoursesPage' });
    },
    
    selectLesson(index) {
      this.currentLessonIndex = index;
      this.currentStepIndex = 0;
      this.selectedAnswers = {};
    },
    
    selectStep(index) {
      this.currentStepIndex = index;
    },
    
    // ✅ FIXED: Better navigation logic
    nextStep() {
      const totalSteps = this.getTotalStepsInLesson(this.currentLesson);
      
      if (this.currentStepIndex < totalSteps - 1) {
        this.currentStepIndex++;
      } else if (this.currentLessonIndex < this.lessons.length - 1) {
        // Mark current lesson as completed and move to next lesson
        if (this.currentLesson) {
          this.currentLesson.completed = true;
        }
        this.currentLessonIndex++;
        this.currentStepIndex = 0;
      }
    },
    
    previousStep() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;
      } else if (this.currentLessonIndex > 0) {
        this.currentLessonIndex--;
        const prevLesson = this.lessons[this.currentLessonIndex];
        const prevLessonSteps = this.getTotalStepsInLesson(prevLesson);
        this.currentStepIndex = Math.max(0, prevLessonSteps - 1);
      }
    },
    
    selectQuizOption(quizIndex, optionIndex) {
      this.$set(this.selectedAnswers, quizIndex, optionIndex);
    },
    
    // ✅ FIXED: Enhanced image handling with safety checks
    hasStepImages(step) {
      if (!step) return false;
      
      // Check direct images
      if (step.images && Array.isArray(step.images) && step.images.length > 0) {
        return step.images.some(img => img && (img.url || img.base64));
      }
      
      // Check data.images
      if (step.data && step.data.images && Array.isArray(step.data.images) && step.data.images.length > 0) {
        return step.data.images.some(img => img && (img.url || img.base64));
      }
      
      return false;
    },
    
    getStepImages(step) {
      if (!step) return [];
      
      // Get images from step or step.data
      let images = [];
      
      if (step.images && Array.isArray(step.images)) {
        images = step.images;
      } else if (step.data && step.data.images && Array.isArray(step.data.images)) {
        images = step.data.images;
      }
      
      // Filter and validate images
      return images.filter(img => img && (img.url || img.base64));
    },
    
    getImageLayoutClass(image) {
      if (!image) return 'align-center size-medium';
      
      const alignment = (image.displayOptions && image.displayOptions.alignment) || 
                       image.alignment || 'center';
      const size = (image.displayOptions && image.displayOptions.size) || 
                   image.size || 'medium';
      
      return `align-${alignment} size-${size}`;
    },
    
    openImageModal(image) {
      if (!image) return;
      this.selectedImage = image;
      this.imageModalOpen = true;
    },
    
    closeImageModal() {
      this.imageModalOpen = false;
      this.selectedImage = null;
    },
    
    handleImageError(event, image) {
      console.warn('Image failed to load:', image?.url || 'unknown');
      if (event && event.target) {
        event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5.8-5.8a2 2 0 0 0-2.82 0L7 21"></path></svg>';
        event.target.onerror = null; // Prevent infinite loop
      }
    },
    
    // ✅ FIXED: Step type helpers
    isTextStep(step) {
      if (!step || !step.type) return false;
      return ['explanation', 'example', 'reading'].includes(step.type);
    },
    
    getStepTypeLabel(type) {
      if (!type) return 'Шаг';
      return this.stepTypeLabels[type] || 'Шаг';
    },
    
    getStepIcon(type) {
      const icons = {
        explanation: 'file-text-icon', 
        example: 'code-icon', 
        reading: 'book-open-icon',
        image: 'image-icon',
        practice: 'activity-icon',
        quiz: 'help-circle-icon'
      };
      return icons[type] || 'circle';
    }
  }
};
</script>

<style scoped>
.lesson-player {
  background-color: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.lesson-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.course-info {
  flex: 1;
}

.course-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.course-category {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0.25rem 0 0 0;
}

.lesson-progress {
  text-align: right;
}

.progress-info {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Main Content */
.lesson-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* Sidebar */
.lesson-sidebar {
  width: 320px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.lesson-count {
  font-size: 0.85rem;
  color: #64748b;
}

.lesson-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
}

.lesson-item:hover {
  background: #e2e8f0;
}

.lesson-item.active {
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.lesson-item.completed {
  background: #f0fdf4;
}

.lesson-number {
  width: 2rem;
  height: 2rem;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.lesson-item.active .lesson-number {
  background: #3b82f6;
  color: white;
}

.lesson-item.completed .lesson-number {
  background: #10b981;
  color: white;
}

.lesson-details {
  flex: 1;
  min-width: 0;
}

.lesson-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lesson-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  color: #64748b;
}

.lesson-images {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.lesson-status {
  flex-shrink: 0;
}

.check-icon {
  color: #10b981;
}

/* Main Lesson Area */
.lesson-main {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: #64748b;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Lesson Viewer */
.lesson-viewer {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.lesson-viewer-header {
  margin-bottom: 2rem;
  text-align: center;
}

.lesson-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.lesson-description {
  font-size: 1.1rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* Step Navigation */
.step-navigation {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.step-indicators {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  min-width: 80px;
}

.step-indicator:hover {
  border-color: #e2e8f0;
}

.step-indicator.active {
  border-color: #3b82f6;
  background: #dbeafe;
}

.step-indicator.completed {
  background: #f0fdf4;
  border-color: #10b981;
}

.step-number {
  width: 2rem;
  height: 2rem;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
}

.step-indicator.active .step-number {
  background: #3b82f6;
  color: white;
}

.step-indicator.completed .step-number {
  background: #10b981;
  color: white;
}

.step-type {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

.step-progress {
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
}

/* Step Content */
.step-content {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.step-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.step-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.step-type-badge.type-explanation {
  background: #dbeafe;
  color: #1e40af;
}

.step-type-badge.type-image {
  background: #fef3c7;
  color: #92400e;
}

.step-type-badge.type-practice {
  background: #d1fae5;
  color: #065f46;
}

.step-type-badge.type-quiz {
  background: #fce7f3;
  color: #9d174d;
}

.step-icon {
  width: 1rem;
  height: 1rem;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.step-body {
  padding: 2rem;
}

/* Text Step Styles */
.text-step {
  line-height: 1.7;
}

.step-text {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 2rem;
}

/* ✅ ENHANCED: Image Styles */
.step-images, .practice-images, .quiz-images {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.step-images {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.step-image-container, .practice-image-container, .quiz-image-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.step-image, .practice-image, .quiz-image {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
  transition: transform 0.2s;
}

.step-image:hover, .practice-image:hover, .quiz-image:hover {
  transform: scale(1.02);
}

.image-caption {
  padding: 0.75rem;
  font-size: 0.9rem;
  color: #64748b;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

/* Image Gallery (for image steps) */
.image-gallery {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

.gallery-image-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.gallery-image {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
}

.image-description {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 2rem;
  text-align: center;
}

/* Layout Classes */
.align-left {
  text-align: left;
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}

.size-small .step-image,
.size-small .practice-image,
.size-small .quiz-image {
  max-width: 300px;
  margin: 0 auto;
}

.size-medium .step-image,
.size-medium .practice-image,
.size-medium .quiz-image {
  max-width: 500px;
  margin: 0 auto;
}

.size-large .step-image,
.size-large .practice-image,
.size-large .quiz-image {
  max-width: 100%;
}

/* Practice Step */
.practice-instructions {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f0f9ff;
  border-left: 4px solid #0ea5e9;
  border-radius: 0 8px 8px 0;
}

.practice-area {
  margin-top: 2rem;
}

.practice-placeholder {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
}

.practice-placeholder svg {
  color: #94a3b8;
  margin-bottom: 1rem;
}

.practice-hint {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* Quiz Step */
.quiz-item {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.quiz-question {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem 0;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.quiz-option:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.quiz-option.selected {
  border-color: #3b82f6;
  background: #dbeafe;
}

.option-indicator {
  width: 1rem;
  height: 1rem;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  flex-shrink: 0;
}

.quiz-option.selected .option-indicator {
  background: #3b82f6;
  border-color: #3b82f6;
}

.option-text {
  flex: 1;
  color: #374151;
}

.quiz-placeholder {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

/* Step Controls */
.step-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.step-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.step-button:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.step-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-button-next {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.step-button-next:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

/* Image Modal */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.image-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.modal-image-container {
  max-height: 80vh;
  overflow: auto;
}

.modal-image {
  width: 100%;
  height: auto;
  display: block;
}

.modal-image-caption {
  padding: 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #64748b;
  text-align: center;
}

/* No Steps State */
.no-steps {
  text-align: center;
  padding: 4rem;
  color: #64748b;
}

.no-steps svg {
  color: #cbd5e1;
  margin-bottom: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .lesson-content {
    flex-direction: column;
  }
  
  .lesson-sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
  
  .lesson-viewer {
    padding: 1rem;
  }
  
  .lesson-title {
    font-size: 1.5rem;
  }
  
  .step-navigation {
    padding: 1rem;
  }
  
  .step-indicators {
    justify-content: center;
  }
  
  .step-indicator {
    min-width: 60px;
  }
  
  .image-gallery {
    grid-template-columns: 1fr;
  }
  
  .step-images {
    grid-template-columns: 1fr;
  }
  
  .lesson-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .progress-bar {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .lesson-header {
    padding: 1rem;
  }
  
  .course-title {
    font-size: 1.2rem;
  }
  
  .step-body {
    padding: 1rem;
  }
  
  .step-text {
    font-size: 1rem;
  }
  
  .image-modal-overlay {
    padding: 1rem;
  }
  
  .modal-image-caption {
    padding: 0.75rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .lesson-player {
    background-color: #1e293b;
    color: #f1f5f9;
  }
  
  .lesson-sidebar {
    background: #334155;
    border-right-color: #475569;
  }
  
  .sidebar-header {
    border-bottom-color: #475569;
  }
  
  .sidebar-header h3 {
    color: #f1f5f9;
  }
  
  .lesson-item:hover {
    background: #475569;
  }
  
  .lesson-item.active {
    background: #1e40af;
  }
  
  .lesson-viewer {
    background: #1e293b;
  }
  
  .step-content {
    background: #334155;
    border-color: #475569;
  }
  
  .step-header {
    background: #475569;
    border-bottom-color: #64748b;
  }
  
  .step-title {
    color: #f1f5f9;
  }
  
  .step-text {
    color: #cbd5e1;
  }
  
  .image-modal {
    background: #334155;
  }
  
  .modal-image-caption {
    background: #475569;
    border-top-color: #64748b;
    color: #cbd5e1;
  }
}
</style>