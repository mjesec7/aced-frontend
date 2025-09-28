<template>
  <div class="homework-page">
    <div class="back-button">
      <router-link to="/profile/homeworks" class="back-link">← Назад к списку</router-link>
    </div>
    
    <h1>{{ homeworkTitle }}</h1>

    <!-- Debug Info (visible in development) -->
    <div v-if="showDebug" class="debug-info">
      <h4>🔧 Debug Info:</h4>
      <div class="debug-grid">
        <div><strong>Route params:</strong> {{ JSON.stringify($route.params) }}</div>
        <div><strong>Query params:</strong> {{ JSON.stringify($route.query) }}</div>
        <div><strong>Detected ID:</strong> {{ primaryId }}</div>
        <div><strong>Detected Type:</strong> {{ computedHomeworkType }}</div>
        <div><strong>Is Standalone:</strong> {{ isStandalone }}</div>
        <div><strong>Questions Count:</strong> {{ questions.length }}</div>
        <div><strong>User Answers:</strong> {{ userAnswers.length }}</div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка задания...</p>
    </div>

    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <h3>{{ error }}</h3>
      <p v-if="errorDetails">{{ errorDetails }}</p>
      <div class="error-actions">
        <button @click="retryFetch" class="retry-btn">🔄 Попробовать снова</button>
        <router-link to="/profile/homeworks" class="error-button">Вернуться к списку</router-link>
      </div>
    </div>

    <div v-else-if="!primaryId" class="error">
      <div class="error-icon">⚠️</div>
      <h3>Ошибка загрузки</h3>
      <p>ID задания не найден. Пожалуйста, вернитесь к списку домашних заданий.</p>
      <router-link to="/profile/homeworks" class="error-button">Вернуться к списку</router-link>
    </div>

    <div v-else-if="questions.length === 0 && !loading" class="empty">
      <div class="empty-icon">📝</div>
      <h3>В этом задании нет вопросов</h3>
      <p>Обратитесь к преподавателю для получения дополнительной информации.</p>
      <router-link to="/profile/homeworks" class="empty-button">Вернуться к списку</router-link>
    </div>

    <div v-else-if="questions.length > 0">
      <!-- Instructions Section -->
      <div v-if="instructions" class="instructions-section">
        <h3>📋 Инструкции</h3>
        <div class="instructions-content">{{ instructions }}</div>
      </div>

      <!-- Homework Info -->
      <div class="homework-info">
        <div class="info-item">
          <span class="info-label">📝 Тип:</span>
          <span class="info-value">{{ isStandalone ? 'Отдельное задание' : 'Урок' }}</span>
        </div>
        <div v-if="questions.length > 0" class="info-item">
          <span class="info-label">❓ Вопросов:</span>
          <span class="info-value">{{ questions.length }}</span>
        </div>
        <div v-if="homeworkSubject" class="info-item">
          <span class="info-label">📚 Предмет:</span>
          <span class="info-value">{{ homeworkSubject }}</span>
        </div>
      </div>

      <form @submit.prevent="submitHomework">
        <div v-for="(q, i) in questions" :key="getQuestionKey(q, i)" class="question-block">
          <div class="question-header">
            <span class="question-number">{{ i + 1 }}</span>
            <div class="question-content">
              <p class="question-text"><strong>{{ getQuestionText(q) }}</strong></p>
              <div v-if="getQuestionInstruction(q)" class="question-instruction">
                <em>{{ getQuestionInstruction(q) }}</em>
              </div>
            </div>
          </div>

          <!-- Multiple Choice Questions -->
          <div v-if="isMultipleChoice(q)" class="options">
            <label v-for="(opt, j) in getQuestionOptions(q)" :key="j" class="option">
              <input
                type="radio"
                :name="'q' + i"
                :value="getOptionValue(opt)"
                v-model="userAnswers[i]"
                @change="onAnswerChange(i, getOptionValue(opt))"
              />
              <span class="option-text">{{ getOptionText(opt) }}</span>
            </label>
          </div>

          <!-- Text Input Questions -->
          <div v-else class="text-input">
            <textarea
              v-model="userAnswers[i]"
              @input="onAnswerChange(i, userAnswers[i])"
              :placeholder="'Введите ваш ответ на вопрос ' + (i + 1)"
              rows="3"
              class="answer-textarea"
            ></textarea>
          </div>

          <!-- Points Display -->
          <div v-if="getQuestionPoints(q)" class="question-points">
            <span class="points-badge">{{ getQuestionPoints(q) }} {{ getPointsText(getQuestionPoints(q)) }}</span>
          </div>
        </div>

        <div class="actions">
          <button type="button" @click="saveHomework" class="save-btn" :disabled="saving">
            <span v-if="saving">
              <div class="btn-spinner"></div>
              Сохранение...
            </span>
            <span v-else>💾 Сохранить</span>
          </button>
          <button type="submit" class="submit-btn" :disabled="submitting || !canSubmit">
            <span v-if="submitting">
              <div class="btn-spinner"></div>
              Отправка...
            </span>
            <span v-else>✅ Завершить</span>
          </button>
        </div>

        <!-- Progress Indicator -->
        <div class="progress-indicator">
          <div class="progress-text">
            Отвечено: {{ answeredQuestions }}/{{ questions.length }}
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { 
  getHomeworkByLesson, 
  getStandaloneHomework, 
  getLessonById,
  saveHomework as saveHomeworkAPI,
  submitHomework as submitHomeworkAPI,
  saveStandaloneHomework,
  submitStandaloneHomework
} from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'HomeworkPage',
  props: {
    homeworkId: {
      type: String,
      required: false,
      default: null
    },
    lessonId: {
      type: String,
      required: false,
      default: null
    },
    homeworkType: {
      type: String,
      required: false,
      default: null
    },
    title: {
      type: String,
      required: false,
      default: null
    },
    subject: {
      type: String,
      required: false,
      default: null
    }
  },
  
  data() {
    return {
      questions: [],
      homeworkTitle: 'Домашнее задание',
      homeworkSubject: '',
      instructions: '',
      userAnswers: [],
      loading: true,
      saving: false,
      submitting: false,
      error: null,
      errorDetails: null,
      isStandalone: false,
      detectedHomeworkType: null,
      showDebug: false,
      retryCount: 0,
    };
  },
  
  computed: {
    // ✅ FIXED: Enhanced ID extraction from route
    computedHomeworkId() {
      const sources = [
        { name: 'props.homeworkId', value: this.homeworkId },
        { name: 'route.params.homeworkId', value: this.$route.params.homeworkId },
        { name: 'route.params.id', value: this.$route.params.id },
        { name: 'route.query.homeworkId', value: this.$route.query.homeworkId },
        { name: 'url.path', value: this.extractIdFromPath() }
      ];
      
      for (const source of sources) {
        if (source.value && source.value !== 'null' && source.value !== 'undefined') {
          return source.value;
        }
      }
      
      return null;
    },
    
    computedLessonId() {
      const sources = [
        { name: 'props.lessonId', value: this.lessonId },
        { name: 'route.params.lessonId', value: this.$route.params.lessonId },
        { name: 'route.params.id', value: this.$route.params.id },
        { name: 'route.query.lessonId', value: this.$route.query.lessonId },
        { name: 'url.path', value: this.extractIdFromPath() }
      ];
      
      for (const source of sources) {
        if (source.value && source.value !== 'null' && source.value !== 'undefined') {
          return source.value;
        }
      }
      
      return null;
    },
    
    computedHomeworkType() {
      const sources = [
        { name: 'props.homeworkType', value: this.homeworkType },
        { name: 'route.query.type', value: this.$route.query.type },
        { name: 'route.query.homeworkType', value: this.$route.query.homeworkType },
        { name: 'detected', value: this.detectedHomeworkType },
        { name: 'url.path', value: this.extractTypeFromPath() }
      ];
      
      for (const source of sources) {
        if (source.value) {
          return source.value;
        }
      }
      
      return 'unknown';
    },
    
    primaryId() {
      const hwId = this.computedHomeworkId;
      const lessonId = this.computedLessonId;
      const type = this.computedHomeworkType;
      
      // Use type to determine priority
      if (type === 'standalone' && hwId) {
        return hwId;
      }
      
      if (type === 'lesson' && lessonId) {
        return lessonId;
      }
      
      // Prefer homework ID over lesson ID if type is unknown
      if (hwId) {
        return hwId;
      }
      
      if (lessonId) {
        return lessonId;
      }
      
      return null;
    },

    // ✅ NEW: Progress tracking
    answeredQuestions() {
      return this.userAnswers.filter(answer => answer && answer.toString().trim() !== '').length;
    },

    progressPercentage() {
      if (this.questions.length === 0) return 0;
      return Math.round((this.answeredQuestions / this.questions.length) * 100);
    },

    canSubmit() {
      return this.answeredQuestions === this.questions.length && !this.saving;
    }
  },
  
  methods: {
    // ✅ NEW: Extract ID from URL path as fallback
    extractIdFromPath() {
      const path = this.$route.path || window.location.pathname;
      const pathParts = path.split('/');
      
      // Look for MongoDB ObjectId pattern (24 hex characters)
      const mongoIdPattern = /^[a-f0-9]{24}$/i;
      const possibleId = pathParts.find(part => mongoIdPattern.test(part));
      
      return possibleId || null;
    },
    
    // ✅ NEW: Extract type from URL path
    extractTypeFromPath() {
      const path = this.$route.path || window.location.pathname;
      
      if (path.includes('/standalone/')) {
        return 'standalone';
      } else if (path.includes('/lesson/')) {
        return 'lesson';
      }
      
      return null;
    },

    // ✅ ENHANCED: Question helper methods for different data structures
    getQuestionKey(q, index) {
      return q._id || q.id || `q-${index}`;
    },

    getQuestionText(q) {
      return q.question || q.text || q.title || 'Вопрос не найден';
    },

    getQuestionInstruction(q) {
      return q.instruction || q.instructions || q.description || '';
    },

    getQuestionPoints(q) {
      return q.points || 1;
    },

    isMultipleChoice(q) {
      return q.type === 'abc' || 
             q.type === 'multiple-choice' || 
             (q.options && Array.isArray(q.options) && q.options.length > 0);
    },

    getQuestionOptions(q) {
      return q.options || [];
    },

    getOptionText(opt) {
      if (typeof opt === 'string') return opt;
      return opt.text || opt.label || opt.value || 'Вариант';
    },

    getOptionValue(opt) {
      if (typeof opt === 'string') return opt;
      return opt.value || opt.text || opt.label || opt;
    },

    onAnswerChange(index, value) {
      // Auto-save when user answers (debounced)
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = setTimeout(() => {
        if (this.answeredQuestions > 0) {
          this.autoSave();
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    },

    async autoSave() {
      if (!this.saving && this.answeredQuestions > 0) {
        try {
          await this.saveHomework(true); // Silent save
        } catch (error) {
          // Silent auto-save, don't show error
          console.warn('Auto-save failed:', error.message);
        }
      }
    },

    // ✅ ENHANCED: Homework fetching with comprehensive error handling
    async fetchHomework() {
      try {
        this.loading = true;
        this.error = null;
        this.errorDetails = null;
        
        const homeworkId = this.computedHomeworkId;
        const lessonId = this.computedLessonId;
        const primaryId = this.primaryId;
        const suggestedType = this.computedHomeworkType;
        
        console.log('🔍 Fetching homework:', {
          homeworkId,
          lessonId,
          primaryId,
          suggestedType,
          routeParams: this.$route.params,
          routeQuery: this.$route.query
        });
        
        if (!primaryId) {
          console.error('❌ No homework or lesson ID available');
          this.error = 'ID задания не найден';
          this.errorDetails = 'Проверьте ссылку и попробуйте снова';
          return;
        }
        
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Пользователь не авторизован');
        }
        
        const userId = user.uid;

        // ✅ STRATEGY 1: Try as standalone homework
        const shouldTryStandalone = suggestedType === 'standalone' || 
                                   !suggestedType || 
                                   suggestedType === 'unknown';
        
        if (shouldTryStandalone && primaryId) {
          try {
            console.log('🔄 Trying standalone homework approach...');
            
            const result = await getStandaloneHomework(userId, primaryId);
            
            if (result.success && result.data && result.data.homework) {
              const homeworkData = result.data.homework;
              const userProgress = result.data.userProgress;
              
              if (homeworkData && (homeworkData.exercises || homeworkData.title)) {
                this.isStandalone = true;
                this.detectedHomeworkType = 'standalone';
                this.homeworkTitle = homeworkData.title || this.title || 'Домашнее задание';
                this.homeworkSubject = homeworkData.subject || this.subject || '';
                this.instructions = homeworkData.instructions || '';
                this.questions = homeworkData.exercises || [];
                this.userAnswers = this.questions.map(() => '');

                // Load existing progress if available
                if (userProgress && userProgress.answers) {
                  this.loadUserAnswers(userProgress.answers);
                }
                
                console.log('✅ Successfully loaded standalone homework');
                return; // Success - exit early
              }
            }
          } catch (homeworkError) {
            console.warn('⚠️ Standalone homework approach failed:', homeworkError.message);
            
            // Check if it's a 404 (homework not found) vs server error
            if (homeworkError.response?.status !== 404 && homeworkError.response?.status >= 500) {
              // For server errors, don't continue to lesson approach
              this.error = 'Ошибка сервера при загрузке задания';
              this.errorDetails = homeworkError.message;
              return;
            }
          }
        }

        // ✅ STRATEGY 2: Try as lesson homework
        try {
          console.log('🔄 Trying lesson homework approach...');
          
          const result = await getHomeworkByLesson(userId, primaryId);
          
          if (result.success && result.data) {
            const lessonInfo = result.data.lessonInfo;
            const questions = result.data.questions;
            const homework = result.data.homework;
            
            if (!questions || !Array.isArray(questions) || questions.length === 0) {
              console.warn('⚠️ No homework questions found in lesson');
              this.error = 'В этом уроке нет домашнего задания';
              this.errorDetails = 'Возможно, задание еще не было создано';
              return;
            }
            
            this.isStandalone = false;
            this.detectedHomeworkType = 'lesson';
            this.homeworkTitle = lessonInfo?.name || `Домашнее задание: ${this.title || 'Урок'}`;
            this.homeworkSubject = lessonInfo?.subject || this.subject || '';
            this.instructions = lessonInfo?.instructions || '';
            this.questions = questions;
            this.userAnswers = this.questions.map(() => '');

            // Load user's progress if available
            if (homework && homework.answers) {
              this.loadUserAnswers(homework.answers);
            }

            console.log('✅ Successfully loaded lesson homework');
            return; // Success
          }
          
        } catch (lessonError) {
          console.error('❌ Lesson homework approach also failed:', lessonError);
          
          // Set appropriate error message
          if (lessonError.response?.status === 404) {
            if (suggestedType === 'standalone') {
              this.error = 'Домашнее задание не найдено';
              this.errorDetails = 'Возможно, оно было удалено или еще не создано';
            } else {
              this.error = 'Урок или домашнее задание не найдено';
              this.errorDetails = 'Проверьте правильность ссылки';
            }
          } else if (lessonError.response?.status >= 500) {
            this.error = 'Ошибка сервера при загрузке урока';
            this.errorDetails = 'Попробуйте обновить страницу через несколько минут';
          } else {
            this.error = 'Ошибка загрузки домашнего задания';
            this.errorDetails = lessonError.message || 'Неизвестная ошибка';
          }
        }

      } catch (err) {
        console.error('❌ General error loading homework:', err);
        this.error = 'Ошибка загрузки домашнего задания';
        this.errorDetails = err.message || 'Попробуйте обновить страницу';
        
        this.$toast?.error('Ошибка загрузки домашнего задания');
      } finally {
        this.loading = false;
      }
    },

    // ✅ ENHANCED: Load user answers with better handling
    loadUserAnswers(answers) {
      console.log('📝 Loading user answers:', answers);
      
      if (Array.isArray(answers)) {
        // Answers is an array of objects with questionIndex and answer
        for (const entry of answers) {
          if (entry.questionIndex !== undefined && 
              entry.questionIndex >= 0 && 
              entry.questionIndex < this.userAnswers.length) {
            this.userAnswers[entry.questionIndex] = entry.userAnswer || entry.answer || '';
          }
        }
      } else if (typeof answers === 'object') {
        // Answers is an object with questionIndex as keys
        Object.entries(answers).forEach(([index, answer]) => {
          const idx = parseInt(index);
          if (!isNaN(idx) && idx >= 0 && idx < this.userAnswers.length) {
            this.userAnswers[idx] = answer?.userAnswer || answer?.answer || answer || '';
          }
        });
      }
      
      console.log('✅ Loaded answers:', this.userAnswers);
    },

    // ✅ ENHANCED: Save homework with better error handling
    async saveHomework(silent = false) {
      try {
        this.saving = true;
        
        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        
        const userId = user.uid;

        const answers = this.userAnswers.map((ans, i) => ({
          questionIndex: i,
          userAnswer: ans || '',
          answer: ans || ''
        }));

        console.log('💾 Saving homework:', {
          userId,
          primaryId: this.primaryId,
          isStandalone: this.isStandalone,
          answerCount: answers.length
        });
        
        let result;
        
        if (this.isStandalone) {
          // Save standalone homework
          result = await saveStandaloneHomework(userId, this.primaryId, answers);
        } else {
          // Save lesson homework
          result = await saveHomeworkAPI(userId, this.primaryId, answers);
        }

        if (!silent) {
          this.$toast?.success('Ответы сохранены!');
        }
        
        console.log('✅ Homework saved successfully');
        
      } catch (err) {
        console.error('❌ Error saving homework:', err);
        
        if (!silent) {
          let errorMessage = 'Не удалось сохранить ответы';
          
          if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
          } else if (err.response?.data?.details) {
            errorMessage = err.response.data.details;
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          this.$toast?.error(errorMessage);
        }
        
        throw err; // Re-throw for caller to handle
      } finally {
        this.saving = false;
      }
    },

    // ✅ ENHANCED: Submit homework with comprehensive validation and feedback
    async submitHomework() {
      try {
        this.submitting = true;
        
        // Validate all questions are answered
        const unansweredQuestions = this.userAnswers.filter(ans => !ans || ans.toString().trim() === '');
        if (unansweredQuestions.length > 0) {
          this.$toast?.warning(`Пожалуйста, ответьте на все вопросы. Осталось: ${unansweredQuestions.length}`);
          return;
        }

        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        
        const userId = user.uid;

        const answers = this.userAnswers.map((ans, i) => ({
          questionIndex: i,
          userAnswer: ans || '',
          answer: ans || ''
        }));

        console.log('📤 Submitting homework:', {
          userId,
          primaryId: this.primaryId,
          isStandalone: this.isStandalone,
          answerCount: answers.length
        });

        let result;
        
        if (this.isStandalone) {
          // Submit standalone homework
          result = await submitStandaloneHomework(userId, this.primaryId, answers);
        } else {
          // Submit lesson homework
          result = await submitHomeworkAPI(userId, this.primaryId, answers);
        }

        console.log('✅ Homework submitted successfully:', result);

        const responseData = result.data?.data || result.data || result;
        const score = responseData?.score || 0;
        const stars = responseData?.stars || 0;
        const correctAnswers = responseData?.correctAnswers || 0;
        const totalQuestions = responseData?.totalQuestions || this.questions.length;
        
        // Enhanced success message
        let successMessage = `🎉 Домашнее задание завершено!\n`;
        successMessage += `📊 Ваша оценка: ${score}%`;
        
        if (stars > 0) {
          successMessage += `\n⭐ Звёзды: ${'⭐'.repeat(stars)}`;
        }
        
        if (correctAnswers > 0) {
          successMessage += `\n✅ Правильных ответов: ${correctAnswers}/${totalQuestions}`;
        }
        
        // Show detailed results
        this.$toast?.success(successMessage);
        
        // Wait a bit before redirecting to let user see the success message
        setTimeout(() => {
          this.$router.push('/profile/homeworks');
        }, 3000);
        
      } catch (err) {
        console.error('❌ Error submitting homework:', err);
        
        // ✅ ENHANCED: Better error handling with specific messages
        let errorMessage = 'Ошибка отправки ответов';
        
        if (err.response?.status === 404) {
          errorMessage = 'Задание не найдено. Возможно, оно было удалено.';
        } else if (err.response?.status === 403) {
          errorMessage = 'Доступ запрещен. Проверьте права доступа.';
        } else if (err.response?.status === 400) {
          errorMessage = 'Некорректные данные. Проверьте ответы.';
        } else if (err.response?.status >= 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.';
        } else if (err.response?.data?.details) {
          errorMessage = `Ошибка: ${err.response.data.details}`;
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.$toast?.error(errorMessage);
      } finally {
        this.submitting = false;
      }
    },

    // ✅ NEW: Retry fetch functionality
    async retryFetch() {
      this.retryCount++;
      console.log(`🔄 Retrying fetch (attempt ${this.retryCount})`);
      await this.fetchHomework();
    },

    getPointsText(points) {
      if (points === 1) return 'балл';
      if (points >= 2 && points <= 4) return 'балла';
      return 'баллов';
    }
  },
  
  created() {
    console.group('🎯 HomeworkPage Created');
    console.log('Route params:', this.$route.params);
    console.log('Route query:', this.$route.query);
    console.log('Props:', { 
      homeworkId: this.homeworkId, 
      lessonId: this.lessonId, 
      homeworkType: this.homeworkType 
    });
    console.groupEnd();
    
    // Enable debug mode in development or with debug query param
    this.showDebug = process.env.NODE_ENV === 'development' || this.$route.query.debug === 'true';
  },

  async mounted() {
    if (this.primaryId) {
      await this.fetchHomework();
    } else {
      console.error('❌ No homework or lesson ID available on mount');
      this.loading = false;
      this.error = 'ID задания не найден';
      this.errorDetails = 'Проверьте правильность ссылки';
    }
  },

  beforeUnmount() {
    // Clear auto-save timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  },

  watch: {
    '$route'(to, from) {
      console.log('🔄 Route changed:', { from: from.params, to: to.params });
      if (to.params !== from.params && this.primaryId) {
        this.fetchHomework();
      }
    },

    // Watch for answer changes and update progress
    userAnswers: {
      handler() {
        // Update progress when answers change
        this.$nextTick(() => {
          // Force reactivity update
        });
      },
      deep: true
    }
  }
};
</script>

<style scoped>
.homework-page {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  background: linear-gradient(to bottom right, #f0f4ff, #ffffff);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.back-button {
  margin-bottom: 1.5rem;
}

.back-link {
  color: #6a5acd;
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #5848c2;
}

h1 {
  color: #2d3748;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 700;
}

/* ✅ ENHANCED DEBUG STYLES */
.debug-info {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.debug-info h4 {
  color: #60a5fa;
  margin: 0 0 0.75rem 0;
}

.debug-grid {
  display: grid;
  gap: 0.5rem;
}

.debug-grid > div {
  background: #374151;
  padding: 0.5rem;
  border-radius: 4px;
}

/* ✅ NEW HOMEWORK INFO SECTION */
.homework-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-weight: 600;
  color: #4a5568;
}

.info-value {
  color: #2d3748;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6a5acd;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #6a5acd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty,
.error {
  text-align: center;
  font-size: 1.3rem;
  color: #6a5acd;
  margin-top: 3rem;
}

.error {
  color: #ef4444;
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error h3,
.empty h3 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.error p,
.empty p {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-button,
.empty-button,
.retry-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.error-button,
.empty-button {
  background: #6a5acd;
  color: white;
}

.error-button:hover,
.empty-button:hover {
  background: #5848c2;
}

.retry-btn {
  background: #10b981;
  color: white;
}

.retry-btn:hover {
  background: #059669;
}

.instructions-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.instructions-section h3 {
  color: #374151;
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.instructions-content {
  color: #4a5568;
  line-height: 1.6;
  font-size: 1rem;
}

.question-block {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.1);
  margin-bottom: 2rem;
  transition: transform 0.2s ease;
}

.question-block:hover {
  transform: scale(1.01);
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.question-number {
  background: #6a5acd;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.question-content {
  flex: 1;
}

.question-text {
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
  color: #333;
  line-height: 1.4;
}

.question-instruction {
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.option {
  background: #f9f9ff;
  padding: 0.8rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.option:hover {
  background: #ececff;
  border-color: #c7d2fe;
}

.option input[type="radio"]:checked + .option-text {
  font-weight: 600;
  color: #6a5acd;
}

.option input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: #374151;
}

.text-input {
  margin-bottom: 1rem;
}

.answer-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.3s ease;
}

.answer-textarea:focus {
  outline: none;
  border-color: #6a5acd;
  box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
}

.question-points {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.points-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* ✅ ENHANCED PROGRESS INDICATOR */
.progress-indicator {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1.5rem;
}

.progress-text {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6a5acd, #5848c2);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease-in-out;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.save-btn {
  background-color: #e2e8f0;
  color: #4a5568;
  border: 2px solid #cbd5e0;
}

.save-btn:hover:not(:disabled) {
  background-color: #cbd5e0;
  transform: translateY(-1px);
}

.submit-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* ✅ BUTTON SPINNER */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

/* ✅ RESPONSIVE DESIGN */
@media (max-width: 768px) {
  .homework-page {
    padding: 1rem;
  }
  
  .debug-grid {
    grid-template-columns: 1fr;
  }
  
  .homework-info {
    grid-template-columns: 1fr;
  }
  
  .question-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .question-number {
    align-self: flex-start;
  }
  
  .actions {
    justify-content: stretch;
    flex-direction: column;
  }
  
  button {
    width: 100%;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-button,
  .empty-button,
  .retry-btn {
    width: 100%;
    max-width: 300px;
  }
}

/* ✅ ENHANCED ANIMATIONS */
.question-block {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ✅ FOCUS STATES FOR ACCESSIBILITY */
.option:focus-within {
  outline: 2px solid #6a5acd;
  outline-offset: 2px;
}

button:focus {
  outline: 2px solid #6a5acd;
  outline-offset: 2px;
}

.answer-textarea:focus {
  border-color: #6a5acd;
  box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
}

/* ✅ ENHANCED VISUAL FEEDBACK */
.option input[type="radio"]:checked {
  accent-color: #6a5acd;
}

.option:has(input[type="radio"]:checked) {
  background: #ede9fe;
  border-color: #6a5acd;
  box-shadow: 0 0 0 1px rgba(106, 90, 205, 0.2);
}

/* ✅ LOADING STATES */
.submit-btn.submitting {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.save-btn.saving {
  background-color: #9ca3af;
  color: #6b7280;
}
</style>