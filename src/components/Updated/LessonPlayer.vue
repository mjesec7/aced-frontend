<template>
  <div class="study-page">
    <!-- Modern Header -->
    <header class="study-header">
      <div class="study-header-content">
        <button @click="goBackToCourses" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span>Назад к курсам</span>
        </button>

        <div class="course-info">
          <h1 class="course-title">{{ course?.title || 'Загрузка...' }}</h1>
          <div class="course-meta">
            <span class="course-category">{{ course?.category }}</span>
            <span class="course-level">{{ course?.level }}</span>
          </div>
        </div>

        <div class="header-right">
          <span class="subscription-badge" :class="subscriptionClass">
            {{ subscriptionText }}
          </span>
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
      </div>
    </header>

    <div class="study-main">
      <!-- Modern Sidebar -->
      <aside class="study-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="sidebar-title-section">
            <div class="sidebar-icon">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13.431m0 0a2.768 2.768 0 01-1.378-2.348v-2.185m1.378 2.348A2.768 2.768 0 0013.378 17.5v-2.185m-1.378 2.348a2.768 2.768 0 01-1.378-2.348v-2.185m1.378 2.348A2.768 2.768 0 0013.378 17.5v-2.185"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              </svg>
            </div>
            <div class="sidebar-title-content">
              <h3 class="sidebar-title">{{ course?.title || 'Курс' }}</h3>
              <p class="sidebar-subtitle">Полный курс</p>
            </div>
          </div>
          <button @click="toggleSidebar" class="sidebar-close mobile-only">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <!-- Sidebar Progress -->
        <div class="sidebar-progress">
          <div class="progress-header">
            <span class="progress-label">Прогресс</span>
            <span class="progress-count">{{ completedLessons }}/{{ totalLessons }} Завершено</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>

        <!-- Lessons List -->
        <div class="lessons-container">
          <div class="lessons-list">
            <div
              v-for="(lesson, index) in lessons"
              :key="lesson.id"
              @click="selectLesson(index)"
              :class="[
                'lesson-item',
                {
                  'lesson-current': currentLessonIndex === index,
                  'lesson-completed': lesson.completed,
                  'lesson-locked': lesson.locked
                }
              ]"
            >
              <div class="lesson-content">
                <div class="lesson-status">
                  <!-- Completed Icon -->
                  <svg v-if="lesson.completed" class="status-icon completed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <!-- Locked Icon -->
                  <svg v-else-if="lesson.locked" class="status-icon locked" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zm0-11V9a3 3 0 016 0v2"></path>
                  </svg>
                  <!-- Current Lesson -->
                  <div v-else-if="currentLessonIndex === index" class="status-icon current">
                    <div class="current-dot"></div>
                  </div>
                  <!-- Default -->
                  <div v-else class="status-icon default"></div>
                </div>

                <div class="lesson-details">
                  <div class="lesson-header">
                    <span class="lesson-number">{{ String(index + 1).padStart(2, '0') }}</span>
                    <span v-if="currentLessonIndex === index" class="current-badge">Текущий</span>
                  </div>
                  <h3 class="lesson-title" :class="{ 'current-title': currentLessonIndex === index }">
                    {{ lesson.title }}
                  </h3>
                  <div class="lesson-meta">
                    <svg class="time-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="reading-time">{{ lesson.readingTime }}</span>
                    <span v-if="lesson.type === 'workshop'" class="workshop-badge">Практика</span>
                  </div>
                </div>

                <svg v-if="!lesson.locked" class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="study-content">
        <!-- Mobile Menu Toggle -->
        <button @click="toggleSidebar" class="mobile-menu-toggle desktop-hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span>Содержание</span>
        </button>

        <div v-if="currentLesson" class="content-container">
          <!-- Lesson Header -->
          <div class="lesson-header-section">
            <div class="lesson-title-row">
              <div class="lesson-icon">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="lesson-title-content">
                <h1 class="main-lesson-title">{{ currentLesson.title }}</h1>
                <div class="lesson-meta-info">
                  <span class="meta-item">
                    <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ currentLesson.readingTime }}
                  </span>
                  <span class="meta-item">Урок {{ currentLessonIndex + 1 }} из {{ totalLessons }}</span>
                </div>
              </div>
            </div>
            <p v-if="currentLesson.description" class="lesson-description">{{ currentLesson.description }}</p>
          </div>

          <!-- Learning Objectives -->
          <div v-if="currentLesson.objectives && currentLesson.objectives.length" class="objectives-section">
            <h2 class="objectives-title">Цели урока</h2>
            <ul class="objectives-list">
              <li v-for="(objective, index) in currentLesson.objectives" :key="index" class="objective-item">
                <div class="objective-dot"></div>
                <span class="objective-text">{{ objective }}</span>
              </li>
            </ul>
          </div>

          <!-- Lesson Content -->
          <div class="lesson-content">
            <div class="content-prose" v-html="currentLesson.content"></div>
            
            <!-- Resources Section -->
            <div v-if="currentLesson.resources && currentLesson.resources.length" class="resources-section">
              <h3 class="section-title">Материалы урока</h3>
              <div class="resources-grid">
                <a
                  v-for="resource in currentLesson.resources"
                  :key="resource.id"
                  :href="resource.url"
                  download
                  class="resource-item"
                >
                  <svg class="resource-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
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
              <h3 class="section-title">Проверьте себя</h3>
              <div class="quiz-container">
                <div v-if="!quizCompleted" class="quiz-questions">
                  <div class="question-card">
                    <h4 class="question-text">{{ currentLesson.quiz.question }}</h4>
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
                          class="quiz-radio"
                        />
                        <span class="option-text">{{ option }}</span>
                      </label>
                    </div>
                    <button
                      @click="submitQuiz"
                      :disabled="selectedAnswer === null"
                      class="quiz-submit-btn"
                    >
                      Проверить ответ
                    </button>
                  </div>
                </div>
                <div v-else class="quiz-result">
                  <div class="quiz-feedback" :class="{ 'correct': quizCorrect, 'incorrect': !quizCorrect }">
                    <svg v-if="quizCorrect" class="feedback-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 1 1-5.93-8.08"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 4L12 14.01l-3-3"/>
                    </svg>
                    <svg v-else class="feedback-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span class="feedback-text">
                      {{ quizCorrect ? 'Правильно! Отличная работа!' : 'Неправильно. Попробуйте еще раз!' }}
                    </span>
                  </div>
                  <button v-if="!quizCorrect" @click="quizCompleted = false" class="retry-btn">
                    Попробовать снова
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
              <svg class="nav-icon prev-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
              Предыдущий урок
            </button>
            
            <button
              v-if="currentLesson && !currentLesson.completed && (!currentLesson.quiz || (currentLesson.quiz && quizCorrect))"
              @click="markLessonCompleted"
              class="nav-btn complete-btn"
            >
              Завершить урок
            </button>
            
            <button
              @click="nextLesson"
              :disabled="currentLessonIndex === lessons.length - 1 || (lessons[currentLessonIndex + 1] && lessons[currentLessonIndex + 1].locked)"
              class="nav-btn next-btn"
            >
              Следующий урок
              <svg class="nav-icon next-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div v-if="sidebarOpen" @click="toggleSidebar" class="mobile-overlay"></div>
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
      sidebarOpen: false,
      selectedAnswer: null,
      quizCompleted: false,
      quizCorrect: false,
      componentKey: 0,
    };
  },

  computed: {
    subscriptionClass() {
      const status = this.course?.subscriptionPlan || 'free';
      if (status === 'pro') return 'badge-pro';
      if (status === 'start') return 'badge-start';
      return 'badge-free';
    },
    subscriptionText() {
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

    generateSampleLessons() {
      return [
        {
          id: 1,
          title: "Введение в создание AI-видео",
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
* {
  box-sizing: border-box;
}

.lesson-player {
  height: 100vh;
  background: #ffffff;
  display: flex;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Sidebar */
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

.lesson-arrow {
  flex-shrink: 0;
  color: #717182;
}

/* Main Content */
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

/* Mobile Styles */
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
  
  .nav-btn {
    width: 100%;
    justify-content: center;
  }
  
  .lessons-list {
    max-height: 200px;
    overflow-y: auto;
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
}

/* Scrollbar Styling */
.lessons-list::-webkit-scrollbar {
  width: 6px;
}

.lessons-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.lessons-list::-webkit-scrollbar-thumb {
  background: #8B5CF6;
  border-radius: 3px;
}

.lessons-list::-webkit-scrollbar-thumb:hover {
  background: #7C3AED;
}

.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb {
  background: #8B5CF6;
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #7C3AED;
}
</style>