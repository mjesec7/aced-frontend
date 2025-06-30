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
      <div class="subject-card subject-physics floating" @click="showInfo('physics')">
        <img src="@/assets/icons/physics1.svg" class="subject-icon" />
        <h3>Физика</h3>
      </div>
      <div class="subject-card subject-chemistry floating" @click="showInfo('chemistry')">
        <img src="@/assets/icons/chemistry1.svg" class="subject-icon" />
        <h3>Химия</h3>
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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "vue-router";

export default {
  name: "AcedSection",
  data() {
    return {
      selectedSubject: null,
      modalInfo: {
        history: {
          label: "История",
          image: new URL('@/assets/icons/history2.svg', import.meta.url).href,
          description: "Изучи развитие человечества, цивилизаций и ключевых событий.",
          funFact: "История помогает предсказывать будущее, изучая прошлое.",
          audience: "Тем, кто интересуется обществом, культурой и прошлым."
        },
        biology: {
          label: "Биология",
          image: new URL('@/assets/icons/biology2.svg', import.meta.url).href,
          description: "Пойми, как устроена жизнь: от клетки до экосистемы.",
          funFact: "В твоем теле больше бактерий, чем собственных клеток.",
          audience: "Любителям природы, здоровья и науки о жизни."
        },
        coding: {
          label: "Кодинг",
          image: new URL('@/assets/icons/coding2.svg', import.meta.url).href,
          description: "Создавай сайты, игры и приложения с помощью программирования.",
          funFact: "Первая программистка была женщина — Ада Лавлейс.",
          audience: "Тем, кто хочет строить цифровое будущее."
        },
        math: {
          label: "Математика",
          image: new URL('@/assets/icons/math2.svg', import.meta.url).href,
          description: "Развивай логическое мышление и понимание мира через числа и формулы.",
          funFact: "Математика — универсальный язык Вселенной.",
          audience: "Тем, кто любит точность, закономерности и логику."
        },
        physics: {
          label: "Физика",
          image: new URL('@/assets/icons/physics2.svg', import.meta.url).href,
          description: "Открой законы Вселенной: от атомов до галактик.",
          funFact: "Скорость света — самая быстрая скорость во Вселенной.",
          audience: "Тем, кто хочет понять, как работает мир вокруг нас."
        },
        chemistry: {
          label: "Химия",
          image: new URL('@/assets/icons/chemistry2.svg', import.meta.url).href,
          description: "Изучи взаимодействие веществ и создавай новые материалы.",
          funFact: "Твое тело на 99% состоит всего из 6 химических элементов.",
          audience: "Тем, кто любит эксперименты и понимание природы веществ."
        }
      }
    };
  },
  methods: {
    triggerLogin() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        this.$router.push("/profile/main");
      } else {
        const hero = document.getElementById("hero");
        if (hero) {
          hero.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => {
            window.dispatchEvent(new Event("open-login-modal"));
          }, 600);
        } else {
          window.dispatchEvent(new Event("open-login-modal"));
        }
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
  min-height: 100vh;
}

.left-content {
  flex: 1;
  max-width: 460px;
  min-width: 300px;
}

