<template>
  <section class="aced-section" id="aced">
    <div class="content-wrapper">
      <div class="left-content">
        <h1 class="headline">Начни своё обучение<br /><span>уже сегодня</span></h1>
        <p class="context-text">Чтобы получить доступ к курсам — войдите в систему или зарегистрируйтесь.</p>
        <button class="start-login-btn" @click="triggerLogin">Начать обучение</button>
      </div>

      <div class="subjects-abstract-layout">
        <div class="subject-card floating card-english" @click="showInfo('english')">
          <img src="@/assets/icons/english1.svg" class="subject-icon" />
          <h3>Английский</h3>
        </div>
        <div class="subject-card floating card-history" @click="showInfo('history')">
          <img src="@/assets/icons/history1.svg" class="subject-icon" />
          <h3>История</h3>
        </div>
        <div class="subject-card floating card-physics" @click="showInfo('physics')">
          <img src="@/assets/icons/physics1.png" class="subject-icon" />
          <h3>Физика</h3>
        </div>
        <div class="subject-card floating card-biology" @click="showInfo('biology')">
          <img src="@/assets/icons/biology1.svg" class="subject-icon" />
          <h3>Биология</h3>
        </div>
        <div class="subject-card floating card-coding" @click="showInfo('coding')">
          <img src="@/assets/icons/coding1.svg" class="subject-icon" />
          <h3>Кодинг</h3>
        </div>
        <div class="subject-card floating card-math" @click="showInfo('math')">
          <img src="@/assets/icons/math1.svg" class="subject-icon" />
          <h3>Математика</h3>
        </div>
      </div>
    </div>

    <div v-if="selectedSubject" class="modal-overlay" @click="selectedSubject = null">
      <div class="modal-content" @click.stop>
        <span class="close-btn" @click="selectedSubject = null">×</span>
        <img :src="modalInfo[selectedSubject].image" class="modal-icon" />
        <h2>{{ modalInfo[selectedSubject].label }}</h2>
        <p>{{ modalInfo[selectedSubject].description }}</p>
        <p class="fun-fact"><strong>Интересный факт:</strong> {{ modalInfo[selectedSubject].funFact }}</p>
        <p class="audience"><strong>Кому подойдёт:</strong> {{ modalInfo[selectedSubject].audience }}</p>
      </div>
    </div>
  </section>
</template>

<script>
import { getAuth } from "firebase/auth";

