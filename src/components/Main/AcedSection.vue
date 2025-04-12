<template>
  <section class="aced-section" id="aced">
    <div class="left-content">
      <h1 class="headline">Начни своё обучение <br />уже сегодня</h1>
      <p class="context-text">Чтобы пройти курсы — войдите в систему</p>
      <button class="start-login-btn" @click="triggerLogin">Начать обучение</button>
    </div>

    <div class="subjects-abstract-layout">
      <div class="subject-card subject-history floating" @click="showInfo('history')">
        <img src="@/assets/icons/history1.svg" class="subject-icon" />
        <h3>История</h3>
      </div>
      <div class="subject-card subject-biology floating" @click="showInfo('biology')">
        <img src="@/assets/icons/biology1.svg" class="subject-icon" />
        <h3>Биология</h3>
      </div>
      <div class="subject-card subject-coding floating" @click="showInfo('coding')">
        <img src="@/assets/icons/coding1.svg" class="subject-icon" />
        <h3>Кодинг</h3>
      </div>
      <div class="subject-card subject-math floating" @click="showInfo('math')">
        <img src="@/assets/icons/math1.svg" class="subject-icon" />
        <h3>Математика</h3>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="selectedSubject" class="modal-overlay" @click="selectedSubject = null">
      <div class="modal-content" @click.stop>
        <span class="close-btn" @click="selectedSubject = null">×</span>
        <img :src="modalInfo[selectedSubject].image" class="modal-icon" />
        <h2>{{ modalInfo[selectedSubject].label }}</h2>
        <p>{{ modalInfo[selectedSubject].description }}</p>
        <p class="fun-fact"><strong>Факт:</strong> {{ modalInfo[selectedSubject].funFact }}</p>
        <p><strong>Кому подойдёт:</strong> {{ modalInfo[selectedSubject].audience }}</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "AcedSection",
  data() {
    return {
      selectedSubject: null,
      modalInfo: {
        history: {
          label: "История",
          image: require('@/assets/icons/history2.svg'),
          description: "Изучи развитие человечества, цивилизаций и ключевых событий.",
          funFact: "История помогает предсказывать будущее, изучая прошлое.",
          audience: "Тем, кто интересуется обществом, культурой и прошлым."
        },
        biology: {
          label: "Биология",
          image: require('@/assets/icons/biology2.svg'),
          description: "Пойми, как устроена жизнь: от клетки до экосистемы.",
          funFact: "В твоем теле больше бактерий, чем собственных клеток.",
          audience: "Любителям природы, здоровья и науки о жизни."
        },
        coding: {
          label: "Кодинг",
          image: require('@/assets/icons/coding2.svg'),
          description: "Создавай сайты, игры и приложения с помощью программирования.",
          funFact: "Первая программистка была женщина — Ада Лавлейс.",
          audience: "Тем, кто хочет строить цифровое будущее."
        },
        math: {
          label: "Математика",
          image: require('@/assets/icons/math2.svg'),
          description: "Развивай логическое мышление и понимание мира через числа и формулы.",
          funFact: "Математика — универсальный язык Вселенной.",
          audience: "Тем, кто любит точность, закономерности и логику."
        }
      }
    };
  },
  methods: {
    triggerLogin() {
      const hero = document.getElementById("hero");
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          window.dispatchEvent(new Event("open-login-modal"));
        }, 600);
      } else {
        window.dispatchEvent(new Event("open-login-modal"));
      }
    },
    showInfo(subjectKey) {
      if (this.modalInfo[subjectKey]) {
        this.selectedSubject = subjectKey;
      }
    }
  }
};
</script>




<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&display=swap");

.aced-section {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 60px;
  padding: 80px;
  background: radial-gradient(ellipse at center, #0a001a, #1a002f);
  flex-wrap: wrap;
  color: white;
  z-index: 1;
}

.left-content {
  flex: 1;
  max-width: 460px;
}

.headline {
  font-size: 2.7rem;
  font-family: 'Unbounded', sans-serif;
  background: linear-gradient(to right, #9333ea, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.context-text {
  font-size: 1rem;
  font-family: 'Unbounded';
  color: #bfbfe5;
  margin-bottom: 20px;
}

.start-login-btn {
  padding: 12px 28px;
  font-family: 'Unbounded', sans-serif;
  font-size: 1rem;
  border-radius: 30px;
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  color: white;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.4s ease;
}

.start-login-btn:hover {
  background: black;
  color: #c084fc;
  box-shadow: 0 0 20px rgba(192, 132, 252, 0.6);
  transform: scale(1.03);
}

.subjects-abstract-layout {
  position: relative;
  flex: 1;
  min-height: 480px;
}

.subject-card {
  position: absolute;
  width: 280px;
  height: 180px;
  padding: 25px;
  border-radius: 25px;
  text-align: center;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  pointer-events: auto;
  z-index: 2;
}

.subject-card h3 {
  font-size: 1.3rem;
  margin-top: 10px;
  font-family: 'Unbounded', sans-serif;
}

.subject-icon {
  width: 55px;
  height: 55px;
  margin-bottom: 8px;
}

/* Floating animation */
.floating {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Placement & glow */
.subject-history {
  top: 0;
  right: 0;
  box-shadow: 0 0 30px rgba(255, 255, 0, 0.5);
}
.subject-biology {
  bottom: 30px;
  left: 30px;
  box-shadow: 0 0 30px rgba(0, 255, 120, 0.5);
}
.subject-coding {
  bottom: 0;
  right: 70px;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
}

.subject-history:hover {
  box-shadow: 0 0 45px rgba(255, 255, 0, 0.8);
}
.subject-biology:hover {
  box-shadow: 0 0 45px rgba(0, 255, 120, 0.8);
}
.subject-coding:hover {
  box-shadow: 0 0 45px rgba(255, 255, 255, 0.9);
}
.subject-math {
  top: 10px;
  left: 100px;
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); /* vibrant blue */
}

.subject-math:hover {
  box-shadow: 0 0 45px rgba(147, 197, 253, 1); /* brighter blue on hover */
}


/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999 !important;
  background: rgba(10, 0, 40, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: #0f0025;
  padding: 40px;
  width: 600px;
  max-width: 90%;
  border-radius: 20px;
  color: white;
  text-align: center;
  z-index: 100000;
  box-shadow: 0 0 50px rgba(173, 100, 255, 0.6);
  position: relative;
}


.modal-icon {
  width: 60px;
  height: 60px;
  position: absolute;
  top: -30px;
  left: 20px;
  transform: rotate(-15deg);
  animation: floatIcon 4s ease-in-out infinite;
  opacity: 0.9;
  filter: drop-shadow(0 0 10px #c084fc);
}

@keyframes floatIcon {
  0%, 100% {
    transform: rotate(-15deg) translateY(0);
  }
  50% {
    transform: rotate(-15deg) translateY(-8px);
  }
}

.modal-content {
  position: relative;
  padding-top: 60px; /* leave room for floating icon */
}


.fun-fact {
  margin-top: 12px;
  color: #c084fc;
  font-style: italic;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 1.5rem;
  cursor: pointer;
  color: #fff;
}
.modal-learn-btn {
  margin-top: 20px;
  padding: 12px 28px;
  font-family: 'Unbounded', sans-serif;
  font-size: 1rem;
  border-radius: 30px;
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-learn-btn:hover {
  background: black;
  color: #c084fc;
  box-shadow: 0 0 20px rgba(192, 132, 252, 0.6);
  transform: scale(1.03);
}

</style>
