<template>
  <section class="aced-section" id="aced">
    <div class="left-content">
      <h1 class="headline">Начни своё обучение <br />уже сегодня</h1>
      <p class="context-text">Чтобы пройти курсы — войдите в систему</p>
      <button class="start-Login-btn" @click="triggerLogin">Начать обучение</button>
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
        <img src="@/assets/icons/physics1.png" class="subject-icon" />
        <h3>Физика</h3>
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
          image: new URL('@/assets/icons/physics2.png', import.meta.url).href,
          description: "Познай законы природы: от микрочастиц до звёзд и галактик.",
          funFact: "Одна чайная ложка нейтронной звезды весит как Эверест.",
          audience: "Тем, кто хочет понять, как работает Вселенная."
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
            window.dispatchEvent(new Event("open-Login-modal"));
          }, 600);
        } else {
          window.dispatchEvent(new Event("open-Login-modal"));
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
  gap: clamp(40px, 8vw, 60px);
  padding: clamp(40px, 8vw, 80px) clamp(20px, 5vw, 80px);
  background: radial-gradient(ellipse at center, #0a001a, #1a002f);
  flex-wrap: wrap;
  color: white;
  z-index: 1;
  min-height: 100vh;
}

.left-content {
  flex: 1;
  max-width: clamp(300px, 45vw, 460px);
  min-width: 280px;
}

.headline {
  font-size: clamp(2rem, 5vw, 2.7rem);
  font-family: 'Unbounded', sans-serif;
  background: linear-gradient(to right, #9333ea, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: clamp(15px, 3vw, 20px);
  line-height: 1.2;
}

.context-text {
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  font-family: 'Unbounded';
  color: #bfbfe5;
  margin-bottom: clamp(15px, 3vw, 20px);
}

.start-Login-btn {
  padding: clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 28px);
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  border-radius: 30px;
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  color: white;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.4s ease;
}

.start-Login-btn:hover {
  background: black;
  color: #c084fc;
  box-shadow: 0 0 20px rgba(192, 132, 252, 0.6);
  transform: scale(1.03);
}

.subjects-abstract-layout {
  position: relative;
  flex: 1;
  min-height: clamp(400px, 50vh, 480px);
  min-width: 300px;
}

.subject-card {
  position: absolute;
  width: clamp(200px, 25vw, 280px);
  height: clamp(140px, 18vw, 180px);
  padding: clamp(15px, 3vw, 25px);
  border-radius: clamp(15px, 3vw, 25px);
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
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  margin-top: clamp(8px, 2vw, 10px);
  font-family: 'Unbounded', sans-serif;
}

.subject-icon {
  width: clamp(40px, 8vw, 55px);
  height: clamp(40px, 8vw, 55px);
  margin-bottom: clamp(5px, 1.5vw, 8px);
}

/* Floating animation */
.floating {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Placement & glow - optimized for 5 subjects */
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
  right: clamp(50px, 15vw, 70px);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
}
.subject-math {
  top: 10px;
  left: clamp(60px, 15vw, 100px);
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
}
.subject-physics {
  top: clamp(100px, 25vh, 120px);
  right: clamp(150px, 35vw, 200px);
  box-shadow: 0 0 30px rgba(255, 100, 255, 0.6);
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
.subject-math:hover {
  box-shadow: 0 0 45px rgba(147, 197, 253, 1);
}
.subject-physics:hover {
  box-shadow: 0 0 45px rgba(255, 100, 255, 0.9);
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
  padding: clamp(25px, 5vw, 40px);
  width: clamp(300px, 85vw, 600px);
  max-width: 90%;
  border-radius: clamp(15px, 3vw, 20px);
  color: white;
  text-align: center;
  z-index: 100000;
  box-shadow: 0 0 50px rgba(173, 100, 255, 0.6);
  position: relative;
}

.modal-icon {
  width: clamp(45px, 10vw, 60px);
  height: clamp(45px, 10vw, 60px);
  position: absolute;
  top: clamp(-20px, -5vw, -30px);
  left: clamp(15px, 4vw, 20px);
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
  padding-top: clamp(45px, 10vw, 60px);
}

.modal-content h2 {
  font-size: clamp(1.3rem, 4vw, 1.8rem);
  margin-bottom: clamp(15px, 3vw, 20px);
}

.modal-content p {
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  line-height: 1.6;
  margin-bottom: clamp(10px, 2vw, 15px);
}

.fun-fact {
  margin-top: clamp(10px, 2.5vw, 12px);
  color: #c084fc;
  font-style: italic;
}

.close-btn {
  position: absolute;
  top: clamp(10px, 2.5vw, 15px);
  right: clamp(15px, 4vw, 20px);
  font-size: clamp(1.3rem, 3vw, 1.5rem);
  cursor: pointer;
  color: #fff;
}

/* Mobile specific styles */
@media (max-width: 768px) {
  .aced-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 20px;
    gap: 30px;
  }
  
  .left-content {
    max-width: 100%;
    margin-bottom: 20px;
  }
  
  .subjects-abstract-layout {
    width: 100%;
    min-height: 350px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 15px;
    position: relative;
  }
  
  .subject-card {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    width: 100%;
    height: 120px;
    margin: 0;
  }
  
  .subject-history {
    grid-column: 1;
    grid-row: 1;
  }
  
  .subject-biology {
    grid-column: 2;
    grid-row: 1;
  }
  
  .subject-coding {
    grid-column: 1;
    grid-row: 2;
  }
  
  .subject-math {
    grid-column: 2;
    grid-row: 2;
  }
  
  .subject-physics {
    grid-column: 1 / span 2;
    grid-row: 3;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .aced-section {
    padding: 30px 15px;
  }
  
  .subjects-abstract-layout {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(5, 1fr);
    gap: 12px;
    min-height: 420px;
  }
  
  .subject-card {
    height: 100px;
  }
  
  .subject-history {
    grid-column: 1;
    grid-row: 1;
  }
  
  .subject-biology {
    grid-column: 1;
    grid-row: 2;
  }
  
  .subject-coding {
    grid-column: 1;
    grid-row: 3;
  }
  
  .subject-math {
    grid-column: 1;
    grid-row: 4;
  }
  
  .subject-physics {
    grid-column: 1;
    grid-row: 5;
  }
}

/* Tablet styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .aced-section {
    padding: 60px 40px;
  }
  
  .subjects-abstract-layout {
    min-height: 450px;
  }
  
  .subject-card {
    width: 240px;
    height: 160px;
  }
}

/* Large screen styles */
@media (min-width: 1400px) {
  .aced-section {
    padding: 100px 80px;
    gap: 80px;
  }
  
  .headline {
    font-size: 3rem;
  }
  
  .subjects-abstract-layout {
    min-height: 520px;
  }
  
  .subject-card {
    width: 300px;
    height: 200px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .subject-card:hover {
    transform: none;
    box-shadow: 0 0 30px rgba(147, 51, 234, 0.5);
  }
  
  .subject-card:active {
    transform: scale(0.95);
  }
  
  .start-Login-btn:hover {
    transform: none;
  }
  
  .start-Login-btn:active {
    transform: scale(0.95);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .floating {
    animation: none;
  }
  
  .subject-card,
  .start-Login-btn {
    transition: none;
  }
  
  .subject-card:hover,
  .subject-card:active {
    transform: none;
  }
  
  .start-Login-btn:hover,
  .start-Login-btn:active {
    transform: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .aced-section {
    background: #000;
  }
  
  .subject-card {
    border: 2px solid rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.8);
  }
  
  .headline {
    -webkit-text-fill-color: #9333ea;
  }
}