.headline {
  font-size: 2.7rem;
  font-family: 'Unbounded', sans-serif;
  background: linear-gradient(to right, #9333ea, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
  line-height: 1.2;
}

.context-text {
  font-size: 1rem;
  font-family: 'Unbounded';
  color: #bfbfe5;
  margin-bottom: 20px;
  line-height: 1.5;
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
  white-space: nowrap;
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
  min-height: 500px;
  width: 100%;
  max-width: 700px;
}

.subject-card {
  position: absolute;
  width: 260px;
  height: 160px;
  padding: 20px;
  border-radius: 20px;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.subject-card h3 {
  font-size: 1.2rem;
  margin-top: 8px;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
}

.subject-icon {
  width: 50px;
  height: 50px;
  margin-bottom: 5px;
}

/* Floating animation */
.floating {
  animation: float 6s ease-in-out infinite;
}

.floating:nth-child(2) { animation-delay: -1s; }
.floating:nth-child(3) { animation-delay: -2s; }
.floating:nth-child(4) { animation-delay: -3s; }
.floating:nth-child(5) { animation-delay: -4s; }
.floating:nth-child(6) { animation-delay: -5s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Desktop positioning */
.subject-history {
  top: 0;
  right: 0;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
}

.subject-biology {
  bottom: 80px;
  left: 0;
  box-shadow: 0 0 25px rgba(34, 197, 94, 0.5);
}

.subject-coding {
  bottom: 0;
  right: 80px;
  box-shadow: 0 0 25px rgba(168, 85, 247, 0.5);
}

.subject-math {
  top: 40px;
  left: 120px;
  box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
}

.subject-physics {
  top: 120px;
  right: 150px;
  box-shadow: 0 0 25px rgba(239, 68, 68, 0.5);
}

.subject-chemistry {
  bottom: 40px;
  left: 200px;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);
}

/* Hover effects */
.subject-history:hover { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
.subject-biology:hover { box-shadow: 0 0 40px rgba(34, 197, 94, 0.8); }
.subject-coding:hover { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8); }
.subject-math:hover { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
.subject-physics:hover { box-shadow: 0 0 40px rgba(239, 68, 68, 0.8); }
.subject-chemistry:hover { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8); }

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
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  background: #0f0025;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  border-radius: 20px;
  color: white;
  text-align: center;
  z-index: 100000;
  box-shadow: 0 0 50px rgba(173, 100, 255, 0.6);
  position: relative;
  margin: 20px;
  overflow-y: auto;
  max-height: 90vh;
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
  padding-top: 60px;
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
  z-index: 100001;
}

/* Tablet Styles */
@media (max-width: 1024px) and (min-width: 769px) {
  .aced-section {
    padding: 60px 40px;
    gap: 40px;
    flex-direction: column;
    align-items: center;
  }

  .left-content {
    max-width: 100%;
    text-align: center;
    margin-bottom: 40px;
  }

  .headline {
    font-size: 2.2rem;
  }

  .subjects-abstract-layout {
    min-height: 400px;
    max-width: 600px;
  }

  .subject-card {
    width: 220px;
    height: 140px;
  }

  .subject-history { top: 0; right: 40px; }
  .subject-biology { bottom: 60px; left: 40px; }
  .subject-coding { bottom: 0; right: 60px; }
  .subject-math { top: 60px; left: 80px; }
  .subject-physics { top: 100px; right: 120px; }
  .subject-chemistry { bottom: 20px; left: 160px; }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .aced-section {
    padding: 40px 20px;
    gap: 30px;
    flex-direction: column;
    align-items: center;
    min-height: auto;
  }

  .left-content {
    max-width: 100%;
    text-align: center;
    margin-bottom: 30px;
  }

  .headline {
    font-size: 1.8rem;
    margin-bottom: 15px;
  }

  .context-text {
    font-size: 0.9rem;
    margin-bottom: 15px;
  }

  .start-login-btn {
    padding: 10px 24px;
    font-size: 0.9rem;
  }

  .subjects-abstract-layout {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    min-height: auto;
    max-width: 100%;
    width: 100%;
  }

  .subject-card {
    position: static;
    width: 100%;
    height: 120px;
    margin: 0;
    padding: 15px;
    border-radius: 15px;
  }

  .subject-card h3 {
    font-size: 1rem;
    margin-top: 5px;
  }

  .subject-icon {
    width: 40px;
    height: 40px;
  }

  .modal-content {
    padding: 30px 20px;
    margin: 10px;
  }

  .modal-icon {
    width: 50px;
    height: 50px;
    top: -25px;
    left: 15px;
  }

  .modal-content h2 {
    font-size: 1.5rem;
  }

  .modal-content p {
    font-size: 0.9rem;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .aced-section {
    padding: 30px 15px;
  }

  .headline {
    font-size: 1.6rem;
    line-height: 1.3;
  }

  .subjects-abstract-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .subject-card {
    height: 100px;
    padding: 12px;
  }

  .subject-card h3 {
    font-size: 0.9rem;
  }

  .subject-icon {
    width: 35px;
    height: 35px;
  }

  .modal-content {
    padding: 25px 15px;
    max-height: 85vh;
  }

  .modal-content h2 {
    font-size: 1.3rem;
  }

  .modal-content p {
    font-size: 0.85rem;
    line-height: 1.4;
  }
}
</style>