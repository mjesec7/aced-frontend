<template>
  <section class="passion-test" ref="vantaRef">
    <h1 class="test-title">Тест на определение твоего направления</h1>

    <!-- Question Mode -->
    <div
      v-if="currentQuestion < questions.length"
      class="question-box animate-slide"
    >
      <h2 class="question-text">{{ questions[currentQuestion].text }}</h2>
      <div class="options">
        <button
          v-for="(option, index) in questions[currentQuestion].options"
          :key="index"
          @click="selectOption(option.tag)"
          class="option-btn"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Result Mode -->
    <div v-else class="result-box animate-slide">
      <h2 class="result-title">🚀 Ты — {{ resultMap[result] }}</h2>
      <p class="result-desc">Похоже, твоя страсть — это {{ resultMap[result] }}. Мир ждет тебя!</p>
      <button class="restart-btn" @click="restartTest">Начать заново</button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import NET from 'vanta/src/vanta.net'

const vantaRef = ref(null)
let vantaEffect = null

onMounted(() => {
  vantaEffect = NET({
    el: vantaRef.value,
    THREE,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    scale: 1,
    scaleMobile: 1,
    color: 0x7f5af0,
    backgroundColor: 0x0a0018
  })
})

onBeforeUnmount(() => {
  if (vantaEffect) vantaEffect.destroy()
})

const currentQuestion = ref(0)
const answers = ref([])
const result = ref('')

const resultMap = {
  artist: 'Художник / Дизайнер',
  scientist: 'Ученый / Исследователь',
  entrepreneur: 'Предприниматель',
  programmer: 'Программист / Инженер',
  doctor: 'Доктор / Медик',
  educator: 'Преподаватель / Психолог'
}

const questions = [
  {
    text: 'Что тебе интереснее всего изучать?',
    options: [
      { label: 'Искусство', tag: 'artist' },
      { label: 'Наука', tag: 'scientist' },
      { label: 'Бизнес', tag: 'entrepreneur' },
      { label: 'Кодинг', tag: 'programmer' }
    ]
  },
  {
    text: 'Как ты решаешь проблемы?',
    options: [
      { label: 'Творчески', tag: 'artist' },
      { label: 'Аналитически', tag: 'scientist' },
      { label: 'С логикой', tag: 'programmer' },
      { label: 'Через сочувствие', tag: 'educator' }
    ]
  },
  {
    text: 'Что тебе ближе?',
    options: [
      { label: 'Помогать людям', tag: 'doctor' },
      { label: 'Придумывать идеи', tag: 'entrepreneur' },
      { label: 'Исследовать', tag: 'scientist' },
      { label: 'Проектировать интерфейсы', tag: 'artist' }
    ]
  },
  {
    text: 'Ты больше любишь...',
    options: [
      { label: 'Преподавать', tag: 'educator' },
      { label: 'Кодить', tag: 'programmer' },
      { label: 'Создавать визуал', tag: 'artist' },
      { label: 'Заботиться о здоровье', tag: 'doctor' }
    ]
  },
  {
    text: 'Твой идеальный проект — это...',
    options: [
      { label: 'Стартап', tag: 'entrepreneur' },
      { label: 'Научное исследование', tag: 'scientist' },
      { label: 'Приложение', tag: 'programmer' },
      { label: 'Картина или фильм', tag: 'artist' }
    ]
  },
  {
    text: 'Где бы ты хотел работать?',
    options: [
      { label: 'В студии', tag: 'artist' },
      { label: 'В лаборатории', tag: 'scientist' },
      { label: 'В больнице', tag: 'doctor' },
      { label: 'Удаленно', tag: 'programmer' }
    ]
  },
  {
    text: 'Что тебя вдохновляет?',
    options: [
      { label: 'Красота', tag: 'artist' },
      { label: 'Технологии', tag: 'programmer' },
      { label: 'Помощь другим', tag: 'educator' },
      { label: 'Риски и бизнес', tag: 'entrepreneur' }
    ]
  },
  {
    text: 'Как ты обучаешься лучше всего?',
    options: [
      { label: 'На практике', tag: 'programmer' },
      { label: 'Через обсуждение', tag: 'educator' },
      { label: 'Читая и анализируя', tag: 'scientist' },
      { label: 'Наблюдая и создавая', tag: 'artist' }
    ]
  },
  {
    text: 'Какая суперсила тебе ближе?',
    options: [
      { label: 'Исцелять', tag: 'doctor' },
      { label: 'Создавать', tag: 'artist' },
      { label: 'Программировать всё', tag: 'programmer' },
      { label: 'Предсказывать тренды', tag: 'entrepreneur' }
    ]
  },
  {
    text: 'Что ты чаще всего ищешь в интернете?',
    options: [
      { label: 'Уроки дизайна', tag: 'artist' },
      { label: 'Бизнес-идеи', tag: 'entrepreneur' },
      { label: 'Статьи по науке', tag: 'scientist' },
      { label: 'Как устроен мозг', tag: 'educator' }
    ]
  }
]

function selectOption(tag) {
  answers.value.push(tag)
  setTimeout(() => {
    currentQuestion.value++
    if (currentQuestion.value === questions.length) {
      calculateResult()
    }
  }, 100)
}

function calculateResult() {
  const count = {}
  answers.value.forEach(tag => {
    count[tag] = (count[tag] || 0) + 1
  })
  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1])
  result.value = sorted[0][0]
}

function restartTest() {
  currentQuestion.value = 0
  answers.value = []
  result.value = ''
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&display=swap');





.passion-test {
  font-family: 'Unbounded', sans-serif;
  position: relative;
  min-height: 100vh;
  padding: 60px 20px;
  background: radial-gradient(ellipse at bottom, #1b0032, #000);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.test-title {
  font-size: 3.6rem;
  text-align: center;
  font-family: 'Unbounded', sans-serif;
  font-weight: 800;
  margin-top: -60px;
  margin-bottom: 50px;
  color: white;
  -webkit-text-stroke: 1.5px #9333ea; /* Neon purple outline */
  text-stroke: 1.5px #9333ea;
  background: none;
  letter-spacing: 1px;
}




.question-box,
.result-box {
  z-index: 2;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(18px);
  border-radius: 20px;
  padding: 40px;
  max-width: 650px;
  width: 100%;
  text-align: center;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  transition: opacity 0.3s ease;
}

.fade {
  opacity: 0.3;
}

.question-text {
  font-size: 1.5rem;
  margin-bottom: 30px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-btn {
  background: linear-gradient(145deg, #4b007c, #e400f9);
  border: none;
  border-radius: 50px;
  padding: 14px 25px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(87, 145, 255, 0.4);
}

.result-title {
  font-size: 2rem;
  color: #45b5ff;
  margin-bottom: 20px;
}

.result-desc {
  font-size: 1.1rem;
  color: #ddd;
  margin-bottom: 30px;
}

.restart-btn {
  background: transparent;
  border: 2px solid #45b5ff;
  color: #45b5ff;
  padding: 12px 25px;
  border-radius: 30px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.restart-btn:hover {
  background: #45b5ff;
  color: #0a0018;
}
</style>