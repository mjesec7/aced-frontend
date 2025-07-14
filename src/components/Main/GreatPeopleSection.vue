<template>
  <section class="great-people-section" ref="section">
    <div class="row-container">
      <h2 class="section-title">Великие умы, изменившие мир</h2>

      <!-- Row 1: left to right -->
      <div class="scroll-wrapper">
        <div class="scroll-row left-to-right infinite-loop" :class="{ 'paused': !isInView }">
          <div
            v-for="(person, index) in [...peopleRow1, ...peopleRow1, ...peopleRow1]"
            :key="'r1-' + index"
            class="person-card"
          >
            <div class="card-content">
              <h4>{{ person.name }}</h4>
              <p class="years">{{ person.years }}</p>
              <p class="impact">{{ person.impact }}</p>
              <p class="reason">{{ person.reason }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: right to left -->
      <div class="scroll-wrapper">
        <div class="scroll-row right-to-left infinite-loop" :class="{ 'paused': !isInView }">
          <div
            v-for="(person, index) in [...peopleRow2, ...peopleRow2, ...peopleRow2]"
            :key="'r2-' + index"
            class="person-card"
          >
            <div class="card-content">
              <h4>{{ person.name }}</h4>
              <p class="years">{{ person.years }}</p>
              <p class="impact">{{ person.impact }}</p>
              <p class="reason">{{ person.reason }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'GreatPeopleSection',
  data() {
    return {
      peopleRow1: [
          { name: 'Исаак Ньютон', years: '1643–1727', impact: 'Физика и математика', reason: 'Сформулировал законы движения и всемирного тяготения' },
          { name: 'Ада Лавлейс', years: '1815–1852', impact: 'Компьютерные науки', reason: 'Написала первый алгоритм для машины' },
          { name: 'Аль-Хорезми', years: 'ок. 780–850', impact: 'Алгебра', reason: 'Основатель алгебры, ввёл арабские цифры в Европу' },
          { name: 'Алан Тьюринг', years: '1912–1954', impact: 'ИИ и вычисления', reason: 'Создал концепцию машины Тьюринга' },
          { name: 'Ибн Сина (Авиценна)', years: '980–1037', impact: 'Медицина', reason: 'Автор «Канона врачебной науки»' },
          { name: 'Галилео Галилей', years: '1564–1642', impact: 'Астрономия', reason: 'Подтвердил гелиоцентризм с помощью телескопа' },
          { name: 'Аль-Фаргани', years: '800–870', impact: 'Астрономия', reason: 'Написал труд о небесных телах, повлиявший на Европу' },
          { name: 'Имам аль-Бухари', years: '810–870', impact: 'Хадисы и история', reason: 'Собрал самый авторитетный сборник хадисов' },
          { name: 'Никола Тесла', years: '1856–1943', impact: 'Электричество', reason: 'Открыл переменный ток и основы радиосвязи' }
        ],
        peopleRow2: [
          { name: 'Альберт Эйнштейн', years: '1879–1955', impact: 'Физика', reason: 'Создал теорию относительности' },
          { name: 'Мария Кюри', years: '1867–1934', impact: 'Радиоактивность', reason: 'Первая, кто получил две Нобелевские премии' },
          { name: 'Чарльз Дарвин', years: '1809–1882', impact: 'Биология', reason: 'Создал теорию эволюции' },
          { name: 'Карл Саган', years: '1934–1996', impact: 'Популяризация науки', reason: 'Создал цикл "Космос" и писал книги' },
          { name: 'Руми', years: '1207–1273', impact: 'Литература и духовность', reason: 'Его стихи до сих пор вдохновляют' },
          { name: 'Хеди Ламарр', years: '1914–2000', impact: 'Беспроводные технологии', reason: 'Изобрела частотные скачки — основа Bluetooth' },
          { name: 'Роза Паркс', years: '1913–2005', impact: 'Права человека', reason: 'Боролась с расовой дискриминацией в США' },
          { name: 'Ибн Хальдун', years: '1332–1406', impact: 'Социология и экономика', reason: 'Автор «Мукаддимы» — основа общественных наук' },
          { name: 'Гипатия Александрийская', years: 'ок. 360–415', impact: 'Математика и философия', reason: 'Одна из первых женщин-учёных' }
        ],
      isInView: false
    };
  },
  mounted() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        this.isInView = entry.isIntersecting;
      },
      {
        root: null,
        threshold: 0.1
      }
    );
    observer.observe(this.$refs.section);
  }
};
</script>