export default {
  name: "AcedSection",
  data() {
    return {
      selectedSubject: null,
      modalInfo: {
        english: { label: "Английский", image: new URL('@/assets/icons/english2.svg', import.meta.url).href, description: "Изучай язык международного общения, который открывает двери по всему миру.", funFact: "В английском языке больше всего слов — свыше 1 миллиона.", audience: "Путешественникам, будущим международным специалистам и любителям кино." },
        history: { label: "История", image: new URL('@/assets/icons/history2.svg', import.meta.url).href, description: "Изучи развитие человечества, цивилизаций и ключевых событий.", funFact: "История помогает предсказывать будущее, изучая прошлое.", audience: "Тем, кто интересуется обществом, культурой и прошлым." },
        physics: { label: "Физика", image: new URL('@/assets/icons/physics2.png', import.meta.url).href, description: "Познай законы природы: от микрочастиц до звёзд и галактик.", funFact: "Одна чайная ложка нейтронной звезды весит как Эверест.", audience: "Тем, кто хочет понять, как работает Вселенная." },
        biology: { label: "Биология", image: new URL('@/assets/icons/biology2.svg', import.meta.url).href, description: "Пойми, как устроена жизнь: от клетки до экосистемы.", funFact: "В твоем теле больше бактерий, чем собственных клеток.", audience: "Любителям природы, здоровья и науки о жизни." },
        coding: { label: "Кодинг", image: new URL('@/assets/icons/coding2.svg', import.meta.url).href, description: "Создавай сайты, игры и приложения с помощью программирования.", funFact: "Первая программистка была женщина — Ада Лавлейс.", audience: "Тем, кто хочет строить цифровое будущее." },
        math: { label: "Математика", image: new URL('@/assets/icons/math2.svg', import.meta.url).href, description: "Развивай логическое мышление и понимание мира через числа и формулы.", funFact: "Математика — универсальный язык Вселенной.", audience: "Тем, кто любит точность, закономерности и логику." }
      }
    };
  },
  methods: {
    triggerLogin() {
      const auth = getAuth();
      if (auth.currentUser) {
        this.$router.push("/profile/main");
      } else {
        window.dispatchEvent(new Event("open-Login-modal"));
      }
    },
    showInfo(subjectKey) {
      this.selectedSubject = subjectKey;
    }
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&display=swap");

.aced-section {
  padding: 80px 40px;
  background-color: #110d2e;
  font-family: 'Unbounded', sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.content-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4rem;
  flex-wrap: wrap;
  max-width: 1400px;
  width: 100%;
}
.left-content {
  flex: 1;
  max-width: 400px;
  min-width: 300px;
  z-index: 10; 
}
.headline {
  font-size: 2.8rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
  line-height: 1.3;
}
.headline span {
  background: linear-gradient(to right, #a855f7, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.context-text {
  font-size: 1.1rem;
  color: #a3a3c2;
  margin-bottom: 2rem;
  line-height: 1.6;
}
.start-login-btn {
  padding: 1rem 2.5rem;
  font-size: 1rem;
  border-radius: 99px;
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
}
.start-login-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
}

/* New Layout Container */
.subjects-abstract-layout {
  flex: 1.5;
  position: relative;
  min-height: 450px;
  min-width: 300px;
}
.subject-card {
  position: absolute;
  width: 220px;
  height: 200px; /* Slightly taller for a better feel */
  padding: 20px;
  border-radius: 1.5rem; /* More rounded corners */
  text-align: center;
  background: #191645;
  border: 1px solid #2c2c54;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
}
.subject-card:hover {
  background: #191645 !important;
  border-color: #7c3aed !important;
  transform: translateY(-8px) !important; /* Ensure transform works */
}
.subject-icon {
  width: 50px;
  height: 50px;
  margin-bottom: 1rem;
}
.subject-card h3 {
  font-size: 1.25rem;
  color: #fff;
  font-weight: 600;
}
.floating { 
  animation: float 8s ease-in-out infinite; 
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}

/* New Card Positions */
.card-english   { top: 5%; left: 35%; z-index: 3; animation-delay: -1s; }
.card-history   { top: 25%; right: 5%; z-index: 2; animation-delay: -3s; }
.card-physics   { bottom: 15%; right: 20%; z-index: 2; animation-delay: -5s; }
.card-biology   { top: 50%; left: 0%; z-index: 1; animation-delay: -4s; }
.card-coding    { bottom: 0%; left: 40%; z-index: 3; animation-delay: 0s; }
.card-math      { top: 20%; left: 5%; z-index: 2; animation-delay: -2s; }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 0, 24, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: #191645;
  border-radius: 1rem;
  padding: 2.5rem;
  width: 90%;
  max-width: 500px;
  text-align: center;
  border: 1px solid #7c3aed;
  box-shadow: 0 0 40px rgba(124, 58, 237, 0.5);
  position: relative;
  animation: modal-fade-in 0.3s ease-out;
  color: #fff;
}
@keyframes modal-fade-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.modal-icon {
  width: 60px;
  height: 60px;
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  filter: drop-shadow(0 0 10px #c084fc);
}
.modal-content h2 {
  font-size: 1.8rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}
.modal-content p {
  line-height: 1.6;
  margin-bottom: 1rem;
  color: #d1d5db;
}
.fun-fact, .audience {
  font-style: italic;
}
.fun-fact strong, .audience strong {
  color: #c084fc;
}
.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 1.5rem;
  cursor: pointer;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .content-wrapper {
    flex-direction: column;
    text-align: center;
  }
  .left-content {
    max-width: 100%;
  }
  .subjects-abstract-layout {
    width: 100%;
    max-width: 600px;
    margin-top: 2rem;
    min-height: 350px;
  }
  .subject-card {
      width: 180px;
      height: 160px;
  }
}

@media (max-width: 480px) {
    .subjects-abstract-layout {
        min-height: 450px;
    }
    .subject-card {
        width: 150px;
        height: 130px;
    }
}
</style>