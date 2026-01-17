<template>
  <div class="goals-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">🎯 Мои цели</h1>
          <p class="page-subtitle">Ставьте цели и достигайте новых высот!</p>
        </div>
        <button v-if="!addingGoal" @click="addingGoal = true" class="add-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Новая цель
        </button>
      </div>
    </div>

    <!-- Add Goal Form -->
    <div v-if="addingGoal" class="form-card">
      <div class="form-header">
        <h2 class="form-title">Создать новую цель</h2>
        <button @click="addingGoal = false" class="close-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="form-body">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Предмет
            </label>
            <select v-model="newGoal.subject" class="form-select">
              <option value="">Выберите предмет</option>
              <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
              <option value="custom">Другое...</option>
            </select>
          </div>

          <div v-if="newGoal.subject === 'custom'" class="form-group">
            <label class="form-label">Свой предмет</label>
            <input v-model="newGoal.customSubject" class="form-input" placeholder="Введите предмет" />
          </div>

          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Цель
            </label>
            <input v-model="newGoal.topic" class="form-input" placeholder="Что хотите изучить?" />
          </div>

          <div class="form-group">
            <label class="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Срок выполнения
            </label>
            <input type="date" v-model="newGoal.timeline" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">Всего</label>
            <input type="number" v-model.number="newGoal.total" class="form-input" placeholder="0" min="0" />
          </div>

          <div class="form-group">
            <label class="form-label">Выполнено</label>
            <input type="number" v-model.number="newGoal.done" class="form-input" placeholder="0" min="0" />
          </div>
        </div>

        <div class="form-group full-width">
          <label class="form-label">Комментарий (необязательно)</label>
          <textarea v-model="newGoal.comment" class="form-textarea" rows="3" placeholder="Добавьте мотивацию или заметки..."></textarea>
        </div>

        <div class="form-actions">
          <button @click="addingGoal = false" class="action-button secondary">
            Отмена
          </button>
          <button @click="addGoal" class="action-button primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Создать цель
          </button>
        </div>
      </div>
    </div>

    <!-- Goals List -->
    <div v-if="goals.length > 0" class="goals-container">
      <div v-for="goal in goals" :key="goal.id" class="goal-card">
        <div class="goal-header">
          <div class="goal-info">
            <div class="goal-badge" :class="getSubjectColor(goal.subject)">
              {{ getSubjectName(goal).charAt(0) }}
            </div>
            <div class="goal-details">
              <h3 class="goal-subject">{{ getSubjectName(goal) }}</h3>
              <p class="goal-topic">{{ goal.topic }}</p>
            </div>
          </div>
          <div class="goal-actions">
            <div class="deadline-badge" :class="getDaysLeftColor(goal)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              {{ daysLeft(goal) }}
            </div>
            <button @click="deleteGoal(goal.id)" class="delete-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">
              Прогресс {{ getProgressEmoji(calculateProgress(goal)) }}
            </span>
            <span class="progress-value">
              {{ goal.done }}/{{ goal.total }} ({{ calculateProgress(goal) }}%)
            </span>
          </div>
          <div class="progress-bar-container">
            <div 
              class="progress-bar-fill" 
              :class="getSubjectColor(goal.subject)"
              :style="{ width: calculateProgress(goal) + '%' }"
            ></div>
          </div>
          <p v-if="calculateProgress(goal) > 0" class="motivation-text">
            {{ getRandomMotivation() }}
          </p>
        </div>

        <div v-if="goal.comment" class="comment-section">
          <div class="comment-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p>{{ goal.comment }}</p>
          </div>
        </div>

        <div v-if="goal.updating" class="update-section">
          <input 
            type="number" 
            v-model.number="goal.updateAmount" 
            class="update-input" 
            placeholder="Добавить прогресс"
            min="0"
          />
          <button @click="updateGoal(goal.id, goal.updateAmount || 0)" class="action-button success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
          <button @click="toggleUpdate(goal.id)" class="action-button secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div v-else class="goal-buttons">
          <button @click="toggleUpdate(goal.id)" class="action-button secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Обновить
          </button>
          <button 
            v-if="calculateProgress(goal) < 100" 
            @click="markDone(goal.id)" 
            class="action-button success"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Завершить
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!addingGoal" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
      <h3>Пока нет целей!</h3>
      <p>Время начать свое учебное путешествие</p>
      <button @click="addingGoal = true" class="action-button primary large">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Создать первую цель
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'StudyGoal',
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
        'Математика': 'red',
        'Физика': 'blue',
        'Биология': 'green',
        'История': 'orange',
        'География': 'teal',
        'Химия': 'purple',
        'Программирование': 'gray',
        'Литература': 'pink',
        'Обществознание': 'amber',
        'Иностранный язык': 'indigo',
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
/* GENERAL STYLES */
.goals-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 1.5rem;
}

/* HEADER */
.page-header {
  max-width: 1200px;
  margin: 0 auto 2rem;
}

.header-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
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

