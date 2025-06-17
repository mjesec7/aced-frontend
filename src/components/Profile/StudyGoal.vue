<template>
  <div class="goals-tracker">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-bg-circle header-bg-circle-1"></div>
        <div class="header-bg-circle header-bg-circle-2"></div>
        
        <div class="header-content">
          <div class="header-left">
            <div class="header-icon">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <h1 class="title">Мои цели</h1>
              <p class="subtitle">
                <svg class="icon-small" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                Покоряй новые вершины!
              </p>
            </div>
          </div>
          
          <button v-if="!addingGoal" @click="addingGoal = true" class="add-goal-btn">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            <span>Новая цель</span>
            <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Add Goal Form -->
      <div v-if="addingGoal" class="form-container">
        <div class="form-bg-circle"></div>
        
        <div class="form-content">
          <h2 class="form-title">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
            Создать новую цель ✨
          </h2>
          
          <div class="form-fields">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  Предмет
                </label>
                <select v-model="newGoal.subject" class="form-input">
                  <option value="">🎨 Выберите предмет</option>
                  <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
                  <option value="custom">✏️ Другое...</option>
                </select>
              </div>

              <div v-if="newGoal.subject === 'custom'" class="form-group">
                <label class="form-label">✏️ Свой предмет</label>
                <input v-model="newGoal.customSubject" class="form-input" placeholder="Введите предмет" />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                  Цель
                </label>
                <input v-model="newGoal.topic" class="form-input" placeholder="🎯 Что хотите изучить?" />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Срок
                </label>
                <input type="date" v-model="newGoal.timeline" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label">📊 Всего</label>
                <input type="number" v-model.number="newGoal.total" class="form-input" placeholder="0" />
              </div>

              <div class="form-group">
                <label class="form-label">✅ Выполнено</label>
                <input type="number" v-model.number="newGoal.done" class="form-input" placeholder="0" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">💬 Комментарий</label>
              <textarea v-model="newGoal.comment" class="form-textarea" rows="3" placeholder="✨ Дополнительная мотивация..."></textarea>
            </div>

            <div class="form-actions">
              <button @click="addGoal" class="btn btn-primary">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Создать цель 🚀
              </button>
              <button @click="addingGoal = false" class="btn btn-secondary">
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Goals List -->
      <div class="goals-list">
        <div v-for="goal in goals" :key="goal.id" class="goal-card" :class="getSubjectColor(goal.subject)">
          <div class="goal-header">
            <div class="goal-info">
              <div class="goal-icon" :class="getSubjectColor(goal.subject)">
                {{ getSubjectName(goal).charAt(0) }}
              </div>
              <div>
                <h3 class="goal-subject">{{ getSubjectName(goal) }}</h3>
                <p class="goal-topic">
                  <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                  {{ goal.topic }}
                </p>
              </div>
            </div>
            
            <div class="goal-actions">
              <span class="days-left" :class="getDaysLeftColor(goal)">
                <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ daysLeft(goal) }}
              </span>
              <button @click="deleteGoal(goal.id)" class="delete-btn">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">
                📈 Прогресс
                <span class="progress-emoji">{{ getProgressEmoji(calculateProgress(goal)) }}</span>
              </span>
              <span class="progress-numbers">
                {{ goal.done }}/{{ goal.total }} ({{ calculateProgress(goal) }}%)
              </span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :class="getSubjectColor(goal.subject)" :style="{ width: calculateProgress(goal) + '%' }">
                <div v-if="calculateProgress(goal) > 0" class="progress-shine"></div>
              </div>
            </div>
            <p v-if="calculateProgress(goal) > 0" class="motivation-text">
              {{ getRandomMotivation() }}
            </p>
          </div>

          <div v-if="goal.comment" class="comment-section">
            <p class="comment-text">
              <span class="comment-icon">💡</span>
              {{ goal.comment }}
            </p>
          </div>

          <div v-if="goal.updating" class="update-section">
            <input type="number" placeholder="➕ Добавить прогресс" v-model.number="goal.updateAmount" class="update-input" />
            <button @click="updateGoal(goal.id, goal.updateAmount || 0)" class="btn btn-success">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </button>
            <button @click="toggleUpdate(goal.id)" class="btn btn-secondary">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div v-else class="goal-buttons">
            <button @click="toggleUpdate(goal.id)" class="btn btn-update">
              <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <span>Обновить</span>
              <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </button>
            <button v-if="calculateProgress(goal) < 100" @click="markDone(goal.id)" class="btn btn-complete">
              <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              <span>Завершить</span>
              <svg class="icon-small" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="goals.length === 0 && !addingGoal" class="empty-state">
        <div class="empty-bg-circle empty-bg-circle-1"></div>
        <div class="empty-bg-circle empty-bg-circle-2"></div>
        
        <div class="empty-content">
          <div class="empty-icon">
            <svg class="icon-large" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h3 class="empty-title">Пока нет целей! 🎯</h3>
          <p class="empty-subtitle">Время начать свое учебное путешествие! ✨</p>
          <button @click="addingGoal = true" class="btn btn-primary btn-large">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Создать первую цель
            <svg class="icon-small" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'GoalsTracker',
  setup() {
    const goals = ref([])
    const addingGoal = ref(false)
    const subjects = ref([
      'Математика', 'Физика', 'Биология', 'История', 'География', 'Химия',
      'Программирование', 'Литература', 'Обществознание', 'Иностранный язык',
      'Экономика', 'Философия', 'Астрономия', 'Политология', 'Психология',
      'Археология', 'Искусство', 'Музыка', 'Экология', 'Культура'
    ])
    
    const newGoal = reactive({
      subject: '',
      customSubject: '',
      topic: '',
      timeline: '',
      total: 0,
      done: 0,
      comment: ''
    })

    const calculateProgress = (goal) => {
      return goal.total > 0 ? Math.round((goal.done / goal.total) * 100) : 0
    }

    const daysLeft = (goal) => {
      const today = new Date()
      const deadline = new Date(goal.timeline)
      const diffTime = deadline - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? `${diffDays} дней` : 'Просрочено'
    }

    const addGoal = () => {
      if (!newGoal.subject || !newGoal.topic || !newGoal.timeline || !newGoal.total) return
      
      const goal = {
        ...newGoal,
        id: Date.now(),
        updating: false,
        updateAmount: 0
      }
      
      goals.value.push(goal)
      Object.assign(newGoal, { 
        subject: '', 
        customSubject: '', 
        topic: '', 
        timeline: '', 
        total: 0, 
        done: 0, 
        comment: '' 
      })
      addingGoal.value = false
    }

    const updateGoal = (id, updateAmount) => {
      const goalIndex = goals.value.findIndex(goal => goal.id === id)
      if (goalIndex !== -1) {
        const goal = goals.value[goalIndex]
        goal.done = Math.min(goal.done + updateAmount, goal.total)
        goal.updating = false
        goal.updateAmount = 0
      }
    }

    const deleteGoal = (id) => {
      goals.value = goals.value.filter(goal => goal.id !== id)
    }

    const markDone = (id) => {
      const goalIndex = goals.value.findIndex(goal => goal.id === id)
      if (goalIndex !== -1) {
        goals.value[goalIndex].done = goals.value[goalIndex].total
      }
    }

    const toggleUpdate = (id) => {
      const goalIndex = goals.value.findIndex(goal => goal.id === id)
      if (goalIndex !== -1) {
        const goal = goals.value[goalIndex]
        goal.updating = !goal.updating
        goal.updateAmount = 0
      }
    }

    const getSubjectColor = (subject) => {
      const colors = {
        'Математика': 'math',
        'Физика': 'physics',
        'Биология': 'biology',
        'История': 'history',
        'География': 'geography',
        'Химия': 'chemistry',
        'Программирование': 'programming',
        'Литература': 'literature',
        'Обществознание': 'social',
        'Иностранный язык': 'language',
      }
      return colors[subject] || 'default'
    }

    const getDaysLeftColor = (goal) => {
      const today = new Date()
      const deadline = new Date(goal.timeline)
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return 'expired'
      if (diffDays <= 3) return 'urgent'
      if (diffDays <= 7) return 'warning'
      return 'good'
    }

    const getProgressEmoji = (progress) => {
      if (progress === 100) return '🎉'
      if (progress >= 80) return '🔥'
      if (progress >= 60) return '⚡'
      if (progress >= 40) return '💪'
      if (progress >= 20) return '🌱'
      return '🎯'
    }

    const getRandomMotivation = () => {
      const phrases = [
        "Ты молодец! 🌟",
        "Так держать! 💪",
        "Отличный прогресс! 🚀",
        "Ты на правильном пути! ✨"
      ]
      return phrases[Math.floor(Math.random() * phrases.length)]
    }

    const getSubjectName = (goal) => {
      return goal.subject === 'custom' ? goal.customSubject : goal.subject
    }

    return {
      goals,
      addingGoal,
      subjects,
      newGoal,
      calculateProgress,
      daysLeft,
      addGoal,
      updateGoal,
      deleteGoal,
      markDone,
      toggleUpdate,
      getSubjectColor,
      getDaysLeftColor,
      getProgressEmoji,
      getRandomMotivation,
      getSubjectName
    }
  }
}
</script>

