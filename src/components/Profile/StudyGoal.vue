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
    padding: 30px;
    font-family: 'Unbounded', sans-serif;
    background: linear-gradient(to right, #f4f4f8, #fefefe);
    min-height: 100vh;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .section-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #1e1e1e;
  }
  
  .add-goal-btn {
    padding: 8px 18px;
    background-color: #7c3aed;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-family: 'Unbounded', sans-serif;
  }
  
  button {
    font-family: 'Unbounded', sans-serif !important;
  }
  
  .goal-form {
    margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    max-width: 480px;
    gap: 14px;
  }
  
  .goal-form input,
  .goal-form select,
  .goal-form textarea {
    padding: 10px;
    font-size: 13px;
    border-radius: 6px;
    border: 1px solid #c2c2c2;
    font-family: 'Unbounded', sans-serif;
  }
  
  .goal-form button {
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .submit-btn {
    background-color: #7c3aed;
    color: white;
  }
  
  .cancel-btn {
    background-color: #cfcfcf;
    color: #333;
  }
  
  .delete-btn {
    background-color: #dc2626;
    color: white;
  }
  
  .form-buttons {
    display: flex;
    gap: 10px;
  }
  
  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 20px;
  }
  
  .goal-card {
    background: #fefefe;
    padding: 12px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }
  
  .goal-card:hover {
    border: 2px solid #a855f7;
    box-shadow: 0 0 10px #c084fc, 0 0 20px #a855f7;
  }
  
  .goal-header {
    margin-bottom: 6px;
  }
  
  .goal-title-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .deadline {
    margin-top: 2px;
    font-size: 0.75rem;
    color: #666;
  }
  
  .goal-topic {
    font-style: italic;
    margin-bottom: 8px;
    font-size: 13px;
  }
  
  .goal-comment {
    font-size: 12px;
    margin-bottom: 8px;
    color: #555;
  }
  
  .progress-bar-container {
    background: #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
    height: 8px;
    margin-bottom: 4px;
  }
  
  .progress-bar {
    height: 100%;
    background-color: #7c3aed;
    transition: width 0.3s;
  }
  
  .progress-percent {
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 6px;
    color: #333;
  }
  
  .goal-actions button,
  .update-buttons button {
    margin-right: 8px;
    margin-bottom: 8px;
    padding: 6px 10px;
    font-size: 12px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-family: 'Unbounded', sans-serif;
  }
  
  .update-buttons {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }
  </style>
  