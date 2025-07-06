<template>
  <div class="homework-page">
    <div class="back-button">
      <router-link to="/profile/homeworks" class="back-link">← Назад к списку</router-link>
    </div>
    
    <h1>{{ homeworkTitle }}</h1>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка задания...</p>
    </div>

    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <h3>{{ error }}</h3>
      <router-link to="/profile/homeworks" class="error-button">Вернуться к списку</router-link>
    </div>

    <div v-else-if="!homeworkId && !lessonId" class="error">
      <div class="error-icon">⚠️</div>
      <h3>Ошибка загрузки</h3>
      <p>ID задания не найден. Пожалуйста, вернитесь к списку домашних заданий.</p>
      <router-link to="/profile/homeworks" class="error-button">Вернуться к списку</router-link>
    </div>

    <div v-else-if="questions.length === 0" class="empty">
      <div class="empty-icon">📝</div>
      <h3>В этом задании нет вопросов</h3>
      <p>Обратитесь к преподавателю для получения дополнительной информации.</p>
    </div>

    <div v-else>
      <!-- Instructions Section -->
      <div v-if="instructions" class="instructions-section">
        <h3>📋 Инструкции</h3>
        <div class="instructions-content">{{ instructions }}</div>
      </div>

      <form @submit.prevent="submitHomework">
        <div v-for="(q, i) in questions" :key="q._id || i" class="question-block">
          <div class="question-header">
            <span class="question-number">{{ i + 1 }}</span>
            <div class="question-content">
              <p class="question-text"><strong>{{ q.question || q.text }}</strong></p>
              <div v-if="q.instruction" class="question-instruction">
                <em>{{ q.instruction }}</em>
              </div>
            </div>
          </div>

          <!-- Multiple Choice Questions -->
          <div v-if="q.type === 'abc' || q.type === 'multiple-choice' || (q.options && q.options.length > 0)" class="options">
            <label v-for="(opt, j) in q.options" :key="j" class="option">
              <input
                type="radio"
                :name="'q' + i"
                :value="opt.text || opt"
                v-model="userAnswers[i]"
              />
              <span class="option-text">{{ opt.text || opt }}</span>
            </label>
          </div>

          <!-- Text Input Questions -->
          <div v-else class="text-input">
            <textarea
              v-model="userAnswers[i]"
              :placeholder="'Введите ваш ответ на вопрос ' + (i + 1)"
              rows="3"
              class="answer-textarea"
            ></textarea>
          </div>

          <!-- Points Display -->
          <div v-if="q.points" class="question-points">
            <span class="points-badge">{{ q.points }} {{ getPointsText(q.points) }}</span>
          </div>
        </div>

        <div class="actions">
          <button type="button" @click="saveHomework" class="save-btn" :disabled="saving">
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? 'Отправка...' : 'Завершить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import api from '@/api';
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
      instructions: '',
      userAnswers: [],
      loading: true,
      saving: false,
      submitting: false,
      error: null,
      isStandalone: false,
      detectedHomeworkType: null,
    };
  },
  
  computed: {
    // ✅ FIXED: Extract ID from actual route structure
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
      
      // Prefer homework ID over lesson ID
      if (hwId) {
        return hwId;
      }
      
      if (lessonId) {
        return lessonId;
      }
      
      console.error('❌ No primary ID found:', { hwId, lessonId, type, routeParams: this.$route.params });
      return null;
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

    async fetchHomework() {
      try {
        this.loading = true;
        this.error = null;
        
        const homeworkId = this.computedHomeworkId;
        const lessonId = this.computedLessonId;
        const primaryId = this.primaryId;
        const suggestedType = this.computedHomeworkType;
        
       
        
        if (!primaryId) {
          console.error('❌ No homework or lesson ID available');
          this.error = 'ID задания не найден';
          return;
        }
        
        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        const token = await user.getIdToken();
        const userId = user.uid;

        // ✅ STRATEGY 1: Try as standalone homework
        const shouldTryStandalone = suggestedType === 'standalone' || 
                                   !suggestedType || 
                                   suggestedType === 'unknown';
        
        if (shouldTryStandalone && primaryId) {
          try {
            
            // ✅ FIXED: Use direct API calls instead of missing functions
            let response;
            try {
              // Try user-specific endpoint first
              response = await api.get(`/users/${userId}/homework/${primaryId}`, {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
            } catch (userError) {
              console.warn('⚠️ User homework endpoint failed, trying direct:', userError.message);
              
              // Fallback to direct homework endpoint
              response = await api.get(`/homeworks/${primaryId}`, {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
              
              // Transform the response to match expected format
              const homeworkData = response.data.data || response.data;
              response.data = {
                success: true,
                data: {
                  homework: homeworkData,
                  userProgress: null,
                  questions: homeworkData?.exercises || []
                }
              };
            }
            
            const homeworkResponse = response.data;
            
            if (homeworkResponse.success && homeworkResponse.data) {
              const homeworkData = homeworkResponse.data.homework;
              const userProgress = homeworkResponse.data.userProgress;
              
              if (homeworkData && (homeworkData.exercises || homeworkData.title)) {
                this.isStandalone = true;
                this.detectedHomeworkType = 'standalone';
                this.homeworkTitle = homeworkData.title || this.title || 'Домашнее задание';
                this.instructions = homeworkData.instructions || '';
                this.questions = homeworkData.exercises || [];
                this.userAnswers = this.questions.map(() => '');

                // Load existing progress if available
                if (userProgress && userProgress.answers) {
                  this.loadUserAnswers(userProgress.answers);
                }
                
              
                
                return; // Success - exit early
              }
            }
          } catch (homeworkError) {
            console.warn('⚠️ Standalone homework approach failed:', homeworkError.message);
            
            // Check if it's a 404 (homework not found) vs server error
            if (homeworkError.response?.status === 404) {
            } else {
              console.error('🚨 Server error in standalone homework:', homeworkError);
              // For server errors, don't continue to lesson approach
              if (homeworkError.response?.status >= 500) {
                this.error = 'Ошибка сервера при загрузке задания';
                return;
              }
            }
          }
        }

        // ✅ STRATEGY 2: Try as lesson homework
        try {
          // Try to get lesson data
          const lessonResponse = await api.get(`/lessons/${primaryId}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          const lesson = lessonResponse.data;
          
          if (!lesson.homework || !Array.isArray(lesson.homework) || lesson.homework.length === 0) {
            console.warn('⚠️ No homework questions found in lesson');
            this.error = 'В этом уроке нет домашнего задания';
            return;
          }
          
          this.isStandalone = false;
          this.detectedHomeworkType = 'lesson';
          this.homeworkTitle = `Домашнее задание: ${lesson.lessonName || lesson.title}`;
          this.instructions = lesson.homeworkInstructions || '';
          this.questions = lesson.homework;
          this.userAnswers = this.questions.map(() => '');

          // Try to load user's progress
          try {
            const progressResponse = await api.get(`/homeworks/user/${userId}/lesson/${primaryId}`, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            
            const homeworkData = progressResponse.data?.data || progressResponse.data;
            
            if (homeworkData?.homework?.answers) {
              this.loadUserAnswers(homeworkData.homework.answers);
            }
          } catch (progressErr) {
          }

        

          return; // Success
          
        } catch (lessonError) {
          console.error('❌ Lesson homework approach also failed:', lessonError);
          
          if (lessonError.response?.status === 404) {
            if (suggestedType === 'standalone') {
              this.error = 'Домашнее задание не найдено. Возможно, оно было удалено.';
            } else {
              this.error = 'Урок не найден. Возможно, он был удален.';
            }
          } else if (lessonError.response?.status >= 500) {
            this.error = 'Ошибка сервера при загрузке урока';
          } else {
            this.error = 'Ошибка загрузки домашнего задания';
          }
        }

      } catch (err) {
        console.error('❌ General error loading homework:', err);
        this.error = 'Ошибка загрузки домашнего задания';
        this.$toast?.error('Ошибка загрузки домашки.');
      } finally {
        this.loading = false;
      }
    },

    loadUserAnswers(answers) {
      
      if (Array.isArray(answers)) {
        // Answers is an array of objects with questionIndex and answer
        for (const entry of answers) {
          if (entry.questionIndex !== undefined && entry.questionIndex >= 0 && entry.questionIndex < this.userAnswers.length) {
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
      
    },

    async saveHomework() {
      try {
        this.saving = true;
        
        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        const token = await user.getIdToken();
        const userId = user.uid;

        const answers = this.userAnswers.map((ans, i) => ({
          questionIndex: i,
          userAnswer: ans,
          answer: ans
        }));

       
        if (this.isStandalone) {
          // ✅ FIXED: Use direct API call for standalone homework
          await api.post(`/users/${userId}/homework/${this.primaryId}/save`, { answers }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Save lesson homework progress
          await api.post(`/homeworks/user/${userId}/save`, { 
            lessonId: this.primaryId, 
            answers
          }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }

        this.$toast?.success('Ответы сохранены!');
      } catch (err) {
        console.error('❌ Error saving homework:', err);
        
        let errorMessage = 'Не удалось сохранить.';
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response?.data?.details) {
          errorMessage = err.response.data.details;
        }
        
        this.$toast?.error(errorMessage);
      } finally {
        this.saving = false;
      }
    },

    async submitHomework() {
      try {
        this.submitting = true;
        
        // Check if all questions are answered
        const unansweredQuestions = this.userAnswers.filter(ans => !ans || ans.trim() === '');
        if (unansweredQuestions.length > 0) {
          this.$toast?.warning('Пожалуйста, ответьте на все вопросы.');
          return;
        }

        const user = auth.currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        const token = await user.getIdToken();
        const userId = user.uid;

        const answers = this.userAnswers.map((ans, i) => ({
          questionIndex: i,
          userAnswer: ans,
          answer: ans
        }));

       

        let result;
        
        if (this.isStandalone) {
          // ✅ FIXED: Use direct API call for standalone homework
          result = await api.post(`/users/${userId}/homework/${this.primaryId}/submit`, { answers }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Submit lesson homework
          result = await api.post(`/homeworks/user/${userId}/lesson/${this.primaryId}/submit`, { answers }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }


        const responseData = result.data?.data || result.data;
        const score = responseData?.score || 0;
        const stars = responseData?.stars || 0;
        const details = responseData?.details || `Задание выполнено`;
        const correctAnswers = responseData?.correctAnswers || 0;
        const totalQuestions = responseData?.totalQuestions || this.questions.length;
        
        let successMessage = `Домашка завершена! Ваша оценка: ${score}%`;
        if (stars > 0) {
          successMessage += ` (${stars} ⭐)`;
        }
        if (correctAnswers > 0) {
          successMessage += ` - ${correctAnswers}/${totalQuestions} правильных ответов`;
        }
        
        this.$toast?.success(successMessage);
        
        // Wait a bit before redirecting
        setTimeout(() => {
          this.$router.push('/profile/homeworks');
        }, 3000);
        
      } catch (err) {
        console.error('❌ Error submitting homework:', err);
        
        // ✅ ENHANCED: Better error handling with specific messages
        let errorMessage = 'Ошибка отправки ответов.';
        
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

    getPointsText(points) {
      if (points === 1) return 'балл';
      if (points >= 2 && points <= 4) return 'балла';
      return 'баллов';
    }
  },
  
  created() {
    console.group('🎯 HomeworkPage Created');
  
    
  },

  mounted() {
    if (this.primaryId) {
      this.fetchHomework();
    } else {
      console.error('❌ No homework or lesson ID available on mount');
      this.loading = false;
      this.error = 'ID задания не найден';
    }
  },

  watch: {
    '$route'(to, from) {
  
      if (to.params !== from.params && this.primaryId) {
        this.fetchHomework();
      }
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

.error-button {
  display: inline-block;
  background: #6a5acd;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s ease;
}

.error-button:hover {
  background: #5848c2;
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

@media (max-width: 768px) {
  .homework-page {
    padding: 1rem;
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
}
</style>