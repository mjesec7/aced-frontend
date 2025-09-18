<template>
  <section class="passion-test" id="passion-test" ref="vantaRef">
    <div class="test-content">
      <h1 class="test-title">Найди своё направление</h1>
      <p class="test-subtitle">Ответь на несколько вопросов, чтобы определить свою страсть</p>

      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${(currentQuestion / questions.length) * 100}%` }"
          ></div>
        </div>
        <span class="progress-text">{{ currentQuestion }} / {{ questions.length }}</span>
      </div>

      <div v-if="currentQuestion < questions.length" class="question-box">
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

      <div v-else class="result-box">
        <h2 class="result-title">🚀 Ты — {{ resultMap[result] }}</h2>
        <p class="result-desc">{{ resultDescriptions[result] }}</p>
        <div class="result-details">
          <h3>Подходящие профессии:</h3>
          <p class="careers">{{ careerSuggestions[result] }}</p>
          <h3>Рекомендуем развивать:</h3>
          <p class="skills">{{ skillSuggestions[result] }}</p>
        </div>
        <button class="restart-btn" @click="restartTest">Пройти тест заново</button>
      </div>
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
  creative: 'Креативный Визионер',
  analytical: 'Аналитический Мыслитель',
  social: 'Социальный Лидер',
  technical: 'Технический Гений',
  entrepreneurial: 'Предпринимательский Дух',
  caring: 'Заботливый Помощник',
  investigative: 'Исследователь Истины',
  practical: 'Практический Мастер',
  communicative: 'Коммуникативный Талант',
  strategic: 'Стратегический Мыслитель'
}

const resultDescriptions = {
  creative: 'Ты обладаешь уникальным взглядом на мир и способностью создавать прекрасное. Твоя креативность и художественное видение могут изменить восприятие окружающих.',
  analytical: 'Ты мыслишь логически и любишь докапываться до сути. Твоя способность анализировать данные и находить закономерности делает тебя незаменимым в мире науки.',
  social: 'Ты прирожденный лидер, который умеет вдохновлять и объединять людей. Твоя харизма и способность к коммуникации открывают безграничные возможности.',
  technical: 'Ты понимаешь как работают сложные системы и можешь создавать технологии будущего. Твой технический склад ума — это твоя суперсила.',
  entrepreneurial: 'Ты видишь возможности там, где другие видят проблемы. Твоя способность к инновациям и готовность к риску делают тебя прирожденным предпринимателем.',
  caring: 'Ты искренне заботишься о благополучии других и готов посвятить свою жизнь помощи людям. Твоя эмпатия и желание исцелять — это дар.',
  investigative: 'Ты жаждешь знаний и готов погрузиться в самые сложные вопросы. Твоя любознательность и методичность помогают раскрывать тайны мира.',
  practical: 'Ты умеешь воплощать идеи в реальность своими руками. Твоя способность создавать и улучшать физический мир делает жизнь лучше.',
  communicative: 'Ты мастер слова и можешь доносить сложные идеи простым языком. Твой талант к общению и обучению вдохновляет других.',
  strategic: 'Ты видишь большую картину и умеешь планировать на несколько шагов вперед. Твое стратегическое мышление помогает достигать амбициозных целей.'
}

const careerSuggestions = {
  creative: 'Дизайнер, Художник, Архитектор, Режиссер, Сценарист, Фотограф, Аниматор, UX/UI дизайнер, Арт-директор',
  analytical: 'Ученый, Аналитик данных, Статистик, Математик, Физик, Химик, Биолог, Экономист, Финансовый аналитик',
  social: 'HR-менеджер, Политик, Психолог, Социальный работник, Менеджер по продажам, Event-менеджер, PR-специалист',
  technical: 'Программист, Инженер, DevOps, Системный администратор, Кибербезопасность, Робототехник, Data Scientist',
  entrepreneurial: 'Основатель стартапа, Бизнес-консультант, Инвестор, Продакт-менеджер, Маркетолог, Венчурный капиталист',
  caring: 'Врач, Медсестра, Психотерапевт, Ветеринар, Социальный работник, Учитель начальных классов, Реабилитолог',
  investigative: 'Журналист, Детектив, Юрист, Историк, Археолог, Криминалист, Исследователь, Научный сотрудник',
  practical: 'Инженер-механик, Строитель, Электрик, Повар, Дизайнер интерьера, Ремесленник, Техник',
  communicative: 'Учитель, Журналист, Переводчик, Копирайтер, Блогер, Ведущий, Тренер, Лектор, Коуч',
  strategic: 'Консультант по управлению, CEO, Аналитик, Стратег, Планировщик, Проджект-менеджер, Военный стратег'
}

const skillSuggestions = {
  creative: 'Дизайн-мышление, Photoshop/Illustrator, 3D-моделирование, Теория цвета, Композиция, Креативное письмо',
  analytical: 'Python/R, SQL, Статистика, Машинное обучение, Excel, Критическое мышление, Математическое моделирование',
  social: 'Лидерство, Эмоциональный интеллект, Публичные выступления, Психология, Переговоры, Командная работа',
  technical: 'Программирование, Системное мышление, DevOps, Облачные технологии, Алгоритмы, Базы данных',
  entrepreneurial: 'Бизнес-планирование, Маркетинг, Продажи, Финансовая грамотность, Нетворкинг, Управление рисками',
  caring: 'Медицинские знания, Эмпатия, Коммуникация с пациентами, Стрессоустойчивость, Этика, Психология',
  investigative: 'Исследовательские методы, Критическое мышление, Анализ информации, Журналистика, Право, Логика',
  practical: 'Инженерные навыки, Работа руками, Техническое мышление, CAD-программы, Управление проектами',
  communicative: 'Педагогика, Ораторское мастерство, Журналистика, Копирайтинг, Языки, Медиаграмотность',
  strategic: 'Стратегическое планирование, Аналитика, Управление проектами, Экономика, Системное мышление'
}

const questions = [
  {
    text: 'Как ты предпочитаешь проводить свободное время?',
    options: [
      { label: 'Рисую, фотографирую или создаю что-то новое', tag: 'creative' },
      { label: 'Читаю научные статьи или решаю логические задачи', tag: 'analytical' },
      { label: 'Общаюсь с друзьями или участвую в групповых активностях', tag: 'social' },
      { label: 'Изучаю новые технологии или программирую', tag: 'technical' }
    ]
  },
  {
    text: 'Что тебе больше всего нравится в учебе?',
    options: [
      { label: 'Когда можно выразить свои идеи творчески', tag: 'creative' },
      { label: 'Когда нужно анализировать и делать выводы', tag: 'analytical' },
      { label: 'Когда работаю в команде над проектами', tag: 'social' },
      { label: 'Когда изучаю, как что-то работает технически', tag: 'technical' }
    ]
  },
  {
    text: 'Какую проблему ты бы хотел решить в первую очередь?',
    options: [
      { label: 'Сделать мир более красивым и вдохновляющим', tag: 'creative' },
      { label: 'Найти лекарство от серьезной болезни', tag: 'investigative' },
      { label: 'Помочь людям лучше понимать друг друга', tag: 'communicative' },
      { label: 'Создать технологию, которая упростит жизнь', tag: 'technical' }
    ]
  },
  {
    text: 'Как ты принимаешь важные решения?',
    options: [
      { label: 'Следую интуиции и чувствам', tag: 'creative' },
      { label: 'Анализирую все факты и данные', tag: 'analytical' },
      { label: 'Советуюсь с людьми, которым доверяю', tag: 'social' },
      { label: 'Взвешиваю плюсы и минусы логически', tag: 'strategic' }
    ]
  },
  {
    text: 'Что мотивирует тебя больше всего?',
    options: [
      { label: 'Возможность создать что-то уникальное', tag: 'creative' },
      { label: 'Желание понять, как устроен мир', tag: 'investigative' },
      { label: 'Помощь другим людям', tag: 'caring' },
      { label: 'Достижение амбициозных целей', tag: 'entrepreneurial' }
    ]
  },
  {
    text: 'В какой среде ты чувствуешь себя наиболее комфортно?',
    options: [
      { label: 'В творческой студии или мастерской', tag: 'creative' },
      { label: 'В лаборатории или исследовательском центре', tag: 'analytical' },
      { label: 'В офисе с активной командой', tag: 'social' },
      { label: 'В мастерской, где можно создавать руками', tag: 'practical' }
    ]
  },
  {
    text: 'Какой тип задач тебе интереснее всего решать?',
    options: [
      { label: 'Открытые задачи с множеством творческих решений', tag: 'creative' },
      { label: 'Сложные аналитические головоломки', tag: 'analytical' },
      { label: 'Задачи, связанные с координацией людей', tag: 'social' },
      { label: 'Технические проблемы с четким алгоритмом решения', tag: 'technical' }
    ]
  },
  {
    text: 'Что бы ты выбрал для изучения на выходных?',
    options: [
      { label: 'Курс по графическому дизайну или искусству', tag: 'creative' },
      { label: 'Лекции по квантовой физике или биологии', tag: 'investigative' },
      { label: 'Тренинг по лидерству или психологии', tag: 'social' },
      { label: 'Мастер-класс по программированию', tag: 'technical' }
    ]
  },
  {
    text: 'Как ты предпочитаешь работать над проектами?',
    options: [
      { label: 'Сам, чтобы полностью реализовать свое видение', tag: 'creative' },
      { label: 'В небольшой команде экспертов', tag: 'analytical' },
      { label: 'В большой команде с четким распределением ролей', tag: 'social' },
      { label: 'С ментором, который направляет обучение', tag: 'communicative' }
    ]
  },
  {
    text: 'Что тебя больше всего вдохновляет в других людях?',
    options: [
      { label: 'Их способность видеть красоту в обычных вещах', tag: 'creative' },
      { label: 'Их глубокие знания и экспертиза', tag: 'analytical' },
      { label: 'Их умение вдохновлять и мотивировать', tag: 'social' },
      { label: 'Их способность объяснять сложные вещи простыми словами', tag: 'communicative' }
    ]
  },
  {
    text: 'Какой результат работы приносит тебе наибольшее удовлетворение?',
    options: [
      { label: 'Красивый продукт, которым восхищаются люди', tag: 'creative' },
      { label: 'Открытие или доказательство важной теории', tag: 'investigative' },
      { label: 'Помощь кому-то в решении проблемы', tag: 'caring' },
      { label: 'Создание системы, которая работает безупречно', tag: 'technical' }
    ]
  },
  {
    text: 'В каком направлении ты видишь себя через 10 лет?',
    options: [
      { label: 'Признанным творцом в своей области', tag: 'creative' },
      { label: 'Ведущим исследователем или ученым', tag: 'investigative' },
      { label: 'Лидером команды или организации', tag: 'social' },
      { label: 'Успешным предпринимателем с собственным бизнесом', tag: 'entrepreneurial' }
    ]
  },
  {
    text: 'Что для тебя важнее в работе?',
    options: [
      { label: 'Свобода самовыражения и творчества', tag: 'creative' },
      { label: 'Интеллектуальные вызовы и постоянное обучение', tag: 'analytical' },
      { label: 'Возможность влиять на жизни людей', tag: 'caring' },
      { label: 'Стабильность и возможность создавать конкретные вещи', tag: 'practical' }
    ]
  },
  {
    text: 'Как ты относишься к риску и неопределенности?',
    options: [
      { label: 'Это часть творческого процесса', tag: 'creative' },
      { label: 'Предпочитаю минимизировать риски через анализ', tag: 'analytical' },
      { label: 'Готов рисковать ради больших возможностей', tag: 'entrepreneurial' },
      { label: 'Предпочитаю стабильность и предсказуемость', tag: 'practical' }
    ]
  },
  {
    text: 'Какую роль ты обычно берешь на себя в групповых проектах?',
    options: [
      { label: 'Генератор идей и креативных решений', tag: 'creative' },
      { label: 'Аналитик, который изучает данные', tag: 'analytical' },
      { label: 'Координатор, который организует работу команды', tag: 'social' },
      { label: 'Стратег, который планирует долгосрочные цели', tag: 'strategic' }
    ]
  },
  {
    text: 'Что бы ты хотел изменить в современном мире?',
    options: [
      { label: 'Сделать его более эстетичным и вдохновляющим', tag: 'creative' },
      { label: 'Решить глобальные проблемы через науку', tag: 'investigative' },
      { label: 'Улучшить систему здравоохранения и помощи людям', tag: 'caring' },
      { label: 'Создать более эффективные технологии', tag: 'technical' }
    ]
  },
  {
    text: 'Как ты предпочитаешь получать обратную связь?',
    options: [
      { label: 'Через эмоциональную реакцию на мою работу', tag: 'creative' },
      { label: 'Через детальный анализ и конструктивную критику', tag: 'analytical' },
      { label: 'Через открытое обсуждение в группе', tag: 'social' },
      { label: 'Через конкретные примеры и практические советы', tag: 'practical' }
    ]
  },
  {
    text: 'Что тебя больше всего мотивирует в изучении нового?',
    options: [
      { label: 'Возможность применить знания творчески', tag: 'creative' },
      { label: 'Понимание фундаментальных принципов', tag: 'analytical' },
      { label: 'Способность поделиться знаниями с другими', tag: 'communicative' },
      { label: 'Возможность сразу применить на практике', tag: 'practical' }
    ]
  },
  {
    text: 'Какой тип задач заставляет тебя терять счет времени?',
    options: [
      { label: 'Создание визуального или художественного контента', tag: 'creative' },
      { label: 'Исследование сложной научной проблемы', tag: 'investigative' },
      { label: 'Планирование стратегии или бизнес-плана', tag: 'strategic' },
      { label: 'Написание кода или отладка программы', tag: 'technical' }
    ]
  },
  {
    text: 'В каких ситуациях ты чувствуешь себя наиболее успешным?',
    options: [
      { label: 'Когда создаю что-то, чего раньше не существовало', tag: 'creative' },
      { label: 'Когда решаю сложную проблему с помощью логики', tag: 'analytical' },
      { label: 'Когда вижу, как мой бизнес или проект растет', tag: 'entrepreneurial' },
      { label: 'Когда помогаю другим развиваться и учиться', tag: 'communicative' }
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
  const answerPattern = answers.value
  
  const passionProfile = analyzePassionProfile(answerPattern)
  result.value = passionProfile
}

function analyzePassionProfile(answers) {
  const preferences = {}
  answers.forEach(tag => {
    preferences[tag] = (preferences[tag] || 0) + 1
  })
  
  const passionMaps = {
    creative: () => {
      return (preferences.creative >= 3) && 
             (preferences.analytical <= 2) &&
             (answers.includes('creative') && answers.includes('creative'))
    },
    analytical: () => {
      return (preferences.analytical >= 3) &&
             (preferences.investigative >= 1) &&
             (preferences.creative <= 2)
    },
    social: () => {
      return (preferences.social >= 2) &&
             (preferences.communicative >= 1) &&
             (preferences.technical <= 2)
    },
    technical: () => {
      return (preferences.technical >= 3) &&
             (preferences.practical >= 1) &&
             (preferences.social <= 2)
    },
    entrepreneurial: () => {
      return (preferences.entrepreneurial >= 2) &&
             (preferences.strategic >= 1) &&
             (preferences.caring <= 1)
    },
    caring: () => {
      return (preferences.caring >= 1) &&
             (preferences.communicative >= 2) &&
             (preferences.entrepreneurial <= 1)
    },
    investigative: () => {
      return (preferences.investigative >= 2) &&
             (preferences.analytical >= 2) &&
             (preferences.social <= 2)
    },
    practical: () => {
      return (preferences.practical >= 2) &&
             (preferences.technical >= 1) &&
             (preferences.creative <= 2)
    },
    communicative: () => {
      return (preferences.communicative >= 3) &&
             (preferences.caring >= 1) &&
             (preferences.technical <= 2)
    },
    strategic: () => {
      return (preferences.strategic >= 2) &&
             (preferences.entrepreneurial >= 1) &&
             (preferences.practical >= 1)
    }
  }
  
  for (const [passion, checkFunction] of Object.entries(passionMaps)) {
    if (checkFunction()) {
      return passion
    }
  }
  
  const sortedPreferences = Object.entries(preferences)
    .sort((a, b) => b[1] - a[1])
  
  return sortedPreferences[0][0]
}

function restartTest() {
  currentQuestion.value = 0
  answers.value = []
  result.value = ''
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&display=swap');

.passion-test {
  font-family: 'Unbounded', sans-serif;
  position: relative;
  min-height: 100vh;
  padding: 40px 20px;
  background-color: #0a0018;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.test-content {
  z-index: 2;
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.test-title {
  font-size: 2.8rem;
  font-weight: 700;
  text-align: center;
  color: #fff;
  margin-bottom: 0.5rem;
}
.test-subtitle {
  font-size: 1.1rem;
  color: #a3a3c2;
  text-align: center;
  margin-bottom: 2rem;
}
.progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 400px;
}
.progress-bar {
  flex-grow: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  border-radius: 99px;
  transition: width 0.3s ease;
}
.question-box, .result-box {
  background: rgba(25, 22, 69, 0.7);
  border: 1px solid #2c2c54;
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2.5rem;
  width: 100%;
  text-align: center;
}
.question-text {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  line-height: 1.4;
}
.options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.option-btn {
  background: #191645;
  border: 1px solid #2c2c54;
  color: #e0e7ff;
  border-radius: 0.75rem;
  padding: 1rem;
  font-size: 0.9rem;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
  text-align: left;
}
.option-btn:hover {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
  transform: translateY(-2px);
}
.result-title {
  font-size: 2rem;
  color: #c084fc;
  margin-bottom: 1rem;
}
.result-desc {
  font-size: 1.1rem;
  color: #d1d5db;
  margin-bottom: 2rem;
  line-height: 1.6;
}
.result-details {
  text-align: left;
  background: rgba(0,0,0,0.2);
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}
.result-details h3 {
  color: #c084fc;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.careers, .skills {
  font-size: 0.9rem;
  color: #d1d5db;
  line-height: 1.5;
}
.restart-btn {
  background: transparent;
  border: 1px solid #7c3aed;
  color: #c084fc;
  padding: 0.75rem 1.5rem;
  border-radius: 99px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Unbounded', sans-serif;
}
.restart-btn:hover {
  background: #7c3aed;
  color: #fff;
}

@media (max-width: 768px) {
  .test-title { font-size: 2.2rem; }
  .question-box, .result-box { padding: 1.5rem; }
}

@media (max-width: 640px) {
  .options { grid-template-columns: 1fr; }
  .test-title { font-size: 1.8rem; }
  .test-subtitle { font-size: 1rem; }
  .question-text { font-size: 1.2rem; }
}
</style>