<style scoped>
/* Base styles */
.goals-tracker {
  min-height: 100vh;
  background: linear-gradient(135deg, #f3e8ff 0%, #fce7f3 50%, #dbeafe 100%);
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header styles */
.header {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5d4f1;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.header-bg-circle-1 {
  position: absolute;
  top: -4rem;
  right: -4rem;
  width: 8rem;
  height: 8rem;
  background: linear-gradient(135deg, #c084fc, #ec4899);
  border-radius: 50%;
  opacity: 0.5;
}

.header-bg-circle-2 {
  position: absolute;
  bottom: -3rem;
  left: -3rem;
  width: 6rem;
  height: 6rem;
  background: linear-gradient(135deg, #60a5fa, #06b6d4);
  border-radius: 50%;
  opacity: 0.5;
}

.header-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transform: rotate(3deg);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
}

/* Icons */
.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-small {
  width: 1rem;
  height: 1rem;
}

.icon-large {
  width: 2.5rem;
  height: 2.5rem;
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #db2777);
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-success:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.btn-update {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
}

.btn-update:hover {
  background: linear-gradient(135deg, #2563eb, #0891b2);
}

.btn-complete {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-complete:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.add-goal-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.add-goal-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #db2777);
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
}

.add-goal-btn .icon:first-child {
  transition: transform 0.3s ease;
}

.add-goal-btn:hover .icon:first-child {
  transform: rotate(90deg);
}

/* Form styles */
.form-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5d4f1;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.form-bg-circle {
  position: absolute;
  top: -2.5rem;
  right: -2.5rem;
  width: 5rem;
  height: 5rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  opacity: 0.3;
}

.form-content {
  position: relative;
}

.form-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #374151;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input, .form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e5d4f1;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-input:hover, .form-textarea:hover {
  border-color: #c084fc;
}

.form-textarea {
  resize: none;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.form-actions .btn:first-child {
  flex: 1;
}

/* Goals list */
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.goal-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5d4f1;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.goal-card:hover {
  transform: scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.goal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

/* Subject color themes */
.goal-card.math::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
.goal-card.physics::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.goal-card.biology::before { background: linear-gradient(90deg, #10b981, #059669); }
.goal-card.history::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
.goal-card.geography::before { background: linear-gradient(90deg, #14b8a6, #0d9488); }
.goal-card.chemistry::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
.goal-card.programming::before { background: linear-gradient(90deg, #4b5563, #374151); }
.goal-card.literature::before { background: linear-gradient(90deg, #ec4899, #db2777); }
.goal-card.social::before { background: linear-gradient(90deg, #f97316, #ea580c); }
.goal-card.language::before { background: linear-gradient(90deg, #6366f1, #4f46e5); }
.goal-card.default::before { background: linear-gradient(90deg, #6b7280, #4b5563); }

.goal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  padding-bottom: 0;
}

.goal-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.goal-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.125rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.goal-icon.math { background: linear-gradient(135deg, #ef4444, #dc2626); }
.goal-icon.physics { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.goal-icon.biology { background: linear-gradient(135deg, #10b981, #059669); }
.goal-icon.history { background: linear-gradient(135deg, #f59e0b, #d97706); }
.goal-icon.geography { background: linear-gradient(135deg, #14b8a6, #0d9488); }
.goal-icon.chemistry { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.goal-icon.programming { background: linear-gradient(135deg, #4b5563, #374151); }
.goal-icon.literature { background: linear-gradient(135deg, #ec4899, #db2777); }
.goal-icon.social { background: linear-gradient(135deg, #f97316, #ea580c); }
.goal-icon.language { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.goal-icon.default { background: linear-gradient(135deg, #6b7280, #4b5563); }

.goal-subject {
  font-weight: bold;
  color: #1f2937;
  font-size: 1.125rem;
  margin: 0;
}

.goal-topic {
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
}

.goal-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.days-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.days-left.good {
  background: #10b981;
  color: #ecfdf5;
}

.days-left.warning {
  background: #f59e0b;
  color: #fefce8;
}

.days-left.urgent {
  background: #f97316;
  color: #fff7ed;
}

.days-left.expired {
  background: #ef4444;
  color: #fef2f2;
}

.delete-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: #9ca3af;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* Progress section */
.progress-section {
  padding: 0 1.5rem 1.5rem;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.progress-emoji {
  font-size: 1.125rem;
}

.progress-numbers {
  font-size: 1.125rem;
  font-weight: bold;
  color: #8b5cf6;
}

.progress-bar {
  width: 100%;
  height: 0.75rem;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill.math { background: linear-gradient(90deg, #ef4444, #dc2626); }
.progress-fill.physics { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.progress-fill.biology { background: linear-gradient(90deg, #10b981, #059669); }
.progress-fill.history { background: linear-gradient(90deg, #f59e0b, #d97706); }
.progress-fill.geography { background: linear-gradient(90deg, #14b8a6, #0d9488); }
.progress-fill.chemistry { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
.progress-fill.programming { background: linear-gradient(90deg, #4b5563, #374151); }
.progress-fill.literature { background: linear-gradient(90deg, #ec4899, #db2777); }
.progress-fill.social { background: linear-gradient(90deg, #f97316, #ea580c); }
.progress-fill.language { background: linear-gradient(90deg, #6366f1, #4f46e5); }
.progress-fill.default { background: linear-gradient(90deg, #6b7280, #4b5563); }

.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.motivation-text {
  font-size: 0.75rem;
  color: #8b5cf6;
  font-weight: 600;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

/* Comment section */
.comment-section {
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
}

.comment-text {
  background: linear-gradient(135deg, #f3e8ff, #fce7f3);
  padding: 1rem;
  border-radius: 0.75rem;
  border-left: 4px solid #8b5cf6;
  font-size: 0.875rem;
  color: #374151;
  font-style: italic;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
}

.comment-icon {
  font-size: 1.125rem;
}

/* Update section */
.update-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem;
}

.update-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5d4f1;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.update-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.goal-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem;
}

/* Empty state */
.empty-state {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5d4f1;
  padding: 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.empty-bg-circle-1 {
  position: absolute;
  top: -4rem;
  right: -4rem;
  width: 8rem;
  height: 8rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  opacity: 0.3;
}

.empty-bg-circle-2 {
  position: absolute;
  bottom: -3rem;
  left: -3rem;
  width: 6rem;
  height: 6rem;
  background: linear-gradient(135deg, #c084fc, #ec4899);
  border-radius: 50%;
  opacity: 0.3;
}

.empty-content {
  position: relative;
}

.empty-icon {
  width: 5rem;
  height: 5rem;
  background: linear-gradient(135deg, #c084fc, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #374151;
  margin-bottom: 0.75rem;
}

.empty-subtitle {
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .goals-tracker {
    padding: 0.5rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .goal-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .goal-buttons {
    flex-direction: column;
  }
  
  .update-section {
    flex-direction: column;
  }
  
  .update-input {
    width: 100%;
  }
}
</style>