<template>
  <div class="study-page">
    <header class="study-header">
      <div class="study-header-content">
        <button @click="goBackToCourses" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span>Назад к курсам</span>
        </button>

        <span class="subscription-badge" :class="subscriptionClass">
          {{ subscriptionText }}
        </span>

        <div class="course-info">
          <h1 class="course-title">{{ course?.title || 'Загрузка...' }}</h1>
          <div class="course-meta">
            <span class="course-category">{{ course?.category }}</span>
            <span class="course-level">{{ course?.level }}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-info">
            <span class="progress-text">Прогресс: {{ completedLessons }}/{{ totalLessons }}</span>
            <span class="progress-percent">{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </header>

    <div class="study-main">
      <aside class="study-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
        <div class="sidebar-header">
          <div class="flex items-center gap-3 mb-2">
            <!-- BookOpen Icon -->
            <div class="w-8 h-8 bg-gradient-to-br from-[var(--color-brand-purple)] to-[var(--color-brand-purple-dark)] rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13.431m0 0a2.768 2.768 0 01-1.378-2.348v-2.185m1.378 2.348A2.768 2.768 0 0013.378 17.5v-2.185m-1.378 2.348a2.768 2.768 0 01-1.378-2.348v-2.185m1.378 2.348A2.768 2.768 0 0013.378 17.5v-2.185"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium">{{ course?.title || 'Курс' }}</h3>
          </div>
          <p class="text-sm text-muted-foreground">Полный курс</p>
          <button @click="toggleSidebar" class="sidebar-toggle mobile-only">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div class="sidebar-progress">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">Прогресс</span>
            <span class="text-sm font-medium">{{ completedLessons }}/{{ totalLessons }} Завершено</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2">
            <div
              class="h-2 rounded-full bg-gradient-to-r from-[var(--color-brand-purple)] to-[var(--color-brand-purple-light)]"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
        </div>

        <div class="lessons-list">
          <div class="p-4 space-y-2">
            <div
              v-for="(lesson, index) in lessons"
              :key="lesson.id"
              @click="selectLesson(index)"
              :class="[
                'relative p-4 rounded-lg border cursor-pointer transition-all duration-200',
                {
                  'border-[var(--color-brand-purple)] bg-[var(--color-brand-purple-muted)] shadow-sm': currentLessonIndex === index,
                  'border-border hover:border-[var(--color-brand-purple-light)] hover:bg-accent/50': currentLessonIndex !== index,
                  'opacity-60 cursor-not-allowed': lesson.locked
                }
              ]"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <!-- CheckCircle Icon -->
                  <svg v-if="lesson.completed" class="w-5 h-5 text-[var(--color-brand-purple)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <!-- Lock Icon -->
                  <svg v-else-if="lesson.locked" class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zm0-11V9a3 3 0 016 0v2"></path>
                  </svg>
                  <!-- Current Lesson Indicator -->
                  <div v-else-if="currentLessonIndex === index" class="w-5 h-5 rounded-full border-2 border-[var(--color-brand-purple)] flex items-center justify-center">
                    <div class="w-2 h-2 rounded-full bg-[var(--color-brand-purple)]"></div>
                  </div>
                  <!-- Default Circle -->
                  <div v-else class="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs text-muted-foreground font-medium">
                      {{ String(index + 1).padStart(2, '0') }}
                    </span>
                    <span v-if="currentLessonIndex === index" class="text-xs px-2 py-1 bg-[var(--color-brand-purple)] text-white rounded-full">
                      Текущий
                    </span>
                  </div>
                  <h3 :class="[
                    'text-sm leading-tight mb-2',
                    currentLessonIndex === index ? 'text-[var(--color-brand-purple)] font-medium' : 'text-foreground'
                  ]">
                    {{ lesson.title }}
                  </h3>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <!-- Clock Icon -->
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ lesson.readingTime }}
                    <span v-if="lesson.type === 'workshop'" class="px-2 py-0.5 bg-muted rounded text-xs">Практика</span>
                  </div>
                </div>

                <!-- ChevronRight Icon -->
                <svg v-if="!lesson.locked" class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="study-content">
        <button @click="toggleSidebar" class="sidebar-toggle desktop-hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span>Содержание</span>
        </button>

        <div v-if="currentLesson" class="max-w-4xl mx-auto p-8">
          <!-- Header -->
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <!-- FileText Icon -->
              <div class="w-10 h-10 bg-gradient-to-br from-[var(--color-brand-purple)] to-[var(--color-brand-purple-dark)] rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-medium mb-1">{{ currentLesson.title }}</h1>
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <!-- Clock Icon -->
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ currentLesson.readingTime }}
                  </span>
                  <span>Урок {{ currentLessonIndex + 1 }} из {{ totalLessons }}</span>
                </div>
              </div>
            </div>
            <p class="text-muted-foreground text-lg">{{ currentLesson.description }}</p>
          </div>

          <!-- Learning Objectives -->
          <div v-if="currentLesson.objectives && currentLesson.objectives.length" class="mb-8 p-6 bg-[var(--color-brand-purple-muted)] rounded-lg border border-[var(--color-brand-purple-light)]/20">
            <h2 class="text-lg font-medium mb-4 text-[var(--color-brand-purple-dark)]">Цели урока</h2>
            <ul class="space-y-2">
              <li v-for="(objective, index) in currentLesson.objectives" :key="index" class="flex items-start gap-3">
                <div class="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-purple)] mt-2.5 flex-shrink-0"></div>
                <span class="text-foreground">{{ objective }}</span>
              </li>
            </ul>
          </div>

          <!-- Content -->
          <div class="prose prose-gray max-w-none">
            <div class="whitespace-pre-line text-foreground leading-relaxed space-y-6" v-html="currentLesson.content">
            </div>
            <div v-if="currentLesson.resources && currentLesson.resources.length" class="resources-modern">
              <h3>Материалы урока</h3>
              <div class="resources-grid">
                <a
                  v-for="resource in currentLesson.resources"
                  :key="resource.id"
                  :href="resource.url"
                  download
                  class="resource-item-modern"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>{{ resource.name }}</span>
                  <span class="resource-size">{{ resource.size }}</span>
                </a>
              </div>
            </div>

            <div v-if="currentLesson.quiz" class="quiz-modern">
              <h3>Проверьте себя</h3>
              <div class="quiz-container-modern">
                <div v-if="!quizCompleted" class="quiz-questions">
                  <div class="question-item-modern">
                    <h4>{{ currentLesson.quiz.question }}</h4>
                    <div class="quiz-options-modern">
                      <label
                        v-for="(option, index) in currentLesson.quiz.options"
                        :key="index"
                        class="quiz-option-modern"
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
                      class="quiz-submit-modern"
                    >
                      Проверить ответ
                    </button>
                  </div>
                </div>
                <div v-else class="quiz-result-modern">
                  <div :class="['quiz-feedback-modern', quizCorrect ? 'correct' : 'incorrect']">
                    <svg v-if="quizCorrect" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"/>
                      <path d="M22 4L12 14.01l-3-3"/>
                    </svg>
                    <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span v-if="quizCorrect">Правильно! Отличная работа!</span>
                    <span v-else>Неправильно. Попробуйте еще раз!</span>
                  </div>
                  <button v-if="!quizCorrect" @click="quizCompleted = false" class="retry-quiz-modern">
                    Попробовать снова
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex items-center justify-between pt-8 mt-8 border-t border-border">
            <button
              @click="previousLesson"
              :disabled="currentLessonIndex === 0"
              class="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <!-- ChevronRight Icon rotated -->
              <svg class="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
              Предыдущий урок
            </button>
            <button
              v-if="currentLesson && !currentLesson.completed && (!currentLesson.quiz || (currentLesson.quiz && quizCorrect))"
              @click="markLessonCompleted"
              class="px-6 py-3 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors"
            >
              Завершить урок
            </button>
            <button
              @click="nextLesson"
              :disabled="currentLessonIndex === lessons.length - 1 || (lessons[currentLessonIndex + 1] && lessons[currentLessonIndex + 1].locked)"
              class="flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-purple)] text-white rounded-lg hover:bg-[var(--color-brand-purple-dark)] transition-colors"
            >
              Следующий урок
              <!-- ChevronRight Icon -->
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </main>
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
      currentLessonIndex: 0,
      currentLesson: null,
      sidebarOpen: false, // For sidebar toggling
      selectedAnswer: null, // For quiz
      quizCompleted: false, // For quiz
      quizCorrect: false, // For quiz
      componentKey: 0, // For forcing component re-render if needed
    };
  },

  computed: {
    subscriptionClass() {
      // Dummy subscription logic, replace with actual user status
      const status = this.course?.subscriptionPlan || 'free'; // Assuming course might have a subscription plan
      if (status === 'pro') return 'badge-pro';
      if (status === 'start') return 'badge-start';
      return 'badge-free';
    },
    subscriptionText() {
      // Dummy subscription logic, replace with actual user status
      const status = this.course?.subscriptionPlan || 'free';
      switch (status) {
        case 'pro': return 'Pro подписка';
        case 'start': return 'Start подписка';
        default: return 'Бесплатный доступ';
      }
    },
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
    // Watch for changes in the 'course' prop to initialize study data
    course: {
      handler: 'initializeStudyData',
      immediate: true, // Run immediately when the component is mounted
      deep: true // Watch for deep changes within the course object
    },
    // Watch for changes in currentLessonIndex to update currentLesson details
    currentLessonIndex: {
      handler: 'updateCurrentLessonContent',
      immediate: true,
    }
  },

  methods: {
    initializeStudyData() {
      // Populate lessons from the course prop
      this.lessons = this.course.lessons || this.generateSampleLessons();
      // Set the initial current lesson based on the currentLessonIndex
      this.updateCurrentLessonContent();
      this.sidebarOpen = false;
      this.selectedAnswer = null;
      this.quizCompleted = false;
      this.quizCorrect = false;
    },
    updateCurrentLessonContent() {
      // Ensures currentLesson and its detailed content (like objectives and description) are updated
      if (this.lessons[this.currentLessonIndex]) {
        this.currentLesson = { ...this.lessons[this.currentLessonIndex] };
        // If content is not provided by backend, use a placeholder or specific logic
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
    // This is a placeholder for actual backend fetching or a local data source
    // In a real application, you'd fetch lesson details including content, description, objectives, etc. from your API.
    getLessonContent(lessonId) {
      // This content is taken directly from the React App.tsx file for lesson 3.
      // You would replace this with actual backend fetching based on lessonId.
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

**Gen-1: Video-to-Video Transformation** - Transforms existing videos using text prompts
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
- Best for: Adding specific movements, animation control

### 3. Generation Controls

Fine-tune your creations with comprehensive controls:

**Prompt Engineering Tools**
- Text prompt input with syntax highlighting
- Suggested keywords and modifiers
- Prompt history and favorites system
- Template prompts for different scenarios

**Style and Aesthetic Controls**
- Preset style options (cinematic, documentary, artistic)
- Custom style references through image uploads
- Lighting and color temperature adjustments
- Camera movement presets (static, zoom, pan, tilt)

**Technical Parameters**
- Duration settings (1-4 seconds for Gen-2)
- Aspect ratio selection (16:9, 9:16, 1:1)
- Resolution options (720p, 1080p)
- Frame rate control (24fps, 30fps)

**Seed Management**
- Consistency controls for reproducible results
- Random seed generation for variations
- Seed locking for iterative improvements
- Batch generation with seed variations

## Your First Video Generation

Creating your first AI video is an exciting milestone. Here's a step-by-step approach:

### Step 1: Write a Clear Prompt

Start with a descriptive, specific prompt. Instead of vague descriptions, use vivid, concrete language:

**Good Example:**
"A serene mountain lake at sunrise, with mist rising from the water and birds flying overhead, cinematic wide shot"

**Why this works:**
- **Specific setting**: Mountain lake (not just "nature")
- **Time context**: Sunrise (establishes lighting)
- **Atmospheric details**: Mist rising (adds visual interest)  
- **Movement elements**: Birds flying (provides motion)
- **Camera instruction**: Wide shot (guides framing)

**Avoid these common mistakes:**
- "Beautiful nature scene" (too vague)
- "Something cool with water" (lacks specificity)
- "Make it look good" (no actionable direction)

### Step 2: Set Parameters

**Duration Selection**
- **1-2 seconds**: Good for testing prompts and quick iterations
- **4 seconds**: Standard length, provides enough time for movement
- **Recommendation**: Start with 4 seconds for beginners

**Aspect Ratio Guidelines**
- **16:9**: Standard video format, great for most content
- **9:16**: Vertical format for social media (TikTok, Instagram Stories)
- **1:1**: Square format for Instagram posts and thumbnails

**Style Considerations**
- **Default/Natural**: Best starting point for most projects
- **Cinematic**: Adds film-like qualities and color grading
- **Documentary**: More realistic, less stylized approach

### Step 3: Generate and Iterate

**Initial Generation**
1. Click the generate button and wait for processing (typically 1-3 minutes)
2. Review the result objectively - focus on whether it matches your vision
3. Note any unexpected elements or missing components

**Refinement Process**
- **If motion is unclear**: Add specific movement descriptions ("slow zoom in", "gentle panning left")
- **If style doesn't match**: Try adding style modifiers ("photorealistic", "artistic", "vintage film")
- **If elements are missing**: Be more explicit about important details

**Iteration Strategy**
- Make one change at a time to understand what each modification does
- Keep notes on successful prompts and settings
- Build a personal library of effective combinations

## Best Practices for Success

### Prompt Writing Guidelines

**Be Specific About Visuals**
- Use concrete nouns instead of abstract concepts
- Include color, lighting, and atmospheric details
- Specify camera angles and movements when relevant

**Structure Your Prompts Logically**
- Subject + Setting + Action + Style + Camera
- Example: "A red sports car (subject) on a mountain road (setting) driving through curves (action) in cinematic style (style) with a tracking shot (camera)"

**Use Effective Modifiers**
- **Lighting**: "golden hour", "dramatic shadows", "soft natural light"
- **Movement**: "slow motion", "time-lapse", "smooth tracking"
- **Style**: "photorealistic", "documentary style", "artistic interpretation"

### Technical Optimization

**Camera Movement Vocabulary**
- **Static shot**: No camera movement, fixed perspective
- **Slow zoom in/out**: Gradual focal length changes
- **Panning left/right**: Horizontal camera movement
- **Tilting up/down**: Vertical camera movement
- **Tracking shot**: Camera follows subject movement

**Lighting and Mood**
- **Golden hour**: Warm, soft lighting during sunrise/sunset
- **Blue hour**: Cool, ethereal lighting just after sunset
- **Dramatic lighting**: High contrast with strong shadows
- **Soft natural light**: Even, diffused illumination

### Building Your Prompt Library

**Category Organization**
- **Nature scenes**: Landscapes, weather, animals
- **Urban environments**: Cities, architecture, transportation  
- **People and portraits**: Characters, emotions, actions
- **Abstract concepts**: Artistic interpretations, surreal scenes

**Documentation Strategy**
- Save successful prompts with their settings
- Note which models work best for different types of content
- Track seed numbers for consistent results
- Record common issues and their solutions

## Common Challenges and Solutions

### Challenge 1: Inconsistent Results

**Problem**: Same prompt produces vastly different outputs
**Solutions**:
- Use seed values to maintain consistency across generations
- Be more specific in your prompt descriptions
- Try generating multiple versions and select the best one
- Consider using reference images for style consistency

### Challenge 2: Unclear or Unwanted Motion

**Problem**: Objects move in unexpected ways or motion looks unnatural
**Solutions**:
- Be explicit about movement in your prompts ("slow zoom in", "panning left")
- Use Motion Brush tool for precise movement control
- Try different prompt phrasings for the same concept
- Consider the natural physics of your scene

### Challenge 3: Quality and Detail Issues

**Problem**: Generated videos lack detail or appear blurry
**Solutions**:
- Ensure your prompts are detailed and well-structured
- Use higher resolution settings when available
- Try different style modifiers to enhance quality
- Consider breaking complex scenes into simpler components

### Challenge 4: Style Consistency Across Generations

**Problem**: Multiple videos for a project don't match visually
**Solutions**:
- Use the same seed value across related generations
- Maintain consistent prompt structure and modifiers
- Create a style guide document for your project
- Use reference images to maintain visual continuity

## Advanced Techniques Preview

As you become comfortable with basic generation, you'll want to explore more sophisticated approaches:

### Sequence Planning
- Breaking longer narratives into connected 4-second segments
- Maintaining character and style consistency across clips
- Planning transitions between generated segments

### Style Transfer Applications
- Using Gen-1 to transform existing footage
- Applying artistic styles to real-world videos
- Creating unique visual aesthetics for branded content

### Combining with Traditional Editing
- Integrating AI-generated clips with conventional footage
- Using AI for specific shots that would be expensive to film
- Enhancing practical effects with AI-generated elements

## Next Steps in Your Journey

In our upcoming lesson on "Text-to-Video Fundamentals," we'll dive deeper into prompt engineering techniques that will help you create more sophisticated and controlled AI videos. We'll explore:

- **Advanced prompt syntax** and modifiers
- **Combining multiple concepts** in single prompts  
- **Creating narrative sequences** from individual generations
- **Professional workflow** integration strategies

### Immediate Action Items

Before moving to the next lesson:

1. **Practice with 5 different prompts** using various styles and subjects
2. **Document your results** in a simple spreadsheet or notebook
3. **Experiment with different aspect ratios** for the same prompt
4. **Try both simple and complex descriptions** to see how detail affects output

### Building Your Skills

Remember that mastering AI video generation is an iterative process. Each generation teaches you something new about how the AI interprets language and creates visual content. The key is consistent practice combined with systematic experimentation.

Start building your prompt library today, and don't be afraid to try unconventional descriptions – some of the most creative results come from unexpected prompt combinations!

---

**Coming Up Next:** In "Text-to-Video Fundamentals," we'll explore advanced prompting strategies and learn how to create more complex, narrative-driven content that tells compelling visual stories.`,
      };
      // Placeholder for other lesson content if they are not provided by the backend
      // You would extend this map with content for other lesson IDs if needed.
      return contentMap[lessonId] || 'Содержимое урока не найдено.';
    },
    getLessonDescription(lessonId) {
      const descriptionMap = {
        3: "Изучите основы Runway ML, одной из самых мощных платформ для создания видео с искусственным интеллектом, доступных на сегодняшний день."
      };
      return descriptionMap[lessonId] || 'Описание урока не найдено.';
    },
    getLessonObjectives(lessonId) {
      const objectivesMap = {
        3: [
          "Понять интерфейс и навигацию Runway ML",
          "Изучить базовое создание видео из текста",
          "Исследовать различные доступные видеомодели",
          "Попрактиковаться в создании своего первого видео с ИИ"
        ]
      };
      return objectivesMap[lessonId] || [];
    },
    // This generates dummy lessons if no course lessons are provided
    generateSampleLessons() {
      return [
        {
          id: 1,
          title: "Введение в курс",
          readingTime: "8 мин чтения",
          completed: true,
          locked: false,
          type: "text"
        },
        {
          id: 2,
          title: "Понимание платформ AI-видео",
          readingTime: "12 мин чтения",
          completed: true,
          locked: false,
          type: "text"
        },
        {
          id: 3,
          title: "Runway ML: Начало работы",
          readingTime: "10 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 4,
          title: "Основы преобразования текста в видео",
          readingTime: "15 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 5,
          title: "Промпт-инжиниринг для видео",
          readingTime: "18 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 6,
          title: "Продвинутые техники Runway",
          readingTime: "20 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 7,
          title: "Midjourney для видеоактивов",
          readingTime: "16 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 8,
          title: "Стабильное видео-распространение",
          readingTime: "19 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 9,
          title: "Редактирование видео с помощью инструментов ИИ",
          readingTime: "22 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 10,
          title: "Комбинирование нескольких платформ",
          readingTime: "25 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 11,
          title: "Создание согласованных персонажей",
          readingTime: "21 мин чтения",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 12,
          title: "Рассказывание историй с AI-видео",
          readingTime: "23 мин чтения",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 13,
          title: "Коммерческие приложения",
          readingTime: "20 мин чтения",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 14,
          title: "Мастер-класс по финальному проекту",
          readingTime: "35 мин чтения",
          completed: false,
          locked: true,
          type: "workshop"
        }
      ];
    },
    goBackToCourses() {
      this.$emit('back-to-courses');
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    selectLesson(index) {
      if (this.lessons[index] && !this.lessons[index].locked) {
        this.currentLessonIndex = index;
        this.selectedAnswer = null;
        this.quizCompleted = false;
        this.quizCorrect = false;
        if (window.innerWidth < 1024) {
          this.sidebarOpen = false;
        }
      }
    },
    markLessonCompleted() {
      if (this.currentLesson) {
        this.currentLesson.completed = true; // Mark current lesson as completed
        const lessonInArray = this.lessons.find(l => l.id === this.currentLesson.id);
        if (lessonInArray) {
          lessonInArray.completed = true; // Also update in the lessons array
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
/* CSS Variables from globals.css */
:root {
  --font-size: 14px;
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: #030213;
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.0058 264.53);
  --secondary-foreground: #030213;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #030213;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --switch-background: #cbced4;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: #030213;
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
  --brand-purple: #8B5CF6;
  --brand-purple-dark: #7C3AED;
  --brand-purple-light: #A78BFA;
  --brand-purple-muted: rgba(139, 92, 246, 0.1);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
  --brand-purple: #A78BFA;
  --brand-purple-dark: #8B5CF6;
  --brand-purple-light: #C4B5FD;
  --brand-purple-muted: rgba(167, 139, 250, 0.1);
}

/* Utility Classes */
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.text-muted-foreground { color: var(--muted-foreground); }
.text-foreground { color: var(--foreground); }
.text-\[var\(--color-brand-purple\)\] { color: var(--brand-purple); }
.text-\[var\(--color-brand-purple-dark\)\] { color: var(--brand-purple-dark); }
.text-white { color: white; }
.bg-\[var\(--color-brand-purple\)\] { background-color: var(--brand-purple); }
.bg-\[var\(--color-brand-purple-dark\)\] { background-color: var(--brand-purple-dark); }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.from-\[var\(--color-brand-purple\)\] { --tw-gradient-from: var(--brand-purple); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(139, 92, 246, 0)); }
.to-\[var\(--color-brand-purple-dark\)\] { --tw-gradient-to: var(--brand-purple-dark); }
.from-\[var\(--color-brand-purple\)\] { background: linear-gradient(to right, var(--brand-purple), var(--brand-purple-light)); }
.to-\[var\(--color-brand-purple-light\)\] { background: linear-gradient(to right, var(--brand-purple), var(--brand-purple-light)); }
.bg-muted { background-color: var(--muted); }
.rounded-lg { border-radius: 0.5rem; }
.rounded-full { border-radius: 9999px; }
.w-8 { width: 2rem; }
.h-8 { height: 2rem; }
.w-10 { width: 2.5rem; }
.h-10 { height: 2.5rem; }
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
.w-4 { width: 1rem; }
.h-4 { height: 1rem; }
.w-3 { width: 0.75rem; }
.h-3 { height: 0.75rem; }
.w-2 { width: 0.5rem; }
.h-2 { height: 0.5rem; }
.w-1\.5 { width: 0.375rem; }
.h-1\.5 { height: 0.375rem; }
.w-full { width: 100%; }
.flex { display: flex; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-2\.5 { margin-top: 0.625rem; }
.p-4 { padding: 1rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.flex-shrink-0 { flex-shrink: 0; }
.flex-1 { flex: 1 1 0%; }
.min-w-0 { min-width: 0px; }
.leading-tight { line-height: 1.25; }
.border-2 { border-width: 2px; }
.border-\[var\(--color-brand-purple\)\] { border-color: var(--brand-purple); }
.border-muted-foreground { border-color: var(--muted-foreground); }

/* SUBSCRIPTION STATUS BADGE STYLES */
.subscription-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.subscription-badge.badge-free {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.subscription-badge.badge-start {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.subscription-badge.badge-pro {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

/* MODERN STUDY INTERFACE STYLES */
.study-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background);
  color: var(--foreground);
}

.study-header {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.study-header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 2rem;
  align-items: center;
}

@media (max-width: 768px) {
  .study-header-content {
    grid-template-columns: 1fr;
    gap: 1rem;
    text-align: center;
  }
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.back-button:hover {
  background: var(--muted);
  border-color: var(--brand-purple);
  color: var(--brand-purple);
}

.course-info {
  text-align: center;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--foreground);
}

.course-meta {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.course-category,
.course-level {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--brand-purple-muted);
  color: var(--brand-purple);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.progress-section {
  text-align: right;
}

.progress-info {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.progress-text {
  color: var(--muted-foreground);
}

.progress-percent {
  color: var(--brand-purple);
  font-weight: 600;
}

.progress-bar {
  height: 8px;
  background: var(--muted);
  border-radius: 4px;
  overflow: hidden;
  width: 200px;
  margin-left: auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-purple), var(--brand-purple-light));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.study-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--background);
}

/* MODERN SIDEBAR */
.study-sidebar {
  width: 320px;
  background: var(--card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

@media (max-width: 1023px) {
  .study-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 50;
    transform: translateX(-100%);
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.15);
  }

  .study-sidebar.sidebar-open {
    transform: translateX(0);
  }
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--card);
}

.sidebar-progress {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.lessons-list {
  flex: 1;
  overflow-y: auto;
}

.lesson-item-modern {
  position: relative;
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  border: 2px solid transparent;
}

.lesson-item-modern:hover {
  background: var(--muted);
  border-color: rgba(139, 92, 246, 0.2);
}

.lesson-item-modern.current {
  background: var(--brand-purple-muted);
  border-color: var(--brand-purple);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.lesson-item-modern.completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.lesson-item-modern.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.mobile-only {
  display: none;
}

@media (max-width: 1023px) {
  .mobile-only {
    display: block;
  }
}

.sidebar-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
}

/* MODERN CONTENT */
.study-content {
  flex: 1;
  overflow-y: auto;
  background: var(--card);
  position: relative;
}

.sidebar-toggle.desktop-hidden {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle.desktop-hidden:hover {
  background: var(--muted);
  border-color: var(--brand-purple);
  color: var(--brand-purple);
}

.lesson-container-modern {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 1023px) {
  .lesson-container-modern {
    padding: 5rem 1.5rem 2rem;
  }
}

/* MODERN LESSON HEADER */
.lesson-header-modern {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

/* LEARNING OBJECTIVES */
.learning-objectives-modern {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--brand-purple-muted);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* CONTENT */
.lesson-content-modern {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.content-prose {
  line-height: 1.7;
  font-size: 1rem;
  color: var(--foreground);
}

.content-prose h3 {
  color: var(--foreground);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 1rem 0;
}

.content-prose h4 {
  color: var(--foreground);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 1.25rem 0 0.75rem 0;
}

.content-prose p {
  margin: 0 0 1rem 0;
}

.content-prose ul,
.content-prose ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.content-prose li {
  margin: 0.5rem 0;
}

/* RESOURCES */
.resources-modern {
  background: var(--muted);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
}

.resources-modern h3 {
  margin: 0 0 1rem 0;
  color: var(--foreground);
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.resource-item-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--foreground);
  transition: all 0.2s ease;
}

.resource-item-modern:hover {
  background: var(--muted);
  border-color: var(--brand-purple);
  color: var(--brand-purple);
}

.resource-size {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  background: var(--muted);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* QUIZ */
.quiz-modern {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quiz-modern h3 {
  margin: 0 0 1.5rem 0;
  color: var(--foreground);
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.question-item-modern h4 {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
  color: var(--foreground);
  line-height: 1.5;
  padding: 1rem;
  background: var(--muted);
  border-radius: 8px;
}

.quiz-options-modern {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.quiz-option-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--card);
}

.quiz-option-modern:hover {
  background: var(--muted);
  border-color: var(--brand-purple);
}

.quiz-option-modern input[type="radio"] {
  margin: 0;
  width: 16px;
  height: 16px;
}

.quiz-option-modern span {
  flex: 1;
  color: var(--foreground);
  font-size: 0.875rem;
}

.quiz-submit-modern,
.retry-quiz-modern {
  display: block;
  margin: 1rem auto 0;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--brand-purple);
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quiz-submit-modern:hover,
.retry-quiz-modern:hover {
  background: var(--brand-purple-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.quiz-submit-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quiz-result-modern {
  text-align: center;
  padding: 1rem;
}

.quiz-feedback-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.quiz-feedback-modern.correct {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.quiz-feedback-modern.incorrect {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* NAVIGATION */
.lesson-navigation-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  border-top: 1px solid var(--border);
  margin-top: 2rem;
}

@media (max-width: 640px) {
  .lesson-navigation-modern {
    flex-direction: column;
    gap: 0.75rem;
  }
}

.nav-btn-modern {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;
}

.nav-btn-modern:hover:not(:disabled) {
  background: var(--muted);
  border-color: var(--brand-purple);
  color: var(--brand-purple);
}

.nav-btn-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.complete-btn-modern {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.complete-btn-modern:hover {
  background: #16a34a;
  color: white;
}

.next-btn {
  background: var(--brand-purple);
  color: white;
  border-color: var(--brand-purple);
}

.next-btn:hover:not(:disabled) {
  background: var(--brand-purple-dark);
  color: white;
}

@media (max-width: 640px) {
  .nav-btn-modern {
    width: 100%;
    justify-content: center;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .study-header-content {
    gap: 0.75rem;
  }

  .course-title {
    font-size: 1.125rem;
  }

  .progress-section {
    min-width: auto;
  }
}
/* Prose styles for markdown content */
.prose {
  color: var(--foreground);
  font-family: 'Inter', sans-serif; /* Assuming Inter font */
}
.prose h1 { font-size: 2.25em; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
.prose h2 { font-size: 1.8em; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
.prose h3 { font-size: 1.5em; margin-top: 1.2em; margin-bottom: 0.4em; font-weight: 600; }
.prose h4 { font-size: 1.25em; margin-top: 1em; margin-bottom: 0.3em; font-weight: 600; }
.prose p { margin-bottom: 1em; line-height: 1.6; }
.prose ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; }
.prose ol { list-style-type: decimal; margin-left: 1.5em; margin-bottom: 1em; }
.prose li { margin-bottom: 0.5em; }
.prose strong { font-weight: 700; }

.prose-gray {
  color: var(--foreground); /* Use foreground color */
}

/* Ensure consistent typography as defined in globals.css */
body {
  font-family: 'Inter', sans-serif; /* Or your preferred font */
}

h1 {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

h2 {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

h4 {
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

p {
  font-size: var(--text-base);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
}
</style>
