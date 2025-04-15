<template>
    <div class="study-plan-container">
      <h2 class="plan-title">🧭 Создай гибкий учебный дневник</h2>
  
      <!-- Setup Form -->
      <div class="form-area" v-if="!planCreated">
        <!-- ⏳ Time Unit Choice -->
        <label>Как ты хочешь планировать?</label>
        <select v-model="form.timeMode">
          <option value="days">По дням</option>
          <option value="weeks">По неделям</option>
          <option value="months">По месяцам</option>
        </select>
  
        <label>Сколько {{ timeLabel }}?</label>
        <input type="number" v-model.number="form.duration" />
  
        <!-- 📘 Subject, Level, Topic Choice -->
        <label>Выбери премиум-предмет</label>
        <select v-model="form.subject">
          <option disabled value="">Выберите...</option>
          <option v-for="s in subjects" :key="s.name" :value="s.name">{{ s.name }}</option>
        </select>
  
        <label v-if="selectedSubject">Уровень</label>
        <select v-if="selectedSubject" v-model="form.level">
          <option v-for="lvl in selectedSubject.levels" :key="lvl.level" :value="lvl.level">Уровень {{ lvl.level }}</option>
        </select>
  
        <label v-if="selectedLevel">Темы</label>
        <select v-if="selectedLevel" v-model="form.topic">
          <option v-for="t in selectedLevel.topics" :key="t">{{ t }}</option>
        </select>
  
        <label>Сколько уроков всего?</label>
        <input type="number" v-model.number="form.totalLessons" placeholder="например: 30" />
  
        <button @click="generatePlan">📘 Построить дневник</button>
      </div>
  
      <!-- 📅 Schedule View -->
      <div v-else>
        <h3>📔 Учебный дневник по теме: {{ form.subject }} / Уровень {{ form.level }} / {{ form.topic }}</h3>
        <div class="lesson-grid">
          <div class="day-card" v-for="(entry, index) in schedule" :key="index">
            <h4>{{ timeLabel }} {{ index + 1 }}</h4>
            <ul>
              <li v-for="lesson in entry.lessons" :key="lesson">📖 {{ lesson }}</li>
            </ul>
            <p class="motivation">{{ getMotivation(index) }}</p>
          </div>
        </div>
        <button @click="resetPlan" class="reset-btn">🔁 Сбросить</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'StudyPlan',
    data() {
      return {
        form: {
          timeMode: 'days',
          duration: 7,
          subject: '',
          level: '',
          topic: '',
          totalLessons: 0
        },
        planCreated: false,
        schedule: [],
        subjects: [
          {
            name: 'Математика',
            levels: [
              { level: 1, topics: ['Алгебра', 'Геометрия'] },
              { level: 2, topics: ['Тригонометрия', 'Уравнения'] }
            ]
          },
          {
            name: 'Программирование',
            levels: [
              { level: 1, topics: ['HTML', 'CSS'] },
              { level: 2, topics: ['JavaScript', 'Vue'] }
            ]
          },
          {
            name: 'История',
            levels: [
              { level: 1, topics: ['Средневековье', 'Великие Империи'] },
              { level: 2, topics: ['20 век', 'Мировые войны'] }
            ]
          }
        ]
      };
    },
    computed: {
      selectedSubject() {
        return this.subjects.find(s => s.name === this.form.subject);
      },
      selectedLevel() {
        return this.selectedSubject?.levels.find(lvl => lvl.level === this.form.level);
      },
      timeLabel() {
        return this.form.timeMode === 'weeks' ? 'недель' : this.form.timeMode === 'months' ? 'месяцев' : 'дней';
      }
    },
    methods: {
      generatePlan() {
        const total = this.form.totalLessons || 20;
        const days = this.form.duration * (this.form.timeMode === 'weeks' ? 7 : this.form.timeMode === 'months' ? 30 : 1);
        const daily = Math.ceil(total / days);
        let lessonCounter = 1;
        const plan = [];
  
        for (let i = 0; i < days; i++) {
          const lessonsToday = [];
          for (let j = 0; j < daily; j++) {
            if (lessonCounter <= total)
              lessonsToday.push(`${this.form.topic} — Урок ${lessonCounter++}`);
          }
          plan.push({ lessons: lessonsToday });
        }
  
        this.schedule = plan;
        this.planCreated = true;
      },
      resetPlan() {
        this.planCreated = false;
        this.schedule = [];
        this.form = {
          timeMode: 'days',
          duration: 7,
          subject: '',
          level: '',
          topic: '',
          totalLessons: 0
        };
      },
      getMotivation(index) {
        const quotes = [
          '💡 Сегодня — ещё один шаг к цели!',
          '🔥 Не сдавайся, ты на правильном пути!',
          '✨ Твоя дисциплина — твоя суперсила!',
          '🚀 Один день = одна победа!',
          '🌈 Продолжай — ты уже ближе, чем думаешь!'
        ];
        return quotes[index % quotes.length];
      }
    }
  };
  </script>
  
  <style scoped>
  .study-plan-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: 'Unbounded', sans-serif;
  }
  
  .plan-title {
    text-align: center;
    margin-bottom: 30px;
    font-size: 1.8rem;
  }
  
  .form-area {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #fefefe;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  }
  
  input, select {
    padding: 12px;
    font-size: 14px;
    border-radius: 12px;
    border: 1px solid #ccc;
    font-family: 'Unbounded', sans-serif;
  }
  
  button {
    background-color: #7c3aed;
    color: white;
    font-weight: bold;
    padding: 14px 24px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.3s ease;
    font-family: 'Unbounded', sans-serif;
  }
  
  button:hover {
    background-color: #2e1065;
  }
  
  .lesson-grid {
    margin-top: 30px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }
  
  .day-card {
    background: white;
    padding: 16px;
    border-radius: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    transition: 0.3s;
  }
  
  .day-card:hover {
    box-shadow: 0 0 20px #a855f7;
  }
  
  h4 {
    margin-bottom: 10px;
    color: #4b0082;
  }
  
  ul {
    list-style: none;
    padding-left: 0;
  }
  
  li {
    margin-bottom: 6px;
    font-size: 14px;
  }
  
  .motivation {
    margin-top: 10px;
    font-size: 12px;
    color: #777;
    font-style: italic;
  }
  
  .reset-btn {
    margin-top: 30px;
    background: #cbd5e1;
    color: black;
    font-weight: 600;
  }
  </style>
  