<style scoped>
.great-people-section {
  background: linear-gradient(to bottom, #0f172a, #1e1b4b, #2c2c54);
  padding: 80px 0;
  overflow-x: hidden;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  color: #e0e7ff;
  font-weight: bold;
  margin-bottom: 20px;
  font-family: 'Unbounded', sans-serif;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.6);
  padding: 0 20px;
}

.row-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.scroll-wrapper {
  overflow: visible;
  width: 100%;
  height: auto;
  padding: 40px 0;
  position: relative;
}

.scroll-row {
  display: flex;
  gap: 40px;
  white-space: nowrap;
  width: max-content;
  animation-duration: 120s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  will-change: transform;
}

.scroll-row.paused {
  animation-play-state: paused;
}

.left-to-right {
  animation-name: scrollLTR;
}

.right-to-left {
  animation-name: scrollRTL;
}

@keyframes scrollLTR {
  0% {
    transform: translateX(-33.33%);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes scrollRTL {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-33.33%);
  }
}

.person-card {
  min-width: 280px;
  max-width: 280px;
  height: auto;
  flex: 0 0 280px;
  background: #111827;
  border-radius: 20px;
  padding: 20px;
  transition: all 0.3s ease;
  font-family: 'Unbounded', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  position: relative;
  flex-direction: column;
}

.person-card::before {
  content: "";
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 25px;
  box-shadow: 0 0 40px 10px rgba(147, 51, 234, 0.4);
  z-index: -1;
}

.card-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: auto;
  width: 100%;
  overflow: visible;
}

.person-card:hover {
  transform: scale(1.05);
}

.person-card h4 {
  font-size: 1.2rem;
  color: #f9fafb;
  margin-bottom: 5px;
  white-space: normal;
}

.years,
.impact,
.reason {
  white-space: normal;
  overflow: hidden;
}

.years {
  font-size: 0.9rem;
  color: #cbd5e1;
  margin-bottom: 10px;
}

.impact {
  font-size: 1rem;
  color: #a78bfa;
  font-weight: 600;
}

.reason {
  font-size: 0.9rem;
  color: #d1d5db;
  margin-top: 6px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .great-people-section {
    padding: 60px 0;
  }
  
  .section-title {
    font-size: 1.5rem;
    padding: 0 15px;
  }
  
  .scroll-wrapper {
    padding: 30px 0;
  }
  
  .scroll-row {
    gap: 25px;
    animation-duration: 100s;
  }
  
  .person-card {
    min-width: 220px;
    max-width: 220px;
    flex: 0 0 220px;
    padding: 15px;
  }
  
  .person-card h4 {
    font-size: 1rem;
  }
  
  .years {
    font-size: 0.8rem;
  }
  
  .impact {
    font-size: 0.9rem;
  }
  
  .reason {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .great-people-section {
    padding: 40px 0;
  }
  
  .section-title {
    font-size: 1.2rem;
    padding: 0 10px;
  }
  
  .scroll-wrapper {
    padding: 20px 0;
  }
  
  .scroll-row {
    gap: 20px;
    animation-duration: 80s;
  }
  
  .person-card {
    min-width: 180px;
    max-width: 180px;
    flex: 0 0 180px;
    padding: 12px;
    border-radius: 15px;
  }
  
  .person-card::before {
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 20px;
  }
  
  .person-card h4 {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
  
  .years {
    font-size: 0.7rem;
    margin-bottom: 8px;
  }
  
  .impact {
    font-size: 0.8rem;
  }
  
  .reason {
    font-size: 0.7rem;
    margin-top: 4px;
  }
}

@media (max-width: 320px) {
  .person-card {
    min-width: 160px;
    max-width: 160px;
    flex: 0 0 160px;
    padding: 10px;
  }
  
  .person-card h4 {
    font-size: 0.8rem;
  }
  
  .years,
  .reason {
    font-size: 0.65rem;
  }
  
  .impact {
    font-size: 0.75rem;
  }
}
</style>