.page-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.add-button {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-button:hover {
  background: linear-gradient(135deg, #9333ea, #7e22ce);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

.add-button svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* FORM CARD */
.form-card {
  max-width: 1200px;
  margin: 0 auto 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-button {
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.close-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.close-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.form-body {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-label svg {
  width: 1rem;
  height: 1rem;
  color: #a855f7;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* GOALS CONTAINER */
.goals-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* GOAL CARD */
.goal-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  transition: all 0.2s;
}

.goal-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #a855f7;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.goal-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.goal-badge {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.goal-badge.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
.goal-badge.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.goal-badge.green { background: linear-gradient(135deg, #10b981, #059669); }
.goal-badge.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.goal-badge.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }
.goal-badge.purple { background: linear-gradient(135deg, #a855f7, #9333ea); }
.goal-badge.gray { background: linear-gradient(135deg, #6b7280, #4b5563); }
.goal-badge.pink { background: linear-gradient(135deg, #ec4899, #db2777); }
.goal-badge.amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
.goal-badge.indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.goal-badge.default { background: linear-gradient(135deg, #6b7280, #4b5563); }

.goal-details {
  flex: 1;
  min-width: 0;
}

.goal-subject {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.goal-topic {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.deadline-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.deadline-badge svg {
  width: 0.875rem;
  height: 0.875rem;
}

.deadline-badge.good { background: #10b981; }
.deadline-badge.warning { background: #f59e0b; }
.deadline-badge.urgent { background: #f97316; }
.deadline-badge.expired { background: #ef4444; }

.delete-button {
  background: none;
  border: none;
  color: #9ca3af;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-button:hover {
  background: #fef2f2;
  color: #ef4444;
}

.delete-button svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* PROGRESS SECTION */
.progress-section {
  margin-bottom: 1.25rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 600;
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
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-bar-fill.red { background: linear-gradient(to right, #ef4444, #dc2626); }
.progress-bar-fill.blue { background: linear-gradient(to right, #3b82f6, #2563eb); }
.progress-bar-fill.green { background: linear-gradient(to right, #10b981, #059669); }
.progress-bar-fill.orange { background: linear-gradient(to right, #f59e0b, #d97706); }
.progress-bar-fill.teal { background: linear-gradient(to right, #14b8a6, #0d9488); }
.progress-bar-fill.purple { background: linear-gradient(to right, #a855f7, #9333ea); }
.progress-bar-fill.gray { background: linear-gradient(to right, #6b7280, #4b5563); }
.progress-bar-fill.pink { background: linear-gradient(to right, #ec4899, #db2777); }
.progress-bar-fill.amber { background: linear-gradient(to right, #f59e0b, #d97706); }
.progress-bar-fill.indigo { background: linear-gradient(to right, #6366f1, #4f46e5); }
.progress-bar-fill.default { background: linear-gradient(to right, #6b7280, #4b5563); }

.motivation-text {
  font-size: 0.75rem;
  color: #a855f7;
  font-weight: 500;
  margin: 0.75rem 0 0 0;
}

/* COMMENT SECTION */
.comment-section {
  background: #f9fafb;
  border-left: 3px solid #a855f7;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.comment-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.comment-content svg {
  width: 1.25rem;
  height: 1.25rem;
  color: #a855f7;
  flex-shrink: 0;
}

.comment-content p {
  margin: 0;
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
  font-style: italic;
}

/* UPDATE SECTION */
.update-section {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.update-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.update-input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

/* GOAL BUTTONS */
.goal-buttons {
  display: flex;
  gap: 0.75rem;
}

.goal-buttons .action-button {
  flex: 1;
}

/* ACTION BUTTONS */
.action-button {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button svg {
  width: 1rem;
  height: 1rem;
}

.action-button.primary {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #9333ea, #7e22ce);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
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

.action-button.success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.action-button.success:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-button.large {
  padding: 1rem 2rem;
  font-size: 1rem;
}

/* EMPTY STATE */
.empty-state {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin: 0 auto 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

/* RESPONSIVE DESIGN */
@media (min-width: 768px) {
  .goals-page {
    padding: 2rem 2.5rem;
  }
}

@media (max-width: 768px) {
  .goals-page {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .add-button {
    width: 100%;
    justify-content: center;
  }

  .goals-container {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions .action-button {
    width: 100%;
  }

  .goal-header {
    flex-wrap: wrap;
  }

  .goal-actions {
    width: 100%;
    justify-content: space-between;
  }

  .goal-buttons {
    flex-direction: column;
  }

  .update-section {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content,
  .form-card {
    padding: 1.125rem;
  }

  .goal-card {
    padding: 1.125rem;
  }
}

/* ACCESSIBILITY */
.add-button:focus-visible,
.close-button:focus-visible,
.delete-button:focus-visible,
.action-button:focus-visible {
  outline: 2px solid #a855f7;
  outline-offset: 2px;
}

.form-input:focus-visible,
.form-select:focus-visible,
.form-textarea:focus-visible,
.update-input:focus-visible {
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

</style>