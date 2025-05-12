<template>
    <div class="goal-section">
      <div class="section-header">
        <h1 class="section-title">📈 Твои учебные цели</h1>
        <button class="add-goal-btn" @click="addingGoal = true" v-if="!addingGoal">Добавить цель</button>
      </div>
  
      <!-- Goal Form -->
      <div class="goal-form" v-if="addingGoal">
        <label>Предмет</label>
        <select v-model="newGoal.subject">
          <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
          <option value="custom">Другое...</option>
        </select>
  
        <input v-if="newGoal.subject === 'custom'" v-model="newGoal.customSubject" placeholder="Введите предмет" />
  
        <label>Описание цели</label>
        <input v-model="newGoal.topic" placeholder="Цель или тема" />
  
        <label>Срок (выберите или напишите)</label>
        <input type="date" v-model="newGoal.timeline" />
  
        <label>Объем работы (например: 100 страниц)</label>
        <input v-model.number="newGoal.total" type="number" placeholder="Всего..." />
  
        <label>Сколько уже сделано</label>
        <input v-model.number="newGoal.done" type="number" placeholder="Уже сделано..." />
  
        <label>Комментарий (необязательно)</label>
        <textarea v-model="newGoal.comment"></textarea>
  
        <div class="form-buttons">
          <button class="submit-btn" @click="addGoal">Добавить</button>
          <button class="cancel-btn" @click="addingGoal = false">Отмена</button>
        </div>
      </div>
  
      <!-- Goals List -->
      <div class="goals-grid">
        <div class="goal-card" v-for="(goal, index) in goals" :key="index">
          <div class="goal-header">
            <div class="goal-title-block">
              <h3>{{ goal.subject === 'custom' ? goal.customSubject : goal.subject }}</h3>
              <small class="deadline">📆 до {{ goal.timeline }} <span class="days-left">({{ daysLeft(goal) }})</span></small>
            </div>
          </div>
          <p class="goal-topic">🎯 {{ goal.topic }}</p>
  
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: calculateProgress(goal) + '%' }"></div>
          </div>
          <p class="progress-percent">📊 {{ goal.done }}/{{ goal.total }} ({{ calculateProgress(goal) }}%)</p>
  
          <p v-if="goal.comment" class="goal-comment">💬 {{ goal.comment }}</p>
  
          <!-- Update Mode -->
          <div v-if="goal.updating" class="update-section">
            <input v-model.number="goal.updateAmount" type="number" placeholder="Добавить прогресс" />
            <div class="update-buttons">
              <button class="submit-btn" @click="confirmUpdate(index)">Обновить</button>
              <button class="cancel-btn" @click="cancelUpdate(index)">Отмена</button>
            </div>
          </div>
          <div v-else class="goal-actions">
            <button class="submit-btn" @click="goal.updating = true">Обновить</button>
            <button class="submit-btn" @click="markDone(index)" :disabled="calculateProgress(goal) === 100">Завершить</button>
            <button class="delete-btn" @click="deleteGoal(index)">Удалить</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        goals: [],
        addingGoal: false,
        subjects: [
          'Математика', 'Физика', 'Биология', 'История', 'География', 'Химия',
          'Программирование', 'Литература', 'Обществознание', 'Иностранный язык',
          'Экономика', 'Философия', 'Астрономия', 'Политология', 'Психология',
          'Археология', 'Искусство', 'Музыка', 'Экология', 'Культура'
        ],
        newGoal: {
          subject: '',
          customSubject: '',
          topic: '',
          timeline: '',
          total: 0,
          done: 0,
          comment: ''
        }
      };
    },
    methods: {
      calculateProgress(goal) {
        return goal.total > 0 ? Math.round((goal.done / goal.total) * 100) : 0;
      },
      daysLeft(goal) {
        const today = new Date();
        const deadline = new Date(goal.timeline);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} дн. осталось` : '⏳ Срок истек';
      },
      addGoal() {
        if (!this.newGoal.subject || !this.newGoal.topic || !this.newGoal.timeline || !this.newGoal.total) return;
        const goal = {
          ...this.newGoal,
          updating: false,
          updateAmount: 0
        };
        this.goals.push(goal);
        this.newGoal = { subject: '', customSubject: '', topic: '', timeline: '', total: 0, done: 0, comment: '' };
        this.addingGoal = false;
      },
      confirmUpdate(index) {
        const goal = this.goals[index];
        goal.done += goal.updateAmount;
        goal.updateAmount = 0;
        goal.updating = false;
      },
      cancelUpdate(index) {
        this.goals[index].updating = false;
        this.goals[index].updateAmount = 0;
      },
      deleteGoal(index) {
        this.goals.splice(index, 1);
      },
      markDone(index) {
        this.goals[index].done = this.goals[index].total;
      }
    }
  };
  </script>
  
  <style scoped>
  .goal-section {
  padding: 40px;
  font-family: 'Unbounded', sans-serif;
  background: linear-gradient(to right, #f8fafc, #ffffff);
  min-height: 100vh;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.section-title {
  font-size: 2rem;
  font-weight: 900;
  color: #4f46e5;
}

.add-goal-btn {
  padding: 10px 20px;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.add-goal-btn:hover {
  background: linear-gradient(to right, #6d28d9, #7c3aed);
}

.goal-form {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  max-width: 600px;
  gap: 16px;
  background: #ffffff;
  padding: 24px;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.goal-form input,
.goal-form select,
.goal-form textarea {
  padding: 12px 14px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-family: 'Unbounded', sans-serif;
  background-color: #f9fafb;
  transition: border-color 0.3s;
}

.goal-form input:focus,
.goal-form select:focus,
.goal-form textarea:focus {
  outline: none;
  border-color: #7c3aed;
  background-color: #ffffff;
}

.goal-form button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
}

.submit-btn {
  background: linear-gradient(to right, #4f46e5, #6366f1);
  color: white;
  border: none;
}

.cancel-btn {
  background-color: #e5e7eb;
  color: #374151;
  border: none;
}

.delete-btn {
  background-color: #ef4444;
  color: white;
  border: none;
}

.form-buttons {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.goal-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
}

.goal-card:hover {
  transform: translateY(-5px);
  border-color: #a855f7;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
}

.goal-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
}

.goal-header {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
}

.goal-topic {
  font-style: italic;
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.deadline {
  font-size: 0.8rem;
  color: #9ca3af;
}

.goal-comment {
  font-size: 0.9rem;
  color: #4b5563;
  margin-bottom: 12px;
}

.progress-percent {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4f46e5;
  margin-bottom: 6px;
}

.progress-bar-container {
  background: #e5e7eb;
  height: 10px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  transition: width 0.3s ease-in-out;
}

.goal-actions button,
.update-buttons button {
  padding: 8px 12px;
  font-size: 0.85rem;
  border-radius: 8px;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.goal-actions button:hover,
.update-buttons button:hover {
  opacity: 0.9;
}

.update-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

  </style>
  