<template>
  <div class="passion-test" ref="vantaRef">
    <h1 class="test-title">Тест на определение твоего направления</h1>

    <div v-if="currentQuestion < questions.length" class="progress-container">
      <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
      <div class="progress-text">
        Вопрос {{ currentQuestion + 1 }} из {{ questions.length }}
      </div>
    </div>

    <div v-if="currentQuestion < questions.length" class="question-box">
      <div class="question-counter">
        Вопрос {{ currentQuestion + 1 }} из {{ questions.length }}
      </div>
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
      <span class="result-emoji">{{ resultData?.emoji }}</span>
      <h2 class="result-title">Ты — {{ resultData?.title }}</h2>
      <p class="result-desc">{{ resultData?.description }}</p>
      
      <div class="result-details">
        <div class="result-section">
          <h4>Твои сильные стороны:</h4>
          <div class="traits-list">
            <span 
              v-for="(trait, index) in resultData?.traits" 
              :key="index" 
              class="trait-tag"
            >
              {{ trait }}
            </span>
          </div>
        </div>
        
        <div class="result-section">
          <h4>Подходящие профессии:</h4>
          <div class="careers-list">
            <span 
              v-for="(career, index) in resultData?.careers" 
              :key="index" 
              class="career-tag"
            >
              {{ career }}
            </span>
          </div>
        </div>
      </div>
      
      <button class="restart-btn" @click="restartTest">
        Пройти тест заново
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export default {
  name: 'PassionTest',
  setup() {
    const vantaRef = ref(null)
    const currentQuestion = ref(0)
    const answers = ref([])
    const result = ref('')
    const isTransitioning = ref(false)
    
    const resultMap = {
      artist: {
        title: 'Художник / Креативный Дизайнер',
        description: 'Твоя душа стремится к красоте и самовыражению. Ты видишь мир через призму искусства и способен создавать уникальные визуальные решения.',
        traits: ['Креативность', 'Эстетическое чутье', 'Воображение', 'Визуальное мышление'],
        careers: ['UX/UI Дизайнер', 'Графический дизайнер', 'Иллюстратор', 'Арт-директор'],
        emoji: '🎨'
      },
      scientist: {
        title: 'Ученый / Исследователь',
        description: 'Ты рожден для открытий! Твой пытливый ум стремится понять, как устроен мир, и найти ответы на самые сложные вопросы.',
        traits: ['Аналитическое мышление', 'Любознательность', 'Терпеливость', 'Системность'],
        careers: ['Data Scientist', 'Биолог', 'Физик', 'Исследователь AI'],
        emoji: '🔬'
      },
      entrepreneur: {
        title: 'Предприниматель / Бизнес-лидер',
        description: 'У тебя предпринимательская жилка! Ты умеешь видеть возможности там, где другие видят проблемы, и готов рисковать ради успеха.',
        traits: ['Лидерство', 'Стратегическое мышление', 'Риск-менеджмент', 'Коммуникабельность'],
        careers: ['Стартап-основатель', 'Бизнес-консультант', 'Продакт-менеджер', 'Инвестор'],
        emoji: '💼'
      },
      programmer: {
        title: 'Программист / Технический Инженер',
        description: 'Код — это твой язык! Ты способен превращать идеи в работающие решения и создавать технологии будущего.',
        traits: ['Логическое мышление', 'Внимание к деталям', 'Решение проблем', 'Техническая экспертиза'],
        careers: ['Fullstack-разработчик', 'DevOps-инженер', 'Архитектор ПО', 'Tech Lead'],
        emoji: '💻'
      },
      doctor: {
        title: 'Врач / Медицинский специалист',
        description: 'Твое призвание — помогать людям! У тебя есть природная способность к диагностике и желание исцелять.',
        traits: ['Эмпатия', 'Ответственность', 'Стрессоустойчивость', 'Научный подход'],
        careers: ['Врач-терапевт', 'Хирург', 'Психиатр', 'Медицинский исследователь'],
        emoji: '⚕️'
      },
      educator: {
        title: 'Преподаватель / Наставник',
        description: 'Ты рожден делиться знаниями! Твоя миссия — вдохновлять других и помогать им раскрывать свой потенциал.',
        traits: ['Терпеливость', 'Коммуникативность', 'Понимание психологии', 'Адаптивность'],
        careers: ['Преподаватель', 'Тренер', 'HR-специалист', 'Коуч'],
        emoji: '👨‍🏫'
      }
    }

    const questions = [
      {
        text: 'Представь, что у тебя есть свободный день. Что ты выберешь?',
        options: [
          { label: 'Создам что-то красивое в Figma или Photoshop', tag: 'artist' },
          { label: 'Прочитаю научную статью или посмотрю документальный фильм', tag: 'scientist' },
          { label: 'Изучу новый бизнес-кейс или послушаю подкаст про стартапы', tag: 'entrepreneur' },
          { label: 'Напишу код или изучу новую технологию', tag: 'programmer' },
          { label: 'Почитаю медицинский журнал или посмотрю лекцию про здоровье', tag: 'doctor' },
          { label: 'Подготовлю материал для обучения или помогу кому-то с учебой', tag: 'educator' }
        ]
      },
      {
        text: 'Когда ты сталкиваешься со сложной проблемой, твой первый инстинкт:',
        options: [
          { label: 'Визуализировать решение и найти креативный подход', tag: 'artist' },
          { label: 'Разложить проблему на части и найти закономерности', tag: 'scientist' },
          { label: 'Подумать о том, как это может принести пользу или прибыль', tag: 'entrepreneur' },
          { label: 'Найти техническое решение или написать алгоритм', tag: 'programmer' },
          { label: 'Подумать о том, как это влияет на людей и их благополучие', tag: 'doctor' },
          { label: 'Объяснить проблему другим и найти коллективное решение', tag: 'educator' }
        ]
      },
      {
        text: 'Что тебя больше всего мотивирует в работе?',
        options: [
          { label: 'Возможность самовыражения и создания чего-то уникального', tag: 'artist' },
          { label: 'Открытие новых знаний и понимание мира', tag: 'scientist' },
          { label: 'Построение успешного бизнеса и достижение финансовых целей', tag: 'entrepreneur' },
          { label: 'Решение технических задач и оптимизация процессов', tag: 'programmer' },
          { label: 'Помощь людям и улучшение их качества жизни', tag: 'doctor' },
          { label: 'Передача знаний и развитие других людей', tag: 'educator' }
        ]
      },
      {
        text: 'Какую книгу ты скорее всего выберешь для чтения?',
        options: [
          { label: '"Кради как художник" или книгу про дизайн-мышление', tag: 'artist' },
          { label: '"Краткая история времени" или научно-популярную литературу', tag: 'scientist' },
          { label: '"От нуля к единице" или биографию успешного предпринимателя', tag: 'entrepreneur' },
          { label: '"Чистый код" или техническую документацию', tag: 'programmer' },
          { label: 'Медицинский справочник или книгу по психологии', tag: 'doctor' },
          { label: '"Искусство объяснять" или книгу по педагогике', tag: 'educator' }
        ]
      },
      {
        text: 'В команде ты обычно:',
        options: [
          { label: 'Отвечаешь за визуальную составляющую и креативные идеи', tag: 'artist' },
          { label: 'Анализируешь данные и предлагаешь обоснованные решения', tag: 'scientist' },
          { label: 'Координируешь работу и думаешь о стратегии', tag: 'entrepreneur' },
          { label: 'Решаешь технические вопросы и автоматизируешь процессы', tag: 'programmer' },
          { label: 'Заботишься о благополучии команды и решаешь конфликты', tag: 'doctor' },
          { label: 'Помогаешь другим развиваться и делишься знаниями', tag: 'educator' }
        ]
      },
      {
        text: 'Твоя идеальная рабочая среда:',
        options: [
          { label: 'Креативное пространство с большими мониторами и вдохновляющим декором', tag: 'artist' },
          { label: 'Тихая лаборатория или кабинет с доступом к исследовательским базам', tag: 'scientist' },
          { label: 'Динамичный офис в центре города с networking-возможностями', tag: 'entrepreneur' },
          { label: 'Удобное рабочее место с мощным компьютером и несколькими мониторами', tag: 'programmer' },
          { label: 'Медицинское учреждение с современным оборудованием', tag: 'doctor' },
          { label: 'Образовательное пространство с интерактивными досками и проекторами', tag: 'educator' }
        ]
      },
      {
        text: 'Что тебя больше всего раздражает в работе?',
        options: [
          { label: 'Отсутствие творческой свободы и строгие рамки', tag: 'artist' },
          { label: 'Поверхностный подход и игнорирование фактов', tag: 'scientist' },
          { label: 'Медленное принятие решений и бюрократия', tag: 'entrepreneur' },
          { label: 'Плохо структурированный код и техническая задолженность', tag: 'programmer' },
          { label: 'Равнодушие к человеческим страданиям', tag: 'doctor' },
          { label: 'Нежелание людей учиться и развиваться', tag: 'educator' }
        ]
      },
      {
        text: 'Как ты предпочитаешь изучать новое?',
        options: [
          { label: 'Через практику, эксперименты и визуальные примеры', tag: 'artist' },
          { label: 'Через исследования, эксперименты и научные статьи', tag: 'scientist' },
          { label: 'Через кейсы, networking и практический опыт', tag: 'entrepreneur' },
          { label: 'Через документацию, tutorials и hands-on практику', tag: 'programmer' },
          { label: 'Через медицинские журналы, конференции и клинические случаи', tag: 'doctor' },
          { label: 'Через обучающие курсы, семинары и обмен опытом', tag: 'educator' }
        ]
      },
      {
        text: 'Какой результат работы приносит тебе наибольшее удовлетворение?',
        options: [
          { label: 'Красивое и функциональное решение, которым восхищаются', tag: 'artist' },
          { label: 'Новое открытие или подтвержденная гипотеза', tag: 'scientist' },
          { label: 'Успешный запуск продукта и рост бизнеса', tag: 'entrepreneur' },
          { label: 'Оптимизированная система, которая работает быстро и стабильно', tag: 'programmer' },
          { label: 'Выздоровевший пациент или решенная медицинская проблема', tag: 'doctor' },
          { label: 'Ученик, который понял сложную тему и применил знания', tag: 'educator' }
        ]
      },
      {
        text: 'Если бы у тебя была возможность изменить мир, ты бы:',
        options: [
          { label: 'Сделал его более красивым и вдохновляющим через искусство', tag: 'artist' },
          { label: 'Решил глобальные проблемы с помощью научных открытий', tag: 'scientist' },
          { label: 'Создал устойчивую экономическую систему и новые возможности', tag: 'entrepreneur' },
          { label: 'Разработал технологии, которые упростят жизнь людей', tag: 'programmer' },
          { label: 'Искоренил болезни и улучшил здоровье человечества', tag: 'doctor' },
          { label: 'Обеспечил качественное образование для всех', tag: 'educator' }
        ]
      },
      {
        text: 'Твой подход к риску:',
        options: [
          { label: 'Готов рисковать ради творческого прорыва', tag: 'artist' },
          { label: 'Рискую только при наличии научных обоснований', tag: 'scientist' },
          { label: 'Риск — это часть игры, главное — правильно его рассчитать', tag: 'entrepreneur' },
          { label: 'Предпочитаю просчитанные риски с резервными планами', tag: 'programmer' },
          { label: 'Очень осторожен, особенно когда речь идет о жизни людей', tag: 'doctor' },
          { label: 'Готов пробовать новые методы, если они помогут ученикам', tag: 'educator' }
        ]
      },
      {
        text: 'Что бы ты выбрал для своего профиля в LinkedIn?',
        options: [
          { label: 'Портфолио с лучшими креативными работами', tag: 'artist' },
          { label: 'Список публикаций и исследовательских проектов', tag: 'scientist' },
          { label: 'Достижения в бизнесе и успешные проекты', tag: 'entrepreneur' },
          { label: 'Технические навыки и примеры кода на GitHub', tag: 'programmer' },
          { label: 'Медицинские сертификаты и опыт работы с пациентами', tag: 'doctor' },
          { label: 'Образовательные достижения и отзывы учеников', tag: 'educator' }
        ]
      }
    ]

    const progress = computed(() => {
      return ((currentQuestion.value + 1) / questions.length) * 100
    })

    const resultData = computed(() => {
      return result.value ? resultMap[result.value] : null
    })

    let vantaEffect = null

    const selectOption = (tag) => {
      isTransitioning.value = true
      answers.value = [...answers.value, tag]
      
      setTimeout(() => {
        if (currentQuestion.value < questions.length - 1) {
          currentQuestion.value += 1
        } else {
          calculateResult([...answers.value, tag])
        }
        isTransitioning.value = false
      }, 300)
    }

    const calculateResult = (finalAnswers) => {
      const count = {}
      finalAnswers.forEach(tag => {
        count[tag] = (count[tag] || 0) + 1
      })
      const sorted = Object.entries(count).sort((a, b) => b[1] - a[1])
      result.value = sorted[0][0]
    }

    const restartTest = () => {
      currentQuestion.value = 0
      answers.value = []
      result.value = ''
    }

    const initVanta = () => {
      if (vantaRef.value && !vantaEffect && typeof window !== 'undefined' && window.THREE) {
        try {
          const scene = new window.THREE.Scene()
          const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
          const renderer = new window.THREE.WebGLRenderer({ alpha: true })
          
          renderer.setSize(window.innerWidth, window.innerHeight)
          renderer.setClearColor(0x000000, 0)
          vantaRef.value.appendChild(renderer.domElement)
          
          const particlesGeometry = new window.THREE.BufferGeometry()
          const particleCount = 100
          const positions = new Float32Array(particleCount * 3)
          
          for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10
          }
          
          particlesGeometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3))
          
          const particlesMaterial = new window.THREE.PointsMaterial({
            color: 0x7f5af0,
            size: 0.02,
            transparent: true,
            opacity: 0.8
          })
          
          const particles = new window.THREE.Points(particlesGeometry, particlesMaterial)
          scene.add(particles)
          
          camera.position.z = 5
          
          const animate = () => {
            requestAnimationFrame(animate)
            particles.rotation.x += 0.001
            particles.rotation.y += 0.001
            renderer.render(scene, camera)
          }
          
          animate()
          
          vantaEffect = { destroy: () => renderer.dispose() }
        } catch (error) {
          console.log('Vanta effect initialization failed:', error)
        }
      }
    }

    onMounted(() => {
      const timer = setTimeout(initVanta, 100)
      
      return () => {
        clearTimeout(timer)
      }
    })

    onUnmounted(() => {
      if (vantaEffect) {
        vantaEffect.destroy()
      }
    })

    return {
      vantaRef,
      currentQuestion,
      answers,
      result,
      isTransitioning,
      questions,
      progress,
      resultData,
      selectOption,
      restartTest
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;800&display=swap');

.passion-test {
  font-family: 'Unbounded', sans-serif;
  position: relative;
  min-height: 100vh;
  padding: 20px;
  background: radial-gradient(ellipse at bottom, #1b0032, #000);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
}

.test-title {
  font-size: clamp(1.8rem, 5vw, 3.6rem);
  text-align: center;
  font-weight: 800;
  margin-bottom: 2rem;
  color: white;
  text-shadow: 0 0 20px #9333ea;
  letter-spacing: 1px;
  line-height: 1.2;
}

.progress-container {
  width: 100%;
  max-width: 650px;
  margin-bottom: 2rem;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 2px;
}

.progress-bar {
  height: 8px;
  background: linear-gradient(90deg, #7f5af0, #45b5ff);
  border-radius: 8px;
  transition: width 0.5s ease;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

.question-box,
.result-box {
  z-index: 2;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: clamp(20px, 5vw, 40px);
  max-width: 650px;
  width: 100%;
  text-align: center;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  transition: all 0.3s ease;
}

.question-counter {
  color: #45b5ff;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.question-text {
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  margin-bottom: 2rem;
  line-height: 1.4;
  font-weight: 600;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  background: linear-gradient(145deg, rgba(75, 0, 124, 0.3), rgba(228, 0, 249, 0.3));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 15px;
  padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 25px);
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.option-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.5s;
}

.option-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(127, 90, 240, 0.3);
  background: linear-gradient(145deg, rgba(75, 0, 124, 0.5), rgba(228, 0, 249, 0.5));
  border-color: rgba(127, 90, 240, 0.5);
}

.option-btn:hover::before {
  left: 100%;
}

.option-btn:active {
  transform: translateY(0) scale(0.98);
}

.result-emoji {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.result-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: #45b5ff;
  margin-bottom: 1rem;
  font-weight: 700;
}

.result-desc {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  color: #ddd;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.result-details {
  background: rgba(255,255,255,0.03);
  border-radius: 15px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: left;
}

.result-section {
  margin-bottom: 1.5rem;
}

.result-section h4 {
  color: #7f5af0;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.traits-list,
.careers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.trait-tag,
.career-tag {
  background: rgba(127, 90, 240, 0.2);
  border: 1px solid rgba(127, 90, 240, 0.3);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #c4b5fd;
}

.career-tag {
  background: rgba(69, 181, 255, 0.2);
  border-color: rgba(69, 181, 255, 0.3);
  color: #93c5fd;
}

.restart-btn {
  background: transparent;
  border: 2px solid #45b5ff;
  color: #45b5ff;
  padding: clamp(10px, 2vw, 12px) clamp(20px, 4vw, 25px);
  border-radius: 30px;
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1rem);
  transition: all 0.3s ease;
  cursor: pointer;
  margin-top: 1rem;
}

.restart-btn:hover {
  background: #45b5ff;
  color: #0a0018;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(69, 181, 255, 0.3);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .passion-test {
    padding: 15px;
  }
  
  .question-box,
  .result-box {
    margin: 0 10px;
    padding: 20px;
  }
  
  .options {
    gap: 10px;
  }
  
  .option-btn {
    padding: 14px 18px;
    font-size: 0.95rem;
  }
  
  .traits-list,
  .careers-list {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .test-title {
    margin-bottom: 1.5rem;
  }
  
  .result-details {
    padding: 1rem;
  }
  
  .trait-tag,
  .career-tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.6rem;
  }
}
</style>