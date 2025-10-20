<template>
  <div class="homework-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <router-link to="/profile/homeworks" class="back-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Назад
        </router-link>
        <div class="header-info">
          <h1 class="page-title">{{ homeworkTitle }}</h1>
          <p v-if="homeworkSubject" class="subject-text">{{ homeworkSubject }}</p>
        </div>
      </div>
    </div>

    <!-- Debug Info (development only) -->
    <div v-if="showDebug" class="debug-section">
      <h4>🔧 Debug Info</h4>
      <div class="debug-grid">
        <div><strong>Route params:</strong> {{ JSON.stringify($route.params) }}</div>
        <div><strong>Query params:</strong> {{ JSON.stringify($route.query) }}</div>
        <div><strong>Detected ID:</strong> {{ primaryId }}</div>
        <div><strong>Detected Type:</strong> {{ computedHomeworkType }}</div>
        <div><strong>Is Standalone:</strong> {{ isStandalone }}</div>
        <div><strong>Questions:</strong> {{ questions.length }}</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка задания...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>{{ error }}</h3>
      <p v-if="errorDetails">{{ errorDetails }}</p>
      <div class="error-actions">
        <button @click="retryFetch" class="action-button secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Попробовать снова
        </button>
        <router-link to="/profile/homeworks" class="action-button primary">
          Вернуться к списку
        </router-link>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="questions.length === 0 && !loading" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <h3>В этом задании нет вопросов</h3>
      <p>Обратитесь к преподавателю для получения дополнительной информации</p>
      <router-link to="/profile/homeworks" class="action-button primary">
        Вернуться к списку
      </router-link>
    </div>

    <!-- Main Content -->
    <div v-else class="content-container">
      <!-- Instructions -->
      <div v-if="instructions" class="instructions-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <h3>Инструкции</h3>
        </div>
        <p class="instructions-text">{{ instructions }}</p>
      </div>

      <!-- Homework Info Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Тип задания</div>
            <div class="stat-value">{{ isStandalone ? 'Отдельное' : 'Урок' }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Всего вопросов</div>
            <div class="stat-value">{{ questions.length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Отвечено</div>
            <div class="stat-value">{{ answeredQuestions }}/{{ questions.length }}</div>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-card">
        <div class="progress-header">
          <span class="progress-label">Прогресс выполнения</span>
          <span class="progress-percentage">{{ progressPercentage }}%</span>
        </div>
        <div class="progress-bar-container">
          <div 
            class="progress-bar-fill"
            :style="{ width: progressPercentage + '%' }"
            :class="{ complete: progressPercentage === 100 }"
          ></div>
        </div>
      </div>

      <!-- Questions Form -->
      <form @submit.prevent="submitHomework" class="questions-form">
        <div 
          v-for="(q, i) in questions" 
          :key="getQuestionKey(q, i)" 
          class="question-card"
        >
          <div class="question-header">
            <div class="question-number">{{ i + 1 }}</div>
            <div class="question-content">
              <h4 class="question-text">{{ getQuestionText(q) }}</h4>
              <p v-if="getQuestionInstruction(q)" class="question-instruction">
                {{ getQuestionInstruction(q) }}
              </p>
            </div>
            <div v-if="getQuestionPoints(q) > 1" class="points-badge">
              {{ getQuestionPoints(q) }} {{ getPointsText(getQuestionPoints(q)) }}
            </div>
          </div>

          <!-- Multiple Choice Questions -->
          <div v-if="isMultipleChoice(q)" class="options-list">
            <label 
              v-for="(opt, j) in getQuestionOptions(q)" 
              :key="j" 
              class="option-item"
              :class="{ selected: userAnswers[i] === getOptionValue(opt) }"
            >
              <input
                type="radio"
                :name="'q' + i"
                :value="getOptionValue(opt)"
                v-model="userAnswers[i]"
                @change="onAnswerChange(i, getOptionValue(opt))"
                class="option-radio"
              />
              <div class="option-content">
                <div class="option-indicator"></div>
                <span class="option-text">{{ getOptionText(opt) }}</span>
              </div>
            </label>
          </div>

          <!-- Text Input Questions -->
          <div v-else class="text-answer">
            <textarea
              v-model="userAnswers[i]"
              @input="onAnswerChange(i, userAnswers[i])"
              :placeholder="'Введите ваш ответ на вопрос ' + (i + 1)"
              rows="4"
              class="answer-textarea"
            ></textarea>
            <div class="answer-meta">
              <svg v-if="userAnswers[i]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span v-if="userAnswers[i]">Ответ добавлен</span>
              <span v-else>Ожидает ответа</span>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            @click="saveHomework" 
            class="action-button secondary"
            :disabled="saving || answeredQuestions === 0"
          >
            <span v-if="saving" class="button-content">
              <div class="button-spinner"></div>
              Сохранение...
            </span>
            <span v-else class="button-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Сохранить черновик
            </span>
          </button>
          <button 
            type="submit" 
            class="action-button primary"
            :disabled="submitting || !canSubmit"
          >
            <span v-if="submitting" class="button-content">
              <div class="button-spinner"></div>
              Отправка...
            </span>
            <span v-else class="button-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Завершить задание
            </span>
          </button>
        </div>

        <!-- Helper Text -->
        <div class="helper-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span v-if="canSubmit">Все вопросы отвечены! Вы можете завершить задание.</span>
          <span v-else>Ответьте на все вопросы, чтобы завершить задание.</span>
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
      
      if (type === 'standalone' && hwId) {
        return hwId;
      }
      
      if (type === 'lesson' && lessonId) {
        return lessonId;
      }
      
      if (hwId) {
        return hwId;
      }
      
      if (lessonId) {
        return lessonId;
      }
      
      return null;
    },

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
    extractIdFromPath() {
      const path = this.$route.path || window.location.pathname;
      const pathParts = path.split('/');
      const mongoIdPattern = /^[a-f0-9]{24}$/i;
      const possibleId = pathParts.find(part => mongoIdPattern.test(part));
      return possibleId || null;
    },
    
    extractTypeFromPath() {
      const path = this.$route.path || window.location.pathname;
      
      if (path.includes('/standalone/')) {
        return 'standalone';
      } else if (path.includes('/lesson/')) {
        return 'lesson';
      }
      
      return null;
    },

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
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = setTimeout(() => {
        if (this.answeredQuestions > 0) {
          this.autoSave();
        }
      }, 2000);
    },

    async autoSave() {
      if (!this.saving && this.answeredQuestions > 0) {
        try {
          await this.saveHomework(true);
        } catch (error) {
          console.warn('Auto-save failed:', error.message);
        }
      }
    },

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
          suggestedType
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

                if (userProgress && userProgress.answers) {
                  this.loadUserAnswers(userProgress.answers);
                }
                
                console.log('✅ Successfully loaded standalone homework');
                return;
              }
            }
          } catch (homeworkError) {
            console.warn('⚠️ Standalone homework approach failed:', homeworkError.message);
            
            if (homeworkError.response?.status !== 404 && homeworkError.response?.status >= 500) {
              this.error = 'Ошибка сервера при загрузке задания';
              this.errorDetails = homeworkError.message;
              return;
            }
          }
        }

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

            if (homework && homework.answers) {
              this.loadUserAnswers(homework.answers);
            }

            console.log('✅ Successfully loaded lesson homework');
            return;
          }
          
        } catch (lessonError) {
          console.error('❌ Lesson homework approach also failed:', lessonError);
          
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

    loadUserAnswers(answers) {
      console.log('📝 Loading user answers:', answers);
      
      if (Array.isArray(answers)) {
        for (const entry of answers) {
          if (entry.questionIndex !== undefined && 
              entry.questionIndex >= 0 && 
              entry.questionIndex < this.userAnswers.length) {
            this.userAnswers[entry.questionIndex] = entry.userAnswer || entry.answer || '';
          }
        }
      } else if (typeof answers === 'object') {
        Object.entries(answers).forEach(([index, answer]) => {
          const idx = parseInt(index);
          if (!isNaN(idx) && idx >= 0 && idx < this.userAnswers.length) {
            this.userAnswers[idx] = answer?.userAnswer || answer?.answer || answer || '';
          }
        });
      }
      
      console.log('✅ Loaded answers:', this.userAnswers);
    },

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
          result = await saveStandaloneHomework(userId, this.primaryId, answers);
        } else {
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
        
        throw err;
      } finally {
        this.saving = false;
      }
    },

    async submitHomework() {
      try {
        this.submitting = true;
        
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
          result = await submitStandaloneHomework(userId, this.primaryId, answers);
        } else {
          result = await submitHomeworkAPI(userId, this.primaryId, answers);
        }

        console.log('✅ Homework submitted successfully:', result);

        const responseData = result.data?.data || result.data || result;
        const score = responseData?.score || 0;
        const stars = responseData?.stars || 0;
        const correctAnswers = responseData?.correctAnswers || 0;
        const totalQuestions = responseData?.totalQuestions || this.questions.length;
        
        let successMessage = `🎉 Домашнее задание завершено!\n`;
        successMessage += `📊 Ваша оценка: ${score}%`;
        
        if (stars > 0) {
          successMessage += `\n⭐ Звёзды: ${'⭐'.repeat(stars)}`;
        }
        
        if (correctAnswers > 0) {
          successMessage += `\n✅ Правильных ответов: ${correctAnswers}/${totalQuestions}`;
        }
        
        this.$toast?.success(successMessage);
        
        setTimeout(() => {
          this.$router.push('/profile/homeworks');
        }, 3000);
        
      } catch (err) {
        console.error('❌ Error submitting homework:', err);
        
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

    userAnswers: {
      handler() {
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
/* GENERAL STYLES */
.homework-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 1.5rem;
}

/* HEADER */
.page-header {
  max-width: 900px;
  margin: 0 auto 2rem;
}

.header-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  padding: 0.625rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  text-decoration: none;
  font-size: 0.875rem;
}

.back-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.back-button svg {
  width: 1rem;
  height: 1rem;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.subject-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

/* DEBUG SECTION */
.debug-section {
  max-width: 900px;
  margin: 0 auto 2rem;
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 12px;
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
}

.debug-section h4 {
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
  border-radius: 6px;
}

/* LOADING STATE */
.loading-state {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  margin: 0;
}

/* ERROR & EMPTY STATES */
.error-state,
.empty-state {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.error-icon,
.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #ef4444;
  margin: 0 auto 1rem;
}

.empty-icon {
  color: #d1d5db;
}

.error-state h3,
.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.error-state p,
.empty-state p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* CONTENT CONTAINER */
.content-container {
  max-width: 900px;
  margin: 0 auto;
}

/* INSTRUCTIONS CARD */
.instructions-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.card-header svg {
  width: 1.25rem;
  height: 1.25rem;
  color: #a855f7;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.instructions-text {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-color: #d1d5db;
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
}

.stat-icon.purple {
  background: linear-gradient(135deg, #a855f7, #9333ea);
}

.stat-icon.blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

/* PROGRESS CARD */
.progress-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.progress-percentage {
  font-size: 1rem;
  font-weight: 700;
  color: #a855f7;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #a855f7, #9333ea);
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-bar-fill.complete {
  background: linear-gradient(to right, #10b981, #059669);
}

/* QUESTIONS FORM */
.questions-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* QUESTION CARD */
.question-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.08);
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.question-number {
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9375rem;
  flex-shrink: 0;
}

.question-content {
  flex: 1;
  min-width: 0;
}

.question-text {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.question-instruction {
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
  margin: 0;
}

.points-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

/* OPTIONS LIST */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  cursor: pointer;
  transition: all 0.2s;
}

.option-item input[type="radio"] {
  display: none;
}

.option-content {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
}

.option-item:hover .option-content {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.option-item.selected .option-content {
  background: #f3e8ff;
  border-color: #a855f7;
}

.option-indicator {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.option-item.selected .option-indicator {
  border-color: #a855f7;
  background: #a855f7;
}

.option-item.selected .option-indicator::after {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  background: white;
  border-radius: 50%;
}

.option-text {
  flex: 1;
  color: #374151;
  font-size: 0.9375rem;
}

.option-item.selected .option-text {
  color: #111827;
  font-weight: 500;
}

/* TEXT ANSWER */
.text-answer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.answer-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s;
}

.answer-textarea:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.answer-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.answer-meta svg {
  width: 1rem;
  height: 1rem;
  color: #10b981;
}

/* FORM ACTIONS */
.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-button.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.action-button.secondary:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.button-content svg {
  width: 1.125rem;
  height: 1.125rem;
}

.button-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* HELPER TEXT */
.helper-text {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.helper-text svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  color: #a855f7;
}

/* RESPONSIVE DESIGN */
@media (min-width: 768px) {
  .homework-page {
    padding: 2rem 2.5rem;
  }
}

@media (max-width: 768px) {
  .homework-page {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .back-button {
    align-self: flex-start;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .question-header {
    flex-wrap: wrap;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .action-button {
    width: 100%;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .error-actions .action-button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content,
  .instructions-card,
  .progress-card,
  .question-card {
    padding: 1.125rem;
  }

  .stat-card {
    padding: 0.875rem;
  }
}

/* ACCESSIBILITY */
.back-button:focus-visible,
.action-button:focus-visible,
.option-item:focus-visible {
  outline: 2px solid #a855f7;
  outline-offset: 2px;
}

.answer-textarea:focus-visible {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

/* REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* DARK MODE SUPPORT */
@media (prefers-color-scheme: dark) {
  .homework-page {
    background: #111827;
  }

  .header-content,
  .loading-state,
  .error-state,
  .empty-state,
  .instructions-card,
  .stat-card,
  .progress-card,
  .question-card,
  .helper-text {
    background: #1f2937;
    border-color: #374151;
  }

  .page-title,
  .card-header h3,
  .stat-value,
  .question-text,
  .option-text {
    color: #f9fafb;
  }

  .subject-text,
  .instructions-text,
  .stat-label,
  .question-instruction,
  .answer-meta {
    color: #9ca3af;
  }

  .back-button,
  .action-button.secondary {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }

  .back-button:hover,
  .action-button.secondary:hover:not(:disabled) {
    background: #4b5563;
    color: #f9fafb;
  }

  .option-content {
    background: #374151;
    border-color: #4b5563;
  }

  .option-item:hover .option-content {
    background: #4b5563;
    border-color: #6b7280;
  }

  .option-item.selected .option-content {
    background: #2f254a;
    border-color: #a855f7;
  }

  .answer-textarea {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .answer-textarea::placeholder {
    color: #6b7280;
  }

  .progress-bar-container {
    background: #374151;
  }
}
</style>